# Lecture de l'environnement d'hébergement — blueprint générique

## Le problème qu'il ferme

Un projet déployé lit des valeurs d'environnement dispersées entre plusieurs sources : variables du
processus, fichier local de développement, valeurs par défaut du code. Chaque appelant qui refait
cette résolution dans son coin finit par appliquer un ordre de priorité différent — et **deux
comportements divergents sur la même clé sont indétectables à la lecture** : chacun a l'air correct
isolément.

## Le principe

**Un seul point de résolution, un seul ordre de priorité, écrit une fois.** Ce qui compte n'est pas
l'ordre choisi — c'est qu'il n'y en ait qu'un.

## Ce qu'il ne fait pas

Il ne valide pas le contenu : une clé présente mais vide est présente. Distinguer « absente » de
« vide » est le travail de l'appelant, qui seul sait laquelle des deux est acceptable chez lui.

## Comment l'installer ailleurs

La liste des clés est propre au projet d'accueil. Ce qui s'emporte : le point unique, et
l'interdiction de refaire la résolution ailleurs.
