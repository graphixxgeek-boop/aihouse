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
