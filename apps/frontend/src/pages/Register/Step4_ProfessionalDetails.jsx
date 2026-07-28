import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import AvatarUpload from '../../components/AvatarUpload';

function normalizeText(v) {
  return String(v || '').trim();
}

function listFromResponse(resp) {
  const data = resp?.data ?? resp;
  return Array.isArray(data) ? data : [];
}

function normalizeProfession(p) {
  if (!p) return null;
  const id = p.id ?? p.professionId ?? p._id ?? '';
  if (!id) return null;
  return {
    id,
    code: p.code ?? '',
    slug: p.slug ?? '',
    name: p.name ?? p.label ?? p.displayName ?? p.nativeName ?? id,
    categoryId: p.categoryId ?? '',
    categoryName: p.categoryName ?? '',
  };
}

function normalizeLanguage(lang) {
  if (!lang) return null;
  const code = lang.code ?? lang.id ?? '';
  if (!code) return null;
  return {
    code,
    name: lang.name ?? lang.label ?? lang.nativeName ?? lang.displayName ?? code,
    level: lang.level ?? 'intermediate',
  };
}

function normalizeSkill(skill) {
  if (!skill) return null;
  const skillId = skill.skillId ?? skill.id ?? skill._id ?? '';
  if (!skillId) return null;
  return {
    skillId,
    name: skill.name ?? skill.label ?? skill.displayName ?? skill.title ?? skillId,
    level: skill.level ?? 'intermediate',
    years: Number(skill.years ?? 0),
  };
}

function createEmptyMedia() {
  return {
    imageId: '',
    thumbnail: '',
    original: '',
    crop: null,
    mimeType: '',
    size: 0,
    cdnUrl: '',
  };
}

function buildEmptyEducation() {
  return {
    school: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    stillStudying: false,
  };
}

function mediaHasValue(photo) {
  return Boolean(photo?.imageId || photo?.cdnUrl || photo?.original || photo?.thumbnail);
}

function getServerMessage(err, fallback) {
  return err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;
}

function buildPayload(values, registrationKey, locale) {
  const education = Array.isArray(values.education)
    ? values.education.map((edu) => ({
        school: normalizeText(edu.school),
        degree: normalizeText(edu.degree),
        fieldOfStudy: normalizeText(edu.fieldOfStudy),
        startDate: edu.startDate || '',
        endDate: edu.stillStudying ? '' : (edu.endDate || ''),
        stillStudying: !!edu.stillStudying,
      }))
    : [];

  const certifications = Array.isArray(values.certifications)
    ? values.certifications.map((cert) => ({
        name: normalizeText(cert.name),
        issuer: normalizeText(cert.issuer),
        year: Number.parseInt(cert.year, 10) || null,
      }))
    : [];

  return {
    registrationId: registrationKey,
    professionalDetails: {
      headline: normalizeText(values.headline),
      bio: normalizeText(values.bio),
      profession: values.profession,
      languages: (values.languages || []).map((l) => ({
        code: l.code,
        name: l.name,
        level: l.level || 'intermediate',
      })),
      skills: (values.skills || []).map((s) => ({
        skillId: s.skillId,
        name: s.name,
        level: s.level || 'intermediate',
        years: Number(s.years || 0),
      })),
      experience: {
        ...values.experience,
        yearsExperience: Number(values.experience?.yearsExperience || 0),
      },
      availability: values.availability,
      contactPreferences: values.contactPreferences,
      media: values.media,
      links: values.links,
      education,
      certifications,
      salaryExpectation: values.salaryExpectation ? Number(values.salaryExpectation) : null,
      locale,
    },
  };
}

