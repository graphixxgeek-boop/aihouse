// DATA-ARCHANGEL (2026-09-22, nom donné par l'utilisateur). L'outil qui veille sur la CIRCULATION
// des données à l'intérieur de l'Agence Codex — et, explicitement, sur mon propre accès à elles :
// « assure-toi que l'organisation te permet d'avoir accès à toutes ces données, et qu'elles te
// soient utiles à TOI en priorité. Assure-toi que tu puises bien dans toute la data. »
//
// LE PROBLÈME QU'IL RÉSOUT. Vingt-cinq outils produisent des données : des journaux d'état, des
// registres datés, des historiques chiffrés. Chacun écrit dans son coin, et personne n'a jamais
// vérifié qui LIT quoi. Une donnée qu'on paie à produire et que rien ne relit n'existe pas
// vraiment : elle coûte son calcul, occupe son fichier, et meurt là. Symétriquement, un outil qui
// rend un verdict sans consulter une donnée disponible juste à côté juge à l'aveugle alors que la
// réponse était sur le disque.
//
// LES DEUX SENS, UN SEUL VERDICT (calibrage explicite de l'utilisateur). Il ne prend pas le
// problème par un bout mais par les deux : la donnée orpheline d'un côté, l'outil mal informé de
// l'autre — et propose le branchement qui réglerait les deux à la fois.
//
// CE QU'IL NE FAIT JAMAIS : brancher lui-même. Connecter deux outils change ce qu'un rapport
// raconte ; ça se décide, ça ne s'improvise pas. Il signale, il mesure, il propose. Même frontière
// que pure-gold-unity, et pour la même raison.
//
// ÉVOLUTIVITÉ (Article 24) : aucune liste de sources tenue à la main. Les journaux viennent de
// LOCAL_JOURNALS (doc-report), les registres de REGISTRIES, l'historique KPI de sa propre
// constante. Un nouvel outil qui déclare son journal entre dans le champ de vision sans qu'une
// ligne ne bouge ici.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { printReportHeader } from "./report-template.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { LOCAL_JOURNALS, REGISTRIES } from "./doc-report.mjs";
import { KPI_HISTORY_PATH } from "./kpi-report.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// ————————————————————————————————————————————————————————————————————————
// L'INVENTAIRE — tout ce que l'Agence sait, en un seul endroit
// ————————————————————————————————————————————————————————————————————————

// Les trois natures de donnée, jamais confondues : elles ne se lisent pas au même rythme et une
// absence de lecteur ne veut pas dire la même chose pour chacune.
export const NATURES = {
  journal: "état local jamais committé — mémoire de travail des outils entre deux lancements",
  registre: "trace datée committée — l'histoire de ce qu'un outil a trouvé",
  mesure: "série chiffrée committée — ce qui permet de comparer dans le temps",
};

export function listDataSources({ journaux = LOCAL_JOURNALS, registres = REGISTRIES, kpiPath = KPI_HISTORY_PATH } = {}) {
  const sources = [];
  for (const j of journaux) sources.push({ id: j.path, nature: "journal", producteur: j.owner, contenu: j.purpose });
  for (const r of registres) sources.push({ id: r.path, nature: "registre", producteur: r.label, contenu: `registre ${r.family ?? ""}`.trim(), scriptPath: r.scriptPath });
  sources.push({ id: kpiPath, nature: "mesure", producteur: "Tableau de bord interne (KPI)", contenu: "série chiffrée des indicateurs du projet, run après run" });
  // Un même chemin déclaré deux fois (un outil avec deux entrées de registre) ne doit compter
  // qu'une fois, sans quoi le dénominateur de tous les ratios devient faux.
  const vus = new Set();
  return sources.filter((s) => (vus.has(s.id) ? false : vus.add(s.id)));
}

function scriptFiles(root) {
  try {
    return readdirSync(join(root, "scripts")).filter((f) => f.endsWith(".mjs")).map((f) => `scripts/${f}`);
  } catch { return []; }
}

