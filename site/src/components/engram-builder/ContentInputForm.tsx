import { EngramFormData, CONTENT_TYPE_CONFIG } from '@/types/engram';

interface ContentInputFormProps {
  data: EngramFormData;
  onChange: (updates: Partial<EngramFormData>) => void;
  contentType: 'customer' | 'internal' | 'agent';
}

export function ContentInputForm({ data, onChange, contentType }: ContentInputFormProps) {
  const config = CONTENT_TYPE_CONFIG[contentType];
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">{config.label} Content</h2>
        <p className="text-gray-500">{config.promptContent}</p>
        {data.title && (
          <p className="text-sm text-gray-400 mt-2">
            Title: <span className="text-gray-600">{data.title}</span>
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Content <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.rawContent}
          onChange={(e) => onChange({ rawContent: e.target.value })}
          placeholder="Paste your content here. Don't worry about formatting - the AI will structure it."
          rows={12}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
        />
        <p className="text-sm text-gray-400 mt-2">
          Tip: {contentType === 'agent' 
            ? 'Use bullet points or numbered steps if you have them.'
            : contentType === 'customer'
            ? 'Write naturally, like you are explaining to a friend.'
            : 'Include all technical details, edge cases, and gotchas.'}
        </p>
      </div>
    </div>
  );
}
