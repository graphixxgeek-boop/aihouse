# check-profil-utilisateur — plan générique : le garde-fou d'un index et de son dossier

*(Blueprint réutilisable. Instanciation : `docs/referentiel/check-profil-utilisateur.md`.)*

## Le motif général, réutilisable bien au-delà d'un profil

Dès qu'un projet tient **un dossier de fiches** et **un index qui les liste**, deux dérives
apparaissent, et elles sont de natures opposées :

| La dérive | Pourquoi elle est invisible |
|---|---|
| une fiche créée mais **jamais indexée** | elle existe sur le disque, donc tout semble en ordre — mais un lecteur qui ne consulte que l'index ne la verra JAMAIS |
| une ligne d'index qui pointe vers un **fichier disparu** | le lien ressemble à un lien ; c'est pire qu'une absence, parce qu'on ne va pas vérifier |

Aucune des deux ne casse quoi que ce soit. Elles se contentent de rendre faux un document qui
continue de paraître juste.

## Le principe : les deux sens, toujours, et jamais confondus

Le garde-fou compare le dossier à l'index **dans les deux directions**, et rapporte les deux
résultats **séparément**. Les fondre en un seul « N incohérences » perdrait ce qui décide de
l'action : l'un se corrige en ajoutant une ligne, l'autre en retirant ou en restaurant un fichier.

## Ce qu'il doit coûter

Zéro appel réseau, lecture pure. C'est la condition pour qu'il puisse tourner à chaque passage sans
que personne n'ait à arbitrer — et un garde-fou qu'on arbitre ne tourne pas.

## Sa limite honnête

Il vérifie la CORRESPONDANCE, jamais le CONTENU. Une fiche vide correctement indexée lui paraît
parfaite.
