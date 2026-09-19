# HYPER-SCAN-CHECKPOINT — vérification approfondie exceptionnelle — blueprint exportable

*(Créé le 2026-09-19, reconstruit à partir de cinq vrais prompts de l'utilisateur retrouvés dans
l'historique complet de cette session (16 au 19 septembre), à sa demande explicite : « j'ai dû te
demander ça quelque fois, à des moments stratégiques [...] je veux créer avec toi un outil
d'analyse approfondie qui fonctionne sur le modèle de ces prompts ». Confirmé explicitement comme
un vrai outil technique, pas un simple protocole : « il faut en faire une vraie machine de guerre,
un vrai outil technique comme Argus et Harmonia [...] si un blueprint n'est pas nécessaire, c'est
le signe que l'outil n'est pas assez abouti ». Même logique déjà appliquée à
`docs/argus-blueprint.md`, `docs/harmonia-blueprint.md` et `docs/smart-conso-api-blueprint.md` :
ce document décrit le PATRON générique ; l'instanciation propre à *Maison IA vivante* vit dans
`docs/referentiel/hyper-scan-checkpoint.md`.)*

## Le problème que ce patron résout

Les vérifications courantes (une suite de tests, un outil de détection de trous ou de frictions)
couvrent chacune un angle précis, en continu, à faible coût. Mais après une grosse vague de
changements — plusieurs chantiers enchaînés, beaucoup de décisions prises vite — un risque
spécifique apparaît : qu'une consigne ancienne ait été oubliée en cours de route, qu'une
combinaison de mécanismes nouveaux et anciens n'ait jamais été pensée ensemble, qu'un bug se soit
glissé sans qu'aucun outil ponctuel ne l'ait couvert. Ce risque ne se traite pas par PLUS de la
même vérification courante, mais par un ARRÊT DÉLIBÉRÉ, exceptionnel, qui reprend tout depuis le
dernier arrêt de ce type et qui mobilise TOUS les instruments disponibles à la fois, humains et
mécaniques, plutôt qu'un seul angle.

## Preuve que ce patron fonctionne : un cas réel

