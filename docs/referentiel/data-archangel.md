# DATA-ARCHANGEL — instanciation

*Blueprint : `docs/data-archangel-blueprint.md`. Registre : `docs/data-archangel/`.
Script : `scripts/data-archangel.mjs`.*

## Origine

2026-09-22, nom donné par l'utilisateur, demande en trois temps : « verifie toute la partie :
echanges de données : toute la matiere data produite par l'agence doit beneficier, si pertinent, à
tous les outils : trouve les connexions manquantes [...] et aussi point trés important : assure-toi
que l'organisation te permet d'avoir accès à toutes ces données, et qu'elles te soient utiles à TOI
en priorité. Assure-toi que tu puises bien dans toute la data. »

Calibrage tranché avant construction : **les deux sens, un seul verdict** ; et pour l'accès de
l'agent, **les deux formes plus la Ronde** (commande à la demande, alerte rare, relais périodique).

## L'inventaire (53 sources)

Trois natures, jamais confondues — elles ne se lisent pas au même rythme et une absence de lecteur
n'y veut pas dire la même chose :

- **journal** (17) : état local jamais committé, mémoire de travail entre deux lancements ;
- **registre** (35) : trace datée committée, l'histoire de ce qu'un outil a trouvé ;
- **mesure** (1) : `kpi-historique.csv`, la seule série qui permette de comparer dans le temps.

Aucune liste tenue à la main : les journaux viennent de `LOCAL_JOURNALS`, les registres de
`REGISTRIES` (doc-report), la mesure de `KPI_HISTORY_PATH`. Un nouvel outil qui déclare son journal
entre dans le champ de vision sans qu'une ligne ne bouge ici (Article 24).

## Le premier verdict était faux, et c'est instructif

« 53 sur 53 relues, 100 % ». Trop propre. Cause : `doc-report.mjs` cite **52 des 53 sources** parce
qu'il les DÉCLARE — il est le catalogue du paysage, pas un consommateur de ses données. Compter une
déclaration comme une lecture rendait tout le réseau parfaitement branché alors que rien ne
circulait.

Encore la même famille d'erreur que partout ailleurs dans ce projet : **une mesure adjacente
présentée comme la mesure visée** — commise, cette fois, dans l'outil écrit pour traquer exactement
ça.

Corrigé par un principe et non par une liste d'exceptions : `stripExportedConstantBodies()` retire
le corps de toute constante exportée avant de chercher, pour tous les fichiers. Plus
`FICHIERS_DE_VERIFICATION` (volontairement manuel, et l'Article 24 l'autorise à cette condition
écrite : ce sont les deux fichiers d'infrastructure de vérification du dépôt, stables par nature),
dont les citations comptent à part — vérifier n'est pas exploiter.

**Résultat réel après correction : 39 sur 53 (74 %), et 13 registres écrits que rien ne relit.**

## Les trois sorties

- **`node scripts/data-archangel.mjs`** — le verdict : orphelines, alerte critique, branchements
  suggérés.
- **`node scripts/data-archangel.mjs briefing [filtre]`** — MA commande : tout ce que l'équipe sait
  sur un sujet, avec la fraîcheur et le nombre de lecteurs de chaque source. À consulter avant un
  gros travail, comme tool-brain avant de chercher dans un fichier.
- **Item de Ronde** — le relais périodique.

## `criticalIgnoredData()` : l'alerte a le droit d'être rare

Il faut qu'une donnée soit à la fois FRAÎCHE (≤ 2 jours : quelqu'un vient de l'écrire, donc elle a
quelque chose à dire) et SANS AUCUN LECTEUR. Une donnée ancienne et ignorée est une question
d'hygiène, pas une urgence — et une alerte qui sonne tout le temps ne se lit plus.

## La nuance écrite dans le rapport lui-même

Un registre destiné à l'œil humain n'a pas besoin d'un lecteur-outil. Ce qu'aucun humain ne fera
jamais, c'est comparer trente passages pour en tirer une tendance. La liste des orphelines répond
donc à « personne n'exploite la série ? », jamais à « personne ne lit ce fichier ? ».

## Nature du résultat

`heuristique` : une lecture se mesure à la citation d'un chemin dans le code — une mention, jamais
la preuve que la donnée est réellement exploitée, et un chemin construit dynamiquement lui échappe
complètement.
