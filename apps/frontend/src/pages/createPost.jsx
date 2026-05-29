import React, {
  memo,
  useCallback,
  useState,
} from "react";

// ======================================================
// 🌍 JOBFAST — CREATE POST
// ======================================================

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
  ],
});

const TYPE_LABELS = Object.freeze({
  construction:
    "Select Construction Role",

  business:
    "Select Business Type",

  service: "Select Service",
});

const INITIAL_FORM = Object.freeze({
  title: "",
  description: "",
  type: "construction",
  category: "",
});

// ======================================================
// 🧠 HELPERS
// ======================================================

const normalize = (value = "") =>
  value.trim();

const isValidForm = ({
  title,
  description,
  category,
}) =>
  normalize(title) &&
  normalize(description) &&
  normalize(category);

const createPayload = (form) => ({
  title: normalize(form.title),

  description: normalize(
    form.description
  ),

  type: form.type,

  category: form.category,

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
      CATEGORY_OPTIONS[type];

    return (
      <select
        name="category"
        value={value}
        onChange={onChange}
        style={styles.input}
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
  // 🔎 HANDLE CHANGE
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

  const isDisabled =
    loading || !isValidForm(form);

  // ======================================================
  // 📦 CREATE POST
  // ======================================================

  const handleCreate =
    useCallback(async () => {
      if (isDisabled) {
        return;
      }

      setLoading(true);

      try {
        const payload =
          createPayload(form);

        console.log(
          "🚀 POST CREATED:",
          payload
        );

        alert(
          "Post created successfully"
        );

        setForm(INITIAL_FORM);
      } catch (error) {
        console.error(error);

        alert(
          "Error creating post"
        );
      } finally {
        setLoading(false);
      }
    }, [form, isDisabled]);

  // ======================================================
  // 🎨 UI
  // ======================================================

  return (
    <main style={styles.container}>
      <section style={styles.card}>
        {/* HEADER */}

        <header style={styles.header}>
          <h1 style={styles.title}>
            Create Post
          </h1>

          <p style={styles.subtitle}>
            Construction •
            Businesses • Services
            On Demand
          </p>
        </header>

        {/* TYPE */}

        <select
          name="type"
          value={form.type}
          onChange={
            handleTypeChange
          }
          style={styles.input}
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

        {/* CATEGORY */}

        <CategorySelect
          type={form.type}
          value={form.category}
          onChange={handleChange}
        />

        {/* TITLE */}

        <Input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Post title"
          autoComplete="off"
        />

        {/* DESCRIPTION */}

        <Input
          as="textarea"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe your job, business, or service..."
        />

        {/* BUTTON */}

        <button
          type="button"
          disabled={isDisabled}
          onClick={handleCreate}
          style={{
            ...styles.button,

            opacity: isDisabled
              ? 0.7
              : 1,

            cursor: isDisabled
              ? "not-allowed"
              : "pointer",
          }}
        >
          {loading
            ? "Creating..."
            : "Create Post"}
        </button>

        {/* NOTE */}

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

    maxWidth: "480px",

    padding: "24px",

    borderRadius: "24px",
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