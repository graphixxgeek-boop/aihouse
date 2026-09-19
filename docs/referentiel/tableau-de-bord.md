# Tableau de bord / KPI — règles du système

*(Créé le 2026-09-19, à la demande explicite de l'utilisateur : « penses-tu qu'il soit intéressant
de mettre au point des KPI pour ce projet... et de créer un rapport régulier sur ces chiffres pour
suivre l'avancée du projet ? ». Ce document décrit les RÈGLES et la STRUCTURE du système — jamais
un historique des chiffres réels au fil du temps, qui reste stocké en base de données (D1) et
consultable via l'outil dédié, pas dans ce fichier — décision explicite de l'utilisateur pour ne
pas alourdir ce document à chaque partie jouée.)*

## Principe général

Ce tableau de bord est un outil d'observation, jamais un mécanisme de jeu : aucun chiffre qu'il
calcule ne doit jamais influencer une décision prise par `lib/turn.ts`, `lib/drama.ts` ou tout
autre module qui pilote le comportement de Lia et Noé. Il est strictement réservé à
l'utilisateur (créateur/administrateur du projet) — jamais un visiteur normal du site n'y a accès,
quelle que soit la famille de KPI concernée. Il ne coûte jamais d'appel Gemini supplémentaire
(Article 8 de CLAUDE.md) : les compteurs s'incrémentent uniquement à des événements qui se
produisent déjà normalement dans le jeu.

## Les 5 familles

1. **Performance pure — runtime** (Article 5 : robustesse, Article 8 : sobriété API). Fiabilité de
   la connexion à Gemini (fréquence des blocages 429/503, bascules de clé/modèle de secours),
   économie d'appels (tours traités localement sans appel payant), santé des clés de secours.
   Calculée à partir de compteurs cumulés en base de données (`kpi_counters`), incrémentés aux
   points d'appel réseau réels (`lib/lia.ts::think()`, `app/api/lia/route.ts::generateDossierFragment()`).
2. **Performance/robustesse — code** (Article 5, Article 7 : épreuve de la page blanche). Santé
   structurelle du code lui-même, calculée par analyse statique du dépôt, sans aucun lien avec le
   runtime : nombre de tests dans `check-house.mjs`, propreté de `tsc --noEmit`, nombre de points
   fragiles ouverts (`docs/referentiel/points-fragiles.md`), taille des fichiers les plus denses.
   Zéro risque d'effet de bord sur le jeu : cette famille ne lit jamais l'état d'une partie, elle
   lit le dépôt.
3. **Qualité** (Article 0 : esprit des personnages, Article 11 : zéro répétition). Proportion de
   répliques générées par le modèle vs de répliques de secours (`groundPrivateThought` et
   équivalents), nombre de fois où un garde-fou anti-répétition a dû intervenir, et référence à la
   dernière vérification approfondie par `check-spirit.mjs` (date + verdict, enregistrés
   manuellement après chaque passage — cet outil coûte de vrais appels API donc reste lancé à la
   main, jamais automatisé, cf. CLAUDE.md Article 13).
4. **Logique/cohérence** (Articles 2, 4, 12, 17). Nombre d'interventions des garde-fous de
   cohérence (`groundTruncation`, `groundRoomSpeech`, etc.), séparé par personnage (Lia/Noé).
5. **Rejouabilité/rythme** (Article 9). Capturée en fin de session, au moment du `reset`, dans une
   table dédiée (`kpi_session_snapshots`) qui survit au nettoyage des tables de jeu (`memories`,
   `conversations`, etc. — sinon cette famille perdrait toute son histoire à chaque nouvelle
   partie) : nombre de tours jusqu'à la révélation, répartition des 9 bonus de la roulette, nombre
   de disputes, variété des ouvertures de session.

## Quand les valeurs se mettent à jour

*(Précisé le 2026-09-19, à la demande explicite de l'utilisateur : « reprécisons ensemble quand
les valeurs se mettent à jour : à chaque nouvelle mise à jour, à chaque changement selon moi, ce
qui permet de mesurer les impacts ».)* Deux couches distinctes, jamais confondues :

