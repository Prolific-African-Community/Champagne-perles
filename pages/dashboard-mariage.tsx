import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  isAuthenticated,
  isDashboardConfigured,
  MISSING_PASSWORD_MESSAGE,
} from "../lib/dashboard-auth";
import {
  countBudgetRows,
  globalTotals,
  rowTotals,
  sectionTotals,
} from "../lib/dashboard-types";
import type {
  Row,
  RowType,
  RSVPEntry,
  Section,
  Totals,
} from "../lib/dashboard-types";

/* ----------------------------- Props ----------------------------- */
type PageProps = {
  authorized: boolean;
  configured: boolean;
  configMessage: string;
};

/* ---------------------------- Helpers ---------------------------- */
const MONEY = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function formatMoney(amount: number): string {
  return MONEY.format(Number.isFinite(amount) ? amount : 0);
}

/** Parse prudent : virgule décimale, espaces, symboles — vide ou invalide => 0. */
function parseAmount(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/\s/g, "").replace(",", ".").replace(/[^0-9.\-]/g, "");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** Montant -> texte éditable : 0 devient vide pour laisser le placeholder. */
function amountToInput(amount: number): string {
  return amount ? String(amount) : "";
}

/** Ancre HTML d'une section, utilisée par la navigation rapide. */
function sectionAnchor(sectionId: string): string {
  return `section-${sectionId}`;
}

class SessionExpiredError extends Error {}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      throw new SessionExpiredError("Session expirée.");
    }
    const message =
      data && typeof data === "object" && typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : "Une erreur est survenue.";
    throw new Error(message);
  }

  return data as T;
}

/* ---------------------------- Styles ----------------------------- */
const INPUT_BASE =
  "w-full rounded-[14px] border border-[#D8CFC3]/80 bg-white/70 px-3.5 py-2.5 text-[14px] text-[#2E2A27] outline-none transition placeholder:text-[#9C8F84]/70 focus:border-[#CDBBA3] focus:bg-white";

const GHOST_BUTTON =
  "inline-flex items-center justify-center rounded-full border border-[#D8CFC3]/80 bg-white/60 px-5 py-2.5 text-[10px] uppercase tracking-[0.24em] text-[#6B635D] transition hover:border-[#CDBBA3] hover:bg-white hover:text-[#2E2A27]";

const PAPER_BG =
  "min-h-screen w-full bg-[#F8F5F0] bg-[url('/paper2.png')] bg-cover bg-center bg-fixed bg-no-repeat text-[#2E2A27]";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/* ============================== PAGE ============================== */
export default function DashboardMariagePage({
  authorized,
  configured,
  configMessage,
}: PageProps) {
  return (
    <>
      <Head>
        <title>Dashboard mariage</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {!configured ? (
        <ConfigNotice message={configMessage} />
      ) : authorized ? (
        <DashboardView />
      ) : (
        <LoginView />
      )}
    </>
  );
}

/* --------------------------- Config KO --------------------------- */
function ConfigNotice({ message }: { message: string }) {
  return (
    <main className={cn(PAPER_BG, "flex items-center justify-center px-5 py-16")}>
      <div className="w-full max-w-md rounded-[28px] border border-[#D8CFC3]/70 bg-white/70 p-9 text-center shadow-[0_20px_60px_rgba(60,45,35,0.07)] backdrop-blur-md">
        <h1 className="font-serif text-[26px] leading-tight text-[#2E2A27]">
          Configuration requise
        </h1>
        <p className="mt-5 text-[14px] leading-[1.8] text-[#6B635D]">{message}</p>
      </div>
    </main>
  );
}

