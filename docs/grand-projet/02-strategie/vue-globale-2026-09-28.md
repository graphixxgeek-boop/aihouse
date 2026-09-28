# LA VUE GLOBALE — ce que j'ai compris, ce que j'en pense, et ce que je recommande

*(Tâches #1111 absorption · #1112 questions · #1113 point de non-retour · #1114 lien tâche↔chantier.
Écrit le 2026-09-28 après lecture des 20 documents, et pas une minute avant : c'est son ordre —
« tout absorber pour avoir une vue globale AVANT de commencer à VRAIMENT analyser ».)*

**Son calibrage ② disait : rien pendant l'absorption, UN point quand la vue globale est là.**
La voici. Ce document est ce point, et il est le seul.

---

## 1. Ce qui a été lu

Vingt documents, environ 64 000 mots, 141 pages. Ses deux fichiers d'abord — parce que je ne peux
pas exercer l'autorité qu'il me donne sans avoir lu le document qui la borne — puis les sept lots
préparés, dans leur ordre de production.

**Sur les « APRÈS » dans les noms de dossier** (`AUDIT NIVEAU 2 APRES ARCHITECTURE`) : il l'a
précisé lui-même, ils forment une chaîne **de lecture**, jamais un ordre d'exécution. C'est
important au-delà du détail : chacun de ces documents propose SON plan en 10 ou 12 étapes, et
**aucun de ces plans n'est le nôtre**. L'ordre du chantier reste entier à décider.

Trace complète de la lecture : `../01-absorption/ce-que-jai-lu.md`.
Ses 49 questions, extraites et rassemblées : `../01-absorption/questions-consolidees.md`.

---

## 2. Les sept lots disent tous la même chose, et c'est rassurant

Cinq idées reviennent chez tous, produites à des jours d'intervalle et par des analyses
différentes. Quand des analyses indépendantes convergent, ce n'est plus un avis, c'est un constat.

1. **Ne pas commencer par découper les gros fichiers.** Les frontières existent déjà dans les
   têtes ; elles n'existent pas encore dans le code. Le travail est de les rendre techniques.
2. **Frontière d'abord, extraction ensuite** (« Boundary First, Extraction Later »). On pose une
   façade, puis un adaptateur, puis un contrat — et on n'extrait qu'après.
3. **Rationaliser AVANT de modulariser**, sous peine de « transformer le bric-à-brac en bric-à-brac
   modulaire » : cent modules techniquement indépendants et une organisation toujours mauvaise.
4. **Le projet n'est pas à refaire.** « Conserver l'intelligence, changer la géométrie. »
5. **Ne rien supprimer qui a une raison historique écrite** — et ils citent notre propre Article 19
   pour le dire.

**Et une convergence de méthode qui vaut pour tout le chantier** : chaque étape doit avoir une
DESTINATION écrite. « Découper check-house » n'en est pas une ; « séparer le moteur de détection du
rapporteur pour que le moteur serve seul » en est une. C'est ce qui empêche le refactoring infini.

---

## 3. Leurs chiffres, revérifiés contre le dépôt RÉEL

Les sept lots ont analysé une **archive du 28 septembre à 13h35, sans `.git/` et sans
`node_modules/`**. Ils le déclarent honnêtement et s'interdisent d'en conclure quoi que ce soit sur
l'exécution. J'ai relancé la mesure sur le dépôt vivant, ce soir.

| | Eux (archive 13h35) | **Le dépôt réel, 2026-09-28 au soir** |
|---|---:|---:|
| fichiers `.mjs` dans `scripts/` | 86 | **87** |
| lignes dans `scripts/` | 82 490 | **84 542** |
| lignes de code au total | 95 397 | **97 149** |
| `check-house.mjs` | 20 342 | **21 004** |
| documents `.md` | 481 | **498** |
| fichiers dans `docs/` | 1 098 | **1 140** |

**Aucun écart n'est une erreur de leur part** : le dépôt a bougé pendant qu'ils l'analysaient.
Mais ça dit une chose utile pour la suite : **un audit sur instantané vieillit en quelques heures
sur ce projet.** Tout ce qui sera décidé devra donc être DÉRIVÉ du dépôt au moment où on l'exécute,
jamais recopié d'un de ces rapports — ce qui est exactement la règle qu'il a lui-même écrite dans sa
commande : *« tous les rapports sont constitués à partir de données dérivées »*.

**Le chiffre qui recadre tout, et il est confirmé** : `scripts/` porte **87 %** du code du dépôt.
L'Agence n'est pas l'outillage du jeu. C'est le plus gros logiciel des deux.

