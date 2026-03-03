import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import yaml from 'js-yaml';
import matter from 'gray-matter';
import { EngramFormData, CONTENT_TYPE_CONFIG } from '@/types/engram';

type ExtractionConcept = {
  title: string;
  content: string;
  forEngram?: string;
  mergeStrategy?: 'append' | 'replace';
};
type ExtractionLesson = {
  title: string;
  scenario: string;
  solution: string;
  forEngram?: string;
  mergeStrategy?: 'append' | 'replace';
};
type EngramGroup = { engramTitle: string; concepts: ExtractionConcept[]; lessons: ExtractionLesson[] };
type IndexEntry = { title: string; fileName: string };
type SourceInfo = { id: string; type: 'customer' | 'internal' | 'agent'; hash: string };

function getRequiredIntegrationNames(formData: EngramFormData): string[] {
  const list = (formData as any)?.aiAnalysis?.requiredIntegrations || [];
  if (!Array.isArray(list)) return [];
  return list
    .map((item: any) => item?.name || item)
    .map((name: any) => String(name).trim())
    .filter(Boolean);
}

export function transformToEngram(formData: EngramFormData) {
  const engramId = slugify(formData.title);
  const config = CONTENT_TYPE_CONFIG[formData.contentType];
  
  const files: Record<string, string> = {};
  const requiredIntegrations = getRequiredIntegrationNames(formData);

  if (formData.contentType === 'agent' && formData.agentImportMode === 'monolith') {
    const extractedConcepts = formData.agentExtraction?.concepts?.filter((c) => c.include) || [];
    const extractedLessons = formData.agentExtraction?.lessons?.filter((l) => l.include) || [];
    const mergeConcepts = formData.agentExtraction?.concepts?.filter((c) => c.mergeTargetPath) || [];
    const mergeLessons = formData.agentExtraction?.lessons?.filter((l) => l.mergeTargetPath) || [];
    const replaceConcepts = mergeConcepts.filter((c) => c.mergeStrategy === 'replace');
    const appendConcepts = mergeConcepts.filter((c) => c.mergeStrategy !== 'replace');
    const replaceLessons = mergeLessons.filter((l) => l.mergeStrategy === 'replace');
    const appendLessons = mergeLessons.filter((l) => l.mergeStrategy !== 'replace');

    const grouped = groupAgentExtracts(extractedConcepts, extractedLessons, engramId);
    const repoRoot = getRepoRoot();
    const sourceInfo: SourceInfo = {
      id: engramId,
      type: 'agent',
      hash: computeSourceHash(formData.title || engramId, formData.rawContent || ''),
    };
    const modeLookup = new Map(
      (formData.agentEngramModes || [])
        .filter((entry) => entry.include !== false)
        .map((entry) => [entry.engramId, entry.mode])
    );

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
          sourceInfo,
          mode: modeLookup.get(targetEngramId) || 'knowledge',
        });
      }

      const conceptEntries: IndexEntry[] = [];
      const lessonEntries: IndexEntry[] = [];

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
          sourceInfo,
          conceptId
        );
        conceptEntries.push({ title: concept.title, fileName });
      });

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
          sourceInfo,
          lessonId
        );
        lessonEntries.push({ title: lesson.title, fileName });
      });

      if (!createdIndex && (conceptEntries.length > 0 || lessonEntries.length > 0)) {
        const existingContent = fs.readFileSync(indexPath, 'utf-8');
        const updatedContent = updateIndexWithEntries(existingContent, conceptEntries, lessonEntries);
        files[`engrams-v2/${targetEngramId}/_index.md`] = updatedContent;
      }

      if (createdIndex && (conceptEntries.length > 0 || lessonEntries.length > 0)) {
        const indexContent = generateAutoEngramIndexMd({
          engramId: targetEngramId,
          title: group.engramTitle,
          description: `Auto-extracted agent materials from imported skill: ${formData.title}.`,
          category: formData.category,
          tags: formData.tags || [],
          sourceInfo,
          conceptEntries,
          lessonEntries,
          requiredIntegrations,
        });
        files[`engrams-v2/${targetEngramId}/_index.md`] = indexContent;
      }
    }

    if (replaceConcepts.length > 0 || replaceLessons.length > 0) {
      replaceConcepts.forEach((concept) => {
        if (!concept.mergeTargetPath) return;
        const fullPath = path.join(repoRoot, concept.mergeTargetPath);
        const existing = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '';
        files[concept.mergeTargetPath] = replaceConceptFile(existing, concept, sourceInfo, engramId);
      });
      replaceLessons.forEach((lesson) => {
        if (!lesson.mergeTargetPath) return;
        const fullPath = path.join(repoRoot, lesson.mergeTargetPath);
        const existing = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '';
        files[lesson.mergeTargetPath] = replaceLessonFile(existing, lesson, sourceInfo, engramId);
      });
    }

    if (appendConcepts.length > 0 || appendLessons.length > 0) {
      const mergeUpdates = buildMergeUpdates(appendConcepts, appendLessons, sourceInfo);
      mergeUpdates.forEach((blocks, targetPath) => {
        const fullPath = path.join(repoRoot, targetPath);
        const existing = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '';
        const updated = appendMergeBlocks(existing, blocks);
        files[targetPath] = updated;
      });
    }
  } else if (formData.contentType === 'customer' || formData.contentType === 'internal') {
    if (formData.contentType === 'customer') {
      files[`customer-pages/${engramId}/_index.md`] = generateCustomerPageMd(formData, engramId);
    } else {
      files[`concepts/${engramId}/_index.md`] = generateConceptMd(formData, engramId);
    }

    const extractedConcepts = formData.agentExtraction?.concepts?.filter((c) => c.include) || [];
    const extractedLessons = formData.agentExtraction?.lessons?.filter((l) => l.include) || [];
    const mergeConcepts = formData.agentExtraction?.concepts?.filter((c) => c.mergeTargetPath) || [];
    const mergeLessons = formData.agentExtraction?.lessons?.filter((l) => l.mergeTargetPath) || [];
    const replaceConcepts = mergeConcepts.filter((c) => c.mergeStrategy === 'replace');
    const appendConcepts = mergeConcepts.filter((c) => c.mergeStrategy !== 'replace');
    const replaceLessons = mergeLessons.filter((l) => l.mergeStrategy === 'replace');
    const appendLessons = mergeLessons.filter((l) => l.mergeStrategy !== 'replace');

    const grouped = groupAgentExtracts(extractedConcepts, extractedLessons, engramId);
    const repoRoot = getRepoRoot();
    const sourceInfo: SourceInfo = {
      id: engramId,
      type: formData.contentType === 'customer' ? 'customer' : 'internal',
      hash: computeSourceHash(formData.title || engramId, formData.rawContent || ''),
    };
    const modeLookup = new Map(
      (formData.agentEngramModes || [])
        .filter((entry) => entry.include !== false)
        .map((entry) => [entry.engramId, entry.mode])
    );

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
          sourceInfo,
          mode: modeLookup.get(targetEngramId) || 'knowledge',
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
          sourceInfo,
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
          sourceInfo,
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
          description: `Auto-extracted agent materials from ${formData.contentType} content: ${formData.title}.`,
          category: formData.category,
          tags: formData.tags || [],
          sourceInfo,
          conceptEntries,
          lessonEntries,
          requiredIntegrations,
        });
        files[`engrams-v2/${targetEngramId}/_index.md`] = indexContent;
      }
    }

    if (replaceConcepts.length > 0 || replaceLessons.length > 0) {
      replaceConcepts.forEach((concept) => {
        if (!concept.mergeTargetPath) return;
        const fullPath = path.join(repoRoot, concept.mergeTargetPath);
        const existing = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '';
        files[concept.mergeTargetPath] = replaceConceptFile(existing, concept, sourceInfo, engramId);
      });
      replaceLessons.forEach((lesson) => {
        if (!lesson.mergeTargetPath) return;
        const fullPath = path.join(repoRoot, lesson.mergeTargetPath);
        const existing = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '';
        files[lesson.mergeTargetPath] = replaceLessonFile(existing, lesson, sourceInfo, engramId);
      });
    }

    if (appendConcepts.length > 0 || appendLessons.length > 0) {
      const mergeUpdates = buildMergeUpdates(appendConcepts, appendLessons, sourceInfo);
      mergeUpdates.forEach((blocks, targetPath) => {
        const fullPath = path.join(repoRoot, targetPath);
        const existing = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '';
        const updated = appendMergeBlocks(existing, blocks);
        files[targetPath] = updated;
      });
    }
  } else {
    files[`engrams-v2/${engramId}/_index.md`] = generateIndexMd(formData, engramId, requiredIntegrations);
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

function generateAutoConceptMd(
  concept: ExtractionConcept,
  parentId: string,
  sourceInfo: SourceInfo,
  conceptId: string
): string {
  const today = getTodayDate();
  const sourceField =
    sourceInfo.type === 'internal'
      ? { source_internal_doc: sourceInfo.id }
      : sourceInfo.type === 'agent'
      ? { source_agent_skill: sourceInfo.id }
      : { source_customer_page: sourceInfo.id };
  const sourceTag =
    sourceInfo.type === 'internal'
      ? 'internal-content-derived'
      : sourceInfo.type === 'agent'
      ? 'agent-skill-derived'
      : 'customer-content-derived';
  const frontmatter = {
    engram_id: parentId,
    concept_id: conceptId,
    title: concept.title,
    type: 'concept',
    auto_extracted: true,
    for_engram: concept.forEngram || 'general',
    last_verified: today,
    ...sourceField,
    source_hash: sourceInfo.hash,
    tags: ['auto-extracted', sourceTag],
  };

  const sourceNote =
    sourceInfo.type === 'internal'
      ? 'Auto-extracted from internal reference content.'
      : sourceInfo.type === 'agent'
      ? 'Auto-extracted from an imported skill file.'
      : 'Auto-extracted from customer-facing content.';

  return (
    '---\n' +
    yaml.dump(frontmatter) +
    '---\n# ' +
    concept.title +
    '\n\n' +
    concept.content +
    `\n\n---\n*${sourceNote} Review for accuracy before using in agent training.*`
  );
}

function generateAutoLessonMd(
  lesson: ExtractionLesson,
  parentId: string,
  sourceInfo: SourceInfo,
  lessonId: string
): string {
  const sourceField =
    sourceInfo.type === 'internal'
      ? { source_internal_doc: sourceInfo.id }
      : sourceInfo.type === 'agent'
      ? { source_agent_skill: sourceInfo.id }
      : { source_customer_page: sourceInfo.id };
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
    ...sourceField,
    source_hash: sourceInfo.hash,
  };

  const sourceNote =
    sourceInfo.type === 'internal'
      ? 'Auto-extracted from internal reference content.'
      : sourceInfo.type === 'agent'
      ? 'Auto-extracted from an imported skill file.'
      : 'Auto-extracted from customer-facing content.';

  return (
    '---\n' +
    yaml.dump(frontmatter) +
    '---\n# ' +
    lesson.title +
    '\n\n## Scenario\n' +
    lesson.scenario +
    '\n\n## Solution\n' +
    lesson.solution +
    `\n\n---\n*${sourceNote} Review before using in agent training.*`
  );
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

function generateIndexMd(data: EngramFormData, engramId: string, requiredIntegrations: string[]): string {
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
    required_integrations: requiredIntegrations || [],
  };

  const conceptsList = data.concepts?.map(c => '- [' + slugify(c.title) + '](concepts/' + slugify(c.title) + '.md) — ' + c.title).join('\n') || '- No concepts yet';
  const lessonsList = data.lessons?.map(l => '- [' + (l.date || '2024-01-01') + '-' + slugify(l.title) + '](lessons/' + (l.date || '2024-01-01') + '-' + slugify(l.title) + '.md) — ' + l.title).join('\n') || '- No lessons yet';
  const integrationsList = (requiredIntegrations && requiredIntegrations.length > 0)
    ? requiredIntegrations.map((item) => `- ${item}`).join('\n')
    : '- None listed';

  return '---\n' + yaml.dump(frontmatter) + '---\n# ' + data.title + '\n\n' + (data.description || '') + '\n\n## SKILL\nFile: SKILL.md\nCore procedure for this engram.\n\n## REQUIRED INTEGRATIONS\n' + integrationsList + '\n\n## CONCEPTS\n' + conceptsList + '\n\n## LESSONS\n' + lessonsList;
}

