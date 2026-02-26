import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

const customerDir = path.join(repoRoot, 'customer-pages');
const internalDir = path.join(repoRoot, 'concepts');
const engramsDir = path.join(repoRoot, 'engrams-v2');

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('OPENAI_API_KEY is required');
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);

const computeHash = (title, content) =>
  crypto.createHash('sha256').update(`${title}\n${content}`).digest('hex');

const readSourceFile = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return { data, content };
};

const loadSourcesFromDir = (dirPath, type) => {
  const sources = new Map();
  if (!fs.existsSync(dirPath)) return sources;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const slug = entry.name.replace(/\.md$/, '');
      const filePath = path.join(dirPath, entry.name);
      const { data, content } = readSourceFile(filePath);
      const title = data.title || slug;
      const hash = computeHash(title, content);
      sources.set(`${type}:${slug}`, {
        type,
        id: slug,
        title,
        content,
        hash,
        data,
      });
      continue;
    }

    if (entry.isDirectory()) {
      const indexPath = path.join(dirPath, entry.name, '_index.md');
      if (!fs.existsSync(indexPath)) continue;
      const { data, content } = readSourceFile(indexPath);
      const title = data.title || entry.name;
      const hash = computeHash(title, content);
      sources.set(`${type}:${entry.name}`, {
        type,
        id: entry.name,
        title,
        content,
        hash,
        data,
      });
    }
  }

  return sources;
};

const loadAutoExtracted = () => {
  const grouped = new Map();
  if (!fs.existsSync(engramsDir)) return grouped;

  const engramEntries = fs.readdirSync(engramsDir, { withFileTypes: true });
  for (const engramEntry of engramEntries) {
    if (!engramEntry.isDirectory()) continue;
    const engramId = engramEntry.name;
    const baseDir = path.join(engramsDir, engramId);
    const conceptDir = path.join(baseDir, 'concepts');
    const lessonDir = path.join(baseDir, 'lessons');

    for (const [dir, kind] of [
      [conceptDir, 'concept'],
      [lessonDir, 'lesson'],
    ]) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
      for (const file of files) {
        const filePath = path.join(dir, file);
        const { data, content } = matter(fs.readFileSync(filePath, 'utf-8'));
        if (!data.auto_extracted) continue;
        const sourceId = data.source_customer_page || data.source_internal_doc;
        if (!sourceId) continue;
        const sourceType = data.source_internal_doc ? 'internal' : 'customer';
        const key = `${sourceType}:${sourceId}`;
        const entry = {
          path: filePath,
          fileName: file,
          engramId,
          kind,
          data,
          content,
          title: data.title || file,
          slugKey: slugify(data.title || file),
          sourceHash: data.source_hash || '',
        };
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(entry);
      }
    }
  }

  return grouped;
};

const analyzeCustomer = async (title, content) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are a seasoned solar and home electrification expert writing for homeowners.\n\nReturn JSON with:\n- agentTrainingPotential: {\n    hasExtractableContent: boolean,\n    suggestedConcepts: [{title, content, forEngram: string}],\n    suggestedLessons: [{title, scenario, solution, forEngram: string}],\n    engramModes: [{forEngram: string, mode: procedure | knowledge, rationale: string}]\n  }\n\nWhen assigning engramModes, use procedure if the content implies a repeatable process; otherwise use knowledge.`,
      },
      {
        role: 'user',
        content: `Title: ${title}\n\nContent:\n${content}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 2000,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
};

