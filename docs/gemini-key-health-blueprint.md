# gemini-key-health — plan générique : connaître une clé d'API dans la DURÉE

*(Blueprint réutilisable. Instanciation : `docs/referentiel/gemini-key-health.md`.)*

## Le principe fondateur : dominer la clé, pas subir ses blocages

« Je veux que l'outil ait une connaissance fine de la clé API de façon à pouvoir **la dominer** :
c'est le principe fondateur de l'outil qui lui permet d'atteindre son objectif — contourner les
obstacles et blocages posés par la clé. »

L'objectif n'est jamais de deviner, ni de réagir à l'aveugle à un blocage isolé, mais de connaître
CHAQUE clé configurée assez finement — par modèle, dans le temps, épisode par épisode — pour
anticiper et contourner ses blocages **avant** qu'ils ne bloquent une vraie session.

## Les deux temporalités, et pourquoi il en faut deux

| L'outil | Sa question |
|---|---|
| la sonde ponctuelle | **que répond cette clé, maintenant ?** |
| cette mémoire | **comment cette clé se comporte-t-elle dans la durée ?** |

Une sonde seule ne sait rien d'un blocage qui revient tous les jours à la même heure. Une mémoire
seule ne sait rien de l'état présent. Fusionner les deux donnerait un outil qui confond une panne
passagère avec une limite structurelle.

## La propriété qui le distingue de tout le reste du paysage

**Plus il est utilisé, plus sa connaissance s'affine — jamais l'inverse.** C'est un outil dont la
valeur croît avec l'usage, ce qui n'est vrai d'à peu près aucun autre : la plupart rendent le même
verdict à chaque passage.

Conséquence pratique : ne jamais purger son historique pour « faire propre ». La donnée ancienne est
exactement ce qui fait la différence entre réagir et anticiper.

## Ce qu'il enregistre, épisode par épisode

Le modèle, la clé (sous une forme qui ne la révèle jamais), l'horodatage, la réponse obtenue, et le
verdict qu'on en a tiré. Le verdict compte autant que la réponse brute : c'est lui qui se relit.

## Sa limite honnête

Il apprend d'épisodes réels. Sur une clé neuve il ne sait rien, et il doit le DIRE plutôt que de
rendre un verdict prudent qui ressemblerait à un verdict mesuré.
