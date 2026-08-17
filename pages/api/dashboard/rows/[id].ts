import type { NextApiRequest, NextApiResponse } from "next";
import {
  handleApiError,
  isUuid,
  methodNotAllowed,
  requireDashboardAccess,
  routeParam,
} from "../../../../lib/dashboard-api";
import { sql } from "../../../../lib/dashboard-db";
import { isRowType } from "../../../../lib/dashboard-types";

type Response = { ok: true } | { message: string };

/**
 * Montant accepté : number ou chaîne numérique. Renvoie null si le champ n'est
 * pas fourni (=> COALESCE conserve la valeur en base) et 0 si la saisie est
 * vide ou invalide.
 */
function toAmount(value: unknown): number | null {
  if (value === undefined || value === null) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    if (!value.trim()) return 0;
    const n = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
): Promise<void> {
  if (!requireDashboardAccess(req, res)) return;

  const id = routeParam(req.query.id);
  if (!isUuid(id)) {
    res.status(400).json({ message: "Identifiant de ligne invalide." });
    return;
  }

  try {
    if (req.method === "PATCH") {
      const body = (req.body ?? {}) as {
        label?: unknown;
        type?: unknown;
        value?: unknown;
        budgetAmount?: unknown;
        paidAmount?: unknown;
      };

      const label = typeof body.label === "string" ? body.label : null;
      const type = isRowType(body.type) ? body.type : null;
      const value = typeof body.value === "string" ? body.value : null;
      const budgetAmount = toAmount(body.budgetAmount);
      const paidAmount = toAmount(body.paidAmount);

      if (
        label === null &&
        type === null &&
        value === null &&
        budgetAmount === null &&
        paidAmount === null
      ) {
        res.status(400).json({ message: "Aucun champ à mettre à jour." });
        return;
      }

      // COALESCE : seuls les champs fournis sont écrasés.
      const result = await sql`
        UPDATE public.wedding_dashboard_rows
        SET label         = COALESCE(${label}, label),
            type          = COALESCE(${type}, type),
            value         = COALESCE(${value}, value),
            budget_amount = COALESCE(${budgetAmount}, budget_amount),
            paid_amount   = COALESCE(${paidAmount}, paid_amount),
            updated_at    = now()
        WHERE id = ${id}
      `;

      if (result.rowCount === 0) {
        res.status(404).json({ message: "Ligne introuvable." });
        return;
      }

      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === "DELETE") {
      await sql`DELETE FROM public.wedding_dashboard_rows WHERE id = ${id}`;
      res.status(200).json({ ok: true });
      return;
    }

    methodNotAllowed(res, ["PATCH", "DELETE"]);
  } catch (error) {
    handleApiError(res, error);
  }
}
