'use client';

import { useState } from 'react';
import { EngramFormData, ContentType, CONTENT_TYPE_CONFIG, AgentEngramModeSuggestion } from '@/types/engram';
import { StepIndicator } from '@/components/engram-builder/StepIndicator';
import { ContentTypeSelector } from '@/components/engram-builder/ContentTypeSelector';
import { BasicInfoForm } from '@/components/engram-builder/BasicInfoForm';
import { ContentInputForm } from '@/components/engram-builder/ContentInputForm';
import { AIAnalysisReview } from '@/components/engram-builder/AIAnalysisReview';
import { MetadataForm } from '@/components/engram-builder/MetadataForm';
import { ReviewAndPublish } from '@/components/engram-builder/ReviewAndPublish';

const STEPS = ['Type', 'Info', 'Content', 'AI Analysis', 'Metadata', 'Publish'];
const KNOWLEDGE_HUB_KEYWORDS = ['platform', 'system', 'product', 'overview', 'hub', 'foundation', 'core', 'general'];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);

function collapseKnowledgeModes(
  suggestedModes: any[],
  fallbackId: string,
  fallbackLabel: string
): {
  agentEngramModesArray: AgentEngramModeSuggestion[];
  remapEngram: (forEngram?: string) => string | undefined;
} {
  if (!Array.isArray(suggestedModes) || suggestedModes.length === 0) {
    return {
      agentEngramModesArray: [],
      remapEngram: (forEngram?: string) => forEngram,
    };
  }

  const deduped = Array.from(
    suggestedModes.reduce((map: Map<string, AgentEngramModeSuggestion>, mode: any) => {
      const engramId = slugify(mode.forEngram || fallbackLabel || fallbackId);
      const existing = map.get(engramId);
      if (existing) {
        if (mode.rationale && !existing.rationale?.includes(mode.rationale)) {
          existing.rationale = existing.rationale ? `${existing.rationale} ${mode.rationale}` : mode.rationale;
        }
        return map;
      }
      map.set(engramId, {
        engramId,
        label: mode.forEngram || fallbackLabel || fallbackId,
        mode: mode.mode === 'procedure' ? 'procedure' : 'knowledge',
        rationale: mode.rationale,
        include: true,
      });
      return map;
    }, new Map<string, AgentEngramModeSuggestion>())
  .values());

  const knowledgeModes = deduped.filter((mode) => mode.mode === 'knowledge');
  const procedureModes = deduped.filter((mode) => mode.mode === 'procedure');

  if (knowledgeModes.length <= 1) {
    return {
      agentEngramModesArray: [...knowledgeModes, ...procedureModes],
      remapEngram: (forEngram?: string) => forEngram,
    };
  }

  const hub =
    knowledgeModes.find((mode) =>
      KNOWLEDGE_HUB_KEYWORDS.some((keyword) =>
        (mode.engramId || '').includes(keyword) || (mode.label || '').toLowerCase().includes(keyword)
      )
    ) || knowledgeModes[0];

  const collapsedIds = new Set(
    knowledgeModes.filter((mode) => mode.engramId !== hub.engramId).map((mode) => mode.engramId)
  );

  const remapEngram = (forEngram?: string) => {
    if (!forEngram) return forEngram;
    const slug = slugify(forEngram);
    if (collapsedIds.has(slug)) {
      return hub.label || hub.engramId;
    }
    return forEngram;
  };

  return {
    agentEngramModesArray: [hub, ...procedureModes],
    remapEngram,
  };
}

