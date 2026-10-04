# L'ORGANISATION DES LOIS — qui fait loi, dans quel rapport, et comment citer sans ambiguïté

> **DÉCOULE DE :** `docs/philosophie-et-politique.md`
> *l'organisation des textes qui font loi relève du document qui se déclare lui-même officiel :
> c'est son propre rapport aux autres qui est en jeu.*

*(Établi le 2026-10-02T08:37Z — heure LUE, source système. Tâche **#1445**.
Mesure : `node scripts/abraham-les-references.mjs lois`.)*

---

## POURQUOI CE DOCUMENT EXISTE MAINTENANT, ET PAS AVANT

**Il n'était pas nécessaire il y a trois jours.** Un seul texte de ce dépôt portait des Articles
numérotés : la charte. « Article 19 » n'était donc ambigu pour personne, et une convention de
citation aurait été une solution sans problème.

**Ce qui a changé le 2 octobre** : la Vision Globale porte désormais sa propre
numérotation. **Deux lois numérotent, et leurs plages se chevauchent sur 31 numéros.** La même
citation désigne deux dispositions différentes selon le texte qu'on avait en tête — ce qui s'est
produit pour de vrai, trois fois en une nuit, avant que ce document n'existe.

---

## LES SIX TEXTES QUI FONT LOI

**La liste ne se recopie pas ici** (Article 24) : elle vit dans `DOCUMENTS_QUI_FONT_LOI`
(`scripts/le-classificateur.mjs`), chaque entrée portant sa raison, et la mesure la LIT. Le tableau
ci-dessous donne ce que la mesure en dit, pas une seconde liste.

| Texte | Numérote ? | Son domaine |
|---|---|---|
| `CLAUDE.md` | **oui** — 33 articles, 0 à 32, densité 1,00 | la charte : le Jeu, et la méthode d'intervention sur le code |
| `docs/philosophie-et-politique.md` | **oui** — 71 articles, 2 à 72, densité 1,00 | les valeurs, la politique, et la façon de trancher un conflit de valeurs |
| `docs/regles-de-travail.md` | non — 5 numéros épars (densité 0,26) : ce sont des CITATIONS de la charte | la méthode de collaboration |
| `docs/systeme-de-suivi.md` | non | la structure du suivi durable |
| `docs/loi-de-l-agence.md` | non | le texte suprême de l'outillage |
| `docs/manifeste-de-l-agence.md` | non | ce que l'Agence EST, et ce qu'il est interdit d'y mettre |

**NUMÉROTER N'EST PAS CITER, ET LE SÉPARATEUR EST LA DENSITÉ.** Aucun motif de texte ne distingue
une déclaration d'une citation : les deux s'écrivent `**Article 18 — Titre.**`. Ce qui les sépare
est une propriété de l'ENSEMBLE — une vraie numérotation est dense et continue, une poignée de
citations est clairsemée. Les deux vraies lois numérotées rendent 1,00 ; le document le plus proche
en dessous rend 0,26. **La frontière est large, et c'est ce qui la rend sûre plutôt qu'ajustée au
cas du jour.**

---

## LA CONVENTION DE CITATION, ET ELLE NE DEMANDE AUCUN RENOMMAGE

| Ce qu'on cite | Comment on l'écrit |
|---|---|
| la charte | **« Article N »**, tout court — la forme historique, conservée |
| la Vision Globale | **« article N de la Vision Globale »**, en toutes lettres |
| les quatre autres | par leur nom, puisqu'ils ne numérotent pas |

**POURQUOI LA CHARTE GARDE LA FORME NUE, et ce n'est pas un privilège arbitraire** : elle a été la
seule loi numérotée pendant toute la vie du dépôt, et **5 068 citations de la plage commune sont
déjà écrites** dans cette forme, toutes antérieures au second texte, toutes voulant dire la charte.
Les renommer coûterait un chantier entier et ne clarifierait rien — c'est exactement le renommage
en masse que le responsable de projet a refusé d'infliger au code. **La convention vaut donc pour ce
qui s'écrit ENSUITE, et l'existant est acquis.**

---