const analyzeInternal = async (title, content) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `Analyze internal docs for the Venture Home team.\n\nReturn JSON with:\n- agentTrainingPotential: {\n    hasExtractableContent: boolean,\n    suggestedConcepts: [{title, content, forEngram: string}],\n    suggestedLessons: [{title, scenario, solution, forEngram: string}],\n    engramModes: [{forEngram: string, mode: procedure | knowledge, rationale: string}]\n  }\n\nUse procedure mode only when the content describes a repeatable process; otherwise use knowledge.`,
      },
      {
        role: 'user',
        content: `Title: ${title}\n\nContent:\n${content}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 2000,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
};

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const toSourceField = (sourceInfo) =>
  sourceInfo.type === 'internal'
    ? { source_internal_doc: sourceInfo.id }
    : { source_customer_page: sourceInfo.id };

const renderAutoConcept = (concept, engramId, sourceInfo, conceptId) => {
  const frontmatter = {
    engram_id: engramId,
    concept_id: conceptId,
    title: concept.title,
    type: 'concept',
    auto_extracted: true,
    for_engram: concept.forEngram || 'general',
    ...toSourceField(sourceInfo),
    source_hash: sourceInfo.hash,
    tags: [
      'auto-extracted',
      sourceInfo.type === 'internal' ? 'internal-content-derived' : 'customer-content-derived',
    ],
  };

  return (
    '---\n' +
    yaml.dump(frontmatter) +
    '---\n# ' +
    concept.title +
    '\n\n' +
    concept.content +
    '\n\n---\n*Auto-extracted from source content. Review for accuracy before using in agent training.*'
  );
};

const renderAutoLesson = (lesson, engramId, sourceInfo, lessonId, date) => {
  const frontmatter = {
    engram_id: engramId,
    lesson_id: lessonId,
    date,
    title: lesson.title,
    type: 'lesson',
    auto_extracted: true,
    for_engram: lesson.forEngram || 'general',
    severity: 'medium',
    author: 'ai-extraction@venturehome.com',
    ...toSourceField(sourceInfo),
    source_hash: sourceInfo.hash,
  };

  return (
    '---\n' +
    yaml.dump(frontmatter) +
    '---\n# ' +
    lesson.title +
    '\n\n## Scenario\n' +
    (lesson.scenario || '') +
    '\n\n## Solution\n' +
    (lesson.solution || '') +
    '\n\n---\n*Auto-extracted from source content. Review before using in agent training.*'
  );
};

const renderAutoSkill = (engramId, title, sourceInfo, mode) => {
  const frontmatter = {
    engram_id: engramId,
    type: 'skill',
    mode,
    skill_type: mode === 'procedure' ? 'procedural' : 'knowledge',
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
    ...toSourceField(sourceInfo),
  };

  return (
    '---\n' +
    yaml.dump(frontmatter) +
    '---\n# ' +
    title +
    '\n\nAuto-extracted draft. Add outcome, triggers, and step-by-step instructions before use.'
  );
};

const renderAutoIndex = (engramId, title, description, category, tags, sourceInfo, conceptEntries, lessonEntries) => {
  const tagSet = Array.from(new Set([...(tags || []), 'auto-extracted']));
  const frontmatter = {
    id: engramId,
    title,
    description,
    category,
    tags: tagSet,
    audience: ['agent'],
    content_type: 'engram',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    version: '1.0',
    auto_extracted: true,
    ...toSourceField(sourceInfo),
  };

  const conceptsList = conceptEntries.length
    ? conceptEntries
        .map((entry) => `- [${entry.fileName.replace(/\.md$/, '')}](concepts/${entry.fileName}) — ${entry.title}`)
        .join('\n')
    : '- No concepts yet';

  const lessonsList = lessonEntries.length
    ? lessonEntries
        .map((entry) => `- [${entry.fileName.replace(/\.md$/, '')}](lessons/${entry.fileName}) — ${entry.title}`)
        .join('\n')
    : '- No lessons yet';

  return (
    '---\n' +
    yaml.dump(frontmatter) +
    '---\n# ' +
    title +
    '\n\n' +
    description +
    '\n\n## SKILL\nFile: SKILL.md\nCore procedure for this engram.\n\n## CONCEPTS\n' +
    conceptsList +
    '\n\n## LESSONS\n' +
    lessonsList
  );
};

const groupSuggestions = (concepts, lessons, fallbackId) => {
  const groups = new Map();
  const ensure = (key, titleHint) => {
    if (!groups.has(key)) {
      const human = titleHint ? titleHint : key.replace(/[-_]/g, ' ');
      groups.set(key, { title: human, concepts: [], lessons: [] });
    }
  };

  concepts.forEach((concept) => {
    const targetId = slugify(concept.forEngram || fallbackId);
    ensure(targetId, concept.forEngram || fallbackId);
    groups.get(targetId).concepts.push(concept);
  });

  lessons.forEach((lesson) => {
    const targetId = slugify(lesson.forEngram || fallbackId);
    ensure(targetId, lesson.forEngram || fallbackId);
    groups.get(targetId).lessons.push(lesson);
  });

  return groups;
};

const updateIndexEntries = (indexPath, conceptEntries, lessonEntries, removedConceptFiles, removedLessonFiles) => {
  if (!fs.existsSync(indexPath)) return;
  let content = fs.readFileSync(indexPath, 'utf-8');

  const removeLines = (text, filenames) => {
    if (filenames.length === 0) return text;
    const lines = text.split('\n');
    const filtered = lines.filter((line) => !filenames.some((name) => line.includes(name)));
    return filtered.join('\n');
  };

  content = removeLines(content, removedConceptFiles.map((name) => `concepts/${name}`));
  content = removeLines(content, removedLessonFiles.map((name) => `lessons/${name}`));

  const appendToSection = (text, header, entries) => {
    if (entries.length === 0) return text;
    const headerLine = `## ${header}`;
    const lines = entries
      .map((entry) => `- [${entry.fileName.replace(/\.md$/, '')}](${header.toLowerCase()}/${entry.fileName}) — ${entry.title}`)
      .join('\n');

    const index = text.indexOf(headerLine);
    if (index === -1) {
      return `${text.trimEnd()}\n\n${headerLine}\n${lines}\n`;
    }

    const nextHeader = text.indexOf('\n## ', index + headerLine.length);
    if (nextHeader === -1) {
      return `${text.trimEnd()}\n${lines}\n`;
    }

    const before = text.slice(0, nextHeader).trimEnd();
    const after = text.slice(nextHeader);
    return `${before}\n${lines}\n${after}`;
  };

  content = appendToSection(content, 'CONCEPTS', conceptEntries);
  content = appendToSection(content, 'LESSONS', lessonEntries);

  fs.writeFileSync(indexPath, content);
};

