# Mes réponses à tes questions — nuit du 2026-09-23

*(Chantier 10 du plan de nuit. Tu m'as posé huit questions dans le gros prompt ; voici les réponses,
préparées pendant la nuit pour que tu les aies au réveil. Écrit sans jargon : quand un nom technique
est inévitable, il est traduit juste à côté.)*

---

## 1. « BP3, BP4, c'est quoi ces trucs ?? »

**Réponse courte : ce sont des étiquettes que j'ai inventées, et ta réaction montre qu'elles sont
mal nommées.**

Il existe un carnet, `docs/referentiel/lecons.md`, où j'écris ce que le projet a appris en se
trompant. Il a deux parties :

- les **leçons** (L1, L2, L3…) — chacune a été payée par une vraie erreur ;
- les **bonnes pratiques** (BP1, BP2, BP3…) — des réflexes qui marchent, sans casse derrière.

Donc « BP3 » veut juste dire « bonne pratique numéro 3 ». En clair :

| | Ce que ça dit, en français simple |
|---|---|
| **BP1** | Une règle s'écrit à UN seul endroit, et tout le reste va la lire là. Recopiée à deux endroits, elle finit par dire deux choses différentes. |
| **BP2** | Un test qui n'a jamais échoué ne prouve rien. Avant de le croire, je le fais échouer exprès une fois. |
| **BP3** | Quand un test dit non et que le code dit oui, je cherche ce qui manque au code — je n'assouplis jamais le test pour qu'il passe. |
| **BP4** | Un détecteur qui n'a jamais rien trouvé ne prouve rien non plus. Je lui donne un faux problème pour vérifier qu'il mord. |

**Ce que je retiens de ta question** : je t'ai écrit « BP3 » comme si tu avais le carnet sous les
yeux. C'est exactement le travers que l'Article 29 vise — un nom propre sans définition atteignable.
À l'avenir j'écris la chose, pas l'étiquette : « je n'assouplis pas le test », pas « BP3 ».

---

## 2. « Il nous faut un responsable de l'organisation des tâches : c'est check-detail le bon candidat ? »

**Oui, et c'est fait.** `check-tasks-details` est désormais inscrit dans le code comme responsable
de l'organisation des tâches — pas seulement convenu entre nous, parce qu'un rôle qui n'existe que
dans une conversation ne survit pas à la session qui l'a accordé.

Concrètement, il sait maintenant faire deux choses qu'il ne faisait pas :

- **lire le niveau de priorité d'une tâche** et les signaux qui le justifient, au lieu que je les
  devine à la lecture ;
- **rendre la file des tâches dans l'ordre que les priorités imposent**, au lieu de l'ordre
  d'écriture.

**Une nuance qui compte** : les règles de priorité elles-mêmes vivent dans un fichier à part. Ce
n'est pas une coquetterie — `check-tasks-details` est déjà un très gros fichier dont seize autres
dépendent, et y coudre l'échelle des priorités l'aurait encore alourdi. Il LIT les règles, il ne les
héberge pas.

---

## 3. « Qui se charge de vérifier par ailleurs que tout est à niveau ? »

**Personne ne le faisait. Maintenant si : A-NIVEAU.**

Le problème était réel et invisible : vingt outils vérifient chacun leur part et répondent « ma part
va bien ». Aucun ne peut répondre « tout va bien », parce que pour ça il faudrait détenir la liste de
ce qui DEVRAIT être vérifié — et personne ne la détenait. Un oubli dans cette liste ne déclenche
aucune alerte : il n'a simplement pas de voyant.

Deux choses ont été construites, dans cet ordre :

1. **Un document qui écrit les exigences** (`docs/referentiel/standards.md`) — 29 exigences réparties
   sur quatre niveaux, chacune nommant qui la vérifie, ou déclarant que personne ne la vérifie. Sans
   ce document, « ce n'est pas à niveau » n'est qu'une opinion, et une opinion se discute au lieu de
   se corriger.
2. **Un outil qui le lit** et rend un verdict par domaine. Il ne scanne rien lui-même — c'est la
   forme que tu avais choisie en fenêtre : il appelle les contrôleurs existants et rassemble.

**Le verdict au moment où j'écris** : l'Agence 15/15, les documents 7/7, le code 5/7, le jeu hors
périmètre (il relève de la charte, pas d'un standard d'outillage). Les deux exigences non couvertes
sont déclarées comme telles, pas découvertes par surprise.

---

## 4. « Est-ce que tout le code bénéficie de la leçon que tu as apprise ? »

**Honnêtement : pas automatiquement, non — et c'est maintenant visible.**

Une leçon est apprise à UN endroit, celui où l'erreur a fait mal, et corrigée à cet endroit-là. Rien
ne garantissait que les dix autres fichiers du même genre en profitent. C'était même le contraire par
défaut.

Il y a maintenant deux niveaux, et la séparation est volontaire :

