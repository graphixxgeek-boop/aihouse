# L'architecture d'un filet de sécurité — ce qui part quand le contenu reste

*(Document GÉNÉRIQUE, réutilisable tel quel sur n'importe quel projet. Il ne décrit pas le filet de
« Maison IA vivante » : il décrit comment en construire un qui vieillisse bien. C'est la pièce que
SAFE-EXPORT laissait partir avec le contenu — voir « Pourquoi ce document existe » ci-dessous.)*

## Pourquoi ce document existe, et le trou qu'il ferme

SAFE-EXPORT tranche depuis longtemps que le fichier de tests **« ne s'exporte pas, il se réécrit »**.
C'est juste — **pour son CONTENU**, qui nomme des personnages, des pièces, des règles de jeu. Mais
la décision laissait partir l'**ARCHITECTURE** avec, alors que c'est elle qui vaut : comment les
blocs se découpent, pourquoi chaque test porte une raison écrite, pourquoi les messages d'échec sont
de vraies phrases, pourquoi un contre-test accompagne chaque détecteur. **Rien de tout ça n'est
propre à un projet, et rien de tout ça n'était écrit.**

Ce document est aussi ce qu'un outil d'analyse de filet doit pouvoir PRESCRIRE quand il arrive sur
un projet qui n'en a pas encore.

## Ce que ce projet a payé pour l'apprendre, en chiffres

| Mesure réelle | Ce qu'elle enseigne |
|---|---|
| 17 616 lignes, 289 groupes, 5 766 assertions — **un seul fichier** | un monolithe interdit les deux leviers standards du métier : la parallélisation et la sélection de tests |
| 105,7 s → 44 s en quatre marches d'optimisation | on peut beaucoup récupérer, mais **après coup c'est du travail d'archéologue** |
| le socle inséparable pèse **19,5 s sur 78 s** | l'état partagé au niveau du fichier est le **plafond** de toute parallélisation future |
| **12 blocs portaient 66 % du temps**, et tous testaient l'outillage, jamais le produit | le coût se concentre toujours quelque part ; sans mesure par bloc, on ne sait pas où |
| une même fonction rappelée deux fois : **2 859 lectures → 2**, mais 1 832 ms → 1 619 ms | le disque ne coûte presque rien ; **le temps est du calcul**, et on le découvre en mesurant |
| 3 défauts trouvés par le voyant de santé à son premier passage | une suite verte peut être cassée **dans son fonctionnement** sans qu'aucun test n'échoue |

## Les neuf règles, et chacune se justifie par un défaut réellement payé

### 1. Un test se range dans un BLOC autonome, lançable seul, dès le premier jour

C'est la règle qui commande toutes les autres. Un bloc autonome peut être retiré, déplacé, lancé en
parallèle, ou sélectionné selon ce que le commit a touché. Un test écrit au niveau du fichier ne
peut RIEN de tout ça, et il contamine en plus ses voisins par l'état qu'il laisse.

**Le coût mesuré** : les ~70 tests écrits au niveau du fichier de ce projet valent 18,6 s qui se
rejouent dans chaque part parallèle — à eux seuls, ils fixent le plancher de la suite.

### 2. Une préparation partagée est un investissement ; un ÉTAT partagé est une dette

Transpiler les modules une fois, ouvrir une base en mémoire une fois : c'est de la préparation, elle
est légitime et elle coûte peu (1,35 s ici). **Ce qui coûte, c'est qu'un bloc MODIFIE cet état et
qu'un autre en dépende.** La préparation se refait ; l'état, lui, enchaîne les blocs dans un ordre
dont plus personne n'a la carte.

**La règle** : chaque bloc part d'un état neuf qu'il construit ou reçoit, et n'en laisse aucun
derrière lui.

### 3. Chaque test porte, à côté de lui, la RAISON de son existence

Pas « ce que fait le code », mais **pourquoi ce test a été écrit** : quel bug il a attrapé, quelle
demande il traduit, quel faux positif il a fallu corriger en route. Sans cette raison, le prochain
lecteur — humain ou IA — supprime le test au premier refactoring en le prenant pour du zèle.

### 4. Le message d'échec est une PHRASE, jamais une étiquette

`assert.equal(a, b, 'valeurs différentes')` n'apprend rien. Le message doit dire **ce que le monde
perd** si l'assertion tombe : « un fichier jamais enregistré n'a pas l'âge zéro, il n'a pas d'âge,
et les confondre ferait passer un fichier neuf pour un fichier daté d'aujourd'hui ». Le message est
lu au pire moment — quand quelque chose casse, souvent des mois plus tard, souvent par quelqu'un
d'autre.

### 5. Deux contre-tests accompagnent chaque détecteur, toujours