/* ----------------------------- Login ----------------------------- */
function LoginView() {
  const router = useRouter();
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [pending, setPending] = useState<boolean>(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError("");

    try {
      await apiFetch("/api/dashboard/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      router.replace(router.asPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion impossible.");
      setPending(false);
    }
  };

  return (
    <main className={cn(PAPER_BG, "flex items-center justify-center px-5 py-16")}>
      <div className="w-full max-w-md">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D8CFC3]/80 bg-white/60 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-[#9C8F84] backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#CDBBA3]" />
            Espace privé
          </span>

          <h1 className="mt-7 font-serif text-[28px] font-normal uppercase leading-[1.15] tracking-[0.16em] text-[#2E2A27] sm:text-[34px]">
            Dashboard mariage
          </h1>

          <div className="mx-auto mt-7 grid w-[170px] grid-cols-[1fr_auto_1fr] items-center gap-5">
            <span className="h-px bg-[#CDBBA3]/80" />
            <span className="h-2 w-2 rounded-full bg-[#CDBBA3]" />
            <span className="h-px bg-[#CDBBA3]/80" />
          </div>
        </div>

        <form
          onSubmit={submit}
          className="mt-9 rounded-[28px] border border-[#D8CFC3]/70 bg-white/65 p-8 shadow-[0_20px_60px_rgba(60,45,35,0.07)] backdrop-blur-md"
        >
          <label
            htmlFor="dashboard-password"
            className="block text-[9px] uppercase tracking-[0.3em] text-[#9C8F84]"
          >
            Mot de passe
          </label>

          <input
            id="dashboard-password"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={cn(INPUT_BASE, "mt-3")}
          />

          {error ? (
            <p className="mt-4 rounded-[14px] border border-[#C08B7A]/40 bg-[#C08B7A]/10 px-4 py-3 text-[13px] leading-relaxed text-[#8A5A4A]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending || !password}
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#2E2A27] px-7 py-3.5 text-[10px] uppercase tracking-[0.26em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "Connexion…" : "Entrer"}
            <span className="h-1.5 w-1.5 rounded-full bg-[#CDBBA3]" />
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] uppercase tracking-[0.26em] text-[#9C8F84]">
          Accès réservé aux mariés
        </p>
      </div>
    </main>
  );
}

/* --------------------------- Dashboard --------------------------- */
type Tab = "budget" | "rsvp";
type SaveState = "idle" | "saving" | "saved" | "error";

function DashboardView() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("budget");
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string>("");

  const [rsvps, setRsvps] = useState<RSVPEntry[]>([]);
  const [rsvpLoading, setRsvpLoading] = useState<boolean>(true);

  // Sert à lire l'état le plus frais au moment du flush des sauvegardes différées.
  const sectionsRef = useRef<Section[]>([]);
  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const inFlight = useRef<number>(0);

  const onSessionExpired = useCallback((): void => {
    router.replace(router.asPath);
  }, [router]);

  /** Enveloppe toute écriture : indicateur d'état + message d'erreur clair. */
  const runSave = useCallback(
    async (task: () => Promise<void>): Promise<void> => {
      inFlight.current += 1;
      setSaveState("saving");

      try {
        await task();
        setError("");
        if (inFlight.current === 1) {
          setSaveState("saved");
          setSavedAt(new Date().toISOString());
        }
      } catch (e) {
        if (e instanceof SessionExpiredError) {
          onSessionExpired();
          return;
        }
        setSaveState("error");
        setError(e instanceof Error ? e.message : "Sauvegarde impossible.");
      } finally {
        inFlight.current -= 1;
      }
    },
    [onSessionExpired]
  );

  /** Sauvegarde différée (600 ms) par entité, pour ne pas écrire à chaque frappe. */
  const scheduleSave = useCallback(
    (key: string, task: () => Promise<void>): void => {
      const existing = timers.current[key];
      if (existing) clearTimeout(existing);

      timers.current[key] = setTimeout(() => {
        delete timers.current[key];
        void runSave(task);
      }, 600);
    },
    [runSave]
  );

  // Nettoyage des timers au démontage.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      Object.keys(pending).forEach((key) => clearTimeout(pending[key]));
    };
  }, []);

  /* --------------------------- Chargement -------------------------- */
  const loadSections = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await apiFetch<{ sections: Section[] }>("/api/dashboard/sections");
      setSections(data.sections);
      setError("");
    } catch (e) {
      if (e instanceof SessionExpiredError) {
        onSessionExpired();
        return;
      }
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, [onSessionExpired]);

  const loadRsvps = useCallback(async (): Promise<void> => {
    setRsvpLoading(true);
    try {
      const data = await apiFetch<{ rsvps: RSVPEntry[] }>("/api/dashboard/rsvps");
      setRsvps(data.rsvps);
    } catch (e) {
      if (e instanceof SessionExpiredError) {
        onSessionExpired();
        return;
      }
      setError(e instanceof Error ? e.message : "Chargement des RSVP impossible.");
    } finally {
      setRsvpLoading(false);
    }
  }, [onSessionExpired]);

  useEffect(() => {
    void loadSections();
    void loadRsvps();
  }, [loadSections, loadRsvps]);

  /* ---------------------------- Actions ---------------------------- */
  const addSection = (): void => {
    void runSave(async () => {
      const data = await apiFetch<{ section: Section }>("/api/dashboard/sections", {
        method: "POST",
        body: JSON.stringify({ title: "Nouvelle section" }),
      });
      setSections((prev) => [...prev, data.section]);
    });
  };

  const removeSection = (sectionId: string): void => {
    const target = sectionsRef.current.find((s) => s.id === sectionId);
    const label = target && target.title ? `« ${target.title} »` : "cette section";
    if (!window.confirm(`Supprimer ${label} et toutes ses lignes ?`)) return;

    const snapshot = sectionsRef.current;
    setSections((prev) => prev.filter((s) => s.id !== sectionId));

    void runSave(async () => {
      try {
        await apiFetch(`/api/dashboard/sections/${sectionId}`, { method: "DELETE" });
      } catch (e) {
        setSections(snapshot); // rollback si la suppression échoue
        throw e;
      }
    });
  };

  const updateSectionTitle = (sectionId: string, title: string): void => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, title } : s))
    );

    scheduleSave(`section:${sectionId}`, async () => {
      const current = sectionsRef.current.find((s) => s.id === sectionId);
      if (!current) return;
      await apiFetch(`/api/dashboard/sections/${sectionId}`, {
        method: "PATCH",
        body: JSON.stringify({ title: current.title }),
      });
    });
  };

  const addRow = (sectionId: string): void => {
    void runSave(async () => {
      const data = await apiFetch<{ row: Row }>("/api/dashboard/rows", {
        method: "POST",
        body: JSON.stringify({ sectionId, label: "", type: "budget" }),
      });
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, rows: [...s.rows, data.row] } : s
        )
      );
    });
  };

  const updateRow = (sectionId: string, rowId: string, patch: Partial<Row>): void => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, rows: s.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)) }
          : s
      )
    );

    const flush = async (): Promise<void> => {
      const section = sectionsRef.current.find((s) => s.id === sectionId);
      const row = section?.rows.find((r) => r.id === rowId);
      if (!row) return;
      await apiFetch(`/api/dashboard/rows/${rowId}`, {
        method: "PATCH",
        body: JSON.stringify({
          label: row.label,
          type: row.type,
          value: row.value,
          budgetAmount: row.budgetAmount,
          paidAmount: row.paidAmount,
        }),
      });
    };

    // Le changement de type est structurel : on l'écrit tout de suite.
    if (patch.type !== undefined) {
      const timer = timers.current[`row:${rowId}`];
      if (timer) {
        clearTimeout(timer);
        delete timers.current[`row:${rowId}`];
      }
      // setTimeout(0) : laisse React appliquer le setState avant de lire le ref.
      setTimeout(() => void runSave(flush), 0);
      return;
    }

    scheduleSave(`row:${rowId}`, flush);
  };

  const removeRow = (sectionId: string, rowId: string): void => {
    const snapshot = sectionsRef.current;
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, rows: s.rows.filter((r) => r.id !== rowId) } : s
      )
    );

    void runSave(async () => {
      try {
        await apiFetch(`/api/dashboard/rows/${rowId}`, { method: "DELETE" });
      } catch (e) {
        setSections(snapshot);
        throw e;
      }
    });
  };

  const logout = async (): Promise<void> => {
    await fetch("/api/dashboard/logout", { method: "POST" }).catch(() => null);
    router.replace(router.asPath);
  };

  /* ----------------------------- Totaux ---------------------------- */
  const totals = useMemo(() => globalTotals(sections), [sections]);
  const budgetRowsCount = useMemo(() => countBudgetRows(sections), [sections]);
  const childrenTotal = useMemo(
    () => rsvps.reduce((sum, r) => sum + r.childrenCount, 0),
    [rsvps]
  );

  /* ----------------------------- Render ---------------------------- */
  return (
    <main className={PAPER_BG}>
      <style>{"html{scroll-behavior:smooth}"}</style>

      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        {/* Header */}
        <header>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D8CFC3]/80 bg-white/60 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-[#9C8F84] backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#CDBBA3]" />
                Espace privé
              </span>

              <h1 className="mt-6 font-serif text-[30px] font-normal uppercase leading-[1.14] tracking-[0.14em] text-[#2E2A27] sm:text-[40px]">
                Dashboard mariage
              </h1>

              <p className="mt-4 text-[14px] leading-relaxed text-[#6B635D]">
                Budget, prestataires, paiements et RSVP.
              </p>
            </div>

            <button type="button" onClick={() => void logout()} className={GHOST_BUTTON}>
              Déconnexion
            </button>
          </div>

          {/* Onglets */}
          <div className="mt-9 inline-flex rounded-full border border-[#D8CFC3]/80 bg-white/55 p-1.5 backdrop-blur-sm">
            <TabButton active={tab === "budget"} onClick={() => setTab("budget")}>
              Budget
            </TabButton>
            <TabButton active={tab === "rsvp"} onClick={() => setTab("rsvp")}>
              RSVP
            </TabButton>
          </div>
        </header>

        {/* Résumé global */}
        <DashboardSummary
          totals={totals}
          sectionsCount={sections.length}
          budgetRowsCount={budgetRowsCount}
          rsvpCount={rsvps.length}
          childrenTotal={childrenTotal}
          savedAt={savedAt}
          saveState={saveState}
        />

        {/* Erreur */}
        {error ? (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-[#C08B7A]/40 bg-[#C08B7A]/10 px-5 py-4">
            <p className="text-[13px] leading-relaxed text-[#8A5A4A]">{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
              className="text-[10px] uppercase tracking-[0.24em] text-[#8A5A4A] underline-offset-4 hover:underline"
            >
              Masquer
            </button>
          </div>
        ) : null}

        {tab === "budget" ? (
          <BudgetTab
            sections={sections}
            loading={loading}
            onAddSection={addSection}
            onRemoveSection={removeSection}
            onSectionTitleChange={updateSectionTitle}
            onAddRow={addRow}
            onRowChange={updateRow}
            onRemoveRow={removeRow}
          />
        ) : (
          <RsvpTab rsvps={rsvps} loading={rsvpLoading} onRefresh={() => void loadRsvps()} />
        )}
      </div>
    </main>
  );
}

/* --------------------------- Tab button -------------------------- */
function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-7 py-2.5 text-[10px] uppercase tracking-[0.24em] transition",
        active
          ? "bg-[#2E2A27] text-white"
          : "text-[#6B635D] hover:bg-white/70 hover:text-[#2E2A27]"
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------ DashboardSummary ----------------------- */
type SummaryProps = {
  totals: Totals;
  sectionsCount: number;
  budgetRowsCount: number;
  rsvpCount: number;
  childrenTotal: number;
  savedAt: string;
  saveState: SaveState;
};

function DashboardSummary({
  totals,
  sectionsCount,
  budgetRowsCount,
  rsvpCount,
  childrenTotal,
  savedAt,
  saveState,
}: SummaryProps) {
  const savedLabel =
    saveState === "saving"
      ? "Sauvegarde…"
      : saveState === "error"
      ? "Échec"
      : savedAt
      ? new Date(savedAt).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const progress =
    totals.budget > 0 ? Math.min((totals.paid / totals.budget) * 100, 100) : 0;

  return (
    <div className="relative mt-10 overflow-hidden rounded-[28px] border border-[#D8CFC3]/70 bg-white/60 p-6 shadow-[0_18px_50px_rgba(60,45,35,0.06)] backdrop-blur-md sm:p-8">
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#CDBBA3] to-transparent" />

      {/* Trois chiffres clés */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <MoneyStat label="Budget total" value={totals.budget} tone="dark" />
        <MoneyStat label="Déjà payé" value={totals.paid} tone="beige" />
        <MoneyStat
          label="Reste à payer"
          value={totals.remaining}
          tone="dark"
          hint={
            totals.overpaid > 0
              ? `+ ${formatMoney(totals.overpaid)} payé en trop`
              : undefined
          }
        />
      </div>

      {/* Avancement des paiements */}
      <div className="mt-7">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-[#E6DED3]"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Avancement des paiements"
        >
          <div
            className="h-full rounded-full bg-[#CDBBA3] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-7 h-px bg-gradient-to-r from-[#CDBBA3]/50 via-[#CDBBA3]/20 to-transparent" />

      {/* Compteurs secondaires */}
      <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryStat label="Sections" value={String(sectionsCount)} />
        <SummaryStat label="Lignes budget" value={String(budgetRowsCount)} />
        <SummaryStat label="RSVP reçus" value={String(rsvpCount)} />
        <SummaryStat label="Enfants" value={String(childrenTotal)} />
        <SummaryStat
          label="Sauvegarde"
          value={savedLabel}
          muted={saveState === "saving"}
        />
      </div>
    </div>
  );
}

function MoneyStat({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: number;
  tone: "dark" | "beige";
  hint?: string;
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.3em] text-[#9C8F84]">{label}</div>
      <div
        className={cn(
          "mt-3 font-serif text-[27px] leading-none sm:text-[31px]",
          tone === "beige" ? "text-[#BFA98E]" : "text-[#2E2A27]"
        )}
      >
        {formatMoney(value)}
      </div>
      {hint ? (
        <div className="mt-2 text-[11px] leading-snug text-[#8F847B]">{hint}</div>
      ) : null}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.3em] text-[#9C8F84]">{label}</div>
      <div
        className={cn(
          "mt-2.5 font-serif text-[19px] leading-none",
          muted ? "text-[#9C8F84]" : "text-[#2E2A27]"
        )}
      >
        {value}
      </div>
    </div>
  );
}

/* --------------------------- Budget tab -------------------------- */
type BudgetTabProps = {
  sections: Section[];
  loading: boolean;
  onAddSection: () => void;
  onRemoveSection: (sectionId: string) => void;
  onSectionTitleChange: (sectionId: string, title: string) => void;
  onAddRow: (sectionId: string) => void;
  onRowChange: (sectionId: string, rowId: string, patch: Partial<Row>) => void;
  onRemoveRow: (sectionId: string, rowId: string) => void;
};

function BudgetTab({
  sections,
  loading,
  onAddSection,
  onRemoveSection,
  onSectionTitleChange,
  onAddRow,
  onRowChange,
  onRemoveRow,
}: BudgetTabProps) {
  if (loading) {
    return <Placeholder text="Chargement du budget…" />;
  }

  if (sections.length === 0) {
    return (
      <>
        <div className="mt-10">
          <AddSectionButton onClick={onAddSection} />
        </div>

        <div className="mt-10 rounded-[28px] border border-dashed border-[#D8CFC3] bg-white/45 px-8 py-16 text-center">
          <p className="font-serif text-[20px] text-[#2E2A27]">
            Aucune section pour le moment
          </p>
          <p className="mx-auto mt-3 max-w-sm text-[14px] leading-[1.8] text-[#6B635D]">
            Ajoutez une première section pour commencer à organiser le budget.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile : barre horizontale de navigation entre sections */}
      <SectionNavMobile sections={sections} />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:mt-10 lg:grid-cols-[268px_1fr] lg:gap-10">
        {/* Desktop : colonne sticky de navigation */}
        <SectionNavDesktop sections={sections} onAddSection={onAddSection} />

        {/* Colonne principale : sections empilées, hauteur naturelle */}
        <div className="min-w-0">
          <div className="mb-6 lg:hidden">
            <AddSectionButton onClick={onAddSection} />
          </div>

          <div className="space-y-6">
            {sections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                onTitleChange={(title) => onSectionTitleChange(section.id, title)}
                onAddRow={() => onAddRow(section.id)}
                onRowChange={(rowId, patch) => onRowChange(section.id, rowId, patch)}
                onRemoveRow={(rowId) => onRemoveRow(section.id, rowId)}
                onRemove={() => onRemoveSection(section.id)}
              />
            ))}
          </div>

          <p className="mt-12 text-center text-[10px] uppercase tracking-[0.26em] text-[#9C8F84]">
            Données enregistrées en base — synchronisées entre vos appareils
          </p>
        </div>
      </div>
    </>
  );
}

function AddSectionButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#2E2A27] px-7 py-3.5 text-[10px] uppercase tracking-[0.26em] text-white transition hover:opacity-90"
    >
      Ajouter une section
      <span className="h-1.5 w-1.5 rounded-full bg-[#CDBBA3]" />
    </button>
  );
}

