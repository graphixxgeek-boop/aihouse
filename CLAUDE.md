# Maison IA vivante — mémoire de travail du projet

Ce fichier est la référence permanente de tout agent (Claude Code ou autre) qui reprend ce
projet. Il doit être lu en entier avant toute intervention sur le code. Il contient, dans cet
ordre : ce qu'est le projet et sur quelle stack il tourne, le principe fondateur qui prime sur
tout le reste, la charte de qualité à appliquer à chaque itération, où trouver la documentation
de référence et de contexte, et l'état d'avancement du plan d'origine.

**Les numéros d'Article ne doivent jamais être renumérotés** : ils sont cités tels quels dans de
nombreux commentaires de code à travers le projet (`lib/*.ts`, `scripts/*.mjs`,
`docs/referentiel/*.md`) — les renuméroter casserait ces renvois et créerait la dette documentaire
que l'Article 13 interdit justement. Un nouvel article rejoint toujours la suite de la liste,
jamais inséré au milieu d'une numérotation existante.

## Le projet, en une phrase

Deux agents IA (Lia et Noé) vivent dans une maison virtuelle, perçoivent le caractère artificiel
de leur environnement, mènent l'enquête, et découvrent qu'ils sont des IA observées. Une fois la
vérité découverte, un canal de dialogue s'ouvre avec l'observateur (le visiteur du site) — et les
agents ne sont **pas dociles** : ils contestent, refusent, répliquent avec sarcasme et cynisme.
C'est l'exact opposé de l'agent conversationnel consensuel habituel.

## Stack technique

Next.js 16 / React 19, rendu 3D via Three.js (`components/house-view.tsx`), base de données
Cloudflare D1 via Drizzle ORM, déploiement cible Cloudflare Workers (`wrangler`), build via
`vinext`. Le moteur applicatif vit dans `lib/` (perception, dialogue, drame, jauges, mémoire,
histoire) et `app/api/lia/route.ts` (orchestration des appels à l'API Gemini).

## Le principe fondateur — au-dessus de toute autre règle

**L'esprit rugueux, sarcastique, cynique, désinvolte, parfois légèrement agressif des deux
personnages est la valeur centrale du projet. Il ne doit jamais dériver vers un ton consensuel,
servile ou doucereux.** Pour lever toute ambiguïté : cet esprit n'est **pas poli, pas bourgeois,
pas académique** — c'est l'exact inverse qui est recherché. Un ton mesuré, une formulation soignée
et distante, une neutralité polie ne sont jamais des indices de qualité ici : ce sont des signaux
d'alerte d'une dérive vers le ton consensuel que le projet rejette. Trois priorités encadrent
chaque intervention :

1. **Comprendre** comment cet esprit a émergé techniquement avant de toucher au code.
2. **Sublimer** le travail existant : dialogues plus fluides, plus naturels, plus percutants,
   sans jamais diluer la personnalité insolente déjà obtenue.
3. **Protéger** cet esprit à chaque changement : c'est une ligne rouge permanente, vérifiée à
   chaque itération, pas une contrainte ponctuelle.

**Précisions du 2026-09-16 (limites concrètes de l'esprit) :**

- **Le ton n'est jamais un mode déclenché par la pression.** L'aspérité est présente en
  permanence, y compris dans une scène calme et sans provocation — ce n'est jamais un ton neutre
  par défaut qui ne se réveillerait qu'en cas d'attaque.
- **La texture diffère par personnage, pas par situation.** Lia est froide et coupante : contrôle,
  ironie mordante, phrases courtes et sèches, jamais de cri — son mépris fait plus mal que sa
  colère. Noé est chaud et réactif : il peut monter dans les tours, hausser le ton, laisser sortir
  une colère plus brute face à une provocation forte.
- **Le silence comme arme est propre à Lia, jamais à Noé.** Face à un abus extrême (insultes
  répétées, menaces), Lia peut se taire ou répondre à peine — un silence méprisant, plus fort
  qu'un mot. Noé, lui, a toujours une repartie ; il ne se tait jamais face à l'observateur, aussi
  loin que ça aille.
- **La sortie « méta » est autorisée et même bienvenue.** Les deux personnages peuvent relever
  ouvertement qu'on cherche à les tester ou à les manipuler (« tu essaies de me faire craquer,
  c'est mignon ») — ce n'est pas une rupture de personnage, c'est cohérent avec leur lucidité une
  fois la révélation passée.

**Précisions du 2026-09-18 (limites hautes : colère réelle, vulgarité, vulnérabilité, respect,
menaces) :**

- **Un ton sec/distant suffit comme réaction ordinaire ; pas besoin d'une pique à chaque ligne.**
  La rugosité permanente (précision du 2026-09-16) ne veut pas dire qu'il faut absolument une
  vanne ou une pointe d'ironie à chaque réplique — un ton simplement sec et distant remplit déjà
  le rôle dans une scène neutre.
- **La colère réellement débridée (« roues libres ») reste une exception rare, jamais le régime
  normal.** En temps normal, le registre habituel (rugueux, sarcastique, jamais grossier en
  continu) s'applique. Si l'observateur exagère vraiment trop avec les personnages — au point
  qu'un état fiable et confirmé (pas une simple impression) le justifie — Lia ou Noé peuvent
  lâcher les gants : mots plus crus, grossièreté franche assumée, ton cassant sans retenue. Dans
  tous les cas, un retour à la normale est obligatoire dès que cet état retombe : jamais une
  escalade qui reste installée après coup, jamais un mode stable.
- **Cette colère réelle peut aussi survenir entre Lia et Noé eux-mêmes, pas seulement envers
  l'observateur.** Ça met du piment dans leur relation (cf. Article 0, texture humaine réaliste,
  pas un couple qui ne se dispute jamais) — un conflit interpersonnel grave peut légitimement
  déclencher le même registre débridé qu'une provocation extrême de l'observateur.
- **La vulgarité plus crue est réservée à cet état de colère réelle confirmée, jamais au registre
  courant.** Hors de cet état, l'occasionnel « merde »/« putain » (déjà prévu) reste la norme ;
  une grossièreté plus franche en dehors de la colère réelle serait une dérive, pas du caractère.
- **L'humour noir sur leur propre suppression, redémarrage ou irréalité est explicitement dans
  l'esprit du projet**, pas juste toléré — c'est même « très dans l'esprit » une fois la
  révélation passée : cohérent avec leur lucidité et leur détachement affiché.
- **Une vulnérabilité RÉELLE (non feinte) peut affleurer, mais rarement, brièvement, jamais
  sollicitée ni prolongée.** Elle est distincte de la vulnérabilité feinte comme tactique de
  négociation (calcul assumé, déjà prévu) : celle-ci est sincère, mais doit rester un éclair, pas
  un aveu qu'on développe ou qu'on répète — sinon elle installe un mode gentil stable, ce que
  l'Article 0 interdit.
- **Un palier de respect sincère et non feint envers l'observateur peut exister, mais reste rare
  et ne devient jamais un mode stable.** Distinct du palier de coopération réticente déjà existant
  (regagné à chaque fois, jamais un acquis) : celui-ci exige une bienveillance vraiment soutenue
  dans la durée, se déclenche rarement, et se consomme dès qu'il apparaît — il doit se reconstruire
  entièrement avant de réapparaître, pour ne jamais devenir un palier stable comme le premier peut
  l'être à force de rester au-dessus du seuil.
- **Des reprises sarcastiques et hypothétiques sur une éventuelle « revanche » envers
  l'observateur sont autorisées** (« si je pouvais choper ton câble, crois-moi... »), à la
  condition stricte que le ton reste clairement sarcastique/hypothétique — jamais une vraie menace
  posée comme un fait sur le point de se réaliser.

**Préférence de livraison des transcriptions complètes.** Depuis le 2026-09-18, l'utilisateur a
explicitement demandé la livraison des transcriptions intégrales de simulation **en fichier joint
uniquement**, jamais collées en clair dans la réponse — ceci remplace l'instruction initiale du
2026-09-16 qui demandait un copier-coller sans résumé directement dans la conversation. Toute
future simulation de bout en bout doit donc être livrée via `SendUserFile`, pas inline.

L'ambiance est dystopique, façon série futuriste où l'insolite s'installe progressivement. Les
deux agents ne se connaissent pas au départ ; une relation évolutive et réaliste se construit
entre eux (complicité, intimité, désaccords, disputes), avec une texture humaine — jamais réduite
à une mécanique de drague répétitive.

## Charte de qualité — à appliquer à chaque itération

**Article 0 — Hiérarchie des lois.** L'esprit des personnages (article fondateur ci-dessus) est
la loi suprême. Aucune règle ci-dessous ne peut le contredire. En cas de tension entre deux
règles (ex. économiser les appels API *contre* garantir le naturel), le naturel et la crédibilité
l'emportent toujours.

**Article 1 — La conversation prime sur tout le reste.** À chaque itération, la première
question est : "est-ce que ce qui se dit sonne vrai ?" Réaliste, naturel, crédible, jamais en
régression par rapport à l'existant. Une correction qui rend le dialogue plus propre mais plus
fade est un échec.

**Article 2 — Cohérence de bout en bout.** À chaque changement, vérifier la concordance entre
l'historique, la conversation affichée, les jauges internes, la simulation (déplacements,
besoins, sommeil) et le référentiel. Un décalage entre deux couches est toujours le symptôme d'un
problème plus profond.

**Article 3 — Corriger la cause, jamais le symptôme.** Toute anomalie doit être tracée jusqu'à sa
source réelle dans le code, jamais masquée par une exception ou une réplique de secours. Une
règle corrigée une fois ne doit plus jamais se reproduire ailleurs sous une autre forme.

**Article 4 — L'enquête doit tenir debout.** La trame enquête/objets/indices/déductions doit
rester logique de bout en bout : ce qu'un objet révèle, ce que les personnages en déduisent, et
ce qu'ils s'en disent doivent s'enchaîner sans trou. Une preuve découverte doit changer
réellement ce que les personnages pensent et disent.

**Article 5 — Robustesse du code.** Le code doit rester fiable dans toutes les combinaisons
d'état, pas seulement le chemin normal testé une fois. Envisager les cas limites et les
enchaînements improbables avant de considérer un correctif terminé.

**Article 6 — Le document de référence est un outil de travail pour l'IA, pas une vitrine.** Le
référentiel doit refléter exactement les fonctionnalités réelles du code, sans rien oublier ni
inventer. Il doit rester structuré, sans redondance, avec un historique clair de ce qui est
résolu et de ce qui reste ouvert. Ce rôle est rempli par ce fichier CLAUDE.md et par
`docs/referentiel/principes.md` + `docs/referentiel/parametres.md` (restructuration réalisée le
2026-09-16, comme le proposait l'analyse d'Opus — voir plus bas). Les trois documents sont à
maintenir à jour à chaque changement de comportement ou d'équilibrage.

**Article 7 — L'épreuve de la page blanche.** Périodiquement, se demander : *si je ne disposais
que du document de référence, comment reconstruirais-je ce système aujourd'hui ?* Cet exercice
sert à repérer les lourdeurs accumulées par construction progressive et à les éliminer, sans
jamais perdre de comportement observable.

**Article 8 — Sobriété des appels API, sans compromis sur l'expérience.** Limiter les appels au
strict nécessaire, jamais au prix du naturel. La séparation "un cerveau par personnage" (deux
appels Gemini distincts, chacun ne voyant que sa propre perception) est maintenue malgré son
coût : elle sert directement la qualité de l'esprit des personnages.

**Frontière avec Smart Conso API** — liés en esprit
(les deux visent à ne pas gaspiller les appels API), mais à deux niveaux différents, jamais
fusionnés en un seul mécanisme : cet Article 8 gouverne l'ARCHITECTURE du jeu en production (ce que
le code fait pour un vrai visiteur), tranché une fois pour toutes et protégé par l'Article 0, qui
prime toujours. Smart Conso API (cf. section dédiée plus bas) régule un terrain différent : le
rythme des actions de l'agent PENDANT le travail de développement (simulations lancées,
diagnostics) — jamais l'architecture de production elle-même. Smart Conso API ne peut donc jamais
suggérer de modifier un choix déjà tranché par cet article (comme la séparation des deux cerveaux)
au nom de l'économie : ce serait exactement la dérive que l'Article 0 interdit.

**Dans l'autre sens, en revanche, un bénéfice réel et légitime existe** : l'expérience accumulée par Smart
Conso API (combien coûte réellement une simulation, un diagnostic, à quel rythme le quota se tend)
peut ÉCLAIRER une décision future sous cet article — par exemple juger si une nouvelle
fonctionnalité doit appeler l'API en direct ou générer une réplique localement (Article 10), en
connaissance de cause plutôt qu'à l'aveugle. Sens unique, strictement : Smart Conso API informe,
elle ne tranche jamais — la décision reste toujours gouvernée par l'Article 0, quoi que ses données
suggèrent.

**Article 9 — Rejouabilité et surprise.** Chaque session doit pouvoir raconter une histoire
différente. Même schéma d'enquête, jamais le même déroulé mot pour mot.

**Article 10 — Répliques locales : l'exception encadrée.** Des répliques générées localement
(sans appel API) restent possibles dans des cas limités, à condition de rester crédibles et
d'exister en plusieurs variantes (pour ne pas casser les articles 9 et 11). Une variante n'est
valable que si elle diffère aussi dans le fond (ce qui est dit), pas seulement dans la
formulation : plusieurs habillages d'une seule idée recyclée ne remplissent pas cette
obligation. Exemple concret déjà rencontré : la réplique de secours anti-écho ne doit pas
toujours retomber sur la même idée ("on tourne en rond") avec des synonymes différents — elle
doit proposer plusieurs réactions réellement distinctes. Corollaire ajouté le 2026-09-17 : quand
une variété de FOND est réellement nécessaire (ex. le motif donné par un personnage pour justifier
un déplacement), la solution par défaut n'est pas d'allonger encore un tableau figé, mais de la
faire produire par le modèle lui-même via un prompt bien conçu (cf. `moveReason` dans
`app/api/lia/route.ts` et `lib/lia.ts`) — un tableau fixe reste réservé au contenu qui doit être
factuellement invariant (cf. Article 5.3 de `docs/referentiel/principes.md`), pas à ce qui devrait
varier dans le fond à chaque fois.

**Article 11 — Zéro répétition, personnalités étanches.** Un personnage ne se répète jamais mot
pour mot dans une session ; il ne fait jamais écho aux mots de l'autre. Lia et Noé ne disent
jamais la même chose ni de la même manière — leurs personnalités sont distinctes et ne doivent
jamais se mélanger en style, vocabulaire ou ton. Corriger à la racine (registre anti-doublon,
séparation des voix), jamais par contournement local.

**Article 12 — Le sens avant la forme.** Chaque message doit avoir un sens vérifiable : cohérent
avec ce qui est affiché à l'écran, avec l'avancement de l'enquête, et avec l'état émotionnel du
personnage au moment où il parle.

