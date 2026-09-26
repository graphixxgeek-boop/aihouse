# Blueprint générique — le contrôleur d'un process à étapes

*(Réutilisable sur tout projet où une activité récurrente suit une suite d'étapes écrite.
Instanciation ici : `docs/referentiel/circle-process-guardian.md`.)*

## Le problème qu'il résout

Un process écrit se dégrade par le milieu. Les premières étapes se font parce qu'elles lancent le
travail, la dernière se fait parce qu'elle le clôt — **celles du milieu sautent**, et personne ne
s'en aperçoit parce que le résultat final existe quand même. Au bout de quelques passages, le
process réel n'a plus grand-chose à voir avec le process écrit.

## Le principe : contrôler le DÉROULÉ, jamais le résultat

Un contrôleur de process ne juge pas la qualité de ce qui a été produit — d'autres outils le font.
Il vérifie **qu'on est passé par où on avait dit**, et il le vérifie sur des FAITS laissés par le
passage : un fichier écrit, un horodatage, une ligne de registre. Jamais sur une déclaration.

## Les quatre règles qui font la différence

1. **JAMAIS un second calcul.** Il réutilise les fonctions et les registres de l'outil qu'il
   surveille. Un contrôleur qui recalcule finit par contredire son sujet, et personne ne sait
   lequel croire.
2. **La FRAÎCHEUR compte autant que la présence.** Un livrable présent mais daté d'avant le passage
   n'a pas été produit : il a été recopié. C'est le contrôle que l'on oublie le plus souvent, et
   celui qui attrape le plus de passages en trompe-l'œil.
3. **Il peut BLOQUER, et c'est ce qui le distingue d'un rapport.** Un contrôleur qui se contente de
   signaler après coup arrive toujours trop tard sur un process — le passage est fini.
4. **Un signal qui se répète n'est plus un signal.** Trois passages avec le même constat veulent
   dire qu'on l'a lu et qu'on ne le traite pas. Le compter comme une alerte de plus entretient
   l'illusion qu'il est suivi.

## La frontière à écrire, sinon le vocabulaire glisse

Un contrôleur de process n'est pas un vérificateur de qualité de code, et les deux ne doivent jamais
porter le même nom. L'un dit « tu as sauté une étape », l'autre dit « ce code est fragile ». Les
confondre fait qu'on ne sait plus lequel a validé quoi.
