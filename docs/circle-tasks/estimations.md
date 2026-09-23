# Registre des estimations de Ronde — estimé contre réel

*(Créé le 2026-09-23 à la demande explicite de l'utilisateur : « donne moi une estimation de temps
à chaque fois en debut de ronde selon le programme choisi », « compare à la fin ton estimation avec
le temps reel et consigne le pour la prochaine fois, pour ajuster tes estimations », puis
« estimation de temps + estimation de consommations ». Mécanique : `estimerRonde()` et
`comparerEstimationEtReel()` dans `scripts/circle-tasks.mjs`.)*

**À quoi sert ce registre, et pourquoi il ne pouvait pas rester dans la tête de l'agent** : une
estimation qui ne se confronte jamais au réel se répète, fausse, avec la même assurance à chaque
passage. Ce que la colonne « ratio » contient est ce qui corrige l'estimation SUIVANTE — c'est le
seul mécanisme du paysage qui apprend d'un chiffre plutôt que d'une intention.

**Un écart n'est jamais une faute.** C'est la donnée. Ce qui serait une faute, c'est de ne pas
l'écrire.

| Date | Mode | Items | Durée estimée | Durée réelle | Ratio | Sens | Tokens estimés | Tokens réels (agents) |
|---|---|---|---|---|---|---|---|---|
| 2026-09-23 | GOAT MAX | 33 | 38 min *(mécanique)* · **2 h–3 h 30 annoncées à la main** | **27 min** | 0,71 *(mécanique)* · **0,15 à 0,22 (à la main)** | SUR-ESTIMÉE | 280 500 | **569 820** *(2 agents seuls)* |

## Ce que la première mesure a appris, et il y a deux leçons opposées

**Sur la DURÉE — je me suis trompé d'un facteur 5 à 8, à la main.** J'avais annoncé « 2 h à 3 h 30 »
à l'ouverture ; la Ronde complète, agents séparés compris, a pris **27 minutes**.

*La cause, écrite plutôt que devinée au prochain passage* : j'estimais en **heures humaines**, sur un
travail qui s'exécute à vitesse machine et dont les deux morceaux les plus lourds tournent **en
parallèle**. Additionner des durées d'étapes parallèles est une erreur de méthode, pas de calibrage
— et c'est précisément ce que `estimerRonde()` corrige en prenant le MAXIMUM entre le travail
séquentiel et le plus long agent, jamais leur somme.

*Pourquoi une sur-estimation n'est pas le côté « prudent » de l'erreur* : annoncer 3 h 30 pour un
travail de 27 minutes fait **renoncer à un programme complet qu'on aurait eu le temps de mener**.
L'utilisateur a coché GOAT MAX malgré mon chiffre ; un autre jour, il aurait coupé.

**Sur les TOKENS — l'estimation est fausse dans l'AUTRE sens, et c'est le vrai trou.** 280 500
estimés contre **569 820 consommés par les deux agents séparés à eux seuls**, hors tout le reste. Le
mécanisme applique le plancher fixe documenté (~37 000 tokens par agent), or le plancher n'est pas
le coût : THE-DEEP-READER a coûté **346 000 tokens**, soit **neuf fois son plancher**, parce qu'il
LIT ce qu'on lui donne. Un agent séparé au plancher fixe est une fiction dès que son entrée grossit.

→ Tâche ouverte : faire dépendre l'estimation d'un agent du VOLUME qu'on s'apprête à lui donner,
jamais d'un plancher constant. En attendant, la colonne « tokens estimés » est un plancher, et ce
registre le dit plutôt que de laisser croire à une prévision.
