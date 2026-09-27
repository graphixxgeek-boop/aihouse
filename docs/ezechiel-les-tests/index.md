# ezechiel-les-tests — registre des passages

*(Un passage par enquête. À remplir à la main : Ezechiel rend un rapport, il ne tient pas son
registre tout seul — et le déclarer vaut mieux que de laisser croire le contraire.)*

## Les dépôts de ce dossier

| Fichier | Ce que c'est | Qui l'écrit |
|---|---|---|
| `mesures.json` | le chronométrage du filet groupe par groupe ET sa santé de fonctionnement du dernier passage réel. Écrasé à chaque `mesurer` : c'est l'état du DERNIER relevé, jamais une archive qui grossirait. | `node scripts/ezechiel-les-tests.mjs sante` |

## Les passages

| Date | Filet nu | Part des tests | Sans assertion | Sans raison | Imports morts | Décision |
|---|---|---|---|---|---|---|
| 2026-09-27 | 116 s | 95 % | 6 | 1 | 0 | premier passage — 3 défauts d'Ezechiel lui-même corrigés le jour même |
| 2026-09-27 (2) | 101 s | 89 % | 6 | 1 | 0 | premier relevé CHRONOMÉTRÉ et premier voyant de santé. Le filet nu vaut 101 s, pas les 43,7 s de la mesure du 2026-09-25 : il a plus que doublé en deux jours. L'enveloppe (couverture V8 + `tsc`) ne pèse que ~12 s sur 113 — **le temps est dans les tests eux-mêmes**, ce qui invalide l'hypothèse de départ de ce chantier. Le voyant de santé a trouvé un défaut à son premier passage, et c'était le SIEN : « 4 succès jamais imprimés » désignait quatre fixtures citées dans une chaîne de caractères, corrigé le jour même (295 attendus = 295 imprimés). |
