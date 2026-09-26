# summarize-simulation-log — fiche d'instanciation

## Ce qu'il sert ici

`scripts/summarize-simulation-log.mjs` (2026-09-19) : extrait un résumé compact des actions d'un
journal complet de simulation (`messages.json`) — tirages de bonus, changements de pièce,
révélation, jardin ouvert, progression de l'enquête.

## Pourquoi il existe dans CE projet, et pourquoi il a été écrit en urgence

Demande explicite de l'utilisateur, **pendant que les journaux complets de full_sim2 à full_sim11
existaient encore dans un espace temporaire** — jamais archivés eux-mêmes, trop volumineux
(0,6 à 5 Mo chacun, décision explicite de ne pas les garder, cf. `docs/simulations/index.md`).

Onze simulations étaient à un pas de disparaître. L'outil a été écrit dans cette fenêtre-là.

## Ce que son résumé rend possible

C'est ce qui fait de `docs/simulations/` **une source de vérification active** et pas un simple
historique : HARMONIA peut confirmer qu'une règle documentée s'est vraiment produite en jeu, et pas
seulement que le code et la documentation s'accordent entre eux (cf. CLAUDE.md, section
« Simulations archivées »).

## Le repli honnête qu'il porte

Les journaux antérieurs à l'introduction de `story.round` dans le moteur ne portent le numéro de
round que dans le label de la requête (`phase1-round11-actor1`). Ce n'est **jamais un bug de
l'extraction** : c'est une vraie absence de champ à cette époque, et l'outil le déclare au lieu de
rendre un zéro.

## Sa place dans le protocole

Étape 3bis de l'Article 18, à chaque nouvelle simulation. Orchestré mécaniquement par
LE-RÉGISSEUR, qui ne prend en charge que les étapes sans jugement.

## Sa limite ici

Jamais une lecture qualitative des répliques — c'est le travail d'EL-PROFESSOR pour la fidélité à la
charte, et du point 5 de la checklist HYPER-SCAN-CHECKPOINT pour le reste.
