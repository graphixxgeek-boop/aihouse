# Règles des graphismes

*(Créé le 2026-09-19, en préparation directe de la refonte graphique — calibré avec l'utilisateur
via trois séries de questions successives, à sa demande explicite (« pose moi plein de questions
pour bien préparer tous les aspects »). Remplace un tout premier jet rédigé sans calibrage préalable
le même jour, jugé insuffisant par l'utilisateur avant même d'être committé. Donne à THE-SCREENER
(cf. `docs/referentiel/the-screener.md`) sa vraie base de jugement — même relation qu'EL-PROFESSOR
avec CLAUDE.md. Comme `regles-du-temps.md`/`regles-de-l-espace.md`, ce document s'enrichit au fil
du chantier plutôt que d'être figé une fois pour toutes.)*

## Ce qui existe déjà, factuellement (2026-09-19)

- **Rendu** : Three.js (`components/house-view.tsx`), personnages représentés par un visage
  vectoriel paramétrique dessiné en temps réel depuis l'état émotionnel réel (`faceExpression()`,
  `lib/simulation.ts`).
- **Palette** : `scenePalette` (`lib/perception.ts`), désaturée par choix, consommée aujourd'hui
  UNIQUEMENT par le rendu 3D (jamais transmise au modèle de dialogue — trou déjà identifié, cf.
  Plan d'origine dans `CLAUDE.md`, à corriger pendant cette refonte).
- **Éclairage** : une seule lumière directionnelle chaude (`0xffe8cf`, intensité 1.6) — aucune
  différence visible entre jour et nuit dans la scène, alors que le cycle jour/nuit existe déjà
  pleinement côté logique (fatigue, personnalité, cf. `docs/referentiel/regles-du-temps.md`).
- **Caméra** : fixe.
- **Trottoir** : pas une zone 3D pathable (reste un instant narré, choix assumé jusqu'ici, cf.
  `docs/referentiel/parametres.md`).
- **Manquants nommés dans le Plan d'origine** : vignette, mode plein écran Observation/Instruments,
  mise en scène de la révélation.

## Périmètre de cette refonte — décidé le 2026-09-19

**La scène 3D ET toute l'interface web autour** (boutons, typographie, couleurs des panneaux,
fenêtres popup) — pas seulement la maison elle-même. Décision explicite de l'utilisateur,
consciente d'élargir le chantier au-delà du seul rendu 3D.

**Hors périmètre pour l'instant** : l'identité de marque du site (nom, nom de domaine, logo) —
sujet reconnu comme important et même urgent (un nom de domaine se réserve à l'avance, la mise en
ligne approche), mais volontairement traité à part, plus tard, pour ne pas diluer ce chantier-ci.
**Ne pas perdre ce point de vue : à reprendre explicitement avant la mise en ligne.**

**Extension actée le 2026-09-22** : le périmètre couvre aussi les RAPPORTS produits par l'outillage
de travail (`scripts/html-report.mjs`, utilisé par les simulations, KPI, EL-PROFESSOR, etc.), pas
seulement le jeu et son interface web — demande explicite de l'utilisateur (« nous devons tout
d'abord créer une charte graphique qui sera utilisée aussi bien dans le jeu, dans l'interface, dans
les rapports, etc. »). Trouvaille concrète qui motive ce point : jusqu'à ce soir,
`html-report.mjs` colorait les répliques de Lia/Noé avec ses deux couleurs génériques de thème
(orange/bleu), sans aucun lien avec `--lia`/`--noe` (`app/globals.css`, #f29bc3/#55dbe5) — deux
palettes qui vivaient chacune de leur côté. Corrigé en réutilisant telles quelles les couleurs
réelles du jeu dans `html-report.mjs` (`--lia: #f29bc3; --noe: #55dbe5`) plutôt que d'inventer une
troisième palette de rapport. **À FAIRE pendant la refonte graphique** (pas avant, pour ne pas fixer
une charte qui deviendrait fausse dès que la palette change) : construire une vraie charte graphique
unique (couleurs, typographie, tons) déclinée dans les trois surfaces — jamais trois palettes
maintenues séparément comme aujourd'hui.

**Règle permanente actée le même soir, à ne jamais casser pendant la refonte** : quand la future
charte graphique changera ces couleurs, `--lia`/`--noe` dans `scripts/html-report.mjs` DOIVENT être
mis à jour dans la même foulée — jamais laissés à l'ancienne valeur. Vérifié mécaniquement par
`checkHtmlReportTheme()` (`scripts/doc-report.mjs`), qui compare les deux fichiers réels à chaque
exécution et signale toute désynchronisation. Même soir, le zoom 150% à l'ouverture (déjà demandé
pour le transcript) a été généralisé à TOUS les rapports HTML, directement dans `THEME_CSS` —
détail complet : `docs/regles-de-travail.md` §7.

