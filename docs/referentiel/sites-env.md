# sites-env — fiche d'instanciation

## Ce qu'il sert ici

`scripts/sites-env.mjs` : la résolution des valeurs d'environnement du projet — clés d'API, profil
d'exécution, réglages de déploiement.

## Ses sources ici, dans l'ordre

Les variables du processus, puis `.dev.vars` (le fichier local de développement, jamais commité),
puis les valeurs par défaut du code.

## Un fait établi empiriquement, et qui a coûté du temps

En mode développement Cloudflare Workers, **une variable d'environnement posée dans le shell n'est
PAS prise en compte par le runtime** : seul `.dev.vars` l'est, et il faut redémarrer le serveur pour
qu'il soit relu. C'est écrit dans la procédure de déblocage de quota (CLAUDE.md, Article 22) parce
que la première fois, la cause a été cherchée ailleurs pendant longtemps.

## Ce qui est volontairement absent

Aucune commande, aucun rapport : c'est une bibliothèque. Pas de registre, et ce n'est pas un manque.

## Sa limite ici

Elle résout, elle ne valide pas. Une clé présente mais vide passe pour présente.
