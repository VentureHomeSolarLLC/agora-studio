import yaml from 'js-yaml';
import { EngramFormData } from '@/types/engram';

export function transformToEngram(formData: EngramFormData) {
  const engramId = slugify(formData.title);
  const files: Record<string, string> = {
    '_index.md': generateIndexMd(formData, engramId),
    'SKILL.md': generateSkillMd(formData, engramId),
  };

  if (formData.concepts?.length) {
    for (const concept of formData.concepts) {
      files[`concepts/${slugify(concept.title)}.md`] = generateConceptMd(concept, engramId);
    }
  }

  if (formData.lessons?.length) {
    for (const lesson of formData.lessons) {
      files[`lessons/${lesson.date}-${slugify(lesson.title)}.md`] = generateLessonMd(lesson, engramId);
    }
  }

  return { id: engramId, files };
}

function generateIndexMd(data: EngramFormData, engramId: string): string {
  const frontmatter = {
    id: engramId,
    title: data.title,
    description: data.description || '',
    category: data.category,
    tags: data.tags || [],
    audience: data.audience || ['agent'],
    related_engrams: data.related_engrams || [],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    version: '1.0',
  };

  const conceptLinks = data.concepts?.map(c => {
    const id = slugify(c.title);
    return `- [${id}](concepts/${id}.md) — ${c.title}`;
  }).join('\n') || '- No concepts yet';

  const lessonLinks = data.lessons?.map(l => {
    const id = `${l.date}-${slugify(l.title)}`;
    return `- [${id}](lessons/${id}.md) — ${l.title}`;
  }).join('\n') || '- No lessons yet';

  return `---
${yaml.dump(frontmatter)}---
# ${data.title}

${data.description || ''}

## SKILL
File: \`SKILL.md\`
Core procedure for this engram.

## CONCEPTS
${conceptLinks}

## LESSONS
${lessonLinks}

## RELATED
- Add related engrams here
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

  let stepsContent = '';
  if (data.skill.steps?.length) {
    stepsContent = data.skill.steps.map((step, index) => {
      const stepNum = index + 1;
      let stepText = `## Step ${stepNum}: ${step.title}\n\n${step.content}`;
      if (step.type === 'checkbox') {
        stepText += '\n\n- [ ] Complete this step';
      }
      return stepText;
    }).join('\n\n');
  }

  return `---
${yaml.dump(frontmatter)}---
# ${data.title}

${stepsContent}
`;
}

function generateConceptMd(concept: any, engramId: string): string {
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
  if (!data.skill?.steps?.length) errors.push('At least one skill step is required');
  data.skill?.steps?.forEach((step, i) => {
    if (!step.title?.trim()) errors.push(`Step ${i + 1} is missing a title`);
  });
  return errors;
}
