# Organisation de l'Agence — dossier de conception des évolutions

*(2026-09-22, ouvert sur demande explicite : « mets bien toutes les idées par rapport à
l'organisation dans le fichier dédié, pour ne rien perdre ». Le référentiel canonique de
l'organisation reste `docs/referentiel/organisation-agence.md` — celui-ci accueille les ÉVOLUTIONS
proposées et pas encore actées, pour qu'aucune ne se perde entre sa formulation et sa mise en
œuvre. Applique la règle de restitution de la valeur : sa formulation ET la réponse travaillée.)*

## 1. Le constat qui ouvre le chantier

L'organigramme tient aujourd'hui **deux axes** bien séparés (Statut de documentation ; Rôle dans
l'organigramme). Ils ne suffisent plus, et la preuve est arrivée d'elle-même : les **8 membres du
JURY** construits le 2026-09-22 appartiennent à **quatre rôles différents** et n'ont en commun que
de détenir de la donnée sur l'utilisateur. Les forcer dans les deux axes existants produirait
exactement le mélange de catégories que ce référentiel a été écrit pour empêcher.

## 2. Idée de l'utilisateur — les catégories transverses

> « le fait de me juger est identifié par l'organisation. Les membres qui me jugent sont dans la
> categorie "jury" une categorie transverse. Il y a d'ailleurs pas mal de categories transverses
> identifiées, il faudra vraiment qu'on clarifie l'organisation. Beaucoup d'infos, je compte sur toi
> pour m'aider à s'y retrouver et proposer un schéma d'agence propre et intelligent, pertinent. »

## 3. Idée de l'utilisateur — mémoire et apprentissage comme critères transverses

> « la memoire et l'apprentissage : encore des criteres transverses pour l'organisation
> (potentiellement des flags, des icones) »

Et le principe qui les motive, formulé juste avant :

> « pour tous les agents qui le meritent : veille à ce que tous apprennent par leur experience, mais
> aussi grace à toi. Un peu comme eco-token, tu eduques les outils petit à petit, en plus qu'ils
> s'eduquent eux-mêmes. ceci fait partie du principe d'evolutivité : evolutivité : à la fois pouvoir
> etre exporté, en meme temps avec des capacités accrues grace à l'apprentissage. »

**Ce que cette formulation ajoute, et qui n'était pas dans l'Article 24** : jusqu'ici l'évolutivité
voulait dire « accueillir un membre de plus sans modifier sa propre logique ». Il y ajoute un
second sens, orthogonal : **un outil doit devenir MEILLEUR avec le temps**, par sa propre expérience
et par ce que l'agent lui transmet. Un outil exportable mais figé satisfait la première moitié et
rate la seconde.

## 4. Réponse synthétisée — les axes transverses repérés

Sans enquête exhaustive (elle reste à faire), **six coupes transverses** se repèrent déjà, et aucune
ne coïncide avec les deux axes existants :

| Axe transverse | Ce qu'il regroupe | Pourquoi il est transverse |
|---|---|---|
| **Jury** | les 8 qui détiennent de la donnée sur l'utilisateur | 4 rôles différents, aucun rapport de rang entre eux |
| **Producteurs de rapport** | ceux qui livrent un document lisible | un Gardien et un Utilitaire peuvent tous deux en produire |
| **Automatiques à chaque commit** | les 6 Gardiens sacrés + check-house | c'est un critère de DÉCLENCHEMENT, pas de rang |
| **Coûteux en API** | ceux qui consomment réellement | orthogonal au rôle : un Membre peut coûter, un Agent Cadre non |
| **Gardiens de process** | circle / simulation / tâches / god / angel | ils gardent un DÉROULÉ, pas une qualité de code |
| **Porteurs de garde-fou d'évolutivité** | les 12+ qui détectent une divergence de registre | une capacité, jamais un grade |

**À ajouter, sur sa demande du 2026-09-22** : **mémoire** (l'outil garde-t-il une trace de ses
passages ?) et **apprentissage** (devient-il meilleur ?). Ces deux-là sont différents des six
au-dessus : les six décrivent ce qu'un outil EST ou FAIT, ces deux-là décrivent sa **trajectoire**.
Idée associée de l'utilisateur : les marquer par des **flags ou des icônes** plutôt que par une
septième liste — un signe visible à côté du nom se lit d'un coup d'œil dans un organigramme, là où
une catégorie de plus l'alourdit.

**Distinction à ne pas perdre entre mémoire et apprentissage** : un outil peut très bien avoir une
mémoire sans rien en faire (il écrit son registre et ne le relit jamais), et c'est le cas le plus
fréquent aujourd'hui. Mémoire = il garde une trace. Apprentissage = cette trace change ce qu'il
fait ensuite. Les fusionner ferait passer une dizaine d'outils pour apprenants alors qu'ils ne font
qu'archiver.

## 5. Question ouverte — un agent responsable de l'apprentissage ?

> « est-ce qu'on cree un agent script responsable de l'apprentissage ? utile ou pas ? »

**Réponse à ce stade, à confirmer** : probablement NON comme agent séparé, OUI comme capacité
confiée à un existant. Trois raisons, dans l'ordre de force :
1. **CASSANDRA-RH est déjà l'agent RH** — elle note l'équipe, supervise les badges, propose des
   formations. « Est-ce que ce membre progresse ? » est littéralement une question RH, et la lui
   retirer créerait deux agents qui jugent les mêmes membres sur des axes voisins.
2. **data-archangel porte déjà la circulation** de ce que les outils savent, tendances comprises.
3. Un agent de plus qui surveille les autres sans produire lui-même est exactement le genre
   d'ajout que §7ter interdit — et le paysage en compte déjà beaucoup.

**Ce qui manque vraiment n'est pas un agent, c'est un CRITÈRE mesurable** : qu'est-ce qui prouve
qu'un outil a appris ? Sans réponse à ça, un agent de l'apprentissage produirait un avis, pas une
mesure. À trancher avec l'utilisateur.

## 6. Statut

Conception ouverte, aucune décision actée. Le schéma d'organisation complet est à produire — l'ordre
fixé par l'utilisateur le 2026-09-22 place ce chantier **après** la création du nouvel outil
d'exportabilité et la Ronde, et **avant** CASSANDRA.
