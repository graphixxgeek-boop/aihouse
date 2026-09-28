# Process « sonder le quota Gemini » — le dossier de process

> **Les règles de travail s'appliquent AUSSI ici.** Ce document décrit des ÉTAPES — quoi faire et
> dans quel ordre. Il ne remplace jamais `docs/regles-de-travail.md`, qui décrit la CONDUITE : la
> façon de poser une question, de livrer, de commiter, de rendre compte, et elle vaut pendant ce
> process comme en dehors. La différence exacte entre un process et une règle de travail est
> définie dans `docs/referentiel/organisation-agence.md`.

*(Écrit le 2026-09-28, tâche #1021. Treizième process déclaré du projet.)*

## Pourquoi il existe, et pourquoi c'était le dernier trou

`god-of-all-process` l'a trouvé en vérifiant à froid les tâches #436/#773 le 2026-09-27, section
« activités à enjeu sans process écrit » : **sonder le quota Gemini était la seule activité à enjeu
du dépôt que ne gouvernait aucun process écrit.**

**L'enjeu n'est pas théorique, et il est particulier** : sonder consomme de **vrais appels API** pour
un simple diagnostic. Et le geste a une propriété que peu d'autres ont — **lancé au mauvais moment,
il aggrave exactement le blocage qu'il mesure**. Un sondage qui essaie cinq modèles sur trois clés
pendant que le quota est déjà saturé rapproche du plafond au lieu d'en éloigner.

C'est pour cela que la charte le dit déjà, à l'Article 22 : consulter Smart Conso API avant, « jamais
une exception parce que c'est un diagnostic ». Ce document ne crée pas cette obligation ; il écrit la
suite d'étapes qui va avec, parce qu'**une obligation isolée ne dit pas dans quel ordre agir**.

## Les étapes, dans leur ordre, et aucune ne se réarrange

### 1. Consulter Smart Conso API — AVANT, jamais après

```
node scripts/smart-conso-api.mjs diagnostic --confirm
```

La preuve de cette consultation atterrit dans `docs/smart-conso-api/index.md` : c'est elle qui rend
l'étape vérifiable, et sans elle le contrôleur ne saurait pas dire si elle a eu lieu.

Un verdict **« seuil souple »** reste négociable ; un verdict **« seuil dur »** est non négociable et
exige une validation humaine explicite (Article 22). Cette étape est la seule qui puisse **arrêter**
le process, et c'est sa raison d'être.

### 2. Sonder

```
node scripts/check-gemini-quota.mjs
```

Le sondage essaie les modèles et les clés déclarés, et rend le plus prometteur.

### 3. Reporter la ligne suggérée À LA MAIN dans `.dev.vars`

**Aucun code ne le fait**, et c'est délibéré : écrire tout seul dans le fichier de configuration
d'exécution est une action difficile à défaire, sur un fichier que l'utilisateur possède.

### 4. Si un second projet Google existe : vérifier qu'il est bien DISTINCT

Avant d'ajouter sa clé à `GEMINI_API_KEY_FALLBACKS`, vérifier que c'est bien un **autre projet** et
non une seconde clé du même. Deux clés d'un même projet partagent le même quota : le repli ne replie
rien, et on croit avoir doublé sa marge alors qu'on n'a rien changé.

### 5. Redémarrer le serveur de développement

Sans quoi `.dev.vars` n'est pas chargé — **une variable d'environnement shell seule ne suffit PAS au
runtime Cloudflare Workers**. Vérifier au passage qu'aucun processus `workerd` orphelin n'a survécu à
un `pkill` précédent : il continuerait de servir l'ancienne configuration, et le sondage suivant
mesurerait l'état d'avant.

### 6. LIVRER le résultat, puis le consigner

**Écrire n'est pas livrer** : un sondage dont le résultat reste dans le terminal de l'agent n'a
renseigné personne. Le résultat se rapporte à l'utilisateur — quel modèle répond, quelle clé, et ce
que ça change pour la suite.

Le sondage a coûté de vrais appels : son résultat est une donnée, pas une impression. Il rejoint le
registre de Smart Breaker, et l'écart entre ce qu'on attendait et ce qu'on a mesuré rejoint
`docs/agent-du-temps/estimations.md` (Article 32, faille 3 : une estimation qu'on ne confronte jamais
ne s'améliore jamais).

## Ce que ce process ne fait PAS

- **Il ne décide pas de changer de clé ni de modèle en production.** Il mesure et il propose ; le
  basculement est une décision de l'utilisateur.
- **Il ne s'applique pas au jeu réel.** Les appels que le jeu passe pendant une partie relèvent de
  l'Article 8, jamais de ce process — qui gouverne le diagnostic lancé par l'agent.
- **Il ne remplace pas Smart Breaker.** Le contournement automatique (repli de modèle, rotation de
  clé, recul exponentiel) se déclenche seul ; ce process gouverne le geste MANUEL qui vient après,
  celui qu'aucun code ne fait à la place de l'agent.

## Son contrôleur

`scripts/smart-conso-api.mjs` porte l'étape 1, qui est la seule bloquante. Les étapes 3, 4 et 5 sont
des gestes de main sur des fichiers et des processus : **aucune mécanique ne peut vérifier qu'elles
ont eu lieu**, et le déclarer ici EST la protection (Article 27).
