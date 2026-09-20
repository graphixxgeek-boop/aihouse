# Système de suivi des tâches — surnommé « LE-PLANIFICATEUR »

*(Surnom donné le 2026-09-20, à la demande explicite de l'utilisateur, même convention que
LE-COORDINATEUR — plutôt que la piste mythologique MNÉMOSYNE proposée puis écartée. Ce système
rejoint ainsi Smart Breaker/ARGUS/HARMONIA/etc. comme "membre de l'équipe" nommé. Aucun changement
de fonctionnement : le nom technique des fichiers et des fonctions reste inchangé, comme pour tous
les autres outils déjà nommés de ce projet.)*

*(Créé le 2026-09-19, à la demande explicite de l'utilisateur : « je veux aussi que toutes les
tâches (toutes) soient historisées dans un dossier local, avec un fichier par session, et aussi un
fichier qui résume les grandes étapes et qui joue le rôle d'index [...] chaque tâche est flaggée
avec un horodatage, un sujet, un sous-sujet, un degré de sensibilité. » Extrait de
`docs/regles-de-travail.md` §10 — qui gardait la méthode générale d'interruption — le même jour, à
la demande explicite de l'utilisateur, une fois que ce sujet a dépassé la taille d'une simple
section : dossier dédié, fichiers par session, fichier d'index, taxonomie à 4 dimensions, exactement
le même seuil de complexité qui avait déjà justifié une séparation similaire pour le tableau de bord
KPI (`docs/referentiel/tableau-de-bord.md` + `tableau-de-bord-blueprint.md` + `kpi-index.md`). La
couche générique/réutilisable de ce principe reste dans `docs/philosophie-et-politique.md` §2.8 ; ce
document-ci est l'instanciation propre à ce projet, pas un patron générique séparé — jugé inutile
pour un sujet de méthode de travail, cf. la même question déjà tranchée pour "règles de suivi"
elle-même.)*

## Ce que ce système remplace

`docs/regles-de-travail.md` §10 documente toujours la MÉTHODE de traitement d'une interruption (les
trois cas : idée pour plus tard / question qui attend réponse / changement de cap immédiat) — ça ne
change pas. Ce document-ci ajoute la STRUCTURE DE STOCKAGE qui rend cette méthode traçable dans le
temps, au-delà de la liste de tâches technique de l'agent (dont la durabilité inter-session n'est
jamais garantie, cf. §10).

## Structure de fichiers

```
docs/suivi/
├── index.md                          — résumé des grandes étapes, index de recherche
└── sessions/
    ├── <identifiant-de-session>.md   — une tâche par ligne, un fichier par session
    └── ...
```

- **Un fichier par session** (`docs/suivi/sessions/<identifiant-de-session>.md`) : l'identifiant est
  celui de la session Claude Code en cours (visible dans les métadonnées de session) — jamais une
  date seule, puisque plusieurs sessions peuvent avoir lieu le même jour. Chaque ligne de ce fichier
  est une tâche, avec ses quatre attributs (ci-dessous).
- **`docs/suivi/index.md`** : un tableau qui résume, par grande étape (pas par tâche individuelle),
  ce qui s'est passé et pointe vers le fichier de session correspondant — sert à répondre vite à
  « dans quelle session ai-je traité tel sujet ? » sans avoir à rouvrir chaque fichier.

## Numérotation durable des tâches (2026-09-20)

