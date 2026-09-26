# Classification générale de l'Agence Codex — le document officiel

GÉNÉRÉ par `node scripts/le-classificateur.mjs classification`, dernier passage 2026-09-26 04:04 UTC. **Ne jamais le modifier à la main** : la prochaine génération écraserait la correction. Ce qui doit changer se change dans le code qui le produit, et le document suit tout seul — l'Article 24 appliqué au document qui décrit la classification.

## 0. Classification ou organisation ? Les deux existent

**La CLASSIFICATION décrit ce qui EST.** Elle range : quel fichier est de quelle nature, quel rang il porte, dans quelle famille il travaille. Elle se MESURE sur le dépôt.

**L'ORGANISATION décide ce qui DOIT ÊTRE.** Qui dirige, quel poste exige quels documents, quel process encadre quoi. Elle se TRANCHE.

**Est-ce que l'organisation décide de la classification ?** Sur un point précis, oui — et c'est le seul. L'organisation décide des CRITÈRES (ce qu'il faut pour être Gardien sacré) ; la classification applique ces critères aux fichiers réels et dit qui les remplit. Elle ne choisit jamais qui entre dans quelle case : elle mesure. C'est pour ça que les deux documents existent, et que ni l'un ni l'autre n'absorbe son voisin — l'un pose la règle, l'autre compte.

## 1. Les 8 axes, et la question à laquelle chacun répond

| Axe | La question | Comment il se remplit | Combien de fichiers il couvre, ici |
|---|---|---|---|
| **TYPE** | ce que le fichier EST | se CONSTATE en lisant le fichier | **88 / 88** — aucun fichier sans type |
| **RANG** | ce que le fichier VAUT | se MÉRITE d'abord ; ne se DÉDUIT du type qu'à défaut | **88 / 88** (100 %) |
| **FAMILLE** | ce sur quoi il travaille | se décide — une par membre de l'équipe, plus celle que porte le rang Hors Agence | **62 / 88** : 56 fichiers de l'équipe + 6 Hors Agence. Les 26 restants sont le Socle et les états de passage, qui n'ont pas de famille et n'en manquent pas. |
| **CLASSES TRANSVERSES** | ce qu'il sait FAIRE | une sonde par classe sur le code ; zéro, une ou plusieurs par fichier | **73 / 88** en portent au moins une — les autres n'en portent aucune, et c'est un constat, pas un trou |
| *iceberg* | à quel groupe il appartient (membre, oublié, infrastructure, plomberie) | porté par `classerIceberg()` | *mesuré dans l'outil qui le porte, jamais recompté ici* — deux comptages du même axe finiraient par diverger |
| *moment* | QUAND il intervient | porté par `momentsDeLOutil()` | *mesuré dans l'outil qui le porte, jamais recompté ici* — deux comptages du même axe finiraient par diverger |
| *domaine* | SUR QUOI il regarde | porté par `domainesDeLOutil()` | *mesuré dans l'outil qui le porte, jamais recompté ici* — deux comptages du même axe finiraient par diverger |
| *destinataire* | À QUI le résultat sert | porté par `destinatairesDeLOutil()` | *mesuré dans l'outil qui le porte, jamais recompté ici* — deux comptages du même axe finiraient par diverger |
| *cherche* | QUELLE QUESTION il pose au dépôt (déclaré-mais-absent, deux-sources-divergent, duplication…) | porté par `cartographieCriteresTransverses() — HARMONIA` | *mesuré dans l'outil qui le porte, jamais recompté ici* — deux comptages du même axe finiraient par diverger |

> ⚠️ **Le registre de l'équipe compte 57 inscrits, mais seulement 56 ont un fichier à eux.** Le ou les manquants : `find-deep-booster` — un vrai membre, avec son rang et sa famille, dont le code vit à l'intérieur d'un autre fichier. Ce n'est pas un bug, c'est un fait : il est dit ici plutôt que noyé dans une addition qui ne tomberait pas juste.

> **Les quatre premiers axes sont en gras parce qu'ils composent l'indice** (§4) ; les cinq autres existent et sont mesurés, mais par d'autres outils, et n'entrent pas dans le code. C'est une décision, pas un oubli : un indice à neuf facettes ne se lirait plus.

**Pourquoi type et rang ne font pas doublon** : un type se constate, un rang se mérite. Une bibliothèque partagée n'a pas de rang d'équipe et n'en manque pas — elle n'a jamais candidaté.

## 2. Comment type et rang se croisent — la règle, en une phrase

> **À RETENIR** — Le rang MÉRITÉ l'emporte toujours ; le type ne remplit que les cases que personne n'a remplies.

- L'outil est inscrit au registre de l'équipe → il porte le rang qui y est écrit, quel que soit son type.
- Sinon, son TYPE décide : ceux qui servent sans avoir candidaté reçoivent « Socle », les autres reçoivent l'état de passage qui correspond à leur situation.
- Un rang par défaut, jamais : il ressemblerait trait pour trait à un rang gagné.

> Cet ordre a été trouvé en faisant TOURNER la règle, pas en la relisant : le premier jet lisait le type d'abord et rétrogradait deux Gardiens sacrés en Socle parce qu'ils n'ont pas de commande à eux.

| Type de fichier | Rang qu'il donne automatiquement |
|---|---|
| 🪝 `crochet` | 🧱 **Socle** |
| 🕸️ `filet-de-securite` | 🧱 **Socle** |
| ⌨️ `commande-documentee` | aucun — le rang se lit dans le registre de l'équipe, et à défaut c'est un état de passage |
| ❓ `commande-sans-fiche` | 🏷️ **Sans fiche** |
| 📚 `bibliotheque-partagee` | 🧱 **Socle** |
| 📕 `bibliotheque-solitaire` | 🧱 **Socle** |
| 🐚 `infrastructure-shell` | 🧱 **Socle** |
| 🔒 `execution-directe-non-documentee` | 🕳️ **Sans porte** |

## 3. L'échelle des rangs (10) — et comment on monte

Un rang n'est pas une étiquette figée : c'est une position sur une échelle, avec une marche suivante et ce qu'il faut pour la franchir. Les trois états de passage (Sans porte, Sans fiche, Postulant) ne sont pas des rangs où l'on reste — ce sont des files d'attente avec un geste précis au bout.

