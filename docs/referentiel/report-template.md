# report-template — fiche d'instanciation

*(Blueprint générique : `docs/report-template-blueprint.md` · script : `scripts/report-template.mjs` · registre : `docs/report-template/index.md`.)*

## Ce qu'il sert ici

`scripts/report-template.mjs` (2026-09-22, tâche #199), sur sa demande :

> « doc-report nouvelle fonction : s'assurer que tous les reports ont le même format, gabarit : ce
> format est graphique (txt ou html, mise en page, couleurs) mais aussi au niveau du contenu :
> message d'en-tête, titres, façon de présenter, organisation, structure… Il y a une place dans
> chaque report pour pouvoir importer une phrase générique, comme le problème qu'on a eu à devoir
> insérer la phrase "résultats non garantis". »

## L'asymétrie mesurée avant d'écrire une ligne (Article 19)

Les rapports HTML partageaient **déjà** un contrat unique via `html-report.mjs` — c'est pour ça
qu'ils se ressemblent tous. Les rapports texte, eux, étaient écrits à la main par chaque outil.

## Ce qu'il porte ici

L'en-tête commun (version de Claude, date, état du code, outil, santé, gravité), l'avertissement
d'inexactitude des outils heuristiques, et le titre du plan d'action (Article 28).

## Qui le surveille

`pure-gold-unity` repère les outils qui produisent un rapport **sans** passer par ce cadre — et sa
limite est déclarée : il reconnaît la conversion à la présence d'un appel dans le code, jamais en
lisant le rapport produit.

## Sa limite ici

Un outil peut appeler le cadre sans s'en servir. Le scan le verrait conforme.

## La concordance à deux outils (2026-09-28, tâche #695, volet E des « failles des IA »)

**Le chiffre qui a motivé ce volet.** La vérification par une source **indépendante** est la seule
mitigation mesurée qui fasse tomber le taux de « faux succès » — un résultat annoncé juste et qui ne
l'est pas — **d'environ 48 % à 3 %**. Aucune relecture par le MÊME outil n'en approche : un outil
qui se relit reproduit son propre angle mort. La nuit du 2026-09-28 en a donné sept exemples
d'affilée, tous de la même famille (un signal adjacent lu comme le signal visé).

**Ce que le mécanisme fait.** Un constat peut se déclarer `critique`. Dans ce cas il n'entre pas en
action seul : il s'affiche **🔁 À CORROBORER** jusqu'à porter un `corrobore: { outil, constat }`
nommant un **second outil, forcément différent de celui qui rapporte**. Une fois corroboré, il
s'affiche `→ RETENU [confirmé par <outil>]` — le sceau **nomme** qui a confirmé, sans quoi la
lecture ne peut pas juger si la source était vraiment indépendante.

**Ce qu'il ne fait pas, et c'est essentiel.** Il n'efface jamais la trouvaille. Le constat reste
visible, chiffré et nommé ; **c'est le passage à l'ACTION qui attend, jamais la mesure**. Un
mécanisme qui ferait disparaître un constat non corroboré serait pire que pas de mécanisme du tout.

**L'auto-corroboration est refusée nommément.** Remplir la case avec son propre nom satisfait la
forme et rate tout le fond ; le rapport le dit (« il se corrobore LUI-MÊME ») plutôt que de traiter
le cas comme une case vide.

**Premier usage réel, et il n'a pas été fabriqué pour l'occasion** (leçon L2 : un mécanisme qui ne
sort pas du script est une intention — et un mécanisme câblé sur un cas inventé est pire, il a l'air
de marcher). Dans **AXA-CHECK** : une fonction fragile **proche d'un nœud sensible**, c'est-à-dire
du code non testé là où une casse se propage, et qui fausse en plus le score de robustesse que tout
le paysage consulte comme un fait. Sa gravité est établie par la **carte d'HARMONIA**, dérivée et
vérifiée mécaniquement contre elle depuis le 2026-09-21 (`findSensitiveNodesDivergingFromHarmonia()`).
**La seconde source existait déjà.**

**Dit franchement plutôt que laissé croire** : sur le dépôt d'aujourd'hui, ce critère ne correspond
à **aucun cas** — les trois nœuds sensibles vivent dans des fichiers de jeu bien couverts. **Ce zéro
est un bon résultat**, et la nuance compte : le câblage porte sur un critère réel qui se déclenchera
le jour où un tel cas apparaîtra.

**Le reste est opt-in, et c'est une question ouverte.** Quels constats méritent l'étiquette
`critique` est une décision de conception, pas une déduction : la poser d'office sur tout ce qu'un
Gardien sacré du code trouve bloquerait le paysage entier du jour au lendemain. La liste des outils qui la
portent se décide avec l'utilisateur (Article 16).

## L'abstention calibrée (2026-09-28, tâche #695, volet F des « failles des IA »)

**Ce que la recherche dit.** Avec la vérification indépendante (volet E ci-dessus), l'abstention
calibrée est **l'autre** mitigation qui tient réellement contre le faux succès. Les deux ne se
remplacent pas : la première attrape ce qu'un outil affirme **à tort**, la seconde ce qu'il affirme
**sans base**.

**Ce que le dépôt savait déjà faire, mesuré plutôt que supposé** : sur 82 scripts, **49 savent déjà
s'abstenir** (`⚪ PAS MESURÉ`, `mesurable: false`). C'est un acquis réel de ce projet, pas un manque.

**Mais quinze d'entre eux s'abstiennent sans aucun degré** : ils disent « je n'ai pas pu mesurer »
et s'arrêtent là. Or **« je n'ai rien pu lire du tout » et « j'ai lu, mais je ne suis sûr qu'à
moitié » appellent deux réactions opposées** — les rendre de la même façon oblige la lecture à
deviner laquelle on lui sert.

**Deux fonctions, dans le gabarit partagé**, donc disponibles aux 47 outils d'un coup plutôt
qu'outil par outil (Article 24) :

- **`jeNeSaisPas({ quoi, pourquoi, ceQuiManque })`** — rend la ligne `⚪ PAS MESURÉ` dans la forme
  déjà employée partout, et **exige de nommer ce qui manquerait pour savoir**. C'est son apport
  principal : sans ça, « pas mesuré » est un cul-de-sac que personne ne peut lever, et **une mesure
  impossible pour toujours est indiscernable d'une mesure simplement oubliée hier**.
- **`avecConfiance(verdict, palier, pourquoi)`** — attache un degré déclaré. Les trois paliers sont
  **ceux qu'ARGUS emploie depuis toujours** ici : `confirmé` / `probable` / `à surveiller`. Un
  quatrième mot inventé au passage est **refusé** — rouvrir le vocabulaire flottant que
  l'Article 20bis a fermé coûterait plus que ça ne rapporte. Et **« probable » sans raison est
  refusé aussi** : ce n'est pas un degré de confiance, c'est une précaution de style.

**Aucun outil ne change d'office.** C'est une forme **offerte**, jamais imposée : un outil qui ne
les appelle pas rend exactement ce qu'il rendait hier. Un dispositif qui réécrirait la sortie des 47
outils du jour au lendemain serait refusé plutôt qu'adopté.

**Premier appelant réel** : `route-booster`, dont l'abstention existait déjà et disait l'essentiel —
ce qu'elle ne faisait pas, c'était le dire dans la **même forme** que les autres, et nommer la
sortie de secours.

**L'adoption est remesurée à chaque passage du filet**, jamais promise. C'est la seule façon qu'un
dispositif opt-in ne devienne pas du décor sans que personne ne s'en aperçoive (L6).

## Le nom de champ se DÉRIVE, et l'alarme pour le douzième (2026-09-29, tâche #1200)

**D'où ça vient, et c'est toute la leçon.** CLONE-HUNTER a signalé deux blocs quasi identiques,
`scripts/check-profil-utilisateur.mjs:110` et `scripts/le-regisseur.mjs:236` — le même appel de cinq
lignes à `planDactionDepuisEcarts()`. Les fondre parce qu'ils se ressemblent n'aurait rien réglé. La
question posée à la place, celle que la tâche #1199 avait inscrite en règle — *« POURQUOI ces deux
blocs existent, jamais les fondre parce qu'ils se ressemblent »* — a rendu une réponse tout autre :
le gabarit ne savait pas lire le champ `quoi`. Sa chaîne de libellé par défaut ne connaissait que
`message` et `pourquoi`, si bien que **onze** outils réécrivaient `libelle: (e) => e.quoi` et
**sept** réécrivaient `tache: (e) => e.quoiFaire` à côté. Le doublon n'était que la trace visible du
vrai défaut : un nom de champ recopié onze fois, exactement ce que l'Article 24 interdit — *un
nouveau venu hérite de ce que l'équipe sait déjà faire*.

**Ce qui change** : `CHAMPS_DU_LIBELLE` (`message`, `pourquoi`, `quoi`) et `CHAMPS_DE_LA_TACHE`
(`quoiFaire`) sont deux listes lues par `libelleParDefaut()` et `tacheParDefaut()`. Un outil dont
les écarts portent l'un de ces noms n'a plus rien à déclarer.

**Ce qui ne change pour personne, et c'est MESURÉ, jamais supposé** : `message` et `pourquoi`
restent en tête de chaîne, un `libelle` ou un `tache` déclaré l'emporte toujours sur le défaut, et
sept outils rejoués avant/après (`check-suivi-fidelity`, `agent-des-noms`, `le-regisseur`,
`check-profil-utilisateur`, `check-tasks-details`, `integration-outil`, `filet-en-parts`)
impriment des plans d'action **strictement identiques**.

**L'alarme, et pourquoi elle compte plus que le défaut.** Le défaut couvre les champs écrits
AUJOURD'HUI. Le douzième outil qui nommera le sien autrement — `souci`, `probleme`, `defaut` —
retombe sur `String(objet)` et imprime `[object Object]` dans son plan d'action. **Et le rapport
resterait vert** : `reportHasPlanDaction()` verrait bien une section, `sansTache` ne verrait rien
d'anormal, et le constat serait illisible sans que rien ne le dise. Un signal ADJACENT (« la section
existe ») lu comme le signal visé (« le constat se lit ») — la classe d'erreur dominante de toute
cette nuit. `buildPlanDaction()` imprime donc désormais une ligne `🚨` qui NOMME les champs connus,
pour que la correction se lise sans ouvrir le gabarit.

