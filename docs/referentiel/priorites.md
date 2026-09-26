# priorites — fiche d'instanciation

## Ce qu'il sert ici

`scripts/priorites.mjs`, construit le 2026-09-23 après **32 calibrages** avec l'utilisateur.
**Propriétaire déclaré : check-tasks-details**, promu le même jour « responsable de l'organisation
des tâches » par décision explicite. Ce fichier est son implémentation, jamais un second décideur.

## Pourquoi il vit à part

`check-tasks-details.mjs` fait plus de 1 100 lignes, est cité par 16 autres fichiers et lu par le
filet de sécurité — tool-brain le classe SENSIBLE, donc « seules les modifications à risque faible
peuvent y être appliquées ». Y verser une échelle neuve entière aurait été un risque élevé sur un
nœud central.

## La décision déjà prise

**Il ne s'exécute pas seul et ne produit aucun rapport de son côté.** Lui donner une commande le
transformerait en second décideur, exactement ce que la séparation évite.

## Sa limite ici

Les critères reflètent la façon de travailler de CE projet, calibrée en 32 échanges. Ils ne se
transposent pas : seul le principe s'exporte.
