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
- **THE-SCREENER n'a jamais produit un vrai rapport, malgré plusieurs simulations complètes depuis
  sa construction (2026-09-22, question directe de l'utilisateur)** — vérifié dans le registre réel :
  `docs/the-screener/index.md` affirme toujours « Aucun passage archivé pour l'instant », malgré
  full_sim10/11/16/17 exécutées depuis. Cause confirmée : le mécanisme de capture
  (`scripts/the-screener-capture.mjs`) est testé et fonctionnel EN ISOLATION, mais n'a jamais été
  réellement déclenché PENDANT une simulation Article 18 — la fermeture automatique des popups
  d'accueil et le raccordement des 2 déclencheurs (état courant / moment distinctif) à l'état réel
  de la partie restent, comme noté depuis le 2026-09-19/20, « à faire au moment de la prochaine
  simulation » sans que personne (agent inclus) n'y soit jamais revenu. Un vrai oubli process, pas
  une décision assumée — à corriger avant ou pendant la refonte graphique (cf.
  `docs/referentiel/regles-des-graphismes.md`, où l'utilisateur prévoit justement de « booster » cet
  agent). Effet de bord noté au passage : le signal de fraîcheur de Doc-Report (mtime du dernier
  commit touchant le dossier) affiche un âge récent même quand ce dossier ne contient qu'un
  `index.md` jamais réellement peuplé — une limite honnête de cette heuristique (elle mesure quand
  le DOSSIER a été touché, pas si un vrai rapport y a été ajouté), à garder en tête en lisant ce
  signal pour un registre encore vide, pas un bug à corriger d'urgence.
- **Idée non tranchée : un « mode simu » pour CLONE-HUNTER, distinct du mode code existant
  (2026-09-22, question directe de l'utilisateur)** — test réel effectué sur les deux pensées mot
  pour mot identiques trouvées dans full_sim17 (« Noé m'intrigue... » vs « Lia m'intrigue... ») :
  le détecteur v2 (renommage bijectif) ne les reconnaît PAS comme un cas de renommage, alors que
  c'est exactement le cas qu'il est censé couvrir. Cause confirmée : `TOKEN_RE`
  (`scripts/clone-hunter.mjs`) ne reconnaît que les lettres ASCII — « Noé » se scinde en deux
  tokens (« No » + « é ») alors que « Lia » reste un seul token, cassant l'égalité de longueur que
  `matchLineTokens()` exige. Un « mode simu » (déclenché après chaque simulation, jamais à chaque
  commit comme le mode code) nécessiterait donc d'abord d'étendre `TOKEN_RE` aux lettres
  accentuées — pourrait ensuite pré-repérer des zones candidates à la répétition pour EL-PROFESSOR,
  jamais remplacer son jugement. Question connexe posée le même soir, vérifiée : find-booster ne
  reconnaît pas non plus la structure d'un transcript aujourd'hui (aucun de ses 4 motifs ne
  correspond au format réel acteur/pièce/horodatage/texte) — nécessiterait un 5e motif dédié
  réutilisant `parseTranscriptToDialogueBlocks()`. Rien construit, idée à reprendre si le besoin de
  repérage mécanique dans les transcripts devient concret.
- **Idée non tranchée : compaction progressive des journaux locaux (brut → résumé → résumé de
  résumés), Doc-Report/`LOCAL_JOURNALS`** — mentionnée en session mais jamais réellement spécifiée
  ni consignée nulle part ailleurs que dans l'aide-mémoire de tâches interne à l'agent (l'écart de
  process exact que la discipline "idée dite en avance → fichier dédié" existe pour éviter, cf.
  `docs/regles-de-travail.md` — corrigé ici en la faisant enfin atterrir dans un vrai registre).
  **Vérifié en direct (2026-09-22, mode nocturne autonome) que ce n'est PAS encore un problème
  réel** : les 9 journaux `LOCAL_JOURNALS` présents dans ce conteneur pèsent tous entre quelques
  centaines d'octets et 33 Ko (`.gemini-key-health.json`, le plus gros) — rien qui justifie une
  compaction aujourd'hui. Idée à reprendre concrètement le jour où un journal réel dépasse une
  taille gênante (à observer via `auditLocalJournals()`, déjà câblé), avec un vrai round de
  calibrage sur ce que "résumé" et "résumé de résumés" signifient précisément pour chaque type de
  journal (un historique de statuts clé/modèle n'a pas la même structure qu'un compteur d'usage) —
  jamais une implémentation devinée sans cette clarification.
- **ALWAYS-NEW-CODE (Article 23) : premier vrai passage effectué le 2026-09-21 (zone Fatigue),
  2 trouvailles confirmées en attente de décision utilisateur** — cf.
  `docs/always-new-code/2026-09-21-fatigue.md` pour le détail complet : (1) le seuil de sommeil
  (`fatigue>=68`) est dupliqué en toutes lettres dans le prompt de `lib/lia.ts`, sans constante
  partagée avec `lib/simulation.ts:96` — un futur rééquilibrage pourrait faire diverger les deux
  sans avertissement ; (2) `cyclePosition(round)===0&&round>0` ("l'aube") est retapé à l'identique
  deux fois dans `app/api/lia/route.ts`, alors que `lib/daynight.ts` exporte déjà `isNight()`/
  `isMidnight()` pour éviter exactement ce risque — aucun `isDawn()` équivalent n'a jamais été créé.
  Aucun changement appliqué (Article 23 : jamais automatique) — questions de calibrage préparées
  pour le retour de l'utilisateur. Les 7 autres zones (Cycle jour/nuit, Enquête, Bonus roulette,
  Appréciation de l'observateur, Dossier retourné, Déplacements/espace, Relation Lia/Noé) restent
  toutes à égalité de fraîcheur (jamais examinées).
- **Badge / couverture : les signaux ARGUS et CLONE-HUNTER sont mesurés à l'échelle du DÉPÔT, pas
  de l'outil** (constaté le 2026-09-22 en fiabilisant le relevé partagé des 6 Gardiens sacrés). Conséquence
  visible depuis que tous les afficheurs lisent enfin ces signaux : un outil parfaitement propre
  affiche quand même `partiel (KO ARGUS, KO CLONE-HUNTER)` parce qu'une trouvaille existe quelque
  part dans le dépôt. Ce n'est pas une régression (le crochet post-commit passait déjà ces mêmes
  comptes globaux à tous les outils) — c'est une imprécision devenue visible. **Pas corrigeable
  uniformément aujourd'hui** : la couche mécanique d'ARGUS ne scanne que les champs de `lib/life.ts`
  et des marqueurs TODO, elle ne produit AUCUNE trouvaille attribuable à un script d'outil ;
  CLEAN-DIRTY-OLD et CLONE-HUNTER, eux, nomment bien des fichiers et seraient attribuables. Deux
  lectures légitimes du palier, à trancher avec l'utilisateur avant de coder quoi que ce soit :
  « OK 100% » veut-il dire « ce réseau d'outils est au vert » (lecture actuelle, signaux globaux) ou
  « CET outil est au vert » (attribution par fichier, possible pour 3 Gardiens sacrés sur 6 seulement, donc
  un palier qui mélangerait deux échelles) ? Aucun changement appliqué — le libellé exact
  `KO <NOM>` est calibré par l'utilisateur (tâche #226), il n'est pas modifié sans sa décision.
- **Réveil conditionnel des Gardiens sacrés : un Gardien sacré peut dormir indéfiniment** (2026-09-22, trouvé en
  vérifiant l'intuition de l'utilisateur sur ARGUS/HARMONIA et la Ronde). `gardienShouldRun()`
  (`lib-shell.mjs`) ne réveille un Gardien sacré que si un fichier de SON domaine a changé — sur un commit
  réel de cette session, 5 des 6 ont dormi. C'est voulu (ne pas relancer six scans pour une
  correction de commentaire), mais rien ne RATTRAPE un Gardien sacré resté muet longtemps : ni le
  post-commit (qui vient justement de le laisser dormir), ni la Ronde (dont il est absent, à raison,
  puisqu'il est censé tourner au commit). Un outil peut donc ne pas avoir été scanné depuis des
  jours sans que personne ne le sache. Piste retenue mais non implémentée, en attente de décision :
  un item de Ronde « tel Gardien sacré n'a pas tourné depuis N commits, on le relance une fois » plutôt
  que six items qui referaient à l'identique le scan d'il y a trois minutes.
