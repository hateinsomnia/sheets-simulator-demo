import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#b8d8ff",
          300: "#8bbeff",
          400: "#5e9eff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        accent: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        soft: {
          bg: "#f7f9fc",
          panel: "#ffffff",
          border: "#bcc5d4",
          muted: "#6b7280",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)",
        panel: "0 4px 20px rgba(15, 23, 42, 0.08)",
        glow: "0 0 0 4px rgba(59, 130, 246, 0.15)",
      },
      keyframes: {
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(59,130,246,0.45)" },
          "70%": { boxShadow: "0 0 0 12px rgba(59,130,246,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(59,130,246,0)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "60%": { transform: "scale(1.04)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        pulseRing: "pulseRing 1.6s ease-out infinite",
        fadeIn: "fadeIn 220ms ease-out both",
        pop: "pop 280ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
