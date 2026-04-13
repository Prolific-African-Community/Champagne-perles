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
type CeremonyItem = { time: string; title: string; details: string; icon: string };
type CeremonyDay = { dayKey: string; dayLabel: string; subtitle: string; items: CeremonyItem[] };
type Activity = { title: string; image: string; text: string };
type ActivitiesByDay = Record<string, Record<string, string[]>>;

type RSVPData = {
  fullName: string;
  attending: "yes" | "no";
  guests: number;
  note?: string;
};

/* ----------------------------- Data ------------------------------ */
const WEDDING_DATE_ISO = "2027-01-02T16:00:00+01:00";

const CEREMONY_AGENDA: CeremonyDay[] = [
  {
    dayKey: "Jeudi 31",
    dayLabel: "Jeudi 31",
    subtitle: "Bienvenue & Réveillon",
    items: [
      { time: "20:00", title: "Cocktail de bienvenue", details: "Retrouvailles, musique, ambiance Champagne & Perles.", icon: "🥂" },
      { time: "23:30", title: "Soirée de réveillon", details: "Dancefloor + moment fort de minuit.", icon: "🎉" },
      { time: "00:00", title: "Feu d’artifices", details: "On célèbre ensemble le passage à la nouvelle année.", icon: "🎆" },
    ],
  },
  {
    dayKey: "Vendredi 1",
    dayLabel: "Vendredi",
    subtitle: "Civil + Traditionnel",
    items: [
      { time: "16:00", title: "Mariage civil (Mairie)", details: "Cérémonie civile — arrivée recommandée 15 min avant.", icon: "🏛️" },
      { time: "17:30", title: "Cocktail", details: "Photos, échanges, apéro.", icon: "🥂" },
      { time: "19:00", title: "Cérémonie traditionnelle (Batuka)", details: "Moment culturel & symbolique — tenue élégante recommandée.", icon: "🪘" },
      { time: "21:00", title: "Dîner buffet", details: "Buffet + animations.", icon: "🍽️" },
      { time: "23:00", title: "Soirée dansante", details: "DJ, vibes, jusqu’au bout de la nuit.", icon: "🎶" },
    ],
  },
  {
    dayKey: "Samedi 2",
    dayLabel: "Samedi",
    subtitle: "Église + Réception",
    items: [
      { time: "16:00", title: "Mariage à l’église", details: "Cérémonie religieuse — arrivée recommandée 15 min avant.", icon: "⛪" },
      { time: "18:00", title: "Cocktail", details: "Photos + ambiance lounge.", icon: "🥂" },
      { time: "20:00", title: "Dîner", details: "Repas + prises de parole.", icon: "🍽️" },
      { time: "23:00", title: "Soirée dansante", details: "Final night — on met le feu.", icon: "🔥" },
    ],
  },
];

const ACTIVITIES: Activity[] = [
  { title: "Plage de Saly", image: "/saly.jpg", text: "Sable fin, cocotiers, transat, baignade ou sieste stratégique après un bon déjeuner." },
  { title: "Réserve de Bandia", image: "/safari.jpg", text: "Zèbres, girafes, rhinocéros… appareil photo obligatoire. Accessible à tous, parfait pour une première immersion." },
  { title: "Lac Rose", image: "/lac-rose.jpg", text: "Couleur unique, paysage hors du temps, parfait pour photos et découverte." },
  { title: "Île de Gorée", image: "/goree.jpg", text: "Histoire forte, ruelles colorées, moment calme et profond." },
  { title: "Monument de la Renaissance", image: "/renaissance.jpg", text: "Incontournable pour comprendre Dakar et repartir avec une vraie perspective." },
  { title: "Activités nautiques", image: "/nautical.jpg", text: "Jet-ski, voilier, parasail… sensations + soleil, selon votre mood." },
  { title: "Quad & Buggy", image: "/quad.jpg", text: "Exploration des dunes autour de Saly, sensations et paysages incroyables." },
  { title: "Karting", image: "/karting.jpg", text: "Course fun, esprit compétition, revanche assurée à la fin." },
  { title: "Beach Club / Night Vibes", image: "/bar.jpg", text: "DJ, cocktails, ambiance tropicale chic. Pas besoin de savoir danser, juste lâcher prise." },
  { title: "Spa / Massages", image: "/spa.jpg", text: "Massage relaxant pour récupérer, respirer et recharger les batteries." },
];

