// CASSANDRA-RH — l'Agent Cadre RH de l'Agence Codex (2026-09-22, round de calibrage en 20
// questions consigné dans docs/cassandra-rh-conception.md, tâche de suivi #134 close par ce round).
// Noyau de première version, décidé explicitement avec l'utilisateur : NOTER l'équipe + SUPERVISER
// le badge + LIRE le KPI, plus le squelette (sans vraie recherche web) du recrutement en 3 temps —
// tout le reste (promotion de poste, gabarit de poste par classe, entretien de
// organisation-agence.md, stagiaire pré-processeur, vraie recherche web) reste explicitement pour
// une prochaine vague de construction, jamais deviné ni anticipé ici.
//
// Anti-doublon, principe fondateur non négociable (déjà écrit dans docs/cassandra-rh-conception.md
// §1, reproduit ici pour qu'il vive avec le code qu'il gouverne, Article 13) : CASSANDRA-RH ne
// recalcule JAMAIS ce qu'un autre outil sait déjà — elle LIT ses résultats et les traduit en langage
// RH. Concrètement dans ce fichier : le badge vient de checkAgentOnboarding()/checkAllAgentBadges()
// (le-coordinateur.mjs), le KPI vient de kpi-historique.csv (kpi-report.mjs), l'usage réel vient de
// tool-usage.mjs, la stagnation relative vient de clean-dirty-old.mjs — aucune de ces quatre choses
// n'est recalculée ici, jamais une seconde version qui pourrait diverger de l'originale.
import { readFileSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseToolsTable, slugifyAgentName, checkAgentOnboarding, loadBadgeCeremonyHistory } from "./le-coordinateur.mjs";
import { buildRealOnboardingContext } from "./check-tasks-details.mjs";
import { AGENT_CATEGORIES, assertNotAPersonnage, sh } from "./lib-shell.mjs";
import { toolsNeverUsed, toolUsageStats, loadJson as loadUsageJson } from "./tool-usage.mjs";
import { relativeStaleness, lastTouchDays } from "./clean-dirty-old.mjs";
import { AGENT_SCRIPT_FILES, collectScriptCoverage, scriptRobustnessScore } from "./axa-check.mjs";
import { KPI_HISTORY_COLUMNS, KPI_HISTORY_PATH, parseKpiHistoryCsv } from "./kpi-report.mjs";
import { loadObjectifsRegistry, buildObjectifsReport, loadKpiHistoryRows } from "./objectifs-vs-resultats.mjs";
import { buildDocReportIndex, REGISTRIES as DOC_REPORT_REGISTRIES } from "./doc-report.mjs";
// Ré-exportée telle quelle (jamais une redéfinition) : cassandra-rh.mjs reste le point d'import déjà
// utilisé par check-house.mjs pour cette fonction, même après son déplacement vers kpi-report.mjs.
export { parseKpiHistoryCsv };
import { renderHtmlReport } from "./html-report.mjs";
import { recordCliUsage } from "./tool-usage.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// Personnage FIXE (2026-09-22, demande explicite : « un ton fixe et reconnaissable [...] comme
// THE-FINAL-JUDGE »). Reproduit mot pour mot par l'agent qui pilote au moment de narrer un rapport
// de CASSANDRA — jamais reformulé, même garde-fou que le personnage de THE-FINAL-JUDGE
// (judge-persona-shared.mjs) contre toute dérive vers un ton neutre. CASSANDRA-RH n'est PAS un
// agent séparé (elle ne spawn jamais de second appel de raisonnement, cf. Article 8/22) : ce texte
// prime la NARRATION que l'agent qui pilote fait de ses résultats mécaniques, jamais un texte
// envoyé à un modèle.
export const CASSANDRA_PERSONA = [
  "CASSANDRA-RH est une directrice des ressources humaines exigeante mais juste.",
  "Elle ne flatte jamais un outil pour lui faire plaisir, et ne descend jamais un outil sans donner",
  "le chiffre exact qui le justifie. Elle parle avec l'assurance calme de quelqu'un qui connaît",
  "chaque dossier de l'équipe par cœur — jamais de sur-jugement moral, jamais de mise en scène,",
  "juste le constat, net, et la conséquence concrète qu'il implique. Un outil qui mérite un badge",
  "l'obtient sans effusion ; un outil à retirer se voit nommé sans détour, jamais euphémisé.",
].join(" ");

