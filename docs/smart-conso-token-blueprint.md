# SMART-CONSO-TOKEN — régulation de la consommation de tokens de l'agent — blueprint exportable

*(Créé le 2026-09-20, à la demande explicite de l'utilisateur, juste après avoir câblé Smart Conso
API et le Smart Breaker dans le paysage d'outils : « on va créer un dernier agent pour le moment :
smart-conso-token : le pendant de smart-conso-API : son rôle est de réguler la consommation des
tokens par les outils et par toi-même, et par moi aussi [...] à l'image d'un conseiller en réduction
de conso électrique [...] on ne chauffe pas une pièce en été ». Même famille que
`docs/smart-conso-api-blueprint.md`, mais pour une ressource structurellement différente — ce
document décrit le PATRON générique ; l'instanciation propre à *Maison IA vivante* vit dans
`docs/referentiel/smart-conso-token.md`.)*

## Le problème que ce patron résout, et en quoi il diffère de Smart Conso API

Smart Conso API régule une ressource EXTERNE et SONDABLE (un quota d'API tiers, vérifiable par un
vrai appel en direct). Les tokens consommés par l'agent lui-même — son propre contexte de
conversation, ses appels à des agents séparés, sa lecture de fichiers volumineux — ne sont PAS
sondables de la même façon : il n'existe aucun compteur externe interrogeable qui dirait "voici
exactement combien de tokens ont été consommés jusqu'ici". Ce patron doit donc composer avec une
limite honnête et permanente : **il ne mesure jamais un vrai total, il reconnaît des schémas connus
coûteux et les combine à des valeurs mesurables (taille de fichiers, nombre d'actions déjà faites)
pour un verdict fiabilisé — jamais un chiffre exact présenté comme tel.**

## Connaissance liée au modèle/à la plateforme, jamais supposée éternelle

Contrairement au quota d'une API externe (dont le comportement ne dépend pas de qui l'interroge),
le registre des "schémas connus coûteux" de ce patron dépend directement de l'architecture du
modèle/agent qui l'utilise (comment son contexte est mis en cache, combien coûte un agent séparé,
comment son fichier d'instructions permanent pèse sur chaque tour). **Si le modèle ou la plateforme
change, ce registre doit être explicitement revalidé — jamais recopié en silence.** Le patron doit
donc :
1. Déclarer explicitement POUR QUEL modèle/plateforme son registre a été validé, et à quelle date.
2. Comparer cette déclaration à l'identité réelle de l'agent qui l'utilise à chaque consultation.
3. Signaler clairement un désaccord ("ce registre n'a jamais été validé pour toi") plutôt que
   d'appliquer silencieusement une connaissance potentiellement obsolète.
4. Demander explicitement une nouvelle recherche (jamais une simple mise à jour de date sans
   contenu nouveau) quand ce désaccord est détecté.

## Trois destinataires, pas un seul

Demandé explicitement : ce patron régule la consommation de trois acteurs différents, jamais
seulement l'agent :
- **L'agent lui-même** — avant de déclencher une action reconnue comme coûteuse (appeler un agent
  séparé, lire l'intégralité d'un projet, etc.).
- **La personne qui pilote le projet** — quand SA PROPRE demande implique naturellement une action
  coûteuse (« audite tout en profondeur »), le patron doit permettre à l'agent de le lui faire
  remarquer avant de foncer, pas seulement se réguler lui-même en silence.
- **Les autres outils du paysage** — tout outil coûteux (qui appelle un agent séparé ou consomme un
  vrai raisonnement) consulte ce patron avant de se déclencher, au même titre qu'il consulterait un
  éventuel régulateur de quota d'API.

## Deux seuils, jamais confondus (même principe que Smart Conso API)

Seuil souple (négociable, avec argument) / seuil dur (bloque jusqu'à validation humaine explicite,
via une vraie fenêtre de question, jamais un blocage silencieux). Un seuil ne devient dur qu'après
validation humaine explicite — jamais dur dès sa première proposition.

## Limite honnête sur la vérification a posteriori

Un outil de régulation d'une ressource externe et sondable (comme Smart Conso API) peut construire
un garde-fou qui compare l'activité réelle enregistrée ailleurs à ce que son propre carnet dit avoir
été confirmé — détectant ainsi les fois où il a été oublié. **Ce patron-ci ne peut PAS construire le
même garde-fou** : il n'existe aucune trace externe et indépendante de "un agent séparé a été
appelé" ou "un contexte a été consommé". La seule protection possible est une RÈGLE EXPLICITE ET
NON NÉGOCIABLE écrite dans la charte du projet (consulter ce patron avant certaines actions listées),
jamais une vérification mécanique après coup — une limite à assumer et documenter clairement, pas à
cacher derrière une fausse promesse de fiabilité totale.

## Rythme, contexte et conditions — une mémoire qui nourrit un jugement humain, jamais un apprentissage automatique silencieux

