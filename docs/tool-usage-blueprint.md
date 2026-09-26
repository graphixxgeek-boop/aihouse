# Compteur d'usage des outils — blueprint générique

## Le problème qu'il ferme

Un projet finit par porter plus d'outils qu'on n'en lance. Sans compteur, la question « lequel ne
sert plus ? » se répond de mémoire — c'est-à-dire mal, et toujours en faveur de ceux qu'on a
construits récemment.

## La limite qui doit voyager avec lui, et elle est structurelle

**C'est un journal AUTO-DÉCLARÉ.** L'outil enregistre lui-même son passage ; rien d'extérieur ne le
prouve. Un outil qui « oublie » de s'enregistrer affiche un zéro qui ressemble trait pour trait à un
zéro d'inactivité.

**Conséquence directe, et c'est le vrai piège** : un zéro ne dit pas « personne ne s'en sert », il
dit « personne ne compte ». Les deux appellent l'inverse l'un de l'autre — l'un suggère de
supprimer l'outil, l'autre de réparer son compteur. Un compteur qui ne distingue pas les deux est
plus dangereux que pas de compteur du tout.

**La fermeture** : un contrôle séparé doit repérer les outils qui ont une ligne de commande et
n'enregistrent rien. C'est la moitié indispensable du dispositif.

## Ce qu'il compte

Un cumul **permanent**, jamais remis à zéro par session : la question « cet outil a-t-il encore sa
place ? » se pose sur la durée de vie du projet, pas sur la dernière semaine.

## Ce qu'il ne fait pas

Il ne juge pas. Un outil peu lancé peut être le plus important du dépôt (une sauvegarde, un audit
annuel). Le compteur nourrit une décision, il ne la prend pas.

## Comment l'installer ailleurs

Un journal, un appel à poser en tête de chaque commande, et **le contrôle des muets** — sans lui, le
compteur ment sans qu'on le sache.
