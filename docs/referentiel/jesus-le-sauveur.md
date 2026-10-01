# JESUS-LE-SAUVEUR — instanciation sur ce projet

*(Blueprint générique : `docs/jesus-le-sauveur-blueprint.md`. Registre des passages :
`docs/jesus-le-sauveur/index.md`. Script : `scripts/jesus-le-sauveur.mjs`.)*

## D'où il vient

Demande explicite de l'utilisateur le 2026-09-28 : « je suis prêt à créer un agent dédié à ce
sujet — s'assurer que le projet avance toujours à bon rythme, sans être freiné par des lourdeurs ».
Puis, le même jour : « il devra t'aider à détecter toutes les raisons possibles de ralentissement,
et **surtout, il voit les causes indirectes, inattendues** ».

**Le nom est de lui**, famille des prophètes.

## Sa place : les « Prophètes du Temps »

| Membre | Son périmètre |
|---|---|
| **EZECHIEL** | le filet et sa machinerie — des FICHIERS précis qui font perdre du temps |
| **MOÏSE** | la charte — le document qui fait loi |
| **ABRAHAM** | tout document à règles numérotées, **et le chapeau des DOCUMENTS** |
| **JESUS** | tout ce qui est **hors documents**, vision 360, **et le chapeau général** |

**Convoquer JESUS met en action tout le système.** Abraham garde une place spéciale : il sait lire
une règle numérotée, ce que JESUS ne saura jamais faire.

**Ce n'est PAS un Gardien sacré du code** (Article 20bis) : leur critère est de tourner gratuitement
et mécaniquement à *chaque* commit. Lui est **convoqué à chaque gros chantier**.

## Ses sondes sur CE dépôt

| Sonde | Ce qu'elle lit ici |
|---|---|
| `coutDuFilet()` | `docs/ezechiel-les-tests/mesures.json` + les commits de `check-house.mjs` depuis le relevé |
| `outilsAbandonnesApresConstruction()` | `.tool-usage-history.json` — 6 000+ événements datés |
| `coutDUnArrivant()` | `REGISTRES_D_INTEGRATION` dans `scripts/integration-outil.mjs` |
| `alertesQuiNeSEteignentPas()` | `docs/abraham-les-references/alertes.json` |
| `decisionsEnAttente()` | `docs/suivi/sessions/` — les tâches à trancher et leur âge |
| `causesIndirectes()` | le croisement des cinq précédentes |

## Ce qu'il a trouvé à son premier passage réel (2026-09-28)

- **La mesure du temps sur laquelle on s'appuyait annonçait 65 s** quand le filet en met 95 :
  58 commits l'avaient périmée sans que rien ne le dise.
- **10 registres à renseigner** pour chaque outil qui arrive — chacun légitime, la somme jamais discutée.
- **14 décisions attendaient une réponse**, la plus ancienne depuis 6 jours.
- **2 outils n'avaient servi qu'à se construire eux-mêmes** (`claudius-minimus`, `hyper-scan-checkpoint`).

## Les deux défauts qu'il a payés en naissant, gardés en contre-tests

**① La liste écrite à la main mentait.** Une liste de « remèdes connus » a rendu « les 3 remèdes
sont sollicités » sur un cas dont je savais qu'il était faux : `filet-en-parts` affichait 33
passages — dont **30 pendant sa propre construction la veille**. Le compte cumulé masquait tout. La
sonde est devenue dérivée (Article 24).

**② La version corrigée accusait des nouveau-nés.** Cinq outils dont le premier passage datait de la
veille étaient signalés comme « n'ayant plus servi » : pour eux, le jour un EST aujourd'hui. Vrai
arithmétiquement, faux réellement — le faux positif exact que la leçon L4 interdit, et il criait
d'autant plus fort que le projet construisait bien. D'où la **condition d'opportunité** : moins de
trois jours ⇒ **non jugeable**, jamais « sain ».

