# ARGUS — index des balayages et trouvailles

*(Cf. `docs/referentiel/argus.md` pour les règles complètes. Ce fichier résume, par exécution, ce
qui a été détecté et ce qui en a été fait — sert à retrouver rapidement un rapport archivé sans
avoir à tous les rouvrir. Une entrée se met à jour dès qu'un trou trouvé ici est fermé ailleurs.)*

| Date | Rapport | Trouvailles confirmées | Notes |
|---|---|---|---|
| 2026-09-19 | [scan-2026-09-19-17-05.txt](scan-2026-09-19-17-05.txt) | `trottoirGranted` (lib/life.ts) jamais lu nulle part après avoir été positionné à `true` — le bonus "trottoir" enregistre un accès narré qui n'est ensuite jamais consulté pour changer quoi que ce soit (même famille de bug que le bouton jour/nuit manuel, corrigé plus tôt le même jour) | Premier balayage réel d'ARGUS, lancé le jour de sa création (demande explicite de l'utilisateur). 6 autres champs signalés en confiance "probable" (`ambientSeen`, `observerNamed`, `lastCause`, `exitSearched`, `proposalHistoryChecked`, `personalBoosted`) — `exitSearched` vérifié manuellement et écarté (faux positif, réellement lu dans `lib/turn.ts`) ; les 5 autres restent à vérifier avant d'agir. `trottoirGranted` reste ouvert, correctif à concevoir (que doit changer concrètement l'accès "trottoir" une fois accordé ?) — pas encore tranché avec l'utilisateur. |
