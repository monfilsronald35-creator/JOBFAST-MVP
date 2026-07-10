import React, { memo, useMemo } from "react";
import PropTypes from "prop-types";

/**
 * Default labels used if no labels are provided.
 * If there are more steps than labels,
 * the remaining steps automatically become:
 * Step 5, Step 6, Step 7...
 */
const DEFAULT_STEP_LABELS = [
  "Account",
  "Profession",
  "Verification",
  "Complete",
];

function RegistrationProgress({
  current = 1,
  total = 4,
  className = "",

  /**
   * Future i18n:
   * title={t("registration.progress")}
   */
  title = "Registration Progress",

  /**
   * Custom labels
   */
  stepLabels = DEFAULT_STEP_LABELS,

  /**
   * Future i18n:
   * (current,total)=>t("registration.step",{current,total})
   */
  stepTextFormatter = (current, total) =>
    `Step ${current} of ${total}`,
}) {
  // -----------------------------
  // Safe values
  // -----------------------------

  const safeTotal = Math.max(Number(total) || 1, 1);

  const safeCurrent = Math.min(
    Math.max(Number(current) || 1, 1),
    safeTotal
  );

  // -----------------------------
  // Optimized Progress
  // -----------------------------

  const progress = useMemo(
    () =>
      Math.min(
        safeTotal > 1
          ? ((safeCurrent - 1) / (safeTotal - 1)) * 100
          : 100,
        100
      ),
    [safeCurrent, safeTotal]
  );

  return (
    <section
      dir="auto"
      className={`w-full max-w-2xl mx-auto px-4 py-2 transition-all duration-500 ${className}`}
      aria-labelledby="registration-progress-title"
    >
      {/* Header */}

      <div className="flex items-center justify-between mb-3">
        <h2
          id="registration-progress-title"
          className="text-sm font-semibold tracking-wide text-white"
        >
          {title}
        </h2>

        <span className="inline-flex items-center rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
          {stepTextFormatter(safeCurrent, safeTotal)}
        </span>
      </div>

      {/* Progress */}

      <div
        role="progressbar"
        aria-label={`Registration progress: ${stepTextFormatter(
          safeCurrent,
          safeTotal
        )}`}
        aria-valuemin={1}
        aria-valuemax={safeTotal}
        aria-valuenow={safeCurrent}
        aria-valuetext={stepTextFormatter(
          safeCurrent,
          safeTotal
        )}
        className="relative h-3 w-full overflow-hidden rounded-full border border-slate-600 bg-slate-700/70"
      >
        <div
          className="
            absolute left-0 top-0 h-full rounded-full
            bg-gradient-to-r
            from-yellow-500
            via-amber-400
            to-yellow-300
            shadow-[0_0_18px_rgba(250,204,21,.55)]
            transition-all duration-500 ease-in-out
          "
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      {/* Steps */}

      <div className="relative mt-5 flex justify-between">
        {Array.from({ length: safeTotal }).map((_, index) => {
          const step = index + 1;

          const completed = step < safeCurrent;
          const active = step === safeCurrent;

          const label =
            stepLabels[index] ?? `Step ${step}`;

          let circleClass =
            "w-7 h-7 rounded-full bg-slate-700 border border-slate-500 text-slate-400";

          if (completed) {
            circleClass =
              "w-7 h-7 rounded-full bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,.55)]";
          }

          if (active) {
            circleClass =
              "w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-black scale-110 ring-4 ring-yellow-500/20 shadow-[0_0_20px_rgba(250,204,21,.7)]";
          }

          let labelClass = "text-slate-500";

          if (completed) labelClass = "text-white";

          if (active) labelClass = "text-yellow-400";

          return (
            <div
              key={step}
              className="flex flex-1 flex-col items-center"
            >
              <div
                className={`flex items-center justify-center transition-all duration-300 ${circleClass}`}
              >
                {completed ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="text-xs font-bold">
                    {step}
                  </span>
                )}
              </div>

              <span
                className={`mt-2 text-center text-[11px] font-medium ${labelClass}`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

RegistrationProgress.propTypes = {
  current: PropTypes.number,
  total: PropTypes.number,
  className: PropTypes.string,
  title: PropTypes.string,
  stepLabels: PropTypes.arrayOf(PropTypes.string),
  stepTextFormatter: PropTypes.func,
};

RegistrationProgress.displayName =
  "RegistrationProgress";

export default memo(RegistrationProgress);
