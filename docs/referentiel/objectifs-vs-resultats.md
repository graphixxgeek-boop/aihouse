# objectifs-vs-resultats — instanciation pour ce projet

*(Surnom, 2026-09-21 : « R/O-Guardian » — nom technique gardé comme nom principal partout où un
slug en dépend, cf. la note dans CLAUDE.md à la section correspondante.)*

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
- **Sources supportées** (trois, jamais devinée pour une quatrième) :
  - `usage-count` : nombre réel de sollicitations de l'entité (un slug d'outil) sur la période,
    lu directement dans `.tool-usage-history.json` (le même historique que `tool-usage.mjs`/
    `tool-brain.mjs` lisent déjà — jamais un second fichier).
  - `found-rate` : % de sollicitations ayant réellement trouvé quelque chose (`foundSomething:
    true`) sur la période, même historique.
  - `kpi:<colonne>` (2026-09-21, extension demandée explicitement pour couvrir des objectifs de
    simulation) : lit `kpi-historique.csv` (`kpi-report.mjs`) via `parseKpiHistoryCsv()` — la même
    fonction que CASSANDRA-RH utilise pour sa tendance KPI, désormais logée dans `kpi-report.mjs`
    plutôt que dupliquée. `<colonne>` doit être un nom réel de `KPI_HISTORY_COLUMNS` (ex.
    `kpi:robustesse_code_pct`, `kpi:anti_echo_interventions`). Retient le run le plus récent à
    l'intérieur de la période (jamais une moyenne, qui masquerait un retour en arrière ponctuel) ;
    `Entité` sert ici de simple libellé humain, jamais un filtre (un KPI n'est pas mesuré "par
    outil"). Une colonne jamais mesurée sur la période reste `pas de données`, jamais une valeur
    inventée.
  - Étendre à un 4e signal (couverture AXA-CHECK par exemple) reste un chantier futur explicitement
    identifié, jamais fait par supposition.
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

## Le repli silencieux qui flattait (2026-09-28, tâche #1095)

**Ce que le rapport affichait** :

> objectif **1** *trouvaille réellement suivie d'un geste sur la charte*,
> résultat réel **491** *trouvaille réellement suivie d'un geste sur la charte* — dépassé

Sur un document que la journée entière n'avait pas modifié une seule fois. **Le chiffre comptait les
passages du crochet post-commit.**

**La cause** : cinq lignes du registre déclarent une source en **prose** — `` `docs/moise-tables-de-loi/index.md`
(colonne « Suite donnée ») ``, `` `docs/agent-du-temps/estimations.md` `` — qu'aucun code ne sait
ouvrir. `computeResultat()` les faisait tomber sur son repli `usage-count`, et le rendu réimprimait
l'**unité déclarée** par-dessus un nombre qui mesurait autre chose.

**La note du registre disait elle-même le contraire** : « c'est le seul compteur qui ne peut pas se
remplir tout seul ». Il se remplissait entièrement tout seul, 491 fois.

**Pourquoi cette erreur-là tient plus longtemps que les autres** : un verdict « dépassé » ne se
re-vérifie jamais. Un « en dessous » fait ouvrir le dossier ; un dépassement de deux ordres de
grandeur passe pour une bonne nouvelle. C'est la même famille que le reste de cette journée — un
signal **adjacent** servi à la place du signal visé — mais ici **le repli flatte**, donc rien ne
pousse à regarder.

**La correction** : une source **déclarée et non reconnue** rend désormais « pas de données », et le
plan d'action nomme la mesure qui manque. Les sources réellement lisibles sont listées dans
`SOURCES_RECONNUES` — une liste manuelle par nature, puisqu'elle décrit ce que le code implémente et
ne peut donc se dériver d'ailleurs ; elle se met à jour le jour où une branche s'ajoute.

**Le cas normal est intact** : une ligne qui ne déclare **aucune** source demande bien le comptage
ordinaire. Corriger le cas tordu ne devait pas casser le cas droit.

**Effet mesuré** : cinq faux « dépassés » (moise-tables-de-loi, abraham-les-references,
filet-en-parts, agent-du-temps, agent-des-noms) sont devenus cinq chantiers honnêtes — « objectif
fixé, mais aucun signal mesuré sur la période ».

## Un horodatage perdu n'est pas une absence de passage (2026-09-28, tâche #1096)

**Le compteur d'usage fait déjà la bonne chose**, et c'est ce qui rend l'oubli instructif : un
événement dont l'heure n'a pas pu être lue est enregistré avec `horodatagePerdu: true` plutôt que
jeté ou daté au hasard — l'Article 32 appliqué au compteur lui-même. `findOutilsCitesSansPassage()`
(`tool-usage.mjs`) honore ce troisième état et le rend dans son propre champ.

**Ce module-ci ne l'honorait pas.** Son filtrage par période compare `e.at` à des bornes ; un `at`
nul tombe hors de **toute** borne, donc ces passages disparaissaient **sans un mot**.

**Deux cas réels, et le second change un verdict** :

| Outil | Affiché avant | Réalité |
|---|---|---|
| `rapport-gros-prompt` | « objectif 2, résultat **0** » | 12 passages réels, heure perdue |
| `tool-learning` | « objectif 4, résultat **3** — en dessous » | **55** passages réels, heure perdue |

« Zéro fois » et « douze fois, à une date inconnue » ne se lisent pas du tout pareil — et le verdict
« en dessous » de `tool-learning` change entièrement de sens.

**C'est la même classe que la tâche #1078**, quelques heures plus tôt : un correctif appliqué à
certains appelants et pas à tous, pendant que la doctrine est écrite noir sur blanc ailleurs.

**Ce qui est fait, et ce qui ne l'est pas** : on ne devine pas la date manquante — on **dit** combien
de passages elle empêche de compter. Le total reste celui de la période ; la perte s'affiche à côté.

**Et le contre-test verrouille l'autre sens** : sans passage perdu, la phrase n'apparaît pas.
Remplacer un silence par du bruit sur chaque ligne aurait été le remède pire que le mal.
