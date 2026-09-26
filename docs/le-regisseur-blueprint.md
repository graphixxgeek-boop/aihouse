# LE-RÉGISSEUR — plan générique : orchestrer les étapes SANS jugement d'un protocole

*(Blueprint réutilisable. Instanciation : `docs/referentiel/le-regisseur.md`.)*

## Le problème : un protocole long dépend de la mémoire, et la mémoire d'un agent ne survit pas

Un protocole écrit en sept étapes se fait exécuter par un agent qui doit s'en souvenir à chaque
passage. Les étapes qui demandent un jugement, on ne peut pas les lui retirer. Mais celles qui n'en
demandent AUCUN — archiver un fichier au bon endroit, extraire un résumé, produire un rapport
chiffré — sont oubliées exactement aussi souvent que les autres, pour rien.

## Le principe : la frontière se trace sur le JUGEMENT, jamais sur la difficulté

| Ce que le régisseur prend | Ce qu'il ne prend JAMAIS |
|---|---|
| déplacer et nommer les fichiers d'archive | décider ce que le passage a révélé |
| extraire un résumé mécanique | comparer deux passages et en tirer ce qui compte |
| produire le rapport chiffré | remplir un index de jugement |

**La frontière se VÉRIFIE dans le contenu réel avant d'écrire une ligne.** C'est le point où ce
genre d'outil dérape : un index qui « a l'air » mécanique parce qu'il contient un tableau peut très
bien porter une colonne de raisonnement. Un index de jugement automatisé se remplirait de lignes
plausibles et vides, ce qui est pire que des lignes manquantes — une absence se voit.

## Pourquoi un SCRIPT, jamais un agent séparé

Un agent séparé coûte, à chaque appel, des dizaines de milliers de tokens. Un script coûte le temps
de son exécution. Pour des gestes qui ne demandent aucun raisonnement, l'écart n'est pas un détail
d'optimisation : c'est la différence entre un protocole qu'on suit et un protocole qu'on évite.

## Sa limite honnête

Il garantit que les gestes mécaniques sont faits, jamais qu'ils sont faits sur les bonnes données.
Lancé sur le mauvais passage, il archivera parfaitement le mauvais fichier.
