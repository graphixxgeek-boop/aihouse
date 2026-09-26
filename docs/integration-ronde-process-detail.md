# Le process « intégration à la Ronde » — faire entrer un item dans le rythme périodique

*Sixième… non : HUITIÈME process déclaré (2026-09-23), aux côtés de la Ronde elle-même, de la
simulation, de la nuit autonome, du méta-process, de l'intégration d'un outil, du process XP-IA et
de l'état des tâches. Contrôleur : `scripts/circle-process-guardian.mjs`.*

## Ce que ce process existe pour empêcher

Un item rejoint la Ronde à moitié : il est dans la liste, mais son artefact n'a nulle part où
atterrir, ou son « pourquoi » n'est écrit nulle part. Les deux se paient plus tard et au mauvais
moment — le premier pendant une Ronde, au moment d'écrire réellement le rapport ; le second le jour
où quelqu'un se demande à quoi sert cet item et ne trouve plus personne pour le dire.

**Ce n'est pas une crainte théorique.** Huit items ont rejoint la Ronde sans leur « pourquoi », et
le garde-fou censé le signaler n'avait aucun appelant (voir plus bas).

## Son déclencheur

Un ÉVÉNEMENT, jamais un calendrier : on touche à `CIRCLE_ITEMS` — ajout, renommage ou retrait d'un
item. Le contrôleur se consulte AVANT ce geste ; consulté après, il ne fait plus que constater ce
qu'un test rouge aurait dit de toute façon.

## Pourquoi il est SÉPARÉ de l'intégration d'un outil

Demande explicite de l'utilisateur, en ces termes : « je veux un process propre pour intégration
d'un outil et un process séparé propre pour intégration à circle ».

**La preuve est arrivée le soir même où il l'a demandé.** En faisant entrer THE-EQUALIZER dans l'Agence,
`integration-outil` a annoncé « tous les registres renseignés » — et la suite de tests a refusé le
commit, parce qu'il manquait des raccordements que ce process-là ne connaît pas.

Les deux intégrations ne posent pas la même question :

| | Intégration à l'Agence | Intégration à la Ronde |
|---|---|---|
| **La question** | cet outil a-t-il un rang, des documents, une place dans l'équipe ? | cet item a-t-il une place dans un rythme périodique, avec ses tables satellites ? |
| **Ce qu'on inscrit** | 11 registres (fiabilité, catégorie, couverture, blueprint…) | 5 raccordements (item, thème, dossier, changelog, comptes) |
| **Contrôleur** | `scripts/integration-outil.mjs` | `scripts/circle-process-guardian.mjs` |
| **Peut exister sans l'autre** | oui — un Gardien sacré est volontairement HORS Ronde | oui — un item peut ne lancer aucun outil de l'Agence |

**Cette dernière ligne est la raison de fond.** Ce ne sont pas deux étapes d'une même arrivée : un
Gardien sacré est intégré à l'Agence et délibérément absent de la Ronde (il tourne déjà à chaque
commit), et un item de Ronde peut n'être le porte-voix d'aucun outil. Fusionner les deux process
aurait obligé chacun à porter les exceptions de l'autre.

## Les cinq raccordements

Ils ne sont pas théoriques : chacun est une chose qu'il a fallu faire **à la main** pour THE-EQUALIZER
alors qu'aucun outil ne la demandait.

Les quatre premiers se jouent dans `scripts/circle-tasks.mjs`, qui DÉFINIT la Ronde ; le cinquième
dans `scripts/check-house.mjs`. Le contrôleur, lui, ne définit rien — il compare.

1. **L'item** — une entrée dans `CIRCLE_ITEMS` (`scripts/circle-tasks.mjs`) avec son id, son thème,
   son libellé, son coût, ses tokens estimés et son `execute`.
2. **Le thème connu** — un thème déjà porté par au moins un autre item. Inventer une rubrique pour
   un seul item ajoute une case à cocher pour zéro clarté gagnée ; la décision est ancienne, elle se
   vérifie plutôt que de se rappeler.
