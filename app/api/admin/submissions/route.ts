import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Submission from "@/models/Submission";
export async function GET() { const session = await getAuthSession(); if (session?.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 }); await connectDB(); return NextResponse.json({ submissions: await Submission.find({ status: "pending" }).populate("userId minijobId").sort({ createdAt: 1 }).lean() }); }
export async function PATCH(request: Request) { const session = await getAuthSession(); if (session?.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 }); const { id, status, reviewNote } = await request.json(); if (!id || !["approved", "rejected"].includes(status)) return NextResponse.json({ error: "Invalid review" }, { status: 400 }); await connectDB(); const updated = await Submission.findOneAndUpdate({ _id: id, status: "pending" }, { status, reviewNote, reviewedBy: session.user.id, reviewedAt: new Date() }, { new: true }); return NextResponse.json({ submission: updated }); }
