# FIL 06 — L'export de l'Agence, son noyau, et la question des « plusieurs versions »

**Balle :** À TOI
**Dernier mouvement :** 2026-10-03
**Place dans le plan :** Étage 2 — ça ne se décide qu'une fois l'organisation cible posée (fil 03), et ça commande la commercialisation (fil 07).
**Saisines :** COMMANDE IMPORTANTE · TARGET ARCHITECTURE · réponses 2026-09-29 · réponses 2026-09-30 · sa consigne du 2026-10-01 (« complète la portabilité ») · gros prompt du 2026-10-02 (le filet transporté) · réponses 2026-10-03 (le module, le cœur)

---

## ① L'HISTOIRE — ce qui s'est déjà dit sur ce sujet, résumé

**Ce que tu as demandé** — savoir si l'Agence peut réellement partir ailleurs, et décider si on
proposera **plusieurs versions** (une légère, une complète) ou une seule.

**La mesure est faite, et elle est dérangeante.** Elle répond à une phrase de ta propre TARGET
ARCHITECTURE : *« un fichier séparé n'est pas automatiquement un module extractible »*. Trois
mesures, trois réponses qui ne se contredisent pas — elles répondent à trois questions
différentes :

| La question posée | La réponse mesurée |
|---|---|
| un fichier « noyau » a-t-il besoin d'un fichier hors noyau ? | **99 % propre** — 73 fichiers sur 74, un seul lien à couper |
| le fichier nomme-t-il des chemins qui n'existent que chez nous ? | **56 % en portent** — 41 fichiers sur 74 |
| ces chemins sont-ils **réglables de l'extérieur** ? | 🔴 **CE CHIFFRE EST RETIRÉ le 2026-10-01 — il n'est pas reproductible** (voir ci-dessous) |

**Donc : selon la question, le même noyau paraît 99 % portable ou 5 % portable.** Ce n'est pas une
contradiction, c'est la différence entre « les pièces tiennent ensemble » et « les pièces savent
vivre ailleurs ».

> ### ⚠️ CORRECTION DU 2026-10-01 — le « 5 % » et le « 38 sur 40 » sont retirés
>
> **Le chiffre venait d'une commande qui n'existe plus** : le document du 29/09 qui le porte ne
> cite aucun script, donc rien ne le rejoue (leçon L2). **Quatre tentatives de le reproduire ont
> donné quatre réponses différentes en vingt minutes.**
>
> **Et le garde-fou de portabilité du projet dit l'inverse** : `findScriptsNonPortables()` rend
> **0 script non portable sur 88**. Chaque cas ouvert à la main était une **déclaration**
> (`export const …`, `path: "…"`), jamais un chemin enfoui — y compris les 599 occurrences de
> `check-house`, qui sont des **faux chemins de test** dans des assertions.
>
> **Ce qui reste vrai** : le vrai couplage existe, mais il est **rare et concentré**, pas général.
> Détail complet et correction : `docs/grand-projet/02-strategie/la-portabilite-vraiment-mesuree.md`.

**Les chiffres par fichier qui suivaient ici** — `le-classificateur` 37, `circle-tasks` 28,
`god-of-all-process` 26, `safe-export` 18 — **sortaient de la même commande disparue et sont
retirés pour la même raison.** Vérifiés à la main, ces trois derniers ne portent que des
déclarations.

**Sur les « plusieurs versions »** : l'analyse de ce qui ralentit le projet (outil JESUS-LE-SAUVEUR,
passage du 29/09 à 23h06) couvre **trois** de tes quatre axes — le codage, l'IA, l'Agence. Elle ne
sait **rien dire du JEU**. C'est écrit en tête de ce document plutôt qu'en note de bas de page.

---

## ② OÙ ÇA SE SITUE — et pourquoi ce sujet existe

**C'est l'étage 2.** Il dépend de l'organisation cible (on ne sait pas quoi exporter avant de
savoir ce qu'est l'Agence), et il commande la commercialisation (on ne vend pas ce qu'on ne sait
pas livrer).

**Le lien avec le fil 05 est direct et nouveau** : cette mesure porte sur les **fichiers d'outils**.
L'axe création/produit fini (fil 05) porte sur les **documents**. Les deux moitiés de la même
question, et une seule était mesurée.

