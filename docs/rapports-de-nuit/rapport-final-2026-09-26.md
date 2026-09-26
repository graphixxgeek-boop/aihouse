# LA NUIT DU 2026-09-26 — RAPPORT FINAL

*(Écrit le 2026-09-26 à 08h29 UTC — heure LUE via AGENT-DU-TEMPS, source système. Tâche #932.)*

---

## POUR LIRE CE DOCUMENT EN TRENTE SECONDES

**Le contexte** : tu m'as laissée travailler seule pour la nuit, avec un gros prompt de 31 points
répartis en 6 chantiers, dans TON ordre.

**Ta demande** : « ok lance tout, maintenant tu dois te relancer après chaque commit en auto […]
la fin du process est fixée au moment où tu auras traité TOUTES les tâches, sauf bien sûr celles
qui sont bloquantes […] mets toi en mode ne plus t'arrêter, enchaîne sans t'arrêter, toute la nuit »

**Les étiquettes** : tâches #903 à #932 ouvertes cette nuit, plus les 31 points du plan
`docs/rapports-de-nuit/plan-nuit-2026-09-26-v2.md`.

**Le résultat en une ligne** : **les 31 points sont faits**, 22 commits poussés, aucun interdit
franchi.

---

## 1. CE QUI A ÉTÉ FAIT, CHANTIER PAR CHANTIER

| Chantier | Points | État |
|---|---|---|
| 1 — PRÉ-CHANTIER et STRATÉGIE DE CHANTIER | 1-6 | ✅ le 8e process déclaré, écrit sur disque, câblé chez god-of-all-process |
| 2 — Les 4 vraies stratégies converties | 7-11 | ✅ + une fiche LÉGÈRE (2 sections au lieu de 7) qui ne perd jamais un mot en promotion |
| 3 — Gestion des tâches | 12-14 | ✅ trois courbes séparées, un FILTRE avant création, une clôture refusable |
| 4 — Export, exportabilité, agence light | 15-21 | ✅ échelle de vitalité à 4 niveaux, 19 bloquants nommés, ×8,8 en sept jours mesuré |
| 5 — Les points isolés | 22-27 | ✅ dont check-profile dégelé, les leçons pondérées, le réveil à deux étages |
| 6 — Data et Ronde | 28-31 | ✅ inventaire des 282 rapports, Ronde, confrontation, vérification finale |

**22 commits** · **72 fichiers** · **6 018 lignes ajoutées, 64 retirées** · `check-house.mjs` au
vert à chaque commit, sans exception.

---

## 2. LES SEPT CHOSES QUI COMPTENT VRAIMENT

Le reste est dans les tâches. Ces sept-là changent quelque chose pour toi.

### a) 19 fichiers VITAUX n'ont aucun blueprint — l'Agence ne partirait pas entière

Les deux crochets git, `lib-shell`, `lib-json`, `report-template`, `tool-usage`, `criticite`,
`html-report`, la suite de tests. **On a documenté les vedettes et pas la plomberie.** Le jour de
l'export, les vedettes partent et rien ne les fait tourner. (#907, document
`docs/peur-de-l-export.md`.)

### b) Le dépôt a été multiplié par 8,8 en sept jours — mais l'hébergement reste à 0 €

