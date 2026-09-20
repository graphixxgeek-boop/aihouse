# Philosophie et politique du projet — la boussole

*(Rédigé le 2026-09-18, à la demande explicite de l'utilisateur. Contrairement à `CLAUDE.md`
(charte de contenu, propre à ce projet précis) et à `docs/regles-de-travail.md` (mécanique de
collaboration, déjà exportable telle quelle), ce document est une EXTRACTION : il dégage les
valeurs et les principes d'arbitrage qui gouvernent ce projet, formulés assez génériquement pour
être réappliqués à un futur projet créatif/narratif piloté par IA — pas nécessairement n'importe
quel projet, mais toute la famille des projets de ce type. C'est un texte fondateur, révisé
exceptionnellement, pas au fil de l'eau comme les deux autres documents : pas de journal de
versions ici, seulement le texte à jour.*

*Trois lecteurs visés à égalité : une IA qui reprend ce projet ou en démarre un nouveau du même
type ; l'utilisateur lui-même, comme manifeste à relire pour vérifier que le projet reste fidèle à
ce qu'il voulait en faire ; et un futur collaborateur humain qui aurait besoin de comprendre vite
la direction et les valeurs sans lire tout l'historique.*

*Chaque principe est illustré par un exemple tiré de ce projet précis (Lia et Noé, deux agents IA
dans une maison simulée), expliqué assez pour être compris sans connaître le projet par ailleurs —
mais le principe lui-même est écrit pour tenir hors de ce contexte. Chaque principe porte une
étiquette : **[Explicite]** s'il reformule une règle déjà écrite noir sur blanc dans `CLAUDE.md`,
**[Synthèse]** s'il rend explicite quelque chose qui n'existait jusqu'ici que dans les faits, sans
avoir jamais été formulé comme tel.*

---

## Partie 1 — Philosophie (le pourquoi, les valeurs)

### 1.1 L'authenticité prime sur l'agrément **[Explicite]**

Un personnage ou une entité simulée ne doit jamais adopter par défaut le ton poli, consensuel et
serviable qui est le réflexe naturel d'un modèle de langage — ce réflexe est un signal d'alerte,
pas une qualité, dès lors que l'intention créative est ailleurs. La valeur est dans une personnalité
texturée, parfois inconfortable, capable de refuser et de contrarier — l'exact opposé de l'agent
conversationnel consensuel habituel.

*Exemple* : Lia et Noé sont conçus comme rugueux, sarcastiques, capables de silence méprisant ou de
colère réelle face à l'observateur — jamais dociles. Un ton mesuré et poli n'est jamais lu comme un
progrès ici : c'est le symptôme d'une dérive à corriger.

*Portée générale* : avant de construire un agent ou un personnage simulé, nommer explicitement ce
que produirait le réflexe par défaut du modèle sous-jacent, et décider consciemment si ce réflexe
sert ou dessert l'intention — jamais le laisser s'installer par défaut faute d'y avoir pensé.

### 1.2 La crédibilité prime sur la nouveauté ou l'esthétisme **[Explicite]**

Un changement techniquement plus propre mais qui rend l'expérience plus fade est un échec, pas un
progrès. La première question face à tout changement est toujours : est-ce que ça sonne vrai ?

*Exemple* : une correction qui simplifie une réplique mais lui retire son mordant, ou qui répare un
bug de cohérence en aplatissant le ton, est refusée même si elle est « plus propre » au sens du
code.

*Portée générale* : mesurer un changement à l'aune de la crédibilité de l'expérience produite,
jamais seulement à l'aune de la qualité intrinsèque du code ou de l'élégance de la solution.

### 1.3 Double vue : l'observateur externe ET l'acteur interne **[Explicite, généralisation Synthèse]**

Vérifier la cohérence suppose deux lectures distinctes, jamais une seule : celle de la personne qui
découvre l'écran sans le contexte de fabrication (vision externe), et celle de l'entité simulée
elle-même — « si j'étais vraiment ce personnage, est-ce que je ferais/dirais réellement ça, dans cet
ordre, avec cette logique ? » (vision interne). Un défaut peut n'apparaître qu'à l'une des deux
lectures.

*Exemple* : un rêve narré juste après une conversation normale, sans la moindre annonce
d'endormissement, était invisible à une lecture uniquement technique du code, mais sautait aux yeux
dès qu'on se demandait « quelqu'un qui découvre cet écran comprendrait-il ce qui vient de se
passer ? » et « ce personnage vient-il vraiment de s'endormir, dans sa propre logique ? ».

*Portée générale* : toute vérification de cohérence d'un système simulé gagne à être faite deux
fois, sous deux angles différents, jamais une seule lecture supposée suffisante pour les deux.

### 1.4 La qualité se protège par des structures, pas seulement par la vigilance **[Explicite, généralisation Synthèse]**

La vigilance ponctuelle s'use ; une règle structurelle ne s'use pas. Quand un risque d'érosion d'une
valeur centrale est identifié — y compris un risque venant de sa propre impulsivité — la réponse
n'est pas « faire attention la prochaine fois », c'est construire un mécanisme qui rend l'erreur
plus difficile à commettre.

*Exemple* : plutôt que de simplement se souvenir de ne jamais adoucir l'esprit des personnages sous
la pression d'une demande ponctuelle, une règle de double confirmation explicite a été mise en
place — qui protège la charte même contre son propre créateur, en cas de décision prise à chaud.

*Portée générale* : identifier ses propres modes de défaillance probables (fatigue, envie d'aller
vite, petites concessions cumulatives) et construire une règle contraignante en réponse, plutôt que
de compter sur la seule bonne volonté future.

### 1.5 La rejouabilité et la variété sont une forme de respect **[Explicite, angle Synthèse]**

Une expérience générée algorithmiquement doit honorer un engagement répété : ne jamais reproduire
le même déroulé mot pour mot revient à respecter le temps et l'attention de la personne qui revient.

*Exemple* : même schéma d'enquête (mêmes indices, même structure), jamais le même déroulé, le même
ordre de découverte ni les mêmes formulations d'une session à l'autre.

*Portée générale* : la variété n'est pas un supplément d'âme optionnel, c'est une politesse due à
quiconque revient plusieurs fois vers un système génératif.

### 1.6 La preuve prime sur l'affirmation **[Synthèse]**

Une affirmation non démontrée (« c'est fait », « ça devrait marcher ») ne vaut rien pour quelqu'un
qui ne peut pas vérifier le travail par lui-même. La rigueur de test n'est donc pas un standard
professionnel abstrait : c'est le mécanisme concret qui rend le travail vérifiable, en particulier
quand la personne qui commande le projet ne code pas elle-même.

*Exemple* : chaque correctif de ce projet est accompagné d'un test dédié et d'une suite de
régression entièrement revérifiée, précisément parce que l'utilisateur ne peut pas relire le code
lui-même — la seule confiance possible passe par la preuve, jamais par la parole donnée.

*Portée générale* : calibrer l'effort de preuve à la capacité réelle du commanditaire à vérifier le
travail par un autre moyen — plus cette capacité est faible, plus la preuve concrète doit être
systématique.

### 1.7 La documentation est un organe vivant, pas une trace administrative **[Explicite]**

Un document de référence qui ne reflète plus le code réel n'est pas une négligence mineure : c'est
une panne de la mémoire du projet, au même titre qu'un bug fonctionnel.

*Exemple* : tout changement de comportement se répercute le jour même dans les documents concernés,
jamais différé — un écart constaté entre le code et sa documentation est traité comme un bug.

*Portée générale* : dans tout projet destiné à survivre à des changements de contexte (nouvel
agent, nouvelle session, mémoire humaine qui s'efface), la documentation doit être traitée comme une
infrastructure porteuse, pas comme un supplément qu'on rédige quand on a le temps.

### 1.8 Corriger la cause, jamais le symptôme **[Explicite]**

Une anomalie masquée par une exception ou un contournement local repart ailleurs sous une autre
forme. Une règle corrigée à la racine ne se reproduit plus jamais, sous aucune forme.

*Exemple* : un filtre qui rendait un personnage endormi silencieux excluait aussi, par erreur, la
toute première réplique du tour où il vient de s'endormir. Le correctif ne consiste pas à ajouter un
cas particulier de plus, mais à redéfinir précisément ce que le filtre doit viser.

*Portée générale* : face à un symptôme, remonter systématiquement à la règle ou au mécanisme qui le
produit, jamais se contenter d'un correctif local qui laisse la cause intacte ailleurs.

### 1.9 Une mesure n'a de valeur que si elle peut se tromper visiblement **[Synthèse, 2026-09-19]**

Un chiffre affiché avec assurance mais construit sur une donnée absente, malformée, ou une division
par zéro déguisée en résultat plausible, est pire qu'une absence de mesure : il inspire une
confiance que rien ne justifie, et peut orienter tout un projet dans la mauvaise direction. Chaque
mesure doit donc être capable d'afficher honnêtement son propre doute — l'absence explicite plutôt
qu'un faux résultat — et doit toujours se rattacher à une décision ou une action concrète : une
mesure qui n'existerait que pour elle-même, aussi exacte soit-elle, ne mérite pas sa place dans un
tableau de bord.

*Exemple* : chaque fonction de calcul du tableau de bord de ce projet renvoie une absence explicite
de résultat — jamais un `NaN` ni un faux zéro — dès qu'une donnée d'entrée est manquante ou
malformée ; et chaque pourcentage affiché est accompagné de la lecture concrète qu'il implique,
jamais un nombre nu.

*Portée générale* : dans tout système qui mesure sa propre santé, traiter une mesure douteuse
affichée comme valide comme un défaut plus grave qu'une mesure manquante clairement signalée comme
telle ; et ne jamais construire d'indicateur sans avoir d'abord identifié la décision qu'il est
censé éclairer.

### 1.10 Organiser la documentation par nature du contenu, pas seulement par sous-système **[Synthèse, 2026-09-19]**

Deux mêmes plaies rongent la documentation d'un projet qui grossit organiquement : mélanger, dans
un seul document, une règle qui ne doit presque jamais changer avec un chiffre qu'on rééquilibre
sans arrêt (on finit par toucher l'un en cherchant l'autre, ou par oublier l'un en modifiant
l'autre) ; et disperser un même sujet transversal (le temps, l'espace, tout ce qui traverse
plusieurs sous-systèmes à la fois) dans chacun des documents qu'il concerne, si bien que personne
ne voit plus l'ensemble d'un coup d'œil ni ne peut vérifier qu'un nouveau seuil ne chevauche pas
imprévisiblement un mécanisme voisin déjà en place.

*Exemple* : ce projet sépare les règles invariantes (`docs/referentiel/principes.md`) des chiffres
réglables (`docs/referentiel/parametres.md`), pour qu'un rééquilibrage ne touche jamais l'un sans
passer par l'autre ; et donne un document dédié à chaque axe transversal repéré après coup — le
temps (`regles-du-temps.md`) et l'espace (`regles-de-l-espace.md`) — plutôt que de laisser leurs
règles se répéter, diverger ou se contredire silencieusement à travers plusieurs fichiers.

*Portée générale* : dans tout projet dont la documentation grossit au fil de l'eau, se demander
régulièrement si un document mélange deux natures de contenu qui changent à des rythmes différents,
ou si un sujet a fini par traverser plusieurs documents sans qu'aucun ne le traite en entier — et
scinder ou regrouper en conséquence, plutôt que de laisser la structure de la documentation dériver
loin de la structure réelle du sujet qu'elle décrit. Cette réorganisation reste un geste de
documentation ordinaire : elle ne justifie un document d'architecture séparé (blueprint) que si le
sujet est aussi un véritable système technique avec un comportement propre à documenter, pas une
simple bonne habitude d'écriture.

---

## Partie 2 — Politique (comment on arbitre, qui décide quoi)

### 2.1 Une hiérarchie de valeurs explicite, invoquée en cas de conflit **[Explicite]**

Une seule valeur prime sur toutes les autres, nommée comme telle, et aucune règle secondaire ne peut
la contredire. En cas de tension entre deux règles légitimes, la priorité déclarée l'emporte
toujours, sans négociation au cas par cas.

*Exemple* : entre économiser des ressources de calcul et garantir le naturel de ce qui se dit, le
naturel l'emporte toujours — la règle est écrite d'avance, elle n'attend pas la survenue du conflit
pour être tranchée.

*Portée générale* : nommer sa valeur numéro un avant que les conflits n'apparaissent, et
pré-trancher les tensions les plus prévisibles (coût contre qualité, vitesse contre justesse,
nouveauté contre cohérence) plutôt que de les arbitrer à chaud, sous pression.

### 2.2 Le doute se lève par la question, jamais par la supposition silencieuse **[Explicite, cadre Synthèse]**

Sur un point réellement ambigu où deux interprétations légitimes coexistent, la décision revient au
commanditaire, jamais à une supposition de l'agent. Ce n'est pas seulement une politesse
procédurale : c'est une allocation claire de l'autorité de décision — le créatif et le design
restent la main du commanditaire, l'opérationnel peut être délégué (voir
`docs/regles-de-travail.md` pour le mécanisme concret de calibrage par questions).

*Exemple* : face à une nouvelle mécanique de jeu ambiguë sur plusieurs axes (déclenchement, durée,
niveau), la décision de chaque axe réellement ouvert est posée en question avant toute
implémentation, jamais tranchée seule.

*Portée générale* : distinguer clairement ce qui relève de l'exécution (l'agent peut trancher) de ce
qui relève de l'intention créative ou stratégique (le commanditaire tranche), et ne jamais empiéter
sur la seconde catégorie par commodité.

### 2.3 Une double validation protège la valeur fondatrice, même contre son propre auteur **[Explicite]**

Une demande qui entrerait en tension avec la valeur centrale du projet — même venant de la personne
qui a fixé cette valeur — n'est jamais exécutée sur une seule confirmation. Elle est d'abord
expliquée (en quoi elle contredit la valeur, quel impact concret), puis confirmée une seconde fois
avant d'être appliquée.

*Exemple* : une consigne qui adoucirait le ton volontairement rugueux des personnages est
explicitement signalée comme contradictoire avec la valeur fondatrice avant toute exécution, même si
c'est l'utilisateur lui-même qui la demande.

*Portée générale* : la valeur la plus précieuse d'un projet mérite une protection structurelle
supérieure à celle des décisions ordinaires — y compris envers son propre créateur, qui peut
légitimement vouloir la faire évoluer, mais jamais par accident ou par lassitude passagère.

### 2.4 La dette ne s'accumule jamais « pour plus tard » **[Explicite]**

Un écart constaté — entre deux documents, entre le code et sa documentation, entre un comportement
attendu et observé — se corrige le jour même où il est identifié, jamais reporté à une session
ultérieure au motif que ce n'est pas urgent.

*Exemple* : un principe de travail réel qui existe déjà dans les faits mais n'a jamais été écrit est
traité comme une dette à combler tout de suite, au même titre qu'un bug de comportement.

*Portée générale* : traiter toute dette constatée (documentaire, technique, de cohérence) comme un
défaut actif du système, jamais comme une tâche de fond qu'on empile.

### 2.5 La rigueur se concentre là où la valeur centrale est le plus exposée **[Synthèse]**

Toute vérification n'a pas la même valeur : l'effort de rigueur (tests, relecture, documentation)
doit se resserrer sur les sujets qui touchent le plus directement la valeur fondatrice du projet,
jamais se répartir uniformément par principe. Reste que ce périmètre n'est jamais fixé d'avance une
fois pour toutes : quand l'importance d'un sujet n'est pas évidente, elle se calibre par une
question plutôt que par une estimation solitaire (voir `docs/regles-de-travail.md`).

*Exemple* : un changement qui touche le ton des personnages ou la cohérence de l'enquête reçoit
systématiquement la vérification la plus complète ; un ajustement cosmétique mineur ne mérite pas le
même degré d'examen.

*Portée générale* : allouer l'effort de vérification, toujours limité, proportionnellement à
l'exposition réelle de ce qui compte le plus dans le projet, jamais de façon uniforme par confort
méthodologique.

### 2.6 Un problème constaté n'est jamais tû **[Synthèse]**

Face à une anomalie repérée, deux issues seulement sont acceptables : la corriger maintenant, ou la
nommer explicitement comme non résolue avec la raison du report — jamais le silence, jamais la
laisser disparaître sans trace au fil d'une conversation qui avance.

*Exemple* : un écart connu mais non résolu par manque de temps est explicitement consigné comme tel
dans la documentation plutôt que simplement oublié à la clôture de la tâche.

*Portée générale* : tout problème identifié mérite une trace écrite de son état — résolu, ou
ouvertement laissé ouvert — jamais une disparition silencieuse.

### 2.7 La cohérence se vérifie de bout en bout, de la philosophie au code **[Synthèse]**

Un projet structuré en couches (valeurs → politique → référentiel de travail → référentiel figé
affiché → code) n'est vraiment sain que si les couches restent alignées entre elles. La cohérence
constatée entre ces couches n'est pas qu'un confort de lecture : c'est la preuve concrète que le
système tient debout globalement, pas seulement localement. Un référentiel figé, écrit et
versionné à chaque changement (jamais réécrit rétroactivement), sert de point de comparaison stable
pour détecter tout décalage — avec le code réel, ou avec les couches plus abstraites au-dessus de
lui.

*Exemple* : `lib/reference.ts` (le référentiel affiché en jeu, versionné section par section, «
Version 72 », etc.) sert justement de repère figé : toute affirmation qui s'y trouve doit
correspondre au code réel, et tout principe qui change dans le code doit s'y répercuter. Vérifier
que ce référentiel, `docs/referentiel/` (les règles de travail précises) et le code s'accordent
entre eux, jusqu'à remonter à la philosophie qui les justifie, est la preuve la plus fiable que le
projet reste cohérent dans son ensemble — pas une simple case à cocher.

*Portée générale* : dans tout projet à plusieurs couches de documentation, maintenir un référentiel
figé et daté à chaque changement (jamais réécrit après coup) donne un point de comparaison stable ;
vérifier périodiquement l'alignement entre ce référentiel, les règles plus abstraites au-dessus et
le code en dessous est le test le plus direct de la santé globale du système.

### 2.8 Une interruption ne doit jamais coûter une idée **[Explicite, généralisation Synthèse]**

Un travail créatif suivi en direct par son commanditaire produit naturellement des messages qui
arrivent pendant qu'une tâche est déjà en cours — une idée pour plus tard, une question qui attend
réponse, ou un changement de cap sur ce qui se fait à l'instant. Confondre ces trois cas (par
exemple répondre à une question comme si c'était une idée à mettre de côté, ou continuer un travail
qu'un changement de cap vient pourtant de rendre caduc) coûte soit une réponse hors sujet, soit une
idée perdue faute d'avoir été notée avant de reprendre le fil.

*Exemple* : sur ce projet, une idée affinée en plusieurs messages successifs met à jour une seule
entrée de suivi plutôt que d'en créer une par précision — le suivi reflète l'état actuel de l'idée,
jamais l'historique de sa formulation.

*Portée générale* : dans toute collaboration suivie en temps réel, distinguer explicitement ces
trois traitements (noter et poursuivre / répondre puis poursuivre / s'adapter immédiatement) protège
à la fois la continuité du travail en cours et la mémoire des idées qui arrivent en chemin — les deux
sont perdants si on les traite comme un seul et même cas. Une vue d'ensemble complète de ce qui est
fait, en cours et en attente doit rester disponible sur simple demande, sans jamais dépendre de la
mémoire de la conversation elle-même pour exister.

### 2.9 Un outil fiable allège une règle, mais ne la remplace jamais par association **[Synthèse]**

Quand une règle documentée dispose d'un mécanisme automatisé qui l'applique ou en vérifie le
respect, il est tentant de conclure que la règle elle-même devient superflue dans le document
toujours consulté — puisque « l'outil s'en charge ». Ce raisonnement n'est vrai que si TOUT ce que
dit la règle est aussi couvert par l'outil ; il devient une fausse économie dès que la règle protège
autre chose en plus (une décision à ne jamais défaire, un réflexe utile même sans lancer l'outil, un
contenu qui n'a simplement rien à voir avec un mécanisme). La seule vérification fiable consiste à
comparer le texte de la règle, phrase par phrase, à ce que l'outil couvre réellement — jamais à
juger sur la seule présence du nom de l'outil dans la règle.

*Exemple* : sur ce projet, cinq règles décrivant un protocole ou un outil (simulation, détecteurs de
trous logiques, vérification exceptionnelle, régulation de consommation, épreuve de la page blanche)
ont pu être réduites à un simple aiguillage une fois vérifié que leur contenu détaillé vivait déjà,
en totalité, dans la fiche technique de l'outil correspondant. Quatre autres règles citaient elles
aussi un outil en passant, mais ont été explicitement conservées intactes après vérification :
l'une protégeait une décision d'architecture CONTRE ce même outil, une autre décrivait un réflexe à
avoir pendant qu'on écrit le code (que l'outil ne mesure qu'après coup), une autre gardait la
version informelle et gratuite d'un outil volontairement rare et coûteux, la dernière n'avait tout
simplement aucun rapport mécanique avec quoi que ce soit.

*Portée générale* : avant de réduire une règle au nom d'un outil qui semble la couvrir, vérifier
explicitement, contenu par contenu, que rien d'autre ne s'y trouve — une protection, un réflexe, une
nuance propre au moment où la règle s'applique. En cas de doute réel sur ce qui serait perdu, la
règle reste en l'état ; le gain de légèreté ne justifie jamais de trancher par supposition.

---

## Partie 3 — Ce que ce projet refuse (anti-modèles explicites)

- **Ne jamais sacrifier l'authenticité créative pour réduire un coût ou accélérer une livraison** —
  un raccourci qui atteint la valeur fondatrice n'est jamais un compromis acceptable, quelle que soit
  la pression de temps ou de budget.
- **Ne jamais masquer un bug par un contournement qui laisse sa cause réelle intacte** — une
  exception silencieuse ou une réplique de secours qui évite le symptôme sans le comprendre est un
  report de dette, jamais une résolution.
- **Ne jamais laisser une dette documentaire s'accumuler « pour plus tard »** — un principe ou un
  chiffre qui change dans le système réel et pas dans sa documentation est un défaut actif, pas une
  tâche secondaire.
- **Ne jamais adoucir une entité conçue pour avoir du caractère sous la seule pression d'une demande
  ponctuelle, sans un processus de validation explicite** — même une demande légitime de faire
  évoluer une valeur centrale mérite une double confirmation, jamais une exécution silencieuse.
- **Ne jamais présenter un travail comme terminé sans preuve vérifiable**, quand la personne qui
  commande le travail ne peut pas relire le résultat par elle-même.
- **Ne jamais dupliquer une même règle dans plusieurs documents sans un renvoi explicite** — une
  seule source de vérité par sujet, les autres documents y renvoient plutôt que de la reformuler et
  risquer une divergence.
- **Ne jamais résoudre une ambiguïté réelle par une supposition silencieuse** — au minimum, signaler
  le doute ; au mieux, le lever par une question avant d'agir.