*(Ajoutée à la demande explicite de l'utilisateur : « peux tu garantir l'execution de ce numérotage
dans le prolongement de celui actuel et jusqu'à nouvel ordre ? ». Distincte du gestionnaire de
tâches interne de Claude Code (`TaskCreate`/`TaskUpdate`, #1, #2...) — un aide-mémoire propre à la
session, jamais une source de vérité durable, cf. `docs/regles-de-travail.md` §B.1. Cette
numérotation-ci vit DANS les fichiers du projet et est vérifiée par un vrai test
(`scripts/check-suivi-fidelity.mjs::findTaskNumberIssues`), ce qui est la seule façon de vraiment
« garantir » une continuité au sens où l'utilisateur l'a demandé.)*

Chaque tâche reçoit désormais un cinquième attribut : un **N°** unique et strictement croissant,
en PREMIÈRE colonne du tableau (avant Horodatage). Les lignes créées avant le 2026-09-20 portent
`—` — jamais un numéro reconstruit après coup (même principe que la portée non rétroactive
ci-dessus : ne jamais fabriquer une fausse précision historique). La numérotation réelle démarre à
**117**, dans le prolongement direct du compteur de tâches de la session en cours au moment de
cette demande (`TaskCreate`/`TaskUpdate` en étaient à #116). `nextTaskNumber()` calcule toujours le
prochain numéro à utiliser (le plus grand numéro réel déjà présent, plus un, à travers TOUS les
fichiers de session) — jamais un compteur mental à tenir à jour à la main.

## Les quatre attributs de chaque tâche

*(Tranchés avec l'utilisateur le 2026-09-19, question par question — cf. le format de question
dédié de CLAUDE.md.)*

1. **Horodatage** — date + heure de création de la tâche (pas seulement la date).
2. **Sujet** — une liste FIXE, pour rester filtrable d'un coup d'œil (choix explicite de
   l'utilisateur : « liste fixe de sujets », plutôt que du texte libre qui s'allongerait sans
   fin) :
   - `Personnages / Esprit` — ton, registre, Article 0, dialogue.
   - `Enquête / Récit` — dossier retourné, indices, révélation.
   - `Simulation / Article 18` — exécutions de `full_sim*`, leur analyse.
   - `Smart Breaker` — résilience API Gemini (clés, modèles, quota).
   - `Tableau de bord / KPI` — familles, rapport, historique.
   - `Espace / Déplacements` — pièces, ancres, pathfinding.
   - `Temps / Jour-nuit` — horloge narrative, cycle jour/nuit.
   - `Interface / UI` — popups, boutons, affichage côté client.
   - `Documentation / Référentiel` — travail sur la doc seule, sans changement de comportement.
   - `Méthode de travail / Suivi` — règles de travail, ce système lui-même.
   - `Infrastructure / Outillage` — scripts, tests, git, build.
   - `Refonte graphique` — chantier à venir (visuel, mise en scène).
   Une tâche qui ne rentre dans aucune case va dans celle qui s'en rapproche le plus ; cette liste
   peut s'étendre si un sujet vraiment nouveau apparaît, mais reste stable par défaut.
3. **Sous-sujet** — texte libre court, précise le sujet fixe ci-dessus (ex. sujet `Smart Breaker`,
   sous-sujet « rotation de clés » ou « validation qualité GEMINI_FALLBACK_MODELS »).
4. **Degré de sensibilité** — à quel point une erreur sur cette tâche serait grave (tranché
   explicitement avec l'utilisateur : pas une échelle de confidentialité, une échelle de GRAVITÉ
   D'ERREUR) :
   - `critique` — une erreur ici pourrait égarer tout le projet ou abîmer l'esprit des personnages
     (Article 0), une donnée du tableau de bord faussée, un bug de charte.
   - `important` — une erreur ici serait significative mais localisée, récupérable sans remettre en
     cause l'ensemble.
   - `normal` — un ajustement mineur, une erreur ici serait sans grande conséquence.

## Fidélité au prompt — portée non rétroactive elle aussi

Les clôtures faites AVANT le 2026-09-19 (date d'introduction de cette exigence) gardent leur simple
`terminée` — jamais réécrites après coup avec un jugement de fidélité reconstruit de mémoire, même
si l'agent qui a fait le travail original s'en souvient encore : même principe que la portée
rétroactive générale ci-dessous, pour la même raison (`philosophie-et-politique.md` §1.9). Le
garde-fou mécanique (`scripts/check-suivi-fidelity.mjs`) les signale donc mais ce ne sont pas des
anomalies à corriger — seules les clôtures faites À PARTIR de cette date doivent respecter la règle.

## Portée rétroactive — décidée explicitement

*(Question posée et tranchée le 2026-09-19.)* Ce système démarre à partir de sa création, sans
reconstruire l'historique des tâches déjà terminées avant son existence (plusieurs dizaines à ce
jour) — ces tâches passées restent uniquement dans l'historique de conversation et dans les
documents de référence qu'elles ont produits, jamais reconstituées de mémoire dans ce nouveau
système au risque d'un détail approximatif présenté comme fiable (cf. philosophie-et-politique.md
§1.9 : une mesure douteuse affichée comme valide est pire qu'une absence de mesure).

## Procédure

0. **Automatique, jamais sur demande (2026-09-20, demande explicite et insistante de l'utilisateur :
   « le fait que j'intervienne dans la conversation doit AUTOMATIQUEMENT créer une tâche, je ne dois
   pas avoir à le demander à chaque fois [...] chacune de mes interventions : même une courte
   intervention, du moment que j'apporte une idée, l'idée ne doit jamais être perdue ».)** Dès qu'un
   message de l'utilisateur apporte une idée — une demande, une remarque, une question, une
   extension d'un chantier déjà ouvert — même courte, même arrivée en plein milieu d'un tour (un
   message "mid-turn" surfacé par l'outillage pendant que l'agent travaille encore sur autre chose),
   il reçoit sa ligne dans le fichier de la session en cours AVANT de reprendre le travail
   interrompu, jamais après coup et jamais seulement si l'utilisateur le redemande explicitement.
   Limite honnête, à ne jamais masquer (déjà connue, cf. l'entrée du 2026-09-19T23:42Z dans
   `docs/suivi/sessions/`) : aucun crochet technique ne peut se déclencher sur un simple message de
   chat — seul un commit git déclenche `pre-commit`/`post-commit`. La seule garantie réelle est donc
   la discipline de l'agent d'écrire la ligne au moment où l'idée arrive, pas un mécanisme externe
   qui verrait la conversation se dérouler. Un message qui ne fait que répondre à une question déjà
   posée par l'agent (ex. une réponse à `AskUserQuestion`) n'ouvre pas une ligne séparée — il vient
   compléter/clôturer la ligne de la question elle-même, même principe qu'au point 2 ci-dessous.
   **Précision non négociable (2026-09-20, écart réel trouvé : une famille KPI entière promise en
   réponse à une question de calibrage n'a jamais été construite, jamais détectée parce que
   "fusionnée" mentalement avec un correctif voisin mais distinct)** : quand une seule fenêtre de
   questions en pose PLUSIEURS distinctes (cf. Article 16, format de question de CLAUDE.md), la
   clôture doit traiter CHAQUE réponse individuellement — soit une ligne par réponse dès qu'elle
   arrive, soit, si elles restent groupées sur une ligne commune, un statut qui nomme explicitement
   l'état de CHAQUE sous-réponse (jamais un « terminée » global qui ne reflète que le sous-point le
   plus visible ou le plus proche d'un autre travail en cours). Un sous-point d'une réponse groupée
   qui n'a encore aucune trace de mise en œuvre reste explicitement `ouverte` pour CE sous-point,
   jamais silencieusement absorbé par la clôture des autres.
1. Dès qu'une tâche est créée (dans la liste de tâches technique de l'agent, cf.
   `docs/regles-de-travail.md` §10), elle reçoit aussi une ligne dans le fichier de la session en
   cours (`docs/suivi/sessions/<session>.md`), avec ses quatre attributs.
2. À la clôture d'une tâche, sa ligne est mise à jour (statut, pas une nouvelle ligne) — même
   principe que la liste de tâches technique : une idée précisée plusieurs fois met à jour la même
   entrée, jamais une nouvelle par précision. **Fidélité au prompt, obligatoire sans exception
   (2026-09-19, demande explicite de l'utilisateur : « est-ce que le système de suivi se pose la
   question : est-ce que les tâches ont bien été réalisées selon le prompt ? »)** : le statut d'une
   tâche fermée ne peut jamais rester un simple `terminée` — il doit toujours préciser
   `terminée — fidèle` (le résultat correspond exactement à ce qui avait été demandé) ou
   `terminée — écart : <description brève>` (un écart réel existe, même mineur, entre la demande et
   le résultat — jamais caché derrière un `terminée` silencieux). Ce n'est pas une nouveauté isolée :
   c'est la même exigence que le point 2 de la checklist qualitative d'HYPER-SCAN-CHECKPOINT
   (« reprendre chaque consigne explicite... confirmer qu'elle a été précisément et entièrement
   honorée »), rendue systématique pour CHAQUE tâche fermée, pas seulement lors d'un passage
   exceptionnel.
   **Une DÉCISION n'est jamais une EXÉCUTION (2026-09-20, écart réel trouvé : deux vraies décisions
   de calibrage prises au réveil de l'utilisateur — renforcer l'anti-répétition, vérifier la règle
   du jeu pour l'absence de dossier — ont été closes mentalement dès que l'approche a été choisie,
   jamais vérifié que le code correspondant avait réellement été écrit, noyées dans la cascade
   d'outillage qui a suivi).** Une ligne qui capture une réponse de calibrage (« quelle approche
   prendre ») ne peut être `terminée` que si le TRAVAIL RÉEL qu'elle décrit existe et est vérifiable
   (fichier modifié, test ajouté, commit identifiable) — jamais seulement parce qu'un choix a été
   fait entre plusieurs options proposées. Tant que ce travail n'existe pas, la ligne reste
   `ouverte`, même si la décision elle-même est ancienne et non ambiguë.
3. À la fin d'une session (ou à un point d'étape marquant), `docs/suivi/index.md` reçoit une ligne
   résumant la session (grandes étapes, pas chaque tâche individuelle) avec un lien vers le fichier
   complet.
