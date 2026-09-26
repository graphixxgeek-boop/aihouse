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
du 2026-09-22 : **god centralise**, les contrôleurs de process secondaires ne livrent jamais leur rapport
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

### L'historique et les évolutions (2026-09-22)

Question posée : « je veux que ce rapport soit comparé à chaque ronde, et me dire les evolutions.
c'est dejà prevu ? ». **Réponse honnête : non, ça ne l'était pas.** Le rapport se régénérait à vide
à chaque passage, sans aucune mémoire — donc une note qui se dégradait trois Rondes de suite se
lisait exactement comme une note stable, et un chiffre qui avait doublé ressemblait à un chiffre
normal. Une évaluation sans historique ne mesure pas une trajectoire, elle photographie un instant.

**Cinq états, jamais trois**, et c'est tout l'enjeu. La tentation est de comparer deux nombres et de
conclure mieux / pareil / moins bien. Deux cas de plus existent et se confondraient avec « pareil » :

- **première mesure** — rien à comparer. Ce n'est pas de la stabilité, c'est une absence de passé ;
- **plus mesuré** — le domaine était évalué, il ne l'est plus. C'est le pire des cinq à laisser
  passer pour « stable » : **une note qui disparaît ressemble à une note qui tient.**

Ce projet a déjà payé cette confusion plusieurs fois (une absence de mesure prise pour une mesure
rassurante) ; elle est nommée ici pour ne pas la repayer. Un domaine non évalué n'est d'ailleurs
**pas persisté du tout** — l'enregistrer avec une valeur nulle ferait lire « stable » au passage
suivant au lieu de « première mesure ».

