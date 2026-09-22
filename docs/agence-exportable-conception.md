# L'agence exportable — fichier de conception du projet SUIVANT

*Créé le 2026-09-22 à la demande explicite de l'utilisateur : « par rapport à une vraie agence, ou
par rapport à d'autres modeles concurrents, que manque-t-il à notre agence ? cree un fichier qui
consigne les idees qui traitent de la conception de la vraie future agence exportable (projet
suivant, apres la maison). »*

## Ce que ce fichier est, et ce qu'il n'est pas

**Il n'est pas** un document de travail sur « Maison IA vivante ». Rien ici ne gouverne le code
actuel, aucune idée consignée ici n'a à être appliquée au projet en cours. L'organisation de
l'Agence Codex telle qu'elle existe vit dans `docs/referentiel/organisation-agence.md` et son
chantier ouvert dans `docs/organisation-agence-conception.md`.

**Il est** le carnet du projet d'après : une agence d'outils d'IA **conçue pour être exportable dès
le départ**, plutôt que rendue exportable après coup. La maison aura servi de terrain d'essai — ce
fichier retient ce que ce terrain aura appris.

Conception ouverte, aucune décision actée. Chaque entrée porte son origine.

---

## Ce qui manque, face à une vraie agence

*Grille de lecture : dans une agence réelle, chaque manque ci-dessous coûterait un client, un
employé ou un procès. Ici ils ne coûtent rien d'immédiat — c'est précisément ce qui les rend
invisibles.*

### 1. Personne ne facture, donc personne ne sait ce que vaut le travail

Une agence sait ce que chaque prestation coûte et ce qu'elle rapporte. Ici, le coût est en partie
mesuré (Smart Conso API pour les appels, SMART-CONSO-TOKEN pour les tokens, et depuis aujourd'hui le
coût réel d'aider un outil : médiane 3 300 tokens), mais **la valeur produite ne l'est nulle part**.
`objectifs-vs-resultats` s'en approche ; le taux de trouvaille du compteur d'usage aussi. Aucun des
deux ne dit « cette prestation a valu la peine ».

Ce qui manque concrètement : une **unité commune** entre ce qu'une vérification coûte et ce qu'elle
évite. Sans elle, on ne peut pas arbitrer entre deux outils, seulement les lancer tous les deux.

### 2. Aucun client, donc aucune commande

Dans une agence, le travail entre par une demande. Ici, l'écrasante majorité du travail est
**auto-généré** : les outils produisent des constats, les constats produisent des tâches. Le chiffre
mesuré le 2026-09-22 est brutal — **86,6 % des tâches (323 sur 373) ne touchent pas au jeu**,
l'objet même du projet.

Ce n'est pas nécessairement un défaut (l'outillage est un investissement réel), mais une agence qui
consacre 87 % de son temps à sa propre organisation aurait fermé. Le projet suivant doit porter
cette question dès sa conception : **quel mécanisme garantit qu'une majorité du travail sert le
produit ?**

### 3. Pas de recrutement, pas de départ

Des outils entrent (28 à ce jour). Aucun n'est jamais parti. CLEAN-DIRTY-OLD détecte la stagnation,
CASSANDRA signale les outils jamais sollicités — mais **aucun mécanisme ne retire un outil**, et
aucun ne dit à quelles conditions un retrait serait légitime.

Une vraie agence a une porte de sortie. Sans elle, le paysage ne peut que grossir, et chaque nouvel
arrivant paie le coût de tous les précédents (sept registres à renseigner aujourd'hui — combien à
cinquante outils ?).

### 4. Pas de client insatisfait — le seul retour vient de l'utilisateur lui-même

Le dispositif d'évaluation construit le 2026-09-22 (EVAL-DEV, les 8 juges, la fenêtre de fin de
Ronde) est un vrai progrès : il fait remonter la voix de l'utilisateur dans la mécanique. Mais il
reste **une seule voix**, et c'est celle qui a commandé le travail.

Ce qui manque : une source de jugement qui ne soit ni l'agent, ni ses outils, ni le commanditaire.
THE-FINAL-JUDGE (agent séparé, sans mémoire du projet) est le seul embryon existant — coûteux, donc
rare.

### 5. Aucune spécialisation qui se perde

Dans une agence, un employé qui change de poste emporte son savoir-faire ou le transmet. Ici, chaque
outil est un fichier : son savoir vit dans son code et ses registres, ce qui est **mieux** qu'une
agence réelle. Mais rien ne capitalise **entre** outils : TOOL-LEARNING mesure si un outil apprend,
jamais si l'équipe apprend.

Question ouverte pour le projet suivant : existe-t-il une mémoire **collective** — une leçon apprise
par un outil et immédiatement disponible aux autres ?

---

## Ce qui manque, face aux modèles concurrents

*Honnêteté préalable : aucun benchmark n'a été conduit. Cette section pose des angles à instruire,
jamais des faits établis — la distinction vaut d'être tenue, c'est celle que tout ce projet
s'impose ailleurs.*

- **Le format de distribution.** Les écosystèmes d'outils d'IA se distribuent (paquets, registres,
  extensions). Ici, l'export se fait par des blueprints en prose qu'une IA doit relire et
  réimplémenter. SAFE-EXPORT vérifie que c'est possible ; rien ne le rend **facile**.
- **L'installation.** Aucune commande ne dit « installe cette agence sur mon projet ». Le chantier
  d'exportabilité s'arrête aujourd'hui à « le texte ne trahit pas le projet d'origine ».
- **La composabilité.** Les outils s'appellent entre eux par imports directs et chemins en dur. Un
  outil qu'on voudrait prendre seul emporte ses voisins.
- **L'interface.** Tout passe par des scripts en ligne de commande et des rapports texte/HTML. Ce
  choix est assumé et documenté (indépendance vis-à-vis d'un outillage particulier, Article 27) —
  mais il a un prix en adoption, et ce prix n'a jamais été chiffré.

---

## Ce que la maison aura appris, et qu'il faut emporter

*Les acquis, à ne pas reconstruire de zéro.*

1. **Trois états, jamais deux.** Mesuré / pas mesuré / pas mesurable. Retenu / écarté / à trancher.
   Le défaut le plus coûteux et le plus discret de ce projet aura été de servir une mesure ADJACENTE
   ou ABSENTE à la place de la mesure visée — un registre vide rendu comme « rien à signaler ».
2. **Un registre se LIT, il ne s'énumère pas** (Article 24), et un lecteur qui ne trouve rien est
   suspect avant que le dépôt ne le soit.
3. **Un rapport n'est pas fini quand il est écrit, mais quand ses constats sont devenus des tâches**
   (Article 28).
4. **Le POURQUOI vit à côté du QUOI** (Article 27), sinon le prochain agent supprime le garde-fou.
5. **Une limite qu'aucun mécanisme ne peut porter se DÉCLARE** plutôt que de se taire.
6. **Un garde-fou qui peut se taire tout seul ne garde plus rien** — leçon payée le 2026-09-22 : je
   m'étais donné le pouvoir de filtrer mes propres alertes.
7. **Un mécanisme qui ne sort pas du script est une intention** — payée le même jour : toute une
   escalade calculée et jamais affichée.
