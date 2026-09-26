# messages-courts — plan générique : ne jamais s'arrêter sur un message court

*(Blueprint réutilisable. Instanciation : `docs/referentiel/messages-courts.md`.)*

## Le défaut qu'il ferme, et son coût réel n'est pas celui qu'on croit

Un message court arrive pendant un travail long. L'agent le traite comme une interruption, s'arrête,
répond — et reprend, ou ne reprend pas.

**Le coût n'est pas la réponse : c'est la RELANCE.** Chaque arrêt fait recharger le contexte, refaire
le point, et souvent redémarrer une tâche à moitié faite. Le message coûte dix secondes ; l'arrêt en
coûte cent fois plus, et personne ne le compte.

## Le principe, et il est dans le DÉFAUT, jamais dans une liste

**Continuer est la réponse normale. Un arrêt exige une demande EXPLICITE.**

C'est l'inverse de l'intuition, et c'est ce qui rend la règle applicable : une liste de formes ne
sert qu'à **AJOUTER** un arrêt, jamais à en retirer un. Donc un mot d'arrêt que la liste ne connaît
pas fait **continuer** — exactement le comportement voulu.

C'est aussi la seule façon d'écrire cette règle sans tomber dans la liste de mots figée qu'un projet
sérieux interdit : ici la liste peut rester incomplète sans jamais produire le mauvais comportement.
Une liste dont l'incomplétude est sans danger est une liste qu'on peut se permettre.

## Les deux paliers, et pourquoi deux

| Palier | Quand | Ce qu'il fait |
|---|---|---|
| rappel léger | dès le 2e message court | rappelle qu'il y a une tâche en cours |
| alerte forte | quand le cumul devient coûteux | chiffre ce que les arrêts ont coûté |

Un seul palier raterait sa cible dans les deux sens : trop tôt il agace, trop tard il constate un
dégât déjà fait.

## Ce qu'il ne doit JAMAIS faire

**Refuser de répondre.** La personne a toujours le droit d'interrompre ; l'outil rend visible le
coût d'un enchaînement d'interruptions, il ne décide pas à sa place. Un outil qui refuserait serait
retiré dans la semaine, et avec raison.

## Sa limite honnête

Il compte des messages et leur longueur. Il ne sait pas si un message court était une vraie urgence
— et il ne doit pas essayer de le deviner.
