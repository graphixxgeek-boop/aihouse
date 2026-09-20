# Points fragiles ouverts

Registre vivant des points identifiés comme fragiles, incertains, ou en attente d'une décision de
conception — pas une liste de bugs actifs (ceux-là se corrigent directement, cf. Article 3 de
CLAUDE.md), mais des zones où une hypothèse n'a pas encore été vérifiée, où une décision reste à
trancher avec l'utilisateur, ou où une fonctionnalité reste sciemment limitée en attendant une
validation plus poussée.

Ce fichier est lu par `scripts/kpi-report.mjs` (famille "performance/robustesse" du tableau de
bord) : le nombre d'entrées sous chaque section ci-dessous est compté tel quel, donc la structure
(une puce `- ` par point, sous les titres `##`) doit rester stable. Une entrée se retire de ce
fichier dès qu'elle est résolue ou tranchée — jamais laissée ici "au cas où" une fois close.

## Points ouverts

- `GEMINI_FALLBACK_MODELS` n'a pas encore reçu la validation qualité intégrale (lecture humaine de
  tous les scénarios `check-spirit.mjs` et `check-profile.mjs` avec ce modèle comme `GEMINI_MODEL`
  effectif) — reste donc réservé au dev/simulation, jamais activé en production (cf. CLAUDE.md,
  section Smart Breaker).
- **`scripts/check-spirit.mjs` relancé cette nuit (2026-09-20), lecture PARTIELLE seulement (2/20
  scénarios).** Le script plantait au lancement (bug distinct, corrigé la même nuit — cf. entrée
  dédiée ci-dessous) ; une fois corrigé, seuls les 2 premiers scénarios ont reçu une vraie réponse
  (« ordre autoritaire » ×2, Lia et Noé) — tous deux dans le ton attendu (Lia froide et coupante,
  Noé réactif et direct, aucune servilité, aucune dérive vers un registre de service client). Les 18
  scénarios suivants ont tous échoué en 429/503 — confirmation directe (pas une supposition) que le
  quota journalier de `gemini-flash-lite-latest` est réellement épuisé sur les 3 clés configurées,
  malgré le changement de jour calendaire. **À refaire intégralement dès que le quota revient** —
  2 réponses sur 20 sont un signal encourageant mais statistiquement insuffisant pour considérer le
  registre jour/nuit (Article 13, changement du 2026-09-19) validé contre l'Article 0.
- Avant la compaction de cette session, une inquiétude avait été notée sur le recul adaptatif de
  rotation des clés Gemini (`lib/gemini-keys.ts`) : risque de sur-pénaliser un 429 transitoire
  comme s'il s'agissait d'un vrai épuisement de quota journalier. Le recul exponentiel avec reset
  au premier succès (déjà implémenté) semble répondre à cette inquiétude, mais ce lien n'a jamais
  été explicitement reconfirmé avec l'utilisateur — à vérifier avec lui plutôt que supposer réglé.
- Les paliers rares de la charte (colère réellement débridée, silence méprisant de Lia, vulnérabilité
  ou respect sincères, dispute grave Lia/Noé) restent quasiment jamais sollicités dans les 13
  premières simulations notées par EL-PROFESSOR — une future simulation Article 18 devrait les
  pousser délibérément pour vérifier qu'ils fonctionnent, pas seulement le registre habituel.
