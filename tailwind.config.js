/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Cormorant Garamond"', "serif"],
        body: ["Inter", "sans-serif"],
        script: ['"Dancing Script"', "cursive"],
      },
      colors: {
        dash: {
          bg: "var(--dash-bg, #f9fafb)",
          surface: "var(--dash-surface, #ffffff)",
          border: "var(--dash-border, #e5e7eb)",
          text: "var(--dash-text, #111827)",
          muted: "var(--dash-text-muted, #6b7280)",
          primary: "var(--dash-primary, #111827)",
        },
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-in-up": { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(20px)" }, to: { opacity: "1", transform: "translateY(0)" } },
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

