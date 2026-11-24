import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Minijob from "@/models/Minijob";
import Submission from "@/models/Submission";
import Transaction from "@/models/Transaction";
import AuditLog from "@/models/AuditLog";

export async function GET() {
  const session = await getAuthSession();
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  await connectDB();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const [users, activeUsers, minijobs, pendingProofs, pendingPayments, balances, recentUsers, daily, audit] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ updatedAt: { $gte: new Date(Date.now() - 86400000) } }),
    Minijob.countDocuments({ active: true }),
    Submission.countDocuments({ status: "pending" }),
    Transaction.countDocuments({ type: "withdrawal", status: "pending" }),
    User.aggregate([{ $group: { _id: null, availablePht: { $sum: "$phtBalance" }, pendingPht: { $sum: "$pendingPht" }, paidPht: { $sum: "$totalEarnedPht" } } }]),
    User.find().select("name email country memberLevel createdAt totalEarnedPht").sort({ createdAt: -1 }).limit(8).lean(),
    Transaction.aggregate([
      { $match: { createdAt: { $gte: start }, type: "earning" } },
      { $group: { _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, status: "$status" }, amount: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { "_id.day": 1 } },
    ]),
    AuditLog.find().populate("actorId", "name email").sort({ createdAt: -1 }).limit(8).lean(),
  ]);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start); date.setDate(date.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    const rows = daily.filter((row) => row._id.day === key);
    return { date: key, approved: rows.find((row) => row._id.status === "approved")?.amount || 0, pending: rows.find((row) => row._id.status === "pending")?.amount || 0, count: rows.reduce((sum, row) => sum + row.count, 0) };
  });
  return NextResponse.json({ users, activeUsers, minijobs, pending: pendingProofs, pendingPayments, balances: balances[0] || { availablePht: 0, pendingPht: 0, paidPht: 0 }, recentUsers, daily: days, audit });
}
