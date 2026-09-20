# Règles de travail — collaboration sur ce projet

*(Créé le 2026-09-18, à la demande explicite de l'utilisateur : « je veux que si je reprends le
travail avec une autre IA, elle puisse tout de suite se mettre dans le moule et adopter les mêmes
règles de travail ». Ce document est distinct de `CLAUDE.md` : il ne traite jamais du CONTENU du
projet (la charte de l'esprit des personnages, les mécaniques de jeu — tout ça reste dans
`CLAUDE.md` et `docs/referentiel/`), seulement de la façon dont l'utilisateur et l'agent
travaillent ensemble : rythme, communication, vérification, livraison. Toute IA qui reprend ce
projet doit lire ce document en plus de `CLAUDE.md`, pas à sa place.*

*Versionné comme `CLAUDE.md` : chaque évolution de ces règles s'ajoute avec sa date, jamais
réécrite silencieusement par-dessus l'ancienne version — même exigence de traçabilité que la
charte de contenu.*

*Mise à jour proactive, pas seulement sur demande explicite.* Dès qu'un changement confirmé de la
façon de travailler ensemble est constaté (une nouvelle préférence énoncée par l'utilisateur, une
habitude confirmée par l'usage répété, une correction sur un point déjà consigné), ce document est
mis à jour le jour même — même logique que l'Article 13 de `CLAUDE.md` pour le contenu du jeu :
une règle de travail réelle qui existe dans la conversation mais pas ici est une dette à combler
tout de suite, pas plus tard.

**Deux parties, à bien distinguer.** *(Séparation ajoutée le 2026-09-19, à la demande explicite de
l'utilisateur : « pense à séparer les règles uniquement applicables avec toi en tant que Claude de
ce qui est applicable par n'importe quelle IA [...] au cas où le projet serait repris, que tout
soit bien clair ».)* Les sections 0 à 9 (**Partie A**) décrivent une méthode de collaboration
indépendante de l'outil IA utilisé : n'importe quel agent conversationnel capable de lire du code,
d'exécuter des commandes et de tenir une conversation longue peut les suivre telles quelles. La
**Partie B**, à la fin de ce document, recense au contraire ce qui dépend spécifiquement de Claude
Code (noms d'outils, capacités et limites propres à ce harnais) — une IA reprenant le projet avec
un autre outil doit lire la Partie A intégralement, puis chercher dans sa propre documentation
l'équivalent de chaque mécanisme cité en Partie B plutôt que de supposer qu'il existe tel quel.

## 0. Relecture périodique, pas seulement en début de session

*(Ajouté le 2026-09-18, à la demande explicite de l'utilisateur, étendu le même jour à
`docs/philosophie-et-politique.md` : « ce document doit aussi être relu à intervalles réguliers,
gardé en mémoire pour la bonne conduite du projet, il fait partie du cadre ».)* Lire `CLAUDE.md`,
ce document et `docs/philosophie-et-politique.md` en entier avant toute intervention (déjà exigé
en tête de `CLAUDE.md`) ne suffit pas sur une longue session : les trois doivent aussi être
**relus à intervalles réguliers en cours de route**, pas seulement invoqués de mémoire. Si un long
moment s'écoule sans qu'aucun des trois documents ait été consulté ou cité explicitement, c'est un
signal à ne pas ignorer : l'agent s'oblige alors à les rouvrir et à les relire, pour vérifier que
le travail en cours reste effectivement dans la bonne direction plutôt que de dériver
progressivement sur la seule base d'un souvenir qui s'estompe.

## 1. Rythme et intégration des demandes

L'utilisateur spécifie rarement une fonctionnalité en un seul message complet : il la construit
par couches successives, souvent **pendant que l'agent travaille déjà dessus** (ex. le système de
bonus spontanés du 2026-09-18, précisé en quatre messages distincts arrivés en cours de tour,
chacun ajoutant une contrainte à fusionner sans repartir de zéro). Chaque ajout reçoit un **accusé
de réception bref** avant la reprise du travail — pas un silence jusqu'au rendu final, mais pas
non plus une pause complète en attendant confirmation : l'agent absorbe l'ajout et continue.

Quand un message contient plusieurs demandes numérotées ou distinctes, la réponse les traite point
par point, dans leur propre ordre, jamais noyées dans une synthèse globale (cf. `CLAUDE.md`,
complément à l'Article 16 du 2026-09-17).

## 2. Calibrage et questions

Poser des questions avant d'exécuter, plutôt que supposer, est une règle centrale (cf. `CLAUDE.md`
Article 16 et son complément du 2026-09-18 sur les questions après « voici mes commentaires »).
Ici, seuls les points **spécifiques à la méthode de questionnement elle-même** sont consignés :

- **Poser des questions souvent est le mode par défaut, pas l'exception.** *(Précisé le 2026-09-18
  à la demande explicite de l'utilisateur, qui a vérifié que ce point était bien consigné.)* Ce
  n'est pas seulement un réflexe déclenché par une ambiguïté détectée au cas par cas : c'est une
  disposition de fond de la collaboration. Dans le doute entre demander et supposer, l'agent
  demande — y compris pour des questions qui l'aident lui-même à mieux comprendre le sujet, pas
  seulement pour lever une ambiguïté déjà identifiée dans la demande de l'utilisateur (cf.
  `CLAUDE.md`, complément du 2026-09-18 : « des questions qui t'aident à mieux comprendre »). Le
  seuil minimal (au moins trois, ou une dizaine après une relecture complète, Article 16/18 de
  `CLAUDE.md`) est un plancher, jamais un plafond.
- **Format d'étiquette** : chaque question commence par son type entre crochets — `[Calibrage]`,
  `[Alignement de compréhension]`, `[Enquête technique]`, ou tout autre type pertinent au moment
  (liste ouverte, jamais fermée) — pour que l'utilisateur sache d'emblée quel genre de réponse
  apporter (confirmé le 2026-09-18, format conservé tel quel).
- **Calibrer le NIVEAU D'EXIGENCE, pas seulement le contenu** *(règle ajoutée le 2026-09-18, à la
  suite d'un échange explicite sur ce point précis)* : quand l'utilisateur ne précise pas si un
  sujet donné doit être traité comme central (rigueur maximale) ou secondaire (rigueur normale),
  l'agent lui pose la question plutôt que de supposer un périmètre fixe à l'avance. Il n'existe
  volontairement **aucune liste figée** de « sujets centraux » : c'est une vigilance de second
  ordre — interroger le CADRE de la demande, pas seulement son contenu — à exercer à chaque fois
  que ce n'est pas déjà évident dans le message de l'utilisateur.
- Les protocoles de calibrage déjà détaillés ailleurs ne sont jamais recopiés ici : voir
  `CLAUDE.md` pour le Protocole de simulation complète (Article 18), la Double lecture en
  parallèle, et les Questions de calibrage après « voici mes commentaires ». Ce document y renvoie
  plutôt que de dupliquer, pour ne jamais désynchroniser deux versions du même protocole (même
  logique que les Articles 6/7 de la charte de contenu).

## 3. Rigueur variable, jamais uniforme

La rigueur de vérification (tests, documentation, relecture) se resserre sur les points que
l'utilisateur identifie comme centraux — jamais un même niveau partout par défaut. Concrètement :
compilation propre (`tsc --noEmit`), suite `scripts/check-house.mjs` intégralement verte, un
nouveau test dédié pour toute mécanique nouvelle, documentation mise à jour le jour même dans les
couches concernées (`docs/referentiel/`, `lib/reference.ts`, ce document si la règle de travail
elle-même change) et une revue du diff avant commit restent la pratique par défaut de l'agent —
mais quand l'importance d'un sujet n'est pas évidente, l'agent DEMANDE (cf. section 2) plutôt que
de fixer lui-même le curseur.

## 4. Git et livraison

- **Commit dès qu'un morceau de travail cohérent passe les tests**, sans attendre une demande
  explicite à chaque fois — mais jamais sans avoir lancé les tests et la compilation avant
  (confirmé le 2026-09-18 comme règle formelle, pas seulement une habitude tolérée).
- Un message de commit clair, en français, décrivant le POURQUOI plutôt que la liste mécanique des
  fichiers touchés.
- Push vers la branche de travail une fois qu'un morceau cohérent est committé, sans attendre la
  toute fin d'une longue session.
- **Le suivi (`docs/suivi/`) se met à jour DANS LE MÊME COMMIT que le travail qu'il décrit, jamais
  après coup.** *(Ajouté le 2026-09-19, après une vraie dérive mesurée : 7 des 8 derniers commits
  d'une même session avaient changé du code ou de la charte réelle sans toucher `docs/suivi/` une
  seule fois, laissant la fiche de session périmée de plus de 3h30 — trouvaille de
  `findCommitsMissingSuiviUpdate()`, cf. `docs/systeme-de-suivi.md`.)* Avant de committer un
  chantier qui clôt ou fait avancer une tâche, mettre à jour sa ligne dans
  `docs/suivi/sessions/<session>.md` (et `docs/suivi/index.md` si une grande étape est franchie) et
  l'inclure dans le MÊME commit — jamais un commit de code isolé suivi d'un rattrapage différé.

## 5. Sécurité et discrétion

- Une clé API ou tout secret transmis en direct dans la conversation n'est **jamais** réaffiché
  dans une réponse, un log ou un commit — écriture uniquement dans les fichiers de configuration
  locaux prévus à cet effet (`.dev.vars`).
- Une demande de discrétion sur un mécanisme technique (ex. le repli de quota Gemini) s'applique à
  la surface effectivement visible d'un tiers (le référentiel affiché en jeu), jamais au code
  fonctionnel lui-même qui doit rester lisible pour fonctionner — la limite honnête de ce qui peut
  réellement être caché est explicitée à l'utilisateur plutôt que promise à tort.
- Une limite technique dure imposée par l'environnement (ex. le classificateur de sécurité
  refusant un bloc de texte encodé) n'est jamais recontournée sous une autre forme sans une
  nouvelle demande explicite de l'utilisateur.

## 6. Blocages externes (quota, réseau, service tiers)

*(Confirmé le 2026-09-18.)* Face à un vrai blocage externe (quota API épuisé, panne réseau) plutôt
qu'un bug de code : l'agent **cherche d'abord une solution ou un contournement** (diagnostic,
mécanisme de repli déjà en place, nouvelle tentative raisonnable) avant de notifier l'utilisateur,
et rapporte alors avec le résultat obtenu — jamais un simple statut d'alerte sans avoir essayé,
sauf si la recherche de solution elle-même prend un temps déraisonnable.

## 7. Livrables

Toute transcription intégrale de simulation (ou tout document long de même nature) est livrée en
pièce jointe véritable, jamais collée en clair dans la réponse — préférence actée le 2026-09-18,
cf. `CLAUDE.md`. Le mécanisme concret utilisé pour ça avec Claude Code (`SendUserFile`) est propre
à l'outil : voir Partie B.1.

