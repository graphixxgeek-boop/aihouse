# EZECHIEL-LES-TESTS — instanciation sur ce projet

**Extension d'Abraham-les-references dédiée au FILET DE SÉCURITÉ.** Créé le 2026-09-27 (tâche
#1026), sur demande explicite de l'utilisateur : « sa vocation ultime : faire baisser le temps
d'exécution de la chaîne de test ». Blueprint générique : `docs/ezechiel-les-tests-blueprint.md`.

**Le périmètre est plus large que « les tests », et c'est sa décision** : « on doit construire
Ezechiel autour de TOUTE la mécanique qui constitue le filet mais AUSSI la mécanique qui ENTOURE ce
filet, c'est une vue plus large, qui permet de saisir tous les tenants et aboutissants du problème ».

## La commande

```
EZ_NU_MS=<ms> EZ_COUV_MS=<ms> EZ_TSC_MS=<ms> node scripts/ezechiel-les-tests.mjs
```

Sans les durées, l'axe « d'où vient le temps » affiche **PAS MESURÉ** plutôt qu'un verdict — c'est
délibéré : conclure sans les trois durées serait optimiser à l'aveugle. Les autres axes tournent.

## Ce qu'il réutilise plutôt que de le refaire

`mesurerLeFilet()` et `repartitionDuFilet()` de SMART-CONSO-TOKEN, qui chronomètrent déjà groupe par
groupe, et le MÊME découpage en groupes — pour que les deux outils parlent des mêmes groupes. Deux
découpages différents rendraient deux inventaires impossibles à croiser (leçon L29).

## L'état réel au premier passage (2026-09-27)

| | |
|---|---|
| Le filet | 17 165 lignes · 283 groupes · 5 616 assertions |
| Chaîne réelle | 8 commandes, dont **2 bloquantes** |
| Filet nu | **116 s** |
| Sous instrumentation | 107 s — **surcoût non mesurable**, les deux durées sont dans la même marge |
| Typage | 6 s |
| **Part des tests** | **95 %** du temps bloquant |
| Groupes sans assertion | 6 |
| Groupes sans raison écrite | 1 |
| Imports morts | 0 |
| Titres en double | 3 |

**LE RÉSULTAT CONTREDIT L'HYPOTHÈSE DE DÉPART, et c'est ce qui le rend utile.** L'agent avait posé
que le triplement du filet (43,7 s le 2026-09-25 → 116 s le 2026-09-27) venait de ce qui l'entoure.
La mesure dit le contraire : l'enveloppe pèse 5 %. **Le gain est bien dans la suite elle-même** —
mais on le sait maintenant, au lieu de le supposer.

## Ses trois défauts trouvés à son PREMIER vrai passage, et corrigés le jour même

Ils valent d'être écrits : chacun aurait produit une accusation fausse, et un garde-fou qui accuse à
tort cesse d'être lu (leçon L4).

1. **16 groupes « sans assertion » dont 10 faux** — cinq lignes de succès consécutives comptées comme
   cinq groupes.
2. **8 imports « morts » dont ZÉRO ne l'était** — des chemins de fixture pris pour des imports.
3. **« les tests 103 %, l'enveloppe −3 % »** — un pourcentage négatif rendu comme un résultat.

## Ce qu'il ne fait pas

Il n'écrit jamais dans `scripts/check-house.mjs`. tool-brain le classe TUYAUTERIE score 9, le plus
haut du dépôt : sa panne empêche tout commit.

## Les commandes (2026-09-27, v2)

| Commande | Ce qu'elle fait | Ce qu'elle coûte |
|---|---|---|
| `node scripts/ezechiel-les-tests.mjs` | l'enquête complète, instantanée — elle ne touche à rien et relit les relevés déjà enregistrés | gratuit, quelques dizaines de ms |
| `node scripts/ezechiel-les-tests.mjs sante` (alias `mesurer`) | lance le filet POUR DE VRAI, horodate ses lignes de succès, en tire le chronométrage groupe par groupe ET le voyant de fonctionnement, puis enregistre les deux | une exécution complète du filet (≈ 107 s au 2026-09-27) |
| `node scripts/ezechiel-les-tests.mjs robustesse [--combien=N]` | casse le vrai code exprès, relance le filet, regarde s'il mord, restaure, et compare à la passe précédente | (N+1) exécutions du filet — **passe séparée, jamais dans l'enquête** |

## L'état réel au 2026-09-27 (deuxième relevé, le premier chronométré)