Le 2026-09-18, une invocation de ce rituel (« approfondis l'audit ») a fait relire l'intégralité
d'une session de 100 tours, consigne par consigne, plutôt que de se fier aux résumés déjà faits.
Résultat concret : une demande explicite faite au tour 64 (« la négociation doit nourrir le dossier
retourné comme preuve de la personnalité de l'observateur ») n'avait en réalité jamais été câblée
dans le code, sans qu'aucun test ni aucune relecture ponctuelle ne l'ait remarqué avant. Corrigée le
jour même. C'est la preuve vivante que ce patron trouve des choses qu'aucune vérification courante
ne trouve — parce qu'il pose une question différente : non pas "ce test passe-t-il", mais "ai-je
vraiment tout fait ce qui a été demandé, et est-ce que tout tient ensemble".

## Deux versions, jamais confondues

- **Version légère (gratuite, zéro appel réseau)** — mobilise tous les outils mécaniques déjà
  existants (détecteur de trous, détecteur de frictions, suite de tests, tableau de bord, registre
  de suivi des tâches, tous les historiques et journaux déjà accumulés) plus une relecture complète
  et littérale du document de charte du projet, jamais un résumé de mémoire. Doit rester
  PERFORMANTE malgré la gratuité — la limite budgétaire ne doit jamais devenir une excuse pour une
  version bâclée.
- **Version complète (coût réel assumé)** — la version légère, plus les vérifications qui
  nécessitent de vrais appels à un modèle : rejouer les scénarios de provocation qui testent
  l'esprit du projet, rejouer des mini-sessions ciblées jusqu'à un résultat propre (plafonné, cf.
  "Garde-fous" ci-dessous), et une DOUBLE PERSPECTIVE indépendante (cf. section dédiée). Toujours
  précédée d'une consultation de l'outil de régulation de la consommation API s'il en existe un
  dans le projet — jamais lancée à l'aveugle sur un budget déjà tendu.

## Portée : depuis le dernier passage, jamais depuis le début

Chaque passage de cet outil couvre exactement ce qui a changé depuis son PROPRE dernier passage
(pas depuis la création du projet) — une mémoire automatique, pas une portée redéfinie à la main
à chaque fois. Cette mémoire vit dans le registre archivé de l'outil lui-même (cf. "Registre"
ci-dessous), jamais dans un fichier d'état caché séparé : le dernier passage enregistré EST la
référence, pas la peine de dupliquer cette information ailleurs.

## La double perspective — un vrai second regard, pas un jeu de rôle interne

Principe central distinctif de ce patron : une partie de la vérification est refaite par un AGENT
RÉELLEMENT SÉPARÉ, qui ne voit pas les conclusions du premier avant de produire les siennes — pas
le même agent qui change de casquette en interne. Un agent qui se relit lui-même en prétendant
adopter un autre point de vue reste biaisé par son propre raisonnement précédent ; un second agent
indépendant produit une vraie redondance, avec ses propres angles morts différents du premier. Les
deux analyses sont ensuite confrontées et réconciliées dans le rapport final — les points où elles
divergent sont eux-mêmes un signal utile, pas juste un désaccord à trancher vite.

## Ce que cet outil mobilise (jamais construit en double, toujours en s'appuyant sur l'existant)

Cet outil est un ORCHESTRATEUR : il ne réimplémente jamais une vérification qu'un autre outil du
projet fait déjà — il les appelle, agrège leurs résultats, et ajoute la couche de raisonnement que
ces outils, pris séparément, ne peuvent pas produire (la fidélité aux consignes passées, la
recherche de combinaisons non pensées, la comparaison humaine de deux versions consécutives). Pour
un projet équivalent, la liste exacte des outils mobilisés dépend de ce qui existe déjà — jamais une
liste figée recopiée d'un projet à l'autre.

## Garde-fous, non négociables

- **Jamais automatique** : se déclenche uniquement sur demande explicite de la personne qui pilote
  le projet. L'agent peut le PROPOSER après avoir remarqué une grosse vague de changements, mais ne
  le lance jamais de sa propre initiative.
- **Boucle de validation itérative plafonnée** : toute boucle "recommence jusqu'à un résultat
  propre" a une limite explicite de tentatives ; au-delà, l'outil s'arrête et remonte le blocage
  plutôt que de consommer des ressources indéfiniment sur un cas qui résiste.
- **Rapport qui distingue explicitement** : ce qui est un vrai oubli corrigé, ce qui était déjà
  identifié et sciemment reporté à plus tard (donc pas un oubli), et ce qui reste une question
  ouverte nécessitant une décision de la personne qui pilote le projet.
- **Jamais un correcteur automatique aveugle** : chaque correction proposée reste compréhensible et
  vérifiable, jamais un changement de masse appliqué sans explication.

## Registre et mémoire

Même schéma que les autres outils de vigilance de ce projet : un dossier dédié (fichiers + index)
qui archive chaque passage — ce qui a été vérifié, ce qui a été trouvé, ce qui a été corrigé, et le
point de repère (par exemple un identifiant de changement dans l'historique du projet) jusqu'où ce
passage a couvert, pour que le passage suivant sache exactement où reprendre.

## Ce que ce patron n'est pas

- Une vérification de routine : son coût (temps, parfois argent) le réserve aux moments qui le
  justifient réellement, jamais un remplacement des filets de sécurité courants et gratuits.
- Une garantie d'exhaustivité totale : même ce niveau de vérification reste mené par un
  raisonnement faillible ; la double perspective réduit le risque d'angle mort, elle ne l'élimine
  jamais complètement.
- Un mécanisme qui invente des standards nouveaux : il vérifie la fidélité à ce qui a déjà été
  demandé et déjà décidé, il ne redéfinit jamais les règles du projet de sa propre initiative.
