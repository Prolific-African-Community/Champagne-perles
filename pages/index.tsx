import { useEffect, useMemo, useRef, useState } from "react";

/* ----------------------------- Utils ----------------------------- */
type ClassValue = string | false | null | undefined;
const cn = (...classes: ClassValue[]): string => classes.filter(Boolean).join(" ");

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function getCountdown(targetDate: Date, nowMs: number) {
  const diff = Math.max(0, targetDate.getTime() - nowMs);
  return {
    dd: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hh: Math.floor((diff / (1000 * 60 * 60)) % 24),
    mm: Math.floor((diff / (1000 * 60)) % 60),
    ss: Math.floor((diff / 1000) % 60),
  };
}

/* ----------------------------- Types ----------------------------- */
type CeremonyItem = {
  time: string;
  title: string;
  details: string;
};

type CeremonyDay = {
  dayKey: string;
  dayLabel: string;
  subtitle: string;
  items: CeremonyItem[];
};

type Activity = {
  title: string;
  image: string;
  text: string;
};

type ActivitiesByDay = Record<string, Record<string, string[]>>;

type RSVPSubmitPayload = {
  fullName: string;
  plusOneName?: string;
  childrenCount: number;
};

/* ----------------------------- Data ------------------------------ */
const WEDDING_DATE_ISO = "2027-01-02T16:00:00+01:00";

const CEREMONY_AGENDA: CeremonyDay[] = [
  {
    dayKey: "friday",
    dayLabel: "Vendredi",
    subtitle: "Cérémonie traditionnelle",
    items: [
      {
        time: "18:30",
        title: "Accueil des invités",
        details: "Arrivée progressive à la villa, installation et début de soirée.",
      },
      {
        time: "19:00",
        title: "Cérémonie traditionnelle",
        details: "Moment culturel et symbolique autour des mariés.",
      },
      {
        time: "21:00",
        title: "Dîner buffet",
        details: "Buffet, échanges et animations.",
      },
      {
        time: "23:00",
        title: "Soirée dansante",
        details: "Musique, ambiance et célébration jusqu’au bout de la nuit.",
      },
    ],
  },
  {
    dayKey: "Samedi 2",
    dayLabel: "Samedi",
    subtitle: "Église + Réception",
    items: [
      {
        time: "16:00",
        title: "Mariage à l’église",
        details: "Cérémonie religieuse — arrivée recommandée 15 min avant.",
      },
      {
        time: "18:00",
        title: "Cocktail",
        details: "Photos + ambiance lounge.",
      },
      {
        time: "20:00",
        title: "Dîner",
        details: "Repas + prises de parole.",
      },
      {
        time: "23:00",
        title: "Soirée dansante",
        details: "Final night — on met le feu.",
      },
    ],
  },
];

const ACTIVITIES: Activity[] = [
  {
    title: "Plage de Saly",
    image: "/saly.png",
    text: "Sable fin, cocotiers, transat, baignade ou sieste stratégique après un bon déjeuner.",
  },
  {
    title: "Réserve de Bandia",
    image: "/safari.png",
    text: "Zèbres, girafes, rhinocéros… appareil photo obligatoire. Accessible à tous, parfait pour une première immersion.",
  },
  {
    title: "Lac Rose",
    image: "/lac-rose.png",
    text: "Couleur unique, paysage hors du temps, parfait pour photos et découverte.",
  },
  {
    title: "Île de Gorée",
    image: "/goree.png",
    text: "Histoire forte, ruelles colorées, moment calme et profond.",
  },
  {
    title: "Monument de la Renaissance",
    image: "/renaissance.png",
    text: "Incontournable pour comprendre Dakar et repartir avec une vraie perspective.",
  },
  {
    title: "Activités nautiques",
    image: "/nautical.png",
    text: "Jet-ski, voilier, parasail… sensations + soleil, selon votre mood.",
  },
  {
    title: "Foot 5 vs 5",
    image: "/foot.png",
    text: "Ligaments croisés, tu connais... on joue propre, pas besoin de forcer champion.",
  },
  {
    title: "Quad & Buggy",
    image: "/quad.png",
    text: "Exploration des dunes autour de Saly, sensations et paysages incroyables.",
  },
  {
    title: "Karting",
    image: "/karting.png",
    text: "Course fun, esprit compétition, revanche assurée à la fin.",
  },
  {
    title: "Night Vibes",
    image: "/bar.png",
    text: "DJ, cocktails, ambiance tropicale chic. Pas besoin de savoir danser, juste lâcher prise.",
  },
  {
    title: "Spa / Massages",
    image: "/spa.png",
    text: "Massage relaxant pour récupérer, respirer et recharger les batteries.",
  },
];

