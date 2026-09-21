# objectifs-vs-resultats — registre des objectifs

Table hand-maintained (jamais générée) : chaque ligne fixe un objectif chiffré pour une entité (un
slug d'outil connu de `.tool-usage-history.json`) sur une période donnée. `scripts/objectifs-vs-resultats.mjs`
ne modifie jamais ce fichier lui-même — il le lit et calcule l'écart avec le résultat réel.

Colonnes : `Source` dit quel signal déjà existant mesure le résultat réel (jamais un second calcul
divergent) — `usage-count` (nombre de sollicitations réelles sur la période) ou `found-rate` (%
de sollicitations ayant réellement trouvé quelque chose). Les dates sont au format `AAAA-MM-JJ` ;
aucune cadence calendaire fixe n'est imposée — chaque objectif choisit librement son début/fin.

| Entité | Début | Fin | Objectif | Unité | Source | Note |
|---|---|---|---|---|---|---|
| tool-brain | 2026-09-21 | 2026-09-28 | 5 | sollicitations | usage-count | Premier objectif de calibrage, fixé le soir de sa construction — vérifier que la consultation proactive prend réellement (pas seulement le rappel post-commit automatique). |
