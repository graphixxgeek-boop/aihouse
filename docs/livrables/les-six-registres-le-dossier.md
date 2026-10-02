# Les six registres — le dossier avant la question

> **Pourquoi ce document existe.** Je t'ai posé cette question deux fois, et deux fois tu as
> répondu que tu manquais de contexte : *« ça s'éclaircit mais j'ai encore besoin de plus de
> contexte et plus d'explications claire et simple pour bien comprendre »*.
> **Tu avais raison.** La leçon que j'en ai tirée (#1469) dit qu'une décision demandée sans son
> dossier n'est pas demandable. Voici le dossier. **Tâche :** #814, ouverte depuis le 25 septembre.

---

## ① DE QUOI ON PARLE, SANS JARGON

L'Agence produit des fichiers en travaillant. Certains, elle les **relit** plus tard — un outil va
y chercher ce qu'il a trouvé la dernière fois. D'autres, **personne ne les rouvre jamais**.

**La question est simple** : pour six dossiers, faut-il que quelqu'un aille les relire à chaque
Ronde et t'en rende compte, ou faut-il écrire noir sur blanc que **personne n'a besoin de les
relire** ?

**Et pourquoi ça ne peut pas rester en suspens** : un dossier que personne ne relit et dont
personne n'a dit « c'est normal » est un **trou**. On ne sait pas s'il est inutile ou s'il est
oublié. Les deux se ressemblent exactement, et seule une décision écrite les sépare.

**Ce que ça change pour toi concrètement** : donner un lecteur à l'un de ces six, c'est **recevoir
une ligne de plus à chaque Ronde**. Pas un coût technique — un coût d'attention, le tien.

---

## ② LES SIX, MESURÉS AUJOURD'HUI

| Le dossier | Ce qu'il contient vraiment | Combien de scripts le nomment |
|---|---|---|
| `docs/the-screener` | **1,2 Mo**, 10 fichiers — les captures d'écran du site | 7 |
| `docs/reponses` | 168 Ko, 5 fichiers — **mes réponses à tes gros prompts** | 5 |
| `docs/le-classificateur` | 116 Ko, 8 fichiers — le rangement de l'outillage, généré | 4 |
| `docs/doc-report` | 24 Ko, 4 fichiers — dernier écrit le 28 septembre | 2 |
| `docs/filet-en-parts` | **seulement son index** — rien d'autre | 3 |
| `.circle-tasks-last-run.json` | un marqueur machine : « quelle Ronde a déjà tourné » | — |

---

## ③ TROIS D'ENTRE EUX SE RÉPONDENT TOUT SEULS, et c'est la bonne nouvelle

**`docs/filet-en-parts` — rien à relire, et c'est VOULU.** Son dossier ne contient que son index,
ce qui ressemble à un outil qui n'a jamais servi. **Faux** : il a tourné **22 fois**. Il découpe le
filet de sécurité en morceaux pour le lancer en parallèle, écrit des copies **temporaires**, et les
**efface** en finissant. Un dossier vide est exactement ce qu'il doit laisser.
→ **Absence assumée, sans discussion.**

**`.circle-tasks-last-run.json` — c'est un post-it de machine.** Il contient « la dernière Ronde a
tourné à tel commit », pour ne pas la relancer deux fois. Rien là-dedans ne t'intéresse, ni
aujourd'hui ni jamais.
→ **Absence assumée, sans discussion.**

**`docs/reponses` — tu les reçois en main propre.** C'est le dossier où vivent mes réponses à tes
gros prompts, celle d'aujourd'hui comprise. Un lecteur te dirait à chaque Ronde « il y a 5
documents de réponses ». **Tu le sais déjà : je te les envoie.**
→ **Absence assumée**, mais pour une raison différente des deux autres : ce n'est pas que personne
ne les lit, c'est que **la relecture passe par toi, pas par un outil**.

---

## ④ LES TROIS QUI DEMANDENT VRAIMENT TA DÉCISION

### `docs/the-screener` — 1,2 Mo de captures d'écran

**Ce que c'est** : les images du site, prises pour juger son apparence.

