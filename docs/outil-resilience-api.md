# Smart Breaker — blueprint exportable de l'outil de résilience face aux blocages de clé API

*(Créé le 2026-09-18, à la demande explicite de l'utilisateur : « je veux que cet outil soit
exportable et utilisable dans un autre projet ». Baptisé **Smart Breaker** le 2026-09-19, à la
demande explicite de l'utilisateur, purement pour le plaisir de lui donner un nom — un nom
d'usage donné à l'ensemble `scripts/check-gemini-quota.mjs` + `scripts/gemini-key-health.mjs` +
`scripts/api-providers.mjs` + `lib/gemini-keys.ts`, jamais un renommage des fichiers eux-mêmes
(inchangés, pour ne courir aucun risque de casser les références croisées entre eux). Distinct
des trois autres documents-cadre du projet : `CLAUDE.md` (charte de contenu du jeu),
`docs/regles-de-travail.md` (process de collaboration), `docs/philosophie-et-politique.md`
(valeurs et arbitrages) — celui-ci est un blueprint TECHNIQUE, portable vers n'importe quel
projet qui appelle une API tierce à quota/clé limités, indépendant du contenu narratif de
"Maison IA vivante".)*

**Ce que ce document N'EST PAS.** Il ne contient jamais l'historique d'apprentissage accumulé par
CE projet (le contenu de `.gemini-key-health.json`, jamais committé, propre à ce projet et à ses
clés) — cet historique est par nature spécifique à un déploiement donné et n'a aucun sens ailleurs.
Ce document décrit la STRUCTURE de l'outil, pas les leçons déjà apprises avec elle. Un nouveau
projet qui adopte ce blueprint démarre avec un historique vide, exactement comme celui-ci l'a fait.

