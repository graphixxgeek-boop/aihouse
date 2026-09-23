# Blueprint générique — l'agent dédié à la CHARTE d'un projet

*(Réutilisable tel quel sur un autre projet. Instanciation sur celui-ci :
`docs/referentiel/moise-tables-de-loi.md`. Écrit pour une IA qui ne connaît pas ce dépôt.)*

## Le problème qu'il résout, et il est universel

Tout projet piloté par IA finit par avoir **un document de règles rechargé à chaque message**.
Ce document grossit, parce que chaque incident y ajoute une règle et qu'aucun incident n'en retire.
Trois choses arrivent alors, toujours dans cet ordre :

1. **Plusieurs outils le touchent, aucun n'en est responsable.** Celui qui mesure les tokens en
   prend un bout, celui qui régule la consommation en prend un autre. Le périmètre existe, la
   responsabilité non.
2. **Le savoir vit dans la tête de l'agent.** Quelle règle peut partir, laquelle est intouchable,
   ce qu'on a déjà tenté et qui n'a pas tenu : rien de tout ça n'est écrit, donc tout est reperdu à
   chaque session.
3. **L'instrument de mesure se périme sans le dire.** Une table de classification produite une fois
   continue de rendre des chiffres après que le document a changé. Des chiffres périmés ont l'air
   justes.

## Ce qu'il est

**Un agent de périmètre, pas un scanner de plus.** Sa règle d'appartenance est un test unique :
*est-ce que cette capacité ne sert QU'à ce document ?* Si oui, elle lui appartient. Si elle vaut
pour n'importe quel document, elle reste chez l'outil générique et il l'APPELLE.

Ce test tranche tout, y compris les cas pénibles. Compter le poids en tokens d'un texte : générique.
Découper ce texte en articles numérotés propres à cette charte-ci : spécifique.

## Les six capacités, et la preuve de besoin de chacune

Aucune ne vient d'une liste de bonnes idées : chacune est un geste qu'un agent a dû faire à la main,
au moins une fois, pour produire un vrai diagnostic.

| Capacité | Ce qu'elle répond | Pourquoi elle ne pouvait pas rester dans la tête de l'agent |
|---|---|---|
| **Découpage en unités** | où commence et finit chaque règle | le bornage a un piège (la dernière unité avale la suite du fichier) ; un agent qui le réécrit reproduit le bug |
| **Mesure croisée** | combien le reste du projet s'appuie sur cette règle | demande un balayage complet du dépôt, prohibitif à refaire à la main par règle |
| **Porteur déclaré et vérifié** | cette règle est-elle tenue par un mécanisme, ou seulement par sa prose ? | c'est la colonne qui décide ce qui peut maigrir, et personne ne la calculait |
| **Nature** | quel GESTE cette règle appelle | une classification non écrite est une classification perdue |
| **Document d'accueil vérifié** | ce renvoi part-il vers un document qui existe et qui porte déjà le contenu ? | un renvoi mort ressemble à un lien, ce qui est pire qu'une absence |
| **Mémoire des opérations** | qu'a-t-on déjà tenté sur cette règle, et qu'est-ce qui n'a pas tenu ? | sans elle, la même erreur se refait, au même endroit, sans que rien ne prévienne |

## Les trois états du porteur, jamais deux

C'est le cœur de l'outil, et la version naïve ne marche pas. Compter « cette règle est-elle citée
par du code ? » répond *oui* partout dès qu'un projet cite ses règles dans ses commentaires — une
MENTION n'est pas un MÉCANISME.

La mesure honnête tient en deux temps, et aucun ne devine : **la règle nomme-t-elle son porteur ?**
puis **ce porteur existe-t-il ?** D'où trois états :

- **porté** — nommé et trouvé ;
- **sans porteur** — rien de nommé : la prose est le seul mécanisme, donc intouchable en substance ;
- **fantôme** — nommé et introuvable. **C'est le pire des trois**, et c'est pour lui que la mesure
  existe : un porteur fantôme rassure à tort, là où une absence assumée laisse la vigilance éveillée.

## Les quatre natures, et le geste que chacune commande

Ce ne sont pas des catégories de rangement. Chacune existe parce qu'elle appelle un geste différent :