3. **Le dossier de rapport** — une entrée dans `CIRCLE_REPORT_FOLDERS` si l'item promet un rapport,
   **ou** une dispense écrite dans `ITEMS_SANS_DOSSIER_ASSUME` (les deux dans
   `scripts/circle-tasks.mjs`, où `recordCircleItemReport` viendra chercher le dossier). Sans l'un des deux, l'erreur ne se
   révèle qu'en écrivant réellement l'artefact, c'est-à-dire pendant une Ronde, au pire moment.
   **Cette entrée fait plus qu'ouvrir un dossier** (précisé le 2026-09-23, dette documentaire
   signalée par god-of-all-process) : `tendanceDesSignauxDeRonde()`, dans
   `scripts/circle-process-guardian.mjs`, parcourt cette même table pour comparer les passages
   successifs et dire si un signal varie ou se répète à l'identique. Un item inscrit ici gagne donc
   cette surveillance sans qu'une seule ligne bouge ailleurs — c'était la condition du chantier :
   recopier les chemins un à un aurait créé la dette que l'Article 24 interdit, uniquement pour
   verdir un compteur. Le contrôleur DÉCLARE cette lecture (`LECTEUR_DE_TABLE`), parce qu'un accès
   dérivé d'une table ne se voit pas de l'extérieur et faisait compter ces dossiers comme écrits
   pour personne ; et la déclaration n'est jamais crue sur parole — data-archangel ne la crédite
   qu'après avoir vérifié que le fichier lit réellement le disque.
3bis. **Le registre confronté, quel que soit son CHEMIN** (ajouté le 2026-09-26, tâche #954, sur sa
   demande : « si un rapport est créé, que je demande qu'il soit dans circle, mais que ce n'est pas
   écrit dans les process : la règle va se perdre et le rapport ne sortira pas à circle »).
   `findRegistriesMissingFromCircle()` ne balayait que le disque, en ne retenant que les chemins de
   la forme `docs/<slug>/index.md`. **Trois registres déclarés par doc-report ne peuvent
   structurellement pas prendre cette forme** — `docs/referentiel/kpi-rapports/`,
   `docs/suivi/relectures-lourdes/`, `docs/ecotoken/ronde/` — et n'avaient donc JAMAIS été
   confrontés à la Ronde. Leur vert ne disait pas « couverts », il disait « pas regardés ».
   Il lit désormais AUSSI la liste **déclarée** des registres, quel que soit leur chemin, et
   rapproche par le **chemin** plutôt que par une ressemblance de nom : un registre qui EST le
   dossier de dépôt d'un item est couvert par cet item même si les deux slugs ne se ressemblent pas
   (cas réel : `ecotoken-ronde` ↔ item `ecotoken-scan`). Le balayage du disque reste, parce qu'un
   dossier créé sans être déclaré doit rester visible — **les deux sources se complètent, aucune ne
   remplace l'autre.**
   **Conséquence pour qui ajoute un rapport** : il n'y a plus de chemin « exotique » qui échappe au
   contrôle. Un rapport nouveau est soit porté par un item, soit déposé dans le dossier d'un item,
   soit exclu par écrit — et il n'existe plus de quatrième possibilité silencieuse.

