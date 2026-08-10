// ─── Step1b — Business Intelligence Discovery Engine ─────────────────────────
// Orchestrator: wraps BusinessCommandCenter and handles registration flow integration.
// This is a REPLACEMENT of the previous placeholder component.
// Architecture: Step1b/ (types, constants, engines, services, components)

import React from 'react';
import { BusinessCommandCenter } from './Step1b/components/CommandCenter';
import type { Step1bProps, Step1bOutput } from './Step1b/types/business';

// Re-export types for consuming components
export type { Step1bProps, Step1bOutput } from './Step1b/types/business';

export default function Step1b_BusinessType({ onNext, onBack, initialData, userId }: Step1bProps) {
  const handleComplete = (output: Step1bOutput) => {
    // Future: persist to Supabase here before calling onNext
    // await supabase.from('business_profiles').upsert({ user_id: userId, ...output.businessDNA })
    onNext(output);
  };

  return (
    <BusinessCommandCenter
      onComplete={handleComplete}
      onBack={onBack}
      initialData={initialData}
    />
  );
}

// Named export for lazy loading
export { BusinessCommandCenter };
