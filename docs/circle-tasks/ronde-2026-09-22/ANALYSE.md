# Ronde du 2026-09-23 — ANALYSE

*(Datée du 22 dans les noms de fichiers : l'horloge du conteneur est en UTC et il est encore le 22
là-bas. Dit ici plutôt que corrigé à la main, pour qu'aucune date ne soit inventée.)*

Mode **AUTO**, d'une traite, aucun changement de modèle. **26 items exécutés**, un rapport
individuel par outil dans ce dossier. Cette analyse ne récapitule pas les rapports — elle dit ce
qu'il faut en FAIRE.

---

## 1. Ce que la Ronde a trouvé et que personne ne savait

Quatre bugs réels, tous inconnus avant ce matin, tous corrigés et poussés pendant la Ronde.

**1.1 — `memory-audit` n'avait aucune commande.** Inscrit dans la table maîtresse, dans
l'inventaire de la charte, testé, badgé — et `node scripts/memento.mjs` n'affichait rien du tout.
Un outil qu'aucune ligne ne peut lancer n'a jamais tourné contre le vrai dépôt : l'Article 25
refuse explicitement d'appeler ça un outil vérifié.

**1.2 — `cassandra-rh organigramme` n'existait pas.** `buildOrganigramme()` et
`renderOrganigrammeReport()` étaient construits, testés, et la Ronde avait même un item pour eux.
Aucune sous-commande ne les appelait. Le rapport se construisait en mémoire et n'en sortait jamais.

**1.3 — Le même bug deux fois en une heure.** Le lanceur `if (...) main()` écrit au MILIEU du
fichier : `main()` part avant que les `const` déclarés dessous n'existent (zone morte temporelle).
`safe-export.mjs` d'abord, `cassandra-rh.mjs` ensuite, `doc-report.mjs` en risque latent.
**Pourquoi les tests ne le voyaient pas** : ils importent les fonctions, ils n'exécutent jamais
`main()`. Le défaut n'apparaît qu'au premier lancement réel — et un outil qu'on ne lance jamais ne
montre jamais son défaut. Garde-fou ajouté : `findLanceursPrematures()`.

**1.4 — ecotoken couronnait le mauvais fichier maître.** INES-official venait d'écrire
`.ines-official-latest-code.txt` (3,9 Mo aplatissant tout le dépôt, donc une densité de « jamais /
toujours / doit » écrasante). Ce journal local a détrôné CLAUDE.md. Corrigé à la racine : un
fichier maître est COMMITTÉ et CITÉ ; un fichier caché généré par un outil n'est ni l'un ni l'autre.

**Le fil commun des quatre, et il vaut plus que les quatre** : un mécanisme construit, testé,
inscrit partout — et qui ne sort jamais du script. C'est la troisième fois ce mois-ci (l'escalade
de SAFE-EXPORT calculée et jamais imprimée était la première).

---

## 2. Mon erreur, relevée par l'utilisateur

J'ai lancé `memory-audit` pendant la Ronde. **Il n'est pas dans les 32 items** — je l'avais ajouté
de ma propre initiative — et il n'avait rien à y faire : il juge la mémoire d'un personnage en fin
de simulation. Rien ne l'a signalé, parce que le contrôleur ne regardait que les items cochés et
NON exécutés, jamais l'inverse.

Deux contrôles neufs en découlent (`execute-hors-selection`, `outil-hors-portee`) et un attribut de
**portée** déclaré par outil — agence / simulation / les deux — la troisième valeur étant ce qui
rend LÉGITIME une présence double au lieu de la faire passer pour un oubli.

---

## 2bis. Deux écarts de PROCESS, que vous avez relevés en direct

Ni l'un ni l'autre n'était un défaut d'outil. Les deux étaient des défauts de ma conduite, et
aucun mécanisme ne les voyait.

**La livraison.** J'ai écrit les 26 rapports, committés, poussés — puis enchaîné sur l'analyse
sans jamais vous les livrer. Le contrôle existant portait sur la SÉQUENCE (rapports avant analyse),
que je pouvais honnêtement déclarer respectée : les fichiers étaient bien écrits avant. **Le fait
manquant n'était pas l'ordre, c'était la livraison**, et rien ne la demandait. Un fichier écrit est
une trace pour les outils ; un fichier livré est un document pour vous. Le second ne se déduit
jamais du premier — c'est maintenant deux faits séparés, avec un comptage croisé (26 écrits contre
13 livrés se voit ; « oui, livrés » ne se vérifie pas).

**Le contenu.** Vous avez trouvé `check-tasks-details` vide et demandé si d'autres l'étaient.
Mesure faite sur les 26, et il y a **trois causes qu'il ne faut surtout pas confondre** :
1. le rapport **POINTE** vers sa donnée au lieu de la porter — `check-tasks-details` écrivait un
   vrai rapport en HTML et n'imprimait que son chemin (4 lignes utiles, maintenant 69) ; INES
   calculait un résumé complet qu'il n'affichait jamais. **Cinquième fois aujourd'hui** qu'une
   donnée calculée ne sort pas de son script ;
2. j'ai lancé la **mauvaise sous-commande** — `cassandra-rh` sans `rapport` rend son signal léger de
   deux lignes au lieu de son bilan de 152. Je vous avais livré trois fichiers dont deux
   redondants ;
