# SAFE-EXPORT — instanciation propre à ce projet

> **SON TEXTE DE RÉFÉRENCE, depuis le 2026-09-29 : `docs/loi-de-l-agence.md`.** SAFE-EXPORT mesurait
> l'exportabilité depuis sa création **sans avoir de loi à citer**. Elle existe maintenant :
> *« L'Agence sert la finalité de celui qui l'emploie, jamais la sienne. »* Ce que cet outil vérifie
> n'est donc plus une précaution de bon sens, c'est la tenue d'un texte suprême — et sa définition
> mesurable est simple : l'Agence a aujourd'hui UN client, exportable veut dire qu'un DEUXIÈME
> serait possible.

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

## RÈGLE — on ne parle JAMAIS d'exportabilité sans donner la portabilité dans la même phrase

*(Posée par l'utilisateur le 2026-09-27 : « noter quelque part que lorsqu'on parle d'exportabilité,
ca doit systématiquement embarquer/inclure la PORTABILITE ».)*

**L'exportabilité seule est un chiffre trompeur**, et ce n'est pas une opinion : mesurée le jour où
la règle est née, elle valait 100 % pendant que la portabilité valait 49 %. Annoncer le premier sans
le second, c'est annoncer que l'Agence est prête à partir alors que la moitié ne tournerait pas.

**Conséquence opératoire, valable pour l'outil comme pour l'agent** : tout rapport, tout compte
rendu, toute ligne de KPI qui cite un taux d'exportabilité **cite le taux de portabilité à côté**.
Le rapport `safe-export export` les imprime déjà l'un sous l'autre, et c'est délibéré : les séparer
rendrait la confusion possible à nouveau.

**Les deux mots, une fois pour toutes** :
- **EXPORTABILITÉ = EXTRACTION.** Tout est-il dans le carton ? (blueprint, fiche, registre)
- **PORTABILITÉ = COMPATIBILITÉ.** Est-ce que ça s'adapte au nouvel endroit ?

## EXPORTABILITÉ ET PORTABILITÉ — deux mesures, jamais une moyenne (2026-09-27, tâche #1034)

### L'image qui rend la distinction évidente

**Un déménagement.**

- **L'EXPORTABILITÉ, c'est le carton.** Le meuble est emballé, la notice de montage est dedans, le
  sachet de vis est étiqueté. Rien ne manque. C'est ce que SAFE-EXPORT mesurait déjà : chaque outil
  a-t-il son blueprint, sa fiche, son registre ?
- **La PORTABILITÉ, c'est ce qui se passe une fois le carton ouvert dans le nouvel appartement.**
  L'armoire construite pour un plafond de 2,60 m n'entre pas dans une pièce de 2,40 m. Le carton
  était parfait. L'armoire est inutilisable.

**EZECHIEL-LES-TESTS est cette armoire**, et c'est ce qui a fait naître la mesure : déclaré
exportable le jour même de sa création, kit complet, blueprint, fiche, registre — et le chemin du
filet qu'il enquête écrit EN DUR dans son code. Sur un autre dépôt, il cherche un fichier qui
n'existe pas.

### Les chiffres du 2026-09-27, côte à côte

| Mesure | Résultat | Ce qu'elle dit |
|---|---|---|
| **Exportabilité** | **100 %** (40/40 vitaux, 3/3 essentiels, 25/25 utiles, 16/16 optionnels) | chaque outil a ses pièces pour partir |
| **Portabilité** | **49 %** — 42 scripts sur 82 portent un chemin ou un nom de CE dépôt dans leur code | la moitié ne tournerait pas telle quelle ailleurs |

### Pourquoi les deux chiffres ne doivent JAMAIS fusionner

Un taux unique « d'exportabilité » à 95 % se lit comme **une garantie que 95 % de l'Agence
fonctionnera ailleurs**. C'est faux, et c'est exactement le patron des leçons L5/L11 : deux
questions différentes, deux mesures, jamais une moyenne. Fusionnés, les deux chiffres donneraient
un nombre rassurant qui ne décrit aucune réalité — et on ne découvrirait le problème qu'à
l'arrivée, c'est-à-dire au pire moment.

### Les cinq liens qui retiennent un outil ici, et ce que chacun coûte

