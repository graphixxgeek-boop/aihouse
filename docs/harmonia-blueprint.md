# HARMONIA — cohérence des liens — blueprint exportable

*(Créé le 2026-09-19, à la demande explicite de l'utilisateur : « on pourrait créer le cousin
d'ARGUS : un système qui, lui, vérifie la cohérence existante, toutes les interconnexions, les
interdépendances, tous les liens, entre tout [...] il vérifie l'arbre des conséquences, des cause
à effet, il étudie toute la cohérence du système existant, repère les points sensibles, émet des
alertes sur les nœuds importants ». Même logique déjà appliquée à `docs/argus-blueprint.md` : ce
document décrit le PATRON générique, réutilisable tel quel sur un autre projet piloté par IA ;
l'instanciation propre à *Maison IA vivante* vit dans `docs/referentiel/harmonia.md`. Nommé
HARMONIA d'après la déesse grecque de l'harmonie et de la concorde — le mot que l'utilisateur a
lui-même employé trois fois pour décrire l'objectif de cet outil, et une figure de la même famille
mythologique qu'Argus.)*

## Le problème que ce patron résout, et en quoi il diffère d'ARGUS

Un projet qui grossit accumule des LIENS RÉELS entre ses parties — une jauge qui influence un
dialogue, un mécanisme temporel qui module un autre système, une valeur documentée qui doit rester
égale à une constante du code. Deux façons distinctes pour ces liens de mal vieillir :
- **ARGUS** traque les ABSENCES : quelque chose qui devrait exister et n'existe pas (un cas
  jamais pensé, une donnée jamais lue).
- **HARMONIA** traque les FRICTIONS dans ce qui existe déjà : deux éléments réels qui se
  contredisent, un lien qui a existé puis s'est rompu sans que personne ne le remarque (une
  documentation qui affirme une valeur que le code ne respecte plus, une conséquence en cascade
  qu'un changement récent a oubliée), une zone du projet où beaucoup de choses dépendent d'un même
  point sans que ce risque soit visible nulle part.

Les deux angles sont complémentaires et volontairement séparés : fusionner ARGUS et HARMONIA en un
seul raisonnement ferait perdre la clarté de chacun (chercher une absence et chercher une
contradiction sont deux exercices mentaux différents).

## Les trois fonctions de HARMONIA

1. **Cartographier** — représenter, par grand thème plutôt que fichier par fichier, ce qui dépend
   de quoi dans le projet (cf. "Granularité" ci-dessous). Un thème est un concept qu'un humain
   reconnaît sans lire le code (« la facturation », « l'authentification », « le cache »), pas un
   nom de fonction.
2. **Vérifier** — reprendre chaque lien documenté et confirmer qu'il tient encore dans le code
   réel, pas seulement dans le document qui le décrit. Un lien qui n'a pas été revérifié récemment
   est un lien dont on ne peut plus garantir qu'il est vrai.
3. **Alerter** — signaler les nœuds sensibles (un concept dont dépendent beaucoup d'autres,
   donc risqué à modifier sans vérification complète) et les frictions déjà constatées, avec la
   même échelle de confiance qu'ARGUS (confirmé / probable / à surveiller).

## Granularité : par grand thème, jamais par fichier

Une carte au niveau du fichier ou de la fonction devient vite plus longue que le code lui-même et
diverge aussi vite que lui. HARMONIA travaille par CONCEPT reconnaissable — le genre de mot qu'un
humain du projet emploie en réunion sans ouvrir un fichier (« la facturation », « les droits
d'accès », « le cache », « les notifications »...) — en indiquant pour
chaque thème quels autres thèmes il influence ou dont il dépend — suffisant pour tracer un arbre de
conséquences utile à un humain qui doit décider si un changement est risqué, sans jamais prétendre
remplacer la lecture du code pour le détail d'implémentation.

## Carte vivante, jamais figée

Contrairement à un simple document de règles, la carte de HARMONIA est un artefact qui doit rester
exact dans le temps : mise à jour à chaque fois qu'un lien change (un nouveau thème apparaît, une
dépendance existante disparaît ou s'ajoute), au même titre que `principes.md`/`parametres.md`
(Article 13 de ce projet). Un lien qui n'existe plus mais reste documenté est lui-même une
friction — HARMONIA doit détecter cette dérive dans SA PROPRE documentation, pas seulement dans le
reste du projet.

## Toujours revérifier le code, jamais se fier à la documentation seule

Principe central, tranché explicitement avec l'utilisateur : une documentation peut elle-même être
en retard sur le code (déjà constaté plusieurs fois sur ce projet). HARMONIA ne considère donc
jamais un document de référence comme la vérité — il la considère comme une HYPOTHÈSE à
reconfirmer contre le code source à chaque vérification. La partie mécanique et gratuite de
HARMONIA peut automatiser une partie de cette reconfirmation pour les affirmations chiffrées
(une valeur documentée doit être égale à la constante réelle du code qu'elle décrit) ; la partie
qui demande un vrai raisonnement (un lien conceptuel, pas un chiffre) reste une vérification
manuelle, à la demande.

## Toujours déployé, jamais optionnel

Même principe que pour ARGUS (Article 20) : la partie mécanique tourne à chaque changement de
code ; la partie raisonnement se déclenche à l'initiative de l'agent ou de la personne qui pilote
le projet, avant tout changement qui touche un nœud sensible identifié dans la carte, avec un
rappel explicite dans le protocole de travail pour ne jamais laisser cette vérification dépendre
uniquement de la mémoire de quelqu'un.

## Registre des frictions trouvées

Même schéma qu'ARGUS et le tableau de bord : un dossier dédié (fichiers + index), séparé du
document de carte lui-même, pour ne jamais mélanger la RÈGLE stable (la carte) et les
TROUVAILLES qui s'accumulent au fil des vérifications.

## Principes d'architecture, quel que soit le projet

- **Un détecteur, jamais un correcteur automatique** — mêmes garanties qu'ARGUS.
- **Zéro coût pour la vérification mécanique des chiffres** (comparaison texte-vs-constante,
  aucun appel réseau).
- **La carte reste lisible par un humain sans connaissance du code** — un thème, pas un nom de
  variable ; cohérent avec l'exigence de clarté déjà en vigueur sur ce projet pour toute
  communication avec la personne qui le pilote.
- **Jamais redondant avec ARGUS** : si une vérification ressemble à "est-ce que quelque chose
  manque", c'est ARGUS ; si elle ressemble à "est-ce que deux choses qui existent se contredisent
  ou une dépendance a changé sans qu'on l'ait suivie", c'est HARMONIA.

## Ce que ce patron n'est pas

- Un remplacement de `principes.md`/`parametres.md`/etc. : HARMONIA cartographie les LIENS entre
  les sujets que ces documents décrivent chacun en détail, il ne duplique jamais leur contenu.
- Une preuve d'absence totale de friction : une carte par grand thème peut manquer un détail fin,
  volontairement, pour rester lisible — la partie raisonnement reste nécessaire pour les cas fins.
- Un mécanisme qui modifie, même indirectement, le comportement du projet qu'il observe.