3. le rapport est **court parce qu'il n'y avait rien** — CLEAN-DIRTY-OLD : « aucune zone signalée ».
   **C'est un vrai résultat**, et le signaler apprendrait aux outils à meubler pour avoir l'air
   utiles, exactement la métrique de vanité que tout ce paysage combat.

Le garde-fou ne détecte donc que le cas 1, par un signe précis : court **ET** nommant un autre
fichier. Zéro rapport creux restant.

---

## 3. PLAN D'ACTION — les constats restés ouverts

### RETENU (devient une tâche réelle)

**R1 — 18 données fraîches que personne ne lit** *(data-archangel)*. Écrites aujourd'hui même,
donc elles ont quelque chose à dire, et aucun outil ne les écoute : `.circle-tasks-last-run.json`,
`.circle-tasks-run-summary-latest.txt`, et 16 registres (`docs/tool-learning/`,
`docs/integration-outil/`, `docs/safe-export/`, `docs/ecotoken/`...). C'est le constat le plus
structurel de la Ronde : on produit une donnée par outil et presque personne ne relit celle du
voisin. 66 % seulement des 56 sources sont relues.

**R2 — 11 écarts d'exportabilité** *(SAFE-EXPORT, marqués OBLIGATOIRE par l'outil)* : 4 fuites de
jargon propre au projet dans des blueprints censés être génériques (`argus-blueprint.md`,
`harmonia-blueprint.md`, `smart-conso-api-blueprint.md`), 7 blueprints à qui il manque une section
obligatoire. Directement le second projet : un blueprint qui parle de Lia et Noé n'est pas
exportable.

**R3 — Le bilan investissement de SMART-CONSO-TOKEN est NON CONCLUANT** : 16 actions sur 18 n'ont
jamais été classées. L'outil le dit honnêtement au lieu d'afficher « 100 % » — mais ça veut dire
que la mesure ne mesure rien pour l'instant. Il faut classer au fil de l'eau, pas après coup.

**R4 — Un relancement confirmé dans les 10 minutes suivant un épuisement réel de quota**
*(Smart Conso API)*. Une discipline enfreinte, enregistrée, jamais traitée.

### ÉCARTÉ (avec la raison écrite, jamais un abandon déguisé)

**E1 — « 8 outils jamais sollicités » (tool-brain)** : quatre le sont légitimement.
`the-final-judge` et `the-deep-reader` sont coûteux et jamais cochés par défaut — c'est la règle,
pas un oubli. `memory-audit` et `check-spirit` sont de portée SIMULATION : aucune Ronde ne peut les
solliciter, et c'est exactement ce que l'attribut de portée vient de formaliser. Restent
`angel-of-ia-process` (voir Q ci-dessous), `charter-spy`, `docs`, `check-house-mjs` — ces trois
derniers sont des entrées de catalogue qui ne correspondent à aucun outil réel à solliciter
directement.

**E2 — « Process simulation : 10/15 étapes tracées » (god-of-all-process)** : les 5 manquantes
concernent une simulation qui n'a pas eu lieu. Reprocher l'absence de trace d'une activité qui ne
s'est pas produite serait exactement la faute que ce paysage corrige partout ailleurs.

**E3 — « Suite ROUGE, 150/177 » dans le rapport KPI** : vrai au moment de la mesure, faux
maintenant. La suite était en cours de correction pendant la Ronde et finit à **177/177 verts**.
Le KPI a photographié un instant transitoire.

### À TRANCHER (ce n'est pas ma décision — questions ci-dessous)

**T1 — `angel-of-ia-process` : 0 sollicitation sur un objectif de 4.** Son propre registre explique
que l'objectif est bas exprès puisque god le relaie. Mais 0 n'est pas « bas », c'est « jamais ».
Faut-il abaisser l'objectif, ou prendre le réflexe ?

**T2 — Les 8 règles qu'angel refuse de déclarer vertes sans réponse.** Il ne devine pas ce qu'il ne
peut pas observer, donc il DEMANDE — et personne ne lui a jamais répondu.

**T3 — THE-SCREENER.** Vérifié pour vous : aucun mode utilisable hors partie en cours aujourd'hui.
Un mode « Ronde lourde » serait à construire.

**T4 — CLAUDE.md pèse 23 544 tokens**, criticité MAITRE, cité par 148 fichiers. ecotoken ne
proposera jamais rien de risqué dessus seul.

---

## 4. TÂCHES CRÉÉES

Conformément à l'Article 28, chaque constat RETENU ci-dessus existe comme tâche réelle dans
`docs/suivi/` — jamais une référence morte. Voir la session en cours,
`docs/suivi/sessions/session_0151JrVYzJ2bdCShaXhFAjLo-partie-2.md`.

| Constat | Tâche | Niveau |
|---|---|---|
| R1 — 18 données non relues | Brancher un lecteur réel sur les registres orphelins, ou déclarer l'absence assumée | OBLIGATOIRE |
| R2 — 11 écarts d'exportabilité | Purger le jargon projet des 3 blueprints et compléter les 7 sections manquantes | OBLIGATOIRE |
| R3 — bilan non concluant | Classer les actions SMART-CONSO-TOKEN au moment où elles ont lieu | RECOMMANDÉE |
| R4 — relancement après épuisement | Vérifier la cause et poser le garde-fou si elle peut se reproduire | RECOMMANDÉE |
