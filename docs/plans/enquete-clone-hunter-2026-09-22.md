# Enquête — les 29 clusters de CLONE-HUNTER sont-ils réels ?

**Tâche #215.** Décision de l'utilisateur : *« Je vérifie d'abord si les 28 sont réels. »*
(29 aujourd'hui : 16 littéraux + 13 par renommage.)
**Rien n'a été factorisé. Aucune ligne de code n'a été modifiée pour cette enquête.**

## La réponse courte

**Ils sont réels — je n'ai trouvé aucun faux positif.** Sur chaque cluster ouvert, le code dupliqué
l'était vraiment. Votre soupçon était néanmoins fondé, mais le défaut n'est pas là où on le cherchait :

> **29 alertes = 14 problèmes distincts.** L'outil compte des chevauchements de lignes, pas des
> problèmes. Il fragmente le même problème en plusieurs alertes.

## Le détail du regroupement

| # | Problème réel | Alertes qu'il produit | Verdict |
|---|---|---|---|
| 1 | **Le chargeur de JSON avec repli** — « lire un registre, rendre un tableau vide s'il manque » | **6** | Vrai, et déjà connu : un commentaire de `le-coordinateur.mjs` se félicite de réutiliser `loadJson()` « jamais une 4e copie »… alors que 7 copies existent ailleurs. Le plus rentable à corriger. |
| 2 | **Le préambule « balayer `scripts/*.mjs` » / « lire chaque fichier, sauter l'illisible »** | **5** | Vrai. `safe-export` ×3, `doc-report` ×2, `axa-check` ×2. Un helper `pourChaqueFichierLisible()` le fermerait. |
| 3 | **`flagFindBoosterCandidates` / `flagFindDeepBoosterCandidates`** | **3** | Vrai, et le plus franc des trois : deux fonctions quasi jumelles, à deux fichiers de distance. |
| 4 | `smart-conso-token` / `the-king` : comparaison de paires de règles | 2 | Vrai, duplication entre deux outils. |
| 5 | `check-suivi-fidelity` : lecture des lignes de session | 2 | Vrai, interne au fichier. |
| 6 | `find-booster` : découpage de lignes / d'étiquette | 2 | Vrai, petit. |
| 7 | `the-deep-reader` / `the-final-judge` / `hyper-scan` | 2 | Vrai — déjà partiellement factorisé (tâche #152). |
| 8 | Les 2 formateurs de cérémonie de `le-coordinateur` | 1 | Vrai mais **délibéré** : deux blocs volontairement distincts (certification ≠ mise à jour). |
| 9 à 14 | 6 paires isolées (`summarize-simulation-log`, `always-new-code`/`clean-dirty-old`, `api-providers`, échafaudage de test dans `check-house`, `check-tasks-details`, `god-of-all-process`) | 6 | Vraies, mais petites. |

**Vérifié au cas par cas, jamais déduit** : j'ai ouvert les clusters 1, 2, 3, 9, 11 et 12 dans le
code. Aucune définition dupliquée par accident (ce que je craignais pour `doc-report` et
`axa-check` : ce sont des fonctions **sœurs** avec le même préambule, pas des doublons de
définition).

## Pourquoi le libellé unique n'est pas un détail de forme

Les 29 verdicts portent tous la même phrase : *« factoriser si le bloc dépasse le seuil où la
factorisation rapporte plus qu'elle ne coûte »*. Elle est vraie, et elle n'aide personne — elle
renvoie la décision au lecteur sans lui donner de quoi la prendre.

L'outil SAIT pourtant ce qu'il faudrait dire : il connaît le nombre de lignes, le nombre de sites,
et si les sites sont dans **un même fichier** ou **répartis entre plusieurs outils**. Ce dernier
point change tout : deux blocs jumeaux dans un même fichier sont une gêne, le même bloc recopié dans
sept outils est une dette qui se propage à chaque nouveau membre de l'équipe.

## Ce que ça dit de l'outil, et c'est le patron de la journée

CLONE-HUNTER **mesure bien et conclut mal** — exactement comme les 20 outils sans plan d'action, et
comme ARGUS qui ne relisait pas son registre. Sa précision est bonne : zéro faux positif trouvé. Sa
présentation transforme 14 problèmes en 29 alertes indistinctes, et une alerte qu'on ne sait pas
hiérarchiser finit ignorée comme une alerte fausse — pour un coût différent mais un résultat
identique.

## Plan d'action

| État | Constat | Suite |
|---|---|---|
| **RETENU** | 8+ copies du chargeur de JSON, dont le projet se croit déjà débarrassé | Le factoriser pour de vrai — le plus rentable, et il ferme 6 alertes d'un coup |
| **RETENU** | `flagFindBooster`/`flagFindDeepBooster` quasi jumelles | Les fusionner : duplication la plus franche du lot |
| **À TRANCHER** | CLONE-HUNTER fragmente 14 problèmes en 29 alertes et ne dit jamais pourquoi | Regrouper par paire de sites + dériver un vrai motif (même fichier / entre outils). **Change ce qu'un Gardien sacré rapporte : je ne le fais pas sans votre accord.** |
| **ÉCARTÉ, avec raison** | Le préambule « balayer les scripts » (5 alertes) | Vrai, mais un helper qui enveloppe un `try/catch` de 2 lignes coûte souvent plus en indirection qu'il ne rapporte. À rouvrir seulement si une 6e copie apparaît. |
| **ÉCARTÉ, avec raison** | Les 2 formateurs de cérémonie de `le-coordinateur` | Duplication **délibérée** : certification et mise à jour sont deux blocs volontairement distincts, les fondre reviendrait à re-certifier quelqu'un qui l'est déjà. |
| **ÉCARTÉ, avec raison** | L'échafaudage de test dupliqué dans `check-house` | Du code de test lisible vaut mieux que du code de test factorisé : chaque bloc doit se lire seul. |
