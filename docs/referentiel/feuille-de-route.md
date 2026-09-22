# Plan d’origine (analyse Opus) et feuille de route

*(Extrait de CLAUDE.md le 2026-09-22 par ecotoken : ce contenu était rechargé à CHAQUE message alors
qu’il ne se consulte qu’au moment de planifier un chantier. Rien n’est supprimé ni résumé — le texte
ci-dessous est celui de la charte, mot pour mot. La charte garde un renvoi vers ce fichier.)*

`docs/contexte-projet/analyse-opus-initiale.txt` (décrit ci-dessus) proposait un plan en 7
chantiers, dans un ordre délibéré (chaque étape facilite la suivante). État vérifié dans le code
le 2026-09-16, pas seulement dans le référentiel qui se décrit lui-même :

1. Restructurer le référentiel en principes + paramètres — **fait**.
2. Séparer les deux cerveaux (un appel Gemini par personnage) — **fait**.
3. Rééquilibrer les besoins, rendre la relation réversible, recaler l'arc relationnel pour
   culminer après la révélation — **partiellement fait** : la réversibilité existe (une perte de
   confiance ou des rapprochements trop rapides font redescendre attirance et attachement, cf.
   `parametres.md`), mais le calage précis de l'arc relationnel par rapport à la révélation n'a
   pas été vérifié par une simulation réelle — à confirmer en jouant plusieurs sessions, pas
   seulement en lisant le code. **Chantier 3 investigué le 2026-09-21 (sans nouvelle simulation,
   comme demandé) : l'anomalie loveRealized diagnostiquée et corrigée.** Root-cause confirmée en
   relisant les 14 simulations archivées : un tour solo (pièces séparées) effaçait TOUTE variation
   d'attirance proposée par le modèle, cumulé au système de crédit de 28 % qui throttle déjà les
   tours ensemble — le seuil de 75 % n'avait donc jamais été franchi une seule fois depuis
   l'introduction de ce mécanisme (2026-09-18), y compris sur une session de 229 tours (full_sim16).
   Corrigé (`app/api/lia/route.ts`) : seule la moitié d'une hausse solo survit désormais (avant de
   repasser par le même crédit de 28 %) ; une baisse solo reste entièrement effacée. Reste à
   confirmer via une prochaine simulation réelle (`docs/simulations/correctifs-a-revalider.md`,
   0/2) — le calage précis de l'arc par rapport à la révélation reste donc toujours à vérifier en
   jouant, cette correction rend seulement la culmination structurellement possible.
