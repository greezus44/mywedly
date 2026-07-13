/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#fdfcf9", sepia: "#8c7e6a", onyx: "#1a1a1a",
        ink: "#2a2a2a", mist: "#f5f2ee", card: "#ffffff",
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        script: ["Imperial Script", "cursive"],
      },
    },
  },
  plugins: [],
};
