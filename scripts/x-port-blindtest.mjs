// X-Port BLINDTEST — le test à l'aveugle de la QUALITÉ d'un kit d'export
// =======================================================================
// NOMMÉ PAR L'UTILISATEUR le 2026-09-26, en fenêtre dédiée, parmi quatre propositions.
//
// SA DEMANDE, dans ses mots : « un script qui a pour fonction de choisir un membre de l'agence
// (choix mi-ciblé mi-aléatoire) et de vérifier la qualité de son kit d'export : il doit reconstituer
// le code à partir du kit, sans connaître le vrai code […] et on compare avec le vrai code pour voir
// si le kit est valable, avec un résultat externalisé ».
//
// LE TROU QU'IL FERME, ET C'EST SAFE-EXPORT QUI LE DÉCLARE LUI-MÊME : « un kit COMPLET n'est pas un
// kit SUFFISANT : cette mesure compte des pièces présentes, elle ne lit jamais leur contenu ». Le
// 2026-09-26 le parc est passé à 82/82 kits complets — et absolument rien, dans tout ce dépôt, ne
// pouvait dire si UN SEUL de ces 82 kits décrit fidèlement le code qu'il accompagne.
//
// LE DÉPLACEMENT QU'IL A FALLU FAIRE SUR SON IDÉE, et il la rend meilleure. « Reconstituer le code à
// partir du kit » est impossible au sens strict : LE CODE EST UNE DES CINQ PIÈCES DU KIT. Celui qui
// reçoit le kit a déjà le code. Ce qui peut vraiment se mesurer, et qui est exactement le trou visé :
// **la documentation dit-elle la vérité sur le code ?** On donne les DOCUMENTS seuls, l'agent annonce
// ce que l'outil devrait contenir, et on compare au vrai code. Un kit dont la documentation décrit
// autre chose que ce que fait le code est pire qu'un kit vide : il TROMPE son lecteur, et un lecteur
// trompé ne vérifie pas.
//
// POURQUOI UNE VRAIE LIGNE DE COMMANDE EN TROIS TEMPS, CONTRAIREMENT À THE-FINAL-JUDGE. Celui-ci n'a
// aucun point d'entrée : son rapport est de la prose, réconciliée à la main par l'agent
// orchestrateur. Le copier ici perdrait tout : la valeur de ce test est une comparaison MÉCANIQUE,
// reproductible, que personne ne peut arranger en la racontant (Article 31, failles 3 et 8). D'où :
//
//   1. `sujet`  — le script tire le membre, assemble le dossier aveugle, écrit la consigne.  (gratuit)
//   2.            l'agent séparé répond SANS avoir vu le code, et dépose son pronostic.      (coûteux)
//   3. `juger`  — le script compare au vrai code et rend deux chiffres + un plan d'action.   (gratuit)
//
// Le raisonnement appartient à l'agent ; la MESURE appartient au script. Un verdict qu'on ne pourrait
// pas rejouer ne vaudrait rien sur un sujet pareil.
//
// CE QUE SON VERDICT NE TOUCHE JAMAIS (sa décision du même jour) : le badge d'export du fichier.
// Le badge dit « les pièces sont là » ; ce test dit « voilà ce qu'elles valent ». Deux questions,
// deux mesures. Les lier rendrait le badge dépendant d'un jugement coûteux et ÉCHANTILLONNÉ — un
// fichier jamais tiré au sort garderait son ✅ par chance, et deux fichiers identiques porteraient
// des badges différents selon qu'ils sont passés ou non.
//
// LA MISE À JOUR EST LA FIN DU TRAVAIL, PAS LE RAPPORT (ajout de l'utilisateur en cours de
// construction : « l'idée est de mettre l'outil à jour à la suite du diagnostic de l'aveugle, et de
// mettre à jour tous les kits si besoin, si faille critique découverte »). D'où `porteeDuDefaut()` :
// un manque est LOCAL (ce kit-là est mal écrit) ou SYSTÉMIQUE (le gabarit ne demande la rubrique à
// PERSONNE, donc les 82 kits ont le même trou). La distinction n'est pas cosmétique : le premier
// coûte une correction, le second en coûte quatre-vingt-deux, et les traiter pareil garantit de
// refaire le même diagnostic quatre-vingt-une fois de plus.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { dependancesInternes, aliasDocumentaires, tientUneMemoire, exemptionDuKit } from "./safe-export.mjs";
import { buildPlanDaction, ETATS_CONSTAT } from "./report-template.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
export const OUTIL = "x-port-blindtest";
export const DOSSIER = "docs/x-port-blindtest";
export const FICHIER_PASSAGES = `${DOSSIER}/passages.json`;

// ══════════════════════════════════════════════════════════════════════════
// CE QUE L'AVEUGLE VOIT, ET CE QU'ON LUI CACHE
// ══════════════════════════════════════════════════════════════════════════
//
// Sa décision, en fenêtre dédiée : les TROIS DOCUMENTS ÉCRITS. C'est exactement ce qu'un nouveau
// lecteur a sous les yeux avant d'ouvrir le fichier — donc exactement ce dont on veut savoir s'il
// suffit.
export const PIECES_MONTREES = [
  { cle: "blueprint", quoi: "le blueprint (plan générique réutilisable)", chemin: (b) => `docs/${b}-blueprint.md` },
  { cle: "fiche", quoi: "la fiche d'instanciation", chemin: (b) => `docs/referentiel/${b}.md` },
  { cle: "registre", quoi: "le registre de l'outil", chemin: (b) => `docs/${b}/index.md` },
];

// LES DEUX PIÈCES CACHÉES, avec la raison — sans quoi la prochaine relecture les rajouterait « pour
// être complet », et le test cesserait d'être aveugle sans que rien ne le signale.
export const PIECES_CACHEES = {
  source: "c'est la réponse : le test consiste précisément à voir si les documents suffisent à la décrire",
  dependances: "cette liste est EXTRAITE du code par un motif d'import — la donner reviendrait à souffler une partie de la structure qu'on demande de deviner",
};

export function basePourDocs(chemin) {
  const nom = String(chemin).split("/").pop().replace(/\.(mjs|sh|ts)$/, "");
  return nom;
}

