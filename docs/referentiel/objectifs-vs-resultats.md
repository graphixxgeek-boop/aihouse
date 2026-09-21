# objectifs-vs-resultats — instanciation pour ce projet

Cf. `docs/objectifs-vs-resultats-blueprint.md` pour le principe générique. Ce document ne décrit que
ce qui est propre à ce projet.

## Statut

Membre standalone de l'équipe (`scripts/objectifs-vs-resultats.mjs`), tâche #287, 2026-09-21 —
même statut que CLONE-HUNTER/AXA-CHECK, jamais un sous-agent de CASSANDRA-RH (organigramme plat) ni
une extension du tableau de bord/KPI existant.

## Mécanisme

- **Registre** : `docs/objectifs-vs-resultats/registre.md`, table markdown hand-maintained,
  colonnes `Entité | Début | Fin | Objectif | Unité | Source | Note`, colonnes lues par NOM (jamais
  par position fixe, même discipline que `parseToolsTable()` de `le-coordinateur.mjs`).
- **Sources supportées aujourd'hui** (deux seulement, jamais devinée pour une troisième) :
  - `usage-count` : nombre réel de sollicitations de l'entité (un slug d'outil) sur la période,
    lu directement dans `.tool-usage-history.json` (le même historique que `tool-usage.mjs`/
    `tool-brain.mjs` lisent déjà — jamais un second fichier).
  - `found-rate` : % de sollicitations ayant réellement trouvé quelque chose (`foundSomething:
    true`) sur la période, même historique.
  - Étendre à un troisième signal (couverture AXA-CHECK, une figure du tableau de bord KPI) est un
    chantier futur explicitement identifié, jamais fait par supposition dans la v1.
- **Calcul de la période** : la borne de fin effective est toujours `min(Fin déclarée, maintenant)`
  — un objectif dont la période n'est pas encore terminée est jugé sur ce qui s'est réellement
  passé jusqu'à aujourd'hui, jamais sur une fenêtre future fictive.
- **Statuts** : `atteint` / `en dessous` / `dépassé` (égalité stricte = `atteint`) plus
  `pas de données` pour un `found-rate` sans aucun événement sur la période — jamais un 0% fabriqué.
  `periodStatus()` distingue en plus `à venir` / `en cours` / `clos` (période elle-même, pas le
  résultat) pour qu'un lecteur ne confonde jamais « en dessous parce que ça vient de commencer »
  avec « en dessous alors que la période est déjà terminée ».
- **CLI** : `node scripts/objectifs-vs-resultats.mjs rapport` — lit le registre + l'historique réel,
  affiche chaque objectif avec son résultat et son statut.

## Premier objectif enregistré (2026-09-21)

`tool-brain` : 5 sollicitations sur la semaine du 2026-09-21 au 2026-09-28 — fixé le soir même de sa
construction, pour vérifier honnêtement si la consultation proactive de l'outil prend réellement
racine (au-delà du seul rappel automatique post-commit). Premier passage réel : 0/5 (l'historique
`.tool-usage-history.json` n'enregistre pas encore d'événement `tool-brain` lui-même — cf.
`docs/objectifs-vs-resultats/index.md` pour le suivi).

## Registre

`docs/objectifs-vs-resultats/index.md` (historique des changements du registre) et
`docs/objectifs-vs-resultats/registre.md` (la table elle-même, source de vérité vivante).
