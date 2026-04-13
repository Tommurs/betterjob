interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export default function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent
        transition-colors duration-200 cursor-pointer
        focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:outline-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${checked ? 'bg-[#0f2d1f]' : 'bg-[#e5d8c8]'}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm
          transform transition-transform duration-200
          ${checked ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  )
}
