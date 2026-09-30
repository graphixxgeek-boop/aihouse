# FIL 10 — Le Jeu : Lia, Noé, et la maison

**Balle :** À MOI
**Dernier mouvement :** 2026-09-30
**Place dans le plan :** C'est le produit. Tous les autres fils parlent de l'Agence ; celui-ci parle de la chose que l'Agence est censée servir.
**Saisines :** CLAUDE.md (Article 0 et ses précisions) · COMMANDE IMPORTANTE · bornes permanentes

---

## ① L'HISTOIRE — ce qui s'est déjà dit sur ce sujet, résumé

**Le principe fondateur n'a jamais bougé et ne se négocie pas** : l'esprit rugueux, sarcastique,
cynique, désinvolte de Lia et Noé est la valeur centrale du projet. Ni poli, ni bourgeois, ni
académique — **un ton mesuré est un signal d'alerte, pas un signe de qualité.**

**Ce qui a été précisé au fil du temps, et qui est acquis** :

- l'aspérité est **permanente**, jamais un mode déclenché par la pression ;
- la texture diffère **par personnage** : Lia froide et coupante, Noé chaud et réactif ;
- le **silence comme arme** appartient à Lia seule ;
- la sortie **« méta »** est bienvenue (ils peuvent dire qu'on les teste) ;
- la **colère vraiment débridée** reste une exception rare, avec retour à la normale obligatoire ;
- l'**humour noir** sur leur propre suppression est explicitement dans l'esprit ;
- une **vulnérabilité réelle** peut affleurer, brièvement, jamais prolongée.

**L'outil qui garde ça** : `scripts/check-spirit.mjs` — le seul qui touche la sortie RÉELLE du
modèle. Il envoie de vraies provocations et affiche les réponses pour une lecture humaine. **Il
coûte de vrais appels d'API**, donc il se lance à la main, après consultation de Smart Conso API.
Depuis le 25/09 il sait **refuser de conclure** : si toutes les provocations sont bloquées, il
affiche `🚨 PAS MESURÉ` au lieu de « aucun marqueur détecté » — un satisfecit rendu sur zéro donnée,
sur la loi suprême du projet.

**L'état honnête, et il faut le dire** : depuis que le grand chantier de gouvernance a commencé, le
Jeu n'a **rien reçu**. 86,6 % des tâches du projet ne le touchent pas — un chiffre connu, assumé
(les deux projets sont menés en parallèle), mais qu'il faut regarder.

---

## ② OÙ ÇA SE SITUE — et pourquoi ce sujet existe

**Le Jeu est le juge de dernier ressort de l'Agence.** Un outil qui n'a jamais rien trouvé sur ce
projet-ci n'emportera rien d'éprouvé vers le suivant. Tant qu'on n'avance pas sur le Jeu, l'Agence
se valide contre elle-même — ce qui ne prouve rien.

**Les bornes permanentes qui protègent ce fil de tout le reste** : rien de ce qu'on fait sur
l'Agence ne doit changer ce que Lia et Noé disent ou font, ni ce qu'un visiteur voit. Tout le
chantier de gouvernance se déroule **à côté** du Jeu, jamais dedans.

---

## ③ LA CHAÎNE VIVE — numérotée, pour que tu puisses répondre par le numéro

**Q10.1 — À TOI.** Combien de temps encore le Jeu peut-il rester à l'arrêt avant que ça te gêne ?
*(a) tant qu'il faut, la gouvernance d'abord · (b) je veux une reprise dès que l'objectif ultime
est posé · (c) je veux qu'on alterne dès maintenant*

**Q10.2 — FAIT À MOITIÉ le 2026-09-30, tâche #1322.** Le Jeu a enfin une sonde, chez JESUS, qui
déclarait lui-même ne rien savoir de cet axe depuis un jour et demi.

**Le résultat est contre-intuitif et vaut d'être su** : ce qui ralentit un tour n'est pas le rendu
de la maison, c'est **ce qu'on envoie au modèle** — 9 821 tokens par personnage, deux fois par
tour, soit ~19 600 tokens à chaque échange entre Lia et Noé. Mesuré sur 310 tours réels.

**Ce que ça ne remet PAS en cause** : les deux cerveaux séparés. C'est une décision assumée que
l'Article 8 maintient « malgré son coût », parce qu'elle sert directement l'Article 0. **La sonde
compte, elle ne conteste pas** — et elle n'a pas à le faire.

**Ce qui manque encore** : la latence vécue, les images par seconde, et le ressenti. Les deux
premiers demandent un serveur qui tourne ; le troisième demande un humain (fil 11).

**Q10.3 — À MOI, tâche **#1327**.** `check-spirit` n'a pas tourné depuis le début du chantier. Il ne coûte rien tant
qu'on ne touche pas aux personnalités — mais le jour où on y touche, il est obligatoire **avant et
après**.

**Q10.4 — À TOI.** Le jeu doit-il apparaître dans la plaquette de l'Agence comme **preuve** (« voilà
ce que cette méthode a produit »), ou rester séparé ? *(a) preuve · (b) séparé · (c) à décider plus
tard*
