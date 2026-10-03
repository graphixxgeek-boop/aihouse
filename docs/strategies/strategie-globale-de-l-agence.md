# LA STRATÉGIE GLOBALE DE L'AGENCE — comme si elle était seule

<!-- ARBORESCENCE — bloc généré par `node scripts/the-king.mjs cascade --inserer`, ne pas éditer à la main -->

**Où ce document se situe dans la cascade** — remonté des déclarations « DÉCOULE DE » réelles, jamais dessiné à la main :

```
philosophie-et-politique
    └── ▣ strategies/strategie-globale-de-l-agence   ← CE DOCUMENT
        (aucun document ne déclare découler de celui-ci)
```

<!-- /ARBORESCENCE -->

*(Créée le 2026-10-02, tâche **#1482**, à sa demande : « Je veux 3 belles stratégies globales,
livrées en HTML, parfaitement coherente dans la cascade de PHILO à taches ».)*

> **DÉCOULE DE :** `docs/philosophie-et-politique.md`
> *la philosophie dit POURQUOI, celle-ci dit COMMENT on s'y prend — à l'échelle de l'Agence seule.*

> **SŒUR DE :** `docs/strategies/strategie-globale-du-jeu.md`
> *les deux couvrent chacune un projet comme s'il était seul. Leur synthèse est
> `strategie-globale-du-projet-entier.md`, qui les chapeaute — et qui existait avant elles.*

> **POURQUOI TROIS ET NON UNE.** Sa demande #1138 : « les DEUX stratégies globales séparées — avec
> les deux projets, et comme s'il n'y en avait qu'un ». La raison est opératoire, pas
> documentaire : **le jour où l'Agence part ailleurs, elle part SANS le Jeu.** Une stratégie qui
> mélange les deux ne peut pas se transporter — il faudrait la découper au moment où l'on a le
> moins le temps de le faire.

> **CE DOCUMENT EST HYBRIDE.** Tout ce que tu lis est écrit à la main et ne bouge pas. Le bloc en
> bas, encadré, se **recalcule** : `node scripts/data-archangel.mjs strategies --ranger`. Les
> chiffres d'une stratégie périment plus vite que son raisonnement, et les recopier à la main
> serait la dette que l'Article 24 interdit.

## 1. POURQUOI CE CHANTIER

**L'Agence est le second projet, et c'est elle qui se vend.** La formule fondatrice le dit :
« l'agence est un prétexte pour construire le site, le site est un prétexte pour construire
l'agence. Quand le site sera fini, l'agence sera aussi potentiellement finie : il suffira de
l'exporter. »

**Cette phrase contient une hypothèse qu'il faut regarder en face** : « il suffira de l'exporter ».
Les mesures du 2 octobre disent que ce n'est pas vrai aujourd'hui.

- `the-king fonder`, l'outil dont le seul rôle est de doter un projet d'accueil de ses textes
  fondateurs, **n'avait jamais tourné contre un projet d'accueil**. Lancé contre un vrai, il
  rendait **0 case sur 19** et **accusait l'hôte** d'un défaut qui venait de l'instrument.
- **3 règles de conduite sur 28** n'ont pour source qu'une conversation : elles ne partiront pas,
  et personne ne remarquera leur absence.
- **99 % du filet de sécurité teste l'Agence**, et **4 % seulement** le produit. Donc le projet
  d'accueil n'hérite d'aucune protection pour SON code.

**La stratégie de l'Agence est donc d'abord une stratégie d'EXPORT ÉPROUVÉ**, pas une stratégie de
construction. Ce qui est construit est déjà considérable ; ce qui n'est pas prouvé, c'est qu'il
survive au déménagement.

## 2. CE QUI EXISTE DÉJÀ

| Ce qui est en place | Mesure |
|---|---|
| Outils | 86, dont 79 portant blueprint + fiche |
| Fichiers de kit tenus à jour | 395 pour l'outillage seul |
| Filet de sécurité | 409 tests, EXIT=0, ~9 minutes |
| Gardiens sacrés tournant à chaque commit | 7 |
| Stratégies de chantier | 10, dont 4 complètes au format en 7 sections |
| Règles de conduite surveillées | 28, dont 25 avec un domicile dans le dépôt |

**Et une mesure qui compte plus que les autres** : les 34 outils de moins de 300 lignes pèsent
**5 % du code**. Le paysage n'est donc pas encombré de petits outils — il est tenu par quelques
gros, dont le filet (25 447 lignes à lui seul, un quart du total).

## 3. LES IDÉES RETENUES

**① L'export se prouve, il ne se déclare pas.** Un outil qui n'a jamais tourné contre le cas pour
lequel il existe n'est pas un outil, c'est une intention. La preuve est un passage réel contre un
dépôt d'accueil, jamais un pourcentage de conformité.

**② Ce qui n'a pas de domicile dans le dépôt n'existera pas ailleurs.** Toute règle, toute
convention, toute raison qui ne vit que dans une conversation est perdue d'avance. C'est
l'Article 27, et c'est la seule chose qui distingue une Agence transportable d'un dossier de
scripts.

