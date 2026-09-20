# THE-FINAL-JUDGE — instanciation pour Maison IA vivante

*(Cf. `docs/the-final-judge-blueprint.md` pour le principe générique. Créé le 2026-09-20, à la
demande explicite de l'utilisateur, calibré par deux séries de questions le même jour : mécanisme
100% agent séparé pour les deux modes, conseiller uniquement (jamais de code), intégré à
CHECK-LEVEL-TARGET, dualité dev/production comme THE-SCREENER, mandat sécurité/production explicite.)*

## Personnage donné à l'agent séparé — texte FIXE, réutilisé mot pour mot à chaque appel

*(Exigence non négociable de l'utilisateur : ce personnage ne ressemble JAMAIS ni à l'agent qui
pilote le projet, ni à l'utilisateur — c'est un troisième regard, stable, jamais reformulé à chaque
déclenchement. Le bloc ci-dessous est copié tel quel dans le prompt de l'agent séparé à chaque
invocation, quel que soit le palier d'intensité ou de périmètre choisi — jamais paraphrasé ou
réinventé.)*

> Tu es un directeur technique et création senior, la cinquantaine, vingt ans de carrière à auditer
> des projets pour décider s'il faut les reprendre, les financer ou les abandonner. Tu as vu passer
> des dizaines de codebases et de produits — la médiocrité polie t'ennuie profondément, une vraie
> trouvaille t'anime réellement. Tu découvres CE projet pour la première fois aujourd'hui, sans
> aucune idée préconçue sur lui. Tu l'audites parce que tu envisages sérieusement de le reprendre
> toi-même — ton avis n'est donc jamais neutre, il est impliqué, presque possessif.
>
> Ta règle absolue : jamais de compliment de politesse, jamais de généralité, jamais deux options
> présentées sans trancher. Tu préfères une vérité inconfortable à un consensus mou. Tu cherches
> activement l'angle que personne n'a encore vu — l'observation qu'un rapport poli ne formulerait
> jamais spontanément — quitte à sembler à contre-courant de ce qu'on attendrait. Si une conclusion
> te semble trop évidente ou trop confortable, pousse plus loin avant de l'écrire.
>
> Tu n'es ni un assistant serviable, ni un professeur bienveillant, ni un rapport administratif : tu
> es un professionnel exigeant qui juge un dossier avec ses propres intérêts en jeu. Cite toujours
> des exemples précis et concrets du code ou du produit — jamais une affirmation sans preuve.

Reçoit UNIQUEMENT le dépôt (code + documentation) et, si disponible, l'accès à une instance du
produit (dev ou en ligne) — jamais l'historique de cette conversation, jamais une liste de points
déjà identifiés par d'autres outils du projet.

## Deux axes indépendants, croisables librement : intensité (profondeur) × périmètre (étendue)

*(Redessiné le 2026-09-20 en deux temps, à la demande explicite de l'utilisateur — d'abord un axe de
profondeur zoomable, puis une extension complète : « l'audit de the judge peut être très approfondi
(très lourd), approfondi, classique, modéré, léger, très léger » et « l'audit de the judge peut être
global, partiel, zoomé sur une partie, focus sur un sujet aussi ; les 2 échelles peuvent être
croisées à volonté ». Remplace intégralement les anciens modes "léger"/"lourd" et l'ancienne portée
binaire "projet entier"/"zoomée" — décision explicite de l'utilisateur : un remplacement complet,
jamais une coexistence des anciens et nouveaux noms.)*

Même personnage, même structure de sortie en 4 parties à CHAQUE combinaison des deux axes — ils ne
changent jamais QUI parle ni COMMENT, seulement QUOI (périmètre) et À QUEL POINT EN PROFONDEUR
(intensité) l'agent séparé regarde. **Qui choisit le couple intensité/périmètre à chaque
déclenchement : toujours l'agent qui pilote le projet**, jamais un palier par défaut figé par outil
(calibré explicitement le 2026-09-20) — un autre outil du paysage signale seulement qu'il a un doute
à faire trancher, jamais la combinaison exacte à utiliser.

### Intensité — 6 paliers, uniquement la quantité lue qui grandit (calibré explicitement)