## Principe directeur

**Le monde affiché doit toujours être celui qui existe RÉELLEMENT au moment présent** — jamais un
décor figé par défaut du code, jamais une référence visuelle à un état antérieur. Prolonge
directement l'Article 12 de la charte côté image.

## Décisions calibrées — à appliquer pendant la refonte

1. **Style général** : garder l'esprit épuré/abstrait actuel (formes simples, visages lumineux) et
   le peaufiner — pas d'évolution vers un rendu riche/réaliste.
2. **Vignette** : discrète et fixe, jamais variable selon la tension du moment (pas de logique à
   relier aux jauges d'émotion/hostilité pour l'instant).
3. **Intensité dramatique dans le temps** : reste stable du début à la fin de l'enquête — pas
   d'assombrissement progressif à mesure qu'on approche de la révélation.
4. **Son** : aucun son n'existe dans le jeu aujourd'hui. La mise en scène de la révélation (ci-
   dessous) reste donc 100% visuelle pour cette refonte — pas de chantier audio ouvert ici.
5. **Mise en scène de la révélation** : séquence purement visuelle (caméra qui descend, panneaux
   qui se rétractent, anneaux qui se tournent vers l'observateur), rythme d'environ **5 secondes**,
   **toute l'interface (jauges comprises) disparaît complètement** pendant la séquence et revient
   normalement une fois terminée.
6. **Mode plein écran Observation/Instruments** :
   - Mode Observation (par défaut) : exactement 3 jauges visibles — **Faim, Fatigue, Incertitude
     d'humanité**. Les autres (stress, attirance, attachement) ne sont visibles qu'en mode
     Instruments.
   - Bascule : **barre espace**, active UNIQUEMENT quand le focus n'est PAS dans le champ de
     saisie du message (pour ne jamais interférer avec la frappe d'un espace dans un message —
     conflit identifié et résolu explicitement le 2026-09-19, avant toute implémentation).
7. **Trottoir** : identité visuelle propre et distincte du jardin — pas une simple extension du
   même décor, marque une vraie frontière avec l'extérieur/le "réel".
8. **Mobile/tablette** : le jeu doit rester pleinement jouable après la refonte — toute ambition
   visuelle (caméra, transitions, éclairage) doit être testée/adaptée pour ne pas dégrader
   l'expérience sur un téléphone standard.
9. **Accessibilité daltonisme** : explicitement non prioritaire pour cette refonte (décision
   assumée, pas un oubli — à reconsidérer si besoin plus tard).
10. **Caméra** : gagne des mouvements pendant le jeu normal (pas seulement à la révélation) — par
    exemple suivre le personnage qui parle ou se rapprocher dans un moment intense. Reste à
    concevoir en détail (déclencheurs exacts, vitesse, limites) au moment de l'implémentation.
11. **Transitions entre pièces** : un vrai traitement visuel (fondu et/ou mouvement de caméra qui
    accompagne le déplacement) remplace la marche animée simple actuelle.
12. **Éclairage jour/nuit** : un vrai contraste visible doit apparaître dans la scène 3D elle-même
    (plus sombre/teinté la nuit), pour que ce que montre l'écran corresponde enfin à ce que dit
    déjà le texte (fatigue, personnalité) — actuellement un décalage réel entre logique et rendu.
13. **Bonus roulette (mute/caméra cachée)** : reste texte/interface simple, jamais de
    représentation visuelle animée dans la scène 3D.
14. **Détail des objets/meubles** : formes géométriques simples partout, MAIS rendu plus soigné
    (lumière, matières, ombres) sur l'ensemble des objets ; un vrai supplément de détail formel
    est réservé aux objets clés de l'enquête (livre, dossier, indices observés de près) — jamais
    généralisé à tout le mobilier ordinaire.

## Plan d'interface plein écran — décisions calibrées (2026-09-19)

*(Distinct des décisions ci-dessus, qui portent sur le RENDU visuel — celles-ci portent sur la
DISPOSITION de l'interface web autour de la scène 3D, calibrées via trois séries de questions
successives à la demande explicite de l'utilisateur. Reprises ici depuis `docs/suivi/` où elles
étaient restées « en cours » — décidées mais jamais transcrites dans le document de référence, un
écart trouvé en reprenant systématiquement toutes les tâches en cours le 2026-09-20, cf. Article 13.)*

1. **Un seul bouton play en bas de l'écran** remplace les trois boutons actuels (pause / générer
   des actions) — un point d'entrée unique pour faire avancer le temps du jeu.
