
## La décision HTML/texte se DÉRIVE, elle ne se recopie pas (2026-09-26, tâche #926)

**Le constat qui l'a motivée, et il se retourne contre l'outil** : `findRegistriesMissingDecision()`
comptait 24 dossiers sans décision enregistrée, et son plan proposait 24 fois « trancher la décision
de `docs/X` et l'inscrire au registre ». Vingt-quatre lignes à recopier à la main dans `REGISTRIES`
— **c'est-à-dire exactement la liste tenue à la main que l'Article 24 interdit**, et qui se
périmerait au prochain dossier créé. Le garde-fou censé attraper la dette en produisait une.

**Ce qui est dérivable — 13 cas sur 23 sur ce dépôt** : un dossier `docs/<slug>/` dont le script
`scripts/<slug>.mjs` existe répond tout seul. Si ce script importe `html-report.mjs` il livre en
HTML, sinon en texte. Ce n'est pas une supposition sur le nom : c'est **le code du producteur, lu**,
donc une décision qui se relit à chaque passage et ne peut pas se périmer.

**Ce qui ne l'est pas — et l'outil le DIT plutôt que de le deviner (leçon L5)** : un dossier sans
script du même nom est ambigu par nature. Il peut être un dossier de documents (`docs/plans`,
`docs/reponses`) ou **le registre d'un outil dont le script porte un autre nom** — et ce n'est pas
théorique : `docs/smart-breaker/` est produit par `check-gemini-quota.mjs`, `docs/tableau-de-bord/`
par `kpi-report.mjs`. Un outil qui trancherait « pas un registre » se tromperait sur ces deux-là.

