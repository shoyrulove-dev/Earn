import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
export async function GET() { const session = await getAuthSession(); if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); await connectDB(); return NextResponse.json({ transactions: await Transaction.find({ userId: session.user.id }).sort({ createdAt: -1 }).limit(50).lean() }); }
