// ======================================================
// 🌍 src/pages/CreatePost.jsx
// 🚀 JOBFAST GLOBAL — CREATE POST
// ======================================================

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import API from "../api/axios";

// ======================================================
// 📦 STATIC CONFIG
// ======================================================

const CATEGORY_OPTIONS = Object.freeze({
  construction: [
    "Mason",
    "Carpenter",
    "Electrician",
    "Plumber",
    "Welder",
    "Engineer",
    "Boss",
    "Assistant",
    "Painter",
    "Foreman",
    "Architect",
    "Steel Fixer",
    "Concrete Worker",
    "Tile Installer",
  ],

  business: [
    "Company",
    "Restaurant",
    "Hospital",
    "Clinic",
    "Hotel",
    "Office",
    "Lawyer",
    "Mechanic",
    "Tour Guide",
    "Organization",
  ],

  service: [
    "Chef Lakay",
    "Plumber",
    "Doctor",
    "Nurse",
    "Taxi",
    "Delivery",
    "Cleaning",
    "Videographer",
    "Designer",
    "Developer",
    "Photographer",
  ],
});

const TYPE_LABELS = Object.freeze({
  construction:
    "Select Construction Role",

  business:
    "Select Business Type",

  service:
    "Select Service",
});

const INITIAL_FORM = Object.freeze({
  title: "",
  description: "",
  type: "construction",
  category: "",
  city: "",
  country: "",
  phone: "",
});

// ======================================================
// 🧠 HELPERS
// ======================================================

const normalize = (value = "") =>
  value.trim();

const isValidPhone = (phone = "") =>
  /^[0-9+\-\s()]{6,20}$/.test(
    normalize(phone)
  );

const isValidForm = ({
  title,
  description,
  category,
  city,
  phone,
}) =>
  normalize(title).length >= 3 &&
  normalize(description).length >= 10 &&
  normalize(category) &&
  normalize(city) &&
  (!phone || isValidPhone(phone));

const createPayload = (form) => ({
  title:
    normalize(form.title),

  description:
    normalize(form.description),

  type:
    normalize(form.type),

  category:
    normalize(form.category),

  city:
    normalize(form.city),

  country:
    normalize(form.country),

  phone:
    normalize(form.phone),

  createdAt:
    new Date().toISOString(),
});

// ======================================================
// 🎨 REUSABLE INPUT
// ======================================================

const Input = memo(function Input({
  as = "input",
  style,
  ...props
}) {

  const Component = as;

  return (
    <Component
      {...props}
      style={{
        ...(as === "textarea"
          ? styles.textarea
          : styles.input),

        ...style,
      }}
    />
  );
});

// ======================================================
// 🎨 CATEGORY SELECT
// ======================================================

const CategorySelect = memo(
  function CategorySelect({
    type,
    value,
    onChange,
  }) {

    const options =
      CATEGORY_OPTIONS[type] || [];

    return (
      <select
        name="category"
        value={value}
        onChange={onChange}
        style={styles.input}
        aria-label="Category"
      >
        <option value="">
          {TYPE_LABELS[type]}
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    );
  }
);

// ======================================================
// 🚀 MAIN COMPONENT
// ======================================================

