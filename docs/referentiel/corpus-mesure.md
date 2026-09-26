# corpus-mesure — fiche d'instanciation

## Ce qu'il sert ici

`scripts/corpus-mesure.mjs` (2026-09-25, tâche #858, chantier #206) : empêche un **Gardien sacré** de
dire « tout va bien » sur des données absentes.

## Pourquoi il existe dans CE projet

L'utilisateur avait ouvert le chantier #206, et ses mots tiennent sur une ligne : « auditer tous les gardiens : peuvent-ils dire tout va bien sur des données absentes ? ».

La réponse était oui, pour plusieurs d'entre eux. Il a autorisé la correction groupée en fenêtre
dédiée : « oui, les sept d'un coup ». *(Sa formulation dit « gardiens » tout court ; elle est citée
telle quelle — réécrire ses mots pour faire taire un garde-fou falsifierait ce qui a été dit. Le
rang exact est : **Gardien sacré du code**, Article 20bis.)*

## Qui l'appelle ici

Les sept Gardiens sacrés du code. Chacun déclare son corpus avant de rendre son verdict ; un corpus
vide sort en « PAS MESURÉ » au lieu d'un tableau vide.

## Sa limite ici

Il garantit que le corpus n'est pas vide, jamais qu'il est complet ni pertinent. Un Gardien sacré du code à qui
l'on passerait la mauvaise arborescence rendrait un verdict mesuré et faux — et rien ici ne le
verrait.
