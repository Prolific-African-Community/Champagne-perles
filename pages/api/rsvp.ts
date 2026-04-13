// pages/api/rsvp.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient, createPool } from "@vercel/postgres";

type RSVPBody = {
  fullName?: string;

  // Nouveau (Option B)
  plusOneName?: string;
  childrenCount?: number;

  // Ancien (on garde pour compatibilité, mais on n’en dépend plus)
  attending?: "yes" | "no";
  guests?: number;
  note?: string;
};

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function validate(body: RSVPBody) {
  const fullName = (body.fullName ?? "").trim();
  if (!fullName) return { ok: false as const, status: 400, message: "Missing fullName" };

  const fullNameNorm = normalizeName(fullName);

  const plusOneName = (body.plusOneName ?? "").trim() || null;
  const childrenCount = clampInt(Number(body.childrenCount ?? 0), 0, 10);

  // On considère "présent" par défaut (puisque tu veux retirer le champ présence)
  const attendingBool = body.attending === "no" ? false : true;

  // guests = 0 si non présent, sinon :
  // - si nouveaux champs utilisés => 1 + (+1?) + enfants
  // - sinon fallback sur guests si fourni
  let guestsFinal = 0;

  if (attendingBool) {
    const usingNewFields = body.plusOneName !== undefined || body.childrenCount !== undefined;

    if (usingNewFields) {
      guestsFinal = 1 + (plusOneName ? 1 : 0) + childrenCount;
    } else {
      const g = clampInt(Number(body.guests ?? 1), 1, 20);
      guestsFinal = g;
    }
  }

  return {
    ok: true as const,
    fullName,
    fullNameNorm,
    attendingBool,
    guestsFinal,
    plusOneName,
    childrenCount: attendingBool ? childrenCount : 0,
  };
}

async function upsertRSVP(
  sqlRunner: <T = any>(strings: TemplateStringsArray, ...values: any[]) => Promise<{ rows: T[] }>,
  data: {
    fullName: string;
    fullNameNorm: string;
    attendingBool: boolean;
    guestsFinal: number;
    plusOneName: string | null;
    childrenCount: number;
  }
) {
  const result = await sqlRunner<{ inserted: boolean }>`
    INSERT INTO public.rsvps (
      full_name, full_name_norm, attending, guests, note,
      plus_one_name, children_count,
      updated_at
    )
    VALUES (
      ${data.fullName}, ${data.fullNameNorm}, ${data.attendingBool}, ${data.guestsFinal}, ${null},
      ${data.plusOneName}, ${data.childrenCount},
      now()
    )
    ON CONFLICT (full_name_norm)
    DO UPDATE SET
      full_name = EXCLUDED.full_name,
      attending = EXCLUDED.attending,
      guests = EXCLUDED.guests,
      note = NULL,
      plus_one_name = EXCLUDED.plus_one_name,
      children_count = EXCLUDED.children_count,
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
    return res.status(500).json({
      message: "DB insert failed",
      error: "Missing RSVP_POSTGRES_URL or RSVP_POSTGRES_URL_NON_POOLING",
    });
  }

  const parsed = validate(req.body as RSVPBody);
  if (!parsed.ok) return res.status(parsed.status).json({ message: parsed.message });

  try {
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

    const pool = createPool({ connectionString: pooled });
    const action = await upsertRSVP(pool.sql.bind(pool), parsed);
    return res.status(200).json({ ok: true, action });
  } catch (e: any) {
    return res.status(500).json({ message: "DB insert failed", error: e?.message || "Unknown" });
  }
}
