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