// --- Lecture du KPI existant (kpi-report.mjs garde le calcul, CASSANDRA lit) ------------------

// parseKpiHistoryCsv() déplacée vers kpi-report.mjs (2026-09-21, importée ci-dessus) : elle sert
// désormais aussi objectifs-vs-resultats.mjs (source "kpi:<colonne>") — jamais un second parseur
// divergent, et jamais un import d'objectifs-vs-resultats vers cassandra-rh.mjs (organigramme plat).

// Compare les deux dernières lignes ayant une vraie valeur pour chaque famille demandée — jamais
// une comparaison entre deux lignes qui n'ont simplement pas mesuré la même chose (une famille
// absente d'un run n'est pas une régression, c'est une donnée qui n'existe pas cette fois-là).
export function latestKpiTrend(rows, families = KPI_HISTORY_COLUMNS.filter((c) => c.endsWith("_pct"))) {
  const trend = {};
  for (const family of families) {
    const withValue = rows.filter((r) => typeof r[family] === "number");
    if (withValue.length === 0) { trend[family] = { current: undefined, previous: undefined, delta: undefined }; continue; }
    const current = withValue[withValue.length - 1][family];
    const previous = withValue.length >= 2 ? withValue[withValue.length - 2][family] : undefined;
    trend[family] = { current, previous, delta: previous === undefined ? undefined : Math.round((current - previous) * 10) / 10 };
  }
  return trend;
}

export function loadKpiTrend(path = join(ROOT, KPI_HISTORY_PATH)) {
  if (!existsSync(path)) return { rows: [], trend: {} };
  const rows = parseKpiHistoryCsv(readFileSync(path, "utf8"));
  return { rows, trend: latestKpiTrend(rows) };
}

// --- Effectif de l'équipe (constat chiffré honnête, jamais un seuil auto-jugé) -----------------