4. **Le changelog** — une entrée dans `CIRCLE_ITEMS_CHANGELOG` disant POURQUOI cet item existe. Le
   pourquoi n'est déductible d'aucun diff : sans cette ligne, il est perdu le jour même.
   **Et il faut aussi vérifier que l'outil n'est pas DÉJÀ EXCLU de la Ronde** (ajouté le 2026-09-26,
   en ajoutant l'item `safe-export-kits`). `CIRCLE_AUTO_COVERED_REGISTRIES` peut déjà porter une
   ligne d'exclusion pour cet outil : si on ajoute l'item sans la retirer, deux tables se
   contredisent en silence, et c'est l'exclusion qui gagne à la lecture humaine. **Le cas réel, et
   c'est la leçon à emporter** : SAFE-EXPORT était exclu au motif « Gardien sacré (couche légère) :
   tourne à CHAQUE commit, jamais un item de Ronde ». Exact pour sa couche légère — raisons perdues,
   fuites de spécificité — et faux de tout le reste : la mesure des kits d'export ne tournait à aucun
   commit, et personne ne la réclamait jamais. **Une exclusion juste sur UNE couche d'un outil finit
   par le dispenser de TOUTES.** Avant d'écrire l'item, lire l'exclusion s'il y en a une, et la
   retirer ou la réécrire — jamais la laisser dire le contraire de ce qu'on vient de câbler.
5. **Les comptes figés** — deux assertions de `check-house.mjs` citent le nombre d'items. Elles
   refusent le commit, donc elles sont déjà protégées ; ce raccordement existe pour que le plan le
   DISE avant la première exécution rouge, plutôt qu'après.

## Comment on le consulte

```
node scripts/circle-process-guardian.mjs <id-de-l-item>
```

Lancé sans argument, le contrôleur rend quand même ses vérifications de maintenance (dérive des
tables satellites, comptes figés périmés, items sans leur pourquoi). Avec un id, il ajoute le plan
de raccordement de cet item — la même forme de sortie que `integration-outil`, délibérément : deux
process séparés, une même lecture, pour qu'un agent qui connaît l'un sache lire l'autre sans
réapprendre.

## Ce que ce process a déjà trouvé, dès sa construction

`findItemsMissingFromChangelog()` existait depuis le 2026-09-22, construit sur demande explicite
(« que process.circle soit là pour consigner ce changement »), avec le garde-fou mécanique que
l'Article 24 réclame. **Il n'avait aucun appelant.** Ni le `main()` de son propre fichier, ni
`check-house.mjs`, ni personne. Il a veillé dans le vide pendant que **huit items** rejoignaient la
Ronde sans leur « pourquoi » — dont deux ajoutés par l'agent lui-même dans les deux jours suivants.

Les huit lignes ont été écrites après coup, reconstituées depuis les commentaires réels et les
lignes de suivi, chacune déclarant qu'elle l'est. La valeur qu'on récupère ainsi est réelle ; celle
qui a été perdue entre-temps ne revient pas — c'est le coût exact d'un mécanisme qui n'atteint
personne (leçon L2).

**Détail qui vaut d'être retenu** : le scan des détecteurs muets (pure-gold-unity) ne l'a pas vu,
parce que son nom apparaissait dans un commentaire deux lignes au-dessus de sa déclaration, et
qu'une mention y compte comme un appel. Un détecteur muet peut donc se cacher derrière son propre
commentaire.

## Les maillons du schéma unifié, et ceux qui n'ont pas d'objet ici

`SCAN >> RAPPORTS >> ANALYSE >> PLAN D'ACTION >> QUESTIONS >> TÂCHES DE TRAVAIL`

Comme pour l'intégration d'un outil, ce process est une liste de cases à remplir, pas une enquête —
les maillons sans objet sont déclarés dans `PROCESSES` (`scripts/god-of-all-process.mjs`) avec leur
raison, jamais omis en silence.

## Ce qu'il NE fait pas

- **Il ne juge pas si l'item MÉRITE d'être dans la Ronde.** C'est une décision, souvent celle de
  l'utilisateur ; ce process ne s'occupe que du raccordement une fois la décision prise.
- **Il ne vérifie pas que l'item fonctionne** — que son `execute` fasse ce qu'il promet relève de
  la Ronde elle-même et des tests de l'outil concerné.
- **Il ne recouvre pas l'intégration à l'Agence** (`integration-outil`), et la tension entre les
  deux est résolue par la séparation elle-même : un Gardien sacré est intégré à l'Agence et
  volontairement absent de la Ronde ; un item de Ronde peut ne porter aucun outil de l'Agence.
- **Il ne bloque rien.** Comme god-of-all-process, il signale ; ce sont les tests de `check-house.mjs`
  qui refusent un commit, et seulement sur les deux points qu'ils savent vérifier.

## Une précision de voisinage, pour qu'une reprise ne s'y trompe pas

*(2026-09-24.)* `scripts/circle-process-guardian.mjs` héberge DEUX process : celui-ci (intégrer un
item à la Ronde) et le contrôle de la **clôture** de la Ronde elle-même
(`ETAPES_DE_CLOTURE`, `verifyClotureDeRonde()`, ajoutés le 2026-09-24 — décrits dans
`docs/circle-process-detail.txt`, section « LA CLÔTURE SE VÉRIFIE SUR LE DISQUE »).

**Les deux ne se touchent pas**, et le dire évite la confusion qu'un même fichier crée
naturellement : la clôture vérifie qu'une Ronde a livré ses huit étapes de fin ; l'intégration
vérifie qu'un item est raccordé à tous ses registres. Un item peut être parfaitement intégré dans
une Ronde qui se clôt mal, et l'inverse.

*(Cette note existe parce que god-of-all-process a signalé, à juste titre, un changement de
`circle-process-guardian.mjs` sans mise à jour de CE document. Le changement ne concernait pas ce
process — mais « il ne me concernait pas » est une affirmation qui doit être écrite quelque part
pour valoir quelque chose, sinon la prochaine IA refait l'enquête.)*
