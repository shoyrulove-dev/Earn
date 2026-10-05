import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Minijob from "@/models/Minijob";
async function admin() { const session = await getAuthSession(); return session?.user?.role === "admin"; }
export async function GET() { if (!await admin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); await connectDB(); return NextResponse.json({ jobs: await Minijob.find().sort({ createdAt: -1 }).lean() }); }
export async function POST(request: Request) { if (!await admin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); const body = await request.json(); if (!body.title || !Number.isFinite(Number(body.reward))) return NextResponse.json({ error: "title and numeric PHT reward are required" }, { status: 400 }); await connectDB(); return NextResponse.json({ job: await Minijob.create({ title: body.title, description: body.description, reward: Math.floor(Number(body.reward)), rewardCurrency: "PHT", source: "MINIJOB", tags: body.tags || [], icon: body.icon || "P", active: body.active !== false }) }, { status: 201 }); }
export async function PATCH(request: Request) { if (!await admin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); const { id, ...changes } = await request.json(); if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 }); await connectDB(); return NextResponse.json({ job: await Minijob.findByIdAndUpdate(id, { $set: changes }, { new: true }) }); }
