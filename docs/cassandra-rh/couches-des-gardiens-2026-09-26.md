# Les COUCHES des Gardiens sacrés — mesure et propositions outil par outil

*(2026-09-26, tâche #916. Point 23 de son gros prompt : « les Gardiens sacrés en Ronde — mesurer les
couches, proposer outil par outil ». Mesuré par `analyseDesCouches()` (CASSANDRA-RH) croisé avec le
recensement de LE-CLASSIFICATEUR et la colonne `cout` du catalogue PRESTATIONS.)*

## Le rappel de la définition, parce que c'est le COÛT qui sépare les couches

- **light** — tourne à chaque commit. Donc gratuite, par construction.
- **target** — se lance à la demande sur une cible précise (un fichier, une zone).
- **warrior** — coûte de l'argent : un appel réseau sortant, ou un passage de raisonnement payant.

Un outil n'a pas un niveau, il a des **couches**. La question « qui mérite une seconde couche ? »
n'a de sens que dans cette échelle.

## La mesure, sur le dépôt réel

| | Combien | Qui |
|---|---|---|
| Couche lourde déclarée | **4** | `check-spirit` · `check-gemini-quota` (Smart Breaker) · `hyper-scan-checkpoint` · `le-classificateur` |
| N'ont qu'une couche légère | **20** | dont **`check-argus`**, **`check-harmonia`**, `clean-dirty-old` |
| Candidats à l'enchaînement léger → lourd | 2 | `hyper-scan-checkpoint` · `le-classificateur` |

## LE VRAI CONSTAT : la charte annonce une couche lourde que le registre ne porte pas

L'Article 20 dit, mot pour mot : **« ARGUS et HARMONIA ajoutent en plus, sur demande, une seconde
partie à vrai raisonnement (coût réel, Article 8) »**.

**La mesure dit le contraire** : ni `check-argus` ni `check-harmonia` n'apparaissent comme coûtants
dans le catalogue PRESTATIONS — la colonne `cout`, qui est le registre que la mesure lit, et celui
que tool-brain affiche à chaque commit.

**Trois lectures possibles, et elles appellent trois gestes opposés** :

1. la couche lourde existe et le catalogue ne la déclare pas → **le catalogue est en dette** ;
2. la couche lourde n'existe pas → **la charte promet quelque chose qui n'a jamais été construit** ;
3. la couche lourde est un geste de l'AGENT (relancer ARGUS en réfléchissant) et non une commande →
   alors elle n'est portée par rien de mécanique, et **c'est à déclarer comme telle** (Article 27).

**C'est à trancher par lui, pas par l'agent** : la charte est intouchable sans son accord, et les
trois lectures ont un coût différent. → tâche **#917**.

## Propositions, outil par outil — elles PROPOSENT, elles ne décident pas

| Outil | Couches aujourd'hui | Proposition |
|---|---|---|
| **ARGUS** | light seule (mesurée) | trancher #917 d'abord : sa couche lourde est promise par la charte et invisible au registre |
| **HARMONIA** | light seule (mesurée) | idem #917 — même promesse, même invisibilité |
| **AXA-CHECK** | light seule | **aucune seconde couche.** Il mesure une couverture de test : une version « qui réfléchit » ne dirait rien de plus qu'un chiffre déjà exact |
| **CLEAN-DIRTY-OLD** | light seule | **candidat sérieux**, et c'est le seul de la liste : il détecte une stagnation et s'arrête là. Une couche lourde qui LIRAIT la zone stagnante pour dire si elle mérite une refonte répondrait à la question qu'il pose sans y répondre |
| **CLONE-HUNTER** | light seule | **aucune.** Ses 23 doublons sont un fait vérifiable ; ce qui manque n'est pas du raisonnement, c'est une décision humaine de factoriser ou non |
| **ALWAYS-NEW-CODE** | light seule | **déjà pourvu, hors mesure** : sa couche lourde EXISTE (le vrai zoom « page blanche », Article 23), mais elle se déclenche par CHECK-LEVEL-TARGET et non par une commande — donc invisible à cette sonde, exactement comme la 3ᵉ lecture ci-dessus |
| **SAFE-EXPORT** | light seule | **aucune pour l'instant** : ses mesures d'export construites cette nuit (#906) sont toutes gratuites et suffisent |

**Bilan honnête : un seul vrai candidat** (CLEAN-DIRTY-OLD), deux cas à trancher (ARGUS, HARMONIA),
un cas déjà pourvu mais invisible à la mesure (ALWAYS-NEW-CODE), trois pour lesquels une couche
lourde n'apporterait rien.

## Un défaut de la mesure elle-même, trouvé en la lançant

`analyseDesCouches()` accusait les **quatre** couches lourdes de n'avoir « JAMAIS été lancées »,
alors que deux avaient tourné dans l'heure. Cause : le compteur d'usage qu'on lui passe était vide,
et **un compteur vide rend le même zéro qu'un outil jamais lancé**. C'est la leçon L11, dans une
fonction écrite pour détecter précisément ce genre de confusion.

Corrigé : la liste n'est plus produite quand le compteur est vide — `warriorsJamaisLances` vaut
`null` et `pourquoiPasDUsage` dit pourquoi. Le contre-test vérifie que l'accusation revient dès que
le compteur porte une entrée : un garde-fou qui cesse d'accuser ne protège plus.

## PLAN D'ACTION

| État | Constat | Ce que ça devient |
|---|---|---|
| **À TRANCHER** | La charte promet une couche lourde à ARGUS et HARMONIA ; le registre ne la porte pas | tâche **#917** — trois lectures, trois gestes opposés, et c'est sa décision |
| **RETENU** | Le compteur vide faisait accuser à tort | corrigé dans le même commit, avec son contre-test |
| **ÉCARTÉ** | Donner une couche lourde à AXA-CHECK, CLONE-HUNTER, SAFE-EXPORT | leurs mesures sont des faits exacts ; ce qui manque après elles est une décision humaine, pas du raisonnement supplémentaire. En construire une serait payer pour un doublon de ce qu'on sait déjà |
