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

## L'ÉTIQUETTE

```
avant-le-grand-changement
```

**Pour revenir voir cet état**, sans rien casser ni rien perdre :

```
git checkout avant-le-grand-changement      # regarder
git switch -                                # revenir au travail en cours
```

**Le nom est provisoire et c'est lui qui nomme.** Une étiquette se renomme en une commande ; je l'ai
posée plutôt que d'attendre, parce qu'une étiquette posée après coup ne marque plus l'avant.

---

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
| Le nom de l'étiquette est le mien, alors que c'est lui qui nomme | **À TRANCHER** | un renommage coûte une commande ; qu'il le dise et c'est fait |
