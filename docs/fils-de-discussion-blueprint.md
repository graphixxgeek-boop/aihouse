# BLUEPRINT — LES FILS DE DISCUSSION (un sujet, un fil)

*(Générique : réutilisable sur n'importe quel projet où un humain et une IA échangent sur plusieurs
sujets en parallèle pendant des semaines. Rien ici ne dépend de la Maison IA vivante.)*

---

## LE PROBLÈME QU'IL RÉSOUT, ET IL EST PLUS SUBTIL QU'UN PROBLÈME DE RANGEMENT

Une collaboration longue entre un humain et une IA produit deux flux qui ne se superposent pas :

- l'humain pense **par sujet** — « où en est-on sur la sécurité ? » ;
- la conversation, elle, est rangée **par date** — « qu'est-ce qui s'est dit mardi ? ».

Un journal chronologique répond parfaitement à la seconde question et **jamais** à la première. Il
peut donc être rigoureusement à jour et totalement inutilisable, ce qui est le pire des deux
mondes : personne ne le soupçonne, puisqu'il n'a pas d'erreur.

**Le défaut qui a fait naître cet outil, et il mérite d'être nommé parce qu'il se reproduit
ailleurs** : l'agent vérifiait *« ce FICHIER a-t-il une synthèse ? »* en croyant vérifier *« ce
SUJET a-t-il été traité ? »*. Les deux questions se ressemblent, se mesurent pareil, et n'ont pas
la même réponse. C'est la forme documentaire de la leçon L47 — **un signal ADJACENT lu comme le
signal visé**.

---

## LE PRINCIPE, EN UNE PHRASE

**Un sujet, un fil ; un fil, trois parties ; et un verdict mécanique en trois états sur la seule
question qui compte — suis-je à jour ?**

---

## LA FORME D'UN FIL — trois parties, jamais deux, jamais quatre

| Partie | Ce qu'elle contient | Pourquoi elle existe |
|---|---|---|
| **① L'HISTOIRE** | le résumé de tout ce qui a appartenu à ce sujet, depuis le début | sans elle, chaque reprise recommence la discussion ; avec elle, on reprend où on s'est arrêté |
| **② OÙ ÇA SE SITUE** | la place du sujet dans la stratégie d'ensemble, et de quoi il dépend | un sujet sans place se traite dans le désordre, et le désordre se paie en décisions rediscutées |
| **③ LA CHAÎNE VIVE** | les questions ouvertes, **numérotées** | le numéro est ce qui permet de répondre en trois caractères plutôt qu'en trois paragraphes |

**La numérotation n'est pas de la mise en page, c'est le débit de la conversation.** Pouvoir
répondre « Q3.1 = b » au lieu de recopier la question divise par dix l'effort de réponse, et ce qui
est facile à répondre reçoit une réponse.

---

## LES QUATRE MARQUEURS EN TÊTE DE CHAQUE FIL

Chacun existe parce qu'un contrôle mécanique le lit ; aucun n'est décoratif.

| Marqueur | Exemple | Ce qu'il rend mesurable |
|---|---|---|
| `**Balle :**` | `À TOI` · `À MOI` · `CLOS` · `DORMANT` | qui doit bouger |
| `**Dernier mouvement :**` | `2026-09-30` | depuis combien de temps il ne bouge pas |
| `**Place dans le plan :**` | `Étage 0 — tout le reste en dépend` | où il se situe |
| `**Saisines :**` | les documents d'où le sujet sort | qu'il n'est pas né de nulle part |

---

## LES QUATRE CONTRÔLES — et le troisième état qui fait tout l'outil

| # | La question | Sans quoi |
|---|---|---|
| 1 | tout ce qui m'a été envoyé est-il **déposé** ? | ce qui vit seulement dans la conversation n'est mesurable par rien |
| 2 | chaque envoi est-il **rattaché** à un sujet ? | un document déposé mais orphelin est un document perdu |
| 3 | chaque sujet dit-il **à qui est la balle**, et depuis quand ? | sans ça, personne ne sait qui doit bouger |
| 4 | chaque sujet dit-il **où il se place** ? | un sujet sans place se traite dans le désordre |

**Le verdict a TROIS états, jamais deux : OUI · NON · PAS ENTIÈREMENT MESURÉ.** Un contrôle qu'on
n'a pas pu faire ne se compte **jamais** comme réussi. C'est l'invariant central de ce blueprint :
sans lui, le système répond « à jour » exactement au moment où il est aveugle, c'est-à-dire au
moment où il est le plus dangereux.

---

## CE QU'IL NE FAUT PAS EN FAIRE — trois erreurs, chacune vue pour de vrai

1. **En faire une archive.** Un fil **renvoie** aux originaux, il ne les remplace jamais. Le jour
   où un fil devient la seule trace d'un échange, l'échange est perdu et personne ne le sait.
2. **Le remplir automatiquement.** Le résumé d'un sujet est un jugement ; une machine qui le
   génère produit une apparence de synthèse. L'outil **lit** les fils, il ne les écrit pas.
3. **Compter un contrôle aveugle comme un succès.** Voir ci-dessus. C'est la seule règle du
   blueprint qui n'admet aucune exception.

---

## LA LIMITE HONNÊTE, ET LA DÉCLARER EST LA SEULE PROTECTION POSSIBLE

**Le contrôle n°1 ne peut pas être complet.** Une demande faite à l'oral, dans la conversation, ne
vit dans aucun dossier : aucune commande ne peut signaler son absence, puisqu'une commande ne
mesure que ce qui est déposé. L'outil le dit lui-même à chaque passage (⚪) plutôt que de rendre un
vert qui mentirait.

**Ce trou ne se ferme que par une discipline humaine** : déposer une demande le jour où elle est
faite. Aucune mécanique ne peut s'en charger, et c'est précisément pour ça que ce paragraphe
existe — une impossibilité déclarée protège mieux qu'une promesse implicite.

---

## COMMENT L'INSTANCIER SUR UN AUTRE PROJET

1. Créer le dossier des fils et son `index.md` (la carte d'entrée).
2. Reprendre les quatre marqueurs **tels quels** : ce sont eux que le script lit.
3. Adapter la liste des sujets — elle est propre à chaque projet, et elle change.
4. Brancher le passage périodique : la seule chose que ce registre a à dire est une affaire de
   calendrier (« la balle est chez lui depuis douze jours »), donc un rendez-vous fixe, jamais un
   scan à la demande.