Un cas qu'il DOIT attraper, et un cas voisin qu'il doit laisser passer. Sans le second, on ne mesure
pas un détecteur, on mesure sa tendance à crier. Et un garde-fou qui accuse à tort cesse d'être lu —
ce qui est pire que son absence.

### 6. Un test qu'on n'a jamais vu ÉCHOUER ne prouve rien

Avant de considérer un test écrit, le casser exprès et vérifier qu'il rougit. **Vécu deux fois sur
ce projet** : un test qui comparait un ensemble trié survivait à l'inversion des deux éléments qu'il
prétendait vérifier ; un autre passait sur une copie périmée du code. Les deux étaient verts, et les
deux étaient vides.

### 7. Aucune assertion ne mesure une DURÉE

Un test qui compare des millisecondes mesure la vitesse de la machine, pas la règle. Il passe au
repos, il ment sous charge, et il finira par échouer un jour sans que personne ne comprenne
pourquoi. **On cherche toujours la valeur invariante qui se cache derrière** : la durée décidée
plutôt que le temps restant, le nombre d'échecs plutôt que le délai calculé. Une marge de tolérance
sur un temps est l'aveu qu'on mesure une horloge.

### 8. Le fonctionnement de la suite se surveille à part de son contenu

Une suite peut être verte ET malade : des avertissements ignorés, du bruit sur la sortie d'erreur,
des succès annoncés mais jamais imprimés, une durée qui double sans que personne ne le voie. **Un
vert qui laisse passer du bruit finit par cacher une vraie alerte** — c'est ainsi qu'on rate la
première ligne qui comptait vraiment. Le voyant de santé est un mécanisme distinct des tests.

### 9. La durée se mesure PAR BLOC, et l'historique se garde

Sans mesure par bloc, « la suite est lente » n'est pas actionnable. Avec elle, on voit tout de suite
que douze blocs portent les deux tiers du temps. Et sans HISTORIQUE, un relevé décrit un état mais
ne dit jamais si un changement a servi à quelque chose.

## Ce qu'il ne faut PAS reproduire — les trois anti-motifs mesurés

1. **Le fichier unique qui grossit.** Il commence à deux cents lignes et personne ne voit le moment
   où il faudrait le couper. Passé quelques milliers, le couper devient un chantier à part entière —
   et entre-temps, ni parallélisation ni sélection.
2. **L'état partagé au niveau du fichier.** Pratique au début (« tout est déjà prêt en haut »), il
   devient la seule chose qu'on ne peut plus séparer.
3. **Le test qui relit ce qu'un autre a écrit.** Deux blocs qui visent le même fichier temporaire ne
   se gênent jamais tant qu'ils passent l'un après l'autre, et se gênent une fois sur trois dès
   qu'ils tournent ensemble. Un dossier temporaire unique par construction coûte une ligne.

## Si le monolithe existe déjà : l'ordre des marches, du plus sûr au plus risqué

L'ordre n'est pas une préférence, c'est un classement par risque. **Chacune se mesure avant et
après, sinon on ne sait pas si elle a servi.**

1. **Mutualiser les lectures de fichiers** (« shared fixture ») — aucun test modifié, gain immédiat.
2. **Mutualiser les appels aux outils externes** (historique du gestionnaire de versions, processus
   lancés) — le coût d'ouvrir un processus est invisible à l'unité et énorme en nombre.
3. **Étendre ces deux partages à TOUS les outils**, pas seulement à celui qui faisait mal.
4. **Paralléliser** — la seule marche qui change la façon dont les tests s'exécutent, donc la seule
   qui peut révéler des pannes. Elle vient en dernier, et jamais avant que la mesure n'ait montré
   que le temps restant est du calcul.
5. **Découper le monolithe** — la seule marche qui lève le plafond, et la seule qui soit une vraie
   restructuration. Elle se décide avec le propriétaire du projet, jamais seule.

**La parallélisation ne crée pas de pannes, elle en RÉVÈLE** : un test sensible au temps, deux tests
qui se marchent dessus, une copie périmée. Tous mentaient déjà en silence.

## La frontière exportable / à réécrire, enfin explicite

| Ce qui PART avec l'Agence | Ce qui RESTE et se réécrit |
|---|---|
| les neuf règles ci-dessus | le contenu des tests (noms, règles métier, valeurs attendues) |
| le découpage en blocs autonomes | le nombre de blocs et leur sujet |
| le voyant de santé de la suite | les seuils propres au projet |
| la mesure par bloc et son historique | les durées observées |
| la discipline du contre-test et de la raison écrite | les bugs particuliers qui les ont motivés |

C'est cette colonne de gauche que l'outil d'analyse du filet doit savoir PRESCRIRE quand il arrive
sur un projet qui n'a pas encore de filet.
