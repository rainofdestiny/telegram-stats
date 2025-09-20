/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#c084fc", // светлый фиолетовый
          DEFAULT: "#a855f7", // основной фиолетовый
          dark: "#7e22ce", // тёмный фиолетовый
        },
      },
      boxShadow: {
        brand: "0 4px 14px 0 rgba(168, 85, 247, 0.4)",
      },
    },
  },
  plugins: [],
};
