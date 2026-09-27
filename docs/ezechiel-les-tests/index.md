# ezechiel-les-tests — registre des passages

*(Un passage par enquête. À remplir à la main : Ezechiel rend un rapport, il ne tient pas son
registre tout seul — et le déclarer vaut mieux que de laisser croire le contraire.)*

## Les dépôts de ce dossier

| Fichier | Ce que c'est | Qui l'écrit |
|---|---|---|
| `historique.json` | les vingt derniers relevés chronométrés (date, durée totale, code de sortie, nombre d'anomalies). C'est LUI qui permet de parler de GAIN : un relevé seul décrit un état, c'est la suite qui dit si un changement a servi à quelque chose. | `node scripts/ezechiel-les-tests.mjs sante` |
| `robustesse.json` | les dix dernières passes de robustesse, chaque cassure volontaire identifiée par fichier + ligne + opérateur et son verdict (attrapée / survivante). C'est LUI qui permet de dire ce qu'un allègement a coûté en protection. | `node scripts/ezechiel-les-tests.mjs robustesse` |
| `mesures.json` | le chronométrage du filet groupe par groupe ET sa santé de fonctionnement du dernier passage réel. Écrasé à chaque `mesurer` : c'est l'état du DERNIER relevé, jamais une archive qui grossirait. | `node scripts/ezechiel-les-tests.mjs sante` |

## Les passages

| Date | Filet nu | Part des tests | Sans assertion | Sans raison | Imports morts | Décision |
|---|---|---|---|---|---|---|
| 2026-09-27 | 116 s | 95 % | 6 | 1 | 0 | premier passage — 3 défauts d'Ezechiel lui-même corrigés le jour même |
| 2026-09-27 (2) | 101 s | 89 % | 6 | 1 | 0 | premier relevé CHRONOMÉTRÉ et premier voyant de santé. Le filet nu vaut 101 s, pas les 43,7 s de la mesure du 2026-09-25 : il a plus que doublé en deux jours. L'enveloppe (couverture V8 + `tsc`) ne pèse que ~12 s sur 113 — **le temps est dans les tests eux-mêmes**, ce qui invalide l'hypothèse de départ de ce chantier. Le voyant de santé a trouvé un défaut à son premier passage, et c'était le SIEN : « 4 succès jamais imprimés » désignait quatre fixtures citées dans une chaîne de caractères, corrigé le jour même (295 attendus = 295 imprimés). |
| 2026-09-27 (3) | **92 s** | 89 % | 6 | 1 | 0 | **Après le partage du décor (#1036).** 105,7 s → 92,1 s, soit **13,6 s et 12,9 %**, à protection strictement égale — aucun test retiré, 298/298 succès imprimés. Les lectures de fichiers passent de **21 911 à 4 666** et le volume lu de **108,6 à 23,4 Mo** : le gain en temps est bien plus modeste que le gain en lectures parce que le système gardait déjà une partie des fichiers en mémoire, et le dire vaut mieux qu'annoncer 79 %. **Le profil d'après montre la marche suivante** : le bloc INES-official reste à **13,3 s à lui seul (14,4 %)** parce que son balayage n'est pas encore branché sur le décor partagé, et huit autres gros consommateurs ne le sont pas non plus — god-of-all-process, check-tasks-details, ecotoken, data-archangel, CASSANDRA-RH, CIRCLE-TASKS, tool-brain, doc-report. Le top 12 pèse encore 67,3 %. |