2. **Le fil de conversation reste une bande latérale permanente**, jamais un élément qu'il faut
   ouvrir/fermer.
3. **Sélection de personnage et déplacement par clic direct dans la scène 3D** — plus de
   cartes/boutons texte pour choisir Lia/Noé ou une destination.
4. **Le composer (champ de saisie) reste toujours visible**, jamais masqué par un autre mode
   d'affichage.
5. **Badges de personnage flottants directement sur le modèle 3D** (nom, état) plutôt que dans un
   panneau latéral séparé.
6. **Rêves/souvenirs réservés au mode Instruments** — jamais affichés par défaut en mode
   Observation (cf. décision 6 ci-dessus sur les jauges).
7. **Jardin/roulette/verdict/enquête regroupés dans un seul tiroir d'actions** — un point d'accès
   unique pour les mécaniques secondaires, plutôt que des boutons épars.
8. **Le panneau Admin rejoint un menu réglages** — jamais un bouton dédié visible en permanence.
9. **L'indicateur jour/nuit reste visible en permanence à l'écran**, jamais relégué dans un menu.
10. **« Nouvelle arrivée » et « passer à la révélation » restent des boutons visibles directement à
    l'écran**, jamais enfouis dans un menu — ce sont des actions rares mais importantes, qui
    doivent rester découvrables sans chercher.

## Trois critères pour juger un rendu (base de THE-SCREENER)

