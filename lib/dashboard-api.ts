import type { NextApiRequest, NextApiResponse } from "next";
import {
  isAuthenticated,
  isDashboardConfigured,
  MISSING_PASSWORD_MESSAGE,
} from "./dashboard-auth";
import { DashboardDbError, hasDashboardDb, MISSING_DB_MESSAGE } from "./dashboard-db";

export type ApiError = { message: string };

/**
 * Garde commune aux routes /api/dashboard/* :
 * vérifie la configuration serveur puis la session.
 * Retourne false si la réponse a déjà été envoyée.
 */
export function requireDashboardAccess(
  req: NextApiRequest,
  res: NextApiResponse<ApiError>
): boolean {
  if (!isDashboardConfigured()) {
    res.status(503).json({ message: MISSING_PASSWORD_MESSAGE });
    return false;
  }

  if (!isAuthenticated(req)) {
    res.status(401).json({ message: "Session expirée. Reconnectez-vous." });
    return false;
  }

  if (!hasDashboardDb()) {
    res.status(503).json({ message: MISSING_DB_MESSAGE });
    return false;
  }

  return true;
}

export function methodNotAllowed(
  res: NextApiResponse<ApiError>,
  allowed: string[]
): void {
  res.setHeader("Allow", allowed.join(", "));
  res.status(405).json({ message: "Méthode non autorisée." });
}

/** Journalise le détail côté serveur, renvoie un message neutre au client. */
export function handleApiError(res: NextApiResponse<ApiError>, error: unknown): void {
  if (error instanceof DashboardDbError) {
    res.status(503).json({ message: error.message });
    return;
  }

  // 42P01 = relation inexistante. Le schéma n'est plus créé automatiquement :
  // on indique explicitement quoi exécuter.
  if ((error as { code?: string } | null)?.code === "42P01") {
    res.status(503).json({
      message:
        "Tables du dashboard absentes. Exécutez scripts/dashboard-schema.sql dans Neon.",
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.error("[dashboard api]", error);
  res.status(500).json({
    message: "Erreur base de données. Vérifiez la configuration et réessayez.",
  });
}

/** Récupère un paramètre de route sous forme de chaîne simple. */
export function routeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
