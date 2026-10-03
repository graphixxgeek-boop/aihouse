// ICEBERG: membre
// Registre des fournisseurs d'API sondables par l'outil de diagnostic (2026-09-18, demande
// explicite de l'utilisateur : « fais en sorte que cet outil puisse s'adapter à une autre clef
// API, identique ou totalement différente, c'est à dire fournie par un fournisseur différent,
// payante, etc »).
//
// Portée strictement diagnostic (check-gemini-quota.mjs), jamais la production : ajouter un
// fournisseur ici ne branche RIEN dans le jeu réel. `lib/lia.ts` et `route.ts` continuent
// d'appeler exclusivement l'API Gemini, avec un prompt et un schéma JSON de sortie qui lui sont
// propres — un vrai fournisseur alternatif en production (réponses différentes, pas de garantie
// de respecter l'esprit des personnages, Article 0) resterait un chantier à part entière, soumis
// à la même validation qualité intégrale que tout changement de modèle, jamais une conséquence
// automatique du fait d'avoir appris à sonder ce fournisseur ici. Rassurant à vérifier : une clé
// d'un fournisseur non-Gemini glissée par erreur dans `GEMINI_API_KEY_FALLBACKS` ne casse rien en
// production — l'app l'essaie contre l'endpoint Gemini, obtient un 400/401/403, et passe à la clé
// suivante (règle déjà en place, cf. CLAUDE.md Article 18 "Repli de clé").
//
// Chaque fournisseur expose : `probe(key, model)` → { status, ms, detail? } dans le MÊME format
// que le reste de l'outil ("OK" / "QUOTA_ÉPUISÉ" / "HTTP xxx" / "ERREUR_RÉSEAU"), et
// `defaultCandidates` (modèles à sonder par défaut pour ce fournisseur, du moins cher au plus
// cher — Article 8, même si ce fournisseur n'est pas la production actuelle).

// Corps "léger" (défaut) : un ping minimal, quelques tokens, coût négligeable même répété sur
// tous les modèles candidats (Article 8). Corps "lourd" (heavy:true, cf. plus bas) : reproduit la
// TAILLE approximative d'un vrai tour de jeu (systemInstruction conséquente + sortie JSON
// structurée), jamais le prompt réel — juste un ordre de grandeur comparable. Raison documentée
// (CLAUDE.md, blocage du 2026-09-18) : Google peut répondre différemment (429 vs 503, ou même OK
// vs épuisé) selon le POIDS de la requête pour la MÊME clé/modèle au même instant — une sonde
// uniquement légère peut donc donner un faux "OK" qui ne se vérifie pas avec la vraie charge de
// l'application. Ne sonder ainsi que le modèle principal, jamais toute la liste de candidats :
// plus coûteux qu'un ping, à ne pas multiplier sans raison (Article 8).
const heavyFiller = "Contexte de scène fictif, uniquement pour approcher la taille réelle d'une requête de production sans en reproduire le contenu propriétaire. ".repeat(24);
function requestBody(model, heavy) {
  if (!heavy) return { contents: [{ role: "user", parts: [{ text: "ok" }] }], generationConfig: { maxOutputTokens: 5 } };
  return {
    systemInstruction: { parts: [{ text: heavyFiller }] },
    contents: [{ role: "user", parts: [{ text: JSON.stringify({ probe: true, note: "sonde de diagnostic, taille comparable à un vrai tour" }) }] }],
    generationConfig: { maxOutputTokens: 200, responseMimeType: "application/json", responseJsonSchema: { type: "object", additionalProperties: false, properties: { ok: { type: "boolean" } }, required: ["ok"] } },
  };
}
// Une réponse HTTP 200 ne garantit pas un contenu exploitable : un filtre de sécurité ou une
// coupure prématurée peut renvoyer 200 sans le moindre texte utilisable (candidates vide, ou
// content.parts absent) — l'application plante alors au moment de lire cette réponse malgré le
// statut 200. Distinguer ce cas ("OK_VIDE") d'un vrai succès évite de rapporter un faux positif.
function inspectBody(body) {
  const candidate = body?.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;
  if (typeof text === "string" && text.length > 0) return { status: "OK" };
  return { status: "OK_VIDE", detail: candidate?.finishReason ? `finishReason=${candidate.finishReason}` : "réponse 200 sans contenu exploitable" };
}
async function probeGemini(key, model, { heavy = false } = {}) {
  const started = Date.now();
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify(requestBody(model, heavy)),
    });
    const ms = Date.now() - started;
    const body = await r.json().catch(() => ({}));
    if (r.status === 200) { const inspected = inspectBody(body); return { ...inspected, ms }; }
    const message = body?.error?.message ?? "";
    if (r.status === 429) {
      const quotaId = body?.error?.details?.find(d => d.violations)?.violations?.[0]?.quotaId;
      // retryDelay est trompeur pour un épuisement de quota JOURNALIER (leçon du 2026-09-18,
      // CLAUDE.md) : affiché tel quel, mais jamais interprété comme "redevient disponible après
      // ce délai" par l'outil lui-même.
      const retryDelay = body?.error?.details?.find(d => d.retryDelay)?.retryDelay;
      return { status: "QUOTA_ÉPUISÉ", ms, detail: (quotaId ?? message.slice(0, 80)) + (retryDelay ? ` (retryDelay Google: ${retryDelay}, souvent trompeur pour un quota journalier)` : "") };
    }
    return statutHttpInattendu(r.status, ms, message);
  } catch (e) {
    return statutErreurReseau(e, started);
  }
}

