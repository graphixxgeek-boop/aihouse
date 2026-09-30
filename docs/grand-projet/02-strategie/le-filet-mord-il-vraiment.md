# LE FILET MORD-IL VRAIMENT ? — et comment ma propre mesure a commis trois fois l'erreur qu'elle cherchait

*(Nuit du 2026-09-29 au 30, heure LUE, source système. Tâche **#1267**.
Personne ne l'a demandé : c'est la leçon **L47**, écrite une heure plus tôt, transformée en mesure
plutôt que laissée en maxime.)*

> **DÉCOULE DE :** `docs/referentiel/lecons.md`, leçon L47.
> *il instruit sa dernière phrase — « un contrôle qu'on n'a jamais vu MORDRE n'est pas un contrôle
> vérifié » — sur le filet de sécurité lui-même.*

---

## LA QUESTION

**Le filet compte 380 vérifications.** Combien d'entre elles ont déjà été vues **refuser** quelque
chose ? Une assertion qui ne vérifie que le cas normal ne prouve rien : elle passerait aussi si le
contrôle était débranché.

## LA RÉPONSE, ET ELLE EST BONNE

**21 % des 6 126 assertions du filet ont une forme NÉGATIVE** — elles vérifient que le contrôle
refuse, ou qu'il laisse passer ce qu'il doit laisser passer.

| Forme | Nombre | Ce qu'elle prouve |
|---|---|---|
| `equal(…, false / 0 / null)` | 565 | le contrôle dit non |
| `deepEqual(…, [] / null)` | 245 | rien à signaler, et c'est vérifié |
| `ok(!…)` | 217 | la négation explicite |
| `mesurable = false` | 98 | **il refuse de conclure** — la forme la plus propre à ce dépôt |
| `length 0` | 88 | |
| `throws` / `doesNotThrow` | 60 | il refuse vraiment, ou laisse passer vraiment |

**Et surtout : 89 blocs de test sur 94 en portent au moins une.** Il n'en reste **cinq** sans
aucune, tous petits :

`testDerivationEcarteeParcequElleFlatte` · `testDetteIndirecteIgnoreLesCommentaires` ·
`testGardeDeModuleCheckSpirit` · `testCollisionNommeSesTaches` ·
`testGardienPartageNAccusePlusSesFreres`

**C'est une petite liste actionnable, pas un chantier.**

---

## MAIS LE VRAI INTÉRÊT DE CETTE MESURE EST AILLEURS

**Ma première version annonçait 4 % et cinquante-neuf blocs à reprendre.** Elle était fausse, et
elle l'était **exactement de la manière que la leçon L47 décrit** — écrite une heure plus tôt, par
moi.

### Erreur ① — j'ai mesuré un VOCABULAIRE en croyant mesurer une COUVERTURE

Ma première version cherchait les mots « CONTRE-TEST », « MUST CATCH » dans le **texte** des
messages. Or `assert.throws(...)` **est** un contre-test parfait, et n'emploie aucun de ces mots.

> **4 % → 19 %** dès qu'on regarde la FORME de l'assertion au lieu de son texte.
> **Et 59 blocs à reprendre → 6.**

### Erreur ② — ma liste de formes était incomplète

Une vérification manuelle a trouvé `assert.equal(…, null)` — un cas négatif parfaitement valide
que mon motif ne connaissait pas.

> **19 % → 21 %**, et **6 blocs → 5**.

### Erreur ③ — et c'est celle qui décide : ce chiffre restera toujours un PLANCHER

**« Un cas négatif » est une propriété de SENS, pas de forme.** Une assertion peut vérifier un
refus par n'importe quelle tournure qu'aucun motif ne prévoira. Chaque fois que j'ai regardé de
plus près, le chiffre est MONTÉ — jamais descendu.

**Donc : 21 % est un plancher, la vraie valeur est plus haute, et je ne sais pas de combien.**

**Ce qu'il ne faut surtout pas faire de ce chiffre** : en faire un indicateur à suivre. Il
bougerait avec la finesse de mes motifs plutôt qu'avec la qualité du filet — ce qui est la
définition d'un mauvais indicateur, et le piège que la leçon L28 nomme déjà (*un chiffre qui BOUGE
n'est pas un chiffre qui s'AMÉLIORE*).

---

## CE QUE J'EN RETIENS, ET QUI VAUT PLUS QUE LE CHIFFRE

**Si j'avais publié ma première mesure, elle aurait lancé un chantier de 59 blocs qui n'existait
pas.** Ce qui l'a arrêtée n'est pas une intuition : c'est d'avoir appliqué à ma propre mesure la
question de la leçon L47 — **qu'est-ce que ce contrôle a LITTÉRALEMENT regardé ?** La réponse était
« les mots du message », pas « la couverture ». Trente secondes.

**La discipline du contre-test ne se mécanise pas. Elle se tient.** C'est pour ça qu'elle vit dans
une leçon et non dans un garde-fou — et le déclarer ainsi vaut mieux que de confier une règle à un
indicateur qui la mesurerait mal *(Article 27)*.

---

## PLAN D'ACTION *(Article 28)*

| Constat | État | Ce qu'il devient |
|---|---|---|
| Le filet porte 21 % d'assertions négatives, et 89 blocs sur 94 en ont au moins une | **RETENU** | tâche **#1267** — ce document ; c'est meilleur que ce que je craignais, et ça se dit |
| Ma propre mesure a commis trois fois l'erreur de la leçon qu'elle instruisait | **RETENU** | tâche **#1267** — raconté plutôt qu'effacé : c'est la démonstration la plus utile que L47 pouvait recevoir, et elle est arrivée une heure après sa rédaction |
| Cinq blocs de test n'ont aucune assertion négative | **À TRANCHER** | petite liste, vrai travail : leur en écrire une chacun. Pas cette nuit — ce sont des tests d'outils que je n'ai pas relus, et écrire un contre-test sans comprendre le contrôle produit un test qui passe sans rien prouver (Article 19) |
| Faire de ce 21 % un indicateur suivi | **ÉCARTÉ, avec sa raison** | il bougerait avec la finesse de mes motifs plutôt qu'avec la qualité du filet. C'est la leçon L28 : un chiffre qui BOUGE n'est pas un chiffre qui s'AMÉLIORE |
| Construire un garde-fou qui exigerait une assertion négative par bloc | **ÉCARTÉ, avec sa raison** | il jugerait une propriété de SENS avec un motif de FORME, c'est-à-dire qu'il commettrait L47 en permanence — et il accuserait des blocs corrects (L4) |
