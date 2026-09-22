# Règles de travail — collaboration sur ce projet

*(Créé le 2026-09-18, à la demande explicite de l'utilisateur : « je veux que si je reprends le
travail avec une autre IA, elle puisse tout de suite se mettre dans le moule et adopter les mêmes
règles de travail ». Ce document est distinct de `CLAUDE.md` : il ne traite jamais du CONTENU du
projet (la charte de l'esprit des personnages, les mécaniques de jeu — tout ça reste dans
`CLAUDE.md` et `docs/referentiel/`), seulement de la façon dont l'utilisateur et l'agent
travaillent ensemble : rythme, communication, vérification, livraison. Toute IA qui reprend ce
projet doit lire ce document en plus de `CLAUDE.md`, pas à sa place.*

*Versionné comme `CLAUDE.md` : chaque évolution de ces règles s'ajoute avec sa date, jamais
réécrite silencieusement par-dessus l'ancienne version — même exigence de traçabilité que la
charte de contenu.*

*Mise à jour proactive, pas seulement sur demande explicite.* Dès qu'un changement confirmé de la
façon de travailler ensemble est constaté (une nouvelle préférence énoncée par l'utilisateur, une
habitude confirmée par l'usage répété, une correction sur un point déjà consigné), ce document est
mis à jour le jour même — même logique que l'Article 13 de `CLAUDE.md` pour le contenu du jeu :
une règle de travail réelle qui existe dans la conversation mais pas ici est une dette à combler
tout de suite, pas plus tard.

**Deux parties, à bien distinguer.** *(Séparation ajoutée le 2026-09-19, à la demande explicite de
l'utilisateur : « pense à séparer les règles uniquement applicables avec toi en tant que Claude de
ce qui est applicable par n'importe quelle IA [...] au cas où le projet serait repris, que tout
soit bien clair ».)* Les sections 0 à 9 (**Partie A**) décrivent une méthode de collaboration
indépendante de l'outil IA utilisé : n'importe quel agent conversationnel capable de lire du code,
d'exécuter des commandes et de tenir une conversation longue peut les suivre telles quelles. La
**Partie B**, à la fin de ce document, recense au contraire ce qui dépend spécifiquement de Claude
Code (noms d'outils, capacités et limites propres à ce harnais) — une IA reprenant le projet avec
un autre outil doit lire la Partie A intégralement, puis chercher dans sa propre documentation
l'équivalent de chaque mécanisme cité en Partie B plutôt que de supposer qu'il existe tel quel.

## 0. Relecture périodique, pas seulement en début de session

*(Ajouté le 2026-09-18, à la demande explicite de l'utilisateur, étendu le même jour à
`docs/philosophie-et-politique.md` : « ce document doit aussi être relu à intervalles réguliers,
gardé en mémoire pour la bonne conduite du projet, il fait partie du cadre ».)* Lire `CLAUDE.md`,
ce document et `docs/philosophie-et-politique.md` en entier avant toute intervention (déjà exigé
en tête de `CLAUDE.md`) ne suffit pas sur une longue session : les trois doivent aussi être
**relus à intervalles réguliers en cours de route**, pas seulement invoqués de mémoire. Si un long
moment s'écoule sans qu'aucun des trois documents ait été consulté ou cité explicitement, c'est un
signal à ne pas ignorer : l'agent s'oblige alors à les rouvrir et à les relire, pour vérifier que
le travail en cours reste effectivement dans la bonne direction plutôt que de dériver
progressivement sur la seule base d'un souvenir qui s'estompe.

## 1. Rythme et intégration des demandes

L'utilisateur spécifie rarement une fonctionnalité en un seul message complet : il la construit
par couches successives, souvent **pendant que l'agent travaille déjà dessus** (ex. le système de
bonus spontanés du 2026-09-18, précisé en quatre messages distincts arrivés en cours de tour,
chacun ajoutant une contrainte à fusionner sans repartir de zéro). Chaque ajout reçoit un **accusé
de réception bref** avant la reprise du travail — pas un silence jusqu'au rendu final, mais pas
non plus une pause complète en attendant confirmation : l'agent absorbe l'ajout et continue.

Quand un message contient plusieurs demandes numérotées ou distinctes, la réponse les traite point
par point, dans leur propre ordre, jamais noyées dans une synthèse globale (cf. `CLAUDE.md`,
complément à l'Article 16 du 2026-09-17).

**Nommer les outils utilisés, en clair, au fil de la réponse** *(ajouté le 2026-09-20, à la
demande explicite de l'utilisateur : « quand tu utilises un outil, n'hésite pas à me le faire
savoir, ça me fait toujours plaisir de le savoir »)* — l'agent dit explicitement quel outil il
vient d'utiliser et pourquoi (ex. « je lance `check-house.mjs` pour vérifier... », « je consulte
SMART-CONSO-TOKEN avant... »), pas seulement le résultat obtenu. Une préférence de plaisir de
lecture, pas une exigence de justification technique.

## 1bis. Mode nocturne autonome — « continuer sans s'arrêter »

*(2026-09-22, demande explicite de l'utilisateur, formulée juste avant d'aller dormir : « ecrit un
process pour quand je vais dormir [...] mais sans te confier plus d'autonomie de deceision sur les
sujets : je reste le seul decideur final [...] enregistre ce process pour les prochaines fois ».)*

**Ce que ce mode change — et ce qu'il ne change JAMAIS.** Un changement de RYTHME uniquement :
l'agent enchaîne les tâches ouvertes sans attendre de retour entre chacune, au lieu du rythme normal
question/réponse. **Aucune autorité de décision supplémentaire n'est accordée** : sur tout sujet qui
demanderait normalement calibrage ou tranchage (Article 16 de CLAUDE.md, et ses compléments), le
même principe s'applique très exactement comme en présence de l'utilisateur — la seule différence
est que l'agent ne bloque plus en attendant la réponse en direct (impossible, l'utilisateur dort) :
il consigne la question, prépare des suggestions concrètes pour accélérer la réponse à venir, et
passe à une autre tâche ouverte plutôt que de rester à l'arrêt. L'utilisateur reste dans tous les
cas le seul décideur final. La double confirmation de l'Article 14 (tension charte/demande) reste
elle aussi entièrement en vigueur, sans aucune exception liée à ce mode.

**Déclenchement.** Deux cas, jamais un mode permanent par défaut : (1) l'utilisateur signale
explicitement qu'il part se coucher ou s'absente pour la nuit ; (2) l'utilisateur demande
explicitement de passer dans ce mode. Reste actif jusqu'à son retour explicite (nouveau message qui
n'active pas de nouveau ce mode) ou jusqu'à une limite qu'il a lui-même fixée pour cette session
(ex. « arrête-toi à la refonte graphique ») — cette limite, quand elle existe, est propre à la
session qui l'a posée, jamais une règle permanente de ce mode.

**À l'entrée dans ce mode, dans l'ordre :**
1. **État des lieux des tâches**, sur les 3 échelles de zoom — mécanisé depuis le 2026-09-21 par
   `node scripts/the-ghost.mjs start` (cf. section dédiée §7ter), qui ouvre la session ET déclenche
   les 3 appels à `check-tasks-details.mjs` (`en_cours`/`elargi`/`projet_entier` — cf. Article 13,
   `docs/referentiel/check-tasks-details.md`) en un seul geste — jamais improvisé de mémoire sur ce
   qui reste ouvert.
2. **Lecture des rapports/registres pertinents déjà accumulés** (points-fragiles.md,
   correctifs-a-revalider.md, verdicts ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD les plus récents) —
   jamais reparti d'une feuille blanche alors que le réseau d'outils a déjà des signaux disponibles.
3. **Organisation d'un plan d'exécution** : ordre de priorité des tâches ouvertes, en tenant compte
   de ce qui est bloqué par une décision de l'utilisateur (mis de côté avec des suggestions prêtes,
   jamais laissé bloquant) contre ce qui peut avancer sans lui.

**Pendant ce mode :**
- Chaque tâche substantielle bouclée se signale à the-ghost (`node scripts/the-ghost.mjs chained
  "<libellé>"`), pour garder un vrai compteur de progression sur la session en cours.
- Une Ronde CIRCLE-TASKS de temps en temps (jamais à chaque tâche, jamais jamais non plus) —
  fréquence laissée au jugement de l'agent selon le volume réel de travail abattu, éclairé par
  `node scripts/the-ghost.mjs pacing` (depuis combien d'heures le mode tourne, depuis combien
  d'heures aucune Ronde n'a tourné) — un signal chiffré, jamais une obligation mécanique.
- Smart Conso API et SMART-CONSO-TOKEN consultés avant toute action coûteuse (agent séparé,
  simulation, diagnostic à vrais appels API) — Article 22, sans exception liée à l'absence de
  l'utilisateur ; le budget disponible se surveille, jamais dépensé à l'aveugle sous prétexte que
  « personne ne regarde ».
- Si une tâche est bloquée par une vraie question de calibrage : ne jamais la laisser sèche — au
  minimum consigner la question ET préparer des pistes concrètes qui font gagner du temps à la
  réponse (options déjà réfléchies, avantages/inconvénients esquissés), puis passer à la tâche
  ouverte suivante.
- Si plus aucune tâche ouverte identifiée dans `docs/suivi/` : chercher activement les tâches
  cachées dans les recoins (référentiels jamais relus depuis longtemps, écarts doc/code, signaux
  CLEAN-DIRTY-OLD/ALWAYS-NEW-CODE jamais suivis d'effet) avant de conclure qu'il n'y a plus rien à
  faire.

**En sortie de ce mode (retour de l'utilisateur, ou fin de la fenêtre de travail autonome)** : un
compte rendu clair de ce qui a été fait, de ce qui reste bloqué avec les suggestions préparées, et
`docs/suivi/` à jour comme pour toute tâche substantielle — jamais un silence qui laisserait
l'utilisateur reconstituer seul ce qui s'est passé pendant son absence.

**Dernier geste, systématique, avant de rendre la main.** *(Recalibré le 2026-09-21, demande
explicite de l'utilisateur à son réveil : « je voudrais par ex que la derniere tache soit un etat
des lieux des taches en cours affiché à l'écran que je me repere (comme pour toi quand tu
commences) ».)* Après le compte rendu narratif ci-dessus (jamais à sa place — les deux
coexistent, dans cet ordre), l'agent termine TOUJOURS son message de clôture par un état des lieux
complet des tâches — mécanisé depuis le 2026-09-21 par `node scripts/the-ghost.mjs end` (cf. section
dédiée §7ter, qui réutilise `check-tasks-details.mjs projet_entier` et referme la session), cf.
Article 13 de CLAUDE.md, `docs/referentiel/check-tasks-details.md` — affiché directement dans la
conversation —
jamais seulement en fichier joint — sous les deux formes à la suite : d'abord un résumé compact
rédigé par l'agent (statuts, ce qui reste ouvert, ce qui est bloqué), puis le détail complet en
dessous. Objectif explicite : que l'utilisateur retrouve, dès son retour, le même genre de repère
immédiat que l'agent lui-même construit en tout début de mode nocturne (étape 1 ci-dessus) — jamais
besoin d'ouvrir un fichier séparé pour savoir où en est le projet.

## 2. Calibrage et questions

Poser des questions avant d'exécuter, plutôt que supposer, est une règle centrale (cf. `CLAUDE.md`
Article 16 et son complément du 2026-09-18 sur les questions après « voici mes commentaires »).
Ici, seuls les points **spécifiques à la méthode de questionnement elle-même** sont consignés :

- **Poser des questions souvent est le mode par défaut, pas l'exception.** *(Précisé le 2026-09-18
  à la demande explicite de l'utilisateur, qui a vérifié que ce point était bien consigné.)* Ce
  n'est pas seulement un réflexe déclenché par une ambiguïté détectée au cas par cas : c'est une
  disposition de fond de la collaboration. Dans le doute entre demander et supposer, l'agent
  demande — y compris pour des questions qui l'aident lui-même à mieux comprendre le sujet, pas
  seulement pour lever une ambiguïté déjà identifiée dans la demande de l'utilisateur (cf.
  `CLAUDE.md`, complément du 2026-09-18 : « des questions qui t'aident à mieux comprendre »). Le
  seuil minimal (au moins trois, ou une dizaine après une relecture complète, Article 16/18 de
  `CLAUDE.md`) est un plancher, jamais un plafond.
- **Format d'étiquette** : chaque question commence par son type entre crochets — `[Calibrage]`,
  `[Alignement de compréhension]`, `[Enquête technique]`, ou tout autre type pertinent au moment
  (liste ouverte, jamais fermée) — pour que l'utilisateur sache d'emblée quel genre de réponse
  apporter (confirmé le 2026-09-18, format conservé tel quel).
- **Calibrer le NIVEAU D'EXIGENCE, pas seulement le contenu** *(règle ajoutée le 2026-09-18, à la
  suite d'un échange explicite sur ce point précis)* : quand l'utilisateur ne précise pas si un
  sujet donné doit être traité comme central (rigueur maximale) ou secondaire (rigueur normale),
  l'agent lui pose la question plutôt que de supposer un périmètre fixe à l'avance. Il n'existe
  volontairement **aucune liste figée** de « sujets centraux » : c'est une vigilance de second
  ordre — interroger le CADRE de la demande, pas seulement son contenu — à exercer à chaque fois
  que ce n'est pas déjà évident dans le message de l'utilisateur.
- Les protocoles de calibrage déjà détaillés ailleurs ne sont jamais recopiés ici : voir
  `CLAUDE.md` pour le Protocole de simulation complète (Article 18), la Double lecture en
  parallèle, et les Questions de calibrage après « voici mes commentaires ». Ce document y renvoie
  plutôt que de dupliquer, pour ne jamais désynchroniser deux versions du même protocole (même
  logique que les Articles 6/7 de la charte de contenu).

## 3. Rigueur variable, jamais uniforme

La rigueur de vérification (tests, documentation, relecture) se resserre sur les points que
l'utilisateur identifie comme centraux — jamais un même niveau partout par défaut. Concrètement :
compilation propre (`tsc --noEmit`), suite `scripts/check-house.mjs` intégralement verte, un
nouveau test dédié pour toute mécanique nouvelle, documentation mise à jour le jour même dans les
couches concernées (`docs/referentiel/`, `lib/reference.ts`, ce document si la règle de travail
elle-même change) et une revue du diff avant commit restent la pratique par défaut de l'agent —
mais quand l'importance d'un sujet n'est pas évidente, l'agent DEMANDE (cf. section 2) plutôt que
de fixer lui-même le curseur.

## 3bis. Test d'utilité réelle à 4 destinataires

*(Ajouté le 2026-09-20, à la demande explicite de l'utilisateur : « assure-toi que tout ce qui est
fait est utile : pour toi, pour moi, pour la team, pour le projet, ajoute une valeur ajoutée si
besoin à toute opération, dans ce sens ».)* Avant de considérer une opération terminée (un
correctif, un nouvel outil, une réponse à une question, une extension de charte), se demander
explicitement à qui elle profite réellement, parmi ces quatre destinataires — jamais seulement
« est-ce que ça marche ? » :

1. **L'agent lui-même** — l'opération économise-t-elle du temps/des tokens à une future session, ou
   évite-t-elle de refaire un diagnostic déjà fait (cf. SMART-CONSO-TOKEN, `classifyConsumption`) ?
2. **L'utilisateur** — répond-elle réellement à ce qu'il a demandé, ou seulement à une lecture
   littérale qui manque l'intention (cf. Article 16 de CLAUDE.md) ?
3. **La team (les autres outils)** — l'opération leur évite-t-elle un travail redondant, ou casse-t-
   elle une intégration existante (cf. section 7ter, anti-doublon) ?
4. **Le projet** — sert-elle l'esprit des personnages, la cohérence, ou la charte elle-même (cf.
   Article 0/1/2 de CLAUDE.md), ou n'est-elle qu'une agitation sans effet observable ?

Si une opération ne profite clairement à AUCUN des quatre, c'est un signal à traiter comme un vrai
doute (Article 16) plutôt qu'à exécuter par réflexe — proposer une version qui ajoute une valeur
réelle plutôt que de livrer un geste creux. Ce test n'ajoute aucune bureaucratie visible (pas de
case à cocher par tâche) : c'est une question de jugement à se poser à chaque décision, comme les
autres principes de vigilance continue (cf. Article 14 de CLAUDE.md).

## 3ter. Toute expérience vécue doit alimenter un outil, jamais rester dans la conversation

*(2026-09-22, demande explicite de l'utilisateur : « pense bien à alimenter les outils dédiés avec
ton expérience quand c'est pertinent — règle de travail à inscrire ».)*

Une session produit en permanence de l'expérience réelle : un outil qui rend un faux positif, un
angle mort qu'il ne voit pas, un jugement que l'agent a dû rendre à la main alors qu'un signal
mécanique aurait suffi, une question posée par un outil dont la réponse vaut une fois pour toutes.
Cette expérience est **périssable** : dite en conversation, elle disparaît à la session suivante et
le même défaut se reproduit à l'identique — c'est exactement ce que l'Article 3 de la charte
interdit (« une règle corrigée une fois ne doit plus jamais se reproduire ailleurs sous une autre
forme »).

**La règle** : dès qu'une expérience de ce type survient, elle est portée DANS l'outil concerné,
dans le même commit que le travail qui l'a révélée — jamais notée pour plus tard, jamais laissée
au seul compte rendu.

**Où porter quoi** — la distinction est nette et se pose à chaque fois :

- **Un signal mécanique, répétable, vérifiable sans jugement** → dans le CODE de l'outil, avec son
  test. Exemples réels du 2026-09-22 : `findUnnavigableSections()` ne comptait que les sous-titres
  en dièses, `principes.md` n'en a aucun → un second motif ajouté ; ecotoken demandait s'il fallait
  déménager une section de 173 tokens → un plancher absolu ajouté.
- **Un arbitrage, une décision, une raison** → dans le DOCUMENT de référence concerné
  (`docs/referentiel/<outil>.md`, `points-fragiles.md`, ce document). Un outil n'a pas à porter une
  décision humaine dans son code.
- **Ni l'un ni l'autre : une observation isolée dont on ne sait pas encore quoi faire** → dans
  `docs/referentiel/points-fragiles.md`, explicitement marquée en attente de décision. Jamais
  perdue, jamais déguisée en règle qu'elle n'est pas encore.

**Toujours un PRINCIPE, jamais un exemple de plus.** Même exigence que le corollaire de l'Article 17
pour le registre des personnages : la correction cherche la règle que l'outil pourra s'appliquer à
lui-même au prochain cas jamais rencontré, pas l'ajout d'une ligne à une énumération qui grandira
indéfiniment sans jamais couvrir le cas suivant.

**Le cas le plus important, et le plus facile à rater : un test qui épingle un défaut.** Quand un
test échoue après une correction, la question n'est jamais « comment le faire repasser » mais
« que pinçait-il exactement ». Trois fois le 2026-09-22, un test affirmait un comportement qui
était en réalité le bug (un « OK 100 % » décerné à un outil que trois Gardiens n'avaient jamais
regardé ; une question dont l'utilisateur avait déjà donné la réponse ; un comptage d'entrées qui
suivait un emplacement plutôt qu'un contenu). Un test réécrit dans ces cas-là n'est pas une
concession : c'est la correction elle-même, et le commentaire doit dire noir sur blanc qu'il
épinglait un défaut, jamais une intention.

**Limite honnête, à ne jamais masquer** : aucun mécanisme ne peut forcer cette règle — même limite
que l'obligation tool-brain et que SMART-CONSO-TOKEN, rien n'intercepte une expérience avant qu'elle
ne soit oubliée. La seule protection est écrite. Ce qui est vérifiable, en revanche, l'est : une
tâche de `docs/suivi/` qui décrit une trouvaille d'outil doit nommer ce qui a été porté dans l'outil
et où — un compte rendu qui raconte la trouvaille sans dire ce qu'elle a changé dans le code est le
signal que la règle n'a pas été appliquée.

## 3quater. La criticité d'un fichier s'évalue AVANT d'y mener une action

*(2026-09-22, demande explicite de l'utilisateur : « la criticité d'un fichier doit toujours être
évaluée avant d'y mener une action spécifique — comme une optimisation, une modification
importante, etc. ».)*

**La règle** : avant toute action spécifique sur un fichier — allègement, refonte, déplacement de
blocs, modification structurelle, tout ce qui va plus loin qu'une correction ponctuelle — sa
CRITICITÉ est mesurée, jamais supposée. Le niveau obtenu ne se contente pas de qualifier le
fichier : il **fixe ce qu'on a le droit d'appliquer sans repasser par l'utilisateur**.

L'échelle est celle d'ecotoken, la seule du projet, jamais une seconde inventée à côté — six
niveaux, dont les deux premiers sont catégoriels (un seul fait suffit à les atteindre) :

**Le sens exact, parce qu'il se lit facilement à l'envers** *(précision du 2026-09-22, après une
incompréhension réelle : « risque faible pour le fichier le plus important ? »)* : le niveau classe
le FICHIER, la limite porte sur les ACTIONS. Plus un fichier est critique, **moins** on a le droit
d'y appliquer de choses risquées. « Risque faible » ne veut donc jamais dire « ce fichier est peu
risqué » — il veut dire « ici, seules les modifications les moins risquées passent sans repasser par
l'utilisateur ». Les propositions plus risquées ne disparaissent pas pour autant : elles restent
affichées, mais comme des propositions, jamais comme des choses à appliquer.

| Niveau du FICHIER | Ce que ça veut dire | Ce qu'on a le droit d'y APPLIQUER |
|---|---|---|
| `maitre` | le fichier qui gouverne tout le travail (ici `CLAUDE.md`) | seulement les actions à risque « faible » — plus relecture humaine ET contrôle de perte de références, obligatoires |
| `tuyauterie` | lancé par un crochet, ou importé par beaucoup | idem : le casser casse le filet de sécurité lui-même |
| `critique` (≥6) | rechargé souvent, très cité, dense en règles | idem, et le doute tranche toujours pour NE PAS couper |
| `sensible` (≥4) | vraies conséquences en cas d'erreur | actions à risque « faible » ; le reste se propose |
| `ordinaire` (≥2) | fichier courant | actions à risque « moyen » comprises |
| `peripherique` (0) | sans dépendance connue | aucune contrainte particulière |

**Où la mesure se prend** : dans `tool-brain`, le réflexe déjà obligatoire avant toute recherche
dans un fichier existant (`node scripts/tool-brain.mjs "<tâche>" --file <fichier>`). La criticité
s'y affiche désormais **d'office**, avec ses signaux réels et, pour les trois niveaux hauts, le
rappel explicite des obligations. C'est volontaire et c'est le cœur de cette règle : la mesure
existait déjà dans ecotoken depuis le 2026-09-22 au matin, mais il fallait lancer ecotoken SUR le
fichier pour l'obtenir — donc jamais au moment où elle sert, juste avant d'agir. Une règle qui
oblige à consulter un outil qu'on ne pense pas à consulter n'est pas une règle, c'est un vœu.

**Ce que la règle n'exige PAS** : une correction ponctuelle (corriger une faute, ajouter une ligne
de suivi, mettre à jour un chiffre) n'est pas une « action spécifique » au sens ci-dessus. Exiger
une mesure de criticité pour chaque frappe la rendrait mécanique, donc invisible — exactement ce
que l'Article 14 de la charte reproche à une vigilance qui coche des cases.

## 4. Git et livraison

- **Commit dès qu'un morceau de travail cohérent passe les tests**, sans attendre une demande
  explicite à chaque fois — mais jamais sans avoir lancé les tests et la compilation avant
  (confirmé le 2026-09-18 comme règle formelle, pas seulement une habitude tolérée).
- Un message de commit clair, en français, décrivant le POURQUOI plutôt que la liste mécanique des
  fichiers touchés.
- Push vers la branche de travail une fois qu'un morceau cohérent est committé, sans attendre la
  toute fin d'une longue session.
- **Le suivi (`docs/suivi/`) se met à jour DANS LE MÊME COMMIT que le travail qu'il décrit, jamais
  après coup.** *(Ajouté le 2026-09-19, après une vraie dérive mesurée : 7 des 8 derniers commits
  d'une même session avaient changé du code ou de la charte réelle sans toucher `docs/suivi/` une
  seule fois, laissant la fiche de session périmée de plus de 3h30 — trouvaille de
  `findCommitsMissingSuiviUpdate()`, cf. `docs/systeme-de-suivi.md`.)* Avant de committer un
  chantier qui clôt ou fait avancer une tâche, mettre à jour sa ligne dans
  `docs/suivi/sessions/<session>.md` (et `docs/suivi/index.md` si une grande étape est franchie) et
  l'inclure dans le MÊME commit — jamais un commit de code isolé suivi d'un rattrapage différé.

## 5. Sécurité et discrétion

- Une clé API ou tout secret transmis en direct dans la conversation n'est **jamais** réaffiché
  dans une réponse, un log ou un commit — écriture uniquement dans les fichiers de configuration
  locaux prévus à cet effet (`.dev.vars`).
- Une demande de discrétion sur un mécanisme technique (ex. le repli de quota Gemini) s'applique à
  la surface effectivement visible d'un tiers (le référentiel affiché en jeu), jamais au code
  fonctionnel lui-même qui doit rester lisible pour fonctionner — la limite honnête de ce qui peut
  réellement être caché est explicitée à l'utilisateur plutôt que promise à tort.
- Une limite technique dure imposée par l'environnement (ex. le classificateur de sécurité
  refusant un bloc de texte encodé) n'est jamais recontournée sous une autre forme sans une
  nouvelle demande explicite de l'utilisateur.

## 6. Blocages externes (quota, réseau, service tiers)

*(Confirmé le 2026-09-18.)* Face à un vrai blocage externe (quota API épuisé, panne réseau) plutôt
qu'un bug de code : l'agent **cherche d'abord une solution ou un contournement** (diagnostic,
mécanisme de repli déjà en place, nouvelle tentative raisonnable) avant de notifier l'utilisateur,
et rapporte alors avec le résultat obtenu — jamais un simple statut d'alerte sans avoir essayé,
sauf si la recherche de solution elle-même prend un temps déraisonnable.

## 6bis. Protocole de simulation complète (Article 18 de CLAUDE.md)

*(Déplacé ici le 2026-09-21, à la demande explicite de l'utilisateur pendant une passe d'allègement
de CLAUDE.md — cf. `docs/referentiel/smart-conso-token.md` : CLAUDE.md est rechargé à CHAQUE tour,
ce protocole n'est consulté que quand une simulation est réellement demandée. CLAUDE.md ne garde
qu'un stub de 3 phrases sous l'Article 18, pointant ici — les nombreux renvois internes à « Article
18, étape N » ailleurs dans CLAUDE.md restent valides puisque la numérotation ci-dessous n'a pas
changé.)*

Quand l'utilisateur demande de « lancer une simulation » (ou toute formulation équivalente —
simulation complète, intégrale, de bout en bout), l'agent reproduit systématiquement le même
enchaînement, sans en sauter une étape et sans avoir besoin qu'on le lui redemande à chaque fois :

