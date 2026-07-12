// src/pages/PostJobScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createJob } from "../services/jobs";

const JOB_CATEGORY_IDS = ["construction", "services", "business", "jobs"];
const PAYMENT_TYPE_IDS  = ["fixed", "hourly", "negotiable"];
const EXPERIENCE_IDS    = ["beginner", "intermediate", "expert"];
const CONTACT_IDS       = ["phone", "whatsapp", "both"];

const MAX_IMAGES     = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES  = ["image/jpeg", "image/png", "image/webp"];
const ONE_YEAR_MS    = 365 * 24 * 60 * 60 * 1000;

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
  const imageUrlsRef = useRef([]);
  const locationRef  = useRef("");

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
    images: [],
    companyName: "",
    workerNeeded: 1,
    experienceLevel: "beginner",
    salaryVisible: true,
    contactMethod: "phone",
  });

  const [isLoading,       setIsLoading]       = useState(false);
  const [error,           setError]           = useState("");
  const [locationLoading, setLocationLoading] = useState(true);

  const stopLoadingWithError = useCallback((message) => {
    setIsLoading(false);
    setError(message);
  }, []);

  useEffect(() => {
    let mounted = true;

    const onPosition = (pos) => {
      if (!mounted) return;
      const coords = `${pos.coords.latitude}, ${pos.coords.longitude}`;
      locationRef.current = coords;
      setFormData((prev) => ({ ...prev, location: coords }));
      setLocationLoading(false);
    };

    const onPositionError = () => {
      if (!mounted) return;
      locationRef.current = "";
      setLocationLoading(false);
      setError((prev) => prev || t("postJob.err.gpsError"));
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(onPosition, onPositionError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
    } else {
      onPositionError();
    }

    return () => { mounted = false; };
  }, [t]);

  useEffect(() => {
    return () => {
      imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      imageUrlsRef.current = [];
    };
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "budget" || name === "workerNeeded"
            ? value === "" ? "" : Number(value)
            : value,
    }));
    setError("");
  }, []);

  const handleImageChange = useCallback(
    (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      if (formData.images.length + files.length > MAX_IMAGES) {
        stopLoadingWithError(t("postJob.err.maxPhotos", { max: MAX_IMAGES }));
        e.target.value = "";
        return;
      }

      const invalidType = files.find((f) => !ALLOWED_TYPES.includes(f.type));
      if (invalidType) {
        stopLoadingWithError(t("postJob.err.invalidPhotoType"));
        e.target.value = "";
        return;
      }

      const tooLarge = files.find((f) => f.size > MAX_IMAGE_SIZE);
      if (tooLarge) {
        stopLoadingWithError(t("postJob.err.photoTooBig", { name: tooLarge.name }));
        e.target.value = "";
        return;
      }

      const newImages = files.map((file) => {
        const preview = URL.createObjectURL(file);
        imageUrlsRef.current.push(preview);
        return { file, preview };
      });

      setFormData((prev) => ({ ...prev, images: [...prev.images, ...newImages] }));
      setError("");
      e.target.value = "";
    },
    [formData.images.length, stopLoadingWithError, t],
  );

  const removeImage = useCallback((index) => {
    setFormData((prev) => {
      const img = prev.images[index];
      if (img?.preview) {
        URL.revokeObjectURL(img.preview);
        imageUrlsRef.current = imageUrlsRef.current.filter((u) => u !== img.preview);
      }
      return { ...prev, images: prev.images.filter((_, i) => i !== index) };
    });
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (isLoading) return;
      setError("");

      if (locationLoading) {
        stopLoadingWithError(t("postJob.err.gpsWaiting"));
        return;
      }
      if (!formData.location.trim()) {
        stopLoadingWithError(t("postJob.err.locationRequired"));
        return;
      }
      if (!formData.companyName.trim() || !formData.title.trim() || !formData.description.trim()) {
        stopLoadingWithError(t("postJob.err.fillRequired"));
        return;
      }
      if (formData.title.trim().length > 100) {
        stopLoadingWithError(t("postJob.err.titleTooLong"));
        return;
      }
      if (formData.description.trim().length > 2000) {
        stopLoadingWithError(t("postJob.err.descTooLong"));
        return;
      }
      if (!/^[+]?[\d\s-]{7,20}$/.test(formData.phone.trim())) {
        stopLoadingWithError(t("postJob.err.invalidPhone"));
        return;
      }

      const deadlineDate = formData.deadline ? new Date(formData.deadline) : null;
      if (deadlineDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const maxDate = new Date();
        maxDate.setTime(maxDate.getTime() + ONE_YEAR_MS);
        maxDate.setHours(23, 59, 59, 999);
        if (deadlineDate < today) {
          stopLoadingWithError(t("postJob.err.deadlinePast"));
          return;
        }
        if (deadlineDate > maxDate) {
          stopLoadingWithError(t("postJob.err.deadlineTooFar"));
          return;
        }
      }

      const budgetNumber       = Number(formData.budget);
      const workerNeededNumber = Number(formData.workerNeeded);

      if (Number.isNaN(budgetNumber) || budgetNumber < 1) {
        stopLoadingWithError(t("postJob.err.budgetMin"));
        return;
      }
      if (budgetNumber > 100000000) {
        stopLoadingWithError(t("postJob.err.budgetMax"));
        return;
      }
      if (Number.isNaN(workerNeededNumber) || workerNeededNumber < 1) {
        stopLoadingWithError(t("postJob.err.workerMin"));
        return;
      }
      if (workerNeededNumber > 10000) {
        stopLoadingWithError(t("postJob.err.workerMax"));
        return;
      }

      setIsLoading(true);

      try {
        const cleanDescription = formData.description.replace(/<[^>]*>/g, "").trim();

        const fd = new FormData();
        fd.append("title",           formData.title.trim());
        fd.append("companyName",     formData.companyName.trim());
        fd.append("description",     cleanDescription);
        fd.append("category",        formData.category);
        fd.append("workerNeeded",    String(workerNeededNumber));
        fd.append("salaryVisible",   String(formData.salaryVisible));
        fd.append("contactMethod",   formData.contactMethod);
        fd.append("budget",          String(budgetNumber));
        fd.append("phone",           formData.phone.trim());
        fd.append("location",        formData.location.trim());
        if (formData.deadline) fd.append("deadline", formData.deadline);
        fd.append("paymentType",     formData.paymentType);
        fd.append("experienceLevel", formData.experienceLevel);
        fd.append("isUrgent",        String(formData.isUrgent));

        formData.images.forEach((img) => fd.append("images", img.file));

        const res = await createJob(fd);

        imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        imageUrlsRef.current = [];

        if (!res.success) {
          stopLoadingWithError(res.message || t("postJob.err.submitError"));
          return;
        }

        navigate("/dashboard", { replace: true });
      } catch {
        stopLoadingWithError(t("postJob.err.submitError"));
      } finally {
        setIsLoading(false);
      }
    },
    [formData, isLoading, navigate, stopLoadingWithError, locationLoading, t],
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#020617] pb-12 text-white">
      <form onSubmit={handleSubmit} className="mx-auto mt-4 flex w-full max-w-md flex-col gap-4 px-5">

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <h1 className="text-lg font-bold text-white">{t("postJob.title")}</h1>
          <p className="mt-1 text-xs text-slate-400">{t("postJob.subtitle")}</p>
        </div>

        {error && (
          <div role="alert" aria-live="polite"
            className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input required name="companyName" value={formData.companyName} maxLength={100}
            placeholder={t("postJob.companyName")} onChange={handleChange} className={INPUT_CLS} />
          <input required name="title" value={formData.title} maxLength={100}
            placeholder={t("postJob.jobTitle")} onChange={handleChange} className={INPUT_CLS} />
        </div>

        <select name="category" value={formData.category} onChange={handleChange} className={INPUT_CLS}>
          {JOB_CATEGORY_IDS.map((id) => (
            <option key={id} value={id}>{t(`postJob.cat.${id}`)}</option>
          ))}
        </select>

        <textarea required name="description" value={formData.description} maxLength={2000}
          placeholder={t("postJob.description")} onChange={handleChange}
          className={`min-h-32 ${INPUT_CLS}`} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input required name="phone" value={formData.phone}
            placeholder={t("postJob.phone")} onChange={handleChange} className={INPUT_CLS} />
          <input required name="budget" type="number" min="1"
            value={formData.budget} placeholder={t("postJob.budget")} onChange={handleChange} className={INPUT_CLS} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input name="deadline" type="date" value={formData.deadline}
            max={getMaxDeadline()} onChange={handleChange} className={INPUT_CLS} />
          <input required name="location" value={formData.location}
            placeholder={locationLoading ? t("postJob.locationLoading") : t("postJob.location")}
            onChange={handleChange} className={INPUT_CLS} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select name="paymentType" value={formData.paymentType} onChange={handleChange} className={INPUT_CLS}>
            {PAYMENT_TYPE_IDS.map((id) => (
              <option key={id} value={id}>{t(`postJob.pay.${id}`)}</option>
            ))}
          </select>
          <select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} className={INPUT_CLS}>
            {EXPERIENCE_IDS.map((id) => (
              <option key={id} value={id}>{t(`postJob.exp.${id}`)}</option>
            ))}
          </select>
          <select name="contactMethod" value={formData.contactMethod} onChange={handleChange} className={INPUT_CLS}>
            {CONTACT_IDS.map((id) => (
              <option key={id} value={id}>{t(`postJob.contact.${id}`)}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input required name="workerNeeded" type="number" min="1" max="10000"
            value={formData.workerNeeded} onChange={handleChange} className={INPUT_CLS} />
          <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm">
            <input type="checkbox" name="isUrgent" checked={formData.isUrgent}
              onChange={handleChange} className="h-4 w-4" />
            {t("postJob.isUrgent")}
          </label>
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm">
          <input type="checkbox" name="salaryVisible" checked={formData.salaryVisible}
            onChange={handleChange} className="h-4 w-4" />
          {t("postJob.salaryVisible")}
        </label>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">{t("postJob.photos")}</span>
            <span className="text-[10px] text-slate-500">
              {t("postJob.photosCount", { count: formData.images.length, max: MAX_IMAGES })}
            </span>
          </div>

          <input type="file" multiple accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="w-full text-xs text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:text-sm file:font-bold file:text-slate-950 hover:file:bg-amber-400" />

          {formData.images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {formData.images.map((img, index) => (
                <div key={`${img.preview}-${index}`}
                  className="relative aspect-square overflow-hidden rounded-xl border border-slate-800">
                  <img src={img.preview} className="h-full w-full object-cover"
                    alt={t("postJob.photoAlt", { n: index + 1 })} />
                  <button type="button" onClick={() => removeImage(index)}
                    aria-label={t("postJob.removePhoto", { n: index + 1 })}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={isLoading}
          className="w-full rounded-xl bg-amber-500 py-4 font-black uppercase text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
              {t("postJob.submitting")}
            </span>
          ) : t("postJob.submit")}
        </button>
      </form>
    </div>
  );
}
