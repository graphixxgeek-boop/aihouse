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
- **Vérifier le gabarit de poste adapté à la classe (2026-09-22, demande explicite)** : s'assurer,
  si ce n'est pas déjà fait, que chaque membre a bien reçu le gabarit de fiche de poste correspondant
  à sa classe — le gabarit ENRICHI à deux champs propres (position dans le crochet post-commit, rôle
  dans le badge/couverture AXA-CHECK) pour un Gardien sacré du code, le gabarit STANDARD
  (blueprint + instanciation + registre) pour les autres Membres (décision déjà actée,
  `docs/referentiel/organisation-agence.md` §3-4 : « seuls les Gardiens sacrés ont un gabarit
  enrichi »). Concrètement : jamais un Gardien avec seulement le gabarit standard (position
  post-commit/rôle badge non documentés), jamais un Membre ordinaire à qui on imposerait à tort les
  deux champs enrichis qui ne le concernent pas.
- **Promotion de poste (2026-09-22, demande explicite)** : identifier un script qui a grossi en
  taille et en fonctionnalités au fil des évolutions (Infrastructure ou Utilitaire nommé,
  cf. `docs/referentiel/organisation-agence.md` Axe A) au point de mériter le statut Agent/Membre.
  CASSANDRA vérifie d'abord l'ÉLIGIBILITÉ réelle avant de proposer quoi que ce soit — jamais la
  taille ou l'ancienneté seule ne suffit (critère déjà établi, `docs/regles-de-travail.md` §7ter :
  « ce qui justifie réellement ce statut n'est jamais l'ancienneté ni la taille du code [...] mais
  l'existence d'un DOMAINE DE JUGEMENT propre au projet »). Une fois l'éligibilité confirmée, elle
  PROPOSE l'évolution (jamais ne l'exécute seule) — la promotion réelle (instanciation + registre +
  mise à jour de `organisation-agence.md`) reste toujours soumise à la confirmation explicite de
  l'utilisateur, même schéma que le recrutement en 3 temps ci-dessus.

  **Cas spécifique — intégrer un nouveau Gardien sacré (2026-09-22, ajouté à l'arrivée de
  CLONE-HUNTER comme 5e Gardien)** : une promotion vers CE groupe précis est strictement plus
  exigeante qu'une promotion Membre ordinaire — CASSANDRA applique une checklist dédiée, jamais le
  seul critère standard d'éligibilité ci-dessus. Elle vérifie, dans l'ordre, contre le répertoire
  canonique `docs/referentiel/organisation-agence.md` §3 :
  1. Le script délivre-t-il un VRAI scan de qualité du code (pas un simple utilitaire d'agrégation) ?
  2. Peut-il tourner automatiquement, mécaniquement, gratuitement, à CHAQUE commit (jamais un coût
     API ni un agent séparé, jamais une exécution manuelle requise) ?
  3. Si (1) ET (2) sont vrais, elle vérifie que les 7 points du répertoire des fonctionnements
     partagés des Gardiens seraient bien honorés une fois intégré (câblage post-commit réel, retrait
     de CIRCLE-TASKS, test dans `check-house.mjs`, participation au badge/couverture, agrégation
     HYPER-SCAN-CHECKPOINT, pas de validation croisée automatique à inventer, aucun coût API).
     Un script qui échoue le critère (2) seul (ex. ALWAYS-NEW-CODE, raisonnement coûteux) n'est
     JAMAIS proposé pour ce groupe, quelle que soit la qualité de son scan.
  4. Elle propose la liste concrète des fichiers à modifier pour l'intégration complète (le hook
     post-commit, `circle-tasks.mjs`, `le-coordinateur.mjs`, `hyper-scan-checkpoint.mjs`,
     `organisation-agence.md`, l'Article 20 de CLAUDE.md) — jamais une promotion partielle qui
     laisserait un Gardien à moitié câblé, exactement le défaut réel constaté deux fois de suite le
     soir de l'arrivée de CLONE-HUNTER (§3 oublié dans le calcul du badge, puis dans
     HYPER-SCAN-CHECKPOINT) et que cette checklist existe justement pour ne plus jamais reproduire.
  Toujours soumis à la même confirmation explicite de l'utilisateur qu'une promotion Membre — cette
  checklist rend la PROPOSITION plus fiable, elle ne change rien à qui décide.

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
documentation / Rôle dans l'organigramme), Les Agents Cadre (renommage de Direction, 2026-09-22 —
CASSANDRA-RH + LE-COORDINATEUR), les Gardiens sacrés du code (renommage de l'Équipe noyau —
ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD/CLONE-HUNTER, 5 membres depuis le 2026-09-22), les 6 suites
de travail parmi les Membres ordinaires, les 3 catégories définitivement hors de l'agence
(Personnages, Moteur du jeu, code tiers vendu tel quel), et l'Infrastructure comme 3e rang
d'employés sans dossier individuel.

