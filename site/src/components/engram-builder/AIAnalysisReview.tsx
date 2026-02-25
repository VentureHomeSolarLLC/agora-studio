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
        <p className="text-gray-500">Extracting structure, suggesting improvements</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">AI Analysis</h2>
        <p className="text-gray-500">Click analyze to process your content with GPT-4.</p>
        <button onClick={onAnalyze} className="bg-gray-900 text-white px-6 py-3 rounded-lg">Analyze Content</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">AI Analysis Results</h2>

      {/* CUSTOMER CONTENT */}
      {data.contentType === 'customer' && (
        <>
          {analysis.readability && (
            <div className="bg-purple-50 border border-purple-200 rounded p-4">
              <h3 className="font-medium text-purple-900">Readability: {analysis.readability.gradeLevel} level (Score: {analysis.readability.score}/10)</h3>
              {analysis.readability.issues?.map((issue: string, i: number) => (
                <p key={i} className="text-sm text-purple-700">• {issue}</p>
              ))}
            </div>
          )}

          {analysis.tone?.suggestedEdit && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h3 className="font-medium text-yellow-900 mb-2">Suggested Edit (Friendlier Tone)</h3>
              <p className="text-sm mb-2">{analysis.tone.suggestedEdit.substring(0, 200)}...</p>
              <button onClick={() => onChange({ rawContent: analysis.tone.suggestedEdit })} className="text-xs px-3 py-1 bg-yellow-200 rounded">Apply Edit</button>
            </div>
          )}

          {analysis.missingContent?.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded p-4">
              <h3 className="font-medium text-orange-900">Missing Content</h3>
              <ul className="list-disc list-inside text-sm">
                {analysis.missingContent.map((item: string, i: number) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          )}
        </>
      )}

      {/* INTERNAL CONTENT */}
      {data.contentType === 'internal' && analysis.missingContent?.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded p-4">
          <h3 className="font-medium text-orange-900">Missing Content</h3>
          <ul className="list-disc list-inside text-sm">
            {analysis.missingContent.map((item: string, i: number) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}

      {/* AGENT INSTRUCTIONS */}
      {data.contentType === 'agent' && (
        <>
          {analysis.searchability && (
            <div className="bg-indigo-50 border border-indigo-200 rounded p-4">
              <h3 className="font-medium text-indigo-900">Searchability Score: {analysis.searchability.score}/10</h3>
              {analysis.searchability.improvements?.map((imp: string, i: number) => (
                <p key={i} className="text-sm text-indigo-700">• {imp}</p>
              ))}
            </div>
          )}

          {analysis.missingContent?.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded p-4">
              <h3 className="font-medium text-orange-900">Missing Content</h3>
              <ul className="list-disc list-inside text-sm">
                {analysis.missingContent.map((item: string, i: number) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          )}

          {analysis.suggestedEdit && (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h3 className="font-medium text-green-900 mb-2">AI-Optimized Version</h3>
              <div className="bg-white p-2 rounded text-sm max-h-40 overflow-y-auto mb-2">
                {analysis.suggestedEdit.substring(0, 300)}...
              </div>
              <button onClick={() => onChange({ rawContent: analysis.suggestedEdit })} className="text-xs px-3 py-1 bg-green-200 rounded">Apply Rewrite</button>
            </div>
          )}
        </>
      )}

      {/* SUGGESTED TAGS - All Types */}
      {analysis.suggestedTags?.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <h3 className="font-medium text-green-900">Suggested Tags</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.suggestedTags.map((tag: string, i: number) => (
              <span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">{tag}</span>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={onContinue} className="bg-gray-900 text-white px-6 py-3 rounded-lg">Continue</button>
      </div>
    </div>
  );
}
