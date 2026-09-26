# pnpm-install — fiche d'instanciation

## Ce qu'il sert ici

`scripts/pnpm-install.mjs` : l'installation des dépendances, appelée par l'outillage d'installation
du projet.

## Son classement, et le désaccord assumé qui l'accompagne

Déclaré **plomberie** le 2026-09-24 (tâche #737), **en désaccord assumé avec la mesure dérivée**,
qui le voit convocable parce qu'il a un point d'entrée.

Il en a un — mais ses seuls arguments sont des drapeaux internes (`--hold-install-locks`,
`--report-store`) qu'aucun humain ne tape. **Il est appelé par l'outillage, jamais convoqué.**

**Le désaccord est RAPPORTÉ plutôt que tranché**, et c'est précisément pour ce cas que l'iceberg lit
deux sources au lieu d'une. L'arbitrage revient à l'utilisateur ; d'ici là, la ligne en tête du
fichier dit ce que le fichier sait de lui-même.

## Pourquoi c'est la bonne réponse

Forcer la mesure à dire ce qu'on pense aurait créé une exception de plus — invisible, et qui aurait
masqué le prochain vrai cas. Ici la règle garde sa portée, la déclaration garde sa nuance, et la
divergence reste lisible.

## Sa limite ici

Une déclaration est un avis, pas une preuve. La mesure dérivée reste en place plutôt que d'être
remplacée, et c'est ce qui permet au désaccord d'exister au lieu de disparaître.