function Step4_ProfessionalDetails({
  registrationId,
  draftId,
  professionId,
  apiClient,
  onBack,
  onNext,
  onAutoSave,
  localeOverride,
  theme = {},
}) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const locale = localeOverride || i18n.language || 'en';
  const saveRef = useRef(null);
  const submittingRef = useRef(false);

  const form = useForm({
    defaultValues: {
      headline: '',
      bio: '',
      profession: {
        id: professionId || '',
        code: '',
        slug: '',
        name: '',
        categoryId: '',
        categoryName: '',
      },
      languages: [],
      skills: [],
      experience: {
        currentCompany: '',
        currentPosition: '',
        employmentType: '',
        industry: '',
        startDate: '',
        endDate: '',
        yearsExperience: 0,
      },
      availability: {
        online: false,
        availableNow: false,
        remote: false,
        onsite: false,
        hybrid: false,
        travel: false,
        workingHours: '',
      },
      contactPreferences: {
        allowPhone: false,
        allowChat: true,
        allowEmail: true,
        allowVideoCall: false,
        allowVoiceCall: false,
        allowWhatsApp: false,
        allowSMS: false,
        preferredContactMethod: '',
      },
      media: { profilePhoto: createEmptyMedia() },
      links: {
        portfolio: '',
        website: '',
        linkedin: '',
        github: '',
        behance: '',
      },
      education: [buildEmptyEducation()],
      certifications: [{ name: '', issuer: '', year: '' }],
      salaryExpectation: '',
      locale,
    },
    mode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  } = form;

  const skills = useFieldArray({ control, name: 'skills' });
  const languages = useFieldArray({ control, name: 'languages' });
  const education = useFieldArray({ control, name: 'education' });
  const certifications = useFieldArray({ control, name: 'certifications' });

  const watched = useWatch({ control });

  const { data: languageResp, isLoading: isLoadingLanguages } = useQuery({
    queryKey: ['languages', locale],
    queryFn: ({ signal }) => apiClient.get('/api/v1/languages', { signal }),
    enabled: !!apiClient?.get,
    staleTime: 1000 * 60 * 60,
    placeholderData: [],
  });

  const { data: professionResp, isLoading: isLoadingProfessions } = useQuery({
    queryKey: ['professions', locale],
    queryFn: ({ signal }) => apiClient.get('/api/v1/professions', { signal }),
    enabled: !!apiClient?.get,
    staleTime: 1000 * 60 * 60,
    placeholderData: [],
  });

  const { data: skillResp, isLoading: isLoadingSkills } = useQuery({
    queryKey: ['skills', locale],
    queryFn: ({ signal }) => apiClient.get(`/api/v1/skills?locale=${encodeURIComponent(locale)}`, { signal }),
    enabled: !!apiClient?.get,
    staleTime: 1000 * 60 * 60,
    placeholderData: [],
  });

  const languageOptions = useMemo(() => listFromResponse(languageResp).map(normalizeLanguage).filter(Boolean), [languageResp]);
  const professionOptions = useMemo(() => listFromResponse(professionResp).map(normalizeProfession).filter(Boolean), [professionResp]);
  const skillOptions = useMemo(() => listFromResponse(skillResp).map(normalizeSkill).filter(Boolean), [skillResp]);

  const registrationKey = registrationId ?? draftId ?? null;

  const validate = useCallback((values) => {
    const nextErrors = {};
    if (!normalizeText(values.headline)) nextErrors.headline = true;
    if (!values.profession?.id) nextErrors.profession = true;
    if (!normalizeText(values.bio)) nextErrors.bio = true;
    if (!Array.isArray(values.languages) || values.languages.length === 0) nextErrors.languages = true;
    if (!Array.isArray(values.skills) || values.skills.length === 0) nextErrors.skills = true;
    if (!normalizeText(values.experience?.currentCompany) && !Number(values.experience?.yearsExperience)) nextErrors.experience = true;

    const preferred = values.contactPreferences?.preferredContactMethod;
    const allowMap = {
      phone: values.contactPreferences?.allowPhone,
      chat: values.contactPreferences?.allowChat,
      email: values.contactPreferences?.allowEmail,
      whatsapp: values.contactPreferences?.allowWhatsApp,
      sms: values.contactPreferences?.allowSMS,
      video: values.contactPreferences?.allowVideoCall,
      voice: values.contactPreferences?.allowVoiceCall,
    };
    if (preferred && !allowMap[preferred]) nextErrors.contactPreferences = true;

    if (!mediaHasValue(values.media?.profilePhoto)) nextErrors.media = true;
    if (!Array.isArray(values.education) || values.education.length === 0) nextErrors.education = true;
    if (!Array.isArray(values.certifications) || values.certifications.length === 0) nextErrors.certifications = true;

    const invalidYear = (values.certifications || []).some((c) => c.year && !Number.isFinite(Number.parseInt(c.year, 10)));
    if (invalidYear) nextErrors.certificationsYear = true;

    return nextErrors;
  }, []);

  const autosave = useMemo(
    () =>
      debounce((payload) => {
        onAutoSave?.(payload);
      }, 1200),
    [onAutoSave],
  );

  useEffect(() => {
    saveRef.current = autosave;
    return () => {
      saveRef.current?.cancel?.();
    };
  }, [autosave]);

  useEffect(() => {
    if (!isDirty) return;
    const queued = buildPayload(watched, registrationKey, locale);
    saveRef.current?.(queued);
  }, [watched, isDirty, registrationKey, locale]);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      if (!apiClient?.patch) return payload;
      return apiClient.patch('/api/v1/registration/draft/professional-details', payload, { timeout: 30000 });
    },
    retry: 3,
    retryDelay: 1000,
    networkMode: 'offlineFirst',
  });

  const onSubmit = useCallback(async (values) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    clearErrors();

    try {
      if (!registrationKey) {
        setError('root', {
          type: 'manual',
          message: t('registration.step4.missing_registration_id', { defaultValue: 'Missing registration ID' }),
        });
        return;
      }

      const fieldErrors = validate(values);
      if (fieldErrors.headline) setError('headline', { type: 'required', message: t('errors.required', { defaultValue: 'Required' }) });
      if (fieldErrors.profession) setError('profession', { type: 'required', message: t('errors.required', { defaultValue: 'Required' }) });
      if (fieldErrors.bio) setError('bio', { type: 'required', message: t('errors.required', { defaultValue: 'Required' }) });
      if (fieldErrors.languages) setError('languages', { type: 'required', message: t('errors.required', { defaultValue: 'Required' }) });
      if (fieldErrors.skills) setError('skills', { type: 'required', message: t('errors.required', { defaultValue: 'Required' }) });
      if (fieldErrors.experience) setError('experience.yearsExperience', { type: 'required', message: t('errors.required', { defaultValue: 'Required' }) });
      if (fieldErrors.contactPreferences) setError('contactPreferences.preferredContactMethod', { type: 'validate', message: t('registration.step4.contact_method_mismatch', { defaultValue: 'Preferred contact method must be enabled' }) });
      if (fieldErrors.media) setError('media.profilePhoto', { type: 'required', message: t('errors.required', { defaultValue: 'Required' }) });
      if (fieldErrors.education) setError('education', { type: 'required', message: t('errors.required', { defaultValue: 'Required' }) });
      if (fieldErrors.certifications) setError('certifications', { type: 'required', message: t('errors.required', { defaultValue: 'Required' }) });
      if (fieldErrors.certificationsYear) setError('certifications.0.year', { type: 'validate', message: t('registration.step4.invalid_year', { defaultValue: 'Invalid year' }) });

      if (Object.keys(fieldErrors).length > 0) return;

      const payload = buildPayload(values, registrationKey, locale);
      const result = await mutation.mutateAsync(payload);
      const data = result?.data ?? result;
      queryClient.setQueryData(['registration-draft', registrationKey], data);
      onNext?.(data);
    } catch (err) {
      setError('root', {
        type: 'server',
        message: getServerMessage(err, t('registration.step4.save_failed', { defaultValue: 'Could not save details' })),
      });
    } finally {
      submittingRef.current = false;
    }
  }, [clearErrors, locale, mutation, onNext, queryClient, registrationKey, setError, t, validate]);

  const existingSkillIds = useMemo(() => new Set((skills.fields || []).map((s) => s.skillId).filter(Boolean)), [skills.fields]);
  const existingLanguageCodes = useMemo(() => new Set((languages.fields || []).map((l) => l.code).filter(Boolean)), [languages.fields]);

  const addSkill = useCallback((skill) => {
    if (!skill?.skillId || existingSkillIds.has(skill.skillId)) return;
    skills.append({ skillId: skill.skillId, name: skill.name, level: 'intermediate', years: 0 });
  }, [existingSkillIds, skills]);

  const addLanguage = useCallback((lang) => {
    if (!lang?.code || existingLanguageCodes.has(lang.code)) return;
    languages.append({ code: lang.code, name: lang.name, level: 'intermediate' });
  }, [existingLanguageCodes, languages]);

  const handleRemoveEducation = useCallback((index) => {
    if (education.fields.length <= 1) return;
    education.remove(index);
  }, [education]);

  const handleRemoveCertification = useCallback((index) => {
    if (certifications.fields.length <= 1) return;
    certifications.remove(index);
  }, [certifications]);

  const loadingQueries = isLoadingLanguages || isLoadingProfessions || isLoadingSkills;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`w-full max-w-5xl space-y-6 rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white ${mutation.isPending ? 'opacity-95' : ''}`}
      aria-labelledby="step4-professional-details-title"
      style={{ '--c-primary': theme.primary || '#f59e0b' }}
    >
      <h2 id="step4-professional-details-title" className="text-2xl font-black">
        {t('registration.step4.title', { defaultValue: 'Professional Details' })}
      </h2>

      {errors.root?.message ? (
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {errors.root.message}
        </p>
      ) : null}

      {loadingQueries ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="h-12 animate-pulse rounded-2xl bg-slate-800" />
          <div className="h-12 animate-pulse rounded-2xl bg-slate-800" />
          <div className="h-12 animate-pulse rounded-2xl bg-slate-800 md:col-span-2" />
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="headline" className="mb-2 block text-sm font-semibold text-slate-300">
            {t('registration.step4.headline', { defaultValue: 'Headline' })}
          </label>
          <input
            id="headline"
            aria-invalid={!!errors.headline}
            {...form.register('headline')}
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-amber-400"
          />
          {errors.headline ? <p className="mt-1 text-xs text-red-400">{t('errors.required', { defaultValue: 'Required' })}</p> : null}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="bio" className="mb-2 block text-sm font-semibold text-slate-300">
            {t('registration.step4.bio', { defaultValue: 'Bio' })}
          </label>
          <textarea
            id="bio"
            aria-invalid={!!errors.bio}
            {...form.register('bio')}
            rows={4}
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-amber-400"
          />
          {errors.bio ? <p className="mt-1 text-xs text-red-400">{t('errors.required', { defaultValue: 'Required' })}</p> : null}
        </div>

        <Controller
          control={control}
          name="profession"
          render={({ field }) => (
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                {t('registration.step4.profession', { defaultValue: 'Profession' })}
              </label>
              <select
                value={field.value?.id || ''}
                onChange={(e) => {
                  const item = professionOptions.find((p) => String(p.id) === e.target.value);
                  field.onChange(item || { id: e.target.value });
                }}
                aria-invalid={!!errors.profession}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">{t('registration.step4.select_profession', { defaultValue: 'Select profession' })}</option>
                {professionOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {errors.profession ? <p className="mt-1 text-xs text-red-400">{t('errors.required', { defaultValue: 'Required' })}</p> : null}
            </div>
          )}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-300">
            {t('registration.step4.languages', { defaultValue: 'Languages' })}
          </p>
          <div className="flex flex-wrap gap-2">
            {languageOptions.map((lang) => {
              const active = languages.fields.some((f) => f.code === lang.code);
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => (active ? languages.remove(languages.fields.findIndex((f) => f.code === lang.code)) : addLanguage(lang))}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${active ? 'bg-amber-400 text-black' : 'border border-slate-700 bg-slate-900 text-slate-300'}`}
                  aria-pressed={active}
                >
                  {lang.name}
                </button>
              );
            })}
          </div>
          {errors.languages ? <p className="mt-1 text-xs text-red-400">{t('errors.required', { defaultValue: 'Required' })}</p> : null}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-300">
            {t('registration.step4.skills', { defaultValue: 'Skills' })}
          </p>
          <div className="space-y-2">
            {skillOptions.map((skill) => {
              const active = skills.fields.some((s) => s.skillId === skill.skillId);
              return (
                <button
                  key={skill.skillId}
                  type="button"
                  onClick={() => (active ? skills.remove(skills.fields.findIndex((s) => s.skillId === skill.skillId)) : addSkill(skill))}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${active ? 'border-amber-400 bg-amber-400/10' : 'border-slate-700 bg-slate-900 hover:border-amber-400/60'}`}
                >
                  <span className="font-semibold">{skill.name}</span>
                </button>
              );
            })}
          </div>
          {errors.skills ? <p className="mt-1 text-xs text-red-400">{t('errors.required', { defaultValue: 'Required' })}</p> : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            {t('registration.step4.experience', { defaultValue: 'Experience' })}
          </label>
          <input {...form.register('experience.currentCompany')} aria-invalid={!!errors.experience} placeholder={t('registration.step4.current_company', { defaultValue: 'Current company' })} className="mb-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3" />
          <input {...form.register('experience.currentPosition')} placeholder={t('registration.step4.current_position', { defaultValue: 'Current position' })} className="mb-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3" />
          <select {...form.register('experience.employmentType')} className="mb-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3">
            <option value="">{t('registration.step4.employment_type', { defaultValue: 'Employment type' })}</option>
            <option value="full_time">{t('employment.full_time', { defaultValue: 'Full-time' })}</option>
            <option value="part_time">{t('employment.part_time', { defaultValue: 'Part-time' })}</option>
            <option value="contract">{t('employment.contract', { defaultValue: 'Contract' })}</option>
            <option value="freelance">{t('employment.freelance', { defaultValue: 'Freelance' })}</option>
          </select>
          <input {...form.register('experience.industry')} placeholder={t('registration.step4.industry', { defaultValue: 'Industry' })} className="mb-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3" />
          <input {...form.register('experience.startDate')} type="date" className="mb-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3" />
          <input {...form.register('experience.endDate')} type="date" className="mb-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3" />
          <input {...form.register('experience.yearsExperience')} type="number" min="0" aria-invalid={!!errors.experience} placeholder={t('registration.step4.years_experience', { defaultValue: 'Years experience' })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3" />
          {errors.experience ? <p className="mt-1 text-xs text-red-400">{t('errors.required', { defaultValue: 'Required' })}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            {t('registration.step4.availability', { defaultValue: 'Availability' })}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['online', 'availableNow', 'remote', 'onsite', 'hybrid', 'travel'].map((key) => (
              <label key={key} className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm">
                <input type="checkbox" {...form.register(`availability.${key}`)} />
                <span>{t(`registration.step4.${key}`, { defaultValue: key })}</span>
              </label>
            ))}
          </div>
          <input {...form.register('availability.workingHours')} placeholder={t('registration.step4.working_hours', { defaultValue: 'Working hours' })} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            {t('registration.step4.contact_preferences', { defaultValue: 'Contact preferences' })}
          </label>
          {['allowPhone', 'allowChat', 'allowEmail', 'allowVideoCall', 'allowVoiceCall', 'allowWhatsApp', 'allowSMS'].map((key) => (
            <label key={key} className="mb-2 flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm">
              <input type="checkbox" {...form.register(`contactPreferences.${key}`)} />
              <span>{t(`registration.step4.${key}`, { defaultValue: key })}</span>
            </label>
          ))}
          <select {...form.register('contactPreferences.preferredContactMethod')} aria-invalid={!!errors.contactPreferences} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3">
            <option value="">{t('registration.step4.preferred_contact_method', { defaultValue: 'Preferred contact method' })}</option>
            <option value="phone">{t('registration.step4.allowPhone', { defaultValue: 'Phone' })}</option>
            <option value="chat">{t('registration.step4.allowChat', { defaultValue: 'Chat' })}</option>
            <option value="email">{t('registration.step4.allowEmail', { defaultValue: 'Email' })}</option>
            <option value="whatsapp">{t('registration.step4.allowWhatsApp', { defaultValue: 'WhatsApp' })}</option>
          </select>
          {errors.contactPreferences ? <p className="mt-1 text-xs text-red-400">{t('registration.step4.contact_method_mismatch', { defaultValue: 'Preferred contact method must be enabled' })}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            {t('registration.step4.media', { defaultValue: 'Media' })}
          </label>
          <Controller
            control={control}
            name="media.profilePhoto"
            render={({ field }) => (
              <AvatarUpload
                value={field.value}
                onChange={field.onChange}
                aria-label={t('registration.step4.upload_photo', { defaultValue: 'Upload photo' })}
              />
            )}
          />
          {errors.media ? <p className="mt-1 text-xs text-red-400">{t('errors.required', { defaultValue: 'Required' })}</p> : null}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-300">
            {t('registration.step4.links', { defaultValue: 'Links' })}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input {...form.register('links.portfolio')} placeholder={t('registration.step4.portfolio', { defaultValue: 'Portfolio' })} className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3" />
          <input {...form.register('links.website')} placeholder={t('registration.step4.website', { defaultValue: 'Website' })} className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3" />
          <input {...form.register('links.linkedin')} placeholder={t('registration.step4.linkedin', { defaultValue: 'LinkedIn' })} className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3" />
          <input {...form.register('links.github')} placeholder={t('registration.step4.github', { defaultValue: 'GitHub' })} className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3" />
          <input {...form.register('links.behance')} placeholder={t('registration.step4.behance', { defaultValue: 'Behance' })} className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 md:col-span-2" />
        </div>
      </section>

      <section>
        <label className="mb-2 block text-sm font-semibold text-slate-300">
          {t('registration.step4.salary_expectation', { defaultValue: 'Salary expectation' })}
        </label>
        <input {...form.register('salaryExpectation')} inputMode="numeric" placeholder={t('registration.step4.salary_expectation_placeholder', { defaultValue: 'Enter expected salary' })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3" />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-300">
            {t('registration.step4.education', { defaultValue: 'Education' })}
          </p>
          <button type="button" onClick={() => education.append(buildEmptyEducation())} className="rounded-xl border border-slate-700 px-3 py-2 text-xs">
            {t('common.add', { defaultValue: 'Add' })}
          </button>
        </div>
        <div className="space-y-3">
          {education.fields.map((item, index) => (
            <div key={item.id} className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
              <input {...form.register(`education.${index}.school`)} placeholder={t('registration.step4.school', { defaultValue: 'School' })} className="mb-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3" />
              <input {...form.register(`education.${index}.degree`)} placeholder={t('registration.step4.degree', { defaultValue: 'Degree' })} className="mb-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3" />
              <input {...form.register(`education.${index}.fieldOfStudy`)} placeholder={t('registration.step4.field_of_study', { defaultValue: 'Field of study' })} className="mb-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3" />
              <div className="grid grid-cols-2 gap-2">
                <input {...form.register(`education.${index}.startDate`)} type="date" disabled={!!useWatch({ control, name: `education.${index}.stillStudying` })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 disabled:opacity-50" />
                <input {...form.register(`education.${index}.endDate`)} type="date" disabled={!!useWatch({ control, name: `education.${index}.stillStudying` })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 disabled:opacity-50" />
              </div>
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input type="checkbox" {...form.register(`education.${index}.stillStudying`)} />
                <span>{t('registration.step4.still_studying', { defaultValue: 'Still studying' })}</span>
              </label>
              <button type="button" onClick={() => handleRemoveEducation(index)} className="mt-3 text-xs text-red-300">
                {t('common.remove', { defaultValue: 'Remove' })}
              </button>
            </div>
          ))}
          {errors.education ? <p className="text-xs text-red-400">{t('errors.required', { defaultValue: 'Required' })}</p> : null}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-300">
            {t('registration.step4.certifications', { defaultValue: 'Certifications' })}
          </p>
          <button type="button" onClick={() => certifications.append({ name: '', issuer: '', year: '' })} className="rounded-xl border border-slate-700 px-3 py-2 text-xs">
            {t('common.add', { defaultValue: 'Add' })}
          </button>
        </div>
        <div className="space-y-3">
          {certifications.fields.map((item, index) => (
            <div key={item.id} className="grid gap-2 rounded-2xl border border-slate-700 bg-slate-900 p-4 md:grid-cols-3">
              <input {...form.register(`certifications.${index}.name`)} placeholder={t('registration.step4.cert_name', { defaultValue: 'Certification name' })} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3" />
              <input {...form.register(`certifications.${index}.issuer`)} placeholder={t('registration.step4.cert_issuer', { defaultValue: 'Issuer' })} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3" />
              <input {...form.register(`certifications.${index}.year`)} aria-invalid={!!errors.certificationsYear} placeholder={t('registration.step4.cert_year', { defaultValue: 'Year' })} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3" />
              <button type="button" onClick={() => handleRemoveCertification(index)} className="md:col-span-3 text-left text-xs text-red-300">
                {t('common.remove', { defaultValue: 'Remove' })}
              </button>
            </div>
          ))}
          {errors.certifications ? <p className="text-xs text-red-400">{t('errors.required', { defaultValue: 'Required' })}</p> : null}
          {errors.certificationsYear ? <p className="text-xs text-red-400">{t('registration.step4.invalid_year', { defaultValue: 'Invalid year' })}</p> : null}
        </div>
      </section>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold">
          {t('common.back', { defaultValue: 'Back' })}
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className={`flex-[2] rounded-2xl bg-amber-400 px-4 py-3 text-sm font-black text-black ${mutation.isPending ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          {mutation.isPending ? t('common.saving', { defaultValue: 'Saving...' }) : t('registration.complete', { defaultValue: 'Complete registration' })}
        </button>
      </div>
    </form>
  );
}

Step4_ProfessionalDetails.propTypes = {
  registrationId: PropTypes.string,
  draftId: PropTypes.string,
  professionId: PropTypes.string,
  apiClient: PropTypes.shape({
    get: PropTypes.func,
    patch: PropTypes.func,
  }).isRequired,
  onBack: PropTypes.func,
  onNext: PropTypes.func,
  onAutoSave: PropTypes.func,
  localeOverride: PropTypes.string,
  theme: PropTypes.object,
};

export default memo(Step4_ProfessionalDetails);