Chaque action confirmée est enregistrée avec son type, son contexte, et le moment où elle a eu lieu
— pour qu'un passage périodique (par l'agent ou la personne qui pilote le projet) puisse observer
si le rythme réel dérive dans le temps. Ce patron n'ajuste JAMAIS ses propres seuils tout seul à
partir de cet historique : il fournit la matière, une vraie relecture reste toujours nécessaire pour
en tirer une décision (même principe que les leçons curatées du Smart Breaker).

## Distinguer un investissement d'une consommation sans retour, sans jamais décourager le premier

Demandé explicitement (2026-09-20) : une dépense de tokens n'est pas homogène — construire un
mécanisme réutilisable ou vérifier avant un changement risqué peut se rembourser largement plus tard,
alors qu'une même dépense dupliquée ou disproportionnée par rapport au besoin réel ne rapporte rien.
**Ce patron ne prédit jamais littéralement l'avenir** : il applique des critères vérifiables AU
MOMENT de la dépense (le mécanisme construit sera-t-il réellement réutilisé à coût nul ? la
vérification a-t-elle lieu avant un changement risqué ? cette action duplique-t-elle un travail
récent ? le palier choisi correspond-il à la taille réelle du besoin ?) plutôt qu'une estimation
chiffrée du gain futur, qui n'aurait aucune base réelle pour se mesurer.

Une classification "investissement" reconnue doit changer la NATURE du verdict rendu (une
recommandation de poursuite, jamais un avertissement qui découragerait à tort une dépense saine) —
mais ne doit JAMAIS court-circuiter un seuil déjà dur : la classification informe la décision (de
l'agent ou de la question posée à l'utilisateur), elle ne la remplace ni ne la contourne jamais. Un
doublon d'un travail récent, ou un palier disproportionné par rapport au besoin exprimé, restent
toujours classés sans retour, même quand l'intention de départ était par ailleurs saine — le
principe anti-doublon et la proportionnalité au besoin priment toujours sur la bonne intention.

Ce jugement doit s'appliquer de façon UNIFORME, quel que soit qui déclenche la dépense — l'agent, la
personne qui pilote le projet, ou un autre outil du paysage — jamais un critère à géométrie variable
selon la source.

## Câblage attendu avec le reste du paysage d'outils

- **Tout outil qui déclenche un agent séparé ou un vrai raisonnement coûteux** doit consulter ce
  patron avant de se lancer, au même titre qu'il consulterait un régulateur de quota d'API — la
  question à se poser à la conception de tout nouvel outil coûteux de ce genre.
- **Un orchestrateur qui agrège déjà les autres outils gratuits du paysage** (comme LE-COORDINATEUR
  dans ce projet) doit afficher, à chaque passage, le rythme récent observé par ce patron — pour
  que la vue d'ensemble et le rythme de consommation soient toujours vus ensemble, jamais l'un sans
  l'autre.

## Apprentissage sécurisé : repérer ses propres erreurs d'appréciation sans jamais s'auto-corriger

Demandé explicitement (2026-09-20) : ce patron doit pouvoir se rendre compte de ses erreurs
d'appréciation passées — mais **jamais** en ajustant lui-même ses seuils ou sa logique (cf. limite
déjà posée plus haut). La conciliation tient en trois pièces, jamais confondues :
1. **Enregistrer le destinataire et le verdict** de chaque conseil confirmé (agent / outil /
   personne qui pilote le projet), pas seulement le type d'action.
2. **Permettre d'attacher, après coup, un résultat réellement observé** à une action déjà
   enregistrée — jamais deviné ni inféré automatiquement, seulement fourni explicitement une fois
   connu.
3. **Un diagnostic qui recroise verdict et résultat** pour surfacer des constats (un seuil dur
   probablement ignoré, un avertissement confirmé par un vrai problème, un investissement qui s'est
   avéré ne pas être rentable) — mais qui reste, comme le reste de ce patron, un rapport à lire,
   jamais une correction appliquée seule.

**Portée réaliste, jamais feinte** : ce mécanisme d'apprentissage ne peut mécaniquement suivre la
conformité au conseil que pour les destinataires qui laissent une trace vérifiable (l'agent
lui-même, via ses propres actions confirmées ; les outils, via leur registre archivé). Pour la
personne qui pilote le projet, aucune trace fiable n'existe de ce qu'elle décide de son côté — ce
patron doit l'assumer honnêtement plutôt que fabriquer une fausse précision.

## Ce que ce patron n'est pas

- Un vrai compteur de tokens — cf. la limite honnête ci-dessus, assumée en permanence.
- Un garde-fou capable de prouver après coup qu'il a été oublié — cf. section dédiée ci-dessus.
- Un mécanisme qui ajuste automatiquement ses propres seuils ou modifie une architecture pour
  économiser des tokens — comme Smart Conso API, il informe, il ne tranche ni n'agit jamais seul.
