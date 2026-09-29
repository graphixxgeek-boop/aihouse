# tool-brain — fiche d'instanciation

*(Blueprint générique : `docs/tool-brain-blueprint.md` · script : `scripts/tool-brain.mjs` · registre : `docs/tool-brain/index.md`.)*


## Le garde-fou de l'outil muet, câblé au commit (2026-09-26, tâche #778)

**Le trou qu'il ferme** : `classerLesSilencieux()` savait déjà reconnaître un outil **muet** — il a
une ligne de commande et n'appelle jamais `recordCliUsage` — mais ce classement n'apparaissait que
dans le rapport de Ronde, lancé à la main. Un outil créé demain sans cet appel rejoignait donc la
zone muette **en silence** (leçon L2).

**Pourquoi ça compte plus qu'il n'y paraît** : son zéro d'usage se lit ensuite comme un verdict sur
lui, alors qu'il ne dit qu'une chose — personne ne compte. Et un compteur faux empoisonne **toutes**
les décisions d'usage qui s'appuient dessus.

**Il signale, il ne bloque pas.** Le choix entre signaler fort (doctrine de god-of-all-process) et
bloquer (doctrine de `findHorodatagesFuturs`) revient à l'utilisateur et lui est posé ; en attendant,
le comportement retenu est le moins brutal des deux, et le seul sur lequel on peut revenir sans rien
perdre.

**Muet quand tout va bien** : une ligne « 0 muet » à chaque commit est exactement le bruit qui rend
un contrôle invisible (L6). Un silence **non mesurable** se dit en revanche, il ne se tait pas
(L5/L11) — sans lecteur de source, « aucun muet » et « rien n'a pu être lu » se ressembleraient trait
pour trait.

**Mesure du jour de son câblage : zéro outil muet** sur le dépôt réel. Le garde-fou est donc posé
pour le prochain, pas pour un défaut présent.

**Commande** : `node scripts/tool-brain.mjs muets`, appelée par le crochet post-commit dès qu'un
`scripts/*.mjs` a bougé — même filtre superset que la dette documentaire, et pour la même raison :
la précision vit dans l'outil, jamais dans une liste recopiée au crochet (Article 24).

## « Est-ce que ça existe déjà ? » — le mode `existe` (2026-09-26, tâche #746)

**Sa demande** : « l'idee que le coordinateur puisse dire au codeur (moi) si une fonction existe
deja dans le code ».

**Le besoin a déjà été payé** : ABRAHAM-LES-REFERENCES est né de trente fonctions génériques
enfermées dans l'agent d'un seul document, faute d'avoir cherché si elles existaient ailleurs.

**Ce qui manquait n'était pas un outil, c'était le MOMENT** : `suggestPrestationsForTask` répond
« quel OUTIL utiliser », CLONE-HUNTER trouve les doublons **après** qu'ils sont écrits. Personne ne
regardait **avant**. C'est donc un MODE de tool-brain, jamais un 79e script — la tâche l'exigeait.

**Commande** : `node scripts/tool-brain.mjs existe "<ce que je veux écrire>"`

**Ce qu'il lit** : les 1 172 fonctions exportées du dépôt réel — leur nom découpé en mots
(`findLignesFantomes` → « find lignes fantomes ») **et leur en-tête de commentaire**. L'en-tête
compte parce que dans ce dépôt le POURQUOI vit à côté du QUOI (Article 27) : il dit souvent mieux
que le nom ce qu'une fonction fait.

**Le classement, et les trois versions qu'il a fallu** — chacune gardée écrite parce qu'elle ratait
un cas réel :

1. **compter les mots partagés** → 34 candidates pour une question, en tête celles qui partagent le
   seul verbe « lire ». Inutilisable.
2. **pondérer par log(N/df)** → le classement devient juste, sans aucune liste de mots vides à tenir
   à jour, et il se recalcule sur le corpus réel à chaque passage (Article 24).
3. **compter des RACINES distinctes, pas des mots** → un en-tête reprend presque toujours le mot du
   nom, donc le seuil de deux devenait un seuil à un sans que rien ne le dise.

**Le seuil est exprimé en INFORMATION, pas en nombre de mots** : deux racines distinctes, **ou** un
seul mot au moins deux fois plus informatif que le mot médian du corpus. Ce n'est pas un
assouplissement du seuil mesuré en #777 — c'est la même exigence, sur un corpus de mille fonctions
où la rareté veut dire quelque chose, et la porte du mot unique **ne s'ouvre jamais sur un petit
corpus** puisqu'aucun mot n'y dépasse le médian.

**Le coût de cette étroitesse est déclaré et gardé comme contre-test** : une fonction dont la seule
idée partagée est très précise peut être manquée — « détecter un doublon de code » ne remonte pas
`planDoublons()`. Le message de réponse vide dit d'essayer le vocabulaire du sujet, et
« plan de doublons à fusionner » la trouve.

**Ce qu'il ne fera jamais** : dire « c'est déjà fait ». Il rend des **candidates à lire**. Aucune
mécanique ne peut juger qu'une fonction trouvée fait vraiment ce qu'on veut, et un outil qui
trancherait à ma place ferait réutiliser du code au petit bonheur — plus cher que de le réécrire.

