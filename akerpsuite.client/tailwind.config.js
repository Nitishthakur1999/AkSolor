import defaultColors from "tailwindcss/colors";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  // The admin dashboard's card colors (bgColor / iconColor) come from the
  // backend API at runtime — Tailwind's build-time content scan can never
  // see those strings in source code, so without a safelist those classes
  // get silently dropped from the compiled CSS (cards render with no
  // accent color at all). This keeps every common bg/text/border shade
  // available no matter what the API sends.
  safelist: [
    {
      pattern: /^(bg|text|border)-(slate|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900)$/,
    },
  ],
  theme: {
    extend: {
      colors: {
        chalk: "var(--color-chalk)",
        paper: "var(--color-paper)",
        charcoal: "var(--color-charcoal)",
        "charcoal-soft": "var(--color-charcoal-soft)",
        gold: "var(--color-gold)",
        "gold-deep": "var(--color-gold-deep)",
        // NOTE: these used to be plain strings, which silently wiped out
        // Tailwind's entire built-in slate-50..900 / green-50..900 scales
        // (every bg-slate-200, text-slate-500, bg-green-50 etc. across the
        // admin panel was compiling to NOTHING). Keeping DEFAULT for the
        // brand tone while restoring the numeric scale underneath fixes it.
        green: { ...defaultColors.green, DEFAULT: "var(--color-green)" },
        slate: { ...defaultColors.slate, DEFAULT: "var(--color-slate)" },
        "slate-light": "var(--color-slate-light)",
        line: "var(--color-line)",
        "line-strong": "var(--color-line-strong)",
        mist: "var(--color-mist)", // ← ye line add karo
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Space Grotesk"', "sans-serif"],
        sans: ['"Plus Jakarta Sans"', "Inter", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        soft: "0 4px 24px rgba(0,0,0,0.35)",
        card: "0 12px 44px rgba(0,0,0,0.5)",
        glow: "0 0 0 1px rgba(228,255,78,0.15), 0 18px 50px rgba(228,255,78,0.12)",
        "glow-ember":
          "0 0 0 1px rgba(255,77,46,0.18), 0 18px 50px rgba(255,77,46,0.16)",
      },
      keyframes: {
        heroFadeUp: {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        sunRise: {
          "0%": { top: "135%", opacity: "0" },
          "55%": { opacity: "1" },
          "100%": { top: "34%", opacity: "1" },
        },
        sunRiseMobile: {
          "0%": { top: "95%", opacity: "0" },
          "55%": { opacity: "1" },
          "100%": { top: "16%", opacity: "1" },
        },
        raysFadeSpin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        raysFadeIn: { to: { opacity: "0.4" } },
        sunPulse: {
          "0%, 100%": { opacity: "0.18", transform: "scale(1)" },
          "50%": { opacity: "0.42", transform: "scale(1.1)" },
        },
        scrollPulse: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        tickerScroll: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        slideTesti: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-33.333%)" },
        },
        cursorBreathe: {
          "0%, 100%": { width: "32px", height: "32px", opacity: "0.55" },
          "50%": { width: "38px", height: "38px", opacity: "1" },
        },
        whatsappPulse: {
          "0%": { transform: "scale(1)", opacity: "0.55" },
          "100%": { transform: "scale(1.7)", opacity: "0" },
        },
      },

      animation: {
        "hero-fade-up": "heroFadeUp 0.8s ease forwards",
        "sun-rise": "sunRise 2.4s cubic-bezier(0.22,1,0.36,1) 0.3s forwards",
        "sun-rise-mobile":
          "sunRiseMobile 2s cubic-bezier(0.22,1,0.36,1) 0.3s forwards",
        "rays-spin": "raysFadeSpin 36s linear 1.5s infinite",
        "rays-fade-in": "raysFadeIn 1.6s ease 1.5s forwards",
        rays: "raysFadeIn 1.6s ease 1.5s forwards, raysFadeSpin 36s linear 1.5s infinite",
        "sun-pulse": "sunPulse 3.4s ease-in-out 2.2s infinite",
        "scroll-pulse": "scrollPulse 1.8s ease-in-out infinite",
        "ticker-scroll": "tickerScroll 32s linear infinite",
        "slide-testi": "slideTesti 34s linear infinite",
        "cursor-breathe": "cursorBreathe 2.6s ease-in-out infinite",
        "whatsapp-pulse": "whatsappPulse 2.4s ease-out infinite",
      },
    },
  },

  plugins: [],
};