---

## 4. Ce que les audits ne pouvaient pas voir, et qui change la conduite

Ce sont des regards extérieurs sur une archive. Cinq choses leur échappent, et elles sont à moi.

### 4.1 — Le SITE n'apparaît nulle part, et c'est le trou le plus grave

Les sept lots parlent de `/api/lia` comme d'un fichier de 1 817 lignes qui mélange HTTP, DB, verrou,
domaine et Gemini. C'est exact. **Mais aucun ne dit ce qu'il y a dedans** : c'est là que vit
l'esprit de Lia et Noé, la seule chose que la charte appelle « loi suprême » (Article 0).

Ils classent tous `/api/lia` en « risque très élevé, à faire en dernier ». **Ils ont raison, et pour
la mauvaise raison** : ils le disent risqué parce qu'il est couplé. Il est risqué parce qu'un ton
ne se teste pas comme une fonction. `daynight` a 14 tests de caractérisation qui prouvent son
comportement ; le ton de Noé n'a que `check-spirit`, qui coûte de vrais appels API et se lit à
l'œil humain.

**Ce que ça impose, et que je poserai comme une ligne rouge du chantier** : toute étape qui touche
au chemin du dialogue passe par `check-spirit` AVANT et APRÈS, et le résultat se lit, il ne se coche
pas. C'est la seule chose de tout ce corpus que je considère comme non négociable.

### 4.2 — Leur paradoxe central se vérifie chez nous, avec nos propres chiffres

Le lot rationalisation écrit : *« la documentation de l'Agence est souvent plus mature que son
architecture logicielle ; les mécanismes de gouvernance sont plus structurés que les composants
qu'ils gouvernent »*. Il le déduit de la structure. **Nos propres mesures, faites indépendamment
cette semaine, disent la même chose en chiffres** :

- **10 registres** à renseigner pour qu'un outil neuf rejoigne l'Agence (mesuré par JESUS, #1103) ;
- **480 lignes de bannière** écrites à chaque commit dans un fichier que personne n'ouvre ;
- **42 %** de mes propres passages d'outils sont des relances rapprochées, pas des usages ;
- **2 outils** n'ont jamais servi qu'à se construire eux-mêmes.

Deux analyses qui ne se sont pas parlé arrivent au même endroit. **Le diagnostic est donc établi,
pas discutable.**

### 4.3 — Notre classification existe déjà, et il lui manque exactement UNE chose

Les audits proposent une taxonomie neuve de 15 types (CORE SERVICE, DOMAIN MODULE, TOOL,
ORCHESTRATOR, GUARDIAN, REGISTRY, INFRASTRUCTURE, ADAPTER…) et présentent ça comme « la correction
architecturale la plus importante de toute la phase ».

**Nous avons déjà neuf axes de classification**, dérivés et mesurés à chaque passage : `iceberg`,
`type`, `moment`, `domaine`, `destinataire`, `cherche`, `vitalite`, `exportabilite`, `nature`.

J'ai regardé ce que notre axe `type` dit réellement. Ses valeurs sont : *crochet ·
filet-de-sécurité · commande-documentée · commande-sans-fiche · bibliothèque-partagée ·
bibliothèque-solitaire · infrastructure-shell · exécution-directe-non-documentée*.

**C'est la NATURE DU FICHIER, jamais la COUCHE ARCHITECTURALE.** Notre classification sait dire
qu'un fichier est une commande documentée ; elle ne sait pas dire s'il appartient au CORE, au TOOL
SYSTEM, à la GOUVERNANCE ou aux ADAPTERS. **Les audits ont donc raison sur le manque, et tort sur
le remède** : il ne faut pas une nouvelle taxonomie à côté des neuf axes — il faut **un dixième
axe**, `couche`, dérivé comme les autres. Un axe de plus dans une machine qui en porte déjà neuf
coûte une journée ; une taxonomie concurrente coûte un an et deux sources de vérité.

### 4.4 — Ils recommandent de construire six composants que nous avons déjà, en morceaux

Le fichier LITTÉRATURE conseille de démarrer par six composants : Workspace, Tool Broker, Model
Gateway, Policy Engine, Transaction Engine, Supervisor. Le conseil est bon **pour qui part de
zéro**. Chez nous, cinq des six existent déjà, éparpillés :

| Composant conseillé | Ce que nous avons déjà, dispersé |
|---|---|
| Tool Broker | `tool-brain` + `find-brain` + `find-booster` + `route-booster` + une part de `le-coordinateur` |
| Policy Engine | `the-king` + `angel-of-ia-process` + `god-of-all-process` + `check-level-target` |
| Observability | `tool-usage` + `kpi-report` + `serie-temporelle` + `smart-conso-token` + `smart-conso-api` |
| Knowledge | `data-archangel` + `memento` + `abraham-les-references` + `doc-report` |
| Export | `safe-export` + `x-port-blindtest` + `integration-outil` |
| **Transaction Engine** | **rien. C'est le seul qui manque vraiment.** |

**Le seul trou réel de toute la liste est le Transaction Engine** — préparer une modification,
la prévisualiser, l'appliquer, la vérifier, et pouvoir revenir en arrière. Nous avons des garde-fous
qui REFUSENT (le filet, les crochets), nous n'avons rien qui ANNULE.

### 4.5 — Le marché : leurs chiffres ne sont pas vérifiés, et je le dis plutôt que de les citer

Le lot rationalisation avance « 90 % des développeurs professionnels utilisent des coding agents
chaque semaine (JetBrains 2026) » et décrit l'état du marché (Copilot, Codex, Agents API d'OpenAI,
Devin, LangGraph). **Je n'ai vérifié aucun de ces chiffres**, et ils commandent une décision
commerciale — donc ils seront revérifiés par des recherches web enregistrées sur disque, comme sa
propre consigne l'exige, avant de fonder quoi que ce soit.