**Mise à jour de ce document.** À faire à chaque évolution STRUCTURELLE de l'outil dans ce projet
(nouvel algorithme d'ordonnancement, nouvelle couche de garde-fou, nouveau type de fournisseur
générique) — jamais pour une évolution qui reste propre au contenu Gemini/CLAUDE.md de ce projet
(ex. ajouter un modèle Gemini candidat de plus n'a pas sa place ici). Référence d'implémentation
actuelle dans ce dépôt : `scripts/gemini-key-health.mjs`, `scripts/api-providers.mjs`,
`scripts/check-gemini-quota.mjs`.

## 1. Principe fondateur

*(Formulation explicite de l'utilisateur, 2026-09-18 : « je veux que l'outil ait une connaissance
fine de la clef API de façon à pouvoir la dominer : c'est le principe fondateur de l'outil qui lui
permet d'atteindre son objectif : contourner les obstacles et blocages posés par la clef API ».)*

L'outil ne réagit jamais à l'aveugle à un blocage isolé (un 429 vu une fois, une supposition sur
ce qui devrait marcher). Son objectif est de connaître CHAQUE clé/fournisseur configuré assez
finement — par modèle ou endpoint, dans le temps, épisode par épisode — pour anticiper et
contourner ses blocages avant qu'ils ne bloquent une vraie session de travail. Plus l'outil est
utilisé, plus sa connaissance s'affine ; jamais l'inverse. Une sonde ponctuelle répond à l'instant
présent ; la mémoire d'expérience répond à la durée.

## 2. Architecture en quatre couches

### 2.1 Sonde par fournisseur (abstraction de fournisseur)

Chaque fournisseur d'API (Gemini, OpenAI, Anthropic, un service interne, etc.) expose la MÊME
interface, quel que soit son format d'endpoint/auth/réponse réel :

```js
// probe(key, model, options?) → { status, ms, detail? }
// status ∈ "OK" | "OK_VIDE" | "QUOTA_ÉPUISÉ" | "HTTP xxx" | "ERREUR_RÉSEAU" — vocabulaire commun à
// tous les fournisseurs, pour que le reste de l'outil n'ait jamais à connaître le format propre à
// l'un d'eux.
async function probeExampleProvider(key, model, { heavy = false } = {}) {
  const started = Date.now();
  try {
    const r = await fetch(ENDPOINT_FOR(model), { headers: authHeaderFor(key), body: bodyFor(model, heavy), ... });
    const ms = Date.now() - started;
    const body = await r.json().catch(() => ({}));
    if (r.status === 200) return { ...inspectBody(body), ms }; // cf. ci-dessous : 200 ≠ contenu exploitable
    if (r.status === 429) return { status: "QUOTA_ÉPUISÉ", ms, detail: /* motif si dispo */ };
    return { status: `HTTP ${r.status}`, ms };
  } catch (e) {
    return { status: "ERREUR_RÉSEAU", ms: Date.now() - started, detail: e.message };
  }
}

export const PROVIDERS = {
  exampleProvider: { probe: probeExampleProvider, defaultCandidates: ["model-cheap", "model-mid"] },
  // ajouter un fournisseur = ajouter une entrée ici, jamais réécrire le reste de l'outil
};
```

Ajouter un nouveau fournisseur ne touche jamais l'algorithme d'ordonnancement ni le format de
mémoire — c'est tout le point de cette couche.

**Deux principes ajoutés le 2026-09-19, après un cas réel rencontré sur ce projet, généralisables à
toute API tierce à quota limité :**

- **Une réponse techniquement réussie n'est pas toujours un vrai succès.** Un fournisseur peut
  renvoyer un statut "OK" sans le moindre contenu exploitable (filtre de sécurité, coupure
  prématurée, réponse vide) — un `inspectBody()` dédié distingue ce cas (`OK_VIDE`) d'un vrai
  succès, pour ne jamais le compter comme une preuve de disponibilité.
- **Le POIDS d'une requête peut influencer la réponse du fournisseur, indépendamment du quota
  restant.** Un fournisseur peut répondre différemment (OK vs erreur, ou un code d'erreur différent)
  pour la MÊME clé/modèle au même instant selon que la requête est minimale ou proche de la charge
  réelle de production. Une sonde purement minimale (rapide, quasi gratuite) peut donc donner un
  faux sentiment de disponibilité. Solution : un paramètre `heavy` sur `probe()`, utilisé
  parcimonieusement (seulement sur le modèle réellement utilisé par l'application, jamais sur toute
  la liste de candidats — Article 8/sobriété), qui reproduit la TAILLE approximative d'une vraie
  requête de production (jamais son contenu réel) pour vérifier que le diagnostic léger n'est pas
  trompeur.

### 2.2 Mémoire d'expérience locale, jamais committée

- Fichier local, listé dans `.gitignore`, jamais dans git — l'accumulation vaut pour la durée de
  vie d'un environnement/conteneur, pas au-delà. Conséquence honnête à ne jamais masquer : un
  nouvel environnement repart d'un historique vide.
- Chaque clé est identifiée par une **empreinte courte** (ex. 6 premiers + 4 derniers caractères),
  jamais la valeur complète — même dans un fichier jamais committé, précaution supplémentaire.
- Une entrée mémorise, par modèle/endpoint : dernier résultat connu, horodatage, et un journal
  borné des derniers épisodes (ex. 100 max, pour ne jamais grossir indéfiniment).

```js
function keyLabel(entry) {
  const { provider, key } = normalize(entry); // string nue = fournisseur par défaut, ou {provider,key}
  const fingerprint = key.slice(0, 6) + "…" + key.slice(-4);
  return provider === DEFAULT_PROVIDER ? fingerprint : `${provider}:${fingerprint}`;
}
```

### 2.3 Algorithme d'ordonnancement : signal primaire vs sonde secondaire

Piège réel rencontré en construisant cet outil (Gemini) : une sonde sur un modèle rarement utilisé
mais presque toujours en quota serré (ex. le plus gros/plus cher modèle candidat) peut faire
passer une clé PAR AILLEURS SAINE pour "encore à plat", simplement parce que son échec a été la
DERNIÈRE tentative enregistrée. La correction généralisable :

- Retenir un signal `lastTouchedAt`/`lastTouchedOutcome` unique par clé, jamais un mélange
  "meilleure marque toutes catégories" entre modèles/endpoints différents.
- Distinguer explicitement, à chaque appel qui enregistre une issue, si cette tentative doit ou non
  faire autorité sur ce signal (`asKeySignal: true` par défaut) — une sonde sur le modèle/endpoint
  RÉELLEMENT utilisé par l'application fait autorité ; une sonde diagnostique sur un candidat
  secondaire ne doit jamais l'écraser (`asKeySignal: false`).
- Trier par ce signal (bon vu récemment > jamais testé > mauvais vu récemment), jamais retirer une
  clé de la liste : un quota se renouvelle, "épuisée hier" n'est pas "morte pour de bon".

```js
export function recordOutcome(entry, model, outcome, asKeySignal = true) {
  const data = load();
  const label = keyLabel(entry);
  const record = data.keys[label] ?? { models: {}, episodes: [] };
  const now = Date.now();
  record.models[model] = { lastOutcome: outcome, lastAt: now };
  if (asKeySignal) { record.lastTouchedAt = now; record.lastTouchedOutcome = outcome; }
  record.episodes = [...record.episodes, { at: now, model, outcome }].slice(-100);
  data.keys[label] = record;
  save(data);
}

export function orderKeysByExperience(entries) {
  const data = load();
  const rank = (outcome) => (outcome === "OK" ? 2 : outcome === undefined ? 1 : 0);
  return entries
    .map((entry, index) => ({ entry, index, ...scoreOf(data, entry, rank) }))
    .sort((a, b) => b.rank - a.rank || b.lastTouchedAt - a.lastTouchedAt || a.index - b.index)
    .map((s) => s.entry);
}
```

### 2.4 Historique curaté, séparé de l'expérience automatique

Distinct de la mémoire ci-dessus : un tableau écrit À LA MAIN (jamais généré par une sonde) des
leçons empiriques déjà comprises en creusant de vrais blocages — nature exacte du quota, pièges de
lecture des erreurs de l'API, comportements de fournisseur contre-intuitifs constatés. Sert à ne
jamais redécouvrir deux fois la même leçon à des mois d'écart. S'affiche à côté de l'expérience
automatique, jamais confondu avec elle (l'un est vécu par la machine, l'autre compris ensemble).

## 3. Garde-fous de sécurité, non négociables

- **Jamais écrire dans un fichier de configuration réel** (`.env`, `.dev.vars` ou équivalent) sans
  un geste explicite de la personne qui travaille dessus — l'outil affiche une suggestion à copier
  soi-même, jamais un changement silencieux.
- **Jamais la clé en clair** dans un log, un fichier de mémoire, une sortie console ou un message —
  toujours l'empreinte courte.
- **Jamais de bascule de fournisseur/modèle en production sans validation qualité intégrale**
  préalable, refaite à chaque évolution substantielle du prompt/contrat de sortie : un fournisseur
  de repli peut répondre différemment, avec un impact sur la qualité qu'aucun test automatique ne
  peut entièrement garantir — seule la lecture humaine des réponses avant activation apporte une
  vraie garantie.
- **Interrupteur d'urgence toujours disponible sans changement de code** : désactiver un repli en
  production doit être un simple retrait de variable d'environnement/secret, réversible en un
  geste.
- **Une clé invalide (401/403) passe directement à la suivante** sans gaspiller de tentatives sur
  ses autres modèles/endpoints ; seul un 429/503 (blocage temporaire, pas une clé morte) justifie
  d'essayer d'autres modèles sur la même clé.
- **Une panne réseau ne déclenche jamais un repli de fournisseur** : elle touche l'infrastructure
  entière, pas une clé ou un modèle en particulier — un `catch` réseau immédiat, sans tentative de
  contournement, est la seule réponse honnête.

## 4. Qui fait évoluer cet outil, et comment

*(Confirmé explicitement le 2026-09-18 : évolution portée par l'agent qui travaille sur le projet
au fil des sessions, JAMAIS un mécanisme où le script réécrirait son propre fichier source à
l'exécution — cette dernière option resterait un chantier de sécurité à part entière, avec des
garde-fous dédiés à concevoir avant toute implémentation, et n'a pas été retenue ici.)* Faire
évoluer l'outil signifie : ajouter un fournisseur au registre, affiner l'algorithme
d'ordonnancement, ajouter une couche de garde-fou — toujours par une intervention de travail
délibérée (humaine ou agent), jamais une auto-modification silencieuse en cours d'exécution. Toute
évolution structurelle se documente ici (ce fichier) en plus du code lui-même.

## 5. Checklist pour recréer cet outil dans un nouveau projet

1. Identifier le/les points d'appel réseau réels vers l'API tierce dans le code de production.
2. Écrire l'abstraction de fournisseur (§2.1) pour CHAQUE fournisseur qu'on veut pouvoir sonder —
   même un seul au départ, l'interface reste la même si on en ajoute un second plus tard.
3. Écrire la mémoire d'expérience locale (§2.2 + §2.3), fichier gitignored dès sa création.
4. Écrire l'historique curaté (§2.4), vide au départ — se remplit à la main au fil des vrais
   blocages diagnostiqués, jamais par anticipation d'un cas hypothétique.
5. Vérifier chaque garde-fou de la section 3 un par un avant de considérer l'outil utilisable.
6. Documenter dans le référentiel de travail du nouveau projet (l'équivalent de
   `docs/regles-de-travail.md`) la règle de compte-rendu des évolutions de l'outil avec un gain
   d'efficacité estimé, si cette pratique est aussi souhaitée dans ce nouveau projet.
