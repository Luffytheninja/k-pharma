import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1B3A4B",
          light: "#264653",
          dark: "#122A36",
          50: "#F0F5F7",
          100: "#DCE8ED",
          200: "#B8D0DB",
        },
        trust: {
          surface: "#F5F6F8",
          card: "#FFFFFF",
          border: "#E2E5EA",
          "border-subtle": "#ECEEF2",
          text: "#1E293B",
          "text-secondary": "#64748B",
          "text-muted": "#94A3B8",
          "text-faint": "#CBD5E1",
        },
        success: {
          DEFAULT: "#16A34A",
          light: "#F0FDF4",
          border: "#BBF7D0",
        },
        warning: {
          DEFAULT: "#D97706",
          light: "#FFFBEB",
          border: "#FDE68A",
        },
        danger: {
          DEFAULT: "#DC2626",
          light: "#FEF2F2",
          border: "#FECACA",
        },
        metallic: {
          light: "#C0C0C0",
          dark: "#8A8A8A",
          shine: "#D4D4D8",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "body": ["16px", { lineHeight: "1.5" }],
        "body-lg": ["18px", { lineHeight: "1.5" }],
        "label": ["15px", { lineHeight: "1.4", fontWeight: "500" }],
        "label-sm": ["14px", { lineHeight: "1.3", fontWeight: "600" }],
        "heading-xl": ["28px", { lineHeight: "1.2", fontWeight: "700" }],
        "heading-lg": ["22px", { lineHeight: "1.25", fontWeight: "700" }],
        "heading-md": ["18px", { lineHeight: "1.3", fontWeight: "700" }],
      },
      borderRadius: {
        "card": "16px",
        "button": "12px",
        "input": "12px",
        "modal": "24px",
        "badge": "8px",
      },
      boxShadow: {
        "card": "0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.03)",
        "card-hover": "0 4px 12px 0 rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04)",
        "elevated": "0 8px 24px -4px rgba(0,0,0,0.08), 0 4px 8px -4px rgba(0,0,0,0.04)",
        "metallic-glow": "0 0 0 1px rgba(192,192,192,0.3), 0 2px 8px -2px rgba(192,192,192,0.15)",
        "metallic-hover": "0 0 0 1px rgba(192,192,192,0.5), 0 4px 12px -2px rgba(192,192,192,0.25)",
        "inset-press": "inset 0 2px 4px rgba(0,0,0,0.1)",
        "button-lift": "0 4px 14px -2px rgba(27, 58, 75, 0.25)",
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },
      transitionDuration: {
        "150": "150ms",
        "200": "200ms",
      },
    },
  },
  plugins: [],
};

export default config;
