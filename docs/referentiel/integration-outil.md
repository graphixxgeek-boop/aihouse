# integration-outil — instanciation sur « Maison IA vivante »

Script : `scripts/integration-outil.mjs`. Blueprint générique : `docs/integration-outil-blueprint.md`.
Registre des passages : `docs/integration-outil/index.md`.

## Pourquoi il existe ici

Demande explicite de l'utilisateur, le 2026-09-22 : « ecris quelque part le process integration ou
renforce le si deja existant, pour le rendre plus efficace et te permettre d'integrer plus facilement
un outil ». Il n'existait rien : ni document, ni entrée dans `PROCESSES`, ni gardien.

Le constat chiffré derrière la demande : faire entrer SAFE-EXPORT puis TOOL-LEARNING a demandé
**sept inscriptions manuelles chacun**, chacune révélée en faisant échouer un test. C'est mot pour
mot le diagnostic ouvert de l'Article 24 : « les garde-fous [...] DÉTECTENT l'oubli au lieu de
l'ÉVITER : l'agent reste le mécanisme d'intégration ».

## Les dix registres, et ce que chacun gouverne

| Clé | Fichier | Ce que ça change concrètement |
|---|---|---|
| `fiabilite` | `scripts/lib-shell.mjs` | l'avertissement d'inexactitude affiché en tête de ses rapports |
| `categorie` | `scripts/lib-shell.mjs` | son rang dans l'organigramme (Agent / Gardien sacré / Membre) |
| `domaine-gardien` | `scripts/lib-shell.mjs` | *(selon décision)* les dossiers qu'il surveille, si Gardien |
| `couverture-axa` | `scripts/axa-check.mjs` | sans quoi il est invisible à la couverture de test et à la stagnation |
| `registre-rapports` | `scripts/doc-report.mjs` | décision HTML/texte, index global, journaux orphelins |
| `avertissement` | `scripts/doc-report.mjs` | le fichier porte-t-il réellement l'avertissement |
| `catalogue-coordinateur` | `scripts/le-coordinateur.mjs` | ce que tool-brain peut me recommander |
| `ronde` | `scripts/circle-tasks.mjs` | item périodique **ou** exclusion écrite si déjà câblé au commit |
| `table-maitresse` | `docs/regles-de-travail.md` §7ter | la description détaillée outil par outil |
| `inventaire-charte` | `CLAUDE.md` | le tableau « Inventaire documentaire des outils » |

## Ce qu'il a trouvé à sa première exécution réelle

Conformément à l'Article 25 (« un outil qui n'a jamais tourné contre le vrai dépôt n'est pas un
outil vérifié, c'est une intention »), il a été lancé sur le vrai dépôt avant d'être considéré fini :

- **SAFE-EXPORT et TOOL-LEARNING absents de `PRESTATIONS` depuis leur naissance.** Aucun des sept
  garde-fous ne couvrait ce registre — ils vérifient chacun le leur, et celui-ci n'avait personne.
  Un vrai manque, invisible à tout le reste du dispositif.
- **Trois de ses propres lecteurs cassés**, attrapés par `findLecteursCasses()` avant qu'il ait
  produit le moindre chiffre : ancrage sur la première occurrence du nom (qui tombait dans un
  commentaire 80 lignes plus haut) plutôt que sur la déclaration ; `id:` pris pour `slug:` ; un
  registre dont les entrées nomment les outils en toutes lettres.
- **Une exclusion volontaire réclamée comme un manque** : safe-export est délibérément hors de la
  Ronde (Gardien, il tourne à chaque commit), et l'outil demandait de l'y inscrire. Corrigé en lui
  apprenant à lire `CIRCLE_AUTO_COVERED_REGISTRIES` — l'exclusion déclarée EST la décision.

## Sa limite, déclarée

Aucun mécanisme ne peut m'obliger à le consulter (même honnêteté que tool-brain et
SMART-CONSO-TOKEN, et même raison : rien n'intercepte une action avant qu'elle ait lieu).
L'obligation vit dans l'entrée « Intégration d'un nouvel outil » de `PROCESSES`
(`scripts/god-of-all-process.mjs`), surveillée par god-of-all-process — qui la signale, sans jamais
bloquer (Article 26/28).

## Ses tests

Ses fonctions mécaniques (`findFaitsManquants` côté Ronde mis à part, qui appartient à CIRCLE-TASKS)
sont couvertes par **`scripts/check-house.mjs`** : présence/absence dans un registre, fichier
illisible rendu « non mesurable » plutôt qu'« absent », complétude du plan, et surtout
`findLecteursCasses()` vérifié en direct contre les dix registres réels du dépôt — l'assertion qui a
attrapé trois lecteurs cassés avant qu'ils ne produisent le moindre chiffre faux.

C'est l'étape `tests` du process « Intégration d'un nouvel outil » (`PROCESSES`,
`scripts/god-of-all-process.mjs`), et cette ligne existe parce que `findMecanismesAbsentsDuProcess()`
a signalé le 2026-09-23 que le fichier de tests n'était cité nulle part ici.
