import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { content, contentType, title } = await request.json();

    if (!content || !contentType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Check for duplicates first
    const duplicateCheck = await checkForDuplicates(title, content, contentType);

    let analysis;
    switch (contentType) {
      case 'customer':
        analysis = await analyzeCustomerContent(content, title);
        if (analysis?.agentTrainingPotential) {
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
        }
        break;
      case 'internal':
        analysis = await analyzeInternalContent(content, title);
        break;
      case 'agent':
        analysis = await analyzeAgentInstructions(content, title);
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

function findDuplicatesForText(title: string, content: string, allowedTypes: Set<IndexedDoc['type']>) {
  const docs = loadDocuments();
  const weighted = `${title}\n${title}\n${content}`;
  const inputVector = buildVector(tokenize(weighted));

  const scored = docs
    .filter((doc) => allowedTypes.has(doc.type))
    .map((doc) => ({
      title: doc.title,
      type: doc.type,
      path: doc.path,
      viewUrl: doc.viewUrl,
      score: cosineSimilarity(inputVector, doc),
    }))
    .filter((match) => match.score > 0.12)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const topScore = scored[0]?.score || 0;
  const similar = topScore >= 0.25;

  return { similar, topScore, matches: scored };
}

async function checkForDuplicates(title: string, content: string, contentType: string) {
  const allowed = getAllowedTypes(contentType);
  return findDuplicatesForText(title, content, allowed);
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
    suggestedConcepts: [{title, content, forEngram: string}],
    suggestedLessons: [{title, scenario, solution, forEngram: string}]
  }
- suggestedTags: array
- warnings: array

IMPORTANT: Solar panels and batteries don't need regular check-ups, only when there's an issue.`
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

  return JSON.parse(response.choices[0].message.content || '{}');
}

async function analyzeInternalContent(content: string, title: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'Analyze internal docs. Return JSON with sections, technicalDetails, edgeCases, missingContent, suggestedTags.'
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

  return JSON.parse(response.choices[0].message.content || '{}');
}

async function analyzeAgentInstructions(content: string, title: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are creating a high-quality AI agent skill (Engram v2). Convert rough notes into a structured skill that agents can execute safely.

Return JSON with:
- skill: {
    name,
    type: consultation | diagnostic | procedural | creative,
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
- Be concise but complete.`
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

  return JSON.parse(response.choices[0].message.content || '{}');
}
