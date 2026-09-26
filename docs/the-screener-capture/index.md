# Registre — the-screener-capture (le mécanisme de capture de THE-SCREENER)

**Note de nommage** : ce script EST le mécanisme de capture de THE-SCREENER. Son plan générique vit
dans `docs/the-screener-blueprint.md` et sa fiche dans `docs/referentiel/the-screener.md` — l'outil
porte le nom du rôle, le fichier porte le nom de la mécanique. La correspondance est déclarée dans
l'inventaire documentaire de CLAUDE.md et lue par `aliasDocumentaires()` (SAFE-EXPORT), qui
réclamait sinon la création de deux documents déjà existants.

**Ce qu'on note ici** : ce que les captures ont révélé sur le rendu réel — jamais qu'une capture a
été prise.

| Date | Ce qu'il a trouvé | Ce qui en a découlé |
|---|---|---|
| 2026-09-19 | **Sa raison d'être** : EL-PROFESSOR note la fidélité du TEXTE à la charte, et personne ne regardait ce qui s'AFFICHE. Or l'Article 15 demande explicitement de se relire du point de vue de quelqu'un qui ne voit que l'écran. | Création du pendant graphique, avec `docs/referentiel/regles-des-graphismes.md` comme base de jugement. |
| — | **Sa dette la plus ancienne, et elle est ouverte** : il n'a jamais été câblé dans une vraie simulation Article 18. Ses artefacts sont des captures déposées par son propre mécanisme, ce qui explique qu'il figure dans `ITEMS_SANS_DOSSIER_ASSUME` — mais pas qu'on ne l'ait jamais lancé pour de bon. | Tâche ouverte, jamais refermée : « câbler enfin THE-SCREENER dans une vraie simulation ». Un outil jamais lancé sur le terrain réel n'est pas un outil vérifié. |
| 2026-09-26 | Kit d'export : son registre manquait, et la mesure lui réclamait en plus un blueprint et une fiche qui existaient déjà sous le nom THE-SCREENER. | Ce fichier, et la correction à la cause de la mesure (lecture de l'inventaire déclaré). |
