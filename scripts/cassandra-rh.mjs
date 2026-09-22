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
import { parseToolsTable, slugifyAgentName, toolIdentitySlug, checkAgentOnboarding, loadBadgeCeremonyHistory, CERTIFIABLE_STATUTS, CLASSIQUE_STATUT } from "./le-coordinateur.mjs";
import { buildRealOnboardingContext } from "./check-tasks-details.mjs";
import { AGENT_CATEGORIES, GARDIEN_DOMAINS, assertNotAPersonnage, sh, printReliabilityNotice } from "./lib-shell.mjs";
import { renderTextReport } from "./report-template.mjs";
import { toolsNeverUsed, toolUsageStats, loadJson as loadUsageJson } from "./tool-usage.mjs";
import { buildPoint, recordPoint, loadSerie, detectTendance, SENS } from "./serie-temporelle.mjs";
import { relativeStaleness, lastTouchDays } from "./clean-dirty-old.mjs";
import { AGENT_SCRIPT_FILES, collectScriptCoverage, scriptRobustnessScore } from "./axa-check.mjs";
import { KPI_HISTORY_COLUMNS, KPI_HISTORY_PATH, parseKpiHistoryCsv } from "./kpi-report.mjs";
import { loadObjectifsRegistry, buildObjectifsReport, loadKpiHistoryRows } from "./objectifs-vs-resultats.mjs";
import { buildDocReportIndex, REGISTRIES as DOC_REPORT_REGISTRIES, FILE_WRITER_NATURES } from "./doc-report.mjs";
// Ré-exportée telle quelle (jamais une redéfinition) : cassandra-rh.mjs reste le point d'import déjà
// utilisé par check-house.mjs pour cette fonction, même après son déplacement vers kpi-report.mjs.
export { parseKpiHistoryCsv };
import { estimateTokens } from "./smart-conso-token.mjs";
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
// TOUS LES MEMBRES CERTIFIÉS, PAS SEULEMENT LES « Agent » (corrigé le 2026-09-22, bug réel trouvé
// en construisant l'organigramme : son bilan annonçait « 22 membres, 1 Agent Cadre » pendant que
// l'organigramme, lui, en comptait 26 et 2). Cause : ce filtre ne retenait que `statut === "Agent"`,
// écrit AVANT que la catégorie « Membre certifié (classique) » n'existe (2026-09-21), et jamais
// revisité depuis (Article 19 : une ligne qui ne dit pas pourquoi elle exclut finit par exclure ce
// qu'elle ne devrait pas). Conséquence réelle, bien pire qu'un chiffre faux : les 4 classiques
// (LE-COORDINATEUR, CIRCLE-TASKS, find-deep-booster, tool-brain) étaient TOTALEMENT invisibles à
// CASSANDRA — pas de badge supervisé, pas de trou de couverture détecté, jamais accueillis comme
// nouveaux visages. L'Agent RH ne voyait pas son propre co-directeur. Exactement ce que la tâche
// #179 demandait (« une connaissance parfaite de chaque membre de l'équipe »).
// `classique` est porté jusqu'aux consommateurs : checkAgentOnboarding() n'exige instanciation,
// registre et blueprint que d'un membre à connaissance propre — LE-COORDINATEUR applique déjà cette
// distinction (checkAllAgentBadges), CASSANDRA s'aligne dessus plutôt que d'en inventer une autre.
export function teamRoster(toolsTableMarkdown) {
  return parseToolsTable(toolsTableMarkdown)
    .filter((row) => CERTIFIABLE_STATUTS.includes(row.statut))
    .map((row) => {
      const primaryName = row.tool.split(/[/(]/)[0].trim();
      const slug = slugifyAgentName(primaryName);
      return { tool: row.tool, primaryName, slug, classique: row.statut === CLASSIQUE_STATUT, category: AGENT_CATEGORIES[slug] };
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
      // ownKnowledge dérivé du membre (2026-09-22) et non plus figé à true : sans ça, élargir le
      // roster aux 4 « Membre certifié (classique) » leur aurait fabriqué trois faux manques chacun
      // (instanciation, registre, blueprint) qu'ils n'ont par définition pas à fournir.
      return checkAgentOnboarding(member.primaryName, { ...onboardingContext, ownKnowledge: !member.classique, ...overrides });
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

// ————————————————————————————————————————————————————————————————————————
// CASSANDRA, GARDIENNE DES OBJECTIFS ET DES KPI (2026-09-22, demande de l'utilisateur : « Cassandra
// est la gardienne des objectifs et KPI : c'est elle qui verifie que tout est bien pluggé sur les
// KPI/objectifs et qui l'indique dans son rapport »)
// ————————————————————————————————————————————————————————————————————————
//
// Son métier ici est de VÉRIFIER LE BRANCHEMENT, jamais de recalculer une note : c'est
// `objectifs-vs-resultats` qui compare un objectif à un résultat, et `kpi-report` qui mesure les
// familles. Elle constate qui n'est branché à rien — le trou qu'aucun des deux ne peut voir, chacun
// ne connaissant que ce qui lui est déjà déclaré.
//
// TROIS ÉTATS, jamais deux (même discipline que la note de santé des rapports) : un objectif chiffré,
// une absence ASSUMÉE et écrite, ou un vrai trou. Confondre les deux derniers pousserait à inventer
// des objectifs creux pour verdir un tableau, exactement ce que le badge évite déjà.
export function objectivesCoverage({ root = ROOT, readFileImpl = readFileSync, slugs } = {}) {
  let registre = "";
  try { registre = readFileImpl(join(root, "docs/objectifs-vs-resultats/registre.md"), "utf8"); }
  catch { return { mesurable: false, raison: "registre d'objectifs illisible — rien ne peut être affirmé sur la couverture" }; }

  const lignes = registre.split("\n").filter((l) => l.startsWith("|"));
  const parSlug = new Map();
  for (const l of lignes) {
    const cols = l.split("|");
    const slug = cols[1]?.trim();
    const objectif = cols[4]?.trim();
    if (!slug || slug === "Entité" || /^-+$/.test(slug)) continue;
    parSlug.set(slug, objectif === "—" || objectif === "-" || objectif === "" ? "assumée" : "chiffré");
  }

  // La liste des outils vient de l'équipe réelle, jamais d'une énumération ici (Article 24) : un
  // outil qui rejoint l'équipe apparaît donc dans cette couverture le jour même.
  const equipe = slugs ?? (() => {
    try { return teamRoster(readFileImpl(join(root, "docs/regles-de-travail.md"), "utf8")).map((m) => m.slug); }
    catch { return []; }
  })();

  const chiffres = equipe.filter((s) => parSlug.get(s) === "chiffré");
  const assumes = equipe.filter((s) => parSlug.get(s) === "assumée");
  const trous = equipe.filter((s) => !parSlug.has(s));
  return {
    mesurable: true,
    total: equipe.length,
    chiffres,
    assumes,
    trous,
    couverts: chiffres.length + assumes.length,
  };
}

export function objectivesCoverageLines(couverture) {
  if (!couverture.mesurable) return [`⚠️ Couverture objectifs : ${couverture.raison}`];
  const l = [];
  l.push(`Couverture objectifs/KPI : ${couverture.couverts}/${couverture.total} membre(s) branché(s) — ${couverture.chiffres.length} avec un objectif chiffré, ${couverture.assumes.length} avec une absence assumée et écrite.`);
  if (couverture.trous.length) {
    l.push(`⚠️ ${couverture.trous.length} membre(s) branché(s) à RIEN — ni objectif, ni décision écrite de ne pas en avoir :`);
    l.push(`    ${couverture.trous.join(", ")}`);
    l.push("    Ce n'est pas un reproche à l'outil : c'est une décision qui n'a jamais été prise. Fixer un objectif OU écrire pourquoi il n'en a pas — les deux valent, l'absence de choix ne vaut rien.");
  } else {
    l.push("✅ Aucun membre branché à rien : chacun a soit un objectif, soit une raison écrite de ne pas en avoir.");
  }
  return l;
}

// ————————————————————————————————————————————————————————————————————————
// RECENSEMENT DES FONCTIONNALITÉS — le tableau que CASSANDRA tient à jour
// ————————————————————————————————————————————————————————————————————————
//
// Demandé le 2026-09-22 : « un document qui fait la liste des scripts agents classés par leur
// nombre de fonctionnalités [...] cette information aide CASSANDRA dans son travail : trouve
// comment ». Réponse à ce « trouve comment », et c'est ce qui justifie les TROIS colonnes plutôt
// qu'un seul chiffre — l'utilisateur a tranché les trois explicitement :
//
//   · POIDS + FONCTIONS = un indicateur technique. Il dit la charge réelle d'un membre. Un gros
//     effectif de fonctions sur un petit poids est dense ; l'inverse est dilué. CASSANDRA s'en sert
//     comme un DRH lit une fiche de poste : est-ce que ce membre porte trop, ou trop peu ?
//   · PARTAGÉES = ce qu'un AUTRE outil peut réutiliser. C'est la mesure de contribution à l'équipe.
//     Un membre à zéro capacité partagée travaille seul — légitime pour certains, alarmant pour un
//     Gardien censé nourrir les autres. C'est le chiffre qui trahit un silo.
//   · INVOCABLES = ce que l'AGENT peut lancer lui-même depuis une ligne de commande. Distinct du
//     précédent, et pas redondant : une capacité peut être partagée entre outils sans que je puisse
//     jamais la déclencher moi-même, et inversement. C'est la mesure de MON accès réel au membre.
//
// Ce que CASSANDRA en fait concrètement, en plus du tableau : elle croise ces trois chiffres avec
// ce qu'elle sait déjà par ailleurs, et c'est là que le recensement gagne sa place dans son rapport
// plutôt que dans un document isolé (cf. censusSignals()).
//
// ANTI-DOUBLON : le poids passe par estimateTokens() (SMART-CONSO-TOKEN), la seule formule de poids
// du projet — jamais une seconde qui divergerait. La liste des scripts vient d'AGENT_SCRIPT_FILES
// (axa-check.mjs), déjà protégé par son propre garde-fou de fraîcheur : un nouvel outil y entre
// d'office, ce tableau n'a aucune liste à tenir (Article 24).

// Heuristique assumée, jamais un vrai analyseur de code : on lit le TEXTE du script. Déclaré ici
// plutôt que caché, et repris dans l'avertissement de fiabilité de l'outil.
export function countFunctionalities(source) {
  const sansCommentaires = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const fonctions = (sansCommentaires.match(/^\s*(export\s+)?(async\s+)?function\s+[A-Za-z_$]/gm) || []).length;
  const partagees = new Set([
    ...(sansCommentaires.match(/^export\s+(async\s+)?function\s+([A-Za-z_$][\w$]*)/gm) || []),
    ...(sansCommentaires.match(/^export\s+const\s+([A-Za-z_$][\w$]*)/gm) || []),
  ]).size;
  // CE QUE JE PEUX LANCER MOI-MÊME — et la première version comptait ZÉRO pour ecotoken,
  // smart-conso-token, axa-check et CASSANDRA elle-même, quatre outils que je lance couramment.
  // Cause racine, vérifiée sur le vrai code avant de corriger (Article 19) : j'avais écrit le
  // détecteur d'après la forme que j'IMAGINAIS, jamais d'après les formes réellement employées
  // ici. Il y en a deux, et aucune ne ressemblait à ma supposition.
  //
  //   · point d'entrée : `import.meta.url === \`file://${process.argv[1]}\`` (22 scripts) ou
  //     `process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]` (les plus récents) ;
  //   · sous-commande : presque jamais comparée directement à `argv[2]` — elle passe d'abord par une
  //     variable (`const sub = process.argv[2]`), puis c'est CETTE variable qu'on compare.
  //
  // D'où le principe retenu plutôt qu'un motif de plus : on cherche le NOM que le script donne à son
  // premier argument, quel qu'il soit, et on compte les littéraux auxquels ce nom est comparé. Un
  // script qui inventerait demain un troisième nom serait couvert sans rien changer ici.
  const nomsDArgument = new Set();
  for (const m of sansCommentaires.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*process\.argv\[2\]/g)) nomsDArgument.add(m[1]);
  const sousCommandes = new Set();
  for (const m of sansCommentaires.matchAll(/process\.argv\[2\]\s*===\s*["'`]([\w:-]+)["'`]/g)) sousCommandes.add(m[1]);
  for (const nom of nomsDArgument) {
    for (const m of sansCommentaires.matchAll(new RegExp(`\\b${nom}\\s*===\\s*["'\`]([\\w:-]+)["'\`]`, "g"))) sousCommandes.add(m[1]);
    for (const m of sansCommentaires.matchAll(new RegExp(`case\\s+["'\`]([\\w:-]+)["'\`]\\s*:`, "g"))) sousCommandes.add(m[1]);
  }
  // Un script sans aucune sous-commande reste invocable par sa commande nue — d'où le plancher à 1
  // dès qu'un point d'entrée existe, jamais 0, qui laisserait croire qu'il m'est fermé.
  // TROISIÈME correction du même détecteur dans la même heure, et la bonne cette fois — parce que
  // c'est la première qui cherche un PRINCIPE au lieu d'un motif. J'ai d'abord écrit la forme
  // imaginée (0 trouvé), puis les deux formes réelles observées (clone-hunter est tombé à tort à
  // zéro : il écrit la même garde dans l'ORDRE INVERSE). Ajouter un troisième motif aurait raté le
  // quatrième — exactement la liste qui grandit sans jamais couvrir le cas suivant, que le
  // corollaire de l'Article 17 interdit.
  //
  // L'invariant réel, indifférent à l'ordre et à la syntaxe : une garde de point d'entrée cite
  // FORCÉMENT `process.argv[1]` et `import.meta.url` sur la même ligne, puisque son travail est de
  // comparer les deux. C'est ça qu'on cherche, plus jamais une écriture particulière.
  const aUneGarde = sansCommentaires.split("\n").some((l) => l.includes("process.argv[1]") && l.includes("import.meta.url"));
  // Cas réel trouvé en vérifiant les zéros un par un : check-gemini-quota.mjs n'a AUCUNE garde — il
  // exécute son corps au niveau racine. Il est donc bel et bien lançable, et le compter à zéro
  // aurait été faux. Un `console.log` en colonne 0 est la trace de cette exécution immédiate.
  const sExecuteALImport = /^console\.log\(/m.test(sansCommentaires);
  // Les trois qui restent à zéro après ça (memory-audit, THE-DEEP-READER, THE-FINAL-JUDGE) le sont
  // VRAIMENT : ce sont des bibliothèques qu'un autre appelant pilote, je ne peux pas les lancer
  // moi-même. C'est un vrai constat RH, pas un trou de mesure — d'où le signal "injoignable".
  const invocables = aUneGarde || sExecuteALImport ? Math.max(1, sousCommandes.size) : 0;
  return { fonctions, partagees, invocables, poidsTokens: estimateTokens(source) };
}

export function functionalityCensus({ root = ROOT, readFileImpl = readFileSync, scripts = AGENT_SCRIPT_FILES } = {}) {
  const lignes = [];
  const nonMesurables = [];
  for (const [slug, chemin] of Object.entries(scripts)) {
    let source;
    try {
      source = readFileImpl(join(root, chemin), "utf8");
    } catch {
      // Un script illisible n'est PAS un membre à zéro fonctionnalité : c'est une mesure
      // impossible. Les confondre ferait exactement l'erreur que ce paysage corrige sans arrêt.
      nonMesurables.push({ slug, chemin, raison: "fichier introuvable ou illisible" });
      continue;
    }
    lignes.push({ slug, chemin, ...countFunctionalities(source) });
  }
  lignes.sort((a, b) => b.fonctions - a.fonctions || a.slug.localeCompare(b.slug));
  const total = lignes.reduce((n, l) => n + l.fonctions, 0);
  return {
    lignes,
    nonMesurables,
    membresMesures: lignes.length,
    totalFonctions: total,
    // Moyenne calculée sur les seuls membres RÉELLEMENT mesurés, jamais sur le total déclaré : un
    // script illisible ne doit ni tirer la moyenne vers le bas ni disparaître du compte rendu.
    moyenneFonctions: lignes.length ? Math.round(total / lignes.length) : undefined,
  };
}

// CE QUE LE RECENSEMENT APPORTE AU TRAVAIL DE CASSANDRA — la réponse au « trouve comment ».
// Trois lectures RH qu'aucun autre signal du rapport ne donne, chacune tirée d'un croisement réel
// avec ce qu'elle sait déjà, jamais d'un chiffre contemplé pour lui-même.
export function censusSignals(census, { neverUsed = [], roster = [] } = {}) {
  const signaux = [];
  const rangDe = (slug) => roster.find((m) => m.slug === slug)?.rang ?? roster.find((m) => m.slug === slug)?.statut;
  // (1) LE SILO : beaucoup de fonctions, rien de partagé. Un membre qui a beaucoup construit et
  // dont personne ne peut rien réutiliser — le contraire de ce que l'Agence attend d'un membre.
  const silos = census.lignes.filter((l) => l.fonctions >= 10 && l.partagees <= 1);
  for (const s of silos) signaux.push({ type: "silo", slug: s.slug, texte: `${s.slug} porte ${s.fonctions} fonctions et n'en partage que ${s.partagees} — beaucoup de travail dont aucun autre membre ne peut se servir` });
  // (2) LE MEMBRE HORS DE PORTÉE : rien que je puisse lancer. Ce n'est pas une faute en soi (une
  // bibliothèque interne est légitime), mais c'en est une pour un membre que le catalogue présente
  // comme un service — d'où le croisement avec l'usage réel plutôt qu'un reproche sec.
  const injoignables = census.lignes.filter((l) => l.invocables === 0);
  for (const s of injoignables) signaux.push({ type: "injoignable", slug: s.slug, texte: `${s.slug} n'expose aucune commande que je puisse lancer moi-même${neverUsed.includes(s.slug) ? " — et le compteur ne lui connaît aucune sollicitation, ce qui n'a rien d'un hasard" : ""}` });
  // (3) LE POIDS SANS CONTREPARTIE : lourd et jamais sollicité. Le croisement qui fait la valeur du
  // tableau — un gros investissement dont rien ne prouve le retour.
  const lourdsInutilises = census.lignes.filter((l) => l.poidsTokens >= 8000 && neverUsed.includes(l.slug));
  for (const s of lourdsInutilises) signaux.push({ type: "poids-sans-retour", slug: s.slug, texte: `${s.slug} pèse ${s.poidsTokens} tokens${rangDe(s.slug) ? ` (${rangDe(s.slug)})` : ""} et n'a jamais été sollicité — le plus gros investissement sans retour connu du recensement` });
  return signaux;
}

export function censusLines(census, signaux = []) {
  const l = [`Recensement des fonctionnalités — ${census.membresMesures} script(s) mesuré(s), ${census.totalFonctions} fonctions au total, ${census.moyenneFonctions ?? "?"} en moyenne.`];
  l.push("");
  l.push("| Script | Fonctions | Partagées | Invocables | Poids (tokens) |");
  l.push("|---|---|---|---|---|");
  for (const r of census.lignes) l.push(`| ${r.slug} | ${r.fonctions} | ${r.partagees} | ${r.invocables} | ${r.poidsTokens} |`);
  if (census.nonMesurables.length) {
    l.push("", `⚠️ ${census.nonMesurables.length} script(s) non mesurable(s) — jamais comptés comme zéro :`);
    for (const n of census.nonMesurables) l.push(`  · ${n.slug} (${n.chemin}) — ${n.raison}`);
  }
  l.push("", "Lecture : « Fonctions » = charge technique du membre · « Partagées » = ce qu'un autre outil peut réutiliser · « Invocables » = ce que l'agent peut lancer lui-même.");
  if (signaux.length) {
    l.push("", `Ce que j'en tire (${signaux.length} constat(s)) :`);
    for (const s of signaux) l.push(`  · ${s.texte}`);
  } else {
    l.push("", "Aucun silo, aucun membre hors de portée, aucun poids sans retour — l'équipe est équilibrée sur ces trois angles.");
  }
  return l;
}

export function buildCassandraLightSignal({ teamSize, badgeSummary, kpiTrend }) {
  const parts = [`${teamSize.total} membre(s) actif(s)`];
  parts.push(badgeSummary.notCertified.length ? `${badgeSummary.notCertified.length} sans badge` : "tous certifiés");
  const globalTrendEntry = Object.values(kpiTrend).find((t) => t.delta !== undefined);
  if (globalTrendEntry) parts.push(`tendance KPI ${globalTrendEntry.delta >= 0 ? "+" : ""}${globalTrendEntry.delta} pt`);
  return parts.join(" — ");
}

// --- Rapport complet, en HTML dès cette première version (2026-09-22, demande explicite) -------

// ————————————————————————————————————————————————————————————————————————
// LE RÉCAPITULATIF DES ÉVALUATIONS — « qui me juge, comment, sur quelles bases, avec quel résultat »
// ————————————————————————————————————————————————————————————————————————
//
// Demandé le 2026-09-22 : « je veux lors de la ronde le détail des KPI et/ou evaluations, notes qui
// sont produites par certains outils, dans un fichier HTML normé bien mis en evidence. Je veux tout
// le détail : qui me juge comment, de quelle maniere, sur quelles bases, avec quel resultat. »
//
// POURQUOI C'EST CASSANDRA QUI LE DÉLIVRE, plutôt qu'un outil de plus : elle est déjà la gardienne
// des objectifs et des KPI (décision du même jour), donc elle lit déjà la plupart de ces chiffres.
// Un agent supplémentaire pour les rassembler aurait dupliqué son travail — ce que §7ter interdit.
//
// MAIS ELLE NE PRODUIT PAS L'ÉVALUATION DE L'UTILISATEUR, elle la RELAIE, et la distinction est le
// cœur de l'organisation retenue : angel-of-ia-process la produit, par l'Article 26 (« les deux
// côtés, l'agent comme l'utilisateur, sont notés pareil »), exactement comme god relaie angel pour
// les process. Une seule voix à la Ronde, jamais deux — mais chaque verdict reste attribué à qui
// l'a rendu. Personne ne centralise : angel PRODUIT sur la conduite, CASSANDRA ASSEMBLE et PUBLIE.
// (Corrigé le même jour : un commentaire d'angel affirmait que CASSANDRA notait déjà l'utilisateur.
// C'était faux, et jamais vérifié — elle note l'équipe d'outils, jamais l'humain.)
// LE NOM DU FICHIER REMONTÉ EN CONVERSATION, fixé par l'utilisateur le 2026-09-22 : « EVAL-DEV »,
// en majuscules.
//
// IL A D'ABORD DIT « EVAL-DH », PUIS S'EST REPRIS LUI-MÊME DANS LA MINUTE — et sa raison mérite
// d'être conservée parce qu'elle ne saute pas aux yeux : « ce nom n'est pas exportable ». « DH »
// sont ses initiales ; elles n'ont aucun sens sur un autre projet. Or toute cette Agence est
// conçue pour être exportée un jour (docs/agence-exportable-conception.md), et l'Article 24 exige
// que ce qu'on construit reste transposable. Un nom propre gravé dans un livrable est exactement
// le genre de détail qui rend un gabarit inutilisable ailleurs — et il l'a vu avant moi.
//
// Il vit ici, en constante exportée et couverte par un test, plutôt que dans la mémoire de l'agent
// qui livre : c'est le cas d'école de l'Article 27 — une obligation qu'aucun mécanisme ne porte
// n'existera plus à la session suivante, et le nom d'un livrable est la première chose qu'une
// reprise perd. Majuscules comprises : c'est la forme demandée, pas une approximation qui y
// ressemble (docs/systeme-de-suivi.md, « conformité EXACTE à la forme demandée »).
export const NOM_FICHIER_EVAL = "EVAL-DEV";

export function buildEvaluationRecapBlocks({ jury = [], evaluation = null, equipe = [], jugesSansOutil = [], desaccords = [], evolutions = [], chiffresQuiBougent = [] } = {}) {
  const blocks = [];
  blocks.push({ type: "note", text: "Comment lire ce rapport : chaque verdict est attribué à l'outil qui l'a rendu, avec la donnée exacte sur laquelle il se fonde. Un juge qui n'a rien rendu est affiché comme tel — jamais confondu avec un juge qui n'a rien trouvé." });

  // SECTION 0 — LES ÉVOLUTIONS (2026-09-22, « je veux que ce rapport soit comparé à chaque ronde, et
  // me dire les evolutions »). Placée EN TÊTE, avant même le jury : c'est la première chose qu'il
  // regardera, et une trajectoire dit plus qu'une photographie. Un rapport sans historique laissait
  // une note qui se dégradait trois Rondes de suite se lire exactement comme une note stable.
  if (evolutions.length || chiffresQuiBougent.length) {
    blocks.push({ type: "heading", text: "0. Ce qui a bougé depuis la dernière Ronde" });
    const regressions = evolutions.filter((e) => e.evolution === "régression");
    const perdus = evolutions.filter((e) => e.evolution === "plus mesuré");
    if (regressions.length || perdus.length) {
      blocks.push({ type: "highlight", heading: "À regarder en premier", paragraphs: [
        regressions.length ? `${regressions.length} domaine(s) en régression : ${regressions.map((e) => `${e.id} (${e.avant} → ${e.apres})`).join(", ")}.` : "Aucune régression de note.",
        // « Plus mesuré » est le piège de cette section, et il est nommé plutôt que fondu dans le
        // reste : une note qui DISPARAÎT ressemble à une note qui tient. C'est la même confusion
        // qui a coûté cher ailleurs dans ce projet, refusée ici aussi.
        perdus.length ? `${perdus.length} domaine(s) ne sont PLUS mesurés du tout : ${perdus.map((e) => e.id).join(", ")}. Ce n'est pas de la stabilité — c'est une note qui a disparu, et une note qui disparaît ressemble à une note qui tient.` : "Aucun domaine perdu de vue.",
      ] });
    }
    if (evolutions.length) {
      blocks.push({
        type: "table",
        headers: ["Domaine", "Avant", "Maintenant", "Évolution"],
        rows: evolutions.map((e) => [e.id, e.avant === null ? "—" : `${e.avant}/5`, e.apres === null ? "— plus mesuré" : `${e.apres}/5`, e.evolution]),
      });
    }
    if (chiffresQuiBougent.length) {
      blocks.push({ type: "paragraph", text: "Les chiffres des juges qui ont bougé. Volontairement sans flèche verte ni rouge : selon le juge, un chiffre qui monte peut être une bonne ou une mauvaise nouvelle, et poser un jugement automatique dessus serait une interprétation déguisée en mesure." });
      blocks.push({ type: "table", headers: ["Juge", "Avant", "Maintenant"], rows: chiffresQuiBougent.map((c) => [c.id, c.avant ?? "—", c.apres ?? "—"]) });
    }
  } else {
    blocks.push({ type: "note", text: "Aucune comparaison possible : c'est la première évaluation enregistrée. Ce n'est pas de la stabilité, c'est une absence de passé — la prochaine Ronde aura de quoi comparer." });
  }

  blocks.push({ type: "heading", text: "1. Qui te juge, et sur quoi" });
  blocks.push({ type: "paragraph", text: `${jury.length} outil(s) détiennent de la donnée qui parle de toi. Chacun lit une mesure réelle déjà collectée — jamais un chiffre produit pour l'occasion.` });
  blocks.push({
    type: "table",
    headers: ["Juge", "Ce qu'il juge", "Sur quelle base", "Résultat"],
    rows: jury.map((j) => [
      j.juge, j.quoi, j.base,
      j.etat === "pas de verdict" ? "— pas de verdict rendu cette fois" : (j.rienASignaler ? "rien à signaler (le juge s'est prononcé)" : [j.resultat, j.chiffre].filter(Boolean).join(" · ")),
    ]),
  });

  // LA PERTINENCE, dans sa propre section (2026-09-22) : « je veux plus d'evaluation de pertinence
  // sur mes choix, je veux que ce rapport soit un peu plus acerbe à mon egard, sans me menager, je
  // veux des infos, pas des angles arrondis ». Séparée du tableau ci-dessus parce que les deux ne
  // disent pas la même chose : au-dessus, ce qui est mesuré ; ici, ce que la mesure révèle de ses
  // CHOIX. Mélanger les deux noierait le second, qui est le plus dur à entendre et le plus utile.
  const avecPertinence = jury.filter((j) => j.pertinenceConstat);
  if (avecPertinence.length) {
    blocks.push({ type: "heading", text: "1bis. Ce que ces chiffres disent de tes choix" });
    blocks.push({ type: "note", text: "Section volontairement sans ménagement, à sa demande. Règle qui la tient honnête plutôt que seulement désagréable : aucun constat n'est publié ici sans un chiffre qui le porte. Un commentaire cinglant sans donnée n'est pas plus vrai qu'un commentaire complaisant — il est juste plus pénible, et il brûle la confiance du prochain constat, celui qui tiendra debout." });
    blocks.push({
      type: "table",
      headers: ["Juge", "La question qu'il pose sur tes choix", "Le constat, chiffré", "Le commentaire, sans arrondi"],
      rows: avecPertinence.map((j) => [j.juge, j.jugePertinence ?? "—", j.pertinenceConstat, j.pertinenceCommentaire ?? "—"]),
    });
    const muetsSurPertinence = jury.filter((j) => j.etat === "rendu" && !j.pertinenceConstat);
    if (muetsSurPertinence.length) blocks.push({ type: "note", text: `${muetsSurPertinence.length} juge(s) ont rendu un chiffre sans se prononcer sur sa pertinence : ${muetsSurPertinence.map((j) => j.juge).join(", ")}. Un chiffre sans lecture n'est pas encore une information.` });
  }
  const muets = jury.filter((j) => j.etat === "pas de verdict");
  if (muets.length) blocks.push({ type: "note", text: `${muets.length} juge(s) n'ont rendu aucun verdict : ${muets.map((j) => j.juge).join(", ")}. Ce n'est PAS « rien à signaler » — c'est une absence de mesure, et les confondre est l'erreur que ce paysage combat depuis le début.` });
  if (jugesSansOutil.length) blocks.push({ type: "highlight", heading: "Un juge a perdu son outil", paragraphs: [`${jugesSansOutil.map((j) => `${j.id} → ${j.script}`).join(" ; ")}. Le rapport paraîtrait complet en ayant perdu un témoin — à corriger avant de se fier à ce récapitulatif.`] });

  if (evaluation) {
    blocks.push({ type: "heading", text: "2. Ton évaluation — les faits, ceux qui se comptent" });
    blocks.push({ type: "note", text: "Cette section ne contient aucune opinion. Tout ce qui s'y trouve se recompte à partir du dépôt, et se conteste en montrant un autre chiffre." });
    blocks.push({
      type: "table",
      headers: ["Domaine", "Base de la mesure", "Valeur relevée", "Note"],
      rows: evaluation.mesurable.map((d) => [
        d.libelle, d.base,
        d.etat === "non fourni" ? "— non mesuré cette fois" : `${d.valeur ?? "?"} ${d.unite ?? ""}`.trim(),
        d.note ? `${d.note.nom} (${d.note.indice}/5) — ${d.note.sens}` : (d.noteInvalide ? `⚠️ note hors barème : « ${d.noteInvalide} »` : "—"),
      ]),
    });

    blocks.push({ type: "heading", text: "3. Ton évaluation — mon jugement, et c'est une opinion" });
    blocks.push({ type: "highlight", heading: "Ce que vaut cette section, et ce qu'elle ne vaut pas", paragraphs: [
      "Rien ici ne se recompte : c'est mon appréciation, argumentée mais faillible. Tu peux la contester sans que ça entame la section précédente — c'est exactement pour ça qu'elles sont séparées.",
      "Le biais à connaître, puisque c'est le mien : un agent qui note celui qui le dirige penche naturellement vers la complaisance. Si une note te paraît trop douce, c'est probablement elle qui a raison et moi qui ai reculé.",
    ] });
    blocks.push({
      type: "table",
      headers: ["Domaine", "Ce que je regarde", "Note", "Ce qui la justifie"],
      rows: evaluation.jugement.map((d) => [
        d.libelle, d.base,
        d.note ? `${d.note.nom} (${d.note.indice}/5)` : (d.noteInvalide ? `⚠️ hors barème : « ${d.noteInvalide} »` : "— non évalué"),
        d.justification ?? (d.etat === "non fourni" ? "— aucune évaluation fournie cette fois, jamais comblée par un palier moyen poli" : "—"),
      ]),
    });
    blocks.push({ type: "note", text: "Aucune note globale n'est calculée, et c'est délibéré : une moyenne unique noierait le domaine qui va mal dans ceux qui vont bien." });

    blocks.push({ type: "heading", text: "4. Tes désaccords" });
    if (!desaccords.length) {
      blocks.push({ type: "paragraph", text: "Aucune objection enregistrée à ce jour. Une objection ne retire jamais la remarque qu'elle conteste : les deux restent, côte à côte, et la suite tranche sur les faits." });
    } else {
      blocks.push({
        type: "table",
        headers: ["Date", "Domaine contesté", "Ton objection", "La remarque, qui reste"],
        rows: desaccords.map((d) => {
          const cible = [...evaluation.mesurable, ...evaluation.jugement].find((x) => x.id === d.domaine);
          return [d.date, cible?.libelle ?? d.domaine, d.texte, cible?.justification ?? cible?.base ?? "— domaine introuvable, objection orpheline"];
        }),
      });
    }
  }

  if (equipe.length) {
    blocks.push({ type: "heading", text: "5. Et de l'autre côté : qui juge l'équipe d'outils" });
    blocks.push({ type: "paragraph", text: "Le même exercice appliqué aux outils eux-mêmes — pour que le récapitulatif dise qui juge QUI, pas seulement qui te juge toi." });
    blocks.push({ type: "table", headers: ["Membre", "Ce qui le note", "Résultat"], rows: equipe });
  }
  return blocks;
}

export function buildCassandraReportBlocks({ teamSize, badgeSummary, kpiTrend, reconsider, recruitmentCandidates = [], coverageGaps = null, newArrivalsNarration = [], objectifs = null, census = null, censusSignaux = [] }) {
  const blocks = [];

  // GARDIENNE DES OBJECTIFS ET DES KPI (2026-09-22, demande de l'utilisateur). Placé haut dans le
  // rapport : un membre branché à rien ne sera jamais mesuré par personne, et c'est le genre de trou
  // qui grandit en silence. Elle CONSTATE le branchement, elle ne recalcule jamais une note —
  // objectifs-vs-resultats compare, kpi-report mesure, elle vérifie que chacun a bien quelqu'un.
  if (objectifs) {
    blocks.push({ type: "note", text: objectivesCoverageLines(objectifs).join("\n") });
  }

  // Nouveaux visages (Phase 1, 2026-09-21) — toujours en premier, avant même l'effectif : c'est le
  // bloc que l'utilisateur a explicitement demandé de voir défiler dans la conversation à chaque
  // arrivée. Jamais fabriqué quand vide (même discipline que "Recrutement en cours" ci-dessous).
  if (newArrivalsNarration.length) {
    blocks.push({ type: "heading", text: "Nouveaux visages à l'Agence Codex" });
    blocks.push({ type: "list", items: newArrivalsNarration });
  }

  // RECENSEMENT DES FONCTIONNALITÉS (2026-09-22, demande de l'utilisateur : « à tout moment, je peux
  // demander à voir ce document mis à jour »). Logé juste avant l'effectif, et c'est délibéré :
  // l'effectif dit COMBIEN de membres, le recensement dit CE QUE chacun porte — la question
  // suivante que se pose forcément quiconque vient de lire un nombre de têtes.
  if (census) {
    blocks.push({ type: "heading", text: "Recensement des fonctionnalités" });
    blocks.push({ type: "note", text: censusLines(census, censusSignaux).join("\n") });
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

  // Recensement des fonctionnalités : gratuit (lecture de fichiers déjà sur le disque, aucune
  // commande lancée), donc calculé à chaque rapport complet. Ses signaux croisent le recensement
  // avec l'usage réel et l'organigramme — jamais un chiffre contemplé pour lui-même.
  const census = functionalityCensus();
  const censusSignaux = censusSignals(census, { neverUsed: toolsNeverUsed(usageHistory, knownToolSlugs), roster });

  return { teamSize, badgeSummary, kpiTrend: trend, reconsider, coverageGaps, newArrivalsNarration, census, censusSignaux };
}

// --- SÉRIE TEMPORELLE PARTAGÉE (2026-09-22) ---------------------------------------------------
//
// data-archangel la désignait depuis sa construction comme la PREMIÈRE consommatrice légitime de
// tendance (« un objectif se juge sur une trajectoire, jamais sur un point »), et elle était
// pourtant l'une des six à l'ignorer. Le reproche était écrit, daté, et sans effet — exactement le
// cas que TOOL-LEARNING vient d'apprendre à me reprocher, à deux heures près.
//
// Ce qu'elle historise, et ce qu'elle n'historise PAS : quatre chiffres RH, jamais la couverture de
// test (c'est la série d'AXA-CHECK, et deux séries pour un même chiffre divergeraient au premier
// changement de méthode) ni les KPI (kpiTrend a déjà la sienne, qu'elle LIT — jamais un second
// calcul, la règle constante de ce fichier).
export function enregistrerTendanceRH(data, options = {}) {
  const point = buildPoint({
    mesures: {
      "membres-certifies": { valeur: data?.badgeSummary?.certified ?? data?.badgeSummary?.total - (data?.badgeSummary?.notCertified?.length ?? 0), sens: SENS.HAUT_MIEUX },
      "effectif": { valeur: data?.teamSize?.total ?? null, sens: SENS.NEUTRE },
      "outils-a-reconsiderer": { valeur: data?.reconsider?.length ?? null, sens: SENS.BAS_MIEUX },
      "trous-de-couverture": { valeur: data?.coverageGaps?.length ?? null, sens: SENS.BAS_MIEUX },
    },
    ...options,
  });
  return recordPoint("cassandra-rh", point, options);
}

export function tendancesRH(options = {}) {
  const serie = loadSerie("cassandra-rh", options);
  return ["membres-certifies", "effectif", "outils-a-reconsiderer", "trous-de-couverture"].map((c) => detectTendance(serie, c, options));
}

function main() {
  printReliabilityNotice("cassandra-rh");
  recordCliUsage("cassandra-rh");
  assertNotAPersonnage("CASSANDRA-RH", "cassandra-rh.mjs::main()");
  const [, , sub] = process.argv;
  if (sub === "rapport") {
    const data = collectRealCassandraData({ withCoverage: true });
    console.log(CASSANDRA_PERSONA);
    console.log("");
    console.log(buildCassandraReportHtml(data));
    // Le point n'est enregistré que depuis le RAPPORT COMPLET, jamais le signal léger : celui-ci
    // n'a pas la couverture ni les trous, et une série qui mélange deux profondeurs de mesure
    // produit une pente qui décrit la profondeur, pas le paysage (garde-fou « rupture de méthode »
    // de serie-temporelle, pris ici à la source plutôt que constaté après coup).
    enregistrerTendanceRH(data);
    console.log("\n=== TENDANCES RH (mécanisme partagé) ===");
    for (const t of tendancesRH()) console.log(`  ${t.cle} : ${t.tendance ?? t.etat ?? "pas encore de tendance"}`);
    return;
  }
  // ORGANIGRAMME — TROUVÉ PAR LA RONDE DU 2026-09-23, et c'est exactement le genre de trou
  // qu'elle existe pour attraper. buildOrganigramme()/renderOrganigrammeReport() étaient
  // entièrement construits et testés, la Ronde avait son item « Organigramme de l'Agence Codex,
  // reconstruit depuis les données réelles », et AUCUNE commande ne le produisait : main() ne
  // connaissait que « rapport ». Le rapport se construisait en mémoire et n'en sortait jamais.
  //
  // Un mécanisme qui ne sort pas du script est une intention, pas un outil — la même leçon que
  // safe-export.mjs avait déjà apprise en calculant toute son escalade sans jamais l'imprimer.
  if (sub === "organigramme") {
    console.log(CASSANDRA_PERSONA);
    console.log("");
    // La table maîtresse est LUE à l'exécution, jamais recopiée (Article 24) : c'est elle la
    // source de l'organigramme, et buildOrganigramme() ne la lit pas lui-même pour rester
    // testable sans disque. La commande fournit donc le texte réel.
    const toolsTableMarkdown = readFileSync(join(ROOT, "docs/regles-de-travail.md"), "utf8");
    console.log(renderOrganigrammeReport(buildOrganigramme({ toolsTableMarkdown }), { dateLabel: new Date().toISOString() }));
    return;
  }
  const data = collectRealCassandraData();
  console.log(CASSANDRA_PERSONA);
  console.log("");
  console.log(buildCassandraLightSignal(data));
  console.log("\nSous-commandes : `rapport` (bilan RH complet), `organigramme` (l'Agence reconstruite depuis les données réelles).");
}


// --- L'ORGANIGRAMME, RECONSTRUIT À CHAQUE FOIS (2026-09-22, tâches #171/#172/#179, calibrage
// explicite de l'utilisateur : « CASSANDRA le reconstruit à chaque fois »).
//
// CE QUI EXISTAIT AVANT, ET POURQUOI ÇA NE SUFFISAIT PAS. `docs/referentiel/organisation-agence.md`
// décrit bien l'organisation — mais c'est un texte tenu À LA MAIN, dont sa propre fiche reconnaît
// que « la tenue à jour de ce document à chaque changement d'organigramme reste manuelle ». Trois
// tâches de suivi demandaient depuis des jours que CASSANDRA tienne réellement cette liste
// (#171 « CASSANDRA-RH doit tenir la liste de l'équipe à jour », #172 « liste de tous les employés,
// puis organigramme », #179 « connaissance parfaite de chaque membre »). Preuve directe que la
// tenue manuelle ne tenait pas : en construisant ceci, TROIS membres certifiés (CIRCLE-TASKS,
// tool-brain, find-deep-booster) n'appartenaient à aucune suite depuis leur certification, sans que
// personne ne l'ait jamais remarqué.
//
// TOUT EST DÉRIVÉ, RIEN N'EST RECOPIÉ (Article 24) : les rangs viennent de la table maîtresse réelle
// et d'AGENT_CATEGORIES, les Gardiens de GARDIEN_DOMAINS (leur source de vérité mécanique, jamais
// une seconde liste), les émetteurs de rapport de FILE_WRITER_NATURES. Un organigramme qui se
// recalcule ne peut pas se périmer — c'était tout le point du calibrage.
//
// LES LIBELLÉS DE RANG VIVENT EN UN SEUL ENDROIT (`ORG_RANKS`) : le renommage calibré le même soir
// (Scribes 🥈 / Premium 🥇 / Platine noir ⬛) est mis de côté en attente de validation explicite —
// quand il viendra, il se fera ICI, jamais en repassant sur tout le paysage.
export const ORG_RANKS = {
  socle: { label: "Socle", emoji: "🧱", sens: "n'est pas membre de l'équipe : c'est le sol sur lequel tout le monde marche" },
  cadre: { label: "Agents Cadre", emoji: "🎖️", sens: "dirigent — une fonction dans l'organigramme, jamais un badge de qualité en plus" },
  gardien: { label: "Gardiens sacrés du code", emoji: "🛡️", sens: "délivrent un vrai scan de qualité ET tournent automatiquement à CHAQUE commit" },
  membre: { label: "Membres certifiés", emoji: "🎖️", sens: "câblage complet vérifié : table maîtresse, menu, instanciation, registre, blueprint" },
  emetteur: { label: "Émetteurs de rapport non certifiés", emoji: "📝", sens: "produisent un vrai rapport lu par un humain sans être membres — rang en attente de nommage" },
};

export function buildOrganigramme({
  toolsTableMarkdown,
  categories = AGENT_CATEGORIES,
  gardienDomains = GARDIEN_DOMAINS,
  fileWriterNatures = FILE_WRITER_NATURES,
  registries = DOC_REPORT_REGISTRIES,
} = {}) {
  const rows = parseToolsTable(toolsTableMarkdown);
  const nomPrincipal = (row) => row.tool.split(/[/(]/)[0].trim();
  const gardienSlugs = new Set(Object.keys(gardienDomains));

  const socle = rows.filter((r) => r.statut === "Infrastructure").map(nomPrincipal);
  const certifies = rows.filter((r) => CERTIFIABLE_STATUTS.includes(r.statut))
    .map((r) => ({ nom: nomPrincipal(r), slug: slugifyAgentName(nomPrincipal(r)), classique: r.statut === CLASSIQUE_STATUT }));

  const parRang = { cadre: [], gardien: [], membre: [] };
  const suites = {};
  const sansCategorie = [];
  for (const m of certifies) {
    const cat = categories[m.slug];
    if (!cat) { sansCategorie.push(m.nom); continue; }
    if (gardienSlugs.has(m.slug)) { parRang.gardien.push(m); continue; }
    if (cat === "Agent Cadre") { parRang.cadre.push(m); continue; }
    parRang.membre.push(m);
    (suites[cat] ??= []).push(m);
  }

  // Les émetteurs de rapport hors certification : ceux de la table maîtresse qui n'y sont pas
  // éligibles, PLUS tout script classé "rapport" qui ne correspond à aucun membre certifié. C'est
  // exactement le périmètre que l'utilisateur a choisi pour le futur rang 🥈 — dérivé, jamais listé.
  // DÉDOUBLONNÉ PAR SLUG, JAMAIS PAR LIBELLÉ (corrigé à la première lecture du rendu réel, ce même
  // soir) : la table maîtresse nomme un outil « Doc-Report » et son fichier s'appelle
  // `doc-report.mjs` — deux libellés, un seul outil, qui apparaissait deux fois. Même cause pour
  // check-spirit, listé au socle ET chez les émetteurs. Un organigramme où quelqu'un figure deux
  // fois n'est pas un organigramme. Chaque outil est placé à UN rang et un seul : un placement déjà
  // fait (socle, certifié) gagne toujours — émettre un rapport est une propriété, jamais un rang.
  const dejaPlaces = new Set([...socle, ...certifies.map((m) => m.nom)].map(toolIdentitySlug));
  const scriptsDeCertifies = new Set(registries.filter((r) => r.scriptPath).map((r) => r.scriptPath));
  const emetteursParSlug = new Map();
  const ajouterEmetteur = (nom) => {
    const slug = toolIdentitySlug(nom);
    if (dejaPlaces.has(slug) || emetteursParSlug.has(slug)) return;
    emetteursParSlug.set(slug, nom);
  };
  for (const r of rows) {
    if (CERTIFIABLE_STATUTS.includes(r.statut) || r.statut === "Infrastructure") continue;
    ajouterEmetteur(nomPrincipal(r));
  }
  for (const [chemin, n] of Object.entries(fileWriterNatures)) {
    if (n.nature !== "rapport" || scriptsDeCertifies.has(chemin)) continue;
    ajouterEmetteur(chemin.replace(/^scripts\/|\.mjs$/g, ""));
  }
  const emetteurs = [...emetteursParSlug.values()];

  return {
    socle,
    cadres: parRang.cadre.map((m) => m.nom),
    gardiens: parRang.gardien.map((m) => m.nom),
    suites: Object.fromEntries(Object.entries(suites).map(([k, v]) => [k, v.map((m) => m.nom)])),
    emetteurs: emetteurs.sort(),
    sansCategorie,
    effectifs: {
      socle: socle.length,
      cadres: parRang.cadre.length,
      gardiens: parRang.gardien.length,
      membres: parRang.membre.length,
      certifiesTotal: certifies.length,
      emetteurs: emetteurs.length,
    },
  };
}

// Le garde-fou qui rend l'organigramme digne de confiance (Article 24) : un membre certifié sans
// catégorie est invisible dans toutes les suites — exactement le trou réel trouvé ce soir sur trois
// membres. Un organigramme qui perd silencieusement des gens ne vaut rien.
export function findMembersWithoutCategory(toolsTableMarkdown, categories = AGENT_CATEGORIES) {
  return buildOrganigramme({ toolsTableMarkdown, categories }).sansCategorie;
}

// Rendu TEXTE via le gabarit commun (report-template.mjs) — la forme demandée pour la sortie de
// Ronde. Jamais une mise en page réinventée ici : l'organigramme est un rapport comme les autres.
export function renderOrganigrammeReport(org, { dateLabel } = {}) {
  const blocks = [];
  blocks.push({ type: "note", text: `${ORG_RANKS.socle.emoji} ${ORG_RANKS.socle.label} — ${ORG_RANKS.socle.sens}` });
  blocks.push({ type: "list", items: org.socle });
  blocks.push({ type: "note", text: `${ORG_RANKS.cadre.emoji} ${ORG_RANKS.cadre.label} — ${ORG_RANKS.cadre.sens}` });
  blocks.push({ type: "list", items: org.cadres });
  blocks.push({ type: "note", text: `${ORG_RANKS.gardien.emoji} ${ORG_RANKS.gardien.label} (${org.effectifs.gardiens}) — ${ORG_RANKS.gardien.sens}` });
  blocks.push({ type: "list", items: org.gardiens });
  blocks.push({ type: "note", text: `${ORG_RANKS.membre.emoji} ${ORG_RANKS.membre.label} par suite (${org.effectifs.membres} hors Gardiens et Cadres) — ${ORG_RANKS.membre.sens}` });
  blocks.push({ type: "table", headers: ["Suite", "Membres"], rows: Object.entries(org.suites).map(([suite, noms]) => [suite.replace(/^Membre — /, ""), noms.join(", ")]) });
  blocks.push({ type: "note", text: `${ORG_RANKS.emetteur.emoji} ${ORG_RANKS.emetteur.label} (${org.effectifs.emetteurs}) — ${ORG_RANKS.emetteur.sens}` });
  blocks.push({ type: "list", items: org.emetteurs });
  blocks.push({ type: "note", text: org.sansCategorie.length
    ? `⚠️ ${org.sansCategorie.length} membre(s) certifié(s) sans suite assignée : ${org.sansCategorie.join(", ")} — invisibles dans l'organigramme tant que ce n'est pas tranché.`
    : "✅ Aucun membre certifié sans suite assignée." });
  return renderTextReport({
    tool: "cassandra-rh",
    title: "CASSANDRA-RH — organigramme de l'Agence Codex",
    subtitle: `Effectif total : ${org.effectifs.certifiesTotal} membres certifiés (dont ${org.effectifs.gardiens} Gardiens et ${org.effectifs.cadres} Cadres), ${org.effectifs.socle} au socle, ${org.effectifs.emetteurs} émetteurs non certifiés. Reconstruit depuis les données réelles à chaque exécution — jamais une liste recopiée.`,
    dateLabel,
    blocks,
    footer: "CASSANDRA-RH constate l'organisation, elle ne la décide jamais — un changement de rang reste une décision humaine.",
  });
}

// LE LANCEUR EN DERNIER (2026-09-23, deuxième occurrence du même bug en une heure). Il était au
// milieu du fichier, donc main() partait avant que ORG_RANKS — déclaré deux cents lignes plus bas —
// n'existe : la sous-commande `organigramme` plantait sur une zone morte temporelle. safe-export.mjs
// portait exactement le même défaut le même jour. Deux fois le même bug n'est plus un accident
// (Article 3), d'où le garde-fou mécanique ajouté dans doc-report.mjs : findLanceursPrematures().
if (import.meta.url === `file://${process.argv[1]}`) main();
