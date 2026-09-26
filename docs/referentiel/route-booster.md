# route-booster — fiche d'instanciation

*(Surnom d'affichage : **find-deep-booster**. Surnom UNIQUEMENT, même patron que memory-audit et
Smart Conso API — le fichier reste `scripts/route-booster.mjs`, jamais renommé sur disque, jamais
réimporté sous un autre nom.)*

## Ce qu'il sert ici

Préparer le découpage de la fonction géante de `app/api/lia/route.ts` (le `POST`, ~1 665 lignes),
sur sa demande explicite du 2026-09-21.

## Ce qu'il détecte ici

Les bannières de commentaires **dans le style de ce projet**, les branches `if (x === "...")` à
faible profondeur, et le commentaire descriptif après une ligne vide. Plus un indice de risque
lexical par candidat.

## La décision déjà prise

Il **propose** des points de coupe, il n'en applique aucun. Le découpage réel de `route.ts` a été
fait à la main avec ses propositions sous les yeux (tâche #173).

## Ce qui a été corrigé ici

Un crash sur un fichier inexistant (tâche #189) : il rendait une erreur brute au lieu d'un refus
propre.

## Sa limite ici

Lecture de motifs, jamais un parseur : il propose, il ne garantit pas une découpe juste. Cette
réserve est imprimée avec son rapport.
