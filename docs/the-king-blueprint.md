# THE-KING — veille au respect du document de philosophie dans les grandes décisions — blueprint exportable

*(Créé le 2026-09-21, à la demande explicite de l'utilisateur, en réaction à une question de l'agent
sur l'utilité réelle de `docs/philosophie-et-politique.md` : « ce document capture bien les leçons,
mais il ne ferme pas encore la boucle vers mes décisions du quotidien [...] cree un agent 'the-king'
qui est chargé de verifier que lorsque tu prends une decision à haut niveau [...] the-king te
rappelle de consulter 'philosophie et politique'. c'est un vrai agent-script qui fait partie de
l'équipe [...] il conserve aussi un historique de l'evolution du document [...] il joue un peu le
role de 'pere' ou 'grand pere'. » Même logique documentaire qu'ARGUS/HARMONIA/CHECK-LEVEL-TARGET :
ce document décrit le PATRON générique ; l'instanciation propre à *Maison IA vivante* vit dans
`docs/referentiel/the-king.md`.)*

## Le problème que ce patron résout

Un projet gouverné par une charte de contenu ET un document de philosophie/politique séparé (le
pourquoi, les arbitrages de fond) court un risque discret : le document de philosophie devient un
manifeste qu'on écrit une fois puis qu'on ne relit jamais au moment où il compterait vraiment — les
grandes décisions (architecture, priorités, choix irréversibles) se prennent sans jamais le
consulter, alors même que c'est exactement leur terrain. THE-KING ferme cette boucle : il ne décide
rien, il rappelle QUAND consulter, vérifie que le document reste vivant, et garde la mémoire de son
évolution.

## Rôle, jamais une autorité sur le fond

THE-KING n'a AUCUN pouvoir de trancher : il ne modifie jamais le document de philosophie, ne propose
jamais de texte de remplacement, ne bloque jamais une décision. Trois fonctions strictement
consultatives :

1. **Rappel ciblé** — reconnaît, dans le texte d'une décision en cours, les catégories de portée qui
   appellent structurellement une consultation du document de philosophie (cf. section suivante) et
   le signale — jamais un rappel systématique sur toute décision, qui perdrait sa valeur d'alerte.
2. **Fraîcheur, jamais un auto-edit** — rapporte depuis combien de temps le document de philosophie
   n'a pas été touché (signal brut, jamais une proposition de texte ni une modification automatique)
   — intégré à la Ronde périodique du projet si une telle Ronde existe déjà.
3. **Mémoire de l'évolution** — reconstruit, à partir des dates portées par les sections du document
   lui-même (quand elles existent), un digest chronologique de son évolution, et signale les paires
   de principes dont le vocabulaire se recoupe fortement mais dont la polarité normative diverge
   ("jamais X" contre "toujours X" sur un terrain proche) — une TENSION POSSIBLE, jamais une
   contradiction prouvée : le candidat le plus honnête qu'une regex puisse produire, toujours soumis
   à une vraie lecture humaine ou agent ensuite.

## Catégories de déclenchement, un petit nombre nommé — jamais un mot-clé isolé

Comme CHECK-LEVEL-TARGET, THE-KING utilise un petit nombre de catégories discrètes et nommées
(chacune avec ses propres mots-signaux), jamais un score continu qui donnerait une fausse impression
de précision. Chaque catégorie répond à la même question : "est-ce que cette décision, une fois
prise, sera coûteuse ou difficile à défaire si elle contredit une valeur de fond du projet ?" Le
nombre et l'intitulé exact des catégories sont propres à chaque projet (cf. instanciation) ; ce qui
est générique, c'est le principe d'une liste courte, nommée, dérivée des vraies tensions déjà vécues
par le projet plutôt qu'inventée à froid.

## Limite honnête, à ne jamais masquer

La détection de catégorie et de tension reste une reconnaissance de motifs sur du texte, jamais une
compréhension véritable de l'intention ou du sens — de la même nature que les autres heuristiques
déjà en place dans l'écosystème (CHECK-LEVEL-TARGET, la détection de redondance de CLAUDE.MD.SPY).
Un faux négatif (une décision réellement structurante qui ne déclenche aucun rappel) reste possible
: THE-KING est un filet, jamais une garantie — le jugement humain/agent reste la vraie protection.

## Registre : l'évolution du document, jamais chaque consultation

Comme CHECK-LEVEL-TARGET, THE-KING est potentiellement consulté à haute fréquence (avant chaque
décision de portée). Son registre n'archive donc jamais un journal par appel, mais les évolutions
réelles constatées du document de philosophie lui-même (une nouvelle section ajoutée, une tension
détectée puis résolue) — même schéma dossier + index que les autres outils du réseau.

## Ce que ce patron n'est pas

- Un remplacement du jugement humain ou de l'agent sur le fond des décisions : il rappelle de
  consulter, il ne consulte jamais à la place de qui décide.
- Un correcteur du document de philosophie lui-même : aucune écriture automatique, jamais.
- Un détecteur de contradiction fiable : c'est un signal de tension possible, jamais une preuve.
