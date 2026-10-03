<!-- DOCUMENT GÉNÉRÉ — produit intégralement par un outil, aucune ligne n'est écrite à la main -->
# Classification des lois et des règles

> Produit par `node scripts/abraham-les-references.mjs classification` le 2026-10-03.
> Les six textes sont lus dans le registre du classificateur, leurs règles découpées et notées à chaque passage.

## ① Les six niveaux de protection — l'échelle, et elle n'est pas inventée

Chacun correspond à un mécanisme qui EXISTE dans ce dépôt et qu'on peut constater.

| Niveau | Nom | Ce que c'est | Ce que ça ne protège pas |
|---|---|---|---|
| 0 | **AUCUNE** | rien ne la porte : ni test, ni garde-fou, ni rappel, ni même une impossibilité déclarée | elle n'existera plus à la session suivante — c'est exactement ce que l'Article 27 interdit |
| 1 | **DÉCLARATIVE** | écrite seulement, mais l'impossibilité d'un mécanisme est DÉCLARÉE avec sa raison | repose sur la lecture, donc sur la mémoire d'un agent — mais le déclarer EST la protection (Article 27) |
| 2 | **RAPPELÉE** | un outil la fait remonter au bon moment (terrain d'une leçon, tool-brain, bannière post-commit) | elle passe sous les yeux, rien ne vérifie qu'elle a été suivie |
| 3 | **DEMANDÉE** | un contrôleur exige une DÉCLARATION et refuse d'être au vert sans elle (angel-of-ia-process) | ne rend pas le mensonge impossible — il le rend EXPLICITE, ce qui est déjà beaucoup |
| 4 | **CONSTATÉE** | un garde-fou lit une TRACE RÉELLE sur le disque et compare au dû | ne voit que ce qui laisse une trace — une étape faite sans trace lui reste invisible |
| 5 | **BLOQUANTE** | un test ou un crochet git BLOQUE le commit quand elle est enfreinte | rien, sinon son propre périmètre : elle ne protège que ce qu'elle sait regarder |

## ② Le niveau de protection de chaque texte qui fait loi

**La médiane, jamais la moyenne ni le maximum** : sur une échelle ordinale une moyenne ne désigne
aucun mécanisme réel, et un maximum dirait qu'un texte est bloquant parce qu'UNE de ses règles l'est.
Le minimum est donné à côté : c'est lui qui dit où le texte est le plus faible.

| Texte | Règles | Niveau médian | Le plus faible | Règles sans aucun porteur |
|---|---|---|---|---|
| **la Charte** | 33 | 5 — BLOQUANTE | 0 — AUCUNE | 8 (24 %) |
| **les règles de travail** | 22 | 5 — BLOQUANTE | 0 — AUCUNE | 2 (9 %) |
| **le document de gouvernance** | 45 | 0 — AUCUNE | 0 — AUCUNE | 44 (98 %) |
| **le système de suivi** | — | *PAS MESURÉ* | — | — |
| **la loi de l'Agence** | — | *PAS MESURÉ* | — | — |
| **le manifeste de l'Agence** | — | *PAS MESURÉ* | — | — |

### Ce qui n'a PAS pu être mesuré, et pourquoi

Un texte qui ne se découpe pas n'est pas un texte sans protection : les deux se liraient pareil
et appellent des gestes opposés.

- **le système de suivi** — aucune forme de numérotation reconnue (au mieux 0 unité(s), minimum 3) — découper quand même reviendrait à inventer une structure
- **la loi de l'Agence** — aucune forme de numérotation reconnue (au mieux 0 unité(s), minimum 3) — découper quand même reviendrait à inventer une structure
- **le manifeste de l'Agence** — aucune forme de numérotation reconnue (au mieux 0 unité(s), minimum 3) — découper quand même reviendrait à inventer une structure

### Les trous de numérotation

Dans un texte qui fait loi, un numéro absent est une **citation morte en puissance** : « article 45 du
document de gouvernance » a l'air d'un renvoi et ne mène nulle part. Un trou DÉCLARÉ serait légitime ;
c'est le silence qui ne l'est pas.

- **le document de gouvernance** — 26 numéro(s) manquant(s) : 38 à 63

## ③ Comment citer une règle sans ambiguïté

Sa correction de format, appliquée telle qu'il l'a écrite.

| Texte | Comment on le cite |
|---|---|
| `CLAUDE.md` | Article 19 de la Charte (Art. 19 au sujet de comprendre avant de toucher) |
| `docs/philosophie-et-politique.md` | article 19 du document de gouvernance (art. 19 au sujet de comprendre avant de toucher) |
| `docs/regles-de-travail.md` | les règles de travail au sujet de comprendre avant de toucher |
| `docs/systeme-de-suivi.md` | le système de suivi au sujet de comprendre avant de toucher |
| `docs/loi-de-l-agence.md` | la loi de l'Agence au sujet de comprendre avant de toucher |
| `docs/manifeste-de-l-agence.md` | le manifeste de l'Agence au sujet de comprendre avant de toucher |

## ④ Le détail, texte par texte

### la Charte

`CLAUDE.md` — la charte : la loi suprême du projet, lue en entier avant toute intervention

| Niveau de protection | Nombre de règles |
|---|---|
| 0 — AUCUNE | 8 |
| 1 — DÉCLARATIVE | 0 |
| 2 — RAPPELÉE | 0 |
| 3 — DEMANDÉE | 2 |
| 4 — CONSTATÉE | 0 |
| 5 — BLOQUANTE | 23 |

### les règles de travail

`docs/regles-de-travail.md` — la méthode de collaboration — la charte ordonne de la lire EN PLUS d'elle, jamais à sa place

| Niveau de protection | Nombre de règles |
|---|---|
| 0 — AUCUNE | 2 |
| 1 — DÉCLARATIVE | 1 |
| 2 — RAPPELÉE | 0 |
| 3 — DEMANDÉE | 4 |
| 4 — CONSTATÉE | 0 |
| 5 — BLOQUANTE | 15 |

### le document de gouvernance

`docs/philosophie-et-politique.md` — les valeurs et la façon de trancher un conflit de valeurs — texte fondateur, révisé exceptionnellement

| Niveau de protection | Nombre de règles |
|---|---|
| 0 — AUCUNE | 44 |
| 1 — DÉCLARATIVE | 1 |
| 2 — RAPPELÉE | 0 |
| 3 — DEMANDÉE | 0 |
| 4 — CONSTATÉE | 0 |
| 5 — BLOQUANTE | 0 |

### le système de suivi

`docs/systeme-de-suivi.md` — aucune forme de numérotation reconnue (au mieux 0 unité(s), minimum 3) — découper quand même reviendrait à inventer une structure

*PAS MESURÉ : ce texte ne se découpe pas en règles numérotées.*

### la loi de l'Agence

`docs/loi-de-l-agence.md` — aucune forme de numérotation reconnue (au mieux 0 unité(s), minimum 3) — découper quand même reviendrait à inventer une structure

*PAS MESURÉ : ce texte ne se découpe pas en règles numérotées.*

### le manifeste de l'Agence

`docs/manifeste-de-l-agence.md` — aucune forme de numérotation reconnue (au mieux 0 unité(s), minimum 3) — découper quand même reviendrait à inventer une structure

*PAS MESURÉ : ce texte ne se découpe pas en règles numérotées.*

## ⑤ Ce que cette mesure NE dit pas

**Un texte à niveau 0 n'est pas un texte mal écrit.** Le niveau mesure ce qui PORTE une règle —
un test, un crochet, un contrôleur, ou une impossibilité déclarée. Un texte de valeurs qui tranche
des conflits de principe ne nomme aucun mécanisme PAR CONSTRUCTION, et le lui reprocher serait le
garde-fou qui accuse à tort. Ce que le chiffre dit, et c'est déjà beaucoup : si ce texte est enfreint,
rien dans le dépôt ne s'en apercevra — il faudra qu'un humain le remarque.

# PLAN D'ACTION

| État | Constat | Suite |
|---|---|---|
| ✅ MESURÉ | les six niveaux de protection sont réutilisés tels quels, jamais une échelle de plus | #1539 |
| ? À INSTRUIRE | le document de gouvernance : 44 de ses 45 articles n'ont AUCUN porteur. Est-ce normal pour un texte de valeurs, ou faut-il en porter une partie ? | #1539 |
| ? À TRANCHER | le document de gouvernance : 26 numéros manquants, non déclarés. Plage réservée, ou articles perdus ? | #1539 |
| ? À INSTRUIRE | le système de suivi fait loi et ne se découpe pas en règles : ses obligations sont hors de toute mesure de protection | #1539 |
| ? À INSTRUIRE | la loi de l'Agence fait loi et ne se découpe pas en règles : ses obligations sont hors de toute mesure de protection | #1539 |
| ? À INSTRUIRE | le manifeste de l'Agence fait loi et ne se découpe pas en règles : ses obligations sont hors de toute mesure de protection | #1539 |

<!-- /DOCUMENT GÉNÉRÉ -->
