import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Submission from "@/models/Submission";
export async function POST(request: Request) { const session = await getAuthSession(); if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const body = await request.json(); if (!body.minijobId || !body.proofUrl) return NextResponse.json({ error: "minijobId and proofUrl are required" }, { status: 400 }); await connectDB(); const submission = await Submission.create({ userId: session.user.id, minijobId: body.minijobId, proofUrl: body.proofUrl, note: body.note }); return NextResponse.json({ submission }, { status: 201 }); }
export async function GET() { const session = await getAuthSession(); if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); await connectDB(); return NextResponse.json({ submissions: await Submission.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean() }); }
