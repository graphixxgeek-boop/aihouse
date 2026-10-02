# lib-shell — fiche d'instanciation

*(Blueprint générique : `docs/lib-shell-blueprint.md` · script : `scripts/lib-shell.mjs`.)*

## Ce qu'il sert ici

`scripts/lib-shell.mjs`, extrait le 2026-09-19 après avoir trouvé la **même fonction réécrite à
l'identique dans trois scripts** — `always-new-code.mjs`, `check-level-target.mjs`,
`hyper-scan-checkpoint.mjs`.

## Ce qu'il porte AUSSI dans ce projet, et c'est à savoir

Ce fichier a grossi : il ne porte plus seulement `sh()`. Il héberge aussi des registres partagés de
l'Agence — `AGENT_CATEGORIES` (l'organigramme), `GARDIEN_DOMAINS`, `TOOL_RELIABILITY`, la portée des
outils. **C'est un écart avec le blueprint, qui dit qu'un lanceur de commande ne doit pas devenir un
fourre-tout** — et il est déclaré ici plutôt que tu.

Conséquence concrète pour un export : `lib-shell` ne part pas seul. Ce qui est générique (le
lanceur) et ce qui est propre au projet (les registres) vivent dans le même fichier, et il faudrait
les séparer avant de l'emporter.

## Une correction déjà faite, qui ne se rediscute pas

**« Personnages » n'est pas une catégorie de l'organigramme** (2026-09-21, tâche #245). La confusion
venait d'avoir proposé d'appliquer un outil pensé pour la mémoire narrative de Lia et Noé comme
condition du badge des membres de l'équipe. Les personnages sont hors de l'équipe, jamais une 5ᵉ
catégorie.

## Sa limite ici

Il est **vital** au sens de l'Agence (tout le monde l'importe) et c'est précisément ce qui rend son
mélange générique/spécifique coûteux : il est le premier fichier qu'un export doit emporter, et le
premier à devoir être nettoyé.

## Lire les scripts du dépôt, une seule fois *(`lireLesScriptsDuDepot()`)*

Deux fonctions appelantes lisaient les mêmes scripts par le même chemin. **La correction raconte
quelque chose qui vaut au-delà de ce cas** : la première tentative a consisté à écrire l'explication
dans les DEUX copies, pour qu'elle soit sous les yeux. Le détecteur de duplication a aussitôt
re-signalé la paire — **en plus gros qu'avant**, le bloc jumeau passant de 5 à 9 lignes, parce que
le commentaire identique s'y était ajouté.

**Expliquer une duplication dans les deux copies duplique l'explication.** La raison vit donc dans
la fonction partagée, une seule fois, et chaque appelant ne porte qu'une ligne de renvoi. C'est la
leçon **L37** — corriger la CLASSE, jamais l'occurrence — appliquée à ce qu'on écrit, pas seulement
à ce qu'on code.

## Les lectures aveugles aux fusions *(`findLecturesAveuglesAuxFusions()`)*

Elle relève les lignes qui lisent les fichiers d'un commit **sans dire quoi faire d'une fusion** —
un commit de fusion n'a pas un parent mais deux, et une lecture qui l'ignore rend un résultat
plausible et faux.

**Deux choix de conception, et chacun porte sa raison** : `sources` est une liste de
`{ fichier, texte }` — **le lecteur reste à l'appelant**, pour qu'un test n'ait jamais besoin du
disque (leçon L40 : un test qui lit une donnée vivante juge le dépôt, pas le code). Et la liste des
fichiers dont les commandes git sont du **décor** est tenue à la main, cette nature volontaire
étant écrite à côté comme l'Article 24 l'exige : le filet de sécurité contient par construction de
fausses commandes qu'il donne à manger à ses doublures.


---

## `lireChacun()` — lire une liste de fichiers déjà connue, toléramment (2026-10-02, tâche #1451)

**Ce qu'elle n'est PAS : un doublon de `lireLesScriptsDuDepot()`.** Celle-là **découvre** les
fichiers (elle liste un dossier) et doit distinguer « dossier illisible » de « dossier vide » ;
celle-ci reçoit une liste que l'appelant a déjà constituée et n'a donc aucun dossier à lister. Les
fondre donnerait une fonction à deux modes dont l'appelant porterait le choix, pour ne partager que
trois lignes.

**Pourquoi elle existe** : CLONE-HUNTER signalait **trois** fonctions de `safe-export.mjs`
(`findFuitesDeSpecificite`, `findMentionsSansConsigne`, `findBlueprintsMalConstruits`) dont les cinq
premières lignes étaient identiques — même signature, puis le même « ouvrir, et passer au suivant si
c'est illisible ». **La décision de SAUTER un fichier illisible en silence est un arbitrage, pas un
détail de syntaxe** : recopiée trois fois, elle pouvait diverger trois fois.

**Le comportement est repris à l'identique**, y compris le silence : une fusion n'est pas l'endroit
où changer une décision (Article 19). Sortie de `safe-export.mjs` comparée ligne à ligne avant et
après — seule la taille du fichier de compteur d'usage bouge.

**La raison vit ICI, une seule fois**, et chaque appelant ne porte qu'une ligne de renvoi. C'est la
leçon déjà écrite en tête de `lireLesScriptsDuDepot()` : *expliquer une duplication dans les deux
copies duplique l'explication* — la recopier ferait grossir le bloc jumeau au lieu de le réduire.
