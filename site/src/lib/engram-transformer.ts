import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { EngramFormData, CONTENT_TYPE_CONFIG } from '@/types/engram';

type ExtractionConcept = { title: string; content: string; forEngram?: string };
type ExtractionLesson = { title: string; scenario: string; solution: string; forEngram?: string };
type EngramGroup = { engramTitle: string; concepts: ExtractionConcept[]; lessons: ExtractionLesson[] };
type IndexEntry = { title: string; fileName: string };

export function transformToEngram(formData: EngramFormData) {
  const engramId = slugify(formData.title);
  const config = CONTENT_TYPE_CONFIG[formData.contentType];
  
  const files: Record<string, string> = {};

  if (formData.contentType === 'customer') {
    files[`customer-pages/${engramId}/_index.md`] = generateCustomerPageMd(formData, engramId);

    const extractedConcepts = formData.agentExtraction?.concepts?.filter((c) => c.include) || [];
    const extractedLessons = formData.agentExtraction?.lessons?.filter((l) => l.include) || [];
    const mergeConcepts = formData.agentExtraction?.concepts?.filter((c) => c.mergeTargetPath) || [];
    const mergeLessons = formData.agentExtraction?.lessons?.filter((l) => l.mergeTargetPath) || [];

    const grouped = groupAgentExtracts(extractedConcepts, extractedLessons, engramId);
    const repoRoot = getRepoRoot();

    for (const [targetEngramId, group] of grouped.entries()) {
      const engramDir = path.join(repoRoot, 'engrams-v2', targetEngramId);
      const indexPath = path.join(engramDir, '_index.md');
      const skillPath = path.join(engramDir, 'SKILL.md');

      const createdIndex = !fs.existsSync(indexPath);
      const createdSkill = !fs.existsSync(skillPath);

      if (createdSkill) {
        files[`engrams-v2/${targetEngramId}/SKILL.md`] = generateAutoSkillMd({
          engramId: targetEngramId,
          title: group.engramTitle,
          sourceCustomerId: engramId,
        });
      }

      const conceptEntries: IndexEntry[] = [];
      const lessonEntries: IndexEntry[] = [];

      // Create concept files
      group.concepts.forEach((concept, i) => {
        const baseSlug = slugify(concept.title || `auto-concept-${i + 1}`);
        const fileName = getUniqueFileName(
          path.join(engramDir, 'concepts'),
          baseSlug,
          '.md',
          files,
          `engrams-v2/${targetEngramId}/concepts/`
        );
        const conceptId = fileName.replace(/\.md$/, '');
        files[`engrams-v2/${targetEngramId}/concepts/${fileName}`] = generateAutoConceptMd(
          concept,
          targetEngramId,
          engramId,
          conceptId
        );
        conceptEntries.push({ title: concept.title, fileName });
      });

      // Create lesson files
      group.lessons.forEach((lesson, i) => {
        const datePrefix = new Date().toISOString().split('T')[0];
        const baseSlug = `${datePrefix}-${slugify(lesson.title || `auto-lesson-${i + 1}`)}`;
        const fileName = getUniqueFileName(
          path.join(engramDir, 'lessons'),
          baseSlug,
          '.md',
          files,
          `engrams-v2/${targetEngramId}/lessons/`
        );
        const lessonId = fileName.replace(/\.md$/, '');
        files[`engrams-v2/${targetEngramId}/lessons/${fileName}`] = generateAutoLessonMd(
          lesson,
          targetEngramId,
          engramId,
          lessonId
        );
        lessonEntries.push({ title: lesson.title, fileName });
      });

      // Update existing index to include new files
      if (!createdIndex && (conceptEntries.length > 0 || lessonEntries.length > 0)) {
        const existingContent = fs.readFileSync(indexPath, 'utf-8');
        const updatedContent = updateIndexWithEntries(existingContent, conceptEntries, lessonEntries);
        files[`engrams-v2/${targetEngramId}/_index.md`] = updatedContent;
      }

      if (createdIndex && (conceptEntries.length > 0 || lessonEntries.length > 0)) {
        const indexContent = generateAutoEngramIndexMd({
          engramId: targetEngramId,
          title: group.engramTitle,
          description: `Auto-extracted agent materials from customer content: ${formData.title}.`,
          category: formData.category,
          tags: formData.tags || [],
          sourceCustomerId: engramId,
          conceptEntries,
          lessonEntries,
        });
        files[`engrams-v2/${targetEngramId}/_index.md`] = indexContent;
      }
    }

    if (mergeConcepts.length > 0 || mergeLessons.length > 0) {
      const mergeUpdates = buildMergeUpdates(mergeConcepts, mergeLessons, engramId);
      mergeUpdates.forEach((blocks, targetPath) => {
        const fullPath = path.join(repoRoot, targetPath);
        const existing = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '';
        const updated = appendMergeBlocks(existing, blocks);
        files[targetPath] = updated;
      });
    }
  } else if (formData.contentType === 'internal') {
    files[`concepts/${engramId}/_index.md`] = generateConceptMd(formData, engramId);
  } else {
    files[`engrams-v2/${engramId}/_index.md`] = generateIndexMd(formData, engramId);
    files[`engrams-v2/${engramId}/SKILL.md`] = generateSkillMd(formData, engramId);
    
    if (formData.concepts?.length) {
      formData.concepts.forEach((concept, i) => {
        files[`engrams-v2/${engramId}/concepts/${slugify(concept.title)}.md`] = generateConceptFileMd(concept, engramId);
      });
    }
    if (formData.lessons?.length) {
      formData.lessons.forEach((lesson, i) => {
        files[`engrams-v2/${engramId}/lessons/${lesson.date || '2024-01-01'}-${slugify(lesson.title)}.md`] = generateLessonMd(lesson, engramId);
      });
    }
  }

  return {
    id: engramId,
    files,
    outputPath: config.outputPath,
    autoExtracted: formData.contentType === 'customer' ? {
      concepts: formData.agentExtraction?.concepts?.filter((c) => c.include).length || 0,
      lessons: formData.agentExtraction?.lessons?.filter((l) => l.include).length || 0,
    } : null,
  };
}

