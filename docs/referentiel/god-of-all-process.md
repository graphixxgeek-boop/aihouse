# god-of-all-process — fiche d'instanciation

## Ce qu'il sert ici

`scripts/god-of-all-process.mjs` : **le contrôleur maître du DÉROULÉ** des activités à étapes de ce
projet. Il surveille des ÉTAPES ; `angel-of-ia-process` surveille des RÈGLES DE TRAVAIL. Les deux
côtés — l'agent comme l'utilisateur — y sont notés pareil.

## Une seule voix, jamais deux

**angel ne livre pas son rapport lui-même : god le relaie**, dans une section clairement à part.
C'est une décision d'architecture de l'utilisateur (2026-09-22), prise pour que la Ronde entende une
voix de process et non une par contrôleur.

## Les process qu'il connaît ici

La Ronde, la simulation (Article 18), la nuit autonome, le méta-process, l'intégration d'un outil,
et XP-IA-bonnes-pratiques-et-leçons. Il dérive l'avancement de **traces réelles sur le disque**,
jamais d'un compteur qui pourrait dériver.

## Son autorité, tranchée explicitement

**Il SIGNALE FORT, il ne bloque JAMAIS** (Article 28). Le manquement est nommé, le responsable
désigné, et il reste visible tant qu'il n'est pas traité. Un contrôleur qui bloquerait sur un sujet
sans rapport avec le travail en cours pousserait à le contourner.

## Ce qu'il ne confond jamais, et ça lui a coûté d'apprendre

- Une **étape sans trace vérifiable** n'est pas une étape non faite.
- Une **sonde cassée** n'est pas une étape manquante — erreur commise par son propre premier
  passage réel, sur trois de ses propres sondes.

## Son écart connu, mesuré le 2026-09-26

Il reste **2 activités à enjeu sans process écrit** : sonder le quota Gemini, et modifier CLAUDE.md.
Il les signale à chaque passage.

## Sa limite ici

Il lit des traces sur le disque. Une étape qui ne laisse aucune trace lui est structurellement
invisible, et il le dit plutôt que de la compter faite.

## Une fiche en retard sur son script (2026-09-29, tâche #1159)

```
node scripts/god-of-all-process.mjs fiches
```

**Le trou est né d'un constat de la nuit même** : quatre outils avaient reçu une capacité nouvelle,
et AUCUN garde-fou ne signalait que leur fiche ne le disait pas.
`findChangementsIndirectsSansMiseAJour()` rendait `[]` — et il avait raison de son point de vue : il
surveille les PROCESS, jamais les fiches d'outil. **Une dette documentaire qu'aucune mécanique ne
voit est exactement celle qui s'installe.**

**Ce qu'il ne faut surtout PAS mesurer, et c'est toute la difficulté.** « Le script a changé depuis
sa fiche » crierait à chaque refactor, à chaque commentaire ajouté, à chaque faute de frappe
corrigée — le garde-fou accuserait presque tous les jours, et cesserait d'être lu (leçon L4).

**Ce qui est mesuré à la place** : le script a-t-il gagné une **fonction publique** que sa fiche ne
nomme pas ? Un export nouveau est une capacité nouvelle — exactement ce que l'Article 13 oblige à
refléter. Un renommage interne, un commentaire, une correction ne produisent aucun export nouveau et
ne disent donc rien. `exportsPublics()` ne compte que les `export function` : une constante exportée
n'est pas une capacité.

**Deux exemptions, chacune avec son contre-test** : un commentaire ajouté ne crée aucun export ; et
une fonction **déjà nommée dans la fiche** n'est pas en retard, même si le commit de la fiche est
antérieur — rien ne dit qu'elle n'a pas été écrite dans le même geste.

**Il ne tourne PAS au commit, et c'est assumé** : il compare deux versions de chaque script, soit
deux appels git par outil. À la demande et à la Ronde — un contrôle qui ralentit chaque commit finit
par être décâblé.

**Les deux fonctions** : `findFichesEnRetardSurLeurScript()` mesure, `formatFichesEnRetardLines()` rend le
rapport lisible — et le contrôle a immédiatement mordu sur sa propre fiche, qui ne les nommait pas.

**Premier passage réel** : 77 scripts comparés, 7 sans fiche, **15 en retard** — dont
`check-tasks-details` avec 16 fonctions publiques que sa fiche ne nomme pas.

## `findPreuvesToujoursVraies()` — le miroir de la sonde cassée (2026-09-30, tâche #1292)

**`findBrokenProbes()` attrape la sonde qui pointe vers rien : elle ACCUSE une étape qui a bien eu
lieu. Celle-ci attrape l'inverse, et il est plus discret : une sonde qui ne peut pas échouer
ABSOUT une étape qui n'a jamais eu lieu.** Les deux défauts sont symétriques ; seul le premier
avait un détecteur, parce qu'une fausse accusation se remarque et un faux acquittement non.

