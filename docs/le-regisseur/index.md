# Registre — LE-RÉGISSEUR

**Ce qu'on note ici** : ce que l'orchestration mécanique du protocole a révélé sur le protocole
lui-même — jamais le contenu des simulations, qui vit dans `docs/simulations/`.

| Date | Ce qu'il a trouvé | Ce qui en a découlé |
|---|---|---|
| 2026-09-21 | **La frontière jugement / mécanique n'est pas lisible de l'extérieur** : les deux index du protocole ressemblent à des tableaux remplissables, et l'un d'eux dit lui-même en toutes lettres que le remplir est « un travail de lecture, pas un calcul ». Vérifié dans le contenu réel avant de coder, pas supposé. | Les deux index restent hors du périmètre. Les automatiser aurait produit des lignes plausibles et vides — pire que des lignes manquantes. |
| 2026-09-21 | **Le choix script plutôt qu'agent séparé est chiffré, pas idéologique** : ~37 000 tokens par appel d'agent contre le temps d'exécution d'un script, pour des gestes sans aucun raisonnement. | « Un script au statut membre de l'équipe », selon les mots de l'utilisateur. |
| 2026-09-26 | Kit d'export : plan, fiche et registre manquaient. | Ce fichier et ses deux voisins. |
