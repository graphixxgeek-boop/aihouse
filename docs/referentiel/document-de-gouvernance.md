# La Vision Globale — forme arrêtée et régime d'intangibilité

**À LIRE** : avant toute intervention touchant `docs/philosophie-et-politique.md`, et avant toute
production d'une édition nouvelle.

---

## CE QUE CETTE FICHE PORTE, ET POURQUOI ELLE EXISTE À PART

La Vision Globale porte lui-même son régime, en tête. Cette fiche-ci porte ce qui n'a pas
sa place dedans : **comment ce régime est tenu**, par quel mécanisme, et ce qu'aucun mécanisme ne
peut tenir. La distinction est celle que le document applique partout ailleurs — un texte énonce
la règle, une fiche dit qui la porte (art. 61).

**La règle d'origine, posée le 2026-10-02** : le document devient le document officiel du projet,
il remplace définitivement les éditions antérieures, et il ne peut être modifié qu'avec l'accord
du responsable du projet. Sa forme est arrêtée et ne varie plus d'une édition à l'autre.

---

## LA FORME ARRÊTÉE

L'ordre des parties est fixe :

| Rang | Partie |
|---|---|
| 1 | Le régime du document — statut, portée, abrogation, intangibilité, neutralité du support |
| 2 | Le préambule — méthode d'établissement, en deux paragraphes |
| 3 | **Titre préliminaire** — l'énoncé fondamental, puis **les trois objectifs ultimes**, puis leur concordance |
| 4 | **Titre I** — dispositions générales : architecture, niveaux, exportation, rang |
| 5 | **Titre II** — philosophie, en trois chapitres (général, Jeu, Agence) |
| 6 | **Titre III** — politique, en trois chapitres (mêmes niveaux, même ordre) |
| 7 | **Titre IV** — clauses intangibles |
| 8 | **Titre V** — établissement, forme et révision |
| 9 | Annexes |

**Trois exigences de forme, qui ne se négocient pas :**

1. **Les trois objectifs ultimes figurent au titre préliminaire**, immédiatement sous l'énoncé
   fondamental. Ils ne sont jamais reformulés : ils sont repris tels qu'arrêtés.
2. **Chaque chapitre de philosophie et le titre de politique s'ouvrent par une synthèse** de deux
   à trois lignes, suivie — lorsqu'elle est fondée — de la filiation philosophique ou politique
   correspondante. Une filiation n'est mentionnée que si elle éclaire le contenu ; jamais pour
   l'ornement.
3. **La numérotation des articles est continue**, sans trou ni doublon, sur l'ensemble du
   document.

---

## CE QUI EST TENU PAR UN MÉCANISME

**L'empreinte d'ossature** (`docs/the-king/empreinte-document-officiel.json`) enregistre les
titres du document et le nombre de ses articles. `comparerALEmpreinte()` détecte une modification
de l'ossature ; `verifierLOssature()` refuse une numérotation trouée ou dupliquée.

**La forme est vérifiée par sa STRUCTURE, jamais par son TEXTE**, et c'est délibéré : un document
dont on contrôlerait le texte mot à mot deviendrait un document qu'on ne pourrait plus corriger,
même avec accord. Ce qui est gardé est l'ossature — les titres dans leur ordre, et la continuité
de la numérotation. C'est exactement l'étendue de ce que l'article 70 déclare fixe.

**Poser une empreinte nouvelle** — `poserLEmpreinte()` — est un acte qui suit une édition
autorisée, jamais qui la précède. Reposer l'empreinte pour faire taire une alerte reviendrait à
supprimer le contrôle.

---

## CE QU'AUCUN MÉCANISME NE PEUT TENIR, ET LE DÉCLARER EST LA PROTECTION

**Qu'un accord ait été donné ne se vérifie pas.** Aucune empreinte, aucun test et aucun crochet
git ne distingue une modification autorisée d'une modification faite de sa propre initiative. Le
mécanisme ci-dessus garantit seulement qu'une modification ne passe pas **inaperçue** : il la rend
visible, donc assumable. C'est le maximum qu'une mécanique puisse apporter à une règle qui se joue
entre deux personnes, et c'est l'article 32 du document appliqué à lui-même.

**La neutralité du support ne se vérifie pas davantage.** Qu'aucun commentaire, aucune observation
et aucun élément de conversation ne figure dans le document relève de la rédaction, pas de la
structure. Un contrôle automatique chercherait des marqueurs de première personne et manquerait la
moitié des cas tout en accusant des tournures légitimes. **La règle est donc portée par cette
déclaration, et par elle seule** : toute remarque se formule hors du document.

---

## LES DEUX GABARITS, ET LES DEUX CAS DE FIGURE

Le document existe sous deux formes, selon ce qu'est l'outillage pour celui qui lit.

| Cas | L'outillage est… | Gabarit | Exemplaire |
|---|---|---|---|
| **1** | un projet de conception, mené en parallèle de l'œuvre | `docs/gabarits/philosophie-et-politique-gabarit.md` | le document en vigueur |
| **2** | un produit fini livré à un utilisateur — une aide exécutive | `docs/gabarits/philosophie-et-politique-gabarit-cas-2.md` | `docs/the-king/versions-cas-2/` |

**UN GABARIT EST VIERGE ET NEUTRE**, sans aucun élément propre à ce projet-ci : c'est la condition
pour qu'il serve ailleurs, et donc pour qu'il parte avec l'Agence.

