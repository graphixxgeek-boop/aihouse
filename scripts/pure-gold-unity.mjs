// PURE-GOLD-UNITY (2026-09-22, demande de l'utilisateur : « je veux un outil qui scan les scripts
// non unifiés »). Le gabarit unifié des rapports existe depuis le matin même (report-template.mjs :
// un seul contrat, deux rendus, un emplacement générique d'en-tête) et la liste des outils TENUS de
// l'appliquer existe aussi (toolsBoundByReportTemplate, doc-report.mjs). Ce qui manquait est le
// tiers manquant, et c'est tout l'objet de cet outil : vérifier qu'ils l'appliquent RÉELLEMENT.
//
// LA DISTINCTION QUI JUSTIFIE SON EXISTENCE : « devoir » et « faire » ne sont pas la même chose, et
// tout ce paysage d'outils existe parce que cette confusion revient sans arrêt. Une obligation
// inscrite dans un registre ressemble à une garantie ; elle n'en est une que le jour où quelque
// chose la vérifie. Première mesure réelle, le jour de sa construction : 11 outils sur 29 passaient
// par un rendu partagé, 18 non — l'obligation existait depuis le matin et n'avait rien changé.
//
// CE QU'IL NE FAIT JAMAIS : migrer un outil tout seul. Convertir un rapport, c'est réécrire du texte
// que quelqu'un lit — ça se fait à la main, en relisant le avant/après. Il signale, il mesure, il
// classe par difficulté ; la conversion reste un geste humain (décision de l'utilisateur, 2026-09-22 :
// « signaler et tout migrer maintenant, en verifiant bien le travail et en fiabilisant »).
//
// ANTI-DOUBLON (§7ter) : la liste des outils tenus vient de doc-report.mjs, jamais recopiée ici.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { toolsBoundByReportTemplate } from "./doc-report.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// Les trois façons dont un outil peut être en règle, de la meilleure à la plus faible. L'ordre
// compte : `buildReportFrame` est la seule qui garantit TOUT le gabarit (titre obligatoire, date,
// emplacement générique rempli depuis les registres partagés) ; `renderHtmlReport` y passe désormais
// aussi en interne, donc l'appeler suffit ; `renderTextReport` accepte encore un objet brut, qu'il
// convertit lui-même — correct, mais sans garantie que l'appelant ait pensé à passer son `tool`.
export const VOIES_CONFORMES = [
  { marqueur: /printReportHeader\s*\(/, voie: "en-tête partagé", note: 3 },
  { marqueur: /buildReportFrame\s*\(/, voie: "cadre complet", note: 3 },
  { marqueur: /renderHtmlReport\s*\(/, voie: "rendu HTML partagé", note: 3 },
  { marqueur: /renderTextReport\s*\(/, voie: "rendu texte partagé", note: 2 },
];

// Un outil qui écrit un rapport sans passer par aucune de ces voies l'écrit à la main. On mesure
// alors À QUEL POINT il est loin, pour que la migration commence par les cas les plus simples.
const INDICES_MANUELS = [
  { marqueur: /console\.log\(\s*[`'"]===/, indice: "écrit son propre titre en dur" },
  { marqueur: /new Date\(\)\.toISOString\(\)/, indice: "date sa sortie lui-même" },
  { marqueur: /printReliabilityNotice\s*\(/, indice: "imprime l'avertissement à part, hors du cadre" },
  { marqueur: /writeFileSync\s*\(/, indice: "écrit un fichier de rapport directement" },
];

export function auditToolUnity(scriptPath, { root = ROOT, readFileImpl = readFileSync } = {}) {
  let source;
  try {
    source = readFileImpl(join(root, scriptPath), "utf8");
  } catch {
    // Un fichier illisible n'est PAS un outil non conforme : c'est une mesure impossible, et la
    // confondre avec un manquement serait exactement l'erreur que ce paysage passe son temps à
    // corriger (une absence de mesure présentée comme une mesure).
    return { scriptPath, mesurable: false, raison: "fichier introuvable ou illisible" };
  }
  const voies = VOIES_CONFORMES.filter((v) => v.marqueur.test(source));
  const indices = INDICES_MANUELS.filter((i) => i.marqueur.test(source)).map((i) => i.indice);
  return {
    scriptPath,
    mesurable: true,
    conforme: voies.length > 0,
    voies: voies.map((v) => v.voie),
    note: voies.length ? Math.max(...voies.map((v) => v.note)) : 0,
    indicesManuels: indices,
    // Plus un outil a d'indices de rédaction manuelle, plus sa conversion demande d'attention.
    difficulte: voies.length ? "déjà conforme" : indices.length >= 3 ? "lourde" : indices.length === 2 ? "moyenne" : "légère",
  };
}

export function scanUnity({ root = ROOT, readFileImpl = readFileSync, tools } = {}) {
  const liste = tools ?? toolsBoundByReportTemplate();
  const resultats = liste.map((p) => auditToolUnity(p, { root, readFileImpl }));
  const mesurables = resultats.filter((r) => r.mesurable);
  const conformes = mesurables.filter((r) => r.conforme);
  return {
    total: liste.length,
    mesurables: mesurables.length,
    nonMesurables: resultats.filter((r) => !r.mesurable).map((r) => `${r.scriptPath} — ${r.raison}`),
    conformes: conformes.length,
    aMigrer: mesurables.filter((r) => !r.conforme),
    // Le pourcentage porte sur ce qui a pu être mesuré, jamais sur le total : un fichier illisible
    // ne compte ni comme conforme ni comme fautif.
    pourcentage: mesurables.length ? Math.round((conformes.length / mesurables.length) * 100) : undefined,
    resultats,
  };
}

// Par où commencer. Les conversions légères d'abord : elles se vérifient vite, et chacune réduit
// l'écart sans risquer d'abîmer un rapport que l'utilisateur lit vraiment.
export function migrationOrder(scan) {
  const rang = { légère: 0, moyenne: 1, lourde: 2 };
  return [...scan.aMigrer].sort((a, b) => (rang[a.difficulte] ?? 3) - (rang[b.difficulte] ?? 3) || a.scriptPath.localeCompare(b.scriptPath));
}

export function formatUnityReport(scan) {
  const lignes = [];
  lignes.push(`Outils tenus par le gabarit : ${scan.total}${scan.mesurables !== scan.total ? ` (${scan.mesurables} réellement mesurables)` : ""}`);
  lignes.push(`Conformes : ${scan.conformes}/${scan.mesurables}${scan.pourcentage !== undefined ? ` (${scan.pourcentage} %)` : ""}`);
  if (scan.nonMesurables.length) lignes.push(`⚠️ Non mesurables (${scan.nonMesurables.length}) : ${scan.nonMesurables.join(" ; ")}`);
  if (!scan.aMigrer.length) {
    lignes.push("✅ Tous les rapports mesurables passent par le gabarit partagé.");
    return lignes.join("\n");
  }
  lignes.push("", `À migrer (${scan.aMigrer.length}), des plus simples aux plus lourdes :`);
  for (const r of migrationOrder(scan)) {
    lignes.push(`  [${r.difficulte}] ${r.scriptPath}${r.indicesManuels.length ? ` — ${r.indicesManuels.join(", ")}` : " — aucun indice de rédaction manuelle trouvé (à vérifier à la main : produit-il vraiment un rapport ?)"}`);
  }
  lignes.push("", "La conversion reste un geste manuel : convertir un rapport, c'est réécrire du texte que quelqu'un lit.");
  return lignes.join("\n");
}

function main() {
  printReliabilityNotice("pure-gold-unity");
  recordCliUsage("pure-gold-unity");
  console.log("=== pure-gold-unity — unification réelle des rapports ===\n");
  console.log(formatUnityReport(scanUnity()));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