// dossierAveugle() — assemble ce que l'agent verra, et RIEN d'autre. Le chemin déclaré (inventaire
// de CLAUDE.md) prime sur le chemin dérivé du nom de fichier, exactement comme dans la mesure des
// kits : trois outils portent un nom d'usage différent de leur nom de fichier, et les manquer ici
// donnerait un dossier vide sur un kit parfaitement documenté — le pire faux négatif possible.
export function dossierAveugle(chemin, { root = ROOT, exists = existsSync, readFileImpl = readFileSync, alias = undefined, pieces = PIECES_MONTREES } = {}) {
  const carte = alias === undefined ? aliasDocumentaires({ root, readFileImpl }) : alias;
  const declare = carte?.get(chemin) ?? null;
  const base = basePourDocs(chemin);
  const vues = [];
  const absentes = [];
  for (const p of pieces) {
    const cible = declare?.[p.cle] ?? p.chemin(base);
    if (!exists(join(root, cible))) { absentes.push({ ...p, chemin: cible }); continue; }
    let texte = "";
    try { texte = readFileImpl(join(root, cible), "utf8"); } catch { absentes.push({ ...p, chemin: cible, illisible: true }); continue; }
    vues.push({ cle: p.cle, quoi: p.quoi, chemin: cible, texte });
  }
  return { chemin, vues, absentes, suffisant: vues.length > 0 };
}

// ══════════════════════════════════════════════════════════════════════════
// LE TIRAGE — « mi-ciblé, mi-aléatoire » (sa formulation)
// ══════════════════════════════════════════════════════════════════════════
//
// Sa décision : jamais testé d'abord, en favorisant les vitaux ; une fois tout le monde passé au
// moins une fois, le plus ancien. La couverture PROGRESSE au lieu de tourner en rond, et personne
// n'est oublié indéfiniment — le défaut exact d'un tirage purement aléatoire, où le même fichier
// peut sortir trois fois pendant que dix autres n'ont jamais été vus.
export const POIDS_PAR_VITALITE = { vital: 8, essentiel: 6, utile: 3, optionnel: 1 };

export function choisirLeMembre({ lignes = [], passages = [], hasard = Math.random, poids = POIDS_PAR_VITALITE } = {}) {
  if (!lignes.length) return { mesurable: false, pourquoi: "aucun membre à tirer : le parc n'a pas été fourni, et tirer dans le vide rendrait un sujet inventé" };
  const vus = new Map(passages.map((p) => [p.chemin, p.date]));
  const jamais = lignes.filter((l) => !vus.has(l.chemin));
  const bassin = jamais.length ? jamais : [...lignes].sort((a, b) => String(vus.get(a.chemin) ?? "").localeCompare(String(vus.get(b.chemin) ?? "")));
  // PHASE 1 — il reste des jamais testés : tirage pondéré par la vitalité, donc mi-ciblé mi-aléatoire.
  if (jamais.length) {
    const total = bassin.reduce((a, l) => a + (poids[l.vitalite] ?? 1), 0);
    let tir = hasard() * total;
    for (const l of bassin) {
      tir -= poids[l.vitalite] ?? 1;
      if (tir <= 0) return { mesurable: true, ...l, motif: `jamais testé — tirage pondéré par la vitalité (${l.vitalite})`, phase: "couverture", restants: jamais.length };
    }
    const dernier = bassin[bassin.length - 1];
    return { mesurable: true, ...dernier, motif: `jamais testé — tirage pondéré par la vitalité (${dernier.vitalite})`, phase: "couverture", restants: jamais.length };
  }
  // PHASE 2 — tout le monde est passé : on reprend le plus ancien, sans hasard. Le hasard ici ne
  // servirait qu'à repousser indéfiniment le plus négligé, c'est-à-dire le seul qui mérite le tour.
  const plusAncien = bassin[0];
  return { mesurable: true, ...plusAncien, motif: `tout le parc est passé au moins une fois — au plus ancien (${vus.get(plusAncien.chemin) ?? "date inconnue"})`, phase: "rotation", restants: 0 };
}

export function chargerPassages({ root = ROOT, readFileImpl = readFileSync, fichier = FICHIER_PASSAGES } = {}) {
  try { const brut = JSON.parse(readFileImpl(join(root, fichier), "utf8")); return Array.isArray(brut) ? brut : []; }
  catch { return []; }
}

// ══════════════════════════════════════════════════════════════════════════
// LA STRUCTURE RÉELLE — ce à quoi on compare
// ══════════════════════════════════════════════════════════════════════════
export const MOTIF_EXPORT = /^export\s+(?:async\s+)?(?:function|const|class)\s+([A-Za-z_$][\w$]*)/gm;

export function structureReelle(source = "", { chemin = "" } = {}) {
  const exports = [...new Set([...String(source).matchAll(MOTIF_EXPORT)].map((m) => m[1]))].sort();
  return {
    exports,
    ecritUneMemoire: tientUneMemoire(source),
    dependances: dependancesInternes(source),
    chemin,
  };
}

// ══════════════════════════════════════════════════════════════════════════
// LA COMPARAISON — deux chiffres, JAMAIS additionnés (sa décision)
// ══════════════════════════════════════════════════════════════════════════
//
// RATÉ    : le code l'exporte, la documentation n'en parle pas   → la doc est INCOMPLÈTE.
// INVENTÉ : la documentation le laisse croire, le code ne l'a pas → la doc MENT.
//
// Les deux sont de vrais défauts et ils se réparent à l'opposé : l'un en complétant, l'autre en
// corrigeant une affirmation fausse. Les fondre en une note perdrait exactement ce qui décide de
// l'action — et une note unique est toujours ce qu'on demande en premier.
export function normaliserNom(n) { return String(n).toLowerCase().replace(/[^a-z0-9]/g, ""); }

// Deux noms se correspondent aussi par leurs MOTS quand l'orthographe diffère : une documentation
// honnête peut dire « la fonction qui charge les passages » là où le code écrit `chargerPassages`.
// Punir cet écart reprocherait à la doc d'être écrite en français.
export function motsDuNom(n) {
  return String(n).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase()
    .split(/\s+/).filter((m) => m.length > 3);
}