**Ce qui reste ici, propre à la CONCEPTION de CASSANDRA-RH elle-même** (pas au roster lui-même,
qui vit désormais dans le document canonique) :
- **Le rôle (Agent Cadre/Gardien/Membre) est une case À L'INTÉRIEUR du statut Agent existant**,
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

- **Historique des badges attribués, une ressource déjà PARTAGÉE, jamais un doublon à créer
  (2026-09-22, question explicite de l'utilisateur : « je ne sais pas si c'est un doublon ou un
  trou »)** — vérifié : ni l'un ni l'autre. `.badge-ceremony-history.json` (local, gitignored, même
  discipline que les autres journaux locaux du réseau d'outils) existe déjà : LE-COORDINATEUR
  (`announceBadgeCeremony()`/`recordCertification()`) y écrit la date de première certification de
  chaque Agent, et `checkAllAgentBadges()` le consulte à chaque commit réel (câblé dans
  `scripts/hooks/check-last-commit.mjs`, 2026-09-22) pour ne jamais réannoncer une certification déjà
  connue. CASSANDRA-RH, une fois construite, LIRA ce même fichier pour s'y référer (« qui a été
  certifié, quand ») — jamais un second fichier séparé à sa main : la garde reste commune entre les
  deux Agents Cadre, exactement comme `docs/referentiel/organisation-agence.md` est déjà partagé
  entre eux pour l'organigramme.
- `scripts/ines-official.mjs::buildEditionSummary()` — `kpiFromCassandra` explicite, `null` tant
  que CASSANDRA-RH n'existe pas, jamais fabriqué.
- Note fondatrice corrigée (2026-09-21) : CASSANDRA-RH pourra un jour agréger les verdicts
  narratifs déjà produits ailleurs sur les Personnages, jamais les noter comme des membres — cf.
  section 4 ci-dessus.
- Un futur audit HARMONIA dédié au système KPI lui-même (vérifier qu'aucune connexion entre
  familles/outils n'est oubliée) — à planifier une fois CASSANDRA-RH construite, rejoint la tâche
  #145 sans la remplacer.

## 8. Décisions actées lors des rounds de calibrage (résumé, mis à jour à chaque round)

Les 8 premiers points listés ici comme "non tranchés" (rédaction du 2026-09-21) ont tous été
tranchés depuis, au fil de deux rounds de questions (20 questions le 2026-09-21, puis 6 questions
le 2026-09-22 portant sur le Catalogue/Stagiaire, cf. §8bis/§8ter) — résumé, pour ne jamais perdre
la trace de POURQUOI chaque choix a été fait (Article 13) :

1. **Cadence de déclenchement** — un signal mécanique léger à chaque Ronde CIRCLE-TASKS (pas de
   calcul lourd) + un bilan complet sur demande explicite (jamais un "entretien annuel" imposé).
2. **Texte de personnage RH** — fixe et reconnaissable (même garde-fou anti-dérive que
   THE-FINAL-JUDGE), jamais reformulé à chaque appel.
3. **Base du jugement de taille d'équipe** — un constat CHIFFRÉ et honnête (nombre réel de
   membres, par catégorie), jamais un seuil auto-jugé ("trop" ou "pas assez") inventé sans preuve.
4. **Photo de la dream team** — reste chez LE-COORDINATEUR, CASSANDRA-RH ne la reprend pas.
5. **Initiative de recrutement** — l'agent peut PROPOSER une session de recrutement de sa propre
   initiative, jamais la LANCER seule : la décision reste toujours à l'utilisateur.
6. **Stagiaire pré-processeur** — construit dès la première vague (cf. §8ter ci-dessous), pas
   repoussé comme envisagé initialement.
7. **Rapport de "licenciements"** — une liste NOMMÉE explicite ("à retirer ou refondre"), réutilisant
   telle quelle `toolsNeverUsed()` (`scripts/tool-usage.mjs`) et la stagnation relative de
   CLEAN-DIRTY-OLD — jamais un nouveau calcul de pertinence inventé à côté.
