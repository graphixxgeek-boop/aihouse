# LE FILET MORD-IL VRAIMENT ? — et comment ma propre mesure a commis trois fois l'erreur qu'elle cherchait

<!-- ARBORESCENCE — bloc généré par `node scripts/the-king.mjs cascade --inserer`, ne pas éditer à la main -->

**Où ce document se situe dans la cascade** — remonté des déclarations « DÉCOULE DE » réelles, jamais dessiné à la main :

```
referentiel/lecons
    └── ▣ grand-projet/02-strategie/le-filet-mord-il-vraiment   ← CE DOCUMENT
        (aucun document ne déclare découler de celui-ci)
```

<!-- /ARBORESCENCE -->

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

**Et 89 blocs de test sur 94 en portent au moins une** — au sens de mes motifs.

**J'ai ensuite ouvert les cinq restants à la main, et LES CINQ ONT UN CONTRE-TEST.** Ils écrivent
même les plus explicites du dépôt :

| Bloc | Ce qu'il porte vraiment |
|---|---|
| `testGardienPartageNAccusePlusSesFreres` | un **MUST CATCH** et un **MUST LET PASS**, plus le piège du premier essai raconté |
| `testDetteIndirecteIgnoreLesCommentaires` | *« c'est exactement la paire dont un contre-test a besoin »*, écrit tel quel |
| `testCollisionNommeSesTaches` | un **MUST LET PASS** numéroté |
| `testGardeDeModuleCheckSpirit` | *« la garde se vérifie en ESSAYANT, jamais en relisant »* |
| `testDerivationEcarteeParcequElleFlatte` | un `equal(…, null)` sur le cas non classifiable |

**Il n'y a donc AUCUN bloc sans contre-test.** Ma liste de cinq était fausse — et elle aurait
envoyé quelqu'un réparer cinq tests déjà corrects.

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

### Erreur ③ — les cinq derniers « trous » n'en étaient pas

J'ai ouvert les cinq blocs restants à la main. **Les cinq ont un contre-test**, et trois l'écrivent
en toutes lettres. Ils m'échappaient parce qu'un `assert.ok(dette.some(…))` est une assertion de
forme POSITIVE qui vérifie un cas NÉGATIF.

> **5 blocs à reprendre → 0.**

**Si j'avais publié cette liste, elle aurait envoyé réparer cinq tests déjà corrects** — la
leçon L4, commise par la mesure censée instruire la leçon L47.

### Erreur ④ — et c'est celle qui décide : ce chiffre ne se mesure PAS par motif

**« Un cas négatif » est une propriété de SENS, pas de forme.** Une assertion peut vérifier un
refus par n'importe quelle tournure qu'aucun motif ne prévoira. Chaque fois que j'ai regardé de
plus près, le chiffre est MONTÉ — jamais descendu.

**Donc : 21 % est un plancher, la vraie valeur est plus haute, et je ne sais pas de combien.**
Les quatre itérations donnent 4 % → 19 % → 21 % → *plus*, et 59 blocs → 6 → 5 → **0**.
**Une suite qui ne fait que monter à chaque regard n'est pas une mesure : c'est un aveu.**

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

## LA SECONDE MOITIÉ DE L47 — celle qui, ELLE, se mesure vraiment