// DÉCLARER N'EST PAS LIRE — la correction qui a sauvé cet outil de son premier verdict.
//
// Premier passage réel : « 53 sources sur 53 relues, 100 % ». Trop propre, et faux. Cause :
// doc-report.mjs cite 52 des 53 sources parce qu'il les DÉCLARE — c'est le catalogue du paysage,
// pas un consommateur de ses données. Compter une déclaration comme une lecture rendait tout le
// réseau parfaitement branché alors que rien ne circulait. Encore une mesure adjacente présentée
// comme la mesure visée, commise dans l'outil écrit pour traquer exactement ça.
//
// LE PRINCIPE, plutôt qu'une liste de fichiers à ignorer (qui se périmerait au prochain catalogue) :
// une déclaration vit dans le corps d'une constante exportée (`export const X = [...]`), une lecture
// vit dans du code. On retire donc ces corps avant de chercher, pour tous les fichiers sans
// exception — un futur catalogue sera traité comme celui-ci sans qu'une ligne ne bouge.
export function stripExportedConstantBodies(code) {
  // On repère chaque `export const NOM = ` en début de ligne et on coupe jusqu'à la fin de sa
  // valeur, détectée par le retour en colonne 0 d'un `}` ou `]` suivi d'un point-virgule — la forme
  // qu'ont réellement toutes les grandes déclarations de ce dépôt.
  return code.replace(/^export const\s+[A-Z_][A-Z0-9_]*\s*=\s*[[{][\s\S]*?^[\]}];?$/gm, "/* déclaration retirée */");
}

// Le second cas, distinct et volontairement séparé : un chemin cité dans la SUITE DE TESTS est une
// vérification, jamais une exploitation de la donnée. Une source que seul le filet de sécurité
// mentionne ne circule pas davantage qu'une source citée nulle part.
//
// Cette constante est volontairement tenue à la main, et l'Article 24 l'autorise explicitement à
// cette condition, écrite ici : ce ne sont pas des membres de l'équipe dont la liste évolue, ce sont
// les deux fichiers d'infrastructure de vérification du dépôt, stables par nature.
export const FICHIERS_DE_VERIFICATION = ["scripts/check-house.mjs", "scripts/check-suivi-fidelity.mjs"];

// QUI LIT QUOI, mesuré sur le vrai code plutôt que déclaré. Un outil "lit" une source s'il en cite
// le chemin hors déclaration — heuristique assumée : c'est une mention, jamais une preuve de
// lecture effective. Déclarée comme telle dans l'avertissement de fiabilité.
export function mapReaders({ root = ROOT, readFileImpl = readFileSync, sources, scripts } = {}) {
  const srcs = sources ?? listDataSources();
  const fichiers = scripts ?? scriptFiles(root);
  const lecteursPar = new Map(srcs.map((s) => [s.id, []]));
  const verifPar = new Map(srcs.map((s) => [s.id, []]));
  const sourcesPar = new Map();
  const illisibles = [];
  for (const f of fichiers) {
    let texte;
    try { texte = readFileImpl(join(root, f), "utf8"); } catch { illisibles.push(f); continue; }
    // On retire les commentaires : un chemin cité dans une explication n'est pas une lecture. Sans
    // ça, ce fichier-ci passerait pour le lecteur universel de tout le dépôt.
    const sansCommentaires = texte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    const code = stripExportedConstantBodies(sansCommentaires);
    const estVerification = FICHIERS_DE_VERIFICATION.includes(f);
    const lues = [];
    for (const s of srcs) {
      if (!code.includes(s.id)) continue;
      // Les deux natures de citation restent séparées jusqu'au bout : un lecteur de test ne compte
      // pas comme un lecteur, mais il n'est pas non plus effacé — il apparaît à part dans le
      // rapport, parce que « personne ne la lit sauf les tests » est une information utile.
      (estVerification ? verifPar.get(s.id) : lecteursPar.get(s.id)).push(f);
      if (!estVerification) lues.push(s.id);
    }
    sourcesPar.set(f, lues);
  }
  return { lecteursPar, verifPar, sourcesPar, illisibles, sources: srcs, scripts: fichiers };
}

// ————————————————————————————————————————————————————————————————————————
// PREMIER SENS — la donnée que personne ne relit
// ————————————————————————————————————————————————————————————————————————

