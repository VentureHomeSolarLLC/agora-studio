'use client';
import { useState, useEffect } from 'react';
import { EngramFormData } from '@/types/engram';

interface AIAnalysisReviewProps {
  data: EngramFormData;
  onChange: (updates: Partial<EngramFormData>) => void;
  onAnalyze: () => void;
  onContinue: () => void;
  isAnalyzing: boolean;
}

export function AIAnalysisReview({ data, onChange, onAnalyze, onContinue, isAnalyzing }: AIAnalysisReviewProps) {
  const analysis = data.aiAnalysis;
  
  const [editedContent, setEditedContent] = useState('');
  const [addedSections, setAddedSections] = useState<string[]>([]);
  const [versionLocked, setVersionLocked] = useState(false);
  const [showAppliedToast, setShowAppliedToast] = useState(false);

  // Initialize with AI version
  useEffect(() => {
    if (analysis?.beforeAfter?.after && !editedContent) {
      setEditedContent(analysis.beforeAfter.after);
    }
  }, [analysis]);

  if (isAnalyzing) {
    return (
      <div className="space-y-6 text-center py-12">
        <div className="w-16 h-16 border-4 border-[#F7FF96] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-xl font-semibold">AI is analyzing your content...</h2>
        <p className="text-gray-500">Finding improvements and missing pieces</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">AI Analysis</h2>
        <p className="text-gray-500">Click analyze to get AI-powered improvements</p>
        <button onClick={onAnalyze} className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800">
          ✨ Analyze with AI
        </button>
      </div>
    );
  }

  const applyVersion = () => {
    onChange({ rawContent: editedContent });
    setVersionLocked(true);
    setShowAppliedToast(true);
    setTimeout(() => setShowAppliedToast(false), 3000);
  };

  const addSectionToFinal = (sectionContent: string, sectionTitle: string) => {
    const newContent = editedContent + '\n\n## ' + sectionTitle + '\n\n' + sectionContent;
    setEditedContent(newContent);
    setAddedSections([...addedSections, sectionTitle]);
  };

  const toggleTag = (tag: string) => {
    const currentTags = data.tags || [];
    if (currentTags.includes(tag)) {
      onChange({ tags: currentTags.filter(t => t !== tag) });
    } else {
      onChange({ tags: [...currentTags, tag] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Applied Toast */}
      {showAppliedToast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-pulse">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Version applied and locked in!
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {versionLocked ? (
            <span className="flex items-center gap-2 text-green-700">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Version Locked In
            </span>
          ) : (
            '✨ AI Analysis Complete'
          )}
        </h2>
        <button onClick={onAnalyze} className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">
          Re-analyze
        </button>
      </div>

      {/* CUSTOMER CONTENT */}
      {data.contentType === 'customer' && (
        <div className="space-y-4">
          
          {/* Readability - FIXED BAR WIDTH */}
          {analysis.readability && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-medium text-purple-900">
                Readability: {analysis.readability.gradeLevel} level
              </h3>
              <div className="flex items-center gap-2 my-2 max-w-md">
                <div className="flex-1 bg-purple-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all" 
                    style={{ width: `${Math.min((analysis.readability.score / 10) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{analysis.readability.score}/10</span>
              </div>
            </div>
          )}

          {/* Before/After - ALWAYS EXPANDED */}
          {analysis.beforeAfter && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Before & After Comparison</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* BEFORE */}
                <div className="bg-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-200 px-4 py-2">
                    <span className="font-medium text-gray-700 text-sm uppercase">Before (Your Notes)</span>
                  </div>
                  <div className="p-4 bg-white m-2 rounded border text-sm text-gray-600 max-h-96 overflow-y-auto whitespace-pre-wrap">
                    {analysis.beforeAfter.before}
                  </div>
                </div>
                
                {/* AFTER - ALWAYS EDITABLE */}
                <div className="bg-green-50 border border-green-200 rounded-lg overflow-hidden">
                  <div className="bg-green-100 px-4 py-2">
                    <span className="font-medium text-green-800 text-sm uppercase">After (AI Polished)</span>
                  </div>
                  <div className="p-4">
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={12}
                      className="w-full p-3 border border-green-300 rounded text-sm font-mono bg-white"
                      disabled={versionLocked}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Apply Button */}
          {!versionLocked && (
            <button 
              onClick={applyVersion}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Apply This Version
            </button>
          )}

          {/* Suggested Additions */}
          {analysis.missingContentSections?.length > 0 && !versionLocked && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
                💡 Suggested Sections to Add
              </h3>
              <div className="space-y-3">
                {analysis.missingContentSections.map((section: any, i: number) => {
                  const isAdded = addedSections.includes(section.sectionTitle);
                  return (
                    <div key={i} className={`p-4 rounded border ${isAdded ? 'border-green-400 bg-green-50' : 'border-orange-300 bg-white'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{section.sectionTitle}</h4>
                        {isAdded ? (
                          <span className="text-xs px-3 py-1 bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Added
                          </span>
                        ) : (
                          <button 
                            onClick={() => addSectionToFinal(section.content, section.sectionTitle)}
                            className="text-xs px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 font-medium"
                          >
                            + Add This Section
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{section.content.substring(0, 150)}...</p>
                      <p className="text-xs text-orange-700 italic">💭 {section.whyImportant}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tags - IMPROVED UX */}
      {analysis.suggestedTags?.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-900 mb-2">Suggested Tags</h3>
          <p className="text-sm text-green-700 mb-3">Click to add/remove:</p>
          <div className="flex flex-wrap gap-2">
            {analysis.suggestedTags.map((tag: string, i: number) => {
              const isAdded = data.tags?.includes(tag);
              return (
                <button
                  key={i}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    isAdded 
                      ? 'bg-green-600 text-white shadow-sm' 
                      : 'bg-white text-green-800 border border-green-300 hover:bg-green-100'
                  }`}
                >
                  {isAdded ? '✓ ' : '+ '}{tag}
                </button>
              );
            })}
          </div>
          {data.tags && data.tags.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-sm font-medium text-green-900">Selected tags ({data.tags.length}):</p>
              <p className="text-sm text-green-800">{data.tags.join(', ')}</p>
            </div>
          )}
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-end pt-4 border-t">
        <button
          onClick={onContinue}
          disabled={!versionLocked}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            versionLocked 
              ? 'bg-gray-900 text-white hover:bg-gray-800' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {versionLocked ? 'Continue to Metadata →' : 'Apply version to continue'}
        </button>
      </div>
    </div>
  );
}
