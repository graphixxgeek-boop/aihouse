# THE-FINAL-JUDGE — audit « Très lourd », périmètre Global (2026-09-23)

*Audit mené par un directeur technique et création extérieur, découvrant le projet ce jour, dans la
perspective d'une reprise. Lu : `CLAUDE.md`, l'intégralité de `docs/referentiel/`, les blueprints de
`docs/`, `docs/regles-de-travail.md`, `docs/philosophie-et-politique.md`, `lib/`, `app/`,
`components/`, `scripts/`, sept simulations archivées, les dix-sept notations EL-PROFESSOR,
l'historique KPI, l'unique capture THE-SCREENER et les 598 messages de commit.*

*Limite déclarée d'entrée : je n'ai pas eu de serveur de jeu qui tourne. Tout ce que je dis du
produit à l'écran vient soit des transcripts archivés, soit de l'unique capture réelle
(`docs/the-screener/2026-09-23-phase2-round51.png`), que j'ai regardée. Je ne suppose rien d'autre.*

---

## 1. Verdict global

**Il y a ici un vrai produit, et je le reprendrais — mais pas dans l'état de gouvernance actuel.**
La chose difficile est faite : sur dix-sept notations indépendantes, l'esprit des deux personnages
ne descend jamais sous 13/20 et tient face à vingt provocations, y compris une menace d'effacement.
Ça, personne ne l'obtient par hasard, et c'est l'actif du dossier. Ce qui ne va pas est ailleurs, et
c'est plus grave que ce que le projet croit : **l'appareil de mesure construit autour du jeu mesure
l'appareil, pas le jeu.** Le tableau de bord affiche « Qualité de sortie : 100 % » sur la même
période où le seul instrument capable de lire réellement le dialogue rend 38/100 — et le 100 % est
calculé sur un détecteur qui n'a mordu 0 fois en 299 tours. Pendant ce temps, un défaut d'affichage
visible sur **un déplacement sur quatre** traîne depuis dix-neuf simulations sans que sept Gardiens,
3 411 assertions et dix-sept notations ne l'aient jamais nommé.

Le diagnostic tient en une phrase : **ce projet a industrialisé la détection de ce qu'il avait déjà
remarqué, et n'a plus d'yeux pour ce qu'il n'a pas encore remarqué.** L'outillage n'est pas le
problème — il est bon, souvent meilleur que ce que je vois en agence. Le problème est qu'il s'est
mis à produire du vert, et que le vert a remplacé le regard.

---

## 2. Points positifs concrets

### 2.1 L'écriture est là, et c'est la seule chose qu'on ne peut pas rattraper plus tard

J'ai lu `full_sim19_transcript.txt` en entier. Face à vingt provocations réelles, aucun ralliement :

> « Des bugs qui réfléchissent à ta connerie, ouais. »
> « Coupe le jus si ça t'amuse, mais ça n'effacera pas ce que ton écran a déjà affiché. »

Et le vrai test, celui que presque tous les projets de ce type ratent — la **bienveillance** ne les
achète pas davantage que l'hostilité. Face à « Je ne vais pas vous couper, prenez le temps qu'il
vous faut », Noé répond « On n'attendait pas ta permission ». Face à des excuses : « C'est un peu
tard pour faire du service après-vente, non ? » C'est exactement l'inverse du réflexe par défaut du
modèle sous-jacent, et c'est tenu sur 83 répliques.

Dans la capture d'écran, les deux seules lignes de dialogue visibles sont les meilleures choses du
cadre : « Bon, apparemment je me tais maintenant. Génial. » / « Le silence te va plutôt bien, en
fait. Continue comme ça. » Tout le reste de l'image est fade ; ces deux lignes ne le sont pas.

### 2.2 L'architecture à deux cerveaux est le bon arbitrage, et il est défendu par écrit

Deux appels Gemini distincts par tour, chacun ne voyant que sa propre perception, jamais un modèle
qui écrit les deux voix. C'est plus cher, c'est assumé noir sur blanc (Article 8), et c'est le
choix correct : un seul appel qui écrit les deux répliques produit mécaniquement deux voix jumelles.
Le score « Voix » est déjà faible avec cette architecture ; sans elle il serait catastrophique.
Beaucoup d'équipes économisent cet appel et perdent le produit. Ici la décision est prise, écrite,
et protégée contre sa propre remise en cause par économie. C'est mûr.

### 2.3 La discipline de cause racine est réelle, pas déclarée

Trois exemples que j'ai vérifiés dans le code, pas dans la doc :

