import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "admin") redirect("/admin-login");
  return children;
}
