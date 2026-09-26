# Classification générale de l'Agence Codex — le document officiel

GÉNÉRÉ par `node scripts/cassandra-rh.mjs classification`, dernier passage 2026-09-26 02:28 UTC. **Ne jamais le modifier à la main** : la prochaine génération écraserait la correction. Ce qui doit changer se change dans le code qui le produit, et le document suit tout seul — l'Article 24 appliqué au document qui décrit la classification.

## 0. Classification ou organisation ? Les deux existent

**La CLASSIFICATION décrit ce qui EST.** Elle range : quel fichier est de quelle nature, quel rang il porte, dans quelle famille il travaille. Elle se MESURE sur le dépôt.

**L'ORGANISATION décide ce qui DOIT ÊTRE.** Qui dirige, quel poste exige quels documents, quel process encadre quoi. Elle se TRANCHE.

**Est-ce que l'organisation décide de la classification ?** Sur un point précis, oui — et c'est le seul. L'organisation décide des CRITÈRES (ce qu'il faut pour être Gardien sacré) ; la classification applique ces critères aux fichiers réels et dit qui les remplit. Elle ne choisit jamais qui entre dans quelle case : elle mesure. C'est pour ça que les deux documents existent, et que ni l'un ni l'autre n'absorbe son voisin — l'un pose la règle, l'autre compte.

## 1. Les 8 axes, et la question à laquelle chacun répond

| Axe | La question | Comment il se remplit | Couvre |
|---|---|---|---|
| **TYPE** | ce que le fichier EST | se CONSTATE en lisant le fichier | tous (88) |
| **RANG** | ce que le fichier VAUT | se MÉRITE, ou se DÉDUIT du type | 100 % des fichiers |
| **FAMILLE** | ce sur quoi il travaille | se décide, une par membre de l'équipe | les 57 de l'équipe |
| **CLASSES TRANSVERSES** | ce qu'il sait FAIRE | sonde sur le code, plusieurs par fichier | tous |
| *iceberg* | à quel groupe il appartient (membre, oublié, infrastructure, plomberie) | porté par `classerIceberg()` | — |
| *moment* | QUAND il intervient | porté par `momentsDeLOutil()` | — |
| *domaine* | SUR QUOI il regarde | porté par `domainesDeLOutil()` | — |
| *destinataire* | À QUI le résultat sert | porté par `destinatairesDeLOutil()` | — |
| *cherche* | QUELLE QUESTION il pose au dépôt (déclaré-mais-absent, deux-sources-divergent, duplication…) | porté par `cartographieCriteresTransverses() — HARMONIA` | — |

**Pourquoi type et rang ne font pas doublon** : un type se constate, un rang se mérite. Une bibliothèque partagée n'a pas de rang d'équipe et n'en manque pas — elle n'a jamais candidaté.

## 2. Comment type et rang se croisent — la règle, en une phrase

- L'outil est inscrit au registre de l'équipe → il porte le rang qui y est écrit, quel que soit son type.
- Sinon, son TYPE décide : ceux qui servent sans avoir candidaté reçoivent « Socle », les autres reçoivent l'état de passage qui correspond à leur situation.
- Un rang par défaut, jamais : il ressemblerait trait pour trait à un rang gagné.

> Cet ordre a été trouvé en faisant TOURNER la règle, pas en la relisant : le premier jet lisait le type d'abord et rétrogradait deux Gardiens sacrés en Socle parce qu'ils n'ont pas de commande à eux.

| Type de fichier | Rang qu'il donne automatiquement |
|---|---|
| `crochet` | **Socle** |
| `filet-de-securite` | **Socle** |
| `bibliotheque-partagee` | **Socle** |
| `bibliotheque-solitaire` | **Socle** |
| `infrastructure-shell` | **Socle** |
| `commande-sans-fiche` | **Sans fiche** |
| `execution-directe-non-documentee` | **Sans porte** |
| `commande-documentee` | aucun — le rang se lit dans le registre de l'équipe, et à défaut c'est un état de passage |

## 3. L'échelle des rangs (10) — et comment on monte

Un rang n'est pas une étiquette figée : c'est une position sur une échelle, avec une marche suivante et ce qu'il faut pour la franchir. Les trois états de passage (Sans porte, Sans fiche, Postulant) ne sont pas des rangs où l'on reste — ce sont des files d'attente avec un geste précis au bout.

