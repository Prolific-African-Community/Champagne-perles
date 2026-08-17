/** Types partagés entre les routes API du dashboard et la page client. */

/**
 * Types de ligne.
 *  - "text"   : libellé + valeur libre (contact, notes…)
 *  - "budget" : libellé + budget prévu + montant payé (reste calculé)
 *
 * L'ancien type "amount" reste toléré en base (lignes legacy) mais il est
 * normalisé en "budget" dès la lecture — voir normalizeRowType().
 */
export type RowType = "text" | "budget";

export type Row = {
  id: string;
  label: string;
  type: RowType;
  /** Valeur libre, utilisée uniquement par les lignes "text". */
  value: string;
  /** Budget prévu, utilisé uniquement par les lignes "budget". */
  budgetAmount: number;
  /** Déjà payé, utilisé uniquement par les lignes "budget". */
  paidAmount: number;
};

export type Section = {
  id: string;
  title: string;
  rows: Row[];
};

export type RSVPEntry = {
  fullName: string;
  plusOneName: string | null;
  childrenCount: number;
  guests: number;
  updatedAt: string;
  createdAt: string;
};

export function isRowType(value: unknown): value is RowType {
  return value === "text" || value === "budget";
}

/** Tolère les lignes legacy type = "amount" en les traitant comme "budget". */
export function normalizeRowType(value: unknown): RowType {
  return value === "text" ? "text" : "budget";
}

/* ---------------------------- Totaux ----------------------------- */

export type Totals = {
  budget: number;
  paid: number;
  /** Reste à payer, jamais négatif. */
  remaining: number;
  /** Surplus payé au-delà du budget, 0 si aucun. */
  overpaid: number;
};

export function emptyTotals(): Totals {
  return { budget: 0, paid: 0, remaining: 0, overpaid: 0 };
}

function toSafeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function rowTotals(row: Row): Totals {
  if (row.type !== "budget") return emptyTotals();

  const budget = toSafeNumber(row.budgetAmount);
  const paid = toSafeNumber(row.paidAmount);

  return {
    budget,
    paid,
    remaining: Math.max(budget - paid, 0),
    overpaid: Math.max(paid - budget, 0),
  };
}

/** Agrège les lignes budget d'une section. */
export function sectionTotals(section: Section): Totals {
  return sumTotals(section.rows.map(rowTotals));
}

/** Agrège plusieurs sections. */
export function globalTotals(sections: Section[]): Totals {
  return sumTotals(sections.map(sectionTotals));
}

/**
 * Somme les budgets et les paiements, puis recalcule reste/surplus sur les
 * agrégats — pour qu'un dépassement sur une ligne ne masque pas le reste à
 * payer d'une autre.
 */
function sumTotals(parts: Totals[]): Totals {
  let budget = 0;
  let paid = 0;

  for (const part of parts) {
    budget += part.budget;
    paid += part.paid;
  }

  return {
    budget,
    paid,
    remaining: Math.max(budget - paid, 0),
    overpaid: Math.max(paid - budget, 0),
  };
}

export function countBudgetRows(sections: Section[]): number {
  return sections.reduce(
    (n, section) => n + section.rows.filter((r) => r.type === "budget").length,
    0
  );
}
