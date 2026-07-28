// src/features/register/index.jsx
import React, { Suspense, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../context/AuthContext';
import { getRoleDefaultPath } from '../../config/roleConfig';
import RegistrationProgress from './RegistrationProgress';
import {
  RegistrationStep,
  stepToVisual,
  STEP_TITLES,
} from './registrationMachine';
import { StepErrorBoundary } from '../../components/common/StepErrorBoundary';
import {
  Step0_SelectAccount,
  Step1_Role,
  Step2_Category,
  Step3_Profession,
  Step4_BasicInfo,
  Step5_Professional,
  Step6_Documents,
  Step7_Verification,
  Step8_Review,
  Step9_Complete,
} from './stepLoader';
import { useRegistrationEngine } from './useRegistrationEngine';

// IDEALLY: chak StepX_* deja defini kòm React.memo nan fichye yo:
// export default React.memo(Step4_BasicInfo);

const STEP_COMPONENTS = {
  [RegistrationStep.SELECT_ACCOUNT]: Step0_SelectAccount,
  [RegistrationStep.ROLE]: Step1_Role,
  [RegistrationStep.CATEGORY]: Step2_Category,
  [RegistrationStep.PROFESSION]: Step3_Profession,
  [RegistrationStep.BASIC_INFO]: Step4_BasicInfo,
  [RegistrationStep.PROFESSIONAL]: Step5_Professional,
  [RegistrationStep.DOCUMENTS]: Step6_Documents,
  [RegistrationStep.VERIFICATION]: Step7_Verification,
  [RegistrationStep.REVIEW]: Step8_Review,
  [RegistrationStep.COMPLETE]: Step9_Complete,
};

function StepSkeleton() {
  return (
    <div className="grid gap-3">
      <div className="h-10 rounded-2xl bg-slate-800/70" />
      <div className="h-10 rounded-2xl bg-slate-800/70" />
      <div className="h-32 rounded-2xl bg-slate-800/70" />
    </div>
  );
}

function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login: authLogin } = useAuth();

  const {
    state,
    goBack,
    selectAccountType,
    setRoleAndNext,
    setCategoryAndNext,
    setProfessionAndNext,
    submitBasicInfo,
    submitProfessional,
    submitDocuments,
    submitPreferences,
    submitReview,
    completeRegistration,
  } = useRegistrationEngine();

  const visualStep = stepToVisual(state.currentStep);

  // Virtual current step (pa gen if/===)
  const CurrentStep = STEP_COMPONENTS[state.currentStep];

  // Memoize props pou evite kreye nouvo obj chak render
  const progressProps = useMemo(
    () => ({
      current: visualStep,
      total: 4,
      title: t('registration.progress', {
        defaultValue: 'Pwogrè Enskripsyon',
      }),
      stepLabels: [
        t('registration.ui.stepCategory'),
        t('registration.ui.stepProfession'),
        t('registration.ui.stepBasicInfo'),
        t('registration.complete', { defaultValue: 'Konplè' }),
      ],
      stepTextFormatter: (cur, tot) =>
        t('registration.stepOf', {
          cur,
          tot,
          defaultValue: `Etap ${cur} sou ${tot}`,
        }),
    }),
    [t, visualStep],
  );

  const handleComplete = async () => {
    try {
      const result = await completeRegistration();
      const user = result?.user;
      const token = result?.token;
      if (user) {
        authLogin(token ? { ...user, token } : user);
        navigate(getRoleDefaultPath(user.role));
      } else {
        navigate('/login');
      }
    } catch {
      // error deja nan state.error, engine a jere analytics / rollback
    }
  };

  // Props selektif (pa pase tout state la)
  const stepProps = useMemo(() => {
    switch (state.currentStep) {
      case RegistrationStep.SELECT_ACCOUNT:
        return {
          onSelect: selectAccountType,
        };
      case RegistrationStep.ROLE:
        return {
          accountType: state.accountType,
          onSelect: setRoleAndNext,
        };
      case RegistrationStep.CATEGORY:
        return {
          roleType: state.roleType,
          onSelect: setCategoryAndNext,
        };
      case RegistrationStep.PROFESSION:
        return {
          categoryId: state.category,
          onSelect: setProfessionAndNext,
        };
      case RegistrationStep.BASIC_INFO:
        return {
          defaultValues: state.basicInfo,
          onNext: submitBasicInfo,
        };
      case RegistrationStep.PROFESSIONAL:
        return {
          defaultValues: state.professional,
          onNext: submitProfessional,
          onBack: goBack,
        };
      case RegistrationStep.DOCUMENTS:
        return {
          defaultValues: state.documents,
          onNext: submitDocuments,
          onBack: goBack,
        };
      case RegistrationStep.VERIFICATION:
        return {
          defaultValues: state.preferences,
          onNext: submitPreferences,
          onBack: goBack,
        };
      case RegistrationStep.REVIEW:
        return {
          reviewData: {
            basicInfo: state.basicInfo,
            professional: state.professional,
            documents: state.documents,
            preferences: state.preferences,
          },
          onBack: goBack,
          onReview: submitReview,
          onComplete: handleComplete,
          submitting: state.isSubmitting,
        };
      case RegistrationStep.COMPLETE:
      default:
        return {};
    }
  }, [
    goBack,
    handleComplete,
    selectAccountType,
    setRoleAndNext,
    setCategoryAndNext,
    setProfessionAndNext,
    state.accountType,
    state.basicInfo,
    state.category,
    state.currentStep,
    state.documents,
    state.isSubmitting,
    state.preferences,
    state.professional,
    submitBasicInfo,
    submitDocuments,
    submitPreferences,
    submitProfessional,
    submitReview,
  ]);

  return (
    <main
      className="relative flex min-h-screen flex-col p-6 text-white"
      style={{ background: '#050B18' }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(30,136,229,0.15),transparent_60%)]" />

      {/* Header */}
      <div className="z-10 mx-auto mb-2 flex w-full max-w-2xl items-center justify-between">
        {state.currentStep > RegistrationStep.SELECT_ACCOUNT ? (
          <button
            onClick={goBack}
            className="text-xl transition hover:opacity-70"
            aria-label={t('common.back', { defaultValue: 'Retounen' })}
          >
            ⬅️
          </button>
        ) : (
          <div className="w-8" />
        )}
        <h1 className="flex-1 text-center text-lg font-bold">
          {STEP_TITLES[state.currentStep]}
        </h1>
        <div className="w-8" />
      </div>

      {/* Progress */}
      {visualStep > 0 && <RegistrationProgress {...progressProps} />}

      {/* Error banner */}
      <div className="z-10 mx-auto w-full max-w-2xl">
        {state.error && (
          <div className="mb-3 rounded-xl border border-red-500 bg-red-500/20 p-3 text-center text-sm text-red-300">
            {state.error}
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="z-10 mx-auto w-full max-w-2xl pb-24">
        {CurrentStep ? (
          <StepErrorBoundary>
            <Suspense fallback={<StepSkeleton />}>
              <CurrentStep {...stepProps} />
            </Suspense>
          </StepErrorBoundary>
        ) : null}
      </div>

      {/* Footer */}
      <p className="z-10 mt-2 text-center text-xs text-gray-400">
        {t('registration.alreadyHaveAccount')}{' '}
        <button
          onClick={() => navigate('/login')}
          className="font-bold text-blue-400 hover:underline"
        >
          {t('auth.login')}
        </button>
      </p>
    </main>
  );
}

export default React.memo(Register);
