# LES DEUX AGENTS QU'IL A DEMANDÉS — la conception, et pourquoi je ne les construis pas cette nuit

*(Nuit du 2026-09-29 au 30, heure LUE, source système. Tâche **#1260**.
Sa demande : deux nouveaux agents, un pour l'**expérience client** et un pour l'**expérience IA**
— « ou un pour les deux ? », sa question, restée ouverte.)*

> **DÉCOULE DE :** `docs/grand-projet/03-plan-daction/ou-va-chaque-chose.md`
> *il répond à une demande de son fichier de réponses ; il ne propose aucune étape nouvelle.*

---

## D'ABORD, LA TENSION QUE JE DOIS DÉCLARER *(Article 14)*

**Tu m'as demandé deux agents de plus. Mesuré la même nuit, mon propre travail dit que c'est
exactement ce qu'il ne faut pas faire tout de suite.** Trois sources indépendantes, et je ne les
ai pas cherchées pour te contredire :

1. **JESUS**, ce soir : *« 10 registres à renseigner pour chaque outil qui arrive. Pris un par un
   ils sont tous justifiés ; c'est leur SOMME que personne ne discute — et elle se paie à chaque
   nouvel outil, pour toujours. »*
2. **L'AUDIT EXÉCUTIF** de tes propres documents : *« le plus grand danger n'est pas de manquer de
   fonctionnalités. C'est de continuer à en ajouter AVANT que les nouvelles fonctionnalités aient
   une place architecturale explicite. »*
3. **La TARGET ARCHITECTURE** : *« un guardian ne doit pas devenir un orchestrateur caché »* —
   déjà arrivé chez nous, `check-house` pèse 4,3 fois le jeu entier.

**Ce que je fais donc, et c'est un choix, pas une dérobade** : je conçois les deux agents en
entier — ce qu'ils mesurent, ce qui existe déjà, ce qu'ils coûtent — **sans écrire une ligne de
code**. Tu as ainsi de quoi décider, et rien n'est à défaire si tu dis non.

**Je ne refuse pas ta demande. Je la prépare, et je te donne l'argument contre en même temps que
la conception.** C'est ce que tu m'as demandé de faire de tes idées : *« jamais pour me plaire,
toujours pour l'intérêt du projet ».*

---

## CE QUI EXISTE DÉJÀ, VÉRIFIÉ AVANT DE CONCEVOIR *(Article 31)*

**tool-brain, consulté** : *« Aucune correspondance dans le catalogue PRESTATIONS »* pour
« mesurer l'expérience du client qui reçoit l'Agence, et l'expérience de l'IA qui travaille avec
elle ». **Le trou est donc réel** — et cette fois le zéro est fiable, puisque j'ai corrigé cette
même nuit le défaut qui lui faisait rendre des zéros à tort.

**Mais deux outils en touchent les bords, et c'est important pour la suite :**

| Outil | Ce qu'il couvre déjà | Ce qu'il ne couvre pas |
|---|---|---|
| **angel-of-ia-process** | le respect des règles de travail, **par les deux côtés** — il évalue déjà sa participation à lui | il juge la CONFORMITÉ, jamais le VÉCU |
| **SAFE-EXPORT** | l'Agence est-elle transportable | il compte des pièces, il ne demande jamais si l'arrivée s'est bien passée |

**La frontière est donc nette** : les outils actuels mesurent si les RÈGLES sont tenues. Aucun ne
mesure si **l'expérience est bonne**. Ce sont deux questions différentes, et la loi de l'Agence
dit laquelle prime : *son expérience à lui passe toujours en premier.*

---

## SA QUESTION — UN AGENT OU DEUX ? MA RÉPONSE EST : DEUX, ET VOICI POURQUOI

**L'argument pour UN seul est réel** : c'est la même méthode (recueillir un vécu, le confronter
aux faits), et un agent de moins, c'est dix registres de moins.

**L'argument pour DEUX est plus fort, et il tient à une asymétrie qu'on ne peut pas contourner :**

|  | EXPÉRIENCE CLIENT | EXPÉRIENCE IA |
|---|---|---|
| **Le sujet existe-t-il ?** | **NON** — l'Agence n'a **jamais** été installée ailleurs, il n'y a pas un seul client | **OUI** — je travaille dedans à chaque tour |
| **La donnée** | il faudrait la **créer** (une installation, un test) | elle est **déjà là** : 848 passages d'outils, 273 relances, 483 lignes non lues |
| **Mesurable aujourd'hui ?** | **non, et c'est le constat** | **oui, tout de suite** |
| **Ce qu'il dirait dès demain** | rien | beaucoup — la nuit vient d'en produire la moitié |

**Les fondre donnerait un agent dont une moitié rend « PAS MESURÉ » à chaque passage.** Et un
rapport dont une moitié est toujours vide cesse d'être lu (leçon L6) — pendant que l'autre moitié,
elle, aurait des choses à dire. **C'est la fusion qui abîmerait le plus utile des deux.**

---

