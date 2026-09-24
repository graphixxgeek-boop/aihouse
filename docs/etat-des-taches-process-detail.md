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

---

## 2026-09-23 — Criticité et urgence séparées, mot-clé unique, format standard

*(Trois demandes de l'utilisateur, tâches #568, #569 et #570, traitées ensemble parce qu'elles
décrivent le même objet : à quoi ressemble une tâche.)*

### Le défaut, et il était visible dans l'échelle elle-même

> « la classification melange le crtiere de criticité avec le retard : pas bon »

Il avait raison, et la preuve était sous les yeux : **`URGENT-RETARD` (rang 5) est un niveau de
RETARD assis au-dessus de `PRIORITAIRE-OBLIGATOIRE` (rang 4)**, un niveau d'IMPORTANCE. Une tâche
simplement en retard passait donc devant une tâche plus importante, et l'étiquette ne disait plus
laquelle compte vraiment.

### Ce qui remplace, exactement comme demandé

> « un indicateur de criticité seul, qui combine tous les autres critères, y compris le
> "retard/delai". L'etiquette affiche seulement le resultat du calcul : la criticité, pendant
> qu'une petite vignette collé à côté, indique le niveau d'urgence. »

| | Étiquette | Vignette |
|---|---|---|
| **Montre** | la criticité seule | l'urgence, cran + jours |
| **Exemple** | `🟠 IMPORTANT` | `🔴 31 j` |
| **Niveaux** | VITAL / IMPORTANT / UTILE / CONFORT | 🟢 ≤ 6 j · 🟠 ≤ 20 j · 🔴 au-delà |

### La promesse la plus facile à trahir, et elle est tenue

> « le critere d'urgence n'est pas diminué dans le calcul : il est simplement plus visible »

Les signaux liés au temps (`stagnation-confirmee`, `cout-repete`) gardent **exactement** leur poids
dans le score de criticité. Rien n'est retiré du calcul : c'est un mot de retard qui quitte
l'étiquette, pas un critère qui quitte la balance. Un test le verrouille explicitement.

### Comment les quatre niveaux sont obtenus — et l'erreur qui a précédé

Ils dérivent du champ `coutDeLAttente` que chaque palier déclare déjà : *attendre abîme* → VITAL,
*attendre coûte / retarde le reste* → IMPORTANT, *attendre ne coûte rien mais faire rapporte* →
UTILE, le reste → CONFORT.

**La première version dérivait du RANG** — quatre tranches égales sur six. Calcul propre, résultat
faux : `URGENT-RETARD` (5 sur 6) remontait en VITAL, c'est-à-dire le mélange à supprimer, reproduit
par l'arithmétique. **Un rang porte déjà la confusion qu'on répare ; s'appuyer dessus la recopie.**
Un test conserve cette version abandonnée pour que personne ne la reconstruise en la croyant plus
simple.

### Le mot-clé unique, et le garde-fou que ce choix impose

Calibré en fenêtre : **un seul mot**, choisi contre la recommandation de deux à quatre mots.
L'utilisateur a été prévenu du risque au moment de choisir — deux tâches finissant sur le même mot
ramèneraient la confusion par une autre porte. Ce risque n'est donc **pas laissé à son attention** :
`findMotsClesEnCollision()` refuse deux tâches OUVERTES portant le même mot, et nomme lesquelles.

La limite aux tâches ouvertes est volontaire : deux tâches closes qui partagent un mot ne gênent
personne, et l'imposer sur tout l'historique rendrait le champ impraticable au bout de cent tâches —
le genre de règle trop stricte qu'on finit par contourner.

**La colonne existe pour de vrai dans le suivi depuis le 2026-09-23**, et c'est la moitié qui
manquait : une règle sur un champ que le registre ne porte pas est une intention. Les 515 lignes de
`docs/suivi/sessions/` ont reçu la colonne `Mot-clé` en 3e position, et les 32 tâches alors ouvertes
ont reçu leur mot.

**Le garde-fou qui la fait tenir** : `findMotsClesManquants()`
(`scripts/check-suivi-fidelity.mjs`) refuse une tâche OUVERTE dont le mot-clé est vide, trop court,
trop vague ou déjà porté par une autre — il ne recopie aucune de ces règles, il les lit dans
`criticite.mjs` (Article 24). Sans lui, un champ facultatif se remplit trois fois puis plus jamais,
et le jour où « #490 » ne dit plus rien à personne, la colonne est là, vide, à prouver qu'on y avait
pensé.

