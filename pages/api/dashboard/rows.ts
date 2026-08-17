import type { NextApiRequest, NextApiResponse } from "next";
import {
  handleApiError,
  isUuid,
  methodNotAllowed,
  requireDashboardAccess,
} from "../../../lib/dashboard-api";
import { sql } from "../../../lib/dashboard-db";
import { isRowType } from "../../../lib/dashboard-types";
import type { Row } from "../../../lib/dashboard-types";

type Response = { row: Row } | { message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
): Promise<void> {
  if (!requireDashboardAccess(req, res)) return;

  if (req.method !== "POST") {
    methodNotAllowed(res, ["POST"]);
    return;
  }

  const body = (req.body ?? {}) as {
    sectionId?: unknown;
    label?: unknown;
    type?: unknown;
  };

  const sectionId = typeof body.sectionId === "string" ? body.sectionId : "";
  if (!isUuid(sectionId)) {
    res.status(400).json({ message: "Identifiant de section invalide." });
    return;
  }

  const label = typeof body.label === "string" ? body.label : "";
  const type = isRowType(body.type) ? body.type : "budget";

  try {
    const inserted = await sql<{ id: string }>`
      INSERT INTO public.wedding_dashboard_rows
        (section_id, label, type, value, budget_amount, paid_amount, position)
      SELECT
        ${sectionId},
        ${label},
        ${type},
        ${""},
        0,
        0,
        COALESCE(
          (SELECT MAX(position) + 1
           FROM public.wedding_dashboard_rows
           WHERE section_id = ${sectionId}),
          0
        )
      WHERE EXISTS (
        SELECT 1 FROM public.wedding_dashboard_sections WHERE id = ${sectionId}
      )
      RETURNING id
    `;

    const created = inserted.rows[0];
    if (!created) {
      res.status(404).json({ message: "Section introuvable." });
      return;
    }

    res.status(201).json({
      row: { id: created.id, label, type, value: "", budgetAmount: 0, paidAmount: 0 },
    });
  } catch (error) {
    handleApiError(res, error);
  }
}
