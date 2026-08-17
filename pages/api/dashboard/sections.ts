import type { NextApiRequest, NextApiResponse } from "next";
import {
  handleApiError,
  methodNotAllowed,
  requireDashboardAccess,
} from "../../../lib/dashboard-api";
import { withDb } from "../../../lib/dashboard-db";
import { normalizeRowType } from "../../../lib/dashboard-types";
import type { Row, Section } from "../../../lib/dashboard-types";

type SectionRecord = { id: string; title: string };
type RowRecord = {
  id: string;
  section_id: string;
  label: string;
  type: string;
  value: string;
  /** numeric revient sous forme de chaîne avec node-postgres. */
  budget_amount: string | number | null;
  paid_amount: string | number | null;
};

/** numeric -> number, tolérant aux null et aux chaînes. */
function toNumber(value: string | number | null): number {
  if (value === null) return 0;
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

type Response = { sections: Section[] } | { section: Section } | { message: string };

/** Charge toutes les sections avec leurs lignes, dans l'ordre d'affichage. */
export async function loadSections(): Promise<Section[]> {
  // Les deux requêtes partagent la même connexion.
  const { sectionsResult, rowsResult } = await withDb(async (run) => ({
    sectionsResult: await run<SectionRecord>`
      SELECT id, title
      FROM public.wedding_dashboard_sections
      ORDER BY position ASC, created_at ASC
    `,
    rowsResult: await run<RowRecord>`
      SELECT id, section_id, label, type, value, budget_amount, paid_amount
      FROM public.wedding_dashboard_rows
      ORDER BY position ASC, created_at ASC
    `,
  }));

  const rowsBySection = new Map<string, Row[]>();
  for (const record of rowsResult.rows) {
    const list = rowsBySection.get(record.section_id) ?? [];
    list.push({
      id: record.id,
      label: record.label,
      // Les lignes legacy "amount" sont exposées comme "budget".
      type: normalizeRowType(record.type),
      value: record.value,
      budgetAmount: toNumber(record.budget_amount),
      paidAmount: toNumber(record.paid_amount),
    });
    rowsBySection.set(record.section_id, list);
  }

  return sectionsResult.rows.map((section) => ({
    id: section.id,
    title: section.title,
    rows: rowsBySection.get(section.id) ?? [],
  }));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
): Promise<void> {
  if (!requireDashboardAccess(req, res)) return;

  try {
    if (req.method === "GET") {
      res.status(200).json({ sections: await loadSections() });
      return;
    }

    if (req.method === "POST") {
      const body = (req.body ?? {}) as { title?: unknown };
      const title =
        typeof body.title === "string" && body.title.trim()
          ? body.title.trim()
          : "Nouvelle section";

      // Section + première ligne sur la même connexion.
      const created = await withDb(async (run) => {
        const inserted = await run<SectionRecord>`
          INSERT INTO public.wedding_dashboard_sections (title, position)
          VALUES (
            ${title},
            COALESCE((SELECT MAX(position) + 1 FROM public.wedding_dashboard_sections), 0)
          )
          RETURNING id, title
        `;

        const section = inserted.rows[0];
        if (!section) return null;

        // Une première ligne pour que la section soit immédiatement utilisable.
        const firstRow = await run<{ id: string }>`
          INSERT INTO public.wedding_dashboard_rows
            (section_id, label, type, value, budget_amount, paid_amount, position)
          VALUES (${section.id}, ${""}, ${"budget"}, ${""}, 0, 0, 0)
          RETURNING id
        `;

        return { section, rowId: firstRow.rows[0]?.id ?? "" };
      });

      if (!created) {
        res.status(500).json({ message: "Création de la section impossible." });
        return;
      }

      res.status(201).json({
        section: {
          id: created.section.id,
          title: created.section.title,
          rows: created.rowId
            ? [
                {
                  id: created.rowId,
                  label: "",
                  type: "budget",
                  value: "",
                  budgetAmount: 0,
                  paidAmount: 0,
                },
              ]
            : [],
        },
      });
      return;
    }

    methodNotAllowed(res, ["GET", "POST"]);
  } catch (error) {
    handleApiError(res, error);
  }
}
