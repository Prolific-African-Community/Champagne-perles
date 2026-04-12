import type { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";

type Body = {
  fullName?: string;
  attending?: "yes" | "no";
  guests?: number;
  note?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const body = req.body as Body;

    const fullName = (body.fullName ?? "").trim();
    const attending = body.attending;
    const guests = Number(body.guests ?? 1);
    const note = (body.note ?? "").trim();

    if (!fullName) return res.status(400).json({ message: "Missing fullName" });
    if (attending !== "yes" && attending !== "no") {
      return res.status(400).json({ message: "Invalid attending value" });
    }

    const attendingBool = attending === "yes";
    const guestsFinal = attendingBool ? Math.max(1, guests) : 0;

    // IMPORTANT: colonne = full_name (pas fullName)
    await sql`
      INSERT INTO public.rsvps (full_name, attending, guests, note)
      VALUES (${fullName}, ${attendingBool}, ${guestsFinal}, ${note})
    `;

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("RSVP_ERROR:", e);
    return res.status(500).json({
      message: "DB insert failed",
      error: e?.message || "Unknown",
    });
  }
}
