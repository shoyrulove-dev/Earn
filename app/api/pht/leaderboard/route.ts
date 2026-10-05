import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
export const dynamic = "force-dynamic";
export async function GET() { await connectDB(); const since = new Date(Date.now() - 7 * 86400000); const leaders = await Transaction.aggregate([{ $match: { currency: "PHT", status: "approved", type: "earning", createdAt: { $gte: since } } }, { $group: { _id: "$userId", pht: { $sum: "$amount" } } }, { $sort: { pht: -1 } }, { $limit: 20 }, { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } }, { $project: { _id: 0, userId: "$_id", pht: 1, name: { $ifNull: [{ $first: "$user.name" }, "Pure Earn member"] }, username: { $first: "$user.username" }, image: { $first: "$user.image" } } }]); return NextResponse.json({ leaders, period: "7d" }); }
