import { EngramFormData, CATEGORIES, TAG_SUGGESTIONS } from '@/types/engram';

interface BasicInfoFormProps {
  data: EngramFormData;
  onChange: (updates: Partial<EngramFormData>) => void;
}

export function BasicInfoForm({ data, onChange }: BasicInfoFormProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

      <div>
        <label className="block text-sm font-medium mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g., Enfin TPO Financing"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          value={data.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={data.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Brief description of what this engram covers..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Tags</label>
        <input
          type="text"
          value={data.tags?.join(', ') || ''}
          onChange={(e) => onChange({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
          placeholder="e.g., credit, fico, tpo (comma-separated)"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {TAG_SUGGESTIONS.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                const current = data.tags || [];
                if (!current.includes(tag)) onChange({ tags: [...current, tag] });
              }}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600"
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Audience</label>
        <div className="flex gap-4">
          {['agent', 'customer'].map((audience) => (
            <label key={audience} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={data.audience?.includes(audience as any) || false}
                onChange={(e) => {
                  const current = data.audience || [];
                  if (e.target.checked) onChange({ audience: [...current, audience as any] });
                  else onChange({ audience: current.filter(a => a !== audience) });
                }}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="capitalize">{audience}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