Ce qui me paraît juste **sans avoir besoin d'un chiffre**, c'est la conclusion : construire « encore
un agent qui code » nous mettrait face à Claude Code, Copilot, Codex et Cursor. La différenciation
possible est ailleurs, et elle est déjà ce que ce projet fait sans l'avoir nommé :
**gouverner des agents plutôt qu'en être un.**

---

## 5. LA TENSION CENTRALE, et c'est le point le plus important de ce document

Sa commande demande, entre autres : trois documents de STRATÉGIE GLOBALE · un PACK DÉCOUVERTE
(une liste, une présentation de 6-8 pages, des annexes à la demande, le tout en DEUX versions) ·
des **étiquettes ADMIN/UTILISATEUR posées partout avec effet rétroactif** · des process nouveaux
pour le jeu, l'agence et le projet entier.

Les sept lots disent, eux, que le problème actuel est que **la gouvernance est déjà plus grosse que
ce qu'elle gouverne** — et l'un d'eux en fait une loi : *« la gouvernance doit être plus petite que
ce qu'elle gouverne »*.

**Les deux sont vrais en même temps, et ce n'est pas une contradiction : c'est un problème
d'ORDRE.**

Écrire aujourd'hui trois stratégies à la main, un pack de présentation et des étiquettes
rétroactives sur 1 140 fichiers, c'est ajouter une douzième couche documentaire à un système dont le
diagnostic unanime est qu'il en porte déjà trop. **Et c'est précisément le geste que sa propre règle
interdit** : *« tous les rapports et documents sont constitués à partir de données DÉRIVÉES, sauf
raison valable ou évidente »*.

**La sortie est écrite dans sa commande, par lui.** Presque tout ce qu'il demande est **dérivable**
une fois la carte des capacités posée :

- la **présentation de l'Agence** se dérive de la carte des capacités + de l'organigramme + des KPI ;
- la **liste du PACK DÉCOUVERTE** se dérive du registre des documents, qui existe déjà ;
- l'étiquette **ADMIN / UTILISATEUR** est un dixième axe de classification, dérivé, pas 1 140
  étiquettes posées à la main — et un axe dérivé est rétroactif par construction, ce qui répond
  exactement à son « avec effet rétroactif » ;
- les **stratégies** se dérivent en grande partie des chantiers et des tâches déjà ouverts.

**Ce qui ne se dérive pas et qui restera écrit à la main, c'est le peu qui compte** : l'objectif,
les bornes, les arbitrages. C'est-à-dire **ses décisions à lui**, pas des documents.

**Et ça répond à sa dernière question de commande** — *« un gros chantier… ou pas ? Je me demande si
finalement tout n'est pas déjà là sous nos yeux, et qu'il manquait de le formaliser et de
l'instituer »*. **Sa réponse est la bonne, et elle se scinde en deux** :

- **la STRATÉGIE est surtout une RÉVÉLATION** — petit chantier, quelques jours ;
- **la RATIONALISATION est un VRAI chantier** — celui qui prend du temps.

---

## 6. Ce que je recommande, en tant que juge final

Il me l'a donné explicitement : *« pour décider de la mise en place concrète, TU ES LE JUGE FINAL
QUI TRANCHE, à la lumière de mes consignes et de mes intentions profondes. »* Voici donc un avis,
pas un menu.

