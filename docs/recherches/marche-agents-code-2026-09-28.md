# Le marché des agents de code et des runtimes d'agents — recherche du 2026-09-28

*(Recherche web menée à sa demande explicite, AVANT le plan d'action : « les recherches web
maintenant, avant le plan ». Enregistrée sur disque parce que c'est sa règle, écrite dans sa
COMMANDE : « chaque fois que tu fais une recherche WEB, les résultats doivent être enregistrés pour
pouvoir y revenir ». Sujet : ses questions Q1, Q2, Q3 et Q9, et les affirmations de marché du lot
RATIONNALISATION, qui n'étaient pas vérifiées.)*

**Portée honnête** : quatre recherches, sources secondaires pour la plupart (blogs de comparaison,
pages de tarifs relayées). Les chiffres de prix bougent vite et se revérifient à la source avant
toute décision. Ce qui suit sert à **cadrer**, jamais à chiffrer un business plan.

---

## 1. L'affirmation de l'audit est CONFIRMÉE, et c'est la seule que j'ai pu vérifier directement

Le lot RATIONNALISATION avançait « 90 % des développeurs professionnels utilisent des coding agents
au moins chaque semaine, 68 % quotidiennement (JetBrains, mai-juillet 2026) ».

**Vérifié.** L'enquête JetBrains 2026 porte sur **plus de 15 000 développeurs professionnels**,
dixième édition. Sur mai-juillet 2026 : **90 % au moins une fois par semaine, 68 % par jour**.

Et elle apporte un chiffre que l'audit ne citait pas, plus intéressant encore :
**les parts bougent très vite.** Copilot passe de 29 % à **21 %** en un an. Cursor de 18 % en
janvier à **12 %** en mai-juillet. OpenCode, agent open source, atteint **7 %** en partant de rien.

**Ce que j'en tire, et ça compte pour nous** : un marché à 90 % d'adoption n'est pas un marché à
conquérir, c'est un marché installé. Mais des parts qui s'effondrent de 29 à 21 en douze mois disent
qu'aucune position n'y est acquise — y compris pour les gros.

---

## 2. Les prix pratiqués (septembre 2026)

### Agents de code

| Produit | Prix |
|---|---|
| **GitHub Copilot Enterprise** | 39 $/utilisateur/mois — **mais** il exige un siège GitHub Enterprise Cloud à 21 $, soit **60 $ effectifs** avant toute consommation |
| **Cursor Teams** | 40 $/siège · **Premium** 120 $/siège (5× l'usage) |
| **Claude Code** | pas d'abonnement : facturation à l'usage par clé API. L'abonnement Max (100 $/mois) plafonne l'usage sans changer le modèle |
| **Devin Team** | 500 $/mois pour 250 ACUs — une offre d'équipe, pas un prix par siège |

**Le détail qui compte** : depuis juin 2026, Copilot facture le mode agent et les modèles premium
en crédits mesurés (1 crédit = 0,01 $), pendant que la complétion classique reste incluse.
**Autrement dit : l'industrie sépare désormais l'assistance (forfait) de l'agent (à l'usage).**

### Qualité de code — le comparable le plus proche d'une partie de notre Agence

| Produit | Prix |
|---|---|
| **SonarQube Cloud** | gratuit jusqu'à 50 000 lignes · à partir de **34 $/mois** jusqu'à 100 000 lignes |
| **SonarQube auto-hébergé** | Developer ≈ **2 500 $/an** · Enterprise **20 000 $/an et plus**, à la ligne de code |
| **CodeClimate / qlty** | **49 $/utilisateur/mois** (Quality) · **99 $** (Velocity) |

**Le point de méthode** : Sonar facture **à la taille du code**, CodeClimate **par développeur**.
Deux modèles opposés pour le même service — le choix du modèle est une décision de produit à part
entière, pas une conséquence du produit.

*(Repère utile pour sa question Q2 : notre projet fait 97 149 lignes. Chez Sonar, il tomberait
exactement dans la tranche à 34 $/mois.)*

### Runtimes et orchestration d'agents

**AWS Bedrock AgentCore** facture à la consommation : ≈ 0,0895 $ par vCPU-heure + 0,00945 $ par
Go-heure (juillet 2026). **LangGraph / LangSmith** propose un palier auto-hébergé gratuit
(Self-Hosted Lite) et une offre managée.

### Open core, ce que les chiffres disent

Conversion gratuit → payant : **2 à 7 %** pour un outil de développement en bonne santé, **7 % et
plus** pour les meilleurs. Paliers observés : **10 à 50 $/mois** pour un développeur seul,
**500 à 2 000 $/mois** pour une équipe de startup, **à partir de ~50 000 $/an** en entreprise.
Et un chiffre qui justifie le palier gratuit : **73 % des conversions payantes viennent du niveau
gratuit**.

---

## 3. LA TROUVAILLE QUI CONTREDIT EN PARTIE L'AUDIT, et c'est la plus utile

Le lot RATIONNALISATION conclut : ne pas faire « encore un agent de code », viser plutôt
**« un runtime permettant de construire, gouverner, connecter, mesurer et exporter des agences
IA »**. L'idée est séduisante. **La recherche montre qu'elle échange une foule contre une foule plus
grosse.**

Les runtimes et frameworks d'orchestration d'agents recensés en 2026 : **LangGraph · Temporal ·
Microsoft Agent Framework (Semantic Kernel + AutoGen) · CrewAI · OpenAI Agents SDK · Google ADK ·
AWS Bedrock AgentCore · Claude Agent SDK**. C'est-à-dire **Microsoft, Google, Amazon, OpenAI et
Anthropic simultanément**, plus les indépendants. Se positionner là, c'est se placer en face de
cinq plateformes qui possèdent chacune leur propre distribution.

**En revanche, l'autre proposition du même document — celle qu'il jugeait secondaire — tombe sur
une catégorie de marché RECONNUE et bien plus étroite.**

Gartner nomme et suit une catégorie : **« AI-augmented code modernization tools »**, définie comme
les outils qui utilisent des agents spécialisés et de l'analyse déterministe pour accélérer la
transformation des systèmes existants — *analyse profonde du code et de l'architecture,
documentation, cartographie des dépendances, évaluation du risque, planification de migration,
refactoring*.

**C'est mot pour mot ce que ce projet vient de faire sur lui-même pendant deux jours.**

Les acteurs nommés : **vFunction** — qui combine analyse statique et analyse à l'exécution pour
cartographier le comportement réel d'un monolithe Java ou .NET, **exposer la dette dans sa
structure** et **générer des plans de refactoring** — **Moderne Platform**, **IBM Bob** (successeur
de watsonx Code Assistant), **OpenRewrite**, **CodeMorph**.

Et une phrase qui vaut pour nous plus que pour eux : *« les 15 derniers pour cent demandent
toujours une relecture humaine »*. Gartner projette **80 % d'équipes de développement augmentées par
l'IA d'ici 2030**.

**Ce que j'en conclus, et c'est mon avis, pas une donnée** : l'audit avait raison de dire qu'il ne
faut pas faire « un agent qui code ». Mais sa recommandation générique (un runtime d'agences) mène
au marché le plus disputé de 2026, tandis que **sa recommandation spécifique — *AI Agency for
Existing Codebases*, « donnez un projet, l'agence le comprend avant d'y toucher » — tombe dans une
catégorie que Gartner suit déjà, avec des acteurs identifiables et une promesse que nous savons
tenir puisque nous venons de nous l'appliquer.**

La différence entre les deux n'est pas de l'ambition : c'est le nombre de concurrents.

---

## 4. Ce que ça change pour ses questions

- **Q2 (taille de l'agence)** — repère trouvé : Sonar place 97 000 lignes dans sa tranche d'entrée
  à 34 $/mois. Un projet de notre taille est un projet ORDINAIRE pour l'outillage du marché. Sa peur
  d'une agence surdimensionnée n'est pas fondée par les chiffres du marché ; reste à savoir si elle
  l'est par le coût en tokens, qui est une autre question et qui se mesure chez nous.
- **Q9 (prix, CA imaginable)** — les paliers existent et sont cohérents : 10-50 $/mois solo,
  500-2 000 $/mois équipe, ~50 000 $/an entreprise, avec 2 à 7 % de conversion. De quoi faire une
  projection honnête au moment de répondre, avec ses hypothèses écrites.
- **Q1 (produits dérivés)** — le marché valide le découpage : la qualité de code se vend seule
  (Sonar, CodeClimate), le runtime se vend seul (AgentCore), la modernisation se vend seule
  (vFunction). Les trois blocs que l'audit proposait d'extraire ont chacun un marché existant.
- **Q3 (humain seul ou IA + humain)** — 90 % des développeurs professionnels travaillent déjà avec
  un agent au moins chaque semaine. La question « l'agence sert-elle à un humain seul ? » a perdu
  son enjeu commercial : le schéma IA + humain **est** le schéma courant.

---

## Sources

- [AI Coding Agents: Adoption Trends — JetBrains Research](https://blog.jetbrains.com/research/2026/08/ai-coding-agent-adoption-2026/)
- [AI Coding Tools Pricing Compared (2026) — amux](https://amux.io/blog/ai-coding-tools-pricing-2026/)
- [AI Coding Agent Pricing in 2026 — Pondero](https://pondero.ai/coding/guides/ai-coding-agent-pricing-guide-june-2026/)
- [AI Coding Tool Pricing Shake-Up: The June 2026 Guide — Digital Applied](https://www.digitalapplied.com/blog/ai-coding-tool-pricing-june-2026-seat-economics-guide)
- [SonarQube Pricing 2026 — AppSec Santa](https://appsecsanta.com/sonarqube)
- [Plans & Pricing — Sonar](https://www.sonarsource.com/plans-and-pricing/)
- [SonarQube vs Code Climate (2026) — AI Code Review](https://aicodereview.cc/blog/sonarqube-vs-codeclimate/)
- [Best AI Agent Runtime Platforms 2026 — Agentspan](https://agentspan.ai/blogs/best-ai-agent-runtime-platforms-2026/)
- [The best AI agent frameworks in 2026 — LangChain](https://www.langchain.com/resources/ai-agent-frameworks)
- [AI-Augmented Code Modernization Tools — Gartner Peer Insights](https://www.gartner.com/reviews/market/ai-augmented-code-modernization-tools)
- [Legacy Code Modernization with AI Agents (2026) — Tembo](https://www.tembo.io/blog/legacy-code-modernization)
- [AI Code Tools for Legacy System Modernization (2026 Guide) — DEV](https://dev.to/nlocoding/ai-code-tools-for-legacy-system-modernization-2026-guide-22cn)
- [Open Source Monetization Trends, September 2026](https://blog.mean.ceo/open-source-monetization-trends-september-2026/)
- [Developer Tools First 1000 Users Strategy (2026) — RevenueFast](https://revenuefast.in/grow/developer-tool-first-1000-users)
