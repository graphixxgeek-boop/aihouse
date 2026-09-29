# Synthèse annotée — ARCHITECTURE DES NIVEAUX DU PROJET

> **SOURCE INTACTE :** `docs/grand-projet/00-sources/02-documents-prepares/texte/ARCHITECTURE_DES_NIVEAUX_DU_PROJET.md`
> *(3 444 mots, 764 lignes · original `.docx` conservé à côté · **jamais recopié ici**.)*

*(Écrite le 2026-09-29 au soir. **C'est le document le plus structurant des six** : c'est lui qui a
provoqué la décision du soir sur les quatre niveaux et la loi de l'Agence.)*

---

## ▸ IDÉE 1 — « Tu as trois systèmes imbriqués, pas un seul » · **lignes 8 à 87**

**a. Ce que ça dit** — le créateur (niveau 1), le produit (niveau 2), le client (niveau 3). Et
surtout : **la philosophie du PRODUIT n'est pas celle de son CRÉATEUR.** *« La première parle du
créateur, la seconde parle du produit. »*

**b. Ce que ça nous apporte** — le vocabulaire qui a débloqué toute la soirée. Sans lui, « la
philosophie du projet » désignait deux choses à la fois.

**c. Quand j'en aurai besoin** — **chaque fois qu'un document parlera de "philosophie" sans dire
laquelle.** C'est le test à appliquer avant de le lire.

**d. NEUF, et c'est la source de tout le reste.** Notre CLAUDE.md connaissait deux systèmes (le site
et l'Agence) ; il en manquait deux, et ce sont exactement ceux qui décident si l'Agence partira un
jour.

**e. DÉJÀ FAIT depuis ce soir** — la distinction est actée, et `docs/loi-de-l-agence.md` en découle.

**f. Ancre** — `texte/ARCHITECTURE_DES_NIVEAUX_DU_PROJET.md:8`

---

## ▸ IDÉE 2 — Le piège de la gouvernance figée · **lignes 88 à 132**

**a. Ce que ça dit** — beaucoup figent philosophie, politique, objectifs et process dans le produit.
Le client est alors forcé de travailler selon la logique du concepteur : *« rarement scalable »*.
Le remède : **un MOTEUR de gouvernance, pas une gouvernance figée.**

**b. Ce que ça nous apporte** — la formulation exacte de ce qu'il proposait comme définition de
l'Agence, et la raison pour laquelle c'est la bonne.

**c. Quand j'en aurai besoin** — **au moment de concevoir le cas ①** (l'Agence accompagne un projet
qui n'existe pas encore). C'est là que le piège se referme.

**d. ACCORD TOTAL — et c'est devenu notre loi ce soir.** *« L'Agence sert la finalité de celui qui
l'emploie, jamais la sienne »* est ce passage, reformulé. **Et j'en ai tiré l'interdiction qui rend
la loi testable** : l'Agence n'aura jamais son propre Article 0.

**e. DÉJÀ FAIT** — écrit, inscrit dans trois endroits, et porté par SAFE-EXPORT.

**f. Ancre** — `texte/ARCHITECTURE_DES_NIVEAUX_DU_PROJET.md:88`

---

## ▸ IDÉE 3 — Le noyau permanent et ce qui est configurable · **lignes 99 à 159**

**a. Ce que ça dit** — l'Agence a une **méta-philosophie** qui ne change jamais (adaptabilité,
traçabilité, auditabilité, mesurabilité, amélioration continue) et une **méta-politique** (toute
décision traçable, toute donnée classifiée, toute action mesurée, toute erreur analysée). Le client
configure au-dessus : vision, philosophie, politique, objectifs, stratégies.

**b. Ce que ça nous apporte** — la liste des invariants candidats, déjà rédigée.

**c. Quand j'en aurai besoin** — **à la question G8** (« y a-t-il des règles qu'un client ne peut
pas refuser ? »). C'est la réponse toute faite, à amender.

**d. ACCORD, mais SA LISTE EST TROP LONGUE pour nous.** Cinq principes plus quatre règles font neuf
obligations imposées à tout client. **Je recommande trois** — toute action est traçable, toute
mesure dit sa source, rien ne se supprime sans dire pourquoi — parce que plus le noyau est petit,
plus l'Agence est adoptable, et notre Article 13 dit que ce qui sature est le nombre d'obligations.

**e. À TRANCHER** — c'est exactement la question G8 des 30.

**f. Ancre** — `texte/ARCHITECTURE_DES_NIVEAUX_DU_PROJET.md:99`

---

## ▸ IDÉE 4 — « Le jeu est un bac à sable, un laboratoire » · **lignes 160 à 228**

**a. Ce que ça dit** — le jeu n'est pas un projet séparé : c'est l'environnement où éprouver les
règles de gouvernance de l'Agence. `PROJET → Jeu → validation` d'un côté, `PROJET → Agence →
commercialisation` de l'autre.

**b. Ce que ça nous apporte** — une position claire, à laquelle se confronter.

**c. Quand j'en aurai besoin** — **chaque fois qu'un document extérieur traitera le jeu comme un moyen.** C'est le passage à citer pour rappeler pourquoi nous avons tranché autrement.

**d. ⚠️ DÉSACCORD — ET C'EST LE SEUL VRAI CONFLIT DES SIX DOCUMENTS.** Notre **Article 0** dit que
l'esprit de Lia et Noé est la **loi suprême du projet**. Ce passage fait du jeu un moyen et de
l'Agence une fin. **Adopté tel quel, il inverse notre hiérarchie de valeur.**

