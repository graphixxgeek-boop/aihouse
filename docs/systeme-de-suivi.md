# Système de suivi des tâches

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

## Portée rétroactive — décidée explicitement

*(Question posée et tranchée le 2026-09-19.)* Ce système démarre à partir de sa création, sans
reconstruire l'historique des tâches déjà terminées avant son existence (plusieurs dizaines à ce
jour) — ces tâches passées restent uniquement dans l'historique de conversation et dans les
documents de référence qu'elles ont produits, jamais reconstituées de mémoire dans ce nouveau
système au risque d'un détail approximatif présenté comme fiable (cf. philosophie-et-politique.md
§1.9 : une mesure douteuse affichée comme valide est pire qu'une absence de mesure).

## Procédure

1. Dès qu'une tâche est créée (dans la liste de tâches technique de l'agent, cf.
   `docs/regles-de-travail.md` §10), elle reçoit aussi une ligne dans le fichier de la session en
   cours (`docs/suivi/sessions/<session>.md`), avec ses quatre attributs.
2. À la clôture d'une tâche, sa ligne est mise à jour (statut, pas une nouvelle ligne) — même
   principe que la liste de tâches technique : une idée précisée plusieurs fois met à jour la même
   entrée, jamais une nouvelle par précision.
3. À la fin d'une session (ou à un point d'étape marquant), `docs/suivi/index.md` reçoit une ligne
   résumant la session (grandes étapes, pas chaque tâche individuelle) avec un lien vers le fichier
   complet.
4. Comme pour la liste de tâches technique (§10 de `regles-de-travail.md`), ce système reste un
   outil de travail interne consulté à la demande — jamais imposé en pièce jointe systématique,
   jamais affiché spontanément sans qu'on le demande.