8. **Frontière avec `kpi-report.mjs`** — `kpi-report.mjs` reste le seul moteur de calcul KPI ;
   CASSANDRA-RH LIT `kpi-historique.csv` produit par ce script, ne le recalcule jamais elle-même.

**Note ajoutée le 2026-09-22 (message envoyé juste avant que l'utilisateur n'aille dormir, en mode
nocturne autonome, cf. `docs/regles-de-travail.md` §1bis) : « cassandra pourrait decider si
certains scripts meritent de passer membres certifiés comme on l'a vu ensemble »** — rapproché
délibérément, jamais fondu silencieusement, de la mission « Promotion de poste » déjà actée
ci-dessus (section 2) : CASSANDRA-RH propose qu'un script Infrastructure/Utilitaire nommé devienne
Agent/Membre une fois son éligibilité réelle vérifiée. **Ambiguïté de terminologie à lever
explicitement avec l'utilisateur, jamais tranchée seule ici** : « Membre certifié » désigne déjà,
ailleurs dans ce paysage, un badge mécanique précis (`checkAgentOnboarding()`/
`checkAllAgentBadges()`, lib-shell.mjs — 100% de couverture AXA-CHECK ET zéro trou ARGUS/HARMONIA
ouvert), calculé automatiquement, jamais un jugement RH. Si l'utilisateur voulait dire « devenir un
vrai Membre de l'équipe » (la promotion de poste, un jugement RH réel), la mission existe déjà
telle quelle. S'il voulait dire « CASSANDRA-RH devrait pouvoir décider/influencer le calcul du
badge de couverture lui-même », ce serait un rôle NOUVEAU, jamais encore acté (le badge reste à ce
jour un calcul strictement mécanique, sans jugement possible) — à poser comme question de calibrage
explicite dès que l'utilisateur revient, plutôt que de deviner laquelle des deux lectures est la
bonne.

**Encore ouvert, à trancher avant la construction réelle du noyau** :

9. **Le "vrai bénéfice" du passage par CASSANDRA-RH à l'intégration, explicité** (2026-09-20T13:32Z,
   retrouvé en relisant l'historique brut de la session, jamais perdu mais resté implicite) :
   l'utilisateur demandait explicitement en quoi le passage d'un nouvel Agent par CASSANDRA-RH ET par
   LE-COORDINATEUR garantit une vraie utilité — pas seulement une case cochée. À poser explicitement
   au prochain round de calibrage : quelle preuve concrète (pas seulement "consignée") CASSANDRA-RH
   doit-elle produire à l'intégration pour que ce passage ait un effet réel, vérifiable, plutôt qu'un
   rituel ?

## 8bis. Le Catalogue — le rapport principal de CASSANDRA-RH (2026-09-22, round de calibrage dédié)

Ce que l'utilisateur appelait au départ "des propositions de combinaisons d'outils" (une extension
du menu `PRESTATIONS` de LE-COORDINATEUR) s'est révélé, une fois creusé, être en réalité **le
rapport principal que CASSANDRA-RH devait déjà produire** (ses deux objectifs fondateurs : KPI +
recrutement) — pas un second document séparé. Décisions actées :

- **Propriété du document** : CASSANDRA-RH ÉCRIT et SIGNE le Catalogue. LE-COORDINATEUR reste en
  coulisse, simple fournisseur de calculs bruts (combinaisons candidates, chiffres de couverture/
  usage/fraîcheur) — jamais l'inverse, jamais deux rapports concurrents.
- **Fiche par outil** : une fiche COMPLÈTE par outil certifié, qui regroupe TOUT ce qu'on sait déjà
  sur lui (coût estimé en tokens/appels API, famille/suite d'appartenance, dernier usage réel,
  couverture de test AXA-CHECK, fraîcheur CLEAN-DIRTY-OLD) — jamais une fiche minimaliste, jamais un
  second calcul de ce qui existe déjà ailleurs.
