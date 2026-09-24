# Plan complet, jusqu'au renommage en masse

*(Écrit le 2026-09-24, APRÈS la reprise des notes — la règle qu'il venait de poser, appliquée à
sa propre demande. Sa consigne : « detaille ton plan APRES AVOIR retrouvé TOUTES les notes, de tous
les chantiers ». Ce document remplace la version que j'aurais écrite de mémoire, et il est
différent.)*

---

## CE QUE LA REPRISE DES NOTES A CHANGÉ AU PLAN

Huit sujets balayés (`data-archangel notes`) : nomenclature, classification, organisation, export,
fusion, poids, renommage, version, compactage. **Quatre découvertes changent le plan, pas son
détail : sa structure.**

### 1. LE-GRAND-ARCHITECTE est déjà conçu — et jamais construit

C'est la découverte majeure. Un dossier de conception complet de 91 lignes
(`docs/le-grand-architecte-conception.md`) existe depuis le 2026-09-21, né d'une demande explicite :

> « il y a un agent script derriere "organisation globale" qui est capable d'evaluer l'organisation
> generale et de faire des recommandations si besoin [...] il travaille en lien avec les agents
> correspondants, il a des liens privilégiés avec cassandra, avec tool-brain »

**Statut écrit dans le référentiel : « proposition, ajoutée à la liste des chantiers, aucun code
écrit ».** Trois jours.