// POURQUOI LA QUEUE DE SONDE RESTE RECOPIÉE CHEZ CHAQUE FOURNISSEUR (2026-09-29, tâche #1207).
// CLONE-HUNTER signale les quatre dernières lignes de `probeGemini` et `probeOpenAI` comme un
// doublon. Elles le sont, et elles le restent : chaque fournisseur garde sa propre queue parce que
// tout ce qui la précède lui est propre — son adresse, ses en-têtes, son corps de requête, sa façon
// d'annoncer un quota épuisé. Ce qui MÉRITAIT d'être partagé l'a déjà été le 2026-09-28 (#997) :
// les deux SORTIES d'échec, juste en dessous. Les envelopper d'un cran de plus obligerait chaque
// fournisseur à passer par une forme commune que le prochain, différent par nature, ne respecterait
// pas — et c'est exactement pour permettre un fournisseur totalement différent que ce registre
// existe. Verdict écrit ici plutôt qu'ailleurs : c'est ici qu'on le cherchera (Article 27).
//
// LES DEUX SORTIES D'ÉCHEC SONT LES MÊMES POUR TOUS LES FOURNISSEURS, et elles étaient recopiées dans
// chacun (2026-09-28, tâche #997, signalé par CLONE-HUNTER). Le risque n'est pas la place prise :
// c'est qu'un fournisseur ajouté demain recopie la forme de travers — un champ oublié, un libellé
// différent — et que Smart Breaker lise alors un état qu'il ne connaît pas. Nommées une fois, elles
// deviennent le contrat que tout nouveau fournisseur hérite sans y penser (Article 24).
export function statutHttpInattendu(status, ms, message = "") {
  return { status: `HTTP ${status}`, ms, detail: String(message).slice(0, 100) };
}

export function statutErreurReseau(e, depuis) {
  return { status: "ERREUR_RÉSEAU", ms: Date.now() - depuis, detail: e?.message ?? String(e) };
}

// Fournisseur payant/différent fourni en exemple concret (OpenAI) : appel minimal (1 token en
// sortie), coût négligeable même sondé souvent. Sert d'illustration que le format de clé,
// d'endpoint et de réponse peuvent être totalement différents de Gemini sans que l'outil ait
// besoin d'être réécrit — juste un nouveau fournisseur ajouté à ce registre.
async function probeOpenAI(key, model) {
  const started = Date.now();
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "user", content: "ok" }], max_tokens: 1 }),
    });
    const ms = Date.now() - started;
    if (r.status === 200) return { status: "OK", ms };
    const body = await r.json().catch(() => ({}));
    const message = body?.error?.message ?? "";
    if (r.status === 429) return { status: "QUOTA_ÉPUISÉ", ms, detail: message.slice(0, 80) };
    return statutHttpInattendu(r.status, ms, message);
  } catch (e) {
    return statutErreurReseau(e, started);
  }
}

