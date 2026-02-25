'use client';

import { useState } from 'react';
import { EngramFormData, ContentType, CONTENT_TYPE_CONFIG } from '@/types/engram';
import { StepIndicator } from '@/components/engram-builder/StepIndicator';
import { ContentTypeSelector } from '@/components/engram-builder/ContentTypeSelector';
import { BasicInfoForm } from '@/components/engram-builder/BasicInfoForm';
import { ContentInputForm } from '@/components/engram-builder/ContentInputForm';
import { AIAnalysisReview } from '@/components/engram-builder/AIAnalysisReview';
import { MetadataForm } from '@/components/engram-builder/MetadataForm';
import { ReviewAndPublish } from '@/components/engram-builder/ReviewAndPublish';

const STEPS = ['Type', 'Info', 'Content', 'AI Review', 'Metadata', 'Publish'];

export default function NewEngramPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<any>(null);
  
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
    aiExtracted: null,
  });

  const updateFormData = (updates: Partial<EngramFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleContentTypeChange = (type: ContentType) => {
    const config = CONTENT_TYPE_CONFIG[type];
    updateFormData({
      contentType: type,
      audience: config.audience as any,
      tags: [...config.defaultTags],
    });
  };

  const handleAIAnalysis = async () => {
    // TODO: Call AI analysis API
    // For now, simulate with basic extraction
    const extracted = {
      title: formData.title,
      steps: formData.rawContent?.split('\n\n').map((p, i) => ({
        title: `Step ${i + 1}`,
        content: p,
        type: 'text' as const,
      })) || [],
      tags: [...(formData.tags || [])],
      category: formData.category,
    };
    
    updateFormData({
      aiExtracted: extracted,
      skill: {
        ...formData.skill,
        steps: extracted.steps,
      },
    });
    
    setStep(5);
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
        throw new Error(data.error || data.errors?.join(', ') || 'Failed to create');
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
        <h1 className="text-2xl font-bold mb-4">Content Created!</h1>
        <div className="space-y-2 text-sm text-left bg-gray-50 p-4 rounded-lg mb-6">
          <p><strong>Type:</strong> {CONTENT_TYPE_CONFIG[formData.contentType].label}</p>
          <p><strong>ID:</strong> {submitResult.engram_id}</p>
          <p><strong>Files:</strong> {submitResult.files_created?.length}</p>
          <p><strong>Commit:</strong> <a href={submitResult.commit_url} target="_blank" className="text-blue-600 hover:underline">View on GitHub</a></p>
        </div>
        <div className="flex gap-4 justify-center">
          <a href="/admin/engrams" className="bg-gray-900 text-white px-6 py-3 rounded-lg">Back to Library</a>
          <button onClick={() => window.location.reload()} className="bg-[#F7FF96] text-gray-900 px-6 py-3 rounded-lg">Create Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Create New Content</h1>
      <StepIndicator steps={STEPS} current={step} />
      
      {submitError && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">{submitError}</div>}
      
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {step === 1 && (
          <ContentTypeSelector 
            selected={formData.contentType} 
            onChange={handleContentTypeChange} 
          />
        )}
        
        {step === 2 && (
          <BasicInfoForm 
            data={formData} 
            onChange={updateFormData}
            contentType={formData.contentType}
          />
        )}
        
        {step === 3 && (
          <ContentInputForm
            data={formData}
            onChange={updateFormData}
            contentType={formData.contentType}
          />
        )}
        
        {step === 4 && (
          <AIAnalysisReview
            data={formData}
            onChange={updateFormData}
            onContinue={handleAIAnalysis}
          />
        )}
        
        {step === 5 && (
          <MetadataForm
            data={formData}
            onChange={updateFormData}
          />
        )}
        
        {step === 6 && (
          <ReviewAndPublish
            data={formData}
            onPublish={handlePublish}
            isSubmitting={isSubmitting}
            contentType={formData.contentType}
          />
        )}
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
          className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30"
        >
          Previous
        </button>
        
        {step < 6 && step !== 4 && (
          <button
            onClick={() => setStep(step + 1)}
            disabled={step === 1 && !formData.contentType}
            className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {step === 3 ? 'Analyze with AI' : 'Next'}
          </button>
        )}
      </div>
    </div>
  );
}
