# Registre — memento weight

**Ce qu'on note ici** : ce que la mesure du poids de contexte a révélé — jamais qu'une mesure a eu
lieu.

| Date | Ce qu'il a trouvé | Ce qui en a découlé |
|---|---|---|
| 2026-09-21 | **Le nom a été conservé tel quel**, sur demande explicite de l'utilisateur : « je n'ai pas tres bien compris le role b […] on pourrait le laisser en "memento weight" ». Un nom qu'on ne comprend pas à moitié vaut mieux qu'un nom neuf qu'on croit comprendre. | Noté ici pour qu'un futur agent ne le « clarifie » pas dans le dos de son auteur. |
| 2026-09-21 | **Deux fichiers portent le même nom dans deux mondes différents** : `lib/memento-weight.ts` capture l'échantillon en direct pendant une vraie partie (code de PRODUCTION), `scripts/memento-weight.mjs` le persiste et l'agrège après coup (OUTILLAGE). **Jamais l'un n'importe l'autre.** Même frontière que celle déjà en place pour les clés d'API. | Si l'agrégation vivait dans la production, elle partirait avec le produit et ferait peser sur chaque visiteur un coût qui ne sert qu'au développement. |
| 2026-09-21 | Son verdict est déjà relayé par le rapport KPI (`reportMementoWeight`) — **jamais une routine de Ronde séparée**, qui ferait deux verdicts sur la même donnée. | Exclusion écrite. |
| 2026-09-26 | Kit d'export : plan et registre manquaient. | Ce fichier et `docs/memento-weight-blueprint.md`. |
