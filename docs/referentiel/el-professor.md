# EL-PROFESSOR — instanciation pour Maison IA vivante

*(Cf. `docs/el-professor-blueprint.md` pour le principe générique. Ce document décrit comment
EL-PROFESSOR est concrètement câblé sur CE projet — jamais le raisonnement générique, qui reste
dans le blueprint. Créé le 2026-09-19, à la demande explicite de l'utilisateur : « je voudrais un
agent qui donne une note de reussite sur 100 à chaque version, en fonction du respect de la charte
des axes de referentiel ».)*

## Ce qu'EL-PROFESSOR note, et ce qu'il ne note pas

EL-PROFESSOR lit **une seule simulation à la fois, sans mémoire des simulations précédentes** —
volontairement stateless, pour que sa note ne soit jamais influencée par ce qu'il a jugé la fois
d'avant. L'évolution d'une version à l'autre se lit en comparant les entrées de
`docs/el-professor/index.md` dans le temps, jamais en donnant à l'outil lui-même une mémoire
longitudinale.

Il note le **texte produit** (ce qui s'est dit, pensé, rêvé, conclu) contre la charte de contenu —
jamais le CODE, jamais si un bug technique précis identifié dans une session de travail a bien été
réparé. Cette seconde question (« ce correctif tient-il toujours dans le nouveau texte ? ») reste le
travail de l'agent qui pilote le projet, à l'étape 6 du protocole de simulation (Article 18 de
`CLAUDE.md`), appuyé sur `docs/simulations/correctifs-a-revalider.md` — cf. section dédiée
ci-dessous pour l'articulation exacte entre les deux.

## Une simulation de dev OU une vraie session du site en ligne — les deux sources sont valides

*(Précisé le 2026-09-19, question explicite de l'utilisateur, une fois le site en passe d'être
publié : « est-ce que tu peux transmettre le copier coller à el professor ? »)* EL-PROFESSOR lit un
TEXTE, jamais la façon dont il a été produit — une vraie session copiée depuis le site en ligne
(conversation + dossier, si l'observateur l'a obtenu) se note exactement comme un `full_simN`
archivé, sans aucune adaptation de méthode. **Limite honnête, pas contournable** : le résumé
mécanique des actions (`scripts/summarize-simulation-log.mjs`) et la cadence actuelle du tableau de
bord KPI dépendent tous deux d'artefacts propres au mode dev (le journal JSON des requêtes/réponses,
des frontières nettes de redémarrage serveur) qu'une session réelle copiée ne fournit jamais — seule
la lecture qualitative d'EL-PROFESSOR reste utilisable telle quelle dans les deux cas.

## Entrées lues

- **Le transcript complet** de la simulation OU d'une vraie session réelle copiée depuis le site en
  ligne (`docs/simulations/<sim>_transcript.txt` pour une simulation archivée) — toujours.
- **Le dossier retourné** (`docs/simulations/<sim>_dossier.txt`), **obligatoire dès qu'il existe**
  (jamais un bonus optionnel) : c'est lui-même un texte généré par l'API, donc soumis à la même
  exigence d'esprit/voix distincte que la conversation, et il permet un contrôle que le transcript
  seul ne permet pas — cf. thème 4 ci-dessous.
