import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const { to, subject, hospitalList, shareUrl } = await req.json();

    const html = `
      <div style="font-family: DM Sans, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
        <h2 style="color: #e0184d;">Hospital List from Carefinder</h2>
        <p style="color: #555; font-size: 14px;">Someone shared this list of hospitals with you:</p>
        <pre style="background: #fff0f3; padding: 16px; border-radius: 8px; font-size: 13px; line-height: 1.8; white-space: pre-wrap;">${hospitalList}</pre>
        <p style="margin-top: 24px;">
          <a href="${shareUrl}" style="background: #e0184d; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">
            View on Carefinder
          </a>
        </p>
        <p style="color: #aaa; font-size: 11px; margin-top: 32px;">Sent via Carefinder — Nigeria's Hospital Directory</p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Carefinder <noreply@yourdomain.com>",
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) throw new Error("Resend error");

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
