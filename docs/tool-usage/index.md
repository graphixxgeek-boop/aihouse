# Registre — le compteur d'usage

Un passage par ligne. On note ce que le compteur a **révélé**, jamais qu'il tourne.

| Date | Ce qu'il a révélé | Ce qui en a découlé |
|---|---|---|
| 2026-09-26 | `sauvegarde-projet` avait une ligne de commande et **n'enregistrait jamais son passage** — découvert parce qu'il venait d'entrer au catalogue, donc d'entrer dans le champ de vision du compteur. Son zéro ne mesurait pas son inactivité, il mesurait le silence du compteur. | `recordCliUsage` ajouté à la source ; verrou de Ronde repassé à zéro (suivi n°968). |
| 2026-09-26 | Registre créé : le compteur existait depuis le 2026-09-21 et **n'avait aucune trace de ses propres trouvailles**. | Ce fichier. |
