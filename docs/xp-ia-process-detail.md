# Process XP-IA-bonnes-pratiques-et-lecons — le dossier de process

*(Nom donné par l'utilisateur le 2026-09-23. Sixième process déclaré du projet, aux côtés de la
Ronde, de la simulation, de la nuit autonome, du méta-process et de l'intégration d'un outil.)*

**RÈGLE D'ÉCRITURE DE CE DOCUMENT, en tête parce qu'elle a déjà été oubliée ailleurs** : tout
mécanisme construit en lien avec ce process s'inscrit ICI, pas seulement dans `docs/suivi/`. Le
SUIVI date ce qui a été FAIT ; le PROCESS dit ce qui EST. Un mécanisme consigné seulement dans le
suivi est une trace historique, pas une règle en vigueur — et personne ne relit trois cents lignes
de suivi avant de toucher à un process.

---

## Partie 1 — Ce que ce process existe pour empêcher

Un projet piloté par IA paie deux fois la même erreur, et la seconde fois coûte plus cher que la
première : non seulement le dégât se reproduit, mais la confiance dans le dispositif qui devait
l'empêcher s'érode.

**Le problème précis, tel qu'il a été constaté le 2026-09-23** : les leçons de ce projet vivaient
dans des commentaires de code, **chacune locale à l'outil qui l'avait apprise**. Une leçon payée sur
un détecteur de duplication ne pouvait pas servir le jour où le même piège se présentait dans un
tout autre coin. Et surtout : **un agent ne garde rien d'une session à l'autre.** Un outil conserve
son registre ; moi non. Ce qui n'est pas écrit ET rendu atteignable n'existera plus demain.

**La formulation de l'utilisateur, qui pose l'objectif** : « 1/ tu découvres une leçon dans la
conversation 2/ tu l'enregistres 3/ tu l'analyses lors de circle 4/ elle ressort au moment opportun,
comme un réflexe mécanique : pendant cette chaîne, la valeur de la leçon est sécurisée. »

Et l'objectif principal, posé séparément et qui prime sur le reste : **« que tu mettes en pratique
ces leçons et bonnes pratiques, en plus de t'auto-analyser et t'auto-calibrer pour ce projet ».**
Enregistrer n'est que le moyen. **Un registre qui n'a jamais changé une décision a échoué**, même
parfaitement tenu.

---

## Partie 2 — La chaîne, et pourquoi aucun maillon ne peut manquer

```
SCAN  >>  RAPPORTS  >>  ANALYSE  >>  PLAN D'ACTION  >>  QUESTIONS  >>  TÂCHES DE TRAVAIL
```
*(le schéma unifié du projet, décliné ici — jamais un schéma parallèle inventé pour ce process)*

Décliné sur l'expérience, il donne cinq maillons :

| # | Maillon | Qui le porte | Ce qu'on perd sans lui |
|---|---|---|---|
| 1 | **Découvrir** — la question est posée aux moments déclencheurs | `scripts/angel-of-ia-process.mjs` (règle `xp-lecons`) | la découverte ne repose que sur ma mémoire, donc elle meurt avec la session |
| 2 | **Enregistrer** — la trouvaille est écrite où on la retrouvera | `enregistrerXp()` (TOOL-LEARNING) → `docs/tool-learning/xp-journal.json` | la trouvaille reste dans la conversation et disparaît avec elle |
| 3 | **Analyser à la Ronde** — la période est relue, j'en tire une conclusion sur MA façon de travailler | poste `tool-learning` de la Ronde | le registre grossit sans que personne ne regarde ce qu'il dit de moi |
| 4a | **Ressortir AVANT la tâche** | `tool-brain` (`leconsPourTache()`) | la leçon reste archivée : relue une fois par période, elle ne change rien au travail du lendemain |
| 4b | **Ressortir AU COMMIT** | crochet `post-commit` | ce qui a échappé au rappel d'avant la tâche n'est jamais rattrapé |

