# Abraham-les-references — instanciation sur ce projet

*(Blueprint générique : `docs/abraham-les-references-blueprint.md`. Script :
`scripts/abraham-les-references.mjs`. Registre : `docs/abraham-les-references/index.md`. Créé le
2026-09-23, tâche #619.)*

## Son nom, et qui l'a donné

L'utilisateur, en fermant une fenêtre de question sur l'architecture : **« Reponse 1 on separe et
l'outil Maitre s'appelle : Abraham-les-references ; mais verifie : il n'y a pas encore un autre
outil que l'ex-charter-spy qui est dans les memes fonctions ? »**

Le nom dit le rang : le père des références, celui dont les autres descendent. Il ne connaît aucun
document en particulier, et c'est exactement ce qui lui permet de les servir tous.

## Pourquoi il existe, et c'est une erreur de découpage reconnue

Le 2026-09-23, en construisant MOÏSE-TABLES-DE-LOI, **j'ai absorbé le générique dans le
spécifique** : les sept fonctions de CHARTER-SPY, qui savaient analyser n'importe quel document à
règles numérotées, ont fini enfermées dans l'agent d'UN document. Une heure plus tard l'utilisateur
a nommé l'erreur en une phrase : *« en fait, selon le decoupage demandé, c'est charter spy qui
aurait du etre étoffé, et moise qui peut l'appeler et completer avec ses propres fonctions utiles à
claude.md specifiquement »*.

Il avait raison, et la mesure le confirmait : **30 des 40 fonctions de Moïse ne dépendaient
d'aucune particularité de la charte.**

## La vérification qu'il a demandée, et son résultat

*« mais verifie : il n'y a pas encore un autre outil que l'ex-charter-spy qui est dans les memes
fonctions ? »* — la vérification a été faite avant d'écrire une ligne, et elle a trouvé quelque
chose :

| Outil | Ce qu'il fait de comparable | Verdict |
|---|---|---|
| **THE-KING** | découpe `docs/philosophie-et-politique.md` en règles numérotées — **son propre commentaire l'avoue** : « même principe que `CLAUDE.MD.SPY::extractRuleUnits()` mais jamais la même fonction » | **le doublon était plus étroit que je ne l'ai d'abord dit** — voir juste en dessous |
| `decouperEnUnites()` / `pairesParJaccard()` (`lib-shell`) | le découpage BRUT et la comparaison de vocabulaire | **primitives, pas doublons** — Abraham les APPELLE, il ne les réécrit pas |
| ecotoken | le poids en tokens d'un document | frontière nette : lui mesure le COÛT, Abraham mesure la STRUCTURE |
| INES-official | aplatit le dépôt en une édition annotée | frontière nette : lui assemble, Abraham analyse |

**CE QUE LA RELECTURE DE THE-KING A RÉELLEMENT TROUVÉ, et j'avais d'abord surestimé la trouvaille.**
En le lisant vraiment avant d'y toucher (Article 19), son découpage s'est révélé **déjà partagé** :
il appelle `decouperEnUnites()` de `lib-shell` comme tout le monde, et ce qui lui reste en propre est
un vrai besoin — un principe porte quatre champs (partie, numéro, titre, tag) là où un Article en
porte deux. Son commentaire dit d'ailleurs pourquoi un partage plus poussé fragiliserait les deux
analyseurs pour un gain illusoire. **Il n'y avait donc pas de découpage à reprendre.**

**Ce qu'il y avait, en revanche, et c'est exactement ce que l'Article 24 interdit** : les deux outils
employaient le même seuil de similarité `0.22`, écrit deux fois, sous un commentaire de THE-KING
jurant qu'il resterait aligné sur « `findRedundantRulePairs()` de CLAUDE.MD.SPY ». **Deux choses
avaient déjà cédé sans bruit** : cette fonction avait changé deux fois de nom ET de fichier — la
promesse désignait une adresse morte — et rien n'aurait signalé qu'une des deux valeurs bouge. Un
commentaire qui promet une synchronisation n'est jamais une protection, c'est une intention. Le seuil
est désormais **une constante unique exportée** (`SEUIL_JACCARD_STRICT`) que THE-KING importe, et un
test vérifie dans les deux sens que le partage n'a rien changé à ce que chacun rapporte.

**Ce qui n'a PAS été fait, et c'est dit plutôt que tu** : donner à THE-KING la couche d'analyse
d'Abraham (porteur, pertinence). La mesure dit pourquoi — les 19 principes de la philosophie sont
tous « sans porteur », ce qui est la bonne réponse pour un texte fondateur dont la prose EST le
mécanisme. Le brancher produirait le même constat à chaque passage, et un signal qui accuse tout le
monde n'accuse plus personne (leçon L4).

## Ce qu'il sert déjà, mesuré et non supposé

Trois documents, **sans une ligne de configuration** — la forme de numérotation est dérivée à
chaque fois :

| Document | Forme reconnue | Unités | Couverture | Porteurs | Ce qu'il a ouvert |
|---|---|---|---|---|---|
| `CLAUDE.md` *(via MOÏSE)* | `**Article N — Titre.**` | 30 | 59 % | 9 portés / 21 sans porteur / 0 fantôme | 8 questions de pertinence, 0 recouvrement non déclaré |
| `docs/regles-de-travail.md` | `## N. Titre` | 18 | 96 % | 8 portés / 10 sans porteur / 0 fantôme | **11 questions** et **3 recouvrements sans frontière** (§8 ↔ §9, §9 ↔ §10, §8 ↔ §10) |
| `docs/philosophie-et-politique.md` | `### N.N Titre` | 19 | 86 % | 0 porté / 19 sans porteur | 19 questions — cohérent avec sa nature de texte fondateur |

**Le deuxième document est le plus parlant** : 2 870 lignes que personne n'avait jamais mesurées.
Onze de ses dix-huit sections ouvrent une question, et trois paires se recouvrent sans que rien ne
dise laquelle prime. Aucune de ces informations n'existait avant lui — non pas parce qu'elle était
difficile à obtenir, mais parce que l'outil qui savait la produire était enfermé dans un autre
périmètre.

## Ce que Moïse lui a rendu, et ce qu'il a gardé

Moïse est passé de 40 fonctions à des **adaptateurs de vocabulaire** : renommer « règle » en
« Article », passer ses exceptions d'Articles hors périmètre, ajuster un libellé d'en-tête de
mémoire. Il garde ce qui ne vaut QUE pour la charte : la cartographie, la table de classification,
les seuils d'importance calibrés sur ce document-ci, les deux garde-fous de fraîcheur du
post-commit, et le process « analyse et plan d'action de la charte ».

**La preuve que le refactor n'a pas juste déplacé le problème** : CLONE-HUNTER était monté à 25
blocs dupliqués pendant qu'Abraham et Moïse coexistaient en double ; il est redescendu à **17**, sa
valeur de référence, une fois la délégation faite.

## Sa ligne rouge, écrite dans le code plutôt que dans cette fiche

Posée par l'utilisateur au sujet de la pertinence : *« sur ce type de choix, toujours me consulter,
process »*. Abraham ne peut donc pas conclure — le champ `etat` d'une question ne prend **qu'une
seule valeur**, « à trancher ». Une prose qui dirait « il ne faut pas conclure » aurait été une
intention ; un type qui ne sait pas exprimer un verdict est un mécanisme.

## Comment on l'appelle

```
node scripts/abraham-les-references.mjs <chemin-du-document>
```

Sans argument, il liste les quatre formes de numérotation qu'il reconnaît sans configuration. Un
document dont aucune forme ne ressort rend **« pas mesurable »** avec le détail des essais, jamais
un découpage inventé (leçon L12 : un analyseur qui devine saute en silence, il doit refuser à la
place).

## Son rang dans l'Agence

**Agent** 🎖️, Membre ordinaire — **hors Ronde**, même motif que MOÏSE : ce qu'il sait dire
gratuitement remonte déjà par l'agent qui l'appelle, et un item de plus contredirait la tâche #612,
qui cherche justement à réduire le nombre de rapports produits à chaque passage.

## Le chapeau de l'assainissement (2026-09-27, tâche #1027)

**Tranché par l'utilisateur en fenêtre dédiée.** Abraham est le **POINT D'ENTRÉE** de
l'assainissement à grande échelle : `node scripts/abraham-les-references.mjs assainissement` rend,
en un seul rapport, toutes les alertes du dépôt, leur gravité, et — surtout — **leur âge**.

**Trois outils, trois périmètres qui ne se chevauchent pas**, et la frontière est une DONNÉE
(`PERIMETRES` dans `scripts/ezechiel-les-tests.mjs`), relue par un test à chaque passage du filet :

| Outil | Son objet | La fraîcheur qu'il garantit |
|---|---|---|
| MOÏSE-TABLES-DE-LOI | la charte, et elle seule | les FAITS qu'elle énonce — un chiffre annoncé correspond-il au dépôt réel ? |
| Abraham-les-references | n'importe quel document à règles numérotées | les RÈGLES — porteur réel, citations vivantes, redondances |
| EZECHIEL-LES-TESTS | le filet de sécurité et toute la machinerie qui l'entoure | la CORRESPONDANCE entre ce que les tests appellent et ce que le code offre encore |

**Comment Abraham « veille » sans refaire le travail des autres.** Il ne les relance jamais : il
LIT le registre partagé `docs/abraham-les-references/alertes.json`, où chacun dépose le verdict de
son propre périmètre à chaque passage. Les relancer aurait refait leur analyse — donc exactement
le chevauchement que la frontière interdit — et sur le filet cela coûterait une exécution complète
à chaque consultation.

**Trois invariants du registre, chacun verrouillé par un contre-test :**

1. **Un outil remplace SES alertes et ne touche jamais à celles des autres.** Sans cette règle, le
   dernier passé effacerait en silence les trouvailles de tout le monde.
2. **Une alerte qui revient garde sa date de PREMIÈRE apparition.** Sans elle, une alerte qui traîne
   depuis trois semaines aurait l'air neuve chaque jour — et c'est justement ce que la veille
   apporte, que personne d'autre ne voit.
3. **Un passage SANS alerte est enregistré comme un passage.** Un registre vide rend PAS MESURÉ :
   « aucune alerte » et « personne n'a regardé » se ressemblent trait pour trait.

## Le garde-fou des couples blueprint ↔ instanciation (#1033, 2026-09-28)

**Ce qu'il surveille** : les 82 couples `docs/<outil>-blueprint.md` ↔ `docs/referentiel/<outil>.md`.
Rien ne vérifiait qu'ils disent encore la même chose — « une règle affinée d'un côté et pas de
l'autre, c'est une question de semaines », ce que l'Article 24 interdit explicitement.

**Pourquoi Abraham et pas MOÏSE** : MOÏSE ne connaît qu'un document, la charte. Abraham traite
n'importe quel document à règles, donc lui seul peut prendre un couple quelconque.

**Ce qui a été essayé et ÉCARTÉ par la mesure**, parce que le prochain agent aura la même idée :
comparer les SECTIONS des deux documents par recouvrement de vocabulaire. Mesuré sur les 82 couples
réels — 527 sections de blueprint, 710 d'instanciation — la distribution du meilleur recouvrement
est une courbe **lisse, sans le moindre creux**, et un seuil à 0,10 déclarerait « sans vis-à-vis »
226 sections sur 527. C'est normal : un blueprint est générique, son instanciation est
particulière, elles ont le **droit** de ne pas se ressembler. Un seuil qui ne se pose pas dans un
creux est décrété, pas dérivé (BP5), et un garde-fou qui accuse la moitié d'un parc cesse d'être lu
(L4).

**Le signal retenu est le TEMPS** — celui que la tâche nomme elle-même. Une divergence, c'est un
côté retouché et l'autre laissé en arrière. Mécanique, sans interprétation : aucun faux positif
possible sur le FAIT ; seule son importance reste à juger, et elle reste humaine.

| Ce qu'il rend | Valeur mesurée le 2026-09-28 |
|---|---|
| Couples comparés | 82 sur 82 (aucun non mesurable) |
| Écart médian | 0,2 jour |
| Écart maximum | 7,9 jours |
| Seuil appliqué | 14 jours (plancher — le parc est trop synchrone pour que la part dérivée s'applique) |
| Écarts signalés | **0** |

**Il est silencieux le jour où il est écrit, et c'est le résultat attendu.** Sa morsure est prouvée
sur un couple fabriqué (retard de 200 jours), jamais sur l'état du dépôt du jour — leçon L2.

**Le seuil, et les deux pièges qu'il a fallu payer** (leçon **L46**) : il se dérive du parc, mais
(1) sur une statistique ROBUSTE — la médiane, jamais un centile haut, qui suit l'anomalie qu'on
cherche et se laisse pousser au-dessus d'elle ; (2) seulement au-dessus d'un **corpus minimum de
20 couples**, en dessous duquel seul le plancher déclaré gouverne, parce qu'alors l'anomalie *est*
le corpus.

**Ce qu'il ne dit PAS, et c'est écrit dans sa propre sortie** : que les deux documents disent la
même chose. La concordance de FOND n'est pas mécanisable ; seule la concordance de RYTHME l'est.

**Où il tourne** : dans `assainissement`, la commande de la chaîne automatique — un garde-fou qu'on
doit penser à lancer n'est pas un garde-fou (L2). `node scripts/abraham-les-references.mjs couples`
en donne la lecture détaillée à la demande, seuil et dérivation imprimés : un seuil qu'on ne peut
pas vérifier est un seuil qu'on subit.

**Délibérément PAS un item de Ronde** : il tourne déjà à chaque commit, et lui ajouter un
rendez-vous périodique gonflerait le registre sans rien couvrir de plus.

## Le croisement process ↔ règles de travail (depuis le 2026-09-28)

`node scripts/abraham-les-references.mjs croisement [chemin-des-règles]` — rapport déposé dans
`docs/abraham-les-references/croisement-process-regles-<date>.txt`.

**SA QUESTION, mot pour mot, dans son gros prompt du 2026-09-28** : « est-ce qu'on a aujourd'hui
des process qui ne sont pas portés par des règles de travail et inversement des règles de travail
non portées par des process, et est-ce qu'il y a des conflits entre les 2 ? »

**POURQUOI ICI PLUTÔT QUE DANS UN OUTIL DE PLUS** (Article 31, obligation 2 : on ÉTEND avant de
construire). Abraham est déjà l'outil MAÎTRE des documents à règles numérotées — il découpe en
unités, nomme le porteur réel de chacune, mesure les redondances. Ce qui manquait n'était aucune de
ces lectures : c'était le CROISEMENT de deux registres, les process déclarés chez
`god-of-all-process` et les sections de `docs/regles-de-travail.md`. Les deux se LISENT à
l'exécution (Article 24) : un treizième process ou une section de plus entrent sans qu'on touche au
code.

**TROIS SORTIES, JAMAIS UNE SEULE**, parce qu'elles appellent trois gestes différents :

| # | Ce qu'elle trouve | Le geste qu'elle appelle |
|---|---|---|
| ① | un **process** que rien, côté règles de travail, ne nomme | écrire la règle, ou dire pourquoi le process se suffit |
| ② | une **règle** porteuse d'obligation qu'aucun process n'exécute | lui donner un process, ou accepter qu'elle ne tienne qu'à la mémoire (leçon L1) |
| ③ | une **paire qui se contredit** | ARBITRER — décision humaine (Article 16), jamais un correctif d'agent |
| ④ | un **process dont le document** ne cite jamais les règles de travail | écrire le renvoi |

**La quatrième est arrivée le même jour** (tâche #1059, sa demande : « Assure-toi que le fichier
regles de travail et process sont bien linkés »), et elle regarde le lien dans l'AUTRE sens. ① et ②
disent ce que les RÈGLES savent des process ; ④ dit ce qu'un PROCESS dit des règles. Les deux
défauts ne sont pas le même : **un process qui ne cite pas les règles qui le gouvernent fait
travailler sans elles**, là où une règle qui ne cite aucun process ne dit pas QUAND elle s'applique.
Les additionner en un seul chiffre effacerait la distinction.

**Trois états pour ④, jamais deux** : MUET (le document ne cite rien) · PAS LU (le document n'a pas
pu être ouvert — ce n'est *pas* « il ne cite rien », les deux appellent des gestes opposés) ·
et l'exemption d'un process dont le document EST le fichier des règles, qui n'a évidemment rien à
citer. **Premier passage : 7 muets sur 12** ; les sept renvois ont été écrits le jour même, donc la
sortie est verte sur le dépôt et son pouvoir de mordre se garde sur une fixture.

### Le défaut du premier jet, et il rendait l'outil inutilisable sans en avoir l'air

La première version comparait les deux registres par **Jaccard** (intersection / union), comme tout
le reste du dépôt. Elle ne pouvait PAS fonctionner : un process se décrit en une douzaine de mots,
une section des règles de travail en compte plusieurs centaines, et l'union écrase tout. **La paire
la plus proche de tout le document rendait 0,069** — donc aucun seuil raisonnable ne pouvait se
déclencher, les douze process tombaient en « ABSENT », et cette unanimité se serait lue comme un
résultat. Un état qu'aucune donnée réelle ne peut atteindre est du décor (leçon L6).

**La bonne question est asymétrique** : « quelle PART du vocabulaire du process se retrouve dans
cette section ? » — intersection sur la taille du plus petit, jamais sur l'union. Mesurée ainsi, la
même comparaison s'étale de 0 à 0,93 et devient lisible.

### Trois protections, chacune née d'un vrai défaut

- **Le seuil se DÉRIVE** (Article 24) : deux fois la médiane des couvertures **non nulles**
  observées, sur le patron déjà éprouvé par `protegerLaCharte()`. Il vieillit donc avec les deux
  registres. Sous quatre paires non nulles, il **refuse de se calculer** plutôt que d'inventer un
  chiffre. *Les zéros sortent du calcul, et c'est un contre-test qui l'a trouvé* : sur une
  population majoritairement nulle la médiane vaut 0, le seuil vaut 0, tout le franchit, chaque
  section devient un catalogue, la population éligible tombe à zéro — et le rapport annonce
  « aucun conflit » sur zéro paire examinée. **Un seuil à zéro n'est pas un seuil permissif : c'est
  un interrupteur qui éteint la mesure en se faisant passer pour elle.**
- **Une section CATALOGUE n'est pas une preuve de portage.** `§7ter — Le paysage des outils de
  vigilance` nomme TOUS les outils du dépôt : elle couvre le vocabulaire des douze process à plus de
  70 %. Conclure qu'elle en « porte » un serait absurde — elle les énumère, elle n'en exécute aucun.
  Le critère est dérivé, jamais une liste de titres tenue à la main : une section qui couvre plus de
  la moitié des process est un catalogue.
- **Le zéro porte sur la population réellement ÉLIGIBLE** (leçon de la tâche #836). La première
  version annonçait « la plus proche à 0,929 » alors que cette paire était justement une section
  catalogue, donc exclue : le dénominateur décrivait une population que la mesure n'avait pas
  regardée, ce qui est exactement le défaut qu'un dénominateur existe pour éviter.

**Le seuil peut être IMPOSÉ, et alors le rapport le DIT** — même discipline que la SOURCE d'une
heure (Article 32) : ce qui compte n'est pas que la valeur soit bonne, mais qu'on sache d'où elle
vient. La commande n'impose jamais rien ; l'argument sert à éprouver le détecteur sur un cas dont
on connaît la réponse, ce que la tâche #836 a établi comme obligatoire.

**Les deux marqueurs de polarité** (« jamais » face à « toujours ») vivent désormais dans
`lib-shell.mjs` et sont lus par THE-KING **et** par ce croisement. Les recopier aurait reproduit
exactement la dette que le commentaire de `SEUIL_JACCARD_STRICT` raconte : deux valeurs qui se
promettent de rester alignées et qui divergent sans que rien ne le signale.

### Premier passage réel (2026-09-28)

12 process · 30 sections · seuil dérivé **0,375** · 1 section catalogue écartée.

- ① **0 process sur 12** que rien ne nomme côté règles de travail.
- ② **13 règles sur 30** portent des obligations qu'aucun process n'exécute — dont
  `§9 Points de vigilance` (21 obligations) et `§3ter Toute expérience vécue doit alimenter un
  outil` (10 obligations).
- ③ **0 conflit** sur 348 paires éligibles ; la plus proche reste `simulation ↔ §6bis` à 0,778, donc
  le zéro est mérité et non un silence.

**LA LIMITE, DÉCLARÉE** : le vocabulaire partagé est un SIGNAL, jamais une preuve. Une règle qui
porte un process sans employer un seul de ses mots reste invisible ici, et deux textes peuvent se
contredire avec des mots entièrement différents. Les conflits se lisent sur **deux mots français** :
c'est une question posée, jamais un arbitrage rendu.

## La troisième forme de porteur : un outil cité par son NOM (2026-09-28, tâche #659)

**SA DEMANDE, dans le gros prompt du 2026-09-28** : « revois aussi les niveaux de protection de
chaque regle, on avait mis ca en place, regarde si ce système est toujours cohérent et s'il tourne
bien. »

**IL TOURNAIT, ET IL ÉTAIT AVEUGLE À UNE FORME.** La classification ne reconnaissait un porteur que
sous deux écritures : `` `uneFonction()` `` et `` `scripts/<nom-du-script>.mjs` `` — écrit ici avec un
chevron plutôt qu'un nom d'exemple, parce qu'un chemin d'illustration se lit comme un renvoi réel et fait
sonner le garde-fou des chemins morts. Or la charte nomme
ses mécanismes comme l'équipe les appelle — **ALWAYS-NEW-CODE, SAFE-EXPORT, CASSANDRA-RH** — et
**vingt** noms de ce genre y sont cités. Ils étaient tous invisibles.

**LE FAUX ROUGE QUE ÇA PRODUISAIT, et il portait sur la loi suprême** : l'Article 7 sortait comme
la **seule** règle « vitale et sans protection » de tout le document. Il nomme ALWAYS-NEW-CODE
**deux fois en six lignes**. Un garde-fou qui accuse la règle la mieux documentée cesse d'être lu
(leçon L4).

**LA CORRECTION PORTE SUR LA CLASSE, JAMAIS SUR L'OCCURRENCE** (leçon L37) : on ne réécrit pas
l'Article 7 pour qu'il plaise au détecteur — ce serait corriger le symptôme (Article 3). C'est le
détecteur qui apprend la forme.

**ELLE NE PEUT PAS CRÉER DE FAUX FANTÔME, et c'est ce qui la rend sûre.** Un nom en capitales n'est
pas une promesse de mécanisme — « PROCESS INTEGRATION », « LUI-MÊME » n'en sont pas. Un tel nom
compte donc comme porteur **quand un script lui répond**, et est **ignoré** sinon : jamais rangé en
fantôme, contrairement à `uneFonction()` qui, elle, promet explicitement l'existence d'un mécanisme.
Sur le vrai dépôt : 27 candidats, 20 vrais outils.

**LE NOM SE RÉSOUT CONTRE LE DISQUE** (Article 24), jamais contre une liste recopiée qui se
périmerait au prochain outil. Deux formes acceptées : le script exact, et le script **unique** qui
commence par ce nom (`THE-SCREENER` → `the-screener-capture.mjs`). Deux candidats rendent NULL —
**un renvoi ambigu vaut moins que pas de renvoi**. L'accent est retiré avant résolution
(`LE-RÉGISSEUR` → `le-regisseur.mjs`).

**LE NIVEAU BLOQUANT RESTE VÉRIFIÉ EN LISANT**, jamais supposé d'après le nom : le script doit
réellement être lancé par un crochet git ou importé par le filet. Sans cette barrière, la correction
aurait troqué un faux rouge contre un faux vert — et le contre-test qui l'assure est précisément
celui qui vérifie qu'`always-new-code.mjs` est vraiment importé par `check-house.mjs`.

### L'effet mesuré, sur les deux documents normatifs

| | avant | après |
|---|---|---|
| **CLAUDE.md** — 🔴 critiques | 1 | **0** |
| **CLAUDE.md** — 🟠 à niveler | 6 | 4 |
| **CLAUDE.md** — 🟢 à niveau | 16 | **22** |
| **CLAUDE.md** — règles VITALES sans protection | 1 | **0** (les 9 sont bloquantes) |
| **regles-de-travail.md** — 🟢 à niveau | 9 | **13** |

**CE QUE ÇA CHANGE POUR LA QUESTION #659**, et c'est le plus important : sa prémisse — « la charte
est moins bien protégée que les règles de travail » — **reposait sur une mesure aveugle**. L'écart
réel est bien plus petit, et il n'y a plus aucune règle vitale sans protection. La question de
généraliser le mécanisme DEMANDÉE aux Articles restants reste ouverte et reste la sienne
(Article 16) — mais elle se pose désormais sur 4 règles à niveler, pas sur une loi suprême nue.

## Une fiche atteignable par CONVENTION n'est pas orpheline (2026-09-28, tâche #629)

**LE VERDICT D'ORIGINE ÉTAIT FAUX, ET LA TÂCHE LE SOUPÇONNAIT DÉJÀ.** Trois documents étaient dits
« orphelins » — `charte-cartographie.md`, `organisation-globale-projet.md`, `process-calibres.md` —
parce que le balayage n'explorait **qu'un seul dossier**. Mesurés sur le dépôt entier, ils sont cités
par **10, 8 et 4** fichiers.

**Un balayage trop étroit ne rend pas une réponse incomplète : il rend une réponse FAUSSE, avec l'air
d'être juste.**

**LE BALAYAGE CORRECT EN TROUVE 19 AUTRES, ET AUCUNE N'EST ORPHELINE NON PLUS.** Ce sont des fiches
d'outils que rien ne cite nommément — et c'est exactement ce que la charte a décidé le 2026-09-22 :
« une règle énoncée une fois vaut mieux qu'autant de chemins recopiés ». La fiche d'un outil vit
dans `docs/referentiel/<outil>.md`, et **cette convention EST le lien**. Les recopier partout serait
la redondance que ce jour-là a justement retirée.

### La règle en deux temps

Une fiche est orpheline si **rien ne la cite** *et* **qu'aucun outil ne porte son nom**.

Sans le second critère, le contrôle dénoncerait dix-huit fiches parfaitement atteignables — et **un
garde-fou qui accuse la conformité cesse d'être lu** (leçon L4). L'index généré d'un dossier n'est
pas une fiche et n'est jamais compté.

**Résultat sur le vrai dépôt : 106 fiches, ZÉRO orpheline, 18 tenues par la seule convention** — et
ce dernier nombre est affiché, jamais tu : le lecteur doit savoir combien reposent sur une règle
plutôt que sur un lien écrit.

**LA LIMITE, DÉCLARÉE** : elle vérifie qu'une fiche est ATTEIGNABLE, jamais qu'elle est à jour ni
qu'elle sert. Une fiche fausse et bien citée lui paraît saine.

## Le troisième registre du croisement : un process n'est pas le seul porteur possible (2026-09-28, tâche #1069)

**Le croisement sur-accusait**, et c'est la même famille d'erreur que toutes celles trouvées cette
nuit-là : **un signal ADJACENT lu comme le signal lui-même**.

Il comparait les process déclarés par `god-of-all-process` aux sections de
`docs/regles-de-travail.md`, et concluait « 13 règles de travail portent des obligations qu'aucun
process n'exécute ». Or **un process n'est pas le seul porteur possible** : une règle de CONDUITE
est portée par `angel-of-ia-process`, qui la DEMANDE à chaque passage et refuse d'être au vert sans
réponse. Compter ces règles-là comme orphelines accusait le dispositif de ne pas faire ce qu'il
fait — et un garde-fou qui accuse à tort cesse d'être lu (leçon L4).

**Mesure : 13 → 9 orphelines réelles**, trois sections rendues à leur porteur.

### Le lien se LIT, il ne se devine pas — et c'est ce qui le distingue du reste de ce croisement

Partout ailleurs ici, le lien entre un process et une règle est une **couverture de vocabulaire**,
faute de mieux. Pour ce troisième registre, la donnée exacte existe : chaque règle surveillée porte
un champ `source` qui **NOMME** sa section. On lit une référence écrite plutôt que de mesurer une
ressemblance. S'en passer aurait été un choix, pas une contrainte.

### Deux formes de référence exacte, et pas une de plus

| Forme | Exemple | Pourquoi elle existe |
|---|---|---|
| le numéro de section | `docs/regles-de-travail.md §0bis` | la forme courante |
| le titre cité entre guillemets | `docs/regles-de-travail.md « OPTIMISER et FIABILISER »` | **toutes les sections ne sont pas numérotées** |

La seconde n'est pas un confort. « OPTIMISER et FIABILISER » n'a pas de numéro : un matcher qui
n'aurait connu que le `§` l'aurait déclarée orpheline **pour toujours**, alors que deux règles
surveillées la portent. Une section ne doit pas devenir orpheline par accident de mise en forme.

La clé d'un titre est tronquée à sa **tête** — la part avant le tiret long. Un titre se cite
rarement en entier, et exiger le sous-titre complet aurait rendu la forme inutilisable en pratique,
donc jamais employée.

### La référence morte est une trouvaille, pas un déchet de calcul

Une règle surveillée qui cite une section **inexistante** ressemble à un porteur et n'en est pas
un — **pire qu'une absence, parce qu'elle rassure** : on croit la règle doublement ancrée quand elle
ne l'est qu'une fois. Elle est donc rendue à part, jamais silencieusement ignorée.

**Elle a rapporté au premier passage** : `consultation-avant` citait « §7ter et §1001 » depuis le
2026-09-22, et `docs/regles-de-travail.md` **n'a jamais porté de section 1001** — vérifié sur la
version du dépôt à cette date, pas supposé. Son intention n'étant pas récupérable, elle n'a pas été
devinée : la référence morte a été retirée, avec la raison écrite à côté. §7ter porte la règle à lui
seul.

### Sans le registre, l'outil le DIT plutôt que de sur-accuser en silence

Si aucune règle surveillée ne lui est passée, le rapport écrit noir sur blanc que son compte ②
**sur-accuse mécaniquement**, puisqu'un porteur possible n'a pas été regardé. Un compte rendu faux
dans le sens rassurant est le pire des deux ; celui-ci serait faux dans le sens accusateur, ce qui
coûte tout autant — il fabrique du travail qui n'existe pas.

### Le registre se LIT, il ne se recopie pas

Une règle surveillée ajoutée demain chez angel est prise en compte le jour même, sans que personne
touche à cette fonction (Article 24).

### Ce qui reste à trancher, et qui n'est pas de mon ressort

Le troisième mot d'ordre, **HARMONISER**, a été ajouté le 2026-09-24 (« on ajoute harmonise ») et
`angel` le surveille — mais la section des règles de travail s'appelle toujours « OPTIMISER et
FIABILISER — **les deux** mots d'ordre permanents » et ne le mentionne nulle part. Renommer une
section de ce document est une décision de l'utilisateur, pas un correctif d'agent.

## La couverture d'une COMMANDE : ce qu'il a demandé, et que personne n'a écrit (2026-09-28, tâche #1145)

**Sa phrase, qui a créé cette capacité** : « j'ai l'impression que tu ne prends pas assez en compte
mes consignes du document COMMANDE IMPORTANTE, que tu ne fais pas les choses à 100%, assure-toi de
gérer tout ça avec RIGUEUR. »

**La seule réponse honnête à cette phrase n'est pas une promesse, c'est un compteur.** Une promesse
de rigueur est invérifiable — par lui comme par l'agent — et elle se redonne à l'identique le jour
où elle est fausse.

```
node scripts/abraham-les-references.mjs couverture <demande.md> <couvrant.md> [couvrant2.md …]
```

Le premier fichier est CE QUI EST DEMANDÉ ; les suivants sont ce qui est censé y répondre.

**Comment il découpe.** `unitesDeDemande()` retient une ligne quand elle porte l'un des quatre
signaux de demande — une étiquette (`QUESTION`, `REMARQUE`, `OBJECTIF`, `ATTENDU`…), un point
d'interrogation final, un verbe d'obligation, ou un impératif adressé. Les titres et les lignes de
tableau sont de la structure, jamais des demandes.

**IL N'Y A PAS DE POURCENTAGE DE COUVERTURE, ET C'EST UNE DÉCISION.** Le premier jet en produisait
un : « 1 % des demandes couvertes », sur un seuil dérivé à 95 %. Deux longs textes français
partagent naturellement la moitié de leur vocabulaire, donc un seuil dérivé de cette médiane devient
inatteignable — et le même calcul sur une population plus lâche aurait rendu « 90 % couvert ». **Un
chiffre qui bouge avec la LONGUEUR des documents plutôt qu'avec leur contenu ne mesure rien**, et
publié sur la question même de la rigueur il aurait été un satisfecit.

**Ce qui est publié à la place est un CLASSEMENT** : l'écart d'une demande au LOT. Une demande dont
le vocabulaire est nettement moins repris que celui de ses voisines est une demande que personne n'a
écrite — et ce signal ne dépend ni de la longueur ni du style. Trois états : **ORPHELINE** (sous la
moitié de la médiane) · **FAIBLE** · **REPRISE**, plus **NON MESURABLE** pour une unité trop maigre,
qui n'est ni l'un ni l'autre.

**Premier passage réel, sur sa commande** : 130 unités de demande, 114 mesurables, **5 ORPHELINES et
45 FAIBLES** — dont « comment s'assurer de ne pas perdre de valeur en cours de route ? », la
fragmentation à 100 %, et le sujet UN SEUL OBJECTIF.

**Sa limite, déclarée** : il mesure un recouvrement de vocabulaire, jamais une compréhension. Il
sert à trouver ce qui est ABSENT — un signal sûr — jamais à certifier ce qui est présent.

### La limite de cette mesure, trouvée en essayant de l'appliquer ailleurs (2026-09-29, tâche #1164)

**L'ESSAI** : confronter la CAPABILITY MAP des audits (10 capacités, 71 sous-capacités) au référentiel
réel, pour voir quelles capacités l'Agence ne couvre pas. Le résultat annonçait **« Task », « KPI »,
« Plan », « Logs », « Blind test » ABSENTS** — alors que le dépôt porte `check-tasks-details`,
`kpi-report`, `docs/plans/` et `x-port-blindtest`.

**LA CAUSE N'EST PAS CELLE QU'ON CROIT D'ABORD.** Ma première explication — « les audits sont en
anglais, le dépôt en français » — était fausse : `task` apparaît **1 515 fois** dans notre corpus,
`kpi` **936**, `plan` **2 117**. La vraie cause est dans `motsSignificatifs()`, qui **écarte les mots
de quatre lettres ou moins** : `task`, `kpi`, `plan`, `logs`, `mode` disparaissent tous avant la
comparaison. Ce filtre est un bon choix pour de la prose française, où les mots courts sont des
outils grammaticaux — **il est fatal sur des étiquettes techniques anglaises, qui sont courtes par
convention.**

**CE QUI EST DÉCLARÉ PLUTÔT QUE CORRIGÉ**, et c'est une décision : abaisser le seuil ferait entrer
« dans », « avec », « pour » dans chaque comparaison, et rendrait tout proche de tout. La mesure de
couverture **sert les demandes écrites en prose, jamais les taxonomies en étiquettes**. Une carte de
capacités se LIT ; elle ne se mesure pas par recouvrement de vocabulaire.

**POURQUOI CETTE NOTE EXISTE** : le rapport faux était crédible. Il aurait annoncé que l'Agence n'a
ni système de tâches ni KPI — deux de ses plus grosses parties. *Un outil qui rend un résultat faux
avec assurance coûte plus qu'un outil absent*, et c'est la raison d'être de toutes les limites
déclarées de ce paysage.

> **FRONTIÈRE, parce que le détecteur de documents jumeaux l'a demandée (2026-09-29).** Cette fiche
> et `docs/xp-ia-process-detail.md` partagent beaucoup de vocabulaire — mesures fausses, limites
> déclarées, leçons payées — et ce n'est pas un hasard : les deux racontent ce que le projet apprend
> en se trompant. **Ils ne se confondent pourtant jamais.** Ce document décrit UN OUTIL et ses
> capacités ; l'autre décrit LE PROCESS par lequel une leçon est découverte, enregistrée, analysée
> et ressortie au bon moment. Ici on lit ce qu'ABRAHAM sait faire ; là-bas, comment une expérience
> survit à la session qui l'a vécue. **Et pour la même raison, cette fiche n'est pas non plus
> `docs/referentiel/lecons.md`** : le registre des leçons PORTE les leçons du projet, numérotées et
> citables ; cette fiche ne fait que les invoquer là où elles expliquent un choix d'ABRAHAM. Les
> trois documents se citent, ils ne se remplacent pas.
>
> *(Trois frontières à déclarer coup sur coup en une nuit disent aussi quelque chose sur ma façon
> d'écrire : mes sections de fiche sont longues et chargées en vocabulaire de leçon. Le détecteur a
> raison de le remarquer — noté en #1164.)*

## `sansLesCommentaires()` — pourquoi une seconde fonction, et pas un élargissement (2026-09-29, tâche #1168)

ABRAHAM portait déjà `sansChainesNiCommentaires()`, employée partout où il faut mesurer le CODE sans
que les exemples et les explications comptent.

**Un garde-fou voisin avait besoin de l'inverse partiel.**
`findEcrivainsDeRegistreSansContribution()` (doc-report) cherche un chemin `docs/x/` **dans les
arguments d'un appel d'écriture**. Son propre commentaire annonçait, depuis sa création, que « citer
un chemin dans un commentaire n'est pas écrire dedans » — **et rien ne retirait les commentaires**.
Un commentaire qui MONTRE la forme du code, pour l'expliquer, déclenchait donc l'accusation.

**Pourquoi ne pas réutiliser l'ancienne** : elle retire aussi les CHAÎNES — c'est-à-dire précisément
l'endroit où vit le chemin littéral que ce garde-fou doit trouver. **Deux besoins voisins, deux
fonctions ; les fondre casserait l'un des deux.**

> **FRONTIÈRE avec `docs/referentiel/safe-export.md`** *(cinquième déclarée en une nuit, et ce
> nombre dit quelque chose : à 543 lignes contre une médiane de 101, cette fiche partage assez de
> vocabulaire avec toutes les autres grosses pour les rencontrer une à une)*. ABRAHAM est le maître
> des DOCUMENTS À RÈGLES : découper, mesurer le porteur réel, trouver les redondances. SAFE-EXPORT
> est le maître de L'EXPORTABILITÉ : ce qui part, ce qui manque au kit, ce que l'hôte doit fournir.
> Ils se croisent sur les documents et ne s'y confondent jamais — l'un demande « cette règle est-elle
> portée ? », l'autre « ce fichier peut-il partir ? ».


## Le registre des décisions est exclu, et la démonstration a eu lieu en direct (2026-09-29, tâche #1210)

**Ce qui s'est passé** : en ajoutant une décision à `docs/idees-a-trancher.md`, le détecteur de
documents jumeaux a signalé deux paires — avec `docs/referentiel/lecons.md` et
`docs/xp-ia-process-detail.md`. J'ai écrit les deux frontières qu'il réclamait, dans ce document,
comme la fois précédente. **Elles en ont aussitôt créé deux autres**, avec les deux référentiels
dont ces notes venaient d'emprunter le vocabulaire.

**C'est une course qu'on ne gagne pas, et c'est structurel** : ce document tient les choix ouverts
du projet. Par construction, chaque entrée parle du sujet d'un AUTRE document — un outil, une règle,
un référentiel — et en emprunte les mots. Il grossit à chaque décision qu'on y pose, donc il
franchit le seuil avec un voisin de plus à chaque fois. Ce n'est pas une redondance à corriger :
c'est la mesure qui compare des mots là où la nature du document veut qu'il les partage tous.

**L'exclusion suit un précédent exact**, la première de la liste : `docs/suivi/` est écarté parce
qu'« il cite tout le projet par construction, donc il ressemble à tout ». Le registre des décisions
est le même cas.

**Elle porte sur CE SEUL FICHIER, jamais sur un dossier ni sur un préfixe** : tout le reste de
`docs/` continue d'être comparé, les référentiels avec lesquels il était apparié compris — les
aveugler tous les deux aurait été faire taire le détecteur, pas le corriger. Trois contre-tests
tiennent cette étroitesse.

**Ce que ça ne clôt PAS** : la question de fond — ce détecteur rapproche-t-il les sujets ou mon
écriture ? — reste ouverte en décision #1193, désormais avec cette démonstration à l'appui. C'est
la deuxième fois que le même document déclenche la mesure en grossissant.

**Et la course a repris une troisième fois, ce qui a tranché la question** : écrire la section
ci-dessus a fait apparaître deux nouvelles paires — cette fiche décrit le détecteur, donc elle
emploie le vocabulaire de tout ce qu'il compare. Trois déclenchements en vingt minutes, chacun causé
par le seul fait d'écrire une explication.

**Le contre-test du filet a donc été corrigé, pas le dépôt.** Il exigeait ZÉRO paire sur ce dépôt-ci
et virait au rouge parce qu'on avait documenté son travail — un test qui punit le progrès (même
piège que la tâche #997, même leçon L40). Il vérifie désormais ce qui ne doit jamais casser : chaque
paire porte une nature déclarée, aucune ne concerne un document exclu, et le corpus ne se noie pas.
**Les paires restent signalées à chaque passage d'ABRAHAM** — c'est là qu'elles se lisent, et le
pouvoir de détection reste prouvé sur une fixture.

## L'ORGANISATION DES LOIS — citer sans ambiguïté sur le texte dont ça vient (2026-10-02, tâche #1445)

**Sous-commande** : `node scripts/abraham-les-references.mjs lois`. À la main : la question ne se
pose qu'au moment où l'on cite, jamais à chaque commit.

**CE QU'ELLE RÉSOUT** : jusqu'au 2 octobre, un seul texte numérotait ses Articles, donc « Article
19 » n'était ambigu pour personne. Depuis que le document de gouvernance porte sa propre
numérotation, **deux lois numérotent et leurs plages se chevauchent sur 31 numéros**.

**NUMÉROTER N'EST PAS CITER, ET LE SÉPARATEUR EST LA DENSITÉ.** Premier passage, faux positif net :
`docs/regles-de-travail.md` ressortait comme « numérote : 5 articles de 0 à 18 », alors que ces
cinq-là sont des CITATIONS de la charte, écrites en gras exactement comme la charte écrit les
siens. **Aucun motif de texte ne les distingue** — les deux s'écrivent `**Article 18 — Titre.**`.
Ce qui les sépare est une propriété de l'ENSEMBLE : une vraie numérotation est dense et continue
(33 sur une étendue de 33, soit 1,00), une poignée de citations est clairsemée (5 sur 19, soit
0,26). Le seuil est à 0,60 : la frontière est large, et c'est ce qui la rend sûre plutôt qu'ajustée
au cas du jour.

**IL NE REFUSE QUE CE QUI EST FAUX SANS JUGEMENT POSSIBLE** : une citation d'un Article qu'AUCUNE
loi ne porte. Il en a trouvé **exactement une** au premier passage sur 709 fichiers —
un renvoi aux numéros 122 et 123, qui voulait dire « tâche #122 » et « 123/123 tests » — corrigée le jour même.
**Il n'accuse PAS les 5 068 citations de la plage commune** : toutes sont antérieures au second
texte et veulent toutes dire la charte. Les accuser rendrait le signal illisible le jour de sa
naissance (leçon L4), et un exemple entre guillemets n'est jamais une citation (même faux positif
que `detecterForme()` avait déjà payé sur la suite de tests).

**HORS PORTÉE, déclaré dans le rapport** : savoir si une citation DANS la plage commune visait la
bonne loi est un jugement, jamais une mesure.

**UN PIÈGE PROPRE À CE CONTRÔLE, ET IL S'EST REFERMÉ SUR LUI DÈS LE PREMIER JOUR** : écrire AU SUJET
d'une citation morte en recrée une. Le rapport de correction, la ligne de suivi qui la raconte et
le test qui la couvre citaient tous les trois le renvoi fautif pour l'expliquer — et le contrôle les
a tous les trois accusés, à juste titre. **La parade est d'écrire les numéros sans le mot qui les
précède** (« un renvoi aux numéros 122 et 123 »), et de couper la chaîne en deux dans les
éprouvettes de test. C'est le même geste que le dépôt a déjà dû apprendre sur le scanner de la
charte : un outil qui lit du texte lit aussi le texte qui parle de lui.
