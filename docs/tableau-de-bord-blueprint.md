# Tableau de bord interne (KPI) — blueprint exportable

*(Créé le 2026-09-19, à la demande explicite de l'utilisateur : « je pense qu'il est utile de
séparer dans le référentiel la conception et l'architecture du tableau de bord — qui peut être
réutilisé dans un autre projet équivalent — de son contenu dynamique qui se renouvelle à chaque
diagnostic ». Même logique déjà appliquée à `docs/outil-resilience-api.md` pour l'outil de
résilience API : ce document décrit le PATRON générique, réutilisable tel quel sur un autre projet
piloté par IA ; l'instanciation propre à *Maison IA vivante* — noms de fichiers, familles exactes,
Articles de charte concernés — vit dans `docs/referentiel/tableau-de-bord.md`, qui référence ce
document plutôt que de répéter le raisonnement générique.)*

## Le problème que ce patron résout

Un projet créatif/applicatif piloté par IA accumule vite plusieurs couches de risques différentes,
qu'on a tendance à ne surveiller qu'à l'oreille ou au hasard des relectures : la fiabilité
technique de ce qui tourne réellement, la santé structurelle du code lui-même, la qualité de ce
que le système produit, la cohérence interne de son comportement, et — pour un système génératif
ou rejouable — la variété de ce qu'il produit d'une exécution à l'autre. Sans instrument dédié, ces
signaux ne remontent que lorsqu'un humain les remarque par hasard, en général trop tard.

## Les 5 familles génériques

1. **Performance runtime** — la fiabilité et le coût de ce qui s'exécute réellement en production
   (appels à un service tiers, latence, taux d'échec, mécanismes de repli déclenchés). Alimentée
   par des compteurs qui s'incrémentent à des événements qui se produisent déjà normalement dans
   l'application — jamais un appel ou une sonde ajoutée spécifiquement pour la mesure.
2. **Robustesse du code** — la santé structurelle du dépôt lui-même, indépendante de tout
   déploiement ou trafic réel : propreté de la vérification de types, état de la suite de tests,
   nombre de points identifiés comme fragiles ou en attente d'une décision de conception, taille et
   densité des fichiers les plus critiques. Calculée par analyse statique — zéro lien avec le
   comportement en production, donc zéro risque d'effet de bord en la construisant.
3. **Qualité de sortie** — pour un système qui produit du texte, une décision ou un artefact généré
   par un modèle : la proportion de sorties génériques/de secours par rapport à des sorties
   fraîchement produites, et une référence à la dernière vérification humaine approfondie (jamais
   remplacée par un chiffre automatique, seulement complétée par lui).
4. **Cohérence logique** — le nombre de fois où un garde-fou de cohérence interne a dû intervenir
   pour rattraper une incohérence avant qu'elle n'atteigne l'utilisateur final ; un chiffre élevé
   ou en hausse est un signal qu'un problème de fond mérite d'être creusé, pas une simple curiosité.
5. **Variété/rejouabilité** — pour un système génératif ou rejouable : la diversité réelle d'une
   exécution à l'autre, capturée à la fin de chaque cycle (session, run, exécution) dans une table
   qui survit au nettoyage de l'état courant — sinon cette famille perdrait toute son histoire à
   chaque nouveau cycle.

Toutes les familles ne sont pas forcément pertinentes pour tout projet ; la troisième et la
cinquième supposent un système génératif ou rejouable. Un projet qui n'a ni composante générative
ni notion de session peut se limiter aux familles 1, 2 et 4.

## Principes d'architecture, quel que soit le projet

- **Outil d'observation, jamais un mécanisme actif.** Aucun chiffre calculé par le tableau de bord
  ne doit jamais influencer une décision prise par la logique métier de l'application. Le rompre
  transformerait un instrument de mesure en un acteur du système qu'il est censé observer.
- **Accès strictement réservé à l'opérateur/administrateur du projet**, jamais exposé, même
  partiellement, à un utilisateur final — en réutilisant si possible un mécanisme d'authentification
  déjà existant plutôt que d'en construire un nouveau à maintenir.
- **Zéro coût ajouté** : les compteurs s'accrochent à des événements qui se produisent déjà
  normalement ; jamais un appel réseau, un calcul lourd ou une sonde supplémentaire créée
  spécifiquement pour nourrir le tableau de bord.
- **Deux couches de mise à jour distinctes, jamais confondues** :
  - les compteurs bruts se mettent à jour en continu, dès qu'un événement réel se produit ;
  - la LECTURE/le rapport suit une logique différente, pensée pour mesurer un IMPACT : un
    instantané avant un changement, un second après, pour savoir ce que ce changement précis a
    fait bouger — plutôt qu'une photo isolée sans repère de comparaison.
- **Alerte visible à la lecture, jamais un calcul en tâche de fond.** Le seuil est évalué au moment
  où quelqu'un ouvre le tableau de bord (ou lance le rapport), pas par un processus qui tourne en
  continu en arrière-plan.
- **Convention d'alerte adaptée au canal disponible.** Dans une interface graphique, une couleur ou
  un badge suffit. Dans un canal texte pur (par exemple un agent IA qui rapporte par écrit, sans
  contrôle réel sur la couleur ou la taille de police), une ligne fixe, en gras, avec un émoji
  reconnaissable, en tout début de message, joue le même rôle sans prétendre à une mise en forme
  que le canal ne permet pas réellement.
- **Utile à la fois à l'humain et à l'agent qui travaille sur le projet.** Un script à la demande
  (jamais un processus continu) qui peut être lancé aussi bien par la personne que par l'IA qui
  l'assiste, pour se réorienter rapidement sur l'état du projet sans avoir à tout re-dérouler
  depuis l'historique de travail.
- **Le document d'architecture reste stable ; les chiffres réels ne s'y accumulent jamais.**
  Historique et instantanés vivent dans un stockage séparé (base de données, fichier d'état non
  versionné) — jamais dans le document qui décrit les règles, sous peine de le voir grossir sans
  fin et de mélanger deux natures d'information différentes (la règle stable, et la mesure qui
  change à chaque diagnostic).

## Ce que ce patron n'est pas

- Une preuve suffisante à elle seule sur la qualité perçue d'un système génératif : un chiffre
  n'est jamais qu'un indice pour savoir où porter l'attention humaine en priorité, jamais un
  substitut à une relecture humaine réelle.
- Un mécanisme qui modifie, même indirectement, le comportement de l'application qu'il observe.
- Un tableau visible par un utilisateur final, même partiellement.