| Rang | Qui le remplit | Ce que ça veut dire | Marche suivante | Ce qu'il faut pour la franchir |
|---|---|---|---|---|
| 🧱 **Socle** | le type du fichier | n'est pas membre de l'équipe : c'est le sol sur lequel tout le monde marche | — | AUCUNE promotion, et ce n'est pas un plafond : il n'a jamais candidaté. Le promouvoir serait lui inventer une ambition qu'il n'a pas. |
| 🎖️ **Agents Cadre** | le registre de l'équipe | dirigent — une fonction dans l'organigramme, jamais un badge de qualité en plus | — | *(non arrêté)* |
| 🛡️ **Gardiens sacrés du code** | le registre de l'équipe | délivrent un vrai scan de qualité ET tournent automatiquement à CHAQUE commit | — | *(non arrêté)* |
| 🎖️ **Membres certifiés classiques** | le registre de l'équipe | un vrai membre badgé, dont la valeur est d'APPELER et d'AGRÉGER ce que les autres disent déjà — deux obligations seulement, parce qu'il n'a rien de propre à documenter à part | Membre | acquérir une connaissance propre au projet — et ça ne se décrète pas : ça se constate le jour où l'outil se met à savoir quelque chose que lui seul sait. |
| 🚧 **Hors de l'Agence** | ? | lance, sauvegarde ou archive le produit — testé comme n'importe quel code, mais jamais un travailleur de l'Agence (§5 du référentiel, 4e catégorie) | — | AUCUNE, et c'est le sens même du rang : ces scripts servent le PRODUIT, pas l'outillage qui le vérifie. Les équiper d'une fiche et d'un blueprint reviendrait à recruter le camion de livraison. |
| 🎖️ **Membres certifiés** | le registre de l'équipe | câblage complet vérifié : table maîtresse, menu, instanciation, registre, blueprint | Gardien sacré du code | remplir le critère DOUBLE de l'Article 20 : un vrai scan de qualité du CODE, ET gratuit à chaque commit. Vers Agent Cadre, ce n'est pas une promotion mécanique mais une décision d'organisation, donc celle de l'utilisateur. |
| 🚪 **Postulants** *(nom provisoire)* | le type, en l'absence d'inscription | documenté ET lançable, mais absent du registre de l'équipe : le plus proche de l'adhésion, à une décision près | Membre | l'inscrire au registre de l'équipe, et lui donner le poste de travail d'un Membre |
| 📄 **Sans fiche** *(nom provisoire)* | le type du fichier | lançable, mais nommé par aucun document du dépôt : soit une commande qu'on a oublié de documenter, soit un script jetable qui a survécu | Postulant | lui écrire une fiche — un document, n'importe lequel, qui le nomme |
| 🧱 **Sans porte** *(nom provisoire)* | le type du fichier | personne ne l'importe et aucune commande de lancement n'est écrite nulle part : il ne peut être lancé que par quelqu'un qui sait déjà — l'état le plus fragile du dépôt | Sans fiche | lui écrire une commande de lancement quelque part, ou le supprimer |
| 📝 **Émetteurs de rapport non certifiés** *(nom provisoire)* | un registre tiers | produisent un vrai rapport lu par un humain sans être membres — rang en attente de nommage | — | *(non arrêté)* |

| Rang | Le poste de travail qui en découle |
|---|---|
| Socle | AUCUN poste, et ce n'est pas un manque : une bibliothèque, un crochet ou le filet de sécurité servent tout le monde sans avoir jamais candidaté. Leur exigence est ailleurs — être importés proprement et testés. |
| Agent Cadre | tout ce qu'a un Membre, PLUS le droit de convoquer les autres et de rendre un verdict sur eux. Deux outils seulement. |
| Gardien sacré du code | fiche + blueprint + dossier d'historisation + ligne à la table maîtresse + câblage au crochet post-commit. JAMAIS d'item de Ronde : il tourne à chaque commit, un item ferait doublon. |
| Membre classique | DEUX obligations seulement : la ligne à la table maîtresse et l'entrée au menu des prestations. Ni fiche, ni blueprint, ni registre imposés d'office — il n'a rien de propre au projet à documenter à part. Tout le reste de son poste se DÉRIVE de ce qu'il fait réellement (cf. OBLIGATIONS_DERIVEES). |
| Hors Agence | AUCUN poste d'Agence, par nature : il sert le produit, pas l'outillage. Il reste tenu par le filet de sécurité et le typage, comme n'importe quel code du dépôt. |
| Membre | fiche + blueprint + dossier d'historisation + ligne à la table maîtresse + entrée au menu des prestations. Le poste complet, sans le crochet. |
| Postulant | poste NON ARRÊTÉ, et c'est justement ce que le rang signale : lançable, mais nommé par aucun document. La question n'est pas « quel poste lui donner » mais « le documente-t-on, ou le supprime-t-on ». |
| Sans fiche | poste NON ARRÊTÉ — et c'est le signal : la question n'est pas quel poste lui donner, mais lui écrire une fiche ou le supprimer. |
| Sans porte | poste NON ARRÊTÉ — la question est encore en amont : lui donner une commande de lancement, ou le supprimer. |
| Émetteur de rapport | *(non arrêté)* |

**Les pièces d'un poste complet**, pour lire la colonne de droite :

