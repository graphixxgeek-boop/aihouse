# EL-PROFESSOR — notation de fidélité à la charte — blueprint exportable

*(Créé le 2026-09-19, à la demande explicite de l'utilisateur : « je voudrais un agent qui donne
une note de reussite sur 100 à chaque version, en fonction du respect de la charte des axes de
referentiel [...] comme ca on aurait plus qu'à identifier les erreurs, et moi je me charge aussi
d'evaluer la qualité ». Même logique déjà appliquée à `docs/argus-blueprint.md`,
`docs/harmonia-blueprint.md`, etc. : ce document décrit le PATRON générique, réutilisable tel quel
sur un autre projet piloté par IA qui produit des sessions/conversations à évaluer contre une
charte ; l'instanciation propre à *Maison IA vivante* vit dans `docs/referentiel/el-professor.md`.
Nommé par l'utilisateur lui-même.)*

## Le problème que ce patron résout

Un projet gouverné par une charte de contenu accumule, session après session, des sorties (ici :
des transcripts de simulation) qu'il faut juger contre cette charte. Sans outil dédié, ce jugement
reste soit **mécanique et aveugle** (des compteurs comme un taux d'échos ou de blocages API — utile
mais qui ne lit jamais le SENS de ce qui est dit), soit **une prose libre d'analyse** (fidèle mais
pas comparable d'une version à l'autre, pas de trace chiffrée pour mesurer une évolution réelle).
Ce patron comble l'écart : une lecture réellement qualitative, mais rendue sous une forme notée et
détaillée par thème, pour pouvoir comparer objectivement une version à l'autre au fil du temps.

## Ce que ce patron n'est pas

