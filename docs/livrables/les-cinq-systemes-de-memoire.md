# Les cinq systèmes qui savent où on en est

*(Réponse à ton point **P80**, tâche **#1546**. Produit le 2026-10-03.)*

> **DÉCOULE DE :** `docs/strategies/strategie-globale-du-projet-entier.md`
> *nommer et harmoniser les systèmes de mémoire est une décision d'organisation.*

---

## TES DEUX QUESTIONS, ET ELLES N'ONT PAS LA MÊME RÉPONSE

Tu demandes **(1)** quelles actions rendraient l'ensemble cohérent, et **(2)** comment nommer le
groupe. La première se mesure, la seconde t'appartient — je propose, tu nommes.

---

## ① CE QU'ILS SONT, ET CE QU'AUCUN NE SAIT

**Les cinq systèmes de mémoire du projet** — chacun dit une vérité, aucun ne dit les autres.

| Le système | Ce qu'il sait dire | Ce qu'il ignore |
|---|---|---|
| **Le suivi** (`docs/suivi/`) | ce qui a été fait, tâche par tâche, daté | ce qu'on cherche à obtenir |
| **Les fils** (`docs/fils/`) | où en est chaque sujet, qui a la balle | ce qui a été fait dans le code |
| **Les stratégies** (`docs/strategies/`, `docs/grand-projet/02-strategie/`) | des analyses de fond, datées | si elles sont encore vraies |
| **Les notes de chantier** (`docs/plans/`) | ce qui se passe sur un chantier précis | leur place dans l'ensemble |
| **Les registres d'outils** (`docs/<outil>/`) | ce que chaque outil a mesuré | ce qu'on en a fait |

**Le défaut n'est dans aucune des cinq pièces.** Chacune est propre prise seule, et c'est ce qui
le rend invisible : tout contrôle local passe au vert. Ce qui manque est le plan de la maison.

---

## ② LES QUATRE ACTIONS QUI RENDRAIENT L'ENSEMBLE COHÉRENT

**Classées par ce qu'elles coûtent, pas par ordre d'envie.** Les deux premières sont déjà faites
en partie ; les deux dernières attendent une décision de ta part.

| # | L'action | Ce qu'elle règle | État |
|---|---|---|---|
| **1** | **Un POINT DE RENCONTRE unique** — un document qui, pour un sujet donné, dit ce qu'en disent les cinq | aucun des cinq ne renvoie aux quatre autres | **à moitié fait** : le « Cerveau des fils » (ton P57) en est le candidat |
| **2** | **Un SENS DE LECTURE déclaré** — lequel fait foi quand deux se contredisent | aujourd'hui rien ne tranche, donc on croit le dernier lu | **à trancher par toi** |
| **3** | **Un CHAÎNAGE mécanique** — un constat de registre devient une tâche, une tâche se rattache à un fil, un fil se rattache à une stratégie | la chaîne existe par endroits et se rompt sans bruit | **fait à deux maillons sur trois** : l'Article 28 relie constat→tâche, et le contrôle de couverture des fils relie tâche→fil |
| **4** | **Une DATE DE PÉREMPTION sur les analyses** — une stratégie datée du 28 septembre ne dit pas si elle est encore vraie | c'est le seul des cinq défauts que personne ne surveille | **rien n'existe** |

**L'action 4 est celle que je retiendrais en premier**, et ce n'est pas la plus visible : les
quatre autres systèmes portent des faits (ce qui a été fait, qui a la balle, ce qui a été mesuré)
qui ne peuvent pas devenir faux. Une ANALYSE, si — elle peut être parfaitement exacte le jour où
elle est écrite et complètement fausse une semaine plus tard, sans qu'une seule ligne n'ait bougé.

---

## ③ LE NOM — trois séries, jamais un nom isolé

**C'est toi qui nommes, et tu nommes par séries dans une même famille.** Je ne propose donc pas un
nom : je propose trois séries complètes, chacune donnant un nom au GROUPE et un nom à chacun des
cinq. Tu prends une série entière, ou tu la refuses entière.

### Série A — la famille MATRIX *(déjà déclarée dans le registre des noms)*

*Pourquoi elle colle : des êtres qui découvrent que leur monde est fabriqué — le sujet du jeu, mot
pour mot, et ici le projet qui découvre ce qu'il est vraiment.*

| | Nom proposé |
|---|---|
| **LE GROUPE** | **LES ORACLES** |
| Le suivi | L'ARCHITECTE — il sait ce qui a été construit |
| Les fils | L'ORACLE — elle sait ce qui attend |
| Les stratégies | MORPHEUS — il dit où l'on va |
| Les notes de chantier | LE TRAIN — ce qui se passe entre deux mondes |
| Les registres d'outils | LES SENTINELLES — elles mesurent sans jamais conclure |

### Série B — la famille des PROPHÈTES *(déjà déclarée, et déjà employée dans l'Agence)*

*Pourquoi elle colle : ceux qui annoncent et qu'on n'écoute pas. Le défaut de ces cinq systèmes est
exactement celui-là — chacun dit vrai et personne ne les lit ensemble.*

| | Nom proposé |
|---|---|
| **LE GROUPE** | **LE CONCILE** |
| Le suivi | LES CHRONIQUES — ce qui s'est passé |
| Les fils | LES SUPPLIQUES — ce qui attend une réponse |
| Les stratégies | LES RÉVÉLATIONS — ce qui a été vu |
| Les notes de chantier | LES CARNETS — ce qui se fait en ce moment |
| Les registres d'outils | LES TÉMOIGNAGES — ce qui a été constaté |

### Série C — descriptive, sans hommage

*Pourquoi elle existe quand même : une série évocatrice est agréable à employer et coûteuse à
expliquer. Si ce groupe doit être compris par quelqu'un d'extérieur au projet — un acheteur, une
autre IA — un nom qui se comprend sans glossaire vaut peut-être mieux.*

| | Nom proposé |
|---|---|
| **LE GROUPE** | **LA MÉMOIRE DU PROJET** |
| Les cinq | LA MÉMOIRE DES ACTES · DES SUJETS · DES ANALYSES · DES CHANTIERS · DES MESURES |

---

## CE QUE JE NE FAIS PAS

**Je n'en choisis aucune, et je n'en inscris aucune au registre des noms.** Baptiser est ton
geste ; un nom que j'aurais posé serait à défaire le jour où tu en voudrais un autre, et les noms
de ce projet sont cités dans le code et le suivi — un renommage coûte cher.

---

## PLAN D'ACTION *(Article 28)*

| Constat | État | Suite |
|---|---|---|
| Les cinq systèmes n'ont aucun point de rencontre | **RETENU** | tâche #1546 — l'action 1, portée par le « Cerveau des fils » |
| Aucune analyse ne porte de date de péremption | **RETENU** | tâche #1546 — l'action 4, la seule que personne ne surveille |
| Lequel fait foi quand deux se contredisent | **À TRANCHER** | ta décision, pas la mienne |
| Le nom du groupe | **À TRANCHER** | trois séries proposées ci-dessus, à prendre ou à refuser entières |
