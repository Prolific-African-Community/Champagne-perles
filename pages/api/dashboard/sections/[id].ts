import type { NextApiRequest, NextApiResponse } from "next";
import {
  handleApiError,
  isUuid,
  methodNotAllowed,
  requireDashboardAccess,
  routeParam,
} from "../../../../lib/dashboard-api";
import { sql } from "../../../../lib/dashboard-db";

type Response = { ok: true } | { message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
): Promise<void> {
  if (!requireDashboardAccess(req, res)) return;

  const id = routeParam(req.query.id);
  if (!isUuid(id)) {
    res.status(400).json({ message: "Identifiant de section invalide." });
    return;
  }

  try {
    if (req.method === "PATCH") {
      const body = (req.body ?? {}) as { title?: unknown };
      if (typeof body.title !== "string") {
        res.status(400).json({ message: "Titre invalide." });
        return;
      }

      const result = await sql`
        UPDATE public.wedding_dashboard_sections
        SET title = ${body.title}, updated_at = now()
        WHERE id = ${id}
      `;

      if (result.rowCount === 0) {
        res.status(404).json({ message: "Section introuvable." });
        return;
      }

      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === "DELETE") {
      // Les lignes partent en cascade (FK ON DELETE CASCADE).
      await sql`DELETE FROM public.wedding_dashboard_sections WHERE id = ${id}`;
      res.status(200).json({ ok: true });
      return;
    }

    methodNotAllowed(res, ["PATCH", "DELETE"]);
  } catch (error) {
    handleApiError(res, error);
  }
}
