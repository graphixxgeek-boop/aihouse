# L'Agence ailleurs — ce qui part, ce qui reste, ce qui casse

> **De quoi on parle.** Tu m'as posé deux séries de questions qui n'en font qu'une : *« quelles
> sont les règles que tu as toi et que l'agence n'a pas ? »* et *« l'utilisateur n'hérite pas de ce
> filet ? […] est-ce qu'il peut casser l'agence en codant son projet ? »*
> **Ta peur, dans tes mots :** « j'installe l'agence dans un nouveau projet, je l'utilise mais je
> ne la reconnais pas et certaines choses ne fonctionnent plus du tout. »
> **Tâches :** #1481 (le test contre un dépôt vierge) · #1484 (chantier B) · #1485 (chantier C).

---

## CE QUE CE DOCUMENT APPORTE, ET POURQUOI IL N'EST PAS UN AVIS

**Trois mesures ont été faites, aucune n'était disponible avant aujourd'hui.** Je ne te réponds
pas « je pense que » : j'ai installé un vrai dépôt d'accueil et je lui ai fait subir l'Agence.

**Ta peur était fondée, et la première mesure l'a démontrée en dix minutes.**

---

# ① LE TEST QUE PERSONNE N'AVAIT JAMAIS FAIT

L'Agence possède un outil, `the-king fonder`, dont le **seul** rôle est de doter un projet
d'accueil de ses textes fondateurs quand il n'en a pas. Il n'avait **jamais** tourné contre un
projet d'accueil. Jamais une fois.

J'ai donc fabriqué un vrai petit projet — un carnet de jardin partagé, un README et deux documents
de décisions, écrits comme une vraie équipe les écrit. Puis j'ai lancé l'outil dessus.

## Le résultat brut

**0 case remplie sur 19.** L'outil n'a rien proposé.

Et pourtant le corpus était plein de convictions parfaitement claires : *« Nous préférons un outil
que tout le monde comprend à un outil complet que personne n'ose toucher »* · *« une donnée fausse
est pire qu'une donnée absente »* · *« Les données appartiennent aux jardiniers »* · *« Pas de
classement entre jardiniers »*.

## Trois causes empilées, et la troisième est la pire

**① Le seuil sortait de son propre nuage.** L'outil ne retient une conviction que si elle
**revient** plusieurs fois dans le corpus. Le seuil se calcule à partir de ce qu'il observe —
c'est la bonne méthode — mais un **plancher en dur de 3** était appliqué par-dessus. Sur ce
projet-ci, le maximum observé est 26 : le plancher ne mord jamais. Sur le projet d'accueil, le
maximum observé est **0** : le seuil appliqué était donc **au-dessus de tout ce que l'outil pouvait
voir**. Zéro résultat garanti, par construction.

Le commentaire du code promettait pourtant, deux lignes plus haut, que ça ne pouvait pas arriver.
La promesse était tenue par le calcul ; le plancher la défaisait.

**② Un petit corpus ne peut pas « répéter ».** Trois documents ne permettent pas à une idée de
revenir trois fois. Tout le mécanisme est calibré sur ce dépôt-ci et ses **7 191 convictions** ; le
projet d'accueil en rendait **3**.

**③ ET L'OUTIL ACCUSAIT LE PROJET D'ACCUEIL.** C'est le vrai scandale. Il n'écrivait pas « je n'ai
pas pu mesurer ». Il écrivait, dix-neuf fois :

> 🚨 *aucune phrase du corpus de ce projet ne tient ce rôle — c'est un vrai trou*

**Il reprochait à l'équipe d'accueil un défaut qui appartenait à l'instrument.** Et c'est la
première chose qu'un nouveau venu aurait vue de cette Agence.

## Ce qui est corrigé

Le plancher ne peut plus dépasser le maximum observé. Et quand la récurrence ne discrimine
réellement rien, l'outil **refuse de conclure** au lieu d'accuser :

> *la récurrence ne discrimine rien sur ce corpus : 3 convictions extraites, et aucune ne partage
> assez de vocabulaire avec une autre. Un corpus trop petit ou trop varié pour que « revenir
> plusieurs fois » veuille dire quelque chose n'est pas un corpus muet. Ce qui manque est de la
> MATIÈRE, pas une philosophie.*

