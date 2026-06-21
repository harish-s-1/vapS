import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // patS healthcare palette
        primary: {
          DEFAULT: "#4CAF50",
          50: "#F1F9F1",
          100: "#DDEEDD",
          200: "#C2E2C2",
          300: "#9BD09B",
          400: "#6FBE6F",
          500: "#4CAF50",
          600: "#3D9140",
          700: "#327535",
          800: "#2C5D2F",
          900: "#264D29",
        },
        emerald: {
          DEFAULT: "#22C55E",
        },
        sage: "#DDEEDD",
        surface: "#FFFFFF",
        bg: {
          primary: "#F8FAF8",
          secondary: "#EEF2EF",
        },
        ink: {
          DEFAULT: "#1F2937",
          soft: "#64748B",
        },
        info: "#60A5FA",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(76, 175, 80, 0.04), 0 8px 24px rgba(31, 41, 55, 0.04)",
        card: "0 1px 2px rgba(31,41,55,0.04), 0 6px 20px rgba(31,41,55,0.05)",
        "neu-out": "8px 8px 20px rgba(31,41,55,0.06), -8px -8px 20px rgba(255,255,255,0.9)",
        "neu-in": "inset 4px 4px 10px rgba(31,41,55,0.05), inset -4px -4px 10px rgba(255,255,255,0.85)",
        glow: "0 0 0 4px rgba(76,175,80,0.12)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.3)", opacity: "0" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out forwards",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
