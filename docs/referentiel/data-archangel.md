# DATA-ARCHANGEL — instanciation

## Deux mots, deux choses : « index » et « angel-of-index » *(2026-09-26, tranché par l'utilisateur)*

**Le mot « index » désignait DEUX choses**, et je m'en suis servi dans les deux sens dans la même
phrase le soir où l'extension est née : le FICHIER `index.md` posé dans un dossier, et le SYSTÈME
qui surveille ces fichiers. C'est la forme la plus discrète de la dette de reprise que l'Article 27
nomme — une IA qui lit « vérifier l'index » ne peut pas savoir s'il faut ouvrir un fichier ou
lancer un scan, et rien ne l'avertit de son hésitation.

**La règle, et elle ne coûte aucun renommage :**

- **« index »**, seul, désigne TOUJOURS le fichier : `docs/<dossier>/index.md`. C'est le mot qu'on
  tape spontanément, et le lui retirer aurait obligé à renommer 58 fichiers plus tous les chemins
  qui les citent — exactement le chantier de renommage en masse qui n'est pas encore ouvert.
- **« angel-of-index »** désigne TOUJOURS le système qui les mesure et les répare :
  `node scripts/data-archangel.mjs angel-of-index`. Nom donné par l'utilisateur le 2026-09-26.
- La commande accepte aussi `index` tout court, **et c'est délibéré** : refuser le mot naturel pour
  imposer le nom propre ferait rater la commande à qui ne l'a pas mémorisée. L'alias sert la main,
  le nom propre sert la phrase.

**Ce que la règle interdit** : écrire « l'index » en parlant du système. Un document qui le fait
rend la phrase ambiguë pour tout lecteur qui n'a pas le contexte en tête — c'est-à-dire pour tout
lecteur de demain.


*Blueprint : `docs/data-archangel-blueprint.md`. Registre : `docs/data-archangel/`.
Script : `scripts/data-archangel.mjs`.*

## Origine

2026-09-22, nom donné par l'utilisateur, demande en trois temps : « verifie toute la partie :
echanges de données : toute la matiere data produite par l'agence doit beneficier, si pertinent, à
tous les outils : trouve les connexions manquantes [...] et aussi point trés important : assure-toi
que l'organisation te permet d'avoir accès à toutes ces données, et qu'elles te soient utiles à TOI
en priorité. Assure-toi que tu puises bien dans toute la data. »

Calibrage tranché avant construction : **les deux sens, un seul verdict** ; et pour l'accès de
l'agent, **les deux formes plus la Ronde** (commande à la demande, alerte rare, relais périodique).

## L'inventaire (53 sources)

Trois natures, jamais confondues — elles ne se lisent pas au même rythme et une absence de lecteur
n'y veut pas dire la même chose :

- **journal** (17) : état local jamais committé, mémoire de travail entre deux lancements ;
- **registre** (35) : trace datée committée, l'histoire de ce qu'un outil a trouvé ;
- **mesure** (1) : `kpi-historique.csv`, la seule série qui permette de comparer dans le temps.

Aucune liste tenue à la main : les journaux viennent de `LOCAL_JOURNALS`, les registres de
`REGISTRIES` (doc-report), la mesure de `KPI_HISTORY_PATH`. Un nouvel outil qui déclare son journal
entre dans le champ de vision sans qu'une ligne ne bouge ici (Article 24).

## Le premier verdict était faux, et c'est instructif

« 53 sur 53 relues, 100 % ». Trop propre. Cause : `doc-report.mjs` cite **52 des 53 sources** parce
qu'il les DÉCLARE — il est le catalogue du paysage, pas un consommateur de ses données. Compter une
déclaration comme une lecture rendait tout le réseau parfaitement branché alors que rien ne
circulait.

Encore la même famille d'erreur que partout ailleurs dans ce projet : **une mesure adjacente
présentée comme la mesure visée** — commise, cette fois, dans l'outil écrit pour traquer exactement
ça.

