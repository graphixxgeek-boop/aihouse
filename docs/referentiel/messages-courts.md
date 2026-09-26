# messages-courts — fiche d'instanciation

## Ce qu'il sert ici

`scripts/messages-courts.mjs` (2026-09-23, tâche #572) : empêche qu'un message court interrompe
durablement un travail en cours.

## Pourquoi il existe dans CE projet

Demande de l'utilisateur en trois morceaux distincts :

1. « une solution pour que tu comprennes, quand je t'envoie un prompt intempestif, que tu dois
   continuer la tache en cours et pas t'arreter, sauf demande explicite de ma part » ;
2. « un rappel leger dès le 2e message court » ;
3. « une alerte plus forte quand ca devient couteux ».

**Le défaut s'était produit plusieurs fois**, et il est documenté ailleurs dans le suivi : une tâche
interrompue par un message mid-turn et jamais reprise. C'est d'ailleurs la seconde fonction
officielle du signal `suivi-open-tasks-signal` de la Ronde, formalisée le même jour.

## Ce qui a été tranché ici

**Le défaut par défaut est « continuer ».** La liste de formes d'arrêt n'AJOUTE que des arrêts —
elle n'en retire jamais. Une forme inconnue fait donc continuer.

C'est ce qui rend cette règle compatible avec le corollaire de l'Article 17 (jamais de liste de mots
figée) : une liste dont l'incomplétude produit toujours le bon comportement n'est pas la liste que
cet article interdit.

## Sa limite ici

Il ne juge jamais l'urgence d'un message. Il ne refuse jamais de répondre — l'utilisateur garde le
droit d'interrompre à tout moment, et l'outil se contente de rendre visible le coût cumulé.
