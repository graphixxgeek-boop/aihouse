# NOS TROIS ZONES MESURENT-ELLES LA BONNE CHOSE ? — trois mesures, trois réponses

<!-- ARBORESCENCE — bloc généré par `node scripts/the-king.mjs cascade --inserer`, ne pas éditer à la main -->

**Où ce document se situe dans la cascade** — remonté des déclarations « DÉCOULE DE » réelles, jamais dessiné à la main :

```
grand-projet/01-absorption/relecture-de-la-bibliotheque
    └── ▣ grand-projet/02-strategie/le-noyau-est-il-vraiment-extractible   ← CE DOCUMENT
        (aucun document ne déclare découler de celui-ci)
```

<!-- /ARBORESCENCE -->

*(Nuit du 2026-09-29 au 30, heure LUE, source système. Tâche **#1262**.
Il n'a pas demandé ce document : il vérifie une phrase de SES documents qui accusait le manifeste
que j'ai écrit il y a deux jours — *« un fichier séparé n'est pas automatiquement un module
extractible »*.)*

> **DÉCOULE DE :** `docs/grand-projet/01-absorption/relecture-de-la-bibliotheque.md`
> *il instruit un constat que la relecture avait classé « à trancher » ; il mesure, il ne tranche pas.*

---

## POURQUOI CE DOCUMENT EXISTE

**Le manifeste de l'Agence annonce trois zones : 74 fichiers « noyau », 9 « produit », 10
« câblage ».** Ce chiffre dit, implicitement, que le noyau est un bloc propre qu'on pourrait
emporter ailleurs. **C'est ce « implicitement » qu'on va mesurer.**

Une phrase de ta TARGET ARCHITECTURE en doute : *« un fichier séparé n'est pas automatiquement un
module R3 ou R4 »* — c'est-à-dire : **le rangement en fichiers ne prouve pas la portabilité.**
Je l'avais relue cette nuit, sans la vérifier. C'est vérifié maintenant.

---

## TROIS MESURES, ET ELLES NE DISENT PAS LA MÊME CHOSE

### ① Le graphe des dépendances — **99 % propre**

*La question : un fichier « noyau » a-t-il besoin d'un fichier qui n'est pas du noyau ?*

| | |
|---|---|
| fichiers « noyau » | **74** |
| sans **aucune** dépendance hors zone | **73 (99 %)** |
| avec au moins une | **1** — `process-simulation-guardian` dépend de `summarize-simulation-log` |

**Par cette mesure, l'extraction est quasi triviale.** Un seul lien à couper.

### ② Les ancres de ce projet — **56 % en portent une**

*La question : le fichier NOMME-t-il des chemins qui n'existent que dans ce dépôt-ci ?*

| | |
|---|---|
| fichiers « noyau » citant `CLAUDE.md`, `docs/suivi/`, `docs/referentiel/`… | **41 (56 %)** |
| n'en citant aucun | **32 (44 %)** |

**Déjà moins joli.** Mais ce n'est pas encore disqualifiant : un chemin peut être un simple
réglage par défaut, que le prochain projet remplace sans toucher au code.

### ③ Ces ancres sont-elles RÉGLABLES ? — **5 %**

*La question qui décide : peut-on changer ces chemins de l'extérieur, ou faut-il rouvrir le code ?*

