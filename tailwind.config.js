/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        cormorant: ['"Cormorant Garamond"', "Georgia", "serif"],
      },
      colors: {
        rusty: {
          bg: "#F5ECD7",
          gold: "#B8962E",
          "gold-light": "#C4A44A",
          "gold-muted": "#D4B878",
          "gold-border": "#C4A44A",
          text: "#A07820",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.8s ease-out both",
        "fade-up": "fadeUp 0.7s ease-out both",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        fadeUp: { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
