// Tableau de bord / KPI — rapport à la demande (2026-09-19, demande explicite de l'utilisateur :
// « penses-tu qu'il soit intéressant de mettre au point des KPI pour ce projet [...] et de créer
// un rapport régulier sur ces chiffres pour suivre l'avancée du projet ? »). Cf.
// docs/referentiel/tableau-de-bord.md pour les règles complètes du système (5 familles, accès,
// alertes) — ce script couvre pour l'instant la famille "Performance/robustesse — code" (analyse
// statique du dépôt, zéro appel Gemini, zéro lien avec le runtime du jeu) : les 4 autres familles
// (performance runtime, qualité, logique, rejouabilité), qui nécessitent des tables en base de
// données, sont un chantier séparé (cf. section "État d'avancement" du document ci-dessus).
//
// Usage : `node scripts/kpi-report.mjs`. Jamais un processus en continu (Article 8 de CLAUDE.md) —
// à lancer à la demande, par l'utilisateur ou par l'agent (avant/après un changement de code, ou
// en fin de chantier, cf. "Quand les valeurs se mettent à jour" dans le document de référence).
import {execSync} from 'node:child_process';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const path = (...parts) => join(root, ...parts);

function section(title) { console.log(`\n== ${title} ==`); }

function runTypeCheck() {
    section('Performance/robustesse — code : tsc --noEmit');
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

function runTestSuite() {
    section('Performance/robustesse — code : check-house.mjs');
    try {
        const out = execSync('node scripts/check-house.mjs', { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
        const passed = out.split('\n').filter(l => l.startsWith('Passed:')).length;
        console.log(`OK — ${passed} bloc(s) de test passés, suite verte.`);
        return { passed, green: true };
    } catch (e) {
        const out = String(e.stdout ?? '') + String(e.stderr ?? '');
        const passed = out.split('\n').filter(l => l.startsWith('Passed:')).length;
        console.log(`⚠️ SUITE ROUGE — ${passed} bloc(s) passés avant l'échec. Sortie :\n${out.slice(-1500)}`);
        return { passed, green: false };
    }
}

function countFragilePoints() {
    section('Performance/robustesse — code : points fragiles ouverts');
    const content = readFileSync(path('docs', 'referentiel', 'points-fragiles.md'), 'utf8');
    const afterHeading = content.split('## Points ouverts')[1] ?? '';
    const count = (afterHeading.match(/^- /gm) ?? []).length;
    console.log(`${count} point(s) fragile(s) ouvert(s) — détail dans docs/referentiel/points-fragiles.md.`);
    return count;
}

function repoStats() {
    section('Performance/robustesse — code : taille et densité');
    const liaLines = readFileSync(path('lib', 'lia.ts'), 'utf8').split('\n').length;
    const dialogueLines = readFileSync(path('lib', 'dialogue.ts'), 'utf8').split('\n').length;
    const libFiles = readdirSync(path('lib')).filter(f => statSync(path('lib', f)).isFile());
    console.log(`lib/lia.ts : ${liaLines} lignes (prompt géant, à surveiller — pas un défaut en soi).`);
    console.log(`lib/dialogue.ts : ${dialogueLines} lignes.`);
    console.log(`lib/ : ${libFiles.length} fichiers.`);
    return { liaLines, dialogueLines, libFileCount: libFiles.length };
}

function main() {
    console.log('Tableau de bord — rapport KPI (famille "Performance/robustesse — code" seulement, cf. docs/referentiel/tableau-de-bord.md pour les 4 autres familles à venir).');
    const tscErrors = runTypeCheck();
    const tests = runTestSuite();
    const fragilePoints = countFragilePoints();
    const stats = repoStats();

    section('Synthèse');
    const alerts = [];
    if (tscErrors > 0) alerts.push(`${tscErrors} erreur(s) tsc`);
    if (!tests.green) alerts.push('suite check-house.mjs rouge');
    if (alerts.length) {
        console.log(`🚨 ALERTE TABLEAU DE BORD — ${alerts.join(', ')}.`);
    } else {
        console.log(`Tout est vert : 0 erreur tsc, ${tests.passed} blocs de test passés, ${fragilePoints} point(s) fragile(s) ouvert(s) déjà identifié(s) et suivis.`);
    }
}

main();
