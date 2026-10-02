# Ronde GOAT MAX PAYANTE — 2026-10-02

**Ouverte dans les règles** à 16:38 UTC : Q1 (changement de modèle) posée et répondue — *non, Opus 5* ;
fenêtre AUTO/PRIME/GOAT posée et répondue par l'utilisateur — *GOAT MAX PAYANTE, 45 items* ; ouverture
enregistrée (`docs/circle-tasks/ouverture.json`), ce qui autorise la clôture.

**Séquence de l'Étape 5, déclarée** : les 26 rapports individuels ont été **livrés** (archive +
bilan d'exécution + les deux rapports détachés) **AVANT** la construction de cette analyse. Écrire un
fichier sur le disque n'est pas le livrer ; les deux gestes sont distincts et l'ordre est imposé.

**Items payants** : 3 des 4 cochés par l'utilisateur. **THE-DEEP-READER n'a PAS été lancé** — il ne
l'a pas coché, et un item non coché ne se lance pas.

---

## Estimation contre réel — c'est elle qui corrige la suivante, jamais une nouvelle intuition

| | Annoncé avant | Réel | Écart |
|---|---|---|---|
| Durée | 2 h à 2 h 30 | **~45 min** jusqu'à cette analyse | **nettement plus rapide** |
| Jetons d'agent | ~150 000 | ~100 000 (1 agent aveugle à 99 692 + 1 audit en cours) | conforme, voire en dessous |
| Items exécutés | 45 | **26 par commande directe** + 3 payants + 16 items de procédure | voir la réserve ci-dessous |

**La réserve, et elle est sérieuse** : sur les 45 items, **26 seulement portaient une commande que
j'ai pu extraire automatiquement** de leur champ `execute`. Les 16 autres décrivent une procédure de
lecture ou de jugement, sans ligne de commande unique. Je les ai donc traités par la lecture des
rapports des 26 autres, ce qui **n'est pas la même chose** que de les exécuter un par un. Un item de
procédure traité « au passage » peut passer pour fait sans l'être — c'est à inscrire comme une
faiblesse du dispositif de Ronde, pas comme un détail d'exécution.

**Pourquoi la durée a été deux à trois fois plus courte qu'annoncé** : j'ai lancé les 26 items en
lot vers des fichiers plutôt qu'un par un dans la conversation. Honnête, mais ça veut dire que mon
estimation d'origine chiffrait une autre méthode que celle employée.

---

## Les constats, triés — jamais un récapitulatif

### RETENU — corrigé dans cette Ronde

**1. Le rapport central de l'export n'avait JAMAIS produit son fichier depuis sa création.**
`safe-export.mjs rapport` plantait sur `ReferenceError: kits is not defined` : les deux mesures
étaient lues comme des variables locales alors qu'elles sont des **champs** de l'objet rendu par
`mesuresDeLExport()`. Le plantage arrivait **après** l'impression de ses lignes et **avant**
l'écriture de son archive — donc la sortie à l'écran était complète et parfaitement crédible, et
seul le code de sortie disait la vérité. Il promettait un fichier archivé depuis le 2026-09-28 et
n'en avait jamais écrit un seul. **Pourquoi personne ne l'avait vu : une Ronde l'a lancé pour la
première fois aujourd'hui** — un rapport qu'on ne lance jamais ne signale jamais qu'il est cassé
(leçon L2). Corrigé, relancé, archivé, verdict « ✅ EXPORT PRÊT ». → **tâche #1454**

**2. Le test à l'aveugle tirait dans une population incluant les fichiers dispensés de kit.**
Le tirage est tombé sur `scripts/hooks/pre-commit` et l'outil a crié qu'il « n'a AUCUN document
lisible ». Vrai, et **faux rouge** : un crochet git est l'un des trois fichiers dont la charte
déclare, avec sa raison, qu'il ne quittera jamais ce dépôt. Réclamer un kit d'export à un crochet
git, c'est demander un travail que la charte interdit — et un garde-fou qui crée du travail inutile
cesse d'être lu (**leçon L4**). **Le plus instructif : la classe était DÉJÀ corrigée ailleurs** —
`findScriptsNonPortables()` honore `estExemptDuKit()` depuis le 2026-09-26, et cet outil importait
même déjà `exemptionDuKit` pour un autre usage deux cents lignes plus bas. La correction n'avait pas
été **héritée** : c'est l'Article 24 pris en défaut. → **tâche #1453**