- **Le niveau mécanique, gratuit, en continu** : il dit quels fichiers concernés par une leçon ont
  été modifiés APRÈS qu'elle a été apprise. Ce sont les endroits où la question se pose vraiment.
  Il POSE la question, il n'affirme jamais qu'il y a un défaut.
- **Le niveau profond, sur demande, coûteux** : un vrai jugement « ce fichier porte-t-il le
  défaut ? ». Ça demande de lire le sens du code, donc ça ne peut pas être automatique.

**Pourquoi pas « tous les fichiers concernés » plutôt que « ceux qui ont bougé »** : ça rendrait des
dizaines de fichiers dormants par leçon. Un relevé qui accuse presque tout a tort presque toujours,
et on cesse de le lire.

---

## 5. « Le conseil "rédige ton prompt à part" — qui devrait le porter ? »

**SMART-CONSO-TOKEN**, l'outil qui surveille ce que MA façon de travailler coûte en tokens. C'est
son domaine exact.

**Pourquoi une rafale de messages courts coûte cher, et ce n'est pas intuitif** : chaque message,
même de trois mots, relance un tour complet. Tout le contexte est rechargé — la charte, les
documents ouverts, l'historique — pour traiter « ok continue ». Dix précisions envoyées une par une
coûtent dix rechargements ; la même demande rédigée d'un bloc n'en coûte qu'un.

**Ce que l'alerte dit, et ce qu'elle ne dira jamais** : ce n'est pas un reproche. Découper sa pensée
en messages courts est une façon parfaitement légitime de réfléchir à voix haute, et c'est souvent
comme ça qu'une bonne idée se précise. L'alerte signale seulement le moment où ça devient cher, et
propose l'alternative concrète — un bloc-notes à côté, collé d'un coup.

Elle se déclenche à quatre messages courts d'affilée, et un message un peu long la referme
aussitôt, puisque c'est précisément ce qu'elle cherchait à obtenir.

---

## 6. « Les six étiquettes de priorité »

**Faites**, avec la frontière que tu avais posée : ce qui distingue un palier du suivant, c'est
**ce que coûte l'attente**, jamais l'impression du moment.

Un point que tu avais tranché et qui est bien dans le code : un dégât qui S'AGGRAVE tant qu'on
n'agit pas passe directement au palier le plus haut, sans passer par les intermédiaires.

Les 470 anciennes lignes de suivi ont été converties. **Un incident vaut d'être mentionné** : ma
première vérification de cette conversion partageait le même filtre que la conversion elle-même —
les deux exigeaient un numéro de tâche — donc les deux ont sauté les mêmes 50 lignes, et le contrôle
a annoncé « zéro valeur ancienne restante » en toute bonne foi. C'est une des leçons de la nuit :
une vérification qui partage l'angle mort de ce qu'elle vérifie ne vérifie rien.

---

## 7. « Le vocabulaire "gardien" »

**Corrigé**, et la règle est dans la charte (Article 20bis). Le mot désignait quatre rôles qui n'ont
ni le même objet ni la même autorité :

- **Gardien sacré du code** — les sept qui scannent vraiment la qualité du code ET tournent
  gratuitement à chaque enregistrement. L'expression reste réservée à ce rang.
- **Contrôleur de process** — surveille le DÉROULÉ d'une activité à étapes, jamais la qualité du
  code. Il signale, il ne corrige jamais.
- **Veilleur** — surveille UN document ou UNE décision déjà prise.
- **Garde-fou mécanique** — jamais un outil, toujours une fonction à l'intérieur d'un outil.

Un mécanisme vérifie maintenant qu'aucun document normatif n'emploie « gardien » tout seul. **Et
il m'a déjà attrapé**, sur une phrase que je venais d'écrire.

**Ce qui n'a pas été fait, et je le dis plutôt que de le taire** : les 67 fichiers qui citent les
trois scripts nommés `*-process-guardian` n'ont pas été renommés. Le rang y est déjà clair (le mot
`process` est dans le nom), et un renommage massif juste avant une revue risquait de casser des
registres pour zéro clarté gagnée. C'est une tâche ouverte, pas un abandon.

---

## 8. « memory-audit sur les scripts de simulation »

**C'est le chantier 11, une enquête sans aucun changement — tu avais été clair là-dessus.** Le
résultat vit dans un document séparé (`docs/plans/memory-audit-enquete-2026-09-23.md`) pour ne pas
noyer ces réponses-ci.

---

## Ce que je n'ai PAS décidé à ta place

Trois choses attendent ton arbitrage, et je n'y ai pas touché :

- **Le renommage des rangs** (Scribes / Premium / Platine noir) — c'est ton appel.
- **Les cinq tâches en stagnation** — je te les présente, je ne les ferme pas.
- **Le travail de fond sur la charte** — tu voulais le faire ensemble. Je n'y ai touché que pour
  DEUX inscriptions strictement mécaniques (une ligne de tableau et une puce) qu'un test refusait
  de laisser passer ; aucune règle n'a bougé.
