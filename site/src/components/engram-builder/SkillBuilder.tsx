import { SkillInput, SkillStep } from '@/types/engram';

interface SkillBuilderProps {
  data: SkillInput;
  onChange: (data: SkillInput) => void;
}

export function SkillBuilder({ data, onChange }: SkillBuilderProps) {
  const updateStep = (index: number, updates: Partial<SkillStep>) => {
    const newSteps = [...data.steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    onChange({ ...data, steps: newSteps });
  };

  const addStep = () => {
    onChange({
      ...data,
      steps: [...data.steps, { title: '', content: '', type: 'text' }],
    });
  };

  const removeStep = (index: number) => {
    onChange({ ...data, steps: data.steps.filter((_, i) => i !== index) });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === data.steps.length - 1) return;
    const newSteps = [...data.steps];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    onChange({ ...data, steps: newSteps });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Skill Steps</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Difficulty</label>
          <select
            value={data.difficulty || 'intermediate'}
            onChange={(e) => onChange({ ...data, difficulty: e.target.value as any })}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Time Estimate</label>
          <input
            type="text"
            value={data.time_estimate || ''}
            onChange={(e) => onChange({ ...data, time_estimate: e.target.value })}
            placeholder="e.g., 15-20 minutes"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Prerequisites</label>
        <input
          type="text"
          value={data.prerequisites?.join(', ') || ''}
          onChange={(e) => onChange({ ...data, prerequisites: e.target.value.split(',').map(p => p.trim()).filter(Boolean) })}
          placeholder="e.g., Signed contract, System design"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">Steps <span className="text-red-500">*</span></label>
          <button onClick={addStep} className="text-sm px-3 py-1 bg-[#F7FF96] text-gray-900 rounded-lg font-medium">+ Add Step</button>
        </div>

        {data.steps.length === 0 && <p className="text-gray-400 text-sm">No steps yet. Click "Add Step" to start.</p>}

        {data.steps.map((step, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Step {index + 1}</span>
              <div className="flex gap-2">
                <button onClick={() => moveStep(index, 'up')} disabled={index === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">↑</button>
                <button onClick={() => moveStep(index, 'down')} disabled={index === data.steps.length - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">↓</button>
                <button onClick={() => removeStep(index)} className="p-1 hover:bg-red-100 text-red-600 rounded">×</button>
              </div>
            </div>
            <input
              type="text"
              value={step.title}
              onChange={(e) => updateStep(index, { title: e.target.value })}
              placeholder="Step title"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 font-medium"
            />
            <textarea
              value={step.content}
              onChange={(e) => updateStep(index, { content: e.target.value })}
              placeholder="Step instructions..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-200"
            />
            <div className="flex gap-4 text-sm">
              {['text', 'checkbox', 'decision'].map((type) => (
                <label key={type} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`step-type-${index}`}
                    checked={step.type === type}
                    onChange={() => updateStep(index, { type: type as any })}
                    className="w-4 h-4"
                  />
                  <span className="capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
