import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../../api/axios';
import { CATEGORIES, getProfessionsByCategory, getRequiredFields, getOptionalFields } from '../../constants/categories';
import Step1_CategorySelect from './Step1_CategorySelect';
import Step2_ProfessionSelect from './Step2_ProfessionSelect';
import Step3_BasicInfo from './Step3_BasicInfo';
import Step4_ProfessionalDetails from './Step4_ProfessionalDetails';
import RegistrationProgress from './RegistrationProgress';

const STEPS = {
  CATEGORY: 1,
  PROFESSION: 2,
  BASIC_INFO: 3,
  PROFESSIONAL: 4,
};

function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(STEPS.CATEGORY);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    category: '',
    profession: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    location: '',
    profileMetadata: {},
  });

  const mountedRef = useRef(true);
  const abortRef = useRef(null);
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
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const updateMetadata = useCallback((key, value) => {
    setFormData(prev => ({
      ...prev,
      profileMetadata: {
        ...prev.profileMetadata,
        [key]: value,
      },
    }));
  }, []);

  const handleCategorySelect = useCallback((categoryId) => {
    updateFormData('category', categoryId);
    updateFormData('profession', '');
    setCurrentStep(STEPS.PROFESSION);
  }, [updateFormData]);

  const handleProfessionSelect = useCallback((professionId) => {
    updateFormData('profession', professionId);
    setCurrentStep(STEPS.BASIC_INFO);
  }, [updateFormData]);

  const handleBasicInfoNext = useCallback((basicData) => {
    updateFormData('fullName', basicData.fullName);
    updateFormData('email', basicData.email);
    updateFormData('phone', basicData.phone);
    updateFormData('password', basicData.password);
    updateFormData('location', basicData.location);
    setCurrentStep(STEPS.PROFESSIONAL);
  }, [updateFormData]);

  const handleRegister = useCallback(async () => {
    if (!formData.category || !formData.profession || !formData.fullName || !formData.email || !formData.password) {
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
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        category: formData.category,
        profession: formData.profession,
        profileMetadata: formData.profileMetadata,
        accountType: 'individual',
        city: formData.location || 'Punta Cana',
        state: 'Bavaro',
      };

      const res = await API.post('/auth/register', registrationData, {
        signal: abortRef.current.signal,
      });

      if (!mountedRef.current) return;

      const user = res?.data?.user || res?.data;
      if (user?.id && !user?._id) {
        user._id = user.id;
      }

      if (user) {
        localStorage.setItem('jobfast_user', JSON.stringify({ token: null, user }));
      }

      setSuccessMessage(res?.data?.message || 'Kont kreye avèk siksè!');
      setTimeout(() => {
        if (mountedRef.current) navigate('/login');
      }, 1500);
    } catch (err) {
      if (!mountedRef.current) return;
      if (err?.code === 'ERR_CANCELED') return;

      setErrorMessage(
        err?.response?.data?.error?.message ||
        err?.message ||
        'Enskripsyon echwe'
      );
    } finally {
      if (mountedRef.current) setLoading(false);
      abortRef.current = null;
    }
  }, [formData, navigate]);

  const professions = useMemo(() => {
    return getProfessionsByCategory(formData.category);
  }, [formData.category]);

  const requiredFields = useMemo(() => {
    return getRequiredFields(formData.profession);
  }, [formData.profession]);

  const optionalFields = useMemo(() => {
    return getOptionalFields(formData.profession);
  }, [formData.profession]);

  const handleBack = useCallback(() => {
    if (currentStep === STEPS.PROFESSION) {
      updateFormData('category', '');
      updateFormData('profession', '');
      setCurrentStep(STEPS.CATEGORY);
    } else if (currentStep === STEPS.BASIC_INFO) {
      setCurrentStep(STEPS.PROFESSION);
    } else if (currentStep === STEPS.PROFESSIONAL) {
      setCurrentStep(STEPS.BASIC_INFO);
    }
  }, [currentStep, updateFormData]);

  const categoryName = formData.category
    ? CATEGORIES[Object.keys(CATEGORIES).find(k => CATEGORIES[k].id === formData.category)]?.label
    : '';

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
          {currentStep === STEPS.CATEGORY && 'Chwazi Kategori'}
          {currentStep === STEPS.PROFESSION && 'Chwazi Pwofesyon'}
          {currentStep === STEPS.BASIC_INFO && 'Enfòmasyon de Baz'}
          {currentStep === STEPS.PROFESSIONAL && `Detay ${categoryName}`}
        </h1>
        <div className="w-8" />
      </div>

      {/* Progress */}
      <RegistrationProgress current={currentStep} total={STEPS.PROFESSIONAL} />

      {/* Content */}
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
            selected={formData.category}
            onSelect={handleCategorySelect}
          />
        )}

        {currentStep === STEPS.PROFESSION && (
          <Step2_ProfessionSelect
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
        Gen kont deja? <button onClick={() => navigate('/login')} className="text-blue-400 font-bold hover:underline">Login</button>
      </p>
    </main>
  );
}

export default Register;
