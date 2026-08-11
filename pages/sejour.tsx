/* ----------------------------- Types ----------------------------- */
type Step = {
  time: string;
  title: string;
  details: string;
  image?: string;
  caption?: string;
};

type Day = {
  id: string;
  navDate: string;
  navTitle: string;
  date: string;
  title: string;
  summary: string;
  place: string;
  transport: string;
  energy: string;
  advice: string;
  steps: Step[];
  notes: string[];
};

/* ----------------------------- Data ------------------------------ */
const DAYS: Day[] = [
  {
    id: "mardi-29",
    navDate: "Mardi 29",
    navTitle: "Arrivée à Dakar",
    date: "Mardi 29 décembre",
    title: "Arrivée à Dakar",
    summary:
      "Arrivée du groupe depuis le Luxembourg, installation à Bel-Air, dîner maison et sortie optionnelle.",
    place: "Dakar · Bel-Air",
    transport: "minibus",
    energy: "découverte douce",
    advice: "garder téléphone chargé",
    steps: [
      {
        time: "13:00–15:00",
        title: "Arrivée à Dakar",
        details:
          "Accueil à l’aéroport, récupération des bagages et regroupement du groupe.",
      },
      {
        time: "15:00–16:30",
        title: "Transfert vers Bel-Air",
        details: "Départ en minibus vers la maison à Bel-Air.",
        image: "/private-airport-map.png",
        caption: "Trajet depuis l’aéroport",
      },
      {
        time: "16:30–18:30",
        title: "Installation & repos",
        details: "Douches, repos, recharge téléphone, temps calme.",
        image: "/private-belair-house.jpeg",
        caption: "Maison à Bel-Air",
      },
      {
        time: "19:30–21:30",
        title: "Dîner à la maison",
        details: "Dîner convivial tous ensemble à Bel-Air.",
      },
      {
        time: "22:30–00:30",
        title: "Sortie optionnelle aux Almadies",
        details:
          "Bars, beach clubs et ambiance Dakar pour ceux qui ont encore de l’énergie.",
        image: "/bar.png",
        caption: "Ambiance bar / beach club",
      },
    ],
    notes: [
      "La sortie du soir est optionnelle.",
      "Ceux qui préfèrent récupérer peuvent rester se reposer.",
      "Transport prévu en minibus.",
      "Garder les affaires essentielles accessibles.",
    ],
  },
  {
    id: "mercredi-30",
    navDate: "Mercredi 30",
    navTitle: "Gorée & dîner chill",
    date: "Mercredi 30 décembre",
    title: "Gorée & dîner chill",
    summary:
      "Découverte de Gorée, retour à Bel-Air pour récupérer, puis dîner élégant à Dakar.",
    place: "Gorée · Dakar",
    transport: "minibus + ferry",
    energy: "découverte",
    advice: "journée belle mais physique",
    steps: [
      {
        time: "08:30–09:30",
        title: "Petit-déjeuner & préparation",
        details: "Départ groupé depuis Bel-Air.",
      },
      {
        time: "09:30–10:30",
        title: "Trajet vers l’embarcadère",
        details: "Minibus vers Dakar centre et organisation du ferry.",
        image: "/private-goree-ferry-map.png",
        caption: "Bel-Air vers embarcadère",
      },
      {
        time: "10:30–14:30",
        title: "Île de Gorée",
        details: "Balade, visite, photos, pause déjeuner ou boisson sur place.",
        image: "/goree.png",
        caption: "Île de Gorée",
      },
      {
        time: "14:30–16:00",
        title: "Retour vers Bel-Air",
        details: "Retour progressif en minibus.",
      },
      {
        time: "16:00–18:30",
        title: "Repos & préparation",
        details: "Temps calme, douche, tenue du soir.",
      },
      {
        time: "19:30–22:30",
        title: "Dîner à La Fourchette",
        details: "Dîner élégant en ville, idéalement avec espace privatisé.",
        image: "/private-la-fourchette.jpg",
        caption: "La Fourchette · Dakar",
      },
      {
        time: "22:30–00:00",
        title: "Soirée privée soft",
        details: "Ambiance chic, musique, verres, mais sans forcer.",
        image: "/private-dakar-night.png",
        caption: "Dakar by night",
      },
    ],
    notes: [
      "Gorée peut être physique avec la chaleur, la marche et les trajets.",
      "Le retour à Bel-Air est prévu pour permettre à chacun de récupérer.",
      "Le Monument de la Renaissance ne fait pas partie du programme principal.",
      "Le dîner du soir doit rester élégant mais pas trop lourd.",
    ],
  },
  {
    id: "jeudi-31",
    navDate: "Jeudi 31",
    navTitle: "Lac Rose & Saly",
    date: "Jeudi 31 décembre",
    title: "Lac Rose, Saly & réveillon",
    summary:
      "Départ de Dakar, passage au Lac Rose, installation à Saly puis réveillon au Keparanga.",
    place: "Lac Rose · Saly",
    transport: "minibus",
    energy: "festif",
    advice: "sac accessible pour l’arrivée",
    steps: [
      {
        time: "09:30–10:00",
        title: "Départ de Bel-Air",
        details: "Bagages prêts, départ en minibus.",
      },
      {
        time: "10:00–11:30",
        title: "Route vers le Lac Rose",
        details: "Trajet en minibus depuis Bel-Air vers le Lac Rose.",
        image: "/private-lac-rose-map.png",
        caption: "Bel-Air vers Lac Rose",
      },
      {
        time: "11:30–12:30",
        title: "Lac Rose",
        details: "Visite légère, photos, pause découverte.",
        image: "/lac-rose.png",
        caption: "Lac Rose",
      },
      {
        time: "12:30–15:30",
        title: "Route vers Saly",
        details: "Trajet en minibus vers la villa.",
        image: "/private-keparanga-map.png",
        caption: "Lac-Rose vers Saly",
      },
      {
        time: "15:30–18:30",
        title: "Installation à la Villa Ansaly",
        details: "Chambres, repos, piscine, temps libre.",
        image: "/private-villa-ansaly.jpg",
        caption: "Villa Ansaly",
      },
      {
        time: "21:30–22:00",
        title: "Départ vers Keparanga",
        details: "Transport groupé en minibus vers le réveillon.",
      },
      {
        time: "22:00–02:00",
        title: "Réveillon à l’Hôtel Keparanga",
        details:
          "Soirée du Nouvel An. Sur place, chacun gère son dîner, ses consommations et son rythme.",
        image: "/private-keparanga-night.png",
        caption: "Keparanga · réveillon",
      },
      {
        time: "Retour nuit",
        title: "Villa Ansaly",
        details: "Retour organisé en minibus vers la villa.",
      },
    ],
    notes: [
      "Prévoir un sac facilement accessible pour l’arrivée à Saly.",
      "Le réveillon est organisé à Keparanga, mais chacun gère ses choix sur place.",
      "Retour prévu en minibus vers la villa.",
      "Rythme libre après l’installation.",
    ],
  },
  {
    id: "vendredi-1",
    navDate: "Vendredi 1",
    navTitle: "Cérémonie traditionnelle",
    date: "Vendredi 1 janvier",
    title: "Cérémonie traditionnelle à la villa",
    summary:
      "Journée libre à la Villa Ansaly, puis cérémonie traditionnelle en soirée.",
    place: "Villa Ansaly",
    transport: "sur place",
    energy: "officiel",
    advice: "tenue élégante ou traditionnelle",
    steps: [
      {
        time: "Matinée",
        title: "Réveil tranquille à la villa",
        details: "Petit-déjeuner, piscine, repos, temps libre.",
        
      },
      {
        time: "12:00–16:30",
        title: "Journée libre",
        details: "Chacun s’organise : repos, déjeuner, plage, piscine.",
      },
      {
        time: "17:30–18:30",
        title: "Préparation & arrivée des invités",
        details: "Tenue traditionnelle ou élégante recommandée.",
      },
      {
        time: "18:30",
        title: "Accueil des invités",
        details: "Début de soirée à la villa.",
      },
      {
        time: "19:00",
        title: "Cérémonie traditionnelle",
        details: "Moment culturel et symbolique.",
        
      },
      {
        time: "21:00",
        title: "Dîner buffet",
        details: "Repas, animations, échanges.",
      },
      {
        time: "23:00",
        title: "Soirée dansante",
        details: "Ambiance festive à la villa.",
      },
    ],
    notes: [
      "La journée est volontairement libre pour récupérer avant la soirée.",
      "Le programme démarre vraiment en fin de journée.",
      "La cérémonie se déroule à la Villa Ansaly.",
      "Tenue élégante ou traditionnelle recommandée.",
    ],
  },
  {
    id: "samedi-2",
    navDate: "Samedi 2",
    navTitle: "Mariage officiel",
    date: "Samedi 2 janvier",
    title: "Mariage officiel à Keparanga",
    summary:
      "Journée officielle du mariage, cérémonie religieuse puis réception au Keparanga.",
    place: "Keparanga",
    transport: "minibus",
    energy: "officiel",
    advice: "être prêts à l’heure",
    steps: [
      {
        time: "Matinée",
        title: "Temps libre à la villa",
        details: "Repos, piscine, préparation.",
      },
      {
        time: "14:30–15:00",
        title: "Départ groupé",
        details: "Minibus depuis la Villa Ansaly.",
        
      },
      {
        time: "16:00",
        title: "Mariage à l’église",
        details: "Cérémonie religieuse.",
      },
      {
        time: "18:00",
        title: "Cocktail à l’Hôtel Keparanga",
        details: "Photos, lounge, apéritif.",
        
      },
      {
        time: "20:00",
        title: "Dîner",
        details: "Repas, prises de parole, célébration.",
      },
      {
        time: "23:00",
        title: "Soirée dansante",
        details: "Fête jusqu’au bout de la nuit.",
    
      },
      {
        time: "Retour nuit",
        title: "Villa Ansaly",
        details: "Retour organisé en minibus.",
      },
    ],
    notes: [
      "Transport organisé depuis la villa.",
      "Merci d’être prêts à l’heure pour éviter les retards.",
      "Retour prévu en minibus après la soirée.",
      "Journée officielle du mariage à Keparanga.",
    ],
  },
  {
    id: "dimanche-3",
    navDate: "Dimanche 3",
    navTitle: "Brunch",
    date: "Dimanche 3 janvier",
    title: "Brunch & fin du programme privé",
    summary:
      "Brunch au Keparanga avec les mariés, puis fin du programme encadré.",
    place: "Keparanga",
    transport: "minibus",
    energy: "repos",
    advice: "prévoir les valises si besoin",
    steps: [
      {
        time: "Matinée",
        title: "Réveil tranquille à la villa",
        details: "Repos, valises, temps libre.",
      },
      {
        time: "12:30–13:00",
        title: "Départ vers Keparanga",
        details: "Transport groupé en minibus.",
      },
      {
        time: "13:00–15:00",
        title: "Brunch au Keparanga",
        details: "Moment calme pour se retrouver après le mariage.",
     
      },
      {
        time: "Après-midi",
        title: "Fin du programme privé",
        details:
          "Chacun reprend son organisation : repos, plage, départs, prolongation du séjour.",
      
      },
    ],
    notes: [
      "Dernier moment commun prévu avec le groupe.",
      "Transport vers Keparanga à organiser en minibus.",
      "Après le brunch, chacun reprend son programme.",
      "Prévoir les valises si départ ou changement de logement.",
    ],
  },
];

