import { ContentType, CONTENT_TYPE_CONFIG } from '@/types/engram';

interface ContentTypeSelectorProps {
  selected: ContentType | null;
  onChange: (type: ContentType) => void;
}

export function ContentTypeSelector({ selected, onChange }: ContentTypeSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">What are you creating?</h2>
        <p className="text-gray-500">Select the type of content. This determines how we optimize it.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {(Object.keys(CONTENT_TYPE_CONFIG) as ContentType[]).map((type) => {
          const config = CONTENT_TYPE_CONFIG[type];
          const isSelected = selected === type;

          return (
            <button
              key={type}
              onClick={() => onChange(type)}
              className={`text-left p-6 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-[#F7FF96] bg-[#F7FF96]/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-[#231F20] bg-[#231F20]' : 'border-gray-300'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{config.label}</h3>
                  <p className="text-gray-500 text-sm">{config.description}</p>
                  {isSelected && (
                    <div className="mt-3 text-sm text-[#231F20]">
                      <span className="font-medium">Optimizes for:</span> {config.audience.join(', ')} • {config.outputPath}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
