# D'autres produits livrables en ZIP ? un marché ? faut-il s'imposer vite ?

> **Ta demande ⑦, mot pour mot** : *« est-ce que ça ouvre un nouveau marché ? comment dominer et
> prendre le contrôle tout de suite […] fais des recherches sur le web (à enregistrer) »*.
> Tâche **#1347**.
> **Trois questions distinctes**, et les fondre serait l'erreur : ① d'autres objets se livrent-ils
> ainsi · ② est-ce un marché ou une pratique · ③ faut-il occuper le terrain vite.
> **La troisième est une question de conviction autant que de fait**, et je le dis avant d'y
> répondre.

---

## ① D'AUTRES OBJETS SE LIVRENT-ILS DE CETTE FAÇON ? — OUI, et c'est devenu une catégorie

Ce que tu décris — **un dossier qu'on dépose dans un projet et qu'une IA lit pour savoir quoi
faire** — porte un nom depuis 2026 : un **agent plugin**. Le même paquet peut contenir des
*skills* (des instructions que l'IA lit), des *hooks* (du code déclenché par des événements), des
*subagents* et des *serveurs MCP* (des outils que l'IA peut appeler).

**Ce n'est pas une analogie : c'est exactement la forme de l'Agence.**

## ② EST-CE UN MARCHÉ ? — OUI, ET IL A DÉJÀ SON STANDARD. C'est la vraie nouvelle.

**Agent Plugins 1.0.0**, publié en août 2026, est un **standard ouvert et sans propriétaire** pour
empaqueter tout ça dans un seul dossier portable : un manifeste `plugin.json` à la racine, un
dossier `skills/`, un fichier `mcp.json`, et exactement deux variables d'environnement réservées
(`PLUGIN_ROOT`, `PLUGIN_DATA`).

**Qui est derrière** : Vercel l'a proposé, et **OpenAI, GitHub, Microsoft, AWS, Google et Cursor**
l'ont travaillé avec eux. Supporté au lancement par ChatGPT/Codex, Cursor, GitHub Copilot, Kiro et
VS Code.

**Et le marché est déjà occupé par des gros** : Shopify a publié son *AI Toolkit* en avril 2026,
AWS son *Agent Toolkit* en mai — tous deux exactement dans cette forme : un namespace unique
contenant serveur MCP, skills et plugin.

**⚠️ UN POINT QUI NOUS CONCERNE DIRECTEMENT** : **Claude Code n'est pas compatible** avec ce
standard — il garde son propre format (`.claude-plugin/plugin.json`, avec `commands/`, `agents/`,
`skills/`, `hooks/`, `.mcp.json` séparés). Nous développons sur Claude Code. **Le format que nous
connaissons n'est pas celui que le reste du monde vient d'adopter.**

## ③ FAUT-IL S'IMPOSER VITE ? — ET C'EST LÀ QUE JE NE SUIS PAS D'ACCORD AVEC LA QUESTION

**Ta question suppose un terrain vide à occuper. Il ne l'est pas** : le standard existe, il est
porté par six des plus gros acteurs du secteur, et deux entreprises majeures ont déjà livré dans
ce format. **« Dominer et prendre le contrôle tout de suite » n'est pas une option disponible** —
la fenêtre où ça l'aurait été s'est fermée vers août 2026.

**Ce qui EST disponible, et qui vaut mieux** : le standard dit **comment empaqueter**, jamais
**quoi mettre dedans**. Les toolkits publiés par Shopify et AWS empaquettent *l'accès à leurs
propres produits*. **Personne n'empaquette de la DISCIPLINE DE TRAVAIL** — un garde-fou qui refuse
un chiffre non mesuré, un contrôle qui distingue « rien trouvé » de « rien mesuré », un registre
de solutions concrètes. C'est précisément ce que l'Agence contient, et c'est ce qu'aucun des
toolkits existants ne contient.

**La bonne stratégie n'est donc pas d'occuper le terrain, c'est de se rendre INSTALLABLE sur le
terrain des autres** — et ça veut dire se conformer au standard plutôt qu'inventer le nôtre.

**Ce que ça coûte, et c'est la bonne nouvelle** : la conformité porte sur l'**emballage** (un
manifeste, des dossiers à des emplacements fixes), jamais sur le contenu. L'Agence a déjà 85 kits
d'export complets et 0 script avec une cible écrite en dur. **Le travail serait de l'emballage,
pas de la réécriture.**

---

## CE QUE JE NE SAIS PAS, ET QUI COMPTE

- **Si le standard tiendra.** Il a huit mois. Un standard porté par six géants peut quand même
  mourir, et Claude Code est déjà hors du rang.
- **S'il y a un marché PAYANT.** J'ai trouvé un écosystème et des publications d'entreprises ; je
  n'ai trouvé **aucune donnée sur quelqu'un qui VEND un plugin d'agent**. Les toolkits cités sont
  tous gratuits et servent à vendre autre chose. **C'est une absence de donnée, pas une réponse.**

---

## Les questions

**QM1 — Vise-t-on la conformité à Agent Plugins 1.0.0 ?** C'est de l'emballage, et ça décide de
qui peut installer l'Agence. *(a) oui, on s'y conforme · (b) on reste au format Claude Code ·
(c) les deux, le jour où ça compte*

**QM2 — Le modèle économique.** Les toolkits existants sont gratuits et servent à vendre autre
chose. **Vends-tu l'Agence, ou vends-tu ce qu'elle permet ?** Je n'ai aucune donnée qui tranche,
et c'est ta décision, pas une mesure.

---

## Plan d'action

| État | Constat | Ce qui en découle |
|---|---|---|
| **RETENU** | la catégorie existe, elle a un standard de 8 mois, porté par 6 acteurs majeurs | consigné ici, rattaché à **#1347** |
| **RETENU** | Claude Code n'est pas compatible avec ce standard, et c'est notre environnement | à savoir avant toute décision d'emballage — **#1347** |
| **À TRANCHER** | conformité au standard (QM1) et modèle économique (QM2) | **tes décisions** |
| **ÉCARTÉ** | la stratégie « dominer et prendre le contrôle tout de suite » | **raison écrite** : elle suppose un terrain vide. Le terrain est occupé depuis août 2026 par un standard que six géants portent. Poursuivre cette voie coûterait du temps pour un résultat que les faits rendent inatteignable — et la vraie place est ailleurs : **personne n'empaquette de la discipline de travail.** |

---

**Sources** :
[Agent Plugins 1.0.0 — annonce Vercel](https://vercel.com/changelog/introducing-agent-plugins-1-0-0) ·
[le site du standard](https://agent-plugins.org/) ·
[la spécification 1.0.0](https://github.com/agentplugins/agent-plugins-spec/blob/main/spec/1.0.0.md) ·
[Google Developers Blog](https://developers.googleblog.com/agent-plugins-package-your-skills-tools-and-more/) ·
[guide Vercel](https://vercel.com/kb/guide/agent-plugins) ·
[le format propre à Claude Code](https://jsmanifest.com/claude-code-plugin-packaging-guide) ·
[Agent Toolkit for AWS](https://aws.amazon.com/products/developer-tools/agent-toolkit-for-aws/)
