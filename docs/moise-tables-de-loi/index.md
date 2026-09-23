# Registre de MOÏSE-TABLES-DE-LOI

*(Un passage par ligne. Le registre garde ce que le rapport, lui, ne garde pas : ce qui a été trouvé
ET ce qui en a été fait. Un passage sans suite se voit ici, jamais dans la sortie du jour.)*

| Date | Commande | Ce qui a été trouvé | Suite donnée |
|---|---|---|---|
| 2026-09-23 | `diagnostic` (premier passage réel) | 192 obligations pour 125 suivables · 8 Articles portés / 22 sans porteur / 0 fantôme · 3 sections d'inventaire hors Articles (~6 273 tk) · table de classification périmée de 6 Articles · aucune mémoire d'opération | La table a été régénérée, la mémoire amorcée avec 4 opérations reconstituées, `mesurerSections()` ajouté après que le diagnostic eut annoncé « INVENTAIRE : aucun Article » — exact et trompeur. |
| 2026-09-23 | `porteursDeclares` (calibrage) | La première version de la mesure répondait « porté » pour les 30 Articles : une mention en commentaire comptait comme un mécanisme. | Mesure refaite en deux temps (l'Article nomme-t-il son porteur ? ce porteur existe-t-il ?), trois états au lieu de deux. Leçon versée au registre des leçons. |
| 2026-09-23 | `table` (commande créée le jour même) | La table de classification était périmée de 6 Articles depuis le 2026-09-20. | Régénérée : 30/30 Articles, 0 redondance au seuil strict. **Et surtout la CAUSE a été corrigée, pas seulement le symptôme** : la régénérer demandait jusque-là une incantation `node -e` de quinze lignes recopiée depuis un document, donc personne ne la relançait. Un geste sans commande n'est pas un geste, c'est une intention (Article 3). |