- **Filet nu : 107 s.** Pas les 43,7 s mesurées le 2026-09-25 : il a plus que doublé en deux jours.
- **L'enveloppe ne pèse qu'une douzaine de secondes** (couverture V8 + `tsc`) sur ~113 s bloquantes.
  **Le temps est dans les tests eux-mêmes** — ce qui invalide l'hypothèse de départ du chantier, et
  c'est la mesure qui l'a dit, jamais la relecture.
- **295 succès attendus, 295 imprimés, recollage COMPLET** : aucun bloc sauté, aucun bloc en double.
- **Deux anomalies non bloquantes** : un avertissement d'API expérimentale, et deux lignes écrites
  sur la sortie d'erreur alors que la suite est verte.
- **697 appels du filet vers un module de l'Agence, 0 périmé.**
- **La passe de robustesse n'a encore jamais tourné** : tant qu'elle n'a pas tourné, « le filet
  mord » reste une intention (Article 25).

## Sa part du contrat à trois

MOÏSE garantit la fraîcheur des FAITS de la charte. Abraham celle des RÈGLES de n'importe quel
document numéroté. Ezechiel celle de la CORRESPONDANCE entre ce que les tests appellent et ce que le
code offre encore. La frontière vit dans `PERIMETRES` (`scripts/ezechiel-les-tests.mjs`), relue par
un test à chaque passage du filet : elle est vérifiable, pas promise.

**Abraham est le point d'entrée de l'assainissement à grande échelle** : il convoque les deux autres
et fusionne leurs alertes, sans jamais refaire leur analyse. MOÏSE et Ezechiel restent convocables
seuls sur leur périmètre, et déposent alors leur verdict dans le registre d'alertes partagé —
c'est par ce registre qu'Abraham « veille » même quand on ne l'a pas appelé.

## Les quatre apports de l'état de l'art (2026-09-27)

Recherche archivée dans `docs/recherches/filet-de-securite-etat-de-l-art.md` — six constats retenus,
deux laissés à trancher, deux écartés avec leur raison.

| Détecteur | La question qu'il pose | Sur notre filet |
|---|---|---|
| `assertionsConditionnelles()` | une assertion peut-elle être avalée par un `try/catch` ? | **0** |
| `blocsQuiLisentLeDisque()` | quels blocs dépendent de fichiers réels ? (le *Mystery Guest*) | **37 sur 286** — c'est à la fois d'où viennent les secondes et ce qui casse quand un fichier bouge |
| `etatPartageEntreBlocs()` | un bloc dépend-il de ce qu'un autre a laissé ? (3ᵉ cause de flakiness) | **0** |
| `percentilesDeDuree()` | la suite est-elle un long plateau ou une poignée de monstres ? | **une poignée de monstres** : les 5 % les plus lents portent 72 % du temps |
| `couvertureDeLEchantillon()` | le score de robustesse vaut-il pour toute la suite ? | **anecdotique** (4 cassures sur 72 modules) — la littérature mesure 26 % de perte de pouvoir de détection à 10 % d'échantillonnage, donc le score renseigne sans conclure |

**Deux d'entre eux ont produit un faux positif massif à leur premier passage réel** (5 225
assertions dénoncées, 7 variables « partagées » qui ne l'étaient pas), tous deux parce qu'ils
comptaient une profondeur que le vrai fichier n'écrit pas comme prévu. Les deux corrections et leur
raison vivent dans le code, et la leçon générale dans `docs/referentiel/lecons.md` (L39).

**Ce qui reste hors d'Ezechiel, et c'est une décision, pas un oubli** : le *Test Impact Analysis*
(ne relancer que les tests concernés par le diff) est le levier le plus lourd que la recherche ait
identifié — mais il change la NATURE du filet, qui ne protégerait plus tout à chaque commit. Cette
décision appartient à l'utilisateur (Article 16), et elle est posée dans le plan d'action de la
recherche.

## Le filet ne s'écrit plus en dur, il se trouve (2026-09-27, tâche #1030)

**Sa question ÉTAIT la tâche** : « est-ce que Ezechiel saura sinon quel fichier est le filet de
sécurité du code, s'il prend les choses en cours ». La réponse était NON : `FILET` était une
constante, donc sur n'importe quel autre dépôt l'outil cherchait un fichier inexistant.

**Trois pistes, et leur ORDRE est un jugement sur leur fiabilité** :