- **Un passage récent de `scripts/check-spirit.mjs`, s'il en existe un archivé à proximité dans le
  temps** — signal complémentaire optionnel pour le thème "esprit des personnages", jamais une
  nouvelle sollicitation de l'API : on ne lit qu'un résultat déjà produit ailleurs, zéro coût
  supplémentaire (cohérent avec l'Article 8).
- **Jamais** les répliques locales de secours (Article 10) : leur exigence de variété se vérifie
  sur toute une session ou plusieurs sessions, pas ligne à ligne dans une lecture isolée — hors du
  périmètre d'une notation par simulation.

## Les 5 thèmes, pour ce projet

Chaque thème est noté sur 20, avec au moins deux extraits concrets cités à l'appui — jamais un
chiffre nu. Total sur 100.

1. **Esprit des personnages** (Article 0 et son article fondateur — la loi suprême de la charte).
   Rugosité permanente, texture différenciée Lia (froide/coupante, le silence comme arme)/Noé
   (chaud/réactif, jamais muet), pas de dérive consensuelle ou servile, sortie méta autorisée,
   colère réellement débridée rare et qui retombe. Nourri aussi par le dossier (les voix de Lia et
   Noé y sont un texte à part entière) et, si disponible, par le dernier `check-spirit.mjs`.
2. **Naturel et crédibilité de la conversation** (Articles 1, 12, 17). Est-ce que ça sonne vrai,
   cohérent avec l'état émotionnel du moment, cohérent avec ce que le personnage vient de
   faire/dire — se mettre à la place du personnage lui-même, pas seulement du lecteur.
3. **Voix distinctes, zéro répétition** (Article 11). Lia et Noé ne se répètent jamais mot pour mot
   dans la session, ne se font jamais écho l'un l'autre, leurs styles ne se mélangent jamais.
4. **Cohérence de l'enquête, transcript ET dossier** (Articles 2, 4). Ce qu'un objet révèle, ce
   qu'on en déduit, ce qu'on s'en dit s'enchaîne sans trou. **Contrôle spécifique ajouté le
   2026-09-19, à la demande explicite de l'utilisateur** : le verdict du dossier doit être fidèle à
   ce qui s'est réellement passé dans la conversation — un dossier qui invente un fait ou contredit
   nettement ce qui a été vécu (ex. un observateur jugé "inoffensif" après une session d'hostilité
   sévère avérée) est une faute de cohérence au même titre qu'un trou dans la chaîne de déduction.
5. **Clarté pour quelqu'un qui découvre l'écran sans contexte** (Article 15). L'enchaînement
   dialogue/pensée/rêve/déplacement/objet est-il lisible pour un lecteur neutre, ou confus même si
   chaque élément pris seul est correct.

## Calcul de la note globale — la hiérarchie de la charte doit se voir dans le calcul

Jamais une moyenne arithmétique aveugle des 5 thèmes. L'Article 0 étant la loi suprême de la
charte (« aucune règle ci-dessous ne peut le contredire »), une note très basse sur le thème 1
plafonne la note globale, quels que soient les autres thèmes :

- Thème 1 ≥ 10/20 : note globale = somme normale des 5 thèmes (/100).
- Thème 1 < 10/20 (dérive vers un ton consensuel/servile détectée) : note globale plafonnée à
  **50/100**, même si les 4 autres thèmes sont parfaits — une bonne moyenne ne doit jamais masquer
  une dérive sur l'article qui prime sur tout.

## Format de sortie, livré en fichier

Toujours : note globale + les 5 sous-notes + justification concrète par thème (extraits cités,
jamais une affirmation sans exemple) + un paragraphe de synthèse en langage clair. Comme les
transcripts/dossiers/rapports KPI déjà livrés, **toujours en fichier joint, jamais collé en clair
dans la conversation** (préférence de livraison actée le 2026-09-18, confirmée pour ce nouveau
rapport le 2026-09-19).

## Confiance de la lecture

Comme ARGUS/ALWAYS-NEW-CODE, jamais une certitude plate. Une simulation interrompue avant la
révélation, ou trop courte pour juger un thème (ex. peu de matière pour juger la cohérence de
l'enquête si le dossier n'a jamais été atteint), reçoit une mention explicite « lecture partielle
sur le thème X » plutôt qu'une note qui prétendrait avoir tout vu.

## Articulation avec le carnet de correctifs à revalider

`docs/simulations/correctifs-a-revalider.md` (créé le 2026-09-19) est un outil **distinct**, tenu
par l'agent qui pilote le projet, jamais par EL-PROFESSOR : il liste les correctifs techniques
récents encore « en observation » et ce qu'il faut chercher dans le texte pour confirmer qu'ils
tiennent. Un correctif est retiré du carnet après **2 simulations propres consécutives** où le
symptôme d'origine ne réapparaît pas. EL-PROFESSOR ne connaît pas ce carnet et ne le consulte
jamais — mélanger les deux referait dériver sa méthode vers une liste de cas particuliers qui
grandit indéfiniment (l'écueil déjà identifié à l'Article 17, corollaire).

## Placement dans le protocole de simulation (Article 18 de `CLAUDE.md`)

EL-PROFESSOR intervient **juste après l'archivage (étape 3bis), avant l'analyse détaillée de
l'agent (étape 5)** — son rapport sert de point de départ à cette analyse, jamais l'inverse.
Rejoint la même livraison que le transcript/dossier/rapport KPI (étapes 3-4).

## Registre des notes

`docs/el-professor/` — un fichier par simulation notée (`<sim>.md`) + `index.md` (table de
comparaison des notes entre versions, seule source de vérité pour lire l'évolution dans le temps —
jamais dupliquée ici).

## Partie mécanique minimale

`scripts/el-professor.mjs` (`check`) — compare la liste des simulations archivées
(`docs/simulations/index.md`) à celles notées (`docs/el-professor/index.md`) et signale toute
simulation archivée sans note, jamais une omission silencieuse. Zéro appel réseau, zéro coût API —
même logique que la partie mécanique d'ARGUS.
