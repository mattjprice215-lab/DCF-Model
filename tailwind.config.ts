import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        civic: {
          navy: "#0B1F3A",
          blue: "#1F5E9C",
          green: "#2A9D8F",
          amber: "#F4A261",
          red: "#D64550"
        }
      }
    }
  },
  plugins: []
} satisfies Config;
