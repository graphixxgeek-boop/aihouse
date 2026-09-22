# objectifs-vs-resultats — registre des objectifs

Table hand-maintained (jamais générée) : chaque ligne fixe un objectif chiffré pour une entité (un
slug d'outil connu de `.tool-usage-history.json`) sur une période donnée. `scripts/objectifs-vs-resultats.mjs`
ne modifie jamais ce fichier lui-même — il le lit et calcule l'écart avec le résultat réel.

Colonnes : `Source` dit quel signal déjà existant mesure le résultat réel (jamais un second calcul
divergent) — `usage-count` (nombre de sollicitations réelles sur la période) ou `found-rate` (%
de sollicitations ayant réellement trouvé quelque chose). Les dates sont au format `AAAA-MM-JJ` ;
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
