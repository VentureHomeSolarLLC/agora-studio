import { EngramFormData, CONTENT_TYPE_CONFIG } from '@/types/engram';

interface AIAnalysisReviewProps {
  data: EngramFormData;
  onChange: (updates: Partial<EngramFormData>) => void;
  onAnalyze: () => void;
  onContinue: () => void;
  isAnalyzing: boolean;
}

export function AIAnalysisReview({ data, onChange, onAnalyze, onContinue, isAnalyzing }: AIAnalysisReviewProps) {
  const config = CONTENT_TYPE_CONFIG[data.contentType];
  const analysis = data.aiAnalysis;

  if (isAnalyzing) {
    return (
      <div className="space-y-6 text-center py-12">
        <div className="w-16 h-16 border-4 border-[#F7FF96] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-xl font-semibold">AI is analyzing your content...</h2>
        <p className="text-gray-500">Extracting structure, suggesting improvements, finding related topics</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">AI Analysis</h2>
        <p className="text-gray-500">Click analyze to process your {config.label.toLowerCase()} with GPT-4.</p>
        <button
          onClick={onAnalyze}
          className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800"
        >
          Analyze Content
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">AI Analysis Complete</h2>
        <p className="text-gray-500">Review what GPT-4 extracted from your content.</p>
      </div>

      {data.contentType === 'customer' && analysis && (
        <div className="space-y-4">
          {analysis.keyPoints && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Key Points</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                {analysis.keyPoints.map((point: string, i: number) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}
          
          {analysis.clarity && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-900 mb-2">
                Clarity Score: {analysis.clarity.score}/10
              </h3>
              {analysis.clarity.improvements?.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium mb-1">Suggestions:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.clarity.improvements.map((imp: string, i: number) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {analysis.warnings && analysis.warnings.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-900 mb-2">Warnings</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                {analysis.warnings.map((warning: string, i: number) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {data.contentType === 'internal' && analysis && (
        <div className="space-y-4">
          {analysis.sections && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Extracted Sections ({analysis.sections.length})</h3>
              <div className="space-y-2">
                {analysis.sections.map((section: any, i: number) => (
                  <div key={i} className="text-sm border-b border-blue-200 last:border-0 pb-2">
                    <span className="font-medium">{section.title}</span>
                    <span className="text-xs text-gray-500 ml-2">({section.importance})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.edgeCases && analysis.edgeCases.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-900 mb-2">Edge Cases</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                {analysis.edgeCases.map((edge: string, i: number) => (
                  <li key={i}>{edge}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {data.contentType === 'agent' && analysis && (
        <div className="space-y-4">
          {analysis.steps && (
            <div>
              <h3 className="font-medium mb-2">Extracted Steps ({analysis.steps.length})</h3>
              <div className="space-y-2">
                {analysis.steps.map((step: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-500">Step {index + 1}</span>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded">{step.type}</span>
                    </div>
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{step.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.prerequisites && analysis.prerequisites.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Prerequisites</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                {analysis.prerequisites.map((pre: string, i: number) => (
                  <li key={i}>{pre}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.risks && analysis.risks.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-900 mb-2">Risks</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                {analysis.risks.map((risk: string, i: number) => (
                  <li key={i}>{risk}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {analysis.suggestedTags && analysis.suggestedTags.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-900 mb-2">AI Suggested Tags</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.suggestedTags.map((tag: string, i: number) => (
              <span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

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
