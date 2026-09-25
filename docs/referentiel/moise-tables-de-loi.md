# MOÏSE-TABLES-DE-LOI — instanciation sur ce projet

*(Blueprint générique : `docs/moise-tables-de-loi-blueprint.md`. Script :
`scripts/moise-tables-de-loi.mjs`. Registre : `docs/moise-tables-de-loi/index.md`. Créé le
2026-09-23, tâche #613.)*

## Sa vocation, dans les mots de l'utilisateur

« Je veux que tu crées un outil dédié […] Cet agent outil appelle les autres outils dont il a
besoin pour fonctionner. Il centralise pour les opérations propres à claude.md. Il est dédié à ce
qui est UNIQUEMENT DÉDIÉ à Claude.md : pas de chevauchement. Ce qui peut être utile de manière
générale est destiné à d'autres agents existants. »

Et, dans le même échange : « cet agent est aussi le responsable de la maintenance de claude.md et
de garder la mémoire des opérations réalisées sur claude.md », « une mémoire (pour l'exploiter :
ex : comment nous avons fait la dernière fois ?) utile et exploitée (pas une mémoire pour le
plaisir) », « les docs sont pour toi, pas pour moi. Moi j'ai besoin d'avoir une vision résumée,
stratégique sur les points sensibles », « vérifie que Moïse t'aide à faire un diagnostic complet et
utile : ça fait partie de son boulot ! ».

## Son nom, et pourquoi le premier a été refusé

Il s'est d'abord appelé d'après un modèle d'IA précis. L'utilisateur l'a refusé en deux mots :
**« pas exportable »**. La remarque était juste et dépasse le nom : l'Agence Codex existe pour
partir vers un autre projet (SAFE-EXPORT, Article 27), et un outil baptisé d'après un fournisseur
ne peut pas voyager. « Moïse-tables-de-loi » nomme la FONCTION — celui qui porte les tables de la
loi — et reste vrai sur n'importe quel projet ayant une charte.

Les documents qu'il produit suivent la même règle : `charte-cartographie.md`,
`charte-operations.md`. Seul `claude-md-regles.md` garde son nom historique, parce qu'il existait
avant et que le renommer casserait des renvois pour un gain nul.

## La frontière avec les outils voisins — le sujet central

| Outil | Sa question | Pourquoi ce n'est pas celle de Moïse |
|---|---|---|
| **ecotoken** | combien coûte un document rechargé à chaque message ? | générique : vraie pour `CLAUDE.md` comme pour n'importe quel document toujours chargé |
| **SMART-CONSO-TOKEN** | cette action coûteuse vaut-elle ses tokens ? | générique : ne parle pas de la charte, mais de mon rythme |
| **THE-KING** | cette décision respecte-t-elle la philosophie du projet ? | autre document, autre question |
| **SAFE-EXPORT** | le vocabulaire des documents normatifs est-il non ambigu ? | porte sur TOUS les documents normatifs, pas sur la charte seule |
| **Moïse** | cette RÈGLE-CI : que pèse-t-elle, qui la tient, qu'a-t-on déjà tenté dessus ? | ne vaut que pour la charte — donc son périmètre, et le sien seul |

**Ce qui a réellement migré le 2026-09-23** : les sept fonctions de CHARTER-SPY (`extractRuleUnits`,
`countArticleCrossReferences`, `classifyRuleSensitivity`, `classifyRuleImportance`,
`findRedundantRulePairs`, `buildClaudeMdRuleTable`, `renderClaudeMdRuleTable`) vivaient dans
`scripts/smart-conso-token.mjs`. Elles ont été **déplacées telles quelles**, commentaires de
calibrage compris — jamais réécrites : un déplacement ne peut rien casser au passage, une
réécriture le peut. Leurs tests n'ont pas changé d'une assertion, et c'est la preuve.

**Le cycle d'import évité, et c'est un choix documenté** : ecotoken a besoin de
`buildClaudeMdRuleTable` (propre à la charte, donc ici) et Moïse a besoin du compteur d'obligations
d'ecotoken (générique, donc là-bas). Un import statique dans les deux sens créerait un cycle. Node
le tolère tant que l'usage est dans une fonction, mais un cycle toléré est une dette qui explose au
premier déplacement de ligne. Le compteur est donc **injecté par l'appelant**
(`mesurerObligations`) — ce qui rend en prime `buildCartographie()` testable sans disque ni autre
outil.

## Ce qu'il apporte, avec la preuve de besoin de chaque capacité

Les six capacités sont exactement les gestes que j'ai dû faire à la main, en scripts jetables, pour
produire le plan d'attaque du 2026-09-23.

1. **`mesurerArticles()`** — poids, citations, et surtout le PORTEUR. Obtenu ce jour-là par soixante
   `grep` successifs.
2. **`porteursDeclares()`** — les trois états. **Première version fausse, et la trouvaille vaut
   d'être gardée** : « cet Article est-il cité par du code ? » répondait *oui* pour les TRENTE
   Articles, parce que ce projet cite abondamment « Article N » dans ses commentaires. Une mention
   n'est pas un mécanisme. La mesure honnête demande à l'Article de NOMMER son porteur, puis vérifie
   que ce porteur existe. Résultat réel au premier passage : **8 Articles portés, 22 sans porteur,
   0 fantôme**.
3. **`natureProposee()`** — les quatre natures. Proposition mécanique, décision humaine, et la
   décision survit à la régénération (`naturesDejaDecidees()`).
4. **`verifierDocumentDAccueil()`** — le verrou n°4 du plan d'attaque, rendu mécanique. Preuve de
   besoin immédiate : la plus grosse proposition d'allègement encore au catalogue d'ecotoken
   (2 914 tokens) renvoie vers un document **inexistant**, et rien ne le disait.
5. **`findArticlesAbsentsDeLaTable()` / `cartographiePerimee()`** — les deux garde-fous gratuits.
   Preuve de besoin constatée le jour même : `claude-md-regles.md`, la table servant à décider quoi
   alléger, datait du 2026-09-20 et **s'arrêtait à l'Article 23** — six Articles, dont trois des dix
   plus lourds, invisibles à l'instrument.
6. **`mesurerSections()`** — ajouté après le PREMIER vrai passage du diagnostic (Article 25), qui
   annonçait « INVENTAIRE : aucun Article ». C'était exact et trompeur : les deux plus gros
   inventaires de la charte ne sont pas des Articles mais des sections de niveau deux. Le diagnostic
   déclare désormais sa couverture réelle — **59 % du document vit dans les Articles**.

## La mémoire

`docs/referentiel/charte-operations.md`, au grain de l'ARTICLE TOUCHÉ (calibrage explicite).
Amorcée le 2026-09-23 avec **quatre opérations reconstituées** depuis les tâches #122, #162, #171 et
le registre ecotoken — chacune déclarant « RECONSTITUÉ » dans sa raison, parce que reconstituer est
légitime et faire passer une reconstitution pour un enregistrement ne l'est pas.

`commentOnAFaitLaDerniereFois(article)` est la fonction qui rend cette mémoire exploitable plutôt
que décorative : elle remonte l'historique de CET Article et met en évidence les opérations
**annulées**, qui sont l'information la plus chère du registre.

## La PERTINENCE et la LOGIQUE — et la ligne rouge qui les encadre

*(Ajoutées le 2026-09-23 après une question directe de l'utilisateur : « est-ce que l'outil Moïse
est bien capable de détecter si un article n'a rien à faire ici ou s'il n'est pas utile ? [...]
est-ce que Moïse analyse la pertinence ? la logique ? ». **La réponse honnête était non**, et
c'est ce qui a motivé cette partie.)*

Moïse mesurait un poids, des citations, un porteur, une nature. **Aucune de ces quatre mesures ne
dit si une règle MÉRITE d'être là**, ni si deux règles se contredisent. Un outil qui dit tout du
COMBIEN et rien du POURQUOI laisse la seule question qui compte à la mémoire de l'agent — donc
perdue à la session suivante (Article 27).

**LA LIGNE ROUGE, posée par l'utilisateur dans la même phrase** : « sur ce type de choix, toujours
me consulter, process ». Elle n'est pas une précaution de style, elle est **écrite dans le code** :
`etat` ne prend qu'une seule valeur, « à trancher », et chaque signal est formulé comme une
QUESTION. L'outil n'a aucun vocabulaire pour conclure. Un outil capable d'écrire « cet Article est
inutile » verrait un jour ce jugement appliqué sans que personne ne l'ait porté.

**Cinq signaux nommés plutôt qu'un score** — un score agrège, donc il cache ; cinq signaux séparés
laissent voir POURQUOI la question se pose :

| Signal | La question qu'il ouvre |
|---|---|
| jamais cité | est-ce que quelque chose s'appuie réellement sur cette règle ? |
| long sans porteur | une règle que rien ne fait respecter et que personne ne relit tient-elle debout ? |
| sans obligation | est-ce une règle, ou une explication rangée au mauvais endroit ? |
| porteur fantôme | la règle annonce-t-elle une protection qui n'existe pas ? |
| poids sans retour | ce que ça coûte à chaque message est-il en rapport avec ce que ça rend ? |

Le seuil du dernier se **DÉRIVE** de la charte elle-même (la médiane des rendements divisée par
trois), jamais écrit en dur : un seuil recopié cesserait d'être vrai au premier Article ajouté
(Article 24). **L'Article 0 est exclu de toute analyse de pertinence**, quels que soient ses
chiffres.

**Côté LOGIQUE** : `findRecouvrementsNonDeclares()`. Le recouvrement de vocabulaire seul est un
signal faible — cette charte contient plusieurs paires qui déclarent explicitement leur frontière
(« Frontière avec l'Article 8 », « Distinct de ses voisins »). Ce qui mérite une question, c'est un
recouvrement fort **ET** aucune frontière écrite : là, deux règles gouvernent le même terrain sans
que rien ne dise laquelle prime.

**Premier passage réel** : 8 Articles ouvrent une question, aucun n'en cumule deux, et zéro
recouvrement non déclaré. Un résultat honnête et plutôt rassurant — la charte est plus saine que
lourde.

## Ses cinq sorties

| Commande | Pour qui | Ce qu'elle rend |
|---|---|---|
| `node scripts/moise-tables-de-loi.mjs` | l'agent, à chaque commit | les deux garde-fous de fraîcheur + plan d'action |
| `… diagnostic` | l'agent | le diagnostic complet : natures, porteurs, hors-Articles, mémoire, gain borné, redondances |
| `… cartographie` | l'agent | régénère `charte-cartographie.md` |
| `… memoire [article]` | l'agent | « comment on a fait la dernière fois ? » |
| `… synthese` | **l'utilisateur** | les points sensibles, et eux seuls |
| `… process` | l'agent | l'état des dix étapes du process |

## Ce qu'il ne fait jamais

Il ne modifie pas la charte (classée MAITRE par tool-brain, score 12, citée par 169 fichiers :
au-delà du risque faible, ça se propose, jamais ça ne s'applique). Il n'écrit ni l'analyse ni le
plan d'action — il rassemble les faits et nomme ce qui appelle une décision. Il ne tranche jamais
une nature. Il ne bloque rien.

## Limites honnêtes

- L'estimation en tokens est une **heuristique** (≈3,6 caractères/token), jamais le tokenizer réel.
- `natureProposee()` est une proposition depuis des signaux mécaniques : elle se trompera, et c'est
  pour ça que la colonne « Statut » existe.
- Le découpage rattache le contenu intercalé entre deux Articles à l'Article **précédent** — limite
  héritée de CHARTER-SPY, assumée et non corrigée.
- `porteursDeclares()` ne reconnaît qu'un porteur nommé en `` `maFonction()` `` ou
  `` `scripts/<nom-du-script>.mjs` `` *(chevrons délibérés : ce sont des exemples de FORME, pas des
  chemins réels — écrits comme des chemins, ils faisaient crier le garde-fou de chemins morts de
  `check-suivi-fidelity.mjs`, seul faux positif sur 1 154 chemins vérifiés le 2026-09-23. La cause
  était dans l'écriture, pas dans le lecteur : la même notation servait pour un vrai chemin et pour
  un espace réservé)*. Un mécanisme réel décrit en prose sans être nommé compte comme
  « sans porteur » : la mesure sous-déclare plutôt qu'elle n'invente, ce qui est la bonne direction
  pour un garde-fou dont tout le capital est d'être cru.

## La veille préventive d'écriture (2026-09-25, tâche #828)

*(Demande de l'utilisateur du 2026-09-21, intervention #514 : « charter spy veille à ce que
**lorsqu'une regle est redigée dans claude.md, elle est toujours redigée de maniere optimisée pour
la conso de token** (smart conso plugged) ». Constat DEEP-READER 5 : seule la moitié existait.)*

**Ce qui existait, et pourquoi ça ne suffisait pas.** `findRedundantRulePairs()`, ecotoken et MOÏSE
mesurent le poids **après coup** — ils ont servi toute la campagne d'allègement de la charte. Mais
ils arrivent quand la règle est déjà écrite, déjà lue à chaque message, et déjà à découper. Ce qu'il
demandait est l'autre bout : un contrôle **au moment où la règle s'écrit**, le seul qui évite le
travail de découpage six semaines plus tard.

**Où elle vit** : dans `protegerLaCharte()`, qui tourne déjà au crochet post-commit dès que
`CLAUDE.md` change (`node scripts/moise-tables-de-loi.mjs protection`). Aucun outil de plus : c'est
exactement le moment où la question se pose, et le mécanisme y était déjà (Article 31 — étendre
avant de construire).

**Ce qu'elle fait** : quand un Article NEUF apparaît, elle compare son poids en tokens à la
**médiane des Articles préexistants** et pose une question au-delà du double.

**Pourquoi un seuil DÉRIVÉ et non choisi** : « 800 tokens, c'est trop » ne veut rien dire dans
l'absolu. « Deux fois la médiane de cette charte-ci » se recalcule à chaque passage et vieillit avec
le document (Article 24). Sous trois Articles préexistants, aucune médiane ne tient : elle répond
**PAS MESURÉ** plutôt que d'inventer un seuil, parce qu'un seuil inventé vaut moins que pas de seuil.

**Pourquoi elle ne BLOQUE jamais, et c'est non négociable.** L'Article 13 pose que « un allègement
de CLAUDE.md ne doit JAMAIS entamer la qualité ou les fonctionnalités du projet » et qu'« en cas de
doute, NE PAS couper ». Un Article long peut être exactement le bon Article. Un contrôle bloquant
pousserait à écrire **court** plutôt qu'à écrire **juste** — l'inverse exact de ce que la charte
protège. La question est posée, la décision reste humaine.

**Ce qu'elle suggère quand elle se déclenche** : relire une fois en se demandant si le récit du
POURQUOI pourrait vivre dans le référentiel (le geste déjà éprouvé de la *progressive disclosure*),
et garder tel quel si la réponse est non. Jamais couper une obligation pour faire du chiffre.