// Le producteur ne compte JAMAIS comme lecteur de sa propre donnée : un outil qui relit ce qu'il
// vient d'écrire ne fait pas circuler l'information, il tient sa mémoire. Confondre les deux
// donnerait un paysage entièrement branché alors que rien ne circule.
export function findOrphanData(carte, { root = ROOT } = {}) {
  const orphelines = [];
  for (const s of carte.sources) {
    const lecteurs = (carte.lecteursPar.get(s.id) ?? []).filter((f) => f !== s.scriptPath);
    if (lecteurs.length) continue;
    // Une source jamais écrite n'est PAS une donnée orpheline : c'est une donnée qui n'existe pas
    // encore. La distinction compte — reprocher l'absence de lecteurs à un fichier vide serait
    // reprocher un silence à quelqu'un qui n'a rien dit.
    const chemin = join(root, s.id);
    const existe = existsSync(chemin);
    const testsSeuls = (carte.verifPar?.get(s.id) ?? []).length > 0;
    orphelines.push({
      ...s,
      lecteurs: [],
      existe,
      testsSeuls,
      etat: !existe
        ? "déclarée mais jamais écrite — rien à relire pour l'instant"
        : testsSeuls
          ? "écrite, et citée UNIQUEMENT par la suite de tests — vérifiée, jamais exploitée"
          : "écrite, jamais relue par un autre outil",
    });
  }
  return orphelines;
}

// ————————————————————————————————————————————————————————————————————————
// SECOND SENS — l'outil qui décide sans consulter ce qui était disponible
// ————————————————————————————————————————————————————————————————————————

// LE PRINCIPE, et pourquoi ce n'est PAS une table d'affinités écrite à la main (Article 24) : on ne
// décrète nulle part que tel outil "devrait" lire telle donnée — ce serait une opinion figée qui se
// périmerait au premier outil suivant. On regarde ce que le paysage fait DÉJÀ : si deux outils
// lisent largement les mêmes sources, ils travaillent sur le même terrain, et une source que l'un
// consulte et l'autre pas devient un candidat sérieux.
//
// Ce que ça produit est une SUGGESTION, jamais un manquement — d'où le vocabulaire (« pourrait
// gagner à »), et d'où le seuil : en dessous de deux sources communes, la ressemblance ne veut rien
// dire et ne doit rien suggérer.
export function suggestMissingConnections(carte, { minCommun = 2, maxParOutil = 3 } = {}) {
  const suggestions = [];
  const entrees = [...carte.sourcesPar.entries()].filter(([, lues]) => lues.length > 0);
  for (const [outil, lues] of entrees) {
    const miennes = new Set(lues);
    const candidats = new Map();
    for (const [autre, sesLues] of entrees) {
      if (autre === outil) continue;
      const commun = sesLues.filter((s) => miennes.has(s)).length;
      if (commun < minCommun) continue;
      for (const s of sesLues) {
        if (miennes.has(s)) continue;
        const dejaVu = candidats.get(s) ?? { source: s, appuis: [], force: 0 };
        dejaVu.appuis.push(autre);
        // La force d'une suggestion, c'est le nombre de sources en commun avec l'outil qui la
        // porte : un voisin qui partage 6 sources pèse plus qu'un qui en partage 2.
        dejaVu.force = Math.max(dejaVu.force, commun);
        candidats.set(s, dejaVu);
      }
    }
    const retenus = [...candidats.values()]
      .filter((c) => c.appuis.length >= 2)
      .sort((a, b) => b.force - a.force || b.appuis.length - a.appuis.length)
      .slice(0, maxParOutil);
    if (retenus.length) suggestions.push({ outil, manquantes: retenus });
  }
  return suggestions.sort((a, b) => b.manquantes[0].force - a.manquantes[0].force);
}

// ————————————————————————————————————————————————————————————————————————
// MON PROPRE ACCÈS — la partie que l'utilisateur a explicitement mise en avant
// ————————————————————————————————————————————————————————————————————————

