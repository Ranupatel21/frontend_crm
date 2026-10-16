/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      colors: {
        navy: {
          DEFAULT: "#1E2A4A",
          light: "#2F3D66",
          dark: "#141D34",
        },
        amber: {
          DEFAULT: "#E8A33D",
          dark: "#C6832A",
          light: "#FBE7C6",
        },
        ink: "#1A1D29",
        muted: "#6B7280",
        canvas: "#F7F8FA",
        success: "#1F9D55",
        danger: "#D64545",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.08)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};
