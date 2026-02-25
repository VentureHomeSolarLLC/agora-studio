export type ContentType = 'customer' | 'internal' | 'agent';

export interface SkillStep {
  title: string;
  content: string;
  type?: 'checkbox' | 'text' | 'decision';
}

export interface ConceptInput {
  title: string;
  content: string;
  tags?: string[];
}

export interface LessonInput {
  title: string;
  content: string;
  date: string;
  severity?: 'low' | 'medium' | 'high';
  author?: string;
}

export interface SkillInput {
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  time_estimate?: string;
  prerequisites?: string[];
  steps: SkillStep[];
}

export interface EngramFormData {
  contentType: ContentType;
  title: string;
  category: string;
  description?: string;
  tags?: string[];
  audience?: ('agent' | 'customer' | 'internal')[];
  related_engrams?: string[];
  skill: SkillInput;
  concepts?: ConceptInput[];
  lessons?: LessonInput[];
  rawContent?: string; // For brain dump mode
  aiExtracted?: any; // AI analysis results
}

export const CATEGORIES = [
  'financing',
  'troubleshooting',
  'installation',
  'interconnection',
  'maintenance',
  'billing',
  'emergency',
  'post-install',
  'support',
  'other',
];

export const CONTENT_TYPE_CONFIG = {
  customer: {
    label: 'Customer Facing',
    description: 'Help articles, FAQs, customer support content',
    promptTitle: 'What question does this answer?',
    promptContent: 'Explain it like you are talking to a homeowner. Use simple language, avoid jargon.',
    outputPath: 'customer-pages',
    defaultTags: ['customer-support'],
    audience: ['customer'],
  },
  internal: {
    label: 'Internal Reference',
    description: 'Technical docs, processes, background info for employees',
    promptTitle: 'What is the topic?',
    promptContent: 'Document the details, edge cases, and technical information. Be comprehensive.',
    outputPath: 'concepts',
    defaultTags: ['internal', 'reference'],
    audience: ['internal'],
  },
  agent: {
    label: 'AI Agent Instructions',
    description: 'Step-by-step procedures for AI agents to execute',
    promptTitle: 'What task should the agent complete?',
    promptContent: 'Break this into clear step-by-step instructions. Include decisions and checkboxes.',
    outputPath: 'engrams-v2',
    defaultTags: ['agent-training', 'procedure'],
    audience: ['agent'],
  },
};
export const TAG_SUGGESTIONS = [
  'credit', 'fico', 'battery', 'solar', 'tpo', 'loan', 'lease', 'ppa',
  'utility', 'interconnection', 'net-metering', 'incentives', 'tax-credit',
  'srec', 'enphase', 'tesla', 'powerwall', 'storm', 'outage', 'repair', 'warranty',
];
