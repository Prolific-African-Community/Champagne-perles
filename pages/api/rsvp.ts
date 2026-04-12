// pages/api/rsvp.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient, createPool } from "@vercel/postgres";

type RSVPBody = {
  fullName?: string;
  attending?: "yes" | "no";
  guests?: number;
  note?: string;
};

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function validate(body: RSVPBody) {
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
    fullNameNorm: normalizeName(fullName),
    attendingBool,
    guestsFinal,
    note: note || null,
  };
}

async function upsertRSVP(
  sqlRunner: <T = any>(strings: TemplateStringsArray, ...values: any[]) => Promise<{ rows: T[] }>,
  data: { fullName: string; fullNameNorm: string; attendingBool: boolean; guestsFinal: number; note: string | null }
) {
  const result = await sqlRunner<{ inserted: boolean }>`
    INSERT INTO public.rsvps (full_name, full_name_norm, attending, guests, note, updated_at)
    VALUES (${data.fullName}, ${data.fullNameNorm}, ${data.attendingBool}, ${data.guestsFinal}, ${data.note}, now())
    ON CONFLICT (full_name_norm)
    DO UPDATE SET
      full_name = EXCLUDED.full_name,
      attending = EXCLUDED.attending,
      guests = EXCLUDED.guests,
      note = EXCLUDED.note,
      updated_at = now()
    RETURNING (xmax = 0) AS inserted
  `;
  return result.rows[0]?.inserted ? "created" : "updated";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const nonPooling = process.env.RSVP_POSTGRES_URL_NON_POOLING || "";
  const pooled = process.env.RSVP_POSTGRES_URL || "";

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      mode: nonPooling ? "non_pooling(createClient)" : pooled ? "pooling(createPool)" : "missing",
      hasNonPooling: Boolean(nonPooling),
      hasPooled: Boolean(pooled),
    });
  }

  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  if (!nonPooling && !pooled) {
    return res.status(500).json({ message: "DB insert failed", error: "Missing RSVP_POSTGRES_URL or RSVP_POSTGRES_URL_NON_POOLING" });
  }

  const parsed = validate(req.body as RSVPBody);
  if (!parsed.ok) return res.status(parsed.status).json({ message: parsed.message });

  try {
    // Direct connection (NON_POOLING)
    if (nonPooling) {
      const client = createClient({ connectionString: nonPooling });
      try {
        await client.connect();
        const action = await upsertRSVP(client.sql.bind(client), parsed);
        return res.status(200).json({ ok: true, action });
      } finally {
        await client.end().catch(() => null);
      }
    }

    // Pooled connection
    const pool = createPool({ connectionString: pooled });
    const action = await upsertRSVP(pool.sql.bind(pool), parsed);
    return res.status(200).json({ ok: true, action });
  } catch (e: any) {
    return res.status(500).json({ message: "DB insert failed", error: e?.message || "Unknown" });
  }
}
