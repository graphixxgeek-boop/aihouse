# CE QUI RALENTIT LE PROJET — mesuré sur ses quatre axes, et ce que ça dit des « plusieurs versions »

<!-- ARBORESCENCE — bloc généré par `node scripts/the-king.mjs cascade --inserer`, ne pas éditer à la main -->

**Où ce document se situe dans la cascade** — remonté des déclarations « DÉCOULE DE » réelles, jamais dessiné à la main :

```
philosophie-et-politique
    └── grand-projet/02-strategie/la-cible-2026-09-29
        └── grand-projet/02-strategie/le-chemin-2026-09-29
            └── grand-projet/03-plan-daction/ou-va-chaque-chose
                └── ▣ grand-projet/02-strategie/ce-qui-ralentit-le-projet   ← CE DOCUMENT
                    └── grand-projet/02-strategie/les-cinq-lots-de-decisions
```

<!-- /ARBORESCENCE -->

*(Nuit du 2026-09-29 au 30, heure LUE, source système. Tâches **#1250** et **#1251**.
Sa demande, mot pour mot : « je veux une analyse complète du sujet : qu'est-ce qui ralentit le
codage ET/OU l'IA ET/OU le jeu ET/OU l'agence […] POURQUOI : pour définir correctement si on va
VRAIMENT proposer plusieurs versions ».)*

> **DÉCOULE DE :** `docs/grand-projet/03-plan-daction/ou-va-chaque-chose.md`
> *il exécute une demande de son fichier de réponses ; il ne propose aucune étape nouvelle.*

**L'outil, et son passage réel** *(Article 31, faille n°8 — un outil cité sans passage enregistré
est un outil qui n'a pas tourné)* : **JESUS-LE-SAUVEUR**, `node scripts/jesus-le-sauveur.mjs`,
passage du **2026-09-29 à 23h06 UTC**. 350 lignes rendues. Ce document commente son rapport ; il
ne le remplace pas.

---

## CE QU'IL FAUT SAVOIR AVANT DE LIRE : JESUS NE VOIT PAS LES QUATRE AXES

Tu en as nommé quatre — le codage, l'IA, le jeu, l'Agence. **L'outil en couvre trois.** Il mesure
le rythme, les obligations, l'attention et l'attente : c'est-à-dire **le codage, moi, et
l'Agence**. Il ne sait rien dire du **JEU** — ni de sa lenteur de rendu, ni de son temps de
réponse, ni de ce qu'un visiteur ressentirait.

**Je le dis en premier plutôt qu'en note de bas de page**, parce que la conclusion d'un rapport
qui tait ce qu'il n'a pas regardé se lit comme une conclusion sur tout. Le quatrième axe attend
une mesure que personne n'a encore construite, et c'est une tâche, pas un oubli.

---

## ① LE PLUS GROS FREIN EST UNE FILE D'ATTENTE, ET ELLE EST DE TON CÔTÉ

**17 décisions attendent ta réponse. La plus ancienne depuis 7 jours.**

| Depuis | Tâche | Sujet |
|---|---|---|
| 7 j | #390 | Outillage / badge |
| 5 j | #767 | Charte / quelles autres règles à fort levier manquent ? |
| 5 j | #814 | Données / brancher un lecteur, ou déclarer l'absence |
| 4 j | #819 · #823 · #830 · #842 · #845 | Filet · compteur d'usage · idées · Ronde · file |

**Ce que JESUS ajoute, et que je n'aurais pas su dire seule** : au-delà d'un certain remplissage,
le temps d'attente d'une file **n'augmente plus proportionnellement, il explose**. Ce n'est pas un
avis sur ton rythme de réponse — c'est une propriété des files d'attente. Concrètement : **chaque
décision de plus ralentit aussi toutes les autres, y compris les faciles.**

**Ce n'est pas un reproche, et je ne l'écris pas comme tel.** Tu travailles la journée, tu rentres
à 18h40, et tu as répondu à quarante-neuf questions hier soir. Le problème n'est pas ta vitesse :
c'est que **je pose plus vite que ce qu'un humain peut trancher**, et que rien dans mon
fonctionnement ne me le fait sentir. Il n'y a que deux sorties possibles, et la première est la
mienne :

