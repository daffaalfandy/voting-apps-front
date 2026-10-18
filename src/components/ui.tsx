import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'quiet';

const buttonBase =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55';

const buttonVariants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:enabled:bg-primary-hover',
  secondary: 'border border-line-strong bg-surface text-ink hover:enabled:bg-surface-muted',
  danger: 'border border-danger bg-surface text-danger hover:enabled:bg-danger-soft',
  quiet: 'text-ink hover:enabled:bg-surface-muted',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'secondary', className = '', ...props }: ButtonProps) {
  return <button type="button" className={`${buttonBase} ${buttonVariants[variant]} ${className}`} {...props} />;
}

const controlClass =
  'block min-h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-base text-ink placeholder:text-ink-muted disabled:bg-surface-muted';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
}

export function Field({ label, hint, id, ...props }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-semibold">
        {label}
      </label>
      <input id={inputId} aria-describedby={hintId} className={controlClass} {...props} />
      {hint && (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: ReactNode;
}

export function SelectField({ label, hint, children, ...props }: SelectFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      <select id={id} aria-describedby={hintId} className={controlClass} {...props}>
        {children}
      </select>
      {hint && (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export function ErrorAlert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger-strong">
      {children}
    </p>
  );
}

export function WriteInTag() {
  return (
    <span className="rounded border border-line-strong px-1.5 py-0.5 text-xs font-semibold text-ink-muted">Write-in</span>
  );
}
