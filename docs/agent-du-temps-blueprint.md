# Blueprint générique — un agent du TEMPS pour un projet piloté par IA

*(Blueprint réutilisable sur n'importe quel projet, indépendant de « Maison IA vivante ».
L'instanciation propre à ce projet-ci vit dans `docs/referentiel/agent-du-temps.md`.)*

## Le problème qu'il résout, et il est structurel

**Une IA ne sait pas l'heure.** Elle n'a pas d'horloge : elle déduit la date et l'heure du dernier
horodatage qu'elle a vu passer dans son contexte — un message, un commit, une ligne de journal — et
cette déduction dérive à chaque minute de travail. Le symptôme est discret et le coût est réel :
un horodatage tapé plutôt que lu, et toute fraîcheur calculée dessus devient fausse. Un âge négatif
se lit comme « tout frais » au lieu de déclencher une alerte.

Sur le projet d'origine, ce défaut a été trouvé le soir même où l'agent a été construit : une ligne
de suivi datée de quinze minutes dans le futur, refusée par un garde-fou écrit deux heures plus tôt.

## Le principe non négociable : jamais une heure sans sa source

C'est tout le blueprint en une phrase. Un agent du temps qui rend une heure de repli en la
présentant comme une heure réseau produit le pire type d'erreur — **invisible**, parce qu'une heure
fausse ressemble trait pour trait à une heure juste. Trois états, toujours nommés :

| Source | Ce que ça vaut |
|---|---|
| **réseau** | une API de temps a répondu : l'heure est indépendante de la machine |
| **système** | l'horloge locale : honnête, mais invérifiable depuis l'environnement d'exécution |
| **aucune** | rien n'a pu être lu — et alors il REFUSE de répondre plutôt que d'inventer |

Le repli sur l'horloge système n'est pas un échec de conception, c'est le comportement attendu.
Ce qui serait un échec, c'est de se replier en silence.

## Ce qu'il héberge en plus, et pourquoi c'est le même outil

Les **estimations** — durée, tokens, appels API — et leur comparaison au réel. Le rattachement
paraît arbitraire et ne l'est pas : une estimation est une affirmation sur du temps, et sa
correction ne peut venir que de la mesure du temps réellement écoulé. Les séparer donnerait deux
outils qui se demandent l'heure l'un à l'autre.

Trois règles y gouvernent, et chacune ferme un piège :

1. **Un seuil mécanique, jamais un jugement.** Une estimation est « juste » à ±X %. Le X se dérive
   d'une première mesure réelle, jamais d'une convention ronde.
2. **Le facteur d'ajustement se PROPOSE, il ne s'applique pas.** Sur un seul point de mesure, un
   facteur ressemble pourtant à une statistique. Un minimum de mesures est exigé avant toute
   proposition, et l'outil dit combien il en manque.
3. **La médiane, jamais la moyenne.** Un passage interrompu en plein milieu tirerait une moyenne
   vers le bas et emporterait toutes les estimations suivantes avec lui.

## Ce qu'il ne fait jamais

- Inventer une heure. Aucune source lisible ⇒ « pas mesuré », jamais une valeur par défaut.
- Appliquer un ajustement tout seul.
- Confondre l'heure AFFICHÉE (locale, lisible par un humain) et l'horodatage ÉCRIT (UTC, comparable
  par une machine). Les mélanger décale toutes les dates du décalage horaire, silencieusement.

## Les pièges rencontrés à la construction, pour ne pas les refaire

- **Le motif d'échec doit être conservé.** « Refusé par la politique réseau » et « le service est en
  panne » appellent deux gestes opposés ; les fondre en « échec » les rend indiscernables.
- **L'environnement peut interdire les API de temps.** Sur le projet d'origine, les deux services
  essayés rendent HTTP 403 : la politique réseau du conteneur refuse le CONNECT. L'agent le déclare
  au lieu de le masquer, et la décision d'autoriser un domaine appartient à l'humain.
- **Un horodatage de suivi n'est pas un horodatage d'affichage.** Le registre se compare en UTC ;
  l'humain lit son fuseau. L'agent rend les deux, explicitement étiquetés.
