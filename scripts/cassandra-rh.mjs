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
import { readFileSync, existsSync, rmSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseToolsTable, lireTableMaitresse, slugifyAgentName, toolIdentitySlug, checkAgentOnboarding, loadBadgeCeremonyHistory, CERTIFIABLE_STATUTS, CLASSIQUE_STATUT, PRESTATIONS } from "./le-coordinateur.mjs";
import { buildRealOnboardingContext } from "./check-tasks-details.mjs";
import { AGENT_CATEGORIES, GARDIEN_DOMAINS, TOOL_PORTEE, porteeDe, assertNotAPersonnage, sh, printReliabilityNotice, pairesParJaccard, familleDeLaCategorie, rangDeLaCategorie } from "./lib-shell.mjs";
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
import { recordCliUsage, recordRegistryWrite } from "./tool-usage.mjs";
import { buildPlanDaction, PLAN_ACTION_TITRE, SANS_CONSTAT_PROPRE } from "./report-template.mjs";

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
      // `category` reste le RANG et rien d'autre (2026-09-25, #754) : c'est le sens qu'il a
      // toujours eu ici — le regroupement du roster compte des Gardiens et des Membres, pas des
      // familles. La famille est un SECOND axe, posé à côté plutôt que fondu dans le premier ;
      // les fondre aurait fabriqué autant de « catégories » que de familles sans que personne
      // ne l'ait demandé.
      return { tool: row.tool, primaryName, slug, classique: row.statut === CLASSIQUE_STATUT,
        category: rangDeLaCategorie(AGENT_CATEGORIES[slug]) ?? undefined,
        famille: familleDeLaCategorie(AGENT_CATEGORIES[slug]) ?? undefined };
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

// ————————————————————————————————————————————————————————————————————————
// LES TYPES DE SCRIPTS ET LES CLASSES TRANSVERSES (2026-09-24, chantier 1.3 et 1.4 du plan de nuit)
// ————————————————————————————————————————————————————————————————————————
//
// DEMANDE DE L'UTILISATEUR, en deux morceaux du même prompt : « distinguons les types de scripts »
// comme support de la classification, et la notion de CLASSE TRANSVERSE dont il donne un exemple
// (« tous les outils qui scannent »), en précisant : « Sont déclarés pertinents d'office les
// gardiens sacrés ».
//
// POURQUOI ICI, CHEZ CASSANDRA, ET PAS DANS UN VINGT-SIXIÈME SCRIPT : c'est elle qui tient déjà
// l'effectif (`teamRoster`), le recensement de fonctionnalités (`functionalityCensus`) et
// l'organigramme. Un script de plus pour une seconde vue de la même population aurait été exactement
// ce que l'utilisateur demande d'arrêter dans le même prompt (« réduire le nombre d'outils »). Et la
// convocation qu'il demande par ailleurs a besoin de savoir DE QUEL TYPE est ce qu'elle convoque.
//
// LA DIFFÉRENCE AVEC CE QUI EXISTAIT, parce qu'elle n'est pas évidente et qu'un doublon aurait été
// le vrai risque : `AGENT_CATEGORIES` donne le RANG (qui est Gardien sacré, qui est Membre) et
// `TOOL_PORTEE` donne ce qu'un outil ANALYSE (le dépôt ou une simulation). Ni l'un ni l'autre ne dit
// ce qu'un fichier EST (une bibliothèque n'a pas de rang et n'analyse rien) ni ce qu'il SAIT FAIRE.
// Ce sont donc deux axes neufs, pas une troisième copie des deux premiers.
//
// TOUT SE DÉRIVE, RIEN NE S'ÉNUMÈRE (Article 24) : le type se lit dans le fichier lui-même (a-t-il
// une porte d'entrée en ligne de commande ? vit-il dans les crochets ? qui l'importe ?), et chaque
// classe transverse est une SONDE sur le source. Un script ajouté demain reçoit son type et ses
// classes sans que personne y pense, et une classe nouvelle s'écrit en UN endroit pour TOUS.

export const MOTIF_PORTE_CLI = /import\.meta\.url\s*===\s*`file:\/\/\$\{process\.argv\[1\]\}`/;

export const TYPES_DE_SCRIPT = {
  crochet: "s'exécute automatiquement à un moment de git, jamais appelé à la main",
  "filet-de-securite": "la suite de tests elle-même — ce que le crochet lance et qui peut refuser un commit",
  outil: "un membre de l'Agence : une porte d'entrée réelle (ligne de commande, package.json, crochet ou commande écrite) ET au moins un document qui le nomme",
  "utilitaire-sans-fiche": "lançable mais nommé par aucun document du dépôt : soit un outil qu'on a oublié de documenter, soit un script jetable qui a survécu",
  "bibliotheque-partagee": "aucune porte d'entrée, importée par plusieurs — le vocabulaire commun de l'Agence",
  "bibliotheque-solitaire": "aucune porte d'entrée et importée par un seul : à fusionner dans son unique client, ou bien il lui manque des clients",
  "infrastructure-shell": "script shell d'installation ou de construction, hors de l'Agence",
  "execution-directe-non-documentee": "personne ne l'importe et aucune commande de lancement n'est écrite nulle part : il ne peut être lancé qu'à la main, par quelqu'un qui sait déjà",
};