| Piste | Force | Pourquoi cet ordre |
|---|---|---|
| `--filet <chemin>` donné à la main | certaine | c'est une décision humaine, elle prime sur tout |
| le fichier que le crochet de pré-commit LANCE | forte | c'est la définition même d'un filet : ce qui doit passer avant d'enregistrer |
| la commande de test DÉCLARÉE par le gestionnaire de paquets | moyenne | une déclaration, pas un fait |
| le plus gros fichier porteur d'assertions (≥ 20) | faible | une devinette, et elle se présente comme telle dans le rapport |

**Trois états, jamais deux** : trouvé (avec la piste ET sa force, imprimées en tête du rapport),
pas trouvé (avec **les quatre essais**, parce qu'un « non » sans ses essais ne s'instruit pas), et
jamais un chemin rendu au hasard — un outil qui devine son fichier d'étude rend un rapport
entièrement faux sans jamais le signaler.

**Sur ce dépôt, la détection retrouve `scripts/check-house.mjs` PAR LE CROCHET**, jamais par le
dernier recours — c'est la seule vérification qui prouve quelque chose, sinon la détection
répéterait simplement la constante.

**filet-en-parts hérite de la même détection par IMPORT, jamais par copie** (Article 24) : le jour
où une piste de plus est ajoutée ici, l'autre outil en profite sans qu'on y touche.

## Le bruit, c'est ce que personne n'a déjà nommé (2026-09-28, tâche #1098)

**Le défaut** : sur une suite ENTIÈREMENT VERTE, le voyant de santé annonçait « 1 avertissement
`experimental` » **puis** « 2 lignes de bruit sur la sortie d'erreur ». Les deux lignes de bruit
ÉTAIENT cet avertissement : l'`ExperimentalWarning` de `node:sqlite`, plus la ligne
« (Use `node --trace-warnings ...`) » que Node colle systématiquement derrière chaque
avertissement. Le même événement, facturé deux fois, dont une sous une étiquette qui suggère de
l'inexpliqué.

**Pourquoi ça coûte plus qu'un doublon d'affichage** : cet avertissement-là **ne peut pas être
retiré**. Il vient du moteur, il dit vrai, et il dira vrai tant que `node:sqlite` sera
expérimental. Une alerte « traite ce bruit » qu'**aucune action légitime ne peut éteindre** devient
du décor (leçon L6) — et elle emporte avec elle la seule alerte qui compte ici : celle qui se
déclencherait le jour où une VRAIE ligne inattendue apparaîtrait sur la sortie d'erreur.

**Ce que fait `ligneDejaExpliquee()`** : une ligne de la sortie d'erreur est écartée du compte de
bruit si elle correspond à un motif de `MOTIFS_D_AVERTISSEMENT` **que le rapport annonce déjà par
ailleurs**, ou si c'est la ligne d'accompagnement du moteur (`MOTIF_LIGNE_D_ACCOMPAGNEMENT`).

**Le filtre reste étroit, et c'est ce qui le rend sûr** : un avertissement d'un genre que personne
n'a déclaré n'est rattaché à rien, donc il compte ; une vraie erreur compte toujours. Le filtre
écarte ce qui est NOMMÉ ailleurs, jamais tout ce qui ressemble à un avertissement.

**La part écartée est ANNONCÉE**, jamais escamotée : le message dit « (2 autre(s) déjà rattachée(s)
à un avertissement nommé ci-dessus, donc jamais recomptée(s) ici) ». Un chiffre qui baisse sans
dire pourquoi se lit comme une régression du détecteur.

**La classe, pas l'occurrence** (leçon L37) : c'est la même famille que la tâche #1074 — une
population annoncée sans en retirer la part déjà expliquée.

## Le chiffre écrit à la main, confronté à ce que la machine a enregistré (2026-09-29, tâche #1208)

**D'où ça vient** : data-archangel signale depuis la tâche #490 des données FRAÎCHES que personne
d'autre que leur producteur ne lit. `docs/filet-en-parts/index.md` en faisait partie — et son
contenu n'est pas anodin : chaque ligne porte une **comparaison écrite à la main** (« 44 s en 4
parts, contre 78 s en séquentiel »), exactement le genre de chiffre que l'Article 24 refuse de
laisser sans vérification. Le registre le dit lui-même en tête : « à remplir à la main ».

**Pourquoi le lecteur vit ICI** : EZECHIEL est le seul qui tienne le relevé chronométré des passages
SÉQUENTIELS, écrit par la machine. Confronter les deux, c'est vérifier une affirmation contre une
mesure — jamais recalculer une donnée déjà calculée (leçon L29, qui interdit le second calcul
divergent).