| | |
|---|---|
| fichiers dont **toutes** les ancres sont réglables *(constante en tête, ou valeur par défaut d'un paramètre)* | **2 (5 %)** |
| avec au moins une ancre **écrite en dur dans un corps de fonction** | **38 (95 %)** |

Les plus concernés : `le-classificateur` (**37** occurrences en dur), `circle-tasks` (28),
`god-of-all-process` (26), `angel-of-ia-process` (25), `le-coordinateur` (21) — et
**`safe-export` lui-même (18)**, ce qui ne manque pas de sel pour le Gardien de l'exportabilité.

---

## CE QUE ÇA VEUT DIRE, ET CE QUE ÇA NE VEUT PAS DIRE

**La phrase de ta TARGET ARCHITECTURE est vérifiée sur notre propre dépôt.** Selon qu'on regarde
le graphe des dépendances ou les chemins écrits en dur, le même noyau paraît **99 % portable** ou
**5 % portable**. **Ce ne sont pas deux opinions : ce sont deux questions différentes, et notre
manifeste ne répondait qu'à la première sans le dire.**

**MAIS — et c'est là que je refuse de conclure à ta place** : un `docs/suivi/` écrit en dur n'est
pas forcément un défaut. Tout dépend d'une chose qu'on n'a jamais tranchée :

> **`docs/suivi/`, `CLAUDE.md`, `docs/referentiel/` sont-ils des chemins PROPRES À CE PROJET,
> ou des CONVENTIONS DE L'AGENCE que tout projet qui l'installe adoptera ?**

- **Si ce sont des conventions** : les 38 fichiers sont parfaitement corrects. Le prochain projet
  aura son `docs/suivi/`, et le code marchera tel quel. **Il n'y a rien à faire.**
- **Si ce sont des chemins de ce projet** : il y a 38 fichiers à rendre réglables, et le manifeste
  annonce une portabilité qu'il n'a pas.

**C'est une décision de conception, et elle t'appartient.** Je ne la prends pas, et je ne construis
pas de garde-fou avant qu'elle soit prise : un détecteur qui signalerait 38 fichiers alors qu'ils
sont corrects serait une alarme qu'on cesserait de lire dès le deuxième passage (leçon L4/L6).

**Mon avis, puisque tu le demandes toujours** : ce sont des **conventions**, et il faudrait
l'ÉCRIRE. Une Agence qui impose sa façon de ranger les documents est cohérente avec ce qu'elle
est — ce qui ne va pas, c'est que cette convention ne soit **déclarée nulle part**, si bien qu'un
repreneur ne peut pas savoir si `docs/suivi/` est une loi ou un accident.

---

## CE QUE CETTE MESURE N'EST PAS

- **Ce n'est pas un parseur.** J'ai compté des motifs sur des lignes de texte, hors commentaires.
  Une ligne peut être mal classée. Les ordres de grandeur tiennent ; le chiffre exact, non.
- **Ce n'est pas une accusation de mauvais travail.** Écrire `docs/suivi/` en dur dans un outil
  dont le métier EST de lire ce dossier était le geste juste au moment où il a été fait.
- **Aucun outil existant ne couvrait cette question**, vérifié : le détecteur de fuites de
  SAFE-EXPORT cherche **les marques du JEU** (Lia, Noé, la maison, Gemini) dans **les blueprints**.
  Il ne regarde jamais **les chemins de l'AGENCE** dans **les scripts**. Ce sont deux fuites
  différentes, et la seconde n'avait personne.

---

## PLAN D'ACTION *(Article 28)*

| Constat | État | Ce qu'il devient |
|---|---|---|
| Le même noyau paraît 99 % ou 5 % portable selon la mesure choisie | **RETENU** | tâche **#1262** — ce document, et le manifeste sera amendé quand la question ci-dessous sera tranchée, jamais avant |
| Les chemins de l'Agence dans ses propres scripts ne sont mesurés par personne | **RETENU** | tâche **#1262** — la mesure existe désormais, écrite ; sa transformation en garde-fou attend la décision |
| `docs/suivi/` : convention de l'Agence, ou chemin de ce projet ? | **À TRANCHER** | c'est la question qui décide des 38 fichiers, et elle rejoint le **LOT D** des cinq lots (le cadre) |
| Construire le cinquième détecteur de SAFE-EXPORT | **ÉCARTÉ POUR L'INSTANT, avec sa raison** | il signalerait 38 fichiers qui sont peut-être tous corrects. Une alarme fausse au premier passage est une alarme qu'on cesse de lire (L4/L6). Il se construira le jour où la convention sera déclarée — et il vérifiera alors qu'on la respecte, ce qui est utile |
| Le lien `process-simulation-guardian` → `summarize-simulation-log` | **ÉCARTÉ, avec sa raison** | c'est un lien entre deux outils de simulation, pas une fuite vers le jeu. Le couper n'apporterait rien : les deux partiraient ensemble |
