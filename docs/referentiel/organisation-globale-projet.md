# Organisation globale du projet — document mère

*(2026-09-21, demande explicite de l'utilisateur : « je veux un document mere pour l'organisation
du projet, qui inclue l'organisation de l'agence et l'organisation de tout le projet [...] le
document ne doit pas tout detailler, mais agreger differents docs d'organisation repartis suivant
les groupes/familles [...] certains documents d'organisation doivent peut etre etre rattachés à
certains membres stratégiques ». Conçu comme un point d'entrée unique, jamais un troisième
référentiel qui recopierait ce que d'autres documents disent déjà — chaque section ci-dessous
RÉFÉRENCE son document détaillé plutôt que de le dupliquer (Article 6 de CLAUDE.md).)*

## 1. Les deux mondes du projet

Tout ce qui existe dans ce dépôt appartient à l'un de ces deux mondes, jamais aux deux à la fois —
la même distinction qui protège l'Agence Codex de toute confusion avec les Personnages (cf.
`docs/referentiel/organisation-agence.md` §5) :

- **Le Jeu** — la maison, Lia, Noé, l'enquête, tout ce que l'observateur perçoit. Gouverné
  exclusivement par la charte de contenu (`CLAUDE.md`, Articles 0-23) et le référentiel de
  comportement (`docs/referentiel/principes.md`, `parametres.md`, `regles-du-temps.md`,
  `regles-de-l-espace.md`, `regles-de-la-memoire.md`, `regles-des-graphismes.md`). Ce document mère
  ne détaille jamais ce monde — `CLAUDE.md` joue déjà ce rôle consolidateur pour le contenu du jeu,
  aucun doublon n'est utile ici.
- **L'Agence Codex** — l'outillage de travail (scripts, Agents, Membres, Gardiens) qui construit et
  vérifie le jeu, jamais vu par l'observateur. Son organisation complète vit dans
  `docs/referentiel/organisation-agence.md` (les deux axes Statut de documentation/Rôle dans
  l'organigramme, les Gardiens sacrés, les 6 suites de Membres, les 3 catégories définitivement
  hors agence) — **jamais recopiée ici**, ce document mère se contente d'y renvoyer.

Un premier schéma visuel consolidant les deux mondes existe (Artifact, 2026-09-21, cf.
`docs/cassandra-rh-conception.md` §10) — à reconstruire mécaniquement une fois LE-GRAND-ARCHITECTE
(§4 ci-dessous) construit, jamais transcrit à la main une seconde fois.

## 2. Carte des documents d'organisation par pôle

Ce tableau est la SEULE nouveauté de ce document : dire, pour chaque pôle du projet, où vit son
organisation détaillée et qui en a la responsabilité. Aucune ligne ne duplique le contenu du
document qu'elle cite.

| Pôle | Document détaillé | Responsable actuel | Responsable cible |
|---|---|---|---|
| Le Jeu — contenu et charte | `CLAUDE.md` | Utilisateur + agent, au fil de l'eau | inchangé — jamais un poste de l'Agence |
| Le Jeu — comportement/mécaniques | `docs/referentiel/principes.md`, `parametres.md`, `regles-du-temps.md`, `regles-de-l-espace.md`, `regles-de-la-memoire.md`, `regles-des-graphismes.md` | Agent, à chaque changement de comportement | inchangé |
| L'Agence Codex — organigramme complet | `docs/referentiel/organisation-agence.md` | Agent, manuellement | CASSANDRA-RH (déjà acté, `docs/cassandra-rh-conception.md` §4) |
| L'Agence Codex — carte des outils détaillée | `docs/regles-de-travail.md` §7ter | Agent, manuellement | CASSANDRA-RH (même acte) |
| Projet entier — vue mère (ce document) | `docs/referentiel/organisation-globale-projet.md` | Agent, manuellement | LE-GRAND-ARCHITECTE (§4 ci-dessous, proposé) |
| Méthode de collaboration | `docs/regles-de-travail.md` (hors §7ter) | Utilisateur + agent | inchangé |
| Boussole de valeurs | `docs/philosophie-et-politique.md` | Révisé exceptionnellement | veillé par THE-KING (inchangé) |
| **Cartographie des blueprints** *(candidat identifié, pas encore construit)* | Aujourd'hui dupliqué entre `CLAUDE.md` (une section « ## X — blueprint exportable » par outil, ~40 sections) et `docs/regles-de-travail.md` §7ter (table complète) | Aucun — duplication non arbitrée | LE-GRAND-ARCHITECTE, une fois construit |