- **une fiche d'instanciation** (`docs/referentiel/<outil>.md`) — pour : tout rang sauf ceux qui n'ont aucune connaissance propre au projet
- **un blueprint générique** (`docs/<outil>-blueprint.md`) — pour : tout rang sauf cousin déclaré d'un autre Agent
- **un dossier d'historisation** (`docs/<outil>/ avec son index.md`) — pour : tout outil qui produit un rapport ou garde une mémoire
- **une ligne à la table maîtresse** (`docs/regles-de-travail.md §7ter`) — pour : tous, sans exception
- **une entrée au menu PRESTATIONS** (`scripts/le-coordinateur.mjs`) — pour : ceux qu'on lance à la demande ou qui coûtent de l'API
- **un item de Ronde** (`scripts/circle-tasks.mjs`) — pour : les périodiques — jamais les Gardiens sacrés, qui tournent à chaque commit

## 4. L'indice de classification à facettes

**Le nom n'est pas inventé** : ranger un objet sur plusieurs axes indépendants au lieu d'un seul arbre s'appelle une *classification à facettes*, et le code composite qui en résulte est une *notation* — en français de bibliothèque, un **indice**. Chaque position est une facette, chacune indépendante des autres, et l'indice entier se lit comme une adresse.

**Format : `type . rang . famille . classes`** — par exemple `2.2.3.dh`. Les trois premières facettes sont un rang dans une liste ; la quatrième est un nombre en base 36 dont chaque bit allumé est une classe (une seule facette répond « lesquelles ? » plutôt que « laquelle ? »).

> Trois états dans une facette, jamais deux : un chiffre (la valeur), « - » (la facette ne s'applique pas — un fichier du Socle n'a pas de famille et n'en manque pas), « ? » (la valeur existe mais n'a pas été reconnue). Confondre les deux derniers ferait lire une absence légitime comme un trou.

**Pourquoi un indice plutôt que des icônes** : une icône se reconnaît, elle ne se trie pas, ne se cherche pas et ne se compare pas. Un indice fait les trois. Les deux cohabitent — l'icône pour l'œil, l'indice pour la machine et le tri.

| Facette | Position | Valeurs possibles, dans l'ordre |
|---|---|---|
| type | 1 | 0=crochet · 1=filet-de-securite · 2=commande-documentee · 3=commande-sans-fiche · 4=bibliotheque-partagee · 5=bibliotheque-solitaire · 6=infrastructure-shell · 7=execution-directe-non-documentee |
| rang | 2 | 0=Socle · 1=Agent Cadre · 2=Gardien sacré du code · 3=Membre classique · 4=Hors Agence · 5=Membre · 6=Postulant · 7=Sans fiche · 8=Sans porte · 9=Émetteur de rapport |
| famille | 3 | 0=Audit indépendant · 1=Coordination · 2=Exceptionnel (page blanche / audit lourd) · 3=Gardiens sacrés du code · 4=Gouvernance interne · 5=Outillage de navigation · 6=Simulation & qualité narrative · 7=Suite Dette & Structure du code |
| classes | 4 | bit 0=scanne-le-depot · bit 1=rend-du-html · bit 2=tient-un-registre · bit 3=coute-des-appels-api · bit 4=porte-un-garde-fou-devolutivite · bit 5=declare-sa-fiabilite · bit 6=conclut-en-plan-daction · bit 7=compte-son-usage · bit 8=refuse-de-mesurer |

## 5. Chaque fichier : rang, famille, indice (88, exhaustif)

### 🎖️ Membre — 34