1. **Lisibilité** — comprend-on où sont les personnages, ce qu'ils font, l'état de la scène, sans
   connaître le code (prolongement de l'Article 15 côté image) ?
2. **Cohérence avec l'ambiance dystopique** — palette désaturée, éclairage jour/nuit contrasté,
   absence de décor chaleureux/générique, restent perceptibles à l'écran.
3. **Absence de défaut technique visible** — chevauchements, textures qui clignotent, géométrie
   cassée, personnage hors-cadre, HUD qui masque une information utile.

**To-do pour la refonte graphique elle-même (2026-09-22, idée dite en avance par l'utilisateur) :
booster THE-SCREENER et le calibrer sur les préférences réelles de l'utilisateur.** Contexte qui
motive cette priorité : l'avis de THE-SCREENER va compter davantage une fois la refonte lancée
(caméra dynamique, transitions, interface entièrement repensée) — pas seulement une note indicative
en passant. Deux volets, à traiter au moment du chantier, jamais devinés d'avance :
1. **« Booster » l'agent** — portée exacte à calibrer à ce moment-là (plus de captures que les 2
   actuelles ? un axe de jugement en plus que les 3 critères ci-dessus, ex. caméra/mouvement ?).
2. **Calibrer sur les préférences réelles de l'utilisateur** — aujourd'hui THE-SCREENER ne juge que
   contre les 3 critères génériques ci-dessus ; le calibrer sur des goûts personnels précis
   (exemples concrets à demander à l'utilisateur au moment venu) reste entièrement à définir.

**Rappel honnête au moment où cette idée est notée** (trouvé en vérifiant le registre réel,
`docs/the-screener/index.md`) : THE-SCREENER n'a encore JAMAIS produit un vrai rapport à ce jour,
malgré plusieurs simulations complètes depuis sa construction — le mécanisme de capture est testé et
fonctionnel en isolation, mais jamais réellement déclenché pendant une vraie simulation (fermeture
automatique des popups d'accueil restée à faire, cf. `docs/referentiel/the-screener.md`). Ce
rattrapage (le faire tourner au moins une fois pour de vrai) est un préalable naturel avant de
parler de le « booster » — inutile d'enrichir un outil qu'on n'a jamais vu produire un résultat réel.
Détail complet de ce constat : `docs/referentiel/points-fragiles.md`.

## Ordre de grandeur du chantier (organisation, pas encore un planning tranché)

Ce périmètre couvre en réalité plusieurs sous-chantiers de complexité très inégale — à séquencer
au moment de l'implémentation, jamais tout d'un bloc :
- **Léger** : vignette fixe, éclairage nuit renforcé, mode Observation/Instruments (3 jauges +
  bascule clavier), trottoir en zone distincte.
- **Moyen** : mise en scène de la révélation (5 secondes, disparition d'interface), rendu plus
  soigné des objets existants (lumière/matières/ombres sans changer les formes).
- **Lourd, à concevoir en détail avant de coder** : système de caméra dynamique (mouvements pendant
  le jeu normal), transitions animées entre pièces, refonte de toute l'interface web autour de la
  scène 3D (boutons, typographie, popups) — et vérifier que tout ça reste fluide sur mobile.

## To-do : outils à installer juste avant de démarrer le chantier

*(Ajouté le 2026-09-19, à la demande explicite de l'utilisateur, après une discussion sur les
bibliothèques utiles. Deux catégories : celles qui servent directement la refonte graphique, et
celles qui servent la qualité générale du site — pertinentes vu la mise en ligne prochaine, jamais
mélangées avec le graphisme lui-même dans le raisonnement, même si elles atterrissent dans la même
to-do pratique.)*

**Pour la refonte graphique elle-même :**
- [ ] **GSAP** (`pnpm add gsap`) — anime la caméra dynamique, les transitions entre pièces, la
  séquence de révélation. Confirmé par l'utilisateur.
- [ ] **Aucun paquet supplémentaire pour la vignette** — Three.js (déjà présent) embarque son propre
  module de post-traitement (`EffectComposer`), suffisant. Vérifier au moment de coder plutôt que
  d'ajouter une dépendance de plus par réflexe.
- [ ] **Ne pas migrer vers `@react-three/fiber`** — décision assumée, pas un oubli : réécrire tout le
  rendu Three.js actuel (écrit à la main) en composants React serait un chantier disproportionné
  pour la seule valeur d'avoir des animations plus déclaratives ; GSAP seul suffit à piloter la
  caméra directement sur le code existant.

**Pour la qualité générale du site, hors refonte graphique — pertinent vu la mise en ligne
approchante (sujet nom/domaine/logo distinct, cf. section "Périmètre de cette refonte") :**
- [ ] **Suivi d'erreurs en production** (ex. `@sentry/cloudflare`) — sans ça, un bug réel une fois en
  ligne reste invisible jusqu'à ce qu'un visiteur le signale lui-même.
- [ ] **Balises de partage social (Open Graph/Twitter Card)** — pas un paquet, quelques balises à
  ajouter dans le code ; sert directement l'objectif de partage/buzz déjà exprimé par l'utilisateur.
- [ ] **Cloudflare Web Analytics** — gratuit, déjà inclus avec l'hébergement, zéro dépendance à
  ajouter ; active à la mise en ligne pour mesurer le trafic réel.

**Explicitement écarté pour l'instant, pas oublié :**
- Système audio (`howler.js` ou équivalent) — la mise en scène de la révélation reste 100% visuelle
  pour cette refonte (décision déjà actée), donc pas de besoin audio à ce stade.
- Toute nouvelle bibliothèque de composants d'interface — le projet a déjà `base-ui`/`shadcn`/
  `lucide-react`, suffisants pour la refonte de l'interface web décidée.

## À enrichir au fil de la refonte

Chaque décision visuelle prise pendant l'implémentation (détails de la caméra, palette définitive,
règles précises des transitions) doit être ajoutée ici au moment où elle est tranchée — jamais
après coup (Article 13 de `CLAUDE.md`).
