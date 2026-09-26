# Registre — kpi-report (le Tableau de bord interne)

**Note de nommage** : l'outil s'appelle « Tableau de bord interne (KPI) » ; son plan générique vit
dans `docs/tableau-de-bord-blueprint.md` et sa fiche dans `docs/referentiel/tableau-de-bord.md`.
Le script, lui, s'appelle `kpi-report.mjs`. Les trois noms cohabitent depuis l'origine et ne sont
pas alignés — c'est une décision assumée : renommer casserait des renvois pour un gain nul.
La correspondance est déclarée dans l'inventaire documentaire de CLAUDE.md, et
`aliasDocumentaires()` (SAFE-EXPORT) la LIT plutôt que de la deviner depuis le nom du fichier.

**Ce qu'on note ici** : ce que le tableau de bord a révélé sur les MESURES elles-mêmes — un KPI faux
empoisonne toutes les décisions qui s'appuient dessus, et c'est le seul endroit où cette histoire
se lit.

| Date | Ce qu'il a trouvé | Ce qui en a découlé |
|---|---|---|
| 2026-09-22 | **Le KPI « Qualité de sortie » était une TAUTOLOGIE** : il mesurait quelque chose qui ne pouvait pas être autrement que vrai. | Retiré plutôt que corrigé : un indicateur qui ne peut pas descendre n'informe jamais. |
| 2026-09-22 | Les familles dépendant d'un serveur de développement avec du vrai trafic rendaient des chiffres là où il n'y avait aucune donnée. | Elles rendent honnêtement **N/A** quand aucun serveur n'est joignable. La seule famille 100 % mécanique (Robustesse du code) est celle qu'on lit en Ronde. |
| 2026-09-26 | **« 28 outils sur 50 ne concluent pas » — le chiffre était faux**, et c'était la composante la plus basse de la note de l'Agence. Le KPI recalculait sa propre portée sur tout ce qui scanne le dépôt, bibliothèques et crochets compris, alors que la vraie mesure existait déjà : 32 scanners, 26 qui concluent, 5 dispensés avec raison, **UN SEUL** en faute. **44 % contre 100 %** — deux mesures de la même exigence, deux dénominateurs, et c'est la plus basse qui pilotait la note. | Le KPI lit désormais `findOutilsDevantConclure()` au lieu de recalculer. Et l'unique fautif était god-of-all-process : le contrôleur qui constate qu'un rapport sans plan d'action n'est pas fini s'arrêtait lui-même sans conclure. |
| 2026-09-26 | Kit d'export : son registre manquait. | Ce fichier. |