| Fichier | Famille | Indice |
|---|---|---|
| `abraham-les-references.mjs` | Suite Dette & Structure du code | `2.5.7.dz` |
| `agent-des-noms.mjs` | Suite Dette & Structure du code | `2.5.7.dh` |
| `agent-du-temps.mjs` | Gouvernance interne | `2.5.4.dg` |
| `angel-of-ia-process.mjs` | Coordination | `2.5.1.cl` |
| `check-gemini-quota.mjs` | Gouvernance interne | `2.5.4.4g` |
| `check-level-target.mjs` | Gouvernance interne | `2.5.4.6o` |
| `check-spirit.mjs` | Simulation & qualité narrative | `2.5.6.9x` |
| `check-suivi-fidelity.mjs` | Coordination | `2.5.1.35` |
| `check-tasks-details.mjs` | Coordination | `2.5.1.dz` |
| `circle-process-guardian.mjs` | Coordination | `2.5.1.dt` |
| `circle-tasks.mjs` | Coordination | `2.5.1.c7` |
| `data-archangel.mjs` | Coordination | `2.5.1.cl` |
| `ecotoken.mjs` | Gouvernance interne | `2.5.4.dh` |
| `el-professor.mjs` | Simulation & qualité narrative | `2.5.6.dz` |
| `find-booster.mjs` | Outillage de navigation | `2.5.5.4g` |
| `god-of-all-process.mjs` | Coordination | `2.5.1.c7` |
| `hyper-scan-checkpoint.mjs` | Exceptionnel (page blanche / audit lourd) | `2.5.2.6d` |
| `ines-official.mjs` | Exceptionnel (page blanche / audit lourd) | `2.5.2.3p` |
| `integration-outil.mjs` | Suite Dette & Structure du code | `4.5.7.bl` |
| `le-classificateur.mjs` | Gouvernance interne | `2.5.4.dr` |
| `memento.mjs` | Simulation & qualité narrative | `4.5.6.ck` |
| `moise-tables-de-loi.mjs` | Suite Dette & Structure du code | `2.5.7.dx` |
| `objectifs-vs-resultats.mjs` | Gouvernance interne | `2.5.4.cg` |
| `process-simulation-guardian.mjs` | Simulation & qualité narrative | `2.5.6.dt` |
| `pure-gold-unity.mjs` | Coordination | `4.5.1.br` |
| `smart-conso-api.mjs` | Gouvernance interne | `2.5.4.6c` |
| `smart-conso-token.mjs` | Gouvernance interne | `2.5.4.dg` |
| `the-deep-reader.mjs` | Audit indépendant | `5.5.0.2` |
| `the-equalizer.mjs` | Suite Dette & Structure du code | `2.5.7.dd` |
| `the-final-judge.mjs` | Audit indépendant | `5.5.0.2` |
| `the-king.mjs` | Gouvernance interne | `2.5.4.dc` |
| `the-screener-capture.mjs` | Simulation & qualité narrative | `2.5.6.4m` |
| `tool-brain.mjs` | Coordination | `2.5.1.dd` |
| `tool-learning.mjs` | Suite Dette & Structure du code | `2.5.7.dh` |

### 🧱 Socle — 23

| Fichier | Famille | Indice |
|---|---|---|
| `api-providers.mjs` | — | `5.0.-.8` |
| `build-verified.sh` | — | `6.0.-.0` |
| `check-house.mjs` | — | `1.0.-.e7` |
| `corpus-mesure.mjs` | — | `4.0.-.74` |
| `execution-profile.mjs` | — | `4.0.-.0` |
| `gemini-key-health.mjs` | — | `4.0.-.4` |
| `hooks/check-last-commit.mjs` | — | `0.0.-.1` |
| `hooks/install.mjs` | — | `0.0.-.0` |
| `hooks/post-commit` | — | `0.0.-.0` |
| `hooks/pre-commit` | — | `0.0.-.0` |
| `html-report.mjs` | — | `4.0.-.2` |
| `install-ci.sh` | — | `6.0.-.0` |
| `install-pnpm.sh` | — | `6.0.-.0` |
| `judge-persona-shared.mjs` | — | `4.0.-.0` |
| `lib-json.mjs` | — | `4.0.-.0` |
| `lib-markdown-table.mjs` | — | `4.0.-.0` |
| `lib-shell.mjs` | — | `4.0.-.x` |
| `memento-weight.mjs` | — | `4.0.-.4` |
| `priorites.mjs` | — | `4.0.-.74` |
| `report-template.mjs` | — | `4.0.-.9y` |
| `serie-temporelle.mjs` | — | `4.0.-.78` |
| `simulation-visiteur.mjs` | — | `5.0.-.0` |
| `tasks-process-guardian.mjs` | — | `5.0.-.4g` |

### 🎖️ Membre classique — 13

| Fichier | Famille | Indice |
|---|---|---|
| `check-profil-utilisateur.mjs` | Coordination | `2.3.1.2p` |
| `criticite.mjs` | Coordination | `2.3.1.7k` |
| `doc-report.mjs` | Coordination | `2.3.1.6v` |
| `find-brain.mjs` | Outillage de navigation | `2.3.5.4g` |
| `kpi-report.mjs` | Gouvernance interne | `2.3.4.dj` |
| `le-regisseur.mjs` | Simulation & qualité narrative | `2.3.6.dj` |
| `messages-courts.mjs` | Coordination | `2.3.1.74` |
| `modes-de-travail.mjs` | Coordination | `2.3.1.4` |
| `ou-on-en-est.mjs` | Coordination | `2.3.1.87` |
| `rapport-gros-prompt.mjs` | Coordination | `2.3.1.5g` |
| `route-booster.mjs` | Outillage de navigation | `2.3.5.4g` |
| `the-ghost.mjs` | Gouvernance interne | `2.3.4.4` |
| `tool-usage.mjs` | Gouvernance interne | `2.3.4.as` |

### 🛡️ Gardien sacré du code — 7

