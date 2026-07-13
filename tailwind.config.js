/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        onyx: {
          DEFAULT: "#1a1a1a",
          light: "#2a2a2a",
          muted: "#6b6b6b",
          border: "#333",
        },
        cream: {
          DEFAULT: "#f5f0e8",
          light: "#faf7f2",
          dark: "#e8e0d4",
        },
        rusty: {
          DEFAULT: "#B8962E",
          light: "#C4A44A",
          dark: "#A07820",
          bg: "#F5ECD7",
          "bg-light": "#FAF3E0",
          text: "#3D3528",
          muted: "#8B7355",
          border: "#D4C695",
        },
      },
      fontFamily: {
        heading: ["Cormorant Garamond", "serif"],
        body: ["Inter", "sans-serif"],
        script: ["Cormorant Garamond", "serif"],
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out",
        "fade-in-down": "fade-in-down 0.5s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-in-up": { from: { opacity: "0", transform: "translateY(20px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "fade-in-down": { from: { opacity: "0", transform: "translateY(-20px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "scale-in": { from: { opacity: "0", transform: "scale(0.95)" }, to: { opacity: "1", transform: "scale(1)" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(100%)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
