# Le poids du dépôt, expliqué — et pourquoi on n'efface rien aujourd'hui

Tu m'as dit : « on n'efface pas 20 Mo comme ça sur un coup de tête », et « donne-moi des exemples
concrets, le contexte, les enjeux ». Tu as raison sur les deux points. Voici le dossier complet.

---

## 1. De quoi on parle, en une phrase

Le dossier `docs/` du projet pèse **65 Mo**. La tâche #922 annonçait **3,7 Mo**. Elle n'est pas
fausse par négligence : elle a été mesurée le 2026-09-26, et **le dépôt a grossi de 17 fois depuis**.
C'est le premier enseignement, et il ne concerne pas le ménage : **un chiffre de taille se périme
très vite, donc une décision de rangement prise sur un chiffre d'il y a six jours est une décision
prise à l'aveugle.**

---

## 2. Où est vraiment le poids — mesuré aujourd'hui, pas supposé

| Dossier | Poids | Ce que c'est |
|---|---|---|
| `docs/sauvegardes` | **33 Mo** | les archives `.zip` du projet entier que je te livre |
| `docs/check-tasks-details` | **9,2 Mo** | l'historique de l'outil qui compte les tâches |
| `docs/suivi` | 4,4 Mo | le carnet de tâches lui-même (1 342 lignes) |
| `docs/grand-projet` | 3,6 Mo | les documents du GRAND PROJET |
| `docs/the-screener` | **1,1 Mo** | **les captures d'écran** |

**Ta prémisse était « c'est dû aux screenshots ».** Ils pèsent 1,1 Mo sur 65, soit **1,7 %**. Ce
n'est pas eux. Je te le dis franchement parce que reporter la question à la refonte graphique
l'aurait reportée pour une raison qui n'existe pas — et elle serait revenue intacte dans six mois,
en plus grosse.

---

## 3. Les sauvegardes : ce qu'elles sont, et pourquoi elles grossissent

**Ce que c'est, concrètement.** À chaque Ronde, je produis deux fichiers pour toi : un `.zip` de
**tous les fichiers suivis du projet** (le « coffre »), et une « notice » en texte brut, calibrée
pour qu'une IA puisse l'avaler entière si tu perds l'accès à git et à moi. C'est ta demande du
2026-09-24 : « si demain il y a un gros bug, ou que je n'ai plus accès à toi ou à git, je veux une
copie qui me permette de continuer comme si rien ne s'était passé ».

**Les trois qui existent, et leur courbe :**

| Date | Poids | Croissance |
|---|---|---|
| 2026-09-25 | 6,8 Mo | — |
| 2026-09-28 | 9,8 Mo | +44 % en 3 jours |
| 2026-10-02 | **14,1 Mo** | +44 % en 4 jours |

**J'AI VÉRIFIÉ UNE CHOSE IMPORTANTE, parce que ça aurait tout changé** : chaque `.zip` contient-il
les `.zip` précédents ? **Non.** S'il les contenait, la croissance serait exponentielle et le
problème serait urgent. Elle ne l'est pas : chaque archive est une photo du projet, et elle grossit
simplement parce que **le projet grossit**.

**Et ta règle est DÉJÀ respectée.** Tu avais fixé « les 3 derniers de chaque » le 2026-09-24. Il y a
exactement 3 archives. Je m'étais trompé en te disant qu'elle n'était appliquée par personne —
correction faite.

---

## 4. L'enjeu réel, et il n'est pas le disque

**Le disque ne coûte rien.** 65 Mo, c'est le poids de quelques photos de téléphone. Si c'était le
seul enjeu, la bonne réponse serait « ne rien faire », et je te le dirais.

**Le vrai enjeu est ailleurs, et il est en trois morceaux :**

