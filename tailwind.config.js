/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rusty: {
          bg: "#F5ECD7",
          cream: "#FAF3E0",
          gold: "#C4A44A",
          "gold-dark": "#B8962E",
          "gold-deep": "#A07820",
          text: "#3D3528",
          "text-light": "#8B7355",
          border: "#D4C695",
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "serif"],
        script: ['"Cormorant Garamond"', "serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "fade-in-up": "fadeInUp 0.7s ease-out",
        "fade-in-down": "fadeInDown 0.7s ease-out",
        "scale-in": "scaleIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        fadeInUp: { "0%": { opacity: "0", transform: "translateY(24px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fadeInDown: { "0%": { opacity: "0", transform: "translateY(-24px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        scaleIn: { "0%": { opacity: "0", transform: "scale(0.95)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