**Candidat de centralisation trouvé en cherchant (demande explicite : « essaie de voir ce qu'il y
a de plus pertinent »)** : `CLAUDE.md` porte aujourd'hui ~40 sections « blueprint exportable », une
par outil, qui redisent en prose ce que la table de `docs/regles-de-travail.md` §7ter dit déjà en
colonnes — la seule vraie info propre à `CLAUDE.md` est le pointeur vers les 2 fichiers de chaque
outil (`docs/X-blueprint.md` + `docs/referentiel/X.md`). Extraire cette cartographie dans un document
séparé (`docs/referentiel/index-outils.md` ou fusionné dans ce document mère) allégerait `CLAUDE.md`
— le seul document relu à CHAQUE message (Article 13) — d'un poids réel. **Pas exécuté maintenant** :
une vraie migration de contenu hors de `CLAUDE.md` suit la procédure formalisée de
`docs/referentiel/smart-conso-token.md` (scanner/identifier/trier/archiver/vérifier/documenter),
jamais un retrait improvisé — proposé ici comme candidat, décision à confirmer séparément.

**Décision explicite prise en construisant ce document (2026-09-21)** : pas de sous-document
supplémentaire par pôle au-delà de ce qui existe déjà. `organisation-agence.md` couvre déjà
correctement tout le pôle Agence sans avoir besoin d'être scindé davantage — en créer un de plus
serait de la dette d'organisation par anticipation, exactement ce que l'Article 19 met en garde
contre (« vérifier d'abord que ce n'est pas déjà une décision assumée »). Si un pôle grossit au
point de justifier son propre document plus tard, cette table est l'endroit où l'ajouter — jamais
une raison de la reconstruire pour l'instant.

## 3. Ce que ce document N'EST JAMAIS

- Un remplacement de `CLAUDE.md` (qui reste la loi suprême du contenu, Article 0) ni de
  `organisation-agence.md` (qui reste la référence canonique de l'Agence, Axe A/Axe B).
- Un lieu de détail technique — aucun nom de fonction, aucun seuil chiffré, aucune règle de badge
  ne doit jamais être dupliqué ici depuis un autre document.
- Un outil avec blueprint/registre propres — c'est un DOCUMENT, pas un Agent ; il ne rejoint jamais
  la carte des outils de `docs/regles-de-travail.md` §7ter.

## 4. LE-GRAND-ARCHITECTE — proposé, pas encore construit

*(2026-09-21, demande explicite de l'utilisateur : « il y a un agent script derriere "organisation
globale" qui est capable d'evaluer l'organisation generale et de faire des recommandations si
besoin [...] il travaille en lien avec les agents correspondants, il a des liens privilégiés avec
cassandra, avec tool-brain ».)*

Ce document mère est prévu pour être maintenu par un futur Agent, **LE-GRAND-ARCHITECTE** — celui
qui évalue la santé de l'organisation DOCUMENTAIRE ET STRUCTURELLE du projet ENTIER (jeu + agence),
au-dessus du périmètre de CASSANDRA-RH (centrée sur l'équipe de l'Agence). Conception complète,
liens privilégiés et questions de calibrage : `docs/le-grand-architecte-conception.md`. **Statut
actuel : proposition, ajoutée à la liste des chantiers, aucun code écrit.**

## 5. Historique

- 2026-09-21 — création, en même temps que la reclarification du badge « Membre certifié »
  (2 catégories, cf. `organisation-agence.md` Axe A) et la livraison du premier schéma visuel de
  l'Agence Codex.
