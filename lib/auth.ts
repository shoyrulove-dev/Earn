import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";

export const authOptions: NextAuthOptions = {
  providers: [CredentialsProvider({ name: "Email and password", credentials: { email: {}, password: {} }, async authorize(credentials) { if (!credentials?.email || !credentials.password) return null; await connectDB(); const user = await User.findOne({ email: credentials.email.toLowerCase() }).lean() as { _id: unknown; email: string; name?: string; image?: string; passwordHash?: string; role?: string } | null; if (!user?.passwordHash || !await bcrypt.compare(credentials.password, user.passwordHash)) return null; return { id: String(user._id), email: user.email, name: user.name, image: user.image, role: user.role } as never; } }), ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })] : [])],
  callbacks: { async signIn({ user }) { if (!user.email) return false; await connectDB(); const email = user.email.toLowerCase(); const admin = process.env.ADMIN_EMAIL?.toLowerCase() === email; await User.findOneAndUpdate({ email }, { $set: { name: user.name, image: user.image, ...(admin ? { role: "admin" } : {}) }, $setOnInsert: { email } }, { upsert: true, new: true }); return true; }, async session({ session }) { if (session.user?.email) { await connectDB(); const dbUser = await User.findOne({ email: session.user.email.toLowerCase() }).lean() as { _id: unknown; role?: string } | null; if (dbUser) { session.user.id = String(dbUser._id); (session.user as typeof session.user & { role?: string }).role = dbUser.role; } } return session; } }
};
export const getAuthSession = () => getServerSession(authOptions);
