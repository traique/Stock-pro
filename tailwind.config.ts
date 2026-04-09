// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./Src/**/*.{js,ts,jsx,tsx,mdx}", // Thêm dòng này để phòng hờ thư mục Src viết hoa
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1E40AF",
        success: "#22C55E",
        danger: "#EF4444",
      },
    },
  },
  plugins: [],
};

export default config;