| Fichier | Famille | Indice |
|---|---|---|
| `always-new-code.mjs` | Gardiens sacrés du code | `2.2.3.ds` |
| `axa-check.mjs` | Gardiens sacrés du code | `2.2.3.dh` |
| `check-argus.mjs` | Gardiens sacrés du code | `2.2.3.dh` |
| `check-harmonia.mjs` | Gardiens sacrés du code | `2.2.3.dd` |
| `clean-dirty-old.mjs` | Gardiens sacrés du code | `2.2.3.68` |
| `clone-hunter.mjs` | Gardiens sacrés du code | `4.2.3.69` |
| `safe-export.mjs` | Gardiens sacrés du code | `4.2.3.dd` |

### 🚧 Hors Agence — 6

| Fichier | Famille | Indice |
|---|---|---|
| `run-framework.mjs` | — | `2.4.-.0` |
| `run-simulation.mjs` | — | `2.4.-.4` |
| `sauvegarde-projet.mjs` | — | `2.4.-.5` |
| `sites-env.mjs` | — | `2.4.-.0` |
| `sites-env.sh` | — | `6.4.-.0` |
| `summarize-simulation-log.mjs` | — | `2.4.-.w` |

### 🎖️ Agent Cadre — 2

| Fichier | Famille | Indice |
|---|---|---|
| `cassandra-rh.mjs` | Gouvernance interne | `2.1.4.dz` |
| `le-coordinateur.mjs` | Coordination | `2.1.1.bb` |

### 🧱 Sans porte — 2

| Fichier | Famille | Indice |
|---|---|---|
| `install-ci.mjs` | — | `7.8.-.0` |
| `pnpm-install.mjs` | — | `7.8.-.4` |

### 🚪 Postulant — 1

| Fichier | Famille | Indice |
|---|---|---|
| `check-profile.mjs` | — | `2.6.-.14` |

## 6. Les types de fichier (7, exhaustif)

### commande-documentee — 55

> une porte d'entrée réelle (ligne de commande, package.json, crochet ou commande écrite) ET au moins un document qui la nomme

`abraham-les-references.mjs` · `agent-des-noms.mjs` · `agent-du-temps.mjs` · `always-new-code.mjs` · `angel-of-ia-process.mjs` · `axa-check.mjs` · `cassandra-rh.mjs` · `check-argus.mjs` · `check-gemini-quota.mjs` · `check-harmonia.mjs` · `check-level-target.mjs` · `check-profil-utilisateur.mjs` · `check-profile.mjs` · `check-spirit.mjs` · `check-suivi-fidelity.mjs` · `check-tasks-details.mjs` · `circle-process-guardian.mjs` · `circle-tasks.mjs` · `clean-dirty-old.mjs` · `criticite.mjs` · `data-archangel.mjs` · `doc-report.mjs` · `ecotoken.mjs` · `el-professor.mjs` · `find-booster.mjs` · `find-brain.mjs` · `god-of-all-process.mjs` · `hyper-scan-checkpoint.mjs` · `ines-official.mjs` · `kpi-report.mjs` · `le-classificateur.mjs` · `le-coordinateur.mjs` · `le-regisseur.mjs` · `messages-courts.mjs` · `modes-de-travail.mjs` · `moise-tables-de-loi.mjs` · `objectifs-vs-resultats.mjs` · `ou-on-en-est.mjs` · `process-simulation-guardian.mjs` · `rapport-gros-prompt.mjs` · `route-booster.mjs` · `run-framework.mjs` · `run-simulation.mjs` · `sauvegarde-projet.mjs` · `sites-env.mjs` · `smart-conso-api.mjs` · `smart-conso-token.mjs` · `summarize-simulation-log.mjs` · `the-equalizer.mjs` · `the-ghost.mjs` · `the-king.mjs` · `the-screener-capture.mjs` · `tool-brain.mjs` · `tool-learning.mjs` · `tool-usage.mjs`

### bibliotheque-partagee — 17

> aucune porte d'entrée, importée par plusieurs — le vocabulaire commun de l'Agence

`clone-hunter.mjs` · `corpus-mesure.mjs` · `execution-profile.mjs` · `gemini-key-health.mjs` · `html-report.mjs` · `integration-outil.mjs` · `judge-persona-shared.mjs` · `lib-json.mjs` · `lib-markdown-table.mjs` · `lib-shell.mjs` · `memento-weight.mjs` · `memento.mjs` · `priorites.mjs` · `pure-gold-unity.mjs` · `report-template.mjs` · `safe-export.mjs` · `serie-temporelle.mjs`

### bibliotheque-solitaire — 5

> aucune porte d'entrée et importée par un seul : à fusionner dans son unique client, ou bien il lui manque des clients

`api-providers.mjs` · `simulation-visiteur.mjs` · `tasks-process-guardian.mjs` · `the-deep-reader.mjs` · `the-final-judge.mjs`

### infrastructure-shell — 4

> script shell d'installation ou de construction, hors de l'Agence

`build-verified.sh` · `install-ci.sh` · `install-pnpm.sh` · `sites-env.sh`

### crochet — 4

> s'exécute automatiquement à un moment de git, jamais appelé à la main

