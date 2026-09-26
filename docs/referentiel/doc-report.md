
## La décision HTML/texte se DÉRIVE, elle ne se recopie pas (2026-09-26, tâche #926)

**Le constat qui l'a motivée, et il se retourne contre l'outil** : `findRegistriesMissingDecision()`
comptait 24 dossiers sans décision enregistrée, et son plan proposait 24 fois « trancher la décision
de `docs/X` et l'inscrire au registre ». Vingt-quatre lignes à recopier à la main dans `REGISTRIES`
— **c'est-à-dire exactement la liste tenue à la main que l'Article 24 interdit**, et qui se
périmerait au prochain dossier créé. Le garde-fou censé attraper la dette en produisait une.

**Ce qui est dérivable — 13 cas sur 23 sur ce dépôt** : un dossier `docs/<slug>/` dont le script
`scripts/<slug>.mjs` existe répond tout seul. Si ce script importe `html-report.mjs` il livre en
HTML, sinon en texte. Ce n'est pas une supposition sur le nom : c'est **le code du producteur, lu**,
donc une décision qui se relit à chaque passage et ne peut pas se périmer.

**Ce qui ne l'est pas — et l'outil le DIT plutôt que de le deviner (leçon L5)** : un dossier sans
script du même nom est ambigu par nature. Il peut être un dossier de documents (`docs/plans`,
`docs/reponses`) ou **le registre d'un outil dont le script porte un autre nom** — et ce n'est pas
théorique : `docs/smart-breaker/` est produit par `check-gemini-quota.mjs`, `docs/tableau-de-bord/`
par `kpi-report.mjs`. Un outil qui trancherait « pas un registre » se tromperait sur ces deux-là.

**Chaque abstention porte son PROPRE indice** — sinon les dix recevaient la même phrase recopiée dix
fois, le travers que le motif de CLONE-HUNTER a déjà corrigé (tâche #217). L'indice :
`scriptsQuiNommentLeDossier()`, qui sépare « 1 script le nomme : `le-coordinateur.mjs` » (piste
sérieuse d'un registre d'outil) de « aucun script ne le nomme » (piste sérieuse d'un dossier de
documents).

**Sa limite est imprimée avec lui, jamais tue** : *nommer n'est pas écrire dedans*. C'est une borne
HAUTE — la même nuance que data-archangel imprime déjà sur sa propre mesure. La preuve d'écriture
demanderait d'instrumenter l'exécution, pour un gain nul : ce qu'on cherche n'est pas un verdict,
c'est de quoi trancher à la main en connaissance de cause.

**Deux exclusions de l'indice, chacune avec sa raison** : `check-house.mjs` nomme à peu près tout le
dépôt (le compter ferait dire « nommé » de n'importe quoi), et `doc-report.mjs` se citerait dans sa
propre mesure — **le bug auto-référentiel que ce dépôt a déjà payé cinq fois**.

**Les deux comptes sont imprimés ensemble**, jamais la seule moitié dérivée : n'afficher que les 13
tranchées laisserait croire le travail fini alors que 10 décisions attendent encore une main.
