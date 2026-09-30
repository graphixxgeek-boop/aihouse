# FIL 13 — Se brancher sur ce que d'autres savent : base locale, base en ligne, ou les deux

**Balle :** À TOI
**Dernier mouvement :** 2026-09-30
**Place dans le plan :** Transverse — il touche l'Agence (ce qu'elle sait), le produit (ce qu'elle emporte) et la sécurité (ce qu'elle laisse entrer).
**Saisines :** demande du 2026-09-30 au soir · fil 07

---

## ① L'HISTOIRE — ce qui s'est déjà dit sur ce sujet, résumé

**Ce fil naît d'une question posée en marge de la plaquette, et c'est la plus tournée vers
l'extérieur de tout le projet :**

> *« Base de données locale ou EN LIGNE ou les 2 : existe-t-il une base en ligne de bonnes
> pratiques, de leçons, trouvailles, découvertes — une base accessible aux IA pour s'aider
> mutuellement dans l'aide au codage pour les humains ? Une base gratuite, accessible, qu'on
> pourrait plugger librement à l'agence (et aussi révoquer ce plug si demain ça pose souci). »*

**Le contexte qui la rend légitime, et il est mesuré** : notre registre de leçons compte
47 entrées, dont **38 portent sur la MÉTHODE** et seulement 3 sur notre jeu. **93 % de ce qu'on a
appris est transposable** — donc, symétriquement, une part de ce que d'AUTRES ont appris nous
serait utile. La question n'est pas théorique.

### CE QUE J'AI TROUVÉ, ET CE QUE JE N'AI PAS TROUVÉ

*(Recherche web du 2026-09-30. Sources listées en bas de ce fil. **Je n'ai pas essayé ces outils** :
je rapporte ce qui existe, pas ce qui marche.)*

**Ce qui N'EXISTE PAS, et c'est la réponse principale : il n'y a pas de « Wikipédia des leçons de
codage pour IA ».** Pas de base publique, unique, gratuite et communautaire où les agents
déposeraient et reliraient ce qu'ils ont appris. Ton intuition décrivait une chose qui n'a pas
encore d'équivalent.

**Ce qui existe à la place, en trois familles** :

| Famille | Ce que c'est | Pour nous |
|---|---|---|
| **Mémoires partagées d'équipe** *(Memco, Supermemory, Bhived)* | une base que TON organisation remplit, partagée entre TES agents | ce n'est pas « ce que d'autres savent », c'est « ce que nous savons, mieux rangé » |
| **Catalogues de bonnes pratiques éditoriales** *(les dépôts de « skills » publiés par les éditeurs)* | des recettes publiées par un acteur, lues par les agents | à sens unique : on consomme, on ne contribue pas |
| **Le protocole de branchement lui-même** *(MCP)* | la norme qui permet de brancher une source extérieure sur un agent | **c'est la bonne nouvelle : c'est exactement ton « plugger et révoquer »** |

**LA VRAIE TROUVAILLE EST ARCHITECTURALE, PAS UN SITE À VISITER.** Ta condition — *« qu'on
pourrait plugger librement et aussi révoquer ce plug si demain ça pose souci »* — décrit
littéralement ce qu'est un branchement MCP : une source extérieure se déclare, se connecte, et se
retire **sans toucher au reste**. Donc la question « où est la base ? » est moins urgente que la
question « notre Agence sait-elle accueillir une source extérieure et la débrancher ? ».
**Aujourd'hui : non. Rien n'est prévu pour ça.**

---

## ② OÙ ÇA SE SITUE — et pourquoi ce sujet compte plus qu'il n'en a l'air

**Il touche les trois projets à la fois.** Pour l'Agence : elle arriverait chez un client avec
38 leçons de méthode déjà payées, et pourrait en recevoir d'autres. Pour le produit : « se
brancher sur ce que d'autres savent » est un argument de vente qu'aucun compteur ne remplace.
Pour la sécurité : **laisser entrer du savoir extérieur, c'est laisser entrer quelque chose qu'on
n'a pas écrit** — et notre règle la plus centrale est de ne jamais laisser passer pour un fait ce
qui n'en est pas un.

**Ce dernier point est le vrai sujet, et il a un nom dans la littérature** : la validation des
contributions. Un des projets trouvés est construit exactement autour de ça — *« comment partager
des leçons entre agents sans faire confiance à chaque écriture »*. **C'est notre question, posée
par quelqu'un d'autre avant nous.**

---

## ③ LA CHAÎNE VIVE — numérotée, pour que tu puisses répondre par le numéro

**Q13.1 — À TOI.** Dans quel sens veux-tu que ça marche, en premier ? *(a) on CONSOMME — l'Agence
lit ce que d'autres ont publié · (b) on PUBLIE — nos 38 leçons de méthode sortent · (c) les deux,
mais consommer d'abord · (d) les deux, mais publier d'abord*

**Q13.2 — À TOI, et c'est la question de fond.** Une leçon venue de l'extérieur, on la traite
comment ? *(a) comme une donnée à vérifier avant usage, jamais comme une règle · (b) comme nos
propres leçons, au même rang · (c) on ne laisse rien entrer, on publie seulement*

**Q13.3 — À TOI.** Publier nos leçons, ça veut dire les rendre publiques. Ça t'engage sur la
propriété (fil 08) et ça montre notre méthode. *(a) d'accord, c'est de la méthode, pas du secret ·
(b) pas avant d'avoir décidé si on vend · (c) non*

**Q13.4 — MESURÉ le 2026-09-30, tâche #1330, et le résultat est meilleur que prévu : 36 leçons
sur 38 sont publiables telles quelles.**

La question était : combien de nos leçons de méthode tiennent debout **sans leur exemple local** ?

