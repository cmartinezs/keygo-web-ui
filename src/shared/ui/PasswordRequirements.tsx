import type { ReactNode } from 'react';

export interface PasswordRequirement {
  key: string;
  label: string;
  ok: boolean;
}

export type PasswordRequirementsVariant = 'dark' | 'light';

interface PasswordRequirementsProps {
  requirements: PasswordRequirement[];
  variant?: PasswordRequirementsVariant;
  children?: ReactNode;
}

const VARIANT_COLORS: Record<PasswordRequirementsVariant, { ok: string; pending: string }> = {
  dark: { ok: 'text-emerald-400', pending: 'text-slate-400' },
  light: { ok: 'text-emerald-600', pending: 'text-slate-400' },
};

export function PasswordRequirements({
  requirements,
  variant = 'light',
  children,
}: PasswordRequirementsProps) {
  const colors = VARIANT_COLORS[variant];
  return (
    <ul className="mt-2 grid grid-cols-1 gap-1" aria-label="Requisitos de la contraseña">
      {requirements.map(({ key, ok, label }) => (
        <li
          key={key}
          className={`flex items-center gap-1.5 text-xs ${ok ? colors.ok : colors.pending}`}
        >
          {ok ? (
            <svg
              className="w-3.5 h-3.5 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="w-3.5 h-3.5 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {label}
        </li>
      ))}
      {children}
    </ul>
  );
}
