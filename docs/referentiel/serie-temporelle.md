# serie-temporelle — fiche d'instanciation

## Ce qu'il sert ici

`scripts/serie-temporelle.mjs` (2026-09-22) : le mécanisme **partagé** d'historisation et de tendance
des rapports de l'Agence.

## Sa demande, mot pour mot

> « tous les rapports doivent être historisés et comparés dans une mesure raisonnable avec
> l'historique, pour dégager des tendances, quand c'est pertinent. Sinon : grosse perte de valeur
> par rapport à ce qu'on produit. La valeur data doit être fiabilisée. »

## Le constat qui l'a justifié, mesuré avant d'écrire une ligne

Le dépôt produisait déjà des dizaines de rapports par Ronde, et presque aucun ne se comparait à son
propre passé. Chaque passage repartait de zéro.

## Où vivent les séries ici

Dans le dossier de chaque outil, à côté de son index — `docs/<outil>/serie.json`. Jamais un fichier
central : une série centrale deviendrait un second registre à tenir à jour, et l'Article 24 l'aurait
en travers.

## Sa limite ici

Il rend une tendance, jamais un jugement. Et il refuse de conclure sous trois passages — un outil
neuf affiche donc « pas encore de tendance », ce qui est exact et se lit mal la première fois.