**Le garde-fou de la chaîne elle-même** : `auditChaineXp()` vérifie à chaque passage que chacun des
cinq maillons est **réellement branché dans le vrai dépôt**, jamais qu'il est déclaré quelque part.
Répondre « oui tout est connecté » en prose aurait été une intention, et une intention n'a jamais
empêché quoi que ce soit (leçon L7). Un maillon cassé produit un constat, et donc une tâche.

---

## Partie 3 — Les trois moments déclencheurs, et celui qui a été écarté

**Retenus** (choix explicite de l'utilisateur) :

1. **Un garde-fou me bloque** — un contrôle refuse un commit, ou un test échoue pour une raison que
   je n'avais pas vue. **De loin le plus riche** : la moitié des leçons existantes y sont nées.
   Mécaniquement détectable, donc le rappel peut être automatique.
2. **La fin de chaque compte rendu de travail** — avant de conclure un travail rendu.
   Non détectable : c'est angel qui demande.
3. **Chaque Ronde et chaque évaluation** — ces moments font déjà le bilan d'une période entière,
   donc on y voit ce qu'on ne voit pas tâche par tâche.

**ÉCARTÉ, et c'est écrit plutôt que tu** : « quand je refais une erreur déjà faite » a été proposé
et **non retenu**. C'était le signal le plus fort du lot — mais aussi le seul qu'aucune mécanique ne
sait détecter, donc celui dont la protection aurait été la plus faible. Déclaré dans
`DECLENCHEUR_ECARTE` pour qu'une reprise sache que c'est une décision, jamais un oubli.

**« Rien à retenir » est une réponse pleine et entière**, et ce n'est pas une politesse : exiger une
trouvaille à chaque passage ferait écrire pour se taire, remplirait le registre de bruit et le
rendrait illisible — donc détruirait ce qu'on essaie de construire. Le journal la compte comme une
réponse. En revanche, cinq passages d'affilée sans une seule trouvaille déclenchent un constat :
soit rien n'arrive, soit je ne regarde plus, et les deux méritent d'être regardés.

---

## Partie 4 — Ce qui entre dans le registre, et ce qui n'y entre pas

`docs/referentiel/lecons.md`, **deux sections, jamais une seule liste** :

- **LEÇONS (L1, L2…)** — payées par une erreur réelle. C'est ce qui les rend crédibles.
- **BONNES PRATIQUES (BP1, BP2…)** — des réflexes qui marchent, sans casse derrière.

**Critère commun, volontairement exigeant** : l'entrée doit valoir **au-delà du cas qui l'a
révélée**. Une observation ponctuelle va dans le suivi ; une règle qui ordonne va dans la charte.

**Deux champs obligatoires par entrée**, et ils ne sont pas décoratifs :

- **Terrain** — les situations où elle mord, avec les mots qui les signalent (`· mots : …`). C'est
  ce champ, et lui seul, qui permet à l'entrée de ressortir au bon moment. Une entrée sans terrain
  est archivée, jamais appliquée — l'audit la signale.
- **Porté par** — le mécanisme réel qui la fait tenir, ou la déclaration écrite qu'aucun n'est
  possible, avec sa raison. Un **porteur fantôme** (nommé, introuvable) est le pire des cas : une
  référence morte ressemble à une garantie, donc elle rassure à tort.

**Le terrain se déclare sur DEUX signaux** *(2026-09-23, amélioration ③)* : les mots (`· mots : …`)
et, facultativement, les fichiers (`· fichiers : …`, un fragment de chemin avec `*` comme seul
joker, qui ne traverse jamais un séparateur de dossier). Les deux comptent à égalité et s'ajoutent,
de sorte que l'entrée désignée par les DEUX signaux remonte en premier. La raison d'être du second :
une même tâche se formule de dix façons, alors qu'un chemin ne ment pas sur ce qu'on touche.

---

## Partie 4bis — Le registre reste efficace : regrouper, fusionner, sortir

*(2026-09-23, tâche #222 — trois améliorations demandées une fois la chaîne en place.)*

**Le problème que ces trois règlent est le même** : un registre qui ne fait que grossir finit par ne
plus être lu, donc par ne plus rien protéger. L'efficacité n'est pas du confort ici, c'est la
condition de survie du dispositif.

| Mécanisme | Ce qu'il repère | Ce qu'il en fait |
|---|---|---|
| `groupesEquivalents()` | deux entrées qui disent la même chose sur le même terrain | **propose** une fusion, avec ses preuves chiffrées |
| `propositionDeFusion()` | ce qui doit survivre à cette fusion | rend l'**union** des terrains, porteurs et formulations, plus le renvoi obligatoire |
| `analyseRemontees()` | une entrée jamais remontée, ou remontée sans jamais être appliquée | la **nomme**, en état « à trancher » |

**« Sans perdre la valeur, toujours » est une contrainte dure**, et elle dicte toute la forme :
l'outil propose sans jamais fusionner lui-même ; la fusion est une union et jamais un arbitrage ;
et **l'identifiant absorbé garde sa section comme renvoi**, parce qu'une citation faite il y a un
mois doit continuer de mener quelque part. Un identifiant supprimé fabriquerait une référence morte,
c'est-à-dire exactement le défaut que ce paysage traque partout ailleurs.

**Le garde-fou contre l'accusation prématurée** : une entrée n'est jamais jugée avant d'avoir eu
assez d'occasions de servir, et ces occasions se comptent **depuis son arrivée à elle**. Accuser à
tort une entrée utile la ferait retirer, et on repaierait l'erreur qui l'avait fait naître.

**La limite honnête** : le compteur mesure les REMONTÉES, jamais l'application réelle. Savoir qu'une
entrée est ressortie douze fois ne dit pas qu'elle a changé une décision — c'est pourquoi le verdict
d'application reste celui de l'utilisateur, et pourquoi « remontée souvent, jamais jugée appliquée »
est formulé comme une question et non comme une condamnation.

---

## Partie 5 — Qui juge, et cette répartition ne bouge pas

| Ce qui est jugé | Qui juge | Pourquoi |
|---|---|---|
| L'entrée est-elle bien formée (terrain, porteur) ? | `auditLecons()` | entièrement mécanique |
| La chaîne est-elle branchée ? | `auditChaineXp()` | entièrement mécanique |
| Qu'est-ce que la période dit de ma façon de travailler ? | **moi**, à la main, à la Ronde | aucune mécanique ne peut la produire, et c'est la seule partie qui sert l'auto-calibrage |
| Une entrée a-t-elle été réellement **APPLIQUÉE** ? | **l'utilisateur**, à la Ronde | décision explicite : « c'est moi à la fin qui te dis si elle est propre ». Me déclarer conforme sur mon propre travail serait le défaut que ce dispositif combat |

`enregistrerXp()` **refuse** une entrée de nature `jugement` qui ne porte pas `parUtilisateur: true`.
Une mécanique ne peut pas prouver qu'un verdict vient de lui ; elle peut refuser de l'inventer.

---

## Partie 6 — Reprise par une autre IA

Tout ce process est atteignable depuis les documents seuls, sans une ligne de conversation :

- **Le registre** : `docs/referentiel/lecons.md`, déclaré dans `CLAUDE.md`.
- **Le code** : `scripts/tool-learning.mjs`, dont chaque fonction porte en commentaire le POURQUOI
  de sa forme, jamais seulement le QUOI.
- **Le journal** : `docs/tool-learning/xp-journal.json`, trois natures jamais mélangées.
- **Le compteur** : `docs/tool-learning/xp-remontees.json`, les occasions et les remontées par
  entrée. Données de mesure, jamais de jugement — le verdict d'application reste humain.
- **Les règles voisines portées par le même contrôleur** (2026-09-23, dette documentaire signalée
  par god-of-all-process et réglée le jour où elle a été nommée) : `angel-of-ia-process` ne porte
  pas que `xp-lecons`. Il porte aussi `resume-contextualise` (les quatre rappels d'ouverture d'un
  compte rendu, Article 29) et, depuis le 2026-09-23, `messages-courts` — ne jamais s'arrêter sur
  un message court, seule une demande explicite interrompt le travail en cours, avec un rappel léger
  dès le 2e message court et une alerte plus forte dès le 5e (seuils demandés par l'utilisateur,
  jamais choisis par l'agent). Les trois partagent exactement le même patron, et c'est ce qui les
  rend cohérentes : la DÉCISION est mécanique et testée ailleurs (`scripts/messages-courts.mjs`
  pour celle-ci), son APPLICATION ne peut être observée par aucun mécanisme — aucun outil ne lit
  une conversation. angel DEMANDE donc, et refuse d'être au vert sans réponse, plutôt que de
  supposer une conformité.
- **Le contrôleur** : `scripts/angel-of-ia-process.mjs`, qui porte la règle `xp-lecons` et refuse
  d'être au vert tant qu'elle n'a pas reçu de réponse. C'est le contrôleur de la CONDUITE, jamais
  d'un déroulé : ce process décrit un comportement à tenir, pas les étapes d'une activité.
- **Ce document**, enregistré chez `god-of-all-process` comme les cinq autres process.
- **Les tests** : `scripts/check-house.mjs`, qui échouent si un maillon se débranche.

**Ce qu'une reprise doit savoir avant de simplifier quoi que ce soit** : la séparation des deux
sections, le refus de compter « rien à retenir » comme un échec, et le refus que l'agent juge sa
propre application sont **trois décisions tranchées avec l'utilisateur**, pas des accidents de
construction. Les défaire ramènerait exactement les défauts qu'elles écartent.

## Partie 7 — Ce que ce process NE fait pas

- **Il ne juge pas la QUALITÉ d'une leçon.** Le critère d'entrée (payée par une erreur réelle ET
  valable au-delà du cas qui l'a révélée) se vérifie à la main ; aucune mécanique ne sait dire si
  une leçon est profonde ou creuse. `auditLecons()` vérifie qu'elle a un porteur et un terrain,
  jamais qu'elle vaut d'être retenue.
- **Il ne garantit pas qu'une leçon soit APPLIQUÉE.** Il la fait ressortir au bon moment ; c'est
  l'utilisateur qui dit, à la Ronde, si elle l'a réellement été (`parUtilisateur: true`). La
  remontée est un rappel, jamais une preuve d'effet.
- **Il ne remplace pas la charte.** La charte ORDONNE, ce registre garde ce qu'on a payé pour
  comprendre. Une leçon qui deviendrait une règle a sa place dans CLAUDE.md, pas ici — et la
  tension se résout toujours dans ce sens, jamais l'inverse.
- **Il ne couvre pas ce que l'agent a appris SUR LE JEU** (le ton, les personnages) : c'est le
  domaine de la charte et d'EL-PROFESSOR. Ce registre ne parle que de la façon de travailler.

## Partie 8 — Le schéma de revue, et la remise à niveau du code (2026-09-23, chantier 7)

*(Demande de l'utilisateur : « est-ce que tout le code bénéficie de la leçon que tu as apprise ? »,
et « le schéma de revue à présenter ».)*

### Le schéma, en une vue

```
       UNE ERREUR RÉELLE
              │
              ▼
   ┌──────────────────────┐
   │ 1. CAPTER            │  aux trois moments déclencheurs (Partie 3)
   │    enregistrerXp()   │  « rien à retenir » est une réponse pleine
   └──────────┬───────────┘
              ▼
   ┌──────────────────────┐
   │ 2. ÉCRIRE            │  docs/referentiel/lecons.md
   │    porteur + terrain │  auditLecons() refuse un porteur fantôme
   └──────────┬───────────┘
              ▼
   ┌──────────────────────┐
   │ 3. RESSORTIR         │  avant la tâche (tool-brain) et au commit
   │    leconsPourTache() │  enregistrerRemontee() compte si ça sert
   └──────────┬───────────┘
              ▼
   ┌──────────────────────────────────────────────┐
   │ 4. REMETTRE LE CODE À NIVEAU                 │
   │    ├─ MÉCANIQUE, continue, gratuite :        │
   │    │  zonesARemettreANiveau() — quels        │
   │    │  fichiers du terrain ont bougé DEPUIS   │
   │    │  la leçon ? Elle POSE la question.      │
   │    └─ PROFONDE, sur demande, payante :       │
   │       un vrai jugement « ce fichier porte-t-il│
   │       le défaut ? ». Jamais automatique.     │
   └──────────┬───────────────────────────────────┘
              ▼
   ┌──────────────────────┐
   │ 5. JUGER             │  à la Ronde, PAR L'UTILISATEUR
   │    parUtilisateur    │  « est-elle réellement APPLIQUÉE ? »
   └──────────────────────┘
```

### Pourquoi l'étape 4 est coupée en deux, et pourquoi cette coupe ne bougera pas

C'est la même frontière qu'ALWAYS-NEW-CODE, pour la même raison. La couche **mécanique** ne peut pas
juger si un fichier porte le défaut : ça demande de lire le sens du code. Elle peut dire quelque
chose de plus modeste et de vérifiable — **ces fichiers-là ont été touchés après que la leçon a été
apprise** — et c'est précisément là que la question se pose vraiment. Elle pose la question ; elle
n'affirme jamais le défaut.

Lister TOUT le terrain d'une leçon plutôt que ce qui a bougé rendrait des dizaines de fichiers à
chaque entrée, dont la plupart dormants depuis des semaines : un relevé qui accuse presque tout a
tort presque toujours (leçon L4), et il cesserait d'être lu.

### La leçon qui s'étoffe garde LES DEUX traces

Une entrée peut gagner un angle sans perdre celui qui l'a fait naître. Le format est fixe et lu
mécaniquement : `**Enrichie le** : <date> — <ce que l'ajout apporte>`, sur une ligne à elle, à côté
de la trace d'origine qui reste **intacte**.

Ce que la mécanique vérifie : que la trace d'origine est toujours là après un enrichissement, et
qu'elle porte une date. Un enrichissement qui aurait remplacé l'original se voit donc tout de suite
— et c'est le seul vrai risque de cette opération.

**La trace d'origine se reconnaît à sa FORME, jamais à son verbe** : le premier paragraphe en
italique de l'entrée qui porte une date. Le premier jet cherchait « Trouvée » ou « Payée » ; une
entrée écrivait « Apprise » et se retrouvait déclarée sans date. Allonger la liste des verbes aurait
rejoué exactement ce que le corollaire de l'Article 17 interdit — un tableau qui ne couvre jamais le
prochain cas.

### Ce que ce chantier a trouvé en tournant pour de vrai

- **Une leçon sur seize n'avait aucune trace d'origine** (L5). Elle a été écrite depuis, à partir
  d'une décision réelle et datée, jamais inventée.
- **`--since=<date>` seul ne veut pas dire « depuis minuit »** : git y ajoute l'heure courante, si
  bien qu'un commit du matin passe pour antérieur à sa propre date. Le relevé rendait 0 fichier sur
  9 leçons — un zéro parfaitement plausible, donc invisible sans vérification (Article 25).

## L'évaluation ne porte plus seulement sur la Ronde (2026-09-24)

**Demande de l'utilisateur, marquée « GROS WARNING »**, avec la précision qui commande tout :
**« c'est une erreur qui se répète »**. EVAL-DEV et EVAL-IA ne doivent pas porter seulement sur ce
qu'une Ronde a couvert.

**Pourquoi elle se répétait, et c'est structurel plutôt qu'accidentel** : l'évaluation n'existait
qu'en tant qu'ITEM de Ronde (`recap-evaluations`), et sa période implicite était « depuis la
dernière Ronde ». Tout ce qui se fait ENTRE deux Rondes — une nuit entière, une vague de correctifs,
une simulation — n'était jugé par personne. Et surtout : **l'absence d'évaluation ne produisait
aucun signal, parce qu'un rapport qu'on ne lance pas ne se plaint jamais.** Rien ne nommait le
manque, donc rien ne l'empêchait de revenir.

**Ce qui la fait cesser** : `findTravailNonEvalue()` (`angel-of-ia-process.mjs`) compare le travail
RÉELLEMENT FAIT — tâches de `docs/suivi/` et commits git — à la dernière évaluation enregistrée. La
période devient « depuis la dernière ÉVALUATION », ce qui est la vraie question. Seuil mécanique de
10 unités : une évaluation à chaque commit ne mesurerait plus rien. Et une règle surveillée de plus,
`eval-hors-ronde`, où angel refuse d'être au vert sans réponse (Article 27).

**Le défaut s'est produit DANS ce mécanisme, à la seconde où il a été branché** — et il mérite
d'être écrit ici parce qu'il est la forme la plus pure du travers que tout ce process combat : deux
imports manquants, deux `catch` qui avalent, deux compteurs restés à zéro, et le rapport a affiché
**« ✅ aucun travail enregistré » la nuit où dix-neuf tâches venaient d'être écrites**. Un faux vert,
dans la fonction construite pour empêcher une erreur de se répéter. `luAvecSucces` distingue
désormais « zéro mesuré » de « pas pu lire ».

**Constat secondaire, ouvert en tâche** : l'évaluation du 2026-09-23 a bien eu lieu — le fichier
existe — et ne s'est jamais inscrite dans `historique-evaluations.json`. L'artefact existe, la
mémoire ne l'a pas. Un historique qui ne se remplit pas transforme une série en photographie.

## 2026-09-25 — Les 28 entrées sont citées, et la plus invoquée est celle que la journée a payée sept fois

**SA QUESTION (#842), tranchée en fenêtre dédiée** : « compter combien de fois chacune est CITÉE
dans le dépôt ». Le registre portait 24 leçons et 4 bonnes pratiques, et rien ne disait lesquelles
avaient servi — un registre dont on ignore ce qui sert grossit jusqu'à ce que plus personne ne le
relise, ce qui est L6 commise par le registre qui la contient.

**LE RÉSULTAT CONTREDIT L'INQUIÉTUDE QUI A CRÉÉ LA TÂCHE** : les **28 entrées sont citées au moins
3 fois** hors du registre. Aucune n'est décorative.

| Citations | Entrée |
|---|---|
| **125** | L4 — Un garde-fou qui accuse à tort cesse d'être lu |
| 89 | L2 — Un mécanisme qui ne sort pas du script est une intention |
| 76 | L5 — Distinguer « je n'ai rien trouvé » de « je n'ai pas pu regarder » |
| 61 | L1 — Une règle écrite que rien ne fait respecter |
| 44 | L7 — Une intention écrite n'a jamais empêché quoi que ce soit |

Les plus basses, vivantes malgré tout : L17 (3), L15 (6), L19/L18/L10 (7).

**CE QUE LE CLASSEMENT DIT DE PLUS QUE LE COMPTE** : L4 est la plus invoquée du projet, et c'est
exactement la leçon que le 2026-09-25 a payée **sept fois** en une journée. Ce n'est pas une
coïncidence — c'est le défaut central de ce type d'outillage, et sa fréquence de citation le
mesurait déjà avant qu'on s'en aperçoive.

**DEUX PRÉCAUTIONS SANS LESQUELLES LE COMPTE SERAIT FAUX**, chacune testée :
- **le registre lui-même est exclu** — chaque leçon y figure dans son propre titre, l'inclure aurait
  rendu « toutes citées au moins une fois », c'est-à-dire un vert obtenu sur rien ;
- **frontière de mot obligatoire** — sans `\b`, « L1 » attrape L10 à L19 et la plus ancienne paraît
  dix fois plus citée qu'elle ne l'est.

**LIMITE DÉCLARÉE** : « citée » n'est pas « appliquée ». On peut citer sans suivre, et suivre sans
citer. C'est un signal à relire, jamais un verdict — et la charte réserve déjà ce jugement-là à
l'utilisateur, à la Ronde.

**PORTÉ PAR** : `compterCitationsDesLecons()` / `formatCitationsDesLecons()` (`scripts/tool-learning.mjs`),
câblé dans son `main()` — un détecteur sans appelant aurait été le défaut que ce paysage traque,
commis dans l'outil même qui mesure l'apprentissage.

### L4 enrichie le même jour — la forme du faux positif qui S'AGGRAVE quand le projet s'améliore

Enrichie plutôt que dédoublée (une L25 pour une variante de la même loi aurait éparpillé ce qui se
lit mieux ensemble). Ce que la variante ajoute : il ne s'agit plus d'accuser à tort, mais de
**punir exactement la conduite que le garde-fou existe pour obtenir** — un outil qui avoue une
absence de mesure, un outil qui prend sa formulation au mécanisme partagé au lieu de la recopier,
un rapport dense plutôt que verbeux, une ligne de suivi au format le plus récent.

**Pourquoi cette forme est pire** : le bruit ordinaire DIMINUE quand le dépôt s'assainit ;
celui-ci AUGMENTE. Plus le projet applique ses propres règles, plus le garde-fou crie. Un
dispositif qui hurle précisément quand on lui obéit finit par enseigner qu'il vaut mieux désobéir.

**Le réflexe qui a attrapé les sept, écrit noir sur blanc dans la leçon** : ouvrir le fichier
accusé AVANT de le corriger.

## 2026-09-25 — Le maillon 3 (« analyser à la Ronde ») n'avait jamais été joué (tâches #573 et #576)

**LA CHAÎNE EST BRANCHÉE, ET ELLE LE RESTE** : `auditChaineXp()` rend toujours **5/5 maillons**,
vérifié dans le vrai dépôt. Ce qui suit ne remet pas ça en cause — il dit autre chose, et de plus
gênant : **un maillon branché n'est pas un maillon joué.**

**CE QUI A ÉTÉ MESURÉ** : `docs/tool-learning/verdicts.json` contient `[]`, alors que le dossier
porte **cinq signaux de Ronde**. Or l'étape 3 de la chaîne — l'analyse à la Ronde — se joue par le
geste que l'item de Ronde `tool-learning` réclame nommément dans son propre `execute` : « juger
chaque outil concerné (`jugerUnOutil`) ». Ce geste n'a **jamais** eu lieu, cinq passages de suite.

**POURQUOI PERSONNE NE POUVAIT LE VOIR, et c'est ça qui compte pour ce process** : le rapport en
tirait « PAS ENCORE MESURABLE — registre de verdicts vide ». C'est honnête, c'est même la règle
maison (jamais un vert sur rien) — et c'est exactement ce qui le rendait invisible. **Derrière un
registre vide il y a deux causes indiscernables** : un outil neuf qui n'a pas encore tourné, et un
outil qui tourne depuis cinq Rondes sans que son étape manuelle soit faite. L'aveu d'absence de
mesure faisait passer la seconde pour la première.

**CE QUE ÇA APPREND SUR LA CHAÎNE ELLE-MÊME** — et c'est la vraie leçon de process, pas un détail
d'implémentation : `auditChaineXp()` vérifie que chaque maillon est **CÂBLÉ**, jamais qu'il a été
**JOUÉ**. Les deux questions sont différentes, et la première ne dit rien de la seconde. Un maillon
qui dépend d'un geste humain — ici le jugement par outil, comme ailleurs la conclusion de période
et le jugement de l'utilisateur — peut rester branché et inerte indéfiniment sans qu'aucun contrôle
ne s'en aperçoive.

**LE PORTEUR AJOUTÉ** : `etapeManuelleJamaisFaite()` (`scripts/tool-learning.mjs`), trois états
jamais deux — *sautée* (des passages, zéro verdict) · *rien à reprocher* (ni l'un ni l'autre) ·
*pas mesuré* (registre illisible, ce qui n'est jamais zéro passage). Il sort **avant** la ligne de
gravité et entre **en tête du plan d'action**.

**CE QU'IL NE FAIT PAS** : produire le verdict à la place de l'agent. Les deux jugements que ce
process réserve explicitement à l'humain (la conclusion de période, et l'utilisateur qui dit si une
entrée a été APPLIQUÉE) restent hors de toute mécanique — ce mécanisme-ci ne fait que **refuser
qu'on les oublie en silence**.

## 2026-09-25 — Treize leçons du mauvais côté du trait, et le garde-fou qui l'empêche de revenir (tâche #889)

**Le geste qui l'a trouvé est celui que ce projet répète depuis le matin** : ouvrir le fichier
avant d'y écrire. En allant porter au registre la leçon de #888 (mesurer la couverture n'est pas
vérifier la justesse), la lecture du document a montré autre chose — **L12 à L24, treize leçons
payées par une erreur réelle, se trouvaient physiquement APRÈS le titre `# Bonnes pratiques`**.

**Pourquoi c'est un vrai défaut et pas une coquette de mise en page.** Le registre s'ouvre sur
« DEUX SECTIONS, JAMAIS UNE SEULE LISTE », et la raison y est écrite : une leçon a été payée par une
casse, une bonne pratique non, et c'est la seule chose qui les distingue. Une leçon rangée parmi les
pratiques se lit comme un conseil — elle perd exactement ce qui la rend crédible.

**Pourquoi aucun outil ne pouvait le voir, et c'est le point le plus instructif.** `natureDe()` lit
le PRÉFIXE de l'identifiant (`L…` ou `BP…`), jamais la section où l'entrée se trouve. Tous les
comptes du process — 24 leçons, 4 bonnes pratiques, les citations, les remontées — étaient donc
parfaitement justes. **Seul le lecteur humain était trompé, et les deux sections n'existent que
pour lui.** Un défaut qu'aucune mesure existante ne peut atteindre est précisément celui qui dure :
celui-ci datait du 2026-09-23, jour où le trait a été tracé.

**La cause, et elle est banale** : chaque nouvelle leçon était ajoutée à la fin du fichier. C'était
le bon geste tant que la fin du fichier était encore la fin des leçons. Le jour où une section a été
ouverte en dessous, le même geste est devenu faux sans que rien ne change d'apparence.

**Ce qui le porte désormais** : `entreesMalRangees()` (`scripts/tool-learning.mjs`) compare la
POSITION de chaque titre d'entrée à celle du trait, et rien d'autre. Il est versé au plan d'action
d'`auditLecons()`, il est **muet quand tout est rangé** (une ligne « 0 écart » à chaque passage
serait l'alarme permanente de L6), il rend **« hors de portée »** plutôt qu'un vert quand le
document ne porte pas deux sections, et il est éprouvé **dans les deux sens** — une leçon sous les
pratiques, une pratique au-dessus du trait (BP4 : un détecteur vu mordre dans un seul sens ne prouve
rien). Sans lui, la leçon L25 écrite le même jour serait tombée du mauvais côté au prochain ajout.

## Le diagnostic des leçons muettes (2026-09-26, tâche #928)

**Le maillon qu'il consolide** : « ressortir avant la tâche ». Une leçon qui ne ressort JAMAIS ne
sert à rien — mais le chiffre seul pousse au mauvais geste, retirer l'entrée, et retirer une entrée
est irréversible en pratique : personne ne se souviendra de la remettre.

`diagnostiquerLeconsMuettes()` sépare les deux causes MÉCANIQUES contre le vocabulaire réel des
tâches du projet : **vocabulaire-absent** (le terrain est écrit dans des mots que ce projet n'emploie
pas — c'est l'ADRESSE qui est injoignable, jamais la leçon qui est morte) et **adresse-atteignable**
(ses mots ressortent, la cause du silence est ailleurs). **Aucun verdict ne dit « à retirer »** :
juger qu'une leçon a cessé de servir demande de la relire, et c'est un jugement humain.

**Premier passage réel : zéro des onze leçons muettes était du poids mort.** Trois avaient un
terrain injoignable, corrigé le jour même.

**Le garde-fou du terrain coupé** (`findTerrainsCoupes()`) est né du même passage : un champ
`**Terrain**` écrit sur deux lignes n'est lu qu'à moitié, et l'ancien contrôle n'attrapait ce cas que
lorsque la première ligne ne rendait AUCUN mot. Sept entrées étaient coupées, six y perdaient
entièrement leur terrain par FICHIER — la moitié du sélecteur ne fonctionnait pas pour elles. Une
absence déclarée (`· aucun fichier : <raison>`) reste valable : c'est une décision écrite, pas un
oubli.