function generateAutoConceptMd(concept: ExtractionConcept, parentId: string, sourceCustomerId: string, conceptId: string): string {
  const frontmatter = {
    engram_id: parentId,
    concept_id: conceptId,
    title: concept.title,
    type: 'concept',
    auto_extracted: true,
    for_engram: concept.forEngram || 'general',
    source_customer_page: sourceCustomerId,
    tags: ['auto-extracted', 'customer-content-derived'],
  };

  return '---\n' + yaml.dump(frontmatter) + '---\n# ' + concept.title + '\n\n' + concept.content + '\n\n---\n*Auto-extracted from customer-facing content. Review for accuracy before using in agent training.*';
}

function generateAutoLessonMd(lesson: ExtractionLesson, parentId: string, sourceCustomerId: string, lessonId: string): string {
  const frontmatter = {
    engram_id: parentId,
    lesson_id: lessonId,
    date: lessonId.split('-').slice(0, 3).join('-'),
    title: lesson.title,
    type: 'lesson',
    auto_extracted: true,
    for_engram: lesson.forEngram || 'general',
    severity: 'medium',
    author: 'ai-extraction@venturehome.com',
    source_customer_page: sourceCustomerId,
  };

  return '---\n' + yaml.dump(frontmatter) + '---\n# ' + lesson.title + '\n\n## Scenario\n' + lesson.scenario + '\n\n## Solution\n' + lesson.solution + '\n\n---\n*Auto-extracted from customer-facing content. Review before using in agent training.*';
}

