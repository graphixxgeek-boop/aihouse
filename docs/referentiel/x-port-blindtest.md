# X-Port BLINDTEST — fiche d'instanciation

## Ce qu'il sert ici

`scripts/x-port-blindtest.mjs` (2026-09-26) : le test à l'aveugle de la qualité d'un kit d'export.
**Troisième item coûteux de la Ronde**, aux côtés de THE-FINAL-JUDGE et THE-DEEP-READER, et le seul
des trois dont la mesure est mécanique.

## Pourquoi il existe dans CE projet

Demande explicite de l'utilisateur, qui l'a **nommé lui-même** en fenêtre dédiée : « un script qui a
pour fonction de choisir un membre de l'agence (choix mi-ciblé mi-aléatoire) et de vérifier la
qualité de son kit d'export […] on compare avec le vrai code pour voir si le kit est valable, avec
un résultat externalisé ».

**Le chiffre qui le justifie** : le 2026-09-26, le parc est passé à **82/82 kits complets**, alerte
✅ EXPORT PRÊT. Et rien dans tout ce dépôt ne pouvait dire si UN SEUL de ces 82 kits décrit
fidèlement son code — SAFE-EXPORT le déclare lui-même : « elle compte des pièces présentes, elle ne
lit jamais leur contenu ».

## Ce qui a dû être déplacé dans son idée, et ça la rend meilleure

« Reconstituer le code à partir du kit » est impossible au sens strict : **le code est une des cinq
pièces du kit.** Ce qui se mesure vraiment est la fidélité de la DOCUMENTATION — on donne les trois
documents écrits, jamais le code.

## Les calibrages tranchés par l'utilisateur le jour même

| Question | Sa réponse |
|---|---|
| ce que l'aveugle voit | les trois documents écrits (blueprint, fiche, registre) |
| ce qui compte comme échec | les deux, séparément — RAPPEL et BRUIT, jamais additionnés |
| le tirage | jamais testé d'abord (pondéré par la vitalité), puis le plus ancien |
| combien par passage | un seul (~37 000 jetons par appel d'agent, mesuré) |
| l'effet sur le badge d'export | aucun — rapport séparé |

## Son ajout en cours de construction, et ce qu'il change

« L'idée est de mettre l'outil à jour à la suite du diagnostic de l'aveugle, et de mettre à jour
TOUS les kits si besoin, si faille critique découverte. »

D'où `porteeDuDefaut()` : un manque est LOCAL ou SYSTÉMIQUE. La distinction vaut **un travail contre
quatre-vingt-deux**, et les confondre garantirait de refaire le même diagnostic quatre-vingt-une
fois de plus.

## Ce qu'il a trouvé à son premier passage réel

Deux défauts, dans son propre code, en moins de dix minutes — et le second est le plus instructif :
sa première détection « systémique » comparait des noms de fonctions à des titres de sections, donc
elle aurait crié systémique presque toujours. **Écrite le matin, réfutée l'après-midi par son propre
passage** (leçon L4).

## Comment on le lance

```
node scripts/x-port-blindtest.mjs sujet                          # gratuit — tire et écrit la consigne
  (un agent séparé lit la consigne SEULE et dépose son pronostic JSON)   # coûteux
node scripts/x-port-blindtest.mjs juger <pronostic.json> <sujet> # gratuit — compare et conclut
```

Item de Ronde `x-port-blindtest`, thème « Audit lourd », `costly: true`, dépôt
`docs/x-port-blindtest/ronde/`. Sélectionnable **en mode GOAT uniquement** — c'est le seul mode où
les items coûteux apparaissent, et c'est exactement ce que l'utilisateur a demandé.

**Consulter Smart Conso API et SMART-CONSO-TOKEN avant tout lancement** (Articles 22 et 31).

## Sa limite ici

Deux de ses trois temps sont gratuits ; seul celui du milieu coûte. Le drapeau `costly` porte donc
sur l'ensemble, et sa consigne dit lesquelles des étapes ne coûtent rien — sinon il paraîtrait deux
fois plus cher qu'il n'est.
