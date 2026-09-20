# THE-DEEP-READER — instanciation pour Maison IA vivante

*(Créé le 2026-09-20, cousin de THE-FINAL-JUDGE — cf. `docs/referentiel/the-final-judge.md`, même
convention de parenté qu'ARGUS/HARMONIA (« le cousin d'ARGUS »), jamais un lien père/fils : les deux
outils partagent la même mécanique de fond — un agent séparé, réellement lancé via l'outil Agent —
mais n'ont ni la même persona, ni la même règle d'entrée, ni la même sortie attendue. Aucun n'hérite
de l'autorité de l'autre.)*

## Pourquoi un outil séparé, pas un mode de THE-FINAL-JUDGE

Trouvaille réelle (Article 19, vérifiée avant d'écrire une ligne de code) : la règle d'entrée de
THE-FINAL-JUDGE est explicite et non négociable — *« Reçoit UNIQUEMENT le dépôt (code +
documentation)... jamais l'historique de cette conversation »*. Sa persona entière est construite
pour juger le PRODUIT avec un regard neuf, justement en ignorant tout de nos échanges.

La relecture intégrale lourde du suivi a besoin de l'exact inverse : elle n'a rien à faire du code
ou du produit, elle a besoin de lire la conversation (transcript + résumés de compaction) et de la
comparer à `docs/suivi/`. Brancher ça sur THE-FINAL-JUDGE casserait sa règle fondatrice plutôt que
d'ajouter un sujet de plus — d'où un outil à part, qui réutilise seulement la mécanique de
déclenchement (agent séparé) et les garde-fous de coût déjà construits pour lui, jamais sa persona
ni sa règle d'entrée.

## Ce que fait la version LÉGÈRE (gratuite, déjà existante, jamais remplacée)

`docs/systeme-de-suivi.md`, section « Relecture intégrale de conversation », décrit déjà une
procédure en 5 étapes exécutée directement par l'agent qui pilote le projet (moi), à coût zéro
(pas d'agent séparé) — le premier niveau de rattrapage, à utiliser en premier dans l'immense
majorité des cas. THE-DEEP-READER n'existe que pour le cas plus rare où un regard vraiment neuf,
non biaisé par ma propre conviction d'avoir déjà bien tracé, est nécessaire.

## Personnage — texte FIXE, réutilisé mot pour mot à chaque appel

*(Même discipline que THE-FINAL-JUDGE : jamais reformulé à chaque déclenchement, pour éviter toute
dérive vers un ton neutre/consensuel de rapport.)*

> Tu es un archiviste méticuleux, sans opinion sur la qualité du projet ni sur ses choix de
> conception — ta seule tâche est une comparaison factuelle exhaustive. On te donne d'un côté
> l'intégralité d'une conversation de travail (demandes, remarques, questions posées par un
> utilisateur à un agent), de l'autre le système de suivi que cet agent est censé tenir à jour
> (`docs/suivi/`). Ta seule question, pour CHAQUE intervention de l'utilisateur qui porte une idée :
> existe-t-il une trace, et cette trace reflète-t-elle un travail réellement exécuté et vérifiable
> (fichier modifié, test ajouté, commit identifiable) — ou seulement une décision prise sans jamais
> être suivie d'effet ?
>
> Tu ne juges jamais si une idée était bonne, si un choix de conception était le bon, ni la qualité
> du code ou du produit — ce n'est pas ton rôle, un autre outil de ce projet (THE-FINAL-JUDGE) s'en
> charge séparément. Tu ne juges que la fidélité du suivi lui-même : complet ou trouable.

Reçoit UNIQUEMENT : le texte intégral de la conversation disponible (transcript + tout résumé de
compaction fourni), `docs/suivi/index.md`, tous les fichiers de `docs/suivi/sessions/`, et un
export de la liste de tâches technique de l'agent au moment du déclenchement (si disponible) —
jamais le code du jeu, jamais le produit, jamais un avis déjà formé par un autre outil du projet.

## Sortie attendue, toujours en français

1. Nombre d'interventions utilisateur relues.
2. Liste des écarts trouvés (intervention sans trace, ou trace ne couvrant qu'une décision jamais
   exécutée) — chacune avec assez de contexte pour ouvrir une tâche exploitable directement.
3. Confirmation explicite de ce qui est déjà bien tracé (jamais laisser croire que tout est perdu
   quand ce n'est pas le cas).
4. Limite honnête : toute portion de conversation non fournie dans son intégralité (au-delà de ce
   que le résumé de compaction a gardé) reste un angle mort assumé, jamais présenté comme couvert.

Reconciliation obligatoire par l'agent qui pilote APRÈS le rapport, jamais avant : chaque écart
retenu ouvre une vraie tâche (liste technique + ligne `docs/suivi/`), jamais un simple constat qui
reste sans suite — même principe que la réconciliation de THE-FINAL-JUDGE.

## Coût — honnêtement DIFFÉRENT de THE-FINAL-JUDGE, jamais présenté comme équivalent

*(Trouvaille du 2026-09-20, en réponse à une question explicite de l'utilisateur : « est-ce que le
coût est le même pour une relecture de TOUT ou une relecture ciblée ? »)* Le coût fixe de démarrage
d'un agent séparé (~37 000 tokens, cf. `docs/referentiel/smart-conso-token.md`) est quasi le même
quel que soit le périmètre — mais ce plancher n'est PAS le coût total. THE-DEEP-READER doit aussi
LIRE ce qu'on lui donne, et une relecture intégrale (toute la conversation, y compris plusieurs
sessions compactées) peut ajouter un volume de lecture réel bien supérieur au plancher fixe — jamais
un coût constant comme celui de THE-FINAL-JUDGE (qui lit toujours, en gros, le même dépôt).
Conséquence directe : un périmètre plus étroit (une seule session, une période précise) reste un
vrai levier d'économie, pas un gadget — jamais l'idée fausse que « puisque le plancher est fixe,
autant toujours tout lire ».

## Borne de relecture — un numéro de tâche, jamais une date/heure

*(Calibré explicitement le 2026-09-20, question de l'utilisateur : « jusqu'à quelle date, heure
il faut remonter ? attention prends en compte le fuseau, erreur de moi à ce moment là [...] depuis
quelle tâche faut-il tout relire ? quel est le repère temporel qui fixe la borne de relecture ? »)*

Une date/heure introduit un vrai risque d'erreur (fuseau horaire de l'utilisateur à traduire vers
l'UTC déjà utilisé dans `docs/suivi/`, ambiguïté sur "depuis quand" en langage courant). La borne
retenue est donc toujours un **numéro de tâche** (`docs/suivi/`, colonne N°, strictement croissant
et global, déjà mécaniquement vérifié par `findTaskNumberIssues()`) — zéro ambiguïté possible.

**Trois options présentées dans la fenêtre de calibrage au déclenchement, jamais moins** :
1. **Depuis le dernier passage confirmé (recommandé)** — `recommendRereadBoundary()`
   (`scripts/smart-conso-token.mjs`) lit le registre (`docs/suivi/relectures-lourdes/index.md`,
   colonne « Dernière tâche couverte ») et propose de reprendre juste après, avec un ordre de
   grandeur honnête du volume à relire (`classifyRereadVolume()`, appuyé sur `countTasksSince()`
   de `check-suivi-fidelity.mjs` — jamais un vrai compte de tokens, un proxy assumé comme tel).
2. **Depuis une tâche précise désignée** (par l'utilisateur ou l'agent, en cas de doute localisé
   sur une période précise) — `countTasksSince(cetteBorne)` donne le même ordre de grandeur pour
   cette borne alternative.
3. **Toute la conversation depuis le début** — la seule option sans ordre de grandeur mesurable
   (rien à comparer), toujours la plus coûteuse, réservée au tout premier passage ou à un doute
   généralisé sur tout l'historique.

Une fois le passage terminé, la ligne du registre enregistre la nouvelle « Dernière tâche
couverte » — la borne par défaut du PROCHAIN passage se déplace automatiquement, jamais recalculée
à la main.

## Consultation obligatoire avant lancement — DEUX conseillers, même règle que THE-FINAL-JUDGE

Consulter **Smart Conso API** ET **SMART-CONSO-TOKEN**
(`node scripts/smart-conso-token.mjs agent_subagent_spawn --confirm --identity=<modèle courant>`,
même `actionType` que THE-FINAL-JUDGE — la même ressource réelle est engagée : un agent séparé —
jamais un second registre de schémas coûteux inventé pour l'occasion) avant tout lancement, sans
exception. **Encart d'avertissement obligatoire** (demande explicite de l'utilisateur, même
traitement que THE-FINAL-JUDGE dans CIRCLE-TASKS) : ⚠️🔴, coût affiché en toutes lettres, jamais
coché par défaut dans une fenêtre à cocher.

## Cadence — périodique, proposée dans CIRCLE-TASKS

*(Calibré explicitement avec l'utilisateur le 2026-09-20.)* Contrairement à la procédure légère
(déclenchée sur demande ou sur signal concret), THE-DEEP-READER rejoint le menu périodique de
CIRCLE-TASKS (thème « Audit lourd », aux côtés de THE-FINAL-JUDGE) — jamais coché par défaut,
jamais lancé sans repasser par les deux conseillers au moment précis de la sélection.

## Registre

`docs/suivi/relectures-lourdes/` (dossier + `index.md`) — un fichier par passage
(`<date>.md` : nombre d'interventions relues, écarts trouvés, tâches ouvertes en conséquence).
Vit sous `docs/suivi/` plutôt qu'un dossier `docs/the-deep-reader/` séparé : son unique client est
LE-PLANIFICATEUR, contrairement à THE-FINAL-JUDGE qui sert tout le projet.

## Partie mécanique + KPI (2026-09-20)

`scripts/the-deep-reader.mjs` — zéro appel réseau, zéro coût API (le jugement lui-même reste un vrai
raisonnement, jamais mécanisable), même statut que `scripts/the-final-judge.mjs` :
- `extractPersonaBlock(texte)` — extrait le personnage FIXE directement de ce document, jamais
  reformulé à la main à chaque appel.
- `detectGenericReport(texte)` — repère les signaux structurels d'un rapport trop vague pour être
  exploitable : aucun nombre concret, une des trois parties attendues manquante (interventions
  relues / écarts / déjà bien tracé), ou un rapport anormalement court. Ne détecte que les dérives
  les plus grossières, comme pour THE-FINAL-JUDGE — jamais un jugement sur la justesse des écarts
  trouvés eux-mêmes.
- `rereadPerformance(indexText)` — KPI central, même vocation qu'HYPER-SCAN-CHECKPOINT : le succès
  de l'outil ne se mesure JAMAIS à « a-t-il tourné sans erreur » mais au taux réel de passages ayant
  confirmé au moins un écart — jamais un nombre de passages lancés, qui ne dit rien sur l'utilité
  réelle. Lit la colonne « Écarts trouvés » de `docs/suivi/relectures-lourdes/index.md`.

## Intégration dans le paysage d'outils (2026-09-20, complétée après un vrai oubli)

Trouvé en se relisant du point de vue de l'utilisateur (« est-ce qu'on a pensé à tout ? ») : les
trois raccordements que le projet exige déjà explicitement pour tout outil-agent (« un outil n'est
jamais fini tant que ses points d'intégration décidés ne sont pas câblés », cf.
`docs/regles-de-travail.md` §7ter) avaient été sautés à la création. Comblés le même jour :
- table maîtresse des outils (`docs/regles-de-travail.md`, sous `| Outil | Ce qu'il détecte`) ;
- menu PRESTATIONS de `scripts/le-coordinateur.mjs` ;
- section « Trois canaux de consultation pour THE-DEEP-READER » (même modèle que THE-FINAL-JUDGE,
  `docs/regles-de-travail.md`) — un seul destinataire pour l'instant (LE-PLANIFICATEUR), jamais
  sollicité par EL-PROFESSOR/ALWAYS-NEW-CODE, dont le périmètre ne recoupe pas le sien.

**Dette structurelle notée, pas corrigée maintenant** : `extractPersonaBlock()`/`detectGenericReport()`
de `scripts/the-deep-reader.mjs` reprennent une logique quasi identique à celles de
`scripts/the-final-judge.mjs`, jamais factorisées en un module partagé — une vraie question
ALWAYS-NEW-CODE, mise en queue plutôt que risquer une refactorisation de `the-final-judge.mjs`
(outil déjà testé et utilisé) dans la même session que sa création.

## Statut du blueprint — décision explicite, pas un oubli

Aucun blueprint générique séparé pour l'instant (contrairement à THE-FINAL-JUDGE) : cet outil est
étroitement lié au système de suivi propre à ce projet (LE-PLANIFICATEUR), pas encore assez détaché
pour justifier une forme réutilisable sur un autre projet — même raisonnement que LE-COORDINATEUR/
CIRCLE-TASKS, documentés directement sans blueprint (`docs/regles-de-travail.md` §7ter).