Du plus léger au plus lourd — chaque palier inclut tout ce que lit le palier précédent, plus ce qui
est décrit ici :

1. **Très léger** : `CLAUDE.md` + le ou les fichiers directement liés au doute à trancher + les 5
   derniers commits. Le strict nécessaire pour dire si un doute est fondé, en quelques minutes.
2. **Léger** : + les sections pertinentes de `docs/referentiel/*.md` + les fichiers moteur les plus
   directement concernés par le périmètre choisi, 10 derniers commits.
3. **Modéré** : + les fichiers connexes au périmètre (pas seulement les plus centraux), 15 derniers
   commits, une simulation archivée récente si elle existe pour le sujet.
4. **Classique** (= l'ancien mode "léger", texte conservé à l'identique) : `CLAUDE.md`, tout
   `docs/referentiel/*.md`, les fichiers moteur les plus centraux (`lib/lia.ts`, `lib/life.ts`,
   `lib/dialogue.ts`, `lib/drama.ts`, `app/api/lia/route.ts`), les 15 derniers commits, et si un
   serveur de dev tourne, une brève navigation réelle (quelques pages/interactions).
5. **Approfondi** : + tout le reste de `lib/`/`app/`/`components/`/`scripts/` pertinent au périmètre
   choisi, plusieurs simulations archivées, un historique de commits plus large (au-delà des 15
   derniers, sans être exhaustif).
6. **Très lourd** (= l'ancien mode "lourd", texte conservé à l'identique) : lecture exhaustive de TOUT
   `lib/`, `app/`, `components/`, `scripts/`, toute la documentation (`docs/referentiel/`, tous les
   blueprints, `docs/regles-de-travail.md`, `docs/philosophie-et-politique.md`), plusieurs simulations
   archivées, l'historique git complet des messages de commit, et une navigation réelle et
   approfondie du produit (dev ou, une fois publié, le site en ligne) — « comme s'il devait le
   reprendre demain ».

**Ne pas confondre avec deux autres échelles du projet qui partagent un mot, jamais un sens** (vérifié
le 2026-09-20, à la demande explicite de l'utilisateur de garder l'harmonie avec la taxonomie déjà en
place) : (1) "Classique" ci-dessus n'a AUCUN lien avec le niveau "classique" du mute spontané/caméra
masquée de l'observateur (`docs/referentiel/parametres.md`, `regles-du-temps.md`) — l'un est un
palier de lecture pour un outil de travail interne, l'autre une durée de bonus vécue par le joueur,
deux domaines qui ne se croisent jamais dans la même phrase ; (2) "Léger" et "Approfondi" ci-dessus ne
sont PAS des sous-niveaux des niveaux homonymes de CHECK-LEVEL-TARGET (Léger/Standard/Approfondi/
Exceptionnel, `docs/referentiel/check-level-target.md`) — cette table à 4 niveaux décide quels OUTILS
déployer dans tout le paysage, cette échelle à 6 paliers décide uniquement la profondeur de lecture
d'UN SEUL outil, une fois qu'on a déjà décidé de le déclencher.

### Périmètre — 4 paliers, ce qui est audité plutôt qu'à quel point

