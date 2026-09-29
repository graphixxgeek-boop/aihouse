# Le manifeste de l'Agence — ce qu'elle EST, déclaré positivement

*(Écrit le 2026-09-29 à 20h20 UTC, heure LUE. Né d'une mesure de la soirée : l'Agence n'avait
**aucune existence technique**. Sa décision, en fenêtre dédiée : lui en donner une.)*

> **DÉCOULE DE :** `docs/loi-de-l-agence.md`
> *on ne peut pas faire servir « la finalité de celui qui l'emploie » à quelque chose dont personne
> ne sait où ça commence et où ça s'arrête.*

---

## LE TROU QUE CE DOCUMENT FERME, ET IL EST PLUS GRAND QU'IL N'EN A L'AIR

**Mesuré le 2026-09-29** : l'Agence n'avait pas de dossier à elle (elle vit dans `scripts/`, mêlée
au reste), pas de manifeste, pas de point d'entrée. Le mot « Agence » apparaissait dans **17
fichiers sur 87**, uniquement en prose de commentaire, et la seule constante portant son nom était
un chemin vers une page HTML.

**Et surtout : elle n'était définie QUE PAR SOUSTRACTION.** `SAFE-EXPORT` savait dire ce qui *ne
part pas* (`NE_PART_PAS_ET_C_EST_NORMAL`, `EXEMPTES_DU_KIT`) ; **rien ne disait ce qu'elle EST**.

> **La conséquence concrète, et c'est elle qui compte : déposer un fichier dans `scripts/`
> l'enrôlait dans l'Agence sans que personne ne le décide.**

On ne peut ni ranger, ni alléger, ni exporter ce qui n'a pas de bord.

---

## LES TROIS ZONES, DÉRIVÉES ET NON INVENTÉES

**Elles existaient déjà sans être nommées.** Ce manifeste ne crée pas un découpage : il LIT celui
que `SAFE-EXPORT` applique depuis des semaines, et lui donne enfin un nom.

*(Mesuré le 2026-09-29 : **93 fichiers** dans `scripts/`.)*

### ⚙️ ZONE 1 — LE NOYAU DE L'AGENCE — **74 fichiers**

**Ce que c'est** : l'outillage proprement dit. Il ne parle pas du jeu, il ne dépend pas de ce
dépôt-ci, et il part **en entier** le jour de l'export.

**La règle qui y range un fichier** : tout ce qui n'appartient ni à la zone 2 ni à la zone 3. C'est
un reste, et c'est voulu — un fichier neuf est **dans l'Agence par défaut**, et doit se justifier
pour en sortir. L'inverse laisserait des orphelins invisibles.

### 🎭 ZONE 2 — LES OUTILS DU PRODUIT — **9 fichiers**

**Ce que c'est** : des outils dont **le SUJET est le jeu**. Ils ne partent jamais : chez un client,
ils n'auraient rien à regarder.

`check-house` · `check-profile` · `check-spirit` · `run-simulation` · `simulation-visiteur` ·
`sites-env` *(×2)* · `summarize-simulation-log` · `the-ghost`

**La règle** : `NE_PART_PAS_ET_C_EST_NORMAL` dans `safe-export.mjs`, **avec la raison écrite pour
chacun**. Liste volontairement manuelle : « le sujet de cet outil est-il le jeu ? » est un jugement,
aucun signal mécanique ne le rend. Sa nature manuelle est déclarée, comme l'Article 24 l'exige.

### 🔌 ZONE 3 — LE CÂBLAGE À CE DÉPÔT-CI — **10 fichiers**

**Ce que c'est** : ce qui attache l'Agence à *cette machine* et à *ce dépôt*. Ça ne part pas non
plus, mais pour une raison différente : ça se **réinstalle** ailleurs plutôt que de voyager.

Les crochets git *(5)* · les installeurs d'environnement *(4)* · le lanceur du produit *(1)*

**La règle** : `EXEMPTES_DU_KIT` dans `safe-export.mjs`, avec sa raison.

---

## CE QU'IL EST INTERDIT DE METTRE DANS L'AGENCE

*(Sans cette section, le manifeste serait une photo. Avec elle, il devient une règle.)*

**1. Rien qui ne soit vrai que pour la Maison IA vivante.** C'est le test direct de la loi de
l'Agence. Un outil qui nomme Lia, Noé, une pièce de la maison ou une jauge du jeu appartient à la
zone 2 — **et s'il prétend être du noyau, c'est le noyau qui est en faute, pas lui**.

**2. Rien qui ne puisse être retiré.** Il faudra plusieurs versions de l'Agence selon la taille du
projet client. Une pièce qu'on ne peut pas enlever est une pièce qui empêchera la version allégée
d'exister — donc chaque ajout au noyau se conçoit **détachable**.

**3. Rien qui impose une finalité au client.** Un modèle de charte, un objectif, une valeur par
défaut : l'Agence propose des STRUCTURES vides, jamais des CONTENUS de valeurs. La frontière est
fine et elle est la plus facile à franchir sans le vouloir.

**4. Rien d'auto-déclaré sans le dire.** Quand un mécanisme est impossible, l'écrire noir sur blanc
EST la protection (Article 27). Un outil qui prétend mesurer ce qu'il ne peut qu'affirmer n'a pas sa
place ici.

---

## CE QUE CE MANIFESTE N'EST PAS, ET NE SERA PAS CE SOIR

**Ce n'est pas un rangement.** Aucun fichier n'est déplacé, aucun dossier créé. Le découpage de
`scripts/` en zones physiques est placé à **l'étape ④** du plan, et pour une raison qu'il a
lui-même donnée : *« pas la peine de perdre du temps à faire puis défaire »*. **Ranger avant
d'avoir rationalisé, c'est ranger des choses qui vont disparaître.**

**Ce n'est pas non plus un point d'entrée technique.** Un `index.mjs` qui exposerait l'Agence comme
un module unique est une bonne idée — et elle attend de savoir ce que le noyau contiendra après la
rationalisation.

**Ce qui est fait ce soir est la DÉCLARATION**, parce qu'une déclaration ne se défait pas : elle se
cite, et elle survivra au bouleversement.

---

## SON GARDE-FOU

`findFichiersHorsZone()` (`scripts/safe-export.mjs`) vérifie que **chaque fichier réel de
`scripts/` tombe dans exactement une zone**, et que chaque fichier nommé par une zone existe
encore. Les deux sens, jamais un seul.

**Pourquoi il est nécessaire malgré la règle du « reste »** : la zone 1 attrape tout, donc rien ne
peut jamais être « hors zone » par accident. Ce que le garde-fou attrape est **l'autre sens** — une
zone qui réclame un fichier disparu, ce qui arrive à chaque renommage. Et il rend le découpage
**visible** : le jour où la zone 2 passe de 9 à 15 outils, quelqu'un le saura.