function CreatePost() {

  const [form, setForm] =
    useState(INITIAL_FORM);

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  // ======================================================
  // ⏱ AUTO CLEAR ALERTS
  // ======================================================

  useEffect(() => {

    if (
      !success &&
      !errorMessage
    ) {
      return;
    }

    const timer =
      setTimeout(() => {

        setSuccess("");

        setErrorMessage("");

      }, 4000);

    return () =>
      clearTimeout(timer);

  }, [success, errorMessage]);

  // ======================================================
  // 🔄 UPDATE FIELD
  // ======================================================

  const updateField =
    useCallback((name, value) => {

      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));

    }, []);

  // ======================================================
  // 🔄 HANDLE CHANGE
  // ======================================================

  const handleChange =
    useCallback(
      ({ target }) => {

        updateField(
          target.name,
          target.value
        );

      },
      [updateField]
    );

  // ======================================================
  // 🔄 HANDLE TYPE
  // ======================================================

  const handleTypeChange =
    useCallback(({ target }) => {

      setForm((prev) => ({
        ...prev,
        type: target.value,
        category: "",
      }));

    }, []);

  // ======================================================
  // 🧠 VALIDATION
  // ======================================================

  const isDisabled = useMemo(
    () =>
      loading ||
      !isValidForm(form),

    [form, loading]
  );

  // ======================================================
  // 📦 CREATE POST
  // ======================================================

  const handleCreate =
    useCallback(async () => {

      if (isDisabled) {
        return;
      }

      setLoading(true);

      setErrorMessage("");

      setSuccess("");

      try {

        const payload =
          createPayload(form);

        const response =
          await API.post(
            "/posts/create",
            payload
          );

        console.log(
          "✅ POST CREATED:",
          response?.data
        );

        setSuccess(
          "Post created successfully"
        );

        setForm({
          ...INITIAL_FORM,
          type: form.type,
        });

      } catch (error) {

        console.error(error);

        setErrorMessage(
          error?.response?.data?.message ||
          error?.message ||
          "Error creating post"
        );

      } finally {

        setLoading(false);
      }

    }, [form, isDisabled]);

  // ======================================================
  // ⌨️ ENTER SUBMIT
  // ======================================================

  const handleKeyDown =
    useCallback(
      (event) => {

        if (
          event.key === "Enter" &&
          !loading &&
          event.target.tagName !==
            "TEXTAREA"
        ) {
          handleCreate();
        }

      },
      [handleCreate, loading]
    );

  // ======================================================
  // 🎨 UI
  // ======================================================

  return (
    <main style={styles.container}>
      <section style={styles.card}>

        <header style={styles.header}>
          <h1 style={styles.title}>
            Create Post
          </h1>

          <p style={styles.subtitle}>
            Construction •
            Businesses •
            Services On Demand
          </p>
        </header>

        <select
          name="type"
          value={form.type}
          onChange={handleTypeChange}
          style={styles.input}
          aria-label="Post Type"
        >
          <option value="construction">
            👷 Construction
          </option>

          <option value="business">
            🏢 Business
          </option>

          <option value="service">
            🚀 Service
          </option>
        </select>

        <CategorySelect
          type={form.type}
          value={form.category}
          onChange={handleChange}
        />

        <Input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Post title"
          autoComplete="off"
          maxLength={120}
          aria-label="Post title"
        />

        <Input
          as="textarea"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe your post..."
          maxLength={1000}
          aria-label="Post description"
        />

        <Input
          type="text"
          name="city"
          value={form.city}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="City"
          maxLength={60}
          aria-label="City"
        />

        <Input
          type="text"
          name="country"
          value={form.country}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Country"
          maxLength={60}
          aria-label="Country"
        />

        <Input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Phone Number"
          maxLength={20}
          aria-label="Phone Number"
        />

        {errorMessage && (
          <div style={styles.error}>
            {errorMessage}
          </div>
        )}

        {success && (
          <div style={styles.success}>
            {success}
          </div>
        )}

        <button
          type="button"
          disabled={isDisabled}
          aria-busy={loading}
          onClick={handleCreate}
          style={{
            ...styles.button,

            opacity:
              isDisabled
                ? 0.7
                : 1,

            cursor:
              isDisabled
                ? "not-allowed"
                : "pointer",
          }}
        >
          {loading
            ? "Creating..."
            : "Create Post"}
        </button>

        <p style={styles.note}>
          GPS and nearby alerts
          activate after backend
          integration
        </p>

      </section>
    </main>
  );
}

// ======================================================
// 🎨 DESIGN SYSTEM
// ======================================================

const glass = {
  background:
    "rgba(255,255,255,0.05)",

  border:
    "1px solid rgba(255,255,255,0.08)",

  backdropFilter:
    "blur(14px)",

  WebkitBackdropFilter:
    "blur(14px)",
};

const FIELD_STYLES = {
  width: "100%",

  padding: "14px 16px",

  borderRadius: "14px",

  border:
    "1px solid rgba(255,255,255,0.08)",

  outline: "none",

  boxSizing: "border-box",

  background:
    "rgba(255,255,255,0.06)",

  color: "#fff",

  fontSize: "14px",
};

// ======================================================
// 🎨 STYLES
// ======================================================

const styles = {
  container: {
    minHeight: "100vh",

    padding: "24px",

    display: "flex",

    justifyContent: "center",

    alignItems: "center",

    background:
      "linear-gradient(to bottom, #020617, #0f172a)",

    fontFamily:
      "Inter, Arial, sans-serif",
  },

  card: {
    ...glass,

    width: "100%",

    maxWidth: "520px",

    padding: "24px",

    borderRadius: "24px",

    overflow: "hidden",

    boxShadow:
      "0 20px 60px rgba(0,0,0,0.45)",
  },

  header: {
    marginBottom: "20px",
  },

  title: {
    margin: 0,

    color: "#fff",

    fontSize: "30px",

    fontWeight: "800",
  },

  subtitle: {
    marginTop: "8px",

    color: "#94a3b8",

    fontSize: "13px",

    lineHeight: 1.6,
  },

  input: {
    ...FIELD_STYLES,

    marginBottom: "14px",
  },

  textarea: {
    ...FIELD_STYLES,

    minHeight: "120px",

    resize: "vertical",

    marginBottom: "16px",

    lineHeight: 1.6,
  },

  button: {
    width: "100%",

    padding: "14px",

    border: "none",

    borderRadius: "14px",

    background:
      "linear-gradient(to right, #2563eb, #3b82f6)",

    color: "#fff",

    fontSize: "14px",

    fontWeight: "700",

    transition:
      "all 0.2s ease",

    transform:
      "translateZ(0)",
  },

  error: {
    marginBottom: "14px",

    padding: "12px",

    borderRadius: "12px",

    background:
      "rgba(239,68,68,0.15)",

    color: "#fca5a5",

    fontSize: "13px",
  },

  success: {
    marginBottom: "14px",

    padding: "12px",

    borderRadius: "12px",

    background:
      "rgba(34,197,94,0.15)",

    color: "#86efac",

    fontSize: "13px",
  },

  note: {
    marginTop: "16px",

    textAlign: "center",

    color: "#94a3b8",

    fontSize: "11px",

    lineHeight: 1.5,
  },
};

export default memo(CreatePost);