# CHECK-TASKS-DETAILS — instanciation pour ce projet

Instanciation de `docs/check-tasks-details-blueprint.md` pour Maison IA vivante. Créé le
2026-09-20, à la demande explicite de l'utilisateur, pour répondre à ses demandes récurrentes
« fais-moi l'état des tâches en cours » avec un gabarit fixe plutôt qu'une réponse réinventée à
chaque fois. Statut **complet**, comme un membre à part entière du paysage d'outils (choix
explicite de l'utilisateur, Article 16 — contrairement à LE-COORDINATEUR/CIRCLE-TASKS/html-report.mjs
qui n'ont pas ce statut).

## Le gabarit de calibrage

Toute demande du type « état des tâches » se répond en calibrant deux axes, via une fenêtre de
question dédiée (Article 16) :
1. **Zoom** : `en_cours` (ce qui est ouvert ou en cours maintenant) / `elargi` (l'ouvert + les 20
   dernières tâches numérotées, terminées incluses — donne le contexte de ce qui vient de se
   terminer) / `projet_entier` (tout l'historique du suivi).
2. **Forme** : `liste` (groupée par statut : En cours / Ouvertes / Autre statut / Terminées, en
   tableau) / `arborescence` (groupée par thème > sous-thème, tel que déjà écrit dans la colonne
   Sujet de chaque ligne du suivi — jamais une nouvelle taxonomie).

## Ce qu'il lit, ce qu'il ne fait jamais

Lit `docs/suivi/sessions/*.md` via `categorizeAllSessions()` (déjà exporté par
`check-suivi-fidelity.mjs` — aucun second parseur de tableau markdown). Colonnes utilisées :
N°, Sujet, Sous-sujet, Sensibilité, Statut — toutes déjà présentes dans chaque ligne, cf.
`docs/systeme-de-suivi.md`.

**Lecture seule, non négociable** (choix explicite de l'utilisateur, Article 16 : « le suivi des
tâches [...] est sa mère »). `docs/suivi/` reste l'unique source de vérité, modifiée uniquement par
l'agent à la main. check-tasks-details ne fait jamais autorité sur son contenu.

## Consultation de LE-COORDINATEUR

Pour chaque tâche encore ouverte affichée, `suggestPrestationsForTask()` (`le-coordinateur.mjs`)
est appelée pour signaler une correspondance de mots-clés avec une prestation existante — jamais
une certitude, un simple rapprochement mécanique (seuil ≥2 mots-clés partagés). Cf.
`docs/regles-de-travail.md`, section « Consultation programmatique outil→LE-COORDINATEUR », pour le
principe général (réutilisable par tout futur outil, pas seulement celui-ci).

## Vérification croisée automatique (choix explicite de l'utilisateur, Article 16)

Chaque génération archive un instantané compact (`docs/check-tasks-details/historique.jsonl` — N°
et statut seulement, jamais la description complète, pour rester léger) et le compare au dernier
instantané archivé :
- **Régression** : une tâche redevient « ouverte »/« en cours » après avoir été « terminée » — ne
  devrait jamais arriver, signalé en priorité dans le rapport suivant.
- **Stagnation** : une tâche ouverte identique dans les 2 derniers instantanés consécutifs (donc
  présente dans au moins 3 générations de suite en comptant la courante) — signal d'oubli possible,
  jamais une certitude, à vérifier comme toute trouvaille ARGUS/ALWAYS-NEW-CODE.

## Rendu et registre

Rendu HTML via le gabarit générique déjà existant du projet (`scripts/html-report.mjs`), enrichi
d'un nouveau type de bloc `tree` (arborescence imbriquée, ajouté ce jour — aucun rapport existant
n'en avait besoin avant celui-ci, même règle que les blocs `code`/`image`/`dialogue` précédents :
enrichir le vocabulaire commun plutôt que forker une page à part). Fichiers écrits dans
`docs/check-tasks-details/` (un `.html` par génération, `historique.jsonl` pour les instantanés,
`index.md` pour le registre humain).

## Coût

Gratuit — aucun appel API, coût token limité à la taille de `docs/suivi/` relu (proportionnel au
nombre de tâches, jamais un chiffre fixe).

## KPI

Suivi dès la création (même discipline que THE-DEEP-READER/ALWAYS-NEW-CODE) : nombre de
régressions/stagnations réellement confirmées comme de vrais oublis (par opposition à un faux
positif du seuil de stagnation) — mesuré au fil des générations suivantes, encore à zéro passage au
moment de la création de ce document.