**Vérifié dans les deux sens** : avec cinq documents au lieu de trois, le même outil remplit une
case avec une vraie conviction du jardin — et sur ce projet-ci, rien n'a bougé (seuil 3, exactement
comme avant la correction).

---

# ② CE QUI NE PARTIRA PAS AVEC L'AGENCE *(chantier B)*

Ta question : *« quelles sont les regles que tu as toi et que l'agence n'a pas ? »*

## La distinction qui tranche, et elle est simple

Une règle qui gouverne mon comportement a une **source**. Si cette source est un **fichier du
dépôt**, elle part avec l'Agence : le prochain lecteur, humain ou IA, peut l'atteindre. Si la
source est une **conversation**, elle ne survit qu'à ma mémoire — donc elle n'existera pas dans ton
nouveau projet, et **personne ne remarquera son absence**.

C'est exactement ton « certaines choses ne fonctionnent plus du tout ».

## La mesure

**3 règles de conduite sur 28 n'ont pour source qu'une conversation.** Les 25 autres pointent un
fichier qui existe vraiment — aucune source cassée.

| Règle | Sa seule source aujourd'hui |
|---|---|
| `eval-hors-ronde` | ta demande orale du 23 septembre, marquée « GROS WARNING » |
| `reveil-arme` | la nuit perdue du 25 septembre |
| `reveil-a-jour` | deux numéros de tâches |

**Ces trois-là disparaîtront** à l'installation ailleurs. Et la dernière est la plus traître : elle
cite des tâches, ce qui ressemble à une source — mais les tâches de CE projet ne partiront pas avec
l'Agence.

## Ce qui est désormais mécanique

SAFE-EXPORT, le Gardien qui pose la question « cette Agence est-elle transportable ? », mesure ça
à chaque passage et nomme les règles concernées. **Il NOMME, il ne juge pas** : une règle née d'un
incident peut légitimement n'avoir jamais eu de document, et lui en inventer un d'autorité serait
écrire à ta place. Ce qui change, c'est qu'on ne peut plus l'ignorer sans le savoir.

## Ce que ça ne couvre pas, et je préfère le dire

Cette mesure porte sur les règles **déclarées** à `angel`. Elle ne voit pas ce qui gouverne mon
comportement sans avoir jamais été déclaré nulle part — les consignes de ma session, l'outillage de
l'éditeur, nos habitudes de travail jamais écrites. **Par définition, aucune mécanique ne peut
compter ce que personne n'a inscrit.** Le seul remède est de continuer à écrire les règles au lieu
de les tenir de mémoire, ce que cette Agence fait déjà — mais la garantie s'arrête là, et la
promettre plus loin serait mentir.

---

# ③ LE FILET *(chantier C)*

Tes quatre questions, dans l'ordre.

## « Est-ce que le filet consomme des tokens, plus il est long ? »

**NON. Zéro, quelle que soit sa longueur.** C'est un programme qui tourne en local ; il ne fait
aucun appel à une IA. Ce qu'il coûte est du **temps d'attente** — environ 9 minutes — et rien
d'autre. Si ta crainte était budgétaire, elle est levée sans réserve.

## « L'utilisateur n'hérite pas de ce filet ? »

**Ta question part d'une prémisse que la mesure renverse.** Tu imagines que le filet teste le
produit, et qu'il arriverait chez l'utilisateur comme un poids pour SON projet. Voici le compte
réel des fichiers que le filet va chercher :

| Ce que le filet teste | Occurrences | Fichiers distincts |
|---|---|---|
| **L'outillage de l'Agence** (`scripts/`) | 534 | **82** |
| Le produit (`lib/`, `app/`) | 4 | 3 |

**99 % du filet teste l'Agence elle-même.** Ce n'est pas un filet pour ton projet qu'on
transporterait par erreur : c'est **la suite de tests de l'Agence**, sans laquelle ses 82 outils
ne sont plus testés du tout.

**Ce que ça change pour ta décision, et c'est l'inverse de ce que tu supposais :**

- le filet **doit** partir avec l'Agence, sinon l'Agence arrive non testée chez toi ;
- ton projet, lui, **n'hérite d'aucune protection** : l'Agence ne teste pas ton code, et ne l'a
  jamais fait. Les 9 minutes ne protègent pas ton travail, elles protègent ses outils ;
- donc il te faudra ton **propre** filet pour ton projet. L'Agence ne te le fournit pas
  aujourd'hui, et c'est un manque réel que cette mesure met au jour.

