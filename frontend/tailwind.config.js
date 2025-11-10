/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        slowBounce: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" }, // move up 10px
        },
      },
      animation: {
        slowBounce: "slowBounce 2s ease-in-out infinite",
      },
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