const ACTIVITIES_BY_DAY: ActivitiesByDay = {
  Lundi: {
    Journée: [
      "Visite Île de Gorée",
      "Marché Sandaga & Médina",
      "Monument de la Renaissance",
    ],
  },
  Mardi: {
    Matin: ["Jet Ski", "Voilier", "Parasail", "Plage", "Piscine"],
    "Après-midi": ["Visite Village de Pêcheurs", "Réserve de Bandia"],
    Soir: ["Soirée dansante"],
  },
  Mercredi: {
    Matin: ["Visite Lac Rose"],
    "Après-midi": ["Karting", "Quad (Buggy)", "Spa"],
    Soir: ["Bar", "Boîte de nuit", "Beach Club"],
  },
  Jeudi: { Matin: ["Spa", "Plage", "Piscine", "Marché artisanal"] },
  Vendredi: {
    Matin: ["Coiffeur(se)", "Spa", "Plage", "Piscine", "Marché artisanal"],
  },
  Samedi: {
    Matin: ["Coiffeur(se)", "Spa", "Plage", "Piscine", "Marché artisanal"],
  },
};

/* ----------------------------- Page ------------------------------ */
export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const weddingDate = useMemo(() => new Date(WEDDING_DATE_ISO), []);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const { dd, hh, mm, ss } = useMemo(
    () => getCountdown(weddingDate, now),
    [weddingDate, now]
  );

  const [selectedDay, setSelectedDay] = useState<string>(
    CEREMONY_AGENDA[0]?.dayKey ?? ""
  );
  const [openActivities, setOpenActivities] = useState(false);

  // RSVP
  const [openRSVP, setOpenRSVP] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem("rsvp_done") === "1") return;
      const t = window.setTimeout(() => setOpenRSVP(true), 30000);
      return () => window.clearTimeout(t);
    } catch {
      return;
    }
  }, []);

  async function submitRSVP(payload: RSVPSubmitPayload) {
    setRsvpLoading(true);
    setRsvpError(null);

    try {
      const resp = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(data?.error || data?.message || "RSVP failed");
      }

      setRsvpSuccess(true);

      try {
        localStorage.setItem("rsvp_done", "1");
      } catch {}

      setTimeout(() => {
        setOpenRSVP(false);
        setRsvpSuccess(false);
      }, 1100);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur";
      setRsvpError(msg);
    } finally {
      setRsvpLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F1EB] text-[#4A433E]">
      {/* Global paper background */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.55]"
        style={{
          backgroundImage: "url('/paper2.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-white/70 via-transparent to-white/70" />

      {/* HEADER */}
      <header
        className={cn(
          "fixed top-0 z-50 w-full border-b border-[#ded3c5]/70 bg-[#FBF8F4]/10 backdrop-blur-md transition-all duration-300",
          scrolled ? "shadow-[0_10px_30px_rgba(60,45,35,0.05)] bg-[#FBF8F4]" : "shadow-none"
        )}
      >
        <nav className="mx-auto flex h-[78px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <a href="#home" className="flex items-center gap-4 no-underline">
            <img
              src="/logo2.png"
              alt="Jonathan & Manon"
              className="h-[108px] w-[108px] object-contain sm:h-[118px] sm:w-[118px]"
            />

            <div className="hidden sm:block leading-tight">
              <div className="font-serif text-[11px] uppercase tracking-[0.26em] text-[#2E2A27] lg:text-[13px]">
                Jonathan &amp; Manon
              </div>
              <div className="mt-1 text-[8px] uppercase tracking-[0.34em] text-[#9C8F84] lg:text-[9px]">
                Champagne &amp; Perles · Saly
              </div>
            </div>
          </a>

          <div className="hidden items-center gap-9 md:flex">
            {[
              { label: "Accueil", href: "#home" },
              { label: "Agenda", href: "#agenda" },
              { label: "Activités", href: "#activities" },
              { label: "Infos pratiques", href: "#infos" },
            ].map((item, index) => (
              <a
                key={item.label}
                href={item.href}
                className="group relative no-underline text-[10px] uppercase tracking-[0.32em] text-[#4A433E] transition hover:text-[#9C8F84]"
              >
                {item.label}

                {index === 0 && (
                  <span className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1">
                    <span className="h-px w-7 bg-[#CDBBA3]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#CDBBA3]" />
                  </span>
                )}
              </a>
            ))}
          </div>

          <button
            onClick={() => setOpenRSVP(true)}
            className="hidden h-10 items-center justify-center rounded-[9px] border border-[#CDBBA3]/80 bg-white/30 px-7 text-[10px] uppercase tracking-[0.32em] text-[#4A433E] transition hover:bg-[#CDBBA3] hover:text-white md:inline-flex"
          >
            RSVP
            <span className="ml-3 h-1.5 w-1.5 rounded-full bg-[#CDBBA3]" />
          </button>

          <button
            onClick={() => setOpenRSVP(true)}
            className="rounded-full border border-[#CDBBA3]/80 bg-white/40 px-5 py-2 text-[10px] uppercase tracking-[0.24em] text-[#4A433E] md:hidden"
          >
            RSVP
          </button>
        </nav>
      </header>

      {/* HERO */}
<section
  id="home"
  className="
    relative min-h-[100svh] overflow-hidden bg-[#F8F5F0] px-5 pt-[96px] sm:pt-[28px]
    bg-[url('/paper2.png')] bg-cover bg-center bg-no-repeat
    md:bg-[url('/paper2.png')]
  "
>
  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(248,245,240,0.46)_0%,rgba(248,245,240,0.22)_42%,rgba(248,245,240,0)_76%)]" />

  <div className="relative mx-auto flex min-h-[calc(100svh-96px)] max-w-6xl items-center justify-center sm:min-h-[calc(100svh-78px)]">
    <div className="mx-auto w-full max-w-[820px] translate-y-[-2px] text-center sm:translate-y-[-10px]">
      {/* Crest */}
      <img
        src="/crest2.png"
        alt="Monogramme Jonathan & Manon"
        className="mx-auto mb-9 h-auto w-[220px] select-none object-contain sm:mb-0 sm:w-[170px] md:w-[255px] lg:w-[325px]"
      />

      {/* Names */}
      <h1 className="font-serif text-[24px] font-normal uppercase leading-[1.12] tracking-[0.24em] text-[#2E2A27] sm:text-[36px] md:text-[56px] lg:text-[54px]">
        Jonathan <span className="tracking-[0.12em]">&amp;</span> Manon
      </h1>

      <p className="mt-6 text-[8px] uppercase tracking-[0.38em] text-[#9C8F84] sm:mt-4 sm:text-[12px]">
        vous invitent à célébrer leur mariage
      </p>

      {/* Separator */}
      <div className="mx-auto mt-10 grid w-[230px] grid-cols-[1fr_auto_1fr] items-center gap-7 sm:mt-7">
        <span className="h-px bg-[#CDBBA3]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#CDBBA3]" />
        <span className="h-px bg-[#CDBBA3]/80" />
      </div>

      {/* Details */}
      <div className="mt-10 space-y-6 sm:mt-7 sm:space-y-4">
        <p className="text-[9px] uppercase tracking-[0.34em] text-[#4A433E] sm:text-[13px]">
          Du 31 décembre 2026 au 2 janvier 2027
        </p>

        <div>
          <p className="font-serif text-[18px] uppercase tracking-[0.22em] text-[#2E2A27] sm:text-[23px] md:text-[25px]">
            Hôtel Keparanga
          </p>
          <p className="mt-3 text-[10px] uppercase tracking-[0.40em] text-[#6B635D] sm:mt-2 sm:text-[12px]">
            Saly, Sénégal
          </p>
        </div>

        <div className="flex justify-center">
          <span className="text-[11px] text-[#CDBBA3]">✦</span>
        </div>

        <p className="mx-auto max-w-[760px] text-[10px] uppercase leading-relaxed tracking-[0.31em] text-[#9C8F84] sm:text-[12px]">
          3 jours de fête, de soleil et de moments inoubliables
        </p>
      </div>

      {/* CTAs */}
      <div className="mx-auto mt-12 flex w-full max-w-[650px] flex-col items-center justify-center gap-4 sm:mt-9 sm:flex-row sm:gap-3">
        <a
          href="#agenda"
          className="inline-flex h-12 w-full items-center justify-center rounded-[8px] bg-[#BFA98E] px-8 text-[11px] uppercase tracking-[0.30em] text-white no-underline shadow-[0_18px_34px_rgba(85,65,48,0.13)] transition hover:opacity-90 sm:w-auto"
        >
          Découvrir le programme
          <span className="ml-3 h-1.5 w-1.5 rounded-full bg-white/80" />
        </a>

        <button
          onClick={() => setOpenRSVP(true)}
          className="inline-flex h-12 w-full items-center justify-center rounded-[8px] border border-[#CDBBA3] bg-[#FBF8F4]/70 px-8 text-[11px] uppercase tracking-[0.30em] text-[#4A433E] backdrop-blur-sm transition hover:bg-white/70 sm:w-auto"
        >
          Confirmer ma présence
          <span className="ml-3 h-1.5 w-1.5 rounded-full bg-[#CDBBA3]" />
        </button>
      </div>

      {/* Countdown */}
      <div className="mx-auto mt-12 grid w-full max-w-[470px] grid-cols-4 items-center sm:mt-9">
        {[
          { label: "Jours", value: dd, pad: false },
          { label: "Heures", value: hh, pad: true },
          { label: "Minutes", value: mm, pad: true },
          { label: "Secondes", value: ss, pad: true },
        ].map((item, idx) => (
          <div
            key={item.label}
            className={cn(
              "text-center",
              idx !== 0 && "border-l border-[#CDBBA3]/60"
            )}
          >
            <div className="font-serif text-[22px] leading-none text-[#2E2A27] sm:text-[27px]">
              {item.pad ? pad2(item.value) : String(item.value)}
            </div>
            <div className="mt-2 text-[9px] uppercase tracking-[0.28em] text-[#8F847B] sm:text-[10px]">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>

{/* AGENDA */}
<section id="agenda" className="relative px-5 py-24 sm:py-28">
  <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px max-w-5xl bg-gradient-to-r from-transparent via-[#CDBBA3]/60 to-transparent" />

  <div className="mx-auto max-w-6xl">
    {/* Header */}
    <div className="mx-auto mb-12 max-w-3xl text-center">
      <div className="text-[10px] uppercase tracking-[0.38em] text-[#9C8F84]">
        Au programme
      </div>

      <h2 className="mt-4 font-serif text-[36px] font-normal leading-tight tracking-[0.04em] text-[#2E2A27] sm:text-[48px]">
        Agenda des festivités
      </h2>

      <div className="mt-6 flex justify-center">
        <div className="grid w-[230px] grid-cols-[1fr_auto_1fr] items-center gap-7">
          <span className="h-px bg-[#CDBBA3]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#CDBBA3]" />
          <span className="h-px bg-[#CDBBA3]/80" />
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-[#6B635D]">
        Trois jours, trois ambiances. Sélectionnez une journée pour découvrir le déroulé.
      </p>
    </div>

    {/* Day selector */}
    <div className="mx-auto mb-12 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">
      {CEREMONY_AGENDA.map((d) => {
        const active = selectedDay === d.dayKey;

        return (
          <button
            key={d.dayKey}
            type="button"
            onClick={() => setSelectedDay(d.dayKey)}
            className={cn(
              "group relative overflow-hidden rounded-[24px] border px-5 py-5 text-left transition-all duration-300",
              active
                ? "border-[#CDBBA3] bg-[#2E2A27] text-white shadow-[0_24px_55px_rgba(46,42,39,0.16)]"
                : "border-[#D8CFC3]/80 bg-[#FBF8F4]/70 text-[#2E2A27] hover:border-[#CDBBA3] hover:bg-white/75"
            )}
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#CDBBA3] to-transparent transition",
                active ? "opacity-80" : "opacity-0 group-hover:opacity-60"
              )}
            />

            <div className="flex items-start justify-between gap-4">
              <div>
                <div
                  className={cn(
                    "text-[10px] uppercase tracking-[0.32em]",
                    active ? "text-white/60" : "text-[#9C8F84]"
                  )}
                >
                  Journée
                </div>

                <div className="mt-2 font-serif text-[24px] leading-none tracking-[0.04em]">
                  {d.dayLabel}
                </div>

                <div
                  className={cn(
                    "mt-3 text-xs uppercase tracking-[0.22em]",
                    active ? "text-white/70" : "text-[#6B635D]"
                  )}
                >
                  {d.subtitle}
                </div>
              </div>

              <span
                className={cn(
                  "mt-1 h-2.5 w-2.5 shrink-0 rounded-full transition",
                  active ? "bg-white/70" : "bg-[#CDBBA3]"
                )}
              />
            </div>
          </button>
        );
      })}
    </div>

    {/* Selected day */}
    {CEREMONY_AGENDA.filter((d) => d.dayKey === selectedDay).map((d) => (
      <div
        key={d.dayKey}
        className="relative overflow-hidden rounded-[38px] border border-[#D8CFC3]/80 bg-white/62 shadow-[0_30px_80px_rgba(60,45,35,0.08)] backdrop-blur-md"
      >
        

        <div className="relative grid grid-cols-1 lg:grid-cols-[320px_1fr]">
          {/* Left panel */}
          <div className="border-b border-[#D8CFC3]/60 p-7 sm:p-9 lg:border-b-0 lg:border-r">
            <div className="sticky top-[110px]">
              <div className="text-[10px] uppercase tracking-[0.34em] text-[#9C8F84]">
                Programme
              </div>

              <h3 className="mt-4 font-serif text-[30px] font-normal leading-tight text-[#2E2A27] sm:text-[40px]">
                {d.dayLabel}
              </h3>

              <p className="mt-3 text-[12px] uppercase tracking-[0.28em] text-[#6B635D]">
                {d.subtitle}
              </p>

              <div className="mt-7 grid w-[180px] grid-cols-[1fr_auto_1fr] items-center gap-5">
                <span className="h-px bg-[#CDBBA3]/80" />
                <span className="h-2 w-2 rounded-full bg-[#CDBBA3]" />
                <span className="h-px bg-[#CDBBA3]/80" />
              </div>

              <p className="mt-7 max-w-[250px] text-sm leading-relaxed text-[#6B635D]">
                Arrivée conseillée 15 minutes avant chaque moment clé. Le programme pourra être ajusté légèrement sur place.
              </p>

              <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-[#D8CFC3]/80 bg-[#F8F5F0]/70 px-4 py-3 text-xs text-[#6B635D]">
                <span className="h-2 w-2 rounded-full bg-[#CDBBA3]" />
                Arrivée conseillée : +15 min
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="relative">
              <div className="absolute left-[114px] top-2 hidden h-[calc(100%-1rem)] w-px bg-gradient-to-b from-transparent via-[#CDBBA3]/45 to-transparent sm:block" />

              <div className="space-y-5">
                {d.items.map((it) => (
                  <div
                    key={`${d.dayKey}-${it.time}-${it.title}`}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-[128px_1fr] sm:gap-7"
                  >
                    {/* Time */}
                    <div className="relative sm:pt-5 sm:text-right">
                      <div className="whitespace-nowrap font-serif text-[28px] leading-none tracking-[0.01em] text-[#2E2A27] sm:text-[32px]">
                        {it.time}
                      </div>

                      <div className="mt-3 hidden items-center justify-end sm:flex">
                        <span className="h-px w-9 bg-[#CDBBA3]/70" />
                      </div>
                    </div>

                    {/* Event card */}
<div className="relative rounded-[26px] border border-[#D8CFC3]/75 bg-[#FBF8F4]/70 px-6 py-6 transition-all duration-300 hover:border-[#CDBBA3] hover:bg-white/80 hover:shadow-[0_18px_45px_rgba(60,45,35,0.05)] sm:px-7 sm:py-7">
  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="max-w-[620px]">
                          <h4 className="font-serif text-[22px] font-normal leading-[1.2] tracking-[0.01em] text-[#2E2A27] sm:text-[26px]">
                            {it.title}
                          </h4>

                          <p className="mt-3 text-[14px] leading-[1.8] text-[#6B635D] sm:text-[15px]">
                            {it.details}
                          </p>
                        </div>

                        <span className="w-fit shrink-0 rounded-full border border-[#D8CFC3]/75 bg-white/60 px-4 py-2 text-[9px] uppercase tracking-[0.28em] text-[#9C8F84]">
                          {d.dayLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="#activities"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#2E2A27] px-8 text-[11px] uppercase tracking-[0.28em] text-white no-underline transition hover:opacity-90"
              >
                Voir les activités
                <span className="ml-3 h-1.5 w-1.5 rounded-full bg-white/70" />
              </a>

              <a
                href="#infos"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#D8CFC3]/90 bg-white/60 px-8 text-[11px] uppercase tracking-[0.28em] text-[#2E2A27] no-underline transition hover:border-[#CDBBA3] hover:bg-white/80"
              >
                Infos pratiques
                <span className="ml-3 h-1.5 w-1.5 rounded-full bg-[#CDBBA3]" />
              </a>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
</section>

      {/* ACTIVITIES */}
<section id="activities" className="relative px-5 py-24 sm:py-28">
  <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px max-w-5xl bg-gradient-to-r from-transparent via-[#CDBBA3]/60 to-transparent" />

  <div className="mx-auto max-w-6xl">
    <div className="mx-auto mb-12 max-w-3xl text-center">
      <div className="text-[10px] uppercase tracking-[0.38em] text-[#9C8F84]">
        Explorer
      </div>

      <h2 className="mt-4 font-serif text-[36px] font-normal leading-tight tracking-[0.04em] text-[#2E2A27] sm:text-[48px]">
        Activités &amp; temps libres
      </h2>

      <div className="mt-6 flex justify-center">
        <div className="grid w-[230px] grid-cols-[1fr_auto_1fr] items-center gap-7">
          <span className="h-px bg-[#CDBBA3]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#CDBBA3]" />
          <span className="h-px bg-[#CDBBA3]/80" />
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-[#6B635D]">
        Quelques idées pour profiter de Saly, découvrir le Sénégal et remplir les temps libres entre deux festivités.
      </p>
    </div>

    <ActivitiesScroller activities={ACTIVITIES} />

    <div className="mt-12 text-center">
      <button
        onClick={() => setOpenActivities(true)}
        className="inline-flex h-12 items-center justify-center rounded-full bg-[#2E2A27] px-8 text-[11px] uppercase tracking-[0.28em] text-white transition hover:opacity-90"
      >
        Choisir mes activités
        <span className="ml-3 h-1.5 w-1.5 rounded-full bg-white/70" />
      </button>

      <p className="mt-4 text-xs leading-relaxed text-[#8F847B]">
        Sélection indicative — on s’en servira pour organiser les meilleures options.
      </p>
    </div>
  </div>
</section>

     {/* INFOS */}
<section id="infos" className="relative px-5 py-24 sm:py-28">
  <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px max-w-5xl bg-gradient-to-r from-transparent via-[#CDBBA3]/60 to-transparent" />

  <div className="mx-auto max-w-6xl">
    <div className="mx-auto mb-12 max-w-3xl text-center">
      <div className="text-[10px] uppercase tracking-[0.38em] text-[#9C8F84]">
        Guide
      </div>

      <h2 className="mt-4 font-serif text-[36px] font-normal leading-tight tracking-[0.04em] text-[#2E2A27] sm:text-[48px]">
        Infos pratiques
      </h2>

      <div className="mt-6 flex justify-center">
        <div className="grid w-[230px] grid-cols-[1fr_auto_1fr] items-center gap-7">
          <span className="h-px bg-[#CDBBA3]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#CDBBA3]" />
          <span className="h-px bg-[#CDBBA3]/80" />
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-[#6B635D]">
        Les essentiels pour arriver sereinement, profiter du séjour et éviter les petites galères de dernière minute.
      </p>
    </div>

    <InfosPratiques onOpenRSVP={() => setOpenRSVP(true)} />
  </div>
</section>

      {openActivities && (
        <ActivitiesModal
          activitiesByDay={ACTIVITIES_BY_DAY}
          onClose={() => setOpenActivities(false)}
          onSubmit={() => setOpenActivities(false)}
        />
      )}

      {openRSVP && (
        <RSVPModal
          loading={rsvpLoading}
          success={rsvpSuccess}
          error={rsvpError}
          onClose={() => {
            setOpenRSVP(false);
            setRsvpError(null);
          }}
          onSubmit={submitRSVP}
        />
      )}

      <footer className="border-t border-black/10 py-10 text-center text-[11px] uppercase tracking-[0.28em] text-[#8F847B]">
        © {new Date().getFullYear()} — Champagne &amp; Perles
      </footer>

      <style>{`
        :root { color-scheme: light; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}

/* --------------------------- Components -------------------------- */

function SeparatorPearls({ small }: { small?: boolean } = {}) {
  const dot = small ? "w-1.5 h-1.5" : "w-2 h-2";
  const line = small ? "w-10" : "w-12";

  return (
    <div className="flex items-center justify-center gap-2">
      <span className={cn("h-px bg-[#CDBBA3]", line)} />
      <span className={cn("rounded-full bg-[#CDBBA3]", dot)} />
      <span className={cn("rounded-full bg-[#CDBBA3]/70", dot)} />
      <span className={cn("rounded-full bg-[#CDBBA3]/45", dot)} />
      <span className={cn("h-px bg-[#CDBBA3]", line)} />
    </div>
  );
}

function ActivitiesScroller({ activities }: { activities: Activity[] }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scrollByCards = (dir: number) => {
    const el = scrollerRef.current;
    if (!el) return;

    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 24 : 360;

    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.34em] text-[#9C8F84]">
            Sélection
          </p>
          <p className="mt-2 text-sm text-[#6B635D]">
            Culture, mer, détente et moments funs.
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D8CFC3]/90 bg-white/60 text-[#2E2A27] transition hover:border-[#CDBBA3] hover:bg-white/85"
            aria-label="Activité précédente"
          >
            ←
          </button>

          <button
            type="button"
            onClick={() => scrollByCards(1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D8CFC3]/90 bg-white/60 text-[#2E2A27] transition hover:border-[#CDBBA3] hover:bg-white/85"
            aria-label="Activité suivante"
          >
            →
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#F6F1EB] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#F6F1EB] to-transparent" />

        <div
          ref={scrollerRef}
          className="hide-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-3"
          style={{ scrollbarWidth: "none" as const }}
        >
          <style>{`
            .hide-scrollbar::-webkit-scrollbar { display: none; }
          `}</style>

          {activities.map((a, index) => (
            <article
              key={a.title}
              data-card
              className="group snap-start min-w-[300px] overflow-hidden rounded-[30px] border border-[#D8CFC3]/80 bg-white/62 shadow-[0_18px_50px_rgba(60,45,35,0.06)] backdrop-blur-md transition-all duration-300 hover:border-[#CDBBA3] hover:bg-white/78 hover:shadow-[0_26px_70px_rgba(60,45,35,0.10)] sm:min-w-[350px] md:min-w-[390px]"
            >
              <div className="relative h-[250px] overflow-hidden">
                <img
                  src={a.image}
                  alt={a.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#2E2A27]/45 via-[#2E2A27]/5 to-transparent" />
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/20 to-transparent" />

                <div className="absolute left-5 top-5 rounded-full border border-white/45 bg-white/55 px-4 py-2 text-[9px] uppercase tracking-[0.28em] text-[#4A433E] backdrop-blur-md">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="absolute bottom-5 left-5 right-5">
                  <div className="mb-3 grid w-[110px] grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <span className="h-px bg-white/65" />
                    <span className="h-1.5 w-1.5 rounded-full bg-white/85" />
                    <span className="h-px bg-white/65" />
                  </div>

                  <h3 className="font-serif text-[28px] leading-tight text-white drop-shadow-sm">
                    {a.title}
                  </h3>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <span className="text-[10px] uppercase tracking-[0.30em] text-[#9C8F84]">
                    Saly & alentours
                  </span>

                  <span className="h-2 w-2 rounded-full bg-[#CDBBA3]" />
                </div>

                <p className="min-h-[72px] text-sm leading-[1.75] text-[#6B635D]">
                  {a.text}
                </p>

                <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-[#D8CFC3] to-transparent" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivitiesModal({
  activitiesByDay,
  onClose,
  onSubmit,
}: {
  activitiesByDay: ActivitiesByDay;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[34px] border border-black/10 bg-[#fffaf5] p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.30em] text-[#8F847B]">
              Sélection
            </div>
            <h3 className="mt-2 font-serif text-2xl text-[#2E2A27]">
              Choix des activités
            </h3>
          </div>

          <button
            onClick={onClose}
            className="h-10 w-10 rounded-full border border-black/10 bg-white/70 transition hover:border-[#CDBBA3]"
          >
            ✕
          </button>
        </div>

        <form
          className="space-y-10"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {Object.entries(activitiesByDay).map(([day, periods]) => (
            <div key={day} className="border-b border-black/10 pb-8">
              <h4 className="mb-6 font-serif text-xl text-[#2E2A27]">{day}</h4>

              {Object.entries(periods).map(([period, acts]) => (
                <div key={period} className="mb-6">
                  <p className="mb-3 text-[11px] uppercase tracking-[0.30em] text-[#8F847B]">
                    {period}
                  </p>

                  <div className="flex flex-wrap gap-4">
                    {acts.map((act) => (
                      <label
                        key={`${day}-${period}-${act}`}
                        className="flex items-center gap-2 text-sm text-[#4A433E]"
                      >
                        <input
                          type="checkbox"
                          className="accent-[#CDBBA3]"
                          name={`${day}__${period}__${act}`}
                        />
                        {act}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div className="text-center">
            <button
              type="submit"
              className="rounded-full bg-[#2E2A27] px-8 py-3 text-[12px] uppercase tracking-[0.22em] text-white transition hover:opacity-90"
            >
              Envoyer mes choix
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RSVPModal({
  loading,
  success,
  error,
  onClose,
  onSubmit,
}: {
  loading: boolean;
  success: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (data: RSVPSubmitPayload) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [plusOneName, setPlusOneName] = useState("");
  const [childrenCount, setChildrenCount] = useState(0);

  const canSubmit = fullName.trim().length >= 2 && !loading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5 backdrop-blur"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-[34px] border border-black/10 bg-[#fffaf5] shadow-2xl">
        <div className="flex items-start justify-between gap-4 p-6 md:p-8">
          <div>
            <div className="text-[11px] uppercase tracking-[0.30em] text-[#8F847B]">
              Confirmation
            </div>
            <h3 className="mt-2 font-serif text-3xl text-[#2E2A27]">RSVP</h3>
            <p className="mt-2 text-sm text-[#6B635D]">
              10 secondes et c’est bouclé. (Promis.)
            </p>
          </div>

          <button
            type="button"
            onClick={() => !loading && onClose()}
            className="h-10 w-10 rounded-full border border-black/10 bg-white/70 text-[#2E2A27] transition hover:border-[#CDBBA3]"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <form
          className="space-y-5 px-6 pb-8 md:px-8"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;

            onSubmit({
              fullName: fullName.trim(),
              plusOneName: plusOneName.trim() ? plusOneName.trim() : undefined,
              childrenCount,
            });
          }}
        >
          <div>
            <label className="text-sm font-semibold text-[#2E2A27]">
              Nom & prénom{" "}
              <span className="font-normal text-[#8F847B]">(obligatoire)</span>
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: Fatou Diop"
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 outline-none focus:border-[#CDBBA3]"
              disabled={loading}
            />
            <p className="mt-2 text-xs text-[#8F847B]">
              Juste pour qu’on sache qui accueillir comme une star.
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-[#2E2A27]">
              Nom & prénom du +1{" "}
              <span className="font-normal text-[#8F847B]">
                (si tu viens accompagné·e)
              </span>
            </label>
            <input
              value={plusOneName}
              onChange={(e) => setPlusOneName(e.target.value)}
              placeholder="Ex: Mamadou Ndiaye"
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 outline-none focus:border-[#CDBBA3]"
              disabled={loading}
            />
            <p className="mt-2 text-xs text-[#8F847B]">
              Si tu ne sais pas encore, mets “à confirmer”.
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-[#2E2A27]">
              Nombre d’enfants{" "}
              <span className="font-normal text-[#8F847B]">(0 si aucun)</span>
            </label>
            <select
              value={childrenCount}
              onChange={(e) => setChildrenCount(Number(e.target.value))}
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 outline-none focus:border-[#CDBBA3]"
              disabled={loading}
            >
              {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-[#8F847B]">
              Pour prévoir les places (et éviter une bataille de chaises).
            </p>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Merci, c’est confirmé.
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                "flex-1 rounded-full px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.22em] transition",
                canSubmit
                  ? "bg-[#2E2A27] text-white hover:opacity-90"
                  : "cursor-not-allowed bg-[#2E2A27]/40 text-white"
              )}
            >
              {loading ? "Envoi..." : "Confirmer"}
            </button>

            <button
              type="button"
              onClick={() => !loading && onClose()}
              className="flex-1 rounded-full border border-black/10 bg-white/70 px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#2E2A27] transition hover:border-[#CDBBA3]"
              disabled={loading}
            >
              Plus tard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InfosPratiques({ onOpenRSVP }: { onOpenRSVP: () => void }) {
  type InfoBlock = { label: string; lines: string[] };
  type InfoCard = {
    id: string;
    index: string;
    title: string;
    subtitle: string;
    blocks: InfoBlock[];
  };

  const [activeId, setActiveId] = useState<string | null>("arrival");

  const cards: InfoCard[] = [
    {
      id: "arrival",
      index: "01",
      title: "Arrivée à Dakar",
      subtitle: "Transfert vers Saly",
      blocks: [
        {
          label: "À l’arrivée",
          lines: [
            "Rendez-vous : sortie principale de l’aéroport. Les détails précis seront envoyés avant le départ.",
            "Trajet vers Saly : environ 1h à 1h30 selon la circulation.",
          ],
        },
        {
          label: "À garder sous la main",
          lines: [
            "Passeport, téléphone chargé, eau, chargeur et adresse de l’hôtel.",
            "Si vous arrivez tard, privilégiez l’option chauffeur/taxi recommandé.",
          ],
        },
      ],
    },
    {
      id: "sim",
      index: "02",
      title: "SIM & Internet",
      subtitle: "Connexion sur place",
      blocks: [
        {
          label: "Sur place",
          lines: [
            "Cartes SIM disponibles à l’aéroport ou en boutique.",
            "Opérateurs fréquents : Orange, Free, Expresso.",
          ],
        },
        {
          label: "Recommandation",
          lines: [
            "Prenez un forfait data confortable pour WhatsApp, maps et partage de connexion.",
            "Une pièce d’identité peut être demandée pour l’enregistrement.",
          ],
        },
      ],
    },
    {
      id: "weather",
      index: "03",
      title: "Climat & tenues",
      subtitle: "Soleil, chaleur, élégance",
      blocks: [
        {
          label: "À prévoir",
          lines: [
            "Journées chaudes et lumineuses. Une petite veste peut être utile le soir.",
            "Crème solaire, lunettes, anti-moustique et chaussures confortables recommandés.",
          ],
        },
        {
          label: "Style",
          lines: [
            "Pour les moments habillés : élégant, léger, respirant.",
            "Palette optionnelle : blanc, beige, champagne, perle, tons naturels.",
          ],
        },
      ],
    },
  ];

  const active = cards.find((c) => c.id === activeId) ?? cards[0];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="relative overflow-hidden rounded-[38px] border border-[#D8CFC3]/80 bg-white/62 shadow-[0_30px_80px_rgba(60,45,35,0.08)] backdrop-blur-md">
  <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr]">
          {/* Left selector */}
          <div className="border-b border-[#D8CFC3]/60 p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <div className="mb-7">
              <div className="text-[10px] uppercase tracking-[0.34em] text-[#9C8F84]">
                Essentiels
              </div>

              <h3 className="mt-4 font-serif text-[30px] font-normal leading-tight text-[#2E2A27] sm:text-[38px]">
                Avant le départ
              </h3>

              <p className="mt-4 max-w-[270px] text-sm leading-relaxed text-[#6B635D]">
                Les informations utiles sont regroupées ici pour vous simplifier l’organisation.
              </p>
            </div>

            <div className="space-y-3">
              {cards.map((card) => {
                const isActive = card.id === active.id;

                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setActiveId(isActive ? active.id : card.id)}
                    className={cn(
                      "group w-full rounded-[24px] border px-5 py-5 text-left transition-all duration-300",
                      isActive
                        ? "border-[#CDBBA3] bg-[#2E2A27] text-white shadow-[0_20px_45px_rgba(46,42,39,0.14)]"
                        : "border-[#D8CFC3]/80 bg-[#FBF8F4]/70 text-[#2E2A27] hover:border-[#CDBBA3] hover:bg-white/75"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div
                          className={cn(
                            "text-[10px] uppercase tracking-[0.32em]",
                            isActive ? "text-white/55" : "text-[#9C8F84]"
                          )}
                        >
                          {card.index}
                        </div>

                        <div className="mt-2 font-serif text-[22px] leading-tight tracking-[0.02em]">
                          {card.title}
                        </div>

                        <div
                          className={cn(
                            "mt-3 text-xs uppercase tracking-[0.22em]",
                            isActive ? "text-white/70" : "text-[#6B635D]"
                          )}
                        >
                          {card.subtitle}
                        </div>
                      </div>

                      <span
                        className={cn(
                          "mt-1 h-2.5 w-2.5 shrink-0 rounded-full transition",
                          isActive ? "bg-white/70" : "bg-[#CDBBA3]"
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right content */}
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.34em] text-[#9C8F84]">
                  Information
                </div>

                <h4 className="mt-3 font-serif text-[30px] font-normal leading-tight text-[#2E2A27] sm:text-[38px]">
                  {active.title}
                </h4>

                <p className="mt-3 text-[13px] uppercase tracking-[0.24em] text-[#6B635D]">
                  {active.subtitle}
                </p>
              </div>

              <span className="w-fit rounded-full border border-[#D8CFC3]/80 bg-white/60 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-[#9C8F84]">
                Champagne &amp; Perles
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {active.blocks.map((block) => (
                <div
                  key={block.label}
                  className="rounded-[28px] border border-[#D8CFC3]/75 bg-[#FBF8F4]/70 p-6 transition-all duration-300 hover:border-[#CDBBA3] hover:bg-white/80 hover:shadow-[0_18px_45px_rgba(60,45,35,0.05)]"
                >
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div className="text-[10px] uppercase tracking-[0.32em] text-[#9C8F84]">
                      {block.label}
                    </div>

                    <span className="h-2 w-2 rounded-full bg-[#CDBBA3]" />
                  </div>

                  <ul className="space-y-4">
                    {block.lines.map((line, idx) => (
                      <li
                        key={`${block.label}-${idx}`}
                        className="flex gap-3 text-sm leading-[1.75] text-[#6B635D]"
                      >
                        <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#CDBBA3]" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[28px] border border-[#D8CFC3]/75 bg-white/50 px-6 py-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm leading-relaxed text-[#6B635D]">
                  Gardez cette page sous la main pendant le séjour. Elle servira de petit guide pratique.
                </p>

                <button
                  type="button"
                  onClick={onOpenRSVP}
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#2E2A27] px-6 text-[10px] uppercase tracking-[0.26em] text-white transition hover:opacity-90"
                >
                  Confirmer ma présence
                  <span className="ml-3 h-1.5 w-1.5 rounded-full bg-white/70" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