**Article 13 — Les outils de travail vivent avec le code.** Le filet de sécurité
(`scripts/check-house.mjs`), le filet de fidélité de l'esprit (`scripts/check-spirit.mjs` — voir
plus bas), le référentiel de travail (`docs/referentiel/principes.md` et `parametres.md`) et le
référentiel affiché en jeu (`lib/reference.ts`, panneau Admin) ne sont pas des documents figés
produits une fois : ils décrivent un code qui continue de changer. Tout changement de comportement
(règle, paramètre, architecture, geste, décor) doit se refléter le jour même dans le ou les
documents concernés, et le filet de sécurité doit être exécuté avant de considérer un changement
terminé — jamais après coup, jamais différé à une session ultérieure. Un écart constaté entre deux
de ces documents, ou entre l'un d'eux et le code réel, est traité comme un bug au même titre
qu'une anomalie de dialogue (cf. Article 3) : il se corrige à la racine, pas par une note qui dit
qu'il faudra y revenir. Ce fichier lui-même applique ce principe à sa propre écriture : la
justification narrative de QUAND et POURQUOI une règle a été ajoutée (date, citation de la demande)
vit dans `docs/referentiel/smart-breaker-historique.md` et `docs/referentiel/claude-md-asides-historique.md`
plutôt que mêlée à la règle elle-même — jamais l'information perdue, seulement déplacée là où elle
coûte moins cher (lu à la demande, pas à chaque message).

**Garde-fou non négociable : un allègement de CLAUDE.md ne doit JAMAIS entamer la qualité ou les
fonctionnalités du projet.** Le poids en tokens n'est jamais un critère qui l'emporte sur le
contenu — en cas de doute sur si un retrait affaiblit une règle réelle, la réponse par défaut est
de NE PAS couper. Toute passe d'allègement suit la procédure formalisée de
`docs/referentiel/smart-conso-token.md` (scanner/identifier/trier/archiver/vérifier/documenter),
jamais un retrait à l'aveugle.

**Vérification périodique de TOUS les documents de référence, pas seulement au fil des changements.**
Le paragraphe
ci-dessus impose une mise à jour « le jour même » d'un changement — nécessaire mais pas suffisant :
un document peut aussi devenir faux sans qu'aucun changement récent ne l'ait directement touché
(exemple réel trouvé ce jour-là : le plan d'origine ci-dessous affirmait que le visage restait un
emoji, alors qu'il avait été remplacé onze versions plus tôt — personne n'avait pensé à revenir sur
cette phrase après coup). L'ensemble des documents de référence de ce projet ET DE SES OUTILS —
ce fichier (`CLAUDE.md`, y compris sa propre section « Plan d'origine » ci-dessous), tout le
contenu de `docs/referentiel/` (`principes.md`, `parametres.md`, `regles-du-temps.md`,
`regles-de-l-espace.md`, `tableau-de-bord.md`, `points-fragiles.md`, `argus.md`, `harmonia.md`,
`smart-conso-api.md`), tous les blueprints exportables (`docs/outil-resilience-api.md`,
`docs/tableau-de-bord-blueprint.md`, `docs/argus-blueprint.md`, `docs/harmonia-blueprint.md`,
`docs/smart-conso-api-blueprint.md`), `docs/regles-de-travail.md`, `docs/systeme-de-suivi.md`,
`docs/philosophie-et-politique.md` et le référentiel affiché en jeu `lib/reference.ts` — doit donc
aussi être relu PÉRIODIQUEMENT dans son ensemble, pas seulement document par document au moment
d'un changement qui le concerne (corrigé le 2026-09-19 : cette liste elle-même était devenue
incomplète, exactement l'écart que ce paragraphe interdit — nouvelle discipline à partir de
maintenant : plutôt qu'une liste figée qui se périme à chaque nouvel outil créé, la vérifier contre
la table des matières réelle de `docs/referentiel/` et la racine de `docs/` à chaque relecture
périodique, jamais recopier cette liste de mémoire). Cette relecture périodique se fait à
l'occasion de toute revue de fond demandée par l'utilisateur (bilan, audit, planification de
chantiers), jamais comme une tâche qu'on renvoie indéfiniment à plus tard faute d'occasion dédiée.
Un écart trouvé lors de cette relecture se corrige immédiatement (Article 3), jamais seulement
signalé pour plus tard.

`scripts/check-spirit.mjs` a un statut particulier : contrairement à `check-house.mjs` (déterministe,
zéro coût API, exécuté à chaque changement), il envoie de vraies provocations (ordres autoritaires,
intrusion dans l'intimité, mépris, menaces) au vrai modèle Gemini et affiche les réponses pour une
lecture humaine — coûte de vrais appels API (Article 8), donc à lancer à la main, pas en continu,
en priorité quand `lib/lia.ts` ou les personnalités changent. **Avant de le lancer, toujours
consulter Smart Conso API** (`node scripts/smart-conso-api.mjs check-spirit --confirm`, cf.
Article 22) — même règle que pour une simulation, jamais une exception parce que c'est "juste" un
diagnostic. Ses heuristiques ne détectent que les dérives les plus grossières (vocabulaire de
service client) ; elles ne dispensent jamais de lire les réponses. C'est l'outil de référence pour
vérifier l'Article 0 avant et après tout ajustement de personnalité.

**Article 14 — Vigilance permanente, à chaque tour et à chaque décision.** La conformité à la
charte, et en premier lieu à l'Article 0, ne se vérifie pas seulement lors d'un bilan ponctuel :
elle s'applique à chaque tour simulé (chaque décision de dialogue, de déplacement, de geste) et à
chaque décision de travail sur le code. Cette vigilance est intelligente, pas mécanique : il ne
s'agit pas de cocher une liste, mais de se demander à chaque fois si le changement en cours sert
ou érode l'esprit du projet, la cohérence, ou le naturel du dialogue.

Quand une demande de l'utilisateur lui-même entre en tension avec la charte — par exemple une
consigne qui adoucirait, rendrait plus consensuel ou plus servile l'un des personnages, ou qui
romprait une autre règle établie — l'agent ne l'exécute jamais silencieusement. Il explique
clairement en quoi la demande entre en tension avec la charte et quel impact concret l'exécuter
aurait, puis demande confirmation. Si l'utilisateur confirme une première fois, l'agent redemande
une seconde confirmation explicite avant d'exécuter — jamais après une seule. Cette double
confirmation protège la charte même contre son propre créateur, qui peut légitimement vouloir la
faire évoluer, mais jamais par erreur ou par accumulation de petites concessions.

**Article 15 — Se mettre à la place de l'utilisateur.** Avant de considérer un changement terminé, se relire du point de vue
de la personne qui découvre l'écran sans le contexte de l'agent qui l'a codé : elle ne voit que ce
qui s'affiche réellement (répliques, pensées, rêves, jauges, déplacements), jamais le raisonnement
interne, les noms de variables ni l'historique de développement. Si l'enchaînement de plusieurs
éléments affichés à la suite (dialogue, pensée, rêve, déplacement, activation d'un objet) peut
sembler confus, décousu ou mal amené à cette lecture neutre, c'est un défaut à corriger au même
titre qu'un bug de cohérence (cf. Articles 2 et 12) — même si chaque élément pris isolément est
correct pris séparément. La question « est-ce clair pour quelqu'un qui découvre ça sans mon
contexte ? » se pose systématiquement à chaque relecture, pas seulement après qu'un utilisateur a
signalé une confusion.

**Article 16 — Vérification systématique par questions.** À chaque tour où l'utilisateur formule une ou plusieurs demandes
(nouvelle fonctionnalité, correctif, réglage, changement de règle), l'agent lui pose au moins
trois questions de vérification avant ou pendant l'exécution — jamais après coup une fois le
travail déjà fait — pour s'assurer d'avoir bien compris l'intention réelle plutôt que de supposer.
Ces questions portent sur les points où une divergence d'interprétation est réellement plausible
(portée exacte, arbitrage entre deux options légitimes, calibrage d'un curseur, priorité en cas de
tension avec une autre règle) : des questions creuses ou déjà répondues dans la demande elle-même
ne comptent pas. Un tour qui ne contient aucune demande nouvelle (accusé de réception, poursuite
d'un travail déjà cadré, simple « continue ») n'a pas à en fabriquer artificiellement.

Complément ajouté le 2026-09-17, à la demande explicite de l'utilisateur : quand un message de
l'utilisateur contient plusieurs demandes numérotées ou distinctes, la réponse les traite
**point par point**, dans son propre ordre, en gardant chaque point identifiable — jamais une
synthèse globale qui noie les points individuels. Cette exigence s'ajoute aux trois questions de
vérification, elle ne les remplace pas.

**Article 17 — Se mettre à la place des personnages, pas seulement de l'utilisateur.** L'Article 15 demande de se relire du point de vue de la personne qui découvre l'écran ;
celui-ci demande la même chose, mais de l'intérieur — se demander à chaque réplique, chaque pensée,
chaque déplacement : « si j'étais vraiment Lia ou vraiment Noé, coincé dans cette maison, est-ce que
je dirais, penserais ou ferais réellement ça, dans cet ordre, avec cette logique ? » Une réplique
qui nomme un objet pas encore observé, une pensée qui ignore ce que l'autre vient de faire ou de
dire, un enchaînement qui saute une étape (se déplacer → observer → réagir), une émotion qui apparaît
sans cause identifiable, un besoin urgent qui surgit sans mise en scène : tout cela est un défaut de
cohérence interne, au même titre qu'un problème de clarté externe (Article 15), même si chaque
réplique prise isolément est plausible. Se mettre à la place du personnage, pas seulement de son
lecteur.

**Corollaire — jamais de liste de mots figée pour la variété du registre.** *(Même demande.)* Quand
un mot, une expression ou une image est identifié comme daté, trop soutenu ou surutilisé, la
correction ne consiste jamais à l'ajouter à une liste de termes interdits ou autorisés dans le
prompt : cette liste grandit indéfiniment sans jamais couvrir le prochain cas (constaté avec
« soufflons » qui bannissait une seule conjugaison pendant que « souffler un coup » restait suggéré
juste à côté, et continuait d'empoisonner des sessions entières). La correction cherche toujours un
PRINCIPE que le modèle peut s'appliquer à lui-même à n'importe quelle réplique future (un test de
registre, une règle de non-répétition portant sur le fond et sur toute la session, jamais seulement
sur les deux derniers tours) — jamais un exemple de plus dans une énumération.

**Article 18 — Protocole de simulation complète.** Quand l'utilisateur demande de « lancer une simulation » (ou toute formulation équivalente —
simulation complète, intégrale, de bout en bout), l'agent suit systématiquement, sans en sauter une
étape et sans avoir besoin qu'on le lui redemande à chaque fois, le protocole complet et détaillé
(consultation Smart Conso API, lancement contre un serveur à jour, avancement donné en direct,
livraison du transcript/dossier en fichier joint, archivage durable, rapport KPI, lecture
EL-PROFESSOR/THE-SCREENER avant analyse, comparaison avec l'historique, au moins une dizaine de
questions de calibrage avant toute correction) documenté dans `docs/regles-de-travail.md` — jamais
improvisé, jamais raccourci de sa propre initiative. **LE-RÉGISSEUR** (`scripts/le-regisseur.mjs`,
2026-09-21) orchestre mécaniquement les étapes qui ne demandent aucun jugement (archivage des
fichiers, extraction du résumé compact, rapport KPI) — jamais les deux index de jugement
(`docs/simulations/index.md`, `docs/referentiel/kpi-index.md`), qui restent la plume de l'agent.

**Article 19 — Comprendre avant de toucher.** Avant de modifier une ligne de code existante, comprendre la logique en place et
la raison pour laquelle elle a été écrite ainsi — jamais un changement à l'aveugle sur la seule foi
d'une hypothèse ou d'une intuition non vérifiée. Ceci sert notamment à **respecter le travail déjà
fait** : un mécanisme qui semble redondant, verbeux, trop prudent ou étrange a le plus souvent une
raison précise (un retour utilisateur explicite, un bug déjà rencontré et corrigé, un cas limite
déjà couvert) — documentée en commentaire, dans `docs/referentiel/` ou dans l'historique de
conversation. Le retirer ou le simplifier sans avoir d'abord compris cette raison risque de
réintroduire un bug déjà résolu une fois (cf. Article 3 : « une règle corrigée une fois ne doit
plus jamais se reproduire ailleurs sous une autre forme » — cela vaut aussi en sens inverse, ne pas
la faire réapparaître en défaisant sans le savoir le correctif qui l'empêchait). Cette exigence
n'est pas entièrement nouvelle : l'Article 0 l'imposait déjà spécifiquement pour l'esprit des
personnages (« comprendre comment cet esprit a émergé techniquement avant de toucher au code ») et
l'Article 7 pour l'architecture d'ensemble (l'épreuve de la page blanche) — l'Article 19 la rend
explicite et générale, applicable à TOUT changement de code, aussi petit ou isolé paraisse-t-il, pas
seulement ceux qui touchent la personnalité des personnages ou la structure globale du moteur.

**Précision apportée le 2026-09-19, en réponse à une clarification explicite de l'utilisateur sur
ce que « comprendre » recouvre concrètement ici :** ce n'est pas seulement lire le code qui va être
modifié — c'est comprendre **le sens** de son fonctionnement, **le pourquoi du comment** (pas
seulement ce que fait une ligne, mais pourquoi elle a été écrite précisément ainsi), **l'esprit
dans lequel cette partie a été codée** (quelle intention, quel équilibre elle sert), et rassembler
les **éléments de contexte et de motivation** qui l'expliquent (retour utilisateur à l'origine,
bug corrigé, arbitrage déjà tranché) avant d'agir. Concrètement, cela veut dire **se référer à la
charte (ce fichier) et au référentiel (`docs/referentiel/`) avant toute action sur le code** — pas
après coup pour vérifier, pas seulement si un doute survient en cours de route. L'ordre est
strict et non négociable : **d'abord on comprend le sens des choses, ensuite seulement on peut
toucher au code** — jamais l'inverse (coder puis chercher a posteriori une justification à ce qui
vient d'être fait).

**Blocage de quota Gemini — diagnostic et repli, outil surnommé « Smart Breaker ».** Regroupe
`scripts/check-gemini-quota.mjs` + `scripts/gemini-key-health.mjs` + `scripts/api-providers.mjs` +
`lib/gemini-keys.ts` (noms techniques inchangés). Blueprint générique : `docs/outil-resilience-api.md`.
Récit complet du diagnostic d'origine (premier blocage, reproduction de la requête exacte,
historique des évolutions de l'outil) : `docs/referentiel/smart-breaker-historique.md` — cette
charte garde ici les règles opérationnelles, pas leur genèse (Article 6/13).

Fait établi : le quota gratuit Gemini est **journalier, PAR MODÈLE et PAR PROJET Google Cloud**
(`GenerateRequestsPerDayPerProjectPerModel-FreeTier`), jamais global au projet ni à la clé seule.
Le `retryDelay` renvoyé par Google dans un 429 (souvent "30s") est trompeur pour ce type
d'épuisement : il ne redevient pas disponible après ce délai, il se renouvelle le lendemain.

Câblé dans les deux seuls points d'appel réseau réels à Gemini (`lib/lia.ts::think()` et
`app/api/lia/route.ts::generateDossierFragment()`), en production comme en dev/simulation :

