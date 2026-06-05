import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // warm devotional palette
        kumkum: "#8c1d18",   // deep maroon
        saffron: "#d97706",  // saffron accent
        turmeric: "#f3b21b",
        sandal: "#f6efe3",   // cream/sandalwood
        ink: "#2b211c",
        muted: "#6b5d53",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        telugu: ["var(--font-telugu)", "Noto Serif Telugu", "serif"],
      },
      boxShadow: { card: "0 1px 2px rgba(43,33,28,.06), 0 8px 24px rgba(43,33,28,.08)" },
    },
  },
  plugins: [],
};
export default config;
