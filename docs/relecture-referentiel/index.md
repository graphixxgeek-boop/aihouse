# Relecture périodique du référentiel (Article 13) — registre

Ce dossier porte la trace de l'étape `referentiel` de la Ronde : la vérification périodique de TOUS
les documents de référence, que l'Article 13 impose et qu'aucun passage n'avait jamais attestée.

**Pourquoi il naît le 2026-09-23 et pas avant** : le contrôle de la Ronde a cherché ce dossier à son
tout premier passage sur le vrai dépôt, ne l'a pas trouvé, et l'a dit (tâche #556). Le créer VIDE
aurait verdi le contrôle sans rien relire — c'est exactement ce qui n'a pas été fait. Il naît avec
son premier rapport dedans.

**Deux moitiés, et une seule s'automatise.** La partie mécanique
(`findCheminsMortsDansReferentiel()`, `scripts/check-suivi-fidelity.mjs`) vérifie qu'un document de
référence ne cite pas un fichier disparu — un mensonge sur le dépôt, vérifiable sans lire une ligne
de prose. La partie qui demande un jugement — une règle décrite est-elle encore celle qui
s'applique ? — reste la plume de l'agent, et le rapport doit le dire à chaque fois plutôt que de
laisser croire que le vert mécanique couvre tout.

| Date | Passage | Chemins vérifiés | Morts | Absences déclarées | Corrigé |
|---|---|---|---|---|---|
| 2026-09-23 | [Premier passage](2026-09-23-premier-passage.md) | 1136 | 3 → 0 | 3 | 3 documents, dont la charte |