const ACTIVITIES_BY_DAY: ActivitiesByDay = {
  Lundi: { Journée: ["Visite Île de Gorée", "Marché Sandaga & Médina", "Monument de la Renaissance"] },
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
  Vendredi: { Matin: ["Coiffeur(se)", "Spa", "Plage", "Piscine", "Marché artisanal"] },
  Samedi: { Matin: ["Coiffeur(se)", "Spa", "Plage", "Piscine", "Marché artisanal"] },
};

/* ----------------------------- Page ------------------------------ */
export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
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
  const { dd, hh, mm, ss } = useMemo(() => getCountdown(weddingDate, now), [weddingDate, now]);

  const [selectedDay, setSelectedDay] = useState<string>(CEREMONY_AGENDA[0]?.dayKey ?? "");

  const [openActivities, setOpenActivities] = useState(false);

  // Intro envelope
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("introPlayed") !== "1";
    } catch {
      return true;
    }
  });
  const [introOpening, setIntroOpening] = useState(false);

  useEffect(() => {
    if (!showIntro) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showIntro]);

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

  return (
    <div className="bg-[#f6efe9] text-[#5a4a42] font-sans">
      {showIntro && (
        <EnvelopeIntro
          logoSrc="/logo.png"
          opening={introOpening}
          onOpen={() => setIntroOpening(true)}
          onDone={() => {
            try {
              sessionStorage.setItem("introPlayed", "1");
            } catch {}
            setShowIntro(false);
            setIntroOpening(false);
          }}
        />
      )}

      <header
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-300",
          scrolled ? "bg-[#fffaf5]/90 backdrop-blur-md border-b border-black/10 shadow-lg" : "bg-transparent"
        )}
      >
        <nav className="max-w-6xl mx-auto flex justify-between items-center px-6 py-2">
          <a href="#home" className="flex items-center gap-2 no-underline">
            <img src="/logo.png" alt="Logo mariage" className="h-16 sm:h-20 w-auto object-contain" />
            <div className="leading-tight">
              <div className={cn("font-serif text-base", scrolled ? "text-slate-900" : "text-white drop-shadow")}>
                Jonathan &amp; Manon
              </div>
              <div
                className={cn(
                  "text-[10px] uppercase tracking-[0.18em]",
                  scrolled ? "text-slate-700" : "text-white/80 drop-shadow"
                )}
              >
                Champagne &amp; Perles · Saly
              </div>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-7">
            {[
              { label: "Accueil", href: "#home" },
              { label: "Agenda", href: "#agenda" },
              { label: "Activités", href: "#activities" },
              { label: "Infos pratiques", href: "#infos" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  "no-underline font-semibold tracking-wide transition hover:text-[#d6b88c]",
                  scrolled ? "text-slate-900" : "text-white drop-shadow"
                )}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setOpenRSVP(true)}
              className={cn(
                "inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold transition",
                scrolled
                  ? "bg-white border border-black/10 text-[#5a4a42] hover:opacity-90"
                  : "bg-white/15 border border-white/25 text-white hover:bg-white/25"
              )}
            >
              RSVP
            </button>

            <button
              onClick={() => setOpenActivities(true)}
              className={cn(
                "inline-flex items-center justify-center px-8 py-3 rounded-full font-medium transition hover:opacity-90",
                "bg-[#d6b88c] text-white",
                scrolled ? "border border-black/10" : "border border-white/25"
              )}
            >
              Choisir mes activités
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile floating RSVP */}
      <button
        onClick={() => setOpenRSVP(true)}
        className="md:hidden fixed bottom-5 right-5 z-40 bg-[#d6b88c] text-white px-5 py-3 rounded-full shadow-lg"
      >
        RSVP
      </button>

      <section
        id="home"
        className="relative min-h-screen flex items-center px-6 pt-24 overflow-hidden"
        style={{ backgroundImage: "url('/hero.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/0" />
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-white/15 blur-3xl rounded-full animate-pulse" />
        <div className="absolute top-24 right-10 w-80 h-80 bg-[#d6b88c]/10 blur-3xl rounded-full animate-pulse" />
        <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-white/15 blur-3xl rounded-full animate-pulse" />

        <div className="relative w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 items-center">
            <div className="bg-gradient-to-t from-white/90 via-white/80 to-white/70 backdrop-blur-xl rounded-3xl p-10 md:p-12 shadow-2xl border border-white/40">
              <h1 className="font-serif text-center lg:text-left text-5xl md:text-6xl leading-tight mt-4 text-[#4f3f38]">
                Bienvenue à notre <br className="hidden md:block" /> mariage
              </h1>

              <div className="flex items-center justify-center lg:justify-start gap-2 mt-6">
                <span className="w-10 h-px bg-[#d6b88c]" />
                <span className="w-2 h-2 rounded-full bg-[#d6b88c]" />
                <span className="w-2 h-2 rounded-full bg-[#d6b88c]/70" />
                <span className="w-2 h-2 rounded-full bg-[#d6b88c]/50" />
                <span className="w-10 h-px bg-[#d6b88c]" />
              </div>

              <p className="text-center lg:text-left text-base md:text-lg text-[#6f5f57] mt-6 leading-relaxed">
                Trois jours de fête, de soleil et de moments inoubliables. Retrouvez ici l’agenda, les activités et toutes
                les infos pratiques.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
                <span className="px-4 py-2 rounded-full bg-white/75 border border-[#e6d9cc] text-sm text-[#5a4a42]">
                  📅 31 décembre → 2 janvier
                </span>
                <span className="px-4 py-2 rounded-full bg-white/75 border border-[#e6d9cc] text-sm text-[#5a4a42]">
                  📍 Saly, Sénégal
                </span>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a
                  href="#agenda"
                  className="no-underline bg-[#d6b88c] text-white px-10 py-4 rounded-full font-medium hover:opacity-90 transition shadow-lg"
                >
                  Voir l’agenda
                </a>
                <button
                  onClick={() => setOpenRSVP(true)}
                  className="bg-white text-[#5a4a42] px-10 py-4 rounded-full font-medium border border-[#e6d9cc] hover:border-[#d6b88c] transition shadow-lg"
                >
                  RSVP
                </button>
              </div>
            </div>

            <div className="rounded-3xl p-8 md:p-6">
              <div className="mt-6 grid grid-cols-4 gap-2">
                {[
                  { label: "Jours", value: dd, pad: false },
                  { label: "Heures", value: hh, pad: true },
                  { label: "Min", value: mm, pad: true },
                  { label: "Sec", value: ss, pad: true },
                ].map((b) => (
                  <div
                    key={b.label}
                    className="bg-gradient-to-t from-white/95 via-white/80 to-white/50 border border-[#e6d9cc] rounded-2xl p-4 text-center shadow-sm"
                  >
                    <div className="font-serif text-xl md:text-3xl text-[#4f3f38] leading-none">
                      {b.pad ? pad2(b.value) : String(b.value)}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-[#8c7a70] mt-2">{b.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center text-sm text-white">
                Rendez-vous le <span className="font-medium">31 décembre</span> à{" "}
                <span className="font-medium">Saly</span>.
              </div>

              <div className="mt-6 flex justify-center">
                <span className="w-24 h-[2px] bg-[#d6b88c] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="agenda" className="py-28 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-serif text-4xl mb-3">Agenda des festivités</h2>
          <p className="text-sm text-[#8c7a70]">3 jours — choisissez un jour pour voir le déroulé.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {CEREMONY_AGENDA.map((d) => {
            const active = selectedDay === d.dayKey;
            return (
              <button
                key={d.dayKey}
                onClick={() => setSelectedDay(d.dayKey)}
                className={cn(
                  "px-5 py-3 rounded-full border transition",
                  active
                    ? "bg-[#d6b88c] text-white border-[#d6b88c]"
                    : "bg-white text-[#5a4a42] border-[#e6d9cc] hover:border-[#d6b88c]"
                )}
              >
                <span className="font-medium">{d.dayLabel}</span>
                <span className="ml-2 text-xs opacity-80">{d.subtitle}</span>
              </button>
            );
          })}
        </div>

        {CEREMONY_AGENDA.filter((d) => d.dayKey === selectedDay).map((d) => (
          <div key={d.dayKey} className="bg-white rounded-3xl border border-[#e6d9cc] shadow-sm p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#8c7a70]">Programme</p>
                <h3 className="font-serif text-2xl mt-1">
                  {d.dayLabel} — {d.subtitle}
                </h3>
              </div>

              <div className="text-sm text-[#8c7a70]">
                <span className="inline-flex items-center gap-2 bg-[#f6efe9] px-4 py-2 rounded-full border border-[#e6d9cc]">
                  ⏱️ Arrivée conseillée : +15 min
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-[86px] top-2 bottom-2 w-px bg-[#e6d9cc]" />
              <div className="space-y-6">
                {d.items.map((it, idx) => (
                  <div key={`${it.time}-${idx}`} className="flex items-start gap-6">
                    <div className="w-[70px] text-right text-sm font-medium text-[#5a4a42] pt-1">{it.time}</div>

                    <div className="relative w-[32px] flex justify-center">
                      <div className="w-8 h-8 rounded-full bg-[#fffaf5] border border-[#d6b88c] flex items-center justify-center">
                        <span className="text-lg">{it.icon}</span>
                      </div>
                    </div>

                    <div className="flex-1 bg-[#fffaf5] border border-[#e6d9cc] rounded-2xl p-5">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <h4 className="font-serif text-xl">{it.title}</h4>
                        <span className="text-xs text-[#8c7a70] bg-white px-3 py-1 rounded-full border border-[#e6d9cc] w-fit">
                          {d.dayLabel}
                        </span>
                      </div>
                      <p className="text-sm text-[#8c7a70] mt-2 leading-relaxed">{it.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-3 justify-center">
              <a
                href="#activities"
                className="no-underline bg-[#d6b88c] text-white px-8 py-3 rounded-full font-medium hover:opacity-90 transition"
              >
                Voir les activités
              </a>
              <a
                href="#infos"
                className="no-underline bg-white text-[#5a4a42] px-8 py-3 rounded-full font-medium border border-[#e6d9cc] hover:border-[#d6b88c] transition"
              >
                Infos pratiques
              </a>
            </div>
          </div>
        ))}
      </section>

      <section id="activities" className="py-28 px-6 bg-[#fffaf5]">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-4xl text-center mb-6">Activités &amp; temps libres</h2>

          <p className="text-center text-[#8c7a70] max-w-2xl mx-auto mb-10">
            Faites défiler pour découvrir les incontournables, puis sélectionnez vos activités pour qu’on organise la
            semaine au mieux.
          </p>

          <ActivitiesScroller activities={ACTIVITIES} />

          <div className="text-center mt-12">
            <button
              onClick={() => setOpenActivities(true)}
              className="bg-[#d6b88c] border-white text-white px-10 py-4 rounded-full font-medium hover:opacity-90 transition shadow-lg"
            >
              Choisir mes activités
            </button>
            <p className="text-xs text-[#8c7a70] mt-3">Vous pourrez modifier vos choix plus tard si besoin.</p>
          </div>
        </div>
      </section>

      <section id="infos" className="py-28 px-6 max-w-6xl mx-auto">
        <h2 className="font-serif text-4xl text-center mb-14">Infos pratiques</h2>
        <InfosPratiques />
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
          onSubmit={async (payload: { fullName: string; plusOneName?: string; childrenCount: number }) => {
            setRsvpLoading(true);
            setRsvpError(null);
      
            try {
              const resp = await fetch("/api/rsvp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  fullName: payload.fullName,
                  plusOneName: payload.plusOneName,
                  childrenCount: payload.childrenCount,
                }),
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
              }, 1200);
            } catch (e: any) {
              setRsvpError(e?.message || "Erreur");
            } finally {
              setRsvpLoading(false);
            }
          }}
        />
      )}
      
      <footer className="text-center text-xs text-[#8c7a70] py-10 border-t">
        © {new Date().getFullYear()} — Mariage au Sénégal
      </footer>
    </div>
  );
}

/* --------------------------- Components -------------------------- */

function EnvelopeIntro({
  logoSrc,
  opening,
  onOpen,
  onDone,
}: {
  logoSrc: string;
  opening: boolean;
  onOpen?: () => void;
  onDone?: () => void;
}) {
  useEffect(() => {
    if (!opening) return;
    const t = window.setTimeout(() => onDone?.(), 650);
    return () => window.clearTimeout(t);
  }, [opening, onDone]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center p-6",
        "bg-white",
        opening ? "intro-fade" : undefined
      )}
      aria-label="Intro"
    >
      <div className="absolute inset-0 pointer-events-none intro-paper" />

      <div className="relative w-[96vw] max-w-[760px] sm:max-w-[980px] md:max-w-[1240px] mx-auto">
        <img
          src="/enveloppe.png"
          alt="Enveloppe"
          className="w-full max-h-[75svh] h-auto object-contain select-none pointer-events-none drop-shadow-[0_30px_60px_rgba(0,0,0,0.18)]"
          draggable={false}
        />

        <button type="button" onClick={() => !opening && onOpen?.()} className="seal-btn" aria-label="Ouvrir">
          <span className="seal-wax" aria-hidden>
            <img src="/cachet.png" alt="" className="seal-wax-img" draggable={false} />
            <span className="seal-logo">
              <img src={logoSrc} alt="Logo" className="w-full h-full object-contain" draggable={false} />
            </span>
          </span>
        </button>
      </div>

      <style>{`
        .intro-paper{
          background:
            radial-gradient(1200px 700px at 25% 15%, rgba(214,184,140,.18), transparent 55%),
            radial-gradient(900px 600px at 75% 35%, rgba(79,63,56,.06), transparent 60%),
            repeating-linear-gradient(0deg, rgba(0,0,0,.02) 0 1px, transparent 1px 8px),
            linear-gradient(180deg, #ffffff 0%, #fffaf5 70%, #ffffff 100%);
        }
        .seal-btn{
          position:absolute;
          left:50%;
          top:48%;
          transform: translate(-50%, -50%);
          padding:0;
          border:0;
          background:transparent;
          cursor:pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .seal-btn:focus-visible{ outline: none; }

        .seal-wax{
          position:relative;
          display:block;
          width: clamp(110px, 22vw, 190px);
          height: clamp(110px, 22vw, 190px);
          border-radius:999px;
          overflow:hidden;
          box-shadow: 0 18px 30px rgba(0,0,0,.22);
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .seal-btn:hover .seal-wax{
          transform: translateY(-2px);
          box-shadow: 0 22px 34px rgba(0,0,0,.22);
        }
        .seal-wax-img{
          position:absolute;
          inset:0;
          width:100%;
          height:100%;
          object-fit:cover;
          border-radius:999px;
        }
        .seal-logo{
          position:absolute;
          inset: clamp(14px, 3.2vw, 22px);
          border-radius:999px;
          display:flex;
          align-items:center;
          justify-content:center;
          filter: drop-shadow(0 6px 10px rgba(0,0,0,.18));
        }

        .intro-fade{ animation: overlayFade 650ms ease forwards; }
        .intro-fade .seal-btn{ animation: sealPop 350ms ease forwards; }
        @keyframes overlayFade { to { opacity: 0; pointer-events:none; } }
        @keyframes sealPop { to { opacity: 0; transform: translate(-50%, -50%) scale(.9); } }

        @media (prefers-reduced-motion: reduce){
          .intro-fade{ animation:none !important; }
          .intro-fade .seal-btn{ animation:none !important; }
        }
      `}</style>
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
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-[#8c7a70]">Faites défiler pour découvrir les activités</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            className="w-10 h-10 rounded-full bg-white/80 border border-[#e6d9cc] hover:border-[#d6b88c] transition flex items-center justify-center"
            aria-label="Scroll left"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            className="w-10 h-10 rounded-full bg-white/80 border border-[#e6d9cc] hover:border-[#d6b88c] transition flex items-center justify-center"
            aria-label="Scroll right"
          >
            →
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-[#fffaf5]/20 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-[#fffaf5]/20 to-transparent z-10" />

        <div
          ref={scrollerRef}
          className="hide-scrollbar flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2"
          style={{ scrollbarWidth: "none" as const }}
        >
          <style>{`
            .hide-scrollbar::-webkit-scrollbar { display: none; }
          `}</style>

          {activities.map((a) => (
            <div
              key={a.title}
              data-card
              className="snap-start min-w-[280px] sm:min-w-[320px] md:min-w-[360px] bg-white rounded-2xl shadow-lg overflow-hidden border border-[#e6d9cc] hover:shadow-xl transition"
            >
              <img src={a.image} alt={a.title} className="h-56 sm:h-60 w-full object-cover" />
              <div className="p-6">
                <h3 className="font-serif text-xl mb-2">{a.title}</h3>
                <p className="text-sm text-[#8c7a70] leading-relaxed">{a.text}</p>
              </div>
            </div>
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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur flex items-center justify-center p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-2xl">Choix des activités</h3>
          <button onClick={onClose}>✕</button>
        </div>

        <form
          className="space-y-10"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {Object.entries(activitiesByDay).map(([day, periods]) => (
            <div key={day} className="border-b border-[#e6d9cc] pb-8">
              <h4 className="font-serif text-xl mb-6">{day}</h4>

              {Object.entries(periods).map(([period, acts]) => (
                <div key={period} className="mb-6">
                  <p className="text-sm uppercase tracking-wider text-[#8c7a70] mb-3">{period}</p>
                  <div className="flex flex-wrap gap-4">
                    {acts.map((act) => (
                      <label key={`${day}-${period}-${act}`} className="flex items-center gap-2 text-sm text-[#5a4a42]">
                        <input type="checkbox" className="accent-[#d6b88c]" name={`${day}__${period}__${act}`} />
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
              className="bg-[#d6b88c] text-white px-8 py-3 rounded-full font-medium hover:opacity-90 transition"
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
  onSubmit: (data: { fullName: string; plusOneName?: string; childrenCount: number }) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [plusOneName, setPlusOneName] = useState("");
  const [childrenCount, setChildrenCount] = useState(0);

  const canSubmit = fullName.trim().length >= 2 && !loading;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="w-full max-w-xl rounded-3xl bg-white border border-[#e6d9cc] shadow-2xl overflow-hidden">
        <div className="p-6 md:p-8 flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-[#8c7a70]">
              Confirmation
            </div>
            <h3 className="font-serif text-2xl mt-2 text-[#4f3f38]">RSVP</h3>
            <p className="text-sm text-[#8c7a70] mt-2">
              10 secondes et c’est bouclé. (Promis.)
            </p>
          </div>

          <button
            type="button"
            onClick={() => !loading && onClose()}
            className="w-10 h-10 rounded-full border border-[#e6d9cc] bg-white text-[#5a4a42] hover:border-[#d6b88c] transition"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <form
          className="px-6 md:px-8 pb-8 space-y-5"
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
            <label className="text-sm font-semibold text-[#5a4a42]">
              Nom & prénom <span className="text-[#8c7a70] font-normal">(obligatoire)</span>
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: Fatou Diop"
              className="mt-2 w-full rounded-2xl border border-[#e6d9cc] bg-white px-4 py-3 outline-none focus:border-[#d6b88c]"
              disabled={loading}
            />
            <p className="text-xs text-[#8c7a70] mt-2">
              Juste pour qu’on sache qui accueillir comme une star.
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-[#5a4a42]">
              Nom & prénom du +1 <span className="text-[#8c7a70] font-normal">(si tu viens accompagné·e)</span>
            </label>
            <input
              value={plusOneName}
              onChange={(e) => setPlusOneName(e.target.value)}
              placeholder="Ex: Mamadou Ndiaye"
              className="mt-2 w-full rounded-2xl border border-[#e6d9cc] bg-white px-4 py-3 outline-none focus:border-[#d6b88c]"
              disabled={loading}
            />
            <p className="text-xs text-[#8c7a70] mt-2">
              Si tu ne sais pas encore, mets “à confirmer”.
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-[#5a4a42]">
              Nombre d’enfants <span className="text-[#8c7a70] font-normal">(0 si aucun)</span>
            </label>
            <select
              value={childrenCount}
              onChange={(e) => setChildrenCount(Number(e.target.value))}
              className="mt-2 w-full rounded-2xl border border-[#e6d9cc] bg-white px-4 py-3 outline-none focus:border-[#d6b88c]"
              disabled={loading}
            >
              {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#8c7a70] mt-2">
              Pour prévoir les places (et éviter une bataille de chaises).
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
              Merci, c’est confirmé.
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                "flex-1 rounded-full px-6 py-4 font-semibold transition",
                canSubmit
                  ? "bg-[#d6b88c] text-white hover:opacity-90"
                  : "bg-[#d6b88c]/40 text-white cursor-not-allowed"
              )}
            >
              {loading ? "Envoi..." : "Confirmer"}
            </button>

            <button
              type="button"
              onClick={() => !loading && onClose()}
              className="flex-1 rounded-full px-6 py-4 font-semibold border border-[#e6d9cc] bg-white text-[#5a4a42] hover:border-[#d6b88c] transition"
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


function InfosPratiques() {
  type InfoBlock = { label: string; lines: string[] };
  type InfoCard = { id: string; icon: string; title: string; subtitle: string; blocks: InfoBlock[] };

  const [activeId, setActiveId] = useState<string | null>(null);

  const cards: InfoCard[] = [
    {
      id: "arrival",
      icon: "✈️",
      title: "Arrivée à Dakar",
      subtitle: "Transfert vers Saly",
      blocks: [
        {
          label: "À l’arrivée",
          lines: [
            "Rendez-vous : sortie principale de l’aéroport (détails envoyés avant le départ).",
            "Trajet vers Saly : ~1h à 1h30 selon la circulation.",
          ],
        },
        {
          label: "Conseils",
          lines: [
            "Gardez passeport / téléphone / eau / chargeur à portée de main.",
            "Si arrivée tardive : on vous guide vers l’option la plus simple (chauffeur/taxi).",
          ],
        },
      ],
    },
    {
      id: "sim",
      icon: "📱",
      title: "SIM & Internet",
      subtitle: "Disponible à l’aéroport",
      blocks: [
        { label: "Sur place", lines: ["Opérateurs : Orange / Free / Expresso.", "Pièce d’identité souvent demandée."] },
        { label: "Recommandation", lines: ["Forfait data + appels (10–20 Go).", "Astuce : WhatsApp + partage de connexion."] },
      ],
    },
    {
      id: "weather",
      icon: "☀️",
      title: "Climat & tenues",
      subtitle: "Chaud + ensoleillé",
      blocks: [
        { label: "À prévoir", lines: ["Journée : chaud. Soir : petite veste utile.", "Crème solaire + anti-moustique."] },
        { label: "Style", lines: ["Chaussures confortables pour excursions.", "Option : blanc / beige / champagne."] },
      ],
    },
  ];

  const active = cards.find((c) => c.id === activeId) ?? null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {cards.map((c) => {
          const isActive = c.id === activeId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveId(isActive ? null : c.id)}
              className={cn(
                "text-left rounded-2xl border overflow-hidden transition shadow-sm",
                "bg-gradient-to-t from-white/95 via-white/85 to-white/60",
                isActive ? "border-[#d6b88c] ring-2 ring-[#d6b88c]/25" : "border-[#e6d9cc] hover:shadow-md"
              )}
            >
              <div className="h-[3px] bg-gradient-to-r from-[#d6b88c] via-[#f2e2c8] to-transparent" />
              <div className="p-6 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/80 border border-[#e6d9cc] flex items-center justify-center text-lg">
                    {c.icon}
                  </div>
                  <div>
                    <div className="font-serif text-lg text-[#4f3f38] leading-tight">{c.title}</div>
                    <div className="text-sm text-[#8c7a70] mt-1">{c.subtitle}</div>
                  </div>
                </div>

                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border transition",
                    isActive ? "bg-[#d6b88c] text-white border-[#d6b88c]" : "bg-white/70 text-[#5a4a42] border-[#e6d9cc]"
                  )}
                >
                  <span className="text-xl leading-none">{isActive ? "–" : "+"}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {active && (
        <div className="mt-8 rounded-3xl border border-[#e6d9cc] bg-gradient-to-t from-white/95 via-white/85 to-white/60 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 flex items-start justify-between gap-6">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/80 border border-[#e6d9cc] flex items-center justify-center text-xl">
                {active.icon}
              </div>
              <div>
                <div className="font-serif text-2xl text-[#4f3f38] leading-tight">{active.title}</div>
                <div className="text-sm text-[#8c7a70] mt-1">{active.subtitle}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveId(null)}
              className="w-10 h-10 rounded-full border border-[#e6d9cc] bg-white/70 text-[#5a4a42] hover:border-[#d6b88c] transition"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          <div className="px-6 md:px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {active.blocks.map((b) => (
              <div key={b.label}>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#8c7a70] mb-3">{b.label}</div>
                <ul className="space-y-2 text-sm text-[#6f5f57] leading-relaxed">
                  {b.lines.map((line, idx) => (
                    <li key={`${b.label}-${idx}`} className="flex gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#d6b88c]" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="px-6 md:px-8 py-5 border-t border-[#e6d9cc] text-xs text-[#8c7a70] flex flex-wrap items-center justify-between gap-3">
            <span>Besoin d’aide ? Écrivez-nous — on vous répond rapidement.</span>
            <span className="px-3 py-1 rounded-full bg-white/70 border border-[#e6d9cc]">Astuce : gardez ce panneau ouvert.</span>
          </div>
        </div>
      )}
    </div>
  );
}
