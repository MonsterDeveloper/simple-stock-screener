import type { Config } from "tailwindcss"
import tailwindcssAnimate from "tailwindcss-animate"

export default {
  content: [
    "./src/app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}",
    "./src/shared/ui/**/*.tsx",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Inter"',
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config
