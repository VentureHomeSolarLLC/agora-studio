import yaml from 'js-yaml';
import { EngramFormData, CONTENT_TYPE_CONFIG } from '@/types/engram';

export function transformToEngram(formData: EngramFormData) {
  const engramId = slugify(formData.title);
  const config = CONTENT_TYPE_CONFIG[formData.contentType];
  const analysis = formData.aiAnalysis;
  
  const files: Record<string, string> = {};

  // Customer content
  if (formData.contentType === 'customer') {
    files['_index.md'] = generateCustomerPageMd(formData, engramId);
    
    // Auto-extract agent training materials if they exist
    if (analysis?.agentTrainingPotential?.suggestedConcepts?.length > 0) {
      analysis.agentTrainingPotential.suggestedConcepts.forEach((concept: any, i: number) => {
        files[`concepts/auto-extracted-${i + 1}.md`] = generateAutoConceptMd(concept, engramId);
      });
    }
    if (analysis?.agentTrainingPotential?.suggestedLessons?.length > 0) {
      analysis.agentTrainingPotential.suggestedLessons.forEach((lesson: any, i: number) => {
        files[`lessons/auto-extracted-${i + 1}.md`] = generateAutoLessonMd(lesson, engramId);
      });
    }
  } 
  // Internal content
  else if (formData.contentType === 'internal') {
    files['_index.md'] = generateConceptMd(formData, engramId);
  } 
  // Agent instructions
  else {
    files['_index.md'] = generateIndexMd(formData, engramId);
    files['SKILL.md'] = generateSkillMd(formData, engramId);
    
    if (formData.concepts?.length) {
      formData.concepts.forEach((concept, i) => {
        files[`concepts/${slugify(concept.title)}.md`] = generateConceptFileMd(concept, engramId);
      });
    }
    if (formData.lessons?.length) {
      formData.lessons.forEach((lesson, i) => {
        files[`lessons/${lesson.date || '2024-01-01'}-${slugify(lesson.title)}.md`] = generateLessonMd(lesson, engramId);
      });
    }
  }

  return {
    id: engramId,
    files,
    outputPath: config.outputPath,
    autoExtracted: analysis?.agentTrainingPotential ? {
      concepts: analysis.agentTrainingPotential.suggestedConcepts?.length || 0,
      lessons: analysis.agentTrainingPotential.suggestedLessons?.length || 0,
    } : null,
  };
}

function generateAutoConceptMd(concept: any, parentId: string): string {
  const frontmatter = {
    engram_id: parentId,
    concept_id: slugify(concept.title),
    title: concept.title,
    type: 'concept',
    auto_extracted: true,
    for_engram: concept.forEngram || 'general',
    tags: ['auto-extracted', 'customer-content-derived'],
  };

  return `---
${yaml.dump(frontmatter)}---
# ${concept.title}

${concept.content}

---
*Auto-extracted from customer-facing content. Review for accuracy before using in agent training.*
`;
}

function generateAutoLessonMd(lesson: any, parentId: string): string {
  const frontmatter = {
    engram_id: parentId,
    lesson_id: `${new Date().toISOString().split('T')[0]}-${slugify(lesson.title)}`,
    date: new Date().toISOString().split('T')[0],
    title: lesson.title,
    type: 'lesson',
    auto_extracted: true,
    for_engram: lesson.forEngram || 'general',
    severity: 'medium',
    author: 'ai-extraction@venturehome.com',
  };

  return `---
${yaml.dump(frontmatter)}---
# ${lesson.title}

## Scenario
${lesson.scenario}

## Solution
${lesson.solution}

---
*Auto-extracted from customer-facing content. Review before using in agent training.*
`;
}

function generateCustomerPageMd(data: EngramFormData, id: string): string {
  const frontmatter = {
    id,
    title: data.title,
    description: data.description || '',
    category: data.category,
    tags: data.tags || [],
    audience: ['customer'],
    content_type: 'customer-page',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    has_agent_training_derivatives: data.aiAnalysis?.agentTrainingPotential?.hasExtractableContent || false,
  };

  return `---
${yaml.dump(frontmatter)}---
# ${data.title}

${data.description || ''}

${data.rawContent || ''}
`;
}

function generateConceptMd(data: EngramFormData, id: string): string {
  const frontmatter = {
    id,
    title: data.title,
    description: data.description || '',
    category: data.category,
    tags: data.tags || [],
    audience: data.audience || ['internal'],
    content_type: 'concept',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };

  return `---
${yaml.dump(frontmatter)}---
# ${data.title}

${data.description || ''}

${data.rawContent || ''}
`;
}

function generateIndexMd(data: EngramFormData, engramId: string): string {
  const frontmatter = {
    id: engramId,
    title: data.title,
    description: data.description || '',
    category: data.category,
    tags: data.tags || [],
    audience: data.audience || ['agent'],
    content_type: 'engram',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    version: '1.0',
  };

  return `---
${yaml.dump(frontmatter)}---
# ${data.title}

${data.description || ''}

## SKILL
File: \\`SKILL.md\\`
Core procedure for this engram.

## CONCEPTS
${data.concepts?.map(c => `- [${slugify(c.title)}](concepts/${slugify(c.title)}.md) — ${c.title}`).join('\\n') || '- No concepts yet'}

## LESSONS
${data.lessons?.map(l => `- [${l.date || '2024-01-01'}-${slugify(l.title)}](lessons/${l.date || '2024-01-01'}-${slugify(l.title)}.md) — ${l.title}`).join('\\n') || '- No lessons yet'}
`;
}

function generateSkillMd(data: EngramFormData, engramId: string): string {
  const frontmatter = {
    engram_id: engramId,
    type: 'skill',
    difficulty: data.skill.difficulty || 'intermediate',
    time_estimate: data.skill.time_estimate || '15-20 minutes',
    prerequisites: data.skill.prerequisites || [],
  };

  const steps = data.skill.steps?.map((step, index) => {
    let text = `## Step ${index + 1}: ${step.title}\\n\\n${step.content}`;
    if (step.type === 'checkbox') {
      text += '\\n\\n- [ ] Complete this step';
    }
    return text;
  }).join('\\n\\n') || '';

  return `---
${yaml.dump(frontmatter)}---
# ${data.title}

${steps}
`;
}

function generateConceptFileMd(concept: any, engramId: string): string {
  const frontmatter = {
    engram_id: engramId,
    concept_id: slugify(concept.title),
    title: concept.title,
    type: 'concept',
    tags: concept.tags || [],
  };

  return `---
${yaml.dump(frontmatter)}---
# ${concept.title}

${concept.content}
`;
}

function generateLessonMd(lesson: any, engramId: string): string {
  const frontmatter = {
    engram_id: engramId,
    lesson_id: `${lesson.date || '2024-01-01'}-${slugify(lesson.title)}`,
    date: lesson.date || '2024-01-01',
    author: lesson.author || 'rex@venturehome.com',
    severity: lesson.severity || 'medium',
  };

  return `---
${yaml.dump(frontmatter)}---
# ${lesson.title}

${lesson.content}
`;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 50);
}

export function validateEngramForm(data: EngramFormData): string[] {
  const errors: string[] = [];
  if (!data.title?.trim()) errors.push('Title is required');
  if (!data.category?.trim()) errors.push('Category is required');
  if (!data.rawContent?.trim()) errors.push('Content is required');
  return errors;
}