| # | Rang | Qui le remplit | Ce que ça veut dire | Marche suivante | Ce qu'il faut pour la franchir |
|---|---|---|---|---|---|
| 0 | 🕳️ **Sans porte** *(nom provisoire)* | le type du fichier | personne ne l'importe et aucune commande de lancement n'est écrite nulle part : il ne peut être lancé que par quelqu'un qui sait déjà — l'état le plus fragile du dépôt | 🏷️ Sans fiche | lui écrire une commande de lancement quelque part, ou le supprimer |
| 1 | 🏷️ **Sans fiche** *(nom provisoire)* | le type du fichier | lançable, mais nommé par aucun document du dépôt : soit une commande qu'on a oublié de documenter, soit un script jetable qui a survécu | 🚪 Postulant | lui écrire une fiche — un document, n'importe lequel, qui le nomme |
| 2 | 🚪 **Postulant** *(nom provisoire)* | le type, en l'absence d'inscription | documenté ET lançable, mais absent du registre de l'équipe : le plus proche de l'adhésion, à une décision près | 🥇 Membre premium | l'inscrire au registre de l'équipe, et lui donner le poste de travail d'un Membre |
| 3 | 🥈 **Membre classique** | le registre de l'équipe | un vrai membre badgé, dont la valeur est d'APPELER et d'AGRÉGER ce que les autres disent déjà — deux obligations seulement, parce qu'il n'a rien de propre à documenter à part | 🥇 Membre premium | acquérir une connaissance propre au projet — et ça ne se décrète pas : ça se constate le jour où l'outil se met à savoir quelque chose que lui seul sait. |
| 4 | 🥇 **Membre premium** | le registre de l'équipe | câblage complet vérifié : table maîtresse, menu, instanciation, registre, blueprint | 🛡️ Gardien sacré du code | remplir le critère DOUBLE de l'Article 20 : un vrai scan de qualité du CODE, ET gratuit à chaque commit. Vers Agent Cadre, ce n'est pas une promotion mécanique mais une décision d'organisation, donc celle de l'utilisateur. |
| 5 | 🛡️ **Gardien sacré du code** | le registre de l'équipe | délivrent un vrai scan de qualité ET tournent automatiquement à CHAQUE commit | — *(sommet ou hors échelle)* | SOMMET de la qualité : aucun rang de mérite au-dessus. Le seul mouvement restant est vers Agent Cadre, qui n'est pas une promotion mais une décision d'organisation. |
| 6 | 👔 **Agent Cadre** | le registre de l'équipe | dirigent — une fonction dans l'organigramme, jamais un badge de qualité en plus | — *(sommet ou hors échelle)* | SOMMET de l'échelle : il n'y a rien au-dessus. Et on n'y monte pas par mérite mesuré — c'est une décision d'organisation, donc celle de l'utilisateur. Le rang se définit par un pouvoir précis : convoquer les autres et rendre un verdict sur eux. |
| hors échelle | 🧱 **Socle** | le type du fichier | n'est pas membre de l'équipe : c'est le sol sur lequel tout le monde marche | — *(sommet ou hors échelle)* | AUCUNE promotion, et ce n'est pas un plafond : il n'a jamais candidaté. Le promouvoir serait lui inventer une ambition qu'il n'a pas. |
| hors échelle | 📝 **Émetteur de rapport** *(nom provisoire)* | un registre tiers | produisent un vrai rapport lu par un humain sans être membres — rang en attente de nommage | — *(sommet ou hors échelle)* | EN ATTENTE DE NOM (fournée #200) : sa marche suivante se décidera avec son nom, et pas avant — décider d'une promotion pour un rang qu'on ne sait pas encore nommer serait décider dans le vide. |
| hors échelle | 🚧 **Hors Agence** | une déclaration écrite à la main, avec sa raison | lance, sauvegarde ou archive le produit — testé comme n'importe quel code, mais jamais un travailleur de l'Agence (§5 du référentiel, 4e catégorie) | — *(sommet ou hors échelle)* | AUCUNE, et c'est le sens même du rang : ces scripts servent le PRODUIT, pas l'outillage qui le vérifie. Les équiper d'une fiche et d'un blueprint reviendrait à recruter le camion de livraison. |

> La colonne **#** est la position sur l'échelle, de la plus fragile (0) à la plus haute (6). Les quatre derniers rangs n'ont pas de numéro : le Socle, l'Émetteur de rapport et les Hors Agence ne sont pas des marches qu'on monte, ce sont des SITUATIONS — et le dire vaut mieux que de les ranger dans une échelle où ils n'iraient nulle part.

| Rang | Le poste de travail qui en découle |
|---|---|
| 🕳️ Sans porte | poste NON ARRÊTÉ — la question est encore en amont : lui donner une commande de lancement, ou le supprimer. |
| 🏷️ Sans fiche | poste NON ARRÊTÉ — et c'est le signal : la question n'est pas quel poste lui donner, mais lui écrire une fiche ou le supprimer. |
| 🚪 Postulant | poste NON ARRÊTÉ, et c'est justement ce que le rang signale : lançable, mais nommé par aucun document. La question n'est pas « quel poste lui donner » mais « le documente-t-on, ou le supprime-t-on ». |
| 🥈 Membre classique | DEUX obligations seulement : la ligne à la table maîtresse et l'entrée au menu des prestations. Ni fiche, ni blueprint, ni registre imposés d'office — il n'a rien de propre au projet à documenter à part. Tout le reste de son poste se DÉRIVE de ce qu'il fait réellement (cf. OBLIGATIONS_DERIVEES). |
| 🥇 Membre premium | fiche + blueprint + dossier d'historisation + ligne à la table maîtresse + entrée au menu des prestations. Le poste complet, sans le crochet. |
| 🛡️ Gardien sacré du code | fiche + blueprint + dossier d'historisation + ligne à la table maîtresse + câblage au crochet post-commit. JAMAIS d'item de Ronde : il tourne à chaque commit, un item ferait doublon. |
| 👔 Agent Cadre | tout ce qu'a un Membre premium, PLUS le droit de convoquer les autres et de rendre un verdict sur eux. UN SEUL outil aujourd'hui, CASSANDRA-RH, depuis que LE-COORDINATEUR a rendu le rang le 2026-09-26 faute de pouvoir convoquer. |
| 🧱 Socle | AUCUN poste, et ce n'est pas un manque : une bibliothèque, un crochet ou le filet de sécurité servent tout le monde sans avoir jamais candidaté. Leur exigence est ailleurs — être importés proprement et testés. |
| 📝 Émetteur de rapport | *(non arrêté)* |
| 🚧 Hors Agence | AUCUN poste d'Agence, par nature : il sert le produit, pas l'outillage. Il reste tenu par le filet de sécurité et le typage, comme n'importe quel code du dépôt. |

**Les pièces d'un poste complet**, pour lire la colonne de droite :

- **une fiche d'instanciation** (`docs/referentiel/<outil>.md`) — pour : tout rang sauf ceux qui n'ont aucune connaissance propre au projet
- **un blueprint générique** (`docs/<outil>-blueprint.md`) — pour : tout rang sauf cousin déclaré d'un autre Agent
- **un dossier d'historisation** (`docs/<outil>/ avec son index.md`) — pour : tout outil qui produit un rapport ou garde une mémoire
- **une ligne à la table maîtresse** (`docs/regles-de-travail.md §7ter`) — pour : tous, sans exception
- **une entrée au menu PRESTATIONS** (`scripts/le-coordinateur.mjs`) — pour : ceux qu'on lance à la demande ou qui coûtent de l'API
- **un item de Ronde** (`scripts/circle-tasks.mjs`) — pour : les périodiques — jamais les Gardiens sacrés, qui tournent à chaque commit

## 4. L'indice de classification à facettes

**Le nom n'est pas inventé** : ranger un objet sur plusieurs axes indépendants au lieu d'un seul arbre s'appelle une *classification à facettes*, et le code composite qui en résulte est une *notation* — en français de bibliothèque, un **indice**. Chaque position est une facette, chacune indépendante des autres, et l'indice entier se lit comme une adresse.

**Format : `type . rang . famille . classes`** — les trois premières facettes sont un rang dans une liste ; la quatrième est un nombre en base 36 dont chaque bit allumé est une classe (une seule facette répond « lesquelles ? » plutôt que « laquelle ? »).

> **À RETENIR** — **Exemple réel, pris dans le tableau du §5** : `always-new-code.mjs` porte l'indice **`2.2.7.ds`**, soit ⌨️ 🛡️ 🛡️ 🌱⚠️🎯🪞🧭. Décodé : type *commande-documentee* · rang *Gardien sacré du code* · famille *Les Gardiens Sacrés du Code* · 5 classe(s).

> Trois états dans une facette, jamais deux : un chiffre (la valeur), « - » (la facette ne s'applique pas — un fichier du Socle n'a pas de famille et n'en manque pas), « ? » (la valeur existe mais n'a pas été reconnue). Confondre les deux derniers ferait lire une absence légitime comme un trou.

**Pourquoi un indice plutôt que des icônes** : une icône se reconnaît, elle ne se trie pas, ne se cherche pas et ne se compare pas. Un indice fait les trois. Les deux cohabitent — l'icône pour l'œil, l'indice pour la machine et le tri.

| Facette | Position | Valeurs possibles, dans l'ordre | L'icône de chacune |
|---|---|---|---|
| type | 1 | 0 = crochet · 1 = filet-de-securite · 2 = commande-documentee · 3 = commande-sans-fiche · 4 = bibliotheque-partagee · 5 = bibliotheque-solitaire · 6 = infrastructure-shell · 7 = execution-directe-non-documentee | 🪝 crochet · 🕸️ filet-de-securite · ⌨️ commande-documentee · ❓ commande-sans-fiche · 📚 bibliotheque-partagee · 📕 bibliotheque-solitaire · 🐚 infrastructure-shell · 🔒 execution-directe-non-documentee |
| rang | 2 | 0 = Socle · 1 = Agent Cadre · 2 = Gardien sacré du code · 3 = Membre classique · 4 = Membre premium · 5 = Postulant · 6 = Sans fiche · 7 = Sans porte · 8 = Émetteur de rapport · 9 = Hors Agence | 🧱 Socle · 👔 Agent Cadre · 🛡️ Gardien sacré du code · 🥈 Membre classique · 🥇 Membre premium · 🚪 Postulant · 🏷️ Sans fiche · 🕳️ Sans porte · 📝 Émetteur de rapport · 🚧 Hors Agence |
| famille | 3 | 0 = La Suite Tarantino · 1 = La Gouvernance Royale · 2 = Les Anges de la coordination · 3 = Les Prophètes · 4 = Les Agents Externes · 5 = Les Boosters de Navigation · 6 = Les Hors Agence · 7 = Les Gardiens Sacrés du Code | 🎬 La Suite Tarantino · 👑 La Gouvernance Royale · 👼 Les Anges de la coordination · 📜 Les Prophètes · 🕵️ Les Agents Externes · 🚀 Les Boosters de Navigation · 🚧 Les Hors Agence · 🛡️ Les Gardiens Sacrés du Code |
| classes | 4 | bit 0 = Les scanners · bit 1 = Les rapporteurs HTML · bit 2 = Les enregistreurs · bit 3 = Les consommateurs d'API · bit 4 = Les évolutifs · bit 5 = Les heuristiques · bit 6 = Les pro-actifs · bit 7 = Les auto-conscients · bit 8 = Les véridiques | 🔎 Les scanners · 📄 Les rapporteurs HTML · 🗃️ Les enregistreurs · 💳 Les consommateurs d'API · 🌱 Les évolutifs · ⚠️ Les heuristiques · 🎯 Les pro-actifs · 🪞 Les auto-conscients · 🧭 Les véridiques |

> **La colonne de droite est la traduction demandée le 2026-09-26.** Elle n'est recopiée nulle part : l'icône d'une famille et celle d'une classe se LISENT dans le nom que l'utilisateur leur a donné le même jour, et seuls les types ont reçu la leur ici — parce qu'un type est un constat de forme, jamais un nom choisi. Une série d'icônes se reconnaît sans décoder ; un indice se trie, se cherche et se compare. Les deux disent la même chose et voyagent ensemble.

## 5. Chaque fichier : rang, famille, indice (88, exhaustif)

### 👔 Agent Cadre — 1

| Fichier | Famille | Indice | En icônes |
|---|---|---|---|
| `cassandra-rh.mjs` | (f) 👑 La Gouvernance Royale | `2.1.1.dz` | ⌨️ 👔 👑 🔎📄🗃️🌱⚠️🎯🪞🧭 |

### 🛡️ Gardien sacré du code — 7

| Fichier | Famille | Indice | En icônes |
|---|---|---|---|
| `always-new-code.mjs` | (f) 🛡️ Les Gardiens Sacrés du Code | `2.2.7.ds` | ⌨️ 🛡️ 🛡️ 🌱⚠️🎯🪞🧭 |
| `axa-check.mjs` | (f) 🛡️ Les Gardiens Sacrés du Code | `2.2.7.dh` | ⌨️ 🛡️ 🛡️ 🔎🗃️⚠️🎯🪞🧭 |
| `check-argus.mjs` | (f) 🛡️ Les Gardiens Sacrés du Code | `2.2.7.dh` | ⌨️ 🛡️ 🛡️ 🔎🗃️⚠️🎯🪞🧭 |
| `check-harmonia.mjs` | (f) 🛡️ Les Gardiens Sacrés du Code | `2.2.7.dd` | ⌨️ 🛡️ 🛡️ 🔎⚠️🎯🪞🧭 |
| `clean-dirty-old.mjs` | (f) 🛡️ Les Gardiens Sacrés du Code | `2.2.7.68` | ⌨️ 🛡️ 🛡️ ⚠️🎯🪞 |
| `clone-hunter.mjs` | (f) 🛡️ Les Gardiens Sacrés du Code | `4.2.7.69` | 📚 🛡️ 🛡️ 🔎⚠️🎯🪞 |
| `safe-export.mjs` | (f) 🛡️ Les Gardiens Sacrés du Code | `4.2.7.dd` | 📚 🛡️ 🛡️ 🔎⚠️🎯🪞🧭 |

### 🥇 Membre premium — 34

| Fichier | Famille | Indice | En icônes |
|---|---|---|---|
| `abraham-les-references.mjs` | (f) 📜 Les Prophètes - Dette & Structure du code | `2.4.3.dz` | ⌨️ 🥇 📜 🔎📄🗃️🌱⚠️🎯🪞🧭 |
| `agent-des-noms.mjs` | (f) 📜 Les Prophètes - Dette & Structure du code | `2.4.3.dh` | ⌨️ 🥇 📜 🔎🗃️⚠️🎯🪞🧭 |
| `agent-du-temps.mjs` | (f) 👑 La Gouvernance Royale | `2.4.1.dg` | ⌨️ 🥇 👑 🗃️⚠️🎯🪞🧭 |
| `angel-of-ia-process.mjs` | (f) 👼 Les Anges de la coordination | `2.4.2.cl` | ⌨️ 🥇 👼 🔎🗃️🎯🪞🧭 |
| `check-gemini-quota.mjs` | (f) 👑 La Gouvernance Royale | `2.4.1.4o` | ⌨️ 🥇 👑 💳⚠️🪞 |
| `check-level-target.mjs` | (f) 👑 La Gouvernance Royale | `2.4.1.6o` | ⌨️ 🥇 👑 🌱⚠️🎯🪞 |
| `check-spirit.mjs` | (f) 🎬 La Suite Tarantino - Simulation & qualité narrative | `2.4.0.a5` | ⌨️ 🥇 🎬 🔎🗃️💳⚠️🎯🧭 |
| `check-suivi-fidelity.mjs` | (f) 👼 Les Anges de la coordination | `2.4.2.35` | ⌨️ 🥇 👼 🔎🌱⚠️🎯 |
| `check-tasks-details.mjs` | (f) 👼 Les Anges de la coordination | `2.4.2.dz` | ⌨️ 🥇 👼 🔎📄🗃️🌱⚠️🎯🪞🧭 |
| `circle-process-guardian.mjs` | (f) 👼 Les Anges de la coordination | `2.4.2.dt` | ⌨️ 🥇 👼 🔎🌱⚠️🎯🪞🧭 |
| `circle-tasks.mjs` | (f) 👼 Les Anges de la coordination | `2.4.2.c7` | ⌨️ 🥇 👼 🔎📄🗃️🌱⚠️🪞🧭 |
| `data-archangel.mjs` | (f) 👼 Les Anges de la coordination | `2.4.2.cl` | ⌨️ 🥇 👼 🔎🗃️🎯🪞🧭 |
| `ecotoken.mjs` | (f) 👑 La Gouvernance Royale | `2.4.1.dh` | ⌨️ 🥇 👑 🔎🗃️⚠️🎯🪞🧭 |
| `el-professor.mjs` | (f) 🎬 La Suite Tarantino - Simulation & qualité narrative | `2.4.0.dz` | ⌨️ 🥇 🎬 🔎📄🗃️🌱⚠️🎯🪞🧭 |
| `find-booster.mjs` | (f) 🚀 Les Boosters de Navigation | `2.4.5.4g` | ⌨️ 🥇 🚀 ⚠️🪞 |
| `god-of-all-process.mjs` | (f) 👼 Les Anges de la coordination | `2.4.2.c7` | ⌨️ 🥇 👼 🔎📄🗃️🌱⚠️🪞🧭 |
| `hyper-scan-checkpoint.mjs` | (f) 👑 La Gouvernance Royale | `2.4.1.6d` | ⌨️ 🥇 👑 🔎🗃️⚠️🎯🪞 |
| `ines-official.mjs` | (f) 👼 Les Anges de la coordination | `2.4.2.3p` | ⌨️ 🥇 👼 🔎🗃️🪞 |
| `integration-outil.mjs` | (f) 📜 Les Prophètes - Dette & Structure du code | `4.4.3.bl` | 📚 🥇 📜 🔎⚠️🪞🧭 |
| `le-classificateur.mjs` | (f) 👑 La Gouvernance Royale | `2.4.1.dj` | ⌨️ 🥇 👑 🔎📄🗃️⚠️🎯🪞🧭 |
| `memento.mjs` | (f) 🎬 La Suite Tarantino - Simulation & qualité narrative | `4.4.0.ck` | 📚 🥇 🎬 🗃️🎯🪞🧭 |
| `moise-tables-de-loi.mjs` | (f) 📜 Les Prophètes - Dette & Structure du code | `2.4.3.dx` | ⌨️ 🥇 📜 🔎🗃️🌱⚠️🎯🪞🧭 |
| `objectifs-vs-resultats.mjs` | (f) 👑 La Gouvernance Royale | `2.4.1.cg` | ⌨️ 🥇 👑 🎯🪞🧭 |
| `process-simulation-guardian.mjs` | (f) 🎬 La Suite Tarantino - Simulation & qualité narrative | `2.4.0.dt` | ⌨️ 🥇 🎬 🔎🌱⚠️🎯🪞🧭 |
| `pure-gold-unity.mjs` | (f) 👼 Les Anges de la coordination | `4.4.2.br` | 📚 🥇 👼 🔎📄🗃️⚠️🪞🧭 |
| `smart-conso-api.mjs` | (f) 👑 La Gouvernance Royale | `2.4.1.6c` | ⌨️ 🥇 👑 🗃️⚠️🎯🪞 |
| `smart-conso-token.mjs` | (f) 👑 La Gouvernance Royale | `2.4.1.dg` | ⌨️ 🥇 👑 🗃️⚠️🎯🪞🧭 |
| `the-deep-reader.mjs` | (f) 🕵️ Les Agents Externes - Audit indépendant | `5.4.4.2` | 📕 🥇 🕵️ 📄 |
| `the-equalizer.mjs` | (f) 📜 Les Prophètes - Dette & Structure du code | `2.4.3.dd` | ⌨️ 🥇 📜 🔎⚠️🎯🪞🧭 |
| `the-final-judge.mjs` | (f) 🕵️ Les Agents Externes - Audit indépendant | `5.4.4.2` | 📕 🥇 🕵️ 📄 |
| `the-king.mjs` | (f) 👑 La Gouvernance Royale | `2.4.1.dc` | ⌨️ 🥇 👑 ⚠️🎯🪞🧭 |
| `the-screener-capture.mjs` | (f) 🎬 La Suite Tarantino - Simulation & qualité narrative | `2.4.0.4m` | ⌨️ 🥇 🎬 📄🗃️⚠️🪞 |
| `tool-brain.mjs` | (f) 👼 Les Anges de la coordination | `2.4.2.dd` | ⌨️ 🥇 👼 🔎⚠️🎯🪞🧭 |
| `tool-learning.mjs` | (f) 📜 Les Prophètes - Dette & Structure du code | `2.4.3.dh` | ⌨️ 🥇 📜 🔎🗃️⚠️🎯🪞🧭 |

### 🥈 Membre classique — 14

| Fichier | Famille | Indice | En icônes |
|---|---|---|---|
| `check-profil-utilisateur.mjs` | (f) 👼 Les Anges de la coordination | `2.3.2.2p` | ⌨️ 🥈 👼 🔎⚠️🎯 |
| `criticite.mjs` | (f) 👼 Les Anges de la coordination | `2.3.2.7k` | ⌨️ 🥈 👼 🌱🧭 |
| `doc-report.mjs` | (f) 👼 Les Anges de la coordination | `2.3.2.6v` | ⌨️ 🥈 👼 🔎📄🗃️🌱⚠️🎯🪞 |
| `find-brain.mjs` | (f) 🚀 Les Boosters de Navigation | `2.3.5.4g` | ⌨️ 🥈 🚀 ⚠️🪞 |
| `kpi-report.mjs` | (f) 👑 La Gouvernance Royale | `2.3.1.dj` | ⌨️ 🥈 👑 🔎📄🗃️⚠️🎯🪞🧭 |
| `le-coordinateur.mjs` | (f) 👼 Les Anges de la coordination | `2.3.2.bb` | ⌨️ 🥈 👼 🔎📄🗃️🌱🪞🧭 |
| `le-regisseur.mjs` | (f) 🎬 La Suite Tarantino - Simulation & qualité narrative | `2.3.0.dj` | ⌨️ 🥈 🎬 🔎📄🗃️⚠️🎯🪞🧭 |
| `messages-courts.mjs` | (f) 👼 Les Anges de la coordination | `2.3.2.74` | ⌨️ 🥈 👼 🧭 |
| `modes-de-travail.mjs` | (f) 👼 Les Anges de la coordination | `2.3.2.4` | ⌨️ 🥈 👼 🗃️ |
| `ou-on-en-est.mjs` | (f) 👼 Les Anges de la coordination | `2.3.2.87` | ⌨️ 🥈 👼 🔎📄🗃️⚠️🧭 |
| `rapport-gros-prompt.mjs` | (f) 👼 Les Anges de la coordination | `2.3.2.5g` | ⌨️ 🥈 👼 🗃️🎯🪞 |
| `route-booster.mjs` | (f) 🚀 Les Boosters de Navigation | `2.3.5.4g` | ⌨️ 🥈 🚀 ⚠️🪞 |
| `the-ghost.mjs` | (f) 👑 La Gouvernance Royale | `2.3.1.4` | ⌨️ 🥈 👑 🗃️ |
| `tool-usage.mjs` | (f) 👑 La Gouvernance Royale | `2.3.1.as` | ⌨️ 🥈 👑 🗃️🪞🧭 |

### 🚪 Postulant — 1

| Fichier | Famille | Indice | En icônes |
|---|---|---|---|
| `check-profile.mjs` | — | `2.5.-.14` | ⌨️ 🚪 · 💳⚠️ |

### 🕳️ Sans porte — 2

| Fichier | Famille | Indice | En icônes |
|---|---|---|---|
| `install-ci.mjs` | — | `7.7.-.0` | 🔒 🕳️ · — |
| `pnpm-install.mjs` | — | `7.7.-.4` | 🔒 🕳️ · 🗃️ |

### 🧱 Socle — 23

| Fichier | Famille | Indice | En icônes |
|---|---|---|---|
| `api-providers.mjs` | — | `5.0.-.8` | 📕 🧱 · 💳 |
| `build-verified.sh` | — | `6.0.-.0` | 🐚 🧱 · — |
| `check-house.mjs` | — | `1.0.-.dz` | 🕸️ 🧱 · 🔎📄🗃️🌱⚠️🎯🪞🧭 |
| `corpus-mesure.mjs` | — | `4.0.-.74` | 📚 🧱 · 🧭 |
| `execution-profile.mjs` | — | `4.0.-.0` | 📚 🧱 · — |
| `gemini-key-health.mjs` | — | `4.0.-.4` | 📚 🧱 · 🗃️ |
| `hooks/check-last-commit.mjs` | — | `0.0.-.1` | 🪝 🧱 · 🔎 |
| `hooks/install.mjs` | — | `0.0.-.0` | 🪝 🧱 · — |
| `hooks/post-commit` | — | `0.0.-.0` | 🪝 🧱 · — |
| `hooks/pre-commit` | — | `0.0.-.0` | 🪝 🧱 · — |
| `html-report.mjs` | — | `4.0.-.2` | 📚 🧱 · 📄 |
| `install-ci.sh` | — | `6.0.-.0` | 🐚 🧱 · — |
| `install-pnpm.sh` | — | `6.0.-.0` | 🐚 🧱 · — |
| `judge-persona-shared.mjs` | — | `4.0.-.0` | 📚 🧱 · — |
| `lib-json.mjs` | — | `4.0.-.0` | 📚 🧱 · — |
| `lib-markdown-table.mjs` | — | `4.0.-.0` | 📚 🧱 · — |
| `lib-shell.mjs` | — | `4.0.-.x` | 📚 🧱 · 🔎⚠️ |
| `memento-weight.mjs` | — | `4.0.-.4` | 📚 🧱 · 🗃️ |
| `priorites.mjs` | — | `4.0.-.74` | 📚 🧱 · 🧭 |
| `report-template.mjs` | — | `4.0.-.9y` | 📚 🧱 · 📄🗃️⚠️🎯🧭 |
| `serie-temporelle.mjs` | — | `4.0.-.78` | 📚 🧱 · 🗃️🧭 |
| `simulation-visiteur.mjs` | — | `5.0.-.0` | 📕 🧱 · — |
| `tasks-process-guardian.mjs` | — | `5.0.-.4g` | 📕 🧱 · ⚠️🪞 |

### 🚧 Hors Agence — 6

| Fichier | Famille | Indice | En icônes |
|---|---|---|---|
| `run-framework.mjs` | (f) 🚧 Les Hors Agence - servent le produit, jamais l'outillage | `2.9.6.0` | ⌨️ 🚧 🚧 — |
| `run-simulation.mjs` | (f) 🚧 Les Hors Agence - servent le produit, jamais l'outillage | `2.9.6.4` | ⌨️ 🚧 🚧 🗃️ |
| `sauvegarde-projet.mjs` | (f) 🚧 Les Hors Agence - servent le produit, jamais l'outillage | `2.9.6.5` | ⌨️ 🚧 🚧 🔎🗃️ |
| `sites-env.mjs` | (f) 🚧 Les Hors Agence - servent le produit, jamais l'outillage | `2.9.6.0` | ⌨️ 🚧 🚧 — |
| `sites-env.sh` | (f) 🚧 Les Hors Agence - servent le produit, jamais l'outillage | `6.9.6.0` | 🐚 🚧 🚧 — |
| `summarize-simulation-log.mjs` | (f) 🚧 Les Hors Agence - servent le produit, jamais l'outillage | `2.9.6.w` | ⌨️ 🚧 🚧 ⚠️ |

## 6. Les types de fichier (7 présents sur les 8 du registre, exhaustif)

> `commande-sans-fiche` n'a aucun fichier aujourd'hui, et c'est une bonne nouvelle : lançable, mais nommée par aucun document du dépôt : soit une commande qu'on a oublié de documenter, soit un script jetable qui a survécu. Le type reste déclaré — le retirer ferait disparaître le jour où un fichier y retombe.

### crochet — 4

> s'exécute automatiquement à un moment de git, jamais appelé à la main

`hooks/check-last-commit.mjs` · `hooks/install.mjs` · `hooks/post-commit` · `hooks/pre-commit`

### filet-de-securite — 1

> la suite de tests elle-même — ce que le crochet lance et qui peut refuser un commit

`check-house.mjs`

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

### execution-directe-non-documentee — 2

> personne ne l'importe et aucune commande de lancement n'est écrite nulle part : il ne peut être lancé qu'à la main, par quelqu'un qui sait déjà

`install-ci.mjs` · `pnpm-install.mjs`

## 6bis. « Bibliothèque », est-ce normal ? — la vérification, pas l'avis

Un fichier est rangé en **bibliothèque** quand la mesure ne trouve **aucune porte d'entrée écrite** et qu'au moins un autre fichier l'importe. C'est un CONSTAT de forme, jamais un jugement de valeur : deux Gardiens sacrés (`clone-hunter`, `safe-export`) sont des bibliothèques et restent Gardiens sacrés, parce que **le rang mérité l'emporte toujours sur le type**.

Mais le constat cache une vraie question : **un fichier peut porter une porte dans son code sans que personne ne l'ait écrite nulle part.** Celui-là n'est pas une bibliothèque — c'est une commande que personne ne peut lancer parce que personne ne sait qu'elle existe. La mesure ci-dessous sépare les deux.

| Fichier | Type constaté | Une porte dans le code ? | Qui le lance vraiment | Verdict |
|---|---|---|---|---|
| `api-providers.mjs` | bibliotheque-solitaire | non | — | vraie bibliothèque |
| `clone-hunter.mjs` | bibliotheque-partagee | oui — un `main()` | `scripts/hyper-scan-checkpoint.mjs` | porte réelle, atteinte par du code ou un document normatif — simplement jamais écrite comme commande |
| `corpus-mesure.mjs` | bibliotheque-partagee | non | — | vraie bibliothèque |
| `execution-profile.mjs` | bibliotheque-partagee | non | — | vraie bibliothèque |
| `gemini-key-health.mjs` | bibliotheque-partagee | non | — | vraie bibliothèque |
| `html-report.mjs` | bibliotheque-partagee | non | — | vraie bibliothèque |
| `integration-outil.mjs` | bibliotheque-partagee | oui — un `main()` | — | PORTE ORPHELINE : rien de vivant ne le lance — seules des archives gardent la trace d'un passage passé |
| `judge-persona-shared.mjs` | bibliotheque-partagee | non | — | vraie bibliothèque |
| `lib-json.mjs` | bibliotheque-partagee | non | — | vraie bibliothèque |
| `lib-markdown-table.mjs` | bibliotheque-partagee | non | — | vraie bibliothèque |
| `lib-shell.mjs` | bibliotheque-partagee | non | — | vraie bibliothèque |
| `memento-weight.mjs` | bibliotheque-partagee | non | — | vraie bibliothèque |
| `memento.mjs` | bibliotheque-partagee | oui — un `main()` | `scripts/check-house.mjs` | porte réelle, atteinte par du code ou un document normatif — simplement jamais écrite comme commande |
| `priorites.mjs` | bibliotheque-partagee | non | — | vraie bibliothèque |
| `pure-gold-unity.mjs` | bibliotheque-partagee | oui — un `main()` | `scripts/circle-tasks.mjs` | porte réelle, atteinte par du code ou un document normatif — simplement jamais écrite comme commande |
| `report-template.mjs` | bibliotheque-partagee | non | — | vraie bibliothèque |
| `safe-export.mjs` | bibliotheque-partagee | oui — un `main()` | `scripts/hyper-scan-checkpoint.mjs` | porte réelle, atteinte par du code ou un document normatif — simplement jamais écrite comme commande |
| `serie-temporelle.mjs` | bibliotheque-partagee | non | — | vraie bibliothèque |
| `simulation-visiteur.mjs` | bibliotheque-solitaire | non | — | vraie bibliothèque |
| `tasks-process-guardian.mjs` | bibliotheque-solitaire | oui — un `main()` | — | PORTE ORPHELINE : le fichier est lançable et rien au monde ne le lance |
| `the-deep-reader.mjs` | bibliotheque-solitaire | non | — | vraie bibliothèque |
| `the-final-judge.mjs` | bibliotheque-solitaire | non | — | vraie bibliothèque |

> **À RETENIR** — 16 sur 22 sont de VRAIES bibliothèques : le type est juste, il n'y a rien à corriger. 6 portent une porte que la documentation n'écrit pas, et sur ces 6, **2 n'ont strictement rien qui les lance** : `integration-outil.mjs` · `tasks-process-guardian.mjs`.

> La sonde a été resserrée avant sa première livraison : sa première version cherchait `import.meta.url` tout court et accusait à tort cinq fichiers qui s'en servent pour calculer un CHEMIN. Un garde qui accuse à tort cesse d'être lu (leçon L4) — et celui-ci aurait répondu faux à la question même qui l'a fait naître.

## 7. Les familles (8, exhaustif)

Une famille dit **ce sur quoi on travaille**, jamais ce qu'on vaut. Les Gardiens sacrés ont désormais la leur, sur décision de l'utilisateur : le nom répète leur rang, et c'est assumé — une famille explicitement redondante se lit mieux qu'un troisième nom pour la même chose, et c'est l'endroit où on les cherche quand on ouvre l'organigramme. **Les Hors Agence ont reçu la leur le 2026-09-26, sur le même principe et pour une raison mesurée** : la famille était le seul axe qui ne couvrait pas tout le dépôt, et six fichiers sortaient avec une case vide — or une case vide ne dit jamais si personne n'a rempli ou si rien n'était à remplir. Deux interdits vont avec ce rang, et ils ne sont pas symétriques d'un manque de mérite : ces fichiers **ne peuvent pas évoluer**, et **aucun outil de l'Agence ne peut les rejoindre** — on n'est pas hors Agence parce qu'on a démérité, mais parce qu'on sert le produit.

**(f) 🎬 La Suite Tarantino - Simulation & qualité narrative** — 6 : `check-spirit` · `el-professor` · `le-regisseur` · `memory-audit` · `process-simulation-guardian` · `the-screener`

**(f) 👑 La Gouvernance Royale** — 14 : `agent-du-temps` · `cassandra-rh` · `check-level-target` · `ecotoken` · `hyper-scan-checkpoint` · `kpi-report` · `le-classificateur` · `objectifs-vs-resultats` · `smart-breaker` · `smart-conso-api` · `smart-conso-token` · `the-ghost` · `the-king` · `tool-usage`

**(f) 👼 Les Anges de la coordination** — 18 : `angel-of-ia-process` · `check-profil-utilisateur` · `check-suivi-fidelity` · `check-tasks-details` · `circle-process-guardian` · `circle-tasks` · `criticite` · `data-archangel` · `doc-report` · `god-of-all-process` · `ines-official` · `le-coordinateur` · `messages-courts` · `modes-de-travail` · `ou-on-en-est` · `pure-gold-unity` · `rapport-gros-prompt` · `tool-brain`

**(f) 📜 Les Prophètes - Dette & Structure du code** — 6 : `abraham-les-references` · `agent-des-noms` · `integration-outil` · `moise-tables-de-loi` · `the-equalizer` · `tool-learning`

**(f) 🕵️ Les Agents Externes - Audit indépendant** — 2 : `the-deep-reader` · `the-final-judge`

**(f) 🚀 Les Boosters de Navigation** — 4 : `find-booster` · `find-brain` · `find-deep-booster` · `route-booster`

**(f) 🚧 Les Hors Agence - servent le produit, jamais l'outillage** — 6 : `run-framework` · `run-simulation` · `sauvegarde-projet` · `sites-env` · `sites-env` · `summarize-simulation-log`

**(f) 🛡️ Les Gardiens Sacrés du Code** — 7 : `always-new-code` · `argus` · `axa-check` · `clean-dirty-old` · `clone-hunter` · `harmonia` · `safe-export`

## 8. Les classes transverses (9, exhaustif)

Une classe dit **ce qu'un fichier sait faire**. Elle se cumule librement et traverse les rangs : un Gardien sacré et une bibliothèque peuvent porter la même.

### (ct) 🔎 Les scanners - scanne le dépôt — 38

> parcourt des fichiers pour y chercher quelque chose — la classe que l'utilisateur a nommée lui-même

`abraham-les-references.mjs` · `agent-des-noms.mjs` · `angel-of-ia-process.mjs` · `axa-check.mjs` · `cassandra-rh.mjs` · `check-argus.mjs` · `check-harmonia.mjs` · `check-house.mjs` · `check-profil-utilisateur.mjs` · `check-spirit.mjs` · `check-suivi-fidelity.mjs` · `check-tasks-details.mjs` · `circle-process-guardian.mjs` · `circle-tasks.mjs` · `clone-hunter.mjs` · `data-archangel.mjs` · `doc-report.mjs` · `ecotoken.mjs` · `el-professor.mjs` · `god-of-all-process.mjs` · `hooks/check-last-commit.mjs` · `hyper-scan-checkpoint.mjs` · `ines-official.mjs` · `integration-outil.mjs` · `kpi-report.mjs` · `le-classificateur.mjs` · `le-coordinateur.mjs` · `le-regisseur.mjs` · `lib-shell.mjs` · `moise-tables-de-loi.mjs` · `ou-on-en-est.mjs` · `process-simulation-guardian.mjs` · `pure-gold-unity.mjs` · `safe-export.mjs` · `sauvegarde-projet.mjs` · `the-equalizer.mjs` · `tool-brain.mjs` · `tool-learning.mjs`

### (ct) 📄 Les rapporteurs HTML - rend un rapport HTML — 19

> produit une page, donc quelque chose que l'utilisateur LIT vraiment

`abraham-les-references.mjs` · `cassandra-rh.mjs` · `check-house.mjs` · `check-tasks-details.mjs` · `circle-tasks.mjs` · `doc-report.mjs` · `el-professor.mjs` · `god-of-all-process.mjs` · `html-report.mjs` · `kpi-report.mjs` · `le-classificateur.mjs` · `le-coordinateur.mjs` · `le-regisseur.mjs` · `ou-on-en-est.mjs` · `pure-gold-unity.mjs` · `report-template.mjs` · `the-deep-reader.mjs` · `the-final-judge.mjs` · `the-screener-capture.mjs`

### (ct) 🗃️ Les enregistreurs - tient un registre — 41

> écrit une mémoire durable sur le disque — ce qui lui permet de se souvenir d'un passage à l'autre

`abraham-les-references.mjs` · `agent-des-noms.mjs` · `agent-du-temps.mjs` · `angel-of-ia-process.mjs` · `axa-check.mjs` · `cassandra-rh.mjs` · `check-argus.mjs` · `check-house.mjs` · `check-spirit.mjs` · `check-tasks-details.mjs` · `circle-tasks.mjs` · `data-archangel.mjs` · `doc-report.mjs` · `ecotoken.mjs` · `el-professor.mjs` · `gemini-key-health.mjs` · `god-of-all-process.mjs` · `hyper-scan-checkpoint.mjs` · `ines-official.mjs` · `kpi-report.mjs` · `le-classificateur.mjs` · `le-coordinateur.mjs` · `le-regisseur.mjs` · `memento-weight.mjs` · `memento.mjs` · `modes-de-travail.mjs` · `moise-tables-de-loi.mjs` · `ou-on-en-est.mjs` · `pnpm-install.mjs` · `pure-gold-unity.mjs` · `rapport-gros-prompt.mjs` · `report-template.mjs` · `run-simulation.mjs` · `sauvegarde-projet.mjs` · `serie-temporelle.mjs` · `smart-conso-api.mjs` · `smart-conso-token.mjs` · `the-ghost.mjs` · `the-screener-capture.mjs` · `tool-learning.mjs` · `tool-usage.mjs`

### (ct) 💳 Les consommateurs d'API - coûte de vrais appels API — 4

> consulte un modèle ou un service distant PAYANT : jamais lancé sans passer par Smart Conso API (Article 22)

`api-providers.mjs` · `check-gemini-quota.mjs` · `check-profile.mjs` · `check-spirit.mjs`

### (ct) 🌱 Les évolutifs - porte un garde-fou d'évolutivité — 16

> contient une fonction qui refuse une liste recopiée à la main : elle compare une copie à sa source et crie quand les deux divergent (Article 24). C'est ce qui permet à un registre de grossir sans qu'une copie oubliée se périme en silence.

`abraham-les-references.mjs` · `always-new-code.mjs` · `cassandra-rh.mjs` · `check-house.mjs` · `check-level-target.mjs` · `check-suivi-fidelity.mjs` · `check-tasks-details.mjs` · `circle-process-guardian.mjs` · `circle-tasks.mjs` · `criticite.mjs` · `doc-report.mjs` · `el-professor.mjs` · `god-of-all-process.mjs` · `le-coordinateur.mjs` · `moise-tables-de-loi.mjs` · `process-simulation-guardian.mjs`

### (ct) ⚠️ Les heuristiques - déclare sa marge d'erreur — 48

> avertit qu'il peut se tromper avant de rendre un chiffre — l'exigence transverse de tous les outils heuristiques

`abraham-les-references.mjs` · `agent-des-noms.mjs` · `agent-du-temps.mjs` · `always-new-code.mjs` · `axa-check.mjs` · `cassandra-rh.mjs` · `check-argus.mjs` · `check-gemini-quota.mjs` · `check-harmonia.mjs` · `check-house.mjs` · `check-level-target.mjs` · `check-profil-utilisateur.mjs` · `check-profile.mjs` · `check-spirit.mjs` · `check-suivi-fidelity.mjs` · `check-tasks-details.mjs` · `circle-process-guardian.mjs` · `circle-tasks.mjs` · `clean-dirty-old.mjs` · `clone-hunter.mjs` · `doc-report.mjs` · `ecotoken.mjs` · `el-professor.mjs` · `find-booster.mjs` · `find-brain.mjs` · `god-of-all-process.mjs` · `hyper-scan-checkpoint.mjs` · `integration-outil.mjs` · `kpi-report.mjs` · `le-classificateur.mjs` · `le-regisseur.mjs` · `lib-shell.mjs` · `moise-tables-de-loi.mjs` · `ou-on-en-est.mjs` · `process-simulation-guardian.mjs` · `pure-gold-unity.mjs` · `report-template.mjs` · `route-booster.mjs` · `safe-export.mjs` · `smart-conso-api.mjs` · `smart-conso-token.mjs` · `summarize-simulation-log.mjs` · `tasks-process-guardian.mjs` · `the-equalizer.mjs` · `the-king.mjs` · `the-screener-capture.mjs` · `tool-brain.mjs` · `tool-learning.mjs`

### (ct) 🎯 Les pro-actifs - conclut par un plan d'action — 39

> transforme ses constats en gestes (Article 28) au lieu de s'arrêter au rapport

`abraham-les-references.mjs` · `agent-des-noms.mjs` · `agent-du-temps.mjs` · `always-new-code.mjs` · `angel-of-ia-process.mjs` · `axa-check.mjs` · `cassandra-rh.mjs` · `check-argus.mjs` · `check-harmonia.mjs` · `check-house.mjs` · `check-level-target.mjs` · `check-profil-utilisateur.mjs` · `check-spirit.mjs` · `check-suivi-fidelity.mjs` · `check-tasks-details.mjs` · `circle-process-guardian.mjs` · `clean-dirty-old.mjs` · `clone-hunter.mjs` · `data-archangel.mjs` · `doc-report.mjs` · `ecotoken.mjs` · `el-professor.mjs` · `hyper-scan-checkpoint.mjs` · `kpi-report.mjs` · `le-classificateur.mjs` · `le-regisseur.mjs` · `memento.mjs` · `moise-tables-de-loi.mjs` · `objectifs-vs-resultats.mjs` · `process-simulation-guardian.mjs` · `rapport-gros-prompt.mjs` · `report-template.mjs` · `safe-export.mjs` · `smart-conso-api.mjs` · `smart-conso-token.mjs` · `the-equalizer.mjs` · `the-king.mjs` · `tool-brain.mjs` · `tool-learning.mjs`

### (ct) 🪞 Les auto-conscients - enregistre son propre usage — 48

> sait dire s'il a servi — sans quoi personne ne peut constater qu'un outil n'est jamais sollicité

`abraham-les-references.mjs` · `agent-des-noms.mjs` · `agent-du-temps.mjs` · `always-new-code.mjs` · `angel-of-ia-process.mjs` · `axa-check.mjs` · `cassandra-rh.mjs` · `check-argus.mjs` · `check-gemini-quota.mjs` · `check-harmonia.mjs` · `check-house.mjs` · `check-level-target.mjs` · `check-tasks-details.mjs` · `circle-process-guardian.mjs` · `circle-tasks.mjs` · `clean-dirty-old.mjs` · `clone-hunter.mjs` · `data-archangel.mjs` · `doc-report.mjs` · `ecotoken.mjs` · `el-professor.mjs` · `find-booster.mjs` · `find-brain.mjs` · `god-of-all-process.mjs` · `hyper-scan-checkpoint.mjs` · `ines-official.mjs` · `integration-outil.mjs` · `kpi-report.mjs` · `le-classificateur.mjs` · `le-coordinateur.mjs` · `le-regisseur.mjs` · `memento.mjs` · `moise-tables-de-loi.mjs` · `objectifs-vs-resultats.mjs` · `process-simulation-guardian.mjs` · `pure-gold-unity.mjs` · `rapport-gros-prompt.mjs` · `route-booster.mjs` · `safe-export.mjs` · `smart-conso-api.mjs` · `smart-conso-token.mjs` · `tasks-process-guardian.mjs` · `the-equalizer.mjs` · `the-king.mjs` · `the-screener-capture.mjs` · `tool-brain.mjs` · `tool-learning.mjs` · `tool-usage.mjs`

### (ct) 🧭 Les véridiques - sait répondre « pas mesuré » — 42

> distingue « je n'ai rien trouvé » de « je n'ai pas pu regarder » (leçon L5) — la classe la plus discrète et la plus importante

`abraham-les-references.mjs` · `agent-des-noms.mjs` · `agent-du-temps.mjs` · `always-new-code.mjs` · `angel-of-ia-process.mjs` · `axa-check.mjs` · `cassandra-rh.mjs` · `check-argus.mjs` · `check-harmonia.mjs` · `check-house.mjs` · `check-spirit.mjs` · `check-tasks-details.mjs` · `circle-process-guardian.mjs` · `circle-tasks.mjs` · `corpus-mesure.mjs` · `criticite.mjs` · `data-archangel.mjs` · `ecotoken.mjs` · `el-professor.mjs` · `god-of-all-process.mjs` · `integration-outil.mjs` · `kpi-report.mjs` · `le-classificateur.mjs` · `le-coordinateur.mjs` · `le-regisseur.mjs` · `memento.mjs` · `messages-courts.mjs` · `moise-tables-de-loi.mjs` · `objectifs-vs-resultats.mjs` · `ou-on-en-est.mjs` · `priorites.mjs` · `process-simulation-guardian.mjs` · `pure-gold-unity.mjs` · `report-template.mjs` · `safe-export.mjs` · `serie-temporelle.mjs` · `smart-conso-token.mjs` · `the-equalizer.mjs` · `the-king.mjs` · `tool-brain.mjs` · `tool-learning.mjs` · `tool-usage.mjs`

## 9. Ce qui reste ouvert — et le geste que chaque point appelle

| Ce qui reste ouvert | Pourquoi c'en est un | Le geste |
|---|---|---|
| **1 fichier est Postulant** — `check-profile.mjs` | documenté et lançable, mais absent du registre de l'équipe | l'inscrire au registre, ou déclarer par écrit qu'il n'a pas vocation à entrer |
| **2 portes orphelines** — `integration-outil.mjs` · `tasks-process-guardian.mjs` | le fichier est lançable et rien de vivant dans le dépôt ne le lance | lui écrire sa commande dans la table maîtresse, ou le supprimer |
| **1 membre du registre n'a pas de fichier à lui** — `find-deep-booster` | il porte un rang et une famille, mais son code vit à l'intérieur d'un autre fichier | rien d'urgent : le noter ici suffit, tant que l'addition du §1 le dit au lieu de le masquer |
| **4 rangs portent un nom provisoire** — 🚪 Postulant · 🏷️ Sans fiche · 🕳️ Sans porte · 📝 Émetteur de rapport | l'agent les a nommés faute de mieux, et c'est l'utilisateur qui nomme | les trancher dans la fournée de nommage (tâche #200) |
| **Le référentiel et le code ne déclarent pas le même nombre d'axes** | le référentiel déclare 2 axe(s), le code en publie 8 (iceberg, type, moment, domaine, destinataire, cherche, rang, famille) — la prose se rédige à la main, mais elle ne peut plus s'écarter en silence | réécrire à la main le §1 de `docs/referentiel/organisation-agence.md` — la prose est humaine, seul l'écart est mécanique |

> Chaque ligne porte son geste, jamais seulement son constat (Article 28) : un rapport qui s'arrête au constat ressemble à un problème traité, et c'est exactement ce qui rend l'oubli invisible.

