// pages/api/rsvp.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createPool } from "@vercel/postgres";

/**
 * Uses a pooled connection string (recommended on Vercel).
 * Put your pooled URL in RSVP_POSTGRES_URL (as you already have).
 *
 * If later you prefer non-pooled, you can set RSVP_POSTGRES_URL_NON_POOLING
 * and the code will use it instead.
 */

type RSVPBody = {
  fullName?: string;
  attending?: "yes" | "no";
  guests?: number;
  note?: string;
};

// Prefer non-pooled if you have it, otherwise use pooled.
const CONNECTION_STRING =
  process.env.RSVP_POSTGRES_URL_NON_POOLING || process.env.RSVP_POSTGRES_URL || "";

// For pooled URLs, createPool is correct.
// (It also works fine with non-pooled URLs.)
const pool = createPool({ connectionString: CONNECTION_STRING });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Healthcheck / deployment verification
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      handler: "rsvp",
      mode: process.env.RSVP_POSTGRES_URL_NON_POOLING ? "non_pooling" : "pooling",
      hasConnectionString: Boolean(CONNECTION_STRING),
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (!CONNECTION_STRING) {
    return res.status(500).json({
      message: "DB insert failed",
      error: "Missing RSVP_POSTGRES_URL (or RSVP_POSTGRES_URL_NON_POOLING) env var",
    });
  }

  try {
    const body = req.body as RSVPBody;

    const fullName = (body.fullName ?? "").trim();
    const attending = body.attending;
    const guestsRaw = Number(body.guests ?? 1);
    const note = (body.note ?? "").trim();

    if (!fullName) return res.status(400).json({ message: "Missing fullName" });
    if (attending !== "yes" && attending !== "no") {
      return res.status(400).json({ message: "Invalid attending value" });
    }

    const attendingBool = attending === "yes";
    const guestsFinal = attendingBool ? Math.max(1, Number.isFinite(guestsRaw) ? guestsRaw : 1) : 0;

    await pool.sql`
      INSERT INTO public.rsvps (full_name, attending, guests, note)
      VALUES (${fullName}, ${attendingBool}, ${guestsFinal}, ${note || null})
    `;

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({
      message: "DB insert failed",
      error: e?.message || "Unknown",
    });
  }
}