Corrigé par un principe et non par une liste d'exceptions : `stripExportedConstantBodies()` retire
le corps de toute constante exportée avant de chercher, pour tous les fichiers. Plus
`FICHIERS_DE_VERIFICATION` (volontairement manuel, et l'Article 24 l'autorise à cette condition
écrite : ce sont les deux fichiers d'infrastructure de vérification du dépôt, stables par nature),
dont les citations comptent à part — vérifier n'est pas exploiter.

**Résultat réel après correction : 39 sur 53 (74 %), et 13 registres écrits que rien ne relit.**

## Les trois sorties

- **`node scripts/data-archangel.mjs`** — le verdict : orphelines, alerte critique, branchements
  suggérés.
- **`node scripts/data-archangel.mjs briefing [filtre]`** — MA commande : tout ce que l'équipe sait
  sur un sujet, avec la fraîcheur et le nombre de lecteurs de chaque source. À consulter avant un
  gros travail, comme tool-brain avant de chercher dans un fichier.
- **Item de Ronde** — le relais périodique.

## `criticalIgnoredData()` : l'alerte a le droit d'être rare

Il faut qu'une donnée soit à la fois FRAÎCHE (≤ 2 jours : quelqu'un vient de l'écrire, donc elle a
quelque chose à dire) et SANS AUCUN LECTEUR. Une donnée ancienne et ignorée est une question
d'hygiène, pas une urgence — et une alerte qui sonne tout le temps ne se lit plus.

## La nuance écrite dans le rapport lui-même

Un registre destiné à l'œil humain n'a pas besoin d'un lecteur-outil. Ce qu'aucun humain ne fera
jamais, c'est comparer trente passages pour en tirer une tendance. La liste des orphelines répond
donc à « personne n'exploite la série ? », jamais à « personne ne lit ce fichier ? ».

## Nature du résultat

`heuristique` : une lecture se mesure à la citation d'un chemin dans le code — une mention, jamais
la preuve que la donnée est réellement exploitée, et un chemin construit dynamiquement lui échappe
complètement.

## Le quatrième état : lue par un lecteur de table déclaré (2026-09-23, tâche #564)

**Le défaut, et il était mesurable.** Dix-neuf dossiers de signaux de Ronde étaient comptés
« données fraîches que personne ne lit », alors que `tendanceDesSignauxDeRonde()`
(`scripts/circle-process-guardian.mjs`) les ouvre tous, à chaque passage, pour comparer les passes et
en tirer une tendance. Il ne les cite simplement pas : il **itère** `CIRCLE_REPORT_FOLDERS` et dérive
les chemins — exactement ce que l'Article 24 exige (« un registre se LIT, il ne s'énumère pas »).

La mesure punissait donc la bonne conception, et aurait récompensé vingt chemins recopiés à la main.
C'est le reproche que l'utilisateur a formulé lui-même.

**Pourquoi ne pas simplement créditer l'accès par table** : déjà tranché, contre-exemple à l'appui —
`find-brain` importe un registre pour en tirer des chemins de SCRIPTS, jamais pour ouvrir les
registres ; le créditer rendait « 0 donnée jamais lue » sur 59, un vert obtenu en ne regardant rien.
Passer par la table prouve qu'on touche la famille, jamais qu'on exploite ce contenu-là.

**La solution : une déclaration, et elle ne se croit pas sur parole.** Le lecteur déclare dans son
propre fichier `export const LECTEUR_DE_TABLE = [{ table, quoi }]`, et `lecteursDeTableDeclares()`
ne le crédite que si **le fichier lit vraiment le disque**. Une déclaration sans lecture est
signalée comme non corroborée — un porteur fantôme est pire qu'une absence (L7).

**Quatre états désormais, jamais deux** : lue directement (le chemin est cité) · lue via un lecteur
de table déclaré et corroboré · seulement frôlée par une table (candidat, jamais lecteur) · jamais
atteinte.

**Résultat mesuré** : l'alarme passe de 19 à **8 cas réels**, et les 11 crédités sont montrés à
part plutôt que rendus invisibles — savoir QUI les lit vaut mieux que ne plus les voir. Les 8 qui
restent sont de vrais trous : des registres écrits par leur outil et jamais comparés d'un passage à
l'autre.

## Un catalogue généré peut être REMIS À JOUR (2026-09-27)

