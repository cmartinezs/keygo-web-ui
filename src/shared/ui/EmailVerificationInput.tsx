import { useState, useRef, useCallback, useEffect } from 'react';

export interface EmailVerificationInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  length?: number;
}

export function EmailVerificationInput({
  value,
  onChange,
  disabled,
  autoFocus = true,
  length = 6,
}: EmailVerificationInputProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(length).fill(null));

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      if (value === '') {
        setDigits(Array(length).fill(''));
        inputRefs.current[0]?.focus();
      }
    });
    return () => cancelAnimationFrame(timer);
  }, [value, length]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  const handleChange = useCallback(
    (index: number, rawValue: string) => {
      const digit = rawValue.replace(/\D/g, '').slice(-1);
      const newDigits = [...digits];
      newDigits[index] = digit;
      setDigits(newDigits);
      onChange(newDigits.join(''));

      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits, onChange, length],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
      if (!pasted) return;

      const newDigits = Array(length).fill('');
      pasted.split('').forEach((ch, i) => {
        newDigits[i] = ch;
      });
      setDigits(newDigits);
      onChange(newDigits.join(''));
      inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
    },
    [length, onChange],
  );

  return (
    <div
      className="flex gap-2 sm:gap-3 justify-center"
      onPaste={handlePaste}
      aria-label="Código de verificación"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          aria-label={`Dígito ${index + 1} de ${length}`}
          className={`w-10 h-12 sm:w-11 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
            digit
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
              : 'border-slate-300 bg-white text-slate-900'
          } ${disabled ? 'bg-slate-100 cursor-not-allowed' : ''}`}
        />
      ))}
    </div>
  );
}