4. Comme pour la liste de tâches technique (§10 de `regles-de-travail.md`), ce système reste un
   outil de travail interne consulté à la demande — jamais imposé en pièce jointe systématique,
   jamais affiché spontanément sans qu'on le demande.

## Conformité EXACTE à la forme demandée, jamais une approximation qui répond "à l'esprit"

*(Ajouté le 2026-09-20, écart réel trouvé par THE-DEEP-READER : un « état des lieux des tâches
avec l'arborescence détaillée » demandé explicitement a été livré sous forme de liste par statut
— terminé/en cours/ouvert — jamais la vraie vue arborescente par thème demandée. Sur le fond, la
demande semblait traitée ; sur la forme exacte, non. Demande explicite de l'utilisateur au moment
de le signaler : « assure-toi que ça ne se reproduise pas : une tâche doit toujours être exécutée
100% conforme avec ma demande ».)*

**Règle** : avant de considérer une tâche fermée, comparer la FORME exacte demandée (pas seulement
l'objectif général) à ce qui a été livré. Une réponse qui couvre le même sujet mais sous une forme
différente de celle explicitement demandée (une liste plate au lieu d'une arborescence, un résumé
au lieu d'une citation exacte, un chiffre agrégé au lieu du détail par élément) n'est PAS une
exécution conforme, même si elle est utile et pertinente sur le fond — elle reste `ouverte` ou
`terminée — écart : forme demandée non respectée`, jamais un `terminée — fidèle` silencieux.

**Différence avec les règles voisines déjà en place** : "une DÉCISION n'est jamais une EXÉCUTION"
protège contre l'absence totale de travail réel derrière un choix ; celle-ci protège un cran plus
loin — un vrai travail a été fait, mais sous une forme qui ne correspond pas à ce qui a été
explicitement demandé. Les deux se vérifient ensemble à la clôture d'une tâche, jamais l'une sans
l'autre.

## Interruptions mid-turn empilées — ne jamais perdre le fil de la tâche en cours

*(Ajouté le 2026-09-20, demande explicite de l'utilisateur : « je pense aussi que mes prompts
intempestifs perturbent la planification : trouve une solution fiable pour ça [...] mets à jour le
planificateur, le suivi, les outils dédiés ». Observation fondée sur cette session même : plusieurs
messages mid-turn empilés d'affilée pendant un travail déjà en cours — chacun a bien été loggé au
moment où il arrivait (point 0 ci-dessus), mais rien ne garantissait explicitement que la tâche
interrompue serait bien reprise ensuite, plutôt que silencieusement diluée dans la suite des
interruptions.)*

**Règle** : le point 0 ci-dessus (logger chaque intervention avant de reprendre le travail
interrompu) reste la première ligne de défense — elle ne change pas. S'y ajoute désormais une
étape explicite après avoir traité une interruption (ou une salve d'interruptions empilées) : dire
clairement quelle tâche était en cours avant l'interruption et si elle reprend maintenant ou reste
volontairement en attente — jamais laisser la reprise implicite, au risque qu'elle se perde dans le
flot des sujets suivants.

**Jamais un nouveau mécanisme construit pour ça** (anti-duplication, §7ter) : le garde-fou mécanique
existe déjà et suffit comme filet de rattrapage — `oldestOpenTaskDate()`
(`scripts/check-suivi-fidelity.mjs`, exposé par l'item CIRCLE-TASKS « tâche ouverte la plus
ancienne ») signale déjà depuis combien de temps la plus vieille ligne `en cours`/`ouverte` traîne.
Ce signal sert maintenant EXPLICITEMENT une deuxième fonction, jamais formalisée avant : détecter
une tâche interrompue par un prompt intempestif et jamais reprise, pas seulement du travail oublié
par manque de temps. Une CIRCLE-TASKS relancée régulièrement (déjà recommandé, cf. rappel
post-commit après 10 commits) reste donc le vrai filet de sécurité contre ce risque précis.

## Garde-fou mécanique — ne jamais compter sur le seul réflexe

*(Ajouté le 2026-09-19, demande explicite de l'utilisateur.)* Une règle de procédure peut s'oublier
avec le temps — `scripts/check-suivi-fidelity.mjs::findUnverifiedClosures()` relit chaque fichier de
session et signale toute ligne dont le statut commence par `terminée` sans jamais contenir `fidèle`
ni `écart` — une clôture qui a sauté l'étape ci-dessus. Gratuit, zéro appel API, intégré à la veille
hebdomadaire du réseau d'outils (`docs/regles-de-travail.md` §7ter) plutôt qu'un rappel séparé de
plus à retenir.

## Relecture intégrale de conversation — procédure exceptionnelle de rattrapage

*(Ajoutée le 2026-09-20, à la demande explicite de l'utilisateur, après que deux relectures
manuelles ponctuelles ce soir aient chacune trouvé de vrais écarts (interventions jamais tracées, ou
tracées comme une simple décision jamais suivie d'exécution) : « j'ai l'impression que des choses
sont encore oubliées. Mets en place un process pour ça [...] doit se déclencher sur demande ». Ce
garde-fou-ci ne remplace jamais la discipline "au fil de l'eau" du point 0 ci-dessus — il existe
justement parce que cette discipline peut échouer, et qu'il faut un filet de rattrapage.)*

**Trois niveaux, du gratuit au coûteux (2026-09-20, complété à la demande explicite de
l'utilisateur : « il n'y a pas une autre solution moins coûteuse ? »)** :
- **Étape 0, gratuite et mécanique** : avant même la procédure légère ci-dessous, comparer la
  liste de tâches technique de la session en cours (`TaskCreate`/`TaskUpdate`) avec les lignes de
  `docs/suivi/sessions/<session>.md` — toute tâche présente dans l'une et absente de l'autre est un
  écart détecté à coût nul. Limite honnête : ne rattrape que les idées déjà transformées en tâche
  technique ; une idée jamais formalisée en tâche n'y laisse aucune trace non plus — c'est pour ça
  que les deux niveaux suivants restent nécessaires.
- **Version légère (ci-dessous, procédure en 5 étapes)** : exécutée directement par l'agent qui
  pilote le projet, gratuite (pas d'agent séparé), à utiliser en premier dans l'immense majorité
  des cas.
- **Version lourde (THE-DEEP-READER)** : agent séparé réellement lancé, coûteuse (cf.
  `docs/referentiel/the-deep-reader.md` pour le mécanisme complet), réservée au cas où un regard
  vraiment neuf — non biaisé par la propre conviction de l'agent d'avoir déjà bien tracé — est
  nécessaire. Jamais un mode de THE-FINAL-JUDGE (règle d'entrée opposée), mais un cousin qui
  réutilise sa même mécanique de déclenchement et ses mêmes garde-fous de coût. Coût variable,
  jamais fixe (dépend du volume réel de conversation à relire) — deux conseillers obligatoires
  avant lancement (Smart Conso API + SMART-CONSO-TOKEN), encart ⚠️🔴, jamais coché par défaut dans
  CIRCLE-TASKS où elle apparaît désormais comme item périodique.

**Déclencheurs de la version légère, jamais automatique** (ce serait un coût réel à chaque tour, disproportionné — cf.
Article 3bis de CLAUDE.md, test d'utilité) :
1. L'utilisateur le demande explicitement (« relis toute la conversation », « vérifie que rien n'est
   oublié », ou tout équivalent).
2. L'agent lui-même remarque un signe concret d'un suivi probablement incomplet en travaillant sur
   autre chose (ex. une décision de calibrage ancienne sans ligne `terminée — fidèle` correspondante,
   un écart trouvé sur un sujet qui en révèle un autre voisin non traité) — proposé à l'utilisateur,
   jamais lancé sans un signal réel qui le justifie.

**Procédure, en 5 étapes :**
1. **Fixer la portée réelle de relecture** : toute la conversation en cours depuis son tout début —
   y compris, si la session a été compactée entre-temps, le résumé de compaction fourni dans le
   contexte (en particulier sa section qui liste les messages utilisateur verbatim, quand elle
   existe). Jamais seulement depuis le dernier point de contrôle ou la dernière tâche fermée.
2. **Extraire CHAQUE intervention utilisateur** qui porte une idée — une demande, une question, une
   remarque, même secondaire dans un message qui en contient plusieurs (cf. la précision du point 0
   ci-dessus sur les réponses groupées) — jamais seulement les messages qui ressemblent à une
   consigne formelle.
3. **Chercher la trace de chacune** dans `docs/suivi/sessions/<session>.md` (par mot-clé/sujet,
   jamais une simple impression de mémoire). Pour chaque trace trouvée, vérifier qu'elle reflète un
   TRAVAIL RÉEL vérifiable (fichier modifié, test ajouté, commit identifiable) — pas seulement
   qu'une décision a été prise (cf. le point 2 ci-dessus).
4. **Toute intervention sans trace, ou dont la trace ne couvre qu'une décision jamais exécutée**,
   reçoit une nouvelle tâche complète (liste de tâches technique + ligne `docs/suivi/`), avec tout
   le contexte nécessaire retrouvé dans la conversation — jamais une simple mention sans détail
   exploitable plus tard.
5. **Rapporter clairement le résultat à l'utilisateur** : combien d'interventions ont été relues,
   combien de vrais écarts ont été trouvés (avec leur détail), et confirmer explicitement ce qui
   était déjà bien tracé (pour ne jamais laisser croire que tout était perdu quand ce n'est pas le
   cas — cf. l'audit du 2026-09-20 où la plupart des chantiers en cours étaient correctement en
   file, pas oubliés).

**Limite honnête, à ne jamais masquer** : cette procédure dépend de ce qui est encore lisible dans le
contexte de la conversation (le résumé de compaction ne garde qu'un extrait, jamais l'intégralité
verbatim de tout ce qui a précédé) — une relecture ne peut donc jamais garantir à 100% qu'aucune
intervention plus ancienne n'a été perdue avant la première compaction. Dit honnêtement à
l'utilisateur si une portion de l'historique n'est plus accessible, jamais présenté comme un
rattrapage complet quand ce n'en est qu'un partiel.
