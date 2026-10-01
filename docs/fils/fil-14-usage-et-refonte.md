# FIL 14 — Comment on utilise l'Agence, et faut-il tout reprendre à zéro

**Balle :** À MOI
**Dernier mouvement :** 2026-09-30
**Place dans le plan :** Étage 2 bis — il suppose les objectifs (faits) et précède la cascade. C'est le fil qui décide de la FORME que prendra tout le reste du travail.
**Saisines :** demande du 2026-10-01 dans la nuit (huit sujets) · audit de l'historique complet

---

## ① L'HISTOIRE — ce qui s'est déjà dit sur ce sujet, résumé

**Ce fil naît d'un message unique qui porte huit sujets**, tous déposés mot pour mot dans
`docs/grand-projet/00-sources/01-sa-demande/reponses-2026-10-01-nuit-rationalisation.md`, avec sa
consigne d'ouverture : *« n'oublie rien, tout doit être consigné, et accroche des tâches si
besoin »*.

**Le sujet central, dans ses mots** : *« il faut partir sur un nouveau code totalement propre, et
recommencer tout à zéro, en reprenant tout point par point : situer le cœur de l'agence, et
agréger les modules autour. Franchement je serais partant pour faire ça. »*

### CE QUI EST DÉJÀ MESURÉ ET QUI PÈSE SUR CETTE DÉCISION

**Ces chiffres existent tous, et aucun n'a été produit pour cette question** — ils viennent de
mesures faites pour d'autres raisons, ce qui les rend d'autant plus utiles :

| Ce qui est mesuré | Le chiffre | Ce que ça dit de la refonte |
|---|---|---|
| kits d'export complets | **84 / 84** | ce qui existe est déjà emportable — la refonte n'est pas un sauvetage |
| outils indépendants d'un fournisseur | **94 %** | l'architecture n'est pas prisonnière |
| chemins écrits en dur | **38 fichiers sur 40** | **c'est ça, le vrai désordre**, et c'est ce qu'une refonte corrigerait à la source |
| point de branchement pour une source extérieure | **aucun** | la modularité qu'il veut n'existe pas |
| documents alignés sur la racine | **44 / 59 (75 %)** | la cascade documentaire tient déjà |
| tâches sachant quel objectif elles servent | **14 / 1 272 pour le Jeu** | le second bout n'est pas raccordé |
| obligations portées par tous nos documents | **936**, dont 556 dans un seul | le poids n'est pas là où on le croyait |

### L'AUDIT DE L'HISTORIQUE COMPLET, fait à sa demande le même soir

Il a demandé : *« reprends l'historique de conversation et regarde si tu n'as rien oublié »*.
**Fait mécaniquement, pas de mémoire** : les 216 619 lignes du journal de session ont été
relues en flux, **468 messages réellement humains extraits, 93 201 mots**, puis confrontés à tout
ce que le projet a produit.

**Résultat : une seule vraie demande orpheline sur 93 201 mots** — le rapport de tableau de bord
(tâche **#1348**). Les quatre autres « orphelines » signalées par l'outil sont du dialogue de jeu
qu'il a tapé dans la partie, ou du bruit d'interface.

**Ce que ça dit, et ce que ça ne dit pas** : ça dit que rien de gros n'a été perdu. **Ça ne dit
pas que tout a été traité** — l'outil mesure un recouvrement de vocabulaire, pas une exécution,
et il le déclare lui-même. 367 demandes ressortent « faibles », c'est-à-dire abordées quelque
part sans preuve qu'elles aient été traitées.

---

## ② OÙ ÇA SE SITUE — et pourquoi ce fil est plus haut qu'il n'en a l'air

**Il ne décide pas d'un chantier, il décide de la FORME de tous les chantiers suivants.** Si on
repart à zéro, la cascade ne se « raccorde » pas à l'existant : elle se construit d'emblée dans
le bon ordre. Si on ne repart pas, la cascade devra rattraper 1 272 tâches et 936 obligations
écrites avant elle.

**Les deux voies mènent au même endroit ; elles ne coûtent pas la même chose, et elles ne
risquent pas la même chose.** C'est exactement le genre d'arbitrage qui se tranche sur des
chiffres — et la plupart existent déjà.

---

## ③ LA CHAÎNE VIVE — numérotée, pour que tu puisses répondre par le numéro

**Q14.1 — À MOI, tâche #1344.** Chiffrer la refonte avant d'en dire quoi que ce soit : volume réel
à reprendre, ce qui se recopie vraiment sans réflexion, ce qui ne se recopie pas, et le coût de
faire vivre deux versions. **Un avis donné sans ces chiffres serait l'opinion sans mesure que ce
projet refuse.**

**Q14.2 — À MOI, tâche #1341.** Les deux scénarios d'usage par ZIP, confrontés aux mesures qui
existent — pas à une opinion.

**Q14.3 — À MOI, tâche #1343.** Une carte par MODULE, parce qu'il ne peut pas juger ce qu'il ne
voit pas. C'est le préalable de sa décision, pas un document de confort.

**Q14.4 — À MOI, tâche #1345.** L'état d'avancement complet, produit par les outils.

**Q14.5 — RÉPONDU : (a) ça vaut le coup.** Et il a retourné la question — *« qu'est-ce qu'il
manque en vrai ? on n'est pas si loin d'une agence complète, tu ne trouves pas ? »*

**Son intuition est juste à 63 %, mesuré sur les 114 tâches ouvertes** : 50 % sont déjà dans la
Grande Évolution, 38 % sont de l'hygiène qui disparaîtra en grande partie par construction si on
réécrit, 10 % relèvent de l'export, et **le Jeu pèse 3 tâches sur 114**.

**Mais la vraie réponse n'est pas un compte, et c'est la trouvaille** : *personne n'a jamais
défini ce que « terminée » veut dire.* La tâche **#1132** est sa propre commande — *« quand
pourra-t-on statuer que l'agence est terminée ? »* — ouverte depuis le 28 septembre, classée
PRIORITAIRE-OBLIGATOIRE, **jamais exécutée**. Il me demande donc de juger une distance par rapport
à un point qui n'existe pas. **Tant que la borne n'est pas posée, « est-ce fini ? » ne peut
recevoir qu'une impression.**

**Quatre choses manquent vraiment, et aucune n'est de l'hygiène** : la borne elle-même · le
Transaction Engine, seul trou d'architecture nommé (#1120) · la portabilité (38 fichiers à chemins
écrits en dur, aucun point de branchement) · **et la preuve extérieure — l'Agence n'a jamais été
installée ailleurs, pas une fois.**

Détail complet : `docs/grand-projet/02-strategie/ce-qui-reste-vraiment.md`, tâche **#1351**.

**Q14.6 — VÉRIFIÉ, et son hypothèse tient largement.** *(Ma question était mal posée : je ne lui
demandais pas d'arbitrer, seulement s'il fallait vérifier AVANT de chiffrer le reste. Il a dit
« avance de manière fiable » — c'est fait.)*

**93 fichiers, 12 531 lignes, et seulement 6 qui citent l'outillage.** 87 sur 93 se recopient sans
réflexion. Et « citer » n'est pas « dépendre » : six est un **plafond**, pas un coût.

**Ce que ça change pour le chiffrage** : le Jeu n'est pas le gros morceau. 12 531 lignes copiables
d'un côté ; de l'autre, un outillage dont **un seul fichier pèse 12 052 lignes** (#793). **Le
travail de refonte est presque entièrement du côté de l'Agence** — ce qui est cohérent avec sa
proposition, puisque c'est l'Agence qu'il veut rationaliser.
