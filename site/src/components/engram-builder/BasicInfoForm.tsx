import { EngramFormData, ContentType, CONTENT_TYPE_CONFIG } from '@/types/engram';

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
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={data.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Brief description..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
        />
      </div>
    </div>
  );
}
