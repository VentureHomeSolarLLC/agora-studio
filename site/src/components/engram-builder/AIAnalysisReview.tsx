'use client';

import { useState } from 'react';
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
  
  const [editedTone, setEditedTone] = useState(analysis?.toneAnalysis?.suggestedEdit || '');
  const [editedAfter, setEditedAfter] = useState(analysis?.beforeAfter?.after || '');
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [addedSections, setAddedSections] = useState<string[]>([]);
  const [activeEdit, setActiveEdit] = useState<string | null>(null);

  if (isAnalyzing) {
    return (
      <div className="space-y-6 text-center py-12">
        <div className="w-16 h-16 border-4 border-[#F7FF96] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-xl font-semibold">AI is analyzing your content...</h2>
        <p className="text-gray-500">Generating improvements and suggested additions</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">AI Analysis</h2>
        <button onClick={onAnalyze} className="bg-gray-900 text-white px-6 py-3 rounded-lg">Analyze with AI</button>
      </div>
    );
  }

  const applyFullEdit = () => {
    onChange({ rawContent: editedAfter });
    setActiveEdit(null);
  };

  const addSuggestedSection = (sectionContent: string) => {
    const currentContent = data.rawContent || '';
    onChange({ rawContent: currentContent + '\n\n' + sectionContent });
    setAddedSections([...addedSections, sectionContent.substring(0, 50)]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">AI Analysis Results</h2>
        <button onClick={onAnalyze} className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded">Re-analyze</button>
      </div>

      {/* CUSTOMER CONTENT */}
      {data.contentType === 'customer' && (
        <div className="space-y-4">
          {/* Readability Score */}
          {analysis.readability && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-medium text-purple-900">Readability: {analysis.readability.gradeLevel} level</h3>
              <div className="flex items-center gap-2 my-2">
                <div className="flex-1 bg-purple-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${(analysis.readability.score / 10) * 100}%` }}></div>
                </div>
                <span className="text-sm">{analysis.readability.score}/10</span>
              </div>
            </div>
          )}

          {/* Suggested Additions with Add Buttons */}
          {analysis.suggestedAdditions?.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-3">Suggested Content to Add</h3>
              <div className="space-y-3">
                {analysis.suggestedAdditions.map((addition: any, i: number) => (
                  <div key={i} className="bg-white p-3 rounded border border-blue-300">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">{addition.section}</h4>
                      {addedSections.includes(addition.content.substring(0, 50)) ? (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">✓ Added</span>
                      ) : (
                        <button 
                          onClick={() => addSuggestedSection(addition.content)}
                          className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          + Add This Section
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">Placement: {addition.placement}</p>
                    <div className="bg-gray-50 p-2 rounded text-sm max-h-32 overflow-y-auto">
                      {addition.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Before/After Comparison */}
          {analysis.beforeAfter && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-900">Before & After Comparison</h3>
                <button 
                  onClick={() => setShowBeforeAfter(!showBeforeAfter)}
                  className="text-xs px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  {showBeforeAfter ? 'Hide' : 'Show'} Comparison
                </button>
              </div>
              
              {showBeforeAfter && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase">Before (Your Version)</h4>
                    <div className="text-sm text-gray-700 max-h-64 overflow-y-auto whitespace-pre-wrap">
                      {analysis.beforeAfter.before}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border border-green-300">
                    <h4 className="text-xs font-medium text-green-600 mb-2 uppercase">After (AI Improved)</h4>
                    <div className="text-sm text-gray-700 max-h-64 overflow-y-auto whitespace-pre-wrap">
                      {analysis.beforeAfter.after}
                    </div>
                  </div>
                </div>
              )}

              {/* Edit the After version */}
              <div className="mt-4">
                {activeEdit === 'after' ? (
                  <div className="space-y-2">
                    <textarea
                      value={editedAfter}
                      onChange={(e) => setEditedAfter(e.target.value)}
                      rows={10}
                      className="w-full p-3 border border-gray-300 rounded text-sm"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={applyFullEdit}
                        className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Apply This Version
                      </button>
                      <button 
                        onClick={() => setActiveEdit(null)}
                        className="px-4 py-2 bg-gray-200 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => { 
                      setEditedAfter(analysis.beforeAfter.after); 
                      setActiveEdit('after'); 
                    }}
                    className="text-sm px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                  >
                    Edit Final Version
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Missing Content */}
          {analysis.missingContent?.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-medium text-orange-900 mb-2">Still Missing</h3>
              <ul className="list-disc list-inside text-sm">
                {analysis.missingContent.map((item: string, i: number) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* SUGGESTED TAGS - All Types */}
      {analysis.suggestedTags?.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-900 mb-2">Suggested Tags</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.suggestedTags.map((tag: string, i: number) => (
              <button key={i} onClick={() => { if (!data.tags?.includes(tag)) { onChange({ tags: [...(data.tags || []), tag] }); } }} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200">+ {tag}</button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t">
        <button onClick={onContinue} className="bg-gray-900 text-white px-6 py-3 rounded-lg">Continue to Metadata →</button>
      </div>
    </div>
  );
}
