# Registre — run-simulation

**Ce qu'on note ici** : ce que le pilotage des simulations a révélé sur le PROTOCOLE — jamais le
contenu des simulations, qui vit dans `docs/simulations/`.

| Date | Ce qu'il a trouvé | Ce qui en a découlé |
|---|---|---|
| 2026-09-22 | **Dix-sept simulations archivées, zéro pilote conservé.** Le protocole disait « lancer LE script de simulation intégrale » et ce script n'avait jamais été committé : réécrit à la volée dans un dossier temporaire à chaque fois, perdu avec la session. Le protocole paraissait suivi, les archives s'accumulaient, et **deux simulations successives n'ont jamais été strictement comparables** — le scénario de phase 2 était retapé de mémoire. | Pilote committé, donc rejouable à l'identique. Sans ça, aucune comparaison entre deux versions ne voulait rien dire : on ignorait ce qui avait changé du produit et ce qui avait changé du scénario. |
| 2026-09-23 | **Un fichier non testable contamine tout ce qu'on y ajoute** : la mécanique de la photo de mémoire, placée ici, serait devenue invérifiable — et un même défaut a déjà survécu **trois simulations** pour cette raison exacte (leçon ④ de la nuit du 23). | La mécanique vit dans memory-audit ; le pilote se contente de tendre l'état. Trois lignes, rien à vérifier. |
| 2026-09-23 | Arbitrage tranché par l'utilisateur CONTRE la recommandation de l'agent : « photo à chaque tour » plutôt qu'une version minimale début/fin. | Noté ici parce qu'un arbitrage tranché contre l'avis de l'agent est précisément ce qu'un futur agent risque de « corriger » sans savoir (Article 19). |
| 2026-09-26 | Kit d'export : plan, fiche et registre manquaient. | Ce fichier et ses deux voisins. |