**Les chiffres du jury sont comparés aussi**, et ce sont souvent eux qui parlent le plus fort (un
poids de charte qui grimpe, un retard de Ronde qui s'allonge). Volontairement **sans flèche verte ni
rouge** : selon le juge, un chiffre qui monte peut être une bonne ou une mauvaise nouvelle, et poser
un jugement automatique dessus serait une interprétation déguisée en mesure.

**Section 0, en tête du rapport** — avant même le jury : une trajectoire dit plus qu'une
photographie, et c'est la première chose qu'il regardera. Registre :
`docs/angel-of-ia-process/historique-evaluations.json`. On compare **avant** d'enregistrer, sinon on
comparerait le passage à lui-même.

## `resume-contextualise` — la règle de conduite qu'aucun programme ne peut lire

*(Section ajoutée le 2026-09-23, lot 1 du chantier CLAUDE.md. MOÏSE-TABLES-DE-LOI a refusé de
réduire l'Article 29 à un renvoi vers cette fiche : la charte y désigne nommément son porteur, et le
nom n'apparaissait nulle part ici. La charte promettait donc une adresse qui ne répondait pas —
exactement ce que l'Article 27 appelle une dette de reprise.)*

**Ce que la règle demande** : tout compte rendu de travail s'ouvre sur un bloc visuellement séparé
rappelant le contexte, la demande de l'utilisateur dans ses mots à lui, l'étiquette de la ou des
tâches concernées, et un vocabulaire compréhensible sans être développeur.

**Ce qu'aucun mécanisme ne peut faire, et pourquoi c'est déclaré plutôt que tu** : un compte rendu
n'existe pas sur le disque. Il est écrit dans la conversation, lu, puis il disparaît. Aucun script
ne peut aller vérifier qu'il portait ses quatre rappels. C'est la limite honnête de tout ce qui
relève de la CONDUITE, par opposition au déroulé d'une activité que god-of-all-process peut suivre
à la trace.

**La seule protection possible, et elle est appliquée ici** : la règle est INTERROGÉE plutôt que
constatée. `resume-contextualise` figure dans `REGLES_SURVEILLEES` avec une clé de réponse
obligatoire ; sans réponse, angel refuse d'être au vert — il ne suppose jamais la conformité, il
déclare « pas mesuré ». Une règle qu'on suppose respectée est une règle qui a cessé de l'être sans
que personne ne le sache (leçon L1).

**Ce que ça implique pour une autre IA qui reprend le projet** : cette règle ne survivra que parce
qu'elle est écrite à deux endroits et qu'on vous la redemandera. Il n'y a pas de test à faire
passer, et il n'y en aura jamais.

## OÙ J'AI BUTÉ SUR UNE SAISINE — la qualité de ses demandes, mesurée sur des cas réels (2026-09-26, tâche #728)

**Sa question, dans ses mots** : « est-ce que mes prompts sont assez bien ecrits ? je veux etre
évalué sur ce point regulierement, rapport à la ronde : orthographe, grammaire, facile à comprendre
PAR TOI ».

**Le seul critère qui compte est le troisième, et le lui dire franchement vaut mieux que de le
noter.** L'orthographe et la grammaire ne gênent jamais la compréhension ici : les accents manquants
et les fautes de frappe passent sans le moindre coût. Le noter là-dessus le ferait travailler pour
rien. Ce qui coûte réellement, c'est une demande **ambiguë**, une consigne qui **se contredit** à
deux endroits, ou un **pronom** dont la cible n'est pas retrouvable.

**Le piège est nommé dans la tâche elle-même** : un agent qui note l'écriture de celui qui le dirige
a toutes les raisons d'être complaisant. Le biais inverse existe aussi, et il est tout aussi faux :
s'accuser systématiquement pour ne jamais le mettre en cause produit un rapport flatteur d'un autre
genre, et le prive d'une information qui lui servirait.

**Ce qui désamorce les deux : on ne rend jamais une note, on enregistre des CAS.** Chacun porte la
phrase exacte, ce que j'ai compris, ce qu'il voulait dire, et une **cause nommée** rangée dans
l'une de deux familles étanches :

| Côté saisine | Côté agent |
|---|---|
| `ambigu` — deux lectures possibles menaient à deux travaux différents | `precedent-non-cherche` — un document ou un outil existait déjà et je ne l'ai pas cherché |
| `contradiction` — deux endroits de la même saisine se contredisaient | `process-non-lu` — un process écrit disait comment faire et je ne l'ai pas relu |
| `pronom` — un « ça », un « le », un « ce truc » dont la cible n'était pas retrouvable | `lecture-trop-rapide` — la saisine le disait, je l'ai lu de travers |

**Le côté est DÉRIVÉ de la cause, jamais déclaré à la main** (Article 24) : un côté écrit à part
pourrait contredire sa propre cause, et personne ne le verrait.

**Les trois refus, et chacun ferme une façon de rendre le chiffre faux** :

- **un cas sans sa phrase exacte est refusé** — ce ne serait plus une observation, ce serait une
  impression, et une impression est précisément ce que cette tâche interdit ;
- **une cause hors des deux familles est refusée** — un cas rangé nulle part ne compte dans aucun
  total et fait silencieusement baisser celui qu'il aurait dû faire monter ;
- **un registre vide rend « PAS MESURÉ », jamais un satisfecit** (leçons L5/L11) — « personne n'a
  rien noté » ressemble trait pour trait à « tout était clair », et les deux ne veulent pas dire la
  même chose. C'est le défaut que ce projet a payé le plus souvent.

**Registre** : `docs/profil-utilisateur/incomprehensions.json`. **Sortie** : section
« OÙ J'AI BUTÉ SUR UNE SAISINE » du rapport d'angel, donc relayée à la Ronde par god-of-all-process
(Article 26) — jamais un rapport de plus à aller chercher.

**Premier résultat réel, et il n'est pas flatteur pour l'agent** : sur 3 incompréhensions
enregistrées le 2026-09-26, **0 venaient de sa saisine et 3 de moi**. La réponse honnête à sa
question est donc oui, ses prompts sont assez bien écrits. **Les trois miennes sont imprimées en
clair avec ses phrases** : les taire aurait rendu le premier chiffre flatteur pour lui et faux.

**Ce que ce mécanisme ne fera jamais** : détecter tout seul qu'une saisine était ambiguë. Personne
ne peut lire ça dans un fichier. C'est l'agent qui enregistre le cas au moment où il bute, et
déclarer cette limite EST la protection (Article 27) — comme pour `resume-contextualise` ci-dessus,
il n'y a pas de test à faire passer et il n'y en aura jamais.
