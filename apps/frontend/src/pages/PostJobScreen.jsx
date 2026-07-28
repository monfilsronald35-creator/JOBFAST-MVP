// src/pages/PostJobScreen.jsx
import React, {
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createJob } from "../services/jobs";
import { useOfflineQueue } from "../hooks/useOfflineQueue";
import { useRetryEngine } from "../hooks/useRetryEngine";
import { useUploadQueue } from "../hooks/useUploadQueue";   // concurrency + progress + cancel/resume [web:85]
import { useJobDraft } from "../hooks/useJobDraft";         // autosave + versioning + unsaved warning [web:70][web:74]
import { useGeoLocation } from "../hooks/useGeoLocation";   // GPS + reverse geocoding + cache
import { useJobAI } from "../hooks/useJobAI";               // debounced AI (category/salary/skills/moderation) [web:79][web:86]

const JOB_CATEGORY_IDS = ["construction", "services", "business", "jobs"];
const PAYMENT_TYPE_IDS  = ["fixed", "hourly", "negotiable"];
const EXPERIENCE_IDS    = ["beginner", "intermediate", "expert"];
const CONTACT_IDS       = ["phone", "whatsapp", "both"];

const MAX_IMAGES     = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES  = ["image/jpeg", "image/png", "image/webp"];
const ONE_YEAR_MS    = 365 * 24 * 60 * 60 * 1000;
const DRAFT_KEY      = "jobfast_post_job_draft_v2";

const getMaxDeadline = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

const INPUT_CLS =
  "w-full rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm outline-none placeholder:text-slate-500 focus:border-amber-400";

