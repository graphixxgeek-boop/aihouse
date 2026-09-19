import {sleepRoom} from "./relationship";
import {readLife} from "./life";
import {phaseOf,phaseLabel,isNight,dayIndex} from "./daynight";
import { mutualAttraction, parseNeeds, initialNeedsFor, initialEmotionsFor, type Needs, type Intent, type InsoliteOpening } from "./simulation";
import { emotionSchema, type Emotions } from "./lia";
import { names, type Person, type Room } from "./house";
export type Resident = {location?:string;attachment?:number;
    id: Person;
    name: string;
    mood: string;
    activity: string;
    goal: string;
    cycle: number;
    room: Room;
    last_seen: number;
    emotions: Emotions;
    needs: Needs;
    intent: Intent;
    angry?: boolean;
};
export async function initialize(db: D1Database, insolite: InsoliteOpening = "normal") {
    await db.batch(([1, 2] as Person[]).map(id => db.prepare("INSERT OR IGNORE INTO agent_state (id,mood,activity,goal,cycle,last_seen,room,needs,emotions) VALUES (?,?,?,?,0,?,?,?,?)")
        .bind(id, id === 1 ? "curieuse" : "curieux", "Où suis-je ?", "Comprendre le lieu et faire connaissance", Date.now(), id === 1 ? "salon" : "bureau", JSON.stringify(initialNeedsFor(id, insolite)), JSON.stringify(initialEmotionsFor(id, insolite)))));
}
export async function readWorld(db: D1Database) {
    const [state, memories, messages, clock, scenario] = await Promise.all([
        db.prepare("SELECT * FROM agent_state WHERE id IN (1, 2) ORDER BY id").all<Resident>(),
        db.prepare("SELECT id, agent_id, kind, content, created_at, (SELECT room FROM conversations c WHERE c.created_at=memories.created_at AND c.speaker=CASE memories.agent_id WHEN 1 THEN 'Lia' ELSE 'Noé' END LIMIT 1) AS room FROM memories WHERE kind != 'scenario' ORDER BY created_at DESC, id DESC LIMIT 20").all(),
        db.prepare("SELECT id, speaker, content, room, created_at FROM conversations ORDER BY id DESC LIMIT 40").all(),
        db.prepare("SELECT epoch FROM world_lock WHERE id = 1").first<{
            epoch: number;
        }>(),
        db.prepare("SELECT content FROM memories WHERE kind = 'scenario' ORDER BY id DESC LIMIT 1").first<{content:string}>(),
    ]);
    const story = (() => { try { const data = JSON.parse(scenario?.content ?? "null"); const round=Number(data?.round)||0; return data ? {observer:data.observer,round,humanUnlocked:data.finalCalled===true && data.evidence.length>=5, session:data.seed, evidence:data.evidence as string[], dreams:(data.dreams??[]) as {actor:1|2;round:number;content:string}[], observations:(data.observations??[]) as string[], life:readLife(data.life,data.round),revealed:data.evidence.length >= 5,everReachedRevelation:data.everReachedRevelation===true,dayNight:{phase:phaseOf(round),label:phaseLabel[phaseOf(round)],isNight:isNight(round),day:dayIndex(round)}} : null; } catch { return null; } })();
    const agents = state.results.map(agent => ({...agent,needs:parseNeeds(agent.needs),emotions:(()=>{try{return emotionSchema.parse(JSON.parse(String(agent.emotions)))}catch{return initialEmotionsFor(agent.id)}})()}));
    for(const agent of agents)if(agent.room==="jardin"&&!(story?.humanUnlocked&&story.life.gardenOpen)){agent.room="salon";agent.intent="none";}
    for(const agent of agents)if(["sleep","share_sleep"].includes(agent.intent)&&!["salon","chambre"].includes(agent.room)){agent.room=sleepRoom(agent,agents.find(a=>a.id!==agent.id)!,mutualAttraction(agents[0],agents[1]));}
    return { story, epoch: clock?.epoch ?? 0, agents: agents.map(agent => ({ ...agent,angry:Boolean(story?.life.dispute?.remaining),location:["sleep","share_sleep"].includes(agent.intent)?(agent.room==="chambre"?"bed":"sofa"):story?.life.spatialFocus?.[agent.id],mood:agent.id===2?({curieuse:"curieux",attentive:"attentif"} as Record<string,string>)[agent.mood]??agent.mood:agent.mood,attachment:story?.life.attachment[agent.id]??0, needs: agent.needs, name: names[agent.id], emotions: (() => {
                try {
                    const emotions=typeof agent.emotions==="object"?agent.emotions:emotionSchema.parse(JSON.parse(String(agent.emotions)));return {...emotions,attraction:Math.max(emotions.attraction,story?.life.attachment[agent.id]??0)};
                }
                catch {
                    return initialEmotionsFor(agent.id);
                }
            })() })), memories: memories.results, messages: messages.results.reverse() };
}