function generateCustomerPageMd(data: EngramFormData, id: string): string {
  const hasAgentDerivatives =
    (data.agentExtraction?.concepts?.some((c) => c.include || !!c.mergeTargetPath) ||
      data.agentExtraction?.lessons?.some((l) => l.include || !!l.mergeTargetPath)) ||
    false;

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
    has_agent_training_derivatives: hasAgentDerivatives,
  };

  return '---\n' + yaml.dump(frontmatter) + '---\n# ' + data.title + '\n\n' + (data.description || '') + '\n\n' + (data.rawContent || '');
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

  return '---\n' + yaml.dump(frontmatter) + '---\n# ' + data.title + '\n\n' + (data.description || '') + '\n\n' + (data.rawContent || '');
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

  const conceptsList = data.concepts?.map(c => '- [' + slugify(c.title) + '](concepts/' + slugify(c.title) + '.md) — ' + c.title).join('\n') || '- No concepts yet';
  const lessonsList = data.lessons?.map(l => '- [' + (l.date || '2024-01-01') + '-' + slugify(l.title) + '](lessons/' + (l.date || '2024-01-01') + '-' + slugify(l.title) + '.md) — ' + l.title).join('\n') || '- No lessons yet';

  return '---\n' + yaml.dump(frontmatter) + '---\n# ' + data.title + '\n\n' + (data.description || '') + '\n\n## SKILL\nFile: SKILL.md\nCore procedure for this engram.\n\n## CONCEPTS\n' + conceptsList + '\n\n## LESSONS\n' + lessonsList;
}

function generateSkillMd(data: EngramFormData, engramId: string): string {
  const profile = data.agentProfile || {};
  const frontmatter = {
    engram_id: engramId,
    type: 'skill',
    skill_type: profile.skillType || 'procedural',
    outcome: profile.outcome || '',
    risk_level: profile.riskLevel || 'medium',
    triggers: profile.triggers || [],
    required_inputs: profile.requiredInputs || [],
    constraints: profile.constraints || [],
    allowed_systems: profile.allowedSystems || [],
    escalation_criteria: profile.escalationCriteria || [],
    stop_conditions: profile.stopConditions || [],
    difficulty: data.skill.difficulty || 'intermediate',
    time_estimate: data.skill.time_estimate || '15-20 minutes',
    prerequisites: data.skill.prerequisites || [],
  };

  const sections: string[] = [];
  if (data.description) {
    sections.push(data.description.trim());
  }
  if (profile.outcome) {
    sections.push(`## Outcome\n${profile.outcome}`);
  }
  if (profile.triggers && profile.triggers.length > 0) {
    sections.push(`## Triggers\n${profile.triggers.map((t) => `- ${t}`).join('\n')}`);
  }
  if (profile.requiredInputs && profile.requiredInputs.length > 0) {
    sections.push(`## Required Inputs\n${profile.requiredInputs.map((t) => `- ${t}`).join('\n')}`);
  }
  if (profile.constraints && profile.constraints.length > 0) {
    sections.push(`## Constraints\n${profile.constraints.map((t) => `- ${t}`).join('\n')}`);
  }
  if (profile.allowedSystems && profile.allowedSystems.length > 0) {
    sections.push(`## Allowed Systems\n${profile.allowedSystems.map((t) => `- ${t}`).join('\n')}`);
  }
  if (profile.escalationCriteria && profile.escalationCriteria.length > 0) {
    sections.push(`## Escalation Criteria\n${profile.escalationCriteria.map((t) => `- ${t}`).join('\n')}`);
  }
  if (profile.stopConditions && profile.stopConditions.length > 0) {
    sections.push(`## Stop Conditions\n${profile.stopConditions.map((t) => `- ${t}`).join('\n')}`);
  }
  if (data.skill.prerequisites && data.skill.prerequisites.length > 0) {
    sections.push(`## Prerequisites\n${data.skill.prerequisites.map((t) => `- ${t}`).join('\n')}`);
  }

  const steps =
    data.skill.steps?.map((step, index) => {
      const title = step.title?.trim();
      const header = title ? `### Step ${index + 1}: ${title}` : `### Step ${index + 1}`;
      const typeLabel = step.type ? `\nType: ${step.type}` : '';
      const body = step.content ? `\n${step.content}` : '';
      return `${header}${typeLabel}${body}`;
    }).join('\n\n') || '### Step 1\nType: text\nAdd step-by-step instructions.';

  sections.push(`## Steps\n\n${steps}`);

  return '---\n' + yaml.dump(frontmatter) + '---\n# ' + data.title + '\n\n' + sections.join('\n\n');
}

function generateConceptFileMd(concept: any, engramId: string): string {
  const frontmatter = {
    engram_id: engramId,
    concept_id: slugify(concept.title),
    title: concept.title,
    type: 'concept',
    tags: concept.tags || [],
  };

  return '---\n' + yaml.dump(frontmatter) + '---\n# ' + concept.title + '\n\n' + concept.content;
}

