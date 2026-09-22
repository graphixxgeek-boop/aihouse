# ecotoken — instanciation pour ce projet

*(Tâche #359, 2026-09-22. Nom choisi par l'utilisateur, puis corrigé le même soir de
« claude.md-ecotoken » à « ecotoken » pour éviter la confusion avec CLAUDE.md lui-même.
Fichier technique : `scripts/ecotoken.mjs`. Principe générique :
`docs/ecotoken-blueprint.md`. Registre des passages : `docs/ecotoken/index.md`.)*

## Ce que la première mesure a trouvé

**CLAUDE.md : 29 606 tokens, 1 471 lignes**, rechargé à chaque message.

**Aucun article n'est orphelin** — les 25 sont réellement cités ailleurs dans le dépôt. Le gras
n'est donc pas dans leur existence. Les articles ne pèsent que **568 lignes sur 1 471** : les
**903 lignes restantes (61 %)** sont hors charte.

Rendement extrême des deux bouts : l'Article 3 vaut **40,7** (3 lignes, 122 citations) et
l'Article 0 **34,3** (4 lignes, 137 citations) — ultra-rentables. L'Article 19 tombe à **0,7**,
non parce qu'il serait inutile, mais parce qu'il absorbe toute la section Smart Breaker qui le suit
sans être un article.

**Plan mesuré : ~12 600 tokens récupérables, soit 41 % de la charte.**

| Stratégie | Cible | Gain |
|---|---|---|
| catalogue | 21 sections « … — blueprint exportable » | ~5 519 tk |
| extraction | « Référentiel technique » | ~4 190 tk |
| extraction | « Plan d'origine (analyse Opus) » | ~2 293 tk |
| déjà mécanisé | 3 passages décrivant une procédure qu'un crochet applique déjà | ~533 tk |
| asides | 3 apartés narratifs datés | ~89 tk |

## Les 16 outils réellement automatisés par les crochets

Lus dans les crochets eux-mêmes, jamais recopiés (Article 24) : `check-house`, `check-argus`,
`check-harmonia`, `axa-check`, `clean-dirty-old`, `clone-hunter`, `always-new-code`, `el-professor`,
`le-coordinateur`, `tool-brain`, `smart-conso-token`, `circle-tasks`, `check-tasks-details`,
`check-suivi-fidelity`, `lib-shell`, `ecotoken`.

Le pre-commit **bloque** sur `check-house.mjs` et `tsc`. Le post-commit **avertit** sur tout le
reste. Une consigne de la charte demandant de lancer l'un d'eux à la main est donc, pour sa partie
procédurale, un coup d'épée dans l'eau.

## Deux précisions honnêtes sur ce sujet

**CLAUDE.md ne contient aucun script exécutable.** Un seul bloc de code sur tout le fichier (le
schéma de hiérarchie tool-brain) et quatre commandes simplement citées en exemple. Rien ne
s'exécute à l'ouverture — c'est du texte pur chargé dans le contexte. Le gaspillage réel n'est pas
une exécution inutile, c'est une **relecture** inutile.

**« Déjà mécanisé » ne veut jamais dire « inutile ».** La règle reste vraie, et savoir que la
vérification a lieu change la façon de travailler. Ce qui devient superflu, c'est la procédure
détaillée — « comment lancer, quand, dans quel ordre » — quand aucune main humaine ne déclenche
plus rien.

## Branchements réels

- **SMART-CONSO-TOKEN** — ecotoken importe `estimateTokens`, `measureClaudeMdWeight`,
  `buildClaudeMdRuleTable`, `listDatedNarrativeMarkers`. En retour, `scanDocumentWeight()` pointe
  vers la commande d'ecotoken **par son texte**, jamais par un import (cycle).
- **CIRCLE-TASKS** — l'item existant `claude-md-weight-signal` lance ecotoken. **Harmonisation
  explicite : un seul item de Ronde sur le sujet CLAUDE.md, jamais deux.** Le registre
  `docs/ecotoken/` est déclaré dans `CIRCLE_EXCLUDED_REGISTRIES` avec cette raison.
