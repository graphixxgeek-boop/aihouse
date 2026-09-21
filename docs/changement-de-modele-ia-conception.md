# Changement de modèle IA pour CIRCLE-TASKS — dossier de conception (préliminaire, non construit)

*(2026-09-21, idée formulée en conversation pendant la première Ronde CIRCLE-TASKS en mode AUTO,
consignée le même soir sur demande explicite de l'utilisateur — protocole complet de calibrage à
20 questions suivi avant tout enregistrement, cf. `docs/regles-de-travail.md`. Aucun code écrit :
statut choisi explicitement par l'utilisateur — « décrire et mettre de côté pour l'instant ».)*

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

## 3. Ce qui reste entièrement à faire (aucun code écrit)

- Écrire la vraie logique des 3 questions dans le flux de lancement de CIRCLE-TASKS (actuellement,
  l'agent ouvre directement la fenêtre AUTO/PRIME/GOAT sans cette étape préalable).
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
obligatoire. Testé (`scripts/check-house.mjs`). Reste honnêtement hors de portée mécanique : aucun
garde-fou ne peut vérifier que Q1/Q2/Q3 ont bien été posées en conversation — circle-process-guardian
ne couvre pas ce protocole aujourd'hui (extension future possible, jamais engagée maintenant).
