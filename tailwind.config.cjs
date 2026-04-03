/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "ui-sans-serif", "system-ui"],
      },
      colors: {
        // Core theme tokens used in components
        primary: "#012a3d",
        bg: "#e1ecf3",
        text: "#486071",
        // Full palette
        brand_dark: "#012a3d",
        brand_mid1: "#486071",
        brand_mid2: "#778d9b",
        brand_mid3: "#9cb2c1",
        brand_light: "#e1ecf3",
      },
    },
  },
  plugins: [],
};
