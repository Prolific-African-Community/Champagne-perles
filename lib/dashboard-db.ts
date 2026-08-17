import { createClient, createPool, VercelPool } from "@vercel/postgres";
import type { QueryResult, QueryResultRow } from "@vercel/postgres";

/**
 * Helper DB unique du dashboard mariage.
 *
 * Résolution de la chaîne de connexion, dans l'ordre :
 *  1. DATABASE_URL                     (optionnelle, recommandée)
 *  2. RSVP_POSTGRES_URL_NON_POOLING    (existant Vercel/Neon — non modifié)
 *  3. RSVP_DATABASE_URL_UNPOOLED       (existant Vercel/Neon — non modifié)
 *  4. RSVP_POSTGRES_PRISMA_URL         (existant Vercel/Neon — non modifié)
 *  5. RSVP_POSTGRES_URL                (existant Vercel/Neon — non modifié)
 *
 * Ce fallback garantit que le dashboard et le RSVP public restent sur la MÊME
 * base Neon sans avoir à créer de nouvelle variable ni de nouvelle base.
 *
 * @vercel/postgres impose le bon client selon le type d'URL :
 *   - URL poolée   (host en "-pooler.") -> createPool()
 *   - URL directe  (non poolée)         -> createClient()
 * Utiliser le mauvais des deux lève "invalid_connection_string". withDb()
 * choisit automatiquement, ce qui rend la configuration robuste quelle que
 * soit la variable qui a été résolue.
 */

export class DashboardDbError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DashboardDbError";
  }
}

export const MISSING_DB_MESSAGE =
  "Aucune URL PostgreSQL configurée. Ajoutez DATABASE_URL ou RSVP_POSTGRES_URL_NON_POOLING.";

export function getConnectionString(): string {
  return (
    process.env.DATABASE_URL ||
    process.env.RSVP_POSTGRES_URL_NON_POOLING ||
    process.env.RSVP_DATABASE_URL_UNPOOLED ||
    process.env.RSVP_POSTGRES_PRISMA_URL ||
    process.env.RSVP_POSTGRES_URL ||
    ""
  );
}

export function hasDashboardDb(): boolean {
  return getConnectionString().length > 0;
}

/** Même règle que @vercel/postgres : une URL poolée contient "-pooler.". */
function isPooledConnectionString(connectionString: string): boolean {
  return connectionString.indexOf("-pooler.") !== -1;
}

type Primitive = string | number | boolean | undefined | null;

/** Template tag SQL paramétré, fourni par withDb(). */
export type SqlRunner = <T extends QueryResultRow>(
  strings: TemplateStringsArray,
  ...values: Primitive[]
) => Promise<QueryResult<T>>;

let pool: VercelPool | null = null;
let poolConnectionString = "";

function getPool(connectionString: string): VercelPool {
  if (!pool || poolConnectionString !== connectionString) {
    pool = createPool({ connectionString });
    poolConnectionString = connectionString;
  }
  return pool;
}

/**
 * Ouvre une connexion adaptée à l'URL résolue et exécute `fn`.
 * Groupez plusieurs requêtes dans un seul withDb pour ne pas rouvrir
 * une connexion à chaque instruction.
 */
export async function withDb<T>(fn: (run: SqlRunner) => Promise<T>): Promise<T> {
  const connectionString = getConnectionString();
  if (!connectionString) throw new DashboardDbError(MISSING_DB_MESSAGE);

  if (isPooledConnectionString(connectionString)) {
    const activePool = getPool(connectionString);
    return fn(activePool.sql.bind(activePool));
  }

  const client = createClient({ connectionString });
  try {
    await client.connect();
    return await fn(client.sql.bind(client));
  } finally {
    await client.end().catch(() => null);
  }
}

/** Requête unique : sql`SELECT ... WHERE id = ${id}`. */
export function sql<T extends QueryResultRow>(
  strings: TemplateStringsArray,
  ...values: Primitive[]
): Promise<QueryResult<T>> {
  return withDb((run) => run<T>(strings, ...values));
}

/* --------------------------- Schéma SQL --------------------------- */
/**
 * Le schéma (tables, colonnes, contraintes, index, seed, migration des
 * anciennes lignes "amount") vit exclusivement dans :
 *
 *     scripts/dashboard-schema.sql
 *
 * Il s'exécute manuellement dans le SQL Editor de Neon, jamais depuis
 * l'application : aucune route API ne doit pouvoir déclencher du DDL sur la
 * base de production. Les routes supposent donc que le schéma est déjà en
 * place et se limitent à lire / écrire des données métier.
 *
 * Si les tables manquent, Postgres renvoie l'erreur 42P01, que
 * lib/dashboard-api.ts traduit en message explicite pour l'utilisateur.
 */
