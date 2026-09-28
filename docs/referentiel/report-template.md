# report-template — fiche d'instanciation

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
