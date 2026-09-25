# Classification générale de l'Agence Codex — le document officiel

*(GÉNÉRÉ par `node scripts/cassandra-rh.mjs classification`, dernier passage 2026-09-25 22:16 UTC. **Ne jamais le modifier à la main** : la prochaine génération écraserait la correction. Ce qu'il faut changer se change dans le code qui le produit — `scripts/cassandra-rh.mjs` et `scripts/lib-shell.mjs` — et le document suit tout seul. C'est la règle de l'Article 24 appliquée au document qui décrit la classification : un inventaire recopié à la main se périme au premier fichier ajouté.)*

## 0. Classification ou organisation ? Les deux existent, et ce ne sont pas les mêmes

**La CLASSIFICATION décrit ce qui EST.** Elle range : quel fichier est de quelle nature, quel outil porte quel rang, dans quelle famille il travaille. Elle se MESURE sur le dépôt, elle ne se décide pas. C'est ce document.

**L'ORGANISATION décide ce qui DOIT ÊTRE.** Qui dirige, qui répond de quoi, quel poste exige quels documents, quel process encadre quoi. Elle se TRANCHE, et c'est toi qui tranches. Elle vit dans `docs/referentiel/organisation-agence.md`.

**Le lien entre les deux, en une phrase** : la classification fournit le vocabulaire que l'organisation emploie. On ne peut pas décider « ce que doit avoir un Gardien sacré » avant d'avoir défini ce qu'est un Gardien sacré. C'est pour ça que les deux documents existent, et que ni l'un ni l'autre n'absorbe son voisin.

## 1. Les quatre axes, et la question à laquelle chacun répond

| Axe | La question | Comment il se remplit | Couvre |
|---|---|---|---|
| **TYPE** | ce que le fichier EST | se CONSTATE en lisant le fichier | tous les fichiers (87) |
| **RANG** | ce que le fichier VAUT dans l'équipe | se MÉRITE (inscrit au registre) ou se DÉDUIT du type | 75 % des fichiers |
| **FAMILLE** | ce sur quoi il travaille | se décide, une par outil de l'équipe | les 40 outils de l'équipe |
| **CLASSES TRANSVERSES** | ce qu'il sait FAIRE | se détecte par sonde sur le code | tous, plusieurs classes par fichier |

**Pourquoi type et rang ne font pas doublon, et pourquoi il en faut bien deux** : un type se constate, un rang se mérite. Une bibliothèque partagée n'a pas de rang d'équipe et n'en manque pas — elle n'a jamais candidaté. Les fusionner obligerait soit à promouvoir des fichiers qui n'ont rien demandé, soit à priver de rang des outils qui l'ont gagné.

## 2. Comment les deux se croisent — la règle, en une phrase

**Le rang MÉRITÉ l'emporte toujours ; le type ne remplit que les cases que personne n'a remplies.**

1. L'outil est inscrit au registre de l'équipe → il porte le rang qui y est écrit, quel que soit son type.
2. Sinon, son TYPE décide : ceux qui servent sans avoir candidaté reçoivent « Socle », ceux qui sont lançables mais documentés nulle part reçoivent le rang provisoire.
3. Sinon, **aucun rang, et on le dit** — jamais un rang par défaut, qui ressemblerait à un rang gagné.

*(Cet ordre a été trouvé en faisant tourner la règle, pas en la relisant : le premier jet lisait le type d'abord, et rétrogradait deux Gardiens sacrés en Socle parce qu'ils n'ont pas de porte d'entrée propre.)*

| Type de fichier | Rang qu'il permet |
|---|---|
| `crochet` | **Socle**, automatiquement |
| `filet-de-securite` | **Socle**, automatiquement |
| `bibliotheque-partagee` | **Socle**, automatiquement |
| `bibliotheque-solitaire` | **Socle**, automatiquement |
| `infrastructure-shell` | **Socle**, automatiquement |
| `utilitaire-sans-fiche` | **Postulant**, automatiquement |
| `execution-directe-non-documentee` | **Postulant**, automatiquement |
| `outil` | **aucun automatiquement** — le rang se lit dans le registre de l'équipe |

## 3. Les rangs — dictionnaire complet (6)

| Rang | Qui le remplit | Ce que ça veut dire | Le poste de travail qui en découle |
|---|---|---|---|
| 🧱 **Socle** | le type du fichier | n'est pas membre de l'équipe : c'est le sol sur lequel tout le monde marche | AUCUN poste, et ce n'est pas un manque : une bibliothèque, un crochet ou le filet de sécurité servent tout le monde sans avoir jamais candidaté. Leur exigence est ailleurs — être importés proprement et testés. |
| 🎖️ **Agents Cadre** | le registre de l'équipe | dirigent — une fonction dans l'organigramme, jamais un badge de qualité en plus | tout ce qu'a un Membre, PLUS le droit de convoquer les autres et de rendre un verdict sur eux. Deux outils seulement. |
| 🛡️ **Gardiens sacrés du code** | le registre de l'équipe | délivrent un vrai scan de qualité ET tournent automatiquement à CHAQUE commit | fiche + blueprint + dossier d'historisation + ligne à la table maîtresse + câblage au crochet post-commit. JAMAIS d'item de Ronde : il tourne à chaque commit, un item ferait doublon. |
| 🎖️ **Membres certifiés** | le registre de l'équipe | câblage complet vérifié : table maîtresse, menu, instanciation, registre, blueprint | fiche + blueprint + dossier d'historisation + ligne à la table maîtresse + entrée au menu des prestations. Le poste complet, sans le crochet. |
| 🚪 **Postulants** *(nom provisoire)* | le type du fichier | lançable, mais nommé par aucun document : soit un outil qu'on a oublié de documenter, soit un script jetable qui a survécu — un état qui appelle une décision, jamais un rang où l'on reste | poste NON ARRÊTÉ, et c'est justement ce que le rang signale : lançable, mais nommé par aucun document. La question n'est pas « quel poste lui donner » mais « le documente-t-on, ou le supprime-t-on ». |
| 📝 **Émetteurs de rapport non certifiés** *(nom provisoire)* | un registre tiers | produisent un vrai rapport lu par un humain sans être membres — rang en attente de nommage | *(non arrêté)* |

**Les pièces d'un poste de travail complet**, pour lire la colonne de droite :

- **une fiche d'instanciation** (`docs/referentiel/<outil>.md`) — pour : tout rang sauf ceux qui n'ont aucune connaissance propre au projet
- **un blueprint générique** (`docs/<outil>-blueprint.md`) — pour : tout rang sauf cousin déclaré d'un autre Agent
- **un dossier d'historisation** (`docs/<outil>/ avec son index.md`) — pour : tout outil qui produit un rapport ou garde une mémoire
- **une ligne à la table maîtresse** (`docs/regles-de-travail.md §7ter`) — pour : tous, sans exception
- **une entrée au menu PRESTATIONS** (`scripts/le-coordinateur.mjs`) — pour : ceux qu'on lance à la demande ou qui coûtent de l'API
- **un item de Ronde** (`scripts/circle-tasks.mjs`) — pour : les périodiques — jamais les Gardiens sacrés, qui tournent à chaque commit

### Qui porte quel rang, exhaustivement (87 fichiers)

**Membre** — 30 :

`abraham-les-references.mjs` · `agent-des-noms.mjs` · `agent-du-temps.mjs` · `angel-of-ia-process.mjs` · `check-gemini-quota.mjs` · `check-level-target.mjs` · `check-tasks-details.mjs` · `circle-tasks.mjs` · `data-archangel.mjs` · `ecotoken.mjs` · `el-professor.mjs` · `find-booster.mjs` · `god-of-all-process.mjs` · `hyper-scan-checkpoint.mjs` · `ines-official.mjs` · `integration-outil.mjs` · `memento.mjs` · `moise-tables-de-loi.mjs` · `objectifs-vs-resultats.mjs` · `process-simulation-guardian.mjs` · `pure-gold-unity.mjs` · `smart-conso-api.mjs` · `smart-conso-token.mjs` · `the-deep-reader.mjs` · `the-equalizer.mjs` · `the-final-judge.mjs` · `the-king.mjs` · `the-screener-capture.mjs` · `tool-brain.mjs` · `tool-learning.mjs`

**Socle** — 24 :

`api-providers.mjs` · `build-verified.sh` · `check-house.mjs` · `corpus-mesure.mjs` · `execution-profile.mjs` · `gemini-key-health.mjs` · `hooks/check-last-commit.mjs` · `hooks/install.mjs` · `hooks/post-commit` · `hooks/pre-commit` · `html-report.mjs` · `install-ci.sh` · `install-pnpm.sh` · `judge-persona-shared.mjs` · `lib-json.mjs` · `lib-markdown-table.mjs` · `lib-shell.mjs` · `memento-weight.mjs` · `priorites.mjs` · `report-template.mjs` · `serie-temporelle.mjs` · `simulation-visiteur.mjs` · `sites-env.sh` · `tasks-process-guardian.mjs`

**(aucun)** — 22 :

`check-profil-utilisateur.mjs` · `check-profile.mjs` · `check-spirit.mjs` · `check-suivi-fidelity.mjs` · `circle-process-guardian.mjs` · `criticite.mjs` · `doc-report.mjs` · `find-brain.mjs` · `kpi-report.mjs` · `le-regisseur.mjs` · `messages-courts.mjs` · `modes-de-travail.mjs` · `ou-on-en-est.mjs` · `rapport-gros-prompt.mjs` · `route-booster.mjs` · `run-framework.mjs` · `run-simulation.mjs` · `sauvegarde-projet.mjs` · `sites-env.mjs` · `summarize-simulation-log.mjs` · `the-ghost.mjs` · `tool-usage.mjs`

**Gardien sacré du code** — 7 :

`always-new-code.mjs` · `axa-check.mjs` · `check-argus.mjs` · `check-harmonia.mjs` · `clean-dirty-old.mjs` · `clone-hunter.mjs` · `safe-export.mjs`

**Agent Cadre** — 2 :

`cassandra-rh.mjs` · `le-coordinateur.mjs`

**Postulant** — 2 :

`install-ci.mjs` · `pnpm-install.mjs`

## 4. Les types de fichier — liste exhaustive (7 types, 87 fichiers)

### `outil` — 54 fichier(s)

> un membre de l'Agence : une porte d'entrée réelle (ligne de commande, package.json, crochet ou commande écrite) ET au moins un document qui le nomme

`abraham-les-references.mjs` · `agent-des-noms.mjs` · `agent-du-temps.mjs` · `always-new-code.mjs` · `angel-of-ia-process.mjs` · `axa-check.mjs` · `cassandra-rh.mjs` · `check-argus.mjs` · `check-gemini-quota.mjs` · `check-harmonia.mjs` · `check-level-target.mjs` · `check-profil-utilisateur.mjs` · `check-profile.mjs` · `check-spirit.mjs` · `check-suivi-fidelity.mjs` · `check-tasks-details.mjs` · `circle-process-guardian.mjs` · `circle-tasks.mjs` · `clean-dirty-old.mjs` · `criticite.mjs` · `data-archangel.mjs` · `doc-report.mjs` · `ecotoken.mjs` · `el-professor.mjs` · `find-booster.mjs` · `find-brain.mjs` · `god-of-all-process.mjs` · `hyper-scan-checkpoint.mjs` · `ines-official.mjs` · `kpi-report.mjs` · `le-coordinateur.mjs` · `le-regisseur.mjs` · `messages-courts.mjs` · `modes-de-travail.mjs` · `moise-tables-de-loi.mjs` · `objectifs-vs-resultats.mjs` · `ou-on-en-est.mjs` · `process-simulation-guardian.mjs` · `rapport-gros-prompt.mjs` · `route-booster.mjs` · `run-framework.mjs` · `run-simulation.mjs` · `sauvegarde-projet.mjs` · `sites-env.mjs` · `smart-conso-api.mjs` · `smart-conso-token.mjs` · `summarize-simulation-log.mjs` · `the-equalizer.mjs` · `the-ghost.mjs` · `the-king.mjs` · `the-screener-capture.mjs` · `tool-brain.mjs` · `tool-learning.mjs` · `tool-usage.mjs`

### `bibliotheque-partagee` — 17 fichier(s)

> aucune porte d'entrée, importée par plusieurs — le vocabulaire commun de l'Agence

`clone-hunter.mjs` · `corpus-mesure.mjs` · `execution-profile.mjs` · `gemini-key-health.mjs` · `html-report.mjs` · `integration-outil.mjs` · `judge-persona-shared.mjs` · `lib-json.mjs` · `lib-markdown-table.mjs` · `lib-shell.mjs` · `memento-weight.mjs` · `memento.mjs` · `priorites.mjs` · `pure-gold-unity.mjs` · `report-template.mjs` · `safe-export.mjs` · `serie-temporelle.mjs`

### `bibliotheque-solitaire` — 5 fichier(s)

> aucune porte d'entrée et importée par un seul : à fusionner dans son unique client, ou bien il lui manque des clients

`api-providers.mjs` · `simulation-visiteur.mjs` · `tasks-process-guardian.mjs` · `the-deep-reader.mjs` · `the-final-judge.mjs`

### `infrastructure-shell` — 4 fichier(s)

> script shell d'installation ou de construction, hors de l'Agence

`build-verified.sh` · `install-ci.sh` · `install-pnpm.sh` · `sites-env.sh`

### `crochet` — 4 fichier(s)

> s'exécute automatiquement à un moment de git, jamais appelé à la main

`hooks/check-last-commit.mjs` · `hooks/install.mjs` · `hooks/post-commit` · `hooks/pre-commit`

### `execution-directe-non-documentee` — 2 fichier(s)

> personne ne l'importe et aucune commande de lancement n'est écrite nulle part : il ne peut être lancé qu'à la main, par quelqu'un qui sait déjà

`install-ci.mjs` · `pnpm-install.mjs`

### `filet-de-securite` — 1 fichier(s)

> la suite de tests elle-même — ce que le crochet lance et qui peut refuser un commit

`check-house.mjs`

## 5. Les familles — liste exhaustive (7 familles, 40 outils)

Une famille dit **ce sur quoi on travaille**, jamais ce qu'on vaut. C'est pourquoi un Gardien sacré et un simple Membre peuvent partager la même famille : ils regardent le même terrain avec des pouvoirs différents.

**Suite Dette & Structure du code** — 12 :

`abraham-les-references` · `agent-des-noms` · `argus` · `axa-check` · `clean-dirty-old` · `clone-hunter` · `harmonia` · `integration-outil` · `moise-tables-de-loi` · `safe-export` · `the-equalizer` · `tool-learning`

**Gouvernance interne** — 9 :

`agent-du-temps` · `cassandra-rh` · `check-level-target` · `ecotoken` · `objectifs-vs-resultats` · `smart-breaker` · `smart-conso-api` · `smart-conso-token` · `the-king`

**Coordination** — 8 :

`angel-of-ia-process` · `check-tasks-details` · `circle-tasks` · `data-archangel` · `god-of-all-process` · `le-coordinateur` · `pure-gold-unity` · `tool-brain`

**Simulation & qualité narrative** — 4 :

`el-professor` · `memory-audit` · `process-simulation-guardian` · `the-screener`

**Exceptionnel (page blanche / audit lourd)** — 3 :

`always-new-code` · `hyper-scan-checkpoint` · `ines-official`

**Audit indépendant** — 2 :

`the-deep-reader` · `the-final-judge`

**Outillage de navigation** — 2 :

`find-booster` · `find-deep-booster`

## 6. Les classes transverses — liste exhaustive (9 classes)

Une classe transverse dit **ce qu'un fichier sait faire**, jamais qui il est. Elle se cumule librement avec toutes les autres, et elle traverse les rangs : un Gardien sacré et une bibliothèque peuvent porter la même.

### scanne le dépôt — 37 fichier(s)

> parcourt des fichiers pour y chercher quelque chose — la classe que l'utilisateur a nommée lui-même

`abraham-les-references.mjs` · `agent-des-noms.mjs` · `angel-of-ia-process.mjs` · `axa-check.mjs` · `cassandra-rh.mjs` · `check-argus.mjs` · `check-harmonia.mjs` · `check-house.mjs` · `check-profil-utilisateur.mjs` · `check-spirit.mjs` · `check-suivi-fidelity.mjs` · `check-tasks-details.mjs` · `circle-process-guardian.mjs` · `circle-tasks.mjs` · `clone-hunter.mjs` · `data-archangel.mjs` · `doc-report.mjs` · `ecotoken.mjs` · `el-professor.mjs` · `god-of-all-process.mjs` · `hooks/check-last-commit.mjs` · `hyper-scan-checkpoint.mjs` · `ines-official.mjs` · `integration-outil.mjs` · `kpi-report.mjs` · `le-coordinateur.mjs` · `le-regisseur.mjs` · `lib-shell.mjs` · `moise-tables-de-loi.mjs` · `ou-on-en-est.mjs` · `process-simulation-guardian.mjs` · `pure-gold-unity.mjs` · `safe-export.mjs` · `sauvegarde-projet.mjs` · `the-equalizer.mjs` · `tool-brain.mjs` · `tool-learning.mjs`

### rend un rapport HTML — 18 fichier(s)

> produit une page, donc quelque chose que l'utilisateur LIT vraiment

`abraham-les-references.mjs` · `cassandra-rh.mjs` · `check-house.mjs` · `check-tasks-details.mjs` · `circle-tasks.mjs` · `doc-report.mjs` · `el-professor.mjs` · `god-of-all-process.mjs` · `html-report.mjs` · `kpi-report.mjs` · `le-coordinateur.mjs` · `le-regisseur.mjs` · `ou-on-en-est.mjs` · `pure-gold-unity.mjs` · `report-template.mjs` · `the-deep-reader.mjs` · `the-final-judge.mjs` · `the-screener-capture.mjs`

### tient un registre — 40 fichier(s)

> écrit une mémoire durable sur le disque — ce qui lui permet de se souvenir d'un passage à l'autre

`abraham-les-references.mjs` · `agent-des-noms.mjs` · `agent-du-temps.mjs` · `angel-of-ia-process.mjs` · `axa-check.mjs` · `cassandra-rh.mjs` · `check-argus.mjs` · `check-house.mjs` · `check-spirit.mjs` · `check-tasks-details.mjs` · `circle-tasks.mjs` · `data-archangel.mjs` · `doc-report.mjs` · `ecotoken.mjs` · `el-professor.mjs` · `gemini-key-health.mjs` · `god-of-all-process.mjs` · `hyper-scan-checkpoint.mjs` · `ines-official.mjs` · `kpi-report.mjs` · `le-coordinateur.mjs` · `le-regisseur.mjs` · `memento-weight.mjs` · `memento.mjs` · `modes-de-travail.mjs` · `moise-tables-de-loi.mjs` · `ou-on-en-est.mjs` · `pnpm-install.mjs` · `pure-gold-unity.mjs` · `rapport-gros-prompt.mjs` · `report-template.mjs` · `run-simulation.mjs` · `sauvegarde-projet.mjs` · `serie-temporelle.mjs` · `smart-conso-api.mjs` · `smart-conso-token.mjs` · `the-ghost.mjs` · `the-screener-capture.mjs` · `tool-learning.mjs` · `tool-usage.mjs`

### coûte de vrais appels API — 4 fichier(s)

> consulte un modèle ou un service distant : jamais lancé sans passer par Smart Conso API (Article 22)

`api-providers.mjs` · `cassandra-rh.mjs` · `check-house.mjs` · `check-profile.mjs`

### porte un garde-fou d'évolutivité — 16 fichier(s)

> contient une fonction qui refuse une liste recopiée à la main : elle compare une copie à sa source et crie quand les deux divergent (Article 24). C'est ce qui permet à un registre de grossir sans qu'une copie oubliée se périme en silence.

`abraham-les-references.mjs` · `always-new-code.mjs` · `cassandra-rh.mjs` · `check-house.mjs` · `check-level-target.mjs` · `check-suivi-fidelity.mjs` · `check-tasks-details.mjs` · `circle-process-guardian.mjs` · `circle-tasks.mjs` · `criticite.mjs` · `doc-report.mjs` · `el-professor.mjs` · `god-of-all-process.mjs` · `le-coordinateur.mjs` · `moise-tables-de-loi.mjs` · `process-simulation-guardian.mjs`

### déclare sa marge d'erreur — 46 fichier(s)

> avertit qu'il peut se tromper avant de rendre un chiffre — l'exigence transverse de tous les outils heuristiques

`abraham-les-references.mjs` · `agent-des-noms.mjs` · `agent-du-temps.mjs` · `always-new-code.mjs` · `axa-check.mjs` · `cassandra-rh.mjs` · `check-argus.mjs` · `check-gemini-quota.mjs` · `check-harmonia.mjs` · `check-house.mjs` · `check-level-target.mjs` · `check-profil-utilisateur.mjs` · `check-spirit.mjs` · `check-suivi-fidelity.mjs` · `check-tasks-details.mjs` · `circle-process-guardian.mjs` · `circle-tasks.mjs` · `clean-dirty-old.mjs` · `clone-hunter.mjs` · `doc-report.mjs` · `ecotoken.mjs` · `el-professor.mjs` · `find-booster.mjs` · `find-brain.mjs` · `god-of-all-process.mjs` · `hyper-scan-checkpoint.mjs` · `integration-outil.mjs` · `kpi-report.mjs` · `le-regisseur.mjs` · `lib-shell.mjs` · `moise-tables-de-loi.mjs` · `ou-on-en-est.mjs` · `process-simulation-guardian.mjs` · `pure-gold-unity.mjs` · `report-template.mjs` · `route-booster.mjs` · `safe-export.mjs` · `smart-conso-api.mjs` · `smart-conso-token.mjs` · `summarize-simulation-log.mjs` · `tasks-process-guardian.mjs` · `the-equalizer.mjs` · `the-king.mjs` · `the-screener-capture.mjs` · `tool-brain.mjs` · `tool-learning.mjs`

### conclut par un plan d'action — 38 fichier(s)

> transforme ses constats en gestes (Article 28) au lieu de s'arrêter au rapport

`abraham-les-references.mjs` · `agent-des-noms.mjs` · `agent-du-temps.mjs` · `always-new-code.mjs` · `angel-of-ia-process.mjs` · `axa-check.mjs` · `cassandra-rh.mjs` · `check-argus.mjs` · `check-harmonia.mjs` · `check-house.mjs` · `check-level-target.mjs` · `check-profil-utilisateur.mjs` · `check-spirit.mjs` · `check-suivi-fidelity.mjs` · `check-tasks-details.mjs` · `circle-process-guardian.mjs` · `clean-dirty-old.mjs` · `clone-hunter.mjs` · `data-archangel.mjs` · `doc-report.mjs` · `ecotoken.mjs` · `el-professor.mjs` · `hyper-scan-checkpoint.mjs` · `kpi-report.mjs` · `le-regisseur.mjs` · `memento.mjs` · `moise-tables-de-loi.mjs` · `objectifs-vs-resultats.mjs` · `process-simulation-guardian.mjs` · `rapport-gros-prompt.mjs` · `report-template.mjs` · `safe-export.mjs` · `smart-conso-api.mjs` · `smart-conso-token.mjs` · `the-equalizer.mjs` · `the-king.mjs` · `tool-brain.mjs` · `tool-learning.mjs`

### enregistre son propre usage — 47 fichier(s)

> sait dire s'il a servi — sans quoi personne ne peut constater qu'un outil n'est jamais sollicité

`abraham-les-references.mjs` · `agent-des-noms.mjs` · `agent-du-temps.mjs` · `always-new-code.mjs` · `angel-of-ia-process.mjs` · `axa-check.mjs` · `cassandra-rh.mjs` · `check-argus.mjs` · `check-gemini-quota.mjs` · `check-harmonia.mjs` · `check-house.mjs` · `check-level-target.mjs` · `check-tasks-details.mjs` · `circle-process-guardian.mjs` · `circle-tasks.mjs` · `clean-dirty-old.mjs` · `clone-hunter.mjs` · `data-archangel.mjs` · `doc-report.mjs` · `ecotoken.mjs` · `el-professor.mjs` · `find-booster.mjs` · `find-brain.mjs` · `god-of-all-process.mjs` · `hyper-scan-checkpoint.mjs` · `ines-official.mjs` · `integration-outil.mjs` · `kpi-report.mjs` · `le-coordinateur.mjs` · `le-regisseur.mjs` · `memento.mjs` · `moise-tables-de-loi.mjs` · `objectifs-vs-resultats.mjs` · `process-simulation-guardian.mjs` · `pure-gold-unity.mjs` · `rapport-gros-prompt.mjs` · `route-booster.mjs` · `safe-export.mjs` · `smart-conso-api.mjs` · `smart-conso-token.mjs` · `tasks-process-guardian.mjs` · `the-equalizer.mjs` · `the-king.mjs` · `the-screener-capture.mjs` · `tool-brain.mjs` · `tool-learning.mjs` · `tool-usage.mjs`

### sait répondre « pas mesuré » — 41 fichier(s)

> distingue « je n'ai rien trouvé » de « je n'ai pas pu regarder » (leçon L5) — la classe la plus discrète et la plus importante

`abraham-les-references.mjs` · `agent-des-noms.mjs` · `agent-du-temps.mjs` · `always-new-code.mjs` · `angel-of-ia-process.mjs` · `axa-check.mjs` · `cassandra-rh.mjs` · `check-argus.mjs` · `check-harmonia.mjs` · `check-house.mjs` · `check-spirit.mjs` · `check-tasks-details.mjs` · `circle-process-guardian.mjs` · `circle-tasks.mjs` · `corpus-mesure.mjs` · `criticite.mjs` · `data-archangel.mjs` · `ecotoken.mjs` · `el-professor.mjs` · `god-of-all-process.mjs` · `integration-outil.mjs` · `kpi-report.mjs` · `le-coordinateur.mjs` · `le-regisseur.mjs` · `memento.mjs` · `messages-courts.mjs` · `moise-tables-de-loi.mjs` · `objectifs-vs-resultats.mjs` · `ou-on-en-est.mjs` · `priorites.mjs` · `process-simulation-guardian.mjs` · `pure-gold-unity.mjs` · `report-template.mjs` · `safe-export.mjs` · `serie-temporelle.mjs` · `smart-conso-token.mjs` · `the-equalizer.mjs` · `the-king.mjs` · `tool-brain.mjs` · `tool-learning.mjs` · `tool-usage.mjs`

## 7. Ce qui n'est pas classé, et pourquoi c'est écrit ici plutôt que tu

**22 fichiers n'ont aucun rang.** Ce sont des fichiers de type « outil » — documentés et lançables — qui ne figurent pas au registre de l'équipe. Ce n'est ni une erreur de classement ni un défaut du fichier : c'est une question ouverte, une par fichier (entre-t-il dans l'équipe, ou reste-t-il un utilitaire ?).

`check-profil-utilisateur.mjs` · `check-profile.mjs` · `check-spirit.mjs` · `check-suivi-fidelity.mjs` · `circle-process-guardian.mjs` · `criticite.mjs` · `doc-report.mjs` · `find-brain.mjs` · `kpi-report.mjs` · `le-regisseur.mjs` · `messages-courts.mjs` · `modes-de-travail.mjs` · `ou-on-en-est.mjs` · `rapport-gros-prompt.mjs` · `route-booster.mjs` · `run-framework.mjs` · `run-simulation.mjs` · `sauvegarde-projet.mjs` · `sites-env.mjs` · `summarize-simulation-log.mjs` · `the-ghost.mjs` · `tool-usage.mjs`

**⚠️ Le référentiel et le code ne déclarent pas le même nombre d'axes** — le référentiel déclare 2 axe(s), le code en publie 7 (iceberg, type, moment, domaine, destinataire, rang, famille) — la prose se rédige à la main, mais elle ne peut plus s'écarter en silence. La prose de `docs/referentiel/organisation-agence.md` §1 reste écrite à la main ; ce signal existe pour qu'elle ne s'écarte plus en silence.