**Pourquoi la question se pose maintenant** : tu as **reporté la refonte graphique** aujourd'hui.
Donc ces captures ne servent à rien **tant que la refonte n'a pas repris** — mais elles
reserviront.

| Option | Ce que tu reçois | Ce que ça coûte |
|---|---|---|
| **(a) lecteur** | une ligne par Ronde : « N captures, la plus récente date de X » | une ligne d'attention, pour un sujet en pause |
| **(b) absence assumée, avec sa condition** | rien, **jusqu'à la reprise de la refonte** | il faudra y repenser à ce moment-là |

**Mon avis** : **(b)**, mais avec la condition de reprise écrite — sinon on retrouvera 1,2 Mo
d'images dans six mois sans savoir si elles valent encore quelque chose.

### `docs/le-classificateur` — le rangement de l'outillage

**Ce que c'est** : le document officiel qui dit ce que chaque fichier EST, ce qu'il VAUT, ce qu'il
DOIT. **Il est généré**, donc jamais périmé.

**Pourquoi ça compte** : c'est une des pièces du **PACK DÉCOUVERTE**. Si quelqu'un doit comprendre
l'Agence, c'est un des premiers documents qu'il lira.

| Option | Ce que tu reçois |
|---|---|
| **(a) lecteur** | une ligne par Ronde disant si le rangement a bougé |
| **(b) absence assumée** | rien — tu le consultes quand tu en as besoin |

**Mon avis** : **(a)**, et c'est le seul des six où je le recommande. Un rangement qui change sans
que personne le remarque est exactement ce que les garde-fous de ce projet existent pour empêcher.

### `docs/doc-report` — dernier écrit il y a cinq jours

**Ce que c'est** : les rapports sur l'état de la documentation (index manquants, documents jumeaux).

**Le fait qui compte** : son dernier fichier date du **28 septembre**. Soit l'outil a cessé de
tourner, soit il tourne sans rien écrire — et **je ne sais pas lequel**, ce que je préfère dire
plutôt que supposer.

| Option | Ce que tu reçois |
|---|---|
| **(a) lecteur** | une alerte si l'outil cesse d'écrire |
| **(b) absence assumée** | rien, et on ne saura jamais s'il s'est arrêté |
| **(c) d'abord instruire** | je vérifie pourquoi il n'écrit plus, puis on décide |

**Mon avis** : **(c)**. Décider du sort d'un dossier dont on ne sait pas s'il est vivant, c'est
décider à l'aveugle.

---

## ⑤ CE QUE JE TE DEMANDE, EN UNE QUESTION

**Trois sont réglés sans toi** (filet-en-parts, le marqueur de Ronde, docs/reponses) : absence
assumée, avec leur raison écrite. Je peux l'inscrire dès maintenant si tu ne t'y opposes pas.

**Pour les trois autres, une seule question :**

> **(a)** je suis mon avis — lecteur pour le classificateur, absence assumée avec condition pour
> les captures, instruction d'abord pour doc-report
> **(b)** un lecteur pour les trois — tu veux tout voir à chaque Ronde
> **(c)** absence assumée pour les trois — tu ne veux pas d'une ligne de plus
> **(d)** autre chose, dis-moi

**Et ce que ça change concrètement, pour que tu décides en connaissance de cause** : chaque
« lecteur » ajoute **une ligne à ta Ronde**. Tu en as déjà 45 items. La vraie question n'est pas
technique, elle est : **combien de lignes veux-tu lire à chaque passage ?**

---

# PLAN D'ACTION

| État | Constat | Suite |
|---|---|---|
| ✅ MESURÉ | les six mesurés aujourd'hui, pas supposés — tailles, contenus, lecteurs réels | #814 |
| ✅ TROUVÉ | `filet-en-parts` a tourné 22 fois : son dossier vide est NORMAL, ses copies sont temporaires | #814 |
| → RETENU | inscrire l'absence assumée pour les trois évidents, avec leur raison | #814 |
| ? À TRANCHER | **une seule question, quatre réponses**, pour les trois autres | #814 |
| ⏳ À INSTRUIRE | `docs/doc-report` n'écrit plus depuis le 28 septembre — arrêté, ou silencieux ? | #1505 |
