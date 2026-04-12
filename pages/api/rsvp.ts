import type { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";

type Body = {
  fullName: string;
  attending: "yes" | "no";
  guests: number;
  note?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const body = req.body as Body;
  if (!body?.fullName || (body.attending !== "yes" && body.attending !== "no")) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const attending = body.attending === "yes";
  const guests = attending ? Math.max(1, Number(body.guests || 1)) : 0;

  await sql`
    INSERT INTO rsvps (full_name, attending, guests, note)
    VALUES (${body.fullName.trim()}, ${attending}, ${guests}, ${body.note ?? ""})
  `;

  return res.status(200).json({ ok: true });
}