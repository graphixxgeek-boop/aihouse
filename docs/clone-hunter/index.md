# clone-hunter — index des clusters trouvés

*(Cf. `docs/referentiel/clone-hunter.md` pour les règles complètes. Ce fichier archive un constat
réel d'un passage `node scripts/clone-hunter.mjs` — jamais un journal automatique, l'outil lui-même
n'écrit rien de son propre chef ; c'est l'agent qui pilote qui consigne ici ce qui a été trouvé et
ce qui en a été fait.)*

| Date | Clusters trouvés | Action |
|---|---|---|
| 2026-09-21 | 7 (dans scripts/, hors components/ui exclu) — le plus significatif : `loadJson()` dupliqué verbatim entre `scripts/smart-conso-api.mjs` et `scripts/smart-conso-token.mjs` (8 lignes) | Construction initiale — premier passage réel, aucune factorisation appliquée ce soir, laissé pour un futur passage CIRCLE-TASKS (`clone-hunter-run`) |
