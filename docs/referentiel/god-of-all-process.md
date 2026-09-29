# god-of-all-process — fiche d'instanciation

## Ce qu'il sert ici

`scripts/god-of-all-process.mjs` : **le contrôleur maître du DÉROULÉ** des activités à étapes de ce
projet. Il surveille des ÉTAPES ; `angel-of-ia-process` surveille des RÈGLES DE TRAVAIL. Les deux
côtés — l'agent comme l'utilisateur — y sont notés pareil.

## Une seule voix, jamais deux

**angel ne livre pas son rapport lui-même : god le relaie**, dans une section clairement à part.
C'est une décision d'architecture de l'utilisateur (2026-09-22), prise pour que la Ronde entende une
voix de process et non une par contrôleur.

## Les process qu'il connaît ici

La Ronde, la simulation (Article 18), la nuit autonome, le méta-process, l'intégration d'un outil,
et XP-IA-bonnes-pratiques-et-leçons. Il dérive l'avancement de **traces réelles sur le disque**,
jamais d'un compteur qui pourrait dériver.

## Son autorité, tranchée explicitement

**Il SIGNALE FORT, il ne bloque JAMAIS** (Article 28). Le manquement est nommé, le responsable
désigné, et il reste visible tant qu'il n'est pas traité. Un contrôleur qui bloquerait sur un sujet
sans rapport avec le travail en cours pousserait à le contourner.

## Ce qu'il ne confond jamais, et ça lui a coûté d'apprendre

- Une **étape sans trace vérifiable** n'est pas une étape non faite.
- Une **sonde cassée** n'est pas une étape manquante — erreur commise par son propre premier
  passage réel, sur trois de ses propres sondes.

## Son écart connu, mesuré le 2026-09-26

Il reste **2 activités à enjeu sans process écrit** : sonder le quota Gemini, et modifier CLAUDE.md.
Il les signale à chaque passage.

## Sa limite ici

Il lit des traces sur le disque. Une étape qui ne laisse aucune trace lui est structurellement
invisible, et il le dit plutôt que de la compter faite.

## Une fiche en retard sur son script (2026-09-29, tâche #1159)

```
node scripts/god-of-all-process.mjs fiches
```

**Le trou est né d'un constat de la nuit même** : quatre outils avaient reçu une capacité nouvelle,
et AUCUN garde-fou ne signalait que leur fiche ne le disait pas.
`findChangementsIndirectsSansMiseAJour()` rendait `[]` — et il avait raison de son point de vue : il
surveille les PROCESS, jamais les fiches d'outil. **Une dette documentaire qu'aucune mécanique ne
voit est exactement celle qui s'installe.**

**Ce qu'il ne faut surtout PAS mesurer, et c'est toute la difficulté.** « Le script a changé depuis
sa fiche » crierait à chaque refactor, à chaque commentaire ajouté, à chaque faute de frappe
corrigée — le garde-fou accuserait presque tous les jours, et cesserait d'être lu (leçon L4).

**Ce qui est mesuré à la place** : le script a-t-il gagné une **fonction publique** que sa fiche ne
nomme pas ? Un export nouveau est une capacité nouvelle — exactement ce que l'Article 13 oblige à
refléter. Un renommage interne, un commentaire, une correction ne produisent aucun export nouveau et
ne disent donc rien. `exportsPublics()` ne compte que les `export function` : une constante exportée
n'est pas une capacité.

**Deux exemptions, chacune avec son contre-test** : un commentaire ajouté ne crée aucun export ; et
une fonction **déjà nommée dans la fiche** n'est pas en retard, même si le commit de la fiche est
antérieur — rien ne dit qu'elle n'a pas été écrite dans le même geste.

**Il ne tourne PAS au commit, et c'est assumé** : il compare deux versions de chaque script, soit
deux appels git par outil. À la demande et à la Ronde — un contrôle qui ralentit chaque commit finit
par être décâblé.

**Les deux fonctions** : `findFichesEnRetardSurLeurScript()` mesure, `formatFichesEnRetardLines()` rend le
rapport lisible — et le contrôle a immédiatement mordu sur sa propre fiche, qui ne les nommait pas.

**Premier passage réel** : 77 scripts comparés, 7 sans fiche, **15 en retard** — dont
`check-tasks-details` avec 16 fonctions publiques que sa fiche ne nomme pas.
