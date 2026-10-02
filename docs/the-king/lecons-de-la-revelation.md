# THE-KING — ce que la première révélation lui a appris

*(Ouvert le 2026-10-02. **Mémoire SAUVEGARDÉE de l'outil, jamais une note de session** — sa
consigne : « les notes : jamais dans la mémoire de session, toujours dans la mémoire
sauvegardée ». Ce fichier part avec THE-KING quand l'Agence est installée ailleurs : c'est son
expérience accumulée, pas celle de ce projet-ci.)*

**POURQUOI CE FICHIER EXISTE, dans ses mots** : *« tu dois absolument penser à garder des notes
sur le sujet chez the king, et que the king ait bien gardé la trace de cette experience pour la
prochaine »*. Un outil garde son registre d'une session à l'autre ; l'agent ne garde rien. Ce qui
a été payé ici doit être lu par celui qui lancera la révélation sur un autre code.

---

## L1 — Une philosophie se lit mieux dans les DÉCISIONS que dans les RÈGLES

**Comment elle a été payée.** Sur un corpus restreint aux documents normatifs — charte, méthode,
référentiel — **trois** des cinq impossibles ressortaient vides. En ajoutant les process et les
décisions réellement prises (le suivi des tâches), **deux se sont remplies immédiatement** :
*ce que nous refusons absolument* et *ce que nous n'autoriserons jamais*.

**Ce que ça veut dire pour le prochain passage.** Un projet dit ce qu'il croit bien plus
franchement quand il tranche un cas que quand il rédige une règle. **Un corpus qui n'inclut pas
les décisions prises mesure la façade.** Sur un code d'accueil : chercher le journal de décisions,
les tickets fermés, les messages de commit argumentés — avant les documents officiels.

## L2 — La bonne maille n'est ni le fichier ni le mot : c'est la ZONE

**Comment elle a été payée.** Trois mécaniques, deux échecs.
① Compter comme « inavouée » toute conviction absente de la boussole : **2 762 sur 2 786, soit
99 %** — un détecteur qui accuse tout le monde n'accuse personne.
② Révéler par collocations : sans filtre, les paires de tête étaient des mots outils du français ;
avec un filtre de fréquence documentaire, c'étaient des **noms d'outils** — mécaniquement, puisque
la documentation tient un fichier par outil.
③ Compter les ZONES : une idée qui traverse la charte, une leçon payée ET le raisonnement écrit à
côté d'un outil a franchi trois contextes d'écriture indépendants, à des semaines d'intervalle.

**Ce que ça veut dire pour le prochain passage.** Compter des fichiers favorise la partie du dépôt
qui a le plus de fichiers. **Définir les zones AVANT de mesurer**, et faire en sorte qu'aucune ne
puisse peser plus qu'une. Sur ce projet-ci le suivi pèse plus de lignes que tout le reste réuni —
en zones, il ne vaut qu'un sur sept.

## L3 — Un seuil dérivé d'un centile ne peut pas passer au-dessus de son propre nuage

**Comment elle a été payée.** Le premier seuil de couverture valait 0,70 quand le 90ᵉ centile
observé valait 0,44 : il était **au-dessus de toute la distribution qu'il observe**, et annonçait
donc 99 % d'anomalies. Le même défaut, sous une autre forme, avait coûté une fausse alerte à un
autre outil de ce dépôt dix heures plus tôt.

**Ce que ça veut dire pour le prochain passage.** Un seuil se dérive d'un centile de la
distribution réelle, jamais d'une intuition — et un test doit **affirmer** qu'il reste à
l'intérieur, plutôt que le promettre en commentaire.

## L4 — Deux fonctions voisines peuvent légitimement utiliser deux mesures différentes

**Comment elle a été payée.** `dejaDansLaBoussole()` utilise un **taux de contenance**, pas un
indice de Jaccard — alors que tout le reste de l'outil fait du Jaccard. Raison : une phrase de
15 mots entièrement contenue dans un principe de 200 mots rend un Jaccard de 0,07, donc « non
couverte », alors qu'elle l'est intégralement.

**Ce que ça veut dire pour le prochain passage.** Résister à l'uniformisation. La raison est
écrite juste au-dessus de la fonction **pour que personne ne la « corrige » par souci
d'homogénéité**.

## L5 — Un verdict juste à une adresse fausse est un verdict faux

**Comment elle a été payée.** Le diagnostic d'un projet d'accueil répondait « TROUVÉ » pour les
trois textes fondateurs — en désignant trois fois le même document d'analyse, pendant que la vraie
boussole dormait à côté. Et la cause était une **troncature silencieuse** : un plafond de
400 fichiers sautait des sous-arbres entiers sans le dire.

**Ce que ça veut dire pour le prochain passage.** Le verdict (`TROUVÉ`/`ABSENT`) ne suffit jamais :
c'est **l'adresse** qui servira ensuite à générer ce qui manque. Et tout balayage plafonné doit
**déclarer qu'il a été tronqué**, faute de quoi un « ABSENT » peut n'être qu'un dossier jamais
visité.

## L6 — « Intention déclarée » et « substance » sont deux tests, et il faut les deux

**Comment elle a été payée.** Un fichier intitulé *« # Philosophie »* suivi de *« à écrire plus
tard »* répété passait pour une vraie philosophie, parce que son titre comptait comme preuve de
son propre contenu. À l'inverse, un README sans un mot sur le sujet passait pour une coquille.

**Ce que ça veut dire pour le prochain passage.** TROUVÉ exige une **intention** (le titre ou le
nom de fichier annonce le sujet) **ET** une **substance** mesurée dans le corps **hors du titre**.
L'un sans l'autre produit l'un des deux faux verdicts ci-dessus — les deux se sont présentés en
vrai.

---

## CE QUE LA PREMIÈRE RÉVÉLATION A RENDU, COMME POINT DE COMPARAISON

| Mesure | Valeur au 2026-10-01 |
|---|---|
| Fichiers lus | 334, sur 7 zones |
| Convictions extraites | 5 843 |
| Convictions retenues (au-dessus du seuil dérivé) | 87 |
| **Déjà couvertes par la boussole existante** | **1 sur 87** |
| Cases du cadre standard remplies | 18 / 19 |
| Contradictions détectées | 0 sur 2 775 paires comparées |

**C'EST CE CHIFFRE-LÀ QU'IL FAUDRA BATTRE, ET AUCUN AUTRE** : la part des convictions que la
boussole couvre. Le nombre de principes écrits ne prouve rien — on peut en écrire cent sans que le
projet s'y reconnaisse. Le verdict de comparaison est construit pour refuser cette confusion.
