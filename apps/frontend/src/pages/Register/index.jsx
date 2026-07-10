import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getRoleDefaultPath } from '../../config/roleConfig';

// ── New 3-step category/profession selection ──────────────────
import Step1_CategorySelect from '../../components/registration/Step1_CategorySelect';
import Step2_SubCategory    from '../../components/registration/Step2_SubCategory';
import Step3_Profession     from '../../components/registration/Step3_Profession';

// ── Existing form steps ───────────────────────────────────────
import Step3_BasicInfo            from './Step3_BasicInfo';
import Step4_ProfessionalDetails  from './Step4_ProfessionalDetails';
import RegistrationProgress       from './RegistrationProgress';

// ── Category → backend role mapping ──────────────────────────
// Maps new registrationCategories IDs to backend USER_ROLES values
const CATEGORY_TO_ROLE = {
  construction:        'worker',
  services:            'service_provider',
  healthcare:          'worker',
  company:             'company',
  hotel:               'hotel',
  restaurant:          'restaurant',
  hospital:            'hospital',
  clinic:              'clinic',
  tourism:             'tourism',
  supplier:            'service_provider',
  enterprise:          'enterprise',
  it_software:         'worker',
  design_creative:     'worker',
  marketing_sales:     'worker',
  education:           'worker',
  legal:               'worker',
  finance_banking:     'worker',
  agriculture:         'worker',
  manufacturing:       'worker',
  logistics:           'service_provider',
  real_estate:         'worker',
  automotive:          'service_provider',
  pet_services:        'service_provider',
  beauty_spa:          'service_provider',
  entertainment:       'service_provider',
  music:               'worker',
  photography:         'service_provider',
  video_production:    'service_provider',
  marketplace_sellers: 'company',
  government:          'worker',
  ngo:                 'company',
};

// ── Internal step IDs ─────────────────────────────────────────
const STEPS = {
  CATEGORY:     1,
  SUBCATEGORY:  2,
  PROFESSION:   3,
  BASIC_INFO:   4,
  PROFESSIONAL: 5,
};

// Maps internal steps to visual progress position (1–4)
const toVisualStep = (step) => {
  if (step <= STEPS.SUBCATEGORY) return 1;
  if (step === STEPS.PROFESSION) return 2;
  if (step === STEPS.BASIC_INFO) return 3;
  return 4;
};

// ── Step titles ───────────────────────────────────────────────
const STEP_TITLES = {
  [STEPS.CATEGORY]:     'Chwazi Kategori',
  [STEPS.SUBCATEGORY]:  'Chwazi Domèn',
  [STEPS.PROFESSION]:   'Chwazi Pwofesyon',
  [STEPS.BASIC_INFO]:   'Enfòmasyon Debaz',
  [STEPS.PROFESSIONAL]: 'Pwofil Pwofesyonèl',
};

