# LE-CLASSIFICATEUR — instanciation sur ce projet

*(Créé le 2026-09-26, par scission de CASSANDRA-RH. **Nom provisoire**, validé comme tel par
l'utilisateur : descriptif, jamais un nom propre — à remplacer avec la fournée de renommage des
rangs, tâche #200. Blueprint générique réutilisable : `docs/le-classificateur-blueprint.md`.)*

## Pourquoi il existe, et ce n'est pas une question de taille

CASSANDRA-RH portait deux métiers qui ne posent pas la même question. **« Qui va bien dans
l'équipe ? »** — effectif, badges, stagnation, KPI, convocations. Et **« qu'est-ce que c'est ? »** —
types, rangs, familles, classes, indice. Le premier juge des gens, le second range des choses.

Le fichier avait atteint 4 300 lignes, le plus gros du dépôt. Mais la taille n'est pas le motif : le
motif est que ces deux questions n'ont ni le même rythme, ni le même public, ni la même autorité.
L'utilisateur a préféré scinder plutôt que construire un 80e outil — décision du 2026-09-26, après
avoir pesé la création de LE-GRAND-ARCHITECTE, qui n'existait que sur le papier.

## La règle de dépendance, non négociable

**`le-classificateur.mjs` n'importe JAMAIS `cassandra-rh.mjs`.** Le sens est unique : CASSANDRA lit
le classement, le classement ne lit jamais les ressources humaines. Sans cette règle, les deux se
rappelleraient l'un l'autre et la scission n'aurait rien séparé — elle aurait seulement réparti le
même bloc sur deux fichiers.

## Ce qu'il porte

- **L'axe TYPE** — ce qu'un fichier EST, constaté en le lisant (`typeDeScript`, `portesDEntree`,
  `recenserLesScripts`).
- **L'axe RANG** — ce qu'un fichier VAUT (`ORG_RANKS`, `RANG_PAR_TYPE`, `rangDuFichier`), avec
  l'échelle de promotion : chaque rang déclare sa marche suivante et ce qu'il faut pour la franchir.
- **Le croisement des deux** (`croiserTypeEtRang`) — et sa règle : *le rang MÉRITÉ l'emporte
  toujours, le type ne remplit que les cases que personne n'a remplies.*
- **L'indice de classification à facettes** (`indiceDeClassification`, `decoderIndice`).
- **Le poste de travail qui se DÉRIVE** (`OBLIGATIONS_DERIVEES`, `posteDeTravail`) — le rang donne
  la base, ce que l'outil fait ajoute le reste, et ce qu'il fait se mesure plutôt que se déclarer.
- **Le document officiel** (`documentDeClassification`), en texte et en HTML depuis les mêmes blocs.

## Ce qu'il ne porte pas, et pourquoi

- **L'organigramme** (`buildOrganigramme`) reste chez CASSANDRA : il met en scène des PERSONNES à
  des postes, c'est de l'organisation, pas du rangement.
- **La carte des axes en page HTML** (`blocsDeLaCarteDesAxes`) reste chez elle aussi : c'est un
  rapport de CASSANDRA, qui consomme le classement sans en faire partie.
- **La comparaison des familles avec doc-report** reste chez elle : elle vérifie la cohérence de
  deux REGISTRES, ce qui est un contrôle de tenue, pas une classification.

## Comment on s'en sert

```
node scripts/le-classificateur.mjs classification      # régénère le document officiel
node scripts/le-classificateur.mjs                     # équivalent, la commande par défaut
```

Il écrit deux fichiers depuis **les mêmes blocs**, jamais deux rendus écrits à la main :
`docs/referentiel/classification-agence.md` (la référence enregistrée) et
`docs/le-classificateur/classification-agence.html` (la version de remise).

## Sa limite honnête

Il range ce qu'il peut MESURER. Un fichier dont la finalité n'est écrite nulle part restera dans un
état de passage, et c'est voulu : la leçon L24 dit que la finalité ne se déduit jamais du code. Le
rang « Hors Agence » est, pour la même raison, une liste tenue à la main avec sa raison écrite —
« lance le produit » ne se lit dans aucune sonde.

## Les renommages du 2026-09-26 — et ce qu'ils ont rendu possible

*(Décidés par l'utilisateur en relisant le document HTML. Il nomme, jamais l'agent — règle du
2026-09-24 portée par AGENT DES NOMS. Les emojis, eux, ont été choisis par l'agent à sa demande
explicite.)*

**Les 8 familles portent un préfixe `(f)` et une icône.** Coordination → *Les Anges de la
coordination* 👼 · Gouvernance interne → *La Gouvernance Royale* 👑 · Gardiens sacrés du code →
*Les Gardiens Sacrés du Code* 🛡️ · Simulation & qualité narrative → *La Suite Tarantino* 🎬 ·
Suite Dette & Structure du code → *Les Prophètes* 📜 · Outillage de navigation → *Les Boosters de
Navigation* 🚀 · Audit indépendant → *Les Agents Externes* 🕵️ · Exceptionnel ✨.

**Les 9 classes transverses portent un préfixe `(ct)`, une icône et un nom collectif** — en gardant
délibérément leur définition pure en seconde moitié, à sa demande : *Les scanners* 🔎 · *Les
rapporteurs HTML* 📄 · *Les enregistreurs* 🗃️ · *Les consommateurs d'API* 💳 · *Les évolutifs* 🌱 ·
*Les heuristiques* ⚠️ · *Les pro-actifs* 🎯 · *Les auto-conscients* 🪞 · *Les véridiques* 🧭.

**Le rang « Membre » devient « Membre premium » 🥇** — le mot figurait déjà dans sa propre note de
nommage ouverte depuis le 2026-09-21 (tâche #200, « Premium 🥇 »), ce qui n'a été découvert
qu'après coup.

**Une famille « Hors Agence » 🚧 rejoint la liste, et le rang descend tout en bas de l'échelle.**
Elle redit le rang, comme celle des Gardiens sacrés et pour la même raison assumée. Ce qu'elle
ferme est mesuré : la famille était **le seul axe qui ne couvrait pas tout le dépôt**, et six
fichiers sortaient avec une case vide — or une case vide ne dit jamais si personne n'a rempli ou
si rien n'était à remplir. Deux interdits l'accompagnent, et aucun n'est un jugement de valeur :
ces fichiers ne peuvent pas évoluer, et **aucun outil de l'Agence ne peut les rejoindre** — on
n'est pas hors Agence parce qu'on a démérité, mais parce qu'on sert le produit.

**Ce que le renommage a fait remonter, et que personne ne cherchait.** Renommer les familles dans
le registre d'équipe seul a déclenché le garde-fou des deux systèmes de familles : **33 outils se
sont retrouvés rangés dans deux familles différentes**, parce que `doc-report.mjs` tient sa propre
liste de 45 familles. Les deux restent volontairement indépendantes — les faire dériver l'une de
l'autre rendrait le garde-fou tautologique, donc incapable de rien trouver — et la divergence a
été corrigée dans le même commit.

## La 4e colonne d'icônes — et pourquoi elle ne se recopie pas

Sa question : *« tu n'as pas trouvé de solution pour ajouter une 4e colonne dans le tableau
"indice" avec une traduction de l'indice en série d'icônes ? »*

La solution est venue de **sa propre décision du même message** : en donnant un emoji à chaque
famille et à chaque classe, il a mis l'icône DANS le nom. `emojiDuLibelle()` la LIT donc au lieu
qu'une seconde table la recopie — ce qui aurait divergé au premier renommage (Article 24). Seuls
les 8 **types** ont reçu leur icône dans le code (`ICONE_PAR_TYPE`), parce qu'un type est un
constat de forme et non un nom choisi par quelqu'un.

`indiceEnIcones()` rend une série du genre `⌨️ 🛡️ 🛡️ 🔎🗃️⚠️🎯🪞🧭`. Elle ne remplace jamais
l'indice, elle le double : **une série d'icônes se reconnaît sans décoder ; un indice se trie, se
cherche et se compare.** Un libellé sans emoji rend une chaîne vide, jamais une icône inventée.

## `bibliothequesLancables()` — la question qui a créé un garde-fou

Sa question, sur douze fichiers rangés en bibliothèque : *« c'est normal ou on a loupé quelque
chose dans leur conception ? »*

Y répondre en prose aurait produit un avis que personne ne peut rejouer. Le garde-fou répond à la
place, et se reposera la question tout seul sur le prochain fichier (Article 31).

**Ce qu'il mesure** : un fichier typé bibliothèque porte-t-il malgré tout une **porte** dans son
code (un `main()` défini, ou un garde de lancement comparant `import.meta.url` à `process.argv`) ?
Si oui, `quiLappelle()` cherche ensuite qui écrit réellement `node scripts/<lui>` dans le dépôt.

**Trois verdicts, jamais deux** — et c'est ce qui empêche d'accuser une conception saine :
- **vraie bibliothèque** — aucune porte, le type est juste, il n'y a rien à corriger ;
- **porte réelle atteinte autrement** — le crochet post-commit ou un autre outil la lance : c'est
  un choix de conception, pas un oubli ;
- **PORTE ORPHELINE** — le fichier est lançable et **rien au monde ne le lance**.

**Résultat réel au 2026-09-26** : 22 fichiers examinés, 16 vraies bibliothèques, 6 portes non
écrites, et **une seule orpheline — `tasks-process-guardian.mjs`**, qui ne figurait pas dans sa
liste de douze.

**LA SONDE A ÉCHOUÉ À SON PREMIER PASSAGE, ET C'EST GARDÉ.** Sa première version cherchait
`import.meta.url` tout court : elle accusait `report-template`, `execution-profile`,
`gemini-key-health`, `memento-weight` et `serie-temporelle`, qui s'en servent pour calculer un
CHEMIN. Un garde qui accuse à tort cesse d'être lu (leçon L4) — et celui-ci aurait répondu faux à
la question même qui l'a fait naître.

## Les trois arbitrages du 2026-09-26, tranchés en fenêtre dédiée

**1. LE-COORDINATEUR n'est plus Agent Cadre.** Sa question : *« est-ce que le coordinateur a
vraiment sa place dans cette catégorie ? est-ce qu'il peut convoquer ? »*. La mesure a répondu
avant l'opinion : `convoquer()` et `cloreConvocation()` n'existent QUE dans `cassandra-rh.mjs`, et
LE-COORDINATEUR n'a rien d'équivalent. Or le poste d'Agent Cadre promet littéralement « le droit de
convoquer les autres et de rendre un verdict sur eux ». Un rang porté sans son pouvoir est un titre
décerné d'office, ce que ce projet refuse pour tous les autres rangs. **Il reste un Agent Cadre,
CASSANDRA-RH.**

**Et l'agent s'est trompé une seconde fois dans le même geste, corrigé avant livraison** : ayant
fait descendre LE-COORDINATEUR, il l'a d'abord placé en Membre premium. La table maîtresse écrivait
« Membre certifié (classique) » depuis le 2026-09-21, et il n'a ni fiche ni blueprint par décision
explicite de la charte — la définition exacte du rang classique. Le registre disait la vérité ;
c'est la mémoire de l'agent qui inventait (leçon L24).

**2. La famille « Exceptionnel » est dissoute.** Ses trois soupçons étaient fondés, chacun
vérifiable :
- **HYPER-SCAN-CHECKPOINT ne peut pas être Gardien sacré** — le critère de l'Article 20 est DOUBLE
  (vrai scan de qualité **et** gratuit à chaque commit), et l'Article 21 dit qu'il « ne se déclenche
  jamais automatiquement, jamais en continu ». Il échoue la seconde moitié par conception, comme
  THE-FINAL-JUDGE, et l'Article 20 déclare déjà cette exclusion structurelle. Il rejoint **La
  Gouvernance Royale** : il orchestre les autres, il ne scanne pas lui-même.
- **INES-official n'est pas exceptionnelle** — son propre en-tête dit « déclenchement PÉRIODIQUE via
  la Ronde CIRCLE-TASKS, jamais seulement sur demande », et précise que c'est l'utilisateur qui
  avait corrigé l'agent sur ce point. Une famille nommée « Exceptionnel » contredisait son
  calibrage. Elle rejoint **Les Anges de la coordination**.
- **ALWAYS-NEW-CODE est bien l'épreuve de la page blanche par essence** — l'Article 23 le dit mot
  pour mot. La famille s'appelait « page blanche » et ne le contenait pas.

À deux membres, elle était par ailleurs sous la taille minimale que l'outillage utilise déjà
(`TAILLE_MIN_FAMILLE = 3`).

**3. La Suite Tarantino fait bien partie de l'Agence, et son principe s'exporte.** « Hors Agence »
ne désigne QUE ce qui LANCE le produit (`run-framework`, `sauvegarde-projet`…), jamais ce qui le
JUGE. EL-PROFESSOR note la fidélité à la charte : c'est un jugement de qualité. Et l'export suit la
règle déjà en place des deux documents par outil — **le blueprint générique part, l'instanciation
(Lia, Noé, les jauges) reste**.

## La relecture ligne à ligne du 2026-09-26 — dix défauts, et le pire était invisible

*(Sa demande : « vérifie le doc que tu m'as envoyé, il y a beaucoup d'erreurs [...] c'est la
classification que nous allons graver dans le marbre donc pas d'imprécisions ». Il avait raison.)*

| # | Le défaut | Ce qu'il produisait | Ce qui le ferme |
|---|---|---|---|
| 1 | `blocsVersMarkdown()` ignorait le type `highlight` | les DEUX versions du même document ne disaient pas la même chose, et la version texte perdait la phrase centrale | le bloc est rendu, et un type inconnu écrit « BLOC NON RENDU » au lieu de disparaître (leçon **L26**) |
| 2 | deux rangs partageaient une icône (🎖️, 🧱) | la traduction de l'indice en icônes n'était plus réversible — dans le document dont c'est la fonction | `iconesEnCollision()`, vérifié sur les quatre facettes |
| 3 | « Qui le remplit : **?** » imprimé pour Hors Agence | un trou de table de correspondance se lisait comme un trou de connaissance | `QUI_REMPLIT` nommé, et un cas non traduit le DIT |
| 4 | le tableau des rangs sortait dans l'ordre du code | le Socle en tête d'une échelle qu'il ne monte pas ; Membre classique avant Membre premium | champ `echelon` + `rangsOrdonnes()` ; §5/§6/§7 suivent l'ordre des facettes |
| 5 | trois sommets affichaient « *(non arrêté)* » | un sommet ressemblait à un oubli | Agent Cadre, Gardien sacré et Émetteur déclarent pourquoi rien ne suit |
| 6 | l'exemple d'indice `2.2.3.dh` était **fabriqué** | il décrivait un Gardien sacré chez Les Prophètes, que porte aucun fichier | l'exemple est tiré du dépôt et décodé sous les yeux du lecteur |
| 7 | la classe « coûte de vrais appels API » était fausse à moitié | `check-house` y figurait parce qu'il MOQUE l'appel ; `le-classificateur` parce que **sa propre sonde se trouvait elle-même** | sonde sur `await fetch(` distant + propagation le long du graphe d'import + déclaration écrite pour l'invisible |
| 8 | « qui le lance vraiment » citait des **archives** | une ligne de `docs/suivi/` présentée comme une commande — la confusion que ce dépôt avait déjà payée une fois | `estLanceurVivant()` : code exécuté ou document normatif, jamais une mémoire |
| 9 | une addition qui ne tombait pas juste | « 57 + 6 » annoncé pour un total de 62 | `membresSansFichier()` nomme le manquant (`find-deep-booster`) au lieu de le masquer |
| 10 | le §9 s'arrêtait au constat | les portes orphelines mouraient dans leur propre page (Article 28) | un vrai plan d'action, un geste par ligne |

**Le plus grave est le n°1, et il mérite d'être compris plutôt que noté.** Les deux fichiers étaient
corrects : le HTML complet, le Markdown bien formé. Ce qui manquait n'existait que dans la
COMPARAISON — et personne ne compare deux fichiers censés venir de la même source, précisément parce
qu'ils viennent de la même source. C'est la leçon L26.

**Le n°7 est le plus humiliant** : la sonde cherchait un motif que son propre code contenait. Le bug
auto-référentiel, déjà payé sur find-booster (tâche #182), refait à l'identique deux jours plus tard.

**Ce que la correction a changé, en chiffres** : la classe « coûte de vrais appels API » passe de
2 justes sur 4 à **4 sur 4** ; les portes orphelines passent de 1 à **2** (`integration-outil`
rejoint `tasks-process-guardian` une fois les archives écartées) ; et le §9 passe de 1 constat à
**5, chacun avec son geste**.

---

## L'échelle de VITALITÉ — le cinquième axe *(2026-09-26, tâche #906)*

Ses quatre niveaux, dans ses mots : **vital** (sans lui l'Agence ne tourne pas) · **essentiel**
(sans lui elle tourne mais perd une garantie) · **utile** (il fait gagner du temps) · **optionnel**
(confort ou cas particulier).

**À quoi elle sert** : répondre à la question de l'export. Quatre-vingt-huit fichiers ne partent pas
en même temps. Un « vital » oublié rend le paquet inutilisable au premier commit ; un « optionnel »
emporté par habitude alourdit le paquet sans rien garantir.

**Elle se dérive, elle ne se déclare pas** : aucun fichier ne porte son niveau écrit en tête. Le
niveau se lit sur ce que le dépôt FAIT du fichier — qui le lance, ce qu'il garantit.

### Les trois faux verdicts qui ont façonné le critère, gardés comme contre-tests

1. **« quelqu'un l'importe » → 88 % du parc en vital ou essentiel.** 71 fichiers sur 88 sont importés
   par au moins un autre. Une échelle où presque tout est en haut ne dit pas que tout est vital,
   elle dit que le critère est mauvais.
2. **La chaîne quotidienne transitive → 77 vitaux, ZÉRO essentiel.** Le coupable était UN fichier :
   `check-house.mjs` est lancé par le crochet et importe 78 % du parc **pour le tester**. Un import
   de test n'est pas une dépendance d'exécution. La suite reste dans la chaîne (elle tourne bien à
   chaque commit) mais ses imports ne propagent plus — et la frontière est DÉRIVÉE
   (`findSuitesDeTest()` : est une suite de tests tout fichier qui importe la moitié du parc),
   jamais écrite en dur, parce que la suite peut se scinder demain.
3. **Les crochets eux-mêmes sortaient « optionnel »**, c'est-à-dire « confort », alors qu'ils SONT
   la boucle quotidienne. La sonde cherchait qui est LANCÉ PAR un crochet ; un crochet n'est lancé
   par aucun crochet, il est lancé par git.

**Résultat exploitable** : 25 vitaux (28 %) · 9 essentiels (10 %) · 34 utiles (39 %) · 20 optionnels
(23 %). Et l'écart entre la chaîne d'exécution (25) et la chaîne avec les imports de test (81) est
imprimé à côté — c'est lui qui dit qu'un export « minimal » fait naïvement emporterait 81 fichiers
là où 25 suffisent.

**Un fichier illisible n'est jamais rangé en « optionnel »** : les deux se ressemblent trait pour
trait dans un tableau, et l'un dit de le laisser, l'autre de regarder (leçon L5). Il n'y a donc pas
cinq niveaux — il y a quatre niveaux et un aveu.

Commande : `node scripts/le-classificateur.mjs vitalite`.
