import { EngramFormData, CATEGORIES, TAG_SUGGESTIONS, ContentType, CONTENT_TYPE_CONFIG } from '@/types/engram';

interface BasicInfoFormProps {
  data: EngramFormData;
  onChange: (updates: Partial<EngramFormData>) => void;
  contentType: ContentType;
}

export function BasicInfoForm({ data, onChange, contentType }: BasicInfoFormProps) {
  const config = CONTENT_TYPE_CONFIG[contentType];
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Basic Information</h2>
        <p className="text-gray-500">{config.promptTitle}</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={config.promptTitle}
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
          placeholder="Brief description..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {data.tags?.map((tag, index) => (
            <span key={index} className="px-3 py-1 bg-[#F7FF96] text-gray-900 rounded-full text-sm flex items-center gap-2">
              {tag}
              <button
                onClick={() => onChange({ tags: data.tags?.filter((_, i) => i !== index) })}
                className="hover:text-red-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Type tag and press Enter"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const input = e.target as HTMLInputElement;
              const value = input.value.trim();
              if (value && !data.tags?.includes(value)) {
                onChange({ tags: [...(data.tags || []), value] });
                input.value = '';
              }
            }
          }}
        />
        <p className="text-xs text-gray-400 mt-1">Press Enter to add tags. Suggested: {config.defaultTags.join(', ')}</p>
      </div>
    </div>
  );
}