- **LE-COORDINATEUR** — 14e ligne de la synthèse réseau : le budget de la charte, lecture seule.
- **Crochet post-commit** — `node scripts/ecotoken.mjs budget`, non bloquant.
- **circle-process-guardian** — la modification de l'item est consignée dans
  `CIRCLE_ITEMS_CHANGELOG`, avec son garde-fou `findItemsMissingFromChangelog()`.

## Trois bugs trouvés par ses propres tests

1. Une proposition à **gain négatif** : sur une petite famille, l'en-tête du catalogue coûtait plus
   cher que les sections remplacées. Filtre posé une seule fois à la sortie (Article 3).
2. Un **double comptage** : AXA-CHECK et find-booster étaient proposés à la fois en catalogue et en
   extraction, gonflant le gain d'environ 2 200 tokens inencaissables.
3. Un **faux positif de découpage** : une liste à puces sans ligne vide comptait pour un seul
   paragraphe, faisant remonter les 193 lignes du Référentiel technique d'un bloc (~3 900 tokens)
   parce qu'une seule de ses entrées contenait le mot « consulter ».

## Le réveil conditionnel des Gardiens sacrés (tâche #362) — un sujet voisin, pas le même

Ouvert par une question de l'utilisateur dans la même session. Le mécanisme vit dans
`scripts/lib-shell.mjs` (`GARDIEN_DOMAINS`, `NOT_REALLY_CODE`, `gardienShouldRun()`), pas dans
ecotoken — ce sont deux dépenses différentes : ecotoken traite le coût en TOKENS d'un document
toujours chargé, le réveil conditionnel traite le coût en TEMPS de vérifications qui tournent à
vide.

**La distinction qui gouverne tout, actée explicitement :**

| | Ce qui tourne | Effet | Conditionné ? |
|---|---|---|---|
| **GARANTIT** | `check-house.mjs` + `tsc` (pre-commit) | **Bloque** le commit | **Jamais** — conditionner créerait un trou |
| **RENFORCE** | Les 6 Gardiens sacrés (post-commit) | Signale, n'a jamais rien bloqué | Oui |

**La cause racine, mesurée :** sur 20 commits, 18 ne touchaient `lib/` que par `lib/reference.ts` —
le référentiel AFFICHÉ en jeu, de la donnée narrative incrémentée à chaque commit. Il faisait passer
tout commit pour un changement de moteur. `NOT_REALLY_CODE` l'exclut, et c'est ce seul exclusion qui
débloque tout le reste.

**Deux chemins de prudence, non négociables :** un Gardien sacré absent de la table tourne toujours, et si
git ne dit pas ce qui a changé, tout tourne. Ne pas savoir n'autorise jamais à se taire.

## Criticité — ce que l'outil fait de la sensibilité d'un fichier (2026-09-22)

Demande explicite : « CLAUDE.md est un fichier sensible, central : l'outil sait mesurer la
criticité d'un fichier ou d'une partie de code et adapter son diagnostic ou ses actions ».

Quatre signaux réels, chacun vérifiable, jamais un score d'opinion : rechargé à chaque message
(+3), cité par ≥10 fichiers (+2) ou ≥3 (+1), densité de formulations normatives ≥200 (+3) ou ≥50
(+1), lu par un test ou un crochet (+1). Quatre niveaux : `critique` (≥6), `sensible` (≥4),
`ordinaire` (≥2), `peripherique` (0).

Mesures réelles de ce projet : **CLAUDE.md = critique (8)**, `docs/regles-de-travail.md` =
sensible (5), une fiche de référentiel = périphérique (1).

La criticité FILTRE, elle ne décore pas : sur un document critique ou sensible, une proposition à
risque « moyen » sort des propositions applicables et part dans `retenuesParCriticite` — visible,
jamais masquée (cacher un gain possible serait mentir), mais plus une chose qu'on applique sans y
réfléchir. Sur CLAUDE.md, cela retire aujourd'hui deux propositions sur quatre.

## Sûreté : pourquoi l'outil ne peut pas abîmer ce qu'il analyse

