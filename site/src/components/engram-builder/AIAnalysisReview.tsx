import { EngramFormData } from '@/types/engram';

interface AIAnalysisReviewProps {
  data: EngramFormData;
  onChange: (updates: Partial<EngramFormData>) => void;
  onContinue: () => void;
}

export function AIAnalysisReview({ data, onChange, onContinue }: AIAnalysisReviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">AI Analysis</h2>
        <p className="text-gray-500">Review what the AI extracted from your content.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Extracted Structure</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-blue-700 font-medium">Title:</span> {data.title || 'Not detected'}
          </div>
          <div>
            <span className="text-blue-700 font-medium">Type:</span> {data.contentType}
          </div>
          <div>
            <span className="text-blue-700 font-medium">Steps/sections:</span> {data.skill.steps.length}
          </div>
          <div>
            <span className="text-blue-700 font-medium">Suggested tags:</span> {data.tags?.join(', ')}
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-3">Extracted Steps</h3>
        {data.skill.steps.length === 0 ? (
          <p className="text-gray-400">No steps detected. You can add them manually in the next step.</p>
        ) : (
          <div className="space-y-3">
            {data.skill.steps.map((step, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-500">Step {index + 1}</span>
                  <select
                    value={step.type}
                    onChange={(e) => {
                      const newSteps = [...data.skill.steps];
                      newSteps[index] = { ...step, type: e.target.value as any };
                      onChange({ skill: { ...data.skill, steps: newSteps } });
                    }}
                    className="text-xs border rounded px-2 py-1"
                  >
                    <option value="text">Text</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="decision">Decision</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={step.title}
                  onChange={(e) => {
                    const newSteps = [...data.skill.steps];
                    newSteps[index] = { ...step, title: e.target.value };
                    onChange({ skill: { ...data.skill, steps: newSteps } });
                  }}
                  className="w-full px-3 py-2 border rounded text-sm mb-2"
                  placeholder="Step title"
                />
                <textarea
                  value={step.content}
                  onChange={(e) => {
                    const newSteps = [...data.skill.steps];
                    newSteps[index] = { ...step, content: e.target.value };
                    onChange({ skill: { ...data.skill, steps: newSteps } });
                  }}
                  rows={2}
                  className="w-full px-3 py-2 border rounded text-sm"
                  placeholder="Step content"
                />
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => {
            const newSteps = [...data.skill.steps, { title: '', content: '', type: 'text' as const }];
            onChange({ skill: { ...data.skill, steps: newSteps } });
          }}
          className="mt-3 text-sm px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          + Add Step
        </button>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onContinue}
          className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800"
        >
          Continue to Metadata
        </button>
      </div>
    </div>
  );
}
