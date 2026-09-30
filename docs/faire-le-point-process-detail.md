# Process « FAIRE LE POINT » — revenir à niveau avec des informations exactes à 100 %

*(Écrit le 2026-09-30 à sa demande explicite : « cette démarche de faire le point profondément et
revenir avec des infos exactes est une demande que je risque de te répéter : donc enregistre ta
méthode pour qu'elle soit fiable ».)*

## Le problème qu'il ferme

**Un agent qui fait le point de mémoire produit un document qui RESSEMBLE à un état des lieux.**
C'est pire qu'une absence : l'utilisateur prend des décisions dessus.

Le cas réel qui a fait naître ce process, le 2026-09-30 : un document d'état annonçait « les
obligations de la famille AGENCE n'ont jamais été comptées ». **Elles l'étaient — 93 — et
l'utilisateur a dû le corriger lui-même.** Le même document portait deux autres chiffres faux,
propagés depuis une lecture approximative de mes propres notes.

**La cause n'était pas l'inattention.** Ses fichiers de demande n'étaient pas dans le dépôt : aucun
outil ne pouvait confronter ce que je produisais à ce qu'il demandait. Je faisais le point sur
7 400 mots de demandes que je ne pouvais pas relire mécaniquement.

## Son déclencheur

Toute demande de la forme : « où on en est ? » · « es-tu à jour ? » · « fais le point » · « reprends
tout » · « toutes mes demandes ont-elles été traitées ? ». **Et il l'a annoncé : cette demande
reviendra.**

## Ses étapes, chacune avec sa preuve

| # | L'étape | Ce qui la prouve |
|---|---|---|
| 0 | **Consulter SMART-CONSO-TOKEN et annoncer la durée et la consommation estimées** avant de commencer | un point complet est une lecture exhaustive du dépôt — le schéma coûteux que l'Article 22 oblige à faire arbitrer |
| 1 | **Déposer toute saisine dans le dépôt** avant de l'analyser — une demande hors du dépôt est invérifiable par tout outil | le fichier existe dans `docs/grand-projet/00-sources/01-sa-demande/` |
| 2 | **Recenser AVANT de répondre** : découper chaque saisine en points, VERBATIM, avec `rapport-gros-prompt` | une saisine JSON avec son `texteIntegral` |
| 3 | **Chercher la preuve de chaque point par une COMMANDE**, jamais de mémoire | chaque ligne de l'état porte la commande ou le chemin qui la fonde |
| 4 | **Reproduire tout chiffre au moment de l'écrire** | un chiffre non reproduit ce jour-là est marqué « non revérifié », jamais affirmé |
| 5 | **Croiser avec l'outil de couverture** (`abraham couverture`) ET déclarer sa limite | le rapport cite le verdict ET la phrase de limite de l'outil |
| 6 | **Ouvrir DEUX cas à la main** parmi ceux déclarés « pas fait » (leçon L47) | les deux cas sont nommés dans le rapport |
| 7 | **Le plan d'action** : mettre l'action en face de chaque constat, avec son état RETENU / ÉCARTÉ (raison écrite) / À TRANCHER, et inscrire les tâches retenues dans `docs/suivi/` | **un état des lieux EST un rapport**, donc l'Article 28 s'y applique entièrement |
| 8 | **Livrer en HTML, en pièce jointe** | sa règle, et le dernier geste |

## Les trois états, jamais deux

- **FAIT** — avec le chemin du fichier qui le prouve. Sans chemin, ce n'est pas « fait ».
- **PARTIEL** — avec *ce qui manque exactement*, pas « à compléter ».
- **PAS FAIT** — avec la commande qui le prouve (`grep` à zéro occurrence, par exemple).

**Un quatrième état est interdit** : « je crois que c'est fait ». Il se dit « non revérifié » et se
range avec les PAS FAIT jusqu'à preuve du contraire.

## Ce qu'il ne fait PAS

Il ne juge pas si ce qui a été fait était la bonne chose. Il dit ce qui EST, pas ce qui VAUT.

## Sa limite honnête

**Les demandes formulées à l'oral dans la conversation ne sont récupérables par aucune commande.**
Elles vivent dans l'échange, pas sur le disque. Elles se recopient à la main dans la saisine —
et si l'agent en rate une, seul l'utilisateur peut le voir. C'est déclaré ici plutôt que découvert
au prochain reproche.

## Les fichiers sur lesquels il s'appuie

| Fichier | À quoi il sert ici |
|---|---|
| `docs/agent-du-temps/estimations.md` | la mémoire des estimations : l'étape 0 y confronte la durée annoncée à la durée réelle, sans quoi l'estimation suivante ne s'améliore jamais |
| `docs/suivi/index.md` | le suivi durable : c'est là qu'atterrissent les tâches nées des constats RETENUS de l'étape 7 |
| `scripts/angel-of-ia-process.mjs` | le contrôleur : il DEMANDE si les étapes non mécanisables ont été tenues, et refuse d'être au vert sans réponse |

## Son contrôleur

`scripts/god-of-all-process.mjs` — le process y est déclaré, donc `which "faire le point"` le
retrouve, et ses étapes sont comptées comme celles des autres.
