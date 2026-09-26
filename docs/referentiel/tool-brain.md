
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
