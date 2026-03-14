/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gd: {
          forest: "var(--gd-color-forest)",
          leaf: "var(--gd-color-leaf)",
          olive: "var(--gd-color-olive)",
          beige: "var(--gd-color-beige)",
          orange: "var(--gd-color-orange)",
          red: "var(--gd-color-red)",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        fredoka: ["Fredoka", "sans-serif"],
        caveat: ["Caveat Brush", "cursive"],
        display: ["Fredoka", "sans-serif"],
      },
    },
  },
  plugins: [],
};