| Lien | Combien | Ce qu'il coûte une fois ailleurs |
|---|---|---|
| `docs/referentiel/` | 22 | un autre projet range ses documents autrement |
| le filet (`check-house.mjs`) | 17 | l'outil cherche un fichier qui n'existe pas |
| `docs/suivi/` | 17 | l'outil lit un dossier absent et rend zéro — **ce qui se lit comme « rien à signaler »** |
| la charte (`CLAUDE.md`) | 16 | un autre projet nomme sa charte autrement, ou n'en a pas |
| les personnages | 16 | l'outil parle de quelqu'un qui n'existe pas dans le projet d'accueil |

Le troisième est le plus dangereux : un outil qui lit un dossier absent ne plante pas. Il rend zéro,
et zéro ressemble trait pour trait à « tout va bien ».

### Qui gère la portabilité à l'Agence

**SAFE-EXPORT**, et c'est délibéré : c'est le même sujet, donc le même rapport. Les deux chiffres
s'affichent l'un sous l'autre dans `node scripts/safe-export.mjs export`, précisément pour qu'on ne
puisse pas lire l'un en croyant lire l'autre. **Aucun outil nouveau n'a été créé** — l'Article 31
demande d'étendre plutôt que de construire quand un outil couvre déjà le terrain.

### La limite, déclarée dans le résultat plutôt qu'en note de bas de page

Un balayage de texte trouve les chemins écrits en dur. **Il ne prouve jamais qu'un outil sans chemin
en dur FONCTIONNE ailleurs.** « Portable » veut donc dire ici « rien ne le retient visiblement »,
jamais « vérifié à l'arrivée ». La seule preuve serait de le lancer contre un autre dépôt — c'est
l'étape 3 du plan ci-dessous, et elle n'est pas faite.

## Les quatre formes d'une cible remplaçable (2026-09-28, tâche #668)

**LE POINT DE DÉPART** : 14 outils accusés de n'être pas portables à l'ouverture de #668, 8 encore
après le premier passage. Instruire les huit derniers **un par un**, comme l'Article 19 l'exige, a
montré que **la moitié n'avait aucun défaut** : leur cible était déjà remplaçable, sous une forme
que le détecteur ne connaissait pas.

