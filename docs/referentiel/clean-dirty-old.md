# CLEAN-DIRTY-OLD — instanciation pour Maison IA vivante

*(Cf. `docs/clean-dirty-old-blueprint.md` pour le principe générique. Créé le 2026-09-19, calibré
par plusieurs échanges au fil de la même session — la question posée pendant ce calibrage a
directement fait naître AXA-CHECK en cours de route. Rejoint l'Article 20 de `CLAUDE.md` comme
quatrième membre "toujours déployé", aux côtés d'ARGUS, HARMONIA et AXA-CHECK.)*

## Ce qui existe aujourd'hui

- **`scripts/clean-dirty-old.mjs`** — `relativeStaleness()` (stagnation relative à la médiane du
  projet, jamais un seuil de date fixe), `prioritizeStaleFiles()` (proximité d'un nœud sensible
  HARMONIA d'abord, calibrage explicite), `delegationQuestions()` (les trois questions déléguées à
  ARGUS/HARMONIA/ALWAYS-NEW-CODE, jamais une réponse fabriquée), `cleanDirtyOldPerformance()` (KPI
  dès le premier passage, réutilise `scripts/lib-markdown-table.mjs` comme ALWAYS-NEW-CODE). `main()`
  orchestre un passage complet : calcule la dernière date de modification de chaque fichier
  `lib/*.ts`/`app/api/lia/route.ts` (`LIB_MAP`, réutilisé depuis AXA-CHECK), lance UNE fois
  `check-house.mjs` avec `NODE_V8_COVERAGE` pour le renforcement par couverture (réutilise
  `collectCoverage()`/`robustnessScore()` d'AXA-CHECK, jamais un second calcul), et imprime le
  rapport.
- **`docs/clean-dirty-old/`** — dossier des passages + `index.md` (mémoire du KPI).

## Stagnation relative — seuils choisis pour ce projet

`MIN_ABSOLUTE_DAYS = 30` et `RELATIVE_FACTOR = 2.5` : un fichier est signalé s'il n'a pas bougé
depuis au moins 30 jours ET que ce délai dépasse 2,5× la médiane du reste des fichiers suivis. Ces
deux chiffres sont propres à ce projet à cet instant — à recalibrer si l'expérience montre qu'ils
sont trop ou trop peu sensibles (même discipline que les seuils mécaniques d'ALWAYS-NEW-CODE).
Premier passage réel (2026-09-19, jour de la création) : zéro zone signalée — cohérent avec un
projet en développement continu et intense, où aucun fichier `lib/*.ts` ne s'est vraiment figé.

## Renforcement par couverture — réutilise AXA-CHECK, jamais un second calcul

Un fichier stagnant dont la couverture de test (AXA-CHECK) est également faible (<60%) voit ce
double signal explicitement nommé dans le rapport — jamais un chiffre composite opaque qui
mélangerait les deux sources.

## Priorisation — nœuds sensibles HARMONIA d'abord (calibrage explicite du 2026-09-19)

`SENSITIVE_NODES`, réutilisé tel quel depuis `scripts/check-level-target.mjs` (même carte qu'AXA-
CHECK), détermine quelles zones stagnantes remontent en premier dans le rapport — jamais un second
classement par ancienneté pure, sauf à égalité de sensibilité.

## Trois questions déléguées, jamais une réponse fabriquée

`delegationQuestions()` nomme explicitement ARGUS, HARMONIA et ALWAYS-NEW-CODE pour chaque zone
signalée, avec la ou les zones concernées (`FILE_TO_ZONES`, réutilisé tel quel depuis AXA-CHECK,
jamais une troisième carte séparée) — CLEAN-DIRTY-OLD ne répond jamais lui-même à aucune des trois.

## Déclenchement — toujours déployé, rejoint l'Article 20 (calibrage explicite)

Confirmé par calibrage explicite du 2026-09-19 : contrairement à ALWAYS-NEW-CODE (réservé au
niveau "Exceptionnel"), CLEAN-DIRTY-OLD tourne automatiquement à chaque changement de code, comme
ARGUS/HARMONIA/AXA-CHECK — sa partie de calcul étant entièrement gratuite (quelques appels git +
réutilisation d'une couverture déjà produite ailleurs).

**Écart réel trouvé et corrigé le 2026-09-21** (même trouvaille que pour AXA-CHECK ci-dessus,
question directe de l'utilisateur sur les priorités de scan de l'équipe noyau) : jusqu'à ce jour, ce
paragraphe était également faux en pratique — seule sa logique était testée par `check-house.mjs`
(fixtures), son vrai calcul de stagnation relative (`git log -1` par fichier de `LIB_MAP` +
`relativeStaleness()`) n'avait jamais tourné qu'à la main via `runNetworkCheck()`. Corrigé : le même
crochet `check-last-commit.mjs` (post-commit) appelle désormais réellement `lastTouchDays()` +
`relativeStaleness()` sur les vrais fichiers du projet à chaque commit, coût minime (un seul appel
git par fichier, aucune instrumentation lourde contrairement à AXA-CHECK).

## Rejoint la boîte à outils d'HYPER-SCAN-CHECKPOINT et LE-COORDINATEUR

Un passage HYPER-SCAN-CHECKPOINT (même en version légère) inclut désormais un passage CLEAN-DIRTY-
OLD, affiché dans la console ET archivé dans le rapport `.txt` (section `=== CLEAN-DIRTY-OLD ===`).
`scripts/le-coordinateur.mjs` affiche également une ligne de synthèse (nombre de zones stagnantes),
en réutilisant `lastTouchDays()`/`relativeStaleness()` directement plutôt que de relancer
`check-house.mjs` une seconde fois pour ce seul signal.

## Limite honnête, connue et acceptée

**Inefficacité mineure connue** (2026-09-19, notée en construisant l'outil, jamais masquée) : un
passage HYPER-SCAN-CHECKPOINT complet relance désormais `check-house.mjs` plusieurs fois de suite
(une fois pour AXA-CHECK, une fois pour CLEAN-DIRTY-OLD, une fois pour sa propre section "Suite de
tests") — un coût en temps CPU local uniquement (zéro appel API réel, donc hors du champ de
l'Article 8), mais une vraie redondance qui gagnerait à être partagée en un seul lancement. Laissé
tel quel pour l'instant (chaque outil reste indépendamment exécutable seul, ce qui a sa propre
valeur) — candidat naturel pour un futur passage ALWAYS-NEW-CODE sur la zone
"Infrastructure / Outillage" si cette redondance devient gênante.

Le mapping zone→fichier hérité d'AXA-CHECK/ALWAYS-NEW-CODE reste approximatif (déjà documenté pour
ces deux outils) ; les seuils de stagnation ci-dessus sont calibrés sur ce projet à un instant donné.