// « Assure-toi que tu puises bien dans toute la data pour aider à construire ce projet. » Le
// problème réel, de mon côté, n'a jamais été l'autorisation : c'est qu'il faut SAVOIR qu'un fichier
// existe pour aller le lire. Rien ne me présente spontanément ce que l'équipe a accumulé, donc je
// lis ce dont je me souviens — c'est-à-dire ce que j'ai touché récemment, et rien d'autre.
export function agentDataBriefing(carte, { root = ROOT, now = Date.now() } = {}) {
  const lignes = [];
  for (const s of carte.sources) {
    const chemin = join(root, s.id);
    let ageJours;
    try {
      const st = statSync(chemin);
      // Un dossier de registre : on date le plus récent fichier qu'il contient, jamais le dossier
      // lui-même, dont la date de modification ne dit rien de la fraîcheur du contenu.
      if (st.isDirectory()) {
        const dates = readdirSync(chemin).map((f) => { try { return statSync(join(chemin, f)).mtimeMs; } catch { return 0; } });
        const recent = Math.max(0, ...dates);
        ageJours = recent ? Math.floor((now - recent) / 86400000) : undefined;
      } else {
        ageJours = Math.floor((now - st.mtimeMs) / 86400000);
      }
    } catch { ageJours = undefined; }
    lignes.push({
      id: s.id,
      nature: s.nature,
      producteur: s.producteur,
      contenu: s.contenu,
      // `undefined` = jamais écrite, distinct de 0 = écrite aujourd'hui. Les afficher pareil
      // ferait passer une donnée inexistante pour une donnée toute fraîche.
      ageJours,
      lecteurs: (carte.lecteursPar.get(s.id) ?? []).filter((f) => f !== s.scriptPath).length,
    });
  }
  return lignes.sort((a, b) => (a.ageJours ?? 1e9) - (b.ageJours ?? 1e9));
}

// L'ALERTE RARE, celle qui a le droit de m'interrompre (calibrage : « une alerte uniquement quand
// une donnée devient VRAIMENT critique et ignorée »). Rare par construction : il faut qu'une donnée
// soit à la fois FRAÎCHE (quelqu'un vient de l'écrire, donc elle a quelque chose à dire) et SANS
// AUCUN LECTEUR. Une donnée ancienne et ignorée est une question d'hygiène, pas une urgence.
export function criticalIgnoredData(briefing, { seuilFraicheurJours = 2 } = {}) {
  return briefing.filter((l) => l.ageJours !== undefined && l.ageJours <= seuilFraicheurJours && l.lecteurs === 0);
}

// ————————————————————————————————————————————————————————————————————————
// LE RAPPORT
// ————————————————————————————————————————————————————————————————————————

// ————————————————————————————————————————————————————————————————————————
// LA DATA « TENDANCES » — sa circulation, et c'est le métier même de cet outil
// ————————————————————————————————————————————————————————————————————————
//
// Demandé le 2026-09-22 : « un outil existant devrait s'assurer que la data "tendances" produite
// est bien partagée et exploitée par tous les outils concernés, par toi et par moi ».
//
// POURQUOI CELUI-CI ET PAS UN NOUVEAU : data-archangel a été construit pour exactement ces deux
// questions, dans ces deux sens — une donnée produite que personne ne lit, et un outil qui devrait
// lire quelque chose et ne le lit pas —, plus l'accès de l'agent lui-même à ce que l'équipe sait.
// La data de tendance est une donnée comme une autre ; lui donner un surveillant à part aurait
// créé deux gardiens de la circulation qui divergeraient (§7ter).
//
// LE RISQUE PRÉCIS QUE CECI COUVRE, et il est plus grand que celui des données ordinaires : une
// série temporelle coûte à produire (un point à chaque passage, pendant des semaines) et ne rend
// rien tant que personne ne la lit. Une donnée orpheline ordinaire est un gâchis ponctuel ; une
// SÉRIE orpheline est un gâchis qui se répète à chaque Ronde, et dont la valeur perdue grandit
// avec le temps — c'est le pire rapport coût/retour possible.
export const NATURE_TENDANCE = "série temporelle (historique, évolutions, tendances)";

