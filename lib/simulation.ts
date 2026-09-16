import type { Room, Person } from "./house";
export type Needs = {
    hunger: number;
    fatigue: number;
    stress: number;
    uncertainty: number;
};
export const initialNeeds: Needs = { hunger: 26, fatigue: 20, stress: 55, uncertainty: 90 };
export const residentProfiles = {
    1: { description: "Lia est observatrice, plus réservée au début, sensible à la délicatesse et à la fiabilité. Elle se fatigue plus vite et a un plus petit appétit. Sa chaleur se développe à son rythme.", emotions: { curiosity: 72, tension: 90, trust: 8, comfort: 22, attraction: 12 }, needs: { hunger: 20, fatigue: 20, stress: 90, uncertainty: 90 }, hungerRate: 1, fatigueRate: 4, stressRate: 1, mealRecovery: 40, mealFatigue: 0, sharedBonus: 2 },
    2: { description: "Noé est plus assuré, plus vite rassuré par la présence de Lia, plus à l'aise et déjà davantage attiré par Lia. Il propose volontiers une petite action concrète, avec un humour sobre. Il mange plus, se fatigue moins vite hors repas et ressent un coup de fatigue après manger. Son assurance n'exclut ni doute ni respect d'un refus.", emotions: { curiosity: 68, tension: 90, trust: 20, comfort: 48, attraction: 32 }, needs: { hunger: 30, fatigue: 20, stress: 90, uncertainty: 90 }, hungerRate: 2, fatigueRate: 2, stressRate: 1, mealRecovery: 58, mealFatigue: 14, sharedBonus: 4 }
} as const;
export function initialNeedsFor(id: Person): Needs { return { ...residentProfiles[id].needs }; }
export function initialEmotionsFor(id: Person) { return { ...residentProfiles[id].emotions }; }
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
export function advanceNeeds(previous: Needs, intent: Intent, room: Room, id: Person = 1): Needs {
    const profile = residentProfiles[id];
    const n = { hunger: previous.hunger + ((intent === "sleep" || intent === "share_sleep") ? 0 : profile.hungerRate), fatigue: previous.fatigue + profile.fatigueRate, stress: previous.stress + profile.stressRate, uncertainty: previous.uncertainty };
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
export function smiley(agent: {
    intent: Intent;
    needs: Needs;
    emotions: {
        tension: number;
        attraction: number;
        comfort: number;
    };
}): string {
    if ((agent.intent === "sleep" || agent.intent === "share_sleep"))
        return "😴";
    if (["hug", "massage", "kiss"].includes(agent.intent))
        return "🥰";
    if (agent.intent === "eat")
        return "🍽️";
    if (agent.intent === "study")
        return "🧐";
    if (agent.intent === "tv")
        return "👀";
    if (agent.needs.hunger >= 68)
        return "😩";
    if (agent.needs.fatigue >= 68)
        return "🥱";
    if (agent.emotions.tension >= 65 || agent.needs.stress >= 65)
        return "😟";
    if (agent.intent === "intimacy" || agent.emotions.attraction >= 75 && agent.needs.stress<20 && agent.emotions.comfort>=65)
        return "😊";
    if (agent.intent === "rest" || agent.emotions.comfort >= 55)
        return "😌";
    return "😐";
}

export function needLevel(key:keyof Needs,value:number): "normal"|"pressing"|"urgent" {
    const urgent = key === "stress" ? 75 : key === "uncertainty" ? 85 : 68;
    const pressing = key === "uncertainty" ? 65 : key === "stress" ? 55 : 50;
    return value >= urgent ? "urgent" : value >= pressing ? "pressing" : "normal";
}
