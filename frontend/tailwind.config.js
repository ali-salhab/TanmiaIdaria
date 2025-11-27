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
        // Custom animations from animations.css
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInLeft: {
          "0%": { opacity: "0", transform: "translateX(-30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        fadeInRight: {
          "0%": { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        bounceIn: {
          "0%": { opacity: "0", transform: "scale(0.3)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)" },
        },
        rotateIn: {
          "0%": {
            opacity: "0",
            transform: "perspective(1000px) rotateX(90deg)",
          },
          "100%": {
            opacity: "1",
            transform: "perspective(1000px) rotateX(0deg)",
          },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        scaleOut: {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.8)" },
        },
        lift: {
          "0%": {
            transform: "translateY(0)",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          },
          "100%": {
            transform: "translateY(-4px)",
            boxShadow: "0 12px 24px rgba(0, 0, 0, 0.15)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        floatRandom: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(5px, -8px)" },
          "50%": { transform: "translate(-3px, -15px)" },
          "75%": { transform: "translate(8px, -5px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        skeleton: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        slideInFromBottom: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        zoomIn: {
          "0%": { opacity: "0", transform: "scale(0.5)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        pulseGentle: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.05)", opacity: "0.8" },
        },
      },
      animation: {
        slowBounce: "slowBounce 2s ease-in-out infinite",
        fadeIn: "fadeIn 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        fadeInUp: "fadeInUp 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        fadeInDown: "fadeInDown 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        fadeInLeft: "fadeInLeft 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        fadeInRight: "fadeInRight 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        scaleIn: "scaleIn 350ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        bounceIn:
          "bounceIn 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards",
        rotateIn: "rotateIn 500ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        fadeOut: "fadeOut 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        scaleOut: "scaleOut 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        lift: "lift 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        float: "float 3s ease-in-out infinite",
        floatRandom: "floatRandom 5s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
        skeleton: "skeleton 1.5s linear infinite",
        slideInFromBottom:
          "slideInFromBottom 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        zoomIn: "zoomIn 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        slideInRight:
          "slideInRight 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        pulseGentle: "pulseGentle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      fontFamily: {
        custom: ["Tajawal", "Cairo", "sans-serif"],
        amiri: ["Amiri", "serif"],
        arabic: ["Tajawal", "sans-serif"],
      },
      colors: {
        primary: "#1E3A8A",
        secondary: "#2563EB",
        governmentGrey: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
        },
        governmentBlack: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
        },
      },
    },
  },
  plugins: [],
};
