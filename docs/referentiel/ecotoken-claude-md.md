# ecotoken-claude.md — instanciation pour ce projet

*(Tâche #359, 2026-09-22. Nom choisi par l'utilisateur, puis corrigé le même soir de
« claude.md-ecotoken » à « ecotoken-claude.md » pour éviter la confusion avec CLAUDE.md lui-même.
Fichier technique : `scripts/ecotoken-claude-md.mjs`. Principe générique :
`docs/ecotoken-claude-md-blueprint.md`. Registre des passages : `docs/ecotoken-claude-md/index.md`.)*

## Ce que la première mesure a trouvé

**CLAUDE.md : 29 606 tokens, 1 471 lignes**, rechargé à chaque message.

**Aucun article n'est orphelin** — les 25 sont réellement cités ailleurs dans le dépôt. Le gras
n'est donc pas dans leur existence. Les articles ne pèsent que **568 lignes sur 1 471** : les
**903 lignes restantes (61 %)** sont hors charte.

Rendement extrême des deux bouts : l'Article 3 vaut **40,7** (3 lignes, 122 citations) et
l'Article 0 **34,3** (4 lignes, 137 citations) — ultra-rentables. L'Article 19 tombe à **0,7**,
non parce qu'il serait inutile, mais parce qu'il absorbe toute la section Smart Breaker qui le suit
sans être un article.

**Plan mesuré : ~12 600 tokens récupérables, soit 41 % de la charte.**

| Stratégie | Cible | Gain |
|---|---|---|
| catalogue | 21 sections « … — blueprint exportable » | ~5 519 tk |
| extraction | « Référentiel technique » | ~4 190 tk |
| extraction | « Plan d'origine (analyse Opus) » | ~2 293 tk |
| déjà mécanisé | 3 passages décrivant une procédure qu'un crochet applique déjà | ~533 tk |
| asides | 3 apartés narratifs datés | ~89 tk |

## Les 16 outils réellement automatisés par les crochets

Lus dans les crochets eux-mêmes, jamais recopiés (Article 24) : `check-house`, `check-argus`,
`check-harmonia`, `axa-check`, `clean-dirty-old`, `clone-hunter`, `always-new-code`, `el-professor`,
`le-coordinateur`, `tool-brain`, `smart-conso-token`, `circle-tasks`, `check-tasks-details`,
`check-suivi-fidelity`, `lib-shell`, `ecotoken-claude-md`.

Le pre-commit **bloque** sur `check-house.mjs` et `tsc`. Le post-commit **avertit** sur tout le
reste. Une consigne de la charte demandant de lancer l'un d'eux à la main est donc, pour sa partie
procédurale, un coup d'épée dans l'eau.

## Deux précisions honnêtes sur ce sujet

**CLAUDE.md ne contient aucun script exécutable.** Un seul bloc de code sur tout le fichier (le
schéma de hiérarchie tool-brain) et quatre commandes simplement citées en exemple. Rien ne
s'exécute à l'ouverture — c'est du texte pur chargé dans le contexte. Le gaspillage réel n'est pas
une exécution inutile, c'est une **relecture** inutile.

**« Déjà mécanisé » ne veut jamais dire « inutile ».** La règle reste vraie, et savoir que la
vérification a lieu change la façon de travailler. Ce qui devient superflu, c'est la procédure
détaillée — « comment lancer, quand, dans quel ordre » — quand aucune main humaine ne déclenche
plus rien.

## Branchements réels

- **SMART-CONSO-TOKEN** — ecotoken importe `estimateTokens`, `measureClaudeMdWeight`,
  `buildClaudeMdRuleTable`, `listDatedNarrativeMarkers`. En retour, `scanDocumentWeight()` pointe
  vers la commande d'ecotoken **par son texte**, jamais par un import (cycle).
- **CIRCLE-TASKS** — l'item existant `claude-md-weight-signal` lance ecotoken. **Harmonisation
  explicite : un seul item de Ronde sur le sujet CLAUDE.md, jamais deux.** Le registre
  `docs/ecotoken-claude-md/` est déclaré dans `CIRCLE_EXCLUDED_REGISTRIES` avec cette raison.
- **LE-COORDINATEUR** — 14e ligne de la synthèse réseau : le budget de la charte, lecture seule.
- **Crochet post-commit** — `node scripts/ecotoken-claude-md.mjs budget`, non bloquant.
- **circle-process-guardian** — la modification de l'item est consignée dans
  `CIRCLE_ITEMS_CHANGELOG`, avec son garde-fou `findItemsMissingFromChangelog()`.

## Trois bugs trouvés par ses propres tests

1. Une proposition à **gain négatif** : sur une petite famille, l'en-tête du catalogue coûtait plus
   cher que les sections remplacées. Filtre posé une seule fois à la sortie (Article 3).
2. Un **double comptage** : AXA-CHECK et find-booster étaient proposés à la fois en catalogue et en
   extraction, gonflant le gain d'environ 2 200 tokens inencaissables.
3. Un **faux positif de découpage** : une liste à puces sans ligne vide comptait pour un seul
   paragraphe, faisant remonter les 193 lignes du Référentiel technique d'un bloc (~3 900 tokens)
   parce qu'une seule de ses entrées contenait le mot « consulter ».

## Le réveil conditionnel des Gardiens (tâche #362) — un sujet voisin, pas le même

Ouvert par une question de l'utilisateur dans la même session. Le mécanisme vit dans
`scripts/lib-shell.mjs` (`GARDIEN_DOMAINS`, `NOT_REALLY_CODE`, `gardienShouldRun()`), pas dans
ecotoken — ce sont deux dépenses différentes : ecotoken traite le coût en TOKENS d'un document
toujours chargé, le réveil conditionnel traite le coût en TEMPS de vérifications qui tournent à
vide.

**La distinction qui gouverne tout, actée explicitement :**

| | Ce qui tourne | Effet | Conditionné ? |
|---|---|---|---|
| **GARANTIT** | `check-house.mjs` + `tsc` (pre-commit) | **Bloque** le commit | **Jamais** — conditionner créerait un trou |
| **RENFORCE** | Les 6 Gardiens (post-commit) | Signale, n'a jamais rien bloqué | Oui |

**La cause racine, mesurée :** sur 20 commits, 18 ne touchaient `lib/` que par `lib/reference.ts` —
le référentiel AFFICHÉ en jeu, de la donnée narrative incrémentée à chaque commit. Il faisait passer
tout commit pour un changement de moteur. `NOT_REALLY_CODE` l'exclut, et c'est ce seul exclusion qui
débloque tout le reste.

**Deux chemins de prudence, non négociables :** un Gardien absent de la table tourne toujours, et si
git ne dit pas ce qui a changé, tout tourne. Ne pas savoir n'autorise jamais à se taire.
