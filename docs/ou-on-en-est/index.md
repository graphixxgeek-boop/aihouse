# Où on en est — registre des passages

*(Demandé explicitement par l'utilisateur le 2026-09-23 : « peux-tu me faire un compte rendu global
de ce qui a été fait dernièrement ? me dire comment le projet a évolué, avec quelles
améliorations ? […] est-ce que ce récap peut être fait à chaque Ronde ? »)*

## Ce qu'il répond, et ce qu'il ne répond pas

Trois dispositifs lisent les mêmes tâches. L'utilisateur a posé lui-même la question de leur
harmonisation ; la réponse tient à l'angle, et aucun des trois ne peut remplacer les deux autres :

| Dispositif | La question à laquelle il répond | Ce qu'il regarde |
|---|---|---|
| Ronde — `check-tasks-report` | « rien n'a-t-il **dérivé** pendant que je travaillais ? » | la file |
| État des tâches — `check-tasks-details` | « qu'est-ce qu'on **fait** maintenant ? » | la file |
| **Où on en est** | « qu'est-ce qui a été **fait**, et qu'est-ce que ça a changé ? » | le chemin parcouru |

**Pourquoi ils ne fusionnent pas** : une surveillance qui réclame une décision à chaque passage
cesse d'être une surveillance, et un bilan de progression noyé dans une file de tâches ne se lit
jamais. Les deux premiers regardent où on va, le troisième d'où on vient.

## Ce qu'il garantit

- **Il se dérive, il ne s'écrit pas** (Article 24) : tout ce qu'il affiche est relu dans
  `docs/suivi/` au moment de l'exécution. Un compte rendu rédigé une fois serait faux la semaine
  suivante.
- **Il affiche son dénominateur** avant tout chiffre, et dit « rien n'a été mesuré » plutôt que de
  rendre un bilan vide quand le registre est introuvable — la discipline du cinquième critère de
  pure-gold-unity, appliquée dès la construction plutôt qu'après coup.
- **La période se dérive des données**, jamais du calendrier : « dernièrement » veut dire les
  dernières journées réellement présentes dans le registre. Sur un projet qui travaille par salves,
  compter en jours calendaires afficherait « 0 tâche » après trois jours de pause, ce qui serait
  faux — il ne s'est rien passé, pas rien été fait.

## Sa limite, déclarée

Il lit le registre durable, **jamais le code**. Une tâche mal décrite y sera mal résumée. Il dit
donc ce qui a été ÉCRIT comme fait — ce qui est une mesure de la discipline de suivi autant que du
travail lui-même.

## Registre des passages

| Date | Période couverte | Tâches terminées | Rapport |
|---|---|---|---|
| 2026-09-23 | 2026-09-22 → 2026-09-23 | 249 sur 485 tracées | `ou-on-en-est.html` |
