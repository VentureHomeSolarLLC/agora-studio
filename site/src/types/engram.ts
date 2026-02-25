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
  title: string;
  category: string;
  description?: string;
  tags?: string[];
  audience?: ('agent' | 'customer')[];
  related_engrams?: string[];
  skill: SkillInput;
  concepts?: ConceptInput[];
  lessons?: LessonInput[];
}

export const CATEGORIES = [
  'financing', 'troubleshooting', 'installation', 'interconnection',
  'maintenance', 'billing', 'emergency', 'post-install', 'support', 'other',
];

export const TAG_SUGGESTIONS = [
  'credit', 'fico', 'battery', 'solar', 'tpo', 'loan', 'lease', 'ppa',
  'utility', 'interconnection', 'net-metering', 'incentives', 'tax-credit',
  'srec', 'enphase', 'tesla', 'powerwall', 'storm', 'outage', 'repair', 'warranty',
];
