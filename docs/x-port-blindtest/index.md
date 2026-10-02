# Registre — X-Port BLINDTEST

**Ce qu'on note ici** : ce que les tests à l'aveugle ont révélé sur la QUALITÉ des kits — et, au
début, sur l'outil lui-même. La mémoire des membres déjà passés vit à côté, dans `passages.json`,
lue par le tirage.

| Date | Ce qu'il a trouvé | Ce qui en a découlé |
|---|---|---|
| 2026-09-26 | **Son premier vrai passage a réfuté sa propre détection, le jour de sa construction.** La version du matin classait un manque en « systémique » en comparant des NOMS DE FONCTIONS aux TITRES DE SECTIONS du gabarit — deux vocabulaires qui n'ont rien en commun par construction. Elle aurait crié systémique sur à peu près tout, tout le temps : une machine à faux positifs, et un garde-fou qui accuse à tort cesse d'être lu (leçon L4). | La question est devenue **unique et binaire, posée au gabarit** : demande-t-il à qui que ce soit de lister ce que l'outil expose ? Non → systémique pour tous. Oui → local à ce kit. |
| 2026-09-26 | **`buildPlanDaction()` rend un OBJET, pas des lignes.** Le rapport imprimait « [object Object] » à la place du plan d'action — c'est-à-dire le maillon que l'Article 28 rend obligatoire, perdu en silence dans un fichier par ailleurs impeccable. Vu en lançant l'outil pour de vrai, jamais en le relisant. | `plan.lignes` au lieu de `plan`. Et la leçon derrière : un rapport peut être parfaitement formé et avoir perdu sa seule partie qui engage. |
| 2026-09-26 | **Le gabarit ne demande à personne de lister ce que l'outil expose** — constat produit par le premier passage, sur les 12 rubriques des deux gabarits. Si un vrai passage aveugle le confirme, c'est un défaut SYSTÉMIQUE : les 82 kits auraient le même trou, et corriger un seul kit ne servirait à rien. | **À instruire, pas encore acté** : ce constat vient d'un pronostic fabriqué mécaniquement pour tester la chaîne, jamais d'un vrai agent aveugle. Le dire autrement serait exactement le faux résultat que cet outil existe pour empêcher. |

| 2026-10-02 | **Le tirage est tombé sur un fichier que la charte dispense de kit, et l'outil a crié.** `scripts/hooks/pre-commit` est l'un des trois fichiers dont la charte déclare, AVEC sa raison, qu'il ne quittera jamais ce dépôt ; l'outil a refusé de tester en annonçant qu'il « n'a AUCUN document lisible ». Vrai, et faux rouge : réclamer un kit d'export à un crochet git, c'est demander un travail que la charte interdit (leçon L4). **Le plus instructif** : la classe était DÉJÀ corrigée chez `findScriptsNonPortables()` depuis le 2026-09-26, et cet outil importait même déjà `exemptionDuKit` pour un autre usage deux cents lignes plus bas — la correction n'avait simplement pas été héritée (Article 24). Les dispensés sortent maintenant de la population, et leur nombre est rendu plutôt que tu. |
| 2026-10-02 | **`scripts/find-booster.mjs` (vital, jamais testé) — 🟡 KIT PERFECTIBLE : 92 % de rappel, 7 % de bruit.** 12 des 13 fonctions réelles étaient annonçables depuis les documents seuls. Un manque (`HARMONIA_THEME_KEYWORDS`) et une annonce fausse (`DESCRIPTION_PREVIEW_LENGTH`, que la fiche nomme alors que le code ne l'expose pas). **Le manque est SYSTÉMIQUE et c'est le constat qui vaut** : aucune des 12 rubriques du gabarit ne demande de lister ce que l'outil EXPOSE, donc tous les kits portent le même trou. L'évaluateur aveugle a par ailleurs relevé huit zones d'ombre qu'aucune mesure mécanique ne voit : incohérence de langue des noms (anglais partout sauf une section en français), comptage contradictoire des motifs d'extraction (cinq décrits, « quatre » annoncés trois fois), aucun contrat de données, et `lib/reference.ts` — retiré du produit le 2026-09-27 — toujours donné comme exemple central. |
<!-- SOMMAIRE GÉNÉRÉ — ne rien écrire dans ce bloc, il se régénère -->
## Fichiers

**2 fichier(s)** dans ce dossier.

| Fichier | Sous-dossier |
|---|---|
| [conformite-2026-09-26.txt](conformite-2026-09-26.txt) | — |
| [passages.json](passages.json) | — |
<!-- FIN DU SOMMAIRE GÉNÉRÉ -->
