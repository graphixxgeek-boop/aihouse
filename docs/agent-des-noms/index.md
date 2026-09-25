# Registre de l'AGENT DES NOMS

*(Ce que l'outil a réellement produit, passage par passage. Ce qui explique l'outil vit ailleurs :
`docs/referentiel/agent-des-noms.md` pour ce projet, `docs/agent-des-noms-blueprint.md` pour la
version réutilisable.)*

Deux choses s'inscrivent ici, et il ne faut pas les confondre :

- **les renommages** — planifiés avant le geste, vérifiés après ;
- **les baptêmes** — qui a nommé quoi, quand, et ce qui avait été proposé à côté. Ceux-là vivent
  dans `docs/agent-des-noms/registre.md`, écrit par `enregistrerBapteme()`, qui refuse tout
  enregistrement ne portant pas l'accord explicite de l'utilisateur.

## Renommages

| Date | Ancien | Nouveau | Occurrences | Dont code | Dont histoire (laissées) | Vérifié après |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | *(aucun renommage n'est encore passé par l'outil)* |

**Cette ligne vide est une mesure, pas un oubli** : l'outil est né le 2026-09-24 et la dette de
nommage se purge après la classification de l'iceberg (#737). Un registre vide le jour de sa
création est le résultat attendu ; c'est un registre encore vide dans un mois qui poserait une
question.

## Passages de gouvernance

| Date | Provisoires oubliés | Marques sans date | Noms jamais validés |
|---|---|---|---|
| 2026-09-24 | 0 | 1 *(l'outil lui-même — corrigé le jour même en datant sa marque)* | 78 sur 78 |

## 2026-09-25T08:12Z — Premier passage de `homonymes` sur le vrai dépôt (tâche #756)

**78 fichiers lus. 2 collisions · 34 conventions locales · 2 délégations.**

**Ce que ce passage a trouvé et que personne ne cherchait.** La tâche était ouverte sur
`DOMAINES`, exporté par `cassandra-rh.mjs` et `the-equalizer.mjs` avec deux sens différents. La
mesure dit que **ce couple-là n'est PAS le problème** : personne n'importe ni l'un ni l'autre
depuis un autre fichier, donc personne ne peut les croiser — c'est une convention, pas une
collision. Les deux vraies collisions, que personne ne surveillait :

| Nom | Défini par | Importé par | Les deux sens |
|---|---|---|---|
| `PALIERS` | `priorites.mjs` · `simulation-visiteur.mjs` | `check-tasks-details.mjs` · `criticite.mjs` | six paliers de PRIORITÉ **contre** familles de RÉACTION de Lia et Noé |
| `recordOutcome` | `gemini-key-health.mjs` · `smart-conso-token.mjs` | `check-gemini-quota.mjs` | résultat d'une SONDE de clé/modèle **contre** résultat d'une ACTION de l'agent |

**Ni l'un ni l'autre n'a été renommé**, et c'est délibéré sur deux fondements : l'interdit posé par
l'utilisateur le 2026-09-24 (« on fait le point demain soir sur l'outil qui va t'aider [...] ensuite
on va faire de la dentelle, nom par nom, par série »), et l'Article 20bis — nommer est sa
prérogative. Les deux entrent dans la série de renommage à préparer avec lui.

**Un contrôle a été passé, et il est plus intéressant que les deux collisions.** `detectGenericReport`
apparaît dans `the-deep-reader.mjs` et `the-final-judge.mjs` alors que la tâche #152 avait
justement factorisé leur logique commune. Ce n'est pas une régression : la partie partagée vit bien
dans `judge-persona-shared.mjs`, et chacune des deux fonctions ne garde plus que le signal propre à
SON personnage. Le classement en convention est donc exact, et l'outil n'a pas sur-accusé — ce qui
est la seule chose qui rende un détecteur croyable sur la durée.
