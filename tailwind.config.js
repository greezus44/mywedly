/** @type {import('tailwindcss').Config} */
export default {
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Cormorant Garamond", "serif"],
        body: ["Inter", "sans-serif"],
        script: ["Dancing Script", "cursive"],
      },
      colors: {
        dash: {
          bg: "#f9fafb",
          surface: "#ffffff",
          border: "#e5e7eb",
          text: "#111827",
          muted: "#6b7280",
          primary: "#111827",
        },
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
