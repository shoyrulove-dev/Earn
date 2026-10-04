import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
export const authOptions: NextAuthOptions = { providers: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })] : [], callbacks: { async signIn({ user }) { if (!user.email) return false; await connectDB(); await User.findOneAndUpdate({ email: user.email.toLowerCase() }, { $set: { name: user.name, image: user.image }, $setOnInsert: { email: user.email.toLowerCase() } }, { upsert: true, new: true }); return true; }, async session({ session }) { if (session.user?.email) { await connectDB(); const dbUser = await User.findOne({ email: session.user.email.toLowerCase() }).lean() as { _id: unknown; role?: string } | null; if (dbUser) { session.user.id = String(dbUser._id); (session.user as typeof session.user & { role?: string }).role = dbUser.role; } } return session; } } };
export const getAuthSession = () => getServerSession(authOptions);