- **Pas un remplacement du jugement humain sur la qualité globale.** Le rôle d'EL-PROFESSOR est de
  repérer OÙ chercher (quel thème, quel passage précis) — jamais de dire "c'est bon" ou "publiez
  ceci" à la place de la personne qui pilote le projet. La séparation des rôles est explicite et
  volontaire : l'outil identifie les erreurs et les écarts factuels à la charte, la personne évalue
  la qualité (le goût, le ressenti, l'aspect qui ne se réduit jamais à une liste de critères).
- **Pas un remplacement des outils mécaniques existants** (tableau de bord/KPI). Un taux d'échos ou
  de blocages API reste un compteur utile, mais indirect — EL-PROFESSOR s'appuie dessus comme UNE
  des sources d'information possibles, jamais en le dupliquant.
- **Pas une preuve d'objectivité totale.** Sur l'axe qui touche à l'esprit/au ton d'un projet (la
  règle la plus qualitative d'une charte de contenu), même une lecture réelle et sincère reste un
  jugement, jamais une mesure au sens strict — la note doit toujours être accompagnée d'extraits
  concrets qui la justifient, jamais un chiffre nu.

## Méthode : une vraie lecture, jamais un calcul de mots-clés

Contrairement à un détecteur mécanique (comme la famille 1 d'ARGUS), la notation elle-même
nécessite de comprendre le sens de ce qui est dit — impossible à réduire à une recherche de motifs
ou de mots interdits (cf. le corollaire de l'Article 17 de ce projet : une liste de mots figée ne
capture jamais un registre). La lecture doit donc être confiée à un agent de raisonnement réel (le
même qui pilote le projet, ou un agent délégué), jamais automatisée par un script.

Ce coût de raisonnement n'est pas gratuit, mais il n'est pas non plus un coût API au sens de la
sobriété visée par un outil de régulation de quota (dans ce projet : Smart Conso API) : noter une
conversation déjà produite ne sollicite aucun appel supplémentaire au modèle qui a généré cette
conversation. Le vrai coût est un coût de temps/d'attention de raisonnement, à absorber comme
n'importe quelle tâche d'analyse — ce qui rend ce patron compatible avec un déclenchement
systématique (à chaque nouvelle session produite), contrairement à un outil qui rappellerait le
modèle générateur lui-même.

## Squelette de notation, réutilisable

1. **Découper la charte en un petit nombre de grands thèmes observables dans une sortie donnée**
   (jamais plus qu'une poignée — au-delà, la note perd sa lisibilité). Chaque thème doit être :
   - directement rattachable à un ou plusieurs articles/règles précis de la charte du projet ;
   - réellement observable dans la sortie à noter (un thème qui porte sur une propriété du CODE,
     jamais visible dans une conversation produite par ce code, n'a pas sa place ici).
2. **Noter chaque thème séparément**, sur une échelle commune (par exemple /20 pour 5 thèmes
   totalisant /100), toujours accompagnée d'exemples concrets tirés de la sortie — jamais un
   chiffre seul.
3. **Faire remonter la hiérarchie de la charte dans le calcul du score global**, jamais une simple
   moyenne arithmétique aveugle. Si la charte du projet définit elle-même un article suprême
   au-dessus de tous les autres (comme l'Article 0 de ce projet), une note très basse sur le thème
   qui lui correspond doit PLAFONNER la note globale, quels que soient les autres thèmes — refléter
   fidèlement la hiérarchie déjà écrite dans la charte, jamais la contredire silencieusement en
   laissant une bonne moyenne masquer une dérive sur l'article qui prime sur tout.
4. **Toujours une note ET jamais seulement une note.** Le format de sortie attendu est toujours :
   note globale + note par thème + justification concrète par thème (extraits cités) + un
   paragraphe de synthèse en langage clair, pour quelqu'un qui n'a pas le temps de tout relire.
5. **Comparabilité entre versions comme objectif premier.** Le registre des notes doit permettre de
   voir, d'un coup d'œil, l'évolution d'un thème donné au fil des versions/sessions — jamais une
   lecture isolée sans mise en perspective (même exigence déjà en place pour le protocole de
   simulation complète de ce projet).

## Portée : rétroactif ET prospectif

Ce patron s'applique aux sorties déjà produites (pour établir une base de comparaison de départ)
ET à chaque nouvelle sortie produite ensuite. Un score qui ne commence qu'au jour de la création de
l'outil, sans base rétroactive, prive la comparaison de tout son sens pendant les premières
versions suivantes — le patron recommande donc de noter aussi l'historique déjà accumulé, une fois,
au moment de la création de l'outil.

## Registre des notes

Même schéma que les autres registres de ce paysage d'outils (ARGUS, HARMONIA, KPI) : un dossier
dédié contenant un fichier par sortie notée, plus un fichier d'index qui sert de table de
comparaison rapide entre versions — jamais tout accumulé dans le document d'architecture lui-même.

## Partie mécanique minimale, pour ne jamais oublier une note manquante

Même si la notation elle-même est un jugement (famille "raisonnement", coût réel), une toute petite
partie peut et doit rester mécanique et gratuite : vérifier que CHAQUE sortie archivée a bien reçu
une note, et signaler explicitement celles qui n'en ont pas — jamais une omission silencieuse. Cette
partie mécanique tourne comme un test de couverture classique, sans jamais se substituer à la
lecture réelle qu'elle réclame seulement de ne pas oublier.

## Principes d'architecture, quel que soit le projet

- **Un lecteur, jamais un juge absolu.** EL-PROFESSOR note et justifie ; la décision de ce qu'il
  faut corriger, et la décision finale sur la qualité perçue, restent toujours à la personne qui
  pilote le projet.
- **Jamais de liste de mots-clés comme méthode de notation.** Toute tentative de mécaniser le
  jugement qualitatif par une recherche de motifs répète l'erreur déjà documentée ailleurs dans ce
  projet (registre anti-doublon figé) : une liste grandit indéfiniment sans jamais couvrir le
  prochain cas.
- **La hiérarchie de la charte doit se refléter dans le calcul**, jamais une moyenne neutre qui
  l'ignorerait.
- **Complémentaire, jamais redondant, avec les outils mécaniques existants** (dans ce projet : le
  tableau de bord/KPI). EL-PROFESSOR peut s'appuyer sur leurs chiffres comme signal d'entrée, mais
  son verdict propre reste toujours une lecture, jamais un recalcul de leurs compteurs.