## « L'utilisateur peut-il casser l'agence en codant son projet ? »

**En grande partie non, et c'est une bonne nouvelle mesurée.** La plupart des garde-fous partent de
**leurs propres registres** : un fichier que tu écrirais et qui n'y figure pas leur est tout
simplement invisible. Testé : un hypothétique `scripts/mon-import-clients.mjs` n'est accusé ni de
non-portabilité, ni d'absence de kit — l'outil refuse même de se prononcer, parce qu'il ne sait pas
ce qu'est ce fichier.

**Mais certains garde-fous lisent TOUT l'arbre, et ceux-là te verraient.** Celui que j'ai écrit
aujourd'hui, par exemple, signale déjà **10 dossiers** qu'il ne reconnaît pas — un dossier que tu
créerais y tomberait aussi. Ce ne sont pas des erreurs bloquantes : ce sont des questions posées.
Mais multipliées par ton activité, elles deviendraient du bruit, et un outil bruyant cesse d'être
lu.

**Donc la réponse honnête : tu ne casseras pas l'Agence, mais tu la rendras bavarde.** Et c'est un
vrai sujet de conception, pas un détail.

## « Comment isoler / protéger l'agence, "verrouiller le code" ? »

Tu dis ne pas connaître le terme, donc je l'explique sans jargon. « Verrouiller » peut vouloir dire
trois choses très différentes, et elles ne coûtent pas la même chose :

| Ce que ça veut dire | Ce que ça empêche | Ce que ça coûte |
|---|---|---|
| **Séparer les dossiers** — l'Agence dans son coin, ton projet dans le sien | que tes fichiers et les siens se mélangent | presque rien, c'est une convention |
| **Rendre les fichiers non modifiables** — en lecture seule | que tu modifies l'Agence par accident | tu ne peux plus la corriger non plus, et tu devras |
| **La livrer comme un paquet installé** — comme une bibliothèque qu'on met à jour | que tu la modifies du tout, et ça te donne des mises à jour propres | c'est du vrai travail, et tu perds la possibilité de l'adapter |

**Mon avis, et ce n'est qu'un avis** : la première suffit aujourd'hui, et la troisième est la bonne
cible à terme — mais elle n'a de sens qu'une fois l'Agence stabilisée, parce qu'un paquet qu'on
doit corriger toutes les semaines est pire qu'un dossier.

## Et la liste « ce qui n'est pas rationalisable »

**Je dois d'abord réparer une fausse déclaration** : j'ai écrit qu'elle « existait en partie ».
C'est faux, vérifié — le mot n'apparaît dans aucun document du dépôt.

**Voici son premier élément, et c'est le plus gros du dépôt** : le filet lui-même, un seul fichier
de **25 447 lignes et 3,2 Mo**. Il n'est pas rationalisable au sens ordinaire, et pour une raison
qui n'est pas sa taille : **chacun de ses tests porte la raison d'un bug déjà payé**. Le raccourcir
voudrait dire jeter des raisons, donc rouvrir la porte à des bugs déjà corrigés une fois.

Le reste de la liste se construit avec le chantier rationalisation.

---

# PLAN D'ACTION

| État | Constat | Suite |
|---|---|---|
| ✅ FAIT | `fonder` testé contre un vrai dépôt d'accueil — il rendait 0/19 et accusait l'hôte | #1481 |
| ✅ FAIT | le seuil ne sort plus de son nuage, et l'outil refuse de conclure au lieu d'accuser | #1481 |
| ✅ FAIT | 3 règles de conduite sur 28 ne partiront pas — mesuré et surveillé à chaque passage | #1484 |
| ✅ FAIT | le filet mesuré : 99 % de lui teste l'Agence, pas le produit | #1485 |
| → RETENU | ton projet n'hérite d'AUCUNE protection : l'Agence ne teste pas ton code | #1490 |
| → RETENU | les garde-fous qui lisent tout l'arbre deviendront bavards chez toi | #1491 |
| ? À TRANCHER | « verrouiller » : convention de dossiers, lecture seule, ou paquet installé ? | #1492 |
| ? À TRANCHER | les 3 règles sans domicile : leur écrire un document, ou les laisser mourir ? | #1493 |
| → RETENU | la liste « pas rationalisable », commencée ici par le filet | #1485 |
