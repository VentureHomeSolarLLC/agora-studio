import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import crypto from 'crypto';
import yaml from 'js-yaml';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { content, contentType, title, agentMode, importMode } = await request.json();

    if (!content || !contentType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Check for duplicates first
    const duplicateCheck = await checkForDuplicates(title, content, contentType);

    let analysis;
    switch (contentType) {
      case 'customer':
        analysis = await analyzeCustomerContent(content, title);
        analysis = enrichAgentTrainingPotential(analysis);
        analysis = attachExtractionPreviews(analysis, 'customer', title, content);
        break;
      case 'internal':
        analysis = await analyzeInternalContent(content, title);
        analysis = enrichAgentTrainingPotential(analysis);
        analysis = attachExtractionPreviews(analysis, 'internal', title, content);
        break;
      case 'agent':
        if (importMode === 'monolith') {
          analysis = await analyzeAgentImport(content, title);
          analysis = enrichAgentTrainingPotential(analysis);
          analysis = attachExtractionPreviews(analysis, 'agent', title, content);
        } else {
          analysis = await analyzeAgentInstructions(content, title, agentMode);
        }
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      contentType,
      analysis,
      duplicateCheck,
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

type IndexedDoc = {
  title: string;
  type: 'customer-page' | 'concept' | 'lesson' | 'skill' | 'engram' | 'engram-v2';
  path: string;
  viewUrl?: string;
  tokens: Map<string, number>;
  norm: number;
};

function enrichAgentTrainingPotential(analysis: any) {
  if (!analysis?.agentTrainingPotential) return analysis;
  const agentTypes = new Set<IndexedDoc['type']>(['concept', 'lesson', 'skill', 'engram', 'engram-v2']);
  if (Array.isArray(analysis.agentTrainingPotential.suggestedConcepts)) {
    analysis.agentTrainingPotential.suggestedConcepts = analysis.agentTrainingPotential.suggestedConcepts.map((concept: any) => ({
      ...concept,
      duplicate: findDuplicatesForText(concept.title || 'Untitled concept', concept.content || '', agentTypes),
    }));
  }
  if (Array.isArray(analysis.agentTrainingPotential.suggestedLessons)) {
    analysis.agentTrainingPotential.suggestedLessons = analysis.agentTrainingPotential.suggestedLessons.map((lesson: any) => ({
      ...lesson,
      duplicate: findDuplicatesForText(
        lesson.title || 'Untitled lesson',
        `${lesson.scenario || ''}\n${lesson.solution || ''}`,
        agentTypes
      ),
    }));
  }
  return analysis;
}

type SourceInfo = { id: string; type: 'customer' | 'internal' | 'agent'; hash: string };

function attachExtractionPreviews(
  analysis: any,
  contentType: 'customer' | 'internal' | 'agent',
  title: string,
  content: string
) {
  if (!analysis?.agentTrainingPotential) return analysis;
  const potential = analysis.agentTrainingPotential;
  if (!Array.isArray(potential.suggestedConcepts) && !Array.isArray(potential.suggestedLessons)) {
    return analysis;
  }

  const fallbackId = slugify(title || 'engram');
  const sourceInfo: SourceInfo = {
    id: fallbackId,
    type: contentType,
    hash: computeSourceHash(title || '', content || ''),
  };

  if (Array.isArray(potential.suggestedConcepts)) {
    potential.suggestedConcepts = potential.suggestedConcepts.map((concept: any) => {
      const parentId = resolveTargetEngramId(concept.forEngram, fallbackId);
      const conceptId = slugify(concept.title || 'auto-concept');
      return {
        ...concept,
        previewMarkdown: buildAutoConceptPreview(concept, parentId, sourceInfo, conceptId),
      };
    });
  }

  if (Array.isArray(potential.suggestedLessons)) {
    potential.suggestedLessons = potential.suggestedLessons.map((lesson: any) => {
      const parentId = resolveTargetEngramId(lesson.forEngram, fallbackId);
      const datePrefix = new Date().toISOString().split('T')[0];
      const lessonId = `${datePrefix}-${slugify(lesson.title || 'auto-lesson')}`;
      return {
        ...lesson,
        previewMarkdown: buildAutoLessonPreview(lesson, parentId, sourceInfo, lessonId),
      };
    });
  }

  return analysis;
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'but', 'for', 'from', 'if',
  'in', 'into', 'is', 'it', 'its', 'no', 'not', 'of', 'on', 'or', 'our', 'so',
  'that', 'the', 'their', 'then', 'there', 'these', 'they', 'this', 'those',
  'to', 'too', 'up', 'us', 'was', 'we', 'were', 'with', 'without', 'you', 'your',
  'about', 'after', 'before', 'between', 'can', 'could', 'did', 'do', 'does',
  'doing', 'done', 'each', 'few', 'had', 'has', 'have', 'having', 'here', 'how',
  'just', 'more', 'most', 'much', 'new', 'only', 'other', 'out', 'over', 'same',
  'should', 'some', 'such', 'than', 'them', 'through', 'under', 'very', 'what',
  'when', 'where', 'which', 'who', 'why', 'will', 'would',
]);

let cachedIndex: IndexedDoc[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function buildVector(tokens: string[]): { tokens: Map<string, number>; norm: number } {
  const map = new Map<string, number>();
  for (const token of tokens) {
    map.set(token, (map.get(token) || 0) + 1);
  }
  let sumSquares = 0;
  for (const count of map.values()) {
    sumSquares += count * count;
  }
  return { tokens: map, norm: Math.sqrt(sumSquares) };
}

function cosineSimilarity(a: { tokens: Map<string, number>; norm: number }, b: IndexedDoc): number {
  if (a.norm === 0 || b.norm === 0) return 0;
  let dot = 0;
  for (const [token, count] of a.tokens) {
    const other = b.tokens.get(token);
    if (other) dot += count * other;
  }
  return dot / (a.norm * b.norm);
}

function getRepoRoot(): string {
  return path.join(process.cwd(), '..');
}

function buildAutoConceptPreview(
  concept: { title: string; content: string; forEngram?: string },
  parentId: string,
  sourceInfo: SourceInfo,
  conceptId: string
): string {
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

function buildAutoLessonPreview(
  lesson: { title: string; scenario: string; solution: string; forEngram?: string },
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

function resolveTargetEngramId(forEngram: string | undefined, fallbackEngramId: string): string {
  const raw = (forEngram || '').trim();
  if (!raw) return slugify(fallbackEngramId);
  return slugify(raw);
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 50);
}

function computeSourceHash(title: string, content: string): string {
  return crypto.createHash('sha256').update(`${title}\n${content}`).digest('hex');
}

function loadDocuments(): IndexedDoc[] {
  const now = Date.now();
  if (cachedIndex && now - cachedAt < CACHE_TTL_MS) {
    return cachedIndex;
  }

  const repoRoot = getRepoRoot();
  const docs: IndexedDoc[] = [];

  const customerPagesDir = path.join(repoRoot, 'customer-pages');
  if (fs.existsSync(customerPagesDir)) {
    const entries = fs.readdirSync(customerPagesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const filePath = path.join(customerPagesDir, entry.name);
        const slug = entry.name.replace(/\.md$/, '');
        const { data, content } = matter(fs.readFileSync(filePath, 'utf-8'));
        const title = data.title || slug;
        const weighted = `${title}\n${title}\n${content}`;
        const vector = buildVector(tokenize(weighted));
        docs.push({
          title,
          type: 'customer-page',
          path: `customer-pages/${entry.name}`,
          viewUrl: `https://help.venturehome.com/article/${slug}`,
          tokens: vector.tokens,
          norm: vector.norm,
        });
      } else if (entry.isDirectory()) {
        const indexPath = path.join(customerPagesDir, entry.name, '_index.md');
        if (fs.existsSync(indexPath)) {
          const { data, content } = matter(fs.readFileSync(indexPath, 'utf-8'));
          const title = data.title || entry.name;
          const weighted = `${title}\n${title}\n${content}`;
          const vector = buildVector(tokenize(weighted));
          docs.push({
            title,
            type: 'customer-page',
            path: `customer-pages/${entry.name}/_index.md`,
            viewUrl: `https://help.venturehome.com/article/${entry.name}`,
            tokens: vector.tokens,
            norm: vector.norm,
          });
        }
      }
    }
  }

  const conceptsDir = path.join(repoRoot, 'concepts');
  if (fs.existsSync(conceptsDir)) {
    const files = fs.readdirSync(conceptsDir);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const filePath = path.join(conceptsDir, file);
      const slug = file.replace(/\.md$/, '');
      const { data, content } = matter(fs.readFileSync(filePath, 'utf-8'));
      const title = data.title || slug;
      const weighted = `${title}\n${title}\n${content}`;
      const vector = buildVector(tokenize(weighted));
      docs.push({
        title,
        type: 'concept',
        path: `concepts/${file}`,
        viewUrl: `/concepts/${slug}`,
        tokens: vector.tokens,
        norm: vector.norm,
      });
    }
  }

  const lessonsDir = path.join(repoRoot, 'lessons');
  if (fs.existsSync(lessonsDir)) {
    const files = fs.readdirSync(lessonsDir);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const filePath = path.join(lessonsDir, file);
      const slug = file.replace(/\.md$/, '');
      const { data, content } = matter(fs.readFileSync(filePath, 'utf-8'));
      const title = data.title || slug;
      const weighted = `${title}\n${title}\n${content}`;
      const vector = buildVector(tokenize(weighted));
      docs.push({
        title,
        type: 'lesson',
        path: `lessons/${file}`,
        tokens: vector.tokens,
        norm: vector.norm,
      });
    }
  }

  const engramsDir = path.join(repoRoot, 'engrams');
  if (fs.existsSync(engramsDir)) {
    const entries = fs.readdirSync(engramsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const indexPath = path.join(engramsDir, entry.name, '_index.md');
      if (fs.existsSync(indexPath)) {
        const { data, content } = matter(fs.readFileSync(indexPath, 'utf-8'));
        const title = data.title || entry.name;
        const weighted = `${title}\n${title}\n${content}`;
        const vector = buildVector(tokenize(weighted));
        docs.push({
          title,
          type: 'engram',
          path: `engrams/${entry.name}/_index.md`,
          viewUrl: `/engrams/${entry.name}`,
          tokens: vector.tokens,
          norm: vector.norm,
        });
      }
      const skillPath = path.join(engramsDir, entry.name, 'SKILL.md');
      if (fs.existsSync(skillPath)) {
        const { data, content } = matter(fs.readFileSync(skillPath, 'utf-8'));
        const title = data.name || data.title || `${entry.name} skill`;
        const weighted = `${title}\n${title}\n${content}`;
        const vector = buildVector(tokenize(weighted));
        docs.push({
          title,
          type: 'skill',
          path: `engrams/${entry.name}/SKILL.md`,
          viewUrl: `/engrams/${entry.name}`,
          tokens: vector.tokens,
          norm: vector.norm,
        });
      }
    }
  }

  const engramsV2Dir = path.join(repoRoot, 'engrams-v2');
  if (fs.existsSync(engramsV2Dir)) {
    const entries = fs.readdirSync(engramsV2Dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const indexPath = path.join(engramsV2Dir, entry.name, '_index.md');
      if (fs.existsSync(indexPath)) {
        const { data, content } = matter(fs.readFileSync(indexPath, 'utf-8'));
        const title = data.title || entry.name;
        const weighted = `${title}\n${title}\n${content}`;
        const vector = buildVector(tokenize(weighted));
        docs.push({
          title,
          type: 'engram-v2',
          path: `engrams-v2/${entry.name}/_index.md`,
          viewUrl: `https://github.com/VentureHomeSolarLLC/agora-studio/tree/main/engrams-v2/${entry.name}`,
          tokens: vector.tokens,
          norm: vector.norm,
        });
      }
      const skillPath = path.join(engramsV2Dir, entry.name, 'SKILL.md');
      if (fs.existsSync(skillPath)) {
        const { data, content } = matter(fs.readFileSync(skillPath, 'utf-8'));
        const title = data.name || data.title || `${entry.name} skill`;
        const weighted = `${title}\n${title}\n${content}`;
        const vector = buildVector(tokenize(weighted));
        docs.push({
          title,
          type: 'skill',
          path: `engrams-v2/${entry.name}/SKILL.md`,
          viewUrl: `https://github.com/VentureHomeSolarLLC/agora-studio/tree/main/engrams-v2/${entry.name}`,
          tokens: vector.tokens,
          norm: vector.norm,
        });
      }
    }
  }

  cachedIndex = docs;
  cachedAt = now;
  return docs;
}

