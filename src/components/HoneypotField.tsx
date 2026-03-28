import type { ChangeEvent } from 'react'

interface HoneypotFieldProps {
  name: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

/**
 * Visually hidden decoy field to trap automated bots.
 * Positioned off-screen (not display:none) so bots that skip purely hidden elements still see it.
 * Any value filled in this field signals automated behaviour.
 */
export function HoneypotField({ name, value, onChange }: HoneypotFieldProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    >
      {/* Intentional decoy label — bots scan for field labels to fill */}
      <label htmlFor={`hp_${name}`}>Website</label>
      <input
        id={`hp_${name}`}
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        autoComplete="off"
        tabIndex={-1}
      />
    </div>
  )
}