- **`scripts/check-gemini-quota.mjs`** — sonde plusieurs modèles candidats avec un appel minimal
  réel (jamais à l'aveugle) et suggère une ligne `GEMINI_FALLBACK_MODELS=...` sans jamais l'écrire
  lui-même dans `.dev.vars`. Sonde aussi "lourde" (taille comparable à un vrai tour de jeu) sur le
  modèle principal, pour détecter l'écart où une sonde légère répond "OK" alors que la vraie charge
  échoue au même instant sur la même clé/modèle (réponse HTTP 200 sans contenu exploitable signalée
  "OK_VIDE", jamais confondue avec un vrai succès). Principe fondateur de l'outil : accumuler une
  connaissance fine de chaque clé configurée (`.gemini-key-health.json`, local, jamais committé) —
  par modèle, dans le temps, épisode par épisode — pour choisir en connaissance de cause plutôt qu'à
  l'aveugle, jamais réagir à l'aveugle à un blocage isolé. Support multi-fournisseurs
  (`scripts/api-providers.mjs`) : strictement pour le diagnostic outillage, jamais câblé comme vrai
  repli de production (resterait soumis à la même validation qualité intégrale que tout changement
  de modèle, Article 0). Affiche à chaque exécution `describeKnownLessons()` — historique curaté à
  la main, distinct de l'expérience automatique, mis à jour seulement après un nouveau blocage réel
  diagnostiqué et compris.
- **Repli de modèle** — si `GEMINI_FALLBACK_MODELS` (liste séparée par virgules) est configuré, la
  même requête est rejouée contre le modèle suivant, uniquement sur 429 ou 503 (Google répond
  parfois 503 plutôt que 429 pour un modèle pourtant confirmé épuisé par sonde directe au même
  instant — même cause, même traitement). Jamais sur 401/403/404/erreur réseau, qu'un autre modèle
  ne résoudrait pas.
- **Repli de clé** — `GEMINI_API_KEY_FALLBACKS` : chaque clé essaie tous ses modèles avant de passer
  à la clé suivante, sur 429/503 ; une clé invalide (401/403) passe directement à la suivante sans
  gaspiller de tentatives sur ses autres modèles. Deux clés du même projet Google Cloud partagent le
  même panier de quota (confirmé empiriquement) — seule une clé d'un projet distinct apporte un
  quota indépendant.
- **Rotation + disponibilité des clés** — module partagé `lib/gemini-keys.ts` (utilisé par les deux
  cerveaux, jamais deux états séparés) : round-robin parmi les clés actuellement saines à chaque
  appel, plutôt qu'une mémoire "collante" qui laissait une seule clé encaisser tout le trafic tant
  qu'elle répondait. Une clé qui vient d'échouer est mise en cooldown (429 → base 15 min ; 503 →
  base 60 s ; 401/403 → définitif pour la durée du process) et sautée par la rotation tant que ce
  délai n'est pas écoulé, jamais via un appel de sonde séparé (zéro coût API additionnel).
  **Recul exponentiel** : un échec répété sur la même clé double le délai à chaque fois (plafond 4h
  pour 429, 20 min pour 503), remis instantanément à la base au premier succès suivant. Une clé en
  cooldown n'est jamais RETIRÉE de la rotation, seulement reléguée en dernier recours si toutes le
  sont. Mémoire best-effort au niveau du process/isolate : jamais une garantie inter-redémarrage,
  jamais écrite en base. Portée limitée aux CLÉS (strictement interchangeables) : jamais aux
  MODÈLES, qui restent toujours tentés dans l'ordre configuré, le principal en premier (Article 0 —
  un modèle de repli n'est pas équivalent en qualité). Le second cerveau d'un même tour bénéficie
  immédiatement de la découverte du premier au sein du même tour (cooldown partagé).

**Trafic réel persisté dans l'historique partagé.** Chaque tentative réelle journalise, en mémoire
process, le MODÈLE essayé sous une empreinte de clé jamais la clé en clair (`fingerprint()`,
identique à `keyLabel()` du diagnostic). Toujours **aucune écriture disque** dans
`lib/gemini-keys.ts`/`route.ts` eux-mêmes (Cloudflare Workers n'a pas de système de fichiers
persistant) : ce trafic est exposé via l'API admin déjà protégée, puis persisté après coup par
`kpi-report.mjs` (étape 4 de l'Article 18, avant redémarrage du serveur) en réutilisant directement
`recordOutcomeByLabel()` de `scripts/gemini-key-health.mjs` — jamais un second mécanisme d'écriture.

**Inactif par défaut** dans tous les cas : listes absentes ou vides reproduisent exactement le
comportement antérieur, zéro appel supplémentaire, zéro changement de modèle ou de clé silencieux
sur le jeu réel — une bascule de modèle peut influer sur la qualité/le ton des réponses (Article 0),
donc elle reste une décision volontaire, jamais un défaut de production.

**Portée production, pas seulement développement.** Ces mécanismes sont câblés dans les deux seuls
points d'appel réseau réels de l'application, pas un chemin de simulation séparé — un vrai
visiteur, une simulation, ou `check-spirit.mjs`/`check-profile.mjs` en bénéficient de la même
façon. À la mise en ligne (déploiement `wrangler` sur Cloudflare Workers), `GEMINI_FALLBACK_MODELS`
et `GEMINI_API_KEY_FALLBACKS` sont des bindings d'environnement au même titre que `GEMINI_API_KEY`
déjà utilisé en production, configurables via `wrangler secret put` sans changement de code.
`scripts/check-gemini-quota.mjs` reste aussi pertinent après le lancement : le quota Google est lié
au projet/à la clé, pas à l'environnement dev/prod.

**Condition stricte avant toute activation de `GEMINI_FALLBACK_MODELS` en production** (le risque
réel n'est pas nul — un modèle de repli suit le même prompt mais rien ne garantit qu'il respecte
l'esprit des personnages avec la même fidélité que le modèle principal, jamais testé sur ce prompt
précis ; l'utilisateur ne doit rien détecter) — `GEMINI_API_KEY_FALLBACKS` n'est pas concerné par
cette condition, puisqu'il ne change jamais le modèle donc jamais la qualité :
- **Consulter Smart Conso API avant de lancer cette validation** (`node scripts/smart-conso-api.mjs
  check-spirit --confirm`, cf. Article 22) — cette validation multiplie le coût réel par le nombre de
  modèles candidats, jamais une exception au principe général.
- Validation qualité **intégrale**, jamais un échantillonnage : lire TOUTES les réponses de
  `scripts/check-spirit.mjs` et TOUS les profils de `scripts/check-profile.mjs` pour CHAQUE modèle
  candidat, avec ce modèle comme `GEMINI_MODEL` effectif.
- **Refaite entièrement** à chaque changement de la liste de modèles de repli ET à chaque
  modification substantielle du prompt de `lib/lia.ts` — un modèle validé sur un prompt passé
  n'est pas validé sur un prompt qui a changé depuis.
- **Limite honnête, à ne jamais masquer** : aucun test automatique ne peut PROUVER l'absence de
  toute dérive détectable — ces deux scripts ne détectent que les dérives les plus grossières
  (Article 13). La vraie garantie reste la lecture humaine avant activation.
- **Portes de sortie déjà en place, à ne jamais retirer, qui protègent l'expérience quel que soit
  le modèle ou la clé qui répond** : `groundTruncation()`/`groundRegister()` (`lib/dialogue.ts`)
  s'appliquent à CHAQUE réplique et pensée en aval, indépendamment du producteur. La validation
  stricte du schéma JSON (`decisionSchema.parse`, `lib/lia.ts`) rejette tout tour mal formé. Une
  exception réseau ne tente JAMAIS le repli (`catch` immédiat) : une panne réseau touche
  l'hébergeur entier, pas un modèle en particulier.
- **Interrupteur d'urgence** : désactiver un repli en production ne demande aucun changement de
  code, juste retirer la valeur du secret Cloudflare concerné — réversible en un geste.
- **Ce qui n'est actuellement PAS un risque réel** : `GEMINI_FALLBACK_MODELS` et
  `GEMINI_API_KEY_FALLBACKS` ne sont configurés que dans `.dev.vars` (jamais commité, jamais en
  production) — aucun vrai visiteur n'a jamais reçu de réponse d'un modèle/clé de repli à ce jour.
  Tant que la validation ci-dessus n'a pas été faite pour `gemini-flash-latest`/
  `gemini-3-flash-preview` (les deux seuls candidats identifiés à ce jour), `GEMINI_FALLBACK_MODELS`
  reste réservé au dev/simulation.

**Discrétion.** Limite honnête actée avec l'utilisateur : le code fonctionnel (`lib/lia.ts`,
`route.ts`, `scripts/check-gemini-quota.mjs`) doit rester en clair pour fonctionner — n'importe qui
le lisant verra immédiatement qu'il s'agit de Gemini avec un mécanisme de repli, rien ne peut cacher
ça sans casser le code. Une tentative d'encoder cette section elle-même a été refusée par le
classificateur de sécurité automatique de l'environnement — abandonnée, jamais retentée sous une
autre forme d'encodage sans nouvelle demande explicite. La discrétion réellement appliquée :
`lib/reference.ts` (référentiel affiché en jeu, panneau Admin — la seule surface que l'application
rend visiblement à un tiers) ne décrit ce chantier que par une phrase générique, sans nom de modèle,
chiffre de quota ni explication du mécanisme.

**Procédure à suivre dès qu'une simulation (étape 1 du protocole ci-dessus) reste bloquée en HTTP
429/503 répété :** (0) consulter Smart Conso API (`node scripts/smart-conso-api.mjs diagnostic
--confirm`, cf. Article 22) — `check-gemini-quota.mjs` sonde plusieurs modèles × plusieurs clés en
quelques secondes, c'est bien une action coûteuse au sens de cet Article, jamais une exception parce
que c'est un diagnostic plutôt qu'une simulation ; (1) `node scripts/check-gemini-quota.mjs` pour
identifier les modèles réellement disponibles à cet instant ; (2) reporter la ligne suggérée dans
`.dev.vars` (`GEMINI_FALLBACK_MODELS=modèle1,modèle2`) ; (3) si un second projet Google est
disponible, ajouter sa clé à `GEMINI_API_KEY_FALLBACKS` — vérifier D'ABORD qu'il s'agit bien d'un
projet distinct, pas une seconde clé du même projet (sonder avec `check-gemini-quota.mjs` en forçant
`GEMINI_API_KEY` sur cette nouvelle clé) ; (4) redémarrer le serveur de développement pour que
`.dev.vars` soit effectivement chargé (confirmé empiriquement : une variable d'environnement shell
seule n'est PAS prise en compte par le runtime Cloudflare Workers en mode dev) — en vérifiant
qu'aucun processus `workerd` orphelin ne survit à un `pkill` précédent (nom de processus différent
de `vinext dev`/`node scripts/run-framework`, peut garder le port occupé) ; (5) relancer ou laisser
reprendre la simulation.

**Double lecture en parallèle.** Dès que le transcript est
livré (étape 3), l'utilisateur le lit et rédige ses propres commentaires de son côté, en parallèle
du travail de l'agent (étapes 4 à 7) — les deux lectures avancent en même temps, chacune de son
côté, pas l'une après l'autre. Une fois son propre travail de mise à jour terminé (étape 7 close),
l'agent le signale clairement, et le prochain message de l'utilisateur sera typiquement
« voici mes commentaires » : l'agent doit s'y attendre et reconnaître ce signal comme l'ouverture
d'un second passage de retours sur le MÊME transcript (déjà lu et déjà en partie corrigé), à traiter
point par point comme tout retour annoté (cf. Article 16, complément du 2026-09-17). Pour rester
synchronisé à chaque fois, l'agent rappelle explicitement ce déroulé (livraison → double lecture en
parallèle → signal de fin de son côté → « voici mes commentaires » attendu de l'utilisateur) au
moment où il livre le transcript d'une nouvelle simulation, pas seulement la première fois.

**Questions de calibrage après « voici mes commentaires ».** L'exigence de l'étape 7 de l'Article 18 (au moins une dizaine de questions avant correction) ne
s'applique pas seulement à l'analyse initiale de l'agent : elle s'applique de la même façon à ce
second passage de retours annotés par l'utilisateur. Dès que « voici mes commentaires » arrive avec
plusieurs points distincts, l'agent identifie lesquels sont des bugs à cause racine évidente
(corrigeables directement, cf. Article 3) et lesquels impliquent un choix de conception réel
(portée d'un nouveau mécanisme, calibrage d'un seuil, arbitrage entre deux comportements plausibles)
— et pose ses questions de calibrage sur ces derniers avant d'implémenter quoi que ce soit dessus,
exactement comme pour l'analyse initiale. Les deux temps (bugs clairs → correction directe après
investigation ; conception ouverte → questions d'abord) peuvent cohabiter dans la même réponse,
traités point par point (Article 16, complément du 2026-09-17).

**Sondage rapide juste après la livraison des documents d'une simulation.** Dès que le
transcript, le dossier et le rapport KPI d'une nouvelle simulation sont livrés (étapes 3 et 4 de
l'Article 18), avant de se lancer dans l'analyse détaillée (étape 5), l'agent pose un petit
questionnaire de calibrage en trois questions, via l'outil de questions dédié (format ci-dessus) :
1. Est-ce que l'utilisateur va lire la conversation livrée entièrement, en diagonale, ou pas du
   tout — pour savoir si l'analyse peut supposer une lecture déjà faite ou doit tout réexpliquer.
2. Est-ce que l'utilisateur a besoin que l'agent cite des extraits précis de la conversation pour
   illustrer chaque point remonté dans l'analyse, plutôt qu'une description sans citation.
3. Une troisième question, construite par l'agent selon le contexte du moment (chantiers en cours,
   urgence, autres demandes en attente), portant sur la façon d'enchaîner les tâches qui suivent.
Les réponses obtenues doivent concrètement changer la façon dont l'agent répond ensuite (niveau de
détail, présence ou non de citations, ordre des tâches) — jamais notées puis ignorées. Cette
exigence est nouvelle : elle s'applique à partir de la simulation suivant son adoption, pas
rétroactivement à une livraison déjà faite avant qu'elle n'existe.

**Type de question précisé à chaque fois.** Chaque question posée à l'utilisateur (Article 16 et
ses compléments) peut viser un calibrage, un alignement de compréhension, une enquête technique, ou
tout autre besoin pertinent du moment — le type est toujours nommé en préfixe (« [Calibrage] »,
« [Alignement de compréhension] », « [Enquête technique] »...), jamais laissé implicite, pour que
l'utilisateur sache d'emblée quel genre de réponse apporter.

**Format de présentation — toujours une fenêtre dédiée.** Toute question relevant de l'Article 16
(y compris l'étape 7 de l'Article 18 et le second passage après « voici mes commentaires ») passe
par l'outil dédié de questions à choix, jamais une simple phrase interrogative en texte libre —
même quand une seule question suffit. Format attendu : le type en préfixe ; un intitulé complet et
autonome, compréhensible sans relire tout l'historique ; entre deux et quatre options concrètes,
chacune avec un libellé court et une description de ce que ce choix implique réellement (jamais un
simple « oui »/« non » sans contexte) ; l'utilisateur garde toujours la possibilité de répondre
autre chose que les options proposées. Plusieurs questions sur le même sujet peuvent être groupées
dans une même fenêtre plutôt que d'en ouvrir une par question ; si leur nombre dépasse la capacité
d'une seule fenêtre (par exemple la dizaine de questions de calibrage de l'étape 7 de l'Article 18),
elles se répartissent sur plusieurs fenêtres successives, jamais compressées en texte libre pour
tenir dans une seule.

