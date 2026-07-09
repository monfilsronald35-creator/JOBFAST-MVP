import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../../api/axios';
import {
  PROFESSION_METADATA,
  getRequiredFields,
  getOptionalFields,
} from '../../constants/categories';
import { useAuth } from '../../context/AuthContext';
import ROLE_CONFIGS, {
  ROLE_PROFESSIONS,
  getRoleDefaultPath,
} from '../../config/roleConfig';
import Step1_CategorySelect from './Step1_CategorySelect';
import Step2_ProfessionSelect from './Step2_ProfessionSelect';
import Step3_BasicInfo from './Step3_BasicInfo';
import Step4_ProfessionalDetails from './Step4_ProfessionalDetails';
import RegistrationProgress from './RegistrationProgress';

const STEPS = {
  CATEGORY:     1,
  PROFESSION:   2,
  BASIC_INFO:   3,
  PROFESSIONAL: 4,
};

function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login: authLogin } = useAuth();

  const [currentStep, setCurrentStep] = useState(STEPS.CATEGORY);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    role:            '',
    category:        '',
    profession:      '',
    fullName:        '',
    email:           '',
    phone:           '',
    password:        '',
    confirmPassword: '',
    location:        '',
    country:         'ht',
    zone:            '',
    city:            '',
    profileMetadata: {},
  });

  const mountedRef = useRef(true);
  const abortRef   = useRef(null);
  const alertTimer = useRef(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      clearTimeout(alertTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!errorMessage && !successMessage) return;
    clearTimeout(alertTimer.current);
    alertTimer.current = setTimeout(() => {
      if (mountedRef.current) {
        setErrorMessage('');
        setSuccessMessage('');
      }
    }, 3500);
    return () => clearTimeout(alertTimer.current);
  }, [errorMessage, successMessage]);

  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateMetadata = useCallback((key, value) => {
    setFormData(prev => ({
      ...prev,
      profileMetadata: { ...prev.profileMetadata, [key]: value },
    }));
  }, []);

  // ── Step 1: Role selected ───────────────────────────────────
  const handleRoleSelect = useCallback((selectedRole) => {
    updateFormData('role', selectedRole);
    updateFormData('profession', '');
    updateFormData('category', '');
    setCurrentStep(STEPS.PROFESSION);
  }, [updateFormData]);

  // ── Step 2: Sub-role selected ────────────────────────────────
  const handleProfessionSelect = useCallback((professionId, jobRoleId) => {
    const profMeta = PROFESSION_METADATA[professionId];
    updateFormData('profession', professionId);
    updateFormData('category', profMeta?.category || '');
    if (jobRoleId) updateMetadata('jobRole', jobRoleId);
    setCurrentStep(STEPS.BASIC_INFO);
  }, [updateFormData, updateMetadata]);

  // ── Step 3: Basic info confirmed ────────────────────────────
  const handleBasicInfoNext = useCallback((basicData) => {
    updateFormData('fullName', basicData.fullName);
    updateFormData('email', basicData.email);
    updateFormData('phone', basicData.phone);
    updateFormData('password', basicData.password);
    updateFormData('country', basicData.country || 'ht');
    updateFormData('zone', basicData.zone || '');
    updateFormData('city', basicData.city || '');
    updateFormData('location', basicData.city || basicData.location || '');
    setCurrentStep(STEPS.PROFESSIONAL);
  }, [updateFormData]);

  // ── Step 4: Submit registration ─────────────────────────────
  const handleRegister = useCallback(async () => {
    if (!formData.role || !formData.profession || !formData.fullName || !formData.email || !formData.password) {
      setErrorMessage('Tanpri ranpli tout jaden obligatwa yo');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const registrationData = {
        name:            formData.fullName,
        email:           formData.email,
        phone:           formData.phone,
        password:        formData.password,
        role:            formData.role,
        category:        formData.category,
        profession:      formData.profession,
        profileMetadata: formData.profileMetadata,
        accountType:     'individual',
        city:            formData.city || formData.location || '',
        state:           formData.zone || '',
        country:         formData.country || 'ht',
      };

      const res = await API.post('/auth/register', registrationData, {
        signal: abortRef.current.signal,
      });

      if (!mountedRef.current) return;

      // Response shape: { success, meta, data: { message, token, user: {...} } }
      const responseBody = res?.data;
      const userObj      = responseBody?.data?.user;
      const regToken     = responseBody?.data?.token;
      const successMsg   = responseBody?.data?.message || 'Kont kreye avèk siksè!';

      setSuccessMessage(successMsg);

      if (userObj) {
        // Ensure _id is present for AuthContext.login() compatibility
        if (userObj.id && !userObj._id) userObj._id = userObj.id;

        // Include token so API interceptor can attach Authorization header
        authLogin(regToken ? { ...userObj, token: regToken } : userObj);

        setTimeout(() => {
          if (mountedRef.current) navigate(getRoleDefaultPath(userObj.role));
        }, 1500);
      } else {
        // Server responded without user data — fall back to login
        setTimeout(() => {
          if (mountedRef.current) navigate('/login');
        }, 1500);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      if (err?.code === 'ERR_CANCELED') return;

      const isNetworkError = err?.code === 'NETWORK_ERROR' || !err?.response;
      const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');

      if (isTimeout || isNetworkError) {
        setErrorMessage(
          'Sèvè a ap reveye (Render free tier). Tanpri eseye ankò nan 30 segond.'
        );
      } else {
        setErrorMessage(
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Enskripsyon echwe — tanpri eseye ankò'
        );
      }
    } finally {
      if (mountedRef.current) setLoading(false);
      abortRef.current = null;
    }
  }, [formData, navigate, authLogin]);

  // ── Professions for Step 2 (multi-profession roles only) ───
  const professions = useMemo(() => {
    const roleProfs = ROLE_PROFESSIONS[formData.role];
    return roleProfs ?? [];
  }, [formData.role]);

  const requiredFields = useMemo(() => getRequiredFields(formData.profession), [formData.profession]);
  const optionalFields = useMemo(() => getOptionalFields(formData.profession), [formData.profession]);

  // ── Back navigation ─────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (currentStep === STEPS.PROFESSION) {
      // From profession → role selection
      updateFormData('role', '');
      updateFormData('profession', '');
      updateFormData('category', '');
      setCurrentStep(STEPS.CATEGORY);
    } else if (currentStep === STEPS.BASIC_INFO) {
      setCurrentStep(STEPS.PROFESSION);
    } else if (currentStep === STEPS.PROFESSIONAL) {
      setCurrentStep(STEPS.BASIC_INFO);
    }
  }, [currentStep, formData.role, updateFormData]);

  const roleLabel = ROLE_CONFIGS[formData.role]?.label || '';

  return (
    <main className="min-h-screen bg-navy-900 text-white flex flex-col justify-between p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(30,136,229,0.15),transparent_60%)] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between max-w-2xl mx-auto w-full z-10">
        {currentStep > STEPS.CATEGORY && (
          <button
            onClick={handleBack}
            className="text-xl hover:opacity-70 transition"
            aria-label="Retounen"
          >
            ⬅️
          </button>
        )}
        <h1 className="font-bold text-lg flex-1 text-center">
          {currentStep === STEPS.CATEGORY    && 'Chwazi Wòl'}
          {currentStep === STEPS.PROFESSION  && 'Chwazi Pwofesyon'}
          {currentStep === STEPS.BASIC_INFO  && 'Enfòmasyon de Baz'}
          {currentStep === STEPS.PROFESSIONAL && `Detay ${roleLabel}`}
        </h1>
        <div className="w-8" />
      </div>

      {/* Progress bar */}
      <RegistrationProgress current={currentStep} total={STEPS.PROFESSIONAL} />

      {/* Step content */}
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-center z-10">
        {errorMessage && (
          <div className="mb-4 p-3 rounded bg-red-500/20 border border-red-500 text-red-300 text-center text-sm">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 rounded bg-green-500/20 border border-green-500 text-green-300 text-center text-sm">
            {successMessage}
          </div>
        )}

        {currentStep === STEPS.CATEGORY && (
          <Step1_CategorySelect
            selected={formData.role}
            onSelect={handleRoleSelect}
          />
        )}

        {currentStep === STEPS.PROFESSION && (
          <Step2_ProfessionSelect
            role={formData.role}
            category={formData.category}
            professions={professions}
            selected={formData.profession}
            onSelect={handleProfessionSelect}
          />
        )}

        {currentStep === STEPS.BASIC_INFO && (
          <Step3_BasicInfo
            data={formData}
            onNext={handleBasicInfoNext}
            loading={loading}
          />
        )}

        {currentStep === STEPS.PROFESSIONAL && (
          <Step4_ProfessionalDetails
            profession={formData.profession}
            metadata={formData.profileMetadata}
            onMetadataChange={updateMetadata}
            requiredFields={requiredFields}
            optionalFields={optionalFields}
            onSubmit={handleRegister}
            loading={loading}
          />
        )}
      </div>

      <p className="text-center text-xs text-gray-400 mb-2">
        Gen kont deja?{' '}
        <button
          onClick={() => navigate('/login')}
          className="text-blue-400 font-bold hover:underline"
        >
          Login
        </button>
      </p>
    </main>
  );
}

export default Register;