# La version de l'Agence entière — quel axe fait monter le majeur ?

*(Tâche #799 close, question ouverte #800. Posée le 2026-09-25. Une seule décision à prendre,
et elle est à toi : je ne l'ai pas prise à ta place.)*

## Ce qui est déjà fait, et qui ne se rediscute pas

Tu demandais trois choses ; les trois sont livrées.

1. **Une version pour l'Agence au global** — elle existe : `node scripts/cassandra-rh.mjs versions`
   l'affiche en tête. Aujourd'hui **v69.446**.
2. **Rétroactif** — oui, et sans rien saisir à la main : tout était déjà dans l'historique git.
3. **Fiabilisé** — 12 contre-tests neufs, dont deux qui font échouer la mesure EXPRÈS pour que ses
   deux angles morts soient connus plutôt que découverts un jour par surprise.

**Ce que la version n'est PAS**, parce que c'était le piège évident : ni la somme ni la moyenne des
cinquante versions par outil. La somme monterait à chaque faute de frappe corrigée dans n'importe
quel script. La moyenne, elle, **baisserait** le jour où un outil neuf rejoint l'équipe — un nouveau
membre ferait *reculer* la version de l'équipe, exactement l'inverse de ce qui s'est passé.

## La seule question qui reste : qu'est-ce qui fait monter le premier chiffre ?

Le premier chiffre (le « majeur ») doit compter quelque chose d'important. Ta tâche #730 en nommait
trois. **Les trois sont maintenant comptés pour de vrai, à chaque passage** — tu choisis donc entre
trois chiffres réels, pas entre trois idées.

| Axe | Ce qu'il compte | Combien aujourd'hui | Ce que ça donnerait |
|---|---|---|---|
| **équipe** *(défaut actuel)* | un outil rejoint ou quitte l'équipe | **69** | v69.446 |
| **gardiens** | un Gardien sacré du code de plus ou de moins | **4** | v4.511 |
| **charte** | un Article de la charte apparaît ou disparaît | **26** | v26.489 |

**Pourquoi « équipe » sert de défaut en attendant** — et c'est un défaut déclaré, jamais une
décision prise à ta place : c'est l'analogie exacte de la règle par outil, celle que tu avais
validée. Pour UN outil, le majeur compte les fois où il a gagné ou perdu une capacité. Pour
l'Agence, la même chose vue de plus haut : les fois où elle a gagné ou perdu un membre.

**Les deux autres se défendent aussi, et voici honnêtement en quoi :**

- **gardiens** donne le chiffre le plus sobre (4 en un an de travail). Un Gardien sacré de plus,
  c'est quelque chose qui tourne à *chaque* commit — donc un vrai changement de ce que l'Agence
  fait sans qu'on le lui demande. Le reproche possible : un chiffre qui bouge quatre fois ne
  raconte presque rien du travail réel.
- **charte** compte les Articles. C'est la loi que tous les outils servent : un Article de plus, et
  les cinquante outils travaillent sous une règle de plus. Le reproche possible : la charte peut
  changer sans qu'aucun outil ne change, et l'inverse aussi.

## Ce que je te demande

Un mot suffit : **équipe**, **gardiens**, ou **charte**. Le changement est d'une ligne, et la
version se recalcule entièrement à partir de git — rien à ressaisir, rien à perdre.

Si tu préfères un quatrième axe auquel je n'ai pas pensé, dis-le : la mécanique lit une liste
d'axes, elle n'en énumère aucun en dur (Article 24).

## Plan d'action (Article 28)

- **RETENU** — la version de l'Agence, rétroactive et fiabilisée → tâche **#799**, faite.
- **À TRANCHER** — l'axe du majeur → tâche **#800**, en attente de ta réponse. Rien ne bloque
  pendant ce temps : le défaut déclaré tient la place.
- **ÉCARTÉ** — la somme et la moyenne des versions par outil, pour la raison écrite plus haut :
  toutes deux rendent un chiffre qui ressemble à une mesure sans en être une, et un chiffre faux
  est plus dangereux qu'un chiffre absent (un chiffre absent se voit).
