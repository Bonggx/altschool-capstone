/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light pink palette — soft, clean, and professional
        brand: {
          50: "#fff0f3",
          100: "#ffe0e8",
          200: "#ffc2d1",
          300: "#ff9ab3",
          400: "#ff6b94",
          500: "#f43f6e",
          600: "#e0184d",
          700: "#be1240",
          800: "#9d1237",
          900: "#830f32",
        },
      },
      fontFamily: {
        // DM Sans for body — clean and professional
        sans: ["DM Sans", "system-ui", "sans-serif"],
        // Playfair Display for headings — mature and editorial
        serif: ["Playfair Display", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
