import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Minijob from "@/models/Minijob";
import Submission from "@/models/Submission";
export async function GET() { const session = await getAuthSession(); if (session?.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 }); await connectDB(); const [users, minijobs, pending] = await Promise.all([User.countDocuments(), Minijob.countDocuments({ active: true }), Submission.countDocuments({ status: "pending" })]); return NextResponse.json({ users, minijobs, pending }); }
