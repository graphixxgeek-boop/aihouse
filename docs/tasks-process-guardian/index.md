# tasks.process.guardian — registre

*(2026-09-22, nom donné par l'utilisateur. Troisième gardien de process, aux côtés de
`circle-process-guardian` (la Ronde) et `process-simulation-guardian` (la simulation).)*

**Le principe qu'il protège, dans ses mots** — gardé tel quel parce qu'il justifie chacune des
quatre vérifications :

> « les taches ont une valeur, les idées ont une valeur, ce process doit proteger cette valeur, car
> une tache ou une idee perdue est une perte de valeur seche pour le projet »

Perte **sèche** : pas un retard, pas une inefficacité — une valeur produite puis détruite. C'est
pour ça que ce gardien signale même ce qu'il ne peut pas prouver, plutôt que de se taire.

**Ce qu'il n'est pas** : un second lecteur de `docs/suivi/`. `check-suivi-fidelity.mjs` lit déjà les
sessions et `check-tasks-details.mjs` produit déjà l'état des lieux — il les APPELLE et juge le
PROCESS, il ne recalcule jamais ce qu'ils savent (§7ter, Article 3).

## Les quatre trous, chacun avec sa preuve réelle

| Trou | Preuve | Réponse |
|---|---|---|
| Vérification **asymétrique** | 4 tâches faites depuis 2 jours et jamais closes, trouvées à la main | croiser les tâches ouvertes avec les commits récents |
| Tâche **sans rapport source** | la chaîne de l'Article 28 va du rapport vers la tâche, jamais l'inverse | vérifier qu'une tâche issue d'un plan d'action cite son rapport |
| Tâche **en suspens oubliée** | 2 tâches bloquées sur une décision depuis le 2026-09-20 | un signal qui **grossit** avec l'attente |
| **Idée sans fichier** | « ma valeur + ta valeur » formulée le 21, introuvable le 22 | déléguer à check-tasks-details, et vérifier que la délégation est réelle |

## Deux faux positifs structurels, trouvés au PREMIER passage réel

Tous deux corrigés par un **principe**, jamais par un filtre élargi mot à mot (corollaire de
l'Article 17, qui interdit exactement la liste qui grandit sans jamais couvrir le cas suivant).

1. **On croisait la CATÉGORIE, pas le titre.** Le champ « Sujet » est une classification
   (« Conception / Nouvel outil (CASSANDRA-RH) ») : la croiser avec des messages de commit garantit
   un faux positif sur toute zone active — plus on travaille AUTOUR d'un sujet, plus le détecteur
   croit que chacune de ses tâches est faite. Même famille d'erreur que celle déjà corrigée une fois
   ici (`checkChantierFileFreshness` croisait le Détail) : **une catégorie n'est jamais une
   description**.
2. **Des mots courants isolés comptaient.** « objectifs » dans un commit et « membre » dans un autre
   ne dit rien sur une tâche qui parle des deux. Il faut désormais **la moitié des mots du titre
   dans le MÊME commit** — un seuil qui vaut pour n'importe quelle tâche future.

**Troisième exclusion, de fond** : une tâche **bloquée sur une décision humaine** ne peut pas avoir
été faite sans qu'on s'en aperçoive. C'est une décision qui manque, pas une exécution oubliée — les
deux se ressemblent dans le suivi et n'ont rien à voir.

**Résultat après correction** : 0 faux positif sur les tâches réellement ouvertes, et le vrai cas
mord toujours.

## Ce qu'il refuse de deviner

Une idée formulée en conversation ne laisse **aucune trace** sur le disque tant qu'elle n'y a pas
été écrite. L'agent le déclare ; une non-déclaration se voit (`mesurable: false`) au lieu de passer
pour un « rien à signaler ».