## Tool-brain est-il vraiment le point d'entrée ? — mesuré, jamais déclaré (2026-09-28, tâche #575)

**Sa question, mot pour mot** : « est-ce que tout fonctionne bien : c'est devenu ton point d'entree
pour les outils ? tu utilises ? tout fonctionne ? ». Et son exigence, la même que pour #573 : **une
mesure réelle depuis le compteur d'usage, jamais une déclaration d'intention.**

### La réponse, mesurée

| | |
|---|---|
| passages de tool-brain enregistrés | **278** |
| appels **spontanés** précédés d'une consultation dans les 10 min | **1 194 / 3 112 — 38 %** sur tout l'historique |
| les mêmes, sur les **24 dernières heures** | **537 / 884 — 61 %** |

**La discipline s'est nettement améliorée**, et c'est le second chiffre qui se corrige : le cumul
dit l'habitude installée, les 24 heures disent celle d'aujourd'hui.

### Ce qui entre dans le dénominateur, et ce qui n'y entre pas

Seuls les appels **spontanés** comptent — ceux que l'agent décide lui-même. Un outil lancé par le
crochet post-commit ou dicté par un process n'avait pas à passer par tool-brain : le compter
accuserait d'un manquement qui n'existe pas, et un garde-fou qui accuse à tort cesse d'être lu
(leçon L4).

### Ce que la mesure ne dit pas, écrit à côté du chiffre

C'est une **PRÉCÉDENCE, jamais un USAGE**. Le compteur sait qu'un outil a tourné et quand ; il ne
saura jamais si la consultation a **servi** — un agent peut consulter puis faire autre chose.

Et **la fenêtre de dix minutes est un choix** : assez large pour couvrir une consultation suivie
d'une vraie lecture de code, assez étroite pour qu'un passage du matin ne crédite pas tout
l'après-midi. Le changer change le chiffre, et un contre-test le montre — une fenêtre assez large
crédite 100 %. C'est précisément pour ça que le rapport **imprime la fenêtre** au lieu de la cacher.

### Pourquoi c'est rendu à chaque rapport, et pas mesuré une fois

Un chiffre produit dans une conversation disparaît avec elle, et la question « est-ce devenu ton
point d'entrée ? » se repose à chaque période. `precedenceDeToolBrain()` sort donc dans
`node scripts/tool-brain.mjs rapport`, à côté du reste.

## « Est-ce que l'agence m'aide, ou est-ce que je m'y perds ? » (2026-09-29, tâche #1155)

**Sa question Q7, posée avec sa consigne** : « sois honnête, pas besoin de me ménager. Cette mesure
existe-t-elle aujourd'hui ? Il faut qu'elle soit mesurée. » **Elle n'existait pas** — et une
question posée sur la valeur de TOUT le paysage ne peut pas rester sans instrument.

```
node scripts/tool-brain.mjs aide-ou-encombre
```

**Pourquoi ici** : tool-brain est « plugué directement » à l'agent et tient déjà le compteur d'usage
réel. Un outil de plus aurait coûté dix registres à remplir — soit précisément l'un des chiffres
que cette mesure rapporte.

**AUCUN SCORE UNIQUE, ET C'EST LA DÉCISION CENTRALE.** Un chiffre unique sur « l'Agence est-elle
utile ? » dépendrait entièrement de la pondération choisie, donc de l'humeur de qui la choisit — ce
serait exactement le satisfecit que ce projet refuse. **Les deux plateaux se rendent SÉPARÉS ; c'est
au lecteur de peser.**

**LE PIÈGE ÉVITÉ, et un contre-test le verrouille** : compter les tâches qui NOMMENT un outil rend
**881 sur 1 090** — un chiffre flatteur et faux, parce que **nommer n'est pas devoir**. Seule la
colonne ORIGINE est lue (« d'où vient cette tâche »), et elle rend **244**.

**Premier passage réel.** *Ça rapporte* : 244 tâches sur 1 090 ouvertes par un outil (22 %), dont
**232 closes (95 %)** — un travail trouvé par un outil est un travail qui aboutit ; les plus
trouveurs sont circle-tasks (32), cassandra-rh (27), smart-conso-token (20). *Ça coûte* : 93
fichiers d'outillage à tenir, 12 outils jamais sollicités.

**La réponse honnête tient en une phrase, et elle va dans les deux sens : l'Agence aide à TROUVER,
et coûte à NAVIGUER.**

**Ce qui reste sa décision** : cette mesure doit-elle BLOQUER l'arrivée d'un outil de plus, ou
seulement l'ÉCLAIRER ? Par défaut elle éclaire — c'est le choix réversible.

**Détail d'implémentation qui porte une raison** : les imports de `check-tasks-details` et
`cassandra-rh` sont DYNAMIQUES. tool-brain est appelé par le crochet post-commit ; les tirer en tête
ferait qu'une erreur chez l'un casserait le crochet de tout le monde — le même refus a déjà été
opposé à HARMONIA le 2026-09-25.
