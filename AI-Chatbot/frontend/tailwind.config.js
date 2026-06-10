/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chatBg: "#0A0A0A",
        chatCard: "#171717",
        chatBorder: "#262626",
        chatPrimary: "#10A37F",
        chatText: "#FFFFFF",
        chatTextMuted: "#A3A3A3",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