## Les seuils, et pourquoi ils valent ce qu'ils valent

| Seuil | Valeur | Statut |
|---|---|---|
| `PART_LE_JOUR_UN` | 80 % | déclaré, à dériver quand le corpus le permettra |
| `PASSAGES_MINIMUM` | 5 | en dessous, aucun ratio ne tient |
| `JOURS_AVANT_DE_POUVOIR_JUGER` | 3 | déclaré — c'est la condition d'opportunité |
| `JOURS_AVANT_DECOR` | 3 | déclaré — au-delà, une alerte non éteinte est du décor |

**Aucun n'est encore dérivé d'un creux dans la distribution** (BP5), et le dire fait partie de
l'outil : un seuil décrété qu'on présenterait comme dérivé serait pire que le seuil lui-même.

## Ce qu'il ne fait pas, ici comme ailleurs

Il ne corrige rien seul · il ne touche jamais à CLAUDE.md · il ne reproche aucune attente à
personne · il ne refait pas le travail d'EZECHIEL, de MOÏSE ni d'ABRAHAM.

## Deux pouvoirs de plus, et quatre chiffres faux avant le bon (2026-09-28)

Sur son choix en fenêtre dédiée, JESUS a reçu deux sondes supplémentaires.

### ③ Les alertes écartées de l'affichage

**Mesure du jour : 501 lignes réparties sur 38 sections, écrites à CHAQUE commit** dans
`.banniere-post-commit.txt`, « relu à la demande » — c'est-à-dire par quelqu'un qui doit y penser.

**Première version FAUSSE, gardée écrite dans le code** : elle cherchait dans ce fichier les lignes
de comptage que la bannière imprime à l'écran. Ce fichier n'est pas la bannière, **c'est son
contraire** : la part écartée. La sonde rendait donc « PAS MESURÉ » — un refus juste sur une
question mal posée.

**Ce qu'elle refuse de dire** : la part réellement LUE. Elle n'est pas mesurable depuis ce fichier,
donc `partVue` vaut `null` et jamais un pourcentage fabriqué.

### ④ Mes propres allers-retours — QUATRE CHIFFRES FAUX D'AFFILÉE

C'est la partie la plus instructive de tout l'outil, et elle est écrite en entier pour que personne
ne refasse le chemin :

| Version | Chiffre | Pourquoi il était faux |
|---|---|---|
| 1 | 66 % | comptait le crochet post-commit, qui lance tous les Gardiens sacrés du code d'affilée — légitime |
| 2 | 56 % | filtrait par origine, mais le crochet lance ses outils en sous-processus `cli_direct` |
| 3 | 46 % | exigeait « pas de commit entre les deux », or **le crochet tourne APRÈS le commit** : tous ses passages tombent structurellement entre deux commits |
| 4 | 51 % | comptait encore les enregistrements de FONCTION — 1 688 pour le seul `angel-of-ia-process`, posés par `recordFunctionUsage()` à l'intérieur d'un passage |
| **5** | **42 %** | ne garde que les vraies sollicitations, hors rafale du crochet |

**Chacun était plus crédible que le précédent** — c'est exactement ainsi qu'un chiffre faux finit
par être cru : à force d'être corrigé, il prend l'air d'un chiffre travaillé.

**Le premier nommé est une vraie trouvaille** : `data-archangel`, 254 relances rapprochées. C'est
`index --generer` puis `index --completer` lancés à la suite avant chaque commit — deux commandes là
où une suffirait.

**Sans git, la sonde REFUSE de conclure** : sans les dates de commit, rien ne distingue une relance
d'une rafale.

## Le système complet : deux axes qui ne se recouvrent jamais (2026-09-28)

Né de ses trois questions du même jour : *« comment s'inscrit Ezechiel dans la cascade ? »* ·
*« est-ce que tous ces outils ont un mode léger/ciblé/lourd ? on avait parlé des modes light/target/
warrior, ça en est où ? »* · *« l'autre outil, assainissement — quel est son rôle ? »*

