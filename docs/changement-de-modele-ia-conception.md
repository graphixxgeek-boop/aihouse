# Changement de modèle IA pour CIRCLE-TASKS — dossier de conception (CONSTRUIT)

*(2026-09-21, idée formulée en conversation pendant la première Ronde CIRCLE-TASKS en mode AUTO,
consignée le même soir sur demande explicite de l'utilisateur — protocole complet de calibrage à
20 questions suivi avant tout enregistrement, cf. `docs/regles-de-travail.md`. À sa création, aucun
code écrit — statut choisi explicitement par l'utilisateur : « décrire et mettre de côté pour
l'instant ». **Construit depuis, le 2026-09-22 ; l'en-tête disait encore le contraire au 2026-09-23,
corrigé ce jour-là.**)*

> **Ce document a menti pendant deux jours, et voici comment il s'est fait prendre.** Son titre
> annonçait « préliminaire, non construit », son en-tête « aucun code écrit », son §3 « ce qui reste
> entièrement à faire » et son §4 « aucun garde-fou ne peut vérifier que Q1/Q2/Q3 ont bien été
> posées » — alors que le protocole était construit depuis le 2026-09-22 ET que son garde-fou
> mécanique existait depuis le 2026-09-23. Rien de récent ne l'avait touché, donc la règle « mettre
> à jour le jour même » ne pouvait rien : c'est exactement l'écart que la **relecture périodique**
> de l'Article 13 est faite pour attraper. Ce qui l'a attrapé le 2026-09-23 est mécanique :
> `check-house.mjs` bloque un commit quand une tâche du suivi est plus récente que le fichier
> préliminaire de son chantier. Le déclencheur est anecdotique — la correction de 44 horodatages
> dans le futur a rendu la tâche #468 « plus récente » que ce fichier — mais le défaut qu'il a
> exposé était réel et vieux de deux jours. Un garde-fou qui mord pour une mauvaise raison et
> trouve une vraie faute reste un bon garde-fou.

## 1. Idée de l'utilisateur (formulation d'origine)

Ajouter, au lancement de la Ronde CIRCLE-TASKS, un petit protocole de confirmation en 3 questions
successives, pour permettre à l'utilisateur de faire tourner un autre modèle/agent IA (par exemple
Opus) pendant que Claude exécute la Ronde, puis de revenir à son modèle habituel :

1. **Q1, toujours posée en premier lors du lancement d'une Ronde** : « Voulez-vous changer de
   modèle/agent IA pour exécuter la Ronde ? »
   - Si **non** → déroulement habituel de la Ronde, sans autre question.
2. **Si oui à Q1, Q2** : « Voulez-vous revenir à votre modèle actuel, avant ou après l'édition des
   rapports et de l'analyse générale ? »
   - Si **avant** → une pause est prévue entre l'exécution des scans et la rédaction des rapports,
     matérialisée par **Q3** : « Vous pouvez maintenant revenir au modèle/agent IA précédent,
     est-ce que c'est ok ? »
   - Si **après** → déroulement habituel, avec un rappel final une fois les analyses terminées :
     « Voulez-vous maintenant revenir au modèle précédent (dernier rappel) ? »
3. La gestion exacte de la réponse à Q3 (« ok » / « pas encore ») est laissée à l'appréciation de
   l'agent, à calibrer via les questions ci-dessous.

## 2. Réponse synthétisée (calibrage complet, 20 questions posées, toutes répondues)

**Objectif réel, précisé lors de la dernière question de calibrage** — ce n'est pas seulement « libérer
l'accès au modèle habituel pendant un travail répétitif » : l'utilisateur veut pouvoir switcher de
modèle **de façon très sécurisée et très bornée**, à des **repères de switch définis par l'agent qui
pilote** (jamais improvisés ni intempestifs) — pour obtenir des **phases proprement découpées**
pendant lesquelles un autre modèle (ex. Opus) tourne à sa place. Le rôle de l'agent est donc de
proposer des points de bascule sûrs (avant les scans, après les scans), pas seulement de répondre à
une demande de switch à n'importe quel moment.

**Décisions actées, point par point :**

- **Portée** : uniquement CIRCLE-TASKS pour l'instant — pas les autres tâches longues (simulation,
  audits coûteux). L'utilisateur note toutefois que ces deux cas (simulation, audits coûteux comme
  THE-FINAL-JUDGE) lui semblent également pertinents pour une extension future, « à préciser peut-être »
  — noté comme piste ouverte, jamais engagée maintenant.
