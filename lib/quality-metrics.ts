// Tableau de bord — chantier 2 (2026-09-19, demande explicite de l'utilisateur : "je veux un
// tableau de bord efficient... pour tous les grands sujets", "chaque KPI en rapport avec une
// décision, une action à mener"). Compteurs bruts en mémoire process, même patron que
// lib/gemini-keys.ts::metrics — remis à zéro à chaque redémarrage du serveur, ce qui correspond
// exactement à "un rapport par simulation" (Article 18 de CLAUDE.md). Jamais en base de données,
// jamais un mécanisme actif : ces compteurs ne lisent jamais le contenu produit pour décider quoi
// que ce soit côté jeu, ils s'accrochent seulement aux points où le moteur applique déjà un filet
// de sécurité existant, sans jamais l'influencer.
import type {Person} from "./house";

const metrics = {
    turns: 0,
    // Qualité (famille 3) : combien de tours ont dû recourir à une réplique de repli anti-écho
    // (candidates.find dans app/api/lia/route.ts) plutôt que la proposition fraîchement générée.
    antiEchoInterventions: 0,
    // LE DÉNOMINATEUR RÉEL DE LA QUALITÉ (2026-09-25, tâche #837 — instruction de #226, « le KPI
    // Qualité de sortie est-il une tautologie ? »). Vérifié plutôt que supposé : ce n'en est pas
    // une au sens strict, mais le défaut est plus simple et plus grave — le numérateur ne peut
    // naître que d'un tour qui porte une OFFRE avec sa réplique de proposition, alors que le
    // dénominateur comptait TOUS les tours. Une session sans offre affichait donc « 100 % de
    // qualité » sans qu'un seul tour ait été observé. Ce compteur-ci compte les tours réellement
    // ÉLIGIBLES, pour que le score dise sur quoi il porte. Purement observationnel, comme les
    // autres : il ne lit rien pour décider quoi que ce soit côté jeu.
    antiEchoEligibleTurns: 0,
    // Cohérence logique (famille 4) : combien de fois groundTruncation a réellement coupé une
    // réplique/pensée, par personnage — jamais un compteur global qui masquerait un déséquilibre
    // entre Lia et Noé.
    truncationInterventions: {1: 0, 2: 0} as Record<Person, number>,
};

export function recordTurn(): void { metrics.turns++; }
export function recordAntiEchoIntervention(): void { metrics.antiEchoInterventions++; }
export function recordAntiEchoEligible(): void { metrics.antiEchoEligibleTurns++; }
export function recordTruncation(actor: Person, changed: boolean): void {
    if (changed) metrics.truncationInterventions[actor]++;
}

export function getQualityMetrics() {
    return {...metrics, truncationInterventions: {...metrics.truncationInterventions}};
}

export function __resetQualityMetricsForTests(): void {
    metrics.turns = 0;
    metrics.antiEchoInterventions = 0;
    metrics.antiEchoEligibleTurns = 0;
    metrics.truncationInterventions = {1: 0, 2: 0};
}
