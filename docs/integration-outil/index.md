# integration-outil — registre des passages

Outil : `scripts/integration-outil.mjs`. Il dit, registre par registre, ce qui reste à renseigner
pour faire entrer un nouvel outil dans l'Agence Codex — en LISANT les fichiers réels, jamais une
liste recopiée qui se périmerait au premier registre ajouté (Article 24).

| Date | Outil intégré | Avant | Après | Trouvailles |
|---|---|---|---|---|
| 2026-09-22 | (construction) safe-export | 7/10 | 10/10 | SAFE-EXPORT et TOOL-LEARNING absents du catalogue PRESTATIONS depuis leur naissance — aucun des sept garde-fous d'intégration ne couvrait ce registre, faute de gardien qui le surveille |
| 2026-09-22 | integration-outil (lui-même) | 0/10 | 10/10 | Trois de ses propres lecteurs cassés, attrapés par son garde-fou `findLecteursCasses()` avant d'avoir produit le moindre chiffre faux : ancrage sur la première occurrence du mot plutôt que sur la déclaration, `id:` pris pour `slug:`, et un registre dont les entrées nomment les outils en toutes lettres |

## Ce qu'il ne fait pas

Il ne remplace aucun garde-fou existant : les sept continuent d'échouer si l'inscription manque.
Il inverse seulement le moment — la liste devient demandable AVANT de commencer, au lieu d'être
découverte un test après l'autre.

Il ne peut pas non plus s'obliger à être consulté. Cette limite est déclarée plutôt que tue (même
honnêteté que tool-brain et SMART-CONSO-TOKEN) : l'obligation vit dans l'entrée « Intégration d'un
nouvel outil » de `PROCESSES` (`scripts/god-of-all-process.mjs`), surveillée par god-of-all-process.
