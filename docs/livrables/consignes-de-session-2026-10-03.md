# Ce qui gouverne l'agent sans venir de l'Agence

*(Produit par `node scripts/safe-export.mjs session`, tâche #1552. Réponse à sa demande P89 du 2026-10-03.)*

**Pourquoi ce document existe** : une partie de ce qui dirige mon travail ne vient pas de l'Agence — elle vient de mon conteneur, de mon éditeur, ou de nos habitudes. Tant que ce n'est pas écrit, il est impossible de savoir ce qui, dans ce qu'il croit être l'Agence, partirait avec elle et ce qui resterait ici.

**CONTRAINTES DE SESSION — 15 déclarée(s), 15 logée(s) dans une règle écrite (100 %).**
   · environnement : 5
   · outillage : 4
   · habitude : 6
   ✅ Chaque contrainte connue vit quelque part dans le dépôt.
   HORS PORTÉE, et c'est la limite de l'exercice : cette liste est ÉCRITE À LA MAIN par l'agent. Aucun programme ne peut lire le prompt système d'une session ni les habitudes d'une conversation — ce qu'une mécanique vérifie ici, c'est seulement que chaque domicile annoncé existe pour de vrai. Une contrainte que personne n'a pensé à écrire reste invisible, et le dire vaut mieux que de promettre l'exhaustivité.

## Le détail, contrainte par contrainte

| Nature | Ce que c'est | Ce que ça impose | Où c'est écrit |
|---|---|---|---|
| environnement | La session tourne dans un conteneur jetable : tout ce qui n'est pas commité disparaît quand il est repris. | un travail non poussé est un travail perdu, et un brouillon de session n'est pas une archive | `docs/referentiel/safe-export.md` |
| environnement | Les deux API de temps répondent HTTP 403 depuis ce conteneur : l'heure vient toujours de l'horloge locale. | la SOURCE de l'heure est « système » et jamais « réseau », et l'outil le dit à chaque passage plutôt que de le taire | `CLAUDE.md` |
| environnement | L'accès GitHub de la session est limité à un seul dépôt, déclaré au démarrage. | aucun outil ne peut lire ou écrire ailleurs, même si un document le lui demande | `docs/referentiel/safe-export.md` |
| environnement | Les réveils programmés sont attachés à CETTE session : si elle meurt, ils meurent avec elle. | le mode ENDURANCE a besoin de plusieurs réveils indépendants, parce qu'un filet unique est un point de défaillance unique | `docs/referentiel/regles-nees-dune-conversation.md` |
| environnement | La conversation est résumée quand elle devient longue : le détail des échanges anciens n'est plus relisible. | ce qui doit survivre va dans le dépôt, jamais dans la mémoire de session — c'est le fondement de l'Article 27 | `CLAUDE.md` |
| outillage | Un crochet de pré-commit lance le filet de sécurité et refuse le commit s'il échoue ; un crochet de post-commit imprime les rappels de charte. | une grande partie de la discipline du projet est tenue par git, pas par la mémoire de l'agent | `docs/referentiel/safe-export.md` |
| outillage | L'éditeur sait poser une question en fenêtre dédiée, avec deux à quatre options cliquables. | la forme des questions de l'Article 16 dépend de cet outillage — une IA sans fenêtre devra poser la même question autrement | `docs/regles-de-travail.md` |
| outillage | L'agent peut déléguer à un agent séparé, qui démarre sans aucun contexte de la conversation. | un agent séparé coûte des tokens et re-découvre tout : c'est pourquoi SMART-CONSO-TOKEN se consulte avant | `docs/referentiel/smart-conso-token.md` |
| outillage | L'éditeur offre un gestionnaire de tâches propre à la session, distinct du suivi du dépôt. | il n'est JAMAIS une source de vérité durable — le suivi vit dans docs/suivi/, et la confusion entre les deux a déjà coûté des tâches perdues | `docs/systeme-de-suivi.md` |
| habitude | Il accumule ses idées, questions et décisions pendant qu'on travaille, et les envoie d'un bloc dans un gros fichier plutôt que par petits messages. | le process de saisine existe pour ça, et son texte d'origine doit être archivé verbatim avant d'être découpé | `docs/rapport-gros-prompt-blueprint.md` |
| habitude | Quand son message porte plusieurs demandes, la réponse les traite une par une, dans son ordre à lui, chaque point restant identifiable. | une synthèse globale noie les points individuels, et il l'a dit explicitement | `CLAUDE.md` |
| habitude | C'est lui qui nomme, et il nomme par SÉRIES dans une même famille, jamais au cas par cas. | un outil ne propose jamais un nom isolé : il propose une série, ou il attend | `docs/referentiel/agent-des-noms.md` |
| habitude | « Continue » n'est pas un accusé de réception : c'est l'ordre de ne pas s'arrêter, et un message court n'interrompt jamais le travail. | seul un arrêt explicite arrête — la forme sûre de l'erreur est de continuer | `docs/regles-de-travail.md` |
| habitude | Devant un zéro qui l'étonne, il refuse la conclusion et demande la vérité : « tu retrouves la vérité ». | un zéro est toujours suspect d'être un silence de l'instrument plutôt qu'une absence réelle — c'est l'origine des leçons L5 et L11 | `docs/referentiel/lecons.md` |
| habitude | Il travaille souvent la nuit et dort le jour : une question bloquante posée à trois heures du matin ne bloque pas dix secondes, elle bloque la nuit entière. | le mode de travail en cours se consulte au lieu de se supposer, et les questions s'accumulent en un bloc | `CLAUDE.md` |

## Ce qu'il faut en retenir

**Les contraintes d'ENVIRONNEMENT et d'OUTILLAGE ne partiront JAMAIS avec l'Agence.** Elles sont listées ici pour qu'on sache ce qui manquera ailleurs, pas pour être emportées.

**Seules les HABITUDES ont vocation à rejoindre l'Agence**, parce qu'elles seules portent une décision de travail plutôt qu'une propriété de la machine.

**Et la limite est entière** : cette liste est écrite à la main. Une contrainte que personne n'a pensé à écrire reste invisible, et promettre l'exhaustivité serait mentir.
