# Registre — check-house (le filet de sécurité)

**Ce qu'on note ici.** Pas les passages (il tourne à chaque commit, une ligne par passage serait
illisible et inutile) : **ce qu'il a ARRÊTÉ**, et ce que ça aurait coûté sans lui. C'est la seule
information qu'on ne peut lire nulle part ailleurs — un commit refusé ne laisse aucune trace une
fois le défaut corrigé.

| Date | Ce qu'il a arrêté | Ce qui en a découlé |
|---|---|---|
| 2026-09-24 | **Cinq commits refusés** pour un horodatage daté dans le futur : l'heure avait été TAPÉE de mémoire au lieu d'être lue. Ce n'était pas de l'inattention — une IA n'a pas d'horloge, elle déduit l'heure du dernier horodatage vu passer, et cette déduction dérive à chaque minute de travail. | **Naissance de l'Article 32** (« Le temps réel se LIT, jamais ne se déduit ») et de AGENT-DU-TEMPS. Cinq refus valaient mieux qu'une date fausse archivée. |
| 2026-09-24 → 2026-09-26 | **`findLanceursPrematures()` : quatre outils** dont le `main()` partait AVANT des constantes de niveau module — zone morte temporelle. L'outil paraît fini et plante au premier vrai lancement. | Lanceur déplacé en toute fin de fichier dans chacun, avec un commentaire disant pourquoi. Le défaut se déclenche à la seconde où un `const` descend sous la ligne du lanceur : aucune relecture humaine ne l'attrape. |
| 2026-09-26 | **Une famille d'outil DÉDUITE au lieu d'être LUE** : pure-gold-unity classé sous « Les Prophètes » parce que son sujet le suggérait, quand l'organigramme le range sous « Les Anges ». | Règle confirmée : une famille se LIT dans le registre, jamais ne se devine — Article 24, appliqué à un classement plutôt qu'à une liste. |
| 2026-09-26 | **Deux registres créés sans couverture de Ronde**, refusés à la seconde où les `index.md` sont apparus. Puis trois de plus le même jour, pendant le comblement des kits d'export. | Chacun déclaré dans `CIRCLE_AUTO_COVERED_REGISTRIES` avec sa raison écrite. Le garde-fou a fait exactement son travail à cinq reprises dans la même journée. |
| 2026-09-26 | **Deux assertions ont bougé TOUTES SEULES** en ajoutant l'axe `vitalite` au registre de classification — sans qu'aucun chiffre ait à être édité. | La preuve que la dérivation tient (Article 24). Et la règle appliquée sans exception : on aligne la FIXTURE, jamais l'assertion. |
| 2026-09-26 | Kit d'export : ses trois pièces documentaires manquaient — le filet qui protège tout le monde n'avait ni plan, ni fiche, ni registre. | Ce fichier, plus `docs/check-house-blueprint.md` et `docs/referentiel/check-house.md`. |
