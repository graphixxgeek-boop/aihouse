# build-verified — fiche d'instanciation

## Ce qu'il sert ici

`scripts/build-verified.sh` : lance la compilation du projet avec les trois protections qui
l'empêchent de rendre un faux vert.

## Ce qu'il fait concrètement ici

1. **Il se relance lui-même** à travers `scripts/sites-env.sh` si l'environnement n'a pas été
   préparé (`SITES_ENV_READY`). Pas d'avertissement : une relance.
2. **Il refuse de démarrer** si `timeout` n'est pas disponible — plutôt que de compiler sans limite
   de temps. Un garde-fou absent doit se voir.
3. **Réglages stricts du shell** (`set -euo pipefail`) : arrêt à la première erreur, variable non
   définie traitée comme une erreur, échec propagé à travers les tubes.

## Pourquoi c'est classé « optionnel » pour le fonctionnement de l'Agence, et pourtant documenté

Il sert le PRODUIT (la compilation du site), pas l'outillage — la vitalité mesure ce que l'Agence
perd sans lui, et elle n'en perd rien. Mais il **part avec l'Agence** comme tout le reste, donc il
doit pouvoir être remonté ailleurs : c'est la correction du 2026-09-26 (le kit complet est dû à
tous, la vitalité ne donne que l'ordre de réparation).

## Sa limite ici

Il garantit que la compilation a eu lieu dans le bon environnement et qu'elle s'est terminée. Ce
qu'elle a produit ne se juge pas ici — c'est le rôle des tests et, pour le rendu, de THE-SCREENER.
