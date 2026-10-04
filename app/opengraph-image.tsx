import { ImageResponse } from "next/og";

export const alt = "Pure Earn – Complete Tasks, Earn Rewards";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at 20% 20%, #35205e 0, #09070f 52%)", color: "white", fontFamily: "sans-serif" }}><div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><div style={{ display: "flex", alignItems: "center", gap: 30 }}><div style={{ display: "flex", width: 128, height: 128, borderRadius: 36, alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#a78bfa,#6d28d9)", fontSize: 68, fontWeight: 900, boxShadow: "0 0 50px rgba(139,92,246,.45)" }}>P</div><div style={{ display: "flex", fontSize: 92, fontWeight: 900, letterSpacing: -5 }}>Pure <span style={{ color: "#a78bfa", marginLeft: 18 }}>Earn</span></div></div><div style={{ display: "flex", marginTop: 42, fontSize: 34, color: "#cbd5e1" }}>Complete tasks · Earn rewards · Cash out easily</div><div style={{ display: "flex", marginTop: 30, color: "#fbbf24", fontSize: 24, letterSpacing: 5 }}>EARN.BLISSBIOVN.COM</div></div></div>, size);
}
