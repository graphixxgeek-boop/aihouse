# find-brain — fiche d'instanciation

## Ce qu'il sert ici

`scripts/find-brain.mjs` (2026-09-21, 93 lignes) : décide, pour UN fichier donné, s'il faut lancer
**find-booster** (navigation par concept), **find-deep-booster** (points de découpe), les deux, ou
aucun.

## Pourquoi il existe dans CE projet

Demande explicite de l'utilisateur : « je veux un cerveau intelligent "find-brain" qui englobe les 2
scripts find-booster et find-deep-booster pour plus d'efficacité dans les recherches […] tu dois
être pluggé en priorité à ce cerveau qui te rappelle d'utiliser ces 2 outils le plus souvent
possible ».

Le besoin était réel et mesuré : `app/api/lia/route.ts` est un monolithe dense, et les deux outils
existaient déjà séparément sans que rien ne dise lequel convenait.

## Ce qu'il ne recalcule jamais

Il importe `recommendFindBooster()` (`find-booster.mjs`) et `proposeDecomposition()`
(`route-booster.mjs`) **telles quelles** — Article 3 : jamais un second calcul de poids ni de points
de coupe. Son seul travail propre est le jugement supplémentaire.

## Le surnom, et sa nature exacte

`FIND_DEEP_BOOSTER_NICKNAME = "find-deep-booster"` désigne `scripts/route-booster.mjs`.
**Surnom d'affichage uniquement** — même patron que memory-audit et Smart Conso API (tâche #172,
arbitrage « surnom vs renommage de fichier → surnom, fichier technique inchangé »). Le fichier reste
`scripts/route-booster.mjs` sur le disque, jamais renommé, jamais réimporté sous un autre nom.

## Les seuils réels

| Constante | Valeur | Ce qu'elle gouverne |
|---|---|---|
| `MONOLITH_LINE_THRESHOLD` | 500 | en dessous, aucune décomposition proposée |
| `MIN_CUT_POINTS` | 2 | un point de coupe isolé n'est pas une découpe |

## Qui l'appelle ici, et qui ne doit PAS l'appeler

**tool-brain, et lui seul.** `adviseToolBrain()` appelle `recommendFindBrain()` en interne. La
charte l'écrit noir sur blanc : avant toute recherche dans un fichier existant, on consulte
`node scripts/tool-brain.mjs "<tâche>" --file <fichier>` — **jamais** find-brain, find-booster ou
find-deep-booster directement. La raison est celle de la hiérarchie : sollicité seul, find-brain ne
dirait jamais qu'un autre outil du catalogue répondait mieux.

## Son garde-fou

`flagFindDeepBoosterCandidates(REGISTRIES)` balaie les scripts déclarés et signale ceux devenus
candidats depuis le dernier passage. Sans lui, la recommandation ne porterait que sur les fichiers
auxquels on pense déjà — or un fichier grossit précisément sans qu'on y pense.

## Sa limite ici

Il juge la FORME d'un fichier, jamais l'intention de la recherche. Un `recommendFindBrain()` qui ne
recommande rien ne dit pas « il n'y a rien à trouver » : il dit « ce fichier ne justifie pas
d'outillage particulier pour être lu ».
