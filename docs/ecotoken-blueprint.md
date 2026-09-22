# ecotoken — blueprint exportable

Architecture générique d'un outil qui **réduit le coût permanent d'un document toujours chargé**.
Réutilisable sur tout projet piloté par IA où un fichier de charte est rechargé à chaque message —
jamais les sections exactes ni les seuils de ce projet-ci, qui vivent dans
`docs/referentiel/ecotoken.md`.

## Le problème qu'il traite

Dans un projet piloté par IA, un document de charte est rechargé **à chaque message**. Son poids ne
se paie pas une fois : il se paie en boucle. Un document de référence de 30 000 tokens lu à la
demande coûte 30 000 tokens par consultation ; la même taille en charte coûte 30 000 tokens ×
chaque message de chaque session. C'est la seule dette documentaire qui grossit toute seule.

Constat empirique qui justifie un OUTIL plutôt qu'une passe ponctuelle : deux allègements manuels
successifs ont eu lieu, et le fichier est remonté les deux fois.

## Les quatre capacités

**1. Mesurer la pertinence, pas seulement le poids.** La métrique centrale est le **rendement** :
citations réelles du passage ailleurs dans le dépôt ÷ lignes qu'il occupe. Un article très cité et
court est rentable ; long et peu cité, il se paie cher pour peu de service. Le rendement ne
commande jamais une coupe — il ordonne ce qu'on regarde.

**2. Classer par nature, parce que la nature décide de ce qui peut partir.**
- **Règle** — gouverne le comportement de l'agent, reste quoi qu'elle pèse.
- **Narration** — raconte quand et pourquoi une décision a été prise ; précieuse, mais lue à la demande.
- **Inventaire** — énumère ce qui existe ailleurs ; un tableau suffit.
En cas d'ambiguïté, le défaut est RÈGLE : le doute profite toujours à la conservation.

**3. Réduire concrètement.** C'est ce qui distingue cet outil d'un simple scan : il produit le
**texte de remplacement exact**, dit **où atterrit** le texte retiré, et mesure le **gain réel**.
Cinq stratégies génériques, détectées mécaniquement plutôt que déclenchées par une liste codée en dur :
- *catalogue* — une famille de sections bâties sur le même moule devient un tableau.
- *extraction* — une section longue non-règle part dans un document lu à la demande, un renvoi reste.
- *asides* — les apartés narratifs datés rejoignent un historique.
- *doublon* — deux passages disant la même chose fusionnent.
- *déjà mécanisé* — une procédure qu'un crochet applique déjà tout seul : la consigne détaillée
  devient un fait court. C'est le gaspillage le plus invisible du lot — rappeler à l'agent de
  lancer un outil que le crochet lance de toute façon, c'est payer des tokens à chaque message
  pour une consigne qui ne change rien.

**4. Empêcher le retour.** Un budget en tokens, vérifié à chaque commit. **Alerte, jamais
blocage** : ajouter une vraie règle importante doit rester possible, on veut seulement que ça ne se
fasse plus sans le savoir.

## Trois garde-fous non négociables

- **Il ne coupe jamais seul.** Il rédige, l'humain valide. Un allègement raté sur une charte coûte
  plus cher que le poids qu'il économise.
- **Aucune proposition à gain nul ou négatif.** Sur une petite famille, l'en-tête d'un tableau
  coûte plus cher que ce qu'il remplace : c'est le gain MESURÉ qui décide, jamais le nombre de
  membres.
- **Il vérifie qu'un allègement n'a rien cassé.** Tout renvoi cité ailleurs doit encore résoudre, et
  tout contenu déplacé doit exister à sa nouvelle adresse. Limite honnête : ceci vérifie que la
  RÉFÉRENCE résout, jamais que le SENS a été préservé — cette lecture reste humaine.

## La mémoire, et ce qu'elle apprend vraiment

Un registre d'une ligne par passage : poids, gain proposé, **décision**, cible. La décision est la
seule colonne écrite à la main — rien ne peut la deviner. L'outil la relit pour ne jamais
reproposer en tête ce qui a déjà été refusé.