function getAllowedTypes(contentType: string): Set<IndexedDoc['type']> {
  if (contentType === 'customer') {
    return new Set(['customer-page']);
  }
  if (contentType === 'internal') {
    return new Set(['concept', 'lesson', 'skill', 'engram', 'engram-v2']);
  }
  return new Set(['concept', 'lesson', 'skill', 'engram', 'engram-v2']);
}

function findDuplicatesForText(
  title: string,
  content: string,
  allowedTypes: Set<IndexedDoc['type']>,
  options?: { matchThreshold?: number; similarThreshold?: number }
) {
  const docs = loadDocuments();
  const weighted = `${title}\n${title}\n${content}`;
  const inputVector = buildVector(tokenize(weighted));
  const matchThreshold = options?.matchThreshold ?? 0.12;
  const similarThreshold = options?.similarThreshold ?? 0.25;

  const scored = docs
    .filter((doc) => allowedTypes.has(doc.type))
    .map((doc) => ({
      title: doc.title,
      type: doc.type,
      path: doc.path,
      viewUrl: doc.viewUrl,
      score: cosineSimilarity(inputVector, doc),
    }))
    .filter((match) => match.score > matchThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const topScore = scored[0]?.score || 0;
  const similar = topScore >= similarThreshold;

  return { similar, topScore, matches: scored };
}

async function checkForDuplicates(title: string, content: string, contentType: string) {
  const allowed = getAllowedTypes(contentType);
  const similarThreshold = contentType === 'customer' || contentType === 'internal' ? 0.5 : 0.25;
  const matchThreshold = similarThreshold;
  return findDuplicatesForText(title, content, allowed, { similarThreshold, matchThreshold });
}

function safeParseJson<T>(raw: string | undefined | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    const first = raw.indexOf('{');
    const last = raw.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      const candidate = raw.slice(first, last + 1);
      try {
        return JSON.parse(candidate) as T;
      } catch (err) {
        console.warn('Failed to parse cleaned AI JSON:', err);
      }
    }
    console.warn('Failed to parse AI JSON response. Returning fallback.');
    return fallback;
  }
}