**La couverture en contre-tests ne se mesure pas.** Mais une partie de L47 se mesure très bien :
**la frontière de mot `\b` mal posée**, qui est le défaut exact de deux bugs déjà payés par ce
dépôt — `\bNoé\b` qui ne correspondait à rien (#514), et `docs/ecotoken/` qui attrapait
`docs/ecotoken/ronde/` (#1265, cette nuit).

**Et là encore, ma première version s'est trompée** — septième fois de la nuit, mais attrapée
avant publication : chercher « `\b` collé à un caractère non-mot » rendait **233 endroits**, dont
la quasi-totalité étaient le **délimiteur** du littéral (`/\bcorrige\b/` est parfaitement
correct). Le motif regardait la ponctuation de JavaScript, pas la logique du motif.

### Les deux formes qui mordent vraiment

| Forme | Trouvée | Verdict |
|---|---|---|
| `\b` après une lettre **accentuée** — sans le drapeau `u`, le motif ne peut correspondre à **rien** | **0** | le défaut de `\bNoé\b` a été corrigé par un principe, et il n'est jamais revenu |
| `\b${…}\b` autour d'une valeur **interpolée** | **13** | à instruire une par une |

### Les treize, instruites — et le risque n'est pas la forme, c'est la POPULATION

`\b${x}\b` n'attrape les « enfants » que s'il existe, **dans les valeurs possibles de x**, une
paire où l'une est préfixe de l'autre. Ça, c'est décidable :

| Population | Valeurs | Paires préfixe |
|---|---|---|
| slugs de process | 14 | **0** |
| noms d'outils du catalogue | 73 | 6 — mais toutes sont *« NOM »* vs *« NOM (précision) »*, **le même outil**, et les rapprocher est voulu |
| identifiants d'items de Ronde | 43 | **1 vraie** : `profil` est préfixe de `profil-utilisateur-guard`, **deux items différents** |

**Et la seule vraie paire n'est pas exploitée** : les deux endroits qui construisent `\b${nom}\b`
travaillent sur des **noms de fonctions JavaScript**, qui ne peuvent pas contenir de tiret. Le
piège existe ; rien ne marche dessus aujourd'hui.

**Résultat : zéro défaut vivant, un piège nommé.** Le jour où quelqu'un écrira `\b${id}\b` sur
des identifiants d'items de Ronde, `profil` attrapera `profil-utilisateur-guard` — et c'est écrit
ici pour qu'il le sache avant plutôt qu'après.

### CE QUE TROIS ENQUÊTES DE SUITE ONT MONTRÉ, ET C'EST LE VRAI ENSEIGNEMENT

| Ce que ma première mesure annonçait | Ce qu'il y avait vraiment |
|---|---|
| 59 blocs de test à reprendre | **0** |
| 5 blocs sans contre-test | **0** |
| 233 frontières de mot suspectes | **0** défaut vivant |

**Mes mesures sont systématiquement PESSIMISTES au premier passage**, et toujours pour la même
raison : elles comptent une FORME en croyant compter un DÉFAUT. Trois fausses alertes évitées en
une nuit, chacune par trente secondes de vérification à la main.

*(Une mesure qui se trompait dans l'autre sens serait bien pire : une fausse alerte se dissipe en
regardant, un faux calme ne se dissipe jamais. Mais publier trois chantiers inexistants aurait
coûté un temps réel, et la confiance qui va avec.)*

---

## PLAN D'ACTION *(Article 28)*

| Constat | État | Ce qu'il devient |
|---|---|---|
| Le filet porte au MOINS 21 % d'assertions négatives, et **aucun bloc n'est sans contre-test** | **RETENU** | tâche **#1267** — ce document ; c'est nettement meilleur que ce que ma première mesure disait, et ça se dit |
| Ma propre mesure a commis trois fois l'erreur de la leçon qu'elle instruisait | **RETENU** | tâche **#1267** — raconté plutôt qu'effacé : c'est la démonstration la plus utile que L47 pouvait recevoir, et elle est arrivée une heure après sa rédaction |
| Les « cinq blocs sans contre-test » | **ÉCARTÉ — le constat était FAUX** | vérifié à la main : les cinq en ont un, et trois l'écrivent en toutes lettres. Je l'avais d'abord différé « par prudence, Article 19 » ; c'est en tenant cette prudence que j'ai découvert qu'il n'y avait rien à réparer. Le différé valait mieux que le zèle |
| Faire de ce 21 % un indicateur suivi | **ÉCARTÉ, avec sa raison** | il bougerait avec la finesse de mes motifs plutôt qu'avec la qualité du filet. C'est la leçon L28 : un chiffre qui BOUGE n'est pas un chiffre qui s'AMÉLIORE |
| `profil` est préfixe de `profil-utilisateur-guard`, deux items de Ronde différents | **RETENU** | tâche **#1269** — piège latent, aucun code ne l'exploite aujourd'hui ; nommé ici pour qu'un futur `\b${id}\b` sur des identifiants de Ronde ne tombe pas dedans |
| Les 6 autres paires préfixe du catalogue d'outils | **ÉCARTÉ, avec sa raison** | elles opposent « NOM » à « NOM (précision) », c'est-à-dire le même outil écrit deux fois ; les rapprocher est exactement ce qu'on veut, et `normaliserNomDOutil()` le fait déjà exprès |
| Un garde-fou mécanique contre `\b${…}\b` | **ÉCARTÉ, avec sa raison** | la forme est légitime 13 fois sur 13 aujourd'hui : c'est la POPULATION interpolée qui décide, et elle n'est pas lisible depuis la ligne. Un contrôle sur la forme accuserait treize usages corrects (L4) |
| Construire un garde-fou qui exigerait une assertion négative par bloc | **ÉCARTÉ, avec sa raison** | il jugerait une propriété de SENS avec un motif de FORME, c'est-à-dire qu'il commettrait L47 en permanence — et il accuserait des blocs corrects (L4) |
