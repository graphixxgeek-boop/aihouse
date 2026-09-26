# check-suivi-fidelity — instanciation sur ce projet

*(Membre certifié depuis le 2026-09-26. Blueprint générique : `docs/check-suivi-fidelity-blueprint.md`.
Registre : `docs/check-suivi-fidelity/`.)*

## Ce qu'il fait

Il relit chaque fichier de session de `docs/suivi/` et refuse une clôture nue. Une tâche fermée doit
préciser **« terminée — fidèle »** ou **« terminée — écart : … »** ; un simple « terminé » laisse
sans réponse la seule question qui compte : *est-ce que ça a été fait comme demandé ?*

Il fait aussi trois choses que son nom ne dit pas, et qui pèsent autant :
- il repère un fichier ANNONCÉ dans une ligne de suivi et **absent du disque** (`findClaimedFilesMissing`) ;
- il croise les commits récents avec le suivi et signale **un commit substantiel sans ligne**
  (`findCommitsMissingSuiviUpdate`) ;
- il refuse **un horodatage daté dans le futur** — c'est lui qui attrape une heure TAPÉE plutôt que
  LUE (Article 32), et il l'a fait trois fois cette seule semaine.

## Pourquoi il est un Membre et pas de l'infrastructure

Il porte une connaissance propre au projet : ce qu'est une clôture honnête ici, la forme exacte
d'une ligne de suivi, la différence entre « fidèle » et « écart ». Ce savoir ne se déduit d'aucune
convention générale — il vient de décisions prises dans ce projet.

## Ce qu'il ne fait pas, et c'est délibéré

Il vérifie qu'une clôture DÉCLARE sa fidélité ; il ne juge jamais si la déclaration est vraie. Aucun
mécanisme ne peut lire une tâche et dire si elle a vraiment été faite comme demandé — c'est le
travail de THE-DEEP-READER, et de l'utilisateur.

## Comment on s'en sert

```
node scripts/check-suivi-fidelity.mjs
```

Gratuit, zéro appel API. Il tourne déjà au crochet de commit — plus souvent qu'un item de Ronde, ce
qui est la raison pour laquelle il n'en a pas.
