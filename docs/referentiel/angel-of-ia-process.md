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

## L'évaluation de l'utilisateur, et le JURY (2026-09-22)

**Demandée par lui, et la raison est conservée dans le code** parce qu'elle seule rend l'exercice
tenable :

> « Toi aussi tu dois alimenter ce rapport et me mettre une evaluation sur ma participation à ce
> projet : je n'ai pas besoin d'eloges ou faux semblants, je veux un oeil critique qui sert le
> projet en priorité. Pourquoi cette notation sur moi-meme ? Justement pour que le projet reste la
> priorité, la seule valeur à protéger, meme au detriment de quelques frictions ou desaccords ou
> remarques à mon sujet. »

Un agent qui note celui qui le dirige penche naturellement vers la complaisance. Le seul contrepoids
est ce mandat explicite ; sans lui conservé noir sur blanc, le prochain agent adoucira en croyant
bien faire. Le rapport le dit d'ailleurs lui-même, dans la section de jugement : *si une note paraît
trop douce, c'est probablement elle qui a raison et moi qui ai reculé.*

**Pourquoi angel et pas CASSANDRA.** L'Article 26 lui donne déjà ce mandat (« les deux côtés,
l'agent comme l'utilisateur, sont notés pareil »). CASSANDRA note l'ÉQUIPE d'outils, jamais l'humain
— un commentaire de ce fichier affirmait le contraire jusqu'au 2026-09-22, sans que personne ne
l'ait jamais vérifié ; corrigé le même jour.

**L'organisation, et personne n'y centralise** : angel PRODUIT les verdicts de conduite, CASSANDRA
ASSEMBLE et PUBLIE le récapitulatif — même relais que god relayant angel pour les process. Une
seule voix à la Ronde, mais chaque verdict reste attribué à qui l'a rendu.

### Les trois garde-fous de structure, chacun contre un mode d'échec précis

1. **Mesurable et jugement ne se mélangent jamais** (choix explicite) — un fait qui se compte et une
   opinion qui s'argumente n'ont pas le même poids ; les mêler laisserait croire que l'opinion est
   aussi solide que le chiffre, et empêcherait de contester l'une sans entamer l'autre.
2. **Une note par domaine, jamais de note globale** (choix explicite) — une moyenne unique noie le
   domaine qui va mal dans ceux qui vont bien.
3. **Un désaccord n'efface jamais la remarque**, il se pose à côté (choix explicite, et sa propre
   raison) — une critique qu'on peut faire disparaître en la contestant ne vaut rien. Registre :
   `docs/angel-of-ia-process/desaccords.md`.

**Les notes sont des paliers nommés** (`PALIERS_NOTE` : à corriger / fragile / correct / solide /
exemplaire), jamais un nombre nu — « 12/20 » ne dit pas quoi changer, « fragile » si. L'indice
numérique n'existe que pour suivre une évolution, jamais pour faire une moyenne qui reconstruirait
la note globale écartée.

### Le JURY — huit outils qui détenaient déjà de la donnée sur lui

Ajouté le même jour sur sa demande : « il devrait y avoir plus d'outils qui me jugent [...] pourvu
que ce soit pertinent à me faire remonter. Moi aussi, je veux profiter de la data ! » — puis, en
précision : « je ne crois pas que la creation de scripts "juges" soit necessaire, on fait avec
l'existant ». Aucun outil n'a donc été créé pour ça.

**Le constat qui a justifié le registre** : plusieurs outils mesuraient depuis des semaines des
choses qui parlent de lui et de personne d'autre — ce que ses demandes ont coûté, ce que ses règles
pèsent, si ses propres objectifs sont tenus — et toute cette donnée ne servait qu'à juger le CODE.
Elle existait ; elle ne lui était simplement jamais adressée.

**Critère d'entrée, strict** : un juge n'entre que s'il lit une donnée RÉELLE déjà collectée, et que
cette donnée dise quelque chose qu'il ne peut pas voir autrement. Les huit : SMART-CONSO-TOKEN (le
retour réel de ses demandes), Smart Conso API (le rythme imposé), **ecotoken** (le plus invisible
des huit : ce que pèsent ses propres règles, rechargées à chaque message, pour toujours),
objectifs-vs-resultats (ses objectifs confrontés aux résultats), **THE-KING** (ses décisions
confrontées au texte de valeurs qu'il a lui-même écrit), check-tasks-details (ce qui attend sa
décision, le rythme ouvert/clos, et les tâches transverses qui dérivent), CIRCLE-TASKS (les Rondes
jamais lancées), AXA-CHECK (ce que son arbitrage pour la vitesse laisse derrière).

**Garde-fou** (Article 24) : `findJugesSansOutil()` — un juge dont le script a disparu produirait une
section vide que personne ne remarque, et le rapport paraîtrait complet en ayant perdu un témoin.
Testé par son échec avant d'être cru sur son succès.

**Et un juge muet n'est jamais « rien à signaler »** : `collectJuryVerdicts()` distingue trois états
— verdict rendu, rien à signaler (le juge s'est prononcé), pas de verdict (il n'a pas tourné). Les
confondre est l'erreur que ce paysage combat depuis le début.