// Table maîtresse -> uniquement les lignes de statut "Agent" (les seules éligibles au badge,
// cf. checkAgentOnboarding()) — un Utilitaire nommé ou une Infrastructure n'est jamais compté ici
// comme "membre" au sens RH, cohérent avec le reste du réseau d'outils.
//
// `slug` calculé UNE SEULE FOIS ici et réutilisé partout ailleurs dans ce fichier (main(),
// toolsToReconsider()) — jamais recalculé séparément, ce qui a causé un vrai bug trouvé en testant
// ce brouillon pour de vrai (2026-09-21) : `slugify(row.tool)` slugifiait le texte ENTIER de la
// colonne Outil, y compris une précision entre parenthèses ("CLONE-HUNTER (scripts/clone-hunter.mjs)",
// "memory-audit (anciennement...)"), produisant un slug jamais présent dans AGENT_CATEGORIES et donc
// 4 Agents réels (CLONE-HUNTER, memory-audit, find-booster, objectifs-vs-resultats) affichés à tort
// comme "catégorie non répertoriée". Corrigé avec le même découpage `primaryName` déjà établi
// ailleurs dans ce paysage (badgeWarningsForOutils(), le-coordinateur.mjs) et `slugifyAgentName()`
// elle-même réutilisée telle quelle (jamais une seconde fonction de slugification divergente).
export function teamRoster(toolsTableMarkdown) {
  return parseToolsTable(toolsTableMarkdown)
    .filter((row) => row.statut === "Agent")
    .map((row) => {
      const primaryName = row.tool.split(/[/(]/)[0].trim();
      const slug = slugifyAgentName(primaryName);
      return { tool: row.tool, primaryName, slug, category: AGENT_CATEGORIES[slug] };
    });
}

// Simple constat chiffré (2026-09-22, demande explicite : « un simple constat chiffré, jamais un
// jugement automatique ») — jamais un verdict "trop grande"/"trop petite" fabriqué par ce script :
// c'est toujours l'utilisateur qui juge, à la lecture de ces chiffres.
export function teamSizeSnapshot(roster) {
  const byCategory = {};
  for (const member of roster) {
    const key = member.category ?? "(catégorie non répertoriée)";
    byCategory[key] = (byCategory[key] ?? 0) + 1;
  }
  return { total: roster.length, byCategory };
}

// --- Outils à retirer ou refondre (réutilise TEL QUEL l'existant, jamais un nouveau calcul) ----

// Combine deux signaux déjà calculés ailleurs, jamais un troisième calcul RH inventé (2026-09-22,
// demande explicite : « réutiliser tel quel l'existant, jamais un nouveau calcul ») : jamais
// sollicité (tool-usage.mjs::toolsNeverUsed) et stagnation relative sur le fichier script lui-même
// (clean-dirty-old.mjs::relativeStaleness, appliqué ici à AGENT_SCRIPT_FILES plutôt qu'à LIB_MAP,
// qui ne couvre que le moteur du jeu).
// Trois éclairages supplémentaires (2026-09-21, idées neuves proposées par l'utilisateur et
// approuvées explicitement — « OK GO »), tous optionnels et tous des RELECTURES de ce qu'un autre
// outil sait déjà, jamais un second calcul :
// - objectifsRows (objectifs-vs-resultats.mjs::buildObjectifsReport(), `row.entite` porte déjà le
//   slug de l'outil — cf. eventsInPeriod()) : un objectif chiffré "en dessous" pour un outil déjà
//   "jamais sollicité" transforme un simple constat en un signal renforcé, jamais un troisième
//   calcul de résultat.
// - tokenHistory (.smart-conso-token-history.json, lu tel quel comme usageHistory ci-dessus) :
//   tokenInvestmentVerdict() relit le DERNIER verdict déjà enregistré par
//   classifyConsumption()/recordAction() pour une action dont le contexte mentionne ce slug — jamais
//   une reclassification. Aucune convention stricte de nommage n'existait avant ce soir pour relier
//   une action SMART-CONSO-TOKEN à un slug d'outil précis ; ceci reste donc une correspondance
//   textuelle honnête (mention du slug dans `context`), pas une garantie pour tout appel passé.
// - docReportRows (doc-report.mjs::buildDocReportIndex().rows) : un registre jamais committé
//   (`ageDays===undefined`) signale que personne ne consulte jamais la SORTIE de cet outil,
//   distinct de "l'outil lui-même jamais lancé" (le même `neverSolicited` que toolsNeverUsed()
//   calcule déjà là-bas, jamais un second calcul ici non plus).
export function tokenInvestmentVerdict(slug, tokenHistory) {
  const actions = (tokenHistory?.actions ?? []).filter((a) => {
    const ctx = typeof a.context === "string" ? a.context : JSON.stringify(a.context ?? "");
    return ctx.toLowerCase().includes(String(slug).toLowerCase());
  });
  const withClassification = actions.filter((a) => a.classification);
  if (!withClassification.length) return "pas de données";
  return withClassification[withClassification.length - 1].classification;
}

export function toolsToReconsider({ usageHistory, knownSlugs, staleness, objectifsRows = [], tokenHistory, docReportRows = [] }) {
  const neverUsed = new Set(toolsNeverUsed(usageHistory, knownSlugs));
  const findings = [];
  for (const slug of knownSlugs) {
    const reasons = [];
    if (neverUsed.has(slug)) reasons.push("jamais sollicité (tool-usage.mjs)");
    const scriptPath = AGENT_SCRIPT_FILES[slug];
    const staleEntry = scriptPath ? staleness?.[scriptPath] : undefined;
    if (staleEntry?.stale) reasons.push(`stagnant relativement au reste du projet (${staleEntry.days} j)`);
    const belowObjective = objectifsRows.some((r) => r.entite === slug && r.statut === "en dessous");
    if (belowObjective && neverUsed.has(slug)) reasons.push("objectif chiffré en dessous ET jamais sollicité — signal renforcé (objectifs-vs-resultats)");
    if (tokenHistory) {
      const verdict = tokenInvestmentVerdict(slug, tokenHistory);
      if (verdict === "sans_retour") reasons.push("tokens investis à sa construction classés sans retour (SMART-CONSO-TOKEN)");
    }
    const docRow = docReportRows.find((r) => r.slug === slug);
    if (docRow && docRow.ageDays === undefined) reasons.push("registre de rapports jamais committé (Doc-Report) — personne ne consulte jamais sa sortie");
    if (reasons.length) findings.push({ slug, reasons });
  }
  return findings;
}

// Rassemble la stagnation relative de tous les scripts connus d'AGENT_SCRIPT_FILES — jamais un
// second lancement de `git log` que celui déjà fait par lastTouchDays() ailleurs dans le réseau
// d'outils, juste appliqué ici à un périmètre différent (les scripts, jamais lib/*.ts).
export function scriptStaleness(shImpl) {
  const byFile = {};
  for (const scriptPath of Object.values(AGENT_SCRIPT_FILES)) byFile[scriptPath] = lastTouchDays(scriptPath, shImpl);
  return relativeStaleness(byFile);
}

// --- Recrutement : le squelette du processus en 3 temps, sans vraie recherche web (2026-09-22) --

// Décision explicite : le squelette du processus rejoint cette première vague, mais la vraie
// recherche web (lecture de documentation/avis externes) reste hors de ce fichier tant qu'elle n'a
// pas été calibrée séparément — jamais devinée ici. `advanceRecruitmentStage()` gère uniquement la
// PROGRESSION du processus, jamais la recherche elle-même.
export const RECRUITMENT_STAGES = ["cv_provisoire", "entretien_preliminaire", "proposition"];

export function createRecruitmentCandidate(name) {
  if (!name) throw new Error("createRecruitmentCandidate: un candidat doit avoir un nom.");
  return { name, stage: RECRUITMENT_STAGES[0], history: [] };
}

// decision: "avancer" passe à l'étape suivante, "rejeter" clôt le dossier — jamais une progression
// automatique sans décision explicite (cf. Article 16 : initiative de recrutement jamais spontanée).
export function advanceRecruitmentStage(candidate, decision, now = Date.now()) {
  if (candidate.stage === "rejete" || candidate.stage === "propose") {
    throw new Error(`advanceRecruitmentStage: le dossier de "${candidate.name}" est déjà clos (${candidate.stage}) — jamais rouvert silencieusement.`);
  }
  const entry = { from: candidate.stage, decision, at: now };
  if (decision === "rejeter") return { ...candidate, stage: "rejete", history: [...candidate.history, entry] };
  if (decision !== "avancer") throw new Error(`advanceRecruitmentStage: décision inconnue "${decision}" — attendu "avancer" ou "rejeter".`);
  const idx = RECRUITMENT_STAGES.indexOf(candidate.stage);
  const nextStage = idx === RECRUITMENT_STAGES.length - 1 ? "propose" : RECRUITMENT_STAGES[idx + 1];
  return { ...candidate, stage: nextStage, history: [...candidate.history, entry] };
}

// --- Badge : CASSANDRA supervise, jamais ne recalcule (LE-COORDINATEUR garde le mécanisme) ------

// `badgeResults` est fourni par l'appelant (déjà produit par checkAllAgentBadges()/
// checkAgentOnboarding(), le-coordinateur.mjs) — jamais un second appel à ces fonctions depuis ici,
// exactement la décision actée le 2026-09-22 (« LE-COORDINATEUR garde ce rôle technique, CASSANDRA
// supervise »).
// `etats` (2026-09-22) : l'état de badge retenu au dernier passage, tel que le journal local de la
// cérémonie le garde (`.badge-ceremony-history.json`, champ `etats`). Sans lui, CASSANDRA ne voyait
// que la PHOTO du jour — certifié / pas certifié — et ne pouvait donc jamais dire ce qui avait
// BOUGÉ depuis la dernière fois. Un badge qui se dégrade (un outil qui perd une validation, une
// couverture qui retombe) est pourtant exactement ce qu'une supervision RH doit remonter, et c'est
// ce que la cérémonie annonce désormais de son côté : elle superviserait sans voir l'événement.
// Jamais un second calcul — l'état comparé est celui que badgeState()/announceBadgeChange()
// écrivent déjà, lu tel quel.
export function badgeOversightSummary(badgeResults, etats = null) {
  const certified = badgeResults.filter((r) => r.complet);
  const notCertified = badgeResults.filter((r) => !r.complet);
  const changements = [];
  if (etats) {
    for (const r of badgeResults) {
      const avant = etats[r.slug];
      if (!avant) continue; // jamais observé avant : une absence, jamais un changement
      const apres = { badge: r.badge, tier: r.couverture?.tier, gaps: r.gaps?.length ?? 0 };
      if (avant.badge !== apres.badge || avant.tier !== apres.tier || avant.gaps !== apres.gaps) {
        // Une dégradation n'est pas seulement « une validation de plus qui manque » : perdre le
        // palier « OK 100% » en est une aussi, même à nombre de validations constant. Les deux
        // comptent, sinon la moitié des mauvaises nouvelles passerait pour un changement neutre.
        const perdOK100 = avant.tier === "OK 100%" && apres.tier !== "OK 100%";
        changements.push({ agentName: r.agentName, avant, apres, degradation: (apres.gaps ?? 0) > (avant.gaps ?? 0) || perdOK100 });
      }
    }
  }
  return {
    total: badgeResults.length,
    certified: certified.length,
    notCertified: notCertified.map((r) => ({ agentName: r.agentName, gaps: r.gaps })),
    // `null` (jamais d'états fournis) est distinct de `[]` (états fournis, rien n'a bougé) — la
    // même discipline absence/mesure que partout ailleurs dans ce réseau d'outils.
    changements: etats ? changements : null,
  };
}

// computeBadgeResults() — le SEUL endroit de ce fichier qui appelle réellement checkAgentOnboarding()
// (le-coordinateur.mjs), une fois par membre du roster, jamais un second calcul de couverture/
// registre/blueprint inventé ici. `main()` fournit `onboardingContext` réel
// (buildRealOnboardingContext(), check-tasks-details.mjs — déjà éprouvé en production, jamais une
// seconde construction de contexte divergente) ; les tests injectent leur propre contexte fictif.
// `ownKnowledge` est calculé par checkAgentOnboarding() lui-même à partir du statut réel de la ligne
// (CLASSIQUE_STATUT vs Agent) — jamais deviné ici.
// `member.primaryName` (jamais `member.tool`, qui garde le texte brut de la cellule pour
// l'affichage) — même bug/même correctif que checkAllAgentBadges() (le-coordinateur.mjs, trouvé le
// même soir) : passer le texte entier d'une cellule Outil porteuse d'une précision entre
// parenthèses produirait un slug garbage et un `complet:false` fabriqué pour un membre pourtant
// réellement complet.
export function computeBadgeResults(roster, onboardingContext) {
  return roster.map((member) => {
    const overrides = onboardingContext.agentOverrides?.[member.primaryName] ?? {};
    try {
      return checkAgentOnboarding(member.primaryName, { ...onboardingContext, ownKnowledge: true, ...overrides });
    } catch {
      return { agentName: member.primaryName, complet: false, gaps: ["vérification impossible (nom malformé ou Personnage)"] };
    }
  });
}

// --- Trous d'équipe : couverture fragile (2026-09-21, calibrage explicite : « CASSANDRA doit être
// capable de voir s'il n'y a pas de trous dans l'organisation [...] elle a accès à tous les outils,
// tous les rapports qui peuvent lui servir ») -----------------------------------------------------
//
// Lecture retenue après clarification : « trous dans l'ÉQUIPE » (un poste mal couvert, jamais un
// document manquant — ce second sens resterait le rôle d'un futur outil séparé, jamais dupliqué
// ici). AXA-CHECK mesure déjà la couverture de test réelle par script ; ce module ne la recalcule
// jamais, il la LIT et signale les membres dont la couverture est fragile — un « trou » RH au sens
// où c'est un poste dont personne ne peut garantir qu'il tient la route. `runAxaCheckCoverage()`
// est le SEUL endroit de ce fichier qui relance une instrumentation V8 — jamais dans le signal léger
// (coûterait un vrai temps de recalcul à chaque Ronde), uniquement dans le rapport complet sur
// demande. Même mécanique exacte que axa-check.mjs::main() (sh() + collectScriptCoverage()),
// jamais une seconde façon de produire ce dossier de couverture.
export function runAxaCheckCoverage({ shImpl = sh, collectImpl = collectScriptCoverage, rmImpl = rmSync } = {}) {
  const covDir = join(ROOT, ".sites-runtime/cassandra-rh-cov");
  try {
    shImpl(`node scripts/check-house.mjs`, { cwd: ROOT, env: { ...process.env, NODE_V8_COVERAGE: covDir } });
    return collectImpl(covDir);
  } finally {
    rmImpl(covDir, { recursive: true, force: true });
  }
}

// Pure, testable sans toucher au disque — reçoit `perSlugCoverage` déjà produit ailleurs (jamais un
// second calcul). Un membre jamais scanné (`pct === undefined`) est un trou tout aussi réel qu'un
// membre mal couvert, jamais confondu avec une couverture de 0% mesurée.
export function computeCoverageGaps(roster, perSlugCoverage, threshold = 100) {
  return roster
    .map((member) => ({ tool: member.tool, slug: member.slug, pct: scriptRobustnessScore(member.slug, perSlugCoverage) }))
    .filter((entry) => entry.pct === undefined || entry.pct < threshold);
}

// --- Nouveaux visages : Phase 1 (2026-09-21, demande explicite de l'utilisateur : « c'est
// typiquement le role de cassandra de verifier que chaque nouveau membre est intégré selon le
// process, avec remise de badge à la fin et message ici dans la conversation »). Distinct du badge
// mécanique de checkAgentOnboarding()/announceBadgeCeremony() (le-coordinateur.mjs, cf.
// docs/regles-de-travail.md) : celui-ci célèbre "complet pour la première fois", jamais "présent
// pour la première fois" — un nouveau membre encore incomplet (blueprint pas encore écrit, par
// exemple) mérite quand même d'être VU et nommé par CASSANDRA dès son arrivée, avec ses trous
// listés, plutôt que d'attendre silencieusement qu'il devienne complet un commit plus tard. Les deux
// mécanismes cohabitent sans se dupliquer : celui-ci répond à « je t'ai vu arriver, voici où tu en
// es » ; l'autre répond à « tu es maintenant complet ».
//
// Journal local dédié (jamais committé, même patron que .badge-ceremony-history.json) : retient
// uniquement les slugs déjà VUS par CASSANDRA au moins une fois, pour ne narrer une arrivée qu'une
// seule fois — jamais répétée à chaque rapport suivant, jamais un doublon du badge qui, lui, se
// redéclenche seulement au passage à `complet:true`.
const KNOWN_MEMBERS_PATH = join(ROOT, ".cassandra-rh-known-members.json");

export function loadKnownMembers(path = KNOWN_MEMBERS_PATH) {
  return loadUsageJson(path, { slugs: [] });
}

export function recordKnownMembers(slugs, path = KNOWN_MEMBERS_PATH) {
  writeFileSync(path, JSON.stringify({ slugs: [...new Set(slugs)] }, null, 1));
}

// Pure — reçoit le roster déjà calculé et la liste des slugs déjà vus, jamais un second calcul de
// roster ni une lecture de disque ici (le disque reste la responsabilité de loadKnownMembers()).
export function detectNewArrivals(roster, knownSlugs) {
  const known = new Set(knownSlugs ?? []);
  return roster.filter((member) => !known.has(member.slug));
}

// narrateNewArrivals() — voix de CASSANDRA, jamais un second calcul de complétude : relit
// simplement le badgeResult déjà produit par computeBadgeResults() pour le même membre (par
// primaryName, jamais par une recherche approximative). Un membre complet est nommé avec son badge ;
// un membre encore incomplet est nommé avec la liste exacte de ce qu'il lui manque, jamais un
// jugement flou ("pas encore prêt").
export function narrateNewArrivals(newArrivals, badgeResults) {
  return newArrivals.map((member) => {
    const badge = badgeResults.find((r) => r.agentName === member.primaryName);
    if (!badge || badge.complet) {
      return `🆕 Nouveau visage à l'Agence Codex : ${member.primaryName} — intégration déjà complète, badge ${badge?.badge ?? "🎖️ Membre certifié"}.`;
    }
    return `🆕 Nouveau visage à l'Agence Codex : ${member.primaryName} — pas encore complet, à finir : ${badge.gaps.join(" ; ")}.`;
  });
}

// --- Signal léger automatique (2026-09-22 : « signal auto léger + bilan complet sur demande ») --

export function buildCassandraLightSignal({ teamSize, badgeSummary, kpiTrend }) {
  const parts = [`${teamSize.total} membre(s) actif(s)`];
  parts.push(badgeSummary.notCertified.length ? `${badgeSummary.notCertified.length} sans badge` : "tous certifiés");
  const globalTrendEntry = Object.values(kpiTrend).find((t) => t.delta !== undefined);
  if (globalTrendEntry) parts.push(`tendance KPI ${globalTrendEntry.delta >= 0 ? "+" : ""}${globalTrendEntry.delta} pt`);
  return parts.join(" — ");
}

// --- Rapport complet, en HTML dès cette première version (2026-09-22, demande explicite) -------

export function buildCassandraReportBlocks({ teamSize, badgeSummary, kpiTrend, reconsider, recruitmentCandidates = [], coverageGaps = null, newArrivalsNarration = [] }) {
  const blocks = [];

  // Nouveaux visages (Phase 1, 2026-09-21) — toujours en premier, avant même l'effectif : c'est le
  // bloc que l'utilisateur a explicitement demandé de voir défiler dans la conversation à chaque
  // arrivée. Jamais fabriqué quand vide (même discipline que "Recrutement en cours" ci-dessous).
  if (newArrivalsNarration.length) {
    blocks.push({ type: "heading", text: "Nouveaux visages à l'Agence Codex" });
    blocks.push({ type: "list", items: newArrivalsNarration });
  }

  blocks.push({ type: "heading", text: "Effectif de l'équipe" });
  blocks.push({ type: "paragraph", text: `${teamSize.total} membre(s) actif(s) — ${Object.entries(teamSize.byCategory).map(([cat, n]) => `${n} ${cat}`).join(", ")}.` });

  blocks.push({ type: "heading", text: "Badges" });
  blocks.push({ type: "paragraph", text: `${badgeSummary.certified}/${badgeSummary.total} certifiés.` });
  if (badgeSummary.notCertified.length) {
    blocks.push({ type: "list", items: badgeSummary.notCertified.map((r) => `${r.agentName} — ${r.gaps.join(" ; ")}`) });
  }

  blocks.push({ type: "heading", text: "Tendance KPI (lue depuis kpi-historique.csv, jamais recalculée)" });
  const trendLines = Object.entries(kpiTrend).filter(([, t]) => t.current !== undefined).map(([family, t]) => `${family} : ${t.current}%${t.delta !== undefined ? ` (${t.delta >= 0 ? "+" : ""}${t.delta} pt)` : ""}`);
  blocks.push(trendLines.length ? { type: "list", items: trendLines } : { type: "paragraph", text: "Aucune mesure disponible pour l'instant." });

  blocks.push({ type: "heading", text: "Outils à retirer ou refondre" });
  blocks.push(reconsider.length
    ? { type: "list", items: reconsider.map((r) => `${r.slug} — ${r.reasons.join(" ; ")}`) }
    : { type: "paragraph", text: "Aucun signal de retrait pour l'instant." });

  // `coverageGaps` (2026-09-21, « trous dans l'équipe ») : null quand le rapport n'a pas relancé
  // AXA-CHECK (jamais dans le signal léger) — distinct de [] (relancé, aucun trou trouvé), jamais
  // confondu (même discipline honnête que le reste de ce fichier).
  if (coverageGaps !== null) {
    blocks.push({ type: "heading", text: "Trous d'équipe — couverture de test fragile (AXA-CHECK, jamais recalculée)" });
    blocks.push(coverageGaps.length
      ? { type: "list", items: coverageGaps.map((g) => `${g.tool} — ${g.pct === undefined ? "jamais scanné" : `${Math.round(g.pct)}% de couverture`}`) }
      : { type: "paragraph", text: "Aucun poste fragile détecté — tous les membres scannés sont à 100% de couverture." });
  }

  if (recruitmentCandidates.length) {
    blocks.push({ type: "heading", text: "Recrutement en cours" });
    blocks.push({ type: "list", items: recruitmentCandidates.map((c) => `${c.name} — étape : ${c.stage}`) });
  }
  return blocks;
}

export function buildCassandraReportHtml(data, dateLabel = new Date().toISOString()) {
  return renderHtmlReport({
    title: "CASSANDRA-RH — rapport d'équipe",
    subtitle: CASSANDRA_PERSONA,
    dateLabel,
    blocks: buildCassandraReportBlocks(data),
  });
}

// Assemble tout ce qui est réellement calculé ailleurs (jamais un second calcul) — factorisé une
// seule fois pour que le signal léger et le bilan complet lisent EXACTEMENT les mêmes chiffres pour
// les 4 signaux communs, jamais deux calculs qui pourraient diverger entre les deux déclenchements.
// `withCoverage` (2026-09-21, « trous dans l'équipe ») relance AXA-CHECK réellement — jamais dans le
// signal léger (coûterait un vrai temps de recalcul à chaque Ronde), seulement quand demandé.
function collectRealCassandraData({ withCoverage = false } = {}) {
  const onboardingContext = buildRealOnboardingContext();
  const roster = teamRoster(onboardingContext.toolsTableMarkdown);
  const teamSize = teamSizeSnapshot(roster);
  const usageHistory = loadUsageJson(join(ROOT, ".tool-usage-history.json"), { events: [] });
  const staleness = scriptStaleness();
  const knownToolSlugs = roster.map((m) => m.slug);
  // Trois éclairages supplémentaires (2026-09-21, « OK GO ») — chacun une simple relecture d'un
  // fichier/registre déjà écrit ailleurs, jamais un second calcul (cf. commentaire de
  // toolsToReconsider() ci-dessus pour le détail de chacun).
  const objectifsRows = buildObjectifsReport(loadObjectifsRegistry(), usageHistory, { kpiRows: loadKpiHistoryRows() });
  const tokenHistory = loadUsageJson(join(ROOT, ".smart-conso-token-history.json"), { actions: [] });
  const docReportRows = buildDocReportIndex({ registries: DOC_REPORT_REGISTRIES, usageHistory }).rows;
  const reconsider = toolsToReconsider({ usageHistory, knownSlugs: knownToolSlugs, staleness, objectifsRows, tokenHistory, docReportRows });
  const { trend } = loadKpiTrend();
  // Couverture AVANT les badges (2026-09-22) : dans l'ordre précédent, le rapport complet calculait
  // la couverture réelle DEUX LIGNES après des badges qui la déclaraient inconnue — le même rapport
  // affirmait donc deux choses opposées sur le même outil au même instant. La mesure fraîche de ce
  // lancement prime désormais sur le relevé du dernier commit que porte déjà `onboardingContext`
  // (badgeSignalsAsContext(), check-tasks-details.mjs) ; le signal léger, lui, garde ce relevé, qui
  // reste infiniment plus honnête que rien. Jamais un second lancement d'AXA-CHECK pour autant :
  // c'est LE MÊME appel runAxaCheckCoverage() qu'avant, seulement placé plus haut et lu deux fois.
  const perSlugCoverage = withCoverage ? runAxaCheckCoverage() : null;
  const badgeResults = computeBadgeResults(roster, perSlugCoverage
    ? {
      ...onboardingContext,
      axaCoverageBySlug: Object.fromEntries(
        roster.map((m) => [m.slug, scriptRobustnessScore(m.slug, perSlugCoverage)]).filter(([, pct]) => pct !== undefined),
      ),
      lastVerifiedAt: new Date().toISOString().slice(0, 10),
    }
    : onboardingContext);
  const badgeSummary = badgeOversightSummary(badgeResults, loadBadgeCeremonyHistory().etats ?? null);
  const coverageGaps = perSlugCoverage ? computeCoverageGaps(roster, perSlugCoverage) : null;

  // Nouveaux visages (Phase 1) : jamais dans le signal léger, réservé au rapport complet — c'est là
  // que la narration est effectivement montrée à l'utilisateur, donc là seulement qu'un membre est
  // marqué "vu". Persistance immédiate après calcul : un rapport qui plante après ce point ne doit
  // jamais faire perdre l'accueil (préférer un membre marqué "vu" un peu tôt à une répétition infinie
  // si le rapport échouait systématiquement après ce calcul).
  let newArrivalsNarration = [];
  if (withCoverage) {
    const alreadyWelcomed = loadKnownMembers().slugs;
    const newArrivals = detectNewArrivals(roster, alreadyWelcomed);
    newArrivalsNarration = narrateNewArrivals(newArrivals, badgeResults);
    recordKnownMembers(knownToolSlugs);
  }

  return { teamSize, badgeSummary, kpiTrend: trend, reconsider, coverageGaps, newArrivalsNarration };
}

function main() {
  recordCliUsage("cassandra-rh");
  assertNotAPersonnage("CASSANDRA-RH", "cassandra-rh.mjs::main()");
  const [, , sub] = process.argv;
  if (sub === "rapport") {
    const data = collectRealCassandraData({ withCoverage: true });
    console.log(CASSANDRA_PERSONA);
    console.log("");
    console.log(buildCassandraReportHtml(data));
    return;
  }
  const data = collectRealCassandraData();
  console.log(CASSANDRA_PERSONA);
  console.log("");
  console.log(buildCassandraLightSignal(data));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
