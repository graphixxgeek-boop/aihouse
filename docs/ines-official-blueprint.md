# INES-official — la secrétaire qui aplatit et annote le dépôt — blueprint exportable

*(Créé le 2026-09-21, nom capturé lors d'une session antérieure — jamais construit avant ce soir,
retrouvé grâce à une question directe de l'utilisateur sur les outils encore non concrétisés.
Description d'origine : « une secrétaire qui fournit le code du projet entier, propre, nettoyé, en
une version de référence ». Même logique documentaire qu'ARGUS/HARMONIA/THE-KING : ce document
décrit le PATRON générique ; l'instanciation propre à *Maison IA vivante* vit dans
`docs/referentiel/ines-official.md`.)*

## Le problème que ce patron résout

Un projet qui accumule beaucoup de fichiers de code répartis dans plusieurs dossiers rend certaines
lectures d'ensemble pénibles : donner un instantané complet et lisible du code à un tiers (un autre
outil, un audit, une relecture humaine) demande soit d'ouvrir des dizaines de fichiers un par un,
soit d'inventer à chaque fois un script de concaténation ad hoc. INES-official répond à ce besoin
précis, une fois pour toutes : produire, à la demande ou périodiquement, une seule édition
consolidée, lisible de bout en bout, annotée avec les signaux de qualité déjà calculés ailleurs dans
le projet — jamais un second calcul de ces signaux.

## MVP délibérément restreint : APLATIR + ANNOTER, jamais RÉÉCRIRE

Choix calibré explicitement avec l'utilisateur : ce patron ne modifie JAMAIS le code réel. Il
n'effectue aucune réécriture, aucune suggestion de refactoring appliquée automatiquement — seulement
une lecture et une mise en forme. Une piste plus ambitieuse (réécrire le dépôt lui-même) a été
explicitement écartée comme trop risquée et trop coûteuse pour une première version.

## Le périmètre est un choix à chaque édition, jamais une décision figée

Deux périmètres possibles à chaque édition — code seul, ou code et documentation ensemble — jamais
un choix unique gravé dans l'outil. Ce paramètre runtime laisse le choix à qui déclenche l'édition
selon le besoin réel du moment (une revue de code pure contre une revue incluant les décisions
documentées), plutôt que de forcer une décision qui vaudrait pour tous les usages futurs.

## Annotation : réutiliser, jamais recalculer

Chaque fichier de l'édition porte une courte annotation faite des signaux DÉJÀ calculés ailleurs
dans le réseau d'outils du projet (ex. stagnation relative). Ce patron n'invente jamais un second
calcul de robustesse ou de fraîcheur : il consulte ce qui existe déjà. **Limite honnête, à ne jamais
masquer** : tous les signaux d'un projet donné ne se prêtent pas également à un rattachement fiable
par fichier — un signal qui vit sous forme de texte libre non indexé par fichier (ex. un scan de
détection de trous logiques) ne doit jamais être rattaché de force à un fichier précis si ce lien
n'est pas réellement garanti ; mieux vaut l'omettre que fabriquer un lien qui n'existe pas.

## Économie de dépôt : le corps n'est pas un historique, les métadonnées le sont

Une édition consolidée d'un dépôt entier peut peser plusieurs mégaoctets — la committer intégralement
à chaque édition grossirait le dépôt sans fin pour une valeur de consultation ponctuelle. Le PATRON
distingue donc deux niveaux : le corps de la dernière édition (volumineux, gardé localement,
remplacé à chaque nouvelle édition, jamais un historique complet) et les métadonnées de chaque
édition (date, version, périmètre, nombre de fichiers, taille — légères, committées, tenant lieu
d'historique). Même raisonnement déjà appliqué ailleurs dans ce projet à un journal volumineux
(cf. le journal JSON brut des simulations, jamais archivé lui-même, seulement son résumé).

## Table des matières et datage/versionnage — deux enrichissements attendus dès la première version

Une édition consolidée sans table des matières oblige à tout parcourir pour localiser un fichier —
la table des matières en tête, listant chaque fichier avec son annotation, est attendue dès la
première version, jamais un ajout différé. De même, chaque édition porte un numéro de version
croissant et une date, sur le même principe que le catalogue nommé d'un éventuel orchestrateur déjà
existant dans le projet (LE-COORDINATEUR pour ce projet précis) : une édition sans identité propre
serait impossible à référencer dans une conversation ultérieure.

## Déclenchement : périodique, jamais seulement sur demande

Contrairement à un outil purement réactif, ce patron doit être proposé PÉRIODIQUEMENT (via la
routine de tâches du projet si une telle routine existe déjà) plutôt que de dépendre uniquement d'une
demande explicite — sans quoi une édition consolidée pourrait rester périmée indéfiniment sans que
personne n'y pense.

## Ce que ce patron n'est pas

- Un outil de refactoring : il ne modifie jamais le code réel, jamais.
- Un second calcul de qualité : il consulte les signaux déjà calculés ailleurs, jamais un nouveau
  calcul redondant.
- Un historique complet des éditions passées : seules les métadonnées de chaque édition sont
  conservées durablement, jamais le corps volumineux de chaque édition successive.
