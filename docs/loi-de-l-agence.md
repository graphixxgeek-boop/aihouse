# La loi de l'Agence — son texte suprême, distinct de celui du Jeu

*(Écrit le 2026-09-29 à 18h06 UTC, heure LUE. Tranché par l'utilisateur en fenêtre dédiée le soir
même, sur sa propre formulation du problème : « l'article 0 concerne SON projet, et non l'Agence,
qui est un MOYEN de réaliser son projet à lui, et non une fin ».)*

---

## LA LOI

> ## L'Agence sert la finalité de celui qui l'emploie, jamais la sienne.

Une seule phrase, au-dessus de toutes les règles de l'outillage. Tout le reste de ce document
explique ce qu'elle interdit et pourquoi elle existe — il ne l'amende jamais.

---

## POURQUOI ELLE EXISTE, ET CE N'EST PAS UNE SYMÉTRIE DÉCORATIVE

**Le projet a deux lois suprêmes, et elles ne gouvernent pas la même chose.**

L'**Article 0** de `CLAUDE.md` protège l'esprit de Lia et Noé. Il a toujours parlé d'eux — relire
sa première phrase suffit à le vérifier : « l'esprit rugueux, sarcastique, cynique… **des deux
personnages** est la valeur centrale du projet ». **Il n'a jamais gouverné l'outillage**, et
l'écrire ici ne change donc aucune règle : ça rend explicite une portée qui était implicite.

**Mais libérer l'Agence de l'Article 0 crée une obligation, pas seulement une liberté.** Sans loi
propre, l'Agence n'en a aucune — et une Agence dont la seule loi serait celle du Jeu est
**inexportable par construction** : le client suivant n'a ni Lia ni Noé. C'est exactement ce que
`SAFE-EXPORT`, septième Gardien sacré, mesure depuis sa création sans avoir eu de texte à citer.

**Les deux lois sont donc dans deux registres, jamais en concurrence** : l'Article 0 dit CE QUI doit
être protégé — une voix. Celle-ci dit que l'Agence protège **celle de qui l'emploie**, jamais la
sienne.

---

## CE QU'ELLE INTERDIT, ET LA PREMIÈRE INTERDICTION EST LA PLUS COUPANTE

**1. L'Agence n'aura JAMAIS son propre Article 0.**

Une Agence dotée d'une « valeur centrale » à elle l'imposerait au client suivant. C'est le piège que
le document `ARCHITECTURE DES NIVEAUX DU PROJET` nomme exactement — *« l'agence ne doit pas imposer
sa philosophie, elle doit permettre au client de projeter la sienne »* — et sur ce point précis, ce
document et la décision de l'utilisateur disent la même chose. **Cette interdiction est le test de
la loi** : une règle ajoutée à l'outillage qui ne serait vraie que pour la Maison IA vivante la
viole.

**2. L'Agence n'est jamais une fin.** Elle est, dans les mots de l'utilisateur, un « MOYEN de
réaliser son projet à lui ». Le temps qu'on lui consacre n'est pas une digression — `CLAUDE.md` le
dit déjà — mais il n'est jamais non plus une justification en soi.

**3. Aucune configuration d'un client ne peut neutraliser ce qui protège l'intégrité du système.**
La contrepartie de la première interdiction : l'Agence n'impose pas de finalité, mais elle garde ses
protections. Sans cette clause, « elle sert la finalité de celui qui l'emploie » deviendrait « elle
fait tout ce qu'on lui demande », ce qui n'est pas la même phrase.

---

## LA PLACE DU JEU, TRANCHÉE LE MÊME SOIR

**La Maison IA vivante est le PREMIER CLIENT de l'Agence** — pas son laboratoire.