### ① LA LARGEUR — la cascade, quatre maillons

| Rang | Qui | Périmètre | Lui seul voit |
|---|---|---|---|
| 1 | **JESUS** | tout ce qui est HORS documents | le coût réel d'une règle, et qu'un outil censé la porter ne sert plus |
| 2 | **ABRAHAM** | tout document à règles numérotées | un renvoi mort, une règle sans porteur, deux documents qui se recouvrent |
| 3 | **MOÏSE** | la charte seule | un Article disparu, renuméroté, vidé de ses obligations |
| 4 | **EZECHIEL** | le filet — un FICHIER précis | un bloc sauté, un test vert et vide, d'où vient le temps |

**EZECHIEL manquait à la première version.** Il l'a rappelé, et sa place tombe d'elle-même : la
chaîne est une **largeur décroissante**, il en est le terme le plus étroit.

### ② LA PROFONDEUR — le niveau, et il existait déjà

**Réponse mesurée à sa question « ça en est où ? » : le système existe depuis le 2026-09-19 et
s'appelle CHECK-LEVEL-TARGET.** Quatre niveaux — `leger`, `standard`, `approfondi`,
`exceptionnel` — qu'il sait déjà DÉDUIRE d'une phrase. **Ce qui manquait n'était pas le système :
c'est que la cascade ne le consultait pas.**

### Pourquoi deux axes et pas un seul curseur

**Les confondre donnerait un réglage unique qui ne sait rien régler.** Une réparation de coquille
veut une largeur complète et une profondeur minimale ; un audit de charte veut l'inverse. Un seul
curseur ne peut pas rendre les deux.

**Et « différé » n'est jamais « muet »** : un maillon que le niveau n'atteint pas est NOMMÉ dans le
rapport, avec ce qu'on ne saura donc pas. « Rien à dire » et « pas convoqué » n'envoient pas au même
endroit.

### ③ LE RASSEMBLEUR — `assainissement`, et il n'est pas un cinquième maillon

**La cascade DÉROULE, `assainissement` RAMASSE.** Deux gestes opposés, donc jamais
interchangeables : une chaîne qui ramasserait elle-même devrait garder la mémoire de ses passages,
ce qu'un registre partagé fait déjà mieux.

Ce qu'il apporte et que personne d'autre ne voit : **l'ÂGE des alertes** — invisible quand on lance
les outils un par un.

```
node scripts/jesus-le-sauveur.mjs cascade [niveau] <sujet>
node scripts/abraham-les-references.mjs assainissement     # puis le ramassage
```

## Les deux derniers pouvoirs (2026-09-28)

### La fluidité réelle de la file — **50 %**

**Mesure du jour : fluidité médiane 50 %** sur les 39 tâches ayant passé au moins une nuit. Donc
**la moitié du délai d'une tâche est de l'attente**, pas du travail.

**Comment elle se calcule sans rien inventer** : l'ouverture est l'horodatage de la ligne de suivi ;
la clôture est le dernier commit citant le numéro ; les jours travaillés sont les jours distincts où
un commit la cite. Tout vient de git et du registre.

**CINQUIÈME FAUX VERT DE LA JOURNÉE, évité de justesse.** La première version rendait **100 % sur
260 tâches** — arithmétiquement juste, entièrement creux : la majorité des tâches s'ouvrent et se
ferment le même jour, donc leur fluidité vaut 1 **par construction**, jamais par mérite. La médiane
ne mesurait que la proportion de tâches faites d'un trait. **221 tâches sont désormais écartées pour
cette raison, et le nombre est dit.**

**Ce qu'elle surestime, déclaré dans sa propre sortie** : un jour portant un seul commit compte pour
un jour travaillé entier. Le chiffre rendu est donc un **PLAFOND** — la vraie fluidité est plus
basse. C'est le bon côté de l'erreur : on sait dans quel sens il penche.