**Conserver les versions précédentes pour comparaison rapide.** *(Ajouté le 2026-09-18, à la
demande explicite de l'utilisateur, après un besoin réel : comparer deux transcripts de simulation
pour diagnostiquer une régression sur un passage précis — Point 7 de la relecture du
2026-09-18.)* Un transcript de simulation (ou tout autre artefact volumineux produit pour
comparaison future — dossier retourné, journal JSON) n'est jamais écrasé ni supprimé au profit du
suivant : chaque nouvelle version s'ajoute, la précédente reste accessible. Avant de traiter une
demande de comparaison entre deux versions comme irréalisable faute d'archive, l'agent vérifie
d'abord si les fichiers précédents existent encore (répertoire de travail temporaire de la session
en cours, ou tout autre emplacement où ils auraient pu être sauvegardés) plutôt que de supposer
qu'ils sont perdus. Le répertoire temporaire d'une session n'étant pas garanti de survivre à un
changement d'environnement, un artefact dont la comparaison future importe réellement (ex. la
version validée d'une scène de référence) gagne à être copié dans le dépôt lui-même plutôt que
laissé uniquement en zone temporaire.

*Nuance ajoutée le 2026-09-18, à la demande explicite de l'utilisateur après que la méthode a
réellement fonctionné sur le Point 7 :* la comparaison de versions est un outil de diagnostic
précieux, souvent le plus rapide, **jamais une garantie universelle** — une régression peut aussi
n'avoir aucune version antérieure valable à comparer, ou provenir d'une cause que la comparaison
seule ne révèle pas (ex. le Point 2, retrouvé par une lecture directe du code et des journaux de
requêtes, pas par une différence visible entre deux transcripts). L'agent l'essaie en priorité
quand une version de référence existe, sans jamais s'y arrêter si elle ne suffit pas à conclure.

## 7bis. Rendre compte des progrès de l'outillage interne (ex. « Smart Breaker », l'outil quota Gemini)

*(Nom d'usage « Smart Breaker » donné le 2026-09-19 à la demande explicite de l'utilisateur, pour
le plaisir de lui donner un nom — désigne uniquement la façon dont on en parle, jamais les
fichiers eux-mêmes, cf. `docs/outil-resilience-api.md`.)*

*(Ajouté le 2026-09-18, à la demande explicite de l'utilisateur : « précise-moi à chaque fois que
l'outil API s'est amélioré et comment, avec une estimation du pourcentage d'efficacité gagné ».)*
Un outil de travail interne (ex. `scripts/check-gemini-quota.mjs` / `scripts/gemini-key-health.mjs`,
mais la règle vaut pour tout outillage comparable créé plus tard) a un statut différent d'un
changement de contenu du jeu : l'utilisateur ne le voit jamais tourner directement, donc son seul
moyen de suivre son évolution est le compte rendu de l'agent. À chaque amélioration réelle de ce
type d'outil (nouvelle capacité, correction d'un biais, extension de portée) :