| Nature | Geste |
|---|---|
| **LOI** | intouchable — doit rester sous les yeux en permanence |
| **MODE D'EMPLOI D'OUTIL** | réductible à un aiguillage : le déclencheur + un renvoi vérifié |
| **DISCIPLINE SANS PORTEUR** | substance intouchable ; seule la genèse datée peut partir |
| **INVENTAIRE** | remplaçable par une convention, à condition d'un garde-fou mécanique |

**La nature PROPOSÉE ne vaut jamais décision.** L'outil propose depuis des signaux mécaniques ;
l'humain tranche. Et la décision humaine **survit à la régénération** : le générateur relit son
propre document avant de le réécrire et reprend toute nature marquée « décidé ». Un outil qui
écraserait un arbitrage à chaque passage serait pire qu'inutile.

## La mémoire : au grain de la RÈGLE, jamais de la passe

Une ligne par passe d'ensemble sait dire « on a gagné 1 200 tokens le 20 ». Elle ne sait pas dire
« cette règle-ci a déjà été allégée deux fois, la seconde a été annulée parce que le renvoi pointait
dans le vide ». Seul le second énoncé empêche de refaire l'erreur — c'est donc le grain de la règle,
et pas un autre.

Champs : date · règle · geste · avant · après · décidé par · résultat (tenu / annulé / à revoir) ·
pourquoi. Le champ « résultat » est celui qui porte toute la valeur : une opération annulée est
l'information la plus chère du registre.

Un historique reconstitué a posteriori est **déclaré comme tel**, ligne par ligne. Reconstituer est
légitime ; faire passer une reconstitution pour un enregistrement ne l'est pas.

## Le hors-unités, qu'un découpage par règle ne voit jamais

Une charte contient des règles numérotées ET des sections qui n'en sont pas — inventaires, prose de
cadrage. Un diagnostic qui ne couvre que les règles peut passer à côté de la moitié du document tout
en ayant l'air complet. **La couverture réelle se DÉCLARE en pourcentage**, jamais ne se suppose.

## Ce qu'il ne fait JAMAIS

- **Il ne modifie pas la charte.** Il mesure, se souvient, alerte et met en forme.
- **Il n'écrit pas l'analyse ni le plan d'action.** Il rassemble les faits et nomme ce qui appelle
  une décision. Un outil qui conclut à la place de l'agent produit un jugement que personne n'a porté.
- **Il ne décide jamais d'une nature.** Il propose.
- **Il ne bloque rien.** Il signale.

## Les deux sorties, volontairement séparées

- **Le dossier technique** — pour l'agent : toutes les règles, toutes les colonnes. Illisible pour
  un humain, et c'est normal : ce n'est pas son public.
- **La synthèse stratégique** — pour l'humain : les points sensibles, ce qui a bougé, ce qui attend
  sa décision. Quelques lignes.

Les fabriquer séparément plutôt que de résumer la première à la main garantit qu'un point sensible
ne saute pas d'une fois sur l'autre.

## Le garde-fou de fraîcheur, gratuit, à chaque enregistrement de code

Deux vérifications instantanées : la cartographie couvre-t-elle toutes les règles actuelles ? la
table de classification aussi ? Coût nul, et elles ferment le défaut le plus coûteux du domaine —
**décider sur un instrument périmé**.

## Le process qui va avec

L'outil ne suffit pas : il faut que l'ordre des gestes soit écrit, sinon il se recompose de tête à
chaque fois, différemment. Dix étapes, dont la première est *relire la mémoire* et la dernière
*enregistrer ce qui a été appliqué*. Une étape dont aucune trace disque ne peut attester est
**déclarée non mesurable**, jamais comptée au vert.

## Nommage — la leçon qui a coûté un renommage

La première version de cet outil portait le nom d'un modèle d'IA précis. L'utilisateur l'a refusée
en deux mots : « pas exportable ». Il avait raison, et la remarque dépasse le nom : **un outil qui
ne peut servir que sur ce projet-ci a raté la moitié de sa mission.** Les documents qu'il produit
suivent la même règle — ils se nomment d'après la fonction (« charte-… »), jamais d'après le nom de
fichier particulier d'un projet.
