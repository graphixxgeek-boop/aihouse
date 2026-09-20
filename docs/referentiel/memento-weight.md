# memento weight — instanciation pour Maison IA vivante

*(2026-09-21. Créé sous le nom "MEMENTO rôle b" (tâche #169) — nom "memento weight" conservé tel
quel le même soir en retirant l'ombrelle "MEMENTO" (demande explicite de l'utilisateur : « je n'ai
pas tres bien compris le role b [...] on pourrait le laisser en 'memento weight' »), car il désignait
déjà précisément ce rôle. Cf. `docs/memory-audit-blueprint.md` pour le patron générique voisin
(memory-audit), et `docs/referentiel/memory-audit.md` pour son instanciation.)*

## Rôle exact

Pas un Membre de l'équipe : `lib/memento-weight.ts` vit dans le **Moteur du jeu** (`lib/`), pas
dans l'Outillage de travail (`scripts/`) — exactement la même catégorie que `lib/gemini-keys.ts`
(cf. `docs/regles-de-travail.md`, « Moteur du jeu vs Outillage de travail »). Son pendant côté
outillage (persistance après coup + agrégation), `scripts/memento-weight.mjs`, n'est pas non plus
un Membre de l'équipe à badge : il n'a d'existence qu'au service du rapport KPI, jamais un audit
autonome.

memento weight couvre une seule dette, jamais adressée ailleurs : la **dette de taille mémoire** —
le poids réel envoyé à Gemini par tour, un territoire explicitement exclu par SMART-CONSO-TOKEN et
Smart Conso API (cf. leurs fiches respectives : « jamais le texte envoyé à Gemini pour Lia et
Noé »).

## Investigation préalable (Article 19, 2026-09-21)

`lib/gemini-keys.ts::episodes` (mémoire process en tableau capé, jamais écrite en base —
Cloudflare Workers n'a pas de disque persistant —, exposée en lecture seule via l'API admin déjà
protégée, persistée après coup par `scripts/kpi-report.mjs`) est le patron exact réutilisé pour
observer le poids réel du contexte envoyé à Gemini, sans jamais inventer un second mécanisme de
capture.

## Deux fichiers, deux mondes, un même nom

- **`lib/memento-weight.ts`** (Moteur du jeu) — `recordContextWeightSample(actor, context)` observe,
  au point exact où le payload réel est construit (`lib/lia.ts::think()`, juste après la
  construction de `requestBody`, jamais avant), le poids réel envoyé à Gemini — formule 4 caractères
  ≈ 1 token, dupliquée volontairement depuis `scripts/smart-conso-token.mjs::estimateTokens()`
  (frontière `lib/`/`scripts/` jamais traversée, même raison que `fingerprint()`/`keyLabel()`).
  Mémoire process cappée à 200 échantillons, exposée en lecture seule via
  `app/api/admin/route.ts::contextWeightSamples`.
- **`scripts/memento-weight.mjs`** (Outillage de travail) — extrait de `scripts/memento.mjs` le
  2026-09-21 pour que les deux rôles ne restent plus mélangés dans un même fichier (demande
  explicite de l'utilisateur). `persistContextWeightSamples()` écrit dans `.memento-history.json`
  (local, gitignored, cap 500) ; `averageContextWeightByActor()` calcule la moyenne honnête par
  acteur — jamais une moyenne globale qui masquerait un déséquilibre Lia/Noé. Les deux sont appelées
  par `scripts/kpi-report.mjs::reportMementoWeight()`.

**Jamais utilisée pour modifier le prompt** : cette mesure est strictement observationnelle,
frontière Article 0/8 non négociable, confirmée explicitement par calibrage (« Oui, uniquement pour
mesurer »).

## Ce qui a été délibérément exclu

- Un second plafonnage de stockage — déjà fait par `lib/gemini-keys.ts`, jamais dupliqué.
- Toute connexion à SMART-CONSO-TOKEN ou Smart Conso API dans le sens outil→memento weight —
  frontière écrite des deux côtés (« jamais le texte envoyé à Gemini pour Lia et Noé »). Une
  connexion inverse (memento weight éclaire Smart Conso API sur le coût réel d'une simulation) reste
  une idée non construite, capturée dans `docs/suivi/` (décision #257), jamais câblée à ce jour.

## CIRCLE-TASKS et Doc-Report

Pas d'item CIRCLE-TASKS séparé : déjà rapporté dans la famille KPI existante via
`reportMementoWeight()`, un second passage périodique dupliquerait un rapport déjà couvert. Pas
d'entrée Doc-Report REGISTRIES non plus (`findEngineCodeInRegistries()` refuse mécaniquement tout
`scriptPath` du Moteur du jeu, et `scripts/memento-weight.mjs` n'a pas de rapport propre — son
seul rôle est de nourrir `kpi-report.mjs`).

## Statut d'intégration

Testé avec un vrai fichier local `.memento-history.json` (sauvegarde/restauration complète) et un
patron de test identique à `lib/gemini-keys.ts::episodes` (reset explicite entre tests). Rapporté
dans chaque rapport KPI (section "KPI — Mémoire des personnages (memento weight)"), affichée mais
délibérément EXCLUE du calcul des 6 familles du tableau de bord (cf.
`docs/referentiel/tableau-de-bord.md`).
