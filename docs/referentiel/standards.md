# Le référentiel des standards — ce que « être à niveau » veut dire, précisément

*(Créé le 2026-09-23, chantier 5 du plan de nuit. Demande de l'utilisateur : « qui se charge de
vérifier que tout est à niveau dans le code, dans le projet, dans l'agence, dans le jeu ? [...] je
parle de tout mettre à niveau aussi par rapport aux standards, aux formats, gabarits, etc. TOUT TOUT
doit être à niveau, tu vois la profondeur ? »)*

**POURQUOI CE DOCUMENT EXISTE AVANT L'OUTIL QUI LE LIT.** Pour qu'un vérificateur puisse dire « ce
n'est pas à niveau », il faut un niveau écrit quelque part. Aujourd'hui les exigences sont
éparpillées dans le code d'une dizaine d'outils, chacun vérifiant sa part sans que personne ne
détienne la liste. **Sans ce document, « pas à niveau » n'est qu'une opinion** — et un verdict qui
n'est qu'une opinion se discute au lieu de se corriger.

**CE DOCUMENT N'INVENTE RIEN.** Chaque exigence ci-dessous existait déjà, quelque part : dans la
charte, dans un garde-fou, dans une décision tranchée. Ce qui est neuf, c'est qu'elles sont réunies,
et que chacune dit **qui la vérifie** — ou déclare honnêtement que personne ne la vérifie.

---

## Les quatre niveaux, tous retenus

**POURQUOI CES TITRES SONT ÉCRITS `NIVEAU n — NOM : explication`, ET POURQUOI IL NE FAUT PAS Y
TOUCHER.** THE-EQUALIZER lit ce document à l'exécution plutôt que de recopier ses exigences dans son code
(Article 24) : le NOM en majuscules avant les deux-points est ce qui rattache chaque tableau à un
domaine de verdict. Le premier jet de ces titres était en prose (« NIVEAU 2 — SES PROPRES
documents ») et l'outil devait deviner le nom du niveau en cherchant le premier mot en majuscules :
il a lu « SES », n'a rattaché ce niveau à aucun domaine, et **a rendu un rapport d'apparence normale
où sept exigences sur vingt-neuf avaient purement disparu**. Un niveau que l'outil ne sait pas
nommer est désormais refusé bruyamment plutôt que sauté en silence.

L'utilisateur a coché les quatre. Ils sont volontairement séparés parce qu'un outil peut être
parfaitement conforme à l'un et absent des trois autres.

### NIVEAU 1 — FORME : ce que l'outil produit

| # | Exigence | Vérifiée par | État |
|---|---|---|---|
| F1 | Le rapport porte l'en-tête commun (outil, date, état du code, version de Claude) | `printReportHeader` + pure-gold-unity | ✅ mécanique |
| F2 | Le rapport porte une date, en toutes lettres | `dateEnToutesLettres` + pure-gold-unity | ✅ mécanique |
| F3 | Le rapport a du CONTENU, jamais un simple renvoi vers un fichier | `findRapportsQuiPointent` | ✅ mécanique |
| F4 | Le rapport porte un plan d'action quand il produit des constats | `findOutilsSansPlanDaction` | ✅ mécanique |
| F5 | Chaque constat porte un des trois états (retenu / écarté avec raison / à trancher) | `buildPlanDaction` | ✅ mécanique |
| F6 | Le rapport sort TOUT ce que l'outil sait détecter — aucun détecteur muet | `findDetecteursMuets` | ✅ mécanique |
| F7 | Un outil heuristique porte son avertissement d'inexactitude | `printReliabilityNotice` | ✅ mécanique |
| F8 | Le rapport suit le schéma unifié `SCAN >> RAPPORTS >> ANALYSE >> PLAN D'ACTION >> QUESTIONS >> TÂCHES` | `findSchemaDivergent` | ✅ mécanique |

### NIVEAU 2 — DOCUMENTS : ceux que l'outil possède en propre

