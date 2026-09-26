# Registre — X-Port BLINDTEST

**Ce qu'on note ici** : ce que les tests à l'aveugle ont révélé sur la QUALITÉ des kits — et, au
début, sur l'outil lui-même. La mémoire des membres déjà passés vit à côté, dans `passages.json`,
lue par le tirage.

| Date | Ce qu'il a trouvé | Ce qui en a découlé |
|---|---|---|
| 2026-09-26 | **Son premier vrai passage a réfuté sa propre détection, le jour de sa construction.** La version du matin classait un manque en « systémique » en comparant des NOMS DE FONCTIONS aux TITRES DE SECTIONS du gabarit — deux vocabulaires qui n'ont rien en commun par construction. Elle aurait crié systémique sur à peu près tout, tout le temps : une machine à faux positifs, et un garde-fou qui accuse à tort cesse d'être lu (leçon L4). | La question est devenue **unique et binaire, posée au gabarit** : demande-t-il à qui que ce soit de lister ce que l'outil expose ? Non → systémique pour tous. Oui → local à ce kit. |
| 2026-09-26 | **`buildPlanDaction()` rend un OBJET, pas des lignes.** Le rapport imprimait « [object Object] » à la place du plan d'action — c'est-à-dire le maillon que l'Article 28 rend obligatoire, perdu en silence dans un fichier par ailleurs impeccable. Vu en lançant l'outil pour de vrai, jamais en le relisant. | `plan.lignes` au lieu de `plan`. Et la leçon derrière : un rapport peut être parfaitement formé et avoir perdu sa seule partie qui engage. |
| 2026-09-26 | **Le gabarit ne demande à personne de lister ce que l'outil expose** — constat produit par le premier passage, sur les 12 rubriques des deux gabarits. Si un vrai passage aveugle le confirme, c'est un défaut SYSTÉMIQUE : les 82 kits auraient le même trou, et corriger un seul kit ne servirait à rien. | **À instruire, pas encore acté** : ce constat vient d'un pronostic fabriqué mécaniquement pour tester la chaîne, jamais d'un vrai agent aveugle. Le dire autrement serait exactement le faux résultat que cet outil existe pour empêcher. |
