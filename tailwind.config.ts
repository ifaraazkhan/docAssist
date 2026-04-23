import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#0d9488",
          600: "#0f766e",
          700: "#115e59",
          800: "#134e4a",
          900: "#042f2e",
        },
        surface: {
          DEFAULT: "#fafafa",
          card: "#ffffff",
          muted: "#f1f5f9",
        },
        urgent: {
          DEFAULT: "#ef4444",
          50: "#fef2f2",
          100: "#fee2e2",
        },
        amber: {
          50: "#fffbeb",
          DEFAULT: "#f59e0b",
        },
        violet: {
          50: "#f5f3ff",
          DEFAULT: "#8b5cf6",
        },
        // Override text colors for better contrast
        text: {
          primary: "#0a0a0a",
          secondary: "#6b7280",
          tertiary: "#6b7280", // Darkened from #9ca3af for WCAG AA
        },
        border: "rgba(0,0,0,0.06)",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0,0,0,0.04)",
        card: "0 1px 3px rgba(0,0,0,0.08)",
        elevated: "0 12px 32px -4px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.06)",
        "bottom-nav": "0 -2px 12px rgba(0,0,0,0.03)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
