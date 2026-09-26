# LA PEUR DE L'EXPORT

*(2026-09-26, tâche #906. Sa demande, et elle était explicite : un fichier **brutal, chiffré, sans
ménagement**. Ce document ne cherche pas à rassurer. Chaque chiffre vient d'un outil qui a tourné
contre le dépôt réel — le rapport brut est `docs/safe-export/exportabilite-2026-09-26.txt`, produit
par `node scripts/safe-export.mjs export`. Aucun chiffre ici n'a été écrit de mémoire.)*

---

## Ce qu'on croit, et ce que la mesure dit

**Ce qu'on croit** : l'Agence est prête à partir. Quarante et un blueprints génériques, un septième
Gardien sacré dédié à l'exportabilité, la règle des deux documents par outil appliquée depuis des
semaines, et l'Article 27 qui impose la reprenabilité par une autre IA.

**Ce que la mesure dit** : **36 fichiers sur 88 ont un blueprint. 52 n'en ont pas.** Et parmi ceux
qui n'en ont pas, **19 sont vitaux ou essentiels** — c'est-à-dire que sans eux l'Agence ne tourne
pas, ou perd une garantie.

---

## LES CINQ CHIFFRES QUI FONT MAL

### 1. Ce qui fait tourner l'Agence est précisément ce qui n'a pas de plan

Les 19 bloquants — vitaux ou essentiels, sans blueprint :

`check-house.mjs` · `criticite.mjs` · `execution-profile.mjs` · `hooks/check-last-commit.mjs` ·
`hooks/install.mjs` · `hooks/post-commit` · `hooks/pre-commit` · `html-report.mjs` ·
`install-pnpm.sh` · `lib-json.mjs` · `lib-shell.mjs` · `priorites.mjs` · `report-template.mjs` ·
`run-framework.mjs` · `sites-env.mjs` · `tool-usage.mjs` · `circle-tasks.mjs` · `doc-report.mjs` ·
`le-coordinateur.mjs`

Lis cette liste : ce sont **les crochets git, les bibliothèques partagées, le gabarit des rapports,
le compteur d'usage et la suite de tests**. Autrement dit, tout ce qui fait qu'un outil de cette
Agence RESSEMBLE à un outil de cette Agence.

**La conséquence brutale** : on a documenté les VEDETTES et pas la PLOMBERIE. Un acheteur qui reçoit
41 blueprints reçoit 41 descriptions d'outils qui, une fois transplantés, ne s'accrochent à rien.
Le format commun des rapports, la façon dont un outil déclare sa fiabilité, le crochet qui les
lance : rien de tout ça n'a de plan. **C'est exactement l'inverse de ce qu'il faudrait.**

### 2. Couverture par niveau de vitalité — la pire est en haut

| Niveau | Fichiers | Avec blueprint | Couverture |
|---|---|---|---|
| 🔴 **vital** | 25 | 9 | **36 %** |
| 🟠 **essentiel** | 9 | 6 | 67 % |
| 🟡 utile | 34 | 15 | 44 % |
| ⚪ optionnel | 20 | 6 | 30 % |

**Le niveau le plus critique est le deuxième moins bien couvert.** Ce n'est pas un hasard : on
documente ce qu'on est fier d'avoir construit, pas ce qu'on a écrit pour que le reste marche.

### 3. Le dépôt a été multiplié par 8,8 en sept jours

| Quand | Taille suivie par git |
|---|---|
| 2026-09-19 | 2,2 Mo |
| 2026-09-26 | **19 Mo** |

Soit **2,4 Mo par jour**. Projeté en ligne droite (une tendance, jamais une loi — un chantier qui
s'arrête la dément) :

- dans 1 mois : **91 Mo**
- dans 2 mois : **164 Mo**
- dans 1 an : **898 Mo**

**Ce que ça veut dire pour l'export** : à ce rythme, dans un an, « exporter l'Agence » veut dire
déplacer près d'un gigaoctet de texte. Pas de code — de TEXTE : des rapports archivés, des
transcriptions, des registres. Le code de l'outillage, lui, pèse 58 773 lignes.

### 4. L'outillage pèse 4,6 fois le jeu

- **Outillage** : 58 773 lignes (88 fichiers)
- **Le jeu lui-même** (`lib/`, `app/`, `components/`) : 12 727 lignes

La charte demandait de surveiller ce ratio. Le voici, mesuré : **l'Agence est le gros du projet, et
le site est devenu la petite moitié.** Ce n'est pas un reproche — les deux projets sont assumés
depuis le 2026-09-22 — mais c'est un fait dont il faut tirer les conséquences : **l'export n'est pas
un chantier annexe, c'est le chantier du plus gros actif du dépôt.**

### 5. Deux packs d'outils n'ont JAMAIS été réalisés

Le Pack Sentinelle (3 outils) et le Pack Panorama (8 outils) — la vue transverse censée précéder une
décision de priorisation — n'ont jamais eu lieu une seule fois. **Un outillage qu'on exporte sans
l'avoir utilisé en entier exporte aussi ses angles morts.**

---

## LES TROIS PEURS, NOMMÉES

### Peur n°1 — « On exporte des pièces, pas une machine »

`docs/agence-exportable-conception.md` existe (9 400 caractères). C'est le seul document qui parle
de l'Agence COMME UN TOUT, et il fait la taille de trois pages. En face : 41 blueprints de pièces
détachées.

**Ce qui manque n'est pas un 42e blueprint.** C'est le document qui dit : voici l'ordre
d'installation, voici ce qui dépend de quoi, voici les 25 fichiers de la chaîne quotidienne sans
lesquels rien ne démarre, voici les 4 points d'entrée réels.

### Peur n°2 — « La chaîne est plus petite qu'on ne croit, et ça se voit mal »

Mesure : **25 fichiers** forment la chaîne d'exécution quotidienne. Mais si on compte les imports de
la suite de tests, on en trouve **81**. L'écart vient d'un seul fichier : `check-house.mjs` importe
78 % du parc — pour le tester.

**Pourquoi c'est une peur et pas une bonne nouvelle** : ça veut dire qu'on peut croire, en regardant
les dépendances, que tout est indispensable. Un export « minimal » fait naïvement emporterait 81
fichiers. Un export réfléchi en emporte 25 et laisse le reste derrière. **Personne ne savait ce
chiffre avant ce soir.**

### Peur n°3 — « Le plus dur n'est pas le code, c'est ce qui n'est écrit nulle part »

L'Agence repose sur des règles qui vivent dans CLAUDE.md, `docs/regles-de-travail.md`, et dans la
conduite d'un agent. Les Articles 29, 30, 31 et 32 le déclarent noir sur blanc : **aucun mécanisme
ne peut vérifier qu'un compte rendu a rappelé son contexte, qu'un chantier a repris les notes, ou
qu'un outil a été consulté avant d'agir.** Ces règles se déclarent, elles ne se portent pas.

Un export livre les outils. Il ne livre pas la discipline qui les fait tourner.

---

## LES BÉNÉFICES, ET LES DEUX QU'ON NE PEUT PAS CHIFFRER

*(Ajouté le 2026-09-26, tâche #909. Produit par `node scripts/kpi-report.mjs benefices`.)*

Un tableau de bénéfices qui chiffre TOUT est un argumentaire, pas une mesure — et un chiffre inventé
se recopie ensuite dans tous les documents qui citent celui-ci. Quatre postes, dont **deux qui
refusent de répondre**.

| Poste | Résultat |
|---|---|
| ✅ **Défauts trouvés par un outil** | **52 tâches** sur 272 d'origine déclarée, soit **19 %**. Comptés sur le SUIVI, pas sur les registres des outils : un signalement que personne n'a repris n'est pas un bénéfice. 569 lignes sur 841 ne déclarent pas leur origine — la part est calculée sur les 272 qui la déclarent. |
| ✅ **Allègement de la charte** | **187 lignes** retirées, sur la seule opération chiffrée des 14 enregistrées. Compté en LIGNES, jamais en tokens : la conversion serait une estimation posée sur une estimation. |
| 🚫 **Appels API évités** | **NON MESURABLE.** Il faudrait savoir combien d'appels auraient eu lieu SANS l'outillage. Le journal ne garde que les appels FAITS, et compter les refus « seuil dur » donnerait le nombre de fois où l'outil a dit non — jamais le nombre d'appels que ce non a évités. Un refus suivi d'un abandon et un refus suivi d'un contournement s'écrivent pareil. |
| 🚫 **Temps gagné** | **NON MESURABLE**, et c'est sa consigne explicite. Sans groupe témoin — le même projet mené sans l'Agence — c'est un contrefactuel, c'est-à-dire une opinion chiffrée. |

## LE RELAI VERS UNE AUTRE IA — ce qui passe, et ce qui accroche

*(Sa demande : que SAFE-EXPORT couvre le relai — mémoire, ligne de conduite, process — **sans me
servir de moi-même comme étalon**. Produit par `node scripts/safe-export.mjs export`.)*

**Le piège évident que sa consigne interdit** : vérifier « est-ce qu'une autre IA comprendrait ? »
en me demandant si JE comprends. Je comprends toujours — j'ai la conversation, le contexte, les
habitudes. Ma compréhension prouve que j'étais là, pas qu'un modèle arrivant à froid s'en sortira.
Le seul étalon utilisable est mécanique.

| Dimension | État | Ce qui accroche |
|---|---|---|
| **Mémoire** (ce qu'on a appris en se trompant) | ✅ 2/2 documents | **2 dépendances à un outillage particulier** |
| **Conduite** (comment on travaille) | ✅ 3/3 documents | **2 dépendances à un outillage particulier** |
| **Process** (les suites d'étapes qui engagent) | ✅ 3/3 documents | — |

**Les quatre dépendances sont le vrai défaut de relai**, et il est invisible à l'œil : un document
parfaitement écrit qui dit « crée une tâche avec tel outil » est inapplicable pour une IA qui n'a pas
cet outil.

**La sonde elle-même a produit un faux vert à son premier passage**, et c'est gardé comme
contre-test : `findDependancesOutillage()` ne scannait que les documents SE DÉCLARANT génériques,
donc sautait CLAUDE.md et les règles de travail — exactement ceux à examiner. Le résultat était
« aucune dépendance » sur trois documents jamais ouverts.

## PLAN D'ACTION

*(Article 28 : un rapport n'est pas fini quand il est écrit, il l'est quand ses constats sont
devenus des tâches. Trois états seulement — RETENU, ÉCARTÉ avec sa raison, À TRANCHER.)*

| État | Constat | Ce que ça devient |
|---|---|---|
| **RETENU** | 19 fichiers vitaux/essentiels sans blueprint, dont les crochets et les bibliothèques partagées | tâche #907 — écrire en priorité le blueprint de la PLOMBERIE (gabarit de rapport, crochets, bibliothèques partagées), avant tout nouveau blueprint d'outil vedette |
| **RETENU** | Aucun document ne décrit l'ordre d'installation ni la chaîne des 25 | tâche #908 — un « plan de la machine » dérivé mécaniquement de la chaîne quotidienne, jamais écrit à la main (il se périmerait) |
| **À TRANCHER** | 898 Mo projetés à un an, essentiellement des archives de rapports | politique d'archivage : purger, compacter, ou externaliser hors du dépôt ? C'est sa décision, pas celle de l'agent — elle touche à ce qu'on garde comme preuve |
| **À TRANCHER** | Pack Sentinelle et Pack Panorama jamais réalisés | les lancer une fois pour de vrai, ou les retirer du catalogue ? Un pack qui n'a jamais tourné n'est pas un pack, c'est une intention |
| **RETENU** | 4 dépendances à un outillage particulier dans les documents de relai (mémoire et conduite) | tâche #910 — les reformuler pour qu'une IA sans cet outillage puisse les appliquer, ou déclarer explicitement la substitution à côté |
| **ÉCARTÉ** | Le ratio outillage/jeu (4,6×) | ce n'est pas un défaut à corriger : les deux projets sont assumés depuis le 2026-09-22, et la charte demande de SURVEILLER ce chiffre, jamais de le faire baisser. Il est surveillé, il est écrit, il ne devient pas une tâche |

---

**CE QUE CE DOCUMENT NE DIT PAS** : il ne dit pas que l'export est impossible, ni qu'il est en
retard. Il dit ce qui manquerait si on l'ouvrait demain matin. Chaque chiffre est reproductible :
`node scripts/safe-export.mjs export`.