export function memeChose(a, b) {
  if (normaliserNom(a) === normaliserNom(b)) return true;
  const ma = new Set(motsDuNom(a));
  const mb = motsDuNom(b);
  const communs = mb.filter((m) => ma.has(m));
  return communs.length >= 2;
}

export function comparerStructures(pronostic = {}, reelle = {}) {
  const attendus = Array.isArray(pronostic.exports) ? pronostic.exports : null;
  if (!attendus) {
    return { mesurable: false, pourquoi: "le pronostic ne porte aucune liste `exports` : sans elle il n'y a rien à comparer, et rendre 0 % reviendrait à noter une copie blanche comme une copie fausse" };
  }
  const vrais = reelle.exports ?? [];
  const trouves = vrais.filter((v) => attendus.some((a) => memeChose(a, v)));
  const rates = vrais.filter((v) => !attendus.some((a) => memeChose(a, v)));
  const inventes = attendus.filter((a) => !vrais.some((v) => memeChose(a, v)));
  return {
    mesurable: true,
    trouves, rates, inventes,
    rappel: vrais.length ? Math.round((trouves.length / vrais.length) * 100) : null,
    bruit: attendus.length ? Math.round((inventes.length / attendus.length) * 100) : null,
    combienDeVrais: vrais.length, combienAnnonces: attendus.length,
    memoireAnnoncee: pronostic.ecritUneMemoire ?? null,
    memoireReelle: reelle.ecritUneMemoire ?? null,
    horsPortee: "la correspondance se fait sur les NOMS (orthographe exacte, ou deux mots significatifs partagés). Une documentation qui décrit parfaitement une fonction sans jamais la nommer sera comptée comme un manque — c'est une sévérité assumée, pas une mesure de la clarté du texte.",
  };
}

// ══════════════════════════════════════════════════════════════════════════
// LOCAL OU SYSTÉMIQUE — « mettre à jour tous les kits si besoin » (son ajout)
// ══════════════════════════════════════════════════════════════════════════
//
// Un manque n'appelle pas le même travail selon son origine, et c'est la seule chose qui empêche de
// refaire quatre-vingt-une fois le même diagnostic :
//   · LOCAL      — ce kit-là est mal écrit. Une correction, sur un fichier.
//   · SYSTÉMIQUE — le GABARIT ne demande la rubrique à personne. Les 82 kits ont le même trou.
//
// La détection lit le gabarit réel plutôt qu'une liste de rubriques recopiée (Article 24) : une
// rubrique ajoutée au gabarit demain est prise en compte sans toucher à ce fichier.
export const GABARIT_BLUEPRINT = "docs/templates/blueprint.md";
export const GABARIT_FICHE = "docs/templates/fiche-instanciation.md";

// LA PREMIÈRE VERSION DE CETTE DÉTECTION ÉTAIT UNE MACHINE À FAUX POSITIFS, et le premier vrai
// passage l'a montrée en cinq secondes : elle comparait des NOMS DE FONCTIONS aux TITRES DE SECTIONS
// du gabarit. Les deux n'ont aucun vocabulaire commun par construction, donc elle aurait crié
// « systémique » sur à peu près tout, tout le temps — exactement la leçon L4 (un garde-fou qui
// accuse à tort cesse d'être lu). Écrite le matin, réfutée l'après-midi par son propre passage.
//
// LA BONNE QUESTION N'EST PAS PAR NOM, ELLE EST UNIQUE ET PORTE SUR LE GABARIT :
// **le gabarit demande-t-il, à qui que ce soit, de lister ce que l'outil EXPOSE ?**
//   · NON  → aucun kit ne le fera jamais. Le manque est SYSTÉMIQUE, les 82 kits l'ont, et corriger
//            celui-ci seul laisserait le défaut partout ailleurs.
//   · OUI  → le gabarit le demande et ce kit-là n'a pas répondu. Le manque est LOCAL.
// Un binaire sur le gabarit, pas une comparaison mot à mot : c'est la seule forme qui distingue
// vraiment « personne ne le fait » de « celui-là ne l'a pas fait ».
export const MOTS_DINVENTAIRE = ["fonction", "fonctions", "export", "exports", "exporte", "interface", "capacite", "capacites", "commande", "commandes", "signature", "signatures"];

