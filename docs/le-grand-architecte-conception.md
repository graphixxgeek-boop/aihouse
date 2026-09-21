# LE-GRAND-ARCHITECTE — dossier de conception

*(2026-09-21. LE-GRAND-ARCHITECTE n'existe pas encore en tant qu'outil réel — aucun code, aucun
blueprint, aucune instanciation. Même statut que `docs/cassandra-rh-conception.md` avant sa
construction : ce document réunit la proposition initiale et les questions de calibrage, en attente
de validation. Une fois construit, ce fichier sera remplacé par le triptyque standard
`docs/le-grand-architecte-blueprint.md` + `docs/referentiel/le-grand-architecte.md` +
`docs/le-grand-architecte/`.)*

## 1. Rôle et principe fondamental

Demande explicite de l'utilisateur : « il y a un agent script derriere "organisation globale" qui
est capable d'evaluer l'organisation generale et de faire des recommandations si besoin ». LE-GRAND-
ARCHITECTE évalue la santé de l'organisation DOCUMENTAIRE ET STRUCTURELLE du projet **entier** (Le
Jeu + L'Agence Codex, cf. `docs/referentiel/organisation-globale-projet.md`) — jamais une
application automatique de ses recommandations (même discipline qu'ALWAYS-NEW-CODE, Article 23 :
un palier de confiance, jamais un résultat exact à 100%, l'agent qui pilote interroge toujours
l'utilisateur avant tout changement réel).

**Anti-doublon, principe fondateur non négociable** (même discipline que CASSANDRA-RH) : LE-GRAND-
ARCHITECTE ne recalcule JAMAIS ce que d'autres outils savent déjà — il les LIT et en tire une
synthèse organisationnelle. Un signal fiable existant s'absorbe, jamais dupliqué à côté.

## 2. Frontière avec les outils voisins — pourquoi aucun n'est déjà cet outil

Vérifié avant de proposer une construction (Article 19) :

- **vs CASSANDRA-RH** — CASSANDRA-RH gère l'ÉQUIPE de l'Agence (postes, badges, recrutement,
  pertinence d'un membre) ; LE-GRAND-ARCHITECTE regarde un niveau au-dessus : la STRUCTURE
  DOCUMENTAIRE et organisationnelle du projet ENTIER, jeu compris, pas seulement l'Agence.
  CASSANDRA-RH répond à « cet Agent a-t-il le bon poste ? » ; LE-GRAND-ARCHITECTE répond à « la
  carte des postes elle-même est-elle encore la bonne carte ? ».
- **vs ALWAYS-NEW-CODE** — traite la dette d'organisation du CODE, zone par zone (Article 23) ;
  LE-GRAND-ARCHITECTE traite la dette d'organisation des DOCUMENTS et de la hiérarchie de
  gouvernance (un document qui devrait être scindé, deux documents qui se recoupent, un pôle sans
  document propre) — jamais le code source lui-même.
- **vs HARMONIA** — vérifie la cohérence entre deux éléments de code/contenu déjà existants ;
  LE-GRAND-ARCHITECTE vérifie la cohérence de la CARTE elle-même (la carte des documents reflète-t-
  elle encore la réalité ? un pôle a-t-il grossi au point de mériter son propre document ?).
- **vs THE-KING** — vérifie qu'une DÉCISION ponctuelle respecte la philosophie déjà écrite ;
  LE-GRAND-ARCHITECTE vérifie que la STRUCTURE reste saine dans la durée, jamais une décision isolée.
- **vs Doc-Report** — inventorie les REGISTRES et leur décision HTML/texte ; LE-GRAND-ARCHITECTE
  regarde un cran plus haut, les DOCUMENTS D'ORGANISATION eux-mêmes (pas seulement leurs registres).

## 3. Liens privilégiés (demande explicite de l'utilisateur)

« il travaille en lien avec les agents correspondants, il a des liens privilégiés avec cassandra,
avec tool-brain, par ex » :

- **CASSANDRA-RH** — lit l'organigramme des postes réels (`organisation-agence.md`,
  `AGENT_CATEGORIES`) pour savoir QUI existe avant de juger COMMENT c'est structuré. Sens unique :
  LE-GRAND-ARCHITECTE consomme les données de CASSANDRA-RH, jamais l'inverse.
- **tool-brain** — lit le catalogue PRESTATIONS et les statistiques d'usage réel
  (`buildToolBrainUsageReport()`) pour juger si un pôle/outil est concrètement utilisé, pas
  seulement documenté sur le papier — un document d'organisation qui décrit un outil jamais
  sollicité est un signal réel, jamais deviné.
- **ALWAYS-NEW-CODE** — réutilise ses 8 zones/thèmes existants plutôt que d'en inventer une
  deuxième liste divergente, pour tout ce qui touche à la dette de CODE en toile de fond.
- **HARMONIA** — réutilise sa carte de frictions déjà construite plutôt que de la recalculer.
- **Doc-Report** — réutilise son inventaire des registres/décisions HTML-texte pour repérer un
  registre orphelin ou un document jamais consulté.

## 4. Ce qu'il produit

Un rapport de recommandations en texte, jamais une application automatique — exemples de ce que ce
rapport pourrait dire, une fois construit : « `organisation-agence.md` a grossi au point de mériter
un découpage par suite » ; « `regles-de-travail.md` et `organisation-globale-projet.md` se recoupent
sur tel paragraphe » ; « le pôle X n'a toujours aucun document d'organisation alors qu'il compte
désormais N outils ». Chaque recommandation cite sa source (quel signal d'un outil voisin l'a
déclenchée), jamais une intuition non vérifiable.

## 5. Statut cible et coût

- **Catégorie** : Agent (Sage) une fois construit — connaissance propre au projet (le jugement
  organisationnel lui-même), badge 🎖️ complet, poste standard (instanciation + registre + blueprint).
- **Coût** : gratuit en appel API (raisonnement pur, aucun appel Gemini) — mais un vrai coût de
  RAISONNEMENT pour l'agent qui pilote, exactement comme ALWAYS-NEW-CODE. **Consultation
  SMART-CONSO-TOKEN obligatoire avant tout vrai passage**, jamais un réflexe gratuit.
- **Déclenchement, calibré (2026-09-21)** : 2 niveaux, même patron qu'ALWAYS-NEW-CODE. **Léger** —
  un signal inclus automatiquement dans chaque Ronde CIRCLE-TASKS (item à créer, ex.
  `le-grand-architecte-signal`), qui se contente de lire les signaux déjà accumulés (comme
  `always-new-code-signal` le fait déjà) — jamais un vrai raisonnement à ce niveau. **Lourd** — le
  vrai passage d'évaluation/recommandation, uniquement sur demande explicite ou proposé au niveau
  « Exceptionnel » de CHECK-LEVEL-TARGET, jamais automatique.

## 6. Statut de ce document

**Conception proposée, validation en attente.** Ajouté à la liste des chantiers ouverts
(`docs/suivi/`) — la construction réelle (code, tests, blueprint) n'a pas commencé, conformément à
la demande explicite de l'utilisateur : « à toi de jouer pour tes propositions : on calibre et on
ajoute à la todo ».
