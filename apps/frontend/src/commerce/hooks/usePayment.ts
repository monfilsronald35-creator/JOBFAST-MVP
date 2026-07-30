import { useState, useCallback } from 'react';
import type { PaymentProviderId, CreatePaymentParams, PaymentIntent, TransactionResult, PaymentMethodConfig } from '../types';
import { PaymentGateway } from '../payments/PaymentGateway';

export function usePayment(countryCode = 'HT', currency = 'HTG') {
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [activeIntent,  setActiveIntent]  = useState<PaymentIntent | null>(null);
  const [result,        setResult]        = useState<TransactionResult | null>(null);

  const availableMethods: PaymentMethodConfig[] = PaymentGateway.getAvailableMethods(countryCode, currency);

  const createPayment = useCallback(async (
    providerId: PaymentProviderId,
    params:     CreatePaymentParams,
  ): Promise<PaymentIntent | null> => {
    setLoading(true); setError(null); setActiveIntent(null); setResult(null);
    try {
      const intent = await PaymentGateway.createPayment(providerId, params);
      setActiveIntent(intent);
      return intent;
    } catch (e) {
      setError((e as Error).message); return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmPayment = useCallback(async (
    providerId: PaymentProviderId,
    intentId:   string,
    data?:      unknown,
  ): Promise<TransactionResult | null> => {
    setLoading(true); setError(null);
    try {
      const r = await PaymentGateway.confirmPayment(providerId, intentId, data);
      setResult(r);
      return r;
    } catch (e) {
      setError((e as Error).message); return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refund = useCallback(async (
    providerId:    PaymentProviderId,
    transactionId: string,
    amount?:       number,
  ) => {
    setLoading(true); setError(null);
    try {
      return await PaymentGateway.refund(providerId, transactionId, amount);
    } catch (e) {
      setError((e as Error).message); return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = () => { setActiveIntent(null); setResult(null); setError(null); };

  return {
    availableMethods,
    createPayment,
    confirmPayment,
    refund,
    activeIntent,
    result,
    loading,
    error,
    reset,
  };
}