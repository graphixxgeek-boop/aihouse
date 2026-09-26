
## Le garde-fou de l'outil muet, câblé au commit (2026-09-26, tâche #778)

**Le trou qu'il ferme** : `classerLesSilencieux()` savait déjà reconnaître un outil **muet** — il a
une ligne de commande et n'appelle jamais `recordCliUsage` — mais ce classement n'apparaissait que
dans le rapport de Ronde, lancé à la main. Un outil créé demain sans cet appel rejoignait donc la
zone muette **en silence** (leçon L2).

**Pourquoi ça compte plus qu'il n'y paraît** : son zéro d'usage se lit ensuite comme un verdict sur
lui, alors qu'il ne dit qu'une chose — personne ne compte. Et un compteur faux empoisonne **toutes**
les décisions d'usage qui s'appuient dessus.

**Il signale, il ne bloque pas.** Le choix entre signaler fort (doctrine de god-of-all-process) et
bloquer (doctrine de `findHorodatagesFuturs`) revient à l'utilisateur et lui est posé ; en attendant,
le comportement retenu est le moins brutal des deux, et le seul sur lequel on peut revenir sans rien
perdre.

**Muet quand tout va bien** : une ligne « 0 muet » à chaque commit est exactement le bruit qui rend
un contrôle invisible (L6). Un silence **non mesurable** se dit en revanche, il ne se tait pas
(L5/L11) — sans lecteur de source, « aucun muet » et « rien n'a pu être lu » se ressembleraient trait
pour trait.

**Mesure du jour de son câblage : zéro outil muet** sur le dépôt réel. Le garde-fou est donc posé
pour le prochain, pas pour un défaut présent.

**Commande** : `node scripts/tool-brain.mjs muets`, appelée par le crochet post-commit dès qu'un
`scripts/*.mjs` a bougé — même filtre superset que la dette documentaire, et pour la même raison :
la précision vit dans l'outil, jamais dans une liste recopiée au crochet (Article 24).
