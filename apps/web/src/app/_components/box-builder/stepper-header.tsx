"use client";

type StepperHeaderProps = {
  steps: Array<{ id: string; label: string }>;
  activeStep: number;
  onStepSelect?: (index: number) => void;
};

export function StepperHeader({ steps, activeStep, onStepSelect }: StepperHeaderProps) {
  return (
    <ol className="flex flex-wrap items-center gap-4 rounded-3xl border border-[var(--color-border)] bg-white/90 p-4 shadow-soft">
      {steps.map((step, index) => {
        const isActive = index === activeStep;
        const isCompleted = index < activeStep;
        return (
          <li key={step.id} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onStepSelect?.(index)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition ${
                isActive
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                  : isCompleted
                    ? "border-[var(--color-brand-accent)] bg-[var(--color-brand-soft)] text-[var(--color-brand-accent)]"
                    : "border-[var(--color-border)] bg-white text-[var(--color-muted)] hover:border-[var(--color-brand)]"
              }`}
              aria-current={isActive ? "step" : undefined}
            >
              {index + 1}
            </button>
            <div className="min-w-[140px]">
              <p
                className={`text-xs uppercase tracking-[0.25em] ${
                  isActive ? "text-[var(--color-brand)]" : "text-[var(--color-muted)]"
                }`}
              >
                Paso {index + 1}
              </p>
              <p className="text-sm font-semibold text-[var(--color-foreground)]">{step.label}</p>
            </div>
            {index < steps.length - 1 && <span className="h-px w-8 bg-[var(--color-border)]" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
