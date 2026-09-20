# MEMENTO — instanciation pour Maison IA vivante

*(2026-09-21. Principe générique : `docs/memento-blueprint.md`. Code : `scripts/memento.mjs`
(rôles a et b) + `lib/memento-weight.ts` (point d'observation en jeu, rôle b). Registre :
`docs/memento/`.)*

## Rôle exact

MEMENTO est le seul outil du réseau à cibler les **Personnages** (Lia/Noé) plutôt qu'un membre de
l'équipe (script de travail). Décision durable (2026-09-21, corrigeant #245 une seconde fois après
un nouveau quasi-recouvrement) : les Personnages n'ont AUCUNE existence dans l'équipe — jamais une
case de l'organigramme, un domaine entièrement séparé (charte de contenu). `PERSONNAGES`/
`assertNotAPersonnage()` de `scripts/lib-shell.mjs` n'est donc pas une catégorie interne au même
tableau que Direction/Équipe noyau/Membre/VIP, mais une liste d'exclusion au bord du domaine équipe.
MEMENTO couvre deux dettes distinctes, jamais adressées ailleurs :

1. **Cohérence mécanique de la mémoire persistée** (`lib/life.ts`) — jamais un second appel Gemini.
2. **Dette de taille mémoire** — le poids réel envoyé à Gemini par tour, un territoire explicitement
   exclu par SMART-CONSO-TOKEN et Smart Conso API (cf. leurs fiches respectives : « jamais le texte
   envoyé à Gemini pour Lia et Noé »).

## Investigation préalable (Article 19, 2026-09-21)

Deux agents Explore séparés, avant toute ligne de code de production touchée :

- **Sur `lib/life.ts`** : le stockage est déjà rigoureusement plafonné à l'écriture (`readLife()`,
  `.slice(-12)`, `.slice(0,300)`, etc. sur chaque champ qui grossit) — aucune raison de reconstruire
  ce plafonnage. Ce qui manque réellement : aucune vérification que ces données plafonnées restent
  cohérentes DANS LE TEMPS (ordre chronologique, remise à zéro suspecte, régression de gravité).
- **Sur le patron de persistance réutilisable** : `lib/gemini-keys.ts::episodes` (mémoire process en
  tableau capé, jamais écrite en base — Cloudflare Workers n'a pas de disque persistant —, exposée en
  lecture seule via l'API admin déjà protégée, persistée après coup par `scripts/kpi-report.mjs`) est
  le patron exact à réutiliser pour observer le poids réel du contexte envoyé à Gemini, sans jamais
  inventer un second mécanisme de capture.

## Rôle (a) — cohérence mécanique, `scripts/memento.mjs`

Trois vérifications confirmées par calibrage explicite (AskUserQuestion, les trois sélectionnées) :

- `checkChronologicalOrder(entries, getRound)` — un champ chronologique réel
  (`bonusLog`/`negotiationLog`/`contacts`, `CHRONOLOGICAL_FIELDS`, tenue à la main comme
  `AGENT_SCRIPT_FILES` d'AXA-CHECK) ne doit jamais revenir en arrière dans ses numéros de round.
- `detectSuspiciousCounterReset(previousCounters, currentCounters, {threshold})` — une remise à zéro
  suspecte de `wordFrequency`/`themeFrequency` entre deux instantanés successifs, sans événement qui
  la justifie. C'est exactement le type de bug déjà trouvé une fois ce soir (`loveRealized`, cf. Plan
  d'origine de CLAUDE.md) — MEMENTO ne l'aurait pas réparé, mais l'aurait signalé mécaniquement.
- `detectWorstMomentRegression(previousWorstMoment, currentWorstMoment)` — `worstMoment` ne doit
  jamais redevenir moins grave (règle du jeu, `lib/life.ts:129`).

`checkMemoryCoherence(life, previousLife)` agrège les trois sur un instantané réel de `Life` — jamais
une action automatique, un signal à lire comme le reste du réseau (Smart Conso API, SMART-CONSO-TOKEN,
THE-KING). S'applique aux instantanés RÉELS d'une partie (donc pendant/après une simulation Article 18,
jamais un scan de repo périodique — cf. l'exclusion CIRCLE-TASKS ci-dessous).

## Rôle (b) — dette de taille mémoire, `lib/memento-weight.ts` + `scripts/memento.mjs`

`recordContextWeightSample(actor, context)` (`lib/memento-weight.ts`) observe, au point exact où le
payload réel est construit (`lib/lia.ts::think()`, juste après la construction de `requestBody`,
jamais avant), le poids réel envoyé à Gemini — formule 4 caractères ≈ 1 token, dupliquée
volontairement depuis `scripts/smart-conso-token.mjs::estimateTokens()` (frontière `lib/`/`scripts/`
jamais traversée, même raison que `fingerprint()`/`keyLabel()`). Mémoire process cappée à 200
échantillons, exposée en lecture seule via `app/api/admin/route.ts::contextWeightSamples`, persistée
après coup dans `.memento-history.json` (local, gitignored, cap 500) par
`scripts/kpi-report.mjs::reportMementoWeight()`, qui calcule aussi `averageContextWeightByActor()` —
jamais une moyenne globale qui masquerait un déséquilibre Lia/Noé.

**Jamais utilisée pour modifier le prompt** : cette mesure est strictement observationnelle,
frontière Article 0/8 non négociable, confirmée explicitement par calibrage (« Oui, uniquement pour
mesurer »).

## Ce qui a été délibérément exclu

- Un second plafonnage de stockage — déjà fait, vérifié par l'investigation, jamais dupliqué.
- Un jugement sur le SENS de ce qui est dit — hors de portée, MEMENTO ne lit que la structure.
- Toute connexion à SMART-CONSO-TOKEN ou Smart Conso API dans le sens outil→MEMENTO — frontière
  écrite des deux côtés (« jamais le texte envoyé à Gemini pour Lia et Noé »). Une connexion inverse
  (MEMENTO éclaire Smart Conso API sur le coût réel d'une simulation) reste une idée non construite,
  capturée dans `docs/suivi/` (décision #257), jamais câblée ce soir.

## CIRCLE-TASKS : exclusion documentée, jamais un item périodique

`docs/memento/` est un registre réel mais MEMENTO n'a pas d'item dans la Ronde périodique
(`CIRCLE_EXCLUDED_REGISTRIES.memento`) : le rôle (a) n'a de sens que contre des instantanés réels de
partie (une Ronde qui tourne sur le dépôt au repos n'a rien à comparer), et le rôle (b) est déjà
rapporté dans la famille KPI existante via `reportMementoWeight()` — un second passage périodique
séparé dupliquerait un rapport déjà couvert.

## Doc-Report

Entrée `REGISTRIES` dédiée (`scripts/doc-report.mjs`), famille **Hors équipe (mémoire narrative des
Personnages)** — la seule entrée de cette famille à ce jour, décision "texte" (aucun rapport HTML
prévu, MEMENTO ne produit que des signaux lus par l'agent et par `kpi-report.mjs`).

## Statut d'intégration

Deux modules (`scripts/memento.mjs` + `lib/memento-weight.ts`), zéro appel Gemini ajouté, testés
contre le vrai fichier local `.memento-history.json` avec sauvegarde/restauration complète. Menu
PRESTATIONS : "Pack Mémoire" (consultation ponctuelle du rôle a + relecture du rôle b). Registre :
`docs/memento/` (dossier + index), vide à la création — se remplira au premier vrai constat de
cohérence ou au premier calcul réel de poids moyen après une simulation.
