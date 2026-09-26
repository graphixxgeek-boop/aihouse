# html-report — fiche d'instanciation

## Ce qu'il sert ici

`scripts/html-report.mjs` (2026-09-20), né après la « photo de la dream team », sur sa demande :
« tu vas transformer tous les rapports en fichiers HTML avec une mise en page améliorée […] petit
bond en avant du projet pour la partie remise de rapport au dev ».

## Sa portée, calibrée avec lui en trois questions (Article 16)

**TOUS les rapports livrés en pièce jointe** — KPI, EL-PROFESSOR, THE-SCREENER, simulations,
THE-FINAL-JUDGE, CIRCLE-TASKS — pas seulement les documents « fun ».

## La décision déjà prise, et qui protège tout le reste

**Le fichier gardé DANS le projet reste la version de travail en texte/markdown.** Ce gabarit ne
produit JAMAIS le fichier de référence, seulement une copie de présentation générée à la remise.
Zéro risque pour les outils existants qui relisent leurs propres archives.

## Ses blocs, ici

`heading`, `paragraph`, `note`, `highlight`, `list`, `table`, `code`, `image`, `dialogue`, `tree`,
`matrix`. Le bloc `matrix` a été ajouté pour la carte gravité × garantie plutôt que de forker une
page : la carte suivante arrivera par le même chemin, quel qu'en soit le sujet.

## Sa limite ici

Il met en forme, il ne juge pas. Un rapport creux rendu en HTML reste creux — et paraît plus
sérieux, ce qui est pire.
