# AXA-CHECK — instanciation pour Maison IA vivante

*(Cf. `docs/axa-check-blueprint.md` pour le principe générique. Créé le 2026-09-19, à la demande
explicite de l'utilisateur : « je veux un nouvel outil : axa-check qui identifie les zones fragiles
ou faibles du code et qui sait remonter cette information [...] axa-check peut être sollicité par
les autres outils comme clean-dirty ». Rejoint l'Article 20 de `CLAUDE.md` comme troisième membre
"toujours déployé", aux côtés d'ARGUS et HARMONIA.)*

## Ce qui existe aujourd'hui

- **`scripts/axa-check.mjs`** — toute la mécanique : `functionCoverageFromV8()` (extrait la
  couverture par fonction d'un relevé V8 brut), `robustnessScore()` (% de fonctions couvertes,
  `undefined` honnête sur zéro fonction), `fragileFunctions()` (fragilité enrichie), `LIB_MAP` +
  `collectCoverage()` (lit un dossier `NODE_V8_COVERAGE` déjà produit et mappe vers le vrai fichier
  source), `corroboratedByArchivedSimulations()` (seconde preuve, niveau zone). `main()` orchestre
  un passage complet autonome (lance `check-house.mjs` avec la couverture activée, affiche le
  rapport) — utilisable seul ou par un appelant qui réutilise `collectCoverage()`/`robustnessScore()`
  sur un relevé qu'il a déjà produit lui-même (cf. `kpi-report.mjs`).

## Mécanique réelle utilisée dans ce projet

`scripts/check-house.mjs` transpile déjà chaque module de `lib/*.ts` (et `app/api/lia/route.ts`)
avec le vrai compilateur TypeScript (`ts.transpileModule`, sans minification) vers
`.sites-runtime/test-*.mjs`, préservant les numéros de ligne 1:1 — exactement la condition que le
blueprint générique demande pour que `NODE_V8_COVERAGE` (déjà intégré à Node.js, zéro nouvelle
dépendance) reste exploitable contre le vrai code source. `LIB_MAP` reflète la liste EXACTE des 21
fichiers `lib/*.ts` transpilés par `check-house.mjs` plus le cas particulier
`app/api/lia/route.ts` → à resynchroniser manuellement si `check-house.mjs` change cette liste
(Article 13 : un fichier absent d'ici serait invisible pour AXA-CHECK sans aucun avertissement).

## Granularité — par fonction (décision de calibrage explicite)

Confirmé par calibrage (Article 16) : la fonction est le grain choisi, jamais la ligne ni le
fichier. Une fonction anonyme non nommée par V8 est honnêtement exclue du calcul plutôt que
rapportée sous un nom vide trompeur.

## Fragilité enrichie — deux sources indépendantes, jamais un simple miroir de la robustesse

Confirmé par calibrage explicite : la fragilité d'une fonction non couverte gagne en confiance
(`à surveiller` → `probable`) quand elle correspond à au moins une de ces deux conditions,
chacune nommée explicitement dans le résultat :
- **Proximité avec un nœud sensible HARMONIA** (`SENSITIVE_NODES`, réutilisé tel quel depuis
  `scripts/check-level-target.mjs`, jamais une seconde carte séparée).
- **Signal de churn "accumulation pure"** (`churnSignal()`, réutilisé tel quel depuis
  `scripts/always-new-code.mjs` — un fichier avec 5+ commits et zéro suppression jamais observée).

## Seconde preuve — corroboration par les 11 simulations archivées (niveau zone)

Confirmé par calibrage explicite : `docs/simulations/*_actions.txt` (cf. Article 18, étape 3bis)
est consulté au niveau ZONE (les mêmes 8 thèmes qu'ALWAYS-NEW-CODE/HARMONIA, via `FILE_TO_ZONES`,
l'inverse de `THEME_PRIMARY_FILE` — jamais une seconde carte séparée) via `ZONE_EVENT_HINTS`, des
motifs qui reconnaissent le format réel `"[round N] TYPE — détail"` produit par
`scripts/summarize-simulation-log.mjs`. Bug réel trouvé et corrigé le jour même de la construction
de cet outil : la première version de ces motifs cherchait un texte `"type: X"` qui n'apparaît nulle
part dans le vrai format, donnant silencieusement 0 corroboration partout — corrigé en confrontant
le motif au vrai fichier archivé, jamais supposé correct sur la seule lecture du code qui l'a écrit
(Article 3).

## Déclenchement — toujours déployé, rejoint l'Article 20

Confirmé par calibrage explicite : AXA-CHECK rejoint ARGUS et HARMONIA comme troisième outil
"toujours déployé" de l'Article 20 de `CLAUDE.md` — jamais un nouvel Article dédié, sa partie
mécanique tourne à chaque changement de code comme les deux autres.

## KPI — intégré à la famille existante, jamais un nouveau tableau

Confirmé par calibrage explicite : la couverture réelle par fonction rejoint la famille
"Robustesse du code" déjà existante de `scripts/kpi-report.mjs` (`codeHealthScore()`), comme un
troisième terme de la moyenne aux côtés de la propreté `tsc` et du taux de réussite de la suite de
tests — jamais un tableau de bord séparé. `kpi-report.mjs::runTestSuite()` réutilise le MÊME
lancement de `check-house.mjs` (avec `NODE_V8_COVERAGE` activé sur ce lancement) pour nourrir à la
fois son propre calcul de réussite ET la couverture AXA-CHECK, jamais un second lancement redondant
(règle anti-doublon, `docs/regles-de-travail.md` §7ter).

## Rejoint la boîte à outils d'HYPER-SCAN-CHECKPOINT

Confirmé par calibrage explicite : un passage HYPER-SCAN-CHECKPOINT (même en version légère)
inclut désormais un passage AXA-CHECK, affiché dans la console ET archivé dans le rapport `.txt`
(section `=== AXA-CHECK ===`), aux côtés d'ARGUS/HARMONIA/ALWAYS-NEW-CODE.

## Consulté par LE-COORDINATEUR

`scripts/le-coordinateur.mjs` importe directement `collectCoverage()`/`robustnessScore()` (jamais
une réimplémentation) pour afficher la couverture réelle dans son tableau de synthèse — même
lancement partagé de `check-house.mjs` que pour ses propres résultats de test, jamais un second.

## Limite honnête

Une ligne exécutée par un test n'est pas une ligne prouvée juste — AXA-CHECK mesure un signal
d'exécution, jamais une garantie de correction. La corroboration par simulation reste au niveau
zone, jamais fonction (le journal archivé ne trace que des événements discrets). Le mapping
zone→fichier (`FILE_TO_ZONES`, hérité de `THEME_PRIMARY_FILE`) hérite de l'approximation déjà
documentée pour ALWAYS-NEW-CODE.
