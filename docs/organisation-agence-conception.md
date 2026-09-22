# Organisation de l'Agence — dossier de conception des évolutions

*(2026-09-22, ouvert sur demande explicite : « mets bien toutes les idées par rapport à
l'organisation dans le fichier dédié, pour ne rien perdre ». Le référentiel canonique de
l'organisation reste `docs/referentiel/organisation-agence.md` — celui-ci accueille les ÉVOLUTIONS
proposées et pas encore actées, pour qu'aucune ne se perde entre sa formulation et sa mise en
œuvre. Applique la règle de restitution de la valeur : sa formulation ET la réponse travaillée.)*

## 1. Le constat qui ouvre le chantier

L'organigramme tient aujourd'hui **deux axes** bien séparés (Statut de documentation ; Rôle dans
l'organigramme). Ils ne suffisent plus, et la preuve est arrivée d'elle-même : les **8 membres du
JURY** construits le 2026-09-22 appartiennent à **quatre rôles différents** et n'ont en commun que
de détenir de la donnée sur l'utilisateur. Les forcer dans les deux axes existants produirait
exactement le mélange de catégories que ce référentiel a été écrit pour empêcher.

## 2. Idée de l'utilisateur — les catégories transverses

> « le fait de me juger est identifié par l'organisation. Les membres qui me jugent sont dans la
> categorie "jury" une categorie transverse. Il y a d'ailleurs pas mal de categories transverses
> identifiées, il faudra vraiment qu'on clarifie l'organisation. Beaucoup d'infos, je compte sur toi
> pour m'aider à s'y retrouver et proposer un schéma d'agence propre et intelligent, pertinent. »

## 3. Idée de l'utilisateur — mémoire et apprentissage comme critères transverses

> « la memoire et l'apprentissage : encore des criteres transverses pour l'organisation
> (potentiellement des flags, des icones) »

Et le principe qui les motive, formulé juste avant :

> « pour tous les agents qui le meritent : veille à ce que tous apprennent par leur experience, mais
> aussi grace à toi. Un peu comme eco-token, tu eduques les outils petit à petit, en plus qu'ils
> s'eduquent eux-mêmes. ceci fait partie du principe d'evolutivité : evolutivité : à la fois pouvoir
> etre exporté, en meme temps avec des capacités accrues grace à l'apprentissage. »

**Ce que cette formulation ajoute, et qui n'était pas dans l'Article 24** : jusqu'ici l'évolutivité
voulait dire « accueillir un membre de plus sans modifier sa propre logique ». Il y ajoute un
second sens, orthogonal : **un outil doit devenir MEILLEUR avec le temps**, par sa propre expérience
et par ce que l'agent lui transmet. Un outil exportable mais figé satisfait la première moitié et
rate la seconde.

## 4. Réponse synthétisée — les axes transverses repérés

Sans enquête exhaustive (elle reste à faire), **six coupes transverses** se repèrent déjà, et aucune
ne coïncide avec les deux axes existants :

| Axe transverse | Ce qu'il regroupe | Pourquoi il est transverse |
|---|---|---|
| **Jury** | les 8 qui détiennent de la donnée sur l'utilisateur | 4 rôles différents, aucun rapport de rang entre eux |
| **Producteurs de rapport** | ceux qui livrent un document lisible | un Gardien et un Utilitaire peuvent tous deux en produire |
| **Automatiques à chaque commit** | les 6 Gardiens sacrés + check-house | c'est un critère de DÉCLENCHEMENT, pas de rang |
| **Coûteux en API** | ceux qui consomment réellement | orthogonal au rôle : un Membre peut coûter, un Agent Cadre non |
| **Gardiens de process** | circle / simulation / tâches / god / angel | ils gardent un DÉROULÉ, pas une qualité de code |
| **Porteurs de garde-fou d'évolutivité** | les 12+ qui détectent une divergence de registre | une capacité, jamais un grade |

**À ajouter, sur sa demande du 2026-09-22** : **mémoire** (l'outil garde-t-il une trace de ses
passages ?) et **apprentissage** (devient-il meilleur ?). Ces deux-là sont différents des six
au-dessus : les six décrivent ce qu'un outil EST ou FAIT, ces deux-là décrivent sa **trajectoire**.
Idée associée de l'utilisateur : les marquer par des **flags ou des icônes** plutôt que par une
septième liste — un signe visible à côté du nom se lit d'un coup d'œil dans un organigramme, là où
une catégorie de plus l'alourdit.

**Distinction à ne pas perdre entre mémoire et apprentissage** : un outil peut très bien avoir une
mémoire sans rien en faire (il écrit son registre et ne le relit jamais), et c'est le cas le plus
fréquent aujourd'hui. Mémoire = il garde une trace. Apprentissage = cette trace change ce qu'il
fait ensuite. Les fusionner ferait passer une dizaine d'outils pour apprenants alors qu'ils ne font
qu'archiver.

## 5. Question ouverte — un agent responsable de l'apprentissage ?

> « est-ce qu'on cree un agent script responsable de l'apprentissage ? utile ou pas ? »

**Réponse à ce stade, à confirmer** : probablement NON comme agent séparé, OUI comme capacité
confiée à un existant. Trois raisons, dans l'ordre de force :
1. **CASSANDRA-RH est déjà l'agent RH** — elle note l'équipe, supervise les badges, propose des
   formations. « Est-ce que ce membre progresse ? » est littéralement une question RH, et la lui
   retirer créerait deux agents qui jugent les mêmes membres sur des axes voisins.
2. **data-archangel porte déjà la circulation** de ce que les outils savent, tendances comprises.
3. Un agent de plus qui surveille les autres sans produire lui-même est exactement le genre
   d'ajout que §7ter interdit — et le paysage en compte déjà beaucoup.

**Ce qui manque vraiment n'est pas un agent, c'est un CRITÈRE mesurable** : qu'est-ce qui prouve
qu'un outil a appris ? Sans réponse à ça, un agent de l'apprentissage produirait un avis, pas une
mesure. À trancher avec l'utilisateur.

## 6. La déduction du 2026-09-22 — le septième axe transverse, et c'est le plus utile

**Constat de départ, posé par l'utilisateur** : « tool-learning semble etre un pont entre cassandra
et safe export. Interessant, qu'est-ce qu'on peut en penser ? en deduire ? »

**Ce n'est pas un pont, et la nuance change tout** : TOOL-LEARNING n'est pas *entre* les deux, il est
**au-dessus des deux, sur un autre axe**.

- CASSANDRA juge l'état de l'équipe **à un instant**.
- SAFE-EXPORT juge la transposabilité du code **à un instant**.
- TOOL-LEARNING est le seul des trois à avoir un **axe de temps** — c'est leur **dérivée**.

Ça se vérifie par ses entrées naturelles : un membre que CASSANDRA déclare « équipé » trois mois de
suite sans qu'il progresse est un constat TOOL-LEARNING ; un écart SAFE-EXPORT qui revient passage
après passage aussi.

### Ce qu'on en déduit pour l'organisation

**1. La bonne catégorie transverse n'est pas « apprentissage » — c'est « a-t-il un axe de temps ? »**
Les six coupes du §4 décrivent ce qu'un outil EST ou FAIT. Celle-ci décrit s'il sait dire **où ça
va**. C'est la seule qui sépare un outil qui photographie d'un outil qui mesure une trajectoire, et
elle englobe proprement les deux critères que l'utilisateur voulait (mémoire, apprentissage) sans
les confondre : avoir une mémoire est une condition, avoir un axe de temps est un usage.

**2. Une dépendance à nommer maintenant plutôt qu'à découvrir dans trois semaines.** TOOL-LEARNING
ne vaudra que ce que valent les historiques de ses deux fournisseurs — or **ni CASSANDRA ni
SAFE-EXPORT ne tiennent aujourd'hui de série comparable**, tous deux dans les 5 outils nommés par
`findOutilsPrivesDeTendance()` (tâche #445). Les brancher n'est donc plus une amélioration parmi
d'autres : c'est ce qui conditionne la valeur du troisième.

**3. Pourquoi l'agent séparé se justifiait, sur un point que j'avais sous-estimé.** Sa vocation
unique n'est pas de juger les outils — c'est de juger **l'agent**, sur sa capacité à les faire
progresser. Aucun autre outil du paysage ne regarde ça : c'est un angle mort entier, et le seul qui
ne pouvait aller nulle part ailleurs.

### État acté du 2026-09-22 (déjà dans le code, plus une intention)

- **7 Gardiens sacrés** depuis l'arrivée de SAFE-EXPORT (couche légère seulement) : ARGUS, HARMONIA,
  ALWAYS-NEW-CODE, AXA-CHECK, CLEAN-DIRTY-OLD, CLONE-HUNTER, SAFE-EXPORT.
- **TOOL-LEARNING** rangé dans la Suite Dette & Structure du code — c'est bien de dette qu'il parle,
  celle d'un outil qui n'apprend pas. Volontairement PAS un Gardien : une trajectoire ne se mesure
  pas à chaque commit.
- Effectifs réels mesurés : 2 socle · 2 Agents Cadre · 7 Gardiens · 24 Membres · 6 Émetteurs.

## 7. Statut

Conception ouverte, aucune décision actée. Le schéma d'organisation complet est à produire — l'ordre
fixé par l'utilisateur le 2026-09-22 place ce chantier **après** la création du nouvel outil
d'exportabilité et la Ronde, et **avant** CASSANDRA.

---

## Vague d'idées du 2026-09-22 (soir) — six points, consignés avant la Ronde

*Demandés explicitement par l'utilisateur en amont du chantier d'organisation : « consigne bien,
enregistre les idees pour l'organisation, que ca nous serve juste apres ». Aucune décision actée
ici — ce sont des angles à trancher au moment du schéma.*

### 1. « Être dans CIRCLE » est un critère TRANSVERSE, pas une propriété de l'outil

Idée telle qu'elle a été posée : *« etre dans cricle est un criteres transverse (icone ?) »*.

Ce que ça vise, et pourquoi c'est juste. L'organigramme actuel classe sur deux axes (statut de
documentation, rôle) — deux axes qui répondent à « qui est cet outil ? ». Or « est-il dans la
Ronde ? » ne répond pas à ça du tout : c'est une propriété de son **rythme de sollicitation**, et
elle se croise avec les deux autres sans s'y réduire. Un Gardien n'y est jamais (il tourne à chaque
commit), un Membre peut y être ou non, un Agent aussi.

Le paysage compte déjà d'autres critères de cette nature, tous invisibles dans l'organigramme :

- **rythme** : à chaque commit (Gardiens) / périodique (Ronde) / sur événement (integration-outil) /
  à la demande seulement ;
- **coût** : gratuit / coûteux en appels API / coûteux en tokens d'agent ;
- **mémoire** : en tient une / n'en tient pas / en tient une et ne la relit jamais (le verdict
  « archive seulement » de TOOL-LEARNING) ;
- **apprentissage** : apprend seul / enseigné par l'agent / immobile ;
- **tendance** : tient une série temporelle / n'en tient pas.

Piste (non tranchée) : plutôt qu'un troisième axe de classification, une **grille de drapeaux**
lisible d'un coup d'œil, chaque drapeau ayant sa définition atteignable. Question ouverte : une
icône par critère devient vite illisible à cinq critères × trente outils — à calibrer.

### 2. Une classification alternative serait-elle meilleure aujourd'hui ?

Idée : *« avec toutes les evolutions, est-ce qu'une organisation alternative peut etre meilleure ?
je parle de classification. »*

C'est exactement l'épreuve de la page blanche (Article 7) appliquée à l'organigramme plutôt qu'au
code — et l'outil qui la rend concrète existe déjà : **ALWAYS-NEW-CODE**, dont le zoom profond
demande « comment construirait-on cette zone aujourd'hui, avec toute la connaissance actuelle ? ».
L'organigramme n'a jamais été une de ses zones.

Le soupçon est fondé : les deux axes actuels ont été posés quand le paysage comptait une douzaine
d'outils. Il en compte aujourd'hui près de trente, dont plusieurs (LE-COORDINATEUR, CIRCLE-TASKS,
tool-brain, integration-outil) n'ont **aucun domaine propre** — ils orchestrent ou aiguillent. Les
ranger comme « Membres » à côté d'ARGUS dit très peu.

Piste : un axe **« qui produit un jugement » / « qui orchestre » / « qui aiguille » /
« qui exécute »**, orthogonal au rang. Non tranché.

### 3. Une organisation qui englobe TOUT type de script

Idée : *« je voudrais dans l'organisation etre capable de situer TOUT type de scripts, une
organisation qui englobe TOUT, meme si elle ne precise pas tout ».*

**C'est le point le plus important des six**, parce qu'il pointe un trou réel et mesurable :
l'organigramme actuel ne couvre PAS tout. `docs/referentiel/organisation-agence.md` §5 déclare
trois catégories « définitivement hors de l'agence » (Personnages, Moteur du jeu, code tiers) et un
3e rang « Infrastructure » sans dossier individuel — c'est-à-dire que plusieurs dizaines de fichiers
réels n'ont aucune place nommée. Quand quelqu'un demande « où vit `check-house.mjs` ? », la réponse
est « Infrastructure », ce qui n'est pas une place, c'est un fourre-tout.

Ce que la demande exige, formulée comme une règle : **toute exhaustivité doit être totale, quitte à
être grossière**. Mieux vaut une case large et honnête (« Infrastructure — socle exécuté par
d'autres, jamais sollicité directement ») qu'une absence de case. Et surtout : le garde-fou doit
être **mécanique** — un script du dépôt qui n'appartient à aucune catégorie doit se signaler tout
seul, sur le patron déjà prouvé huit fois ici (`findScriptsMissingFromAgentFiles()` et ses cousins).

### 4. Harmoniser CASSANDRA avec l'organisation — que peut-elle apporter de plus ?

Idée : *« comment harmoniser le role de cassandra avec l'organisation : qu'est-ce qu'elle peut
apporter de plus ? cree une tache pour mettre avec la serie qui vient sur cassandra »*.

État factuel : `organisation-agence.md` est un texte **tenu à la main**, et sa propre fiche le
reconnaît (« la tenue à jour de ce document à chaque changement d'organigramme reste manuelle »).
CASSANDRA reconstruit déjà l'organigramme à chaque passage depuis le code réel. Les deux coexistent
sans que rien ne vérifie qu'ils disent la même chose — un écart silencieux de la famille que
l'Article 24 interdit.

Ce qu'elle pourrait apporter, à trancher : (a) devenir la **source** de l'organigramme, le document
n'en étant qu'un rendu ; (b) rester un miroir, mais avec un garde-fou qui compare les deux et
signale toute divergence ; (c) porter les critères transverses du point 1, qu'elle est la seule à
pouvoir mesurer sur tout l'effectif d'un coup.

→ **Tâche créée** pour la série CASSANDRA à venir.

### 5. Ce qui manque à notre agence face à une vraie agence

→ Fichier dédié créé : **`docs/agence-exportable-conception.md`**. Ce sujet ne concerne pas
l'organisation du projet en cours mais la conception du **projet suivant** (l'agence exportable,
après la maison) — le mélanger ici aurait noyé les deux.

### 6. Combien de « catalogues », et pourquoi ce mot revient partout

Question de l'utilisateur : *« il y a plusieurs "catalogues" dans le projet en dehors de celui du
coordinateur ? tu parles du catalogue de la charte ? pourquoi ? »*

**Réponse : oui, et c'est une vraie dette de vocabulaire, pas une commodité de langage.** Le mot
désigne aujourd'hui quatre choses différentes :

| Ce qu'on appelle « catalogue » | Où | Ce que c'est vraiment |
|---|---|---|
| le catalogue du coordinateur | `PRESTATIONS`, `scripts/le-coordinateur.mjs` | ce que l'équipe peut FAIRE pour moi — des offres de service |
| le catalogue de la charte | tableau « Catalogue — blueprint exportable », `CLAUDE.md` | quels DOCUMENTS chaque outil possède |
| le catalogue d'offres nommé | `docs/le-coordinateur/`, tâche #154 | une version DATÉE et archivée du premier |
| « le catalogue du paysage » | usages épars dans les commentaires | rien de précis — une façon de dire « la liste des outils » |

Pourquoi j'ai employé « catalogue-charte » : en construisant `integration-outil`, il fallait nommer
les dix registres, et celui de `CLAUDE.md` s'appelle littéralement « Catalogue — blueprint
exportable ». J'ai repris son nom — ce qui a **ajouté une cinquième occurrence** au lieu de résoudre
l'ambiguïté.

L'Article 27 tranche déjà le principe : « Le vocabulaire se définit là où il s'emploie [...] Un nom
propre sans définition atteignable est une dette de reprise, au même titre qu'un chemin cassé. »
Une IA qui reprend le projet et lit « consulter le catalogue » ne peut pas savoir lequel des quatre.

Piste : garder **« catalogue » pour les offres de service** (le seul sens qui corresponde au mot
courant) et renommer les autres — le tableau de la charte est un **inventaire documentaire**, la
version archivée est un **relevé daté**. Non tranché : un renommage touche plusieurs fichiers et
mérite d'être fait en une fois, pendant le chantier d'organisation.
