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
  
  const [editedTone, setEditedTone] = useState(analysis?.tone?.suggestedEdit || '');
  const [editedAgentVersion, setEditedAgentVersion] = useState(analysis?.suggestedEdit || '');
  const [editedSteps, setEditedSteps] = useState(analysis?.steps || []);
  const [activeEdit, setActiveEdit] = useState<string | null>(null);

  if (isAnalyzing) {
    return (
      <div className="space-y-6 text-center py-12">
        <div className="w-16 h-16 border-4 border-[#F7FF96] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-xl font-semibold">AI is analyzing your content...</h2>
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

  const applyToneEdit = () => { onChange({ rawContent: editedTone }); setActiveEdit(null); };
  const applyAgentRewrite = () => { onChange({ rawContent: editedAgentVersion }); setActiveEdit(null); };
  const updateStep = (index: number, field: string, value: string) => {
    const newSteps = [...editedSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setEditedSteps(newSteps);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">AI Analysis Results</h2>

      {data.contentType === 'customer' && (
        <div className="space-y-4">
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

          {analysis.tone?.suggestedEdit && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <h3 className="font-medium text-yellow-900">Tone Improvement</h3>
                {activeEdit === 'tone' ? (
                  <button onClick={applyToneEdit} className="text-xs px-3 py-1 bg-yellow-500 text-white rounded">Apply</button>
                ) : (
                  <button onClick={() => { setEditedTone(analysis.tone.suggestedEdit); setActiveEdit('tone'); }} className="text-xs px-3 py-1 bg-yellow-200 rounded">Edit</button>
                )}
              </div>
              {activeEdit === 'tone' ? (
                <textarea value={editedTone} onChange={(e) => setEditedTone(e.target.value)} rows={6} className="w-full p-3 border rounded text-sm" />
              ) : (
                <div className="bg-white p-3 rounded border"><p className="text-sm line-clamp-4">{analysis.tone.suggestedEdit}</p></div>
              )}
              {!activeEdit && <button onClick={() => onChange({ rawContent: analysis.tone.suggestedEdit })} className="mt-2 text-xs px-3 py-1 bg-yellow-200 rounded">Accept As-Is</button>}
            </div>
          )}

          {analysis.missingContent?.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-medium text-orange-900 mb-2">Missing Content</h3>
              <ul className="list-disc list-inside text-sm">
                {analysis.missingContent.map((item: string, i: number) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {data.contentType === 'agent' && (
        <div className="space-y-4">
          {analysis.searchability && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h3 className="font-medium text-indigo-900 mb-2">Searchability Score: {analysis.searchability.score}/10</h3>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 bg-indigo-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${(analysis.searchability.score / 10) * 100}%` }}></div>
                </div>
              </div>
            </div>
          )}

          {analysis.steps?.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between mb-3">
                <h3 className="font-medium">Extracted Steps ({analysis.steps.length})</h3>
                {activeEdit === 'steps' ? (
                  <button onClick={() => { onChange({ skill: { ...data.skill, steps: editedSteps } }); setActiveEdit(null); }} className="text-xs px-3 py-1 bg-gray-800 text-white rounded">Save</button>
                ) : (
                  <button onClick={() => { setEditedSteps(analysis.steps); setActiveEdit('steps'); }} className="text-xs px-3 py-1 bg-gray-200 rounded">Edit</button>
                )}
              </div>
              <div className="space-y-2">
                {(activeEdit === 'steps' ? editedSteps : analysis.steps).map((step: any, index: number) => (
                  <div key={index} className="bg-white border rounded p-3">
                    {activeEdit === 'steps' ? (
                      <div className="space-y-2">
                        <input type="text" value={step.title} onChange={(e) => updateStep(index, 'title', e.target.value)} className="w-full px-2 py-1 border rounded text-sm font-medium" />
                        <textarea value={step.content} onChange={(e) => updateStep(index, 'content', e.target.value)} rows={2} className="w-full px-2 py-1 border rounded text-sm" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1"><span className="text-xs text-gray-500">Step {index + 1}</span><span className="text-xs px-2 py-0.5 bg-gray-100 rounded">{step.type}</span></div>
                        <p className="font-medium text-sm">{step.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{step.content}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.missingContent?.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-medium text-orange-900 mb-2">Missing Content</h3>
              <ul className="list-disc list-inside text-sm">{analysis.missingContent.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
            </div>
          )}

          {analysis.suggestedEdit && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <h3 className="font-medium text-green-900">AI-Optimized Version</h3>
                {activeEdit === 'full' ? (
                  <button onClick={applyAgentRewrite} className="text-xs px-3 py-1 bg-green-600 text-white rounded">Apply</button>
                ) : (
                  <button onClick={() => { setEditedAgentVersion(analysis.suggestedEdit); setActiveEdit('full'); }} className="text-xs px-3 py-1 bg-green-200 rounded">Edit</button>
                )}
              </div>
              {activeEdit === 'full' ? (
                <textarea value={editedAgentVersion} onChange={(e) => setEditedAgentVersion(e.target.value)} rows={8} className="w-full p-3 border rounded text-sm font-mono" />
              ) : (
                <div className="bg-white p-3 rounded border max-h-40 overflow-y-auto"><pre className="text-xs whitespace-pre-wrap">{analysis.suggestedEdit.substring(0, 300)}...</pre></div>
              )}
            </div>
          )}
        </div>
      )}

      {data.contentType === 'internal' && analysis.missingContent?.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-medium text-orange-900 mb-2">Missing Content</h3>
          <ul className="list-disc list-inside text-sm">{analysis.missingContent.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
        </div>
      )}

      {analysis.suggestedTags?.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-900 mb-2">AI Suggested Tags</h3>
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
