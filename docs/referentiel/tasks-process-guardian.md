# tasks-process-guardian — fiche d'instanciation

## Ce qu'il sert ici

`scripts/tasks-process-guardian.mjs` (2026-09-22) : **contrôleur de process** (jamais un Gardien
sacré — cf. Article 20bis) pour le déroulé du système de suivi des tâches.

## Son rang, et pourquoi il n'y a aucune ambiguïté

Son nom porte `guardian`, orthographe anglaise historique du rang de **Gardien sacré du code** — et
l'Article 20bis précise que les deux orthographes comptent pareil. Sa règle est mécanique : les trois
scripts qui portent ce mot portent aussi `process` dans leur nom, donc **aucun Gardien sacré du code
ne s'est jamais appelé ainsi**. Un futur script nommé `*-guardian` SANS `process` dans
son nom serait un écart au rang de Gardien sacré du code.

Il **signale**, il ne corrige jamais.

## Pourquoi il n'a PAS d'item de Ronde à lui

C'est un **contrôleur de process SECONDAIRE** : `god-of-all-process` centralise et relaie son
verdict. Décision explicite de l'utilisateur le 2026-09-22 — **une seule voix à la Ronde, jamais une
par contrôleur.** Son vrai déclencheur est de toute façon l'état du suivi, pas le calendrier.

Exclusion déclarée dans `CIRCLE_AUTO_COVERED_REGISTRIES`.

## Ce qu'il a coûté le jour de sa création, et c'était le bon comportement

Son registre a fait **échouer le crochet pre-commit** le jour même, avant même que sa ligne
d'exclusion n'existe. `findRegistriesMissingFromCircle()` a fait exactement son travail : c'est
l'exclusion écrite qui est la vraie réponse, jamais un item de plus.

## Sa limite ici

Il surveille le DÉROULÉ du suivi, jamais la qualité de ce qui y est écrit. Une ligne de suivi
parfaitement formée et factuellement fausse lui paraît impeccable — c'est THE-DEEP-READER qui
confronte le suivi à ce qui s'est réellement passé, et il coûte.
