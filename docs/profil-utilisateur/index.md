# Profil utilisateur — index des observations

*(Créé le 2026-09-19, à la demande explicite de l'utilisateur : « alimente la section qui traite de
mon profil psychologique dans les règles de travail [...] à chaque début de session, à chaque fois
que la session redémarre après avoir été compactée [...] crée un dossier local qui historise les
différents profils observés et pris en compte, avec un index [...] le but : lors de la mise à jour
de mon profil psychologique, tout l'historique est pris en compte pour refléter plus justement mon
vrai profil psychologique, et être capable de décrire ses variations possibles ». Voir
`docs/regles-de-travail.md` §9, sous-section « Historisation du profil », pour la procédure
complète. Ce dossier ne remplace jamais §8/§9 de ce document — il les NOURRIT : le résumé "officiel"
lu par tout agent reste dans `docs/regles-de-travail.md`, jamais dupliqué ici.)*

## Pourquoi ce système, et en quoi il est plus fiable que l'ancien

Avant ce jour, §8/§9 de `docs/regles-de-travail.md` étaient mis à jour directement, par réécriture,
à chaque fois qu'une observation semblait pertinente — sans jamais garder trace de CE QUI avait été
observé exactement, ni de QUAND, ni de si un trait donné s'était confirmé une ou dix fois. Un seul
moment isolé pouvait donc peser autant, dans le texte final, qu'un motif répété sur plusieurs
sessions. Ce dossier corrige ce point précis : chaque observation est datée, sourcée, classée
(nouveau / confirmation / nuance / contradiction par rapport à l'état déjà connu), et le résumé
officiel n'est réécrit qu'une fois qu'un motif réel se dégage de PLUSIEURS observations distinctes
— jamais sur la foi d'une seule (calibrage explicite du 2026-09-19).

## Structure

```
docs/profil-utilisateur/
├── index.md                      — ce fichier : table de toutes les observations + état du système
└── observations/
    ├── <horodatage-UTC>.md       — une fiche par déclenchement (reprise après compaction)
    └── ...
```

## Ce qu'une fiche d'observation contient

- La source exacte (résumé de compaction de quelle session, ou session directe si pas de
  compaction) et l'horodatage.
- Chaque signal extrait, avec un **extrait proche du texte original de l'utilisateur** comme preuve
  (décision explicite du 2026-09-19 : la précision prime sur la légèreté pour ce système précis).
- Une classification par rapport à l'état déjà connu (`docs/regles-de-travail.md` §8/§9 au moment de
  l'observation, ou l'observation la plus récente si elle est plus à jour) :
  - **Nouveau** — un signal qui n'apparaît nulle part encore dans le profil officiel.
  - **Confirmation** — un signal qui reproduit un trait déjà écrit, sans rien y changer.
  - **Nuance** — un signal qui précise ou étend un trait déjà écrit, sans le contredire.
  - **Contradiction** — un signal qui semble contredire un trait déjà écrit (le cas le plus rare et
    le plus important à ne jamais ignorer : un trait qui varie réellement dans le temps).
- Ce qui n'a délibérément pas été extrait (le contenu du projet lui-même n'est jamais un signal de
  profil, seule la manière de collaborer l'est).

## Règle de mise à jour du résumé officiel (§8/§9)

*(Calibrage explicite du 2026-09-19.)* Le texte de `docs/regles-de-travail.md` §8/§9 n'est réécrit
que lorsqu'au moins deux ou trois observations distinctes, à des moments différents, pointent dans
la même direction — jamais sur la base d'une seule fiche isolée. Un signal classé « Nouveau » ou
« Contradiction » reste donc en attente dans son fiche jusqu'à corroboration ; un signal
« Confirmation » n'a jamais besoin de déclencher de réécriture (il ne fait que renforcer ce qui est
déjà écrit). Quand une réécriture a bien lieu, la règle déjà existante de §8 s'applique
sans exception : informer l'utilisateur EN DÉTAIL (ce qui a été observé, ce que ça change dans le
texte) avant ou en même temps que la modification, jamais après coup en silence.

## Portée rétroactive — décidée explicitement, même principe que le reste du projet

Ce système démarre à partir de sa création (2026-09-19), sans reconstruire de fiches rétroactives
pour les sessions antérieures — leur contenu a déjà nourri §8/§9 directement avant que ce système
existe ; le reformuler après coup en fiches datées introduirait un faux degré de précision sur des
observations qui n'ont pas été enregistrées avec cette rigueur à l'époque (même principe que
`docs/systeme-de-suivi.md`, section « Portée rétroactive »).

## Table des observations

