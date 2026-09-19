# Tableau de bord / KPI — instanciation pour ce projet

*(Créé le 2026-09-19, à la demande explicite de l'utilisateur. Séparé le même jour, à sa demande
également, entre l'architecture générique — réutilisable sur un autre projet équivalent, décrite
dans `docs/tableau-de-bord-blueprint.md` — et l'instanciation propre à ce projet ci-dessous. Ce
document ne répète pas le raisonnement générique : il dit seulement comment le patron s'applique
ici, à quels fichiers, à quels Articles de la charte. Comme le patron l'impose, les chiffres réels
ne s'accumulent jamais dans ce document — ils vivent en base de données (D1) et dans le dépôt lui-
même, consultables via `scripts/kpi-report.mjs`.)*

## Les 5 familles, pour ce projet

1. **Performance runtime.** Fiabilité de la connexion à Gemini (fréquence des blocages 429/503,
   bascules de clé/modèle de secours via le Smart Breaker), économie d'appels (tours traités
   localement sans appel payant, Article 8), santé des clés de secours. Compteurs cumulés en base
   de données (`kpi_counters`), incrémentés aux deux points d'appel réseau réels
   (`lib/lia.ts::think()`, `app/api/lia/route.ts::generateDossierFragment()`).
2. **Robustesse du code** (Article 5, Article 7). Propreté de `tsc --noEmit`, santé de la suite
   `check-house.mjs`, nombre de points fragiles ouverts (`docs/referentiel/points-fragiles.md`),
   taille des fichiers les plus denses (`lib/lia.ts`, `lib/dialogue.ts`). **Livrée le 2026-09-19**
   via `scripts/kpi-report.mjs` — la seule famille déjà construite à ce jour.
3. **Qualité** (Article 0, Article 11). Proportion de répliques générées par le modèle vs de
   répliques de secours (`groundPrivateThought` et équivalents), nombre de fois où un garde-fou
   anti-répétition a dû intervenir, et référence à la dernière vérification approfondie par
   `check-spirit.mjs` (date + verdict, enregistrés manuellement après chaque passage — cet outil
   coûte de vrais appels API donc reste lancé à la main, jamais automatisé, cf. Article 13).
4. **Cohérence logique** (Articles 2, 4, 12, 17). Nombre d'interventions des garde-fous de
   cohérence (`groundTruncation`, `groundRoomSpeech`, etc.), séparé par personnage (Lia/Noé).
5. **Rejouabilité/rythme** (Article 9). Capturée en fin de session, au moment du `reset`, dans une
   table dédiée (`kpi_session_snapshots`) qui survit au nettoyage des tables de jeu (`memories`,
   `conversations`, etc.) : nombre de tours jusqu'à la révélation, répartition des 9 bonus de la
   roulette, nombre de disputes, variété des ouvertures de session.

## Accès et alertes, pour ce projet

- **Accès** : un bouton dédié, séparé du bouton "Admin" (référentiel) déjà existant, protégé par
  le même code d'accès.
- **Alerte qualité** : remonte à deux endroits — dans le panneau dédié, et mise en évidence dans
  les réponses de l'agent en conversation via `**🚨 ALERTE TABLEAU DE BORD**` en tout début de
  réponse (convention du patron générique, adoptée ici faute de vraie mise en forme disponible
  dans ce terminal de conversation).
- **Rapport dans la conversation** : tant que le site n'est pas publié, l'agent fait spontanément
  un point sur ce tableau de bord à chaque fin de chantier important — pour compenser l'absence de
  vrais visiteurs et de retour terrain à ce stade du projet.
- **Historique** : conservé en base de données pour permettre une comparaison automatique d'une
  session à la moyenne des précédentes.

## Outil

`scripts/kpi-report.mjs` — à la demande, jamais en continu (Article 8). Sert à la fois
l'utilisateur (consultation manuelle) et l'agent (relecture rapide de l'état du projet en début de
session ou après un chantier).

## État d'avancement

- **Chantier 1 (2026-09-19) — fait** : famille "Robustesse du code", registre des points fragiles,
  script `kpi-report.mjs`, et le présent découpage architecture/instanciation.
- **Chantier 2 — à venir** : tables `kpi_counters` / `kpi_session_snapshots`, familles
  "Performance runtime", "Qualité", "Cohérence logique", "Rejouabilité/rythme", bouton dédié dans
  l'interface, lien avec `check-spirit.mjs`.
- **Chantier 3 (piste ouverte, pas planifiée)** : creuser en priorité l'un des points listés dans
  `docs/referentiel/points-fragiles.md`, si l'un d'eux devient plus urgent que l'enchaînement
  normal des chantiers.
- **Idée notée le 2026-09-19, à mettre de côté jusqu'au retour sur ce chantier** (demande explicite
  de l'utilisateur) : un indicateur d'efficacité de la COLLABORATION elle-même — est-ce que l'agent
  comprend bien où en est le travail, comprend bien les demandes et les réponses de l'utilisateur,
  reste bien sur la même longueur d'onde — à consulter par l'agent lui-même régulièrement pour
  vérifier la qualité et la pertinence de son propre travail. Distinct des 5 familles déjà définies
  ci-dessus (qui mesurent le CODE et la PARTIE, pas la conversation de travail) — famille candidate
  à ajouter, ou son propre sujet séparé, à discuter quand le chantier 2 reprend ; pas encore de
  conception à ce stade.
