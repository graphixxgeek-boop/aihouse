# Les motifs de déplacement cassés à l'affichage — mesure, cause, et correction proposée

> **Rien n'a été corrigé.** Ce défaut change **ce que le visiteur voit**, périmètre que
> l'utilisateur s'est réservé le 2026-09-24. Ce document mesure, explique, et propose — la décision
> lui appartient. Tâches #642 (constat du juge) et #225 (correction technique).

## 1. Ce que le visiteur lit, aujourd'hui

Extraits réels, copiés des transcripts archivés, sans retouche :

```
Je bouge en cuisine : Je vais voir ce qu'il y a dans la cuisine..
Je file au salon : Je retourne au salon pour souffler..
Je pars au bureau : Je reviens dans le bureau pour examiner ce livre de plus près..
Je vais faire un tour au salon : On revient s'installer au salon pour souffler un coup après ces lectures..
Je bouge dans la chambre : Je veux vérifier ce miroir dans la chambre.
```

## 2. La mesure, produite par un outil

`node scripts/el-professor.mjs motifs` — sur les transcripts réellement archivés :

| | |
|---|---|
| Transcripts lus | 3 |
| Lignes de déplacement | 132 |
| Dont portant un motif | 84 |
| **Au moins un défaut** | **37 — soit 44,0 %** |

Répartition (une ligne peut cumuler) : **37 majuscule en milieu de phrase · 36 double point ·
29 pièce nommée deux fois**.

**C'est PIRE que ce que THE-FINAL-JUDGE avait estimé** (24,6 %), pas mieux. Son estimation portait
sur un corpus plus large incluant les résumés compacts ; la mesure ci-dessus ne porte que sur ce qui
a été **réellement affiché**, et c'est le bon dénominateur pour un défaut visuel.

Les lignes « Je te suis. » (départ à deux) sont **exclues du dénominateur** : elles ne portent aucun
motif, et les compter ferait baisser le taux sans qu'un seul défaut soit corrigé.

## 3. La cause : une seule couture, trois symptômes

`departureLine()` (`lib/drama.ts`) construit la phrase ainsi :

```js
(start, motive) => start + target + " : " + motive + ".",
```

Le gabarit attend un **FRAGMENT en minuscules sans point final** — « je veux voir ce qu'il y a par
là » — pour écrire « Je bouge au bureau : je veux voir ce qu'il y a par là. ». C'est d'ailleurs
exactement la forme des motifs du filet de secours, tous écrits en minuscules sans point.

Le modèle, lui, rend une **PHRASE COMPLÈTE capitalisée et ponctuée**, parce que le prompt de
`lib/lia.ts` lui demande « UNE phrase courte […] à la première personne ». Trois conséquences
mécaniques, jamais trois bugs séparés :

1. **Double point** — le gabarit ajoute « . » à un motif qui en a déjà un.
2. **Majuscule en milieu de phrase** — la capitale du motif atterrit juste après « : ».
3. **Pièce nommée deux fois** — le motif renomme la destination que le préfixe vient de nommer.

**Pourquoi personne ne l'a vu pendant dix-neuf simulations** : les deux côtés de la couture sont
corrects pris séparément. Le prompt demande une phrase, il obtient une phrase ; le gabarit attend un
fragment, et il a été écrit à une époque où seul le filet de secours l'alimentait. Le défaut n'existe
que dans le **rendu**, et c'est la définition même d'un défaut d'Article 15.

## 4. La correction proposée — trois lignes, dans une seule fonction

Normaliser le motif **à la couture**, dans `lib/drama.ts`, jamais dans le prompt :

```js
// Le motif arrive tantôt en fragment (filet de secours, minuscules sans point), tantôt en phrase
// complète (le modèle). Le gabarit exige un fragment : on l'y ramène, plutôt que d'exiger du
// modèle une discipline de ponctuation qu'aucune consigne ne peut garantir à 100 % (même limite
// déjà constatée pour l'accord de genre, tâche #109, et pour DÉPART À DEUX).
function fragmentDeMotif(motive, destination) {
  let m = String(motive).trim().replace(/[.…]+$/, "");           // 1. plus de point final
  m = m.charAt(0).toLowerCase() + m.slice(1);                     // 2. plus de capitale après « : »
  for (const loc of LOCUTIONS_DE_PIECE[destination] ?? [])        // 3. plus de pièce en double
    m = m.replace(new RegExp(`\\s+${loc}\\b`, "gi"), "");
  return m.trim();
}
```

Puis, dans `forms` : `form[0]` reçoit `fragmentDeMotif(motive, destination)`, et `form[1]` — qui
commence une vraie phrase — garde la capitale mais perd le point en trop.

**Ce que la correction ne fait PAS, et c'est important** : elle ne touche ni le prompt, ni le contenu
du motif, ni la personnalité. Elle ne change que la **ponctuation et la casse à la jointure**, plus
le retrait d'une redondance de lieu. Rien de ce que Lia et Noé *disent* ne change ; seule la façon
dont c'est *assemblé* change.

**Le point le plus discutable, à trancher par lui** : le retrait de la pièce dans le motif
(« je veux vérifier ce miroir ~~dans la chambre~~ »). C'est la seule des trois retouches qui enlève
des mots plutôt que d'en corriger la forme. Deux options :
- **(a)** la retirer, comme ci-dessus — la phrase est plus nette, la redondance disparaît ;
- **(b)** la garder et ne corriger que ponctuation et casse — on accepte « Je bouge dans la chambre :
  je veux vérifier ce miroir dans la chambre. », qui reste redondant mais n'invente rien.

## 5. Plan d'action (Article 28)

| Constat | État | Suite |
|---|---|---|
| 44 % des motifs affichés portent au moins un défaut de forme | **RETENU** | tâche #225, correction ci-dessus, **en attente de sa validation** (périmètre « ce que le visiteur voit ») |
| Le retrait de la pièce redondante enlève des mots | **À TRANCHER** | option (a) ou (b) ci-dessus — c'est un choix de rendu, donc le sien |
| Aucun outil ne mesurait ce défaut avant aujourd'hui | **RETENU — FAIT** | `node scripts/el-professor.mjs motifs`, construit et lancé le 2026-09-25, couvert par 9 contre-tests |
| L'estimation du juge (24,6 %) était optimiste | **ÉCARTÉ** | ce n'est pas une erreur du juge : il mesurait sur un corpus plus large incluant les résumés compacts, là où la mesure d'aujourd'hui ne porte que sur l'affiché. Les deux chiffres sont justes pour leur périmètre. |
