# Point d'entrée unique du choix d'outil — blueprint générique

## Le problème qu'il ferme

Un projet qui accumule les outils accumule aussi les façons de les choisir : une recherche par ici,
un catalogue par là, un réflexe personnel pour le reste. **Le coût n'est pas la confusion, c'est
l'oubli** — un outil qu'on ne pense pas à lancer n'existe pas, et il affiche un zéro d'usage qui se
lira ensuite comme un verdict sur sa valeur.

## Le principe

**Un seul point d'entrée, jamais un choix fait soi-même entre les couches.** On décrit la tâche en
français ; le point d'entrée répond quel outil sait déjà faire ça. Les couches internes
(recherche, catalogue) existent toujours, mais personne ne les appelle directement — sinon la
couche oubliée redevient la couche jamais utilisée.

## La limite honnête, qui doit voyager avec lui

**Aucun mécanisme ne peut intercepter un geste avant qu'il ait lieu.** Un agent qui ouvre un fichier
à la main sans consulter le point d'entrée ne sera arrêté par rien. La règle ne peut donc être
qu'une obligation écrite, et le déclarer EST la protection — la taire donnerait l'illusion d'une
garantie.

## Ce qu'il doit porter en plus du conseil

Un **compteur d'usage réel** et sa contrepartie : le repérage des outils qui ont une commande et
n'enregistrent rien. Sans cette seconde moitié, le compteur ment, et le conseil s'appuie sur un
chiffre faux.

## Ce qu'il ne fait pas

Il associe une tâche à des outils **par mots-clés** : il peut passer à côté de l'outil réellement
utile. La réserve doit être imprimée avec la réponse, sinon la suggestion se lit comme un verdict.

## Comment l'installer ailleurs

Le catalogue est propre au projet d'accueil. Ce qui s'emporte : **le point d'entrée unique, la
limite déclarée, et le contrôle des muets.**
