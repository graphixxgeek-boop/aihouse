# La CLASSIFICATION DES DATA — ce que l'Agence produit, et ce que personne ne rouvre

*(2026-09-26, tâche #921. Point 28 de son gros prompt : « l'inventaire des rapports en txt —
combien, description, à quoi il sert, livré à la Ronde ?, qui le lit, connecté à quoi », suivi de
son arbitrage : « tu analyses le document txt produit, puis tu enchaînes sur la classification des
DATA ». Inventaire brut produit par `node scripts/data-archangel.mjs rapports` →
`docs/data-archangel/inventaire-rapports-2026-09-26.txt`.)*

---

## LE CHIFFRE QUI RÉPOND À SA QUESTION

**282 rapports en txt, 3,7 Mo, dans 40 dossiers. 263 d'entre eux — 93 % — ne sont NOMMÉS nulle
part** : ni dans un script, ni dans un document, ni dans une ligne de suivi.

Un rapport que personne ne nomme n'est jamais rouvert individuellement. Il n'est atteignable qu'en
ouvrant son dossier au hasard, ce que personne ne fait.

## Pourquoi la mesure par DOSSIER ne disait rien, et pourquoi il a fallu descendre au FICHIER

Premier passage, mesure par dossier : **38 dossiers sur 40 sont « relus par un outil »**. Verdict
rassurant et parfaitement inutile — il suffit qu'un script nomme le dossier dans son code pour que
la case soit cochée, et presque tous les dossiers sont nommés quelque part.

**La mesure par fichier sépare vraiment** : 19 rapports nommés, 263 jamais nommés. Et le détail est
sans appel — `simulations` 42 orphelins sur 44, `argus` 37 sur 39, `ecotoken` 36 sur 37.

**La leçon de méthode** : une mesure dont presque tout le monde sort au vert ne dit pas que tout va
bien, elle dit que la granularité est trop grosse. C'est le même défaut, à l'échelle d'un dossier,
que celui trouvé ce soir sur l'échelle de vitalité (#906).

## LES QUATRE CLASSES DE DATA, telles que la mesure les fait apparaître

### 1. La DONNÉE VIVANTE — relue, et par un mécanisme

Les registres `index.md`, `memoire.json`, `.tool-usage-history.json`, `serie.json`, le suivi de la
session en cours. **Elles ne sont pas dans les 282** : ce ne sont pas des rapports, ce sont des
états. Un outil les relit à chaque passage, et leur valeur est dans leur contenu actuel.

### 2. LA PREUVE — écrite une fois, relue une fois, puis gardée pour pouvoir y revenir

Les 19 rapports nommés quelque part, et les dossiers `rapports-de-nuit` (2/4 cités) et
`contexte-projet` (3/3). Ce sont ceux qu'un document désigne : *« voir le rapport X »*. **Ils
justifient leur place au kilo-octet près.**

### 3. LA TRACE — écrite, jamais rouverte, et ce n'est PAS forcément un défaut

Les 263 autres. Deux populations très différentes s'y cachent, et les confondre serait l'erreur :

- **la trace de contrôle** — un scan d'ARGUS, un passage d'ecotoken. Sa valeur n'est pas d'être
  relue, c'est d'exister pour prouver que le contrôle a eu lieu, et de permettre une comparaison
  avec le passage suivant. **Les garder est légitime ; les garder TOUS l'est moins** : 39 scans
  d'ARGUS dont on ne consultera jamais que le dernier et, peut-être, un point de comparaison ancien.
- **le livrable périmé** — un état des tâches de mardi, un inventaire d'avant-hier. Sa valeur était
  dans le moment où il a été lu. Il ne sera jamais rouvert, et il ne prouve rien.

### 4. LE CIMETIÈRE — écrit, jamais rouvert, et hors de portée de tout le monde

**2 dossiers**, `docs/doc-report` et `docs/reponses` : aucun script ne les nomme, aucun `index.md`
ne les liste. Dont — et c'est parlant — le rapport de cohérence outil↔rapport écrit **cette nuit
même**, il y a vingt minutes.

## CE QUE CETTE CLASSIFICATION CHANGE, ET CE QU'ELLE NE CHANGE PAS

**Elle ne dit pas « supprimez 263 fichiers ».** Une trace de contrôle a une valeur de preuve, et
l'effacer coûterait la capacité de comparer. Ce qu'elle dit est plus précis :

- **les trois plus gros dossiers pèsent 1 028 Ko sur 3 738** — `simulations`, `ecotoken`,
  `check-tasks-details`. Une politique de rétention ne se discute que là ;
- **le reste pèse peu et ne coûte rien à garder** — 37 dossiers pour 2,7 Mo, dont beaucoup de
  fichiers de quelques lignes ;
- **ce qui coûte vraiment, c'est la croissance** : le dépôt suivi par git est passé de 2,2 à 19 Mo
  en sept jours (#906), et ces archives en sont une part directe.

## PLAN D'ACTION

| État | Constat | Ce que ça devient |
|---|---|---|
| **À TRANCHER** | 3 dossiers pèsent 1 028 Ko sur 3 738 : politique de rétention (garder N derniers ? compacter ? externaliser ?) | c'est sa décision — elle touche à ce qu'on garde comme PREUVE, et l'agent n'a pas à décider seul de ce qui s'efface. → #922 |
| **RETENU** | 2 dossiers hors de portée de tout le monde, dont un écrit cette nuit | un `index.md` dans chacun suffit à les rendre atteignables — le geste est petit et il est fait dans le même commit |
| **ÉCARTÉ** | Les 263 rapports jamais nommés | **ce n'est pas un défaut en soi.** Une trace de contrôle vaut par son existence, pas par sa relecture. Les compter « gaspillés » serait confondre la preuve et le livrable — et la mesure sert justement à ne plus les confondre |
| **ÉCARTÉ** | Rendre la mesure « qui le lit » plus fine que la borne haute | un script qui nomme un dossier PEUT l'ouvrir : le prouver demanderait d'instrumenter les lectures à l'exécution, pour un gain nul — la mesure par FICHIER, elle, discrimine déjà, et c'est elle qui porte le verdict |
