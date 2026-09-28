# Session session_0151JrVYzJ2bdCShaXhFAjLo

*(Première session du système de suivi — cf. `docs/systeme-de-suivi.md` pour le format et la
portée rétroactive décidée avec l'utilisateur : démarre à partir de la création du système, sans
reconstruire les tâches déjà terminées avant son existence dans cette même session.
**Mise à jour du 2026-09-19T20:35Z** : ce fichier n'avait pas été retouché depuis 16h45 — trouvaille
réelle de `findOpenTasks()` fraîchement construit, qui montrait encore ARGUS/HARMONIA "en cours"
alors que terminés depuis des heures, et rien du travail effectué depuis. Statuts corrigés et
tâches manquantes ajoutées ci-dessous.)*

**Découpage du 2026-09-22** : les tâches #117 à #200 vivent dans [`session_0151JrVYzJ2bdCShaXhFAjLo-partie-1.md`](session_0151JrVYzJ2bdCShaXhFAjLo-partie-1.md) et les tâches #201 à #299 dans [`session_0151JrVYzJ2bdCShaXhFAjLo-partie-2.md`](session_0151JrVYzJ2bdCShaXhFAjLo-partie-2.md) — aucune ligne perdue ni résumée, seulement déplacée (ce fichier pesait ~109 295 tokens, le plus lourd du dépôt). Ce fichier-ci reste la tranche VIVANTE : toute nouvelle tâche s'écrit ici.


## Tâches

| N° | Horodatage | Mot-clé | Sujet | Sous-sujet | Sensibilité | Description | Statut |
|---|---|---|---|---|---|---|---|





















| 390 | 2026-09-22T11:50Z | imprecision | Outillage / badge | Imprécision résiduelle consignée : ARGUS et CLONE-HUNTER sont mesurés à l'échelle du dépôt, pas de l'outil | RECOMMANDE-NECESSAIRE | Rendue visible par la tâche #389 : tous les afficheurs lisent enfin les 6 signaux, donc un outil propre affiche quand même `partiel (KO ARGUS, KO CLONE-HUNTER)` à cause d'une trouvaille ailleurs dans le dépôt. Pas une régression (le post-commit passait déjà ces comptes globaux à tous) mais une imprécision devenue visible. Non corrigeable uniformément : la couche mécanique d'ARGUS ne scanne que lib/life.ts et des marqueurs TODO, aucune trouvaille attribuable à un script d'outil ; CLONE-HUNTER et CLEAN-DIRTY-OLD seraient attribuables. Deux lectures légitimes du palier (« le réseau est au vert » vs « CET outil est au vert ») — consignée dans points-fragiles.md, aucune modification du libellé calibré (tâche #226) sans décision de l'utilisateur. | en attente de décision |

## Notes

- Les tâches terminées avant la création de ce système (chantier 2 du tableau de bord, full_sim10,
  règles de suivi première version, etc.) ne sont pas reconstruites ici — portée rétroactive
  tranchée explicitement avec l'utilisateur (cf. `docs/systeme-de-suivi.md`). Elles restent
  consultables dans l'historique de conversation et dans les documents qu'elles ont produits
  (`docs/referentiel/tableau-de-bord.md`, `docs/referentiel/kpi-index.md`, etc.).
- Les horodatages approximatifs (`~17h`, `~18h`, etc.) reflètent l'absence d'horodatage exact
  enregistré au moment de la clôture initiale de ces tâches, avant que ce fichier ne soit remis à
  jour le 2026-09-19T20:35Z — jamais reconstruits avec une fausse précision.


## Tâches archivées (104)