**Le défaut, trouvé en déposant un fichier, jamais en cherchant un bug.** L'outil écrit en tête de
chaque catalogue qu'il génère : « n'y écrivez rien à la main, **une régénération l'effacerait** ».
Cette régénération n'existait pas. `--generer` refuse — à raison — d'écraser un index existant,
parce qu'une prose écrite à la main vaut mieux qu'une liste ; `--completer` ne traite que les index
sans contrat ou incomplets sous une prose. **Un catalogue généré tombait donc en retard pour
toujours**, en affichant une consigne qui désignait une commande inexistante. Sept catalogues réels
étaient dans ce cas le jour de la correction.

**Pourquoi c'est pire qu'un document simplement périmé** : un catalogue PROMET la liste complète de
son dossier. En retard, il ne se tait pas — il affirme quelque chose de faux, et son lecteur conclut
que le fichier manquant n'existe pas. C'est exactement ce que veille cet outil : « un fichier
qu'aucun index n'annonce est un fichier qui ne circule pas ».

**La correction, et sa sûreté.** `--generer` réécrit désormais AUSSI un catalogue **que l'outil a
lui-même signé** et qui a pris du retard. La reconnaissance se fait sur `SIGNATURE_CATALOGUE_GENERE`
— le texte que l'outil écrit lui-même dans l'en-tête — et jamais sur une liste de dossiers tenue à
la main (Article 24) : ce qu'il n'a pas signé, il n'y touche pas. Une prose écrite à la main reste
donc intouchable, ce qui est toute la sûreté de la fonctionnalité.

**Vérifié dans les deux sens** (BP4), et le second compte plus que le premier : l'outil reconnaît sa
propre signature dans ce qu'il écrit, et une prose écrite à la main n'est **jamais** reconnue comme
régénérable. Un test sur deux catalogues en retard, l'un signé et l'autre écrit à la main, vérifie
qu'un seul des deux est réécrit.

**Effet de bord assumé au premier vrai passage** : la régénération a propagé aux anciens catalogues
la règle `estUnDepot()` posée la veille — un fichier dont le nom finit par `index.md` est un index,
jamais un dépôt. `docs/referentiel/kpi-index.md` et `docs/templates/registre-index.md` ont donc
quitté leur catalogue de dossier. Les deux restent atteignables par les documents qui les citent
(la charte pour le premier) ; ce qui a disparu est leur ligne dans une liste, pas leur adresse.

## LA VEILLE SUR L'HISTOIRE — qui garde ce que l'Agence raconte d'elle-même

*(2026-09-27, tâche #748. Sa question : « Oui veillons à l'histoire que l'agence raconte c'est très
important. QUI garde et surveille l'histoire de l'agence ? »)*

**LA RÉPONSE HONNÊTE ÉTAIT « PERSONNE », et c'était un trou.** L'histoire EXISTE — le suivi, les
simulations archivées, les registres de chaque outil — mais aucun outil ne veillait sur elle EN TANT
QUE TELLE. Les plus proches n'en couvraient qu'un bout : data-archangel surveillait la CIRCULATION
des données, l'AGENT DES NOMS empêchait qu'un renommage la falsifie.

**POURQUOI CE RÔLE ÉCHOIT ICI plutôt qu'à un 82e script** *(Article 31 : on étend avant de
construire)* : les fichiers dont data-archangel suit la circulation sont exactement ceux dont
l'histoire est en jeu. Un script à part relirait le même arbre pour une question voisine. Le mandat
s'élargit, le veilleur reste le même — et il porte un nom, ce que sa question demandait. **C'est un
veilleur au sens de l'Article 20bis, jamais un Gardien sacré** : il surveille un patrimoine, il ne
scanne pas la qualité du code.

```
node scripts/data-archangel.mjs histoire
```

**DEUX ATTEINTES SUR QUATRE, et les deux autres sont DITES plutôt que sous-entendues.** La tâche en
nommait quatre : une archive réécrite · une mesure passée corrigée après coup · un registre qui perd
des lignes · une date qui recule. Deux se lisent dans git sans jugement. **Les deux autres demandent
de comparer le SENS de deux versions, pas leur forme, et ne sont pas couvertes** — la sortie
l'imprime à chaque passage. Un veilleur qui laisse croire qu'il couvre quatre atteintes quand il en
voit deux est pire qu'un veilleur absent : c'est la seule façon dont un trou devient invisible.