/* ---------------------- Navigation des sections ------------------- */
function SectionNavDesktop({
  sections,
  onAddSection,
}: {
  sections: Section[];
  onAddSection: () => void;
}) {
  return (
    <nav aria-label="Sections du budget" className="hidden lg:block">
      <div className="sticky top-8">
        <div className="rounded-[24px] border border-[#D8CFC3]/70 bg-white/55 p-3 shadow-[0_14px_40px_rgba(60,45,35,0.05)] backdrop-blur-md">
          <div className="px-3 pb-3 pt-2 text-[9px] uppercase tracking-[0.3em] text-[#9C8F84]">
            Sections
          </div>

          <ul className="max-h-[58vh] space-y-1 overflow-y-auto pr-0.5">
            {sections.map((section) => {
              const totals = sectionTotals(section);

              return (
                <li key={section.id}>
                  <a
                    href={`#${sectionAnchor(section.id)}`}
                    className="group block rounded-[16px] border border-transparent px-3.5 py-3 no-underline transition duration-200 hover:border-[#CDBBA3]/70 hover:bg-white/85"
                  >
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate font-serif text-[15px] leading-tight text-[#2E2A27]">
                        {section.title || "Sans titre"}
                      </span>

                      {totals.remaining > 0 ? (
                        <span
                          title="Reste à payer"
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#BFA98E]"
                        />
                      ) : null}
                    </div>

                    <dl className="mt-2 space-y-0.5 text-[11px] leading-snug">
                      <NavFigure label="Budget" value={totals.budget} />
                      <NavFigure label="Payé" value={totals.paid} />
                      <NavFigure
                        label="Reste"
                        value={totals.remaining}
                        strong={totals.remaining > 0}
                      />
                    </dl>
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="px-1 pb-1 pt-3">
            <AddSectionButton onClick={onAddSection} />
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavFigure({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-[#9C8F84]">{label}</dt>
      <dd className={cn("tabular-nums", strong ? "text-[#2E2A27]" : "text-[#6B635D]")}>
        {formatMoney(value)}
      </dd>
    </div>
  );
}

function SectionNavMobile({ sections }: { sections: Section[] }) {
  return (
    <nav aria-label="Sections du budget" className="mt-8 lg:hidden">
      <div className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1">
        {sections.map((section) => {
          const totals = sectionTotals(section);

          return (
            <a
              key={section.id}
              href={`#${sectionAnchor(section.id)}`}
              className="min-w-[164px] shrink-0 rounded-[18px] border border-[#D8CFC3]/80 bg-white/70 px-4 py-3 no-underline transition hover:border-[#CDBBA3] hover:bg-white"
            >
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate font-serif text-[14px] leading-tight text-[#2E2A27]">
                  {section.title || "Sans titre"}
                </span>
                {totals.remaining > 0 ? (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#BFA98E]" />
                ) : null}
              </div>

              <div className="mt-1.5 text-[11px] leading-snug text-[#6B635D]">
                <span className="tabular-nums">{formatMoney(totals.paid)}</span>
                <span className="text-[#9C8F84]"> / </span>
                <span className="tabular-nums">{formatMoney(totals.budget)}</span>
              </div>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

/* --------------------------- SectionCard ------------------------- */
type SectionCardProps = {
  section: Section;
  onTitleChange: (title: string) => void;
  onAddRow: () => void;
  onRowChange: (rowId: string, patch: Partial<Row>) => void;
  onRemoveRow: (rowId: string) => void;
  onRemove: () => void;
};

function SectionCard({
  section,
  onTitleChange,
  onAddRow,
  onRowChange,
  onRemoveRow,
  onRemove,
}: SectionCardProps) {
  const totals = sectionTotals(section);

  return (
    <article
      id={sectionAnchor(section.id)}
      className="scroll-mt-8 rounded-[26px] border border-[#D8CFC3]/70 bg-white/55 p-5 shadow-[0_12px_35px_rgba(60,45,35,0.04)] backdrop-blur-sm transition hover:border-[#CDBBA3]/80 sm:p-7"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <label
            htmlFor={`title-${section.id}`}
            className="block text-[9px] uppercase tracking-[0.3em] text-[#9C8F84]"
          >
            Section
          </label>

          <input
            id={`title-${section.id}`}
            type="text"
            value={section.title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Titre de la section"
            className="mt-2 w-full rounded-[12px] border border-transparent bg-transparent px-0 py-1 font-serif text-[22px] leading-tight text-[#2E2A27] outline-none transition placeholder:text-[#9C8F84]/60 focus:border-[#CDBBA3]/60 focus:bg-white/60 focus:px-3"
          />
        </div>

        {/* Budget / Payé / Reste de la section */}
        <div className="flex shrink-0 gap-5 sm:gap-6">
          <SectionFigure label="Budget" value={totals.budget} />
          <SectionFigure label="Payé" value={totals.paid} tone="beige" />
          <SectionFigure
            label="Reste"
            value={totals.remaining}
            strong={totals.remaining > 0}
          />
        </div>
      </div>

      {totals.overpaid > 0 ? (
        <p className="mt-3 text-[11px] text-[#8F847B]">
          + {formatMoney(totals.overpaid)} payé en trop
        </p>
      ) : null}

      <div className="mt-5 h-px bg-gradient-to-r from-[#CDBBA3]/60 via-[#CDBBA3]/25 to-transparent" />

      <div className="mt-5 space-y-2.5">
        {section.rows.length === 0 ? (
          <p className="py-5 text-center text-[13px] text-[#9C8F84]">
            Aucune ligne dans cette section.
          </p>
        ) : (
          <>
            {/* En-têtes de colonnes (desktop) */}
            <div className="hidden grid-cols-[minmax(0,1fr)_112px_112px_112px_40px] items-center gap-2.5 px-3 pb-1 lg:grid">
              <span className="text-[9px] uppercase tracking-[0.24em] text-[#9C8F84]">
                Libellé
              </span>
              <span className="text-right text-[9px] uppercase tracking-[0.24em] text-[#9C8F84]">
                Budget
              </span>
              <span className="text-right text-[9px] uppercase tracking-[0.24em] text-[#9C8F84]">
                Payé
              </span>
              <span className="text-right text-[9px] uppercase tracking-[0.24em] text-[#9C8F84]">
                Reste
              </span>
              <span />
            </div>

            {section.rows.map((row) => (
              <RowEditor
                key={row.id}
                row={row}
                onChange={(patch) => onRowChange(row.id, patch)}
                onRemove={() => onRemoveRow(row.id)}
              />
            ))}
          </>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onAddRow}
          className="inline-flex items-center gap-2.5 rounded-full border border-[#CDBBA3]/70 bg-[#F8F5F0]/80 px-5 py-2.5 text-[10px] uppercase tracking-[0.24em] text-[#2E2A27] transition hover:bg-white"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#CDBBA3]" />
          Ajouter une ligne
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="rounded-full px-4 py-2.5 text-[10px] uppercase tracking-[0.24em] text-[#9C8F84] transition hover:text-[#2E2A27]"
        >
          Supprimer la section
        </button>
      </div>
    </article>
  );
}

/* -------------------------- SectionFigure ------------------------ */
function SectionFigure({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: number;
  tone?: "beige";
  strong?: boolean;
}) {
  return (
    <div className="text-right">
      <div className="text-[9px] uppercase tracking-[0.24em] text-[#9C8F84]">{label}</div>
      <div
        className={cn(
          "mt-1.5 font-serif text-[16px] leading-none tabular-nums sm:text-[18px]",
          tone === "beige" ? "text-[#BFA98E]" : strong ? "text-[#2E2A27]" : "text-[#6B635D]"
        )}
      >
        {formatMoney(value)}
      </div>
    </div>
  );
}

/* --------------------------- AmountInput ------------------------- */
/**
 * Champ montant avec brouillon local : la frappe reste libre ("1", "1.", "1,5")
 * et la valeur numérique n'est remontée qu'après parsing. La synchronisation
 * depuis les props est suspendue tant que le champ a le focus, pour ne pas
 * réécrire ce que l'utilisateur est en train de taper.
 */
function AmountInput({
  amount,
  onAmountChange,
  ariaLabel,
  className,
}: {
  amount: number;
  onAmountChange: (next: number) => void;
  ariaLabel: string;
  className?: string;
}) {
  const [draft, setDraft] = useState<string>(() => amountToInput(amount));
  const [focused, setFocused] = useState<boolean>(false);

  useEffect(() => {
    if (!focused) setDraft(amountToInput(amount));
  }, [amount, focused]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={draft}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        setDraft(amountToInput(parseAmount(draft)));
      }}
      onChange={(e) => {
        setDraft(e.target.value);
        onAmountChange(parseAmount(e.target.value));
      }}
      placeholder="0"
      aria-label={ariaLabel}
      className={cn(INPUT_BASE, "text-right tabular-nums", className)}
    />
  );
}

/* ---------------------------- RowEditor -------------------------- */
function RowEditor({
  row,
  onChange,
  onRemove,
}: {
  row: Row;
  onChange: (patch: Partial<Row>) => void;
  onRemove: () => void;
}) {
  const totals = rowTotals(row);

  const typeSelect = (
    <select
      value={row.type}
      onChange={(e) =>
        onChange({ type: (e.target.value === "text" ? "text" : "budget") as RowType })
      }
      aria-label="Type de ligne"
      className={cn(INPUT_BASE, "w-[104px] shrink-0 px-2.5 py-2 text-[12px]")}
    >
      <option value="budget">Budget</option>
      <option value="text">Texte</option>
    </select>
  );

  const removeButton = (
    <button
      type="button"
      onClick={onRemove}
      aria-label="Supprimer la ligne"
      title="Supprimer la ligne"
      className="h-[38px] w-[38px] shrink-0 rounded-full border border-[#D8CFC3]/70 bg-white/60 text-[16px] leading-none text-[#9C8F84] transition hover:border-[#CDBBA3] hover:text-[#2E2A27]"
    >
      &times;
    </button>
  );

  /* ----------------------- Ligne de type texte ---------------------- */
  if (row.type === "text") {
    return (
      <div className="rounded-[16px] border border-[#D8CFC3]/60 bg-[#F8F5F0]/60 p-2.5 transition hover:border-[#CDBBA3]/70">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <input
            type="text"
            value={row.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Libellé"
            aria-label="Libellé de la ligne"
            className={cn(INPUT_BASE, "lg:max-w-[240px]")}
          />

          <input
            type="text"
            value={row.value}
            onChange={(e) => onChange({ value: e.target.value })}
            placeholder="Texte libre"
            aria-label="Valeur texte"
            className={cn(INPUT_BASE, "flex-1")}
          />

          <div className="flex items-center gap-2">
            {typeSelect}
            {removeButton}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------- Ligne de type budget ---------------------- */
  return (
    <div className="rounded-[16px] border border-[#D8CFC3]/60 bg-[#F8F5F0]/60 p-2.5 transition hover:border-[#CDBBA3]/70">
      {/* Desktop : Libellé | Budget | Payé | Reste | actions */}
      <div className="hidden grid-cols-[minmax(0,1fr)_112px_112px_112px_40px] items-center gap-2.5 lg:grid">
        <input
          type="text"
          value={row.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Libellé"
          aria-label="Libellé de la ligne"
          className={INPUT_BASE}
        />

        <AmountInput
          amount={row.budgetAmount}
          onAmountChange={(next) => onChange({ budgetAmount: next })}
          ariaLabel="Budget prévu en euros"
        />

        <AmountInput
          amount={row.paidAmount}
          onAmountChange={(next) => onChange({ paidAmount: next })}
          ariaLabel="Montant payé en euros"
        />

        <div
          className={cn(
            "rounded-[14px] border border-transparent px-3.5 py-2.5 text-right text-[14px] tabular-nums",
            totals.remaining > 0 ? "text-[#2E2A27]" : "text-[#9C8F84]"
          )}
          title={
            totals.overpaid > 0
              ? `${formatMoney(totals.overpaid)} payé en trop`
              : "Reste à payer"
          }
        >
          {totals.overpaid > 0 ? (
            <span className="text-[#8F847B]">+{formatMoney(totals.overpaid)}</span>
          ) : (
            formatMoney(totals.remaining)
          )}
        </div>

        {removeButton}
      </div>

      {/* Mobile : carte verticale compacte */}
      <div className="space-y-2 lg:hidden">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={row.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Libellé"
            aria-label="Libellé de la ligne"
            className={cn(INPUT_BASE, "flex-1")}
          />
          {removeButton}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-[9px] uppercase tracking-[0.24em] text-[#9C8F84]">
              Budget
            </span>
            <AmountInput
              amount={row.budgetAmount}
              onAmountChange={(next) => onChange({ budgetAmount: next })}
              ariaLabel="Budget prévu en euros"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[9px] uppercase tracking-[0.24em] text-[#9C8F84]">
              Payé
            </span>
            <AmountInput
              amount={row.paidAmount}
              onAmountChange={(next) => onChange({ paidAmount: next })}
              ariaLabel="Montant payé en euros"
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-2 px-1 pt-0.5">
          <div className="flex items-center gap-2">
            {typeSelect}
            <span className="text-[9px] uppercase tracking-[0.24em] text-[#9C8F84]">
              Reste
            </span>
          </div>

          <span
            className={cn(
              "text-[14px] tabular-nums",
              totals.remaining > 0 ? "text-[#2E2A27]" : "text-[#9C8F84]"
            )}
          >
            {totals.overpaid > 0 ? (
              <span className="text-[#8F847B]">
                +{formatMoney(totals.overpaid)} en trop
              </span>
            ) : (
              formatMoney(totals.remaining)
            )}
          </span>
        </div>
      </div>

      {/* Sélecteur de type (desktop, discret sous la ligne) */}
      <div className="mt-2 hidden justify-end lg:flex">{typeSelect}</div>
    </div>
  );
}

/* ---------------------------- RSVP tab --------------------------- */
type RsvpFilter = "all" | "plusOne" | "children" | "noChildren";

const RSVP_FILTERS: Array<{ key: RsvpFilter; label: string }> = [
  { key: "all", label: "Tous" },
  { key: "plusOne", label: "Avec accompagnant" },
  { key: "children", label: "Avec enfants" },
  { key: "noChildren", label: "Sans enfants" },
];

function RsvpTab({
  rsvps,
  loading,
  onRefresh,
}: {
  rsvps: RSVPEntry[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [query, setQuery] = useState<string>("");
  const [filter, setFilter] = useState<RsvpFilter>("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return rsvps.filter((entry) => {
      if (needle) {
        const haystack = `${entry.fullName} ${entry.plusOneName ?? ""}`.toLowerCase();
        if (haystack.indexOf(needle) === -1) return false;
      }

      if (filter === "plusOne") return Boolean(entry.plusOneName);
      if (filter === "children") return entry.childrenCount > 0;
      if (filter === "noChildren") return entry.childrenCount === 0;
      return true;
    });
  }, [rsvps, query, filter]);

  const stats = useMemo(() => {
    return {
      responses: filtered.length,
      plusOnes: filtered.reduce((n, r) => n + (r.plusOneName ? 1 : 0), 0),
      children: filtered.reduce((n, r) => n + r.childrenCount, 0),
      guests: filtered.reduce((n, r) => n + r.guests, 0),
    };
  }, [filtered]);

  if (loading) return <Placeholder text="Chargement des RSVP…" />;

  return (
    <section className="mt-10">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat label="Réponses" value={stats.responses} />
        <MiniStat label="Accompagnants" value={stats.plusOnes} />
        <MiniStat label="Enfants" value={stats.children} />
        <MiniStat label="Total invités" value={stats.guests} />
      </div>

      {/* Recherche & filtres */}
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom…"
          aria-label="Rechercher par nom"
          className={cn(INPUT_BASE, "lg:max-w-xs")}
        />

        <div className="flex flex-wrap items-center gap-2">
          {RSVP_FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={cn(
                "rounded-full border px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] transition",
                filter === item.key
                  ? "border-[#CDBBA3] bg-[#2E2A27] text-white"
                  : "border-[#D8CFC3]/80 bg-white/60 text-[#6B635D] hover:border-[#CDBBA3] hover:bg-white"
              )}
            >
              {item.label}
            </button>
          ))}

          <button type="button" onClick={onRefresh} className={GHOST_BUTTON}>
            Actualiser
          </button>
        </div>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="mt-8 rounded-[28px] border border-dashed border-[#D8CFC3] bg-white/45 px-8 py-16 text-center">
          <p className="font-serif text-[20px] text-[#2E2A27]">Aucune réponse</p>
          <p className="mx-auto mt-3 max-w-sm text-[14px] leading-[1.8] text-[#6B635D]">
            Aucun RSVP ne correspond à cette recherche.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile : cartes */}
          <div className="mt-8 space-y-3 lg:hidden">
            {filtered.map((entry) => (
              <div
                key={`${entry.fullName}-${entry.updatedAt}`}
                className="rounded-[22px] border border-[#D8CFC3]/70 bg-white/60 p-5 backdrop-blur-sm"
              >
                <div className="font-serif text-[18px] leading-tight text-[#2E2A27]">
                  {entry.fullName}
                </div>

                <dl className="mt-4 space-y-2 text-[13px]">
                  <MobileField
                    label="Accompagnant"
                    value={entry.plusOneName ? entry.plusOneName : "—"}
                  />
                  <MobileField label="Enfants" value={String(entry.childrenCount)} />
                  <MobileField label="Total" value={String(entry.guests)} />
                  <MobileField label="Réponse" value={formatDate(entry.updatedAt)} />
                </dl>
              </div>
            ))}
          </div>

          {/* Desktop : tableau */}
          <div className="mt-8 hidden overflow-hidden rounded-[28px] border border-[#D8CFC3]/70 bg-white/60 backdrop-blur-md lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-[14px]">
                <thead>
                  <tr className="border-b border-[#D8CFC3]/70 text-left">
                    <Th>Nom complet</Th>
                    <Th>Accompagnant</Th>
                    <Th>Enfants</Th>
                    <Th>Total</Th>
                    <Th>Date de réponse</Th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((entry) => (
                    <tr
                      key={`${entry.fullName}-${entry.updatedAt}`}
                      className="border-b border-[#D8CFC3]/40 last:border-b-0 transition hover:bg-white/60"
                    >
                      <td className="px-6 py-4 font-serif text-[16px] text-[#2E2A27]">
                        {entry.fullName}
                      </td>
                      <td className="px-6 py-4 text-[#6B635D]">
                        {entry.plusOneName ? entry.plusOneName : "—"}
                      </td>
                      <td className="px-6 py-4 text-[#6B635D]">{entry.childrenCount}</td>
                      <td className="px-6 py-4 text-[#BFA98E]">{entry.guests}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-[13px] text-[#9C8F84]">
                        {formatDate(entry.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <p className="mt-12 text-center text-[10px] uppercase tracking-[0.26em] text-[#9C8F84]">
        Lecture seule — source : formulaire RSVP public
      </p>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-4 text-[9px] font-normal uppercase tracking-[0.26em] text-[#9C8F84]">
      {children}
    </th>
  );
}

function MobileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[9px] uppercase tracking-[0.24em] text-[#9C8F84]">{label}</dt>
      <dd className="text-right text-[#2E2A27]">{value}</dd>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[22px] border border-[#D8CFC3]/70 bg-white/55 px-5 py-5 backdrop-blur-sm">
      <div className="text-[9px] uppercase tracking-[0.26em] text-[#9C8F84]">{label}</div>
      <div className="mt-2.5 font-serif text-[24px] leading-none text-[#2E2A27]">
        {value}
      </div>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="mt-10 rounded-[28px] border border-[#D8CFC3]/70 bg-white/50 px-8 py-16 text-center backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[#9C8F84]">{text}</p>
    </div>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ----------------------- Server-side guard ----------------------- */
export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const configured = isDashboardConfigured();

  return {
    props: {
      configured,
      authorized: configured && isAuthenticated(ctx.req),
      configMessage: configured ? "" : MISSING_PASSWORD_MESSAGE,
    },
  };
};