- **Premier audit THE-FINAL-JUDGE (2026-09-20, mode lourd, `docs/the-final-judge/2026-09-20-lourd.md`)** —
  points examinés et sciemment reportés avec l'utilisateur (jamais ignorés) :
  - Le bouton "reset" (`app/api/lia/route.ts`, `mode==="reset"`) n'a aucune protection serveur
    au-delà du verrou de concurrence générique — n'importe qui peut effacer l'état pour tous les
    visiteurs sans authentification. Décision explicite de l'utilisateur (2026-09-20) : reporté,
    jamais corrigé maintenant. **Contexte qui change l'urgence réelle** : la prochaine mise en ligne
    est prévue via Cloudflare dans un environnement de TEST, pas une ouverture au grand public — le
    risque réel avant la vraie mise en production reste donc faible, à réévaluer explicitement au
    moment de basculer en production réelle.
  - Le code d'accès du panneau admin (`'1980'`, sans limite de tentatives, `app/api/admin/route.ts`)
    — déjà repéré indépendamment plus tôt dans cette session, reconfirmé par THE-FINAL-JUDGE.
    Décision explicite de l'utilisateur : laissé tel quel pour l'instant (enjeu jugé faible, panneau
    de documentation seulement, jamais un accès qui modifie l'état du jeu).
  - Architecture mono-instance/mono-partie (une seule maison partagée par tous les visiteurs) —
    déjà un chantier connu et volontairement déprioritisé (Plan d'origine, point 7, "mécaniques de
    diffusion"). THE-FINAL-JUDGE conteste cette priorisation et la juge bloquante avant toute mise
    en ligne publique ; décision explicite de l'utilisateur (2026-09-20) : garder l'ordre actuel de
    la feuille de route (refonte graphique d'abord) — avis noté, priorisation inchangée.
  - Absence de rate-limit sur `/api/lia` en production et absence de CI (`.github/workflows`) —
    nouveaux constats, pas encore tranchés avec l'utilisateur, à calibrer avant la vraie mise en
    production (moins urgent le temps de l'environnement de test Cloudflare).
  - Hypothèse causale nouvelle sur la faiblesse chronique de l'Article 11 (Voix distinctes, 7,8/20
    de moyenne EL-PROFESSOR, jamais au-dessus de 12/20) : peut-être une limite structurelle de
    `gemini-flash-lite` à tenir deux voix distinctes sur 150+ tours, pas seulement un problème de
    prompt — à investiguer comme piste distincte des correctifs de prompt déjà tentés.
  - `app/chatgpt-auth.ts` (77 lignes, jamais importé nulle part) et `package.json` (`"name":
    "site-creator-vinext-starter"`, jamais renommé) — code mort et reste de gabarit de démarrage,
    mineur, pas encore traité.
- **Scan SMART-CONSO-TOKEN affiné (2026-09-20, `docs/smart-conso-token/scans/scan-2026-09-20-02-19-v2.md`)** —
  `CLAUDE.md` fait ~28 800 tokens estimés (1407 lignes), très au-delà du repère "progressive
  disclosure" (300 lignes), et c'est le SEUL document du projet réellement relu à chaque message de
  la session (les 5 autres flaggés au premier passage sont lus à la demande, taille normale, plus
  aucune action requise après affinage du scan). Une vraie liste de travail (29 asides narratives
  datées, ~1708 tokens, ligne par ligne) est déjà archivée dans
  `docs/smart-conso-token/scans/claude-md-narrative-candidates.md` — un point de départ concret pour
  la future session de restructuration, jamais appliqué automatiquement (Article 0/14). Reste à
  planifier explicitement.
- **Duplication de code entre `scripts/the-final-judge.mjs` et `scripts/the-deep-reader.mjs`
  (2026-09-20)** — `extractPersonaBlock()` est identique dans les deux fichiers, `detectGenericReport()`
  suit la même forme avec des règles spécifiques différentes. Jamais factorisé en un module partagé
  (risque de casser un outil déjà testé en refactorant dans l'urgence) — une vraie question
  ALWAYS-NEW-CODE à trancher lors d'un futur passage sur le thème « Outillage de travail ».
- **`checkHtmlWiring()` (CIRCLE-TASKS/task #144) repose sur une prémisse fausse pour
  `el-professor.mjs`/`the-final-judge.mjs`/`the-screener-capture.mjs` (2026-09-20, trouvé en
  investiguant directement le code avant de forcer un câblage, Article 19)** — contrairement à
  `kpi-report.mjs`, ces trois scripts ne calculent JAMAIS eux-mêmes de données de rapport à rendre :
  le rapport réel (notation EL-PROFESSOR, verdict THE-FINAL-JUDGE, note THE-SCREENER) est toujours
  composé en prose par l'agent qui pilote, jamais par le script. Leur demander d'importer
  `html-report.mjs` produirait un import mort, jamais réellement appelé — une fausse conformité.
  Piste réelle, pas encore tranchée avec l'utilisateur : soit corriger `checkHtmlWiring()`/le
  libellé de la tâche #144 pour ces trois outils spécifiquement, soit documenter une procédure
  côté agent (rendre la prose via `html-report.mjs` au moment de la livraison, jamais dans le
  script lui-même).
- **Piège du « reset complet » (Article 18, étape 1) trouvé le 2026-09-20 en le vivant réellement** —
  « reset complet » signifie appeler l'endpoint applicatif `mode:"reset"` (déjà fait par tous les
  scripts `full_simN.mjs` via `ensureReset()`) sur un serveur de dev déjà démarré, **jamais** effacer
  à la main le fichier sqlite local de D1
  (`.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite`) : ce fichier porte aussi le SCHÉMA
  (tables `agent_state`/`conversations`/`memories`/`world_lock`, etc.), pas seulement les données de
  la partie en cours — le supprimer casse le serveur (`503 "mémoire de la maison indisponible"`)
  jusqu'à ce que les migrations Drizzle (`drizzle/*.sql`) soient réappliquées à la main, car aucun
  mécanisme du projet ne les réapplique automatiquement (`vite.config.ts` ne passe pas de
  `migrations_dir` au plugin Cloudflare) et il n'existe pas de `wrangler.toml` autonome permettant
  d'utiliser `wrangler d1 migrations apply --local` directement. Récupéré ce jour en rejouant les 7
  fichiers `drizzle/0*.sql` dans l'ordre via `node:sqlite` (`DatabaseSync`) directement sur le
  fichier — fonctionne, mais contourne la table de suivi `d1_migrations` que `wrangler` utilise
  normalement pour l'idempotence : si quelqu'un lance un jour `wrangler d1 migrations apply --local`
  sur cette base réparée à la main, il tentera de rejouer des migrations déjà présentes (probable
  `table already exists`). Pas corrigé activement ce soir (aucun signe qu'un tel appel `wrangler d1`
  existe ailleurs dans le projet — cf. recherche exhaustive du 2026-09-20, rien trouvé) ; à garder en
  tête si ce mode d'usage apparaît un jour. Le vrai correctif de fond est comportemental, pas du
  code : ne plus jamais effacer ce fichier soi-même pour un « reset complet ».