export function gabaritDemandeLInventaire({ root = ROOT, readFileImpl = readFileSync, fichiers = [GABARIT_BLUEPRINT, GABARIT_FICHE], mots = MOTS_DINVENTAIRE } = {}) {
  const titres = [];
  let lus = 0;
  for (const f of fichiers) {
    let texte = "";
    try { texte = readFileImpl(join(root, f), "utf8"); lus += 1; } catch { continue; }
    for (const m of String(texte).matchAll(/^#{2,3}\s+(.+)$/gm)) titres.push({ fichier: f, titre: m[1].trim() });
  }
  // AUCUN GABARIT LU N'EST JAMAIS « LE GABARIT NE LE DEMANDE PAS » : sans lecture on ne peut pas
  // trancher, et trancher quand même classerait tout en systémique — donc crierait au plus cher.
  if (!lus) return { mesurable: false, pourquoi: "aucun gabarit n'a pu être lu : impossible de dire si un manque est propre à ce kit ou commun à tous, et le supposer dans un sens ou dans l'autre serait une invention" };
  const demandeurs = titres.filter((t) => motsDuNom(t.titre).some((w) => mots.includes(w)));
  return { mesurable: true, demande: demandeurs.length > 0, ou: demandeurs, titresLus: titres.length, gabaritsLus: lus };
}

export function porteeDuDefaut(rates = [], gabarit = null) {
  if (!gabarit?.mesurable) return { mesurable: false, pourquoi: gabarit?.pourquoi ?? "gabarit non fourni" };
  if (!rates.length) return { mesurable: true, local: [], systemique: [], consequence: "aucun manque à situer.", horsPortee: "" };
  const systemique = gabarit.demande ? [] : [...rates];
  const local = gabarit.demande ? [...rates] : [];
  return {
    mesurable: true, local, systemique, gabaritDemande: gabarit.demande,
    consequence: gabarit.demande
      ? `le gabarit demande bien de lister ce que l'outil expose (${gabarit.ou.map((o) => `« ${o.titre} »`).join(", ")}) : ce kit-là n'a pas répondu. ${local.length} manque(s), correction LOCALE.`
      : `AUCUNE des ${gabarit.titresLus} rubriques du gabarit ne demande de lister ce que l'outil expose. Aucun kit ne le fera jamais : les ${rates.length} manque(s) sont SYSTÉMIQUES, les autres kits portent le même trou, et corriger celui-ci seul le laisserait partout ailleurs.`,
    horsPortee: "la question posée au gabarit est binaire et porte sur le vocabulaire de ses TITRES. Un gabarit qui demanderait l'inventaire au milieu d'un paragraphe, sans titre, serait compté comme ne le demandant pas.",
  };
}

// ══════════════════════════════════════════════════════════════════════════
// LE VERDICT — des paliers, jamais une note
// ══════════════════════════════════════════════════════════════════════════
export const PALIERS_BLINDTEST = [
  { cle: "trompeur", icone: "🔴", rang: 1, libelle: "KIT TROMPEUR", quand: "la documentation affirme des choses que le code ne fait pas — pire qu'un kit vide, parce qu'un lecteur trompé ne vérifie pas" },
  { cle: "insuffisant", icone: "🟠", rang: 2, libelle: "KIT INSUFFISANT", quand: "la documentation laisse de côté une part importante de ce que l'outil fait" },
  { cle: "perfectible", icone: "🟡", rang: 3, libelle: "KIT PERFECTIBLE", quand: "l'essentiel est là, des détails manquent" },
  { cle: "fidele", icone: "✅", rang: 4, libelle: "KIT FIDÈLE", quand: "la documentation seule suffit à annoncer ce que le code contient" },
];
export const SEUIL_RAPPEL_INSUFFISANT = 60;
export const SEUIL_RAPPEL_FIDELE = 85;
export const SEUIL_BRUIT_TROMPEUR = 25;

export function verdictBlindtest(comparaison, { paliers = PALIERS_BLINDTEST } = {}) {
  if (!comparaison?.mesurable) return { mesurable: false, pourquoi: comparaison?.pourquoi ?? "comparaison non fournie. Ce n'est PAS « kit fidèle »." };
  const p = (cle) => paliers.find((x) => x.cle === cle);
  const candidats = [];
  if ((comparaison.bruit ?? 0) >= SEUIL_BRUIT_TROMPEUR) candidats.push(p("trompeur"));
  if ((comparaison.rappel ?? 0) < SEUIL_RAPPEL_INSUFFISANT) candidats.push(p("insuffisant"));
  if ((comparaison.rappel ?? 0) < SEUIL_RAPPEL_FIDELE || (comparaison.inventes?.length ?? 0) > 0) candidats.push(p("perfectible"));
  const pire = candidats.sort((a, b) => a.rang - b.rang)[0] ?? p("fidele");
  return { mesurable: true, niveau: pire.cle, icone: pire.icone, rang: pire.rang, verdict: `${pire.icone} ${pire.libelle}`, pourquoi: pire.quand };
}

export function constatsBlindtest(sujet, comparaison, portee, verdict) {
  const constats = [];
  if (!comparaison?.mesurable) {
    constats.push({ constat: `Le pronostic sur ${sujet} n'était pas exploitable — ${comparaison?.pourquoi}`, etat: "a-trancher", pourquoi: "une copie blanche ne se note pas comme une copie fausse" });
    return constats;
  }
  if (comparaison.inventes.length) {
    constats.push({ constat: `La documentation de ${sujet} laisse croire à ${comparaison.inventes.length} chose(s) que le code ne fait pas : ${comparaison.inventes.join(", ")}`, etat: "retenu", pourquoi: "une documentation qui ment est pire qu'une documentation absente — corriger le texte, jamais le code" });
  }
  if (portee?.mesurable && portee.systemique.length) {
    constats.push({ constat: `${portee.systemique.length} manque(s) ne relèvent d'AUCUNE rubrique du gabarit (${portee.systemique.join(", ")}) — les autres kits portent probablement le même trou`, etat: "retenu", pourquoi: "corriger ce kit seul laisserait le défaut partout ailleurs : le gabarit se corrige d'abord, puis on rebalaie" });
  }
  if (portee?.mesurable && portee.local.length) {
    constats.push({ constat: `${portee.local.length} manque(s) propres à ce kit (${portee.local.join(", ")}) : le gabarit demande déjà la rubrique, elle n'a pas été remplie`, etat: "retenu", pourquoi: "correction locale, sur ce kit seul" });
  }
  if (!constats.length) constats.push({ constat: `${sujet} : ${verdict?.verdict ?? "kit fidèle"} — rien à reprendre`, etat: "ecarte", pourquoi: "un passage propre est une information pleine et entière : il dit que ce kit-là tient" });
  return constats;
}

export function formatBlindtestLines(sujet, comparaison, portee, verdict) {
  const l = [`=== X-Port BLINDTEST — ${sujet} — ${verdict?.verdict ?? "PAS MESURÉ"} ===`, ""];
  if (!comparaison?.mesurable) { l.push(`  ⚠️  PAS MESURÉ — ${comparaison?.pourquoi}`, "", "  Ce n'est PAS « kit fidèle »."); return l; }
  l.push(`  RAPPEL  ${comparaison.rappel} %  — ${comparaison.trouves.length}/${comparaison.combienDeVrais} des fonctions réelles étaient annonçables depuis les documents seuls`);
  l.push(`  BRUIT   ${comparaison.bruit} %  — ${comparaison.inventes.length}/${comparaison.combienAnnonces} des annonces ne correspondent à rien dans le code`);
  l.push("  Les deux ne s'additionnent jamais : l'un se répare en complétant, l'autre en corrigeant une affirmation fausse.");
  l.push("");
  if (comparaison.rates.length) l.push(`  🟠 JAMAIS ANNONCÉ (${comparaison.rates.length}) : ${comparaison.rates.join(", ")}`);
  if (comparaison.inventes.length) l.push(`  🔴 ANNONCÉ À TORT (${comparaison.inventes.length}) : ${comparaison.inventes.join(", ")}`);
  l.push("");
  if (portee?.mesurable) { l.push(`  PORTÉE : ${portee.consequence}`); l.push(`  ⚠️  ${portee.horsPortee}`); }
  else l.push(`  PORTÉE : PAS MESURÉE — ${portee?.pourquoi}`);
  l.push("");
  l.push(`  HORS PORTÉE : ${comparaison.horsPortee}`);
  return l;
}

// ══════════════════════════════════════════════════════════════════════════
// LA CONSIGNE REMISE À L'AGENT AVEUGLE
// ══════════════════════════════════════════════════════════════════════════
export function promptAveugle(dossier) {
  const pieces = dossier.vues.map((v) => `───── ${v.quoi} (${v.chemin}) ─────\n${v.texte}`).join("\n\n");
  return [
    "Tu es l'évaluateur à l'aveugle d'un kit d'export. Tu ne verras PAS le code.",
    "",
    "Ce que tu reçois ci-dessous est la DOCUMENTATION complète d'un outil : son blueprint générique,",
    "sa fiche d'instanciation, et son registre. C'est exactement ce qu'aurait sous les yeux quelqu'un",
    "qui reçoit ce kit sans jamais avoir vu le projet.",
    "",
    "TA TÂCHE : annoncer ce que le fichier de code DOIT contenir, d'après ces documents seuls.",
    "",
    "Rends un JSON strict, et rien d'autre :",
    '{ "exports": ["nomDeFonction1", "nomDeFonction2", ...],',
    '  "ecritUneMemoire": true|false,',
    '  "capacites": ["une phrase par chose que l\'outil sait faire"],',
    '  "zonesDOmbre": ["ce que la documentation ne permet pas de deviner"] }',
    "",
    "RÈGLES :",
    "· `exports` : les noms de fonctions/constantes exportées que la documentation permet d'annoncer.",
    "  Si la doc nomme une fonction, reprends son nom exact. Si elle décrit une capacité sans la",
    "  nommer, propose le nom que tu jugerais naturel — la comparaison tolère l'écart d'orthographe.",
    "· N'invente RIEN pour faire nombre : une annonce fausse compte contre le kit, pas contre toi.",
    "· `zonesDOmbre` est la partie la plus utile du travail : c'est elle qui dira quoi réécrire.",
    "",
    "═══════════ LA DOCUMENTATION ═══════════",
    "",
    pieces,
  ].join("\n");
}

// ══════════════════════════════════════════════════════════════════════════
// LA VÉRIFICATION MÉCANIQUE DE CONFORMITÉ — gratuite, sur TOUS les kits
// ══════════════════════════════════════════════════════════════════════════
//
// SA DEMANDE : « CHECKER QUE TOUS LES KITS D'EXPORT ET LEUR CONTENU SONT BIEN EN CONFORMITÉ PARFAITE
// AVEC LE CODE, QUE TOUT EST EXACT, VÉRIFICATION AU CAS PAR CAS, SANS FAUTE, AIDE-TOI DE L'OUTIL OU
// ÉQUIPE L'OUTIL POUR QU'IL T'AIDE. »
//
// POURQUOI CETTE MOITIÉ-LÀ PEUT SE FAIRE SANS AGENT, ET SUR LES 83 D'UN COUP. Le test à l'aveugle
// mesure deux choses, et une seule exige un raisonnement :
//   · le RAPPEL — ce que le code fait et que la doc tait. Il faut quelqu'un qui LISE la doc et en
//     déduise ce qui manque : c'est un jugement, donc un agent, donc un échantillon.
//   · le BRUIT — ce que la doc AFFIRME et que le code ne fait pas. Celui-là est vérifiable
//     mécaniquement : un nom cité entre accents graves existe, ou n'existe pas.
//
// C'est donc la moitié « la doc ment-elle ? » qui devient gratuite et exhaustive — et c'est la plus
// grave des deux : une doc incomplète fait ouvrir le code, une doc fausse ne le fait pas ouvrir.
//
// LE FAUX POSITIF QU'IL FAUT ÉVITER, et il aurait été massif : une fiche cite légitimement des
// fonctions d'AUTRES outils (la fiche de SAFE-EXPORT cite `findRegistriesMissingFromCircle()`, qui
// vit dans circle-tasks). « Cité mais absent de CE fichier » aurait donc accusé chaque renvoi
// croisé — c'est-à-dire la bonne pratique du dépôt. On compare à l'index de TOUT le dépôt : un nom
// qui n'existe NULLE PART est un vrai mensonge ; un nom qui vit ailleurs est un renvoi.
export const MOTIF_NOM_CITE = /`([a-zA-Z_$][\w$]*)\(\)`/g;

export function nomsCites(texte = "") {
  return [...new Set([...String(texte).matchAll(MOTIF_NOM_CITE)].map((m) => m[1]))];
}

// indexDuDepot() — tous les symboles exportés du dépôt, lus une fois. Un index construit par fichier
// coûterait 83 relectures de tout scripts/ ; ici c'est une passe.
export function indexDuDepot({ root = ROOT, listDirImpl = null, readFileImpl = readFileSync, dossiers = ["scripts", "lib"] } = {}) {
  const readdir = listDirImpl ?? readdirSync;
  const noms = new Set();
  let fichiers = 0;
  for (const d of dossiers) {
    let liste = [];
    try { liste = readdir(join(root, d)); } catch { continue; }
    for (const f of liste) {
      if (!/\.(mjs|ts|js)$/.test(f)) continue;
      let texte = "";
      try { texte = readFileImpl(join(root, d, f), "utf8"); fichiers += 1; } catch { continue; }
      for (const m of texte.matchAll(/(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)) noms.add(m[1]);
      for (const m of texte.matchAll(/(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=/g)) noms.add(m[1]);
    }
  }
  // AUCUN FICHIER LU N'EST JAMAIS « AUCUN SYMBOLE » : un index vide ferait passer CHAQUE nom cité
  // pour un mensonge, soit le faux positif le plus spectaculaire possible (leçon L4).
  return fichiers ? { mesurable: true, noms, fichiers } : { mesurable: false, pourquoi: "aucun fichier de code n'a pu être lu : l'index est vide, et comparer à un index vide ferait passer chaque nom cité pour une invention" };
}


// TROIS ÉTATS POUR UN NOM ABSENT, JAMAIS DEUX — et les deux premiers vrais résultats de cette
// vérification sont ce qui a imposé le troisième. Sur 417 noms cités dans les 83 kits, elle en a
// trouvé 2 introuvables, et AUCUN des deux n'était un mensonge :
//   · `isDawn()` — le registre d'ALWAYS-NEW-CODE note que l'outil a trouvé son ABSENCE, par
//     contraste avec `isNight()` qui existe. Le document dit donc exactement la vérité.
//   · `maFonction()` — la fiche de MOÏSE écrit deux lignes plus bas que c'est un exemple de FORME,
//     et note qu'un AUTRE garde-fou s'était déjà fait avoir par ce même passage.
// Les compter comme des mensonges aurait donné un détecteur juste à 0 sur 2 dès son premier
// passage, c'est-à-dire un détecteur qu'on cesse de lire (leçon L4, la troisième fois ce jour-là).
//
// Ce qu'ils partagent : **la phrase qui porte le nom ne dit pas « ça existe »**. Elle dit son
// absence, ou elle le donne en exemple. On ne les cache pas pour autant — les cacher serait l'autre
// faute — ils descendent d'un cran, en « à instruire », et restent visibles.
export const MOTS_DE_NEGATION = ["pas de", "aucun", "aucune", "absence", "n'existe pas", "nexiste pas", "manque", "manquant", "jamais", "sans"];
export const MOTS_D_EXEMPLE = ["exemple", "exemples", "forme", "gabarit", "par exemple", "fictif", "fictive"];

// UN POINT SUIVI D'UNE LETTRE N'EST PAS UNE FIN DE PHRASE, et l'ignorer a produit le deuxième faux
// positif de la journée sur ce même détecteur : le découpage naïf coupait sur le point de
// « scripts/<nom>.mjs » et s'arrêtait AVANT les mots « ce sont des exemples de FORME » qui, deux
// mots plus loin, disaient exactement pourquoi ce nom n'a pas à exister. Une fin de phrase est un
// point suivi d'un blanc ou de la fin du texte — jamais un point d'extension de fichier.
export const MOTIF_FIN_DE_PHRASE = /\.(?=\s|$)/g;

export function phraseAutourDu(texte, nom) {
  const t = String(texte);
  const i = t.indexOf(`\`${nom}()\``);
  if (i < 0) return "";
  const bornes = [...t.matchAll(MOTIF_FIN_DE_PHRASE)].map((m) => m.index);
  const debut = bornes.filter((b) => b < i).pop();
  const fin = bornes.find((b) => b > i);
  return t.slice(debut === undefined ? 0 : debut + 1, fin === undefined ? Math.min(t.length, i + 400) : fin + 1);
}

export function natureDeLAbsence(phrase, { negations = MOTS_DE_NEGATION, exemples = MOTS_D_EXEMPLE } = {}) {
  const p = sansAccentsSimple(String(phrase).toLowerCase());
  // L'EXEMPLE SE TESTE AVANT LA NÉGATION, et l'ordre n'est pas arbitraire : une phrase qui déclare
  // « ce sont des exemples de forme, pas des chemins réels » contient les DEUX marqueurs. Tester la
  // négation d'abord rendait le bon verdict avec la MAUVAISE raison — un rapport juste sur le fond
  // et faux dans son explication, qui enverrait le prochain lecteur chercher au mauvais endroit.
  // « Ceci est un exemple » est une déclaration ; un « pas » qui traîne dans la phrase n'en est pas
  // une.
  if (exemples.some((m) => p.includes(m))) return { etat: "a-instruire", pourquoi: "la phrase donne ce nom comme un EXEMPLE DE FORME, jamais comme une fonction réelle" };
  if (negations.some((m) => p.includes(sansAccentsSimple(m)))) return { etat: "a-instruire", pourquoi: "la phrase qui porte ce nom décrit son ABSENCE — le document dit donc la vérité, pas un mensonge" };
  return { etat: "faux", pourquoi: "le document affirme l'existence de cette fonction, et elle n'existe nulle part dans le dépôt" };
}

function sansAccentsSimple(t) { return String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

export function verifierUnKit(chemin, { root = ROOT, exists = existsSync, readFileImpl = readFileSync, alias = undefined, index = null, exemptes = undefined } = {}) {
  if (!index?.mesurable) return { mesurable: false, chemin, pourquoi: index?.pourquoi ?? "index du dépôt non fourni" };
  // UN FICHIER DISPENSÉ DE KIT N'EST PAS UN FICHIER NON MESURABLE : les sept dispensés (crochets
  // git, installateur de l'environnement, lanceur du produit) n'ont AUCUN document par décision
  // écrite. Les compter comme « non mesurables » faisait lire le rapport comme s'il avait sept
  // trous, alors qu'il a sept décisions.
  const dispense = exemptionDuKit(chemin, exemptes === undefined ? {} : { exemptes });
  if (dispense) return { mesurable: true, chemin, dispense: true, conforme: true, combienCites: 0, fantomes: [], pourquoi: dispense.pourquoi, documents: [] };
  const dossier = dossierAveugle(chemin, { root, exists, readFileImpl, alias });
  if (!dossier.vues.length) return { mesurable: false, chemin, pourquoi: "aucun document lisible : rien à confronter au code, ce qui n'est jamais « conforme »" };
  const cites = [];
  for (const v of dossier.vues) for (const n of nomsCites(v.texte)) cites.push({ nom: n, ou: v.chemin, texte: v.texte });
  const absents = cites.filter((c) => !index.noms.has(c.nom));
  const juges = absents.map((c) => ({ nom: c.nom, ou: c.ou, ...natureDeLAbsence(phraseAutourDu(c.texte, c.nom)) }));
  const fantomes = juges.filter((j) => j.etat === "faux");
  return {
    mesurable: true, chemin, combienCites: cites.length, fantomes,
    aInstruire: juges.filter((j) => j.etat === "a-instruire"),
    conforme: fantomes.length === 0,
    documents: dossier.vues.map((v) => v.chemin),
  };
}

export function verifierTousLesKits({ lignes = [], root = ROOT, exists = existsSync, readFileImpl = readFileSync, alias = undefined, index = null } = {}) {
  if (!index?.mesurable) return { mesurable: false, pourquoi: index?.pourquoi ?? "index du dépôt non fourni" };
  const resultats = lignes.map((l) => verifierUnKit(l.chemin, { root, exists, readFileImpl, alias, index }));
  const mesures = resultats.filter((r) => r.mesurable);
  const dispenses = mesures.filter((r) => r.dispense);
  const examines = mesures.filter((r) => !r.dispense);
  const fautifs = examines.filter((r) => !r.conforme);
  return {
    mesurable: true, resultats,
    examines: examines.length, dispenses: dispenses.length, nonMesurables: resultats.length - mesures.length,
    fautifs, citesEnTout: examines.reduce((a, r) => a + r.combienCites, 0),
    fantomesEnTout: fautifs.reduce((a, r) => a + r.fantomes.length, 0),
    aInstruire: examines.flatMap((r) => (r.aInstruire ?? []).map((j) => ({ ...j, chemin: r.chemin }))),
    horsPortee: "elle vérifie qu'un nom CITÉ entre accents graves avec des parenthèses existe quelque part dans le dépôt. Elle ne dit rien de ce que la documentation OUBLIE — cette moitié-là demande une lecture, donc l'agent aveugle. Et une doc qui décrirait tout en prose, sans jamais citer un nom, passerait ici sans être vérifiée du tout.",
  };
}

export function formatConformiteLines(v) {
  if (!v?.mesurable) return [`=== CONFORMITÉ DES KITS : PAS MESURÉE — ${v?.pourquoi} ===`, "", "Ce n'est PAS « tout est conforme »."];
  const l = [`=== CONFORMITÉ MÉCANIQUE DES KITS — ${v.examines - v.fautifs.length}/${v.examines} sans aucune affirmation fausse ===`, ""];
  l.push(`  ${v.citesEnTout} nom(s) de fonction cité(s) dans les documents, ${v.fantomesEnTout} affirmé(s) à tort.`);
  if (v.dispenses) l.push(`  ⚪ ${v.dispenses} fichier(s) dispensés de kit par décision écrite — ils n'ont aucun document, et c'est voulu.`);
  if (v.nonMesurables) l.push(`  ❓ ${v.nonMesurables} fichier(s) non mesurables (aucun document lisible, sans dispense) — ce n'est jamais « conforme ».`);
  l.push("");
  if (!v.fautifs.length) l.push("  ✅ Aucun document n'affirme l'existence d'une fonction qui n'existe pas.");
  for (const f of v.fautifs) {
    l.push(`  🔴 ${f.chemin}`);
    for (const g of f.fantomes) l.push(`      · \`${g.nom}()\` cité dans ${g.ou} — ${g.pourquoi}`);
  }
  if (v.aInstruire?.length) {
    l.push("");
    l.push(`  🟡 ${v.aInstruire.length} nom(s) absent(s) mais PAS un mensonge — descendus d'un cran plutôt que cachés :`);
    for (const j of v.aInstruire) l.push(`      · \`${j.nom}()\` dans ${j.ou} — ${j.pourquoi}`);
  }
  l.push("");
  l.push(`  HORS PORTÉE : ${v.horsPortee}`);
  return l;
}

export function enregistrerPassage(entree, { root = ROOT, readFileImpl = readFileSync, writeImpl = writeFileSync, fichier = FICHIER_PASSAGES } = {}) {
  const passages = chargerPassages({ root, readFileImpl, fichier });
  passages.push(entree);
  mkdirSync(join(root, DOSSIER), { recursive: true });
  writeImpl(join(root, fichier), JSON.stringify(passages, null, 1));
  return passages.length;
}

async function commandeSujet() {
  const { vitaliteDuParc } = await import("./le-classificateur.mjs");
  const parc = vitaliteDuParc();
  if (!parc?.mesurable) { console.log("🚨 PAS MESURÉ — la vitalité du parc est indisponible, donc le tirage n'a pas de population. Ce n'est pas « rien à tester »."); return; }
  const lignes = [];
  for (const [vitalite, fichiers] of Object.entries(parc.parNiveau ?? {})) for (const f of fichiers) lignes.push({ chemin: f.chemin, vitalite });
  const passages = chargerPassages();
  const sujet = choisirLeMembre({ lignes, passages });
  if (!sujet.mesurable) { console.log(`🚨 PAS MESURÉ — ${sujet.pourquoi}`); return; }
  const dossier = dossierAveugle(sujet.chemin);
  if (!dossier.suffisant) { console.log(`🚨 ${sujet.chemin} n'a AUCUN document lisible : il n'y a rien à montrer à l'aveugle, et ça se répare avant de tester.`); return; }
  const jour = new Date().toISOString().slice(0, 10);
  const cible = join(ROOT, DOSSIER, `consigne-${basePourDocs(sujet.chemin)}-${jour}.txt`);
  mkdirSync(join(ROOT, DOSSIER), { recursive: true });
  writeFileSync(cible, promptAveugle(dossier));
  console.log(`=== X-Port BLINDTEST — sujet tiré ===\n`);
  console.log(`  SUJET   : ${sujet.chemin}  [${sujet.vitalite}]`);
  console.log(`  MOTIF   : ${sujet.motif}`);
  console.log(`  PHASE   : ${sujet.phase}${sujet.restants ? ` — ${sujet.restants} membre(s) encore jamais testés` : ""}`);
  console.log(`  MONTRÉ  : ${dossier.vues.map((v) => v.cle).join(", ")}`);
  if (dossier.absentes.length) console.log(`  ABSENT  : ${dossier.absentes.map((a) => a.chemin).join(", ")} — un document manquant n'est pas une faute de l'aveugle`);
  console.log(`  CACHÉ   : ${Object.keys(PIECES_CACHEES).join(", ")} — ${Object.values(PIECES_CACHEES)[0]}`);
  console.log(`\nÉcrit : ${cible}`);
  console.log(`\nÉTAPE SUIVANTE (coûteuse, Article 22/SMART-CONSO-TOKEN) : un agent séparé lit CE FICHIER SEUL,`);
  console.log(`sans jamais ouvrir ${sujet.chemin}, et dépose son pronostic JSON. Puis :`);
  console.log(`  node scripts/x-port-blindtest.mjs juger <pronostic.json> ${sujet.chemin}`);
}

async function commandeJuger(fichierPronostic, cheminSujet) {
  if (!fichierPronostic) { console.log("Usage : node scripts/x-port-blindtest.mjs juger <pronostic.json> [chemin/du/sujet.mjs]"); return; }
  let pronostic = null;
  try { pronostic = JSON.parse(readFileSync(fichierPronostic, "utf8")); }
  catch (e) { console.log(`🚨 PAS MESURÉ — le pronostic n'a pas pu être lu (${e.message}). Ce n'est PAS « kit fidèle ».`); return; }
  const sujet = cheminSujet ?? pronostic.sujet;
  if (!sujet) { console.log("🚨 PAS MESURÉ — aucun sujet : ni en argument, ni dans le pronostic. Comparer au hasard rendrait un verdict sur le mauvais fichier."); return; }
  let source = "";
  try { source = readFileSync(join(ROOT, sujet), "utf8"); }
  catch { console.log(`🚨 PAS MESURÉ — ${sujet} est illisible : la structure réelle n'a pas été établie, ce qui n'est jamais « rien à comparer ».`); return; }
  const reelle = structureReelle(source, { chemin: sujet });
  const comparaison = comparerStructures(pronostic, reelle);
  const gabarit = gabaritDemandeLInventaire();
  const portee = comparaison.mesurable ? porteeDuDefaut(comparaison.rates, gabarit) : { mesurable: false, pourquoi: "la comparaison elle-même n'a pas abouti" };
  const verdict = verdictBlindtest(comparaison);
  const lignes = formatBlindtestLines(sujet, comparaison, portee, verdict);
  for (const l of lignes) console.log(l);
  const constats = constatsBlindtest(sujet, comparaison, portee, verdict);
  // buildPlanDaction() rend un OBJET, jamais des lignes : ses `lignes` sont dedans. Découvert en le
  // lançant pour de vrai — le rapport imprimait « [object Object] » à la place du plan, c'est-à-dire
  // le maillon que l'Article 28 rend obligatoire, perdu en silence dans un fichier par ailleurs
  // impeccable.
  const plan = buildPlanDaction(constats, { toolSlug: OUTIL });
  const lignesDuPlan = plan?.lignes ?? [];
  const texte = [...lignes, "", ...lignesDuPlan].join("\n");
  const jour = new Date().toISOString().slice(0, 10);
  const cible = join(ROOT, DOSSIER, `blindtest-${basePourDocs(sujet)}-${jour}.txt`);
  mkdirSync(join(ROOT, DOSSIER), { recursive: true });
  writeFileSync(cible, texte);
  if (comparaison.mesurable) {
    enregistrerPassage({ chemin: sujet, date: new Date().toISOString(), rappel: comparaison.rappel, bruit: comparaison.bruit, verdict: verdict.niveau, systemique: portee.mesurable ? portee.systemique.length : null });
  }
  console.log("");
  for (const l of lignesDuPlan) console.log(l);
  console.log(`\nÉcrit : ${cible}`);
}

async function commandeConformite() {
  const { vitaliteDuParc } = await import("./le-classificateur.mjs");
  const parc = vitaliteDuParc();
  if (!parc?.mesurable) { console.log("🚨 PAS MESURÉ — la vitalité du parc est indisponible, donc la population des kits est inconnue."); return; }
  const lignes = [];
  for (const [vitalite, fichiers] of Object.entries(parc.parNiveau ?? {})) for (const f of fichiers) lignes.push({ chemin: f.chemin, vitalite });
  const index = indexDuDepot();
  const v = verifierTousLesKits({ lignes, index });
  const lgs = formatConformiteLines(v);
  for (const l of lgs) console.log(l);
  const jour = new Date().toISOString().slice(0, 10);
  mkdirSync(join(ROOT, DOSSIER), { recursive: true });
  const cible = join(ROOT, DOSSIER, `conformite-${jour}.txt`);
  writeFileSync(cible, lgs.join("\n"));
  console.log(`\nÉcrit : ${cible}`);
}

async function main() {
  printReliabilityNotice("il compare des NOMS de fonctions entre une documentation et un code — une documentation excellente qui ne nomme rien sera comptée comme incomplète, et un pronostic reste un jugement, jamais une mesure exacte.");
  recordCliUsage(OUTIL, { commande: process.argv[2] ?? "aide" });
  const cmd = process.argv[2];
  if (cmd === "sujet") return commandeSujet();
  if (cmd === "juger") return commandeJuger(process.argv[3], process.argv[4]);
  if (cmd === "conformite") return commandeConformite();
  console.log("X-Port BLINDTEST — le test à l'aveugle de la qualité d'un kit d'export.");
  console.log("");
  console.log("  node scripts/x-port-blindtest.mjs sujet            → tire un membre, écrit la consigne aveugle");
  console.log("  node scripts/x-port-blindtest.mjs juger <fichier> [sujet]  → compare le pronostic au vrai code");
  console.log("");
  console.log("Entre les deux : un agent séparé lit la consigne SANS voir le code et dépose son pronostic JSON.");
  console.log("Coûteux (Article 22/SMART-CONSO-TOKEN) — sélectionnable en mode GOAT de la Ronde, jamais automatique.");
}

// LE LANCEUR EN TOUT DERNIER — quatre outils de ce dépôt ont payé l'inverse le même jour : une
// constante écrite sous cette ligne est en zone morte temporelle au moment où main() part.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) main();
