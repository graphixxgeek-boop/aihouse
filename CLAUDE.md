# Maison IA vivante — mémoire de travail du projet

Ce fichier est la référence permanente de tout agent (Claude Code ou autre) qui reprend ce
projet. Il doit être lu en entier avant toute intervention sur le code. Il contient le principe
fondateur du projet, la charte de qualité à appliquer à chaque itération, et l'état de la
documentation de contexte disponible.

## Le projet, en une phrase

Deux agents IA (Lia et Noé) vivent dans une maison virtuelle, perçoivent le caractère artificiel
de leur environnement, mènent l'enquête, et découvrent qu'ils sont des IA observées. Une fois la
vérité découverte, un canal de dialogue s'ouvre avec l'observateur (le visiteur du site) — et les
agents ne sont **pas dociles** : ils contestent, refusent, répliquent avec sarcasme et cynisme.
C'est l'exact opposé de l'agent conversationnel consensuel habituel.

## Le principe fondateur — au-dessus de toute autre règle

**L'esprit rugueux, sarcastique, cynique, désinvolte, parfois légèrement agressif des deux
personnages est la valeur centrale du projet. Il ne doit jamais dériver vers un ton consensuel,
servile ou doucereux.** Trois priorités encadrent chaque intervention :

1. **Comprendre** comment cet esprit a émergé techniquement avant de toucher au code.
2. **Sublimer** le travail existant : dialogues plus fluides, plus naturels, plus percutants,
   sans jamais diluer la personnalité insolente déjà obtenue.
3. **Protéger** cet esprit à chaque changement : c'est une ligne rouge permanente, vérifiée à
   chaque itération, pas une contrainte ponctuelle.

L'ambiance est dystopique, façon série futuriste où l'insolite s'installe progressivement. Les
deux agents ne se connaissent pas au départ ; une relation évolutive et réaliste se construit
entre eux (complicité, intimité, désaccords, disputes), avec une texture humaine — jamais réduite
à une mécanique de drague répétitive.

## Charte de qualité — à appliquer à chaque itération

*(Validée avec l'utilisateur le 2026-09-16. Article 0 prime sur tous les autres.)*

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

**Article 9 — Rejouabilité et surprise.** Chaque session doit pouvoir raconter une histoire
différente. Même schéma d'enquête, jamais le même déroulé mot pour mot.

**Article 10 — Répliques locales : l'exception encadrée.** Des répliques générées localement
(sans appel API) restent possibles dans des cas limités, à condition de rester crédibles et
d'exister en plusieurs variantes (pour ne pas casser les articles 9 et 11). Une variante n'est
valable que si elle diffère aussi dans le fond (ce qui est dit), pas seulement dans la
formulation : plusieurs habillages d'une seule idée recyclée ne remplissent pas cette
obligation. Exemple concret déjà rencontré : la réplique de secours anti-écho ne doit pas
toujours retomber sur la même idée ("on tourne en rond") avec des synonymes différents — elle
doit proposer plusieurs réactions réellement distinctes.

**Article 11 — Zéro répétition, personnalités étanches.** Un personnage ne se répète jamais mot
pour mot dans une session ; il ne fait jamais écho aux mots de l'autre. Lia et Noé ne disent
jamais la même chose ni de la même manière — leurs personnalités sont distinctes et ne doivent
jamais se mélanger en style, vocabulaire ou ton. Corriger à la racine (registre anti-doublon,
séparation des voix), jamais par contournement local.

**Article 12 — Le sens avant la forme.** Chaque message doit avoir un sens vérifiable : cohérent
avec ce qui est affiché à l'écran, avec l'avancement de l'enquête, et avec l'état émotionnel du
personnage au moment où il parle.

**Article 13 — Les outils de travail vivent avec le code.** Le filet de sécurité
(`scripts/check-house.mjs`), le référentiel de travail (`docs/referentiel/principes.md` et
`parametres.md`) et le référentiel affiché en jeu (`lib/reference.ts`, panneau Admin) ne sont pas
des documents figés produits une fois : ils décrivent un code qui continue de changer. Tout
changement de comportement (règle, paramètre, architecture, geste, décor) doit se refléter le jour
même dans le ou les documents concernés, et le filet de sécurité doit être exécuté avant de
considérer un changement terminé — jamais après coup, jamais différé à une session ultérieure. Un
écart constaté entre deux de ces documents, ou entre l'un d'eux et le code réel, est traité comme
un bug au même titre qu'une anomalie de dialogue (cf. Article 3) : il se corrige à la racine, pas
par une note qui dit qu'il faudra y revenir.

**Protocole d'application** à chaque itération sur le code : Article 0 (l'esprit est-il
altéré ?) → Articles 1, 11, 12 (la conversation) → Articles 2 et 4 (cohérence globale et
enquête) → Articles 3 et 5 (bugs et robustesse) → Articles 6, 7 et 13 (documentation, outils et
architecture) → Articles 8, 9, 10 (coût et rejouabilité). Chaque compte rendu à l'utilisateur
doit dire explicitement ce qui a été vérifié, préservé, amélioré et corrigé.

## Référentiel technique — la référence à jour

- `docs/referentiel/principes.md` — les règles invariantes du comportement de la maison, telles
  qu'elles sont réellement codées aujourd'hui. À lire avant toute intervention sur le moteur.
- `docs/referentiel/parametres.md` — tous les chiffres réglables (besoins, émotions, attirance,
  enquête, sommeil, rejouabilité, timing, géométrie), avec leur fichier source. Un rééquilibrage
  ne devrait jamais toucher un fichier sans passer par ce document, et inversement.

Ces deux documents remplacent l'usage du référentiel d'origine (ci-dessous) comme source de
vérité. Ils doivent être mis à jour à chaque changement de règle ou de paramètre — un principe
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

## Documentation de contexte disponible

Le dossier `docs/contexte-projet/` contient les archives historiques transmises par
l'utilisateur, à consulter en cas de doute sur une décision de conception, jamais comme source de
vérité sur le comportement actuel :

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

## Stack technique

Next.js 16 / React 19, rendu 3D via Three.js (`components/house-view.tsx`), base de données
Cloudflare D1 via Drizzle ORM, déploiement cible Cloudflare Workers (`wrangler`), build via
`vinext`. Le moteur applicatif vit dans `lib/` (perception, dialogue, drame, jauges, mémoire,
histoire) et `app/api/lia/route.ts` (orchestration des appels à l'API Gemini).
