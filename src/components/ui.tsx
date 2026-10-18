import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';

export const card = 'rounded-xl border border-line bg-surface shadow-xs';

type Variant = 'primary' | 'secondary' | 'warn' | 'danger' | 'quiet';

const buttonBase =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-55';

const buttonVariants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary shadow-xs hover:enabled:bg-primary-hover',
  secondary: 'border border-line bg-surface text-ink hover:enabled:bg-surface-muted',
  warn: 'border border-warn-line bg-warn-wash text-warn-ink hover:enabled:bg-warn-soft',
  danger: 'border border-danger-line bg-surface text-danger-strong hover:enabled:bg-danger-soft',
  quiet: 'text-ink hover:enabled:bg-surface-muted',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'secondary', className = '', ...props }: ButtonProps) {
  return <button type="button" className={`${buttonBase} ${buttonVariants[variant]} ${className}`} {...props} />;
}

type Tone = 'neutral' | 'success' | 'warn' | 'danger';

const badgeTones: Record<Tone, string> = {
  neutral: 'border-line bg-surface-muted text-ink',
  success: 'border-success-line bg-success-soft text-success-ink',
  warn: 'border-warn-line bg-warn-soft text-warn-ink',
  danger: 'border-danger-line bg-danger-soft text-danger-ink',
};

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-bold ${badgeTones[tone]}`}>{children}</span>
  );
}

export const WriteInTag = () => <Badge tone="warn">Write-in</Badge>;

const controlClass =
  'block min-h-11 w-full rounded-lg border border-line-strong bg-surface px-3 text-base text-ink placeholder:text-ink-muted disabled:bg-surface-muted';

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
      <label htmlFor={inputId} className="block text-sm font-bold text-ink">
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
      <label htmlFor={id} className="block text-sm font-bold text-ink">
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
    <p role="alert" className="rounded-lg border border-danger-line bg-danger-soft px-3 py-2 text-sm font-bold text-danger-ink">
      {children}
    </p>
  );
}
