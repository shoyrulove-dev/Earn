import { NextResponse } from "next/server";
export function GET(request: Request) {
  const country = String(request.headers.get("x-vercel-ip-country") || "OTHER").toUpperCase();
  const locale = country === "VN" ? "vi" : country === "CN" ? "zh" : country === "ES" ? "es" : "en";
  return NextResponse.json({ country, locale });
}
