import { getStore } from "@netlify/blobs";

// Rangliste zurücksetzen: https://DEINE-ADRESSE.netlify.app/api/reset?key=DEIN-PASSWORT
// Das Passwort steht in Netlify unter Project configuration → Environment variables → RESET_KEY.
export default async (req) => {
  const key = new URL(req.url).searchParams.get("key") || "";
  const secret = Netlify.env.get("RESET_KEY") || "";
  const html = (msg, status = 200) =>
    new Response(`<!DOCTYPE html><meta charset="utf-8"><meta name="viewport" content="width=device-width">` +
      `<body style="background:#000;color:#fff;font:20px system-ui;padding:40px;text-align:center">${msg}</body>`,
      { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });

  if (!secret) return html("Reset ist nicht eingerichtet: Umgebungsvariable RESET_KEY fehlt in Netlify.", 500);
  if (key !== secret) return html("Falsches Passwort.", 403);

  const scores = getStore({ name: "scores", consistency: "strong" });
  const { blobs } = await scores.list();
  await Promise.all(blobs.map((b) => scores.delete(b.key)));

  const meta = getStore({ name: "meta", consistency: "strong" });
  const season = String(Date.now());
  await meta.set("season", season);

  return html(`✅ Rangliste zurückgesetzt (${blobs.length} Einträge gelöscht).<br><br>` +
    `Alle Spieler starten beim nächsten Öffnen bei 0.`);
};

export const config = { path: "/api/reset" };
