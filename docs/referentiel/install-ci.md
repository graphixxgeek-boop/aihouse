# install-ci — fiche d'instanciation

## Ce qu'il sert ici

`scripts/install-ci.sh` et `scripts/install-ci.mjs` : l'installation des dépendances dans la chaîne
automatisée. **Deux fichiers, un seul outil** — l'enrobage shell prépare l'environnement et vérifie
les prérequis, le programme fait le travail. Ils partagent donc ce document, et leur correspondance
est déclarée dans l'inventaire.

## Ce qu'il fait concrètement ici

1. **Il se relance** à travers `scripts/sites-env.sh` si l'environnement n'est pas prêt.
2. **Il refuse de démarrer** si `flock` n'est pas disponible — plutôt qu'installer sans verrou.
3. **Réglages stricts du shell** (`set -euo pipefail`).

## Pourquoi le verrou, et pourquoi le refus plutôt qu'un avertissement

Deux installations simultanées écrivent dans le même cache et produisent un état à moitié écrit,
dont les erreurs apparaîtront bien plus tard, dans une tout autre commande, sans lien visible avec
la cause.

Une installation sans verrou **réussit la plupart du temps** : c'est ce qui la rend dangereuse, et
c'est pourquoi l'absence de l'outil de verrouillage arrête le script au lieu de le laisser tourner.

## Son rapport à `pnpm-install.mjs`

`pnpm-install.mjs` est la plomberie appelée en dessous, avec ses drapeaux internes
(`--hold-install-locks`, `--report-store`) qu'aucun humain ne tape. Voir sa fiche pour le désaccord
de classement qu'il porte.

## Sa limite ici

Il garantit qu'une seule installation écrit à la fois, jamais que le contenu installé soit le bon —
c'est le fichier de verrouillage des versions qui répond de ça.
