# Ronde CIRCLE-TASKS du 2026-09-25 — paramètres recommandés

*(Ouverte sur sa demande explicite : « place une ronde en parametres recommandés dans le déroulé de
ton travail, continue sans t'arreter ». Il ne l'a pas commandée comme une tâche séparée : il a
demandé qu'elle s'intercale dans le flux — et c'est ce qui a été fait.)*

> **Pourquoi maintenant** : le rappel post-commit annonçait **34 commits sans Ronde**, un compteur
> qui grimpait depuis 30. C'est la tâche #841, qui attendait sa décision — elle vient de l'avoir.

**Programme réellement coché** : 31 items sur 37. Les 6 écartés par défaut sont ceux qui coûtent un
agent séparé ou un vrai raisonnement payant : `referentiel`, `dream-team-photo`, `the-screener`,
`the-final-judge`, `the-deep-reader`, `hyper-scan-checkpoint-light`.

**Étape 2 tenue avant de lancer quoi que ce soit** : estimation inscrite dans
`docs/circle-tasks/estimations.md` AVANT le premier item — 31 min, 165 000 tokens, 0 appel API.
SMART-CONSO-TOKEN consulté puis confirmé : verdict `[avertissement_souple]`.
**Réel : 15 minutes, 0 agent séparé, 0 appel API.** Ratio 0,48 — sur-estimée d'un facteur 2.

## Ce que les 31 items ont trouvé

| Poste | Résultat |
|---|---|
| THE-EQUALIZER | 27/29 exigences · Agence 15/15 ✅ · documents 7/7 ✅ · **code 5/7 ⚠️** (X6 et X7, les deux qui parlent de mémoire — partiel **assumé**) |
| integrationAudit | **38/38 membres** complètement intégrés, aucun script hors organigramme |
| LE-COORDINATEUR (réseau) | **14 vérifications croisées, aucun rouge** |
| god-of-all-process | ✅ gabarit, gardiens, documents, tensions, sondes — **mais 3 dettes documentaires impayées, dont 2 de mes commits du jour** |
| KPI | Robustesse 100 % · couverture du tableau de bord 100 % (2/2 familles atteignables) · Smart Conso 71 % · 4 familles **hors de portée**, jamais comptées en défaut |
| THE-KING | 0 tension sur **171 paires réellement comparées** — un zéro mérité, pas un silence |
| pure-gold-unity | 4/41 outils ne concluent jamais · 1 peut dire « tout va bien » sans mesurer · **19 détecteurs muets, dont 5 écrits aujourd'hui** |
| TOOL-LEARNING | **20 constats À TRANCHER**, tous la même famille : aucune entrée jamais jugée appliquée par lui |
| ecotoken | budget au vert (marge 17 %) **mais la charte a REGROSSI de 160 tokens** depuis le dernier passage |
| check-tasks-details | **30 tâches ouvertes et identiques depuis 6 ou 7 rapports consécutifs** |
| data-archangel | 13 branchements suggérés — suggestions, jamais manquements |
| Smart Conso API | 1 relancement confirmé <10 min après un épuisement réel (tâche #493, ouverte depuis 7 rapports) |
| SMART-CONSO-TOKEN | bilan investissement **NON CONCLUANT** : 20 actions sur 22 jamais classées |
| tool-brain | ✨ **91 sollicitations spontanées sur 93** — le réflexe est réel |
| CLEAN-DIRTY-OLD | carnet muet depuis 6 jours — **deux causes possibles, non tranchées** |
| INES-official | index **vide** : aucune édition jamais produite (tâche #574) |
| CASSANDRA-RH | 38 membres, 38 badges · 9 émetteurs de rapport non certifiés, rang à nommer |
| agent-des-noms · profil · html-wiring · chantiers · correctifs · suivi · idées | aucun écart mécanique |

## Analyse — ce que ces chiffres disent ensemble, et c'est une seule chose

**Le paysage d'outils est en excellent état MÉCANIQUE et en mauvais état DÉCISIONNEL.** Tout ce
qu'un programme peut vérifier est vert : 38/38 membres intégrés, 14 vérifications croisées sans un
rouge, 100 % de robustesse, 0 tension philosophique sur 171 paires. Et en face, tout ce qui demande
un jugement humain s'accumule : 30 tâches figées depuis sept rapports, 20 leçons jamais jugées
appliquées, 14 idées sans décision, 9 rangs sans nom, un registre de baptêmes inexistant.

**Ce n'est pas un reproche, c'est une mesure du goulot.** Le travail mécanique avance sans lui ; le
reste ne peut pas. Et trois outils indépendants ont buté sur les MÊMES numéros ce matin (#492 par
SMART-CONSO-TOKEN, #493 par Smart Conso API, #574 par INES-official) — quand trois mesures séparées
désignent les mêmes tâches, ce n'est plus du bruit de suivi.

**La trouvaille la plus utile n'est venue d'aucun scan, mais du fait de LANCER.** Trois fonctions que
la consigne de Ronde dit d'appeler sans argument levaient un `TypeError` :
`findScriptsMissingFromAgentFiles()`, `findToolsMissingFromMenu()`, `buildOrganigramme()`. La
consigne écrite décrivait un geste impossible, et personne ne le savait parce que les seuls appelants
réels passaient déjà la table. C'est la leçon L2, encore : un outil qu'on n'exécute pas ne signale
jamais qu'il est mal branché.

**Et le garde-fou du jour m'a attrapée moi.** `findChangementsIndirectsSansMiseAJour()` a nommé trois
dettes documentaires dont deux datent de mes propres commits de ce matin. Constater que sa propre
protection vous prend en défaut vaut mieux que de ne pas être pris.

## Plan d'action (Article 28)

| Constat | État | Tâche |
|---|---|---|
| 3 fonctions documentées comme appelables sans argument levaient un TypeError | **RETENU — FAIT** | #847 |
| 3 dettes documentaires impayées, dont 2 de mes commits du jour | **RETENU — FAIT** | #848 |
| Le KPI annonçait « identité déclarée claude-sonnet-5 » sur une session claude-opus-5 | **RETENU — FAIT** | #849 |
| CLEAN-DIRTY-OLD muet depuis 6 jours : passage réel, ou silence correct ? | **À TRANCHER** | #850 |
| 34 commits sans Ronde, 31 vérifications dormantes | **RETENU — FAIT** | cette Ronde ; compteur remis à zéro |
| 20 leçons jamais jugées appliquées (TOOL-LEARNING) | **À TRANCHER** | #842, déjà ouverte |
| 30 tâches figées depuis 6-7 rapports | **À TRANCHER** | #845 et #209, déjà ouvertes |
| 9 émetteurs de rapport non certifiés, rang à nommer | **À TRANCHER** | rattaché à #200 (renommage des rangs) |
| INES-official jamais lancé, index vide | **À TRANCHER** | #574, déjà ouverte |
| La charte a regrossi de 160 tokens | **ÉCARTÉ** | le budget reste à 17 % de marge, et le filon mécanique est épuisé : une passe manuelle sans besoin réel coûterait plus qu'elle ne rend (Article 13, garde-fou non négociable) |
| 13 branchements suggérés par data-archangel | **ÉCARTÉ** | l'outil déclare lui-même que ce sont des suggestions ; en retenir un est une décision, jamais une évidence — et #795 porte déjà le vrai sujet (l'exploitation de la SÉRIE) |
| 19 détecteurs portés par la seule suite de tests | **ÉCARTÉ** | ils protègent pour de vrai (crochet pre-commit à chaque commit) ; pure-gold-unity les signale sans les compter en faute, et c'est le bon comportement |
