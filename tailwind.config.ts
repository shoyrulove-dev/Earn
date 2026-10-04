import type { Config } from "tailwindcss";
const config: Config = { darkMode: ["class"], content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#09070f", panel: "#14101d", neon: "#8b5cf6", primary: "hsl(var(--primary))", reward: "#fbbf24" }, boxShadow: { glow: "0 0 28px rgba(139,92,246,.35)" } } }, plugins: [] };
export default config;