`hooks/check-last-commit.mjs` · `hooks/install.mjs` · `hooks/post-commit` · `hooks/pre-commit`

### execution-directe-non-documentee — 2

> personne ne l'importe et aucune commande de lancement n'est écrite nulle part : il ne peut être lancé qu'à la main, par quelqu'un qui sait déjà

`install-ci.mjs` · `pnpm-install.mjs`

### filet-de-securite — 1

> la suite de tests elle-même — ce que le crochet lance et qui peut refuser un commit

`check-house.mjs`

## 7. Les familles (8, exhaustif)

Une famille dit **ce sur quoi on travaille**, jamais ce qu'on vaut. Les Gardiens sacrés ont désormais la leur, sur décision de l'utilisateur : le nom répète leur rang, et c'est assumé — une famille explicitement redondante se lit mieux qu'un troisième nom pour la même chose, et c'est l'endroit où on les cherche quand on ouvre l'organigramme.

**Coordination** — 17 : `angel-of-ia-process` · `check-profil-utilisateur` · `check-suivi-fidelity` · `check-tasks-details` · `circle-process-guardian` · `circle-tasks` · `criticite` · `data-archangel` · `doc-report` · `god-of-all-process` · `le-coordinateur` · `messages-courts` · `modes-de-travail` · `ou-on-en-est` · `pure-gold-unity` · `rapport-gros-prompt` · `tool-brain`

**Gouvernance interne** — 13 : `agent-du-temps` · `cassandra-rh` · `check-level-target` · `ecotoken` · `kpi-report` · `le-classificateur` · `objectifs-vs-resultats` · `smart-breaker` · `smart-conso-api` · `smart-conso-token` · `the-ghost` · `the-king` · `tool-usage`

**Gardiens sacrés du code** — 7 : `always-new-code` · `argus` · `axa-check` · `clean-dirty-old` · `clone-hunter` · `harmonia` · `safe-export`

**Suite Dette & Structure du code** — 6 : `abraham-les-references` · `agent-des-noms` · `integration-outil` · `moise-tables-de-loi` · `the-equalizer` · `tool-learning`

**Simulation & qualité narrative** — 6 : `check-spirit` · `el-professor` · `le-regisseur` · `memory-audit` · `process-simulation-guardian` · `the-screener`

**Outillage de navigation** — 4 : `find-booster` · `find-brain` · `find-deep-booster` · `route-booster`

**Audit indépendant** — 2 : `the-deep-reader` · `the-final-judge`

**Exceptionnel (page blanche / audit lourd)** — 2 : `hyper-scan-checkpoint` · `ines-official`

## 8. Les classes transverses (9, exhaustif)

Une classe dit **ce qu'un fichier sait faire**. Elle se cumule librement et traverse les rangs : un Gardien sacré et une bibliothèque peuvent porter la même.

### scanne le dépôt — 38

> parcourt des fichiers pour y chercher quelque chose — la classe que l'utilisateur a nommée lui-même

`abraham-les-references.mjs` · `agent-des-noms.mjs` · `angel-of-ia-process.mjs` · `axa-check.mjs` · `cassandra-rh.mjs` · `check-argus.mjs` · `check-harmonia.mjs` · `check-house.mjs` · `check-profil-utilisateur.mjs` · `check-spirit.mjs` · `check-suivi-fidelity.mjs` · `check-tasks-details.mjs` · `circle-process-guardian.mjs` · `circle-tasks.mjs` · `clone-hunter.mjs` · `data-archangel.mjs` · `doc-report.mjs` · `ecotoken.mjs` · `el-professor.mjs` · `god-of-all-process.mjs` · `hooks/check-last-commit.mjs` · `hyper-scan-checkpoint.mjs` · `ines-official.mjs` · `integration-outil.mjs` · `kpi-report.mjs` · `le-classificateur.mjs` · `le-coordinateur.mjs` · `le-regisseur.mjs` · `lib-shell.mjs` · `moise-tables-de-loi.mjs` · `ou-on-en-est.mjs` · `process-simulation-guardian.mjs` · `pure-gold-unity.mjs` · `safe-export.mjs` · `sauvegarde-projet.mjs` · `the-equalizer.mjs` · `tool-brain.mjs` · `tool-learning.mjs`

### rend un rapport HTML — 19

> produit une page, donc quelque chose que l'utilisateur LIT vraiment

`abraham-les-references.mjs` · `cassandra-rh.mjs` · `check-house.mjs` · `check-tasks-details.mjs` · `circle-tasks.mjs` · `doc-report.mjs` · `el-professor.mjs` · `god-of-all-process.mjs` · `html-report.mjs` · `kpi-report.mjs` · `le-classificateur.mjs` · `le-coordinateur.mjs` · `le-regisseur.mjs` · `ou-on-en-est.mjs` · `pure-gold-unity.mjs` · `report-template.mjs` · `the-deep-reader.mjs` · `the-final-judge.mjs` · `the-screener-capture.mjs`

