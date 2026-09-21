# L'Agence Codex — organisation et organigramme

*(2026-09-22, demande explicite de l'utilisateur : « consolidons toute cette partie, livre moi
l'organisation complète, bien définie [...] ce doc sera mis dans le référentiel à l'usage de
CASSANDRA qui devra le remettre à jour régulièrement : l'info est chez elle, logique [...] c'est
son domaine ». Ce document est le référentiel CANONIQUE de l'organisation de l'outillage de
travail — « l'Agence Codex » (nom choisi par l'utilisateur, en souvenir de Codex, l'IA qui a
initialement produit le code de ce projet avant la reprise par Claude Code, cf.
`docs/contexte-projet/historique-prompts-codex.txt`), à distinguer du jeu lui-même (la « maison »
où vivent Lia et Noé). Calibré en 4 questions le soir de sa création, consolidant des décisions déjà
prises séparément dans `docs/cassandra-rh-conception.md` §4 et `docs/regles-de-travail.md` §7ter —
jamais une réinvention, une mise en ordre. Renommages complémentaires actés le même soir, une
seconde salve de réponses de l'utilisateur : le nom de l'ensemble, et 3 des 6 suites de travail.)*

**Frontière avec les autres documents, pour ne jamais dupliquer (Article 6)** : ce document répond
à « qui appartient à l'agence, et comment est-elle structurée ? ». Le détail complet outil par
outil (coût, déclenchement, ce qu'il détecte précisément) reste dans la table maîtresse de
`docs/regles-de-travail.md` §7ter, jamais recopié ici — ce document RÉFÉRENCE cette table, ne la
remplace pas. Les décisions de conception propres à CASSANDRA-RH (contrôle croisé, agrégation dans
le badge) restent dans `docs/cassandra-rh-conception.md`, qui référence désormais ce document pour
le roster lui-même plutôt que de le dupliquer.

## 1. Deux axes, toujours séparés

Toute confusion entre ces deux axes est une erreur de lecture de l'organigramme — ils répondent à
des questions différentes et se combinent librement (ex. LE-COORDINATEUR est « Utilitaire nommé »
sur l'axe A et « Direction » sur l'axe B en même temps).

### Axe A — Statut de documentation (« quel dossier ce poste a-t-il ? »)

- **Agent** (badge 🎖️ éligible) : instanciation propre (`docs/referentiel/<slug>.md`) + registre
  dédié (`docs/<slug>/`). Le blueprint générique est la norme en plus, sans être strictement
  obligatoire (un Agent peut être déclaré `cousinOf` un autre — seul cas actuel, THE-DEEP-READER).
- **Utilitaire nommé** : a un nom, mais aucune connaissance propre au projet à documenter à part —
  sa seule valeur est d'appeler/agréger/mettre en forme ce que les Agents disent déjà. Jamais de
  blueprint, jamais de registre séparé.
- **Infrastructure** : pas de nom propre, la plomberie qui fait tourner les Agents.

### Axe B — Rôle dans l'organigramme (« à quel niveau ce poste travaille-t-il ? »)

- **Direction (CODIR)**
- **Équipe noyau** — rebaptisée ici **« les Gardiens sacrés du code »** (nom choisi par
  l'utilisateur)
- **Membre de l'équipe** — regroupés en 6 suites de travail (§4)
- **VIP**
- **Hors de l'agence, définitivement** (§5)

## 2. Direction (CODIR)

**CASSANDRA-RH + LE-COORDINATEUR** — aucun des deux ne vérifie le code lui-même : l'un route le
travail (LE-COORDINATEUR agrège et suggère), l'autre évalue les postes (CASSANDRA-RH, à construire,
round de calibrage #134). Les deux directeurs passent par les mêmes scans mécaniques que tout le
monde (couverture AXA-CHECK, trous ARGUS, frictions HARMONIA) — seule l'évaluation RH de pertinence
de poste leur échappe structurellement à eux-mêmes.

## 3. Les Gardiens sacrés du code (Équipe noyau)

**Critère d'appartenance exact — à ne jamais confondre avec « délivre un scan de qualité »** (un
critère plus large qui inclurait à tort CLONE-HUNTER, qui délivre aussi un scan de qualité mais
n'est PAS un Gardien) : tourne **automatiquement, mécaniquement, gratuitement, à CHAQUE commit**,
jamais sur demande, jamais périodique (Article 20 de CLAUDE.md). Exactement 4 membres, jamais un
groupe inventé au coup par coup :

- **ARGUS** — absences (ce qui devrait exister et n'existe pas)
- **HARMONIA** — frictions (deux choses qui existent et se contredisent)
- **AXA-CHECK** — robustesse/fragilité réelle par fonction (couverture de test V8)
- **CLEAN-DIRTY-OLD** — stagnation relative, délègue toujours son jugement aux trois autres

**Gabarit de poste spécifique** (décision actée le 2026-09-22, au-delà du gabarit standard Agent) :
en plus de l'instanciation + registre standard, la fiche d'un Gardien porte deux champs propres,
qu'aucun autre groupe ne porte :
1. **Position dans le crochet post-commit** (`scripts/hooks/check-last-commit.mjs`) — où et dans
   quel ordre il est appelé.
2. **Rôle dans le badge/couverture AXA-CHECK** — comment sa sortie alimente `checkAgentOnboarding()`
   et le badge 🎖️ des autres outils.

Détail complet de chacun : `docs/referentiel/argus.md`, `harmonia.md`, `axa-check.md`,
`clean-dirty-old.md` (inchangés par ce document).

## 4. Membre de l'équipe — 6 suites de travail

**Décision actée le 2026-09-22** : le gabarit STANDARD (blueprint + instanciation + registre, déjà
en vigueur) suffit pour ces 6 suites — jamais un gabarit sur mesure par groupe, qui ajouterait de la
complexité sans bénéfice réel (le contenu libre du blueprint/instanciation couvre déjà leurs
différences). Seuls les Gardiens sacrés (§3) ont un gabarit enrichi, pour la raison qui leur est
propre (câblage post-commit partagé).

Le détail complet de chaque outil (coût, déclenchement, ce qu'il détecte) reste dans la table
maîtresse `docs/regles-de-travail.md` §7ter — ce tableau-ci n'est qu'un regroupement fonctionnel.

### Suite Suivi-Conso
Régule et observe la consommation (API et tokens) et l'usage réel des outils.
- Smart Conso API — rythme de consommation API de l'agent (Article 22)
- SMART-CONSO-TOKEN — rythme de consommation de tokens de l'agent (obligation écrite)
- Compteur d'utilisation des outils (`tool-usage.mjs`) — journal des sollicitations réelles

### Suite Audit Simulation
*(Anciennement « Suite Simulation & Qualité narrative », renommée par l'utilisateur.)* Juge une
partie réellement jouée (dialogue, visuel, mémoire persistée) — jamais le code du moteur lui-même.
- EL-PROFESSOR — fidélité à la charte (esprit, naturel, voix, enquête, clarté)
- THE-SCREENER — qualité visuelle indicative (2 captures d'écran max)
- memory-audit — cohérence mécanique de la mémoire persistée de Lia/Noé (seul Membre dont le SUJET
  est un Personnage, sans que cela fasse rejoindre l'équipe aux Personnages eux-mêmes, cf. §5)

### Suite Audit lourd
*(Nom déjà utilisé dans CIRCLE-TASKS, conservé tel quel.)* Les seuls outils à agent séparé/coût réel
significatif, jamais automatiques, jamais cochés par défaut dans une Ronde.
- THE-FINAL-JUDGE — audit indépendant du code et du produit
- THE-DEEP-READER — cousin de THE-FINAL-JUDGE, relecture lourde du suivi
- HYPER-SCAN-CHECKPOINT — orchestrateur exceptionnel (Article 21), version complète coûteuse

### Suite Dette & Structure du code
Dette technique et navigation dans du code volumineux.
- CLONE-HUNTER — blocs de code dupliqués (littéral + renommage bijectif cohérent)
- find-booster — index par concept dans un gros fichier déjà structuré
- route-booster — points de coupe candidats pour découper une fonction géante (Utilitaire nommé,
  pas Agent — reste dans ce groupe fonctionnel malgré son statut de documentation différent)
- ALWAYS-NEW-CODE — dette d'organisation, l'épreuve de la page blanche rendue concrète (Article 23)

### La Cour du Roi
*(Anciennement « Suite Référentiel & Vue d'ensemble », renommée par l'utilisateur — un nom qui
trouve sa logique dans le fait que THE-KING lui-même y siège.)* Donne une vue consolidée — du code,
de la philosophie, des rapports, des tâches.
- INES-official — édition consolidée et annotée du dépôt
- THE-KING — veille de `docs/philosophie-et-politique.md`
- Doc-Report — index global des registres et journaux locaux du réseau d'outils
- check-tasks-details — état des lieux des tâches à la demande

### Les Agents Spéciaux
*(Anciennement « À part », renommée par l'utilisateur — n'appartiennent à aucune des 5 suites
ci-dessus, chacun pour sa propre raison structurelle.)*
- **Smart Breaker** (`check-gemini-quota.mjs` + `gemini-key-health.mjs` + `api-providers.mjs` +
  `lib/gemini-keys.ts`) — structure hors norme déjà notée (pas de dossier `docs/` dédié, registre =
  fichier local jamais committé), portée PRODUCTION plutôt qu'outillage de développement.
- **CHECK-LEVEL-TARGET** — outil d'aiguillage interne (quel niveau de vérification une demande
  appelle), jamais une routine qu'on coche soi-même.

## 5. Jamais un employé de l'Agence — 3 catégories d'exclusion définitive

Aucun mécanisme pensé pour l'équipe (badge, blueprint, registre, couverture AXA-CHECK, entrée
PRESTATIONS) ne s'applique jamais à ce qui suit, quelle que soit sa proximité apparente avec un
poste de travail :

1. **Les Personnages (Lia, Noé)** — contenu narratif, gouvernés exclusivement par la charte de
   contenu (CLAUDE.md), jamais une catégorie de l'organigramme. Un outil DE l'équipe peut avoir pour
   SUJET un Personnage (memory-audit) sans que cela le fasse rejoindre l'équipe.
2. **Le Moteur du jeu** (`lib/*.ts`, `app/*`, `components/*` — hors `components/ui/`, cf. point 3
   ci-dessous) —
   le PRODUIT que l'agence construit et vérifie (par `tsc`/`check-house.mjs`/AXA-CHECK comme
   n'importe quel code), jamais un travailleur de plus. Un outil peut ajouter un point
   d'observation DANS le moteur (`lib/memento-weight.ts`, `lib/gemini-keys.ts`) sans que ce
   fragment devienne un Agent.
3. **Le code tiers vendu tel quel** (`components/ui/*`, le kit shadcn/Radix) — jamais écrit ni
   maintenu par l'agence, seulement importé. Déjà exclu en pratique du scan de CLONE-HUNTER
   (« duplication assumée par design ») — formalisé ici comme règle générale, pas seulement une
   exception locale à un outil.

## 6. Infrastructure — un 3e rang d'employés, sans dossier individuel

**Décision actée le 2026-09-22** : contrairement aux 3 catégories du §5 (jamais un employé, quelle
que soit la lecture), les scripts « Infrastructure » (`check-house.mjs`, `check-spirit.mjs`/
`check-profile.mjs`, `check-argus.mjs`, `check-harmonia.mjs`, `lib-shell.mjs`, et tout script sans
nom propre) **restent dans l'organigramme de l'agence**, au rang le plus bas — un vrai travail
utile et vérifié (couvert par AXA-CHECK comme tout code), mais jamais de fiche de poste individuelle
ni de badge. Un Agent peut être implémenté par plusieurs fichiers d'infrastructure (ex. Smart
Breaker = 4 fichiers) sans qu'aucun d'eux ait besoin de son propre statut.

## 7. VIP

L'utilisateur et l'agent (Claude) — explicitement hors du tableau, jamais évalués, jamais une ligne
du badge.

## 8. Entretien de ce document

**C'est le domaine de CASSANDRA-RH** (une fois construite, round de calibrage #134) : elle tient ce
document à jour à chaque nouvel outil créé, chaque outil retiré, chaque déplacement entre suites —
exactement comme elle tiendra la liste de l'équipe à jour (cf. `docs/cassandra-rh-conception.md`
§2). En attendant sa construction, la mise à jour reste manuelle, à la charge de l'agent qui pilote,
au même titre que la table maîtresse de `docs/regles-de-travail.md` §7ter (Article 13 — un nouvel
outil qui rejoint l'agence sans mise à jour de ce document est une dette documentaire, pas un détail
reportable).
