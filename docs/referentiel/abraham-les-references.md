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
| **THE-KING** | découpe `docs/philosophie-et-politique.md` en règles numérotées — **son propre commentaire l'avoue** : « même principe que `CLAUDE.MD.SPY::extractRuleUnits()` mais jamais la même fonction » | **vrai doublon de fonction**, à brancher sur Abraham |
| `decouperEnUnites()` / `pairesParJaccard()` (`lib-shell`) | le découpage BRUT et la comparaison de vocabulaire | **primitives, pas doublons** — Abraham les APPELLE, il ne les réécrit pas |
| ecotoken | le poids en tokens d'un document | frontière nette : lui mesure le COÛT, Abraham mesure la STRUCTURE |
| INES-official | aplatit le dépôt en une édition annotée | frontière nette : lui assemble, Abraham analyse |

Le branchement de THE-KING reste une tâche ouverte, déclarée plutôt que faite en silence.

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
