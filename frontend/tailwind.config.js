/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Colors ───────────────────────────────────────────────────────────
      colors: {
        ink:        "#211E1B",
        sand:       "#FBF7F2",
        sea:        "#0E6B73",
        coral:      "#EA5A41",
        "coral-dark":  "#C8462E",
        "coral-soft":  "#FCEBE5",
        line:       "#ECE5DC",
      },
      // ── Typography ───────────────────────────────────────────────────────
      // → font variables are injected by next/font in layout.tsx
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans:    ["var(--font-plus-jakarta-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};