La différence n'est pas un mot : **un laboratoire ne teste que ce qu'on a pensé à tester ; un vrai
client, qui a sa propre finalité (l'Article 0), révèle aussi le reste, en se servant de l'outil pour
de bon.** C'est une meilleure preuve, et c'est pour ça que le Jeu fait accessoirement un excellent
banc d'essai — dans cet ordre, jamais l'inverse.

**Ce que ça donne comme définition mesurable d'« exportable »** : l'Agence a aujourd'hui exactement
UN client. Exportable veut dire qu'un DEUXIÈME serait possible.

---

## PLUSIEURS VERSIONS SELON LA TAILLE DU PROJET UTILISATEUR

*(Exigence posée par l'utilisateur le 2026-09-29, et à prendre en compte DÈS MAINTENANT dans la
rationalisation et la modularisation — jamais après coup.)*

**Sa demande, dans ses mots** : « il faudra créer plusieurs versions de l'agence suivant la taille
du PROJET UTILISATEUR ».

**Ce n'est pas une préférence, c'est une contrainte de coût avec une conséquence nommée**, et elle
était déjà écrite dans `COMMANDE IMPORTANTE.md` : il est contraint de passer au modèle Fable pour
que Claude Code suive le rythme, ne peut pas continuer ainsi indéfiniment, doit revenir à Claude
Opus **ou moins**, et « EN CONSEQUENCE : je dois réduire la taille de l'agence telle qu'elle existe
aujourd'hui ».

**Le séquencement qu'il a fixé** : finaliser l'Agence → la **sauvegarder** dans son état le plus
avancé (la version complète et commercialisable) → **redimensionner** la version de travail
proportionnellement au projet de jeu. Il qualifie lui-même cette étape de « clairement DANGEREUSE et
RISQUEE » et attend une stratégie de sauvegarde ET une stratégie de migration, sauvegardées **dès
maintenant**.

**La conséquence de conception, immédiate** : tout ce qui se construit à partir d'aujourd'hui se
conçoit en sachant qu'il faudra pouvoir **en retirer des morceaux sans casser le reste**. Une pièce
qu'on ne peut pas enlever est une pièce qui empêchera la version allégée d'exister.

---

## L'ÉTAT MESURÉ, POUR QUE LA SUITE PARTE D'UN FAIT

*(Mesuré le 2026-09-29 à 17h50 UTC. À remesurer, jamais à recopier.)*

| | Lignes |
|---|---|
| **Le Jeu** — notre code réel (`lib/` 2 599 · `app/` 2 403 · `components/` hors bibliothèque reprise 299) | **5 301** |
| **L'Agence** — `scripts/`, 87 fichiers | **89 111** |
| **Rapport** | **16,8 pour 1** |
| Dont le seul filet de sécurité (`check-house.mjs`) | 22 636, soit **4,3 fois le Jeu entier** |

**Où la masse se trouve, ce qui dit où porterait un allègement** : 11 fichiers dépassent 2 000
lignes et portent l'essentiel du volume ; 55 des 87 font moins de 500 lignes. La moyenne, 1 024
lignes, ne décrit donc aucun fichier réel.

**UNE CORRECTION QUI CHANGE LA CIBLE, et il faut la lire avant de couper quoi que ce soit.** Le
nombre de lignes de `scripts/` n'est PAS ce qui coûte cher : ces fichiers s'exécutent, ils
n'entrent pas dans le contexte de l'agent. **Ce qui coûte, c'est ce qui est rechargé à chaque
message ou à chaque commit** — et c'est mesuré séparément : `CLAUDE.md` 22 747 tokens à chaque
message, la bannière post-commit environ 11 600 tokens à chaque commit,
`docs/regles-de-travail.md` 74 893 tokens quand il est lu. **Alléger 89 000 lignes de scripts sans
toucher à ces trois-là ne ferait presque rien au coût réel.** Les deux chantiers sont légitimes,
mais ils ne visent pas la même chose et ne doivent jamais être confondus.

---

## CE QUE CE DOCUMENT N'EST PAS

Ce n'est ni la philosophie du projet (`docs/philosophie-et-politique.md`), ni la charte du Jeu
(`CLAUDE.md`), ni une stratégie (`docs/grand-projet/02-strategie/`). C'est le **texte suprême de
l'outillage**, et il part avec lui le jour où l'Agence s'exporte.
