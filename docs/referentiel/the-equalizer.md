# THE-EQUALIZER — instanciation propre à ce projet

*Blueprint générique : `docs/the-equalizer-blueprint.md`. Ce document-ci ne répète pas le principe, il
dit comment il est instancié ici et ce que ce projet en a appris.*

## D'où il vient

Demande de l'utilisateur, en ses termes : « qui se charge de vérifier par ailleurs que tout est à
niveau [...] je parle de tout mettre à niveau aussi par rapport aux standards, aux formats,
gabarits, etc. **TOUT TOUT** doit être à niveau, tu vois la profondeur ? »

Forme tranchée par lui en fenêtre de calibrage : « **Un rassembleur, qui ne scanne rien lui-même** —
il n'ajoute aucun scan : il appelle les contrôleurs existants et rend UN verdict unique par domaine
(code / Agence / jeu / documents), en nommant ce qui n'est couvert par personne. »

Construit le 2026-09-23 (chantier 5 du plan de nuit), **seul nouvel outil autorisé cette nuit-là**.

## Sa source de vérité

`docs/referentiel/standards.md` — 29 exigences sur quatre niveaux, chacune nommant son
vérificateur. Le document a été écrit AVANT l'outil, délibérément : sans lui, « pas à niveau »
n'aurait été qu'une opinion.

Le tableau est **lu à l'exécution** (Article 24). Ajouter une ligne au référentiel suffit à ce que
THE-EQUALIZER la prenne en compte — aucune modification de code, jamais une liste recopiée qui se
périmerait au premier standard ajouté.

## Les quatre domaines, et le vide assumé

| Domaine | Niveaux du référentiel | État au jour de sa construction |
|---|---|---|
| l'Agence | FORME, CAPACITÉS | 15/15 vérifiées mécaniquement |
| les documents | DOCUMENTS | 7/7 vérifiées mécaniquement |
| le code | CODE | 5/7 — X6 et X7 déclarés non couverts |
| le jeu | *(aucun)* | hors périmètre assumé |

**« le jeu » figure dans la table sans porter aucune exigence, et c'est délibéré** : la qualité
narrative relève de la charte et d'EL-PROFESSOR, jamais d'un standard d'outillage. Un domaine
absent de la table serait indiscernable d'un domaine oublié — il est donc présent pour le DIRE.

## Ce qu'il délègue, et à qui

- **Le retard outil par outil** → `integrationAudit()` (LE-COORDINATEUR), avec le contexte réel
  construit par `buildRealOnboardingContext()` (check-tasks-details).
- **Les angles morts d'intégration** → `findToolsMissingFromMenu()`,
  `findScriptsMissingFromAgentFiles()`, `findReportingToolsMissingFromCircle()`.

Son seul accès disque propre est la lecture des noms exportés de `scripts/` — pour vérifier qu'un
vérificateur annoncé existe. Ce n'est pas un scan de qualité du code, c'est le contrôle des
promesses du référentiel.

## Trois défauts payés le jour même, gardés ici parce qu'ils ressortiront ailleurs

**1. Le titre en prose qui efface une section entière.** Le premier parseur cherchait « le premier
mot en majuscules » du titre. Sur `### NIVEAU 2 — SES PROPRES documents`, il a lu « SES », ce
niveau n'a correspondu à aucun domaine, et **les sept exigences D1–D7 ont disparu d'un rapport dont
rien n'indiquait qu'il était incomplet**. Corrigé des deux côtés : les titres portent désormais un
nom explicite, l'outil lève une erreur sur un titre qu'il ne sait pas nommer, et il crie tout
niveau rattaché à aucun domaine.

**2. La boucle réécrite qui fabrique dix-sept faux écarts.** Le premier jet parcourait la table
maîtresse lui-même et appelait `checkAgentOnboarding()` avec la cellule BRUTE — parenthèse de
précision comprise. Le slug devenait
`docs/referentiel/cassandra-rh-scripts-cassandra-rh-mjs.md` — un chemin qui n'existe pas et n'a
jamais existé, c'est tout le bug —, donc tout manquait, pour presque tous
les outils. Deux enseignements : ce découpage était déjà écrit trois fois dans le même fichier
(devenu `primaryToolName()` à cette occasion), et `integrationAudit()` faisait déjà exactement ce
travail, en mieux. **Le signal qui a sauvé le rapport : quand un détecteur accuse presque tout,
c'est presque toujours lui qui a tort.**

**3. Le contexte reconstruit à côté du contexte officiel.** Même après avoir délégué la boucle,
reconstruire le contexte d'appel à la main faisait ressortir THE-DEEP-READER et Smart Breaker comme
de vrais écarts — alors que leurs déviations sont déclarées depuis des jours dans
`buildRealOnboardingContext()`. Un faux positif, c'est précisément ça : une décision prise ailleurs,
oubliée ici.

## Sa place dans l'Agence