**Le seuil se DÉRIVE, il ne se choisit pas (BP5)** : la première version réutilisait la marge de
bruit de 3 % et signalait « à revoir » sur 78 s annoncés contre 75 s mesurés — un arrondi de main
parfaitement légitime. Un garde-fou qui reproche à une main d'arrondir cesse d'être lu (leçon L4).
La règle est donc que **le chiffre annoncé doit tomber DANS l'intervalle des passages réellement
chronométrés ce jour-là** : un arrondi y tombe toujours, un chiffre pris sur un autre jour, une
autre machine ou écrit de mémoire en tombe dehors. Ce sont les mesures du jour qui font le seuil.

**Sans relevé ce jour-là, il s'abstient** : « ni confirmé ni démenti », jamais une accusation — un
jour sans mesure ne dit rien du chiffre annoncé (leçon L5).

**Mesuré** : data-archangel passe de 6 données fraîches sans lecteur à 5, et la seule ligne du
registre est CONFIRMÉE — 78 s annoncés, cinq passages ce jour-là entre 65 et 106 s.

**La commande** : c'est une section du rapport ordinaire (`node scripts/ezechiel-les-tests.mjs`),
pas une sous-commande — un mécanisme qui ne sort pas du script est une intention (leçon L2).

## DEUX CHIFFRES QUE LE RAPPORT DONNAIT FAUX (2026-10-04, tâche #1597)

Ses questions, après la campagne d'optimisation du filet : « est-ce qu'Ezechiel a été utilisé ?
est-ce qu'il a été amélioré ? est-ce que tu peux l'optimiser/fiabiliser à la lumière de ce que tu
viens de faire ? » Les deux premières se mesurent (109 lancements depuis le 2026-10-02, 7 commits
sur son script dans la même fenêtre). La troisième a trouvé deux chiffres faux dans son propre
rapport.

### ① La mesure des trois couches ne disait jamais son âge

`couches.json` annonçait **filet nu 266,5 s** et **total bloquant 270,9 s** pendant que la mesure
de santé du MÊME outil, prise huit heures plus tard, relevait **194,0 s**. Deux porteurs du même
chiffre, divergents de 37 %, dans le même rapport, et rien ne disait lequel croire — **un chiffre
sans âge se lit comme un chiffre d'aujourd'hui** (Article 32, troisième obligation ; leçon L29).

`fraicheurDesCouches()` confronte désormais la mesure au **dernier passage séquentiel vert**
enregistré après elle, et le rapport dit « 🚨 MESURE PÉRIMÉE » **avant** les chiffres, jamais après.

**Deux décisions de conception à ne pas défaire :**

- **Le seuil n'est pas nouveau** : c'est `MARGE_DE_BRUIT_PCT`, les 3 % déjà déclarés dans ce même
  fichier. En planter un second à côté aurait fabriqué exactement le défaut que la fonction
  dénonce.
- **La référence est le DERNIER passage vert, pas l'intervalle de tous ceux d'après.** Premier
  jet : l'intervalle complet, qui s'étalait de 190 à 263 s parce qu'il enjambait la campagne
  d'optimisation — 266 s y tombait à 1 % près, donc l'alerte sortait en annonçant un écart
  dérisoire. **Un intervalle qui contient l'avant ET l'après d'un chantier absout tout ce qui
  s'est passé entre les deux.**
- **Sans passage plus récent, il ne dit rien** — jamais « à jour », qui serait une conclusion
  tirée d'une absence de données (leçons L5/L11). Et un passage ROUGE n'est jamais une
  référence : sa durée est celle d'une suite interrompue.

### ② Une commande écrite dans un crochet n'est pas une commande qui tourne

Depuis que le crochet de pré-commit lance le runner parallèle **avec repli automatique**, les deux
lancements du filet figurent dans le fichier. Ezechiel les comptait tous les deux comme bloquants :
il annonçait **deux exécutions complètes du filet par commit**, là où il n'en tourne qu'une.

`lignesSousCondition()` suit les accolades et marque toute commande vivant dans un corps de
fonction shell. Le rapport distingue maintenant `bloquantes` (ce qui est écrit) de
`bloquantesToujours` (ce qui s'exécute à chaque fois), et marque le repli d'un `↩️`.

**La détection porte sur la STRUCTURE du fichier, jamais sur le nom de la fonction** : un repli
nommé autrement échapperait à une liste de noms, et une liste de noms est précisément ce que
l'Article 24 refuse. Elle compte des accolades, donc elle est fausse jusqu'à preuve du contraire
(leçon L39) — d'où un contre-test sur l'imbrication (`fi` n'est pas une accolade fermante) et sur
le retour à zéro après la fonction.
