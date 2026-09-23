# Process « état des tâches » — le dossier de process

*(Écrit le 2026-09-23 d'après le schéma donné par l'utilisateur, étape par étape. Septième process
déclaré du projet.)*

**RÈGLE D'ÉCRITURE EN TÊTE** : tout mécanisme construit pour ce process s'inscrit ICI, pas seulement
dans `docs/suivi/`. Le suivi date ce qui a été FAIT ; le process dit ce qui EST.

---

## Partie 1 — Ce que ce process existe pour empêcher

**Le problème, dans les mots de l'utilisateur** : « il y a une logique de déroulement des tâches,
mais j'ai tendance à souvent la perturber en intercalant de nouvelles tâches ».

Une file de tâches ne se dégrade pas en perdant des tâches — elle se dégrade en perdant son ORDRE.
Chaque urgence intercalée est légitime prise seule ; c'est leur accumulation qui finit par rendre la
file illisible, jusqu'à ce que plus personne ne sache ce qui vient après quoi ni pourquoi.

**Le but ultime de ce process est donc RÉORGANISER LA FILE**, et tout le reste — le document, les
chiffres, l'analyse — n'existe que pour rendre cette réorganisation possible en connaissance de
cause. Un état des lieux qui ne se solde par aucun réordonnancement a échoué, même exact.

---

## Partie 2 — Le déclencheur, et les deux branches

**Déclencheur** : l'utilisateur demande un état des lieux des tâches, ou une expression équivalente.
Une fenêtre s'ouvre alors pour lui demander laquelle des deux branches il veut.

### Branche 2 — l'état rapide (volontairement décrite en premier, elle est plus simple)

Tout se passe dans la conversation. L'agent construit lui-même la réponse : **un résumé clair et
utile**, jamais un déversement de chiffres. Aucun document produit, aucun archivage.

### Branche 1 — l'état complet, en onze étapes

| # | Étape | Ce qu'elle produit |
|---|---|---|
| 1 | **Récupérer** la donnée sur les tâches, partout où elle est — `scripts/check-tasks-details.mjs` en priorité, c'est l'outil dédié et le contrôleur de ce process | la matière brute |
| 2 | **Analyser** | le sens de cette matière |
| 3 | **Construire le schéma** : une arborescence qui montre où on en est et met le curseur | la vue d'ensemble |
| 4 | **Résultats d'analyse** à trois échelles : à l'instant · plus généralement · au niveau du projet entier | la profondeur de champ |
| 5 | **Livrer le document** dans la conversation, et l'archiver | **1ʳᵉ partie : de quoi décider VITE. 2ᵉ partie : le rapport complet et détaillé.** |
| 6 | **Demander** à l'utilisateur d'ouvrir le document et de décider des prochaines tâches | la main lui revient |
| 7 | **La fenêtre de flagage** — celle qui permet d'étiqueter les tâches | son arbitrage |
| 8 | **Analyser ses réponses**, avec commentaire dans la conversation | ce que son arbitrage change |
| 9 | **Une mini-frise** dans la conversation, qui résume le plan choisi et l'ordre des tâches | l'ordre, visible d'un coup d'œil |
| 10 | **Mettre le plan à jour** partout où c'est nécessaire | la file réellement réorganisée |
| 11 | **Proposer d'enchaîner** sur la prochaine tâche prévue | la reprise du travail |

**L'ORDRE DES DEUX PARTIES DU DOCUMENT N'EST PAS COSMÉTIQUE** (étape 5, exigence explicite) : un
rapport qui commence par le détail oblige à tout lire avant de pouvoir décider, et repousse donc la
décision à plus tard — c'est-à-dire souvent à jamais.

**Sur les « 10 secondes » de l'étape 7** : l'intention, confirmée au calibrage, est de laisser le
temps d'ouvrir le document — pas un délai mesuré. Le document est annoncé, la fenêtre suit.

---

## Partie 3 — Le flagage, et pourquoi il ne peut pas être automatique

L'utilisateur flague pour deux raisons qu'il a nommées : **il peut y avoir un doute**, et **ça attire
son attention**. La fenêtre n'est donc pas une formalité de validation : c'est le moment où un humain
regarde la file en entier, ce qu'aucun passage tâche par tâche ne permet.

**Le cliquet s'applique ici** : une tâche déjà classée CRITIQUE, URGENT ou PRIORITAIRE ne peut être
que surclassée, jamais redescendue (cf. `scripts/priorites.mjs`).

**QUAND L'UTILISATEUR N'EST PAS LÀ** (nuit autonome) : la fenêtre n'est pas supprimée, elle est
**PRÉPARÉE ET REPORTÉE**, avec la date de l'état des lieux qui l'a produite, et posée EN PREMIER à
son retour. C'est la distinction déjà tranchée pour la Ronde nocturne : l'absence DIFFÈRE une
question, elle ne l'efface pas — sinon, plus les nuits autonomes se multiplient, plus sa voix se
réduit, jusqu'à un dispositif qui ne l'interroge plus jamais tout en paraissant tourner.

---

## Partie 4 — L'archivage

**Tous les états des lieux sont conservés, avec un index** (`docs/etat-des-taches/`). La raison n'est
pas la collection : c'est que **comparer deux états dans le temps est la seule façon de voir si la
file avance ou stagne** — ce qui manque aujourd'hui. Un fichier unique toujours écrasé rendrait
impossible de dire « il y a deux semaines on avait 11 tâches ouvertes, aujourd'hui 14 ».

---

## Partie 5 — Ce que ce process NE fait pas

- **Il ne touche pas au process de la Ronde.** Décision explicite : « on ne touche pas au process
  établi dans circle pour l'instant ». Une comparaison côte à côte est livrée séparément pour que
  l'utilisateur décide lui-même s'il faut harmoniser, remplacer, ou garder les deux.
- **Il ne réordonne rien tout seul.** Il produit la matière, pose la question, et applique la
  réponse. Réorganiser la file sur le seul jugement de l'agent viderait de son sens l'étape qui est
  le but du process.

## Partie 6 — Le responsable, inscrit dans le code (ajoutée le 2026-09-23)

La promotion de check-tasks-details en **responsable de l'organisation des tâches** ne vit pas
seulement dans cette conversation : elle est écrite dans son code
(`RESPONSABLE_ORGANISATION_TACHES`, `scripts/check-tasks-details.mjs`). C'était délibéré — un rôle
qui n'existe que dans un échange ne survit pas à la session qui l'a accordé (Article 27).

Ce que ce rôle lui donne concrètement, et qui n'existait pas avant :

- **`palierDeLaLigne()` / `signauxDeLaLigne()`** — lire, sur une ligne de suivi réelle, le palier de
  priorité et les signaux mesurables qui le justifient, au lieu de les deviner à la lecture.
- **`fileOrdonnee()` / `formatFile()`** — rendre la file des tâches ouvertes dans l'ordre que les
  paliers imposent, jamais dans l'ordre d'écriture.

Les règles de priorité elles-mêmes vivent à part (`scripts/priorites.mjs`) et non dans ce fichier :
check-tasks-details est classé SENSIBLE par tool-brain (plus de mille lignes, seize dépendants), et
y coudre une échelle de six paliers aurait ajouté de la surface à un fichier déjà lourd. Le
responsable LIT les règles, il ne les héberge pas.
