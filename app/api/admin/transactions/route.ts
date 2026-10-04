import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
export async function GET() { const session = await getAuthSession(); if (session?.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 }); await connectDB(); return NextResponse.json({ transactions: await Transaction.find().populate("userId", "email name").sort({ createdAt: -1 }).limit(100).lean() }); }
