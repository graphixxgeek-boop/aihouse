# STRATÉGIE DE CHANTIER — EXPORT ET COMMERCIALISATION

*(Créée le 2026-09-26 05:44Z, liée à la tâche **#902**.)*

> **CE DOCUMENT NE RÉSUME JAMAIS.** Il AGRÈGE et il ORDONNE. Chaque idée y entre
> intégralement, entre guillemets, avec sa source. Trouver sa place dans la stratégie est
> le travail ; la raccourcir serait la perdre. En cas de conflit majeur entre une idée
> nouvelle et la stratégie en place, on ne tranche pas : on pose une question de calibrage.

## 1. POURQUOI CE CHANTIER

*l'intention d'origine, dans SES mots — jamais reformulée en vocabulaire d'agent*



« je voudrais qu'un outil mesure quelles fonctions sont inhérentes au fonctionnement de l'agence, quelles fonctions sont essentielles, insispensables, utiles, facultatives, optionnelles, etc. [...] pour pouvoir mesurer par la suite de quelles parties de l'agence on pourrait se separer dans des versions plus light »

— source : son gros prompt du 2026-09-26


« l'agence est faite pour etre consommé : c'est à dire : on installe l'agence au depart d'un projet de code, puis on la desinstalle avant la publication/commercialisation du projet de code. On a sauvegardé la version exporté de base, et c'est celle qu'on reutilise pour un nouveau projet. »

— source : son gros prompt du 2026-09-26


« dans le cadre de sa construction, l'agence demande certaines choses qu'elle ne demandera plus une fois commercialisée/exportée : par ex : l'acheteur achete l'agence, il l'installe. Ensuite l'agence n'a plus besoin d'etre exportable. Les versions exportables sont uniquement celles commercialisées »

— source : son gros prompt du 2026-09-26

## 2. CE QUI EXISTE DÉJÀ

*mesuré sur le dépôt, jamais supposé — c'est ce qui évite de reconstruire ce qui est là*



« SAFE-EXPORT est le septième Gardien sacré depuis le 2026-09-23. Sa couche légère tourne à chaque commit. Il porte findRaisonsPerdues() (alerte quand une raison écrite DISPARAÎT du dépôt) et findGardienAmbigu() (le mot « gardien » employé seul). Registre : 13 entrées pour 50 outils — une liste tenue à la main sans garde-fou, le patron exact que l'Article 24 interdit (tâche #807). »

— source : mesuré dans le dépôt le 2026-09-26


« Le dépôt compte 88 fichiers d'outillage et 49 582 lignes, dont check-house seul en pèse 12 052 — un quart de l'Agence dans un fichier (mesure #744). »

— source : mesure réelle, tâche #744


« La règle des deux documents par outil existe déjà : un blueprint générique réutilisable ailleurs, une instanciation propre à ce projet dans docs/referentiel/. C'est la moitié de l'exportabilité, déjà en place. »

— source : CLAUDE.md, inventaire documentaire

## 3. LES IDÉES RETENUES

*intégrales, citées, jamais résumées — chacune avec sa source*



« est-ce que les blueprints sont suffisants pour exporter ? un blu-print ca n'est pas du code ? comment fiabiliser les blueprint. je suis nice sur la question »

— source : son gros prompt du 2026-09-26


« l'outil est capable de mesurer l'exportabilité de l'agence et de dire lors de circle le pourcentage d'exportabilité de l'agence : il sait reperer ou il manque blue print indispensables [...] Existe-t-il un blue print de l'agence elle-même ? Chez quel outil ? Safe-export ? A creer si besoin. »

— source : son gros prompt du 2026-09-26


« Un blue print qui se met à jour automatiquement : tous les blue print doivent se mettre à jour automatiquement ca c'est ok ? [...] il doit y avoir un lien historique entre les blueprint et les versions, et on doit facilement savoir comment retrograder un blueprint dans une version moins developpée »

— source : son gros prompt du 2026-09-26


« safe export : l'outil vérifie les exports, et aussi à la marge : qu'un changement de modèle CLAUDE (opus, fable…) en cours de route est fluidifié grâce à l'outil, le relai se fait de manière propre et complète (mémoire, ligne de conduite, process, etc) et exportable »

— source : son gros prompt du 2026-09-26


« L'agence devrait tourner sur un modèle moins puissant que toi, tu ne dois pas te servir de toi même pour calibrer ca »

— source : son gros prompt du 2026-09-26


« on a absolument besoin de renforcer un outil ou de creer un nouvel outil pour mesurer : les performances de l'agence en terme d'économies réalisées : chaque fois qu'un outil est utilisé, son utilisation precise engendre une depense et une economie de : TOKEN, API, TEMPS »

— source : son gros prompt du 2026-09-26


« quelle est l'impact de l'agence sur la memoire disque ? [...] à combien ce cout peut-il etre au bout de 1 mois ? 2 mois ? 1 an ? »

— source : son gros prompt du 2026-09-26


« est-ce que tu te PERDS dans le fonctionnement de l'agence ou est-ce que ca T'AIDE vraiment. Sois honnête dans ta réponse stp. Pas besoin de me ménager ou de me plaire. Je veux du factuel. »

— source : son gros prompt du 2026-09-26

## 4. LES RECHERCHES ET TROUVAILLES

*ce qu'on est allé chercher dehors, et ce qu'on en a tiré*



« Le modèle « open core » (un cœur ouvert + une couche payante) ne tient QUE si on possède chaque ligne du code : c'est la condition posée en tête de toutes les sources. Ici elle est remplie — le dépôt n'a qu'un auteur et un agent — mais elle cesse de l'être au premier contributeur extérieur, et un accord de cession doit exister AVANT, jamais après. »

— source : recherche web du 2026-09-26 — mecanik.dev « Software Licensing Models: An Enterprise Guide 2026 » et nhimg.org « What Is Open Core Licensing? »


« Le piège documenté de l'open core, et il vise exactement ce que produit l'Agence : l'acheteur approuve l'outil sur ce que fait le cœur, puis découvre que la surveillance, la restriction d'accès et la rétention sont derrière le mur payant. Transposé ici : si les Gardiens sacrés sont dans le cœur mais que le suivi, les registres et les rapports sont payants, l'outil gratuit signale sans jamais rien garder — et c'est exactement l'inverse de ce que ce projet a appris (un rapport qui ne devient pas une tâche ne sert à rien, Article 28). »

— source : recherche web du 2026-09-26 — nhimg.org, glossaire « open core licensing »


« Le patron éprouvé cité par les sources est la double licence à la Qt / MySQL : une édition communautaire sous copyleft, et une licence commerciale pour qui ne peut pas accepter le copyleft. L'intérêt pour ce projet-ci est qu'il ne demande AUCUN découpage du produit — on vend le droit, pas une version amputée. C'est la seule forme qui n'oblige pas à fabriquer une « agence light » artificielle. »

— source : recherche web du 2026-09-26 — mecanik.dev, « Software Licensing Models »


« Ce qui rend un cadre d'agent IA réellement portable, d'après l'état de l'art : être agnostique au fournisseur de modèle et au langage, découper en compétences modulaires versionnées avec le code, séparer les préoccupations (planification, exécution, observation, correction) plutôt qu'un monolithe, et surtout DÉCHARGER LE CRITIQUE SUR DU DÉTERMINISTE branché aux événements du cycle de vie — de sorte que le système, et non le modèle, garantisse l'exécution. »

— source : recherche web du 2026-09-26 — epsilla.com « 12 Reusable Agentic Harness Design Patterns from Claude Code », spring.io « Agent Skills », devblogs.microsoft.com « AGENTS.md and Skills »


« LE POINT QUI VALIDE L'ARCHITECTURE DE L'AGENCE, et il mérite d'être noté tel quel : « offload critical tasks to deterministic middleware, bind them to specific agent lifecycle events, so the system — not the LLM — guarantees execution ». C'est mot pour mot ce que fait le crochet post-commit avec les sept Gardiens sacrés. Ce n'est donc pas une particularité de ce projet : c'est un patron reconnu, et l'Agence en est une instance complète plutôt qu'une bizarrerie locale. »

— source : recherche web du 2026-09-26 — thesystemguide.com « Common Security Anti-Patterns in AI Agent Deployments » et epsilla.com


« L'anti-patron nommé qui décrit un vrai risque ici : « every invocation starts from zero context », le manque de partage de contexte, cité comme LE facteur qui limite la réutilisabilité entre projets. C'est exactement ce que l'Article 27 et le process XP-IA adressent — et c'est la partie de l'Agence qui n'est PAS du code, donc la plus difficile à exporter. »

— source : recherche web du 2026-09-26 — dev.to « I Built 100+ Gen AI Agents » et epsilla.com


« COÛT D'HÉBERGEMENT DU SITE, chiffres 2026 : le palier gratuit de Cloudflare Workers couvre 100 000 requêtes/jour, 10 ms de CPU par invocation, 128 Mo de mémoire ; D1 y ajoute 5 Go de stockage, 5 millions de lignes lues et 100 000 écrites par jour. Le palier payant démarre à 5 $/mois minimum par compte, puis 0,30 $ par million de requêtes au-delà de 10 millions inclus. La bande passante sortante n'est facturée ni sur Workers, ni sur D1, ni sur R2. »

— source : recherche web du 2026-09-26 — developers.cloudflare.com/workers/platform/pricing et developers.cloudflare.com/d1/platform/pricing


« CE QUE CES CHIFFRES CHANGENT POUR LA DÉCISION, et c'est net : l'hébergement n'est PAS le sujet. Tant que le site reste sous 100 000 requêtes/jour, il coûte 0 €, et le premier palier payant est à 5 $/mois. Le coût réel de ce projet est ailleurs — dans les appels au modèle (Article 8, deux cerveaux par tour) et dans les 19 Mo de dépôt qui croissent de 2,4 Mo/jour. Projeter l'hébergement à un an était une inquiétude légitime, et la mesure la retire de la liste. »

— source : dérivé des chiffres Cloudflare ci-dessus croisés avec l'empreinte disque mesurée le 2026-09-26

## 4bis. LES QUATRE MOMENTS D'ARRIVÉE DE L'AGENCE (2026-09-27, idée de l'utilisateur)

**Son idée, dans ses mots** : « les 4 possibilités : intégration de l'agence AVANT / À LA SOURCE /
EN COURS / À LA FIN d'un projet (de site web, de jeu…) ».

**Pourquoi c'est structurant et pas un simple découpage commercial** : l'Agence ne rend pas le même
service selon le moment où elle arrive, et surtout elle n'a pas les mêmes DROITS. Arrivée avant, elle
peut imposer une architecture ; arrivée à la fin, elle ne peut plus que constater et proposer. Un
outil qui suppose toujours le même moment se trompera trois fois sur quatre.

| Moment | Ce que l'Agence peut faire | Ce qu'elle ne peut plus faire | Le geste type |
|---|---|---|---|
| **AVANT** — le projet n'existe pas encore | poser l'architecture : comment le filet de sécurité sera bâti, comment les tests seront découpés, où vivront les registres | rien à rattraper : c'est la position idéale | **prescrire** un gabarit |
| **À LA SOURCE** — le projet démarre | brancher les garde-fous dès le premier commit, avant qu'aucune dette ne naisse | plus de table rase totale, mais presque | **installer** la machinerie |
| **EN COURS** — le projet tourne depuis des mois | mesurer l'existant, nommer les dettes, proposer des corrections encadrées | imposer une architecture : ce serait une réécriture, pas une intégration | **diagnostiquer** puis proposer |
| **À LA FIN** — le projet est livré ou figé | rendre un état des lieux, préparer la reprise par quelqu'un d'autre | changer quoi que ce soit au produit | **documenter** et transmettre |

**LA CONSÉQUENCE POUR CHAQUE OUTIL, et c'est le vrai apport de cette grille** : un outil doit savoir
dans lequel de ces quatre mondes il se trouve, ou au minimum déclarer celui qu'il suppose. Un outil
qui suppose « EN COURS » et qu'on lance « AVANT » ne trouvera rien et se croira inutile ; un outil
qui suppose « AVANT » et qu'on lance « À LA FIN » proposera une réécriture que personne ne veut.

**Le cas d'école, mesuré le jour même** : EZECHIEL-LES-TESTS suppose « EN COURS » — il enquête sur un
filet qui existe déjà, et le chemin de ce filet est **écrit en dur** dans son code
(`FILET = "scripts/check-house.mjs"`). Sur un autre projet il ne saurait ni trouver le filet, ni en
proposer un s'il n'y en a pas. Trois manques identifiés, trois tâches ouvertes.

## 4ter. LES DOCUMENTS DE RÉFÉRENCE ET LA CHARTE — mesuré le 2026-09-27

**Ses questions, dans ses mots** : « les fichiers de références sont-ils exportables ? avec
abraham ? les fichiers de references sont ils bien construits en architecture (pour un futur
projet) ? comment bien exporter toute cette partie ? y compris dans le contenu : certaines regles
concernent le fonctionnement de l'agence et pas du jeu, il faut que ces regles soient inscrites
dans un autre projet, au meme endroit, je pense ? »

### Ce que la mesure dit, contre le dépôt réel (459 documents classés, 100 % de couverture)

| Ensemble | PART (s'exporte) | RESTE (propre au jeu) | MÉMOIRE (archive) |
|---|---|---|---|
| `docs/referentiel/` (105 fiches) | **90** | 11 | 4 |
| Tout le dépôt (459 documents) | 208 | 14 | 237 |

**Les 11 fiches qui restent sont exactement les bonnes** : `principes`, `parametres`,
`regles-du-temps`, `regles-de-l-espace`, `regles-des-graphismes`, `regles-de-la-memoire`,
`points-fragiles`, `feuille-de-route`, `charte-cartographie`, `claude-md-regles`,
`organisation-globale-projet`. Ce sont les règles du JEU. Le classement n'a pas de trou de ce
côté-là — l'architecture des fiches tient.

### LE TROU EST AILLEURS, ET IL EST EXACTEMENT CELUI QU'IL PRESSENTAIT

**`CLAUDE.md` est classé RESTE en entier** — « propre au jeu Lia/Noé, ne sert à rien ailleurs ».
Or sur ses 33 Articles, une petite dizaine seulement parlent du jeu :

| Parlent du JEU (restent) | Parlent de l'AGENCE (devraient partir) |
|---|---|
| 0 (l'esprit des personnages), 1 (la conversation prime), 4 (l'enquête tient debout), 9 (rejouabilité), 10 (répliques locales), 11 (zéro répétition), 12 (le sens avant la forme), 17 (se mettre à la place des personnages) | 3, 5, 6, 7, 13, 14, 15, 16, 18, 19, 20, 20bis, 21, 24, 25, 26, 27, 28, 29, 30, 31, 32 — comprendre avant de toucher, corriger la cause, un rapport devient des tâches, le temps se lit, tout passe par un outil, reprenable par une autre IA… |
| Mixtes : 2 (cohérence, cite les jauges), 8 (sobriété API, cite Gemini), 22 (Smart Conso API) | |

**Deux Articles sur trois sont génériques, et aujourd'hui aucun ne part.** Un projet suivant
repartirait sans « comprendre avant de toucher », sans « un rapport n'est pas fini tant qu'il n'est
pas devenu des tâches », sans « le temps se lit, jamais ne se déduit » — c'est-à-dire sans ce qui a
coûté le plus cher à apprendre ici.

### LA CAUSE, ET ELLE EST STRUCTURELLE

**Chaque outil a deux documents : un blueprint générique et une instanciation propre au projet.**
82 blueprints existent. **La charte, elle, n'a pas de blueprint.** Elle mélange dans un seul fichier
ce qui est vrai pour Lia et Noé et ce qui serait vrai pour n'importe quel projet piloté par IA — et
comme elle est un seul fichier, le classement ne peut que la ranger d'un côté ou de l'autre. Il l'a
rangée du mauvais.

Le même raisonnement vaut pour `docs/regles-de-travail.md` (la méthode de collaboration : presque
entièrement générique) et pour `docs/philosophie-et-politique.md`, qui est **déjà écrit** pour être
réutilisable ailleurs — la preuve que la séparation est possible et qu'elle a déjà été faite une fois.

### CE QUI EST PROPOSÉ, ET QUI RESTE À TRANCHER

1. **Donner un blueprint à la charte** : `docs/charte-blueprint.md`, la version générique des ~22
   Articles d'Agence, sans une ligne sur Lia ni Noé. `CLAUDE.md` en devient l'instanciation : il
   garde les Articles de jeu et cite le blueprint pour le reste. Même patron que les 82 autres —
   **rien de nouveau à inventer, seulement à appliquer**.
2. **Le vérificateur naturel est Abraham**, pas MOÏSE. MOÏSE ne connaît qu'un document, la charte ;
   Abraham traite n'importe quel document à règles numérotées, donc il peut comparer le blueprint
   et l'instanciation et dire lesquelles des règles sont tombées en route.
3. **À trancher** : découper la charte est une opération sur la pièce maîtresse du projet. Elle
   demande la double confirmation de l'Article 14, et elle n'est pas engagée.

### LES OUTILS : lesquels partent ?

Mesuré contre `EXEMPTES_DU_KIT` (`scripts/safe-export.mjs`), la seule liste qui fasse foi :
**tous les outils de l'Agence partent**, y compris MOÏSE, Abraham et Ezechiel. Trois catégories
seulement sont dispensées, chacune avec sa raison écrite : les crochets git, le script
d'installation de l'environnement, et ce qui sert le PRODUIT plutôt que l'outillage.

**Le seul cas particulier est `check-house.mjs`** : « la suite de tests DE ce projet : elle teste le
jeu, donc elle le nomme. Elle ne s'exporte pas, elle se réécrit. » Juste pour son CONTENU — mais la
décision laisse partir son ARCHITECTURE avec, alors que c'est elle qui vaut (cf. tâche #1028).

**Et un avertissement mesuré le même jour** : « l'outil part » ne veut pas dire « l'outil marche
ailleurs ». Ezechiel est dans le kit d'export et pourtant le chemin du filet est écrit en dur dans
son code. **Être exportable et être portable sont deux choses différentes**, et seule la première
est aujourd'hui vérifiée.

## 4quater. LE PLAN D'ACTION PORTABILITÉ (2026-09-27, tâche #1034)

**Sa demande** : « pour la PORTABILITE tu me diras ton plan d'action ». Trois étapes, dans cet
ordre, et chacune conditionne la suivante.

### Étape 1 — MESURER (faite le jour même)

`mesurerLaPortabilite()` dans SAFE-EXPORT balaie les 82 scripts et compte ceux qui portent, **dans
leur code et non dans leurs commentaires**, un chemin ou un nom propre à ce dépôt. Résultat :
**42 sur 82, soit 49 % de portabilité contre 100 % d'exportabilité**. Les deux chiffres s'affichent
côte à côte, et un contre-test du filet interdit qu'ils fusionnent jamais.

### Étape 2 — CLASSER, parce qu'un lien n'est pas forcément un défaut

**C'est l'étape que personne ne saute impunément** : traiter les 42 comme 42 bugs serait un chantier
absurde. Trois catégories, et une seule appelle du travail :

| Catégorie | Ce que c'est | Le geste |
|---|---|---|
| **PARAMÉTRABLE** | l'outil lit un chemin qui pourrait être un argument avec ce chemin comme défaut | une ligne : `{ dossier = "docs/suivi/" } = {}` — le comportement d'ici ne change pas d'un iota |
| **À DÉCOUPLER** | l'outil suppose une structure, pas seulement un chemin (« il existe un dossier par outil », « la charte est numérotée par Articles ») | du vrai travail : faire DÉTECTER la structure au lieu de la supposer |
| **LÉGITIMEMENT LIÉ** | l'outil sert le PRODUIT, pas l'outillage | rien à faire — il ne part pas, et c'est écrit |

**La première catégorie est probablement la plus grosse**, et elle coûte presque rien. C'est là que
le taux monte vite, sans risque.

### Étape 3 — PROUVER, avec un PROJET TÉMOIN

Les deux premières étapes reposent sur la lecture du texte. **La seule preuve est l'exécution.**

Un **projet témoin** : un dépôt minuscule et synthétique, avec une arborescence VOLONTAIREMENT
différente (pas de `docs/referentiel/`, une charte nommée autrement, un filet nommé autrement, aucun
personnage). On lance toute l'Agence dessus, et on classe :

- **PORTABLE** — l'outil rend un résultat sensé ;
- **HONNÊTE** — l'outil rend « PAS MESURÉ » avec sa raison : c'est un **bon** résultat, pas un échec ;
- **NON PORTABLE** — l'outil plante, ou pire, rend un résultat qui parle du projet d'origine.

**Le piège que ce test ferme, et il est le vrai enjeu** : un outil qui lit un dossier absent ne
plante pas. Il rend zéro, et zéro se lit comme « rien à signaler ». Sans projet témoin, ce cas-là
est **invisible** — et c'est le plus probable des trois.

C'est la technique standard du métier pour tester un outillage : un dépôt de fixture. Elle est
gratuite, elle tourne en secondes, et elle se rejoue à chaque Ronde.

### Les critères d'un bon projet témoin, et le premier essai RÉEL (2026-09-27)

**Sa question** : « on prend un vrai dépôt extérieur ? pour que ça sorte des redondances
éventuelles dues à moi, pour que ça sorte de ma bulle ». **L'intuition est juste, et c'est le
critère le plus important des cinq.**

| Critère | Pourquoi il compte |
|---|---|
| **ÉTRANGER** | un témoin qu'on a écrit soi-même porte nos propres habitudes : les outils s'y sentiraient chez eux et on ne verrait rien |
| **REPRODUCTIBLE** | le même témoin doit rendre le même verdict — un dépôt extérieur se fige sur un commit précis, jamais suivi en continu |
| **PETIT ET RAPIDE** | il doit se rejouer à chaque Ronde ; un témoin qui prend dix minutes ne sera plus lancé |
| **RÉALISTE** | un vrai projet avec son vrai désordre, pas une maquette assainie qui ne surprendra personne |
| **PAUVRE EN OUTILLAGE** | ni charte, ni référentiel, ni filet : c'est le moment « AVANT » de la grille des quatre moments, et le plus révélateur |

**PREMIER ESSAI FAIT LE JOUR MÊME**, sur un vrai dépôt public cloné dans le conteneur (le réseau le
permet, vérifié). Les 82 scripts copiés dedans, huit outils lancés :

| Verdict | Outils | Ce que ça dit |
|---|---|---|
| ✅ **tourne** | Ezechiel (7 × « pas mesuré »), data-archangel, SAFE-EXPORT, Abraham, tool-brain | ils survivent à un dépôt inconnu et DÉCLARENT ce qu'ils ne peuvent pas mesurer — c'est le **bon** résultat, pas un échec |
| 💥 **plante** | ecotoken, le-classificateur, MOÏSE | ils cherchent un fichier de charte qui n'existe pas et s'arrêtent net |

**Trois enseignements en trois minutes de test :**

1. **La distinction « honnête » / « non portable » n'est pas théorique** : Ezechiel dit sept fois
   « pas mesuré » et rend la main proprement. C'est exactement le comportement voulu.
2. **On ne peut pas emporter UN outil, on emporte l'Agence ou rien** : le premier essai avec dix
   scripts a planté sur des imports manquants. La toile de dépendances est dense — ce n'est pas un
   défaut, mais c'est une contrainte d'export à écrire.
3. **Trois outils sur huit plantent sur l'absence de charte.** C'est le cas le plus fréquent et le
   plus facile à corriger : rendre « pas de charte trouvée » au lieu de s'arrêter.

**Décision proposée** : le témoin principal est un **dépôt public extérieur figé sur un commit**,
parce qu'il est le seul à casser la bulle. Le programme HTML de l'utilisateur ferait un **second
témoin** précieux mais pour une autre question — l'Agence arrivant sur un vrai produit sans aucun
outillage, écrit par lui, donc utile immédiatement mais porteur de ses habitudes.

### Ce qui reste à trancher

L'ordre entre l'étape 2 et l'étape 3 est discutable : construire le projet témoin d'abord donnerait
la classification **par la mesure** au lieu de la donner par la lecture. C'est plus sûr et plus
long. Décision de l'utilisateur.

## 5. LES DÉCISIONS DÉJÀ PRISES

*ce qui ne se rediscute plus, avec la date et qui a tranché*



« TRANCHÉ en fenêtre le 2026-09-26 : un blueprint ne suffit PAS à exporter. Un blueprint est de la PROSE : il dit ce qu'un outil doit faire et pourquoi, pas comment. Il permet de RECONSTRUIRE l'outil ailleurs, pas de le TRANSPLANTER. Un vrai export a besoin des deux : le blueprint (le pourquoi, qui survit au changement de langage) ET le fichier .mjs (le comment). »

— source : sa réponse en fenêtre de calibrage, 2026-09-26


« TRANCHÉ en fenêtre le 2026-09-26 : l'échelle de vitalité a QUATRE niveaux — vital (sans lui l'Agence ne tourne pas), essentiel (sans lui elle tourne mais perd une garantie), utile (il fait gagner du temps), optionnel (confort ou cas particulier). »

— source : sa réponse en fenêtre de calibrage, 2026-09-26


« TRANCHÉ en fenêtre le 2026-09-26 : les bénéfices nets se mesurent sur ce qui EST mesurable — appels API évités, tokens économisés, défauts trouvés. Le contrefactuel « temps qu'aurait pris un codage sans Agence » n'est PAS mesurable sans groupe témoin, et un argument commercial bâti sur un chiffre inventé s'effondre à la première question. »

— source : sa réponse en fenêtre de calibrage, 2026-09-26


« TRANCHÉ en fenêtre le 2026-09-26 : recherches web CIBLÉES, 3 à 4 questions précises, pas un panorama de marché. »

— source : sa réponse en fenêtre de calibrage, 2026-09-26

## 6. CE QUI RESTE À TRANCHER

*les arbitrages qui lui reviennent — jamais tranchés par l'agent*



« LA PART DE L'AGENCE INUTILE EN VERSION COMMERCIALISÉE. Il demande de l'estimer en lignes de code. La logique à préciser avec lui : l'exportabilité est un besoin DU CRÉATEUR pendant la construction, pas de l'acheteur après installation. »

— source : son gros prompt du 2026-09-26

**MESURÉ LE 2026-09-27 (tâche #902) — `node scripts/safe-export.mjs export`, section « CONSTRUIRE OU
FAIRE TOURNER ».** La question chiffrée est répondue, l'arbitrage reste le sien.

- **70 551 lignes sur 70 793 servent à CONSTRUIRE — 99,7 %.**
- **242 lignes seulement servent encore le produit une fois installé** : `scripts/install-pnpm.sh`
  (217 lignes, il décrit la machine d'ici) et `scripts/run-framework.mjs` (25 lignes, il lance le jeu).

**CE QUE LE CHIFFRE CONFIRME** : son intuition était juste, et plus fortement qu'annoncé. L'Agence
n'est pas « en partie » inutile après installation — elle l'est presque entièrement, par
construction. C'est la définition même d'un outillage : il sert à fabriquer, pas à tourner.

**CE QUE LE CHIFFRE NE DIT PAS, et la mesure l'imprime elle-même** : il compte `scripts/`
seulement, donc l'outillage ; le produit (`lib/`, `app/`, `components/`) n'est pas au dénominateur.
Et une ligne n'est pas un coût — 70 000 lignes que personne ne lance ne pèsent rien à l'exécution.
Ce chiffre éclaire un arbitrage, il ne rend aucun verdict.

**CE QUI RESTE À TRANCHER, et c'est lui qui le tranche** : faut-il livrer une version commercialisée
SANS l'outillage (un produit net, mais l'acheteur ne peut plus le faire évoluer avec l'Agence), AVEC
(il hérite de la machine à construire, et de sa maintenance), ou les deux en deux offres ?


« LA TAILLE DE CODE CIBLE. Est-ce que 49 582 lignes d'outillage peuvent servir un projet plus petit qu'elles ? aussi gros ? plus gros ? Question ouverte, recherches web demandées. »

— source : son gros prompt du 2026-09-26


« LES MEMBRES CLASSIQUES N'ONT PAS DE BLUEPRINT, par décision documentée. Sont-ils indispensables au fonctionnement de l'Agence ? Si oui, comment les exporter sans blueprint ? Question qu'il pose et qui n'est pas tranchée. »

— source : son gros prompt du 2026-09-26

**LA QUESTION S'EST REFERMÉE TOUTE SEULE, ET AVANT QU'ON LA TRAITE (constaté le 2026-09-27, tâche
#902).** Il avait déjà répondu lui-même le 2026-09-26, dans un autre échange, et sa raison est
décisive : « les optionnels de l'agence ne pourront pas être réinstallés correctement si on les a
intégrés à l'agence. Ça n'est pas logique. » La dispense de blueprint a été **abrogée** ce jour-là,
et les six outils concernés ont reçu leurs pièces le jour même. Il n'y a donc plus de membre sans
blueprint à exporter.

**ET LE CHIFFRE LE CONFIRME MÉCANIQUEMENT** : la couverture blueprint est de **100 % aux quatre
niveaux de vitalité** (39/39 vitaux, 3/3 essentiels, 25/25 utiles, 16/16 optionnels), zéro bloquant.

**MAIS CE 100 % ÉTAIT FAUX JUSQU'À CE MATIN, et c'est la trouvaille du jour.** La mesure annonçait
six outils « sans blueprint » — `check-argus`, `check-gemini-quota`, `check-harmonia`, `kpi-report`,
`the-screener-capture`, `memento` — **les six à tort**. Elle cherchait un plan nommé d'après le
SCRIPT quand un plan est nommé d'après l'OUTIL : ARGUS s'appelle `check-argus.mjs` et son plan
`argus-blueprint.md`. Le lien exact est écrit dans la colonne « Architecture » de l'inventaire de
CLAUDE.md ; la mesure le LIT désormais au lieu de le deviner (Article 24).

**LA VRAIE LEÇON N'EST PAS LE CHIFFRE, C'EST LA RÉCIDIVE** : c'est la **troisième** fois que ce dépôt
paie exactement ce défaut — LE-CLASSIFICATEUR accusait 22 outils d'être « SANS FICHE », puis
`findOutilsSansBlueprint()` a accusé les mêmes le matin même, dans le même fichier, cinquante lignes
plus haut. Corriger une occurrence ne corrige pas la classe.

## 7. LE PLAN D'EXÉCUTION

*ne se remplit qu'À LA FIN, juste avant la construction effective*

*(vide — rien n'a encore été versé ici)*
