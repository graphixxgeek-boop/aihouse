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
