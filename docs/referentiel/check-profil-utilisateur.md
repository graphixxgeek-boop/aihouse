# check-profil-utilisateur — fiche d'instanciation

## Ce qu'il sert ici

`scripts/check-profil-utilisateur.mjs` (2026-09-19) : garde-fou du système de profil utilisateur.
Une fiche d'observation dans `docs/profil-utilisateur/observations/` doit toujours avoir sa ligne
dans la table de `docs/profil-utilisateur/index.md`, et réciproquement.

## Pourquoi il existe dans CE projet

Le profil utilisateur est ce qui permet à une IA qui reprend le projet de savoir **comment travaille
la personne** — son rythme, ses arbitrages, ce qu'elle refuse. Une observation jamais indexée est
donc perdue pour le prochain agent, qui ne lira que l'index (Article 27 : le suivi durable ne vit
pas dans la mémoire d'un agent).

Documenté dans `docs/regles-de-travail.md` §9 « Historisation du profil ».

## Son parent de conception

Même patron que `scripts/check-suivi-fidelity.mjs` : gratuit, zéro appel réseau, lecture seule.

## Sa place dans la Ronde

Item `profil-utilisateur-guard`, thème « Passages réels (smoke run) » — délibérément distinct de
l'item `profil`, qui ÉCRIT une nouvelle observation. Vérifier l'intégrité du disque et produire une
observation sont deux gestes différents, et les confondre a déjà été corrigé une fois.

## Sa limite ici

Il vérifie la correspondance fiche ↔ index, jamais la qualité de l'observation. Et c'est
`findPromisedFilesMissing()` (circle-tasks), pas lui, qui a fini par attraper le vrai trou du
système : `docs/profil-utilisateur/profil-actuel.txt` n'avait JAMAIS été créé alors que deux
documents promettaient sa réécriture à chaque Ronde.
