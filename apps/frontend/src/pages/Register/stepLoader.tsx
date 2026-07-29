import { lazy } from 'react';

export const Step0_SelectAccount = lazy(() => import('./steps/Step0_SelectAccount'));
export const Step1_Role          = lazy(() => import('./steps/Step1_Role'));
export const Step2_Category      = lazy(() => import('./Step1_CategorySelect'));
export const Step3_Profession    = lazy(() => import('./Step2_ProfessionSelect'));
export const Step4_BasicInfo     = lazy(() => import('./Step3_BasicInfo'));
export const Step5_Professional  = lazy(() => import('./Step4_ProfessionalDetails'));
export const Step6_Documents     = lazy(() => import('./steps/Step6_Documents'));
export const Step7_Verification  = lazy(() => import('./steps/Step7_Verification'));
export const Step8_Review        = lazy(() => import('./Step4_Confirm'));
export const Step9_Complete      = lazy(() => import('./steps/Step9_Complete'));