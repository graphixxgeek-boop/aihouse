# Ronde GOAT MAX du 2026-09-23 — ANALYSE et PLAN D'ACTION

*(33 items sur 34 · 27 minutes · mode GOAT MAX choisi par l'utilisateur, les deux agents séparés
cochés explicitement. Rapport brut : `RAPPORT.txt` / `RAPPORT.html`. Ceci n'est pas un
récapitulatif — c'est un TRI : ce qui compte, ce qui ne compte pas, et pourquoi.)*

---

## Le fil qui relie presque tout ce que cette Ronde a trouvé

Un seul défaut, décliné six fois : **un contrôle qui regarde une TRANCHE rend un chiffre juste sur
sa tranche et faux sur le tout — et le vert qu'il affiche est plus dangereux qu'une absence de
contrôle**, parce qu'il occupe la place.

| Le contrôle | Sa tranche | Ce qu'il a manqué |
|---|---|---|
| dates futures (`check-tasks-details`) | les tâches encore OUVERTES | 43 des 44 lignes fautives, déjà « terminée » |
| `recommendRereadBoundary()` | ce qu'on lui passe en argument | le registre entier, qu'elle ne lisait jamais |
| registre `idees-a-trancher` | ce qui y est écrit | qu'il est vide depuis deux jours |
| KPI « Qualité de sortie » | les interventions anti-écho | tout ce qu'EL-PROFESSOR note 3/20 |
| tous les outils du paysage | le code et les documents | **ce qui s'AFFICHE** — 215 déplacements cassés, 19 simulations durant |
| relecture Article 13 | les documents récemment touchés | un dossier faux depuis 2 jours que rien n'avait touché |

**Ce n'est pas une coïncidence de six bugs, c'est une même erreur de conception répétée.** Un
détecteur se construit sur un périmètre, et le périmètre devient invisible dès que le détecteur est
vert. C'est la matière de la tâche **#235**.

---

## Le deuxième fil, plus inconfortable

**Le juge extérieur l'a dit en une phrase** : *« l'appareil de mesure construit autour du jeu mesure
désormais l'appareil et plus le jeu »*. Trois chiffres de cette Ronde lui donnent raison :

- le seul instrument qui regarde l'écran (THE-SCREENER) n'avait **jamais** été lancé sur un état réel ;
- un défaut visible sur **un déplacement sur quatre** a traversé **dix-neuf** simulations sans être nommé ;
- la première phrase que lit le visiteur contredit l'Article 0, et **aucun outil du paysage ne lit
  cette phrase**.

**Nuance, et elle est importante** : ce n'est pas un reproche à l'outillage. CLAUDE.md pose
explicitement que l'Agence est le second projet, mené en filigrane, et que le temps qui lui est
consacré n'est jamais une dérive. Le constat n'est pas « trop d'outils » — c'est **« aucun outil sur
le seul terrain qui décide »** : ce qui s'affiche.

---

## PLAN D'ACTION — les trois états, jamais deux

### RETENU — devient une tâche, et la tâche existe pour de vrai

| # | Constat | Source |
|---|---|---|
| **#225** | 215 déplacements affichés sur 873 (24,6 %) cassés : double point ET destination nommée deux fois | THE-FINAL-JUDGE, vérifié à la main |
| **#226** | Le KPI « Qualité de sortie » serait une tautologie — 100 % par construction | THE-FINAL-JUDGE, à confirmer |
| **#227** | Idée « agence exportable V1→V2/V3 » tracée puis EFFACÉE par une réécriture | THE-DEEP-READER |
| **#228** | Outil de vérification logique demandé : ni fait, ni répondu, ni noté | THE-DEEP-READER |
| **#229** | Champ « pour qui » calibré et jamais construit | THE-DEEP-READER |
| **#230** | Audit HARMONIA du KPI : condition remplie depuis 2 jours, jamais lancé | THE-DEEP-READER |
| **#231** | Veille token AU MOMENT de rédiger — ou déclaration d'impossibilité | THE-DEEP-READER |
| **#232** | Usage spontané d'un outil : jamais flagué en positif, seulement en reproche | THE-DEEP-READER |
| **#233** | Optimiser `check-house.mjs` (273 000 tk, 44 % de `scripts/`) — seule puce non traitée de son message | THE-DEEP-READER |
| **#234** | Registre `idees-a-trancher` construit et resté VIDE deux jours | THE-DEEP-READER |
| **#235** | Rentabiliser chaque trouvaille vers TOUS les outils | demande de l'utilisateur |
| **#236** | L'accroche du site contredit l'Article 0 (« reconstruire **ensemble** ») | THE-SCREENER, confirmé à l'écran |
| **#237** | La palette rendue écrase la désaturation pourtant codée | THE-SCREENER, confirmé à l'écran |
| **#223** | Élargir le process charte à tout document de référence | demande de l'utilisateur |

**Corrigés dans la Ronde même, donc pas de tâche ouverte** — mais tracés dans `docs/suivi/` :
44 horodatages futurs (#643) · `recommendRereadBoundary()` (#641) · 4 dettes documentaires (#641) ·
le dossier de conception qui mentait (#645) · le faux positif de chemin mort (#645) · l'estimation
auto-corrective (#645).

### ÉCARTÉ — on a regardé, on ne fait rien, avec la raison écrite

- **X6 — 63 garde-fous sans ligne d'explication.** Pré-existant, porte sur des commentaires de code,
  et `findRaisonsPerdues()` couvre déjà le vrai risque (une raison qui DISPARAÎT). Ajouter 63 lignes
  d'explication à la main serait du volume, pas de la protection.
- **Juger le mode nuit et les transitions graphiques.** Hors de portée d'une capture unique, et la
  refonte graphique est explicitement reportée par l'utilisateur (#92, #605).
- **Les 6 process avec « écarts de connexion process ↔ gardien ».** Lecture faite : dans les 6 cas,
  ce sont des mécanismes CÂBLÉS chez le gardien et non écrits dans le document — jamais l'inverse
  (un seul cas, `integration-outil`). Un gardien qui en fait plus que son document ne trahit
  personne ; c'est le document qui sous-déclare. À traiter avec #223, pas séparément.
- **Les 12 détecteurs « portés par la seule suite de tests ».** `pure-gold-unity` les signale sans
  les compter en faute, et il a raison : le crochet pre-commit lance la suite à chaque commit, donc
  ils protègent réellement. Les faire parler dans leur rapport ajouterait du bruit, pas de la
  sécurité.
- **Le catalogue LE-COORDINATEUR, la photo dream-team, INES-official.** Passés, rien à signaler.
  Aucune action n'est une décision quand elle est écrite.

### À TRANCHER — ce n'est pas la décision de l'agent

1. **Les 14 constats de TOOL-LEARNING.** Aucune entrée du registre de leçons n'a **jamais** été
   jugée APPLIQUÉE par vous — et `enregistrerXp()` refuse par construction un jugement qui ne porte
   pas `parUtilisateur: true`. Sept leçons ne remontent jamais (poids mort), six remontent souvent
   sans jamais avoir été jugées. **Le registre grossit sans qu'on sache s'il change quoi que ce
   soit**, et c'est vous seul qui pouvez le dire.
2. **La rétroactivité du process documents de référence** (#223) — ma recommandation est « non »,
   mais c'est votre appel.
3. **La zone « Cycle jour/nuit »** désignée par la rotation d'ALWAYS-NEW-CODE : une zone recommandée
   n'est pas une dette constatée, et le vrai zoom « page blanche » coûte de vrais tokens.
4. **`docs/referentiel/parametres.md` est profilé mais sans budget** : il peut grossir indéfiniment
   sans qu'aucun avertissement ne se déclenche. Lui en donner un, ou déclarer qu'il n'en a pas besoin ?
5. **14 dossiers de `docs/` sans décision HTML/texte enregistrée**, dont `docs/plans/` que j'ai créé
   aujourd'hui. Trancher en bloc ou dossier par dossier ?

---

## Ce que cette Ronde a coûté, et ce qu'elle a rapporté

| | |
|---|---|
| Durée annoncée à la main | 2 h – 3 h 30 |
| **Durée réelle** | **27 min** *(facteur 5 à 8 — cf. `docs/circle-tasks/estimations.md`)* |
| Tokens des 2 agents | 569 820 *(estimés 280 500 — faux dans l'autre sens)* |
| Constats retenus | **14 tâches** ouvertes |
| Défauts corrigés pendant la Ronde | **6** |
| État final | 219 tests verts · tsc propre · god 0 manquement · 1153 chemins 0 mort |

**Le seul vrai critère d'une Ronde n'est pas « a-t-elle tourné » mais « qu'a-t-elle trouvé que
personne ne savait ».** Réponse : 44 dates fausses, 215 déplacements cassés depuis dix-neuf
simulations, 8 demandes sans trace, un dossier qui mentait depuis deux jours, et une page d'accueil
qui contredit la loi suprême du projet.

## Ce que cette analyse ne dit PAS

Elle trie des constats produits par des outils qui déclarent tous leurs propres limites. Elle ne dit
pas si le projet va bien — elle dit ce qui a été trouvé, et ce qu'on en fait.
