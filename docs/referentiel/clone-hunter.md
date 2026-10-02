# CLONE-HUNTER — instanciation pour Maison IA vivante

*(2026-09-21. Construit en réponse directe à une question de l'utilisateur : « est-ce qu'on a deja
un outil qui traque les redondances, repetition, duplicatas, dans le code ? » — vérifié avant
construction que non (Article 19), en lisant les fonctions exportées d'ARGUS/HARMONIA/AXA-CHECK/
CLEAN-DIRTY-OLD une par une, aucune ne fait ce métier. Principe générique :
`docs/clone-hunter-blueprint.md`. Code : `scripts/clone-hunter.mjs`. Registre : `docs/clone-hunter/`.)*

## Rôle exact

Un Membre de l'équipe (Outillage de travail) qui scanne `lib/`, `scripts/`, `app/` et `components/`
(hors `components/ui/`, cf. plus bas) à la recherche de blocs de lignes dupliqués à plusieurs
endroits — v1 littérale (identiques après normalisation d'espaces) ET v2 (identiques après un
renommage bijectif cohérent d'identifiants, cf. plus bas), calibrées et construites toutes deux le
2026-09-21, jamais une ressemblance sémantique complète (réarrangement de logique) qui demanderait
un vrai parseur AST hors de portée de cet outil.

## Le cœur de l'algorithme, `scripts/clone-hunter.mjs`

- `normalizeLine()`/`isSubstantialLine()` : normalise les espaces, écarte les lignes triviales
  (accolades seules, imports courts) sous un seuil de longueur (20 caractères par défaut) — même
  discipline anti-bruit que route-booster/find-booster.
- `findDuplicateBlocks()` : indexe chaque ligne substantielle par son contenu normalisé, puis pour
  chaque paire d'occurrences de la même ligne, étend la comparaison ligne par ligne tant qu'elle
  matche — un diff de blocs, jamais un fenêtrage à taille fixe (qui aurait coupé un bloc plus long
  que la fenêtre ou l'aurait fragmenté en plusieurs alertes). Un jeu de positions déjà visitées
  évite de re-signaler une sous-partie d'un bloc déjà trouvé plus long. Un plafond
  (`maxOccurrencesPerLine`, 40 par défaut) écarte les lignes bien trop communes pour être
  significatives sans jamais crasher sur un fichier au vocabulaire très répétitif (les nombreux
  `assert.equal(...)` de check-house.mjs, par exemple).
- `clusterDuplicates()` : un union-find minimaliste regroupe les paires en clusters — un bloc
  dupliqué à 3 endroits ne produit qu'UN cluster de 3 occurrences, jamais 3 alertes redondantes (une
  par paire).
- `buildDuplicateReport()` : point d'entrée haut niveau, lit vraiment le disque (jamais dans les deux
  fonctions ci-dessus, qui restent des fonctions pures testables sans I/O).

## components/ui/ exclu — une exclusion vérifiée, jamais générique

Premier essai live contre le vrai dépôt (avant cette exclusion) : 27 clusters trouvés, dont plus de
20 dans `components/ui/*` — vérifié (`git log -1` sur `card.tsx` : « Import du code source Codex »,
motifs `"use client"`/Radix/`cn()` partout) qu'il s'agit du kit shadcn/ui vendu tel quel, dont la
philosophie même est la duplication assumée (chaque primitive copiée-collée, jamais factorisée en
bibliothèque partagée). Exclu du scan par défaut pour que le signal restant reste actionnable —
jamais pour cacher une vraie duplication dans le code réellement écrit à la main par l'équipe
(Article 3 : corriger la cause du bruit, pas juste baisser le volume affiché). Les 7 clusters
restants (dans `scripts/`) sont tous des trouvailles réelles, vérifiées une à une le 2026-09-21 — la
plus significative : `loadJson()` dupliqué verbatim entre `scripts/smart-conso-api.mjs` et
`scripts/smart-conso-token.mjs` (8 lignes).

## Promotion en Gardien sacré du code (2026-09-22) — statut actuel, remplace la Ronde périodique

