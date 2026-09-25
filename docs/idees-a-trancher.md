# Idées à trancher — fichier préliminaire, entre-deux ou abandon (registre)

*(2026-09-21, demande explicite de l'utilisateur : à chaque fois qu'une nouvelle idée est
développée — pas seulement les « gros chantiers » déjà couverts par la règle voisine — l'agent doit
poser une question à 3 choix : créer un fichier préliminaire dédié, abandonner l'idée, ou
« entre-deux » (notée ici, aucun fichier créé pour l'instant). Le mécanisme PRINCIPAL est un
réflexe en temps réel (cf. `docs/regles-de-travail.md`, section dédiée) : la question se pose au
moment même où l'idée est proposée en conversation. Le signal CIRCLE-TASKS
`idee-a-trancher-signal` est un FILET DE SÉCURITÉ mécanique, jamais le mécanisme principal — il
rattrape une idée pour laquelle le réflexe en temps réel aurait été oublié, en la reposant à
CHAQUE Ronde tant qu'aucune décision définitive n'est enregistrée ici.
Décision réservée exclusivement à l'utilisateur, jamais déduite ni tranchée par l'agent —
réversible dans les deux sens (une idée abandonnée peut être relancée plus tard, une idée
« entre-deux » peut être explicitement abandonnée).
Détection mécanique : `detectPendingIdeaCandidates()` (`check-tasks-details.mjs`) — toute tâche de
suivi dont le Sujet commence par « Nouvel outil » ou « Conception ». Ce fichier vit hors de
`docs/suivi/` (LE-PLANIFICATEUR) pour ne jamais entrer en tension avec sa règle de lecture seule
(`check-tasks-details.mjs` ne modifie jamais `docs/suivi/`).)*

## Balayage rétrospectif initial (2026-09-21)

Revue manuelle de l'historique complet de `docs/suivi/` (Article 19 — jamais un algorithme textuel
brut sur les candidats historiques, voir la note méthodologique en bas). Trois sous-idées
identifiées comme encore réellement ouvertes aujourd'hui, toutes déjà couvertes par le fichier
préliminaire existant de leur chantier parent — aucun vrai trou trouvé rétroactivement :

| Tâche(s) | Idée | Décision | Fichier |
|---|---|---|---|
| #297 | Catalogue LE-COORDINATEUR/CASSANDRA (§8bis de docs/cassandra-rh-conception.md) | fichier créé | docs/cassandra-rh-conception.md |
| #226 (§8ter) | 3 Stagiaires — Catalogue, Dossier KPI, Recrutement (docs/cassandra-rh-conception.md) | fichier créé | docs/cassandra-rh-conception.md |
| — | « Promotion de poste » — ambiguïté de terminologie non tranchée (docs/cassandra-rh-conception.md) | entre-deux | — (question de calibrage encore due à l'utilisateur) |

## Idées nouvelles (à partir du 2026-09-21)

*(chaque nouvelle idée détectée — en temps réel ou par le signal CIRCLE-TASKS — rejoint ce tableau
dès qu'elle est posée à l'utilisateur, avec sa décision réelle une fois obtenue.)*

| Tâche | Date | Idée | Décision | Fichier |
|---|---|---|---|---|

## Note méthodologique

Un balayage purement textuel automatique (mots-clés « pas encore construit »/« encore ouvert ») sur
tout l'historique produit trop de faux positifs/négatifs pour être fiable : une tâche peut décrire
une idée « pas encore construite » au moment où elle est écrite, puis être réalisée plus tard sans
que cette phrase d'origine soit jamais corrigée — cas réel trouvé : la tâche #287 (« conception à
sauvegarder pour construction future ») a depuis été réalisée par
`scripts/objectifs-vs-resultats.mjs`, sans que le texte de la tâche #287 elle-même ne le reflète
jamais. La détection automatique (`detectPendingIdeaCandidates()`) reste donc réservée aux idées
NOUVELLES à partir de maintenant, où la question se pose au moment même de la détection — jamais
reconstruite après coup sur un texte qui a pu devenir obsolète.