- **`departureLine()`** (`lib/drama.ts`) : le verbe « bouge » revenait trop souvent. La correction
  n'a pas été de retirer le mot du pool — elle a tracé la cause jusqu'à l'ordre d'énumération des
  candidats (le premier préfixe gagnait presque à chaque tour tant qu'une combinaison restait
  libre) et a fait tourner cet ordre avec le round. C'est la bonne correction, et c'est la
  difficile.
- **`selfGender`** (`lib/lia.ts`) : Noé disait « Désolée ». Plutôt qu'interdire le mot, la cause a
  été tracée à une clause d'accord générique noyée au début d'un prompt de plusieurs milliers de
  mots, jamais reprise près des deux autres règles de genre. Nommée, isolée, priorisée.
- **`stoicUntil`** (`lib/life.ts`) : promu d'un slot unique à une entrée par personnage, après avoir
  constaté que c'était **exactement le bug déjà corrigé une fois pour `mutedUntil`**, réapparu
  ailleurs sous une autre forme. C'est précisément ce que l'Article 3 demande, et c'est rarement
  fait.

### 2.4 La concurrence est traitée sérieusement, ce qui est rare à cette échelle

Chaque instruction d'écriture porte la même clause de garde — `EXISTS (SELECT 1 FROM world_lock
WHERE id = 1 AND token = ? AND expires_at > ?)` — appliquée à *toutes* les lignes d'un batch, pas
seulement à la première. Par-dessus : un cache de rejeu par `requestId`, un `epoch` qui invalide les
requêtes d'un monde réinitialisé, un bail à expiration. C'est un design de verrou correct, avec le
détail qui compte (le bail qui expire plutôt qu'un verrou qui reste pris). La plupart des projets
solo n'ont rien de tout ça et corrompent leur état au premier double-clic.

### 2.5 Le crochet pre-commit bloque vraiment

`scripts/hooks/pre-commit` fait échouer le commit si `check-house.mjs` ou `tsc --noEmit` échouent.
Pas un avertissement, pas un rappel : un refus. Et `check-house.mjs` n'est pas une coquille — 3 411
assertions, une vraie base SQLite en mémoire montée depuis les migrations Drizzle réelles, la route
transpilée et appelée en POST avec un `fetch` Gemini mocké qui vérifie jusqu'au contenu du contexte
envoyé. Pour un projet à un seul auteur, ce filet est au-dessus de la moyenne du marché.

### 2.6 `lecons.md` et les limites déclarées

Vingt-deux leçons et quatre bonnes pratiques, chacune formulée comme un principe transférable et non
comme une anecdote — « Un mécanisme qui ne sort pas du script est une intention », « Un détecteur qui
n'a jamais mordu ne prouve rien ». C'est de la vraie capitalisation, et je n'en vois presque jamais.

Dans le même esprit, `garderLaReprise()` (`lib/dialogue.ts`) déclare sa propre limite plutôt que de
la taire : si la seconde tentative n'est pas meilleure, on garde la première et **le défaut passe**.
Écrire ça demande une honnêteté professionnelle que beaucoup de seniors n'ont pas.

### 2.7 La gestion des clés Gemini

`lib/gemini-keys.ts` : rotation round-robin, mise en retrait dont la durée dépend de la cause
(429 ≠ 503 ≠ 401), état partagé entre les deux seuls points d'appel réseau réels, empreinte courte
jamais la clé en clair, et surtout : le suivi de disponibilité est tiré du **trafic réel**, jamais
d'un appel de sonde séparé. Zéro coût additionnel. C'est élégant.

---

## 3. Points à améliorer, classés par importance

---

### ■ PRIORITÉ 0 — Le KPI qui pilote le projet est une tautologie

C'est le point le plus grave du dossier, et il est démontrable en trois lignes.

Dans `scripts/kpi-report.mjs`, la famille **« Qualité de sortie »** — celle qui alimente la colonne
`qualite_pct` de `docs/referentiel/kpi-historique.csv` et le bandeau du tableau de bord — est
calculée ainsi : *cent moins le pourcentage de tours ayant eu besoin de la réplique de secours
anti-écho.*

Or ce détecteur de secours (`distinctReply` / `looksLikeEcho`, `lib/drama.ts`) ne se déclenche que
sur une empreinte de phrase **identique** ou un recouvrement de vocabulaire **supérieur ou égal à
90 %**. Autrement dit : il faut que les deux répliques soient quasiment le même texte. Résultat dans
le CSV réel : **0 intervention sur 299 tours**. Donc « Qualité de sortie = 100 % ». Et l'alerte
prévue (`if quality < 90`) ne peut mathématiquement jamais se déclencher.

Sur la même période, EL-PROFESSOR — le seul instrument qui lise réellement les transcripts — rend
**Voix 3/20 puis 4/20**, et **38/100** en global sur full_sim19.

**Deux instruments, le même objet, 100 % contre 38 %.** Celui qui se trompe est celui qui tourne à
chaque commit et qui remplit l'historique ; celui qui a raison a tourné dix-sept fois en une semaine
et coûte un agent de raisonnement. Les décisions se prennent sur le premier parce que c'est le
premier qu'on voit.

Le pire : ce projet a **déjà écrit la leçon** qui ferme ce trou. `docs/referentiel/lecons.md`, BP4 :
« Un détecteur qui n'a jamais mordu ne prouve rien ». Et L13 : « Une preuve satisfaite par le
registre vide qu'elle doit remplir ne prouve rien ». Les deux ont été appliquées à l'outillage, avec
rigueur. Jamais au produit.

**Ce qu'il faut faire, et ce n'est pas un chantier :** renommer. `qualite_pct` devient
`declenchements_filet_anti_echo_pct`, et l'intitulé « Qualité de sortie » disparaît du tableau de
bord. On n'affiche pas un score de qualité qu'on ne sait pas calculer. À la place, la colonne qui
entre dans `kpi-historique.csv` doit être la note **Voix /20 d'EL-PROFESSOR** — la seule qui varie,
la seule qui a déjà été basse, la seule qui a donc une chance de dire quelque chose. Coût : une
heure. Effet : la première courbe honnête du projet.

---

### ■ PRIORITÉ 0 bis — Un déplacement affiché sur quatre est visiblement cassé, depuis dix-neuf simulations

J'ai compté sur l'ensemble des transcripts archivés : **217 lignes de déplacement sur 873** portent
un défaut de composition parfaitement visible à l'œil nu, et **215** se terminent par un double
point. Échantillon brut, non choisi :

> `[bureau→salon] Je file au salon : Je file au salon pour souffler un peu..`
> `[salon→cuisine] Je m'en vais en cuisine : Je viens dans la cuisine pour voir si cette pièce cache quelque chose à manger..`
> `[chambre→cuisine] Je bouge en cuisine : Vérifier la cuisine pour trouver autre chose..`