2,2 → 19 Mo, soit 2,4 Mo/jour, projection 91 Mo à un mois, 898 Mo à un an. **Ce qui coûte n'est
pas l'hébergement** (0 € sous 100 000 requêtes/jour, 5 $/mois au premier palier payant, bande
passante sortante gratuite) : c'est la reprise. Un dépôt d'un giga-octet ne se clone plus
confortablement. (#906.)

### c) 93 % des rapports txt ne sont nommés nulle part

282 rapports, 3,7 Mo, **263 que ni un script, ni un index, ni une ligne de suivi ne mentionne**.
Et la première mesure disait l'inverse — « 38 dossiers sur 40 sont relus » — parce qu'elle comptait
par DOSSIER : il suffit qu'un script cite le dossier pour que ses 47 fichiers passent pour lus.
**Une borne haute qui ne discrimine pas n'est pas une mesure.** (#921.)

### d) ZÉRO des 97 tâches de départ n'a été fermée cette nuit

Le chiffre est exact et je ne le contourne pas. La nuit a exécuté tes 31 points, qui sont des
demandes NEUVES — 20 tâches en sont nées, 13 ont été fermées dans la foulée. **La file de référence
n'a pas bougé d'un millimètre**, et c'est exactement le « tapis roulant » que tu redoutes. (#924.)

### e) Et la mesure de ce tapis roulant a un angle mort

« NÉES depuis : 7 » ne compte que les nouvelles tâches ENCORE OUVERTES. Les 13 nées et fermées la
même nuit sont invisibles aux deux colonnes. **Une nuit qui ouvre 20 tâches et en ferme 13 s'affiche
exactement comme une nuit qui en aurait ouvert 7 et n'aurait rien fait** — c'est précisément la
distinction que tu avais demandée, et le rapport ne la porte pas encore. (#930.)

### f) Quatre outils comptaient leur propre silence pour de l'inactivité

`check-spirit`, `messages-courts`, `ou-on-en-est`, `check-profil-utilisateur` avaient une ligne de
commande et n'enregistraient jamais leur passage. **Corrigé cette nuit.** Et dessous il y avait
pire : `check-spirit.mjs` porte DEUX identités à six lignes d'écart, si bien qu'un passage compté
sous l'une laisse l'autre à zéro — sur l'outil qui veille l'Article 0, dont la conclusion naturelle
d'un zéro est « relance-le », ce qui coûte 16 appels Gemini. (#923, #929.)

### g) La plus grosse alerte de CLONE-HUNTER était impossible à traiter

« Fondre les 2 blocs » — sauf que les deux blocs sont un `import` et l'`export` qui réexporte les
mêmes noms. **Un faux positif ordinaire se traite une fois ; celui-là ne se traite jamais**, donc il
revenait à chaque commit, en tête du rapport, devant quatre vraies duplications. Corrigé, avec
quatre contre-tests — dont un né d'un vrai échec du test, où mon propre filtre aurait supprimé de
vraies duplications en silence. (#931, leçon **L30**.)

---

## 3. CE QUI T'ATTEND, ET RIEN N'A ÉTÉ TRANCHÉ À TA PLACE

**Neuf décisions** sont posées et documentées, aucune prise :

| # | La décision | Pourquoi elle est à toi |
|---|---|---|
| #917 | la couche lourde promise à ARGUS/HARMONIA que le catalogue ne porte pas | deux des trois lectures touchent la charte |
| #922 | politique de rétention : garder N derniers, compacter, ou externaliser ? | ça touche à ce qu'on garde comme PREUVE |
| #928 | 4 leçons jamais remontées : poids mort, ou angle mort du sélecteur ? | retirer une leçon est irréversible en pratique |
| #929 | `check-spirit` / `check-spirit-mjs` : un script, deux identités | c'est un renommage |
| — | le registre des baptêmes : le créer, ou décider qu'il n'en faut pas | 80 noms en service, 0 validé |
| — | le renommage des rangs (#200) | tu choisis toujours les noms |
| — | et les 5 autres A-TRANCHER déjà ouvertes | inchangées |

**Six tâches de travail** sont ouvertes et prêtes : #925 (CLONE-HUNTER immobile), #926 (24 décisions
HTML/texte — à DÉRIVER, pas à recopier), #927 (26 données sans lecteur), #930 (l'angle mort de la
confrontation), #907 et #908 (l'export).

---

## 4. LES BORNES, TENUES

| L'interdit | Tenu ? |
|---|---|
| aucun renommage en masse **exécuté** | ✅ — #929 ouverte, jamais faite |
| rien sur la refonte graphique | ✅ |
| rien qui change ce que Lia et Noé DISENT | ✅ — aucun fichier de `lib/` touché |
| rien qui change ce que le visiteur VOIT | ✅ — aucun fichier de `app/` ni `components/` touché |
| aucun nom définitif choisi par moi | ✅ |
| CLAUDE.md intouchable | ✅ |
| suivi historique intouchable | ✅ — uniquement des lignes nouvelles, jamais une ligne close retouchée |
| aucun appel API | ✅ — zéro, la simulation était écartée |

---

## 5. CE QUE JE N'AI PAS FAIT, ET POURQUOI

- **Les 24 décisions HTML/texte** : 24 jugements de format en série, à ta place, au petit matin.
  Et surtout la bonne réponse n'est probablement pas de les trancher mais de les **dériver** (#926).
- **Donner une mémoire à CLONE-HUNTER** : c'est une vraie construction, pas un geste de Ronde (#925).
- **Les 13 branchements suggérés par data-archangel** : brancher un outil sur une source de plus est
  un choix de conception. Une machine qui le déciderait fabriquerait du travail que personne n'a
  voulu.
- **Les 14 points fragiles** : ce sont des décisions de conception EN ATTENTE, jamais des bugs.

---

## PLAN D'ACTION

| État | Constat | Ce que ça devient |
|---|---|---|
| **RETENU** | les 31 points du plan de nuit | **faits** — 22 commits poussés, check-house vert à chaque fois |
| **RETENU** | six chantiers ouverts par les mesures de la nuit | #925, #926, #927, #930 + #907, #908 déjà ouvertes |
| **À TRANCHER** | neuf décisions posées et documentées | listées en section 3 — aucune prise à ta place |
| **ÉCARTÉ** | la simulation Article 18 | tu l'as écartée toi-même pour cette nuit |
| **ÉCARTÉ** | les 14 points fragiles, les 13 branchements suggérés | décisions de conception, jamais des bugs — voir section 5 |
