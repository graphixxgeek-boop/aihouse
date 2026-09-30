# FIL 09 — Ce qui ralentit le projet

**Balle :** À MOI
**Dernier mouvement :** 2026-09-30
**Place dans le plan :** Transverse — il ne produit rien, il explique pourquoi le reste avance ou pas. Il alimente directement le fil 02 (cible d'obligations) et le fil 06 (versions).
**Saisines :** réponses 2026-09-29 · soirée du 2026-09-30

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
