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
