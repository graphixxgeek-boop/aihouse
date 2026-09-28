# circle-process-guardian — instanciation sur ce projet

*(Membre certifié depuis le 2026-09-26. Blueprint générique :
`docs/circle-process-guardian-blueprint.md`. Registre : `docs/circle-process-guardian/`.)*

## Son rang exact, à ne pas confondre

C'est un **contrôleur de process**, jamais un Gardien sacré du code (Article 20bis) : il surveille
le DÉROULÉ de la Ronde, pas la qualité du code. Le mot `process` dans son nom de fichier est là
pour ça, et c'est ce qui le distingue des sept.

## Ce qu'il fait

Il vérifie mécaniquement que la Ronde CIRCLE-TASKS a été suivie telle que
`docs/circle-process-detail.txt` la décrit — et il peut **bloquer un lancement**.

Quatre contrôles qui portent chacun une connaissance propre à ce projet :
- **la double communication** (`verifyDoubleCommunication`) — la Ronde s'ouvre et se clôt avec
  l'utilisateur, jamais dans le dos ;
- **la fraîcheur des rapports** (`hasFreshReportFile`) — un item marqué fait dont le fichier date
  d'avant la Ronde n'a pas été refait, il a été recopié ;
- **les étapes de clôture** (`ETAPES_DE_CLOTURE`) — la liste exacte, lue, jamais devinée ;
- **la répétition des signaux** (`tendanceDesSignauxDeRonde`) — un même constat qui revient trois
  Rondes de suite n'est plus un signal, c'est une décision qu'on évite.

## Le principe qui l'a construit, et qu'il ne faut pas casser

**JAMAIS un second calcul divergent.** Il réutilise `findOrphanReportFiles()`,
`findRegistriesMissingFromCircle()`, `CIRCLE_ITEMS` et `CIRCLE_REPORT_FOLDERS` déjà écrits. Un
contrôleur qui recalculerait ce qu'il contrôle finirait par contredire l'outil qu'il surveille — et
personne ne saurait lequel des deux croire.

## Comment on s'en sert

```
node scripts/circle-process-guardian.mjs
```

Gratuit. Il est consulté **au lancement de chaque Ronde** — c'est pourquoi il n'a pas d'item de
Ronde à lui : il se vérifierait lui-même.

## Un item COÛTEUX n'est pas un item muet (2026-09-28, tâche #726)

`tendanceDesSignauxDeRonde()` distingue désormais **quatre** états et non trois.

**LE FAUX ROUGE QU'IL PRODUISAIT** : `x-port-blindtest` était accusé de « n'avoir jamais écrit un
seul signal — son étape passe pour faite à chaque Ronde et rien ne l'atteste ». C'est exact, et
**c'est sa conception** : il porte `costly: true`, son étape 2 demande un agent séparé donc de vrais
tokens (Article 22), et il ne tourne **que** si l'utilisateur le coche explicitement.

**Lui reprocher son silence, c'est lui reprocher de respecter la règle qui le gouverne** — et c'est
une alerte qu'aucune action légitime ne peut éteindre, donc du décor (leçon L6).

| État | Ce qu'il veut dire |
|---|---|
| **coûteux, jamais coché** | il ne tourne que sur demande explicite : son silence est la règle |
| **dossier absent** | le dossier lui-même n'existe pas |
| **produit hors Ronde** | il écrit des rapports, mais aucun SIGNAL de Ronde |
| **jamais écrit** | le dossier ne contient que son index — le seul vrai manque |

**La liste des items coûteux se LIT dans `CIRCLE_ITEMS`** (`itemsCouteux()`), jamais recopiée : un
item coûteux de plus demain est reconnu sans qu'on y pense (Article 24).

**Mesuré** : 13 signalements → 12, écarts constatés sur le disque 3 → 2. Les deux restants
(`ouverture-barriere`, `record-run`) ne sont pas des défauts de code : `autoriseCloture()` exempte
déjà le mode autonome sans condition, et ils se déclenchent simplement parce qu'un lancement en
ligne de commande ne DÉCLARE pas ce mode — des faits de conversation, qui « se réparent en
déclarant, pas en corrigeant le process », comme le contrôleur de process le dit lui-même.

## L'alerte qui affirmait « depuis des semaines » sans le mesurer (2026-09-28, tâche #1097)

**Le palier le plus grave de la relance de Ronde disait** : « une trentaine de vérifications
gratuites dorment **depuis des semaines** ». Son seul déclencheur est un compte de **commits**.

**Le 2026-09-28, il l'a affirmé QUATRE HEURES après une Ronde réellement faite**, au terme d'une
journée à trente et un commits. L'heure de la dernière Ronde était pourtant stockée depuis toujours
par `recordCircleTasksRun()` (`lastRunAt`) — simplement **jamais lue**.

**C'est la même famille que les deux trouvailles précédentes du jour** : un signal **adjacent** (le
nombre de commits) présenté comme le signal visé (le temps écoulé), avec la donnée juste disponible
juste à côté.

**Ce qui ne change pas, et c'est délibéré** : le seuil reste en **commits**. Trente commits sans
Ronde méritent l'alerte quelle que soit l'heure — ce sont trente occasions où une vérification
aurait pu trouver quelque chose. Ce qui change est ce que l'alerte **dit d'elle-même** :

| Situation | Ce qu'elle dit maintenant |
|---|---|
| Ronde faite il y a 4 h | « 31 commits sans Ronde, **depuis 5 h** » |
| Ronde faite il y a 18 jours | « 31 commits sans Ronde, **depuis 18 jour(s)** » |
| Aucune heure stockée | « **depuis un temps que ce compteur ne mesure pas** » |

**Pourquoi ça compte plus qu'une formulation** : un garde-fou dont le palier le plus grave affirme
une chose fausse **le jour où il se déclenche** apprend à être ignoré tous les autres jours (L4) —
et celui-ci est le dernier rempart avant qu'une trentaine de vérifications gratuites ne dorment pour
de bon.

**Le palier déclaré a été corrigé aussi** : laisser la promesse fausse dans `RELANCE_PALIERS`
pendant qu'on la retire du message aurait déplacé le problème d'un cran, là où l'agent le lit tout
autant. Le filet vérifie les deux.
