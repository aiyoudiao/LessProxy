/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        merchantPurple: {
          light: "#C4B5FD",
          DEFAULT: "#7C3AED",
          dark: "#5B21B6",
        },
      },
      boxShadow: {
        glow: "0 0 8px rgba(124, 58, 237, 0.25)",
      },
    },
  },
  plugins: [],
};
