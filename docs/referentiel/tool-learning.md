# TOOL-LEARNING — instanciation propre à ce projet

*(2026-09-22, nom donné par l'utilisateur. Membre de la Suite Dette & Structure du code — c'est bien
de dette qu'il parle, celle d'un outil qui n'apprend pas. Blueprint générique :
`docs/tool-learning-blueprint.md`.)*

## Pourquoi un agent séparé, et pas une extension de CASSANDRA

Question posée et tranchée par l'utilisateur. Sa vocation unique n'est pas de juger les outils —
c'est de **juger l'agent**, sur sa capacité à les faire progresser. Aucun autre outil du paysage ne
regarde ça.

**Frontière avec CASSANDRA-RH** : elle juge l'**ÉTAT** et les **MOYENS** (ce membre a-t-il mémoire,
rapports, évolutivité ? a-t-il tout pour réussir ?), lui la **TRAJECTOIRE** et l'**USAGE** (s'en
sert-il ? est-il meilleur qu'avant ?).

## L'harmonisation avec SAFE-EXPORT

Elle était déjà dans la formulation de l'utilisateur : « à la fois pouvoir etre exporté, en meme
temps avec des capacités accrues grace à l'apprentissage ». **Deux moitiés d'un seul principe**,
un outil chacune — SAFE-EXPORT porte *pouvoir partir*, TOOL-LEARNING *devenir meilleur*. Ce n'est pas
un découpage inventé pour justifier deux outils : c'est la phrase coupée à sa jointure.

**Lien concret** : la mémoire de SAFE-EXPORT est elle-même un signal d'apprentissage que
TOOL-LEARNING lit — un outil dont les mêmes écarts reviennent passage après passage n'apprend pas,
quoi qu'il archive.

## Volontairement pas un Gardien sacré

Il juge une **trajectoire**, et une trajectoire ne se mesure pas à chaque commit : trois passages
minimum avant de conclure. D'où un item de Ronde (`tool-learning`) plutôt qu'un câblage post-commit.

## Dépendance à connaître

Il ne vaudra que ce que valent les historiques de CASSANDRA et SAFE-EXPORT — or **aucun des deux ne
tient encore de série comparable** (tâche #445). Les brancher conditionne sa valeur.
