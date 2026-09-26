# Profil d'exécution — blueprint générique

## Le problème qu'il ferme

Un projet qui tourne à la fois sur une machine gérée et sur un clone nu doit savoir **lequel des
deux** avant de choisir un comportement (chemins d'outils, gestionnaire de paquets, accès réseau).
L'information vit dans un fichier local au checkout — donc **absent** du clone nu, par construction.

## Le piège, et c'est tout l'objet du fichier

Un fichier absent et un fichier illisible se ressemblent à l'appel, et appellent l'inverse l'un de
l'autre :

- **absent** → ce n'est pas une panne, c'est le cas normal du clone nu. On rend le profil portable.
- **illisible, ou contenant une valeur inconnue** → là, quelque chose est cassé, et l'avaler
  silencieusement ferait tourner le projet dans un mode que personne n'a choisi.

Le fichier distingue les deux : repli sur le cas normal, **erreur levée** sur le cas anormal.

## Ce qu'il ne fait pas

Il ne devine jamais le profil d'après l'environnement. Un profil deviné serait invérifiable, et
l'erreur qu'il provoquerait apparaîtrait très loin de sa cause.

## Comment l'installer ailleurs

Une lecture, deux valeurs possibles, un repli nommé. Ce qui s'emporte : **l'absence est un cas
normal, la valeur inconnue ne l'est pas.**
