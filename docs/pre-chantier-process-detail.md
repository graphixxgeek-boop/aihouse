# Process PRÉ-CHANTIER — le dossier de process

*(Écrit le 2026-09-26 d'après son gros prompt, étape par étape. Huitième process déclaré du projet.)*

**RÈGLE D'ÉCRITURE EN TÊTE** : tout mécanisme construit pour ce process s'inscrit ICI, pas seulement
dans `docs/suivi/`. Le suivi date ce qui a été FAIT ; le process dit ce qui EST.

---

## Partie 1 — Ce que ce process existe pour empêcher

**Le problème, dans ses mots** : « à la base, on crée PAS un repertoire d'idees et notes en vrac au
sujet d'un chantier, A LA PLACE : on crée tout de suite une STRATEGIE de chantier et on integre
chaque nouvelle idée/note à la stratégie existante, à sa place. »

Une idée notée en vrac n'est pas perdue — elle est pire que perdue : **elle est retrouvable mais
inexploitable**. Au moment d'exécuter le chantier, il faut relire trente notes éparses, retrouver
lesquelles se contredisent, deviner lesquelles ont été abandonnées. Le coût n'est pas payé quand on
note ; il est payé six semaines plus tard, quand il faut agir.

**Son intention profonde, littéralement** : « centraliser les NOTES et IDEES autour d'un chantier,
dans un nouveau type de rapport qui est une stratégie pour l'execution, plutôt qu'une suite
accumulée de notes. »

---

## Partie 2 — Ce qui existait déjà, mesuré avant de construire

Sa consigne était explicite : « je pense que beaucoup de choses exsitent deja dans ce que je te
demande : on réaménage simplement l'existant, ca devrait etre rapide, pas de depense ou creation
inutile ». **La mesure lui a donné raison** : le système existe, mais éclaté en **trois conventions
qui s'ignorent**.

| Ce qui existe | Combien | Ce qu'il fait | Ce qui manque |
|---|---|---|---|
| `docs/*-conception.md` | 8 | les notes d'un chantier, format libre | aucune structure, aucun lien à une tâche |
| `docs/plans/` | 25 | plans, enquêtes, propositions, cadrages | même rôle, autre dossier, autre convention |
| `docs/idees-a-trancher.md` | 1 registre | les idées sans décision | ne dit rien de ce qui a été décidé |

**Et l'un d'eux s'appelle déjà `docs/plans/classification-notes-et-strategie.md`.** Le mot était là,
le format ne l'était pas. Il n'y avait donc rien à inventer : il y avait à unifier.

---

## Partie 3 — Le process, en huit étapes (sa structure A→H)

| # | Étape | Qui la porte |
|---|---|---|
| **A** | **L'idée est-elle validée ?** Lui demander : est-ce qu'on crée vraiment ce chantier ? **La suite ne vaut que si la réponse est OUI.** | une question de calibrage, jamais une supposition |
| **B1** | Créer la TÂCHE « nouveau chantier » dans `docs/suivi/` | le système de suivi |
| **B2** | Créer le RAPPORT « STRATÉGIE DE CHANTIER » tout de suite, à partir des éléments existants à date | `check-tasks-details strategie creer` |
| **B3** | **LIER les deux** — la stratégie porte le numéro de tâche, et le dit en tête | mécanique : le squelette l'inscrit, et crie s'il manque |
| **C** | **Alimenter au fur et à mesure** — chaque idée nouvelle trouve sa place dans la stratégie | `check-tasks-details strategie ajouter` |
| **D** | Juste avant l'exécution : **lui livrer le rapport dans la conversation** | `check-tasks-details strategie livrer` |
| **E** | **Analyser le document** : faire le point, refaire des calibrages si besoin | l'agent, puis une fenêtre de questions |
| **F** | **S'assurer que l'OUTIL correspondant est à jour** selon la stratégie | vérification manuelle, chantier par chantier |
| **G** | Lancer l'exécution, **en parfaite harmonie avec la stratégie** | — |
| **H** | **La fin du process est signalée par le début de la construction effective** | — |

**Les trois commandes de la colonne de droite vivent toutes dans UN SEUL fichier :
`scripts/check-tasks-details.mjs`** — l'outil des tâches, étendu le 2026-09-26 plutôt que doublé par
un script de plus (Article 24 : un nouveau venu hérite de ce que l'équipe sait déjà faire). C'est
lui le gardien mécanique de ce process : il porte le squelette des sept sections, le versement
d'une idée à sa place, le garde-fou anti-résumé et la livraison. Écrire ici le nom du fichier n'est
pas une redondance de la colonne : une commande peut être renommée, le porteur reste, et une IA qui
reprend le projet doit pouvoir aller le lire sans le deviner (Article 27).

---

## Partie 4 — La consigne ferme de l'étape C : la stratégie NE RÉSUME JAMAIS

*(Ses mots, en majuscules dans son prompt, répétés deux fois dans le même message.)*

> « aucune perte, la stratégie agrège, mais ne résume JAMAIS : L'idée sont restitués intégralement,
> et sécurisés. UN RAPPORT DE STRATGIE ET INSPIRATION NE RESUME JAMAIS LES IDEES, il les ORDONNE,
> il trouve leur place DANS LA STRATEGIE. LE RAPPORT NE SYNTHETISE PAS, IL HARMONISE TRES
> LEGEREMENT POUR POUVOIR INTEGRER L'IDEE A LA STRATGEIE EXISTANTE. »

**Comment c'est garanti mécaniquement** (sa décision en fenêtre de calibrage) : chaque idée entre
comme une **citation intégrale** entre guillemets, **avec sa source**. `strategieARésumé()` compare
le nombre de caractères cités à celui des sources ; si la stratégie porte moins de texte que ses
sources n'en contiennent, **elle a résumé, et elle le dit**.

**En cas de conflit majeur** entre la stratégie existante et une idée nouvelle : **on ne tranche
pas, on pose une question de calibrage.** L'agent n'arbitre jamais entre deux de ses idées.

**Ce que le garde-fou ne peut pas voir, et le dire vaut mieux que de prétendre le contraire** : il
compte des CARACTÈRES, pas du SENS. Une citation intégrale mais mal placée passe pour bonne ; une
reformulation plus longue que l'original passe aussi. Il attrape la perte grossière — celle qui
arrive vraiment, quand on « synthétise pour que ça tienne » — jamais la trahison subtile.

---

## Partie 5 — Les deux bugs auto-référentiels du premier jour, gardés comme contre-tests

Le garde-fou anti-résumé a été **corrigé deux fois, aux deux premiers passages réels**, et les deux
fois pour le même motif : **un outil qui se trouve lui-même dans ce qu'il mesure.**

1. Il comptait la bannière « CE DOCUMENT NE RÉSUME JAMAIS » comme une citation — elle est en bloc.
   Résultat : **408 caractères cités pour 66 de source**. Il se nourrissait de son propre en-tête,
   et aurait déclaré « aucune perte » sur un document entièrement résumé.
2. Son motif s'arrêtait au premier guillemet fermant, donc **toute idée contenant des guillemets
   français était tronquée**. Il a crié « 92 % PERTE » sur un document parfaitement intact — alors
   que citer l'utilisateur en le citant est exactement ce que la règle lui demande de faire.

**C'est la troisième fois cette semaine que ce motif revient** (find-booster tâche #182, la sonde
« coûte des appels API » le matin même, ces deux-ci). Il a désormais sa forme nommée : *un outil
qui se cherche dans le texte qu'il analyse se trouvera toujours.*

---

## Partie 6 — Ce que ce process NE fait pas

- **Il ne s'applique pas à une idée non validée.** L'étape A est un filtre, pas une formalité : une
  idée dont il n'a pas dit « oui, on crée ce chantier » n'a pas de stratégie. Elle reste dans
  `docs/idees-a-trancher.md`, qui garde son rôle.
- **Il ne remplace pas le suivi.** La tâche reste la source de vérité de l'AVANCEMENT ; la stratégie
  porte l'INTENTION et la matière. Deux questions différentes, deux documents.
- **Il ne décide jamais à sa place.** Ni le nom du chantier, ni les arbitrages de la section 6.
