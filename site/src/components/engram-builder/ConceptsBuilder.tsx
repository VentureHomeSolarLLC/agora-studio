import { ConceptInput } from '@/types/engram';

interface ConceptsBuilderProps {
  data: ConceptInput[];
  onChange: (data: ConceptInput[]) => void;
}

export function ConceptsBuilder({ data, onChange }: ConceptsBuilderProps) {
  const addConcept = () => {
    onChange([...data, { title: '', content: '', tags: [] }]);
  };

  const updateConcept = (index: number, updates: Partial<ConceptInput>) => {
    const newConcepts = [...data];
    newConcepts[index] = { ...newConcepts[index], ...updates };
    onChange(newConcepts);
  };

  const removeConcept = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Concepts</h2>
        <button onClick={addConcept} className="text-sm px-3 py-1 bg-[#F7FF96] text-gray-900 rounded-lg font-medium">+ Add Concept</button>
      </div>

      <p className="text-sm text-gray-500">
        Concepts are reference material that support the skill. They provide additional context
        and detailed information for specific topics.
      </p>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
          No concepts yet. Click "Add Concept" to add reference material.
        </div>
      )}

      {data.map((concept, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Concept {index + 1}</span>
            <button onClick={() => removeConcept(index)} className="p-1 hover:bg-red-100 text-red-600 rounded">×</button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={concept.title}
              onChange={(e) => updateConcept(index, { title: e.target.value })}
              placeholder="e.g., Credit Requirements"
              className="w-full px-4 py-2 rounded-lg border border-gray-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              value={concept.content}
              onChange={(e) => updateConcept(index, { content: e.target.value })}
              placeholder="Detailed explanation of this concept..."
              rows={5}
              className="w-full px-4 py-2 rounded-lg border border-gray-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags (optional)</label>
            <input
              type="text"
              value={concept.tags?.join(', ') || ''}
              onChange={(e) => updateConcept(index, { tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              placeholder="e.g., credit, fico"
              className="w-full px-4 py-2 rounded-lg border border-gray-200"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
