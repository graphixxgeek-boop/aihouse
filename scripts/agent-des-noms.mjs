#!/usr/bin/env node
// ICEBERG: membre
// L'AGENT DES NOMS — l'utilisateur baptise, le mécanisme se souvient
// NOM PROVISOIRE depuis 2026-09-24 — « agent des noms » est SON mot, employé en demandant si
// l'agent était prêt ; il reste à confirmer comme nom définitif. Au premier passage réel, cet
// outil s'est signalé LUI-MÊME faute de date à côté de sa marque : la date ci-dessus est la
// correction, et le refus d'alerter sans elle est la bonne réaction — une ancienneté inventée
// vaut moins qu'un aveu d'ignorance.
// ==================================================================
// POURQUOI IL EXISTE (2026-09-24). Sa règle, dans ses mots : « je dois toujours choisir les noms
// d'outil ou de process ou de rapports, et l'outil veille à ce que cette regle soit respecté. c'est
// un process aussi ». Le nom « agent des noms » est le sien — il l'a employé en demandant si
// l'agent était prêt.
//
// CE QUE LE MÉCANISME PEUT ET NE PEUT PAS. Il ne peut pas empêcher l'agent de choisir un nom : rien
// ne le permettrait. Ce qu'il peut, et qui suffit, c'est rendre IMPOSSIBLE d'oublier : un nom posé
// à titre provisoire porte une marque, et cette marque est cherchée à chaque passage. Un nom
// provisoire qui traîne devient donc visible, jamais silencieux.
//
// LA RÉCURSION EST ASSUMÉE : ce fichier porte lui-même un nom provisoire, marqué comme tel, et il
// se signalera tout seul au premier passage. C'est le meilleur test possible de sa propre règle.
//
// LE REGISTRE GARDE CE QUE GIT NE GARDE PAS : git sait qu'un nom a changé, jamais QUI l'a choisi ni
// ce qui avait été proposé à côté. Or « pourquoi ça s'appelle comme ça » est une vraie question,
// posée plusieurs fois dans ce projet.
//
// GÉNÉRIQUE : rien ici ne connaît ce projet. Un autre projet piloté par IA réutilise ce fichier tel
// quel — seules les séries d'hommages sont propres à un goût, et elles sont déclarées à part.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { printReliabilityNotice } from "./lib-shell.mjs";

export const OUTIL = "agent-des-noms";
export const SCRIPT_PATH = "scripts/agent-des-noms.mjs";
export const REGISTRE = "docs/agent-des-noms/registre.md";
export const MARQUE_PROVISOIRE = "NOM PROVISOIRE";
// Un nom provisoire n'est pas un défaut : c'est ce qui permet de travailler sans bloquer la nuit.
// Il ne devient un défaut qu'en DURANT. Sept jours, parce que c'est plus long qu'une nuit de
// travail autonome et plus court qu'un oubli durable.
export const JOURS_AVANT_ALERTE = 7;

// CE QUI SE NOMME, et rien d'autre — sa portée exacte, tranchée le 2026-09-24. Élargir à tout ce
// qui porte un nom rendrait la règle ingérable ; la réduire lui ferait perdre ce qui compte.
export const OBJETS_A_NOMMER = ["outil", "process", "rapport"];

