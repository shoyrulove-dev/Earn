import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Minijob from "@/models/Minijob";
export async function GET() { try { await connectDB(); const jobs = await Minijob.find({ active: true }).sort({ createdAt: -1 }).lean(); return NextResponse.json({ jobs }); } catch { return NextResponse.json({ error: "Database unavailable" }, { status: 503 }); } }