**Et c'est exactement l'outil que je proposais de créer hier soir sous le nom de « fiche agrégée »**
(tâche #757). Même rôle, même principe anti-doublon — « ne recalcule JAMAIS ce que d'autres outils
savent déjà, il les LIT ». **La tâche #757 n'est donc pas un outil neuf : c'est LE-GRAND-ARCHITECTE
qui attend depuis trois jours.**

### 2. Un document mère de l'organisation existe, et je ne l'avais jamais lu

`docs/referentiel/organisation-globale-projet.md` — la carte des documents d'organisation par pôle,
les deux mondes du projet. C'est le document contre lequel la réconciliation des familles (#754)
doit se faire, et je m'apprêtais à la faire sans lui.

### 3. Une carte des critères transversaux existe déjà

`docs/plans/criteres-transverses-2026-09-23.md`. Son constat vaut pour tout le chantier :
**« quelque chose est déclaré quelque part et n'existe pas vraiment »** — quarante fonctions, seize
outils, toutes sur ce motif. C'est le même motif que les treize classifications qui divergent.

### 4. Un plan d'action global existe depuis le 22 septembre

`docs/plans/plan-action-global-2026-09-22.md`. J'allais en écrire un neuf sans le lire. Celui-ci le
prolonge, il ne le remplace pas.

---

## LES SIX ÉTAPES, ET POURQUOI L'ORDRE EST CONTRAINT

### Étape 1 — RÉCONCILIER (avant tout le reste)

*Tâches #754, #755, #756.*

Rien ne peut s'empiler sur treize classifications qui divergent. Trois gestes :

- **Un seul système de familles.** 6 Suites contre 9 familles, un seul nom commun. Le détecteur
  existe depuis ce soir (`comparerLesFamilles`) et rapporte l'écart à chaque passage. **Le choix du
  système survivant est un NOMMAGE, donc ta décision** — c'est le seul point où l'étape 1 t'attend.
- **Un garde-fou pour les quatre axes tenus à la main** (`AGENT_CATEGORIES`, `TOOL_PORTEE`,
  `TOOL_RELIABILITY`, `family`). Le patron existe déjà huit fois dans le dépôt.
- **Renommer l'une des deux constantes `DOMAINES`** homonymes, avec l'agent des noms pour mesurer
  le risque avant.

**Pourquoi d'abord** : chaque axe ajouté avant hérite de l'ambiguïté. On empilerait sur un sol qui
bouge.

### Étape 2 — COMPLÉTER LES AXES

*Tâches #741, #750 (faite).*

Le 5e axe — **à qui ça sert** : le projet entier · les autres outils · l'agent · l'utilisateur.
Les 3e et 4e (le moment, le domaine) tournent déjà.

**Attention, une note l'a rattrapé** : le test d'utilité à 4 destinataires existe déjà dans
`docs/regles-de-travail.md` §3bis, jamais mécanisé. Le 5e axe le MÉCANISE, il ne l'invente pas.

### Étape 3 — MESURER LE POIDS

*Tâche #744.*

Pour chaque outil : lignes, part du dépôt, part du temps d'exécution. Pour l'Agence entière : sa
version, son poids total, ses seuils de compactage. **Et le coût d'une migration dans les deux
sens** — promouvoir un utilitaire, ou rétrograder un agent.

Ta formule est le critère : *« c'est chez qui ? c'est un sujet export »*. Un outil qui part doit
emporter tout ce qui est chez lui et rien de ce qui est chez les autres.

**Repère déjà mesuré à la main** : outillage 44 283 lignes contre 12 815 pour le jeu, soit 3,6 ×.

### Étape 4 — CONSTRUIRE LE-GRAND-ARCHITECTE

*Tâche #757, requalifiée.*

Il agrège les étapes 1 à 3 et rend la fiche par outil : c'est quoi, ça sert à qui, ça pèse combien,
que coûterait de s'en passer. **Sa conception est écrite, il ne reste qu'à le construire** — et son
principe fondateur est déjà posé : il ne recalcule jamais, il lit.

**Pourquoi pas plus tôt** : un agrégateur construit sur des axes qui divergent agrégerait la
divergence.

### Étape 5 — DÉCIDER : fusion, rétrogradation, compactage

*Tâche #745.*

C'est seulement ici que « peut-on réduire le nombre d'agents ? » devient une vraie question, parce
que c'est ici qu'on a les chiffres. Une fusion décidée avant l'étape 1 est une fusion décidée sur
des noms.

**Le sujet mis de côté est retrouvé** : `toolsToReconsider()` (CASSANDRA-RH) combine déjà les outils
jamais sollicités et la stagnation relative, sous le nom de « rapport de licenciements », conçu le
2026-09-22. Il existe et n'a jamais servi à une décision.

### Étape 6 — NOMMER, puis RENOMMER

*Tâches #747, #740, #706.*

La nomenclature ne peut se fixer qu'ici : le code reflète la classe, et la classe ne devient stable
qu'après l'étape 5.

**Et la reprise des notes a corrigé la question elle-même.** Ton idée de code portait d'abord sur un
**NIVEAU DE MATURITÉ 0/1/2/3** (restaurée, #761), pas sur un code de classes. Les deux sont
compatibles mais ne se codent pas pareil :

| Ce que le code encode | Longueur | Stabilité |
|---|---|---|
| le niveau de maturité (ton idée du 21) | **1 chiffre** | change rarement |
| la classe (ton idée du 24) | 2 à 3 lettres | change à chaque reclassement |

**Ma recommandation reste la même, et elle est renforcée** : le code se DÉCLARE en tête de fichier
et s'AFFICHE en préfixe, il ne vit pas dans le nom de fichier — sinon chaque reclassement coûte un
renommage complet. Avec le niveau de maturité en plus, ce serait deux renommages au lieu d'un.

Puis le renommage en masse, via l'agent des noms, qui déplace le code vivant et laisse l'histoire
intacte.

---

## CE QUI N'EST PAS DANS CE PLAN, ET POURQUOI

- **La refonte graphique** (#92, #237, #236) — ta limite explicite, elle t'appartient.
- **Le jeu lui-même** — aucune de ces étapes ne le touche. C'est voulu : le site reste le juge de
  dernier ressort, et ce chantier sert l'Agence.
- **Les 8 constats DEEP-READER** (#227 à #234) — un est fermé ce soir (#227), sept restent. Ils ne
  bloquent aucune étape mais ils dorment depuis le 23 septembre.

## PLAN D'ACTION

- **RETENU** — Étape 1, les trois gestes de réconciliation → **#754**, **#755**, **#756**
- **RETENU** — Étape 2, le 5e axe → **#741**
- **RETENU** — Étape 3, le poids et le coût de migration → **#744**
- **RETENU** — Étape 4, construire LE-GRAND-ARCHITECTE → **#757** *(requalifiée : l'outil est déjà
  conçu, pas à concevoir)*
- **RETENU** — Étape 5, la fusion sur les chiffres → **#745**
- **RETENU** — Étape 6, la nomenclature puis le renommage → **#747**, **#740**
- **À TRANCHER** — Quel système de familles survit → **#754**
- **À TRANCHER** — Le désaccord `pnpm-install` → **#739**
