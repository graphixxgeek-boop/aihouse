# Registre des sauvegardes

*(Produit par `scripts/sauvegarde-projet.mjs`. Seules les 3 dernières sont gardées sur disque : le coffre le plus récent contient déjà tout ce que les précédents contenaient, puisque l'historique du projet est fait de fichiers du projet.)*

| Date | État du code | Coffre (.zip) | Notice (.txt) |
|---|---|---|---|
| 2026-09-24 21:09 | 7901d7a | 881 fichiers, 6.1 Mo | 48 fichiers, 1.0 Mo |
| 2026-09-24 21:10 | 7901d7a | 881 fichiers, 6.1 Mo | 41 fichiers, 1.0 Mo |
| 2026-09-25 14:11 | 7b1799c | 929 fichiers, 6.5 Mo | 47 fichiers, 1.0 Mo |

| 2026-10-02 | **Sauvegarde de la Ronde GOAT : coffre 14,1 Mo (1 827 fichiers), notice 1,0 Mo (55 fichiers).** Livrée le jour même. |
| 2026-10-02 | **LA RÉTENTION PASSE DE 3 COPIES À UNE SEULE, sur sa décision explicite** : « on garde uniquement la dernière sauvegarde, et non 3, ça va alléger, c'est le but ». Les deux anciennes lui ont été REMISES avant d'être élaguées — elles n'étaient pas versionnées, donc les effacer d'abord aurait détruit sa seule copie. Dossier : 32 Mo → 14 Mo. |
| 2026-10-02 | **TROIS FAITS VÉRIFIÉS CE JOUR-LÀ, et l'un corrige ce que je lui avais écrit.** (1) Rien dans l'outillage ne LIT ces fichiers : les trois scripts qui citent ce dossier ne font que le déclarer comme registre. (2) Ils ne sont PAS dans git et ne l'ont jamais été — `.gitignore` les exclut depuis sa ligne 77 — donc mon document lui proposait une « option C : les sortir du dépôt » déjà faite. (3) `git archive` régénère l'équivalent d'une sauvegarde passée (9,4 Mo contre 9,6 pour celle du 28), donc élaguer ne détruit aucune capacité. |
| 2026-10-02 | **LE RISQUE QUE PERSONNE N'AVAIT VU, et c'est le vrai apport du jour** : n'étant pas versionnés, ces fichiers vivent UNIQUEMENT dans le conteneur de travail, qui est éphémère. Une sauvegarde produite et jamais remise disparaît donc sans que quiconque le sache. D'où `findSauvegardesNonLivrees()`, à sa demande (« si l'utilisateur ne TÉLÉCHARGE PAS le zip, l'agence doit lui signaler »). **Sa limite est déclarée** : aucun code d'ici ne peut observer un TÉLÉCHARGEMENT — le garde-fou mesure la REMISE par l'agent, et il le dit dans son message plutôt que de laisser croire l'un pour l'autre. Il couvre la moitié attrapable, et le cas craint commence toujours par une non-remise. |
| 2026-10-02 | **`remises.json` rejoint ce dossier, et c'est la seule pièce de l'ensemble qui soit VERSIONNÉE.** Les coffres et les notices sont ignorés par git (lignes 77-78 du `.gitignore`), donc ils meurent avec le conteneur ; la mémoire de ce qui a été REMIS, elle, doit survivre — sinon le garde-fou de non-remise repartirait de zéro à chaque session et accuserait la dernière sauvegarde d'être perdue alors qu'elle venait d'être livrée. C'est aussi pour ça qu'il n'est pas purgé quand un coffre est élagué : c'est un JOURNAL de remises, jamais un inventaire du dossier. |
<!-- SOMMAIRE GÉNÉRÉ — ne rien écrire dans ce bloc, il se régénère -->
## Dépôts sans ligne de journal *(reconstitué)*

*(Ces passages ont laissé un fichier et aucune ligne. La liste est RECONSTITUÉE depuis les fichiers eux-mêmes : elle dit qu'un dépôt a eu lieu, jamais ce que l'outil a mesuré ce jour-là — cette donnée-là est perdue, et l'inventer serait pire que de la déclarer perdue.)*

**1 dépôt(s)** sans trace.

| Fichier | Date lue dans le nom |
|---|---|
| [circle-signals-index.md](circle-signals-index.md) | — |
<!-- FIN DU SOMMAIRE GÉNÉRÉ -->
| 2026-09-28 13:35 | 6ee82d1 | 1327 fichiers, 9.4 Mo | 55 fichiers, 1.0 Mo |
| 2026-10-02 16:45 | f42294a | 1663 fichiers, 13.5 Mo | 55 fichiers, 1.0 Mo |
