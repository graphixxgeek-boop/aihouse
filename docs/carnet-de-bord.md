# Carnet de bord — l'état vivant du travail en cours

> **⚠️ NOM PROVISOIRE** (« carnet-de-bord », choisi par l'agent le 2026-09-24). L'utilisateur
> tranche les noms des outils, process et rapports — règle validée le 2026-09-24. Ce nom attend
> sa décision et ne doit pas s'installer par oubli.

**Pourquoi ce fichier existe.** La mémoire de l'agent a une taille limitée. Quand elle est pleine,
le système résume automatiquement la conversation et jette le détail — c'est arrivé le 2026-09-24
en pleine session. Le résumé est fabriqué par l'outil Claude Code, **pas par l'outillage du
projet** : s'il laisse tomber une demande, rien ici ne s'en apercevrait. Ce carnet est la seule
chose qui survive à ce moment-là sans dépendre d'un outillage particulier (Article 27).

**Il se tient au fil de l'eau**, jamais en fin de séance : un carnet mis à jour après coup n'aurait
rien à raconter le jour où il servirait.

---

## 1. Décisions prises et pas encore appliquées

*(Une décision disparaît d'ici quand elle est CÂBLÉE dans le code ou écrite dans un document de
référence — jamais parce qu'elle a été « notée ».)*

### Sauvegarde du projet — validé le 2026-09-24

| Point | Décision |
|---|---|
| Objectif réel | « si demain il y a un gros bug, ou que je n'ai plus accès à toi ou à git, je veux une copie qui me permette de continuer comme si rien ne s'était passé » |
| Livrables | **2 fichiers** : un `.zip` du dépôt entier (~6 Mo) + un « livre » texte calibré pour tenir dans la mémoire d'une IA |
| Historisation | **Rien à ajouter** : le suivi, les simulations et les registres sont des fichiers du dépôt, donc déjà dans le zip. Écraser ne perd rien. |
| Combien gardés | **Les 3 derniers de chaque** → 6 fichiers, ~20 Mo |
| Déclencheur | À chaque Ronde **et** après chaque gros chantier |
| Livraison | Dans la conversation, **avec un registre des dates** |
| Autorité du process | **Signale fort, ne bloque jamais** |
| Porteur | INES-official (c'est son métier : aplatir et éditer le dépôt) |

### Process de nommage — validé le 2026-09-24

| Point | Décision |
|---|---|
| Portée | **Les outils, les process et les rapports.** Pas les fonctions ni les fichiers techniques. |
| Moment | L'agent **construit sous un nom provisoire**, marqué comme tel, et présente des propositions après |
| Garde-fou | Un contrôle qui refuse tout nom provisoire oublié, **plus un registre de qui a nommé quoi** (le nom retenu, la date, les autres propositions) |
| Le passé | L'agent sort la liste des noms qu'il a choisis seul et l'utilisateur valide ou renomme — **mais pas avant** qu'un outil existe et que le classement soit fait |

### Iceberg visible / invisible — validé le 2026-09-24

| Point | Décision |
|---|---|
| Nombre de groupes | **3** : LES MEMBRES (nom + fiche) · LES OUBLIÉS (nom et fonction réels, rien ne les présente — groupe temporaire, doit se vider) · LA PLOMBERIE |
| Critère de frontière | **« Est-ce que je peux le convoquer ? »** — un script qui a un point d'entrée propre est visible ; un script seulement appelé par un autre est invisible. Vérifiable mécaniquement. |
| La plomberie | **Organisée a minima** : une ligne par pièce (ce qu'elle fait, qui l'utilise). Pas de fiche complète. |
| « Process primitif » | **Il décide puis il déclenche** : étape 1, cette chose mérite-t-elle d'être visible ? étape 2, si oui elle part dans le process d'intégration qui existe déjà. C'est un portier, pas un doublon. |
| Terrain mesuré le 2026-09-24 | 75 scripts · 41 nommés dans la charte · **30 jamais mentionnés**, dont ~17 de vraie plomberie et **~13 de vrais outils invisibles** (`the-deep-reader`, `pure-gold-unity`, `find-brain`, `memento-weight`, `tool-usage`, `route-booster`, `ou-on-en-est`, `the-ghost`, `messages-courts`…) |

### Catalogue et combinaisons d'outils — validé le 2026-09-24

| Point | Décision |
|---|---|
| D'où viennent les combinaisons | **Les trois sources à la fois** : (1) les exigences que personne ne vérifie → quels outils y répondraient ensemble ; (2) ce qui se produit déjà spontanément (outils lancés dans la même fenêtre) ; (3) ce qui s'emboîte (A produit ce que B sait lire) |
| Pourquoi pas un calcul sur toutes les paires | 75 outils = 2 775 paires et 67 525 trios : un classement sur ce volume aurait l'air intelligent et serait du bruit, sans moyen de faire la différence |
| Le blocage historique, identifié | L'utilisateur partait des OUTILS ; une combinaison utile se déduit d'une **question sans réponse**, jamais d'un stock disponible |
| La liste des packs | **Dérivée du réel** : chaque outil déclare son offre, le catalogue la lit — **et un contrôle signale tout outil qui n'a rien déclaré** au lieu de le laisser disparaître |
| Fraîcheur | Regénéré **à chaque Ronde et à chaque nouvel outil** |
| Une combinaison trouvée | **Entre directement au catalogue** sous un nom provisoire ; l'utilisateur renomme ensuite (cohérent avec le process de nommage ci-dessus, et couvert par son garde-fou) |

### Commande-en-masse — nom et déclenchement, validés le 2026-09-24 (tard)

| Point | Décision |
|---|---|
| Le NOM | **`commande-en-masse`**, choisi parmi les trois qu'il proposait. « gros prompt » était familier ; *massive-prompt* et *big-prompt* sont du franglais et « big » est aussi familier que « gros ». *Commande* porte le bon sens : quelque chose qu'on passe, qui engage, et qu'on honore. |
| Seuil de déclenchement | **5 demandes distinctes OU 3 000 caractères** — réservé aux vraies grosses saisines, peu de bruit |
| Ce qui se déclenche | Une **fenêtre qui PROPOSE** le rapport (jamais imposé) — **et la saisine est archivée dans tous les cas**, même si le rapport est refusé |
| Pourquoi l'archivage compte plus que le seuil | Son texte du 2026-09-23 n'existe plus nulle part : le dépôt gardait mes réponses, jamais sa formulation. La limite d'une grosse saisine n'est pas ma compréhension, c'est ma **persistance**. |

### La Ronde du 2026-09-24 — faute reconnue, traitement validé

Son reproche : « tu n'as pas du tout respecté le process de la ronde. c'est grave mon cher ».
**Traitement tranché : les deux.** Rattrapage enregistré le soir même (9 traces datées, chacune
marquée RATTRAPAGE et jamais comme un passage normal), puis une vraie Ronde selon son process
dans la nuit — ce qui montre au passage la différence entre les deux.

---

## 2. Demandes de l'utilisateur pas encore livrées

*(Tenue à jour à chaque demande et à chaque livraison. Une ligne ne disparaît que livrée.)*

| # | Demande | État |
|---|---|---|
| 1 | Process GROS PROMPT (calibré, pas construit) | à construire |
| 2 | 30 questions sur le document de gouvernance | à poser |
| 3 | OPTIMISER / FIABILISER insufflés dans la logique des process | à câbler |
| 4 | Astuce fichier txt / tokens → à appliquer chez ecotoken et Smart Conso | à faire |
| 5 | Scinder l'outil des tâches en deux | à faire |
| 6 | Fiche de tâche — en donner un exemple | à faire |
| 7 | CONVOCATION chez CASSANDRA — détailler le fonctionnement | à faire |
| 8 | Document dynamique où TOUT le fonctionnement de l'Agence est consigné | à faire |
| 9 | Vérifier que tous les docs qui méritent d'être en AUTO MÉMOIRE le sont | à faire |
| 10 | G2 — vérifier qu'aucune valeur du cahier des charges d'AGENT-DU-TEMPS n'a été perdue | à faire |
| 11 | Tableau des numéros de version des outils, en fichier texte | à faire |
| 12 | Qui surveille qu'un outil évolue et ne reste pas en v1 | à faire |
| 13 | Point : « est-ce que j'ai réussi à me faire connaître ? » (historisation du profil) | à faire |
| 14 | Rapport de gros prompt sur le prompt du 2026-09-24 | après les questions |
| 15 | Ronde rapide avec édition des documents de sauvegarde | après le rapport |
| 16 | Trier les 35 constats sans suite (#699) | ouverte |

---

## 3. Contraintes permanentes à ne jamais perdre

- **Ne jamais s'arrêter** : une tâche qu'on ne peut pas finir se met de côté, elle ne stoppe pas le travail.
- **Pas d'action sensible sans validation** : ce que disent ou font Lia et Noé, ce que voit le visiteur, tout ce qui est difficile à défaire.
- **La seule limite absolue : la refonte graphique** (inclut #237 et #92).
- **OPTIMISER et FIABILISER** sont le régime par défaut, plus une consigne à répéter. *Fiabiliser* = est-ce que ça marche, est-ce que tous les tests passent. *Optimiser* = peut-on améliorer la solution, est-elle complète.
- **Les questions passent par la fenêtre dédiée**, jamais dans le corps de la conversation.
- **Les transcriptions se livrent en fichier joint**, jamais collées en clair.
- **L'utilisateur choisit tous les noms** d'outils, de process et de rapports.