4. Remplacer le visage emoji par une forme abstraite, désaturer la palette, ajouter une lumière
   directionnelle et une vignette — **largement fait, corrigé le 2026-09-19** (ce point affirmait
   à tort depuis sa rédaction que le visage restait un emoji — trouvé faux en vérifiant directement
   le code lors d'un audit de l'état des chantiers, exactement le genre d'écart doc/code que
   l'Article 13 est censé empêcher). Le visage emoji a en réalité été remplacé dès la **Version 40**
   (2026-09-17, cf. `lib/reference.ts`) par un visage vectoriel à paramètres, dessiné en temps réel
   depuis l'état émotionnel réel (`faceExpression()`, `lib/simulation.ts`) — le point qu'Opus jugeait
   le plus coûteux visuellement EST fait. La palette des sols est désaturée (`lib/perception.ts`,
   `scenePalette.floors`) et une lumière directionnelle chaude existe (`components/house-view.tsx`).
   Seule reste manquante : **aucune vignette sur la scène 3D**.
5. Passer en plein écran avec un mode Observation (3 jauges) par défaut et un mode Instruments
   (toutes les jauges) en option — **non fait**.
6. Mettre en scène la révélation finale (musique qui se coupe, caméra qui descend, panneaux qui
   se rétractent, anneaux qui se tournent vers l'observateur) — **non fait** : le déverrouillage
   du canal humain reste un changement de classe CSS sur le champ de saisie (`app/page.tsx`,
   `composer ... unlocked`), exactement ce qu'Opus décrivait comme insuffisant.
7. Mécaniques de diffusion (export de clips automatique, maison unique partagée) — **non
   commencé**, dernier de la liste par la propre priorisation d'Opus.

Ces trois derniers points (5, 6, 7) sont la couche « immersion/buzz » qu'Opus jugeait secondaire
à la refonte moteur — volontairement reportée pendant que la priorité allait au filet de sécurité
et à la cohérence charte/référentiel. Ils restent ouverts, pas oubliés.

**Feuille de route actée avec l'utilisateur le 2026-09-19** (audit complet des chantiers ouverts,
questions de calibrage explicites) : les points 4 (vignette restante), 5 et 6 ci-dessus forment
ensemble « la refonte graphique », un seul chantier visuel à mener groupé. Ordre convenu :
1. **Avant la refonte graphique** — chantier n°3 ci-dessus (arc relationnel Lia/Noé), y compris
   investiguer une anomalie repérée le même jour : `loveRealized` (doute amoureux privé, seuil 75 %
   d'attirance) est resté vide des deux côtés sur toute une simulation fraîche ayant pourtant
   dépassé la révélation (round 46) jusqu'au round 59 — l'attirance n'a peut-être jamais franchi ce
   seuil, à diagnostiquer avant de considérer le calage de l'arc confirmé.
2. **Tout de suite, indépendamment du planning** — **fait le 2026-09-19** : popup de saisie du
   pseudo avec validation de format + choix d'identité de genre (masculin/féminin) + popup de mise
   en garde légale renforcée + popup de bienvenue, les trois affichées une fois par navigateur
   (`app/page.tsx`) ; correction du vrai bug de répétition du mot « autant » (persisté sur toute la
   session via `life.wordFrequency`, cf. `lib/dialogue.ts` — l'écart n'était PAS déjà couvert,
   contrairement à ce qui était supposé ici avant investigation) ; rotation adaptative des clés
   Gemini (recul exponentiel automatique) ; **bouton « passer à la révélation »** — jamais mentionné
   dans les chantiers en suspens jusqu'à ce que l'utilisateur le signale explicitement le 2026-09-19,
   retrouvé nulle part dans l'historique malgré une recherche exhaustive de la session, donc
   entièrement respécifié via dix questions de calibrage puis implémenté et testé le même jour
   (`mode:"skip_to_revelation"`, cf. `docs/referentiel/principes.md` 8.21 et `parametres.md` pour le
   détail complet).
3. **Fait le 2026-09-19** — `docs/referentiel/regles-des-graphismes.md` créé, sur le modèle de
   `regles-du-temps.md`/`regles-de-l-espace.md`, en préparation directe de la refonte graphique.
   Calibré via trois séries de questions successives à la demande explicite de l'utilisateur
   (« pose moi plein de questions pour bien préparer tous les aspects »), après qu'un tout premier
   jet rédigé sans calibrage a été jugé insuffisant — jamais recommencé silencieusement à l'identique
   depuis. Décisions actées qui élargissent le périmètre au-delà des points 4/5/6 ci-dessous :
   caméra dynamique pendant le jeu normal (pas seulement fixe), transitions animées entre pièces,
   refonte de toute l'interface web autour de la scène 3D (pas seulement la maison), contraste
   jour/nuit visible dans l'éclairage, mode Observation (Faim/Fatigue/Incertitude d'humanité) et
   Instruments basculés à la barre espace (hors du champ de saisie, conflit de frappe déjà résolu),
   trottoir à l'identité visuelle propre, rendu des objets plus soigné (lumière/matières/ombres)
   avec un supplément de détail réservé aux seuls objets clés de l'enquête. **Hors périmètre,
   explicitement reporté mais signalé important et urgent vu la mise en ligne prochaine** :
   l'identité de marque du site (nom, nom de domaine, logo) — à reprendre avant la mise en ligne,
   pas oublié. Détail complet et à jour dans le document lui-même (Article 13).
4. **La refonte graphique** (points 4/5/6 groupés). **Exigence ajoutée le 2026-09-19** (retour
   utilisateur explicite sur un transcript réel, full_sim8) : `scenePalette` (`lib/perception.ts` —
   couleurs des sols, murs, motifs) existe déjà en données mais n'est actuellement JAMAIS transmise
   au modèle qui génère le dialogue — seul le rendu 3D (`components/house-view.tsx`) l'utilise. Les
   personnages ne décrivent donc presque jamais les couleurs réelles qui les entourent. À corriger
   dans le cadre de ce chantier (pas avant, car coder une description figée des couleurs ACTUELLES
   deviendrait fausse dès que la palette change avec la refonte) : le prompt doit lire
   dynamiquement `scenePalette` au moment de la génération, jamais une valeur codée en dur, pour que
   la description suive automatiquement tout changement de décor. Règle générale à vérifier en même
   temps, demandée explicitement : les personnages décrivent toujours le monde TEL QU'IL EST
   AFFICHÉ au moment présent, jamais une référence à un ancien décor ni à l'historique du code —
   condition de base de l'immersion, à re-vérifier après chaque changement visuel. **Ajouté le
   2026-09-19, trouvé par ARGUS puis confirmé avec l'utilisateur** : le bonus `trottoir` reste
   aujourd'hui un instant narré (la porte s'entrouvre deux secondes, résolu entièrement par une
   réplique instantanée, cf. `docs/referentiel/parametres.md`) — jamais une zone 3D pathable comme
   le jardin, décision déjà assumée par l'utilisateur (« on verra après »). À faire pendant ce
   chantier, pas avant : donner au trottoir une vraie géométrie marchable, cohérente avec le reste
   de la refonte plutôt que codée en dur avant que le décor final soit connu.
5. **Après la refonte graphique** — chantier n°7 (mécaniques de diffusion), dernier de la liste par
   la propre priorisation d'Opus, confirmée par l'utilisateur.
6. **Après la refonte graphique également** — revoir le texte de la popup de bienvenue (`app/page.tsx`, section
   `welcomeOpen`) : version actuelle volontairement provisoire, à retravailler une fois l'habillage
   visuel du jeu stabilisé plutôt que de la peaufiner avant un changement de decor qui pourrait la
   rendre obsolète.

