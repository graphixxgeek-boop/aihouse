# Process « mode semi-autonome » — travailler seul pendant que l'utilisateur est là

*(Neuvième process déclaré, 2026-09-23. Demande de l'utilisateur, mot pour mot : « passe en mode
"semi autonome" : mode à creer dans les process : c'est comme le mode autonome, sauf que je suis
present et je peux repondre aux questions (doutes, calibrages...) ».)*

## Le problème qu'il ferme

Le projet ne connaissait que deux situations, et elles vivaient dans **un seul booléen**
(`nightAutonomousMode`, recopié à 31 endroits). Ce booléen portait en réalité deux questions qui
n'ont rien à voir :

- **l'utilisateur est-il là pour répondre ?**
- **une fenêtre de question a-t-elle le droit de bloquer ?**

Tant qu'il n'existait que le mode piloté et la nuit, les deux allaient toujours ensemble, donc les
confondre ne se voyait pas. Le mode semi-autonome les sépare pour de bon : **l'utilisateur EST là,
et pourtant rien ne doit s'arrêter.** Sans ce process, l'agent n'a que deux comportements
disponibles — attendre (ce que l'utilisateur interdit explicitement : « tu ne dois pas t'arreter »)
ou reporter la question à un retour qui n'a pas lieu d'être, puisqu'il est présent.

## Son déclencheur

L'utilisateur le demande explicitement (« passe en mode semi-autonome »), ou l'agent constate qu'il
travaille depuis plusieurs tours sans que l'utilisateur ne suive en direct. Le mode est **persisté**
(`.mode-de-travail.json`) : un agent qui reprend la session au milieu sait dans quel mode il est
sans avoir à le demander. La mémoire d'un agent ne survit pas à la session, un fichier oui
(Article 27).

## Ses étapes, chacune avec sa preuve

| # | Étape | Preuve |
|---|---|---|
| 1 | Déclarer le mode (`node scripts/modes-de-travail.mjs semi-autonome`) | `.mode-de-travail.json` existe et porte le bon slug |
| 2 | Avoir une file de tâches réelle, tirée du suivi durable | une ligne à jour dans `docs/suivi/sessions/` |
| 3 | Enchaîner sans s'arrêter, sauf pour poser une question | *aucune preuve mécanique possible — cela ne se joue que dans la conversation, et le dire vaut mieux que de le confier à la mémoire d'un agent* |
| 4 | Toute question passe par une **fenêtre dédiée**, jamais une phrase en texte libre | *idem — c'est angel-of-ia-process qui le DEMANDE et refuse d'être au vert sans réponse* |
| 5 | Une question posée ne bloque jamais : prendre une tâche de réserve | un commit postérieur à la question, sur un autre sujet |
| 6 | À chaque fin de tâche, un compte rendu contextualisé (Article 29) | *conversation seule — surveillé par angel, jamais prouvable sur disque* |

## Ce qu'il ne fait PAS, et ses tensions avec les voisins

**Il ne remplace pas le mode autonome (nuit).** La différence tient en une ligne : en mode autonome,
une question posée à personne n'est pas une vérification, c'est un blocage — elle est donc
**reportée**. En semi-autonome, elle est **posée tout de suite** et l'agent passe à autre chose : la
réponse arrivera.

**Il ne dispense d'aucune règle de la charte.** Le périmètre interdit reste interdit, la double
confirmation de l'Article 14 reste due, et une action sensible attend toujours une validation. Le
mode change le RYTHME, jamais les bornes.

**Tension réelle avec le mode piloté, et elle est tranchée** : en piloté, une fenêtre PEUT attendre
sa réponse, parce que l'échange est le travail. Croire qu'on est en piloté quand on est en
semi-autonome fait donc perdre du temps ; croire l'inverse fait prendre des décisions à la place de
l'utilisateur. C'est pour ça que le mode est écrit sur disque plutôt que supposé.

## Ce que l'agent fait quand TOUT dépend d'une réponse en attente

**Calibré par l'utilisateur en fenêtre le 2026-09-23**, contre les deux autres options qui lui
étaient proposées : il prend une **tâche de réserve** — documentation, couverture de tests, dette de
structure. Du travail réel, sans risque et sans décision de conception, donc **rien à défaire** s'il
tranche autrement.

Les deux options écartées, et pourquoi elles l'ont été :
- **avancer sur une hypothèse annoncée** — le plus rapide, mais il prend des choix de conception à
  sa place et produit du travail à jeter ;
- **s'arrêter et attendre** — sans risque, mais contredit sa consigne dès la première vraie question.

## La règle de conduite attachée, dite deux fois par l'utilisateur

> « tu ne dois pas t'arreter (fiabilise) sauf demande explicite de ma part »

Un message court, une question, une remarque en passant **ne sont pas** une demande d'arrêt. Seule
une demande explicite l'est. Cette règle est le sujet de la tâche #572, qui la rend surveillée
plutôt que simplement écrite.

## Son contrôleur

`scripts/god-of-all-process.mjs` (le contrôleur maître) pour le déroulé, et
`scripts/angel-of-ia-process.mjs` pour la conduite — les étapes 3, 4 et 6 ne se jouent que dans la
conversation, donc aucun mécanisme ne peut les lire sur disque : angel les **demande** et refuse
d'être au vert sans réponse. C'est la seule protection possible pour une règle de ce genre, et la
déclarer ainsi vaut mieux que de la confier à la mémoire d'un agent.