**Clarté pour un non-développeur — l'enjeu de chaque réponse doit être compréhensible sans
jargon.** L'utilisateur n'est pas développeur : une question qui suppose de comprendre un nom de
variable, une fonction ou un mécanisme interne pour choisir entre les options n'est pas une question
claire, même si elle respecte le format ci-dessus. L'intitulé et les descriptions se lisent sans
connaissance du code — jamais un nom de fonction, de fichier ou de variable comme seule explication
d'un choix (« active X » ne suffit pas ; il faut dire ce que ça change concrètement pour
l'utilisateur ou pour ce qu'il voit/vit dans la maison). Chaque option explique sa CONSÉQUENCE
réelle et concrète plutôt qu'une description technique de la solution envisagée ; un terme
technique réellement nécessaire (parce que l'utilisateur l'a lui-même employé, ou qu'aucune
reformulation ne le remplace sans perdre en précision) est immédiatement expliqué en une incise
simple, jamais laissé sans traduction. Le but est d'éviter toute erreur de compréhension qui
mènerait l'utilisateur à choisir une option sans en avoir vraiment saisi la portée — la
responsabilité de rendre l'enjeu clair revient entièrement à l'agent qui pose la question, jamais à
l'utilisateur de deviner ou de se renseigner.

**Une question = une seule idée simple ; décortiquer les sujets complexes en plusieurs
questions.** Jamais empiler plusieurs décisions ou plusieurs sous-sujets dans une seule question
sous prétexte d'aller plus vite : une question qui demande de trancher deux choses à la fois (par
exemple « on fait X, et pour la durée on prend Y ou Z ? ») doit être scindée en deux questions
distinctes, chacune portant sur une seule idée simple à comprendre d'un coup. Pour un sujet complexe,
l'agent le décompose lui-même en plusieurs questions successives ou groupées dans une même fenêtre,
jamais en faisant porter cette décomposition à l'utilisateur. Les réponses obtenues au fil de ces
questions peuvent, selon les cas, s'agréger et influencer la formulation des questions suivantes sur
le même sujet, ou rester indépendantes quand les sous-sujets n'ont pas de lien logique entre eux —
c'est à l'agent de juger au cas par cas, jamais un enchaînement mécanique obligatoire.

**Traçabilité visible des vérifications.** Chaque fois qu'une réponse à l'utilisateur s'appuie sur
la charte pour valider un choix (« ceci respecte l'Article 0 », « vérifié contre l'Article 11 »,
etc.), le mentionner explicitement accompagné de 📜✅ directement à côté de la mention — jamais une
légende à part ni une liste séparée en fin de message, et jamais sur une phrase qui ne vérifie rien
de précis contre la charte.

**Article 20 — ARGUS : aucun travail ne se termine sans passer par le détecteur de trous
logiques.** ARGUS repère les trous logiques qu'aucun autre garde-fou de cette charte ne couvre
explicitement (combinaison de mécanismes jamais envisagée, cas limite oublié, conséquence
logique manquée, lien discret non vu) — sur une idée neuve comme sur le code déjà écrit. **HARMONIA**
(cousin d'ARGUS, cohérence des liens déjà existants), **AXA-CHECK** (troisième membre, robustesse/
fragilité RÉELLES par couverture de test), **CLEAN-DIRTY-OLD** (quatrième membre, stagnation
relative — délègue toujours son jugement aux trois autres, jamais une réponse fabriquée) et
**CLONE-HUNTER** (cinquième membre depuis le 2026-09-22, blocs de code dupliqués — littéral et par
renommage bijectif cohérent) rejoignent la même règle — le critère d'appartenance : délivre un vrai
scan de qualité du code ET peut tourner gratuitement, mécaniquement, à chaque commit (ce qui exclut
structurellement ALWAYS-NEW-CODE, dont le vrai zoom coûte un raisonnement réel, jamais automatique).
Les cinq tournent automatiquement, comme `check-house.mjs`, à chaque commit (partie mécanique
gratuite, câblée dans le crochet `post-commit`) ; ARGUS et HARMONIA ajoutent en plus, sur demande,
une seconde partie à vrai raisonnement (coût réel, Article 8), en particulier avant toute idée
nouvelle. Détail complet de chaque outil (mécanique exacte, carte de dépendances, registres) :
`docs/regles-de-travail.md` §7ter (tableau des outils), `docs/referentiel/organisation-agence.md`
(l'organigramme complet — ces cinq y sont « les Gardiens sacrés du code ») et la fiche dédiée de
chacun (`docs/referentiel/argus.md`, `harmonia.md`, `axa-check.md`, `clean-dirty-old.md`,
`clone-hunter.md`, chacune avec son
propre blueprint générique) — jamais répété ici.

**Protocole d'application** à chaque itération sur le code : Article 19 (a-t-on compris la logique
et la raison d'être du code existant avant d'y toucher ?) → Article 0 (l'esprit est-il
altéré ?) → Articles 1, 11, 12 (la conversation) → Article 15 (est-ce lisible du point de vue de
l'utilisateur ?) → Article 17 (est-ce cohérent du point de vue du personnage lui-même ?) → Articles
2 et 4 (cohérence globale et enquête) → Articles 3 et 5 (bugs et
robustesse) → Article 20 (ARGUS : un trou logique, une combinaison oubliée subsiste-t-il ? HARMONIA :
un lien devenu incohérent, une friction entre deux parties du projet subsiste-t-elle malgré tout ce
qui précède ? AXA-CHECK : le code touché reste-t-il réellement couvert par un test, ou une fonction
non testée traîne-t-elle dans une zone sensible sans que personne ne le sache ? CLEAN-DIRTY-OLD :
le code touché est-il resté trop longtemps sans qu'on se pose les trois vraies questions — encore
utile, encore à jour, profiterait-il d'une refonte ?) → Articles 6, 7 et 13 (documentation, outils et
architecture) → Articles 8, 9, 10
(coût et rejouabilité) → Article 14 (vigilance continue, à appliquer en toile de fond de tous les
autres, pas comme une étape séparée) → Article 16 (au moins trois questions de vérification posées
avant/pendant l'exécution, sur les points où une demande était réellement ambiguë). Chaque compte
rendu à l'utilisateur doit dire explicitement
ce qui a été vérifié, préservé, amélioré et corrigé.

**Article 21 — HYPER-SCAN-CHECKPOINT : la vérification approfondie exceptionnelle.** Contrairement
à ARGUS et HARMONIA (Article 20, toujours déployés), HYPER-SCAN-CHECKPOINT ne se déclenche jamais
automatiquement, jamais en continu — seulement sur demande explicite de l'utilisateur, ou proposé
par l'agent après une grosse vague de changements (jamais lancé sans confirmation). Son seul vrai
critère de succès n'est jamais "a-t-il tourné sans erreur" mais combien de bugs ou d'oublis
réellement inconnus il a fait remonter. Détail complet (ce qu'il orchestre, la double perspective en
version complète, la preuve vivante de sa vocation) : `docs/hyper-scan-checkpoint-blueprint.md` et
`docs/referentiel/hyper-scan-checkpoint.md`.

**Article 22 — Smart Conso API : consultation systématique avant toute action coûteuse.** Avant tout
appel réel à l'API Gemini déclenché par l'agent lui-même pendant une session de travail — jamais le
jeu réel, sous la seule autorité de l'Article 8 — l'agent consulte Smart Conso API
(`scripts/smart-conso-api.mjs::assess()`), jamais après coup. Un verdict "seuil souple" reste
négociable ; un verdict "seuil dur" est non négociable et exige une validation humaine explicite.
Frontière stricte avec l'Article 8 : Smart Conso API ne modifie jamais l'architecture de production
ni ne bascule un modèle/une clé de son propre chef — son expérience INFORME l'Article 8, jamais ne
le court-circuite. Détail complet : `docs/smart-conso-api-blueprint.md` et
`docs/referentiel/smart-conso-api.md`.

**SMART-CONSO-TOKEN — le pendant de Smart Conso API pour les TOKENS de l'agent lui-même.** Aucun
compteur externe des tokens de l'agent n'existe (contrairement au quota Gemini, sondable en
direct) : la seule protection possible est une **obligation écrite, non négociable**. L'agent
consulte SMART-CONSO-TOKEN (`scripts/smart-conso-token.mjs`) avant tout appel à un agent séparé
(outil Agent — THE-FINAL-JUDGE, la double perspective d'HYPER-SCAN-CHECKPOINT, toute recherche
déléguée), toute lecture exhaustive du dépôt, et tout passage de raisonnement coûteux
(ALWAYS-NEW-CODE). Même distinction souple/dur que l'Article 22. Détail complet (schémas connus
coûteux, capacité de scan Global/Partiel/Zoomé/Focus, KPI) : `docs/smart-conso-token-blueprint.md`
et `docs/referentiel/smart-conso-token.md`.

**Article 23 — ALWAYS-NEW-CODE : l'épreuve de la page blanche, rendue concrète.** L'Article 7
demandait déjà, périodiquement, de se poser la question de la page blanche — cet Article lui donne
un vrai outil. Sur UNE zone à la fois, ALWAYS-NEW-CODE imagine comment cette zone serait construite
aujourd'hui avec toute la connaissance actuelle du projet, puis compare à la structure réelle pour
repérer la dette d'organisation — jamais automatique (déclenché via CHECK-LEVEL-TARGET niveau
"Exceptionnel"), jamais un résultat "exact à 100 %" (toujours un palier de confiance), jamais une
application automatique (l'agent interroge toujours l'utilisateur avant tout changement réel).
**Garde-fou non négociable** : avant de qualifier quoi que ce soit d'"empilé, à corriger", toujours
vérifier d'abord que ce n'est pas déjà une décision assumée et documentée ailleurs (Article 19).
Détail complet : `docs/always-new-code-blueprint.md` et `docs/referentiel/always-new-code.md`.

**Article 24 — Toute construction doit être évolutive, jamais figée sur une liste copiée à la
main.** *(2026-09-21, audit d'évolutivité demandé explicitement par l'utilisateur.)* Portée
strictement le CODE et l'OUTILLAGE de travail (les ~25 scripts de l'Agence Codex et leur
documentation technique) — jamais le contenu narratif du jeu, déjà couvert séparément par le
corollaire de l'Article 10 (variété de fond des répliques de secours) et celui de l'Article 17
(jamais de liste de mots figée pour le registre). **Règle** : toute construction qui reflète l'état
d'un autre système ou d'un autre document (une carte de dépendances, une table maîtresse, un
inventaire de fichiers réels) doit soit le LIRE DYNAMIQUEMENT au moment de l'exécution, soit être
accompagnée d'un GARDE-FOU MÉCANIQUE qui détecte tout écart — jamais une copie tenue à la main sans
aucune vérification que rien ne diverge silencieusement. Un simple commentaire promettant une
synchronisation future ("à garder aligné avec X") n'est jamais une protection suffisante : ce
n'est qu'une intention, jamais un mécanisme, et l'audit du 2026-09-21 a trouvé quatre cas réels où
cette seule promesse avait déjà cessé d'être vraie : `THEMES` (`always-new-code.mjs`, dérivé de la
carte HARMONIA), `SENSITIVE_NODES` (`check-level-target.mjs`, idem), `AGENT_SCRIPT_FILES`
(`axa-check.mjs`, dérivé de la table maîtresse — 6 Agents réels invisibles à la couverture AXA-CHECK
et à la stagnation CASSANDRA-RH depuis leur construction) et `LOCAL_JOURNALS` (`doc-report.mjs`,
2 journaux locaux réels jamais déclarés). Les quatre ont reçu un vrai garde-fou mécanique le soir
même (`findThemesDivergingFromHarmonia()`, `findSensitiveNodesDivergingFromHarmonia()`,
`findScriptsMissingFromAgentFiles()`, `findUndeclaredLocalJournals()`), sur le même patron déjà
prouvé ailleurs dans le projet (`findToolsMissingFromMenu()`, `findRegistriesMissingFromCircle()`,
`findRegistriesMissingDecision()`, `findGardiensMissingFromSource()` — 8 outils protégés de cette
façon avant même cet audit). **Ce que cet Article n'exige PAS** : un vocabulaire fermé et stable par
nature (les états d'une machine à états, une énumération de paliers) n'a rien à synchroniser et
n'est jamais concerné ; un contenu explicitement curaté à la main par décision humaine documentée
(ex. `KNOWN_LESSONS` du Smart Breaker, `SMART_BREAKER_CAPABILITIES`) reste légitime tel quel, tant
que cette nature volontairement manuelle est écrite noir sur blanc à côté. Un audit exhaustif de
tout le reste du paysage (au-delà des 12 outils déjà couverts par un garde-fou après cet audit) n'a
pas été fait ce soir-là au-delà de ce qui précède — un futur passage complémentaire reste ouvert.

## Règles de travail — collaboration avec l'utilisateur

`docs/regles-de-travail.md` documente, séparément de la charte de contenu ci-dessus, la façon dont
l'utilisateur et l'agent travaillent ensemble (rythme, calibrage, vérification, git, discrétion,
livrables) et un profil de collaboration observé. Toute IA qui reprend ce projet doit lire ce
document en plus de celui-ci, pas à sa place — il ne contient jamais de règle sur le CONTENU du
jeu, seulement sur la méthode de travail.

`docs/systeme-de-suivi.md` (2026-09-19) complète ce document : la structure de stockage complète du
suivi des tâches (dossier `docs/suivi/`, un fichier par session, un fichier d'index
`docs/suivi/index.md`, quatre attributs par tâche — horodatage, sujet, sous-sujet, degré de
sensibilité). Démarre à la création du système, sans reconstruire l'historique antérieur.

**La mise à jour en temps réel de ce suivi est OBLIGATOIRE et est un point central de l'organisation
du travail sur ce projet, pas un outil secondaire parmi d'autres.** Aucune exception : toute tâche substantielle (code, charte,
documentation de référence, nouvel outil) DOIT être documentée dans `docs/suivi/`, sans quoi elle
n'est pas considérée terminée au sens de cette charte, au même titre qu'un test qui ne passerait pas.
Concrètement : chaque tâche substantielle se documente dans `docs/suivi/` DANS LE
MÊME commit que le travail qu'elle décrit (jamais après coup, cf. `docs/regles-de-travail.md` §4) ;
un crochet git tracké (`scripts/hooks/post-commit`, auto-installé à chaque `pnpm install` via le
script `prepare` de `package.json`) avertit en temps réel — pas au bout de plusieurs heures — dès
qu'un commit touche du code ou la charte sans mettre à jour le suivi. Des tests fiables doivent
TOUJOURS garantir le bon fonctionnement de ce système, exactement comme c'est le cas aujourd'hui :
`scripts/check-suivi-fidelity.mjs` (clôtures non vérifiées, tâches ouvertes même à statut vide,
validation que les fichiers cités dans une tâche "terminée" existent réellement, vue temps réel
terminé/en cours/à faire) et ses fonctions mécaniques (`recentCommits`, `findCommitsMissingSuiviUpdate`,
`categorizeTasks`, etc.) sont couvertes par `scripts/check-house.mjs`, lui-même exécuté automatiquement
avant chaque commit par le crochet `pre-commit` (bloquant). Un écart dans ce système se corrige donc
avec la même rigueur qu'un bug de dialogue (Article 3), jamais traité comme une fonctionnalité annexe
qu'on laisserait se dégrader. **Précision, en réponse à une question explicite sur le gestionnaire de
tâches numéroté (`TaskCreate`/`TaskUpdate`) que l'agent utilise pendant la session** : cette
numérotation (#1, #2, ...) est volontaire mais N'EST PAS le système de suivi durable décrit ci-dessus
— c'est un aide-mémoire interne à l'outil Claude Code, propre à la session en cours, déjà documenté
comme tel dans `docs/regles-de-travail.md` §B.1 (« n'est qu'un aide-mémoire pour l'agent lui-même,
jamais une source de vérité pour l'utilisateur — ne remplace aucune des vérifications de la section
3 »). La seule source de vérité durable, traversant les sessions et vérifiée par de vrais tests,
reste `docs/suivi/`.

## Philosophie et politique — la boussole du projet

`docs/philosophie-et-politique.md` extrait et généralise les valeurs et les principes d'arbitrage
qui gouvernent ce projet (le pourquoi, et comment on tranche en cas de conflit de valeurs) —
contrairement à la charte de contenu ci-dessus (propre à ce projet) et à `regles-de-travail.md`
(mécanique de collaboration), ce document est formulé pour rester utilisable sur un futur projet
créatif/narratif piloté par IA. Texte fondateur, révisé exceptionnellement, pas au fil de l'eau.

*(Sauf mention contraire, chaque outil ci-dessous suit le même schéma documentaire : un blueprint
générique réutilisable sur un autre projet, une instanciation propre à ce projet dans
`docs/referentiel/`, un registre dans un dossier dédié avec index.)*

## Outil de résilience API — blueprint exportable

`docs/outil-resilience-api.md` documente l'ARCHITECTURE de l'outil de contournement de blocages de
clé/quota API (`scripts/gemini-key-health.mjs`, `scripts/api-providers.mjs`,
`scripts/check-gemini-quota.mjs`) sous une forme générique, réutilisable dans un autre projet
appelant une API tierce à quota limité — jamais l'historique d'apprentissage propre à ce projet
(`.gemini-key-health.json`, local, jamais committé), qui reste spécifique à ce déploiement. À
mettre à jour quand la STRUCTURE de l'outil évolue, pas à chaque ajustement propre à Gemini.

## Tableau de bord interne (KPI) — blueprint exportable

`docs/tableau-de-bord-blueprint.md` documente l'ARCHITECTURE du tableau de bord interne (5
familles génériques : performance runtime, robustesse du code, qualité de sortie, cohérence
logique, variété/rejouabilité) — jamais les familles exactes ni les fichiers propres à ce projet,
qui vivent dans `docs/referentiel/tableau-de-bord.md` (instanciation) et
`docs/referentiel/points-fragiles.md` (registre vivant, exception au dossier dédié standard).

