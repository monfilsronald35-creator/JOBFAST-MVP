import React, {
  memo,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";

/* ======================================================
   🌍 CONSTANTS
====================================================== */

const DEFAULT_CONFIG = Object.freeze({
  appName: "Ultra System",
  language: "en",
  currency: "USD",
  theme: "dark",
  notifications: true,
});

const LANGUAGES = Object.freeze([
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ht", label: "Kreyòl" },
  { code: "es", label: "Español" },
]);

const CURRENCIES = Object.freeze([
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "HTG", label: "Gourde" },
  { code: "DOP", label: "Peso DR" },
]);

const STORAGE_KEY = "app_config";

/* ======================================================
   🧠 UTIL: DEEP EQUALITY (FAST + SAFE)
====================================================== */

const isEqual = (a, b) =>
  a.appName === b.appName &&
  a.language === b.language &&
  a.currency === b.currency &&
  a.theme === b.theme &&
  a.notifications === b.notifications;

/* ======================================================
   💾 STORAGE ENGINE
====================================================== */

const loadConfig = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;

    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
};

const saveConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

    window.dispatchEvent(
      new CustomEvent("app_config_update", {
        detail: config,
      })
    );

    return true;
  } catch {
    return false;
  }
};

/* ======================================================
   ⚡ FIELD COMPONENT
====================================================== */

const SettingItem = memo(({ id, label, hint, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label htmlFor={id} style={{ fontWeight: 600, display: "block" }}>
      {label}
    </label>
    {children}
    {hint && (
      <small style={{ opacity: 0.7, display: "block", marginTop: 4 }}>
        {hint}
      </small>
    )}
  </div>
));

/* ======================================================
   🚀 ADMIN SETTINGS (FINAL CLEAN ARCHITECTURE)
====================================================== */

function AdminSettings() {
  const [config, setConfig] = useState(loadConfig);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const initialRef = useRef(loadConfig());

  /* ======================================================
     🔄 DERIVED STATE (NO REF STATE BUG)
  ====================================================== */

  const dirty = useMemo(() => {
    return !isEqual(config, initialRef.current);
  }, [config]);

  /* ======================================================
     🔄 UPDATE FIELD (PURE + SAFE)
  ====================================================== */

  const updateField = useCallback((key, value) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));

    setMessage("");
  }, []);

  /* ======================================================
     💱 LABELS
  ====================================================== */

  const languageLabel = useMemo(
    () =>
      LANGUAGES.find((l) => l.code === config.language)?.label ||
      "Unknown",
    [config.language]
  );

  const currencyLabel = useMemo(
    () =>
      CURRENCIES.find((c) => c.code === config.currency)?.label ||
      "Unknown",
    [config.currency]
  );

  /* ======================================================
     💾 SAVE
  ====================================================== */

  const saveSettings = useCallback(async (e) => {
    e?.preventDefault?.();

    setSaving(true);

    try {
      const ok = saveConfig(config);
      if (!ok) throw new Error();

      initialRef.current = config;
      setMessage("✅ Saved successfully");
    } catch {
      setMessage("❌ Save failed");
    } finally {
      setSaving(false);
    }
  }, [config]);

  /* ======================================================
     🔁 RESET
  ====================================================== */

  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setMessage("↩️ Reset done (not saved yet)");
  }, []);

  /* ======================================================
     🧩 UI
  ====================================================== */

  return (
    <form
      onSubmit={saveSettings}
      style={{ padding: 24, maxWidth: 650, margin: "0 auto" }}
    >
      <h1>⚙️ Admin Settings</h1>

      <p style={{ opacity: 0.8 }}>
        {dirty ? "⚠️ Unsaved changes" : "✔ Synced"}
      </p>

      <SettingItem id="appName" label="App Name">
        <input
          value={config.appName}
          onChange={(e) => updateField("appName", e.target.value)}
        />
      </SettingItem>

      <SettingItem id="language" label="Language" hint={languageLabel}>
        <select
          value={config.language}
          onChange={(e) => updateField("language", e.target.value)}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </SettingItem>

      <SettingItem id="currency" label="Currency" hint={currencyLabel}>
        <select
          value={config.currency}
          onChange={(e) => updateField("currency", e.target.value)}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </SettingItem>

      <SettingItem id="theme" label="Theme">
        <select
          value={config.theme}
          onChange={(e) => updateField("theme", e.target.value)}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </SettingItem>

      <SettingItem id="notifications" label="Notifications">
        <input
          type="checkbox"
          checked={config.notifications}
          onChange={(e) =>
            updateField("notifications", e.target.checked)
          }
        />
        <span style={{ marginLeft: 8 }}>Enable</span>
      </SettingItem>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button type="submit" disabled={saving || !dirty}>
          {saving ? "Saving..." : "Save"}
        </button>

        <button type="button" onClick={resetToDefaults}>
          Reset
        </button>
      </div>

      {message && (
        <p style={{ marginTop: 12, fontWeight: 600 }}>
          {message}
        </p>
      )}
    </form>
  );
}

export default memo(AdminSettings);