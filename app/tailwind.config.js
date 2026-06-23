/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        aeon: { bg: "#0a0a12", glow: "#7c5cff", glow2: "#22d3ee" },
      },
      keyframes: {
        breathe: {
          "0%,100%": { transform: "scale(1)", opacity: "0.85" },
          "50%": { transform: "scale(1.06)", opacity: "1" },
        },
      },
      animation: { breathe: "breathe 4s ease-in-out infinite" },
    },
  },
  plugins: [],
};