### tient un registre — 41

> écrit une mémoire durable sur le disque — ce qui lui permet de se souvenir d'un passage à l'autre

`abraham-les-references.mjs` · `agent-des-noms.mjs` · `agent-du-temps.mjs` · `angel-of-ia-process.mjs` · `axa-check.mjs` · `cassandra-rh.mjs` · `check-argus.mjs` · `check-house.mjs` · `check-spirit.mjs` · `check-tasks-details.mjs` · `circle-tasks.mjs` · `data-archangel.mjs` · `doc-report.mjs` · `ecotoken.mjs` · `el-professor.mjs` · `gemini-key-health.mjs` · `god-of-all-process.mjs` · `hyper-scan-checkpoint.mjs` · `ines-official.mjs` · `kpi-report.mjs` · `le-classificateur.mjs` · `le-coordinateur.mjs` · `le-regisseur.mjs` · `memento-weight.mjs` · `memento.mjs` · `modes-de-travail.mjs` · `moise-tables-de-loi.mjs` · `ou-on-en-est.mjs` · `pnpm-install.mjs` · `pure-gold-unity.mjs` · `rapport-gros-prompt.mjs` · `report-template.mjs` · `run-simulation.mjs` · `sauvegarde-projet.mjs` · `serie-temporelle.mjs` · `smart-conso-api.mjs` · `smart-conso-token.mjs` · `the-ghost.mjs` · `the-screener-capture.mjs` · `tool-learning.mjs` · `tool-usage.mjs`

### coûte de vrais appels API — 4

> consulte un modèle ou un service distant : jamais lancé sans passer par Smart Conso API (Article 22)

`api-providers.mjs` · `check-house.mjs` · `check-profile.mjs` · `le-classificateur.mjs`

### porte un garde-fou d'évolutivité — 16

> contient une fonction qui refuse une liste recopiée à la main : elle compare une copie à sa source et crie quand les deux divergent (Article 24). C'est ce qui permet à un registre de grossir sans qu'une copie oubliée se périme en silence.

`abraham-les-references.mjs` · `always-new-code.mjs` · `cassandra-rh.mjs` · `check-house.mjs` · `check-level-target.mjs` · `check-suivi-fidelity.mjs` · `check-tasks-details.mjs` · `circle-process-guardian.mjs` · `circle-tasks.mjs` · `criticite.mjs` · `doc-report.mjs` · `el-professor.mjs` · `god-of-all-process.mjs` · `le-coordinateur.mjs` · `moise-tables-de-loi.mjs` · `process-simulation-guardian.mjs`

### déclare sa marge d'erreur — 48

> avertit qu'il peut se tromper avant de rendre un chiffre — l'exigence transverse de tous les outils heuristiques

`abraham-les-references.mjs` · `agent-des-noms.mjs` · `agent-du-temps.mjs` · `always-new-code.mjs` · `axa-check.mjs` · `cassandra-rh.mjs` · `check-argus.mjs` · `check-gemini-quota.mjs` · `check-harmonia.mjs` · `check-house.mjs` · `check-level-target.mjs` · `check-profil-utilisateur.mjs` · `check-profile.mjs` · `check-spirit.mjs` · `check-suivi-fidelity.mjs` · `check-tasks-details.mjs` · `circle-process-guardian.mjs` · `circle-tasks.mjs` · `clean-dirty-old.mjs` · `clone-hunter.mjs` · `doc-report.mjs` · `ecotoken.mjs` · `el-professor.mjs` · `find-booster.mjs` · `find-brain.mjs` · `god-of-all-process.mjs` · `hyper-scan-checkpoint.mjs` · `integration-outil.mjs` · `kpi-report.mjs` · `le-classificateur.mjs` · `le-regisseur.mjs` · `lib-shell.mjs` · `moise-tables-de-loi.mjs` · `ou-on-en-est.mjs` · `process-simulation-guardian.mjs` · `pure-gold-unity.mjs` · `report-template.mjs` · `route-booster.mjs` · `safe-export.mjs` · `smart-conso-api.mjs` · `smart-conso-token.mjs` · `summarize-simulation-log.mjs` · `tasks-process-guardian.mjs` · `the-equalizer.mjs` · `the-king.mjs` · `the-screener-capture.mjs` · `tool-brain.mjs` · `tool-learning.mjs`

### conclut par un plan d'action — 39

> transforme ses constats en gestes (Article 28) au lieu de s'arrêter au rapport

