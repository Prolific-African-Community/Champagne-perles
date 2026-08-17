-- =====================================================================
-- Champagne & Perles — Dashboard mariage
-- Schéma PostgreSQL (Neon) + migration budget / payé / reste
--
-- À exécuter dans le SQL Editor de Neon.
-- Le script est idempotent : il peut être relancé sans risque et ne
-- supprime aucune donnée existante.
--
-- (L'application appelle aussi ensureDashboardSchema() au premier
--  chargement, qui joue exactement les mêmes instructions. Ce fichier
--  sert de référence et permet une migration manuelle.)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------- Tables -------------------------------

CREATE TABLE IF NOT EXISTS public.wedding_dashboard_sections (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  position   integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wedding_dashboard_rows (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id    uuid NOT NULL
                REFERENCES public.wedding_dashboard_sections(id) ON DELETE CASCADE,
  label         text NOT NULL,
  type          text NOT NULL,
  value         text NOT NULL DEFAULT '',
  budget_amount numeric NOT NULL DEFAULT 0,
  paid_amount   numeric NOT NULL DEFAULT 0,
  position      integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- --------------------------- Mise à niveau ----------------------------
-- Pour les bases créées avant le modèle budget / payé.

ALTER TABLE public.wedding_dashboard_rows
  ADD COLUMN IF NOT EXISTS budget_amount numeric NOT NULL DEFAULT 0;

ALTER TABLE public.wedding_dashboard_rows
  ADD COLUMN IF NOT EXISTS paid_amount numeric NOT NULL DEFAULT 0;

-- La contrainte d'origine n'autorisait que ('text', 'amount').
-- On l'élargit AVANT la migration, sinon l'UPDATE vers 'budget' échouerait.
-- 'amount' reste accepté pour tolérer d'éventuelles lignes legacy.
ALTER TABLE public.wedding_dashboard_rows
  DROP CONSTRAINT IF EXISTS wedding_dashboard_rows_type_check;

ALTER TABLE public.wedding_dashboard_rows
  ADD CONSTRAINT wedding_dashboard_rows_type_check
  CHECK (type IN ('text', 'budget', 'amount'));

-- --------------------------- Migration douce --------------------------
-- Les anciennes lignes type = 'amount' deviennent des lignes 'budget' :
--   budget_amount = montant précédemment saisi dans value
--   paid_amount   = 0
--   value         = '' (la colonne reste utilisée par les lignes 'text')
--
-- Idempotent : ne cible que type = 'amount', donc ne fait plus rien une
-- fois jouée. Une value non numérique retombe sur 0 sans faire échouer
-- la migration.

UPDATE public.wedding_dashboard_rows
SET budget_amount = CASE
      WHEN regexp_replace(replace(value, ',', '.'), '[^0-9.-]', '', 'g') ~ '^-?[0-9]+(\.[0-9]+)?$'
      THEN regexp_replace(replace(value, ',', '.'), '[^0-9.-]', '', 'g')::numeric
      ELSE 0
    END,
    paid_amount = 0,
    value = '',
    type = 'budget',
    updated_at = now()
WHERE type = 'amount';

-- ------------------------------ Index ---------------------------------

CREATE INDEX IF NOT EXISTS wedding_dashboard_rows_section_id_idx
  ON public.wedding_dashboard_rows (section_id);

CREATE INDEX IF NOT EXISTS wedding_dashboard_rows_position_idx
  ON public.wedding_dashboard_rows (section_id, position);

CREATE INDEX IF NOT EXISTS wedding_dashboard_sections_position_idx
  ON public.wedding_dashboard_sections (position);

-- ------------------------------ Seed ----------------------------------
-- Insère les sections initiales UNIQUEMENT si la table est vide.
-- Le garde-fou NOT EXISTS rend l'insertion rejouable sans doublon et
-- protège les données déjà saisies.

INSERT INTO public.wedding_dashboard_sections (title, position)
SELECT v.title, v.position
FROM (VALUES
  ('Photographe', 0),
  ('Décoration', 1),
  ('Tenues', 2),
  ('Transport', 3),
  ('Villa & hébergement', 4)
) AS v(title, position)
WHERE NOT EXISTS (SELECT 1 FROM public.wedding_dashboard_sections);

INSERT INTO public.wedding_dashboard_rows (section_id, label, type, value, position)
SELECT s.id, v.label, v.type, '', v.position
FROM (VALUES
  ('Photographe',         'Photographe principal', 'budget', 0),
  ('Photographe',         'Vidéaste',              'budget', 1),
  ('Photographe',         'Contact',               'text',   2),
  ('Photographe',         'Notes',                 'text',   3),
  ('Décoration',          'Fleurs',                'budget', 0),
  ('Décoration',          'Voiles',                'budget', 1),
  ('Décoration',          'Perles',                'budget', 2),
  ('Décoration',          'Notes',                 'text',   3),
  ('Tenues',              'Robe',                  'budget', 0),
  ('Tenues',              'Costume',               'budget', 1),
  ('Tenues',              'Accessoires',           'budget', 2),
  ('Transport',           'Minibus',               'budget', 0),
  ('Transport',           'Chauffeurs',            'budget', 1),
  ('Transport',           'Divers',                'budget', 2),
  ('Villa & hébergement', 'Villa Ansaly',          'budget', 0),
  ('Villa & hébergement', 'Extras',                'budget', 1),
  ('Villa & hébergement', 'Notes',                 'text',   2)
) AS v(section_title, label, type, position)
JOIN public.wedding_dashboard_sections s ON s.title = v.section_title
WHERE NOT EXISTS (SELECT 1 FROM public.wedding_dashboard_rows);

-- ---------------------------------------------------------------------
-- Note : la table public.rsvps utilisée par le formulaire public n'est PAS
-- modifiée par ce script. Le dashboard la lit uniquement en lecture seule.
-- ---------------------------------------------------------------------
