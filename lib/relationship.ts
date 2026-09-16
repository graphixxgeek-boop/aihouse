import type { Person, Room } from "./house";
import type { Resident } from "./world";
export const ages = { 1: 28, 2: 31 } as const;
export const isInLove = (attraction: number) => attraction > 75;
export function sleepRoom(agent: Resident, other: Resident, mutual: boolean): Room {
    if (agent.id === 2)
        return (agent.room === "chambre" && ["sleep", "share_sleep"].includes(agent.intent)) || mutual ? "chambre" : "salon";
    const occupied = other.room === "chambre" && ["sleep", "share_sleep"].includes(other.intent);
    return occupied && !mutual ? "salon" : "chambre";
}
export function attractionAfterTurn(id: Person, previous: number, next: number, stress: number, sharedBonus = 0): number {
    const delta = next - previous;
    const multiplier = id === 1 ? (stress < 5 ? 2 : stress < 10 ? 1.5 : 1) : 1;
    return Math.max(0, Math.min(100, Math.round(previous + (delta > 0 ? delta * multiplier : delta) + sharedBonus * multiplier)));
}
export function proposalPressure(requests: Array<{
    result: string;
}>): number {
    return requests.reduce((count, r) => { try {
        const v = JSON.parse(r.result);
        return count + (v.proposalActor === 2 ? 1 : 0);
    }
    catch {
        return count;
    } }, 0);
}
export function flirtingAssessment(stress: number, observedAttraction: number, seed: string) {
    let hash = 0;
    for (const c of seed)
        hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
    const mistaken = hash % 100 < (stress >= 55 ? 35 : 10);
    const offset = mistaken ? (hash % 2 ? 1 : -1) * (stress >= 55 ? 22 : 8) : 0;
    return { estimatedInterest: Math.max(0, Math.min(100, observedAttraction + offset)), mayBeMistaken: mistaken, approach: stress >= 55 ? "Inquiet, tu risques de mal interpréter une réaction. Prends le temps de demander plutôt que supposer." : "Observe la réciprocité, demande avec tact et laisse de l'espace." };
}

// A received line is a distinct cause, not a room/activity bonus.
export function receivedAffectionBonus(line:string):number {
    const text=line.toLowerCase().replaceAll('’',"'");
    if(/je ne te laisserai pas (?:seul|seule)|tu n['’]es pas seul|je reste près de toi|on va s['’]en sortir ensemble/i.test(text))return 2;
    if(/ne .{0,35}pas|pas envie|mal à l'aise|me gên|m'agace|tu insistes|tu me forces/i.test(text))return 0;
    if(/ta présence.{0,45}(?:apaise|rassure|bien|compte)|(?:tu|tes|ton).{0,35}(?:me plais|me plaît|me touche|me fait sourire)|(?:j'aime|j'apprécie|je suis bien|j'ai envie).{0,55}(?:avec toi|à tes côtés|près de toi)|(?:tu es|je te trouve).{0,20}(?:belle|beau|charmant|adorable)|(?:tu comptes|tu me manques|je tiens à toi)/i.test(text))return 2;
    if(/merci.{0,35}(?:gentil|gentille|attention|délicat|délicate)|(?:c'est|tu es|tu as été).{0,20}(?:gentil|gentille|attentionné|attentionnée)|je suis (?:bien )?(?:content|contente).{0,45}(?:avec toi|te voir|partager)/i.test(text))return 1;
    if(/tu auras.{0,40}(?:espace|temps)|prends ton temps|je respecte.{0,25}(?:ton|ta|tes)|je suis là pour toi|tu peux compter sur moi|je te laisse.{0,35}(?:espace|temps)/i.test(text))return 1;
    return 0;
}