export default function PostJobScreen() {
  const navigate = useNavigate();
  const { t }    = useTranslation();

  /* =============== BASE STATE =============== */

  const [formData, setFormData] = useState({
    title: "",
    category: "construction",
    description: "",
    location: "",
    budget: "",
    phone: "",
    deadline: "",
    paymentType: "fixed",
    isUrgent: false,
    images: [],          // { file, previewId }
    companyName: "",
    workerNeeded: 1,
    experienceLevel: "beginner",
    salaryVisible: true,
    contactMethod: "phone",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState("");
  const [previewOpen,  setPreviewOpen]  = useState(false);

  /* =============== DRAFT + UNSAVED CHANGES =============== */

  const {
    loadDraft,
    saveDraftDebounced,
    clearDraft,
    markDirty,
    hasUnsavedChanges,
  } = useJobDraft(DRAFT_KEY); // internally use IndexedDB/localStorage + debounce [web:70][web:78]

  // Restore draft
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setFormData((prev) => ({
        ...prev,
        ...draft,
        images: [], // pa restore File objects
      }));
    }
  }, [loadDraft]);

  // Mark page as dirty on unload
  useEffect(() => {
    const handler = (e) => {
      if (!hasUnsavedChanges()) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  /* =============== GEOLOCATION (GPS + MANUAL) =============== */

  const {
    locationLabel,
    setManualLocation,
    gpsLoading,
    gpsError,
  } = useGeoLocation(); // pa bloke, toujou pèmèt manual [web:70]

  useEffect(() => {
    if (locationLabel) {
      setFormData((prev) => {
        const next = { ...prev, location: locationLabel };
        saveDraftDebounced(next);
        return next;
      });
    }
  }, [locationLabel, saveDraftDebounced]);

  /* =============== AI HELPERS (DEBOUNCED) =============== */

  const {
    salarySuggestion,
    skills,
    moderationFlags,
    requestCategory,
    requestSalaryHint,
    requestSkills,
    requestModeration,
  } = useJobAI({
    category: formData.category,
    experienceLevel: formData.experienceLevel,
    location: formData.location,
  }); // debaounced 700ms anndan hook la [web:79][web:86]

  /* =============== OFFLINE QUEUE + RETRY ENGINE + UPLOAD QUEUE =============== */

  const { enqueueJob, pendingJobs } = useOfflineQueue();
  const { runWithRetry }           = useRetryEngine();

  const {
    addFiles,
    clearFiles,
    uploadAllWithConcurrency,
    uploadsProgress,   // map fileId → %
    cancelAll,
  } = useUploadQueue({
    maxConcurrency: 3,
    maxSizeBytes: MAX_IMAGE_SIZE,
    allowedTypes: ALLOWED_TYPES,
  }); // concurrency limit, resumable, cancel/resume, background [web:85]

  /* =============== HELPERS =============== */

  const stopWithError = useCallback((message) => {
    setIsSubmitting(false);
    setError(message);
  }, []);

  const updateForm = useCallback(
    (updater) => {
      setFormData((prev) => {
        const next =
          typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
        saveDraftDebounced(next);
        markDirty();
        return next;
      });
      setError("");
    },
    [saveDraftDebounced, markDirty],
  );

  /* =============== HANDLE CHANGE (DEBOUNCED AI INSIDE HOOK) =============== */

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;

      updateForm((prev) => {
        const next = {
          ...prev,
          [name]:
            type === "checkbox"
              ? checked
              : name === "budget" || name === "workerNeeded"
                ? value === "" ? "" : Number(value)
                : value,
        };

        // AI Auto Category & Skills & Salary – via debounced hook
        if (name === "title" || name === "description") {
          const text =
            name === "title" ? value : next.description;
          if (text.trim().length > 10) {
            requestCategory(text);   // hooked debounce, pa spam API [web:79][web:86]
            requestSkills(text);
          }
        }
        if (name === "budget") {
          const num = Number(value);
          if (!Number.isNaN(num) && num > 0) {
            requestSalaryHint({
              budget: num,
              category: next.category,
              experienceLevel: next.experienceLevel,
              location: next.location,
            });
          }
        }
        if (name === "location") {
          setManualLocation(value);
        }
        
        return next;
      });
    },
    [updateForm, requestCategory, requestSkills, requestSalaryHint, setManualLocation],
  );

  /* =============== IMAGE CHANGE (QUEUE + COMPRESSION) =============== */

  const handleImageChange = useCallback(
    (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      if (formData.images.length + files.length > MAX_IMAGES) {
        stopWithError(t("postJob.err.maxPhotos", { max: MAX_IMAGES }));
        e.target.value = "";
        return;
      }

      // Add to upload queue (hook internal konprese → WebP/AVIF, lazy preview, virus scan, etc.)
      const { accepted, rejected, previews } = addFiles(files); // hook retounen info si gen erè
      if (rejected.length) {
        stopWithError(t("postJob.err.invalidOrBigPhotos"));
      }

      updateForm((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          ...previews.map((p) => ({ fileId: p.id, previewUrl: p.url })),
        ],
      }));

      e.target.value = "";
    },
    [formData.images.length, addFiles, stopWithError, t, updateForm],
  );

  const removeImage = useCallback(
    (index) => {
      updateForm((prev) => {
        const target = prev.images[index];
        if (!target) return prev;
        // Hook la ka revoke preview anndan `clearFiles(target.fileId)`
        clearFiles([target.fileId]);
        return {
          ...prev,
          images: prev.images.filter((_, i) => i !== index),
        };
      });
    },
    [updateForm, clearFiles],
  );

  /* =============== VALIDATION (FRONTEND + REMINDER BACKEND) =============== */

  const validateForm = useCallback(() => {
    if (gpsError && !formData.location.trim()) {
      return t("postJob.err.locationRequired");
    }
    if (
      !formData.companyName.trim() ||
      !formData.title.trim() ||
      !formData.description.trim()
    ) {
      return t("postJob.err.fillRequired");
    }
    if (formData.title.trim().length > 100) {
      return t("postJob.err.titleTooLong");
    }
    if (formData.description.trim().length > 2000) {
      return t("postJob.err.descTooLong");
    }
    if (!/^[+]?[\d\s-]{7,20}$/.test(formData.phone.trim())) {
      return t("postJob.err.invalidPhone");
    }

    const deadlineDate = formData.deadline ? new Date(formData.deadline) : null;
    if (deadlineDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxDate = new Date();
      maxDate.setTime(maxDate.getTime() + ONE_YEAR_MS);
      maxDate.setHours(23, 59, 59, 999);
      if (deadlineDate < today) {
        return t("postJob.err.deadlinePast");
      }
      if (deadlineDate > maxDate) {
        return t("postJob.err.deadlineTooFar");
      }
    }

    const budgetNumber       = Number(formData.budget);
    const workerNeededNumber = Number(formData.workerNeeded);

    if (Number.isNaN(budgetNumber) || budgetNumber < 1) {
      return t("postJob.err.budgetMin");
    }
    if (budgetNumber > 100000000) {
      return t("postJob.err.budgetMax");
    }
    if (Number.isNaN(workerNeededNumber) || workerNeededNumber < 1) {
      return t("postJob.err.workerMin");
    }
    if (workerNeededNumber > 10000) {
      return t("postJob.err.workerMax");
    }

    return null;
  }, [formData, gpsError, t]);

  /* =============== SUBMIT (AI moderation + offline + concurrency upload) =============== */

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (isSubmitting) return;
      setError("");

      // AI moderation (debounced anndan hook; isit la nou jis asire li byen) + backend ap revalide tou
      await requestModeration({
        title: formData.title,
        description: formData.description,
        budget: formData.budget,
        phone: formData.phone,
        location: formData.location,
      });
      if (moderationFlags.length) {
        stopWithError(t("postJob.err.moderationBlocked"));
        return;
      }
      
      const validationError = validateForm();
      if (validationError) {
        stopWithError(validationError);
        return;
      }

      setIsSubmitting(true);

      try {
        const cleanDescription = formData.description
          .replace(/<[^>]*>/g, "")
          .trim();

        const idempotencyKey = `job-${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}`;

        // Upload an paralèl ak concurrency limit, pa sequential [web:81][web:85]
        const fileIds = formData.images.map((i) => i.fileId);
        const uploadedFiles = await uploadAllWithConcurrency(fileIds, {
          metadata: { kind: "job-image", idempotencyKey },
        });

        const payload = {
          title:           formData.title.trim(),
          companyName:     formData.companyName.trim(),
          description:     cleanDescription,
          category:        formData.category,
          workerNeeded:    Number(formData.workerNeeded),
          salaryVisible:   formData.salaryVisible,
          contactMethod:   formData.contactMethod,
          budget:          Number(formData.budget),
          phone:           formData.phone.trim(),
          location:        formData.location.trim(),
          deadline:        formData.deadline || null,
          paymentType:     formData.paymentType,
          experienceLevel: formData.experienceLevel,
          isUrgent:        formData.isUrgent,
          images:          uploadedFiles, // CDN URLs + etag + resumable IDs
          idempotencyKey,
          skills:          skills,
          fraudScore: {
            trustScore:       0,
            companyScore:     0,
            phoneVerified:    false,
            emailVerified:    false,
            locationVerified: !!formData.location,
            documentVerified: false,
          },
        };

        // Offline posting – backend toujou revalide, men nou mete job nan queue si offline
        if (!navigator.onLine) {
          await enqueueJob(payload);
          clearDraft();
          setIsSubmitting(false);
          navigate("/dashboard?status=pending", { replace: true });
          return;
        }

        // Retry engine + backend validation (server se source-of-truth) [web:85]
        const res = await runWithRetry(() => createJob(payload));

        clearFiles(fileIds);
        clearDraft();

        if (!res.success) {
          stopWithError(res.message || t("postJob.err.submitError"));
          return;
        }

        navigate(`/jobs/${res.jobId}?approved=pending`, { replace: true });
      } catch {
        stopWithError(t("postJob.err.submitError"));
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formData,
      isSubmitting,
      validateForm,
      requestModeration,
      moderationFlags.length,
      t,
      enqueueJob,
      runWithRetry,
      uploadAllWithConcurrency,
      clearFiles,
      clearDraft,
      navigate,
      stopWithError,
      skills,
    ],
  );

  /* =============== FORMATTED BUDGET =============== */

  const formattedBudget =
    formData.budget && !Number.isNaN(Number(formData.budget))
      ? new Intl.NumberFormat("es-DO", {
          style: "currency",
          currency: "DOP",
          maximumFractionDigits: 0,
        }).format(Number(formData.budget))
      : "";

  /* =============== PREVIEW =============== */

  const openPreview  = () => setPreviewOpen(true);
  const closePreview = () => setPreviewOpen(false);

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-b from-[#020617] via-[#05081e] to-black pb-12 text-white">
      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-6 flex w-full max-w-2xl flex-col gap-5 px-5"
      >
        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-5 shadow-xl">
          <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen">
            <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-amber-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
          </div>
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">
                {t("postJob.title")}
              </h1>
              <p className="mt-1 max-w-xs text-[11px] text-slate-400">
                {t("postJob.subtitle")}
              </p>
              {pendingJobs.length > 0 && (
                <p className="mt-2 text-[10px] font-semibold text-amber-400">
                  {t("postJob.pendingCount", { count: pendingJobs.length })}
                </p>
              )}
              {hasUnsavedChanges() && (
                <p className="mt-1 text-[10px] text-slate-500">
                  {t("postJob.unsaved")}
                </p>
              )}
            </div>
            <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-fuchsia-500 to-sky-500 text-3xl shadow-lg">
              📡
            </div>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs text-red-400"
          >
            {error}
          </div>
        )}

        {/* BASIC INFO */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            required
            name="companyName"
            value={formData.companyName}
            maxLength={100}
            placeholder={t("postJob.companyName")}
            onChange={handleChange}
            className={INPUT_CLS}
          />
          <input
            required
            name="title"
            value={formData.title}
            maxLength={100}
            placeholder={t("postJob.jobTitle")}
            onChange={handleChange}
            className={INPUT_CLS}
          />
        </div>

        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className={INPUT_CLS}
        >
          {JOB_CATEGORY_IDS.map((id) => (
            <option key={id} value={id}>
              {t(`postJob.cat.${id}`)}
            </option>
          ))}
        </select>

        <textarea
          required
          name="description"
          value={formData.description}
          maxLength={2000}
          placeholder={t("postJob.description")}
          onChange={handleChange}
          className={`min-h-32 ${INPUT_CLS}`}
        />

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-emerald-300"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* CONTACT + BUDGET */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            required
            name="phone"
            value={formData.phone}
            placeholder={t("postJob.phone")}
            onChange={handleChange}
            className={INPUT_CLS}
          />
          <div className="relative">
            <input
              required
              name="budget"
              type="number"
              min="1"
              value={formData.budget}
              placeholder={t("postJob.budget")}
              onChange={handleChange}
              className={INPUT_CLS}
            />
            {formattedBudget && (
              <p className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-amber-300">
                {formattedBudget}
              </p>
            )}
          </div>
        </div>

        {salarySuggestion && (
          <p className="text-[10px] text-slate-400">
            {t("postJob.salaryHint", {
              min: salarySuggestion.min,
              max: salarySuggestion.max,
              currency: salarySuggestion.currency || "RD$",
            })}
          </p>
        )}

        {/* DEADLINE + LOCATION */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            name="deadline"
            type="date"
            value={formData.deadline}
            max={getMaxDeadline()}
            onChange={handleChange}
            className={INPUT_CLS}
          />
          <input
            required
            name="location"
            value={formData.location}
            placeholder={
              gpsLoading
                ? t("postJob.locationLoading")
                : t("postJob.location")
            }
            onChange={handleChange}
            className={INPUT_CLS}
          />
        </div>

        {/* SELECTS */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select
            name="paymentType"
            value={formData.paymentType}
            onChange={handleChange}
            className={INPUT_CLS}
          >
            {PAYMENT_TYPE_IDS.map((id) => (
              <option key={id} value={id}>
                {t(`postJob.pay.${id}`)}
              </option>
            ))}
          </select>
          <select
            name="experienceLevel"
            value={formData.experienceLevel}
            onChange={handleChange}
            className={INPUT_CLS}
          >
            {EXPERIENCE_IDS.map((id) => (
              <option key={id} value={id}>
                {t(`postJob.exp.${id}`)}
              </option>
            ))}
          </select>
          <select
            name="contactMethod"
            value={formData.contactMethod}
            onChange={handleChange}
            className={INPUT_CLS}
          >
            {CONTACT_IDS.map((id) => (
              <option key={id} value={id}>
                {t(`postJob.contact.${id}`)}
              </option>
            ))}
          </select>
        </div>

        {/* WORKERS + URGENT + SALARY VISIBLE */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            required
            name="workerNeeded"
            type="number"
            min="1"
            max="10000"
            value={formData.workerNeeded}
            onChange={handleChange}
            className={INPUT_CLS}
          />
          <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm">
            <input
              type="checkbox"
              name="isUrgent"
              checked={formData.isUrgent}
              onChange={handleChange}
              className="h-4 w-4"
            />
            {t("postJob.isUrgent")}
          </label>
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm">
          <input
            type="checkbox"
            name="salaryVisible"
            checked={formData.salaryVisible}
            onChange={handleChange}
            className="h-4 w-4"
          />
          {t("postJob.salaryVisible")}
        </label>

        {/* PHOTOS + PROGRESS + CANCEL */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              {t("postJob.photos")}
            </span>
            <span className="text-[10px] text-slate-500">
              {t("postJob.photosCount", {
                count: formData.images.length,
                max: MAX_IMAGES,
              })}
            </span>
          </div>

          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="w-full text-xs text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:text-sm file:font-bold file:text-slate-950 hover:file:bg-amber-400"
          />

          {formData.images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {formData.images.map((img, index) => (
                <div
                  key={img.fileId}
                  className="relative aspect-square overflow-hidden rounded-xl border border-slate-800"
                >
                  <img
                    src={img.previewUrl}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    alt={t("postJob.photoAlt", { n: index + 1 })}
                  />
                  <div className="absolute bottom-1 left-1 right-1 h-1.5 rounded-full bg-black/40 overflow-hidden">
                    <div
                      className="h-1.5 bg-emerald-400 transition-all"
                      style={{
                        width: `${uploadsProgress[img.fileId] || 0}%`,
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    aria-label={t("postJob.removePhoto", { n: index + 1 })}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {formData.images.length > 0 && (
            <button
              type="button"
              onClick={cancelAll}
              className="mt-3 text-[10px] font-bold text-red-400"
            >
              {t("postJob.cancelUploads")}
            </button>
          )}
        </div>

        {/* PREVIEW + SUBMIT */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openPreview}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900/40 py-3 text-[11px] font-bold uppercase text-slate-200 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            {t("postJob.preview")}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-amber-500 py-3 text-[11px] font-black uppercase text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                {t("postJob.submitting")}
              </span>
            ) : (
              t("postJob.submit")
            )}
          </button>
        </div>
      </form>

      {/* Preview Modal */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={t("postJob.preview")}
          onClick={closePreview}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-white">
                {t("postJob.previewTitle")}
              </h2>
              <button
                type="button"
                onClick={closePreview}
                className="h-7 w-7 rounded-full bg-slate-800 text-center text-xs text-slate-200"
                aria-label={t("common.close")}
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-[11px] text-slate-300">
              <p className="font-bold text-[13px] text-white">
                {formData.title || t("postJob.previewNoTitle")}
              </p>
              <p className="text-slate-400">
                {formData.companyName || t("postJob.previewNoCompany")}
              </p>
              <p className="text-slate-400">
                {formData.location || t("postJob.previewNoLocation")}
              </p>
              <p className="mt-2 whitespace-pre-line">
                {formData.description || t("postJob.previewNoDescription")}
              </p>
              {formattedBudget && (
                <p className="mt-2 text-amber-300">
                  {t("postJob.previewBudget")}: {formattedBudget}
                </p>
              )}
              {skills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