// Chaque classe est une SONDE, jamais une liste de noms. Une classe nouvelle s'ajoute ici et
// s'applique immédiatement à TOUS les scripts, y compris ceux écrits avant elle.
export const CLASSES_TRANSVERSES = [
  { cle: "scanne-le-depot", libelle: "scanne le dépôt",
    quoi: "parcourt des fichiers pour y chercher quelque chose — la classe que l'utilisateur a nommée lui-même",
    sonde: (src) => /readdirSync|walk\s*\(|globSync/.test(src) },
  { cle: "rend-du-html", libelle: "rend un rapport HTML",
    quoi: "produit une page, donc quelque chose que l'utilisateur LIT vraiment",
    sonde: (src) => /renderHtmlReport/.test(src) },
  { cle: "tient-un-registre", libelle: "tient un registre",
    quoi: "écrit une mémoire durable sur le disque — ce qui lui permet de se souvenir d'un passage à l'autre",
    sonde: (src) => /writeFileSync|appendFileSync/.test(src) },
  { cle: "coute-des-appels-api", libelle: "coûte de vrais appels API",
    quoi: "consulte un modèle ou un service distant : jamais lancé sans passer par Smart Conso API (Article 22)",
    sonde: (src) => /generativelanguage|fetch\s*\(\s*[`'"]https/.test(src) },
  { cle: "declare-sa-fiabilite", libelle: "déclare sa marge d'erreur",
    quoi: "avertit qu'il peut se tromper avant de rendre un chiffre — l'exigence transverse de tous les outils heuristiques",
    sonde: (src) => /printReliabilityNotice/.test(src) },
  { cle: "conclut-en-plan-daction", libelle: "conclut par un plan d'action",
    quoi: "transforme ses constats en gestes (Article 28) au lieu de s'arrêter au rapport",
    sonde: (src) => /PLAN_ACTION_TITRE|buildPlanDaction|planDactionDepuisEcarts/.test(src) },
  { cle: "compte-son-usage", libelle: "enregistre son propre usage",
    quoi: "sait dire s'il a servi — sans quoi personne ne peut constater qu'un outil n'est jamais sollicité",
    sonde: (src) => /recordCliUsage/.test(src) },
  { cle: "refuse-de-mesurer", libelle: "sait répondre « pas mesuré »",
    quoi: "distingue « je n'ai rien trouvé » de « je n'ai pas pu regarder » (leçon L5) — la classe la plus discrète et la plus importante",
    sonde: (src) => /PAS MESURÉ|pas mesuré|mesurable\s*:\s*false/.test(src) },
];

// DEUX FAUX VERDICTS, TROUVÉS AU PREMIER PASSAGE RÉEL — et les garder écrits vaut mieux que de
// les refaire, parce que les deux venaient de la même paresse : mesurer ce qui était facile à
// mesurer plutôt que ce que la question posait.
//
// (1) « SANS FICHE », 22 FOIS, dont presque toutes à tort. Je cherchais `docs/referentiel/<nom du
// fichier>.md`, or la fiche d'un outil porte le nom de L'OUTIL, pas celui de son script :
// `check-argus.mjs` est documenté dans `argus.md`, `check-harmonia.mjs` dans `harmonia.md`. Et six
// outils n'ont DÉLIBÉRÉMENT aucune fiche, la charte le déclare noir sur blanc. Le rattachement se
// fait donc par la TABLE MAÎTRESSE, le registre qui dit déjà quel script appartient à quel outil —
// lu, jamais recopié (Article 24).
//
// (2) « ORPHELINE », 6 FOIS, toutes fausses. Je ne comptais qu'une seule façon d'atteindre un
// script — être importé par un autre — alors qu'il en existe quatre dans ce dépôt : la porte en
// ligne de commande, `package.json`, un crochet git, et la documentation qui écrit `node
// scripts/x.mjs` pour un outil lancé à la main. `check-spirit.mjs` tombait ainsi en « plus rien ne
// l'atteint » alors que la charte le cite comme l'outil de référence de l'Article 0. Un garde qui
// accuse à tort cesse d'être lu (leçon L4) : les quatre portes se cherchent, et l'orphelin n'est
// déclaré qu'une fois les quatre fermées.

export function inventaireDeLaCharte(charteMarkdown = "") {
  // L'inventaire documentaire de CLAUDE.md : une ligne par outil, avec sa colonne Script et sa
  // colonne Instanciation. Il se LIT, il ne se recopie pas — un outil ajouté demain y sera.
  const out = [];
  for (const ligne of String(charteMarkdown).split("\n")) {
    if (!ligne.trim().startsWith("|")) continue;
    const cells = ligne.split("|").slice(1, -1).map((c) => c.trim().replace(/`/g, ""));
    const script = cells.find((c) => /^scripts\/[a-z0-9-]+\.mjs$/.test(c));
    const instanciation = cells.find((c) => /^docs\/referentiel\/[a-z0-9-]+\.md$/.test(c));
    if (script) out.push({ script, instanciation: instanciation ?? null });
  }
  return out;
}

// CINQ PORTES, PAS QUATRE — et la cinquième est arrivée par un troisième faux verdict. Après la
// correction précédente, `check-spirit.mjs` restait « orphelin » : la charte le cite abondamment,
// mais elle n'écrit nulle part `node scripts/check-spirit.mjs`, seulement la commande de Smart
// Conso API qu'il faut lancer AVANT lui. Être nommé par un document normatif est donc une porte à
// part entière — et le vrai constat, celui qui sert, est ailleurs : un outil que la charte dit de
// lancer à la main sans jamais écrire comment se lance mal. C'est devenu un écart nommé plutôt
// qu'une accusation d'inexistence (BP3 : fournir le FAIT qui manque, jamais adoucir le constat).
export function portesDEntree(chemin, source = "", { importeurs = 0, packageJson = "", sourcesCrochets = "", documentation = "", instructions = null } = {}) {
  const base = chemin.replace(/^scripts\//, "");
  const echappe = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // LE SCRIPT DOIT ÊTRE L'ARGUMENT DIRECT DU LANCEUR — sinon la sonde attrape de la prose. Trois
  // faux positifs mesurés avec la version large `node\s+[^|\n]*<nom>` : la commande d'un AUTRE
  // outil qui prend ce nom en paramètre (`node scripts/smart-conso-api.mjs check-spirit`), et une
  // phrase de compte rendu qui citait une ligne d'import. Un lanceur suivi d'options puis du
  // chemin, et rien d'autre. Le guillemet et la parenthèse comptent comme début : dans
  // package.json la commande est une valeur JSON, donc précédée d'un `"` et de rien d'autre —
  // l'oublier faisait sortir `run-framework.mjs`, lancé par `pnpm dev`, en « lançable par personne ».
  const motifLancement = new RegExp(`(?:^|[\\s\`"'(])(?:node|bash)\\s+(?:--?[\\w-]+(?:=\\S+)?\\s+)*(?:\\./)?scripts/(?:hooks/)?${echappe}(?![\\w.-])`, "m");
  // `--import` PRÉCHARGE un module, il ne lance rien : `sites-env.mjs`, chargé ainsi par
  // package.json, sortait « outil » alors qu'il n'est qu'une bibliothèque branchée au démarrage.
  const motifPrechargement = new RegExp(`--import\\s+(?:\\./)?scripts/${echappe}(?![\\w.-])`);
  const motifCitation = new RegExp(`scripts/${echappe}`);
  const portes = [];
  if (MOTIF_PORTE_CLI.test(source)) portes.push("ligne de commande");
  if (motifLancement.test(packageJson)) portes.push("package.json");
  if (motifLancement.test(sourcesCrochets)) portes.push("crochet git");
  // LA COMMANDE SE CHERCHE DANS LES INSTRUCTIONS, JAMAIS DANS L'HISTORIQUE — troisième
  // sur-correction, attrapée en vérifiant un verdict plutôt qu'en le croyant. `check-spirit.mjs`
  // ressortait « une commande est écrite » grâce à une ligne de SUIVI, c'est-à-dire le récit d'un
  // travail passé. Une commande pour lancer quelque chose vit dans un document qui dit quoi faire,
  // jamais dans un journal de ce qui a été fait — et la confondre effaçait précisément le constat
  // utile : la charte ordonne de lancer cet outil à la main sans jamais écrire comment.
  if (motifPrechargement.test(packageJson)) portes.push("préchargé comme module par package.json, jamais lancé");
  if (motifLancement.test(instructions ?? documentation)) portes.push("une commande de lancement est écrite");
  else if (motifCitation.test(documentation)) portes.push("nommé par la documentation, sans commande de lancement écrite");
  if (importeurs > 0) portes.push(`importé par ${importeurs} fichier(s)`);
  return portes;
}

export function typeDeScript(chemin, source = "", { fiches = new Set(), importeurs = 0, portes = null, scriptsDeLInventaire = new Set(), documente = false } = {}) {
  if (/^scripts\/hooks\//.test(chemin)) return "crochet";
  if (/\.sh$/.test(chemin)) return "infrastructure-shell";
  if (chemin === "scripts/check-house.mjs") return "filet-de-securite";
  // ÊTRE NOMMÉ PAR UN DOCUMENT N'EST PAS UNE PORTE D'EXÉCUTION — la sur-correction immédiate de la
  // correction précédente, et elle valait d'être attrapée : en comptant la mention documentaire
  // comme une porte, `html-report.mjs`, importé par dix-huit fichiers et lançable par aucun, est
  // sorti « outil ». Les deux questions sont distinctes et se posent séparément : peut-on le
  // LANCER (sinon c'est une bibliothèque), et reste-t-il ATTEIGNABLE par quoi que ce soit (sinon
  // c'est du code mort).
  const lancePar = (portes ?? []).filter((p) => p === "ligne de commande" || p === "package.json" || p === "crochet git" || p === "une commande de lancement est écrite");
  // Un .mjs que PERSONNE n'importe et qui n'expose aucune porte ne peut faire quelque chose que
  // lancé directement — c'est le cas de `check-spirit.mjs`, qui travaille au niveau du module sans
  // garde `import.meta.url`. Le déduire par élimination vaut mieux que de le déclarer mort.
  const executableParElimination = importeurs === 0 && /\.mjs$/.test(chemin);
  if (lancePar.length || executableParElimination) {
    if (!lancePar.length) return "execution-directe-non-documentee";
    // Appartenir à l'inventaire de la charte VAUT documentation, même sans fiche séparée : six
    // outils y figurent en déclarant explicitement n'en avoir aucune, et les traiter en oubliés
    // serait reprocher une décision écrite (Article 19).
    if (fiches.has(chemin) || scriptsDeLInventaire.has(chemin)) return "outil";
    return documente ? "outil" : "utilitaire-sans-fiche";
  }
  return importeurs >= 2 ? "bibliotheque-partagee" : "bibliotheque-solitaire";
}

export function classesDuScript(source = "", classes = CLASSES_TRANSVERSES) {
  return classes.filter((c) => c.sonde(String(source))).map((c) => c.cle);
}

// LE RECENSEMENT COMPLET. Il refuse de répondre plutôt que de rendre un tableau vide quand il n'a
// rien pu lire (leçon L5) : une population de zéro script se lit exactement comme un dépôt propre.
export function recenserLesScripts({ root = ROOT, lireDossier = readdirSync, lire = readFileSync, classes = CLASSES_TRANSVERSES } = {}) {
  let noms = [];
  try { noms = lireDossier(join(root, "scripts")); } catch { return { mesurable: false, pourquoi: "le dossier scripts/ est illisible — aucune population mesurée, ce qui n'est jamais la même chose qu'une population vide" }; }
  const chemins = [];
  for (const n of noms) {
    if (/\.(mjs|sh)$/.test(n)) chemins.push(`scripts/${n}`);
    else if (n === "hooks") {
      let sousNoms = [];
      try { sousNoms = lireDossier(join(root, "scripts/hooks")); } catch { continue; }
      for (const sn of sousNoms) chemins.push(`scripts/hooks/${sn}`);
    }
  }
  if (!chemins.length) return { mesurable: false, pourquoi: "aucun script trouvé dans scripts/ — un dépôt sans outillage serait une anomalie, pas un résultat" };

  const sources = {};
  for (const c of chemins) { try { sources[c] = lire(join(root, c), "utf8"); } catch { sources[c] = null; } }

  // Le rattachement script → fiche se LIT dans l'inventaire de la charte (colonne Script ×
  // colonne Instanciation), jamais déduit du nom du fichier — c'est l'erreur qui accusait 22 outils.
  let inventaire = [];
  try { inventaire = inventaireDeLaCharte(lire(join(root, "CLAUDE.md"), "utf8")); } catch { /* sans inventaire : tout exécutable sera « sans fiche », et le recensement le dit */ }
  const fiches = new Set(inventaire.filter((l) => l.instanciation).map((l) => l.script));
  const scriptsDeLInventaire = new Set(inventaire.map((l) => l.script));

  // Les quatre portes d'entrée réelles de ce dépôt, lues là où elles vivent.
  let packageJson = ""; try { packageJson = lire(join(root, "package.json"), "utf8"); } catch { /* absent */ }
  let sourcesCrochets = "";
  for (const c of chemins) if (/^scripts\/hooks\//.test(c) && sources[c]) sourcesCrochets += sources[c];
  // TOUTE la documentation, jamais deux fichiers choisis à la main : un outil documenté par son
  // seul blueprint (god-of-all-process, tool-brain) sortait « sans fiche » alors qu'il est décrit
  // en long et en large — l'accusation portait sur l'endroit où j'avais regardé, pas sur le dépôt.
  let documentation = "";
  try { documentation += lire(join(root, "CLAUDE.md"), "utf8"); } catch { /* absent */ }
  const lireDocs = (dossier, profondeur = 0) => {
    if (profondeur > 2) return;
    let entrees = [];
    try { entrees = lireDossier(join(root, dossier), { withFileTypes: true }); } catch { return; }
    for (const e of entrees) {
      const nom = e.name ?? e;
      const estDossier = typeof e.isDirectory === "function" ? e.isDirectory() : false;
      if (estDossier) { lireDocs(`${dossier}/${nom}`, profondeur + 1); continue; }
      if (!/\.(md|txt)$/.test(nom)) continue;
      try { documentation += lire(join(root, `${dossier}/${nom}`), "utf8"); } catch { /* illisible */ }
    }
  };
  lireDocs("docs");
  // Le corpus d'INSTRUCTIONS : ce qui dit quoi faire, par opposition à ce qui raconte ce qui a été
  // fait. La frontière se dérive du chemin — un registre d'outil et le suivi sont de l'historique.
  let instructions = "";
  try { instructions += lire(join(root, "CLAUDE.md"), "utf8"); } catch { /* absent */ }
  try { instructions += lire(join(root, "package.json"), "utf8"); } catch { /* absent */ }
  const lireInstructions = (dossier, profondeur = 0) => {
    if (profondeur > 1) return;
    let entrees = [];
    try { entrees = lireDossier(join(root, dossier), { withFileTypes: true }); } catch { return; }
    for (const e of entrees) {
      const nom = e.name ?? e;
      const estDossier = typeof e.isDirectory === "function" ? e.isDirectory() : false;
      if (estDossier) { if (dossier === "docs" && nom === "referentiel") lireInstructions(`${dossier}/${nom}`, profondeur + 1); continue; }
      if (!/\.(md|txt)$/.test(nom)) continue;
      try { instructions += lire(join(root, `${dossier}/${nom}`), "utf8"); } catch { /* illisible */ }
    }
  };
  lireInstructions("docs");

  // Qui importe qui — dérivé des imports réels, jamais d'une carte tenue à la main.
  const importeurs = {};
  for (const [, src] of Object.entries(sources)) {
    if (!src) continue;
    for (const m of String(src).matchAll(/from\s+["']\.\/([a-z0-9-]+\.mjs)["']|import\(["']\.\.\/scripts\/([a-z0-9-]+\.mjs)["']/g)) {
      const cible = `scripts/${m[1] ?? m[2]}`;
      importeurs[cible] = (importeurs[cible] ?? 0) + 1;
    }
  }

  const lignes = chemins.map((c) => {
    const src = sources[c];
    const nb = importeurs[c] ?? 0;
    const portes = src === null ? [] : portesDEntree(c, src, { importeurs: nb, packageJson, sourcesCrochets, documentation, instructions });
    return {
      chemin: c,
      illisible: src === null,
      type: src === null ? "illisible" : typeDeScript(c, src, { fiches, importeurs: nb, portes, scriptsDeLInventaire, documente: new RegExp(`scripts/${c.replace(/^scripts\//, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(documentation) }),
      fiche: fiches.has(c) ? "fiche dédiée" : (scriptsDeLInventaire.has(c) ? "à l'inventaire de la charte" : null),
      classes: src === null ? [] : classesDuScript(src, classes),
      importeurs: nb,
      portes,
      // LE POIDS, demandé explicitement (#744, « indiquer le nombre de lignes de code, le poids
      // qu'il pèse dans le projet »). Compté ici plutôt que recalculé ailleurs : le recensement lit
      // déjà chaque fichier, et une seconde lecture pour la même question serait deux mesures
      // faites à deux instants différents. Un fichier illisible pèse `null`, jamais zéro — zéro
      // ligne se lit comme un fichier vide, et les deux ne veulent pas dire la même chose.
      lignes: src === null ? null : String(src).split("\n").length,
    };
  });

  const parType = {};
  for (const l of lignes) (parType[l.type] ??= []).push(l.chemin);
  const parClasse = {};
  for (const cl of classes) parClasse[cl.cle] = lignes.filter((l) => l.classes.includes(cl.cle)).map((l) => l.chemin);

  return { mesurable: true, lignes, parType, parClasse, total: lignes.length,
    illisibles: lignes.filter((l) => l.illisible).map((l) => l.chemin),
    horsPortee: "le TYPE se dérive de la forme du fichier et les CLASSES de sondes sur son texte : un outil qui scanne le dépôt sans jamais appeler readdirSync échappe à sa classe, et aucune sonde ne sait ce qu'un script fait VRAIMENT. Ce recensement dit ce qui se voit, jamais ce qui se comprend." };
}

// LES ÉCARTS QUE CE RECENSEMENT REND VISIBLES — et c'est là qu'il sert à quelque chose, pas dans le
// tableau lui-même. Chacun est une question, jamais un verdict : Abraham a posé cette règle pour les
// documents et elle vaut ici (un outil capable d'écrire « ce script est inutile » verrait un jour ce
// jugement appliqué par personne en particulier).
// ————————————————————————————————————————————————————————————————————————
// LA VERSION ET LA RICHESSE D'UN OUTIL (2026-09-24, chantier 3.4)
// ————————————————————————————————————————————————————————————————————————
//
// DEMANDE DE L'UTILISATEUR : « des numéros de version par outil, rétroactifs si possible, plus une
// échelle de richesse séparée ». Calibré en fenêtre dédiée : « **dérive-les de l'historique git** ».
//
// POURQUOI DEUX ÉCHELLES ET NON UNE SEULE, parce que c'est lui qui a demandé de les séparer et que
// la raison est bonne : une VERSION dit ce qui s'est PASSÉ (combien de fois cet outil a changé, et
// combien de fois il a changé de CAPACITÉS) ; une RICHESSE dit ce qu'il EST aujourd'hui. Un outil
// écrit d'un jet et jamais retouché a une version basse et peut être très riche ; un outil repris
// vingt fois peut rester pauvre. Les fondre en un seul chiffre effacerait exactement la différence
// qui rend chacun utile.
//
// CE QUI REND LA VERSION HONNÊTE, et c'est le seul choix qui compte ici : le MAJEUR ne compte pas
// les commits, il compte les commits qui ont TOUCHÉ LA SURFACE EXPORTÉE — un `export` ajouté ou
// retiré. C'est-à-dire les fois où l'outil a gagné ou perdu une capacité, et non les fois où on a
// corrigé une faute de frappe dedans. Compter tous les commits aurait rendu un numéro qui grandit
// avec l'agitation plutôt qu'avec les capacités, et un chiffre pareil se lit pourtant comme une
// mesure. Rétroactif par construction : tout est déjà dans git, rien n'est à saisir à la main.

export function versionDepuisGit(chemin, { sh: shImpl = sh } = {}) {
  let commits;
  try {
    commits = shImpl(`git log --format='%H' --follow -- ${chemin}`).trim().split("\n").filter(Boolean);
  } catch {
    return { mesurable: false, pourquoi: `git n'a pas pu lire l'historique de ${chemin} — aucune version déduite, et surtout aucune supposée` };
  }
  if (!commits.length) return { mesurable: false, pourquoi: `${chemin} n'a aucun commit : jamais versionné, ce qui n'est pas la même chose qu'une version 0` };
  let majeur = 0;
  for (const h of commits) {
    let diff = "";
    try { diff = shImpl(`git show ${h} -- ${chemin} | grep -cE '^[+-]export ' || true`).trim(); } catch { continue; }
    if (Number(diff) > 0) majeur += 1;
  }
  const mineur = commits.length - majeur;
  return {
    mesurable: true, majeur, mineur, commits: commits.length,
    version: `v${majeur}.${mineur}`,
    pourquoi: `${majeur} commit(s) ont touché la surface exportée (une capacité gagnée ou perdue), ${mineur} l'ont modifié sans la changer`,
    horsPortee: VERSION_OUTIL_HORS_PORTEE,
  };
}

// LES DEUX ANGLES MORTS DE CETTE HEURISTIQUE, mis en échec EXPRÈS le 2026-09-25 (tâche #730,
// « peux tu fiabiliser toute cette partie stp ») plutôt que découverts un jour par surprise. Le
// majeur lit les lignes `+export`/`-export` du diff, donc :
//   · IL SURCOMPTE quand une ligne d'export est seulement REFORMATÉE (un espace déplacé) — le
//     diff bouge, la capacité non.
//   · IL SOUS-COMPTE quand une capacité s'ajoute SANS toucher une ligne d'export : une entrée de
//     plus dans un tableau déjà exporté est une capacité de plus, et la ligne `export const` ne
//     bouge pas. Ce cas-là est le plus fréquent dans ce dépôt, pas un cas d'école.
// Aucun des deux ne se corrige sans lire le sens du code, ce que git ne sait pas faire. Les
// DÉCLARER là où le chiffre se lit vaut mieux que de les taire : un chiffre dont on connaît la
// marge reste utile, un chiffre qu'on croit exact ne l'est plus.
export const VERSION_OUTIL_HORS_PORTEE =
  "Le majeur lit le diff, pas le sens : il SURCOMPTE une ligne d'export simplement reformatée, et " +
  "SOUS-COMPTE une capacité ajoutée dans un tableau déjà exporté. Une tendance, jamais un décompte exact.";

// ————————————————————————————————————————————————————————————————————————
// LA VERSION DE L'AGENCE ENTIÈRE (2026-09-25, tâche #730)
// ————————————————————————————————————————————————————————————————————————
//
// SA QUESTION, mot pour mot : « est-ce qu'on peut calculer des numéros de versions mais pour
// l'agence au global ? possible de faire rétroactif ? peux tu fiabiliser toute cette partie stp. »
//
// CE QUI NE MARCHE PAS, et ça vient en premier parce que c'est le piège évident : une version
// d'Agence ne peut être ni la SOMME ni la MOYENNE des cinquante versions par outil. La somme
// monterait à chaque faute de frappe corrigée dans n'importe quel script. La moyenne, elle,
// BAISSERAIT le jour où un outil neuf (v0.1) rejoint l'équipe — un nouveau membre ferait reculer
// la version de l'équipe, ce qui est exactement l'inverse de ce qui s'est passé. Les deux rendent
// un chiffre qui a l'air d'une mesure sans en être une, et c'est le plus dangereux des deux
// défauts (un chiffre absent se voit, un chiffre faux se lit).
//
// CE QUI MARCHE, par analogie EXACTE avec la règle par outil, et c'est ce qui rend le choix
// défendable plutôt qu'arbitraire : pour UN outil, le majeur compte les commits qui ont touché sa
// SURFACE EXPORTÉE — ce qu'il sait faire. Pour l'AGENCE, la surface c'est la COMPOSITION DE
// L'ÉQUIPE : le majeur compte les commits où un outil a REJOINT ou QUITTÉ l'équipe. Rétroactif
// par construction, comme l'autre : tout est déjà dans git, rien n'est à saisir à la main.
//
// LES DEUX AUTRES CANDIDATS SONT MESURÉS AUSSI, JAMAIS SEULEMENT ÉVOQUÉS. La tâche #730 en
// nommait trois (un outil qui rejoint ou quitte · un Gardien sacré de plus · un changement de
// charte) et le choix lui revient (Article 16). Les trois sont donc comptés à chaque passage :
// il choisit entre trois chiffres réels, pas entre trois hypothèses. Tant qu'il n'a pas tranché,
// l'axe « équipe » sert de défaut DÉCLARÉ, jamais de décision prise à sa place.
//
// LE DÉNOMINATEUR EST COMMUN AUX TROIS, et c'est ce qui empêche le mineur de devenir négatif :
// les commits de l'Agence sont ceux qui touchent `scripts/` OU la charte, et les commits majeurs
// de n'importe quel axe en sont un sous-ensemble par construction. Un âge ou un compte négatif se
// lit comme « tout frais » au lieu de déclencher une alerte (Article 32, faille 3) — ici c'est
// structurellement impossible plutôt que rattrapé après coup.

export const AXES_DE_VERSION_AGENCE = [
  {
    cle: "equipe",
    quoi: "un outil rejoint ou quitte l'équipe",
    pourquoi: "l'analogie exacte de la règle par outil : la surface d'un outil ce sont ses exports, la surface de l'Agence c'est sa composition",
    commande: "git log --diff-filter=AD --format='%H' -- 'scripts/*.mjs'",
  },
  {
    cle: "gardiens",
    quoi: "un Gardien sacré du code de plus ou de moins",
    pourquoi: "le rang le plus exigeant de l'Article 20bis : en gagner un change ce qui tourne à CHAQUE commit, donc ce que l'Agence fait sans qu'on le lui demande",
    commande: "git log -G': \"Gardien sacr' --format='%H' -- scripts/lib-shell.mjs",
  },
  {
    cle: "charte",
    quoi: "un Article de la charte apparaît ou disparaît",
    pourquoi: "la loi que toute l'Agence sert : un Article de plus, et les cinquante outils travaillent sous une règle de plus",
    commande: "git log -G'^\\*\\*Article [0-9]' --format='%H' -- CLAUDE.md",
  },
];

export const AXE_MAJEUR_PAR_DEFAUT = "equipe";
const COMMITS_DE_L_AGENCE = "git log --format='%H' -- scripts/ CLAUDE.md";

function commitsDe(commande, shImpl) {
  return new Set(String(shImpl(commande) ?? "").trim().split("\n").filter(Boolean));
}

export function versionDeLAgence({ axeMajeur = AXE_MAJEUR_PAR_DEFAUT, sh: shImpl = sh } = {}) {
  const axe = AXES_DE_VERSION_AGENCE.find((a) => a.cle === axeMajeur);
  if (!axe) {
    return { mesurable: false, pourquoi: `axe « ${axeMajeur} » inconnu — les axes disponibles sont ${AXES_DE_VERSION_AGENCE.map((a) => a.cle).join(", ")}, et un axe inventé rendrait une version qui ne veut rien dire` };
  }
  let tous;
  try { tous = commitsDe(COMMITS_DE_L_AGENCE, shImpl); } catch {
    return { mesurable: false, pourquoi: "git n'a pas pu lire l'historique de l'Agence — aucune version déduite, et surtout aucune supposée" };
  }
  if (!tous.size) return { mesurable: false, pourquoi: "aucun commit ne touche scripts/ ni la charte : cette Agence n'a jamais été versionnée, ce qui n'est pas la même chose qu'une version 0" };
  const parAxe = [];
  for (const a of AXES_DE_VERSION_AGENCE) {
    let n = null;
    try { n = [...commitsDe(a.commande, shImpl)].filter((h) => tous.has(h)).length; } catch { n = null; }
    parAxe.push({ cle: a.cle, quoi: a.quoi, pourquoi: a.pourquoi, commits: n, retenu: a.cle === axeMajeur });
  }
  const majeur = parAxe.find((a) => a.cle === axeMajeur).commits;
  if (majeur === null) return { mesurable: false, pourquoi: `git n'a pas pu compter l'axe « ${axeMajeur} » — mieux vaut pas de version qu'une version dont le majeur vaut zéro par accident` };
  return {
    mesurable: true,
    axeMajeur,
    majeur,
    mineur: tous.size - majeur,
    total: tous.size,
    version: `v${majeur}.${tous.size - majeur}`,
    parAxe,
    pourquoi: `${majeur} commit(s) où ${axe.quoi}, sur ${tous.size} commit(s) qui ont touché l'Agence`,
    horsPortee:
      "Cette version dit ce qui s'est PASSÉ, jamais ce que l'Agence VAUT — même frontière que la version par outil. " +
      "Et elle ne se compare à AUCUNE version d'outil : un v69 d'Agence n'est pas « plus avancé » qu'un v4 d'outil, " +
      "les deux ne comptent pas la même chose.",
  };
}

export function formatVersionAgenceLines(v) {
  if (!v?.mesurable) return [`PAS MESURÉ — ${v?.pourquoi ?? "aucune donnée"}`];
  const lignes = [
    `VERSION DE L'AGENCE ENTIÈRE : ${v.version}   (axe retenu : « ${v.axeMajeur} »)`,
    `  ${v.pourquoi}.`,
    "",
    "  Les trois axes candidats, tous comptés — il choisit entre trois chiffres réels, pas entre trois hypothèses :",
  ];
  for (const a of v.parAxe) {
    const n = a.commits === null ? "pas mesuré" : `${a.commits} commit(s)`;
    lignes.push(`   ${a.retenu ? "▶" : " "} ${a.cle.padEnd(9)} ${String(n).padEnd(16)} ${a.quoi}`);
  }
  lignes.push("", `  ${v.horsPortee}`);
  return lignes;
}

// LA RICHESSE — ce que l'outil EST, indépendamment de son passé. Chaque critère vaut UN point et
// dit ce qu'il mesure : un score sans ses composantes agrège, donc cache (même raison qui a fait
// refuser un score de pertinence chez MOÏSE).
export const CRITERES_DE_RICHESSE = [
  { cle: "surface", quoi: "expose au moins cinq fonctions : il fait plusieurs choses, pas une seule", mesure: (c) => (c.exports ?? 0) >= 5 },
  { cle: "refuse-de-mesurer", quoi: "sait répondre « pas mesuré » plutôt que zéro", mesure: (c) => c.classes?.includes("refuse-de-mesurer") },
  { cle: "declare-sa-marge", quoi: "avertit qu'il peut se tromper", mesure: (c) => c.classes?.includes("declare-sa-fiabilite") },
  { cle: "conclut", quoi: "termine par un plan d'action plutôt que par un rapport (Article 28)", mesure: (c) => c.classes?.includes("conclut-en-plan-daction") },
  { cle: "memoire", quoi: "tient un registre : il se souvient d'un passage à l'autre", mesure: (c) => c.classes?.includes("tient-un-registre") },
  { cle: "rend-du-html", quoi: "produit une page que l'utilisateur lit vraiment", mesure: (c) => c.classes?.includes("rend-du-html") },
  { cle: "deux-couches", quoi: "offre plus d'une profondeur de scan", mesure: (c) => (c.couches ?? []).length >= 2 },
];

export function richesse(contexte = {}, criteres = CRITERES_DE_RICHESSE) {
  const tenus = criteres.filter((c) => !!c.mesure(contexte));
  return {
    score: tenus.length, sur: criteres.length,
    tenus: tenus.map((c) => c.cle),
    manquants: criteres.filter((c) => !tenus.includes(c)).map((c) => ({ cle: c.cle, quoi: c.quoi })),
    // AUCUN SEUIL, ET C'EST DÉLIBÉRÉ : un outil pauvre n'est pas un mauvais outil. `find-booster`
    // fait une seule chose et la fait bien. La richesse se LIT à côté de la vocation, jamais seule.
    horsPortee: "la richesse dit ce qu'un outil PORTE, jamais ce qu'il VAUT : un outil qui fait une seule chose et la fait bien sort pauvre et n'a rien à corriger. Aucun seuil n'est posé, et c'est délibéré.",
  };
}

// ————————————————————————————————————————————————————————————————————————
// LES TROIS NIVEAUX DE SCAN — light / target / warrior (2026-09-24, chantier 3.3)
// ————————————————————————————————————————————————————————————————————————
//
// DEMANDE DE L'UTILISATEUR : « les trois niveaux de scan : light / target / warrior. Plus l'analyse
// qu'il demande : quels outils méritent deux couches, la couche lourde est-elle utilisée, peut-elle
// se déclencher automatiquement sur une zone qu'une couche légère a signalée. »
//
// POURQUOI CE N'EST PAS UN DOUBLON DE CHECK-LEVEL-TARGET, et la question s'est posée avant d'écrire
// une ligne (Article 19) : CHECK-LEVEL-TARGET gradue une TÂCHE — « ce travail-ci mérite-t-il une
// vérification légère ou exceptionnelle ? ». Ces trois niveaux-ci graduent ce qu'un OUTIL SAIT
// OFFRIR. Un outil n'a pas de niveau, il a des COUCHES, et la question « quels outils méritent
// deux couches » n'a aucun sens dans l'échelle de CHECK-LEVEL-TARGET. Deux axes, jamais deux copies.
//
// LA DÉFINITION QUI REND LES TROIS UTILES, ET C'EST LE COÛT QUI LES SÉPARE, jamais la profondeur
// ressentie : une couche gratuite peut tourner à chaque commit, une couche payante ne le peut pas,
// et c'est CETTE frontière qui décide de tout le reste (Article 8, Article 22).
export const NIVEAUX_DE_SCAN = {
  light: "gratuit et mécanique : peut tourner à CHAQUE commit sans que personne y pense. Zéro raisonnement, zéro appel API.",
  target: "gratuit mais CIBLÉ : on le lance sur une zone précise, à la demande. Trop bruyant ou trop lent pour tourner partout à chaque fois.",
  warrior: "COÛTEUX : vrai raisonnement, agent séparé ou appels API réels. Jamais automatique, jamais sans passer par Smart Conso API.",
};

// DEUX MESURES FAUSSES AU PREMIER PASSAGE, corrigées avant d'écrire le moindre chiffre dans un
// rapport — et toutes deux du même genre que celles de cette nuit.
//
// (1) « LIGHT » N'EN VOYAIT QUE DEUX. Je cherchais le script dans les crochets git, or les six
// Gardiens sacrés ne sont PAS lancés par un crochet : ils sont lancés par `check-house.mjs`, que
// le crochet lance. Tourner à chaque commit à travers le filet de sécurité est exactement la même
// chose que tourner à chaque commit, et ne pas le voir revenait à dire que les Gardiens n'ont
// aucune couche légère — ce qui est le contraire de leur définition (Article 20).
//
// (2) « WARRIOR » EN VOYAIT VINGT-SIX, c'est-à-dire presque tous. La sonde matchait « Smart Conso
// API » n'importe où, donc tout outil qui CITE la règle dans un commentaire était compté comme
// coûtant de l'argent. Citer l'Article 22 n'est pas le déclencher. La sonde demande maintenant un
// vrai geste coûteux : un appel réseau sortant, ou une couche lourde que l'outil déclare posséder.
// (3) « WARRIOR » NE SE LIT PAS DANS LE SOURCE, ET C'EST UNE LIMITE À DÉCLARER PLUTÔT QU'À
// CONTOURNER. Deux sondes successives sur le texte ont rendu 26 puis 3, et les 3 étaient encore
// faux : ni `cassandra-rh` ni `le-coordinateur` ne coûtent quoi que ce soit. La raison est de
// fond — la couche lourde de THE-FINAL-JUDGE, c'est que L'AGENT le lance comme agent séparé, et ça
// n'apparaît nulle part dans son fichier. Un fichier ne sait pas comment on l'appelle.
//
// Le coût réel est donc LU dans le registre qui le déclare déjà : la colonne `cout` du catalogue
// PRESTATIONS (le-coordinateur.mjs), tenue à jour parce que c'est elle que tool-brain affiche à
// chaque commit. Un registre se LIT, il ne se devine pas (Article 24) — et deviner ici produisait
// un chiffre faux à chaque essai.
export const SONDES_DE_COUCHE = {
  target: (src) => /process\.argv\[2\]|const \[, , sub\]|const \[, , chemin\]|args\[0\]/.test(src),
};

export function outilsCouteuxDuCatalogue(prestations = []) {
  const couteux = new Set();
  for (const p of prestations) {
    if (!/r[ée]el/i.test(String(p?.cout ?? ""))) continue;
    for (const o of p.outils ?? []) couteux.add(String(o).toLowerCase().replace(/\.mjs$/, "").replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""));
  }
  return couteux;
}

export function couchesDuScript(chemin, source = "", { crochets = "", filetDeSecurite = "", couteux = new Set() } = {}) {
  const base = chemin.replace(/^scripts\//, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const couches = [];
  const lanceParCrochet = new RegExp(`node\\s+[^\\n]*${base}`).test(crochets);
  // Lancé par le filet de sécurité, que le crochet lance : même fréquence, même gratuité.
  const dansLeFilet = new RegExp(`(?:import\\(|from)\\s*['"][^'"]*${base}['"]`).test(filetDeSecurite);
  if (lanceParCrochet || dansLeFilet) couches.push("light");
  if (SONDES_DE_COUCHE.target(String(source))) couches.push("target");
  const slug = chemin.replace(/^scripts\//, "").replace(/\.mjs$/, "");
  if (couteux.has(slug) || [...couteux].some((c) => slug.includes(c) || c.includes(slug))) couches.push("warrior");
  return couches;
}

// L'ANALYSE QU'IL DEMANDE, ET ELLE TIENT EN TROIS QUESTIONS — jamais un tableau de plus.
export function analyseDesCouches(recensement, { crochets = "", filetDeSecurite = "", sources = {}, usage = {}, couteux = new Set() } = {}) {
  if (!recensement?.mesurable) return { mesurable: false, pourquoi: recensement?.pourquoi ?? "aucun recensement à analyser" };
  // Les scripts à exécution directe comptent AUSSI : `check-spirit.mjs` est le plus coûteux du
  // dépôt (seize vrais appels Gemini) et il n'est pas typé « outil » faute de commande écrite —
  // l'exclure de l'analyse des couches aurait laissé le plus cher de tous hors du tableau.
  const outils = recensement.lignes.filter((l) => l.type === "outil" || l.type === "execution-directe-non-documentee");
  const lignes = outils.map((l) => ({
    chemin: l.chemin,
    couches: couchesDuScript(l.chemin, sources[l.chemin] ?? "", { crochets, filetDeSecurite, couteux }),
  }));
  // 1. QUI MÉRITERAIT UNE SECONDE COUCHE : un outil qui tourne à chaque commit et qui n'a aucune
  //    façon d'aller plus loin quand il trouve quelque chose. Il signale et il s'arrête là.
  const meriteUneCouche = lignes.filter((l) => l.couches.includes("light") && l.couches.length === 1);
  // 2. LA COUCHE LOURDE EST-ELLE UTILISÉE : la question qu'il pose, et la réponse honnête est
  //    souvent non. Un outil dont la couche payante n'a jamais tourné a payé sa construction pour
  //    rien — mais l'usage se LIT dans le compteur, jamais dans une impression.
  const warriors = lignes.filter((l) => l.couches.includes("warrior"));
  const warriorsJamaisLances = warriors.filter((l) => {
    const slug = l.chemin.replace(/^scripts\//, "").replace(/\.mjs$/, "");
    return !usage[slug];
  });
  // 3. L'ENCHAÎNEMENT AUTOMATIQUE : une couche légère qui signale une zone pourrait déclencher la
  //    couche lourde dessus. Ce que cette fonction rend est la LISTE DES CANDIDATS, jamais le
  //    déclenchement — automatiser une dépense est précisément ce que l'Article 22 interdit.
  const candidatsEnchainement = lignes.filter((l) => l.couches.includes("light") && l.couches.includes("warrior"));
  return {
    mesurable: true, lignes,
    meriteUneCouche: meriteUneCouche.map((l) => l.chemin),
    warriors: warriors.map((l) => l.chemin),
    warriorsJamaisLances: warriorsJamaisLances.map((l) => l.chemin),
    candidatsEnchainement: candidatsEnchainement.map((l) => l.chemin),
    horsPortee: "l'enchaînement automatique est PROPOSÉ, jamais câblé : déclencher seul une couche payante parce qu'une couche gratuite a signalé quelque chose est exactement la dépense sans consultation que l'Article 22 interdit. La liste dit qui POURRAIT, la décision reste humaine.",
  };
}

// ————————————————————————————————————————————————————————————————————————
// LA CONVOCATION (2026-09-24, chantier 3.2 du plan de nuit)
// ————————————————————————————————————————————————————————————————————————
//
// DEMANDE DE L'UTILISATEUR, et elle est précise : « un outil qui échoue, stagne ou ne progresse pas
// est convoqué ; alerte poussée à l'utilisateur sous forme de question, plan d'action, tâches.
// L'agent et l'utilisateur peuvent aussi être convoqués, et l'agent ne doit pas faire taire
// l'alerte. »
//
// TROIS CHOSES DANS CETTE PHRASE, ET CHACUNE CHANGE LA CONCEPTION :
//
// 1. « L'AGENT ET L'UTILISATEUR PEUVENT AUSSI ÊTRE CONVOQUÉS. » C'est ce qui empêche la convocation
//    de devenir un tribunal à sens unique où l'outillage porte seul la responsabilité de tout. Un
//    outil jamais sollicité n'est pas forcément un mauvais outil : c'est peut-être l'agent qui ne
//    l'appelle pas. Une question restée sans réponse n'est pas un défaut d'outil non plus.
//
// 2. « L'AGENT NE DOIT PAS FAIRE TAIRE L'ALERTE. » Un agent qui écrit lui-même « traité » sur une
//    convocation la fait disparaître sans que personne d'autre l'ait vue — et c'est très exactement
//    le geste que la charte interdit ailleurs (`enregistrerXp()` refuse déjà un jugement qui ne
//    porte pas `parUtilisateur: true`). Même discipline ici : une convocation ne se clôt QUE avec
//    un accord daté de l'utilisateur ET une raison écrite. Toute autre tentative est relayée
//    NOMMÉMENT comme une tentative de faire taire l'alerte, jamais silencieusement ignorée.
//
// 3. « QUESTION, PLAN D'ACTION, TÂCHES. » Les trois, pas l'un à la place des autres — c'est la
//    chaîne de l'Article 28 appliquée à une personne ou à un outil plutôt qu'à un rapport.
//
// ELLE NE RECALCULE RIEN : CASSANDRA relaie ce que le réseau sait déjà (`toolsToReconsider`,
// la stagnation, les objectifs, la couverture), son principe fondateur depuis sa naissance.

export const MOTIFS_DE_CONVOCATION = {
  echoue: "il rend un résultat faux, ou refuse de tourner",
  stagne: "il n'a pas bougé quand tout le reste bougeait",
  "ne-progresse-pas": "il tourne, mais ne trouve plus rien de neuf depuis longtemps",
  "jamais-sollicite": "il existe et personne ne l'appelle — un outil qui n'a jamais rien trouvé sur ce projet-ci n'emportera rien d'éprouvé vers le suivant",
  "objectif-manque": "son objectif chiffré n'est pas atteint sur sa période",
};

export const CONVOCABLES = {
  outil: "un membre de l'Agence Codex",
  agent: "l'agent qui pilote — un outil jamais appelé peut être son manquement, jamais celui de l'outil",
  utilisateur: "l'utilisateur lui-même, à sa demande explicite : « je veux être jugé aussi »",
};

export const REGISTRE_CONVOCATIONS = "docs/cassandra-rh/convocations.md";

// LA CONVOCATION SE DÉRIVE DES SIGNAUX EXISTANTS, jamais d'un jugement neuf. Chaque règle dit
// QUI est convoqué et POURQUOI — et le « qui » n'est pas toujours l'outil, c'est tout l'intérêt.
export function convoquer({ reconsider = [], nivellement = null, objectifsRows = [], neverUsed = [] } = {}) {
  const convocations = [];
  for (const f of reconsider) {
    const jamaisSollicite = f.reasons.some((r) => /jamais sollicité/.test(r));
    const stagnant = f.reasons.some((r) => /stagnant/.test(r));
    // LE RETOURNEMENT QUI COMPTE : « jamais sollicité » convoque l'AGENT, pas l'outil. Un outil ne
    // peut pas se faire appeler tout seul, et le reprocher à l'outil serait accuser la victime.
    if (jamaisSollicite) {
      convocations.push({
        qui: "agent", sujet: f.slug, motif: "jamais-sollicite",
        question: `pourquoi « ${f.slug} » n'a-t-il jamais été appelé ? Est-il inutile, mal nommé, mal placé dans le catalogue, ou est-ce moi qui ne pense pas à lui ?`,
        raisons: f.reasons,
      });
    }
    if (stagnant && !jamaisSollicite) {
      convocations.push({
        qui: "outil", sujet: f.slug, motif: "stagne",
        question: `« ${f.slug} » n'a pas bougé quand le reste du projet bougeait : est-il fini, oublié, ou dépassé ?`,
        raisons: f.reasons,
      });
    }
  }
  for (const r of objectifsRows) {
    if (r.statut !== "en dessous") continue;
    convocations.push({
      qui: "outil", sujet: r.entite, motif: "objectif-manque",
      question: `l'objectif chiffré de « ${r.entite} » n'est pas atteint sur sa période : l'objectif était-il mal calibré, ou l'outil ne sert-il pas ?`,
      raisons: [`objectif en dessous (objectifs-vs-resultats)`],
    });
  }
  // L'UTILISATEUR est convoqué sur ce qui ne dépend que de lui : une exigence qu'il a posée et que
  // seule une décision humaine peut lever. Jamais sur une exécution, qui n'est pas son travail.
  if (nivellement?.mesurable) {
    for (const l of nivellement.lignes) {
      if (l.part !== null && l.part < 50) {
        convocations.push({
          qui: "utilisateur", sujet: l.cle, motif: "ne-progresse-pas",
          question: `moins de la moitié des outils concernés (${l.atteignent}/${l.concernes}) tiennent l'exigence « ${l.exige} » : faut-il la niveler partout, ou l'exigence est-elle trop large ?`,
          raisons: [l.pourquoi],
        });
      }
    }
  }
  return convocations;
}

// LA CLÔTURE — le cœur de « l'agent ne doit pas faire taire l'alerte ».
export function cloreConvocation(convocation = {}, cloture = {}) {
  const { parUtilisateur = false, date = null, raison = null } = cloture;
  if (!parUtilisateur) {
    return { close: false, relayee: true,
      pourquoi: `TENTATIVE DE CLÔTURE SANS L'UTILISATEUR sur « ${convocation.sujet} » — une convocation ne se clôt qu'avec son accord daté. L'alerte reste ouverte ET cette tentative est nommée, jamais avalée : un agent qui écrit lui-même « traité » fait disparaître l'alerte sans que personne d'autre l'ait vue.` };
  }
  if (!date || !raison) {
    return { close: false, relayee: true,
      pourquoi: `clôture refusée sur « ${convocation.sujet} » : ${!date ? "aucune date" : "aucune raison écrite"}. Un écart sans raison n'est pas une décision, c'est un abandon déguisé (Article 28).` };
  }
  return { close: true, relayee: false, date, raison, pourquoi: `close le ${date} par l'utilisateur : ${raison}` };
}

// ————————————————————————————————————————————————————————————————————————
// LE NIVELLEMENT — ce que chaque CLASSE exige (2026-09-24, chantier 2.1 du plan de nuit)
// ————————————————————————————————————————————————————————————————————————
//
// DEMANDE DE L'UTILISATEUR, et elle est double. La première moitié est le chantier 2.1 : « par
// classe, quelle force de garantie minimale exiger, et qui ne l'atteint pas ». La seconde est la
// précision qu'il a apportée à l'Article 24 : « si un nouveau script arrive, toutes les
// fonctionnalités et paramètres/certifications sont appliquées au nouvel outil qui rejoint
// l'équipe. Tous les outils et scripts sont bien calibrés pour accueillir des évolutions, jamais
// de listes ou fonctionnalités figées. »
//
// CE QUE CETTE TABLE CORRIGE, DANS CE FICHIER MÊME, ÉCRIT UNE HEURE PLUS TÔT : les trois premières
// exigences vivaient en `if` dans `ecartsDuRecensement()`, ce qui est exactement la liste figée que
// l'Article 24 interdit. Une quatrième exigence aurait demandé de rouvrir la fonction, et n'aurait
// couvert que les outils auxquels j'aurais pensé sur le moment. Ici, elle s'écrit en UN endroit et
// s'applique immédiatement à TOUS, y compris à ceux écrits avant elle — et à celui de demain.
//
// UNE EXIGENCE SE LIT COMME UNE IMPLICATION : « si tu es ceci, alors tu dois aussi être cela ».
// `sApplique` dit à qui, `exige` dit quelle classe est due, `pourquoi` dit ce que ça coûte de ne
// pas l'avoir — jamais un reproche, toujours la conséquence.
export const EXIGENCES_PAR_CLASSE = [
  { cle: "outil-declare-sa-marge", exige: "declare-sa-fiabilite",
    sApplique: (l) => l.type === "outil",
    pourquoi: "outil qui ne déclare jamais sa marge d'erreur — ses chiffres se lisent comme des certitudes" },
  { cle: "scanner-sait-refuser", exige: "refuse-de-mesurer",
    sApplique: (l) => l.type === "outil" && l.classes.includes("scanne-le-depot"),
    pourquoi: "scanne le dépôt sans jamais savoir répondre « pas mesuré » : que rend-il le jour où il ne peut pas regarder ? (leçon L5)" },
  { cle: "outil-compte-son-usage", exige: "compte-son-usage",
    sApplique: (l) => l.type === "outil",
    pourquoi: "outil qui n'enregistre jamais son propre usage : personne ne pourra constater qu'il n'a jamais servi, et c'est le KPI que tool-brain rend à chaque Ronde" },
  { cle: "scanner-conclut", exige: "conclut-en-plan-daction",
    sApplique: (l) => l.type === "outil" && l.classes.includes("scanne-le-depot"),
    pourquoi: "scanne et rapporte sans jamais conclure par un plan d'action : un rapport produit ressemble à un problème traité (Article 28)" },
];

// QUI N'ATTEINT PAS SON DÛ, classe par classe — la seconde moitié exacte du chantier 2.1. Le
// dénominateur est CELUI DE L'EXIGENCE, jamais la population entière : dire « 12 outils sur 82 »
// pour une exigence qui ne concerne que les 32 qui scannent serait un taux juste sur le papier et
// faux sur le fond, exactement le défaut que cette campagne poursuit.
export function nivellementParClasse(recensement, exigences = EXIGENCES_PAR_CLASSE) {
  if (!recensement?.mesurable) return { mesurable: false, pourquoi: recensement?.pourquoi ?? "aucun recensement à niveler" };
  const lignes = exigences.map((ex) => {
    const concernes = recensement.lignes.filter((l) => ex.sApplique(l));
    const manquants = concernes.filter((l) => !l.classes.includes(ex.exige));
    return {
      cle: ex.cle, exige: ex.exige, pourquoi: ex.pourquoi,
      concernes: concernes.length,
      atteignent: concernes.length - manquants.length,
      manquants: manquants.map((l) => l.chemin),
      // Un taux sur un dénominateur d'un ou deux ne veut rien dire : il est rendu, mais accompagné
      // de son dénominateur, jamais seul (même discipline que SMART-CONSO-TOKEN).
      part: concernes.length ? Math.round(((concernes.length - manquants.length) / concernes.length) * 100) : null,
    };
  });
  return { mesurable: true, lignes,
    horsPortee: "une exigence dit ce qu'une classe APPELLE, jamais ce qu'un fichier précis devrait faire : un outil peut légitimement n'avoir aucun chiffre heuristique à nuancer. La liste est un point de départ, jamais une liste de coupables (Article 19)." };
}

// ===========================================================================================
// L'UNIFORMISATION PAR FAMILLE  (2026-09-24, chantier 2.2 du plan de nuit)
// ===========================================================================================
//
// La demande : « uniformiser par couche / groupe / famille ». Elle vient APRÈS le nivellement
// (2.1) et ce n'est pas la même mesure, malgré l'apparence — la différence est le cœur du
// mécanisme, pas un détail :
//
//   · Le NIVELLEMENT compare chaque outil à une exigence DÉCLARÉE, écrite d'avance dans
//     EXIGENCES_PAR_CLASSE. Il répond : « la règle est-elle tenue ? »
//   · L'UNIFORMISATION ne connaît aucune règle. Elle regarde ce qu'une famille FAIT DÉJÀ
//     majoritairement, et signale les membres qui s'en écartent. Elle répond : « pourquoi celui-ci
//     fait-il autrement que ses semblables ? »
//
// La seconde trouve ce que la première ne peut pas voir : une habitude que personne n'a jamais
// écrite en règle, et à laquelle presque tout le monde se conforme sauf deux. C'est exactement
// l'Article 24 appliqué au seuil lui-même — la norme est DÉRIVÉE de la population, jamais recopiée.
//
// TROIS GARDE-FOUS CONTRE L'ACCUSATION À TORT (leçon L4 : un garde-fou qui accuse à tort cesse
// d'être lu) :
//   1. Une famille de moins de trois membres n'est PAS mesurée — une « majorité » de deux ne dit
//      rien, et le taux qu'on en tirerait ressemblerait pourtant à une mesure.
//   2. Une habitude portée par moins de la majorité n'est pas une habitude : ce n'est pas un écart
//      que deux outils sur dix fassent quelque chose, c'est une minorité, et la signaler
//      reviendrait à accuser les huit autres.
//   3. Une habitude UNANIME ne produit aucun écart : rien à uniformiser.
//
// Et le résultat est une QUESTION, jamais un verdict : un outil peut avoir une raison excellente de
// s'écarter de sa famille (Article 19), et cet outil ne la connaît pas.

export const MAJORITE_FAMILLE = 0.6;
export const TAILLE_MIN_FAMILLE = 3;

export function uniformisationParFamille(recensement, { majorite = MAJORITE_FAMILLE, tailleMin = TAILLE_MIN_FAMILLE } = {}) {
  if (!recensement?.mesurable) return { mesurable: false, pourquoi: recensement?.pourquoi ?? "aucun recensement à uniformiser" };
  const parFamille = new Map();
  for (const l of recensement.lignes) {
    const f = l.type ?? "type-inconnu";
    if (!parFamille.has(f)) parFamille.set(f, []);
    parFamille.get(f).push(l);
  }
  const toutesLesClasses = [...new Set(recensement.lignes.flatMap((l) => l.classes ?? []))];
  const familles = [];
  for (const [nom, membres] of parFamille) {
    if (membres.length < tailleMin) {
      familles.push({ famille: nom, membres: membres.length, mesurable: false, habitudes: [], ecarts: [],
        pourquoi: `${membres.length} membre(s) : en dessous de ${tailleMin}, une « majorité » ne veut rien dire et le taux qu'on en tirerait ressemblerait pourtant à une mesure` });
      continue;
    }
    const habitudes = []; const ecarts = [];
    for (const classe of toutesLesClasses) {
      const porteurs = membres.filter((m) => (m.classes ?? []).includes(classe));
      const part = porteurs.length / membres.length;
      if (part < majorite) continue;              // pas une habitude de famille
      habitudes.push({ classe, part: Math.round(part * 100), porteurs: porteurs.length, sur: membres.length });
      if (porteurs.length === membres.length) continue;   // unanime : rien à uniformiser
      const absents = membres.filter((m) => !(m.classes ?? []).includes(classe));
      ecarts.push({ classe, part: Math.round(part * 100),
        chemins: absents.map((m) => m.chemin),
        question: `${absents.length} membre(s) de la famille « ${nom} » ne portent pas « ${classe} », que ${Math.round(part * 100)} % de leurs semblables portent : une raison assumée, ou un oubli ?` });
    }
    familles.push({ famille: nom, membres: membres.length, mesurable: true, habitudes, ecarts });
  }
  familles.sort((a, b) => b.membres - a.membres);
  const totalEcarts = familles.reduce((n, f) => n + f.ecarts.length, 0);
  return { mesurable: true, familles, totalEcarts,
    horsPortee: "la norme est DÉRIVÉE de ce que la famille fait déjà, jamais d'une règle écrite ailleurs — ce qui veut dire qu'une famille entière peut être uniformément mauvaise sans qu'un seul écart apparaisse. Cette mesure trouve les exceptions, jamais les habitudes qui mériteraient d'être changées : pour ça, c'est le nivellement (2.1) qui parle. Et chaque écart est une QUESTION : un outil peut avoir une excellente raison de s'écarter de ses semblables (Article 19)." };
}

export function formatUniformisationLines(u) {
  if (!u?.mesurable) return [`Uniformisation : NON MESURÉE — ${u?.pourquoi ?? "pas de recensement"}`];
  const L = [`${u.totalEcarts} écart(s) d'uniformité, sur ${u.familles.filter((f) => f.mesurable).length} famille(s) mesurable(s).`];
  for (const f of u.familles) {
    if (!f.mesurable) { L.push(`· ${f.famille} — non mesurée : ${f.pourquoi}`); continue; }
    // DEUX FAÇONS DE N'AVOIR AUCUN ÉCART, et les dire pareil serait un faux vert de plus : une
    // famille dont toutes les habitudes sont unanimes est effectivement uniforme ; une famille qui
    // n'a AUCUNE habitude commune n'a rien dont s'écarter, ce qui est l'exact contraire d'un
    // bulletin de santé. Le premier jet écrivait « 0 habitude de famille, toutes unanimes » —
    // une phrase qui se contredit elle-même et se lit comme un vert.
    if (!f.ecarts.length) {
      L.push(f.habitudes.length
        ? `· ${f.famille} (${f.membres}) — ${f.habitudes.length} habitude(s) de famille, toutes unanimes : rien à uniformiser.`
        : `· ${f.famille} (${f.membres}) — AUCUNE habitude commune : pas une seule classe portée par la majorité, donc rien dont s'écarter. Ce n'est pas « cette famille est uniforme », c'est « cette famille ne partage rien de mesurable ».`);
      continue;
    }
    L.push(`· ${f.famille} (${f.membres} membres) :`);
    for (const e of f.ecarts) L.push(`    ? ${e.question}\n      ${e.chemins.join(", ")}`);
  }
  return L;
}

// DEUX NATURES D'ÉCART, ET LES CONFONDRE ÉTAIT UNE ERREUR QU'UN TEST A ATTRAPÉE. J'avais écrit que
// tout écart devait être une question, en reprenant la règle qu'Abraham applique à la pertinence
// d'une règle. Elle ne vaut pas ici telle quelle : « cet outil n'appelle jamais
// printReliabilityNotice » est un FAIT mécaniquement vérifié, pas un avis, et le déguiser en
// question l'affaiblirait sans rien protéger. « Reste-t-il une raison que ce script existe » est en
// revanche un jugement que l'outil n'a pas à rendre. Le CONSTAT se mesure, la QUESTION se pose —
// et c'est exactement la frontière de l'Article 28 entre ce qui devient une tâche et ce qui monte
// à l'arbitrage.
export function ecartsDuRecensement(recensement, exigences = EXIGENCES_PAR_CLASSE) {
  if (!recensement?.mesurable) return [];
  const out = [];
  for (const l of recensement.lignes) {
    if (l.type === "execution-directe-non-documentee") {
      const cite = l.portes?.includes("nommé par la documentation, sans commande de lancement écrite");
      out.push(cite
        ? { chemin: l.chemin, nature: "constat", question: "la documentation en parle mais n'écrit nulle part la commande pour le lancer — un outil « à lancer à la main » dont la main ne sait pas quoi taper" }
        : { chemin: l.chemin, nature: "question", question: "personne ne l'importe, aucun document ne le nomme, aucune commande ne le lance : reste-t-il une raison qu'il existe ?" });
    }
    if (l.type === "bibliotheque-solitaire") out.push({ chemin: l.chemin, nature: "question", question: "importée par un seul fichier : à fusionner dans son unique client, ou bien il lui manque les clients qu'elle attendait ?" });
    if (l.type === "utilitaire-sans-fiche") out.push({ chemin: l.chemin, nature: "question", question: "exécutable et nommé par AUCUN document du dépôt : outil qu'on a oublié de documenter, ou script jetable qui a survécu ?" });

    // LES EXIGENCES DE CLASSE, lues dans la table et jamais réécrites ici — c'est ce qui fait
    // qu'une exigence nouvelle s'applique à TOUS les outils le jour où elle est écrite.
    for (const ex of exigences) {
      if (!ex.sApplique(l)) continue;
      if (l.classes.includes(ex.exige)) continue;
      out.push({ chemin: l.chemin, nature: "constat", exigence: ex.cle, question: ex.pourquoi });
    }
  }
  return out;
}

// ————————————————————————————————————————————————————————————————————————
// LA REDONDANCE ENTRE OUTILS (2026-09-24, chantier 7 du plan de nuit)
// ————————————————————————————————————————————————————————————————————————
//
// DEMANDE DE L'UTILISATEUR : réduire le nombre d'outils en mesurant la redondance — et il cite
// l'expérience qui lui a donné l'idée, MOÏSE/THE-KING : « selon le découpage demandé, c'est
// charter-spy qui aurait dû être étoffé, et moïse qui peut l'appeler ». Ce jour-là, la mesure avait
// tranché ce qu'aucune intuition n'arrivait à trancher : 30 des 40 fonctions de Moïse ne dépendaient
// d'aucune particularité de la charte.
//
// CE QUE CETTE MESURE N'EST PAS, et la distinction décide de son utilité : CLONE-HUNTER mesure des
// BLOCS DE CODE recopiés. Celle-ci mesure une redondance FONCTIONNELLE — deux outils qui répondent
// à la même question, même s'ils ne partagent pas une ligne. Ce sont deux problèmes différents : on
// factorise le premier, on FUSIONNE ou on sépare mieux le second.
//
// ELLE NE CONCLUT JAMAIS, ET C'EST NON NÉGOCIABLE. Un outil capable d'écrire « ces deux-là font
// double emploi » verrait un jour ce jugement appliqué par personne en particulier — et l'expérience
// MOÏSE/THE-KING dit exactement le contraire de ce qu'une similarité brute aurait suggéré : le
// doublon annoncé n'en était pas un (leur découpage en unités appelait déjà la même primitive
// partagée), et le vrai défaut était ailleurs, un seuil recopié deux fois. **La mesure montre où
// regarder ; elle ne dit jamais quoi fusionner.**
export const SEUIL_REDONDANCE = 0.34;

export function motsDUneDemande(texte = "") {
  return new Set(
    String(texte).toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .split(/[^a-z0-9]+/)
      .filter((m) => m.length > 3 && !MOTS_VIDES_REDONDANCE.has(m)),
  );
}

// Les mots que TOUTES les prestations partagent ne disent rien d'une redondance : sans les écarter,
// « outil », « projet » et « vérifier » rapprocheraient n'importe quelle paire.
export const MOTS_VIDES_REDONDANCE = new Set([
  "outil", "outils", "projet", "verifier", "verification", "savoir", "avant", "apres", "toute",
  "tout", "tous", "jamais", "chaque", "dans", "cette", "leur", "avec", "sans", "pour", "plus",
  "quoi", "quel", "quelle", "quels", "faire", "fait", "appel", "appels",
]);

// ===========================================================================================
// L'ICEBERG — trois groupes, et une frontière qui se DÉRIVE (2026-09-24, tâche #707)
// ===========================================================================================
// LA DEMANDE, dans ses mots : « je veux faire un partage iceberg entre ce qui est visible : ce qui
// porte un nom, ce qu'on a créé ensemble, ce qui fait partie des membres, et ce qui est invisible :
// la tuyauterie, la plomberie, l'infrastructure ».
//
// LE TERRAIN QUI L'A MOTIVÉ, mesuré le soir même : 75 scripts, dont 30 que la charte ne mentionne
// nulle part. Et ces 30 ne sont pas homogènes — une bonne moitié sont de vrais outils avec un nom
// et une fonction, que rien ne présente. Ce ne sont pas des tuyaux, ce sont des membres de l'équipe
// dont personne n'a jamais fait les présentations.
//
// TROIS GROUPES, et le deuxième est TEMPORAIRE PAR CONSTRUCTION — il doit se vider :
//   · MEMBRE       — l'utilisateur peut le convoquer, et quelque chose le lui présente
//   · OUBLIÉ       — il peut le convoquer, mais RIEN ne le lui présente. À faire passer par le
//                    process primitif, un par un. Un groupe qui ne se vide jamais est un aveu.
//   · PLOMBERIE    — appelé par d'autres outils, jamais convoqué. Organisé a minima, pas de fiche.
//   · INFRASTRUCTURE — lancé par la MACHINE (package.json, crochet git), jamais par l'utilisateur.
//
// LE TROISIÈME SIGNAL, et c'est lui qui a demandé une vraie décision. Sans lui, `pnpm-install` et
// `install-ci` ressortaient « convocables » : ils s'exécutent, donc le test les prenait pour des
// outils. Or personne ne les convoque — la machine les lance. L'utilisateur a tranché le critère :
// « est-ce MOI qui le lance, ou la machine ? ». Il se DÉRIVE de package.json et des crochets git
// réels, jamais d'une liste de noms écrite à la main qui se périmerait au premier script ajouté
// (Article 24).
export const GROUPES_ICEBERG = {
  membre: { rang: 3, quoi: "l'utilisateur peut le convoquer, et quelque chose le lui présente" },
  oublie: { rang: 2, quoi: "convocable, mais rien ne le présente — groupe TEMPORAIRE, il doit se vider par le process primitif" },
  infrastructure: { rang: 1, quoi: "lancé par la machine (package.json, crochet git), jamais par l'utilisateur" },
  plomberie: { rang: 0, quoi: "appelé par d'autres outils, jamais convoqué — organisé a minima" },
};

// La MENTION que chaque fichier porte en tête, comparée ensuite à ce qui est dérivé. Deux sources
// qui doivent dire la même chose : un désaccord est signalé plutôt que tranché en silence — c'est
// le patron le plus sûr, et l'utilisateur l'a choisi en connaissant son coût (75 fichiers à annoter).
export const MOTIF_MENTION_ICEBERG = /^\s*\/\/\s*ICEBERG\s*:\s*(membre|oublie|oublié|plomberie|infrastructure)\b/mi;

export function mentionIceberg(source) {
  const m = String(source ?? "").match(MOTIF_MENTION_ICEBERG);
  return m ? m[1].toLowerCase().replace("oublié", "oublie") : null;
}

// Ce que la MACHINE lance, lu dans package.json et dans les crochets git — jamais devine.
export function lanceParLaMachine({ packageJson = "", crochets = [] } = {}) {
  const dedans = [packageJson, ...crochets].join("\n");
  const noms = new Set();
  for (const m of dedans.matchAll(/scripts\/([a-z0-9._/-]+)\.(?:mjs|sh)/gi)) noms.add(m[1].replace(/^hooks\//, ""));
  return noms;
}

// PREMIER PASSAGE RÉEL, ET IL A ÉCHOUÉ SUR LES DEUX SIGNAUX — les deux échecs sont gardés ici.
//
// (1) « lancé par la machine » rangeait check-house, ecotoken, kpi-report et moise-tables-de-loi en
// INFRASTRUCTURE. C'est faux : le crochet git les lance, ET l'utilisateur peut les appeler. Être
// lancé par un automatisme n'empêche pas d'être convocable — il faut la CONJONCTION : lancé par la
// machine ET présenté nulle part.
//
// (2) « a un point d'entrée » rangeait check-spirit, the-final-judge et check-gemini-quota en
// PLOMBERIE, alors que la charte donne littéralement leur commande. Ce sont des scripts à effet de
// bord au niveau racine, sans garde `import.meta.url` — le motif ne pouvait pas les voir.
//
// D'OÙ LE SIGNAL LE PLUS VRAI, qui remplace la devinette : une COMMANDE DOCUMENTÉE. Si un document
// écrit `node scripts/X.mjs`, alors X est convocable — c'est une preuve, pas une heuristique sur la
// forme du fichier. Le point d'entrée ne sert plus que de repli quand aucune commande n'est écrite.
export const MOTIF_COMMANDE = (slug) => new RegExp(`node\\\\s+scripts/${slug.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\\\.mjs`, "i");

export function classerIceberg(fichiers = [], { lire, offert = "", machine = new Set() } = {}) {
  const lignes = [];
  for (const f of fichiers) {
    const slug = f.replace(/\.mjs$/, "");
    let src = "";
    try { src = lire(f); } catch { /* illisible : declare non mesurable plus bas */ }
    if (!src) { lignes.push({ slug, groupe: null, mesurable: false, pourquoi: "fichier illisible — jamais classé au jugé" }); continue; }

    const commande = MOTIF_COMMANDE(slug).test(offert);
    const pointDentree = (src.includes("import.meta.url") && src.includes("process.argv")) || src.startsWith("#!");
    const convocable = commande || pointDentree;
    // UNE MENTION DU NOM NE VAUT PLUS PRÉSENTATION QUAND LE FICHIER SE DÉCLARE PLOMBERIE
    // (2026-09-24, décision de l'utilisateur sur pnpm-install). Le piège était le même que la
    // leçon L24 prise à l'envers : en écrivant le paragraphe qui EXPLIQUE qu'un script n'est pas
    // un outil, on le faisait basculer en « membre » — la sonde compte un mot, elle ne lit pas ce
    // que la phrase affirme. Une déclaration explicite en tête de fichier tranche donc le cas.
    const seDeclarePlomberie = mentionIceberg(src) === "plomberie";
    const presente = commande || (!seDeclarePlomberie && new RegExp(`\\b${slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(offert));
    const parLaMachine = machine.has(slug) || machine.has(f.replace(/\.mjs$/, ""));

    // UNE DÉCLARATION « PLOMBERIE » L'EMPORTE SUR LE POINT D'ENTRÉE, et uniquement dans ce sens.
    // Décision de l'utilisateur du 2026-09-24 sur pnpm-install : il A un point d'entrée, mais ses
    // seuls arguments sont des drapeaux internes qu'aucun humain ne tape. La mesure ne peut pas
    // lire ça — elle voit une porte, pas qui a le droit de la pousser. Le fichier, lui, le sait.
    // L'inverse resterait un désaccord rapporté : un fichier qui se déclarerait MEMBRE sans être
    // présenté nulle part mentirait sur un fait vérifiable, et la mesure aurait raison contre lui.
    const derive = presente ? "membre"
      : parLaMachine ? "infrastructure"
      : (convocable && !seDeclarePlomberie) ? "oublie"
      : "plomberie";
    const declare = mentionIceberg(src);
    lignes.push({ slug, groupe: derive, declare, mesurable: true,
      desaccord: declare !== null && declare !== derive,
      pourquoi: presente ? (commande ? "sa commande est écrite quelque part — preuve de convocabilité" : "présenté quelque part")
        : parLaMachine ? "lancé par la machine, et présenté nulle part — personne ne le convoque"
        : convocable ? "convocable, mais RIEN ne le présente"
        : "aucun point d'entrée, aucune commande écrite — appelé par un autre outil" });
  }
  return lignes;
}

// ============================================================================================
// LES DEUX SYSTÈMES DE FAMILLES QUI NE SE PARLENT PAS (2026-09-24, tâche #754)
// ============================================================================================
// Trouvé en rassemblant les notes de classification (#742), et mesuré plutôt que soupçonné :
// `AGENT_CATEGORIES` (lib-shell) range les outils en « Suites », `REGISTRIES[].family`
// (doc-report) les range en « familles », et UN SEUL nom leur est commun. Deux rangements du même
// paysage, écrits à deux moments, jamais confrontés — et les populations diffèrent aussi, l'un
// couvrant 40 outils, l'autre 44.
//
// CE QUE CETTE FONCTION FAIT, ET CE QU'ELLE NE FAIT PAS. Elle RAPPORTE l'écart, elle ne choisit
// jamais le système survivant : nommer une famille est un nommage, donc une décision de
// l'utilisateur (règle du 2026-09-24, portée par l'agent des noms). Un outil qui trancherait tout
// seul aurait rebaptisé six Suites dans le dos de celui qui les a nommées.
//
// POURQUOI C'EST LE PREMIER GESTE DU CHANTIER : tant que deux rangements coexistent, tout axe
// ajouté par-dessus hérite de l'ambiguïté — on empilerait sur un sol qui bouge.
// Lecture de la FAMILLE portée par une catégorie, jamais du mot « Suite ».
// Corrigé le 2026-09-25 (#754) sur le fil rouge du projet, rencontré ici pour la énième fois : la
// première version cherchait /(?:Suite|La Cour)/ dans le libellé. Le jour où les six Suites ont
// été remplacées par les neuf familles des registres — donc le jour où le désaccord a été CORRIGÉ —
// la sonde a cessé de matcher et a rendu « ✅ les deux rangements se recouvrent » sur UN seul nom
// commun. Un contrôle empêché de regarder rend exactement ce que rend un contrôle qui n'a rien
// trouvé, et ce vert-là est plus dangereux qu'aucun contrôle parce qu'il occupe la place.
// La forme d'une catégorie est « Rang — Famille » : la famille se lit APRÈS le tiret cadratin, et
// une catégorie sans tiret n'a pas de famille du tout — ce qui se DIT (sansFamille), jamais se tait.
// Le découpage vit dans lib-shell, à côté du tableau qu'il lit : deux découpages du même libellé
// auraient fini par diverger. Re-exporté ici parce que c'est cet outil qui s'en sert pour comparer.
export { SEPARATEUR_RANG_FAMILLE, familleDeLaCategorie } from "./lib-shell.mjs";

export function comparerLesFamilles({ categories = {}, registres = [] } = {}) {
  const suites = new Map();
  const sansFamille = [];
  for (const [slug, cat] of Object.entries(categories)) {
    const f = familleDeLaCategorie(cat);
    if (!f) { sansFamille.push(slug); continue; }
    (suites.get(f) ?? suites.set(f, []).get(f)).push(slug);
  }
  const familles = new Map();
  for (const r of registres) {
    if (!r?.family) continue;
    (familles.get(r.family) ?? familles.set(r.family, []).get(r.family)).push(r.slug);
  }
  if (!suites.size || !familles.size) {
    // La raison est PRÉCISÉE plutôt que générique : « aucun outil ne porte de famille » et
    // « le registre est illisible » appellent deux gestes opposés, et les confondre sous un seul
    // message renverrait l'enquête au mauvais endroit.
    const pourquoi = !suites.size && sansFamille.length
      ? `aucun des ${sansFamille.length} outils rangés ne porte de famille (forme attendue « Rang — Famille ») — il n'y a donc rien à comparer, ce qui n'est pas la même chose qu'un accord`
      : "l'un des deux registres est vide ou illisible — une comparaison rendue sur un seul côté ressemblerait à un accord parfait, ce qui est le contraire de la vérité";
    return { mesurable: false, pourquoi, sansFamille: sansFamille.sort() };
  }
  const nomsSuites = [...suites.keys()];
  const nomsFamilles = [...familles.keys()];
  const communs = nomsSuites.filter((n) => nomsFamilles.includes(n));
  const avecCategorie = new Set(Object.keys(categories));
  const avecRegistre = new Set(registres.map((r) => r.slug).filter(Boolean));
  return {
    mesurable: true,
    suites: nomsSuites, familles: nomsFamilles, communs,
    sansFamille: sansFamille.sort(),
    seulementCategories: nomsSuites.filter((n) => !nomsFamilles.includes(n)).sort(),
    seulementRegistres: nomsFamilles.filter((n) => !nomsSuites.includes(n)).sort(),
    sansRegistre: [...avecCategorie].filter((s) => !avecRegistre.has(s)).sort(),
    sansCategorie: [...avecRegistre].filter((s) => !avecCategorie.has(s)).sort(),
    divergent: communs.length < Math.min(nomsSuites.length, nomsFamilles.length) || sansFamille.length > 0,
  };
}

// #755 (2026-09-25) — le garde-fou que l'Article 24 exige derrière comparerLesFamilles().
// POURQUOI il ne suffisait pas de comparer les deux LISTES de noms : le 2026-09-25, les neuf noms
// se recouvraient parfaitement des deux côtés pendant qu'un outil pouvait très bien être rangé
// « Coordination » dans l'organigramme et « Gouvernance interne » dans son registre. Un accord de
// VOCABULAIRE ressemble trait pour trait à un accord de RANGEMENT, et seul le second est la
// question posée. La comparaison se fait donc outil par outil, jamais nom par nom.
// Ce qui rend ce garde-fou évolutif (Article 24) : il ne connaît AUCUNE famille par cœur — il lit
// les deux côtés à l'exécution, donc une dixième famille créée demain est comparée sans qu'on
// touche à cette fonction.
// ============================================================================================
// LE POIDS DE CHAQUE OUTIL, ET LE GAIN D'UNE RÉDUCTION (2026-09-25, tâche #744)
// ============================================================================================
// SES TROIS DEMANDES, dans ses mots : « on doit etre capable dans leur fiche complete d'indiquer le
// nombre de lignes de code, le poids qu'il pese dans le projet [...] si demain on doit reduire
// sensiblement la taille de l'agence et retrograder certains agents, on doit pouvoir anticiper le
// gain ».
//
// POURQUOI CETTE MESURE N'A DE SENS QU'AVEC LE 5e AXE, et pourquoi elle arrive après lui : un gain
// en lignes de code ne dit RIEN si on ignore qui perd quoi. Retirer 2 000 lignes que personne ne lit
// et retirer 2 000 lignes dont l'utilisateur dépend sont deux décisions opposées avec le même
// chiffre. Le poids seul est un chiffre qui a l'air d'une décision.
//
// TROIS ÉTATS SUR LE COÛT DU RETRAIT, jamais deux :
//   · LIBRE       — personne d'autre ne l'importe et l'utilisateur n'en lit rien : le retirer ne
//                   coûte que ce qu'il apportait à lui-même.
//   · ENTRAÎNANT  — d'autres outils l'importent : le retirer les casse, et le vrai gain se calcule
//                   sur la grappe entière, jamais sur le fichier seul.
//   · VISIBLE     — l'utilisateur en lit la sortie : le retrait se sent tout de suite, quel que
//                   soit le nombre de lignes.
// Un outil peut être ENTRAÎNANT et VISIBLE à la fois — c'est le cas le plus cher, et le nommer
// évite de le confondre avec un petit fichier anodin.
export const COUTS_DE_RETRAIT = {
  libre: { quoi: "personne ne l'importe, l'utilisateur n'en lit rien", consequence: "le gain est net" },
  entrainant: { quoi: "d'autres outils l'importent", consequence: "le retirer les casse : compter la grappe, jamais le fichier seul" },
  visible: { quoi: "l'utilisateur en lit la sortie", consequence: "le retrait se sent immédiatement, quel que soit le nombre de lignes" },
};

export function poidsDesOutils(lignesRecensement = [], { destinatairesParSlug = new Map() } = {}) {
  if (!lignesRecensement.length) {
    return { mesurable: false, pourquoi: "aucun script recensé — un total de zéro ligne se lit comme un dépôt vide, ce qui n'est jamais ce qu'on voulait dire" };
  }
  const illisibles = lignesRecensement.filter((l) => l.lignes == null).length;
  const total = lignesRecensement.reduce((s, l) => s + (l.lignes ?? 0), 0);
  if (!total) {
    return { mesurable: false, pourquoi: "aucune ligne comptée — les fichiers ont été listés mais pas lus, et un poids de zéro ressemble trait pour trait à un outillage inexistant" };
  }
  const outils = lignesRecensement.map((l) => {
    const slug = String(l.chemin).replace(/^scripts\//, "").replace(/\.mjs$/, "");
    const dest = destinatairesParSlug.get(slug) ?? [];
    const couts = [];
    if (dest.includes("autres-outils")) couts.push("entrainant");
    if (dest.includes("utilisateur")) couts.push("visible");
    if (!couts.length) couts.push("libre");
    return { slug, chemin: l.chemin, lignes: l.lignes ?? 0, part: (100 * (l.lignes ?? 0)) / total,
      importeurs: l.importeurs ?? 0, destinataires: dest, couts };
  }).sort((a, b) => b.lignes - a.lignes);
  const parCout = { libre: 0, entrainant: 0, visible: 0 };
  const lignesParCout = { libre: 0, entrainant: 0, visible: 0 };
  for (const o of outils) for (const c of o.couts) { parCout[c] += 1; lignesParCout[c] += o.lignes; }
  return { mesurable: true, total, illisibles, outils: outils.filter((o) => o.lignes > 0), parCout, lignesParCout };
}

export function formatPoidsLines(p, { top = 10 } = {}) {
  if (!p?.mesurable) return [`⚠️ NON MESURÉ — ${p?.pourquoi ?? "raison inconnue"}`];
  const L = [`${p.outils.length} outils · ${p.total} lignes d'outillage au total.${p.illisibles ? ` ⚠️ ${p.illisibles} fichier(s) illisible(s), non comptés — jamais comptés à zéro, ce qui les aurait fait passer pour vides.` : ""}`];
  L.push("");
  L.push(`Les ${top} plus lourds :`);
  for (const o of p.outils.slice(0, top)) L.push(`   ${String(o.lignes).padStart(5)} l. (${o.part.toFixed(1).padStart(4)} %)  ${o.slug.padEnd(28)} ${o.couts.join("+")}`);
  L.push("");
  L.push("LE GAIN D'UNE RÉDUCTION, par coût de retrait — et c'est ça qu'il demandait :");
  for (const [c, n] of Object.entries(p.parCout)) {
    L.push(`   ${String(n).padStart(3)} outil(s) · ${String(p.lignesParCout[c]).padStart(5)} lignes  ${c} — ${COUTS_DE_RETRAIT[c].quoi}`);
    L.push(`        → ${COUTS_DE_RETRAIT[c].consequence}`);
  }
  L.push("");
  L.push("CE QUE CE TABLEAU NE DIT PAS, et il faut le lire avec : un gain en lignes ne dit RIEN si on");
  L.push("ignore qui perd quoi. Retirer 2 000 lignes que personne ne lit et 2 000 lignes dont");
  L.push("l'utilisateur dépend sont deux décisions opposées avec le même chiffre. Un outil peut être");
  L.push("ENTRAÎNANT et VISIBLE à la fois : c'est le cas le plus cher, et il est compté dans les deux.");
  L.push("HORS PORTÉE : aucun outil n'est proposé au retrait ici. La mesure éclaire une décision, elle");
  L.push("ne la prend jamais — retirer un membre de l'équipe est un arbitrage humain.");
  L.push("POURQUOI CE COMPTE DIFFÈRE DE CELUI DES AXES JUSTE AU-DESSUS : le poids se calcule sur TOUT");
  L.push("scripts/ (crochets git et .sh compris), là où les axes ne portent que sur les .mjs du");
  L.push("dossier racine. Deux périmètres, deux questions — et les aligner aurait fait disparaître du");
  L.push("poids réel, ou inventé des axes pour des fichiers qui n'en ont pas.");
  return L;
}

// ============================================================================================
// 5e DISTINCTION — À QUI le résultat est destiné (2026-09-25, tâche #741)
// ============================================================================================
// SES MOTS : « il y a ceux qui aident le projet en entier, ou par défaut, ceux qui aident d'autres
// outils, ceux qui aident TOI et ceux qui aident MOI ». Quatre destinataires, et c'est un axe que
// les quatre autres ne disent pas : l'iceberg dit où RANGER, le moment dit QUAND, le domaine dit
// SUR QUOI, le type dit ce qu'un fichier EST — aucun ne dit à QUI le résultat sert.
//
// POURQUOI CET AXE COMPTE PLUS QUE LES AUTRES POUR LA SUITE, et c'est lui qui l'a vu : c'est le seul
// qui permette de chiffrer une réduction. « Combien d'outils puis-je retirer sans que personne le
// sente ? » n'a de sens qu'en sachant qui perd quoi.
//
// UN ENSEMBLE, JAMAIS UNE CASE — même discipline que les MOMENTS, et pour la même raison : un outil
// qui rend un rapport lu par l'utilisateur ET qui sert de bibliothèque à trois autres sert bien deux
// destinataires. Forcer une valeur unique effacerait la moitié de la réponse.
//
// CHAQUE DESTINATAIRE A SA PROPRE PREUVE, et aucune n'est une opinion :
//   · l'UTILISATEUR — l'outil est déclaré « rapport » dans FILE_WRITER_NATURES, ou écrit un fichier
//     dans docs/ : quelque chose sort et se lit.
//   · l'AGENT — il est consulté AVANT d'agir (le moment « avant-le-geste », déjà mesuré) : son
//     résultat sert à décider, pas à archiver.
//   · les AUTRES OUTILS — il est importé ailleurs : sa valeur est d'être réutilisé.
//   · le PROJET ENTIER — il tourne à chaque commit sans que personne le demande : son bénéfice est
//     le code lui-même, et personne ne le « lit ».
export const DESTINATAIRES = {
  utilisateur: { quoi: "l'utilisateur — il produit quelque chose qui se lit", preuve: "déclaré « rapport », ou écrit dans docs/" },
  agent: { quoi: "l'agent — il sert à DÉCIDER avant d'agir", preuve: "consulté au moment « avant-le-geste »" },
  "autres-outils": { quoi: "les autres outils — sa valeur est d'être réutilisé", preuve: "importé par au moins un autre script" },
  projet: { quoi: "le projet entier — personne ne le lit, il protège le code", preuve: "tourne à chaque commit via le crochet" },
};

export function destinatairesDeLOutil(slug, { source = "", natureFichier = null, moments = [], importePar = 0, machine = new Set() } = {}) {
  const pour = new Set();
  if (natureFichier === "rapport" || /["'`]docs\//.test(String(source))) pour.add("utilisateur");
  if (moments.includes("avant-le-geste")) pour.add("agent");
  if (importePar > 0) pour.add("autres-outils");
  if (machine.has(slug) || moments.includes("a-chaque-commit")) pour.add("projet");
  if (!pour.size) {
    // TROIS ÉTATS, JAMAIS DEUX : un outil dont aucune des quatre preuves ne se trouve n'est pas « au
    // service de personne » — c'est « on ne sait pas ». Le ranger d'office quelque part inventerait
    // une réponse ; le compter à zéro ferait croire à un outil inutile. Ni l'un ni l'autre n'est vrai.
    return { destinataires: [], mesurable: false,
      pourquoi: "aucune des quatre preuves ne se trouve — ni rapport, ni consultation avant le geste, ni import, ni passage au commit : c'est « on ne sait pas », jamais « il ne sert à personne »" };
  }
  return { destinataires: [...pour], mesurable: true };
}

export function formatDestinatairesLines(lignes = []) {
  const parDest = Object.fromEntries(Object.keys(DESTINATAIRES).map((d) => [d, 0]));
  let nonMesurables = 0;
  for (const l of lignes) {
    if (!l.mesurable) { nonMesurables += 1; continue; }
    for (const d of l.destinataires) parDest[d] += 1;
  }
  const L = [`${lignes.length} outil(s) examiné(s).`];
  for (const [d, n] of Object.entries(parDest).sort((a, b) => b[1] - a[1])) L.push(`   ${String(n).padStart(3)}  ${d} — ${DESTINATAIRES[d].quoi} (preuve : ${DESTINATAIRES[d].preuve})`);
  if (nonMesurables) {
    L.push("");
    L.push(`⚠️ ${nonMesurables} outil(s) dont le destinataire N'EST PAS MESURABLE — aucune des quatre preuves ne se trouve.`);
    L.push(`   Ce n'est pas « il ne sert à personne » : c'est « on ne sait pas », et les deux ne se rendent jamais pareil.`);
  }
  L.push("");
  L.push("À QUOI CET AXE SERT, et c'est lui qui l'a vu : c'est le SEUL qui permette de chiffrer une");
  L.push("réduction. « Combien d'outils puis-je retirer sans que personne le sente ? » n'a de sens");
  L.push("qu'en sachant qui perd quoi. Un outil qui ne sert qu'à d'autres outils ne coûte rien à");
  L.push("personne s'il part avec eux ; un outil que l'utilisateur lit manque immédiatement.");
  return L;
}

// ============================================================================================
// LE CADRAGE DU CHANTIER DE CLASSIFICATION (2026-09-25, tâche #743)
// ============================================================================================
// SA QUESTION, dans ses mots : « quel est la cible souhaitée ? à quelle classification finale on
// veut arriver et pourquoi ? quel est le lien avec l'organisation ? [...] quel est le signal qui
// nous dira que la classification est ok ». C'est LA question qui commande tout le chantier, et
// elle manquait : quatre axes ont été produits sans qu'on ait jamais écrit à quoi ils servent ni
// quand on s'arrête.
//
// CE QUE CETTE FONCTION APPORTE, et ce qu'elle n'apporte PAS. Elle ne décide pas de la cible —
// c'est un choix, donc le sien. Elle rend le SIGNAL DE FIN **mesurable** : pour chaque script,
// combien des axes il porte réellement, et combien de scripts sont complets. Sans ce chiffre, « la
// classification est-elle finie ? » est une impression ; avec lui, c'est un pourcentage qui bouge.
//
// LE CINQUIÈME AXE EST DÉCLARÉ MANQUANT plutôt que tu : « pour QUI cet outil travaille » (le jeu,
// l'Agence, les deux) a été MESURÉ le 2026-09-24 et n'a jamais reçu de domicile — aucun registre ne
// le porte. Le compter comme absent pour tout le monde serait faux ; ne pas en parler le ferait
// disparaître. Il est donc compté à part, comme un axe qui n'existe pas encore.
export const AXES_DE_CLASSIFICATION = [
  { cle: "iceberg", quoi: "à quel groupe il appartient (membre, oublié, infrastructure, plomberie)", porteur: "classerIceberg()" },
  { cle: "type", quoi: "ce que le fichier EST", porteur: "typeDuScript()" },
  { cle: "moment", quoi: "QUAND il intervient", porteur: "momentsDeLOutil()" },
  { cle: "domaine", quoi: "SUR QUOI il regarde", porteur: "domainesDeLOutil()" },
  { cle: "destinataire", quoi: "À QUI le résultat sert", porteur: "destinatairesDeLOutil()" },
];

// L'axe « destinataire » a reçu son domicile le 2026-09-25 (#741) : `DESTINATAIRES` ci-dessus. Il
// rejoint donc la liste des axes comptés. Celui qui reste sans domicile est un AUTRE : « pour quel
// PROJET il travaille » (le jeu, l'Agence, les deux) — mesuré le 2026-09-24, porté par aucun
// registre. Ne pas confondre les deux : « à QUI sert le résultat » et « pour QUEL projet » sont
// deux questions différentes, et les fondre aurait fait disparaître la seconde.
export const AXE_SANS_DOMICILE = {
  cle: "pour-quel-projet", quoi: "pour quel PROJET il travaille — le jeu, l'Agence, ou les deux",
  pourquoi: "mesuré le 2026-09-24, jamais rangé dans un registre : aucune constante ne le porte, donc il ne se lit nulle part. À ne pas confondre avec le destinataire (#741), qui dit à QUI le résultat sert et qui, lui, a désormais son domicile",
};

export function cadrageDeLaClassification(lignesIceberg = [], { axesParScript } = {}) {
  if (typeof axesParScript !== "function") {
    return { mesurable: false, pourquoi: "aucun lecteur d'axes fourni — rendre un pourcentage d'avancement sans lire un seul script donnerait un chiffre qui ressemble trait pour trait à une mesure" };
  }
  if (!lignesIceberg.length) {
    return { mesurable: false, pourquoi: "aucun script à mesurer — un dénominateur vide rend 100 % d'avancement, ce qui est le contraire de la vérité" };
  }
  const parScript = [];
  const manquantsParAxe = Object.fromEntries(AXES_DE_CLASSIFICATION.map((a) => [a.cle, 0]));
  let complets = 0, desaccords = 0;
  for (const l of lignesIceberg) {
    const axes = axesParScript(l) ?? {};
    const portes = AXES_DE_CLASSIFICATION.filter((a) => {
      const v = axes[a.cle];
      return Array.isArray(v) ? v.length > 0 : v != null && v !== "";
    }).map((a) => a.cle);
    for (const a of AXES_DE_CLASSIFICATION) if (!portes.includes(a.cle)) manquantsParAxe[a.cle] += 1;
    if (portes.length === AXES_DE_CLASSIFICATION.length) complets += 1;
    if (l?.desaccord) desaccords += 1;
    parScript.push({ script: l?.slug ?? l?.fichier ?? "?", portes, manque: AXES_DE_CLASSIFICATION.map((a) => a.cle).filter((c) => !portes.includes(c)) });
  }
  const total = lignesIceberg.length;
  return { mesurable: true, total, complets, desaccords, manquantsParAxe, parScript,
    tauxComplet: (100 * complets) / total,
    // LE SIGNAL DE FIN, tel qu'il a été proposé dans le suivi (#743) et qui reste à confirmer :
    // tout script porte ses axes SANS désaccord non arbitré. Le second volet — « chaque axe a servi
    // au moins une fois à une décision réelle » — n'est PAS mesurable ici et c'est dit, jamais
    // approximé : aucune trace mécanique ne relie un axe à la décision qu'il a changée.
    signalDeFin: { atteint: complets === total && desaccords === 0,
      volet1: `${complets}/${total} scripts portent les ${AXES_DE_CLASSIFICATION.length} axes, ${desaccords} désaccord(s) non arbitré(s)`,
      volet2NonMesurable: "« chaque axe a servi au moins une fois à une décision réelle » ne se mesure pas : rien ne relie mécaniquement un axe à la décision qu'il a changée. À juger à la main, ou à rendre mesurable par une trace explicite.",
    } };
}

export function formatCadrageLines(c) {
  if (!c?.mesurable) return [`⚠️ NON MESURÉ — ${c?.pourquoi ?? "raison inconnue"}`];
  const L = [];
  L.push(`${c.total} scripts mesurés · ${c.complets} portent les ${AXES_DE_CLASSIFICATION.length} axes (${c.tauxComplet.toFixed(1)} %) · ${c.desaccords} désaccord(s) non arbitré(s).`);
  L.push("");
  L.push("Ce qui manque, axe par axe :");
  for (const a of AXES_DE_CLASSIFICATION) L.push(`   ${String(c.manquantsParAxe[a.cle]).padStart(4)} script(s) sans « ${a.cle} » — ${a.quoi} (${a.porteur})`);
  L.push("");
  L.push(`⚠️ UN CINQUIÈME AXE N'A AUCUN DOMICILE : « ${AXE_SANS_DOMICILE.cle} » — ${AXE_SANS_DOMICILE.quoi}.`);
  L.push(`   ${AXE_SANS_DOMICILE.pourquoi}. Il n'entre donc pas dans le compte ci-dessus : le compter absent partout serait faux, ne pas en parler le ferait disparaître.`);
  L.push("");
  L.push("⚠️ UNE PART DE CE QUI MANQUE NE MANQUERA JAMAIS, et le dire change la cible :");
  L.push("   un script qui ne lit aucun chemin dans du code exécuté n'a pas de domaine à porter — ce n'est");
  L.push("   pas un trou à combler, c'est une absence légitime (une bibliothèque, un script de données).");
  L.push("   Viser 100 % sur ce dénominateur-là serait viser l'impossible, et un objectif inatteignable");
  L.push("   se fait abandonner. LE DÉNOMINATEUR DU SIGNAL DE FIN EST DONC LUI AUSSI À TRANCHER.");
  L.push("");
  L.push("LE SIGNAL DE FIN — proposé, jamais décidé seul :");
  L.push(`   Volet 1 (mesurable)     : ${c.signalDeFin.volet1} → ${c.signalDeFin.atteint ? "ATTEINT" : "PAS ENCORE"}`);
  L.push(`   Volet 2 (non mesurable) : ${c.signalDeFin.volet2NonMesurable}`);
  L.push("");
  L.push("HORS PORTÉE : la CIBLE (à quelle classification finale on veut arriver, et pourquoi) est un");
  L.push("CHOIX, donc une décision de l'utilisateur. Cet outil mesure où on en est, jamais où il faut aller.");
  return L;
}

export function findFamillesDivergentesParOutil({ categories = {}, registres = [] } = {}) {
  const parRegistre = new Map();
  for (const r of registres) if (r?.slug && r?.family) parRegistre.set(r.slug, r.family);
  if (!parRegistre.size || !Object.keys(categories).length) {
    return { mesurable: false, pourquoi: "l'un des deux côtés est vide — rendre « aucune divergence » sur un dénominateur vide dirait exactement ce que dit un accord parfait, et c'est le contraire de la vérité" };
  }
  const divergences = [];
  for (const [slug, cat] of Object.entries(categories)) {
    const famille = familleDeLaCategorie(cat);
    const registre = parRegistre.get(slug);
    if (!registre || !famille) continue; // absence traitée par comparerLesFamilles(), jamais deux fois
    if (famille !== registre) divergences.push({ slug, organigramme: famille, registre });
  }
  return { mesurable: true, compares: [...parRegistre.keys()].filter((s) => familleDeLaCategorie(categories[s])).length, divergences };
}

export function formatDivergencesFamilleLines(d) {
  if (!d?.mesurable) return [`⚠️ NON MESURÉ — ${d?.pourquoi ?? "raison inconnue"}`];
  if (!d.divergences.length) return [`✅ Rangement identique des deux côtés pour les ${d.compares} outils comparables.`];
  const L = [`🔴 ${d.divergences.length} outil(s) rangé(s) dans DEUX familles différentes selon qu'on lit l'organigramme ou son registre :`];
  for (const x of d.divergences) L.push(`   ${x.slug} — organigramme : « ${x.organigramme} » · registre : « ${x.registre} »`);
  L.push("   Lequel a raison est un NOMMAGE, donc une décision de l'utilisateur : cet outil le signale, il ne tranche pas.");
  return L;
}

export function formatFamillesLines(c) {
  if (!c?.mesurable) return [`⚠️ NON MESURABLE — ${c?.pourquoi ?? "raison inconnue"}`];
  const L = [];
  L.push(`Familles (organigramme)    : ${c.suites.length}`);
  L.push(`Familles (registres)       : ${c.familles.length}`);
  L.push(`Noms communs aux deux      : ${c.communs.length}${c.communs.length ? ` — ${c.communs.join(" · ")}` : ""}`);
  L.push(`Outils catégorisés sans registre : ${c.sansRegistre.length}`);
  L.push(`Outils avec registre sans catégorie : ${c.sansCategorie.length}`);
  if (c.sansFamille?.length) L.push(`Outils rangés sans aucune famille : ${c.sansFamille.length} — ${c.sansFamille.join(" · ")}`);
  if (c.divergent) {
    L.push("");
    L.push("🔴 DEUX RANGEMENTS DU MÊME PAYSAGE qui ne se recouvrent pas. Ce n'est pas un détail de nommage :");
    L.push("   tant que les deux coexistent, tout axe ajouté par-dessus hérite de l'ambiguïté.");
    L.push("   Lequel survit est un NOMMAGE, donc une décision de l'utilisateur — cet outil le signale, il ne tranche pas.");
    L.push(`   Côté organigramme : ${c.suites.join(" · ")}`);
    L.push(`   Côté registres    : ${c.familles.join(" · ")}`);
    if (c.seulementCategories?.length) L.push(`   Famille connue de l'organigramme SEUL : ${c.seulementCategories.join(" · ")}`);
    if (c.seulementRegistres?.length) L.push(`   Famille connue des registres SEULS    : ${c.seulementRegistres.join(" · ")}`);
  } else L.push("\n✅ Les deux rangements se recouvrent.");
  return L;
}

// ============================================================================================
// 3e DISTINCTION — LE MOMENT : QUAND l'outil intervient (2026-09-24, tâche #750)
// ============================================================================================
// Sa demande : « on avance sur la classification ». Les deux premiers axes disent où RANGER un
// script (l'iceberg) et POUR QUOI il travaille (le jeu ou l'Agence). Aucun ne dit QUAND.
//
// CE QUE CET AXE RÉVÈLE, et c'est sa seule raison d'être : si tous les contrôles sont empilés
// APRÈS le geste, le paysage ne prévient jamais — il constate. Or ce projet a déjà payé cette
// différence plusieurs fois, et l'a écrite : « détecter n'est pas prévenir ».
//
// UN OUTIL PEUT AVOIR PLUSIEURS MOMENTS, et c'est le point de conception qui compte : l'agent des
// noms tourne à la Ronde ET se convoque avant un renommage. Rendre un moment UNIQUE aurait forcé
// à choisir, donc à effacer la moitié de la réponse. C'est un ENSEMBLE, jamais une case.
export const MOMENTS = {
  "avant-le-geste": { rang: 4, quoi: "consulté AVANT d'agir — le seul moment qui peut encore éviter l'erreur" },
  "a-chaque-commit": { rang: 3, quoi: "lancé par le crochet git, donc juste après le geste et sans qu'on y pense" },
  "periodique": { rang: 2, quoi: "passage de Ronde — il juge une trajectoire, pas un instant" },
  "a-la-demande": { rang: 1, quoi: "ne part que si on l'appelle — utile, mais il ne préviendra jamais tout seul" },
};

// Le signal « avant » se lit dans la PHRASE qui porte la commande, jamais dans le fichier : c'est
// le document qui dit à quel moment on s'en sert. On cherche donc « avant » (ou « préalable »,
// « en amont ») dans la fenêtre de texte autour de la commande écrite — une fenêtre, parce qu'une
// phrase de ce dépôt tient rarement sur une ligne.
export const FENETRE_MOMENT = 400;
// Insensible à la casse, et ce détail a fait échouer le premier contre-test : ce dépôt écrit
// « Avant », « avant » et « AVANT » selon qu'il ouvre une phrase, une règle ou un cri. Un motif
// sensible à la casse ne voyait qu'un tiers du terrain — encore une sonde qui NE PEUT PAS
// reconnaître, rendant exactement ce que rend une sonde qui n'a rien trouvé (leçon L11).
export const MOT_AVANT = /\bavant\b|\bpréalable|\ben amont\b/i;

export function momentsDeLOutil(slug, { offert = "", machine = new Set(), itemsRonde = new Set() } = {}) {
  const moments = new Set();
  if (machine.has(slug)) moments.add("a-chaque-commit");
  if (itemsRonde.has(slug)) moments.add("periodique");
  const cmd = new RegExp(`node\\s+scripts/${slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.mjs`, "gi");
  const txt = String(offert);
  let avant = false;
  for (const m of txt.matchAll(cmd)) {
    // LA PHRASE, jamais une fenêtre de caractères — second contre-test rouge, et il avait raison :
    // avec une fenêtre large, un « Avant » appartenant à la phrase PRÉCÉDENTE contaminait la
    // commande suivante, et deux outils sans rapport devenaient « consultés avant d'agir ». On
    // remonte donc jusqu'à la fin de phrase précédente, bornée par FENETRE_MOMENT pour ne pas
    // remonter un document entier quand la ponctuation manque.
    const plancher = Math.max(0, m.index - FENETRE_MOMENT);
    const amont = txt.slice(plancher, m.index);
    // Un retour à la ligne SIMPLE ne coupe pas : ces documents sont du Markdown replié à 100
    // colonnes, donc une phrase y tient couramment sur trois lignes. Couper dessus faisait tomber
    // le compte de 16 à 1 — la règle de tool-brain dit « avant toute recherche [...] consulter
    // node scripts/tool-brain.mjs » et le « avant » vivait une ligne plus haut. Seule une ligne
    // VIDE sépare deux idées ici.
    const coupe = Math.max(amont.lastIndexOf("."), amont.lastIndexOf("!"), amont.lastIndexOf("?"), amont.lastIndexOf("\n\n"));
    if (MOT_AVANT.test(coupe >= 0 ? amont.slice(coupe + 1) : amont)) { avant = true; break; }
  }
  if (avant) moments.add("avant-le-geste");
  if (!moments.size) moments.add("a-la-demande");
  return { slug, moments: [...moments], mesurable: true };
}

// ============================================================================================
// 4e DISTINCTION — LE DOMAINE : SUR QUOI l'outil regarde (2026-09-24, tâche #750)
// ============================================================================================
// CE QUE CET AXE RÉVÈLE : un domaine que personne ne surveille. Les quatre autres axes comptent
// des outils ; celui-ci compte des ANGLES MORTS, ce qui n'est pas la même question.
//
// IL SE DÉRIVE DE CE QUE L'OUTIL LIT VRAIMENT, jamais de ce qu'il raconte — leçon L24, qui a déjà
// coûté un classement entier ce soir : 45 outils sur 65 rangés du côté « jeu » parce qu'ils
// MENTIONNENT `lib/` dans un commentaire. La sonde ignore donc les lignes de commentaire, et ne
// compte qu'un chemin écrit entre guillemets dans du code exécuté.
// ⚠️ HOMONYME DÉCLARÉ (2026-09-25, tâche #756) — `the-equalizer.mjs` exporte lui aussi une
// constante `DOMAINES`, et elle ne veut PAS dire la même chose. Ici : SUR QUOI un outil regarde
// (code, documents, tâches, données, jeu-joué), dérivé des chemins qu'il lit vraiment. Là-bas :
// les quatre DOMAINES DE VERDICT nommés par l'utilisateur (agence, documents, code, jeu), c'est-à-
// dire de quoi THE-EQUALIZER rend compte. Un lecteur qui croise le mot sans cette note ne peut pas
// savoir lequel il a sous les yeux — exactement la dette de reprise de l'Article 27.
// Aucun des deux n'est renommé : quel nom survit est un NOMMAGE, donc une décision de l'utilisateur
// (Article 20bis), et `node scripts/agent-des-noms.mjs homonymes` tient la mesure à jour.
// La mesure du jour dit d'ailleurs que ce couple-ci est une CONVENTION, pas une collision :
// personne n'importe ni l'un ni l'autre d'un autre fichier, donc personne ne peut les croiser.
export const DOMAINES = {
  "code": { quoi: "le code du jeu et des outils", chemins: [/^scripts\//, /^lib\//, /^app\//, /^components\//] },
  "documents": { quoi: "la charte, le référentiel, les règles de travail", chemins: [/^CLAUDE\.md/, /^docs\/referentiel\//, /^docs\/[a-z0-9-]+\.md/] },
  "taches": { quoi: "le suivi des tâches et des chantiers", chemins: [/^docs\/suivi\//, /^docs\/plans\//] },
  "donnees": { quoi: "les registres, les journaux, les séries chiffrées", chemins: [/\.csv$/, /\.jsonl?$/, /^docs\/[a-z0-9-]+\/(?:index|registre|historique)/] },
  "jeu-joue": { quoi: "ce que le jeu a réellement produit — transcripts, dossiers, captures", chemins: [/^docs\/simulations\//] },
};

// Un chemin ne compte que s'il est écrit entre guillemets DANS du code, jamais dans un commentaire.
// C'est la seule protection possible contre le piège de la mention, et elle est bon marché.
export function cheminsLus(source = "") {
  const chemins = new Set();
  for (const ligne of String(source).split("\n")) {
    const nu = ligne.trim();
    if (nu.startsWith("//") || nu.startsWith("*") || nu.startsWith("/*")) continue;
    for (const m of ligne.matchAll(/["'`]([A-Za-z0-9_./-]*\.(?:mjs|ts|tsx|md|csv|jsonl?|txt)|(?:docs|scripts|lib|app|components)\/[A-Za-z0-9_./-]*)["'`]/g)) chemins.add(m[1]);
  }
  return [...chemins];
}

export function domainesDeLOutil(source = "") {
  const chemins = cheminsLus(source);
  if (!chemins.length) return { domaines: [], chemins: [], mesurable: false,
    pourquoi: "aucun chemin lu dans du code exécuté — soit l'outil ne lit rien du dépôt, soit il le lit par une variable : les deux rendent une liste vide et ne veulent pas dire la même chose" };
  const domaines = new Set();
  for (const c of chemins) for (const [nom, d] of Object.entries(DOMAINES)) if (d.chemins.some((r) => r.test(c))) domaines.add(nom);
  return { domaines: [...domaines], chemins, mesurable: true, pourquoi: null };
}

// ————————————————————————————————————————————————————————————————————————
// LA FICHE AGRÉGÉE D'UN OUTIL (2026-09-25, tâche #757)
// ————————————————————————————————————————————————————————————————————————
//
// SA CIBLE, reformulée avec lui : « c'est quoi, ça sert à qui, ça pèse combien, et que coûterait
// de s'en passer ». Et sa formule qui justifie le chantier entier : « c'est chez qui ? c'est un
// sujet export ».
//
// LA RÈGLE DE CONCEPTION QUI COMMANDE TOUT : **NE PAS créer un quatorzième registre.** C'est le
// réflexe naturel et ce serait l'erreur — sur les treize qui existent, quatre divergeaient déjà en
// silence avant qu'un garde-fou ne les rattrape (audit d'évolutivité du 2026-09-21, Article 24).
// Un quatorzième aurait divergé pareil, avec en plus l'autorité trompeuse d'une fiche « officielle ».
//
// CONSÉQUENCE DIRECTE SUR LA FORME DE CE CODE, et c'est ce qui le rend défendable : `ficheDeLOutil`
// ne LIT RIEN elle-même. Elle reçoit les axes déjà calculés, chacun par la fonction qui le calcule
// déjà et qui est déjà testée, et se contente de les ASSEMBLER. Elle ne peut donc pas diverger :
// il n'y a rien en elle qui puisse être d'un autre avis que la source.
//
// UN CHAMP MANQUANT DIT QUEL AXE N'A PAS RÉPONDU, jamais une case vide. Une fiche à trous
// silencieux se lit comme une fiche complète sur un outil pauvre — et c'est exactement l'inverse
// de ce qu'elle voudrait dire.

// ————————————————————————————————————————————————————————————————————————
// LIRE VRAIMENT LES REGISTRES, PAS SEULEMENT LEUR CHEMIN (2026-09-25, tâche #490)
// ————————————————————————————————————————————————————————————————————————
//
// LE CONSTAT DE data-archangel, et il est plus fin qu'il n'en a l'air : dix registres FRAIS ne sont
// « atteints que par table ». Sept ou dix outils citent leur chemin — pour savoir qu'ils existent,
// pour vérifier qu'ils ne sont pas vides, pour les lister — et **aucun n'ouvre le fichier pour en
// tirer quelque chose**. Passer par le chemin n'est pas exploiter le contenu, et confondre les deux
// est exactement le genre de vert que ce projet combat : le registre paraît lu, il ne l'est pas.
//
// LE LECTEUR RÉEL, ET POURQUOI IL VIT DANS LA FICHE plutôt que dans un outil de plus (Article 31 :
// on ÉTEND avant de construire) : la question « quand cet outil a-t-il trouvé quelque chose pour la
// dernière fois ? » est précisément une question d'identité d'outil, au même titre que son rang ou
// son poids. La fiche la posait déjà pour tout le reste ; il lui manquait la mémoire.
//
// CE QU'IL LIT, ET LA LIMITE EST DÉCLARÉE : la dernière ligne datée du tableau de l'index. Les
// registres n'ont pas tous la même colonne de résumé — certains n'ont même pas de ligne datée du
// tout — donc un index sans date rend « jamais consigné », qui n'est pas la même chose qu'un outil
// qui n'aurait rien trouvé. La distinction est la même que partout ailleurs ici (leçon L5).

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE SCORE CIBLE PAR MEMBRE (2026-09-25, tâche #147 — son idée, ouverte depuis sept rapports)
// ════════════════════════════════════════════════════════════════════════════════════════════
//
// SON IDÉE, telle qu'elle dormait au registre : « fixer un score cible à chaque membre de l'équipe
// pour qu'il comprenne ce qui définit un membre efficace ». Et ses trois arbitrages, tranchés en
// fenêtre dédiée le jour où elle a été reprise :
//
//   1. LE SCORE PORTE SUR CE QUE L'OUTIL A TROUVÉ, jamais sur sa tenue. Sa raison est la journée
//      elle-même : HUIT outils ont accusé à tort le 2026-09-25, et **aucun badge ne l'a vu** — un
//      outil parfaitement documenté, testé, au badge impeccable, peut n'avoir jamais rien trouvé de
//      vrai. Noter la tenue, c'est la métrique de vanité que ce projet combat depuis le début.
//   2. LA CIBLE EST DÉRIVÉE DE LA MÉDIANE DE L'ÉQUIPE, jamais écrite à la main. Rien à tenir, rien
//      à périmer, et un outil qui rejoint l'équipe déplace la cible sans qu'on y pense (Article 24).
//      C'est aussi la méthode que ce projet emploie déjà pour ses autres seuils.
//   3. LA MÉDIANE PLUTÔT QUE LA MOYENNE, et ce n'est pas un détail : un seul outil très prolifique
//      tirerait une moyenne vers le haut et déclarerait tous les autres en dessous de la cible.
//
// CE QUE CE SCORE NE DIT PAS, et il le dit lui-même : un outil peut avoir trouvé peu parce que son
// terrain est propre. « Sous la cible » est une QUESTION posée à la lecture, jamais un verdict de
// paresse — et c'est exactement la nuance que le badge, lui, ne sait pas porter.
export function scoreDesMembres(slugs = [], { lire, registres = null, trouvailleImpl = derniereTrouvailleDuRegistre } = {}) {
  if (typeof lire !== "function") {
    return { mesurable: false, pourquoi: "aucun lecteur de registre fourni : sans ouvrir les registres, « qu'a trouvé cet outil ? » n'a pas de réponse, et un score de zéro partout serait une accusation, jamais une mesure" };
  }
  if (!slugs.length) return { mesurable: false, pourquoi: "aucun membre à noter : rien à mesurer" };
  const membres = [];
  for (const slug of slugs) {
    const t = trouvailleImpl(slug, { lire, registres });
    membres.push({
      slug,
      // TROIS ÉTATS, jamais deux : consigné / registre atteignable mais vide / registre
      // inatteignable. Le troisième n'est PAS un zéro — c'est une absence de mesure, et les
      // confondre transformerait un outil qu'on n'a pas su lire en outil paresseux.
      mesurable: t.mesurable,
      passages: t.mesurable ? (t.passages ?? 0) : null,
      derniere: t.mesurable ? t.date ?? null : null,
      pourquoi: t.mesurable ? null : t.pourquoi,
    });
  }
  const notes = membres.filter((m) => m.mesurable).map((m) => m.passages).sort((a, b) => a - b);
  if (!notes.length) {
    return { mesurable: false, membres, pourquoi: `aucun des ${slugs.length} membres n'a de registre atteignable : la cible se dériverait sur zéro donnée, ce qui ressemblerait à une cible` };
  }
  const milieu = Math.floor(notes.length / 2);
  const cible = notes.length % 2 ? notes[milieu] : Math.round((notes[milieu - 1] + notes[milieu]) / 2);
  const notés = membres.filter((m) => m.mesurable);
  return {
    mesurable: true,
    cible,
    total: slugs.length,
    notes: notés.length,
    sansRegistre: membres.filter((m) => !m.mesurable),
    auDessus: notés.filter((m) => m.passages > cible).sort((a, b) => b.passages - a.passages),
    aLaCible: notés.filter((m) => m.passages === cible),
    sousLaCible: notés.filter((m) => m.passages < cible).sort((a, b) => a.passages - b.passages),
    // LE SIGNAL SANS LEQUEL CE SCORE SE LIRAIT DE TRAVERS (trouvé au premier vrai passage) :
    // il a rendu « 0 sous la cible », ce qui se lit « toute l'équipe est au niveau ». En réalité la
    // cible vaut 1 parce que 51 membres sur 79 n'ont pas de registre atteignable — la médiane est
    // calculée sur un tiers de l'équipe, et une cible de 1 ne discrimine rien.
    // Deux causes derrière un même zéro, encore : « personne n'est en retard » et « la mesure est
    // trop grossière pour distinguer qui l'est ». Nommer les deux, jamais choisir.
    discriminant: cible > 1 && notés.length > slugs.length / 2,
    pourquoiPeuDiscriminant: cible > 1 && notés.length > slugs.length / 2 ? null
      : `cible à ${cible} calculée sur ${notés.length} membre(s) seulement sur ${slugs.length} : ce score ne discrimine pas encore. « 0 sous la cible » veut dire ici « la mesure est trop grossière », jamais « toute l'équipe est au niveau ». Le geste qui le débloque n'est pas de durcir la cible, c'est de donner un registre atteignable aux ${slugs.length - notés.length} membres qui n'en ont pas.`,
    horsPortee: "La cible est la MÉDIANE des passages consignés, jamais un objectif posé à la main — un membre de plus la déplace tout seul. Et « sous la cible » est une QUESTION : un outil peut avoir trouvé peu parce que son terrain est propre. Ce score dit ce qu'un outil a TROUVÉ, jamais s'il est bien tenu — le badge s'en charge, et les deux ne se remplacent pas.",
  };
}

export function formatScoreLines(r) {
  if (!r?.mesurable) return [`SCORE DES MEMBRES — 🚨 PAS MESURÉ : ${r?.pourquoi ?? "raison inconnue"}`];
  const l = [`Score des membres — ce que chacun a TROUVÉ, pas ce qu'il vaut sur le papier.`];
  l.push(`  ${r.notes} membre(s) notés sur ${r.total} · CIBLE = ${r.cible} passage(s) consigné(s) (médiane de l'équipe).`);
  if (r.sansRegistre.length) l.push(`  ❓ ${r.sansRegistre.length} sans registre atteignable — PAS un zéro, une absence de mesure : ${r.sansRegistre.slice(0, 6).map((m) => m.slug).join(", ")}${r.sansRegistre.length > 6 ? "…" : ""}`);
  l.push("");
  l.push(`  AU-DESSUS (${r.auDessus.length}) : ${r.auDessus.slice(0, 8).map((m) => `${m.slug} ${m.passages}`).join(" · ") || "aucun"}`);
  l.push(`  À LA CIBLE (${r.aLaCible.length}) : ${r.aLaCible.slice(0, 8).map((m) => m.slug).join(" · ") || "aucun"}`);
  l.push(`  SOUS LA CIBLE (${r.sousLaCible.length}) : ${r.sousLaCible.slice(0, 8).map((m) => `${m.slug} ${m.passages}`).join(" · ") || "aucun"}`);
  l.push("");
  if (!r.discriminant) l.push(`  ⚠️ ${r.pourquoiPeuDiscriminant}`);
  l.push(`  HORS PORTÉE : ${r.horsPortee}`);
  return l;
}

export function derniereTrouvailleDuRegistre(slug, { lire, registres = null } = {}) {
  if (typeof lire !== "function") {
    return { mesurable: false, pourquoi: "aucun lecteur fourni — un registre qu'on n'ouvre pas ne dit rien, et répondre « jamais rien trouvé » à sa place serait l'accusation que cette fonction existe pour empêcher" };
  }
  // LE CHEMIN SE LIT, IL NE SE DEVINE PAS (2026-09-25, tâche #840 — instruction de #205). La
  // convention `docs/<slug>/` couvre la grande majorité des outils, mais QUATRE registres réels
  // vivent ailleurs et sont déjà déclarés dans `REGISTRIES` (doc-report.mjs) : `the-deep-reader`
  // (docs/suivi/relectures-lourdes/), `kpi`, `dream-team-photo`, `ecotoken-ronde`. En dérivant le
  // chemin, cette sonde répondait « registre inatteignable » sur des registres parfaitement
  // NOURRIS — et pour THE-DEEP-READER ce faux vide alimentait précisément le soupçon de la tâche
  // #205 (« je néglige les outils à retour différé »). **La mesure accusait, la donnée disait
  // l'inverse : deux relectures lourdes réelles étaient archivées.**
  //
  // Un registre se LIT, il ne se recopie ni ne se devine (Article 24). `registres` est injecté pour
  // rester testable ; sans lui, la convention reste le repli, déclaré plutôt que tu.
  const declare = (registres ?? []).find((r) => r.slug === slug && r.path);
  const chemin = declare ? `${String(declare.path).replace(/\/+$/, "")}/index.md` : `docs/${slug}/index.md`;
  const texte = lire(chemin);
  if (texte === null || texte === undefined) {
    return { mesurable: false, chemin, pourquoi: `${chemin} est absent ou illisible : cet outil n'a pas de registre atteignable, ce qui n'est pas la même chose qu'un registre vide` };
  }
  // DEUX FORMES, pas une (corrigé le 2026-09-25, tâche #829). La première version ne lisait que les
  // LIGNES DE TABLEAU `| 2026-… |`. Elle a donc répondu « rien de consigné » sur le registre de
  // CASSANDRA elle-même, qui est nourri, riche, et qui date ses entrées par des TITRES
  // (`## 2026-09-21 — …`). La réponse restait honnête — elle disait « jamais consigné », jamais
  // « jamais rien trouvé » — mais elle était aveugle à une forme parfaitement légitime.
  //
  // C'est, une fois de plus, la même chose : une sonde qui ne PEUT PAS matcher rend exactement ce
  // que rend une sonde qui n'a rien trouvé. Trouvée en lançant la fiche sur l'outil qui l'a écrite.
  const lignes = String(texte).split("\n");
  const enTableau = lignes.filter((l) => /^\|\s*20\d\d-\d\d-\d\d/.test(l));
  const enTitre = lignes.filter((l) => /^#{2,4}\s.*20\d\d-\d\d-\d\d/.test(l));
  const datees = enTableau.length ? enTableau : enTitre;
  if (!datees.length) {
    return { mesurable: false, chemin, pourquoi: `aucune ligne ni aucun titre daté dans ${chemin} : rien n'y a jamais été consigné sous une forme lisible — « jamais consigné » n'est pas « jamais rien trouvé »` };
  }
  const derniere = datees[datees.length - 1];
  const cellules = enTableau.length
    ? derniere.split("|").map((c) => c.trim()).filter(Boolean)
    : (() => {
        const t = derniere.replace(/^#+\s*/, "").trim();
        const d = t.match(/20\d\d-\d\d-\d\d/)?.[0] ?? "";
        return [d, t.replace(d, "").replace(/^[\s—–-]+/, "").trim() || t];
      })();
  return { mesurable: true, chemin, date: cellules[0],
    // Le résumé est la cellule la plus longue de la ligne : les registres n'ont pas tous leurs
    // colonnes dans le même ordre, et choisir un INDEX fixe aurait rendu la date sur les uns et un
    // nombre sur les autres. La plus longue est celle qui porte du sens, quel que soit le gabarit.
    resume: cellules.slice(1).sort((a, b) => b.length - a.length)[0] ?? "(ligne sans détail)",
    passages: datees.length };
}

export const CHAMPS_DE_LA_FICHE = [
  { cle: "rang", quoi: "son autorité", source: "AGENT_CATEGORIES (Article 20bis)" },
  { cle: "famille", quoi: "son voisinage de travail", source: "AGENT_CATEGORIES" },
  { cle: "groupe", quoi: "membre de l'équipe, oublié, ou plomberie", source: "classerIceberg()" },
  { cle: "type", quoi: "ce que le fichier EST", source: "typeDeScript()" },
  { cle: "classes", quoi: "ce qu'il SAIT FAIRE", source: "classesDuScript()" },
  { cle: "destinataires", quoi: "à QUI le résultat sert", source: "destinatairesDeLOutil()" },
  { cle: "moments", quoi: "QUAND il intervient", source: "momentsDeLOutil()" },
  { cle: "domaines", quoi: "SUR QUOI il regarde", source: "domainesDeLOutil()" },
  { cle: "portee", quoi: "le jeu, ou l'Agence", source: "TOOL_PORTEE" },
  { cle: "poids", quoi: "combien de lignes il pèse", source: "poidsDesOutils()" },
  { cle: "coutDeDepart", quoi: "ce que coûterait de s'en passer", source: "poidsDesOutils()" },
  { cle: "version", quoi: "combien de fois il a changé de capacités", source: "versionDepuisGit()" },
  { cle: "richesse", quoi: "ce qu'il porte aujourd'hui", source: "richesse()" },
  { cle: "derniereTrouvaille", quoi: "la dernière fois qu'il a trouvé quelque chose", source: "son registre docs/<outil>/index.md" },
];

function valeurLisible(v) {
  if (v === null || v === undefined || v === "") return null;
  if (Array.isArray(v)) return v.length ? v.join(", ") : null;
  if (typeof v === "object") return v.mesurable === false ? null : (v.libelle ?? JSON.stringify(v));
  return String(v);
}

// ————————————————————————————————————————————————————————————————————————
// UN OUTIL « À LANCER À LA MAIN » DOIT DIRE QUOI TAPER (2026-09-25, tâche #655)
// ————————————————————————————————————————————————————————————————————————
//
// LE CAS QUI L'A MOTIVÉ, et c'est le plus embarrassant du recensement parce qu'il touche
// l'Article 0 : la charte décrivait `check-spirit.mjs` comme l'outil de référence pour vérifier
// l'esprit des personnages, précisait qu'il est « à lancer à la main, pas en continu »... et
// n'écrivait NULLE PART la commande. La seule commande écrite à côté était celle de Smart Conso
// API, qu'il faut lancer AVANT lui. Même cas pour `check-profile.mjs`.
//
// C'EST LA FORME LA PLUS DISCRÈTE D'UNE RÈGLE INAPPLICABLE : elle a l'air complète, elle est même
// insistante sur le QUAND, et il manque le seul élément sans lequel personne ne peut l'appliquer.
// Une IA qui reprend ce projet (Article 27) ne peut pas deviner un nom de fichier.
//
// LE GARDE-FOU NE LIT PAS UNE LISTE, IL DÉRIVE (Article 24) : il prend les lignes de la table
// maîtresse dont le déclenchement dit « à la main » ou « à la demande », en extrait les scripts
// nommés, et vérifie que la commande de chacun est écrite quelque part dans les documents
// normatifs. Un outil ajouté demain avec le même déclenchement est couvert sans qu'on y pense.

export const MOTIF_LANCEMENT_MANUEL = /à la main|à la demande|sur demande/i;

export function findOutilsAMainSansCommande(lignesTable = [], { offert = "" } = {}) {
  if (!lignesTable.length) {
    return { mesurable: false, pourquoi: "table maîtresse vide ou illisible : aucun outil à confronter, ce qui n'est pas la même chose qu'aucun manque" };
  }
  const texte = String(offert);
  if (!texte.trim()) {
    return { mesurable: false, pourquoi: "aucun document normatif fourni : sans corpus où chercher, TOUTE commande paraîtrait manquante — l'accusation en masse la plus facile et la plus fausse" };
  }
  const manques = [];
  const couverts = [];
  for (const l of lignesTable) {
    if (!MOTIF_LANCEMENT_MANUEL.test(String(l.declenchement ?? ""))) continue;
    // Le nom de l'outil peut en citer plusieurs (« check-spirit.mjs / check-profile.mjs ») : on
    // les prend tous, parce qu'une ligne couverte à moitié laisserait un outil sans commande.
    for (const m of String(l.tool ?? "").matchAll(/([a-z0-9][\w.-]*\.mjs)/gi)) {
      const fichier = m[1];
      const echappe = fichier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const cmd = new RegExp(`node\\s+scripts/${echappe}`, "i");
      // DEUXIÈME FORME ACCEPTÉE, et elle est nécessaire : certains outils NE SE LANCENT PAS
      // directement par décision de la charte — find-booster et route-booster passent
      // obligatoirement par tool-brain (Article 31), gemini-key-health et api-providers sont des
      // pièces de Smart Breaker qu'on atteint par check-gemini-quota. Exiger leur commande directe
      // reviendrait à réclamer l'écriture d'un geste que la charte interdit. Ce qui manque alors
      // n'est pas une commande, c'est la PHRASE qui dit par où passer — et cette phrase-là se
      // cherche mécaniquement, elle ne s'exempte pas à la main (Article 24).
      // PROXIMITÉ PAR FENÊTRE, jamais par une expression « tout sauf un point » : les noms de
      // fichier CONTIENNENT un point, donc une telle expression ne peut structurellement pas les
      // traverser. Elle rendait zéro sur un texte qui disait exactement la bonne chose — la même
      // sonde-qui-ne-peut-pas-matcher que le reste de cette matinée, en version discrète.
      const detour = /ne se lance(?:nt)? pas directement|passer par|passe par/i;
      let parDetour = false;
      for (const occ of texte.matchAll(new RegExp(echappe, "gi"))) {
        const fenetre = texte.slice(Math.max(0, occ.index - 250), occ.index + 250);
        if (detour.test(fenetre)) { parDetour = true; break; }
      }
      (cmd.test(texte) || parDetour ? couverts : manques).push({ outil: l.tool, fichier,
        pourquoi: `la table dit « ${String(l.declenchement).slice(0, 40)}… » et aucun document normatif n'écrit « node scripts/${fichier} » — la main ne sait pas quoi taper` });
    }
  }
  return { mesurable: true, manques, couverts: couverts.length, examines: manques.length + couverts.length,
    horsPortee: "Ce contrôle voit si la commande est ÉCRITE, jamais si elle est JUSTE : une commande périmée reste une commande écrite." };
}

// ————————————————————————————————————————————————————————————————————————
// « JE N'AI PAS PU REGARDER » : TROIS FAÇONS, PAS UNE (2026-09-25, tâche #654)
// ————————————————————————————————————————————————————————————————————————
//
// LE CONSTAT D'ORIGINE disait « 12 outils scannent le dépôt sans pouvoir dire je n'ai pas pu
// regarder ». La sonde qui l'avait produit cherche trois formulations : `PAS MESURÉ`,
// `pas mesuré`, `mesurable: false`. Après le chantier #653 — où la même erreur s'est produite
// QUATRE fois — la première chose faite ici a été de vérifier que cette sonde PEUT matcher ce
// qu'elle cherche. Elle ne le peut pas toujours, et les 12 le montrent :
//
//   · `check-argus` LÈVE UNE ERREUR quand son point d'ancrage manque dans lib/life.ts. C'est la
//     forme la plus forte du refus — il s'arrête plutôt que de rendre « zéro champ suspect » —
//     et la sonde ne la voyait pas du tout.
//   · `check-harmonia` range l'absence dans un état nommé (`status: "introuvable dans le code"`)
//     qui voyage avec le résultat. Un refus au niveau de l'élément, invisible à la sonde.
//   · `ines-official` remplace un fichier illisible par « (fichier illisible — ignoré) » et
//     CONTINUE. L'édition rendue paraît complète. Ce n'est pas un refus, c'est un pansement.
//
// TROIS ÉTATS, DONC, ET C'EST LA DISTINCTION QUI COMPTE — les deux premiers protègent le lecteur,
// le troisième lui laisse croire qu'il a tout :
//   REFUSE  — rend ou lève quelque chose qu'on ne peut pas confondre avec un résultat ;
//   SIGNALE — nomme l'absence dans son texte mais poursuit avec une valeur de remplacement ;
//   MUET    — ne dit rien du tout, et son zéro se lit comme un dépôt propre (leçon L5).
//
// AUCUN DES TROIS N'EST UN REPROCHE EN SOI : un outil qui SIGNALE peut avoir raison de continuer
// (une édition consolidée reste utile avec un fichier manquant, si elle le dit). Ce qui serait un
// défaut, c'est de ne pas savoir lequel des trois on est.

export const FACONS_DE_REFUSER = [
  { cle: "refuse", quoi: "rend ou lève quelque chose qu'on ne peut pas confondre avec un résultat",
    sonde: (src) => /PAS MESUR[ÉE]|pas mesur[ée]|mesurable\s*:\s*false|throw new Error\([^)]*(introuvable|illisible|absent|manque)|status:\s*["'`][^"'`]*(introuvable|illisible|absent)/.test(src) },
  { cle: "signale", quoi: "nomme l'absence dans son texte mais poursuit avec une valeur de remplacement",
    sonde: (src) => /(introuvable|illisible|absent|non trouvé|manquant)/i.test(src) },
];

export function capaciteARefuser(source = "", { facons = FACONS_DE_REFUSER } = {}) {
  const src = String(source);
  if (!src.trim()) {
    return { mesurable: false, pourquoi: "source vide : impossible de dire si cet outil sait refuser — et répondre « muet » sur une absence de source serait exactement l'erreur que cette fonction traque" };
  }
  for (const f of facons) if (f.sonde(src)) return { mesurable: true, etat: f.cle, quoi: f.quoi };
  return { mesurable: true, etat: "muet", quoi: "ne dit rien du tout : son zéro se lit comme un dépôt propre (leçon L5)" };
}

export function auditDuRefus(scripts = [], { lire } = {}) {
  if (typeof lire !== "function") {
    return { mesurable: false, pourquoi: "aucun lecteur de source fourni — classer un outil sans lire son code reviendrait à le deviner" };
  }
  const lignes = [];
  for (const chemin of scripts) {
    const src = lire(chemin);
    const c = capaciteARefuser(src ?? "");
    lignes.push({ chemin, etat: c.mesurable ? c.etat : "source illisible", quoi: c.quoi ?? c.pourquoi });
  }
  const par = (e) => lignes.filter((l) => l.etat === e).map((l) => l.chemin);
  return {
    mesurable: true, lignes, total: lignes.length,
    refusent: par("refuse"), signalent: par("signale"), muets: par("muet"),
    horsPortee:
      "Cette mesure voit la FORME du refus dans le code, jamais s'il se déclenche au bon moment : " +
      "un outil peut savoir dire « pas mesuré » et oublier de le dire là où il faut. " +
      "Et « signale » n'est pas un reproche en soi — continuer en le disant est parfois le bon choix.",
  };
}

export function formatRefusLines(a) {
  if (!a?.mesurable) return [`PAS MESURÉ — ${a?.pourquoi ?? "aucune donnée"}`];
  const L = [`${a.total} script(s) examiné(s) : ${a.refusent.length} REFUSENT · ${a.signalent.length} SIGNALENT sans refuser · ${a.muets.length} MUETS.`];
  const bloc = (titre, liste) => { if (liste.length) { L.push("", titre); L.push(`   ${liste.join(", ")}`); } };
  bloc("MUETS — leur zéro se lit comme un dépôt propre, et c'est le seul état qui soit un défaut en soi :", a.muets);
  bloc("SIGNALENT sans refuser — l'absence est nommée, mais le résultat paraît complet :", a.signalent);
  L.push("", `HORS PORTÉE : ${a.horsPortee}`);
  return L;
}

// ————————————————————————————————————————————————————————————————————————
// L'AVERTISSEMENT DE MARGE : DÉCLARÉ, ET RÉELLEMENT DIT ? (2026-09-25, tâche #653)
// ————————————————————————————————————————————————————————————————————————
//
// LE CONSTAT D'ORIGINE disait « 21 outils n'appellent jamais printReliabilityNotice() ». En
// cherchant à le corriger, la mesure s'est trompée DEUX FOIS de suite, et les deux erreurs sont
// gardées ici parce qu'elles sont la même : **une sonde qui ne PEUT PAS matcher rend exactement ce
// que rend une sonde qui n'a rien trouvé.**
//   1re erreur : chercher `printReliabilityNotice(` seul. Mais `report-template.mjs` relaie déjà
//      l'avertissement pour tout outil qui passe par `renderTextReport()`.
//   2e erreur : ajouter `renderTextReport` à la liste. Il manquait encore `printReportHeader()`,
//      par lequel ecotoken imprime le sien — vérifié en LANÇANT ecotoken, pas en lisant son code.
// Une troisième liste écrite à la main se serait périmée au prochain relais ajouté. D'où la forme
// retenue, qui est la seule défendable (Article 24) : **les relais se DÉRIVENT** de la source du
// gabarit, transitivement, au lieu d'être énumérés.
//
// TROIS ÉTATS, JAMAIS DEUX, parce que les deux trous réels ne se corrigent pas pareil :
//   · IMPRIME — l'outil est déclaré heuristique et son avertissement sort vraiment ;
//   · DÉCLARÉ MAIS JAMAIS DIT — la nature est écrite dans le registre et personne ne la prononce.
//     C'est le fil rouge de ce projet : une protection écrite qui ne sort jamais ;
//   · ABSENT DU REGISTRE — l'outil n'y figure pas, donc `reliabilityNotice()` rend `null` en
//     silence. Ce n'est pas la même faute et ça ne se répare pas au même endroit.

export function relaisDAvertissement(sourceGabarit = "") {
  const src = String(sourceGabarit);
  if (!src.trim()) {
    return { mesurable: false, relais: [], pourquoi: "le gabarit de rapport n'a pas pu être lu : sans lui, impossible de savoir par quelles fonctions l'avertissement transite — et une liste vide se lirait comme « aucun relais », ce qui accuserait à tort tous les outils qui passent par lui" };
  }
  // LES COMMENTAIRES SONT RETIRÉS AVANT TOUTE RECHERCHE, et ce n'est pas un détail : sans ça,
  // `gravityLine` et `identityLines` étaient classées relais parce qu'un commentaire situé juste
  // avant la fonction SUIVANTE citait le nom. Un relais inventé est pire qu'un relais manqué — il
  // fait passer pour bavard un outil réellement muet, exactement le faux vert que tout ce projet
  // combat. Trouvé en relisant la liste dérivée, jamais en la faisant tourner.
  const sansCommentaires = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const blocs = new Map();
  for (const part of sansCommentaires.split(/\nexport function /).slice(1)) {
    const nom = part.slice(0, part.indexOf("(")).trim();
    if (nom) blocs.set(nom, part);
  }
  const relais = new Set(["reliabilityNotice", "printReliabilityNotice"]);
  // Transitif : un relais qui en appelle un autre relaie aussi. On itère jusqu'à stabilité plutôt
  // que sur une profondeur choisie au hasard — une profondeur fixe se périme au premier étage ajouté.
  for (let tour = 0; tour < blocs.size + 1; tour += 1) {
    let ajoute = false;
    for (const [nom, corps] of blocs) {
      if (relais.has(nom)) continue;
      if ([...relais].some((r) => new RegExp(`\\b${r}\\s*\\(`).test(corps))) { relais.add(nom); ajoute = true; }
    }
    if (!ajoute) break;
  }
  return { mesurable: true, relais: [...relais], pourquoi: null };
}

// LA RÉSOLUTION SCRIPT → SLUG, ET C'EST LA CORRECTION LA PLUS IMPORTANTE DE CE CHANTIER : le
// registre de fiabilité est indexé par SLUG D'OUTIL, pas par nom de fichier. ARGUS s'y appelle
// `argus` et vit dans `check-argus.mjs`. Partir du nom de fichier revenait à inventer une SECONDE
// règle de nommage — et la première correction l'a fait, créant cinq doublons (`check-argus` à côté
// d'`argus`) avant qu'un test ne les attrape. Deux entrées pour un outil, c'est la divergence
// silencieuse que l'Article 24 interdit. On part donc de la table de correspondance, inversée, et
// on ne retombe sur le nom du fichier que lorsqu'elle ne dit rien.
export function slugDuScript(chemin, correspondance = {}) {
  const fichier = String(chemin).startsWith("scripts/") ? String(chemin) : `scripts/${chemin}`;
  for (const [slug, f] of Object.entries(correspondance)) if (f === fichier) return slug;
  return fichier.replace(/^scripts\//, "").replace(/\.mjs$/, "");
}

export function findAvertissementsNonDits(scripts = [], { lire, registre = {}, relais = [], correspondance = {} } = {}) {
  if (typeof lire !== "function") {
    return { mesurable: false, pourquoi: "aucun lecteur de source fourni — juger qu'un outil ne dit pas son avertissement sans lire son code reviendrait à le deviner, et c'est exactement l'erreur que cette fonction existe pour empêcher" };
  }
  if (!relais.length) {
    return { mesurable: false, pourquoi: "aucun relais connu : sans savoir par quelles fonctions l'avertissement transite, tout outil paraîtrait muet" };
  }
  const motif = new RegExp(`\\b(${relais.map((r) => r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s*\\(`);
  const lignes = [];
  for (const chemin of scripts) {
    const slug = slugDuScript(chemin, correspondance);
    const src = lire(chemin);
    if (src === null || src === undefined) { lignes.push({ chemin, slug, etat: "source illisible" }); continue; }
    const entree = registre[slug];
    if (!entree) { lignes.push({ chemin, slug, etat: "absent du registre", pourquoi: "reliabilityNotice() rend null en silence pour lui : ni avertissement, ni signal qu'il en manque un" }); continue; }
    if (entree.nature !== "heuristique") { lignes.push({ chemin, slug, etat: "mécanique", pourquoi: entree.pourquoi ?? "déclaré mécanique : aucun avertissement à dire" }); continue; }
    lignes.push(motif.test(String(src))
      ? { chemin, slug, etat: "imprime" }
      : { chemin, slug, etat: "déclaré mais jamais dit", pourquoi: "sa nature heuristique est écrite dans le registre et aucun chemin de son code ne la prononce" });
  }
  const par = (e) => lignes.filter((l) => l.etat === e);
  return {
    mesurable: true, lignes, total: lignes.length,
    imprime: par("imprime").length,
    jamaisDits: par("déclaré mais jamais dit").map((l) => l.slug),
    absents: par("absent du registre").map((l) => l.slug),
    mecaniques: par("mécanique").length,
    horsPortee: "Cet outil voit si l'avertissement SORT, jamais s'il est JUSTE : qu'un outil déclaré mécanique le soit vraiment se lit, ça ne se mesure pas.",
  };
}
export function formatAvertissementsLines(a) {
  if (!a?.mesurable) return [`PAS MESURÉ — ${a.pourquoi}`];
  const L = [
    `${a.total} outil(s) examiné(s) : ${a.imprime} disent leur marge · ${a.mecaniques} sont déclarés mécaniques (rien à dire) · ${a.jamaisDits.length} la déclarent SANS JAMAIS la dire · ${a.absents.length} ne sont pas au registre.`,
  ];
  if (a.jamaisDits.length) {
    L.push("", "DÉCLARÉ MAIS JAMAIS DIT — une protection écrite qui ne sort jamais, le fil rouge de ce projet :");
    L.push(`   ${a.jamaisDits.join(", ")}`);
  }
  if (a.absents.length) {
    L.push("", "ABSENT DU REGISTRE — reliabilityNotice() rend null en silence : ni avertissement, ni signal qu'il en manque un :");
    L.push(`   ${a.absents.join(", ")}`);
  }
  L.push("", `HORS PORTÉE : ${a.horsPortee}`);
  return L;
}

export function ficheDeLOutil(slug, axes = {}, { champs = CHAMPS_DE_LA_FICHE } = {}) {
  if (!slug) return { mesurable: false, pourquoi: "aucun outil nommé — une fiche sans sujet n'est pas une fiche vide, c'est une question mal posée" };
  const lignes = champs.map((c) => {
    const lu = valeurLisible(axes[c.cle]);
    return lu === null
      ? { ...c, renseigne: false, valeur: null, pourquoi: `l'axe « ${c.source} » n'a rien rendu pour cet outil` }
      : { ...c, renseigne: true, valeur: lu };
  });
  const renseignes = lignes.filter((l) => l.renseigne).length;
  return {
    mesurable: renseignes > 0, slug, lignes, renseignes, total: lignes.length,
    complete: renseignes === lignes.length,
    pourquoi: renseignes > 0
      ? `${renseignes} champ(s) sur ${lignes.length} renseigné(s) par les axes existants`
      : `aucun axe n'a répondu pour « ${slug} » : soit ce script n'existe pas, soit il n'est classé nulle part — deux situations différentes que cette fiche ne sait pas départager seule`,
    horsPortee:
      "Cette fiche N'EST PAS un quatorzième registre : elle n'écrit rien, ne recalcule rien, et chaque " +
      "ligne nomme l'axe qui l'a produite. Elle ne peut donc pas diverger de ses sources — il n'y a rien " +
      "en elle qui puisse être d'un autre avis. Et elle dit ce qu'un outil EST, jamais s'il est BON.",
  };
}

// LE TROU QUE LA FICHE A TROUVÉ À SON PREMIER PASSAGE (2026-09-25, #757 → #807), et il vaut la
// peine de le raconter parce qu'il valide la méthode : la toute première fiche produite, celle de
// safe-export, affichait « portée — non renseigné ». Mesuré dans la foulée : `TOOL_PORTEE` compte
// 13 entrées pour 50 outils réels. **44 outils n'ont aucune portée déclarée**, et rien ne le
// signalait — parce que personne n'avait jamais interrogé ce registre sur un outil qui n'y était
// pas. C'est exactement le patron de l'Article 24 : une liste tenue à la main, sans garde-fou.
// Ce détecteur ne casse rien (44 échecs bloqueraient le dépôt) : il COMPTE et il NOMME, et le
// chiffre descend à mesure que le registre se remplit.
// CORRIGÉ le 2026-09-25 (tâche #832) — ET C'ÉTAIT UNE DETTE FANTÔME DE 45 OUTILS.
//
// La première version comptait comme « sans portée » tout outil absent de `TOOL_PORTEE`, et
// annonçait « 45 outils sur 53 (84,9 %) n'ont aucune portée ». Or le registre déclare juste
// au-dessus de lui-même, noir sur blanc : « tout le reste est de portée agence — déclaré par
// DÉFAUT plutôt qu'énuméré ici, pour qu'un nouvel outil hérite du cas majoritaire sans inscription
// manuelle (Article 24) ». Le défaut est le mécanisme, pas un trou.
//
// LA MESURE NE LISAIT DONC PAS LE MÊME OBJET QUE LE MÉCANISME : elle interrogeait le registre brut
// là où le code réel passe par `porteeDe()`. Elle a produit 45 lignes de dette qui n'existaient
// pas, et — pire — elle en faisait un objectif chiffré à combler, c'est-à-dire un travail inutile
// rendu obligatoire par une fausse mesure.
//
// TROIS ÉTATS remplacent les deux : DÉCLARÉE (le cas minoritaire, écrit exprès) · HÉRITÉE du défaut
// (parfaitement légitime, c'est le dispositif) · SUSPECTE (elle hérite « agence » alors que son
// propre code lit des données de SIMULATION — là, et là seulement, il y a une vraie question).
// Des chemins, jamais des mots. « transcript » tout court apparaît dans des phrases explicatives et
// même dans la DESCRIPTION d'un domaine (`"transcripts, dossiers, captures"`) — c'était le dernier
// faux positif, et il tenait dans une chaîne de caractères, là où retirer les commentaires ne
// suffit plus. Ne comptent donc que les formes qui désignent un CHEMIN réel qu'on ouvre.
export const SIGNAUX_DE_SIMULATION = /["'`(\/]docs\/simulations|["'`]full_sim|simulation-log|runSimulation\s*\(/;

export function findOutilsSansPortee(lignesRecensement = [], portees = {}, { defaut = "agence", lire = null } = {}) {
  const lignes = lignesRecensement.filter((l) => l.type === "outil");
  if (!lignes.length) return { mesurable: false, pourquoi: "aucun outil dans le recensement : rien à confronter au registre des portées, ce qui n'est pas la même chose qu'un registre complet" };
  const declares = []; const heritees = []; const suspectes = [];
  for (const l of lignes) {
    const slug = String(l.chemin).replace(/^scripts\//, "").replace(/\.mjs$/, "");
    if (portees[slug]) { declares.push(slug); continue; }
    const brut = typeof lire === "function" ? (lire(l.chemin) ?? "") : null;
    if (brut === null) { heritees.push(slug); continue; }
    // UNE MENTION N'EST PAS UN USAGE — leçon déjà payée deux fois dans ce dépôt (un script NOMMÉ
    // dans un commentaire de crochet n'est pas lancé par lui). La première version de cette
    // suspicion testait le fichier ENTIER et rendait 16 suspects, dont cassandra-rh, ecotoken et
    // tool-brain, qui ne citent « docs/simulations » que dans leur prose explicative. On retire
    // donc les commentaires et les chaînes de message avant de chercher.
    const code = String(brut)
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/^[ \t]*\/\/.*$/gm, " ");
    if (SIGNAUX_DE_SIMULATION.test(code)) suspectes.push(slug);
    else heritees.push(slug);
  }
  return {
    mesurable: true, outils: lignes.length, defaut,
    declares, heritees, suspectes,
    lectureFaite: typeof lire === "function",
    horsPortee: typeof lire === "function"
      ? "Une portée héritée n'est PAS un trou : c'est le dispositif voulu. Seule une suspicion — un outil qui lit de la simulation tout en héritant « agence » — mérite un regard, et c'est une question, jamais un verdict."
      : "Aucun lecteur de source fourni : les suspicions n'ont PAS été cherchées. Zéro suspecte ici veut dire « pas regardé », jamais « rien trouvé ».",
  };
}

// QUI DOIT VRAIMENT CONCLURE PAR UN PLAN D'ACTION (2026-09-25, tâche #833 — instruction de #803).
//
// LE CONSTAT D'ORIGINE disait « 28 outils sur 50 ne concluent pas » et la tâche demandait
// explicitement de l'instruire : « lesquels DOIVENT conclure (un outil qui rend une heure ou un
// chemin n'a pas de plan d'action à produire), et lesquels sont un vrai manque ».
//
// PREMIÈRE VÉRIFICATION, et elle a évité de refaire l'erreur de #807 : j'ai d'abord soupçonné un
// dénominateur trop large. MESURÉ : 41,5 % sur tous les outils, 44,8 % sur les seuls scanners.
// L'écart est minime — **le dénominateur n'était PAS le problème cette fois**, et le dire compte
// autant que l'inverse : une correction appliquée par analogie, sans mesure, aurait été une
// deuxième erreur habillée en leçon apprise.
//
// LE VRAI PARTAGE est ailleurs : un outil doit conclure s'il ÉMET DES CONSTATS — s'il imprime des
// écarts, des manques, des alertes. Un outil qui rend un ÉTAT (un catalogue, une sauvegarde, une
// liste de fichiers) n'a rien à transformer en tâche, et lui réclamer un plan d'action produirait
// une section vide écrite pour faire taire un contrôle : exactement la formalité que l'Article 28
// interdit en posant ses trois états.
//
// SA LIMITE, DÉCLARÉE : « émet des constats » se lit sur le code, donc sur la FORME de la sortie,
// jamais sur le sens. Un outil qui nomme ses écarts autrement passera pour un simple état. C'est
// une question posée à l'utilisateur, jamais un verdict — et les cas limites (un orchestrateur, un
// recommandeur d'outils) sont précisément ceux qu'aucune mécanique ne tranchera.
export const MOTIF_EMET_DES_CONSTATS = /console\.log\([^)]*(🔴|⚠️|écart|manquant)/;

// MOTIF_AVEU_DE_NON_MESURE (2026-09-25, tâche #863) — LA CORRECTION QUE LA DIVERGENCE A RÉVÉLÉE,
// et elle vaut mieux que le cas qui l'a déclenchée.
//
// CE QUI S'EST PASSÉ : `ou-on-en-est` a été déclaré dispensé après lecture de son code (il rend un
// BILAN, jamais un constat), et le garde-fou de #852 a aussitôt signalé la divergence — la
// dérivation, elle, le jugeait émetteur de constats. Une seule ligne de tout son fichier
// déclenchait le motif :
//     console.log("⚠️  Aucune tâche lue — rien n'a été mesuré, [...]")
// c'est-à-dire un AVEU D'ABSENCE DE MESURE, exactement ce que ce projet exige partout depuis #206.
//
// AUTREMENT DIT, LA DÉRIVATION PUNISSAIT LA BONNE CONDUITE : un outil qui déclare honnêtement
// « je n'ai rien pu mesurer » se retrouvait compté comme émetteur d'écarts, donc sommé de produire
// un plan d'action sur un non-constat. Un garde-fou qui accuse les conformes cesse d'être lu — le
// même patron que celui déjà corrigé sur PORTES_PLAN_DACTION (report-template.mjs).
//
// LE TEST DEVIENT DONC LIGNE À LIGNE, et il faut au moins UNE ligne de constat qui ne soit pas un
// aveu : un outil qui émet de vrais écarts ET déclare aussi ses absences de mesure reste bien un
// émetteur, ce qu'un test sur le fichier entier ne savait pas distinguer.
export const MOTIF_AVEU_DE_NON_MESURE = /rien n'a (été|pu être) mesuré|pas mesur|non mesurable|aucune mesure/i;

// Exporté pour être testable seul : c'est la brique que le motif seul ne sait plus porter.
export function emetDesConstats(code, { motif = MOTIF_EMET_DES_CONSTATS, aveu = MOTIF_AVEU_DE_NON_MESURE } = {}) {
  return String(code ?? "").split("\n").some((ligne) => motif.test(ligne) && !aveu.test(ligne));
}

export function findOutilsDevantConclure(lignesRecensement = [], { lire = null, motif = MOTIF_EMET_DES_CONSTATS } = {}) {
  const scanners = lignesRecensement.filter((l) => l.type === "outil" && l.classes?.includes("scanne-le-depot"));
  if (!scanners.length) return { mesurable: false, pourquoi: "aucun outil qui scanne le dépôt dans le recensement : rien à instruire, ce qui n'est pas la même chose que « tous concluent »" };
  if (typeof lire !== "function") return { mesurable: false, pourquoi: "aucun lecteur de source fourni : sans lire le code, « émet des constats » ne se distingue pas de « rend un état », et les deux se ressemblent exactement de l'extérieur" };
  const concluent = []; const doivent = []; const dispenses = [];
  for (const l of scanners) {
    const slug = String(l.chemin).replace(/^scripts\//, "").replace(/\.mjs$/, "");
    if (l.classes.includes("conclut-en-plan-daction")) { concluent.push(slug); continue; }
    const brut = lire(l.chemin) ?? "";
    const code = String(brut).replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^[ \t]*\/\/.*$/gm, " ");
    (emetDesConstats(code, { motif }) ? doivent : dispenses).push(slug);
  }
  return {
    mesurable: true, concluent, doivent, dispenses, scanners: scanners.length,
    horsPortee: "« Émet des constats » se lit sur la FORME de la sortie, jamais sur le sens : un outil qui nomme ses écarts autrement passera pour un simple état. Question posée, jamais verdict — et les cas limites sont ceux qu'aucune mécanique ne tranchera.",
  };
}

// findDispensesDivergentes() (2026-09-25, tâche #852) — LE GARDE-FOU QUE L'ARTICLE 24 RÉCLAME, et
// il est né d'une mesure, jamais d'un soupçon. La même question — « cet outil doit-il conclure par
// un plan d'action ? » — reçoit sa réponse de DEUX endroits qui ne se parlent pas :
//   · `SANS_CONSTAT_PROPRE` (report-template.mjs), une liste CURATÉE À LA MAIN, chaque entrée
//     portant sa raison écrite. Légitime telle quelle au sens de l'Article 24, qui autorise
//     explicitement un contenu manuel « tant que cette nature volontairement manuelle est écrite
//     noir sur blanc à côté ». C'est la source que lit pure-gold-unity.
//   · `findOutilsDevantConclure()` juste au-dessus, qui DÉRIVE la réponse de la source réelle
//     (`MOTIF_EMET_DES_CONSTATS`). C'est la source que lit CASSANDRA.
//
// CE QUE LA MESURE A DONNÉ, sur le vrai dépôt : CINQ divergences, dans les deux sens.
//   · dispensés par la dérivation, absents de la liste manuelle : god-of-all-process, sauvegarde-projet
//     — pure-gold-unity les accuse, CASSANDRA les excuse.
//   · déclarés dans la liste manuelle, jugés « doivent conclure » par la dérivation : check-spirit,
//     le-regisseur, tool-brain — pure-gold-unity les excuse, CASSANDRA les accuse.
// Autrement dit : cinq outils dont le verdict dépend du rapport qu'on ouvre. Ce n'est pas un écart
// de chiffres, c'est deux vérités qui coexistent sans que rien ne les confronte.
//
// CE QUE CETTE FONCTION NE FAIT PAS, ET C'EST DÉLIBÉRÉ : elle ne TRANCHE jamais. Fusionner les deux
// sources ou faire gagner l'une serait perdre ce que chacune sait — la liste manuelle porte des
// raisons qu'aucun motif ne peut lire (« le verdict sur l'esprit des personnages est une lecture,
// jamais un calcul »), et la dérivation attrape les outils que personne n'a pensé à déclarer. Le
// défaut n'est pas qu'elles diffèrent : c'est qu'elles diffèrent EN SILENCE. On nomme donc chaque
// divergence, avec son sens, et la décision reste humaine (Article 16).
export function findDispensesDivergentes(devantConclure, { declares = SANS_CONSTAT_PROPRE } = {}) {
  if (!devantConclure?.mesurable) {
    return { mesurable: false, pourquoi: `la dérivation n'a rien rendu (${devantConclure?.pourquoi ?? "raison inconnue"}) — sans elle il n'y a qu'UNE source, donc rien à confronter, ce qui n'est pas la même chose que « les deux s'accordent »` };
  }
  const listeDeclaree = new Set(Object.keys(declares ?? {}));
  const dispensesDerives = new Set(devantConclure.dispenses ?? []);
  // Sens 1 : la dérivation l'excuse, la liste manuelle ne le connaît pas → l'outil qui lit la liste
  // (pure-gold-unity) l'accusera de ne jamais conclure.
  const excusesNonDeclares = [...dispensesDerives].filter((s) => !listeDeclaree.has(s)).sort();
  // Sens 2 : la liste manuelle l'excuse, la dérivation le juge émetteur de constats → l'outil qui
  // dérive (CASSANDRA) l'accusera. Restreint aux scanners réellement instruits : un slug déclaré
  // qui n'est pas dans le recensement n'est pas une divergence, c'est simplement hors périmètre.
  const instruits = new Set([...(devantConclure.doivent ?? []), ...(devantConclure.concluent ?? []), ...dispensesDerives]);
  const declaresJugesEmetteurs = (devantConclure.doivent ?? []).filter((s) => listeDeclaree.has(s)).sort();
  return {
    mesurable: true,
    excusesNonDeclares, declaresJugesEmetteurs,
    total: excusesNonDeclares.length + declaresJugesEmetteurs.length,
    instruits: instruits.size, declares: listeDeclaree.size,
    horsPortee: "Cette comparaison dit QUE les deux sources divergent, jamais LAQUELLE a raison — chacune sait quelque chose que l'autre ignore, et arbitrer un cas précis reste une décision humaine (Article 16).",
  };
}

export function formatDispensesDivergentesLines(r) {
  if (!r?.mesurable) return [`  DISPENSES : PAS MESURÉ — ${r?.pourquoi ?? "aucune donnée"}`];
  if (!r.total) return [`  ✅ Les deux sources de dispense s'accordent sur les ${r.instruits} outil(s) instruits (liste manuelle de ${r.declares} entrées contre la dérivation).`];
  // Le libellé dit « ${r.total} outil(s) », jamais un nombre écrit en toutes lettres : la première
  // version disait « cinq », le chiffre du jour de sa naissance, et serait devenue fausse au premier
  // outil ajouté ou déclaré — exactement la liste figée que l'Article 24 interdit, dans le message
  // du garde-fou censé faire respecter l'Article 24.
  const L = [`  ⚠️ ${r.total} divergence(s) entre les DEUX sources de dispense — ${r.total} outil(s) dont le verdict dépend du rapport qu'on ouvre :`];
  if (r.excusesNonDeclares.length) {
    L.push(`     · dispensés par la DÉRIVATION mais absents de la liste manuelle : ${r.excusesNonDeclares.join(", ")}`);
    L.push(`       → pure-gold-unity les accuse de ne jamais conclure, CASSANDRA les excuse. À déclarer dans SANS_CONSTAT_PROPRE avec leur raison, ou à faire conclure.`);
  }
  if (r.declaresJugesEmetteurs.length) {
    L.push(`     · déclarés dans la liste manuelle mais jugés ÉMETTEURS DE CONSTATS par la dérivation : ${r.declaresJugesEmetteurs.join(", ")}`);
    L.push(`       → pure-gold-unity les excuse, CASSANDRA les accuse. Soit la raison écrite n'est plus vraie, soit le motif les lit mal.`);
  }
  L.push(`  HORS PORTÉE : ${r.horsPortee}`);
  return L;
}

export function formatDoiventConclureLines(d) {
  if (!d?.mesurable) return [`QUI DOIT CONCLURE : PAS MESURÉ — ${d?.pourquoi ?? "aucune donnée"}`];
  const L = [
    `  ${d.concluent.length}/${d.scanners} scanner(s) concluent déjà par un plan d'action.`,
    d.doivent.length
      ? `  🔴 ${d.doivent.length} ÉMETTENT DES CONSTATS sans conclure — vrai manque au sens de l'Article 28 : ${d.doivent.join(", ")}.`
      : "  Aucun outil qui émet des constats ne reste sans plan d'action.",
    d.dispenses.length
      ? `  ⚪ ${d.dispenses.length} rendent un ÉTAT plutôt que des constats (catalogue, sauvegarde, inventaire) : ${d.dispenses.join(", ")}. Leur réclamer un plan d'action produirait une section vide écrite pour faire taire un contrôle.`
      : "",
    `  HORS PORTÉE : ${d.horsPortee}`,
  ].filter(Boolean);
  return L;
}

export function formatFicheLines(f) {
  if (!f?.mesurable) return [`PAS DE FICHE — ${f?.pourquoi ?? "aucune donnée"}`];
  const L = [
    `=== FICHE — ${f.slug} ===`,
    `  ${f.pourquoi}${f.complete ? "" : "   ⚠️ fiche INCOMPLÈTE"}`,
    "",
  ];
  for (const l of f.lignes) {
    const val = l.renseigne ? l.valeur : `— non renseigné (${l.pourquoi})`;
    L.push(`  ${l.cle.padEnd(14)} ${l.quoi.padEnd(42)} ${val}`);
  }
  L.push("", `  Chaque ligne vient de : ${[...new Set(f.lignes.map((l) => l.source))].join(" · ")}`);
  L.push(`  HORS PORTÉE : ${f.horsPortee}`);
  return L;
}

export function formatAxesLines(lignes = [], { itemsRonde } = {}) {
  const L = [];
  L.push("--- 3e AXE : QUAND il intervient (un outil peut avoir plusieurs moments) ---");
  for (const [m, d] of Object.entries(MOMENTS).sort((a, b) => b[1].rang - a[1].rang)) {
    const dedans = lignes.filter((l) => l.moments?.includes(m));
    L.push(`${m.toUpperCase().padEnd(17)} ${String(dedans.length).padStart(3)} — ${d.quoi}`);
    if (m === "avant-le-geste") for (const l of dedans) L.push(`   · ${l.slug}`);
  }
  L.push("");
  L.push("--- 4e AXE : SUR QUOI il regarde (un outil peut en couvrir plusieurs) ---");
  for (const [n, d] of Object.entries(DOMAINES)) {
    const dedans = lignes.filter((l) => l.domaines?.includes(n));
    L.push(`${n.toUpperCase().padEnd(12)} ${String(dedans.length).padStart(3)} — ${d.quoi}`);
  }
  const muets = lignes.filter((l) => l.domainesMesurable === false);
  if (muets.length) {
    L.push("");
    L.push(`⚠️ ${muets.length} outil(s) dont le domaine N'EST PAS MESURABLE — aucun chemin lu dans du code exécuté. Ce n'est pas « aucun domaine » : c'est « on ne sait pas », et les deux ne se rendent pas pareil.`);
    for (const l of muets.slice(0, 12)) L.push(`   · ${l.slug}`);
    if (muets.length > 12) L.push(`   · … et ${muets.length - 12} autre(s)`);
  }
  const vides = Object.entries(DOMAINES).filter(([n]) => !lignes.some((l) => l.domaines?.includes(n)));
  L.push("");
  L.push(vides.length
    ? `🔴 ANGLE MORT — ${vides.length} domaine(s) que PERSONNE ne regarde : ${vides.map(([n]) => n).join(", ")}`
    : `✅ Chaque domaine a au moins un outil qui le regarde — ce qui ne dit pas qu'il le regarde BIEN.`);
  return L;
}

export function formatIcebergLines(lignes = []) {
  const par = (g) => lignes.filter((l) => l.groupe === g);
  const L = [];
  const illisibles = lignes.filter((l) => !l.mesurable);
  for (const [g, def] of Object.entries(GROUPES_ICEBERG).sort((a, b) => b[1].rang - a[1].rang)) {
    const liste = par(g);
    L.push(`${g.toUpperCase()} — ${liste.length} — ${def.quoi}`);
    if (g !== "membre") for (const l of liste) L.push(`   · ${l.slug} — ${l.pourquoi}`);
  }
  const sansMention = lignes.filter((l) => l.mesurable && !l.declare);
  const desaccords = lignes.filter((l) => l.desaccord);
  L.push("");
  L.push(`Mentions en tête : ${lignes.length - sansMention.length - illisibles.length}/${lignes.length - illisibles.length} posée(s).`);
  if (desaccords.length) {
    L.push(`🔴 ${desaccords.length} DÉSACCORD(S) entre ce que le fichier déclare et ce qui se dérive — jamais tranché en silence :`);
    for (const d of desaccords) L.push(`   · ${d.slug} : déclare « ${d.declare} », dérive « ${d.groupe} »`);
  }
  if (illisibles.length) L.push(`⚠️ ${illisibles.length} fichier(s) illisible(s) — non classés, jamais rangés au jugé.`);
  // Le groupe OUBLIÉ est le seul dont le nombre est une MAUVAISE nouvelle : il mesure ce que
  // personne ne présente. Un zéro ici est un vrai succès, et il faut donc le dire aussi.
  const oublies = par("oublie").length;
  L.push("");
  L.push(oublies === 0
    ? "✅ Aucun oublié : tout ce qui est convocable est présenté quelque part."
    : `⚠️ ${oublies} outil(s) convocables que RIEN ne présente. Ce groupe est temporaire par construction : chacun passe par le process primitif, un par un, jusqu'à ce qu'il soit vide.`);
  return L;
}

export function redondanceEntreOutils(prestations = [], { seuil = SEUIL_REDONDANCE } = {}) {
  const reelles = prestations.filter((p) => p?.demande && (p.outils ?? []).length);
  if (reelles.length < 2) {
    return { mesurable: false, pourquoi: "moins de deux prestations exploitables — aucune paire à comparer, ce qui n'est pas la même chose qu'aucune redondance" };
  }
  const ensembles = reelles.map((p) => motsDUneDemande(p.demande));
  const paires = pairesParJaccard(ensembles, { seuil });
  const questions = paires
    // Deux prestations servies par LE MÊME outil ne sont pas une redondance : c'est un outil qui
    // rend plusieurs services, ce que ce projet encourage précisément depuis cette nuit.
    .filter(({ i, j }) => !(reelles[i].outils ?? []).some((o) => (reelles[j].outils ?? []).includes(o)))
    .map(({ i, j, jaccard }) => ({
      a: reelles[i].nom, b: reelles[j].nom,
      outilsA: reelles[i].outils, outilsB: reelles[j].outils,
      proximite: Number(jaccard.toFixed(2)),
      question: `« ${reelles[i].nom} » (${reelles[i].outils.join(", ")}) et « ${reelles[j].nom} » (${reelles[j].outils.join(", ")}) répondent à des demandes proches à ${Math.round(jaccard * 100)} % : deux angles réellement distincts, ou un service rendu deux fois ?`,
    }))
    .sort((x, y) => y.proximite - x.proximite);
  return {
    mesurable: true, comparees: reelles.length, paires: questions,
    horsPortee: "elle compare les DEMANDES auxquelles les prestations répondent, jamais ce que les outils font vraiment. Une proximité de vocabulaire n'est pas un doublon : l'expérience MOÏSE/THE-KING a montré que le doublon annoncé n'en était pas un, et que le vrai défaut était ailleurs. Cette mesure montre où regarder, elle ne dit jamais quoi fusionner — et chaque ligne est une question, jamais un verdict.",
  };
}

// ————————————————————————————————————————————————————————————————————————
// LE DOCUMENT CENTRAL DE L'AGENCE (2026-09-24, chantier 6 du plan de nuit)
// ————————————————————————————————————————————————————————————————————————
//
// DEMANDE DE L'UTILISATEUR : « un document central décrivant l'Agence ».
//
// POURQUOI IL EST GÉNÉRÉ ET NON ÉCRIT, et c'est la seule décision qui compte ici : un document
// central écrit à la main est exactement l'objet que ce projet a déjà vu se périmer une douzaine
// de fois — une liste de neuf documents quand le dossier en comptait cinquante-trois, un effectif
// figé, une table de classification qui tournait depuis trois jours en ignorant six Articles. Un
// document central FAUX est pire qu'aucun : on le croit, et il occupe la place.
//
// Celui-ci se REGÉNÈRE depuis les registres réels — l'effectif, les types, les classes, les
// couches, les versions, les convocations — donc il ne peut pas mentir plus longtemps que le
// dépôt lui-même. Ce qu'il ne saura jamais dire (pourquoi l'Agence existe, ce que chaque outil
// vaut) reste écrit à la main, et il le déclare au lieu de le simuler.
export const AGENCE_HTML_PATH = "docs/referentiel/agence.html";

// LE PLAN D'ACTION DU RECENSEMENT, SORTI DU CLI (2026-09-24). Il y vivait, et c'est exactement
// pourquoi son défaut a survécu : un mécanisme enfermé dans une sous-commande n'est vérifiable que
// par une exécution réelle, donc en pratique par personne (leçon L2). Le bug était en plus
// INVISIBLE tant que le recensement ne trouvait rien — zéro constat, zéro appel, zéro erreur — et
// la sous-commande entière est tombée le jour où il a trouvé quelque chose. Un chemin de code qui
// n'existe que quand il y a à dire est un chemin de code que rien n'a jamais exécuté.
export function planDuRecensement(ecarts = []) {
  return [
    ...ecarts.filter((e) => e.nature === "constat").map((e) => ({
      constat: `${e.chemin} : ${e.question}`, etat: "retenu",
      tache: "porter ce constat à une tâche de docs/suivi/ (Article 28)" })),
    // Les QUESTIONS entrent dans le plan, ce qu'elles ne faisaient pas : « à trancher » est
    // précisément l'état que l'Article 28 prévoit pour un constat dont la décision n'appartient pas
    // à l'agent. Les laisser dehors les rendait invisibles au contrôle de la chaîne.
    ...ecarts.filter((e) => e.nature === "question").map((e) => ({
      constat: `${e.chemin} : ${e.question}`, etat: "a-trancher",
      pourquoi: "c'est un jugement sur l'utilité d'un fichier, jamais une mesure — il monte à l'utilisateur et ne se tranche pas ici" })),
  ];
}

// ===========================================================================================
// L'HISTORIQUE D'EVAL-IA : est-ce que l'agent progresse ?  (2026-09-24, chantier 5.7)
// ===========================================================================================
//
// La demande de l'utilisateur : « l'auto-évaluation engendre des tâches, et l'historique des
// EVAL-IA se consulte pour mesurer une progression ». Deux moitiés, et la seconde est la seule
// qui donne son sens à la première : une évaluation qui ne se compare à rien note une humeur.
//
// CE QUI A MOTIVÉ LE MÉCANISME plutôt qu'une bonne intention : l'édition du 2026-09-23 existe bien
// sur le disque (deux fichiers HTML) et ne s'est JAMAIS inscrite dans son propre tableau
// d'historique, qui affiche toujours « première édition à la prochaine Ronde ». Un registre qui se
// déclare vide alors que ses éditions sont là est le même faux vert que partout ailleurs cette
// nuit-là — et le laisser en tâche ouverte (#670) revenait à compter sur quelqu'un pour y penser.
// Il est désormais CONSTATÉ mécaniquement, en comparant les fichiers réels au tableau réel.

export const EVAL_IA_REGISTRE = "docs/cassandra-rh/evaluations/eval-ia.md";
export const EVAL_DOSSIER = "docs/cassandra-rh/evaluations";
export const MOTIF_EDITION_EVAL = /^(?:(\d{4}-\d{2}-\d{2})-)?eval-ia(?:-(\d{4}-\d{2}-\d{2}))?\.(?:md|html)$/i;

// Le tableau « Historique » du registre, lu tel qu'il est écrit. Une ligne de gabarit (celle qui
// annonce la première édition à venir) n'est PAS une édition : la compter ferait dire au registre
// qu'il contient déjà quelque chose.
export function lireHistoriqueEvalIa(markdown = "") {
  const lignes = String(markdown).split("\n");
  const debut = lignes.findIndex((l) => /^##\s+Historique/i.test(l));
  if (debut === -1) return { editions: [], mesurable: false, pourquoi: "le registre ne porte aucune section « Historique » : il n'y a rien à lire, ce qui n'est pas la même chose qu'un historique vide" };
  const editions = [];
  for (const l of lignes.slice(debut + 1)) {
    if (/^##\s/.test(l)) break;
    if (!/^\|/.test(l) || /^\|\s*-+/.test(l) || /^\|\s*Date\s*\|/i.test(l)) continue;
    const cellules = l.split("|").slice(1, -1).map((c) => c.trim());
    const [date, edition, constat, taches] = cellules;
    if (!date || date === "—" || /première édition/i.test(String(edition))) continue;
    editions.push({ date, edition, constat, taches, tachesCitees: [...String(taches ?? "").matchAll(/#(\d{1,5})/g)].map((m) => Number(m[1])) });
  }
  return { editions, mesurable: true, pourquoi: `${editions.length} édition(s) réellement inscrite(s)` };
}

// LE CONSTAT MÉCANIQUE qui remplace la tâche #670 : une édition présente sur le disque et absente
// du tableau. Rendue par fichier, jamais en un compte global — un compte ne dit pas laquelle
// manque, donc ne se corrige pas.
export function findEditionsEvalNonInscrites({ fichiers = [], historique = [] } = {}) {
  const datesInscrites = new Set(historique.map((e) => String(e.date).trim()));
  const manquantes = [];
  for (const f of fichiers) {
    const m = String(f).match(MOTIF_EDITION_EVAL);
    if (!m) continue;
    const date = m[1] ?? m[2];
    if (!date || datesInscrites.has(date)) continue;
    if (manquantes.some((x) => x.date === date)) continue;
    manquantes.push({ date, fichier: f,
      pourquoi: "l'édition existe sur le disque et ne figure pas dans le tableau d'historique de son propre registre",
      consequence: "le registre se déclare vide alors qu'il ne l'est pas — une progression ne peut pas se mesurer sur un historique qui s'ignore" });
  }
  return manquantes;
}

// COMBIEN D'ÉDITIONS AVANT DE PARLER DE PROGRESSION. Trois, le même plancher qu'AGENT-DU-TEMPS
// pour ses estimations, et pour la même raison écrite là-bas : sur deux points, une tendance
// ressemble déjà à une statistique alors qu'elle n'en est pas une.
export const MINIMUM_EDITIONS_PROGRESSION = 3;

export function progressionEvalIa(historique = [], { minimum = MINIMUM_EDITIONS_PROGRESSION } = {}) {
  const editions = [...historique].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (editions.length < minimum) {
    return { mesurable: false, editions: editions.length, tendance: null,
      pourquoi: `${editions.length} édition(s) sur ${minimum} requises — en dessous, une tendance ressemble à une mesure sans en être une` };
  }
  // Ce qui se mesure sans juger : le NOMBRE de tâches que chaque édition a réellement produites.
  // C'est le seul chiffre dur d'un rapport d'évaluation — le reste est du texte, et noter du texte
  // mécaniquement reviendrait à inventer une note.
  const serie = editions.map((e) => ({ date: e.date, taches: e.tachesCitees?.length ?? 0 }));
  const premiere = serie.slice(0, Math.ceil(serie.length / 2)).reduce((n, x) => n + x.taches, 0);
  const derniere = serie.slice(Math.ceil(serie.length / 2)).reduce((n, x) => n + x.taches, 0);
  return { mesurable: true, editions: editions.length, serie,
    tendance: derniere > premiere ? "plus de tâches produites qu'au début" : derniere < premiere ? "moins de tâches produites qu'au début" : "stable",
    horsPortee: "le nombre de tâches produites n'est PAS une note : plus de tâches peut vouloir dire une évaluation plus lucide comme un travail plus bâclé. C'est un indicateur à lire, jamais un verdict à afficher." };
}

// LA CHAÎNE DE L'ARTICLE 28, APPLIQUÉE À L'ÉVALUATION : une tâche annoncée comme acceptée doit
// exister pour de vrai dans le suivi. Une référence morte ressemble à un lien, ce qui est pire
// qu'une absence.
export function findTachesEvalFantomes(historique = [], numerosDuSuivi = []) {
  const connus = new Set(numerosDuSuivi.map(Number));
  const fantomes = [];
  for (const e of historique) {
    for (const n of e.tachesCitees ?? []) {
      if (!connus.has(n)) fantomes.push({ edition: e.date, numero: n,
        pourquoi: "l'évaluation dit avoir accepté cette tâche, et aucune ligne du suivi ne la porte" });
    }
  }
  return fantomes;
}

export function formatEvaluationsLines({ historique, nonInscrites = [], progression, fantomes = [] } = {}) {
  const L = [];
  if (!historique?.mesurable) { L.push(`Historique EVAL-IA : ${historique?.pourquoi ?? "illisible"}`); return L; }
  L.push(`Historique EVAL-IA : ${historique.editions.length} édition(s) inscrite(s).`);
  for (const m of nonInscrites) L.push(`  ⚠️ ${m.date} — ${m.pourquoi}. ${m.consequence}`);
  L.push(progression.mesurable
    ? `Progression : ${progression.tendance} (${progression.serie.map((x) => `${x.date}:${x.taches}`).join(" → ")}).`
    : `Progression : NON MESURABLE — ${progression.pourquoi}`);
  if (progression.mesurable) L.push(`  · ${progression.horsPortee}`);
  for (const f of fantomes) L.push(`  ⚠️ ${f.edition} — tâche #${f.numero} : ${f.pourquoi}`);
  return L;
}

export function buildDocumentAgence({ recensement, nivellement, couches, convocations = [], roster = [], dateLabel = new Date().toISOString() } = {}) {
  const blocks = [];
  blocks.push({ type: "paragraph", text: "Ce document est REGÉNÉRÉ depuis les registres réels du dépôt à chaque passage. Il ne se met pas à jour : il se recalcule. Un document central écrit à la main se périme, et un document central faux est pire qu'aucun — on le croit, et il occupe la place." });

  if (!recensement?.mesurable) {
    blocks.push({ type: "highlight", heading: "PAS MESURÉ", paragraphs: [recensement?.pourquoi ?? "le dépôt n'a pas pu être recensé — aucun état de l'Agence rendu, ce qui n'est jamais la même chose qu'une Agence vide."] });
    return renderHtmlReport({ tool: "cassandra-rh", title: "L'Agence Codex — document central", dateLabel, blocks });
  }

  blocks.push({ type: "heading", text: "L'effectif réel, par TYPE" });
  blocks.push({ type: "paragraph", text: `${recensement.total} fichiers dans scripts/. Le TYPE dit ce qu'un fichier EST — une question que ni le rang ni la portée ne posaient.` });
  blocks.push({ type: "table", headers: ["Type", "Combien", "Ce que c'est"],
    rows: Object.entries(recensement.parType).sort((a, b) => b[1].length - a[1].length)
      .map(([t, l]) => [t, String(l.length), TYPES_DE_SCRIPT[t] ?? "type non décrit"]) });

  blocks.push({ type: "heading", text: "Ce que l'équipe SAIT FAIRE, par classe transverse" });
  blocks.push({ type: "paragraph", text: "Une classe est une SONDE sur le source, jamais une liste de noms : un outil ajouté demain y entre sans que personne y pense, et une classe nouvelle s'applique le jour même à tous." });
  blocks.push({ type: "table", headers: ["Classe", "Combien", "Pourquoi elle compte"],
    rows: CLASSES_TRANSVERSES.map((c) => [c.libelle, String((recensement.parClasse[c.cle] ?? []).length), c.quoi]) });

  if (nivellement?.mesurable) {
    blocks.push({ type: "heading", text: "Le nivellement — ce que chaque classe EXIGE, et qui l'atteint" });
    blocks.push({ type: "note", text: "Le dénominateur est celui de l'EXIGENCE, jamais la population entière : un taux sur 82 pour une règle qui ne concerne que les 22 qui scannent serait juste sur le papier et faux sur le fond." });
    blocks.push({ type: "table", headers: ["Exigence", "Atteignent", "Ce que ça coûte de ne pas l'avoir"],
      rows: nivellement.lignes.map((l) => [l.cle, `${l.atteignent}/${l.concernes} (${l.part} %)`, l.pourquoi]) });
  }

  if (couches?.mesurable) {
    blocks.push({ type: "heading", text: "Les trois niveaux de scan" });
    blocks.push({ type: "table", headers: ["Niveau", "Ce que c'est"], rows: Object.entries(NIVEAUX_DE_SCAN) });
    blocks.push({ type: "list", items: [
      `${couches.meriteUneCouche.length} outil(s) tournent à chaque commit sans aucune façon d'aller plus loin : ils signalent, et ils s'arrêtent là.`,
      `${couches.warriors.length} outil(s) portent une vraie couche coûteuse.`,
      `${couches.candidatsEnchainement.length} candidat(s) à l'enchaînement light → warrior — PROPOSÉ, jamais câblé (Article 22).`,
    ] });
  }

  if (convocations.length) {
    blocks.push({ type: "highlight", heading: `${convocations.length} convocation(s) ouverte(s)`,
      paragraphs: convocations.map((c) => `${c.qui.toUpperCase()} — ${c.sujet} : ${c.question}`) });
  }

  blocks.push({ type: "heading", text: "Ce que ce document ne saura JAMAIS dire" });
  blocks.push({ type: "list", items: [
    "POURQUOI l'Agence existe : c'est le second projet mené en parallèle du jeu, et ça se lit dans CLAUDE.md, jamais dans un compte.",
    "Ce que chaque outil VAUT : la richesse dit ce qu'un outil porte, jamais ce qu'il vaut — un outil qui fait une seule chose et la fait bien sort pauvre et n'a rien à corriger.",
    "Si un couplage au jeu est un défaut ou la nature même de l'outil : ça demande de lire ce qu'il fait.",
    "Le TYPE se dérive de la forme du fichier et les CLASSES de sondes sur son texte : un outil qui scanne sans appeler readdirSync échappe à sa classe. Ce document dit ce qui se voit, jamais ce qui se comprend.",
  ] });

  return renderHtmlReport({
    tool: "cassandra-rh",
    title: "L'Agence Codex — document central",
    subtitle: "Regénéré depuis les registres réels à chaque passage. Il ne se met pas à jour, il se recalcule.",
    dateLabel, blocks,
    footer: "CASSANDRA-RH — elle ne recalcule jamais ce qu'un autre outil sait déjà : elle LIT ses résultats et les traduit en langage RH.",
  });
}

async function main() {
  printReliabilityNotice("cassandra-rh");
  recordCliUsage("cassandra-rh");
  // Les chemins RÉELS des registres, lus chez celui qui les déclare (doc-report) plutôt que
  // devinés (#840). Import dynamique et non statique : le crochet post-commit importe des
  // fonctions de ce fichier, et un import de tête ferait entrer doc-report dans cette chaîne —
  // la « tuyauterie par ricochet » que le filet avait déjà refusée le matin même sur HARMONIA.
  let registresDeclares = null;
  try { ({ REGISTRIES: registresDeclares } = await import("./doc-report.mjs")); } catch { /* repli sur la convention, déclaré dans derniereTrouvailleDuRegistre() */ }
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
  // RECENSEMENT (2026-09-24) — la même leçon que l'organigramme a déjà coûtée une fois : un
  // mécanisme qui ne sort pas du script est une intention, pas un outil. La commande existe donc
  // le jour même où les fonctions sont écrites, jamais « plus tard ».
  // Sous-commande `iceberg` (2026-09-24, tâche #707) : le partage visible / invisible calibré avec
  // l'utilisateur le soir même. Sous-commande à part et non un bloc du bilan RH, parce qu'elle ne
  // juge personne — elle RANGE. Confondre les deux ferait lire un classement comme un verdict.
  if (sub === "iceberg") {
    const fichiers = readdirSync(join(ROOT, "scripts")).filter((f) => f.endsWith(".mjs")).sort();
    const lu = (f) => { try { return readFileSync(join(ROOT, f), "utf8"); } catch { return ""; } };
    const offert = ["CLAUDE.md", "docs/regles-de-travail.md", "scripts/le-coordinateur.mjs",
      "scripts/circle-tasks.mjs", "scripts/tool-brain.mjs"].map(lu).join("\n");
    const machine = lanceParLaMachine({ packageJson: lu("package.json"),
      crochets: ["scripts/hooks/post-commit", "scripts/hooks/pre-commit", "scripts/hooks/install.mjs"].map(lu) });
    const lignes = classerIceberg(fichiers, { lire: (f) => lu(join("scripts", f)), offert, machine });
    console.log(`\n=== L'ICEBERG — ${fichiers.length} scripts, quatre groupes ===\n`);
    for (const l of formatIcebergLines(lignes)) console.log(l);
    // Les 3e et 4e axes sortent dans la MÊME commande, délibérément : trois sous-commandes qui
    // lisent les mêmes fichiers auraient fait relire le dépôt trois fois pour la même question,
    // « où en est la classification ? ». Ils restent trois blocs distincts à l'affichage, parce
    // qu'ils répondent à trois questions différentes et qu'un tableau unique les confondrait.
    const itemsRonde = new Set();
    for (const m of lu("scripts/circle-tasks.mjs").matchAll(/id:\s*"([a-z0-9-]+)"/g)) itemsRonde.add(m[1]);
    const axes = fichiers.map((f) => {
      const slug = f.replace(/\.mjs$/, "");
      const src = lu(join("scripts", f));
      const mom = momentsDeLOutil(slug, { offert, machine, itemsRonde });
      const dom = domainesDeLOutil(src);
      return { slug, moments: mom.moments, domaines: dom.domaines, domainesMesurable: dom.mesurable };
    });
    console.log("");
    for (const l of formatAxesLines(axes, { itemsRonde })) console.log(l);
    // LE 5e AXE sort dans la même commande que les 3e et 4e (#741) : trois sous-commandes qui
    // relisent les mêmes fichiers auraient fait relire le dépôt trois fois pour la même question.
    // Bloc distinct à l'affichage, parce qu'il répond à une question que les autres ne posent pas.
    const recIceberg = recenserLesScripts();
    const importeursIceberg = new Map((recIceberg.mesurable ? recIceberg.lignes : [])
      .map((l) => [String(l.chemin).replace(/^scripts\//, "").replace(/\.mjs$/, ""), l.importeurs ?? 0]));
    const dests = fichiers.map((f) => {
      const slug = f.replace(/\.mjs$/, "");
      return destinatairesDeLOutil(slug, {
        source: lu(join("scripts", f)),
        natureFichier: FILE_WRITER_NATURES[`scripts/${f}`]?.nature ?? null,
        moments: momentsDeLOutil(slug, { offert, machine, itemsRonde }).moments,
        importePar: importeursIceberg.get(slug) ?? 0,
        machine,
      });
    });
    console.log("");
    console.log("--- 5e AXE : À QUI LE RÉSULTAT SERT (tâche #741) ---");
    for (const l of formatDestinatairesLines(dests)) console.log(l);
    // LE POIDS ET LE GAIN D'UNE RÉDUCTION (#744) — juste après le 5e axe, parce qu'il en DÉPEND :
    // un gain en lignes ne dit rien sans savoir qui perd quoi.
    const destParSlug = new Map(fichiers.map((f, i) => [f.replace(/\.mjs$/, ""), dests[i].destinataires]));
    console.log("");
    console.log("--- LE POIDS, ET LE GAIN D'UNE RÉDUCTION (tâche #744) ---");
    for (const l of formatPoidsLines(poidsDesOutils(recIceberg.mesurable ? recIceberg.lignes : [], { destinatairesParSlug: destParSlug }))) console.log(l);
    console.log("");
    console.log("--- LES DEUX SYSTÈMES DE FAMILLES (tâche #754) ---");
    for (const l of formatFamillesLines(comparerLesFamilles({ categories: AGENT_CATEGORIES, registres: DOC_REPORT_REGISTRIES }))) console.log(l);
    // Le garde-fou par OUTIL sort dans la même commande que la comparaison par NOM : les deux
    // répondent à « les deux rangements disent-ils la même chose ? », et n'en imprimer qu'un
    // laisserait croire qu'un accord de vocabulaire vaut accord de rangement (#755).
    for (const l of formatDivergencesFamilleLines(findFamillesDivergentesParOutil({ categories: AGENT_CATEGORIES, registres: DOC_REPORT_REGISTRIES }))) console.log(l);
    console.log(`\nHORS PORTÉE : ce classement dit où RANGER un script, QUAND il intervient et SUR QUOI il regarde — jamais s'il est BON, ni s'il regarde BIEN. C'est le travail des Gardiens, et les deux ne se remplacent pas.`);
    return;
  }
  // `fiche <outil>` (2026-09-25, tâche #757) — « c'est quoi, ça sert à qui, ça pèse combien, et que
  // coûterait de s'en passer ». Sous-commande à part parce qu'elle répond sur UN outil quand
  // `iceberg` répond sur les quatre-vingts : la même information, mais on ne la cherche pas au même
  // moment ni pour la même décision. Et surtout : elle n'écrit NULLE PART — pas de quatorzième
  // registre, seulement une lecture des axes qui existent déjà.
  // `refus` (2026-09-25, tâche #654) : qui sait dire « je n'ai pas pu regarder », et comment.
  if (sub === "refus") {
    const rec = recenserLesScripts();
    const cibles = (rec.mesurable ? rec.lignes : []).filter((l) => l.classes?.includes("scanne-le-depot")).map((l) => l.chemin);
    console.log(`\n=== « JE N'AI PAS PU REGARDER » — trois façons, pas une (tâche #654) ===\n`);
    for (const l of formatRefusLines(auditDuRefus(cibles, { lire: (c) => { try { return readFileSync(join(ROOT, c), "utf8"); } catch { return null; } } }))) console.log(l);
    return;
  }
  if (sub === "fiche") {
    const demande = (process.argv[3] ?? "").replace(/^scripts\//, "").replace(/\.mjs$/, "");
    if (!demande) { console.log("\nUsage : node scripts/cassandra-rh.mjs fiche <nom-de-l-outil>"); return; }
    const fichiers = readdirSync(join(ROOT, "scripts")).filter((f) => f.endsWith(".mjs")).sort();
    const lu = (f) => { try { return readFileSync(join(ROOT, f), "utf8"); } catch { return ""; } };
    if (!fichiers.includes(`${demande}.mjs`)) {
      console.log(`\nPAS DE FICHE — aucun script « scripts/${demande}.mjs » dans le dépôt. Ce n'est pas une fiche vide : c'est un nom qui ne désigne rien ici.`);
      const proches = fichiers.map((f) => f.replace(/\.mjs$/, "")).filter((n) => n.includes(demande.slice(0, 5)) || demande.includes(n.slice(0, 5)));
      if (proches.length) console.log(`Peut-être : ${proches.slice(0, 5).join(", ")}`);
      return;
    }
    const offert = ["CLAUDE.md", "docs/regles-de-travail.md", "scripts/le-coordinateur.mjs",
      "scripts/circle-tasks.mjs", "scripts/tool-brain.mjs"].map(lu).join("\n");
    const machine = lanceParLaMachine({ packageJson: lu("package.json"),
      crochets: ["scripts/hooks/post-commit", "scripts/hooks/pre-commit", "scripts/hooks/install.mjs"].map(lu) });
    const itemsRonde = new Set();
    for (const m of lu("scripts/circle-tasks.mjs").matchAll(/id:\s*"([a-z0-9-]+)"/g)) itemsRonde.add(m[1]);
    const src = lu(`scripts/${demande}.mjs`);
    const rec = recenserLesScripts();
    const ligneRec = (rec.mesurable ? rec.lignes : []).find((l) => l.chemin === `scripts/${demande}.mjs`);
    const groupe = classerIceberg([`${demande}.mjs`], { lire: (f) => lu(join("scripts", f)), offert, machine })[0];
    const moments = momentsDeLOutil(demande, { offert, machine, itemsRonde }).moments;
    const importeurs = ligneRec?.importeurs ?? 0;
    const dest = destinatairesDeLOutil(demande, { source: src, natureFichier: FILE_WRITER_NATURES[`scripts/${demande}.mjs`]?.nature ?? null, moments, importePar: importeurs, machine });
    const destParSlug = new Map([[demande, dest.destinataires]]);
    const poids = poidsDesOutils(rec.mesurable ? rec.lignes : [], { destinatairesParSlug: destParSlug });
    const monPoids = (poids.outils ?? []).find((l) => l.slug === demande);
    const v = versionDepuisGit(`scripts/${demande}.mjs`);
    const r = richesse({ exports: (src.match(/^export (function|const)/gm) || []).length, classes: ligneRec?.classes,
      couches: couchesDuScript(`scripts/${demande}.mjs`, src, { crochets: lu("scripts/hooks/post-commit"), filetDeSecurite: lu("scripts/check-house.mjs"), couteux: outilsCouteuxDuCatalogue(PRESTATIONS) }) });
    const cat = AGENT_CATEGORIES[demande];
    const f = ficheDeLOutil(demande, {
      rang: rangDeLaCategorie(cat), famille: familleDeLaCategorie(cat),
      groupe: groupe?.groupe ?? null, type: ligneRec?.type ?? null, classes: ligneRec?.classes ?? null,
      destinataires: dest.destinataires, moments, domaines: domainesDeLOutil(src).domaines,
      // `porteeDe()` et jamais le registre brut : une portée héritée du défaut EST une portée
      // (tâche #832). La lire directement dans TOOL_PORTEE affichait « non renseigné » sur 45 outils.
      portee: porteeDe(demande),
      poids: monPoids ? `${monPoids.lignes} lignes (${monPoids.part.toFixed(1)} % de l'Agence)` : (ligneRec?.lignes ? `${ligneRec.lignes} lignes` : null),
      // LE COÛT DE DÉPART — c'est la ligne qui justifie le chantier entier, selon sa formule :
      // « c'est chez qui ? c'est un sujet export ». Elle vient de poidsDesOutils(), jamais d'un
      // second calcul : libre (personne ne le sent partir) · entraînant (d'autres outils le lisent)
      // · visible (l'utilisateur le verrait disparaître).
      coutDeDepart: monPoids?.couts?.length ? monPoids.couts.join(", ") : null,
      version: v.mesurable ? v.version : null,
      richesse: r ? `${r.score}/${r.sur} (${r.tenus.join(", ")})` : null,
      // LE SEUL CHAMP QUI OUVRE VRAIMENT UN FICHIER DU REGISTRE (#490) : tous les autres lisent le
      // code ou git. Celui-ci lit ce que l'outil a ÉCRIT, ce que dix outils faisaient semblant de
      // faire en citant seulement le chemin.
      derniereTrouvaille: (() => {
        // `registresDeclares` est chargé plus haut dans main() : le registre DÉCLARÉ (doc-report)
        // a priorité sur la convention `docs/<slug>/`, parce que quatre registres réels vivent
        // ailleurs et que les deviner rendait « inatteignable » sur des registres NOURRIS (#840).
        const t = derniereTrouvailleDuRegistre(demande, { registres: registresDeclares, lire: (c) => { try { return readFileSync(join(ROOT, c), "utf8"); } catch { return null; } } });
        return t.mesurable ? `${t.date} — ${t.resume.slice(0, 90)} (${t.passages} passage(s) consigné(s))` : null;
      })(),
    });
    console.log("");
    for (const l of formatFicheLines(f)) console.log(l);
    return;
  }
  // `cadrage` (#743) — LE SIGNAL DE FIN DU CHANTIER DE CLASSIFICATION, mesuré plutôt que ressenti.
  // Sous-commande à part de `iceberg` : celle-ci ne classe personne, elle dit COMBIEN il reste.
  // `score` (#147) — son idée de 2026-09-19, reprise et tranchée le 2026-09-25 : ce que chaque
  // membre a TROUVÉ, contre une cible dérivée de la médiane. Sous-commande à part de `fiche` :
  // celle-ci dit ce qu'un outil EST, celle-là ce qu'il a PRODUIT — et les deux réponses ne se
  // lisent pas au même moment ni dans le même état d'esprit.
  if (sub === "score") {
    console.log(CASSANDRA_PERSONA);
    const slugs = readdirSync(join(ROOT, "scripts")).filter((f) => f.endsWith(".mjs")).map((f) => f.replace(/\.mjs$/, "")).sort();
    const r = scoreDesMembres(slugs, {
      lire: (c) => { try { return readFileSync(join(ROOT, c), "utf8"); } catch { return null; } },
      registres: DOC_REPORT_REGISTRIES,
    });
    console.log("");
    for (const l of formatScoreLines(r)) console.log(l);
    const constats = [];
    if (r.mesurable && !r.discriminant) constats.push({ etat: "retenu", constat: r.pourquoiPeuDiscriminant, tache: `donner un registre atteignable aux ${r.sansRegistre.length} membres qui n'en ont pas — c'est ce qui débloque la mesure, jamais durcir la cible` });
    if (r.mesurable && r.sousLaCible.length) constats.push({ etat: "a-trancher", constat: `${r.sousLaCible.length} membre(s) sous la cible de ${r.cible}`, pourquoi: "un outil peut avoir trouvé peu parce que son terrain est propre — c'est une question de lecture, jamais un verdict de paresse (Article 16)" });
    const plan = buildPlanDaction(constats, { toolSlug: "cassandra-rh" });
    console.log(`\n${PLAN_ACTION_TITRE}`);
    console.log(plan.lignes.join("\n"));
    return;
  }
  if (sub === "cadrage") {
    console.log(CASSANDRA_PERSONA);
    const fichiers = readdirSync(join(ROOT, "scripts")).filter((f) => f.endsWith(".mjs")).sort();
    const lu = (f) => { try { return readFileSync(join(ROOT, f), "utf8"); } catch { return ""; } };
    const offert = ["CLAUDE.md", "docs/regles-de-travail.md", "scripts/le-coordinateur.mjs",
      "scripts/circle-tasks.mjs", "scripts/tool-brain.mjs"].map(lu).join("\n");
    const machine = lanceParLaMachine({ packageJson: lu("package.json"),
      crochets: ["scripts/hooks/post-commit", "scripts/hooks/pre-commit", "scripts/hooks/install.mjs"].map(lu) });
    const lignes = classerIceberg(fichiers, { lire: (f) => lu(join("scripts", f)), offert, machine });
    const itemsRonde = new Set();
    for (const m of lu("scripts/circle-tasks.mjs").matchAll(/id:\s*"([a-z0-9-]+)"/g)) itemsRonde.add(m[1]);
    // Le TYPE se LIT dans le recensement plutôt que d'être recalculé ici : il demande un contexte
    // entier (fiches, importeurs, portes d'entrée) et deux calculs du même axe finiraient par
    // diverger — c'est exactement le défaut que tout ce chantier existe pour fermer.
    const rec = recenserLesScripts();
    const typeParChemin = new Map((rec.mesurable ? rec.lignes : []).map((l) => [l.chemin, l.type]));
    // Le nombre d'importeurs est LU dans le recensement, jamais recompté — même raison que le type.
    const importeursParSlug = new Map((rec.mesurable ? rec.lignes : [])
      .map((l) => [String(l.chemin).replace(/^scripts\//, "").replace(/\.mjs$/, ""), l.importeurs ?? 0]));
    const c = cadrageDeLaClassification(lignes, {
      axesParScript: (l) => {
        // La ligne d'iceberg porte un SLUG, jamais un nom de fichier — vérifié sur sa forme réelle
        // plutôt que supposé, après un premier passage qui a planté sur un chemin `undefined`.
        const slug = l.slug;
        const src = lu(join("scripts", `${slug}.mjs`));
        const type = typeParChemin.get(`scripts/${slug}.mjs`);
        return {
          iceberg: l.mesurable ? l.groupe : null,
          type: type && type !== "illisible" ? type : null,
          moment: momentsDeLOutil(slug, { offert, machine, itemsRonde }).moments,
          domaine: domainesDeLOutil(src).mesurable ? domainesDeLOutil(src).domaines : [],
          destinataire: destinatairesDeLOutil(slug, {
            source: src,
            natureFichier: FILE_WRITER_NATURES[`scripts/${slug}.mjs`]?.nature ?? null,
            moments: momentsDeLOutil(slug, { offert, machine, itemsRonde }).moments,
            importePar: importeursParSlug.get(slug) ?? 0,
            machine,
          }).destinataires,
        };
      },
    });
    console.log(`\n=== CADRAGE DU CHANTIER DE CLASSIFICATION (tâche #743) ===\n`);
    for (const l of formatCadrageLines(c)) console.log(l);
    // LE REGISTRE DES PORTÉES, confronté au recensement réel (#807) — trouvé par la toute première
    // fiche produite, pas par une revue : safe-export affichait « portée non renseignée ».
    const rp = recenserLesScripts();
    const sp = findOutilsSansPortee(rp.mesurable ? rp.lignes : [], TOOL_PORTEE, {
      lire: (chemin) => { try { return readFileSync(join(ROOT, chemin), "utf8"); } catch { return null; } },
    });
    console.log("");
    console.log("--- LE REGISTRE DES PORTÉES (tâche #807, mesure corrigée #832) ---");
    if (!sp.mesurable) console.log(`  PAS MESURÉ — ${sp.pourquoi}`);
    else {
      console.log(`  ${sp.declares.length}/${sp.outils} portée(s) DÉCLARÉE(s) · ${sp.heritees.length} HÉRITÉE(s) du défaut « ${sp.defaut} » — et une portée héritée n'est pas un trou, c'est le dispositif.`);
      console.log(sp.suspectes.length
        ? `  ⚠️ ${sp.suspectes.length} SUSPECTE(s) — elles héritent « ${sp.defaut} » alors que leur code lit de la simulation : ${sp.suspectes.join(", ")}. Question, jamais verdict.`
        : `  Aucune suspecte : aucun outil héritant du défaut ne lit de données de simulation.`);
      console.log(`  HORS PORTÉE : ${sp.horsPortee}`);
    }
    // QUI DOIT VRAIMENT CONCLURE (tâche #833, instruction de #803).
    console.log("");
    console.log("--- LE PLAN D'ACTION : QUI LE DOIT VRAIMENT (tâche #803 instruite en #833) ---");
    const devantConclure = findOutilsDevantConclure(rp.mesurable ? rp.lignes : [], {
      lire: (chemin) => { try { return readFileSync(join(ROOT, chemin), "utf8"); } catch { return null; } },
    });
    for (const l of formatDoiventConclureLines(devantConclure)) console.log(l);
    // LES DEUX SOURCES DE DISPENSE, CONFRONTÉES (tâche #852). Sans ça, chacune reste juste dans son
    // propre rapport et fausse l'autre en silence — l'Article 24 appelle exactement ça une copie
    // tenue à la main sans vérification que rien ne diverge.
    for (const l of formatDispensesDivergentesLines(findDispensesDivergentes(devantConclure))) console.log(l);
    return;
  }
  if (sub === "recensement") {
    console.log(CASSANDRA_PERSONA);
    const rec = recenserLesScripts();
    if (!rec.mesurable) { console.log(`\nPAS MESURÉ — ${rec.pourquoi}`); return; }
    console.log(`\n=== RECENSEMENT DES SCRIPTS — ${rec.total} fichiers ===\n`);
    console.log("--- PAR TYPE (ce qu'un fichier EST) ---");
    for (const [t, l] of Object.entries(rec.parType).sort((a, b) => b[1].length - a[1].length)) {
      console.log(`${String(l.length).padStart(3)}  ${t} — ${TYPES_DE_SCRIPT[t] ?? "type non décrit"}`);
    }
    console.log("\n--- PAR CLASSE TRANSVERSE (ce qu'un fichier SAIT FAIRE) ---");
    for (const c of CLASSES_TRANSVERSES) {
      console.log(`${String((rec.parClasse[c.cle] ?? []).length).padStart(3)}  ${c.libelle} — ${c.quoi}`);
    }
    const ecarts = ecartsDuRecensement(rec);
    const constats = ecarts.filter((e) => e.nature === "constat");
    const questions = ecarts.filter((e) => e.nature === "question");
    console.log(`\n--- ${constats.length} CONSTAT(S) : mesurés, ils tiennent tels quels ---`);
    for (const e of constats) console.log(`· ${e.chemin} — ${e.question}`);
    console.log(`\n--- ${questions.length} QUESTION(S) : un jugement que cet outil ne rend pas ---`);
    for (const e of questions) console.log(`· ${e.chemin} — ${e.question}`);
    const niv = nivellementParClasse(rec);
    if (niv.mesurable) {
      console.log("\n--- LE NIVELLEMENT : ce que chaque classe EXIGE, et qui l'atteint ---");
      console.log("(le dénominateur est celui de l'EXIGENCE, jamais la population entière : un taux sur 82 pour une règle qui ne concerne que les 22 qui scannent serait juste sur le papier et faux sur le fond)");
      for (const l of niv.lignes) console.log(`${String(l.part).padStart(4)}%  ${String(l.atteignent).padStart(3)}/${String(l.concernes).padEnd(3)}  ${l.cle} → doit porter « ${l.exige} »`);
      console.log(`\n   ${niv.horsPortee}`);
    }
    console.log(`\nHORS PORTÉE : ${rec.horsPortee}`);
    // Le plan lui-même vit dans `planDuRecensement()`, exporté et testé — jamais ici (leçon L2).
    const plan = buildPlanDaction(planDuRecensement(ecarts), { toolSlug: "cassandra-rh" });
    console.log(`\n=== ${PLAN_ACTION_TITRE} ===`);
    for (const l of plan.lignes) console.log(l);
    return;
  }
  // CONVOCATION (2026-09-24) — la commande existe le jour même où les fonctions sont écrites.
  if (sub === "convocation") {
    console.log(CASSANDRA_PERSONA);
    const data = collectRealCassandraData({ withCoverage: false });
    const niv = nivellementParClasse(recenserLesScripts());
    const convocations = convoquer({
      reconsider: data.reconsider ?? [],
      nivellement: niv,
      objectifsRows: data.objectifs?.rows ?? [],
    });
    console.log(`\n=== CONVOCATIONS — ${convocations.length} ===\n`);
    if (!convocations.length) {
      console.log("Personne n'est convoqué. Ce n'est pas rien à dire : ça veut dire qu'aucun outil ne stagne, qu'aucun n'est resté sans être appelé, et qu'aucune exigence n'est tenue par moins de la moitié de ceux qu'elle concerne.");
    }
    for (const q of Object.keys(CONVOCABLES)) {
      const lot = convocations.filter((c) => c.qui === q);
      if (!lot.length) continue;
      console.log(`--- CONVOQUÉ : ${q.toUpperCase()} (${CONVOCABLES[q]}) — ${lot.length} ---`);
      for (const c of lot) {
        console.log(`· ${c.sujet} [${c.motif}]`);
        console.log(`    QUESTION : ${c.question}`);
        for (const r of c.raisons) console.log(`    · ${r}`);
      }
      console.log("");
    }
    console.log("RÈGLE DE CLÔTURE, non négociable : une convocation ne se clôt QUE avec un accord daté de l'utilisateur ET une raison écrite.");
    console.log("Toute autre tentative est relayée nommément comme une tentative de faire taire l'alerte — un agent qui écrit lui-même « traité » la fait disparaître sans que personne d'autre l'ait vue.");
    console.log(`Registre : ${REGISTRE_CONVOCATIONS}`);
    const plan = buildPlanDaction(
      // « à trancher » par nature, jamais « retenu » : une convocation POSE une question dont la
      // réponse n'appartient pas à l'agent. La marquer retenue reviendrait à la traiter seul, ce
      // que la règle de clôture interdit précisément.
      convocations.map((c) => ({ etat: "a-trancher", constat: `${c.qui.toUpperCase()} convoqué sur « ${c.sujet} » [${c.motif}]`, pourquoi: c.question })),
      { toolSlug: "cassandra-rh", tache: "porter chaque convocation à l'utilisateur en question ouverte, et n'en clore aucune sans son accord daté et sa raison écrite" },
    );
    console.log(`\n=== ${PLAN_ACTION_TITRE} ===`);
    for (const l of plan.lignes) console.log(l);
    return;
  }
  if (sub === "redondance") {
    console.log(CASSANDRA_PERSONA);
    const r = redondanceEntreOutils(PRESTATIONS);
    if (!r.mesurable) { console.log(`\nPAS MESURÉ — ${r.pourquoi}`); return; }
    console.log(`\n=== REDONDANCE FONCTIONNELLE — ${r.comparees} prestations comparées, ${r.paires.length} paire(s) proche(s) ===\n`);
    console.log("Distinct de CLONE-HUNTER, qui mesure des BLOCS DE CODE recopiés : celle-ci mesure deux outils qui");
    console.log("répondent à la même QUESTION, même sans partager une ligne. On factorise le premier, on fusionne ou");
    console.log("on sépare mieux le second.\n");
    for (const q of r.paires) console.log(`· ${q.proximite}  ${q.question}`);
    if (!r.paires.length) console.log("Aucune paire au-dessus du seuil. Ce n'est pas rien à dire : le catalogue ne rend pas deux fois le même service.");
    console.log(`\nHORS PORTÉE : ${r.horsPortee}`);
    return;
  }
  // Sous-commande `evaluations` (2026-09-24, chantier 5.7) : l'historique d'EVAL-IA, ce qu'il dit
  // d'une progression, et les deux façons dont il peut mentir — une édition qui ne s'est pas
  // inscrite, une tâche acceptée qui n'existe nulle part.
  // Sous-commande `uniformisation` (2026-09-24, chantier 2.2). Distincte de `recensement`, qui
  // porte le nivellement : là on compare à une règle écrite, ici à ce que la famille fait déjà.
  if (sub === "uniformisation") {
    console.log(CASSANDRA_PERSONA);
    const rec = recenserLesScripts();
    const u = uniformisationParFamille(rec);
    console.log(`\n=== UNIFORMISATION PAR FAMILLE — ce que les semblables font, et qui s'en écarte ===\n`);
    for (const l of formatUniformisationLines(u)) console.log(l);
    console.log(`\nHORS PORTÉE : ${u.horsPortee ?? "—"}`);
    if (u.mesurable) {
      const plan = buildPlanDaction(
        u.familles.flatMap((f) => f.ecarts.map((e) => ({ constat: e.question, etat: "a-trancher",
          pourquoi: "l'écart est mesuré, la raison ne l'est pas — un outil peut s'écarter de ses semblables à bon droit (Article 19)" }))),
        { toolSlug: "cassandra-rh" },
      );
      console.log(`\n=== ${PLAN_ACTION_TITRE} ===`);
      for (const l of plan.lignes) console.log(l);
    }
    return;
  }
  if (sub === "evaluations") {
    console.log(CASSANDRA_PERSONA);
    let registre = "";
    try { registre = readFileSync(join(ROOT, EVAL_IA_REGISTRE), "utf8"); } catch { /* absent */ }
    const historique = lireHistoriqueEvalIa(registre);
    let fichiers = [];
    try { fichiers = readdirSync(join(ROOT, EVAL_DOSSIER)); } catch { /* absent */ }
    const nonInscrites = findEditionsEvalNonInscrites({ fichiers, historique: historique.editions });
    const progression = progressionEvalIa(historique.editions);
    let numeros = [];
    try {
      const dir = join(ROOT, "docs/suivi/sessions");
      for (const f of readdirSync(dir)) {
        for (const m of readFileSync(join(dir, f), "utf8").matchAll(/^\|\s*(\d{1,5})\s*\|/gm)) numeros.push(Number(m[1]));
      }
    } catch { /* absent */ }
    const fantomes = findTachesEvalFantomes(historique.editions, numeros);
    console.log(`\n=== ÉVALUATIONS DE L'AGENT — l'historique, et ce qu'il permet de mesurer ===\n`);
    for (const l of formatEvaluationsLines({ historique, nonInscrites, progression, fantomes })) console.log(l);
    console.log(`\nHORS PORTÉE : je lis ce que le registre DIT de lui-même. Je ne relis pas les rapports eux-mêmes et je ne juge jamais la qualité d'une évaluation — seulement qu'elle s'est inscrite, et que ce qu'elle a promis existe.`);
    return;
  }
  if (sub === "agence") {
    console.log(CASSANDRA_PERSONA);
    const rec = recenserLesScripts();
    let crochets = ""; let filet = "";
    try { crochets = readFileSync(join(ROOT, "scripts/hooks/post-commit"), "utf8"); } catch { /* absent */ }
    try { filet = readFileSync(join(ROOT, "scripts/check-house.mjs"), "utf8"); } catch { /* absent */ }
    const sources = {};
    if (rec.mesurable) for (const l of rec.lignes) { try { sources[l.chemin] = readFileSync(join(ROOT, l.chemin), "utf8"); } catch { /* illisible */ } }
    const data = collectRealCassandraData({ withCoverage: false });
    const html = buildDocumentAgence({
      recensement: rec,
      nivellement: nivellementParClasse(rec),
      couches: analyseDesCouches(rec, { crochets, filetDeSecurite: filet, sources, couteux: outilsCouteuxDuCatalogue(PRESTATIONS) }),
      convocations: convoquer({ reconsider: data.reconsider ?? [], nivellement: nivellementParClasse(rec), objectifsRows: data.objectifs?.rows ?? [] }),
    });
    writeFileSync(join(ROOT, AGENCE_HTML_PATH), html, "utf8");
    // La contribution s'enregistre DANS le geste qui écrit, jamais dans une étape séparée qu'on
    // peut sauter — c'est le garde-fou qui a refusé ce commit-ci, et il avait raison.
    recordRegistryWrite(AGENCE_HTML_PATH, { par: "cassandra-rh" });
    console.log(`\nDocument central de l'Agence regénéré : ${AGENCE_HTML_PATH}`);
    console.log("Il ne se met pas à jour, il se RECALCULE — un document central écrit à la main se périme, et un document central faux est pire qu'aucun.");
    return;
  }
  if (sub === "versions") {
    console.log(CASSANDRA_PERSONA);
    const rec = recenserLesScripts();
    if (!rec.mesurable) { console.log(`\nPAS MESURÉ — ${rec.pourquoi}`); return; }
    let crochets = ""; let filet = "";
    try { crochets = readFileSync(join(ROOT, "scripts/hooks/post-commit"), "utf8"); } catch { /* absent */ }
    try { filet = readFileSync(join(ROOT, "scripts/check-house.mjs"), "utf8"); } catch { /* absent */ }
    const couteux = outilsCouteuxDuCatalogue(PRESTATIONS);
    console.log("\n=== LA VERSION DE L'AGENCE ENTIÈRE (2026-09-25, tâche #730) ===\n");
    for (const l of formatVersionAgenceLines(versionDeLAgence())) console.log(l);
    console.log("\n  Ni la somme ni la moyenne des versions ci-dessous : la somme monterait à chaque faute de frappe corrigée,");
    console.log("  et la moyenne BAISSERAIT le jour où un outil neuf rejoint l'équipe — un nouveau membre ferait reculer");
    console.log("  la version de l'équipe. La composition de l'équipe est à l'Agence ce que la surface exportée est à un outil.");
    console.log("\n=== VERSION ET RICHESSE, OUTIL PAR OUTIL ===\n");
    console.log("Deux échelles SÉPARÉES, à la demande de l'utilisateur, et la raison est bonne : la VERSION dit ce qui");
    console.log("s'est passé (combien de fois l'outil a changé de capacités), la RICHESSE dit ce qu'il EST aujourd'hui.");
    console.log("Un outil écrit d'un jet peut être très riche ; un outil repris vingt fois peut rester pauvre.\n");
    console.log(`${"OUTIL".padEnd(30)}${"VERSION".padEnd(10)}RICHESSE`);
    const lignes = [];
    for (const l of rec.lignes.filter((x) => x.type === "outil")) {
      let src = ""; try { src = readFileSync(join(ROOT, l.chemin), "utf8"); } catch { continue; }
      const v = versionDepuisGit(l.chemin);
      const r = richesse({
        exports: (src.match(/^export (function|const)/gm) || []).length,
        classes: l.classes,
        couches: couchesDuScript(l.chemin, src, { crochets, filetDeSecurite: filet, couteux }),
      });
      lignes.push({ nom: l.chemin.replace("scripts/", "").replace(".mjs", ""), v, r });
    }
    lignes.sort((a, b) => b.r.score - a.r.score);
    for (const x of lignes) console.log(`${x.nom.padEnd(30)}${(x.v.mesurable ? x.v.version : "n/a").padEnd(10)}${x.r.score}/${x.r.sur}  ${x.r.tenus.join(", ")}`);
    console.log(`\nHORS PORTÉE (richesse) : ${richesse({}).horsPortee}`);
    console.log(`HORS PORTÉE (version) : ${VERSION_OUTIL_HORS_PORTEE}`);
    console.log("Le MAJEUR ne compte pas les commits : il compte ceux qui ont touché la surface exportée, c'est-à-dire");
    console.log("les fois où l'outil a gagné ou perdu une capacité. Compter tous les commits aurait rendu un numéro qui");
    console.log("grandit avec l'agitation plutôt qu'avec les capacités — et un chiffre pareil se lit pourtant comme une mesure.");
    return;
  }
  if (sub === "couches") {
    console.log(CASSANDRA_PERSONA);
    const rec = recenserLesScripts();
    if (!rec.mesurable) { console.log(`\nPAS MESURÉ — ${rec.pourquoi}`); return; }
    let crochets = ""; let filet = "";
    try { crochets = readFileSync(join(ROOT, "scripts/hooks/post-commit"), "utf8") + readFileSync(join(ROOT, "scripts/hooks/pre-commit"), "utf8"); } catch { /* absent */ }
    try { filet = readFileSync(join(ROOT, "scripts/check-house.mjs"), "utf8"); } catch { /* absent */ }
    const sources = {};
    for (const l of rec.lignes) { try { sources[l.chemin] = readFileSync(join(ROOT, l.chemin), "utf8"); } catch { /* illisible */ } }
    const a = analyseDesCouches(rec, { crochets, filetDeSecurite: filet, sources, couteux: outilsCouteuxDuCatalogue(PRESTATIONS) });
    if (!a.mesurable) { console.log(`\nPAS MESURÉ — ${a.pourquoi}`); return; }
    console.log("\n=== LES TROIS NIVEAUX DE SCAN ===\n");
    for (const [k, v] of Object.entries(NIVEAUX_DE_SCAN)) console.log(`  ${k.padEnd(8)} ${v}`);
    const court = (l) => l.map((x) => x.replace("scripts/", "").replace(".mjs", "")).join(", ");
    console.log(`\n--- QUI MÉRITERAIT UNE SECONDE COUCHE (${a.meriteUneCouche.length}) ---`);
    console.log("Ils tournent à chaque commit et n'ont aucune façon d'aller plus loin quand ils trouvent quelque chose : ils signalent, et ils s'arrêtent là.");
    console.log(`  ${court(a.meriteUneCouche)}`);
    console.log(`\n--- LA COUCHE LOURDE EXISTE CHEZ (${a.warriors.length}) ---`);
    console.log(`  ${court(a.warriors) || "aucun"}`);
    console.log(`\n--- CANDIDATS À L'ENCHAÎNEMENT light → warrior (${a.candidatsEnchainement.length}) ---`);
    console.log(`  ${court(a.candidatsEnchainement) || "aucun"}`);
    console.log(`\nHORS PORTÉE : ${a.horsPortee}`);
    return;
  }
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
  toolsTableMarkdown = lireTableMaitresse(),
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
    // Le RANG se lit à part de la FAMILLE (2026-09-25, #754). Avant, le libellé entier servait aux
    // deux : « Agent Cadre » testé en égalité stricte, et le même libellé utilisé comme clé de
    // suite. Le jour où chaque catégorie a porté « Rang — Famille », LE-COORDINATEUR a cessé d'être
    // reconnu comme Agent Cadre et s'est retrouvé rangé en Membre — silencieusement, parce qu'un
    // rang manquant ne laisse aucun trou visible : il remplit juste le rang d'à côté.
    const rang = rangDeLaCategorie(cat);
    const famille = familleDeLaCategorie(cat);
    if (gardienSlugs.has(m.slug)) { parRang.gardien.push(m); continue; }
    if (rang === "Agent Cadre") { parRang.cadre.push(m); continue; }
    parRang.membre.push(m);
    (suites[famille ?? cat] ??= []).push(m);
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

  // LE PLAN D'ACTION (2026-09-23, tâche #211). CASSANDRA est l'Agent Cadre RH : elle constate
  // l'état de l'équipe, elle ne corrige jamais personne. Ses constats se séparent nettement en
  // deux, et les mélanger ferait d'elle un juge de valeur alors qu'elle est une greffière.
  //
  // Un membre certifié SANS SUITE assignée est un fait vérifiable et corrigeable : il est
  // littéralement invisible dans l'organigramme tant que ce n'est pas tranché. RETENU.
  //
  // Un outil « à reconsidérer », lui, reste à TRANCHER quoi qu'il arrive : il est signalé parce
  // qu'il n'a jamais été sollicité ou qu'il stagne, jamais parce qu'il serait prouvé inutile.
  // Retirer un outil de l'équipe est une décision humaine — et le garde-fou trottoirGranted
  // (Article 19) dit exactement pourquoi : ce qui n'a pas bougé n'est pas pour autant mort.
  const constatsRH = [
    ...(org?.sansCategorie ?? []).map((nom) => ({ constat: `${nom} est certifié mais sans suite assignée`, etat: "retenu",
      tache: `assigner ${nom} à une suite de l'organigramme, ou déclarer qu'il n'en relève d'aucune` })),
    ...(Array.isArray(reconsider) ? reconsider : []).map((r) => ({
      constat: `outil à reconsidérer : ${r.outil ?? r.tool ?? r} — ${r.pourquoi ?? r.raison ?? "signal de désuétude"}`,
      etat: "a-trancher",
      pourquoi: "jamais sollicité ou en stagnation est un signal, jamais une preuve d'inutilité — retirer un membre de l'équipe est une décision humaine (leçon trottoirGranted, Article 19)",
    })),
  ];
  const planRH = buildPlanDaction(constatsRH, { toolSlug: "cassandra-rh" });
  console.log(`\n=== ${PLAN_ACTION_TITRE} ===`);
  for (const l of planRH.lignes) console.log(l);
}

// LE LANCEUR EN DERNIER (2026-09-23, deuxième occurrence du même bug en une heure). Il était au
// milieu du fichier, donc main() partait avant que ORG_RANKS — déclaré deux cents lignes plus bas —
// n'existe : la sous-commande `organigramme` plantait sur une zone morte temporelle. safe-export.mjs
// portait exactement le même défaut le même jour. Deux fois le même bug n'est plus un accident
// (Article 3), d'où le garde-fou mécanique ajouté dans doc-report.mjs : findLanceursPrematures().
if (import.meta.url === `file://${process.argv[1]}`) main();
