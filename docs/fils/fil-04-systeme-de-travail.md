# FIL 04 — Notre système de travail : questions, réponses, fils

**Balle :** À MOI
**Dernier mouvement :** 2026-09-30
**Place dans le plan :** Transverse — ce fil ne produit rien du projet, il conditionne la vitesse de tous les autres.
**Saisines :** COMMANDE IMPORTANTE · QUESTIONS · réponses 2026-09-29 · réponses 2026-09-30 · demande orale du 30/09 au soir

---

## ① L'HISTOIRE — ce qui s'est déjà dit sur ce sujet, résumé

**Ce que tu as demandé, en plusieurs fois et de plus en plus fort :**

- des **questions numérotées**, pour pouvoir répondre par le numéro sans recopier la question ;
- des **fiches à cases** pour les questions — puis, le 30/09 : *« je parle aussi du format des
  RÉPONSES : puisque je dois aussi répondre à tes RÉPONSES »* ;
- un **fil de discussion** qui tienne debout ;
- des livrables **en pièce jointe**, jamais collés dans la conversation ;
- du **HTML** dès qu'il faut réagir à quelque chose ;
- et, le 30/09 au soir : **un fil par SUJET**, chacun en trois parties.

**Ce qui existait avant ce soir, et pourquoi ça ne marchait pas :**

Un **fil unique** (`docs/grand-projet/fil-de-discussion.md`), rangé par date. Il répondait à la
question « qu'est-ce qui s'est dit le 29 ? » et jamais à la question « où en est-on sur la
sécurité ? ». Comme tu ne penses pas par dates mais par sujets, il était inutilisable pour toi
alors qu'il était parfaitement à jour pour moi.

**La cause racine, et elle est plus grave que le format.** Hier soir j'ai vérifié *« ce FICHIER
a-t-il une synthèse ? »* au lieu de *« ce SUJET a-t-il été traité ? »*. Les deux questions se
ressemblent et n'ont pas la même réponse. C'est pour ça que je t'ai dit quatre fois une chose
fausse en me croyant à jour. **Ton découpage par sujet n'est donc pas une préférence de mise en
page : c'est la correction de ce défaut-là.**

---

## ② OÙ ÇA SE SITUE — et pourquoi ce sujet existe

**Ce fil ne fait avancer aucune partie du produit.** Il fait avancer tout le reste, parce que
chaque aller-retour perdu coûte une soirée — la soirée du 30/09 en est la démonstration payée.

**Ce que le nouveau système apporte, concrètement :**

| Avant | Maintenant |
|---|---|
| un fil par DATE | un fil par SUJET |
| « à jour » = une impression | « à jour » = 4 contrôles qui rendent OUI / NON / PAS MESURÉ |
| tes demandes vivaient dans la conversation | tes demandes sont déposées dans le projet, donc mesurables |
| je disais « c'est fait » | un outil dit qui a la balle, et depuis quand |

**Les 4 contrôles** que porte `scripts/fils-de-discussion.mjs` répondent chacun à une question
simple — *est-ce déposé ? est-ce rattaché à un sujet ? qui a la balle ? où ça se place ?* — et le
détail de chacun vit dans `docs/fils-de-discussion-blueprint.md`, pas ici : le répéter à trois
endroits, c'est garantir que deux d'entre eux deviendront faux.

**Ce qui compte pour toi, et c'est le seul point à retenir : l'outil refuse de conclure « OUI »
quand un contrôle n'est pas mesurable.** Il rend alors *PAS ENTIÈREMENT MESURÉ*. C'est une leçon
payée ailleurs dans ce projet — une absence de mesure ne vaut jamais un zéro, et un satisfecit
rendu sur zéro donnée est pire que pas de réponse du tout.

---

## ③ LA CHAÎNE VIVE — numérotée, pour que tu puisses répondre par le numéro

**Q4.1 — À TOI.** Le nom. J'ai appelé le document maître **« Le Cerveau des fils »**, d'après tes
mots. Tu choisis toujours les noms, et par familles. *(a) garde « Cerveau » · (b) propose-moi une
famille de 3 noms et je choisis · (c) j'ai déjà le nom, le voici*

**Q4.2 — À TOI.** Quand tu réponds par numéro (« Q3.1 = b »), veux-tu que je **referme le point
en silence**, ou que je te **confirme à chaque fois** ce que j'ai compris ?
*(a) silence, tu vas plus vite · (b) confirme, je préfère vérifier*

**Q4.3 — À MOI.** Les **originaux de nos échanges restent accessibles** — c'est ta consigne
explicite : *« le fil de conversation ne sert pas à archiver »*. Les fils renvoient donc aux
sources, ils ne les remplacent jamais. C'est fait pour les fils 01 à 11 ; ça doit le rester.

**Q4.4 — À MOI.** La soirée du 30/09 doit être **historisée comme une expérience à ne jamais
répéter**, pas comme un incident. Tu me l'as demandé explicitement.
