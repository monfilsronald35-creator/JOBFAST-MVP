// src/pages/PostJobScreen.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const JOB_CATEGORIES = [
  { id: "construction", label: "Konstriksyon" },
  { id: "services", label: "Sèvis sou Demand" },
  { id: "business", label: "Anyè Biznis" },
  { id: "jobs", label: "Travay Jeneral" },
];

const PAYMENT_TYPES = [
  { id: "fixed", label: "Pri fikse" },
  { id: "hourly", label: "Pa èdtan" },
  { id: "negotiable", label: "Negosyab" },
];

const EXPERIENCE_LEVELS = [
  { id: "beginner", label: "Débutan" },
  { id: "intermediate", label: "Mwayen" },
  { id: "expert", label: "Ekspè" },
];

const CONTACT_METHODS = [
  { id: "phone", label: "Telefòn" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "both", label: "Tou de" },
];

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const getMaxDeadline = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

export default function PostJobScreen() {
  const navigate = useNavigate();
  const imageUrlsRef = useRef([]);
  const locationRef = useRef("");

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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationLoading, setLocationLoading] = useState(true);

  const stopLoadingWithError = useCallback((message) => {
    setIsLoading(false);
    setError(message);
  }, []);

  useEffect(() => {
    let mounted = true;

    const setCurrentPosition = (pos) => {
      if (!mounted) return;
      const coords = `${pos.coords.latitude}, ${pos.coords.longitude}`;
      locationRef.current = coords;
      setFormData((prev) => ({ ...prev, location: coords }));
      setLocationLoading(false);
    };

    const setPositionError = () => {
      if (!mounted) return;
      locationRef.current = "";
      setLocationLoading(false);
      setError((prev) => prev || "Pa ka jwenn pozisyon GPS.");
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(setCurrentPosition, setPositionError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
    } else {
      setPositionError();
    }

    return () => {
      mounted = false;
    };
  }, []);

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
            ? value === ""
              ? ""
              : Number(value)
            : value,
    }));

    setError("");
  }, []);

  const handleImageChange = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (formData.images.length + files.length > MAX_IMAGES) {
      stopLoadingWithError(`Maksimòm ${MAX_IMAGES} foto.`);
      e.target.value = "";
      return;
    }

    const invalidType = files.find((file) => !ALLOWED_TYPES.includes(file.type));
    if (invalidType) {
      stopLoadingWithError("Sèlman JPG, PNG ak WEBP ki aksepte.");
      e.target.value = "";
      return;
    }

    const tooLarge = files.find((file) => file.size > MAX_IMAGE_SIZE);
    if (tooLarge) {
      stopLoadingWithError(`${tooLarge.name} depase 5MB.`);
      e.target.value = "";
      return;
    }

    const newImages = files.map((file) => {
      const preview = URL.createObjectURL(file);
      imageUrlsRef.current.push(preview);
      return { file, preview };
    });

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages],
    }));

    setError("");
    e.target.value = "";
  }, [formData.images.length, stopLoadingWithError]);

  const removeImage = useCallback((index) => {
    setFormData((prev) => {
      const img = prev.images[index];
      if (img?.preview) {
        URL.revokeObjectURL(img.preview);
        imageUrlsRef.current = imageUrlsRef.current.filter((url) => url !== img.preview);
      }

      return {
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      };
    });
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (isLoading) return;
    setError("");

    if (locationLoading) {
      stopLoadingWithError("Tanpri tann GPS la fini lokalize w.");
      return;
    }

    if (!formData.location.trim()) {
      stopLoadingWithError("Lokalizasyon obligatwa.");
      return;
    }

    if (!formData.companyName.trim() || !formData.title.trim() || !formData.description.trim()) {
      stopLoadingWithError("Tanpri ranpli tout chan obligatwa yo.");
      return;
    }

    if (formData.title.trim().length > 100) {
      stopLoadingWithError("Tit travay la twò long.");
      return;
    }

    if (formData.description.trim().length > 2000) {
      stopLoadingWithError("Deskripsyon an twò long.");
      return;
    }

    const phoneRegex = /^[+]?[\d\s-]{7,20}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      stopLoadingWithError("Nimewo telefòn lan pa valab.");
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
        stopLoadingWithError("Dat limit la pa ka nan tan pase.");
        return;
      }

      if (deadlineDate > maxDate) {
        stopLoadingWithError("Dat limit la pa ka depase 1 an nan lavni.");
        return;
      }
    }

    const budgetNumber = Number(formData.budget);
    if (Number.isNaN(budgetNumber) || budgetNumber < 1) {
      stopLoadingWithError("Bidjè a dwe pi gran pase 0.");
      return;
    }

    if (budgetNumber > 100000000) {
      stopLoadingWithError("Bidjè a twò gwo.");
      return;
    }

    const workerNeededNumber = Number(formData.workerNeeded);
    if (Number.isNaN(workerNeededNumber) || workerNeededNumber < 1) {
      stopLoadingWithError("Fòk gen omwen 1 travayè.");
      return;
    }

    if (workerNeededNumber > 10000) {
      stopLoadingWithError("Kantite travayè a twò gwo.");
      return;
    }

    setIsLoading(true);

    try {
      const cleanDescription = formData.description.replace(/<[^>]*>/g, "").trim();

      const fd = new FormData();
      fd.append("title", formData.title.trim());
      fd.append("companyName", formData.companyName.trim());
      fd.append("description", cleanDescription);
      fd.append("category", formData.category);
      fd.append("workerNeeded", String(workerNeededNumber));
      fd.append("salaryVisible", String(formData.salaryVisible));
      fd.append("contactMethod", formData.contactMethod);
      fd.append("budget", String(budgetNumber));
      fd.append("phone", formData.phone.trim());
      fd.append("location", formData.location.trim());
      fd.append("deadline", formData.deadline);
      fd.append("paymentType", formData.paymentType);
      fd.append("experienceLevel", formData.experienceLevel);
      fd.append("isUrgent", String(formData.isUrgent));

      formData.images.forEach((img) => fd.append("images", img.file));

      await new Promise((resolve) => setTimeout(resolve, 1500));

      imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      imageUrlsRef.current = [];

      navigate("/dashboard", { replace: true });
    } catch (err) {
      stopLoadingWithError("Yon erè rive, tanpri reyezi.");
    } finally {
      setIsLoading(false);
    }
  }, [formData, isLoading, navigate, stopLoadingWithError, locationLoading]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#020617] pb-12 text-white">
      <form onSubmit={handleSubmit} className="mx-auto mt-4 flex w-full max-w-md flex-col gap-4 px-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <h1 className="text-lg font-bold text-white">Pibliye Pwojè a</h1>
          <p className="mt-1 text-xs text-slate-400">
            Ranpli enfòmasyon yo pou jwenn moun oswa konpayi ki ka ede w.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            required
            name="companyName"
            value={formData.companyName}
            maxLength={100}
            placeholder="Non Konpayi"
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm outline-none placeholder:text-slate-500 focus:border-amber-400"
          />
          <input
            required
            name="title"
            value={formData.title}
            maxLength={100}
            placeholder="Tit Travay"
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm outline-none placeholder:text-slate-500 focus:border-amber-400"
          />
        </div>

        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm outline-none focus:border-amber-400"
        >
          {JOB_CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>

        <textarea
          required
          name="description"
          value={formData.description}
          maxLength={2000}
          placeholder="Deskripsyon..."
          onChange={handleChange}
          className="min-h-32 w-full rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm outline-none placeholder:text-slate-500 focus:border-amber-400"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            required
            name="phone"
            value={formData.phone}
            placeholder="Telefòn"
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm outline-none placeholder:text-slate-500 focus:border-amber-400"
          />
          <input
            required
            name="budget"
            type="number"
            min="1"
            value={formData.budget}
            placeholder="Bidjè"
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm outline-none placeholder:text-slate-500 focus:border-amber-400"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            name="deadline"
            type="date"
            value={formData.deadline}
            max={getMaxDeadline()}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm outline-none focus:border-amber-400"
          />
          <input
            required
            name="location"
            value={formData.location}
            placeholder={locationLoading ? "Ap chèche GPS..." : "Kote travay la"}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm outline-none placeholder:text-slate-500 focus:border-amber-400"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select
            name="paymentType"
            value={formData.paymentType}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm outline-none focus:border-amber-400"
          >
            {PAYMENT_TYPES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            name="experienceLevel"
            value={formData.experienceLevel}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm outline-none focus:border-amber-400"
          >
            {EXPERIENCE_LEVELS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            name="contactMethod"
            value={formData.contactMethod}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm outline-none focus:border-amber-400"
          >
            {CONTACT_METHODS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            required
            name="workerNeeded"
            type="number"
            min="1"
            max="10000"
            value={formData.workerNeeded}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm outline-none focus:border-amber-400"
          />

          <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm">
            <input
              type="checkbox"
              name="isUrgent"
              checked={formData.isUrgent}
              onChange={handleChange}
              className="h-4 w-4"
            />
            Travay ijan
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
          Montre salè a
        </label>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Foto yo</span>
            <span className="text-[10px] text-slate-500">
              {formData.images.length}/{MAX_IMAGES} foto ajoute
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
                  key={`${img.preview}-${index}`}
                  className="relative aspect-square overflow-hidden rounded-xl border border-slate-800"
                >
                  <img
                    src={img.preview}
                    className="h-full w-full object-cover"
                    alt={`preview-${index}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white"
                    aria-label={`Retire foto ${index + 1}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-amber-500 py-4 font-black uppercase text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
              Ap voye...
            </span>
          ) : (
            "Pibliye Pwojè a"
          )}
        </button>
      </form>
    </div>
  );
}
