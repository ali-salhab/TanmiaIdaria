/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        custom: ["Cairo", "sans-serif"],
      },
      colors: {
        primary: "#1E3A8A",
        secondary: "#2563EB",
      },
    },
  },
  plugins: [],
};
