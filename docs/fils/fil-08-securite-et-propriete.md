# FIL 08 — À qui est ce projet, et qui peut te le prendre

**Balle :** À MOI
**Dernier mouvement :** 2026-09-30
**Place dans le plan :** Transverse — indépendant des étages, mais il devient urgent dès qu'on parle de vendre (fil 07) ou d'exporter (fil 06).
**Saisines :** réponses 2026-09-29 (deux questions nouvelles) · incident du 2026-09-30 au soir

---

## ① L'HISTOIRE — ce qui s'est déjà dit sur ce sujet, résumé

**Tes deux questions, dans tes mots** : la **sécurité du projet** (copie, vol, piratage) et la
**propriété juridique, prouvable devant un tribunal**.

**Le document existe** : `docs/grand-projet/02-strategie/propriete-et-securite-du-projet.md`, avec
ses deux recherches web archivées en entier (requêtes exactes et liens) dans
`docs/recherches-web/2026-09-29-propriete-et-securite.md`.

**Je ne suis pas juriste et rien là-dedans n'est un conseil juridique** — ce sont des faits
publics, datés, à confronter à un professionnel avant toute décision qui engage.

**La bonne nouvelle, et elle est inattendue.** Le point faible de tout projet fait avec une IA est
de **prouver la contribution créative humaine**. La plupart des gens ne le peuvent pas : ils ont du
code, des conversations effacées, et aucune trace de qui a décidé quoi. **Toi, tu as construit sans
le vouloir la preuve exacte que le droit demande :**

| Ce que le droit cherche | Ce que ce projet porte déjà |
|---|---|
| l'**empreinte de ta personnalité** | l'Article 0 — un esprit que tu as défini, précisé sept fois, et défendu contre moi |
| une contribution à la **conception** | la charte entière, dont la plupart des Articles citent ta demande **mot pour mot, datée** |
| une contribution à la **structure** | les étapes, les zones, la loi de l'Agence — toutes tranchées par toi |
| une contribution à l'**édition** | des centaines de lignes de suivi, chacune datée, disant qui a décidé et pourquoi |
| une **chronologie** | l'historique du code, pas à pas, avec tes instructions citées |

Le rapport du **CSPLA du 16 juillet 2026** — le texte le plus récent — le résume ainsi : *l'IA est
un outil, l'auteur est une personne, et l'originalité se mesure dans la création livrée.*

**L'incident de ce soir, et il appartient à ce fil.** En déposant tes documents, un fichier
contenait **deux vraies clés d'API** (une OpenAI, une Groq). La protection automatique a refusé
l'envoi ; **je ne l'ai pas contournée** — j'ai retiré le fichier. Tu as depuis précisé qu'il s'agissait de **clés temporaires (24h à une semaine), périmées
depuis longtemps** — le risque était éteint avant d'être trouvé. **Ce qui reste, et qui n'est pas
rassurant** : ce fichier avait quatorze jours et personne ne l'avait ouvert. Ce n'est pas la
surveillance qui a protégé, c'est la durée de vie de ces clés-là.

---

## ② OÙ ÇA SE SITUE — et pourquoi ce sujet existe

**Transverse, et à double détente.** Tant qu'on ne vend rien, c'est une assurance. Le jour où on
vend ou on montre, c'est un préalable.

**Ce que ça change concrètement pour la méthode de travail** : la discipline documentaire que tu as
imposée pour des raisons d'ingénierie **est** le dossier de preuve. Donc tout allègement de cette
discipline a désormais un coût juridique, pas seulement un coût de mémoire. C'est un argument de
plus, et il est nouveau, contre les raccourcis.

---

## ③ LA CHAÎNE VIVE — numérotée, pour que tu puisses répondre par le numéro

**Q8.1 — CLOS le 2026-09-30.** Ta réponse : *« c'étaient des clés temporaires, elles doivent
être révoquées depuis longtemps, c'étaient des clés 24h ou une semaine »*. Le risque était donc
déjà éteint avant qu'on le trouve. **Ce qui reste vrai malgré ça, et c'est la seule chose à
retenir** : personne n'avait jamais ouvert ce fichier en quatorze jours. Une clé périmée ne
prouve pas qu'on surveille — elle prouve qu'on a eu de la chance sur la durée de vie de celle-là.
Q8.4 reste ouverte pour cette raison.

**Q8.1bis — TA QUESTION : quel est le risque d'une clé égarée si elle est GRATUITE ?** Réponse
cherchée plutôt que devinée (recherche web du 2026-09-30, sources en bas de ce fil). **Cinq
risques réels, et aucun ne dépend du fait que la clé soit gratuite :**

