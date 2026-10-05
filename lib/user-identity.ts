import User from "@/models/User";

function slug(value?: string | null) {
  return String(value || "member").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 14) || "member";
}
function token(size = 6) { return Math.random().toString(36).slice(2, 2 + size).toUpperCase(); }

export async function ensureUserIdentity(user: { _id: unknown; name?: string; email?: string; username?: string; userId?: string; referralCode?: string }) {
  const changes: Record<string, string> = {};
  if (!user.userId) for (let i = 0; i < 8; i++) { const value = `PE-${token(8)}`; if (!await User.exists({ userId: value })) { changes.userId = value; break; } }
  if (!user.referralCode) for (let i = 0; i < 8; i++) { const value = `PE${token(6)}`; if (!await User.exists({ referralCode: value })) { changes.referralCode = value; break; } }
  if (!user.username) { const base = slug(user.name || user.email?.split("@")[0]); for (let i = 0; i < 8; i++) { const value = `${base}${Math.floor(1000 + Math.random() * 9000)}`.slice(0, 24); if (!await User.exists({ username: value })) { changes.username = value; break; } } }
  if (Object.keys(changes).length) await User.updateOne({ _id: user._id }, { $set: changes });
  return changes;
}