**Chaque abstention porte son PROPRE indice** — sinon les dix recevaient la même phrase recopiée dix
fois, le travers que le motif de CLONE-HUNTER a déjà corrigé (tâche #217). L'indice :
`scriptsQuiNommentLeDossier()`, qui sépare « 1 script le nomme : `le-coordinateur.mjs` » (piste
sérieuse d'un registre d'outil) de « aucun script ne le nomme » (piste sérieuse d'un dossier de
documents).

**Sa limite est imprimée avec lui, jamais tue** : *nommer n'est pas écrire dedans*. C'est une borne
HAUTE — la même nuance que data-archangel imprime déjà sur sa propre mesure. La preuve d'écriture
demanderait d'instrumenter l'exécution, pour un gain nul : ce qu'on cherche n'est pas un verdict,
c'est de quoi trancher à la main en connaissance de cause.

**Deux exclusions de l'indice, chacune avec sa raison** : `check-house.mjs` nomme à peu près tout le
dépôt (le compter ferait dire « nommé » de n'importe quoi), et `doc-report.mjs` se citerait dans sa
propre mesure — **le bug auto-référentiel que ce dépôt a déjà payé cinq fois**.

**Les deux comptes sont imprimés ensemble**, jamais la seule moitié dérivée : n'afficher que les 13
tranchées laisserait croire le travail fini alors que 10 décisions attendent encore une main.

## Le régime d'écriture d'un document — AUTO, FIGÉ, MIXTE (2026-09-28, tâche #711)

**Sa demande, mot pour mot** : « peut-on verifier que l'outil dedié sait distinguer les fichiers qui
doivent se mettre à jour tout seul des fichiers qui doivent etre historisés en l'etat, est-ce que le
cumul des 2 existe ». Réponse : oui aux trois, et le cumul s'appelle **MIXTE**.

**Ce qui a été MESURÉ avant de décider quoi que ce soit, parce que la forme évidente était la
mauvaise.** La tâche demandait à l'origine que *chaque fichier déclare sa nature en tête*. Le dépôt
porte **471 documents `.md`**, dont **90 seulement** portent un signal mécanique exploitable. Exiger
un en-tête sur chacun revenait donc à demander **381 jugements humains** — c'est-à-dire une
obligation que personne n'aurait tenue, et l'Article 27 dit exactement ce qu'il faut penser d'une
règle qui ne repose que sur la bonne volonté : elle n'existera plus à la session suivante.

**Le choix retenu, et pourquoi il protège plus en demandant moins** : le régime se **DÉDUIT** de ce
qui existe déjà, et l'obligation d'écrire une mention se limite au seul endroit où le silence coûte
quelque chose.

### Les trois régimes, et d'où chacun se lit

| Régime | Ce que ça veut dire | Comment il se reconnaît sans que personne l'écrive |
|---|---|---|
| **AUTO** | régénéré en entier, ne jamais éditer à la main | le fichier porte le bloc généré et rien d'autre de substantiel |
| **FIGÉ** | archive, ne jamais régénérer | il vit dans un dossier d'archives déclaré (`docs/contexte-projet/`, `docs/simulations/`, `docs/suivi/archives/`) |
| **MIXTE** | un socle régénéré **plus** des notes humaines à préserver | il porte un bloc généré **et** de la prose écrite autour |

`regimeDeclare()` lit une mention explicite, `regimeDeduit()` lit les signaux du fichier, et
`regimeDEcriture()` combine les deux. **La déclaration l'emporte toujours, et le désaccord est
RENDU plutôt que tu** : quelqu'un a écrit une intention, une sonde qui la contredit est soit un
signal utile, soit une sonde à corriger — dans les deux cas on veut le savoir.

Quand aucun signal n'existe, la réponse est **« inconnu »**, jamais une supposition : « je n'ai pas
pu regarder » ne doit jamais se lire comme « il n'y a rien » (leçons L5/L11).

### Le seul risque réel, et c'est sur lui que porte l'obligation

Pas « un fichier sans nature déclarée » — ça, c'est de la paperasse. Le vrai risque est **un
document qu'un outil réécrit EN ENTIER alors qu'il ne dit nulle part qu'il est régénéré** : une note
écrite à la main y disparaît au passage suivant, **sans erreur et sans trace**. C'est ce que
`findDocumentsSansRegime()` cherche, et rien d'autre.

Les générateurs concernés émettent désormais la mention en première ligne, de sorte qu'elle
**survit à leur propre régénération** — une protection qu'il faudrait reposer à chaque passage n'en
serait pas une.

### La sonde a été resserrée trois fois, chaque fois contre le dépôt réel

Huit accusations au premier passage, deux à la fin. Le détail compte, parce que les trois erreurs
sont de la même famille — **un signal ADJACENT lu comme le signal lui-même** :

1. **8 → 6** : *ajouter à la fin n'est pas réécrire*. Une écriture de la forme `prior + ligne`
   conserve tout ce qui précède. Parmi les accusés à tort : `docs/idees-a-trancher.md`, le registre
   où vivent ses arbitrages — le faux rouge le plus coûteux du lot, puisqu'il aurait porté sur le
   fichier le plus précieux.
2. **6 → 3** : *un chemin seulement LU n'a jamais fait perdre une note à personne*. Une branche trop
   lâche du motif acceptait le nom d'une constante suivi de n'importe quoi puis d'une parenthèse —
   ce qu'on trouve dans du code de lecture ordinaire. `docs/referentiel/lecons.md` était accusé
   alors que sa constante ne sert qu'à le lire.
3. **3 → 2** : *l'ajout s'écrit de DEUX façons dans ce dépôt*. La concaténation était vue,
   l'interpolation dans un gabarit (`${existant.replace(...)}\n${ligne}`) ne l'était pas — et c'est
   la forme qu'emploie `enregistrerOperation()`, si bien que `docs/referentiel/charte-operations.md`
   passait pour réécrit en entier alors qu'il est alimenté ligne à ligne.

### Le bug du jour, et c'est le plus instructif des quatre

Les trois générateurs émettaient bien la mention. La sonde continuait de les accuser. Son motif
exigeait la flèche fermante `-->` **collée** au mot du régime, alors que la mention réellement émise
porte la phrase qui explique le risque à l'humain qui ouvre le fichier (« toute note écrite à la
main y sera perdue au passage suivant »).

**Une sonde qui ne reconnaît pas la protection qu'on vient de poser pousse à la poser deux fois**
(leçon L4). Le contre-test qui l'aurait évité est désormais le premier du bloc, et il porte
exactement la chaîne émise, pas une version simplifiée écrite pour que le test passe.

### La limite, déclarée plutôt que découverte plus tard

La sonde ne voit qu'une constante `X_PATH` passée **directement** à un appel d'écriture. Une
indirection lui échappe, et le cas est **connu plutôt que supposé** : `le-classificateur` écrit
`const cible = process.argv[3] ?? CLASSIFICATION_PATH` puis écrit `cible`. Le document est bien
réécrit en entier, et cette sonde ne le voit pas. Élargir à une analyse de flot de données coûterait
plus que ça ne rapporte ; nommer la limite et son exemple coûte une phrase.

Elle ne dit pas non plus si le régime déclaré est le **BON**, seulement qu'il est déclaré.

### Sur le nom, qui reste à confirmer

Sa demande disait « nature ». `le-classificateur` exporte **déjà** un `natureDuDocument()` qui
répond à une tout autre question — ce qu'un document *porte* (loi, blueprint, fiche). Deux fonctions
exportées du même nom dans un même dépôt sont exactement la dette de reprise que l'Article 20bis
nomme. AUTO/FIGÉ/MIXTE décrit **comment** le fichier s'écrit : donc un **régime**. Son mot reste ici
avec la raison du changement — le nom définitif lui revient, comme tous les noms de ce projet.

### État mesuré au 2026-09-28

**2 documents réécrits en entier · 2 protégés · 0 à risque.** Et le contre-test fabrique exprès un
coupable, parce qu'un zéro ne vaut que si la sonde sait encore accuser (BP2).
