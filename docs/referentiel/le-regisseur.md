# LE-RÉGISSEUR — fiche d'instanciation

## Ce qu'il sert ici

`scripts/le-regisseur.mjs` (2026-09-21) : orchestre les parties **mécaniques**, sans aucun jugement,
du protocole de simulation complète (Article 18).

## Pourquoi il existe dans CE projet

Demande explicite de l'utilisateur pendant une passe d'allègement de CLAUDE.md : « je parle d'un
script au statut membre de l'équipe » — **jamais l'outil `Agent`**, dont le coût fixe (~37 000
tokens par appel, mesuré et documenté dans `docs/referentiel/smart-conso-token.md`) est sans commune
mesure avec un script.

Même doctrine que LE-COORDINATEUR : jamais de raisonnement à sa charge, seulement l'exécution de ce
qui n'a besoin d'aucune lecture humaine pour être fait correctement.

## Ce qu'il prend en charge

Archivage des fichiers de simulation, extraction du résumé compact (via
`summarize-simulation-log.mjs`), rapport KPI.

## La frontière, TROUVÉE en vérifiant le contenu réel avant de coder (Article 19)

Les **deux index de jugement** du protocole restent hors de son périmètre :

| Index | Pourquoi il reste la plume de l'agent |
|---|---|
| `docs/simulations/index.md` | sa colonne « Notes » porte la cause racine et les liens vers d'autres passages |
| `docs/referentiel/kpi-index.md` | il le dit lui-même : « comparer deux runs et en tirer ce qui compte est un travail de lecture, pas un calcul » |

Les automatiser aurait produit des lignes plausibles et vides — pire que des lignes manquantes,
puisqu'une absence se voit.

## Sa limite ici

Il garantit que les gestes mécaniques du protocole sont faits. Il ne dit rien de la qualité de la
simulation, ni de ce qu'elle a révélé.
