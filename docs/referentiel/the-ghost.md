# THE-GHOST — fiche d'instanciation

## Ce qu'il sert ici

`scripts/the-ghost.mjs` (2026-09-21) : petit orchestrateur du mode nocturne autonome.

## Pourquoi il existe dans CE projet

Nommé par l'utilisateur : « créé un petit agent script "the-ghost" qui gere le mode autonome […]
quand je vais dormir ou quand je te laisse travailler seul ».

## La frontière, clarifiée par l'utilisateur le même soir

`check-tasks-details.mjs` reste l'outil **TRANSVERSE** — utilisable à tout moment, pas seulement la
nuit, et c'est lui qui évalue la pertinence et l'ordre des tâches via `recommendNextTasks()`.

THE-GHOST **ne réimplémente rien de ce jugement : il l'appelle.** Il ne gère QUE ce qui est propre
au mode nocturne lui-même.

## Ses trois signaux

| Signal | D'où il vient |
|---|---|
| depuis quand la session dure | calculé ici, n'existait nulle part |
| combien de tâches enchaînées | calculé ici, n'existait nulle part |
| depuis quand aucune Ronde n'a tourné | **réutilisé** depuis `circle-tasks.mjs::loadLastRun()`, jamais un second calcul (Article 3) |

## Ce que le projet a appris en mode autonome, et qui vit ici

**Le garde-fou de l'arrêt prématuré (2026-09-23)** ferme un défaut qui était dans le PROCESS, pas
seulement dans l'agent : rien n'interdisait de s'arrêter en pleine nuit pour rédiger un rapport de
progression — et un rapport de progression RESSEMBLE à du travail sérieux, ce qui donne à
l'interruption son air de rigueur.

Sa première version sur-créditait (13 chantiers « touchés » sur 15 quand un seul était fait), parce
qu'elle rapprochait des mots de titres avec de la prose de suivi. **Un garde-fou qui dit que tout va
bien précisément quand ça ne va pas est pire que le silence** : il repose désormais sur une
convention vérifiable — le numéro de chantier cité explicitement — jamais sur une ressemblance.

## Sa limite ici

Il orchestre un rythme, jamais la qualité. Le jugement sur ce qu'une nuit a produit revient à
`ou-on-en-est` et aux évaluations de la Ronde.