// Qui DEVRAIT lire les tendances, et de quoi. Déclaré plutôt que deviné, avec le garde-fou
// mécanique qui va avec (Article 24) : l'appartenance d'un outil à cette table est un jugement,
// mais l'existence du fichier de série, elle, se vérifie.
export const CONSOMMATEURS_DE_TENDANCE = [
  { outil: "cassandra-rh", script: "scripts/cassandra-rh.mjs", pourquoi: "gardienne des objectifs et des KPI : un objectif se juge sur une trajectoire, jamais sur un point" },
  { outil: "objectifs-vs-resultats", script: "scripts/objectifs-vs-resultats.mjs", pourquoi: "un objectif raté trois fois de suite n'est pas le même problème qu'un objectif raté une fois" },
  { outil: "kpi-report", script: "scripts/kpi-report.mjs", pourquoi: "c'est le tableau de bord : montrer un chiffre sans sa pente, c'est montrer la moitié de l'information" },
  { outil: "clean-dirty-old", script: "scripts/clean-dirty-old.mjs", pourquoi: "la stagnation EST une tendance — il la déduit aujourd'hui de dates de fichiers, jamais d'une série" },
  { outil: "angel-of-ia-process", script: "scripts/angel-of-ia-process.mjs", pourquoi: "l'évaluation de l'utilisateur se lit en trajectoire, c'est sa demande explicite du 2026-09-22" },
  { outil: "smart-conso-token", script: "scripts/smart-conso-token.mjs", pourquoi: "un rythme de consommation ne se juge que dans la durée" },
  // 2026-09-22 — les deux derniers arrivés, absents de ce registre par simple antériorité : il a été
  // écrit avant leur naissance et rien ne l'a rouvert à leur arrivée. C'est exactement le diagnostic
  // de l'Article 24 pris sur le fait : les sept registres d'intégration ont chacun réclamé leur
  // inscription en échouant, celui-ci n'a rien réclamé du tout — parce qu'aucun test ne dit ce qui
  // DEVRAIT consommer une tendance, seulement ce qui est déclaré la consommer. Un registre qui ne
  // sait pas qu'il lui manque quelqu'un est muet, pas vert.
  { outil: "safe-export", script: "scripts/safe-export.mjs", pourquoi: "l'exportabilité n'a aucun sens en instantané : 4 fuites aujourd'hui est un chiffre creux tant qu'on ne sait pas si on en réparait 10 le mois dernier ou 1" },
  { outil: "tool-learning", script: "scripts/tool-learning.mjs", pourquoi: "il juge des TRAJECTOIRES par définition (c'est sa frontière déclarée avec CASSANDRA) — un outil qui juge des pentes sans tenir de série se jugerait lui-même immobile" },
];

// findTendancesOrphelines() — une série produite et lue par personne. Le sens 1 du métier de cet
// outil, appliqué aux séries.
export function findTendancesOrphelines(carte, { consommateurs = CONSOMMATEURS_DE_TENDANCE, root = ROOT, readFileImpl = readFileSync, exists = existsSync } = {}) {
  const orphelines = [];
  for (const c of consommateurs) {
    const chemin = join(root, `docs/${c.outil}/serie.json`);
    if (!exists(chemin)) continue;
    // Lue par quelqu'un ? On cherche une vraie référence à la série dans le code des autres outils,
    // jamais une supposition tirée du fait qu'elle existe.
    let lecteurs = 0;
    for (const autre of consommateurs) {
      if (autre.outil === c.outil) continue;
      try {
        const code = readFileImpl(join(root, autre.script), "utf8");
        if (code.includes(c.outil) && /serie|tendance|Tendance/.test(code)) lecteurs++;
      } catch { /* script illisible : compté comme non-lecteur, jamais comme lecteur */ }
    }
    if (lecteurs === 0) orphelines.push({ outil: c.outil, chemin: `docs/${c.outil}/serie.json`, pourquoi: "série produite à chaque passage et relue par aucun autre outil — un gâchis qui se répète, jamais ponctuel" });
  }
  return orphelines;
}

