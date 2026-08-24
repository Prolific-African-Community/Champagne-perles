import crypto from "crypto";
import type { IncomingMessage, ServerResponse } from "http";

/**
 * Session dashboard : cookie httpOnly signé HMAC-SHA256.
 * Aucune dépendance externe, aucun secret exposé côté client.
 */

export const DASHBOARD_COOKIE = "cp_dashboard_session";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 jours
const TOKEN_VERSION = "v1";

export const MISSING_PASSWORD_MESSAGE =
  "Accès impossible : DASHBOARD_PASSWORD n'est pas configuré sur le serveur. Ajoutez-le dans .env.local (puis dans les variables d'environnement Vercel).";

function getPassword(): string {
  return process.env.DASHBOARD_PASSWORD || "";
}

/**
 * Secret de signature. Retombe sur le mot de passe si DASHBOARD_SESSION_SECRET
 * n'est pas défini : les sessions restent signées, et changer le mot de passe
 * invalide automatiquement les sessions existantes.
 */
function getSecret(): string {
  return process.env.DASHBOARD_SESSION_SECRET || getPassword();
}

export function isDashboardConfigured(): boolean {
  return getPassword().length > 0;
}

/** Comparaison à temps constant, sûre même si les longueurs diffèrent. */
function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a, "utf8").digest();
  const hb = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function verifyPassword(candidate: string): boolean {
  const expected = getPassword();
  if (!expected) return false;
  return safeEqual(candidate, expected);
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload, "utf8")
    .digest("hex");
}

function createToken(): string {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${TOKEN_VERSION}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

function isValidToken(token: string): boolean {
  if (!isDashboardConfigured()) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [version, expiresRaw, signature] = parts;
  if (version !== TOKEN_VERSION) return false;

  const expiresAt = Number.parseInt(expiresRaw, 10);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return safeEqual(signature, sign(`${version}.${expiresRaw}`));
}

type RequestWithCookies = IncomingMessage & {
  cookies?: Partial<Record<string, string>>;
};

/** Next 12 fournit req.cookies déjà parsé (API routes et getServerSideProps). */
function readCookie(req: RequestWithCookies, name: string): string {
  const fromNext = req.cookies ? req.cookies[name] : undefined;
  if (typeof fromNext === "string") return fromNext;

  const header = req.headers.cookie;
  if (!header) return "";

  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }

  return "";
}

export function isAuthenticated(req: RequestWithCookies): boolean {
  return isValidToken(readCookie(req, DASHBOARD_COOKIE));
}

function serializeCookie(value: string, maxAge: number): string {
  const attributes = [
    `${DASHBOARD_COOKIE}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];

  if (process.env.NODE_ENV === "production") attributes.push("Secure");

  return attributes.join("; ");
}

export function setSessionCookie(res: ServerResponse): void {
  res.setHeader("Set-Cookie", serializeCookie(createToken(), MAX_AGE_SECONDS));
}

export function clearSessionCookie(res: ServerResponse): void {
  res.setHeader("Set-Cookie", serializeCookie("", 0));
}