Membre (Suite Dette & Structure du code), **jamais Gardien sacré** : il ne remplit aucun des deux
volets du critère — il ne scanne rien par lui-même, et il ne tourne pas à chaque commit. Item de
Ronde `the-equalizer` (l'item portait `a-niveau` avant le renommage du 2026-09-23, tâche #580 ; la fiche gardait l'ancien slug, ce qui envoyait chercher un item inexistant — corrigé par #577), fiabilité **mécanique** (il n'estime rien), registre `docs/the-equalizer/`,
prestation « Pack Niveau » au catalogue.

**Frontière avec ses deux voisins**, tranchée pour qu'elle ne se rediscute pas : CASSANDRA-RH juge
l'ÉTAT et les MOYENS d'un outil, TOOL-LEARNING sa TRAJECTOIRE — THE-EQUALIZER ne juge aucun outil, il
juge la **couverture des exigences elles-mêmes**.

## Ce qui reste ouvert, et c'est dit plutôt que tu

**Sa ligne de l'inventaire documentaire de CLAUDE.md n'a pas été écrite.** CLAUDE.md était hors
périmètre la nuit de sa construction (réservé à la tâche #208, à traiter avec l'utilisateur).
`integration-outil.mjs` le signale donc à chaque passage (9/10 registres) — un manque visible,
jamais un oubli silencieux.


## Trois états d'exigence, jamais deux (2026-09-23, tâche #585)

L'échelle en portait deux — vérifiée mécaniquement, ou pas — pendant que le commentaire de son
propre verdict en promettait trois. L'écart n'était pas cosmétique : une exigence dont la moitié
mécanisable EST vérifiée et dont l'autre moitié ne peut pas l'être se faisait annoncer « vérifiée
par personne ». C'est faux, et c'est coûteux dans les deux sens — ça pousse soit à reconstruire ce
qui existe déjà, soit à cesser de lire l'alerte.

**Les trois états** : `mecanique` (✅) · `partielle` (⚠️ + le mot « partiel ») · `non-verifiee`
(⚠️ sans ce mot). Les deux derniers gardent la même icône, et c'est volontaire : dans les deux cas
l'exigence n'est pas entièrement tenue. C'est le QUALIFICATIF écrit à côté qui tranche — on lit ce
que le référentiel dit, plutôt que d'exiger une icône de plus que le prochain rédacteur oublierait.

**Ce que le constat dit désormais** : une exigence partielle est nommée avec la moitié qui EST
couverte, reprise mot pour mot du référentiel. C'est la seule information qui compte, et la version
binaire l'effaçait entièrement.

Même discipline que partout ailleurs dans ce projet : mesuré / pas mesuré / pas mesurable ne se
confondent jamais.

## LA CONFRONTATION AVEC UN CADRE EXTÉRIEUR

*(2026-09-27, tâche #1003. Sa question : « quel outil pourrait accompagner le passage des 15 tests,
comment on peut organiser tout ça efficacement » — les quinze règles de gouvernance G1-G15 de son
dossier de conception, enregistré dans `docs/gouvernance-agence-virtuelle-cadre-cible.md`.)*

```
node scripts/the-equalizer.mjs confronter [chemin-du-cadre]
```

**POURQUOI UN OUTIL PLUTÔT QU'UNE LECTURE.** Confronter quinze règles à vingt-neuf exigences à l'œil
donne un avis ; le refaire dans un mois donne un autre avis, et rien ne dit lequel a changé — la
liste ou le jugement. Le rapprochement se mesure donc, et la mesure se rejoue.

**CE QU'IL SAIT ET CE QU'IL NE SAIT PAS, et c'est imprimé EN TÊTE de la sortie plutôt que caché dans
un commentaire** : il rapproche par **vocabulaire partagé**, jamais par compréhension. Deux règles
peuvent partager des mots sans dire la même chose, et dire la même chose sans partager un mot.
Chaque ligne est un **CANDIDAT à lire**, jamais une couverture prouvée — un outil qui présenterait
ça comme un verdict ferait pire que rien.

**« AUCUN CANDIDAT » NE VEUT PAS DIRE « PAS PRATIQUÉ », et c'est la lecture la plus importante.**
Premier passage réel : **14 des 15 règles n'ont aucune exigence déclarée qui leur ressemble**. Or
plusieurs sont tenues ici tous les jours — la non-régression EST le filet lancé avant chaque commit,
l'humain dans la boucle EST le périmètre sensible, les sorties prouvables SONT l'horodatage et la
version que chaque rapport porte, la revue périodique EST la Ronde. Elles sont **tenues et
invisibles à l'inventaire**, ce qui est exactement le défaut que ce projet traque ailleurs sous le
nom d'axe mesuré mais non déclaré.

**CE QUE LE PLAN D'ACTION DEMANDE, règle par règle** : trancher entre « déjà pratiquée, à INSCRIRE
dans `standards.md` avec son vérificateur » et « pas pratiquée ici, et c'est une décision ». Jamais
un oubli à combler en silence — déclarer une exigence engage l'Agence à la vérifier.

**Deux refus de conclure**, chacun contre un faux vert : un cadre illisible et une liste d'exigences
vide rendraient tous deux « aucun écart ».

## Le document qui fait loi peut ne pas être là (`standardsAbsents`)

THE-EQUALIZER lit ses exigences dans `docs/referentiel/standards.md`. **Sur un dépôt qui n'a pas
encore écrit ses standards, il mourait** — et un plantage est le pire des verdicts, parce qu'il ne
dit rien du tout. `standardsAbsents()` rend une ligne d'absence DÉCLARÉE plutôt qu'une erreur : elle
nomme l'outil, ce qu'il cherchait, et à quoi ça sert. **Une absence dite vaut mieux qu'un `ENOENT`**,
et c'est ce que l'Agence doit savoir faire le jour où elle arrive ailleurs.
