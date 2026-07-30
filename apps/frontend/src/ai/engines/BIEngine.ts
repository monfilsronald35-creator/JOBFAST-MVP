import type { BIReport, BIQuery, BIInsight } from '../types';
import { AIGateway } from '../gateway/AIGateway';
import { SYSTEM_PROMPTS } from '../prompt/AIPromptEngine';

export const BIEngine = {
  async query(request: BIQuery): Promise<BIReport> {
    try {
      const res = await fetch('/api/ai/bi/query', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(request),
      });
      if (res.ok) return res.json() as Promise<BIReport>;
    } catch { /* AI fallback */ }

    // AI-driven analysis fallback
    const prompt = `${SYSTEM_PROMPTS.biAnalyst()}\n\nAnalyze this business data:\n${JSON.stringify(request.data, null, 2)}\n\nMetric: ${request.metric}\nPeriod: ${request.period}\n\nReturn JSON: { summary: string, insights: Array<{ type: string, title: string, value: string|number, change?: number, trend?: "up"|"down"|"stable", recommendations: string[] }>, predictions: Array<{ metric: string, value: number, confidence: number, period: string }> }`;

    const result = await AIGateway.json<{
      summary: string;
      insights: BIInsight[];
      predictions: BIReport['predictions'];
    }>(prompt, { strategy: 'best_quality', temperature: 0.1 }).catch(() => ({
      summary: 'Insufficient data for analysis.', insights: [], predictions: [],
    }));

    return { ...result, metric: request.metric, period: request.period, generatedAt: Date.now() };
  },

  async forecastRevenue(orgId: string, periods = 3): Promise<Array<{ period: string; predicted: number; confidence: number }>> {
    try {
      const res = await fetch(`/api/ai/bi/forecast/revenue?orgId=${orgId}&periods=${periods}`);
      if (res.ok) return res.json() as Promise<Array<{ period: string; predicted: number; confidence: number }>>;
    } catch { /* */ }
    return [];
  },

  async forecastDemand(category: string, region?: string): Promise<BIInsight[]> {
    const prompt = `Forecast demand for "${category}"${region ? ` in ${region}` : ''} for the next 3 months. Return JSON: { insights: Array<{ type: "demand", title: string, value: number, trend: "up"|"down"|"stable", confidence: number, recommendations: string[] }> }`;
    const r = await AIGateway.json<{ insights: BIInsight[] }>(prompt, { strategy: 'balanced', temperature: 0.1 }).catch(() => ({ insights: [] }));
    return r.insights;
  },

  async getGrowthInsights(orgId: string): Promise<BIInsight[]> {
    try {
      const res = await fetch(`/api/ai/bi/insights/growth?orgId=${orgId}`);
      if (res.ok) return res.json() as Promise<BIInsight[]>;
    } catch { /* */ }
    return [];
  },

  async analyzeCustomerSegments(data: Record<string, unknown>[]): Promise<BIInsight[]> {
    const prompt = `${SYSTEM_PROMPTS.biAnalyst()}\n\nAnalyze these ${data.length} customer records and identify key segments.\nReturn JSON: { insights: Array<{ type: "segment", title: string, value: string|number, trend?: "up"|"down"|"stable", recommendations: string[] }> }`;
    const r = await AIGateway.json<{ insights: BIInsight[] }>(
      prompt + `\n\nData sample: ${JSON.stringify(data.slice(0, 10))}`,
      { strategy: 'best_quality', temperature: 0 },
    ).catch(() => ({ insights: [] }));
    return r.insights;
  },

  async getRiskAnalysis(orgId: string): Promise<{ risks: Array<{ risk: string; severity: 'low' | 'medium' | 'high'; probability: number; mitigation: string }> }> {
    try {
      const res = await fetch(`/api/ai/bi/risk?orgId=${orgId}`);
      if (res.ok) return res.json() as Promise<{ risks: Array<{ risk: string; severity: 'low' | 'medium' | 'high'; probability: number; mitigation: string }> }>;
    } catch { /* */ }
    return { risks: [] };
  },
};