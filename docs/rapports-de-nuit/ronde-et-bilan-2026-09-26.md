# LA RONDE DU MATIN, ET LA CONFRONTATION AVANT/APRÈS

*(2026-09-26, 08h07 UTC — heure LUE via AGENT-DU-TEMPS, source système. Points 29 et 30 du plan de
nuit `docs/rapports-de-nuit/plan-nuit-2026-09-26-v2.md`. Tâches #923 et #924.)*

**Ce document COMMENTE des rapports d'outils, il ne les remplace pas** (Article 31). Chaque chiffre
ci-dessous vient d'un fichier produit par un outil, nommé à l'endroit où il est cité.

---

## 1. LA RONDE — 31 items en paramètres recommandés, mode autonome

Ouverture : **mode autonome**, la seule dispense que `autoriseCloture()` accepte sans fenêtre —
« aucune fenêtre y compris GOAT/AUTO ne doit être bloquante pour le mode autonome », sa décision.
Clôture enregistrée : `record-run --autonome`, commit #779.

**Les quatre verdicts qui n'appelaient rien** : THE-KING (philosophie fraîche, aucune tension),
CLEAN-DIRTY-OLD (Gardien sacré, plan prioritaire vide), SMART-CONSO-TOKEN, check-profil-utilisateur.
Un plan vide est une information, pas un trou.

### Ce que la Ronde a trouvé, et ce que j'en ai fait

| Constat | Outil | État | Ce que ça devient |
|---|---|---|---|
| **5 outils ont une ligne de commande et n'enregistrent PAS leur passage** | tool-brain | **RETENU — CORRIGÉ CETTE NUIT** | `recordCliUsage()` câblé dans les 4 scripts réels. Le 5e était un doublon d'identité, voir ci-dessous |
| **L'étape manuelle de tool-learning sautée 5 fois de suite** : 5 passages, 0 verdict écrit | tool-learning | **RETENU — FAITE CETTE NUIT** | 3 verdicts écrits sur preuve citable : ARGUS *apprend*, SAFE-EXPORT *apprend*, CLONE-HUNTER *immobile* |
| **CLONE-HUNTER jugé « immobile », et rien n'en a encore été fait** | tool-learning | RETENU | → **#925** — lui donner une mémoire qu'il relit, ou écarter le verdict avec sa raison |
| **24 dossiers de `docs/` sans décision HTML/texte enregistrée** | doc-report | RETENU | → **#926** — et la vraie question n'est pas « trancher 24 fois », c'est **dériver** la décision au lieu de la recopier (Article 24) |
| **11 données FRAÎCHES que personne ne relit, 15 que seul leur producteur relit** | data-archangel | RETENU | → **#927** — un lecteur, ou une absence assumée avec sa raison |
| **80 noms en service, 0 validé au registre des baptêmes — qui n'existe pas** | agent-des-noms | À TRANCHER | c'est SA décision : créer le registre, ou décider qu'il n'en faut pas. Le chiffre mesure aujourd'hui l'absence du registre, jamais une dette de nommage |
| **1 relancement confirmé dans les 10 min suivant un épuisement de quota** | Smart Conso API | RETENU | **réglé par la nuit elle-même** : aucun appel API n'a été passé cette nuit. La règle tient : attendre `check-gemini-quota.mjs`, jamais réessayer à l'aveugle |
| **X6 « le POURQUOI vit à côté du QUOI » vérifiée seulement en partie** | THE-EQUALIZER | ÉCARTÉ | **la limite est déclarée, pas subie** : les deux bouts mécaniques sont couverts (absence ET disparition d'une raison). Ce qui reste — la QUALITÉ d'une explication — n'est jugeable par aucun programme, et le dire EST la protection (Article 27) |
| **4 leçons jamais remontées en ~300 occasions chacune (L7, L9, L17, L18)** | tool-learning | À TRANCHER | poids mort ou angle mort du sélecteur ? Les deux lectures sont plausibles et appellent des gestes opposés — voir **#928** |
| **14 points fragiles ouverts** | kpi-report | ÉCARTÉ | un point fragile est une zone EN ATTENTE d'une décision de conception, jamais un bug actif. Le traiter automatiquement reviendrait à trancher à sa place |

### La trouvaille sous la trouvaille : un script, deux identités

Corriger les 4 outils muets a fait remonter ce qui se cachait dessous. **`check-spirit.mjs` porte
DEUX slugs dans le dépôt** : `check-spirit` dans le catalogue PRESTATIONS — celui que le compteur
d'usage interroge — et `check-spirit-mjs` dans son propre en-tête de rapport et dans
TOOL_RELIABILITY. Le script utilise les deux, à six lignes d'écart.

**Pourquoi ça compte, et ce n'est pas cosmétique** : enregistrer le passage sous la mauvaise
identité aurait donné le pire des deux mondes — le passage compté quelque part, et le compteur
continuant d'afficher « jamais sollicité ». Sur l'outil qui veille sur l'Article 0, et dont la
conclusion naturelle d'un zéro est « relance-le », ce qui coûte de vrais appels API.

L'enregistrement écrit donc sous le slug du CATALOGUE, avec la raison en commentaire. **Unifier les
deux est un RENOMMAGE, donc sa décision** — → **#929**.

---

## 2. LA CONFRONTATION AVANT/APRÈS — et le chiffre qui dérange

Source : `docs/check-tasks-details/bilan-taches-2026-09-26T08-07Z.txt`, confronté à
`docs/rapports-de-nuit/plan-depart-2026-09-26.txt` (97 tâches, figé à 05h10 avant de commencer).

```
      Encore ouvertes aujourd'hui ................ 97
      CLOSES depuis .............................. 0
      NÉES depuis ................................ 7
      Ouvertes aujourd'hui ....................... 104
      Renouvellement de la file .................. 7 %
```

**ZÉRO des 97 tâches de référence a été fermée cette nuit.** Le chiffre est exact et il se dit
sans le contourner.

**Ce qu'il veut dire, et ce qu'il ne veut pas dire.** La nuit n'a pas travaillé sur la file : elle a
exécuté les 31 points de son gros prompt, qui sont des demandes NEUVES. Les 20 tâches ouvertes cette
nuit (#903 → #922) sont nées de ce travail, et **13 ont été fermées dans la foulée**. La file de
référence n'a jamais été la cible — mais elle n'a pas bougé d'un millimètre non plus, et c'est
exactement le « tapis roulant » qu'il redoute.

**UNE FAIBLESSE DE MESURE, trouvée en lisant le rapport plutôt qu'en le résumant.** « NÉES depuis :
7 » ne compte que les nouvelles tâches ENCORE OUVERTES (104 − 97 = 7). Les 13 nées et fermées dans
la même nuit sont invisibles : elles n'apparaissent ni en « closes » (elles ne sont pas dans les 97
de référence) ni en « nées » (elles ne sont plus ouvertes). **Une nuit qui ouvre 20 tâches et en
ferme 13 s'affiche donc exactement comme une nuit qui en aurait ouvert 7 et n'aurait rien fait.**
C'est précisément la distinction qu'il avait demandée — « 117 tâches ne veut rien dire en soi » —
et la confrontation ne la porte pas encore. → **#930**.

### Les autres chiffres du bilan

- **855 lignes suivies**, numéros #117 → #922, **748 terminées (87 %)**, 104 ouvertes ;
- **104 ouvertes réparties en 12 blocs par thème**, couverture 88 % — Process (12), Ronde (10),
  Outillage (9), Agence (9) en tête ;
- **18 tâches ATTENDENT une décision** qui n'est pas celle de l'agent ;
- **7 tâches ouvertes nomment une commande qui existe déjà** — à vérifier une par une, jamais à
  clore sur ce seul signal (dont #907 et #910, ouvertes cette nuit même).

---

## PLAN D'ACTION

| État | Constat | Ce que ça devient |
|---|---|---|
| **RETENU** | 4 outils muets au compteur d'usage | **fait cette nuit** — `recordCliUsage()` câblé, vérifié en relançant tool-brain |
| **RETENU** | l'étape manuelle de tool-learning, sautée 5 fois | **faite cette nuit** — 3 verdicts sur preuve citable |
| **RETENU** | CLONE-HUNTER immobile, sans suite | → #925 |
| **RETENU** | 24 dossiers sans décision HTML/texte — à DÉRIVER, pas à recopier | → #926 |
| **RETENU** | 26 données sans lecteur réel | → #927 |
| **RETENU** | la confrontation avant/après efface les tâches nées ET fermées dans la même période | → #930 |
| **À TRANCHER** | le registre des baptêmes : le créer ou décider qu'il n'en faut pas | sa décision — 80 noms concernés |
| **À TRANCHER** | 4 leçons jamais remontées : poids mort, ou angle mort du sélecteur ? | → #928 |
| **À TRANCHER** | `check-spirit` / `check-spirit-mjs` : un script, deux identités | → #929 — c'est un renommage, donc sa décision |
| **ÉCARTÉ** | X6 partielle chez THE-EQUALIZER | la part restante n'est jugeable par aucun programme, et c'est déclaré (Article 27) |
| **ÉCARTÉ** | 14 points fragiles ouverts | ce sont des décisions de conception en attente, jamais des bugs |
| **ÉCARTÉ** | le relancement rapide après épuisement de quota | aucun appel API cette nuit : la règle a tenu d'elle-même |
