# clone-hunter — index des clusters trouvés

*(Cf. `docs/referentiel/clone-hunter.md` pour les règles complètes. Ce fichier archive un constat
réel d'un passage `node scripts/clone-hunter.mjs` — jamais un journal automatique, l'outil lui-même
n'écrit rien de son propre chef ; c'est l'agent qui pilote qui consigne ici ce qui a été trouvé et
ce qui en a été fait.)*

| Date | Clusters trouvés | Action |
|---|---|---|
| 2026-09-21 | 7 (dans scripts/, hors components/ui exclu) — le plus significatif : `loadJson()` dupliqué verbatim entre `scripts/smart-conso-api.mjs` et `scripts/smart-conso-token.mjs` (8 lignes) | Construction initiale — premier passage réel, aucune factorisation appliquée ce soir, laissé pour un futur passage CIRCLE-TASKS (`clone-hunter-run`) |
| 2026-09-21 (v2) | v1 : 7 clusters (inchangé). v2 (renommage, tâche #177) : 6 nouveaux clusters jamais vus par v1, dont `collectCoverage()` dupliquée deux fois dans `scripts/axa-check.mjs` (7 lignes, identifiants différents) et une boucle `totalFindings` quasi identique entre `scripts/hyper-scan-checkpoint.mjs` et `scripts/the-deep-reader.mjs` (9 lignes). Dogfooding immédiat : lancer v2 sur `clone-hunter.mjs` lui-même a révélé que v1 et v2 dupliquaient leur propre boucle de parcours de paires — corrigé dans la foulée (`findBlocksFromIndex()` extrait, partagé par les deux), zéro trouvaille sur clone-hunter.mjs après correction | v2 construite et testée (152 tests), aucune factorisation appliquée sur les 6 nouveaux clusters ce soir — laissé pour un futur passage CIRCLE-TASKS, sauf l'auto-référence trouvée en direct, corrigée immédiatement (Article 3) |
