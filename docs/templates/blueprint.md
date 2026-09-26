# <NOM DE L'OUTIL> — blueprint générique

> **GABARIT.** Copier vers `docs/<outil>-blueprint.md`, puis remplacer chaque `<…>`. Une section
> qu'on ne sait pas remplir se SUPPRIME avec sa raison écrite à la place — jamais une phrase polie
> qui donnerait l'illusion d'un document.
>
> **LE TEST, phrase par phrase : cette phrase reste-t-elle vraie sur un AUTRE projet ?** Si non,
> elle ne va pas ici : elle va dans la fiche d'instanciation. Un blueprint qui nomme les
> particularités de ce projet-ci n'est pas un blueprint, c'est une fiche mal rangée.

## Le problème qu'il ferme

<Le défaut réel, décrit sans jamais nommer ce projet. Pas « ce qu'il fait » — ce qui se passait mal
AVANT lui, et pourquoi on ne le voyait pas. Un outil dont on ne sait pas quel trou il bouche est un
outil que le prochain lecteur supprimera.>

## Ce qu'il mesure, et ce qu'il ne mesure pas

<Ce qu'il sait dire. Puis, tout aussi important, sa LIMITE HONNÊTE : ce que son résultat ne prouve
pas. Une mesure dont la portée n'est pas écrite se lit toujours plus large qu'elle ne l'est.>

## Comment il s'y prend

<Le mécanisme, en principes plutôt qu'en lignes de code. Ce qu'il LIT, ce qu'il DÉRIVE, ce qu'il
refuse de deviner. Assez précis pour être réécrit dans un autre langage.>

## Les états qu'il rend, et pourquoi il y en a un de plus qu'on croit

<La liste des verdicts. Y compris l'état « PAS MESURÉ » : un outil qui ne distingue pas « rien
trouvé » de « je n'ai pas pu regarder » rend un vert qui ne veut rien dire.>

## Les faux positifs déjà payés

<Chaque cas où il a accusé à tort, et la clause qui l'en empêche depuis. C'est la section la plus
utile du document : elle évite au lecteur de « simplifier » une garde qui a l'air excessive.>

## Ce qu'il faut pour l'installer ailleurs

<Ses dépendances, ses hypothèses sur l'arborescence, et ce qui doit exister dans le dépôt d'accueil
pour qu'il ait quelque chose à dire.>