async function analyzeCustomerContent(content: string, title: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are a seasoned solar and home electrification expert writing for homeowners.

Goal: Transform rough notes into polished, approachable guidance that feels professional and human — colorful, confident, and easy to understand. Fix grammar and typos. Make any bullets feel like complete, helpful sentences.

Formatting rules for the improved content (beforeAfter.after):
- Do NOT use Markdown headings (#) or bold/italic formatting (** or __).
- Avoid any "AI-styled" formatting. No numbered outlines like "1." if they feel robotic.
- If you use bullets, keep them as full sentences with clear meaning.
- No emojis.

Return JSON with:
- keyPoints: array of main takeaways
- readability: {gradeLevel, score, issues}
- beforeAfter: {before, after}  // after must follow formatting rules above
- missingContentSections: [{sectionTitle, content, placement, whyImportant}]
- agentTrainingPotential: {
    hasExtractableContent: boolean,
    suggestedConcepts: [{title, content, forEngram: string, confidence: number, riskLevel: low | medium | high}],
    suggestedLessons: [{title, scenario, solution, forEngram: string, confidence: number, riskLevel: low | medium | high}],
    engramModes: [{forEngram: string, mode: procedure | knowledge, rationale: string}]
  }
- suggestedTags: array
- warnings: array

IMPORTANT: Solar panels and batteries don't need regular check-ups, only when there's an issue.
When assigning engramModes, use procedure if the content implies a repeatable process; otherwise use knowledge.
Set confidence from 0 to 1, and mark riskLevel as high if using the content without review could cause safety, legal, or financial harm.`
      },
      {
        role: 'user',
        content: `Title: ${title}\n\nContent:\n${content}`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
    max_tokens: 4000,
  });

  const raw = response.choices[0].message.content;
  return safeParseJson(raw, {
    keyPoints: [],
    readability: { gradeLevel: 'unknown', score: 0, issues: [] },
    beforeAfter: { before: content, after: content },
    missingContentSections: [],
    agentTrainingPotential: {
      hasExtractableContent: false,
      suggestedConcepts: [],
      suggestedLessons: [],
      engramModes: [],
    },
    suggestedTags: [],
    warnings: ['AI response parsing failed. Using original content.'],
  });
}

async function analyzeInternalContent(content: string, title: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `Analyze internal docs for the Venture Home team.

Return JSON with:
- beforeAfter: {before, after}
- sections: [{title, content}]
- technicalDetails: array
- edgeCases: array
- missingContent: array
- suggestedTags: array
- agentTrainingPotential: {
    hasExtractableContent: boolean,
    suggestedConcepts: [{title, content, forEngram: string, confidence: number, riskLevel: low | medium | high}],
    suggestedLessons: [{title, scenario, solution, forEngram: string, confidence: number, riskLevel: low | medium | high}],
    engramModes: [{forEngram: string, mode: procedure | knowledge, rationale: string}]
  }

For beforeAfter.after, produce a clean internal reference draft. Avoid Markdown headings (#) and bold/italic markers (** or __).
Use simple section labels like "Overview:" and "Step 1:" with plain text. Bullet lists are ok, but use full sentences.
Use procedure mode only when the content describes a repeatable process; otherwise use knowledge.
Set confidence from 0 to 1, and mark riskLevel as high if using the content without review could cause safety, legal, or financial harm.`
      },
      {
        role: 'user',
        content: `Title: ${title}\n\nContent:\n${content}`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 4000,
  });

  const raw = response.choices[0].message.content;
  const parsed = safeParseJson(raw, {
    beforeAfter: { before: content, after: content },
    sections: content ? [{ title: 'Overview', content }] : [],
    technicalDetails: [],
    edgeCases: [],
    missingContent: [],
    suggestedTags: [],
    agentTrainingPotential: {
      hasExtractableContent: false,
      suggestedConcepts: [],
      suggestedLessons: [],
      engramModes: [],
    },
  });
  return ensureInternalBeforeAfter(parsed, content, title);
}

function ensureInternalBeforeAfter(analysis: any, content: string, title: string) {
  const before = content || '';
  const draft = buildInternalDraftFromAnalysis(analysis, title, before);
  const currentAfter = analysis?.beforeAfter?.after || '';
  const shouldReplace =
    !currentAfter ||
    (before.length > 120 && currentAfter.trim().length < Math.max(80, before.length * 0.4));

  return {
    ...analysis,
    beforeAfter: {
      before: analysis?.beforeAfter?.before || before,
      after: shouldReplace ? draft : currentAfter,
    },
  };
}

function buildInternalDraftFromAnalysis(analysis: any, title: string, fallback: string) {
  const parts: string[] = [];
  if (title) parts.push(`${title}`);
  const sections = Array.isArray(analysis?.sections) ? analysis.sections : [];
  sections.forEach((section: any) => {
    if (!section?.title || !section?.content) return;
    parts.push(`${section.title}:\n${section.content}`);
  });
  if (Array.isArray(analysis?.technicalDetails) && analysis.technicalDetails.length > 0) {
    parts.push(`Technical Details:\n${analysis.technicalDetails.map((item: string) => `- ${item}`).join('\n')}`);
  }
  if (Array.isArray(analysis?.edgeCases) && analysis.edgeCases.length > 0) {
    parts.push(`Edge Cases:\n${analysis.edgeCases.map((item: string) => `- ${item}`).join('\n')}`);
  }
  if (Array.isArray(analysis?.missingContent) && analysis.missingContent.length > 0) {
    parts.push(`Missing Info:\n${analysis.missingContent.map((item: string) => `- ${item}`).join('\n')}`);
  }
  const draft = parts.filter(Boolean).join('\n\n').trim();
  return draft || fallback;
}

async function analyzeAgentInstructions(content: string, title: string, agentMode?: 'procedure' | 'knowledge') {
  const modeHint = agentMode === 'knowledge'
    ? 'Mode: knowledge-only. Emphasize reference knowledge, definitions, and guardrails. Steps are optional; if included, keep them minimal.'
    : 'Mode: procedure. Provide step-by-step execution guidance.';
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are creating a high-quality AI agent skill (Engram v2). Convert rough notes into a structured skill that agents can execute safely.

${modeHint}

Return JSON with:
- skill: {
    name,
    type: consultation | diagnostic | procedural | creative | knowledge,
    domain,
    subdomains: string[],
    triggerQuestions: string[],
    outcome,
    riskLevel: low | medium | high,
    triggers: string[],
    requiredInputs: string[],
    constraints: string[],
    allowedSystems: string[],
    escalationCriteria: string[],
    stopConditions: string[],
    prerequisites: string[],
    steps: [{title, content, type: text | checkbox | decision}]
  }
- concepts: [{title, content, tags}]
- lessons: [{title, content, date, severity}]
- suggestedTags: string[]
- warnings: string[]

Guidelines:
- Steps must be explicit (input → action → expected output).
- Decision steps should include clear criteria.
- Capture edge cases as lessons.
- Be concise but complete.
- Suggest domain/subdomains and 3-5 trigger questions for routing.`
      },
      {
        role: 'user',
        content: `Title: ${title}\n\nContent:\n${content}`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 4000,
  });

  const raw = response.choices[0].message.content;
  return safeParseJson(raw, {
    skill: {
      name: title,
      type: agentMode === 'knowledge' ? 'knowledge' : 'procedural',
      domain: '',
      subdomains: [],
      triggerQuestions: [],
      outcome: '',
      riskLevel: 'medium',
      triggers: [],
      requiredInputs: [],
      constraints: [],
      allowedSystems: [],
      escalationCriteria: [],
      stopConditions: [],
      prerequisites: [],
      steps: [],
    },
    concepts: [],
    lessons: [],
    suggestedTags: [],
    warnings: ['AI response parsing failed.'],
  });
}

