# Les règles nées d'une conversation — et leur domicile

*(Créé le 2026-10-03, tâche #1526, sur sa décision : « il faut que tu me dises quelles sont ces
règles et les écrire dans un document, oui ». Clôt la question posée par #1493.)*

## Pourquoi ce document existe

`angel-of-ia-process` surveille 28 règles de conduite. **Vingt-cinq pointent un fichier du dépôt
qui existe vraiment. Trois n'avaient pour source qu'une conversation** — c'est-à-dire rien, une
fois l'Agence installée ailleurs.

Sa peur, formulée par lui au fil 06 : « j'installe l'agence dans un nouveau projet, je l'utilise
mais je ne la reconnais pas et certaines choses ne fonctionnent plus du tout ». Ces trois règles
étaient littéralement ça : des obligations réelles, surveillées par un outil, **dont la raison
d'être ne voyageait pas**.

**Une règle dont la source est une conversation n'est pas une règle fragile : c'est une règle qui
n'existera plus demain.** L'Article 27 le dit dans l'autre sens — rien ne garantit que l'agent qui
lira ce fichier demain soit celui qui l'a écrit.

### La démonstration est arrivée pendant l'écriture de ce document

**Le 2026-10-03 à 05h10, j'ai enfreint `reveil-arme`** — la deuxième des trois règles ci-dessous.
Le travail de la nuit s'est arrêté, et c'est **l'utilisateur qui a dû me le signaler**. La règle
existait, un outil la surveillait, et elle n'a rien empêché : elle était déclarée `observable:
false`, sans domicile, portée par la seule mémoire de l'agent. C'est exactement ce que ce document
corrige, et il n'aurait pas pu trouver meilleure illustration.

---

## Les trois règles

### 1. `eval-hors-ronde` — l'évaluation ne porte pas que sur la Ronde

> **Faire évaluer le travail fait ENTRE deux Rondes** — une nuit autonome, une vague de
> correctifs, une simulation — et jamais seulement ce qu'une Ronde a couvert.

**Née de** sa demande explicite du 2026-09-23, qu'il avait lui-même marquée « GROS WARNING » :
*« les EVAL-DEV/EVAL-IA ne doivent pas porter que sur la ronde »*.

**Ce qu'elle empêche** : une évaluation qui ne regarde que la Ronde note le dispositif de contrôle,
jamais le travail. Or l'essentiel du travail se fait entre deux Rondes. Une note excellente sur
1 % du travail est pire qu'une note absente — elle rassure sur ce qu'elle n'a pas regardé.

**Pourquoi aucun mécanisme ne peut la porter entièrement** : savoir si une évaluation a *porté sur*
le bon périmètre demande de lire son contenu et de juger. `angel` peut DEMANDER si elle a été
respectée ; il ne peut pas le constater.

### 2. `reveil-arme` — armer le réveil AVANT de finir le tour

> **En mode autonome, ARMER le réveil (`send_later`, 15 min) AVANT de terminer le tour**,
> systématiquement. Un tour qui se termine sans réveil armé arrête la nuit, quoi qu'annonce le
> compte rendu.

**Née de** la nuit perdue du 2026-09-25, constatée en comparant le plan de départ au rapport de
nuit. **Re-payée le 2026-10-03 à 05h10**, comme dit plus haut.

**Ce qu'elle empêche** : un compte rendu qui dit « je continue » pendant que plus rien ne tourne.
L'arrêt est silencieux par construction — il n'y a personne pour le constater, puisque la raison
d'être du mode autonome est que l'utilisateur dort.

**Le réglage qui marche, et il est à trois étages** (vérifié sur les nuits qui ont tenu, et sur
celle qui s'est arrêtée) : une **chaîne courte** de 15 min réarmée à chaque tour (le rythme) ET
**deux filets horaires indépendants**, décalés l'un de l'autre (la garantie). Un filet unique est
un point de défaillance unique : il tombe à l'heure pleine, jamais entre deux.

### 3. `reveil-a-jour` — un réveil périmé ment à chaque heure

> **Au départ de chaque période autonome, RELIRE le prompt de tous les réveils déjà armés** et le
> corriger s'il annonce comme « à faire » quelque chose de déjà fait. Un réveil se répète à chaque
> heure : une consigne périmée s'y répète aussi.

**Née des** tâches #831 et #1165 — un filet qui a annoncé pendant des heures que la Ronde autonome
restait à faire, alors qu'elle était faite.

**Ce qu'elle empêche** : **un filet qui ment est pire qu'un filet absent.** Un filet absent laisse
le travail s'arrêter ; un filet qui ment le fait repartir dans la mauvaise direction, avec
l'autorité d'une consigne.

**Le corollaire qui en découle, et qui est appliqué depuis** : un prompt de réveil **ne porte
aucun état**. Il dit où LIRE l'état (`git log`, `git status`, `docs/suivi/`), jamais quel il est.

---

## Ce que ce document ne fait pas

Il **ne rend pas ces trois règles mécaniquement vérifiables** — elles sont déclarées
`observable: false` chez `angel`, et elles le restent. Aucun mécanisme ne peut lire un compte rendu
sur disque ni savoir qu'un tour s'est terminé sans réveil.

Ce qu'il change est plus modeste et suffisant : **elles ont désormais une source qui part avec
l'Agence.** Un agent qui reprend ce dépôt sans une ligne de la conversation peut lire pourquoi
elles existent, et ce qu'elles ont coûté quand elles n'ont pas été tenues. C'est la seule
protection possible pour une règle qui ne se joue que dans la conduite — et la déclarer vaut mieux
que de la confier à la mémoire d'un agent (Article 27).
