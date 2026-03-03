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

export interface AgentExtractionConcept {
  title: string;
  content: string;
  forEngram?: string;
  confidence?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  include: boolean;
  previewMarkdown?: string;
  mergeTargetPath?: string;
  mergeTargetTitle?: string;
  mergeTargetType?: string;
  mergeStrategy?: 'append' | 'replace';
  conflict?: {
    hasConflict: boolean;
    details?: string[];
    existingLastVerified?: string;
    existingStale?: boolean;
    existingPath?: string;
  };
  duplicate?: {
    similar: boolean;
    topScore: number;
    matches: {
      title: string;
      type: string;
      score: number;
      path: string;
      viewUrl?: string;
    }[];
  };
}

export interface AgentExtractionLesson {
  title: string;
  scenario: string;
  solution: string;
  forEngram?: string;
  confidence?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  include: boolean;
  previewMarkdown?: string;
  mergeTargetPath?: string;
  mergeTargetTitle?: string;
  mergeTargetType?: string;
  mergeStrategy?: 'append' | 'replace';
  duplicate?: {
    similar: boolean;
    topScore: number;
    matches: {
      title: string;
      type: string;
      score: number;
      path: string;
      viewUrl?: string;
    }[];
  };
}

export interface SkillInput {
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  time_estimate?: string;
  prerequisites?: string[];
  steps: SkillStep[];
}

export interface AgentProfile {
  skillMode?: 'procedure' | 'knowledge';
  skillType?: 'consultation' | 'diagnostic' | 'procedural' | 'creative' | 'knowledge';
  domain?: string;
  subdomains?: string[];
  triggerQuestions?: string[];
  outcome?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  triggers?: string[];
  requiredInputs?: string[];
  constraints?: string[];
  allowedSystems?: string[];
  escalationCriteria?: string[];
  stopConditions?: string[];
}

export type AgentSkillMode = 'procedure' | 'knowledge';

export interface AgentEngramModeSuggestion {
  engramId: string;
  label?: string;
  mode: AgentSkillMode;
  rationale?: string;
  include?: boolean;
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
  rawContent?: string;
  aiAnalysis?: any;
  agentProfile?: AgentProfile;
  agentImportMode?: 'notes' | 'monolith';
  agentEngramModes?: AgentEngramModeSuggestion[];
  agentExtraction?: {
    concepts: AgentExtractionConcept[];
    lessons: AgentExtractionLesson[];
  } | null;
  duplicateResolutionConfirmed?: boolean;
  duplicateCheck?: {
    similar: boolean;
    topScore: number;
    matches: {
      title: string;
      type: string;
      score: number;
      path: string;
      viewUrl?: string;
    }[];
  } | null;
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

export const AGENT_DOMAIN_SUGGESTIONS = [
  'sales',
  'operations',
  'finance',
  'interconnection',
  'installation',
  'maintenance',
  'billing',
  'incentives',
  'customer-support',
  'project-management',
  'compliance',
  'troubleshooting',
  'design',
  'procurement',
  'service',
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
