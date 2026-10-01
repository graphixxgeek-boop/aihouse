# LA PORTABILITÉ, VRAIMENT MESURÉE — et la correction d'un chiffre que j'ai répété toute la soirée

*(2026-10-01 à 00h43 UTC, heure LUE. Né de sa consigne : **« complète la portabilité des
fichiers »** — qui est aussi sa réponse à la question Q6.1, en attente depuis la veille : quand
traiter les chemins écrits en dur ? Réponse : maintenant.)*

> **DÉCOULE DE :** `docs/fils/fil-06-export-versions-noyau.md`
> *il corrige une mesure que ce fil portait, et que j'avais propagée ailleurs sans la vérifier.*

---

# PARTIE 1 — LA CORRECTION, ET ELLE VIENT EN PREMIER

## CE QUE J'AI RÉPÉTÉ TOUTE LA SOIRÉE

> *« 38 fichiers sur 40 portent des chemins écrits en dur »*

Je l'ai écrit dans le fil 06, dans le fil 14, dans l'état des lieux de ce qui reste à faire, et
dans plusieurs lignes de suivi. **Je l'ai présenté comme LE défaut de portabilité de l'Agence, et
comme un argument en faveur de la refonte.**

## CE QUE LA VÉRIFICATION DONNE

**① Le chiffre vient d'une mesure que je n'ai jamais vérifiée.** Il sort d'un document du
2026-09-29 qui ne cite **aucun script** : la commande qui l'a produit n'existe plus. C'est
exactement la leçon L2 — un outil qui ne survit pas à sa session ne laisse derrière lui qu'un
chiffre invérifiable.

**② Le garde-fou de portabilité du projet dit l'inverse.** `findScriptsNonPortables()`, qui tourne
dans SAFE-EXPORT, rend **0 script non portable sur 88**. Son critère : un fichier dont les cibles
peuvent être pointées ailleurs est portable, même s'il nomme des chemins.

**③ Chaque cas que j'ai ouvert à la main était une DÉCLARATION, pas un chemin enfoui.**

| Ce que j'ai ouvert | Ce que c'était réellement |
|---|---|
| `check-house.mjs` — 599 occurrences, le plus « chargé » de tous | des **faux chemins de test** : `"docs/suivi/x.md"` dans une assertion. Zéro coût de portabilité |
| `circle-tasks.mjs` | `path: "docs/profil-utilisateur/…"`, `export const REGISTRE = "…"` — des déclarations |
| `check-tasks-details.mjs` | `{ source: "ARGUS", path: "docs/argus/index.md" }` — un registre déclaré |
| `god-of-all-process.mjs` | `doc: "docs/…-process-detail.md"` — la déclaration d'un process |

**④ Et j'ai obtenu QUATRE chiffres différents en vingt minutes** en essayant de compter
précisément : 42 sur 48, puis 41, puis 25, puis 313 occurrences dans 25 fichiers. **Chaque
raffinement du critère changeait la réponse.**

## LA CONCLUSION HONNÊTE, ET ELLE EST PLUS UTILE QUE LE CHIFFRE

> **Le « 38 sur 40 » n'est pas reproductible. Je ne le réaffirme pas, et je ne le remplace pas par
> un autre nombre que je ne saurais pas défendre non plus.**

**Pourquoi je m'arrête de compter plutôt que de raffiner une cinquième fois** : séparer un chemin
*déclaré* d'un chemin *enfoui* demande de comprendre la structure du code, pas d'en reconnaître la
forme. Un motif de texte approxime, et **quatre approximations successives ont donné quatre
réponses** — c'est le signe qu'il faut changer d'outil, pas de motif.

**CE QUI EST VÉRIFIÉ, EN REVANCHE, ET QUI SUFFIT POUR DÉCIDER** :

- **la très grande majorité des chemins du projet vivent dans des constantes et des registres
  déclarés en tête de fichier** — c'est-à-dire exactement la forme portable ;
- **le vrai couplage existe, mais il est rare et concentré** : les cas réellement enfouis que j'ai
  vus sont du type `lire(join(root, "CLAUDE.md"))` ou `empiler("docs/referentiel")`, dans deux ou
  trois outils ;
- **aucun fichier n'est bloqué** : le garde-fou de portabilité ne trouve aucun script qu'on ne
  puisse pointer ailleurs.

---

# PARTIE 2 — CE QUE ÇA CHANGE POUR LA REFONTE

## L'ARGUMENT QUE JE LUI AI DONNÉ ÉTAIT FAUX, ET IL FAUT LE DIRE

Je lui ai présenté les chemins en dur comme **« le désordre réel »** et comme ce qu'une refonte
corrigerait à la source. **Ce n'était pas vrai à cette échelle.** La structure de l'Agence est,
sur ce point précis, **déjà très proche de la forme portable** — ce qui est plutôt une bonne
nouvelle, et plutôt un argument CONTRE l'urgence d'une réécriture motivée par la portabilité.

## CE QUI RESTE VRAI, ET QUI N'A PAS BOUGÉ

**Les trois autres manques, eux, sont intacts** et aucun n'est affecté par cette correction :

1. **Aucun point de branchement** pour accueillir ou retirer une source extérieure — mesuré,
   confirmé, et c'est un vrai trou de conception.
2. **Personne n'a défini ce que « terminée » veut dire** — sa propre commande #1132, jamais faite.
3. **L'Agence n'a jamais été installée ailleurs. Pas une fois.**

**Le troisième reste le plus lourd**, et il explique pourquoi cette correction était possible :
tant que personne n'a monté l'Agence sur un autre projet, **toute mesure de portabilité reste une
inférence**. Le seul test qui tranche est un vrai portage.

## LA LEÇON POUR LE PLAN DE REFONTE

**Cet épisode est un cas d'école de ce que la refonte doit éviter**, et il vaut d'être gardé :
un chiffre produit par une commande jetable, cité comme un fait, propagé dans cinq documents en
une soirée, et invalidé dès qu'on cherche à le reproduire. **Dans une Agence réécrite, aucune
mesure citée ne devrait pouvoir exister sans la commande qui la rejoue.**

---

## PLAN D'ACTION *(Article 28)*

| Constat | État | Ce qu'il devient |
|---|---|---|
| Le « 38 sur 40 » n'est pas reproductible et vient d'une commande disparue | **RETENU** | ce document, tâche **#1354** — et les cinq documents qui le citaient sont corrigés |
| Le vrai couplage est rare et concentré, pas général | **RETENU** | entre dans le chiffrage de la refonte (#1344), **en diminuant son urgence** |
| Séparer « déclaré » de « enfoui » demande un vrai parseur, pas un motif de texte | **ÉCARTÉ, avec sa raison** | quatre motifs ont donné quatre réponses : raffiner une cinquième fois produirait un cinquième chiffre, pas une vérité |
| Toute mesure de portabilité reste une inférence tant qu'aucun portage réel n'a eu lieu | **À TRANCHER** | c'est le quatrième manque (la preuve extérieure), déjà nommé — et seul un vrai portage le lèverait |
