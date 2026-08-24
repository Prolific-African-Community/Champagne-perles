import type { NextApiRequest, NextApiResponse } from "next";
import {
  handleApiError,
  methodNotAllowed,
  requireDashboardAccess,
} from "../../../lib/dashboard-api";
import { sql } from "../../../lib/dashboard-db";
import type { RSVPEntry } from "../../../lib/dashboard-types";

/**
 * Lecture seule des RSVP existants.
 *
 * Utilise le helper DB commun (même résolution d'URL que les routes sections et
 * rows) : dashboard et RSVP partagent ainsi la même base Neon.
 *
 * La table lue est celle du formulaire public, public.rsvps. Aucune écriture,
 * aucune création de table, aucune migration : pages/api/rsvp.ts n'est pas impacté.
 */

type RSVPRecord = {
  created_at: string | Date;
  updated_at: string | Date;
  full_name: string;
  plus_one_name: string | null;
  children_count: number | null;
  guests: number | null;
};

type Response = { rsvps: RSVPEntry[] } | { message: string };

function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
): Promise<void> {
  if (!requireDashboardAccess(req, res)) return;

  if (req.method !== "GET") {
    methodNotAllowed(res, ["GET"]);
    return;
  }

  try {
    const result = await sql<RSVPRecord>`
      SELECT created_at, updated_at, full_name, plus_one_name, children_count, guests
      FROM public.rsvps
      ORDER BY updated_at DESC
    `;

    const rsvps: RSVPEntry[] = result.rows.map((row) => ({
      fullName: row.full_name,
      plusOneName: row.plus_one_name,
      childrenCount: row.children_count ?? 0,
      guests: row.guests ?? 0,
      updatedAt: toIso(row.updated_at),
      createdAt: toIso(row.created_at),
    }));

    res.status(200).json({ rsvps });
  } catch (error) {
    // 42P01 = table absente : liste vide plutôt qu'une 500 opaque.
    const code = (error as { code?: string } | null)?.code;
    if (code === "42P01") {
      res.status(200).json({ rsvps: [] });
      return;
    }
    handleApiError(res, error);
  }
}
