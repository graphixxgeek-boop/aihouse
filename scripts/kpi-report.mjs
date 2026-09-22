// Tableau de bord / KPI — rapport à la demande (2026-09-19, demande explicite de l'utilisateur : «
// penses-tu qu'il soit intéressant de mettre au point des KPI pour ce projet [...] et de créer
// un rapport régulier sur ces chiffres pour suivre l'avancée du projet ? »). Cf.
// docs/referentiel/tableau-de-bord.md pour les règles complètes du système (familles, accès,
// alertes).
//
// Chantier 2 (2026-09-19, même jour, demande explicite complémentaire) : « chaque KPI en rapport
// avec une décision, une action à mener [...] je veux un tableau de bord avec des données SMART,
// intelligentes, manipulables » — chaque % ci-dessous est donc accompagné d'une lecture concrète
// (ce que ce chiffre implique, quoi faire s'il se dégrade), jamais un nombre nu. Deux KPI
// spécifiques au Smart Breaker (performance globale + améliorations réalisées sur l'outil
// lui-même) sont affichés en tête, en gras, à chaque exécution.
//
// KPI de couverture du tableau de bord lui-même (2026-09-19, demande explicite : « crée un KPI
// général qui juge des performances du tableau de bord lui-même ») : les fonctions de calcul
// ci-dessous sont exportées et testées directement dans scripts/check-house.mjs (demande explicite
// du même jour : « un test est-il prévu dédié au tableau de bord ? ») — sans ce test, un bug de
// formule (constaté deux fois pendant la construction de cette version : une regex qui ratait deux
// blocs de test, une suite de tests qui dépassait 100% de robustesse) ne serait détecté qu'à la
// lecture humaine du rapport, jamais avant. Le KPI de couverture lui-même compte combien des 6
// familles (Smart Conso ajoutée le 2026-09-20, écart réel comblé) ont produit une vraie mesure
// cette fois (jamais une estimation) ET si ce test dédié est
// vert — les deux ensemble disent si ce tableau de bord est digne de confiance MAINTENANT, pas
// seulement s'il existe.
//
// Usage : `node scripts/kpi-report.mjs`. Jamais un processus en continu (Article 8 de CLAUDE.md) —
// à lancer à la demande, par l'utilisateur ou par l'agent (avant/après un changement de code, ou en
// fin de chantier, cf. "Quand les valeurs se mettent à jour" dans le document de référence, et
// désormais une étape explicite de l'Article 18 après chaque simulation complète).
import {execSync} from 'node:child_process';
import { recordRegistryWrite } from './tool-usage.mjs';
import {readFileSync, readdirSync, statSync, existsSync, appendFileSync, writeFileSync, mkdtempSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {collectCoverage, robustnessScore} from './axa-check.mjs';
import {recordOutcomeByLabel} from './gemini-key-health.mjs';
import {renderHtmlReport} from './html-report.mjs';
import {burstComplianceScore} from './smart-conso-api.mjs';
import {computeAdoptionKpi, checkKnowledgeFreshness} from './smart-conso-token.mjs';
import {persistContextWeightSamples, averageContextWeightByActor, loadHistory as loadMementoWeightHistory} from './memento-weight.mjs';
import {recordCliUsage} from './tool-usage.mjs';
import { buildPlanDaction, PLAN_ACTION_TITRE } from "./report-template.mjs";

const root = new URL('..', import.meta.url).pathname;
const path = (...parts) => join(root, ...parts);

function section(title) { console.log(`\n== ${title} ==`); }
// Un score non-fini (NaN, Infinity — donnée malformée en amont) ne s'affiche JAMAIS comme un
// pourcentage plausible (2026-09-19, retour utilisateur explicite : « des informations erronées
// pourrait conduire tout le projet dans une mauvaise direction ») : mieux vaut un "N/A" visible et
// honnête qu'un faux chiffre qui inspirerait confiance à tort.
function pct(n) { return Number.isFinite(n) ? `${Math.round(n)}%` : 'N/A (donnée invalide)'; }
const isFiniteNumber = n => typeof n === 'number' && Number.isFinite(n);

// --- Fonctions pures de calcul (exportées, testées dans scripts/check-house.mjs) ---------------
// Chaque fonction ci-dessous valide la FORME de ses entrées avant de calculer quoi que ce soit :
// une métrique manquante, du mauvais type, ou une division par zéro renvoie `undefined` — jamais
// NaN, jamais un 0% qui se ferait passer pour une vraie mesure. C'est délibéré : ce module nourrit
// des décisions réelles (cf. l'en-tête du fichier), donc une donnée douteuse doit être visiblement
// absente plutôt que silencieusement fausse.

// `coverageScore` (2026-09-19, cf. AXA-CHECK) est optionnel — jamais un paramètre obligatoire qui
// casserait les appels existants. Omis ou invalide, le calcul reste EXACTEMENT celui d'avant
// (moyenne à deux termes) : aucune régression silencieuse du KPI historique. Fourni et valide, il
// rejoint la moyenne comme un troisième terme à poids égal, jamais un simple affichage à côté.
export function codeHealthScore(tscErrors, passed, expected, coverageScore) {
    if (!isFiniteNumber(tscErrors) || !isFiniteNumber(passed) || !isFiniteNumber(expected) || expected <= 0) return undefined;
    const tscScore = tscErrors === 0 ? 100 : 0;
    const testScore = Math.min(100, (passed / expected) * 100);
    if (!isFiniteNumber(coverageScore)) return { tscScore, testScore, overall: (tscScore + testScore) / 2 };
    return { tscScore, testScore, coverageScore, overall: (tscScore + testScore + coverageScore) / 3 };
}

export function smartBreakerPerformanceScore(m) {
    if (!m || !isFiniteNumber(m.successes) || !isFiniteNumber(m.attempts) || m.attempts <= 0) return undefined;
    return (m.successes / m.attempts) * 100;
}

export function smartBreakerImprovementScore(capabilities) {
    if (!Array.isArray(capabilities) || capabilities.length === 0) return undefined;
    const done = capabilities.filter(c => c.done).length;
    return { score: (done / capabilities.length) * 100, done, total: capabilities.length };
}

export function qualityScore(m) {
    if (!m || !isFiniteNumber(m.antiEchoInterventions) || !isFiniteNumber(m.turns) || m.turns <= 0) return undefined;
    return 100 - (m.antiEchoInterventions / m.turns) * 100;
}

export function coherenceScore(m) {
    if (!m || !m.truncationInterventions || !isFiniteNumber(m.truncationInterventions[1]) || !isFiniteNumber(m.truncationInterventions[2]) || !isFiniteNumber(m.turns) || m.turns <= 0) return undefined;
    const total = m.truncationInterventions[1] + m.truncationInterventions[2];
    return 100 - (total / m.turns) * 100;
}

export function replayabilityScore(m) {
    if (!m || !isFiniteNumber(m.distinctBonuses) || !isFiniteNumber(m.totalBonusTypes) || m.totalBonusTypes <= 0) return undefined;
    return (m.distinctBonuses / m.totalBonusTypes) * 100;
}

// Famille KPI "Smart Conso" (2026-09-20, écart réel trouvé et comblé : une réponse de calibrage
// déjà donnée par l'utilisateur — « taux de respect de leur consigne : par moi, par toi, par les
// outils. KPI des tokens/API économisées grâce à l'outil + efficacité des process actuels + un
// indice de fraîcheur aussi » — n'avait jamais été construite, confondue à tort avec un correctif
// voisin mais distinct (rendre le détail KPI déjà calculé visible en HTML). Même patron que
// codeHealthScore ci-dessus : moyenne des composantes RÉELLEMENT mesurables cette fois, une
// composante absente est exclue plutôt que de faire chuter la moyenne à zéro.
// - complianceScore (Smart Conso API, `burstComplianceScore`) : la SEULE composante de ce paysage
//   backée par une preuve indépendante du vrai trafic API — jamais un biais de survivance, contrairement
//   à l'historique de SMART-CONSO-TOKEN qui ne voit que les consultations réellement faites.
// - adoptionReductionPct (SMART-CONSO-TOKEN, `computeAdoptionKpi`) : la réduction moyenne réelle des
//   propositions déjà appliquées — l'efficacité réelle des process actuels, jamais un nombre de scans.
// - freshnessOk (SMART-CONSO-TOKEN, `checkKnowledgeFreshness`) : la connaissance des schémas coûteux
//   est-elle encore valide pour le modèle courant.
export function smartConsoScore(m) {
    const parts = [];
    if (isFiniteNumber(m?.complianceScore)) parts.push(m.complianceScore);
    if (isFiniteNumber(m?.adoptionReductionPct)) parts.push(Math.min(100, Math.max(0, m.adoptionReductionPct)));
    if (typeof m?.freshnessOk === 'boolean') parts.push(m.freshnessOk ? 100 : 0);
    if (!parts.length) return undefined;
    return parts.reduce((a, b) => a + b, 0) / parts.length;
}

// dashboardCoverageScore : combien des familles (6 pour ce projet, cf. tableau-de-bord.md) ont
// produit une vraie mesure CETTE exécution (jamais un chiffre par défaut ni une estimation) — un
// tableau de bord qui n'affiche que 2 familles réelles sur le total n'est pas "en panne", mais son
// utilisateur doit le savoir avant de faire
// confiance à la synthèse globale. Un score de famille invalide (NaN/Infinity, ne devrait jamais
// arriver vu les gardes ci-dessus, mais vérifié quand même) compte comme NON mesuré, jamais comme
// une mesure douteuse acceptée telle quelle.
// Distinction « hors de portée ici » / « cassé » (2026-09-22, décision explicite de l'utilisateur
// pendant la Ronde AUTO). Problème réel corrigé : quatre des six familles (performance, qualité de
// sortie, cohérence logique, rejouabilité) ne peuvent structurellement PAS être mesurées sans un
// serveur de jeu qui tourne avec du vrai trafic — ce qui n'arrive jamais pendant une Ronde. La
// couverture affichait donc 33 % et levait une alerte à CHAQUE passage, pour une raison qui n'est
// pas un défaut. Une alerte toujours rouge est une alerte qu'on cesse de lire, y compris le jour où
// elle signale autre chose : c'est le vrai risque, pas le chiffre lui-même.
// Le score porte désormais sur les seules familles qui POUVAIENT être mesurées dans ce contexte ;
// les familles hors de portée sont comptées et nommées à part, jamais fondues dans le même chiffre.
// Rétrocompatible à dessein : un simple tableau de scores (l'appel historique, et tous les tests
// déjà écrits contre lui) se comporte exactement comme avant, aucune famille n'étant alors déclarée
// hors de portée.
export function dashboardCoverageScore(entries) {
    const normalized = (entries ?? []).map(e => (e && typeof e === 'object' && 'score' in e ? e : { score: e, outOfReach: false }));
    const total = normalized.length;
    const outOfReach = normalized.filter(e => e.outOfReach);
    const inReach = normalized.filter(e => !e.outOfReach);
    const isMeasured = e => e.score !== undefined && (typeof e.score !== 'number' || Number.isFinite(e.score));
    const measured = normalized.filter(isMeasured).length;
    const measuredInReach = inReach.filter(isMeasured).length;
    return {
        // `score` reste la couverture parmi ce qui était atteignable — c'est lui qui déclenche
        // l'alerte. Sans aucune famille atteignable, 100 % est la réponse honnête : rien n'a
        // échoué, il n'y avait simplement rien à mesurer ici (jamais 0 %, qui accuserait à tort).
        score: inReach.length > 0 ? (measuredInReach / inReach.length) * 100 : 100,
        measured,
        total,
        measuredInReach,
        inReachTotal: inReach.length,
        outOfReach: outOfReach.map(e => e.famille).filter(Boolean),
    };
}

// Total de blocs de test connus (2026-09-19) : compté statiquement dans le script lui-même plutôt
// que deviné, pour que le % de la suite reste honnête même en cas d'échec en cours de route (le
// runner s'arrête au premier assert qui lève, donc "combien ont réussi avant" ne dit rien seul sur
// "combien restaient" sans ce total de référence). Bug réel trouvé et corrigé le 2026-09-19 : la
// regex ratait les blocs utilisant des guillemets doubles (console.log("Passed:...")) — cf. le
// test dédié dans check-house.mjs qui aurait dû exister avant, pas seulement après.
export function expectedTestBlockCount(checkHouseSource) {
    return (checkHouseSource.match(/console\.log\(['"]Passed:/g) ?? []).length;
}

// --- Historique CSV (2026-09-19, demande explicite de l'utilisateur) ---------------------------
// « le rapport de performance global [...] tu l'envoies dans un fichier séparé [...] Dans ce
// rapport, ça parle de l'historique des chiffres : on retrouve des tableaux avec l'évolution des
// chiffres sur plusieurs versions de simulation [...] je veux un fichier qui consomme un minimum
// de tokens ». CSV choisi plutôt que texte libre ou JSON : une ligne par exécution, des en-têtes
// auto-descriptifs, aucune clé répétée à chaque ligne (contrairement au JSON) — le format le plus
// compact pour un historique tabulaire, et lisible tel quel dans un tableur si besoin. Committé
// dans le dépôt (docs/referentiel/) : c'est exactement le genre de donnée qui manquerait à qui
// reprend le projet si la session s'arrêtait maintenant (cf. règles de suivi,
// docs/regles-de-travail.md §10) — jamais un fichier scratchpad perdu à la fin de la session.
export const KPI_HISTORY_PATH = join('docs', 'referentiel', 'kpi-historique.csv');
export const KPI_HISTORY_COLUMNS = [
    'run', 'horodatage', 'smart_breaker_performance_pct', 'smart_breaker_amelioration_pct',
    'robustesse_code_pct', 'qualite_pct', 'coherence_pct', 'rejouabilite_pct', 'couverture_tdb_pct',
    'tsc_erreurs', 'points_fragiles', 'sb_tours', 'sb_tentatives', 'sb_succes', 'sb_429', 'sb_503', 'sb_401_403',
    'anti_echo_interventions', 'truncation_lia', 'truncation_noe', 'bonus_distincts', 'bonus_total',
    'smart_conso_pct',
];
// csvRowFor : fonction pure (testée) qui construit une ligne à partir des données du rapport —
// une valeur absente (famille non mesurée cette fois) reste une cellule VIDE, jamais "undefined"
// ou "NaN" écrit tel quel dans le fichier (même principe de fiabilité que le reste du rapport).
export function csvRowFor(run, d) {
    const cell = v => (v === undefined || v === null || Number.isNaN(v)) ? '' : String(Math.round(v * 100) / 100);
    return [
        run, new Date().toISOString(), cell(d.smartBreakerPerformance), cell(d.smartBreakerImprovement),
        cell(d.codeHealth), cell(d.quality), cell(d.coherence), cell(d.replayability), cell(d.coverage),
        cell(d.tscErrors), cell(d.fragilePoints), cell(d.sbTurns), cell(d.sbAttempts), cell(d.sbSuccesses),
        cell(d.sb429), cell(d.sb503), cell(d.sb401403), cell(d.antiEchoInterventions),
        cell(d.truncationLia), cell(d.truncationNoe), cell(d.bonusDistinct), cell(d.bonusTotal),
        cell(d.smartConso),
    ].join(',');
}
export function appendHistoryRow(csvRow) {
    const full = path(KPI_HISTORY_PATH);
    if (!existsSync(full)) writeFileSync(full, KPI_HISTORY_COLUMNS.join(',') + '\n');
    appendFileSync(full, csvRow + '\n');
    // TROISIÈME MOMENT OPPORTUN (2026-09-23) — une ligne d'historique KPI nourrit le registre que
    // CASSANDRA-RH et objectifs-vs-resultats relisent réellement pour juger une tendance. Le
    // bénéficiaire se DÉDUIT du chemin écrit, jamais nommé ici (cf. recordRegistryWrite).
    recordRegistryWrite(KPI_HISTORY_PATH, { par: 'kpi-report' });
}

// parseKpiHistoryCsv (déplacée depuis cassandra-rh.mjs, 2026-09-21 — même bug de duplication de
// parseur que CLONE-HUNTER trouvait déjà entre smart-conso-api.mjs/smart-conso-token.mjs le même
// soir : objectifs-vs-resultats.mjs a besoin exactement de la même lecture pour un objectif de type
// "kpi:<colonne>", jamais un second parseur divergent, et jamais un import d'objectifs-vs-resultats
// vers cassandra-rh.mjs — l'organigramme reste plat, CASSANDRA consomme les autres Membres, jamais
// l'inverse). Parseur minimal volontaire : les colonnes de kpi-historique.csv sont toutes des
// nombres ou des chaînes simples sans virgule interne (KPI_HISTORY_COLUMNS ci-dessus) — un vrai
// parseur CSV (guillemets, virgules échappées) serait une dépendance de plus pour un besoin qui
// n'existe pas dans ce fichier précis. Une cellule vide reste `undefined`, jamais une chaîne vide
// ni un 0 fabriqué (Article 1.9 de docs/philosophie-et-politique.md : une mesure absente doit
// rester visiblement absente).
export function parseKpiHistoryCsv(csvText) {
    const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return [];
    const header = lines[0].split(',');
    const rows = [];
    for (const line of lines.slice(1)) {
        const cells = line.split(',');
        const row = {};
        header.forEach((col, i) => {
            const raw = cells[i];
            row[col] = raw === undefined || raw === '' ? undefined : (Number.isNaN(Number(raw)) ? raw : Number(raw));
        });
        rows.push(row);
    }
    return rows;
}

// Gabarit HTML de remise (2026-09-19, scripts/html-report.mjs, cf. docs/regles-de-travail.md pour
// la décision de calibrage) : rend la MÊME synthèse compacte que celle déjà loggée ci-dessus, pour
// une remise à l'utilisateur plus agréable qu'un tableau markdown collé en texte — jamais un
// second calcul, jamais une donnée supplémentaire par rapport à la synthèse déjà existante.
// L'historique CSV (`KPI_HISTORY_PATH`, committé) reste la seule version de travail relue par
// d'autres outils ; ce fichier HTML (`KPI_HTML_PATH`, jamais committé, cf. .gitignore) est
// entièrement régénéré à chaque exécution, une simple copie de présentation jetable.
export const KPI_HTML_PATH = '.kpi-report-latest.html';
// Extrait une seule fois (2026-09-20) pour ne jamais dupliquer la construction des 7 lignes entre
// la synthèse compacte et le rapport complet ci-dessous — règle anti-doublon, §7ter.
function synthesisRows(d) {
    const cellPct = v => (v === undefined ? 'N/A' : pct(v));
    return [
        ['🔧 Smart Breaker — performance', cellPct(d.performance)],
        ['📈 Smart Breaker — améliorations', d.improvement === undefined ? 'N/A' : pct(d.improvement.score)],
        ['Robustesse du code', d.health === undefined ? 'N/A' : pct(d.health.overall)],
        ['Qualité de sortie', cellPct(d.quality)],
        ['Cohérence logique', cellPct(d.coherence)],
        ['Rejouabilité (partiel)', cellPct(d.replay)],
        ['Smart Conso', cellPct(d.smartConso)],
        ['Couverture du tableau de bord', pct(d.coverage.score)],
    ];
}
function alertBlockFor(d) {
    return d.alerts.length
        ? { type: 'note', text: `🚨 Points d'attention : ${d.alerts.join(', ')}.` }
        : { type: 'paragraph', text: 'Aucun point d’attention — tout est vert.' };
}
export function buildKpiSynthesisHtml(run, d) {
    return renderHtmlReport({
        title: 'Rapport KPI — Maison IA vivante',
        subtitle: 'Synthèse compacte du tableau de bord interne (cf. docs/referentiel/tableau-de-bord.md).',
        dateLabel: `Run : ${run}`,
        blocks: [
            { type: 'table', headers: ['Famille', 'KPI global'], rows: synthesisRows(d) },
            alertBlockFor(d),
        ],
        footer: `Historique complet (toutes les exécutions, tous les chiffres) : ${KPI_HISTORY_PATH}.`,
    });
}
// Rapport HTML COMPLET (2026-09-20, demande explicite de l'utilisateur : « je n'ai pas eu de
// rapport tableau de bord [...] j'ai une visibilité sur tous les chiffres en html ? »). La synthèse
// compacte ci-dessus ne portait QUE les 7 pourcentages arrondis — jamais le détail réel (tours,
// tentatives, 429/503/401, capacités du Smart Breaker une par une, taille du code, etc.) déjà
// affiché dans le terminal mais jamais rendu en HTML. Ce rapport reprend TOUTES les données déjà
// calculées par main() — jamais un second calcul, jamais un chiffre inventé pour l'occasion —
// simplement le même détail, structuré en blocs plutôt que collé en texte brut de terminal.
export function buildKpiFullReportHtml(run, full) {
    const synthesisTable = { type: 'table', headers: ['Famille', 'KPI global'], rows: synthesisRows(full) };
    const alertBlock = alertBlockFor(full);
    const capabilitiesList = (full.capabilities ?? []).map(c => `${c.done ? '✅' : '⬜'} ${c.name}`);

    const smartBreakerRows = full.smartBreakerDetail ? [
        ['Tours réels (appels Gemini nécessaires)', String(full.smartBreakerDetail.turns)],
        ['Clé principale déjà indisponible au départ du tour', `${full.smartBreakerDetail.primaryKeyUnavailableAtStart} / ${full.smartBreakerDetail.turns} (${full.smartBreakerDetail.turns ? Math.round(100 * full.smartBreakerDetail.primaryKeyUnavailableAtStart / full.smartBreakerDetail.turns) : 0}%)`],
        ['Tentatives clé × modèle', String(full.smartBreakerDetail.attempts)],
        ['— réussies', String(full.smartBreakerDetail.successes)],
        ['— bloquées par quota (429)', String(full.smartBreakerDetail.quotaFailures)],
        ['— erreurs transitoires (503)', String(full.smartBreakerDetail.transientFailures)],
        ['— clés invalides (401/403)', String(full.smartBreakerDetail.invalidFailures)],
    ] : undefined;

    const codeHealthRows = [
        ['Erreurs tsc (hors vite.config.ts, préexistante)', String(full.tscErrors)],
        ['Tests check-house.mjs', full.tests ? `${full.tests.passed}/${full.tests.expected} bloc(s)${full.tests.green ? '' : ' — SUITE ROUGE'}` : 'N/A'],
        ['Couverture réelle par fonction (AXA-CHECK)', full.tests?.coverageScore === undefined ? 'N/A' : pct(full.tests.coverageScore)],
        ['Points fragiles ouverts', String(full.fragilePoints)],
        ['lib/lia.ts', `${full.stats?.liaLines ?? 'N/A'} lignes`],
        ['lib/dialogue.ts', `${full.stats?.dialogueLines ?? 'N/A'} lignes`],
        ['Fichiers dans lib/', String(full.stats?.libFileCount ?? 'N/A')],
    ];

    const qualityCoherenceRows = full.qualityDetail ? [
        ['Tours mesurés', String(full.qualityDetail.turns)],
        ['Interventions anti-écho (repli de secours)', String(full.qualityDetail.antiEchoInterventions)],
        ['Troncatures de sécurité — Lia', String(full.qualityDetail.truncationInterventions?.[1] ?? 0)],
        ['Troncatures de sécurité — Noé', String(full.qualityDetail.truncationInterventions?.[2] ?? 0)],
    ] : undefined;

    const replayRows = full.replayDetail ? [
        ['Bonus distincts vus (12 derniers tirages)', `${full.replayDetail.distinctBonuses} / ${full.replayDetail.totalBonusTypes}`],
    ] : undefined;

    const smartConsoRows = full.smartConsoDetail ? [
        ['Conformité API (salves confirmées avant d\'agir)', full.smartConsoDetail.complianceDetail ? `${pct(full.smartConsoDetail.complianceDetail.score)} (${full.smartConsoDetail.complianceDetail.confirmed}/${full.smartConsoDetail.complianceDetail.total} salve(s))` : 'N/A (aucune salve détectée)'],
        ['Propositions SMART-CONSO-TOKEN appliquées', String(full.smartConsoDetail.adoptionDetail?.propositionsAppliquees ?? 0)],
        ['Réduction moyenne mesurée', full.smartConsoDetail.adoptionDetail?.reductionMoyennePct !== undefined ? pct(full.smartConsoDetail.adoptionDetail.reductionMoyennePct) : 'N/A'],
        ['Fraîcheur des schémas connus', full.smartConsoDetail.freshnessMessage ?? 'N/A'],
    ] : undefined;

    return renderHtmlReport({
        title: 'Rapport KPI complet — Maison IA vivante',
        subtitle: 'Tableau de bord interne, détail complet (cf. docs/referentiel/tableau-de-bord.md) — chaque chiffre déjà calculé par kpi-report.mjs, jamais un second calcul ni une estimation pour l’occasion.',
        dateLabel: `Run : ${run}`,
        blocks: [
            { type: 'heading', text: 'Synthèse par famille' },
            synthesisTable,
            alertBlock,
            { type: 'heading', text: 'Smart Breaker — détail des tours réels' },
            ...(smartBreakerRows ? [{ type: 'table', headers: ['Mesure', 'Valeur'], rows: smartBreakerRows }] : [{ type: 'paragraph', text: 'Pas de mesure disponible cette fois (serveur non joignable).' }]),
            { type: 'heading', text: 'Smart Breaker — capacités construites' },
            { type: 'list', items: capabilitiesList.length ? capabilitiesList : ['Aucune capacité listée.'] },
            { type: 'heading', text: 'Robustesse du code — détail' },
            { type: 'table', headers: ['Mesure', 'Valeur'], rows: codeHealthRows },
            { type: 'heading', text: 'Qualité de sortie & cohérence logique — détail' },
            ...(qualityCoherenceRows ? [{ type: 'table', headers: ['Mesure', 'Valeur'], rows: qualityCoherenceRows }] : [{ type: 'paragraph', text: 'Pas de tour enregistré cette session — rien à mesurer.' }]),
            { type: 'heading', text: 'Rejouabilité — détail' },
            ...(replayRows ? [{ type: 'table', headers: ['Mesure', 'Valeur'], rows: replayRows }] : [{ type: 'paragraph', text: 'Pas de mesure disponible cette fois.' }]),
            { type: 'note', text: 'Limite honnête (rejouabilité) : bonusLog ne garde que les 12 derniers tirages — ce chiffre reflète la diversité RÉCENTE, pas garantie sur toute la session si plus de 12 tirages ont eu lieu.' },
            { type: 'heading', text: 'Smart Conso — détail' },
            ...(smartConsoRows ? [{ type: 'table', headers: ['Mesure', 'Valeur'], rows: smartConsoRows }] : [{ type: 'paragraph', text: 'Pas de mesure disponible cette fois.' }]),
            { type: 'note', text: 'Limite honnête (Smart Conso) : la conformité API se mesure sur un vrai trafic indépendant (.gemini-key-health.json), mais l\'adoption SMART-CONSO-TOKEN ne peut refléter que les consultations RÉELLEMENT faites — une non-consultation ne laisse aucune trace de son propre côté.' },
        ],
        footer: `Historique complet (toutes les exécutions, tous les chiffres) : ${KPI_HISTORY_PATH}.`,
    });
}

export function writeKpiHtml(run, d) {
    writeFileSync(path(KPI_HTML_PATH), buildKpiFullReportHtml(run, d));
}

// --- Liste de référence des capacités du Smart Breaker ------------------------------------------
// Fixe et datée — n'évolue que quand une vraie capacité nouvelle est décidée avec l'utilisateur,
// jamais gonflée après coup pour faire progresser le chiffre artificiellement. Source : CLAUDE.md
// (section Smart Breaker) et docs/regles-de-travail.md §7bis.
export const SMART_BREAKER_CAPABILITIES = [
    { name: 'Rotation de clés (round-robin + cooldown différencié par code d’erreur)', done: true },
    { name: 'Repli de modèle sur 429/503', done: true },
    { name: 'Repli de clé sur 429/503', done: true },
    { name: 'Recul exponentiel adaptatif (reset au premier succès)', done: true },
    { name: 'Sondage multi-fournisseurs (diagnostic, check-gemini-quota.mjs)', done: true },
    { name: 'Correction du biais de sonde secondaire (asKeySignal)', done: true },
    { name: 'Compteurs d’efficacité (KPI tours/tentatives, ce rapport)', done: true },
    { name: 'Validation qualité intégrale de GEMINI_FALLBACK_MODELS avant activation en production', done: false },
];

// --- Effets de bord (analyse statique, appel réseau best-effort) -------------------------------

function runTypeCheck() {
    section('Robustesse du code : tsc --noEmit');
    try {
        const out = execSync('npx tsc --noEmit', { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
        const errors = out.split('\n').filter(l => l.trim() && !l.includes('vite.config.ts'));
        console.log(errors.length === 0 ? 'OK — 0 erreur.' : `${errors.length} erreur(s) :\n${errors.join('\n')}`);
        return errors.length;
    } catch (e) {
        const out = String(e.stdout ?? '');
        const errors = out.split('\n').filter(l => l.trim() && !l.includes('vite.config.ts'));
        console.log(errors.length === 0 ? 'OK — 0 erreur.' : `${errors.length} erreur(s) :\n${errors.join('\n')}`);
        return errors.length;
    }
}

// Réutilise CE MÊME lancement de check-house.mjs pour obtenir la couverture réelle par fonction
// (AXA-CHECK), au lieu d'en payer un second — règle anti-doublon, docs/regles-de-travail.md §7ter.
// NODE_V8_COVERAGE sur ce process ne change rien à son comportement ni sa sortie, seulement le
// relevé écrit sur disque en parallèle, lu ensuite par collectCoverage().
function runTestSuite() {
    section('Robustesse du code : check-house.mjs');
    const expected = expectedTestBlockCount(readFileSync(path('scripts', 'check-house.mjs'), 'utf8'));
    const covDir = mkdtempSync(join(tmpdir(), 'kpi-axa-check-'));
    const env = { ...process.env, NODE_V8_COVERAGE: covDir };
    let result;
    try {
        const out = execSync('node scripts/check-house.mjs', { cwd: root, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
        const passed = out.split('\n').filter(l => l.startsWith('Passed:')).length;
        console.log(`OK — ${passed}/${expected} bloc(s) de test passés, suite verte.`);
        result = { passed, expected, green: true };
    } catch (e) {
        const out = String(e.stdout ?? '') + String(e.stderr ?? '');
        const passed = out.split('\n').filter(l => l.startsWith('Passed:')).length;
        console.log(`⚠️ SUITE ROUGE — ${passed}/${expected} bloc(s) passés avant l'échec. Sortie :\n${out.slice(-1500)}`);
        result = { passed, expected, green: false };
    }
    try {
        const perFile = collectCoverage(covDir);
        const allFunctions = Object.values(perFile).flat();
        result.coverageScore = robustnessScore(allFunctions);
    } catch {
        result.coverageScore = undefined;
    } finally {
        rmSync(covDir, { recursive: true, force: true });
    }
    return result;
}

function countFragilePoints() {
    section('Robustesse du code : points fragiles ouverts');
    const content = readFileSync(path('docs', 'referentiel', 'points-fragiles.md'), 'utf8');
    const afterHeading = content.split('## Points ouverts')[1] ?? '';
    const count = (afterHeading.match(/^- /gm) ?? []).length;
    console.log(`${count} point(s) fragile(s) ouvert(s) — détail dans docs/referentiel/points-fragiles.md.`);
    return count;
}

function repoStats() {
    section('Robustesse du code : taille et densité');
    const liaLines = readFileSync(path('lib', 'lia.ts'), 'utf8').split('\n').length;
    const dialogueLines = readFileSync(path('lib', 'dialogue.ts'), 'utf8').split('\n').length;
    const libFiles = readdirSync(path('lib')).filter(f => statSync(path('lib', f)).isFile());
    console.log(`lib/lia.ts : ${liaLines} lignes (prompt géant, à surveiller — pas un défaut en soi).`);
    console.log(`lib/dialogue.ts : ${dialogueLines} lignes.`);
    console.log(`lib/ : ${libFiles.length} fichiers.`);
    return { liaLines, dialogueLines, libFileCount: libFiles.length };
}

// Performance runtime — efficacité du Smart Breaker (2026-09-19). Best-effort : le serveur de dev
// n'est pas toujours en train de tourner quand on lance ce rapport (analyse statique seule) — dans
// ce cas on l'indique simplement, jamais une erreur qui ferait échouer le reste du rapport.
// Compteurs remis à zéro à chaque redémarrage du serveur (lib/gemini-keys.ts, lib/quality-metrics.ts) :
// lire ce rapport juste après une simulation complète, avant de relancer le serveur pour la
// suivante (étape 4 de l'Article 18), donne exactement les chiffres de CETTE session-là.
// Port trouvé le 2026-09-20 : vinext/vite ne choisit pas toujours 5173 (observé sur ce port de
// développement précis : port 3000 sans rien d'autre occupant 5173) — jamais documenté nulle part
// comme garanti, donc on essaie les deux plutôt que d'échouer silencieusement sur un port supposé.
export const DEV_PORTS = [5173, 3000];
export async function fetchLiveMetrics() {
    for (const port of DEV_PORTS) {
        try {
            const res = await fetch(`http://localhost:${port}/api/admin`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: '1980' }),
                signal: AbortSignal.timeout(3000),
            });
            if (!res.ok) { console.log(`Serveur de dev joint (port ${port}) mais code refusé (${res.status}) — pas de mesure cette fois.`); return undefined; }
            const data = await res.json();
            if (!data.geminiKeyMetrics) { console.log(`Serveur de dev joint (port ${port}), mais aucune métrique renvoyée (version du code trop ancienne ?).`); return undefined; }
            return data;
        } catch {
            continue;
        }
    }
    console.log(`Serveur de dev non joignable sur les ports connus (${DEV_PORTS.join(', ')}) — normal si aucune simulation n’est en cours, pas de mesure cette fois.`);
    return undefined;
}

function reportSmartBreaker(m) {
    section('Performance runtime — Smart Breaker (détail)');
    if (!m) { console.log('Pas de mesure disponible cette fois (serveur non joignable).'); return; }
    console.log(`Tours réels (appels Gemini nécessaires) : ${m.turns}.`);
    console.log(`Clé principale déjà indisponible au départ du tour : ${m.primaryKeyUnavailableAtStart} fois sur ${m.turns} (${m.turns ? Math.round(100 * m.primaryKeyUnavailableAtStart / m.turns) : 0}%).`);
    console.log(`Tentatives individuelles (clé × modèle) : ${m.attempts} — ${m.successes} réussies, ${m.quotaFailures} bloquées par quota (429), ${m.transientFailures} erreurs transitoires (503), ${m.invalidFailures} clés invalides (401/403).`);
}

// Persistance du vrai trafic Gemini dans l'historique partagé (2026-09-20, tâche #88 : « persister
// le vrai trafic Gemini dans l'historique partagé »). `episodes` vient de l'API admin
// (lib/gemini-keys.ts::getGeminiKeyEpisodes(), jamais la clé en clair, seulement son empreinte) —
// réutilise directement recordOutcomeByLabel() de scripts/gemini-key-health.mjs, jamais un second
// mécanisme d'écriture de ce fichier (règle anti-doublon, §7ter). Volontairement appelé UNE FOIS
// par exécution, avant le redémarrage du serveur pour la simulation suivante (même contrainte déjà
// documentée pour geminiKeyMetrics ci-dessus) : rejouer ce rapport plusieurs fois sur le même
// serveur sans redémarrage entre-temps ajouterait les mêmes épisodes en double dans l'historique —
// limite honnête assumée, cohérente avec l'usage déjà établi de ce rapport (Article 18, étape 4).
function persistGeminiKeyEpisodes(episodes) {
    if (!episodes || !episodes.length) return;
    for (const e of episodes) recordOutcomeByLabel(e.fingerprint, e.model, e.outcome, true, e.at);
    console.log(`Trafic réel persisté dans .gemini-key-health.json : ${episodes.length} épisode(s) (par empreinte de clé × modèle).`);
}

// memento weight (tâche #169, 2026-09-21 ; nom conservé tel quel le même soir en retirant
// l'ombrelle "MEMENTO" — cf. docs/referentiel/memento-weight.md) : première famille KPI pour le
// poids réel du contexte envoyé à Gemini par tour, par personnage (jamais une moyenne globale qui
// masquerait un déséquilibre Lia/Noé) — `contextWeightSamples` vient de l'API admin
// (lib/memento-weight.ts::getContextWeightSamples()). Aucun seuil de jugement fourni ici (bon/
// mauvais) : ce territoire n'a jamais été mesuré avant ce soir, un seuil inventé serait un chiffre
// fabriqué — la lecture humaine décide, exactement la même retenue que le reste du réseau d'outils.
// Tendance multi-sessions (2026-09-21, tâche #174) : jusqu'ici cette fonction ne lisait jamais
// .memento-history.json, alors que persistContextWeightSamples() (appelée juste avant, dans
// main()) l'écrit à chaque rapport — un journal rempli mais jamais consulté. loadMementoWeightHistory()
// tourne APRÈS cette écriture, donc l'historique lu ici inclut déjà les échantillons de la session
// en cours, fusionnés avec ceux des sessions passées (plafond 500, cf. memento-weight.mjs). Jamais
// un verdict fabriqué (hausse/baisse) à partir de ce chiffre seul — le nombre d'échantillons varie
// trop d'une session à l'autre pour ça — seulement le chiffre honnête, à côté de celui de la
// session en cours, pour que la lecture humaine juge elle-même s'il y a une vraie dérive.
function reportMementoWeight(samples) {
    section('KPI — Mémoire des personnages (memento weight)');
    if (!samples || !samples.length) { console.log('Pas de mesure disponible cette fois (serveur non joignable, ou aucun tour joué).'); return; }
    const byActor = averageContextWeightByActor(samples);
    for (const [actor, avg] of Object.entries(byActor)) console.log(`${actor} : ~${avg} tokens estimés en moyenne par tour (${samples.filter(s => s.actor === actor).length} échantillon(s) cette session).`);
    const history = loadMementoWeightHistory();
    const byActorHistory = averageContextWeightByActor(history?.samples);
    if (Object.keys(byActorHistory).length) {
        console.log('Sur l\'historique accumulé (toutes sessions confondues, plafonné à 500 échantillons) :');
        for (const [actor, avg] of Object.entries(byActorHistory)) console.log(`  ${actor} : ~${avg} tokens estimés en moyenne (${history.samples.filter(s => s.actor === actor).length} échantillon(s) accumulé(s)) — à comparer à la moyenne de cette session ci-dessus pour repérer une vraie dérive dans le temps.`);
    }
    console.log('Lecture : aucun seuil bon/mauvais fixé — territoire jamais mesuré avant ce soir (Article 8/0), à calibrer par la lecture humaine sur plusieurs sessions avant tout jugement.');
}

function reportQuality(m) {
    section('Qualité de sortie');
    const score = qualityScore(m);
    if (score === undefined) { console.log('Pas de tour enregistré cette session — rien à mesurer (normal si le serveur vient de démarrer ou si aucune simulation n’a encore tourné).'); return undefined; }
    console.log(`KPI global Qualité : ${pct(score)} des tours n’ont eu besoin d’aucune réplique de repli anti-écho (${m.antiEchoInterventions} intervention(s) sur ${m.turns} tour(s)).`);
    if (score < 90) console.log('→ Action : au-dessous de 90%, relire les transcripts récents pour voir SI un même type de proposition revient trop souvent (Article 11) — un chiffre bas et stable d’une session à l’autre justifierait une vraie variété de fond plutôt qu’un simple repli de forme.');
    else console.log('→ Lecture : le modèle varie déjà suffisamment sans avoir besoin du filet de secours la plupart du temps — rien à faire ici pour l’instant.');
    return score;
}

function reportCoherence(m) {
    section('Cohérence logique');
    const score = coherenceScore(m);
    if (score === undefined) { console.log('Pas de tour enregistré cette session — rien à mesurer.'); return undefined; }
    console.log(`KPI global Cohérence logique : ${pct(score)} des tours n’ont nécessité aucune troncature de sécurité (${m.truncationInterventions[1] + m.truncationInterventions[2]} intervention(s) sur ${m.turns} tour(s) — Lia : ${m.truncationInterventions[1]}, Noé : ${m.truncationInterventions[2]}).`);
    if (m.truncationInterventions[1] > m.truncationInterventions[2] * 2 || m.truncationInterventions[2] > m.truncationInterventions[1] * 2) console.log('→ Action : le déséquilibre entre Lia et Noé est net — vérifier si le prompt d’un des deux personnages (lib/lia.ts) encourage des répliques trop longues ou mal ponctuées de son côté spécifiquement, plutôt qu’un problème général.');
    else if (score < 90) console.log('→ Action : au-dessous de 90%, le modèle coupe trop souvent ses phrases avant la ponctuation finale — vérifier si une consigne de longueur dans lib/lia.ts a besoin d’être resserrée.');
    else console.log('→ Lecture : le filet de sécurité intervient rarement, signe que le modèle produit déjà des répliques correctement formées — rien à faire ici pour l’instant.');
    return score;
}

function reportReplayability(m) {
    section('Rejouabilité (signal partiel — diversité récente des bonus)');
    const score = replayabilityScore(m);
    if (score === undefined) { console.log('Pas de mesure disponible cette fois (serveur non joignable, ou aucune session en cours).'); return undefined; }
    console.log(`KPI global Rejouabilité (partiel) : ${pct(score)} des ${m.totalBonusTypes} bonus possibles vus parmi les 12 derniers tirages (${m.distinctBonuses}/${m.totalBonusTypes}).`);
    console.log('Limite honnête : bonusLog ne garde que les 12 derniers tirages (app/api/lia/route.ts) — ce chiffre reflète la diversité RÉCENTE, pas garantie sur toute la session si plus de 12 tirages ont eu lieu. Un historique inter-sessions réel (tours jusqu’à révélation, nombre de disputes, variété des ouvertures) reste à construire (chantier 2, cf. docs/referentiel/tableau-de-bord.md).');
    if (score < 60) console.log('→ Action : plusieurs bonus n’ont pas été tirés récemment — vérifier que la roulette n’a pas de biais de tirage avant de conclure à un simple hasard défavorable.');
    else console.log('→ Lecture : bonne diversité récente — rien à faire ici pour l’instant.');
    return score;
}

// Charge les 3 fichiers locaux du paysage Smart Conso (2026-09-20, écart réel comblé : famille KPI
// "Smart Conso" jamais construite malgré une réponse de calibrage déjà donnée) — jamais un second
// mécanisme de lecture/écriture, ces fichiers restent la propriété exclusive de
// smart-conso-api.mjs/smart-conso-token.mjs/gemini-key-health.mjs (règle anti-doublon, §7ter) ;
// kpi-report.mjs se contente de les LIRE, en I/O pure comme le reste de ce fichier, puis appelle
// les fonctions déjà exportées et déjà testées ailleurs. Absence de fichier = valeurs par défaut
// honnêtes (jamais une erreur qui ferait planter tout le rapport pour un outil pas encore utilisé).
function loadSmartConsoMetrics(identity = 'claude-sonnet-5') {
    const healthData = existsSync(path('.gemini-key-health.json')) ? JSON.parse(readFileSync(path('.gemini-key-health.json'), 'utf8')) : { keys: {} };
    const sessionLog = existsSync(path('.smart-conso-session.json')) ? JSON.parse(readFileSync(path('.smart-conso-session.json'), 'utf8')) : { actions: [] };
    const tokenHistory = existsSync(path('.smart-conso-token-history.json')) ? JSON.parse(readFileSync(path('.smart-conso-token-history.json'), 'utf8')) : { actions: [] };
    const compliance = burstComplianceScore(healthData, sessionLog);
    const adoption = computeAdoptionKpi(tokenHistory);
    const freshness = checkKnowledgeFreshness(identity);
    return {
        complianceScore: compliance?.score, complianceDetail: compliance,
        adoptionReductionPct: adoption.reductionMoyennePct, adoptionDetail: adoption,
        freshnessOk: freshness.fraiche, freshnessMessage: freshness.message,
    };
}

function reportSmartConso(m) {
    section('Smart Conso — détail (Smart Conso API + SMART-CONSO-TOKEN)');
    console.log(`Conformité API (salves confirmées avant d'agir) : ${m.complianceDetail ? `${pct(m.complianceDetail.score)} (${m.complianceDetail.confirmed}/${m.complianceDetail.total} salve(s))` : 'N/A (aucune salve détectée dans .gemini-key-health.json cette fois).'}`);
    console.log(`Adoption SMART-CONSO-TOKEN : ${m.adoptionDetail.propositionsAppliquees} proposition(s) réellement appliquée(s)${m.adoptionDetail.reductionMoyennePct !== undefined ? `, réduction moyenne mesurée ${pct(m.adoptionDetail.reductionMoyennePct)}` : ''}.`);
    console.log(`Fraîcheur des schémas connus : ${m.freshnessMessage}`);
    if (m.complianceDetail && m.complianceDetail.score < 100) console.log('→ Action : au moins une salve d\'appels réels n\'a pas été précédée d\'une consultation confirmée — relire .gemini-key-health.json/.smart-conso-session.json pour identifier le moment exact avant de conclure à un oubli.');
    if (m.freshnessOk === false) console.log('→ Action : le registre de schémas coûteux n\'a jamais été validé pour l\'identité de modèle actuelle — une nouvelle recherche est nécessaire avant de lui faire confiance.');
}

async function main() {
    recordCliUsage('kpi');
    console.log('Tableau de bord — rapport KPI complet (cf. docs/referentiel/tableau-de-bord.md pour les règles).');

    const live = await fetchLiveMetrics();
    const improvement = smartBreakerImprovementScore(SMART_BREAKER_CAPABILITIES);
    const performance = smartBreakerPerformanceScore(live?.geminiKeyMetrics);

    console.log(`\n**\u{1F527} Performance globale du Smart Breaker : ${performance === undefined ? 'N/A (serveur non joignable)' : pct(performance)}**`);
    console.log(`**\u{1F4C8} Améliorations réalisées sur l’outil : ${improvement === undefined ? 'N/A (liste de capacités invalide)' : pct(improvement.score)}**${improvement ? ` (${improvement.done}/${improvement.total} capacités prévues, implémentées et testées)` : ''}`);
    if (improvement && !SMART_BREAKER_CAPABILITIES.every(c => c.done)) console.log('→ Action : ' + SMART_BREAKER_CAPABILITIES.filter(c => !c.done).map(c => c.name).join(' ; '));

    const tscErrors = runTypeCheck();
    const tests = runTestSuite();
    const fragilePoints = countFragilePoints();

    // LE PLAN D'ACTION (2026-09-23, tâche #211). Le tableau de bord RELAIE des mesures produites
    // ailleurs — il n'en invente aucune. Son plan ne relaie donc que ce qui est FACTUELLEMENT
    // cassé, jamais un chiffre en baisse : un indicateur qui descend est une tendance, pas un
    // défaut, et le transformer en tâche fabriquerait du travail à partir d'une courbe.
    //
    // Une erreur de typage et un test rouge sont, eux, des faits : le code ne compile pas ou ne
    // passe pas. `fausseUneMesure: true` parce que tout le reste du tableau de bord s'appuie
    // dessus — un score de qualité calculé sur une suite rouge ne vaut rien.
    const constatsKpi = [
      ...(tscErrors > 0 ? [{ constat: `${tscErrors} erreur(s) de typage : le code ne compile pas proprement`, etat: "retenu", fausseUneMesure: true,
        tache: "corriger les erreurs de typage avant toute autre mesure — elles faussent tout le tableau de bord" }] : []),
      ...(tests && tests.failed > 0 ? [{ constat: `${tests.failed} bloc(s) de test en échec`, etat: "retenu", fausseUneMesure: true,
        tache: "remonter à la cause de chaque échec, jamais neutraliser le test" }] : []),
      ...(fragilePoints > 0 ? [{ constat: `${fragilePoints} point(s) fragile(s) ouvert(s) dans docs/referentiel/points-fragiles.md`, etat: "a-trancher",
        pourquoi: "un point fragile est une zone identifiée EN ATTENTE d'une décision de conception, jamais un bug actif — le traiter comme une tâche automatique reviendrait à trancher à la place de l'utilisateur" }] : []),
    ];
    const planKpi = buildPlanDaction(constatsKpi, { toolSlug: "kpi-report" });
    console.log(`\n=== ${PLAN_ACTION_TITRE} ===`);
    for (const l of planKpi.lignes) console.log(l);
    const stats = repoStats();
    const health = codeHealthScore(tscErrors, tests.passed, tests.expected, tests.coverageScore);
    section('KPI global — Robustesse du code');
    if (health === undefined) console.log('N/A (impossible de calculer le score — vérifier scripts/check-house.mjs, son décompte de blocs attendu semble invalide).');
    else {
        const coverageLabel = health.coverageScore === undefined ? '' : `, couverture réelle par fonction (AXA-CHECK) ${pct(health.coverageScore)}`;
        console.log(`${pct(health.overall)} (moyenne : propreté tsc ${pct(health.tscScore)}, suite de tests ${pct(health.testScore)}${coverageLabel}). Points fragiles et taille de code restent affichés en compteurs bruts ci-dessus (pas de plafond naturel pour un %).`);
        if (tscErrors > 0) console.log('→ Action : corriger les erreurs tsc avant tout autre travail — un type cassé peut cacher un vrai bug de comportement (Article 5).');
        else if (!tests.green) console.log('→ Action : la suite est rouge — corriger la cause avant de considérer un changement terminé (Article 3), jamais contourner un test qui gêne.');
        else console.log('→ Lecture : code sain, rien à faire ici pour l’instant.');
    }

    if (live?.geminiKeyMetrics) reportSmartBreaker(live.geminiKeyMetrics);
    persistGeminiKeyEpisodes(live?.geminiKeyEpisodes);
    persistContextWeightSamples(live?.contextWeightSamples);
    reportMementoWeight(live?.contextWeightSamples);
    const quality = reportQuality(live?.qualityMetrics);
    const coherence = reportCoherence(live?.qualityMetrics);
    const replay = reportReplayability(live?.replayabilityMetrics);
    section('KPI global — Performance runtime');
    console.log(performance === undefined ? 'N/A cette fois.' : `${pct(performance)} (identique au KPI en tête de rapport — cette famille EST le Smart Breaker aujourd’hui).`);

    const smartConsoMetrics = loadSmartConsoMetrics();
    reportSmartConso(smartConsoMetrics);
    const smartConso = smartConsoScore(smartConsoMetrics);
    section('KPI global — Smart Conso');
    console.log(smartConso === undefined ? 'N/A cette fois (aucune composante mesurable).' : `${pct(smartConso)} (moyenne des composantes réellement mesurées cette fois — jamais un chiffre fabriqué pour une composante absente).`);

    // `live` est indéfini quand aucun serveur de jeu n'est joignable : les quatre familles qui
    // dépendent d'un vrai trafic sont alors hors de portée par nature, pas en panne.
    const noLiveServer = !live;
    const coverage = dashboardCoverageScore([
        { famille: 'Smart Breaker — performance', score: performance, outOfReach: noLiveServer },
        { famille: 'Robustesse du code', score: health?.overall, outOfReach: false },
        { famille: 'Qualité de sortie', score: quality, outOfReach: noLiveServer },
        { famille: 'Cohérence logique', score: coherence, outOfReach: noLiveServer },
        { famille: 'Rejouabilité', score: replay, outOfReach: noLiveServer },
        { famille: 'Smart Conso', score: smartConso, outOfReach: false },
    ]);
    section('KPI général — Couverture du tableau de bord lui-même (à surveiller en priorité)');
    console.log(`${pct(coverage.score)} des familles ATTEIGNABLES dans ce contexte ont produit une vraie mesure (${coverage.measuredInReach}/${coverage.inReachTotal}).`);
    if (coverage.outOfReach.length) console.log(`→ Hors de portée ici, jamais un défaut : ${coverage.outOfReach.join(', ')} — ces familles ont besoin d'un serveur de jeu avec du vrai trafic, absent de cette exécution (typiquement une Ronde ou un contrôle après commit). Elles se mesurent pendant une simulation.`);
    if (coverage.score < 100) console.log('→ Action : une famille pourtant ATTEIGNABLE n’a renvoyé aucune mesure — c’est le signal qui compte, un branchement du tableau de bord lui-même est probablement cassé. À vérifier avant de faire confiance à la synthèse ci-dessous.');
    else console.log(`→ Lecture : tout ce qui pouvait être mesuré ici l’a été (${coverage.measured}/${coverage.total} familles au total, le reste hors de portée dans ce contexte) — rien n’indique un tableau de bord cassé.`);

    section('Synthèse');
    const alerts = [];
    if (tscErrors > 0) alerts.push(`${tscErrors} erreur(s) tsc`);
    if (!tests.green) alerts.push('suite check-house.mjs rouge');
    if (live?.geminiKeyMetrics?.invalidFailures) alerts.push(`${live.geminiKeyMetrics.invalidFailures} clé(s) Gemini invalide(s) détectée(s)`);
    if (quality !== undefined && quality < 90) alerts.push(`Qualité à ${pct(quality)}`);
    if (coherence !== undefined && coherence < 90) alerts.push(`Cohérence logique à ${pct(coherence)}`);
    if (smartConsoMetrics.complianceDetail && smartConsoMetrics.complianceDetail.score < 100) alerts.push(`${smartConsoMetrics.complianceDetail.total - smartConsoMetrics.complianceDetail.confirmed} salve(s) API non confirmée(s)`);
    if (smartConsoMetrics.freshnessOk === false) alerts.push('registre Smart Conso non validé pour ce modèle');
    if (coverage.score < 100) alerts.push(`couverture du tableau de bord à ${pct(coverage.score)} (${coverage.measuredInReach}/${coverage.inReachTotal} familles pourtant atteignables ici)`);
    if (alerts.length) {
        console.log(`🚨 ALERTE TABLEAU DE BORD — ${alerts.join(', ')}.`);
    } else {
        console.log(`Tout est vert : ${pct(health.overall)} robustesse du code, ${fragilePoints} point(s) fragile(s) ouvert(s) déjà identifié(s) et suivis.`);
    }

    // Historique CSV + synthèse compacte (2026-09-19, demande explicite de l'utilisateur : « dans
    // la conversation, tu ne fais que la synthèse globale [...] tu l'envoies dans un fichier
    // séparé [...] avec tous les chiffres [...] tableau avec le résumé global : le % global de
    // chaque sujet principal »). Tout le détail verbeux ci-dessus reste dans CE terminal/fichier de
    // log, jamais collé dans la conversation à partir de maintenant — seule la SYNTHÈSE COMPACTE
    // ci-dessous, plus le fichier CSV envoyé en pièce jointe, doivent atteindre la conversation.
    const run = process.argv[2] ?? `manuel-${new Date().toISOString().slice(0, 16)}`;
    const row = csvRowFor(run, {
        smartBreakerPerformance: performance, smartBreakerImprovement: improvement?.score,
        codeHealth: health?.overall, quality, coherence, replayability: replay, coverage: coverage.score,
        tscErrors, fragilePoints,
        sbTurns: live?.geminiKeyMetrics?.turns, sbAttempts: live?.geminiKeyMetrics?.attempts,
        sbSuccesses: live?.geminiKeyMetrics?.successes, sb429: live?.geminiKeyMetrics?.quotaFailures,
        sb503: live?.geminiKeyMetrics?.transientFailures, sb401403: live?.geminiKeyMetrics?.invalidFailures,
        antiEchoInterventions: live?.qualityMetrics?.antiEchoInterventions,
        truncationLia: live?.qualityMetrics?.truncationInterventions?.[1],
        truncationNoe: live?.qualityMetrics?.truncationInterventions?.[2],
        bonusDistinct: live?.replayabilityMetrics?.distinctBonuses, bonusTotal: live?.replayabilityMetrics?.totalBonusTypes,
        smartConso,
    });
    appendHistoryRow(row);

    section('SYNTHÈSE COMPACTE (à relayer telle quelle dans la conversation)');
    console.log(`Run : ${run}`);
    console.log('| Famille | KPI global |');
    console.log('|---|---|');
    console.log(`| 🔧 Smart Breaker — performance | ${performance === undefined ? 'N/A' : pct(performance)} |`);
    console.log(`| 📈 Smart Breaker — améliorations | ${improvement === undefined ? 'N/A' : pct(improvement.score)} |`);
    console.log(`| Robustesse du code | ${health === undefined ? 'N/A' : pct(health.overall)} |`);
    console.log(`| Qualité de sortie | ${quality === undefined ? 'N/A' : pct(quality)} |`);
    console.log(`| Cohérence logique | ${coherence === undefined ? 'N/A' : pct(coherence)} |`);
    console.log(`| Rejouabilité (partiel) | ${replay === undefined ? 'N/A' : pct(replay)} |`);
    console.log(`| Smart Conso | ${smartConso === undefined ? 'N/A' : pct(smartConso)} |`);
    console.log(`| Couverture du tableau de bord | ${pct(coverage.score)} |`);
    console.log(alerts.length ? `\n🚨 Points d'attention : ${alerts.join(', ')}.` : '\nAucun point d’attention — tout est vert.');
    console.log(`\nHistorique complet (toutes les exécutions, tous les chiffres) : ${KPI_HISTORY_PATH} — à envoyer en pièce jointe, jamais collé dans la conversation.`);

    writeKpiHtml(run, {
        performance, improvement, health, quality, coherence, replay, smartConso, coverage, alerts,
        tscErrors, tests, fragilePoints, stats, capabilities: SMART_BREAKER_CAPABILITIES,
        smartBreakerDetail: live?.geminiKeyMetrics, qualityDetail: live?.qualityMetrics, replayDetail: live?.replayabilityMetrics,
        smartConsoDetail: smartConsoMetrics,
    });
    console.log(`Copie de présentation HTML régénérée : ${KPI_HTML_PATH} (jamais committée — cf. .gitignore).`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