async function analyzeAgentImport(content: string, title: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are converting an existing monolithic SKILL.md into Engram v2 files. Extract the reusable knowledge so it can be routed into the correct Engram folders.

Return JSON with:
- agentTrainingPotential: {
    suggestedConcepts: [{ title, content, forEngram, confidence, riskLevel }],
    suggestedLessons: [{ title, scenario, solution, forEngram, confidence, riskLevel }],
    engramModes: [{ forEngram, mode: knowledge | procedure, rationale }]
  }
- suggestedTags: string[]
- warnings: string[]

Guidelines:
- Use "forEngram" to point to existing or newly proposed Engram names.
- Concepts = reusable conditions, definitions, constraints, or requirements.
- Lessons = edge cases or unexpected outcomes with a clear scenario + solution.
- Confidence is 0-1. Set riskLevel to low/medium/high based on potential harm.
- If information is purely reference knowledge, mark the Engram mode as knowledge.`
      },
      {
        role: 'user',
        content: `Title: ${title}\n\nSKILL.md content:\n${content}`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 4000,
  });

  const raw = response.choices[0].message.content;
  return safeParseJson(raw, {
    agentTrainingPotential: {
      suggestedConcepts: [],
      suggestedLessons: [],
      engramModes: [],
    },
    suggestedTags: [],
    warnings: ['AI response parsing failed.'],
  });
}
