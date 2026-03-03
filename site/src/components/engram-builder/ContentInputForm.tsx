import { EngramFormData, CONTENT_TYPE_CONFIG } from '@/types/engram';

interface ContentInputFormProps {
  data: EngramFormData;
  onChange: (updates: Partial<EngramFormData>) => void;
  contentType: 'customer' | 'internal' | 'agent';
}

export function ContentInputForm({ data, onChange, contentType }: ContentInputFormProps) {
  const config = CONTENT_TYPE_CONFIG[contentType];
  const isAgent = contentType === 'agent';
  const importMode = data.agentImportMode || 'notes';
  
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

      {isAgent && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Skill Source</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onChange({ agentImportMode: 'notes' })}
              className={`px-4 py-3 rounded-lg border text-sm font-medium ${
                importMode === 'notes'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              Draft new skill
            </button>
            <button
              type="button"
              onClick={() => onChange({ agentImportMode: 'monolith' })}
              className={`px-4 py-3 rounded-lg border text-sm font-medium ${
                importMode === 'monolith'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              Import existing SKILL.md
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {importMode === 'monolith'
              ? 'Paste a full SKILL.md file and we will split it into Engram-ready concepts and lessons.'
              : 'Start with rough notes and we will build a new Engram skill from scratch.'}
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">
          Content <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.rawContent}
          onChange={(e) => onChange({ rawContent: e.target.value })}
          placeholder={
            isAgent && importMode === 'monolith'
              ? 'Paste the full SKILL.md content here (including any headings or YAML).'
              : "Paste your content here. Don't worry about formatting - the AI will structure it."
          }
          rows={12}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
        />
        <p className="text-sm text-gray-400 mt-2">
          Tip: {contentType === 'agent' 
            ? (importMode === 'monolith'
              ? 'Include the full skill content — we will detect concepts, lessons, and where they belong.'
              : 'Use bullet points or numbered steps if you have them.')
            : contentType === 'customer'
            ? 'Write naturally, like you are explaining to a friend.'
            : 'Include all technical details, edge cases, and gotchas.'}
        </p>
      </div>
    </div>
  );
}