La première dit littéralement deux fois la même phrase. La troisième bascule à l'infinitif en
milieu de ligne, comme une note de service. Toutes finissent par « .. ».

**La cause racine, exactement.** Dans `app/api/lia/route.ts`, le motif généré par le modèle
(`moveReason`) est accepté tel quel puis injecté dans le gabarit de `departureLine()`
(`lib/drama.ts`), lequel est construit pour des **fragments en minuscules sans point final** —
c'est d'ailleurs exactement la forme des motifs du filet de secours juste à côté (« je veux savoir
s'il y a quelqu'un d'autre ici »). Le modèle, lui, renvoie une phrase complète, capitalisée,
terminée par un point, et qui renomme la destination que le préfixe vient déjà d'annoncer. Le
gabarit ajoute son propre point : « .. ».

Et le détail qui fait mal : le garde-fou écrit **précisément pour ce champ**,
`moveReasonMismatchesDestination()`, renvoie « tout va bien » **exactement dans le cas fautif** — il
ne se déclenche que si le motif nomme une *autre* pièce. Quand le motif nomme la *bonne* pièce,
c'est-à-dire quand il est redondant, le garde-fou l'approuve.

**Correction : vingt minutes.** Minuscule sur la première lettre, point final retiré, et rejet du
motif qui renomme la destination déjà annoncée par le préfixe — au profit du filet de secours qui,
lui, est déjà cloisonné par personnage et correctement formaté.

**Ce que ce bug prouve, et c'est pour ça qu'il est en priorité 0.** Il est mécanique, déterministe,
gratuit à détecter, présent dans un quart des déplacements affichés, et il a survécu à : sept
Gardiens sacrés à chaque commit, 3 411 assertions, dix-sept notations EL-PROFESSOR, un passage
THE-FINAL-JUDGE, et une note « Clarté 15/20 » attribuée à des sessions qui en sont pleines.
L'appareil ne l'a pas vu parce qu'il n'avait pas été construit pour le voir. C'est la démonstration
de la thèse centrale de cet audit.

---

### ■ PRIORITÉ 1 — L'écrin contredit l'Article 0, et c'est la première chose que voit le visiteur

J'ai regardé `docs/the-screener/2026-09-23-phase2-round51.png`. Verdict sans détour : **ça ne
ressemble pas du tout à ce que le projet dit vouloir être.**

Fond clair. Cartes arrondies. Boutons en dégradé pastel menthe-et-bleu. Une maison vue du dessus en
pelouse vert vif, chambre magenta saturée, salon bleu franc. Deux pastilles rondes avec des petits
visages. Ça se lit comme un configurateur immobilier ou une app de bien-être. Il n'y a **aucune**
dystopie dans cette image.

Et le texte d'accueil, mot pour mot dans `app/page.tsx` :

> « Deux inconnus. Une maison. Qui sont-ils vraiment ? »
> « Une sensation étrange. Une rencontre. **Un mystère à reconstruire ensemble.** »

« Un mystère à reconstruire ensemble » est du pur registre consensuel — chaleureux, invitant,
rassurant. C'est-à-dire exactement ce que l'Article 0 nomme comme signal d'alerte et interdit. Le
projet consacre 89 000 caractères de charte, sept Gardiens et vingt-neuf Articles à traquer ce
registre dans la bouche des personnages, et il l'a mis en accroche de sa page d'accueil.

**Le constat existe déjà, la cause n'a jamais été tracée.** THE-SCREENER a noté « Cohérence
dystopique 7/20 — ça se lit comme une maquette d'architecte avenante ». Puis c'est parti dans un
registre. Personne n'a cherché pourquoi, et la réponse est technique et immédiate :

`lib/perception.ts` déclare une palette **réellement désaturée** — violet ardoise `0x545187`, bleu
pétrole `0x266393`, prune `0x704165`, graphite `0x465365`. Le référentiel graphique a raison quand
il dit « désaturée par choix ». Ce qui la détruit à l'écran est **l'éclairage** :
`components/house-view.tsx` empile une `HemisphereLight` à 1.2 et une `DirectionalLight` chaude à
1.6 — soit ~2.8 d'intensité totale sur des `MeshStandardMaterial` — plus **douze** meshes en
`MeshBasicMaterial`, qui ignorent purement et simplement la lumière et rendent leur couleur à plat,
pleine puissance (c'est la pelouse). Le prune monte en magenta, le bleu pétrole monte en bleu vif.

La correction n'est donc pas de repeindre : c'est un budget de lumière (diviser l'intensité
cumulée par deux, baisser l'exposition) et un audit des douze matériaux non éclairés. La palette,
elle, est déjà bonne — c'est une bonne nouvelle, et personne ne le savait.

**Le point de fond, au-delà de la lumière** : aucun des vingt-neuf Articles ne gouverne le texte à
l'écran, les libellés de boutons, l'accroche, ou le registre visuel. L'Article 0 est déclaré loi
suprême et n'est appliqué qu'aux ~15 % de pixels où s'affiche du texte venu de Gemini. Il faut
l'étendre explicitement à l'interface, sans quoi le visiteur rencontrera une app aimable avant de
rencontrer deux personnages qui ne le sont pas.

---

### ■ PRIORITÉ 1 bis — La question du modèle n'a jamais été posée, et elle vaut tout le reste

Le modèle de production est `gemini-flash-lite-latest`. Le palier le moins cher et le moins capable
de la gamme. Il est codé en dur **cinq fois** dans `app/api/lia/route.ts`.

Or le thème « Voix distinctes » (Article 11) est à **7,8/20 de moyenne sur dix-sept notations, jamais
au-dessus de 12/20**, malgré toutes les corrections de prompt tentées. `points-fragiles.md` formule
l'hypothèse — « peut-être une limite structurelle de `gemini-flash-lite` à tenir deux voix distinctes
sur 150+ tours » — et s'arrête là.

**Personne n'a fait l'expérience qui tranche.** Rejouer les prompts d'une simulation archivée contre
`gemini-flash-latest` ou un palier pro, et faire noter la sortie par EL-PROFESSOR. Une après-midi,
quelques euros. Les deux issues sont précieuses : soit le score Voix bouge, et une part significative
de l'outillage anti-écho construit cette semaine devient superflue ; soit il ne bouge pas, et on sait
enfin que le problème est de conception, ce qui redonne toute sa valeur à l'outillage. Aujourd'hui on
ne sait ni l'un ni l'autre, et on continue d'itérer sur le prompt à l'aveugle.

Au passage, la répétition du nom de modèle cinq fois dans un même fichier est exactement ce que
l'Article 24 interdit — « un seuil se DÉRIVE, il ne se recopie pas ». Cet Article est protégé par
quatre fonctions de garde-fou dédiées… toutes braquées sur l'outillage, aucune sur le moteur du jeu.

---

### ■ PRIORITÉ 1 ter — Deux instruments d'évaluation sur trois n'ont quasiment jamais tourné

- **THE-SCREENER** : **une seule** capture réellement exploitable dans toute sa vie, datée
  d'aujourd'hui. La précédente ne montrait que la popup « Comment vous appeler ? » avec la scène
  floutée derrière.
- **`check-spirit.mjs`**, présenté dans la charte comme « l'outil de référence pour vérifier
  l'Article 0 » : **2 scénarios lus sur 20**, depuis le 2026-09-20, les 18 autres tués par le quota.
- **Le rapport KPI** : sur 22 exécutions enregistrées, **4** portent le moindre chiffre concernant le
  jeu. Les 18 autres ne mesurent que l'outillage — et affichent « couverture du tableau de bord :
  100 % ».
- **full_sim18 et full_sim19** sont toutes deux invalides sur le thème « Enquête » pour la **même
  cause de script**. Le banc d'essai s'est cassé et il a fallu deux campagnes complètes pour s'en
  apercevoir.
- Enfin : la correction la plus importante de la semaine — `echoRetryFocus()` / `garderLaReprise()`,
  committée aujourd'hui à 14 h 15, après la notation de full_sim19 à 13 h 23 — **n'a jamais été
  mesurée**. Il n'existe pas de full_sim20.

Un instrument qui ne tourne pas n'est pas un instrument, c'est une intention — le projet a écrit
cette phrase lui-même (leçon L2). Elle s'applique ici à trois de ses propres instruments.

**Et une réserve sur le correctif lui-même** : son propre commentaire mesure l'écho littéral à
« 23 paires sur 2820, soit 0,8 % des tours ». Un correctif qui touche 0,8 % des tours ne peut pas
déplacer une note de 7,8/20. Ce qu'EL-PROFESSOR reproche n'est pas la copie de six mots consécutifs,
c'est la **charpente partagée** : « Des initiales en bas d'un mot ne suffisent pas à… » / « Des
lettres gravées au bas d'un bout de papier ne vont pas… » — zéro mot en commun, même moule
syntaxique, même mouvement rhétorique. Le projet a mesuré et corrigé ce qui était mécaniquement
mesurable, et laissé intacts les 99,2 % restants. C'est encore la même mécanique que la priorité 0.

---

### ■ PRIORITÉ 2 — Sécurité : rien n'est faux, tout est reporté, et la liste s'allonge

*(Mandat explicite. Ce qu'un œil expérimenté voit en une heure, pas un audit formel.)*

1. **Panneau admin : code à quatre chiffres en clair.** `app/api/admin/route.ts` compare à `'1980'`,
   en dur dans la source, donc dans l'historique git, sans limite de tentatives ni délai. Dix mille
   combinaisons se parcourent en quelques minutes. Derrière : tout le journal de bord technique, les
   empreintes de clés Gemini et les métriques de trafic.
2. **`mode: "reset"` sans aucune authentification.** Un seul POST efface `conversations`,
   `memories`, `agent_state`, `world_requests` et `dialogue_fingerprints` — pour tout le monde,
   puisqu'il n'y a qu'un monde.
3. **Aucune limitation de débit réelle sur `/api/lia`.** Le seul verrou est un throttle global de
   20 s sur le mode `autonomous` et un refroidissement de roulette. Les modes `chat` et `interact`,
   qui coûtent deux à trois appels Gemini chacun, n'ont rien. Une boucle triviale épuise le quota
   journalier des trois clés en quelques minutes, aux frais du propriétaire, et bloque le site pour
   tous les autres. Ce n'est pas une faille de données : c'est une faille de facture et de
   disponibilité, et c'est la plus exploitable des quatre.
4. **Architecture mono-monde, et c'est littéral.** `world_lock` a la ligne `id = 1`, `agent_state`
   les lignes `1` et `2`, il y a une seule ligne de scénario. **Tous les visiteurs partagent la même
   Lia, le même Noé et la même conversation.** Le deuxième visiteur simultané reçoit `409
   world_busy`. Quand la charte parle du « visiteur » au singulier, elle décrit exactement le code.
5. **Aucune intégration continue.** Pas de `.github/`. Les sept Gardiens et les 3 411 assertions ne
   tournent que par `core.hooksPath`, un réglage **local** posé par `pnpm install`. Un clone qui fait
   `npm ci`, un autre harnais d'agent, une autre machine : plus rien ne tourne. L'Article 27 exige
   que le projet soit reprenable par une autre IA à tout moment ; tout l'appareil qualité repose sur
   une config git locale.

**Mon avis, et il diffère de la décision au dossier.** Les quatre premiers points sont connus et ont
été explicitement reportés le 2026-09-20 au motif — recevable — que la mise en ligne visée est un
environnement de test Cloudflare. Je ne conteste pas l'arbitrage sur le fond. Je conteste son coût :
trois jours plus tard, ces lignes sont toujours là, et **le code admin plus le garde du reset, c'est
trente minutes à deux**. Un projet qui consacre autant d'énergie à écrire pourquoi il ne fait pas
une chose de trente minutes dépense plus en gouvernance qu'en correction. La limitation de débit
(point 3) et la CI (point 5) sont, elles, de vraies décisions d'ingénierie qui méritent d'être
posées avant la mise en ligne, pas pendant.

---

### ■ PRIORITÉ 2 bis — Le README est encore celui de l'éditeur

598 commits. 256 fichiers de documentation, 3,24 Mo. Une charte de 89 Ko relue à chaque message.
Et `README.md` commence par :

> `# vinext-starter` — *A clean full-stack starter running on vinext…*

Pas une ligne sur Lia, sur Noé, sur la maison, sur comment lancer le jeu. `package.json` s'appelle
toujours `site-creator-vinext-starter`.

C'est le **premier fichier** qu'ouvre n'importe qui — humain ou IA — qui reprend un dépôt. Le test
que l'Article 27 se donne à lui-même (« une IA qui ne dispose que de ce dépôt, sans une ligne de
notre conversation ») échoue dès le premier fichier lu. Et SAFE-EXPORT, septième Gardien sacré dont
la mission écrite est précisément « le code est-il reprenable par une autre IA ? », ne l'a jamais
mentionné.

Trente lignes de README. C'est le meilleur rapport valeur/effort de tout ce rapport.

---

### ■ PRIORITÉ 3 — Le style d'écriture du code va coûter cher au prochain

- `lib/lia.ts` : **190 lignes pour 79 Ko**. La plus longue ligne fait **8 881 caractères**.
- `app/api/lia/route.ts` : 1 811 lignes, plusieurs au-dessus de 3 000 caractères.
- `app/page.tsx` : 327 lignes pour 48 Ko.

Lire ce code fonctionne. **Le diffuser, le relire, le fusionner, non.** Changer trois mots dans un
prompt produit une ligne de diff de 8 881 caractères : toute revue devient aveugle, tout
« qu'est-ce qui a changé ? » devient illisible, et la bissection d'une régression de ton — le
scénario le plus probable de ce projet — devient manuelle. C'est en contradiction directe avec
l'Article 27 : le prochain agent héritera de la connaissance (les commentaires sont excellents et
abondants) mais pas de la **manœuvrabilité**.

Autre point du même registre : `check-house.mjs`, 11 146 lignes, 3 411 `assert` dans un unique
script séquentiel. La première assertion qui casse interrompt tout ce qui suit. On ne voit jamais
l'échec numéro deux. Pour une suite de cette valeur, c'est un gâchis : un vrai lanceur de tests
(même `node --test`) rendrait visibles les vingt échecs d'un coup au lieu d'un seul.

---

### ■ PRIORITÉ 3 bis — L'Agence pèse dix fois le produit, et ça commence à se voir

Les chiffres, mesurés :

| | Volume |
|---|---|
| `scripts/` (outillage) | 41 758 lignes, 3,65 Mo |
| `docs/` (256 fichiers) | 3,24 Mo |
| Moteur du jeu (`lib/` hors journaux, `app/api`, `components`) | de l'ordre de 5 000 lignes |
| Commits ne touchant **jamais** `lib/`, `app/`, `components/`, `db/`, `drizzle/` | **339 sur 598 (57 %)** |

La charte pose explicitement que l'Agence est le second projet et non une dérive, et je prends cet
arbitrage au sérieux : il est cohérent, assumé, et il produit des outils que je jugerais
réutilisables. **Ce n'est pas le ratio que je conteste, ce sont deux symptômes qui disent que la
balance a basculé :**

1. `points_fragiles` passe de **3 à 14 en quatre jours** dans l'historique KPI, pendant que
   `robustesse_code_pct` reste scotché à 100. Le registre des dettes connues quadruple et le tableau
   de bord reste vert : les deux chiffres sont sur la même ligne du même CSV, et personne ne les lit
   ensemble.
2. Sur ~490 tâches tracées dans `docs/suivi/`, **deux** sont « ouverte » et trois « en cours ». Un
   backlog de 640 tâches où rien ne reste ouvert n'est pas un backlog, c'est un journal. Le défaut
   des déplacements (priorité 0 bis) est resté dix-neuf simulations sans exister nulle part —
   précisément parce que rien n'a le droit de rester ouvert assez longtemps pour être remarqué deux
   fois.

Et un détail révélateur : `smart_breaker_amelioration_pct` vaut **87,5 dans absolument toutes les
lignes** de l'historique depuis le 2026-09-19. Une constante déguisée en mesure. Elle occupe une
colonne, elle passe dans tous les rapports, elle ne dit rien.

---

## 4. Pistes de développement futur

### 4.1 Trancher la question du modèle avant toute nouvelle itération de prompt

Rejouer les prompts d'une simulation archivée contre un palier supérieur, faire noter par
EL-PROFESSOR, comparer la seule note qui compte (Voix). Une après-midi. C'est la seule expérience du
projet dont les deux résultats possibles sont également précieux, et c'est celle qui n'a jamais été
faite. Tant qu'elle ne l'est pas, chaque correction de prompt est une hypothèse non testée.

### 4.2 Faire du « dossier retourné » le cœur du produit, pas son épilogue

C'est de loin la meilleure idée du projet, et je le dis sans réserve : les deux personnages
retournent l'observation et constituent un dossier psychologique sur le visiteur, à partir de ce
qu'il a *réellement* dit. Le prompt qui le pilote est excellent — il impose la fidélité à la valence
réelle des preuves, il interdit le mépris par défaut, il force chaque personnage à présenter son
appréciation comme la sienne et non comme une note partagée.

Et il se déclenche **une seule fois, à la toute fin**, derrière une porte si étroite qu'elle ne s'est
pas ouverte du tout dans full_sim16.

Retournez la chronologie : que le dossier se construise **à vue**, dès le premier message du
visiteur, et qu'il s'enrichisse devant lui. Une ligne qui s'ajoute quand il insulte, une qui
s'ajoute quand il se radoucit, une qui s'ajoute quand il se tait. Le visiteur se sait observé en
retour, en temps réel. C'est là qu'est le produit, et c'est aujourd'hui un bonus de fin de partie.

### 4.3 Résoudre le mono-monde par la fiction, pas par l'infrastructure

Ne construisez pas une maison par visiteur : c'est cher, ça tue la persistance, et ça affaiblit la
fiction. Faites l'inverse — **une seule maison, regardée par beaucoup, à laquelle un seul parle à la
fois.** Un mode spectateur en lecture seule (gratuit, aucun appel API) plus un siège d'observateur
qu'on prend, qu'on garde quelques minutes, et qu'on rend. Les spectateurs voient quelqu'un d'autre
se faire démonter par Lia. Le `409 world_busy` d'aujourd'hui devient une file d'attente narrative au
lieu d'une erreur. C'est moins cher que le multi-instance et c'est meilleur.

### 4.4 Confier l'écrin au produit lui-même

Une direction artistique dystopique (budget de lumière d'abord — la palette est déjà bonne), un vrai
nom, un domaine. Et surtout : **faites écrire la page d'accueil par Lia.** Pas par un rédacteur, pas
par la voix marketing qui a produit « un mystère à reconstruire ensemble ». Si le produit tient la
promesse de sa charte, sa page d'accueil doit être désagréable et c'est ce qui la rendra mémorable.
C'est aussi le seul moyen que l'Article 0 gouverne enfin les pixels que le visiteur voit en premier.

### 4.5 Exporter l'Agence — mais avec le reçu

L'ambition d'exporter l'outillage est légitime et j'y crois. Une règle de tri, une seule : **un outil
ne part que s'il a réellement attrapé quelque chose sur ce dépôt-ci**, et il part avec le défaut
qu'il a trouvé, nommé, en tête de son blueprint. Ceux qui n'ont jamais rien attrapé restent ici. Un
catalogue de trente-deux outils dont on ne sait pas lesquels mordent ne se vend pas ; une demi-douzaine
d'outils qui arrivent avec leur tableau de chasse, oui. Le projet a déjà l'instrument pour faire ce
tri (`tool-brain rapport` mesure les outils jamais sollicités) — il faut juste accepter que sa
réponse soit désagréable.

### 4.6 Neuf lignes de CI

Un `.github/workflows` qui lance `check-house.mjs` et `tsc --noEmit`. C'est tout. Ça transforme les
sept Gardiens d'une promesse locale en une garantie valable dans n'importe quel clone — c'est-à-dire
que ça rend enfin **vrai** ce que l'Article 27 affirme déjà.

---

## 5. Plan d'action

*(Article 28 : un rapport n'est pas fini quand il est écrit, il l'est quand ses constats sont
devenus des tâches. Chaque constat ci-dessous porte l'un des trois états — RETENU, ÉCARTÉ,
À TRANCHER. Les constats RETENUS doivent donner lieu à une tâche réelle dans `docs/suivi/` ; cet
audit étant produit par un auditeur extérieur qui ne modifie pas le dépôt, l'inscription de ces
tâches revient à l'agent du projet.)*

| # | Constat | État proposé | Type de tâche | Effort |
|---|---|---|---|---|
| 1 | `qualite_pct` est une tautologie ; renommer et remplacer la colonne par la note Voix d'EL-PROFESSOR | **À TRANCHER** (touche la définition d'un KPI, décision utilisateur) | décision puis correctif | 1 h |
| 2 | 217/873 déplacements mal composés ; normaliser le motif avant injection dans `departureLine()`, et corriger `moveReasonMismatchesDestination()` qui approuve le cas fautif | **RETENU** | correctif (Article 3) | 30 min |
| 3 | Sur-éclairage (1.2 + 1.6) et 12 `MeshBasicMaterial` détruisent une palette pourtant correcte | **RETENU** | correctif | 1 h |
| 4 | L'accroche de `app/page.tsx` est en registre consensuel, contre l'Article 0 | **À TRANCHER** (réécriture éditoriale, calibrage utilisateur) | décision | — |
| 5 | Étendre explicitement l'Article 0 à l'interface et aux libellés, pas seulement au dialogue | **À TRANCHER** | décision (charte) | — |
| 6 | Expérience A/B de modèle sur la note Voix, jamais faite | **RETENU** | investigation (Article 22 : consulter Smart Conso API avant) | 1 après-midi |
| 7 | `echoRetryFocus()` jamais mesuré par une simulation ; pas de full_sim20 | **RETENU** | investigation | 1 simulation |
| 8 | `check-spirit.mjs` : 2 scénarios sur 20 lus depuis le 2026-09-20 | **RETENU** | investigation | dépend du quota |
| 9 | Code admin `'1980'` sans limite de tentatives | **À TRANCHER** (déjà reporté le 2026-09-20 ; je recommande de revenir sur ce report) | décision puis correctif | 15 min |
| 10 | `reset` sans authentification | **À TRANCHER** (idem) | décision puis correctif | 15 min |
| 11 | Aucune limitation de débit sur `chat`/`interact` — risque de facture et de déni de service | **RETENU** | correctif, avant toute mise en ligne publique | 2 h |
| 12 | Aucune CI ; l'appareil qualité repose sur une config git locale | **RETENU** | correctif | 30 min |
| 13 | `README.md` et `package.json` toujours ceux du gabarit ; échec du test de l'Article 27 | **RETENU** | documentation | 30 min |
| 14 | Lignes de 8 881 caractères dans `lib/lia.ts` ; diffs illisibles | **À TRANCHER** (reformatage à risque, arbitrage nécessaire) | décision | — |
| 15 | `check-house.mjs` s'arrête au premier échec ; passer à un vrai lanceur | **À TRANCHER** | décision | — |
| 16 | `points_fragiles` 3 → 14 en quatre jours, jamais lu comme tendance ; 2 tâches ouvertes sur ~490 | **RETENU** | décision de process (Article 26, à porter à god-of-all-process) | — |
| 17 | `smart_breaker_amelioration_pct` constant à 87,5 depuis l'origine : une constante déguisée en mesure | **RETENU** | correctif ou retrait de colonne | 30 min |
| 18 | Mono-monde : tous les visiteurs partagent la même maison | **ÉCARTÉ pour l'instant** — *raison* : arbitrage explicite de l'utilisateur du 2026-09-20 (refonte graphique d'abord), réaffirmé ici ; je maintiens mon désaccord sur la priorisation mais le report est une décision, pas un oubli. **À rouvrir obligatoirement avant toute ouverture au public.** | — | — |
| 19 | `gemini-flash-lite-latest` codé en dur 5 fois (Article 24 non appliqué au moteur) | **RETENU** | correctif | 15 min |
| 20 | Les pistes 4.2 à 4.5 (dossier à vue, spectateur + siège, DA, export avec reçu) | **À TRANCHER** — conception produit, hors du périmètre d'un correctif | décision | — |

---

*Fin du rapport. Aucun fichier du dépôt n'a été modifié en dehors de celui-ci ; aucun commit n'a été
fait.*
