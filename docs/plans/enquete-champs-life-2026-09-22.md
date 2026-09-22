# Enquête — les 6 champs `lib/life.ts` signalés par ARGUS

**Tâche #214.** Décision de l'utilisateur : *« J'enquête d'abord, sans rien retirer. »*
**Rien n'a été retiré. Aucune ligne de `lib/life.ts` n'a été touchée.**

## Verdict, champ par champ

| Champ | Verdict | La preuve, vérifiée dans le code d'aujourd'hui |
|---|---|---|
| `ambientSeen` | ✅ **Faux positif** | Lu comme condition en `app/api/lia/route.ts:664` (`!story.life?.ambientSeen` conditionne le beat d'ambiance), écrit en 1391. |
| `observerNamed` | ✅ **Faux positif** | Lu en `route.ts:1392` (`!life.observerNamed`) : c'est ce qui empêche Lia de redemander son nom à l'observateur une seconde fois. |
| `exitSearched` | ✅ **Faux positif** | Lu en `lib/turn.ts:74` (`!life.exitSearched`) : conditionne toute la scène d'inspection du couloir. |
| `proposalHistoryChecked` | ✅ **Faux positif** | Lu en `route.ts:723` (`!life.proposalHistoryChecked`), écrit deux lignes plus bas en 725. |
| `personalBoosted` | ✅ **Faux positif** | Lu en `route.ts:1219` (`!life.personalBoosted`) : empêche de rejouer deux fois le même élan personnel. |
| `trottoirGranted` | ⚠️ **Réellement jamais lu — mais c'est une décision assumée** | Une seule écriture (`route.ts:202`), aucune lecture. Et c'est écrit noir sur blanc dans `docs/referentiel/parametres.md:306` : le trottoir est « un accès narré (un point de déplacement, pas encore une zone 3D pathable complète comme le jardin — *on verra après* selon l'utilisateur) ». Le flag n'a structurellement rien à relire : la scène est entièrement résolue au moment du tirage. Rattaché à la **tâche #92 (refonte graphique)**, qui est la borne que vous avez posée. |

**Cinq faux positifs sur six.** L'heuristique d'ARGUS compte des occurrences brutes : un champ lu
UNE fois comme condition, à l'endroit même où il est écrit, passe sous son seuil de 4 occurrences.
Ce n'est pas un défaut du code, c'est la limite honnête d'un scan qui ne lit pas le sens.

## Mais le vrai constat n'est pas là

**Ces six verdicts existaient déjà.** Ils ont été établis le **2026-09-19**, et ils sont écrits en
toutes lettres dans `docs/argus/index.md` — y compris la distinction exacte que je viens de refaire,
y compris la leçon `trottoirGranted`, y compris le seul champ réellement mort de ce lot (`lastCause`,
supprimé le jour même).

**ARGUS les re-signale à chaque commit depuis trois jours.** La conclusion est dans son propre
registre ; l'outil ne le lit pas.

C'est le défaut de cette journée sous une forme nouvelle. Ailleurs, un mécanisme calculait sans rien
imprimer, ou imprimait sans rien garder. Ici, **le verdict est gardé et l'outil ne le consulte pas** :
un Gardien sans mémoire de ses propres jugements.

**Et ça a coûté un vrai chantier.** Le bandeau `ARGUS ⚠️6` affiché à chaque commit est précisément ce
qui a fait naître cette tâche #214 — une enquête complète sur des questions déjà tranchées. Une
alarme permanente ne se contente pas d'être ignorée : elle fait dépenser du travail à re-trancher ce
qui l'était.

## Le patron existe déjà, à côté

`SAFE-EXPORT` porte exactement ce mécanisme (`filtrerDejaTranches()`), et il règle même le danger
qu'on pourrait redouter en donnant de la mémoire à un Gardien :

- un écart n'est filtré **que** s'il porte un accord explicite de l'utilisateur ;
- un « écarté » posé sans cet accord est **nommé dans le rapport** comme une tentative de faire taire
  l'alerte, et continue de remonter ;
- un écart corrigé qui **revient** est signalé comme régression (Article 3).

Il n'y a donc rien à inventer : il y a un patron éprouvé dans ce dépôt, et un Gardien sacré qui ne
l'a pas.

## Plan d'action

| État | Constat | Suite |
|---|---|---|
| **RETENU** | ARGUS n'a aucune mémoire de ses verdicts et re-signale 6 cas clos depuis 3 jours | Lui donner `filtrerDejaTranches()`, le patron déjà éprouvé de SAFE-EXPORT — **sous réserve de votre accord**, parce que donner à un Gardien sacré le droit de taire une trouvaille est un changement sensible |
| **ÉCARTÉ, avec raison** | Retirer les 5 champs faux positifs | Ils sont réellement lus. Les retirer casserait le jeu. |
| **ÉCARTÉ, avec raison** | Retirer `trottoirGranted` | Décision assumée et documentée (`parametres.md:306`), rattachée à la refonte graphique — la borne que vous avez posée. |
| **À TRANCHER** | Le seuil brut de 4 occurrences d'ARGUS | Avec une mémoire, ce seuil devient moins critique : un faux positif ne coûte plus qu'une fois. Sans elle, le baisser produirait plus de bruit. |
