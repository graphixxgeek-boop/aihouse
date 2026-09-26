# pure-gold-unity — fiche d'instanciation

## Ce qu'il sert ici

`scripts/pure-gold-unity.mjs` (2026-09-22) : scanne les rapports du dépôt et signale ceux qui
n'utilisent pas le gabarit partagé (`report-template.mjs`).

## Pourquoi il existe dans CE projet

L'épisode qui l'a rendu nécessaire est concret : la phrase d'avertissement de fiabilité a dû être
insérée **à la main dans 28 fichiers**, faute d'un endroit prévu pour elle. Le gabarit partagé a été
écrit pour que ça n'arrive plus ; cet outil vérifie que personne n'en sort.

## Son rôle exact, et il a CHANGÉ de nature

Son chantier est clos : **29 sur 29**. Il n'est donc plus un outil de rattrapage mais un
**DÉTECTEUR DE RÉGRESSION** — un chiffre qui remonterait signalerait un nouvel outil écrivant son
rapport à la main. C'est précisément le genre de chose qu'on ne pense jamais à vérifier soi-même.

## L'histoire qui l'a mis dans la Ronde, et elle vaut d'être lue

Il était **ABSENT** de la Ronde jusqu'à ce que l'utilisateur pose simplement la question : « pour
pure gold que tu viens de creer : il est bien dans circle ? ».

Il ne l'était pas. **Et aucun garde-fou ne pouvait le dire** :
`findRegistriesMissingFromCircle()` ne regarde que les outils ayant déjà un registre sur le disque,
or cet outil n'en avait aucun. Un outil sans registre était donc invisible à la vérification censée
repérer les outils oubliés — **le trou vivait dans le garde-fou lui-même.**

`findReportingToolsMissingFromCircle()` a été écrit le jour même pour partir des outils plutôt que
des dossiers.

## Sa famille, LUE et non déduite

**« Les Anges »** dans l'organigramme (`docs/referentiel/organisation-agence.md`) — et c'est noté
ici parce que son sujet en suggère une autre : le 2026-09-26, il a été classé à tort chez « Les
Prophètes », et `findFamillesDivergentesParOutil()` a refusé le commit. **Une famille se LIT, jamais
ne se devine.**

## Sa place dans la Ronde

Item `pure-gold-unity-scan`, dépôt `docs/pure-gold-unity/`.

## Sa limite ici

Il vérifie qu'un rapport passe par le gabarit, jamais que son contenu vaut quelque chose.