1. **Grouper mes questions par lots tranchables en une fois** plutôt que de les déposer au fil de
   l'eau. Un lot de huit décisions liées se tranche en dix minutes ; huit questions isolées, jamais.
2. **Déclarer un défaut** pour les décisions dormantes : au bout de N jours, la question part avec
   l'option que je recommande, révisable. *(Celle-là est une décision, donc elle t'appartient — et
   oui, j'ai conscience que je viens d'ajouter une dix-huitième ligne à la file.)*

## ② QUARANTE POUR CENT DU DÉLAI EST DE L'ATTENTE, ET C'EST UN PLAFOND

**Fluidité médiane : 60 %** sur les 47 tâches ayant passé au moins une nuit. Autrement dit,
**40 % du temps écoulé entre le début et la fin d'une tâche est de l'attente pure.**

Deux précisions que l'outil impose et que je ne dilue pas :

- **304 tâches sont ÉCARTÉES du calcul** — celles faites d'un trait. Leur fluidité vaut 100 % par
  construction, jamais par mérite ; les compter aurait gonflé le chiffre sans rien mesurer.
- **C'est un PLAFOND, pas une valeur.** Un jour portant un seul commit compte pour une journée
  travaillée entière. La fluidité réelle est donc **plus basse que 60 %**.

Les pires cas nommés : **#493 à 17 %** (1 jour travaillé sur 6 écoulés), **#574 et #776 à 20 %**,
**#604 et #749 à 25 %**. *(#776 est celle qui a laissé passer le défaut de tool-brain corrigé cette
nuit — cinq jours écoulés pour une journée de travail, et la moitié du défaut restée en place.)*

**Ce que la recherche extérieure dit là-dessus**, et c'est ce qui rend ce chiffre actionnable :
passer de 15 % à 30 % de fluidité **divise le délai par deux**. Le gain vit dans la suppression de
l'attente, jamais dans le fait de travailler plus vite. Nous sommes à 60 % — mieux que la moyenne
citée, et l'attente reste le premier poste.

## ③ LE COÛT DE CE QUI N'EST PAS LU — et c'est un cercle, pas une ligne

Deux mesures que personne ne rapproche jamais, et que JESUS croise exprès :

- **483 lignes réparties sur 34 sections** sont écrites à CHAQUE commit dans le fichier de reste,
  « relu à la demande » — c'est-à-dire par quelqu'un qui doit y penser.
- **273 relances rapprochées** du même outil sans aucun commit entre les deux, sur 848 passages
  (**32 %**) — et ce, après avoir écarté les 105 rafales du crochet, qui ne sont pas des frictions.
  En tête : **find-deep-booster 99**, **data-archangel 61**, **agent-du-temps 22**.

**Prises séparément, aucune des deux n'alerte. Ensemble elles décrivent un cercle :** ce qui n'est
pas vu passer se redemande. C'est le coût du changement de contexte — celui **qui ne s'impute à
aucune tâche, parce qu'il se paie ENTRE elles**, et c'est exactement pour ça qu'il n'apparaît dans
aucun bilan.

**Et c'est du côté de l'Agence, pas du tien.** Une bannière de 483 lignes par commit n'est pas de
l'information : c'est du bruit qui rend l'information invisible.

## ④ LE COÛT D'UN OUTIL DE PLUS : DIX REGISTRES, ET PERSONNE NE DISCUTE LA SOMME

**Dix registres à renseigner pour chaque outil qui arrive.** JESUS le formule mieux que je ne
saurais : *« pris un par un ils sont tous justifiés ; c'est leur SOMME que personne ne discute —
et elle se paie à chaque nouvel outil, pour toujours ».*

C'est le même mécanisme que les 93 obligations de la charte : aucune règle n'est de trop, c'est
leur accumulation qui pèse. Et la mesure de la nuit le confirme par l'autre bout — voir
`la-route-vers-50-obligations.md`.

## ⑤ UN FREIN QUI N'EN ÉTAIT PAS UN, ET LA CORRECTION EST PLUS INTÉRESSANTE QUE LA MESURE

