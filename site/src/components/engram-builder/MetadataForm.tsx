import { EngramFormData, CATEGORIES } from '@/types/engram';

interface MetadataFormProps {
  data: EngramFormData;
  onChange: (updates: Partial<EngramFormData>) => void;
}

export function MetadataForm({ data, onChange }: MetadataFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Metadata</h2>
        <p className="text-gray-500">Add final details before publishing to the Agora Library.</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          value={data.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border border-gray-200"
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {data.tags?.map((tag, index) => (
            <span key={index} className="px-3 py-1 bg-[#F7FF96] text-gray-900 rounded-full text-sm flex items-center gap-2">
              {tag}
              <button onClick={() => onChange({ tags: data.tags?.filter((_, i) => i !== index) })} className="hover:text-red-600">×</button>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Type tag and press Enter"
          className="w-full px-4 py-3 rounded-lg border border-gray-200"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const value = (e.target as HTMLInputElement).value.trim();
              if (value && !data.tags?.includes(value)) {
                onChange({ tags: [...(data.tags || []), value] });
                (e.target as HTMLInputElement).value = '';
              }
            }
          }}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">📚 Contributing to Agora Library</h3>
        <p className="text-sm text-blue-800">
          This content will be added to the Venture Home knowledge base and may be used to train AI agents 
          and help future team members. Thank you for contributing!
        </p>
      </div>
    </div>
  );
}
