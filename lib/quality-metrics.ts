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
    // Cohérence logique (famille 4) : combien de fois groundTruncation a réellement coupé une
    // réplique/pensée, par personnage — jamais un compteur global qui masquerait un déséquilibre
    // entre Lia et Noé.
    truncationInterventions: {1: 0, 2: 0} as Record<Person, number>,
};

export function recordTurn(): void { metrics.turns++; }
export function recordAntiEchoIntervention(): void { metrics.antiEchoInterventions++; }
export function recordTruncation(actor: Person, changed: boolean): void {
    if (changed) metrics.truncationInterventions[actor]++;
}

export function getQualityMetrics() {
    return {...metrics, truncationInterventions: {...metrics.truncationInterventions}};
}

export function __resetQualityMetricsForTests(): void {
    metrics.turns = 0;
    metrics.antiEchoInterventions = 0;
    metrics.truncationInterventions = {1: 0, 2: 0};
}