## AGENT 1 — EXPÉRIENCE IA *(celui qui peut exister demain)*

**La question à laquelle il répond, et personne ne la pose** : *travailler dans cette Agence,
est-ce que c'est agréable, fluide, décourageant ?* Pas « les règles sont-elles tenues » — ça,
angel le fait — mais **ce que ça coûte à celui qui les tient**.

**Ce qu'il mesure, et tout existe déjà dans les registres** :

| Sonde | Ce qu'elle dit | Mesuré cette nuit |
|---|---|---|
| **le bruit non lu** | lignes écrites à chaque commit que personne ne lit | **483 lignes, 34 sections** |
| **la relance** | même outil relancé sans commit entre les deux | **273 fois, 32 %** |
| **le coût d'entrée** | registres à renseigner pour un outil de plus | **10** |
| **le faux reproche** | garde-fous qui accusent le geste normal | **3 cette nuit, même outil** |
| **la porte qui ne s'ouvre pas** | tool-brain rend zéro sur une vraie demande | **69/74 avant correction** |

**Sa sortie n'est PAS une note.** C'est une phrase par sonde, et un classement : *qu'est-ce qui,
cette semaine, m'a le plus coûté pour le moins rapporté ?*

**Son coût** : 0 appel API — il lit des registres déjà écrits, comme JESUS.
**Son risque, et il faut le nommer** : c'est un agent qui parle de MOI. Il peut devenir un
prétexte à plaintes. **Le garde-fou : chaque sonde doit rendre un CHIFFRE du dépôt**, jamais une
impression. Sans chiffre, elle ne compte pas.

---

## AGENT 2 — EXPÉRIENCE CLIENT *(celui qui ne peut pas encore exister, et c'est son message)*

**La question** : *recevoir cette Agence, est-ce que ça se passe bien ?*

**Il n'y a rien à mesurer, et c'est exactement le constat que la plaquette a produit ce soir** :
l'Agence n'a **jamais** été installée ailleurs. Pas une fois. Un agent construit aujourd'hui
rendrait « PAS MESURÉ » à chaque passage — et un outil qui n'a jamais rien trouvé n'est pas un
outil, c'est une intention (leçon L2).

**Ce qu'il faut AVANT lui, et c'est la seule chose qui compte ici** : une installation réelle
ailleurs. Une seule suffit à le rendre mesurable.

**Ce qu'il mesurerait, le jour où cette donnée existe** : le temps jusqu'au premier résultat utile ·
le nombre d'obligations découvertes après coup · ce qu'il a fallu demander à un humain · ce qui a
échoué au premier lancement · ce que le client a désinstallé en premier.

**Mon avis, net** : **ne pas le construire. Le DÉCLARER** — écrire qu'il manque, pourquoi il ne
peut pas exister, et à quelle condition il naîtra. C'est ce que la charte appelle déclarer une
impossibilité plutôt que la taire (Article 27), et ça vaut mieux qu'un outil vide qu'on regardera
six fois avant de cesser de le lancer.

---

## RÉCAPITULATIF — trois réponses possibles, et ce que chacune engage

| Tu réponds | Ce qui se passe | Coût |
|---|---|---|
| **A — les deux, maintenant** | deux agents, vingt registres, dont un qui rend « PAS MESURÉ » à chaque passage | le plus cher, et le moins utile des deux est celui qui coûte le plus |
| **B — l'IA maintenant, le client déclaré** *(mon avis)* | un agent qui a de la matière dès demain ; le second devient une **condition d'installation**, écrite, pas un fichier vide | dix registres, et une déclaration |
| **C — aucun des deux pour l'instant** | la conception reste écrite et ne se perd pas ; on y revient après la séance sur l'objectif ultime | zéro, et c'est cohérent avec les trois sources citées en tête |

**Entre B et C, je penche pour B** — parce que l'expérience IA est **déjà mesurée, en désordre,
par quatre outils qui ne se parlent pas, et que la rassembler ne crée pas une charge, elle en
révèle une.** Mais C est défendable, et si tu réponds C je n'y reviendrai pas.

---

## PLAN D'ACTION *(Article 28)*

| Constat | État | Ce qu'il devient |
|---|---|---|
| La conception des deux agents, avec l'argument contre | **RETENU** | tâche **#1260** — ce document |
| Un agent ou deux ? La mesure dit **deux**, pour une asymétrie de données | **RETENU** | tâche **#1260** — sa question a une réponse mesurée, pas une préférence |
| Construire ou non, et lequel | **À TRANCHER** | trois options chiffrées ci-dessus, mon avis est B |
| L'expérience client est non mesurable tant qu'aucune installation n'a eu lieu | **RETENU** | rejoint `plaquette-de-l-agence.md`, tâche **#1255** — troisième chemin indépendant vers le même premier maillon |
| Construire les deux cette nuit | **ÉCARTÉ, avec sa raison** | trois sources indépendantes mesurées le même soir disent que l'ajout est le danger actuel. Concevoir sans coder respecte sa demande sans payer ce prix, et rien n'est à défaire s'il dit non |