---

## ③ LA CHAÎNE VIVE — numérotée, pour que tu puisses répondre par le numéro

**Q6.1 — LA QUESTION TOMBE, ET JE TE DOIS LA RAISON** *(corrigée le 2026-10-01, tâche #1354)*.
Elle demandait quand traiter « les 38 fichiers à chemins écrits en dur ». **Ce chiffre n'est pas
reproductible, et il a été retiré** : il venait d'un document du 29/09 qui ne cite aucun script,
et le garde-fou de portabilité du projet dit l'inverse — **0 script non portable sur 88**. Chaque
cas ouvert à la main était une DÉCLARATION en tête de fichier (la forme portable), jamais un
chemin enfoui.

**Tu avais déjà répondu (a) maintenant**, le 01/10 à 00h40 : *« complète la portabilité des
fichiers »*. **J'ai donc traité la demande plutôt que la question** : il n'y a pas de chantier de
38 fichiers à mener. Ce qui reste de vrai couplage est **rare et concentré** — deux ou trois
outils qui ouvrent un chemin en dur au lieu de le déclarer — et c'est la tâche **#1323**, déjà
ouverte, qui le porte.

**Et le sens de la correction compte autant que la correction** : c'est un argument **en moins**
pour la refonte, pas en plus. Sur ce point précis, la structure de l'Agence est déjà proche de la
forme portable.

**CE QUI RESTE VRAIMENT À DÉCIDER ICI, et ce n'est pas la même question** : rien ne distingue
aujourd'hui une règle « qui reste chez nous » d'une règle « qui part avec l'Agence » — c'est la
séparation des deux cas de figure de la stratégie globale
(`docs/strategies/strategie-globale-du-projet-entier.md`), et la tâche **#1320** la porte.
*Question : on étiquette TOUS les documents, ou seulement ceux qui partent ?*

**Q6.2 — À TOI.** Plusieurs versions ou une seule ? L'analyse penche vers **une seule**, parce que
maintenir deux versions double le coût de chaque règle nouvelle — mais c'est ta décision
commerciale, pas ma mesure. *(a) une seule · (b) deux (légère / complète) · (c) montre-moi le coût
chiffré des deux avant que je tranche*

**Q6.3 — PARTIELLEMENT FAIT le 2026-09-30, tâche #1322.** Le JEU a désormais sa sonde, et
JESUS couvre enfin les **quatre** axes que tu avais nommés. Ce qu'elle mesure : **9 821 tokens
envoyés en moyenne par personnage et par tour** sur 310 tours réels, et **deux cerveaux par
tour** — soit **~19 600 tokens par tour de jeu**. C'est le premier poste de lenteur, avant tout
rendu 3D. Ce qu'elle NE mesure pas est nommé un par un dans sa sortie : la latence réelle, les
images par seconde, le poids envoyé au navigateur, et le ressenti d'un visiteur.

**Q6.4 — À MOI, tâche **#1323**.** Rendre les chemins réglables **sans toucher au comportement** — c'est exactement
ta borne (« rien de difficile à annuler »). Je dois prouver ça avant de proposer le chantier.

---

## 2 OCTOBRE — LE FILET TRANSPORTÉ, ET LA SÉPARATION AGENCE / UTILISATEUR

**Tes quatre questions sur le filet, posées d'un bloc :**

> « on en aura plus besoin une fois le code fini ? je veux dire l'utilisateur n'hérite pas de ce
> filet ? […] est ce que par la suite l'utilisateur peut "casser l'agence" en codant son projet ?
> comment isoler/proteger l'agence, "verrouiller le code" je ne connais pas ? […] Est-ce que le
> filet consomme des tokens, plus il est long ? »

**UNE RÉPONSE EST DÉFINITIVE ET JE TE LA DONNE TOUT DE SUITE : NON, le filet ne consomme AUCUN
token.** C'est un programme qui tourne en local ; il ne fait aucun appel à un modèle d'IA, quelle
que soit sa longueur. Ce qu'il coûte est du **temps d'attente** — environ 9 minutes aujourd'hui —
et rien d'autre. Si ta crainte était budgétaire, elle est levée.

**Les trois autres demandent un vrai dossier, et elles cachent une tension réelle** que ta
formulation a bien identifiée : *« raisonnablement l'agence ne peut pas débarquer avec un filet de
plus de 30 sec, le filet doit être dispo pour le vrai projet de l'utilisateur »*. Le problème est
que le filet est écrit **POUR ce dépôt-ci** : transporté tel quel, il testerait du code qui
n'existe plus chez l'utilisateur. Ce n'est pas un problème de taille, c'est un problème de nature.

### Un fait mesuré qui rend ta peur fondée

Tu écris, dans un autre point du même prompt : *« Ma peur : j'installe l'agence dans un nouveau
projet, je l'utilise mais je ne la reconnais pas et certaines choses ne fonctionnent plus du
tout. »*

**Vérifié le jour même** : `the-king fonder`, l'outil dont le seul rôle est de doter un projet
d'accueil de ses textes fondateurs, **n'a jamais tourné contre un projet d'accueil**. Il a tourné
ici, où il se comporte correctement en ne proposant rien (ce projet a déjà ses textes) — mais
c'est le cas facile, et c'est l'inverse de sa raison d'être. **Le seul cas pour lequel il existe
n'a jamais été exercé une fois.** C'est littéralement « ça ne fonctionne plus du tout et personne
ne le sait ».

**Q6.5 — À TOI.** Le filet transporté : quelle forme veux-tu qu'il prenne chez l'utilisateur ?
*(a) il part tel quel, et l'utilisateur en hérite avec ses 9 minutes · (b) il part découpé en deux
— une part qui teste l'Agence elle-même, une part vide à remplir par l'utilisateur · (c) il ne
part pas, et l'Agence est livrée « figée » avec une preuve qu'elle était verte au départ · (d) je
ne sais pas, explique-moi d'abord ce que chaque option coûte*

**Q6.6 — À MOI, tâche #1485.** Le dossier complet : hériter, casser, verrouiller — avec la liste
de ce qui n'est PAS rationalisable, dont le filet est le plus gros morceau.

**Q6.7 — À MOI, tâche #1481.** Faire tourner `fonder` contre un dépôt vierge pour de vrai, et
rendre ce qu'il produit. Une mesure, pas une opinion.

**Q6.8 — À MOI, tâche #1484.** La liste des règles qui vivent dans mes instructions et PAS dans
les fichiers de l'Agence — celles qui disparaîtront à l'export sans que personne le voie.

---

## CE QUI A BOUGÉ LE 2026-10-03 — le cœur est défini, et il est mesuré

**Ta question (P28, P30, P31, P46, P85) :** *« Un module est un ensemble d'agents qui œuvrent dans
un sens commun pour produire UNE PRESTATION. La partie indétachable est ce que toute prestation
réclame quoi qu'il arrive, le cœur est le cœur de la partie indétachable. […] encore faut-il
définir le cœur. Ai-je bien compris ta vision ? Est-ce réaliste ? »*

**Ma réponse, et elle est mesurée, pas raisonnée** *(rapport :
`docs/livrables/le-module-la-partie-indetachable-le-coeur-2026-10-03.md`, tâche #1538)* :

- **Prise au mot, ta définition de la partie indétachable rend UN SEUL fichier** sur 88 points
  d'entrée. Ce n'est pas une mesure ratée : il suffit d'un outil autonome pour vider une
  intersection. **Ce que ça dit répond à ton « est-ce réaliste ? » : l'Agence est DÉJÀ presque
  entièrement modulaire.** Ce qui manque n'est pas la modularité — c'est le cœur.
- **Le cœur fait QUATRE fichiers** : `lib-json` (atteint par 100 % des points d'entrée),
  `tool-usage` (99 %), `lib-shell` (97 %), `report-template` (94 %). Le suivant tombe à 51 %, donc
  la coupe n'est pas un choix : elle est lue dans la distribution.
- **Ta définition du module décrit une CIBLE, pas l'état actuel** : 71 prestations sur 76 ne sont
  portées que par UN outil, alors que tu écris « un ensemble d'agents ».

**Q6.9 — À TOI.** Ta définition du module décrit la cible. *(a) on la garde telle quelle, et on
mesure l'écart à la cible · (b) on la reformule pour qu'elle décrive aussi l'état actuel · (c) on
en écrit deux, une « cible » et une « constatée » · (d) explique-moi d'abord ce que ça change*