function generateLessonMd(lesson: any, engramId: string): string {
  const frontmatter = {
    engram_id: engramId,
    lesson_id: (lesson.date || '2024-01-01') + '-' + slugify(lesson.title),
    date: lesson.date || '2024-01-01',
    author: lesson.author || 'rex@venturehome.com',
    severity: lesson.severity || 'medium',
  };

  return '---\n' + yaml.dump(frontmatter) + '---\n# ' + lesson.title + '\n\n' + lesson.content;
}

function buildMergeUpdates(
  concepts: Array<ExtractionConcept & { mergeTargetPath?: string }>,
  lessons: Array<ExtractionLesson & { mergeTargetPath?: string }>,
  sourceCustomerId: string
): Map<string, { marker: string; content: string }[]> {
  const updates = new Map<string, { marker: string; content: string }[]>();

  const pushUpdate = (path: string, block: { marker: string; content: string }) => {
    if (!updates.has(path)) updates.set(path, []);
    updates.get(path)!.push(block);
  };

  concepts.forEach((concept, index) => {
    if (!concept.mergeTargetPath) return;
    const marker = `<!-- auto-extracted:customer:${sourceCustomerId}:concept:${slugify(concept.title || `concept-${index + 1}`)} -->`;
    const content =
      `\n\n${marker}\n` +
      `## Added Context (Auto-extracted)\n` +
      `Source: ${sourceCustomerId}\n\n` +
      `${concept.content}\n`;
    pushUpdate(concept.mergeTargetPath, { marker, content });
  });

  lessons.forEach((lesson, index) => {
    if (!lesson.mergeTargetPath) return;
    const marker = `<!-- auto-extracted:customer:${sourceCustomerId}:lesson:${slugify(lesson.title || `lesson-${index + 1}`)} -->`;
    const content =
      `\n\n${marker}\n` +
      `## Added Context (Auto-extracted)\n` +
      `Source: ${sourceCustomerId}\n\n` +
      `### Scenario\n` +
      `${lesson.scenario || ''}\n\n` +
      `### Solution\n` +
      `${lesson.solution || ''}\n`;
    pushUpdate(lesson.mergeTargetPath, { marker, content });
  });

  return updates;
}

function appendMergeBlocks(existing: string, blocks: { marker: string; content: string }[]): string {
  let updated = existing || '';
  blocks.forEach((block) => {
    if (!updated.includes(block.marker)) {
      updated += block.content;
    }
  });
  return updated;
}

function generateAutoEngramIndexMd(params: {
  engramId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  sourceCustomerId: string;
  conceptEntries: IndexEntry[];
  lessonEntries: IndexEntry[];
}): string {
  const tags = Array.from(new Set([...(params.tags || []), 'auto-extracted']));
  const frontmatter = {
    id: params.engramId,
    title: params.title,
    description: params.description,
    category: params.category,
    tags,
    audience: ['agent'],
    content_type: 'engram',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    version: '1.0',
    auto_extracted: true,
    source_customer_page: params.sourceCustomerId,
  };

  const conceptsList = params.conceptEntries.length
    ? params.conceptEntries
        .map((entry) => `- [${entry.fileName.replace(/\.md$/, '')}](concepts/${entry.fileName}) — ${entry.title}`)
        .join('\n')
    : '- No concepts yet';

  const lessonsList = params.lessonEntries.length
    ? params.lessonEntries
        .map((entry) => `- [${entry.fileName.replace(/\.md$/, '')}](lessons/${entry.fileName}) — ${entry.title}`)
        .join('\n')
    : '- No lessons yet';

  return (
    '---\n' +
    yaml.dump(frontmatter) +
    '---\n# ' +
    params.title +
    '\n\n' +
    params.description +
    '\n\n## SKILL\nFile: SKILL.md\nCore procedure for this engram.\n\n## CONCEPTS\n' +
    conceptsList +
    '\n\n## LESSONS\n' +
    lessonsList
  );
}

