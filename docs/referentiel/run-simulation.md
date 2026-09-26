# run-simulation — fiche d'instanciation

## Ce qu'il sert ici

`scripts/run-simulation.mjs` (2026-09-22, tâche #356) : le pilote de simulation intégrale — l'étape 1
de l'Article 18.

## Pourquoi il existe dans CE projet, et le chiffre qui le justifie

L'étape 1 du protocole disait « lancer LE script de simulation intégrale » — **mais aucun script de
ce nom n'avait jamais été committé.** Il était réécrit à la volée dans un dossier temporaire à
chaque simulation, puis perdu avec la session.

**Dix-sept simulations archivées, zéro pilote conservé.**

C'est exactement ce que l'Article 24 interdit, et la raison pour laquelle deux simulations
successives n'ont jamais été strictement comparables : le scénario de phase 2 était retapé de
mémoire à chaque fois. Le voici committé, donc rejouable à l'identique.

## Ce qu'il n'est pas

Il ne juge rien et ne corrige rien : il joue la partie et écrit ce qui s'est dit. L'analyse reste
EL-PROFESSOR (étape 4bis) puis l'agent (étape 5) — jamais ce script.

## La photo de mémoire à chaque tour, et pourquoi la mécanique n'est PAS ici

Décision explicite de l'utilisateur en fenêtre de calibrage : « photo à chaque tour », **contre** la
recommandation d'une version minimale début/fin.

La MÉCANIQUE vit dans memory-audit, jamais ici, et c'est délibéré : **ce fichier ne peut pas être
testé sans serveur, donc tout ce qu'on y met devient non testable.** C'est la leçon ④ de la nuit du
2026-09-23, qui a laissé un même défaut survivre trois simulations. Ici, on se contente de tendre
l'état à chaque tour — trois lignes, rien à vérifier.

## Sa limite ici

Il fige ce qu'on demande au jeu, jamais ce que le jeu répond : la rejouabilité est une exigence du
produit (Article 9), et deux passages du même scénario doivent raconter deux histoires.
