# memento weight — plan générique : mesurer le poids du contexte envoyé à chaque tour

*(Blueprint réutilisable. Instanciation : `docs/referentiel/memento-weight.md`.)*

## Le problème : le contexte grossit, et rien ne le dit

Dans un système qui appelle un modèle à chaque tour, le contexte transmis grandit par accumulation —
une règle ajoutée ici, un rappel là, un historique qui s'allonge. Chaque ajout est légitime pris
seul ; l'ensemble finit par coûter plus que tout le reste, et **personne ne mesure la somme**.

Le symptôme se manifeste d'abord comme une dépense inexpliquée, jamais comme une erreur.

## La séparation à tenir absolument : PRODUCTION et OUTILLAGE

| Où | Quoi |
|---|---|
| le code de production | la CAPTURE en direct de l'échantillon, pendant une vraie partie |
| l'outillage de développement | la PERSISTANCE après coup et l'agrégation |

**Les deux portent le même nom et vivent dans des mondes différents : jamais l'un n'importe
l'autre.** C'est la même frontière que partout ailleurs entre ce qui tourne pour un vrai
utilisateur et ce qui sert à travailler.

La raison est concrète : si l'agrégation vivait dans la production, elle partirait avec le produit
et ferait peser sur chaque visiteur un coût qui ne sert qu'au développement.

## Pourquoi il a été SÉPARÉ d'un outil voisin

Ce rôle vivait mélangé avec la vérification de cohérence de la mémoire. Les deux touchent « la
mémoire », et c'est exactement ce qui rend la confusion durable : l'un mesure un POIDS, l'autre
vérifie une COHÉRENCE. Rien de commun, sinon le mot.

Séparés à la demande explicite de l'utilisateur — « ces 2 scripts ne doivent plus être réunis dans
le même script, pour plus de clarté ».

## Ce qu'il faut échantillonner

Le poids total, et sa décomposition par SOURCE. Le total seul dit qu'il y a un problème ; la
décomposition dit lequel — et c'est la seule information qui permette de décider quoi couper.

## Sa limite honnête

Il mesure un poids, jamais une utilité. Une section lourde et indispensable et une section lourde et
morte lui paraissent identiques : le jugement reste entier.
