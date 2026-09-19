import type { Room, Person } from "./house";
export type Needs = {
    hunger: number;
    fatigue: number;
    stress: number;
    uncertainty: number;
};
export const initialNeeds: Needs = { hunger: 26, fatigue: 20, stress: 55, uncertainty: 90 };
export const residentProfiles = {
    1: { description: "Lia est observatrice, plus réservée au début, sensible à la délicatesse et à la fiabilité. Elle se fatigue plus vite et a un plus petit appétit. Sa chaleur se développe à son rythme.", emotions: { curiosity: 72, tension: 90, trust: 8, comfort: 22, attraction: 12 }, needs: { hunger: 20, fatigue: 20, stress: 90, uncertainty: 90 }, hungerRate: 1, fatigueRate: 2, stressRate: 1, mealRecovery: 40, mealFatigue: 0, sharedBonus: 2 },
    // Attraction initiale et sharedBonus resserrés le 2026-09-17 (retour utilisateur direct) : Noé
    // partait avec une attirance presque 3x supérieure à celle de Lia (32 contre 12) ET un bonus
    // d'activité commune deux fois plus élevé (4 contre 2, doublé en chambre) — ces deux écarts se
    // combinaient à chaque tour partagé et faisaient décrocher sa jauge de celle de Lia bien plus
    // vite qu'un « léger temps d'avance », au point de sonner incohérent entre les deux jauges. Il
    // garde un tout petit temps d'avance (18 contre 12) mais un bonus d'activité commune désormais
    // identique à celui de Lia : leur progression doit rester cohérente l'une par rapport à l'autre.
    2: { description: "Noé est plus assuré, plus vite rassuré par la présence de Lia, plus à l'aise et déjà légèrement plus attiré par Lia. Il propose volontiers une petite action concrète, avec un humour sobre. Il mange plus, se fatigue moins vite hors repas et ressent un coup de fatigue après manger. Son assurance n'exclut ni doute ni respect d'un refus.", emotions: { curiosity: 68, tension: 90, trust: 20, comfort: 48, attraction: 18 }, needs: { hunger: 30, fatigue: 20, stress: 90, uncertainty: 90 }, hungerRate: 2, fatigueRate: 1, stressRate: 1, mealRecovery: 58, mealFatigue: 14, sharedBonus: 2 }
} as const;
// Rare variations de départ (~20 % de chance chacune, cf. story.ts:insoliteOpening) : un même
// schéma d'arrivée ("ils se rencontrent au salon") ne doit pas produire le même déroulé à chaque
// session (Article 9 de la charte). La différence part de l'état intérieur, pas d'un scénario
// scripté séparé : le reste du moteur (priorité des besoins, huis clos) fait le travail normalement.
export type InsoliteOpening = "normal" | "lia-unwell" | "noe-guarded";
export function initialNeedsFor(id: Person, insolite: InsoliteOpening = "normal"): Needs {
    const base: Needs = { ...residentProfiles[id].needs };
    if (insolite === "lia-unwell" && id === 1) base.fatigue = 58;
    return base;
}
export function initialEmotionsFor(id: Person, insolite: InsoliteOpening = "normal") {
    const base = { ...residentProfiles[id].emotions };
    if (insolite === "noe-guarded" && id === 2) return { ...base, trust: 6, comfort: 18, tension: 100 };
    return base;
}
export function sharedActivityBonus(a: {
    intent: Intent;
    room: Room;
    emotions: {
        attraction: number;
        trust: number;
    };
}, b: {
    intent: Intent;
    room: Room;
    emotions: {
        attraction: number;
        trust: number;
    };
}, previousA: {
    emotions: {
        attraction: number;
        trust: number;
    };
}, previousB: {
    emotions: {
        attraction: number;
        trust: number;
    };
}): boolean {
    return a.intent === b.intent && a.room === b.room && ["eat", "rest", "study", "tv", "hug", "massage", "kiss", "share_sleep"].includes(a.intent) && a.emotions.attraction >= previousA.emotions.attraction && b.emotions.attraction >= previousB.emotions.attraction && a.emotions.trust >= previousA.emotions.trust && b.emotions.trust >= previousB.emotions.trust;
}
export const intents = ["none", "chat", "eat", "sleep", "rest", "study", "tv", "intimacy", "hug", "massage", "kiss", "share_sleep"] as const;
export type Intent = typeof intents[number];
export const intentRoom: Partial<Record<Intent, Room>> = { eat: "cuisine", sleep: "chambre", rest: "salon", study: "bureau", tv: "salon", intimacy: "chambre", hug: "salon", massage: "chambre", kiss: "salon", share_sleep: "chambre" };
export const intentLabels: Record<Intent, string> = { none: "J’observe les lieux", chat: "Je fais connaissance", eat: "Je cuisine et je mange", sleep: "Je dors", rest: "Je me repose", study: "J’étudie notre situation", tv: "Je regarde la télévision", intimacy: "Je propose un moment de proximité", hug: "Câlin partagé", massage: "Massage partagé", kiss: "Bisous partagés", share_sleep: "Nous dormons ensemble" };
export const roomDescriptions: Record<Room, string> = { salon: "Repos, discussion calme et télévision", cuisine: "Cuisiner et manger", chambre: "Sommeil et intimité consentie", bureau: "Comprendre leur venue et construire un projet", jardin:"Marcher et discuter autour d’un arbre sur un sol vert. La porte du couloir à gauche ne s’ouvre qu’après l’enquête, sur autorisation humaine. La porte principale à droite reste fermée." };
export const affectionIntents: Intent[] = ["hug", "massage", "kiss", "share_sleep"];
export function mutualAttraction(a: {
    emotions: {
        attraction: number;
        trust: number;
    };
}, b: {
    emotions: {
        attraction: number;
        trust: number;
    };
}) { return a.emotions.attraction >= 45 && b.emotions.attraction >= 45 && a.emotions.trust >= 25 && b.emotions.trust >= 25; }
export const tvPrograms = ["Une courbe lumineuse oscille dans un cadre sombre. SESSION apparaît, puis le numéro repart à zéro. La séquence recommence sans présentateur ni son.","Le même signal revient quatre fois. Les contours du cadre rappellent les limites de la maison ; cela suggère un système, pas encore une preuve de leur origine.","Une animation abstraite boucle sur une ligne et un cadre. Rien ne ressemble à une chaîne de télévision humaine ; ils comparent ce signal aux autres observations."];
export function parseNeeds(value: unknown): Needs {
    try {
        const n = JSON.parse(String(value));
        return Object.fromEntries(Object.keys(initialNeeds).map(k => [k, Number.isFinite(n[k]) ? Math.max(0, Math.min(100, n[k])) : initialNeeds[k as keyof Needs]])) as Needs;
    }
    catch {
        return { ...initialNeeds };
    }
}
// One completed turn is a half-hour of simulated life; absence does not starve residents.
// fatigueMultiplier (2026-09-19, cycle jour/nuit, cf. lib/daynight.ts) : ne module QUE le taux
// passif de fatigue (ce paramètre), jamais les effets de récupération ou de repas ci-dessous
// (sommeil/repos doivent rester pleinement efficaces à toute heure, seule la MONTÉE naturelle de
// la fatigue dépend du jour/de la nuit). Défaut à 1 : tous les appels existants (tests compris)
// gardent exactement le comportement d'avant ce changement.
export function advanceNeeds(previous: Needs, intent: Intent, room: Room, id: Person = 1, fatigueMultiplier: number = 1): Needs {
    const profile = residentProfiles[id];
    const n = { hunger: previous.hunger + ((intent === "sleep" || intent === "share_sleep") ? 0 : profile.hungerRate), fatigue: previous.fatigue + profile.fatigueRate * fatigueMultiplier, stress: previous.stress + profile.stressRate, uncertainty: previous.uncertainty };
    if (intentRoom[intent] === room || (intent === "sleep" && room === "salon")) {
        if (intent === "eat") {
            n.hunger -= profile.mealRecovery;
            n.fatigue += profile.mealFatigue;
            n.stress -= 6;
        }
        if (intent === "sleep" || intent === "share_sleep") {
            n.fatigue -= room === "chambre" ? 38 : 18;
            n.stress -= 8;
        }
        if (intent === "rest") {
            n.fatigue -= profile.fatigueRate + 2;
            n.stress -= 20;
        }
        if (intent === "study") { n.uncertainty -= 12; n.stress -= 3; }
        if (["hug", "massage", "kiss"].includes(intent))
            n.stress -= 15;
        if (intent === "tv") {
            n.uncertainty -= 5;
            n.stress -= 8;
        }
    }
    if (intent === "chat")
        n.stress -= 5;
    return Object.fromEntries(Object.entries(n).map(([k, v]) => [k, Math.max(0, Math.min(100, v))])) as Needs;
}
export function priority(needs: Needs): Intent | undefined {
    if (needs.hunger >= 68)
        return "eat";
    if (needs.fatigue >= 68)
        return "sleep";
    if (needs.stress >= 75)
        return "rest";
    return undefined;
}
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }

// Remplace smiley() (lookup d'emoji discret) le 2026-09-17 : un visage vectoriel à paramètres
// continus, animé par interpolation ressort côté rendu (components/house-view.tsx). Cette fonction
// ne dessine rien — elle calcule l'état à atteindre à partir des seules données réelles du
// personnage, pour que tous les rendus (scène 3D, fiche latérale, description textuelle) partagent
// exactement la même source de vérité.
//
// Fiabilisation de la colère (chantier resté en suspens depuis l'audit du 2026-09-16/17) :
// l'ancien indicateur "angry" ne venait que de life.dispute (une dispute amoureuse précise), donc
// un personnage pouvait tenir un texte cinglant face à une provocation de l'observateur sans que
// son visage ne le montre jamais. angerLevel est désormais dérivé de deux données réellement mises
// à jour par TOUTE hostilité reçue (tension qui monte, confort qui chute — cf. humanStress() dans
// lib/life.ts), avec la dispute formelle comme plancher garanti plutôt que comme seule source.
export type FaceExpression = {
    browRaise: number; furrow: number; eyeOpen: number; mouthCurve: number;
    breathOpen: number; jitterAmp: number; angerLevel: number;
    comfort: number; attraction: number; sleeping: boolean;
};
// Extraite de faceExpression (2026-09-18) pour être réutilisée ailleurs sans dupliquer la formule
// (Article 7) — la jauge d'appréciation de l'observateur s'y connecte désormais aussi
// (app/api/lia/route.ts) : une vraie colère lue ici doit compter davantage que le seul repérage de
// mots-clés sur le message humain, retour utilisateur explicite ("le système de la colère doit
// être connecté").
// Recalibrée le 2026-09-18 (phase 3, retour utilisateur explicite : "si l'observateur exagère
// vraiment, Noé ou Lia doivent finir par se mettre en colère, ce qui est normal, naturel, pour des
// personnes de caractère") — l'ancienne formule multipliait deux ratios bornés (tension-55)/40 et
// (35-comfort)/35 : chacun devait s'approcher de 1 pour que leur PRODUIT dépasse 0,5, ce qui exigeait
// des valeurs conjointes quasi extrêmes (tension≈90 ET comfort≈10) — une vraie session jouée avec la
// vraie API a montré qu'une hostilité soutenue et sévère de l'observateur atteint réalistement
// tension≈70-75 et comfort≈30-35 (les deux prompts de lib/lia.ts pour la réactivité de tension puis
// de confort ont été vérifiés efficaces à ce niveau), sans jamais approcher 90/10 : la vraie colère
// contre l'observateur restait donc structurellement hors d'atteinte, quelle que soit l'intensité de
// la provocation. Un MIN des deux ratios (au lieu d'un produit) exige toujours que les deux
// dimensions soient réellement dégradées ensemble (pas un simple pic isolé sur une seule), mais
// n'écrase plus doublement le résultat : une hostilité vraiment soutenue et sévère (tension>50 ET
// comfort<40, les deux nettement) finit par franchir 0,5, cohérent avec des personnages de caractère
// qui finissent par se fâcher pour de vrai si on les pousse assez loin — sans se déclencher pour une
// seule remarque cinglante ou une tension isolée sans dégradation réelle du confort.
export function angerLevel(tension: number, comfort: number, angry?: boolean): number {
    return clamp(Math.max(angry ? .85 : 0, Math.min(clamp((tension - 50) / 25, 0, 1), clamp((40 - comfort) / 12, 0, 1))), 0, 1);
}
export function faceExpression(agent: {
    id?: Person;
    intent: Intent;
    needs: Needs;
    emotions: { tension: number; attraction: number; comfort: number };
    angry?: boolean;
}): FaceExpression {
    const isLia = agent.id === 1;
    const sleeping = agent.intent === "sleep" || agent.intent === "share_sleep";
    const t = agent.emotions.tension, c = agent.emotions.comfort, a = agent.emotions.attraction, f = agent.needs.fatigue;
    const angerLevel_ = angerLevel(t, c, agent.angry);
    const browRaise = clamp((c - 40) / 70 - angerLevel_ * (isLia ? .35 : .5), -1, 1);
    const furrow = angerLevel_ * (isLia ? .55 : 1) + Math.max(0, (t - 60) / 100) * .3;
    // Paupières lourdes dès que la fatigue monte, bien avant le sommeil complet (retour
    // utilisateur du 2026-09-17 : un naturel demandé, pas des yeux grands ouverts jusqu'à l'écroulement).
    const eyeOpen = clamp(sleeping ? .06 : .55 + c / 100 * .3 - t / 100 * .22 - f / 100 * .4 - (isLia ? angerLevel_ * .18 : -angerLevel_ * .12), .05, 1);
    const mouthCurve = clamp(((c - 30) / 70) * (isLia ? .35 : .6) + (a > 60 ? .18 : 0) - angerLevel_ * (isLia ? .3 : .55), -1, 1);
    const breathOpen = clamp(t / 100 * .1 + a / 100 * .05, 0, .4);
    const jitterAmp = isLia ? t / 100 * .6 : t / 100 * 1.6 + angerLevel_ * 1.8;
    return { browRaise, furrow, eyeOpen, mouthCurve, breathOpen, jitterAmp, angerLevel: angerLevel_, comfort: c, attraction: a, sleeping };
}
// Phrase courte pour tout contexte textuel (fiche latérale en survol, description faite au modèle,
// répliques scriptées d'apparence) : jamais un glyphe littéral à citer, une expression à décrire.
export function describeExpression(e: FaceExpression): string {
    if (e.sleeping) return "les yeux fermés, endormi";
    if (e.angerLevel > .5) return "les sourcils froncés, la mâchoire serrée";
    if (e.eyeOpen < .35) return "les paupières lourdes, des traits fatigués";
    if (e.mouthCurve > .25 && e.comfort > 55) return "un sourire discret";
    if (e.attraction > 75) return "le regard soutenu, très présent";
    return "des traits neutres et attentifs";
}

export function needLevel(key:keyof Needs,value:number): "normal"|"pressing"|"urgent" {
    const urgent = key === "stress" ? 75 : key === "uncertainty" ? 85 : 68;
    const pressing = key === "uncertainty" ? 65 : key === "stress" ? 55 : 50;
    return value >= urgent ? "urgent" : value >= pressing ? "pressing" : "normal";
}
