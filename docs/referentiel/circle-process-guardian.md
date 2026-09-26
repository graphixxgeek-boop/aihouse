# circle-process-guardian — instanciation sur ce projet

*(Membre certifié depuis le 2026-09-26. Blueprint générique :
`docs/circle-process-guardian-blueprint.md`. Registre : `docs/circle-process-guardian/`.)*

## Son rang exact, à ne pas confondre

C'est un **contrôleur de process**, jamais un Gardien sacré du code (Article 20bis) : il surveille
le DÉROULÉ de la Ronde, pas la qualité du code. Le mot `process` dans son nom de fichier est là
pour ça, et c'est ce qui le distingue des sept.

## Ce qu'il fait

Il vérifie mécaniquement que la Ronde CIRCLE-TASKS a été suivie telle que
`docs/circle-process-detail.txt` la décrit — et il peut **bloquer un lancement**.

Quatre contrôles qui portent chacun une connaissance propre à ce projet :
- **la double communication** (`verifyDoubleCommunication`) — la Ronde s'ouvre et se clôt avec
  l'utilisateur, jamais dans le dos ;
- **la fraîcheur des rapports** (`hasFreshReportFile`) — un item marqué fait dont le fichier date
  d'avant la Ronde n'a pas été refait, il a été recopié ;
- **les étapes de clôture** (`ETAPES_DE_CLOTURE`) — la liste exacte, lue, jamais devinée ;
- **la répétition des signaux** (`tendanceDesSignauxDeRonde`) — un même constat qui revient trois
  Rondes de suite n'est plus un signal, c'est une décision qu'on évite.

## Le principe qui l'a construit, et qu'il ne faut pas casser

**JAMAIS un second calcul divergent.** Il réutilise `findOrphanReportFiles()`,
`findRegistriesMissingFromCircle()`, `CIRCLE_ITEMS` et `CIRCLE_REPORT_FOLDERS` déjà écrits. Un
contrôleur qui recalculerait ce qu'il contrôle finirait par contredire l'outil qu'il surveille — et
personne ne saurait lequel des deux croire.

## Comment on s'en sert

```
node scripts/circle-process-guardian.mjs
```

Gratuit. Il est consulté **au lancement de chaque Ronde** — c'est pourquoi il n'a pas d'item de
Ronde à lui : il se vérifierait lui-même.
