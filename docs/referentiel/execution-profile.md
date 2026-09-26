# execution-profile — fiche d'instanciation

## Ce qu'il sert ici

`scripts/execution-profile.mjs` : lit `.sites-runtime/execution-profile.json` et rend le profil
d'exécution du checkout — `managed-linux` ou `portable`.

## Les deux comportements, et pourquoi ils diffèrent

- **Fichier absent (`ENOENT`)** → rend `portable` sans bruit. Les clones propres et les builds
  distants n'ont pas de sélection locale : c'est le cas normal, pas une panne.
- **Fichier illisible, ou valeur hors des deux attendues** → **lève**. Un profil inconnu avalé
  ferait tourner le projet dans un mode que personne n'a choisi, et le symptôme apparaîtrait très
  loin de la cause.

## Ce qui est volontairement absent

Aucune commande, aucun rapport : c'est une **bibliothèque**, lue par les scripts qui en dépendent.
Elle n'a donc pas de registre, et ce n'est pas un manque.

## Sa limite ici

Elle ne vérifie pas que le profil déclaré correspond à la machine réelle. Un fichier qui annonce
`managed-linux` sur un clone nu serait cru sur parole.
