'use client'

import styles from './WhatsAppButton.module.css'

type Props = {
  pageTag?: string
}

function toDigits(value: string): string {
  return value.replace(/[^\d]/g, '')
}

export default function WhatsAppButton({ pageTag }: Props) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''
  const message =
    process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE ??
    'Hello, I would like to contact Vorton support.'

  const digits = toDigits(number)
  if (!digits) return null

  const taggedMessage = pageTag ? `${message} [${pageTag}]` : message
  const href = `https://wa.me/${digits}?text=${encodeURIComponent(taggedMessage)}`

  return (
    <a
      href={href}
      className={styles.button}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
      title="Contact us on WhatsApp"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
        <path
          fill="currentColor"
          d="M19.05 4.94A9.87 9.87 0 0 0 12 2a9.94 9.94 0 0 0-8.6 14.94L2 22l5.2-1.36A9.92 9.92 0 0 0 12 22a10 10 0 0 0 7.05-17.06ZM12 20.18a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.08.8.82-3-.2-.31A8.2 8.2 0 1 1 12 20.18Zm4.5-6.15c-.25-.13-1.47-.73-1.7-.82-.23-.08-.4-.12-.58.13-.17.25-.66.82-.8.99-.15.16-.3.18-.55.06-.25-.13-1.07-.39-2.03-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.38.11-.5.11-.1.25-.27.38-.4.12-.13.17-.22.25-.37.08-.16.04-.28-.02-.4-.07-.13-.58-1.4-.8-1.92-.2-.47-.42-.4-.58-.4h-.5c-.16 0-.42.06-.64.3-.22.25-.84.82-.84 2 0 1.17.86 2.31.98 2.47.12.17 1.68 2.57 4.08 3.6.57.25 1.02.4 1.37.52.58.18 1.1.15 1.5.09.46-.07 1.47-.6 1.68-1.18.2-.58.2-1.07.14-1.18-.06-.1-.23-.16-.48-.28Z"
        />
      </svg>
    </a>
  )
}
