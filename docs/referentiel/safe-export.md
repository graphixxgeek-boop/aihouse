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
