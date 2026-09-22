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

## L'apprentissage de l'AGENT, pas seulement celui des outils (2026-09-23, tâche #220)

**Une moitié manquait, et c'était la plus périssable.** TOOL-LEARNING vérifiait que les outils
apprennent. Rien ne vérifiait la même chose de mon côté — alors que c'est moi qui disparais à chaque
fin de session : un outil garde son registre, un agent ne garde rien.

**L'origine** : une question directe de l'utilisateur — « quand tu fais des trouvailles bonnes à
retenir [...] il faut que tu l'écrives quelque part, c'est déjà le cas ? » Réponse honnête ce
jour-là : **non**. Les leçons vivaient dans des commentaires de code, chacune locale à l'outil qui
l'avait apprise. Une leçon apprise sur un détecteur de duplication ne pouvait pas servir le jour où
le même piège se présentait ailleurs. `docs/referentiel/lecons.md` a été écrit pour ça.

**Et c'est exactement là que le piège se refermait.** Un registre de leçons que rien ne relit est un
cas de **L2** (« un mécanisme qui ne sort pas du script est une intention ») et de **L7** (« une
intention écrite n'a jamais empêché quoi que ce soit ») — deux leçons qu'il contient lui-même.
L'écrire sans le câbler aurait été la démonstration de son propre contenu.

**Le câblage : chaque leçon déclare son PORTEUR**, le mécanisme réel qui la fait tenir quand plus
personne ne s'en souvient. `auditLecons()` vérifie à chaque passage, et rend **trois états, jamais
deux** :

| État | Ce que ça veut dire | Produit un constat ? |
|---|---|---|
| **portée** | le mécanisme nommé existe vraiment dans le code | non |
| **sans mécanisme** | impossibilité déclarée noir sur blanc AVEC sa raison — ce que L7 prescrit | **non**, la reprocher à chaque passage serait L6 commise par l'outil qui la publie |
| **porteur fantôme** | un mécanisme est nommé et n'existe pas | **oui**, et c'est le pire des trois |

**Pourquoi le porteur fantôme est pire qu'une leçon sans porteur** : une référence morte ressemble à
une garantie, donc elle rassure à tort ; une leçon qui admet n'avoir aucun mécanisme, au moins, ne
promet rien. Même raison d'être que `checkActionChain()` chez god-of-all-process, qui vérifie qu'une
tâche annoncée par un plan d'action existe pour de vrai.

**Limite honnête, déclarée plutôt que tue** : aucune mécanique ne peut juger si un porteur fait
RÉELLEMENT respecter sa leçon — seulement s'il existe. Le cas grossier est attrapé (la promesse sans
code derrière), le subtil ne l'est pas.

**L'état du registre au moment de l'écriture** : 8 leçons, 7 portées par un mécanisme réel, 1
déclarée sans mécanisme possible (L3, « un test ne doit jamais exiger qu'un défaut persiste » —
reconnaître automatiquement qu'une assertion s'appuie sur un défaut réel du dépôt demanderait de
deviner son intention, et produirait du bruit sur les tests légitimes, donc précisément le défaut de
L4), 0 fantôme, 0 muette.
