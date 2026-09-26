# check-profile — le banc d'essai du DIAGNOSTIC PSYCHOLOGIQUE du dossier retourné

*(Fiche créée le 2026-09-26, tâche #912 — elle manquait, et son absence a coûté un gel.)*

## Ce que c'est, en une phrase

Le banc où l'on éprouve **isolément et à froid** la partie la plus risquée du dossier retourné : un
diagnostic psychologique **généré librement par le modèle** à partir de preuves comportementales.

Commande : `node scripts/check-profile.mjs` — **jamais sans avoir consulté Smart Conso API d'abord**
(`node scripts/smart-conso-api.mjs check-profile --confirm`, Article 22).

## Pourquoi il existe — le risque n°1, et il n'a pas bougé d'un mot depuis le 2026-09-17

« Diagnostic psychologique » est exactement le genre de sujet qui pousse un modèle vers
**« il semble que vous ayez du mal à... »** — c'est-à-dire vers le registre thérapeutique, poli,
prudent, que l'Article 0 rejette comme la pire dérive possible. Ce banc sert à voir cette dérive
**avant qu'elle n'atteigne le jeu**, sur douze profils d'observateur fabriqués pour la provoquer.

## Ce qu'il n'est PAS

**Pas un test automatique.** Aucune assertion, aucun verdict calculé. Il envoie de vrais appels et
affiche les réponses **pour une lecture humaine**, exactement comme `check-spirit`. Le champ
`expectVerdictLeaning` aide cette lecture ; il n'entre dans aucun calcul.

C'est pourquoi il est classé **heuristique** dans `TOOL_RELIABILITY` et **Membre classique**, jamais
premium : sa valeur est réelle et son rang le dit honnêtement.

## L'épisode du gel, et pourquoi il mérite d'être gardé

**Le 2026-09-26 au matin, cet outil a été gelé hors de l'équipe.** Son en-tête, daté du 2026-09-17,
disait : « le mécanisme réel n'existe pas encore dans le code, cette conception n'étant pas encore
validée ». C'était vrai ce jour-là. Ce ne l'était plus.

**Deux hypothèses étaient ouvertes, et elles appelaient des gestes opposés** : soit l'en-tête était
simplement périmé, soit l'outil testait quelque chose qui avait changé sous lui. Le promouvoir sans
trancher revenait à certifier un outil dont on ignorait s'il mesurait encore.

**C'était la première, et `route.ts` le dit lui-même** :

> « Diagnostic du dossier retourné (2026-09-17) : version longue du prompt validé sur douze profils
> dans `scripts/check-profile.mjs` »

Le mécanisme de production n'a pas seulement été construit depuis — **il a été construit À PARTIR de
ce banc d'essai**. L'en-tête a été réécrit, cette fiche existe, l'outil a rejoint l'équipe.

**Ce que l'épisode enseigne** : un outil dont l'en-tête ment sur son objet ne peut plus être ni
promu, ni lancé en confiance. C'est la dette documentaire que l'Article 13 interdit, appliquée à un
**fichier de code** plutôt qu'à un document — et le prix payé n'a pas été théorique : neuf heures de
gel, et un outil de l'Article 0 rendu inutilisable par une phrase devenue fausse.

## Ce qui reste à faire, et qui ne relève pas de l'agent

**Sa ligne dans l'inventaire de CLAUDE.md n'a pas été ajoutée** : la charte est intouchable sans
lui. La ligne à insérer, prête à coller dans le tableau « Inventaire documentaire des outils » :

| check-profile | le banc d'essai du diagnostic psychologique du dossier retourné : douze profils, lecture humaine, jamais un verdict | *(pas de blueprint)* | `docs/referentiel/check-profile.md` | `scripts/check-profile.mjs` |

**Et il n'a pas été lancé cette nuit**, volontairement : il coûte 2×N vrais appels d'un coup, et la
consigne de la nuit était de ne dépenser aucun quota.
