# Registre des passages THE-DEEP-READER

*(Cf. `docs/referentiel/the-deep-reader.md` pour le mécanisme complet. Un fichier par passage
(`<date>.md`), cette page résume chaque passage : nombre d'interventions relues, écarts trouvés,
tâches ouvertes en conséquence.)*

| Date | Interventions relues | Écarts trouvés | Tâches ouvertes | Fichier | Dernière tâche couverte (N°) |
|---|---|---|---|---|---|
| 2026-09-20 | 69 | 4 (1 confirmé déjà en file, 1 déjà résorbé, 1 trouvaille de conception corrigée, 1 mineur à clarifier) | 0 nouvelle (toutes déjà trackées ou reformulées) | [2026-09-20-nuit-autonome.md](2026-09-20-nuit-autonome.md) | 178 |
| 2026-09-23 | 200 | 8 (2 pertes réelles de valeur, 6 demandes sans trace) | 8 nouvelles (#227 à #234) | [2026-09-23-ronde-goat-max.md](2026-09-23-ronde-goat-max.md) | 640 |

Coût réel observé (2026-09-20, premier passage) : 252 252 tokens, 12 appels d'outil, 424s — bien
au-delà du plancher fixe ~37k évoqué par SMART-CONSO-TOKEN, confirmant que le coût de THE-DEEP-READER
est réellement variable (volume de conversation + fichiers lus), jamais un chiffre fixe.

Coût réel observé (2026-09-23, deuxième passage, Ronde GOAT MAX) : 345 992 tokens, 65 appels d'outil,
988 s — sur une borne de 462 tâches (#178 → #640) contre 178 au premier passage. Le coût a donc crû
de 37 % pour un périmètre 2,6 fois plus large : la lecture ne coûte pas proportionnellement au
nombre de tâches, ce qui confirme dans l'autre sens que le plancher fixe (~37 k) pèse lourd sur un
petit périmètre et que **restreindre la borne reste un levier réel, mais moins fort qu'on ne le
croirait**. À garder en tête avant de proposer une borne étroite « pour économiser ».

**L'angle mort de ce passage, déclaré plutôt que tu** : le fichier d'interventions fourni ne contient
que les messages ÉCRITS par l'utilisateur. **Ses réponses aux fenêtres de questions n'y figurent
pas**, alors que le suivi cite en permanence des arbitrages « tranchés en fenêtre dédiée » (#536,
#594, #608, #609). Ces citations n'ont donc été ni confirmées ni infirmées. C'est le plus gros trou
de la méthode, et il est structurel : une réponse de fenêtre n'existe pas comme message dans le
transcript. À résoudre avant le prochain passage, sans quoi le même angle mort se reproduira.
