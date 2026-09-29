# AXA-CHECK — instanciation pour Maison IA vivante

*(Cf. `docs/axa-check-blueprint.md` pour le principe générique. Créé le 2026-09-19, à la demande
explicite de l'utilisateur : « je veux un nouvel outil : axa-check qui identifie les zones fragiles
ou faibles du code et qui sait remonter cette information [...] axa-check peut être sollicité par
les autres outils comme clean-dirty ». Rejoint l'Article 20 de `CLAUDE.md` comme troisième membre
"toujours déployé", aux côtés d'ARGUS et HARMONIA.)*

## Ce qui existe aujourd'hui

- **`scripts/axa-check.mjs`** — toute la mécanique : `functionCoverageFromV8()` (extrait la
  couverture par fonction d'un relevé V8 brut), `robustnessScore()` (% de fonctions couvertes,
  `undefined` honnête sur zéro fonction), `fragileFunctions()` (fragilité enrichie), `LIB_MAP` +
  `collectCoverage()` (lit un dossier `NODE_V8_COVERAGE` déjà produit et mappe vers le vrai fichier
  source), `corroboratedByArchivedSimulations()` (seconde preuve, niveau zone). `main()` orchestre
  un passage complet autonome (lance `check-house.mjs` avec la couverture activée, affiche le
  rapport) — utilisable seul ou par un appelant qui réutilise `collectCoverage()`/`robustnessScore()`
  sur un relevé qu'il a déjà produit lui-même (cf. `kpi-report.mjs`).

## Mécanique réelle utilisée dans ce projet

`scripts/check-house.mjs` transpile déjà chaque module de `lib/*.ts` (et `app/api/lia/route.ts`)
avec le vrai compilateur TypeScript (`ts.transpileModule`, sans minification) vers
`.sites-runtime/test-*.mjs`, préservant les numéros de ligne 1:1 — exactement la condition que le
blueprint générique demande pour que `NODE_V8_COVERAGE` (déjà intégré à Node.js, zéro nouvelle
dépendance) reste exploitable contre le vrai code source. `LIB_MAP` reflète la liste EXACTE des 21
fichiers `lib/*.ts` transpilés par `check-house.mjs` plus le cas particulier
`app/api/lia/route.ts` → à resynchroniser manuellement si `check-house.mjs` change cette liste
(Article 13 : un fichier absent d'ici serait invisible pour AXA-CHECK sans aucun avertissement).

## Granularité — par fonction (décision de calibrage explicite)

Confirmé par calibrage (Article 16) : la fonction est le grain choisi, jamais la ligne ni le
fichier. Une fonction anonyme non nommée par V8 est honnêtement exclue du calcul plutôt que
rapportée sous un nom vide trompeur.

## Fragilité enrichie — deux sources indépendantes, jamais un simple miroir de la robustesse

Confirmé par calibrage explicite : la fragilité d'une fonction non couverte gagne en confiance
(`à surveiller` → `probable`) quand elle correspond à au moins une de ces deux conditions,
chacune nommée explicitement dans le résultat :
- **Proximité avec un nœud sensible HARMONIA** (`SENSITIVE_NODES`, réutilisé tel quel depuis
  `scripts/check-level-target.mjs`, jamais une seconde carte séparée).
- **Signal de churn "accumulation pure"** (`churnSignal()`, réutilisé tel quel depuis
  `scripts/always-new-code.mjs` — un fichier avec 5+ commits et zéro suppression jamais observée).

## Seconde preuve — corroboration par les 11 simulations archivées (niveau zone)

Confirmé par calibrage explicite : `docs/simulations/*_actions.txt` (cf. Article 18, étape 3bis)
est consulté au niveau ZONE (les mêmes 8 thèmes qu'ALWAYS-NEW-CODE/HARMONIA, via `FILE_TO_ZONES`,
l'inverse de `THEME_PRIMARY_FILE` — jamais une seconde carte séparée) via `ZONE_EVENT_HINTS`, des
motifs qui reconnaissent le format réel `"[round N] TYPE — détail"` produit par
`scripts/summarize-simulation-log.mjs`. Bug réel trouvé et corrigé le jour même de la construction
de cet outil : la première version de ces motifs cherchait un texte `"type: X"` qui n'apparaît nulle
part dans le vrai format, donnant silencieusement 0 corroboration partout — corrigé en confrontant
le motif au vrai fichier archivé, jamais supposé correct sur la seule lecture du code qui l'a écrit
(Article 3).

## Déclenchement — toujours déployé, rejoint l'Article 20

Confirmé par calibrage explicite : AXA-CHECK rejoint ARGUS et HARMONIA comme troisième outil
"toujours déployé" de l'Article 20 de `CLAUDE.md` — jamais un nouvel Article dédié, sa partie
mécanique tourne à chaque changement de code comme les deux autres.

**Écart réel trouvé et corrigé le 2026-09-21** (question directe de l'utilisateur : « est-ce qu'il y
a bien les scans harmonia et argus en priorité ? ainsi que les autres membres de l'équipe noyau ? ») :
jusqu'à ce jour, ce paragraphe était vrai en intention mais faux en pratique — seule la LOGIQUE
d'AXA-CHECK était testée à chaque commit (fixtures synthétiques dans `check-house.mjs`, crochet
`pre-commit`), jamais un vrai passage contre le projet réel, contrairement à ARGUS/HARMONIA qui, eux,
avaient déjà leur vrai balayage post-commit depuis le 2026-09-20 (`scripts/hooks/check-last-commit.mjs`).
Corrigé sans jamais relancer `check-house.mjs` une seconde fois (règle anti-doublon, §7ter) :
`scripts/hooks/pre-commit` pointe désormais `NODE_V8_COVERAGE` sur un dossier fixe et gitignoré
(`.sites-runtime/axa-check-postcommit-cov`) pendant le lancement de `check-house.mjs` déjà obligatoire ;
`check-last-commit.mjs` (post-commit, non bloquant) lit ce même dossier via `collectCoverage()` +
`robustnessScore()`, affiche la couverture globale réelle, puis nettoie le dossier.

## KPI — intégré à la famille existante, jamais un nouveau tableau

Confirmé par calibrage explicite : la couverture réelle par fonction rejoint la famille
"Robustesse du code" déjà existante de `scripts/kpi-report.mjs` (`codeHealthScore()`), comme un
troisième terme de la moyenne aux côtés de la propreté `tsc` et du taux de réussite de la suite de
tests — jamais un tableau de bord séparé. `kpi-report.mjs::runTestSuite()` réutilise le MÊME
lancement de `check-house.mjs` (avec `NODE_V8_COVERAGE` activé sur ce lancement) pour nourrir à la
fois son propre calcul de réussite ET la couverture AXA-CHECK, jamais un second lancement redondant
(règle anti-doublon, `docs/regles-de-travail.md` §7ter).

## Rejoint la boîte à outils d'HYPER-SCAN-CHECKPOINT

Confirmé par calibrage explicite : un passage HYPER-SCAN-CHECKPOINT (même en version légère)
inclut désormais un passage AXA-CHECK, affiché dans la console ET archivé dans le rapport `.txt`
(section `=== AXA-CHECK ===`), aux côtés d'ARGUS/HARMONIA/ALWAYS-NEW-CODE.

## Consulté par LE-COORDINATEUR

`scripts/le-coordinateur.mjs` importe directement `collectCoverage()`/`robustnessScore()` (jamais
une réimplémentation) pour afficher la couverture réelle dans son tableau de synthèse — même
lancement partagé de `check-house.mjs` que pour ses propres résultats de test, jamais un second.

## Limite honnête

Une ligne exécutée par un test n'est pas une ligne prouvée juste — AXA-CHECK mesure un signal
d'exécution, jamais une garantie de correction. La corroboration par simulation reste au niveau
zone, jamais fonction (le journal archivé ne trace que des événements discrets). Le mapping
zone→fichier (`FILE_TO_ZONES`, hérité de `THEME_PRIMARY_FILE`) hérite de l'approximation déjà
documentée pour ALWAYS-NEW-CODE.

## Profondeur de vérification par les outils (2026-09-19)

*(Cf. `docs/axa-check-blueprint.md` pour le principe générique. Demande explicite de l'utilisateur
pendant l'audit ligne-par-ligne du 2026-09-19 : « les zones du code qui ont été couvertes par les
outils + sont couvertes par des tests sont flaggées 100% safe [...] le degré de check des outils
influence l'évaluation ». Calibré via trois questions explicites : granularité fichier/portion
laissée à l'arbitrage de l'agent avec garde-fou automatique, péremption à la prochaine modification,
réserve explicite conservée dans le libellé maximal plutôt que "100% safe" littéral.)*

- **Échelle réutilisée telle quelle** : `DEPTH_ORDER = ["aucun", ...LEVEL_ORDER]`, où `LEVEL_ORDER`
  (léger/standard/approfondi/exceptionnel) est désormais exporté par `check-level-target.mjs` et
  importé ici — jamais une seconde échelle redéfinie (règle anti-doublon, §7ter). "Machine de
  guerre"/"ligne par ligne"/"maximal" (les exemples donnés par l'utilisateur) correspondent au
  palier `exceptionnel`, seul à donner la note la plus haute quand il est combiné à une vraie
  couverture de test ; `approfondi` seul donne un palier juste en dessous.
- **Registre** : `docs/axa-check/depth-checks.json` (append-only, une entrée par vérification
  déclarée : fichier, profondeur, portée, commit du fichier au moment du check, date). Jamais écrit
  par un autre outil, jamais déduit automatiquement — seule une commande explicite
  (`node scripts/axa-check.mjs record-check <fichier> <profondeur> [fonctions...]`) l'alimente.
- **Arbitrage fichier/portion** (`chooseCheckScope()`) : l'agent déclare (absence de noms de
  fonctions = fichier entier ; noms fournis = portée précise). Garde-fou automatique
  (`corrected: true` dans l'enregistrement) : une déclaration "fichier entier" citant moins de la
  moitié des fonctions réelles du fichier est ramenée à "fonctions listées" plutôt que de gonfler
  artificiellement la confiance sur tout le fichier.
- **Péremption** (`isRecordStillValid()`) : comparaison au commit RÉEL le plus récent touchant ce
  fichier précis (`git log -1 -- <fichier>`), jamais HEAD global. Un enregistrement dont le fichier
  a été modifié depuis n'est plus jamais compté par `currentDepthFor()`.
- **Note combinée** (`safetyRating()`) : `confiance-maximale` (testé + exceptionnel), `fiable`
  (testé + approfondi), `testé` (couverture seule, comme avant), `à-surveiller` (vérifié en
  profondeur mais non testé, OU ni l'un ni l'autre sans signal aggravant), `à-risque` (ni test ni
  vérification, ET proximité d'un nœud sensible HARMONIA ou signal de churn — les deux mêmes
  signaux que la fragilité enrichie existante, jamais une troisième source inventée). Le libellé du
  palier maximal garde une réserve explicite ("vérifié en profondeur et testé"), jamais "100% safe"
  littéral.
- **Premier usage réel** : les 33 fichiers custom du projet (`lib/*.ts`, `app/api/lia/route.ts`,
  `app/page.tsx`, `components/house-view.tsx` et les petits fichiers `app/`/`components/` restants)
  ont reçu un enregistrement `exceptionnel` le jour même, à l'issue de l'audit ligne-par-ligne
  exhaustif demandé par l'utilisateur (mega-prompt "PAUSE") — premier vrai passage de ce registre,
  pas un exemple fabriqué pour la documentation.

## Garde-fou de fraîcheur d'AGENT_SCRIPT_FILES (2026-09-21, Article 24)

`AGENT_SCRIPT_FILES` n'avait jamais eu de vérification mécanique contre la table maîtresse réelle —
seul un test check-house.mjs affirmait une borne basse figée ("au moins 14"), sans jamais signaler
un Agent réel oublié. `findScriptsMissingFromAgentFiles()` (`scripts/le-coordinateur.mjs`, câblé
dans `runNetworkCheck()`) a trouvé et permis de corriger 6 Agents réels invisibles depuis leur
construction (the-king, ines-official, memory-audit, find-booster, objectifs-vs-resultats,
cassandra-rh) — invisibles donc à la fois à la couverture AXA-CHECK et à la stagnation lue par
CASSANDRA-RH.

## Trois états de couverture, et une exemption qui porte sa raison (2026-09-28, tâche #994)

**LE DÉFAUT** : « 0 % mesuré » et « jamais exercé » s'affichaient pareil, et ils appellent des
gestes opposés — écrire un test, ou accepter une limite déclarée.

| État | Ce qu'il dit | Le geste qu'il appelle |
|---|---|---|
| **mesuré** | le code est exercé, voici son pourcentage | l'améliorer s'il est bas |
| **jamais exerçable** | il ne pourra JAMAIS l'être, et voici pourquoi | rien — c'est une limite déclarée |
| **NON MESURÉ** | aucun relevé ne l'a vu passer cette fois | un vrai trou à combler |

### Les quatre exemptions, chacune avec sa raison écrite

| Slug | Pourquoi il ne pourra jamais être exercé |
|---|---|
| `check-house` | c'est la suite de tests elle-même : elle ne peut pas s'exercer sous sa propre instrumentation |
| `sites-env` | l'exercer demanderait de démarrer le vrai runtime, ce qu'aucun test gratuit ne fait |
| `run-framework` | il lance le PRODUIT, pas l'outillage — rang Hors Agence |
| `check-spirit` | chacun de ses passages envoie de vraies provocations au vrai modèle : l'exercer à chaque commit coûterait de vrais appels API (Articles 8 et 22) |

**UNE EXEMPTION SANS RAISON N'EST PAS UNE DÉCISION, c'est un abandon déguisé** (Article 28) — d'où
la colonne de droite, et un test qui refuse une raison trop courte pour être actionnable.

**`check-spirit` EST LE CAS QUI PROUVE LE POINT** : il est resté **cassé du 2026-09-21 au
2026-09-27** sans que rien dans le paysage puisse le dire. L'exemption est légitime, **le trou
qu'elle laisse est réel**, et le déclarer EST la protection (Article 27).

**LA LISTE EST TENUE À LA MAIN, ET C'EST ASSUMÉ** : savoir qu'un script ne PEUT pas être exercé
demande de lire ce qu'il fait, et aucune sonde ne sait ça. Mais une liste manuelle sans vérificateur
se périme en silence — `findExemptionsSansScript()` refuse donc une exemption qui désigne un script
disparu, sans quoi elle ne protégerait plus rien et pourrait un jour couvrir le mauvais fichier
(Article 24).

### Ce que ce bloc PRÉPARE sans le décider

Élargir le périmètre de **39 à 68 scripts** élargit ce qu'un Gardien sacré surveille : c'est une
décision de l'utilisateur, jamais une factorisation. Sur les 30 outils concernés, **23 sont
réellement exercés** (gain immédiat) et **7 ne le sont jamais** — dont les quatre ci-dessus. Sans ce
registre, l'élargissement produirait **sept alertes qu'aucun geste ne peut faire taire** (leçon L36),
et un garde-fou qui crie sans issue devient du décor (L6). Une assertion du filet garantit que le
périmètre n'a pas grandi tout seul.

## Le ⚠️1 que rien ne pouvait éteindre (2026-09-29, tâche #1215)

**Ce que c'était** : AXA-CHECK affichait un `⚠️1` à CHAQUE commit depuis la tâche #1189, et c'était
`smart-breaker` — le seul des 40 outils dont la couverture était NON MESURÉE.

**La cause, vérifiée et non supposée** : `check-gemini-quota.mjs` n'exporte RIEN. C'est un script à
corps de premier niveau, ce que la suite de tests documentait déjà nommément ailleurs. Il n'y a
littéralement aucune fonction à importer, donc aucune à exercer — **ce n'est pas un test qui manque,
c'est une surface qui n'existe pas**. Et son corps sonde les clés pour de vrai : l'exercer coûterait
des appels API à chaque commit, exactement comme `check-spirit`.

**L'exemption est donc déclarée avec sa raison, et le trou qu'elle laisse est dit franchement** : le
jour de la panne, cet outil est le premier qu'on lance, et rien ne garantit mécaniquement qu'il
marche encore — c'est exactement ce qui est arrivé à `check-spirit`, resté cassé six jours sans que
rien ne le dise. Deux gestes l'atténuent, écrits plutôt que supposés : la charte impose de le lancer
à la main dès un blocage 429/503 répété, et sa logique de fond vit dans `gemini-key-health.mjs` et
`api-providers.mjs`, qui sont mesurés, eux.

**Deuxième défaut trouvé en chemin** : la bannière de commit comptait « pas de score », ce qui
additionnait « NON MESURÉ » (un trou à combler) et « jamais exerçable » (une limite déclarée). Cet
outil sépare soigneusement ces trois états et dit lui-même qu'ils ne se confondent jamais ; la
bannière, elle, les mélangeait — donc elle affichait un ⚠️ que rien ne pouvait éteindre, et une
alarme indélogeable devient du décor (leçon L6). Elle compte désormais avec `etatDeCouverture()`.

**Troisième pièce, et c'est celle qui empêche l'exemption de pourrir** : une RAISON se périme aussi,
pas seulement un fichier. `findExemptionsDontLaRaisonADisparu()` vérifie que le fait invoqué — « ce
script n'exporte aucune fonction » — est toujours vrai. Le jour où quelqu'un y ajoute un export, il
y a une surface à tester et l'exemption la couvrirait en silence. Un fichier illisible ne vaut
jamais confirmation (leçon L5).