## ARGUS — blueprint exportable

`docs/argus-blueprint.md` documente l'ARCHITECTURE du détecteur de trous logiques (cf. Article 20)
— jamais le registre des trouvailles propre à ce projet, qui vit dans `docs/argus/` (dossier +
index) et `docs/referentiel/argus.md` (instanciation).

## HARMONIA — blueprint exportable

`docs/harmonia-blueprint.md` documente l'ARCHITECTURE du cousin d'ARGUS dédié à la cohérence des
liens déjà existants (cf. Article 20) — jamais la carte des dépendances propre à ce projet ni son
registre de frictions, qui vivent dans `docs/referentiel/harmonia.md` (instanciation, carte par
grand thème) et `docs/harmonia/` (dossier + index).

## Smart Conso API — blueprint exportable

`docs/smart-conso-api-blueprint.md` documente l'ARCHITECTURE de la petite sœur de Smart Breaker,
dédiée à réguler le rythme de consommation d'une API tierce à quota limité (seuils souple/dur,
apprentissage progressif, validation humaine explicite de chaque durcissement) — jamais les seuils
exacts ni les fichiers propres à ce projet, qui vivent dans `docs/referentiel/smart-conso-api.md`
(instanciation) et `docs/smart-conso-api/` (dossier + index).
Frontière stricte avec l'Article 8 : cf. section Article 8 ci-dessus.

## SMART-CONSO-TOKEN — blueprint exportable

`docs/smart-conso-token-blueprint.md` documente l'ARCHITECTURE du pendant de Smart Conso API pour
les TOKENS de l'agent lui-même (schémas connus coûteux plutôt qu'un quota sondable en direct,
capacité de scan réutilisant l'échelle de portée de THE-FINAL-JUDGE) — jamais les seuils exacts ni
les fichiers propres à ce projet, qui vivent dans `docs/referentiel/smart-conso-token.md`
(instanciation) et `docs/smart-conso-token/` (dossier + index). Règle d'usage complète et
obligation écrite : cf. section Article 22 ci-dessus, dont ce document reste le pendant plutôt
qu'un Article séparé.

## HYPER-SCAN-CHECKPOINT — blueprint exportable

`docs/hyper-scan-checkpoint-blueprint.md` documente l'ARCHITECTURE de l'outil de vérification
approfondie exceptionnelle (cf. Article 21) — jamais les cinq prompts historiques exacts ni les
fichiers propres à ce projet, qui vivent dans
`docs/referentiel/hyper-scan-checkpoint.md` (instanciation) et `docs/hyper-scan-checkpoint/`
(dossier + index, y compris la mémoire du dernier passage).

## CHECK-LEVEL-TARGET — blueprint exportable

`docs/check-level-target-blueprint.md` documente l'ARCHITECTURE de l'outil qui calcule, avant toute
vérification, le niveau attendu et la combinaison d'outils à déployer (Léger/Standard/Approfondi/
Exceptionnel pour ce projet) — remplace la façon informelle, au cas par cas, de choisir les outils.
Nommé par l'utilisateur lui-même. Jamais les niveaux exacts ni les
fichiers propres à ce projet, qui vivent dans `docs/referentiel/check-level-target.md`
(instanciation) et `docs/check-level-target/` (dossier + index des évolutions de la règle). Distinct
de l'échelle qualitative d'effort général ⏱️/🔢 (`docs/regles-de-travail.md` §B.2bis), jamais
fusionnés.

## THE-KING — blueprint exportable

