# simulation-visiteur — plan générique : l'interlocuteur scripté d'une exécution coûteuse

*(Blueprint réutilisable. Instanciation : `docs/referentiel/simulation-visiteur.md`.)*

## Pourquoi un MODULE SÉPARÉ du script de lancement, et c'est tout l'argument

Une exécution complète coûte cher — du quota réel, une heure d'attente. Un interlocuteur scripté qui
vit **dans** le script de lancement ne se teste qu'en lançant l'exécution. Donc jamais. Donc ses
défauts ne se découvrent que dans la transcription, **après la dépense.**

Séparé, tout se vérifie à sec : l'arc, le ciblage, la couverture des paliers, le rattrapage. C'est
une règle générale de ce genre d'outillage : **ce qui ne peut être testé que par une dépense doit
vivre hors de ce qui coûte.**

## Ce qu'il remplace, et les deux défauts confirmés sur pièces

L'ancien dispositif : une liste plate de messages identiques envoyés à tous les interlocuteurs.

| Le défaut | Ce qu'il produit |
|---|---|
| **aucune personnalité derrière les messages** | rien ne relie le message 8 au message 12, donc l'interlocuteur n'est personne — et un système qui doit réagir à quelqu'un réagit à un bruit |
| **les mêmes messages pour tous** | aucune différence de traitement ne peut apparaître, alors que c'est précisément ce qu'on veut observer |

Les deux ont été confirmés sur pièces dans une transcription réelle, pas supposés.

## Les quatre choses qu'il doit savoir faire, et qui se vérifient à sec

1. **Un arc** — l'interlocuteur a une trajectoire, pas une liste.
2. **Le ciblage** — il s'adresse à quelqu'un en particulier, différemment.
3. **La couverture des paliers** — chaque comportement qu'on veut observer est bien sollicité.
4. **Le rattrapage** — si un palier n'a pas été atteint, la suite le vise.

Sans le quatrième, l'exécution la plus chère du projet peut se terminer sans avoir touché ce qu'on
voulait mesurer, et personne ne s'en aperçoit avant la lecture.

## La discipline de conception qui va avec

Ce genre de module se conçoit **avant** la première ligne de code, en calibrant chaque décision avec
la personne qui lira les résultats. Le coût d'un mauvais calibrage n'est pas une réécriture : c'est
une exécution complète à refaire.

## Sa limite honnête

Il garantit que les provocations ont été envoyées et qu'elles tiennent debout. Ce qu'elles ont
produit reste une lecture.
