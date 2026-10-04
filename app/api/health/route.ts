import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
export async function GET() { try { await connectDB(); return NextResponse.json({ ok: true, database: "connected" }); } catch { return NextResponse.json({ ok: false, database: "disconnected" }, { status: 503 }); } }