`abraham-les-references.mjs` · `agent-des-noms.mjs` · `agent-du-temps.mjs` · `always-new-code.mjs` · `angel-of-ia-process.mjs` · `axa-check.mjs` · `cassandra-rh.mjs` · `check-argus.mjs` · `check-harmonia.mjs` · `check-house.mjs` · `check-level-target.mjs` · `check-profil-utilisateur.mjs` · `check-spirit.mjs` · `check-suivi-fidelity.mjs` · `check-tasks-details.mjs` · `circle-process-guardian.mjs` · `clean-dirty-old.mjs` · `clone-hunter.mjs` · `data-archangel.mjs` · `doc-report.mjs` · `ecotoken.mjs` · `el-professor.mjs` · `hyper-scan-checkpoint.mjs` · `kpi-report.mjs` · `le-classificateur.mjs` · `le-regisseur.mjs` · `memento.mjs` · `moise-tables-de-loi.mjs` · `objectifs-vs-resultats.mjs` · `process-simulation-guardian.mjs` · `rapport-gros-prompt.mjs` · `report-template.mjs` · `safe-export.mjs` · `smart-conso-api.mjs` · `smart-conso-token.mjs` · `the-equalizer.mjs` · `the-king.mjs` · `tool-brain.mjs` · `tool-learning.mjs`

### enregistre son propre usage — 48

> sait dire s'il a servi — sans quoi personne ne peut constater qu'un outil n'est jamais sollicité

`abraham-les-references.mjs` · `agent-des-noms.mjs` · `agent-du-temps.mjs` · `always-new-code.mjs` · `angel-of-ia-process.mjs` · `axa-check.mjs` · `cassandra-rh.mjs` · `check-argus.mjs` · `check-gemini-quota.mjs` · `check-harmonia.mjs` · `check-house.mjs` · `check-level-target.mjs` · `check-tasks-details.mjs` · `circle-process-guardian.mjs` · `circle-tasks.mjs` · `clean-dirty-old.mjs` · `clone-hunter.mjs` · `data-archangel.mjs` · `doc-report.mjs` · `ecotoken.mjs` · `el-professor.mjs` · `find-booster.mjs` · `find-brain.mjs` · `god-of-all-process.mjs` · `hyper-scan-checkpoint.mjs` · `ines-official.mjs` · `integration-outil.mjs` · `kpi-report.mjs` · `le-classificateur.mjs` · `le-coordinateur.mjs` · `le-regisseur.mjs` · `memento.mjs` · `moise-tables-de-loi.mjs` · `objectifs-vs-resultats.mjs` · `process-simulation-guardian.mjs` · `pure-gold-unity.mjs` · `rapport-gros-prompt.mjs` · `route-booster.mjs` · `safe-export.mjs` · `smart-conso-api.mjs` · `smart-conso-token.mjs` · `tasks-process-guardian.mjs` · `the-equalizer.mjs` · `the-king.mjs` · `the-screener-capture.mjs` · `tool-brain.mjs` · `tool-learning.mjs` · `tool-usage.mjs`

### sait répondre « pas mesuré » — 42

> distingue « je n'ai rien trouvé » de « je n'ai pas pu regarder » (leçon L5) — la classe la plus discrète et la plus importante

`abraham-les-references.mjs` · `agent-des-noms.mjs` · `agent-du-temps.mjs` · `always-new-code.mjs` · `angel-of-ia-process.mjs` · `axa-check.mjs` · `cassandra-rh.mjs` · `check-argus.mjs` · `check-harmonia.mjs` · `check-house.mjs` · `check-spirit.mjs` · `check-tasks-details.mjs` · `circle-process-guardian.mjs` · `circle-tasks.mjs` · `corpus-mesure.mjs` · `criticite.mjs` · `data-archangel.mjs` · `ecotoken.mjs` · `el-professor.mjs` · `god-of-all-process.mjs` · `integration-outil.mjs` · `kpi-report.mjs` · `le-classificateur.mjs` · `le-coordinateur.mjs` · `le-regisseur.mjs` · `memento.mjs` · `messages-courts.mjs` · `moise-tables-de-loi.mjs` · `objectifs-vs-resultats.mjs` · `ou-on-en-est.mjs` · `priorites.mjs` · `process-simulation-guardian.mjs` · `pure-gold-unity.mjs` · `report-template.mjs` · `safe-export.mjs` · `serie-temporelle.mjs` · `smart-conso-token.mjs` · `the-equalizer.mjs` · `the-king.mjs` · `tool-brain.mjs` · `tool-learning.mjs` · `tool-usage.mjs`

## 9. Ce qui reste ouvert

**1 fichiers sont Postulants** : documentés, lançables, et absents du registre de l'équipe. Ce n'est plus une case vide — c'est une file d'attente avec un geste connu au bout (les inscrire, ou déclarer qu'ils n'ont pas vocation à entrer).

> ⚠️ Le référentiel et le code ne déclarent pas le même nombre d'axes — le référentiel déclare 2 axe(s), le code en publie 8 (iceberg, type, moment, domaine, destinataire, cherche, rang, famille) — la prose se rédige à la main, mais elle ne peut plus s'écarter en silence.

