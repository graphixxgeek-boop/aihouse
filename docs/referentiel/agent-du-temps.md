# AGENT-DU-TEMPS — instanciation sur « Maison IA vivante »

*(Blueprint générique : `docs/agent-du-temps-blueprint.md`. Registre : `docs/agent-du-temps/index.md`.
Script : `scripts/agent-du-temps.mjs`.)*

## Ce qu'il est ici

Un **Membre**, jamais un Gardien sacré : il ne délivre aucun scan de qualité du code, donc le
premier volet du critère double de l'Article 20 n'est pas rempli. Sa **portée** est l'Agence (il se
lance à froid, sans partie en cours). Sa **fiabilité** est déclarée *heuristique* — non parce que
l'heure serait approximative, mais parce que sa SOURCE ne l'est pas toujours, et parce qu'un facteur
d'ajustement calculé sur trois mesures reste une tendance.

## Pourquoi il existe sur CE projet

Demande explicite de l'utilisateur dans le prompt de nuit du 2026-09-23 : « un agent du TEMPS :
heure et date fiables au référentiel France, connecté au temps réel via une API gratuite, teste
l'agent à la Ronde, héberge les données d'estimation durée/conso. » Calibré la même nuit en fenêtre
dédiée : **« Essaie l'API, et si ça échoue prends l'horloge système »**, **« des seuils mécaniques,
jamais mon jugement »**, **« dérive-les de l'historique git »**.

Le besoin était déjà prouvé avant d'être formulé : la nuit même, une ligne de `docs/suivi/` a été
datée de quinze minutes dans le futur parce que l'heure avait été tapée au lieu d'être lue, et
`findHorodatagesFuturs()` a refusé le commit.

## L'état réel dans cet environnement, et il faut le savoir avant de s'en servir

**La source est « système », jamais « réseau ».** Les deux API essayées — `worldtimeapi.org` et
`timeapi.io` — rendent HTTP 403 : la politique réseau de l'environnement d'exécution refuse le
CONNECT. Ce n'est pas une panne de l'outil, c'est un paramètre d'environnement, et il appartient à
l'utilisateur de l'ouvrir ou d'acter que l'horloge locale suffit. L'outil affiche la source et le
motif de chaque essai à chaque passage — il ne se tait jamais là-dessus.

## Ses trois surfaces

| Commande / fonction | Ce qu'elle rend |
|---|---|
| `node scripts/agent-du-temps.mjs` | l'heure de Paris, l'horodatage UTC pour `docs/suivi/`, la SOURCE, et l'état des estimations |
| `maintenant()` | la même chose en données, avec le détail des essais réseau |
| `comparerAuReel()` · `ajusterDepuisHistorique()` · `enregistrerMesure()` | la mémoire des estimations, partagée par la Ronde et par la simulation |

## Le seuil, et d'où vient son chiffre

Tolérance de **±30 %** (`TOLERANCE_ESTIMATION`). Dérivé de la première mesure réelle du projet — la
Ronde GOAT MAX du 2026-09-23, 38 minutes estimées contre 27 réelles, soit +41 %, un écart ressenti
comme nettement trop. Jamais une convention ronde choisie à la main.

**Minimum de trois mesures** avant qu'un facteur d'ajustement soit proposé, et il est toujours
PROPOSÉ, jamais appliqué : une Ronde atypique recalibrerait sinon tout le reste.

## Son item de Ronde

`agent-du-temps` — demande explicite (« teste l'agent à la Ronde »). C'est le seul item de la Ronde
dont le vrai résultat est une **phrase à lire** (« SOURCE : réseau » ou « SOURCE : système »),
jamais un compte. Un agent du temps dont personne ne vérifie la source finirait par rendre
l'horloge locale en silence.

## Frontière avec CIRCLE-TASKS, explicitement

`estimerRonde()` reste chez CIRCLE-TASKS, parce qu'elle connaît les items d'une Ronde et rien
d'autre. Ce qui est GÉNÉRIQUE — comparer, historiser, ajuster — vit ici et sert aussi bien la Ronde
que la simulation (Article 18). Les recopier aurait donné deux historiques qui divergent, ce que
l'Article 24 interdit.