// ─────────────────────────────────────────────────────────────
function Register() {
  const navigate    = useNavigate();
  const { t }       = useTranslation();
  const { login: authLogin } = useAuth();

  const [currentStep, setCurrentStep] = useState(STEPS.CATEGORY);
  const [loading,      setLoading]      = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Selection state — objects from registrationCategories / professionData
  const [selectedCategory,   setSelectedCategory]   = useState(null);
  const [selectedSubcategory,setSelectedSubcategory] = useState(null);
  const [selectedProfession, setSelectedProfession]  = useState(null);

  const [formData, setFormData] = useState({
    role:            '',
    category:        '',
    subcategory:     '',
    profession:      '',
    professionLabel: '',
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

  // ── Step 1: Category selected ───────────────────────────────
  const handleCategorySelect = useCallback((cat) => {
    setSelectedCategory(cat);
    setSelectedSubcategory(null);
    setSelectedProfession(null);
    setFormData(prev => ({
      ...prev,
      category:        cat.id,
      subcategory:     '',
      profession:      '',
      professionLabel: '',
      role:            CATEGORY_TO_ROLE[cat.id] || 'worker',
    }));
    setCurrentStep(cat.hasSubcategories ? STEPS.SUBCATEGORY : STEPS.PROFESSION);
  }, []);

  // ── Step 2: Subcategory selected ────────────────────────────
  const handleSubcategorySelect = useCallback((sub) => {
    setSelectedSubcategory(sub);
    setSelectedProfession(null);
    updateFormData('subcategory', sub.id);
    setCurrentStep(STEPS.PROFESSION);
  }, [updateFormData]);

  // ── Step 3: Profession selected ─────────────────────────────
  const handleProfessionSelect = useCallback((profession) => {
    setSelectedProfession(profession);
    setFormData(prev => ({
      ...prev,
      profession:      profession.id,
      professionLabel: profession.label,
    }));
    setCurrentStep(STEPS.BASIC_INFO);
  }, []);

  // ── Step 4: Basic info confirmed ────────────────────────────
  const handleBasicInfoNext = useCallback((basicData) => {
    const profile  = basicData.profile  ?? {};
    const location = basicData.location ?? {};
    const security = basicData.security ?? {};

    setFormData(prev => ({
      ...prev,
      fullName: profile.fullName  ?? basicData.fullName  ?? '',
      email:    profile.email     ?? basicData.email     ?? '',
      phone:    profile.phone     ?? basicData.phone     ?? '',
      password: security.password ?? basicData.password  ?? '',
      country:  location.countryCode ?? basicData.country ?? 'ht',
      zone:     location.region      ?? basicData.zone    ?? '',
      city:     location.city        ?? basicData.city    ?? '',
      location: location.city        ?? basicData.city    ?? basicData.location ?? '',
    }));
    setCurrentStep(STEPS.PROFESSIONAL);
  }, []);

  // ── Step 5: Submit registration ─────────────────────────────
  const handleRegister = useCallback(async (professionalProfile = null) => {
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
      const finalMetadata = professionalProfile
        ? { ...formData.profileMetadata, professionalProfile }
        : formData.profileMetadata;

      const registrationData = {
        name:            formData.fullName,
        email:           formData.email,
        phone:           formData.phone,
        password:        formData.password,
        role:            formData.role,
        category:        formData.category,
        subcategory:     formData.subcategory || '',
        profession:      formData.profession,
        professionLabel: formData.professionLabel || formData.profession,
        profileMetadata: finalMetadata,
        accountType:     'individual',
        city:            formData.city    || formData.location || '',
        state:           formData.zone    || '',
        country:         formData.country || 'ht',
      };

      const res = await API.post('/auth/register', registrationData, {
        signal: abortRef.current.signal,
      });

      if (!mountedRef.current) return;

      const responseBody = res?.data;
      const userObj      = responseBody?.data?.user;
      const regToken     = responseBody?.data?.token;
      const successMsg   = responseBody?.data?.message || 'Kont kreye avèk siksè!';

      setSuccessMessage(successMsg);

      if (userObj) {
        if (userObj.id && !userObj._id) userObj._id = userObj.id;
        authLogin(regToken ? { ...userObj, token: regToken } : userObj);
        setTimeout(() => {
          if (mountedRef.current) navigate(getRoleDefaultPath(userObj.role));
        }, 1500);
      } else {
        setTimeout(() => {
          if (mountedRef.current) navigate('/login');
        }, 1500);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      if (err?.code === 'ERR_CANCELED') return;

      const isTimeout      = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');
      const isNetworkError = err?.code === 'NETWORK_ERROR' || !err?.response;

      setErrorMessage(
        isTimeout || isNetworkError
          ? 'Sèvè a ap reveye (Render free tier). Tanpri eseye ankò nan 30 segond.'
          : err?.response?.data?.error?.message ||
            err?.response?.data?.message       ||
            err?.message                        ||
            'Enskripsyon echwe — tanpri eseye ankò'
      );
    } finally {
      if (mountedRef.current) setLoading(false);
      abortRef.current = null;
    }
  }, [formData, navigate, authLogin]);

  // ── Back navigation ─────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (currentStep === STEPS.SUBCATEGORY) {
      setSelectedCategory(null);
      setCurrentStep(STEPS.CATEGORY);
    } else if (currentStep === STEPS.PROFESSION) {
      if (selectedCategory?.hasSubcategories) {
        setSelectedSubcategory(null);
        setCurrentStep(STEPS.SUBCATEGORY);
      } else {
        setSelectedCategory(null);
        setCurrentStep(STEPS.CATEGORY);
      }
    } else if (currentStep === STEPS.BASIC_INFO) {
      setCurrentStep(STEPS.PROFESSION);
    } else if (currentStep === STEPS.PROFESSIONAL) {
      setCurrentStep(STEPS.BASIC_INFO);
    }
  }, [currentStep, selectedCategory]);

  // ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-navy-900 text-white flex flex-col p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(30,136,229,0.15),transparent_60%)] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between max-w-2xl mx-auto w-full z-10 mb-2">
        {currentStep > STEPS.CATEGORY ? (
          <button
            onClick={handleBack}
            className="text-xl hover:opacity-70 transition"
            aria-label="Retounen"
          >
            ⬅️
          </button>
        ) : (
          <div className="w-8" />
        )}
        <h1 className="font-bold text-lg flex-1 text-center">
          {STEP_TITLES[currentStep]}
        </h1>
        <div className="w-8" />
      </div>

      {/* Progress indicator */}
      <RegistrationProgress
        current={toVisualStep(currentStep)}
        total={4}
        title="Pwogrè Enskripsyon"
        stepLabels={['Kategori', 'Pwofesyon', 'Enfòmasyon', 'Konplè']}
        stepTextFormatter={(c, tot) => `Etap ${c} sou ${tot}`}
      />

      {/* Alerts */}
      <div className="w-full max-w-2xl mx-auto z-10">
        {errorMessage && (
          <div className="mb-3 p-3 rounded-xl bg-red-500/20 border border-red-500 text-red-300 text-center text-sm">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-3 p-3 rounded-xl bg-green-500/20 border border-green-500 text-green-300 text-center text-sm">
            {successMessage}
          </div>
        )}
      </div>

      {/* Step content */}
      <div className="w-full max-w-2xl mx-auto flex-1 z-10 pb-4 overflow-y-auto">

        {currentStep === STEPS.CATEGORY && (
          <Step1_CategorySelect onSelect={handleCategorySelect} />
        )}

        {currentStep === STEPS.SUBCATEGORY && selectedCategory && (
          <Step2_SubCategory
            category={selectedCategory}
            onSelect={handleSubcategorySelect}
            onBack={handleBack}
          />
        )}

        {currentStep === STEPS.PROFESSION && selectedCategory && (
          <Step3_Profession
            category={selectedCategory}
            subcategory={selectedSubcategory}
            onSelect={handleProfessionSelect}
            onBack={handleBack}
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
            requiredFields={[]}
            optionalFields={[]}
            onSubmit={handleRegister}
            loading={loading}
          />
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 mt-2 z-10">
        {t('registration.alreadyHaveAccount')}{' '}
        <button
          onClick={() => navigate('/login')}
          className="text-blue-400 font-bold hover:underline"
        >
          {t('auth.login')}
        </button>
      </p>
    </main>
  );
}

export default Register;