// findOutilsPrivesDeTendance() — le sens 2 : un outil qui DEVRAIT exploiter une tendance et ne
// connaît même pas le mécanisme. Se vérifie sur le code réel (importe-t-il serie-temporelle ?),
// jamais sur une intention déclarée en commentaire.
export function findOutilsPrivesDeTendance({ consommateurs = CONSOMMATEURS_DE_TENDANCE, root = ROOT, readFileImpl = readFileSync } = {}) {
  const prives = [];
  for (const c of consommateurs) {
    let code;
    try { code = readFileImpl(join(root, c.script), "utf8"); } catch { continue; }
    if (!code.includes("serie-temporelle")) prives.push({ outil: c.outil, pourquoi: c.pourquoi });
  }
  return prives;
}

// tendanceBriefing() — le troisième sens, celui que l'utilisateur a ajouté en disant « par toi et
// par moi » : ni l'agent ni lui ne peuvent exploiter une tendance qu'on ne leur montre pas. Rend la
// liste des séries réellement disponibles, avec leur nombre de points — donc ce qui est déjà
// exploitable et ce qui est encore trop jeune pour dire quoi que ce soit.
export function tendanceBriefing({ consommateurs = CONSOMMATEURS_DE_TENDANCE, root = ROOT, readFileImpl = readFileSync, exists = existsSync, minPoints = 4 } = {}) {
  return consommateurs.map((c) => {
    const rel = `docs/${c.outil}/serie.json`;
    if (!exists(join(root, rel))) return { outil: c.outil, etat: "aucune série", points: 0, exploitable: false };
    try {
      const pts = JSON.parse(readFileImpl(join(root, rel), "utf8"));
      const n = Array.isArray(pts) ? pts.length : 0;
      // « Trop jeune » et « absente » sont deux états distincts, jamais fondus : l'un se corrige en
      // attendant, l'autre en câblant. Les confondre ferait attendre une série qui n'arrivera jamais.
      return { outil: c.outil, etat: n >= minPoints ? "exploitable" : "trop jeune pour une tendance", points: n, exploitable: n >= minPoints };
    } catch {
      return { outil: c.outil, etat: "série illisible", points: 0, exploitable: false };
    }
  });
}

export function buildDataArchangelReport({ root = ROOT, readFileImpl = readFileSync, now = Date.now() } = {}) {
  const carte = mapReaders({ root, readFileImpl });
  const orphelines = findOrphanData(carte, { root });
  const suggestions = suggestMissingConnections(carte);
  const briefing = agentDataBriefing(carte, { root, now });
  const critiques = criticalIgnoredData(briefing);
  const branchees = carte.sources.length - orphelines.length;
  return {
    carte,
    orphelines,
    suggestions,
    briefing,
    critiques,
    total: carte.sources.length,
    branchees,
    // Le pourcentage porte sur les sources réellement inventoriées, jamais sur un total supposé.
    pourcentage: carte.sources.length ? Math.round((branchees / carte.sources.length) * 100) : undefined,
  };
}