**Comment il a été tranché le 2026-09-29, et la formulation retenue est meilleure que les deux** :
le jeu est le **PREMIER CLIENT** de l'Agence, et c'est *parce qu'il est un vrai client* qu'il fait
aussi un bon banc d'essai. **Un laboratoire ne teste que ce qu'on a pensé à tester ; un vrai client,
qui a sa propre finalité, révèle aussi le reste.** L'ordre causal du document est inversé, et
l'inversion est un meilleur argument que l'original.

**e. TRANCHÉ ce soir** — en fenêtre dédiée, et inscrit dans la loi de l'Agence.

**f. Ancre** — `texte/ARCHITECTURE_DES_NIVEAUX_DU_PROJET.md:160`

---

## ▸ IDÉE 5 — Les quatre niveaux détaillés, et ce que chacun possède · **lignes 229 à 535**

**a. Ce que ça dit** — le plus gros bloc du document (306 lignes) : pour chaque niveau, sa vision,
sa philosophie, sa politique, son objectif ultime, ses objectifs stratégiques. Avec une phrase qui
résume tout : **« Le Projet conçoit, le Jeu éprouve, l'Agence exécute, le Client oriente. »**

**b. Ce que ça nous apporte** — un gabarit rempli pour chaque niveau, à corriger plutôt qu'à écrire.

**c. Quand j'en aurai besoin** — **quand on écrira la philosophie et la politique de chaque niveau**,
pour ne pas partir de la page blanche.

**d. ACCORD sur la structure. Et une phrase à retenir, qu'il écrit pour le niveau Projet** :
*« Cet objectif concerne ta réussite en tant que créateur du système. **Il ne doit pas être implanté
tel quel dans l'Agence du client.** »* — **c'est le document lui-même qui contredit sa propre
recommandation d'un objectif ultime unique**, faite dans `FIXER UN OBJECTIF ULTIME`.

**e. À FAIRE** — c'est la matière du chantier philo/politique, niveau par niveau.

**f. Ancre** — `texte/ARCHITECTURE_DES_NIVEAUX_DU_PROJET.md:229`

---

## ▸ IDÉE 6 — FIXE / CONFIGURABLE / PERSONNALISABLE · **lignes 536 à 581**

**a. Ce que ça dit** — trois statuts. **FIXE** : protégé, l'intégrité du produit. **CONFIGURABLE** :
prévu, modifiable par paramètres. **PERSONNALISABLE** : adaptable en profondeur, via développement
spécifique. Avec deux matrices complètes.

**b. Ce que ça nous apporte** — **le vocabulaire qui manquait à SAFE-EXPORT.** Il sait dire « part /
ne part pas » ; il ne sait pas dire « part, mais le client peut le régler ».

**c. Quand j'en aurai besoin** — **à l'étape ④, modularisation**, et pour répondre à G13 (version
réduite ou version modulaire).

**d. NEUF, et directement utile.** Notre manifeste déclare trois ZONES (noyau / produit / câblage) —
**une autre question que celle-ci**. Les zones disent *qu'est-ce qui part* ; ces statuts disent
*qu'est-ce que le client peut changer*. **Les deux axes se croisent, ils ne se remplacent pas.**

**e. À FAIRE** — ajouter ce second axe au manifeste, à l'étape ④.

**f. Ancre** — `texte/ARCHITECTURE_DES_NIVEAUX_DU_PROJET.md:536`

---

## ▸ IDÉE 7 — Les cinq règles anti-confusion · **lignes 582 à 630**

**a. Ce que ça dit** — **toujours nommer le niveau** (jamais « philosophie » seul) · un objet a un
seul propriétaire · ne pas dupliquer un objectif, sa PORTÉE doit différer · l'Agence possède les
invariants, le Client les finalités · **aucune tâche sans rattachement**.

**b. Ce que ça nous apporte** — cinq règles courtes, applicables tout de suite, qui coûtent presque
rien.

**c. Quand j'en aurai besoin** — **en écrivant n'importe quel document du chantier.** La règle 1 est
la plus rentable : elle évite l'ambiguïté qui nous a coûté la soirée.

**d. ACCORD, et la règle 1 est déjà appliquée sans avoir été écrite** : `loi-de-l-agence.md` et
`CLAUDE.md` nomment chacun leur périmètre. **La règle 5 est la plus exigeante** et rejoint le test
des cinq questions de `COMMENT ASSURER LA COHERENCE` — même réserve : rétroactivement sur 1 238
tâches, c'est écrasant.

**e. À FAIRE** — adopter la règle 1 comme convention d'écriture immédiate. Les quatre autres suivent
le cadre.

**f. Ancre** — `texte/ARCHITECTURE_DES_NIVEAUX_DU_PROJET.md:582`

---

## CE QUE CETTE SYNTHÈSE CONFIRME ET CE QU'ELLE OUVRE

**Confirmé** : ce document est bien le plus structurant des six. Six de ses sept idées ont produit
un ACCORD ou un NEUF directement exploitable, et deux ont déjà été actées le soir même.

**Le seul désaccord des six documents est ici** (idée 4, le jeu comme laboratoire) — et il portait
sur notre loi suprême. **C'est exactement ce que la question (d) est faite pour trouver**, et sans
elle il serait passé inaperçu : lu sans confronter à l'Article 0, ce passage est parfaitement
raisonnable.

**Ce qu'il ouvre** : le second axe FIXE / CONFIGURABLE / PERSONNALISABLE, qui croise nos trois zones
sans les remplacer. C'est la pièce qui manque encore au manifeste, et elle attend l'étape ④.