// LES SÉRIES D'HOMMAGES. Chacune est un GOÛT, pas une règle : un nom hors série reste légitime, il
// déclare seulement qu'il est hors série. La série « grands codeurs » a une raison de plus que le
// plaisir, et elle est de lui : ceux qui ont servi toute la profession ont contribué à ce projet
// par ricochet, y compris à travers l'IA qui l'écrit.
export const SERIES_HOMMAGE = {
  "grands-codeurs": { quoi: "ceux qui ont servi toute la profession", pourquoi: "ils ont contribué à ce projet par ricochet, à travers l'outil qui l'écrit" },
  "dystopique": { quoi: "les auteurs et les images de la dystopie", pourquoi: "c'est l'ambiance même du jeu" },
  "prophetes": { quoi: "ceux qui annoncent et qu'on n'écoute pas", pourquoi: "c'est exactement le métier d'un outil de vigilance — et CASSANDRA, déjà dans l'équipe, en fait partie sans l'avoir déclaré" },
  "matrix": { quoi: "le film", pourquoi: "des êtres qui découvrent que leur monde est fabriqué : le sujet du jeu, mot pour mot" },
  "squid-game": { quoi: "la série", pourquoi: "des gens observés par des spectateurs masqués qui s'amusent : la thèse du projet" },
};

// ===========================================================================================
// LA FONCTION PRINCIPALE : MINIMISER LE RISQUE TECHNIQUE D'UN RENOMMAGE EN MASSE
// ===========================================================================================
// L'utilisateur a corrigé le cadrage, et il avait raison : « cet agent a pour fonction principale
// de minimiser le risque technique lié au changement de noms en masse ». Le registre et la marque
// provisoire ci-dessus sont la GOUVERNANCE du nommage — utile, mais la moitié secondaire.
//
// LE RISQUE, MESURÉ AVANT D'ÊTRE DÉCRIT (2026-09-24, sur le vrai dépôt) : renommer `cassandra-rh`
// toucherait 2 095 occurrences réparties dans 73 fichiers de documentation. Renommer `memento` :
// 775. Renommer `el-professor` : 604.
//
// ET LE RISQUE N'EST PAS OÙ ON LE CROIT. Sur les 2 095 de CASSANDRA, NEUF seulement sont des
// imports de code — ceux-là, un test cassé les attrape en dix secondes. En revanche 496 vivent dans
// `docs/suivi/`, c'est-à-dire dans l'HISTOIRE. Et celles-là ne doivent SURTOUT PAS être renommées :
// une ligne de suivi de septembre qui dit « CASSANDRA-RH a trouvé X » doit continuer à le dire.
// La réécrire falsifierait ce qui s'est réellement passé, et le ferait en silence.
//
// D'OÙ LA RÈGLE CENTRALE DE CET OUTIL, et c'est elle qui justifie son existence :
//   un renommage déplace le CODE VIVANT et laisse l'HISTOIRE intacte.
// Ce qui relie les deux ensuite n'est pas une réécriture, c'est un ALIAS : « ce qui s'appelle
// aujourd'hui X s'appelait Y jusqu'au tant ». Un lecteur futur retrouve le fil sans qu'on ait eu à
// mentir sur le passé.
//
// CE QU'IL NE FAIT PAS, délibérément : il ne renomme rien. Il inventorie, il trie, il produit un
// plan, et il vérifie après coup. Un outil qui renommerait 2 000 occurrences tout seul serait
// exactement l'action difficile à défaire que ce projet refuse de prendre sans validation.

// Les cinq natures d'une occurrence, et seules les trois premières se déplacent.
export const NATURES_OCCURRENCE = {
  "import-de-code": { deplace: true, risque: "élevé", quoi: "un import ou un chemin de module — casse immédiatement, et un test le voit" },
  "commande-ecrite": { deplace: true, risque: "moyen", quoi: "un `node scripts/X.mjs` dans un document — casse à l'usage, silencieusement" },
  "chemin-de-registre": { deplace: true, risque: "élevé", quoi: "un dossier `docs/X/` ou une clé de registre — casse la mémoire de l'outil" },
  "mention-vivante": { deplace: true, risque: "faible", quoi: "une prose qui décrit ce que l'outil fait AUJOURD'HUI" },
  "trace-historique": { deplace: false, risque: "🔴 NE JAMAIS TOUCHER", quoi: "une ligne de suivi, un rapport archivé, une mesure passée — la renommer falsifie ce qui s'est passé" },
};

