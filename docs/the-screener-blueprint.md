# THE-SCREENER — notation indicative de qualité graphique — blueprint exportable

*(Ce document décrit le PATRON générique, réutilisable sur tout projet visuel piloté par IA :
une note indicative de qualité graphique, volontairement secondaire, fondée sur une charte déjà
écrite plutôt que sur un jugement esthétique inventé à la volée. La genèse exacte — les mots de la
personne qui l'a demandé, le calibrage retenu et le nom qu'elle a choisi — vit dans l'instanciation
`docs/referentiel/the-screener.md`, jamais ici.)*

## Ce que ce patron résout, et en quoi il diffère du patron EL-PROFESSOR

EL-PROFESSOR note un TEXTE contre une charte de contenu. Ce patron note une IMAGE (un rendu visuel)
contre une charte graphique — un problème de nature différente : un agent de raisonnement ne peut
pas "lire" un rendu visuel sans un vrai moyen de le capturer d'abord. Ce patron part donc d'un
constat souvent oublié : **avant même de pouvoir noter quoi que ce soit, il faut construire le
moyen de VOIR** — un protocole de simulation textuelle (comme celui qui alimente EL-PROFESSOR)
n'ouvre jamais de navigateur et ne produit donc aucune image à juger.

## Statut délibérément secondaire — jamais au cœur du projet

Contrairement à EL-PROFESSOR (dont la note alimente directement le travail de correction),
THE-SCREENER produit une note strictement **indicative** : elle signale des pistes, jamais un
verdict qui prime sur le jugement esthétique de la personne qui pilote le projet. Cette hiérarchie
doit rester explicite dans chaque rapport produit — jamais un chiffre présenté comme une vérité
objective sur la beauté d'un rendu, qui reste par nature un jugement humain.

## Principe de sobriété — le token est la ressource la plus contrainte ici

Contrairement à un texte (bon marché à faire lire à un agent), une image coûte cher à faire
analyser et le pilotage d'un navigateur a un coût d'exécution réel. Ce patron privilégie donc
l'économie MÊME AU PRIX DE LA PERFORMANCE, décision explicite de l'utilisateur :
- **Un nombre de captures volontairement très bas** (2 par principe, jamais un flux continu ni une
  capture par état/pièce/round) — le strict minimum pour repérer une tendance, jamais une
  couverture exhaustive du rendu.
- **Les captures se prennent à des moments choisis pour leur valeur informative maximale**, jamais
  à intervalle régulier aveugle (un intervalle fixe risquerait de manquer les moments qui comptent
  ou de gaspiller des captures sur des instants sans intérêt visuel).
- **Aucune sollicitation de l'API du jeu lui-même** pour cette notation — la lecture des images est
  un travail de raisonnement (vision), jamais un appel supplémentaire au modèle du projet ; seul le
  pilotage du
  navigateur (Playwright ou équivalent) a un coût, purement local, jamais un appel réseau facturé.

## Méthode : fondée sur une charte graphique déjà écrite, jamais un goût improvisé

Comme EL-PROFESSOR ne juge jamais sans la charte de contenu du projet, THE-SCREENER ne juge jamais
sans une charte graphique déjà écrite (dans ce projet : `docs/referentiel/regles-des-graphismes.md`)
— construire ce patron avant que cette charte existe reviendrait à noter sans base, un jugement
d'humeur maquillé en méthode. Les critères de jugement doivent être un petit nombre (2-4), chacun
directement traçable à une règle déjà écrite dans cette charte.

## Format de sortie

Même discipline qu'EL-PROFESSOR : note globale + détail par critère + justification concrète
(décrire ce que montre chaque capture, jamais un chiffre nu) + une synthèse en langage clair,
livrée en fichier, jamais collée en clair dans une conversation de travail.

## Ce que ce patron n'est pas

- **Pas un outil de gestion de la refonte visuelle elle-même.** Un outil séparé et plus large
  (suivi des écrans à refaire, priorisation, checklist) reste un projet distinct, jamais fusionné
  avec ce patron — décision explicite de l'utilisateur pour ce projet.
- **Pas un remplacement du jugement esthétique humain.** Une note ici n'est jamais un verdict de
  qualité au sens fort, contrairement à EL-PROFESSOR dont la note guide directement la correction —
  ici, l'appréciation finale reste toujours celle de la personne qui pilote le projet.
- **Pas exhaustif par construction.** Deux captures ne peuvent jamais couvrir tous les états
  visuels possibles d'un projet — ce patron est un signal, jamais un audit visuel complet.

## Principes d'architecture, quel que soit le projet

- **Économie avant exhaustivité**, à l'inverse du réflexe par défaut d'un outil de QA visuelle
  classique (qui capturerait large "pour être sûr") — assumé comme un choix de sobriété, pas une
  limite technique.
- **Jamais de note sans charte graphique de référence.**
- **Toujours indicatif, jamais décisionnel** — l'écart avec EL-PROFESSOR (dont la note guide
  directement un travail de correction) doit rester visible dans la façon dont chaque rapport est
  formulé et utilisé.
