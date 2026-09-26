# gemini-key-health — fiche d'instanciation

## Ce qu'il sert ici

`scripts/gemini-key-health.mjs` (2026-09-18) : la mémoire fine, par clé et par modèle, du
comportement de l'API dans la durée. Membre du groupe **Smart Breaker**.

## Son principe fondateur, dans les mots de l'utilisateur

« Je veux que l'outil ait une connaissance fine de la clef API de façon à pouvoir **la dominer** :
c'est le principe fondateur de l'outil qui lui permet d'atteindre son objectif : contourner les
obstacles et blocages posés par la clef API. »

Et la demande initiale qui l'a fait naître : « que cet outil devienne peu à peu une bombe
d'efficacité grâce à tous les épisodes vécus, toute l'expérience accumulée ».

L'en-tête du fichier reformule ce POURQUOI exprès, pour ne jamais le perdre de vue derrière le
COMMENT (Article 7).

## Sa frontière avec la sonde ponctuelle

`check-gemini-quota.mjs` répond à **l'instant présent** ; cette mémoire répond à **la durée**. Les
deux sont nécessaires : une sonde ne voit pas un blocage qui revient chaque jour à la même heure, et
une mémoire ne voit pas l'état actuel.

## Où lire le reste

`docs/referentiel/smart-breaker-historique.md` porte toutes les règles opérationnelles du groupe, et
`docs/outil-resilience-api.md` le plan générique du Smart Breaker dans son ensemble. La procédure à
suivre le jour où ça bloque vit dans CLAUDE.md, Article 22.

## Sa limite ici

Sur une clé neuve, il ne sait rien — et il doit le dire plutôt que de rendre un verdict prudent qui
ressemblerait à une mesure. C'est la même exigence que partout ailleurs dans ce paysage : « pas
mesuré » n'est jamais « rien à signaler ».
