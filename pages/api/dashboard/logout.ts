import type { NextApiRequest, NextApiResponse } from "next";
import { clearSessionCookie } from "../../../lib/dashboard-auth";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ ok: true } | { message: string }>
): void {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ message: "Méthode non autorisée." });
    return;
  }

  clearSessionCookie(res);
  res.status(200).json({ ok: true });
}
