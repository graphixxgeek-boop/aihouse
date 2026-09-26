# check-profile — plan générique : le banc d'essai isolé d'un mécanisme risqué

*(Blueprint réutilisable. Instanciation : `docs/referentiel/check-profile.md`.)*

## Le problème : éprouver la partie risquée SANS payer tout le reste

Dans un système génératif, une poignée de mécanismes concentrent le risque : ceux où le modèle
produit librement un contenu sensible, jugé par un humain et par rien d'autre. On ne peut pas les
régler en relançant le système complet — c'est long, cher, et le résultat est noyé dans tout le
reste.

Le banc d'essai isole **ce mécanisme-là**, l'alimente avec des entrées choisies, et affiche ses
sorties brutes pour une lecture humaine.

## Les quatre règles

1. **Il ne réimplémente pas le mécanisme** : il appelle le même prompt et le même modèle que la
   production. Un banc qui simule la production ne prouve rien sur elle.
2. **Ses entrées sont CHOISIES pour couvrir les cas extrêmes**, jamais tirées au hasard. Un banc qui
   ne voit que des cas moyens dit toujours que tout va bien.
3. **Il coûte de vrais appels** — donc il se lance à la main, jamais en continu, et toujours après
   avoir consulté ce qui régule la consommation.
4. **Ses heuristiques ne dispensent jamais de lire.** Un détecteur mécanique ne repère que les
   dérives les plus grossières ; le jugement reste humain, et l'outil doit le dire.

## LE PIÈGE QUI L'A FAIT GELER, et il vaut pour tout banc d'essai

Un banc est écrit **avant** le mécanisme qu'il éprouve, pour valider une conception. Son en-tête dit
alors, en toute honnêteté : « le mécanisme réel n'existe pas encore ». Puis le mécanisme est
construit — et personne ne revient sur l'en-tête.

**Un outil dont l'en-tête ment sur son objet ne peut plus être ni promu ni lancé en confiance.** Il
ne casse rien ; il sort simplement de l'équipe, en silence, parce que plus personne ne sait s'il
mesure encore quelque chose. C'est la dette documentaire appliquée à un fichier de code plutôt qu'à
un document — et elle se paie plus cher, parce que rien ne vérifie l'en-tête d'un script.

**Conséquence pour qui écrit un banc** : la date de bascule « conception → mécanisme réel » est un
rendez-vous à prendre le jour où l'on écrit l'en-tête, pas un souvenir.

## Le contre-poison

Quand un banc est réactivé, on **VÉRIFIE** que le mécanisme existe vraiment dans le code avant de
réécrire l'en-tête — on ne le suppose pas. Et la meilleure preuve est celle que la production donne
d'elle-même : quand le code de production **NOMME le banc** dans ses commentaires, le lien est
établi dans les deux sens et ne peut plus se perdre.
