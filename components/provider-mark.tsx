import type { Provider } from "@/lib/profile";

// Brand symbols for the login buttons, drawn inline so nothing is fetched.
const marks: Record<Provider, React.ReactNode> = {
  kakao: (
    <path
      fill="currentColor"
      d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.86 5.26 4.66 6.67L5.5 21.2a.3.3 0 0 0 .46.32l4.6-3.05c.47.05.95.08 1.44.08 5.52 0 10-3.58 10-8S17.52 3 12 3z"
    />
  ),
  naver: (
    <path
      fill="currentColor"
      d="M16.27 3v9.56L7.73 3H3v18h4.73v-9.56L16.27 21H21V3z"
    />
  ),
  google: (
    <>
      <path
        fill="#ea4335"
        d="M12 5.04c1.94 0 3.28.84 4.04 1.54l2.95-2.88C17.18 2.02 14.83 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.44 2.67C6.47 7.2 9.01 5.04 12 5.04z"
      />
      <path
        fill="#4285f4"
        d="M23.49 12.27c0-.9-.08-1.55-.24-2.23H12v4.05h6.6c-.13 1.09-.85 2.74-2.44 3.85l3.35 2.6c2.01-1.85 3.16-4.58 3.16-8.27z"
      />
      <path
        fill="#fbbc05"
        d="M5.62 14.26A6.94 6.94 0 0 1 5.24 12c0-.79.14-1.55.37-2.26L2.18 7.07A11.95 11.95 0 0 0 1 12c0 1.94.46 3.77 1.28 5.4l3.34-2.6z"
      />
      <path
        fill="#34a853"
        d="M12 23c3.24 0 5.96-1.07 7.95-2.9l-3.35-2.6c-.92.64-2.15 1.09-4.6 1.09-3 0-5.53-1.98-6.44-4.72l-3.34 2.6C4.03 20.53 7.72 23 12 23z"
      />
    </>
  ),
};

export function ProviderMark({ provider }: { provider: Provider }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {marks[provider]}
    </svg>
  );
}