**③ L'unité de coût n'est pas la ligne, c'est l'OBLIGATION.** Fusionner des outils n'allège pas le
code (5 %). Ce qui sature, c'est le nombre de fichiers à tenir à jour — 395 — et c'est ce chiffre
qu'une rationalisation doit faire baisser.

**④ L'Agence ne doit pas rendre le projet d'accueil bavard.** La plupart des garde-fous partent de
leurs propres registres et ignorent un fichier étranger — c'est mesuré et c'est bien. Mais ceux qui
lisent tout l'arbre poseront des questions sur chaque dossier de l'utilisateur. Un outil bruyant
cesse d'être lu, et une Agence qui transforme le travail de son hôte en bruit a échoué.

**⑤ Le filet part avec l'Agence, mais il ne protège pas l'hôte.** Les deux moitiés de cette phrase
comptent. Il doit partir, sinon l'Agence arrive non testée. Et il ne teste pas le code de
l'utilisateur, donc il ne faut pas le lui vendre comme une protection.

## 4. LES RECHERCHES ET TROUVAILLES

**Le test du dépôt d'accueil, mené pour la première fois le 2026-10-02.** Un vrai petit projet —
un carnet de jardin partagé, un README et deux documents de décisions pleins de convictions
claires. Résultat : zéro proposition, et un message accusant l'hôte dix-neuf fois.

**La cause était un seuil hors de son nuage** : la dérivation au 75ᵉ centile est correcte, mais un
plancher en dur de 3 passait au-dessus du maximum observé (0). Sur ce dépôt-ci le plancher ne mord
jamais — maximum 26 — donc le défaut était invisible sans le test.

**La leçon qui dépasse ce cas** : tout mécanisme de cette Agence est calibré sur un corpus de 7 191
convictions. Un projet d'accueil en aura trois cents. **Chaque seuil dérivé d'un gros corpus est
suspect jusqu'à preuve du contraire sur un petit.**

## 5. LES DÉCISIONS DÉJÀ PRISES

- **Les blueprints génériques sont obligatoires**, sans exception depuis le 2026-09-26 : « les
  optionnels de l'agence ne pourront pas être réinstallés correctement si on les a intégrés à
  l'agence ».
- **Zéro sauvegarde conservée** (2026-10-02) : git est la sauvegarde, la remise efface le fichier.
- **La séparation des deux cerveaux du Jeu n'est jamais remise en cause au nom du coût** — elle
  appartient au Jeu, mais la règle qui l'protège appartient à l'Agence.
- **Un registre se LIT, il ne se recopie pas** (Article 24) : toute liste reflétant un autre
  système porte un garde-fou mécanique ou se lit dynamiquement.

## 6. CE QUI RESTE À TRANCHER

| # | La question |
|---|---|
| #1492 | « verrouiller le code » : convention de dossiers, lecture seule, ou paquet installé ? |
| #1493 | les 3 règles sans domicile : leur écrire un document, ou les laisser mourir ? |
| #1496 | les 6 bibliothèques et 4 outils d'environnement : les dispenser du kit ? |
| #1490 | l'Agence doit-elle livrer un filet VIDE pour le projet de l'utilisateur ? |
| #1368 | la licence : à qui l'Agence doit-elle pouvoir servir ? |

## 7. LE PLAN D'EXÉCUTION

**L'ordre n'est pas négociable, et il suit une seule règle : prouver avant d'élaguer.**

1. **Prouver l'export** — faire tourner l'Agence entière contre un dépôt d'accueil, pas seulement
   `fonder`. C'est la seule mesure qui dise si « il suffira de l'exporter » est vrai *(#1481 est le
   premier pas, fait)*.
2. **Loger ce qui n'a pas de domicile** — les 3 règles, puis chercher ce que la mesure ne voit pas
   *(#1484, #1493)*.
3. **Trancher la licence** — elle bloque les testeurs, donc elle bloque toute validation extérieure
   *(#1368)*.
4. **Alléger les obligations, pas le code** — les 10 fichiers du groupe facile d'abord *(#1496)*.
5. **Puis seulement** : le renommage en masse, qu'il a explicitement refusé d'infliger au code
   pendant un chantier complexe.

<!-- SOMMAIRE GÉNÉRÉ — ne rien écrire dans ce bloc, il se régénère -->

### ⟳ CE QUE LA FILE DIT AUJOURD'HUI — L'AGENCE SEULE

| Mesure | Valeur |
|---|---|
| Tâches ouvertes sur ce périmètre | **153** |
| Dont critiques | 10 |
| Thèmes couverts | 27 |
| La plus ancienne encore ouverte | 2026-09-22T11:50Z |
| Stratégies de chantier qui en descendent | 0 |
| | *(aucune ne déclare découler de celle-ci — elle est neuve)* |

*(Bloc DÉRIVÉ, régénéré par `node scripts/data-archangel.mjs strategies --ranger` — dernier passage 2026-10-02T22:31Z. Tout ce qui est au-dessus et au-dessous s'écrit à la main et n'est jamais touché.)*

<!-- FIN DU SOMMAIRE GÉNÉRÉ -->
