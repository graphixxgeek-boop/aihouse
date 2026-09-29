# Synthèse annotée — ARCHITECTURE FONCTIONNELLE DU PROJET

> **SOURCE INTACTE :** `docs/grand-projet/00-sources/02-documents-prepares/texte/ARCHITECTURE_FONCTIONNELLE_DU_PROJET.md`
> *(1 123 mots, 315 lignes · le `.csv` du schéma est à côté · **jamais recopié ici**.)*

*(Écrite le 2026-09-29 au soir. C'est le prolongement opérationnel d'`ARCHITECTURE DES NIVEAUX` :
là où celui-ci disait QUI est qui, celui-ci dit COMMENT ils se parlent.)*

---

## ▸ IDÉE 1 — Les cinq niveaux opérationnels, et leur règle de séparation · **lignes 10 à 60**

**a. Ce que ça dit** — `P0 PROJET → P1 JEU / P2 AGENCE → P3 INSTANCE CLIENT → P4 EXÉCUTION`. Pour
chacun : sa finalité, ses entrées, ses fonctions internes, ses sorties, **son décideur**, sa boucle
de retour et **sa règle de séparation avec les autres**.

**b. Ce que ça nous apporte** — la colonne « décideur » et la colonne « règle de séparation » sont
ce qui manque partout ailleurs : elles disent **qui tranche** et **où s'arrête chacun**.

**c. Quand j'en aurai besoin** — **quand une décision traînera sans qu'on sache à qui elle
appartient.** La table donne le décideur par niveau.

**d. ACCORD, et un cinquième niveau qu'on n'avait pas** — l'EXÉCUTION (P4) est distincte de
l'instance client. Chez nous elle existe déjà sans nom : c'est le moment où une tâche est réalisée
et prouvée.

**e. À FAIRE** — reprendre la colonne « décideur » quand on écrira la gouvernance.

**f. Ancre** — `texte/ARCHITECTURE_FONCTIONNELLE_DU_PROJET.md:10`

---

## ▸ IDÉE 2 — La matrice exploitable, avec ses quatre statuts · **lignes 61 à 118**

**a. Ce que ça dit** — chaque composant porte : identifiant, niveau, domaine, **statut recommandé**,
propriétaire, **qui a le droit de le modifier**, mode de modification, validation requise, héritage,
justification, livrable. Quatre statuts : **FIXE · CONFIGURABLE · PERSONNALISABLE · FIXE RÉVISABLE**.

**b. Ce que ça nous apporte** — **le quatrième statut est celui qui manquait à ma lecture
précédente.** « FIXE RÉVISABLE » — stable, mais modifiable par une décision formelle de gouvernance
— est exactement le statut de notre Article 0 : intouchable au quotidien, révisable par sa double
confirmation (Article 14).

**c. Quand j'en aurai besoin** — **à l'étape ④**, pour croiser ce second axe avec nos trois zones.

**d. NEUF, et plus fin que ce que j'avais retenu hier.** J'avais noté trois statuts ; il y en a
quatre, et le quatrième décrit un mécanisme que nous avons déjà construit sans le nommer.

**e. À FAIRE** — l'ajouter au manifeste à l'étape ④.

**f. Ancre** — `texte/ARCHITECTURE_FONCTIONNELLE_DU_PROJET.md:61`

---

## ▸ IDÉE 3 — Les contrats d'interface entre niveaux · **lignes 119 à 283**

**a. Ce que ça dit** — le plus gros bloc (165 lignes) : dix interfaces nommées
(`PROJET → JEU`, `JEU → AGENCE`, `AGENCE → CLIENT`, `CLIENT → AGENCE`…), chacune avec sa finalité,
son déclencheur, ce qui transite, le résultat attendu, les contrôles, les preuves et son KPI.

**b. Ce que ça nous apporte** — **deux interfaces qui décrivent précisément ce qui nous attend** :
`AGENCE → CLIENT` (présenter ce qui est fixe, configurable, personnalisable, **interdit**) et
`CLIENT → AGENCE` (injecter sa gouvernance métier dans les limites autorisées, avec **un rejet
motivé** quand la demande entre en conflit avec un invariant).

**c. Quand j'en aurai besoin** — **à la question G7** (« que fait l'Agence si la charte du client
contredit une de ses règles ? »). Sa réponse est le **rejet motivé** — exactement ce que je
recommandais, et le document me donne le mot.

**d. ACCORD sur les deux interfaces qui nous concernent. RÉSERVE sur les huit autres** : elles
supposent une organisation avec des rôles séparés (un responsable Jeu, un éditeur, un client
distinct). **Chez nous ces rôles sont tous la même personne**, et formaliser dix contrats entre
soi-même et soi-même serait de la cérémonie. Les garder comme VOCABULAIRE, pas comme process.

**e. À TRANCHER** — combien d'interfaces on instancie vraiment. **Ma recommandation : deux**, celles
qui touchent le client.

**f. Ancre** — `texte/ARCHITECTURE_FONCTIONNELLE_DU_PROJET.md:119`

---

## ▸ IDÉE 4 — La traçabilité des tâches, et le principe final · **lignes 284 à 315**

**a. Ce que ça dit** — un modèle prêt à remplir reliant chaque tâche à toute la cascade, avec un
contrôle automatique qui rend **COHÉRENT** ou **INCOMPLET**. Et le principe final :
*« Le Projet possède la gouvernance de conception. Le Jeu possède la gouvernance de
l'expérimentation. L'Agence possède la constitution et les mécanismes du produit. Le Client possède
la gouvernance de ses finalités métier. »*

**b. Ce que ça nous apporte** — la phrase de synthèse la plus compacte des six documents, et un
contrôle binaire plutôt qu'un jugement.

**c. Quand j'en aurai besoin** — **si on adopte le rattachement des tâches** : le statut
COHÉRENT/INCOMPLET est ce qui le rend mesurable au lieu de déclaratif.

**d. ACCORD sur le principe. ET UNE NUANCE QUI COMPTE POUR NOUS** : *« le Jeu possède la gouvernance
de l'expérimentation »* est plus juste que le « bac à sable » de l'autre document — ici le Jeu
POSSÈDE quelque chose, il n'est pas seulement un instrument. **C'est plus proche de notre décision
du soir** (le Jeu est le premier client, avec sa propre finalité).

**e. À TRANCHER** — le rattachement des tâches, avec la réserve déjà écrite sur le rétroactif.

**f. Ancre** — `texte/ARCHITECTURE_FONCTIONNELLE_DU_PROJET.md:284`

---

## CE QUE CETTE SYNTHÈSE CORRIGE DE MA PROPRE LECTURE

**J'avais retenu trois statuts hier soir ; il y en a quatre.** Le manquant — **FIXE RÉVISABLE** —
décrit exactement notre Article 0 : intouchable au quotidien, révisable par double confirmation.
**Je l'avais lu et je ne l'avais pas vu**, parce que je lisais pour comprendre le modèle, pas pour
le confronter au nôtre. C'est la question (d) qui l'a fait ressortir à la seconde lecture.

**Et le document donne le mot qui manquait à ma recommandation sur G7** : « rejet motivé ». Je
proposais « elle signale le conflit et laisse le client trancher » ; sa formulation est plus nette
et déjà outillée par une interface.

**La réserve principale reste la même que pour les autres** : dix contrats d'interface supposent dix
rôles distincts. Chez nous il y a une personne et une IA. **Ce qui voyage est le vocabulaire, pas la
cérémonie.**
