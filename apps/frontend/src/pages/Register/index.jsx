import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getRoleDefaultPath } from '../../config/roleConfig';

// ── Registration steps (selection) ───────────────────────────
import Step0_RoleSelect     from '../../components/registration/Step0_RoleSelect';
import Step0b_PersonalRole  from '../../components/registration/Step0b_PersonalRole';
import Step1b_BusinessType  from '../../components/registration/Step1b_BusinessType';
import Step1_CategorySelect from '../../components/registration/Step1_CategorySelect';
import Step2_SubCategory    from '../../components/registration/Step2_SubCategory';
import Step3_Profession     from '../../components/registration/Step3_Profession';

// ── Registration steps (form) ─────────────────────────────────
import Step3_BasicInfo   from './Step3_BasicInfo';
import Step4_Confirm     from './Step4_Confirm';
import Step_BusinessInfo from './Step_BusinessInfo';
import RegistrationProgress from './RegistrationProgress';

// ── Role type → backend role resolution ──────────────────────
const EMPLOYER_CATEGORY_ROLE = {
  hotel:               'hotel',
  restaurant:          'restaurant',
  hospital:            'hospital',
  clinic:              'clinic',
  tourism:             'tourism',
  enterprise:          'enterprise',
  company:             'company',
  ngo:                 'company',
  marketplace_sellers: 'company',
};

function resolveBackendRole(roleType, categoryId) {
  if (roleType === 'worker')           return 'worker';
  if (roleType === 'service_provider') return 'service_provider';
  return EMPLOYER_CATEGORY_ROLE[categoryId] || 'company';
}

// ── Internal step IDs ─────────────────────────────────────────
const STEPS = {
  ACCOUNT_TYPE:  0,  // Kont Pèsonèl vs Kont Biznis
  PERSONAL_ROLE: 1,  // Chèche travay / Ofri sèvis / Freelancer  (personal only)
  BUSINESS_TYPE: 2,  // Hotel / Restoran / Konpayi...             (business only)
  CATEGORY:      3,  // Professional categories                   (personal only)
  SUBCATEGORY:   4,
  PROFESSION:    5,
  BASIC_INFO:    6,  // personal only — after this: confirm step
  BUSINESS_INFO: 7,  // business only — has its own submit button
  CONFIRM:       8,  // personal only — final confirm screen
};

// Maps internal steps to visual progress position (1–4)
// Returns 0 on ACCOUNT_TYPE step → progress bar hidden
const toVisualStep = (step) => {
  if (step <= STEPS.ACCOUNT_TYPE) return 0;
  if (step <= STEPS.SUBCATEGORY)  return 1;
  if (step === STEPS.PROFESSION)  return 2;
  if (step === STEPS.BASIC_INFO || step === STEPS.BUSINESS_INFO) return 3;
  if (step === STEPS.CONFIRM)     return 4;
  return 0;
};

// Step title lookup (Haitian Creole)
const STEP_TITLES = {
  [STEPS.ACCOUNT_TYPE]:  'Ki kalite kont?',
  [STEPS.PERSONAL_ROLE]: 'Ki wòl ou?',
  [STEPS.BUSINESS_TYPE]: 'Ki kalite biznis?',
  [STEPS.CATEGORY]:      'Chwazi Kategori',
  [STEPS.SUBCATEGORY]:   'Sous-Kategori',
  [STEPS.PROFESSION]:    'Pwofesyon',
  [STEPS.BASIC_INFO]:    'Enfòmasyon Ou',
  [STEPS.BUSINESS_INFO]: 'Enfòmasyon Biznis',
  [STEPS.CONFIRM]:       'Prèt pou Kreye Kont',
};

// Legacy i18n key lookup (kept for backward compat with translated steps)
const STEP_KEY = {
  [STEPS.ACCOUNT_TYPE]:  null,
  [STEPS.PERSONAL_ROLE]: null,
  [STEPS.BUSINESS_TYPE]: null,
  [STEPS.CATEGORY]:      'stepCategory',
  [STEPS.SUBCATEGORY]:   'stepSubcategory',
  [STEPS.PROFESSION]:    'stepProfession',
  [STEPS.BASIC_INFO]:    'stepBasicInfo',
  [STEPS.BUSINESS_INFO]: null,
  [STEPS.CONFIRM]:       null,
};