export const PROVIDERS = {
  gemini: {
    probe: probeGemini,
    defaultCandidates: ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3-flash-preview", "gemini-pro-latest"],
  },
  openai: {
    probe: probeOpenAI,
    defaultCandidates: ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4o"],
  },
};

// Une entrée `.dev.vars` sans préfixe reste une clé Gemini (comportement historique inchangé,
// zéro migration à faire sur les clés déjà configurées). Un préfixe `fournisseur:` explicite
// bascule sur un autre fournisseur du registre ci-dessus ; un préfixe inconnu est traité comme
// faisant partie de la clé elle-même plutôt que de planter (une clé peut légitimement contenir
// des deux-points selon le fournisseur).
export function parseKeyEntry(raw) {
  const m = /^([a-z0-9_-]+):(.+)$/i.exec(raw);
  if (m && PROVIDERS[m[1].toLowerCase()]) return { provider: m[1].toLowerCase(), key: m[2] };
  return { provider: "gemini", key: raw };
}

// ============================================================================
// LE DIAGNOSTIC DES CLÉS QUI NE COÛTE RIEN (2026-10-03, tâche #1552bis → #1549)
// ============================================================================
// SES MOTS, ET ILS DISENT POURQUOI CETTE COUCHE MANQUAIT : « AS-TU LA POSSIBILITÉ DE TESTER CES
// CLÉS ? elles commencent à me hanter » (point P68 du 2026-10-03).
//
// LA RÉPONSE COURTE EST OUI, ET L'OUTIL EXISTAIT DÉJÀ : `node scripts/check-gemini-quota.mjs`
// sonde chaque clé pour de vrai. Mais le sonder est un APPEL RÉEL — donc soumis à l'Article 22,
// donc pas quelque chose qu'on lance parce qu'une inquiétude revient. Et une inquiétude qui ne
// peut être levée qu'au prix d'un appel finit par ne jamais être levée.
//
// CE QUI MANQUAIT EST DONC LA COUCHE À COÛT ZÉRO : tout ce qu'on peut savoir d'une clé SANS
// l'utiliser — combien il y en a, si elles sont vraiment DISTINCTES, si leur forme est celle
// qu'attend le fournisseur, et depuis quand elles n'ont pas bougé.
//
// LA DISTINCTION EST LA PLUS UTILE DES QUATRE, et la charte la réclamait déjà sans que rien ne la
// vérifie : « si un second projet Google existe, vérifier D'ABORD qu'il est bien distinct — pas
// une seconde clé du même projet ». Deux clés identiques déguisées en repli donnent l'illusion
// d'une redondance qui n'existe pas : le jour du quota, les deux tombent ensemble.
//
// ⚠️ AUCUNE VALEUR DE CLÉ N'EST JAMAIS IMPRIMÉE NI RENDUE. La comparaison se fait sur une
// EMPREINTE tronquée ; le rapport peut donc être livré, collé, archivé sans rien exposer. Un
// diagnostic de secret qui imprime le secret est pire que pas de diagnostic du tout.
export const FORMES_DE_CLE = [
  { fournisseur: "gemini", motif: /^AQ\.[A-Za-z0-9_-]{20,}$/, quoi: "clé Gemini au format actuel (AQ.…)" },
  { fournisseur: "gemini", motif: /^AIza[A-Za-z0-9_-]{30,}$/, quoi: "clé Google au format historique (AIza…)" },
];