- **Score KPI par outil (nouveau calcul, n'existait pas)** : le tableau de bord actuel mesure des
  FAMILLES (6 grandes catégories), jamais un outil individuel. Le score par outil est un COMPOSITE
  fabriqué à partir de signaux déjà collectés ailleurs (fréquence d'usage réel + taux de trouvaille
  de `tool-usage.mjs` + fraîcheur relative de CLEAN-DIRTY-OLD) — zéro nouvelle mesure à instrumenter,
  juste un calcul de plus sur des données déjà là.
- **Combinaisons en chaînes, pas seulement des paires** : le coordinateur peut proposer des
  combinaisons de 3 outils ou plus qui s'enchaînent, pas seulement des duos.
- **Critère de "vont bien ensemble" (mécanique, LE-COORDINATEUR ne réfléchit pas)** : un score
  mixte cumulant trois signaux — même grand thème du projet (classification déjà utilisée par
  HARMONIA), même source de données consultée par les deux outils, même suite de l'organigramme
  (`docs/referentiel/organisation-agence.md`).
- **Promotion combo → "prestation pérenne"** : une combinaison suggérée devient une prestation
  officielle et figée seulement si elle a été RÉELLEMENT utilisée plusieurs fois avec un bon
  résultat (preuve mécanique via `scripts/tool-usage.mjs`), jamais sur simple impression.
- **Archivage/versionnage** : réutilise le mécanisme déjà construit à la tâche #154
  (`docs/le-coordinateur-catalogue/`, un fichier daté par version + `index.md`) — jamais un second
  dossier d'archivage créé à côté ; ce mécanisme est juste enrichi pour porter le contenu plus riche
  décrit ci-dessus, au lieu du simple menu `PRESTATIONS` actuel.
- **Déclenchement** : automatique, mais UNIQUEMENT lors des Rondes périodiques CIRCLE-TASKS — jamais
  à chaque commit (contrairement aux 5 Gardiens sacrés) : c'est un moment stratégique de réflexion
  sur l'outillage, pas un scan mécanique de code.
- **Qui alerte l'utilisateur** : CASSANDRA-RH seule, puisque le Catalogue est désormais SON rapport
  — jamais une double alerte séparée du coordinateur sur le même sujet.

## 8ter. Le Stagiaire (2026-09-22, décision explicite de construire dès maintenant)

Contrairement à la décision initiale ("repoussé à plus tard", §8 point 6 ci-dessus, révisée le
2026-09-22) : le Stagiaire est un vrai second agent séparé, à construire dès la première vague de
CASSANDRA-RH — décision explicitement NON recommandée par l'agent mais actée par l'utilisateur.

- **Rôle exact** : rédige UNIQUEMENT les fiches individuelles par outil (la partie la plus longue et
  répétitive du Catalogue) à partir des chiffres bruts. CASSANDRA-RH garde la main sur tout ce qui
  demande un vrai jugement : les combinaisons, les alertes, le résumé général — jamais le Stagiaire
  ne rédige la partie "voix propre" de CASSANDRA-RH.
- **Déclenchement** : CASSANDRA-RH décide elle-même, à chaque Ronde, si assez de choses ont changé
  depuis le dernier appel pour justifier de repayer le coût réel du Stagiaire — jamais un appel
  automatique systématique à chaque Ronde sans condition. Si rien de neuf, elle réutilise les fiches
  déjà écrites.
- **Personnage fixe, même garde-fou que THE-FINAL-JUDGE/THE-DEEP-READER** : un texte de personnalité
  fixe (ton factuel, robotique — son "client" principal est l'agent qui pilote, pas l'utilisateur),
  recopié à l'identique à chaque appel, jamais reformulé — protection contre toute dérive de ton au
  fil des Rondes.
- **Coût réel, Article 22/SMART-CONSO-TOKEN** : c'est un vrai appel à un agent séparé — consultation
  des deux conseillers (Smart Conso API + SMART-CONSO-TOKEN) obligatoire avant chaque appel réel,
  jamais une exception parce que c'est "juste" un stagiaire.

## 9. Note méthodologique (2026-09-21)

Ce document a été vérifié contre l'historique BRUT complet de la session (grep + parsing Python du
fichier JSONL de la conversation, `/root/.claude/projects/.../*.jsonl`, 0 appel API) plutôt que le
seul résumé de compaction fourni en tête de session — 21 messages utilisateur réels mentionnant
CASSANDRA retrouvés et vérifiés un par un, aucun écart substantiel trouvé au-delà du point 9
ci-dessus. Cette technique reste un filtre MOT-CLÉ gratuit, jamais un remplacement de THE-DEEP-READER
(qui fait une vraie relecture qualitative capable de détecter un écart subtil, pas seulement une
recherche littérale) — utile ici parce que la question posée était concrète et cherchable
("CASSANDRA a-t-elle été mentionnée sans être tracée ?"), pas une évaluation de fidélité globale.