*(Leur texte intégral, intact et inchangé, vit dans le dossier `docs/suivi/archives/`. Rien
n'a été supprimé ni résumé : ces lignes ont été DÉPLACÉES, caractère pour caractère, pour que
le fichier de travail ne porte plus que ce qu'on relit vraiment. Se retrouvent par leur
numéro — cf. tâche #1024.)*

- #300 — Simulation / Analyse (full_sim17)
- #301 — Charte / Outillage de travail (EL-PROFESSOR, KPI)
- #302 — Charte / Refonte graphique (html-report.mjs)
- #303 — Charte / Relation Lia-Noé (Correctif 2, loveRealized)
- #304 — Charte / Outillage de travail (CLAUDE.md, CASSANDRA-RH, mode nocturne)
- #305 — Outillage de travail (check-tasks-details, tâche #185)
- #306 — Outillage de travail (find-booster, tâche #180)
- #307 — Méthode de travail / Suivi (rattrapage)
- #308 — Méthode de travail / Suivi (rattrapage)
- #309 — Outillage de travail (ALWAYS-NEW-CODE, tâche #170)
- #310 — Méthode de travail / Suivi (mode nocturne autonome)
- #311 — Nouvel outil / Outillage de travail (THE-GHOST)
- #312 — Nouvel outil / Outillage de travail (find-brain)
- #313 — Méthode de travail / Outillage de travail (find-brain, Article 13)
- #314 — Conception / Nouvel outil (CASSANDRA-RH, Stagiaires)
- #315 — Nouvel outil / Reclarification organigramme (tool-brain, Membre certifié)
- #316 — Livrable / CASSANDRA-RH (organigramme visuel)
- #317 — Nouveau document / Conception (organisation-globale-projet, LE-GRAND-ARCHITECTE)
- #318 — Calibrage / Conception (LE-GRAND-ARCHITECTE, organisation-globale-projet)
- #319 — Nouvel outil / Correctif (objectifs-vs-resultats #287, registre canonique #290,…
- #320 — Charte / Outillage de travail (find-brain avant grep, réflexe 3 axes)
- #321 — Nouvel outil / Correctif majeur (noyau CASSANDRA-RH fiabilisé, bug checkAllAgen…
- #322 — Nouvel outil / Correctif (CASSANDRA-RH « trous d'équipe », second bug de badge)
- #323 — Charte / Outillage de travail (fiabilisation tool-brain, écart de reporting bad…
- #324 — Correctif (3e cas du bug primaryName) / Nouvel outil (objectifs-vs-resultats él…
- #325 — Nouvel outil (CASSANDRA-RH Phase 1 — nouveaux visages)
- #326 — Correctif (gabarit de certification fiabilisé) / Écarts doc trouvés (organisati…
- #327 — Correctif majeur (compteur d'usage réel des outils, câblage complet)
- #328 — Réponses point par point (6 demandes distinctes) / Correctif (règle report-read…
- #329 — Nouvel outil (CASSANDRA-RH — 3 signaux « OK GO »)
- #330 — Nouvel Article (Article 24, évolutivité) / Correctifs (4 dérives réelles trouvé…
- #331 — Correctif (2 fichiers préliminaires manquants créés)
- #332 — Nouvel outil (signal CIRCLE-TASKS chantier-preliminaire-signal)
- #333 — Nouvel outil (généralisation « idées à trancher » — signal CIRCLE-TASKS + règle…
- #334 — Nouvel outil / Correctif majeur (ALWAYS-NEW-CODE promu sixième Gardien sacré du…
- #335 — Nouvel outil / Conception (protocole CIRCLE-TASKS AUTO/PRIME/GOAT + périodicité)
- #336 — Exécution réelle / Suivi & référentiels (première Ronde CIRCLE-TASKS en mode AU…
- #337 — Correctif / Suivi & référentiels (rapports post-Ronde + fiabilisation CIRCLE-TA…
- #338 — Conception / Nouvel outil (changement-de-modele-IA, CIRCLE-TASKS)
- #339 — Correctif / Outillage de travail (checkChantierFileFreshness — paradoxe tempore…
- #340 — Correctif majeur / Nouvel outil (audit complet des rapports produits par CIRCLE…
- #341 — Correctif majeur (règle générale : tous les items de la Ronde CIRCLE-TASKS prod…
- #342 — Correctif (snapshot texte datée pour CLAUDE.md + retrofit THE-KING, historique…
- #343 — Charte / process (séquence stricte Étape 5 CIRCLE-TASKS + questions forcées en…
- #344 — Vérification (passage HARMONIA à raisonnement, thème relation Lia/Noé)
- #345 — Nouvel outil (construction de circle-process-guardian)
- #346 — Nouvel outil (construction du protocole changement-de-modele-IA)
- #347 — Correctif / Nouvel outil (discipline d'exécution étendue à HYPER-SCAN-CHECKPOIN…
- #348 — Vérification / Conception (utilité des outils dans CLAUDE.md vs la Ronde)
- #349 — Nouvel outil / Correctif majeur (HYPER-SCAN-CHECKPOINT modernisé + intégré à CI…
- #350 — Méthode de travail / Ronde CIRCLE-TASKS
- #351 — Outillage de travail / ARGUS
- #352 — Outillage de travail / CIRCLE-TASKS
- #353 — Outillage de travail / Tableau de bord
- #354 — Méthode de travail / Système de suivi
- #355 — Suivi / Carnet de correctifs
- #356 — Outillage de travail / Simulation Article 18
- #357 — Outillage de travail / check-tasks-details
- #358 — Outillage de travail / circle-process-guardian
- #359 — Nouvel outil / ecotoken-claude.md
- #360 — Nouvel outil / ecotoken-claude.md
- #361 — Outillage de travail / CIRCLE-TASKS
- #362 — Outillage de travail / Gardiens sacrés
- #363 — Méthode de travail / Honnêteté d'analyse
- #364 — Outillage de travail / ecotoken
- #365 — Outillage de travail / ecotoken
- #366 — Outillage de travail / ecotoken
- #367 — Outillage de travail / ecotoken
- #368 — Outillage de travail / ecotoken
- #369 — Outillage de travail / ecotoken
- #370 — Outillage de travail / ecotoken
- #371 — Outillage de travail / Harmonie des échelles
- #372 — Outillage de travail / ecotoken
- #373 — Outillage de travail / CIRCLE-TASKS
- #374 — Outillage de travail / ecotoken
- #375 — Outillage de travail / ecotoken
- #376 — Outillage de travail / Gardiens
- #377 — Outillage de travail / Gardiens
- #378 — Outillage de travail / CLAUDE.md
- #379 — Outillage de travail / ecotoken
- #380 — Outillage de travail / CLAUDE.md
- #381 — Outillage de travail / ecotoken
- #382 — Outillage de travail / Gardiens
- #383 — Outillage de travail / regles-de-travail.md
- #384 — Outillage de travail / ecotoken
- #385 — Méthode de travail / Honnêteté
- #386 — Outillage de travail / ALWAYS-NEW-CODE
- #387 — Outillage de travail / ecotoken
- #388 — Documentation / regles-de-travail.md
- #389 — Outillage / badge
- #391 — Outillage / badge
- #392 — Outillage / ecotoken
- #393 — Documentation / principes.md
- #394 — Charte / CLAUDE.md
- #395 — Outillage / CIRCLE-TASKS
- #396 — Référentiel affiché en jeu / lib/reference.ts
- #397 — Charte / CLAUDE.md
- #398 — Règles de travail
- #399 — Règles de travail + tool-brain
- #400 — Outillage / LE-COORDINATEUR
- #401 — Charte / CLAUDE.md
- #402 — Outillage / ecotoken
- #403 — Outillage / criticité
- #404 — Outillage / badges + CASSANDRA-RH
