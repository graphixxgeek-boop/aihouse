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
