import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        ink: {
          900: "#0F1115",
          700: "#2A2E36",
          500: "#5B616E",
          400: "#8A9099",
          300: "#B7BCC4",
          200: "#E4E6EB",
          100: "#EFF0F3",
        },
        paper: {
          DEFAULT: "#F7F7F4",
          card: "#FFFFFF",
        },
        brand: {
          50:  "#EEF0FF",
          100: "#E0E3FF",
          500: "#4F46E5",
          600: "#4338CA",
          700: "#3730A3",
        },
        good: { 50: "#ECFDF5", 500: "#10B981", 600: "#059669", 700: "#047857" },
        bad:  { 50: "#FEF2F2", 500: "#EF4444", 600: "#DC2626" },
        warn: { 500: "#F59E0B" },
        sky:  { 500: "#0EA5E9" },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,17,21,0.04), 0 1px 0 rgba(15,17,21,0.02)",
        soft: "0 8px 24px -12px rgba(15,17,21,0.08)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
    },
  },
  plugins: [],
};
export default config;
