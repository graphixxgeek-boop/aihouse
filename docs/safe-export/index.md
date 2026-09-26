# Registre — SAFE-EXPORT

*(Créé le 2026-09-26, sur sa question : « chez qui ce doc txt kits d'export existe-t-il ? à
enregistrer ». Réponse : chez SAFE-EXPORT, pas chez CASSANDRA — c'est lui le Gardien de
l'exportabilité. Et ce dossier n'avait **pas d'index**, donc SAFE-EXPORT était lui-même un outil
dont le propre kit était incomplet. Trouvé en répondant à sa question, pas par un scan.)*

Un passage par ligne. On note ce que l'outil a **trouvé**, jamais qu'il a tourné sans erreur.

## Ce que chaque commande dépose ici

| Commande | Ce qu'elle écrit | Ce qu'elle répond |
|---|---|---|
| `node scripts/safe-export.mjs` | `exportabilite-<date>.txt` | le dépôt est-il lisible et reprenable par une autre IA ? |
| `node scripts/safe-export.mjs export` | *(affichage)* | vitalité du parc × blueprints, empreinte disque, relais de modèle |
| `node scripts/safe-export.mjs kits` | `kits-<date>.txt` | chaque fichier peut-il être **remonté ailleurs** ? |

`memoire.json` et `serie.json` sont les journaux internes de l'outil : sa mémoire d'un passage à
l'autre, jamais des rapports à lire.

## Les passages

| Date | Ce qu'il a trouvé | Ce qui en a découlé |
|---|---|---|
| 2026-09-26 | **Kits d'export, premier passage sous la règle universelle** : 89 fichiers, 82 kits dus, 7 dispensés avec raison, **33 complets, 49 incomplets**. Les optionnels sont passés de 100 % (ancienne règle proportionnelle) à **18 %** — le premier chiffre mesurait une exigence si basse qu'elle ne demandait rien. Coût mesuré pour tout combler : **105 documents** (44 blueprints, 43 fiches, 18 index). | Règle corrigée sur sa décision (ligne de suivi n°969) ; comblement lancé par ordre de réparation, les vitaux d'abord. |
| 2026-09-26 | **Ce dossier n'avait pas d'index** — SAFE-EXPORT mesurait la complétude des kits de tout le monde et son propre registre n'existait pas. | Cet index, créé le jour même. |
