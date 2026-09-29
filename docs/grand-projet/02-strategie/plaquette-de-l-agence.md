# LA PLAQUETTE COMMERCIALE DE L'AGENCE — écrite aujourd'hui, avec l'écart écrit en face

*(Nuit du 2026-09-29 au 30, heure LUE, source système. Tâche **#1255**.
Sa demande, et elle est astucieuse : produire **la plaquette commerciale détaillée de l'Agence
telle qu'elle est aujourd'hui**, comme exercice — parce qu'écrire ce qu'on vendrait révèle
l'écart entre la fiction et la réalité mieux qu'un audit.)*

> **DÉCOULE DE :** `docs/grand-projet/03-plan-daction/ou-va-chaque-chose.md`
> *il répond à une demande de son fichier de réponses ; il ne propose aucune étape nouvelle.*

---

## LA RÈGLE DE CE DOCUMENT, ET ELLE EST LA MOITIÉ DE L'EXERCICE

**Chaque promesse porte son étiquette, sans exception :**

| Étiquette | Ce qu'elle veut dire |
|---|---|
| ✅ **VRAI** | mesuré aujourd'hui, le chiffre est dans le dépôt |
| 🟠 **VRAI ICI** | ça marche sur ce projet-ci ; rien ne prouve que ça marche ailleurs |
| 🔴 **FICTION** | ça n'existe pas, ou pas sous cette forme |

**Sans ces étiquettes, la plaquette serait un mensonge poli.** Avec elles, elle devient l'outil de
diagnostic qu'il a demandé — et c'est exactement la règle #767 appliquée à nous-mêmes.

---

# ═══ LA PLAQUETTE ═══

## L'AGENCE CODEX

### *Un atelier de développement qui refuse de vous mentir*

---

## LE PROBLÈME QU'ELLE RÉSOUT

Vous faites développer un projet avec une IA. Elle est rapide, elle est docile, et **elle vous dit
que tout va bien**. Trois semaines plus tard vous découvrez que la documentation décrit un code
qui n'existe plus, qu'un correctif a réintroduit un bug déjà réglé, et que personne — ni vous, ni
elle — ne sait plus pourquoi telle décision a été prise.

**Le problème n'est pas que l'IA se trompe. C'est qu'elle ne sait pas qu'elle se trompe, et que
rien ne le lui dit.**

---

## CE QUE L'AGENCE MET EN PLACE

### ① Un filet de sécurité qui ne dort jamais
✅ **VRAI** — **378 vérifications** tournent à chaque commit. Aucun changement ne passe sans
elles. Elles ne testent pas que « le code marche » : elles testent que **les règles que vous avez
posées tiennent encore**.

### ② Sept gardiens qui lisent votre code pendant que vous dormez
✅ **VRAI** — trous logiques, incohérences entre deux parties, code non testé, stagnation,
duplication, exportabilité. **Gratuits, mécaniques, à chaque commit.**

### ③ Une mémoire qui survit au changement d'IA
✅ **VRAI** — **530 tâches**, chacune datée, portant ce qui a été décidé **et pourquoi**. Le jour
où vous changez de modèle, d'éditeur ou de prestataire, **le nouveau venu lit et reprend**. Ce
n'est pas une promesse : c'est un dossier de 553 documents dans le dépôt.

### ④ Une charte que l'IA ne peut pas contourner en douce
🟠 **VRAI ICI** — vos règles à vous, numérotées, et des mécanismes qui **refusent un commit** quand
l'une est violée. *(L'honnêteté oblige : une partie des règles n'est portée que par du texte, et
le texte ne refuse rien. C'est écrit noir sur blanc dans notre propre charte.)*

### ⑤ Une IA qui vous contredit
✅ **VRAI** — l'Agence impose à l'IA de signaler quand votre demande entre en tension avec vos
propres règles, et d'exiger **deux confirmations** avant de l'exécuter. *Votre charte est protégée
même contre vous.*

### ⑥ Elle apprend de ses erreurs, et les erreurs sont écrites
✅ **VRAI** — **46 leçons** enregistrées, chacune née d'une erreur réellement payée, et ressorties
automatiquement au moment où le même piège se représente.

### ⑦ Tout part avec vous
🟠 **VRAI ICI** — chaque outil est livré avec son plan de reconstruction, pour qu'il fonctionne
ailleurs que chez nous. *(Mesuré : les kits existent. Qu'ils décrivent FIDÈLEMENT leur code n'est
vérifié que par échantillon.)*

---

## EN CHIFFRES

| | |
|---|---|
| **84** outils | ✅ mesuré |
| **378** vérifications à chaque commit | ✅ mesuré |
| **46** leçons tirées d'erreurs réelles | ✅ mesuré |
| **530** décisions tracées | ✅ mesuré |
| **1 123** commits en **13 jours** | ✅ mesuré |
| **0 €** de coût d'exécution pour les gardiens | ✅ mesuré — ils lisent des fichiers, jamais une API |

