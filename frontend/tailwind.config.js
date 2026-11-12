/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        accent: { DEFAULT: "#C2410C", hover: "#9A3412" },
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        slidein: { from: { transform: "translateX(100%)" }, to: { transform: "none" } },
      },
      animation: {
        slidein: "slidein .18s ease-out",
      },
    },
  },
  plugins: [],
};
