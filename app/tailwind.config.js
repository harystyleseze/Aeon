/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        bg2: "var(--bg2)",
        panel: "var(--panel)",
        panel2: "var(--panel2)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        muted: "var(--muted)",
        line: "var(--line)",
        line2: "var(--line2)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        "accent-tint": "var(--accent-tint)",
        good: "var(--good)",
        "good-tint": "var(--good-tint)",
      },
      fontFamily: {
        serif: ["Newsreader", "Georgia", "serif"],
        sans: ["Manrope", "system-ui", "sans-serif"],
        mono: ["Space Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        DEFAULT: "var(--shadow)",
        lg: "var(--shadow-lg)",
      },
      keyframes: {
        breathe: { "0%,100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.045)" } },
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        blink: {
          "0%,80%,100%": { opacity: "0.25", transform: "translateY(0)" },
          "40%": { opacity: "1", transform: "translateY(-3px)" },
        },
        spin: { to: { transform: "rotate(360deg)" } },
        fadeUp: { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        pulseRing: { "0%": { transform: "scale(0.85)", opacity: "0.5" }, "100%": { transform: "scale(1.6)", opacity: "0" } },
      },
      animation: {
        breathe: "breathe 5s ease-in-out infinite",
        floaty: "floaty 7s ease-in-out infinite",
        blink: "blink 1.2s infinite",
        spin: "spin 1.1s linear infinite",
        fadeUp: "fadeUp 0.3s ease both",
        pulseRing: "pulseRing 3.4s ease-out infinite",
      },
    },
  },
  plugins: [],
};