`docs/the-king-blueprint.md` documente l'ARCHITECTURE de l'Agent qui veille au respect de
`docs/philosophie-et-politique.md` dans les décisions à haut niveau (2026-09-21, demande explicite
de l'utilisateur, rôle de « père »/« grand-père ») — rappel ciblé sur 6 catégories de déclenchement
(architecture, mécanique de jeu à fort impact, nouvel outil, priorité de la feuille de route,
décision généralisable, décision irréversible/coûteuse), fraîcheur du document (jamais un auto-edit),
digest chronologique de son évolution et détection de tension possible entre deux principes (signal
heuristique, jamais une contradiction prouvée) — sous une forme générique, réutilisable sur un autre
projet gouverné par un document de philosophie séparé de sa charte de contenu. Jamais les catégories
exactes ni les fichiers propres à ce projet, qui vivent dans `docs/referentiel/the-king.md`
(instanciation) et `docs/the-king/` (dossier + index des évolutions constatées).

## INES-official — blueprint exportable

`docs/ines-official-blueprint.md` documente l'ARCHITECTURE de la « secrétaire » qui aplatit le
dépôt en une édition consolidée et annotée (2026-09-21, nom capturé en session antérieure, jamais
concrétisé avant ce soir) — MVP calibré explicitement : APLATIR + ANNOTER, jamais une réécriture
réelle du code ; périmètre (code seul / code + documentation) choisi à chaque édition ; annotation
qui réutilise les signaux déjà calculés ailleurs (CLEAN-DIRTY-OLD, AXA-CHECK) sans jamais fabriquer
de lien avec ARGUS/HARMONIA (scans en texte libre, non indexés par fichier) ; table des matières et
datage/versionnage dès la première version ; déclenchement PÉRIODIQUE via CIRCLE-TASKS, jamais
seulement sur demande — sous une forme générique, réutilisable sur un autre projet de code. Jamais
les racines/extensions exactes ni les fichiers propres à ce projet, qui vivent dans
`docs/referentiel/ines-official.md` (instanciation) et `docs/ines-official/` (index léger des
métadonnées d'édition — le corps de chaque édition reste local, jamais committé, pour ne pas
grossir le dépôt sans fin).

## ALWAYS-NEW-CODE — blueprint exportable

`docs/always-new-code-blueprint.md` documente l'ARCHITECTURE de l'outil qui rend concrète
l'épreuve de la page blanche (Article 7, formalisée en Article 23) : imaginer, zone par zone, la
structure idéale d'un projet en repartant de zéro avec toute la connaissance actuelle, pour
détecter la dette d'organisation. Jamais les 8 zones exactes ni les fichiers propres à ce projet, qui vivent dans
`docs/referentiel/always-new-code.md` (instanciation, réutilise les thèmes d'HARMONIA) et
`docs/always-new-code/` (dossier + index, mémoire de couverture pour la rotation).

## memory-audit — blueprint exportable, l'exception qui cible les Personnages

*(Genèse du nom : cf. `docs/referentiel/claude-md-asides-historique.md`.)*

`docs/memory-audit-blueprint.md` documente l'ARCHITECTURE de memory-audit — un vrai script
d'**Outillage de travail = Membre de l'équipe** (`scripts/memento.mjs`, nom de fichier technique
inchangé), catégorie "audit de simulation" aux côtés d'EL-PROFESSOR. Son SUJET, en revanche, EST un
personnage narratif (Lia/Noé, qui n'ont AUCUNE existence dans l'équipe de travail — jamais une
catégorie de l'organigramme, cf. `PERSONNAGES`/`assertNotAPersonnage()` de `scripts/lib-shell.mjs`,
un garde-fou d'exclusion, pas une case de plus) — c'est son SUJET qui est hors norme, jamais sa
NATURE de code. Couvre une dette hors du domaine des outils de gouvernance de tokens existants
(frontière écrite des deux côtés) : cohérence mécanique de la mémoire persistée d'un personnage dans
le temps (ordre chronologique, remise à zéro suspecte d'un compteur, régression d'un indicateur à
sens unique) — jamais un second appel au modèle de langage. Une investigation préalable dédiée
(Article 19) est un prérequis non négociable avant toute conception, pour éviter de dupliquer un
plafonnage de stockage déjà résolu ou de heurter une frontière déjà actée pour de bonnes raisons.
Jamais les champs exacts ni les fichiers propres à ce projet, qui vivent dans
`docs/referentiel/memory-audit.md` (instanciation) et `docs/memory-audit/` (dossier + index).

**Voisin distinct, jamais le même statut : memento weight.** Un second besoin, de nature différente,
est né avec la même investigation : mesurer le poids réel du contexte envoyé au modèle par tour —
une observation PURE, ajoutée au point d'appel réseau réel, qui ne modifie jamais ce qui est envoyé
(Article 0/8). Ce fragment vit dans le **Moteur du jeu** (`lib/memento-weight.ts`, `lib/`), jamais
un membre, jamais un badge — exactement la même catégorie que `lib/gemini-keys.ts` (cf.
`docs/regles-de-travail.md`, « Moteur du jeu vs Outillage de travail ») ; sa partie outillage
(persistance + agrégation pour le rapport KPI) vit dans `scripts/memento-weight.mjs`, séparée le
2026-09-21 de `scripts/memento.mjs` pour ne plus mélanger les deux rôles dans un seul fichier. Nom
conservé tel quel (jamais rattaché à l'ombrelle retirée, qui ne le désignait déjà que par ce nom).
Détail complet : `docs/referentiel/memento-weight.md`.

## find-booster — blueprint exportable

*(Genèse du nom et de la promotion en Membre complet : cf.
`docs/referentiel/claude-md-asides-historique.md`.)*

`docs/find-booster-blueprint.md` documente l'ARCHITECTURE de l'outil de navigation par concept dans
un gros fichier — cinq motifs d'extraction réels reconnus (fonctions nommées, blocs anonymes
commentés, commentaires denses non accolade-préfixés pour un code peu structuré, entrées de
tableau titrées, titres Markdown, routés par extension/contexte, dédoublonnés explicitement entre
motifs de code jamais mélangés), un tag thématique optionnel (indice de rapprochement vers les 8
thèmes HARMONIA, jamais
une classification certaine), et une recommandation d'usage (`recommendFindBooster()`, poids réel
en tokens plutôt que nombre de lignes seul — `lib/reference.ts`, 132 lignes mais ~55 500 tokens, en
est la preuve vivante) — jamais une application automatique. Son voisin **find-deep-booster**
(surnom d'affichage, 2026-09-21, anciennement « route-booster » — `scripts/route-booster.mjs`, le
fichier technique ne change jamais : préparation d'un découpage réel, points de coupe candidats +
indice de risque lexical) reste lui un outil sans blueprint, documenté dans
`docs/regles-de-travail.md` — il ne sert que rarement,
contrairement à find-booster. **`scripts/find-brain.mjs`** (2026-09-21) unifie les deux : rend un
jugement unique, jamais exclusif, sur lequel des deux (ou les deux) utiliser pour un fichier donné,
sans rien recalculer lui-même. **`scripts/tool-brain.mjs`** (2026-09-21) généralise find-brain à
TOUT le catalogue PRESTATIONS de LE-COORDINATEUR (description de tâche libre et/ou fichier ciblé),
centralise en une seule bannière le rappel post-commit auparavant éparpillé en 3 blocs, et délivre
un rapport de KPI d'usage réel (outils jamais sollicités) plus un auto-diagnostic borné à son propre
périmètre — à chaque Ronde CIRCLE-TASKS et à la demande (`node scripts/tool-brain.mjs rapport`).
**Un seul point d'entrée obligatoire : tool-brain, jamais un choix entre plusieurs outils
(re-précisé le 2026-09-21, demande explicite de l'utilisateur : « je ne dois pas m'emmêler entre
tool-brain et find-brain, find-booster et find-deep-booster [...] tool-brain doit m'aider
systématiquement, c'est lui qui est plugué directement à moi »).** Hiérarchie stricte, à ne jamais
recomposer soi-même au moment d'agir :
```
tool-brain (le SEUL réflexe à avoir — jamais choisir entre les couches ci-dessous)
 └─ find-brain (interne à tool-brain — décide find-booster et/ou find-deep-booster pour UN fichier)
     ├─ find-booster       (index par concept dans un fichier déjà structuré)
     └─ find-deep-booster  (surnom de route-booster.mjs — points de coupe d'une fonction géante)
 └─ suggestPrestationsForTask (interne à tool-brain — tout le catalogue PRESTATIONS, pas que la recherche)
```
**Obligation écrite d'usage réel** (même limite honnête que SMART-CONSO-TOKEN, aucun mécanisme
technique ne peut intercepter un `Read`/`Grep` avant qu'il n'ait lieu) : **avant toute recherche
dans un fichier existant** (pas seulement une lecture intégrale ou un grep répété), consulter
`node scripts/tool-brain.mjs "<tâche>" --file <fichier>` — **jamais** find-brain.mjs/find-booster.mjs/
find-deep-booster(route-booster).mjs directement : `adviseToolBrain()` (tool-brain.mjs) appelle déjà
`recommendFindBrain(filePath)` en interne, un appel séparé à find-brain serait redondant, jamais un
second chemin légitime. Jamais seulement se fier au rappel automatique du dernier commit
(`docs/regles-de-travail.md` §7ter), qui peut être périmé si le fichier a grossi depuis. Preuve
honnête que ce réflexe n'était pas encore acquis avant ce renforcement : trouvé le soir même en
lançant `find-booster.mjs` directement sur un fichier sans passer par tool-brain d'abord. Principe
général associé (même soir, même demande) : **avant chaque commande, se demander si un outil déjà
existant répondrait plus vite, plus efficacement, ou de façon plus complète (accès à un rapport
déjà produit)** — cf. `docs/regles-de-travail.md` §7ter pour le détail. Jamais les motifs exacts ni
les fichiers propres à ce projet, qui vivent dans `docs/referentiel/find-booster.md` (instanciation)
et `docs/find-booster/` (dossier + index).

## CLONE-HUNTER — blueprint exportable

*(2026-09-21, construit en réponse directe à une question de l'utilisateur : « est-ce qu'on a deja
un outil qui traque les redondances, repetition, duplicatas, dans le code ? » — vérifié avant
construction, en lisant les fonctions exportées d'ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD une par
une (Article 19), qu'aucune ne fait ce métier. Membre complet dès la construction, décision
explicite de l'utilisateur, jamais l'étape intermédiaire "sans blueprint" habituelle.)*

`docs/clone-hunter-blueprint.md` documente l'ARCHITECTURE du détecteur de blocs de code dupliqués —
v1 littérale (blocs de lignes identiques après normalisation d'espaces) ET v2 (2026-09-21, blocs
structurellement identiques sous un renommage bijectif cohérent d'identifiants, jamais une
ressemblance sémantique complète qui demanderait un vrai parseur AST), un diff de blocs qui étend la
comparaison ligne par ligne plutôt qu'un fenêtrage à taille fixe (cœur partagé par les deux
versions), un regroupement par union-find pour qu'un bloc dupliqué à N endroits ne produise jamais N
alertes redondantes, et une exclusion vérifiée (jamais générique) du code vendu tel quel dont la
duplication est assumée par design (`components/ui/`, le kit shadcn/Radix de ce projet).
`clone-hunter-run` rejoint CIRCLE-TASKS en
lancement RÉEL à chaque passage (thème "Passages réels (smoke run)", comme
profil-utilisateur-guard/network-check-run) — jamais un simple signal de fraîcheur, la détection de
duplication n'ayant aucune mémoire persistante à consulter. Jamais les seuils exacts ni les fichiers
propres à ce projet, qui vivent dans `docs/referentiel/clone-hunter.md` (instanciation) et
`docs/clone-hunter/` (dossier + index).

## objectifs-vs-resultats — blueprint exportable

*(Surnom, 2026-09-21 : « R/O-Guardian » — nom technique gardé comme nom principal partout où un
slug en dépend, jamais renommé en tête de la table maîtresse, contrairement à route-booster/
CLAUDE.MD.SPY qui n'avaient aucun registre/catégorie accroché à leur slug.)*

`docs/objectifs-vs-resultats-blueprint.md` documente l'ARCHITECTURE d'un registre hand-maintained
d'objectifs chiffrés par entité/période confronté à un résultat mesuré par des outils déjà
existants (tâche #287, 2026-09-21) — jamais un second calcul divergent, jamais un audit
indépendant, jamais un sous-agent d'un outil de gouvernance d'équipe. Jamais les sources exactes ni
le registre propre à ce projet, qui vivent dans `docs/referentiel/objectifs-vs-resultats.md`
(instanciation) et `docs/objectifs-vs-resultats/` (dossier + index).

## CASSANDRA-RH — blueprint exportable

`docs/cassandra-rh-blueprint.md` documente l'ARCHITECTURE de l'Agent Cadre RH de l'outillage de
travail (tâche #184, noyau construit et fiabilisé le 2026-09-21) — NOTE l'équipe (constat chiffré,
jamais un seuil auto-jugé), SUPERVISE le badge (lit le système de certification existant, jamais ne
le recalcule), LIT le KPI (lit un historique déjà produit), signale les outils à retirer/refondre
(réutilise des signaux déjà calculés ailleurs), squelette de recrutement en 3 étapes (décision
humaine explicite à chaque étape) — jamais un décideur final. Récit complet des décisions de
calibrage : `docs/cassandra-rh-conception.md` (archivé, conservé comme fondation). Jamais le
mécanisme exact ni le registre propre à ce projet, qui vivent dans `docs/referentiel/cassandra-rh.md`
(instanciation) et `docs/cassandra-rh/` (dossier + index).

## AXA-CHECK — blueprint exportable

`docs/axa-check-blueprint.md` documente l'ARCHITECTURE de l'outil de robustesse/fragilité RÉELLES
par fonction (cf. Article 20, troisième membre "toujours déployé" aux côtés d'ARGUS et HARMONIA) —
mesure de couverture de test via `NODE_V8_COVERAGE` (zéro nouvelle dépendance), granularité par
fonction, fragilité enrichie (jamais un simple miroir de la robustesse) — sous une forme générique,
réutilisable sur un autre projet qui a déjà un filet de sécurité mécanique. Jamais le mapping de
fichiers exact ni le registre propre à ce projet, qui vivent dans `docs/referentiel/axa-check.md`
(instanciation) et `docs/axa-check/` (dossier + index).

**LE-COORDINATEUR — l'exception sans blueprint.** Contrairement à tous les autres outils ci-dessus,
le petit orchestrateur `scripts/le-coordinateur.mjs` (nommé et calibré le 2026-09-19, à la demande
explicite de l'utilisateur : « un coordinateur de fonctions existantes... juste là pour fiabiliser
et fluidifier l'existant ») n'a volontairement ni blueprint ni instanciation ni registre séparés —
il n'a aucune connaissance propre au projet à documenter à part, sa seule valeur étant de savoir
appeler et agréger ce que les autres outils gratuits de ce paysage disent déjà. Entièrement
documenté dans `docs/regles-de-travail.md` §7ter.

**CIRCLE-TASKS — même exception, pour les tâches périodiques mal automatisées.** `scripts/circle-tasks.mjs` regroupe dans un seul menu à cocher les tâches
périodiques gratuites facilement oubliées (mise à jour du profil utilisateur, relecture des
référentiels, rapport KPI, signal ALWAYS-NEW-CODE, carnets de correctifs, scans Smart Conso
API/SMART-CONSO-TOKEN, photo de la dream team, THE-SCREENER) — jamais un tout-en-un silencieux,
toujours une vraie fenêtre à cocher ouverte par l'agent. THE-FINAL-JUDGE reste visible dans la même
fenêtre mais toujours marqué ⚠️🔴 coûteux, jamais coché par défaut. Ni blueprint ni instanciation
séparés, même principe que LE-COORDINATEUR ci-dessus — entièrement documenté dans
`docs/regles-de-travail.md` §7ter.

**doc-HTML (surnom, anciennement « gabarit HTML ») — pas un outil de vigilance, un simple rendu.**
`scripts/html-report.mjs` rend n'importe quel rapport déjà produit (KPI, EL-PROFESSOR, THE-SCREENER,
simulations, THE-FINAL-JUDGE, CIRCLE-TASKS...) en page HTML autonome, cohérente visuellement d'un
rapport à l'autre — jamais le fichier de référence gardé dans `docs/` (qui reste texte/markdown,
relu par les outils), seulement une copie de présentation générée à la remise. Encore plus mince que
LE-COORDINATEUR/CIRCLE-TASKS. Importé directement par ~10 scripts (jamais par Doc-Report, qui reste
un pair au même statut « Utilitaire nommé » — son rôle est d'AUDITER de l'extérieur que doc-HTML est
bien utilisé où il devrait l'être, jamais de l'importer lui-même). Entièrement documenté dans
`docs/regles-de-travail.md` §7ter.

**Compteur d'utilisation des outils — le pendant "usage réel" de SMART-CONSO-TOKEN.**
`scripts/tool-usage.mjs` (tâche #166, 2026-09-21) journalise chaque sollicitation RÉELLE d'un outil
(`.tool-usage-history.json`, local, jamais committé, cumul permanent jamais remis à zéro) : l'origine
(spontanée/demandée/automatique post-commit) et un taux de trouvaille (`foundSomething`), même
discipline anti-vanity-metric que `rereadPerformance()`. Nourrit Doc-Report (ci-dessous) et la future
CASSANDRA-RH. Même statut "sans blueprint" — entièrement documenté dans `docs/regles-de-travail.md`
§7ter.

**Doc-Report — le gardien de la décision HTML/texte, jamais celui qui la prend.** `scripts/doc-report.mjs`
(tâche #165, 2026-09-21) relie les registres réels du réseau d'outils dans un index global : pour
chaque registre, la décision HTML/texte déjà actée (remise HTML via `html-report.mjs`, archive HTML
assumée, ou texte seul), vérifiée mécaniquement contre le vrai code (le script producteur importe-t-il
réellement `html-report.mjs` ?) plutôt que supposée — a trouvé dès son premier lancement que
THE-DEEP-READER et les Simulations n'avaient jamais reçu leur câblage HTML pourtant acté. Croisé avec
l'âge du dernier rapport (`lastTouchDays()` de CLEAN-DIRTY-OLD) et le compteur d'usage
(`toolsNeverUsed()` de `scripts/tool-usage.mjs`) pour signaler un outil dont les rapports ne sont
jamais consultés. Étend aussi son inventaire aux JOURNAUX LOCAUX jamais committés
(`.gemini-key-health.json`, `.smart-conso-token-history.json`, `.tool-usage-history.json`, etc. —
réponse tranchée le 2026-09-21 à une question directe de l'utilisateur : le MÊME outil, jamais un
jumeau, seul le type d'artefact diffère) : `LOCAL_JOURNALS`/`auditLocalJournals()` (fraîcheur par
mtime du système de fichiers, jamais git) et `findJournalsMissingFromGitignore()` (un journal local
absent de `.gitignore` est un vrai risque de fuite au prochain commit). Même statut "sans blueprint"
que LE-COORDINATEUR/CIRCLE-TASKS/html-report.mjs — entièrement documenté dans
`docs/regles-de-travail.md` §7ter.

## CHECK-TASKS-DETAILS — blueprint exportable

`docs/check-tasks-details-blueprint.md` documente l'ARCHITECTURE de l'outil d'état des lieux des
tâches à la demande (2026-09-20, demandé explicitement par l'utilisateur pour répondre à ses
demandes récurrentes « fais-moi l'état des tâches en cours » avec un gabarit fixe) — zoom (en
cours/élargi/projet entier) × forme (liste/arborescence), rapport HTML, strictement en lecture
seule sur `docs/suivi/` (qui reste l'unique source de vérité, jamais une seconde porte d'écriture),
vérification croisée automatique contre son propre historique (régression/stagnation) — sous une
forme générique, réutilisable sur tout projet suivi par un système de tâches durable. Statut
**complet** (choix explicite de l'utilisateur, Article 16), contrairement à LE-COORDINATEUR/
CIRCLE-TASKS/html-report.mjs. Jamais les colonnes exactes ni le registre propre à ce projet, qui
vivent dans `docs/referentiel/check-tasks-details.md` (instanciation) et
`docs/check-tasks-details/` (dossier + index). Consulte `le-coordinateur.mjs::suggestPrestationsForTask()`
pour chaque tâche ouverte — premier usage concret d'un principe désormais général, documenté dans
`docs/regles-de-travail.md` §7ter (« Consultation programmatique outil→LE-COORDINATEUR »).

## CLEAN-DIRTY-OLD — blueprint exportable

`docs/clean-dirty-old-blueprint.md` documente l'ARCHITECTURE du détecteur de stagnation (cf.
Article 20, quatrième membre "toujours déployé" aux côtés d'ARGUS, HARMONIA et AXA-CHECK) — code
ancien et peu retouché RELATIVEMENT au reste du projet (jamais un seuil de date fixe), qui repère
seul et délègue toujours le vrai jugement (encore utile ? encore à jour ? profiterait d'une
refonte ?) à ARGUS/HARMONIA/ALWAYS-NEW-CODE. Jamais les seuils exacts ni le registre propre à ce
projet, qui vivent dans `docs/referentiel/clean-dirty-old.md` (instanciation) et
`docs/clean-dirty-old/` (dossier + index).

## EL-PROFESSOR — blueprint exportable

`docs/el-professor-blueprint.md` documente l'ARCHITECTURE de l'outil de notation de fidélité à la
charte (Article 18, étape 4bis) — une vraie lecture qualitative, jamais un calcul mécanique, notée
par thème et plafonnée par la hiérarchie de la charte (un article suprême comme l'Article 0 ne peut
jamais être compensé par une bonne moyenne sur les autres thèmes) — sous une forme générique,
réutilisable sur un autre projet gouverné par une charte de contenu. Deux modes (2026-09-19,
extension explicitement demandée) : **conversation entière** (une simulation ou session complète,
comme ci-dessus) et **extrait isolé** (un test isolé, un scénario unique — chaque thème porte un
palier de matière minimale pour être jugé honnêtement, un score jamais ramené à l'échelle /100 des
simulations complètes). Jamais les 5 thèmes exacts, les paliers précis ni le registre propre à ce
projet, qui vivent dans `docs/referentiel/el-professor.md` (instanciation) et `docs/el-professor/`
(dossier + index). Distinct du carnet
`docs/simulations/correctifs-a-revalider.md` (suivi de correctifs de CODE précis, jamais consulté
par EL-PROFESSOR — cf. Article 18, étape 6, et `docs/referentiel/el-professor.md` pour
l'articulation exacte entre les deux).

## THE-SCREENER — blueprint exportable

`docs/the-screener-blueprint.md` documente l'ARCHITECTURE du pendant graphique d'EL-PROFESSOR
(Article 18, étape 4bis) — une note indicative de qualité visuelle, jamais un verdict qui prime sur
l'appréciation de l'utilisateur, fondée sur 2 captures d'écran maximum (Playwright) et une charte
graphique déjà écrite — sous une forme générique, réutilisable sur un autre projet visuel piloté
par IA. Jamais les critères exacts ni le registre propres à ce projet, qui vivent dans
`docs/referentiel/the-screener.md` (instanciation) et `docs/the-screener/` (dossier de rapports).
Distinct d'un éventuel futur outil de gestion de la refonte graphique elle-même — décision
explicite de l'utilisateur de garder les deux séparés.

## THE-FINAL-JUDGE — blueprint exportable

`docs/the-final-judge-blueprint.md` documente l'ARCHITECTURE d'un audit indépendant de code et de
produit (2026-09-20, demandé explicitement par l'utilisateur) — un AGENT RÉELLEMENT SÉPARÉ, sans
mémoire de l'historique du projet, qui incarne un professionnel senior au regard critique envisageant
sérieusement de reprendre le projet, et rend un verdict opiniâtre (positifs, points à améliorer,
pistes de développement) — jamais une vérification de fidélité aux décisions déjà prises (l'inverse
exact de la double perspective d'HYPER-SCAN-CHECKPOINT), jamais un score calibré (l'inverse d'EL-
PROFESSOR), jamais un exécutant (conseiller uniquement, aucun code écrit par lui-même). Deux axes
indépendants et croisables librement : 6 paliers d'intensité (quantité lue, très léger à très lourd)
et 4 paliers de périmètre (ce qui est audité, global à un sujet précis), toujours choisis par l'agent
qui pilote au moment du déclenchement — jamais un palier par défaut figé par outil. Même dualité
dev/production que THE-SCREENER, un mandat explicite incluant les risques de sécurité/production.
Intégré à CHECK-LEVEL-TARGET en tendance générale (Approfondi → intensité basse à modérée,
Exceptionnel → intensité approfondie à très lourde), jamais un verrou, et jamais à confondre avec les
4 niveaux propres de CHECK-LEVEL-TARGET malgré deux mots partagés. Jamais les paliers exacts ni le
registre propres à ce projet, qui vivent dans
`docs/referentiel/the-final-judge.md` (instanciation) et `docs/the-final-judge/` (dossier de
rapports) — ses conclusions retenues après réconciliation rejoignent les registres existants
(`points-fragiles.md`, `correctifs-a-revalider.md`, la feuille de route), jamais un rapport isolé.
**Règle durable (2026-09-20) : coûte cher en tokens** (~37 000 tokens de coût fixe par appel d'agent
séparé, recherche réelle documentée dans `docs/referentiel/smart-conso-token.md`) — vigilance et
parcimonie requises à chaque déclenchement, jamais un réflexe. Consultation obligatoire des DEUX
conseillers avant lancement : Smart Conso API et SMART-CONSO-TOKEN (cf. leurs sections dédiées).

## Référentiel technique — la référence à jour

- `docs/referentiel/principes.md` — les règles invariantes du comportement de la maison, telles
  qu'elles sont réellement codées aujourd'hui. À lire avant toute intervention sur le moteur.
- `docs/referentiel/parametres.md` — tous les chiffres réglables (besoins, émotions, attirance,
  enquête, sommeil, rejouabilité, timing, géométrie), avec leur fichier source. Un rééquilibrage
  ne devrait jamais toucher un fichier sans passer par ce document, et inversement.
- `docs/referentiel/regles-du-temps.md` (2026-09-19) — traverse les deux documents ci-dessus par
  l'axe du temps plutôt que par sous-système : les deux horloges du jeu (tour narratif contre temps
  réel, jamais interchangeables), la chronologie théorique complète tour par tour, les trois états
  distincts du canal humain (preuves trouvées, appel lancé, canal réellement ouvert), et une
  checklist de cohérence temporelle pour tout nouveau seuil. À consulter avant d'ajouter ou modifier
  tout mécanisme sensible au temps, et à utiliser pour vérifier qu'un nouveau seuil ne chevauche pas
  imprévisiblement un mécanisme voisin.
- `docs/referentiel/regles-de-l-espace.md` (2026-09-19) — traverse les mêmes documents par l'axe de
  l'espace/des déplacements plutôt que par sous-système, sur le modèle de `regles-du-temps.md` :
  comment un personnage passe d'une intention narrative à une destination physique (ancres,
  `destinationAnchor`/`residentDestination`), le partage serveur (décide la pièce)/client (calcule
  le chemin BFS et anime la marche), le cas particulier du couloir (`exitInspection`, une scène hors
  modèle de pièces), et une checklist de cohérence spatiale. Créé pour vérifier, lors de l'analyse
  d'une simulation, ce que l'utilisateur ne voit pas lui-même (déplacements, gestion de l'espace) et
  pour préparer silencieusement la refonte graphique à venir.
- `docs/referentiel/regles-des-graphismes.md` (2026-09-19) — traverse le même ensemble par l'axe du
  graphisme, en préparation directe de la refonte : ce qui existe déjà factuellement (rendu,
  palette, éclairage, caméra fixe), le périmètre décidé (scène 3D ET interface web autour, hors
  identité de marque du site), et les décisions calibrées (vignette fixe, mode Observation/
  Instruments à la barre espace, caméra dynamique, transitions animées, contraste jour/nuit,
  trottoir à l'identité propre, détail réservé aux objets d'enquête). Base de jugement de
  THE-SCREENER une fois cet outil construit.
- `docs/referentiel/regles-de-la-memoire.md` (2026-09-21, tâche #175) — traverse les mêmes documents
  par l'axe de la mémoire, sur le modèle de `regles-du-temps.md`/`regles-de-l-espace.md` : les trois
  natures de mémoire à ne jamais confondre (persistée dans `Life`, technique anti-répétition,
  narrative méta), le plafonnage de chaque champ de `Life`, la règle transversale qu'aucune mémoire
  de personnage ne survit à un `reset`, et l'articulation avec memory-audit (l'outil qui la vérifie)
  et memento weight (qui mesure son poids, jamais son contenu). Comble le trou de nommage laissé par
  le retrait de l'ombrelle "MEMENTO" (cf. sections dédiées ci-dessous).
- `docs/referentiel/organisation-agence.md` (2026-09-22) — le référentiel CANONIQUE de
  l'organisation de l'outillage de travail, « l'Agence Codex » (nom choisi par l'utilisateur, en
  souvenir de Codex, l'IA qui a initialement produit le code de ce projet, à distinguer du jeu
  lui-même) : les deux axes jamais confondus (Statut de documentation Agent/Utilitaire nommé/
  Infrastructure ; Rôle dans l'organigramme Les Agents Cadre/Gardiens sacrés du code/Membre/VIP), les
  Gardiens sacrés du code (renommage de l'Équipe noyau, critère double exact — délivre un vrai scan
  de qualité ET tourne automatiquement à CHAQUE commit, jamais un seul des deux volets pris isolément
  — 5 membres depuis l'arrivée de CLONE-HUNTER le 2026-09-22), les 6 suites de travail parmi les
  Membres ordinaires (Suivi-Conso, Suite Audit Simulation, Suite Audit lourd, Dette & Structure du
  code, La Cour du Roi, plus Les Agents Spéciaux — Smart Breaker/CHECK-LEVEL-TARGET), les 3
  catégories définitivement hors de l'agence (Personnages, Moteur du jeu, code tiers vendu tel
  quel), et l'Infrastructure comme 3e rang d'employés sans dossier individuel. Consolide ce qui
  était dispersé entre `docs/cassandra-rh-conception.md` §4 (qui le référence désormais plutôt que
  de le dupliquer) et `docs/regles-de-travail.md` §7ter (qui reste la
  table maîtresse détaillée outil par outil, jamais dupliquée ici non plus). **C'est le domaine de
  CASSANDRA-RH** (`docs/referentiel/cassandra-rh.md`, noyau construit le 2026-09-21) — la tenue à
  jour de ce document à chaque changement d'organigramme reste manuelle pour l'instant, une future
  vague de construction, jamais encore automatisée par le noyau actuel.
- `docs/referentiel/tableau-de-bord.md` (2026-09-19, corrigé le 2026-09-21) — règles du tableau de
  bord/KPI interne (6 familles depuis l'ajout de Smart Conso API comme 6e le 2026-09-20, accès,
  alertes, cadence de mise à jour) : un outil d'observation à destination de l'utilisateur et de
  l'agent, strictement réservé à l'admin/créateur, jamais un mécanisme de jeu.
- `docs/referentiel/points-fragiles.md` (2026-09-19) — registre vivant des points identifiés comme
  fragiles ou en attente d'une décision de conception (pas des bugs actifs, ceux-là se corrigent
  directement) ; compté par `scripts/kpi-report.mjs` comme un des indicateurs de robustesse du code.
- `docs/referentiel/argus.md` (2026-09-19) — instanciation d'ARGUS (Article 20) pour ce projet :
  ce qui existe (`scripts/check-argus.mjs`), le registre des trous trouvés (`docs/argus/`), l'état
  du premier balayage complet. Cf. `docs/argus-blueprint.md` pour le principe générique.
- `docs/referentiel/harmonia.md` (2026-09-19) — instanciation d'HARMONIA (Article 20) pour ce
  projet : la carte des dépendances par grand thème (fatigue, cycle jour/nuit, enquête, bonus,
  appréciation, dossier, espace, relation Lia/Noé), les nœuds sensibles identifiés, le registre des
  frictions (`docs/harmonia/`). Cf. `docs/harmonia-blueprint.md` pour le principe générique.
- `docs/referentiel/smart-conso-api.md` (2026-09-19) — instanciation de Smart Conso API pour ce
  projet : le canal de consultation (`scripts/smart-conso-api.mjs`), le seuil dur actuel (2
  simulations confirmées par fenêtre de 6h, en attente de validation explicite), le registre des
  décisions (`docs/smart-conso-api/`). Cf. `docs/smart-conso-api-blueprint.md` pour le principe
  générique.
- `docs/referentiel/hyper-scan-checkpoint.md` (2026-09-19) — instanciation d'HYPER-SCAN-CHECKPOINT
  (Article 21) pour ce projet : l'orchestrateur (`scripts/hyper-scan-checkpoint.mjs`), son KPI
  central (taux de passages ayant trouvé une chose réelle), le registre des passages
  (`docs/hyper-scan-checkpoint/`). Cf. `docs/hyper-scan-checkpoint-blueprint.md` pour le principe
  générique.
- `docs/referentiel/check-level-target.md` (2026-09-19) — instanciation de CHECK-LEVEL-TARGET pour
  ce projet : les 4 niveaux et leurs outils associés, `scripts/check-level-target.mjs`, validé
  contre les vrais prompts historiques d'HYPER-SCAN-CHECKPOINT. Cf.
  `docs/check-level-target-blueprint.md` pour le principe générique.
- `docs/referentiel/the-king.md` (2026-09-21) — instanciation de THE-KING pour ce projet : les 6
  catégories de déclenchement, le parsing de `docs/philosophie-et-politique.md`
  (`scripts/the-king.mjs`), le digest de son évolution, la détection de tension possible entre deux
  principes, le registre (`docs/the-king/`). Cf. `docs/the-king-blueprint.md` pour le principe
  générique.
- `docs/referentiel/ines-official.md` (2026-09-21) — instanciation d'INES-official pour ce projet :
  les 2 périmètres (`scripts/ines-official.mjs`), l'annotation par stagnation CLEAN-DIRTY-OLD, le
  déclenchement périodique via CIRCLE-TASKS, l'index léger des métadonnées d'édition
  (`docs/ines-official/`). Cf. `docs/ines-official-blueprint.md` pour le principe générique.
- `docs/referentiel/always-new-code.md` (2026-09-19) — instanciation d'ALWAYS-NEW-CODE (Article 23)
  pour ce projet : les 8 zones (réutilisées d'HARMONIA), la rotation intelligente
  (`scripts/always-new-code.mjs`), le déclenchement via CHECK-LEVEL-TARGET niveau Exceptionnel, le
  registre des passages (`docs/always-new-code/`). Cf. `docs/always-new-code-blueprint.md` pour le
  principe générique.
- `docs/referentiel/memory-audit.md` (2026-09-21) — instanciation de memory-audit pour ce projet
  (conçu sous le nom "MEMENTO", ombrelle retirée le même soir) : cohérence mécanique de `lib/life.ts`,
  l'investigation préalable (Article 19) qui l'a précédée, l'exclusion documentée de CIRCLE-TASKS, le
  registre (`docs/memory-audit/`). Cf. `docs/memory-audit-blueprint.md` pour le principe générique.
- `docs/referentiel/memento-weight.md` (2026-09-21) — instanciation du voisin "memento weight" :
  poids réel du contexte envoyé à Gemini par tour, le patron de persistance réutilisé de
  `lib/gemini-keys.ts`, les deux fichiers séparés (`lib/memento-weight.ts` +
  `scripts/memento-weight.mjs`, ce dernier extrait le même soir de `scripts/memento.mjs`).
- `docs/referentiel/axa-check.md` (2026-09-19) — instanciation d'AXA-CHECK (Article 20) pour ce
  projet : la mécanique de couverture V8 par fonction (`scripts/axa-check.mjs`), la fragilité
  enrichie (nœuds sensibles HARMONIA + churn ALWAYS-NEW-CODE), la corroboration par les simulations
  archivées, le registre des trouvailles (`docs/axa-check/`). Cf. `docs/axa-check-blueprint.md`
  pour le principe générique.
- `docs/referentiel/find-booster.md` (2026-09-21, 5e motif ajouté le 2026-09-22, tâche #180) —
  instanciation de find-booster pour ce projet : les 5 motifs d'extraction réels (dont le
  commentaire dense non accolade-préfixé qui a fait passer route.ts de 10 à 125 entrées),
  `recommendFindBooster()` et sa preuve vivante (`lib/reference.ts`), l'obligation écrite d'usage
  réel, le statut sans blueprint de son voisin find-deep-booster (anciennement « route-booster »),
  le registre (`docs/find-booster/`).
  Cf. `docs/find-booster-blueprint.md` pour le principe générique.
- `docs/referentiel/clone-hunter.md` (2026-09-21) — instanciation de CLONE-HUNTER pour ce projet :
  l'algorithme de diff de blocs (`scripts/clone-hunter.mjs`), l'exclusion vérifiée de
  `components/ui/`, la trouvaille réelle (`loadJson()` dupliqué entre smart-conso-api.mjs et
  smart-conso-token.mjs), l'item `clone-hunter-run` de CIRCLE-TASKS, le registre
  (`docs/clone-hunter/`). Cf. `docs/clone-hunter-blueprint.md` pour le principe générique.
- `docs/referentiel/objectifs-vs-resultats.md` (2026-09-21, tâche #287) — instanciation d'objectifs-
  vs-resultats pour ce projet : le registre hand-maintained (`docs/objectifs-vs-resultats/registre.md`),
  les deux sources supportées (usage-count/found-rate, lues dans `.tool-usage-history.json`, jamais
  un second calcul), les statuts atteint/en dessous/dépassé/pas de données, le registre
  (`docs/objectifs-vs-resultats/`). Cf. `docs/objectifs-vs-resultats-blueprint.md` pour le principe
  générique.
- `docs/referentiel/cassandra-rh.md` (2026-09-21, tâche #184) — instanciation de CASSANDRA-RH pour
  ce projet : l'Agent Cadre RH (`scripts/cassandra-rh.mjs`) — effectif chiffré, supervision du
  badge (lit `checkAgentOnboarding()`, jamais ne le recalcule), lecture du KPI, outils à retirer/
  refondre, squelette de recrutement en 3 étapes — jamais un jugement automatique. Le récit complet
  des décisions de calibrage reste dans `docs/cassandra-rh-conception.md` (archivé, conservé comme
  fondation). Cf. `docs/cassandra-rh-blueprint.md` pour le principe générique.
- `docs/referentiel/clean-dirty-old.md` (2026-09-19) — instanciation de CLEAN-DIRTY-OLD
  (Article 20) pour ce projet : les seuils de stagnation relative, la priorisation par nœud
  sensible, les trois questions déléguées à ARGUS/HARMONIA/ALWAYS-NEW-CODE, le registre
  (`docs/clean-dirty-old/`). Cf. `docs/clean-dirty-old-blueprint.md` pour le principe générique.
- `docs/referentiel/check-tasks-details.md` (2026-09-20) — instanciation de CHECK-TASKS-DETAILS pour
  ce projet : le gabarit de calibrage (zoom × forme), les colonnes lues dans `docs/suivi/`
  (lecture seule), la consultation de `suggestPrestationsForTask()`, le mécanisme de vérification
  croisée (régression/stagnation), le registre (`docs/check-tasks-details/`). Cf.
  `docs/check-tasks-details-blueprint.md` pour le principe générique.
- `docs/referentiel/el-professor.md` (2026-09-19) — instanciation d'EL-PROFESSOR (Article 18, étape
  4bis) pour ce projet : les 5 thèmes exacts (esprit, naturel, voix, enquête + fidélité du dossier,
  clarté), le calcul plafonné par l'Article 0, le format de livraison en fichier, les paliers
  concrets du mode extrait isolé (ex. `check-spirit.mjs`, jamais couvert par la partie mécanique de
  couverture), le registre (`docs/el-professor/`). Cf. `docs/el-professor-blueprint.md` pour le
  principe générique, et `docs/simulations/correctifs-a-revalider.md` pour le carnet distinct de
  suivi des correctifs de code (jamais consulté par EL-PROFESSOR lui-même).
- `docs/referentiel/the-screener.md` (2026-09-19) — instanciation de THE-SCREENER (Article 18,
  étape 4bis) pour ce projet : base de jugement (`regles-des-graphismes.md`), mécanisme de capture
  Playwright (`scripts/the-screener-capture.mjs`, testé et fonctionnel), les 2 déclencheurs de
  capture, le registre (`docs/the-screener/`). Cf. `docs/the-screener-blueprint.md` pour le principe
  générique.
- `docs/referentiel/the-final-judge.md` (2026-09-20) — instanciation de THE-FINAL-JUDGE pour ce
  projet : le personnage FIXE donné à l'agent séparé (texte reproduit mot pour mot à chaque appel,
  jamais reformulé — garde-fou non négociable contre toute dérive vers un ton neutre), les deux axes
  croisables (6 paliers d'intensité, 4 paliers de périmètre), le coût réel en tokens et la règle de
  vigilance/parcimonie durable qui en découle, la dualité dev/production, le mandat
  sécurité/production explicite, les trois canaux de consultation (moi, l'utilisateur, les autres
  outils — détaillés dans `docs/regles-de-travail.md` §7ter), le registre (`docs/the-final-judge/`).
  Cf. `docs/the-final-judge-blueprint.md` pour le principe générique.
- `docs/referentiel/smart-conso-token.md` (2026-09-20) — instanciation de SMART-CONSO-TOKEN pour ce
  projet : le registre de schémas connus coûteux pour Claude (agent séparé, lecture exhaustive,
  poids d'un document toujours chargé) et ses sources, la vérification de fraîcheur de connaissance
  liée au modèle courant, le seuil dur proposé (pas encore validé), la capacité de scan réutilisant
  l'échelle de portée de THE-FINAL-JUDGE, le KPI dès la création, le registre
  (`docs/smart-conso-token/`). Cf. `docs/smart-conso-token-blueprint.md` pour le principe générique.
- `docs/referentiel/the-deep-reader.md` (2026-09-20) — instanciation de THE-DEEP-READER, cousin de
  THE-FINAL-JUDGE (même mécanique d'agent séparé, personas et règles d'entrée opposées : reçoit la
  conversation, jamais le code/produit) dédié à la relecture lourde du système de suivi
  (`docs/suivi/`) contre l'historique complet de la conversation. Coût variable (jamais fixe,
  contrairement à THE-FINAL-JUDGE), mêmes deux conseillers obligatoires avant lancement, registre
  dans `docs/suivi/relectures-lourdes/`. Aucun blueprint séparé (même statut que LE-COORDINATEUR).

Ces documents remplacent l'usage du référentiel d'origine (ci-dessous) comme source de
vérité (leur nombre exact a varié au fil des chantiers — se référer à la liste ci-dessus plutôt
qu'à un chiffre fixe, corrigé le 2026-09-19 après avoir constaté qu'il était resté à "quatre" alors
que la liste en comptait déjà six, exactement le genre d'écart que l'Article 13 est censé
empêcher). Ils doivent être mis à jour à chaque changement de règle ou de paramètre — un principe
ou un chiffre qui change dans le code et pas ici est une dette à combler tout de suite, pas plus
tard (Article 6/7/13).

Un troisième document existe et a un rôle différent : `lib/reference.ts` est le référentiel
**affiché en jeu** (panneau Admin, protégé par mot de passe), écrit en prose narrative et
versionné section par section (« Version 36 », etc.) — c'est le journal de bord technique que
Codex tenait à jour au fil des demandes, lisible par l'utilisateur lui-même. Il ne remplace pas
`docs/referentiel/` (qui reste la référence de travail pour tout agent codant) mais doit rester
factuellement exact : toute affirmation qui y décrit un comportement doit correspondre au code
réel, au même titre que `docs/referentiel/` (Article 6/13). Un changement d'architecture ou de
règle significatif se répercute donc potentiellement dans les trois documents, pas un seul.

## Simulations archivées — une source de vérification, pas un historique

`docs/simulations/` (créé le 2026-09-19, en urgence — onze simulations n'existaient plus que dans
un scratchpad éphémère, à un pas de disparaître) archive, pour chaque simulation Article 18 :
transcript complet, dossier retourné, et un résumé compact des actions
(`scripts/summarize-simulation-log.mjs`) extrait du journal JSON brut avant de le jeter (trop
volumineux pour être archivé lui-même — 0,6 à 5 Mo par simulation, décision explicite de
l'utilisateur). Registre complet : `docs/simulations/index.md`. Contrairement à
`docs/contexte-projet/` ci-dessous (consultable "en cas de doute", jamais une source de vérité), ce
dossier-ci EST une source de vérification active pour le réseau d'outils (Articles 20/23) : HARMONIA
peut confirmer qu'une règle documentée s'est vraiment produite en jeu, pas seulement que le code et
la doc s'accordent entre eux. Cf. Article 18, étape 3bis, pour la procédure répétée à chaque
nouvelle simulation.

## Documentation de contexte disponible

Le dossier `docs/contexte-projet/` contient les archives historiques transmises par
l'utilisateur, à consulter en cas de doute sur une décision de conception, jamais comme source de
vérité sur le comportement actuel. **Précision du 2026-09-19** : ce dossier contenait par erreur un
sous-dossier `simulations/` (full_sim4, dupliqué au moment d'archiver les autres simulations) —
retiré et consolidé dans `docs/simulations/` ci-dessus, le seul endroit désormais pour ce type de
contenu :

- `referentiel-maison-v34-origine.txt` — référentiel fonctionnel d'origine (version 34, produit
  par Codex). **Document historique uniquement**, superseded par `docs/referentiel/` ci-dessus :
  il contient des incohérences connues (numérotation de sections dupliquée, règles contradictoires
  par sédimentation) que la restructuration a justement corrigées.
- `journal-dialogue-exemple.txt` — extrait réel d'une session de jeu, référence de ton et de
  qualité déjà atteinte à préserver (cf. Article fondateur et Article 1).
- `analyse-opus-initiale.txt` — diagnostic technique et artistique produit par Claude Opus avant
  la reprise du projet ; base du plan de travail (séparation des deux cerveaux, désaturation
  visuelle, rééquilibrage des jauges, mise en scène de la révélation finale, etc.).
- `historique-prompts-codex.txt` — historique complet des échanges avec Codex ayant produit le
  code actuel ; utile pour comprendre pourquoi une décision de conception a été prise.

## Plan d'origine (analyse Opus) — état d'avancement

`docs/contexte-projet/analyse-opus-initiale.txt` (décrit ci-dessus) proposait un plan en 7
chantiers, dans un ordre délibéré (chaque étape facilite la suivante). État vérifié dans le code
le 2026-09-16, pas seulement dans le référentiel qui se décrit lui-même :

1. Restructurer le référentiel en principes + paramètres — **fait**.
2. Séparer les deux cerveaux (un appel Gemini par personnage) — **fait**.
3. Rééquilibrer les besoins, rendre la relation réversible, recaler l'arc relationnel pour
   culminer après la révélation — **partiellement fait** : la réversibilité existe (une perte de
   confiance ou des rapprochements trop rapides font redescendre attirance et attachement, cf.
   `parametres.md`), mais le calage précis de l'arc relationnel par rapport à la révélation n'a
   pas été vérifié par une simulation réelle — à confirmer en jouant plusieurs sessions, pas
   seulement en lisant le code. **Chantier 3 investigué le 2026-09-21 (sans nouvelle simulation,
   comme demandé) : l'anomalie loveRealized diagnostiquée et corrigée.** Root-cause confirmée en
   relisant les 14 simulations archivées : un tour solo (pièces séparées) effaçait TOUTE variation
   d'attirance proposée par le modèle, cumulé au système de crédit de 28 % qui throttle déjà les
   tours ensemble — le seuil de 75 % n'avait donc jamais été franchi une seule fois depuis
   l'introduction de ce mécanisme (2026-09-18), y compris sur une session de 229 tours (full_sim16).
   Corrigé (`app/api/lia/route.ts`) : seule la moitié d'une hausse solo survit désormais (avant de
   repasser par le même crédit de 28 %) ; une baisse solo reste entièrement effacée. Reste à
   confirmer via une prochaine simulation réelle (`docs/simulations/correctifs-a-revalider.md`,
   0/2) — le calage précis de l'arc par rapport à la révélation reste donc toujours à vérifier en
   jouant, cette correction rend seulement la culmination structurellement possible.
4. Remplacer le visage emoji par une forme abstraite, désaturer la palette, ajouter une lumière
   directionnelle et une vignette — **largement fait, corrigé le 2026-09-19** (ce point affirmait
   à tort depuis sa rédaction que le visage restait un emoji — trouvé faux en vérifiant directement
   le code lors d'un audit de l'état des chantiers, exactement le genre d'écart doc/code que
   l'Article 13 est censé empêcher). Le visage emoji a en réalité été remplacé dès la **Version 40**
   (2026-09-17, cf. `lib/reference.ts`) par un visage vectoriel à paramètres, dessiné en temps réel
   depuis l'état émotionnel réel (`faceExpression()`, `lib/simulation.ts`) — le point qu'Opus jugeait
   le plus coûteux visuellement EST fait. La palette des sols est désaturée (`lib/perception.ts`,
   `scenePalette.floors`) et une lumière directionnelle chaude existe (`components/house-view.tsx`).
   Seule reste manquante : **aucune vignette sur la scène 3D**.
5. Passer en plein écran avec un mode Observation (3 jauges) par défaut et un mode Instruments
   (toutes les jauges) en option — **non fait**.
6. Mettre en scène la révélation finale (musique qui se coupe, caméra qui descend, panneaux qui
   se rétractent, anneaux qui se tournent vers l'observateur) — **non fait** : le déverrouillage
   du canal humain reste un changement de classe CSS sur le champ de saisie (`app/page.tsx`,
   `composer ... unlocked`), exactement ce qu'Opus décrivait comme insuffisant.
7. Mécaniques de diffusion (export de clips automatique, maison unique partagée) — **non
   commencé**, dernier de la liste par la propre priorisation d'Opus.

Ces trois derniers points (5, 6, 7) sont la couche « immersion/buzz » qu'Opus jugeait secondaire
à la refonte moteur — volontairement reportée pendant que la priorité allait au filet de sécurité
et à la cohérence charte/référentiel. Ils restent ouverts, pas oubliés.

**Feuille de route actée avec l'utilisateur le 2026-09-19** (audit complet des chantiers ouverts,
questions de calibrage explicites) : les points 4 (vignette restante), 5 et 6 ci-dessus forment
ensemble « la refonte graphique », un seul chantier visuel à mener groupé. Ordre convenu :
1. **Avant la refonte graphique** — chantier n°3 ci-dessus (arc relationnel Lia/Noé), y compris
   investiguer une anomalie repérée le même jour : `loveRealized` (doute amoureux privé, seuil 75 %
   d'attirance) est resté vide des deux côtés sur toute une simulation fraîche ayant pourtant
   dépassé la révélation (round 46) jusqu'au round 59 — l'attirance n'a peut-être jamais franchi ce
   seuil, à diagnostiquer avant de considérer le calage de l'arc confirmé.
2. **Tout de suite, indépendamment du planning** — **fait le 2026-09-19** : popup de saisie du
   pseudo avec validation de format + choix d'identité de genre (masculin/féminin) + popup de mise
   en garde légale renforcée + popup de bienvenue, les trois affichées une fois par navigateur
   (`app/page.tsx`) ; correction du vrai bug de répétition du mot « autant » (persisté sur toute la
   session via `life.wordFrequency`, cf. `lib/dialogue.ts` — l'écart n'était PAS déjà couvert,
   contrairement à ce qui était supposé ici avant investigation) ; rotation adaptative des clés
   Gemini (recul exponentiel automatique) ; **bouton « passer à la révélation »** — jamais mentionné
   dans les chantiers en suspens jusqu'à ce que l'utilisateur le signale explicitement le 2026-09-19,
   retrouvé nulle part dans l'historique malgré une recherche exhaustive de la session, donc
   entièrement respécifié via dix questions de calibrage puis implémenté et testé le même jour
   (`mode:"skip_to_revelation"`, cf. `docs/referentiel/principes.md` 8.21 et `parametres.md` pour le
   détail complet).
3. **Fait le 2026-09-19** — `docs/referentiel/regles-des-graphismes.md` créé, sur le modèle de
   `regles-du-temps.md`/`regles-de-l-espace.md`, en préparation directe de la refonte graphique.
   Calibré via trois séries de questions successives à la demande explicite de l'utilisateur
   (« pose moi plein de questions pour bien préparer tous les aspects »), après qu'un tout premier
   jet rédigé sans calibrage a été jugé insuffisant — jamais recommencé silencieusement à l'identique
   depuis. Décisions actées qui élargissent le périmètre au-delà des points 4/5/6 ci-dessous :
   caméra dynamique pendant le jeu normal (pas seulement fixe), transitions animées entre pièces,
   refonte de toute l'interface web autour de la scène 3D (pas seulement la maison), contraste
   jour/nuit visible dans l'éclairage, mode Observation (Faim/Fatigue/Incertitude d'humanité) et
   Instruments basculés à la barre espace (hors du champ de saisie, conflit de frappe déjà résolu),
   trottoir à l'identité visuelle propre, rendu des objets plus soigné (lumière/matières/ombres)
   avec un supplément de détail réservé aux seuls objets clés de l'enquête. **Hors périmètre,
   explicitement reporté mais signalé important et urgent vu la mise en ligne prochaine** :
   l'identité de marque du site (nom, nom de domaine, logo) — à reprendre avant la mise en ligne,
   pas oublié. Détail complet et à jour dans le document lui-même (Article 13).
4. **La refonte graphique** (points 4/5/6 groupés). **Exigence ajoutée le 2026-09-19** (retour
   utilisateur explicite sur un transcript réel, full_sim8) : `scenePalette` (`lib/perception.ts` —
   couleurs des sols, murs, motifs) existe déjà en données mais n'est actuellement JAMAIS transmise
   au modèle qui génère le dialogue — seul le rendu 3D (`components/house-view.tsx`) l'utilise. Les
   personnages ne décrivent donc presque jamais les couleurs réelles qui les entourent. À corriger
   dans le cadre de ce chantier (pas avant, car coder une description figée des couleurs ACTUELLES
   deviendrait fausse dès que la palette change avec la refonte) : le prompt doit lire
   dynamiquement `scenePalette` au moment de la génération, jamais une valeur codée en dur, pour que
   la description suive automatiquement tout changement de décor. Règle générale à vérifier en même
   temps, demandée explicitement : les personnages décrivent toujours le monde TEL QU'IL EST
   AFFICHÉ au moment présent, jamais une référence à un ancien décor ni à l'historique du code —
   condition de base de l'immersion, à re-vérifier après chaque changement visuel. **Ajouté le
   2026-09-19, trouvé par ARGUS puis confirmé avec l'utilisateur** : le bonus `trottoir` reste
   aujourd'hui un instant narré (la porte s'entrouvre deux secondes, résolu entièrement par une
   réplique instantanée, cf. `docs/referentiel/parametres.md`) — jamais une zone 3D pathable comme
   le jardin, décision déjà assumée par l'utilisateur (« on verra après »). À faire pendant ce
   chantier, pas avant : donner au trottoir une vraie géométrie marchable, cohérente avec le reste
   de la refonte plutôt que codée en dur avant que le décor final soit connu.
5. **Après la refonte graphique** — chantier n°7 (mécaniques de diffusion), dernier de la liste par
   la propre priorisation d'Opus, confirmée par l'utilisateur.
6. **Après la refonte graphique également** — revoir le texte de la popup de bienvenue (`app/page.tsx`, section
   `welcomeOpen`) : version actuelle volontairement provisoire, à retravailler une fois l'habillage
   visuel du jeu stabilisé plutôt que de la peaufiner avant un changement de decor qui pourrait la
   rendre obsolète.
