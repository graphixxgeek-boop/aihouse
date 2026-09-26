# judge-persona-shared — fiche d'instanciation

## Ce qu'il sert ici

`scripts/judge-persona-shared.mjs` (2026-09-21, tâche #152) : le socle commun de THE-FINAL-JUDGE et
de son cousin THE-DEEP-READER.

## Pourquoi il existe dans CE projet

Les deux fichiers avaient chacun **leur propre copie** de `extractPersonaBlock()`, strictement
identique, et une version de `detectGenericReport()` qui répétait la même logique de « sections
manquantes » / « trop court » avant d'ajouter son propre signal.

Corrigé une fois ici plutôt que dupliqué deux fois — règle anti-doublon de
`docs/regles-de-travail.md` §7ter.

## L'exigence non négociable de l'utilisateur

Le personnage fixe vit dans un bloc de citation markdown (`> …`) sous le titre « Personnage » du
document d'instanciation de l'outil appelant, et il est **extrait ligne par ligne, jamais recopié à
la main ailleurs**.

Ce que ça garantit : le texte utilisé à chaque appel provient TOUJOURS du même texte de référence.
Une copie recopiée dériverait à la première retouche, et l'outil jugerait avec un personnage qui
n'est plus celui qu'on croit — sans aucun signe extérieur.

## Sa règle d'extension

**Jamais un troisième cousin qui réimplémenterait sa propre copie** : tout futur « juge » du même
genre (agent séparé, personnage fixe, anti-dérive générique) importe d'ici. La phrase est écrite
dans le fichier lui-même, parce que c'est exactement ce que le deuxième outil n'avait pas fait.

## Sa limite ici

Il repère un rapport qui ressemble à un rapport générique. Un rapport spécifique mais faux lui
paraît parfait — le fond reste une lecture humaine.