La garantie est **structurelle, pas déclarative** : ecotoken n'a aucun chemin d'écriture vers un
document analysé. Ses deux seules écritures vont dans `docs/ecotoken/`, et toutes deux passent par
`assertSafeWriteTarget()`, qui refuse toute cible hors de ce dossier. Un test de `check-house.mjs`
vérifie les deux moitiés : que la fonction refuse bien `CLAUDE.md`, ET qu'aucun `writeFileSync` du
fichier ne la contourne. Même en cas de bug, le pire que puisse faire ecotoken est d'écrire un
mauvais rapport chez lui.

**La limite honnête, jamais masquée** : `verifyNothingBroken()` et `findLostReferences()` vérifient
qu'une référence RÉSOUT encore et qu'un chemin cité l'est toujours — jamais que le SENS a été
préservé. Cette lecture-là reste humaine, et c'est pour ça que la validation humaine est obligatoire
au niveau critique.

## Le contrôle de perte, né d'une perte réelle (2026-09-22)

Le tout premier catalogue produit sur CLAUDE.md a fait disparaître **six outils entiers**
(LE-COORDINATEUR, CIRCLE-TASKS, doc-HTML, tool-usage, Doc-Report, find-deep-booster) et
l'obligation d'usage de tool-brain — des paragraphes de RÈGLE logés à la fin de sections qui,
elles, n'étaient que des renvois. La perte n'a été vue qu'en comparant à la main les chemins cités
avant/après. D'où `findLostReferences(avant, apres, { attendues })` : il liste ce qui a cessé
d'être mentionné, distingue les pertes GRAVES (chemins réels, titres de section) du bruit, et
accepte des pertes déclarées — sans quoi il crierait au loup à chaque allègement réussi et finirait
ignoré.

## Portées — le vocabulaire est importé, jamais réinventé

`SCOPE_LEVELS` est **la même liaison** que celle de `smart-conso-token.mjs`, elle-même reprise de
THE-FINAL-JUDGE : `global` (tout le paysage surveillé) / `partiel` (un dossier réel du dépôt) /
`zoome` (un fichier) / `focus` (une section d'un fichier). Un cinquième vocabulaire aurait été la
divergence silencieuse que l'Article 24 interdit ; un test compare les deux liaisons par identité.

À ne jamais confondre malgré les mots partagés : les 4 NIVEAUX de CHECK-LEVEL-TARGET disent « à
quel point vérifier », ces 4 PORTÉES disent « sur quelle surface ».

`recommendScope(changedFiles)` choisit : aucun document budgété touché → aucun scan (sa propre
médecine de réveil conditionnel) ; un seul → `zoome` sur celui-là ; plusieurs ou inconnu → `global`.

## Déclenchement : attendu vs réel

`TRIGGERS` déclare le contrat, `auditTriggers()` va LIRE les fichiers et dit lequel est vraiment
câblé — un commentaire promettant « branché dans le crochet » n'est jamais une preuve (Article 24).
Quatre déclencheurs : `post-commit` (seulement si un document budgété a bougé),
`ronde-circle` (item `ecotoken-scan`, périodique), `network-check` (LE-COORDINATEUR),
`sur-demande`. Preuve que le garde-fou sert : à son premier lancement il a trouvé le quatrième
non câblé (ecotoken absent de la table maîtresse) — corrigé le soir même.

## Registre

`docs/ecotoken/` — les scans horodatés et `index.md` (la colonne « Décision » est la seule remplie
à la main). `docs/ecotoken/ronde/` — les rapports produits pendant une Ronde, consolidés ici le
2026-09-22 depuis `docs/claude-md-weight/` : un seul sujet, un seul registre.

## Six niveaux de criticité, et ce que chacun change (recalibré le 2026-09-22)

Deux niveaux **catégoriels** (atteints par un seul fait, jamais par cumul de points) :

| Niveau | Reconnu à | Ce qu'il impose en plus |
|---|---|---|
| `maitre` | c'est LE document qui gouverne le travail | validation humaine + contrôle de perte + `verifyProtectiveSubstance()` avant/après |
| `tuyauterie` | crochet git, filet de sécurité lancé par le pre-commit bloquant, ou socle importé par ≥5 scripts | validation humaine + contrôle de perte + le filet de sécurité complet doit repasser au vert |

Puis trois niveaux **par cumul de signaux**, et un plancher :

| Niveau | Score | Ce qu'il impose |
|---|---|---|
| `critique` | ≥6 | validation humaine + contrôle de perte ; risque « faible » seulement |
| `sensible` | ≥4 | contrôle de perte ; risque « faible » seulement |
| `ordinaire` | ≥2 | propositions applicables normalement |
| `peripherique` | 0 | aucun garde-fou particulier |

Signaux mesurés : rechargé à chaque message (+3), cité par ≥10 fichiers (+2) ou ≥3 (+1), ≥200
formulations normatives (+3) ou ≥50 (+1), lu par un test ou un crochet (+1), **nœud sensible du
moteur** (+3, lu dans la déclaration existante), fichier maître (+3), tuyauterie (+3).

Mesures réelles : `CLAUDE.md` = maitre (12) · `scripts/check-house.mjs` = tuyauterie (9) ·
`scripts/hooks/pre-commit` = tuyauterie · `lib/simulation.ts` = critique (6) ·
`docs/regles-de-travail.md` = critique (6) · `lib/story.ts` = sensible (5) ·
une fiche de référentiel = ordinaire (2).

**La tuyauterie était le vrai trou de la première version** : un crochet git ne contient presque
aucun « jamais/toujours », il aurait été classé périphérique par la seule densité de règles — alors
que le casser casse tout. Corrigé en le reconnaissant à ce qu'il EST (exécuté à chaque commit,
lancé par le crochet bloquant, importé partout), jamais à une liste de chemins tenue à la main.

