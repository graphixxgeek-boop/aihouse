# CHECK-TASKS-DETAILS — blueprint exportable

*(2026-09-20, demandé explicitement par l'utilisateur : un gabarit fixe pour répondre à une demande
récurrente — « fais-moi l'état des tâches en cours » — sans redécouvrir sa forme à chaque fois.)*

## Le problème générique

Sur tout projet piloté par IA suivi via un système de suivi durable (des tâches horodatées, un
thème, un statut), une demande récurrente et mal automatisée revient : « où en est-on ? ». Répondue
à la main, elle prend une forme différente à chaque fois (parfois une liste, parfois une
arborescence, parfois un mélange des deux), n'est jamais archivée, et ne se compare jamais à la
fois précédente où on l'a posée. Une relecture lourde par un agent séparé (l'équivalent de
THE-DEEP-READER dans ce projet) peut répondre à la question, mais coûte cher et est disproportionnée
pour une simple photo de l'état courant.

## Le principe

Un script mécanique, gratuit, **strictement en lecture seule** sur le système de suivi (jamais une
seconde porte d'écriture sur la source de vérité), qui répond à deux axes de calibrage à chaque
appel :
- **Le zoom** : le sous-ensemble de tâches à montrer (l'actualité immédiate / une vue élargie
  incluant le passé récent / tout l'historique).
- **La forme** : une liste plate groupée par statut, ou une arborescence groupée par thème/sous-thème
  déjà présents dans les données du suivi (jamais une nouvelle taxonomie inventée).

Le rapport est rendu en page HTML autonome (en réutilisant le gabarit HTML générique déjà existant
du projet plutôt qu'en inventant une seconde mise en page), archivé dans un dossier dédié avec un
index, et chaque génération **compare son instantané courant à l'historique des générations
précédentes** pour repérer deux anomalies honnêtes : une régression de statut (une tâche redevient
« en cours » après avoir été « terminée » — ne devrait jamais arriver) et une stagnation (une tâche
ouverte identique sur plusieurs générations consécutives — un signal d'oubli possible, jamais une
certitude).

## Frontière stricte : lecture seule

La source de vérité du suivi reste modifiée par un seul chemin (l'agent, à la main, une ligne à la
fois). Cet outil ne fait jamais autorité sur le contenu : il lit, il regroupe pour la présentation,
il propose — jamais il n'écrit dans le suivi lui-même. Une classification utile qui manquerait dans
les données source est signalée dans le rapport, jamais ajoutée silencieusement.

## Consultation du réseau d'outils

Un outil de ce type peut consulter le catalogue de prestations disponibles du réseau d'outils du
projet (si un tel catalogue existe) pour signaler, tâche par tâche, quelle prestation existante
pourrait aider à la faire avancer — un simple rapprochement mécanique (mots-clés), jamais une
intelligence qui devine une intention. Ce canal doit être exposé comme une fonction pure, appelable
par n'importe quel autre outil du paysage, pas seulement celui-ci.

## Ce que ce blueprint NE fixe PAS

Les zooms/formes exacts, les seuils de stagnation, le nom des colonnes lues, la structure précise du
rapport, et le statut (outil complet avec blueprint/registre, ou simple utilitaire) sont des choix
d'instanciation, propres à chaque projet — cf. le document d'instanciation correspondant.
