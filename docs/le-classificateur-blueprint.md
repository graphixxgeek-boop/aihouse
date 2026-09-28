# Blueprint générique — l'outil de CLASSIFICATION d'un outillage

*(Réutilisable sur n'importe quel projet portant un parc de scripts ou de modules. Instanciation sur
ce projet-ci : `docs/referentiel/le-classificateur.md`. Écrit le 2026-09-26.)*

## Le problème qu'il résout

Tout parc d'outils qui grossit finit par ne plus savoir ce qu'il contient. On sait nommer chaque
outil, mais plus personne ne peut dire ce qu'ils SONT collectivement : lesquels sont de vrais
membres, lesquels sont de la plomberie, lesquels ne sont là que parce que personne ne les a
supprimés. La question paraît cosmétique jusqu'au jour où il faut décider quoi maintenir.

## Le principe fondateur : plusieurs axes indépendants, jamais un seul arbre

Un parc d'outils ne se range pas dans un arbre, parce qu'un outil appartient à plusieurs choses à la
fois. On le range donc sur des **axes indépendants**, ce que les sciences de la documentation
appellent une **classification à facettes** :

| Axe | Question | Comment il se remplit |
|---|---|---|
| TYPE | ce que le fichier EST | se CONSTATE en le lisant |
| RANG | ce qu'il VAUT dans l'équipe | se MÉRITE, ou se déduit du type |
| FAMILLE | ce sur quoi il travaille | se décide |
| CLASSES | ce qu'il sait FAIRE | sondes sur son code, plusieurs par fichier |

**La distinction type / rang est le cœur de l'outil, et elle n'est pas intuitive.** Un type se
constate ; un rang se mérite. Une bibliothèque partagée n'a pas de rang et n'en manque pas : elle
n'a jamais candidaté. Les fusionner oblige soit à promouvoir ce qui n'a rien demandé, soit à priver
de rang ce qui l'a gagné.

## Les six règles qui font la différence entre cet outil et un inventaire

1. **Le rang MÉRITÉ l'emporte sur le rang DÉDUIT.** Le type ne remplit que les cases que personne
   n'a remplies. *Trouvé en faisant tourner la règle, pas en la relisant : l'ordre inverse
   rétrogradait deux outils de premier rang parce qu'ils n'ont pas de commande à eux.*
2. **Trois états par facette, jamais deux** : une valeur, « ne s'applique pas », « non reconnu ».
   Confondre les deux derniers fait lire une absence légitime comme un trou.
3. **Chaque rang déclare OÙ se lisent ses titulaires.** Sans ça, on les cherche tous dans le même
   registre et on déclare vides ceux qui se peuplent ailleurs. *C'est l'erreur la plus coûteuse de
   la construction : le chiffre était juste, il comptait la mauvaise population.*
4. **Les états de passage ne sont pas des rangs.** Ce qui n'est pas encore membre porte un état qui
   déclare sa marche suivante ET ce qu'il faut pour la franchir. Sans marche déclarée, un état de
   passage devient un rang où l'on reste.
5. **Le poste de travail se DÉRIVE.** Le rang donne la base ; ce que l'outil FAIT ajoute le reste,
   mesuré par les sondes. Un outil qui grossit gagne ses obligations sans que personne l'y pense.
   **Mais jamais son rang** : un outil qui se promouvrait lui-même se décernerait un titre.
6. **Le document est GÉNÉRÉ, jamais rédigé.** Un inventaire écrit à la main se périme au premier
   fichier ajouté. Les rendus texte et HTML sortent des mêmes blocs.

## La règle de dépendance, si l'outil naît d'une scission

Le classement n'importe jamais l'outil dont il est issu. Le sens est unique, sinon la scission n'a
rien séparé : elle a réparti le même bloc sur deux fichiers. L'outil d'origine RÉEXPORTE ce qui a
bougé, pour qu'aucun appelant n'ait à changer une ligne — un déménagement mêlé à une modification
est impossible à relire le jour où quelque chose casse.

## Sa limite, à déclarer plutôt qu'à taire

Il range ce qu'il peut MESURER. La finalité d'un composant ne se déduit jamais de son code : le code
dit ce qu'une chose TOUCHE, jamais pourquoi elle existe. Toute catégorie qui repose sur une
intention se tient donc à la main, avec sa raison écrite à côté — et cette nature manuelle se
déclare, elle ne se cache pas derrière une fausse sonde.

## Rapprocher un schéma d'avancement plutôt que le recalculer

Un projet outillé finit toujours par porter un **schéma d'étapes** : classer, niveler, harmoniser,
relier, gouverner. Chacune de ces étapes est en général DÉJÀ mesurée quelque part, par l'outil qui
s'en occupe. Ce qui manque n'est jamais la mesure : c'est de les voir **côte à côte, le long du
schéma**, pour savoir si l'avancement est uniforme ou si une étape traîne.

**La règle de construction, transposable telle quelle** : le rapprochement LIT les mesures
existantes, il n'en RECALCULE aucune. Deux détenteurs du même chiffre sont la façon dont deux
chiffres finissent par diverger.

**Le piège à désamorcer d'emblée, et il est systématique** : l'indicateur tautologique. Un ratio
dont les deux membres sortent de la même valeur — « les X déclarés sur les X déclarés » — rend
100 % à tous les coups et ne mesure RIEN, tout en ayant l'apparence parfaite d'un indicateur. La
protection n'est pas la vigilance : c'est un **test à population uniforme**. On construit un dépôt
fictif où chaque population vaut délibérément la même fraction (3 sur 7, par exemple) ; tout
indicateur qui rend 100 % sur cette sonde se compare à lui-même, et le test refuse. Cette sonde
attrape aussi ceux qu'on écrira demain, ce qu'aucune relecture ne peut promettre.

**Trois séparations d'honnêteté**, qui valent pour tout rapport d'avancement :

- un indicateur non mesurable **sort de la moyenne** et reste **visible à côté** avec sa raison
  écrite — à zéro il punirait l'honnêteté, à cent il fabriquerait le faux vert le plus cher ;
- une étape dont aucun indicateur n'est mesurable rend **PAS MESURÉE**, jamais « 0 % » : « on a
  regardé et rien n'est fait » et « on n'a pas pu regarder » se lisent à l'opposé ;
- **une source qui tombe n'emporte pas les autres** : chaque lecture est protégée séparément, sinon
  le tout premier import cassé rend le rapport entier aveugle.

**Nommer ce que personne ne porte.** Une étape qu'aucune tâche ouverte ne réclame doit le DIRE, en
nommant l'ambiguïté — « soit elle est finie, soit personne ne s'en occupe, et les deux se
ressemblent » — plutôt que de laisser le lecteur choisir la lecture flatteuse.

**Vérifier l'homonymie avant de nommer la fonction.** Un dépôt outillé porte vite plusieurs
« états », plusieurs « schémas ». Deux fonctions exportées du même nom, dans le même dépôt, pour
deux objets différents, sont une dette de reprise : le prochain lecteur ne peut pas savoir laquelle
a parlé. Le nom se choisit après un scan des exports, jamais avant.
