// pages/api/rsvp.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient, createPool } from "@vercel/postgres";

type RSVPBody = {
  fullName?: string;
  attending?: "yes" | "no";
  guests?: number;
  note?: string;
};

function parseBody(body: RSVPBody) {
  const fullName = (body.fullName ?? "").trim();
  const attending = body.attending;
  const guestsRaw = Number(body.guests ?? 1);
  const note = (body.note ?? "").trim();

  if (!fullName) return { ok: false as const, status: 400, message: "Missing fullName" };
  if (attending !== "yes" && attending !== "no") {
    return { ok: false as const, status: 400, message: "Invalid attending value" };
  }

  const attendingBool = attending === "yes";
  const guestsFinal = attendingBool ? Math.max(1, Number.isFinite(guestsRaw) ? guestsRaw : 1) : 0;

  return {
    ok: true as const,
    fullName,
    attendingBool,
    guestsFinal,
    note: note || null,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const nonPooling = process.env.RSVP_POSTGRES_URL_NON_POOLING || "";
  const pooled = process.env.RSVP_POSTGRES_URL || "";

  // Healthcheck
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      mode: nonPooling ? "non_pooling(createClient)" : pooled ? "pooling(createPool)" : "missing",
      hasNonPooling: Boolean(nonPooling),
      hasPooled: Boolean(pooled),
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (!nonPooling && !pooled) {
    return res.status(500).json({
      message: "DB insert failed",
      error: "Missing RSVP_POSTGRES_URL or RSVP_POSTGRES_URL_NON_POOLING",
    });
  }

  try {
    const parsed = parseBody(req.body as RSVPBody);
    if (!parsed.ok) return res.status(parsed.status).json({ message: parsed.message });

    // Prefer NON_POOLING with createClient (direct connection)
    if (nonPooling) {
      const client = createClient({ connectionString: nonPooling });
      try {
        await client.connect();
        await client.sql`
          INSERT INTO public.rsvps (full_name, attending, guests, note)
          VALUES (${parsed.fullName}, ${parsed.attendingBool}, ${parsed.guestsFinal}, ${parsed.note})
        `;
      } finally {
        await client.end().catch(() => null);
      }

      return res.status(200).json({ ok: true });
    }

    // Otherwise use pooled URL with createPool
    const pool = createPool({ connectionString: pooled });
    await pool.sql`
      INSERT INTO public.rsvps (full_name, attending, guests, note)
      VALUES (${parsed.fullName}, ${parsed.attendingBool}, ${parsed.guestsFinal}, ${parsed.note})
    `;

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({
      message: "DB insert failed",
      error: e?.message || "Unknown",
    });
  }
}