function generateSkillMd(data: EngramFormData, engramId: string): string {
  const profile = data.agentProfile || {};
  const mode = profile.skillMode || 'procedure';
  const skillType = mode === 'knowledge' ? 'knowledge' : (profile.skillType || 'procedural');
  const frontmatter = {
    engram_id: engramId,
    type: 'skill',
    mode,
    skill_type: skillType,
    domain: profile.domain || '',
    subdomains: profile.subdomains || [],
    trigger_questions: profile.triggerQuestions || [],
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
  if (profile.domain || (profile.subdomains && profile.subdomains.length > 0)) {
    const domainLines = [];
    if (profile.domain) domainLines.push(`- Domain: ${profile.domain}`);
    if (profile.subdomains && profile.subdomains.length > 0) {
      domainLines.push(`- Subdomains: ${profile.subdomains.join(', ')}`);
    }
    sections.push(`## Knowledge Classification\n${domainLines.join('\n')}`);
  }
  if (profile.triggerQuestions && profile.triggerQuestions.length > 0) {
    sections.push(`## Trigger Questions\n${profile.triggerQuestions.map((t) => `- ${t}`).join('\n')}`);
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

  const hasSteps = Array.isArray(data.skill.steps) && data.skill.steps.length > 0;
  const steps =
    data.skill.steps?.map((step, index) => {
      const title = step.title?.trim();
      const header = title ? `### Step ${index + 1}: ${title}` : `### Step ${index + 1}`;
      const typeLabel = step.type ? `\nType: ${step.type}` : '';
      const body = step.content ? `\n${step.content}` : '';
      return `${header}${typeLabel}${body}`;
    }).join('\n\n') || '';

  if (mode === 'knowledge' && !hasSteps) {
    sections.push('## Steps (Optional)\n\nNo procedural steps required. Answer using the knowledge sections below.');
  } else {
    sections.push(`## Steps${mode === 'knowledge' ? ' (Optional)' : ''}\n\n${steps || '### Step 1\\nType: text\\nAdd step-by-step instructions.'}`);
  }

  return '---\n' + yaml.dump(frontmatter) + '---\n# ' + data.title + '\n\n' + sections.join('\n\n');
}

function generateConceptFileMd(concept: any, engramId: string): string {
  const today = getTodayDate();
  const frontmatter = {
    engram_id: engramId,
    concept_id: slugify(concept.title),
    title: concept.title,
    type: 'concept',
    last_verified: today,
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
  sourceInfo: SourceInfo
): Map<string, { marker: string; content: string }[]> {
  const updates = new Map<string, { marker: string; content: string }[]>();

  const pushUpdate = (path: string, block: { marker: string; content: string }) => {
    if (!updates.has(path)) updates.set(path, []);
    updates.get(path)!.push(block);
  };

  concepts.forEach((concept, index) => {
    if (!concept.mergeTargetPath) return;
    const marker = `<!-- auto-extracted:${sourceInfo.type}:${sourceInfo.id}:concept:${slugify(concept.title || `concept-${index + 1}`)} -->`;
    const content =
      `\n\n${marker}\n` +
      `## Added Context (Auto-extracted)\n` +
      `Source: ${sourceInfo.id}\n\n` +
      `${concept.content}\n`;
    pushUpdate(concept.mergeTargetPath, { marker, content });
  });

  lessons.forEach((lesson, index) => {
    if (!lesson.mergeTargetPath) return;
    const marker = `<!-- auto-extracted:${sourceInfo.type}:${sourceInfo.id}:lesson:${slugify(lesson.title || `lesson-${index + 1}`)} -->`;
    const content =
      `\n\n${marker}\n` +
      `## Added Context (Auto-extracted)\n` +
      `Source: ${sourceInfo.id}\n\n` +
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

function replaceConceptFile(
  existingContent: string,
  concept: ExtractionConcept,
  sourceInfo: SourceInfo,
  fallbackEngramId: string
): string {
  const today = getTodayDate();
  const parsed = matter(existingContent || '');
  const existing = parsed.data || {};
  const title = concept.title || existing.title || 'Untitled Concept';
  const engramId = existing.engram_id || resolveTargetEngramId(concept.forEngram, fallbackEngramId);
  const conceptId = existing.concept_id || slugify(title);
  const tags = Array.isArray(existing.tags) ? existing.tags : [];
  const mergedTags = Array.from(new Set([...tags, 'auto-extracted']));
  const sourceField =
    sourceInfo.type === 'internal'
      ? { source_internal_doc: sourceInfo.id }
      : sourceInfo.type === 'agent'
      ? { source_agent_skill: sourceInfo.id }
      : { source_customer_page: sourceInfo.id };

  const frontmatter = {
    ...existing,
    engram_id: engramId,
    concept_id: conceptId,
    title,
    type: 'concept',
    tags: mergedTags,
    last_verified: today,
    updated: new Date().toISOString(),
    auto_extracted: true,
    ...sourceField,
    source_hash: sourceInfo.hash,
  };

  return (
    '---\n' +
    yaml.dump(frontmatter) +
    '---\n# ' +
    title +
    '\n\n' +
    (concept.content || parsed.content || '')
  );
}

function replaceLessonFile(
  existingContent: string,
  lesson: ExtractionLesson,
  sourceInfo: SourceInfo,
  fallbackEngramId: string
): string {
  const today = getTodayDate();
  const parsed = matter(existingContent || '');
  const existing = parsed.data || {};
  const title = lesson.title || existing.title || 'Untitled Lesson';
  const engramId = existing.engram_id || resolveTargetEngramId(lesson.forEngram, fallbackEngramId);
  const lessonId = existing.lesson_id || `${today}-${slugify(title)}`;
  const sourceField =
    sourceInfo.type === 'internal'
      ? { source_internal_doc: sourceInfo.id }
      : sourceInfo.type === 'agent'
      ? { source_agent_skill: sourceInfo.id }
      : { source_customer_page: sourceInfo.id };

  const frontmatter = {
    ...existing,
    engram_id: engramId,
    lesson_id: lessonId,
    date: existing.date || today,
    title,
    type: 'lesson',
    updated: new Date().toISOString(),
    auto_extracted: true,
    ...sourceField,
    source_hash: sourceInfo.hash,
  };

  return (
    '---\n' +
    yaml.dump(frontmatter) +
    '---\n# ' +
    title +
    '\n\n## Scenario\n' +
    (lesson.scenario || '') +
    '\n\n## Solution\n' +
    (lesson.solution || '')
  );
}

function generateAutoEngramIndexMd(params: {
  engramId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  sourceInfo: SourceInfo;
  conceptEntries: IndexEntry[];
  lessonEntries: IndexEntry[];
  requiredIntegrations: string[];
}): string {
  const tags = Array.from(new Set([...(params.tags || []), 'auto-extracted']));
  const sourceField =
    params.sourceInfo.type === 'internal'
      ? { source_internal_doc: params.sourceInfo.id }
      : params.sourceInfo.type === 'agent'
      ? { source_agent_skill: params.sourceInfo.id }
      : { source_customer_page: params.sourceInfo.id };
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
    required_integrations: params.requiredIntegrations || [],
    ...sourceField,
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

  const integrationsList = (params.requiredIntegrations && params.requiredIntegrations.length > 0)
    ? params.requiredIntegrations.map((item) => `- ${item}`).join('\n')
    : '- None listed';

  return (
    '---\n' +
    yaml.dump(frontmatter) +
    '---\n# ' +
    params.title +
    '\n\n' +
    params.description +
    '\n\n## SKILL\nFile: SKILL.md\nCore procedure for this engram.\n\n## REQUIRED INTEGRATIONS\n' +
    integrationsList +
    '\n\n## CONCEPTS\n' +
    conceptsList +
    '\n\n## LESSONS\n' +
    lessonsList
  );
}

function generateAutoSkillMd(params: {
  engramId: string;
  title: string;
  sourceInfo: SourceInfo;
  mode: 'procedure' | 'knowledge';
}): string {
  const frontmatter = {
    engram_id: params.engramId,
    type: 'skill',
    mode: params.mode,
    skill_type: params.mode === 'procedure' ? 'procedural' : 'knowledge',
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
    ...(params.sourceInfo.type === 'internal'
      ? { source_internal_doc: params.sourceInfo.id }
      : params.sourceInfo.type === 'agent'
      ? { source_agent_skill: params.sourceInfo.id }
      : { source_customer_page: params.sourceInfo.id }),
  };

  const sourceNote =
    params.sourceInfo.type === 'internal'
      ? 'Auto-extracted from internal reference content.'
      : params.sourceInfo.type === 'agent'
      ? 'Auto-extracted from an imported skill file.'
      : 'Auto-extracted from customer-facing content.';

  return (
    '---\n' +
    yaml.dump(frontmatter) +
    '---\n# ' +
    params.title +
    `\n\n${sourceNote} Add outcome, triggers, and step-by-step instructions before use.`
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

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function computeSourceHash(title: string, content: string): string {
  return crypto.createHash('sha256').update(`${title}\n${content}`).digest('hex');
}

export function validateEngramForm(data: EngramFormData): string[] {
  const errors: string[] = [];
  if (!data.title?.trim()) errors.push('Title is required');
  if (!data.category?.trim()) errors.push('Category is required');
  if (!data.rawContent?.trim()) errors.push('Content is required');
  return errors;
}