**(a) Ce que la croissance RACONTE.** Le plus gros fichier du projet est `scripts/check-house.mjs`
— le filet de sécurité — à **3,2 Mo**. Un seul fichier de code de 3,2 Mo, c'est énorme : c'est lui
qui met 44 secondes à chaque enregistrement (la question #819 que tu viens de trancher). Le second
est le carnet de tâches à 1,95 Mo, le troisième l'historique d'un outil à 1,6 Mo. **Le poids n'est
pas un problème de rangement : c'est le symptôme de trois fichiers qui deviennent très gros.**

**(b) Ce qu'une sauvegarde de 14 Mo te coûte À TOI.** Elle t'est livrée dans la conversation. Plus
elle grossit, plus elle devient lourde à télécharger et à garder. Et surtout : la « notice » texte
est calibrée à 1 million de caractères pour qu'une IA puisse la lire en entier — **elle a déjà
atteint ce plafond et s'arrête avant la fin**. Donc la moitié de la sauvegarde qui sert à repartir
avec une IA est déjà tronquée, et ça empirera à chaque fois.

**(c) Ce qui n'est PAS un enjeu, et je le dis pour que tu ne t'en inquiètes pas** : rien n'est en
danger. Rien ne ralentit à cause de ces 65 Mo, rien ne casse, et aucune donnée n'est menacée.

---

## 5. Les options, avec leurs conséquences réelles

**Option A — ne rien faire.** Coût zéro, risque zéro. La question reviendra quand la notice sera
trop tronquée pour servir, c'est-à-dire bientôt. **C'est un choix défendable aujourd'hui.**

**Option B — garder 2 sauvegardes au lieu de 3.** Gagne 6,8 Mo. Tu gardes la plus récente (qui
contient tout) et l'avant-dernière (le filet de sécurité du filet). **Perte réelle : la capacité de
comparer à une semaine de distance.** Faible, mais pas nulle.

**Option C — sortir les `.zip` du dépôt git.** Je te les livre, ils ne sont plus versionnés. Gagne
33 Mo d'un coup. **Mais** : une sauvegarde dans le dépôt qu'elle sauvegarde est de toute façon une
curiosité — si tu perds le dépôt, tu perds aussi les sauvegardes qu'il contient. **C'est l'option la
plus logique sur le fond**, et la seule qui demande quelque chose de toi : les garder de ton côté.

**Option D — s'occuper de la vraie cause.** Les trois gros fichiers (le filet à 3,2 Mo, le carnet à
1,95 Mo, un historique à 1,6 Mo) sont ce qui fait grossir tout le reste, sauvegardes comprises.
Découper ou compacter ces trois-là ferait maigrir les sauvegardes **et** accélérerait le filet.
C'est le plus de travail, et le seul qui règle le problème au lieu de le déplacer.

---

## 6. Mon avis, et pourquoi

**C'est l'option C pour les sauvegardes, et l'option D pour la suite** — mais pas aujourd'hui, et
pas dans la même semaine que le GRAND PROJET.

**Pourquoi C** : une sauvegarde qui vit dans ce qu'elle sauvegarde ne te protège pas du scénario
qu'elle est censée couvrir. C'est le seul argument de fond du lot, et il ne parle pas de mégaoctets.

**Pourquoi D plus tard** : découper le filet de sécurité est une intervention sur le garde-fou qui
bloque tous les enregistrements. On ne fait pas ça entre deux autres chantiers, et sûrement pas la
semaine où tu ouvres le GRAND PROJET.

**Pourquoi pas tout de suite** : tu as dit « on est dans le grand projet, tu as les nuits pour
travailler le reste en parallèle ». Ceci est exactement du travail de nuit.

---

## 7. Plan d'action

| État | Constat | Suite |
|---|---|---|
| **À TRANCHER** | les `.zip` restent-ils dans le dépôt ? | ta décision, et c'est la seule du lot qui a un vrai argument de fond |
| **RETENU** | la notice texte a atteint son plafond de 1 M caractères et se tronque | tâche à ouvrir : la moitié « repartir avec une IA » de la sauvegarde est déjà dégradée |
| **RETENU** | trois fichiers portent l'essentiel du poids (filet 3,2 Mo · carnet 1,95 Mo · historique 1,6 Mo) | tâche à ouvrir, travail de nuit, jamais pendant le GRAND PROJET |
| **ÉCARTÉ** | « c'est dû aux screenshots » | mesuré : 1,1 Mo sur 65, soit 1,7 %. La prémisse ne tient pas |
| **ÉCARTÉ** | effacer des sauvegardes aujourd'hui | ta règle des 3 derniers est déjà respectée, et rien ne presse. On ne gagne que du disque qui ne coûte rien |
