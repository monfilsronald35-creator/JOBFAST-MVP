/**
 * AIPromptEngine — Template system, few-shot examples, chain-of-thought, system prompts.
 */

import type { AIMessage } from '../types';

type PromptVars = Record<string, string | number | boolean>;

// ─── System prompt library ─────────────────────────────────────────────────────

export const SYSTEM_PROMPTS = {
  assistant: (lang = 'ht') =>
    lang === 'ht'
      ? `Ou se yon asistan entèlijan pou platfòm JOBFAST. Ou pale Kreyòl Ayisyen, Fransè, ak Anglè. Reponn nan lang itilizatè a itilize. Ou klè, konsiz, epi itil. Ou pa fè dyagnostik medikal, konsèy legal, oswa konsèy finansye fòmèl.`
      : `You are an intelligent assistant for the JOBFAST platform. You respond clearly, concisely, and helpfully in the user's language. You do not give medical diagnoses, legal advice, or formal financial advice.`,

  jobMatcher: () =>
    `You are a job matching specialist. Analyze profiles and job requirements to identify compatibility. Return structured JSON with match score (0-100), top matching skills, missing skills, and a recommendation.`,

  fraudDetector: () =>
    `You are a fraud detection AI. Analyze the provided data for signals of fake accounts, scams, bots, or suspicious activity. Return a JSON risk assessment with score (0-100), risk level (low/medium/high/critical), detected signals, and recommendation (allow/review/block).`,

  translator: (source: string, target: string) =>
    `You are a professional translator specializing in ${source} to ${target} translation. Preserve tone, formality, and meaning exactly. Return only the translated text, no explanations.`,

  moderator: () =>
    `You are a content moderation AI. Analyze the content for safety violations including hate speech, explicit content, spam, scams, and harmful information. Return JSON with: approved (boolean), categories (object with scores 0-1), action (allow/warn/blur/remove/escalate), reason (string if not approved).`,

  biAnalyst: () =>
    `You are a business intelligence AI analyst. Analyze the provided business data and generate actionable insights. Return JSON with: value (number), trend (up/down/stable), confidence (0-100), summary (string), suggestions (string[]).`,

  careerCoach: () =>
    `You are a career development AI. Analyze resumes, skills, and experience to provide career guidance. Identify skill gaps, salary ranges, and career paths. Return structured JSON. Do not guarantee outcomes.`,
};

// ─── Template engine ──────────────────────────────────────────────────────────

export function renderTemplate(template: string, vars: PromptVars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = vars[key];
    return val !== undefined ? String(val) : `{{${key}}}`;
  });
}

// ─── Few-shot builder ─────────────────────────────────────────────────────────

export function buildFewShotMessages(
  systemPrompt: string,
  examples:     Array<{ user: string; assistant: string }>,
  userMessage:  string,
): AIMessage[] {
  const messages: AIMessage[] = [
    { role: 'system', content: systemPrompt },
  ];
  for (const ex of examples) {
    messages.push({ role: 'user',      content: ex.user });
    messages.push({ role: 'assistant', content: ex.assistant });
  }
  messages.push({ role: 'user', content: userMessage });
  return messages;
}

// ─── Chain-of-thought ─────────────────────────────────────────────────────────

export function wrapWithCOT(prompt: string): string {
  return `${prompt}\n\nThink step by step before giving your final answer. Format your thinking as:\n<thinking>\n[your reasoning]\n</thinking>\n\n[your final answer]`;
}

export function extractCOTAnswer(response: string): string {
  const thinkEnd = response.lastIndexOf('</thinking>');
  if (thinkEnd === -1) return response;
  return response.slice(thinkEnd + 11).trim();
}

// ─── JSON schema enforcement ──────────────────────────────────────────────────

export function enforceJSON(prompt: string, schema: Record<string, unknown>): string {
  return `${prompt}\n\nYou MUST respond with ONLY valid JSON matching this schema:\n${JSON.stringify(schema, null, 2)}\n\nDo NOT include any text outside the JSON object.`;
}

// ─── Context injection ────────────────────────────────────────────────────────

export function injectContext(
  messages: AIMessage[],
  context: string,
): AIMessage[] {
  if (!context.trim()) return messages;
  const sys = messages[0];
  if (sys?.role === 'system') {
    return [
      { ...sys, content: `${sys.content as string}\n\n--- User Context ---\n${context}` },
      ...messages.slice(1),
    ];
  }
  return [
    { role: 'system', content: `--- Context ---\n${context}` },
    ...messages,
  ];
}

// ─── Language detection ────────────────────────────────────────────────────────

export function detectLanguage(text: string): 'ht' | 'fr' | 'en' | 'es' | 'unknown' {
  const htWords  = /\b(mwen|ou|li|nou|yo|se|pa|an|nan|pou|ak|ki|sa|gen|te|ap|la|yon|tout|jan)\b/i;
  const frWords  = /\b(je|tu|il|nous|vous|ils|le|la|les|est|sont|avoir|être|faire)\b/i;
  const esWords  = /\b(yo|el|ella|nosotros|ellos|es|son|tiene|están|muy)\b/i;
  if (htWords.test(text)) return 'ht';
  if (frWords.test(text)) return 'fr';
  if (esWords.test(text)) return 'es';
  if (/[a-z]/i.test(text)) return 'en';
  return 'unknown';
}

// ─── Prompt templates ─────────────────────────────────────────────────────────

export const PROMPT_TEMPLATES = {
  matchJobWorker: (workerProfile: string, jobDescription: string) =>
    `Analyze this worker-job match:\n\nWORKER:\n${workerProfile}\n\nJOB:\n${jobDescription}\n\nReturn JSON: { score: 0-100, matchedSkills: [], missingSkills: [], recommendation: string }`,

  analyzeCV: (cvText: string, targetRole?: string) =>
    `Analyze this CV${targetRole ? ` for the role of ${targetRole}` : ''}:\n\n${cvText}\n\nReturn JSON: { cvScore: 0-100, skills: [], experience: number, improvements: [], salaryMin: number, salaryMax: number, currency: "USD" }`,

  scoreReview: (reviewText: string, businessContext?: string) =>
    `Analyze if this review is authentic or fake:\n\nReview: "${reviewText}"${businessContext ? `\nContext: ${businessContext}` : ''}\n\nReturn JSON: { authentic: boolean, score: 0-100, signals: [], confidence: 0-100 }`,

  generateNotification: (event: string, lang: string, context: string) =>
    `Generate an engaging notification for event "${event}" in ${lang}:\n${context}\n\nReturn JSON: { title: string, body: string, priority: "critical"|"high"|"normal"|"low", shouldSend: boolean }`,

  recommendItems: (userId: string, domain: string, history: string) =>
    `Recommend ${domain} items for user ${userId}.\n\nUser history: ${history}\n\nReturn JSON: { recommendations: [{ id: string, reason: string, score: 0-100 }] }`,
};