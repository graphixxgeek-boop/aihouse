# OÙ ON EN EST — fiche d'instanciation

## Ce qu'il sert ici

`scripts/ou-on-en-est.mjs` (2026-09-23) : le récapitulatif de ce qui a été FAIT, et de ce que le
projet y a gagné.

## Pourquoi il existe dans CE projet

Demande explicite de l'utilisateur : « peux-tu me faire un compte rendu global de ce qui a été fait
dernièrement ? me dire comment le projet a évolué, avec quelles améliorations ? […] est-ce que ce
récap peut être fait à chaque Ronde ? ».

**Il a lui-même posé la question de la redondance**, et c'est elle qui a fixé le périmètre.

## Les trois dispositifs, et l'angle propre à chacun

| Dispositif | Sa question |
|---|---|
| `check-tasks-report` (Ronde) | rien n'a-t-il DÉRIVÉ pendant que je travaillais ? |
| l'état des tâches | qu'est-ce qu'on FAIT maintenant ? |
| **celui-ci** | qu'est-ce qui a été FAIT, et qu'est-ce que ça a changé ? |

Les deux premiers regardent la FILE ; celui-ci regarde le CHEMIN PARCOURU. La fusion, envisagée
puis écartée, perdrait un angle à chaque fois.

## Sa place dans la Ronde

Item `ou-on-en-est`, dépôt `docs/ou-on-en-est/`. Ajouté à la demande de l'utilisateur, qui l'a
nommé lui-même.

## Sa limite ici

Il lit `docs/suivi/` et rien d'autre. Sur ce projet, c'est une contrainte forte et assumée : le
suivi est obligatoire dans le même commit que le travail (cf. `docs/systeme-de-suivi.md`),
précisément pour que cette lecture reste fidèle. Un travail non consigné lui est invisible — et
c'est une raison de plus de tenir le suivi, jamais une excuse pour ne pas le faire.