## Reconnaître le fichier maître — et le reconnaître ailleurs (2026-09-22)

`detectMasterFile()` ne cherche JAMAIS le nom « CLAUDE.md » : un blueprint exporté ne trouverait
rien ailleurs, et un fichier anodin portant ce nom serait pris pour la charte. Deux chemins :
la déclaration `chargement: "toujours"` d'un profil (confiance `certaine`), sinon une déduction
sur preuves réelles — densité de règles ET nombre de citations (confiance `deduite`), les noms de
charte connus n'étant qu'un indice d'appoint. Sans candidat crédible : `null`, une absence honnête
plutôt qu'un défaut promu faute de mieux. Vérifié par test dans les trois cas.

## Harmonie avec les autres échelles du projet (2026-09-22)

Ce dépôt a **quatre échelles**, et elles ne mesurent pas la même chose — les fondre serait une
fausse harmonie qui détruirait de l'information :

| Échelle | Mesure | Objet |
|---|---|---|
| CHECK-LEVEL-TARGET (`leger`→`exceptionnel`) | combien VÉRIFIER | un effort |
| `SENSITIVE_NODES` (binaire) | quels nœuds du moteur sont délicats | un endroit du code |
| CHARTER-SPY (`très sensible`/`sensible`/`normale`) | la gravité d'une RÈGLE | une règle |
| ecotoken (6 niveaux) | la criticité d'un FICHIER | un fichier |

L'harmonie prend donc la forme de **trois ponts réels**, pas d'un vocabulaire unique :

1. **Criticité → niveau de vérification** (`recommendCheckLevelFor()`) : `maitre` → `exceptionnel`,
   `tuyauterie`/`critique` → `approfondi`, etc. Le vocabulaire d'arrivée est celui de
   CHECK-LEVEL-TARGET, jamais un cinquième inventé — un test compare à son `LEVEL_ORDER` réel.
   Sens unique : un effort se déduit d'un enjeu, jamais l'inverse.
2. **Nœud sensible → signal de criticité** : ecotoken LIT `SENSITIVE_NODES` au lieu de porter un
   second jugement sur la même chose.
3. **Règle non négociable → socle protégé** (`derivedSocles()`) : les 6 Articles que CHARTER-SPY
   classe déjà « très sensible »/« sensible » deviennent automatiquement des socles dont l'intitulé
   doit survivre. La liste écrite à la main ne garde que les phrases de prose, hors Article.

Et un **garde-fou** (`findCriticalityDisagreements()`) : un fichier déclaré nœud sensible ailleurs
qu'ecotoken classerait « ordinaire »/« périphérique » est un désaccord entre deux mesures du même
dépôt — l'une des deux se trompe, et le silence laisserait gagner la plus laxiste. Il a trouvé
**4 désaccords réels à son premier lancement** (`lib/simulation.ts`, `story.ts`, `turn.ts`,
`daynight.ts`) : HARMONIA avait raison, ecotoken était aveugle aux nœuds du moteur. D'où le pont 2.

