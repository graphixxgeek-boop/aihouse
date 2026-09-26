# Corpus mesuré — blueprint générique

## Le problème qu'il ferme, et il est structurel plutôt qu'accidentel

Un contrôle reçoit une liste de fichiers et rend une liste de trouvailles. **Une entrée vide donne
une sortie vide, et rien dans la valeur rendue ne dit laquelle des deux situations on vient de
vivre :**

- « j'ai regardé 77 fichiers et tout va bien » → un vrai vert, mérité ;
- « on ne m'a donné aucun fichier à regarder » → aucune information, **qui se lit vert**.

Les deux produisent un tableau vide. Le second est le plus dangereux verdict qu'un outil puisse
rendre, parce qu'il est indiscernable du meilleur.

## Le principe

**Le corpus se déclare AVANT le verdict.** Un contrôle rend toujours deux choses : ce qu'il a
regardé, et ce qu'il y a trouvé. Un corpus vide fait basculer le résultat en « pas mesuré », jamais
en « rien à signaler ».

## Pourquoi c'est un mécanisme partagé et non une règle écrite

Parce qu'une règle écrite ne s'applique qu'aux contrôles dont l'auteur y a pensé. Un mécanisme que
tous appellent s'applique aussi au prochain — c'est la différence entre une intention et une
garantie.

## Ce qu'il ne fait pas

Il ne vérifie pas que le corpus est le BON : il vérifie qu'il n'est pas vide. Un contrôle à qui on
donne les mauvais fichiers rendra un verdict mesuré et faux, et aucun mécanisme générique ne peut
l'en empêcher.

## Comment l'installer ailleurs

Une fonction et une discipline d'appel. La discipline est la vraie pièce : un contrôle qui ne
l'appelle pas retrouve exactement le défaut du départ.
