import { useState, useCallback } from 'react';
import type { PaymentRequest, PaymentResult, PaymentMethodType, SavedPaymentMethod } from '../types';
import { PaymentOrchestrator } from '../gateway/PaymentOrchestrator';
import { PaymentGateway }      from '../gateway/PaymentGateway';
import { RiskEngine }          from '../compliance/RiskEngine';
import { CurrencyEngine }      from '../engines/CurrencyEngine';

export type CheckoutStep = 'method_selection' | 'details' | 'review' | 'processing' | 'success' | 'failed';

export interface CheckoutState {
  step:             CheckoutStep;
  amount:           number;     // integer minor units
  currency:         string;
  selectedMethod?:  PaymentMethodType;
  savedMethods:     SavedPaymentMethod[];
  result?:          PaymentResult;
  error?:           string;
  formattedAmount:  string;
}

export function useCheckout(options: {
  amount:      number;
  currency:    string;
  merchantId?: string;
  customerId?: string;
  description?: string;
  onSuccess?:  (result: PaymentResult) => void;
  onError?:    (error: string) => void;
}) {
  const [state, setState] = useState<CheckoutState>({
    step:            'method_selection',
    amount:          options.amount,
    currency:        options.currency,
    savedMethods:    [],
    formattedAmount: CurrencyEngine.format(options.amount, options.currency),
  });

  const selectMethod = useCallback((method: PaymentMethodType) => {
    setState(s => ({ ...s, selectedMethod: method, step: 'details' }));
  }, []);

  const goBack = useCallback(() => {
    setState(s => ({
      ...s,
      step:   s.step === 'details' ? 'method_selection'
            : s.step === 'review'  ? 'details'
            : s.step,
    }));
  }, []);

  const proceedToReview = useCallback(() => {
    setState(s => ({ ...s, step: 'review' }));
  }, []);

  const submit = useCallback(async (paymentToken?: string, savedMethodId?: string): Promise<PaymentResult> => {
    setState(s => ({ ...s, step: 'processing', error: undefined }));

    const request: PaymentRequest = {
      amount:        options.amount,
      currency:      options.currency,
      method:        state.selectedMethod ?? 'card',
      merchantId:    options.merchantId,
      customerId:    options.customerId,
      description:   options.description,
      paymentToken,
      savedMethodId,
      idempotencyKey: crypto.randomUUID(),
    };

    // Risk assessment before charging
    const risk = await RiskEngine.assessTransaction(request, { userId: options.customerId });
    if (RiskEngine.shouldBlock(risk)) {
      const errMsg = 'Transaction blocked by risk assessment.';
      setState(s => ({ ...s, step: 'failed', error: errMsg }));
      options.onError?.(errMsg);
      return { success: false, error: { code: 'risk_blocked', message: errMsg } };
    }

    const result = await PaymentOrchestrator.charge(request, { idempotencyKey: request.idempotencyKey });

    if (result.success) {
      setState(s => ({ ...s, step: 'success', result }));
      options.onSuccess?.(result);
    } else {
      const errMsg = result.error?.message ?? 'Payment failed';
      setState(s => ({ ...s, step: 'failed', error: errMsg, result }));
      options.onError?.(errMsg);
    }

    return result;
  }, [state.selectedMethod, options]);

  const loadSavedMethods = useCallback(async () => {
    if (!options.customerId) return;
    const methods = await PaymentGateway.getSavedMethods(options.customerId);
    setState(s => ({ ...s, savedMethods: methods }));
  }, [options.customerId]);

  const reset = useCallback(() => {
    setState({
      step:            'method_selection',
      amount:          options.amount,
      currency:        options.currency,
      savedMethods:    state.savedMethods,
      formattedAmount: CurrencyEngine.format(options.amount, options.currency),
    });
  }, [options.amount, options.currency, state.savedMethods]);

  return { state, selectMethod, goBack, proceedToReview, submit, loadSavedMethods, reset };
}
