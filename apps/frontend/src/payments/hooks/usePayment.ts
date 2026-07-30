import { useState, useCallback } from 'react';
import type { PaymentRequest, PaymentResult, RefundRequest, RefundResult } from '../types';
import { PaymentOrchestrator } from '../gateway/PaymentOrchestrator';
import { PaymentGateway }      from '../gateway/PaymentGateway';

export function usePayment() {
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [result,   setResult]   = useState<PaymentResult | null>(null);
  const [requiresAction, setRequiresAction] = useState(false);

  const charge = useCallback(async (request: PaymentRequest): Promise<PaymentResult> => {
    setLoading(true);
    setError(null);
    setRequiresAction(false);
    try {
      const res = await PaymentOrchestrator.charge(request, { idempotencyKey: request.idempotencyKey });
      setResult(res);
      if (res.requiresAction) setRequiresAction(true);
      if (!res.success) setError(res.error?.message ?? 'Payment failed');
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed';
      setError(msg);
      return { success: false, error: { code: 'unexpected', message: msg } };
    } finally {
      setLoading(false);
    }
  }, []);

  const confirm = useCallback(async (intentId: string, data?: unknown): Promise<PaymentResult> => {
    setLoading(true);
    setError(null);
    try {
      const res = await PaymentGateway.confirm(intentId, data);
      setResult(res);
      setRequiresAction(false);
      if (!res.success) setError(res.error?.message ?? 'Confirm failed');
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Confirm failed';
      setError(msg);
      return { success: false, error: { code: 'confirm_failed', message: msg } };
    } finally {
      setLoading(false);
    }
  }, []);

  const refund = useCallback(async (request: RefundRequest): Promise<RefundResult> => {
    setLoading(true);
    setError(null);
    try {
      return await PaymentGateway.refund(request);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Refund failed';
      setError(msg);
      return { success: false, amount: 0, currency: 'USD', status: 'failed', createdAt: Date.now() };
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setRequiresAction(false);
  }, []);

  return { loading, error, result, requiresAction, charge, confirm, refund, reset };
}
