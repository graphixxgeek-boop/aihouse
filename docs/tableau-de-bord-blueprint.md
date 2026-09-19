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
   l'application — jamais un appel ou une sonde ajoutée spécifiquement pour la mesure. **KPI
   global suggéré** : `tentatives réussies / tentatives totales × 100`. Si cette famille repose sur
   un outil de résilience dédié (rotation de clé/service, repli automatique — cf. le patron
   `outil-resilience-api-blueprint`), deux KPI supplémentaires méritent d'être mis en avant, en tête
   de chaque rapport : la performance globale ci-dessus, et un score de MATURITÉ DE L'OUTIL
   (proportion des capacités de résilience prévues qui sont réellement implémentées ET testées, à
   partir d'une liste de référence fixe et datée — jamais gonflée après coup).
2. **Robustesse du code** — la santé structurelle du dépôt lui-même, indépendante de tout
   déploiement ou trafic réel : propreté de la vérification de types, état de la suite de tests,
   nombre de points identifiés comme fragiles ou en attente d'une décision de conception, taille et
   densité des fichiers les plus critiques. Calculée par analyse statique — zéro lien avec le
   comportement en production, donc zéro risque d'effet de bord en la construisant. **KPI global
   suggéré** : moyenne de la propreté du vérificateur de types (100% si aucune erreur, sinon 0% —
   jamais un crédit partiel) et de la proportion de tests qui passent. Un élément sans plafond
   naturel (nombre de points fragiles, taille de code) reste un compteur brut affiché à côté du %,
   jamais forcé dedans par un seuil arbitraire non justifié.
3. **Qualité de sortie** — pour un système qui produit du texte, une décision ou un artefact généré
   par un modèle : la proportion de sorties génériques/de secours par rapport à des sorties
   fraîchement produites, et une référence à la dernière vérification humaine approfondie (jamais
   remplacée par un chiffre automatique, seulement complétée par lui). **KPI global suggéré** :
   `100 - interventions de repli / sorties totales × 100`.
4. **Cohérence logique** — le nombre de fois où un garde-fou de cohérence interne a dû intervenir
   pour rattraper une incohérence avant qu'elle n'atteigne l'utilisateur final ; un chiffre élevé
   ou en hausse est un signal qu'un problème de fond mérite d'être creusé, pas une simple curiosité.
   **KPI global suggéré** : même formule que la famille 3, avec un détail par composant/persona si
   le système en a plusieurs — un déséquilibre net entre deux composants mérite sa propre action
   dans le rapport plutôt qu'une moyenne qui le masquerait.
5. **Variété/rejouabilité** — pour un système génératif ou rejouable : la diversité réelle d'une
   exécution à l'autre, capturée à la fin de chaque cycle (session, run, exécution) dans une table
   qui survit au nettoyage de l'état courant — sinon cette famille perdrait toute son histoire à
   chaque nouveau cycle. **KPI global suggéré** : diversité des issues possibles réellement
   observées sur une fenêtre récente (`issues distinctes / issues possibles × 100`) — un signal
   PARTIEL tant que la table d'historique inter-exécutions n'existe pas encore, à documenter
   honnêtement comme tel plutôt que présenté comme équivalent à un historique complet.

Toutes les familles ne sont pas forcément pertinentes pour tout projet ; la troisième et la
cinquième supposent un système génératif ou rejouable. Un projet qui n'a ni composante générative
ni notion de session peut se limiter aux familles 1, 2 et 4.

## KPI général — couverture du tableau de bord lui-même

Au-delà des 5 familles, un KPI transversal mesure combien d'entre elles ont produit une vraie
mesure à CETTE exécution précise du rapport (jamais une estimation ni un défaut silencieux) :
`familles mesurées / familles totales × 100`. Affiché juste avant la synthèse globale, avec sa
propre alerte si sous 100% — un tableau de bord qui n'affiche qu'une partie de ses familles sans le
signaler clairement inspirerait une confiance non méritée à sa propre synthèse. Ce raisonnement
généralise le principe suivant : ne jamais confondre "la mesure est basse" avec "la mesure
n'existe pas" (cf. le principe d'architecture "une donnée absente reste une absence" ci-dessous).

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
- **Une donnée absente reste une absence, jamais un faux résultat.** Chaque fonction de calcul doit
  valider la forme de ses entrées avant de produire un chiffre : une métrique manquante, du mauvais
  type, ou un dénominateur à zéro renvoie une absence explicite (jamais `NaN`, jamais un 0% qui se
  ferait passer pour une vraie mesure). Un chiffre affiché avec assurance mais construit sur une
  base invalide est pire qu'une absence de mesure : il inspire une confiance non méritée et peut
  orienter une décision dans la mauvaise direction. Tester explicitement ce chemin de robustesse
  (données malformées → absence) au même titre que le chemin normal (données saines → bon chiffre).
- **Historique compact, séparé du jugement porté dessus.** Les chiffres bruts d'une exécution
  s'accumulent dans un format tabulaire économe (un format ligne-par-exécution avec des en-têtes
  auto-descriptifs consomme nettement moins qu'un format qui répète les mêmes clés à chaque entrée)
  — mais LIRE cet historique et en tirer ce qui mérite l'attention reste un travail de jugement,
  jamais un calcul automatique. Séparer les deux dans deux artefacts distincts : un historique
  chiffré (mis à jour par le script lui-même) et un index des évolutions (mis à jour par la personne
  ou l'agent qui interprète, avec un lien vers le rapport complet archivé de chaque exécution).
- **Dans un canal conversationnel, le détail complet va en fichier, jamais dans le fil.** Le rapport
  intégral (tous les chiffres, toute la période) est produit et archivé, mais seule une synthèse
  compacte (un petit tableau par famille + les points d'attention) doit atteindre la conversation —
  le fichier complet est livré à part, jamais collé en clair, pour ne pas noyer l'essentiel dans le
  détail à chaque exécution.

## Ce que ce patron n'est pas

- Une preuve suffisante à elle seule sur la qualité perçue d'un système génératif : un chiffre
  n'est jamais qu'un indice pour savoir où porter l'attention humaine en priorité, jamais un
  substitut à une relecture humaine réelle.
- Un mécanisme qui modifie, même indirectement, le comportement de l'application qu'il observe.
- Un tableau visible par un utilisateur final, même partiellement.
