/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { ink: "#172033", brand: "#635bff" },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"]
      }
    }
  },
  plugins: []
}
