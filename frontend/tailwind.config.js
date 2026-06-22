/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Colors ───────────────────────────────────────────────────────────
      colors: {
        ink:           "#211E1B",
        sand:          "#FBF7F2",
        sea:           "#0E6B73",
        coral:         "#EA5A41",
        "coral-dark":  "#C8462E",
        "coral-soft":  "#FCEBE5",
        line:          "#ECE5DC",
        // → Airbnb-inspired surface & hairline tokens
        hairline:        "#DDDDDD",
        "hairline-soft": "#EBEBEB",
        "surface-soft":  "#F7F7F7",
        muted:           "#6A6A6A",
      },
      // ── Typography ───────────────────────────────────────────────────────
      // → font variables are injected by next/font in layout.tsx
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      // ── Border radius ────────────────────────────────────────────────────
      // → Airbnb shape language: soft everywhere
      borderRadius: {
        card: "14px",
      },
      // ── Elevation ────────────────────────────────────────────────────────
      // → Airbnb single shadow tier
      boxShadow: {
        card: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px 0, rgba(0,0,0,0.1) 0 4px 8px 0",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};
