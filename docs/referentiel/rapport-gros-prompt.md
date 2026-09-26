# rapport-gros-prompt — fiche d'instanciation

## Ce qu'il sert ici

`scripts/rapport-gros-prompt.mjs` (2026-09-24) : produit le rapport d'une saisine (un « gros
prompt »), point par point, chaque point portant son sort.

## Pourquoi il existe dans CE projet

**Son process à lui, et c'est une bonne pratique qu'il a construite seul** : il accumule ses idées,
ses tâches et ses questions pendant qu'on travaille plutôt que d'interrompre par petits messages —
« c'était un de mes défauts à corriger » — et il les envoie d'un bloc avant une période autonome.
Le matin, il doit trouver un rapport de gros prompt.

## LE DÉFAUT PRÉCIS QU'IL A NOMMÉ, et c'est lui qui a motivé l'outil

La première version, faite à la main, marquait certains points « FAIT » **sans leur associer la
moindre tâche**. Sa réaction : « j'ai remarqué que des taches pouvaient etre associés, et ce n'est
pas fait, et tu ne me l'as pas proposé ».

Un point traité sans tâche est invérifiable. D'où la règle mécanique : l'outil **REFUSE** de
produire le rapport plutôt que de le produire incomplet.

C'est la chaîne de l'Article 28 appliquée à une saisine : `point → sort → tâche dans docs/suivi/`.

## Ce qu'il réutilise, jamais ne réinvente

Le gabarit partagé des rapports (`report-template.mjs`), le rendu HTML (`html-report.mjs`), et les
types de tâche proposés par `check-tasks-details.mjs`. Jamais un second gabarit concurrent.

## Sa limite ici

Il garantit qu'aucun point n'est déclaré traité sans trace. Il ne juge pas si le traitement était
le bon — ça reste la lecture de l'utilisateur.