### Le coût d'un Article, vu du DEHORS

**La décision, prise sur sa question « pourquoi chez Jesus ? c'est pas chez Moïse ? » : la mesure se
COUPE en deux, et la coupure suit la cascade.**

| | Qui | Ce qu'il voit |
|---|---|---|
| **DEDANS** | MOÏSE | combien d'obligations un Article porte, s'il a été vidé, renuméroté — un fait sur le document |
| **DEHORS** | JESUS | quel code l'applique réellement, qui le cite — ça n'est écrit nulle part dans la charte |

**JESUS ne recalcule jamais la moitié de MOÏSE : il l'obtient en l'appelant par la cascade**
(Article 24 — un registre se LIT, il ne se recopie pas).

**Sa limite, écrite dans sa propre sortie** : un Article sans porteur dans le code **n'est pas
inutile**. Beaucoup des règles les plus importantes du projet ne PEUVENT pas avoir de porteur
mécanique — « avoir réellement compris avant d'agir » ne se teste pas — et la charte le déclare
elle-même (Article 27 : déclarer l'impossibilité EST la protection). La sonde rend un **fait**,
jamais un verdict. **État du jour : les 33 Articles sont tous cités au moins une fois.**

## JESUS ralentissait le projet qu'il existe pour accélérer (2026-09-28)

**Mesuré** : `fluiditeDeLaFile()` lançait **un `git log --grep` par tâche fermée** — 324
sous-processus, **15,2 s**. Deux blocs du filet appellent le passage complet, donc elle a fait
grossir la suite de tests d'une trentaine de secondes à elle seule.

**Corrigé** : un SEUL `git log`, le rattachement des numéros de tâche fait en mémoire.
**15,2 s → 0,1 s**, résultat strictement identique (50 % de fluidité médiane sur 39 tâches).
**Filet : 132 s → 105 s.**

### Le premier coupable était le mauvais, et c'est la partie instructive

Le chronomètre d'Ezechiel attribuait **36 s au dernier bloc du filet** — celui que je venais
d'écrire. J'ai « optimisé » une sonde d'Abraham sur cette foi.

**Elle prenait déjà 1 seconde.** Le gain était nul (1,0 → 1,3 s, donc légèrement PIRE), et le
changement a été annulé. La cause réelle n'est apparue qu'en chronométrant **chaque sonde
séparément**.

**Le dernier bloc d'une suite absorbe tout ce qui n'est rattaché à rien** — code au niveau du
fichier, démontage du processus. C'est encore la classe d'erreur dominante de la journée : un
signal ADJACENT (le temps jusqu'à la fin de l'exécution) lu comme le signal visé (le coût propre du
bloc). **Une attribution n'est pas une mesure.**

### Et le séparateur qui n'en était pas un

Le premier `git log --format=%ct|%s` rendait une **chaîne vide** : le `|` passé au shell est un
TUBE, pas un séparateur de champs. Un `git log` muet ressemble à un dépôt sans commits — et la
sonde annonçait « 0 tâche mesurable » sur un registre qui en porte 324.

---

## LE CINQUIÈME TERRAIN — LE JEU (2026-09-30, tâche #1322)

**Il a nommé QUATRE axes de ralentissement le 2026-09-29** : *« qu'est-ce qui ralentit le codage
ET/OU l'IA ET/OU le jeu ET/OU l'agence »*. L'outil en couvrait **trois**, et son rapport le
déclarait honnêtement en tête plutôt qu'en note de bas de page. **C'était juste et insuffisant :
une absence déclarée reste une absence**, et celle-ci a duré un jour et demi.

**Le trou était plus large que cet outil**, vérifié le 2026-09-30 : le KPI qui s'appelle
« performance » dans le tableau de bord ne mesure que le **Smart Breaker**, c'est-à-dire la
résilience des clés d'API. **Rien, nulle part, ne disait ce qui rend un tour de jeu lent** — sur
le produit que toute l'Agence est censée servir.

### CE QUE LA SONDE MESURE, ET LA SOURCE ÉTAIT DÉJÀ LÀ

Le poste de coût dominant d'un tour **n'est pas le rendu 3D** : c'est ce qu'on envoie au modèle,
deux fois par tour, un cerveau par personnage. Ce poids était **déjà** échantillonné par
memory-audit dans `.memento-history.json` — un journal que personne ne relisait à cette fin.

**Premier passage réel (2026-09-30)** : 310 tours, **9 821 tokens en moyenne par personnage**
(min 3 408, max 11 557), deux cerveaux par tour, soit **~19 600 tokens par tour de jeu**.

**Les deux cerveaux ne sont pas contestés par cette sonde, et c'est écrit dans son code** :
l'Article 8 maintient la séparation « malgré son coût » parce qu'elle sert l'Article 0. **La sonde
COMPTE ; elle ne tranche pas.**

### CE QU'ELLE NE MESURE PAS — nommé un par un, jamais résumé en « divers »

| Hors portée | Pourquoi |
|---|---|
| la latence réelle d'un tour | il faut un serveur qui tourne et un vrai appel au modèle |
| les images par seconde du rendu 3D | il faut un navigateur ouvert sur la scène |
| le poids envoyé au navigateur | il faut une compilation, que la sonde ne déclenche pas |
| **ce que RESSENT un visiteur** | **il faut un humain, et aucun mécanisme ne le remplacera** |

**Une sonde qui tairait ces quatre-là ferait passer un tiers du sujet pour le sujet entier** —
c'est le motif L47, celui que ce projet paie le plus souvent.

**Et elle refuse de conclure sans données** : un `.memento-history.json` vide rend *PAS MESURÉ*,
jamais « un tour est léger ». Ce journal ne se remplit qu'en JOUANT — donc un zéro dit que le jeu
n'a pas tourné récemment, ce qui est une information en soi.

## Le taux d'actionnabilité est devenu calculable — en principe (2026-10-01, tâche #1355)

La sonde déclarait une impossibilité **et son remède** : « que le plan d'action inscrive le numéro
de la tâche qu'il a fait naître ». Le remède a été construit le 1er octobre dans le gabarit partagé
(`numeroTache`, voir `docs/referentiel/report-template.md`). La sonde lit désormais ce champ.

**Elle ne passe pas au vert pour autant, et c'est le point.** Les rapports déjà sur le disque n'ont
pas de numéro et n'en auront jamais : on ne réécrit pas l'histoire. Tant qu'aucun rapport n'a
renseigné l'emplacement, elle rend toujours **PAS MESURÉ** — jamais « 0 % », qui accuserait d'un
manquement jamais mesuré (leçons L5/L11).

**Deux chiffres sortent, jamais fondus en un seul** :

- la **COUVERTURE** — quelle part des constats RETENUS déclare le numéro de la tâche qu'elle fait
  naître. Elle dit si le LIEN est écrit.
- le **TAUX** — sur ces seuls constats, quelle part pointe une tâche qui **existe vraiment** dans
  `docs/suivi/`. Il dit si la tâche annoncée est réelle.

Un taux de 100 % sur une couverture de 2 % voudrait dire « les rares qui déclarent sont bons » ; il
ne dira jamais « la chaîne tient ». Et les constats sans numéro **ne sont pas comptés comme des
échecs** : ce sont des constats SANS TRACE, écrits avant que l'emplacement existe.

**Son propre registre est hors du balayage** (`DOSSIERS_HORS_MESURE_ACTIONNABILITE`), et la raison
est une leçon payée la veille (XP #34) : une mesure dont le rapport vit dans le corpus qu'elle
mesure fabrique sa propre amélioration. La preuve est tombée le jour même — **341 constats sont
redescendus à 335** une fois l'exclusion posée.

**Hors portée** : la couverture dit si le lien est ÉCRIT, jamais si la tâche a été FAITE.
