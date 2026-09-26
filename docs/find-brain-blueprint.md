# find-brain — plan générique : le cerveau qui choisit entre deux outils de recherche

*(Blueprint réutilisable sur un autre projet. L'instanciation propre à celui-ci vit dans
`docs/referentiel/find-brain.md`.)*

## Le problème qu'il résout, et il n'est pas celui qu'on croit

Un projet qui se dote de **deux** outils de recherche dans le code — l'un qui navigue par concept
dans un gros fichier, l'autre qui propose des points de découpe — gagne deux capacités et **un
problème neuf** : il faut désormais choisir lequel lancer. Et ce choix, fait à la main, se fait mal :
on prend celui dont on se souvient, pas celui qui convient.

Le coût est invisible parce qu'il ne produit aucune erreur : on obtient bien un résultat, simplement
pas le meilleur, et rien ne dit qu'un autre outil aurait mieux répondu.

## Le principe, en une phrase

**Le cerveau ne refait le travail d'aucun des deux outils** : il importe leurs fonctions de
recommandation telles quelles et ajoute **un jugement de plus** — lequel mérite d'être lancé sur CE
fichier.

C'est la règle anti-doublon appliquée à un agrégateur : un second calcul de poids ou de points de
découpe divergerait du premier au premier changement, et les deux verdicts seraient alors également
crédibles et contradictoires.

## La décision n'est JAMAIS exclusive

Le piège naturel est de rendre « utilise A » **ou** « utilise B ». C'est faux : un gros monolithe
peut être à la fois dense en concepts (donc justiciable de la navigation) **et** plein de points de
découpe candidats (donc justiciable de la décomposition). Le cerveau rend donc **zéro, un ou deux**
outils recommandés, jamais un choix imposé.

## Les deux seuils, et pourquoi ils sont peu nombreux

| Seuil | Ce qu'il gouverne |
|---|---|
| nombre de lignes | en dessous, aucune découpe ne vaut la peine d'être proposée |
| nombre minimal de points de coupe | un seul point de coupe n'est pas une décomposition, c'est une coïncidence |

Un seuil de plus serait un réglage de plus à maintenir ; ces deux-là suffisent à écarter les cas
évidents, et le reste est délégué aux deux outils eux-mêmes.

## Le surnom d'affichage, jamais un renommage

Quand l'un des deux outils porte un nom technique différent de celui qu'on emploie en conversation,
**on garde le fichier sous son nom réel** et on ne donne le surnom qu'à l'affichage. Renommer le
fichier casserait tous les renvois existants pour un gain purement cosmétique. La constante qui
porte le surnom est exportée, pour qu'un seul endroit le définisse.

## Sa place dans la hiérarchie : interne, jamais appelé en direct

Ce cerveau est une **couche interne**. Le point d'entrée de l'agent reste l'aiguilleur général
(celui qui connaît tout le catalogue d'outils), qui appelle ce cerveau-ci quand la tâche concerne un
fichier précis. Deux raisons :

1. **Un seul réflexe à avoir.** Un agent qui doit choisir entre trois points d'entrée en choisit
   souvent zéro.
2. **Le cerveau ne connaît que la recherche.** Sollicité directement, il ne dirait jamais qu'un
   tout autre outil du catalogue répondait mieux.

## Sa limite honnête

Il juge un fichier **sur sa forme** (taille, densité, motifs de coupe), jamais sur l'intention de
qui cherche. Il ne dit pas « voici la réponse à ta question » ; il dit « voici l'outil qui a le plus
de chances de te la faire trouver vite ».

## Le garde-fou minimal à écrire avec lui

Un balayage périodique qui signale les fichiers devenus candidats **depuis** la dernière fois : un
fichier grossit sans que personne ne s'en rende compte, et la recommandation d'hier se périme en
silence. Sans ce balayage, le cerveau ne parle que quand on l'interroge — et on l'interroge surtout
sur les fichiers auxquels on pense déjà.
