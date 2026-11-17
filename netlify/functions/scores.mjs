import { getStore } from "@netlify/blobs";

const MAX_CPS = 30;          // mehr schafft kein Mensch – alles darüber gilt als Schummeln
const MAX_CLICKS = 10_000_000;

const json = (data, status = 200, season = "") =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Season": String(season) },
  });

export async function getSeason() {
  const meta = getStore({ name: "meta", consistency: "strong" });
  return (await meta.get("season")) || "1";
}

async function allScores(store) {
  const { blobs } = await store.list();
  const rows = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
  return rows
    .filter(Boolean)
    .map(({ id, name, maxCps, clicks }) => ({ id, name, maxCps, clicks }))
    .sort((a, b) => b.maxCps - a.maxCps || b.clicks - a.clicks)
    .slice(0, 100);
}

export default async (req) => {
  const store = getStore({ name: "scores", consistency: "strong" });

  const season = await getSeason();
  if (req.method === "GET") return json(await allScores(store), 200, season);

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }

    const id = String(body.id || "");
    const name = String(body.name || "").trim().slice(0, 24);
    const maxCps = Number(body.maxCps);
    const clicks = Number(body.clicks);

    // Alte Werte aus der Zeit vor einem Reset nicht mehr annehmen
    if (body.season != null && String(body.season) !== season) return json({ error: "season changed" }, 409, season);
    if (!/^[a-z0-9-]{8,40}$/.test(id)) return json({ error: "bad id" }, 400);
    if (!name) return json({ error: "name missing" }, 400);
    if (!Number.isFinite(maxCps) || maxCps < 0 || maxCps > MAX_CPS) return json({ error: "bad cps" }, 400);
    if (!Number.isInteger(clicks) || clicks < 0 || clicks > MAX_CLICKS) return json({ error: "bad clicks" }, 400);

    const old = (await store.get(id, { type: "json" })) || {};
    await store.setJSON(id, {
      id,
      name,
      maxCps: Math.max(old.maxCps || 0, Math.round(maxCps * 10) / 10),
      clicks: Math.max(old.clicks || 0, clicks),
      at: new Date().toISOString(),
    });
    return json(await allScores(store), 200, season);
  }

  return json({ error: "method not allowed" }, 405, season);
};

export const config = { path: "/api/scores" };
