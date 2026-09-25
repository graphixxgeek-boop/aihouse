# Ronde CIRCLE-TASKS du 2026-09-25 — mode autonome

*(Ouverte sans fenêtre AUTO/PRIME/GOAT : personne à qui la poser. L'exemption est **codée**, pas
improvisée — `autoriseCloture({ nightAutonomousMode: true })` l'autorise explicitement, et la règle
qui la fonde est la sienne : « aucune fenêtre y compris GOAT/AUTO ne doit être bloquante pour le mode
autonome ».)*

> **Pourquoi cette Ronde a eu lieu maintenant** : le rappel post-commit annonçait **76 commits sans
> Ronde**. Ce n'était plus un retard, c'était un constat — une trentaine de vérifications gratuites
> dormaient, et personne ne savait ce qu'elles auraient trouvé.

## Une erreur de ma part, corrigée en route et gardée ici

J'ai d'abord cru que la chaîne était **cassée** : `ouvrir` refuse `--autonome`, donc j'en ai conclu
qu'une Ronde était impossible sans l'utilisateur, et que c'était la cause des 76 commits. **C'était
faux.** `autoriseCloture()` dispense entièrement de l'ouverture en mode autonome : la Ronde était
joignable depuis le début. Je l'écris plutôt que de l'effacer, parce que c'est exactement l'erreur
que l'Article 19 décrit — conclure à un défaut avant d'avoir lu la fonction qui décide.

## Ce que les items gratuits ont trouvé

| Item | Résultat |
|---|---|
| THE-EQUALIZER — tout est-il à niveau ? | **27/29 exigences vérifiées mécaniquement.** L'Agence 15/15 ✅ · les documents 7/7 ✅ · **le code 5/7 ⚠️** |
| Les deux exigences non tenues | **X6** « le POURQUOI vit à côté du QUOI » et **X7** « le code applique les leçons déjà apprises » — toutes deux *vérifiées en partie* |
| check-profil-utilisateur | ✅ 11 fiches, toutes référencées, aucun lien mort |
| data-archangel | **39 sources de données sur 64 réellement relues par un autre outil — 61 %.** 25 écrivent pour personne |
| AGENT DES NOMS | 0 nom provisoire oublié · **2 marques sans date lisible** (check-house.mjs, regles-de-travail.md) — l'ancienneté n'est donc pas mesurable, et **aucune alerte n'est inventée** |
| Le registre des baptêmes | **N'existe pas encore** : les 78 noms en service comptent tous comme non validés. Ce n'est pas un artefact, c'est le vrai état |
| tool-brain (usage réel) | 0 outil « jamais sollicité » depuis la correction du compteur ce matin (#763) |
| Numérotation du suivi | ✅ aucune incohérence (corrigée ce matin, #779) |

## Analyse — ce que ces chiffres disent ensemble

**Le seul domaine qui n'est pas à niveau est le CODE, et les deux exigences qui manquent sont les
deux mêmes qui parlent de MÉMOIRE** : le pourquoi à côté du quoi (X6), et les leçons réellement
appliquées (X7). Ce n'est pas une coïncidence avec le reste de la matinée — c'est le même sujet que
les treize Articles muets (#789) et que le journal XP : **ce projet sait produire des protections,
il sait moins bien garantir qu'on se souvienne pourquoi elles existent.**

**Les 61 % de données relues** sont le chiffre le plus inconfortable : **un quart des sources écrit
pour personne**. C'est le même défaut, vu de l'autre bout — non pas une mémoire perdue, mais une
mémoire que personne ne vient chercher.

## Plan d'action (Article 28)

| Constat | État | Tâche |
|---|---|---|
| 76 commits sans Ronde, une trentaine de vérifications dormantes | **RETENU — FAIT** | cette Ronde ; compteur remis à zéro par `record-run --autonome` |
| X6 et X7 seulement *vérifiées en partie* — les deux exigences de mémoire | **RETENU** | #794 |
| 25 sources de données sur 64 ne sont relues par personne | **RETENU** | #795 |
| Le registre des baptêmes n'existe pas : 78 noms non validés | **À TRANCHER** | c'est un nommage, donc sa décision — rattaché à la série « dentelle » (#775) |
| 2 marques de nom sans date lisible | **ÉCARTÉ** | l'outil refuse d'inventer une ancienneté, et c'est le bon comportement : deux marques non datées ne justifient pas de fabriquer une alerte |
