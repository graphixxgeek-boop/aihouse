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
// lecture humaine du rapport, jamais avant. Le KPI de couverture lui-même compte combien des 5
// familles ont produit une vraie mesure cette fois (jamais une estimation) ET si ce test dédié est
// vert — les deux ensemble disent si ce tableau de bord est digne de confiance MAINTENANT, pas
// seulement s'il existe.
//
// Usage : `node scripts/kpi-report.mjs`. Jamais un processus en continu (Article 8 de CLAUDE.md) —
// à lancer à la demande, par l'utilisateur ou par l'agent (avant/après un changement de code, ou en
// fin de chantier, cf. "Quand les valeurs se mettent à jour" dans le document de référence, et
// désormais une étape explicite de l'Article 18 après chaque simulation complète).
import {execSync} from 'node:child_process';
import {readFileSync, readdirSync, statSync, existsSync, appendFileSync, writeFileSync, mkdtempSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {collectCoverage, robustnessScore} from './axa-check.mjs';
import {recordOutcomeByLabel} from './gemini-key-health.mjs';

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

// dashboardCoverageScore : combien des 5 familles ont produit une vraie mesure CETTE exécution
// (jamais un chiffre par défaut ni une estimation) — un tableau de bord qui n'affiche que 2/5
// familles réelles n'est pas "en panne", mais son utilisateur doit le savoir avant de faire
// confiance à la synthèse globale. Un score de famille invalide (NaN/Infinity, ne devrait jamais
// arriver vu les gardes ci-dessus, mais vérifié quand même) compte comme NON mesuré, jamais comme
// une mesure douteuse acceptée telle quelle.
export function dashboardCoverageScore(scores) {
    const total = scores.length;
    const measured = scores.filter(s => s !== undefined && (typeof s !== 'number' || Number.isFinite(s))).length;
    return { score: total > 0 ? (measured / total) * 100 : 0, measured, total };
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
    ].join(',');
}
export function appendHistoryRow(csvRow) {
    const full = path(KPI_HISTORY_PATH);
    if (!existsSync(full)) writeFileSync(full, KPI_HISTORY_COLUMNS.join(',') + '\n');
    appendFileSync(full, csvRow + '\n');
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
async function fetchLiveMetrics() {
    try {
        const res = await fetch('http://localhost:5173/api/admin', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: '1980' }),
            signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) { console.log(`Serveur de dev joint mais code refusé (${res.status}) — pas de mesure cette fois.`); return undefined; }
        const data = await res.json();
        if (!data.geminiKeyMetrics) { console.log('Serveur de dev joint, mais aucune métrique renvoyée (version du code trop ancienne ?).'); return undefined; }
        return data;
    } catch {
        console.log('Serveur de dev non joignable (normal si aucune simulation n’est en cours) — pas de mesure cette fois.');
        return undefined;
    }
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

async function main() {
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
    const quality = reportQuality(live?.qualityMetrics);
    const coherence = reportCoherence(live?.qualityMetrics);
    const replay = reportReplayability(live?.replayabilityMetrics);
    section('KPI global — Performance runtime');
    console.log(performance === undefined ? 'N/A cette fois.' : `${pct(performance)} (identique au KPI en tête de rapport — cette famille EST le Smart Breaker aujourd’hui).`);

    const coverage = dashboardCoverageScore([performance, health?.overall, quality, coherence, replay]);
    section('KPI général — Couverture du tableau de bord lui-même (à surveiller en priorité)');
    console.log(`${pct(coverage.score)} des 5 familles ont produit une vraie mesure cette exécution (${coverage.measured}/${coverage.total}).`);
    if (coverage.score < 100) console.log('→ Action : une ou plusieurs familles n’ont renvoyé aucune mesure — vérifier si c’est normal (serveur non lancé, aucun tour joué cette session) ou si un branchement du tableau de bord lui-même est cassé, avant de faire confiance à la synthèse ci-dessous.');
    else console.log('→ Lecture : les 5 familles répondent — la synthèse ci-dessous reflète bien l’état réel du projet, pas un tableau de bord partiellement éteint.');

    section('Synthèse');
    const alerts = [];
    if (tscErrors > 0) alerts.push(`${tscErrors} erreur(s) tsc`);
    if (!tests.green) alerts.push('suite check-house.mjs rouge');
    if (live?.geminiKeyMetrics?.invalidFailures) alerts.push(`${live.geminiKeyMetrics.invalidFailures} clé(s) Gemini invalide(s) détectée(s)`);
    if (quality !== undefined && quality < 90) alerts.push(`Qualité à ${pct(quality)}`);
    if (coherence !== undefined && coherence < 90) alerts.push(`Cohérence logique à ${pct(coherence)}`);
    if (coverage.score < 100) alerts.push(`couverture du tableau de bord à ${pct(coverage.score)} (${coverage.measured}/${coverage.total} familles mesurées)`);
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
    console.log(`| Couverture du tableau de bord | ${pct(coverage.score)} |`);
    console.log(alerts.length ? `\n🚨 Points d'attention : ${alerts.join(', ')}.` : '\nAucun point d’attention — tout est vert.');
    console.log(`\nHistorique complet (toutes les exécutions, tous les chiffres) : ${KPI_HISTORY_PATH} — à envoyer en pièce jointe, jamais collé dans la conversation.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
