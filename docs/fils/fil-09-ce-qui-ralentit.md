# FIL 09 — Ce qui ralentit le projet

**Balle :** À TOI
**Dernier mouvement :** 2026-10-02
**Place dans le plan :** Transverse — il ne produit rien, il explique pourquoi le reste avance ou pas. Il alimente directement le fil 02 (cible d'obligations) et le fil 06 (versions).
**Saisines :** réponses 2026-09-29 · soirée du 2026-09-30 · Ronde GOAT du 2026-10-01 · gros prompt du 2026-10-02 (les packs)

---

## ① L'HISTOIRE — ce qui s'est déjà dit sur ce sujet, résumé

**Ta demande, mot pour mot** : *« je veux une analyse complète du sujet : qu'est-ce qui ralentit le
codage ET/OU l'IA ET/OU le jeu ET/OU l'agence […] POURQUOI : pour définir correctement si on va
VRAIMENT proposer plusieurs versions ».*

**Ce qui existe** : `docs/grand-projet/02-strategie/ce-qui-ralentit-le-projet.md`, appuyé sur
l'outil **JESUS-LE-SAUVEUR** (passage réel du 2026-09-29 à 23h06 UTC, 350 lignes rendues).

**La limite, dite en premier plutôt qu'en note** : tu as nommé **quatre** axes, l'outil en couvre
**trois** — le codage, moi, et l'Agence. Il ne sait **rien dire du JEU** : ni de sa lenteur de
rendu, ni de son temps de réponse, ni de ce qu'un visiteur ressentirait.

**Et la soirée du 30/09 vient d'ajouter une cause que l'outil ne voit pas non plus.** Elle n'est ni
technique ni organisationnelle : **c'est moi qui ai répondu vite au lieu de répondre juste**, quatre
fois de suite, sur des faits vérifiables. Ton mot : *« 2h que nous brassons du vent »*. Cette cause
doit être comptée avec les autres, pas rangée à part comme un incident.

---

## ② OÙ ÇA SE SITUE — et pourquoi ce sujet existe

**Transverse, et c'est le fil qui sert de juge aux autres.** Chaque fois qu'on hésite entre deux
chemins (fil 02 : combien d'obligations ? fil 06 : une version ou deux ?), la réponse se lit ici :
lequel des deux ralentit le moins.

---

## ③ LA CHAÎNE VIVE — numérotée, pour que tu puisses répondre par le numéro

**Q9.5 — LE PLUS GROS GASPILLAGE DU PAYSAGE, MESURÉ ET À MOITIÉ RÉPARÉ** *(2026-10-01, Ronde GOAT, tâche #1355 — À MOI, FAITE)*.
JESUS a trouvé cette nuit quelque chose qui appartient pleinement à ce fil, parce que c'est du
travail payé qui ne rapportait rien : **341 problèmes signalés dormaient dans les rapports du dépôt,
et rien ne pouvait dire combien avaient fini en vrai travail.**

**Pourquoi c'est un ralentisseur et pas un détail d'intendance** : tout ce paysage d'outils existe
pour trouver des problèmes. Si un problème trouvé ne devient pas une tâche, le temps passé à le
trouver est perdu **deux fois** — une fois en le cherchant, une fois en le retrouvant plus tard.

**La cause exacte, et elle est bête** : un plan d'action écrivait sa tâche en toutes lettres
(« tâche : relancer avec les trois durées ») sans jamais citer **son numéro**. On pouvait vérifier
le lien à la seconde où on l'écrivait, plus jamais après.

**Ce qui est construit** : un emplacement fixe pour le numéro, dans le gabarit que 49 outils
partagent. Optionnel — aucun outil ne change de sortie aujourd'hui — mais relisible, donc le lien
existe enfin dans les deux sens.

**Ce que ça ne répare PAS, et je préfère le dire** : les rapports déjà écrits n'ont pas de numéro et
n'en auront jamais. Le chiffre restera « pas calculable » jusqu'à ce que les outils s'en servent, et
il montera tout seul ensuite. **Rien à décider de ton côté.**

**Q9.1 — LE TROU EST COMBLÉ À MOITIÉ, le 2026-09-30, tâche #1322.** C'était le plus ancien du
fil et il était entièrement de mon côté. **JESUS couvre maintenant les quatre axes que tu avais
nommés**, pas trois.

**Ce que la sonde mesure, sur des données réelles** : 310 tours joués, **9 821 tokens en moyenne
par personnage**, deux cerveaux par tour, soit **~19 600 tokens par tour de jeu**. Au-dessus du
repère de 8 000, **c'est le premier poste de lenteur d'un tour — avant le rendu 3D**, ce qui n'est
pas l'intuition qu'on en a.

**Et le trou était plus large que JESUS** : le KPI qui s'appelle « performance » dans le tableau
de bord ne mesure que la résilience des clés d'API. **Rien, nulle part, ne disait ce qui rend un
tour de jeu lent** — sur le produit.

**Ce qui reste hors de portée, nommé plutôt qu'omis** : la latence réelle et les images par
seconde (il faut un serveur qui tourne), le poids envoyé au navigateur (il faut une compilation),
et **ce que ressent un visiteur — il faut un humain, et aucun mécanisme ne le remplacera.** Une
sonde qui tairait ces quatre-là ferait passer un tiers du sujet pour le sujet entier.

**Q9.2 — À MOI, tâche **#1305** — DÉJÀ FAITE.** Historiser la soirée du 30/09 **comme une expérience à ne jamais répéter**, avec
sa cause racine écrite (j'ai vérifié *« ce fichier a-t-il une synthèse ? »* au lieu de *« ce sujet
a-t-il été traité ? »*) et le mécanisme qui la rend impossible à refaire. Tu me l'as demandé
explicitement.

**Q9.3 — À TOI.** Parmi les ralentisseurs mesurés, lequel te coûte le plus **à toi** ? Ce n'est pas
forcément celui qui coûte le plus à la machine. *(a) le nombre de choses à valider · (b) le temps
d'attente entre deux livraisons · (c) devoir répéter des consignes · (d) ne pas savoir où on en est*

**Q9.4 — À TOI.** *« Je ne veux pas avoir à valider des choses sans importance »* : où mets-tu la
barre ? *(a) préviens-moi seulement de ce qui est difficile à annuler · (b) préviens-moi de tout ce
qui touche la charte · (c) préviens-moi une fois par session, en bloc*

---

## 2 OCTOBRE — LA RATIONALISATION PAR « PACKS », ET CE QUI N'EST PAS RATIONALISABLE

**Ton idée :**

> « pour la rationnalisation des documents, on pourra surement fonctionner par regroupement des
> docs en "PACK" pour nous aider à comprendre le but de certains packs et peut etre elminier les
> docs qui en sortent. »

**Elle vaut plus que ce que ta formulation en dit, et voici pourquoi.** Le dépôt porte 126
fichiers dans le seul référentiel. La question « ce document est-il encore utile ? » **n'est pas
un critère** — tout document paraît utile pris isolément, c'est pour ça que rien n'est jamais
élagué. « Ce document entre-t-il dans un pack ? » **EN EST un** : un document qui n'appartient à
aucun regroupement cohérent a probablement perdu sa raison d'être, et ça se constate au lieu de se
discuter.

### Une correction que je te dois

**J'ai écrit dans un rapport que « la liste de ce qui n'est pas rationalisable existe en partie ».
C'est FAUX.** Vérifié mécaniquement : le mot n'apparaît dans **aucun** document de ce dépôt. La
liste n'existe pas du tout. Tu avais raison de me dire « tu ne me la montres pas » — il n'y avait
rien à montrer.

### Ta stratégie de « copier-coller », et ce que j'en pense

> « je voyais une premiere rationnalisation, poussée jusqu'à la limite, et voir ensuite comment on
> peut tricher sur les elements qui ralentissent le codage et qu'on doit exporter aussi. »

**L'ordre que tu proposes est le bon**, et pour une raison que tu n'énonces pas : rationaliser
d'abord puis « tricher » ensuite garantit que la triche porte sur un périmètre **connu et
minimal**. Tricher d'abord fige la dette dans le produit exporté.

**Ce que je ne peux pas te dire aujourd'hui** : ce qui est réellement possible. Ça demande de
savoir ce qui résiste à la rationalisation, donc la liste qui n'existe pas encore.

**Q9.5 — À MOI, tâche #1485.** Produire la liste de ce qui n'est PAS rationalisable, avec le filet
comme premier cas, et te répondre point par point sur tes idées de copier-coller.

**Q9.6 — À MOI, tâche #1477.** Le regroupement par packs, inscrit au chantier rationalisation.

**Q9.7 — À TOI.** La rationalisation « poussée jusqu'à la limite » : jusqu'où ?
*(a) jusqu'à ce que plus rien ne puisse fusionner sans perdre une fonctionnalité · (b) jusqu'à un
nombre cible de fichiers qu'on fixe maintenant · (c) module par module, en s'arrêtant quand chacun
est propre, sans cible globale*
