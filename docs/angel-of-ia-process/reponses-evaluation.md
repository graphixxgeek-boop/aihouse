# Réponses de l'utilisateur à sa propre évaluation — registre

*(2026-09-22. Existe parce qu'il a identifié le trou lui-même : « pour que ma voix ait un retour
dans la mecanique d'evaluation ». Jusqu'ici l'évaluation était à SENS UNIQUE — je jugeais, il
lisait. Le registre de désaccords existait déjà mais il fallait qu'il pense à l'alimenter tout seul,
c'est-à-dire jamais. Une évaluation qu'on subit sans pouvoir répondre dans le mécanisme lui-même
n'est pas un outil de travail, c'est un bulletin.)*

**Quand** : à la fin de chaque Ronde, après la livraison du récapitulatif et **avant** la clôture
technique — son choix, et il est bien vu : la Ronde n'est pas considérée finie tant qu'il n'a pas
répondu, donc l'étape ne peut pas se sauter par oubli. Une étape placée après la fin serait
facultative en pratique.

**Sur quoi** : seulement les points problématiques — notes basses, régressions, constats de
pertinence durs. Risque assumé et écrit : un point qui va bien mais sur lequel il aurait une
objection ne lui sera jamais soumis.

**Les quatre réponses, et elles ne veulent pas dire la même chose pour la suite** :

| Réponse | Ce que ça déclenche |
|---|---|
| `accepte-corrige` | une **vraie tâche** dans `docs/suivi/` — un engagement qui ne devient pas une tâche est exactement le trou de l'Article 28 |
| `accepte-sans-corriger` | le constat reste remonté aux Rondes suivantes, avec sa raison ; arbitrage assumé et daté, jamais un classement sans suite |
| `conteste` | c'est **ma mesure** qui est en cause, pas son comportement — le juge concerné est à revérifier |
| `choix-assume` | le constat est juste mais cesse d'être compté comme un défaut ; affiché en information, jamais en reproche |

`conteste` et `choix-assume` ressemblent tous deux à un refus et s'opposent pourtant : l'un dit que
le constat est FAUX, l'autre qu'il est JUSTE mais délibéré.

**Mode autonome — l'exemption est CONDITIONNELLE, jamais une dispense.** Une Ronde lancée la nuit ne
peut évidemment pas lui poser de fenêtre, et le process nocturne prévaut. Mais exempter sans
reporter serait une perte sèche : les points problématiques de chaque Ronde nocturne
disparaîtraient en silence, et plus les nuits se multiplient, plus sa voix se réduit — jusqu'à un
dispositif qui ne l'interroge plus jamais tout en paraissant tourner. Les points partent donc en
attente (`reporterPointsAuProchainPassage`, registre `points-en-attente.json`), avec la date de la
Ronde qui les a produits ; la Ronde suivante en sa présence les pose **en premier**, en plus des
siens, étiquetés « en attente depuis le … ». Dédoublonnés sur l'identifiant, et c'est la date la
plus ANCIENNE qui est conservée : c'est elle qui dit depuis combien de temps on attend sa réponse,
qu'une date rafraîchie effacerait. Le gardien de la Ronde refuse une Ronde nocturne qui aurait des
points à poser et n'aurait rien reporté.

**Garde-fou** : `findEngagementsSansTache()` — un « je vais le corriger » jamais devenu une tâche
ressemble exactement à un problème traité. C'est le mécanisme que l'Article 28 combat, appliqué ici
à ses propres engagements.

| Date | Point | Réponse | Raison |
|---|---|---|---|
