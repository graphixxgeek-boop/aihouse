# Cartographie de la charte (CLAUDE.md)

*(Généré le 2026-09-26 par `node scripts/moise-tables-de-loi.mjs cartographie`. Document de TRAVAIL de l'agent, jamais destiné à l'utilisateur — sa vision à lui est la synthèse stratégique, `node scripts/moise-tables-de-loi.mjs synthese`. Régénérable à volonté : les natures marquées « décidé » sont relues et reprises telles quelles, jamais écrasées.)*

**FRONTIÈRE AVEC `docs/referentiel/claude-md-regles.md`, ÉCRITE ICI PLUTÔT QUE SUPPOSÉE** *(2026-09-26, tâche #978)* : les deux documents parcourent CLAUDE.md Article par Article, et aucun des deux ne citait l'autre — deux inventaires du même document qui divergent en silence sont le risque que l'Article 24 nomme. **Celui-ci dit ce qu'il FAUT FAIRE de chaque Article** (sa nature, et le geste qu'elle commande : intouchable, réductible, remplaçable). **L'autre dit ce que chaque Article EST** (sensibilité, importance, nombre de références croisées, nombre de lignes). On lit celui-ci avant de décider d'un allègement, l'autre pour savoir à quoi on touche. Les deux sont générés par le même outil et se régénèrent ensemble.

**État mesuré** : 1267 lignes · ~25800 tokens estimés · 192 obligations pour 125 réellement suivables (au-delà du budget).

## Les quatre natures, et le geste que chacune commande

- **LOI** — intouchable — doit rester sous les yeux en permanence
- **MODE D'EMPLOI D'OUTIL** — réductible à un aiguillage : le déclencheur + un renvoi vérifié
- **DISCIPLINE SANS PORTEUR** — substance intouchable (la prose EST le mécanisme, Article 27) ; seule la genèse datée peut partir
- **INVENTAIRE** — remplaçable par une convention, à condition d'un garde-fou mécanique (Article 24)

## Article par Article

| Art. | Titre | Lignes | Tokens | Citations | Porteur | Nature | Statut | Pourquoi |
|---|---|---|---|---|---|---|---|---|
| 20 | ARGUS : aucun travail ne se termine sans passer par le détec | 98 | 2043 | 143 | porté | MODE D'EMPLOI D'OUTIL | proposé | nomme un outil et nomme 7 mécanisme(s) et tous existent : recommendZone, addendaSignal, churnSignal… — la règle est déjà servie ailleurs |
| 13 | Les outils de travail vivent avec le code | 56 | 1238 | 240 | fantôme | DISCIPLINE SANS PORTEUR | proposé | aucun mécanisme nommé — sa prose est son seul mécanisme |
| 31 | Tout passe par un OUTIL, et un rapport est TOUJOURS le rappo | 63 | 1218 | 69 | sans porteur | DISCIPLINE SANS PORTEUR | proposé | aucun mécanisme nommé — sa prose est son seul mécanisme |
| 18 | Protocole de simulation complète | 54 | 1194 | 302 | porté | MODE D'EMPLOI D'OUTIL | proposé | nomme un outil et nomme 1 mécanisme(s) et tous existent : scripts/le-regisseur.mjs — la règle est déjà servie ailleurs |
| 22 | Smart Conso API : consultation systématique avant toute acti | 44 | 935 | 147 | porté | MODE D'EMPLOI D'OUTIL | proposé | nomme un outil et nomme 4 mécanisme(s) et tous existent : scripts/smart-conso-token.mjs, scripts/check-gemini-quota.mjs, scripts/gemini-key-health.mjs… — la règle est déjà servie ailleurs |
| 24 | Toute construction doit être évolutive, jamais figée sur une | 42 | 912 | 662 | porté | DISCIPLINE SANS PORTEUR | proposé | aucun signal net — à trancher à la lecture, jamais par défaut |
| 32 | Le temps réel se LIT, jamais ne se déduit | 51 | 893 | 52 | porté | MODE D'EMPLOI D'OUTIL | proposé | nomme un outil et nomme 2 mécanisme(s) et tous existent : findHorodatagesFuturs, scripts/modes-de-travail.mjs — la règle est déjà servie ailleurs |
| 29 | Tout compte rendu s'ouvre en rappelant à qui il s'adresse | 48 | 881 | 45 | porté | MODE D'EMPLOI D'OUTIL | proposé | nomme un outil et nomme 1 mécanisme(s) et tous existent : scripts/angel-of-ia-process.mjs — la règle est déjà servie ailleurs |
| 30 | Aucun chantier ne s'ouvre avant d'avoir repris les notes | 43 | 789 | 32 | porté | MODE D'EMPLOI D'OUTIL | proposé | nomme un outil et nomme 1 mécanisme(s) et tous existent : scripts/angel-of-ia-process.mjs — la règle est déjà servie ailleurs |
| 28 | Un rapport n'est pas fini quand il est écrit : il l'est quan | 46 | 760 | 268 | porté | DISCIPLINE SANS PORTEUR | proposé | aucun signal net — à trancher à la lecture, jamais par défaut |
| 16 | Vérification systématique par questions | 37 | 752 | 202 | sans porteur | DISCIPLINE SANS PORTEUR | proposé | aucun mécanisme nommé — sa prose est son seul mécanisme |
| 27 | Le projet doit rester reprenable par une AUTRE IA, à tout mo | 32 | 646 | 356 | sans porteur | DISCIPLINE SANS PORTEUR | proposé | aucun mécanisme nommé — sa prose est son seul mécanisme |
| 19 | Comprendre avant de toucher | 28 | 586 | 476 | porté | MODE D'EMPLOI D'OUTIL | proposé | nomme un outil et nomme 2 mécanisme(s) et tous existent : findRaisonsPerdues, scripts/safe-export.mjs — la règle est déjà servie ailleurs |
| 25 | Vérifier régulièrement son propre travail, pas seulement le  | 23 | 500 | 97 | sans porteur | DISCIPLINE SANS PORTEUR | proposé | aucun mécanisme nommé — sa prose est son seul mécanisme |
| 17 | Se mettre à la place des personnages, pas seulement de l'uti | 20 | 458 | 174 | sans porteur | DISCIPLINE SANS PORTEUR | proposé | aucun mécanisme nommé — sa prose est son seul mécanisme |
| 8 | Sobriété des appels API, sans compromis sur l'expérience | 22 | 438 | 158 | sans porteur | DISCIPLINE SANS PORTEUR | proposé | aucun mécanisme nommé — sa prose est son seul mécanisme |
| 26 | Les process se respectent, et god-of-all-process en est le r | 21 | 429 | 66 | porté | MODE D'EMPLOI D'OUTIL | proposé | nomme un outil et nomme 3 mécanisme(s) et tous existent : selfCheck, scripts/god-of-all-process.mjs, scripts/angel-of-ia-process.mjs — la règle est déjà servie ailleurs |
| 14 | Vigilance permanente, à chaque tour et à chaque décision | 15 | 324 | 52 | sans porteur | DISCIPLINE SANS PORTEUR | proposé | aucun mécanisme nommé — sa prose est son seul mécanisme |
| 10 | Répliques locales : l'exception encadrée | 14 | 311 | 82 | sans porteur | DISCIPLINE SANS PORTEUR | proposé | aucun mécanisme nommé — sa prose est son seul mécanisme |
| 23 | ALWAYS-NEW-CODE : l'épreuve de la page blanche, rendue concr | 13 | 309 | 69 | sans porteur | DISCIPLINE SANS PORTEUR | proposé | aucun mécanisme nommé — sa prose est son seul mécanisme |
| 15 | Se mettre à la place de l'utilisateur | 10 | 230 | 104 | sans porteur | DISCIPLINE SANS PORTEUR | proposé | aucun mécanisme nommé — sa prose est son seul mécanisme |
| 21 | HYPER-SCAN-CHECKPOINT : la vérification approfondie exceptio | 8 | 182 | 31 | sans porteur | LOI | proposé | court (8 lignes) et très cité (31) — le rendement d'une loi |
| 6 | Le document de référence est un outil de travail pour l'IA,  | 7 | 157 | 35 | sans porteur | LOI | proposé | court (7 lignes) et très cité (35) — le rendement d'une loi |
| 7 | L'épreuve de la page blanche | 6 | 118 | 52 | sans porteur | LOI | décidé | décision de l'utilisateur, reprise telle quelle |
| 11 | Zéro répétition, personnalités étanches | 5 | 108 | 131 | sans porteur | LOI | décidé | décision de l'utilisateur, reprise telle quelle |
| 4 | L'enquête doit tenir debout | 4 | 82 | 87 | sans porteur | LOI | décidé | décision de l'utilisateur, reprise telle quelle |
| 0 | Hiérarchie des lois | 4 | 77 | 356 | sans porteur | LOI | décidé | décision de l'utilisateur, reprise telle quelle |
| 2 | Cohérence de bout en bout | 4 | 76 | 66 | sans porteur | LOI | décidé | décision de l'utilisateur, reprise telle quelle |
| 1 | La conversation prime sur tout le reste | 4 | 74 | 13 | sans porteur | DISCIPLINE SANS PORTEUR | proposé | aucun mécanisme nommé — sa prose est son seul mécanisme |
| 3 | Corriger la cause, jamais le symptôme | 3 | 70 | 333 | sans porteur | LOI | décidé | décision de l'utilisateur, reprise telle quelle |
| 5 | Robustesse du code | 3 | 62 | 90 | sans porteur | LOI | décidé | décision de l'utilisateur, reprise telle quelle |
| 12 | Le sens avant la forme | 3 | 57 | 19 | sans porteur | DISCIPLINE SANS PORTEUR | proposé | aucun mécanisme nommé — sa prose est son seul mécanisme |
| 9 | Rejouabilité et surprise | 2 | 41 | 60 | sans porteur | LOI | décidé | décision de l'utilisateur, reprise telle quelle |

## Redondances possibles (signal, jamais une certitude)

Aucune au seuil strict.

*Pour faire d'une nature « proposé » une nature « décidé » : remplacer le mot dans la colonne Statut. La régénération la conservera.*
