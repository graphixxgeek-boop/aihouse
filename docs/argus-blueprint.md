# ARGUS — détecteur de trous logiques — blueprint exportable

*(Créé le 2026-09-19, à la demande explicite de l'utilisateur : « je voudrais aussi que tu crées
un système de détection des "trous" dans le code : des situations qui nécessitent d'être codées
mais qui ne le sont pas [...] ce doc est la garantie d'une logique sans faille, d'un modèle
parfaitement cohérent ». Même logique déjà appliquée à `docs/outil-resilience-api.md` et
`docs/tableau-de-bord-blueprint.md` : ce document décrit le PATRON générique, réutilisable tel
quel sur un autre projet piloté par IA ; l'instanciation propre à *Maison IA vivante* vit dans
`docs/referentiel/argus.md`, qui référence ce document plutôt que de répéter le raisonnement
générique. Nommé ARGUS d'après Argus Panoptès, la figure mythologique aux cent yeux qui ne dort
jamais complètement et voit dans toutes les directions à la fois — l'image retenue explicitement
par l'utilisateur pour cet outil.)*

## Le problème que ce patron résout

Un projet qui grossit par ajouts successifs accumule des angles morts qu'aucun humain ni aucune IA
ne peut repérer à la seule force de la relecture : une combinaison de mécanismes jamais envisagée
ensemble, un cas limite ou une possibilité inattendue non pensée au moment de coder, une
conséquence que la logique impose mais que personne n'a explicitement tirée, un élément qui
devrait être impacté par un changement mais ne l'est pas, un lien discret entre deux parties du
projet que personne n'a remarqué. Ces trous ne sont pas des bugs au sens classique (rien ne plante,
rien n'affiche une erreur) : ce sont des absences — quelque chose qui AURAIT dû exister et
n'existe pas. Une absence ne se voit jamais en lisant le code qui existe ; elle ne se voit qu'en
se demandant systématiquement ce qui MANQUE.

## Les deux familles de trous que ce patron détecte

1. **Trous mécaniques (gratuits, automatisables)** — repérables par une analyse structurelle du
   code, sans avoir besoin de comprendre le sens de ce qui est écrit :
   - **Asymétrie entre deux entités censées être comparables** (dans ce projet : Lia/Noé) — une
     règle, un champ de données ou une branche de code qui existe pour l'une et pas pour l'autre,
     sans justification assumée à côté.
   - **Donnée calculée mais jamais lue** — un champ, une variable ou un état mis à jour quelque
     part dans le code mais dont aucune autre partie du projet ne lit jamais la valeur (le bouton
     jour/nuit manuel de ce projet en était un exemple réel : envoyé jusqu'au modèle de langage
     sans jamais être utilisé).
   - **Combinaison de mécanismes jamais testée ensemble** — deux systèmes indépendants qui peuvent
     être actifs simultanément (dans ce projet : une dispute + une nuit blanche + un bonus actif +
     une hostilité sévère, tous en même temps) sans qu'aucun test ni aucune ligne de code ne
     vérifie explicitement ce qui se passe dans ce cumul.
   - **Trace de travail inachevé** — un marqueur explicite laissé dans le code (`TODO`, `FIXME`,
     un commentaire qui dit "à faire plus tard") jamais refermé.
2. **Trous de raisonnement (nécessitent une vraie réflexion, donc un coût réel)** — ceux qu'aucune
   analyse structurelle ne peut repérer, parce qu'ils demandent de comprendre le SENS d'une idée
   nouvelle ou d'une partie du code : une conséquence logique qu'une nouvelle idée implique sans
   que personne ne l'ait dit explicitement, une possibilité inattendue qu'un scénario ouvre sans
   que quiconque y ait pensé, un lien discret entre deux concepts qui ne saute pas aux yeux.

## Principe fondateur : toujours déployé, jamais optionnel

Contrairement à un outil de diagnostic qu'on lance quand on y pense, ce patron n'a de valeur que
s'il est systématiquement sollicité — un détecteur de trous qu'on oublie d'utiliser au moment
critique manque exactement le trou qu'il existe pour repérer. Deux couches distinctes :
- La famille 1 (mécanique, gratuite) tourne automatiquement à chaque changement de code, comme un
  test de non-régression classique — zéro decision à prendre, zéro oubli possible une fois câblée.
- La famille 2 (raisonnement, coût réel) se déclenche à l'initiative de l'agent OU de la personne
  qui pilote le projet, sur un sujet précis — mais un RAPPEL explicite fait partie du protocole de
  travail habituel, pour que cette sollicitation ne dépende jamais uniquement de la mémoire de
  quelqu'un au bon moment.

## Portée : l'existant ET le nouveau

Ce patron s'applique aux deux mêmes situations, avec deux rythmes différents :
- **Une idée nouvelle proposée en cours de route** — vérifiée avant d'être codée, pendant que le
  coût de correction est encore minime.
- **Le code déjà écrit** — balayé lors d'un audit périodique complet, pas seulement au moment d'un
  changement qui le touche directement (une combinaison de deux mécanismes anciens peut rester un
  trou non détecté pendant des mois si personne ne les remet jamais ensemble).

## Niveau de confiance, jamais une affirmation plate

Chaque trou signalé porte un niveau de confiance explicite, pour ne jamais confondre une
observation certaine avec une simple hypothèse à vérifier :
- **Confirmé** — vérifié directement dans le code ou par un test reproductible ; une action
  corrective peut être engagée directement.
- **Probable** — un signal fort mais qui n'a pas encore été confirmé par un test réel ; à
  vérifier avant d'agir.
- **À surveiller** — une zone identifiée comme potentiellement fragile sans preuve d'un problème
  réel aujourd'hui ; consignée pour référence future, jamais traitée comme un bug avéré.

## Registre des trouvailles

Chaque trou détecté (toutes familles confondues) est consigné dans un registre séparé du document
d'architecture lui-même, sur le même schéma que l'archive KPI de ce projet
(`docs/referentiel/kpi-rapports/` + `kpi-index.md`) : un dossier dédié contenant un fichier par
trouvaille ou par lot de trouvailles, plus un fichier d'index qui sert de table des matières et de
résumé des évolutions — jamais tout accumulé dans le document d'architecture, qui doit rester
stable et lisible.

## Principes d'architecture, quel que soit le projet

- **Un détecteur, jamais un correcteur automatique.** ARGUS signale ; il ne modifie jamais le code
  de lui-même. La décision de corriger, et la façon de le faire, reste toujours une action
  délibérée et documentée séparément (cf. Article 3 : corriger la cause, jamais un
  contournement automatique et silencieux).
- **Un trou fermé est un trou retiré du registre actif**, jamais laissé "au cas où" — même
  logique que le registre des points fragiles de ce projet.
- **Zéro coût pour la famille mécanique.** Les vérifications structurelles s'appuient sur une
  lecture statique du code déjà présent, jamais sur un appel réseau ni un calcul lourd.
- **Le coût de la famille "raisonnement" est assumé et visible**, jamais caché dans un
  fonctionnement silencieux — cohérent avec la sobriété des appels API déjà en vigueur sur ce
  projet (cf. le patron de l'outil de résilience API).
- **Complémentaire, jamais redondant, avec un éventuel outil de cohérence des liens** (dans ce
  projet : HARMONIA). ARGUS traque les ABSENCES (ce qui devrait exister et n'existe pas) ; un
  outil de cohérence des liens traque les FRICTIONS dans ce qui existe déjà (deux éléments réels
  qui se contredisent). Les deux angles sont distincts et se complètent, jamais à fusionner en un
  seul raisonnement qui perdrait la clarté de chacun.

## Ce que ce patron n'est pas

- Une preuve qu'un système est sans faille : un trou non détecté reste possible, en particulier
  parmi les trous de raisonnement, jamais garantis exhaustifs.
- Un mécanisme qui modifie, même indirectement, le comportement du projet qu'il observe.
- Un substitut à la compréhension du code avant d'y toucher (cf. Article 19 de ce projet) : ARGUS
  vient EN PLUS de cette compréhension, jamais à sa place.