| Atteinte | Couverte ? | Comment |
|---|---|---|
| Un registre qui perd des lignes | ✅ | solde NET négatif sur un fichier d'histoire, lu dans `git log --numstat` |
| Une archive réécrite | ✅ | plus d'un commit sur un fichier d'archive, qui par définition ne s'édite plus |
| Une mesure passée corrigée après coup | ❌ | demande de comparer le SENS de deux versions |
| Une date qui recule | ❌ | idem — `findHorodatagesFuturs()` couvre l'autre sens seulement |

**DEUX FAUX SIGNAUX CORRIGÉS AU PREMIER PASSAGE**, et chacun apprend quelque chose : `--follow`
faisait remonter à l'archive les **221 modifications de son fichier SOURCE** (un chiffre juste au
sens de git, faux au sens de la question posée) ; et les `index.md` étaient comptés comme des
archives, alors qu'un catalogue DOIT changer à chaque archivage — l'accuser ferait crier le veilleur
pile au moment où il a raison de se taire (leçon L4).

**Ce qu'il a trouvé à son premier vrai passage** : un transcript de simulation avait perdu
**1 245 lignes nettes**, et personne ne l'aurait vu. Un outil qui trouve quelque chose dès son
premier passage n'est pas une intention (leçon L2).

## Le rapport se contredisait lui-même — deux nombres pour la même question (2026-09-28, tâches #490 / #902)

**Deux défauts, et le second est le plus coûteux parce qu'invisible à la relecture.**

### 1. Une source comptée deux fois, dans deux listes qui se contredisent

`docs/safe-export/` figurait dans la liste **« ✅ lue par un lecteur de table déclaré — jamais un
trou »** et, trente lignes plus bas, parmi les **« 31 que seul leur producteur relit »**.

Les deux phrases sont vraies sous leur propre critère — aucun lecteur **direct**, mais un lecteur de
**table** — et c'est exactement ce qui rend la contradiction chère : **le lecteur ne peut pas savoir
laquelle compte.**

C'est le même défaut que les « 43 liens » de la portabilité, trouvé le même jour : **une population
annoncée sans en retirer la part déjà expliquée**. Un nombre gonflé ne fait pas travailler plus, il
fait refermer le rapport.

**Mesure : 31 → 3 sources réellement inexpliquées**, et le bloc **dit** ce qu'il a retiré — une
soustraction muette est indiscernable d'un oubli.

### 2. Le taux disait le contraire de la prose qui l'accompagnait

Le pourcentage comptait comme **non lues** les 26 sources dont le rapport écrit noir sur blanc
qu'elles « ne sont jamais un trou », et que « les compter comme non lues **punirait la bonne
conception** » (Article 24 : un chemin *dérivé* d'un registre vaut mieux qu'un chemin recopié).

**Un rapport qui dit une chose dans sa prose et son contraire dans son chiffre laisse le lecteur
choisir, ce qui revient à ne rien mesurer.**

### Les deux taux sont rendus, jamais l'un à la place de l'autre

| Taux | La question à laquelle il répond |
|---|---|
| **atteintes** (88 %) | un autre outil arrive-t-il à cette donnée, directement ou par une table déclarée et corroborée ? |
| **directes** (52 %) | quelqu'un ouvre-t-il ce fichier **en le nommant** ? |

L'écart entre les deux dit exactement combien de sources ne sont atteintes **que** par une table.
Le taux direct ne peut jamais dépasser l'autre — il répond à une question strictement plus étroite —
et un contre-test verrouille cette inégalité : une inversion voudrait dire que les deux populations
ont été confondues.

### L'effet sur le schéma, dit franchement

L'étape 4 du schéma de classification passe de **76 % à 94 %**, et devient **TENUE**. Cette hausse
vient d'une **mesure corrigée**, jamais d'un câblage nouveau — et le dire vaut mieux que de laisser
croire à dix-huit points de travail.

## LES ANCRES — rejoindre un détail précis dans 60 000 mots (2026-09-28, tâche #725)

**Sa question, qui a créé cette capacité** : « tu vas faire comment pour te référer rapidement aux
documents du projet dans git ? tu vas étiqueter les paragraphes ? les pages ? […] je veux que tu
puisses rejoindre rapidement un détail dont tu as besoin, car **un détail dans 60 000 lignes, qui va
le lire ?** »

