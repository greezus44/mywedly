/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dash: {
          bg: "var(--dash-bg, #f8fafc)",
          surface: "var(--dash-surface, #ffffff)",
          border: "var(--dash-border, #e2e8f0)",
          text: "var(--dash-text, #0f172a)",
          muted: "var(--dash-muted, #64748b)",
          primary: "var(--dash-primary, #0ea5e9)",
          "primary-hover": "var(--dash-primary-hover, #0284c7)",
          "primary-fg": "var(--dash-primary-fg, #ffffff)",
          danger: "var(--dash-danger, #ef4444)",
          "danger-hover": "var(--dash-danger-hover, #dc2626)",
          "danger-fg": "var(--dash-danger-fg, #ffffff)",
        },
        event: {
          bg: "var(--event-bg, #fffbeb)",
          surface: "var(--event-surface, #ffffff)",
          "surface-alt": "var(--event-surface-alt, rgba(255,255,255,0.08))",
          border: "var(--event-border, #fde68a)",
          text: "var(--event-text, #78350f)",
          heading: "var(--event-heading, #78350f)",
          muted: "var(--event-muted, #92400e)",
          primary: "var(--event-primary, #b45309)",
          "primary-hover": "var(--event-primary-hover, #92400e)",
          "primary-fg": "var(--event-primary-fg, #ffffff)",
          accent: "var(--event-accent, #d97706)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        event: ["var(--event-font-heading, Georgia, serif)"],
        "event-body": ["var(--event-font-body, Georgia, serif)"],
        rich: ["var(--event-font-rich, Georgia, serif)"],
      },
    },
  },
  plugins: [],
};