- **Les compteurs eux-mêmes** (`kpi_counters`, `kpi_session_snapshots`) se mettent à jour en
  continu, dès qu'un événement réel se produit dans le jeu (un appel Gemini qui échoue, une
  session qui se termine...) — jamais en différé, jamais par lot.
- **La LECTURE/le rapport** (ce que l'utilisateur ou l'agent consulte) suit une règle différente,
  volontairement pensée pour mesurer un IMPACT plutôt que de donner une simple photo isolée : à
  chaque changement de code susceptible d'affecter un chiffre du tableau de bord, l'agent relève
  un instantané AVANT de toucher au code et un second APRÈS, pour pouvoir dire explicitement ce
  que ce changement précis a fait bouger — plutôt qu'un relevé isolé dont on ne saurait pas à quoi
  comparer. Pour la famille "Performance/robustesse — code" (analyse statique, zéro coût), ce
  réflexe avant/après s'ajoute simplement aux vérifications déjà systématiques de l'Article 5
  (`tsc`, `check-house.mjs`) à chaque changement. Le point de fin de chantier annoncé à
  l'utilisateur (cf. ci-dessous) resitue cet avant/après dans le rapport, plutôt que de se contenter
  d'un chiffre brut sans repère.

## Accès et alertes

- **Accès** : un bouton dédié, séparé du bouton "Admin" (référentiel) déjà existant, protégé par
  le même code d'accès (cohérence avec le mécanisme déjà en place, pas de nouveau système
  d'authentification à maintenir).
- **Alerte de performance** : calcul fait uniquement au moment où l'utilisateur ouvre le panneau
  (jamais de calcul en tâche de fond) — un compteur gratuit s'incrémente à chaque événement réel,
  un seuil est évalué à la lecture.
- **Alerte qualité** : active, remonte à deux endroits — dans le panneau dédié, et mise en
  évidence dans les réponses de l'agent en conversation via une ligne fixe en tout début de
  réponse : `**🚨 ALERTE TABLEAU DE BORD**` suivie d'une phrase courte (convention retenue le
  2026-09-19 après avoir posé la limite honnête qu'une vraie couleur/taille de police n'est pas
  disponible dans ce terminal de conversation).
- **Rapport dans la conversation** : tant que le site n'est pas publié, l'agent fait spontanément
  un point sur ce tableau de bord à chaque fin de chantier important (pas à chaque réponse, pas
  seulement sur demande) — pour compenser l'absence de vrais visiteurs et de retour terrain.
- **Historique** : conservé en base de données pour permettre une comparaison automatique d'une
  session à la moyenne des précédentes (Article 9).

## Outil

`scripts/kpi-report.mjs` — même convention que `scripts/check-gemini-quota.mjs` : un script à
lancer à la demande (`node scripts/kpi-report.mjs`), jamais un processus en continu. Sert à la
fois l'utilisateur (consultation manuelle) et l'agent (relecture rapide de l'état du projet en
début de session ou après un chantier, sans avoir à tout re-dérouler depuis l'historique de
conversation).

## Ce que ce tableau de bord n'est pas

- Jamais une preuve suffisante à elle seule sur la qualité du ton (Article 13 : seule la lecture
  humaine de `check-spirit.mjs` garantit vraiment l'Article 0 — un chiffre n'est qu'un indice pour
  savoir où regarder en priorité).
- Jamais un mécanisme qui modifie le comportement des personnages, même indirectement.
- Jamais visible par un visiteur du site, même partiellement.

## État d'avancement

- **Chantier 1 (2026-09-19) — fait** : famille "Performance/robustesse — code", registre des
  points fragiles (`points-fragiles.md`), script `kpi-report.mjs` en version analyse statique.
- **Chantier 2 — à venir** : tables `kpi_counters` / `kpi_session_snapshots`, familles "Performance
  pure — runtime", "Qualité", "Logique/cohérence", "Rejouabilité/rythme", bouton dédié dans
  l'interface, lien avec `check-spirit.mjs`.