const HERO_FACTS: string[] = ["6 jours", "Minibus", "Dakar → Saly", "Mariage"];

/* --------------------------- Page -------------------------------- */
export default function SejourPage() {
  return (
    <main className="min-h-screen w-full bg-[#F8F5F0] bg-[url('/paper2.png')] bg-cover bg-center bg-fixed bg-no-repeat text-[#2E2A27]">
      <style>{"html{scroll-behavior:smooth}"}</style>

      {/* ----------------------------- Hero ----------------------------- */}
      <header className="mx-auto w-full max-w-6xl px-5 pt-16 pb-10 text-center sm:px-8 sm:pt-24 sm:pb-14">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#D8CFC3]/80 bg-white/60 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-[#9C8F84] backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#CDBBA3]" />
          Page privée
        </span>

        <h1 className="mt-8 font-serif text-[34px] font-normal uppercase leading-[1.12] tracking-[0.16em] text-[#2E2A27] sm:text-[52px]">
          Programme privé
          <span className="mt-3 block text-[17px] tracking-[0.3em] text-[#8F847B] sm:text-[22px]">
            Groupe Luxembourg
          </span>
        </h1>

        <div className="mx-auto mt-9 grid w-[220px] grid-cols-[1fr_auto_1fr] items-center gap-6">
          <span className="h-px bg-[#CDBBA3]/80" />
          <span className="h-2 w-2 rounded-full bg-[#CDBBA3]" />
          <span className="h-px bg-[#CDBBA3]/80" />
        </div>

        <p className="mt-8 text-[11px] uppercase tracking-[0.28em] text-[#6B635D] sm:text-[12px]">
          Du mardi 29 décembre au dimanche 3 janvier
        </p>

        <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-[1.85] text-[#6B635D]">
          Cette page regroupe le déroulé prévu pour les proches arrivant du
          Luxembourg : transports, temps libres, activités et moments clés.
        </p>

        <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-3">
          {HERO_FACTS.map((fact) => (
            <span
              key={fact}
              className="rounded-full border border-[#D8CFC3]/70 bg-white/55 px-5 py-2.5 text-[11px] uppercase tracking-[0.22em] text-[#6B635D] backdrop-blur-sm"
            >
              {fact}
            </span>
          ))}
        </div>
      </header>

      {/* ------------------------ Mobile day nav ------------------------ */}
      <DayNavMobile days={DAYS} />

      {/* -------------------------- Body grid --------------------------- */}
      <div className="mx-auto w-full max-w-6xl px-5 pb-24 sm:px-8 sm:pb-32">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[264px_1fr] lg:gap-14">
          <DayNavDesktop days={DAYS} />

          <div className="min-w-0 space-y-24 sm:space-y-32">
            {DAYS.map((day, i) => (
              <DaySection key={day.id} day={day} index={i} />
            ))}

            <p className="pt-4 text-center text-[11px] uppercase tracking-[0.28em] text-[#9C8F84]">
              Fin du programme privé
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

/* --------------------------- Navigation -------------------------- */
function DayNavDesktop({ days }: { days: Day[] }) {
  return (
    <nav aria-label="Jours du séjour" className="hidden lg:block">
      <div className="sticky top-10">
        <div className="rounded-[26px] border border-[#D8CFC3]/70 bg-white/55 p-3 shadow-[0_18px_45px_rgba(60,45,35,0.05)] backdrop-blur-md">
          <div className="px-3 pb-3 pt-2 text-[9px] uppercase tracking-[0.3em] text-[#9C8F84]">
            Le séjour
          </div>

          <ul className="space-y-1">
            {days.map((day) => (
              <li key={day.id}>
                <a
                  href={`#${day.id}`}
                  className="group block rounded-[18px] border border-transparent px-4 py-3 no-underline transition duration-300 hover:border-[#CDBBA3]/70 hover:bg-white/80"
                >
                  <span className="block text-[10px] uppercase tracking-[0.26em] text-[#9C8F84] transition group-hover:text-[#BFA98E]">
                    {day.navDate}
                  </span>
                  <span className="mt-1.5 block font-serif text-[16px] leading-tight text-[#2E2A27]">
                    {day.navTitle}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}

function DayNavMobile({ days }: { days: Day[] }) {
  return (
    <nav
      aria-label="Jours du séjour"
      className="sticky top-0 z-30 border-y border-[#D8CFC3]/60 bg-[#F8F5F0]/85 backdrop-blur-md lg:hidden"
    >
      <div className="flex gap-2.5 overflow-x-auto px-5 py-3">
        {days.map((day) => (
          <a
            key={day.id}
            href={`#${day.id}`}
            className="shrink-0 rounded-full border border-[#D8CFC3]/80 bg-white/70 px-4 py-2.5 no-underline transition hover:border-[#CDBBA3] hover:bg-white"
          >
            <span className="block whitespace-nowrap text-[9px] uppercase tracking-[0.24em] text-[#9C8F84]">
              {day.navDate}
            </span>
            <span className="mt-0.5 block whitespace-nowrap font-serif text-[13px] leading-tight text-[#2E2A27]">
              {day.navTitle}
            </span>
          </a>
        ))}
      </div>
    </nav>
  );
}

/* -------------------------- Day section -------------------------- */
function DaySection({ day, index }: { day: Day; index: number }) {
  return (
    <section id={day.id} className="scroll-mt-28 sm:scroll-mt-32">
      {/* Day header card */}
      <div className="relative overflow-hidden rounded-[32px] border border-[#D8CFC3]/70 bg-white/60 p-7 shadow-[0_20px_60px_rgba(60,45,35,0.06)] backdrop-blur-md sm:p-10">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#CDBBA3] to-transparent" />

        <div className="flex items-center gap-4">
          <span className="font-serif text-[13px] tracking-[0.2em] text-[#BFA98E]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="h-px w-10 bg-[#CDBBA3]/70" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#9C8F84]">
            {day.date}
          </span>
        </div>

        <h2 className="mt-5 font-serif text-[28px] font-normal leading-[1.15] tracking-[0.02em] text-[#2E2A27] sm:text-[40px]">
          {day.title}
        </h2>

        <p className="mt-5 max-w-2xl text-[15px] leading-[1.85] text-[#6B635D]">
          {day.summary}
        </p>

        <div className="mt-8 flex flex-wrap gap-2.5">
          <InfoBadge label="Lieu" value={day.place} />
          <InfoBadge label="Transport" value={day.transport} />
          <InfoBadge label="Énergie" value={day.energy} />
          <InfoBadge label="Conseil" value={day.advice} />
        </div>
      </div>

      {/* Timeline */}
      <ol className="relative mt-10 list-none space-y-6 pl-0 sm:mt-12 sm:space-y-8">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-[9px] top-3 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-[#CDBBA3]/60 via-[#CDBBA3]/35 to-transparent sm:block"
        />

        {day.steps.map((step, i) => (
          <StepCard key={`${day.id}-${step.time}-${step.title}`} step={step} index={i} />
        ))}
      </ol>

      <RememberBlock notes={day.notes} />
    </section>
  );
}

/* --------------------------- Step card --------------------------- */
function StepCard({ step, index }: { step: Step; index: number }) {
  const hasImage = Boolean(step.image);
  // Subtle alternation on desktop: image left on every other imaged step.
  const imageFirst = hasImage && index % 2 === 1;

  return (
    <li className="relative sm:pl-12">
      <span
        aria-hidden="true"
        className="absolute left-[5px] top-7 hidden h-2 w-2 rounded-full bg-[#CDBBA3] ring-4 ring-[#F8F5F0] sm:block"
      />

      <article className="overflow-hidden rounded-[26px] border border-[#D8CFC3]/70 bg-white/55 shadow-[0_12px_35px_rgba(60,45,35,0.04)] backdrop-blur-sm transition duration-300 hover:border-[#CDBBA3]/90 hover:bg-white/75 hover:shadow-[0_18px_45px_rgba(60,45,35,0.07)]">
        <div
          className={
            hasImage
              ? "grid grid-cols-1 md:grid-cols-2"
              : "grid grid-cols-1"
          }
        >
          {/* Text */}
          <div
            className={[
              "px-6 py-7 sm:px-8 sm:py-9",
              imageFirst ? "md:order-2" : "md:order-1",
            ].join(" ")}
          >
            <div className="font-serif text-[15px] tracking-[0.06em] text-[#BFA98E]">
              {step.time}
            </div>

            <h3 className="mt-2.5 font-serif text-[21px] font-normal leading-[1.25] text-[#2E2A27] sm:text-[24px]">
              {step.title}
            </h3>

            <p className="mt-3.5 max-w-[46ch] text-[14px] leading-[1.85] text-[#6B635D] sm:text-[15px]">
              {step.details}
            </p>
          </div>

          {/* Image */}
          {step.image ? (
            <figure
              className={[
                "relative m-0 min-h-[200px] bg-[#F1EBE2]",
                imageFirst ? "md:order-1" : "md:order-2",
              ].join(" ")}
            >
              <img
                src={step.image}
                alt={step.caption ?? step.title}
                loading="lazy"
                className="h-52 w-full object-cover sm:h-64 md:h-full md:max-h-[340px]"
              />

              {step.caption ? (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2E2A27]/70 to-transparent px-5 py-4 text-[10px] uppercase tracking-[0.24em] text-white/90">
                  {step.caption}
                </figcaption>
              ) : null}
            </figure>
          ) : null}
        </div>
      </article>
    </li>
  );
}

/* --------------------------- Sub-parts --------------------------- */
function InfoBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-2 rounded-full border border-[#D8CFC3]/70 bg-[#F8F5F0]/70 px-4 py-2">
      <span className="text-[9px] uppercase tracking-[0.26em] text-[#9C8F84]">
        {label}
      </span>
      <span className="text-[13px] leading-none text-[#2E2A27]">{value}</span>
    </span>
  );
}

function RememberBlock({ notes }: { notes: string[] }) {
  return (
    <div className="mt-10 rounded-[28px] border border-[#CDBBA3]/50 bg-[#2E2A27] px-7 py-8 shadow-[0_20px_55px_rgba(46,42,39,0.14)] sm:mt-12 sm:px-10 sm:py-9">
      <div className="text-[9px] uppercase tracking-[0.32em] text-[#CDBBA3]">
        À retenir
      </div>

      <ul className="mt-6 grid list-none grid-cols-1 gap-x-10 gap-y-3.5 pl-0 sm:grid-cols-2">
        {notes.slice(0, 4).map((note) => (
          <li
            key={note}
            className="flex gap-3 text-[14px] leading-[1.75] text-white/75"
          >
            <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[#CDBBA3]" />
            {note}
          </li>
        ))}
      </ul>
    </div>
  );
}
