import type { UserContext, BriefingItem } from '../types/ai.types.js';

interface Decision {
  priority:    number;
  section:     string;
  reason:      string;
}

export const DecisionEngine = {
  prioritize(ctx: UserContext, items: BriefingItem[]): BriefingItem[] {
    const rules: Array<(ctx: UserContext, item: BriefingItem) => number> = [
      // High priority if there are unread messages
      (_, item) => item.label.includes('Mesaj') ? -10 : 0,
      // Critical alerts first
      (_, item) => item.icon === '🚨' ? -20 : 0,
      // Worker: show jobs prominently
      (ctx, item) => ctx.role === 'worker' && item.label.includes('travay') ? -5 : 0,
      // Hotel/Restaurant: revenue is king
      (ctx, item) => ['hotel', 'restaurant'].includes(ctx.role) && item.label.includes('Revni') ? -5 : 0,
      // Morning: show day plan higher
      (ctx, item) => ctx.localHour < 10 && item.label.includes('AI') ? -3 : 0,
    ];

    return [...items]
      .map(item => {
        const bonus = rules.reduce((s, rule) => s + rule(ctx, item), 0);
        return { ...item, priority: item.priority + bonus };
      })
      .sort((a, b) => a.priority - b.priority);
  },

  shouldShowOpportunities(ctx: UserContext): boolean {
    const inWorkHours = ctx.localHour >= 7 && ctx.localHour <= 21;
    return inWorkHours && ctx.isOnline;
  },

  shouldShowCityIntel(ctx: UserContext): boolean {
    return ctx.role === 'tourist' || (ctx.lat != null && ctx.lng != null);
  },

  getContextSummary(ctx: UserContext): Decision[] {
    const decisions: Decision[] = [];
    if (ctx.role === 'worker') decisions.push({ priority: 1, section: 'jobs', reason: 'worker role' });
    if (ctx.role === 'tourist') decisions.push({ priority: 1, section: 'travel', reason: 'tourist role' });
    if (['hotel', 'restaurant'].includes(ctx.role)) decisions.push({ priority: 1, section: 'revenue', reason: 'business role' });
    if (ctx.localHour < 10) decisions.push({ priority: 2, section: 'briefing', reason: 'morning hours' });
    return decisions;
  },
};