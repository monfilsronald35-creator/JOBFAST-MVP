import type { CareerAnalysis, CVAnalysisResult } from '../types';
import { AIGateway } from '../gateway/AIGateway';
import { SYSTEM_PROMPTS, PROMPT_TEMPLATES } from '../prompt/AIPromptEngine';

export const CareerEngine = {
  async analyzeCV(cvText: string, targetRole?: string): Promise<CVAnalysisResult> {
    const prompt = PROMPT_TEMPLATES.analyzeCV(cvText, targetRole);
    return AIGateway.json<CVAnalysisResult>(
      prompt,
      { strategy: 'best_quality', temperature: 0.1 },
    ).catch(() => ({
      skills: [], experience: [], education: [], strengths: [], gaps: [],
      overallScore: 0, recommendations: [],
    }));
  },

  async getCareerPath(currentRole: string, targetRole: string, skills: string[]): Promise<CareerAnalysis> {
    const prompt = `${SYSTEM_PROMPTS.careerCoach()}\n\nCurrent role: ${currentRole}\nTarget role: ${targetRole}\nCurrent skills: ${skills.join(', ')}\n\nProvide a career roadmap. Return JSON: { currentRole, targetRole, steps: Array<{ title: string, description: string, duration: string, skills: string[] }>, timelineMonths: number, salaryRange: { current: { min, max, currency }, target: { min, max, currency } }, missingSkills: string[], strengths: string[] }`;

    return AIGateway.json<CareerAnalysis>(
      prompt,
      { strategy: 'best_quality', temperature: 0.2 },
    ).catch(() => ({
      currentRole, targetRole, steps: [], timelineMonths: 12,
      salaryRange: { current: { min: 0, max: 0, currency: 'USD' }, target: { min: 0, max: 0, currency: 'USD' } },
      missingSkills: [], strengths: [],
    }));
  },

  async estimateSalary(role: string, location: string, experienceYears: number, skills: string[]): Promise<{ min: number; max: number; median: number; currency: string }> {
    try {
      const res = await fetch('/api/ai/career/salary', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ role, location, experienceYears, skills }),
      });
      if (res.ok) return res.json() as Promise<{ min: number; max: number; median: number; currency: string }>;
    } catch { /* AI fallback */ }

    const prompt = `Estimate salary for: Role: ${role}, Location: ${location}, Experience: ${experienceYears} years, Skills: ${skills.join(', ')}. Return JSON: { min: number, max: number, median: number, currency: string }`;
    return AIGateway.json<{ min: number; max: number; median: number; currency: string }>(
      prompt,
      { strategy: 'balanced', temperature: 0 },
    ).catch(() => ({ min: 0, max: 0, median: 0, currency: 'USD' }));
  },

  async suggestSkills(currentSkills: string[], targetRole: string): Promise<Array<{ skill: string; priority: 'high' | 'medium' | 'low'; resources: string[] }>> {
    const prompt = `${SYSTEM_PROMPTS.careerCoach()}\n\nCurrent skills: ${currentSkills.join(', ')}\nTarget role: ${targetRole}\n\nSuggest skills to learn. Return JSON: { suggestions: Array<{ skill: string, priority: "high"|"medium"|"low", resources: string[] }> }`;
    const r = await AIGateway.json<{ suggestions: Array<{ skill: string; priority: 'high' | 'medium' | 'low'; resources: string[] }> }>(
      prompt, { strategy: 'balanced', temperature: 0.2 },
    ).catch(() => ({ suggestions: [] }));
    return r.suggestions;
  },

  async generateCoverLetter(cvText: string, jobDescription: string, language = 'en'): Promise<string> {
    const langInstruction = language === 'ht'
      ? 'Ekri an Kreyòl Ayisyen.'
      : language === 'fr' ? 'Répondez en français.' : 'Write in English.';
    return AIGateway.complete(
      `${langInstruction}\n\nWrite a professional cover letter.\n\nCV:\n${cvText.slice(0, 1000)}\n\nJob:\n${jobDescription.slice(0, 1000)}`,
      { strategy: 'best_quality', temperature: 0.5, maxTokens: 600 },
    ).catch(() => '');
  },
};