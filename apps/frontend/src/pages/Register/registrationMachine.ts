/**
 * registrationMachine.ts
 * State definitions for the multi-step registration flow.
 */

export const RegistrationStep = Object.freeze({
  SELECT_ACCOUNT: 0,
  ROLE:           1,
  CATEGORY:       2,
  PROFESSION:     3,
  BASIC_INFO:     4,
  PROFESSIONAL:   5,
  DOCUMENTS:      6,
  VERIFICATION:   7,
  REVIEW:         8,
  COMPLETE:       9,
} as const);

export type RegistrationStepValue = typeof RegistrationStep[keyof typeof RegistrationStep];

export const STEP_TITLES: Record<number, string> = {
  [RegistrationStep.SELECT_ACCOUNT]: 'Kreye Kont',
  [RegistrationStep.ROLE]:           'Chwazi Wòl',
  [RegistrationStep.CATEGORY]:       'Chwazi Kategori',
  [RegistrationStep.PROFESSION]:     'Chwazi Pwofesyon',
  [RegistrationStep.BASIC_INFO]:     'Enfòmasyon Debaz',
  [RegistrationStep.PROFESSIONAL]:   'Pwofil Pwofesyonèl',
  [RegistrationStep.DOCUMENTS]:      'Dokiman',
  [RegistrationStep.VERIFICATION]:   'Verifikasyon',
  [RegistrationStep.REVIEW]:         'Revize',
  [RegistrationStep.COMPLETE]:       'Konplè',
};

export function stepToVisual(step: number): number {
  if (step <= RegistrationStep.ROLE)         return 0;
  if (step <= RegistrationStep.PROFESSION)   return 1;
  if (step <= RegistrationStep.PROFESSIONAL) return 2;
  if (step <= RegistrationStep.VERIFICATION) return 3;
  return 4;
}