**3. Trois dossiers sans index et un journal en retard — causés par la Ronde elle-même.**
Les fichiers que la Ronde venait d'écrire (sauvegarde, test aveugle) ont créé des dossiers que
`testSystemeDesIndex` a aussitôt refusés. **Ce n'est pas une contradiction avec le filet vert
d'il y a une heure** : l'état du dépôt avait changé entre les deux. Indexes générés, journal du test
aveugle rattrapé avec ce que le test a réellement trouvé. → inclus dans **#1453**

### RETENU — à traiter, tâches ouvertes

**4. Le kit d'export de `find-booster` : 🟡 PERFECTIBLE — 92 % de rappel, 7 % de bruit.**
12 des 13 fonctions réelles étaient annonçables depuis les documents seuls. Mais la fiche nomme
`DESCRIPTION_PREVIEW_LENGTH`, que le code n'expose pas — **une documentation qui fait croire à
quelque chose qui n'existe pas**, ce qui est pire qu'un manque. → **tâche à ouvrir**

**5. Et le constat qui vaut bien plus que le précédent : le manque est SYSTÉMIQUE.**
`HARMONIA_THEME_KEYWORDS` n'était annonçable par personne, parce qu'**aucune des 12 rubriques du
gabarit ne demande de lister ce que l'outil EXPOSE**. Tous les kits du dépôt portent donc le même
trou, et aucun ne le comblera jamais tant que le gabarit ne le demande pas. → **tâche à ouvrir**

**6. Huit zones d'ombre qu'aucune mesure mécanique ne voit**, relevées par l'évaluateur aveugle :
incohérence de langue des noms (anglais partout sauf une section en français), comptage
contradictoire des motifs d'extraction (cinq décrits, « quatre » annoncés trois fois), aucun contrat
de données, dépendances d'export non qualifiées (lues à l'exécution ou copiées en dur ? décisif pour
un kit remonté ailleurs), et **`lib/reference.ts` — retiré du produit le 2026-09-27 — toujours donné
comme exemple central d'un motif**. → **tâche à ouvrir**

**7. Six paires de documents couvrent le même terrain sans qu'aucun ne cite l'autre.**
À instruire une par une : fusionner, ou déclarer la séparation avec sa raison. → **tâche à ouvrir**

### À TRANCHER — ces décisions ne sont pas les miennes

**8. Un seuil est passé AU-DESSUS de tout ce qu'on observe, et son zéro ne mesure plus rien.**
Le détecteur de chevauchement entre offres du catalogue utilise un seuil de **4 mots partagés**,
posé en 2026 dans un trou franc de la distribution. Le catalogue a grossi : le maximum réel est
aujourd'hui de **3**. Aucune paire ne **peut** donc atteindre le seuil, et « aucun chevauchement »
rend exactement le même texte que « je ne peux pas en voir » (leçons L5 et L11). **L'outil refuse
lui-même de choisir un nouveau chiffre** : la pente est devenue continue, il n'y a plus de trou, et
inventer une frontière qu'on prétend lire serait pire. Deux issues : **soit ce signal a fait son
travail et s'arrête, soit le chevauchement se mesure sur autre chose que les mots de la demande.**

**9. Les 4 clusters de CLONE-HUNTER** portant leur raison écrite (détail dans
`docs/idees-a-trancher.md`) — zéro constat en « retenu », 4 décisions qui t'attendent.

**10. Dix-neuf décisions attendent en même temps**, et la fluidité médiane de la file est de 50 % :
la moitié du délai d'une tâche est de l'attente pure. Au-delà d'un certain remplissage, le temps
d'attente d'une file n'augmente plus proportionnellement, il explose — donc chaque décision de plus
ralentit **aussi** les faciles. Ce n'est pas un reproche sur ton rythme : c'est une propriété des
files, et la seule sortie est de trancher par lots.

**11. Trois outils « flash dans la poêle »** : `filet-en-parts` a servi 22 fois sur 22 dans les
24 h de son premier passage, puis plus rien depuis 3 jours ; `el-professor` 6 sur 7, puis rien ;
`simulations` 5 sur 6, puis rien. Un outil qui n'a servi qu'à se construire lui-même a coûté son
prix d'entrée sans jamais rendre son service. Le compte cumulé le cache complètement.