export function formatDataArchangelReport(r) {
  const l = [];
  l.push(`Sources de données inventoriées : ${r.total} — ${r.branchees} réellement relues par un autre outil (${r.pourcentage} %).`);
  if (r.critiques.length) {
    l.push("", `🚨 ${r.critiques.length} donnée(s) FRAÎCHE(S) que personne ne lit — écrite il y a peu, donc elle a quelque chose à dire, et aucun outil ne l'écoute :`);
    for (const c of r.critiques) l.push(`  · ${c.id} (${c.producteur}, ${c.ageJours} j) — ${c.contenu}`);
  }
  const jamaisEcrites = r.orphelines.filter((o) => !o.existe);
  const dejaAlertees = new Set(r.critiques.map((c) => c.id));
  // Jamais deux fois la même ligne : les fraîches-et-ignorées sont déjà nommées au-dessus, les
  // répéter ici gonflerait le rapport sans rien ajouter — et un rapport qu'on survole ne sert plus.
  const ecritesIgnorees = r.orphelines.filter((o) => o.existe && !dejaAlertees.has(o.id));
  if (ecritesIgnorees.length) {
    l.push("", `${ecritesIgnorees.length} autre(s) donnée(s) écrite(s) que seul leur producteur relit :`);
    for (const o of ecritesIgnorees) l.push(`  · [${o.nature}] ${o.id} — ${o.producteur} : ${o.contenu}${o.testsSeuls ? " (citée uniquement par la suite de tests)" : ""}`);
  }
  if (jamaisEcrites.length) {
    // État distinct, jamais mélangé au précédent : une donnée qui n'existe pas encore n'a pas de
    // lecteurs pour une raison parfaitement innocente.
    l.push("", `${jamaisEcrites.length} source(s) déclarée(s) mais jamais écrite(s) — rien à relire, jamais un reproche : ${jamaisEcrites.map((o) => o.id).join(", ")}`);
  }
  if (r.suggestions.length) {
    l.push("", `Branchements suggérés (${r.suggestions.length} outil(s)) — une suggestion, jamais un manquement :`);
    for (const s of r.suggestions.slice(0, 8)) {
      for (const m of s.manquantes) l.push(`  · ${s.outil} pourrait gagner à lire ${m.source} — ${m.appuis.length} outil(s) travaillant sur le même terrain le font déjà`);
    }
  }
  // LA NUANCE SANS LAQUELLE CE RAPPORT SE LIRAIT DE TRAVERS, et qui vaut pour la majorité des
  // orphelines trouvées : un registre écrit pour être relu PAR UN HUMAIN n'a aucun besoin d'un
  // lecteur-outil, et l'absence de lecteur n'y est donc pas une faute. Ce qu'aucun humain ne fera
  // jamais, en revanche, c'est comparer trente passages successifs pour en tirer une tendance — ça,
  // seul un outil le fait. La vraie question n'est donc pas « personne ne lit ce fichier ? » mais
  // « personne n'exploite la SÉRIE ? », et c'est à cette question-là que la liste ci-dessus répond.
  l.push("", "Comment lire ce qui précède : un registre destiné à l'œil humain n'a pas besoin d'un lecteur-outil. Ce qu'aucun humain ne fera jamais, c'est comparer trente passages pour en tirer une tendance — c'est cette exploitation-là qui manque, jamais forcément une lecture.");
  l.push("Méthode : « lire » se mesure à la citation du chemin dans le code, commentaires et déclarations retirés — une mention, jamais une preuve de lecture effective. Un catalogue qui DÉCLARE une source (doc-report) n'en est pas un lecteur, et la suite de tests qui la VÉRIFIE non plus.");
  return l.join("\n");
}

// MON ÉTAT DES LIEUX — la commande que j'appelle avant un gros travail, pour savoir ce que l'équipe
// sait déjà sur le sujet plutôt que de repartir de ce dont je me souviens.
export function formatAgentBriefing(r, { filtre } = {}) {
  const lignes = filtre
    ? r.briefing.filter((b) => `${b.id} ${b.producteur} ${b.contenu}`.toLowerCase().includes(filtre.toLowerCase()))
    : r.briefing;
  const l = [`Ce que l'Agence sait, et où ça vit${filtre ? ` — filtré sur « ${filtre} »` : ""} : ${lignes.length} source(s), de la plus fraîche à la plus ancienne.`, ""];
  for (const b of lignes) {
    const age = b.ageJours === undefined ? "jamais écrite" : b.ageJours === 0 ? "aujourd'hui" : `il y a ${b.ageJours} j`;
    l.push(`  [${b.nature}] ${b.id} — ${age} · ${b.lecteurs} lecteur(s) · ${b.producteur}`);
    l.push(`      ${b.contenu}`);
  }
  if (!lignes.length) l.push("  Aucune source ne correspond — jamais une preuve qu'il n'y a rien à savoir, seulement que ce filtre ne trouve rien.");
  return l.join("\n");
}

function main() {
  const sub = process.argv[2];
  printReportHeader({
    tool: "data-archangel",
    title: "data-archangel — circulation des données dans l'Agence Codex",
    subtitle: "Ce que l'équipe produit, qui le relit, et ce que l'agent lui-même n'exploite pas encore.",
    scriptPath: "scripts/data-archangel.mjs",
  });
  recordCliUsage("data-archangel");
  const r = buildDataArchangelReport();
  if (sub === "briefing") {
    console.log(formatAgentBriefing(r, { filtre: process.argv[3] }));
    return;
  }
  console.log(formatDataArchangelReport(r));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
