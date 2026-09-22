# THE-SCREENER — instanciation pour Maison IA vivante

*(Cf. `docs/the-screener-blueprint.md` pour le principe générique. Créé le 2026-09-19, calibré
avec l'utilisateur : deux captures maximum par simulation, économie de tokens en priorité, note
strictement indicative (jamais un verdict qui prime sur l'appréciation de l'utilisateur), séparé
d'un éventuel futur outil de gestion de la refonte graphique elle-même.)*

## Base de jugement

`docs/referentiel/regles-des-graphismes.md`, section "Trois critères pour juger un rendu" —
lisibilité, cohérence avec l'ambiance dystopique, absence de défaut technique visible. THE-SCREENER
ne juge jamais sans cette base, exactement comme EL-PROFESSOR ne juge jamais sans la charte de
contenu.

## Une simulation de dev OU le vrai site en ligne — même mécanisme

*(Précisé le 2026-09-19, même question que pour EL-PROFESSOR.)* Le script de capture prend une URL
en paramètre — pointée aujourd'hui vers le serveur de dev (`http://127.0.0.1:5173/`), demain vers
la vraie adresse publique du site, sans aucune adaptation de méthode. Une fois le site en ligne,
capturer son état réel est même PLUS simple qu'aujourd'hui : plus besoin de relancer un serveur de
dev pour avoir quelque chose à capturer.

## Mécanisme de capture — `scripts/the-screener-capture.mjs`

Playwright (`pnpm add -D playwright`, déjà installé) pilote un vrai navigateur Chromium pour
prendre les captures — c'est la SEULE façon d'obtenir une image, puisque le protocole de simulation
textuelle (`full_simN.mjs`) n'ouvre jamais de navigateur. Testé et confirmé fonctionnel le
2026-09-19 contre le serveur de dev réel (`http://127.0.0.1:5173/`) : capture nette, 1280×800,
zéro appel à l'API Gemini du jeu (le coût de ce mécanisme est purement local — lancement d'un
navigateur headless — jamais un coût réseau facturé).

**Détail technique trouvé pendant ce premier test, à traiter avant une vraie capture en
simulation** : la page d'accueil affiche d'abord la popup de mise en garde légale ("Avant
d'entrer..."), qui bloque la vue sur la maison elle-même. Le script de capture doit donc, avant de
prendre les 2 captures réelles, dérouler et fermer les popups d'accueil (mise en garde légale, choix
du pseudo, message de bienvenue) — pas encore automatisé, à faire au moment de raccorder ce
mécanisme à une vraie simulation Article 18.

## Les 2 captures — quand les prendre

Choisies pour leur valeur informative maximale, jamais un intervalle fixe aveugle (cf. blueprint,
"Principe de sobriété") :
1. **Une capture "état courant" en cours de partie** — après que les popups d'accueil sont
   fermées et qu'au moins un déplacement a eu lieu, pour voir un état représentatif du rendu normal.
2. **Une capture au moment le plus visuellement distinctif de la session** — priorité à la
   révélation une fois sa mise en scène construite (cf. `regles-des-graphismes.md`, point 5) ; en
   attendant, une scène de nuit profonde (pour juger le contraste jour/nuit une fois renforcé,
   point 12 de la même charte).

Ces deux déclencheurs nécessitent de connaître l'état réel de la partie en cours (round, phase,
moment de la journée) — à raccorder à la prochaine simulation Article 18 relancée après retour du
quota Gemini, jamais improvisé sans savoir ce qui se passe réellement dans la session.

## Méthode de notation

Une vraie lecture des 2 images (vision), jamais un calcul de pixels. Pour chaque critère (sur les 3
de la base de jugement) : une note qualitative + une description concrète de ce que montre l'image
à l'appui — jamais un chiffre nu. Note globale = synthèse des 3, présentée avec la mention explicite
que c'est un signal indicatif, jamais un verdict qui remplace l'appréciation de l'utilisateur (cf.
blueprint, "Ce que ce patron n'est pas").

## Format de sortie

Fichier livré (jamais collé en clair), avec les 2 images jointes + le texte de notation — même
convention de livraison que le rapport EL-PROFESSOR et le rapport KPI.

## Placement dans le protocole de simulation (Article 18 de `CLAUDE.md`)

Rejoint l'étape 4bis (juste après l'archivage, avant l'analyse de l'agent) — en parallèle d'EL-
PROFESSOR, jamais à sa place. Contrairement à EL-PROFESSOR, son statut reste secondaire : si la
capture échoue pour une raison technique (navigateur, popup non gérée), la simulation continue
normalement — THE-SCREENER ne bloque jamais le protocole.

## Registre

`docs/the-screener/` — un fichier de notation par simulation + les images capturées associées.
Pas encore peuplé : en attente d'une simulation réelle relancée pour la première vraie capture
(le mécanisme lui-même est déjà testé et fonctionnel, cf. ci-dessus).

## État d'avancement (2026-09-19)

- **Fait** : blueprint, instanciation, installation de Playwright, script de capture testé et
  fonctionnel contre le serveur de dev réel.
- **Restant, à faire au moment de la prochaine simulation** : automatiser la fermeture des popups
  d'accueil ; raccorder les 2 déclencheurs (état courant / moment distinctif) à l'état réel de la
  partie plutôt qu'à un test isolé ; produire un premier vrai rapport de notation.


## Genèse — les mots exacts de la demande (déplacés depuis le blueprint le 2026-09-23)

Ce bloc vivait en tête de `docs/the-screener-blueprint.md`, où SAFE-EXPORT le signalait comme une
fuite (il nomme la maison, l'interface, et l'outil lui-même). **Rien n'a été réécrit — la citation
est déplacée, mot pour mot**, pour la même raison que ci-dessus : on ne réécrit pas les mots de
quelqu'un dans son dos. Le calibrage qu'elle porte (deux outils séparés, 2 captures maximum par
simulation, méthode fondée sur une charte déjà écrite, « mon appréciation primera ») reste donc
intégralement disponible, à sa place.

*(Créé le 2026-09-19, à la demande explicite de l'utilisateur : « le pendant de el-professor, c'est
"the-screener" qui lui s'occupe de la partie graphique, donne une note sur la beauté de l'affichage
de la maison, de l'interface, et une note globale [...] pour alimenter the-screener, on joue les
economies de token en priorité [...] et ca n'est pas dans le coeur du projet, c'est juste une note
indicative : mon appreciation primera ». Calibré avec l'utilisateur : deux outils séparés (jamais un
outil de gestion de la refonte graphique elle-même, qui resterait un projet distinct), 2 captures
d'écran maximum par simulation, méthode fondée sur une charte graphique déjà écrite (jamais un
jugement esthétique inventé à la volée). Même logique architecturale que
`docs/el-professor-blueprint.md` : ce document décrit le PATRON générique, réutilisable sur un
autre projet visuel piloté par IA ; l'instanciation propre à *Maison IA vivante* vit dans
`docs/referentiel/the-screener.md`. Nommé par l'utilisateur lui-même.)*
