# OÙ ON EN EST — plan générique : le bilan du chemin parcouru

*(Blueprint réutilisable. Instanciation : `docs/referentiel/ou-on-en-est.md`.)*

## Le problème : trois questions différentes sur les mêmes données

Un système de suivi des tâches se fait naturellement lire de trois façons, et **les fusionner perd
un angle à chaque fois** :

| La question | Ce qu'elle regarde |
|---|---|
| « rien n'a-t-il DÉRIVÉ pendant que je travaillais ? » | la file, en surveillance |
| « qu'est-ce qu'on FAIT maintenant ? » | la file, en décision |
| « qu'est-ce qui a été FAIT, et qu'est-ce que ça a changé ? » | **le chemin parcouru** |

Cet outil porte la troisième, et elle est la plus facile à oublier : personne ne la réclame, parce
qu'elle ne débloque rien. Elle répond à un besoin plus rare et plus important — savoir si le travail
accumulé a produit quelque chose.

Une surveillance qui réclame une décision cesse d'être une surveillance ; un bilan de progression
noyé dans une file de tâches ne se lit jamais.

## Le principe : ce qui a CHANGÉ, jamais ce qui a été fait

Une liste de tâches closes n'est pas un bilan : c'est la même file, retournée. Le bilan doit dire,
pour chaque bloc de travail, **ce que le projet sait ou peut faire aujourd'hui qu'il ne pouvait pas
avant**. Une tâche close qui n'a rien changé est une information, pas un oubli — elle mérite d'être
visible comme telle.

## Trois règles de construction

1. **Regrouper par SUJET, pas par date.** Chronologique, un bilan est illisible : trente lignes de
   dates ne racontent rien. Par sujet, on voit un chantier avancer.
2. **Chiffrer partout où c'est possible**, et dire « pas mesurable » partout ailleurs. « Beaucoup
   d'améliorations » n'est pas un bilan.
3. **Ne jamais inventer l'impact.** Ce que le travail a changé se lit dans ce que le suivi en a
   écrit. Quand la trace ne le dit pas, le bilan dit que la trace ne le dit pas — c'est justement
   l'information utile pour la prochaine fois.

## Son rythme

**Périodique, jamais événementiel.** Lancé à chaque commit, il rendrait le même bilan des dizaines
de fois — et un signal qui ne change pas cesse d'être lu.

## Sa limite honnête

Il lit ce que le suivi a écrit. Un travail réel jamais consigné lui est invisible : il mesure la
qualité de la trace autant que celle du travail, et les deux ne se distinguent pas de l'extérieur.
