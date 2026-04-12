// pages/api/rsvp.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@vercel/postgres";

type RSVPBody = {
  fullName?: string;
  attending?: "yes" | "no";
  guests?: number;
  note?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const connectionString = process.env.RSVP_POSTGRES_URL;
  if (!connectionString) {
    return res.status(500).json({
      message: "Missing RSVP_POSTGRES_URL env var",
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
    const guestsFinal = attendingBool ? Math.max(1, guestsRaw || 1) : 0;

    const client = createClient({ connectionString });

    try {
      await client.connect();

      await client.sql`
        INSERT INTO public.rsvps (full_name, attending, guests, note)
        VALUES (${fullName}, ${attendingBool}, ${guestsFinal}, ${note || null})
      `;

      return res.status(200).json({ ok: true });
    } finally {
      // Ensure connection is closed even if insert fails
      await client.end().catch(() => null);
    }
  } catch (e: any) {
    console.error("RSVP_ERROR:", e);
    return res.status(500).json({
      message: "DB insert failed",
      error: e?.message || "Unknown",
    });
  }
}