```
node scripts/data-archangel.mjs ancres [--cherche "<mot>"]
```

**Le principe** : un corpus déposé ne se renumérote pas — ce serait réécrire ce qu'il a écrit. On
pose donc une carte À CÔTÉ : `ancresDuTexte()` repère les points d'accroche d'un document,
`ancresDuCorpus()` balaie les racines déclarées, `chercherDansLesAncres()` répond « ce sujet est
traité à tel endroit », et `deposerLesAncres()` écrit le registre.

**QUATRE SIGNAUX, ET LE QUATRIÈME A ÉTÉ AJOUTÉ PARCE QUE LA RECHERCHE POINTAIT À CÔTÉ** : les titres
Markdown · les lignes tout en capitales · **les titres numérotés** · les étiquettes qu'il emploie
lui-même (`REMARQUE`, `OBJECTIF`, `ATTENDU`, `QUESTION`…). Sans le troisième, une recherche sur
« séparation des fonctions » rendait le titre du tableau VOISIN — une ancre qui désigne le mauvais
paragraphe est pire qu'aucune ancre.

**LE GARDE-FOU DE PROSE, ET IL A DIVISÉ LE BRUIT PAR QUATORZE** : une ligne en capitales n'est une
ancre que si de la vraie prose la suit (au moins 12 mots dans les 3 lignes qui suivent). Sans lui,
les fragments de schémas ASCII passaient pour des titres : **308 ancres dont 286 fausses, soit 93 %
de bruit**. Avec lui : 22. Un index faux coûte plus cher qu'un index absent, parce qu'on lui fait
confiance.

`formatAncresLines()` rend le tout lisible : les documents les plus riches en ancres, et la réponse
de la recherche quand un mot est donné.

**Mesure actuelle** : 939 ancres sur 26 documents, dont 2 sans aucune ancre — et ce zéro-là est dit,
jamais tu.

## La DÉLÉGATION d'un catalogue, et les dépôts sans trace (2026-09-28)

`texteAvecDelegations()` permet à un index de déléguer une partie de sa liste à un autre fichier, par
un marqueur `<!-- catalogue-delegue: <chemin> -->`. **Un seul niveau, jamais deux** : une délégation
qui délègue devient une chaîne que personne ne peut suivre. Un `..` ou un chemin absolu sont refusés,
et une cible absente ne délègue rien plutôt que de casser la lecture.