**LE CAS RÉEL QUI L'A FAIT NAÎTRE, ET IL A COÛTÉ SEPT JOURS.** L'étape « déclarer le mode sur
disque plutôt que le supposer » avait pour preuve l'existence de `.mode-de-travail.json`. Le
fichier existait, il est **versionné**, il datait du 2026-09-23 — et il déclarait l'utilisateur
absent pendant toutes ses séances de jour. L'étape était verte en permanence.
**Une preuve de PRÉSENCE n'est pas une preuve de PERFORMANCE.**

**LA DÉRIVATION EST EXACTE, ET C'EST CE QUI REND LE CONTRÔLE SÛR** : un fichier **suivi par git**
est présent dans tout clone neuf, avant qu'aucune étape n'ait été exécutée — son existence ne peut
donc jamais distinguer « fait » de « pas fait ». Un fichier **non suivi** n'apparaît que si quelque
chose l'a écrit. Aucune liste à tenir : `git ls-files` répond.

**PREMIER PASSAGE RÉEL : 31 preuves sur 42 ne peuvent jamais échouer**, réparties sur 12 process.
Les 11 autres tiennent vraiment.

**IL SIGNALE, IL NE CORRIGE JAMAIS (Article 26).** Ce qu'une vraie preuve serait pour « archiver la
simulation » ou pour « câbler le mécanisme dans tel script » demande une décision par étape, pas
une règle générale — et corriger les trente et une d'un coup fabriquerait trente et une sondes
inventées, ce qui vaut moins que trente et une sondes honnêtement déclarées faibles.

**IL SORT DANS LE RAPPORT COMPLET, PAS AU COMMIT** : trente et une lignes qui ne bougent pas d'un
commit à l'autre deviendraient un mur, donc du décor (L4/L6). Le plan d'action en fait **un seul
constat**, jamais trente et un, pour la même raison.

---

## Deux défauts de la chaîne de l'Article 28, trouvés par un audit indépendant (2026-10-02)

### Le seul contrôle « en direct » était au vert par construction (tâche #1462)

`actionChainLines()` imprimait « ✅ chaque constat retenu porte sa tâche » **sur une liste vide**. Et
son unique appelant ne lui passe jamais rien : le paramètre vaut `[]` par défaut et **aucune ligne
du dépôt ne l'alimente** (deux occurrences du nom, toutes deux dans la définition).

Donc le seul contrôle en direct de la chaîne qui existe pour qu'un constat ne se perde pas était
vert **depuis dix jours, sans avoir jamais confronté un seul rapport à un seul carnet**.

**Le détail qui rend le défaut indiscutable** : trente lignes plus bas, **dans le même fichier**,
`auditPlansDeDocuments()` refuse explicitement le même piège depuis le 2026-09-25. Deux doctrines
opposées sur la même chaîne, dans le même fichier, à trois jours d'écart — ce n'est pas une décision
assumée, c'est la plus ancienne qui n'a pas été reprise.

**Corrigé** : trois états. Rien reçu → **PAS MESURÉ**. Une chaîne reçue et close → le ✅ **avec son
dénominateur**. Des maillons rompus → la liste. **Ce qui reste ouvert** : personne n'alimente ce
contrôle, et le brancher demande de décider qui lui passe les plans et quand.

### Le lecteur du carnet ignorait 45 % du carnet (tâche #1461)

`god-of-all-process plans` vérifie que chaque tâche annoncée par un plan existe dans le suivi. Sa
lecture ne regardait que `docs/suivi/sessions/` — or une tâche **archivée reste une tâche du
projet**.

| | Avant | Après |
|---|---|---|
| Documents accusés | **10** (≈119 références « mortes ») | **4** |
| Références réellement mortes | — | **4, toutes `#92`** |

`#92` est un numéro de gestionnaire de session, pas un numéro durable, et l'outil **déclare
lui-même** ne pas savoir les distinguer. Autrement dit : **correctement nourri, ce contrôle ne
trouve plus un seul défaut tranchable**, et sa sortie précédente était du bruit à 96 %.

**Vérifié avant correction, parce qu'un rapport d'agent n'est pas une preuve** : 737 lignes dans
`sessions/`, **605 dans `archives/`** ; et sur douze numéros tirés parmi les « introuvables »,
**douze** existaient dans `archives/`.

**Le même défaut avait déjà été trouvé et corrigé ailleurs** : `categorizeAllSessions()` porte
« ARCHIVE COMPRISE : une tâche archivée reste une tâche du projet » depuis le 2026-09-29, après y
avoir laissé 56 % du registre hors de vue. Le lecteur canonique existait **trois jours avant** la
dernière retouche du lecteur fautif — l'Article 24 mot pour mot, et le nouveau venu n'avait rien
hérité. La correction **relaie** `listerLesFichiersDeTaches()` au lieu de recopier son chemin.

**Pourquoi personne ne l'avait vu** : `god plans` n'est invoqué par rien — aucun item de Ronde,
aucun crochet, aucun document de process. Il faut le taper à la main, et rien ne dit de le taper
(**L2**). Lui donner un item de Ronde n'a de sens qu'**après** cette correction, sinon on branche
119 fausses alarmes dans la Ronde (**L4**).
