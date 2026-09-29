# LE POINT DE RETOUR — l'état d'avant le grand changement

*(Nuit du 2026-09-29 — heure LUE, source système. Tâche #1113.)*

> **DÉCOULE DE :** `docs/grand-projet/02-strategie/la-cible-2026-09-29.md`
> *un point de retour n'a de sens que rapporté à ce vers quoi on part.*

---

## À QUOI SERT CE DOCUMENT

**Sa demande, mot pour mot** : « je veux bien une sauvegarde de référence, mais **juste après que tu
aies finalisé ton plan d'action, avant de commencer quoi que ce soit concrètement** : je garde la
trace de où on en est + où on se dirige. »

**Ce n'est pas une sauvegarde de plus.** Le dépôt est versionné, tout est poussé — la donnée n'est
pas en danger. Ce qui manquait est un point de retour **NOMMÉ**, qu'on puisse **désigner** :
« reviens à l'état d'avant le grand changement ».

**Pourquoi la différence compte** : sans nom, revenir en arrière demande de retrouver le bon commit
parmi des centaines, **en pleine restructuration, au moment précis où l'on est le moins disponible
pour chercher**. Un identifiant de commit n'est pas un point de retour : c'est une aiguille dans une
botte de foin qui a l'air d'un point de retour.

---

## L'ANCRE — un commit nommé, et pourquoi pas une étiquette git

```
b2713392f8fc807c0f5cee6cf1bbc95a8de0f496
```

**Pour revenir voir cet état**, sans rien casser ni rien perdre :

```
git checkout b271339      # regarder
git switch -                    # revenir au travail en cours
```

### Pourquoi le commit et non une étiquette git, alors qu'une étiquette serait plus lisible

**L'étiquette a été créée, et elle n'a PAS pu être poussée** : le proxy git de cette session refuse
les références de tag (HTTP 403), alors qu'il accepte les commits de la branche. Trois essais, même
refus.

**Et une étiquette qui reste locale est pire que pas d'étiquette** : ce conteneur est éphémère, donc
elle disparaîtra sans que personne ne s'en aperçoive — au moment précis où l'on croirait pouvoir
s'en servir. *Un point de retour qui a l'air d'exister et qui n'existe pas est exactement le défaut
que ce document cherche à éviter.*

**L'ancre durable est donc le COMMIT, écrit ici**, dans un document qui, lui, est poussé. Le nom
manque encore, et il ne manque qu'à moitié : ce document EST le nom — on le désigne en disant « le
point de retour ».

**Ce qu'il peut faire en une minute s'il veut la vraie étiquette** : sur GitHub, Releases → New tag
→ coller `b271339`. Ou me le dire depuis une session dont le proxy l'autorise.

## CE QUE CET ÉTAT CONTIENT

| | |
|---|---|
| **Le jeu** | inchangé. Rien de ce que Lia et Noé disent ou font n'a bougé de la nuit |
| **L'Agence** | 93 fichiers d'outillage, 362 tests au vert, 100 % de couverture de classification |
| **L'exportabilité** | 88 % sur 8 dimensions · 94 % d'indépendance de tuyauterie · 68/68 outils debout sur un dépôt étranger |
| **Le suivi** | 1 094 lignes de tâches, dont 86 ouvertes |
| **La boussole** | une Partie 0 — LE BUT y est entrée, **en proposition** |

---

## CE QUI N'A PAS ENCORE COMMENCÉ, ET C'EST LE POINT

**Aucune modification d'architecture.** La cible, le chemin, les questions de calibrage et les
réponses sont **des documents** : ils décrivent ce qu'on va faire, ils ne le font pas. Les deux
Articles de charte sont écrits et **non appliqués**. Les seize tâches du chantier sont « À
TRANCHER » et non « Ouvertes ».

**C'est exactement l'état qu'il voulait marquer** : le plan est posé, rien n'est engagé.

---

## PLAN D'ACTION *(Article 28)*

| Constat | État | Ce qu'il devient |
|---|---|---|
| Il n'existait aucun point de retour nommé, et le dépôt ne portait aucune étiquette | **RETENU** | tâche **#1113** — l'étiquette `avant-le-grand-changement` est posée sur l'état de cette nuit |
| L'étiquette git n'a pas pu être poussée : le proxy de cette session refuse les refs de tag (403) | **RETENU** | l'ancre durable est le commit, écrit dans ce document — et l'étiquette se pose en une minute sur GitHub s'il la veut |
| Le nom reste à trancher, puisque c'est lui qui nomme | **À TRANCHER** | « avant-le-grand-changement » est ma proposition ; un renommage coûte une commande |
