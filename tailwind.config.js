/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FFF8F0",
        peach: { DEFAULT: "#FFE8D6", light: "#FFF0E6" },
        coral: { DEFAULT: "#E8735A", hover: "#D4614A" },
        deep: "#2C1810",
        mid: "#5C3D2E",
        soft: "#8B6F5E",
        butter: { DEFAULT: "#FFE566", soft: "#FFF4C2" },
        sage: { DEFAULT: "#A8C5A0", bg: "#E8F0E6" },
        lav: { DEFAULT: "#C5B8D9", bg: "#EDE8F5" },
      },
      fontFamily: {
        display: ["'Fraunces'", "Georgia", "serif"],
        body: ["'DM Sans'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
        "card-lg": "22px",
      },
    },
  },
  plugins: [],
}