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
