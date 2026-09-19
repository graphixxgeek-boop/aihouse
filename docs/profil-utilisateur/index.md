# Profil utilisateur — index des observations

*(Créé le 2026-09-19, à la demande explicite de l'utilisateur : « alimente la section qui traite de
mon profil psychologique dans les règles de travail [...] à chaque début de session, à chaque fois
que la session redémarre après avoir été compactée [...] crée un dossier local qui historise les
différents profils observés et pris en compte, avec un index [...] le but : lors de la mise à jour
de mon profil psychologique, tout l'historique est pris en compte pour refléter plus justement mon
vrai profil psychologique, et être capable de décrire ses variations possibles ». Voir
`docs/regles-de-travail.md` §9, sous-section « Historisation du profil », pour la procédure
complète. Ce dossier ne remplace jamais §8/§9 de ce document — il les NOURRIT : le résumé "officiel"
lu par tout agent reste dans `docs/regles-de-travail.md`, jamais dupliqué ici.)*

## Pourquoi ce système, et en quoi il est plus fiable que l'ancien

Avant ce jour, §8/§9 de `docs/regles-de-travail.md` étaient mis à jour directement, par réécriture,
à chaque fois qu'une observation semblait pertinente — sans jamais garder trace de CE QUI avait été
observé exactement, ni de QUAND, ni de si un trait donné s'était confirmé une ou dix fois. Un seul
moment isolé pouvait donc peser autant, dans le texte final, qu'un motif répété sur plusieurs
sessions. Ce dossier corrige ce point précis : chaque observation est datée, sourcée, classée
(nouveau / confirmation / nuance / contradiction par rapport à l'état déjà connu), et le résumé
officiel n'est réécrit qu'une fois qu'un motif réel se dégage de PLUSIEURS observations distinctes
— jamais sur la foi d'une seule (calibrage explicite du 2026-09-19).

## Structure

```
docs/profil-utilisateur/
├── index.md                      — ce fichier : table de toutes les observations + état du système
└── observations/
    ├── <horodatage-UTC>.md       — une fiche par déclenchement (reprise après compaction)
    └── ...
```

## Ce qu'une fiche d'observation contient

- La source exacte (résumé de compaction de quelle session, ou session directe si pas de
  compaction) et l'horodatage.
- Chaque signal extrait, avec un **extrait proche du texte original de l'utilisateur** comme preuve
  (décision explicite du 2026-09-19 : la précision prime sur la légèreté pour ce système précis).
- Une classification par rapport à l'état déjà connu (`docs/regles-de-travail.md` §8/§9 au moment de
  l'observation, ou l'observation la plus récente si elle est plus à jour) :
  - **Nouveau** — un signal qui n'apparaît nulle part encore dans le profil officiel.
  - **Confirmation** — un signal qui reproduit un trait déjà écrit, sans rien y changer.
  - **Nuance** — un signal qui précise ou étend un trait déjà écrit, sans le contredire.
  - **Contradiction** — un signal qui semble contredire un trait déjà écrit (le cas le plus rare et
    le plus important à ne jamais ignorer : un trait qui varie réellement dans le temps).
- Ce qui n'a délibérément pas été extrait (le contenu du projet lui-même n'est jamais un signal de
  profil, seule la manière de collaborer l'est).

## Règle de mise à jour du résumé officiel (§8/§9)

*(Calibrage explicite du 2026-09-19.)* Le texte de `docs/regles-de-travail.md` §8/§9 n'est réécrit
que lorsqu'au moins deux ou trois observations distinctes, à des moments différents, pointent dans
la même direction — jamais sur la base d'une seule fiche isolée. Un signal classé « Nouveau » ou
« Contradiction » reste donc en attente dans son fiche jusqu'à corroboration ; un signal
« Confirmation » n'a jamais besoin de déclencher de réécriture (il ne fait que renforcer ce qui est
déjà écrit). Quand une réécriture a bien lieu, la règle déjà existante de §8 s'applique
sans exception : informer l'utilisateur EN DÉTAIL (ce qui a été observé, ce que ça change dans le
texte) avant ou en même temps que la modification, jamais après coup en silence.

## Portée rétroactive — décidée explicitement, même principe que le reste du projet

Ce système démarre à partir de sa création (2026-09-19), sans reconstruire de fiches rétroactives
pour les sessions antérieures — leur contenu a déjà nourri §8/§9 directement avant que ce système
existe ; le reformuler après coup en fiches datées introduirait un faux degré de précision sur des
observations qui n'ont pas été enregistrées avec cette rigueur à l'époque (même principe que
`docs/systeme-de-suivi.md`, section « Portée rétroactive »).

## Table des observations

| Horodatage (UTC) | Source | Signaux nouveaux | Signaux confirmés/nuancés | Fiche |
|---|---|---|---|---|
| 2026-09-19T20:19:05Z | Session en cours (`session_0151JrVYzJ2bdCShaXhFAjLo`) — création du système lui-même | 2 (attachement transparent à une idée d'outillage tout en acceptant son abandon ; ton ludique/méta assumé en plein travail technique) | 3 (invitation active à proposer des règles ; réaction directe sans détour à un pépin technique ; préférence systématique pour être interrogé avant exécution) | [2026-09-19-2019.md](observations/2026-09-19-2019.md) |
