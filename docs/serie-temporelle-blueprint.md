# SÉRIE-TEMPORELLE — blueprint générique

*(2026-09-22. Mécanisme PARTAGÉ d'historisation et de détection de tendance, réutilisable tel quel
sur un autre projet : il ne connaît rien du domaine, seulement des points datés et des mesures
nommées.)*

## Le problème qu'il résout

Un paysage d'outils qui mesure beaucoup et n'historise rien répond toujours à « où en est-on
aujourd'hui », jamais à « où va-t-on ». Chaque outil finit par bricoler son propre journal, dans son
propre format — d'où N logiques de comparaison divergentes, ou plus souvent aucune.

**Constat mesuré sur ce projet avant d'écrire une ligne** : une dizaine de journaux JSON locaux aux
formats tous différents, un CSV, trente index Markdown, et **zéro** détection de tendance.

## Les quatre garde-fous, et c'est là qu'est la valeur

Sans eux, historiser produit des tendances **fausses** — ce qui est pire que ne rien historiser,
parce qu'une tendance fausse est crue.

1. **Cinq états, jamais trois.** Comparer deux nombres donne mieux / pareil / moins bien. Deux cas
   se cachent derrière « pareil » : **première mesure** (absence de passé, jamais de la stabilité)
   et **plus mesuré** (une mesure qui s'arrête ressemble à une mesure qui tient). Corollaire : une
   mesure sans valeur n'est **jamais persistée** — l'enregistrer à zéro ou à null la ferait relire
   « stable ».
2. **Le sens est déclaré, jamais deviné.** « Le chiffre monte » ne dit rien tant qu'on ignore si
   monter est souhaitable. Un poids qui monte est mauvais, un nombre de tests qui monte est bon —
   une flèche automatique se tromperait une fois sur deux, et une flèche fausse est crue.
3. **Une tendance exige assez de points.** Deux points forment un segment. En dessous du seuil, on
   le dit ; « stable » serait un mensonge confortable. La comparaison porte sur les deux moitiés de
   la série, jamais du premier au dernier point — un pic isolé retournerait sinon une trajectoire
   qui n'existe pas.
4. **Une rupture de méthode casse la série.** Le garde-fou auquel personne ne pense, et le plus
   dangereux : une tendance calculée à travers un changement de méthode de mesure est une fiction,
   d'autant plus crédible qu'elle s'appuie sur beaucoup de points. Chaque point porte le nom de sa
   méthode ; la tendance repart du point de rupture et le date.

## Circulation

Un mécanisme d'historisation ne vaut que si quelqu'un lit ce qu'il produit. **Une série orpheline
est le pire rapport coût/retour possible** : elle coûte un point à chaque passage, pendant des
semaines, et ne rend rien. Le surveillant de la circulation des données du projet (ici
`data-archangel`) reçoit donc trois vérifications : la série lue par personne, l'outil qui devrait
l'exploiter et ignore le mécanisme, et ce qui est réellement disponible pour l'humain et pour
l'agent — en distinguant **« trop jeune »** de **« aucune série »**, l'un se corrigeant en
attendant, l'autre en câblant.