// ─────────────────────────────────────────────────────────────
function Register() {
  const navigate             = useNavigate();
  const { t }                = useTranslation();
  const { login: authLogin } = useAuth();

  const [currentStep,    setCurrentStep]    = useState(STEPS.ACCOUNT_TYPE);
  const [loading,        setLoading]        = useState(false);
  const [slowLoad,       setSlowLoad]       = useState(false);
  const [errorMessage,   setErrorMessage]   = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const slowTimer = useRef(null);

  // Account type: 'personal' | 'business'
  const [accountType,         setAccountType]         = useState(null);

  // Role type selected in Step 1 personal ('worker' | 'service_provider')
  const [selectedRoleType,    setSelectedRoleType]    = useState(null);

  // Selection state — objects from registrationCategories / professionData
  const [selectedCategory,    setSelectedCategory]    = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedProfession,  setSelectedProfession]  = useState(null);

  const [formData, setFormData] = useState({
    roleType:        '',
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
      clearTimeout(slowTimer.current);
    };
  }, []);

  // Show "sèvè ap reveye" hint after 8s of loading
  useEffect(() => {
    clearTimeout(slowTimer.current);
    if (loading) {
      slowTimer.current = setTimeout(() => {
        if (mountedRef.current) setSlowLoad(true);
      }, 8000);
    } else {
      setSlowLoad(false);
    }
  }, [loading]);

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

  // ── Step 0: Account type selected (Personal vs Business) ────
  const handleAccountTypeSelect = useCallback((type) => {
    setAccountType(type);
    if (type === 'personal') setCurrentStep(STEPS.PERSONAL_ROLE);
    else                     setCurrentStep(STEPS.BUSINESS_TYPE);
  }, []);

  // ── Step 0b: Personal role selected ─────────────────────────
  const handlePersonalRoleSelect = useCallback((roleObj) => {
    const backendRoleType = roleObj.id === 'freelancer' ? 'service_provider' : roleObj.id;
    setSelectedRoleType(backendRoleType);
    setFormData(prev => ({ ...prev, roleType: backendRoleType }));
    setCurrentStep(STEPS.CATEGORY);
  }, []);

  // ── Step 1b: Business type selected ─────────────────────────
  const handleBusinessTypeSelect = useCallback((biz) => {
    setFormData(prev => ({
      ...prev,
      roleType:        'employer',
      role:            biz.role,
      category:        biz.id,
      subcategory:     '',
      profession:      biz.id,
      professionLabel: biz.label,
    }));
    setCurrentStep(STEPS.BUSINESS_INFO);
  }, []);

  // ── Step 1: Category selected (personal only) ───────────────
  const handleCategorySelect = useCallback((cat) => {
    setSelectedCategory(cat);
    setSelectedSubcategory(null);
    setSelectedProfession(null);
    const backendRole = resolveBackendRole(selectedRoleType, cat.id);
    setFormData(prev => ({
      ...prev,
      category:        cat.id,
      subcategory:     '',
      profession:      '',
      professionLabel: '',
      role:            backendRole,
    }));
    setCurrentStep(cat.hasSubcategories ? STEPS.SUBCATEGORY : STEPS.PROFESSION);
  }, [selectedRoleType]);

  // ── Step 1 search: direct profession select ─────────────────
  const handleDirectSelect = useCallback((cat, sub, profession) => {
    const backendRole = resolveBackendRole(selectedRoleType, cat.id);
    setSelectedCategory(cat);
    setSelectedSubcategory(sub);
    setSelectedProfession(profession);
    setFormData(prev => ({
      ...prev,
      category:        cat.id,
      subcategory:     sub?.id || '',
      profession:      profession.id,
      professionLabel: profession.label,
      role:            backendRole,
    }));
    setCurrentStep(STEPS.BASIC_INFO);
  }, [selectedRoleType]);

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

  // ── Step BASIC_INFO: personal — go to CONFIRM ───────────────
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
    setCurrentStep(STEPS.CONFIRM);
  }, []);

  // ── Submit: personal account registration ────────────────────
  const handleRegister = useCallback(async (professionalProfile = null) => {
    const isBusinessAcc = accountType === 'business';
    if (!formData.role || !formData.fullName || !formData.email || !formData.password) {
      setErrorMessage('Tanpri ranpli tout jaden obligatwa yo');
      return;
    }
    if (!isBusinessAcc && !formData.profession) {
      setErrorMessage('Tanpri chwazi pwofesyon ou');
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
        roleType:        formData.roleType,
        category:        formData.category,
        subcategory:     formData.subcategory || '',
        profession:      formData.profession,
        professionLabel: formData.professionLabel || formData.profession,
        profileMetadata: finalMetadata,
        accountType:     accountType === 'business' ? 'business' : 'individual',
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
            err?.response?.data?.message        ||
            err?.message                         ||
            'Enskripsyon echwe — tanpri eseye ankò'
      );
    } finally {
      if (mountedRef.current) setLoading(false);
      abortRef.current = null;
    }
  }, [formData, accountType, navigate, authLogin]);

  // ── Submit: business account registration ────────────────────
  const handleBusinessInfoSubmit = useCallback(async (bizData) => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const registrationData = {
        name:            bizData.name,
        email:           bizData.email,
        phone:           bizData.phone,
        password:        bizData.password,
        role:            formData.role,
        roleType:        'employer',
        category:        formData.category,
        subcategory:     '',
        profession:      formData.profession,
        professionLabel: formData.professionLabel,
        profileMetadata: {
          ...formData.profileMetadata,
          description:    bizData.description,
          businessExtras: bizData.extras,
        },
        accountType: 'business',
        city:        bizData.city,
        state:       '',
        country:     'ht',
      };

      const res = await API.post('/auth/register', registrationData, {
        signal: abortRef.current.signal,
      });

      if (!mountedRef.current) return;

      const responseBody = res?.data;
      const userObj      = responseBody?.data?.user;
      const regToken     = responseBody?.data?.token;

      setSuccessMessage(responseBody?.data?.message || 'Kont biznis kreye avèk siksè!');

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
            err?.response?.data?.message        ||
            err?.message                         ||
            'Enskripsyon echwe — tanpri eseye ankò'
      );
    } finally {
      if (mountedRef.current) setLoading(false);
      abortRef.current = null;
    }
  }, [formData, authLogin, navigate]);

  // ── Back navigation ─────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (currentStep === STEPS.PERSONAL_ROLE || currentStep === STEPS.BUSINESS_TYPE) {
      setAccountType(null);
      setCurrentStep(STEPS.ACCOUNT_TYPE);
    } else if (currentStep === STEPS.CATEGORY) {
      setSelectedRoleType(null);
      setCurrentStep(STEPS.PERSONAL_ROLE);
    } else if (currentStep === STEPS.SUBCATEGORY) {
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
    } else if (currentStep === STEPS.BUSINESS_INFO) {
      setCurrentStep(STEPS.BUSINESS_TYPE);
    } else if (currentStep === STEPS.CONFIRM) {
      setCurrentStep(STEPS.BASIC_INFO);
    }
  }, [currentStep, selectedCategory]);

  const visualStep = toVisualStep(currentStep);

  // ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen text-white flex flex-col p-6 relative" style={{ background: '#050B18' }}>

      {/* ── Cold-start overlay — shows after 8s of loading ── */}
      {loading && slowLoad && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050B18]/90 backdrop-blur-sm px-8 text-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-amber-400/30 border-t-amber-400 animate-spin" />
          <p className="text-base font-black text-white">Sèvè a ap reveye...</p>
          <p className="text-xs text-slate-400 max-w-xs">
            Sèvè gratuit la dòmi apre 15 min inaktivite. Tann 30 sègonn — li pral bon!
          </p>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(30,136,229,0.15),transparent_60%)] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between max-w-2xl mx-auto w-full z-10 mb-2">
        {currentStep > STEPS.ACCOUNT_TYPE ? (
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
          {STEP_KEY[currentStep]
            ? t(`registration.ui.${STEP_KEY[currentStep]}`, { defaultValue: STEP_TITLES[currentStep] })
            : STEP_TITLES[currentStep]}
        </h1>
        <div className="w-8" />
      </div>

      {/* Progress indicator — hidden on ACCOUNT_TYPE step */}
      {visualStep > 0 && (
        <RegistrationProgress
          current={visualStep}
          total={4}
          title={t('registration.progress', { defaultValue: 'Pwogrè Enskripsyon' })}
          stepLabels={[
            t('registration.ui.stepCategory'),
            t('registration.ui.stepProfession'),
            t('registration.ui.stepBasicInfo'),
            t('registration.complete', { defaultValue: 'Konplè' }),
          ]}
          stepTextFormatter={(cur, tot) => t('registration.stepOf', { cur, tot, defaultValue: `Etap ${cur} sou ${tot}` })}
        />
      )}

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
      <div className="w-full max-w-2xl mx-auto z-10 pb-24">

        {/* Step 0 — Account Type: Personal vs Business */}
        {currentStep === STEPS.ACCOUNT_TYPE && (
          <Step0_RoleSelect onSelect={handleAccountTypeSelect} />
        )}

        {/* Step 0b — Personal Role: Chèche travay / Ofri sèvis / Freelancer */}
        {currentStep === STEPS.PERSONAL_ROLE && (
          <Step0b_PersonalRole onSelect={handlePersonalRoleSelect} />
        )}

        {/* Step 1b — Business Type: Hotel / Restoran / Konpayi... */}
        {currentStep === STEPS.BUSINESS_TYPE && (
          <Step1b_BusinessType onSelect={handleBusinessTypeSelect} />
        )}

        {/* Step 1 — Category (personal accounts only) */}
        {currentStep === STEPS.CATEGORY && (
          <Step1_CategorySelect
            onSelect={handleCategorySelect}
            onDirectSelect={handleDirectSelect}
          />
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

        {/* Business: combined info + submit form */}
        {currentStep === STEPS.BUSINESS_INFO && (
          <Step_BusinessInfo
            businessType={formData.category}
            loading={loading}
            onSubmit={handleBusinessInfoSubmit}
          />
        )}

        {/* Personal: confirmation screen before submit */}
        {currentStep === STEPS.CONFIRM && (
          <Step4_Confirm
            formData={formData}
            loading={loading}
            onSubmit={handleRegister}
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