## Fiabilisation de la détection (2026-09-22, seconde passe)

Trois défauts trouvés **en auditant les détections au lieu de les supposer bonnes** :

1. **Une mention n'est pas un lancement.** Le crochet pre-commit parle de `post-commit` et de
   `kpi-report.mjs` dans ses COMMENTAIRES : les deux étaient annoncés « lancés par le crochet
   bloquant ». Corrigé — seules les lignes exécutables comptent, et le crochet lanceur est nommé
   (bloquant vs avertisseur). `kpi-report.mjs` n'est plus de la tuyauterie : il ne l'était pas.
2. **Tout ce qui vit dans `scripts/hooks/` n'est pas un crochet.** Git n'exécute que les fichiers
   sans extension. `install.mjs` y habite mais est lancé par le gestionnaire de paquets — il reste
   de la tuyauterie, avec désormais la bonne raison. Une raison fausse dans un outil de mesure est
   aussi grave qu'un niveau faux.
3. **Les candidats au titre de fichier maître étaient cherchés au mauvais endroit.**
   `loadRepoFiles()` ne descend que dans `lib/scripts/docs/app/components` : aucun fichier racine
   n'était candidat, et la déduction ne fonctionnait ici que parce que « CLAUDE.md » figure dans la
   liste de noms connus. Un projet dont la charte s'appellerait `RULES.md` n'aurait rien trouvé —
   exactement la panne que ce blueprint ne doit pas avoir ailleurs. Corrigé : la racine est lue
   directement (`.md`/`.mdc`/`.txt` et les conventions sans extension type `.cursorrules`).
   **Vérifié sur un faux projet** : charte `RULES.md` (nom inconnu) correctement détectée, `README.md`
   volumineux mais sans règles ni citations correctement écarté.

Deux durcissements ajoutés dans la foulée : une déclaration de profil n'est plus crue aveuglément
(un profil périmé pointant vers un fichier vidé de sa substance rend `declaree-mais-non-confirmee`
plutôt que de couronner ce fichier), et l'**ambiguïté est dite** — deux documents déclarés
« toujours rechargés », ou un second candidat à plus de 80 % du score du premier, sont signalés au
lieu d'être tranchés en silence. Le bonus accordé à un nom de charte connu est délibérément modeste :
il départage deux candidats à égalité, il ne couronne jamais un fichier que les faits ne soutiennent
pas — les seuils de règles et de citations s'appliquent avant lui.

## Premier allègement réel du fichier maître (2026-09-22)

**24 536 → 22 339 tokens.** Deux propositions applicables (la criticité `maitre` n'autorise que le
risque « faible ») :

- **APPLIQUÉE** — la section « Plan d'origine (analyse Opus) — état d'avancement » part dans
  `docs/referentiel/feuille-de-route.md`, texte intégral, rien de résumé (−2 295 tk). Le contrôle
  ne s'est pas contenté d'affirmer : les 10 phrases normatives retirées de la charte ont été
  **retrouvées mot pour mot** dans le document d'accueil, et le renvoi résout. 25 Articles intacts
  aux intitulés près, phrases socles présentes.
- **REFUSÉE après examen** — les 5 passages « déjà mécanisé » étaient **tous** des faux positifs :
  l'obligation d'usage de tool-brain (qui se déclare elle-même incoercible), le bloc des six outils
  sans blueprint (que le premier catalogue avait déjà détruit une fois), le paragraphe
  `check-spirit.mjs` (qui parle précisément de l'outil NON automatisé et ne cite `check-house.mjs`
  que pour s'en distinguer), l'Article 18 et SMART-CONSO-TOKEN. Décision consignée dans la colonne
  prévue pour ça : jamais reproposée.

C'est exactement à ça que sert la validation humaine obligatoire au niveau `maitre` : sur ce
fichier, elle a rejeté 5 propositions sur 7. Les trois causes racines ont été corrigées dans
l'outil plutôt que refusées une fois (cible d'extraction choisie par affinité, passage
auto-déclaré incoercible, outil automatisé qui doit être le sujet) — avec un test vérifiant que
ces garde-fous n'aveuglent pas l'outil sur un vrai cas.