---

## ILS L'UTILISENT

🔴 **FICTION.** *Un seul projet l'utilise, et c'est le nôtre.*

## TARIFS

🔴 **FICTION.** *Aucun tarif n'existe, aucun modèle économique n'est arrêté.*

## SUPPORT ET MISES À JOUR

🔴 **FICTION.** *Il n'y a ni support, ni canal, ni personne d'autre que nous deux.*

## INSTALLATION EN QUINZE MINUTES

🔴 **FICTION, et c'est la plus grave.** *L'Agence n'a jamais été installée ailleurs. Pas une fois.
On ne sait pas combien de temps ça prend, ni si ça marche.*

---

# ═══ FIN DE LA PLAQUETTE ═══

---

## CE QUE L'EXERCICE A RÉVÉLÉ, ET IL VALAIT LE DÉTOUR

**Son intuition était juste : écrire la plaquette révèle des choses qu'un audit ne montre pas.**
Quatre constats, du plus rassurant au plus gênant.

### ① LE PRODUIT EST PLUS RÉEL QUE JE NE LE PENSAIS

**Sept promesses sur sept sont VRAIES ou VRAIES ICI. Aucune fonctionnalité annoncée n'est
inventée.** C'est rare, et ça mérite d'être dit : ce qu'on décrirait dans une plaquette existe
pour de vrai et se mesure. Je m'attendais à devoir écrire « fiction » sur la moitié des cases.

### ② TOUTE LA FICTION EST DU MÊME CÔTÉ, ET CE N'EST PAS UN HASARD

Regarde où tombent les quatre 🔴 : **clients, tarifs, support, installation.** Pas une seule
fiction sur le PRODUIT. **Toutes sur le COMMERCE.**

**Ce que ça dit** : l'Agence n'est pas un produit incomplet. **C'est un produit complet sans
entreprise autour.** Ce sont deux problèmes très différents, et on les confondait en parlant de
« commercialiser l'Agence » comme d'une seule tâche.

### ③ LA FICTION LA PLUS DANGEREUSE EST L'INSTALLATION, ET ELLE EST STRUCTURELLE

*« Installation en quinze minutes »* est le genre de phrase qu'on écrit sans y penser. Or **l'Agence
n'a jamais tourné ailleurs que dans ce dépôt. Pas une fois.**

**Tout le reste en dépend.** Sans une installation réussie ailleurs, on ne peut chiffrer ni le
temps, ni le support, ni le prix. **C'est le premier maillon**, et l'exercice le fait apparaître
comme tel alors qu'aucune de nos listes ne le plaçait en tête.

*(Et c'est cohérent avec ce que la loi de l'Agence exige : l'expérience du client passe avant tout.
Sa toute première expérience est l'installation.)*

### ④ CE QUI SE VEND N'EST PAS CE QU'ON CONSTRUIT LE PLUS

**Mesuré ce soir** : sur les 89 000 lignes d'outillage, la plaquette n'en mentionne qu'une poignée
— le filet, les gardiens, le suivi, les leçons. **Le reste ne se vend pas, et ne s'achète pas : il
se subit.** Dix registres à renseigner par outil, 483 lignes de bannière par commit, 93 obligations
de charte : rien de tout ça n'a sa place dans une plaquette, parce que **personne n'en veut**.

**C'est le même signal que la cible de 50 obligations, trouvé par un chemin complètement
différent** — et deux chemins indépendants qui arrivent au même endroit valent mieux qu'une
conviction.

---

## PLAN D'ACTION *(Article 28)*

| Constat | État | Ce qu'il devient |
|---|---|---|
| La plaquette écrite, étiquette par étiquette | **RETENU** | tâche **#1255** — ce document |
| Toute la fiction est commerciale, aucune n'est produit | **RETENU** | tâche **#1255** — à porter à la séance sur l'objectif ultime : « commercialiser » est deux chantiers, pas un |
| L'Agence n'a jamais été installée ailleurs — c'est le premier maillon | **À TRANCHER** | quand, et sur quoi ? Un dépôt vide, un vrai second projet, ou une copie de celui-ci ? Trois réponses très différentes |
| Ce qui se vend est une petite partie de ce qu'on construit | **RETENU** | même constat que la cible de 50 obligations, par un autre chemin — rejoint `la-route-vers-50-obligations.md`, tâche **#1248** |
| Tarifs, support, clients | **ÉCARTÉ, avec sa raison** | ce ne sont pas des manques à combler cette nuit : ils découlent tous du modèle économique, qui est précisément ce que la séance sur l'objectif ultime doit trancher. Les traiter avant serait bâtir sur un pivot non choisi |