JESUS annonce : *« PAS MESURÉ — 341 constats RETENUS dorment dans les rapports, et le taux
d'actionnabilité N'EST PAS CALCULABLE […] Seuls 5 portent un #nnnn »*.

**J'ai vérifié avant de le répéter, et c'est faux.** Le contrôle qui produit ce chiffre cherche le
mot « tâche » juste avant le numéro. Or la moitié des plans de ce dépôt écrivent `→ **#754**` ou
`**#741**, **#744**` — un rattachement parfaitement valide, invisible au contrôle.

**Mesuré sur les 188 constats RETENU de `docs/` :**

```
   le motif du contrôle en voyait ........  47   (25 %)
   portent RÉELLEMENT un numéro .........  89   (47 %)
   ─────────────────────────────────────────────
   constats bien rattachés, vus nulle part  42
```

**Le contrôle accusait la discipline la mieux tenue du projet**, et déclarait « non calculable »
un taux dont la donnée était là. C'est la leçon L4 dans sa forme la plus coûteuse — et le même
défaut que celui corrigé chez tool-brain deux heures plus tôt : **un signal ADJACENT lu comme le
signal visé.** Corrigé, testé, mesuré *(tâche #1250)*.

**Le vrai chiffre reste perfectible** : 53 % des constats RETENU ne portent aucune tâche. Mais
c'est un travail de rattrapage, pas un mécanisme cassé — et la différence entre les deux
diagnostics aurait coûté une nuit de chantier inutile.

---

## ⑥ LE JEU N'EST PAS MESURÉ — ET CE QUI LE SURVEILLE N'A TOURNÉ QU'UNE FOIS

*(Ajouté à 02h55. Ce document disait plus haut que JESUS ne voit pas le JEU, et ouvrait la tâche
#1252 pour ça. Voici la moitié de la réponse, trouvée sans coûter un seul appel API.)*

**L'Article 7 — l'épreuve de la page blanche — est l'outil dédié à la qualité structurelle du
JEU.** Ses huit zones sont toutes des zones de jeu : *Fatigue · Cycle jour/nuit · Enquête · Bonus
roulette · Appréciation de l'observateur · Dossier retourné · Déplacements/espace · Relation
Lia/Noé.*

> **Il a tourné UNE FOIS, sur UNE zone, le 2026-09-21.** Sept zones sur huit n'ont **jamais** été
> examinées. La charte dit « périodiquement ».

### CE QUE ÇA AJOUTE À LA MESURE DU RATIO, ET C'EST UNE NUANCE QUI COMPTE

J'ai mesuré cette nuit que la part du Jeu dans les tâches est **stable** (4,0 % → 5,5 %), et j'en
ai conclu que l'inquiétude de la charte — *un des deux projets pourrait étouffer l'autre* — ne se
vérifiait pas. **C'était vrai, et incomplet.**

| Ce qu'on mesure | Le verdict |
|---|---|
| la part des TÂCHES qui touchent au jeu | **stable** — rien ne se dégrade |
| le rapport de taille du CODE | **1 pour 20** — le jeu est petit, ce qui n'est pas la même chose que négligé |
| **l'outil dédié à la qualité du jeu** | **1 passage sur 8 zones, il y a 9 jours** |

**Le jeu n'est pas étouffé par manque d'attention : il est peu regardé par les outils qui
existent pour le regarder.** Ce n'est pas la même accusation, et la différence change ce qu'on
ferait pour y remédier.

**Ce que je ne fais pas, et pourquoi.** Lancer l'analyse sur la zone recommandée
(*Cycle jour/nuit*) produirait une proposition de refonte sur du code de jeu — que ta borne
m'interdit de toucher, et que l'Article 7 m'interdit d'appliquer seul de toute façon. **La
mesure est le livrable ; l'analyse attend que tu la demandes.**

---

## ET DONC : FAUT-IL VRAIMENT PLUSIEURS VERSIONS ?

**Ta question n'était pas « qu'est-ce qui rame ». Elle était : est-ce que ces freins justifient de
découper l'Agence en plusieurs versions.** Voici ce que la mesure répond, et ce qu'elle ne répond
pas.

### CE QUE LA MESURE SOUTIENT — et c'est un argument que je n'attendais pas

**Aucun des freins mesurés ne vient de la TAILLE du code. Tous viennent du NOMBRE
D'OBLIGATIONS ET DE SIGNAUX.** Dix registres par outil, 483 lignes de bannière par commit,
34 sections, 93 obligations de charte, 17 décisions en file. Pas une seule fois : « c'est trop
gros », « ça compile trop lentement », « le fichier est trop long ».

**C'est un argument FORT pour plusieurs versions, et un argument FAIBLE pour les découper comme on
le ferait d'habitude.** Découper par fonctionnalité — « la version qui fait les tâches », « la
version qui fait les process » — ne soulagerait rien : les dix registres et la bannière sont
transverses, ils suivraient chaque morceau.

**Ce que la mesure suggère à la place : découper par NIVEAU D'EXIGENCE, pas par fonction.**

| Version | Ce qu'elle impose | Pour qui |
|---|---|---|
| **Légère** | le filet de sécurité, le suivi, un ou deux Gardiens | quelqu'un qui veut que son projet tienne, sans discipline imposée |
| **Standard** | + les process, la Ronde, la charte réduite | un projet suivi dans la durée |
| **Complète** | ce que nous avons aujourd'hui | quelqu'un qui accepte de payer la rigueur au prix fort |

**Le juge, c'est la loi de l'Agence** : *son expérience à lui passe toujours en premier.* Une
Agence qui impose dix registres à quelqu'un qui en voulait deux sert sa propre cohérence, pas son
client. C'est exactement l'argument que tu as donné toi-même pour la cible de 50 obligations —
*« sinon : effet déceptif en découvrant ça »*. **Les deux décisions sont la même décision, prise
à deux endroits.**

### CE QUE LA MESURE NE RÉPOND PAS, ET QUE JE NE VAIS PAS DEVINER

1. **Combien de versions.** Trois est la découpe naturelle du tableau ci-dessus ; rien dans les
   chiffres ne l'impose plutôt que deux ou quatre.
2. **Si les versions sont des PRODUITS ou des RÉGLAGES.** Trois dépôts à maintenir, ou un dépôt et
   un curseur ? Ce n'est pas la même Agence, et ce n'est pas la même charge pour nous.
3. **Le quatrième axe, le JEU.** Il n'est pas mesuré, donc il ne pèse dans aucune de ces phrases.

---

## PLAN D'ACTION *(Article 28)*

| Constat | État | Ce qu'il devient |
|---|---|---|
| Le contrôle de la chaîne ne voyait que 47 des 89 constats réellement rattachés | **RETENU** | tâche **#1250** — corrigé, testé, mesuré cette nuit |
| L'analyse des freins sur trois axes, et ce qu'elle dit des versions | **RETENU** | tâche **#1251** — ce document |
| Le JEU n'est mesuré par aucun outil de LENTEUR | **RETENU** | tâche **#1252** — construire la sonde, ou déclarer qu'on ne mesurera pas cet axe |
| L'épreuve de la page blanche a tourné **1 fois sur 8 zones**, toutes des zones de jeu | **À TRANCHER** | tâche **#1281** — la charte dit « périodiquement » et c'est arrivé une fois en neuf jours. Lancer l'analyse est une décision : elle coûte du raisonnement, et elle porte sur du code que je ne peux pas toucher |
| 17 décisions en file, dont la plus ancienne depuis 7 jours | **À TRANCHER** | deux sorties proposées ci-dessus, dont l'une est de mon côté (grouper) et l'autre de la sienne (un défaut au bout de N jours) |
| Combien de versions, et produits ou réglages | **À TRANCHER** | c'est une décision de cadre, à joindre à la séance sur l'objectif ultime |
| 53 % des constats RETENU ne portent aucune tâche | **À TRANCHER** | rattrapage historique : par lot, par période, ou déclaré grandfathered — même question que les 242 clôtures sans déclaration de fidélité, et elle se tranche une fois pour les deux |
| Les 483 lignes de bannière par commit | **ÉCARTÉ, avec sa raison** | une décision de calibrage a déjà été prise sur ce sujet (tool-brain centralise en une bannière unique) ; la rouvrir à 23h sans lui serait rouvrir ce qu'il a déjà tranché (leçon L22). À reposer seulement si le chiffre monte encore |