export default function NewEngramPage() {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<EngramFormData>({
    contentType: 'customer',
    title: '',
    category: '',
    description: '',
    tags: [],
    audience: ['customer'],
    related_engrams: [],
    skill: {
      difficulty: 'intermediate',
      time_estimate: '15-20 minutes',
      prerequisites: [],
      steps: [],
    },
    concepts: [],
    lessons: [],
    rawContent: '',
    aiAnalysis: null,
    agentProfile: {
      skillMode: 'procedure',
      skillType: 'procedural',
      riskLevel: 'medium',
      triggers: [],
      requiredInputs: [],
      constraints: [],
      allowedSystems: [],
      escalationCriteria: [],
      stopConditions: [],
      outcome: '',
      domain: '',
      subdomains: [],
      triggerQuestions: [],
    },
    agentEngramModes: [],
    agentExtraction: null,
    duplicateResolutionConfirmed: false,
    duplicateCheck: null,
  });

  const updateFormData = (updates: Partial<EngramFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const AUTO_INCLUDE_CONFIDENCE = 0.7;
  const shouldAutoInclude = (item: { confidence?: number; riskLevel?: string; duplicate?: { similar: boolean } }) => {
    if (item?.duplicate?.similar) return false;
    if (item?.riskLevel === 'high') return false;
    if (typeof item?.confidence === 'number' && item.confidence < AUTO_INCLUDE_CONFIDENCE) return false;
    return true;
  };

  const handleContentTypeChange = (type: ContentType) => {
    const config = CONTENT_TYPE_CONFIG[type];
    updateFormData({
      contentType: type,
      audience: config.audience as any,
      tags: [...config.defaultTags],
      aiAnalysis: null,
      agentProfile: type === 'agent' ? {
        skillMode: 'procedure',
        skillType: 'procedural',
        riskLevel: 'medium',
        triggers: [],
        requiredInputs: [],
        constraints: [],
        allowedSystems: [],
        escalationCriteria: [],
        stopConditions: [],
        outcome: '',
        domain: '',
        subdomains: [],
        triggerQuestions: [],
      } : undefined,
      agentEngramModes: [],
      agentExtraction: null,
      duplicateResolutionConfirmed: false,
      duplicateCheck: null,
    });
  };

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: formData.rawContent,
          contentType: formData.contentType,
          title: formData.title,
          agentMode: formData.agentProfile?.skillMode,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      const analysis = data.analysis;
      const currentTags = formData.tags || [];
      const newTags = analysis.suggestedTags?.filter((tag: string) => !currentTags.includes(tag)) || [];
      
      if (formData.contentType === 'agent') {
        const skill = analysis.skill || {};
        const isKnowledgeMode = formData.agentProfile?.skillMode === 'knowledge';
        const nextProfile = {
          ...formData.agentProfile,
          skillType: isKnowledgeMode ? 'knowledge' : (formData.agentProfile?.skillType || skill.type || 'procedural'),
          domain: formData.agentProfile?.domain || skill.domain || '',
          subdomains: formData.agentProfile?.subdomains?.length ? formData.agentProfile.subdomains : (skill.subdomains || []),
          triggerQuestions: formData.agentProfile?.triggerQuestions?.length
            ? formData.agentProfile.triggerQuestions
            : (skill.triggerQuestions || []),
          outcome: formData.agentProfile?.outcome || skill.outcome || '',
          riskLevel: formData.agentProfile?.riskLevel || skill.riskLevel || 'medium',
          triggers: formData.agentProfile?.triggers?.length ? formData.agentProfile.triggers : (skill.triggers || []),
          requiredInputs: formData.agentProfile?.requiredInputs?.length ? formData.agentProfile.requiredInputs : (skill.requiredInputs || []),
          constraints: formData.agentProfile?.constraints?.length ? formData.agentProfile.constraints : (skill.constraints || []),
          allowedSystems: formData.agentProfile?.allowedSystems?.length ? formData.agentProfile.allowedSystems : (skill.allowedSystems || []),
          escalationCriteria: formData.agentProfile?.escalationCriteria?.length ? formData.agentProfile.escalationCriteria : (skill.escalationCriteria || []),
          stopConditions: formData.agentProfile?.stopConditions?.length ? formData.agentProfile.stopConditions : (skill.stopConditions || []),
        };

        updateFormData({
          aiAnalysis: analysis,
          agentExtraction: null,
          duplicateResolutionConfirmed: false,
          duplicateCheck: data.duplicateCheck || null,
          skill: {
            ...formData.skill,
            steps: skill.steps || formData.skill.steps,
            prerequisites: skill.prerequisites || formData.skill.prerequisites || [],
          },
          agentProfile: nextProfile,
          concepts: analysis.concepts || formData.concepts || [],
          lessons: analysis.lessons || formData.lessons || [],
          tags: [...currentTags, ...newTags],
        });
      } else if (formData.contentType === 'customer') {
        const suggestedConcepts = analysis?.agentTrainingPotential?.suggestedConcepts || [];
        const suggestedLessons = analysis?.agentTrainingPotential?.suggestedLessons || [];
        const suggestedModes = analysis?.agentTrainingPotential?.engramModes || [];
        const fallbackId = slugify(formData.title || 'engram');
        const { agentEngramModesArray, remapEngram } = collapseKnowledgeModes(
          suggestedModes,
          fallbackId,
          formData.title || fallbackId
        );
        updateFormData({
          aiAnalysis: analysis,
          agentExtraction: {
            concepts: suggestedConcepts.map((concept: any) => ({
              title: concept.title,
              content: concept.content,
              forEngram: remapEngram(concept.forEngram),
              confidence: concept.confidence,
              riskLevel: concept.riskLevel,
              include: shouldAutoInclude(concept),
              previewMarkdown: concept.previewMarkdown,
              mergeTargetPath: undefined,
              mergeTargetTitle: undefined,
              mergeTargetType: undefined,
              duplicate: concept.duplicate,
            })),
            lessons: suggestedLessons.map((lesson: any) => ({
              title: lesson.title,
              scenario: lesson.scenario,
              solution: lesson.solution,
              forEngram: remapEngram(lesson.forEngram),
              confidence: lesson.confidence,
              riskLevel: lesson.riskLevel,
              include: shouldAutoInclude(lesson),
              previewMarkdown: lesson.previewMarkdown,
              mergeTargetPath: undefined,
              mergeTargetTitle: undefined,
              mergeTargetType: undefined,
              duplicate: lesson.duplicate,
            })),
          },
          agentEngramModes: agentEngramModesArray,
          duplicateResolutionConfirmed: false,
          duplicateCheck: data.duplicateCheck || null,
          concepts: analysis.concepts || [],
          tags: [...currentTags, ...newTags],
        });
      } else if (formData.contentType === 'internal') {
        const suggestedConcepts = analysis?.agentTrainingPotential?.suggestedConcepts || [];
        const suggestedLessons = analysis?.agentTrainingPotential?.suggestedLessons || [];
        const suggestedModes = analysis?.agentTrainingPotential?.engramModes || [];
        const fallbackId = slugify(formData.title || 'engram');
        const { agentEngramModesArray, remapEngram } = collapseKnowledgeModes(
          suggestedModes,
          fallbackId,
          formData.title || fallbackId
        );
        updateFormData({
          aiAnalysis: analysis,
          agentExtraction: {
            concepts: suggestedConcepts.map((concept: any) => ({
              title: concept.title,
              content: concept.content,
              forEngram: remapEngram(concept.forEngram),
              confidence: concept.confidence,
              riskLevel: concept.riskLevel,
              include: shouldAutoInclude(concept),
              previewMarkdown: concept.previewMarkdown,
              mergeTargetPath: undefined,
              mergeTargetTitle: undefined,
              mergeTargetType: undefined,
              duplicate: concept.duplicate,
            })),
            lessons: suggestedLessons.map((lesson: any) => ({
              title: lesson.title,
              scenario: lesson.scenario,
              solution: lesson.solution,
              forEngram: remapEngram(lesson.forEngram),
              confidence: lesson.confidence,
              riskLevel: lesson.riskLevel,
              include: shouldAutoInclude(lesson),
              previewMarkdown: lesson.previewMarkdown,
              mergeTargetPath: undefined,
              mergeTargetTitle: undefined,
              mergeTargetType: undefined,
              duplicate: lesson.duplicate,
            })),
          },
          agentEngramModes: agentEngramModesArray,
          duplicateResolutionConfirmed: false,
          duplicateCheck: data.duplicateCheck || null,
          concepts: analysis.sections?.map((s: any) => ({
            title: s.title,
            content: s.content,
          })) || [],
          lessons: analysis.lessons || [],
          tags: [...currentTags, ...newTags],
        });
      }

    } catch (error: any) {
      console.error('Analysis error:', error);
      setAnalysisError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeAndContinue = async () => {
    setStep(4);
    await handleAIAnalysis();
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/engrams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create');
      }

      setSubmitResult(data);
    } catch (error: any) {
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitResult) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4">🎉 Thank You!</h1>
        <p>Your content has been added to the Agora Library.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Create New Content</h1>
      <StepIndicator steps={STEPS} current={step} />
      
      {submitError && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">{submitError}</div>}
      {analysisError && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">{analysisError}</div>}
      
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {step === 1 && <ContentTypeSelector selected={formData.contentType} onChange={handleContentTypeChange} />}
        {step === 2 && <BasicInfoForm data={formData} onChange={updateFormData} contentType={formData.contentType} />}
        {step === 3 && <ContentInputForm data={formData} onChange={updateFormData} contentType={formData.contentType} />}
        {step === 4 && (
          <AIAnalysisReview
            data={formData}
            onChange={updateFormData}
            onAnalyze={handleAIAnalysis}
            onContinue={() => setStep(5)}
            isAnalyzing={isAnalyzing}
          />
        )}
        {step === 5 && <MetadataForm data={formData} onChange={updateFormData} />}
        {step === 6 && (
          <ReviewAndPublish
            data={formData}
            onChange={updateFormData}
            onPublish={handlePublish}
            isSubmitting={isSubmitting}
            contentType={formData.contentType}
          />
        )}
      </div>

      <div className="flex justify-between mt-6">
        <button onClick={() => setStep(step - 1)} disabled={step === 1} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30">Previous</button>
        {step === 3 && (
          <button
            onClick={handleAnalyzeAndContinue}
            disabled={!formData.rawContent || !formData.title || isAnalyzing}
            className="bg-gray-900 text-white px-6 py-3 rounded-lg disabled:opacity-50"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        )}
        {step !== 3 && step !== 4 && step !== 6 && <button onClick={() => setStep(step + 1)} className="bg-gray-900 text-white px-6 py-3 rounded-lg">Next</button>}
      </div>
    </div>
  );
}