`estUnDepot()` et `estUneCopieLisible()` distinguent un fichier déposé par l'utilisateur d'une copie
lisible produite à côté de lui (un `.md` voisin d'un `.docx` du même nom). **Le second prend la liste
complète des fichiers, jamais un index** : la première version passait `estUnDepot` directement à un
`.filter()`, donc recevait un NUMÉRO comme second argument — un défaut invisible à la relecture,
attrapé par le contre-test.

## LA CARTE DES DOSSIERS — le second étage de #725 (2026-09-29, tâche #1167)

```
node scripts/data-archangel.mjs carte
```

**Sa demande, dans la tâche** : « rien ne décrit la CARTE de la mémoire du projet — quel dossier sert
à quoi, lequel s'écrit tout seul, lequel s'historise, lequel dépend de quel autre. **À dériver du
dépôt réel, jamais une carte dessinée à la main qui se périmerait.** »

Le premier étage (les ANCRES) répond « où est ce détail ? » à l'intérieur d'un document. Celui-ci
répond un cran au-dessus : **comment cette mémoire est-elle organisée ?**

| Sa question | Le signal, dérivé |
|---|---|
| à quoi sert ce dossier | la NATURE de son index, déjà mesurée par `mesurerLesIndex()` |
| s'écrit-il tout seul | `quiEcritDans()` — deux signaux séparés, voir ci-dessous |
| s'historise-t-il | `dossierSHistorise()` — ses fichiers portent-ils une date |
| de quoi dépend-il | `dependancesDuDossier()` — quels autres dossiers ses fichiers citent |

**Mesure : 92 dossiers, 67 écrits par un script, 46 qui gardent une suite de passages datés.**

### Deux resserrements, et c'est la famille d'erreur la plus fréquente de ce dépôt

**① « Le script nomme le chemin »** attribuait `docs/check-tasks-details` à **agent-des-noms**, qui
le cite dans un registre de renommage. *Mentionner n'est pas écrire.*

**② « Il le nomme ET écrit quelque part dans le fichier »** rendait **91 dossiers sur 92** écrits par
un script. Un fichier de 20 000 lignes écrit forcément quelque part : **la condition était vide de
sens.** `ecritPresDuChemin()` exige donc le verbe d'écriture **à trois lignes du chemin** — assez
pour voir un appel étalé sur plusieurs lignes, trop peu pour une rencontre de hasard.

### Deux signaux d'écriture qui ne se mélangent jamais

**Le script HOMONYME est le MAÎTRE** : la règle du dépôt est sans exception — un registre vit dans
`docs/<nom-de-l-outil>/` — et **une convention est une règle, jamais une déduction**. Les autres
écrivains sont rendus **à part** (`parLeCode`), parce qu'un dossier peut légitimement être alimenté
par plusieurs outils : aplatir les deux listes perdrait lequel en est le maître.

### Une dépendance inventée, retirée

Le premier jet rendait « docs/X » parmi les dépendances du référentiel — un chemin de fixture pris
dans un exemple de code. `dependancesDuDossier()` ne retient désormais que les dossiers qui existent
vraiment : **une carte qui invente une dépendance vaut moins qu'une carte qui en oublie une.**

### Ce qu'elle ne fait pas, et c'est délibéré

**Elle DÉCRIT, elle ne JUGE pas.** Elle ne dit pas qu'un dossier est mal rangé ni qu'une dépendance
est de trop : ces jugements demandent de savoir ce que le projet VEUT, et ce savoir n'est pas dans
le dépôt. Elle est entièrement dérivée, donc elle ne peut pas se périmer — ce qu'il exigeait.

## L'élargissement automatique de la recherche de notes *(#1263)*

**C'est la charte elle-même qui demandait ce travail de tête.** L'Article 30 écrit : « Un zéro
n'est jamais la preuve qu'il n'y a rien à savoir : c'est la preuve que CE MOT-LÀ ne ressort pas. On
réessaie avec le vocabulaire du sujet avant de conclure qu'on part de zéro. » Une obligation qui ne
reposait que sur la mémoire de l'agent — donc perdue d'avance (Article 27).

`motifsElargis()` relâche la question en trois niveaux, et **jamais vers le bas tant que le niveau
précédent a trouvé quelque chose** : un sujet précis se noierait dans le bruit d'un mot commun. **Le
niveau atteint est TOUJOURS dit** — un résultat obtenu en relâchant la question n'est pas le même
qu'un résultat obtenu telle qu'elle était posée, et confondre les deux serait le « signal adjacent
lu comme le signal visé » que ce dépôt paie en boucle. `chercherLesNotes()` est la recherche
elle-même, sur les cinq lieux où vivent les notes.

### Sa limite, mesurée sur moi le 2026-10-01 *(tâche #1383)*

**L'élargissement relâche la question que j'ai écrite ; il ne peut pas deviner un vocabulaire que
je n'ai jamais employé.** Ce jour-là j'ai cherché « fusion outils effectif » puis « outils qui se
chevauchent ». L'outil a bien élargi, et il a bien rendu ce qu'il pouvait. Le dépôt rangeait le
sujet sous **« outils à retirer ou refondre »** — trois mots que je n'avais pas donnés. Résultat :
j'ai reconstruit un mécanisme qui existait depuis quatre jours.

**Le geste qui manque, et aucune mécanique ne le fera** : quand une TÂCHE nomme où chercher — ici
« trace probable dans CASSANDRA-RH » — y aller **avant** d'élargir au hasard.

## Les documents qui ne circulent pas

`documentsOrphelins()` sépare ce qui est cité de ce qui ne l'est pas, et réserve le mot ORPHELIN au
cas réellement perdu — rien du tout, pas même son index. `formatOrphelinsLines()` le rend lisible.

**Ce qu'elle ne dit pas, et il faut le lire avant d'agir** : un document peu cité n'est pas un
document inutile. Une archive n'a pas vocation à être citée, un texte fondateur se lit sans être
convoqué. **La mesure dit ce qui NE CIRCULE PAS ; décider si ça doit circuler reste humain.**

## L'index par situation, et les quatre verdicts

`buildIndexParSituation()` et `rendreIndexParSituation()` construisent l'index des situations
rencontrées ; `lireUneSynthese()` lit une fiche, `normaliserLeVerdict()` ramène son verdict à l'un
de **quatre** libellés.

**Pourquoi quatre et pas quatorze** : le premier passage a trouvé 14 libellés distincts — « ACCORD »,
« ACCORD TOTAL », « ACCORD FORT », « ACCORD sur la structure », « ACCORD partiel »… **C'est la
rédaction qui variait, pas le sens**, et un index à quatorze colonnes ne se lit plus.

**Il a audité sa propre écriture dès le premier passage** : deux fiches sur six portaient un défaut
de forme — une idée sans sa question, un en-tête que le lecteur ne savait pas lire. *Un format
qu'aucune machine ne relit dérive en silence.*


## LES VUES DÉRIVÉES — une copie lisible qui ne peut pas mentir (2026-10-02, tâche #1441)

**Sous-commande** : `node scripts/data-archangel.mjs vues`.

**LE CAS RÉEL QUI L'A FAIT NAÎTRE.** Il a demandé à VOIR la table des onze destinations d'une note,
qui vit dans une section de `docs/regles-de-travail.md`. En extraire une page lisible est le service
rendu ; en faire une COPIE sans rien qui détecte l'écart est exactement ce que l'Article 24
interdit. **Une vue qui diverge de sa source est pire qu'une absence de vue : elle a l'air d'être à
jour**, et c'est ce qui la rend dangereuse.

**CE QU'IL COMPARE** : les lignes de tableau, ligne par ligne, entre la vue et la section nommée de
sa source. Le registre `VUES_DERIVEES` porte, par entrée, la vue, sa source, sa section et la raison
de son existence.

**TROIS VERDICTS, JAMAIS DEUX.** Fidèle · divergente, avec les lignes perdues et les lignes
inventées nommées **séparément** (perdre une ligne et en inventer une sont deux fautes
différentes) · **PAS MESURÉ** quand la vue est introuvable ou que la section a disparu de la source.
Ce dernier cas est le plus probable dans la durée : la source se réorganise, la vue survit, et plus
rien ne les relie.

**HORS PORTÉE, déclaré dans le rapport lui-même** : seules les lignes de tableau sont comparées. Une
vue porte légitimement une en-tête que sa source n'a pas, donc une divergence de prose ne sera
jamais vue d'ici.

## LES ONZE DESTINATIONS D'UNE NOTE SONT-ELLES ALIMENTÉES ? (2026-10-02)

**Sous-commande** : `node scripts/data-archangel.mjs destinations`.

**SA DEMANDE, mot pour mot** : *« vérifie que tu as bien récolté toutes les données pour alimenter
les datas : les 11 classes de notes »*. **Une table de destinations est une INTENTION tant que
personne ne vérifie que quelque chose y arrive** — et une destination jamais alimentée est le signe
soit qu'elle ne sert à rien, soit qu'on range ailleurs ce qui lui revenait. Les deux méritent d'être
sus, et aucun des deux ne se voit en relisant la table.

**LA TABLE EST LUE, JAMAIS RECOPIÉE** (Article 24) : elle vit dans `docs/regles-de-travail.md`
§3pentes, et une douzième destination ajoutée demain sera mesurée le jour même.

**RELEVÉ DU 2026-10-02** : les **8** destinations qui nomment un chemin fixe ont toutes reçu
quelque chose dans les quatorze derniers jours. **Les 3 autres ne se mesurent pas** — la mémoire
« de l'outil concerné », « le présent document », « le registre de l'outil qui l'a produit » ne
nomment aucun chemin fixe, puisqu'il dépend de l'outil en cause. Les compter vides accuserait à
tort, les compter pleines mentirait : **la troisième voie est de le dire** (Article 27).

**HORS PORTÉE, déclaré dans le rapport** : la fraîcheur d'un CHEMIN ne prouve pas qu'une NOTE y est
arrivée — un fichier du suivi bouge à chaque commit sans qu'une note y ait été rangée. Ce contrôle
dit **où plus rien n'arrive**, ce qui est un vrai signal ; jamais que tout ce qui devait arriver
est arrivé.
