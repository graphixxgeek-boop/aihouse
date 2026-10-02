# Le document de gouvernance — forme arrêtée et régime d'intangibilité

**À LIRE** : avant toute intervention touchant `docs/philosophie-et-politique.md`, et avant toute
production d'une édition nouvelle.

---

## CE QUE CETTE FICHE PORTE, ET POURQUOI ELLE EXISTE À PART

Le document de gouvernance porte lui-même son régime, en tête. Cette fiche-ci porte ce qui n'a pas
sa place dedans : **comment ce régime est tenu**, par quel mécanisme, et ce qu'aucun mécanisme ne
peut tenir. La distinction est celle que le document applique partout ailleurs — un texte énonce
la règle, une fiche dit qui la porte (art. 61).

**La règle d'origine, posée le 2026-10-02** : le document devient le document officiel du projet,
il remplace définitivement les éditions antérieures, et il ne peut être modifié qu'avec l'accord
du responsable du projet. Sa forme est arrêtée et ne varie plus d'une édition à l'autre.

---

## LA FORME ARRÊTÉE

L'ordre des parties est fixe :

| Rang | Partie |
|---|---|
| 1 | Le régime du document — statut, portée, abrogation, intangibilité, neutralité du support |
| 2 | Le préambule — méthode d'établissement, en deux paragraphes |
| 3 | **Titre préliminaire** — l'énoncé fondamental, puis **les trois objectifs ultimes**, puis leur concordance |
| 4 | **Titre I** — dispositions générales : architecture, niveaux, exportation, rang |
| 5 | **Titre II** — philosophie, en trois chapitres (général, Jeu, Agence) |
| 6 | **Titre III** — politique, en trois chapitres (mêmes niveaux, même ordre) |
| 7 | **Titre IV** — clauses intangibles |
| 8 | **Titre V** — établissement, forme et révision |
| 9 | Annexes |

**Trois exigences de forme, qui ne se négocient pas :**

1. **Les trois objectifs ultimes figurent au titre préliminaire**, immédiatement sous l'énoncé
   fondamental. Ils ne sont jamais reformulés : ils sont repris tels qu'arrêtés.
2. **Chaque chapitre de philosophie et le titre de politique s'ouvrent par une synthèse** de deux
   à trois lignes, suivie — lorsqu'elle est fondée — de la filiation philosophique ou politique
   correspondante. Une filiation n'est mentionnée que si elle éclaire le contenu ; jamais pour
   l'ornement.
3. **La numérotation des articles est continue**, sans trou ni doublon, sur l'ensemble du
   document.

---

## CE QUI EST TENU PAR UN MÉCANISME

**L'empreinte d'ossature** (`docs/the-king/empreinte-document-officiel.json`) enregistre les
titres du document et le nombre de ses articles. `comparerALEmpreinte()` détecte une modification
de l'ossature ; `verifierLOssature()` refuse une numérotation trouée ou dupliquée.

**La forme est vérifiée par sa STRUCTURE, jamais par son TEXTE**, et c'est délibéré : un document
dont on contrôlerait le texte mot à mot deviendrait un document qu'on ne pourrait plus corriger,
même avec accord. Ce qui est gardé est l'ossature — les titres dans leur ordre, et la continuité
de la numérotation. C'est exactement l'étendue de ce que l'article 70 déclare fixe.

**Poser une empreinte nouvelle** — `poserLEmpreinte()` — est un acte qui suit une édition
autorisée, jamais qui la précède. Reposer l'empreinte pour faire taire une alerte reviendrait à
supprimer le contrôle.

---

## CE QU'AUCUN MÉCANISME NE PEUT TENIR, ET LE DÉCLARER EST LA PROTECTION

**Qu'un accord ait été donné ne se vérifie pas.** Aucune empreinte, aucun test et aucun crochet
git ne distingue une modification autorisée d'une modification faite de sa propre initiative. Le
mécanisme ci-dessus garantit seulement qu'une modification ne passe pas **inaperçue** : il la rend
visible, donc assumable. C'est le maximum qu'une mécanique puisse apporter à une règle qui se joue
entre deux personnes, et c'est l'article 32 du document appliqué à lui-même.

**La neutralité du support ne se vérifie pas davantage.** Qu'aucun commentaire, aucune observation
et aucun élément de conversation ne figure dans le document relève de la rédaction, pas de la
structure. Un contrôle automatique chercherait des marqueurs de première personne et manquerait la
moitié des cas tout en accusant des tournures légitimes. **La règle est donc portée par cette
déclaration, et par elle seule** : toute remarque se formule hors du document.

---

## RÉVISION

Une édition nouvelle suit cet ordre, sans exception :

1. Accord exprès et préalable du responsable du projet sur le principe de la modification.
2. Archivage intégral et sans altération de l'édition remplacée (`docs/the-king/archives/`).
3. Rédaction de l'édition nouvelle, dans la forme arrêtée ci-dessus.
4. Pose d'une empreinte nouvelle.
5. Mention de l'édition et de sa date dans le régime du document.