**Plancher réel : numéro de tâche, jamais une date (2026-09-21, trouvé en testant en direct avant
tout câblage dans la Ronde, Article 3/19).** Un premier essai avec un plancher de DATE
(« 2026-09-21 ») a été testé contre le vrai `docs/suivi/` avant tout câblage réel — et a remonté
plus de 40 tâches « Nouvel outil »/« Conception » du jour même, la quasi-totalité de la session en
cours, déjà construites et closes le jour même sans jamais passer par une vraie décision de fichier
préliminaire (des outils trop petits pour ça). Une date plancher ne peut pas distinguer « avant
l'existence de ce mécanisme » de « après », puisque le mécanisme naît lui-même un jour qui contient
déjà des dizaines de tâches. `detectPendingIdeaCandidates()` utilise donc un plancher au NUMÉRO de
tâche (`sinceTaskNumber`, défaut 332 — la dernière tâche couverte par le balayage rétrospectif
manuel ci-dessus), un numéro étant strictement croissant et sans ambiguïté de fuseau horaire (même
principe que `filterByZoom()`, `check-tasks-details.mjs`) : exclut précisément tout ce que le
balayage manuel a déjà tranché, sans exclure la moindre idée réellement nouvelle à partir de
maintenant.

## Les sept décisions qui attendaient sans que personne les voie (2026-09-25)

**CE QUI LES A FAIT APPARAÎTRE, et c'est la moitié la plus utile de cette entrée** : le détecteur
ne lisait que le SUJET d'une ligne de suivi, et seulement s'il commençait par « Nouvel outil » ou
« Conception » — le vocabulaire du 2026-09-21. Depuis, le suivi porte une colonne **Criticité** dont
l'une des valeurs est littéralement `A-TRANCHER`, posée à la main sur chaque ligne qui attend une
décision. Le signal le plus fiable qui soit, et le détecteur ne le regardait pas.

Résultat mesuré avant correction : **zéro candidat sur 803 lignes réelles**, dont sept portant
`A-TRANCHER` en toutes lettres. Un registre parfaitement vide, et parfaitement faux — le constat
DEEP-READER 8 confirmé en direct.

| Tâche | Sujet | Décision |
|---|---|---|
| #747 | Nommage — la nomenclature : un code de classe dans le nom d'un outil | à trancher |
| #760 | Charte — proposer un NOUVEL article (le trentième) pour la reprise des notes | à trancher |
| #767 | Charte — quelles autres règles à fort levier manquent ? | à trancher |
| #800 | Version de l'Agence — lequel des trois axes fait monter le majeur ? | à trancher |
| #801 | Badge — la FAMILLE a disparu de la cérémonie, 23 cérémonies identiques d'un coup | à trancher |
| #805 | File — 87 % de tâches légères et 49 thèmes : émiettement, ou rythme sain ? | à trancher |
| #814 | Données — les sources fraîches restantes : lecteur réel, ou absence assumée ? | à trancher |

Trois d'entre elles (#747, #760, #767) attendaient depuis plusieurs jours **sans être visibles nulle
part** : elles étaient dans le suivi, marquées correctement, et le seul outil chargé de les
rassembler ne pouvait pas les voir.

### Ajoutée le jour même, et par le garde-fou lui-même

| Tâche | Sujet | Décision |
|---|---|---|
| #819 | Filet de sécurité — ne rien faire, regarder les 3 plus lents, ou un mode rapide | à trancher |

**Comment elle est arrivée ici** : le test écrit une heure plus tôt pour ce registre a **bloqué le
commit** qui créait #819, parce que la ligne portait `A-TRANCHER` sans être inscrite ici. Le
mécanisme a donc attrapé son propre auteur, sur sa première occasion réelle — ce qui est la seule
preuve qui vaille qu'il n'était pas une intention (leçon L2).


### Ajoutée le 2026-09-25 par le garde-fou d'écriture des origines

| Tâche | Sujet | Décision |
|---|---|---|
| #823 | Compteur d'usage — l'origine « spontane » : la câbler, ou la retirer du vocabulaire ? | à trancher |

**Le fait qui la motive** : sur 2 197 événements enregistrés depuis le premier jour, cette origine
n'a **jamais** été écrite une seule fois, et tool-brain la LISAIT pour en tirer un reproche
permanent. Le signal positif construit le même jour la remplace déjà, en DÉRIVANT l'initiative de
ce qui est réellement enregistré. Les deux options, et elles ne se valent pas :

- **La câbler** — il faudrait qu'un appelant déclare « ceci est spontané », c'est-à-dire que je me
  note moi-même. Ce projet s'en méfie, et il a raison : une mesure auto-déclarée mesure la
  déclaration, jamais le fait.
- **La retirer** — le vocabulaire ne porterait plus que des origines réellement productibles, et
  plus aucun outil ne pourrait rendre un verdict sur une catégorie vide. Coût : `toolUsageStats()`
  cesse d'exposer une clé que personne ne remplissait.
