import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
export async function GET() { const session = await getAuthSession(); if (session?.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 }); await connectDB(); return NextResponse.json({ transactions: await Transaction.find().populate("userId", "email name").sort({ createdAt: -1 }).limit(100).lean() }); }
export async function PATCH(request: Request) { const session = await getAuthSession(); if (session?.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 }); const { id, status } = await request.json(); if (!id || !["approved", "rejected"].includes(status)) return NextResponse.json({ error: "Invalid transaction review" }, { status: 400 }); await connectDB(); const tx = await Transaction.findOne({ _id: id, type: "withdrawal", status: "pending" }); if (!tx) return NextResponse.json({ error: "Pending withdrawal not found" }, { status: 404 }); tx.status = status; await tx.save(); await User.findByIdAndUpdate(tx.userId, { $inc: { pendingBalance: -Math.abs(tx.amount), ...(status === "rejected" ? { balance: Math.abs(tx.amount) } : {}) } }); return NextResponse.json({ ok: true }); }