// Ce qui est de l'HISTOIRE se reconnaît à son EMPLACEMENT, jamais à son contenu : un dossier
// d'archives contient des archives, quoi qu'elles racontent.
//
// PREMIER PASSAGE RÉEL, ET IL A RATÉ (2026-09-24, sur `memento`). La première version cherchait une
// DATE dans le nom du fichier. Résultat : `docs/check-tasks-details/ronde-2026-09-21T23-26-29.txt`
// passait pour de l'histoire, et `docs/check-tasks-details/1789942702956-arborescence.html` — même
// dossier, même nature, horodatage en millisecondes — passait pour du vivant. Encore le fil rouge :
// une sonde qui NE PEUT PAS reconnaître rend exactement ce que rend une sonde qui n'a rien trouvé.
//
// LA RÈGLE CORRIGÉE PREND LE PROBLÈME PAR L'AUTRE BOUT, et elle est dérivée plutôt qu'énumérée
// (Article 24) : tout ce qui vit dans un SOUS-DOSSIER de `docs/` est un registre horodaté — c'est
// la règle d'organisation du projet, `docs/<nom-de-l-outil>/` — donc de l'histoire par défaut. Le
// VIVANT est l'exception, et elle se déclare : `docs/referentiel/` est la seule référence que le
// projet tient à jour au présent.
//
// LE DÉFAUT PENCHE DU CÔTÉ SÛR, délibérément. Se tromper en classant du vivant comme historique
// laisse une mention périmée — ennuyeux. Se tromper dans l'autre sens réécrit une archive et
// falsifie ce qui s'est passé — c'est précisément ce que cet outil existe pour empêcher. Entre les
// deux erreurs, on choisit la première sans hésiter.
// Le vivant s'arrête au PREMIER niveau : `docs/referentiel/x.md` est tenu à jour, mais
// `docs/referentiel/kpi-rapports/manuel-2026-09-21.txt` est un rapport archivé sous un dossier de
// référence — trouvé au deuxième passage réel, et c'était l'erreur dangereuse, celle qui réécrit
// une archive. Un sous-dossier est un registre, où qu'il vive.
export const DOSSIERS_VIVANTS = [/^docs\/referentiel\/[^/]+$/];
export const DOSSIERS_HISTORIQUES = [/^docs\/[^/]+\//, /\.csv$/, /\.jsonl?$/, /historique/i];

export function natureDeLOccurrence(chemin, ligne, ancien) {
  if (!DOSSIERS_VIVANTS.some((r) => r.test(chemin)) && DOSSIERS_HISTORIQUES.some((r) => r.test(chemin))) return "trace-historique";
  if (/^(scripts|lib|app|components)\//.test(chemin) && new RegExp(`(from|import\\()\\s*['"\`][^'"\`]*${ancien}`).test(ligne)) return "import-de-code";
  if (new RegExp(`node\\s+scripts/${ancien}\\.mjs`).test(ligne)) return "commande-ecrite";
  if (new RegExp(`docs/${ancien}/|["'\`]${ancien}["'\`]\\s*:`).test(ligne)) return "chemin-de-registre";
  return "mention-vivante";
}

// LA COLLECTE, branchée sur le VRAI dépôt — et c'est ce qui sépare cet outil d'une intention
// (leçon L2). Elle lit git grep plutôt que le disque : ce qui n'est pas versionné n'est pas le
// projet, et un dossier de dépendances ferait exploser le compte sans rien apprendre.
// Elle rend `mesurable: false` quand la recherche N'A PAS PU tourner, jamais un zéro vert — c'est
// le fil rouge de ce projet, treize fois rencontré : un contrôle empêché de regarder rend
// exactement ce que rend un contrôle qui n'a rien trouvé.
export function collecterOccurrences(ancien, { root = ".", executer } = {}) {
  const lancer = executer ?? ((args) => execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
  let brut;
  try {
    brut = lancer(["grep", "-n", "--fixed-strings", "--", ancien]);
  } catch (e) {
    // git grep sort en 1 quand il ne trouve RIEN : ce cas-là est une vraie mesure à zéro.
    if (e?.status === 1) return { occurrences: [], mesurable: true, pourquoi: null };
    return { occurrences: [], mesurable: false, pourquoi: `la recherche n'a pas pu tourner (${e?.message ?? "raison inconnue"}) — une liste vide ici ne veut PAS dire « aucune occurrence »` };
  }
  const occurrences = [];
  for (const l of String(brut).split("\n")) {
    if (!l) continue;
    const m = l.match(/^([^:]+):(\d+):([\s\S]*)$/);
    if (!m) continue;
    occurrences.push({ chemin: m[1], numero: Number(m[2]), ligne: m[3] });
  }
  return { occurrences, mesurable: true, pourquoi: null };
}

// LE PIÈGE QU'UN `sed` NE VOIT JAMAIS : un nom qui en CONTIENT un autre. Renommer `memento`
// toucherait `memento-weight`, qui est un outil différent — et le casserait en silence, puisque rien
// dans le texte ne distingue les deux. Trouvé sur le vrai dépôt au passage de vérification, pas
// imaginé : `lib/memento-weight.ts`, `scripts/memento-weight.mjs`, `docs/referentiel/memento-weight.md`.
export function homonymesEtendus(ancien, occurrences = []) {
  const suite = new RegExp(`${ancien.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[A-Za-z0-9_-]`);
  const noms = new Set();
  for (const o of occurrences) {
    for (const m of String(o.ligne).matchAll(new RegExp(`${ancien.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[A-Za-z0-9_-]+`, "g"))) noms.add(m[0]);
    if (suite.test(o.chemin)) for (const m of String(o.chemin).matchAll(new RegExp(`${ancien.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[A-Za-z0-9_-]+`, "g"))) noms.add(m[0]);
  }
  return [...noms].sort();
}

export function inventaireDuRenommage(ancien, occurrences = []) {
  const par = Object.fromEntries(Object.keys(NATURES_OCCURRENCE).map((n) => [n, []]));
  for (const o of occurrences) par[natureDeLOccurrence(o.chemin, o.ligne, ancien)].push(o);
  const aDeplacer = Object.entries(par).filter(([n]) => NATURES_OCCURRENCE[n].deplace).reduce((s, [, v]) => s + v.length, 0);
  return { ancien, par, total: occurrences.length, aDeplacer, aLaisser: par["trace-historique"].length,
    homonymes: homonymesEtendus(ancien, occurrences),
    mesurable: occurrences.length > 0,
    pourquoi: occurrences.length ? null : "aucune occurrence trouvée — soit le nom n'existe pas, soit la recherche n'a pas pu lire le dépôt : les deux rendent une liste vide et ne veulent pas dire la même chose" };
}

export function planDeRenommage(inv, nouveau) {
  if (!inv.mesurable) return { lignes: [`⚠️ NON MESURABLE — ${inv.pourquoi}`], sur: false };
  const L = [`RENOMMER « ${inv.ancien} » EN « ${nouveau} » — ${inv.total} occurrence(s) au total.`, ""];
  L.push(`À DÉPLACER : ${inv.aDeplacer}`);
  for (const [n, d] of Object.entries(NATURES_OCCURRENCE)) {
    if (!d.deplace) continue;
    const liste = inv.par[n];
    if (liste.length) L.push(`   ${d.risque.padEnd(7)} ${String(liste.length).padStart(4)} × ${n} — ${d.quoi}`);
  }
  L.push("");
  L.push(`À LAISSER INTACTES : ${inv.aLaisser} trace(s) historique(s).`);
  L.push(`   🔴 Une ligne de suivi, un rapport archivé ou une mesure passée garde le nom qu'elle portait.`);
  L.push(`   La réécrire falsifierait ce qui s'est passé — et le ferait en silence, ce qui est pire.`);
  L.push("");
  if (inv.homonymes?.length) {
    L.push(`🔴 ATTENTION — ${inv.homonymes.length} nom(s) CONTIENNENT « ${inv.ancien} » sans être lui :`);
    L.push(`   ${inv.homonymes.join(" · ")}`);
    L.push(`   Un remplacement de texte aveugle les emporterait avec, et les casserait en silence.`);
    L.push("");
  }
  L.push(`CE QUI RELIE LES DEUX : un ALIAS « ${nouveau} s'appelait ${inv.ancien} » dans le registre des noms.`);
  L.push(`Un lecteur futur retrouve le fil sans qu'on ait eu à mentir sur le passé.`);
  return { lignes: L, sur: inv.par["import-de-code"].length > 0 };
}

// LA VÉRIFICATION D'APRÈS, et elle compte autant que le plan : un renommage réussi ne laisse AUCUN
// reste vivant de l'ancien nom, et n'a touché AUCUNE trace historique. Les deux se vérifient, et
// le second est celui qu'on oublie.
export function verifierApresRenommage(ancien, occurrencesRestantes = []) {
  const restesVivants = occurrencesRestantes.filter((o) => natureDeLOccurrence(o.chemin, o.ligne, ancien) !== "trace-historique");
  return { propre: restesVivants.length === 0, restesVivants,
    pourquoi: restesVivants.length
      ? `${restesVivants.length} occurrence(s) VIVANTE(S) de l'ancien nom subsistent — un renommage à moitié fait est pire qu'un renommage pas fait : les deux noms coexistent et personne ne sait lequel fait foi`
      : "aucun reste vivant — les traces historiques conservées sont normales et attendues" };
}

export function mentionProvisoire(source) {
  const i = String(source ?? "").indexOf(MARQUE_PROVISOIRE);
  if (i < 0) return null;
  const autour = String(source).slice(Math.max(0, i - 200), i + 300);
  const date = autour.match(/20\d{2}-\d{2}-\d{2}/);
  return { marque: true, depuis: date ? date[0] : null,
    pourquoi: date ? null : "aucune date à côté de la marque — impossible de dire depuis quand il traîne, donc impossible d'alerter" };
}

// Le compte des jours ne se devine pas : sans date lisible à côté de la marque, la fonction REFUSE
// d'alerter plutôt que de supposer une ancienneté. Un « 0 jour » inventé se lit comme un nom posé
// à l'instant, et laisserait dormir exactement ce qu'on cherche.
export function findNomsProvisoiresOublies(fichiers = [], { lire, aujourdhui, jours = JOURS_AVANT_ALERTE } = {}) {
  const oublies = [];
  const sansDate = [];
  for (const f of fichiers) {
    let src = ""; try { src = lire(f); } catch { continue; }
    const m = mentionProvisoire(src);
    if (!m) continue;
    if (!m.depuis) { sansDate.push({ fichier: f, pourquoi: m.pourquoi }); continue; }
    const age = Math.floor((Date.parse(aujourdhui) - Date.parse(m.depuis)) / 86_400_000);
    if (age >= jours) oublies.push({ fichier: f, depuis: m.depuis, jours: age });
  }
  return { oublies, sansDate, mesurable: true };
}

// LE BAPTÊME. Même refus que `enregistrerXp()` et pour la même raison : un mécanisme ne peut pas
// prouver que l'utilisateur a choisi, mais il peut refuser de l'inventer. Un nom enregistré sans
// `parUtilisateur: true` serait un nom que l'agent s'est donné en prétendant le contraire.
export function enregistrerBapteme(entree, { root = ".", lire = readFileSync, ecrire = writeFileSync, date = new Date().toISOString().slice(0, 10) } = {}) {
  if (!OBJETS_A_NOMMER.includes(entree?.objet)) throw new Error(`objet « ${entree?.objet} » hors portée — seuls ${OBJETS_A_NOMMER.join(", ")} se nomment (décision du 2026-09-24)`);
  if (!entree?.nomRetenu) throw new Error("un baptême sans nom retenu n'est pas un baptême");
  if (entree.parUtilisateur !== true) throw new Error("un nom n'est valable que CHOISI PAR L'UTILISATEUR — jamais l'agent sur son propre travail (règle du 2026-09-24)");
  const chemin = join(root, REGISTRE);
  let texte = "";
  try { texte = lire(chemin, "utf8"); } catch {
    try { mkdirSync(join(root, "docs/agent-des-noms"), { recursive: true }); } catch { /* déjà là */ }
    texte = `# Registre des noms\n\n*(Qui a nommé quoi, quand, et ce qui avait été proposé à côté. Git sait qu'un nom a\nchangé ; il ne sait jamais POURQUOI celui-là et pas un autre — et c'est une question\nqui a déjà été posée plusieurs fois dans ce projet.)*\n\n| Date | Objet | Nom retenu | Série | Autres propositions | Pourquoi celui-là |\n|---|---|---|---|---|---|\n`;
  }
  const ligne = `| ${date} | ${entree.objet} | **${entree.nomRetenu}** | ${entree.serie ?? "hors série"} | ${(entree.propositions ?? []).filter((p) => p !== entree.nomRetenu).join(" · ") || "—"} | ${entree.pourquoi ?? "—"} |`;
  ecrire(chemin, `${texte.replace(/\n+$/, "")}\n${ligne}\n`, "utf8");
  return { enregistre: true, ligne };
}

// Les noms déjà en service que l'utilisateur n'a jamais validés : la dette de nommage, à purger
// APRÈS la classification — séquence qu'il a posée lui-même, et qui a sa raison : renommer avant
// de savoir dans quel groupe vit un outil produirait un nom qui ne veut plus rien dire ensuite.
export function findNomsNonValides(nomsEnService = [], registreTexte = "") {
  return nomsEnService.filter((n) => !new RegExp(`\\*\\*${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\*\\*`, "i").test(registreTexte));
}

export function formatNomsLines({ provisoires, nonValides, registreExiste }) {
  const L = [];
  L.push(`Noms provisoires oubliés (plus de ${JOURS_AVANT_ALERTE} jours) : ${provisoires.oublies.length}`);
  for (const o of provisoires.oublies) L.push(`   🟠 ${o.fichier} — provisoire depuis ${o.depuis} (${o.jours} j)`);
  if (provisoires.sansDate.length) {
    L.push(`⚠️ ${provisoires.sansDate.length} marque(s) sans date lisible — l'ancienneté n'est pas mesurable, donc AUCUNE alerte n'est rendue plutôt qu'une alerte inventée :`);
    for (const s of provisoires.sansDate) L.push(`   · ${s.fichier}`);
  }
  L.push("");
  L.push(registreExiste
    ? `Noms en service jamais validés par l'utilisateur : ${nonValides.length}`
    : `⚠️ Le registre n'existe pas encore : les ${nonValides.length} noms en service comptent TOUS comme non validés, ce qui est le vrai état des choses et non un artefact.`);
  for (const n of nonValides.slice(0, 40)) L.push(`   · ${n}`);
  if (nonValides.length > 40) L.push(`   · … et ${nonValides.length - 40} autre(s)`);
  return L;
}

function mainGouvernance(root) {
  const fichiers = [];
  for (const d of ["scripts", "docs"]) {
    try { for (const f of readdirSync(join(root, d))) if (/\.(mjs|md)$/.test(f)) fichiers.push(join(d, f)); } catch { /* absent */ }
  }
  const provisoires = findNomsProvisoiresOublies(fichiers, {
    lire: (f) => readFileSync(join(root, f), "utf8"),
    aujourdhui: new Date().toISOString().slice(0, 10) });
  const registreExiste = existsSync(join(root, REGISTRE));
  const registreTexte = registreExiste ? readFileSync(join(root, REGISTRE), "utf8") : "";
  const nomsEnService = readdirSync(join(root, "scripts")).filter((f) => f.endsWith(".mjs")).map((f) => f.replace(/\.mjs$/, ""));
  for (const l of formatNomsLines({ provisoires, nonValides: findNomsNonValides(nomsEnService, registreTexte), registreExiste })) console.log(l);
  console.log(`\nHORS PORTÉE : aucun mécanisme ne peut empêcher un nom d'être choisi — il peut seulement rendre impossible de l'OUBLIER. Et la dette ci-dessus se purge APRÈS la classification, jamais avant : renommer un outil dont on ignore encore le groupe produit un nom qui ne voudra plus rien dire.`);
}

function mainRenommage(root, ancien, nouveau) {
  if (!ancien || !nouveau) { console.log("Usage : node scripts/agent-des-noms.mjs renommage <ancien> <nouveau>"); return; }
  const { occurrences, mesurable, pourquoi } = collecterOccurrences(ancien, { root });
  if (!mesurable) { console.log(`⚠️ NON MESURABLE — ${pourquoi}`); return; }
  const inv = inventaireDuRenommage(ancien, occurrences);
  for (const l of planDeRenommage(inv, nouveau).lignes) console.log(l);
  console.log("");
  console.log("LES FICHIERS DE CODE À TOUCHER, un par un — c'est la liste qui rend le risque tenable :");
  const codes = inv.par["import-de-code"].concat(inv.par["chemin-de-registre"]);
  const parFichier = new Map();
  for (const o of codes) parFichier.set(o.chemin, (parFichier.get(o.chemin) ?? 0) + 1);
  if (!parFichier.size) console.log("   (aucun) — le nom ne vit dans aucun import ni aucun chemin de registre : le renommage est de la prose.");
  for (const [f, n] of [...parFichier].sort((a, b) => b[1] - a[1])) console.log(`   ${String(n).padStart(4)} × ${f}`);
  console.log("");
  console.log(`APRÈS COUP, relancer : node scripts/agent-des-noms.mjs verifier ${ancien}`);
  console.log(`   Un renommage à moitié fait est PIRE qu'un renommage pas fait : les deux noms coexistent et personne ne sait lequel fait foi.`);
}

function mainVerifier(root, ancien) {
  if (!ancien) { console.log("Usage : node scripts/agent-des-noms.mjs verifier <ancien>"); return; }
  const { occurrences, mesurable, pourquoi } = collecterOccurrences(ancien, { root });
  if (!mesurable) { console.log(`⚠️ NON MESURABLE — ${pourquoi}`); return; }
  const v = verifierApresRenommage(ancien, occurrences);
  console.log(v.propre ? `✅ ${v.pourquoi}` : `🔴 ${v.pourquoi}`);
  for (const o of v.restesVivants.slice(0, 40)) console.log(`   ${o.chemin}:${o.numero}`);
  if (v.restesVivants.length > 40) console.log(`   … et ${v.restesVivants.length - 40} autre(s)`);
}

function main() {
  const root = process.cwd();
  const [cmd, a, b] = process.argv.slice(2);
  console.log(`\n=== L'AGENT DES NOMS — l'utilisateur baptise, le mécanisme se souvient ===\n`);
  printReliabilityNotice("agent-des-noms");   // le slug en clair, jamais la constante : le garde-fou de doc-report cherche le NOM, et une indirection le rendrait muet
  console.log("");
  if (cmd === "renommage") return mainRenommage(root, a, b);
  if (cmd === "verifier") return mainVerifier(root, a);
  mainGouvernance(root);
  console.log(`\nAUTRES COMMANDES : renommage <ancien> <nouveau> (le plan, avant) · verifier <ancien> (le reste, après)`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
