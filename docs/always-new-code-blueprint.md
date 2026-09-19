# ALWAYS-NEW-CODE — dette d'organisation par l'épreuve de la page blanche — blueprint exportable

*(Créé le 2026-09-19, à la demande explicite de l'utilisateur, juste après CHECK-LEVEL-TARGET :
« l'outil te propose d'imaginer que le code n'existe pas et que tu dois reconstruire le code depuis
zéro, en partant de rien, mais en ayant une idée claire de là où tu veux en arriver [...] l'ennemi à
abattre pour cette machine de guerre : tout ce qui a été codé de façon "empilée" [...] la vocation
ultime de cet outil : avoir toujours un code "comme neuf" ». Nommé par l'utilisateur lui-même. Même
logique déjà appliquée à ARGUS/HARMONIA/Smart Conso API/HYPER-SCAN-CHECKPOINT/CHECK-LEVEL-TARGET :
ce document décrit le PATRON générique ; l'instanciation propre à *Maison IA vivante* vit dans
`docs/referentiel/always-new-code.md`.)*

## Le problème que ce patron résout

Un projet qui vit longtemps et évolue par petites demandes successives finit presque toujours par
accumuler une troisième forme de dette, distincte des deux autres déjà outillées dans ce projet
(cf. `docs/argus-blueprint.md` et `docs/harmonia-blueprint.md`) :
- ARGUS trouve des **absences** — quelque chose qui devrait exister et n'existe pas.
- HARMONIA trouve des **frictions** — deux choses qui existent et se contredisent.
- ALWAYS-NEW-CODE trouve de la **dette d'organisation** — du code qui fonctionne, qui n'est ni
  incomplet ni contradictoire, mais qui a grandi par ajouts successifs plutôt que par conception,
  et qui ne serait jamais écrit ainsi si on le reconstruisait aujourd'hui avec la vue d'ensemble
  qu'on a maintenant. C'est le patron générique déjà nommé par l'Article 7 de ce genre de projet
  ("l'épreuve de la page blanche") — mais resté, avant cet outil, une question qu'on se pose
  informellement, jamais un outil qu'on déclenche et qui archive ses résultats.

## La méthode — grands axes d'abord, jamais ligne à ligne

Se poser réellement la question, sur UNE zone précise du projet (jamais tout le projet d'un coup,
voir plus bas) : « si je reconstruisais cette zone aujourd'hui, en partant de rien mais avec toute
la connaissance que j'ai maintenant de là où le projet doit aller, à quoi ressemblerait la
structure ? » — en s'intéressant d'abord aux GRANDS AXES (comment les responsabilités seraient
regroupées, quels seraient les nœuds centraux, où seraient les frontières) — puis seulement
comparer, point par point, cette structure imaginée à la structure réelle. Chaque écart devient une
trouvaille candidate.

## Deux temps, jamais un zoom au hasard

1. **Survol léger** (vue d'ensemble, grands axes de tout le projet ou d'une large portion) : repère
   quelles zones semblent le plus mériter un examen approfondi. Peut s'appuyer sur des indices
   mécaniques (section suivante) mais reste, pour l'essentiel, une lecture d'ensemble.
2. **Zoom profond** (sur UNE zone précise, choisie par le survol, par une demande explicite, ou par
   la rotation — voir plus bas) : le vrai travail d'imagination "page blanche" + comparaison
   détaillée, avec des trouvailles classées par palier de confiance.

## Le découpage en zones — jamais tout le projet d'un coup

