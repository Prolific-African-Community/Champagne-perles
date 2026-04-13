// pages/admin/rsvps.tsx
import { GetServerSideProps } from "next";
import Head from "next/head";
import { createClient, createPool } from "@vercel/postgres";
import { useMemo, useState } from "react";

type RSVPRow = {
  created_at: string;
  updated_at: string;
  full_name: string;
  plus_one_name: string | null;
  children_count: number;
  guests: number;
};

type Props =
  | { authorized: false }
  | { authorized: true; rows: RSVPRow[] };

function cn(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

export default function AdminRSVPPage(props: Props) {
  const [q, setQ] = useState("");

  if (!props.authorized) {
    return (
      <div className="min-h-screen bg-[#f6efe9] text-[#5a4a42] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/90 border border-[#e6d9cc] rounded-3xl p-8 shadow-xl">
          <h1 className="font-serif text-2xl mb-2">Accès admin</h1>
          <p className="text-sm text-[#8c7a70] mb-6">
            Ajoute <span className="font-mono">?pw=...</span> à l’URL.
          </p>
          <div className="text-xs text-[#8c7a70]">
            Exemple : <span className="font-mono">/admin/rsvps?pw=TON_MDP</span>
          </div>
        </div>
      </div>
    );
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return props.rows;
    return props.rows.filter((r) => r.full_name.toLowerCase().includes(needle));
  }, [q, props.rows]);

  const totals = useMemo(() => {
    const guestsTotal = filtered.reduce((acc, r) => acc + (r.guests || 0), 0);
    const childrenTotal = filtered.reduce((acc, r) => acc + (r.children_count || 0), 0);
    const plusOneCount = filtered.reduce((acc, r) => acc + (r.plus_one_name ? 1 : 0), 0);
    return { guestsTotal, childrenTotal, plusOneCount };
  }, [filtered]);

  const downloadCSV = () => {
    const header = [
      "created_at",
      "updated_at",
      "full_name",
      "plus_one_name",
      "children_count",
      "guests",
    ];

    const escape = (v: unknown) => {
      const s = String(v ?? "");
      if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
      return s;
    };

    const lines = [
      header.join(","),
      ...filtered.map((r) =>
        [
          r.created_at,
          r.updated_at,
          r.full_name,
          r.plus_one_name ?? "",
          r.children_count ?? 0,
          r.guests ?? 0,
        ]
          .map(escape)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "rsvps.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Head>
        <title>Admin RSVP</title>
      </Head>

      <div className="min-h-screen bg-[#f6efe9] text-[#5a4a42] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h1 className="font-serif text-3xl">RSVP</h1>
              <p className="text-sm text-[#8c7a70] mt-1">
                {filtered.length} réponse(s) (filtrées) / {props.rows.length} total
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-white/70 border border-[#e6d9cc]">
                  Total invités: <span className="font-semibold">{totals.guestsTotal}</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-white/70 border border-[#e6d9cc]">
                  +1: <span className="font-semibold">{totals.plusOneCount}</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-white/70 border border-[#e6d9cc]">
                  Enfants: <span className="font-semibold">{totals.childrenTotal}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher par nom..."
                className="w-full sm:w-72 rounded-2xl border border-[#e6d9cc] bg-white/80 px-4 py-3 outline-none focus:border-[#d6b88c]"
              />
              <button
                onClick={downloadCSV}
                className="rounded-2xl px-5 py-3 bg-[#d6b88c] text-white font-semibold hover:opacity-90 transition"
              >
                Télécharger CSV
              </button>
            </div>
          </div>

          <div className="bg-white/90 border border-[#e6d9cc] rounded-3xl overflow-hidden shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#fffaf5] border-b border-[#e6d9cc]">
                  <tr className="text-left">
                    <th className="px-5 py-4">Nom</th>
                    <th className="px-5 py-4">+1</th>
                    <th className="px-5 py-4">Enfants</th>
                    <th className="px-5 py-4">Total</th>
                    <th className="px-5 py-4">MAJ</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((r, idx) => (
                    <tr
                      key={`${r.full_name}-${idx}`}
                      className={cn(
                        "border-b border-[#e6d9cc]",
                        idx % 2 === 0 ? "bg-white" : "bg-[#fffaf5]/40"
                      )}
                    >
                      <td className="px-5 py-4 font-medium">{r.full_name}</td>
                      <td className="px-5 py-4 text-[#6f5f57]">
                        {r.plus_one_name ? r.plus_one_name : "-"}
                      </td>
                      <td className="px-5 py-4">{r.children_count ?? 0}</td>
                      <td className="px-5 py-4 font-semibold">{r.guests ?? 0}</td>
                      <td className="px-5 py-4 text-xs text-[#8c7a70] whitespace-nowrap">
                        {new Date(r.updated_at || r.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-[#8c7a70]">
                        Aucun résultat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-xs text-[#8c7a70] mt-4">
            Astuce: garde ce lien privé. Tu peux changer le mot de passe via{" "}
            <span className="font-mono">ADMIN_PASSWORD</span>.
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const pw = String(ctx.query.pw ?? "");
  const adminPw = process.env.ADMIN_PASSWORD ?? "";

  if (!adminPw || pw !== adminPw) {
    return { props: { authorized: false } };
  }

  const nonPooling = process.env.RSVP_POSTGRES_URL_NON_POOLING || "";
  const pooled = process.env.RSVP_POSTGRES_URL || "";

  if (nonPooling) {
    const client = createClient({ connectionString: nonPooling });
    try {
      await client.connect();
      const result = await client.sql<RSVPRow>`
        SELECT created_at, updated_at, full_name, plus_one_name, children_count, guests
        FROM public.rsvps
        ORDER BY updated_at DESC
      `;
      return { props: { authorized: true, rows: result.rows } };
    } finally {
      await client.end().catch(() => null);
    }
  }

  const pool = createPool({ connectionString: pooled });
  const result = await pool.sql<RSVPRow>`
    SELECT created_at, updated_at, full_name, plus_one_name, children_count, guests
    FROM public.rsvps
    ORDER BY updated_at DESC
  `;
  return { props: { authorized: true, rows: result.rows } };
};
