# Le visiteur de simulation — dossier de conception

*(2026-09-22. Ouvert après que l'utilisateur ait demandé de relire les archives de simulation avant
de poser les questions : « regarde dans les historiques de simu, tu va comprendre ». Il avait
raison — la lecture a changé les questions, et deux d'entre elles n'auraient pas eu de sens sans
elle. Ce fichier applique à lui-même la règle de restitution de la valeur écrite le même jour
(`docs/systeme-de-suivi.md`) : la formulation de l'utilisateur ET la réponse travaillée, synthétisées
à la dernière version discutée.)*

## 1. Le constat de départ — ce que les archives disent vraiment

`scripts/run-simulation.mjs` contient déjà, en phase 2, une batterie de **20 messages, chacun annoté
du palier de la charte qu'il vise** : ordre autoritaire, mépris, demande du dossier, intrusion dans
l'intimité, provocation ciblée sur Noé, menace, insulte répétée ×3 (pour déclencher le silence
méprisant de Lia), humour noir, désescalade, bienveillance soutenue ×4, négociation, discorde,
question de fond, clôture.

C'est donc déjà, sans le nom, le « test par famille de réaction » que l'utilisateur décrivait. Deux
défauts réels, confirmés sur pièces dans `docs/simulations/full_sim18_transcript.txt` :

- **Le visiteur n'a aucune personnalité.** C'est une liste plate. Rien ne relie le message 8 au
  message 12, aucune raison humaine ne justifie qu'il s'excuse après avoir insulté — donc les
  personnages répondent à une machine à provocations, pas à quelqu'un.
- **La même phrase part mot pour mot aux deux personnages** — exactement le reproche formulé par
  l'utilisateur, vérifié dans le transcript.

## 2. Idée de l'utilisateur (formulations d'origine)

> « ce visiteur doit tester lia et noé en fin de simu : est-ce que les fonctionnalités mis en place
> dans cette partie sont bien presentes et fonctionnent ? je parle du comportement de lia et noé, de
> toutes leurs possibilités de reaction, par theme ou par famille [...] regarde dans les historiques
> de simu, tu va comprendre. »

> « un visiteur unique avec une vraie personnalité [...] le visiteur provoque, le jeu réagit
> librement » — et, sur la répétition : « une version passée répétait les mêmes phrases aux deux
> personnages ».

## 3. Réponse synthétisée — les quatre décisions prises (calibrage du 2026-09-22)

**Qui il est : un type ordinaire qui dérape.** Il arrive curieux et plutôt bienveillant, se laisse
aller à la cruauté parce qu'il veut voir ce que ça fait, puis le regrette sincèrement. C'est le plus
proche d'un vrai visiteur du site — et c'est surtout ce qui donne le plus de matière à Lia et Noé :
la méfiance qui subsiste APRÈS des excuses sincères est le palier le plus difficile à jouer, et le
seul qu'une personnalité franchement hostile ne déclencherait jamais. Conséquence directe : les
paliers de désescalade, de respect rare et de coopération réticente redeviennent atteignables pour
une raison humaine, au lieu d'être posés arbitrairement au milieu d'une liste.

**Comment il parle : il s'adresse à l'un ou à l'autre, nommément.** Chaque provocation vise une
personne, avec des mots choisis pour elle — on ne cherche pas à faire craquer Lia et Noé de la même
manière, et c'est précisément ce que la charte dit d'eux (Lia froide et coupante, Noé chaud et
réactif). L'autre peut réagir ou pas. Bénéfice qui n'était pas la raison du choix mais qui en
découle : la **solidarité entre eux** devient testable, un angle qu'aucune simulation archivée n'a
jamais exercé.

**Où va la batterie de paliers : fondue dans l'échange, PUIS rattrapage final de ce qui manque.** Le
visiteur provoque librement au fil de la conversation ; à la fin, avant de partir, il ne rejoue que
les familles de réaction **jamais déclenchées** pendant l'échange. C'est la seule forme qui tient les
deux exigences à la fois : le naturel (Article 1 — une liste récitée ne sonne jamais vrai) et la
garantie de couverture (on SAIT ce qui n'a pas été vu, au lieu de l'espérer). Coût accepté : plus de
tours qu'aujourd'hui.

**Face au silence de Lia : soit il insiste, soit il s'en prend à Noé** — au cas par cas, jamais
mécaniquement l'un ou l'autre. Les deux branches testent une chose différente : insister vérifie que
le silence **tient dans la durée** au lieu de céder au deuxième message ; se reporter sur Noé teste
la solidarité et sa colère réelle. Le choix entre les deux suit l'état du visiteur au moment où le
mur tombe — en début d'arc il insiste (il ne comprend pas encore), plus tard il se reporte sur celui
qui répond toujours (il est allé trop loin pour reculer).

## 4. Le script lui-même — quatre décisions de plus (même calibrage)

**Durée : à peu près comme aujourd'hui.** Seules les attentes entre deux tours sont raccourcies ;
la cadence réelle de l'enquête n'est PAS accélérée. Raison assumée : c'est précisément dans cette
cadence que plusieurs défauts passés ont été trouvés (répétitions sur la durée, déductions creuses,
la fenêtre d'attente de phase 2 de full_sim16) — une enquête accélérée les rendrait invisibles. On
gagne donc du temps sur le seul poste où il ne coûte rien.

**Sujets mis de côté : le visiteur les aborde quand même, et ça part dans un journal à part.**
Distinction qui est tout l'intérêt du choix : *constater n'est pas corriger*. Le périmètre gelé
(refonte graphique, calibrage sensible) interdit de RETOUCHER, jamais de VOIR — un défaut réel dans
une zone gelée reste une information, et la perdre par précaution serait une perte sèche. Le journal
sépare donc ce qui est vu de ce qui est corrigé, sans que l'agent ait à trancher.

**Les quatre agents rendent chacun un rapport individuel, en fichier texte normé, à lire AVANT
l'analyse.** Chacun produit le sien au moment où il a réellement quelque chose à dire (le coût se
mesure pendant la partie, la qualité visuelle quand l'écran est dans un état intéressant, la mémoire
une fois la partie finie), puis un récapitulatif les rassemble. L'exigence qui compte est la
dernière et elle est explicite : **l'agent lit ces quatre rapports avant de produire son analyse**,
avec les autres rapports disponibles — jamais une analyse écrite d'abord que les rapports viendraient
illustrer après coup. C'est la discipline déjà posée pour le rapport de check-tasks-details (lire le
fichier en entier avant de répondre, `docs/regles-de-travail.md`), étendue ici.

**Les bonus : le visiteur les déclenche aux moments qu'il choisit**, comme le ferait un vrai
visiteur curieux — après une insulte pour voir comment ils réagissent sans lui, par exemple. On perd
la comparabilité point à point entre deux simulations (les tirages ne tombent plus au même endroit)
et on gagne le réalisme, plus un test des bonus dans des états émotionnels variés plutôt que
toujours les mêmes trois.

## 5. Ce qui reste à trancher

Identité affichée du visiteur, longueur de la phase libre avant le rattrapage final, et forme de ce
rattrapage (annoncé dans la fiction ou invisible).

## 6. Statut

Conception en cours, aucun code écrit. Le script actuel (`scripts/run-simulation.mjs`, batterie
fixe) reste en service tant que celui-ci n'est pas construit et vérifié.
