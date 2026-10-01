# Les deux façons de livrer l'Agence par ZIP — laquelle tient aujourd'hui

> **Ta question, mot pour mot** : *« que penses-tu de ce fonctionnement ? à toi de me dire les
> limites, en te référant aux docs sur le sujet qu'on a enregistrés »*.
> **Tes deux scénarios** : ① un ZIP de l'Agence seule, plus un fichier « PROMPT À LIRE EN PREMIER »
> et une doc pour l'utilisateur · ② un ZIP de l'Agence **et** un ZIP du code, l'IA cible faisant
> elle-même le branchement.
> **Tâche #1341.** Tout ce qui suit est **mesuré** et se rejoue à la commande — aucune opinion sur
> ce qui tient ou pas.

---

## LA RÉPONSE EN UNE PHRASE

**Le scénario ① tient aujourd'hui. Le scénario ② ne tient pas — et c'est pourtant celui dont tu
auras besoin pour vendre.**

---

## CE QUI EST MESURÉ, ET CE QUE CHAQUE CHIFFRE DÉCIDE

| Mesure d'aujourd'hui | Le chiffre | Ce que ça décide |
|---|---|---|
| chaque outil emporte ses cinq pièces | **100 %** (85/85) | le ZIP est **complet** : rien ne manque à la lecture |
| l'Agence emporte son propre kit | **100 %** (7/7) | le destinataire reçoit aussi **le plan de la machine**, pas seulement les pièces |
| un outil peut recevoir d'autres cibles | **100 %** (0 cible écrite en dur sur 88) | les outils **acceptent** un autre projet |
| ce qu'il faut chez l'hôte | **94 %** | 5 outils seulement sont liés à un fournisseur précis, tous nommés |
| installée pour de vrai ailleurs | **100 %** (68/68 debout) | ⚠️ **PÉRIMÉ** — 53 fichiers ont changé depuis le 28/09 |
| le matériel de reprise pour une AUTRE IA | **67 %** | **20 lignes de nos documents normatifs EXIGENT notre outillage** (1 dans la charte, 19 dans les règles de travail) |
| un point de branchement pour une source extérieure | **AUCUN** (#1331) | ⛔ **c'est ce qui bloque le scénario ②** |

---

## SCÉNARIO ① — le ZIP de l'Agence seule : IL TIENT

**Pourquoi il tient** : les quatre premières mesures sont à 100 %. Le destinataire reçoit un
ensemble complet, avec le plan de la machine, et aucun outil ne refuse un autre projet.

**CE QUI LUI MANQUE VRAIMENT, et ce n'est pas le code** :

1. **Le fichier « PROMPT À LIRE EN PREMIER » n'existe pas.** `docs/agence-installation.md` dit
   comment installer ; il ne dit pas à une IA **quoi faire en arrivant**. Ce sont deux documents
   différents, et c'est le second qui décide si la livraison sert.
2. **19 lignes des règles de travail supposent notre outillage.** Un successeur qui n'a pas nos
   crochets git, nos fenêtres de questions ou notre gestionnaire de tâches lira des consignes
   qu'il ne peut pas appliquer. **C'est le vrai coût du scénario ①**, et il est chiffré :
   20 lignes à reformuler, pas davantage.
3. **Le banc témoin est périmé.** Il dit « 68 outils sur 68 tiennent debout ailleurs », mesuré le
   28 septembre, et **53 fichiers ont changé depuis**. Ce chiffre décrit une Agence antérieure.
   **Il faut le rejouer avant toute livraison réelle** — c'est gratuit.

**Ce que ça donne, concrètement** : le scénario ① est à **trois gestes** d'être livrable, et aucun
des trois n'est un chantier.

---

## SCÉNARIO ② — les deux ZIP, l'IA cible branche : IL NE TIENT PAS

**La mesure qui tranche, et elle est sans appel** : **aucun point de branchement n'existe**
(#1331). Il n'y a, nulle part dans l'Agence, un endroit prévu pour dire « voici le projet que tu
dois surveiller ». Les outils acceptent une autre cible — c'est le 100 % de reconfigurabilité —
mais **rien ne les y branche** : il faudrait que l'IA cible comprenne 85 scripts et déduise
elle-même où pointer.

**Pourquoi « l'IA cible le fera » n'est pas une réponse** : elle le ferait **différemment à chaque
fois**, sans que rien ne vérifie le résultat. Et le jour où ça ne marche pas, personne — ni elle,
ni toi, ni nous — ne saura dire si c'est l'Agence qui est en cause ou son branchement.

**ET C'EST LE SCÉNARIO DONT TU AURAS BESOIN**, ce qui rend le constat important plutôt que
théorique. Le scénario ② est exactement le **cas 2** de la stratégie globale
(`docs/strategies/strategie-globale-du-projet-entier.md`) : chez un acheteur, **il n'y a qu'UN
projet**, et l'Agence s'y pose comme une aide exécutive. **Le scénario qui tient aujourd'hui est
celui de l'usage interne ; celui qui ne tient pas est celui de la vente.**

---

## CE QUE JE PROPOSE, ET CE QUE JE NE TRANCHE PAS

**Ce qui est clair et ne demande pas d'arbitrage** : les trois gestes du scénario ① sont à faire
dans tous les cas. Ils servent aussi au scénario ②, aucun n'est perdu.

**Ce qui demande ta décision — et elle est structurante** : un « point de branchement », ça veut
dire **un seul endroit** qui déclare ce que l'Agence surveille (les dossiers du projet cible, son
langage, son filet de tests). Tous les outils le liraient au lieu de le supposer.
**C'est petit à construire et ça change tout à la livraison** — mais c'est une décision
d'architecture, pas une réparation, et elle appartient à la refonte dont tu es en train de décider
la voie.

---

## Les questions

**QZ1 — Les trois gestes du scénario ①** (écrire le PROMPT À LIRE EN PREMIER · reformuler les
20 lignes qui exigent notre outillage · rejouer le banc témoin) : **on les fait maintenant**, ou
on attend la décision de refonte ? *Mon avis : maintenant — ils servent dans les deux voies et le
banc témoin est gratuit.*

**QZ2 — Le point de branchement** : il entre dans le **noyau** de la refonte (voie B de la
proposition), ou c'est un chantier séparé à mener avant ?

**QZ3 — Le « PROMPT À LIRE EN PREMIER », il s'adresse à qui exactement ?** À une IA qui reçoit le
ZIP · à l'humain qui l'achète · aux deux dans un seul fichier. *Ça change tout son contenu, et je
ne veux pas l'écrire avant de le savoir.*

---

## Plan d'action

| État | Constat | Ce qui en découle |
|---|---|---|
| **RETENU** | le scénario ① tient, à trois gestes près — tous les trois chiffrés | tâche **#1341** ; les gestes attendent QZ1 |
| **RETENU** | le banc témoin est périmé de 53 fichiers | à rejouer avant toute livraison réelle — **gratuit**, rattaché à **#902** |
| **RETENU** | 20 lignes de nos documents normatifs exigent notre outillage | rattaché à **#1320** (étiqueter ce qui part et ce qui reste) |
| **À TRANCHER** | le scénario ② est bloqué par l'absence de point de branchement | **ta décision** (QZ2) — c'est de l'architecture, pas une réparation |
| **ÉCARTÉ** | écrire le PROMPT À LIRE EN PREMIER cette nuit | **raison écrite** : son destinataire n'est pas tranché (QZ3), et le même fichier écrit pour une IA ou pour un acheteur n'a rien en commun. L'écrire avant de savoir, c'est l'écrire deux fois. |
