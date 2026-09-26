# SAFE-EXPORT — instanciation propre à ce projet

*(2026-09-22, nom donné par l'utilisateur. Septième Gardien sacré du code, par sa COUCHE LÉGÈRE
seulement. Blueprint générique : `docs/safe-export-blueprint.md`.)*

## Pourquoi seulement sa couche légère est Gardien sacré

Le critère d'appartenance est **double** : délivrer un vrai scan de qualité **ET** tourner
gratuitement, mécaniquement, à chaque commit. Le jugement « est-ce qu'une autre IA s'y retrouve »
demande du raisonnement payant ; ses **indices**, eux, sont mécaniques. Exactement le précédent
d'ALWAYS-NEW-CODE, et la distinction est non négociable (Article 23).

## Ce qu'il regarde à chaque commit

Les blueprints seulement — même économie que ses voisins Gardiens sacrés : un balayage complet du dépôt à
chaque commit coûterait trop pour un outil censé être gratuit. Et c'est le seul endroit où une fuite
de spécificité est certaine d'être un défaut, puisque ces fichiers se déclarent exportables.

## État réel au premier passage (2026-09-22)

26 blueprints · **4 fuites de spécificité** · **7 blueprints mal construits** · **0 dépendance à un
outillage particulier**.

## La leçon de sa première exécution

Il déclarait d'abord **25 blueprints sur 26** en défaut. Le chiffre était l'alerte : son marqueur
cherchait « blueprint générique » alors que la convention réelle du dépôt est « blueprint
exportable ». Détecteur fautif, pas 21 défauts — deux minutes de vérification contre un rapport
entièrement faux (Article 25).

## La règle de l'écart écarté (correction du jour même)

Sur relecture de l'utilisateur : « ne jamais ecarter une zone sciemment laissée de coté par moi,
sauf avec mon accord explicite ». La première version filtrait tout écart marqué « écarté » sans
jamais demander qui l'avait écarté — l'agent pouvait donc faire taire un avertissement tout seul.
**Un Gardien sacré qui peut se taire de sa propre initiative ne garde plus rien.**

Désormais : seul un écart portant un **accord explicite daté** est filtré. Les autres reviennent, et
leur rappel grossit — rappel, puis question proposée à 3 passages, puis **question obligatoire à 5**.
Un écart marqué « écarté » sans accord est lui-même signalé dans le rapport.

## Mémoire

