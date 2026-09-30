import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";

// Self-hosted at build time (needs network during `next build`). Korean has no single
// subset worth preloading; the browser fetches only the unicode-range slices a page uses.
// Variable font: no `weight`, so each slice gets one @font-face (100–900) instead of one per weight.
const sans = Noto_Sans_KR({
  preload: false,
  display: "swap",
  variable: "--font-sans",
});

const serif = Noto_Serif_KR({
  weight: "600",
  preload: false,
  display: "swap",
  variable: "--font-serif",
});

/** Put on <html>; globals.css maps --sans/--serif onto these variables. */
export const fontVariables = `${sans.variable} ${serif.variable}`;
