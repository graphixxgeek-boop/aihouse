# ANGEL-OF-IA-PROCESS — instanciation

*Blueprint générique : `docs/angel-of-ia-process-blueprint.md`. Registre : `docs/angel-of-ia-process/`.
Script : `scripts/angel-of-ia-process.mjs`.*

## Origine

Créé le 2026-09-22, nom donné par l'utilisateur, à la suite de sa demande : « est-ce qu'il y a un
outil qui peut etre dédié à la verification des regles de travail (dans le perimetre process), tres
important, soit on fait une extension à god of process, soit on crée un outil à part
"angel-of-ia-process : si c'est une extension, on l'appelle ainsi aussi) ».

**Arbitrage retenu : un outil SÉPARÉ.** god-of-all-process surveille le déroulé d'ACTIVITÉS (une
Ronde, une simulation) ; angel surveille la CONDUITE de ceux qui travaillent — le respect de
`docs/regles-de-travail.md` et des Articles de conduite de `CLAUDE.md`. Deux métiers ; les fondre
aurait rendu god illisible.

Portée des deux côtés, dans les mots de l'utilisateur : « sa vocation est comme pour tous les outils
process : verifier et garantir la discipline d'execution, que ce soit pour moi ou pour toi ». Même
parti pris que CASSANDRA-RH, qui note déjà tout le monde, l'utilisateur inclus.

## Ce qu'il surveille (`REGLES_SURVEILLEES`)

Neuf règles, chacune portant trois attributs : `cote` (agent / utilisateur / les deux), `observable`
(une trace existe-t-elle sur le disque), `source` (où la règle est écrite — jamais une règle
orpheline).

Trois sont observables (consultation avant d'agir, suivi dans le même commit, push au fil de l'eau
— la première seule est mesurée automatiquement à ce jour) ; les six autres se jouent dans la
conversation et sont **demandées** via le paramètre `faits`, jamais devinées.

## Son apport propre : le croisement des horodatages

`checkConsultationOrder()` croise `.tool-usage-history.json` (le compteur d'usage, qui horodate
chaque lancement d'outil) avec `git log` (qui horodate chaque commit), sur une fenêtre de 120
minutes. `CONSULTATIONS_OBLIGATOIRES` liste les trois outils dont la consultation doit précéder le
travail : tool-brain, Smart Conso API, SMART-CONSO-TOKEN.

Seul le cas « consulté APRÈS le commit, jamais avant » dit quelque chose. Ne l'avoir jamais lancé
du tout ne prouve rien — ce commit ne le concernait peut-être pas, et accuser sur une absence serait
exactement l'erreur que tout ce paysage combat.

## Les deux passages ratés — et ce qu'ils ont appris

Cette histoire est conservée parce qu'elle est la meilleure illustration disponible du défaut
récurrent de ce projet : **une mesure adjacente lue comme la mesure visée**, commise ici dans
l'outil même écrit pour surveiller la discipline.

**Premier passage (12 h 07).** Six accusations. Les six « consultations tardives » étaient en réalité
moi relançant ces outils pour vérifier qu'ils fonctionnaient encore après leur migration vers le
gabarit unifié. Correctif : une origine `verification` ajoutée à `USAGE_ORIGINS`, honorée par
`recordCliUsage()` via `TOOL_USAGE_ORIGIN`, et écartée par angel.

**Deuxième passage (12 h 12).** Les six accusations tenaient toujours — portées cette fois par des
événements `cli_direct`, enregistrés avant que la nouvelle origine n'existe. Le premier correctif ne
réparait que l'avenir.

La vraie cause était écrite noir sur blanc dans la définition même de `cli_direct`, dans
`scripts/tool-usage.mjs` : « le script SAIT qu'il a été lancé via sa propre ligne de commande, mais
ne peut jamais savoir POURQUOI ». Cette origine ne prouve donc **aucune consultation** — elle prouve
un lancement. La lire comme une consultation était la faute.

**Correctif de fond**, désormais la règle de l'outil : seules les origines de JUGEMENT
(`ORIGINES_DE_JUGEMENT` = `spontane`, `demande` — les deux que l'agent déclare sciemment) peuvent
fonder un manquement nommé. Un `cli_direct` hors d'ordre devient un **signal non concluant**,
montré dans sa propre rubrique (« montrés, jamais imputés »), jamais compté comme une faute.

Résultat mesuré après correctif, sur les mêmes 10 commits : **0 manquement, 6 signaux non
concluants**. Les six traces n'ont pas disparu — elles ont cessé d'accuser.

## Garde-fous d'évolutivité (Article 24)

`ORIGINES_DE_JUGEMENT` et `ORIGINE_NON_CONCLUANTE` nomment des valeurs définies dans
`scripts/tool-usage.mjs`. `findOriginesInconnues()` vérifie mécaniquement qu'elles existent encore,
et `checkConsultationOrder()` renvoie `mesurable: false` si l'une a disparu — jamais un décompte de
zéro en silence, qui produirait un faux vert pire que l'erreur surveillée.

## Le verdict

`auditWorkingRules()` ne peut être vert que si **aucun** manquement ET **aucune** règle non fournie
ne subsistent. Un vert obtenu en ne posant pas les questions serait le pire des faux verts.

## Livraison

`angelSectionLines()` produit une section autonome, relayée par
`god-of-all-process.mjs::buildProcessComplianceReport({ sectionAngel })`. Décision de l'utilisateur
du 2026-09-22 : **god centralise**, les gardiens secondaires ne livrent jamais leur rapport
directement à la Ronde — mais la conduite ne se mélange jamais aux étapes de process sautées.

## Nature du résultat

Classé `heuristique` dans `TOOL_RELIABILITY` : il croise des horodatages, et une consultation faite
dans une session sans commit lui reste invisible. Un signal daté, jamais une preuve — l'avertissement
est imprimé en tête de chaque rapport.