**POURQUOI LE CAS 2 A AUSSI UN EXEMPLAIRE REMPLI, et ce n'est pas un doublon du gabarit** : le
patron dit ce qui doit figurer à chaque partie ; il ne montre pas le **changement de registre**.
Entre « nous croyons que » et « l'outillage s'engage à », la différence ne se décrit pas, elle se
lit. L'exemplaire est conservé comme historique de version du cas 2 et ne fait jamais loi.

**CE QUI CHANGE AU CAS 2, EN UNE LIGNE** : deux niveaux au lieu de trois, l'œuvre disparaît, la
philosophie énonce des **engagements** plutôt que des convictions, les clauses intangibles
deviennent des **garanties envers l'utilisateur**, et l'objectif du niveau supérieur porte la
clause de concours non retirable.

---

## RÉVISION — la procédure complète, en sept étapes

**LE DOCUMENT RENVOIE À CETTE PROCÉDURE, ET CE RENVOI EST INSCRIT DANS SON RÉGIME** : il ne peut
être modifié sans lecture préalable et respect intégral de ce qui suit. Une modification conduite
hors de cette procédure est irrégulière, quelle que soit la qualité de son contenu — et cette
irrégularité n'est pas théorique : elle produit une édition dont l'ossature ne correspond plus à
son empreinte, donc une alerte que personne ne saura interpréter.

| # | Étape | Qui |
|---|---|---|
| **1** | Accord exprès et préalable sur le PRINCIPE de la modification | le responsable de projet |
| **2** | Vérification du cas de figure applicable — 1 ou 2 — et lecture du gabarit correspondant | l'agent |
| **3** | Archivage intégral et sans altération de l'édition remplacée, dans `docs/the-king/archives/` | l'agent |
| **4** | Rédaction de l'édition nouvelle, dans la forme arrêtée, sans en réorganiser les parties | l'agent |
| **5** | Validation du contenu, article par article si nécessaire | le responsable de projet |
| **6** | Pose d'une empreinte nouvelle, APRÈS validation et jamais avant | l'agent |
| **7** | Mention de l'édition et de sa date dans le régime du document | l'agent |

**L'ÉTAPE 6 NE SE DÉPLACE JAMAIS.** Poser l'empreinte avant la validation reviendrait à enregistrer
comme référence un état que personne n'a approuvé, et à éteindre l'alerte qui aurait signalé
l'écart. Reposer une empreinte pour faire taire un signalement est la seule manière de supprimer
ce contrôle sans le retirer.

---

## INVENTAIRE COMPLET DU PROCESSUS

*Tout ce qui compose le processus associé au document, en un seul endroit. Un processus dont les
pièces sont dispersées est un processus qu'on applique de mémoire, donc partiellement.*

| Pièce | Chemin | Rôle |
|---|---|---|
| **Le document en vigueur** | `docs/philosophie-et-politique.md` | le texte qui fait loi |
| **Sa page lisible** | `docs/philosophie-et-politique.html` | dérivée du texte, jamais écrite à part |
| **La présente fiche** | `docs/referentiel/document-de-gouvernance.md` | la forme arrêtée, la procédure, et ce qu'aucun mécanisme ne tient |
| **Gabarit du cas 1** | `docs/gabarits/philosophie-et-politique-gabarit.md` | patron vierge — l'outillage est un projet de conception |
| **Gabarit du cas 2** | `docs/gabarits/philosophie-et-politique-gabarit-cas-2.md` | patron vierge — l'outillage est une aide exécutive livrée |
| **Exemplaire du cas 2** | `docs/the-king/versions-cas-2/` | montre le changement de registre, que le patron ne peut pas montrer |
| **Archives des éditions remplacées** | `docs/the-king/archives/` | conservation verbatim, jamais résumée |
| **Empreinte d'ossature** | `docs/the-king/empreinte-document-officiel.json` | l'état de référence auquel toute modification est comparée |
| **L'instrument d'extraction** | THE-KING | conduit la révélation et le contrôle périodique |
| **Les leçons de l'extraction** | `docs/the-king/lecons-de-la-revelation.md` | mémoire sauvegardée de l'instrument, qui part avec lui |

---

## ÉVOLUTIONS DU PROCESSUS

*Un processus qui change sans trace est un processus dont personne ne sait quelle version il
applique.*

| Date | Évolution |
|---|---|
| **2026-10-02** | Établissement de la Vision Globale en forme officielle : 71 articles, trois niveaux, les objectifs ultimes au titre préliminaire. Empreinte d'ossature posée. |
| **2026-10-02** | Création des deux gabarits et de l'exemplaire du cas de figure 2. |
| **2026-10-02** | Inscription du renvoi au processus dans le régime du document, et dans les deux gabarits. |
| **2026-10-02** | Annexe A portée à quatre questions de clôture (ajout d'INTELLIGENT), cinq exigences permanentes (ajout de RATIONNEL, ROBUSTE, PROPRE) et deux conditions transversales. |
| **2026-10-02** | Article 69 : la place du responsable de projet rétablie dans la méthode d'établissement. |
| **2026-10-02** | Article 72 : le contrôle périodique de fidélité rattaché à la revue périodique du projet. |
| **2026-10-02** | Annexe B refermée : les trois points en attente ont été arbitrés. |
