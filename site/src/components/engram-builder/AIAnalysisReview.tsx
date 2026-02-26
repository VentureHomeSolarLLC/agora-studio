'use client';
import { useState } from 'react';
import { EngramFormData, CONTENT_TYPE_CONFIG } from '@/types/engram';

interface AIAnalysisReviewProps {
  data: EngramFormData;
  onChange: (updates: Partial<EngramFormData>) => void;
  onAnalyze: () => void;
  onContinue: () => void;
  isAnalyzing: boolean;
  duplicateCheck?: any;
}

export function AIAnalysisReview({ data, onChange, onAnalyze, onContinue, isAnalyzing, duplicateCheck }: AIAnalysisReviewProps) {
  const config = CONTENT_TYPE_CONFIG[data.contentType];
  const analysis = data.aiAnalysis;
  
  const [editedAfter, setEditedAfter] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [applied, setApplied] = useState(false);

  if (isAnalyzing) {
    return (
      <div className="space-y-6 text-center py-12">
        <div className="w-16 h-16 border-4 border-[#F7FF96] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-xl font-semibold">AI is analyzing...</h2>
        <p className="text-gray-500">Checking your content library for duplicates, extracting structure, suggesting improvements</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">AI Analysis</h2>
        {duplicateCheck?.similar && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-yellow-900 mb-2">⚠️ Similar Content Found</h3>
            <p className="text-sm text-yellow-800 mb-2">
              This appears similar to: <strong>{duplicateCheck.matchTitle}</strong>
            </p>
            <p className="text-sm text-yellow-700 mb-3">
              Similarity: {duplicateCheck.similarity}% - Consider adding to existing content instead.
            </p>
            <div className="flex gap-2">
              <a 
                href={duplicateCheck.viewUrl} 
                target="_blank"
                className="text-xs px-3 py-1 bg-yellow-200 rounded hover:bg-yellow-300"
              >
                View Existing
              </a>
              <button 
                onClick={onAnalyze}
                className="text-xs px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-900"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        )}
        {!duplicateCheck?.similar && (
          <button onClick={onAnalyze} className="bg-gray-900 text-white px-6 py-3 rounded-lg">
            Analyze with AI
          </button>
        )}
      </div>
    );
  }

  const applyEdit = () => {
    onChange({ rawContent: editedAfter || analysis.beforeAfter?.after });
    setApplied(true);
    setShowEditor(false);
  };

  const autoAddTags = () => {
    const newTags = analysis.suggestedTags?.filter((tag: string) => !data.tags?.includes(tag)) || [];
    if (newTags.length > 0) {
      onChange({ tags: [...(data.tags || []), ...newTags] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">✅ Analysis Complete</h2>
        <button onClick={onAnalyze} className="text-sm px-3 py-1 bg-gray-100 rounded">Re-analyze</button>
      </div>

      {data.contentType === 'customer' && (
        <div className="space-y-4">
          {/* AI Improvements Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-2">What AI Improved</h3>
            <ul className="text-sm space-y-1">
              {analysis.readability && (
                <li>✓ Improved readability to {analysis.readability.gradeLevel} level (Score: {analysis.readability.score}/10)</li>
              )}
              {analysis.suggestedAdditions?.length > 0 && (
                <li>✓ Added {analysis.suggestedAdditions.length} new sections you were missing</li>
              )}
              {analysis.toneAnalysis && (
                <li>✓ Adjusted tone to be more customer-friendly and professional</li>
              )}
            </ul>
          </div>

          {/* Readability Score */}
          {analysis.readability && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-medium text-purple-900">Readability: {analysis.readability.gradeLevel}</h3>
              <div className="flex items-center gap-2 my-2">
                <div className="flex-1 bg-purple-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${(analysis.readability.score / 10) * 100}%` }}></div>
                </div>
                <span className="text-sm font-medium">{analysis.readability.score}/10</span>
              </div>
            </div>
          )}

          {/* Final Version - Collapsible Editor */}
          {analysis.beforeAfter?.after && (
            <div className={`border rounded-lg p-4 ${applied ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">
                  {applied ? '✅ Final Version (Applied)' : 'Final Version (Ready to Apply)'}
                </h3>
                {!applied && (
                  <button 
                    onClick={() => {
                      setEditedAfter(analysis.beforeAfter.after);
                      setShowEditor(!showEditor);
                    }}
                    className="text-xs px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-900"
                  >
                    {showEditor ? 'Cancel Edit' : 'Edit Final Version'}
                  </button>
                )}
              </div>

              {showEditor && !applied ? (
                <div className="space-y-3">
                  <textarea
                    value={editedAfter}
                    onChange={(e) => setEditedAfter(e.target.value)}
                    rows={12}
                    className="w-full p-3 border border-gray-300 rounded text-sm"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={applyEdit}
                      className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Apply This Version
                    </button>
                    <button 
                      onClick={() => setShowEditor(false)}
                      className="px-4 py-2 bg-gray-200 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-3 rounded border max-h-64 overflow-y-auto">
                  <div className="text-sm whitespace-pre-wrap">
                    {applied ? data.rawContent : analysis.beforeAfter.after}
                  </div>
                </div>
              )}

              {!showEditor && !applied && (
                <button 
                  onClick={applyEdit}
                  className="mt-3 w-full py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Accept AI Version
                </button>
              )}
            </div>
          )}

          {/* Auto-Add Tags */}
          {analysis.suggestedTags?.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-blue-900">AI Suggested Tags</h3>
                <button 
                  onClick={autoAddTags}
                  className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add All Tags
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {analysis.suggestedTags.map((tag: string, i: number) => {
                  const isAdded = data.tags?.includes(tag);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (isAdded) {
                          onChange({ tags: data.tags?.filter(t => t !== tag) });
                        } else {
                          onChange({ tags: [...(data.tags || []), tag] });
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm ${
                        isAdded 
                          ? 'bg-green-200 text-green-800' 
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                    >
                      {isAdded ? '✓ ' : '+ '}{tag}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-blue-700">
                Click individual tags to toggle, or "Add All Tags" to accept all suggestions
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t">
        <button 
          onClick={onContinue} 
          className="bg-gray-900 text-white px-6 py-3 rounded-lg"
          disabled={!applied && !data.rawContent}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
