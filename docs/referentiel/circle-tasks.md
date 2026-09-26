# CIRCLE-TASKS — fiche d'instanciation

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
