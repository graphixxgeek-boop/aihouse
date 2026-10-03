<!-- DOCUMENT GÉNÉRÉ — produit intégralement par un outil, aucune ligne n'est écrite à la main -->
# Le filet de sécurité — ce qu'il contient, comment on le manipule, ce qu'on peut alléger

> Produit par `node scripts/ezechiel-les-tests.mjs rapport` le 2026-10-03, sur le filet réel.
> Ta demande (P66, option d) : « maîtriser le sujet, sa manipulation, et sa rationalisation ».

## ① CE QU'IL CONTIENT

| | |
|---|---|
| Le fichier | `scripts/check-house.mjs` |
| Lignes de code | 27 639 |
| Groupes de vérification | 418 |
| Assertions (les vérifications élémentaires) | 8 200 |
| Assertions par groupe, en moyenne | 19.6 |

**Un GROUPE est une fonction de test qui se termine par une ligne `Passed:`** — c'est l'unité que
tu vois défiler quand le filet tourne. Une ASSERTION est une vérification élémentaire à
l'intérieur d'un groupe. Les deux comptent : un groupe dit CE QUI est protégé, une assertion dit
À QUEL POINT.

### Où le volume se concentre

Les **10 plus gros groupes** représentent **19 %** des 27 636 lignes de test.

| Lignes | Groupe |
|---|---|
| 1105 | the XP process (2026-09-23, task #221, named by the user) closes the loop the register alone could not: a less… |
| 753 | the weight of each tool and the gain of a reduction are measurable at last (2026-09-25, task #744) — |
| 691 | checkChantierFileFreshness() (task #185) correctly leaves a genuinely fresh preliminary file alone, flags a re… |
| 525 | CIRCLE-TASKS lists exactly its 18 free periodic items (profil, référentiels, KPI, ALWAYS-NEW-CODE signal, corr… |
| 495 | the Agence\ |
| 476 | the « intégration à la Ronde » process (2026-09-23) exists separately from « intégration d |
| 344 | check-tasks-details.mjs stays strictly read-only on docs/suivi/ while flattening every real session row (loadA… |
| 333 | check-tasks-details, the declared guardian of the etat-des-taches process, now really enforces the four mechan… |
| 326 | le système des index (2026-09-26, son point 4 — « vérifier l |
| 315 | the Article 28 chain is now mechanically enforceable end to end (2026-09-23) — dates render in full letters fr… |

**5 titre(s) en double** — deux groupes au même titre testent probablement la même chose deux fois, ou l'un a été copié puis modifié à moitié.

## ② COMMENT ON LE MANIPULE

| Je veux… | La commande |
|---|---|
| le lancer en entier | `node --max-old-space-size=3072 scripts/check-house.mjs` |
| savoir combien de temps chaque groupe coûte | `node scripts/ezechiel-les-tests.mjs mesurer` |
| le lancer en plusieurs parts simultanées | `node scripts/filet-en-parts.mjs` |
| savoir si un test MORD vraiment | `node scripts/ezechiel-les-tests.mjs robustesse` |
| relire ce rapport à jour | `node scripts/ezechiel-les-tests.mjs rapport` |

**Le verdict du filet est son CODE DE SORTIE, jamais le nombre de lignes `Passed`** : une suite
qui s'arrête au milieu affiche des `Passed` jusqu'au point d'arrêt, et ces lignes-là ne prouvent
rien sur ce qui n'a pas tourné.

### Quand il se déclenche tout seul

- {"mesurable":true,"etapes":[{"crochet":"scripts/hooks/pre-commit","ligne":"if ! NODE_V8_COVERAGE=\"$COV_DIR\" node scripts/check-house.mjs > /tmp/check-house-precommit.log 2>&1; then","bloquant":true,"enveloppes":["couverture"]},{"crochet":"scripts/hooks/pre-commit","ligne":"TSC_OUT=$(npx tsc --noEm

## ③ CE QU'ON PEUT ALLÉGER — et ce qu'il ne faut surtout pas toucher

**Le piège de cette question, et il est le seul vrai danger du sujet** : un groupe LENT n'est pas
un groupe INUTILE. Proposer de couper ce qui coûte reviendrait à couper ce qui protège le plus,
puisque les contrôles les plus chers sont ceux qui lisent le vrai dépôt. Ce rapport rend donc le
COÛT et la MORSURE côte à côte, et ne propose jamais de liste à supprimer.

### Ce qui ne mord pas — la seule population légitimement retirable

**Aucun groupe muet, aucune tautologie.** Chaque groupe du filet porte au moins une assertion qui
peut réellement échouer. C'est le résultat qu'on espère, et il veut dire qu'il n'y a rien à retirer
de ce côté-là : l'allègement devra venir de la VITESSE, jamais du nombre de contrôles.

### Où part le temps

Chronométrage de référence : **248 s** sur 411 groupe(s)
*(relevé du 2026-10-03)*

> **LE DÉTAIL PAR GROUPE N'EST PAS RENDU, ET C'EST VOLONTAIRE.** Le chronomètre apparie les
> lignes « Passed » vues à l'exécution avec les groupes découpés dans le texte. Ce recollage
> s'est déclaré **INCOMPLET** : certaines fonctions émettent plusieurs lignes `Passed`, donc
> les deux listes se décalent et chaque coût se retrouverait attribué au mauvais groupe.
> **Le TOTAL reste juste** — c'est une soustraction de deux horodatages. Le détail, non.

C'est une limite de l'outil et non du filet, et elle se corrige : il faut que le découpage
compte les lignes `Passed` plutôt que les fonctions. Tant que ce n'est pas fait, aucune
décision d'allègement ne peut s'appuyer sur un coût PAR GROUPE.

## ④ CE QUE CE RAPPORT NE DIT PAS

Il décrit le filet, jamais la QUALITÉ de ce qu'il protège. Un filet de 411 groupes tous verts peut
parfaitement laisser passer un défaut qu'aucun d'eux ne cherche — c'est ce que mesure la
robustesse (`robustesse`), en cassant exprès le code pour voir si un test s'en aperçoit, et c'est
une autre question.

# PLAN D'ACTION

| État | Constat | Suite |
|---|---|---|
| ✅ MESURÉ | le filet porte 418 groupes et 8 200 assertions sur 27 639 lignes | #1547 |
| ✅ MESURÉ | aucun groupe muet ni tautologique : l'allègement devra venir de la VITESSE, jamais du nombre de contrôles | #1547 |
| → RETENU | le recollage chronomètre↔groupes est INCOMPLET : le total est juste, le détail par groupe serait faux. Le découpage doit compter les lignes `Passed`, pas les fonctions | #1547 |
| ? À INSTRUIRE | 5 titre(s) de groupe en double : même chose testée deux fois, ou copie modifiée à moitié ? | #1547 |
| ? À TRANCHER | le filet bloque au crochet *pre-commit* : faut-il le garder bloquant, ou le passer en partie après coup ? | #1485 |

<!-- /DOCUMENT GÉNÉRÉ -->
