import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#070B14",
        surface: "#101625",
        primary: {
          DEFAULT: "#7C3AED",
          foreground: "#FFFFFF",
        },
        accent: "#A855F7",
        highlight: "#EC4899",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(124, 58, 237, 0.45)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #EC4899 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