| Forme | Exemple réel | Ce qui la rend portable |
|---|---|---|
| **1. Le vocabulaire du paysage** | `{ chemin = … }`, `{ root = … }` | forme historique, inchangée |
| **2. Une cible en ARGUMENT** | `route-booster` : `process.argv[2] ?? "app/api/lia/route.ts"` | on la change en tapant un mot après le nom de l'outil |
| **3. Un défaut de paramètre qui est une CONSTANTE EXPORTÉE** | `check-level-target` : `(texte, nodes = SENSITIVE_NODES)` | remplaçable par construction, et **publiée** pour qu'un projet d'accueil sache ce qu'il remplace |
| **4. (qui n'en est pas une) Le nom est dans une PHRASE** | `check-gemini-quota` : « L'app (lib/lia.ts) n'appelle que Gemini » | ce n'est pas une cible, c'est une note au lecteur |

**LA QUATRIÈME EST LA PLUS SUBTILE, et elle comble une incohérence du détecteur lui-même** : il
retirait déjà les COMMENTAIRES, en disant exactement pourquoi (« les commentaires racontent souvent
l'histoire du projet sans que le CODE en dépende »). Il ne retirait pas les **messages**, qui sont
la même chose adressée à quelqu'un d'autre. C'est la leçon déjà payée en #832 : **une MENTION n'est
pas un USAGE**.

**POURQUOI ÉLARGIR ICI QUAND LA PREMIÈRE MOITIÉ DE #668 AVAIT TRANCHÉ L'INVERSE** (« j'adopte le
vocabulaire plutôt que d'élargir la sonde ») : là-bas il s'agissait de paramètres NEUFS que
j'écrivais, et adopter le vocabulaire ne coûtait rien. Ici, renommer `nodes` en `{ noeuds = … }`
changerait la signature de fonctions déjà appelées et déjà testées — **on casserait du code qui
marche pour plaire à une sonde**. Et la forme 3 n'est pas n'importe quel paramètre : le défaut doit
être une constante **exportée**, ce qui est précisément la preuve qu'elle est faite pour être
remplacée.

### Les quatre vrais défauts, corrigés en donnant le vocabulaire — jamais en retirant la lecture

- **`check-argus`** : `readFileSync(join(ROOT, "lib/life.ts"))` en dur dans son `main()`. Son métier
  — repérer un champ déclaré et jamais lu — n'a rien de propre à ce jeu. Passe en
  `{ chemin = FICHIER_DU_TYPE_SUIVI, dossiers = DOSSIERS_A_BALAYER }`, les deux exportés.
- **`always-new-code`** : `THEMES` était déjà injectable, **pas sa carte** `THEME_PRIMARY_FILE` — un
  projet d'accueil pouvait donner ses thèmes mais pas dire quel fichier chacun désigne. *Une moitié
  de portabilité ressemble à la portabilité entière tant qu'on ne l'essaie pas.*
- **`find-booster`** : sa carte concept → mots-clés est le VOCABULAIRE de ce projet (ses thèmes, ses
  personnages). Elle est désormais exportée et injectable.
- **`hooks/check-last-commit`** : accusé à tort — voir ci-dessous.

### Deux versions de ma propre correction rattrapées par les contre-tests

Élargir un détecteur est dangereux : on troque un faux rouge contre un faux vert, qui coûte bien
plus cher. Deux tentatives ont été prises en flagrant délit, et c'est la raison d'être du contre-test
« vraiment en dur », écrit **en premier** :

1. **Le comptage de MOTS DE LA LIGNE** rangeait
   `const lifeSource = readFileSync(join(ROOT, "lib/life.ts"), "utf8");` parmi les phrases : huit
   identifiants suffisaient. **Un faux vert sur un vrai chemin en dur.** Le critère porte désormais
   sur la CHAÎNE : au moins 40 caractères et 4 espaces — une cible n'en a aucun.
2. **Le découpage des chaînes du FICHIER entier** par expression régulière : une apostrophe
   française désynchronisait l'appariement, avalait des pans de code et effaçait les marqueurs
   `{ chemin = … }` de quatre outils parfaitement portables — Abraham, circle-tasks, the-equalizer et
   SAFE-EXPORT lui-même se sont mis à être accusés. **Quatre faux rouges créés en voulant en retirer
   un.** La lecture se fait ligne à ligne, avec un motif par type de guillemet, et ne peut donc plus
   rien avaler.

### Le second registre d'exemption, qui existait et que le détecteur ne lisait pas

Le dépôt porte **deux** registres de « ceci ne part pas » : `NE_PART_PAS_ET_C_EST_NORMAL` (des outils
dont le SUJET est le jeu) et `EXEMPTES_DU_KIT` (des fichiers qui ne quittent pas ce dépôt — crochets
git, script d'installation, lanceur du produit). Le détecteur n'honorait que le premier et
reprochait donc à `scripts/hooks/check-last-commit.mjs` de n'être pas portable, alors que la charte
déclare noir sur blanc, **avec sa raison**, qu'un crochet git est le câblage de l'Agence à ce
dépôt-ci. **Accuser un fichier dont le projet a déjà décidé qu'il reste est le faux rouge le plus
coûteux : il crée du travail qui ne doit pas être fait** (leçon L4). La correction LIT le second
registre au lieu d'en recopier le contenu (Article 24).

### Le résultat, mesuré

| | avant #668 | avant cette passe | après |
|---|---|---|---|
| Scripts non portables | 14 | 8 | **0** |
| Portabilité **reconfigurable** | — | 91 % (78/86) | **100 % (86/86)** |
| Exportabilité globale | — | 88 % | **90 %** |

**LA LIMITE, DÉCLARÉE** : la mesure reste au grain du FICHIER — un outil qui offre une option quelque
part est déclaré reconfigurable même si une autre de ses cibles reste en dur. C'était déjà vrai de
la forme historique ; l'élargissement ne l'aggrave pas, mais ne le corrige pas non plus. Et le
détecteur pose **une question, jamais un verdict** : savoir si un couplage au jeu est un défaut ou
la nature même de l'outil demande de lire ce qu'il fait.

## Le banc témoin mesurait pour personne — et il comptait six faux échecs (2026-09-28, tâche #902)

**Sa demande, dans le gros prompt** : « Je veux un calcul qui donne le pourcentage d'exportabilité
de l'agence ». Ce calcul existait, sur **5 dimensions mesurées sur 7**. Il s'en mesure **6 sur 7**
aujourd'hui, et la sixième vaut **100 %** — mesurée pour de vrai, jamais estimée.

### Le défaut : la leçon L2 dans sa forme la plus pure

Le banc témoin **existe**. Il clone un vrai dépôt étranger (`github.com/sindresorhus/slugify`,
figé sur `3b17b2e`), y installe l'Agence entière, lance tous les outils et rend un vrai chiffre.

Et le rapport central écrivait `temoin: { mesurable: false }` **en dur** — donc affichait « aucune
mesure disponible aujourd'hui » quelques secondes après que la mesure ait été faite. **Une mesure
qui n'est pas rendue n'existe pas.**

**La correction** : le banc écrit son passage dans `docs/safe-export/banc-temoin-passages.json`, le
rapport le lit. Un registre plutôt qu'un recalcul, parce que le banc prend des minutes et demande le
réseau là où le rapport central doit rester gratuit et instantané — il rassemble, il ne recalcule
jamais (leçon L29).

**La fraîcheur est part de la mesure**, jamais un détail : un taux mesuré sur une Agence de la
semaine dernière décrit la semaine dernière. La lecture demande donc à git si `scripts/` a bougé
entre le commit mesuré et celui d'aujourd'hui. C'est un **fait**, jamais un seuil d'âge choisi à la
main (Article 24) — et un git muet dit « fraîcheur inconnue » plutôt que d'absoudre par défaut
d'information.

### Le banc comptait huit échecs, dont six n'en étaient pas

Chacune des trois familles est une erreur du **mesureur**, jamais du mesuré — exactement comme le
quatrième verdict né le 2026-09-27.

| Famille | Ce que le banc lisait | Ce que c'est vraiment |
|---|---|---|
| **un refus propre** | `check-gemini-quota` sortait en 1 | `.dev.vars` porte les secrets LOCAUX : il est absent de **tout** dépôt fraîchement cloné, y compris celui-ci chez quelqu'un d'autre. Un outil qui inventerait un résultat sans sa clé serait bien pire. |
| **un paquet npm absent** | trois outils mouraient sur `ERR_MODULE_NOT_FOUND` | le banc copie `scripts/` **et rien d'autre**, délibérément. C'est une limite du BANC. |
| **les installeurs d'ici** | `install-ci`, `pnpm-install` comptés comme non portables | ils décrivent la machine d'ici et n'ont jamais eu à partir — le registre des dispenses les décrivait déjà **mot pour mot** sans les contenir (leçon L37 : on avait corrigé l'occurrence `install-pnpm.sh`, pas la classe). |

**Le critère du refus propre est un FAIT sur la sortie, jamais une liste de mots** (corollaire de
l'Article 17) : un outil qui **meurt** laisse une trace de pile de Node, un outil qui **refuse**
imprime une phrase et s'arrête. Aucune liste de vocabulaire n'aurait couvert le prochain cas ;
cette distinction-là, si. Le contre-test le prouve sur un vrai crash dont le message contient
pourtant le mot « introuvable ».

**Le paquet absent SORT du dénominateur**, jamais du bon côté ni du mauvais : le compter comme un
succès serait un faux vert, le compter comme un échec facturerait à l'Agence un choix du banc. *On
ne mesure pas ce qu'on n'a pas mis en condition de répondre.*

### Et deux VRAIS défauts, corrigés

`check-argus` (qui lit `lib/life.ts`) et `route-booster` (dont la cible par défaut est
`app/api/lia/route.ts`) **mouraient sur un ENOENT** en arrivant sur un dépôt étranger. Tous deux
déclarent désormais leur non-mesure, avec la phrase que tout le paysage emploie : « ce n'est PAS
aucun résultat », parce que les deux se lisent à l'opposé l'un de l'autre. Vérifiés en **lançant**,
jamais en relisant (Article 25).

### La progression, et ce qu'elle doit à quoi

**65/73 (89 %) → 67/70 (96 %) → 68/68 (100 %).** Le rapport **dit** que le dénominateur a bougé, et
il le dit dans la phrase que le lecteur lit, pas seulement dans un champ : un taux qui monte sans
dire que sa population a changé est un chiffre qui **ment poliment**. Sur les onze points gagnés,
deux viennent de vrais correctifs et le reste d'une mesure enfin juste.

### Ce qu'il faudrait pour aller plus loin, écrit ici pour que personne ne le redécouvre

Installer les dépendances déclarées **dans le dépôt témoin** avant de lancer, ce qui rendrait les
trois « paquet absent » mesurables. Ce n'est pas fait, parce que ça change le témoin — or tout son
intérêt est d'être **pauvre en outillage**.

## La septième dimension mesurait sans rendre de chiffre (2026-09-28, tâche #902)

**Même famille exacte que le banc témoin, le même jour** — et c'est ce qui rend la leçon utile
plutôt qu'anecdotique.

`relaisDeModele()` rendait `mesurable: true` **depuis toujours**. Il lisait les documents, comptait
les présents, cherchait les dépendances à un outillage particulier. Mais il ne rendait **aucun
taux**, et l'extracteur de la dimension cherchait `m.relais.taux`. Le rapport central affichait donc
« NON MESURÉ » sur une mesure faite. **Produire et ne pas rendre, c'est ne pas mesurer** (leçon L2).

**L'exportabilité se calcule désormais sur 7 dimensions sur 7**, ce qui était sa demande.

### Les deux conditions comptent, jamais une seule

Une dimension du relai n'est acquise que si **tous** ses documents existent **et** qu'aucun
n'EXIGE un outillage particulier. Un document parfaitement écrit qui dit « crée une tâche avec tel
outil » est inapplicable pour une IA qui ne l'a pas : le compter bon serait le faux vert le plus
coûteux du lot, puisqu'il porte sur **la reprise elle-même** (Article 27).

### Le chiffre est honnête, et il fait BAISSER le total

**67 %** — et l'exportabilité globale passe de 91 % à 88 %. Ce n'est pas une régression : c'est une
absence remplacée par un fait. Deux dimensions sur trois sont acquises ; la troisième échoue parce
que **20 lignes** de `CLAUDE.md` et `docs/regles-de-travail.md` exigent un outillage que le
successeur n'aura peut-être pas.

**Le coût est chiffré en lignes à reformuler**, jamais laissé en « il manque quelque chose » : une
dimension qui échoue pour vingt lignes n'appelle pas le même geste qu'une qui échoue pour une, et
sans ce nombre le lecteur ne peut pas décider si c'est une minute ou une soirée.

**Ce que fermer cet écart demande, et pourquoi ce n'est pas un geste d'agent** : reformuler ces
lignes pour qu'elles nomment l'INTENTION (« une vraie fenêtre de questions à choix ») avec l'outil
en exemple, plutôt que l'outil comme exigence. Ce sont des règles de travail et des Articles de la
charte — leur formulation appartient à l'utilisateur.

### L'intitulé a été resserré en même temps, et c'était nécessaire

« Une AUTRE IA peut-elle reprendre l'Agence sans cette conversation-ci ? » est la **question**, pas
ce qui se mesure. Un intitulé qui promet la réponse ferait lire 100 % comme « la reprise est
assurée », alors qu'aucune mécanique ne peut le dire. La dimension s'appelle désormais « le matériel
de reprise est-il là », et le `horsPortee` garde sa consigne du 2026-09-26 : ne pas se servir de sa
propre compréhension comme étalon — elle prouve qu'on était là, jamais qu'un modèle arrivant à froid
s'en sortira.

## L'étape 2 du plan de portabilité : classer avant de corriger (2026-09-28, tâche #902)

**Elle était écrite depuis le 2026-09-27 et jamais faite.** La stratégie d'export la nomme noir sur
blanc : « c'est l'étape que personne ne saute impunément — traiter les 43 comme 43 bugs serait un
chantier absurde ». Et le rapport continuait d'afficher **un** nombre, 43, sans dire combien
appellent vraiment du travail.

**Un nombre indifférencié ne se traite pas : il décourage**, ce qui est la façon la plus sûre de ne
jamais commencer.

### Le résultat, et il change complètement la lecture du 48 %

| Catégorie | Combien | Le geste |
|---|---|---|
| **LÉGITIMEMENT LIÉ** | 5 | rien — l'outil sert le produit ou ne quitte pas ce dépôt, et c'est écrit dans les deux registres de dispense |
| **PARAMÉTRABLE** | 38 | rien de plus qu'un argument au moment d'arriver ; le comportement d'ici ne change pas d'un iota |
| **À DÉCOUPLER** | **0** | — |

Les 43 mentions brutes restent : ce sont des **valeurs par défaut** et des liens assumés, pas des
chemins qui retiennent l'Agence. Le taux brut de 48 % est inchangé et reste affiché — il mesure la
question la plus sévère — mais le chiffre qui décide d'un geste est désormais **zéro**.

**Le classement se DÉRIVE, il ne s'énumère pas** (Article 24) : les deux registres de dispense sont
lus, et `estParametrable()` — écrit pour #668, déjà éprouvé sur 86 scripts — répond à la seconde
question. Aucune liste tenue à la main, donc rien qui se périme au prochain outil.

### Deux outils paramétrés pour de vrai, et un détecteur qui les accusait quand même

`hyper-scan-checkpoint` et `tool-brain` étaient **les deux seuls du dépôt** à n'offrir aucun moyen
de changer leur cible. Leurs repères sont désormais des constantes exportées avec la valeur d'ici
pour défaut.

**Et le détecteur a continué de les accuser APRÈS correction** — le signal le plus clair qu'il
regarde la mauvaise chose (leçon L4). Son motif n'acceptait que `(` ou `,` avant un nom de
paramètre, si bien qu'un **premier paramètre déstructuré** — `main({ charte = CHARTE_PAR_DEFAUT })`,
la forme la plus courante de ce dépôt — passait pour non paramétrable. La garde qui compte reste
intacte, et le contre-test la vérifie : sans `export const`, rien n'est absous, parce qu'un projet
d'accueil ne peut pas surcharger ce qu'il ne peut pas importer.

### La limite, déclarée plutôt que découverte plus tard

« PARAMÉTRABLE » veut dire que l'outil expose **au moins une** cible en paramètre, pas que **chacune**
de ses mentions en soit une. C'est un indice fort — un outil qui a pris l'habitude de paramétrer une
cible l'a généralement prise pour les autres — **jamais une preuve par mention**. Le trancher
exigerait de relier chaque littéral à son paramètre, ce qui coûte une analyse de flot de données ;
le dire coûte une phrase.

### Un garde-fou que l'usage légitime faisait crier

`safe-export rapport` écrit un fichier daté à **chaque** passage, et l'index de son propre registre
restait en arrière — si bien que le filet virait au **rouge dès qu'on consultait l'outil**. Même
défaut que le seuil recopié trouvé la même nuit : un garde-fou que l'usage légitime fait crier
apprend à ne plus s'en servir (leçons L4/L6). Le rapport met désormais l'index à jour lui-même.
**Déclarer ce qu'on vient d'écrire est le travail de celui qui l'écrit, jamais du commit suivant.**

## LA TUYAUTERIE : l'Agence l'emporte-t-elle, ou se branche-t-elle sur celle de l'hôte ? (2026-09-28)

**Sa question, posée en passant et qui méritait un mécanisme** : « la tuyauterie de l'agence, elle
est exportable, ou bien l'agence se branche sur la tuyauterie du projet qu'elle rejoint, ou bien les
questions d'infrastructure dépendent des cas ? » Puis, en voyant la réponse : « **ce genre de
question devrait être anticipé par safe-export** ».

```
node scripts/safe-export.mjs tuyauterie
```

**TROIS COUCHES, ET LA RÉPONSE EST « LES TROIS À LA FOIS »** — ce qui est exactement sa troisième
hypothèse, et c'est la bonne :

| Couche | Ce que c'est | Mesure |
|---|---|---|
| **EMPORTÉE** | la tuyauterie interne, qui part avec l'Agence (`lib-shell`, `lib-json`, `report-template`…) | 67 scripts |
| **EXIGÉE** | ce que l'hôte doit fournir : Node, git, un shell | 72 scripts |
| **ADAPTÉE** | ce qui se branche sur un service extérieur — une clé d'API, un runtime | 5 scripts |

**Mesure : 84 scripts, 94 % d'indépendance.**

**LE COMMENTAIRE ET LES CONSTANTES SONT RETIRÉS AVANT DE MESURER**, et ce n'est pas un détail :
**mentionner n'est pas dépendre**. Un script qui EXPLIQUE la dépendance d'un autre dans son
commentaire passerait sinon pour en dépendre.

**UN DÉFAUT TROUVÉ EN AFFINANT LE MOTIF, ET IL A FAIT BAISSER LE CHIFFRE** : `\bGEMINI\b` ne matchait
pas `GEMINI_API_KEY`, parce que le souligné EST un caractère de mot — **la dépendance la plus
courante du dépôt échappait à la mesure**. Corrigé : 96 % → 94 %, 3 → 5 adaptateurs. *Le chiffre a
baissé parce que la mesure est devenue vraie, jamais parce que quelque chose s'est dégradé.*

## LE CONTRÔLE D'ACCUEIL : et si l'hôte ne peut pas fournir ? (2026-09-28)

**Sa question suivante, immédiate** : « ok, et si l'hôte ne peut pas fournir les éléments, alors
safe-export résout la question et met ce qu'il faut en place, c'est comme ça ? »

```
node scripts/safe-export.mjs accueil
```

**LA RÉPONSE EST NON, ET LE REFUS EST LE SERVICE.** SAFE-EXPORT **constate** ce que la machine offre
et ce qui manque ; il n'installe rien. Installer Node ou git à la place de quelqu'un sur sa propre
machine est précisément le genre de geste irréversible que ce projet n'accorde à aucun outil.

`PREREQUIS_DE_L_HOTE` distingue le **requis** (node, git, un shell — sans eux rien ne tourne) du
**facultatif** (python3, dont l'absence éteint seulement la lecture des `.docx`). `controleDAccueil()`
rend donc un verdict en trois états, jamais deux : **prêt**, **dégradé** (il manque un facultatif, et
on dit ce qu'on perd), **refusé** (il manque un requis).

**UN CONTRE-TEST QUI A MORDU DÈS L'ÉCRITURE** : la première version rendait « REFUSÉ » sur une
machine qui avait tout, parce qu'`execSync` n'était pas importé — un outil qui refuse toujours dit
autant qu'un outil qui accepte toujours. Le contre-test exige désormais qu'il puisse répondre OUI.

**Les fonctions** : `tuyauterieDeLAgence()` mesure les trois couches, `formatTuyauterieLines()` les
rend lisibles ; `controleDAccueil()` constate ce que la machine offre, `formatAccueilLines()` rend le
verdict en trois états.

## Les sautes silencieuses — une MESURE, jamais une alarme (2026-09-29, tâche #1203)

**D'où ça vient** : CLONE-HUNTER signalait cinq lignes recopiées à trois endroits de
`safe-export.mjs`. En cherchant POURQUOI les trois blocs existent — la règle qui a déjà payé trois
fois cette nuit — ces cinq lignes se sont révélées être le préambule ordinaire de tout balayage de
fichiers : ouvrir chacun, passer au suivant si la lecture échoue.

**Le fait mesuré** : ce préambule existe **42 fois** dans l'outillage, et **38 de ces endroits
abandonnent le fichier sans en garder la moindre trace**, sur **14 outils**. C'est le défaut que ce
projet traque partout ailleurs — « je n'ai pas pu regarder » qui se lit exactement comme « j'ai
regardé, il n'y a rien » (leçons L5 et L11).

**Pourquoi ce n'est PAS un garde-fou, et c'est délibéré** : une alarme affichant 38 à chaque commit
sans pouvoir descendre deviendrait du décor (leçon L6), et la correction touche 14 outils — une
décision qui appartient à l'utilisateur, jamais à l'agent. La question est posée dans
`docs/idees-a-trancher.md` (#1203) ; `sautesSilencieuses()` existe pour que le chiffre soit
**remesurable** le jour où il tranche, plutôt que cité de mémoire (Article 31, faille 8).

**La commande** : `node scripts/safe-export.mjs sautes`.

**Le motif a été calibré, pas cueilli** : une première version en comptait 171. Un échantillon relu
à la main a montré que la majorité des nouveaux venus étaient légitimes — un repli qui essaie le
chemin suivant, un défaut documenté rendu à la place, un constat déjà poussé disant que le fichier
est illisible. Un garde-fou qui accuse à tort cesse d'être lu (leçon L4).

**Sa limite honnête** : une trace écrite sous un nom que le motif ne connaît pas serait comptée
comme muette. Et elle s'applique sa propre règle — elle note les fichiers qu'elle-même n'a pas pu
lire et annonce alors son total comme un PLANCHER, parce qu'au premier passage elle se comptait
elle-même parmi les muets.

## La onzième copie du chargeur JSON (2026-09-29, tâche #1205)

**L'Article 27 pris en flagrant délit.** `lib-json.mjs` a été créé le 2026-09-23 (#216) pour mettre
fin à DIX copies de « lire un registre JSON, rendre un tableau ». Son propre en-tête raconte que
`le-coordinateur.mjs` portait un commentaire fier de réutiliser le chargeur — « jamais une 4ᵉ
copie » — pendant que sept copies naissaient ailleurs. **Six jours plus tard, trois nouvelles
étaient nées** : deux dans `ezechiel-les-tests`, une dans `x-port-blindtest`.

**Le défaut n'est pas qu'on manque d'un chargeur** : c'est qu'un helper DISPONIBLE n'est pas un
MÉCANISME. Rien ne regardait. Un fichier partagé règle les copies qu'on a sous les yeux le jour où
on l'écrit, jamais la suivante — et la suivante arrive toujours.

**Ce que `findCopiesDuChargeurJson()` reconnaît, et rien d'autre** : la forme exacte de
`loadJsonArray()` — parser un JSON, vérifier que LE RÉSULTAT LUI-MÊME est un tableau, rendre `[]`
sinon. Un `Array.isArray(j?.events)` vise un CHAMP : ce n'est pas la même fonction. Le resserrement
n'est pas théorique — la première version en accusait deux, dont une à tort (leçon L4).

**Les trois copies sont converties**, à comportement identique vérifié sur neuf cas (registre réel,
faux lecteur, fichier absent, JSON cassé, objet au lieu d'un tableau). La **quatrième est exemptée
par écrit** (`COPIES_DE_CHARGEUR_ASSUMEES`) : `axa-check` reçoit un chemin ABSOLU et un lecteur à
signature différente — la convertir changerait son interface, pas seulement son corps, et une
factorisation qui change une signature n'en est plus une.

**Zéro aujourd'hui, et c'est un zéro EXTINGUIBLE** : un garde-fou qui ne peut jamais atteindre zéro
devient du décor (leçon L6). C'est la différence avec la mesure des sautes silencieuses juste
au-dessus, qui reste à 38 et n'est donc délibérément PAS un garde-fou.

## Quatre fonctions publiques que la fiche ne nommait pas (rattrapage du 2026-09-30, tâche #1283)

| Fonction | Ce qu'elle vérifie |
|---|---|
| `findVerdictsSansHorizon()` | **le remède à moitié câblé** : tout script qui importe `toolsNeverUsed()` — la fonction canonique du verdict d'absence — doit aussi imprimer l'horizon du journal. Mesuré le 2026-09-30 : 2 lecteurs sur 3 ne le faisaient pas, dont CASSANDRA-RH qui propose de RETIRER des outils |
| `findFichiersHorsZone()` | un fichier de l'Agence rangé hors de la zone que son type impose |
| `zoneDuFichier()` | la zone attendue d'un fichier, dérivée de son type |
| `slugDuFichierAgence()` | le slug d'outil que porte un fichier, pour rattacher un fichier à son propriétaire sans table tenue à la main |

**La portée de `findVerdictsSansHorizon()` est étroite EXPRÈS**, et c'est ce choix qui le rend
lisible (leçon L4) : il vise la **ligne d'import**, un fait mécanique qu'aucune tournure de prose
ne peut simuler — la moitié du dépôt parle de `toolsNeverUsed()` en commentaire. **Sa limite est
déclarée plutôt que tue** : un lecteur qui recompte les événements lui-même lui échappe.
`report-template.mjs` faisait exactement cela et a été câblé à la main le même jour. Sous-déclarer
vaut mieux que fabriquer des coupables.

## `findEtatsPerdusAuClone()` — ce qu'un clone neuf perd en silence (2026-09-30, tâche #1285)

**LA QUESTION EST CELLE DE L'ARTICLE 27, POSÉE SUR LES DONNÉES.** Une IA qui ne dispose que de ce
dépôt reprend-elle le chantier sans rien perdre ? Le code part avec le clone. Les **journaux
locaux**, non : ils sont dans `.gitignore`, donc ils meurent avec le conteneur.

**CE N'EST PAS UN DÉFAUT EN SOI** — un cache DOIT être ignoré. Le défaut est qu'on ne pouvait pas
distinguer le cache assumé de l'historique qu'on croyait permanent. Le cas réel est mesuré :
`.tool-usage-history.json` se déclarait « cumul permanent depuis le début du projet » ; il avait
23 heures.

**LE CHAMP `auClone` DANS `LOCAL_JOURNALS`** (doc-report.mjs) porte l'intention, en trois valeurs :
`perte-acceptee` · `resume-committe` · `perte-reelle`. Un CHAMP, jamais une phrase à interpréter —
un garde-fou qui devine l'intention d'un texte finit par la deviner mal.

**LA PREMIÈRE VERSION CHERCHAIT L'INTENTION DANS `.gitignore` ET AURAIT ACCUSÉ QUATRE INNOCENTS.**
Elle rendait « 14 fichiers, 0 intention » alors que `.agent-session.json`,
`.banniere-post-commit.txt`, `.xp-remontees.json` et `.conso-tours.json` disent déjà en toutes
lettres, dans le registre, que leur perte est sans conséquence. Je regardais au mauvais endroit —
leçon L47, sur le garde-fou même écrit contre cette classe d'erreur.

**PREMIER PASSAGE RÉEL : 20 journaux déclarés, 0 sans intention, 2 en PERTE RÉELLE** —
`.tool-usage-history.json` (257 Ko) et `.memento-history.json` (22 Ko, 310 relevés du poids réel du
contexte, dont `docs/memento/` ne garde qu'un index).

**IL NE DIT JAMAIS S'IL FAUT VERSIONNER** : c'est une décision d'hygiène du dépôt, donc humaine,
posée au point **#1222** de `docs/idees-a-trancher.md`. Il dit ce qui n'est pas décidé. Le poids
sert à CLASSER, jamais à juger, et `present: false` reste distinct d'un poids nul (L5/L11).
