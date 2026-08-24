import type { NextApiRequest, NextApiResponse } from "next";
import {
  isDashboardConfigured,
  MISSING_PASSWORD_MESSAGE,
  setSessionCookie,
  verifyPassword,
} from "../../../lib/dashboard-auth";

type LoginResponse = { ok: true } | { message: string };

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
): void {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ message: "Méthode non autorisée." });
    return;
  }

  if (!isDashboardConfigured()) {
    res.status(503).json({ message: MISSING_PASSWORD_MESSAGE });
    return;
  }

  const body = (req.body ?? {}) as { password?: unknown };
  const password = typeof body.password === "string" ? body.password : "";

  if (!password) {
    res.status(400).json({ message: "Mot de passe requis." });
    return;
  }

  if (!verifyPassword(password)) {
    res.status(401).json({ message: "Mot de passe incorrect." });
    return;
  }

  setSessionCookie(res);
  res.status(200).json({ ok: true });
}
