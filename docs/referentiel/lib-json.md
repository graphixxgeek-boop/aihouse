# lib-json — fiche d'instanciation

## Ce qu'il sert ici

`scripts/lib-json.mjs` — le chargeur de JSON de l'Agence, **et le seul**. Accord explicite de
l'utilisateur le 2026-09-23 (tâche #216) : « Oui, un seul chargeur partagé ».

## Ce qu'il a réellement remplacé

**Dix copies** : trois de `loadJson(path, fallback)` et sept de la variante qui rend un tableau.
CLONE-HUNTER signalait 29 clusters de duplication ; l'enquête #215 a montré que **six d'entre eux
décrivaient un seul et même problème** — « lire un registre JSON, rendre un repli s'il manque ».

## La décision déjà prise, qui ne se rediscute pas

**Un seul chargeur, jamais une copie locale « juste pour ce cas-là ».** C'est la règle qui donne sa
valeur au fichier ; sans elle il redevient une onzième copie parmi d'autres.

## Sa limite ici

Il ne distingue pas un fichier absent d'un fichier corrompu. Aucun outil du projet n'a eu besoin de
cette distinction jusqu'ici ; le jour où l'un d'eux en aura besoin, il lira le fichier lui-même
plutôt que d'alourdir le chargeur pour tout le monde.
