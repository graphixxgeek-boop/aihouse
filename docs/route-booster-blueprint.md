# Détecteur de points de coupe — blueprint générique

## Le problème qu'il ferme

Toute base de code finit par porter une fonction de mille lignes que personne n'ose découper. Le
blocage n'est pas technique : c'est qu'on ne sait pas **où** couper sans casser un état partagé
invisible. Découper au jugé produit des sous-fonctions à douze paramètres, ce qui est pire que le
bloc d'origine.

## Ce qu'il fait

Il repère des points de coupe **candidats** en lisant la forme du code : les bannières de
commentaires que l'auteur a déjà posées (elles marquent des étapes qu'il avait en tête), les
branches conditionnelles peu profondes, les commentaires descriptifs isolés. Puis il attribue à
chaque candidat un **indice de risque lexical** — combien de variables franchissent la frontière.

## Ce qu'il n'est pas, et c'est écrit dans son propre code

**Jamais une découpe automatique.** Il propose, un humain tranche. Un outil qui couperait seul ne
pourrait pas savoir qu'une variable innocente porte en réalité l'état de toute la fonction.

## La limite honnête

C'est une lecture de **motifs de texte**, pas une analyse syntaxique. Il propose des points de
coupe ; il ne garantit aucune découpe juste. Cette réserve doit voyager avec lui, sinon son indice
de risque se lira comme une preuve.

## Comment l'installer ailleurs

Les motifs de bannière sont propres au style du projet d'accueil — c'est la seule partie à
réécrire. Le principe (les repères que l'auteur a déjà laissés valent mieux qu'une heuristique
inventée) s'emporte tel quel.
