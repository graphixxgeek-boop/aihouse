# Utilité des descriptions d'outils dans CLAUDE.md vs la Ronde — dossier de conception (préliminaire, non exécuté)

*(2026-09-22, question directe de l'utilisateur : « mettre les outils dans claude.md ne sert à rien
la plupart du temps : il vaut mieux se reposer sur la ronde ? [...] je veux comprendre l'utilité de
mettre les outils de scan par ex, dans claude.md. peux tu verifier la pertinence des elements
presents dans claude.md et si ca t'apporte vraiment quelque chose ? est-ce qu'un outil peut t'aider
à faire ce travail, regarde. » Investigation faite le même soir, consignée ici sur demande explicite
(« mets ca sur la to do avec fichier stp ») — aucune modification de CLAUDE.md exécutée ce soir,
strictement une analyse.)*

## 1. La question posée, reformulée précisément

CLAUDE.md est un document TOUJOURS CHARGÉ (cf. Article 122/123, `docs/referentiel/smart-conso-token.md`)
— chaque token qu'il contient a un coût réel à CHAQUE tour de conversation. Les 6 Gardiens sacrés du
code (ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD/CLONE-HUNTER/ALWAYS-NEW-CODE léger) tournent
AUTOMATIQUEMENT à chaque commit via le crochet post-commit, indépendamment de ce que CLAUDE.md dit
d'eux — leur EXÉCUTION ne dépend donc jamais de leur description dans ce document. La Ronde
CIRCLE-TASKS, de son côté, centralise déjà la plupart des tâches périodiques gratuites dans une
seule fenêtre à cocher. D'où la question réelle : décrire ces outils dans CLAUDE.md apporte-t-il
encore quelque chose à l'agent qui pilote, ou est-ce un texte qui pourrait être coupé/déplacé sans
perte réelle, l'exécution mécanique + la Ronde suffisant déjà ?

## 2. Outil déjà existant qui répond directement à cette question

**`CLAUDE_MD_INCLUDE_EXCLUDE`** (`scripts/smart-conso-token.mjs`, recherche officielle Anthropic du
2026-09-20, partie de CHARTER-SPY) porte déjà exactement le test recherché ici — jamais un nouvel
outil à construire, juste à appliquer avec ce lens précis :

> « Pour chaque ligne : la retirer ferait-elle faire une erreur à l'agent ? Si non, elle est
> candidate au retrait ou au déplacement vers un document lu à la demande. »

Sa liste `exclure` nomme déjà, sans le savoir spécifiquement pour ce cas, exactement le type de
contenu en question : « documentation d'API détaillée (un lien suffit) », « longues explications ou
tutoriels », « description fichier par fichier du dépôt ». Sa liste `inclure` nomme le contraire :
« commandes shell que l'agent ne devinerait pas », « pièges/comportements non évidents déjà
rencontrés ».

**Limite honnête de l'outil qui existe déjà** : `extractRuleUnits()`/`buildClaudeMdRuleTable()`
(le reste de CHARTER-SPY) ne segmentent le document que par **Article** (`**Article N — Titre.**`)
— le contenu intercalé entre deux Articles (le bloc « Blocage de quota Gemini... Smart Breaker »
entre l'Article 19 et l'Article 20, entre autres) est rattaché à l'article PRÉCÉDENT dans cette
découpe, jamais analysé comme un bloc à part avec son propre score d'importance/redondance — un
angle mort déjà noté dans le code de la fonction elle-même (`docs/referentiel/smart-conso-token.md`
n'en tire pas encore les conséquences pour CE cas précis).

## 3. Verdict, appliqué au vrai contenu de CLAUDE.md ce soir

Deux catégories de contenu, jamais traitées pareil :

- **La RÈGLE COMPORTEMENTALE** (« avant toute action coûteuse, consulter Smart Conso API », Article
  22 ; « les 6 Gardiens tournent à chaque commit », Article 20 ; le pointeur d'une ligne vers
  `docs/referentiel/<outil>.md`) — passe le test `CLAUDE_MD_INCLUDE_EXCLUDE` haut la main : la
  retirer ferait réellement faire une erreur à l'agent (oublier de consulter, oublier qu'un outil
  existe pour une tâche donnée). Rien à couper ici, et la Ronde ne remplace jamais cette fonction :
  elle exécute les outils gratuits périodiquement, elle ne remplace jamais la RÈGLE qui dit à
  l'agent QUAND consulter un outil non automatique en dehors d'une Ronde.
