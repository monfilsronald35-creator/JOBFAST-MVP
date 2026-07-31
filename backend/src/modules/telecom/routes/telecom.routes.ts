import { Router }             from 'express';
import { requireAuth }        from '../../../core/middleware/auth.middleware.js';
import { TelecomController }  from '../controllers/TelecomController.js';

export const telecomRouter = Router();
const R = requireAuth;
const C = TelecomController;

// ── Operators ────────────────────────────────────────────────────────────────
telecomRouter.get   ('/operators',                       R, C.listAllOperators);
telecomRouter.get   ('/mine',                            R, C.listOperators);
telecomRouter.post  ('/operators',                       R, C.registerOperator);
telecomRouter.get   ('/operators/:opId',                 R, C.getOperator);
telecomRouter.get   ('/operators/:opId/config',          R, C.getOperatorConfig);
telecomRouter.patch ('/operators/:opId/config',          R, C.updateOperatorConfig);

// ── Dashboard ────────────────────────────────────────────────────────────────
telecomRouter.get   ('/operators/:opId/dashboard',       R, C.getDashboard);
telecomRouter.get   ('/operators/:opId/analytics',       R, C.getAnalytics);

// ── Bundles ──────────────────────────────────────────────────────────────────
telecomRouter.get   ('/operators/:opId/bundles',         R, C.listBundles);
telecomRouter.post  ('/operators/:opId/bundles',         R, C.createBundle);
telecomRouter.get   ('/operators/:opId/bundles/search',  R, C.searchBundles);
telecomRouter.post  ('/operators/:opId/bundles/recommend', R, C.recommendBundles);

// ── Recharge ─────────────────────────────────────────────────────────────────
telecomRouter.get   ('/operators/:opId/recharges',       R, C.listRecharges);
telecomRouter.post  ('/operators/:opId/recharges',       R, C.initiateRecharge);
telecomRouter.post  ('/operators/:opId/recharges/:rechargeId/refund',  R, C.refundRecharge);
telecomRouter.post  ('/operators/:opId/recharges/:rechargeId/cancel',  R, C.cancelRecharge);
telecomRouter.post  ('/operators/:opId/recharges/process-retries',     R, C.processRetries);

// ── SIM Management ───────────────────────────────────────────────────────────
telecomRouter.get   ('/sims',                            R, C.listSIMs);
telecomRouter.post  ('/operators/:opId/sims',            R, C.registerSIM);
telecomRouter.post  ('/operators/:opId/sims/:simId/kyc', R, C.verifyKYC);
telecomRouter.post  ('/operators/:opId/sims/replace',    R, C.replaceSIM);

// ── Billing ──────────────────────────────────────────────────────────────────
telecomRouter.get   ('/operators/:opId/bills',           R, C.listBills);
telecomRouter.post  ('/operators/:opId/bills',           R, C.createBill);
telecomRouter.post  ('/operators/:opId/bills/:billId/pay', R, C.payBill);

// ── Dealers ──────────────────────────────────────────────────────────────────
telecomRouter.get   ('/operators/:opId/dealers',                     R, C.listDealers);
telecomRouter.post  ('/operators/:opId/dealers',                     R, C.registerDealer);
telecomRouter.get   ('/operators/:opId/dealers/:dealerId/performance', R, C.getDealerPerformance);
telecomRouter.post  ('/operators/:opId/dealers/:dealerId/topup',     R, C.topUpDealer);

// ── Commissions ──────────────────────────────────────────────────────────────
telecomRouter.get   ('/operators/:opId/dealers/:dealerId/commissions', R, C.listCommissions);
telecomRouter.post  ('/operators/:opId/dealers/:dealerId/commissions/payout', R, C.payoutCommissions);

// ── Fraud ─────────────────────────────────────────────────────────────────────
telecomRouter.get   ('/operators/:opId/fraud',           R, C.listFraudEvents);

// ── AI ────────────────────────────────────────────────────────────────────────
telecomRouter.get   ('/operators/:opId/ai/insights',     R, C.getAIInsights);
telecomRouter.get   ('/operators/:opId/ai/recommend',    R, C.getAIRecommendations);
telecomRouter.get   ('/operators/:opId/ai/anomalies',    R, C.detectAnomalies);