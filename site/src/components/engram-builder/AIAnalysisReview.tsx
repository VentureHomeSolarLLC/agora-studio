'use client';

import { useState, useEffect } from 'react';
import { EngramFormData } from '@/types/engram';
import { SkillBuilder } from '@/components/engram-builder/SkillBuilder';
import { ConceptsBuilder } from '@/components/engram-builder/ConceptsBuilder';
import { LessonsBuilder } from '@/components/engram-builder/LessonsBuilder';

interface AIAnalysisReviewProps {
  data: EngramFormData;
  onChange: (updates: Partial<EngramFormData>) => void;
  onAnalyze: () => void;
  onContinue: () => void;
  isAnalyzing: boolean;
}

type DuplicateMatch = {
  title: string;
  type: string;
  score: number;
  path: string;
  viewUrl?: string;
};

type MissingSection = {
  sectionTitle: string;
  content: string;
  placement?: string;
  whyImportant?: string;
};

export function AIAnalysisReview({ data, onChange, onAnalyze, onContinue, isAnalyzing }: AIAnalysisReviewProps) {
  const analysis = data.aiAnalysis;
  const duplicateCheck = data.duplicateCheck;
  const extraction = data.agentExtraction;
  const [editedContent, setEditedContent] = useState('');
  const [addedSections, setAddedSections] = useState<string[]>([]);
  const [versionLocked, setVersionLocked] = useState(false);
  const [showAppliedToast, setShowAppliedToast] = useState(false);
  const [expandedSections, setExpandedSections] = useState<number[]>([]);
  const [conceptYamlPreview, setConceptYamlPreview] = useState<Record<number, boolean>>({});
  const [lessonYamlPreview, setLessonYamlPreview] = useState<Record<number, boolean>>({});
  const baseOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const isKnowledgeOnly = data.agentProfile?.skillMode === 'knowledge';
  const isAgentImport = data.contentType === 'agent' && data.agentImportMode === 'monolith';
  const AUTO_INCLUDE_CONFIDENCE = 0.7;
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (analysis?.beforeAfter?.after) {
      const normalized =
        data.contentType === 'internal'
          ? normalizeInternalDraft(analysis.beforeAfter.after)
          : analysis.beforeAfter.after;
      setEditedContent(normalized);
    }
  }, [analysis?.beforeAfter?.after, data.contentType]);

  const buildInternalDraft = () => {
    const parts: string[] = [];
    if (data.title) {
      parts.push(data.title);
    }
    if (data.description) {
      parts.push(data.description.trim());
    }
    if (analysis?.sections?.length) {
      analysis.sections.forEach((section: any) => {
        if (!section?.title || !section?.content) return;
        parts.push(`${section.title}:\n${section.content}`);
      });
    }
    if (analysis?.technicalDetails?.length) {
      parts.push(`Technical Details:\n${analysis.technicalDetails.map((item: string) => `- ${item}`).join('\n')}`);
    }
    if (analysis?.edgeCases?.length) {
      parts.push(`Edge Cases:\n${analysis.edgeCases.map((item: string) => `- ${item}`).join('\n')}`);
    }
    if (analysis?.missingContent?.length) {
      parts.push(`Missing Info:\n${analysis.missingContent.map((item: string) => `- ${item}`).join('\n')}`);
    }
    return parts.filter(Boolean).join('\n\n').trim();
  };

  const internalDraft = data.contentType === 'internal' && analysis ? buildInternalDraft() : '';
  const internalDraftWithFallback =
    data.contentType === 'internal' ? (internalDraft || data.rawContent || '') : '';

  useEffect(() => {
    if (data.contentType === 'internal' && internalDraftWithFallback && !editedContent) {
      setEditedContent(normalizeInternalDraft(internalDraftWithFallback));
    }
  }, [data.contentType, internalDraftWithFallback, editedContent]);

  const normalizeInternalDraft = (value: string) => {
    return value
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .trim();
  };

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
        <button onClick={onAnalyze} className="bg-gray-900 text-white px-6 py-3 rounded-lg">
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
    const separator = editedContent.endsWith('\n\n') ? '' : '\n\n';
    const newContent = editedContent + separator + sectionTitle + '\n\n' + sectionContent + '\n\n';
    setEditedContent(newContent);
    setAddedSections([...addedSections, sectionTitle]);
  };

  const toggleSection = (i: number) => {
    setExpandedSections(prev => 
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  };

  const toggleConceptPreview = (i: number) => {
    setConceptYamlPreview((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const toggleLessonPreview = (i: number) => {
    setLessonYamlPreview((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const toggleTag = (tag: string) => {
    const currentTags = data.tags || [];
    if (currentTags.includes(tag)) {
      onChange({ tags: currentTags.filter(t => t !== tag) });
    } else {
      onChange({ tags: [...currentTags, tag] });
    }
  };

  const handleReanalyze = () => {
    setVersionLocked(false);
    setAddedSections([]);
    setExpandedSections([]);
    setShowAppliedToast(false);
    setEditedContent('');
    onAnalyze();
  };

  const updateExtraction = (updates: Partial<NonNullable<EngramFormData['agentExtraction']>>) => {
    onChange({
      agentExtraction: {
        concepts: extraction?.concepts || [],
        lessons: extraction?.lessons || [],
        ...updates,
      },
    });
  };

  const setConceptInclude = (index: number, include: boolean) => {
    if (!extraction) return;
    if (extraction.concepts[index]?.duplicate?.similar) return;
    const concepts = [...extraction.concepts];
    concepts[index] = { ...concepts[index], include };
    updateExtraction({ concepts });
  };

  const setLessonInclude = (index: number, include: boolean) => {
    if (!extraction) return;
    if (extraction.lessons[index]?.duplicate?.similar) return;
    const lessons = [...extraction.lessons];
    lessons[index] = { ...lessons[index], include };
    updateExtraction({ lessons });
  };

  const setConceptMerge = (index: number, path: string, title: string, type: string) => {
    if (!extraction) return;
    const concepts = [...extraction.concepts];
    concepts[index] = {
      ...concepts[index],
      include: false,
      mergeTargetPath: path || undefined,
      mergeTargetTitle: title || undefined,
      mergeTargetType: type || undefined,
    };
    updateExtraction({ concepts });
  };

  const setLessonMerge = (index: number, path: string, title: string, type: string) => {
    if (!extraction) return;
    const lessons = [...extraction.lessons];
    lessons[index] = {
      ...lessons[index],
      include: false,
      mergeTargetPath: path || undefined,
      mergeTargetTitle: title || undefined,
      mergeTargetType: type || undefined,
    };
    updateExtraction({ lessons });
  };

  const setAllExtraction = (include: boolean) => {
    if (!extraction) return;
    const nextExtraction = {
      concepts: extraction.concepts.map((c) => ({
        ...c,
        include: c.duplicate?.similar ? false : include,
      })),
      lessons: extraction.lessons.map((l) => ({
        ...l,
        include: l.duplicate?.similar ? false : include,
      })),
    };
    const nextModes = (data.agentEngramModes || []).map((mode) => ({
      ...mode,
      include,
    }));
    onChange({
      agentExtraction: nextExtraction,
      agentEngramModes: nextModes,
    });
  };

  const extractionCounts = {
    concepts: extraction?.concepts?.length || 0,
    lessons: extraction?.lessons?.length || 0,
  };
  const extractionSelected = {
    concepts: extraction?.concepts?.filter((c) => c.include).length || 0,
    lessons: extraction?.lessons?.filter((l) => l.include).length || 0,
  };
  const extractionMerged = {
    concepts: extraction?.concepts?.filter((c) => !!c.mergeTargetPath).length || 0,
    lessons: extraction?.lessons?.filter((l) => !!l.mergeTargetPath).length || 0,
  };
  const netNewCounts = {
    concepts: extraction?.concepts?.filter((c) => !c.duplicate?.similar).length || 0,
    lessons: extraction?.lessons?.filter((l) => !l.duplicate?.similar).length || 0,
  };
  const hasAnyExtraction = extractionCounts.concepts + extractionCounts.lessons > 0;
  const hasSelectedExtraction =
    extractionSelected.concepts +
      extractionSelected.lessons +
      extractionMerged.concepts +
      extractionMerged.lessons >
    0;
  const hasNetNewCandidates = netNewCounts.concepts + netNewCounts.lessons > 0;
  const hasNoNetNewAgentContent = extraction && !hasNetNewCandidates;
  const hasEngramModes = Array.isArray(data.agentEngramModes) && data.agentEngramModes.length > 0;
  const repoLinkForPath = (path: string) =>
    `https://github.com/VentureHomeSolarLLC/agora-studio/blob/main/${path}`;
  const resolveViewUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `${baseOrigin}${url}`;
    return url;
  };

  const getReadability = () => {
    const score = analysis.readability?.score;
    if (typeof score === 'number') {
      const normalized = Math.min(Math.max(score, 0), 10);
      return { score: normalized, percent: (normalized / 10) * 100 };
    }
    return { score: 5, percent: 50 };
  };
  const readability = getReadability();

  const getDuplicateDisplayThreshold = () => {
    if (data.contentType === 'customer' || data.contentType === 'internal') {
      return 0.5;
    }
    return 0.25;
  };

  const renderDuplicateCheck = () => {
    if (!duplicateCheck) return null;
    const displayThreshold = getDuplicateDisplayThreshold();
    const filteredMatches = duplicateCheck.matches.filter((match) => match.score >= displayThreshold);
    const similar = filteredMatches.length > 0 && filteredMatches[0].score >= displayThreshold;
    return (
      <div className={`rounded-lg p-4 border ${similar ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
        <h3 className={`font-medium mb-2 ${similar ? 'text-yellow-900' : 'text-green-900'}`}>
          {similar ? 'Potential duplicates found' : 'No close duplicates detected'}
        </h3>
        {filteredMatches.length === 0 ? (
          <p className={`text-sm ${similar ? 'text-yellow-800' : 'text-green-800'}`}>
            We didn&apos;t find anything very similar in the library.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredMatches.map((match, i) => (
              <div key={`${match.path}-${i}`} className="bg-white border border-gray-200 rounded-lg p-3 flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">{match.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {match.type === 'customer-page'
                      ? 'Customer page'
                      : match.type === 'concept'
                      ? 'Concept'
                      : match.type === 'lesson'
                      ? 'Lesson'
                      : match.type === 'skill'
                      ? 'Skill'
                      : match.type === 'engram-v2'
                      ? 'Engram (v2)'
                      : 'Engram'}{' '}
                    • {match.path}
                  </p>
                  <a
                    href={resolveViewUrl(match.viewUrl) || repoLinkForPath(match.path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                  >
                    Open in new tab
                  </a>
                  {match.viewUrl && resolveViewUrl(match.viewUrl) !== repoLinkForPath(match.path) && (
                    <a
                      href={repoLinkForPath(match.path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                    >
                      View source file
                    </a>
                  )}
                </div>
                <div className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  {Math.round(match.score * 100)}% similar
                </div>
              </div>
            ))}
            <p className={`text-xs ${similar ? 'text-yellow-700' : 'text-green-700'}`}>
              If this overlaps heavily, consider updating the existing content instead of publishing a new page.
            </p>
          </div>
        )}
      </div>
    );
  };

  if (data.contentType === 'agent' && !isAgentImport) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">AI Skill Draft</h2>
          <button
            onClick={handleReanalyze}
            disabled={isAnalyzing}
            className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Re-analyze
          </button>
        </div>

        {analysis?.warnings?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-medium text-amber-900 mb-2">Warnings</h3>
            <ul className="text-sm text-amber-800 space-y-1">
              {analysis.warnings.map((warning: string, i: number) => (
                <li key={i}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {renderDuplicateCheck()}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Skill Profile</h3>
          <p className="text-sm text-blue-800">
            {isKnowledgeOnly
              ? 'Review the outcome, triggers, and guardrails in Step 2. The draft below focuses on reference knowledge.'
              : 'Review the outcome, triggers, and guardrails in Step 2. The draft below focuses on execution steps and knowledge support.'}
          </p>
        </div>

        {isKnowledgeOnly && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 mb-2">Knowledge-only mode</h3>
            <p className="text-sm text-slate-700">
              Steps are optional here. Focus on the concepts and lessons that capture the core knowledge for agents.
            </p>
          </div>
        )}

        <SkillBuilder
          data={data.skill}
          onChange={(next) => onChange({ skill: next })}
        />

        <ConceptsBuilder
          data={data.concepts || []}
          onChange={(next) => onChange({ concepts: next })}
        />

        <LessonsBuilder
          data={data.lessons || []}
          onChange={(next) => onChange({ lessons: next })}
        />

        {analysis?.suggestedTags?.length > 0 && (
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
                    className={`px-3 py-1 rounded-full text-sm transition-all ${isAdded ? 'bg-green-600 text-white' : 'bg-white text-green-800 border border-green-300 hover:bg-green-100'}`}
                  >
                    {isAdded ? '✓ ' : '+ '}{tag}
                  </button>
                );
              })}
            </div>
            {data.tags && data.tags.length > 0 && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-sm font-medium text-green-900">Selected ({data.tags.length}): {data.tags.join(', ')}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onContinue}
            className="px-6 py-3 rounded-lg font-medium bg-gray-900 text-white hover:bg-gray-800"
          >
            Continue to Metadata →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showAppliedToast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Version applied and locked in!
        </div>
      )}

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
        <button
          onClick={handleReanalyze}
          disabled={isAnalyzing}
          className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          Re-analyze
        </button>
      </div>

      {analysis.readability && !isAgentImport && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-medium text-purple-900">Readability: {analysis.readability?.gradeLevel || 'high school'} level</h3>
          <div className="flex items-center gap-3 my-2 max-w-md">
            <div className="flex-1 bg-purple-200 rounded-full h-2 overflow-hidden">
              <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${readability.percent}%` }}></div>
            </div>
            <span className="text-sm font-medium whitespace-nowrap">{readability.score.toFixed(1)}/10</span>
          </div>
        </div>
      )}

      {renderDuplicateCheck()}

      {data.contentType === 'internal' && !analysis?.beforeAfter?.after && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Internal Draft Preview</h3>
            <span className="text-xs text-gray-500">Click to edit</span>
          </div>
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={12}
            className="w-full p-3 border border-gray-200 rounded text-sm font-mono bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            disabled={versionLocked}
          />
          {data.rawContent && (
            <details className="mt-3">
              <summary className="text-xs text-blue-700 cursor-pointer">View original notes</summary>
              <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap border-t border-gray-100 pt-2">
                {data.rawContent}
              </div>
            </details>
          )}
        </div>
      )}

      {extraction && (extraction.concepts.length > 0 || extraction.lessons.length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <h3 className="font-medium text-blue-900">AI Agent Extraction</h3>
              <p className="text-sm text-blue-800">
                Select which items should become draft Engram files. Selected items are saved under
                <span className="font-medium"> engrams-v2/&lt;engram&gt; </span>
                and missing Engrams are created automatically.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAllExtraction(true)}
                className="text-xs px-3 py-1 rounded-full bg-white border border-blue-200 text-blue-800 hover:bg-blue-100"
              >
                Select all
              </button>
              <button
                onClick={() => setAllExtraction(false)}
                className="text-xs px-3 py-1 rounded-full bg-white border border-blue-200 text-blue-800 hover:bg-blue-100"
              >
                Deselect all
              </button>
            </div>
          </div>

          {hasEngramModes && (
            <div className="mb-4 bg-white border border-blue-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Suggested Engram Modes</p>
              <div className="space-y-2 text-sm text-blue-900">
                {data.agentEngramModes?.map((mode, idx) => (
                  <div key={`${mode.engramId}-${idx}`} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-blue-700">
                        <input
                          type="checkbox"
                          checked={mode.include !== false}
                          onChange={(e) => {
                            const next = (data.agentEngramModes || []).map((entry, index) =>
                              index === idx ? { ...entry, include: e.target.checked } : entry
                            );
                            onChange({ agentEngramModes: next });
                          }}
                        />
                        Use
                      </label>
                      <span className="font-medium">{mode.label || mode.engramId}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        {mode.mode === 'procedure' ? 'Procedure' : 'Knowledge'}
                      </span>
                    </div>
                    {mode.rationale && <p className="text-xs text-blue-700">{mode.rationale}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {extraction.concepts.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Concepts</p>
              {extraction.concepts.map((concept, i) => {
                const isDuplicate = concept.duplicate?.similar;
                const topMatch = concept.duplicate?.matches?.[0];
                const mergeOptions =
                  concept.duplicate?.matches?.filter((match: DuplicateMatch) => match.type === 'concept') || [];
                return (
                <div key={`${concept.title}-${i}`} className="bg-white border border-blue-100 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{concept.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        For Engram: {concept.forEngram || 'general'}
                      </p>
                      {(concept.riskLevel === 'high' || (typeof concept.confidence === 'number' && concept.confidence < AUTO_INCLUDE_CONFIDENCE)) && (
                        <p className="text-xs text-amber-700 mt-1">
                          {concept.riskLevel === 'high' ? 'High-risk content — not auto-selected.' : 'Low confidence — not auto-selected.'}
                        </p>
                      )}
                      {!isDuplicate && (
                        <p className="text-xs text-gray-500 mt-1">Last verified will be set to {today}.</p>
                      )}
                      {isDuplicate && topMatch && (
                        <div className="text-xs text-amber-700 mt-2">
                          Likely duplicate of <span className="font-medium">{topMatch.title}</span> ({Math.round(topMatch.score * 100)}%).
                          <div className="mt-1">
                            <a
                              href={resolveViewUrl(topMatch.viewUrl) || repoLinkForPath(topMatch.path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Open existing
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={concept.include}
                        disabled={isDuplicate}
                        onChange={(e) => setConceptInclude(i, e.target.checked)}
                      />
                      {isDuplicate ? 'Duplicate' : 'Include'}
                    </label>
                  </div>
                  {isDuplicate && mergeOptions.length > 0 && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-amber-900 mb-2">Merge into existing concept</p>
                      <select
                        value={concept.mergeTargetPath || ''}
                        onChange={(e) => {
                          const selected = mergeOptions.find((m) => m.path === e.target.value);
                          setConceptMerge(i, e.target.value, selected?.title || '', selected?.type || '');
                        }}
                        className="w-full text-sm border border-amber-200 rounded px-2 py-2 bg-white"
                      >
                        <option value="">Do not merge</option>
                        {mergeOptions.map((match, idx) => (
                          <option key={`${match.path}-${idx}`} value={match.path}>
                            {match.title} ({Math.round(match.score * 100)}%)
                          </option>
                        ))}
                      </select>
                      {concept.mergeTargetPath && (
                        <p className="text-xs text-amber-800 mt-2">
                          This will append the new context to <span className="font-medium">{concept.mergeTargetTitle}</span>.
                        </p>
                      )}
                    </div>
                  )}
                  {isDuplicate && mergeOptions.length === 0 && (
                    <p className="text-xs text-amber-700 mt-3">
                      Closest matches are not concept files. Add any new context manually to the relevant file.
                    </p>
                  )}
                  <details className="mt-3">
                    <summary className="text-xs text-blue-700 cursor-pointer">Preview content</summary>
                    <div className="mt-2 text-xs text-gray-500 flex items-center justify-between border-t border-blue-100 pt-2">
                      <span>Preview mode</span>
                      {concept.previewMarkdown && (
                        <button
                          type="button"
                          onClick={() => toggleConceptPreview(i)}
                          className="text-xs text-blue-700 hover:underline"
                        >
                          {conceptYamlPreview[i] ? 'Show content' : 'Show YAML'}
                        </button>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                      {conceptYamlPreview[i] && concept.previewMarkdown ? (
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-lg p-3">
                          {concept.previewMarkdown}
                        </pre>
                      ) : (
                        <div className="border-t border-blue-100 pt-2">{concept.content}</div>
                      )}
                    </div>
                  </details>
                </div>
              )})}
            </div>
          )}

          {extraction.lessons.length > 0 && (
            <div className="space-y-3 mt-5">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Lessons</p>
              {extraction.lessons.map((lesson, i) => {
                const isDuplicate = lesson.duplicate?.similar;
                const topMatch = lesson.duplicate?.matches?.[0];
                const mergeOptions =
                  lesson.duplicate?.matches?.filter((match: DuplicateMatch) => match.type === 'lesson') || [];
                return (
                <div key={`${lesson.title}-${i}`} className="bg-white border border-blue-100 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{lesson.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        For Engram: {lesson.forEngram || 'general'}
                      </p>
                      {(lesson.riskLevel === 'high' || (typeof lesson.confidence === 'number' && lesson.confidence < AUTO_INCLUDE_CONFIDENCE)) && (
                        <p className="text-xs text-amber-700 mt-1">
                          {lesson.riskLevel === 'high' ? 'High-risk content — not auto-selected.' : 'Low confidence — not auto-selected.'}
                        </p>
                      )}
                      {isDuplicate && topMatch && (
                        <div className="text-xs text-amber-700 mt-2">
                          Likely duplicate of <span className="font-medium">{topMatch.title}</span> ({Math.round(topMatch.score * 100)}%).
                          <div className="mt-1">
                            <a
                              href={resolveViewUrl(topMatch.viewUrl) || repoLinkForPath(topMatch.path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Open existing
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={lesson.include}
                        disabled={isDuplicate}
                        onChange={(e) => setLessonInclude(i, e.target.checked)}
                      />
                      {isDuplicate ? 'Duplicate' : 'Include'}
                    </label>
                  </div>
                  {isDuplicate && mergeOptions.length > 0 && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-amber-900 mb-2">Merge into existing lesson</p>
                      <select
                        value={lesson.mergeTargetPath || ''}
                        onChange={(e) => {
                          const selected = mergeOptions.find((m) => m.path === e.target.value);
                          setLessonMerge(i, e.target.value, selected?.title || '', selected?.type || '');
                        }}
                        className="w-full text-sm border border-amber-200 rounded px-2 py-2 bg-white"
                      >
                        <option value="">Do not merge</option>
                        {mergeOptions.map((match, idx) => (
                          <option key={`${match.path}-${idx}`} value={match.path}>
                            {match.title} ({Math.round(match.score * 100)}%)
                          </option>
                        ))}
                      </select>
                      {lesson.mergeTargetPath && (
                        <p className="text-xs text-amber-800 mt-2">
                          This will append the new context to <span className="font-medium">{lesson.mergeTargetTitle}</span>.
                        </p>
                      )}
                    </div>
                  )}
                  {isDuplicate && mergeOptions.length === 0 && (
                    <p className="text-xs text-amber-700 mt-3">
                      Closest matches are not lesson files. Add any new context manually to the relevant file.
                    </p>
                  )}
                  <details className="mt-3">
                    <summary className="text-xs text-blue-700 cursor-pointer">Preview lesson</summary>
                    <div className="mt-2 text-xs text-gray-500 flex items-center justify-between border-t border-blue-100 pt-2">
                      <span>Preview mode</span>
                      {lesson.previewMarkdown && (
                        <button
                          type="button"
                          onClick={() => toggleLessonPreview(i)}
                          className="text-xs text-blue-700 hover:underline"
                        >
                          {lessonYamlPreview[i] ? 'Show content' : 'Show YAML'}
                        </button>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                      {lessonYamlPreview[i] && lesson.previewMarkdown ? (
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-lg p-3">
                          {lesson.previewMarkdown}
                        </pre>
                      ) : (
                        <div className="border-t border-blue-100 pt-2">
                          <p className="font-medium text-gray-800">Scenario</p>
                          <p className="mt-1">{lesson.scenario}</p>
                          <p className="font-medium text-gray-800 mt-3">Solution</p>
                          <p className="mt-1">{lesson.solution}</p>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )})}
            </div>
          )}
        </div>
      )}

      {extraction && hasNoNetNewAgentContent && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-900 mb-1">No net-new agent content detected</h3>
          <p className="text-sm text-green-800">
            {hasAnyExtraction
              ? 'All suggested items look duplicative of existing knowledge. Use the merge options above to add context to the existing files.'
              : 'This reads as clean, customer-only guidance — nothing new for agent training surfaced.'}
          </p>
        </div>
      )}

      {extraction && hasNetNewCandidates && !hasSelectedExtraction && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-1">No agent-training items selected yet</h3>
          <p className="text-sm text-blue-800">Select net-new items above to create draft Engram files, or merge duplicates into existing files.</p>
        </div>
      )}

      {analysis.beforeAfter && !isAgentImport && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700">Before & After Comparison</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-200 px-4 py-2">
                <span className="font-medium text-gray-700 text-sm uppercase">Before (Your Notes)</span>
              </div>
              <div className="p-4 bg-white m-2 rounded border text-sm text-gray-600 max-h-96 overflow-y-auto whitespace-pre-wrap">
                {analysis.beforeAfter.before}
              </div>
            </div>
            
            <div className="bg-green-50 border-2 border-green-400 rounded-lg overflow-hidden shadow-sm">
              <div className="bg-green-100 px-4 py-2 flex justify-between items-center">
                <span className="font-medium text-green-800 text-sm uppercase">After (AI Polished)</span>
                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">✏️ Click to edit</span>
              </div>
              <div className="p-4">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={12}
                  className="w-full p-3 border-2 border-green-300 rounded text-sm font-mono bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  disabled={versionLocked}
                />
                {!versionLocked && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    ✏️ Make it your own — edit anything above
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {analysis.missingContentSections?.length > 0 && !versionLocked && !isAgentImport && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-medium text-orange-900 mb-3">💡 Suggested Sections to Add</h3>
          <div className="space-y-3">
            {analysis.missingContentSections.map((section: MissingSection, i: number) => {
              const isAdded = addedSections.includes(section.sectionTitle);
              const isExpanded = expandedSections.includes(i);
              
              return (
                <div key={i} className={`p-4 rounded border ${isAdded ? 'border-green-400 bg-green-50' : 'border-orange-300 bg-white'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{section.sectionTitle}</h4>
                    {isAdded ? (
                      <span className="text-xs px-3 py-1 bg-green-100 text-green-800 rounded-full">✓ Added</span>
                    ) : (
                      <button 
                        onClick={() => addSectionToFinal(section.content, section.sectionTitle)}
                        className="text-xs px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 font-medium"
                      >
                        + Add This Section
                      </button>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">
                    {isExpanded ? section.content : section.content.substring(0, 200)}
                    {section.content.length > 200 && !isExpanded && '...'}
                  </div>
                  {section.content.length > 200 && (
                    <button onClick={() => toggleSection(i)} className="text-xs text-orange-600 hover:underline">
                      {isExpanded ? 'Show less' : 'Read full content'}
                    </button>
                  )}
                  
                  <p className="text-xs text-orange-700 italic mt-2">💭 {section.whyImportant}</p>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 pt-4 border-t border-orange-200">
            <button onClick={applyVersion} className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Apply This Version
            </button>
          </div>
        </div>
      )}

      {!versionLocked &&
        (!analysis.missingContentSections || analysis.missingContentSections.length === 0) &&
        !isAgentImport && (
        <button onClick={applyVersion} className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Apply This Version
        </button>
      )}

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
                  className={`px-3 py-1 rounded-full text-sm transition-all ${isAdded ? 'bg-green-600 text-white' : 'bg-white text-green-800 border border-green-300 hover:bg-green-100'}`}
                >
                  {isAdded ? '✓ ' : '+ '}{tag}
                </button>
              );
            })}
          </div>
          {data.tags && data.tags.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-sm font-medium text-green-900">Selected ({data.tags.length}): {data.tags.join(', ')}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t">
        <button
          onClick={onContinue}
          disabled={!versionLocked}
          className={`px-6 py-3 rounded-lg font-medium ${versionLocked ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          {versionLocked ? 'Continue to Metadata →' : 'Apply version to continue'}
        </button>
      </div>
    </div>
  );
}
