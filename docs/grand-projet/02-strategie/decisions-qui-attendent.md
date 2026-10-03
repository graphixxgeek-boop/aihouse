# LES DÉCISIONS QUI T'ATTENDENT — présentées par lots

<!-- ARBORESCENCE — bloc généré par `node scripts/the-king.mjs cascade --inserer`, ne pas éditer à la main -->

**Où ce document se situe dans la cascade** — remonté des déclarations « DÉCOULE DE » réelles, jamais dessiné à la main :

```
philosophie-et-politique
    └── grand-projet/02-strategie/la-cible-2026-09-29
        └── ▣ grand-projet/02-strategie/decisions-qui-attendent   ← CE DOCUMENT
            (aucun document ne déclare découler de celui-ci)
```

<!-- /ARBORESCENCE -->

*(Nuit du 2026-09-29 — heure LUE, source système. Tâche #1163. JESUS le dit lui-même : « les lui
présenter par lots est le seul geste qui reste de mon côté ».)*

> **DÉCOULE DE :** `docs/grand-projet/02-strategie/la-cible-2026-09-29.md`
> *ce qui attend une décision retarde la cible autant que ce qui reste à construire.*

---

## POURQUOI CE DOCUMENT, ET POURQUOI MAINTENANT

**Le contexte.** Treize décisions t'attendent, la plus ancienne depuis sept jours. Elles sont
éparpillées dans le suivi, chacune au fond d'une ligne parmi mille.

**Ce que JESUS mesure, et ce n'est pas une opinion sur ton rythme** : « au-delà d'un certain
remplissage, le temps d'attente d'une file n'augmente plus proportionnellement, **il explose** — donc
chaque décision de plus ralentit AUSSI toutes les autres, y compris les faciles. C'est une propriété
des files. »

**Ce document ne te reproche rien.** Il rassemble, il chiffre ce qui a changé depuis, et il donne ma
recommandation pour chacune — pour que répondre coûte une minute au lieu d'une relecture.

**Aucune n'est bloquante pour le grand chantier.** Elles peuvent toutes attendre le calibrage.

---

## LOT 1 — TROIS QUI SE RÉPONDENT EN UN MOT

### #819 — Le filet de sécurité : faut-il l'accélérer ? *(4 jours)*

**CE QUI A CHANGÉ DEPUIS, ET ÇA CHANGE LA QUESTION.** Le relevé sur lequel la décision reposait
annonçait **140 s** ; il était périmé et personne ne le savait. Mesure refaite cette nuit :
**94 s** — 33 % de gain qui existaient déjà. Et avec `filet-en-parts`, le même verdict tombe en
**~60 s d'horloge**.