function generateAutoSkillMd(params: { engramId: string; title: string; sourceCustomerId: string }): string {
  const frontmatter = {
    engram_id: params.engramId,
    type: 'skill',
    skill_type: 'procedural',
    outcome: '',
    risk_level: 'medium',
    triggers: [],
    required_inputs: [],
    constraints: [],
    allowed_systems: [],
    escalation_criteria: [],
    stop_conditions: [],
    difficulty: 'intermediate',
    time_estimate: '10-15 minutes',
    prerequisites: [],
    auto_extracted: true,
    source_customer_page: params.sourceCustomerId,
  };

  return (
    '---\n' +
    yaml.dump(frontmatter) +
    '---\n# ' +
    params.title +
    '\n\nAuto-extracted draft. Add outcome, triggers, and step-by-step instructions before use.'
  );
}

function groupAgentExtracts(
  concepts: ExtractionConcept[],
  lessons: ExtractionLesson[],
  fallbackEngramId: string
): Map<string, EngramGroup> {
  const groups = new Map<string, EngramGroup>();

  const ensureGroup = (engramKey: string, titleHint?: string) => {
    if (!groups.has(engramKey)) {
      const fallbackTitle = humanizeTitle(engramKey);
      groups.set(engramKey, {
        engramTitle: titleHint ? humanizeTitle(titleHint) : fallbackTitle,
        concepts: [],
        lessons: [],
      });
    }
  };

  concepts.forEach((concept) => {
    const targetId = resolveTargetEngramId(concept.forEngram, fallbackEngramId);
    ensureGroup(targetId, concept.forEngram || fallbackEngramId);
    groups.get(targetId)!.concepts.push(concept);
  });

  lessons.forEach((lesson) => {
    const targetId = resolveTargetEngramId(lesson.forEngram, fallbackEngramId);
    ensureGroup(targetId, lesson.forEngram || fallbackEngramId);
    groups.get(targetId)!.lessons.push(lesson);
  });

  return groups;
}

function resolveTargetEngramId(forEngram: string | undefined, fallbackEngramId: string): string {
  const raw = (forEngram || '').trim();
  if (!raw) return slugify(fallbackEngramId);
  return slugify(raw);
}

function humanizeTitle(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function updateIndexWithEntries(
  content: string,
  conceptEntries: IndexEntry[],
  lessonEntries: IndexEntry[]
): string {
  let updated = content;

  if (conceptEntries.length > 0) {
    updated = appendEntriesToSection(updated, 'CONCEPTS', conceptEntries, 'concepts/');
  }

  if (lessonEntries.length > 0) {
    updated = appendEntriesToSection(updated, 'LESSONS', lessonEntries, 'lessons/');
  }

  return updated;
}

function appendEntriesToSection(
  content: string,
  sectionTitle: string,
  entries: IndexEntry[],
  pathPrefix: string
): string {
  const header = `## ${sectionTitle}`;
  const existing = entries.filter((entry) => !content.includes(`${pathPrefix}${entry.fileName}`));
  if (existing.length === 0) return content;

  const lines = existing
    .map((entry) => `- [${entry.fileName.replace(/\.md$/, '')}](${pathPrefix}${entry.fileName}) — ${entry.title}`)
    .join('\n');

  const headerIndex = content.indexOf(header);
  if (headerIndex === -1) {
    return `${content}\n\n${header}\n${lines}\n`;
  }

  const nextHeaderIndex = content.indexOf('\n## ', headerIndex + header.length);
  if (nextHeaderIndex === -1) {
    return `${content.trimEnd()}\n${lines}\n`;
  }

  const before = content.slice(0, nextHeaderIndex);
  const after = content.slice(nextHeaderIndex);
  return `${before.trimEnd()}\n${lines}\n${after}`;
}

function getRepoRoot(): string {
  return path.join(process.cwd(), '..');
}

function getUniqueFileName(
  dirPath: string,
  baseSlug: string,
  extension: string,
  existingFiles: Record<string, string>,
  pathPrefix: string
): string {
  let candidate = `${baseSlug}${extension}`;
  let counter = 2;
  while (
    fs.existsSync(path.join(dirPath, candidate)) ||
    Object.prototype.hasOwnProperty.call(existingFiles, `${pathPrefix}${candidate}`)
  ) {
    candidate = `${baseSlug}-${counter}${extension}`;
    counter += 1;
  }
  return candidate;
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