**Elle ne peut pas accuser à tort (leçon L4)** : seule la stringification d'un objet produit cette
chaîne exacte. Un écart sain, une chaîne de caractères toute simple et un plan vide ne sont jamais
accusés — les trois cas sont couverts par un contre-test.

**Ce qui n'a PAS été fait, avec sa raison écrite (Article 28, état ÉCARTÉ)** : les onze accès
explicites n'ont pas été retirés des onze outils. Ils ne sont pas faux, seulement redondants ; les
retirer toucherait onze fichiers pour zéro changement de comportement, ce qui est un risque sans
contrepartie pendant une nuit autonome. CLONE-HUNTER continuera donc de signaler cette paire, et
c'est honnête : le vrai défaut qu'elle cachait est réparé, la ressemblance de surface reste.

**Suite immédiate, et elle est instructive (2026-09-29, tâche #1201)** : les deux fonctions posées
ci-dessus étaient elles-mêmes deux boucles identiques, à leur repli près. CLONE-HUNTER les a
signalées dans le commit MÊME qui réparait le doublon d'origine — l'outil a mordu son auteur sur la
faute qu'il venait de faire corriger chez onze autres. Le parcours est donc partagé
(`premierChampRenseigne()`), et chaque repli reste écrit à côté de la fonction qui le porte : pour
le libellé `String(e)`, pour la tâche `null`, parce qu'une tâche inventée dans le gabarit passerait
pour une tâche écrite par l'outil.

## `fenetreDuCompteur()` — la ligne de santé ne dit plus « jamais sollicité » toute seule (2026-09-30, tâche #1283)

**Pourquoi ici et pas ailleurs** : cette ligne s'imprime en tête de **chaque** rapport du dépôt.
C'est la phrase la plus diffusée du projet, donc celle où un verdict d'absence mal formulé fait le
plus de dégâts.

**Le cas réel qui l'a déclenchée** : le 2026-09-28, `check-spirit` a affiché « jamais sollicité
d'après le compteur » **dans l'en-tête d'un rapport qu'il était en train de produire**. Il venait
de tourner ; il l'annonçait dans la même page. La cause n'était pas lui : le journal d'usage est
dans `.gitignore` et n'avait que quelques heures de mémoire.

`fenetreDuCompteur(evenements)` rend la borne en clair — `« (23 h de mémoire — pas jamais utilisé
par le projet) »` — et **`« (fenêtre inconnue) »` quand aucun horodatage n'est lisible**, jamais
`« 0 h »`, qui se lirait comme une mesure fraîche au lieu d'une absence de mesure.

**Ce qu'elle ne fait pas** : recopier le calcul de `horizonDuJournal()`. Elle dérive la même borne
depuis les mêmes événements pour tenir en quelques mots ; la phrase longue reste chez tool-brain.
