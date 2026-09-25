# Cadrage du chantier de classification — cible, signal de fin, lien avec l'organisation

*(Tâche #743, produit le 2026-09-25T09:05Z. Sa question : « quel est la cible souhaitée ? à quelle
classification finale on veut arriver et pourquoi ? quel est le lien avec l'organisation ? [...]
quel est le signal qui nous dira que la classification est ok ».)*

> **C'est la tâche qui commande toutes les autres du chantier, et elle manquait.** Quatre axes ont
> été produits sans qu'on ait jamais écrit à quoi ils doivent servir ni quand on s'arrête.
> Ce document répond à ce qui se MESURE, et pose en fenêtre de questions ce qui se CHOISIT.

---

## 1. Où on en est, mesuré — `node scripts/cassandra-rh.mjs cadrage`

**78 scripts · 56 portent les 4 axes (71,8 %) · 0 désaccord non arbitré.**

| Axe | Ce qu'il dit | Scripts sans | Porteur |
|---|---|---|---|
| iceberg | à quel groupe il appartient | 0 | `classerIceberg()` |
| type | ce que le fichier EST | 0 | recensement |
| moment | QUAND il intervient | 0 | `momentsDeLOutil()` |
| domaine | SUR QUOI il regarde | **22** | `domainesDeLOutil()` |

**Un cinquième axe n'a aucun domicile** : « pour QUI il travaille » (le jeu, l'Agence, les deux) a
été mesuré le 2026-09-24 et **aucun registre ne le porte**. Il n'entre pas dans le compte : le
compter absent partout serait faux, ne pas en parler le ferait disparaître.

## 2. Ce que la mesure change à la cible, et personne ne l'avait vu

**Les 22 scripts « sans domaine » ne manqueront jamais de domaine.** Un script qui ne lit aucun
chemin dans du code exécuté — une bibliothèque, un fichier de données — n'a pas de domaine à porter.
Ce n'est pas un trou, c'est une absence légitime.

**Conséquence directe : viser 100 % sur ce dénominateur serait viser l'impossible**, et un objectif
inatteignable se fait abandonner. Le dénominateur du signal de fin est donc lui aussi à trancher.

## 3. Le lien avec l'organisation — la seule partie qui était déjà claire

L'organigramme doit **se DÉRIVER de la classification** au lieu d'être tenu à la main. C'est exactement
ce que l'Article 24 exige. **Une partie est faite** : depuis la bascule du 2026-09-25 (#754/#755), les
familles ne sont plus recopiées — l'organigramme se reconstruit à chaque exécution depuis les données
réelles (`node scripts/cassandra-rh.mjs organigramme`), et deux garde-fous empêchent les deux
rangements de re-diverger. **Ce qui reste tenu à la main** : le fichier `organisation-agence.md`
lui-même, dont le détail par famille a été retiré le 2026-09-25 au profit de la commande.

## 4. Ce qui reste à TRANCHER — quatre questions, aucune n'est à moi

1. **La cible.** À quelle classification finale veut-on arriver ? Trois réponses plausibles, très
   différentes : *(a)* tout script porte ses cinq axes, point ; *(b)* tout script porte les axes qui
   ont un SENS pour lui, et les absences légitimes sont déclarées ; *(c)* on s'arrête dès que
   l'organigramme se dérive tout seul, le reste étant du confort.
2. **Le dénominateur du signal de fin.** Les 22 scripts sans domaine comptent-ils comme incomplets,
   ou sortent-ils du calcul avec une raison écrite ?
3. **Le cinquième axe.** « Pour qui travaille cet outil » reçoit-il un domicile (un registre, comme
   les quatre autres) ou reste-t-il une mesure à la demande ?
4. **Le second volet du signal.** « Chaque axe a servi au moins une fois à une décision réelle » ne
   se mesure pas : rien ne relie mécaniquement un axe à la décision qu'il a changée. Faut-il le
   rendre mesurable (une trace explicite à chaque usage) ou le juger à la main ?

## 5. Plan d'action (Article 28)

| Constat | État | Tâche |
|---|---|---|
| Le chantier n'avait ni cible écrite ni signal de fin | **RETENU — FAIT** | `cadrage` construit et lancé, 71,8 % mesuré, 9 contre-tests (#743) |
| Les 22 scripts sans domaine ne manqueront jamais de domaine | **À TRANCHER** | question 2 ci-dessus |
| Le cinquième axe n'a aucun domicile | **À TRANCHER** | question 3 — tâche #741 déjà ouverte sur ce sujet |
| « Chaque axe a servi à une décision réelle » n'est pas mesurable | **À TRANCHER** | question 4 |
| La cible finale elle-même | **À TRANCHER** | question 1 — c'est un choix, donc le sien |