- **Le MÉCANISME NARRATIF** (comment fonctionne exactement le recul exponentiel des clés Gemini, les
  formules de cooldown, l'historique des blocages passés) — échoue le même test : cette logique est
  déjà entièrement implémentée dans le code (`lib/gemini-keys.ts`, `scripts/gemini-key-health.mjs`),
  l'agent n'a jamais besoin de la reproduire à la main, seulement de savoir qu'elle existe. C'est
  très exactement ce que l'Article 13 de CLAUDE.md dit déjà lui-même de son PROPRE contenu (« la
  justification narrative de QUAND et POURQUOI une règle a été ajoutée [...] vit dans
  `docs/referentiel/smart-breaker-historique.md` [...] plutôt que mêlée à la règle elle-même ») —
  mais cette discipline n'a pas encore été appliquée jusqu'au bout à la section Smart Breaker
  elle-même, qui reste la plus longue et la plus mécanique de tout le document.

**Mesure réelle faite ce soir** (`CLAUDE.md`, du titre « Blocage de quota Gemini » à juste avant
« Double lecture en parallèle ») : **~11 280 caractères, ~2 820 tokens estimés** — soit environ 9,5%
du poids total actuel de CLAUDE.md (~29 600 tokens). Une bonne partie de ce volume est narrative
(formules de cooldown exactes, historique de découverte) plutôt qu'une règle que l'agent doit
retenir à chaque tour.

## 4. Réponse directe à la question posée

**Oui, se reposer sur la Ronde pour l'EXÉCUTION est déjà le bon réflexe** — les Gardiens tournent
sans avoir besoin d'être décrits en détail dans CLAUDE.md, et CIRCLE-TASKS centralise déjà le reste.
**Non, ça ne rend pas CLAUDE.md inutile pour autant** — la RÈGLE (quand consulter quoi, quelle
discipline suivre) doit rester quelque part que l'agent relit à chaque tour, et rien d'autre ne
force cette relecture aujourd'hui. Ce qui est réellement candidat à un allègement n'est donc jamais
« retirer la mention des outils » en bloc, mais spécifiquement **le mécanisme narratif détaillé
d'un outil déjà entièrement implémenté en code** — la section Smart Breaker en étant l'exemple le
plus net et le plus lourd trouvé ce soir.

## 5. Ce qui reste entièrement à faire (rien exécuté ce soir)

- Une vraie passe d'allègement CIBLÉE sur le bloc Smart Breaker (et tout autre bloc intercalé
  similaire trouvé en le cherchant systématiquement), suivant la procédure déjà formalisée dans
  `docs/referentiel/smart-conso-token.md` (scanner/identifier/trier/archiver/vérifier/documenter) —
  jamais un retrait à l'aveugle, jamais sans vérifier que le contenu archivé existe déjà bien dans
  `docs/referentiel/smart-breaker-historique.md`/`docs/outil-resilience-api.md` avant de couper.
- Décider si `extractRuleUnits()` (CHARTER-SPY) doit être étendu pour segmenter aussi les blocs
  intercalés comme des unités à part (avec leur propre score), ou si l'analyse manuelle ponctuelle
  (comme celle menée ce soir) suffit pour ce cas isolé — question ouverte, pas tranchée ici.
- Vérifier si d'autres blocs intercalés du même type existent ailleurs dans CLAUDE.md au-delà de
  Smart Breaker (recherche non exhaustive ce soir, limitée à la question posée).

## 6. Statut

Analyse faite et consignée, aucune modification de CLAUDE.md exécutée. Reprise le jour où
l'utilisateur le demande explicitement, jamais engagée d'elle-même (même discipline que les autres
fichiers de conception de ce dossier).
