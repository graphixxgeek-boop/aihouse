# criticite — fiche d'instanciation

## Ce qu'il sert ici

`scripts/criticite.mjs` (2026-09-23) : calcule la **criticité** d'une tâche du suivi, et l'**urgence**
séparément.

## Le défaut réel qu'il répare, nommé par l'utilisateur

> « la classification mélange le critère de criticité avec le retard : pas bon »

Il avait raison, et ça se voyait dans l'échelle : `URGENT-RETARD` (rang 5) était un niveau de RETARD
assis au-dessus de `PRIORITAIRE-OBLIGATOIRE` (rang 4).

## Ce qu'il a demandé, mot pour mot

> « un indicateur de criticité seul, qui combine tous les autres critères, y compris le
> "retard/délai". L'étiquette affiche seulement le résultat du calcul : la criticité, pendant qu'une
> petite vignette collée à côté indique le niveau d'urgence. »

## Sa précision la plus importante, et elle est facile à trahir

**Le critère d'urgence n'est pas le retard.** Le retard nourrit la criticité ; l'urgence est un axe
à part, et la confondre avec un seuil de retard reproduirait le défaut d'origine par l'autre bout.

## Sa limite ici

Les niveaux de criticité sont le vocabulaire du suivi de ce projet
(`RECOMMANDE-NECESSAIRE`, `PRIORITAIRE-OBLIGATOIRE`…). Ce vocabulaire est fermé et stable par
nature : il n'a rien à synchroniser, et l'Article 24 ne le concerne pas.
