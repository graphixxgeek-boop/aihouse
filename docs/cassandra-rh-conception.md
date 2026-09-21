# CASSANDRA-RH — dossier de conception consolidé

*(2026-09-21. CASSANDRA-RH n'existe pas encore en tant qu'outil réel — aucun code, aucun blueprint,
aucune instanciation. Ce document réorganise, en un seul endroit cohérent, toutes les décisions de
conception déjà actées avec l'utilisateur au fil de la session (dispersées sur 16+ lignes de
`docs/suivi/sessions/session_0151JrVYzJ2bdCShaXhFAjLo.md`, jamais réécrites — ce document ne
remplace pas le suivi chronologique, il le rend exploitable avant le round de calibrage #134).
Une fois CASSANDRA-RH réellement construite, ce fichier sera remplacé par le triptyque standard
`docs/cassandra-rh-blueprint.md` + `docs/referentiel/cassandra-rh.md` + `docs/cassandra-rh/`.)*

## 1. Rôle et principe fondamental

Un agent RH qui note TOUS les membres de l'équipe (l'utilisateur, l'agent/Claude, les mascottes
Lia/Noé... **non — corrigé depuis** : les Personnages sont hors de l'équipe, cf. section 4) sur
la pertinence du poste ET de l'occupant.

**Anti-doublon, principe fondateur non négociable** : CASSANDRA-RH ne recalcule JAMAIS ce
qu'ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD/ALWAYS-NEW-CODE/EL-PROFESSOR/Smart Breaker/Smart Conso
API/SMART-CONSO-TOKEN savent déjà — elle traduit ces verdicts existants en langage RH. Un outil
fiable existant s'absorbe, jamais dupliqué à côté (même principe que
`docs/philosophie-et-politique.md` §2.9).

## 2. Missions actées