### ÉCARTÉ — avec la raison écrite

**12. THE-SCREENER a échoué (`EXIT=1`) — mais c'est MA commande qui était fausse**, pas l'outil :
mon extraction automatique a pris le mot « contre », qui appartient à la prose du champ `execute`,
pour une URL à visiter. L'item est de plus **conditionnel** : il n'a de sens qu'avec un serveur de
jeu qui tourne, et il n'y en a pas. Écarté pour cette Ronde, sans dette.

**13. La passe profonde d'ALWAYS-NEW-CODE n'a pas été lancée**, bien que tu aies coché
HYPER-SCAN-CHECKPOINT complet. Sa couche légère a tourné (ARGUS 6 candidats, HARMONIA 0 friction),
et elle recommande la zone **« cycle jour/nuit »** — c'est-à-dire `lib/daynight.ts`, donc **le jeu**,
que tu as explicitement mis de côté. Brûler une passe de raisonnement payante sur une zone hors
périmètre aurait été dépenser pour rien. **Si tu veux la passe, dis-moi sur quelle zone de
l'outillage la pointer** : le choix de zone est précisément ce que l'Article 7 interdit de prendre
seul sans te demander.

**14. La note « esprit » est à 38/100** au tableau de bord — mais elle porte sur la fidélité à la
charte de la dernière simulation **de jeu** notée, et elle repose sur une seule composante. Hors
périmètre tant que le jeu est de côté ; signalé parce que c'est l'Article 0 et qu'un chiffre bas sur
la loi suprême ne se tait pas.

---

## Ce que cette Ronde dit d'elle-même

**Le dispositif a trouvé deux défauts réels que rien d'autre n'aurait trouvés**, et les deux ont la
même forme : **un outil qu'on ne lance jamais ne signale jamais qu'il est cassé.** Le rapport central
de l'export promettait un fichier depuis quatre jours sans jamais en écrire un ; le test à l'aveugle
accusait un fichier que la charte dispense. Aucun des deux n'aurait été vu sans une Ronde.

**Et elle dit aussi sa propre faiblesse** : 16 de ses 45 items sont des procédures sans commande, donc
impossibles à exécuter mécaniquement et faciles à faire passer pour faits. C'est le constat le plus
inconfortable de la journée, et il est à ouvrir comme tâche.

---

## Plan d'action

| État | Constat | Tâche |
|---|---|---|
| **RETENU — fait** | le rapport central de l'export plantait avant d'écrire son archive | **#1454**, corrigé et vérifié (`EXIT=0`, fichier archivé) |
| **RETENU — fait** | le tirage aveugle incluait les dispensés de kit ; 3 index + 1 journal en retard | **#1453**, corrigé et vérifié |
| **RETENU** | la fiche de `find-booster` annonce une constante que le code n'expose pas | **#1455** |
| **RETENU** | aucune rubrique du gabarit ne demande ce que l'outil EXPOSE — tous les kits portent le trou | **#1456** |
| **RETENU** | 8 zones d'ombre du kit, dont une référence à un fichier retiré du produit | **#1457** |
| **RETENU** | 6 paires de documents couvrent le même terrain sans se citer | **#1458** |
| **RETENU** | 16 des 45 items de Ronde n'ont pas de commande exécutable | **#1459** |
| **À TRANCHER** | le seuil de chevauchement (4) est au-dessus du maximum réel (3) : arrêter le signal, ou le mesurer autrement | ta décision |
| **À TRANCHER** | les 4 clusters CLONE-HUNTER portant leur raison écrite | ta décision |
| **À TRANCHER** | 19 décisions en attente, fluidité de la file à 50 % | ta décision, par lots |
| **À TRANCHER** | 3 outils « flash dans la poêle » : les relancer, ou acter qu'ils ont fait leur temps | ta décision |
| **ÉCARTÉ** | THE-SCREENER `EXIT=1` | ma commande extraite était fausse, et l'item est conditionnel à un serveur de jeu absent |
| **ÉCARTÉ** | passe profonde d'ALWAYS-NEW-CODE | la zone recommandée est le jeu, que tu as mis de côté ; le choix d'une autre zone t'appartient (Article 7) |
| **ÉCARTÉ** | note « esprit » 38/100 | porte sur une simulation de jeu, une seule composante, hors périmètre actuel |
