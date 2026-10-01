# CIRCLE-TASKS — fiche d'instanciation

*(Plan générique réutilisable ailleurs : `docs/circle-tasks-blueprint.md`. Cette fiche-ci dit ce que l'outil est devenu SUR CE PROJET ; le blueprint dit comment le remonter sur un autre.)*

## Ce qu'il sert ici

`scripts/circle-tasks.mjs` (2 295 lignes au 2026-09-26) : il DÉFINIT la Ronde — **38 entrées**, dont
2 coûteuses (THE-FINAL-JUDGE et son cousin THE-DEEP-READER, toujours signalées en rouge avec leur
coût réel) et 36 gratuites.

## Pourquoi il existe dans CE projet

Le paysage compte près de quatre-vingts outils, dont une majorité rendent un verdict gratuit que
personne ne réclamait jamais. La bannière post-commit le mesure sans détour : au 2026-09-26,
**32 commits sans Ronde** — « à ce stade ce n'est plus un retard, c'est un constat ».

## Les tables, et qui les garde

| Table | Ce qu'elle porte | Son garde-fou |
|---|---|---|
| `CIRCLE_ITEMS` | les 38 entrées | les deux comptes figés de `check-house.mjs` |
| `CIRCLE_REPORT_FOLDERS` | où chaque artefact atterrit | `findItemsPromisingReportWithoutFolder()` et `findFoldersWithoutItem()`, dans les deux sens |
| `ITEMS_SANS_DOSSIER_ASSUME` | les 4 entrées sans artefact texte, avec leur raison | — |
| `CIRCLE_AUTO_COVERED_REGISTRIES` | les registres couverts autrement, avec leur raison | `findRegistriesMissingFromCircle()` |
| `CIRCLE_PROMISED_FILES` | les fichiers que la documentation promet | `findPromisedFilesMissing()` |
| `VERROUS_D_OUVERTURE` | les 3 défauts qui rendent une Ronde mensongère | `findVerrousActifs()` |

Le POURQUOI de chaque entrée vit dans `CIRCLE_ITEMS_CHANGELOG` (`circle-process-guardian.mjs`), pas
ici — et `findItemsMissingFromChangelog()` refuse une entrée sans son motif.

## Ce que ce dispositif a réellement trouvé

- **14 entrées sur 32** promettaient un rapport sans qu'aucun dossier ne les attende. Découvert en
  écrivant, pour la première fois, les artefacts d'une Ronde réelle : 10 des 26 entrées exécutées ont
  levé « aucun dossier connu ». Rien ne comparait les deux tables.
- **`findItemsMissingFromChangelog()` n'avait AUCUN appelant** pendant que huit entrées rejoignaient
  la Ronde sans leur pourquoi — dont deux ajoutées par l'agent lui-même dans les deux jours suivants.
- **Trois registres déclarés ne pouvaient structurellement pas être vus** par le garde-fou, qui ne
  retenait que les chemins `docs/<slug>/index.md`. Leur vert ne disait pas « couverts », il disait
  « pas regardés ».
- **Une exclusion vraie d'UNE couche en dispensait TOUTES** : SAFE-EXPORT était exclu au motif de sa
  couche légère, et la mesure de ses kits d'export n'était donc surveillée par personne (2026-09-26).

## Sa décision de calibrage, tranchée par l'utilisateur

**« Bloquer la Ronde, pas le commit. »** Les verrous refusent l'ouverture, jamais un commit sans
rapport avec le défaut. Un verrou qui ne peut pas mesurer, ou dont la sonde explose, ne bloque
jamais — il le dit fort. Une ouverture refusée n'écrit rien du tout.

## Pourquoi il n'a PAS d'entrée à lui dans la Ronde

Il EST la Ronde. Une entrée lui demandant de se vérifier serait circulaire — et ce n'est pas un jeu
de mots : c'est `circle-process-guardian`, un **contrôleur de process** extérieur, qui juge son
déroulé, précisément parce qu'un juge et son sujet ne peuvent pas être le même fichier.

## Sa limite ici

Il dit ce qui dort et depuis quand ; il ne juge ni la qualité d'un passage, ni si le résultat a été
lu. C'est `circle-process-guardian` pour le déroulé, et `god-of-all-process` pour la discipline
d'exécution — jamais lui.

## LES DIX QUESTIONS D'ALIGNEMENT EN FIN DE RONDE (2026-09-27, tâche #769)

**Sa demande, mot pour mot** : « je veux qu'à chaque ronde, à la fin, il y ait un moment où tu me
poses 10 questions d'alignement de la compréhension aux 2 extrémités : **5 sur le fond**, pour être
sûr de ma réponse à l'avance (en cas d'écart : problème grave), **5 sur des points de détail**, des
frontières obscures. »

**LA FINESSE DU DISPOSITIF EST DANS SON ASYMÉTRIE, et elle est voulue.** Les deux moitiés ne mesurent
pas la même chose et ne se lisent pas de la même façon :