| Horodatage (UTC) | Source | Signaux nouveaux | Signaux confirmés/nuancés | Fiche |
|---|---|---|---|---|
| 2026-09-19T20:19:05Z | Session en cours (`session_0151JrVYzJ2bdCShaXhFAjLo`) — création du système lui-même | 2 (attachement transparent à une idée d'outillage tout en acceptant son abandon ; ton ludique/méta assumé en plein travail technique) | 3 (invitation active à proposer des règles ; réaction directe sans détour à un pépin technique ; préférence systématique pour être interrogé avant exécution) | [2026-09-19-2019.md](observations/2026-09-19-2019.md) |
| 2026-09-19T21:37:26Z | Reprise de la session en cours après compactage — déclenchée en retard, sur question directe de l'utilisateur | 4 (vérifie activement que les outils construits sont réellement exercés, pas seulement déclaratifs ; tolère le travail en parallèle sur une nouvelle demande sans vouloir perdre le fil de la tâche d'origine ; demande des explications pédagogiques réutilisables "au cas où" ; exige un suivi de progression régulier et chiffré) | 2 (invitation active à approfondir les questions de calibrage, confirmée et étendue à un second tour ; délégation ciblée d'une décision technique tout en gardant la main sur le cadrage général) | [2026-09-19-2137.md](observations/2026-09-19-2137.md) |
| 2026-09-20T03:21:22Z | Reprise de la session en cours après un nouveau compactage — déclenchée en retard, mais de la propre initiative de l'agent cette fois (pas sur demande directe) | 4 (repère lui-même les trous récurrents du système de travail, au niveau méta ; préfère garder la main sur l'exécution même pour un mécanisme qu'il souhaite regrouper/faciliter (case à cocher plutôt qu'un tout-en-un silencieux) ; interroge activement la robustesse d'un mécanisme déjà en place, sans incident déclencheur ; corrige avec précision une reformulation inexacte de l'agent, même sur un point secondaire) | 2 (signale une tension avec une règle déjà établie et accepte rapidement le compromis proposé une fois bien expliqué ; continue d'encourager explicitement la poursuite du travail sans interruption) | [2026-09-20-0321.md](observations/2026-09-20-0321.md) |
| 2026-09-20T14:20:00Z | Segment couvrant la création de THE-DEEP-READER et son intégration dans le paysage d'outils, via CIRCLE-TASKS relancé après un rappel post-commit longtemps ignoré | 5 (audite un outil qu'il vient d'approuver plutôt que de le considérer figé ; corrige la terminologie avec précision dès qu'une incohérence de convention apparaît ; demande des corrections généralisables plutôt que des correctifs ponctuels, explicitement nommées comme un apprentissage durable ; anticipe une classe d'erreur avant qu'elle ne se produise ; garde une place pour le ludique en plein travail technique dense) | 2 (choisit systématiquement « compléter maintenant » plutôt que reporter ; vérifie qu'une idée a bien été tracée plutôt que de supposer que oui) | [2026-09-20-1420.md](observations/2026-09-20-1420.md) |
| 2026-09-20T19:30:00Z | Segment couvrant l'enrichissement du process d'intégration (CASSANDRA-RH/checkAgentOnboarding), la disambiguïsation LE-COORDINATEUR/LE-PLANIFICATEUR, et l'invention du système de badge 🎖️ | 4 (invente un mécanisme et répond lui-même à la question technique qu'il anticipe avant qu'elle ne soit posée ; construit un système complet par couches successives cohérentes ; anticipe et corrige lui-même une confusion conceptuelle avec humour, non sollicité ; accepte une portée réduite pragmatique une fois le compromis expliqué) | 2 (continue d'empiler les prompts intempestifs en pleine tâche ; répond systématiquement « recommandé » une fois les enjeux bien expliqués) | [2026-09-20-1930.md](observations/2026-09-20-1930.md) |
| 2026-09-20T23:50:00Z | Segment couvrant la finalisation de recommendNextTasks(), deux vrais bugs de jeu corrigés (répétition full_sim16, dossier retourné), et la co-conception de l'organigramme CASSANDRA-RH/badge | 4 (pose lui-même la question d'utilité réelle d'une idée qu'il vient de proposer ; accepte sans la défendre une correction technique sur sa propre proposition, une fois la limite honnête expliquée, et va même plus loin que la version corrigée ; construit une métaphore organisationnelle complète et cohérente en une seule salve, humour et précision réunis ; vérifie explicitement qu'un signal technique répété n'a pas été oublié) | 2 (répond systématiquement « recommandé » une fois les enjeux bien expliqués ; empile les prompts intempestifs en pleine tâche) | [2026-09-20-2350.md](observations/2026-09-20-2350.md) |
| 2026-09-21T01:50:00Z | Segment couvrant le chantier 3 (diagnostic/correction loveRealized), deux vrais bugs de process CIRCLE-TASKS trouvés par l'utilisateur, et la co-conception du rôle de Doc-Report | 4 (interrompt une explication pour signaler une confusion sans la laisser polluer la suite ; rejette une proposition avec un contre-exemple concret puis délègue la resynthèse plutôt que de choisir entre des options insuffisantes ; repère un angle mort dans son propre système de vigilance existant, relie un point du jour à un outil déjà construit ; vérifie qu'une règle déjà écrite a bien été appliquée avant de l'accepter comme acquise) | 2 (repère lui-même un manquement de process sans attendre qu'il soit signalé, confirmé deux fois dans ce seul segment ; répond systématiquement « recommandé » une fois les enjeux bien expliqués) | [2026-09-21-0150.md](observations/2026-09-21-0150.md) |
| 2026-09-21T14:10:00Z | Segment couvrant la clôture de MEMENTO (tâche #169), la correction structurelle « Personnages hors de l'équipe », et le lancement de la Ronde périodique CIRCLE-TASKS | 4 (stress-teste sa propre proposition de correction juste après l'avoir formulée, avant même que l'agent ne la questionne ; nomme explicitement un motif récurrent avant de demander une correction ponctuelle ; corrige une préférence de forme par des impératifs brefs et répétés plutôt qu'une explication ; planifie une vérification future d'un système pas encore terminé plutôt que de le déclarer complet) | 2 (enrichit une conception non encore construite par petites touches réelles à travers plusieurs messages séparés ; répond systématiquement « recommandé » une fois les enjeux bien expliqués) | [2026-09-21-1410.md](observations/2026-09-21-1410.md) |
| 2026-09-22T00:05:00Z | Segment couvrant l'audit des tâches réellement ouvertes, le calibrage point par point de 4 idées en attente, la construction de CLONE-HUNTER v2, et la vérification croisée CIRCLE-TASKS/HYPER-SCAN-CHECKPOINT/LE-COORDINATEUR | 4 (rejette un format de question rigide sans abandonner la question elle-même ; interrompt une explication en cours pour lancer un nouveau sujet de conception connexe sans perdre le fil de l'original ; affine sa propre intuition à travers le dialogue plutôt que d'accepter la première réponse comme définitive ; distingue nettement valider une conception et autoriser sa construction) | 2 (redirige par impératifs brefs et répétés quand une tâche s'éternise, généralisé au séquencement des tâches ; répond systématiquement « recommandé » une fois les enjeux bien expliqués) | [2026-09-22-0005.md](observations/2026-09-22-0005.md) |
| 2026-09-22T01:15:00Z | Segment couvrant la finalisation de l'idée-à-trancher (3 bugs trouvés en direct), la promotion d'ALWAYS-NEW-CODE en 6e Gardien sacré, un message à 5 points (Niveau 1/2/3 de l'agence, discipline d'écriture des idées, audit d'harmonisation, CIRCLE-TASKS AUTO/PRIME/GOAT + périodicité), et l'exécution réelle de la première Ronde AUTO | 5 (fait confiance au test en conditions réelles plutôt qu'à la relecture seule pour valider un mécanisme neuf ; refuse qu'une réponse forcée dans les options proposées remplace une vraie question ouverte ; distingue explicitement une nouvelle règle générale d'une exception déjà actée, sans laisser l'une contaminer l'autre ; corrige ma proposition par défaut quand elle est trop prudente, en assumant le coût réel ; revient corriger un détail de comportement juste avant le lancement final, une fois qu'il visualise concrètement l'usage réel) | 2 (répond systématiquement « recommandé » une fois les enjeux bien expliqués ; distingue nettement valider une conception et autoriser sa construction) | [2026-09-22-0115.md](observations/2026-09-22-0115.md) |
| 2026-09-22T02:45:00Z | Segment couvrant la finalisation de circle-process-guardian, le protocole de changement de modèle IA, un message à 8 points, la correction d'une erreur de compréhension sur le point 3, la modernisation d'HYPER-SCAN-CHECKPOINT et son intégration dans CIRCLE-TASKS, le rôle à 2 niveaux de circle-process-guardian, et l'exécution de la Ronde AUTO sous Opus 5 | 4 (récupère la valeur d'une erreur de communication plutôt que de la faire annuler, en trois messages successifs ; conçoit un rôle d'outil en deux niveaux distincts plutôt qu'un seul ; remet en cause l'utilité d'une pratique installée sans la supposer acquise ni la condamner d'avance ; corrige une erreur de lecture en réaffirmant la règle générale plutôt que le seul cas précis) | 2 (redirige par impératifs brefs et répétés quand plusieurs fils avancent en parallèle, quatre fois dans ce seul segment ; répond systématiquement « recommandé » une fois les enjeux bien expliqués) | [2026-09-22-0245.md](observations/2026-09-22-0245.md) |
| 2026-09-25T14:14:00Z | Segment couvrant la nuit autonome du 2026-09-24/25 (clôture des huit constats THE-DEEP-READER, tâches #822 à #846) et la Ronde en paramètres recommandés qu'il a placée lui-même dans le déroulé du travail | 4 (place un rituel DANS le flux plutôt qu'à côté ; valide explicitement le RYTHME et non le résultat, ce qu'il ne fait presque jamais ; demande la VÉRIFICATION de la consigne de non-arrêt plutôt que la consigne elle-même ; ses messages raccourcissent quand le travail lui convient — l'inverse d'un désengagement) | 2 (ses décisions en attente ne bougent pas en son absence, nuancé : le coût n'est pas la question mais la période entière ; redirige par impératifs brefs plutôt que par explication) | [2026-09-25-1414.md](observations/2026-09-25-1414.md) |
