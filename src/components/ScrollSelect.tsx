import { useState, useRef, useEffect } from 'react'
import styles from './ScrollSelect.module.css'

type ScrollSelectProps = {
  id: string
  label: string
  value: string
  options: { value: string; label: string }[]
  placeholder: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function ScrollSelect({
  id,
  label,
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
}: ScrollSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayLabel = value ? (options.find((o) => o.value === value)?.label ?? value) : placeholder

  return (
    <div className={styles.wrap} ref={ref}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <button
        id={id}
        type="button"
        className={styles.trigger}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={styles.triggerText}>{displayLabel}</span>
        <span className={styles.arrow} aria-hidden>▼</span>
      </button>
      {open && (
        <div
          className={styles.dropdown}
          role="listbox"
          aria-label={label}
        >
          <button
            type="button"
            className={`${styles.option} ${!value ? styles.optionActive : ''}`}
            role="option"
            aria-selected={!value}
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.option} ${value === opt.value ? styles.optionActive : ''}`}
              role="option"
              aria-selected={value === opt.value}
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