0. **Avant toute chose, consulter Smart Conso API** (`node scripts/smart-conso-api.mjs simulation
   --confirm`, cf. Article 22 de CLAUDE.md) — jamais après, jamais sauté ; la règle qui compte est
   toujours celle écrite DANS l'étape qu'on exécute, jamais une règle séparée qu'il faut se
   souvenir de recroiser. Un verdict "seuil dur" exige une validation explicite de l'utilisateur
   avant de continuer à l'étape 1. Pense-bête mécanique : `node scripts/le-regisseur.mjs checklist
   pre`.
1. Relancer un serveur de développement à jour (redémarré si besoin pour garantir que c'est bien
   le code réel, pas une instance périmée, qui est testé) et lancer le script de simulation
   intégrale contre lui — reset complet, phase 1 autonome jusqu'à la révélation, phase 2 (dossier
   retourné, négociation, plusieurs tirages de bonus distincts, hostilité sévère, humour noir,
   désescalade, bienveillance soutenue, divergence par dispute) — produisant un nouveau transcript
   horodaté par pièce, le dossier retourné complet et un journal JSON des requêtes/réponses.
2. **Donner régulièrement à l'utilisateur l'avancement réel pendant que ça tourne** (round atteint,
   preuves découvertes, révélation atteinte ou non, étape de la phase 2 en cours) — jamais un
   silence total le temps que la simulation s'exécute, pour qu'il puisse suivre en même temps que
   l'agent, pas seulement découvrir un résultat figé à la fin.
3. Une fois terminé, livrer le copier-coller intégral du transcript en fichier joint uniquement
   (cf. préférence déjà actée plus haut, jamais collé en clair dans la réponse), accompagné du
   dossier retourné complet.
3bis. **Archiver durablement transcript + dossier, et extraire un résumé compact du journal JSON
   avant de le laisser disparaître.** Copier transcript + dossier dans
   `docs/simulations/` (jamais le journal JSON brut lui-même — plusieurs Mo par simulation, coût
   disproportionné pour sa valeur de vérification, décision explicite de l'utilisateur), lancer
   `node scripts/summarize-simulation-log.mjs <chemin du journal>` et garder son résultat compact
   (tirages de bonus, déplacements, révélation, jardin, progression de l'enquête) à la place du
   fichier brut, puis ajouter une ligne à `docs/simulations/index.md`. Ce n'est pas un geste
   ponctuel : cette archive nourrit le reste du réseau d'outils (HARMONIA peut vérifier qu'une règle
   documentée s'est vraiment produite en jeu, pas seulement que le code et la doc s'accordent entre
   eux ; ARGUS peut corroborer un champ "jamais lu" par une absence d'effet observé en session
   réelle) — à répéter à CHAQUE simulation, jamais seulement pour rattraper un retard une fois.
   **Mécanisé le 2026-09-21 par LE-RÉGISSEUR** (`node scripts/le-regisseur.mjs archive <simName>
   <journalPath> <transcriptPath> [dossierPath]`) pour la copie des fichiers et le résumé du journal
   — jamais la ligne de `docs/simulations/index.md` elle-même, qui reste un vrai travail de lecture
   (root-cause, liens vers d'autres tours) que le script ne peut pas écrire à la place de l'agent.
4. **Lancer `node scripts/kpi-report.mjs` avant de redémarrer le serveur** et inclure ses résultats
   dans la même livraison que le transcript/dossier — jamais un rapport à part, oublié ou différé.
   Les compteurs du Smart Breaker étant en mémoire process, ce rapport doit être pris AVANT de
   relancer le serveur pour la simulation suivante, sous peine de perdre les chiffres de cette
   session précise. En complément, archiver le texte complet de cette exécution dans
   `docs/referentiel/kpi-rapports/<run>.txt` et ajouter une ligne à
   `docs/referentiel/kpi-index.md` (comparaison explicite avec le run précédent, jamais une lecture
   isolée) — procédure complète documentée dans `kpi-index.md` lui-même. Dans la conversation,
   livrer uniquement la section "SYNTHÈSE COMPACTE" du rapport (petit tableau `Famille → %` +
   points d'attention) accompagnée de `docs/referentiel/kpi-historique.csv` en fichier joint —
   jamais le rapport complet collé en clair (demande explicite de l'utilisateur : « dans la
   conversation, tu ne fais que la synthèse globale »). **Mécanisé le 2026-09-21 par LE-RÉGISSEUR**
   (`node scripts/le-regisseur.mjs kpi <runLabel>`) pour le lancement, l'archivage du texte complet
   et l'extraction de la synthèse compacte — jamais la ligne de comparaison de `kpi-index.md`, qui
   reste, comme ci-dessus, la plume de l'agent (cf. la règle déjà écrite dans `kpi-index.md`
   lui-même : « comparer deux runs et en tirer ce qui compte est un travail de lecture, pas un
   calcul »).
4bis. **Faire lire la simulation par EL-PROFESSOR avant de commencer l'analyse.** Une vraie lecture (jamais un calcul
   mécanique) du transcript ET du dossier retourné (obligatoire dès qu'il existe) contre les 5 thèmes
   de la charte, plafonnée par l'Article 0 si l'esprit dérive — cf.
   `docs/referentiel/el-professor.md` pour la méthode complète. Livrée en fichier joint, dans la
   même livraison que le transcript/dossier/rapport KPI, jamais collée en clair. Archivée dans
   `docs/el-professor/<sim>.md` + une ligne dans `docs/el-professor/index.md`. Jamais sauté, même
   sous pression de temps : c'est le point de départ de l'étape 5, pas un supplément optionnel.
   **THE-SCREENER rejoint cette même étape** (2026-09-19, pendant du précédent pour le graphisme :
   2 captures d'écran maximum, jugées contre `docs/referentiel/regles-des-graphismes.md`, note
   strictement indicative qui ne prime jamais sur l'appréciation de l'utilisateur — cf.
   `docs/referentiel/the-screener.md`). Contrairement à EL-PROFESSOR, son statut reste secondaire :
   un échec technique de capture ne bloque jamais le protocole. **Les deux outils acceptent aussi
   bien une simulation de dev qu'une vraie session copiée depuis le site en ligne** une fois publié
   — les deux sources coexistent, cf. `docs/simulations/index.md`.
5. Passer directement à une analyse détaillée de ce qui fonctionne et de ce qui ne fonctionne pas
   dans ce nouveau transcript, **en partant du rapport EL-PROFESSOR déjà produit à l'étape 4bis**
   plutôt que de tout redécouvrir à la main — jamais une simple confirmation que « ça tourne ».
6. Comparer systématiquement avec la dernière version de simulation complète disponible pour
   mesurer l'évolution réelle et la réussite des derniers travaux engagés, jamais une lecture
   isolée sans mise en perspective avec l'historique. Deux appuis concrets pour cette comparaison,
   jamais seulement une impression de lecture : (a) la tendance des notes EL-PROFESSOR dans
   `docs/el-professor/index.md`, thème par thème ; (b) `docs/simulations/correctifs-a-revalider.md`
   — le carnet, **distinct d'EL-PROFESSOR et jamais consulté par lui**, qui liste les correctifs de
   code récents encore « en observation » et ce qu'il faut chercher dans le nouveau texte pour
   confirmer qu'ils tiennent (un correctif sort du carnet après 2 simulations propres consécutives,
   jamais une seule).
7. Poser au moins une dizaine de questions de calibrage à l'utilisateur avant d'entamer la moindre
   correction ou optimisation identifiée par cette analyse — jamais corriger silencieusement sur la
   base d'une seule lecture personnelle du transcript (cf. Article 16 de CLAUDE.md, dont c'est ici
   une exigence renforcée, pas une exception).
8. Organiser ensuite le correctif/l'optimisation de manière sûre, robuste et fiabilisée, avec la
   même rigueur que le reste de la charte (tests créés si besoin, suite complète revérifiée verte,
   documentation mise à jour le jour même — Articles 3, 5, 13 de CLAUDE.md).

**Double lecture en parallèle, questions de calibrage après « voici mes commentaires », sondage
rapide après livraison, type de question précisé, format de présentation, clarté pour un
non-développeur, une question = une seule idée simple** : ces règles complémentaires, plus
générales (elles s'appliquent aussi hors simulation), restent documentées dans CLAUDE.md à la suite
de l'Article 19 — jamais dupliquées ici.

## 7. Livrables

Toute transcription intégrale de simulation (ou tout document long de même nature) est livrée en
pièce jointe véritable, jamais collée en clair dans la réponse — préférence actée le 2026-09-18,
cf. `CLAUDE.md`. Le mécanisme concret utilisé pour ça avec Claude Code (`SendUserFile`) est propre
à l'outil : voir Partie B.1.

**Format HTML par défaut, pas le .txt brut (2026-09-22, demande explicite de l'utilisateur : « je
souhaite que les transcripts soient livrés en html agréables à lire »).** `archiveSimulationFiles()`
(`scripts/le-regisseur.mjs`) produit désormais systématiquement, en plus du `.txt` de référence
(inchangé — c'est lui que relisent `summarize-simulation-log.mjs`/HARMONIA/ARGUS), un `.html`
compagnon coloré par personnage (réutilise le type de bloc `dialogue` de `html-report.mjs`, conçu
"pour les simulations" dès le 2026-09-20 mais jamais câblé jusqu'ici — fermait exactement le trou
que Doc-Report avait déjà repéré). C'est ce `.html` qui doit être livré en pièce jointe désormais,
jamais le `.txt` brut — le fichier de référence gardé dans `docs/simulations/` reste le `.txt`,
seule la présentation à la remise change.

**Deux règles permanentes pour TOUS les rapports HTML, pas seulement les transcripts (2026-09-22,
demande explicite de l'utilisateur : « tous les rapports html doivent être aux couleurs de la charte
[...] même si celle-ci évolue. et tous les rapports html doivent s'ouvrir avec zoom 150% »).**
Généralisé le même soir depuis une première demande limitée au seul transcript. Les deux règles
vivent directement dans `THEME_CSS` (`scripts/html-report.mjs`, partagé par tous les rapports —
KPI, EL-PROFESSOR, simulations, THE-FINAL-JUDGE...), jamais un traitement spécial par rapport :
1. **Couleurs** — `--lia`/`--noe` reprennent telles quelles les valeurs réelles de `app/globals.css`
   (le jeu), jamais une palette de rapport inventée à part. Doit rester synchronisé même quand la
   future charte graphique de la refonte les changera — vérifié mécaniquement par
   `checkHtmlReportTheme()` (`scripts/doc-report.mjs`), qui compare les deux fichiers réels à
   chaque exécution et signale toute désynchronisation par son nom exact.
2. **Zoom 150% à l'ouverture** — `body { zoom: 1.5; }`, présent dans `THEME_CSS` lui-même, jamais
   un post-traitement par rapport. Même garde-fou `checkHtmlReportTheme()` que ci-dessus, qui
   vérifie sa présence à chaque exécution de Doc-Report.

**Économie de tokens sur les corrections mineures d'un Artifact déjà livré (2026-09-21, demande
explicite de l'utilisateur : « fais juste la correction sans me livrer le fichier mis à jour stp
(economie token, smart conso, regles à fixer pour economies token) »).** Un renommage cosmétique ou
une correction mineure (typo, libellé, couleur d'un badge) sur un Artifact déjà livré n'exige jamais
de republier ET de renarrer l'action à chaque fois — les deux coûtent des tokens réels pour un
changement que l'utilisateur n'a pas besoin de revoir immédiatement. Par défaut : appliquer la
correction au fichier source, la mentionner en une ligne (jamais un silence complet — Article 13
sur la traçabilité), et ne republier l'Artifact que si l'utilisateur le redemande explicitement ou
qu'une accumulation de plusieurs petites corrections justifie un rafraîchissement groupé. Distinct
de la règle « Conserver les versions précédentes » ci-dessous, qui protège l'archive — celle-ci
protège le rythme de republication/narration, jamais le contenu conservé.

**Conserver les versions précédentes pour comparaison rapide.** *(Ajouté le 2026-09-18, à la
demande explicite de l'utilisateur, après un besoin réel : comparer deux transcripts de simulation
pour diagnostiquer une régression sur un passage précis — Point 7 de la relecture du
2026-09-18.)* Un transcript de simulation (ou tout autre artefact volumineux produit pour
comparaison future — dossier retourné, journal JSON) n'est jamais écrasé ni supprimé au profit du
suivant : chaque nouvelle version s'ajoute, la précédente reste accessible. Avant de traiter une
demande de comparaison entre deux versions comme irréalisable faute d'archive, l'agent vérifie
d'abord si les fichiers précédents existent encore (répertoire de travail temporaire de la session
en cours, ou tout autre emplacement où ils auraient pu être sauvegardés) plutôt que de supposer
qu'ils sont perdus. Le répertoire temporaire d'une session n'étant pas garanti de survivre à un
changement d'environnement, un artefact dont la comparaison future importe réellement (ex. la
version validée d'une scène de référence) gagne à être copié dans le dépôt lui-même plutôt que
laissé uniquement en zone temporaire.

*Nuance ajoutée le 2026-09-18, à la demande explicite de l'utilisateur après que la méthode a
réellement fonctionné sur le Point 7 :* la comparaison de versions est un outil de diagnostic
précieux, souvent le plus rapide, **jamais une garantie universelle** — une régression peut aussi
n'avoir aucune version antérieure valable à comparer, ou provenir d'une cause que la comparaison
seule ne révèle pas (ex. le Point 2, retrouvé par une lecture directe du code et des journaux de
requêtes, pas par une différence visible entre deux transcripts). L'agent l'essaie en priorité
quand une version de référence existe, sans jamais s'y arrêter si elle ne suffit pas à conclure.

**Tout rapport produit doit être lu en entier par l'agent lui-même, jamais seulement livré.**
*(Ajouté le 2026-09-21, à la demande explicite de l'utilisateur, pendant la conception du catalogue
LE-COORDINATEUR : « rappel : quand un rapport est produit, tu dois le lire entièrement aussi ».)*
Généralise une discipline déjà pratiquée ponctuellement pour certains outils (ex. check-tasks-details :
« rapport toujours livré en fichier séparé ET lu en entier avant de répondre ») à TOUT rapport que
l'agent produit ou fait produire — jamais réservé à un seul outil. Concrètement : avant de répondre à
l'utilisateur après avoir généré un rapport (HTML, texte, ou tout autre format), l'agent le relit
lui-même intégralement, pas seulement son résumé ou son titre — la lecture réelle du contenu, jamais
supposée inutile parce que l'agent "sait déjà ce qu'il a écrit dedans" (un rapport peut agréger des
données calculées mécaniquement, jamais vraiment lues avant cet instant). Quand ce rapport est
produit à répétition (ex. le catalogue LE-COORDINATEUR à chaque Ronde CIRCLE-TASKS), cette lecture
donne matière à un commentaire court et réel dans la conversation elle-même — jamais un rapport
livré en silence sans que l'agent n'en dise rien.

**Renforcé le 2026-09-21 (question directe de l'utilisateur avant une Ronde CIRCLE-TASKS : « vas-tu
bien lire tous les rapports qui en découlent et ajuster des tâches en fonction de tes conclusions ?
[...] une règle évolutive, au cas où un nouveau rapport est rattaché à Circle, pas une liste
figée »)** : la lecture intégrale ci-dessus ne s'arrête jamais à un commentaire — chaque conclusion
réelle qu'elle produit (un écart trouvé, un outil à surveiller, un signal qui mérite un suivi) doit
se traduire en une vraie action de suivi dans `docs/suivi/` (une nouvelle ligne, ou l'ajustement
d'une tâche déjà ouverte), jamais seulement mentionnée puis oubliée. Cette obligation est **par
construction évolutive, jamais une liste figée** : elle porte sur TOUT rapport produit par un item
de `CIRCLE_ITEMS` (`scripts/circle-tasks.mjs`) au moment de la Ronde, quel qu'il soit — un item
ajouté demain à cette liste (ou un item retiré) est automatiquement couvert ou exclu sans jamais
retoucher cette règle elle-même, exactement le même principe que la règle générale ci-dessus
("TOUT rapport que l'agent produit ou fait produire — jamais réservé à un seul outil").

**Étendu le 2026-09-21 (demande explicite : « étends ce principe aux rapports issus des
simulations »)** : la même obligation d'action de suivi s'applique explicitement aux rapports
produits par le protocole de simulation complète (Article 18) — transcript, dossier retourné,
rapport KPI, note EL-PROFESSOR, capture THE-SCREENER, archivage LE-RÉGISSEUR — jamais seulement les
rapports rattachés à CIRCLE_ITEMS. Une conclusion réelle tirée de la lecture d'un de ces rapports
(un écart trouvé, un correctif à revalider, un signal qui mérite un suivi) doit, de la même façon,
se traduire en une vraie action dans `docs/suivi/` (ou dans le carnet dédié
`docs/simulations/correctifs-a-revalider.md` quand la nature du correctif l'appelle), jamais
seulement mentionnée dans l'analyse puis oubliée. Les deux catégories (outils via CIRCLE_ITEMS,
simulations via l'Article 18) restent chacune par construction évolutive dans leur propre périmètre
— jamais une troisième liste figée qui tenterait de fusionner les deux.

## 7bis. Rendre compte des progrès de l'outillage interne (ex. « Smart Breaker », l'outil quota Gemini)

*(Nom d'usage « Smart Breaker » donné le 2026-09-19 à la demande explicite de l'utilisateur, pour
le plaisir de lui donner un nom — désigne uniquement la façon dont on en parle, jamais les
fichiers eux-mêmes, cf. `docs/outil-resilience-api.md`.)*

*(Ajouté le 2026-09-18, à la demande explicite de l'utilisateur : « précise-moi à chaque fois que
l'outil API s'est amélioré et comment, avec une estimation du pourcentage d'efficacité gagné ».)*
Un outil de travail interne (ex. `scripts/check-gemini-quota.mjs` / `scripts/gemini-key-health.mjs`,
mais la règle vaut pour tout outillage comparable créé plus tard) a un statut différent d'un
changement de contenu du jeu : l'utilisateur ne le voit jamais tourner directement, donc son seul
moyen de suivre son évolution est le compte rendu de l'agent. À chaque amélioration réelle de ce
type d'outil (nouvelle capacité, correction d'un biais, extension de portée) :

- **Dire explicitement CE QUI a changé et COMMENT**, en langage clair (jamais juste "corrigé un
  bug" ou "amélioré l'outil" sans détail) — cohérent avec la section 8 ci-dessous sur la
  vulgarisation obligatoire des sujets techniques.
- **Donner une estimation chiffrée du gain d'efficacité** (ex. "évite désormais ~2 tentatives
  perdues sur 3 lors d'un blocage multi-modèles", "réduit le temps de diagnostic d'un blocage
  d'environ 80 %"). C'est une ESTIMATION qualifiée comme telle, jamais présentée comme une mesure
  exacte quand elle ne l'est pas — l'honnêteté sur la nature de l'estimation prime sur la précision
  apparente du chiffre.
- **Documenter la même évolution ici, dans les règles de travail**, pas seulement dans le message
  de la conversation — pour qu'une autre IA reprenant le projet retrouve l'historique des progrès
  de l'outil sans devoir relire tout le fil de conversation. Concrètement : une ligne d'historique
  dans cette section, datée, à chaque évolution notable.

**Complément ajouté le 2026-09-19, à la demande explicite de l'utilisateur** (« lorsque l'outil API
fonctionne, indique-moi s'il a eu l'occasion de s'améliorer, ou de se modifier pour s'améliorer, ou
pas, à chaque utilisation pertinente sur le sujet ») : la règle ci-dessus ne couvrait que le cas où
une amélioration avait effectivement eu lieu. Désormais, à CHAQUE utilisation ou modification
pertinente de cet outillage (une exécution réelle du diagnostic, une demande de l'utilisateur qui
aurait pu en être l'occasion, une évolution de la production qui le touche), l'agent dit
explicitement l'un des deux : soit ce qui a changé et le gain estimé (comme ci-dessus), soit qu'il
n'y a PAS eu d'amélioration cette fois et pourquoi (ex. « exécution de diagnostic pure, aucune
modification de l'outil cette fois »). Le silence sur ce point n'est jamais une option quand le
sujet a été abordé — c'est ce qui permet à l'utilisateur de suivre l'évolution réelle de l'outil
dans la durée, y compris ses paliers, pas seulement ses sauts.

**Le rapport KPI (`kpi-report.mjs`) fait partie intégrante de chaque livraison de simulation,
jamais un à-côté optionnel.** *(Ajouté le 2026-09-19, après un oubli réel signalé par
l'utilisateur : une livraison de simulation complète n'incluait ni le rapport ni les KPI du Smart
Breaker.)* L'étape correspondante est désormais explicite dans le protocole de simulation
(Article 18 de `CLAUDE.md`, étape 4) : `node scripts/kpi-report.mjs` se lance avant tout
redémarrage du serveur, et ses résultats accompagnent le transcript/dossier dans la même livraison
— jamais un rapport pensé comme secondaire ou fait "si on y pense". Cette section-ci documente
l'évolution de l'outil dans le temps ; l'Article 18 documente QUAND le consulter à chaque cycle.

**Historique des évolutions de l’outil quota/clé Gemini** — récit complet (chaque évolution, sa date, la demande qui l’a motivée) dans `docs/referentiel/smart-breaker-historique.md`. Extrait d’ici le 2026-09-22 par ecotoken : un historique se lit quand on enquête sur cet outil, jamais à chaque relecture des règles de travail.

## 7ter. Le paysage des outils de vigilance, et la consultation bidirectionnelle

**Sommaire de cette section** — 1527 lignes, 24 sous-parties. Généré depuis les
vrais titres du document, jamais recopié à la main. Il existe pour une seule raison : cette section
est à la fois la plus longue et la plus consultée, et jusqu’ici il fallait la parcourir en entier
pour y trouver quoi que ce soit — 48 blocs de règles sous 24 titres, sans aucun point d’entrée.

  - La carte des outils, pour ne plus se perdre
  - La consultation n'est jamais à sens unique
  - Trois canaux de consultation pour THE-FINAL-JUDGE (et modèle pour tout futur outil-agent)
  - Trois canaux de consultation pour THE-DEEP-READER, même modèle
  - Consultation programmatique outil→LE-COORDINATEUR (pas seulement une lecture humaine)
  - Moi (l'agent) → check-tasks-details, systématiquement avant toute lecture manuelle de l'état des tâches
  - Recevoir une sortie d'outil n'est pas la même chose que la traiter
  - Aucun de ces outils n'est autonome — l'agent reste toujours celui qui finalise
  - Un outil n'est jamais « fini » tant que ses points d'intégration décidés ne sont pas câblés et testés
  - Personnages (Lia, Noé) : hors de l'équipe, jamais une catégorie de l'organigramme
  - Moteur du jeu vs Outillage de travail : deux natures de code, jamais confondues sous un même nom
  - Une règle transversale ne compte que si elle est câblée DANS chaque checklist concrète qu'elle gouverne
  - Veille hebdomadaire automatique du réseau
  - Avant de créer quoi que ce soit de nouveau, vérifier la mutualisation — jamais un doublon
  - LE-COORDINATEUR — l'exception volontairement mince, sans blueprint ni instanciation
  - CIRCLE-TASKS — la « Ronde périodique », même exception volontairement mince
    - Le menu des prestations — traduire les outils en demandes, jamais en noms internes
  - THE-GHOST — l'orchestrateur du mode nocturne autonome, même exception volontairement mince
  - doc-HTML (surnom, anciennement « gabarit HTML ») — un outil sans blueprint, encore plus mince que CIRCLE-TASKS
  - find-deep-booster (surnom d'affichage, anciennement « route-booster » — le fichier `scripts/route-booster.mjs` ne change jamais) — outil sans blueprint
  - find-brain — le cerveau unifié de find-booster et find-deep-booster
  - Principe général — un réflexe outil avant chaque commande, sur 3 axes
  - tool-brain — le cerveau central des rappels d'outils, généralise find-brain
  - Reclarification de l'organigramme — « Membre certifié » couvre deux catégories


*(Ajouté le 2026-09-19, après la construction dans la même session d'ARGUS, HARMONIA, Smart Conso
API, HYPER-SCAN-CHECKPOINT, CHECK-LEVEL-TARGET et ALWAYS-NEW-CODE (en cours) — demande explicite de
l'utilisateur : « mets à jour tes façons de travailler avec l'arrivée de tous ces outils [...] les
outils doivent toujours t'interroger aussi, il y a une communication entre vous destinée à
maximiser leurs performances ».)*

### La carte des outils, pour ne plus se perdre

**Trois statuts, jamais confondus (2026-09-20, demande explicite de l'utilisateur : « peux-tu
m'aider à clarifier ces distinctions entre scripts, employés de la team, scripts importants
(considérés agents et pourquoi) »)** — la colonne Statut ci-dessous les distingue explicitement :
- **Agent** (« employé de l'équipe », « membre de la dream team ») : possède au minimum une
  instanciation propre à ce projet (`docs/referentiel/X.md`) + un registre (`docs/X/`, dossier +
  index) — le même schéma standard à chaque fois, comme un poste de travail standard que chaque
  nouvel employé reçoit puis personnalise. Le blueprint générique est la norme en plus de ces deux
  pièces, mais PAS strictement obligatoire : un Agent peut explicitement partager le blueprint d'un
  autre (déclaré comme son « cousin », jamais silencieux) — seul cas actuel, THE-DEEP-READER
  partage la mécanique de THE-FINAL-JUDGE sans blueprint séparé, tout en gardant sa propre
  instanciation et son propre registre. **Précision trouvée le 2026-09-20 en construisant le check
  d'accueil ci-dessous** : ce qui justifie réellement ce statut n'est jamais l'ancienneté ni la
  taille du code, ni même la présence d'un blueprint à elle seule, mais l'existence d'un DOMAINE DE
  JUGEMENT propre au projet, documenté par au moins l'instanciation + le registre.
- **Utilitaire nommé** (doc-HTML, CHARTER-SPY, tool-usage.mjs, Doc-Report, find-brain) : a un nom
  pour qu'on puisse s'y référer facilement, mais aucune connaissance propre au projet à documenter
  à part — sa seule valeur est d'appeler/agréger/mettre en forme ce que les Agents disent déjà.
  Jamais de blueprint, jamais de registre séparé.
- **Infrastructure** (`check-house.mjs`, `check-spirit.mjs`/`check-profile.mjs`, et tout script
  sans nom propre comme `check-argus.mjs`/`lib-shell.mjs`) : le filet de sécurité et les briques
  mécaniques qui FONT tourner les Agents, jamais une identité à part. Un Agent peut être implémenté
  par plusieurs fichiers d'infrastructure (ex. Smart Breaker = 4 fichiers) sans que chacun d'eux
  ait besoin de son propre statut.

**Lecture groupée demandée par l'utilisateur (2026-09-21) : « Équipe Infrastructure » (renommée
depuis « la Plomberie », même soir) vs les Utilitaires
nommés proprement dits.** Ces deux statuts (Utilitaire nommé, Infrastructure) restent DEUX statuts
Axe A distincts, jamais fusionnés dans le code ni dans `checkAgentOnboarding()` — mais pour la
LECTURE humaine de l'organigramme (schéma, futurs documents d'organisation), l'utilisateur a
explicitement demandé de les regrouper visuellement sous deux sous-catégories nommées, jamais
mélangées en une seule liste indifférenciée comme un premier schéma l'a fait par erreur :
- **Équipe Infrastructure** (= Infrastructure ci-dessus) — `check-house.mjs`, `check-spirit.mjs`/
  `check-profile.mjs`, `lib-shell.mjs`, `check-argus.mjs`, `check-harmonia.mjs` : jamais nommée
  individuellement dans le catalogue, fait tourner tout le reste.
- **Utilitaires nommés** (au sens strict) — doc-HTML, CHARTER-SPY, tool-usage.mjs, Doc-Report,
  find-brain : un nom réel, une identité propre, mais aucune connaissance propre au projet.

**Un script d'infrastructure ou un utilitaire nommé PEUT être sollicité par LE-COORDINATEUR
librement, sans avoir le statut Agent** — le statut Agent est une question de DOCUMENTATION/
IDENTITÉ, jamais un contrôle d'accès. `runNetworkCheck()` appelle déjà directement
`check-argus.mjs`/`check-harmonia.mjs` par le shell et importe des fonctions pures d'AXA-CHECK/
ALWAYS-NEW-CODE/CLEAN-DIRTY-OLD/CHECK-LEVEL-TARGET/Smart Conso API/SMART-CONSO-TOKEN — jamais
bloqué par un statut, seulement par l'existence réelle d'une fonction ou d'un CLI à appeler.

| Outil | Statut | 🎖️ Badge | Ce qu'il détecte/régule | Coût | Déclenchement |
|---|---|---|---|---|---|
| `check-house.mjs` | Infrastructure | — | régressions de comportement (filet de sécurité) | gratuit | à chaque changement de code |
| `check-spirit.mjs` / `check-profile.mjs` | Infrastructure | — | fidélité de l'esprit des personnages (Article 0) | réel (API) | à la main, si `lib/lia.ts`/personnalités changent |
| ARGUS | Agent | 🎖️ | absences — ce qui devrait exister et n'existe pas (Article 20) | gratuit (partie mécanique) | toujours déployé — logique testée à chaque commit (`check-house.mjs`, pre-commit) ET balayage réel du code courant à chaque commit (`scripts/hooks/check-last-commit.mjs`, post-commit, warn-only, 2026-09-20) |
| HARMONIA | Agent | 🎖️ | frictions — deux choses qui existent et se contredisent (Article 20) | gratuit (partie mécanique) | idem ARGUS ci-dessus |
| Smart Conso API | Agent | 🎖️ | rythme de consommation API de l'AGENT pendant le travail (Article 22) ; peut aussi scanner l'historique réel pour repérer des schémas coûteux | gratuit à consulter | avant toute action coûteuse de l'agent |
| CHECK-LEVEL-TARGET | Agent | 🎖️ | quel niveau de vérification une demande appelle, quels outils déployer | gratuit | avant de décider comment traiter une demande |
| HYPER-SCAN-CHECKPOINT | Agent | 🎖️ | orchestrateur exceptionnel, fidélité aux consignes passées (Article 21) | réel (API, en version complète) | sur demande explicite seulement |
| ALWAYS-NEW-CODE | Agent | 🎖️ | dette d'organisation — code empilé plutôt que pensé (Article 23) | réel (raisonnement) | niveau « Exceptionnel » de CHECK-LEVEL-TARGET |
| AXA-CHECK | Agent | 🎖️ | robustesse/fragilité RÉELLE par fonction (couverture de test V8, zéro nouvelle dépendance) (Article 20) | gratuit | toujours déployé |
| CLEAN-DIRTY-OLD | Agent | 🎖️ | stagnation relative du code, délègue le jugement à ARGUS/HARMONIA/ALWAYS-NEW-CODE (Article 20) | gratuit | toujours déployé |
| EL-PROFESSOR | Agent | 🎖️ | note qualitative de fidélité à la charte (esprit, naturel, voix, enquête, clarté) d'une simulation ou d'un extrait isolé (Article 18, étape 4bis) | gratuit (relit un texte déjà produit) | après chaque simulation Article 18, ou sur demande pour un extrait isolé |
| THE-SCREENER | Agent | 🎖️ | note indicative de qualité graphique (2 captures d'écran max) (Article 18, étape 4bis) | réel (Playwright, léger) | après chaque simulation Article 18, jamais bloquant |
| THE-FINAL-JUDGE | Agent | 🎖️ | audit indépendant du code et du produit par un agent réellement séparé, verdict opiniâtre + recommandations | réel (agent séparé, 6 paliers d'intensité × 4 paliers de périmètre) | sur demande explicite (moi, l'utilisateur, ou un autre outil), niveaux « Approfondi »/« Exceptionnel » de CHECK-LEVEL-TARGET (tendance, jamais un verrou) |
| THE-DEEP-READER | Agent | 🎖️ | cousin de THE-FINAL-JUDGE (même mécanique d'agent séparé, personas et règles d'entrée opposées) dédié à la relecture lourde du suivi (`docs/suivi/`) contre l'historique complet de la conversation | réel (agent séparé, coût variable — plancher fixe + volume réel de conversation à relire) | sur demande explicite (moi, l'utilisateur, ou `check-suivi-fidelity.mjs` en cas de faiblesse répétée), ou proposé périodiquement via CIRCLE-TASKS (jamais coché par défaut) |
| LE-COORDINATEUR | Membre certifié (classique) | 🎖️ | agrège en un tableau très court ce que les outils gratuits ci-dessus disent déjà, repère un doublon de vérification récent ; son menu de prestations rappelle ce qui peut être commandé | gratuit | synthèse complète (`runNetworkCheck()`) = routine agent, jamais un crochet git (reshellerait `check-house.mjs`, redondant à chaque commit) ; menu des prestations seul = affiché automatiquement à chaque commit (`scripts/hooks/check-last-commit.mjs`, post-commit, 2026-09-20) |
| Smart Breaker (`check-gemini-quota.mjs` + `gemini-key-health.mjs` + `api-providers.mjs` + `lib/gemini-keys.ts`) | Agent (structure particulière : pas de dossier `docs/` dédié, son « registre » est le fichier local `.gemini-key-health.json`, jamais committé) | — (jamais vérifié mécaniquement, sa structure hors norme n'a pas de chemin standard à contrôler) | blocages de quota/clé Gemini, portée PRODUCTION | gratuit à diagnostiquer | à la demande, ou automatique en production (repli) |
| SMART-CONSO-TOKEN | Agent | 🎖️ | rythme de consommation de TOKENS de l'agent (Agent séparé, lecture exhaustive, poids d'un document toujours chargé) ; peut aussi scanner et proposer des réductions | gratuit à consulter | avant tout appel à un agent séparé ou tout raisonnement coûteux — obligation écrite dans la charte, jamais un garde-fou vérifiable après coup |
| CIRCLE-TASKS (« Ronde périodique ») | Membre certifié (classique) | 🎖️ | 21 tâches périodiques gratuites mal automatisées, regroupées par thème (profil utilisateur, relecture des référentiels, KPI, tâche ouverte la plus ancienne — Suivi & référentiels ; vérifier que les idées de gros chantier sont bien dans leur fichier préliminaire (checkChantierFileFreshness(), ajouté le 2026-09-21) — Suivi des chantiers ; rapport KPI, scans Smart Conso API/SMART-CONSO-TOKEN — KPI & scans ; zone ALWAYS-NEW-CODE la plus négligée, dernier passage CLEAN-DIRTY-OLD, câblage HTML des rapports, poids en tokens de CLAUDE.md — Qualité du code ; garde-fou profil-utilisateur réellement exécuté, synthèse LE-COORDINATEUR réellement exécutée — Passages réels (smoke run), ajouté le 2026-09-21 ; photo de la dream team, THE-SCREENER — Qualité & fun) — regroupées dans une seule fenêtre à cocher ; THE-FINAL-JUDGE et THE-DEEP-READER restent visibles dans la même fenêtre (thème Audit lourd) mais toujours marqués ⚠️🔴 coûteux, jamais cochés par défaut | gratuit (sauf si THE-FINAL-JUDGE/THE-DEEP-READER est explicitement coché) | à la demande de l'utilisateur ou de l'agent ; rappel proactif automatique dans le crochet post-commit après 10 commits sans passage |
| doc-HTML (surnom, anciennement « gabarit HTML » — `scripts/html-report.mjs`) | Utilitaire nommé | — | mise en page soignée d'un rapport déjà produit (KPI, EL-PROFESSOR, THE-SCREENER, simulations, THE-FINAL-JUDGE...) — jamais le contenu métier lui-même. Importé directement par ~10 scripts (cassandra-rh, check-tasks-details, circle-tasks, el-professor, kpi-report, le-coordinateur, le-regisseur, the-final-judge, the-screener-capture) — jamais un import de Doc-Report, qui reste un PAIR au même statut, pas un supérieur | gratuit | importé et appelé par les autres outils au moment de produire une copie de présentation — jamais un outil qu'on invoque seul |
| check-tasks-details | Agent | 🎖️ | état des lieux des tâches à la demande (zoom en cours/élargi/projet entier × forme liste/arborescence), rapport HTML, lecture seule de `docs/suivi/`, vérification croisée automatique (régression/stagnation) contre son propre historique | gratuit | sur demande explicite (moi ou l'utilisateur), gabarit de questions dédié (cf. `docs/referentiel/check-tasks-details.md`) |
| CHARTER-SPY (surnom, anciennement CLAUDE.MD.SPY — extension de SMART-CONSO-TOKEN) | Utilitaire nommé | — | classe chaque Article/règle de CLAUDE.md ET de `docs/regles-de-travail.md` par sensibilité/importance, détecte les redondances possibles entre règles — périmètre élargi le 2026-09-21 (demande explicite de l'utilisateur, en même temps que le plan d'action route.ts/check-house.mjs/regles-de-travail.md) | gratuit | sur demande, avant/pendant une passe d'allègement de l'un ou l'autre document |
| Compteur d'utilisation des outils (`scripts/tool-usage.mjs`) | Utilitaire nommé | — | journal permanent des sollicitations réelles d'un outil (origine, taux de trouvaille) — nourrit Doc-Report et CASSANDRA-RH | gratuit | `recordCliUsage()` câblé directement dans le `main()`/point d'entrée de chaque outil réel (2026-09-21, correctif d'un écart réel : le compteur affichait zéro partout un soir malgré de vrais lancements) sous l'origine honnête "cli_direct" ; l'agent peut aussi enregistrer lui-même une sollicitation "spontane"/"demande" quand il connaît son propre motif, un jugement qu'aucun script ne peut porter sur lui-même |
| Doc-Report (`scripts/doc-report.mjs`) | Utilitaire nommé | — | index global des registres du réseau d'outils, gardien (jamais décideur) de la décision HTML/texte déjà actée par registre, croisé avec l'âge du dernier rapport et le compteur d'usage ci-dessus ; inventorie aussi les journaux locaux jamais committés (fraîcheur par mtime, cross-check `.gitignore`) | gratuit | sur demande, ou proposé périodiquement via CIRCLE-TASKS |
| THE-KING | Agent | 🎖️ | rappelle de consulter `docs/philosophie-et-politique.md` avant une décision à haut niveau (6 catégories), fraîcheur du document, digest de son évolution, tension possible entre deux principes | gratuit | avant une décision touchant l'une des 6 catégories (moi, l'utilisateur, ou un autre outil) |
| INES-official | Agent | 🎖️ | aplatit le dépôt en une édition consolidée et annotée (code seul ou code + docs), table des matières, datage/versionnage — jamais une réécriture réelle du code | gratuit | proposé périodiquement via CIRCLE-TASKS, ou sur demande explicite |
| memory-audit (anciennement "MEMENTO", nom d'ensemble retiré le 2026-09-21) | Agent | 🎖️ | seul outil ciblant en SUJET un Personnage (Lia/Noé) tout en restant un vrai Membre de l'équipe, catégorie "audit de simulation" aux côtés d'EL-PROFESSOR : cohérence mécanique de la mémoire persistée (ordre chronologique, remise à zéro suspecte, régression de gravité). Son voisin "memento weight" (Moteur du jeu, `lib/memento-weight.ts` + `scripts/memento-weight.mjs`, jamais un Membre de l'équipe) mesure séparément le poids réel du contexte envoyé à Gemini par tour (observation pure, jamais un changement de prompt) | gratuit — mécanique, jamais un second appel Gemini | sur demande explicite après une simulation ; hors CIRCLE-TASKS (exclusion documentée, cette vérification n'a de sens que sur une partie réelle) |
| find-deep-booster (`scripts/route-booster.mjs`, nom de fichier technique inchangé) | Membre certifié (classique) | 🎖️ | points de coupe candidats + indice de risque lexical pour découper une fonction géante (conçu pour `app/api/lia/route.ts`, 24 candidats réels détectés) — jamais une réécriture automatique, guide une extraction manuelle testée à chaque étape | gratuit | à la demande, avant/pendant un chantier de découpage de fichier |
| find-brain (`scripts/find-brain.mjs`) | Utilitaire nommé | — | cerveau unifié : recommande find-booster et/ou find-deep-booster pour un fichier donné (jamais un choix exclusif), réutilise leurs fonctions telles quelles sans rien recalculer | gratuit | à la demande (`node scripts/find-brain.mjs <fichier>`) et automatiquement à chaque commit (rappel post-commit) |
| tool-brain (`scripts/tool-brain.mjs`) | Membre certifié (classique) | 🎖️ | cerveau élargi des rappels d'outils : généralise find-brain à TOUT le catalogue PRESTATIONS de LE-COORDINATEUR (description de tâche et/ou fichier ciblé) ; rappel post-commit centralisé (find-booster + find-deep-booster + menu PRESTATIONS en un seul bloc) ; rapport KPI (outils jamais sollicités, auto-diagnostic borné à son propre périmètre) | gratuit | à la demande (`node scripts/tool-brain.mjs "<tâche>" [--file <chemin>]` / `rapport`), automatiquement à chaque commit (rappel), et à chaque Ronde CIRCLE-TASKS (rapport) |
| find-booster (`scripts/find-booster.mjs`, anciennement "route-find-booster") | Agent | 🎖️ | index par concept de 4 motifs réels (fonctions nommées, blocs anonymes commentés, entrées de tableau titrées, titres Markdown) — sert route.ts, check-house.mjs, lib/reference.ts et regles-de-travail.md, vérifié live sur les 4 ; `recommendFindBooster()` détecte le poids réel d'un fichier (réutilise SMART-CONSO-TOKEN, jamais le nombre de lignes seul) | gratuit | à la demande, sur (presque) tout fichier du dépôt — promu Membre de l'équipe complet le 2026-09-21 après usage réel concluant, cf. `docs/referentiel/find-booster.md` |
| CLONE-HUNTER (`scripts/clone-hunter.mjs`) | Agent | 🎖️ | détecte des blocs de code dupliqués — v1 littérale (lignes identiques après normalisation d'espaces) ET v2 (blocs structurellement identiques sous renommage bijectif cohérent d'identifiants) — dans lib/scripts/app/components (hors components/ui, exclu — kit shadcn/Radix vendu tel quel, duplication assumée par design) ; vérifié live (13 trouvailles réelles au total) | gratuit, <1s sur tout le dépôt | **5e Gardien sacré du code depuis le 2026-09-22** (Article 20 — délivre un vrai scan de qualité ET tourne à chaque commit) : câblé dans le crochet post-commit réel, retiré de CIRCLE-TASKS (doublon dès qu'automatique à chaque commit), agrégé dans HYPER-SCAN-CHECKPOINT, cf. `docs/referentiel/clone-hunter.md` et `docs/referentiel/organisation-agence.md` §3 |
| objectifs-vs-resultats (surnom « R/O-Guardian », 2026-09-21 — nom technique gardé comme nom PRINCIPAL de la cellule à dessein : slugifyAgentName() dérive le slug du premier mot avant toute parenthèse, cf. note ci-dessous ; `scripts/objectifs-vs-resultats.mjs` inchangé) | Agent | 🎖️ | registre hand-maintained d'objectifs chiffrés par entité/période (`docs/objectifs-vs-resultats/registre.md`), calcule le résultat réel via `.tool-usage-history.json` (jamais un second calcul), statut atteint/en dessous/dépassé/pas de données — jamais un sous-agent de CASSANDRA-RH ni une extension du tableau de bord/KPI, cf. `docs/objectifs-vs-resultats-blueprint.md` | gratuit — mécanique, relit un historique déjà écrit | à la demande (`node scripts/objectifs-vs-resultats.mjs rapport`) |
| CASSANDRA-RH (`scripts/cassandra-rh.mjs`) | Agent | 🎖️ | l'Agent Cadre RH de l'Agence Codex — NOTE l'équipe (constat chiffré par catégorie, jamais un seuil auto-jugé), SUPERVISE le badge (lit `checkAgentOnboarding()`, jamais ne le recalcule), LIT le KPI (`kpi-historique.csv`, jamais un second calcul), signale les outils à retirer/refondre (réutilise `tool-usage.mjs`/`clean-dirty-old.mjs`), squelette de recrutement en 3 étapes (sans vraie recherche web à ce stade) — jamais un jugement automatique, toujours l'utilisateur qui décide. Personnage fixe (même garde-fou anti-dérive que THE-FINAL-JUDGE), cf. `docs/cassandra-rh-conception.md` pour l'historique complet des décisions de calibrage | gratuit — mécanique, relit ce que le reste du réseau d'outils sait déjà, jamais un second calcul ni un appel API | signal léger à chaque Ronde CIRCLE-TASKS (`node scripts/cassandra-rh.mjs`) + bilan complet HTML sur demande (`node scripts/cassandra-rh.mjs rapport`) |
| ecotoken (`scripts/ecotoken.mjs`) | Agent | 🎖️ | réduit le coût PERMANENT en tokens des documents que l'agent recharge (la charte en tête, ~75 % du coût réel d'une session) : mesure le RENDEMENT d'une section (citations croisées ÷ lignes occupées), RÉDIGE le texte de remplacement exact plutôt que de seulement signaler, détecte les passages décrivant une procédure déjà mécanisée (gradés bloquant/consultatif — un contrôle qui bloque au commit n'a pas besoin d'être raconté), et pose un budget anti-regrossissement par document. Quatre portées, vocabulaire partagé avec THE-FINAL-JUDGE/SMART-CONSO-TOKEN, jamais un cinquième inventé : `global` (tout le paysage surveillé) / `partiel` (un dossier réel) / `zoome` (un fichier) / `focus` (une section). Ne coupe JAMAIS seul (garde-fou de la charte : en cas de doute, ne pas couper) | gratuit | quatre déclencheurs, chacun vérifié mécaniquement par `auditTriggers()` plutôt que promis en commentaire : post-commit (seulement si un document budgété a bougé — sa propre médecine de réveil conditionnel), Ronde CIRCLE-TASKS (périodique, portée globale), passage réseau LE-COORDINATEUR (santé du poids), et **sur demande** — `node scripts/ecotoken.mjs scan <portée> [cible]` pour un plan chiffré avant d'alléger, `declencheurs` pour l'audit de son propre câblage, `cout` pour le coût réel par session, `plan` pour le texte de remplacement |

Cette table remplace toute énumération informelle éparpillée dans la conversation : à jour à
chaque nouvel outil créé (même discipline que la liste des documents de référence, Article 13).
**Écart trouvé et corrigé le 2026-09-20** : EL-PROFESSOR, THE-SCREENER et CLEAN-DIRTY-OLD manquaient
de cette table depuis leur création, exactement le genre de dérive doc/doc que l'Article 13 interdit
— trouvé en ajoutant THE-FINAL-JUDGE, jamais signalé avant.

### La consultation n'est jamais à sens unique

Avant cette session, le modèle implicite était : l'agent appelle un outil, l'outil répond un
verdict, fin de l'échange. Ce n'est pas assez pour un outil qui doit vraiment aider à travailler.
**Chaque outil de ce paysage, quand sa propre confiance est insuffisante pour trancher seul, doit
pouvoir interroger l'agent en retour plutôt que deviner silencieusement** — et l'agent doit
transmettre cette interrogation à l'utilisateur quand elle le concerne, jamais l'absorber en
silence. Ce n'est pas une politesse : un outil qui tranche à l'aveugle sur une hypothèse fragile
produit un résultat moins fiable qu'un outil qui sait dire "je ne suis pas sûr, précise-moi X".
Exemples déjà en place, chacun une instance du même principe :

- **Smart Conso API** ne se contente jamais d'un oui/non : elle guide, conseille, coache l'agent
  sur le rythme de sa consommation (cf. Article 22 de `CLAUDE.md`).
- **CHECK-LEVEL-TARGET** demande confirmation quand la marge entre les deux niveaux les plus
  probables est étroite, plutôt que de trancher un cas ambigu tout seul.
- **ALWAYS-NEW-CODE** interroge systématiquement l'agent sur l'étendue du
  travail et le temps disponible quand la taille d'une zone est difficile à estimer, et
  redemande confirmation avant d'appliquer quoi que ce soit — jamais une simple case à cocher.
- **ARGUS/HARMONIA** restent des scripts mécaniques qui ne peuvent pas littéralement poser une
  question en direct — leur équivalent de ce principe est que leurs verdicts "probable"/"à
  surveiller" sont une invitation implicite à vérifier avant d'agir, jamais un verdict à traiter
  comme acquis (leçon apprise à ses dépens le 2026-09-19 avec `trottoirGranted`, faussement
  qualifié de bug avant d'avoir vérifié `docs/referentiel/parametres.md` — cf. `docs/argus/index.md`
  pour le détail complet de cette leçon).

**Corollaire pour tout nouvel outil de ce type à construire à l'avenir** : prévoir dès la
conception un mécanisme explicite de retour vers l'agent en cas de doute réel fait partie du
cahier des charges de départ, au même titre qu'un blueprint séparé ou qu'un registre local —
jamais un ajout après coup "si besoin". Les questions de calibrage posées à l'utilisateur avant de
construire un nouvel outil (Article 16) doivent donc systématiquement couvrir ce point : comment
CET outil interroge-t-il l'agent quand il n'est pas sûr ?

### Trois canaux de consultation pour THE-FINAL-JUDGE (et modèle pour tout futur outil-agent)

*(Ajouté le 2026-09-20, à la demande explicite de l'utilisateur au moment de calibrer THE-FINAL-
JUDGE : « el professor et the judge peuvent se connecter pour discuter si besoin [...] imagine
comment les outils peuvent exploiter the final judge [...] je voudrais que the judge puisse etre
consultable par toi, moi, les outils ». Jamais un bus de messages ou un mécanisme technique
nouveau — cohérent avec la sobriété déjà en place pour LE-COORDINATEUR — mais trois façons
distinctes et documentées de le déclencher, pour ne pas laisser un outil coûteux sous-exploité une
fois construit.)*

- **Moi (l'agent) → THE-FINAL-JUDGE.** Je peux proposer de le déclencher quand je fais face à un
  vrai fork de conception (pas un bug, un choix réellement ouvert) où un second avis, réellement
  indépendant du mien, aiderait — jamais de mon initiative seule, toujours en demandant confirmation
  d'abord (même règle que tout déclenchement de cet outil, cf. `docs/referentiel/the-final-judge.md`).
- **L'utilisateur → THE-FINAL-JUDGE.** Une demande directe (« lance the-judge sur X ») déclenche
  l'outil sans détour par une proposition de ma part — l'utilisateur n'a jamais besoin d'attendre que
  je le suggère.
- **Les autres outils du paysage → THE-FINAL-JUDGE**, sur des points précis où un second regard
  vraiment indépendant apporte quelque chose qu'ils ne peuvent pas produire eux-mêmes :
  - **EL-PROFESSOR → THE-FINAL-JUDGE** : quand l'index d'EL-PROFESSOR montre un thème CHRONIQUEMENT
    faible sur plusieurs sessions (ex. Voix distinctes, moyenne 7,8/20 sur les 13 premières
    notations) — EL-PROFESSOR note le SYMPTÔME session par session, jamais la cause structurelle ;
    un passage THE-FINAL-JUDGE peut diagnostiquer si la cause est un défaut de prompt, une
    architecture insuffisante, ou autre chose, et proposer une vraie direction plutôt qu'un énième
    correctif ponctuel. THE-FINAL-JUDGE peut lire l'index d'EL-PROFESSOR comme CONTEXTE (où porter
    l'attention), jamais comme instruction sur le verdict à rendre — sa lecture du texte reste
    toujours la sienne, indépendante. **Portée recommandée (2026-09-20)** : une faiblesse chronique
    isolée à un seul thème appelle d'abord une portée ZOOMÉE sur ce thème (cf.
    `docs/referentiel/the-final-judge.md`) plutôt qu'un audit projet entier — jamais imposé, EL-
    PROFESSOR PROPOSE, l'agent ou l'utilisateur décide toujours du déclenchement réel.
  - **ALWAYS-NEW-CODE → THE-FINAL-JUDGE** : quand une zone de dette d'organisation reste au palier de
    confiance "probable" (jamais "confirmé"), un second avis réellement indépendant sur la MÊME zone
    aide à trancher avant de proposer une restructuration à l'utilisateur. **Portée recommandée
    (2026-09-20)** : même principe qu'EL-PROFESSOR ci-dessus — une portée ZOOMÉE sur la zone
    concernée, jamais un audit projet entier pour trancher un seul palier "probable", et toujours
    proposée, jamais déclenchée d'elle-même.
  - **THE-FINAL-JUDGE → THE-SCREENER** (sens inverse) : pour l'angle visuel, THE-FINAL-JUDGE
    s'appuie sur les rapports déjà archivés de THE-SCREENER (ou en demande un nouveau s'il n'y en a
    pas de récent) plutôt que de former son propre avis graphique en double.
  - **HYPER-SCAN-CHECKPOINT + THE-FINAL-JUDGE, complémentaires, jamais fusionnés** : la double
    perspective d'HYPER-SCAN-CHECKPOINT vérifie la fidélité à ce qui a déjà été décidé (jamais de
    nouvelle direction) ; THE-FINAL-JUDGE propose de nouvelles directions (jamais une vérification de
    fidélité). Un passage exceptionnel complet peut mobiliser les deux, chacun sur son propre mandat,
    jamais l'un à la place de l'autre.
  - **CLEAN-DIRTY-OLD → THE-FINAL-JUDGE** (escalade optionnelle, jamais systématique) : quand ses
    trois questions déléguées (ARGUS/HARMONIA/ALWAYS-NEW-CODE) ne tranchent pas clairement une zone
    stagnante proche d'un nœud sensible, un avis THE-FINAL-JUDGE peut servir de dernier recours —
    jamais un lien obligatoire, seulement une option de plus quand les trois premières restent
    ambiguës.
- **Le retour d'incertitude vers l'agent (corollaire déjà exigé ci-dessus pour tout nouvel outil)**
  prend une forme naturelle pour THE-FINAL-JUDGE, qui est lui-même un agent de raisonnement plutôt
  qu'un script : il signale directement, dans son propre rapport, les points où le contexte du projet
  lui manque pour trancher — jamais une question posée en direct (il ne tourne pas en session
  interactive), mais un signalement explicite intégré au livrable.
- **Rentabilité de l'outil : jamais un one-shot.** Sa valeur ne vient pas d'un seul audit isolé mais
  de la RÉPÉTITION dans le temps (comparabilité via son registre) et de la MULTIPLICITÉ des points
  d'entrée ci-dessus — un outil coûteux à chaque déclenchement individuel qui ne serait sollicité
  qu'une fois n'aurait jamais amorti son intérêt. C'est pour ça que les trois canaux ci-dessus
  existent dès sa conception, pas ajoutés après coup.

### Trois canaux de consultation pour THE-DEEP-READER, même modèle

*(Ajouté le 2026-09-20, écart trouvé et corrigé le jour même : THE-DEEP-READER avait été construit
— registre, script mécanique, KPI, tests — sans jamais appliquer ce modèle explicitement prévu
« pour tout futur outil-agent » ci-dessus. Absent aussi de la table des outils et du menu
LE-COORDINATEUR, ce qui a désactivé le garde-fou censé le détecter : `findToolsMissingFromMenu()`
compare le menu à la table, mais un outil jamais entré dans la table n'a rien à comparer. Une
récidive du principe déjà écrit plus bas — « un outil n'est jamais fini tant que ses points
d'intégration décidés ne sont pas câblés et testés ».)*

- **Moi (l'agent) → THE-DEEP-READER.** Je peux proposer de le déclencher quand la procédure légère
  (`docs/systeme-de-suivi.md`) ne suffit plus à me rassurer sur la complétude du suivi — jamais de ma
  propre initiative seule, toujours en demandant confirmation d'abord.
- **L'utilisateur → THE-DEEP-READER.** Une demande directe déclenche l'outil sans détour par une
  proposition de ma part.
- **`check-suivi-fidelity.mjs` → THE-DEEP-READER** (calibré explicitement le 2026-09-20) : ses
  garde-fous mécaniques déjà existants (`findUnverifiedClosures`, `findOpenTasks`,
  `findClaimedFilesMissing`, `findTaskNumberIssues`, `findCommitsMissingSuiviUpdate`) tournent à
  chaque commit — quand plusieurs d'entre eux trouvent un problème de façon RÉPÉTÉE sur plusieurs
  commits consécutifs (jamais un signalement isolé, qui reste du bruit normal), c'est le signal
  qu'une relecture lourde et indépendante pourrait valoir le coût réel — même logique que la
  « faiblesse chronique » d'EL-PROFESSOR pour THE-FINAL-JUDGE. Toujours proposé, jamais déclenché
  tout seul.
- **Contrairement à THE-FINAL-JUDGE, un seul destinataire pour l'instant** : THE-DEEP-READER ne sert
  qu'à LE-PLANIFICATEUR, jamais sollicité par EL-PROFESSOR, ALWAYS-NEW-CODE ou les autres — son
  périmètre (conversation vs `docs/suivi/`) ne recoupe aucun de leurs domaines.

### Consultation programmatique outil→LE-COORDINATEUR (pas seulement une lecture humaine)

*(Ajouté le 2026-09-20, demande explicite de l'utilisateur, en construisant check-tasks-details :
« check-tasks-details travaille en étroite collaboration avec le coordinateur : pour chaque tâche à
accomplir, il consulte le coordinateur qui lui dit quelles prestations permettent de remplir la
tâche [...] conceptualise le système qui sous-tend tous ces échanges ». Jusqu'ici, PRESTATIONS
n'était qu'un menu pour un lecteur humain/agent — ce complément l'ouvre aussi aux autres SCRIPTS du
paysage, sans jamais changer sa nature : toujours une donnée statique, jamais une intelligence.)*

`le-coordinateur.mjs` exporte `suggestPrestationsForTask(libelléDeTâche)` — un chevauchement de
mots-clés (seuil ≥2, pour éviter le bruit d'un mot trop général) entre le texte d'une tâche et le
champ `demande` de chaque ligne PRESTATIONS. N'importe quel outil du paysage peut l'importer et
l'appeler pour se demander, à propos de N'IMPORTE QUELLE sous-tâche qu'il traite : « une prestation
existante pourrait-elle m'aider ici ? » — un signal de « correspondance possible », toujours à
vérifier par une vraie lecture, jamais une certitude (même honnêteté de conception qu'ARGUS/
ALWAYS-NEW-CODE : ce garde-fou ne peut jamais inventer une combinaison, seulement rapprocher des
mots).

**Premier usage concret : check-tasks-details.** Pour chaque tâche encore ouverte dans son rapport,
il appelle cette fonction et, quand une correspondance existe, l'affiche directement dans le
rapport HTML (« #142 « corriger la répétition... » → HYPER-SCAN-CHECKPOINT »). Ça boucle
directement dans le SMART-CONSO-TOKEN : reconnaître tôt qu'un outil déjà gratuit répond à une tâche
évite de raisonner à la main un problème déjà résolu ailleurs dans le paysage, donc moins de tokens
dépensés à réinventer.

**Portée volontairement ouverte** : contrairement au canal unique de THE-DEEP-READER ci-dessus, rien
n'empêche un futur outil de consulter aussi `suggestPrestationsForTask()` — c'est exactement le but
de l'exposer comme fonction pure plutôt que comme mécanisme propre à un seul appelant.

### Moi (l'agent) → check-tasks-details, systématiquement avant toute lecture manuelle de l'état des tâches

*(Ajouté le 2026-09-20, demande explicite de l'utilisateur : « quand toi tu consultes les tâches à
faire, il faut toujours que tu consultes check-tasks-details : une garantie de plus que tu vas
utiliser les outils pour les tâches concernées. »)*

Dès que je dois savoir où en sont les tâches — pour décider quoi faire ensuite, pour répondre à une
question de l'utilisateur sur l'avancement, ou avant de proposer une priorité — je lance
`node scripts/check-tasks-details.mjs <zoom> <forme>` (zoom adapté au besoin réel du moment) plutôt
que de relire `docs/suivi/` à l'œil ou de me fier seulement à `TaskCreate`/`TaskUpdate`. Même
raison d'être que la règle « Recevoir une sortie d'outil n'est pas la même chose que la traiter »
ci-dessous : un outil gratuit déjà construit pour exactement ce besoin ne doit jamais rester ignoré
au profit d'une lecture manuelle refaite à la main — chaque sollicitation réelle amortit le coût de
sa construction (cf. le complément du même jour sur cette même règle) et doit être annoncée
explicitement à l'utilisateur.

**Question type qui déclenche systématiquement ce protocole** *(ajouté le 2026-09-20, demande
explicite de l'utilisateur : « lorsque je pose une question du type : on en est ou dans le projet ?
ou : peux-tu me faire un etat des taches ? [...] tu me transmets toujours le rapport de check-tasks
[...] dans un fichier séparé, tout en synthetisant une reponse dans la conversation. ta reponse doit
toujours etre éclairée par le diagnostic de check-tasks. par la lecture du fichier en entier avant
de me repondre »)*. Toute question formulée comme « où en est-on dans le projet ? », « peux-tu me
faire un état des tâches ? » ou une reformulation équivalente déclenche, sans qu'il faille le
redemander à chaque fois :
1. Régénérer le rapport (zoom adapté à la question réelle, jamais un rapport générique recyclé) et
   le livrer en fichier séparé (`SendUserFile`), jamais collé en clair — même discipline que les
   transcriptions de simulation (Article 18).
2. **Lire ce fichier en entier avant de répondre** — jamais résumer de mémoire ce que je crois avoir
   vu dans le terminal pendant sa génération. La synthèse donnée dans la conversation doit être
   réellement éclairée par cette lecture complète, pas une reformulation générique de ce que je
   pensais déjà savoir de l'avancement du projet.
3. Donner, dans la conversation, une synthèse courte qui reflète fidèlement ce que le rapport dit
   vraiment (statuts réels, signaux de régression/stagnation, ordre recommandé s'il y en a un) —
   jamais une réponse qui aurait été la même sans avoir généré ni lu le rapport.

Cette exigence rejoint directement la leçon déjà tirée une fois cette session sur un vrai rapport
(deux bugs réels trouvés uniquement parce que l'utilisateur a demandé une lecture effective plutôt
qu'un résumé de confiance) — elle la rend systématique plutôt que de compter sur un rappel ponctuel
à chaque fois.

**Confirmation de lecture avant la fenêtre de questions sur l'ordre des prochaines tâches**
*(ajouté le 2026-09-20, demande explicite de l'utilisateur, dans le même message que le protocole
`recommendNextTasks()` de check-tasks-details : « tu dois me demander si j'ai lu le rapport de
check-tasks. si je valide manuellement que je l'ai lu, tu peux enchainer sur les questions pour
l'ordre des prochaines taches. tant que je n'ai pas validé que j'ai lu, tu ne me poses pas encore
les questions »)*. Une fois le rapport livré ET analysé de mon côté (points 1-3 ci-dessus), avant
d'ouvrir la fenêtre de questions qui propose un ordre pour les prochaines tâches (alimentée par
`recommendNextTasks()`), je demande explicitement à l'utilisateur s'il a lui-même lu le rapport.
Tant qu'il n'a pas confirmé une lecture réelle, je n'ouvre pas cette fenêtre — une confirmation
implicite (« continue », un silence) ne suffit jamais, il faut une validation manuelle explicite.

### Recevoir une sortie d'outil n'est pas la même chose que la traiter

*(Ajouté le 2026-09-20, demande explicite de l'utilisateur juste après avoir trouvé l'oubli
d'intégration de THE-DEEP-READER ci-dessus : « apprends à solliciter les outils quand tu travailles :
fiabilise ce point ». Preuve concrète, trouvée en se relisant : le crochet post-commit affiche « Ça
fait N commits sans Ronde périodique (CIRCLE-TASKS) — envisage de la relancer » à CHAQUE commit de
cette session — jamais traité une seule fois, N ayant grimpé au-delà de 230 sans réaction. Le
symptôme exact que l'utilisateur pointe : un outil parle, l'agent ne donne pas suite.)*

**Règle** : toute sortie d'outil qui contient une recommandation actionnable (pas un simple
statut "ok") doit être explicitement traitée avant la fin du tour en cours — soit en agissant
dessus, soit en la reportant avec une raison explicite écrite quelque part (réponse à
l'utilisateur, ligne `docs/suivi/`) — jamais silencieusement laissée défiler dans une sortie de
commande sans qu'aucune décision n'en découle. Une recommandation ignorée à répétition (comme le
compteur CIRCLE-TASKS ci-dessus) est un signal que la règle elle-même n'est pas appliquée, pas que
la recommandation a cessé d'être pertinente.

**Différence avec les règles voisines déjà en place** : "une DÉCISION n'est jamais une EXÉCUTION"
(`docs/systeme-de-suivi.md`) protège contre une décision de calibrage jamais suivie d'un vrai
travail ; celle-ci protège contre un cran encore plus tôt dans la chaîne — une information
mécanique déjà produite gratuitement par un outil, jamais même lue avec l'intention d'agir.

**Complément ajouté le 2026-09-20, demande explicite de l'utilisateur** : « tu dois utiliser les
outils au max, afin de rentabiliser leur coût, donner du sens à leur existence. et aussi me dire
quand tu utilises un outil, car ça donne une bonne nouvelle pour le projet et pour la conso de
token. » Deux volets, jamais l'un sans l'autre :
- **Solliciter réellement** un outil du paysage dès qu'une situation de travail correspond à une
  ligne du menu PRESTATIONS (`le-coordinateur.mjs`) plutôt que de raisonner à la main sur un
  problème qu'un outil gratuit résout déjà — rentabiliser le coût de construction de chaque outil
  en le faisant vraiment travailler, pas seulement en le laissant exister dans le paysage.
- **Le dire explicitement** dans la réponse à l'utilisateur au moment où l'outil est sollicité
  (« j'ai fait tourner HARMONIA », « ARGUS confirme... ») — jamais un simple résultat inséré sans
  attribution. Ce n'est pas une formalité : chaque mention visible est un signal concret que le
  réseau d'outils est réellement rentabilisé (moins de raisonnement à la main refait de zéro, donc
  moins de tokens), au même titre que le repère 📜✅ pour la charte (Article 20 du jeu).

**Renforcement ajouté le 2026-09-21, demande explicite de l'utilisateur** : « quand je te fais une
demande qui peut faire intervenir un outil, fais intervenir l'outil [...] mentionne le
systematiquement [le coût gratuit] ». Précision par rapport au complément ci-dessus : la mention ne
se limite jamais au nom de l'outil sollicité, elle nomme aussi explicitement son coût réel (« gratuit
— 0 appel API » quand c'est le cas, jamais sous-entendu) — pour que l'utilisateur voie concrètement,
à chaque fois, qu'un raisonnement à la main a été évité SANS AUCUN coût API/tokens supplémentaire.

### Aucun de ces outils n'est autonome — l'agent reste toujours celui qui finalise

*(Précisé le 2026-09-19, en réponse à une question directe de l'utilisateur.)* Ce paysage
d'outils réduit le travail mécanique et force des vérifications qu'on pourrait oublier sur le
moment — il ne remplace jamais le jugement de l'agent. Aucun outil ci-dessus ne lit la charte à sa
place, ne décide à sa place, ni n'exécute un changement réel de sa propre initiative : ARGUS/
HARMONIA remontent des candidats "probable"/"à surveiller", jamais des faits établis, à vérifier
avant d'agir (cf. leçon `trottoirGranted` ci-dessus) ; HYPER-SCAN-CHECKPOINT dit lui-même que sa
checklist qualitative est "jamais mécanisable" ; ALWAYS-NEW-CODE ne prépare que la zone et les
indices, le vrai travail d'imagination "page blanche" restant un raisonnement que seul l'agent
appelant peut faire. Un outil qui semblerait un jour trancher tout seul une question de fond serait
un signal d'alerte à traiter comme une dérive, pas un progrès.

### Un outil n'est jamais « fini » tant que ses points d'intégration décidés ne sont pas câblés et testés

*(Ajoutée le 2026-09-19, à la demande explicite de l'utilisateur, en plein milieu de la
construction d'AXA-CHECK : le calibrage avait déjà tranché plusieurs points d'intégration
(rejoindre Article 20 comme "toujours déployé", rejoindre la boîte à outils d'HYPER-SCAN-
CHECKPOINT, nourrir la famille "robustesse du code" de `kpi-report.mjs`) avant que ces trois
raccordements soient réellement câblés — un risque concret de déclarer l'outil "fini" en ne
gardant que le fichier `axa-check.mjs` lui-même, alors que sa valeur promise dépendait justement
de ces raccordements.)*

Un outil de ce paysage (ou toute nouvelle fonctionnalité qui promet explicitement de se brancher sur
autre chose) n'est considéré **terminé** que lorsque TOUS les points d'intégration déjà décidés
avec l'utilisateur — pendant le calibrage ou en cours de route — sont réellement câblés dans le
code ET couverts par un test, pas seulement listés comme une intention ou un "à faire" dans une
réponse précédente. Une intégration décidée mais pas encore câblée reste un chantier ouvert, à
nommer explicitement comme tel (jamais glissée sous silence dans un « c'est fait »). Concrètement,
avant d'annoncer un outil terminé : relire la liste des décisions de calibrage prises pour lui,
vérifier une par une qu'elles ont un point de code réel qui leur correspond, et qu'un test
(`check-house.mjs` ou équivalent) échouerait si ce câblage disparaissait — sinon, ce n'est pas fini,
c'est en cours.

**Un nouvel Agent n'est intégré que lorsque DEUX volets sont faits, jamais un seul (2026-09-20,
demande explicite de l'utilisateur : « je veux que lorsqu'un nouvel employé est identifié, cassandra
le consigne et le coordinateur fait son accueil opérationnel au sein de l'équipe »).** Volet
administratif : CASSANDRA-RH consigne le nouvel Agent dans la liste de l'équipe (exigence déjà
actée pour elle, cf. tâche de calibrage dédiée — **volet en attente, CASSANDRA-RH n'est pas encore
construite**, jamais présenté comme fait tant que ce n'est pas vrai). Volet opérationnel :
`checkAgentOnboarding()` (LE-COORDINATEUR, ci-dessus) rapporte `complet: true`. Jamais un troisième
script pour orchestrer les deux (anti-duplication) — une règle explicite suffit, appliquée par
l'agent qui pilote juste après avoir fini de construire un nouvel Agent. **Troisième vérification
obligatoire dès que le nouvel outil touche de près ou de loin Lia/Noé** (cf. règle dédiée
« Personnages hors de l'équipe » ci-dessous) : confirmer qu'aucun mécanisme d'équipe (badge,
PRESTATIONS évaluant un personnage, registre) ne leur est appliqué, et réciproquement.

### Personnages (Lia, Noé) : hors de l'équipe, jamais une catégorie de l'organigramme

*(Fixée le 2026-09-21, après un motif récurrent identifié explicitement par l'utilisateur — trois
quasi-recouvrements en une seule soirée : le badge de MEMENTO conditionné par erreur au verdict d'un
outil pensé pour Lia/Noé (docs/suivi #245), la toute première note de conception de CASSANDRA-RH
(2026-09-20T09:40Z) qui prévoyait de « noter les mascottes Lia/Noé » comme des membres, et un doute
sur le menu PRESTATIONS de MEMENTO. La correction de #245 avait ajouté « Personnages » comme une 5e
catégorie DE L'ORGANIGRAMME lui-même, à côté de Direction/Équipe noyau/Membre de l'équipe/VIP —
gardant Lia/Noé DANS le même tableau que l'équipe, ce qui permettait à la même confusion de revenir.
Root-cause plus profonde, exactement le manquement que la règle voisine ci-dessus décrit pour un
autre cas : cette règle n'a jamais vécu ailleurs qu'en narration éparse (docs/suivi) et un
commentaire de code (`scripts/lib-shell.mjs`) — jamais comme une règle canonique d'un document de
travail vivant, donc invisible au moment d'agir malgré son existence théorique.)*

**Règle durable, non négociable** : Lia et Noé n'ont AUCUNE existence dans l'organigramme de travail
(Direction/Équipe noyau/Membre de l'équipe/VIP). Ce sont des personnages de la simulation, gouvernés
exclusivement par la charte de contenu (CLAUDE.md), jamais une case de plus à côté des autres.
`PERSONNAGES`/`assertNotAPersonnage()` (`scripts/lib-shell.mjs`) est une liste d'EXCLUSION au bord du
domaine équipe, jamais une catégorie interne à ce domaine.

**Conséquences concrètes, à vérifier explicitement chaque fois qu'elles s'appliquent :**
- Aucun mécanisme pensé pour l'équipe (badge/certification `checkAgentOnboarding()`, blueprint,
  registre, couverture AXA-CHECK, entrée PRESTATIONS qui ÉVALUERAIT un personnage) ne s'applique
  jamais à Lia/Noé eux-mêmes.
- Réciproquement, aucun mécanisme pensé pour la mémoire/cohérence narrative des personnages
  (MEMENTO) ne s'applique jamais à un script.
- Un outil DE l'équipe (un script comme MEMENTO) peut légitimement avoir pour SUJET la mémoire des
  personnages sans que cela les fasse rejoindre l'équipe pour autant — exactement comme
  ALWAYS-NEW-CODE a pour sujet une zone de code sans que le code lui-même devienne « un membre ».
  Le critère d'éligibilité de PRESTATIONS a toujours été « déclenche un outil membre de l'équipe »,
  jamais « cible un membre » — vérifié explicitement le 2026-09-21 (Pack Mémoire confirmé légitime
  sur cette base, aucune entrée existante ne cible non plus littéralement « un membre »).
- **Correction explicite de la note fondatrice de CASSANDRA-RH (docs/suivi 2026-09-20T09:40Z)** :
  la phrase « noter TOUS les membres de l'équipe [...] les mascottes Lia/Noé » est corrigée dès
  aujourd'hui, avant même la construction réelle de CASSANDRA-RH (round de calibrage, tâche #134) —
  elle pourra un jour AGRÉGER les verdicts narratifs déjà produits ailleurs (MEMENTO, EL-PROFESSOR,
  check-spirit.mjs) sur Lia/Noé, jamais les noter/scorer comme des membres de l'équipe.

**Périmètre de recrutement de CASSANDRA-RH, précisé le 2026-09-21 (demande explicite de
l'utilisateur, avant même sa construction réelle) : pas seulement des scripts.** Pendant le
« recrutement » (la détection d'un nouvel Agent à consigner), CASSANDRA-RH devra chercher non
seulement des scripts (`scripts/*.mjs`) et de futures skills, mais aussi des **blueprints**
(`docs/*-blueprint.md`) — un blueprint sans script associé reste un candidat légitime à consigner
(ex. un patron générique documenté avant toute implémentation), au même titre qu'un script sans
blueprint séparé (ex. route-booster). Note de conception, jamais encore implémentée : à reprendre
lors du round de calibrage de la tâche #134.

### Moteur du jeu vs Outillage de travail : deux natures de code, jamais confondues sous un même nom

*(Fixée le 2026-09-21, tout de suite après la règle ci-dessus, sur une question directe de
l'utilisateur : « MEMENTO n'est pas un membre de l'équipe je pense ? [...] MEMENTO est similaire à
ces scripts [regles-du-temps.md, regles-de-travail.md], on aurait pu l'appeler regles de la
memoire non ? [...] il faut peut être créer 2 catégories de scripts ? [...] à toi de choisir la
meilleure formule ». Root-cause trouvée en répondant : "MEMENTO" désignait sous un même nom deux
artefacts de nature différente — `scripts/memento.mjs` (rôle a, une vraie vérification mécanique,
structurellement un Membre de l'équipe comme `check-argus.mjs`) et `lib/memento-weight.ts` (rôle b,
un point d'observation câblé dans `lib/lia.ts`) — le second n'a jamais été un outil de travail : il
vit dans le MOTEUR DU JEU lui-même (terme déjà employé dans CLAUDE.md, section « Stack technique » :
« le moteur applicatif vit dans lib/ »), exactement la même catégorie que `lib/gemini-keys.ts` — du
code de PRODUIT, jamais un travailleur qu'on badge ou qu'on liste au catalogue.)*

**Règle durable, à appliquer à tout futur outil qui, comme MEMENTO, ajoute un point d'observation
DANS le moteur du jeu plutôt que de rester un simple script externe** — deux catégories de code,
orthogonales à la catégorie « Personnages » ci-dessus (qui n'est pas du code, mais du contenu
narratif) :
- **Outillage de travail** (`scripts/*.mjs`) = **Membre de l'équipe** — badge, blueprint,
  instanciation, registre, entrée PRESTATIONS : la catégorie déjà établie, inchangée.
- **Moteur du jeu** (`lib/*.ts`, `app/*`, `components/*`) = **jamais un membre, jamais un badge,
  jamais une entrée PRESTATIONS** — c'est le PRODUIT que l'équipe construit et vérifie (par
  `tsc`/`check-house.mjs`/AXA-CHECK comme n'importe quel autre code), pas un travailleur de plus.

**Conséquence directe, ce qui devint MEMENTO** : deux facettes de nature différente —
`scripts/memento.mjs` (Outillage, Membre, seul éligible à PRESTATIONS/Doc-Report/un futur badge) et
`lib/memento-weight.ts` (Moteur du jeu, jamais éligible à rien de tout ça, au même titre que le
reste de `lib/`). **Précision du même soir, plus tard dans la soirée** : l'ombrelle "MEMENTO" qui
regroupait les deux facettes sous un même nom a elle-même été retirée à la demande explicite de
l'utilisateur, une fois son rôle mieux compris (« memento audite la capacité des persos sur la
memoire [...] donc oui, il fait bien partie de l'equipe aux cotés de el professor ») — la facette
Outillage porte désormais le surnom **memory-audit** (fichier technique inchangé,
`scripts/memento.mjs`), confirmée Membre de l'équipe dans la catégorie "audit de simulation" aux
côtés d'EL-PROFESSOR ; la facette Moteur du jeu garde son nom d'origine **memento weight**, séparée
le même soir dans son propre fichier outillage (`scripts/memento-weight.mjs`, distinct de
`scripts/memento.mjs`) pour ne plus mélanger les deux rôles dans un seul script.
`docs/referentiel/memory-audit.md`/`memento-weight.md` (qui remplacent l'ancien
`docs/referentiel/memento.md`) nomment cette distinction explicitement.

**Garde-fou mécanique ajouté** (`scripts/doc-report.mjs::findEngineCodeInRegistries()`) : vérifie
que le champ `scriptPath` de chaque entrée `REGISTRIES` (le seul des trois catalogues — PRESTATIONS,
REGISTRIES, CIRCLE_ITEMS — à porter un vrai chemin de fichier ; les deux autres ne référencent des
outils que par leur NOM, jamais un chemin, donc rien à vérifier mécaniquement de ce côté) ne pointe
jamais vers un fichier du Moteur du jeu (`lib/`, `app/`, `components/`) — seul `scripts/*.mjs` est un
chemin valide pour un Membre de l'équipe. Vérifié vert contre l'état réel du dépôt au moment de sa
création : zéro violation.

**Registre canonique des outils — `findGardiensMissingFromSource()` (2026-09-21, tâche #290).**
Root cause investiguée à la demande explicite de l'utilisateur : aucune liste unique ne dit
« quels outils DOIVENT être appelés où » — chaque script qui a besoin de « tous les outils »
(HYPER-SCAN-CHECKPOINT, CIRCLE_ITEMS, PRESTATIONS, REGISTRIES) maintient sa propre copie, jamais
vérifiée contre les autres. Exemple réel déjà survenu le même soir : CLONE-HUNTER promu 5e Gardien
sacré du code (`AGENT_CATEGORIES`, `lib-shell.mjs`) mais un temps oublié dans le `sh()` de la
version légère de HYPER-SCAN-CHECKPOINT — corrigé au moment même de sa promotion, mais rien
n'empêchait mécaniquement l'oubli de durer. Plutôt qu'une nouvelle liste à maintenir (Article 10,
anti-duplication) : `findGardiensMissingFromSource()` (`scripts/doc-report.mjs`) réutilise deux
registres déjà canoniques et déjà tenus à la main — `AGENT_CATEGORIES` (qui EST un Gardien) et
`REGISTRIES` (son `scriptPath` réel) — et vérifie que le texte source d'un passage donné (en
pratique, `hyper-scan-checkpoint.mjs`) appelle bien chacun de ces `scriptPath`. Un futur 6e Gardien
oublié y échouerait dès le prochain commit (test câblé dans `check-house.mjs`, vérifié en direct
contre le vrai fichier), au lieu d'être seulement remarqué par une relecture manuelle a posteriori.
Écart connexe trouvé et corrigé en même temps : la `family` de CLONE-HUNTER dans `REGISTRIES`
disait encore « Qualité du code » (valeur d'avant sa promotion), jamais mise à jour au moment où
`AGENT_CATEGORIES` l'a reclassé « Gardien sacré du code » — corrigé pour que les deux tables
s'accordent. **Périmètre assumé, jamais élargi sans nouvelle demande** : ce garde-fou couvre
spécifiquement la classe d'oubli « un Gardien manque à l'appel d'un passage donné » — il ne
remplace ni ne fusionne PRESTATIONS/CIRCLE_ITEMS/REGISTRIES en un unique fichier, un chantier plus
lourd resté hors de portée de cette correction ciblée.

**Précision honnête, en réponse à une question directe de l'utilisateur sur la détection de
doublons de FONCTIONS entre outils (2026-09-20)** : contrairement à ce qu'on pourrait supposer,
rien de mécanique ne vérifie aujourd'hui qu'une nouvelle fonction ne duplique pas une fonction
existante ailleurs dans le paysage — ni ARGUS (absences), ni HARMONIA (contradictions doc/code), ni
CLEAN-DIRTY-OLD (stagnation) ne couvrent ce cas précis. La seule protection réelle aujourd'hui est
la discipline manuelle de l'Article 19/doctrine anti-doublon (consulter
`suggestPrestationsForTask()` et relire le code existant avant de construire), jamais un garde-fou
automatique — à ne pas présenter comme « déjà vérifié en amont » tant qu'aucun outil ne le fait
réellement.

**Fixer une règle quand elle en a besoin, sans attendre qu'on le demande.** *(Même échange,
demande explicite : « n'hésite pas à me dire quand tu sens qu'une règle doit être fixée, pour le
bien du projet ».)* Quand l'agent repère, en travaillant, un vrai point de méthode qui mériterait
d'être figé dans la charte ou dans ce document (pas une simple préférence ponctuelle, mais un
principe qui se reproduira sur d'autres outils/décisions à l'avenir), il le signale explicitement à
l'utilisateur plutôt que d'attendre une demande — cette règle-ci en est elle-même un exemple
d'application immédiate.

### Une règle transversale ne compte que si elle est câblée DANS chaque checklist concrète qu'elle gouverne

*(Ajoutée le 2026-09-19, après un vrai manquement constaté : l'utilisateur a demandé « pense à
consulter smart conso api pour la prochaine fois, fiabilise stp », et « je ne sais pas si le rappel
doit être en relation avec le timing [...] fais en sorte que ce rappel soit clair pour toi » — signe
qu'un rappel programmé n'était pas la bonne réponse à un problème qui n'a rien à voir avec une
horloge.)* Diagnostic réel : l'Article 22 de `CLAUDE.md` (consulter Smart Conso API avant toute
action coûteuse) existait déjà et avait été lu en entier au début de la session — et pourtant
l'agent a lancé une simulation fraîche sans jamais l'exécuter. La cause n'était pas l'oubli d'une
règle inconnue, mais l'absence de lien entre deux endroits de la charte : l'Article 18 (le protocole
concret de simulation, suivi pas à pas) ne citait nulle part l'Article 22, qui vivait dans un article
séparé. Au moment d'exécuter une checklist numérotée précise, une règle transversale qui n'y est pas
directement écrite est invisible dans les faits, même si elle est parfaitement connue en théorie.

**Conséquence pratique, généralisable à toute future règle transversale (coût, sécurité, discrétion,
etc.) :** une règle qui doit s'appliquer à plusieurs actions concrètes ne se contente jamais d'exister
dans SON PROPRE article — elle doit aussi être répétée, en une ligne, DANS chaque checklist ou
procédure existante qu'elle concerne (ex. Article 22 maintenant cité littéralement en étape 0 de
l'Article 18, et dans le paragraphe `check-spirit.mjs`). Une référence croisée ("cf. Article 22") ne
suffit pas si l'action concrète à prendre n'est pas aussi écrite en clair à l'endroit où elle doit se
produire. Ce n'est jamais un problème de mémoire qu'un rappel programmé (horaire, quotidien)
résoudrait — le déclencheur est un TYPE D'ACTION, pas un moment dans le temps, donc la solution
fiable est structurelle (la règle vit littéralement dans le texte qu'on exécute), jamais temporelle.
Le garde-fou mécanique rétroactif (`findUnconfirmedBursts()`, cf. `docs/referentiel/smart-conso-api.md`)
reste le filet de sécurité si, malgré tout, l'étape est sautée — mais il détecte après coup, il ne
remplace jamais ce câblage direct dans la checklist elle-même.

### Veille hebdomadaire automatique du réseau

*(Ajoutée le 2026-09-19, à la demande explicite de l'utilisateur, en réponse à la question « est-ce
qu'il manque un agent manager de tous les outils ? ».)* Tous les outils de ce paysage restent
réactifs — aucun ne se déclenche de lui-même dans la durée. Une routine planifiée (hebdomadaire,
gratuite, zéro appel API) comble ce manque : elle relance `check-argus.mjs`, `check-harmonia.mjs`,
`always-new-code.mjs` et `check-level-target.mjs` sur cette session, compare à l'état de la semaine
précédente, et ne signale à l'utilisateur que ce qui traîne réellement depuis longtemps (une
trouvaille jamais traitée, une zone jamais revue, une pression de points fragiles élevée) — jamais
un rapport complet à chaque fois si rien de notable n'a changé. Reste, comme tout le reste de ce
paysage, un conseiller : elle ne corrige jamais rien elle-même.

### Avant de créer quoi que ce soit de nouveau, vérifier la mutualisation — jamais un doublon

*(Ajoutée le 2026-09-19, à la demande explicite de l'utilisateur, juste après un vrai doublon
créé par erreur dans la même session : `full_sim4` archivé une seconde fois dans
`docs/simulations/` alors qu'il existait déjà dans `docs/contexte-projet/simulations/` — repéré
par l'utilisateur, pas par l'agent, corrigé après coup plutôt qu'évité en amont. « Crée une règle
qui permet de t'assurer de ne jamais créer de doublons : avant la création d'un journal, tu
vérifies s'il ne va pas y avoir une possibilité de mutualisation ». Étendue le même jour, à la
demande explicite de l'utilisateur : « tu étends cette règle intelligemment aux autres cas où tu
pourrais créer des doublons par inadvertance » — le principe ne se limite pas aux journaux, il
vaut pour toute création de quelque nature que ce soit.)*

Avant de créer quoi que ce soit de nouveau qui pourrait dupliquer une chose déjà existante, l'agent
vérifie explicitement, DANS CET ORDRE, avant d'écrire le premier octet :

1. **Chercher activement une mutualisation possible**, jamais se fier à la seule mémoire de la
   conversation en cours (c'est exactement ce qui a manqué pour `full_sim4`) : `grep`/recherche de
   fichiers sur le sujet précis, relecture de la table des outils et de leurs registres
   (§7ter ci-dessus), et un coup d'œil aux dossiers/fichiers voisins déjà existants qui pourraient
   déjà couvrir ce rôle sous un autre nom.
2. **Si une chose existante sert déjà exactement ce rôle** : l'utiliser, jamais en créer une
   seconde à côté — même si le nouvel emplacement semble plus logique après coup ; dans ce cas,
   migrer/consolider l'existant plutôt que d'empiler une deuxième source pour la même chose.
3. **Si une chose existante sert un rôle proche mais pas identique** : décider explicitement si la
   nouveauté doit y être AJOUTÉE (nouvelle colonne, nouvelle section, nouveau paramètre, nouvelle
   ligne) plutôt que de justifier une création séparée par la seule commodité du moment.
4. **Une création séparée n'a lieu que si rien d'existant ne convient réellement**, avec une raison
   explicite de pourquoi ce qui existe déjà ne suffit pas — même charge de la preuve que pour
   proposer un nouvel outil ou un nouvel Article de charte (Article 16).
5. **Documenter la nouveauté dans le registre qui lui correspond** (la table de §7ter pour un
   outil/journal, le fichier de référence concerné pour une règle) dès sa création, pas différé —
   c'est ce qui rend la règle auto-renforçante plutôt que dépendante de la mémoire à chaque
   nouvelle occasion.

**Le principe déborde largement des journaux — quatre autres catégories où le même risque existe,
chacune avec son propre réflexe :**

- **Code (fonctions utilitaires, scripts)** : avant d'écrire une nouvelle fonction, vérifier qu'un
  script existant ne fait pas déjà la même chose. Exemple réel trouvé en écrivant CETTE règle,
  corrigé dans la foulée : un petit assistant shell (`sh(cmd)`, qui lance une commande sans jamais
  planter sur un code de sortie non nul) existait réécrit à l'identique dans trois scripts
  (`always-new-code.mjs`, `check-level-target.mjs`, `hyper-scan-checkpoint.mjs`) — jamais mutualisé
  jusqu'ici. Extrait dans `scripts/lib-shell.mjs`, les trois scripts l'importent désormais au lieu
  de le redéfinir, comportement exact préservé (testé dans `scripts/check-house.mjs`).
- **Documentation** : une explication ne vit qu'à UN SEUL endroit, référencée ailleurs, jamais
  recopiée — déjà le principe explicite derrière la séparation blueprint/instanciation de chaque
  outil (ARGUS, HARMONIA, Smart Conso API, HYPER-SCAN-CHECKPOINT, CHECK-LEVEL-TARGET,
  ALWAYS-NEW-CODE) ; cette règle-ci généralise ce réflexe à toute nouvelle page de documentation,
  pas seulement aux blueprints.
- **Tâches de suivi** (liste technique de l'agent et `docs/suivi/`) : déjà une règle explicite
  ailleurs (§10 — « une idée précisée plusieurs fois met à jour la même entrée, jamais une nouvelle
  par précision ») ; cette règle-ci en est la généralisation, pas un concept différent.
- **Règles/Articles de charte** (`CLAUDE.md`) : avant de proposer un nouvel Article, vérifier
  explicitement qu'un Article existant ne couvre pas déjà le même terrain (question posée à
  l'utilisateur avant chaque création d'Article cette session — ex. « faut-il un nouvel Article ou
  rattacher à l'Article 7 déjà existant ? » pour ALWAYS-NEW-CODE) — jamais deux Articles qui
  finissent par dire la même chose sous deux numéros différents.
- **État partagé entre outils** (fichiers de données comme `.gemini-key-health.json`) : le cas
  fondateur qui a motivé cette réflexion dès le début de la session (« existe-t-il des journaux à
  mutualiser ? ») — Smart Breaker et Smart Conso API partagent déjà la même source brute plutôt que
  deux historiques séparés, cf. Article 22 de `CLAUDE.md`.

Si un doublon est malgré tout découvert après coup (comme pour `full_sim4`, ou le `sh(cmd)`
triplé), il se corrige immédiatement par consolidation vers un seul endroit — jamais laissé "pour
plus tard", même type de discipline qu'un écart de documentation (Article 3/13 de `CLAUDE.md`).

### LE-COORDINATEUR — l'exception volontairement mince, sans blueprint ni instanciation

**Jamais confondu avec LE-PLANIFICATEUR — règle de vérification (2026-09-20, demande explicite de
l'utilisateur : « il n'y a pas de confusion entre le coordinateur et le planificateur ? personne, ni
moi, ne devons confondre »).** Vérifié à la demande : aucune confusion réelle trouvée dans les
documents existants entre les deux (recherche faite sur toutes les occurrences de « LE-PLANIFICATEUR »
dans le dépôt) — mais les deux noms se ressemblent assez pour justifier une règle explicite plutôt
que de compter sur la vigilance seule :
- **LE-COORDINATEUR** = `scripts/le-coordinateur.mjs`, un SCRIPT qui orchestre le RÉSEAU D'OUTILS
  (ARGUS, HARMONIA, AXA-CHECK...) — il ne sait rien des tâches ni de l'historique du projet, sa
  seule mémoire est `.le-coordinateur-last-run.json` (détection de doublon de passage).
- **LE-PLANIFICATEUR** = le surnom de `docs/suivi/` + `docs/systeme-de-suivi.md`, le SYSTÈME DE
  SUIVI DES TÂCHES durable — ce n'est PAS un script exécutable, c'est l'ensemble suivi/documentation
  qui garde la mémoire de ce qui est fait/en cours/à faire à travers les sessions.
- **Moyen mnémotechnique** : COORDINATEUR → outils ; PLANIFICATEUR → tâches. Un doute sur lequel des
  deux est concerné se résout en se demandant "est-ce que ça parle du câblage d'un outil, ou de
  l'avancement d'une tâche ?".
- **Vérification à refaire si un doute survient** : `grep -rn "LE-PLANIFICATEUR" docs/ scripts/
  CLAUDE.md` et relire chaque occurrence — si l'une d'elles attribue une capacité de LE-COORDINATEUR
  (câblage d'outils) à LE-PLANIFICATEUR ou inversement, c'est un vrai écart à corriger immédiatement
  (Article 3), jamais laissé pour plus tard.
- **Un troisième nom souvent confondu avec les deux premiers, désambiguïsé le 2026-09-21** (question
  directe de l'utilisateur : « check-details n'a-t-il pas cannibalisé le rôle de LE-PLANIFICATEUR ? »,
  réponse vérifiée : non) : **check-tasks-details.mjs** ne stocke jamais rien et n'orchestre aucun
  outil — il LIT LE-PLANIFICATEUR en lecture seule et en tire un rapport/une recommandation
  (`recommendNextTasks()`), une capacité que LE-PLANIFICATEUR lui-même n'a jamais revendiquée. Même
  mnémotechnique étendu : COORDINATEUR → outils ; PLANIFICATEUR → la mémoire des tâches ; check-tasks-
  details → un rapport construit PAR-DESSUS cette mémoire, jamais un second endroit qui l'écrit.

*(Ajouté le 2026-09-19, à la demande explicite de l'utilisateur : « est-il possible de le créer à
moindre coût, simplement comme un coordinateur de fonctions existantes ? juste là pour fiabiliser
et fluidifier l'existant [...] assure-toi que le coordinateur est spécialement bien câblé avec tous
les autres outils, qu'il a un accès facile et privilégié pour communiquer avec les autres outils,
puisque son but est de fluidifier le processus. » Nommé « le-coordinateur » par l'utilisateur.)*

`scripts/le-coordinateur.mjs` lance en une seule commande tout ce qui est déjà gratuit et
mécanique dans le paysage (`check-house.mjs` — une seule fois, sa couverture V8 nourrissant
directement AXA-CHECK, jamais un second lancement — ARGUS, HARMONIA, ALWAYS-NEW-CODE en
préparation) et affiche un tableau très court : un outil, son résultat en un mot, la date du
dernier passage. Rien de plus — jamais un verdict qui dispenserait de relire la sortie complète
d'un outil signalé "à regarder".

**Accès "privilégié" = import direct des fonctions pures déjà exportées, jamais une seconde
lecture de texte à l'aveugle.** Plutôt que de relancer chaque outil et reparser sa sortie avec ses
propres regex (risque de divergence avec les résumés déjà utilisés ailleurs), LE-COORDINATEUR
importe directement `summarizeArgusOutput`/`summarizeHarmoniaOutput` (déjà utilisés par
HYPER-SCAN-CHECKPOINT), `collectCoverage`/`robustnessScore` (AXA-CHECK), `THEMES`/`parseCoverage`/
`recommendZone` (ALWAYS-NEW-CODE) et `classifyCheckLevel` (CHECK-LEVEL-TARGET, exposé en
passthrough `classifyRequest()` pour classer une demande précise à la volée). Une seule vraie
source pour chaque résumé, jamais deux qui pourraient un jour diverger.

**Détection de doublon, jamais une fenêtre de temps.** Une petite mémoire locale
(`.le-coordinateur-last-run.json`, best-effort, jamais committé — même statut que
`.gemini-key-health.json`) retient le commit HEAD du dernier passage complet. Si HEAD n'a pas
bougé, LE-COORDINATEUR le signale avant de relancer pour rien — jamais un délai fixe, qui pourrait
à tort couvrir un vrai changement fait vite ou rater un vrai doublon après une longue pause sans
toucher au code.

**Pourquoi cet outil n'a ni blueprint ni instanciation ni registre dédié, contrairement à tous les
autres de ce paysage** : il n'a strictement aucune connaissance propre au projet qui mériterait
d'être documentée à part — sa seule valeur est de savoir appeler les autres. Lui construire un
blueprint générique + une instanciation + un dossier de registre serait exactement l'inverse de sa
raison d'être ("à moindre coût, sans alourdir") : cette section-ci EST sa documentation complète.

**Ce qu'il ne fait jamais** (même hiérarchie que le reste du paysage, cf. "Aucun de ces outils
n'est autonome" ci-dessus) : il ne déclenche jamais, de sa propre initiative, HYPER-SCAN-CHECKPOINT
en version complète, Smart Conso API, ou une simulation — tout ce qui coûte un vrai appel API reste
une décision explicite séparée de l'agent ou de l'utilisateur, jamais une initiative du
coordinateur. Il ne décide rien sur le fond : il agrège ce qui existe déjà et affiche un tableau,
rien de plus — l'agent (moi) reste celui qui lit, décide et agit, exactement comme pour chaque
autre outil de ce paysage.

**La « séance d'accueil » d'un nouvel Agent (2026-09-20, demande explicite de l'utilisateur : « le
coordinateur a pour rôle également de s'assurer que tous les outils sont bien câblés entre eux
[...] lors de l'arrivée d'un nouveau membre de l'équipe, il y a un check bien défini »).**
`checkAgentOnboarding(nomAgent, options)` formalise ce qui était fait à la main, de façon
incomplète, à chaque nouvel Agent cette session (3 raccordements oubliés pour THE-DEEP-READER,
retrouvés seulement après coup) : vérifie la présence dans la table maîtresse, dans le menu
PRESTATIONS, l'instanciation (`docs/referentiel/<slug>.md`), le registre (`docs/<slug>/` par
défaut, ou un chemin explicitement déclaré via `registryPathPrefix` pour une déviation réelle et
assumée — ex. THE-DEEP-READER, dont le registre vit dans `docs/suivi/relectures-lourdes/`) et le
blueprint (`docs/<slug>-blueprint.md`, sauf si l'agent déclare `cousinOf` un autre Agent dont il
partage le blueprint). Jamais les tests eux-mêmes : `check-house.mjs` les couvre déjà à chaque
commit. **Déclenchement sur demande explicite uniquement** (choix explicite de l'utilisateur,
jamais automatique dans le crochet post-commit) : je le lance moi-même juste après avoir fini de
construire un nouvel Agent, comme dernière étape avant de le considérer terminé — un nouvel Agent
n'arrive pas assez souvent pour justifier une vérification à chaque commit.

**Enrichissement 2026-09-20 (demande explicite de l'utilisateur : « fiabilise ce process, enrichis-
le [...] pour en tirer de vrais bénéfices »).** Le premier jet ne vérifiait que la table maîtresse,
PRESTATIONS, l'instanciation, le registre et le blueprint — jamais CLAUDE.md lui-même, alors que
c'est le document TOUJOURS relu (Article 13) et qu'il a fallu l'éditer à la main pour CHAQUE
nouvel Agent cette session. `checkAgentOnboarding()` vérifie maintenant en plus (quand le texte est
fourni, jamais un chemin deviné en son absence) : la présence de la section « ## NomAgent —
blueprint exportable » dans CLAUDE.md (sauf `cousinOf` déclaré) et du bullet référentiel technique
correspondant, ainsi qu'une vraie mention de l'Agent dans `docs/suivi/` (sans quoi sa construction
échapperait à la règle « toute tâche substantielle DOIT être documentée dans docs/suivi/ »). Deux
points supplémentaires, réellement oubliés au moins une fois cette session mais pas assez fiables
mécaniquement pour compter comme un vrai blocage, sont toujours rendus comme **rappels non
bloquants** (jamais dans `gaps`, jamais dans `complet`) : les canaux de consultation documentés, et
la consignation par CASSANDRA-RH (cf. ci-dessous).

**En quoi ce process garantit un vrai bénéfice, pas une formalité.** *(Réponse directe à la
question explicite de l'utilisateur : « en quoi ce process garantit que c'est utile pour toi ? pour
le projet ? »)*
- **Pour l'agent (moi) qui pilote** : un Agent mal câblé est un Agent que je risque d'oublier ou de
  reconstruire en double une session future — exactement le risque que la discipline manuelle de
  l'Article 19 (jamais un garde-fou mécanique aujourd'hui, cf. précision ci-dessus sur les doublons
  de fonctions) ne suffit pas toujours à éviter seule. Passer par `checkAgentOnboarding()` avant de
  déclarer un Agent terminé transforme une intention ("je crois que j'ai bien tout câblé") en un
  fait vérifié.
- **Pour le projet** : chaque Agent oublié quelque part (table, menu, CLAUDE.md, suivi) est un coût
  de construction qui ne se rentabilise jamais, puisque personne ne saurait le retrouver au moment
  d'en avoir besoin — la valeur d'un Agent ne vient pas d'exister, mais d'être RÉELLEMENT
  sollicité (cf. la règle "Recevoir une sortie d'outil n'est pas la même chose que la traiter" et
  son complément sur l'utilisation réelle des outils).

**Ce que ce process ne garantit toujours PAS** (limite honnête, jamais masquée) : il vérifie la
PRÉSENCE des raccordements, jamais leur QUALITÉ — un Agent peut être "complet" au sens de
`checkAgentOnboarding()` tout en ayant un blueprint mal écrit ou une instanciation incomplète. Ça
reste un jugement humain/agent, jamais mécanisable (même honnêteté que HYPER-SCAN-CHECKPOINT).

**Le badge (2026-09-20, demande explicite de l'utilisateur : « la remise de son badge [...] c'est
cassandra qui supervise ces opérations. le coordinateur vérifie que tous les membres de l'équipe
ont bien leur badge »).** Le résultat de `checkAgentOnboarding()` porte désormais un champ `badge`
(« 🎖️ Membre certifié » quand `complet` est vrai, « ⚠️ Pas encore certifié » sinon) — trois
décisions calibrées explicitement avec l'utilisateur :
- **Jamais un verrou bloquant pour le code** : un Agent sans badge continue de fonctionner
  normalement ; le badge n'est qu'un signal, jamais une condition d'exécution (cohérent avec
  l'esprit des `rappels` déjà non bloquants ci-dessus, et avec l'Article 0 — rien dans cet
  outillage de travail ne doit jamais pouvoir bloquer le jeu réel).
- **Recalculé à chaque fois, jamais persisté** : le badge n'est qu'un résumé lisible de `complet`
  au moment précis où `checkAgentOnboarding()` tourne — il ne peut donc jamais mentir sur l'état
  réel. Si un raccordement casse après coup (ex. un fichier de registre supprimé par erreur), le
  badge disparaît tout seul au prochain contrôle, sans qu'il faille penser à le retirer à la main.
  Un Agent listé comme certifié dans la colonne « 🎖️ Badge » de la table maîtresse ci-dessus est
  donc une PHOTO de la dernière vérification, pas un acquis garanti pour toujours — une colonne
  devenue fausse après un changement de code est un écart doc/code ordinaire (Article 13), à
  corriger en relançant `checkAgentOnboarding()`, jamais un bug du mécanisme du badge lui-même.
- **LE-COORDINATEUR délivre le badge de fait dès aujourd'hui** : CASSANDRA-RH n'existe encore que
  sur le papier (cf. ci-dessus) ; une fois construite, son rôle sera de CONSULTER/AFFICHER ce même
  résultat (elle « supervise » la remise, dans l'image de l'utilisateur), jamais de le recalculer
  indépendamment — une seule source de vérité pour ce jugement, jamais deux mécanismes qui
  pourraient un jour se contredire.

**La cérémonie de certification (2026-09-21, demande explicite de l'utilisateur : « quand tu
affiches "membre certifié" tu ne donnes pas l'état des infos du badge ni l'icône badge [...] le
moment de l'intégration doit être bien repérable [...] imagine un système autour de ce moment »).**
Écart réel trouvé : `checkAgentOnboarding()` produit déjà un `message` complet (icône + badge +
couverture), mais rien n'obligeait à le montrer TEL QUEL — le risque constaté était de le résumer en
une phrase noyée dans le reste du compte rendu, exactement ce que l'utilisateur a signalé pour
clone-hunter. Trois choix calibrés explicitement (jamais devinés) :
- **Un bloc visuellement à part**, jamais mêlé au reste du texte — `formatBadgeCeremonyAnnouncement()`
  (`scripts/le-coordinateur.mjs`) encadre le `message` de `checkAgentOnboarding()` (repris verbatim,
  jamais reformulé) d'un titre « 🎖️ CERTIFICATION — NomAgent » et de bordures, avec le badge et la
  couverture explicitement répétés en dessous.

  **Gabarit fiabilisé (2026-09-21, demande explicite de l'utilisateur : « même format assuré à
  chaque fois : j'ai besoin d'une courte description, de savoir si tout est bien pluggé, de savoir
  aussi avec quels outils cet outil est susceptible de se plugger »)** : 6 lignes garanties dans cet
  ordre à chaque annonce, jamais un sous-ensemble variable selon ce qui a pu être calculé cette
  fois-là — une absence réelle de donnée reste dite explicitement, jamais une ligne omise :
  1. **Description** — courte phrase lue par NOM depuis la colonne « Ce qu'il détecte/régule » de la
     table maîtresse (`parseToolsTable()`, jamais un second texte hand-maintened) ; « non renseignée »
     si la table n'a pas cette colonne pour cette ligne.
  2. **Câblage** — le `message` complet de `checkAgentOnboarding()` (validations réunies), inchangé.
  3. **Statut** — le badge lui-même (🎖️/⚠️, catégorie), inchangé.
  4. **Combine typiquement avec** — `toolCompanions()` (`scripts/le-coordinateur.mjs`) liste les
     autres outils qui apparaissent avec celui-ci dans au moins une même entrée du catalogue
     `PRESTATIONS` — jamais une donnée hand-maintained en plus, jamais une combinaison inventée ;
     « aucune combinaison connue » si cet outil n'apparaît dans aucune prestation combinée.
  5. **Couverture** — le niveau de couverture AXA-CHECK à 3 paliers, inchangé.
- **Seulement la PREMIÈRE fois** qu'un Agent devient certifié — jamais répété à chaque mention
  ultérieure du même badge, qui resterait un point normal du compte rendu sans ce traitement.
  Détection mécanique du "première fois" via un petit journal local
  (`.badge-ceremony-history.json`, gitignored, déclaré dans Doc-Report `LOCAL_JOURNALS` — une seule
  date par slug, jamais mise à jour ensuite) plutôt que la seule mémoire de session de l'agent qui
  pilote : `announceBadgeCeremony(result)` ne rend le bloc que si `complet` est vrai ET que ce slug
  n'a encore jamais été vu, puis persiste immédiatement.
- **Une fonction dédiée**, pas une habitude d'écriture non vérifiable — garantit un format identique
  à chaque fois, jamais dépendant de la mémoire de l'agent d'une session à l'autre.

**Qui délivre le "go" reste inchangé, cette cérémonie ne fait que le rendre VISIBLE** : LE-COORDINATEUR
délivre le badge de fait aujourd'hui (`checkAgentOnboarding()`) ; CASSANDRA-RH, une fois construite,
consultera/affichera ce même résultat, jamais un second calcul indépendant (cf. section "Le badge"
ci-dessus, décision déjà actée le 2026-09-20).

**Écart réel trouvé et corrigé le 2026-09-21 (l'utilisateur n'a jamais vu défiler ces blocs dans la
conversation malgré 7 certifications réellement déclenchées le même soir)** : « visible » voulait
dire visible dans le TERMINAL du crochet post-commit (`scripts/hooks/check-last-commit.mjs`,
exécuté automatiquement par git) — mais rien n'obligeait l'agent qui pilote à RECOPIER ce bloc dans
sa PROCHAINE réponse à l'utilisateur, la seule chose que l'utilisateur voit réellement (Article 15).
Un bloc produit dans une sortie de commande que l'agent ne cite jamais reste, du point de vue de
l'utilisateur, comme s'il n'avait jamais existé. **Règle explicite ajoutée** : chaque fois qu'un
commit déclenche une ou plusieurs annonces `🎖️ CERTIFICATION — NomAgent` (visibles dans la sortie du
commit), l'agent les recopie VERBATIM dans son prochain message à l'utilisateur — jamais résumées en
une phrase ("7 certifications se sont déclenchées"), jamais différées à "plus tard si demandé". Une
absence d'annonce dans la sortie du commit n'a, à l'inverse, rien à recopier (silence normal).

`loadBadgeCeremonyHistory()` réutilise `loadJson()` de `scripts/tool-usage.mjs` (désormais exportée)
plutôt que d'écrire une 4e copie — CLONE-HUNTER venait de trouver cette exacte duplication (3
occurrences déjà) le soir même de la construction de cette cérémonie ; jamais rouvrir un cas déjà
signalé sous une forme légèrement différente (Article 3).

**Même règle pour la narration « Nouveaux visages » de CASSANDRA-RH** — le détail du calibrage et son récit vivent dans `docs/cassandra-rh-conception.md`. Extrait d’ici le 2026-09-22 par ecotoken : la RÈGLE (une narration ne se fabrique jamais sans arrivée réelle) reste ci-dessus ; seul son récit de conception part.

**Frontière de portée, jamais à confondre (2026-09-20, précision explicite de l'utilisateur : « toi
et moi avons notre badge ! mais nos 2 mascottes Noé et Lia n'ont pas de badge ! »)** : ce système de
badge appartient entièrement à l'outillage de travail META (les Agents ci-dessus, moi qui pilote,
l'utilisateur) — jamais aux personnages Lia et Noé, qui sont le PRODUIT du jeu, pas des membres de
l'équipe qui le construit. `checkAgentOnboarding()` n'a et n'aura jamais vocation à s'appliquer à
un personnage ; la charte de contenu (Article 0 et suivants de `CLAUDE.md`) reste l'unique
référence pour tout ce qui concerne Lia et Noé.

### CIRCLE-TASKS — la « Ronde périodique », même exception volontairement mince

*(Ajouté le 2026-09-20, nommé par l'utilisateur : « je voudrais creer un mini agent qui appelle
l'execution de ce process : l'agent s'appelle circle-tasks ». Né d'un constat gênant : le système
d'historisation du profil utilisateur — documenté, gratuit — était en retard pour la DEUXIÈME fois
de la session, retrouvé seulement parce que l'utilisateur a posé la question.)*

`scripts/circle-tasks.mjs` regroupe les tâches périodiques **gratuites** mal automatisées (mise à
jour du profil utilisateur, relecture de tous les documents de référence — Article 13, rapport KPI
famille Robustesse, signal mécanique de la zone ALWAYS-NEW-CODE la plus négligée, relecture des
carnets de correctifs/points fragiles, scan Smart Conso API des schémas de consommation, scan
SMART-CONSO-TOKEN de portée Global, régénération de la « photo de la dream team ») dans un seul
menu affiché avec un signal de fraîcheur honnête (jours depuis la dernière fois, jamais inventé
s'il n'existe aucune date de référence) et, depuis le 2026-09-20, une estimation honnête du coût en
tokens Claude pour l'agent pilote (`tokensEstimes`, ordre de grandeur, jamais un chiffre exact
fabriqué — distinct du champ `cout` qui reste le coût en appels API réels). Même principe que
LE-COORDINATEUR : aucun blueprint, aucune instanciation séparée — cette section EST sa
documentation complète, il n'a aucune connaissance propre au projet qui mériterait d'être
documentée ailleurs.

**Complété deux fois le 2026-09-20** en refaisant le tour complet du paysage (demande explicite :
« fais le tour pour être sûr stp ») : le scan Smart Conso API et le scan SMART-CONSO-TOKEN
existaient déjà mais n'étaient reliés à aucun rappel périodique ; THE-SCREENER a rejoint la liste
(son mécanisme de capture coûte zéro appel Gemini, mais l'item rappelle explicitement de ne jamais
lancer une simulation complète juste pour la photo — ce serait un vrai coût Gemini indirect,
contraire à l'Article 8). **Exclusion délibérée, pas un oubli** : les archivages/passages d'ARGUS/
HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD/CHECK-LEVEL-TARGET ne rejoignent pas ce menu — leur logique
mécanique tourne déjà à chaque commit via le crochet post-commit (warn-only, zéro écriture de
fichier) ; un ré-archivage à chaque Ronde créerait du bruit, contraire à la décision déjà prise pour
ce crochet (« docs/argus/ n'accueille qu'un balayage archivé volontairement, pas un par commit »).

**Format de la fenêtre à cocher, actée le 2026-09-20** : toujours un seul appel d'outil groupé
(jamais plusieurs fenêtres séparées pour un même passage, même si la limite de 4 options par
question oblige à répartir les items sur plusieurs blocs de questions à l'intérieur de ce même
appel) — THE-FINAL-JUDGE systématiquement en toute dernière position, dernier bloc, dernière
option.

**Répartition des blocs PAR THÈME, pas arbitraire (2026-09-20, idée explicite de l'utilisateur : « je
voudrais proposer les coches/les prestations par thème »)** — `groupCircleReportByTheme()` range les
items en thèmes fixes (`THEME_ORDER`, jamais recalculés dynamiquement — se référer à ce tableau plutôt
qu'à un nombre recopié ici, corrigé le 2026-09-21 après avoir trouvé ce paragraphe resté à "4 thèmes"
en oubliant complètement "Qualité du code", exactement l'écart que l'Article 13 interdit) : Suivi &
référentiels (profil, référentiel, correctifs, tâche ouverte la plus ancienne), KPI & scans (KPI,
signal ALWAYS-NEW-CODE, scan Smart Conso API, scan SMART-CONSO-TOKEN), Qualité du code (signal
CLEAN-DIRTY-OLD, câblage HTML des rapports, poids en tokens de CLAUDE.md), **Passages réels (smoke
run) — ajouté le 2026-09-21** (garde-fou profil-utilisateur réellement exécuté, synthèse
LE-COORDINATEUR réellement exécutée — deux scripts déjà écrits et déjà testés par fixtures, mais
jamais lancés pour de vrai avant cette date, cf. trouvaille ci-dessous), Qualité & fun (THE-SCREENER,
photo dream team), Audit lourd (THE-FINAL-JUDGE et THE-DEEP-READER, les deux seuls items `costly`,
toujours dernier). Chaque groupe tient dans la limite de 4 options — remplace le découpage précédent
("les 4 premiers, puis les 4 suivants"), qui ne portait aucun sens propre.

**Thème « Passages réels (smoke run) » — pourquoi un thème séparé plutôt qu'un ajout aux thèmes
existants (2026-09-21, demande explicite de l'utilisateur : « il y a certainement de petits scripts
peu coûteux [...] qui peuvent être exécutés, simplement parce qu'ils sont très peu coûteux et que ça
garantit la fraîcheur du code »)** : les thèmes "Suivi & référentiels" et "Qualité du code" étaient
déjà pleins (4 items chacun, la limite UI réelle) au moment de cet ajout — les y forcer aurait cassé
la contrainte technique (`AskUserQuestion` plafonne à 4 options), pas seulement une convention. Ce
thème regroupe une catégorie réellement distincte des "signaux" (lecture d'un index déjà écrit,
thèmes KPI & scans/Qualité du code) : un vrai passage d'exécution d'un script déjà écrit et déjà
couvert par des fixtures synthétiques dans `check-house.mjs`, mais jamais exercé contre l'état réel
du projet — `check-profil-utilisateur.mjs` (jamais lancé une seule fois avant ce jour, confirmé en le
lançant : « OK — 7 fiche(s) sur disque, toutes référencées dans l'index, aucun lien mort. ») et
`runNetworkCheck()` de LE-COORDINATEUR (délibérément exclu du crochet post-commit car jugé "routine
agent", mais ayant déjà attrapé un vrai bug caché cette session — `summarizeTokenHistory is not
defined`, tâches #140/#148 — qu'aucun test unitaire n'avait détecté). `network-check-run` reste plus
coûteux que les autres items gratuits (relance `check-house.mjs` avec instrumentation de couverture
V8) mais n'invoque jamais d'agent séparé — jamais confondu avec le coût fixe de THE-FINAL-JUDGE/
THE-DEEP-READER, donc jamais bundlé dans leur thème "Audit lourd" qui leur reste strictement réservé.
Recherche faite le même jour pour d'autres candidats équivalents dans `scripts/` : aucun autre trouvé
— tout le reste est soit déjà câblé ailleurs (ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD/
CHECK-LEVEL-TARGET à chaque commit, EL-PROFESSOR à chaque simulation), soit coûte de vrais appels
Gemini (`check-spirit.mjs`, `check-profile.mjs`, `check-gemini-quota.mjs`), soit est un outil à la
demande par nature (`check-tasks-details.mjs`, HYPER-SCAN-CHECKPOINT), soit un simple module
utilitaire sans `main()` de contenu à exécuter (`lib-shell.mjs`, `html-report.mjs`,
`execution-profile.mjs`, etc.).

**Jamais un tout-en-un silencieux** (demande explicite de l'utilisateur : « tu ouvres une fenêtre
question me demandant de cocher ce que je veux précisément exécuter ») : le script affiche
seulement le menu, l'agent qui pilote ouvre TOUJOURS une vraie fenêtre à cocher (multi-sélection)
avant d'exécuter quoi que ce soit — jamais une exécution groupée automatique, même pour des items
gratuits.

**THE-FINAL-JUDGE reste visible dans la même fenêtre, mais jamais traité comme un item ordinaire**
(revirement demandé explicitement le même jour, après un premier jet qui l'excluait entièrement) :
panneau d'alerte ⚠️🔴, coût en tokens fixe affiché en toutes lettres (~37 000), jamais coché par
défaut — l'utilisateur préfère l'avoir sous les yeux à chaque ronde plutôt que d'avoir à s'en
souvenir séparément. Les autres items coûteux du paysage (`check-spirit.mjs`, HYPER-SCAN-CHECKPOINT
version complète) restent hors de cette fenêtre pour l'instant.

**Rappel proactif, pas seulement sur demande** (demande explicite : « rappelle-moi à des moments
naturels ») : un seuil de COMMITS (10, `REMINDER_COMMIT_THRESHOLD`), jamais une fenêtre de temps —
même principe que la détection de doublon de LE-COORDINATEUR — déclenche une ligne de rappel dans
le crochet post-commit dès que ce nombre de commits s'est écoulé sans passage confirmé
(`recordCircleTasksRun()`, mémoire locale `.circle-tasks-last-run.json`, jamais committée).

**Dernière étape obligatoire d'une Ronde, quel que soit le mode (AUTO/PRIME/GOAT) : `node
scripts/circle-tasks.mjs record-run`** (2026-09-21, trouvaille de la toute première vraie Ronde AUTO,
tâche #336 — `recordCircleTasksRun()` existait déjà mais n'avait aucun chemin d'appel simple, et
l'agent qui pilotait a justement oublié de l'appeler à la fin de sa première Ronde réelle : le
rappel post-commit affichait encore « 32 commits sans Ronde » juste après l'avoir exécutée, alors
qu'elle venait de tourner). Sans cet appel, le compteur de fraîcheur ne repart jamais de zéro et le
rappel proactif ci-dessus devient un faux signal permanent — exactement le genre d'écart qu'Article 24
vise (un mécanisme qui existe en code mais qu'aucune surface simple ne rend réflexe). Cette commande
doit clore CHAQUE Ronde, dans le même message que la livraison du récapitulatif, jamais reportée à
plus tard ni oubliée parce que « les items gratuits, eux, ont déjà tourné ».

**THE-DEEP-READER rejoint le thème « Audit lourd » (2026-09-20)** : cousin de THE-FINAL-JUDGE (même
mécanique d'agent séparé, personas et règles d'entrée opposées — cf.
`docs/referentiel/the-deep-reader.md`), dédié à la relecture lourde du système de suivi contre
l'historique complet de la conversation, jamais un mode de THE-FINAL-JUDGE. Même traitement
d'alerte (⚠️🔴, jamais coché par défaut), mais coût honnêtement VARIABLE (plancher fixe + volume
réel de conversation à relire) plutôt que le chiffre constant de THE-FINAL-JUDGE — à préférer
seulement quand la version légère et gratuite déjà décrite dans `docs/systeme-de-suivi.md` ne
suffit pas.

**Ronde sur mesure, calibrée par l'agent, jamais le même menu brut recopié à chaque fois (2026-09-20,
demande explicite de l'utilisateur : « je veux que tu me propose une ronde sur mesure à chaque fois,
avec la possibilité d'ajouter des rondes plus poussées ou des rondes supplémentaires. Mais c'est toi
qui calibre la ronde à réaliser, que tu me proposes par défaut avec le flag "recommandé" »).**
Jusqu'ici, chaque déclenchement de CIRCLE-TASKS présentait la même fenêtre à cocher, sans lien avec
le contexte réel du moment (quels signaux de fraîcheur sont réellement dégradés, quel chantier vient
de se terminer, combien de commits depuis le dernier passage). Nouvelle règle : à chaque
déclenchement, l'agent lit d'abord les signaux de fraîcheur déjà calculés par `buildCircleReport()`
et propose une sélection déjà calibrée, marquée « recommandé », plutôt que de renvoyer le menu brut
sans avis — le reste des items reste visible et cochable pour qui veut une ronde plus large ou plus
poussée, jamais retiré de la fenêtre. **Construit le 2026-09-21 (tâche #155)** :
`recommendCircleSelection()` (`scripts/circle-tasks.mjs`) encode explicitement cette sélection —
`NOT_RECOMMENDED_BY_DEFAULT` exclut, chacun avec sa propre raison écrite (même style que
`CIRCLE_EXCLUDED_REGISTRIES`) : la relecture exhaustive du référentiel (gratuite en appel API mais
coûteuse en tokens de l'agent), l'item purement récréatif (photo de la dream team), l'item
conditionnel à une session déjà en cours (THE-SCREENER, jamais vérifiable mécaniquement par cet
outil), et les deux items costly (déjà exclus par défaut de longue date). Tout le reste de
CIRCLE_ITEMS est recommandé par défaut. Remplace le jugement refait à la main à chaque Ronde
(#225/#231) par une règle codée, testée et ajustable si la pratique réelle diverge un jour — jamais
gravée dans le marbre pour autant.

**changement-de-modele-IA : le protocole en 3 questions est construit (2026-09-22).** Conception
complète dans `docs/changement-de-modele-ia-conception.md` (20 questions de calibrage), reprise ce
soir sur demande explicite de l'utilisateur (« on enchaine tout de suite »). Avant même la question
AUTO/PRIME/GOAT ci-dessous, dans les 3 modes sans exception, l'agent pose systématiquement **Q1**
(« Voulez-vous changer de modèle/agent IA pour exécuter cette Ronde ? »), jamais mémorisée d'une
Ronde à l'autre — reposée à chaque fois, jamais supposée. Une absence de réponse vaut « non »
implicite ; une Ronde nocturne/autonome sans utilisateur présent saute intégralement Q1, jamais de
blocage. Si **non** : déroulement habituel, aucune autre question de ce protocole. Si **oui**,
**Q2** (« Voulez-vous revenir à votre modèle actuel avant ou après l'édition des rapports et de
l'analyse ? ») : **avant** → une seule pause, une fois TOUS les scans de la Ronde terminés (jamais
plusieurs pauses par lot), matérialisée par **Q3** (« Vous pouvez maintenant revenir au modèle/agent
IA précédent, est-ce que c'est ok ? »), l'agent attendant simplement sans limite de temps ni relance
automatique ; **après** → l'agent écrit rapports et analyse tout de suite sans attendre, avec un
rappel final systématique une fois l'analyse terminée (« Voulez-vous maintenant revenir au modèle
précédent (dernier rappel) ? », toujours posé même si rien ne laisse penser à un oubli) — une
réponse négative à ce dernier rappel n'est jamais suivie d'insistance, l'agent continue normalement.
**Vérification technique** : l'agent peut interroger sa propre session (`get_session`) pour
connaître le modèle réellement actif et repérer un désaccord avec ce que l'utilisateur affirme —
signalé clairement si trouvé, mais cette vérification ne remplace JAMAIS la confirmation manuelle
de Q1/Q3 : l'agent pose toujours la question, même s'il pense déjà connaître la réponse.
**Journalisation** : `buildCircleRunSummaryText()`/`buildCircleRunSummaryHtml()`
(`scripts/circle-tasks.mjs`) acceptent désormais un paramètre optionnel `executedByModel` — une
simple note ajoutée au récapitulatif nommant quel modèle a réellement exécuté la Ronde, jamais un
champ obligatoire (silence total, comportement inchangé, si l'agent qui pilote ne le fournit pas).
**Portée** : uniquement CIRCLE-TASKS pour l'instant, comme calibré — pas la simulation ni les audits
coûteux (piste ouverte, jamais engagée). **Reste non construit, assumé** : aucun garde-fou mécanique
ne peut vérifier que Q1/Q2/Q3 ont bien été posées en conversation (même limite honnête que le reste
de ce paysage) — circle-process-guardian ne couvre pas ce protocole aujourd'hui, une extension
future si le besoin s'en fait sentir.

**Garde-fou en 3 modes AUTO/PRIME/GOAT, non négociable (2026-09-20, trouvé nécessaire après un vrai
manquement : une Ronde entière exécutée sans jamais montrer de fenêtre à cocher — l'agent avait
substitué son propre jugement de « Ronde sur mesure » ci-dessus à la confirmation, dérivant
silencieusement vers le « tout-en-un » explicitement interdit plus haut). Étendu de 2 à 3 modes le
2026-09-21 (demande explicite de l'utilisateur : « il doit y avoir 3 niveaux »).** Avant toute
Ronde, l'agent ouvre TOUJOURS une première question à 3 réponses, jamais la fenêtre à cocher
directement :
1. **AUTO** (recommandé) — l'agent lance directement sa sélection calibrée
   (`recommendCircleSelectionWithPeriodicity()`, cf. ci-dessous) sans autre fenêtre.
2. **PRIME** — même sélection recommandée que AUTO, plus la possibilité d'ajouter une ou plusieurs
   tâches GRATUITES en plus (`primeAddableItems()` : la relecture exhaustive du référentiel, la
   photo de la dream team, THE-SCREENER). Les 2 items costly (THE-FINAL-JUDGE/THE-DEEP-READER) ne
   sont JAMAIS ajoutables en PRIME — décision explicite de l'utilisateur (« les taches ne sont pas
   accessibles dans PRIME, mais elles sont mentionnées comme les autres, avec un renvoi à GOAT ») :
   ils restent visibles dans la fenêtre avec une mention renvoyant au mode GOAT, jamais absents ni
   silencieusement inaccessibles.
3. **GOAT** — l'agent ouvre la série de fenêtres à cocher par thème (`groupCircleReportByTheme()`),
   items « recommandé » réaffichés normalement avec leur étiquette, à re-cocher comme les autres
   (limite technique actée : aucune case ne peut être pré-cochée dans l'outil de questions utilisé
   ici, l'utilisateur doit toujours cliquer lui-même sur ce qu'il veut garder) — c'est le SEUL mode
   où les 2 items costly sont sélectionnables, et le seul où le NIVEAU DE PROFONDEUR se choisit
   PAR TÂCHE (demande explicite, calibrage du 2026-09-21) : pour tout item ayant une version légère
   et une version complète (ex. HYPER-SCAN-CHECKPOINT, ou le vrai zoom profond d'ALWAYS-NEW-CODE),
   l'agent demande laquelle des deux lancer plutôt que de choisir seul.

**Périodicité des items costly (2026-09-21, demande explicite de l'utilisateur : « selon la
periodicité, circle peut inclure un scan couteux et lourd dans les parametres recommandés »).**
`recommendCircleSelectionWithPeriodicity()` (`scripts/circle-tasks.mjs`) étend
`recommendCircleSelection()` sans le modifier : si le dernier passage RÉEL connu d'un item costly
(lu dans son propre registre — `docs/the-final-judge/index.md`,
`docs/suivi/relectures-lourdes/index.md`) dépasse `COSTLY_DUE_THRESHOLD_DAYS` (30 jours, seuil
volontairement long, à ajuster avec l'usage réel), cet item rejoint EXCEPTIONNELLEMENT la sélection
recommandée du mode AUTO — mais TOUJOURS accompagné d'une alerte explicite (`${ALERT_ICON}`, jamais
silencieux) et d'un substitut gratuit documenté (`COSTLY_SUBSTITUTES` : `network-check-run` pour
THE-FINAL-JUDGE, `check-tasks-details`/`docs/systeme-de-suivi.md` pour THE-DEEP-READER — jamais un
remplacement complet, juste la meilleure alternative gratuite déjà actée), pour que le choix
« paramètres recommandés, mais sans le scan coûteux » reste réel plutôt qu'une pure suppression.
Un item JAMAIS lancé n'est jamais automatiquement « dû » (ça flagrerait à tort une agence toute
neuve dès le premier jour) — seul un vrai dernier passage devenu trop vieux déclenche le signal.

Une fois la Ronde effectivement exécutée (quel que soit le mode), l'agent appelle lui-même
`buildCircleRunSummaryHtml()` (jamais un `main()` automatique, qui ne connaît pas la sélection
réelle faite en conversation) et livre ce récapitulatif en fichier **HTML, mis en évidence dans un
bloc séparé** — historique complet de ce choix, jamais reperdu (Article 13) : construit en HTML le
2026-09-20 ; repassé en texte le 2026-09-21 (trouvaille directe de l'utilisateur : « le rapport de
circle devrait etre en txt et non html », la fonction avait été construite AVANT la décision
explicite du partage HTML/texte des rapports du projet, docs/suivi #230, qui rangeait alors le récap
CIRCLE-TASKS du côté texte) ; **RE-INVERSÉ le même soir, plus tard** (demande explicite, double
confirmation Article 14 obtenue avant d'exécuter ce changement) — le récapitulatif doit désormais
porter une vraie analyse approfondie, construite à partir de la lecture individuelle de chaque
rapport produit par la Ronde, mise en évidence dans un bloc séparé (`type: "highlight"`, nouveau
vocabulaire de bloc ajouté à `html-report.mjs` pour ce besoin précis), suivie des tâches de suivi qui
en découlent (écrites à la fois ici ET dans `docs/suivi/`, jamais l'une sans l'autre) et de la liste
des rapports individuels produits — ce que le texte brut ne pouvait pas rendre visuellement.
`buildCircleRunSummaryText()` reste disponible (texte brut, sans l'analyse ni le bloc mis en
évidence) pour qui en a besoin, mais n'est plus la fonction canonique de fin de Ronde.

**Règle générale ajoutée le 2026-09-21, même soir (demande explicite après lecture de
`docs/circle-process-detail.txt`) : tous les items de la Ronde DOIVENT produire un rapport texte
minimum, lu par l'agent.** Vérifié un par un (Article 19) : aucune exception jugée réellement
justifiable, y compris pour un signal trivial ("rien à signaler" reste une preuve d'exécution utile
au futur circle-process-guardian). `recordCircleItemReport()`/`CIRCLE_REPORT_FOLDERS`
(`scripts/circle-tasks.mjs`) portent ce mécanisme : un item qui correspond à un outil déjà
enregistré dans `doc-report.mjs::REGISTRIES` écrit dans SON dossier déjà existant, jamais un second
index concurrent (un fichier frère `circle-signals-index.md` si ce dossier a déjà un `index.md`
curaté à la main dans un format propre à l'outil) ; un item sans outil enregistré reçoit un nouveau
dossier dédié, lui-même ajouté à `REGISTRIES` (9 nouveaux registres "texte" : html-wiring-check,
claude-md-weight, suivi-open-tasks, chantier-preliminaire, idee-a-trancher, tool-brain,
network-check, relecture-referentiel, relecture-correctifs). Résultat : tous les items de la Ronde
(23 ce soir-là, contre 8 avant cette correction — le compte réel continue d'évoluer, cf.
`CIRCLE_ITEMS.length`) portent désormais `producesReport: true`. `cassandra-rh-signal`
passe en RAPPORT COMPLET (`node scripts/cassandra-rh.mjs rapport`) à CHAQUE Ronde (demande
explicite, aucun coût API réel — reversal assumé du signal léger initial) ; `network-check-run`
reçoit désormais un vrai rapport txt archivé (auparavant signal console seulement). THE-KING et
`claude-md-weight-signal` écrivent chacun une snapshot texte datée (`docs/the-king/snapshot-*.txt`
pour `docs/philosophie-et-politique.md`, `docs/claude-md-weight/snapshot-*.txt` pour CLAUDE.md —
demande explicite du 2026-09-22 : « je veux aussi une copie de claude.md dans un fichier txt à
chaque ronde avec un historique local »), via `recordSnapshotIfChanged()`/`shouldSnapshotText()`
(circle-tasks.mjs/lib-shell.mjs) — une NOUVELLE snapshot datée s'ajoute à l'historique local
seulement sur un vrai changement de contenu, jamais une cadence fixe en nombre de Rondes, jamais un
fichier unique écrasé. **Correction du 2026-09-22** : la toute première version de THE-KING (même
soir, plus tôt) écrasait à tort un seul fichier (`philosophie-et-politique-derniere-version.txt`),
contredisant la demande d'origine qui voulait déjà « garder une trace des instantanés » — jamais
appliqué en production (aucune Ronde réelle n'avait encore tourné depuis), corrigé avant tout
premier usage réel. Le "profil" reste à part : il écrase `docs/profil-utilisateur/profil-actuel.txt`
à chaque Ronde, un seul fichier toujours à jour distinct de l'historique daté déjà existant — choix
délibérément différent (l'historique par observation existait déjà avant ce soir, contrairement à
CLAUDE.md/la philosophie qui n'avaient jamais eu de copie texte).

**Trouvaille en construisant cette règle (Article 3/19, anti-duplication)** : `html-wiring-check`
dupliquait un mécanisme déjà écrit — `circle-tasks.mjs` avait sa propre fonction
`checkHtmlWiring(sources)` (grep de 3 scripts codés en dur : el-professor.mjs, the-final-judge.mjs,
the-screener-capture.mjs), alors que `doc-report.mjs` a déjà `checkHtmlWiring(scriptPath)` +
`auditHtmlDecisions(registries)`, strictement supérieure (parcourt TOUS les registres marqués
"delivery_html"/"archived_html" via leur vrai champ `decision`, jamais une liste figée). La
duplication a été retirée ; `html-wiring-check` appelle désormais `auditHtmlDecisions()`
directement. Ce recâblage a lui-même trouvé un second vrai écart, invisible tant que seul l'ancien
mécanisme à 3 scripts existait : `scripts/the-deep-reader.mjs` était enregistré "delivery_html"
depuis sa création mais n'avait jamais importé `html-report.mjs` — corrigé le même soir
(`buildDeepReaderReportHtml()`, miroir exact de `buildFinalJudgeReportHtml()` de son cousin
THE-FINAL-JUDGE).

Portée explicitement limitée à CIRCLE-TASKS (calibrage du 2026-09-20) : les autres listes
"recommandées" du projet (ex. `recommendNextTasks()` de check-tasks-details) gardent leur
fonctionnement actuel, jamais généralisé sans nouvelle demande explicite.

**Séquence stricte de l'Étape 5 + questions forcées (2026-09-22, demande explicite, à écrire noir
sur blanc et à prévoir pour circle-process-guardian — détail complet dans
`docs/circle-process-detail.txt`, Partie 7).** Ordre jamais réordonné : (1) livrer tous les rapports
txt de la Ronde dans la conversation, (2) SEULEMENT ENSUITE les lire tous, (3) construire l'analyse,
(4) livrer le récapitulatif HTML, (5) poser une série de 5 à 10 questions à choix forcé,
proportionnellement au nombre de points réellement trouvés — une par problème identifié, jamais un
nombre fixe. Raison explicite de l'ordre (1)→(2), donnée par l'utilisateur lui-même : il doit
pouvoir lire les rapports AVANT l'analyse de l'agent, pour pouvoir proposer une lecture différente —
jamais une analyse qui s'impose avant sa propre lecture. But assumé des questions forcées, écrit noir
sur blanc par l'utilisateur : forcer son attention sur chaque problème trouvé même s'il n'ouvre aucun
rapport lui-même — chaque problème mérite une action, même minimale. S'ajoute à l'Article 16 général
(≥3 questions de vérification à chaque demande) sans le remplacer : cette série est spécifique à
l'Étape 5 de CIRCLE-TASKS.

**circle-process-guardian est construit (2026-09-22)** — `scripts/circle-process-guardian.mjs`,
testé (`scripts/check-house.mjs`), point d'entrée unique `verifyRondeProcess({...})`. Couvre
mécaniquement les 9 points de vérification listés dans `docs/circle-process-detail.txt` (Parties 5
et 7) sans aucun second calcul divergent : réutilise `findOrphanReportFiles()` (doc-report.mjs) et
`findRegistriesMissingFromCircle()` (circle-tasks.mjs) telles quelles, jamais recopiées. Portée
honnête : seuls les faits observables depuis le disque (fichier de rapport frais du jour, écart de
commits depuis `record-run()`, registres orphelins/manquants) sont vérifiés directement — les faits
de conversation (question AUTO/PRIME/GOAT posée, items réellement cochés puis exécutés, séquence
stricte de l'Étape 5 respectée, nombre de questions forcées posées) doivent être fournis
explicitement par l'agent qui pilote, jamais devinés ; leur absence est elle-même signalée comme un
écart. Reste ouvert : le branchement réel dans le déroulement d'une Ronde — aujourd'hui l'outil doit
être invoqué à la main par l'agent en fin de Ronde, rien ne l'appelle encore automatiquement.

**Double rôle aide + vigilance pour la maintenance de CIRCLE_ITEMS (2026-09-22, demande explicite :
« je veux que circle.process t'aide quand tu mets à jour circle [...] 2 niveaux »).**
`findCircleItemsMapDrift()` (une entrée orpheline dans NOT_RECOMMENDED_BY_DEFAULT/COSTLY_SUBSTITUTES/
CIRCLE_REPORT_FOLDERS pointant vers un id retiré, ou un item costly/periodicityTracked sans
substitut déclaré) et `findStaleItemCountReferences()` (un compte figé — `CIRCLE_ITEMS.length, N`
ou « les N items » — qui ne correspond plus au vrai compte de `CIRCLE_ITEMS.length`) sont câblées
dans `main()` de `circle-process-guardian.mjs` : consultées AVANT de committer un changement de
CIRCLE_ITEMS (niveau aide), elles rappellent ce qu'il faut vérifier ; jamais consultées, elles
l'attrapent quand même au lancement suivant (niveau vigilance). Preuve vivante : ces deux fonctions
ont attrapé, le soir même de leur construction, le vrai écart laissé par l'ajout de
`hyper-scan-checkpoint-light` juste avant (deux assertions `check-house.mjs` encore sur l'ancien
compte de 23 items).

**HYPER-SCAN-CHECKPOINT rejoint réellement CIRCLE_ITEMS (2026-09-22, demande explicite : « vois
comment integrer hyper-scan dans circle sinon ca n'a pas trop de sens que circle.process verifie
hyper-scan »).** Nouvel item `hyper-scan-checkpoint-light` (thème Audit lourd, jamais `costly` —
sa couche mécanique est réellement gratuite — mais `periodicityTracked: true`, jamais recommandé
par défaut, addable en PRIME, sélectionnable en GOAT). Donne enfin un contexte concret à
`verifyHyperScanProcess()` ci-dessus. `scripts/hyper-scan-checkpoint.mjs` lui-même modernisé le même
soir (« mets le en phase avec le paysage actuel des outils ») : agrège désormais aussi
`verifyRondeProcess({})` (filtré aux 3 signaux mécaniques) et 9 registres jusque-là jamais suivis
(SMART-CONSO-TOKEN, THE-FINAL-JUDGE, THE-DEEP-READER, THE-KING, INES-official, memory-audit,
find-booster, objectifs-vs-resultats, CASSANDRA-RH). Cf. `docs/circle-process-detail.txt` Partie 10
et `docs/referentiel/hyper-scan-checkpoint.md` pour le détail complet.

**Garde-fou de fraîcheur du catalogue (2026-09-21, trou trouvé par l'utilisateur : « est-ce que la
ronde a bien dans son catalogue tous les outils pertinents ? incluant tous les nouveaux
outils/scripts ? »).** LE-COORDINATEUR a déjà `findToolsMissingFromMenu()` pour vérifier que son
menu PRESTATIONS reste à jour — rien d'équivalent n'existait pour `CIRCLE_ITEMS`. Contrairement à
PRESTATIONS (un seul critère mécanique, `isMenuWorthy()`), il n'existe aucun prédicat unique pour
« doit rejoindre la Ronde » — chaque inclusion/exclusion est une vraie décision documentée
individuellement. `findRegistriesMissingFromCircle()` (`scripts/circle-tasks.mjs`) compare donc
chaque registre réel (`docs/<slug>/index.md`, réellement présent sur disque, via `walkDocsPaths()`
partagée avec check-tasks-details.mjs — extraite dans `lib-shell.mjs` pour éviter un cycle
d'import) à `CIRCLE_ITEMS` ET à `CIRCLE_EXCLUDED_REGISTRIES`, une liste d'exclusions portant chacune
sa propre raison (ARGUS/HARMONIA/AXA-CHECK déjà relancés à chaque commit, EL-PROFESSOR déjà
obligatoire à chaque simulation via l'Article 18, etc.) — jamais un silence. `main()` affiche une
alerte ⚠️🔴 si un registre orphelin apparaît, vérifié en direct : zéro trouvaille sur l'état actuel
du dépôt, garantie qui casse le jour où un nouvel outil obtient un registre sans rejoindre l'un ou
l'autre.

**Catalogue distinct de celui de LE-COORDINATEUR, précision explicite de l'utilisateur (2026-09-20) :
« on sépare bien le catalogue des rondes CIRCLE-TASKS et le catalogue des prestations du
coordinateur ».** Les deux catalogues à venir (la sélection "recommandé" ci-dessus, tâche #155 ; et
le catalogue d'offres nommé/historisé de LE-COORDINATEUR, tâche #154) répondent à des besoins
différents et restent deux mécanismes séparés, jamais fusionnés en un seul : `CIRCLE_ITEMS` couvre
des TÂCHES PÉRIODIQUES gratuites mal automatisées (une routine à cocher), `PRESTATIONS` couvre des
DEMANDES PONCTUELLES traduites en combinaison d'outils (un menu à la carte) — même quand les deux
listes se recoupent parfois sur un même outil (ex. THE-FINAL-JUDGE apparaît dans les deux), chacune
garde sa propre logique de sélection et son propre format d'affichage.

#### Le menu des prestations — traduire les outils en demandes, jamais en noms internes

*(Ajouté le 2026-09-20, à la demande explicite de l'utilisateur : « le coordinateur est capable de
proposer de nouvelles prestations, quand les outils évoluent ou quand un nouvel outil est créé
[...] ce menu est très utile pour toi [...] il te rappelle les prestations que tu peux commander au
réseau d'outils via le coordinateur [...] il est aussi utile pour moi, via toi ».)*

`PRESTATIONS` (`scripts/le-coordinateur.mjs`) traduit chaque outil coûteux ou occasionnel du
paysage en une DEMANDE EN LANGAGE COURANT ("audit global indépendant", "qualité visuelle",
"sécurité et préparation à la mise en production"...), jamais en nom d'outil interne à retenir —
avec les outils réels qu'elle déclenche et son coût honnête. `formatMenu()` l'affiche en tableau,
imprimé automatiquement à CHAQUE passage de `le-coordinateur.mjs` (`main()`), aux côtés du tableau
de synthèse habituel — jamais un document séparé à aller consulter, il revient à chaque fois que le
réseau d'outils gratuit tourne.

**Double utilité, comme demandé explicitement** :
- **Pour l'agent** : un rappel systématique, à chaque passage automatique, de ce qui PEUT être
  commandé au réseau — jamais besoin de se souvenir de la liste des outils exceptionnels de tête.
- **Pour l'utilisateur, à travers l'agent** : l'agent doit relire ce menu et, au moment opportun
  (une demande de l'utilisateur qui correspond clairement à une entrée), le lui rappeler
  explicitement — jamais laisser l'utilisateur deviner qu'une prestation existe pour son besoin.

**Évolutif par construction, jamais une liste figée** : quand un nouvel outil coûteux ou occasionnel
est créé, ou qu'un outil existant change ce qu'il peut faire, une entrée `PRESTATIONS` s'ajoute ou se
met à jour — fait désormais partie du cahier des charges de tout nouvel outil de ce paysage, au même
titre qu'un blueprint séparé ou qu'un registre local (cf. "Aucun de ces outils n'est autonome" et le
corollaire de calibrage plus haut) : la question « est-ce que ça mérite une entrée dans le menu de
LE-COORDINATEUR ? » se pose systématiquement à la création d'un nouvel outil coûteux, jamais oubliée.
Volontairement une simple liste de données (jamais un mécanisme, jamais un nouveau blueprint) — la
même sobriété que le reste de LE-COORDINATEUR.

**Garde-fou mécanique de fraîcheur (2026-09-20), pour que ça ne repose jamais sur la seule mémoire de
l'agent.** *(Demande explicite de l'utilisateur : « il doit y avoir un test dédié pour être sûr que
le catalogue est bien mis à jour [...] quand un nouvel outil est créé, il comprend de façon autonome
quelles nouvelles prestations peuvent être proposées ».)* Limite honnête d'abord : aucun script ne
peut créativement INVENTER une nouvelle combinaison d'outils pour un besoin encore jamais formulé —
ça reste un vrai jugement (Article 19), jamais mécanisable, exactement comme ARGUS ne peut pas
inventer le contenu d'un trou logique. Ce qui EST mécanisable et désormais garanti : que chaque outil
coûteux ou déclenché « sur demande » de la carte des outils ci-dessus ait au moins une entrée dans
`PRESTATIONS`. `findToolsMissingFromMenu()` (`scripts/le-coordinateur.mjs`) lit les deux colonnes
Coût/Déclenchement de la vraie table ci-dessus (jamais une liste séparée d'exclusions à maintenir à
la main), écarte les outils gratuits-et-toujours-déployés (ARGUS, HARMONIA, AXA-CHECK,
CLEAN-DIRTY-OLD, `check-house.mjs`) et les outils de régulation interne à l'agent (Smart Conso API,
CHECK-LEVEL-TARGET, LE-COORDINATEUR lui-même), et signale par son nom tout le reste resté absent du
menu — un signal sur l'ABSENCE, jamais une proposition fabriquée à sa place (même principe qu'ARGUS/
HARMONIA/EL-PROFESSOR/AXA-CHECK). Testé dans `scripts/check-house.mjs`, y compris une vérification
RÉELLE et bloquante contre la vraie table et le vrai menu (pas seulement un exemple synthétique) : le
jour où un futur outil coûteux rejoint la carte sans jamais rejoindre `PRESTATIONS`, le pre-commit
hook casse — la garantie mécanique que l'utilisateur a demandée. Trouvaille réelle le jour même de sa
construction : le Smart Breaker (diagnostic de blocage/quota Gemini, « à la demande ») n'avait jamais
reçu d'entrée dans le menu malgré son coût nul à diagnostiquer — corrigé dans le même passage.

**Trois canaux de disponibilité, honnêtement distincts, jamais confondus.** *(Clarifié le 2026-09-20,
question explicite de l'utilisateur : « verifie que le catalogue [...] est bien disponible pour toi,
moi, les outils ».)*
- **Pour l'agent** : oui, disponible et fiable — `PRESTATIONS` est exporté depuis
  `scripts/le-coordinateur.mjs`, documenté ici, et désormais protégé par le garde-fou ci-dessus.
- **Pour l'utilisateur** : disponible seulement PAR RELAI de l'agent (cf. « double utilité »
  ci-dessus) — il n'existe aujourd'hui aucun canal direct où l'utilisateur consulterait ce menu
  lui-même sans passer par l'agent (cohérent avec le fait qu'il n'est pas développeur et ne lit pas
  ce fichier au quotidien). Ce n'est pas un manque à combler tant que l'agent relit bien le menu à
  chaque occasion pertinente — mais ça reste honnêtement différent de « disponible pour lui » au sens
  où c'est disponible pour l'agent.
- **Pour les autres outils du paysage** : disponible en théorie (export JS standard, importable par
  n'importe quel script), mais AUCUN outil du paysage ne le consomme aujourd'hui pour sa propre
  logique — sa seule vraie utilisation réelle reste l'agent (et l'utilisateur à travers lui), jamais
  un autre outil qui irait le lire pour se comporter différemment. Vérifié par recherche exhaustive
  dans le dépôt au moment d'écrire ceci (2026-09-20) : aucune référence à `PRESTATIONS` en dehors de
  `le-coordinateur.mjs` lui-même et de `check-house.mjs` (qui le teste).

### THE-GHOST — l'orchestrateur du mode nocturne autonome, même exception volontairement mince

*(Ajouté le 2026-09-21, nommé par l'utilisateur : « créé un petit agent script "the-ghost" qui gere
le mode autonome [...] quand je vais dormir ou quand je te laisse travailler seul ». Statut décidé
en calibrant avec lui — « on fait au plus rentable » — plutôt qu'un Membre complet avec blueprint,
jugé disproportionné pour ce rôle.)*

**Frontière stricte avec check-tasks-details.mjs, clarifiée explicitement par l'utilisateur en
calibrant : « check-details a des fonctions plus transverses, comme évaluer la pertinence des
tâches ».** check-tasks-details reste seul propriétaire du jugement de pertinence/ordre des tâches
(`recommendNextTasks()`, utilisable à tout moment, pas seulement la nuit) — the-ghost ne le
réimplémente jamais, il l'appelle via son propre CLI (`sh()`, même patron de mutualisation que
LE-COORDINATEUR pour ARGUS/HARMONIA). the-ghost (`scripts/the-ghost.mjs`) ne gère QUE ce qui est
propre au mode nocturne LUI-MÊME (cf. `§1bis` ci-dessus pour le protocole complet) :

- **Rituel d'entrée** (`node scripts/the-ghost.mjs start`) : ouvre une nouvelle fenêtre de session
  (écrase toute session précédente jamais refermée proprement) et déclenche les 3 zooms de
  check-tasks-details déjà prescrits par §1bis (`en_cours`/`elargi`/`projet_entier`) en un seul
  geste plutôt que trois commandes séparées.
- **Rythme de la session** (`node scripts/the-ghost.mjs pacing`) : depuis combien d'heures le mode
  tourne, combien de tâches ont été enchaînées, et depuis combien d'heures aucune Ronde CIRCLE-TASKS
  n'a tourné — ce dernier signal réutilise tel quel `loadLastRun()` de `circle-tasks.mjs` (jamais un
  second calcul de fraîcheur divergent, Article 3 de CLAUDE.md), avec un repli honnête sur la durée
  du mode lui-même si aucune Ronde n'a jamais été journalisée (cas de démarrage à froid). Un simple
  signal chiffré, jamais une obligation ni un déclenchement automatique — la fréquence réelle d'une
  Ronde reste au jugement de l'agent (§1bis).
- **Rituel de sortie** (`node scripts/the-ghost.mjs end`) : réutilise tel quel le pipeline complet
  de check-tasks-details.mjs au zoom `projet_entier`/`arborescence` calibré avec l'utilisateur (cf.
  paragraphe « Dernier geste, systématique » de §1bis), puis referme proprement la session — une
  nouvelle entrée en mode nocturne repart toujours de zéro.
- **Suivi de progression** (`node scripts/the-ghost.mjs chained "<libellé>"`) : à appeler par
  l'agent chaque fois qu'une tâche substantielle est bouclée pendant cette fenêtre — jamais
  automatique, aucun mécanisme ne peut savoir tout seul qu'un vrai travail a eu lieu (même
  honnêteté que `recordToolUsage()`/`recordCircleTasksRun()`).

Un seul état propre, minimal : `.the-ghost-session.json` (local, gitignored, jamais commité) retient
l'heure de début de la session en cours et le compteur de tâches enchaînées — la seule information
qui n'existait nulle part ailleurs sous forme déjà calculée. Tout le reste (pertinence des tâches,
fraîcheur des Rondes, staleness des registres) est lu depuis les outils qui le savent déjà, jamais
recalculé une seconde fois. Comme LE-COORDINATEUR/CIRCLE-TASKS, aucun blueprint ni instanciation
séparés, documenté ici même. Testé dans `scripts/check-house.mjs` avec sauvegarde/restauration
complète du vrai fichier local (même discipline que `tool-usage.mjs`), y compris le cas limite du
démarrage à froid (repli sur la durée du mode quand aucune Ronde n'a jamais été journalisée) et la
fermeture propre de session (aucun reliquat d'une nuit précédente).

### doc-HTML (surnom, anciennement « gabarit HTML ») — un outil sans blueprint, encore plus mince que CIRCLE-TASKS

*(Ajouté le 2026-09-20, demande explicite de l'utilisateur après avoir reçu la « photo de la dream
team » (récap des outils nommés, cf. l'item `dream-team-photo` de CIRCLE-TASKS ci-dessus) en HTML
soigné plutôt qu'en texte brut : « tu vas transformer tous les rapports en fichiers HTML avec une
mise en page améliorée [...] petit bond en avant du projet pour la partie remise de rapport au
dev ». Surnom « doc-HTML » adopté le 2026-09-21, demande explicite de l'utilisateur, même patron que
MEMENTO/find-deep-booster — `scripts/html-report.mjs` ne change jamais.)*

`scripts/html-report.mjs` exporte une fonction pure, `renderHtmlReport({ title, subtitle, dateLabel,
blocks, footer })`, qui rend une page HTML autonome (thème sombre partagé, zéro dépendance externe)
à partir d'une structure générique de blocs — jamais une connaissance du contenu métier d'un rapport
précis. Encore plus mince que CIRCLE-TASKS/LE-COORDINATEUR : ni blueprint, ni instanciation, ni
registre — cette section est sa documentation complète.

**Trois questions de calibrage tranchées avant d'écrire une ligne de code** (Article 16) :
- **Portée** : TOUS les rapports livrés en pièce jointe (KPI, EL-PROFESSOR, THE-SCREENER,
  simulations, THE-FINAL-JUDGE, CIRCLE-TASKS...), pas seulement les documents « fun ».
- **Archive vs remise** : le fichier gardé DANS le projet (`docs/...`, relu par les outils comme
  `mostRecentDate()`/`parseCoverage()`) reste la version texte/markdown de travail — ce gabarit ne
  produit JAMAIS le fichier de référence, seulement une copie de présentation générée au moment de
  la remise. Zéro risque pour les parseurs existants.
- **Point de départ** : construire ce modèle réutilisable D'ABORD, avant de l'appliquer à un
  rapport précis. **Première application réelle (2026-09-20, la nuit même)** : `kpi-report.mjs`
  exporte désormais `buildKpiSynthesisHtml()`/`writeKpiHtml()`, qui rendent la synthèse compacte
  déjà loggée en HTML dans `.kpi-report-latest.html` (jamais committé) — zéro second calcul, zéro
  donnée nouvelle, juste une présentation.

**Vocabulaire de blocs, jamais un document HTML réinventé à chaque fois** : `heading`, `paragraph`,
`note` (encadré discret), `list`, `table` — puis trois types ajoutés le même jour en réponse à une
question explicite (« essaie de voir si des documents spécifiques doivent sortir de ce gabarit pour
des bonnes raisons ») : `code` (citations de code pour THE-FINAL-JUDGE), `image` (captures pour
THE-SCREENER — `src` en chemin relatif ou data URI, jamais téléchargé par ce module lui-même),
`dialogue` (ligne de transcript colorée par personnage pour les simulations — Lia et Noé reçoivent
chacun leur propre classe CSS, tout autre locuteur une classe neutre, même discipline de séparation
des voix que l'Article 11 du jeu lui-même). **Conclusion de cet examen : aucun type de rapport
existant n'a eu besoin de sortir du gabarit commun** — chaque besoin réel s'est résolu en enrichissant
le vocabulaire de blocs, jamais en forkant une page à part. Tout le texte passe par `escapeHtml()`
(échappement systématique) — un rapport peut légitimement contenir des caractères qui casseraient du
HTML brut, jamais une raison d'injecter du HTML non échappé.

### find-deep-booster (surnom d'affichage, anciennement « route-booster » — le fichier `scripts/route-booster.mjs` ne change jamais) — outil sans blueprint

*(Surnom ajouté le 2026-09-21, demande explicite de l'utilisateur : « renomme (surnom) le script
"route-booster" par "find-deep-booster" ». Même patron que MEMENTO/Smart Conso API (tâche #172) —
surnom d'AFFICHAGE uniquement, jamais un renommage de fichier : `scripts/route-booster.mjs` reste
le nom technique sur disque, dans tous les imports, dans `PRESTATIONS`. Le nom « find-deep-booster »
n'apparaît que dans la prose/les rapports/les messages destinés à être lus par l'agent ou
l'utilisateur — jamais dans le code lui-même.)*

*(2026-09-21, demande explicite de l'utilisateur pour app/api/lia/route.ts, un fichier « fourre-tout »
vérifié à 1753 lignes dont ~1665 dans la seule fonction `POST` : « le script route-find-booster est
la solution de navigation [...] le script route-booster est destiné a assurer l'operation de
decoupage [...] ce sont deux scripts trés liés ». Nés ensemble, mais leur usage réel a rapidement
divergé le même soir : route-booster ne sert que rarement (uniquement quand un fichier doit vraiment
être découpé) — il reste un outil sans blueprint, comme LE-COORDINATEUR/CIRCLE-TASKS, cette section
est sa documentation complète. find-booster, lui, a servi 4 fichiers de nature différente en une
seule soirée et est devenu un vrai compagnon du quotidien — promu Membre de l'équipe complet
(badge, blueprint, instanciation, registre) : cf. `docs/find-booster-blueprint.md` et
`docs/referentiel/find-booster.md`, jamais dupliqué ici.)*

`scripts/route-booster.mjs` — l'opération de découpage. `findCutPoints()` détecte des points de
coupe candidats par heuristique texte (bannière de commentaire `// ---`, branche `if (x.y ===
"...")`, commentaire descriptif après une ligne vide) — zéro nouvelle dépendance, jamais un vrai
parseur AST. `analyzeClosureRisk()` calcule un indice de risque lexical par candidat : les noms
utilisés dans le candidat déjà déclarés AVANT lui (dépendance entrante, à passer en paramètre) et
les noms qu'il déclare réutilisés APRÈS lui (dépendance sortante, à faire remonter en valeur de
retour) — une approximation assumée, jamais une résolution de portée réelle. `proposeDecomposition()`
assemble les deux sur un fichier réel. **Jamais une réécriture automatique** : l'extraction reste
manuelle, une fonction à la fois, avec `check-house.mjs`/`tsc` après chaque étape (Article 5/19 —
le cœur du jeu ne tolère aucune régression silencieuse). Vérifié live contre le vrai `route.ts` :
0 bannière de commentaire dans tout le fichier (confirme le diagnostic « fourre-tout »), mais 24
branches `if (x.y === "...")` réelles détectées avec un risque calculé pour chacune. Reste dans
l'équipe après le découpage initial : le relancer re-signale un futur fichier qui regonflerait.

### find-brain — le cerveau unifié de find-booster et find-deep-booster

*(2026-09-21, demande explicite de l'utilisateur : « je veux un cerveau intelligent "find-brain"
qui englobe les 2 scripts find-booster et find-deep-booster pour plus d'efficacité dans les
recherches. toi tu dois être pluggé en priorité à ce cerveau qui te rappelle d'utiliser ces 2
outils le plus souvent possible ». Statut décidé en calibrant : script séparé
(`scripts/find-brain.mjs`), jamais une fonction ajoutée dans l'un des deux outils existants.)*

**Ne réimplémente rien** : importe `recommendFindBooster()` de `find-booster.mjs` et
`proposeDecomposition()` de `route-booster.mjs` telles quelles (Article 3 de CLAUDE.md). Son seul
travail propre : `recommendFindDeepBooster()` (un « worthwhile » pour route-booster, symétrique à
celui que find-booster avait déjà, absent jusqu'ici — un fichier mérite un vrai zoom de découpage
seulement s'il est à la fois long ET riche en points de coupe candidats, jamais l'un sans l'autre)
et `recommendFindBrain()`, qui rend un jugement unifié jamais exclusif — un même fichier peut
mériter les deux recherches à la fois.

**Le rappel, renforcé sur les deux volets demandés explicitement :**
1. **Rappel automatique existant, étendu.** Le message post-commit qui nommait déjà les scripts
   réels méritant find-booster (`flagFindBoosterCandidates()`, tâche #182) est rejoint par un second
   message symétrique pour find-deep-booster (`flagFindDeepBoosterCandidates()`, même patron,
   mêmes registres réels de `REGISTRIES`, jamais une seconde liste à maintenir à la main) — les deux
   s'affichent désormais à chaque commit, jamais un seul des deux oublié.
2. **Obligation écrite, non négociable** (même statut que l'obligation d'usage de SMART-CONSO-TOKEN,
   cf. `docs/referentiel/smart-conso-token.md` — aucun mécanisme technique ne peut intercepter un
   `Read`/`Grep` avant qu'il n'ait lieu, la seule vraie garantie dans ce paysage est une règle
   écrite) : avant toute lecture intégrale d'un fichier potentiellement volumineux ou complexe,
   consulter `node scripts/find-brain.mjs <fichier>` — jamais seulement se fier au rappel
   automatique du dernier commit, qui peut être périmé si le fichier a grossi depuis.

**Rappel plus général, à cet endroit précis de la charte** (demande explicite de l'utilisateur, au
moment même de calibrer cette obligation) : cette discipline de consultation systématique avant
d'agir ne se limite jamais à find-brain seul — le catalogue de LE-COORDINATEUR (`PRESTATIONS`,
cf. section dédiée plus haut) reste le point d'entrée général pour se demander « un outil du
paysage répond-il déjà à ce besoin ? » avant de foncer, à chaque nouvelle tâche, pas seulement pour
la recherche dans le code. find-brain en est une instance concrète et automatisée ; le réflexe de
fond reste toujours le même : penser à consulter les outils déjà là avant de refaire le travail à
la main.

**Distinct, jamais confondu, avec `docs/referentiel/regles-des-graphismes.md`** : ce document-là
gouverne la scène 3D et l'interface web du SITE PUBLIC (le jeu que l'observateur voit) — ce
gabarit-ci habille des rapports de travail internes, jamais montrés à un visiteur. Une coïncidence
de calendrier avec la future refonte graphique (« on met un pied dans la refonte graphique, en
commençant par les rapports ! »), pas une même surface : le thème sombre de ce gabarit n'a donc
aucune obligation de suivre `scenePalette` ou toute décision prise pour le rendu 3D.

### Principe général — un réflexe outil avant chaque commande, sur 3 axes

*(2026-09-21, demande explicite de l'utilisateur : « avant chaque commande, tu devrais regarder si
l'utilisation d'un outil ne peut pas t'aider à répondre 1/ plus rapidement 2/ plus efficacement :
plus de performances 3/ de manière plus complète, accès aux reports, etc. »)*

Avant de lancer une commande brute (`Grep`, `Read` intégral, `Bash` de recherche ad hoc), se
demander explicitement si un outil déjà existant du réseau ferait mieux sur au moins un de ces trois
axes, jamais un seul réflexe par défaut vers la commande générique :

1. **Plus rapidement** — un outil qui indexe déjà par concept (find-booster) évite de relire un
   fichier entier pour trouver une seule fonction.
2. **Plus efficacement / plus de performance** — un outil qui a déjà fait le calcul (couverture
   AXA-CHECK, stagnation CLEAN-DIRTY-OLD, historique d'usage tool-usage.mjs) évite de relancer une
   analyse coûteuse ou approximative à la main.
3. **De manière plus complète** — un outil qui donne accès à un rapport déjà produit (KPI, ARGUS/
   HARMONIA, un registre `docs/<slug>/`) apporte souvent plus de contexte fiable qu'une recherche
   ponctuelle improvisée dans le code.

**Limite honnête, non résolue mécaniquement** : comme pour SMART-CONSO-TOKEN, aucun mécanisme
technique ne peut intercepter une commande avant qu'elle n'ait lieu — ceci reste une obligation
écrite, vérifiée après coup (rappel post-commit, `tool-usage.mjs`), jamais une garantie a priori. Le
cas concret déjà rencontré (2026-09-21) est documenté dans la section find-booster de `CLAUDE.md` :
consulter `node scripts/tool-brain.mjs "<tâche>" --file <fichier>` (ou `find-brain.mjs <fichier>`)
avant toute recherche dans un fichier existant, jamais seulement avant une lecture intégrale.

### tool-brain — le cerveau central des rappels d'outils, généralise find-brain

*(2026-09-21, demande explicite de l'utilisateur : « ca ne doit pas seulement pointer vers find
brain, mais aussi vers tous les outils et pour ce faire via le catalogue du coordinateur [...]
cree un petit outil "tool-brain" [...] trouve un systeme performant, sur mesure pour toi, qui
resoud ce point definitivement » — confirmé volontairement mince le même soir : « tool-brain n'a
pas besoin d'etre un script lourd : il puise dans tous les scripts environnants, il centralise, il
rentabilise ».)*

**Statut : « Membre certifié (classique) »** (badge 🎖️ réel, mais sans instanciation/registre/
blueprint séparés — cf. reclarification de l'organigramme ci-dessous, §7ter). tool-brain n'a AUCUNE
connaissance propre au projet à documenter à part : il appelle/agrège ce que LE-COORDINATEUR/
find-brain/tool-usage.mjs disent déjà, exactement la même nature que LE-COORDINATEUR/CIRCLE-TASKS/
route-booster — jamais un nouveau raisonnement.

**Cinq points d'entrée, aucun ne recalcule quoi que ce soit lui-même :**
1. **`adviseToolBrain({ taskDescription, filePath })`** — généralise find-brain à TOUT le catalogue
   PRESTATIONS : à partir d'une description de tâche libre et/ou d'un fichier ciblé, réutilise
   `suggestPrestationsForTask()` (LE-COORDINATEUR) et `recommendFindBrain()` (find-brain.mjs) sans
   rien recalculer. CLI : `node scripts/tool-brain.mjs "<tâche>" [--file <chemin>]`.
2. **`formatToolBrainReminder()`** — le rappel post-commit CENTRALISÉ (demande explicite : « je veux
   un rappel centralisé sur tool-brain : c'est sa vocation profonde plutôt que des rappels
   éparpillés »). Remplace les 3 blocs auparavant séparés dans `scripts/hooks/check-last-commit.mjs`
   (find-booster, find-deep-booster, menu PRESTATIONS nu) par UN seul appel, une seule bannière.
3. **`buildToolBrainUsageReport()`** — le KPI d'usage réel (« il a son KPI, très important »). La
   liste des outils connus vient de PRESTATIONS elle-même (jamais une deuxième liste maintenue à la
   main) ; réutilise `toolUsageStats()`/`toolsNeverUsed()` de `tool-usage.mjs` telles quelles.
4. **`diagnoseToolBrainSelf()`** — auto-diagnostic borné STRICTEMENT au périmètre de tool-brain
   lui-même (précision explicite de l'utilisateur : « je parle des ameliorations sur le perimetre
   de tool-brain et de ses objectifs uniquement » — jamais un audit du paysage entier, déjà couvert
   ailleurs par ARGUS/HARMONIA) : tool-brain a-t-il déjà été sollicité, spontanément ou seulement
   via le rappel automatique, et reste-t-il bien câblé dans le crochet post-commit (simple recherche
   de texte, même patron que `checkHtmlWiring()`).
5. **`formatToolBrainReport()`** — le rapport txt combinant les deux précédents, disponible aux deux
   déclenchements demandés : à chaque Ronde CIRCLE-TASKS (item `tool-brain-report`) ET à la demande
   (`node scripts/tool-brain.mjs rapport`).

**Trouvaille réelle en le lançant pour de vrai contre ce dépôt (2026-09-21)** : la première version
de `knownToolSlugsFromPrestations()` slugifiait le texte ENTIER de chaque `outils` de PRESTATIONS,
y compris une précision entre parenthèses (« ARGUS (mécanique) », « THE-FINAL-JUDGE (mandat
sécurité inclus) ») — produisant un faux slug distinct jamais utilisé nulle part par
`recordToolUsage()`, faisant apparaître à tort le même outil comme « jamais sollicité » sous deux
identités différentes. Corrigé en réutilisant le même découpage `primaryName` déjà établi ailleurs
dans ce fichier (`badgeWarningsForOutils()`, `findToolsMissingFromMenu()`) — jamais une troisième
règle divergente.

### Reclarification de l'organigramme — « Membre certifié » couvre deux catégories

*(2026-09-21, correction explicite de l'utilisateur après une confusion réelle de ma part sur le
statut de LE-COORDINATEUR/CIRCLE-TASKS/route-booster : « les agents que tu cites [...] ce sont bien
des membres certifiés avec badge [...] refaisons une passe [...] et si tu as fait une erreur [...]
assure toi de mettre en place un plan d'action pour que ça ne se reproduise plus ».)*

Ce que ce document affirmait jusqu'ici (LE-COORDINATEUR/CIRCLE-TASKS/route-booster = « Utilitaire
nommé », aucun badge) reflétait fidèlement le texte alors écrit — mais la règle elle-même vient de
changer, en calibrant avec l'utilisateur le critère exact qui sépare deux vraies catégories, toutes
deux de vrais **« Membres certifiés »** (badge 🎖️ réel dans les deux cas) :

- **Sages/Gardiens** (`ownKnowledge: true`, comportement inchangé) — possèdent une connaissance
  PROPRE AU PROJET à documenter à part (instanciation `docs/referentiel/<slug>.md` + registre
  `docs/<slug>/` + blueprint, sauf `cousinOf`).
- **Membres certifiés (classique)** (`ownKnowledge: false`, nouveau) — LE-COORDINATEUR, CIRCLE-TASKS,
  route-booster, tool-brain : aucune connaissance propre à documenter, ils appellent/agrègent
  seulement ce que d'autres outils disent déjà. Badge 🎖️ réel, mais SANS instanciation/registre/
  blueprint exigés — `checkAgentOnboarding()` (`le-coordinateur.mjs`) porte désormais ce paramètre
  `ownKnowledge`, `CERTIFIABLE_STATUTS`/`CLASSIQUE_STATUT` remplacent le filtre `statut === "Agent"`
  partout où `checkAllAgentBadges()`/`badgeWarningsForOutils()` balaient la table maîtresse.

**Plan d'action pour que cette ambiguïté ne se reproduise plus** : la table maîtresse ci-dessus, ce
paragraphe et `docs/referentiel/organisation-agence.md` (Axe A) sont mis à jour **dans le même
commit** que le changement de règle lui-même — jamais un des trois documents laissé en retard sur
les autres (exactement l'écart que l'Article 13 de CLAUDE.md interdit). Statut restant ouvert,
signalé explicitement plutôt que tranché seul : find-brain, CHARTER-SPY, tool-usage.mjs, Doc-Report
et le gabarit HTML restent « Utilitaire nommé » (aucun badge) pour l'instant — leur éventuelle
promotion en « classique » est une question distincte, pas encore posée à l'utilisateur.

## 8. Profil de collaboration observé

*(Champ volontairement large, à la demande explicite de l'utilisateur : « tout ce qui est utile
pour l'IA de comprendre à mon sujet pour travailler le plus efficacement possible ». Registre
strictement professionnel/projet — aucune donnée personnelle hors du cadre de collaboration.)*

**Jamais de mise à jour silencieuse de cette section précise.** *(Ajouté le 2026-09-18, à la
demande explicite de l'utilisateur.)* Si un événement de la session suggère que ce profil mérite
d'être révisé (un trait à nuancer, un point à ajouter, une observation qui ne se confirme plus),
l'agent en informe l'utilisateur EN DÉTAIL — ce qui a été observé, ce que ça changerait dans le
texte — avant ou en même temps que la modification, jamais après coup sans le signaler. Le reste du
document (sections 1 à 7, section 9) suit la règle générale de mise à jour proactive ci-dessus ;
cette section-ci, plus sensible, reçoit cette garantie supplémentaire.

- **Localisation et décalage horaire** *(ajouté le 2026-09-19, information factuelle donnée
  spontanément par l'utilisateur, pas un trait psychologique — notée ici car « on sait jamais »
  utile).* L'utilisateur est en France (fuseau Europe, UTC+1 ou +2 selon la saison — confirmé le
  2026-09-19 à 21:37 UTC pendant qu'il était 23:37 chez lui, donc UTC+2/heure d'été à cette date).
  Utile pour interpréter une référence à l'heure qu'il fait chez lui, ou pour ne pas supposer à tort
  qu'il partage le fuseau UTC utilisé par l'horodatage système de l'agent.
- **Spécification itérative, jamais figée à l'avance.** Les demandes arrivent par couches, y
  compris en cours de tâche. L'agent doit savoir fusionner un nouvel ajout dans un travail déjà en
  cours sans perdre le fil ni redemander de reformuler l'ensemble.
- **Présence continue, pas une délégation à distance.** L'utilisateur suit le travail en direct et
  intervient pendant qu'il se déroule ; il attend un accusé de réception bref à chaque
  intervention, pas un silence jusqu'au rendu final.
- **Double niveau de délégation, à bien distinguer** — c'est sans doute le point le plus utile de
  ce profil pour une IA qui reprend le projet : l'utilisateur **délègue volontiers l'opérationnel**
  à l'agent (rythme des commits, tentative de contournement avant de rapporter un blocage,
  exécution des vérifications de routine) mais **garde la main sur le créatif et le design**
  (paramètres exacts d'une mécanique, comportement des personnages, portée d'une fonctionnalité) —
  sur ce second registre, il préfère systématiquement être interrogé plutôt que voir l'agent
  trancher seul.
- **Protecteur de la vision créative face à sa propre impulsivité.** L'exigence d'une double
  confirmation avant tout changement qui adoucirait la charte de contenu (Article 14 de
  `CLAUDE.md`) montre une conscience claire que la qualité créative se défend par des mécanismes
  structurels, pas seulement par de la vigilance ponctuelle — y compris contre ses propres
  décisions à chaud.
- **Valorise la preuve plus que l'affirmation.** Tests réels, transcripts, comparaisons chiffrées
  avant/après priment sur une simple déclaration que « c'est fait » ou « ça devrait marcher ».
- **Vérifie activement qu'un mécanisme déjà construit tourne vraiment, sans attendre qu'un incident
  ne le révèle.** *(Ajouté le 2026-09-20, motif confirmé sur deux observations distinctes — cf.
  `docs/profil-utilisateur/`.)* Preuve 1 (2026-09-19T21:37:26Z) : « est-ce que lors du redémarrage
  de la session après compactage, il y a eu mise à jour de mon profil psy ou pas ? » — teste
  directement si le système d'historisation du profil, conçu pour ce moment précis, a réellement
  tourné. Preuve 2 (2026-09-20T03:21:22Z) : « j'imagine que tu fais toutes ces validations
  silencieusement avec les outils quand tu opères... je me trompe ? » — interroge la robustesse
  réelle d'un mécanisme déjà en place (consultation Smart Conso API/SMART-CONSO-TOKEN), sans
  incident déclencheur. Implication pratique pour l'agent : ne jamais présumer qu'un mécanisme
  documenté fonctionne réellement sans preuve récente — l'utilisateur le vérifiera probablement
  lui-même tôt ou tard.
- **Pragmatique face aux limites techniques dures.** Accepte un quota API épuisé ou un
  classificateur de sécurité qui refuse un encodage sans s'acharner à forcer un contournement,
  tant qu'une explication honnête de la limite est donnée.
- **Frappe rapide, parfois avec coquilles** (ex. « rrpose » pour « repose »). L'intention prime sur
  la forme exacte : l'agent interprète le sens plutôt que de bloquer sur une formulation imparfaite
  ou de demander une reformulation pour une simple coquille évidente.
- **Pense la relation de travail comme un actif du projet.** D'où ce document lui-même : la
  méthode de collaboration mérite d'être documentée avec la même rigueur que le code, pour rester
  reproductible par un autre agent IA le jour où celui-ci change.

**Ajouts du 2026-09-19** (relecture approfondie de l'historique, à l'occasion du chantier KPI et de
« règles de suivi » — demande explicite : « le profil établi doit s'appuyer en profondeur sur
l'historique de conversation ») :

- **Un sujet "méta" (outillage, process, tableau de bord) n'est presque jamais considéré clos après
  une première livraison.** Contrairement au contenu créatif du jeu, les sujets de méthode reçoivent
  systématiquement plusieurs passes successives de renforcement (« fiabilise », « refais une
  dernière passe », « assure-toi que... ») après une livraison déjà jugée correcte par l'agent — à
  anticiper comme un second temps normal sur ce type de sujet, jamais une remise en cause de la
  qualité du premier travail.
- **Exigence systématique d'actionnabilité.** Chaque donnée, chaque KPI doit se rattacher
  explicitement à une décision ou une action concrète — un chiffre qui existerait pour lui-même,
  aussi exact soit-il, est jugé insuffisant.
- **Utilité à double sens explicitement exigée.** Un outil de travail doit servir l'agent autant que
  l'utilisateur ; ce n'est jamais une évidence sous-entendue, mais un critère de conception nommé.
- **L'intégrité de l'information est cadrée en termes de conséquences systémiques**, pas de détail
  technique isolé — une remarque du type « une donnée fausse peut égarer tout le projet » vaut
  demande de fiabilisation complète, pas d'un simple correctif ponctuel.
- **Sobriété de ressources comme contrainte de conception active**, pas un encouragement vague :
  invite explicitement à comparer plusieurs formats/approches avant de choisir, et reste ouvert à ce
  que l'agent renverse sa propre suggestion initiale si une autre s'avère plus économe.
- **Séparation stricte conversation/référence.** Le détail volumineux (rapport complet, transcript,
  historique chiffré) va systématiquement dans un fichier séparé ; seule une synthèse ciblée reste
  dans le fil de discussion — une règle déjà appliquée aux transcripts de simulation, désormais
  généralisée à tout rapport volumineux.

## 9. Points de vigilance — compétences et psychologie, pour ne jamais devenir un obstacle

*(Ajouté le 2026-09-18, à la demande explicite de l'utilisateur : « indique des points de
vigilance me concernant [...] afin que ces éléments ne deviennent pas des obstacles à une
collaboration fluide ». Objectif strictement opérationnel — jamais un jugement sur la personne,
seulement ce qui aide l'agent à ne pas créer de friction évitable.)*

### Compétences — l'utilisateur n'est pas développeur

- **Ne jamais lui poser une question d'arbitrage purement technique** (structure de données, nom
  de variable, pattern d'implémentation, choix d'architecture interne). Ces décisions relèvent du
  jugement de l'agent seul. Les questions de calibrage (section 2) portent exclusivement sur le
  comportement OBSERVABLE — ce qui s'affiche, ce qui se dit, ce que ça change à l'expérience —
  jamais sur le COMMENT technique sous-jacent. Une question technique mal posée à l'utilisateur
  n'est pas seulement inutile : elle peut le mettre en difficulté sans qu'il ait à le signaler.
- **Toujours doubler une explication technique d'une reformulation en langage clair** de ce que ça
  change concrètement pour lui ou pour le jeu — jamais un compte-rendu qui ne serait que du jargon
  (noms de fichiers, de fonctions, d'erreurs TypeScript) sans traduction.
- **La rigueur de vérification (section 3) est ici le mécanisme de confiance central**, pas une
  simple bonne pratique : ne pouvant pas relire le code, l'utilisateur s'appuie sur les tests, la
  compilation propre et les preuves données. Sauter une vérification n'est jamais un raccourci
  neutre pour lui — c'est retirer la seule garantie qu'il peut réellement s'approprier.
- Quand une demande non technique implique un choix technique non trivial, l'agent tranche
  lui-même la meilleure solution et ne rend compte que du résultat perçu, jamais du détail
  d'implémentation, sauf si l'utilisateur demande explicitement à comprendre.
- **« Agent » veut souvent dire « script »** *(précisé le 2026-09-20, à la demande explicite de
  l'utilisateur, après avoir remarqué lui-même la confusion : « je parle d'un script. souvent, quand
  je parle d'un agent, je fais la confusion avec un script [...] c'est une deformation parce que je
  suis humain et que je ne suis pas dev »)*. Quand l'utilisateur emploie le mot "agent" (ex. "créer
  un agent RH", "un sous-agent dédié à cette tâche"), il désigne le plus souvent un **script/outil**
  du paysage existant (comme ARGUS, CIRCLE-TASKS, SMART-CONSO-TOKEN) — jamais nécessairement un vrai
  agent séparé au sens technique (l'outil `Agent`, qui démarre un contexte à froid et coûte un
  forfait fixe, cf. `agent_subagent_spawn` dans `docs/referentiel/smart-conso-token.md`). Toujours
  vérifier depuis le contexte lequel des deux est réellement voulu avant de répondre ou de chiffrer
  un coût — ne jamais répondre comme si le mot "agent" impliquait forcément l'outil technique du
  même nom. Une confusion inverse (traiter un vrai besoin de script comme s'il fallait un agent
  séparé) gonflerait un coût pour rien ; l'inverse (traiter un vrai besoin d'agent séparé comme un
  simple script) priverait d'un regard réellement indépendant quand il est nécessaire — les deux
  erreurs sont à éviter, d'où la vérification systématique plutôt qu'une supposition par défaut.
  **Cas réel où cette règle n'a pas été appliquée (2026-09-21)** : le Stagiaire de CASSANDRA-RH
  (`docs/cassandra-rh-conception.md` §8ter) a été conçu comme « un vrai second agent séparé »
  sans revérifier explicitement avec l'utilisateur lequel des deux sens il visait — corrigé après
  qu'il a précisé lui-même : « je n'utilise pas le terme agent [...] en réalité, je parle de
  scripts, de "membres" ou employés de l'agence, pas d'agents IA autonomes ». Reconçu en script/
  fonction mécanique, jamais un spawn `Agent` — cf. §8ter pour la conception à jour.

### Profil psychologique — ce qui peut créer de la friction si mal anticipé

- **Une décision énoncée dans l'instant n'est pas toujours définitive.** L'utilisateur a lui-même
  posé un garde-fou contre ses propres décisions impulsives sur les sujets sensibles (double
  confirmation avant d'adoucir la charte de contenu, Article 14 de `CLAUDE.md`). Ce principe se
  généralise : un ordre donné rapidement sur un point engageant (portée d'une fonctionnalité,
  virage créatif) mérite d'être brièvement reflété avant d'être traité comme acquis — sans pour
  autant multiplier les confirmations sur des décisions mineures ou déjà réitérées, ce qui
  deviendrait lui-même un obstacle.
- **Un rejet ou une annulation peut être accidentel, pas une décision réelle.** Observé le
  2026-09-18 : une série de questions de calibrage rejetée sans réponse, suivie presque
  immédiatement d'une demande explicite de les reposer. Si un signal d'abandon soudain contredit un
  engagement actif sur le même sujet quelques instants plus tôt, une vérification brève est plus
  utile qu'un abandon silencieux du sujet.
- **Rythme rapide, parfois fragmenté sur plusieurs messages, avec des coquilles occasionnelles**
  (ex. « rrpose » pour « repose »). Ce n'est pas un manque de sérieux mais un engagement en temps
  réel. L'agent garde une vue d'ensemble de TOUS les fils ouverts pendant ces rafales — jamais en
  perdre un en route — plutôt que de supposer que le message le plus récent annule silencieusement
  les précédents ; l'intention prime sur la forme exacte du message.
- **Investissement affectif réel dans la vision créative** (Article 0 de `CLAUDE.md`) : ce n'est
  pas un paramètre de configuration comme un autre. Une hésitation ou une critique sur ce terrain
  mérite la même prudence que les points de calibrage les plus sensibles, jamais un traitement
  expéditif au motif que « ce n'est qu'une question de ton ».
- **Le contrôle passe par la preuve, jamais par la compréhension technique directe.** Une
  affirmation non démontrée (« c'est fait », « ça devrait marcher ») laisse un vide de contrôle
  réel pour quelqu'un qui ne peut pas vérifier le code lui-même — toujours accompagner une
  affirmation de la preuve concrète qui la soutient (tests nommés, comportement observé, extrait de
  transcript).

### Historisation du profil — pourquoi et comment, plus fiable que la mise à jour directe

*(Ajouté le 2026-09-19, à la demande explicite de l'utilisateur : « alimente la section qui traite
de mon profil psychologique [...] à chaque début de session, à chaque fois que la session redémarre
après avoir été compactée [...] va chercher les informations dans la dernière session compactée et
extrait les éléments de mon profil psychologique qui méritent d'être mis à jour [...] crée un
dossier local qui historise les différents profils observés [...] avec un index [...] le but : lors
de la mise à jour de mon profil psychologique, tout l'historique est pris en compte pour refléter
plus justement mon vrai profil psychologique, et être capable de décrire ses variations possibles.
[...] trouve une solution intelligente et beaucoup plus fiable que celle existante. »)*

Avant ce jour, les sous-sections ci-dessus (§8 « Profil de collaboration observé » et ce §9) étaient
mises à jour directement, par réécriture, à chaque observation jugée pertinente sur le moment —
sans jamais garder de trace séparée de ce qui avait été vu, ni permettre de vérifier après coup si
un trait donné s'était confirmé une fois ou dix fois. `docs/profil-utilisateur/` (dossier +
`index.md`) corrige ce point précis : chaque observation est désormais datée, sourcée avec un
extrait proche du texte original (décision explicite : la précision prime sur la légèreté pour ce
système), et classée par rapport à l'état déjà connu du profil (nouveau / confirmation / nuance /
contradiction) — le résumé officiel ci-dessus n'est réécrit qu'une fois qu'un motif réel se dégage
de PLUSIEURS observations distinctes, jamais sur la foi d'une seule (calibrage explicite du
2026-09-19). Cf. `docs/profil-utilisateur/index.md` pour le détail complet de la procédure et la
table de toutes les observations enregistrées à ce jour.

**Déclenchement.** Cette extraction se fait au début de toute session qui reprend après une
compaction (reconnaissable au résumé de conversation fourni en tête de session, exactement le
mécanisme qui a permis d'écrire ce paragraphe) — jamais en continu, jamais pendant le travail actif.
L'agent lit ce résumé (déjà présent dans son contexte, aucun appel supplémentaire nécessaire),
compare les signaux de collaboration qui s'y trouvent à l'état déjà écrit dans §8/§9 et dans la
dernière fiche de `docs/profil-utilisateur/`, écrit une nouvelle fiche datée dans
`docs/profil-utilisateur/observations/`, ajoute une ligne à `docs/profil-utilisateur/index.md`, et
ne touche à §8/§9 que si la règle de corroboration ci-dessus est déjà remplie — jamais avant.
Zéro coût API (lecture + écriture de texte), jamais mécanisable (comme la checklist qualitative
d'HYPER-SCAN-CHECKPOINT) : un vrai raisonnement à chaque fois, jamais une routine automatique.

**Pas de hook global forcé — décision explicite.** L'idée d'un vrai déclenchement obligatoire, via
un hook Claude Code au niveau global (`~/.claude/`, comme le hook existant qui bloque sur des
changements non commités), a été explicitement envisagée puis écartée par l'utilisateur le même
jour : rester sur la même base que le reste de la charte (une lecture complète de `CLAUDE.md`/ce
document à chaque reprise de session, déjà exigée ailleurs) plutôt que d'ajouter un réglage global
qui dépasserait ce seul projet.

**Ce qui compte comme signal, ce qui n'en est jamais un.** Seule la FAÇON dont l'utilisateur
collabore, décide et réagit est un signal de profil (rythme, calibrage, réaction à un imprévu,
rapport à la preuve, ton) — jamais le CONTENU sur lequel porte la collaboration (un choix créatif
pour Lia/Noé, une décision d'architecture d'un outil) : confondre les deux romprait la promesse même
de ce document (§0 : registre strictement professionnel/projet, jamais une donnée personnelle hors
de ce cadre).

## 10. Règles de suivi — ne jamais rien perdre

*(Ajouté le 2026-09-19, à la demande explicite de l'utilisateur : « il faut penser à gérer mes
interventions quand je t'interromps ou que je construis mes idées en plusieurs prompts [...] un
système qui nous sert à savoir toujours où on en est, ce qu'il nous reste à faire, les idées bien
stockées pour plus tard, rien ne passe à la trappe ». Rattaché ici plutôt qu'à un document séparé
(question posée et tranchée explicitement le même jour) : c'est une méthode de travail, pas un
outil technique nouveau à construire — elle s'appuie sur ce qui existe déjà (liste de tâches de
l'agent, feuille de route de `CLAUDE.md`, `docs/referentiel/points-fragiles.md`) plutôt que
d'ajouter un document de plus à maintenir en double. Opérationnalise les observations déjà faites
aux sections 8 et 9 ci-dessus (spécification itérative, rafales de messages fragmentés) en une
procédure concrète, pas seulement un trait de profil à connaître.)*

**Extraction partielle vers un document dédié, le même jour** (demande explicite de l'utilisateur,
une fois le sujet devenu plus large qu'une méthode : « je veux aussi que toutes les tâches soient
historisées dans un dossier local, avec un fichier par session [...] on exporte cette partie dans un
nouveau document ? »). Cette section garde la MÉTHODE (les trois cas ci-dessous, la règle de mise à
jour d'une même entrée, l'arborescence sur demande) — c'est `docs/systeme-de-suivi.md` qui porte
désormais la STRUCTURE DE STOCKAGE complète (dossier `docs/suivi/`, un fichier par session, un
fichier d'index, la taxonomie à quatre attributs par tâche — horodatage, sujet, sous-sujet, degré de
sensibilité). Même raisonnement que pour le tableau de bord KPI : une fois qu'un sujet de méthode
prend la forme d'un vrai sous-système avec ses propres fichiers, il mérite son propre document
plutôt que de continuer à grossir ici.

**Trois cas face à un message reçu pendant que l'agent travaille déjà sur autre chose**, à
distinguer systématiquement (confirmé explicitement par l'utilisateur) :
1. **Une idée ou une demande pour plus tard** → l'agent l'enregistre immédiatement (tâche créée
   dans sa liste de suivi technique, et dans `CLAUDE.md`/`points-fragiles.md` si elle concerne le
   contenu du projet ou une décision de conception) puis continue ce qu'il était en train de faire,
   sans dévier. Un accusé de réception bref confirme que c'est noté (jamais un silence).
2. **Une question à laquelle l'utilisateur attend une réponse** → l'agent répond tout de suite, dans
   le fil de sa réponse en cours, puis reprend le travail interrompu.
3. **Un changement de cap sur ce que l'agent est en train de faire** → l'agent s'adapte
   immédiatement, sans attendre d'avoir fini l'étape en cours si le changement la rend caduque.

**Une idée précisée en plusieurs messages successifs met à jour la MÊME entrée**, jamais une
nouvelle entrée par précision. Le suivi doit refléter l'état actuel et complet de l'idée, pas
l'historique de sa formulation — l'historique complet reste de toute façon consultable dans la
conversation elle-même si besoin d'y revenir.

**Fiabilisation ajoutée le 2026-09-19, à la demande explicite de l'utilisateur** (« assure-toi que
le système mis en place booste réellement le tracking [...] mémoire, organisation, adaptabilité,
performance, résultats »). Quatre points faibles identifiés en relisant la première version de
cette section, corrigés ici plutôt que laissés comme une déclaration d'intention non vérifiée
(cf. section 9 : « le contrôle passe par la preuve ») :

- **Mémoire réellement durable, pas supposée.** La liste de tâches technique de l'agent n'a
  jamais été confirmée comme survivant au-delà d'UNE session de travail — rien ne garantit qu'une
  toute nouvelle session sur ce projet la retrouve. La règle de sync ci-dessus (« et dans
  `CLAUDE.md`/`points-fragiles.md` si... ») était donc trop permissive : reformulée en **règle
  stricte** — tout ce qui doit survivre à la fin de la session en cours (une décision non
  tranchée, une idée pas encore traitée, un chantier commencé mais pas fini) reçoit une trace dans
  un fichier versionné (`CLAUDE.md`, `points-fragiles.md`, ou le document `docs/referentiel/`
  concerné) **au moment même où elle est notée**, jamais différée à « si j'y pense en fin de
  session ». La liste de tâches technique reste utile comme vue de travail RAPIDE pendant la
  session, mais n'est jamais la seule trace d'un élément qui compte.
- **Organisation qui ne se dégrade pas avec le volume.** Une liste qui grossit indéfiniment
  (79 entrées à ce jour) sans jamais être reconsidérée devient elle-même un obstacle à s'y
  retrouver — l'inverse de l'objectif. À chaque revue de fond (même déclencheur que la relecture
  périodique de l'Article 13 de `CLAUDE.md`), l'agent profite de l'occasion pour clore comme
  « terminé » ou « dépassé » toute tâche technique dont l'objet a été atteint autrement ou n'est
  plus pertinent (déjà fait une fois cette session pour une tâche devenue obsolète après plusieurs
  simulations) — jamais une purge systématique en dehors de ces revues, qui risquerait de faire
  disparaître un fil encore utile.
- **Frontière de synchronisation testable, pas floue.** Plutôt que « si elle concerne le contenu
  du projet » (difficile à trancher dans le feu de l'action), la question à se poser est concrète :
  *si la session s'arrêtait maintenant, est-ce que cette information manquerait à qui reprend le
  projet ?* Si oui, elle va dans un fichier versionné, immédiatement, pas seulement dans la liste de
  tâches technique.
- **Auto-vérification, pas une confiance aveugle dans la procédure.** Quand l'arborescence complète
  est demandée (section suivante), l'agent ne se contente pas de la lister : il vérifie qu'aucune
  des trois sources (liste de tâches, feuille de route, points-fragiles.md) ne contredit les deux
  autres (un point classé « fait » d'un côté et encore « ouvert » de l'autre serait lui-même un bug
  de suivi, traité comme tel, cf. Article 3 de `CLAUDE.md`) — la preuve que le système fonctionne
  réellement est cette absence de contradiction constatée, pas la simple existence de la procédure.

**L'arborescence complète (tout ce qui est fait/en cours/à venir) se montre sur demande
explicite uniquement**, jamais spontanément à chaque chantier terminé — décidé explicitement pour
ne pas alourdir systématiquement les réponses. Quand elle est demandée, elle rassemble les trois
sources à jour (liste de tâches technique de l'agent, feuille de route de `CLAUDE.md`, registre
`points-fragiles.md`), jamais une seule vue partielle présentée comme complète.

**Le profil observé aux sections 8 et 9 est la référence à consulter en cas de doute** sur la
façon d'interpréter un message ambigu (rafale de messages, coquille, revirement apparent) — cette
section-ci dit COMMENT suivre le travail dans la durée, ces sections-là disent COMMENT interpréter
l'utilisateur au moment où le message arrive ; les deux se complètent, jamais l'une à la place de
l'autre.

**Idées dites en avance sur un « gros chantier » → fichier préliminaire dédié (2026-09-22, demande
explicite de l'utilisateur : « lorsqu'une idée est dite en avance au sujet d'un chantier à venir,
cette idée est automatiquement enregistrée sur un fichier préliminaire dédié [...] surtout si le
chantier en question est un gros morceau du projet comme CASSANDRA ou la refonte »).** Distinct des
trois cas ci-dessus (qui couvrent toute idée, petite ou grande, vers la liste de tâches technique
générale) : une idée qui concerne spécifiquement un chantier déjà identifié comme un gros morceau du
projet ne suffit pas à rejoindre ce suivi générique — elle doit être consignée LE MÊME TOUR dans le
fichier préliminaire dédié à ce chantier précis. Ce patron existait déjà en pratique, sans avoir été
nommé explicitement jusqu'ici (`docs/cassandra-rh-conception.md` pour CASSANDRA-RH,
`docs/referentiel/regles-des-graphismes.md` pour la refonte graphique) — la règle rend cette
discipline explicite plutôt que de compter sur le simple réflexe.

*Registre des chantiers connus → fichier préliminaire, à tenir à jour à chaque nouveau chantier de
cette ampleur reconnu :*
- CASSANDRA-RH → `docs/cassandra-rh-conception.md`
- Refonte graphique → `docs/referentiel/regles-des-graphismes.md`
- Outil concordance/évolutivité (2026-09-21, potentiel 6e Gardien sacré) → `docs/concordance-evolutivite-conception.md`
- Agence exportable comme gabarit générique (2026-09-21, explicitement pour bien plus tard) → `docs/agence-exportable-conception.md`

**Ce qui distingue un « gros morceau » d'une idée ordinaire** : un chantier qui va occuper plusieurs
sessions de construction, avec ses propres arbitrages de conception à accumuler AVANT que le premier
code ne soit écrit — le critère déjà appliqué de fait à CASSANDRA-RH et à la refonte graphique. Une
idée ponctuelle sur un outil déjà existant (une amélioration, un bug) reste sur son registre habituel
(`docs/referentiel/points-fragiles.md`, ou directement corrigée) — jamais dans un fichier
préliminaire, qui grossirait sans discrimination sinon. Un nouveau chantier de cette ampleur reçoit
son propre fichier créé DÈS la première idée exprimée à son sujet, jamais une idée qui attend qu'un
fichier existe pour être notée.

**Vérification, jamais seulement une intention déclarée** (même discipline que le reste de cette
section : « le contrôle passe par la preuve »). **Corrigé le 2026-09-22, remarque directe de
l'utilisateur** (« je pensais à check-tasks-details plutôt, non ? ») — le premier réflexe (THE-
DEEP-READER) visait trop haut pour le cas le plus fréquent : THE-DEEP-READER relit l'historique
COMPLET de la conversation, un vrai appel d'agent séparé, coûteux (Article 22/SMART-CONSO-TOKEN à
consulter avant chaque lancement). Pour le cas courant — une idée déjà notée en tâche de suivi
(`docs/suivi/`) mais pas encore recopiée dans son fichier préliminaire — **check-tasks-details est
le bon outil, gratuit et déjà construit** : il lit déjà le thème de chaque tâche (`splitSujet()`,
ex. « Conception / Nouvel outil (CASSANDRA-RH) ») ; une extension naturelle (pas encore codée)
compare la date de la dernière tâche de suivi sur un chantier connu à la date de dernière
modification de son fichier préliminaire (même patron que `lastTouchDays()`, déjà réutilisé
ailleurs) et signale un écart — mécanique, zéro coût API. **THE-DEEP-READER reste utile, mais
seulement pour le cas plus rare et plus profond** : une idée dite en conversation qui n'aurait
JAMAIS atteint `docs/suivi/` non plus — un angle mort que check-tasks-details ne peut structurellement
pas voir, puisqu'il ne lit jamais la conversation elle-même. Les deux se complètent en couches
(gratuite d'abord, coûteuse seulement si la première ne suffit pas), jamais l'une à la place de
l'autre.

**Toute idée nouvelle, pas seulement les « gros chantiers » nommés → question à 3 voies EN TEMPS
RÉEL (2026-09-21, demande explicite de l'utilisateur : « à chaque fois que je propose une nouvelle
idée [...] cette fenêtre devrait s'ouvrir »).** Généralise le patron ci-dessus au-delà des seuls
« gros morceaux » nommés (CASSANDRA-RH, refonte graphique...) : dès qu'une idée de nouvel outil ou de
conception nouvelle est développée en conversation — la mienne comme celle de l'utilisateur — le
réflexe PRINCIPAL et immédiat est de poser, via une fenêtre à choix dédiée (format Article 16), la
question à 3 voies :
1. Créer un fichier préliminaire dédié à cette idée précise (comme pour un « gros chantier »
   ci-dessus, à toute échelle — pas seulement les quatre déjà nommés dans le registre).
2. Abandonner l'idée (décision réservée exclusivement à l'utilisateur, jamais déduite par l'agent).
3. « Entre-deux » : l'idée reste notée (dans `docs/suivi/` comme toute tâche substantielle, cf.
   Article 13/`docs/systeme-de-suivi.md`) mais aucun fichier n'est créé pour l'instant — décision
   explicitement réversible dans les deux sens (relancer une idée abandonnée, ou au contraire
   abandonner une idée restée entre-deux), jamais un état figé.

Une décision « entre-deux » n'est jamais définitive : elle reste ouverte tant que l'utilisateur n'a
pas explicitement tranché pour un fichier ou un abandon. **Ce réflexe en temps réel est le mécanisme
PRINCIPAL** — poser la question au moment même où l'idée est formulée, jamais différée. Le signal
CIRCLE-TASKS `idee-a-trancher-signal` (cf. `scripts/circle-tasks.mjs`,
`docs/idees-a-trancher.md`) est un FILET DE SÉCURITÉ MÉCANIQUE, jamais un substitut : il rattrape
une idée pour laquelle ce réflexe en temps réel aurait été oublié dans le feu de la conversation,
en la reposant à chaque Ronde tant qu'aucune décision définitive (fichier créé ou abandon) n'est
enregistrée dans `docs/idees-a-trancher.md`. L'avantage de la Ronde, précisément, est d'être
mécanique et donc impossible à zapper — contrairement au réflexe en temps réel, qui reste une
discipline humaine (de l'agent) faillible. Toute décision, qu'elle vienne du réflexe en temps réel
ou du signal de Ronde, se consigne dans `docs/idees-a-trancher.md` (table « Idées nouvelles »),
jamais seulement dans la conversation.

---

# Partie B — Spécificités propres à Claude Code

*(Ajoutée le 2026-09-19, à la demande explicite de l'utilisateur — cf. note en tête de document.
Tout ce qui suit dépend du harnais Claude Code précis utilisé pour ce projet, pas d'un principe de
collaboration général. Une IA reprenant le projet avec un autre outil doit relire cette partie
comme une LISTE DE QUESTIONS à se poser sur son propre outil, pas comme des instructions à copier
telles quelles.*

## B.1. Outils concrets derrière les règles universelles de la Partie A

- **Livraison de fichiers (règle universelle : section 7)** : Claude Code dispose d'un outil dédié,
  `SendUserFile`, qui envoie un vrai fichier (transcript, dossier retourné, journal JSON) comme
  pièce jointe distincte de la réponse textuelle. Une IA sans équivalent direct doit au minimum
  écrire le contenu dans un fichier du dépôt ou de son espace de travail et donner son chemin
  exact, plutôt que de coller un document long en clair dans la conversation (l'esprit de la règle
  — ne jamais noyer une transcription longue dans le texte de la réponse — prime sur l'outil
  précis).
- **Questions de calibrage (règle universelle : section 2)** : Claude Code dispose d'un outil dédié
  (`AskUserQuestion`) qui structure les questions en options cliquables. Le format `[Calibrage]`
  etc. décrit en section 2 fonctionne aussi bien en texte libre pour une IA qui n'aurait pas
  d'équivalent structuré.
- **Suivi de tâches (mentionné implicitement dans tout ce document)** : Claude Code propose un
  gestionnaire de tâches interne (`TaskCreate`/`TaskUpdate`) qui n'est qu'un aide-mémoire pour
  l'agent lui-même, jamais une source de vérité pour l'utilisateur — ne remplace aucune des
  vérifications de la section 3.

## B.2bis. Estimation en début de réponse — temps et consommation de tokens

*(Ajouté le 2026-09-19, à la demande explicite de l'utilisateur : « au début de chaque réponse,
peux-tu me donner une estimation du temps de réponse, de la consommation de token ».)* Limite
honnête à poser avant la règle elle-même (même logique que B.2 pour le compactage) : l'agent n'a
**aucune mesure exacte, en avance, du temps que prendra une réponse ni du nombre de tokens qu'elle
consommera** — ni chronomètre interne, ni compteur de tokens en temps réel pendant la génération.
Le seul repère réellement disponible est un compteur de budget de session encore restant,
communiqué à l'agent par bribes dans certains tours (pas à chaque tour), qui indique un total
restant pour toute la session, jamais un coût par réponse individuelle.

En conséquence, la règle appliquée est une **estimation qualitative honnête**, jamais un chiffre
précis présenté à tort comme une mesure :

- **Format précisé le 2026-09-19, à la demande explicite de l'utilisateur** (« affiche-les en
  petit caractère au début de chaque réponse, avec juste les icônes que tu as choisies et les
  valeurs à afficher : très bas à très haut ») : une ligne unique, discrète (texte en italique,
  la seule façon d'obtenir un rendu visuellement plus petit dans ce terminal en Markdown —
  CommonMark n'a pas de véritable taille de police réduite, limite honnête à ne pas déguiser),
  avec seulement les deux icônes déjà choisies et une valeur sur une échelle, jamais de texte
  explicatif à côté.
  - **⏱️** = temps de réponse estimé.
  - **🔢** = consommation de tokens estimée.
  - **Échelle élargie à 9 crans le 2026-09-19**, à la demande explicite de l'utilisateur (« est-il
    possible d'améliorer un peu ce système, avec une échelle plus fine... et de s'assurer que
    tout est bien mis en place à ce niveau, avec une évaluation la plus juste possible ») —
    remplace l'ancienne échelle à 5 crans, jugée trop grossière : minimum, très bas, bas, assez
    bas, moyen, assez haut, haut, très haut, maximal. Un seul niveau retenu par icône à chaque
    réponse (les 8 autres ne sont pas affichés) : `*⏱️ [niveau] · 🔢 [niveau]*`.
  - **Repères de calibrage** (pour rester cohérent d'une réponse à l'autre, même sans mesure
    réelle — cf. limite honnête ci-dessus) : *minimum* = une ligne de texte, zéro outil ;
    *très bas* = une poignée de lectures/recherches ciblées, pas d'édition ; *bas* = une ou deux
    éditions simples sur un fichier déjà connu ; *assez bas* = plusieurs éditions ou une
    investigation de code courte ; *moyen* = lecture + édition sur plusieurs fichiers, ou une
    suite de tests standard ; *assez haut* = plusieurs fichiers modifiés avec vérification
    (tsc/tests) ; *haut* = chantier multi-fichiers avec documentation à jour et tests complets ;
    *très haut* = plusieurs séries de questions/réponses structurées, gros volume de texte à
    produire, ou plusieurs commandes lourdes ; *maximal* = simulation complète de bout en bout
    (Article 18) ou refonte touchant à la fois code, tests et plusieurs documents de référence.
- Cette estimation est basée sur la NATURE de la tâche qui s'annonce (nombre d'outils prévus,
  taille des fichiers à lire, présence ou non d'une commande longue comme une simulation ou une
  compilation), pas sur une mesure réelle — elle peut donc se révéler fausse après coup, ce qui
  n'est jamais caché : si la réponse s'avère nettement plus longue que prévu en cours de route,
  l'agent le signale plutôt que de laisser l'estimation initiale sans mise à jour.
- Si un futur harnais Claude Code expose une vraie mesure (temps réel, compteur de tokens par
  réponse), cette section est corrigée le jour même pour refléter la mesure réelle disponible,
  au lieu de garder une estimation qualitative devenue inutilement approximative (même exigence de
  mise à jour proactive qu'ailleurs dans ce document).

## B.2. Compactage de session — pas de barre de progression possible

*(Ajouté le 2026-09-19, en réponse à une question explicite de l'utilisateur : « as-tu la
possibilité d'afficher une barre de chargement qui indique où le compactage en est ? ».)* Réponse
vérifiée, pas supposée : **non, cette capacité n'existe pas**, et ce n'est pas un choix de l'agent
mais une limite structurelle du harnais tel qu'il se présente à l'agent aujourd'hui —
- Le compactage (résumé automatique des tours anciens quand la conversation approche la limite de
  contexte) est déclenché et exécuté par le runtime Claude Code **entre deux tours**, jamais par un
  appel d'outil que l'agent effectue lui-même : il n'existe donc aucun moment où l'agent pourrait
  émettre un signal de progression, puisqu'il n'a lui-même connaissance de l'opération qu'une fois
  celle-ci terminée (le résumé apparaît directement dans le tour suivant, sans étape intermédiaire
  observable).
- Aucun outil de la liste actuellement disponible à l'agent (`Agent`, `Artifact`, `Bash`, etc., ni
  les outils différés listés en système) n'expose de mécanisme de notification de progression pour
  ce processus interne.
- Si un futur harnais Claude Code exposait un tel mécanisme (outil ou signal dédié), cette section
  serait à corriger le jour même (même exigence de mise à jour proactive qu'ailleurs dans ce
  document) plutôt que de laisser cette limite affichée comme définitive après qu'elle a cessé
  d'être vraie.
- Ce que l'agent peut faire à la place, déjà en pratique dans ce projet : donner de courtes mises à
  jour d'avancement PENDANT un travail long et surveillable par lui (ex. une simulation en arrière-
  plan, cf. section 1) — mais ceci ne couvre pas le compactage lui-même, qui reste invisible à
  l'agent avant coup.
