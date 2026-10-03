=== La nuit du 2 au 3 octobre, en une page ===
Quatre de tes arbitrages construits · ta file de décisions remise d'aplomb dans les deux sens
Date : 2026-10-03

Quatre de tes arbitrages du 2 octobre sont construits. Deux décisions que tu avais déjà prises t'étaient réclamées à tort — corrigé. Cinq autres t'étaient dues sans que rien ne le dise — corrigé aussi, et ta file s'est donc ALLONGÉE : 66 → 68. C'est le bon résultat, parce qu'elle est maintenant vraie dans les deux sens.

**Dix commits, dix-huit tâches**, de #1506 à #1517. Filet de sécurité vert (409 tests) à chaque étape. **Rien ne touche le jeu** : aucune ligne de ce que Lia et Noé disent ou font, rien que le visiteur voit.

Tes arbitrages, construits

  Ton arbitrage du 2 octobre                                      État         Ce qu'il a donné                                                                                          
  --------------------------------------------------------------  -----------  ----------------------------------------------------------------------------------------------------------
  **#1464** — « la chaîne apprend à lire une table de registre »  ✅ construit  416 lignes de constat dans 99 registres, invisibles jusqu'ici. Le cas d'école que tu citais ressort enfin.
  **#1465** — « étendre le banc témoin aux sous-commandes »       ✅ construit  169 lancements au lieu de 84. Cinq trouvailles, toutes des sous-commandes.                                
  **#1460** — « mesurer le chevauchement autrement »              ✅ construit  L'axe SORTIE complète l'axe ENTRÉE. Cinq paires d'outils qui écrivent au même endroit.                    
  **#1468** — « les faire relire ensemble »                       ⚠️ recadré   Ta précaution avait raison : les coupables ont changé, et la relecture partagée existe déjà.              

#1464 — pourquoi ce trou n'était la faute de personne

C'était une **collision entre deux de tes propres règles**. La charte impose à chaque outil un registre avec son index ; ces index écrivent leurs constats dans un tableau. L'Article 28, lui, ne savait reconnaître qu'une section intitulée « Plan d'action ». La mémoire durable de chaque outil partait donc, **par construction**, dans le seul format que la chaîne ne lisait pas.

**La preuve que ça sert** : le constat de `x-port-blindtest` que tu citais comme cas d'école — illisible, donc re-trouvé à l'identique six jours plus tard — ressort maintenant dans la liste.

#1465 — un rapport planté ressemble à un rapport réussi

Les crochets git terminent chaque ligne par `|| true`. Conséquence : **le code de sortie d'un outil n'est lu nulle part**, sauf par le banc témoin — qui ne lançait que la commande nue. C'est ce qui a laissé un rapport cassé pendant 39 heures sans que rien ne le voie.

Cinq trouvailles au premier passage, et **aucune n'était le plantage qu'elle paraissait être** : deux outils impriment « je n'ai rien pu mesurer » puis sortent en erreur · deux refusent en nommant l'argument manquant · et un refuse de tourner sur un dépôt sale parce qu'il modifie de vrais fichiers avant de les restaurer — le refus le plus sain du dépôt, compté comme un échec.

Ta file de décisions est maintenant vraie dans les deux sens

  Moment de la nuit          Décisions dues  Pourquoi                                                         
  -------------------------  --------------  -----------------------------------------------------------------
  au départ                  66              —                                                                
  après #1507                64              **deux que tu avais déjà tranchées le 28/09** t'étaient réclamées
  après la clôture de #1497  63              instruite et close : aucune fusion d'outils n'est proposée       
  après #1517                **68**          **cinq qui t'étaient dues sans que rien ne le déclare**          

**Le solde est positif, et c'est volontaire.** Une liste qui te réclame ce que tu as donné t'use ; une liste qui te cache ce que tu dois te trompe. Les deux défauts étaient le même, vus par les deux bouts : la décision vivait dans la **description** de la tâche, pas dans sa colonne statut, et l'outil ne lisait que la colonne.

La plus frappante des cinq est **#1480** — la formule « ronde auto » que tu avais demandée. Le travail est fini depuis la veille. Elle n'attend plus que ton mot sur trois bornes : deux Rondes auto maximum par nuit · zéro appel API par défaut · questions reportées en un bloc le matin.

Trois erreurs à moi, et comment chacune a été trouvée

Aucune n'a été trouvée en relisant. Toutes en lançant un outil et en lisant sa sortie.

  · **Un détecteur écrit à 1 h se trompait sur la moitié de ce qu'il disait.** Il annonçait « 12 raisons sur 34 » ; en lisant à la main les huit premiers qu'il classait « sans raison », les huit en portaient une. Cause : les en-têtes du dépôt sont coupés à 95 caractères, donc toute expression de plusieurs mots coupée en deux était invisible.
  · **`\b` ne fonctionne jamais devant une lettre accentuée en JavaScript.** Quatre motifs commençant par « à » — dont « à trancher », le mot le plus fréquent du corpus visé — ne pouvaient pas matcher. Une mesure fausse **par le bas**, donc rassurante : c'est le pire type d'erreur.
  · **Un détecteur proposait de fusionner `check-spirit`** — le porteur de l'Article 0 — parce que je n'avais implémenté qu'un des trois critères de sélection. Une absurdité pareille fait abandonner un outil entier.

Une chose que je ne peux pas te dire

Le filet de sécurité est passé de 43,7 s à 202,8 s entre le 2 et le 3 octobre, pour 1,7 fois plus de tests. **Je ne peux pas attribuer cet écart** : contrôles neufs réellement lourds, machine différente ou plus chargée, ou les deux. Les deux mesures n'ont pas été prises dans le même conteneur. Dire « le filet a quadruplé » serait une attribution, pas une mesure.

Même honnêteté sur le banc témoin : son taux est passé de 97 % à 100 % en trois passages ce soir **sans qu'une seule ligne d'outil ne change**. Ce qui a changé, c'est le classeur. Deux lancements restent en orange, nommés et non absous.

---
check-tasks-details · safe-export · god-of-all-process · le-coordinateur — chiffres lus sur le dépôt réel, jamais estimés.