Ce qu'il mesure ensuite est la seule question qui compte pour un outil de réduction : **est-ce que
ça a marché ?** Il compare le poids réellement mesuré au passage précédent à celui d'aujourd'hui —
jamais un gain promis à lui-même. Une charte qui a regrossi est nommée comme telle.

## Frontière avec l'outil de mesure de tokens

Stricte, et dans un seul sens. L'outil de gouvernance de tokens **mesure** (poids, découpage,
citations, apartés) ; celui-ci **réduit** (plan chiffré, texte de remplacement, budget). Le second
importe les fonctions du premier ; le premier ne fait que **pointer vers** le second par un message
texte — jamais un import en retour, qui créerait un cycle. Aucun des deux ne recalcule ce que
l'autre sait déjà.

## Criticité de la cible, et comportement adapté (générique)

Un outil qui réduit du contenu doit savoir sur QUOI il agit avant d'agir. L'échelle générique :

- **Deux niveaux catégoriels**, atteints par un seul fait et jamais par accumulation :
  - *fichier maître* — le document qui gouverne le travail du projet. Reconnu à ce qui le rend
    maître (rechargé en permanence, cité partout, écrit en règles), **jamais à son nom** : c'est la
    condition pour que ce blueprint fonctionne dans un autre projet. Deux chemins de détection,
    déclaration explicite puis déduction sur preuves, et une absence honnête si aucun candidat.
  - *tuyauterie* — le code dont tout dépend (crochets, filet de sécurité, socle partagé). Sans ce
    niveau, un crochet git est classé « périphérique » par la seule densité de règles, alors que le
    casser casse tout. C'est le piège à éviter.
- **Trois niveaux par cumul de signaux** (critique / sensible / ordinaire) et un plancher.

La criticité doit **filtrer réellement**, jamais décorer : au-dessus d'un seuil, les propositions à
risque moyen sortent des propositions applicables — mais restent **listées à part**, car masquer un
gain possible serait mentir.

## Sûreté structurelle

La garantie n'est pas une promesse de bonne conduite : l'outil n'a **aucun chemin d'écriture** vers
un document analysé. Toute écriture passe par une fonction qui refuse toute cible hors du dossier
de l'outil, et un test vérifie les deux moitiés — que la fonction refuse, ET qu'aucun appel
d'écriture ne la contourne. Même en cas de bug, le pire possible est un mauvais rapport chez soi.

## Le contrôle de perte, et le fond protégé

Deux contrôles distincts, tous deux nés d'une perte réelle :
- *références perdues* — ce qui a cessé d'être mentionné (chemins, titres de section), avec les
  pertes **déclarées comme attendues** filtrées : un garde-fou qui crie au loup à chaque réduction
  réussie finit ignoré, et ne garde alors plus rien.
- *fond protégé* — sur un fichier maître : les règles numérotées (nombre ET intitulé exact) et les
  phrases socles doivent survivre. Les socles se **dérivent** de la classification de règles qui
  existe déjà quand il y en a une, plutôt que d'être recopiés dans une seconde liste qui divergera.

**Limite à ne jamais masquer** : ces contrôles vérifient qu'une règle est encore ÉCRITE, jamais
qu'elle a le même SENS. C'est précisément pourquoi la validation humaine reste obligatoire au plus
haut niveau.

## Harmonie avec les autres échelles d'un projet

Un projet mûr a déjà plusieurs échelles (effort de vérification, zones sensibles, gravité d'une
règle). Elles ne mesurent pas le même objet : les fondre en un vocabulaire unique détruit de
l'information. L'harmonie utile est faite de **ponts** là où les objets se rejoignent vraiment
(criticité → niveau de vérification minimal, en réutilisant le vocabulaire d'arrivée existant), de
**lectures** plutôt que de seconds jugements (une zone sensible déjà déclarée se lit, ne se
recalcule pas), et d'un **garde-fou de désaccord** : quand deux mesures du même dépôt se
contredisent sur un même fichier, l'une des deux est fausse — le signaler, sans trancher
mécaniquement laquelle.