Reconstruire mentalement TOUT un projet en une seule fois est à la fois hors de portée (limite de
raisonnement, pas seulement de budget) et peu fiable — un examen superficiel de tout vaut moins
qu'un examen profond d'une partie. Le patron générique : découper le projet en zones (thèmes,
modules, sous-systèmes — la frontière exacte dépend du projet, cf. instanciation) et n'en traiter
qu'une à la fois, en profondeur. **Réutiliser un découpage déjà existant dans le projet plutôt que
d'en inventer un nouveau est toujours préférable**, si un tel découpage existe déjà pour un usage
voisin (dans ce projet : les mêmes "grands thèmes" que la carte de dépendances d'HARMONIA).

## Rotation intelligente — une mémoire de couverture, jamais une liste à cocher à la main

Un dossier + un fichier d'index (même schéma que les autres outils de ce projet) archive, pour
chaque zone, la date de son dernier passage en zoom profond. La zone recommandée par défaut est
toujours la plus négligée (jamais vue, ou vue il y a le plus longtemps) — sauf demande explicite
qui cible une zone précise. Une demande explicite qui ne correspond à AUCUNE zone connue n'est
jamais acceptée à l'aveugle ni ignorée silencieusement : elle déclenche une question à l'agent (ou,
selon le contexte, à la personne qui pilote le projet) pour clarifier — instance du principe de
consultation bidirectionnelle (cf. section suivante).

## La consultation bidirectionnelle — un outil qui interroge, jamais un verdict à sens unique

Ce patron n'a de valeur que s'il sait dire "je ne suis pas sûr" plutôt que deviner. Concrètement :
quand la taille ou le niveau de détail d'un passage sont difficiles à estimer à l'avance, l'outil
(via l'agent qui l'utilise) précise la portée exacte et le temps estimé, et pose la question à la
personne qui pilote le projet plutôt que de choisir seul. Ce n'est jamais un ajout après coup : la
capacité de dialogue fait partie du cahier des charges de départ, au même titre qu'un blueprint
séparé ou qu'un registre local (cf. `docs/regles-de-travail.md` §7ter pour le principe général,
partagé avec les autres outils de ce projet).

## Une couche mécanique, gratuite mais jamais un verdict — des indices seulement

Certains signaux accompagnent souvent (jamais ne prouvent) l'empilement, et peuvent être détectés
sans aucun raisonnement :
- Un contenu qui accumule des marqueurs d'ajout daté sur la même règle/le même mécanisme, sans
  jamais être fusionné ou réorganisé.
- Un historique de version (git ou équivalent) d'un fichier qui ne montre que des insertions,
  jamais de suppression ni de refonte, sur de nombreux changements successifs.
- Des structures de code répétitives qui s'allongent à chaque nouvelle demande plutôt que d'être
  généralisées (chaînes de cas particuliers, tableaux qui ne font que grandir).

Ces signaux ne sont jamais promus au-delà de "probable" par la seule couche mécanique — la
confirmation exige toujours la lecture par un humain ou par l'agent (couche raisonnement).

## Le garde-fou le plus important — vérifier que ce n'est pas déjà un choix assumé

Avant de qualifier quoi que ce soit d'"empilé, à corriger", vérifier d'abord que ce n'est pas déjà
une décision consciente et documentée ailleurs dans le projet. Un projet mature accumule des choix
délibérés qui RESSEMBLENT à de l'empilement sans en être (ex. : ne jamais renuméroter des règles
déjà citées ailleurs, pour ne pas casser des renvois). Confondre les deux est le mode d'échec le
plus probable de ce patron — découvert concrètement dans *Maison IA vivante* le jour même de sa
conception (cf. instanciation, leçon `trottoirGranted`).

## Jamais un résultat "exact à 100 %"

Une proposition de restructuration est un jugement architectural, pas un calcul — deux personnes
compétentes peuvent légitimement en proposer deux différentes et défendables pour le même code.
Ce patron rend donc TOUJOURS ses trouvailles avec un palier de confiance explicite (confirmé /
probable / à surveiller, même vocabulaire qu'ARGUS) — jamais une promesse d'exactitude absolue,
même avec un budget de temps/raisonnement illimité. Annoncer autre chose serait la fausse précision
que ce genre d'outil doit justement éviter.

## Jamais une application automatique

Ce patron ne fait jamais de restructuration réelle du code tout seul, même pour un changement qui
semble mineur — il propose, en précisant toujours la portée exacte et le temps estimé, et attend
une confirmation explicite avant que quoi que ce soit touche le code réel. Une réorganisation peut
toucher plusieurs fichiers à la fois : c'est le genre d'action qui mérite toujours une validation
humaine avant d'être exécutée.

## KPI — suivi dès la création, pas différé

Contrairement aux autres outils de ce projet (dont le suivi KPI a été explicitement repoussé "trop
tôt" à leur création), ce patron suit sa performance dès le premier passage : le nombre de
trouvailles CONFIRMÉES par passage est l'indicateur de base — permet de vérifier dans la durée que
l'outil trouve vraiment des choses utiles, pas seulement qu'il tourne.

## Ce que ce patron n'est pas

- Un remplacement du jugement humain sur ce qui mérite d'être réorganisé : il propose, la personne
  qui pilote le projet décide.
- Un outil qui traite tout le projet en une seule fois : la profondeur exige le découpage en zones.
- Un outil qui promet l'exactitude : ses verdicts restent toujours nuancés par un palier de
  confiance.
- Un concurrent d'ARGUS ou d'HARMONIA : les trois se complètent (absences / frictions /
  organisation), jamais redondants entre eux.
