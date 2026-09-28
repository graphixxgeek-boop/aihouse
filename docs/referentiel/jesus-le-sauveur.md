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
