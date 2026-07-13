/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dash: {
          bg: "var(--dash-bg)",
          surface: "var(--dash-surface)",
          border: "var(--dash-border)",
          text: "var(--dash-text)",
          muted: "var(--dash-muted)",
          primary: "var(--dash-primary)",
          "primary-hover": "var(--dash-primary-hover)",
          "primary-light": "var(--dash-primary-light)",
        },
        event: {
          bg: "var(--event-bg)",
          surface: "var(--event-surface)",
          border: "var(--event-border)",
          text: "var(--event-text)",
          muted: "var(--event-muted)",
          primary: "var(--event-primary)",
          "primary-hover": "var(--event-primary-hover)",
          "primary-light": "var(--event-primary-light)",
          accent: "var(--event-accent)",
        },
      },
      fontFamily: {
        event: "var(--event-font)",
        dash: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
