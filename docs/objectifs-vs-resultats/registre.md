# objectifs-vs-resultats — registre des objectifs

Table hand-maintained (jamais générée) : chaque ligne fixe un objectif chiffré pour une entité (un
slug d'outil connu de `.tool-usage-history.json`) sur une période donnée. `scripts/objectifs-vs-resultats.mjs`
ne modifie jamais ce fichier lui-même — il le lit et calcule l'écart avec le résultat réel.

Colonnes : `Source` dit quel signal déjà existant mesure le résultat réel (jamais un second calcul
divergent) — `usage-count` (nombre de sollicitations réelles sur la période), `found-rate` (%
de sollicitations ayant réellement trouvé quelque chose) ou `contribution-count` (nombre de fois où
l'outil a été ALIMENTÉ — une ligne versée dans son registre, un journal enrichi).

**`contribution-count` n'est jamais un `usage-count` élargi** *(2026-09-23, demande explicite de
l'utilisateur : « si tu alimentes un fichier de data appartenant à un outil membre, ça ne compte pas
comme une utilisation de l'outil, mais c'est un bon réflexe qui mérite d'être comptabilisé »).*
Alimenter un outil ne prouve rien sur son utilité — l'additionner au nombre de sollicitations
gonflerait le taux d'usage avec des gestes qui n'ont produit aucun verdict. Mais ne pas le compter
du tout rendrait invisible le geste qui empêche un outil de mourir de faim : un outil qu'on
n'alimente jamais rend des verdicts sur des données qui vieillissent, et rien ne distinguait
« jamais alimenté » d'« alimenté hier ». Les deux chiffres vivent donc côte à côte et ne
s'additionnent jamais. Un outil très alimenté et jamais consulté est un constat en soi, pas une
moyenne à lisser. Les dates sont au format `AAAA-MM-JJ` ;
aucune cadence calendaire fixe n'est imposée — chaque objectif choisit librement son début/fin.


## Absence d'objectif ASSUMÉE — la colonne qui évite les faux objectifs

*(2026-09-22.)* Un outil peut légitimement n'avoir aucun objectif chiffré : un Gardien qui tourne
automatiquement à chaque commit n'a pas de « nombre de sollicitations » à viser, et lui en inventer
un ne mesurerait rien. Ces cas s'écrivent avec `—` dans la colonne Objectif et une raison dans la
Note. C'est une DÉCISION, pas un oubli — et la note de santé qui figure en tête de chaque rapport la
lit comme telle, au lieu de reprocher à l'outil de ne pas avoir d'objectif. Sans cette distinction,
la note pousserait à inventer des objectifs creux pour passer au vert, exactement le travers que le
badge évite déjà par ailleurs.

| Entité | Début | Fin | Objectif | Unité | Source | Note |
|---|---|---|---|---|---|---|
| tool-brain | 2026-09-21 | 2026-09-28 | 5 | sollicitations | usage-count | Premier objectif de calibrage, fixé le soir de sa construction — vérifier que la consultation proactive prend réellement (pas seulement le rappel post-commit automatique). |
| god-of-all-process | 2026-09-22 | 2026-10-06 | 10 | sollicitations | usage-count | Le réflexe à prendre avant tout gros travail (Article 26). S'il n'est pas consulté 10 fois en deux semaines, c'est que le réflexe n'existe pas encore — et un référent qu'on ne consulte pas ne sert à rien. |
| data-archangel | 2026-09-22 | 2026-10-20 | 6 | sollicitations | usage-count | Objectif plus élevé que ses voisins process, et volontairement : son mode `briefing` est censé devenir un réflexe AVANT un gros travail, au même titre que tool-brain. Un chiffre bas ici ne dirait pas que l'outil est inutile — il dirait que je ne pense pas à m'en servir, ce qui est précisément le trou qu'il a été construit pour combler. |
| angel-of-ia-process | 2026-09-22 | 2026-10-20 | 4 | sollicitations | usage-count | Objectif BAS et volontairement ainsi : angel est relayé par god-of-all-process à chaque Ronde, donc son vrai rythme est celui de la Ronde, pas un lancement direct. Ces 4 lancements directs visent les moments où l'on veut savoir tout de suite si une règle de travail a été tenue. Un chiffre très supérieur signalerait plutôt que god ne le relaie pas correctement. |
| pure-gold-unity | 2026-09-22 | 2026-10-20 | 2 | sollicitations | usage-count | Objectif volontairement BAS : son chantier est terminé (29/29), il n'a plus vocation à tourner souvent — seulement à vérifier qu'aucun nouvel outil ne casse l'unification. Un chiffre élevé ici signalerait une régression, pas un succès. |
| process-simulation-guardian | 2026-09-22 | 2026-10-20 | 2 | sollicitations | usage-count | Une consultation avant et une après chaque simulation. Deux sur un mois suppose au moins une simulation — s'il reste à zéro alors qu'une simulation a eu lieu, le référent a été contourné. |
| doc-report | 2026-09-22 | 2026-10-06 | 4 | sollicitations | usage-count | Un passage par Ronde environ. C'est lui qui a révélé qu'il se comptait lui-même comme jamais sollicité : son propre objectif est donc un test de sa propre instrumentation. |
| el-professor | 2026-09-22 | 2026-10-20 | 1 | sollicitations | usage-count | Une note par simulation, pas plus. Un objectif de 1 sur un mois dit simplement : au moins une simulation analysée. |
| ines-official | 2026-09-22 | 2026-10-20 | 1 | sollicitations | usage-count | Une édition consolidée par mois suffit. À 1 sollicitation historique, il est à la limite du désusage — cet objectif tranchera. |
| the-final-judge | 2026-09-22 | 2026-10-20 | — | — | — | **Aucun objectif, et c'est assumé** : il coûte ~37 000 tokens fixes par passage. Lui fixer une cible de fréquence pousserait à le lancer pour atteindre un chiffre, ce qui est exactement l'inverse de ce que l'Article 22 protège. Son mérite se juge à ce qu'il trouve, jamais à sa fréquence. |
| argus | 2026-09-22 | 2026-10-20 | — | — | — | **Aucun objectif de fréquence, et c'est assumé** : Gardien sacré, il tourne automatiquement à CHAQUE commit. Un objectif de sollicitations ne mesurerait que le nombre de commits. Même raison pour harmonia, axa-check, clean-dirty-old, clone-hunter et la couche légère d'always-new-code. |
| harmonia | 2026-09-22 | 2026-10-20 | — | — | — | **Aucun objectif de fréquence, et c'est assumé** — Gardien sacré, automatique à chaque commit (cf. argus ci-dessus). |
| axa-check | 2026-09-22 | 2026-10-20 | — | — | — | **Aucun objectif de fréquence, et c'est assumé** — Gardien sacré, automatique à chaque commit. |
| clean-dirty-old | 2026-09-22 | 2026-10-20 | — | — | — | **Aucun objectif de fréquence, et c'est assumé** — Gardien sacré, automatique à chaque commit. |
| clone-hunter | 2026-09-22 | 2026-10-20 | — | — | — | **Aucun objectif de fréquence, et c'est assumé** — Gardien sacré, automatique à chaque commit. |
| always-new-code | 2026-09-22 | 2026-10-20 | — | — | — | **Aucun objectif de fréquence, et c'est assumé** — sa couche légère est un Gardien sacré automatique ; son zoom profond, lui, est exceptionnel par construction (Article 23). |
| check-spirit-mjs | 2026-09-22 | 2026-10-20 | — | — | — | **Aucun objectif, et c'est assumé** : 16 vrais appels Gemini par passage. Comme THE-FINAL-JUDGE, une cible de fréquence pousserait à consommer du quota pour un chiffre. |
| the-screener | 2026-09-22 | 2026-10-20 | — | — | — | **Aucun objectif tant qu'il ne produit pas une capture exploitable** : son blocage est identifié (l'observateur ne s'identifie pas), pas encore levé. Lui fixer une cible avant de l'avoir réparé mesurerait des échecs. |
| smart-conso-api | 2026-09-22 | 2026-10-06 | 6 | sollicitations | usage-count | L'Article 22 impose de la consulter avant TOUTE action coûteuse. Si elle descend sous 6 en deux semaines alors que des simulations ou diagnostics ont eu lieu, c'est que l'obligation a été contournée — cet objectif mesure le respect d'une règle, pas une performance. |
| smart-conso-token | 2026-09-22 | 2026-10-06 | 6 | sollicitations | usage-count | Même logique que sa sœur : obligation écrite avant tout agent séparé ou lecture exhaustive. Aucun compteur externe n'existe pour les tokens de l'agent, donc ce chiffre est la seule trace que l'obligation est tenue. |
| circle-tasks | 2026-09-22 | 2026-10-20 | 4 | sollicitations | usage-count | Une Ronde par semaine environ. En dessous, les tâches périodiques gratuites recommencent à se perdre — c'est exactement le problème que la Ronde existe pour résoudre. |
| check-tasks-details | 2026-09-22 | 2026-10-06 | 4 | sollicitations | usage-count | Un état des lieux par Ronde. Un suivi qu'on ne consulte pas redevient une liste morte. |
| the-king | 2026-09-22 | 2026-10-20 | 4 | sollicitations | usage-count | Un passage par Ronde. Il veille sur la philosophie du projet : s'il n'est jamais consulté, c'est que les décisions de fond se prennent sans elle. |
| cassandra-rh | 2026-09-22 | 2026-10-20 | 4 | sollicitations | usage-count | Un bilan RH par Ronde. C'est elle la gardienne des objectifs : un objectif sur elle-même n'est pas une coquetterie, c'est la cohérence minimale. |
| ecotoken | 2026-09-22 | 2026-10-20 | 4 | sollicitations | usage-count | Un scan par Ronde. La charte est le seul document rechargé à chaque message : son poids se surveille en continu, pas au moment où il devient gênant. |
| le-coordinateur | 2026-09-22 | 2026-10-20 | 3 | sollicitations | usage-count | Une synthèse réseau périodique. Objectif modéré : il agrège ce que les autres disent déjà, il n'a pas à tourner sans arrêt. |
| memory-audit | 2026-09-22 | 2026-10-20 | 1 | sollicitations | usage-count | Un passage après chaque simulation. À 1 sur un mois, l'objectif dit simplement : au moins une vérification de la mémoire narrative. |
| find-booster | 2026-09-22 | 2026-10-06 | 8 | sollicitations | usage-count | Obligation écrite avant toute recherche dans un fichier existant. Un chiffre bas signifierait que je lis des fichiers entiers au lieu de chercher par concept — un vrai gâchis de tokens, mesurable ici. |
| objectifs-vs-resultats | 2026-09-22 | 2026-10-20 | 3 | sollicitations | usage-count | Un rapport par Ronde environ. Un outil d'objectifs qu'on ne lance jamais ne mesure rien, et c'était exactement son état avant aujourd'hui. |
| hyper-scan-checkpoint | 2026-09-22 | 2026-10-20 | — | — | — | **Aucun objectif, et c'est assumé** : exceptionnel par construction (Article 21), jamais automatique, jamais en continu. Son seul critère de succès est le nombre de bugs inconnus qu'il fait remonter — une cible de fréquence le pousserait à tourner pour tourner. |
| the-deep-reader | 2026-09-22 | 2026-10-20 | — | — | — | **Aucun objectif, et c'est assumé** : agent séparé à coût variable et élevé. Comme THE-FINAL-JUDGE, une cible de fréquence pousserait à dépenser pour un chiffre. |
| smart-breaker | 2026-09-22 | 2026-10-20 | — | — | — | **Aucun objectif, et c'est assumé** : il ne se déclenche que sur un vrai blocage de quota. Lui fixer une cible reviendrait à souhaiter des pannes pour l'atteindre. |
| check-level-target | 2026-09-22 | 2026-10-20 | — | — | — | **Aucun objectif direct, et c'est assumé** : il est appelé PAR d'autres outils (tool-brain, HYPER-SCAN-CHECKPOINT) plutôt que lancé à la main. Son usage réel se lit dans le leur, pas dans un compteur qui lui serait propre. |
| find-deep-booster | 2026-09-22 | 2026-10-20 | — | — | — | **Aucun objectif, et c'est assumé** : il ne sert que pendant un chantier de découpage d'un fichier géant. Hors chantier, zéro est la bonne valeur. |
| safe-export | 2026-09-22 | 2026-10-20 | — | — | — | **Aucun objectif de sollicitation, et c'est assumé** : Gardien sacré, sa couche légère tourne à CHAQUE commit sans que personne ne la lance — lui fixer une cible de sollicitation mesurerait le nombre de commits, jamais son utilité. Son vrai indicateur viendra de sa mémoire (combien d'écarts corrigés contre combien qui reviennent), le jour où elle aura assez de passages. |
| tool-learning | 2026-09-22 | 2026-10-20 | 4 | sollicitations | usage-count | Un passage par Ronde. Il juge une trajectoire : sous trois passages il refuse de conclure, donc un rythme en dessous de 4 par mois le rendrait structurellement muet — l'objectif mesure ici la condition de son existence, pas une performance. |
| the-equalizer | 2026-09-23 | 2026-10-21 | 4 | sollicitations | usage-count | Un passage par Ronde. Même logique que son voisin tool-learning, pour une raison différente : son verdict ne bouge que si le référentiel des standards ou la couverture réelle a bougé — moins de 4 par mois et une exigence laissée sans vérificateur pourrait traîner des semaines sans que rien ne le redise. L'objectif mesure ici la fréquence de relecture, jamais une quantité de trouvailles : un verdict qui ne trouve rien est un bon verdict, c'est un verdict jamais rendu qui est le problème. |
| integration-outil | 2026-09-23 | 2026-10-21 | 1 | sollicitations | usage-count | Objectif volontairement BAS, et c'est la bonne façon de le lire : cet outil répond à un ÉVÉNEMENT (un outil qui arrive), jamais à un calendrier. Un mois sans nouvel outil et zéro sollicitation est un résultat normal ; ce qu'on surveille est l'inverse — un outil qui arrive SANS qu'il ait été consulté. La cible de 1 dit « au moins une fois par mois, vérifier qu'on ne l'a pas contourné ». Ajouté après que le onzième registre d'intégration, écrit ce jour-là, l'a trouvé branché sur rien — sur l'outil dont c'est précisément le métier. |
