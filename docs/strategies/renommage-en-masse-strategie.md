# STRATÉGIE DE CHANTIER — RENOMMAGE EN MASSE

*(Créée le 2026-09-26 05:44Z, liée à la tâche **#775**.)*

> **CE DOCUMENT NE RÉSUME JAMAIS.** Il AGRÈGE et il ORDONNE. Chaque idée y entre
> intégralement, entre guillemets, avec sa source. Trouver sa place dans la stratégie est
> le travail ; la raccourcir serait la perdre. En cas de conflit majeur entre une idée
> nouvelle et la stratégie en place, on ne tranche pas : on pose une question de calibrage.

## 1. POURQUOI CE CHANTIER

*l'intention d'origine, dans SES mots — jamais reformulée en vocabulaire d'agent*



« je veux rendre des hommages »

— source : son idée d'origine, tâche #733


« quels sont TOUS les impacts, meme indirectes d'un changement de noms en serie ? l'impact technique ? d'autres impacts ? des impacts propres à l'agence ? prevois de booster serieusement cet outil. fais des recherches sur le web »

— source : sa demande, tâche #740


« fais des recherches sur le web [...] anticipe TOUTES les conséquences possibles, crée un outil vraiment PUISSANT [...] invente des tests dédiés, fiabilise au maximum. je ne veux pas avoir de mauvaises surprises »

— source : sa demande, tâche #768


« Avec la mise à jour de toutes les classifications + mises à jour tous les nivellements + mise à jour toutes les harmonisations vient mise à jour tous les noms. AInsi, on a une agence bien nommée de bout en bout, un vrai produit fini »

— source : son gros prompt du 2026-09-26

## 2. CE QUI EXISTE DÉJÀ

*mesuré sur le dépôt, jamais supposé — c'est ce qui évite de reconstruire ce qui est là*



« AGENT DES NOMS (scripts/agent-des-noms.mjs) existe et sa fonction principale est de minimiser le risque technique d'un renommage en masse. Il inventorie sur le vrai dépôt toutes les occurrences d'un nom et les trie en CINQ NATURES : import de code, commande écrite, chemin de registre, mention vivante, et trace historique — qui ne se touche jamais. Deux commandes : `renommage <ancien> <nouveau>` avant le geste, `verifier <ancien>` après. Il ne renomme rien, délibérément. »

— source : mesuré dans le dépôt le 2026-09-26


« renommer cassandra-rh touche 2 095 occurrences, dont NEUF imports de code (qu'un test cassé attrape en dix secondes) et 496 lignes de docs/suivi/, c'est-à-dire de l'HISTOIRE »

— source : mesure réelle, tâche #738


« un renommage DÉPLACE LE CODE VIVANT ET LAISSE L'HISTOIRE INTACTE, et ce qui relie les deux est un ALIAS, jamais une réécriture »

— source : la règle centrale, tombée de la mesure — tâche #738


« L'outil signale aussi les noms qui CONTIENNENT le nom visé (`memento` emporterait `memento-weight`), piège qu'un remplacement de texte aveugle ne voit jamais. »

— source : mesuré dans agent-des-noms.mjs

## 3. LES IDÉES RETENUES

*intégrales, citées, jamais résumées — chacune avec sa source*



« je veux rendre des hommages — séries « grands codeurs », « dystopique », « prophètes », « Matrix », « SQUID GAME » »

— source : tâche #733, ses cinq séries


« avant le nom il y a un code qui est inseré selon la nomenclature de l'outil, avec des lettres ou des chiffres qui represente les classes. quel serait la longueur de ce code ? avant ou apres le nom ou invisible dans le nom ? »

— source : tâche #747 — question NON tranchée


« RENOMMAGE DES NOMS : SECURISATION DE L'OPERATION : garder une table de conversion des anciens noms vers les nouveaux, respecter la période ou les 2 noms cohabitent »

— source : son ajout du 2026-09-26


« on commence par le renommage de la classification des fichiers appartenant à une famille de l'agence, ENSUITE on voit pour un renommage plus large (là ou ca merite d'etre renommé, pour une meilleure apprehension generale de l'agence et de son fonctionnement) »

— source : son gros prompt du 2026-09-26 — l'ORDRE du chantier


« cote : renommage general on va renommer ce qui est interessant, on ne va pas faire de betises avec les fichiers d'infrastructure par ex, on va travailler intelligement et on va pas tout renommer non plus »

— source : son gros prompt du 2026-09-26 — le PÉRIMÈTRE


« Et voir aussi pour un renommage en masse des datas, je ne sais pas si c'est risqué, ou si avec l'outil mis au point on peut se le permettre. »

— source : son gros prompt du 2026-09-26 — les DATA aussi

## 4. LES RECHERCHES ET TROUVAILLES

*ce qu'on est allé chercher dehors, et ce qu'on en a tiré*



« L'utilisateur a demandé des recherches web sur les risques techniques d'un renommage en masse (tâches #740 et #768). CE QUI EN A ÉTÉ TIRÉ ET IMPLÉMENTÉ dans AGENT DES NOMS : le tri en cinq natures d'occurrence, la protection de la trace historique, la détection des noms englobants, et le refus délibéré de renommer (planifier avant, vérifier après). CE QUI RESTE À VÉRIFIER : que chaque trouvaille de ces recherches est bien câblée dans l'outil — c'est l'étape F du pré-chantier, et sa consigne exacte : « assure toi que toutes recherches sont bien exploitées pour parfaire l'outil de renommage ». »

— source : recherches #740/#768, état au 2026-09-26

## 5. LES DÉCISIONS DÉJÀ PRISES

*ce qui ne se rediscute plus, avec la date et qui a tranché*



« TRANCHÉ : un renommage déplace le code vivant et laisse l'histoire intacte. Les 496 lignes de docs/suivi/ ne se touchent jamais. »

— source : tâche #738, 2026-09-24


« TRANCHÉ : AGENT DES NOMS ne renomme rien lui-même. Il planifie avant, il vérifie après. Deux mille occurrences changées par un outil agissant seul est exactement l'action difficile à annuler que ce projet refuse sans validation. »

— source : tâche #738, 2026-09-24


« TRANCHÉ le 2026-09-26 : la dernière étape AVANT le renommage est de s'assurer que l'outil est prêt à 100 %. Rien ne se renomme tant que ce n'est pas vérifié. »

— source : son gros prompt du 2026-09-26


« TRANCHÉ en fenêtre dédiée le 2026-09-26 : cette nuit, rendre l'outil prêt à 100 % SANS RIEN RENOMMER. Borne n°1 des interdits de la nuit. »

— source : sa réponse en fenêtre de calibrage, 2026-09-26

## 6. CE QUI RESTE À TRANCHER

*les arbitrages qui lui reviennent — jamais tranchés par l'agent*



« LES NOMS EUX-MÊMES. Il nomme, jamais l'agent. Restent à choisir : les 4 rangs provisoires (Postulant, Sans fiche, Sans porte, Émetteur de rapport), LE-CLASSIFICATEUR, « commande-documentee » / « commande-sans-fiche », et l'affectation des cinq séries d'hommages aux familles. C'est la fournée #200. »

— source : règle permanente + tâche #200


« LA LONGUEUR ET LA PLACE DU CODE DE NOMENCLATURE (tâche #747). Avertissement de l'Article 30 : cette question a déjà reçu une réponse FAUSSE le 2026-09-24 — « trois caractères », calculée sur cinq axes alors que le dépôt en portait treize. Et la même question avait été posée trois jours plus tôt sous une autre forme, un code de NIVEAU DE MATURITÉ 0/1/2/3, idée depuis effacée du dépôt. À ne pas retrancher sans avoir repris ces notes. »

— source : tâche #747 + Article 30


« LES DEUX COLLISIONS RÉELLES : `PALIERS` et `recordOutcome`, deux noms définis deux fois ET importés ailleurs. Tâche #775. »

— source : tâche #775, mesure de #756


« LES DATA : renommer aussi les rapports et registres, ou seulement les outils ? Il pose la question sans la trancher. Elle dépend de la classification des DATA, qui n'est pas faite. »

— source : son gros prompt du 2026-09-26

## 7. LE PLAN D'EXÉCUTION

*ne se remplit qu'À LA FIN, juste avant la construction effective*

*(vide — rien n'a encore été versé ici)*