## CE QUI SE VÉRIFIE MÉCANIQUEMENT, ET CE QUI NE LE PEUT PAS

**Ce qui se vérifie** : `node scripts/abraham-les-references.mjs lois` refuse une citation d'un
Article **qu'aucune loi ne porte**. C'est faux sans jugement possible, donc c'est mécanisable sans
aucun risque de fausse accusation. **Au premier passage, il en a trouvé exactement une** —
un renvoi aux numéros 122 et 123 dans un document de conception, qui voulait dire « tâche #122 »
et « 123/123 tests ». Une référence morte ressemble à un lien, ce qui est pire qu'une absence : le lecteur croit
pouvoir aller vérifier. Elle a été corrigée le jour même.

**Ce qui ne se vérifie pas, et le déclarer EST la protection (Article 27)** : savoir si une citation
DANS la plage commune visait la bonne loi est un **jugement**, jamais une mesure. Les deux
dispositions existent ; seul le sens de la phrase les sépare. **Aucun mécanisme ne tranchera ça**,
et un garde-fou qui prétendrait le faire accuserait 5 068 lignes légitimes — la leçon L4 dans sa
forme la plus coûteuse.

---

## LE RANG DES LOIS ENTRE ELLES — CE QUI EST ÉTABLI, ET CE QUI NE L'EST PAS

**Ce qui est établi, parce que les textes le disent eux-mêmes :**

- **L'Article 0 de la charte** est la loi suprême **du Jeu** — l'esprit de Lia et Noé, et rien
  d'autre.
- **`docs/loi-de-l-agence.md`** est le texte suprême **de l'outillage**, et il est le seul à partir
  avec l'Agence le jour de l'export. Les confondre rendrait l'Agence inexportable sans que personne
  ne s'en aperçoive.
- **La Vision Globale** porte des **clauses intangibles** et son propre régime de révision.

**CE QUI N'EST PAS ÉTABLI, et c'est une vraie question, pas une omission** : trois textes énoncent
chacun une suprématie, sur trois domaines présentés comme distincts (le Jeu, l'outillage, les
valeurs). Tant que les domaines ne se touchent pas, l'ordre n'a pas besoin d'être écrit. **Le jour
où ils se toucheront, rien dans le dépôt ne dira lequel l'emporte** — et ce jour-là n'est pas
prévisible, ce qui est précisément ce qui rend la question valable maintenant plutôt qu'alors.

**Cette question est portée à l'arbitrage du responsable de projet** (`docs/idees-a-trancher.md`),
jamais tranchée ici : décider lequel de trois textes suprêmes l'emporte est exactement ce que la
charte réserve à l'utilisateur.

---

## PLAN D'ACTION *(Article 28)*

| État | Constat | Ce qui en découle |
|---|---|---|
| **RETENU** | son travail sur l'organisation des lois n'avait laissé aucune trace, alors que les trois autres sujets du même bloc en avaient laissé neuf | **FAIT** — ce document, tâche **#1445** |
| **RETENU** | deux lois numérotent sur 31 numéros communs, sans convention écrite | **FAIT** — la convention ci-dessus, qui ne demande aucun renommage |
| **RETENU** | une citation d'un Article que personne ne porte (le renvoi aux numéros 122 et 123) | **FAIT** — corrigée le jour même, et le contrôle qui l'a trouvée reste en place |
| **À TRANCHER** | trois textes énoncent chacun une suprématie, et rien ne dit lequel l'emporte si leurs domaines se touchent | **sa décision** — inscrite dans `docs/idees-a-trancher.md` |
| **ÉCARTÉ** | requalifier les 5 068 citations déjà écrites de la plage commune | **raison écrite** : elles sont toutes antérieures au second texte et veulent toutes dire la charte. Les renommer coûterait un chantier entier sans lever la moindre ambiguïté réelle, et c'est le renommage en masse explicitement refusé |
| **ÉCARTÉ** | un garde-fou sur les citations de la plage commune | **raison écrite** : savoir laquelle des deux lois une phrase visait est un jugement. Un détecteur accuserait 5 068 lignes légitimes et cesserait d'être lu (leçon L4) |
