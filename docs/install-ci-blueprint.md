# install-ci — plan générique : installer sans que deux installations se marchent dessus

*(Blueprint réutilisable. Instanciation : `docs/referentiel/install-ci.md`.)*

## Ce qu'il est

L'installation des dépendances dans une chaîne automatisée, protégée contre le défaut qui ne se
produit jamais quand on teste à la main.

## Le problème : DEUX installations en même temps

Une installation lancée deux fois en parallèle — deux tâches de la chaîne, un relancement pendant
qu'une autre tourne — écrit dans le même cache et le même dossier de dépendances. Le résultat n'est
pas un échec propre : c'est un état **à moitié écrit**, qui produira des erreurs sans rapport
apparent, bien plus tard, dans une tout autre commande.

C'est le type de défaut le plus coûteux à diagnostiquer, parce que le symptôme n'a aucun lien visible
avec la cause.

## Le principe : un verrou, et le refus de démarrer sans lui

L'installation prend un **verrou de fichier** : la seconde attend la première au lieu d'écrire
par-dessus.

Et le script **refuse de démarrer** si l'outil de verrouillage n'est pas disponible, plutôt que
d'installer sans protection. C'est la même règle que partout ailleurs : **un garde-fou absent doit
se voir, jamais se deviner.** Une installation sans verrou réussit la plupart du temps — c'est
exactement ce qui la rend dangereuse.

## Les deux visages du même outil

Un enrobage shell (qui prépare l'environnement et vérifie les prérequis) et le programme qui fait le
travail. Les deux portent le même nom parce que c'est le même outil : les documenter séparément
créerait deux vérités pour une seule chose.

## Sa limite honnête

Il garantit qu'une seule installation écrit à la fois. Il ne garantit pas que ce qu'elle installe
soit ce qu'on voulait — c'est le rôle du fichier de verrouillage des versions, pas le sien.
