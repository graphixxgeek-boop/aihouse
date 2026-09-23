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
une demande explicite l'est.

### Le module qui porte cette règle : `scripts/messages-courts.mjs`

Le process héberge la règle ; le module en porte la DONNÉE, testée plutôt que laissée au jugement du
moment. Il n'est pas un outil de l'Agence et n'a rien en propre à documenter — il le déclare
lui-même (`export const PROCESS_HOTE = "semi-autonome"`), ce qui dispense de lui réclamer un
blueprint, une fiche et une place au catalogue.

**Trois natures d'un message court, jamais deux.** `arret` (la seule qui interrompt), `redirection`
(ce n'est pas du bruit, c'est la nouvelle tâche), `accompagnement` (on en tient compte sans lâcher).
La deuxième est l'ajout venu de la question « tu vois autre chose à ajouter ? » : traiter TOUT
message court comme du bruit serait l'erreur symétrique de s'arrêter à chaque fois, et personne ne
l'avait nommée.

**Le principe est dans le défaut, jamais dans la liste.** Continuer est la réponse normale ; les
formes reconnues ne servent qu'à AJOUTER un arrêt, jamais à en retirer un. Un mot d'arrêt inconnu
fait donc continuer — le côté sûr de l'erreur. C'est la seule façon d'écrire cette règle sans la
liste de mots figée que le corollaire de l'Article 17 interdit : ici, la liste ne peut jamais causer
le défaut qu'on répare.

**Les deux rappels, et ce qu'ils ne font pas.** Rappel léger dès le 2ᵉ message court, alerte plus
forte au 5ᵉ, tous deux calibrés pour nommer le coût sans le reprocher — et dans les deux cas, le
travail CONTINUE. Le premier message court est volontairement muet : compter dès le premier ferait
passer l'agent pour comptable de la conversation.

**Les seuils ne sont plus les siens** (2026-09-23, volets (b) et (c)). En branchant le comptage, on
a découvert que SMART-CONSO-TOKEN mesurait DÉJÀ la même chose — les rafales de messages courts —
avec d'autres chiffres : « court » à 240 caractères contre 180 ici, alerte au 4ᵉ contre 5ᵉ. Deux
compteurs de la même chose, aucun au courant de l'autre. La répartition retenue n'est pas
arbitraire : **SMART-CONSO-TOKEN garde la MESURE** (il tient le journal des tours, et ses chiffres
sont calibrés sur une série réellement observée), **ce module garde la RÈGLE** (que faire d'un
message court). Les seuils se DÉRIVENT donc de chez lui, ils ne s'y recopient pas — et le rappel du
2ᵉ message reste le chiffre que l'utilisateur a donné lui-même.

**Ce que ce branchement a révélé, et c'est le vrai gain** : les deux fonctions qui lisent et
écrivent ce journal déclaraient une racine de dépôt qui n'existait nulle part dans leur fichier.
Seuls les tests les appelaient, en injectant la leur. **L'alerte sur les rafales n'aurait donc
jamais pu tourner en vrai, pas une fois depuis sa construction.** Corrigé, et couvert par un test
qui appelle le chemin de production — celui qui n'avait jamais été exercé (leçon L15).

**Sa limite, déclarée plutôt que tue** (Article 27) : aucun mécanisme ne lit une conversation, donc
l'enregistrement des tours dépend de l'agent. Ce qui est garanti mécaniquement, c'est la RÈGLE, les
seuils et la lecture du journal — jamais que le journal soit tenu. `angel-of-ia-process` porte la
règle de conduite `messages-courts` et refuse d'être au vert sans réponse : même honnêteté que
tool-brain et que `resume-contextualise`.

## Son contrôleur

`scripts/god-of-all-process.mjs` (le contrôleur maître) pour le déroulé, et
`scripts/angel-of-ia-process.mjs` pour la conduite — les étapes 3, 4 et 6 ne se jouent que dans la
conversation, donc aucun mécanisme ne peut les lire sur disque : angel les **demande** et refuse
d'être au vert sans réponse. C'est la seule protection possible pour une règle de ce genre, et la
déclarer ainsi vaut mieux que de la confier à la mémoire d'un agent.