- **Sens de « changer de modèle »** : changer le modèle Claude qui exécute CETTE conversation (via
  les réglages de Claude Code), pas passer à un outil IA totalement différent en dehors de la
  conversation.
- **Qui bascule techniquement** : l'utilisateur lui-même, dans ses propres réglages — l'agent n'a
  aucune main sur ce réglage et ne peut jamais le faire à sa place.
- **Pendant l'attente d'un changement « avant »** : l'agent attend simplement la confirmation de
  l'utilisateur, sans limite de temps ni relance automatique.
- **Le moment de la pause « avant »** : une seule pause, une fois TOUS les scans de la Ronde
  terminés — jamais plusieurs pauses intermédiaires par lot.
- **Rédaction des rapports dans le cas « après »** : l'agent écrit les rapports et l'analyse tout de
  suite, sans attendre le retour de l'utilisateur — la vérification de retour n'intervient qu'à la
  toute fin, sous forme d'un rappel.
- **Le rappel final (cas « après »)** : toujours posé, systématiquement, même si rien dans la
  conversation ne laisse penser que l'utilisateur n'est pas encore revenu. Le texte doit indiquer
  clairement qu'il s'agit du DERNIER rappel (garder la mention « dernier rappel » entre parenthèses,
  comme formulé dans l'idée d'origine). Si la réponse à ce dernier rappel est négative, l'agent
  n'insiste plus : il continue son travail normalement, la question devient purement informative une
  fois le dernier rappel passé.