### La forme du chantier : QUATRE fils menés ensemble, jamais à la file

C'est sa demande fondatrice — *« embarquer plusieurs sujets à la fois plutôt que tout faire à la
file et tout devoir défaire à chaque fois »* — et elle est techniquement la bonne.

| Fil | Ce qu'il produit | Pourquoi il ne peut pas attendre |
|---|---|---|
| **A — LA CARTE** | l'axe `couche` dérivé, les 87 fichiers placés, les capacités nommées | tout le reste en dépend, et rien d'autre n'en dépend |
| **B — LE FREIN** | arrêter l'ajout : aucun outil neuf sans place architecturale déclarée | chaque jour sans lui agrandit ce qu'il faudra ranger |
| **C — LA DETTE** | le coût d'entrée d'un outil (10 registres) ramené à un, par dérivation | c'est la cause du paradoxe, pas son symptôme |
| **D — LA PAROLE** | ses 49 réponses, le PACK DÉCOUVERTE, les stratégies — **dérivés de A** | il en a besoin pour décider la suite, et A les rend peu coûteux |

**Ce qui vient APRÈS, et seulement après** : les contrats (Model Gateway, Repository, Tool,
Finding), puis les premières extractions (`daynight`, `gemini-keys`, `relationship`), puis
`check-house`, puis `/api/lia` en dernier — ce dernier sous la protection de l'Article 0.

### Trois règles que je poserais pour tout le chantier

1. **Aucune étape sans destination écrite.** Pas « ranger les outils » mais « qu'un outil neuf
   coûte UN registre au lieu de dix ».
2. **Aucun changement sans retour arrière.** C'est le Transaction Engine, et c'est le seul vrai trou
   de l'architecture. Il vient en premier des composants, pas en dernier.
3. **Le site reste le juge.** Une rationalisation qui n'a pas fait tourner une simulation n'a rien
   prouvé. C'est déjà écrit dans la charte ; ce chantier est le moment où ça compte le plus.

### Ce que je ne recommande PAS, et pourquoi

- **Pas de nouvelle taxonomie** à côté de nos neuf axes : un dixième axe, dérivé.
- **Pas de déplacement de fichiers** dans une arborescence `agency/core/...` avant que la carte
  existe. Déplacer 87 fichiers ne crée aucune frontière ; ça casse 10 registres.
- **Pas d'étiquetage manuel rétroactif.** Dérivé ou rien.
- **Pas de MCP, d'event bus ni de monorepo** à ce stade : les trois lots les plus sérieux le
  déconseillent explicitement, et je suis d'accord — ce sont des réponses à des problèmes que nous
  n'avons pas encore.
- **Pas de suppression d'outil** avant que la carte dise quelle capacité il portait. La question
  R6 (« qu'est-ce qui doit disparaître ? ») est légitime, mais elle vient après la carte, jamais
  avant.

---

## 7. Le point de non-retour — sa décision, et ce qu'elle change

Il l'a tranché pendant que j'écrivais : *« je veux bien une sauvegarde de référence, mais juste
après que tu aies finalisé ton plan d'action, avant de commencer quoi que ce soit concrètement : je
garde la trace de où on en est + où on se dirige. »*

**Ce n'est pas un détail de calendrier.** La sauvegarde ne marque plus un ÉTAT, elle marque
**un état ET une intention**. Le plan d'action doit donc être DEDANS — sinon la trace dit d'où on
part sans dire où on va, et c'est la moitié qu'il réclame.

Ordre verrouillé : **plan d'action finalisé → sauvegarde de référence → première action concrète.**

---

## 8. Ce qui manque encore, et que personne n'a produit

Le dernier lot annonce lui-même le document suivant et ne le fournit pas : le **BUILD MAP** —
composant par composant, son origine historique, son nouveau nom, sa responsabilité, son contrat,
ses dépendances entrantes et sortantes, son niveau de maturité, son ordre de migration, ses tests et
ses critères de sortie.

**C'est le seul document qui permettrait de commencer sans avancer à l'aveugle, et il n'existe
pas.** C'est donc le premier livrable du fil A.

---

## 9. Où on en est

- **Absorption** : terminée, 20/20.
- **Questions** : rassemblées, 49, aucune répondue — c'est la prochaine grosse livraison.
- **Analyse** : ce document.
- **Plan d'action détaillé** : à écrire, et c'est l'étape suivante.
- **Sauvegarde de référence** : après le plan, avant toute action. Sa décision.