const main = async () => {
  const sources = new Map([
    ...loadSourcesFromDir(customerDir, 'customer'),
    ...loadSourcesFromDir(internalDir, 'internal'),
  ]);

  const autoExtracted = loadAutoExtracted();
  const sourceKeys = Array.from(autoExtracted.keys());

  if (sourceKeys.length === 0) {
    console.log('No auto-extracted files found.');
    return;
  }

  let updatedSources = 0;

  for (const key of sourceKeys) {
    const source = sources.get(key);
    if (!source) {
      console.log(`Source missing for ${key}; skipping.`);
      continue;
    }

    const files = autoExtracted.get(key) || [];
    const needsUpdate = files.some((file) => file.sourceHash !== source.hash);
    if (!needsUpdate) continue;

    updatedSources += 1;
    console.log(`Re-extracting ${key}...`);

    let analysis;
    try {
      analysis = source.type === 'customer'
        ? await analyzeCustomer(source.title, source.content)
        : await analyzeInternal(source.title, source.content);
    } catch (err) {
      console.error(`Failed to analyze ${key}:`, err);
      continue;
    }

    const potential = analysis?.agentTrainingPotential || {};
    const suggestedConcepts = Array.isArray(potential.suggestedConcepts) ? potential.suggestedConcepts : [];
    const suggestedLessons = Array.isArray(potential.suggestedLessons) ? potential.suggestedLessons : [];
    const engramModes = Array.isArray(potential.engramModes) ? potential.engramModes : [];

    const fallbackId = slugify(source.id);
    const grouped = groupSuggestions(suggestedConcepts, suggestedLessons, fallbackId);
    const modeLookup = new Map(
      engramModes.map((mode) => [slugify(mode.forEngram || source.id), mode.mode === 'procedure' ? 'procedure' : 'knowledge'])
    );

    // organize existing files by engram/kind/slug
    const existingMap = new Map();
    for (const file of files) {
      if (!existingMap.has(file.engramId)) existingMap.set(file.engramId, { concept: new Map(), lesson: new Map() });
      existingMap.get(file.engramId)[file.kind].set(file.slugKey, file);
    }

    const keepPaths = new Set();
    const today = new Date().toISOString().split('T')[0];

    for (const [engramId, group] of grouped.entries()) {
      const engramDir = path.join(engramsDir, engramId);
      const conceptDir = path.join(engramDir, 'concepts');
      const lessonDir = path.join(engramDir, 'lessons');
      ensureDir(conceptDir);
      ensureDir(lessonDir);

      const indexPath = path.join(engramDir, '_index.md');
      const skillPath = path.join(engramDir, 'SKILL.md');

      const conceptEntries = [];
      const lessonEntries = [];

      const engramMode = modeLookup.get(engramId) || 'knowledge';
      if (!fs.existsSync(indexPath)) {
        const indexContent = renderAutoIndex(
          engramId,
          group.title,
          `Auto-extracted agent materials from ${source.type} content: ${source.title}.`,
          source.data?.category || 'other',
          source.data?.tags || [],
          { type: source.type, id: source.id, hash: source.hash },
          [],
          []
        );
        fs.writeFileSync(indexPath, indexContent);
      }

      if (!fs.existsSync(skillPath)) {
        const skillContent = renderAutoSkill(
          engramId,
          group.title,
          { type: source.type, id: source.id, hash: source.hash },
          engramMode
        );
        fs.writeFileSync(skillPath, skillContent);
      }

      const existingForEngram = existingMap.get(engramId) || { concept: new Map(), lesson: new Map() };

      for (const concept of group.concepts) {
        const keySlug = slugify(concept.title || 'concept');
        const existing = existingForEngram.concept.get(keySlug);
        if (existing) {
          const conceptId = existing.data.concept_id || keySlug;
          const content = renderAutoConcept(concept, engramId, { type: source.type, id: source.id, hash: source.hash }, conceptId);
          fs.writeFileSync(existing.path, content);
          keepPaths.add(existing.path);
          conceptEntries.push({ title: concept.title, fileName: existing.fileName });
          continue;
        }

        const fileName = `${keySlug}.md`;
        let finalName = fileName;
        let counter = 2;
        while (fs.existsSync(path.join(conceptDir, finalName))) {
          finalName = `${keySlug}-${counter}.md`;
          counter += 1;
        }
        const conceptId = finalName.replace(/\.md$/, '');
        const content = renderAutoConcept(concept, engramId, { type: source.type, id: source.id, hash: source.hash }, conceptId);
        fs.writeFileSync(path.join(conceptDir, finalName), content);
        keepPaths.add(path.join(conceptDir, finalName));
        conceptEntries.push({ title: concept.title, fileName: finalName });
      }

      for (const lesson of group.lessons) {
        const keySlug = slugify(lesson.title || 'lesson');
        const existing = existingForEngram.lesson.get(keySlug);
        if (existing) {
          const lessonId = existing.data.lesson_id || `${today}-${keySlug}`;
          const date = existing.data.date || today;
          const content = renderAutoLesson(lesson, engramId, { type: source.type, id: source.id, hash: source.hash }, lessonId, date);
          fs.writeFileSync(existing.path, content);
          keepPaths.add(existing.path);
          lessonEntries.push({ title: lesson.title, fileName: existing.fileName });
          continue;
        }

        let fileName = `${today}-${keySlug}.md`;
        let counter = 2;
        while (fs.existsSync(path.join(lessonDir, fileName))) {
          fileName = `${today}-${keySlug}-${counter}.md`;
          counter += 1;
        }
        const lessonId = fileName.replace(/\.md$/, '');
        const content = renderAutoLesson(lesson, engramId, { type: source.type, id: source.id, hash: source.hash }, lessonId, today);
        fs.writeFileSync(path.join(lessonDir, fileName), content);
        keepPaths.add(path.join(lessonDir, fileName));
        lessonEntries.push({ title: lesson.title, fileName });
      }

      const removedConcepts = files
        .filter((f) => f.engramId === engramId && f.kind === 'concept' && !keepPaths.has(f.path))
        .map((f) => f.fileName);
      const removedLessons = files
        .filter((f) => f.engramId === engramId && f.kind === 'lesson' && !keepPaths.has(f.path))
        .map((f) => f.fileName);

      updateIndexEntries(indexPath, conceptEntries, lessonEntries, removedConcepts, removedLessons);
    }

    // Remove old auto-extracted files not kept
    for (const file of files) {
      if (!keepPaths.has(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }

  console.log(`Updated sources: ${updatedSources}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
