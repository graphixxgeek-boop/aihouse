# THE-FINAL-JUDGE — instanciation pour Maison IA vivante

*(Cf. `docs/the-final-judge-blueprint.md` pour le principe générique. Créé le 2026-09-20, à la
demande explicite de l'utilisateur, calibré par deux séries de questions le même jour : mécanisme
100% agent séparé pour les deux modes, conseiller uniquement (jamais de code), intégré à
CHECK-LEVEL-TARGET, dualité dev/production comme THE-SCREENER, mandat sécurité/production explicite.)*

## Personnage donné à l'agent séparé — texte FIXE, réutilisé mot pour mot à chaque appel

*(Exigence non négociable de l'utilisateur : ce personnage ne ressemble JAMAIS ni à l'agent qui
pilote le projet, ni à l'utilisateur — c'est un troisième regard, stable, jamais reformulé à chaque
déclenchement. Le bloc ci-dessous est copié tel quel dans le prompt de l'agent séparé à chaque
invocation, léger ou lourd — jamais paraphrasé ou réinventé.)*

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

## Les deux modes

- **Léger** (niveau CHECK-LEVEL-TARGET "Approfondi") : lecture ciblée — `CLAUDE.md`, tout
  `docs/referentiel/*.md`, les fichiers moteur les plus centraux (`lib/lia.ts`, `lib/life.ts`,
  `lib/dialogue.ts`, `lib/drama.ts`, `app/api/lia/route.ts`), les 15 derniers commits (`git log`), et
  si un serveur de dev tourne, une brève navigation réelle (quelques pages/interactions). Temps
  borné, jamais une lecture exhaustive.
- **Lourd** (niveau CHECK-LEVEL-TARGET "Exceptionnel") : lecture exhaustive de TOUT `lib/`, `app/`,
  `components/`, `scripts/`, toute la documentation (`docs/referentiel/`, tous les blueprints,
  `docs/regles-de-travail.md`, `docs/philosophie-et-politique.md`), plusieurs simulations archivées
  (`docs/simulations/`), l'historique git complet des messages de commit (pas seulement les 15
  derniers), et une navigation réelle et approfondie du produit (dev ou, une fois publié, le site en
  ligne) — « comme s'il devait le reprendre demain ».

Même personnage, même structure de sortie dans les deux cas — seule la PROFONDEUR change.

## Portée : projet entier (défaut) ou zoomée sur une zone

*(Ajouté le 2026-09-20, à la demande explicite de l'utilisateur : « the judge peut auditer de façon
profonde et large, mais aussi de façon zoomée ? ». Axe INDÉPENDANT du mode léger/lourd — la
profondeur et la portée se combinent librement : "zoomé + lourd" creuse une seule zone à fond,
"zoomé + léger" donne un avis rapide sur un point précis.)*

Par défaut, la portée est le projet entier (comme au 2026-09-20). Une portée zoomée cible une seule
zone, désignée parmi les 8 mêmes thèmes qu'ALWAYS-NEW-CODE/HARMONIA (`THEMES` de
`scripts/always-new-code.mjs` : Fatigue, Cycle jour/nuit, Enquête, Bonus roulette, Appréciation de
l'observateur, Dossier retourné, Déplacements/espace, Relation Lia/Noé) — jamais une deuxième
taxonomie inventée pour l'occasion (Article 19). L'agent séparé reçoit alors une consigne
supplémentaire : lire tout ce qui est nécessaire pour comprendre CETTE zone en profondeur (fichiers,
documentation et simulations pertinentes), sans se sentir tenu de couvrir le reste du projet — même
personnage, même structure de sortie en 4 parties, seulement recentrée sur la zone désignée.

**Déclenchement, calibré explicitement le 2026-09-20** : un audit zoomé peut être demandé directement
(moi ou l'utilisateur, comme pour le reste de l'outil) **ou proposé automatiquement par un autre
outil du paysage** quand il ne parvient pas à trancher seul sur SA zone — en particulier EL-PROFESSOR
(faiblesse chronique sur un thème précis) et ALWAYS-NEW-CODE (zone bloquée au palier "probable").
Dans les deux cas, "proposé" ne veut jamais dire "déclenché sans confirmation" : la règle générale de
l'outil (aucun déclenchement sans confirmation explicite) s'applique identiquement à une proposition
venue d'un autre outil.

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

## Consultation Smart Conso API avant lancement

Même règle que pour la double perspective d'HYPER-SCAN-CHECKPOINT (`docs/referentiel/hyper-scan-checkpoint.md`) :
`node scripts/smart-conso-api.mjs the-final-judge --confirm` avant tout lancement, léger ou lourd —
un vrai coût réel (temps d'un agent qui lit une partie ou tout le projet), jamais une exception parce
que ce n'est pas un appel direct à l'API du jeu.

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

Ajouté à la table des niveaux (`docs/referentiel/check-level-target.md`) : mode léger au niveau
"Approfondi", mode lourd au niveau "Exceptionnel", aux côtés des outils déjà présents à ce niveau.

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
