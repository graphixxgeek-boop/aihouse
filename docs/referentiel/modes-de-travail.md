# modes-de-travail — fiche d'instanciation

## Ce qu'il sert ici

`scripts/modes-de-travail.mjs` (2026-09-23) : les trois modes de travail du projet, déclarés une
fois et lus partout.

## Pourquoi il existe dans CE projet

Le projet vivait sur UN booléen, `nightAutonomousMode`, **recopié dans 31 endroits**. Il portait à
lui seul deux questions sans rapport : « l'utilisateur est-il là pour répondre ? » et « une fenêtre
de question a-t-elle le droit de bloquer ? ».

Tant qu'il n'existait que deux situations (piloté, nuit), les confondre ne se voyait pas. Le **mode
semi-autonome**, demandé le 2026-09-23 en ces termes — « c'est comme le mode autonome, sauf que je
suis present et je peux repondre aux questions » — sépare les deux pour de bon : l'utilisateur EST
là, et pourtant rien ne doit bloquer.

## Ce qu'il change pour les autres outils

Un quatrième mode s'ajoute **ici et nulle part ailleurs**. Ce qui gouverne un comportement est une
CLÉ de ce registre, jamais un `if (mode === "…")` recopié (Article 24). Le garde-fou associé
signale un outil qui teste un mode inconnu.

## Qui doit le consulter, et quand

L'Article 32, obligation 4 : « le temps de L'UTILISATEUR compte autant que celui de la machine ». Une
question bloquante posée à trois heures du matin ne bloque pas dix secondes, elle bloque la nuit
entière. **C'est ce registre qui répond à cette question-là** — on le consulte au lieu de le
supposer.

## Sa limite ici

Il déclare les modes ; il ne sait pas dans lequel on se trouve. Cette information ne vit que dans la
conversation, et le déclarer EST la protection (Article 27).