`docs/safe-export/memoire.json`, trois états : **vu**, **corrigé**, **écarté sciemment** (ce dernier
exigeant l'accord). Un **corrigé** qui réapparaît ressort en régression, jamais filtré.


## X6 — le POURQUOI à côté du QUOI, branché le 2026-09-23 (tâche #585)

**Ce qu'on a trouvé en ouvrant le sujet.** `findMecanismesSansRaison()` existait depuis la création
de cet outil, fonctionnait, était testée — et n'était appelée par **aucun `main()`**. Elle avait été
écrite pour l'exigence X6 du référentiel des standards, qui déclarait dans le même temps que X6
n'était vérifiée par « personne ». Les deux affirmations étaient vraies séparément et fausses
ensemble. Le détecteur échappait même au chasseur de détecteurs muets, parce qu'une fonction appelée
par la suite de tests compte comme protégée — ce qui est juste quand le test la fait tourner CONTRE
LE DÉPÔT, et faux ici : les deux assertions ne lui donnaient que deux chaînes littérales (leçon L16).

**Pourquoi la version large n'a pas été câblée.** Mesurée sur le vrai dépôt, elle rend **298**
fonctions exportées sans explication sur 74 fichiers. Ce n'est pas un signal, c'est un mur — et un
garde-fou qui accuse à tort cesse d'être lu (leçon L4). La plupart de ces fonctions portent leur
raison dans leur nom : `formatXp`, `loadVerdicts` n'ont aucun POURQUOI à écrire.

**Ce qui est câblé, et pourquoi ce périmètre.** L'Article 27 est précis sur ce qu'il craint : « un
mécanisme qui semble redondant ou trop prudent se fait supprimer par le prochain agent qui croit
nettoyer ». Cette description vise les GARDE-FOUS — un garde-fou ressemble toujours à du zèle tant
qu'on ignore le bug qu'il a coûté. `findGardeFousSansRaison()` s'y limite, et **le périmètre se LIT
plutôt qu'il ne se devine** : les fonctions que `standards.md` nomme comme vérificateurs, celles que
`lecons.md` nomme comme porteurs, plus la convention de nommage comme filet pour un garde-fou
qu'aucun registre ne cite encore.

**Le filtre par nom était DÉJÀ périmé, et c'est le contrôle qui l'a prouvé.** La première version ne
reposait que sur la convention (`find…`, `check…`, `audit…`, `verif…`). Confrontée aux registres,
elle ratait en silence huit garde-fous bien vivants — `doitIntercalerUnTourAutonome`,
`filtrerDejaTranches`, `relanceCircleTasks`, `etatConnexionProcessGardien`… C'est exactement la
panne que l'Article 24 décrit : une liste recopiée qui cesse d'être vraie sans prévenir. D'où la
lecture des registres plutôt que la confiance en la convention.

**Une seconde correction, trouvée en écrivant une fixture qui devait faire rougir le test.** La
fenêtre de trois lignes laissait fuir le commentaire du VOISIN : dans un fichier dense, les trois
lignes qui précèdent une fonction contiennent souvent la fin du commentaire de la fonction
précédente, et celle-ci passait alors pour expliquée. La correction remonte jusqu'à la première
ligne non vide et exige qu'elle soit un commentaire — l'explication doit toucher la fonction qu'elle
explique, ce qui est littéralement ce que l'Article 27 demande. Le compte réel passe de 42 à **59** :
dix-sept garde-fous étaient couverts par le commentaire d'un autre.

**La limite, déclarée plutôt que tue.** Ce chiffre dit une absence d'EXPLICATION, jamais une absence
de RAISON. Juger si un commentaire explique vraiment ou paraphrase le code reste hors de portée
d'une mécanique : c'est un signal pour une relecture humaine, jamais un verdict.

---

## Mesurer l'export, pas seulement le surveiller *(2026-09-26, tâche #906)*

Deux commandes nouvelles, toutes deux sous `node scripts/safe-export.mjs export`.

### Le croisement vitalité × blueprint — `mesurerLExportabilite()`

**Ce qui manquait n'était pas la liste des outils sans blueprint** : `findOutilsSansBlueprint()`
la produisait déjà. Ce qui manquait était de savoir **lesquels comptent**. Une liste plate de vingt
outils ne se hiérarchise pas ; trois outils VITAUX sans blueprint se traitent le soir même.

La vitalité est **relayée de LE-CLASSIFICATEUR** (`vitaliteDuParc()`), jamais recalculée ici — deux
mesures de vitalité qui divergeraient seraient pires qu'une seule (leçon L29).

**Premier passage réel (2026-09-26)** : 36 blueprints pour 88 fichiers · **19 bloquants** (vitaux ou
essentiels sans blueprint), dont les deux crochets git, `lib-shell`, `lib-json`, `report-template`,
`tool-usage`, `criticite` et la suite de tests. Couverture par niveau : vital 36 %, essentiel 67 %,
utile 44 %, optionnel 30 %.

**Ce qu'il ne dit pas** : un blueprint PRÉSENT n'est pas un blueprint SUFFISANT. Cette mesure compte
des fichiers, elle ne lit pas leur contenu — `findBlueprintsMalConstruits()` fait l'autre moitié, et
les deux ensemble ne remplacent pas une relecture.

### L'empreinte disque et sa projection — `empreinteDisque()`

**La taille se lit sur git, jamais sur `du`** : `du` mesure le conteneur (node_modules, caches,
navigateurs préinstallés — 2,9 Go dont presque rien n'appartient au projet), git mesure ce qui PART
réellement. Confondre les deux donnerait un chiffre cent fois trop gros et une panique sans objet.

**Premier passage réel** : 2,2 Mo au 2026-09-19 → 19 Mo au 2026-09-26, soit **×8,8 en sept jours**,
2,4 Mo/jour. Projections linéaires : 91 Mo à un mois, 164 Mo à deux, 898 Mo à un an.

`projeterLaCroissance()` **refuse** un rythme calculé sur moins de deux jours : une droite tirée
d'un seul point ressemble trait pour trait à une tendance. Et la limite voyage DANS le résultat
(`horsPortee`), jamais seulement dans un commentaire.

## Les kits d'export (depuis le 2026-09-26)

`node scripts/safe-export.mjs kits` — ou la section « LES KITS D'EXPORT » de `safe-export export`.

**SA DEMANDE** : « je veux ajouter à chaque outil/élément vital ou important à l'agence un kit
complet. Et un kit d'export moins conséquent (parce que moins pertinent) pour les autres, de façon
proportionnelle. [...] Je veux un système cohérent. »

**CE QUI EXISTAIT, ET CE QUI MANQUAIT.** Le croisement vitalité × blueprint existait déjà, mais il
est **binaire** : blueprint, ou pas. Or un blueprint seul ne s'exporte pas — il décrit une mécanique
que le destinataire devra réécrire. Ce qui part vraiment, c'est un ENSEMBLE.

### Les cinq pièces, et la question de destinataire à laquelle chacune répond

| Pièce | La question qu'elle ferme |
|---|---|
| le **blueprint** générique | comment ça marche, indépendamment de ce projet-ci ? |
| le **code** lui-même | qu'est-ce que je copie ? |
| la **fiche** d'instanciation | qu'est-ce qui est propre à CE projet, donc à adapter chez moi ? |
| le **registre** avec son index | où l'outil écrit-il, et sous quelle forme ? |
| les **dépendances** | que dois-je emporter d'autre pour qu'il démarre ? |

La cinquième est **DÉRIVÉE des imports réels**, jamais écrite : une liste de dépendances tenue à la
main se périme au premier import ajouté, et un kit qui en oublie une livre un outil qui ne démarre
pas — le plus décourageant des échecs, puisqu'il arrive avant que le destinataire ait pu juger quoi
que ce soit.

### LE KIT COMPLET EST DÛ À TOUS — sa correction du 2026-09-26

**Le premier système faisait varier le kit avec la vitalité. C'était faux, et il l'a vu :**

> « Je comprends ma logique de départ, mais elle est mauvaise : le résultat, c'est que les
> optionnels de l'agence ne pourront pas être réinstallés correctement si on les a intégrés à
> l'agence. Ça n'est pas logique. »

**Pourquoi c'est imparable** : le kit ne répond pas à « que perd l'Agence sans ce fichier ? » mais à
**« peut-on le remonter ailleurs ? »** — et cette question a la même réponse pour tout le monde. Un
optionnel exporté sans son plan est un optionnel irrécupérable, et il partira quand même puisqu'il
fait partie de l'Agence. Faire dépendre la réinstallabilité de l'importance produisait exactement
cette absurdité : on emporte le fichier, et on ne sait plus le remonter.

**Pièces dues, les mêmes pour tous** : blueprint + code + fiche + registre + dépendances.

**Deux soupapes, jamais une dispense implicite :**

1. **Une PIÈCE peut être SANS OBJET.** Le registre n'est dû qu'à un fichier qui ÉCRIT quelque
   chose : une bibliothèque n'a rien à historiser, et lui réclamer un index reviendrait à réclamer
   un document vide. « Sans objet » et « manquant » se ressemblent dans un compte et appellent
   l'inverse l'un de l'autre — ils sont séparés, avec la raison.
2. **Un FICHIER peut être dispensé, avec sa raison ÉCRITE.** Trois cas aujourd'hui : les crochets
   git (le CÂBLAGE de l'Agence à ce dépôt-ci, réinstallés par `hooks/install.mjs`),
   `install-pnpm.sh` (il décrit CETTE machine) et `run-framework` (il sert le produit, rang Hors
   Agence). **Un dispensé n'a aucun taux** : le compter comme une réussite rendrait la couverture
   flatteuse au lieu d'exacte.

**Et la vitalité, alors ?** Elle reste l'axe qui dit ce que l'Agence perd sans le fichier — donc
elle donne l'**ORDRE de réparation** des kits manquants. Une priorité, jamais une dispense.

### LA DISTINCTION QU'IL A CORRIGÉE LUI-MÊME, et elle n'est pas verbale

Les quatre niveaux qualifient l'importance d'un fichier **POUR LE FONCTIONNEMENT DE L'AGENCE**,
jamais son exportabilité. Un fichier peut être vital au fonctionnement et trivial à emporter (une
bibliothèque de dix lignes), ou secondaire au fonctionnement et lourd à transmettre. Le kit est la
**conséquence** du niveau : une seule échelle, lue deux fois, plutôt que deux échelles qui
finiraient par dire deux choses du même fichier.

L'axe lui-même vit chez LE-CLASSIFICATEUR (`vitaliteDuParc()`, axe C du référentiel
d'organisation) ; SAFE-EXPORT en déduit le kit. Frontière nette, jamais deux mesures de vitalité.

### Ce qu'il ne dit pas

**Un kit complet n'est pas un kit suffisant** : la mesure compte des pièces présentes, elle ne lit
jamais leur contenu et ne garantit pas que le portage réussira. Elle dit ce qui est **prêt** à
partir.

### Les gabarits

`docs/templates/` porte le gabarit de chaque pièce rédigée (blueprint, fiche, index de registre).
La commande dit OÙ créer la pièce manquante ; le gabarit dit QUOI y mettre — et une pièce dont on
ne sait pas quoi écrire ne s'écrit jamais.

### Mesure réelle : de la correction au 100 %, le même jour

89 fichiers : **82 kits dus, 7 dispensés** avec raison.

| Moment du 2026-09-26 | Kits complets | Alerte |
|---|---|---|
| juste après la correction de la règle | 33 / 82 | 🟠 EXPORT DÉGRADÉ |
| après les vitaux et essentiels | 55 / 82 | 🟡 EXPORT POSSIBLE |
| après les utiles | 69 / 82 | 🟡 EXPORT POSSIBLE |
| **à 20h18** | **82 / 82** | **✅ EXPORT PRÊT** |

| Ordre de réparation | À jour | Taux moyen |
|---|---|---|
| 🔴 1. vital | 37/37 (100 %) | 100 % |
| 🟠 2. essentiel | 3/3 (100 %) | 100 % |
| 🟡 3. utile | 25/25 (100 %) | 100 % |
| ⚪ 4. optionnel | 17/17 (100 %) | 100 % |

**Ce que la correction avait rendu visible** : les optionnels étaient à 100 % sous l'ancienne règle,
et ils sont retombés à 18 % quand le kit complet leur a été dû. Le premier chiffre n'était pas
faux — il mesurait une exigence si basse qu'elle ne demandait rien. **C'est exactement l'angle mort
qu'il a vu**, et c'est ce qui rend le 100 % d'aujourd'hui différent de celui du matin.

**Coût réel du comblement** : 105 documents annoncés, écrits dans la journée — 44 blueprints,
43 fiches, 18 index de registre. Chiffre mesuré avant, vérifié après.

**Le test a remplacé son propre contraire.** Il exigeait le matin qu'il RESTE des kits non tenus
(« un test qui ne tourne que sur un état propre ne prouve rien »). L'état propre est arrivé : ce qui
vaut désormais d'être verrouillé, c'est lui. L'invariant « un optionnel incomplet n'est jamais
filtré » a migré sur une fixture — laissé sur le réel, il aurait puni le succès.

### Le faux positif qui faisait écrire des doublons *(2026-09-26)*

La mesure dérivait le chemin des documents du NOM DU FICHIER. Trois outils portent un nom d'usage
différent de leur nom de fichier — `kpi-report.mjs` s'appelle « Tableau de bord »,
`check-gemini-quota.mjs` « Smart Breaker », `the-screener-capture.mjs` est le mécanisme de capture
de THE-SCREENER — et leurs documents existaient depuis des semaines.

**Ce faux positif ne fait pas perdre une information : il fait PRODUIRE UN DOUBLON**, et un doublon
de document diverge du premier au premier changement.

Corrigé par `aliasDocumentaires()`, qui **LIT** l'inventaire documentaire de CLAUDE.md — colonne
script, colonne blueprint, colonne fiche. Une liste d'alias recopiée ici aurait dit la même chose
une seconde fois et se serait périmée au premier renommage (Article 24). Un script absent de la
table garde la dérivation par son nom, qui reste le cas majoritaire. **Une table qui ne parse plus
rend `null`, jamais une carte vide** : « je n'ai pas su lire » et « il n'y a pas d'alias » appellent
l'inverse l'un de l'autre.

## Le kit de l'AGENCE elle-même *(2026-09-26)*

**Sa question, et elle a trouvé trois choses d'un coup** : « est-ce que l'agence en elle meme est
couverte par ce principe de kit d'export ? question : qui scanne les outils et l'agence pour
verifier ? quel outil ? je veux que ce scan soit fait par un outil à chaque ronde circle avec
rapport et alerte ».

**Quatre-vingts kits d'outils complets ne font pas une Agence exportable.** Le destinataire
recevrait quatre-vingts plans de pièces détachées et aucun plan de la machine : il saurait ce que
fait chaque outil, et rien de la façon dont ils s'appellent, ni par où commencer, ni ce qu'il faut
installer pour que le premier démarre.

### Les six pièces, et la question à laquelle chacune répond

| Pièce | Fichier | La question du destinataire |
|---|---|---|
| le plan | `docs/agence-blueprint.md` | comment les outils s'articulent-ils, et par où commence-t-on ? |
| l'installation | `docs/agence-installation.md` | que dois-je faire, dans l'ordre, pour qu'elle tourne chez moi ? |
| la carte | `docs/referentiel/classification-agence.md` | qui compose l'équipe, et que vaut chacun ? |
| l'organisation | `docs/referentiel/organisation-agence.md` | quels rangs, quelles familles, quels axes ? |
| les standards | `docs/referentiel/standards.md` | à quoi reconnaît-on qu'un outil est à niveau ? |
| les leçons | `docs/referentiel/lecons.md` | quelles erreurs n'ai-je pas besoin de refaire ? |

Les deux premières n'existaient pas avant sa question. Elles ont été écrites le jour même :
**67 % → 100 %**.

### LE FAUX VERT, et pourquoi la correction change la NATURE du contrôle

`mesurerLExportabilite()` vérifiait l'existence de `docs/agence-exportable-conception.md` et
concluait « le blueprint de l'Agence EXISTE ». Or ce fichier dit LUI-MÊME, dans ses dix premières
lignes, qu'il n'est pas ça : c'est le carnet d'idées du projet **suivant**. Le contrôle lisait la
présence d'un fichier et en déduisait la présence d'un contenu — le faux vert le plus classique, et
il portait sur la pièce la plus importante de tout l'export.

La correction n'est donc pas un chemin de plus. Pour cette pièce seule, on exige qu'elle **se
DÉCLARE** (`MARQUEUR_PLAN_AGENCE`) : une ligne qui dit ce qu'elle est. C'est peu, et c'est déjà
beaucoup plus qu'un test d'existence. Les cinq autres restent vérifiées sur leur seule existence, et
`horsPortee` le dit noir sur blanc plutôt que de le laisser deviner.

**Trois états, jamais deux** : une pièce absente, une pièce présente hors sujet et une pièce
illisible produisent trois messages différents — et l'illisible ne compte ni comme tenue ni comme
manquante (elle sort en `nonVerifiees`).

## L'ALERTE d'exportabilité, et sa place à la Ronde

**Le rapport existait ; l'alerte manquait, et la différence est tout** : un rapport de quatre-vingts
lignes se survole, une alerte de trois lignes se lit.

`alerteExport()` rend un verdict unique, **du plus grave au moins grave**, parce qu'un export bloqué
par l'absence du plan de la machine ne se rattrape pas en complétant des kits d'outils :

| Verdict | Quand |
|---|---|
| 🔴 EXPORT BLOQUÉ | une pièce du kit de l'Agence manque — **passe avant tout le reste** |
| 🟠 EXPORT DÉGRADÉ | des kits incomplets sur des fichiers VITAUX ou ESSENTIELS |
| 🟡 EXPORT POSSIBLE | il ne reste que des trous sur des fichiers utiles ou optionnels |
| ✅ EXPORT PRÊT | tous les kits dus sont tenus, et l'Agence porte le sien |

Elle **se tait quand tout est complet** (leçon L6 : une alerte qui parle toujours cesse d'être une
alerte) — mais la ligne de verdict reste imprimée dans tous les cas, et « PAS MESURÉE » ne
ressemble jamais à « aucune alerte ».

### Qui la lance, et à quel rythme

**Item de Ronde `safe-export-kits`**, thème « KPI & scans », gratuit, dépôt dans
`docs/safe-export/ronde/`. Commande : `node scripts/safe-export.mjs kits`.

**Pourquoi il a fallu l'ajouter alors que SAFE-EXPORT tourne déjà à chaque commit** — et c'est la
leçon que cet ajout laisse derrière lui. Son registre était **explicitement exclu** de la Ronde
(`CIRCLE_AUTO_COVERED_REGISTRIES`), au motif exact : « Gardien sacré du code (couche légère) :
tourne automatiquement à CHAQUE commit […] jamais un item de Ronde ». C'était vrai de **sa couche
légère** (raisons perdues, fuites de spécificité) et faux de tout le reste : la mesure des kits ne
tournait à aucun commit, et personne ne la réclamait jamais. **Une exclusion juste sur UNE couche
d'un outil finit par le dispenser de TOUTES.** L'exclusion a été retirée ; le registre est
désormais couvert pour de vrai.

### Mesure réelle au jour de sa création

Kit de l'Agence **100 %** (après écriture des deux pièces manquantes). Fichiers :
**🟠 EXPORT DÉGRADÉ** — 4 kits incomplets sur des VITAUX/ESSENTIELS, 27 ailleurs.