export function empreinteDeCle(cle, { longueur = 10 } = {}) {
  // Une empreinte stable et non réversible, calculée sans dépendance : la somme de contrôle d'un
  // secret ne doit jamais pouvoir être retournée en secret.
  let h1 = 0x811c9dc5; let h2 = 0x01000193;
  const s = String(cle ?? "");
  for (let i = 0; i < s.length; i += 1) {
    h1 = Math.imul(h1 ^ s.charCodeAt(i), 0x01000193) >>> 0;
    h2 = Math.imul(h2 + s.charCodeAt(i) + i, 0x85ebca6b) >>> 0;
  }
  return (h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0")).slice(0, longueur);
}

export function diagnostiquerLesClesSansAppel(cles, { formes = FORMES_DE_CLE, ageJours = null } = {}) {
  const liste = (cles ?? []).filter((c) => c?.key);
  if (!liste.length) {
    return { mesurable: false, pourquoi: "aucune clé lue : ce zéro dit qu'on n'a trouvé aucune configuration, jamais qu'aucune clé n'existe — et les deux appellent des gestes opposés (leçons L5/L11)" };
  }
  const vues = new Map();
  const entrees = liste.map((c, i) => {
    const emp = empreinteDeCle(c.key);
    const forme = formes.find((f) => f.motif.test(String(c.key)));
    const rang = (vues.get(emp) ?? 0) + 1;
    vues.set(emp, rang);
    return {
      rang: i + 1,
      fournisseur: c.provider ?? "gemini",
      empreinte: emp,
      longueur: String(c.key).length,
      forme: forme?.quoi ?? null,
      formeConnue: Boolean(forme),
      // Un doublon est signalé sur la SECONDE occurrence : la première est la vraie clé.
      doublon: rang > 1,
    };
  });
  return {
    mesurable: true,
    total: entrees.length,
    distinctes: vues.size,
    doublons: entrees.filter((e) => e.doublon),
    formesInconnues: entrees.filter((e) => !e.formeConnue),
    ageJours,
    entrees,
    // CE QUI RESTE STRICTEMENT HORS DE PORTÉE, déclaré plutôt que tu (Article 27).
    horsPortee: "une clé bien formée et unique peut être RÉVOQUÉE, ÉPUISÉE ou rattachée à un projet sans facturation : rien de tout cela ne se voit sans un appel réel. ET SURTOUT — c'est la limite la plus traître — DEUX CLÉS DISTINCTES DU MÊME PROJET GOOGLE PARTAGENT LE MÊME PANIER DE QUOTA (constaté empiriquement, cf. l'historique de Smart Breaker). Cette couche prouve que les clés sont différentes ; elle ne prouve PAS que les quotas le sont. Elle dit ce qui est faux à coup sûr, jamais que tout va bien.",
  };
}

export function formatDiagnosticDesClesLines(r) {
  if (!r?.mesurable) return [`❓ PAS MESURÉ — ${r?.pourquoi}`];
  const out = [`CLÉS — ${r.total} configurée(s), ${r.distinctes} réellement distincte(s).`];
  for (const e of r.entrees) {
    const marque = e.doublon ? "🚨" : e.formeConnue ? "·" : "⚠️";
    out.push(`   ${marque} #${e.rang} ${e.fournisseur} · empreinte ${e.empreinte} · ${e.longueur} caractères · ${e.forme ?? "FORME INCONNUE DU FOURNISSEUR"}${e.doublon ? " · DOUBLON d'une clé déjà listée" : ""}`);
  }
  if (r.doublons.length) {
    out.push(`   🚨 ${r.doublons.length} clé(s) en double : une redondance qui n'en est pas. Le jour du quota, deux clés identiques tombent ensemble — et le repli donnera l'illusion d'avoir essayé autre chose.`);
  }
  if (r.formesInconnues.length) {
    out.push(`   ⚠️ ${r.formesInconnues.length} clé(s) d'une forme que le fournisseur n'utilise pas : ce n'est pas une preuve d'invalidité, mais c'est la seule erreur qui se voie sans dépenser un appel.`);
  }
  if (r.ageJours != null) out.push(`   · dernière modification du fichier de clés : il y a ${r.ageJours} jour(s).`);
  if (!r.doublons.length && !r.formesInconnues.length) out.push("   ✅ Toutes distinctes, toutes au format attendu — ce qui n'est PAS la même chose que « toutes valides », ni que « autant de quotas indépendants ».");
  out.push(`   HORS PORTÉE : ${r.horsPortee}`);
  out.push("   AUCUNE VALEUR DE CLÉ N'EST IMPRIMÉE : la comparaison passe par une empreinte tronquée et non réversible, donc ce rapport se livre et s'archive sans rien exposer.");
  return out;
}