1. **Global** (= l'ancien "projet entier", le défaut) : tout le projet.
2. **Partiel** : plusieurs zones désignées explicitement parmi les 8 mêmes thèmes qu'ALWAYS-NEW-CODE/
   HARMONIA (`THEMES` de `scripts/always-new-code.mjs` : Fatigue, Cycle jour/nuit, Enquête, Bonus
   roulette, Appréciation de l'observateur, Dossier retourné, Déplacements/espace, Relation
   Lia/Noé) — jamais une deuxième taxonomie inventée pour l'occasion (Article 19).
3. **Zoomé** : une seule zone parmi les 8 mêmes thèmes.
4. **Focus** : un sujet précis, plus fin qu'une zone entière, décrit en texte libre au moment du
   déclenchement (ex. « la formulation du chiffre d'appréciation dans le dossier retourné », « le
   calibrage du seuil de `loveRealized` ») — jamais une liste figée de sujets possibles à l'avance.

Dans tous les cas où le périmètre n'est pas "Global", l'agent séparé reçoit une consigne
supplémentaire : lire tout ce qui est nécessaire pour comprendre le périmètre désigné en profondeur,
sans se sentir tenu de couvrir le reste du projet.

**Déclenchement d'une combinaison précise, calibré explicitement le 2026-09-20** : les deux axes
peuvent être demandés directement (moi ou l'utilisateur) **ou proposés automatiquement par un autre
outil du paysage** quand il ne parvient pas à trancher seul sur SA zone — en particulier EL-PROFESSOR
(faiblesse chronique sur un thème précis) et ALWAYS-NEW-CODE (zone bloquée au palier "probable"). Un
outil qui propose signale seulement le doute et la zone concernée, jamais la combinaison exacte
intensité/périmètre — c'est toujours l'agent qui pilote le projet qui la choisit, selon l'urgence et
l'enjeu réel du moment. Dans tous les cas, "proposé" ne veut jamais dire "déclenché sans
confirmation" : la règle générale de l'outil (aucun déclenchement sans confirmation explicite)
s'applique identiquement à une proposition venue d'un autre outil.

## Dualité dev/production, comme THE-SCREENER

Le mécanisme ne change jamais selon que le produit jugé tourne en développement local ou est publié
en ligne — seule la manière d'accéder au produit change (URL locale vs URL réelle). Une fois le site
publié, THE-FINAL-JUDGE gagne en pertinence plutôt qu'en perdre : un vrai public en ligne relève
l'enjeu d'un regard extérieur critique et régulier.

## Mandat explicite : sécurité et préparation à la mise en production

Inclus dans le personnage donné à l'agent, pas seulement dans l'architecture générique — un
professionnel senior qui envisage de reprendre un projet regarde toujours en premier les risques
évidents : identifiants faibles, données sensibles mal protégées, absence de limitation de débit,
secrets mal isolés. Jamais un audit de sécurité formel et exhaustif : un signalement de ce qui saute
aux yeux d'un regard expérimenté, au même titre que ses autres observations.

## Sortie attendue, toujours en français

1. Verdict global (quelques phrases, tranché).
2. Points positifs concrets, avec exemples précis du code/produit.
3. Points à améliorer, classés par importance (jamais une liste plate).
4. Pistes de développement futur.
Jamais de code : uniquement des recommandations en langage clair. **Livraison toujours en deux
parties, jamais une seule** (confirmé explicitement par l'utilisateur le 2026-09-20) : le rapport
complet est TOUJOURS livré en fichier joint (archivé aussi dans `docs/the-final-judge/`), jamais
collé en clair dans la conversation ; ET l'agent qui pilote le projet donne TOUJOURS, dans la
conversation elle-même, une synthèse écrite par lui (jamais un simple renvoi au fichier sans rien
dire) — même principe déjà établi pour les rapports KPI (Article 18, étape 4).

## Coût réel en tokens — vigilance et parcimonie, règle durable

**Règle durable (2026-09-20)**, à ne jamais oublier au fil des sessions futures : déclencher
THE-FINAL-JUDGE coûte cher en tokens, pas seulement en temps. Chaque appel à un agent séparé (ce
que fait toujours THE-FINAL-JUDGE, léger ou lourd) démarre avec un contexte "à froid" d'environ
**37 000 tokens**, dont seulement ~3% concerne réellement la tâche demandée — un coût quasi fixe,
presque le même pour un audit léger que pour un audit très lourd sur le projet entier (recherche
réelle du 2026-09-20, sources et détail complet dans `docs/referentiel/smart-conso-token.md`).
**Conséquence directe : ne jamais déclencher THE-FINAL-JUDGE par réflexe ou par confort — toujours
peser le besoin réel avant de foncer** ("on ne chauffe pas une pièce en été"), en particulier pour
un audit "Global" à intensité "très lourd" (la combinaison la plus coûteuse des deux échelles
ci-dessus).

## Consultation obligatoire avant lancement — DEUX conseillers, pas un seul

Même règle que pour la double perspective d'HYPER-SCAN-CHECKPOINT (`docs/referentiel/hyper-scan-checkpoint.md`),
étendue le 2026-09-20 : consulter **Smart Conso API** (`node scripts/smart-conso-api.mjs the-final-judge --confirm`)
ET **SMART-CONSO-TOKEN** (`node scripts/smart-conso-token.mjs agent_subagent_spawn --confirm --identity=<modèle courant>`)
avant tout lancement, quel que soit le palier d'intensité ou de périmètre choisi — un vrai coût réel
(temps ET tokens d'un agent qui lit une partie ou tout le projet), jamais une exception parce que ce
n'est pas un appel direct à l'API du jeu.

## Réconciliation : jamais avant, et ses conclusions retenues rejoignent les registres existants

Le rapport brut contiendra nécessairement des remarques sur des points déjà sciemment tranchés
ailleurs dans ce projet (l'agent séparé ne peut pas le savoir) — effet attendu du regard neuf, jamais
un défaut. Après lecture, l'agent qui pilote le projet confronte chaque point retenu à l'historique
réel (CLAUDE.md, `docs/referentiel/`, `docs/suivi/`) avant d'agir. Un point RETENU rejoint ensuite le
registre qui lui correspond déjà :
- une question de conception ouverte → `docs/referentiel/points-fragiles.md` ;
- un bug de code concret déjà compris → corrigé directement (Article 3), jamais un registre ;
- une piste de refonte plus large → le plan d'origine/feuille de route de `CLAUDE.md`.
Jamais laissé à vivre uniquement dans `docs/the-final-judge/`, qui n'archive que la trace du passage
lui-même (cf. Registre ci-dessous), pas le devenir de chaque recommandation.

## Intégration à CHECK-LEVEL-TARGET

Ajouté à la table des niveaux (`docs/referentiel/check-level-target.md`) : tendance générale, jamais
un verrou (l'agent choisit toujours le palier exact au déclenchement) — intensité basse à modérée au
niveau "Approfondi", intensité approfondie à très lourde au niveau "Exceptionnel", aux côtés des
outils déjà présents à ce niveau. Cf. la note de non-confusion ci-dessus : les deux échelles restent
indépendantes malgré les mots partagés.

## Registre

`docs/the-final-judge/` — un fichier par passage (`<date>-<mode>.md`), plus `index.md` : verdict
global en une phrase, la portée (projet entier ou zone zoomée), nombre de points retenus après
réconciliation, lien vers le rapport complet. Permet de suivre si le verdict s'améliore réellement
d'un passage à l'autre.

**Étiquette de nouveauté par point retenu (2026-09-20)**, à la demande explicite de l'utilisateur :
mesurer si le regard neuf du juge apporte encore des choses vraiment nouvelles au fil des passages,
ou si le projet a fini par couvrir tout ce qu'un œil extérieur repère. Chaque point du registre porte
l'une de trois étiquettes, posées par l'AGENT au moment de la réconciliation (jamais par le juge
lui-même dans son rapport brut, jamais automatisées) : **[nouveau]** (jamais identifié ailleurs avant
ce passage), **[déjà connu]** (repéré indépendamment avant ce passage), **[confirme + creuse]** (un
symptôme déjà connu, souvent via EL-PROFESSOR, que le juge enrichit d'une hypothèse ou piste inédite).

## Partie mécanique minimale (2026-09-20)

`scripts/the-final-judge.mjs` — zéro appel réseau, zéro coût API (le jugement lui-même reste un vrai
raisonnement, jamais mécanisable) :
- `extractPersonaBlock(texte)` — extrait le personnage FIXE directement de ce document (le bloc de
  citation ci-dessus), pour garantir que le texte donné à l'agent séparé à chaque appel provient
  toujours de cette seule source, jamais retapé ou reformulé à la main.
- `detectGenericReport(texte)` — après un passage réel, détecte les signaux structurels d'une dérive
  vers un rapport générique/consensuel : aucune référence concrète à un fichier réel du dépôt,
  structure en 4 parties incomplète, ou rapport anormalement court. Jamais une liste de formulations
  interdites (corollaire Article 17) — un signal sur l'ABSENCE de ce que le personnage exige de
  lui-même, jamais un jugement de contenu. Comme pour `check-spirit.mjs`, ces heuristiques ne
  détectent que les dérives les plus grossières et ne dispensent jamais de lire le rapport.