- **Détection technique du modèle réellement actif** — point clé validé explicitement : l'agent
  dispose d'un moyen de vérifier lui-même quel modèle l'exécute réellement (outil de diagnostic de
  session). Cette capacité doit être utilisée pour fiabiliser le processus, **mais sans jamais
  retirer l'étape manuelle** où c'est l'utilisateur qui déclenche/confirme chaque changement — la
  vérification technique ne remplace jamais la confirmation humaine, elle sert uniquement à repérer
  un désaccord (l'utilisateur dit être revenu, mais la vérification indique le contraire, ou
  l'inverse) et à le signaler clairement plutôt qu'à trancher seul. L'agent pose donc TOUJOURS la
  question de confirmation ; il ne saute jamais l'étape même s'il pense déjà connaître la réponse.
- **Mémorisation de la réponse à Q1** : jamais mémorisée d'une Ronde à l'autre — la question est
  reposée systématiquement à chaque nouvelle Ronde, sans supposer que la réponse d'hier reste valable.
- **Absence de réponse à Q1** : traitée comme un « non » implicite — la Ronde continue normalement,
  sans changement de modèle, plutôt que de rester bloquée en attente.
- **Journalisation** : chaque Ronde doit garder une trace écrite de quel modèle/IA l'a réellement
  exécutée, dans son propre résumé (même discipline que les autres registres du projet qui notent
  déjà qui a fait quoi).
- **Déclenchement automatique/nocturne (sans utilisateur présent)** : la question Q1 est
  intégralement sautée, la Ronde se déroule normalement sans changement de modèle — jamais de
  blocage en attente d'une réponse qui ne viendra pas.
- **Annulation de la Ronde depuis Q1** : pas nécessaire — répondre « non » à Q1 suffit déjà à obtenir
  le déroulement normal, aucune option d'annulation séparée à ajouter.
- **Modes concernés** : les 3 modes de lancement (AUTO, PRIME, GOAT), sans exception — la question
  apparaît systématiquement en tout premier, quel que soit le mode choisi ensuite.
- **Statut de construction pour ce soir** : décrire et mettre de côté (ce document), rien codé
  maintenant.
- **Rappel pour la prochaine fois** — précision importante après une première proposition rejetée
  par l'utilisateur : **pas** un rappel mécanique câblé dans le code de CIRCLE-TASKS à chaque
  lancement de Ronde (ce serait justement construire une partie du mécanisme avant d'avoir tranché la
  conception) — un simple rappel **conversationnel, une seule fois**, à la prochaine occasion où une
  Ronde est évoquée. Ce document, relu par discipline avant toute nouvelle intervention sur
  CIRCLE-TASKS (Article 19), sert directement de mémoire pour ce rappel : aucun mécanisme
  supplémentaire à construire pour ça.
- **Nom retenu** : « changement-de-modele-IA » (confirmé par l'utilisateur comme désignant bien ce
  chantier).

## 3. Ce qu'il restait à faire au 2026-09-21 — TOUT A ÉTÉ FAIT DEPUIS

*(Section conservée telle quelle plutôt que supprimée : elle dit ce qui était ouvert à l'origine, et
l'effacer ferait disparaître le POURQUOI de ce qui a été construit ensuite (Article 27). Chaque
point ci-dessous est aujourd'hui clos — voir §4.)*

- ~~Écrire la vraie logique des 3 questions dans le flux de lancement de CIRCLE-TASKS (actuellement,
  l'agent ouvre directement la fenêtre AUTO/PRIME/GOAT sans cette étape préalable).~~ **FAIT** : Q1
  se pose désormais AVANT AUTO/PRIME/GOAT, et `FAITS_D_OUVERTURE` (`scripts/circle-tasks.mjs`)
  refuse d'ouvrir une Ronde sans elle.
- Décider du mécanisme exact de « vérification technique » à utiliser (quel outil de diagnostic de
  session, à quel moment de la conversation l'appeler, comment formuler un désaccord détecté).
- Décider comment la trace de journalisation (quel modèle a exécuté quelle Ronde) s'intègre au
  récapitulatif de fin de Ronde déjà existant (`buildCircleRunSummaryText()`), sans dupliquer un
  mécanisme déjà en place.
- Vérifier, le jour de la construction réelle, que rien n'a changé dans les capacités techniques de
  détection du modèle actif (l'outil de diagnostic de session peut évoluer).

## 4. Statut

**Construit le 2026-09-22** (demande explicite : « on enchaine tout de suite »). Le protocole en 3
questions est désormais un comportement conversationnel systématique de l'agent, documenté noir sur
blanc dans `docs/regles-de-travail.md` (juste avant le garde-fou AUTO/PRIME/GOAT) : Q1 posée avant
même AUTO/PRIME/GOAT dans les 3 modes, Q2/Q3 selon la réponse, vérification technique via
`get_session` en appui (jamais en remplacement) de la confirmation manuelle, absence de réponse
traitée comme un « non », question intégralement sautée en mode nocturne/autonome. Seule partie
codée : la journalisation (`executedByModel`, nouveau paramètre optionnel de
`buildCircleRunSummaryText()`/`buildCircleRunSummaryHtml()`, `scripts/circle-tasks.mjs`) — une note
ajoutée au récapitulatif de fin de Ronde nommant le modèle réellement utilisé, jamais un champ
obligatoire. Testé (`scripts/check-house.mjs`).

**CE PARAGRAPHE DÉCLARAIT UNE IMPOSSIBILITÉ QUI A ÉTÉ LEVÉE LE 2026-09-23** *(tâche #468 ;
formulation d'origine conservée ci-dessous parce qu'une impossibilité levée est plus instructive
qu'une impossibilité jamais écrite)* :

> « Reste honnêtement hors de portée mécanique : aucun garde-fou ne peut vérifier que Q1/Q2/Q3 ont
> bien été posées en conversation — circle-process-guardian ne couvre pas ce protocole aujourd'hui. »

**C'était vrai pour le mauvais objet.** Personne ne peut PROUVER qu'une question a été posée en
conversation — c'est exact et ça le restera. Mais on peut exiger que l'agent le DÉCLARE, et compter
son silence comme un manquement : exactement le patron d'AUTO/PRIME/GOAT, qui vit avec la même
impossibilité depuis toujours. `verifyRondeProcess()` vérifie donc `changement-de-modele` (Q1) et
`retour-de-modele` (Q3, dû UNIQUEMENT si la réponse à Q1 était « oui » — le réclamer autrement
ferait crier le contrôleur sur le cas de loin le plus fréquent, ce qui apprend à l'ignorer). Cinq
assertions couvrent les cinq régimes réels, dont les deux qui doivent rester silencieux.

**La leçon, et elle vaut au-delà de ce document** : « aucun mécanisme n'est possible » mérite d'être
réexaminé avant d'être recopié. Ici, l'impossibilité portait sur la PREUVE ; le mécanisme possible
portait sur la DÉCLARATION. Confondre les deux avait laissé une obligation reposer sur la seule
mémoire de l'agent — ce que l'Article 27 interdit — et elle est tombée au premier essai réel.

---

## Sa demande du 2026-09-26 — anticiper le changement de modèle, et NE PAS se servir de soi-même comme étalon

*(Reprise intégrale de son gros prompt du soir. Elle entre ici plutôt qu'au seul suivi : c'est
exactement le trou que la STRATÉGIE DE CHANTIER existe pour fermer — une idée notée dans la file et
jamais recopiée dans le document du chantier qu'elle concerne. Le garde-fou de fraîcheur des
fichiers préliminaires l'a attrapée le soir même.)*

> « safe export : l'outil vérifie les exports, et aussi à la marge : qu'un changement de modèle
> CLAUDE (opus, fable…) en cours de route est fluidifié grâce à l'outil, le relai se fait de manière
> propre et complète (mémoire, ligne de conduite, process, etc) et exportable - obligé - je ferais
> des test à un moment donné, de repasser à une version inferieure pour voir si l'agence tient dans
> ces conditions, et aussi un test en passant par un modèle plus puissant (FABLE), je ferai des
> tests : anticipe sur ca stp. L'agence devrait tourner sur un modèle moins puissant que toi, tu ne
> dois pas te servir de toi même pour calibrer ca (sujet export, donc). »

**OBJECTIF qu'il formule** : « CONSTRUIRE LE CODE DE MANIERE A ANTICIPER SUR UN CHANGEMENT
D'ENVIRONNEMENT GENERAL (CHANGEMENT IA) OU LOCAL (MODELE DIFFERENT AU SEIN D'UNE MEME IA) ».
**ATTENDU** : mise à jour de l'outil.

### Ce que cette consigne interdit, et c'est la partie la plus dure

« **tu ne dois pas te servir de toi même pour calibrer ca** » est une contrainte méthodologique
sévère, et elle est juste. Un agent qui juge « est-ce que l'Agence est compréhensible ? » en se
lisant lui-même répond toujours oui : il a écrit les documents, il en connaît les raisons non
écrites, et il comble les trous sans s'en apercevoir. **Le seul calibrage honnête passe par des
critères MÉCANIQUES qui ne dépendent pas de qui lit** — un chemin cité existe-t-il, une règle
a-t-elle un porteur nommé, un nom propre a-t-il une définition atteignable — jamais par une
impression de clarté.

C'est déjà ce que fait SAFE-EXPORT avec `findRaisonsPerdues()` et `findGardienAmbigu()`. Ce qui
manque, c'est le reste du relai : mémoire, ligne de conduite, process.

### Ce qui existe déjà, et qui sert au relai sans avoir été conçu pour ça

- **`.agent-session.json`** — l'identité du modèle en cours, déposée à chaque session autonome.
  C'est le seul endroit du dépôt qui sait QUEL modèle a produit quoi.
- **L'Article 27** (« le projet doit rester reprenable par une AUTRE IA, à tout moment ») est déjà
  la règle de fond. Il vise une autre IA ; un autre modèle de la même IA en est un cas particulier
  plus facile, jamais un cas différent.
- **Les blueprints génériques** portent le POURQUOI, qui survit au changement de modèle comme au
  changement de langage.
- **Le registre des leçons** (`docs/referentiel/lecons.md`) porte ce que le projet a appris en se
  trompant — c'est la mémoire qu'un modèle entrant n'a pas.

### Ce qui manque, et qui reste à construire

1. **Rien ne mesure ce qu'un modèle MOINS PUISSANT perdrait.** Le test qu'il annonce (repasser à une
   version inférieure) n'a aucun instrument pour être lu : il faudrait savoir à l'avance quelles
   obligations de la charte dépendent d'une capacité de raisonnement, et lesquelles sont purement
   mécaniques. Les secondes tiennent sur n'importe quel modèle ; les premières non.
2. **Aucun document ne dit ce qui se passe AU MOMENT du basculement.** Le relai — ce que le modèle
   sortant doit laisser, ce que le modèle entrant doit lire en premier — n'est écrit nulle part.
3. **Le lien entre la version de l'Agence et le modèle qui l'a produite n'existe pas.** On sait
   quelle version d'un outil tourne ; on ne sait pas sous quel modèle elle a été écrite, donc on ne
   peut pas savoir ce qui se dégraderait en descendant.
