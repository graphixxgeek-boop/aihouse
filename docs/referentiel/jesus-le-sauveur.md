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
