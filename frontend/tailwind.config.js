/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#142B4A",
        blue: "#3478F6",
        cyan: "#20C4D8",
        ink: "#17243A",
        muted: "#728098",
        canvas: "#F5F7FB"
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Manrope", "sans-serif"]
      },
      boxShadow: {
        card: "0 10px 35px rgba(20,43,74,0.06)"
      }
    }
  },
  plugins: []
};