- les **5 questions DE FOND** ne servent PAS à apprendre. L'agent doit connaître la réponse à
  l'avance, et **un écart y est un PROBLÈME GRAVE** : le signal que les deux modèles du projet ont
  divergé sans que personne le voie ;
- les **5 questions DE DÉTAIL** servent l'inverse : les frontières floues, ce qui n'a jamais été
  tranché. **Y apprendre quelque chose est normal.**

**LE MÉCANISME QUI REND L'ÉCART MESURABLE, et sans lui tout le dispositif est décoratif : la
prédiction s'écrit AVANT la réponse.** Une question de fond posée sans prédiction engagée par écrit
ne produit aucun écart lisible — on relira sa réponse en se disant « c'est bien ce que je pensais »,
et c'est exactement ce que cette tâche existe pour empêcher. Le registre de l'outil — le fichier `alignement.json` de son dossier, **créé au premier alignement et
absent tant qu'aucun n'a eu lieu** — se remplit donc **en deux temps**, et le second refuse de
toucher au premier.

**UNE QUESTION DE DÉTAIL NE PORTE PAS DE PRÉDICTION, et c'est un refus, pas un oubli** : si la
réponse est prévisible, ce n'est pas une frontière obscure — c'est une question de fond mal
étiquetée, et la ranger du mauvais côté ferait disparaître un écart grave dans la moitié où l'on
apprend.

**Les quatre pièces.** `validerAlignement()` refuse une série mal formée (nature inconnue, question
vide, question de fond sans prédiction, question de détail AVEC prédiction).
`mesurerEcartsDAlignement()` compte les écarts — **et l'écart est DÉCLARÉ par l'utilisateur, jamais
deviné par comparaison de texte** : deux phrases peuvent dire la même chose sans partager un mot, et
l'inverse ; une mécanique qui trancherait ici rendrait le verdict le moins fiable du dispositif sur
la moitié la plus grave. Sans réponses enregistrées, elle rend `mesurable: false` — « zéro écart »
ressemblerait trait pour trait à un alignement parfait (leçon L11). `enregistrerAlignement()` écrit
le registre, et `depuisQuand()` rend la phrase d'âge qui accompagne un compte **sans affirmer plus
que ce qui est mesuré**.

`formatAlignementLines()` rend la série lisible : les fautes de forme s'il y en a, les écarts graves
un par un (question, prédiction, réponse réelle), et le refus explicite quand rien n'a encore été
répondu.

## `outilsAyantTourneDepuis()` — l'alerte affirmait que rien n'avait tourné, et 37 outils avaient tourné *(2026-10-01, tâche #1395)*

**Deux jours après lui avoir retiré « depuis des semaines », le MÊME palier le plus grave affirmait
encore autre chose.** Déclenché pour de vrai sur 32 commits d'une nuit autonome, il disait : *« une
trentaine de vérifications gratuites n'ont rien vu passer de ces 32 commits, et personne ne sait ce
qu'elles auraient trouvé entre-temps. »* **Le journal d'usage le démentait au moment même : 37
outils avaient tourné depuis la dernière Ronde**, dont les huit Gardiens relancés à froid.

**Même fichier, même palier, même famille** (leçon L47) : un signal ADJACENT — « aucune Ronde » —
lu comme le signal visé — « aucune vérification ». La correction du 2026-09-28 traitait le TEMPS ;
celle-ci traite ce que l'alerte prétend savoir de l'**ACTIVITÉ**.

**Et le commentaire posé juste au-dessus de la fonction l'interdisait déjà** : « un garde-fou dont
le palier le plus grave affirme une chose fausse le jour où il se déclenche apprend à être ignoré
les autres jours » (L4). La règle était écrite ; le code ne la tenait pas.

**Il n'est pas adouci, il est RECENTRÉ** (leçon L5 : distinguer « je n'ai rien trouvé » de « je n'ai
pas pu regarder »). Le seuil, le palier et la gravité ne bougent pas. Ce qui manque est enfin nommé
correctement : **pas l'exécution des outils, qui a eu lieu, mais le TRI de leurs constats** —
l'étape que le process appelle « trier les constats des rapports, jamais un récapitulatif, un tri »,
et que rien d'autre ne porte.

**Les deux sens sont tenus** (BP4) : sans journal exploitable, ou sur un zéro **mesuré**, l'ancienne
phrase survit intacte — le garde ajoute un cas, il n'en retire aucun. Un journal vide rend
`mesurable: false`, jamais un zéro (leçons L5/L11).

**Branché dans le crochet, pas seulement écrit** (leçon L2) : `scripts/hooks/check-last-commit.mjs`
charge le journal et le passe à `relanceMessage()`. Sans ce branchement, la correction n'aurait été
qu'une intention. L'historique s'**injecte** dans les tests plutôt que de se lire sur le disque
(leçon L40).
