<!-- DOCUMENT GÉNÉRÉ — produit intégralement par un outil, aucune ligne n'est écrite à la main -->
# Le module, la partie indétachable, le cœur — tes trois définitions mises à l'épreuve

> Produit par `node scripts/le-coordinateur.mjs coeur` le 2026-10-03, sur le graphe réel des imports.
> Tu demandais : « ai-je bien compris ta vision ? » — voici la réponse que le dépôt donne, pas celle que j'ai en tête.

## ① Ta définition d'un MODULE, confrontée au catalogue réel

> « Un module est **un ensemble d'agents** qui œuvrent dans un sens commun pour produire UNE PRESTATION. »

| Nombre d'outils derrière une prestation | Combien de prestations |
|---|---|
| 1 | 71 |
| 2 | 2 |
| 3 | 2 |
| 8 | 1 |

**71 prestations sur 76 ne sont portées que par UN SEUL outil.** Ta définition dit « un ensemble » ;
le catalogue d'aujourd'hui dit « un outil ». Ce n'est pas que ta définition soit fausse — c'est qu'elle décrit
une CIBLE et non l'état actuel. Et le dire est plus utile que de faire comme si les deux coïncidaient.

## ② Ta définition de la PARTIE INDÉTACHABLE, prise au mot

> « La partie indétachable est **ce que toute prestation réclame quoi qu'il arrive**. »

Prise à la lettre — ce que les **88 points d'entrée** atteignent TOUS — elle rend **1 fichier(s)** :

- `scripts/lib-json.mjs` — importé directement par 10 fichier(s)

**Ce n'est pas une erreur de mesure, c'est la réponse exacte à la question exacte** : il suffit d'un outil
autonome pour vider une intersection. Ce que ça dit vraiment, et c'est important pour ta question
« est-ce réaliste ? » : **l'Agence est déjà presque entièrement modulaire.** Ses outils ne partagent presque rien.
Ce qui manque n'est pas la modularité — c'est le cœur.

## ③ Le CŒUR, dérivé et non décrété

> « Le cœur est **le cœur de la partie indétachable** », et : « encore faut-il définir le cœur ».

Au lieu d'une intersection tout-ou-rien, on mesure **quelle part des points d'entrée atteint chaque fichier**,
et on coupe **au plus grand saut de la distribution** — jamais à un seuil rond, qui pourrait tomber au milieu
d'un palier sans que personne puisse dire pourquoi là.

**Le saut est de 38 points d'entrée**, et il est franc. Le cœur est donc de **4 fichiers** :

| Fichier | Atteint par |
|---|---|
| `scripts/lib-json.mjs` | 88 / 88 (100 %) |
| `scripts/tool-usage.mjs` | 87 / 88 (99 %) |
| `scripts/lib-shell.mjs` | 85 / 88 (97 %) |
| `scripts/report-template.mjs` | 83 / 88 (94 %) |

Les 52 fichiers suivants retombent sous la barre, le premier d'entre eux à 51 %.

## ④ Les dix fichiers les plus partagés, pour voir la pente

| Part des points d'entrée | Fichier |
|---|---|
| 100 % | `scripts/lib-json.mjs` |
| 99 % | `scripts/tool-usage.mjs` |
| 97 % | `scripts/lib-shell.mjs` |
| 94 % | `scripts/report-template.mjs` |
| 51 % | `scripts/html-report.mjs` |
| 50 % | `scripts/corpus-mesure.mjs` |
| 48 % | `scripts/serie-temporelle.mjs` |
| 44 % | `scripts/lib-markdown-table.mjs` |
| 44 % | `scripts/priorites.mjs` |
| 43 % | `scripts/criticite.mjs` |

## ⑤ Ce que cette mesure NE dit pas, et c'est la moitié du sujet

Elle lit les **imports**, donc elle voit ce qu'un outil CHARGE — jamais ce qu'il SUPPOSE. Un outil qui lit
`docs/suivi/` sans importer personne n'apparaît lié à rien ici, et reste pourtant inséparable de ce dépôt.
C'est l'autre moitié du sujet, déjà mesurée le 30 septembre : **5 % seulement** des fichiers du noyau ont
toutes leurs ancres réglables de l'extérieur. Les deux se lisent ensemble, jamais l'une à la place de l'autre.

# PLAN D'ACTION

| État | Constat | Suite |
|---|---|---|
| ✅ MESURÉ | ta définition du module décrit une CIBLE : 71 prestations sur 76 n'ont qu'un seul outil aujourd'hui | #1538 |
| ✅ MESURÉ | prise au mot, la partie indétachable est de 1 fichier(s) — l'Agence est déjà presque entièrement modulaire | #1538 |
| ✅ MESURÉ | le cœur, dérivé du plus grand saut de la distribution : 4 fichiers, de 94 % à 100 % | #1538 |
| ? À TRANCHER | ta définition du module décrit la cible : faut-il la garder telle quelle, ou la reformuler pour décrire aussi l'état actuel ? | #1538 |
| ? À INSTRUIRE | 1 entrée(s) du catalogue nomment un « outil » dont aucun script n'existe : docs/simulations/correctifs-a-revalider.md | #1538 |

<!-- /DOCUMENT GÉNÉRÉ -->
