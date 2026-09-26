# Chargeur de JSON partagé — blueprint générique

## Le problème qu'il ferme

Tout outil qui garde une mémoire lit un fichier JSON au démarrage et doit survivre à son absence :
le premier passage n'a rien à lire. Chacun écrit donc trois lignes de `try/catch` avec un repli. Ces
trois lignes se recopient sans effort et **se dupliquent sans que personne ne le remarque** : elles
sont trop courtes pour ressembler à de la duplication.

**Le vrai coût n'est pas la répétition, c'est la DIVERGENCE.** Dix copies d'un chargeur, ce sont dix
comportements possibles quand le fichier est corrompu plutôt qu'absent, quand il contient un objet
là où on attendait un tableau, quand le disque refuse la lecture. La différence ne se voit qu'un an
plus tard, sur un outil qui rend un résultat que personne n'explique.

## Ce qu'il fait, et ce qu'il ne fait pas

Il rend le contenu du fichier, ou le repli. **Il ne dit jamais POURQUOI** il a rendu le repli —
absence, corruption ou refus de lecture se ressemblent ici. C'est un choix : un chargeur qui
renverrait un motif obligerait chaque appelant à le traiter, et la plupart n'ont rien à en faire.
Un outil pour qui la distinction compte doit lire le fichier lui-même.

## Les deux formes, et pourquoi elles ne fusionnent pas

Un registre est tantôt un **objet** (une mémoire à clés), tantôt un **tableau** (une série de
passages). Le repli n'est pas le même, et un appelant qui reçoit `{}` là où il attend `[]` plante à
la première itération. Deux fonctions, donc, et pas un paramètre : le type de repli est le contrat.

## Comment l'installer ailleurs

Zéro dépendance hors de la bibliothèque standard. Ce qu'il faut surtout emporter, c'est la
**discipline** : un dépôt qui l'adopte doit interdire la copie locale, sinon la onzième apparaîtra
exactement comme les dix premières.

## Le faux positif déjà payé, et il est instructif

Le fichier qui a motivé l'extraction portait un commentaire **se félicitant de réutiliser** le
chargeur d'un voisin plutôt que d'en écrire une quatrième copie. L'intention était juste, elle était
écrite, elle était même fière — et une copie de plus existait quand même ailleurs dans le même
fichier. **Une intention écrite n'est pas un mécanisme** : seule l'extraction réelle a fermé le
sujet.
