# Registre des convocations — CASSANDRA-RH

*(Une convocation par ligne. **Une convocation ne se clôt QUE avec un accord daté de l'utilisateur
ET une raison écrite** : c'est la règle non négociable posée par lui — « l'agent ne doit pas faire
taire l'alerte ». Toute autre tentative est relayée nommément, jamais avalée, parce qu'un agent qui
écrit lui-même « traité » fait disparaître l'alerte sans que personne d'autre l'ait vue.)*

**Trois convocables, et le second est celui qui empêche ce registre de devenir un tribunal à sens
unique** : l'**outil** (un membre de l'Agence), l'**agent** (un outil jamais appelé est son
manquement, jamais celui de l'outil), et l'**utilisateur** lui-même, à sa demande explicite.

**TROIS DÉCISIONS POSSIBLES, jamais deux ni quatre** *(2026-09-27, tâche #709 — sa correction :
« production d'une decision + tache si besoin »)* :

- **CORRIGÉ** — la convocation est éteinte par un changement réel, vérifiable dans le dépôt.
- **SURSIS** — on ne tranche pas aujourd'hui, **mais on dit quand**. Il s'écrit
  `SURSIS jusqu'au AAAA-MM-JJ — <raison>` dans la case de clôture, sous cette forme exacte : une
  échéance notée en prose libre est une échéance que personne ne vérifiera jamais. Passé la date,
  `node scripts/cassandra-rh.mjs convocation` la **reconvoque d'un cran plus haut**, et le cran se
  lit sur cette ligne (combien de fois « SURSIS » y figure) plutôt que dans un compteur à côté.
- **RETIRÉ** — l'outil part. Accepter qu'un outil finisse par être retiré fait partie du marché ;
  un dispositif dont aucune issue ne mène là n'est pas une évaluation, c'est une cérémonie.

Deux décisions (garder/retirer) auraient forcé la main sur un outil qu'on n'a pas eu le temps de
juger, donc produit des « garder » par défaut qui ne décident rien. Une quatrième (« à voir »)
rouvrirait la porte que le sursis vient de fermer. **La décision reste humaine à chaque cran** : ce
mécanisme ne retire jamais un outil tout seul.

| Date | Convoqué | Sujet | Motif | La question posée | Clôture (date + raison + accord utilisateur) |
|---|---|---|---|---|---|
| 2026-09-24 | **AGENT** | `the-final-judge` | jamais-sollicité | Pourquoi n'a-t-il jamais été appelé ? Inutile, mal nommé, mal placé dans le catalogue, ou est-ce moi qui ne pense pas à lui ? | **OUVERTE** — et elle recoupe exactement la tâche #205, « corriger mon biais vers les outils à retour immédiat », ouverte par l'utilisateur avant que ce mécanisme existe. Le premier passage de la convocation confirme mécaniquement ce qu'il avait vu à l'œil nu. |
| 2026-09-24 | **AGENT** | `the-deep-reader` | jamais-sollicité | Idem. | **OUVERTE.** Nuance honnête à vérifier avant de conclure : ces deux outils s'appellent via l'outil `Agent`, pas en ligne de commande — il est possible que `tool-usage` ne puisse structurellement pas les voir. Si c'est le cas, le défaut est dans la MESURE et pas dans mon usage, et il faudra le dire plutôt que battre sa coulpe. À vérifier, jamais à supposer. |
| 2026-09-24 | **UTILISATEUR** | exigence `scanner-sait-refuser` | ne-progresse-pas | Moins de la moitié des outils concernés (10/22) savent répondre « pas mesuré » : faut-il la niveler partout, ou l'exigence est-elle trop large ? | **OUVERTE** — porte sur une exigence, donc sur un choix de fond que l'agent ne tranche pas. |