- **Dire explicitement CE QUI a changé et COMMENT**, en langage clair (jamais juste "corrigé un
  bug" ou "amélioré l'outil" sans détail) — cohérent avec la section 8 ci-dessous sur la
  vulgarisation obligatoire des sujets techniques.
- **Donner une estimation chiffrée du gain d'efficacité** (ex. "évite désormais ~2 tentatives
  perdues sur 3 lors d'un blocage multi-modèles", "réduit le temps de diagnostic d'un blocage
  d'environ 80 %"). C'est une ESTIMATION qualifiée comme telle, jamais présentée comme une mesure
  exacte quand elle ne l'est pas — l'honnêteté sur la nature de l'estimation prime sur la précision
  apparente du chiffre.
- **Documenter la même évolution ici, dans les règles de travail**, pas seulement dans le message
  de la conversation — pour qu'une autre IA reprenant le projet retrouve l'historique des progrès
  de l'outil sans devoir relire tout le fil de conversation. Concrètement : une ligne d'historique
  dans cette section, datée, à chaque évolution notable.

**Complément ajouté le 2026-09-19, à la demande explicite de l'utilisateur** (« lorsque l'outil API
fonctionne, indique-moi s'il a eu l'occasion de s'améliorer, ou de se modifier pour s'améliorer, ou
pas, à chaque utilisation pertinente sur le sujet ») : la règle ci-dessus ne couvrait que le cas où
une amélioration avait effectivement eu lieu. Désormais, à CHAQUE utilisation ou modification
pertinente de cet outillage (une exécution réelle du diagnostic, une demande de l'utilisateur qui
aurait pu en être l'occasion, une évolution de la production qui le touche), l'agent dit
explicitement l'un des deux : soit ce qui a changé et le gain estimé (comme ci-dessus), soit qu'il
n'y a PAS eu d'amélioration cette fois et pourquoi (ex. « exécution de diagnostic pure, aucune
modification de l'outil cette fois »). Le silence sur ce point n'est jamais une option quand le
sujet a été abordé — c'est ce qui permet à l'utilisateur de suivre l'évolution réelle de l'outil
dans la durée, y compris ses paliers, pas seulement ses sauts.

**Le rapport KPI (`kpi-report.mjs`) fait partie intégrante de chaque livraison de simulation,
jamais un à-côté optionnel.** *(Ajouté le 2026-09-19, après un oubli réel signalé par
l'utilisateur : une livraison de simulation complète n'incluait ni le rapport ni les KPI du Smart
Breaker.)* L'étape correspondante est désormais explicite dans le protocole de simulation
(Article 18 de `CLAUDE.md`, étape 4) : `node scripts/kpi-report.mjs` se lance avant tout
redémarrage du serveur, et ses résultats accompagnent le transcript/dossier dans la même livraison
— jamais un rapport pensé comme secondaire ou fait "si on y pense". Cette section-ci documente
l'évolution de l'outil dans le temps ; l'Article 18 documente QUAND le consulter à chaque cycle.

**Historique des évolutions de l'outil quota/clé Gemini :**

- *2026-09-18* — Ajout de la mémoire d'expérience (`gemini-key-health.mjs`) : les clés sondées sont
  désormais ordonnées par fiabilité récente plutôt que testées dans un ordre fixe. Gain estimé :
  évite de re-tester en premier une clé déjà connue épuisée à chaque exécution — sur une session
  avec plusieurs clés, ça peut économiser la quasi-totalité des sondes inutiles sur la clé morte
  (~50 % d'appels de diagnostic en moins quand une clé sur deux est à plat).
- *2026-09-18* — Correction du biais `likelyStillDown` (paramètre `asKeySignal`) : une sonde
  secondaire sur un modèle rarement utilisé (ex. `gemini-pro-latest`, presque toujours en quota
  serré) ne fait plus passer une clé par ailleurs saine pour "encore à plat". Gain estimé : élimine
  un faux-diagnostic qui, non corrigé, aurait fait ignorer à tort une clé pourtant viable à chaque
  exécution de l'outil — donc un gain de fiabilité plus qu'un gain de vitesse, mais tout aussi
  critique pour que l'outil reste digne de confiance.
- *2026-09-18* — Support multi-fournisseurs (`api-providers.mjs`) : une clé de repli peut désormais
  être d'un fournisseur différent de Gemini (préfixe `fournisseur:` dans `.dev.vars`), sondée avec
  son propre format d'appel. Gain estimé : élargit le champ de diagnostic possible en cas
  d'épuisement total de tous les projets Google Cloud disponibles, mais reste un gain de PORTÉE
  diagnostique, pas encore un gain d'efficacité opérationnelle réel — aucun câblage en production
  n'existe encore pour qu'un fournisseur non-Gemini serve de vrai repli de jeu (Article 0).
- *2026-09-18* — Ajout de l'historique curaté (`describeKnownLessons()`) : les leçons empiriques
  déjà comprises ensemble (nature du quota, piège du `retryDelay`, etc.) s'affichent désormais à
  chaque exécution de l'outil, pas seulement dans `CLAUDE.md`. Gain estimé : réduit le risque de
  re-découvrir la même leçon deux fois à des mois d'écart — gain de mémoire collective, pas de
  vitesse d'exécution du script lui-même.
- *2026-09-19* — Rotation des clés en PRODUCTION (`lib/gemini-keys.ts`, partagé par
  `lib/lia.ts::think()` et `route.ts::generateDossierFragment()`), demande explicite de
  l'utilisateur à l'ajout d'une 3e clé : remplace l'ancienne mémoire "collante" (`lastGoodKeyIndex`,
  une clé encaissait tout le trafic tant qu'elle répondait) par un vrai round-robin parmi les clés
  actuellement saines, plus un cooldown par clé dérivé du trafic réel (429→15 min, 503→60 s,
  401/403→définitif), jamais un appel de sonde séparé. Gain estimé : avec 3 clés à 500 requêtes/jour
  chacune, répartit la charge au lieu de vider une seule clé en premier — dans le pire cas (trafic
  soutenu sur une seule clé auparavant), ça peut tripler la capacité journalière effective avant le
  premier blocage, puisque les 3 paniers de quota (un par projet Google Cloud) se vident maintenant
  en parallèle plutôt qu'en série. Testé (`scripts/check-house.mjs`) : preuve que 3 clés
  simultanément saines sont TOUTES utilisées sur 4 appels indépendants, jamais une seule qui
  absorbe tout le trafic ; les garanties déjà vérifiées (repli immédiat sur 429/503, mémoire
  partagée entre les deux cerveaux d'un même tour) restent intactes.
- *2026-09-19* — Diagnostic qualité poussé au maximum (`scripts/api-providers.mjs`,
  `scripts/check-gemini-quota.mjs`), demande explicite de l'utilisateur : (1) une sonde "lourde"
  supplémentaire, de taille comparable à un vrai tour de jeu (systemInstruction + sortie JSON
  structurée), s'exécute désormais sur le modèle principal en plus de la sonde légère existante —
  raison documentée dans CLAUDE.md : Google peut répondre différemment (OK vs 429/503) selon le
  POIDS de la requête pour la même clé/modèle au même instant, donc une sonde uniquement légère
  pouvait donner un faux "OK" ; l'outil signale maintenant explicitement cet écart quand il se
  produit. (2) Une réponse HTTP 200 sans contenu exploitable (filtre de sécurité, coupure
  prématurée) est désormais détectée et distinguée ("OK_VIDE") d'un vrai succès, au lieu d'être
  comptée à tort comme "OK". (3) Le `retryDelay` renvoyé par Google sur un 429 est maintenant
  affiché avec le rappel qu'il est trompeur pour un épuisement journalier. Gain estimé : referme
  l'angle mort le plus concret déjà rencontré en simulation réelle (sonde légère "OK", vraie
  requête en échec) — sans cette sonde lourde, l'outil pouvait donner un faux sentiment de sécurité
  sur le modèle réellement utilisé par l'application ; gain de FIABILITÉ du diagnostic, pas de
  vitesse (un appel de plus, coût négligeable, Article 8). Vérifié en conditions réelles le même
  jour : sur les 3 clés configurées, 2 étaient en quota épuisé et 1 saine ; la sonde lourde sur
  cette dernière a confirmé "OK" (pas d'écart détecté cette fois, mais le garde-fou est maintenant
  en place pour la prochaine fois où il y en aura un).
- *2026-09-19* — Recul adaptatif (`lib/gemini-keys.ts`), demande explicite de l'utilisateur : « fais
  en sorte que la rotation [...] soit intelligente [...] ce systeme doit pouvoir s'ameliorer de
  facon autonome dans le temps ». Chaque échec consécutif (429/503) sur une même clé double son
  cooldown (plafonné à 4h pour 429, 20 min pour 503) sans intervention humaine ; un seul succès
  remet le compteur à zéro. Parmi plusieurs clés en cooldown, la plus proche de se libérer est
  désormais tentée en premier plutôt qu'un ordre arbitraire. Gain estimé : élimine les tentatives
  répétées, toutes les 15 minutes, sur une clé réellement épuisée pour le reste de la journée (dans
  un cas extrême de 20 tentatives/jour sur une clé morte, ça peut retomber à 3-4 tentatives grâce à
  l'escalade) — jamais un blocage définitif, la clé reste toujours retentée avant la fin de la
  journée. Testé (`scripts/check-house.mjs`) : le cooldown double bien à chaque échec consécutif et
  retombe instantanément à sa valeur de base après un seul succès. Limite explicite, actée avec
  l'utilisateur : seuls les PARAMÈTRES (cooldown, ordre) s'ajustent tout seuls à l'expérience réelle
  — la logique elle-même (ce fichier) ne se réécrit jamais à l'exécution, toute évolution de la
  logique reste une intervention délibérée et documentée, exactement comme pour l'outil de
  diagnostic (cf. `docs/outil-resilience-api.md`, section 4).

## 7ter. Le paysage des outils de vigilance, et la consultation bidirectionnelle

*(Ajouté le 2026-09-19, après la construction dans la même session d'ARGUS, HARMONIA, Smart Conso
API, HYPER-SCAN-CHECKPOINT, CHECK-LEVEL-TARGET et ALWAYS-NEW-CODE (en cours) — demande explicite de
l'utilisateur : « mets à jour tes façons de travailler avec l'arrivée de tous ces outils [...] les
outils doivent toujours t'interroger aussi, il y a une communication entre vous destinée à
maximiser leurs performances ».)*

### La carte des outils, pour ne plus se perdre

| Outil | Ce qu'il détecte/régule | Coût | Déclenchement |
|---|---|---|---|
| `check-house.mjs` | régressions de comportement (filet de sécurité) | gratuit | à chaque changement de code |
| `check-spirit.mjs` / `check-profile.mjs` | fidélité de l'esprit des personnages (Article 0) | réel (API) | à la main, si `lib/lia.ts`/personnalités changent |
| ARGUS | absences — ce qui devrait exister et n'existe pas (Article 20) | gratuit (partie mécanique) | toujours déployé — logique testée à chaque commit (`check-house.mjs`, pre-commit) ET balayage réel du code courant à chaque commit (`scripts/hooks/check-last-commit.mjs`, post-commit, warn-only, 2026-09-20) |
| HARMONIA | frictions — deux choses qui existent et se contredisent (Article 20) | gratuit (partie mécanique) | idem ARGUS ci-dessus |
| Smart Conso API | rythme de consommation API de l'AGENT pendant le travail (Article 22) | gratuit à consulter | avant toute action coûteuse de l'agent |
| CHECK-LEVEL-TARGET | quel niveau de vérification une demande appelle, quels outils déployer | gratuit | avant de décider comment traiter une demande |
| HYPER-SCAN-CHECKPOINT | orchestrateur exceptionnel, fidélité aux consignes passées (Article 21) | réel (API, en version complète) | sur demande explicite seulement |
| ALWAYS-NEW-CODE | dette d'organisation — code empilé plutôt que pensé (Article 23) | réel (raisonnement) | niveau « Exceptionnel » de CHECK-LEVEL-TARGET |
| AXA-CHECK | robustesse/fragilité RÉELLE par fonction (couverture de test V8, zéro nouvelle dépendance) (Article 20) | gratuit | toujours déployé |
| CLEAN-DIRTY-OLD | stagnation relative du code, délègue le jugement à ARGUS/HARMONIA/ALWAYS-NEW-CODE (Article 20) | gratuit | toujours déployé |
| EL-PROFESSOR | note qualitative de fidélité à la charte (esprit, naturel, voix, enquête, clarté) d'une simulation ou d'un extrait isolé (Article 18, étape 4bis) | gratuit (relit un texte déjà produit) | après chaque simulation Article 18, ou sur demande pour un extrait isolé |
| THE-SCREENER | note indicative de qualité graphique (2 captures d'écran max) (Article 18, étape 4bis) | réel (Playwright, léger) | après chaque simulation Article 18, jamais bloquant |
| THE-FINAL-JUDGE | audit indépendant du code et du produit par un agent réellement séparé, verdict opiniâtre + recommandations | réel (agent séparé, 6 paliers d'intensité × 4 paliers de périmètre) | sur demande explicite (moi, l'utilisateur, ou un autre outil), niveaux « Approfondi »/« Exceptionnel » de CHECK-LEVEL-TARGET (tendance, jamais un verrou) |
| LE-COORDINATEUR | agrège en un tableau très court ce que les outils gratuits ci-dessus disent déjà, repère un doublon de vérification récent ; son menu de prestations rappelle ce qui peut être commandé | gratuit | synthèse complète (`runNetworkCheck()`) = routine agent, jamais un crochet git (reshellerait `check-house.mjs`, redondant à chaque commit) ; menu des prestations seul = affiché automatiquement à chaque commit (`scripts/hooks/check-last-commit.mjs`, post-commit, 2026-09-20) |
| Smart Breaker (`check-gemini-quota.mjs` + `gemini-key-health.mjs` + `api-providers.mjs` + `lib/gemini-keys.ts`) | blocages de quota/clé Gemini, portée PRODUCTION | gratuit à diagnostiquer | à la demande, ou automatique en production (repli) |
| SMART-CONSO-TOKEN | rythme de consommation de TOKENS de l'agent (Agent séparé, lecture exhaustive, poids d'un document toujours chargé) ; peut aussi scanner et proposer des réductions | gratuit à consulter | avant tout appel à un agent séparé ou tout raisonnement coûteux — obligation écrite dans la charte, jamais un garde-fou vérifiable après coup |

Cette table remplace toute énumération informelle éparpillée dans la conversation : à jour à
chaque nouvel outil créé (même discipline que la liste des documents de référence, Article 13).
**Écart trouvé et corrigé le 2026-09-20** : EL-PROFESSOR, THE-SCREENER et CLEAN-DIRTY-OLD manquaient
de cette table depuis leur création, exactement le genre de dérive doc/doc que l'Article 13 interdit
— trouvé en ajoutant THE-FINAL-JUDGE, jamais signalé avant.

### La consultation n'est jamais à sens unique

Avant cette session, le modèle implicite était : l'agent appelle un outil, l'outil répond un
verdict, fin de l'échange. Ce n'est pas assez pour un outil qui doit vraiment aider à travailler.
**Chaque outil de ce paysage, quand sa propre confiance est insuffisante pour trancher seul, doit
pouvoir interroger l'agent en retour plutôt que deviner silencieusement** — et l'agent doit
transmettre cette interrogation à l'utilisateur quand elle le concerne, jamais l'absorber en
silence. Ce n'est pas une politesse : un outil qui tranche à l'aveugle sur une hypothèse fragile
produit un résultat moins fiable qu'un outil qui sait dire "je ne suis pas sûr, précise-moi X".
Exemples déjà en place, chacun une instance du même principe :

- **Smart Conso API** ne se contente jamais d'un oui/non : elle guide, conseille, coache l'agent
  sur le rythme de sa consommation (cf. Article 22 de `CLAUDE.md`).
- **CHECK-LEVEL-TARGET** demande confirmation quand la marge entre les deux niveaux les plus
  probables est étroite, plutôt que de trancher un cas ambigu tout seul.
- **ALWAYS-NEW-CODE** interroge systématiquement l'agent sur l'étendue du
  travail et le temps disponible quand la taille d'une zone est difficile à estimer, et
  redemande confirmation avant d'appliquer quoi que ce soit — jamais une simple case à cocher.
- **ARGUS/HARMONIA** restent des scripts mécaniques qui ne peuvent pas littéralement poser une
  question en direct — leur équivalent de ce principe est que leurs verdicts "probable"/"à
  surveiller" sont une invitation implicite à vérifier avant d'agir, jamais un verdict à traiter
  comme acquis (leçon apprise à ses dépens le 2026-09-19 avec `trottoirGranted`, faussement
  qualifié de bug avant d'avoir vérifié `docs/referentiel/parametres.md` — cf. `docs/argus/index.md`
  pour le détail complet de cette leçon).

**Corollaire pour tout nouvel outil de ce type à construire à l'avenir** : prévoir dès la
conception un mécanisme explicite de retour vers l'agent en cas de doute réel fait partie du
cahier des charges de départ, au même titre qu'un blueprint séparé ou qu'un registre local —
jamais un ajout après coup "si besoin". Les questions de calibrage posées à l'utilisateur avant de
construire un nouvel outil (Article 16) doivent donc systématiquement couvrir ce point : comment
CET outil interroge-t-il l'agent quand il n'est pas sûr ?

### Trois canaux de consultation pour THE-FINAL-JUDGE (et modèle pour tout futur outil-agent)

*(Ajouté le 2026-09-20, à la demande explicite de l'utilisateur au moment de calibrer THE-FINAL-
JUDGE : « el professor et the judge peuvent se connecter pour discuter si besoin [...] imagine
comment les outils peuvent exploiter the final judge [...] je voudrais que the judge puisse etre
consultable par toi, moi, les outils ». Jamais un bus de messages ou un mécanisme technique
nouveau — cohérent avec la sobriété déjà en place pour LE-COORDINATEUR — mais trois façons
distinctes et documentées de le déclencher, pour ne pas laisser un outil coûteux sous-exploité une
fois construit.)*

- **Moi (l'agent) → THE-FINAL-JUDGE.** Je peux proposer de le déclencher quand je fais face à un
  vrai fork de conception (pas un bug, un choix réellement ouvert) où un second avis, réellement
  indépendant du mien, aiderait — jamais de mon initiative seule, toujours en demandant confirmation
  d'abord (même règle que tout déclenchement de cet outil, cf. `docs/referentiel/the-final-judge.md`).
- **L'utilisateur → THE-FINAL-JUDGE.** Une demande directe (« lance the-judge sur X ») déclenche
  l'outil sans détour par une proposition de ma part — l'utilisateur n'a jamais besoin d'attendre que
  je le suggère.
- **Les autres outils du paysage → THE-FINAL-JUDGE**, sur des points précis où un second regard
  vraiment indépendant apporte quelque chose qu'ils ne peuvent pas produire eux-mêmes :
  - **EL-PROFESSOR → THE-FINAL-JUDGE** : quand l'index d'EL-PROFESSOR montre un thème CHRONIQUEMENT
    faible sur plusieurs sessions (ex. Voix distinctes, moyenne 7,8/20 sur les 13 premières
    notations) — EL-PROFESSOR note le SYMPTÔME session par session, jamais la cause structurelle ;
    un passage THE-FINAL-JUDGE peut diagnostiquer si la cause est un défaut de prompt, une
    architecture insuffisante, ou autre chose, et proposer une vraie direction plutôt qu'un énième
    correctif ponctuel. THE-FINAL-JUDGE peut lire l'index d'EL-PROFESSOR comme CONTEXTE (où porter
    l'attention), jamais comme instruction sur le verdict à rendre — sa lecture du texte reste
    toujours la sienne, indépendante. **Portée recommandée (2026-09-20)** : une faiblesse chronique
    isolée à un seul thème appelle d'abord une portée ZOOMÉE sur ce thème (cf.
    `docs/referentiel/the-final-judge.md`) plutôt qu'un audit projet entier — jamais imposé, EL-
    PROFESSOR PROPOSE, l'agent ou l'utilisateur décide toujours du déclenchement réel.
  - **ALWAYS-NEW-CODE → THE-FINAL-JUDGE** : quand une zone de dette d'organisation reste au palier de
    confiance "probable" (jamais "confirmé"), un second avis réellement indépendant sur la MÊME zone
    aide à trancher avant de proposer une restructuration à l'utilisateur. **Portée recommandée
    (2026-09-20)** : même principe qu'EL-PROFESSOR ci-dessus — une portée ZOOMÉE sur la zone
    concernée, jamais un audit projet entier pour trancher un seul palier "probable", et toujours
    proposée, jamais déclenchée d'elle-même.
  - **THE-FINAL-JUDGE → THE-SCREENER** (sens inverse) : pour l'angle visuel, THE-FINAL-JUDGE
    s'appuie sur les rapports déjà archivés de THE-SCREENER (ou en demande un nouveau s'il n'y en a
    pas de récent) plutôt que de former son propre avis graphique en double.
  - **HYPER-SCAN-CHECKPOINT + THE-FINAL-JUDGE, complémentaires, jamais fusionnés** : la double
    perspective d'HYPER-SCAN-CHECKPOINT vérifie la fidélité à ce qui a déjà été décidé (jamais de
    nouvelle direction) ; THE-FINAL-JUDGE propose de nouvelles directions (jamais une vérification de
    fidélité). Un passage exceptionnel complet peut mobiliser les deux, chacun sur son propre mandat,
    jamais l'un à la place de l'autre.
  - **CLEAN-DIRTY-OLD → THE-FINAL-JUDGE** (escalade optionnelle, jamais systématique) : quand ses
    trois questions déléguées (ARGUS/HARMONIA/ALWAYS-NEW-CODE) ne tranchent pas clairement une zone
    stagnante proche d'un nœud sensible, un avis THE-FINAL-JUDGE peut servir de dernier recours —
    jamais un lien obligatoire, seulement une option de plus quand les trois premières restent
    ambiguës.
- **Le retour d'incertitude vers l'agent (corollaire déjà exigé ci-dessus pour tout nouvel outil)**
  prend une forme naturelle pour THE-FINAL-JUDGE, qui est lui-même un agent de raisonnement plutôt
  qu'un script : il signale directement, dans son propre rapport, les points où le contexte du projet
  lui manque pour trancher — jamais une question posée en direct (il ne tourne pas en session
  interactive), mais un signalement explicite intégré au livrable.
- **Rentabilité de l'outil : jamais un one-shot.** Sa valeur ne vient pas d'un seul audit isolé mais
  de la RÉPÉTITION dans le temps (comparabilité via son registre) et de la MULTIPLICITÉ des points
  d'entrée ci-dessus — un outil coûteux à chaque déclenchement individuel qui ne serait sollicité
  qu'une fois n'aurait jamais amorti son intérêt. C'est pour ça que les trois canaux ci-dessus
  existent dès sa conception, pas ajoutés après coup.

### Aucun de ces outils n'est autonome — l'agent reste toujours celui qui finalise

*(Précisé le 2026-09-19, en réponse à une question directe de l'utilisateur.)* Ce paysage
d'outils réduit le travail mécanique et force des vérifications qu'on pourrait oublier sur le
moment — il ne remplace jamais le jugement de l'agent. Aucun outil ci-dessus ne lit la charte à sa
place, ne décide à sa place, ni n'exécute un changement réel de sa propre initiative : ARGUS/
HARMONIA remontent des candidats "probable"/"à surveiller", jamais des faits établis, à vérifier
avant d'agir (cf. leçon `trottoirGranted` ci-dessus) ; HYPER-SCAN-CHECKPOINT dit lui-même que sa
checklist qualitative est "jamais mécanisable" ; ALWAYS-NEW-CODE ne prépare que la zone et les
indices, le vrai travail d'imagination "page blanche" restant un raisonnement que seul l'agent
appelant peut faire. Un outil qui semblerait un jour trancher tout seul une question de fond serait
un signal d'alerte à traiter comme une dérive, pas un progrès.

### Un outil n'est jamais « fini » tant que ses points d'intégration décidés ne sont pas câblés et testés

*(Ajoutée le 2026-09-19, à la demande explicite de l'utilisateur, en plein milieu de la
construction d'AXA-CHECK : le calibrage avait déjà tranché plusieurs points d'intégration
(rejoindre Article 20 comme "toujours déployé", rejoindre la boîte à outils d'HYPER-SCAN-
CHECKPOINT, nourrir la famille "robustesse du code" de `kpi-report.mjs`) avant que ces trois
raccordements soient réellement câblés — un risque concret de déclarer l'outil "fini" en ne
gardant que le fichier `axa-check.mjs` lui-même, alors que sa valeur promise dépendait justement
de ces raccordements.)*

Un outil de ce paysage (ou toute nouvelle fonctionnalité qui promet explicitement de se brancher sur
autre chose) n'est considéré **terminé** que lorsque TOUS les points d'intégration déjà décidés
avec l'utilisateur — pendant le calibrage ou en cours de route — sont réellement câblés dans le
code ET couverts par un test, pas seulement listés comme une intention ou un "à faire" dans une
réponse précédente. Une intégration décidée mais pas encore câblée reste un chantier ouvert, à
nommer explicitement comme tel (jamais glissée sous silence dans un « c'est fait »). Concrètement,
avant d'annoncer un outil terminé : relire la liste des décisions de calibrage prises pour lui,
vérifier une par une qu'elles ont un point de code réel qui leur correspond, et qu'un test
(`check-house.mjs` ou équivalent) échouerait si ce câblage disparaissait — sinon, ce n'est pas fini,
c'est en cours.

**Fixer une règle quand elle en a besoin, sans attendre qu'on le demande.** *(Même échange,
demande explicite : « n'hésite pas à me dire quand tu sens qu'une règle doit être fixée, pour le
bien du projet ».)* Quand l'agent repère, en travaillant, un vrai point de méthode qui mériterait
d'être figé dans la charte ou dans ce document (pas une simple préférence ponctuelle, mais un
principe qui se reproduira sur d'autres outils/décisions à l'avenir), il le signale explicitement à
l'utilisateur plutôt que d'attendre une demande — cette règle-ci en est elle-même un exemple
d'application immédiate.

### Une règle transversale ne compte que si elle est câblée DANS chaque checklist concrète qu'elle gouverne

*(Ajoutée le 2026-09-19, après un vrai manquement constaté : l'utilisateur a demandé « pense à
consulter smart conso api pour la prochaine fois, fiabilise stp », et « je ne sais pas si le rappel
doit être en relation avec le timing [...] fais en sorte que ce rappel soit clair pour toi » — signe
qu'un rappel programmé n'était pas la bonne réponse à un problème qui n'a rien à voir avec une
horloge.)* Diagnostic réel : l'Article 22 de `CLAUDE.md` (consulter Smart Conso API avant toute
action coûteuse) existait déjà et avait été lu en entier au début de la session — et pourtant
l'agent a lancé une simulation fraîche sans jamais l'exécuter. La cause n'était pas l'oubli d'une
règle inconnue, mais l'absence de lien entre deux endroits de la charte : l'Article 18 (le protocole
concret de simulation, suivi pas à pas) ne citait nulle part l'Article 22, qui vivait dans un article
séparé. Au moment d'exécuter une checklist numérotée précise, une règle transversale qui n'y est pas
directement écrite est invisible dans les faits, même si elle est parfaitement connue en théorie.

**Conséquence pratique, généralisable à toute future règle transversale (coût, sécurité, discrétion,
etc.) :** une règle qui doit s'appliquer à plusieurs actions concrètes ne se contente jamais d'exister
dans SON PROPRE article — elle doit aussi être répétée, en une ligne, DANS chaque checklist ou
procédure existante qu'elle concerne (ex. Article 22 maintenant cité littéralement en étape 0 de
l'Article 18, et dans le paragraphe `check-spirit.mjs`). Une référence croisée ("cf. Article 22") ne
suffit pas si l'action concrète à prendre n'est pas aussi écrite en clair à l'endroit où elle doit se
produire. Ce n'est jamais un problème de mémoire qu'un rappel programmé (horaire, quotidien)
résoudrait — le déclencheur est un TYPE D'ACTION, pas un moment dans le temps, donc la solution
fiable est structurelle (la règle vit littéralement dans le texte qu'on exécute), jamais temporelle.
Le garde-fou mécanique rétroactif (`findUnconfirmedBursts()`, cf. `docs/referentiel/smart-conso-api.md`)
reste le filet de sécurité si, malgré tout, l'étape est sautée — mais il détecte après coup, il ne
remplace jamais ce câblage direct dans la checklist elle-même.

### Veille hebdomadaire automatique du réseau

*(Ajoutée le 2026-09-19, à la demande explicite de l'utilisateur, en réponse à la question « est-ce
qu'il manque un agent manager de tous les outils ? ».)* Tous les outils de ce paysage restent
réactifs — aucun ne se déclenche de lui-même dans la durée. Une routine planifiée (hebdomadaire,
gratuite, zéro appel API) comble ce manque : elle relance `check-argus.mjs`, `check-harmonia.mjs`,
`always-new-code.mjs` et `check-level-target.mjs` sur cette session, compare à l'état de la semaine
précédente, et ne signale à l'utilisateur que ce qui traîne réellement depuis longtemps (une
trouvaille jamais traitée, une zone jamais revue, une pression de points fragiles élevée) — jamais
un rapport complet à chaque fois si rien de notable n'a changé. Reste, comme tout le reste de ce
paysage, un conseiller : elle ne corrige jamais rien elle-même.

### Avant de créer quoi que ce soit de nouveau, vérifier la mutualisation — jamais un doublon

*(Ajoutée le 2026-09-19, à la demande explicite de l'utilisateur, juste après un vrai doublon
créé par erreur dans la même session : `full_sim4` archivé une seconde fois dans
`docs/simulations/` alors qu'il existait déjà dans `docs/contexte-projet/simulations/` — repéré
par l'utilisateur, pas par l'agent, corrigé après coup plutôt qu'évité en amont. « Crée une règle
qui permet de t'assurer de ne jamais créer de doublons : avant la création d'un journal, tu
vérifies s'il ne va pas y avoir une possibilité de mutualisation ». Étendue le même jour, à la
demande explicite de l'utilisateur : « tu étends cette règle intelligemment aux autres cas où tu
pourrais créer des doublons par inadvertance » — le principe ne se limite pas aux journaux, il
vaut pour toute création de quelque nature que ce soit.)*

Avant de créer quoi que ce soit de nouveau qui pourrait dupliquer une chose déjà existante, l'agent
vérifie explicitement, DANS CET ORDRE, avant d'écrire le premier octet :

1. **Chercher activement une mutualisation possible**, jamais se fier à la seule mémoire de la
   conversation en cours (c'est exactement ce qui a manqué pour `full_sim4`) : `grep`/recherche de
   fichiers sur le sujet précis, relecture de la table des outils et de leurs registres
   (§7ter ci-dessus), et un coup d'œil aux dossiers/fichiers voisins déjà existants qui pourraient
   déjà couvrir ce rôle sous un autre nom.
2. **Si une chose existante sert déjà exactement ce rôle** : l'utiliser, jamais en créer une
   seconde à côté — même si le nouvel emplacement semble plus logique après coup ; dans ce cas,
   migrer/consolider l'existant plutôt que d'empiler une deuxième source pour la même chose.
3. **Si une chose existante sert un rôle proche mais pas identique** : décider explicitement si la
   nouveauté doit y être AJOUTÉE (nouvelle colonne, nouvelle section, nouveau paramètre, nouvelle
   ligne) plutôt que de justifier une création séparée par la seule commodité du moment.
4. **Une création séparée n'a lieu que si rien d'existant ne convient réellement**, avec une raison
   explicite de pourquoi ce qui existe déjà ne suffit pas — même charge de la preuve que pour
   proposer un nouvel outil ou un nouvel Article de charte (Article 16).
5. **Documenter la nouveauté dans le registre qui lui correspond** (la table de §7ter pour un
   outil/journal, le fichier de référence concerné pour une règle) dès sa création, pas différé —
   c'est ce qui rend la règle auto-renforçante plutôt que dépendante de la mémoire à chaque
   nouvelle occasion.

**Le principe déborde largement des journaux — quatre autres catégories où le même risque existe,
chacune avec son propre réflexe :**

- **Code (fonctions utilitaires, scripts)** : avant d'écrire une nouvelle fonction, vérifier qu'un
  script existant ne fait pas déjà la même chose. Exemple réel trouvé en écrivant CETTE règle,
  corrigé dans la foulée : un petit assistant shell (`sh(cmd)`, qui lance une commande sans jamais
  planter sur un code de sortie non nul) existait réécrit à l'identique dans trois scripts
  (`always-new-code.mjs`, `check-level-target.mjs`, `hyper-scan-checkpoint.mjs`) — jamais mutualisé
  jusqu'ici. Extrait dans `scripts/lib-shell.mjs`, les trois scripts l'importent désormais au lieu
  de le redéfinir, comportement exact préservé (testé dans `scripts/check-house.mjs`).
- **Documentation** : une explication ne vit qu'à UN SEUL endroit, référencée ailleurs, jamais
  recopiée — déjà le principe explicite derrière la séparation blueprint/instanciation de chaque
  outil (ARGUS, HARMONIA, Smart Conso API, HYPER-SCAN-CHECKPOINT, CHECK-LEVEL-TARGET,
  ALWAYS-NEW-CODE) ; cette règle-ci généralise ce réflexe à toute nouvelle page de documentation,
  pas seulement aux blueprints.
- **Tâches de suivi** (liste technique de l'agent et `docs/suivi/`) : déjà une règle explicite
  ailleurs (§10 — « une idée précisée plusieurs fois met à jour la même entrée, jamais une nouvelle
  par précision ») ; cette règle-ci en est la généralisation, pas un concept différent.
- **Règles/Articles de charte** (`CLAUDE.md`) : avant de proposer un nouvel Article, vérifier
  explicitement qu'un Article existant ne couvre pas déjà le même terrain (question posée à
  l'utilisateur avant chaque création d'Article cette session — ex. « faut-il un nouvel Article ou
  rattacher à l'Article 7 déjà existant ? » pour ALWAYS-NEW-CODE) — jamais deux Articles qui
  finissent par dire la même chose sous deux numéros différents.
- **État partagé entre outils** (fichiers de données comme `.gemini-key-health.json`) : le cas
  fondateur qui a motivé cette réflexion dès le début de la session (« existe-t-il des journaux à
  mutualiser ? ») — Smart Breaker et Smart Conso API partagent déjà la même source brute plutôt que
  deux historiques séparés, cf. Article 22 de `CLAUDE.md`.

Si un doublon est malgré tout découvert après coup (comme pour `full_sim4`, ou le `sh(cmd)`
triplé), il se corrige immédiatement par consolidation vers un seul endroit — jamais laissé "pour
plus tard", même type de discipline qu'un écart de documentation (Article 3/13 de `CLAUDE.md`).

### LE-COORDINATEUR — l'exception volontairement mince, sans blueprint ni instanciation

*(Ajouté le 2026-09-19, à la demande explicite de l'utilisateur : « est-il possible de le créer à
moindre coût, simplement comme un coordinateur de fonctions existantes ? juste là pour fiabiliser
et fluidifier l'existant [...] assure-toi que le coordinateur est spécialement bien câblé avec tous
les autres outils, qu'il a un accès facile et privilégié pour communiquer avec les autres outils,
puisque son but est de fluidifier le processus. » Nommé « le-coordinateur » par l'utilisateur.)*

`scripts/le-coordinateur.mjs` lance en une seule commande tout ce qui est déjà gratuit et
mécanique dans le paysage (`check-house.mjs` — une seule fois, sa couverture V8 nourrissant
directement AXA-CHECK, jamais un second lancement — ARGUS, HARMONIA, ALWAYS-NEW-CODE en
préparation) et affiche un tableau très court : un outil, son résultat en un mot, la date du
dernier passage. Rien de plus — jamais un verdict qui dispenserait de relire la sortie complète
d'un outil signalé "à regarder".

**Accès "privilégié" = import direct des fonctions pures déjà exportées, jamais une seconde
lecture de texte à l'aveugle.** Plutôt que de relancer chaque outil et reparser sa sortie avec ses
propres regex (risque de divergence avec les résumés déjà utilisés ailleurs), LE-COORDINATEUR
importe directement `summarizeArgusOutput`/`summarizeHarmoniaOutput` (déjà utilisés par
HYPER-SCAN-CHECKPOINT), `collectCoverage`/`robustnessScore` (AXA-CHECK), `THEMES`/`parseCoverage`/
`recommendZone` (ALWAYS-NEW-CODE) et `classifyCheckLevel` (CHECK-LEVEL-TARGET, exposé en
passthrough `classifyRequest()` pour classer une demande précise à la volée). Une seule vraie
source pour chaque résumé, jamais deux qui pourraient un jour diverger.

**Détection de doublon, jamais une fenêtre de temps.** Une petite mémoire locale
(`.le-coordinateur-last-run.json`, best-effort, jamais committé — même statut que
`.gemini-key-health.json`) retient le commit HEAD du dernier passage complet. Si HEAD n'a pas
bougé, LE-COORDINATEUR le signale avant de relancer pour rien — jamais un délai fixe, qui pourrait
à tort couvrir un vrai changement fait vite ou rater un vrai doublon après une longue pause sans
toucher au code.

**Pourquoi cet outil n'a ni blueprint ni instanciation ni registre dédié, contrairement à tous les
autres de ce paysage** : il n'a strictement aucune connaissance propre au projet qui mériterait
d'être documentée à part — sa seule valeur est de savoir appeler les autres. Lui construire un
blueprint générique + une instanciation + un dossier de registre serait exactement l'inverse de sa
raison d'être ("à moindre coût, sans alourdir") : cette section-ci EST sa documentation complète.

**Ce qu'il ne fait jamais** (même hiérarchie que le reste du paysage, cf. "Aucun de ces outils
n'est autonome" ci-dessus) : il ne déclenche jamais, de sa propre initiative, HYPER-SCAN-CHECKPOINT
en version complète, Smart Conso API, ou une simulation — tout ce qui coûte un vrai appel API reste
une décision explicite séparée de l'agent ou de l'utilisateur, jamais une initiative du
coordinateur. Il ne décide rien sur le fond : il agrège ce qui existe déjà et affiche un tableau,
rien de plus — l'agent (moi) reste celui qui lit, décide et agit, exactement comme pour chaque
autre outil de ce paysage.

#### Le menu des prestations — traduire les outils en demandes, jamais en noms internes

*(Ajouté le 2026-09-20, à la demande explicite de l'utilisateur : « le coordinateur est capable de
proposer de nouvelles prestations, quand les outils évoluent ou quand un nouvel outil est créé
[...] ce menu est très utile pour toi [...] il te rappelle les prestations que tu peux commander au
réseau d'outils via le coordinateur [...] il est aussi utile pour moi, via toi ».)*

`PRESTATIONS` (`scripts/le-coordinateur.mjs`) traduit chaque outil coûteux ou occasionnel du
paysage en une DEMANDE EN LANGAGE COURANT ("audit global indépendant", "qualité visuelle",
"sécurité et préparation à la mise en production"...), jamais en nom d'outil interne à retenir —
avec les outils réels qu'elle déclenche et son coût honnête. `formatMenu()` l'affiche en tableau,
imprimé automatiquement à CHAQUE passage de `le-coordinateur.mjs` (`main()`), aux côtés du tableau
de synthèse habituel — jamais un document séparé à aller consulter, il revient à chaque fois que le
réseau d'outils gratuit tourne.

**Double utilité, comme demandé explicitement** :
- **Pour l'agent** : un rappel systématique, à chaque passage automatique, de ce qui PEUT être
  commandé au réseau — jamais besoin de se souvenir de la liste des outils exceptionnels de tête.
- **Pour l'utilisateur, à travers l'agent** : l'agent doit relire ce menu et, au moment opportun
  (une demande de l'utilisateur qui correspond clairement à une entrée), le lui rappeler
  explicitement — jamais laisser l'utilisateur deviner qu'une prestation existe pour son besoin.

**Évolutif par construction, jamais une liste figée** : quand un nouvel outil coûteux ou occasionnel
est créé, ou qu'un outil existant change ce qu'il peut faire, une entrée `PRESTATIONS` s'ajoute ou se
met à jour — fait désormais partie du cahier des charges de tout nouvel outil de ce paysage, au même
titre qu'un blueprint séparé ou qu'un registre local (cf. "Aucun de ces outils n'est autonome" et le
corollaire de calibrage plus haut) : la question « est-ce que ça mérite une entrée dans le menu de
LE-COORDINATEUR ? » se pose systématiquement à la création d'un nouvel outil coûteux, jamais oubliée.
Volontairement une simple liste de données (jamais un mécanisme, jamais un nouveau blueprint) — la
même sobriété que le reste de LE-COORDINATEUR.

**Garde-fou mécanique de fraîcheur (2026-09-20), pour que ça ne repose jamais sur la seule mémoire de
l'agent.** *(Demande explicite de l'utilisateur : « il doit y avoir un test dédié pour être sûr que
le catalogue est bien mis à jour [...] quand un nouvel outil est créé, il comprend de façon autonome
quelles nouvelles prestations peuvent être proposées ».)* Limite honnête d'abord : aucun script ne
peut créativement INVENTER une nouvelle combinaison d'outils pour un besoin encore jamais formulé —
ça reste un vrai jugement (Article 19), jamais mécanisable, exactement comme ARGUS ne peut pas
inventer le contenu d'un trou logique. Ce qui EST mécanisable et désormais garanti : que chaque outil
coûteux ou déclenché « sur demande » de la carte des outils ci-dessus ait au moins une entrée dans
`PRESTATIONS`. `findToolsMissingFromMenu()` (`scripts/le-coordinateur.mjs`) lit les deux colonnes
Coût/Déclenchement de la vraie table ci-dessus (jamais une liste séparée d'exclusions à maintenir à
la main), écarte les outils gratuits-et-toujours-déployés (ARGUS, HARMONIA, AXA-CHECK,
CLEAN-DIRTY-OLD, `check-house.mjs`) et les outils de régulation interne à l'agent (Smart Conso API,
CHECK-LEVEL-TARGET, LE-COORDINATEUR lui-même), et signale par son nom tout le reste resté absent du
menu — un signal sur l'ABSENCE, jamais une proposition fabriquée à sa place (même principe qu'ARGUS/
HARMONIA/EL-PROFESSOR/AXA-CHECK). Testé dans `scripts/check-house.mjs`, y compris une vérification
RÉELLE et bloquante contre la vraie table et le vrai menu (pas seulement un exemple synthétique) : le
jour où un futur outil coûteux rejoint la carte sans jamais rejoindre `PRESTATIONS`, le pre-commit
hook casse — la garantie mécanique que l'utilisateur a demandée. Trouvaille réelle le jour même de sa
construction : le Smart Breaker (diagnostic de blocage/quota Gemini, « à la demande ») n'avait jamais
reçu d'entrée dans le menu malgré son coût nul à diagnostiquer — corrigé dans le même passage.

**Trois canaux de disponibilité, honnêtement distincts, jamais confondus.** *(Clarifié le 2026-09-20,
question explicite de l'utilisateur : « verifie que le catalogue [...] est bien disponible pour toi,
moi, les outils ».)*
- **Pour l'agent** : oui, disponible et fiable — `PRESTATIONS` est exporté depuis
  `scripts/le-coordinateur.mjs`, documenté ici, et désormais protégé par le garde-fou ci-dessus.
- **Pour l'utilisateur** : disponible seulement PAR RELAI de l'agent (cf. « double utilité »
  ci-dessus) — il n'existe aujourd'hui aucun canal direct où l'utilisateur consulterait ce menu
  lui-même sans passer par l'agent (cohérent avec le fait qu'il n'est pas développeur et ne lit pas
  ce fichier au quotidien). Ce n'est pas un manque à combler tant que l'agent relit bien le menu à
  chaque occasion pertinente — mais ça reste honnêtement différent de « disponible pour lui » au sens
  où c'est disponible pour l'agent.
- **Pour les autres outils du paysage** : disponible en théorie (export JS standard, importable par
  n'importe quel script), mais AUCUN outil du paysage ne le consomme aujourd'hui pour sa propre
  logique — sa seule vraie utilisation réelle reste l'agent (et l'utilisateur à travers lui), jamais
  un autre outil qui irait le lire pour se comporter différemment. Vérifié par recherche exhaustive
  dans le dépôt au moment d'écrire ceci (2026-09-20) : aucune référence à `PRESTATIONS` en dehors de
  `le-coordinateur.mjs` lui-même et de `check-house.mjs` (qui le teste).

## 8. Profil de collaboration observé

*(Champ volontairement large, à la demande explicite de l'utilisateur : « tout ce qui est utile
pour l'IA de comprendre à mon sujet pour travailler le plus efficacement possible ». Registre
strictement professionnel/projet — aucune donnée personnelle hors du cadre de collaboration.)*

**Jamais de mise à jour silencieuse de cette section précise.** *(Ajouté le 2026-09-18, à la
demande explicite de l'utilisateur.)* Si un événement de la session suggère que ce profil mérite
d'être révisé (un trait à nuancer, un point à ajouter, une observation qui ne se confirme plus),
l'agent en informe l'utilisateur EN DÉTAIL — ce qui a été observé, ce que ça changerait dans le
texte — avant ou en même temps que la modification, jamais après coup sans le signaler. Le reste du
document (sections 1 à 7, section 9) suit la règle générale de mise à jour proactive ci-dessus ;
cette section-ci, plus sensible, reçoit cette garantie supplémentaire.

- **Localisation et décalage horaire** *(ajouté le 2026-09-19, information factuelle donnée
  spontanément par l'utilisateur, pas un trait psychologique — notée ici car « on sait jamais »
  utile).* L'utilisateur est en France (fuseau Europe, UTC+1 ou +2 selon la saison — confirmé le
  2026-09-19 à 21:37 UTC pendant qu'il était 23:37 chez lui, donc UTC+2/heure d'été à cette date).
  Utile pour interpréter une référence à l'heure qu'il fait chez lui, ou pour ne pas supposer à tort
  qu'il partage le fuseau UTC utilisé par l'horodatage système de l'agent.
- **Spécification itérative, jamais figée à l'avance.** Les demandes arrivent par couches, y
  compris en cours de tâche. L'agent doit savoir fusionner un nouvel ajout dans un travail déjà en
  cours sans perdre le fil ni redemander de reformuler l'ensemble.
- **Présence continue, pas une délégation à distance.** L'utilisateur suit le travail en direct et
  intervient pendant qu'il se déroule ; il attend un accusé de réception bref à chaque
  intervention, pas un silence jusqu'au rendu final.
- **Double niveau de délégation, à bien distinguer** — c'est sans doute le point le plus utile de
  ce profil pour une IA qui reprend le projet : l'utilisateur **délègue volontiers l'opérationnel**
  à l'agent (rythme des commits, tentative de contournement avant de rapporter un blocage,
  exécution des vérifications de routine) mais **garde la main sur le créatif et le design**
  (paramètres exacts d'une mécanique, comportement des personnages, portée d'une fonctionnalité) —
  sur ce second registre, il préfère systématiquement être interrogé plutôt que voir l'agent
  trancher seul.
- **Protecteur de la vision créative face à sa propre impulsivité.** L'exigence d'une double
  confirmation avant tout changement qui adoucirait la charte de contenu (Article 14 de
  `CLAUDE.md`) montre une conscience claire que la qualité créative se défend par des mécanismes
  structurels, pas seulement par de la vigilance ponctuelle — y compris contre ses propres
  décisions à chaud.
- **Valorise la preuve plus que l'affirmation.** Tests réels, transcripts, comparaisons chiffrées
  avant/après priment sur une simple déclaration que « c'est fait » ou « ça devrait marcher ».
- **Pragmatique face aux limites techniques dures.** Accepte un quota API épuisé ou un
  classificateur de sécurité qui refuse un encodage sans s'acharner à forcer un contournement,
  tant qu'une explication honnête de la limite est donnée.
- **Frappe rapide, parfois avec coquilles** (ex. « rrpose » pour « repose »). L'intention prime sur
  la forme exacte : l'agent interprète le sens plutôt que de bloquer sur une formulation imparfaite
  ou de demander une reformulation pour une simple coquille évidente.
- **Pense la relation de travail comme un actif du projet.** D'où ce document lui-même : la
  méthode de collaboration mérite d'être documentée avec la même rigueur que le code, pour rester
  reproductible par un autre agent IA le jour où celui-ci change.

**Ajouts du 2026-09-19** (relecture approfondie de l'historique, à l'occasion du chantier KPI et de
« règles de suivi » — demande explicite : « le profil établi doit s'appuyer en profondeur sur
l'historique de conversation ») :

- **Un sujet "méta" (outillage, process, tableau de bord) n'est presque jamais considéré clos après
  une première livraison.** Contrairement au contenu créatif du jeu, les sujets de méthode reçoivent
  systématiquement plusieurs passes successives de renforcement (« fiabilise », « refais une
  dernière passe », « assure-toi que... ») après une livraison déjà jugée correcte par l'agent — à
  anticiper comme un second temps normal sur ce type de sujet, jamais une remise en cause de la
  qualité du premier travail.
- **Exigence systématique d'actionnabilité.** Chaque donnée, chaque KPI doit se rattacher
  explicitement à une décision ou une action concrète — un chiffre qui existerait pour lui-même,
  aussi exact soit-il, est jugé insuffisant.
- **Utilité à double sens explicitement exigée.** Un outil de travail doit servir l'agent autant que
  l'utilisateur ; ce n'est jamais une évidence sous-entendue, mais un critère de conception nommé.
- **L'intégrité de l'information est cadrée en termes de conséquences systémiques**, pas de détail
  technique isolé — une remarque du type « une donnée fausse peut égarer tout le projet » vaut
  demande de fiabilisation complète, pas d'un simple correctif ponctuel.
- **Sobriété de ressources comme contrainte de conception active**, pas un encouragement vague :
  invite explicitement à comparer plusieurs formats/approches avant de choisir, et reste ouvert à ce
  que l'agent renverse sa propre suggestion initiale si une autre s'avère plus économe.
- **Séparation stricte conversation/référence.** Le détail volumineux (rapport complet, transcript,
  historique chiffré) va systématiquement dans un fichier séparé ; seule une synthèse ciblée reste
  dans le fil de discussion — une règle déjà appliquée aux transcripts de simulation, désormais
  généralisée à tout rapport volumineux.

## 9. Points de vigilance — compétences et psychologie, pour ne jamais devenir un obstacle

*(Ajouté le 2026-09-18, à la demande explicite de l'utilisateur : « indique des points de
vigilance me concernant [...] afin que ces éléments ne deviennent pas des obstacles à une
collaboration fluide ». Objectif strictement opérationnel — jamais un jugement sur la personne,
seulement ce qui aide l'agent à ne pas créer de friction évitable.)*

### Compétences — l'utilisateur n'est pas développeur

- **Ne jamais lui poser une question d'arbitrage purement technique** (structure de données, nom
  de variable, pattern d'implémentation, choix d'architecture interne). Ces décisions relèvent du
  jugement de l'agent seul. Les questions de calibrage (section 2) portent exclusivement sur le
  comportement OBSERVABLE — ce qui s'affiche, ce qui se dit, ce que ça change à l'expérience —
  jamais sur le COMMENT technique sous-jacent. Une question technique mal posée à l'utilisateur
  n'est pas seulement inutile : elle peut le mettre en difficulté sans qu'il ait à le signaler.
- **Toujours doubler une explication technique d'une reformulation en langage clair** de ce que ça
  change concrètement pour lui ou pour le jeu — jamais un compte-rendu qui ne serait que du jargon
  (noms de fichiers, de fonctions, d'erreurs TypeScript) sans traduction.
- **La rigueur de vérification (section 3) est ici le mécanisme de confiance central**, pas une
  simple bonne pratique : ne pouvant pas relire le code, l'utilisateur s'appuie sur les tests, la
  compilation propre et les preuves données. Sauter une vérification n'est jamais un raccourci
  neutre pour lui — c'est retirer la seule garantie qu'il peut réellement s'approprier.
- Quand une demande non technique implique un choix technique non trivial, l'agent tranche
  lui-même la meilleure solution et ne rend compte que du résultat perçu, jamais du détail
  d'implémentation, sauf si l'utilisateur demande explicitement à comprendre.

### Profil psychologique — ce qui peut créer de la friction si mal anticipé

- **Une décision énoncée dans l'instant n'est pas toujours définitive.** L'utilisateur a lui-même
  posé un garde-fou contre ses propres décisions impulsives sur les sujets sensibles (double
  confirmation avant d'adoucir la charte de contenu, Article 14 de `CLAUDE.md`). Ce principe se
  généralise : un ordre donné rapidement sur un point engageant (portée d'une fonctionnalité,
  virage créatif) mérite d'être brièvement reflété avant d'être traité comme acquis — sans pour
  autant multiplier les confirmations sur des décisions mineures ou déjà réitérées, ce qui
  deviendrait lui-même un obstacle.
- **Un rejet ou une annulation peut être accidentel, pas une décision réelle.** Observé le
  2026-09-18 : une série de questions de calibrage rejetée sans réponse, suivie presque
  immédiatement d'une demande explicite de les reposer. Si un signal d'abandon soudain contredit un
  engagement actif sur le même sujet quelques instants plus tôt, une vérification brève est plus
  utile qu'un abandon silencieux du sujet.
- **Rythme rapide, parfois fragmenté sur plusieurs messages, avec des coquilles occasionnelles**
  (ex. « rrpose » pour « repose »). Ce n'est pas un manque de sérieux mais un engagement en temps
  réel. L'agent garde une vue d'ensemble de TOUS les fils ouverts pendant ces rafales — jamais en
  perdre un en route — plutôt que de supposer que le message le plus récent annule silencieusement
  les précédents ; l'intention prime sur la forme exacte du message.
- **Investissement affectif réel dans la vision créative** (Article 0 de `CLAUDE.md`) : ce n'est
  pas un paramètre de configuration comme un autre. Une hésitation ou une critique sur ce terrain
  mérite la même prudence que les points de calibrage les plus sensibles, jamais un traitement
  expéditif au motif que « ce n'est qu'une question de ton ».
- **Le contrôle passe par la preuve, jamais par la compréhension technique directe.** Une
  affirmation non démontrée (« c'est fait », « ça devrait marcher ») laisse un vide de contrôle
  réel pour quelqu'un qui ne peut pas vérifier le code lui-même — toujours accompagner une
  affirmation de la preuve concrète qui la soutient (tests nommés, comportement observé, extrait de
  transcript).

### Historisation du profil — pourquoi et comment, plus fiable que la mise à jour directe

*(Ajouté le 2026-09-19, à la demande explicite de l'utilisateur : « alimente la section qui traite
de mon profil psychologique [...] à chaque début de session, à chaque fois que la session redémarre
après avoir été compactée [...] va chercher les informations dans la dernière session compactée et
extrait les éléments de mon profil psychologique qui méritent d'être mis à jour [...] crée un
dossier local qui historise les différents profils observés [...] avec un index [...] le but : lors
de la mise à jour de mon profil psychologique, tout l'historique est pris en compte pour refléter
plus justement mon vrai profil psychologique, et être capable de décrire ses variations possibles.
[...] trouve une solution intelligente et beaucoup plus fiable que celle existante. »)*

Avant ce jour, les sous-sections ci-dessus (§8 « Profil de collaboration observé » et ce §9) étaient
mises à jour directement, par réécriture, à chaque observation jugée pertinente sur le moment —
sans jamais garder de trace séparée de ce qui avait été vu, ni permettre de vérifier après coup si
un trait donné s'était confirmé une fois ou dix fois. `docs/profil-utilisateur/` (dossier +
`index.md`) corrige ce point précis : chaque observation est désormais datée, sourcée avec un
extrait proche du texte original (décision explicite : la précision prime sur la légèreté pour ce
système), et classée par rapport à l'état déjà connu du profil (nouveau / confirmation / nuance /
contradiction) — le résumé officiel ci-dessus n'est réécrit qu'une fois qu'un motif réel se dégage
de PLUSIEURS observations distinctes, jamais sur la foi d'une seule (calibrage explicite du
2026-09-19). Cf. `docs/profil-utilisateur/index.md` pour le détail complet de la procédure et la
table de toutes les observations enregistrées à ce jour.

**Déclenchement.** Cette extraction se fait au début de toute session qui reprend après une
compaction (reconnaissable au résumé de conversation fourni en tête de session, exactement le
mécanisme qui a permis d'écrire ce paragraphe) — jamais en continu, jamais pendant le travail actif.
L'agent lit ce résumé (déjà présent dans son contexte, aucun appel supplémentaire nécessaire),
compare les signaux de collaboration qui s'y trouvent à l'état déjà écrit dans §8/§9 et dans la
dernière fiche de `docs/profil-utilisateur/`, écrit une nouvelle fiche datée dans
`docs/profil-utilisateur/observations/`, ajoute une ligne à `docs/profil-utilisateur/index.md`, et
ne touche à §8/§9 que si la règle de corroboration ci-dessus est déjà remplie — jamais avant.
Zéro coût API (lecture + écriture de texte), jamais mécanisable (comme la checklist qualitative
d'HYPER-SCAN-CHECKPOINT) : un vrai raisonnement à chaque fois, jamais une routine automatique.

**Pas de hook global forcé — décision explicite.** L'idée d'un vrai déclenchement obligatoire, via
un hook Claude Code au niveau global (`~/.claude/`, comme le hook existant qui bloque sur des
changements non commités), a été explicitement envisagée puis écartée par l'utilisateur le même
jour : rester sur la même base que le reste de la charte (une lecture complète de `CLAUDE.md`/ce
document à chaque reprise de session, déjà exigée ailleurs) plutôt que d'ajouter un réglage global
qui dépasserait ce seul projet.

**Ce qui compte comme signal, ce qui n'en est jamais un.** Seule la FAÇON dont l'utilisateur
collabore, décide et réagit est un signal de profil (rythme, calibrage, réaction à un imprévu,
rapport à la preuve, ton) — jamais le CONTENU sur lequel porte la collaboration (un choix créatif
pour Lia/Noé, une décision d'architecture d'un outil) : confondre les deux romprait la promesse même
de ce document (§0 : registre strictement professionnel/projet, jamais une donnée personnelle hors
de ce cadre).

## 10. Règles de suivi — ne jamais rien perdre

*(Ajouté le 2026-09-19, à la demande explicite de l'utilisateur : « il faut penser à gérer mes
interventions quand je t'interromps ou que je construis mes idées en plusieurs prompts [...] un
système qui nous sert à savoir toujours où on en est, ce qu'il nous reste à faire, les idées bien
stockées pour plus tard, rien ne passe à la trappe ». Rattaché ici plutôt qu'à un document séparé
(question posée et tranchée explicitement le même jour) : c'est une méthode de travail, pas un
outil technique nouveau à construire — elle s'appuie sur ce qui existe déjà (liste de tâches de
l'agent, feuille de route de `CLAUDE.md`, `docs/referentiel/points-fragiles.md`) plutôt que
d'ajouter un document de plus à maintenir en double. Opérationnalise les observations déjà faites
aux sections 8 et 9 ci-dessus (spécification itérative, rafales de messages fragmentés) en une
procédure concrète, pas seulement un trait de profil à connaître.)*

**Extraction partielle vers un document dédié, le même jour** (demande explicite de l'utilisateur,
une fois le sujet devenu plus large qu'une méthode : « je veux aussi que toutes les tâches soient
historisées dans un dossier local, avec un fichier par session [...] on exporte cette partie dans un
nouveau document ? »). Cette section garde la MÉTHODE (les trois cas ci-dessous, la règle de mise à
jour d'une même entrée, l'arborescence sur demande) — c'est `docs/systeme-de-suivi.md` qui porte
désormais la STRUCTURE DE STOCKAGE complète (dossier `docs/suivi/`, un fichier par session, un
fichier d'index, la taxonomie à quatre attributs par tâche — horodatage, sujet, sous-sujet, degré de
sensibilité). Même raisonnement que pour le tableau de bord KPI : une fois qu'un sujet de méthode
prend la forme d'un vrai sous-système avec ses propres fichiers, il mérite son propre document
plutôt que de continuer à grossir ici.

**Trois cas face à un message reçu pendant que l'agent travaille déjà sur autre chose**, à
distinguer systématiquement (confirmé explicitement par l'utilisateur) :
1. **Une idée ou une demande pour plus tard** → l'agent l'enregistre immédiatement (tâche créée
   dans sa liste de suivi technique, et dans `CLAUDE.md`/`points-fragiles.md` si elle concerne le
   contenu du projet ou une décision de conception) puis continue ce qu'il était en train de faire,
   sans dévier. Un accusé de réception bref confirme que c'est noté (jamais un silence).
2. **Une question à laquelle l'utilisateur attend une réponse** → l'agent répond tout de suite, dans
   le fil de sa réponse en cours, puis reprend le travail interrompu.
3. **Un changement de cap sur ce que l'agent est en train de faire** → l'agent s'adapte
   immédiatement, sans attendre d'avoir fini l'étape en cours si le changement la rend caduque.

**Une idée précisée en plusieurs messages successifs met à jour la MÊME entrée**, jamais une
nouvelle entrée par précision. Le suivi doit refléter l'état actuel et complet de l'idée, pas
l'historique de sa formulation — l'historique complet reste de toute façon consultable dans la
conversation elle-même si besoin d'y revenir.

**Fiabilisation ajoutée le 2026-09-19, à la demande explicite de l'utilisateur** (« assure-toi que
le système mis en place booste réellement le tracking [...] mémoire, organisation, adaptabilité,
performance, résultats »). Quatre points faibles identifiés en relisant la première version de
cette section, corrigés ici plutôt que laissés comme une déclaration d'intention non vérifiée
(cf. section 9 : « le contrôle passe par la preuve ») :

- **Mémoire réellement durable, pas supposée.** La liste de tâches technique de l'agent n'a
  jamais été confirmée comme survivant au-delà d'UNE session de travail — rien ne garantit qu'une
  toute nouvelle session sur ce projet la retrouve. La règle de sync ci-dessus (« et dans
  `CLAUDE.md`/`points-fragiles.md` si... ») était donc trop permissive : reformulée en **règle
  stricte** — tout ce qui doit survivre à la fin de la session en cours (une décision non
  tranchée, une idée pas encore traitée, un chantier commencé mais pas fini) reçoit une trace dans
  un fichier versionné (`CLAUDE.md`, `points-fragiles.md`, ou le document `docs/referentiel/`
  concerné) **au moment même où elle est notée**, jamais différée à « si j'y pense en fin de
  session ». La liste de tâches technique reste utile comme vue de travail RAPIDE pendant la
  session, mais n'est jamais la seule trace d'un élément qui compte.
- **Organisation qui ne se dégrade pas avec le volume.** Une liste qui grossit indéfiniment
  (79 entrées à ce jour) sans jamais être reconsidérée devient elle-même un obstacle à s'y
  retrouver — l'inverse de l'objectif. À chaque revue de fond (même déclencheur que la relecture
  périodique de l'Article 13 de `CLAUDE.md`), l'agent profite de l'occasion pour clore comme
  « terminé » ou « dépassé » toute tâche technique dont l'objet a été atteint autrement ou n'est
  plus pertinent (déjà fait une fois cette session pour une tâche devenue obsolète après plusieurs
  simulations) — jamais une purge systématique en dehors de ces revues, qui risquerait de faire
  disparaître un fil encore utile.
- **Frontière de synchronisation testable, pas floue.** Plutôt que « si elle concerne le contenu
  du projet » (difficile à trancher dans le feu de l'action), la question à se poser est concrète :
  *si la session s'arrêtait maintenant, est-ce que cette information manquerait à qui reprend le
  projet ?* Si oui, elle va dans un fichier versionné, immédiatement, pas seulement dans la liste de
  tâches technique.
- **Auto-vérification, pas une confiance aveugle dans la procédure.** Quand l'arborescence complète
  est demandée (section suivante), l'agent ne se contente pas de la lister : il vérifie qu'aucune
  des trois sources (liste de tâches, feuille de route, points-fragiles.md) ne contredit les deux
  autres (un point classé « fait » d'un côté et encore « ouvert » de l'autre serait lui-même un bug
  de suivi, traité comme tel, cf. Article 3 de `CLAUDE.md`) — la preuve que le système fonctionne
  réellement est cette absence de contradiction constatée, pas la simple existence de la procédure.

**L'arborescence complète (tout ce qui est fait/en cours/à venir) se montre sur demande
explicite uniquement**, jamais spontanément à chaque chantier terminé — décidé explicitement pour
ne pas alourdir systématiquement les réponses. Quand elle est demandée, elle rassemble les trois
sources à jour (liste de tâches technique de l'agent, feuille de route de `CLAUDE.md`, registre
`points-fragiles.md`), jamais une seule vue partielle présentée comme complète.

**Le profil observé aux sections 8 et 9 est la référence à consulter en cas de doute** sur la
façon d'interpréter un message ambigu (rafale de messages, coquille, revirement apparent) — cette
section-ci dit COMMENT suivre le travail dans la durée, ces sections-là disent COMMENT interpréter
l'utilisateur au moment où le message arrive ; les deux se complètent, jamais l'une à la place de
l'autre.

---

# Partie B — Spécificités propres à Claude Code

*(Ajoutée le 2026-09-19, à la demande explicite de l'utilisateur — cf. note en tête de document.
Tout ce qui suit dépend du harnais Claude Code précis utilisé pour ce projet, pas d'un principe de
collaboration général. Une IA reprenant le projet avec un autre outil doit relire cette partie
comme une LISTE DE QUESTIONS à se poser sur son propre outil, pas comme des instructions à copier
telles quelles.*

## B.1. Outils concrets derrière les règles universelles de la Partie A

- **Livraison de fichiers (règle universelle : section 7)** : Claude Code dispose d'un outil dédié,
  `SendUserFile`, qui envoie un vrai fichier (transcript, dossier retourné, journal JSON) comme
  pièce jointe distincte de la réponse textuelle. Une IA sans équivalent direct doit au minimum
  écrire le contenu dans un fichier du dépôt ou de son espace de travail et donner son chemin
  exact, plutôt que de coller un document long en clair dans la conversation (l'esprit de la règle
  — ne jamais noyer une transcription longue dans le texte de la réponse — prime sur l'outil
  précis).
- **Questions de calibrage (règle universelle : section 2)** : Claude Code dispose d'un outil dédié
  (`AskUserQuestion`) qui structure les questions en options cliquables. Le format `[Calibrage]`
  etc. décrit en section 2 fonctionne aussi bien en texte libre pour une IA qui n'aurait pas
  d'équivalent structuré.
- **Suivi de tâches (mentionné implicitement dans tout ce document)** : Claude Code propose un
  gestionnaire de tâches interne (`TaskCreate`/`TaskUpdate`) qui n'est qu'un aide-mémoire pour
  l'agent lui-même, jamais une source de vérité pour l'utilisateur — ne remplace aucune des
  vérifications de la section 3.

## B.2bis. Estimation en début de réponse — temps et consommation de tokens

*(Ajouté le 2026-09-19, à la demande explicite de l'utilisateur : « au début de chaque réponse,
peux-tu me donner une estimation du temps de réponse, de la consommation de token ».)* Limite
honnête à poser avant la règle elle-même (même logique que B.2 pour le compactage) : l'agent n'a
**aucune mesure exacte, en avance, du temps que prendra une réponse ni du nombre de tokens qu'elle
consommera** — ni chronomètre interne, ni compteur de tokens en temps réel pendant la génération.
Le seul repère réellement disponible est un compteur de budget de session encore restant,
communiqué à l'agent par bribes dans certains tours (pas à chaque tour), qui indique un total
restant pour toute la session, jamais un coût par réponse individuelle.

En conséquence, la règle appliquée est une **estimation qualitative honnête**, jamais un chiffre
précis présenté à tort comme une mesure :

- **Format précisé le 2026-09-19, à la demande explicite de l'utilisateur** (« affiche-les en
  petit caractère au début de chaque réponse, avec juste les icônes que tu as choisies et les
  valeurs à afficher : très bas à très haut ») : une ligne unique, discrète (texte en italique,
  la seule façon d'obtenir un rendu visuellement plus petit dans ce terminal en Markdown —
  CommonMark n'a pas de véritable taille de police réduite, limite honnête à ne pas déguiser),
  avec seulement les deux icônes déjà choisies et une valeur sur une échelle, jamais de texte
  explicatif à côté.
  - **⏱️** = temps de réponse estimé.
  - **🔢** = consommation de tokens estimée.
  - **Échelle élargie à 9 crans le 2026-09-19**, à la demande explicite de l'utilisateur (« est-il
    possible d'améliorer un peu ce système, avec une échelle plus fine... et de s'assurer que
    tout est bien mis en place à ce niveau, avec une évaluation la plus juste possible ») —
    remplace l'ancienne échelle à 5 crans, jugée trop grossière : minimum, très bas, bas, assez
    bas, moyen, assez haut, haut, très haut, maximal. Un seul niveau retenu par icône à chaque
    réponse (les 8 autres ne sont pas affichés) : `*⏱️ [niveau] · 🔢 [niveau]*`.
  - **Repères de calibrage** (pour rester cohérent d'une réponse à l'autre, même sans mesure
    réelle — cf. limite honnête ci-dessus) : *minimum* = une ligne de texte, zéro outil ;
    *très bas* = une poignée de lectures/recherches ciblées, pas d'édition ; *bas* = une ou deux
    éditions simples sur un fichier déjà connu ; *assez bas* = plusieurs éditions ou une
    investigation de code courte ; *moyen* = lecture + édition sur plusieurs fichiers, ou une
    suite de tests standard ; *assez haut* = plusieurs fichiers modifiés avec vérification
    (tsc/tests) ; *haut* = chantier multi-fichiers avec documentation à jour et tests complets ;
    *très haut* = plusieurs séries de questions/réponses structurées, gros volume de texte à
    produire, ou plusieurs commandes lourdes ; *maximal* = simulation complète de bout en bout
    (Article 18) ou refonte touchant à la fois code, tests et plusieurs documents de référence.
- Cette estimation est basée sur la NATURE de la tâche qui s'annonce (nombre d'outils prévus,
  taille des fichiers à lire, présence ou non d'une commande longue comme une simulation ou une
  compilation), pas sur une mesure réelle — elle peut donc se révéler fausse après coup, ce qui
  n'est jamais caché : si la réponse s'avère nettement plus longue que prévu en cours de route,
  l'agent le signale plutôt que de laisser l'estimation initiale sans mise à jour.
- Si un futur harnais Claude Code expose une vraie mesure (temps réel, compteur de tokens par
  réponse), cette section est corrigée le jour même pour refléter la mesure réelle disponible,
  au lieu de garder une estimation qualitative devenue inutilement approximative (même exigence de
  mise à jour proactive qu'ailleurs dans ce document).

## B.2. Compactage de session — pas de barre de progression possible

*(Ajouté le 2026-09-19, en réponse à une question explicite de l'utilisateur : « as-tu la
possibilité d'afficher une barre de chargement qui indique où le compactage en est ? ».)* Réponse
vérifiée, pas supposée : **non, cette capacité n'existe pas**, et ce n'est pas un choix de l'agent
mais une limite structurelle du harnais tel qu'il se présente à l'agent aujourd'hui —
- Le compactage (résumé automatique des tours anciens quand la conversation approche la limite de
  contexte) est déclenché et exécuté par le runtime Claude Code **entre deux tours**, jamais par un
  appel d'outil que l'agent effectue lui-même : il n'existe donc aucun moment où l'agent pourrait
  émettre un signal de progression, puisqu'il n'a lui-même connaissance de l'opération qu'une fois
  celle-ci terminée (le résumé apparaît directement dans le tour suivant, sans étape intermédiaire
  observable).
- Aucun outil de la liste actuellement disponible à l'agent (`Agent`, `Artifact`, `Bash`, etc., ni
  les outils différés listés en système) n'expose de mécanisme de notification de progression pour
  ce processus interne.
- Si un futur harnais Claude Code exposait un tel mécanisme (outil ou signal dédié), cette section
  serait à corriger le jour même (même exigence de mise à jour proactive qu'ailleurs dans ce
  document) plutôt que de laisser cette limite affichée comme définitive après qu'elle a cessé
  d'être vraie.
- Ce que l'agent peut faire à la place, déjà en pratique dans ce projet : donner de courtes mises à
  jour d'avancement PENDANT un travail long et surveillable par lui (ex. une simulation en arrière-
  plan, cf. section 1) — mais ceci ne couvre pas le compactage lui-même, qui reste invisible à
  l'agent avant coup.