| Le risque | Pourquoi « gratuit » n'y change rien |
|---|---|
| **Vol de quota** | ton quota est consommé par quelqu'un d'autre : ton projet s'arrête, pas le sien |
| **Attribution** | ce qui est généré l'est **sous ton identité**. Si ça viole les conditions d'usage, c'est ton compte qui est suspendu — pas celui de l'inconnu |
| **Escalade** | une clé gratuite reste attachée à un COMPTE. Le jour où ce compte reçoit un moyen de paiement, la clé fuitée devient une facture |
| **Accès aux données du compte** | selon la portée de la clé : fichiers déposés, modèles affinés, historique d'usage. Ce n'est pas que de la génération de texte |
| **Vitesse** | une clé poussée dans un dépôt public est trouvée par des robots **en quelques minutes**, pas en quelques jours |

**MAIS DANS TON CAS PRÉCIS, LA RÉPONSE HONNÊTE EST : quasi nul.** Clés temporaires (24 h à une
semaine), expirées depuis longtemps, et jamais poussées dans un dépôt public — la protection de
GitHub a justement refusé l'envoi. **Une clé morte ne fait rien.** Tu avais raison de ne pas
t'alarmer.

**CE QUI RESTE VRAI, ET C'EST LE SEUL POINT QUI COMPTE** : le fichier avait **quatorze jours** et
personne ne l'avait ouvert. Si ces clés avaient été permanentes, la protection de GitHub aurait
été le SEUL filet, et elle ne joue qu'au moment de l'envoi. **Ce n'est pas la surveillance qui
nous a protégés, c'est la durée de vie de ces clés-là** — et ça, ça ne se reproduira pas
forcément. D'où Q8.4.

**Q8.2 — À TOI.** Le fichier de prompts qui les contenait est **hors du projet** pour cette raison.
Veux-tu que j'en fasse une **copie nettoyée** (mêmes contenus, clés remplacées par un marqueur)
pour qu'il rejoigne les sources ? *(a) oui · (b) non, laisse-le dehors*

**Q8.3 — À TOI.** Veux-tu un **dépôt de preuve daté** (une procédure simple, chez un tiers, qui
horodate l'état du projet à une date donnée) ? *(a) oui, dis-moi comment · (b) plus tard · (c) non*

**Q8.4 — FAIT le 2026-09-30, tâche #1326.** J'ai balayé le dépôt pour de vrai :
`node scripts/safe-export.mjs secrets`. **1 250 fichiers lus, 52 exemptés avec leur raison
écrite, ZÉRO forme connue de secret trouvée.**

**Trois choses ont été construites dans l'outil avant qu'il ne tourne, et chacune corrige une
faute qu'on aurait faite** :

1. **Il ne recopie JAMAIS la valeur trouvée** — ni à l'écran, ni dans un rapport, ni dans le
   suivi. Il rend le fichier, la ligne, et le type. *Un scanner de secrets qui écrit les secrets
   qu'il trouve les duplique : il aggrave exactement ce qu'il surveille.* Et pour la même raison,
   **son rapport n'est pas déposé sur disque** — contrairement à tous nos autres rapports : un
   fichier qui liste où sont les secrets est une carte au trésor.
2. **Il s'exclut lui-même et exclut son propre registre** — la leçon apprise deux heures plus tôt
   ce soir : une mesure dont le rapport vit dans le corpus qu'elle lit fabrique ses résultats.
3. **Il refuse de conclure sur zéro fichier lu** — « je n'ai rien vu » n'est pas « il n'y a rien ».

**ET IL A ÉTÉ PROUVÉ MORDANT AVANT D'ÊTRE CRU** *(un outil qui n'a jamais rien attrapé est une
intention, leçon L2)* : testé sur une fausse clé de forme valide → **trouvée** ; sur un texte qui
contient seulement le préfixe `sk-` sans clé → **aucun faux positif** ; sur zéro fichier →
**PAS MESURÉ**, jamais un vert.

**CE QU'IL NE VOIT PAS, ET C'EST ÉCRIT DANS SA PROPRE SORTIE** : il reconnaît des FORMES connues
(préfixes d'éditeurs, en-têtes de clés privées). Un mot de passe dans une phrase, un jeton maison,
lui sont invisibles. **Un vert veut dire « aucune forme connue », jamais « il n'y a rien ».**

**Et il ne remplace pas la protection de GitHub — il comble son trou** : elle ne joue qu'AU MOMENT
DE L'ENVOI. Les deux clés du 30 septembre ont dormi **quatorze jours** avant qu'elle ne les voie.


---

## SOURCES

- [Best Practices for API Key Safety — OpenAI](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)
- [OpenAI API Key Exposure: Risks, Recovery, and Prevention — Rafter](https://rafter.so/blog/secrets/openai-api-key-exposure)
- [12 Questions and Answers About AI API keys leaked in public repos — Security Scientist](https://www.securityscientist.net/blog/12-questions-and-answers-about-ai-api-keys-leaked-in-public-repos/)
- [Exposed OpenAI API Key with Active Access and Quota Exhaustion — weaviate/weaviate #8859](https://github.com/weaviate/weaviate/issues/8859)