Budgets après cette passe : `CLAUDE.md` 22 339/30 000 (marge 26 %) ·
`docs/regles-de-travail.md` 55 746/60 000 (marge 7 %, le plus tendu) ·
`docs/referentiel/principes.md` 24 413/28 000 (marge 13 %).

## Ce que la première passe réelle a appris à l'outil (2026-09-22)

L'outil découpait par titre `##`. Or CLAUDE.md n'a que **12 sections** : sa vraie structure est
faite de **blocs en gras** à l'intérieur de celles-ci. Conséquence mesurée : la section « Charte de
qualité » pesait 12 346 tk d'un bloc, et **l'Article 19 à lui seul 5 351 tk — 43 % de la charte** —
sans qu'aucune proposition ne puisse jamais viser cette masse, parce qu'elle n'était pas une
« section ». L'outil était aveugle à l'endroit précis où se trouvait le gros du poids.

Le raisonnement qu'il a fallu faire à la main, désormais encodé :

1. **`splitBoldBlocks()`** — descendre au niveau du bloc en gras, pas du titre `##`.
2. Se demander non pas « ce texte est-il long ? » mais **« ce texte est-il à sa place ? »**. Les
   deux trouvailles réelles sont venues de cette question, jamais de la taille.

**`findLodgedManuals()` — un manuel d'exploitation logé dans la charte.** Trois conditions
cumulatives, toutes vérifiables : le bloc est gros (≥400 tk), il décrit l'exploitation d'un outil
(≥2 commandes `scripts/*.mjs` citées), et cet outil a **déjà** un document dédié qui existe sur le
disque. C'est le motif le plus rentable trouvé sur le fichier maître et le seul sans arbitrage
douteux : le contenu a déjà un domicile. Chaque trouvaille porte sa **prudence** — garder dans la
charte ce qu'il faut avoir sous les yeux le jour d'une panne, jamais le renvoi seul.

**`findMisfiledBlocks()` — un bloc rangé sous le mauvais Article.** Zéro token à gagner, et le
champ `gain: 0` le dit explicitement : gonfler ses propres chiffres avec une correction de
structure serait malhonnête. Ça compte quand même, pour deux raisons vécues : un agent qui cherche
une règle sous son Article ne la trouve pas, et tout outil qui découpe par Article voit une masse
aberrante qu'il attribue à la mauvaise règle. Signal mécanique : le bloc cite un AUTRE Article plus
souvent que celui sous lequel il est rangé.

Ces deux signaux ne rejoignent **pas** `propositions` : un manuel logé demande un vrai arbitrage
humain (que garder sous les yeux ?) et un bloc mal rangé ne fait gagner aucun token. Les mélanger
aux propositions chiffrées laisserait croire à un gain automatique là où il y a une décision.

## Deuxième passe réelle sur le fichier maître (2026-09-22)

**22 338 → 20 056 tokens**, après validation explicite de l'utilisateur sur les deux points :

- le manuel Smart Breaker (2 820 tk, 13 % du fichier) rejoint
  `docs/referentiel/smart-breaker-historique.md` — texte intégral. **La procédure d'urgence en
  5 étapes reste dans la charte** : c'est ce qu'il faut avoir sous les yeux le jour où l'API bloque.
- les 8 blocs de règles vivantes (format des questions, double lecture, sondage, traçabilité) sont
  rangés sous l'Article 16 auquel ils appartiennent, au lieu d'être logés dans l'Article 19 par
  accident de mise en page. Zéro token gagné, structure enfin honnête.

Contrôle : 25 Articles intacts aux intitulés près, phrases socles présentes, **23/23 phrases
normatives retirées retrouvées mot pour mot** dans le document d'accueil.

**Audit de pertinence des règles** fait à cette occasion : 135 des 138 chemins cités par la charte
existent réellement (les 3 autres sont des motifs génériques `lib/*.ts`, pas des renvois). Aucune
règle morte, aucun renvoi cassé — le problème de la charte était un **rangement**, jamais une
péremption.
