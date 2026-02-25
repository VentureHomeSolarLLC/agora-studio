import yaml from 'js-yaml';
import { EngramFormData, CONTENT_TYPE_CONFIG } from '@/types/engram';

export function transformToEngram(formData: EngramFormData) {
  const engramId = slugify(formData.title);
  const config = CONTENT_TYPE_CONFIG[formData.contentType];
  
  const files: Record<string, string> = {};

  // Different output based on content type
  if (formData.contentType === 'customer') {
    // Customer page - single markdown file
    files['_index.md'] = generateCustomerPageMd(formData, engramId);
  } else if (formData.contentType === 'internal') {
    // Internal reference - concept format
    files['_index.md'] = generateConceptMd(formData, engramId);
  } else {
    // Agent instructions - full engram structure
    files['_index.md'] = generateIndexMd(formData, engramId);
    files['SKILL.md'] = generateSkillMd(formData, engramId);
    
    if (formData.concepts?.length) {
      for (const concept of formData.concepts) {
        files[`concepts/${slugify(concept.title)}.md`] = generateConceptFileMd(concept, engramId);
      }
    }
    
    if (formData.lessons?.length) {
      for (const lesson of formData.lessons) {
        files[`lessons/${lesson.date}-${slugify(lesson.title)}.md`] = generateLessonMd(lesson, engramId);
      }
    }
  }

  return {
    id: engramId,
    files,
    outputPath: config.outputPath,
  };
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
File: \`SKILL.md\`
Core procedure for this engram.

## CONCEPTS
${data.concepts?.map(c => `- [${slugify(c.title)}](concepts/${slugify(c.title)}.md) — ${c.title}`).join('\n') || '- No concepts yet'}

## LESSONS
${data.lessons?.map(l => `- [${l.date}-${slugify(l.title)}](lessons/${l.date}-${slugify(l.title)}.md) — ${l.title}`).join('\n') || '- No lessons yet'}
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
    let text = `## Step ${index + 1}: ${step.title}\n\n${step.content}`;
    if (step.type === 'checkbox') {
      text += '\n\n- [ ] Complete this step';
    }
    return text;
  }).join('\n\n') || '';

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
    lesson_id: `${lesson.date}-${slugify(lesson.title)}`,
    date: lesson.date,
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
