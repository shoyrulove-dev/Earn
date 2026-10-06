export async function sendVerificationEmail(email: string, token: string) {
  if (!process.env.RESEND_API_KEY) return false;
  const origin = process.env.NEXTAUTH_URL || "https://earn.blissbiovn.com";
  const link = `${origin}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Pure Earn <admin@blissbiovn.com>",
      to: [email],
      subject: "Verify your Pure Earn email",
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>Verify your Pure Earn email</h2><p>Confirm this email before your first withdrawal.</p><p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#8957f5;color:white;border-radius:10px;text-decoration:none">Verify email</a></p><p>This link expires in 24 hours.</p></div>`,
    }),
  });
  return response.ok;
}