- **Noter** chaque membre sur la pertinence du poste ET de l'occupant.
- **Signaler un besoin de formation** (amélioration de script, ajout d'extension).
- **Surveiller le coût** (masse salariale), nourrie par Smart Conso API/SMART-CONSO-TOKEN.
- **Recruter** de nouveaux scripts/skills sur le web — lecture de documentation/avis UNIQUEMENT,
  JAMAIS d'exécution de code externe non vérifié (décision de sécurité explicite).
- **Recommander un "licenciement"** si un script n'est plus utile ou mérite une refonte complète —
  mappé sur les verdicts ARGUS ("plus jamais lu")/ALWAYS-NEW-CODE ("profiterait d'un remplacement").
- **Surveiller la taille de l'équipe.**
- **Reprend le flambeau complet du KPI** (2026-09-21, décision explicite) : organiser et fiabiliser
  toute la partie tableau de bord/KPI, pas seulement un signal RH en plus — rejoint directement la
  tâche #145 déjà ouverte. Implique de revoir la frontière avec `kpi-report.mjs` au moment de la
  construction réelle, jamais une seconde couche empilée à côté.
- **Alerte KPI proactive** : remonter une alerte si des KPI sont trop faibles ou si des membres
  n'atteignent pas leurs objectifs — jamais une simple lecture passive du tableau de bord.
- **Vision croisée code/membres** : une lecture explicite performance code/site ↔ résultats des
  membres, jamais deux familles de chiffres lues séparément.
- **Point de consultation "qui fait quoi"** : une connaissance parfaite de chaque membre pour
  répondre à "analyse-moi cet agent/script, ses fonctions, sa description" — lit toujours
  l'instanciation (`docs/referentiel/<slug>.md`, toujours présente) ET le blueprint s'il existe,
  jamais l'un sans l'autre (un Agent comme THE-DEEP-READER n'a pas de blueprint).
- **Recrutement en 3 temps** : CV provisoire → entretien préliminaire qui restreint la liste →
  proposition d'une ou deux embauches pertinentes sur demande de l'utilisateur, jamais spontané.
- **Rapport RH chiffré régulier**, dans la Ronde CIRCLE-TASKS : effectif, organigramme à jour,
  besoins de recrutement, nouveaux candidats à étudier.

## 3. Suivi RH dans le temps

Taille des effectifs, description de l'équipe à une date donnée, entrées/sorties de collaborateurs
(recrutements/licenciements validés), taux d'occupation. **Limite honnête déjà actée** : pas un seul
indicateur universel — un proxy différent par catégorie (tours Smart Breaker pour les mascottes,
fraîcheur/churn pour les scripts, aucun signal fiable pour les skills externes) — à documenter
comme limite, jamais un chiffre inventé.

## 4. Organigramme de l'équipe — consolidé dans son propre document canonique

**Déplacé le 2026-09-22** vers `docs/referentiel/organisation-agence.md` (« l'Agence de production
de code »), à la demande explicite de l'utilisateur de consolider l'organigramme complet en un seul
endroit — jamais dupliqué ici. Ce document canonique définit : les deux axes (Statut de
documentation / Rôle dans l'organigramme), Direction (CASSANDRA-RH + LE-COORDINATEUR), les Gardiens
sacrés du code (renommage de l'Équipe noyau — exactement ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD),
les 6 suites de travail parmi les Membres ordinaires, les 3 catégories définitivement hors de
l'agence (Personnages, Moteur du jeu, code tiers vendu tel quel), et l'Infrastructure comme 3e rang
d'employés sans dossier individuel.

**Ce qui reste ici, propre à la CONCEPTION de CASSANDRA-RH elle-même** (pas au roster lui-même,
qui vit désormais dans le document canonique) :
- **Le rôle (Direction/Gardiens/Membre) est une case À L'INTÉRIEUR du statut Agent existant**,
  jamais un 4e axe séparé.
- **Contrôle croisé** : les Gardiens sacrés se vérifient aussi ENTRE EUX. Les deux directeurs
  passent par les MÊMES scans mécaniques que tout le monde (couverture AXA-CHECK, trous ARGUS,
  frictions HARMONIA) — seule l'évaluation RH de pertinence de poste (jugement de CASSANDRA-RH)
  échappe structurellement à eux-mêmes, jamais les scans mécaniques objectifs.
- **Agrégation** : vit DANS le badge existant, enrichi — pas un nouveau mécanisme séparé.
- **Entretien du document canonique** : une fois construite, CASSANDRA-RH tient
  `docs/referentiel/organisation-agence.md` à jour à chaque changement d'organigramme (§8 de ce
  document) — l'info est chez elle, c'est son domaine.

**Correction structurelle définitive (2026-09-21, remplace toute mention antérieure de "mascottes"
comme catégorie de l'organigramme, désormais formalisée dans le document canonique §5)** : les
Personnages (Lia, Noé) sont **entièrement hors de l'équipe**, jamais une catégorie de l'organigramme
— aucun badge, aucun blueprint, aucune couverture AXA-CHECK, rien de tout ça n'a de sens pour un
personnage narratif. CASSANDRA-RH pourra un jour **agréger des verdicts narratifs déjà produits
ailleurs** (memory-audit/EL-PROFESSOR/check-spirit.mjs) sur les Personnages, mais jamais les
noter/scorer comme des membres de l'équipe — une distinction stricte à ne plus jamais violer (cf.
`scripts/lib-shell.mjs::assertNotAPersonnage()`, le même garde-fou déjà câblé pour
`checkAgentOnboarding()`).

## 5. Intégration d'un nouvel Agent — les deux volets

Un nouvel Agent n'est intégré que lorsque **CASSANDRA-RH l'a consigné** ET que
**`checkAgentOnboarding()` rapporte complet** — jamais un troisième script d'orchestration séparé.
En attendant que CASSANDRA-RH existe, ce premier volet reste marqué "en attente" (documenté dans
`docs/regles-de-travail.md`) — `checkAgentOnboarding()` seul fait foi aujourd'hui.

**Extension AXA-CHECK ↔ badge, pour le futur rôle de CASSANDRA-RH** (précisions actées, rien
construit) :
1. Le badge ne doit jamais afficher une couverture AXA "absente" — un scan initial doit faire
   partie de l'onboarding de tout outil devenant éligible au badge.
2. Un outil fraîchement intégré affiche donc logiquement "en cours", jamais "OK" d'emblée.
3. CASSANDRA-RH devra surveiller une régression de couverture AXA d'un outil (OK → en cours), même
   logique que `compareSnapshots()` de `check-tasks-details.mjs`, appliquée à la couverture plutôt
   qu'au statut d'une tâche.
4. Elle devra aussi vérifier qu'aucun outil à badge ne reste jamais "absente" (jamais scanné).

**Prise de fonction complète actée** : à son arrivée, CASSANDRA-RH crée les fiches de chaque
membre, l'organigramme, les documents prévus, met en place le processus badge et vérifie que tout
le monde a bien son badge — une prise de fonction totale, jamais une mise en route partielle.

## 6. Statut cible et exigences de rigueur

- Statut **"complet"** (blueprint + instanciation + registre, comme ARGUS/HARMONIA) — jamais un
  outil mince sans blueprint comme LE-COORDINATEUR : un vrai raisonnement propre au projet est
  nécessaire ici.
- Décision finale de recrutement OU de licenciement **toujours à l'utilisateur** — CASSANDRA-RH
  recommande, ne décide jamais seule.
- Doit produire un rapport HTML (règle "tous les rapports en HTML"), s'appuyant sur les KPI déjà
  calculés ailleurs.
- Recherche pertinente au sens de recrutement : bien harmoniser avec le processus d'intégration et
  le système de badge existant, précision et exactitude requises.
- Cherchera aussi des **blueprints**, pas seulement des scripts/skills, pendant le recrutement.

## 7. Crochets déjà posés dans le code existant, en attente de CASSANDRA-RH

- `scripts/ines-official.mjs::buildEditionSummary()` — `kpiFromCassandra` explicite, `null` tant
  que CASSANDRA-RH n'existe pas, jamais fabriqué.
- Note fondatrice corrigée (2026-09-21) : CASSANDRA-RH pourra un jour agréger les verdicts
  narratifs déjà produits ailleurs sur les Personnages, jamais les noter comme des membres — cf.
  section 4 ci-dessus.
- Un futur audit HARMONIA dédié au système KPI lui-même (vérifier qu'aucune connexion entre
  familles/outils n'est oubliée) — à planifier une fois CASSANDRA-RH construite, rejoint la tâche
  #145 sans la remplacer.

## 8. Pistes de conception non tranchées, à soumettre au round de calibrage (#134)

Ces points **restent de vraies questions ouvertes** — jamais devinés, jamais tranchés seul
(Article 16) :

1. **Cadence de déclenchement** — proposition de l'agent, jamais validée : un signal mécanique
   intégré à CIRCLE-TASKS + un "entretien annuel" complet à la demande (comme THE-FINAL-JUDGE).
2. **Texte de personnage RH** — fixe (comme THE-FINAL-JUDGE) ou libre ?
3. **Base du jugement de taille d'équipe** — quel critère objectif, si un existe ?
4. **Photo de la dream team** — CASSANDRA-RH la reprend, ou elle reste séparée (LE-COORDINATEUR) ?
5. **Initiative de recrutement** — l'agent peut-il proposer une session de recrutement de sa propre
   initiative, ou seulement sur demande explicite ?
6. **Stagiaire pré-processeur** — un second agent scripté et gratuit (sur le modèle
   LE-COORDINATEUR/THE-FINAL-JUDGE) qui prépare/formate les candidats de recrutement avant qu'un
   vrai jugement CASSANDRA-RH coûteux ne s'applique — architecture à valider.
7. **Rapport de "licenciements"** — doit-il apparaître explicitement dans le rapport RH régulier,
   sur quels signaux exactement (`toolsNeverUsed()`/taux de trouvaille de `tool-usage.mjs`) ?
8. **Frontière exacte avec `kpi-report.mjs`** — CASSANDRA-RH absorbe-t-elle le script existant, ou
   s'appuie-t-elle dessus en gardant `kpi-report.mjs` comme moteur de calcul pur ?
9. **Le "vrai bénéfice" du passage par CASSANDRA-RH à l'intégration, explicité** (2026-09-20T13:32Z,
   retrouvé en relisant l'historique brut de la session, jamais perdu mais resté implicite) :
   l'utilisateur demandait explicitement en quoi le passage d'un nouvel Agent par CASSANDRA-RH ET par
   LE-COORDINATEUR garantit une vraie utilité — pas seulement une case cochée. À poser explicitement
   au round de calibrage : quelle preuve concrète (pas seulement "consignée") CASSANDRA-RH doit-elle
   produire à l'intégration pour que ce passage ait un effet réel, vérifiable, plutôt qu'un rituel ?

## 9. Note méthodologique (2026-09-21)

Ce document a été vérifié contre l'historique BRUT complet de la session (grep + parsing Python du
fichier JSONL de la conversation, `/root/.claude/projects/.../*.jsonl`, 0 appel API) plutôt que le
seul résumé de compaction fourni en tête de session — 21 messages utilisateur réels mentionnant
CASSANDRA retrouvés et vérifiés un par un, aucun écart substantiel trouvé au-delà du point 9
ci-dessus. Cette technique reste un filtre MOT-CLÉ gratuit, jamais un remplacement de THE-DEEP-READER
(qui fait une vraie relecture qualitative capable de détecter un écart subtil, pas seulement une
recherche littérale) — utile ici parce que la question posée était concrète et cherchable
("CASSANDRA a-t-elle été mentionnée sans être tracée ?"), pas une évaluation de fidélité globale.
