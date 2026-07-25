/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ledger: "#28493F",
        ink: "#1C2620",
        paper: "#EDEFE9",
        background: "#f8faf4",
        card: "#FFFFFF",
        stamp: "#B4402F",
        brass: "#A9812E",
        utility: "#4B6C50",
        identity: "#7A3B36",
        medical: "#3E5C76",
        tax: "#5B4636",
        travel: "#8A6A3D",
        receipts: "#6B5B73",
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