| # | Exigence | Vérifiée par | État |
|---|---|---|---|
| D1 | Un blueprint générique, réutilisable sur un autre projet | `findOutilsSansBlueprint` | ✅ mécanique |
| D2 | Le blueprint ne fuit aucun jargon propre à ce projet | `findFuitesDeSpecificite` | ✅ mécanique |
| D3 | Une instanciation dans `docs/referentiel/<outil>.md` | SAFE-EXPORT | ✅ mécanique |
| D4 | Un registre dans `docs/<outil>/` avec son `index.md` | `findRegistriesMissingFromCircle` | ✅ mécanique |
| D5 | Une ligne dans la table maîtresse `docs/regles-de-travail.md` §7ter | `findScriptsMissingFromAgentFiles` | ✅ mécanique |
| D6 | Une place dans l'organigramme (rang et catégorie) | CASSANDRA-RH | ✅ mécanique |
| D7 | Le vocabulaire de rang est non ambigu (Article 20bis) | `findGardienAmbigu` | ✅ mécanique |

### NIVEAU 3 — CAPACITÉS : ce qu'il sait faire comme le reste de l'équipe

*« Bénéficie-t-il de tout ce que l'équipe sait faire, ou est-il resté au niveau du jour où il est
arrivé ? » C'est le niveau que l'Article 24 nomme et que personne ne mesurait en entier.*

| # | Exigence | Vérifiée par | État |
|---|---|---|---|
| C1 | Ses fonctions mécaniques sont couvertes par un test | AXA-CHECK | ✅ mécanique |
| C2 | Il a une mémoire, et il la relit | TOOL-LEARNING | ✅ mécanique |
| C3 | Son usage réel est compté | `tool-usage` | ✅ mécanique |
| C4 | Il a un objectif chiffré, ou l'absence d'objectif est assumée par écrit | objectifs-vs-resultats | ✅ mécanique |
| C5 | Sa donnée est lue par quelqu'un, ou son orphelinat est déclaré | data-archangel | ✅ mécanique |
| C6 | Il est joignable via tool-brain | `findToolsMissingFromMenu` | ✅ mécanique |
| C7 | Il est classé en fiabilité | `TOOL_RELIABILITY` | ✅ mécanique |

### NIVEAU 4 — CODE : le code lui-même

| # | Exigence | Vérifiée par | État |
|---|---|---|---|
| X1 | Aucun trou logique connu | ARGUS | ✅ mécanique |
| X2 | Aucun lien devenu incohérent | HARMONIA | ✅ mécanique |
| X3 | Aucun bloc dupliqué non justifié | CLONE-HUNTER | ✅ mécanique |
| X4 | Aucune zone en stagnation non examinée | CLEAN-DIRTY-OLD | ✅ mécanique |
| X5 | Aucune liste recopiée à la main sans garde-fou (Article 24) | les 12 garde-fous dédiés | ✅ mécanique |
| X6 | Le POURQUOI vit à côté du QUOI (Article 27) | **personne** | ⚠️ **non vérifié** |
| X7 | Le code applique les leçons déjà apprises | TOOL-LEARNING (porteurs) | ⚠️ **partiel** — seulement pour les leçons qui ont un porteur |

---

## Ce que ce référentiel déclare NE PAS couvrir

**Trois exigences n'ont aucun vérificateur, et le dire est la seule protection possible :**

- **X6 — le POURQUOI à côté du QUOI.** Aucune mécanique ne peut juger si un commentaire explique
  vraiment la raison d'être d'un mécanisme, ou s'il paraphrase le code. Seule une relecture humaine
  ou un agent de raisonnement le peut.
- **X7, en partie.** Une leçon sans porteur mécanique ne peut pas être vérifiée dans le code.
- **La qualité du jeu lui-même** (le ton, le naturel des dialogues, la cohérence narrative) n'est pas
  dans ce référentiel : elle relève de la charte et d'EL-PROFESSOR, jamais d'un standard d'outillage.

**Pourquoi ces absences sont écrites plutôt que tues** : un référentiel qui prétendrait tout couvrir
donnerait un « tout est à niveau » faux. Les trois trous ci-dessus sont la partie honnête du verdict.