**Les trois plus lents aujourd'hui** : ABRAHAM 12,8 s · les idées à trancher 7,8 s · la
classification 5,7 s — **26,3 s, soit 28 % du total** (contre 44 % à l'époque de la question).

**Ma recommandation : (1) ne rien faire pour l'instant.** Le gain plausible est passé de « 15 à
20 s sur 44 s » à « quelques secondes sur 60 ». L'option (3), un mode rapide au pre-commit, reste
écartée : elle rendrait le garde-fou principal PARTIEL **tout en affichant le même vert** qu'un
contrôle complet.

---

### #842 — « Rentabiliser les trouvailles » : les leçons servent-elles ?

**L'outil existe et son verdict est net** : **aucune des 45 entrées n'a jamais été jugée appliquée**
— ni dans un sens, ni dans l'autre. 7 leçons ne sont jamais remontées sur 140 à 255 occasions
chacune ; 11 remontent souvent sans jamais être jugées.

**Pourquoi je ne tranche pas, et ce n'est pas une dérobade** : `enregistrerXp()` REFUSE
mécaniquement un jugement qui ne porte pas `parUtilisateur: true` — **parce que tu l'as voulu
ainsi** (« c'est moi à la fin qui te dis si elle est propre »).

**Ma recommandation** : juger **cinq** entrées, pas quarante-cinq. Cinq suffisent à savoir si le
registre sert, et quarante-cinq ne se font jamais.

---

### #845 — Les cinq plus anciennes tâches ouvertes : on les garde ou on les écarte ?

**#147** (objectifs chiffrés par membre) · **#179** (CASSANDRA connaît chaque membre) · **#279**
(allègement de CLAUDE.md — **reportée par toi, donc PAS en retard**) · **#390** (échelle d'ARGUS) ·
**#490** (données que personne ne lit).

**Pourquoi je ne tranche pas** : écarter une tâche est une décision, et la leçon L22 interdit de
rouvrir ou de fermer ce que tu as sciemment mis de côté.

**Ma recommandation** : #279 reste reportée (c'est ton choix), les quatre autres se rattachent aux
étapes du chemin plutôt que d'être écartées.

---

## LOT 2 — TROIS QUI DEMANDENT UN VRAI ARBITRAGE

### #767 — Deux règles à fort levier qui manquent à la charte *(4 jours)*

Tu demandais : « est-ce que tu vois d'autres types de règles qui manquent de ce type ? »

**(A) LA MESURE AVANT L'OPINION** — ne jamais avancer un chiffre qu'on n'a pas mesuré, et dire « je
n'ai pas mesuré » plutôt que d'estimer. **C'est le fil rouge de tout ce projet et aucun Article ne
le porte frontalement.**
**(B) LE LIVRABLE EST UN FICHIER, JAMAIS UN MESSAGE** — un message se perd dans le défilement et ne
survit pas à une session.

**Deux écartées volontairement**, parce que déjà portées ailleurs : « rien ne se termine sans son
verdict » (process XP) et « l'ordre des chantiers ne se réordonne jamais seul » (Article 26).

**Ma recommandation : (A) oui, (B) non.** (A) manque vraiment. (B) est déjà tenue dans les faits, et
la charte porte 32 Articles — le budget, même souple, dit de préférer une seule.

---

### #814 — Six registres : un lecteur, ou l'absence assumée ? *(4 jours)*

`.circle-tasks-last-run.json` · `docs/filet-en-parts/` · `docs/le-classificateur/` ·
`docs/the-screener/` · `docs/doc-report/` · `docs/reponses/`.

**Ce qui a changé** : le chiffre est passé de **18 à 6**, et deux des sorties étaient de **fausses
accusations dues à la mesure**, pas de vrais trous.

**Ma recommandation : l'absence assumée pour les six, écrite noir sur blanc.** Une absence déclarée
vaut mieux qu'un trou, et brancher six lecteurs qui ne serviront à personne coûterait six obligations
de plus.

---

### #830 — Un outil qui vérifie la logique et les trous PARTOUT ?

**La réponse technique est oui, mais pas dans la couche gratuite.** ARGUS et HARMONIA ont deux
couches ; une idée ou une conversation n'ont aucun motif à balayer, donc seule la couche à
raisonnement peut les lire — **elle est payante**.

**Trois formes** : (A) une commande sur un texte fourni · (B) un passage sur un SUJET du dépôt, ce
que tu demandais à l'origine · **(C) une veille continue sur les conversations, que je
DÉCONSEILLE** — aucun accès mécanique à l'historique n'existe, et **un outil qui prétendrait le lire
mentirait**.

**Ma recommandation : (B), à la demande.** C'est ta demande d'origine, et son coût est visible avant
chaque passage.

---

## LOT 3 — DEUX QUI SONT DÉJÀ RÉSOLUES, ET QU'IL SUFFIT DE FERMER

### #390 — ARGUS et CLONE-HUNTER sont mesurés à l'échelle du dépôt, pas de l'outil *(7 jours)*

Un outil parfaitement propre affiche quand même `partiel` à cause d'une trouvaille **ailleurs** dans
le dépôt. **Ce n'est pas corrigeable uniformément** : la couche mécanique d'ARGUS ne scanne que
`lib/life.ts` et des marqueurs TODO — aucune trouvaille n'y est attribuable à un outil.

**Deux lectures légitimes du palier** : « le réseau est au vert » contre « CET outil est au vert ».

**Ma recommandation : écarter avec sa raison écrite.** C'est une imprécision consignée, pas un
défaut, et elle est déjà dans `points-fragiles.md`.

---

### #823 — L'origine « spontane » qu'aucun chemin automatique n'écrit

**Mesuré sur 78 fichiers et 2 197 événements : une seule origine déclarée sur six n'est jamais
écrite.** Le travail est fait, la mesure est nette.

**Ma recommandation : fermer.** Il ne reste qu'à décider si « spontane » doit être retirée du
vocabulaire ou recevoir un chemin — et la première suffit.

---

## CE QUE COÛTE DE NE PAS DÉCIDER, mesuré

| Ce qui attend | Effet réel aujourd'hui |
|---|---|
| **13 décisions en même temps** | chaque nouvelle ralentit **aussi** les faciles — propriété des files, jamais une opinion |
| **La plus ancienne : 7 jours** | #390, dont la réponse tient en une ligne |
| **45 leçons jamais jugées** | le registre grossit sans que personne sache s'il sert |
| **5 registres sans lecteur** | cinq données fraîches que seul leur producteur relit — il y en avait six |

**Six des treize sont dans ce document avec une recommandation en une ligne.** Les sept autres sont
des idées en attente dans `docs/idees-a-trancher.md`, qui ne bloquent rien.

### CE QUI A BOUGÉ DEPUIS, ET C'EST MESURÉ *(mise à jour du 2026-09-29, nuit autonome)*

| Ligne ci-dessus | Ce qu'elle dit aujourd'hui |
|---|---|
| **6 registres sans lecteur** | **5.** Celui du filet en parts en a reçu un VRAI (#1208) : il portait un gain de temps écrit à la main que rien ne vérifiait, et l'outil qui chronomètre le filet le confronte désormais à son propre relevé. Les cinq autres sont laissés exprès — leur inventer un lecteur pour faire descendre un compteur serait l'outil fabriqué pour cocher la case |
| **La Ronde (#841), « 30 commits sans passage »** | **plus de 40.** Elle n'a pas été lancée cette nuit, et la raison est écrite (#1216) : deux de ses douze étapes exigent ta présence. La substance — dix outils passés un par un — a eu lieu ; c'est la cérémonie qui t'attend |
| **Le nombre de décisions** | **deux de plus**, nées de la nuit et posées avec leur mesure : **#1203** (38 balayages de fichiers sur 42 perdent un fichier illisible en silence — corriger touche 14 outils, donc c'est ta décision) et **#1209** (le critère « donnée fraîche sans lecteur » convient-il au registre d'un OUTIL, dont le lecteur naturel est l'agent ?) |

**Aucune de ces trois lignes n'a été corrigée de mémoire** : chacune vient d'un outil relancé cette
nuit, et la commande qui la remesure est nommée dans la fiche correspondante.

---

## PLAN D'ACTION *(Article 28)*

| Constat | État | Ce qu'il devient |
|---|---|---|
| 13 décisions attendent en même temps, la plus ancienne depuis 7 jours | **RETENU** | tâche **#1163** — ce document, huit décisions présentées par lots avec leur recommandation |
| La décision #819 reposait sur un relevé périmé (140 s au lieu de 94 s) | **RETENU** | déjà corrigé (#1152) : la question change, et la réponse recommandée aussi |
| Aucune des 45 leçons n'a jamais été jugée appliquée | **À TRANCHER** | #842 — et le mécanisme refuse de juger à sa place, par sa propre décision |
| Les cinq plus anciennes tâches ouvertes attendent un arbitrage | **À TRANCHER** | #845 — la leçon L22 interdit de fermer ce qu'il a mis de côté |
