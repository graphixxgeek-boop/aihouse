# sauvegarde-projet — fiche d'instanciation

## Ce qu'il sert ici

`scripts/sauvegarde-projet.mjs` (2026-09-24, tâche #700) : produit le coffre (`.zip`) et la notice
(`.txt`) du projet.

## Pourquoi il existe dans CE projet

Demande explicite de l'utilisateur, calibrée en fenêtres. Sa formulation : « si demain il y a un
quelconque gros bug, ou que je n'ai plus du tout accès à toi ou à git, je veux avoir une copie qui
me permette de continuer comme si rien ne s'était passé ».

**C'est le seul item de toute la Ronde dont la raison ne porte pas sur la qualité du code** : elle
porte sur ce qu'il perdrait s'il perdait l'accès.

## Les chiffres mesurés ici

| Mesure | Valeur | Ce qu'elle décide |
|---|---|---|
| le coffre | 6,1 Mo | trop léger pour valoir un tri — et trier ferait courir le risque d'écarter la mauvaise chose |
| le dépôt entier aplati | ~4 millions de tokens | une vingtaine de fois trop pour une notice : elle est donc CHOISIE |
| conservation | les 3 derniers de chaque | une sauvegarde unique et corrompue ne laisse rien derrière elle |

## Ce qui a levé son inquiétude sur les gigaoctets

Le suivi, les simulations archivées et les registres des outils SONT des fichiers du dépôt. Le
coffre d'aujourd'hui contient donc toute l'histoire jusqu'à aujourd'hui — écraser ne perd rien.

## Sa place dans la Ronde, et son asymétrie

Item `sauvegarde`, dépôt `docs/sauvegardes`. **Le seul item dont l'exécution se termine par une
LIVRAISON et non par un rapport** : une sauvegarde qui reste dans le dépôt qu'elle sauvegarde ne
protège de rien, et cette remise est la seule étape qui décide si tout le dispositif sert.

## Ce qu'il a coûté d'être ajouté au catalogue

Le 2026-09-26, l'inscrire au catalogue des prestations l'a rendu visible au compteur d'usage, qui a
découvert qu'il **n'enregistrait jamais son passage**. Son zéro ne disait pas « personne ne
sauvegarde » mais « personne ne compte ». Corrigé à la source.

## Sa limite ici

Il produit les deux fichiers ; il ne peut pas vérifier qu'ils ont été récupérés. Cette étape-là
n'appartient à aucun mécanisme.