| | |
|---|---|
| leçons numérotées | **41** |
| liées au Jeu, donc hors sujet ici | 3 *(L16, L17, L24)* |
| de MÉTHODE | **38** |
| dont le **titre** est universel tel quel | **36** |
| dont le titre cite quelque chose de local | 2 *(L36, L39)* |

**LA MESURE S'EST TROMPÉE UNE FOIS AVANT D'ÊTRE JUSTE, ET LA CORRECTION EST LA TROUVAILLE.** Mon
premier compte regardait le titre **et les deux premiers paragraphes**, et rendait *« 9 leçons à
reformuler »*. **En ouvrant deux d'entre elles à la main, le verdict s'est inversé** : leurs
titres sont parfaitement universels — *« Un chiffre qui BOUGE n'est pas un chiffre qui
s'AMÉLIORE »*, *« Un test qui lit une donnée VIVANTE ne juge pas le code, il juge le disque »* —
et c'est le paragraphe d'illustration juste en dessous qui cite un numéro de tâche.

**Je mesurais donc « le bloc contient une référence locale » en croyant mesurer « le principe
n'est pas publiable ».** Encore le même motif : un signal adjacent pris pour le signal visé. Sans
l'ouverture à la main, j'aurais publié « 9 leçons à reformuler » au lieu de « 2 ».

**CE QUE ÇA CHANGE CONCRÈTEMENT** : la structure de nos leçons est **déjà** celle d'un corpus
publiable — **un titre qui énonce le principe, un corps qui l'illustre avec notre cas**. Publier
ne demande donc pas de réécrire : ça demande de **séparer** ce qui est déjà séparé. Le travail
réel se limite aux **2 titres** qui citent du local.

**LA LIMITE, ET ELLE COMPTE** : un titre universel n'est pas un titre *compréhensible seul*. « Un
chiffre qui bouge n'est pas un chiffre qui s'améliore » se comprend ; d'autres demanderont deux
phrases de contexte que nous seuls pouvons écrire. **La mesure dit ce qui est transposable, jamais
ce qui est lisible par un étranger** — ça, seul un étranger peut le dire (fil 11).

**Q13.5 — MESURÉ le 2026-09-30, tâche #1331. La réponse est NON, et elle est plus nette que ce
que je croyais.**

Je disais « je crois que non » — et « je crois » n'est pas une mesure. Voici la mesure.

**LA BONNE NOUVELLE D'ABORD, ET ELLE EXISTAIT DÉJÀ.** Une mesure que je n'avais pas cherchée
répond à la moitié de ta question — `node scripts/safe-export.mjs tuyauterie` : **85 scripts,
94 % indépendants d'un fournisseur.** Seuls **cinq** sont liés à un fournisseur précis, tous
nommés. **L'Agence n'est donc pas prisonnière de Gemini** ; elle pourrait travailler avec autre
chose. C'est un vrai acquis, et il n'était écrit nulle part.

**LA MAUVAISE, ET C'EST TA QUESTION EXACTE : il n'y a AUCUN point de branchement.**

| Ce qu'il faudrait | Ce qu'il y a |
|---|---|
| un endroit où déclarer une source extérieure | **rien** — aucun fichier de configuration de sources n'existe |
| un moyen de la retirer sans toucher au code | **rien** — chaque source est un tableau **écrit dans le code** (`REGISTRIES`, `PROCESSES`, `CIRCLE_ITEMS`…) |
| une variable d'environnement, un fichier à part | **rien** |

**Donc aujourd'hui, brancher une source = modifier du code. La débrancher = modifier du code une
seconde fois.** Ta condition — *« plugger librement, et révoquer ce plug si demain ça pose
souci »* — n'est satisfaite sur aucun des deux côtés.

**CE QUE ÇA VEUT DIRE, ET CE QUE ÇA NE VEUT PAS DIRE.** Ce n'est pas une architecture ratée : le
projet n'a jamais eu de source extérieure, donc il n'a jamais eu besoin d'un point de branchement.
**Le manque est normal ; le découvrir maintenant est la bonne nouvelle.** Ce qui serait fautif,
c'est de vendre « connectable » avant que ce soit vrai — et la plaquette ne le dit pas, elle a eu
cette prudence-là.

**Q13.6 — À TOI, et c'est un vrai arbitrage de conception.** Faut-il un point de branchement
unique et déclaré ? *(a) oui, c'est le préalable à toute source extérieure · (b) pas tant qu'on
n'a pas choisi une source précise — on verra quand le besoin sera réel · (c) jamais : chaque
source est un cas, on assume de coder à chaque fois*

---

## SOURCES

*(Recherche du 2026-09-30. Rapportées telles quelles : aucune n'a été essayée.)*

- [How we designed shared lessons for AI agents without trusting every write-back — DEV](https://dev.to/yossuf_yahya_18a700ec83d8/how-we-designed-shared-lessons-for-ai-agents-without-trusting-every-write-back-4oi6)
- [Memco — shared memory for AI agents](https://www.memco.ai/)
- [9 Best Shared Memory Solutions for Multi-Agent Systems in 2026](https://www.memorylake.ai/en/blogs/best-shared-memory-solutions-for-multi-agent-systems)
- [Best AI Agent Memory Systems in 2026: 8 Frameworks Compared](https://vectorize.io/articles/best-ai-agent-memory-systems)
- [6 agentic knowledge base patterns emerging in the wild — The New Stack](https://thenewstack.io/agentic-knowledge-base-patterns/)
- [microsoft/skills — Skills, MCP servers, Custom Agents for grounding coding agents](https://github.com/microsoft/skills)
- [ai-agents-memory — GitHub Topics](https://github.com/topics/ai-agents-memory)
