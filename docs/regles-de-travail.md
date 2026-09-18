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
fichier joint (`SendUserFile`), jamais collée en clair dans la réponse — préférence actée le
2026-09-18, cf. `CLAUDE.md`.

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

## 8. Profil de collaboration observé

*(Champ volontairement large, à la demande explicite de l'utilisateur : « tout ce qui est utile
pour l'IA de comprendre à mon sujet pour travailler le plus efficacement possible ». Registre
strictement professionnel/projet — aucune donnée personnelle hors du cadre de collaboration.)*

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
