/**
 * Inline icons. Decorative marks are `aria-hidden`; the surrounding link or
 * button carries the accessible name (§20.1).
 */

export function LinkedInIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.71h.05c.53-.95 1.83-1.96 3.76-1.96C21.6 8.75 23 10.9 23 14.2V21h-4v-6c0-1.43-.03-3.27-2.05-3.27-2.05 0-2.37 1.55-2.37 3.16V21h-4V9Z" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M2 8h11" />
      <path d="M9 4l4 4-4 4" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M14 8H3" />
      <path d="M7 4L3 8l4 4" />
    </svg>
  );
}

export function MailIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1.5" y="3.5" width="13" height="9" />
      <path d="M1.5 4.5L8 9l6.5-4.5" />
    </svg>
  );
}

export function PhoneIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 2.5h2.5l1 3-1.5 1a8 8 0 0 0 3.5 3.5l1-1.5 3 1V12a1.5 1.5 0 0 1-1.7 1.5A11.5 11.5 0 0 1 1.5 4.2 1.5 1.5 0 0 1 3 2.5Z" />
    </svg>
  );
}
