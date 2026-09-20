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
3. À la fin d'une session (ou à un point d'étape marquant), `docs/suivi/index.md` reçoit une ligne
   résumant la session (grandes étapes, pas chaque tâche individuelle) avec un lien vers le fichier
   complet.
4. Comme pour la liste de tâches technique (§10 de `regles-de-travail.md`), ce système reste un
   outil de travail interne consulté à la demande — jamais imposé en pièce jointe systématique,
   jamais affiché spontanément sans qu'on le demande.

## Garde-fou mécanique — ne jamais compter sur le seul réflexe

*(Ajouté le 2026-09-19, demande explicite de l'utilisateur.)* Une règle de procédure peut s'oublier
avec le temps — `scripts/check-suivi-fidelity.mjs::findUnverifiedClosures()` relit chaque fichier de
session et signale toute ligne dont le statut commence par `terminée` sans jamais contenir `fidèle`
ni `écart` — une clôture qui a sauté l'étape ci-dessus. Gratuit, zéro appel API, intégré à la veille
hebdomadaire du réseau d'outils (`docs/regles-de-travail.md` §7ter) plutôt qu'un rappel séparé de
plus à retenir.
