# Cartographie des critères transversaux — ce que le paysage vérifie, et depuis combien d'endroits

*(2026-09-23, chantier 9 du plan de nuit. Calibrage exact de l'utilisateur : « montrer, ne rien
supprimer ». Produit par `cartographieCriteresTransverses()` — HARMONIA.)*

## Ce que ce document est, et ce qu'il n'est pas

**Ce n'est pas un rapport de doublons.** CLONE-HUNTER fait déjà ça, sur le code littéral. Ici on
regarde un étage au-dessus : quelles QUESTIONS ce paysage d'outils pose-t-il, et depuis combien
d'endroits différents ?

**Et rien n'en sera supprimé**, parce que la redondance apparente n'en est pas une la plupart du
temps. Deux outils qui demandent « ce qui est déclaré existe-t-il vraiment ? » ne font pas doublon
si l'un le demande des blueprints et l'autre des porteurs de leçons. Les fusionner donnerait un
outil qui scanne tout et n'appartient à personne — exactement l'inverse de ce que cette
organisation cherche.

**Ce que la carte apporte**, et qu'aucun outil ne peut voir de sa place : un critère porté par
seize outils est devenu un MOTIF du projet, et un critère porté par un seul est un point de
fragilité qui disparaîtra le jour où cet outil-là changera.

## La carte, au 2026-09-23

```
— CARTE DES CRITÈRES TRANSVERSES (montrer, ne rien supprimer) —

● declare-mais-absent — « quelque chose est DÉCLARÉ quelque part et n'existe pas vraiment »
   40 fonction(s) réparties sur 16 outil(s) : angel-of-ia-process, check-suivi-fidelity, check-tasks-details, circle-process-guardian, circle-tasks, data-archangel, doc-report, el-professor…
● deux-sources-divergent — « deux endroits décrivent la même chose et ne disent plus pareil »
   7 fonction(s) réparties sur 6 outil(s) : always-new-code, check-level-target, circle-process-guardian, circle-tasks, clean-dirty-old, god-of-all-process
● duplication — « la même chose est dite ou écrite deux fois »
   9 fonction(s) réparties sur 5 outil(s) : clone-hunter, ecotoken, le-coordinateur, smart-conso-token, tool-learning
● existe-mais-non-declare — « quelque chose EXISTE et n'est déclaré nulle part »
   5 fonction(s) réparties sur 3 outil(s) : data-archangel, doc-report, el-professor
● mecanisme-muet — « un mécanisme existe et n'atteint personne »
   3 fonction(s) réparties sur 3 outil(s) : integration-outil, pure-gold-unity, tool-learning
● stagnation — « quelque chose n'a pas bougé depuis trop longtemps »
   3 fonction(s) réparties sur 3 outil(s) : circle-tasks, priorites, tasks-process-guardian
● promesse-creuse — « une promesse est faite et rien ne la tient »
   2 fonction(s) réparties sur 2 outil(s) : a-niveau, circle-tasks

648 fonction(s) exportée(s) n'entrent dans aucun critère : ce n'est jamais un défaut, la plupart ne cherchent rien (elles calculent, formatent ou enregistrent).
Cette carte regroupe par VOCABULAIRE, jamais par sens : deux fonctions qui cherchent la même chose sous deux noms différents y restent séparées. À lire, jamais un verdict.
```

## Ce que ces chiffres disent

**Un motif domine largement : « quelque chose est déclaré quelque part et n'existe pas vraiment ».**
Quarante fonctions, seize outils. Ce n'est pas un hasard et ce n'est pas une redondance : c'est la
forme que prend la dette dans un projet où presque tout est déclaré quelque part — une table
maîtresse, un catalogue, un registre, une charte. Chaque déclaration crée la possibilité d'une
promesse creuse, et le paysage a appris, poste par poste, à les traquer.

**Trois critères ne tiennent qu'à deux ou trois endroits** — le mécanisme muet, la promesse creuse,
la stagnation. Ce sont les plus fragiles de la carte, et deux d'entre eux ont justement produit une
trouvaille majeure cette nuit : un garde-fou qui n'avait aucun appelant, et une exigence qui
annonçait un vérificateur inexistant. Peu de porteurs ne veut pas dire peu de valeur ; ça veut dire
peu de filets sous celui qui porte.

**648 fonctions exportées n'entrent dans aucun critère**, et c'est normal : la plupart calculent,
formatent ou enregistrent — elles ne cherchent rien. Ce nombre n'est pas un arriéré.

## La limite de cette carte, déclarée

Elle regroupe par **vocabulaire**, jamais par sens. Deux fonctions qui cherchent la même chose sous
deux noms différents y restent séparées ; deux fonctions qui partagent un mot sans partager
l'intention s'y retrouvent ensemble. C'est une carte à lire, jamais un verdict — et c'est pour ça
qu'elle ne propose aucune suppression, au-delà même de la consigne.

## Ce qui reste ouvert

Rien n'a été retiré, rien n'a été fusionné : c'était la consigne. Si un jour l'un de ces critères
mérite une formulation commune (une fonction partagée plutôt que dix variantes), la décision
appartient à l'utilisateur, et cette carte est le document sur lequel elle se prendra.