**Deux défauts trouvés en le branchant, et ni l'un ni l'autre par relecture** : (1) lancé sur le
vrai suivi, il a rendu « 0 écart » — la forme de preuve creuse traquée toute cette session ; les
fixtures de `check-house.mjs` existent donc pour prouver qu'il SAIT ÊTRE ROUGE, et c'est la première
qui a révélé (2) que sa branche de collision plantait sur un nom de champ inventé, jamais exécutée
jusque-là.

**La lecture du tableau est ancrée aux deux bouts** (Statut dernier, Détail avant-dernier), jamais
un compte de colonnes supposé fixe : une ligne restée à l'ancien format à 7 colonnes se lit comme
« sans mot-clé » plutôt que de décaler Sujet/Sous-sujet/Criticité d'un cran. C'est exactement ce
décalage qui, pendant la migration, a fait afficher « UTILE » à 26 tâches d'un coup.

### Le format standard

`FORMAT_TACHE` déclare les huit champs en **données**, pas en prose : numéro, horodatage, mot-clé,
sujet, sous-sujet, criticité, détail, statut. `findChampsManquants()` les vérifie et nomme ce qui
manque — un format qui se contrôle, jamais une phrase dans un document que personne ne relit.

**Un seul nom par champ, depuis le 2026-09-23 (tâche #584).** Les lignes réelles portaient encore
`n` et `sensibilite`, les noms d'avant la séparation criticité/urgence. Pendant quelques heures le
format a déclaré les deux orthographes — sans quoi le garde-fou accusait les 31 tâches ouvertes d'un
coup de manquer deux champs qu'elles portaient réellement (L4). Les alias ont tenu pendant la
migration, puis ils ont été retirés avec elle : **deux noms pour un champ sont la dette, jamais la
solution**. Ce qui n'a pas été renommé et ne devait pas l'être : `sensibilite` désigne aussi, dans
`smart-conso-token.mjs` et `ecotoken.mjs`, la sensibilité d'une RÈGLE de la charte — un tout autre
sujet, qu'un renommage par recherche de texte aurait emporté avec le reste.

### Où vivent les règles

> « les regles de priorité [...] doivent etre hebergé dans l'equipe process »

Elles y sont : `scripts/priorites.mjs` héberge l'échelle et le calcul depuis le 2026-09-23,
`scripts/criticite.mjs` héberge la lecture (criticité, urgence, mot-clé, format), et ce document est
le process qui les gouverne. **Sur la question ouverte** (« un process peut éventuellement remplacer
ces regles ? ») : non, et c'est mieux ainsi — un process décrit un DÉROULÉ, une échelle est une
DONNÉE. Les fondre donnerait un document qu'on ne peut plus exécuter et un code qu'on ne peut plus
lire. Ils restent deux, reliés : le process pointe les règles, les règles citent le process.

### Le POIDS d'une tâche — ajouté le 2026-09-24, et ce n'est pas la priorité

*(Chantier 5 du plan de nuit. Sous-commande `node scripts/check-tasks-details.mjs poids`.)*

Le process d'état des tâches répondait à « où en est-on ? ». Il répond désormais aussi à **« celle-ci
est-elle trop grosse pour être lancée d'un bloc ? »** — question distincte, et la confondre avec la
priorité ferait traiter un chantier énorme en premier parce qu'il est urgent.

**La règle de séparation, à ne jamais recomposer autrement** : le **palier de priorité** dit dans
quel ORDRE traiter, le **poids** dit s'il faut DÉCOUPER avant de commencer. Les deux se lisent sur
la même ligne et ne se remplacent jamais.

Trois autres choses se lisent au même endroit et au même moment, ce qui est la raison pour laquelle
elles vivent ensemble plutôt que dans trois outils qui divergeraient (Article 24) :

- la **vignette** d'une tâche lourde, avec le découpage que la ligne énumère déjà — jamais un
  découpage déduit d'une prose, ce qui ferait un outil qui invente la tâche qu'il réclame ;
- le **résumé de tête** des lignes longues, contre le risque qu'une ligne tronquée ne dise plus rien
  d'elle-même ;
- l'**origine** de la tâche (utilisateur / outil / agent / indéterminée), et la marque
  `AUTO-ATTRIBUÉE` que l'agent pose sur ce qu'il se donne lui-même.

La convention complète — seuils, marque, ce que chaque état veut dire — vit dans
`docs/systeme-de-suivi.md`, jamais recopiée ici : c'est une règle du SUIVI, pas une particularité de
cet outil. Ce que la mesure fait et ne fait pas est dans `docs/referentiel/check-tasks-details.md`.
