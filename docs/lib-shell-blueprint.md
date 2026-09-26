# Lanceur de commande shell tolérant — blueprint générique

## Le problème qu'il ferme

Un outil d'analyse lance souvent des commandes dont **l'échec est une information, pas une panne** :
`git log` sur un fichier jamais commité, une recherche qui ne trouve rien. L'exécuteur standard
lève sur un code de sortie non nul, donc chaque appelant l'enveloppe dans un `try/catch` — et
réécrit trois lignes identiques.

## Le piège que la mutualisation évite

Ces trois lignes se recopient sans effort et **divergent sans bruit**. L'une avale l'erreur, l'autre
la journalise, une troisième rend `null` là où les deux premières rendent `""` — et l'appelant qui
teste la vérité de la valeur se comporte différemment selon la copie. Le symptôme apparaît des mois
plus tard, sur un seul outil, et ressemble à un bug métier.

## Ce qu'il fait, et ce qu'il refuse de faire

Il rend la sortie standard sur un succès, une chaîne vide sur un échec. **Il ne journalise rien par
défaut** : un détail d'erreur imprimé à chaque appel noierait la sortie de l'outil sous des échecs
attendus. Le détail est disponible pour qui le demande explicitement — parce que l'appelant qui en a
besoin est rare, et qu'il sait pourquoi.

## Ce qu'il ne doit jamais devenir

Un fourre-tout. La tentation est d'y verser toutes les constantes partagées du projet, puisque tout
le monde l'importe déjà. Un lanceur de commande qui porte l'organigramme est un lanceur que
personne ne peut exporter seul.

## Comment l'installer ailleurs

Une fonction, zéro dépendance. Ce qui s'emporte avec : la règle qu'aucun appelant ne réécrit sa
propre version « juste pour ce cas-là ».
