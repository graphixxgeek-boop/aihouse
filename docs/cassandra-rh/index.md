# CASSANDRA-RH — registre

Trouvailles réelles au fil des vrais passages (un écart de badge confirmé, un outil signalé à
retirer/refondre et la décision prise) — jamais un journal théorique. Cf.
`docs/referentiel/cassandra-rh.md` pour le mécanisme complet.

## 2026-09-21 — noyau fiabilisé, premier passage réel

Bug réel trouvé et corrigé avant le tout premier passage live : `teamRoster()` slugifiait le texte
entier d'une colonne Outil portant une précision entre parenthèses, laissant 4 Agents réels
(CLONE-HUNTER, memory-audit, find-booster, objectifs-vs-resultats) affichés à tort comme « catégorie
non répertoriée ». Corrigé — vérifié en direct contre la vraie table maîtresse : zéro Agent réel non
catégorisé.

Aucune trouvaille RH de fond encore enregistrée (badge/effectif/outil à retirer) — le premier
passage réel sert de ligne de base.

## Passage du 2026-09-22 (Ronde CIRCLE-TASKS, mode AUTO, exécutée par Opus 5)

**Effectif** : 21 membres actifs — 6 Gardiens sacrés du code, 3 Suite Suivi-Conso, 1 Agent Spécial,
3 Suite Audit lourd, 3 Suite Audit Simulation, 3 La Cour du Roi, 1 Suite Dette & Structure du code,
1 Agent Cadre. **Badges : 21/21 certifiés.**

**Tendance KPI** (lue depuis `kpi-historique.csv`, jamais recalculée) : `smart_breaker_performance_pct`
91,62 % (**-4 pt**, seule vraie baisse du passage) ; `qualite_pct` 99,5 % (-0,5) ; `coherence_pct`
99,5 % (-0,1) ; tout le reste stable (`robustesse_code_pct` 99,79 %, `rejouabilite_pct` 100 %,
`smart_breaker_amelioration_pct` 87,5 %, `smart_conso_pct` 71 %, `couverture_tdb_pct` 33,33 %).

**Outils à retirer ou refondre — 7 membres certifiés n'ont JAMAIS été sollicités une seule fois**
(`tool-usage.mjs`, cumul permanent) : EL-PROFESSOR, THE-SCREENER, THE-FINAL-JUDGE, THE-DEEP-READER,
check-tasks-details, INES-official, memory-audit. C'est un tiers de l'effectif. Le constat est
chiffré, jamais un jugement : plusieurs de ces outils sont par conception réservés à une occasion
rare (une simulation Article 18 pour EL-PROFESSOR/THE-SCREENER, un audit lourd pour
THE-FINAL-JUDGE/THE-DEEP-READER) — mais aucune de ces occasions n'est survenue depuis leur
construction, ce qui est en soi le vrai signal.

**Trous de couverture de test** (AXA-CHECK, jamais recalculé) : HARMONIA **25 %** (le plus bas de
l'équipe, et c'est un Gardien sacré), ARGUS 60 %, HYPER-SCAN-CHECKPOINT 63 %, AXA-CHECK lui-même
63 %, Smart Conso API 64 %, THE-DEEP-READER 67 %. **THE-SCREENER : jamais scanné.**

<!-- SOMMAIRE GÉNÉRÉ — ne rien écrire dans ce bloc, il se régénère -->
## Fichiers

**26 fichier(s)** dans ce dossier.

| Fichier | Sous-dossier |
|---|---|
| [carte-des-axes-2026-09-25-19-45.html](carte-des-axes-2026-09-25-19-45.html) | — |
| [carte-des-axes-2026-09-25-21-04.html](carte-des-axes-2026-09-25-21-04.html) | — |
| [carte-des-axes-2026-09-27-05-08.html](carte-des-axes-2026-09-27-05-08.html) | premier passage réussi de la commande `axes` depuis la scission — elle plantait au démarrage (tâche #1011) |
| [circle-signal-2026-09-22T17-20-06-065Z.txt](circle-signal-2026-09-22T17-20-06-065Z.txt) | — |
| [circle-signal-2026-09-22T17-42-10-135Z.txt](circle-signal-2026-09-22T17-42-10-135Z.txt) | — |
| [circle-signal-2026-09-23T21-49-13-828Z.txt](circle-signal-2026-09-23T21-49-13-828Z.txt) | — |
| [circle-signal-2026-09-24T21-48-39-565Z.txt](circle-signal-2026-09-24T21-48-39-565Z.txt) | — |
| [circle-signal-2026-09-25T14-14-12-659Z.txt](circle-signal-2026-09-25T14-14-12-659Z.txt) | — |
| [circle-signals-index.md](circle-signals-index.md) | — |
| [convocations.md](convocations.md) | — |
| [couches-des-gardiens-2026-09-26.md](couches-des-gardiens-2026-09-26.md) | — |
| [2026-09-23-EVAL-DEV.html](evaluations/2026-09-23-EVAL-DEV.html) | evaluations |
| [2026-09-23-EVAL-IA.html](evaluations/2026-09-23-EVAL-IA.html) | evaluations |
| [EVAL-DEV-2026-09-22.md](evaluations/EVAL-DEV-2026-09-22.md) | evaluations |
| [eval-dev-2026-09-23.html](evaluations/eval-dev-2026-09-23.html) | evaluations |
| [eval-ia-2026-09-23.html](evaluations/eval-ia-2026-09-23.html) | evaluations |
| [eval-ia.md](evaluations/eval-ia.md) | evaluations |
| [dossier-conception-exploitation-2026-09.txt](gouvernance/dossier-conception-exploitation-2026-09.txt) | gouvernance |
| [circle-signal-2026-09-22T05-01-47-467Z.txt](organigramme/circle-signal-2026-09-22T05-01-47-467Z.txt) | organigramme |
| [circle-signal-2026-09-22T17-19-15-256Z.txt](organigramme/circle-signal-2026-09-22T17-19-15-256Z.txt) | organigramme |
| [circle-signal-2026-09-22T17-42-10-136Z.txt](organigramme/circle-signal-2026-09-22T17-42-10-136Z.txt) | organigramme |
| [circle-signal-2026-09-23T21-49-13-832Z.txt](organigramme/circle-signal-2026-09-23T21-49-13-832Z.txt) | organigramme |
| [circle-signal-2026-09-25T14-14-12-639Z.txt](organigramme/circle-signal-2026-09-25T14-14-12-639Z.txt) | organigramme |
| [circle-signal-2026-09-27T00-12-15-625Z.txt](organigramme/circle-signal-2026-09-27T00-12-15-625Z.txt) | organigramme |
| [circle-signals-index.md](organigramme/circle-signals-index.md) | organigramme |
| [serie.json](serie.json) | — |
| [versions-outils-2026-09-24.txt](versions-outils-2026-09-24.txt) | — |
<!-- FIN DU SOMMAIRE GÉNÉRÉ -->