CLONE-HUNTER a d'abord rejoint la Ronde périodique CIRCLE-TASKS (`clone-hunter-run`, lancement réel
à chaque passage — raison à l'époque : la détection de duplication n'a pas de mémoire persistante à
consulter pour estimer une fraîcheur honnête). Le même soir, l'utilisateur a demandé sa promotion au
rang de **5e Gardien sacré du code** (Article 20 de CLAUDE.md, critère double : délivre un vrai scan
de qualité ET peut tourner automatiquement, gratuitement, à chaque commit — confirmé, <1s sur tout
le dépôt). Cette promotion REMPLACE l'intégration CIRCLE-TASKS plutôt que de s'y ajouter :
- `clone-hunter-run` a été retiré de `CIRCLE_ITEMS` (le lancement périodique devient un doublon dès
  qu'un vrai lancement automatique existe à chaque commit).
- `docs/clone-hunter/` a rejoint `CIRCLE_EXCLUDED_REGISTRIES` avec la justification standard des
  Gardiens sacrés.
- CLONE-HUNTER est désormais appelé directement (fonction pure, jamais son `main()` CLI) dans le
  crochet `post-commit` réel (`scripts/hooks/check-last-commit.mjs`), aux côtés d'ARGUS/HARMONIA/
  AXA-CHECK/CLEAN-DIRTY-OLD.
- Son résultat alimente `checkAgentOnboarding()` (paramètre `cloneHunterFindingsCount`, badge et
  échelle de couverture « OK 100% » désormais à 5 signaux sur 5, jamais 4).
- Il est agrégé dans la version légère de HYPER-SCAN-CHECKPOINT (gap réel trouvé et corrigé le même
  soir que la promotion).

Détail complet du répertoire des 7 fonctionnements partagés que tout Gardien sacré doit honorer :
`docs/referentiel/organisation-agence.md` §3.

## Un signal factuel, jamais une correction automatique

`main()`/`formatClusterSummary()` impriment les clusters triés par impact (longueur × occurrences),
jamais une factorisation appliquée automatiquement — la décision de factoriser (ou non) reste à
l'agent qui pilote, au cas par cas : une ressemblance de surface peut cacher une intention
différente qui justifie deux implémentations distinctes.

## v2 (quasi-duplication par renommage) — construite le 2026-09-21, tâche #177

Calibrée puis construite le même soir (demande explicite : « améliore CLONE-HUNTER, au-delà de la
v1 littérale »). Toujours zéro nouvelle dépendance, zéro parseur AST : compare la FORME token par
token (`tokenizeLine()`) plutôt que le texte littéral, et exige qu'un SEUL renommage bijectif
cohérent (`matchLineTokens()`) explique tout le bloc — jamais juste "même forme de ligne", qui
serait bien trop bruyant seul (des lignes aussi banales que `return x;` partagent leur forme
partout). C'est cette cohérence de renommage maintenue sur toute la longueur du bloc
(`extendNearDuplicateBlock()`) qui distingue un vrai copié-collé renommé d'une simple coïncidence de
structure. Un mot-clé du langage ou une propriété réelle après un "." (`.length`, `.push`) ne sont
jamais traités comme des identifiants renommables (`RESERVED_WORDS`, `isRenamableIdentifier()`).

**Jamais un doublon avec v1** : `findNearDuplicateBlocks()` ignore volontairement tout bloc où le
"renommage" trouvé est en réalité l'identité (a→a partout, via `hasRealRenaming()`) — ce cas-là est
un doublon LITTÉRAL, déjà signalé par v1, jamais compté deux fois (Article 3). v1 reste inchangée et
continue de tourner en plus (les deux se complètent).

**Cœur partagé, extrait en dogfooding immédiat** : lancer v2 sur `clone-hunter.mjs` lui-même a
révélé, dès le premier essai, que v1 et v2 dupliquaient leur propre boucle de parcours de paires
candidates — corrigé aussitôt en extrayant `findBlocksFromIndex()` (index → paires → extension
déléguée à une stratégie `extend` → filtre optionnel `accept`), réutilisé par les deux versions.
Preuve vivante trouvée le même soir : `collectCoverage()` dupliquée deux fois dans
`scripts/axa-check.mjs` (identifiants différents, 7 lignes) et une boucle `totalFindings` quasi
identique entre `scripts/hyper-scan-checkpoint.mjs` et `scripts/the-deep-reader.mjs` (9 lignes) —
deux trouvailles réelles que v1 ne pouvait structurellement pas voir.

**Limite honnête assumée** : `hasRealRenaming()` est évalué sur le mapping complet AVANT troncature
de recouvrement même fichier — dans le cas rare d'un bloc tronqué authentiquement littéral dont le
renommage n'apparaîtrait que dans la portion coupée, l'étiquette "renommé" pourrait être trop
optimiste. Jamais une fausse PAIRE, seulement une étiquette optimiste sur un cas marginal — non
corrigé pour rester simple (Article 5).

## Doc-Report

Entrée `REGISTRIES` dédiée (`scripts/doc-report.mjs`), famille "Qualité du code", décision "texte".

## Statut d'intégration

v1 testée en fixtures synthétiques (bloc partagé entre 2 fichiers, bloc trop court écarté,
duplication au sein d'un même fichier, cluster à 3 occurrences regroupé en une seule alerte) ET
vérifiée live contre le vrai dépôt (exclusion de `components/ui/` confirmée, trouvaille réelle de
`loadJson()` retrouvée). v2 testée en fixtures synthétiques (renommage cohérent détecté, mapping
incohérent rejeté, doublon littéral jamais recompté, propriété réelle après un "." jamais renommée)
ET vérifiée live (6 trouvailles réelles inédites, même exclusion `components/ui/` héritée). Entrée
PRESTATIONS "Pack Chasse aux clones". Statut : 5e Gardien sacré du code depuis le 2026-09-22 (cf.
section dédiée ci-dessus), plus d'item CIRCLE-TASKS. Registre : `docs/clone-hunter/` (dossier +
index), deux constats consignés.


## Une alerte par PROBLÈME, et un motif dérivé (2026-09-23, tâche #217)

**Le défaut, mesuré par l'enquête #215** : 29 alertes pour 14 problèmes réels. `clusterDuplicates()`
regroupe par ANCRE (`fichier:ligne`), donc la même duplication découverte à deux décalages produit
deux nœuds qui ne se rejoignent jamais. Les jumelles `flagFindBoosterCandidates` /
`flagFindDeepBoosterCandidates` donnaient ainsi **trois** alertes — une par ligne d'ancrage.

**Le cas qui traverse v1 et v2, et c'est le plus instructif.** v2 annonce « jamais déjà comptés par
v1 ». C'était vrai de son ANCRE (elle exige un vrai renommage, que v1 ne verrait pas) et faux de sa
RÉGION : son bloc démarre une ligne plus haut et englobe celui de v1. **La promesse portait sur le
mauvais objet.** Fusionner sur le chevauchement des régions la rend enfin exacte.

**`fusionnerClusters()` / `clustersSeRecouvrent()`** — deux clusters décrivent le même problème
s'ils couvrent les MÊMES fichiers et que, dans **chacun**, leurs plages de lignes se chevauchent.
Exiger le chevauchement dans TOUS les fichiers communs est volontairement strict : deux duplications
distinctes entre la même paire de fichiers restent deux problèmes.

**Rien n'est masqué.** Les deux listes brutes (littéral, renommage) restent affichées — elles
portent une vraie information. Le problème fusionné garde la plus grande emprise, la trace du ou des
détecteurs qui l'ont vu, et le nombre d'alertes brutes derrière lui, pour que le regroupement
s'audite au lieu de se croire. **Un Gardien sacré qui perdrait une trouvaille en route serait pire
que celui qui en comptait deux fois.**

**`motifDuCluster()` — le motif se DÉRIVE des faits** (Article 24). L'ancienne phrase unique
(« factoriser si le bloc dépasse le seuil où la factorisation rapporte plus qu'elle ne coûte »)
était vraie et n'aidait personne : elle renvoyait au lecteur la décision que l'outil avait déjà de
quoi éclairer. Trois portées, jamais confondues :

- **un seul fichier** — des blocs jumeaux : gêne de lecture, ou, si le bloc est gros, risque qu'une
  correction appliquée à l'un et pas à l'autre passe inaperçue ;
- **réparti dans l'outillage** — la forme de dette qui se recopie une fois de plus à **chaque outil
  qui rejoint l'équipe** ; c'est celle du chargeur JSON (tâche #216), qu'un commentaire promettant
  « jamais une 4e copie » n'a jamais suffi à arrêter ;
- **traverse le moteur du jeu** — une correction de comportement appliquée à une copie sur N
  produirait deux règles différentes dans la même partie.

## Le pont de réexport n'est pas un clone (2026-09-26, tâche #931)

**Trouvé à la vérification finale d'une nuit autonome**, en relançant les sept Gardiens sacrés
contre le vrai dépôt plutôt qu'en se relisant de mémoire (Article 25).

**LE FAUX POSITIF, ET C'ÉTAIT LA PLUS GROSSE ALERTE DU PASSAGE** : « 32 lignes dupliquées × 2 » dans
`scripts/cassandra-rh.mjs`, lignes 958 et 1004. Les deux blocs sont l'`import { … }` venu de
`le-classificateur.mjs` et l'`export { … }` qui réexporte exactement les mêmes noms, pour que les
appelants d'avant la scission continuent de fonctionner. **Les deux listes SONT identiques, et elles
doivent l'être** : c'est ce que « réexporter » veut dire. La tâche proposée — « fondre les 2 blocs »
— était littéralement inexécutable.

**POURQUOI ÇA COMPTE PLUS QUE LE BRUIT AJOUTÉ** : un Gardien sacré tourne à CHAQUE commit. Une
alerte qu'on ne peut pas traiter et qui revient à chaque fois apprend à survoler tout le rapport, y
compris les quatre vraies duplications qui l'accompagnaient ce matin-là (leçon L4 : un garde-fou qui
accuse à tort cesse d'être lu).

**LA RÈGLE, ET ELLE NE PEUT PAS MASQUER UN VRAI CLONE** : `estUnPontDeReexport()` écarte un cluster
dont **TOUTES** les occurrences tiennent **entièrement** dans une liste de spécificateurs
(`import {` … `}` ou `export {` … `}`). Un tel bloc ne contient aucune logique — que des noms
séparés par des virgules, que rien ne permet de factoriser. Deux blocs de vrai code ne peuvent pas
satisfaire ce test, puisqu'il exige que **chaque** ligne de la région soit dans une liste.

**TROIS BORNES POSÉES AVANT DE CROIRE LE FILTRE**, chacune avec son contre-test dans
`check-house.mjs` :

1. **Un vrai clone n'est jamais filtré** — de la logique dupliquée échoue le test par construction.
2. **Moitié liste, moitié code ⇒ gardé** — le filtre est strict sur « toutes les occurrences »,
   jamais « la plupart », parce qu'un cluster mixte pourrait cacher autre chose.
3. **Une accolade jamais refermée n'ouvre rien** — et cette borne vient d'un VRAI échec de test le
   jour même : la première version marquait les lignes au fil de l'eau, si bien qu'un fichier
   tronqué ou un `import` en cours d'édition avalait tout ce qui suivait et faisait disparaître du
   plan des duplications réelles. Une liste n'est confirmée qu'une fois **refermée** (Article 5).

**RIEN NE DISPARAÎT, ET LE NOMBRE EST IMPRIMÉ.** Les ponts écartés restent affichés dans les deux
listes brutes ; seul le PLAN D'ACTION les laisse de côté, et le rapport annonce désormais **trois**
nombres au lieu de deux — alertes brutes, problèmes distincts, et ce qui reste au plan. Un filtre
silencieux serait un filtre que personne ne peut contester, et un Gardien sacré qui ferait
disparaître une trouvaille serait pire que celui qui en compte une de trop.

**Contre-test live, jamais une promesse en commentaire** : la suite de tests vérifie que le filtre
mord réellement sur CE dépôt (au moins un pont écarté — sinon c'est une intention, leçon L2), que le
corpus lu n'est pas vide (sinon l'abstention ressemblerait trait pour trait à un verdict propre,
leçon L11), et que rien n'est perdu entre les gardés et les écartés.

## Réunir les alertes dont un bloc est CONTENU dans un autre (2026-09-28, tâche #995)

**LE PROBLÈME EST RÉEL ET MESURÉ** : un parcours de dossier factorisé le 2026-09-27 était **un**
problème, et l'outil l'affichait en **trois** alertes.

`clusterDuplicates()` réunissait déjà les alertes décrivant le même bloc vu de **deux ancres**. Il ne
réunissait pas un bloc de dix lignes **inclus** dans un bloc de douze aux mêmes endroits — le même
problème vu à deux profondeurs. `fusionnerParContenance()` ferme ce cas, en second passage après la
fusion existante.

**LA MÉTHODE EST CONTRAINTE, ET C'EST VOULU** : elle n'utilise qu'un fait que l'outil possède
déjà — les **POSITIONS**. Une alerte est absorbée quand *chacune* de ses occurrences tombe
entièrement dans une occurrence d'une autre, **dans le même fichier**.

**Jamais une ressemblance devinée.** Un regroupement « par similarité » fondrait des problèmes
distincts : le compte baisserait sans que la dette baisse, et **un sous-comptage cache là où un
sur-comptage se corrige à la lecture**.

**UN CLUSTER N'EST ABSORBÉ QUE SI TOUTES SES OCCURRENCES LE SONT.** S'il en porte une ailleurs, il
décrit quelque chose de **plus**, et le fondre perdrait cette information. L'alerte survivante
déclare combien elle a absorbé (`absorbe`) : une fusion silencieuse est un chiffre qui baisse sans
qu'on sache pourquoi.

**CE QUE ÇA NE RÉGLERA PAS, DIT D'AVANCE** : deux blocs au texte **différent**, dans deux fichiers
différents, peuvent être le même problème — et seul un humain le voit. Le regroupement complet de
l'enquête du 2026-09-22 (29 alertes → 14 problèmes) n'est pas mécanisable, et prétendre le contraire
donnerait un chiffre faux avec l'air d'être juste.

---

## Le troisième détecteur — LA MÊME NOTION ÉCRITE PLUSIEURS FOIS, PRESQUE PAREIL

*(2026-09-29, tâche #1174. `node scripts/clone-hunter.mjs motifs`.)*

**LA PHRASE DE LA FICHE CI-DESSUS EST CELLE QUI A APPELÉ CE DÉTECTEUR** : « deux blocs au texte
différent, dans deux fichiers différents, peuvent être le même problème — et seul un humain le
voit ». Elle reste vraie en général. Mais il en existe une forme très précise que la machine SAIT
voir, et le dépôt vient d'en payer le prix fort.

**LE DÉGÂT QUI L'A FAIT NAÎTRE, mesuré le jour même (tâche #1171).** Quatre fonctions de
`scripts/check-suivi-fidelity.mjs` testaient la clôture d'une tâche à la main, chacune avec son
propre petit motif : `/^termin[ée]e/i` pour trois d'entre elles, `/^termin[ée]/i` pour la
quatrième. **Une lettre d'écart.** Résultat : **317 lignes du registre sur 1 103 — 29 %** étaient
lues « encore ouverte » par un lecteur et « terminée » par un autre. Aucun bloc n'était dupliqué,
donc ni v1 (lignes identiques) ni v2 (renommage) ne pouvaient le voir. Et ce n'était pas la première
fois : le même défaut avait été corrigé chez UN appelant le 2026-09-23, chez UN AUTRE le
2026-09-24, la leçon écrite en commentaire à chaque fois, et jamais mécanisée.

### Ce qu'il fait

Il relève chaque **littéral d'expression régulière** du corpus et regroupe en **FAMILLES** ceux qui
se ressemblent à une ou deux modifications de caractères près sans être identiques. C'est la
signature exacte du défaut : quelqu'un a réécrit de mémoire une notion qui existait déjà, et sa
version diverge d'un détail.

### Les quatre choix de conception, et chacun a sa raison

- **Des FAMILLES, jamais des paires.** Une date écrite de quatre façons produit six paires et
  **un** problème. Le premier passage réel l'a montré : `/(\d{4}-\d{2}-\d{2})/`,
  `/\d{4}-\d{2}-\d{2}/`, `/^\d{4}-\d{2}-\d{2}/` et `/^\d{4}-\d{2}-\d{2}$/` **dans neuf fichiers**.
- **Classées par nombre de FICHIERS, jamais par nombre d'écritures.** Deux écritures dans un seul
  fichier est une question de style ; les mêmes dans neuf fichiers, ce sont neuf lecteurs qui
  divergeront le jour où l'un sera corrigé seul — exactement le scénario de #1171.
- **La distance se DÉRIVE du corpus** (Article 24), elle ne se recopie pas : on monte tant que la
  plus grosse famille ne double pas, et la dérivation s'imprime avec le résultat. Mesuré le
  2026-09-29 : d=1 → 15 familles (plus grosse 4) · d=2 → 36 (4) · d=3 → 57 (**9**) · d=4 → 73 (15).
  Le saut à 9 est le moment où la fermeture transitive enchaîne des motifs sans rapport.
- **Chaque famille est une QUESTION, jamais un verdict.** Même discipline que
  `redondanceEntreOutils()`, et pour la même raison : `/^\|\s*-+\s*\|/` reconnaît la ligne de
  séparation d'un tableau et `/^\|\s*\d+\s*\|/` une ligne de tâche — deux caractères d'écart, deux
  intentions opposées. Un outil qui aurait tranché aurait fondu les deux mauvais.

### Les quatre silences volontaires, écrits pour qu'on ne les « améliore » pas

- **Deux motifs sur la MÊME LIGNE ne forment jamais une famille** : une énumération de vocabulaire
  (`[/\bcorrige\b/, /\bcorriger\b/]`) est une liste voulue, pas un oubli.
- **Un motif sans métacaractère est ignoré** : deux mots proches sont deux mots, pas deux écritures
  d'une notion.
- **Un motif cité en commentaire est une MENTION**, jamais une écriture — la règle que tout ce dépôt
  applique déjà.
- **`check-house.mjs` est hors du relevé**, et la raison est écrite dans le code : le filet fabrique
  exprès des variantes proches pour vérifier qu'un détecteur mord. Les compter ferait crier l'outil
  sur les contre-tests destinés à le protéger, donc le ferait taire (leçon L4).

### Les quatre faux amis du slash, appris au premier tri

Le premier jet rendait **34 familles, dont 6 — 18 % — n'étaient pas des expressions régulières du
tout**. Un détecteur qui livre un cinquième de déchet évident cesse d'être lu (leçon L4), donc le
tri vit dans l'outil et pas dans la tête du lecteur :

1. **une division** — `(t / 100 * .3 - t / 100)` donnait le faux motif `/ 100 * .3 - t /`. Un
   littéral d'expression régulière ne suit jamais une valeur : le caractère avant son slash
   d'ouverture n'est jamais un identifiant, un chiffre, une parenthèse ou un crochet fermant, ni un
   point ;
2. **une balise fermante dans un gabarit** — `` `<li>${x}</li>` `` donnait `li>`).join("")}<`. Le
   candidat porte alors un accent grave, ce qu'aucun littéral ne peut contenir sur une ligne ;
3. **une balise fermante JSX** — `</button>` dans un `.tsx`, toujours précédée d'un `<` ;
4. **un motif construit avec `new RegExp(...)`** — le motif y vit dans une CHAÎNE et ses slashes
   internes (`\./`, `scripts/`) se lisent comme des bornes. La ligne entière est écartée, et ces
   motifs-là sont donc **hors de portée** de ce détecteur : le dire vaut mieux que rendre du bruit.

Après filtrage : **979 motifs relevés, 28 familles, zéro déchet évident.**

### Ce qu'il a trouvé à son premier passage réel

**28 familles sur 979 motifs relevés**, dont :

| Ce qui est écrit plusieurs fois | Écritures | Fichiers |
|---|---|---|
| une date `AAAA-MM-JJ` | 4 | 9 |
| une ligne de tableau markdown | 3 | 6 |
| un chemin `docs/simulations/` (ancré ou non) | 2 | 5 |
| une extension de fichier source | 5 formes réparties en 2 familles | 4 + 4 |
| un **numéro de tâche** `#NNNN` | 4 | 3 |

Le dernier est le plus net, et il est **dans un seul fichier** : `god-of-all-process.mjs` porte
`MOTIF_NUMERO = /#(\d{1,5})\b/` et `MOTIF_NUMERO_COMMIT = /#(\d{2,4})\b/`. Les deux lisent des
numéros de tâche du même registre et ne s'accordent ni sur le bas ni sur le haut de l'échelle. Rien
ne casse aujourd'hui (le registre est à quatre chiffres) — c'est exactement la forme du défaut
#1171, prise avant qu'elle ne coûte quelque chose. **Non corrigé : c'est une décision, pas un
constat** (tâche ouverte).

### Le tri des 28 — un rapport n'est pas fini quand il est écrit (Article 28)

Chaque famille a été REGARDÉE, une par une. C'est la seule façon de savoir ce que vaut un détecteur
neuf, et le résultat compte autant que la trouvaille : **la plupart des familles sont légitimes**, et
un outil qui laisserait ses 28 lignes sans qualification deviendrait du décor en une semaine.

**ÉCARTÉES — deux notions différentes, et la ressemblance est un hasard d'écriture (10 familles).**
`/^\|\s*-+\s*\|/` reconnaît la ligne de séparation d'un tableau, `/^\|\s*\d+\s*\|/` une ligne de
tâche : deux caractères d'écart, deux intentions opposées. Même chose pour `\s*\]\s*$` (fermer un
crochet) contre `^\s*\}\s*$` (fermer une accolade), `#{1,6}` (n'importe quel titre markdown) contre
`#{2,4}` (les seuls niveaux navigables), `.mjs|md` (un outil et sa fiche) contre `.mjs|sh` (ce qui
s'exécute). **C'est exactement pour ces dix-là que l'outil pose une question au lieu de trancher :
un outil qui aurait fusionné aurait fondu les mauvais.**

**ÉCARTÉES — une capture en plus, ou une ancre, dans le même fichier pour deux usages (8 familles).**
`/^([A-Za-z_$][\w$]*)$/` et `/^[A-Za-z_$][\w$]*$/` : l'un extrait, l'autre valide. Rien à unifier.

**RETENUES — la même notion, écrite par plusieurs lecteurs (10 familles), et une seule est déjà une
tâche.** Par ordre de portée :

| La notion | Écritures | Fichiers | Ce qu'on en fait |
|---|---|---|---|
| un **numéro de tâche** `#NNNN` | 4 | 3 | **tâche #1175** — deux motifs dans le MÊME fichier qui ne s'accordent ni en bas ni en haut |
| une **date** `AAAA-MM-JJ` | 10, en 4 familles | ~12 | à trancher : le projet a-t-il UNE notion de date ? (Article 32 en est le sujet) |
| un **slug d'outil** | 4 | 13 | regardé : les quatre normalisent les accents, chacun à sa façon, et **chacun l'a appris par son propre bug** — trois corrections documentées de la même cause |
| un **signal de Ronde** `circle-signal*.txt` | 2 | 2 | `tool-learning` exige le tiret, `circle-tasks` non — deux outils qui lisent LES MÊMES fichiers |
| le statut **`à trancher`** | 2 | 2 | ancré chez l'un, pas chez l'autre — deux outils, un même registre |
| une **extension de source** | 4 | 4 | `x-port-blindtest` oublie `.tsx` — **vérifié : sans effet**, il ne balaie que `scripts/` et `lib/`, qui n'en portent aucun |

La ligne « extension de source » est celle qui montre le mieux à quoi sert la vérification : lue
seule, elle annonçait qu'une mesure de portabilité passait à côté de 65 composants React. Elle n'en
passe aucun, parce que le dossier n'est pas balayé. **Un constat non vérifié aurait produit un
correctif qui ne corrigeait rien, et un chiffre alarmant dans un rapport.**

### Ce qu'il ne fera jamais

Une **RESSEMBLANCE d'écriture, jamais une identité d'intention**. Il ne lit pas ce qu'un motif veut
dire ; il voit que deux personnes ont écrit presque la même chose. La question « est-ce la même
notion ? » reste entière, et c'est pour ça qu'elle est posée plutôt que tranchée.

---

## La raison écrite, qu'il prescrivait sans savoir la lire (2026-10-02, tâche #1451)

### Le défaut était dans sa propre prescription

Chaque ligne de son plan dit : « fondre les N blocs, **OU** écrire pourquoi ils restent séparés ».
Deux issues annoncées — **une seule honorée**. La sortie du plan passait uniquement par
`docs/clone-hunter/memoire.json`, qui exige un accord daté de l'utilisateur. Une raison écrite dans
le code, c'est-à-dire exactement ce que la phrase demande, ne changeait **rien**.

**Le dégât, mesuré** : la paire de `api-providers.mjs` portait sa raison depuis le 2026-09-29
(#1207). Elle est revenue au plan à chaque passage pendant trois jours, avec le même ordre de
travail, son compteur de relance grossissant comme si personne n'avait jamais regardé. C'est la
**leçon L4** en acte — un garde-fou qui accuse le geste correct finit par ne plus être lu — et il
l'appliquait à la moitié de sa propre prescription.

### Ce qu'il ne fait surtout pas : se taire

Un outil qui s'acquitterait tout seul sur la foi d'un commentaire serait la **faille 2 de
l'Article 31**, un habillage. Donc le cluster :

- **reste dans le rapport** et **reste compté** dans les problèmes distincts ;
- **reste au plan d'action** ;
- ne quitte le plan **que** par l'accord explicite de l'utilisateur, comme avant.

Ce qui change est son **ÉTAT** : « à trancher » au lieu de « retenu », avec le chemin et la ligne de
la raison déjà écrite. L'Article 28 a trois états exactement pour ça — ce qui demande une décision
qui n'est pas celle de l'agent.

### Les deux conditions sont cumulatives, et la seconde évite le faux positif qui compte

| Marqueur | Ce qu'il vérifie |
|---|---|
| `MARQUEUR_DU_SUJET` | on parle bien de duplication (`clone-hunter`, `doublon`, `dupliqu`, `recopi`) |
| `MARQUEUR_DE_DECISION` | ça **reste** séparé — jamais seulement que ça l'a été |

`api-providers.mjs` porte **deux** commentaires voisins sur la duplication : le premier dit pourquoi
la queue reste recopiée, le second raconte une factorisation **déjà faite**. Reconnaître une raison
à la seule mention d'un doublon aurait pris le second pour le premier — autrement dit, un
commentaire qui célèbre une fusion passée aurait dispensé de la fusion suivante.

### Le second idiome est MESURÉ dans le dépôt, jamais imaginé

Article 17, corollaire : on cherche un **PRINCIPE**, pas un mot de plus dans une énumération. Ce
projet écrit le refus de fondre de deux façons, relevées sur des sites réels :

- « **RESTE SÉPARÉE** » ;
- « **Les fondre** + ce que ça coûterait » (`check-house:6650`, `doc-report:1400`,
  `summarize-simulation-log:145`, `the-king:1938`).

**Le piège voisin est exclu exprès** : « **CONFONDRE** les deux ferait… » parle de mélanger deux
NOTIONS, jamais de fusionner deux blocs, et cinq sites du dépôt l'emploient. D'où le `\bles\s+fondre`
— « confondre » ne porte jamais « les » devant lui.

### Deux corrections payées dans l'heure, toutes deux trouvées en vérifiant dans les DEUX SENS (BP4)

1. **La fenêtre glissante imposait un ordre que la prose n'a pas.** La première version lisait le
   sujet sur UNE ligne puis cherchait la décision dans les six suivantes. Elle a donc manqué la
   raison de `summarize-simulation-log.mjs`, dont la décision est à la ligne 140 et le sujet à la
   141 — l'ordre inverse. Le raisonnement se fait désormais par **bloc de commentaire entier**.
2. **L'extrait cité était la première ligne du bloc**, soit un filet de tirets chez `doc-report.mjs`
   — un message qui n'apprenait rien. Il cite maintenant la ligne qui porte la décision.

**Et deux fois mon attente était fausse, pas l'outil** : je croyais `api-providers` seule instruite.
`doc-report.mjs:1395` (#1246) et `summarize-simulation-log.mjs:140` (#1207) portaient déjà la leur.
L'outil a rendu un résultat que je ne connaissais pas d'avance — le critère exact de la faille 2 de
l'Article 31.

### Sa limite, déclarée

La reconnaissance est **heuristique** : elle lit deux familles de formulations observées dans ce
dépôt. Une raison écrite dans une troisième tournure lui échappera, et le rapport dira simplement
« rien trouvé » — un faux négatif silencieux, qui ramène la paire en « retenu » alors qu'elle est
instruite. Le dire vaut mieux que le laisser croire : si une paire revient au plan alors que sa
raison est écrite, c'est la **lecture** qui est en cause, pas le commentaire.

### Ce que ça a donné cette nuit-là

**9 problèmes distincts au début, 4 à la fin, et ZÉRO en état « retenu ».** Les 4 restants portent
tous leur raison et attendent son accord — « zéro constat » au sens littéral est hors de portée de
l'agent seul, **par construction du garde-fou, et c'est voulu**. La question lui est portée dans
`docs/idees-a-trancher.md`.
