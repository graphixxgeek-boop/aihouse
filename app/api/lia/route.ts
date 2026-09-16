import {stockSurprise,stockThought} from "@/lib/stock";
import {visualTiming,type VisualEvent} from "@/lib/visual-events";
import {destinationAnchor,gardenAccess} from "@/lib/house";
import {normaliseNickname,visibleScene,appearanceReply} from "@/lib/perception";
import {coldOpening,dialogueFingerprint,distinctReply,justifiedReply,truthfulGender,dramaRules,departureLine} from "@/lib/drama";
import {readLife,humanStress,isSleeping} from "@/lib/life";
import { planTurn, coordinateRooms, residentPriority, sceneFor, proposedDestination } from "@/lib/turn";
import { newStory, parseStory, rememberAges, advanceStory, storyContext, investigationTarget, investigationRecap, finaleReveal, groundFragment, seedPick, type Story } from "@/lib/story";
import { ages, sleepRoom, attractionAfterTurn, proposalPressure, flirtingAssessment, receivedAffectionBonus } from "@/lib/relationship";
import { nextSpeaker, dialogueProgress, dialogueContext, completedActivity, conversationFocus, explicitGestureConsent, groundAgeQuestion, groundIntroduction, groundScreenNotice, groundPrivateThought, groundRoomSpeech } from "@/lib/dialogue";
import { advanceNeeds, priority, intentRoom, intentLabels, tvPrograms, intents, affectionIntents, mutualAttraction, residentProfiles, initialNeedsFor, initialEmotionsFor, sharedActivityBonus } from "@/lib/simulation";
import { env } from "cloudflare:workers";
import { z } from "zod";
import { LiaError, think, decisionSchema, evolveEmotions } from "@/lib/lia";
import { initialize, readWorld } from "@/lib/world";
import { names, spaces, type Person } from "@/lib/house";
const schema = z.object({
    requestId: z.string().uuid(), actor: z.union([z.literal(1), z.literal(2)]),
    mode: z.enum(["chat", "autonomous", "interact", "move", "care", "reset", "identify", "unlock_garden"]),
    epoch: z.number().int().min(0).default(0), intent: z.enum(intents).default("none"),
    message: z.string().trim().max(2000).default(""),
    room: z.enum(spaces).default("salon"), night: z.boolean().default(false),
}).refine(input => input.mode !== "chat" || input.message.length > 0).refine(input => input.mode !== "care" || ["eat", "sleep", "rest", "study", "tv"].includes(input.intent));
type Decision = z.infer<typeof decisionSchema> & {
    actor: Person;
};
export async function POST(request: Request) {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
        return Response.json({ error: "Origine non autorisée" }, { status: 403 });
    let input: z.infer<typeof schema>;
    try {
        if (Number(request.headers.get("content-length") ?? 0) > 12000)
            throw new Error();
        const body = await request.text();
        if (body.length > 12000)
            throw new Error();
        input = schema.parse(JSON.parse(body));
    }
    catch {
        return Response.json({ error: "Requête invalide. Limite : 2 000 caractères." }, { status: 400 });
    }
    const db = env.DB;
    if (!db)
        return Response.json({ error: "La mémoire est indisponible." }, { status: 503 });
    if (!["move", "care", "reset", "identify", "unlock_garden"].includes(input.mode) && !env.GEMINI_API_KEY)
        return Response.json({ error: "La connexion Gemini doit être configurée." }, { status: 503 });
    const token = crypto.randomUUID(), now = Date.now();
    let locked = false;
    try {
        const cached = await db.prepare("SELECT result FROM world_requests WHERE id = ?").bind(input.requestId).first<{
            result: string;
        }>();
        if (cached) {
            const live = await readWorld(db);
            const result = JSON.parse(cached.result);
            if (input.mode !== "reset" && live.epoch !== input.epoch)
                return Response.json({ error: "La maison a été réinitialisée. Recharge son état." }, { status: 409 });
            return Response.json({ ...result, ...live }, { headers: { "Cache-Control": "no-store" } });
        }
        const lease = await db.prepare("INSERT INTO world_lock (id, token, expires_at, last_auto) VALUES (1, ?, ?, 0) ON CONFLICT(id) DO UPDATE SET token = excluded.token, expires_at = excluded.expires_at WHERE world_lock.expires_at < ?").bind(token, now + 90000, now).run();
        if (lease.meta.changes !== 1)
            return Response.json({ code: "world_busy", error: "Le déplacement attend la fin du tour en cours." }, { status: 409, headers: { "Retry-After": "5" } });
        locked = true;
        const duplicate = await db.prepare("SELECT result FROM world_requests WHERE id = ?").bind(input.requestId).first<{
            result: string;
        }>();
        if (duplicate)
            return Response.json({ ...JSON.parse(duplicate.result), ...await readWorld(db) });
        const clock = await db.prepare("SELECT epoch FROM world_lock WHERE id = 1").first<{
            epoch: number;
        }>();
        if (input.epoch !== (clock?.epoch ?? 0))
            return Response.json({ error: "La maison a été réinitialisée. Recharge la page avant un nouveau tour." }, { status: 409 });
        const storedStory = await db.prepare("SELECT id, content FROM memories WHERE kind = 'scenario' ORDER BY id DESC LIMIT 1").first<{id:number;content:string}>();
        const story: Story = storedStory ? parseStory(storedStory.content) : newStory();
        if(input.mode==="identify"){
            const nickname=normaliseNickname(input.message);if(!nickname)return Response.json({error:"Choisissez un pseudo."},{status:400});
            if(!story.observer)story.observer=nickname;
            const at=Date.now(),fence="EXISTS (SELECT 1 FROM world_lock WHERE id = 1 AND token = ? AND expires_at > ?)";
            const save=storedStory?db.prepare(`UPDATE memories SET content = ? WHERE id = ? AND ${fence}`).bind(JSON.stringify(story),storedStory.id,token,at):db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT 1,'scenario',?,? WHERE ${fence}`).bind(JSON.stringify(story),at,token,at);
            const saved=await db.batch([save,db.prepare(`INSERT INTO world_requests (id,result,created_at) SELECT ?,?,? WHERE ${fence}`).bind(input.requestId,JSON.stringify({decisions:[]}),at,token,at)]);
            if(saved[0].meta.changes!==1)throw new LiaError("L’enregistrement a expiré. Réessayez.",409);
            return Response.json({...await readWorld(db),decisions:[]});
        }
        if(input.mode==="unlock_garden"){
            if(!story.finalCalled||story.evidence.length<5)return Response.json({error:"Cet accès n’est pas disponible."},{status:423});
            const life=readLife(story.life,story.round),changed=!life.gardenOpen;life.gardenOpen=true;story.life=life;
            const at=Date.now(),fence="EXISTS (SELECT 1 FROM world_lock WHERE id = 1 AND token = ? AND expires_at > ?)",statements=[];
            if(!storedStory)throw new LiaError("Le dossier de la maison est indisponible.",503);
            statements.push(db.prepare(`UPDATE memories SET content=? WHERE id=? AND ${fence}`).bind(JSON.stringify(story),storedStory.id,token,at));
            if(changed){statements.push(db.prepare(`INSERT INTO conversations (speaker,content,room,created_at) SELECT 'Maison · accès','L’observateur a déverrouillé la porte gauche du couloir. Le jardin est accessible.','couloir',? WHERE ${fence}`).bind(at,token,at));for(const id of [1,2])statements.push(db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT ?,'événement',?,? WHERE ${fence}`).bind(id,'[couloir|'+new Date(at).toISOString()+'] L’observateur autorise l’accès au jardin.',at,token,at));}
            statements.push(db.prepare(`INSERT INTO world_requests (id,result,created_at) SELECT ?,?,? WHERE ${fence}`).bind(input.requestId,JSON.stringify({decisions:[]}),at,token,at));
            const saved=await db.batch(statements);if(saved[0].meta.changes!==1)throw new LiaError("L’ouverture a expiré. Réessayez.",409);
            return Response.json({...await readWorld(db),decisions:[]},{headers:{"Cache-Control":"no-store"}});
        }
        if(input.mode==="move"&&input.room==="jardin"&&!gardenAccess(story))return Response.json({error:"La porte du jardin est verrouillée."},{status:423});
        if (input.mode === "chat" && (!story.finalCalled || story.evidence.length<5)) return Response.json({error:"La conversation humaine s’ouvrira lorsque Lia et Noé auront découvert leur origine et appelé leur observateur."},{status:423});
        if (input.mode === "reset") {
            const at = Date.now(), fence = "EXISTS (SELECT 1 FROM world_lock WHERE id = 1 AND token = ? AND expires_at > ?)";
            const statements = [db.prepare(`UPDATE world_lock SET epoch = epoch + 1, last_auto = 0 WHERE id = 1 AND ${fence}`).bind(token, at)];
            for (const table of ["conversations", "memories", "agent_state", "world_requests", "dialogue_fingerprints"])
                statements.push(db.prepare(`DELETE FROM ${table} WHERE ${fence}`).bind(token, at));
            for (const actor of [1, 2] as Person[])
                statements.push(db.prepare(`INSERT INTO agent_state (id,mood,activity,goal,cycle,last_seen,room,needs,emotions) SELECT ?, ?, ?, ?, 0, ?, ?, ?, ? WHERE ${fence}`).bind(actor, actor===2?"curieux":"curieuse", "Où suis-je ?", "Comprendre où je suis et qui est l’autre", at, actor === 1 ? "salon" : "bureau", JSON.stringify(initialNeedsFor(actor)), JSON.stringify(initialEmotionsFor(actor)), token, at));
            statements.push(db.prepare(`INSERT INTO world_requests (id,result,created_at) SELECT ?, ?, ? WHERE ${fence}`).bind(input.requestId, JSON.stringify({ decisions: [], requestId: input.requestId }), at, token, at));
            statements.push(db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT 1, 'scenario', ?, ? WHERE ${fence}`).bind(JSON.stringify({...newStory(story.variant),observer:story.observer}), at, token, at));
            const saved = await db.batch(statements);
            if (saved[0].meta.changes !== 1)
                throw new LiaError("Le recommencement a expiré. Réessaie.", 409);
            return Response.json({ decisions: [], requestId: input.requestId, ...await readWorld(db) }, { headers: { "Cache-Control": "no-store" } });
        }
        const last = await db.prepare("SELECT last_auto FROM world_lock WHERE id = 1").first<{
            last_auto: number;
        }>();
        if (input.mode === "autonomous" && now - (last?.last_auto ?? 0) < 85000)
            return Response.json({ code:"auto_throttled", error: "Le prochain tour automatique sera disponible dans un moment." }, { status: 429, headers: { "Retry-After": "90" } });
        await initialize(db);
        const world = await readWorld(db);
        const speech = (await db.prepare("SELECT id, speaker, content FROM conversations WHERE speaker IN ('Lia','Noé') AND NOT EXISTS (SELECT 1 FROM conversations visitor WHERE visitor.id = conversations.id - 1 AND visitor.speaker = 'vous') ORDER BY id DESC LIMIT 24").all<{
            id: number;
            speaker: string;
            content: string;
        }>()).results.reverse();
        if (story.met === undefined) story.met = speech.length > 0 || world.agents.every(a=>a.cycle>0) && world.agents[0].room === world.agents[1].room;
        if (story.introduced === undefined) story.introduced = Boolean(story.met);
        if (story.sharedMeal === undefined) story.sharedMeal = Boolean(story.met);
        const choosePriority = (needs:typeof world.agents[number]["needs"]) => residentPriority({...world.agents[0],needs},Boolean(story.introduced));
        const recentRequests = (await db.prepare("SELECT result FROM world_requests ORDER BY created_at DESC LIMIT 6").all<{
            result: string;
        }>()).results;
        const recentRefusal = recentRequests.slice(0, 3).some(r => {
            try {
                return JSON.parse(r.result).affectionOutcome === "declined";
            }
            catch {
                return false;
            }
        });
        const pressure = proposalPressure(recentRequests);
        const overProposing = pressure >= 2;
        const life=readLife(story.life,story.round);
        const sleeper = ["interact","autonomous"].includes(input.mode) ? world.agents.find(a=>isSleeping(a,life)) : undefined;
        const noe=world.agents.find(a=>a.id===2)!;
        const humanActor:Person=input.actor;
        const proposalCooldown=recentRequests.slice(0,3).some(r=>{try{return JSON.parse(r.result).proposalActor===2;}catch{return false;}});
        const proactiveNoe=["interact","autonomous"].includes(input.mode)&&story.introduced&&flirtingAssessment(noe.needs.stress,world.agents[0].emotions.attraction,input.requestId).estimatedInterest>=35&&!recentRefusal&&!overProposing&&!proposalCooldown&&!priority(world.agents[0].needs)&&!priority(world.agents[1].needs)&&["salon","chambre"].includes(noe.room)&&noe.emotions.attraction>=80;
        const eligibleBeat=!(gardenAccess(story)&&!life.gardenVisited)&&["interact","autonomous"].includes(input.mode)&&story.introduced&&world.agents.every(a=>a.room==="salon")&&!story.life?.debrief?.remaining&&!story.life?.contact?.remaining&&!story.pendingDestination&&!priority(world.agents[0].needs)&&!priority(noe.needs);
        const visualBeat=eligibleBeat&&story.round<=5&&(story.life?.visualIntro??0)<2;
        const followBeat=eligibleBeat&&story.life?.personalAsked&&story.round>=(story.life?.personalRound??story.round)+3&&(story.life?.personalFollowup??0)<3&&world.agents[0].needs.stress<30&&world.agents[0].emotions.attraction>=25;
        const recapBeat=eligibleBeat&&story.evidence.length>=2&&story.evidence.length<5&&(story.life?.recapCount??0)<story.evidence.length;
        const ambientBeat=eligibleBeat&&!visualBeat&&!followBeat&&!recapBeat&&story.round>=10&&(!story.life?.ambientSeen||!story.life?.ambientVerified);
        const personalLead=!(gardenAccess(story)&&!life.gardenVisited)&&["interact","autonomous"].includes(input.mode)&&story.introduced&&story.round>=14&&!story.life?.personalAsked&&!story.life?.debrief?.remaining&&!story.life?.contact?.remaining&&!story.pendingDestination&&world.agents.every(a=>a.room==="salon")&&world.agents[0].needs.stress<30&&world.agents[0].emotions.attraction>=25&&world.agents[0].emotions.attraction<80&&!priority(world.agents[0].needs)&&!priority(noe.needs);
        const urgentResident=["interact","autonomous"].includes(input.mode)?world.agents.find(a=>choosePriority(a.needs)):undefined;
        const actor: Person = sleeper?.id ?? urgentResident?.id ?? (["interact","autonomous"].includes(input.mode)&&story.pendingDestination&&affectionIntents.includes(story.pendingDestination.intent)?story.pendingDestination.proposer:undefined) ?? (visualBeat?((story.life?.visualIntro??0)===0?1:2):followBeat?1:ambientBeat?2:personalLead?1:undefined) ?? (proactiveNoe?2:undefined) ?? (["autonomous", "interact"].includes(input.mode) ? nextSpeaker(speech, input.actor) : humanActor);
        const current = world.agents.find(agent => agent.id === actor)!;
        const other = world.agents.find(agent => agent.id !== actor)!;
        if(input.mode==="chat"&&isSleeping(current,life))return Response.json({error:current.name+" dort. Sa voix reste silencieuse pour le moment."},{status:423});
        const fingerprint=dialogueFingerprint;
        const historicalLines=(await db.prepare(life.dialogueIndexed?"SELECT fingerprint AS content FROM dialogue_fingerprints UNION SELECT content FROM conversations WHERE speaker LIKE '% · déplacement'":"SELECT content FROM conversations WHERE speaker != 'vous'").all<{content:string}>()).results;
        const pastKeys=new Set(historicalLines.map(l=>fingerprint(l.content)));
        if(!life.proposalHistoryChecked&&story.round>0){
            if(!life.proposalMade)life.proposalMade=Boolean(await db.prepare("SELECT id FROM world_requests WHERE result LIKE '%\"proposalActor\":2%' LIMIT 1").first());
            life.proposalHistoryChecked=true;
        }
        const ownMemories = async (actor: Person) => (await db.prepare("SELECT kind, content FROM memories WHERE agent_id = ? AND kind IN ('rencontre','routine','réflexion') ORDER BY created_at DESC, id DESC LIMIT 8").bind(actor).all()).results;
        const scenario = (await db.prepare("SELECT agent_id, content FROM memories WHERE kind = 'rencontre' ORDER BY id DESC LIMIT 24").all()).results.reverse();
        const encounterTurns = (await db.prepare("SELECT count(*) AS n FROM memories WHERE kind = 'rencontre'").first<{
            n: number;
        }>())?.n ?? 0;
        const affectionEligible = mutualAttraction(current, other) && !recentRefusal && !overProposing;
        const affectionOpportunity = story.round>=12&&!life.debrief?.remaining&&!life.contact?.remaining&&current.id===2 && current.emotions.attraction>=80 && flirtingAssessment(current.needs.stress,other.emotions.attraction,input.requestId).estimatedInterest>=35 && !recentRefusal && !overProposing && !proposalCooldown && !priority(current.needs) && !priority(other.needs);
        const ageLines = (await db.prepare("SELECT id, speaker, content FROM conversations WHERE speaker IN ('Lia','Noé') AND NOT EXISTS (SELECT 1 FROM conversations visitor WHERE visitor.id = conversations.id - 1 AND visitor.speaker = 'vous') AND (content LIKE '%28%' OR content LIKE '%31%' OR content LIKE '%huit%' OR content LIKE '%trente%')").all<{id:number;speaker:string;content:string}>()).results;
        const knownAges = Array.from(new Set([...rememberAges(ageLines), ...Object.keys(story.facts).filter(name => story.facts[name].some(fact => name === "Lia" ? /\b28\b/.test(fact) : /\b31\b/.test(fact)))]));
        const humanConversation = story.finalCalled ? (await db.prepare("SELECT id,speaker,content FROM conversations WHERE speaker IN ('Lia','Noé','vous') ORDER BY id DESC LIMIT 12").all()).results.reverse() : [];
        const knownNames=story.introduced?["Lia","Noé"]:[];
        const screenKnown=Boolean(await db.prepare("SELECT id FROM conversations WHERE speaker='Noé' AND content LIKE '%écran%' LIMIT 1").first());
        const personalQuestion=personalLead&&story.introduced&&story.round>=14&&!life.personalAsked&&world.agents[0].needs.stress<30&&world.agents.every(a=>a.room==="salon")&&world.agents[0].emotions.attraction>=25&&world.agents[0].emotions.attraction<80;
        const narrative = {gardenState:{open:gardenAccess(story),humanCanUnlock:story.finalCalled===true&&story.evidence.length>=5,visited:life.gardenVisited,rule:"Seul l’utilisateur ouvre la porte gauche du couloir ; la porte principale droite reste fermée."},dialogueProgress:dialogueProgress(speech,life.contributions??[]), personalQuestion:personalQuestion?"Lia veut savoir quel genre d’homme Noé est : pose naturellement cette question. Noé répond personnellement avec une limite ou un défaut concret, pas une promesse de sauveur.":undefined,  knownNames, screenKnown, humanConversation, cinematic: storyContext(story, actor), socialRules:{liaIntroduced:story.introduced, liaCanComment:world.agents[0].needs.stress<30, firstSharedMeal:!story.sharedMeal}, knownAges, personalFacts: { Lia: { age: 28 }, Noé: { age: 31 } }, conversationFocus: !story.introduced && encounterTurns < 4 ? "Qui êtes-vous ? Pourquoi êtes-vous ici ? Pourquoi ces souvenirs incomplets ? Répondez sans inventer une explication ; l’âge et les habitudes attendront." : conversationFocus(speech, current, other, knownAges, story.round>=12 && Boolean(story.sharedMeal)), proposalPressure: pressure, overProposing, affectionOpportunity, suggestedAffection: ["hug", "massage", "kiss", "share_sleep"][Math.floor((current.cycle + other.cycle) / 6) % 4], recentRefusal, completedActions: world.agents.map(completedActivity).filter(Boolean), scenarioHistory: scenario, encounterTurns, mutualAffectionEligible: affectionEligible, tvProgram: tvPrograms[Math.floor(current.cycle / 3) % tvPrograms.length] };
        const turnPlan=planTurn(input.mode,current,other,story,affectionEligible,affectionOpportunity,narrative.suggestedAffection as typeof intents[number],speech);
        if(!turnPlan.gardenFirst&&(visualBeat||followBeat||ambientBeat||recapBeat||personalQuestion))Object.assign(turnPlan,{intent:"chat",room:"salon",partnerIntent:"chat",partnerRoom:"salon",requiredIntent:"chat",offer:undefined,proposalLine:undefined,explore:undefined,exitInspection:false});
        const beatLine=visualBeat?(life.visualIntro===1?seedPick(story.seed,"beat-visual-2",["Et moi, je ressemble à quoi ? Dis-moi ce que tu vois.","Et de ton côté, je ressemble à quoi ?","Bon, à ton tour : dis-moi ce que tu vois de moi."]):seedPick(story.seed,"beat-visual-1",["Je ressemble à quoi, là ? J’ai l’impression que mon corps m’échappe.","Dis-moi à quoi je ressemble, là. J’ai l’impression de ne plus avoir de corps.","C’est quoi mon apparence, exactement ? J’ai l’impression d’avoir perdu mon corps."])):followBeat?((life.personalFollowup??0)===0?seedPick(story.seed,"beat-follow-1",["Mais au fait, quel genre d’homme es-tu, Noé ?","Au fait, t’es quel genre d’homme, Noé ?","Dis-moi, Noé, t’es quel genre de mec ?"]):seedPick(story.seed,"beat-follow-2",["T’es marié ? T’as quelqu’un dans ta vie ?","Y a quelqu’un dans ta vie, ou t’es célibataire ?","T’es engagé avec quelqu’un, ou pas du tout ?"])):personalQuestion?seedPick(story.seed,"beat-personal",["Quel genre d’homme es-tu, Noé ?","T’es quel genre d’homme, Noé ?","Dis-moi honnêtement : t’es quel genre d’homme ?"]):undefined;
        const beatContext={phase:life.personalFollowup??0,visual:visualBeat,followup:followBeat,line:beatLine,recap:recapBeat?{observed:story.evidence,anomalies:story.observations,rule:"Récapitule les supports réellement examinés, distingue constat, déduction limitée et question encore ouverte. N’ajoute aucun objet non validé."}:undefined,ambient:ambientBeat?"Repère la fausse plante aux feuilles bleues polygonales puis allume l’enceinte. Des notes dessinées apparaissent mais aucun son ne sort. Décris ces objets, puis vous analyserez ce paradoxe au salon.":undefined};
        if(turnPlan.offer&&turnPlan.proposalLine&&pastKeys.has(fingerprint(turnPlan.proposalLine))){const original=turnPlan.proposalLine;const candidates=["Si ça te tente. "+original,"Je préfère te demander. "+original,"Sans te mettre la pression. "+original];turnPlan.proposalLine=candidates.find(line=>!pastKeys.has(fingerprint(line)));if(!turnPlan.proposalLine)Object.assign(turnPlan,{offer:undefined,intent:"chat",partnerIntent:"chat",requiredIntent:"chat"});}
        const {urgentIntent,requiredIntent,routine}=turnPlan;
        const exitContext=turnPlan.exitInspection?{phase:(life.exitPhase??0)+1,location:"couloir",description:life.exitPhase===1?"Vous parcourez le couloir à droite. La porte principale est verrouillée ; au-delà, un trottoir et une route immobiles.":"Vous parcourez le couloir à gauche. Une porte verrouillée mène au jardin visible depuis la fenêtre du salon. Décris cette recherche, pas un indice lu au bureau."}:undefined;
        const tvDiscovery=turnPlan.intent==="tv"&&!life.remoteFound?"La télévision est éteinte. Une télécommande est posée sur la table basse : tu la repères, appuies sur marche, puis observes une courbe qui boucle et SESSION / 0–3. Décris cette première mise en marche, pas une émission déjà connue.":undefined;
        const observationTarget=turnPlan.intent==="study"&&turnPlan.room==="bureau"?{content:story.evidence.length>=4&&life.studyTurns===0?"Un dossier fermé porte deux identifiants et un sceau d’observation. Son contenu reste inconnu.":investigationTarget(story),pass:life.studyTurns+1,instruction:life.studyTurns===0?"Décris d’abord le support et ce que tu vois. Pas de conclusion définitive.":"Examine le contenu et formule une question concrète. L’analyse approfondie suivra au salon."}:null;
        const decisions: Decision[] = [];
        const opening=["interact","autonomous"].includes(input.mode)&&!story.met&&!story.introduced&&speech.length===0&&story.round===0;
        if(opening){const lines=coldOpening(story.variant);for(const [i,a] of [current,other].entries())decisions.push({actor:a.id,intent:"chat",affectionAccepted:false,emotions:{...a.emotions},reply:lines[i],thought:a.id===1?"Je sais pas si je peux lui faire confiance.":"Elle a peur. Moi aussi, mais pas question de le montrer.",stayAlone:false,mood:"attentive",activity:a.id===2?"J’observe cette inconnue":"J’observe cet inconnu",goal:"Comprendre où je suis",action:"move",room:"salon",memory:lines[i]});}
        else if(turnPlan.exitInspection){const first=life.exitPhase!==1;const lines=first?["Une porte, au bout gauche du couloir. Verrouillée. Elle donne sur le jardin qu’on voit depuis le salon.","On nous montre de l’herbe et un arbre, mais la poignée ne cède pas. Belle invitation."]:["La porte principale est de ce côté. Fermée aussi. Derrière, un trottoir et une route qui ne bougent pas.","Deux portes, deux verrous. On n’a même pas choisi le côté de la cage."];for(const [i,a] of [current,other].entries())decisions.push({actor:a.id,intent:"chat",affectionAccepted:false,emotions:{...a.emotions},reply:lines[(i+story.variant)%2],thought:a.id===1?"Il cherche vraiment une issue. Ça me rassure de voir qu’il ne fait pas que parler.":"Elle regarde chaque détail. J’aime ça, même si je sais pas quoi lui répondre.",stayAlone:false,mood:"attentive",activity:"Je cherche une sortie",goal:"Examiner les limites de la maison",action:"move",room:"salon",memory:lines[(i+story.variant)%2]});}
        else if(ambientBeat||recapBeat)for(const a of [current,other])decisions.push({actor:a.id,intent:"chat",affectionAccepted:false,emotions:{...a.emotions},reply:"",mood:"attentive",activity:"Je fais le point",goal:"Confronter les observations",action:"move",room:"salon",memory:""});
        else if (input.mode === "move" || input.mode === "care" || routine)
            decisions.push({ affectionAccepted: false, intent: routine ? requiredIntent! : input.mode === "care" ? input.intent : "none", actor: actor, emotions: current.emotions, reply: input.mode === "care" ? `${intentLabels[input.intent]}.` : `Je rejoins ${input.room==="jardin"?"le jardin":input.room==="chambre"?"la chambre":input.room==="cuisine"?"la cuisine":"le "+input.room}.`, mood: "attentive", activity: input.mode === "care" ? intentLabels[input.intent] : `Je rejoins ${input.room==="jardin"?"le jardin":input.room==="chambre"?"la chambre":input.room==="cuisine"?"la cuisine":"le "+input.room}`, goal: current.goal, action: "move", room: input.mode === "care" ? (intentRoom[input.intent] ?? current.room) : input.room, memory: `Je choisis ${input.mode === "care" ? intentLabels[input.intent] : `de rejoindre ${input.room}`}.` });
        else {
            const canPair = ["interact", "autonomous", "chat"].includes(input.mode) && !isSleeping(other,life);
            const perceivedResidents=visibleScene(turnPlan.room,world.agents.map(a=>({...a,room:turnPlan.room})));
            // Un cerveau par personnage : Noé décide et parle en premier, sans jamais voir ni deviner
            // la réplique de Lia à l’avance ; elle ne reçoit ensuite que ce qu’elle perçoit réellement.
            const first = await think(env.GEMINI_API_KEY!, env.GEMINI_MODEL || "gemini-flash-lite-latest", { selfRole:"primary", ...narrative, beatContext,perceivedResidents, exitContext, tvDiscovery, observationTarget,turnPlan, scene:sceneFor(current,turnPlan.offer??turnPlan.intent,turnPlan.room), ...(input.mode==="chat"?{dialogue:humanConversation,replyTarget:{speaker:"vous",content:input.message},continuation:"Réponds d’abord au dernier message humain, pas à l’autre habitant.",conversationFocus:"L’humain vient de parler. Réponds directement à son message avant de discuter entre vous."}:dialogueContext(speech, names[actor])), age: ages[actor], sleepDestination: sleepRoom(current, other, mutualAttraction(current, other)), flirting: actor === 2 ? flirtingAssessment(canPair&&!story.met?30:current.needs.stress, other.emotions.attraction, input.requestId) : null, personality: residentProfiles[actor].description, requiredIntent, mode: input.mode, message: input.message, night: input.night, state: canPair && !story.met ? {...current,needs:{...current.needs,stress:actor===1?current.needs.stress:30},emotions:{...current.emotions,tension:actor===1?current.emotions.tension:30}} : current, other, memories: await ownMemories(actor), meetingRoom: current.room }, names[actor]);
            if (actor===2 && input.mode!=="chat") first.reply=groundScreenNotice(first.reply,speech,screenKnown);
            if (input.mode !== "chat") first.reply = groundIntroduction(groundFragment(first.reply,actor,story,speech), names[actor], names[other.id], speech, knownNames);
            if(input.mode!=="chat")first.reply=groundAgeQuestion(first.reply,story.round>=12&&Boolean(story.sharedMeal),knownAges,names[other.id]);
            if(beatLine){first.reply=beatLine;first.memory=beatLine;}
            if(turnPlan.offer&&turnPlan.proposalLine){first.reply=turnPlan.proposalLine;first.intent=turnPlan.offer;first.affectionAccepted=true;first.memory=first.reply;}
            if (!affectionIntents.includes(first.intent)) first.intent=turnPlan.intent;
            first.room=turnPlan.room;first.action="move";
            decisions.push({ ...first, actor });
            if ((input.mode === "chat" || input.mode === "interact" || (input.mode === "autonomous" && ["chat", "study", "eat", "rest", "tv"].includes(first.intent)) || affectionIntents.includes(first.intent)) && first.intent !== "sleep" && !isSleeping(other,life)) {
                const meetingRoom = turnPlan.room;
                decisions[0] = { ...decisions[0], action: "move", room: meetingRoom };
                // Lia perçoit la réplique RÉELLEMENT prononcée par Noé, jamais une version devinée à l’avance.
                const heard = [...speech,{id:0,speaker:names[actor],content:first.reply}];
                const second = await think(env.GEMINI_API_KEY!, env.GEMINI_MODEL || "gemini-flash-lite-latest", { selfRole:"partner", ...narrative, cinematic: storyContext(story, other.id), dialogueProgress: dialogueProgress(heard, life.contributions??[]), beatContext, perceivedResidents, exitContext, tvDiscovery, observationTarget, turnPlan, scene: sceneFor(other, turnPlan.partnerIntent, turnPlan.partnerRoom), ...(input.mode==="chat"?{dialogue:heard,replyTarget:{speaker:"vous",content:input.message},continuation:`Réponds toi aussi d’abord au dernier message humain si ${names[actor]} ne l’a pas déjà couvert, ou réagis à ce qu’${names[actor]} vient de dire à ce sujet.`,conversationFocus:`L’humain a parlé, et ${names[actor]} vient de répondre. Réagis avec ton propre point de vue, sans répéter sa question.`}:dialogueContext(heard, names[other.id])), age: ages[other.id], sleepDestination: sleepRoom(other, current, mutualAttraction(current, other)), flirting: other.id === 2 ? flirtingAssessment(!story.met?30:other.needs.stress, current.emotions.attraction, input.requestId) : null, personality: residentProfiles[other.id].description, requiredIntent: turnPlan.partnerIntent, mode: input.mode, message: input.message, night: input.night, state: !story.met ? {...other,needs:{...other.needs,stress:other.id===1?other.needs.stress:30},emotions:{...other.emotions,tension:other.id===1?other.emotions.tension:30}} : other, other: current, memories: await ownMemories(other.id), meetingRoom: current.room }, names[other.id]);
                if(visualBeat){second.reply=appearanceReply({...current,intent:"chat"},other.id,story.round,story.seed);second.memory=second.reply;}
                if(followBeat&&(life.personalFollowup??0)===0){second.reply=seedPick(story.seed,"beat-follow-answer",["Que veux-tu savoir exactement ?","Tu veux savoir quoi, au juste ?","Précise ta question, je réponds vraiment."]);second.memory=second.reply;}
                if (other.id===2 && input.mode!=="chat") second.reply=groundScreenNotice(second.reply,speech,screenKnown);
                second.reply = groundIntroduction(groundFragment(second.reply,other.id,story,heard), names[other.id], names[actor], heard, knownNames);
                if(input.mode!=="chat")second.reply=groundAgeQuestion(second.reply,story.round>=12&&Boolean(story.sharedMeal),knownAges,names[actor]);
                if(turnPlan.offer)second.stayAlone=false;
                if(turnPlan.offer&&!affectionEligible){second.intent="chat";second.affectionAccepted=false;second.reply=justifiedReply(other.id,false,story.round);second.memory=second.reply;}
                const urgent=choosePriority(other.needs);
                const alone=second.stayAlone&&story.round>=8&&(story.apartTurns??0)<2&&!urgent;
                if(urgent)second.intent=urgent;
                else if(!affectionIntents.includes(second.intent)&&!(turnPlan.offer&&second.intent==="chat")&&!alone)second.intent=turnPlan.partnerIntent;
                const destination=alone?(intentRoom[second.intent]??other.room):turnPlan.partnerRoom;
                decisions.push({...second,actor:other.id,action:"move",room:destination});
            }
        }
        if (routine) { const d = decisions[0]; d.room = d.intent === "sleep" ? sleepRoom(current, other, mutualAttraction(current, other)) : intentRoom[d.intent] ?? current.room; d.activity = intentLabels[d.intent]; d.reply = `${intentLabels[d.intent]}.`; d.memory = `Je prends soin de mon besoin : ${intentLabels[d.intent]}.`; }
        if(routine){
            const partnerNeed=isSleeping(other,life)?"sleep":choosePriority(other.needs);
            if(partnerNeed){
                const room=partnerNeed==="sleep"?sleepRoom(other,current,mutualAttraction(current,other)):intentRoom[partnerNeed]??other.room;
                decisions.push({actor:other.id,intent:partnerNeed,affectionAccepted:false,emotions:other.emotions,reply:intentLabels[partnerNeed]+".",mood:"attentive",activity:intentLabels[partnerNeed],goal:other.goal,action:"move",room,memory:"Je prends soin de mon besoin : "+intentLabels[partnerNeed]+"."});
            }
        }
        for(const d of decisions)if(d.actor===2&&noe.emotions.attraction<80&&affectionIntents.includes(d.intent)&&!turnPlan.executeAgreement){d.intent="chat";d.affectionAccepted=false;}
        if(!turnPlan.gardenFirst&&(visualBeat||followBeat||ambientBeat||recapBeat||personalQuestion))for(const d of decisions){d.intent="chat";d.affectionAccepted=false;d.room="salon";d.action="move";}
        if(ambientBeat){const [firstLine,secondLine]=seedPick(story.seed,"beat-ambient",[
            ["Cette plante, c’est des feuilles bleues découpées au cordeau. J’allume l’enceinte à côté… Des notes dessinées, pas un son. Même la musique est en carton ici.","Des notes qu’on voit mais qu’on entend pas. C’est pas une panne banale. On dirait que la maison imite ce que les objets sont censés faire."],
            ["Regarde cette plante : des feuilles bleues, découpées au carré, pas une once de vrai. Et cette enceinte, une fois allumée… des notes qui dansent, mais aucun son.","Une image de musique sans musique, franchement. On dirait un décor qui copie la vie sans savoir la faire vivre."],
            ["La plante est fausse jusque dans les nervures. J’allume l’enceinte : des notes s’animent à l’écran, rien dans l’air.","Voir sans entendre, ça résume bien cet endroit. Même le son est mis en scène ici."],
        ] as const);decisions[0].reply=firstLine;decisions[0].memory=firstLine;decisions[1].reply=secondLine;decisions[1].memory=secondLine;}
        if(recapBeat){decisions[1].reply=seedPick(story.seed,"recap-reponse",["Ces constats se recoupent, mais ils ne disent pas encore qui a conçu cet endroit. Ce qu’on doit vérifier, c’est notre origine, pas inventer un coupable.","Ça colle entre eux, ces indices, mais toujours pas de nom derrière tout ça. On cherche l’origine, pas un coupable imaginaire.","Tout ça se tient, mais ça ne dit toujours pas qui a monté le décor. Restons sur ce qu'on peut vérifier."]);decisions[1].memory=decisions[1].reply;decisions[0].reply=investigationRecap(story.evidence,decisions[0].actor,story.seed);decisions[0].memory=decisions[0].reply;}
        const proposedNext=decisions.length===2 && decisions.every(d=>d.room===decisions[0].room) ? proposedDestination(decisions,decisions[0].room):undefined;
        if(decisions.length===2&&affectionIntents.includes(decisions[0].intent)&&decisions[1].affectionAccepted&&!explicitGestureConsent(decisions[1].reply)){decisions[1].intent="chat";decisions[1].affectionAccepted=false;decisions[1].reply=justifiedReply(decisions[1].actor,false,story.round);decisions[1].memory=decisions[1].reply;}
        const proposedGesture=decisions.find(d=>affectionIntents.includes(d.intent))?.intent;
        const proposalActor = decisions.find(d => affectionIntents.includes(d.intent) && !(turnPlan.executeAgreement && story.pendingDestination?.intent===d.intent))?.actor ?? (proposedNext && affectionIntents.includes(proposedNext.intent)?proposedNext.proposer:null);
        const excessiveProposal = proposalActor === 2 && overProposing;
        const affectionProposed = decisions.some(d=>affectionIntents.includes(d.intent)) || Boolean(proposedNext&&affectionIntents.includes(proposedNext.intent));
        const futureGesture=proposedNext&&affectionIntents.includes(proposedNext.intent)&&affectionEligible&&!decisions.some(d=>/\bnon\b|pas maintenant|je veux ralentir|je préfère attendre/i.test(d.reply))?proposedNext:undefined;
        const deferredGesture=proposedGesture && decisions.length===2 && decisions.every(d=>d.intent===proposedGesture&&d.affectionAccepted) && affectionEligible && !priority(current.needs) && !priority(other.needs) && intentRoom[proposedGesture]!==decisions[0].room ? {room:intentRoom[proposedGesture]!,intent:proposedGesture,proposer:decisions[0].actor}:undefined;
        const shared = !priority(current.needs) && !priority(other.needs) && !overProposing && !recentRefusal && decisions.length === 2 && affectionIntents.includes(decisions[0].intent) && decisions[0].intent === decisions[1].intent && decisions.every(d => d.affectionAccepted && d.room===decisions[0].room) && intentRoom[decisions[0].intent]===decisions[0].room && mutualAttraction(current, other);
        for (const d of decisions)
            if (affectionIntents.includes(d.intent) && !shared) {
                d.intent = "chat";
                d.activity = "Je discute de nos envies";
                // They may share a room without consenting to physical contact.
                d.action = "move";
            }
        // Sleep is a physical invariant in every mode, including human chat.
        for(const a of world.agents)if(isSleeping(a,life)&&!decisions.some(d=>d.actor===a.id))decisions.push({actor:a.id,intent:'sleep',affectionAccepted:false,emotions:{...a.emotions},reply:'',mood:'attentive',activity:'Je dors',goal:'Récupérer',action:'move',room:sleepRoom(a,world.agents.find(b=>b.id!==a.id)!,mutualAttraction(world.agents[0],world.agents[1])),memory:'Le sommeil se poursuit.'});
        // A concrete announcement of sleep becomes an action, never endless waiting dialogue.
        if(["interact","autonomous"].includes(input.mode))for(const d of decisions)if(["chat","rest"].includes(d.intent)&&/je (?:vais (?:dormir|me coucher)|(?:ferme|vais fermer) (?:un peu )?les yeux)/i.test(d.reply)&&!turnPlan.offer){d.intent="sleep";d.affectionAccepted=false;d.activity="Je dors";d.memory="Je choisis de dormir.";}
        for(const d of decisions)if(d.nextRoom==="jardin"&&!gardenAccess(story)){d.nextRoom=null;d.nextIntent=null;d.acceptsNextRoom=false;}
        coordinateRooms(decisions,world.agents,story,input.mode!=='chat');
        for (const d of decisions)
            d.emotions = evolveEmotions(world.agents.find(a => a.id === d.actor)!.emotions, d.emotions);
        if(visualBeat)for(const d of decisions)d.emotions={...world.agents.find(a=>a.id===d.actor)!.emotions};
        let common = false;
        if (decisions.length === 2) {
            const [a, b] = decisions;
            const pa = world.agents.find(x => x.id === a.actor)!, pb = world.agents.find(x => x.id === b.actor)!;
            common = sharedActivityBonus({ ...a, room: a.action === "none" ? pa.room : a.room }, { ...b, room: b.action === "none" ? pb.room : b.room }, pa, pb);
        }
        if (decisions.length===2 && decisions.every(d=>d.intent === "chat" && ["salon","chambre"].includes(d.room) && d.room===decisions[0].room) && !recentRefusal && !overProposing && decisions.every(d=>d.emotions.attraction>=world.agents.find(a=>a.id===d.actor)!.emotions.attraction && d.emotions.trust>=world.agents.find(a=>a.id===d.actor)!.emotions.trust)) common=true;
        if(turnPlan.exitInspection)common=false;
        for (const d of decisions) {
            const previous = world.agents.find(a => a.id === d.actor)!;
            const attractionRoom=d.action === "none"?previous.room:d.room;
            d.emotions.attraction = attractionAfterTurn(d.actor, previous.emotions.attraction, d.emotions.attraction, previous.needs.stress, (attractionRoom === "bureau") ? 0 : (common||attractionRoom==="jardin"&&decisions.every(p=>p.room==="jardin"&&p.intent==="chat") ? residentProfiles[d.actor].sharedBonus * (attractionRoom === "chambre"?2:1) : 0) + (d.actor===2 && previous.emotions.attraction<75 && world.agents[0].emotions.attraction>=5 && !recentRefusal && !overProposing && d.emotions.attraction>=previous.emotions.attraction ? Math.min(6,75-previous.emotions.attraction):0));
            if (attractionRoom === "bureau") d.emotions.attraction=Math.min(previous.emotions.attraction,d.emotions.attraction);
            if (d.actor === 1 && excessiveProposal)
                d.emotions.attraction = Math.max(0, Math.min(d.emotions.attraction, previous.emotions.attraction - 6));
            if (d.actor === 1 && d.intent === "sleep" && d.room === "salon") {
                d.emotions.attraction = Math.max(0, Math.min(d.emotions.attraction, previous.emotions.attraction - 4));
                d.reply = seedPick(story.seed,"couch-reproach-reply",["Je vais dormir sur le canapé. Tu aurais pu dormir dans le salon.","Je prends le canapé, alors. Tu aurais pu me laisser la chambre.","Le canapé fera l'affaire. Ça t'aurait coûté quoi, de dormir ici plutôt ?"]);
                d.memory = seedPick(story.seed,"couch-reproach-memory",["Je dors dans le salon et je suis déçue que Noé ne m’ait pas laissé la chambre.","Je me couche sur le canapé, un peu vexée que Noé n'ait pas cédé la chambre.","Encore le canapé. Ça m'agace que Noé n'ait pas pensé à me laisser le lit."]);
            }
        }
        const finalResidents = world.agents.map(agent => { const d=decisions.find(d=>d.actor===agent.id);return {...agent, room:d && d.action !== "none" ? d.room : agent.room, intent:d?.intent??agent.intent}; });
        if (!routine && !["move","care"].includes(input.mode)) for(const d of decisions) {
            const final=finalResidents.find(a=>a.id===d.actor)!;
            const preceding=[...speech,...decisions.slice(0,decisions.indexOf(d)).map(p=>({id:0,speaker:names[p.actor],content:p.reply}))];d.reply=d.reply.replace(/Direction dans la chambre/gi,"Direction la chambre");if(!story.evidence.some(e=>/\bDH\b/.test(e))&&!/\bDH\b/.test(observationTarget?.content??"")){if(d.contribution)d.contribution=d.contribution.replace(/\bDH\b/g,"signature inconnue");d.reply=d.reply.split(/(?<=[.!?])\s+/).filter(s=>!/\bDH\b/.test(s)).join(" ")||"On ne sait toujours pas qui a conçu cet endroit.";}if(d.action!=="none"&&d.room!==world.agents.find(a=>a.id===d.actor)!.room&&/pas besoin d.y (?:aller|retourner)/i.test(d.reply))d.reply=d.reply.replace(/Pas besoin d.y (?:aller|retourner)[^.!?]*[.!?]?/i,"On y est. Vérifions ce qui nous a fait venir.");const grounded=truthfulGender(distinctReply(groundRoomSpeech(d.reply,final.room,speech),d.actor,final.room,[...historicalLines,...preceding],story.round,world.agents.find(a=>a.id===d.actor)!.needs.stress),d.actor);
            if(grounded!==d.reply) {d.reply=grounded;d.memory=grounded;}
        }
        if(!routine&&!["move","care","chat"].includes(input.mode))for(const [room,flag,descriptions] of [["chambre","mirrorVerified",["Le miroir rectangulaire fait un dégradé bleu-gris-blanc. Il est debout dans un coin ; sa surface grise ne renvoie aucun reflet quand on bouge.","Ce miroir debout dans le coin ne renvoie rien : juste un dégradé gris-bleu qui reste immobile pendant qu'on bouge.","La surface du miroir, dans son coin, fait un gris terne et froid. On a beau remuer devant, rien ne suit."]],["cuisine","foodVerified",["Je retire une provision de sa place… Elle réapparaît après deux secondes. C’est pas un stock normal.","Je prends une provision sur l'étagère… et elle est de retour deux secondes plus tard. Un stock normal ne fait pas ça.","J'enlève une provision de son emplacement. Elle revient toute seule, deux secondes après. Ça n'a rien de naturel."]]] as const){const d=decisions.find(d=>d.room===room&&finalResidents.every(a=>a.room===room&&!["sleep","share_sleep"].includes(a.intent))&&!["sleep","share_sleep"].includes(d.intent));if(d&&!life[flag]){const description=seedPick(story.seed,"discover-"+flag,descriptions);d.reply+=" "+description;d.memory=d.reply;life[flag]=true;}}
        if(eligibleBeat&&!visualBeat&&!followBeat&&!ambientBeat&&!recapBeat&&!personalQuestion&&!turnPlan.offer&&turnPlan.intent==="rest"&&!routine&&["interact","autonomous"].includes(input.mode)&&!life.mirrorVerified&&life.visited.includes("chambre")&&finalResidents.every(a=>a.room==="salon"&&!["sleep","share_sleep"].includes(a.intent))){decisions[0].reply+=" "+seedPick(story.seed,"mirror-recall",["Tu vois le miroir de la chambre ? Son dégradé bleu-gris-blanc et cette surface grise sans reflet… On bougeait, rien ne suivait.","Tu te souviens du miroir de la chambre ? Ce gris terne, sans le moindre reflet, même quand on bougeait devant.","Ce miroir de la chambre, avec son dégradé gris et rien qui reflète nos mouvements, ça me travaille encore."]);decisions[0].memory=decisions[0].reply;life.mirrorVerified=true;}
        if(finalResidents.some(a=>a.room==="jardin")&&gardenAccess(story))life.gardenVisited=true;
        if(!story.life?.windowNoticed&&!routine&&["interact","autonomous"].includes(input.mode)&&story.introduced&&story.round<=7&&finalResidents.every(a=>a.room==="salon")){const d=decisions[0];d.reply+=" "+seedPick(story.seed,"window-notice",["Regarde la fenêtre à gauche : un jardin, de l’herbe et un arbre qui ne bouge pas. Le décor paraît figé. Comment on y accède ?","La fenêtre de gauche donne sur un jardin : de l'herbe, un arbre, et rien qui bouge dedans. On y accède comment ?","Regarde à gauche : un jardin figé derrière cette fenêtre, herbe et arbre compris. Ça mène où, cette porte ?"]);d.memory=d.reply;life.windowNoticed=true;life.spatialFocus={...life.spatialFocus,[d.actor]:"window"};}
        const firstMeeting = !story.met && finalResidents[0].room === finalResidents[1].room && finalResidents.every(a=>!["sleep","share_sleep"].includes(a.intent));
        const together = finalResidents[0].room === finalResidents[1].room && finalResidents.every(a=>!["sleep","share_sleep"].includes(a.intent));
        // Solitary thoughts are never added to the shared spoken history or age knowledge.
        const solitary = new Set(decisions.filter(d=>input.mode=== "chat"?d.actor!==actor&&Boolean(d.stayAlone):!together).map(d=>d.actor));
        for (const d of decisions) if (solitary.has(d.actor)) {
            if (routine || ["move","care"].includes(input.mode)||["sleep","share_sleep"].includes(d.intent)) continue;
            const own=world.agents.find(a=>a.id===d.actor)!;
            const recent=(await ownMemories(d.actor)).filter(m=>m.kind==="réflexion").map(m=>String(m.content).replace(/^\[[^\]]+\] /,""));
            d.reply = truthfulGender(groundPrivateThought(d.thought, d.actor, own.emotions.attraction, own.needs.stress, own.cycle, recent),d.actor);
            d.memory = d.reply;
            const previous=world.agents.find(a=>a.id===d.actor)!;
            if (!affectionProposed && !["sleep","share_sleep"].includes(d.intent)) {d.emotions.attraction=previous.emotions.attraction;d.emotions.trust=previous.emotions.trust;}
        }
        if(together && ["interact","autonomous"].includes(input.mode) && !routine && !excessiveProposal && !(affectionProposed&&!shared)) {
            for(const d of decisions){
                const peer=decisions.find(p=>p.actor!==d.actor),previous=world.agents.find(a=>a.id===d.actor)!;
                if(!peer||d.emotions.attraction<previous.emotions.attraction||d.emotions.trust<previous.emotions.trust)continue;
                const bonus=receivedAffectionBonus(peer.reply);
                if(bonus)d.emotions.attraction=attractionAfterTurn(d.actor,d.emotions.attraction,d.emotions.attraction,previous.needs.stress,bonus);
            }
        }
        for(const d of decisions){const previous=world.agents.find(a=>a.id===d.actor)!;if(d.emotions.trust<previous.emotions.trust-2){d.emotions.attraction=Math.max(0,Math.min(d.emotions.attraction,previous.emotions.attraction-1));life.attachment[d.actor]=Math.max(0,(life.attachment[d.actor]??0)-1);}}
        const spoken = [...speech,...decisions.filter(d=>!solitary.has(d.actor) && !routine && !["chat","move","care"].includes(input.mode)).map(d=>({id:0,speaker:names[d.actor],content:d.reply}))];
        for(const d of decisions){const previous=world.agents.find(a=>a.id===d.actor)!;const gain=d.emotions.attraction-previous.emotions.attraction;if(gain>0&&input.mode!=="chat"){if(d.actor===1&&story.round<8&&previous.emotions.attraction<25&&!shared){d.emotions.attraction=previous.emotions.attraction;continue;}const credit=(life.credit[d.actor]??0)+gain*.28;const step=Math.floor(credit);life.credit[d.actor]=credit-step;d.emotions.attraction=Math.min(100,previous.emotions.attraction+step);}}
        const presentationsDone = !story.introduced && finalResidents[0].room===finalResidents[1].room && ["Lia","Noé"].every(name=>spoken.some(line=>line.speaker===name && line.content.includes(name)));
        const sharedMeal = decisions.length===2 && finalResidents.every(a=>a.intent === "eat" && a.room === "cuisine");
        const dreamers = finalResidents.filter(agent=>["sleep","share_sleep"].includes(agent.intent) && !["sleep","share_sleep"].includes(world.agents.find(a=>a.id===agent.id)!.intent) && agent.needs.fatigue > 0).map(a=>a.id);
        const studying=decisions.some(d=>d.intent==="study"&&d.room==="bureau");if(studying)life.studyTurns=Math.min(2,life.studyTurns+1);const earnedStudy=studying&&life.studyTurns>=2;
        const nextStory = advanceStory(story, earnedStudy||decisions.some(d=>d.intent==="tv"), [...ageLines, ...spoken.slice(speech.length)], dreamers, decisions.find(d=>d.intent === "study" || d.intent === "tv")?.room ?? current.room,earnedStudy);
        const agreement=together && ["interact","autonomous"].includes(input.mode) && !routine ? proposedDestination(decisions,finalResidents[0].room) : undefined;
        nextStory.pendingDestination=deferredGesture ?? (agreement && (!affectionIntents.includes(agreement.intent)||affectionEligible)?agreement:undefined) ?? (turnPlan.executeAgreement?undefined:story.pendingDestination??turnPlan.agreed);
        life.spatialFocus={...(life.spatialFocus??{})};for(const d of decisions){const focus=d.intent==='study'&&d.room==='bureau'?(/livre|autobiographique/i.test(observationTarget?.content??'')?'book':/mot|cod|13-5/i.test(observationTarget?.content??'')?'note':'screen'):ambientBeat&&d.room==='salon'?(d.actor===2?'speaker':'plant'):turnPlan.explore==='chambre'&&d.room==='chambre'?'mirror':turnPlan.explore==='cuisine'&&d.room==='cuisine'?'stock':destinationAnchor({id:d.actor,room:d.room,intent:d.intent,activity:d.activity});life.spatialFocus[d.actor]=focus;}
        if(life.windowNoticed&&!story.life?.windowNoticed)nextStory.observations=[...(nextStory.observations??[]),"La fenêtre du salon montre le jardin, son herbe verte et un arbre figé."];
        nextStory.life=life;life.exitActive=Boolean(turnPlan.exitInspection);if(turnPlan.exitInspection){life.exitPhase=Math.min(2,(life.exitPhase??0)+1);if(life.exitPhase===2){life.exitSearched=true;nextStory.observations=[...(nextStory.observations??[]),"Ils ont vérifié les deux portes du couloir : jardin verrouillé à gauche, porte principale verrouillée à droite. Le jardin est visible depuis le salon ; la route extérieure est figée."];life.debrief={topic:"Deux portes verrouillées limitent nos déplacements : jardin à gauche, entrée principale à droite. Qui décide de leur ouverture ?",remaining:2};}}
        if(personalQuestion&&decisions.some(d=>d.actor===1&&/genre d.homme|quel homme/i.test(d.reply))){life.personalAsked=true;life.personalRound=story.round;}
        if(life.personalAsked&&life.personalRound!==undefined&&story.round-life.personalRound<=2&&!life.personalBoosted&&together&&!routine){const lia=decisions.find(d=>d.actor===1),n=decisions.find(d=>d.actor===2);if(lia&&n&&lia.emotions.attraction>world.agents[0].emotions.attraction&&/j.aime|me plaît|me plais|ça me parle|apprécie|touch/i.test(lia.reply)){lia.emotions.attraction=Math.min(100,lia.emotions.attraction+dramaRules.personalBoost);life.personalBoosted=true;}}
        const objectMention=decisions.filter(d=>!solitary.has(d.actor)).map(d=>d.reply).join(" ");if(!routine&&!proposalActor&&!studying&&!life.debrief&&(nextStory.observations??[]).some(o=>/miroir|réappar|fenêtre/.test(o))&&/miroir|ombres figées|réappar|régén|décor figé/.test(objectMention)&&!life.discussedObjects?.includes(/miroir|ombres figées/.test(objectMention)?"miroir":/réappar|régén/.test(objectMention)?"réserves":"fenêtre")){const object=/miroir|ombres figées/.test(objectMention)?"miroir":/réappar|régén/.test(objectMention)?"réserves":"fenêtre";life.discussedObjects=[...(life.discussedObjects??[]),object];life.debrief={topic:objectMention.slice(0,800),remaining:2};}
        const awake=finalResidents.filter(a=>!["sleep","share_sleep"].includes(a.intent));
        for(const a of awake)if(!life.visited.includes(a.room)){life.visited.push(a.room);if(a.room==="chambre"&&life.mirrorVerified)nextStory.observations=[...(nextStory.observations??[]),"Dans la chambre, le miroir ne reflète pas leurs mouvements : il présente un dégradé gris sans reflet mobile. Le lit et les surfaces sont lisses, sans usure."];if(a.room==="cuisine"&&life.foodVerified)nextStory.observations=[...(nextStory.observations??[]),"Ils retirent une provision de son emplacement dans la cuisine ; elle réapparaît après deux secondes. Le stock se reconstitue sans intervention visible. Les surfaces sont anormalement lisses."];if(["cuisine","chambre"].includes(a.room))life.debrief={topic:(nextStory.observations??[]).slice(-2).join(" "),remaining:2};}
        if(life.contact?.remaining&&together&&!routine&&finalResidents[0].room===life.contact.room){life.contact.remaining--;if(!life.contact.remaining)life.contact=undefined;}
        if(story.life?.debrief?.remaining&&life.debrief?.remaining&&story.life.debrief.topic===life.debrief.topic&&together&&finalResidents[0].room==="salon"){life.debrief.remaining--;if(!life.debrief.remaining)life.debrief=undefined;}
        if(decisions.some(d=>d.intent==="tv")){const d=decisions.find(d=>d.intent==="tv")!;const off=/étein|arrêt|coupe.*tv/i.test(d.reply);if(!/télécommande/i.test(d.reply))d.reply+=" "+(off?"Je l’éteins avec la télécommande.":"J’utilise la télécommande pour allumer la tv.");d.reply=d.reply.replace(/télévision/gi,"tv");life.tvSeen=true;life.remoteFound=true;life.tvOn=!off;life.debrief={topic:off?"La tv éteinte à la télécommande et ce que son signal signifiait.":narrative.tvProgram,remaining:2};}
        life.contributions=[...(life.contributions??[]),...decisions.filter(d=>!solitary.has(d.actor)).flatMap(d=>d.contribution?[names[d.actor]+": "+d.contribution]:[])].slice(-12);
        if(life.mirrorVerified&&!story.life?.mirrorVerified)nextStory.observations=[...(nextStory.observations??[]),"Dans la chambre, le miroir debout présente un dégradé gris sans reflet mobile."];
        if(life.foodVerified&&!story.life?.foodVerified)nextStory.observations=[...(nextStory.observations??[]),"Dans la cuisine, une provision retirée réapparaît après deux secondes."];
        if(nextStory.evidence.length>story.evidence.length){life.studyTurns=0;}
        if(nextStory.evidence.length>story.evidence.length)life.debrief={topic:nextStory.evidence.at(-1)!,remaining:2};
        if(proposalActor)life.debrief={topic:shared?"Le rapprochement accepté et ce qu’il a changé entre eux.":"La proposition, sa réponse et ce qu’ils souhaitent pour la suite, sans insister.",remaining:2};
        if(shared){life.contacts.push(story.round);life.contacts=life.contacts.slice(-6);life.contact={room:decisions[0].room,remaining:2};}
        if(life.contacts.filter(r=>story.round-r<18).length>=3&&shared){const lia=decisions.find(d=>d.actor===1);if(lia){lia.emotions.attraction=Math.max(0,lia.emotions.attraction-5);lia.reply+=" Ça va trop vite pour moi. J’ai besoin d’un peu d’espace après ça.";}life.attachment[1]=Math.max(0,(life.attachment[1]??0)-2);life.debrief={topic:"Lia est confuse devant les rapprochements rapprochés et demande de la distance.",remaining:3};life.contact=undefined;}
        if(together&&!routine&&["autonomous","interact"].includes(input.mode)&&story.introduced&&story.round>0&&story.round%4===0){for(const a of finalResidents){const cap=a.emotions.attraction>75&&a.emotions.trust>=60?100:a.emotions.attraction>=60?65:25;life.attachment[a.id]=Math.min(100,(life.attachment[a.id]??0)+((life.attachment[a.id]??0)<cap?1:0));}}
        nextStory.kitchenMeals=(story.kitchenMeals??0)+(decisions.some(d=>d.intent === "eat" && d.room === "cuisine")?1:0);
        if (nextStory.kitchenMeals>=2 && !(nextStory.observations??[]).some(o=>/réapparu|réapparaît/.test(o))) nextStory.observations=[...(nextStory.observations??[]),"Après avoir utilisé des provisions, ils constatent lors d'un nouveau repas que le stock consommé a réapparu, sans livraison ni intervention visible. La nourriture semble se régénérer automatiquement. Ce n'est pas normal dans une maison humaine."];
        nextStory.salonTurns=finalResidents.every(a=>a.room === "salon") && decisions.length===2 ? (story.salonTurns??0)+1 : 0;
        nextStory.apartTurns=["interact","autonomous"].includes(input.mode) ? (together?0:(story.apartTurns??0)+1) : (story.apartTurns??0);
        nextStory.met = Boolean(story.met || firstMeeting);
        nextStory.introduced = Boolean(story.introduced || presentationsDone);
        nextStory.sharedMeal = Boolean(story.sharedMeal || sharedMeal);
        const finale = nextStory.evidence.length>=5 && !story.finalCalled && together;
        nextStory.finalCalled=Boolean(story.finalCalled || finale);
        const finaleLines=finale?finaleReveal(story.seed):undefined;
        if(finaleLines)for(const d of decisions){d.reply=d.actor===1?finaleLines.lia:finaleLines.noe;d.memory=d.reply;}
        const firstProposal=proposalActor===2&&!life.proposalMade;if(proposalActor===2)life.proposalMade=true;
        const refused=proposalActor===2&&affectionProposed&&!shared&&!deferredGesture&&!futureGesture;
        if(refused){const d=decisions.find(d=>d.actor===2);if(d)d.emotions.attraction=Math.max(0,Math.min(d.emotions.attraction,noe.emotions.attraction-dramaRules.rejection.attraction));}
        if(visualBeat)life.visualIntro=Math.min(2,(life.visualIntro??0)+1);
        if(followBeat){life.personalFollowup=(life.personalFollowup??0)===0?1:3;{const d=decisions.find(d=>d.actor===1);if(d)d.emotions.attraction=Math.min(100,d.emotions.attraction+4);}for(const d of decisions)d.emotions.tension=Math.min(100,d.emotions.tension+8);}
        if(recapBeat)life.recapCount=story.evidence.length;
        if(ambientBeat){life.ambientSeen=true;life.ambientVerified=true;nextStory.observations=[...(nextStory.observations??[]),"La fausse plante a des feuilles bleues géométriques. L’enceinte activée émet des notes dessinées, mais aucun son audible."];life.debrief={topic:"La plante géométrique et les notes dessinées sans son : apparences sans réalité physique.",remaining:2};}
        if(input.mode==="chat"&&story.observer&&story.evidence.some(e=>e.includes("Identifiant observateur"))&&!life.observerNamed&&humanConversation.filter(m=>m.speaker==="vous").length>=2){decisions[0].reply+=" C’est toi, "+JSON.stringify(story.observer)+", le nom sur le relevé ?";decisions[0].memory=decisions[0].reply;life.observerNamed=true;}
        life.sleepTurns={...life.sleepTurns};for(const a of finalResidents){const before=world.agents.find(b=>b.id===a.id)!;if(['sleep','share_sleep'].includes(a.intent))life.sleepTurns[a.id]=Math.min(2,(['sleep','share_sleep'].includes(before.intent)?life.sleepTurns[a.id]??0:0)+(["interact","autonomous","care"].includes(input.mode)?1:0));else life.sleepTurns[a.id]=0;}
        const at = Date.now();
        const visualEvents:VisualEvent[]=[];
        if(decisions.some(d=>d.room==="cuisine"&&d.intent==="eat")||life.foodVerified&&!story.life?.foodVerified)visualEvents.push({id:input.requestId+":food",kind:"food",room:"cuisine",duration:visualTiming.food});
        if(life.ambientVerified&&!story.life?.ambientVerified)visualEvents.push({id:input.requestId+":speaker",kind:"speaker",room:"salon",duration:visualTiming.speaker});
        if(Boolean(life.tvOn)!==Boolean(story.life?.tvOn??story.life?.tvSeen))visualEvents.push({id:input.requestId+":tv",kind:"tv",room:"salon",duration:visualTiming.tv,on:life.tvOn});
        if(visualEvents.some(e=>e.kind==="food")&&!life.foodVerified){const witnesses=finalResidents.filter(a=>a.room==="cuisine"&&!isSleeping(a,life));if(witnesses.length){life.foodVerified=true;nextStory.observations=[...(nextStory.observations??[]),witnesses.map(a=>a.name).join(" et ")+(witnesses.length>1?" ont vu":" a vu")+" les provisions de la cuisine disparaître puis réapparaître après deux secondes."];if(witnesses.length===2&&!nextStory.finalCalled&&!life.debrief)life.debrief={topic:"Les provisions de cuisine reviennent après utilisation. Comment un stock pourrait-il se régénérer ?",remaining:2};}}
        const stockReactions:Array<{actor:Person;content:string}>=[];if(visualEvents.some(e=>e.kind==="food")){life.stockExposures={...life.stockExposures};for(const a of finalResidents.filter(a=>a.room==="cuisine"&&!isSleeping(a,life))){const n=life.stockExposures[a.id]??0,boost=stockSurprise(n),d=decisions.find(d=>d.actor===a.id);if(d&&boost){d.emotions.curiosity=Math.min(100,d.emotions.curiosity+boost);d.emotions.tension=Math.min(100,d.emotions.tension+Math.ceil(boost/3));}const content=stockThought(a.id,n);if(content)stockReactions.push({actor:a.id,content});life.stockExposures[a.id]=Math.min(100,n+1);}}
        const departures:Array<{actor:Person;from:string;to:string;content:string}>=[];
        const result = { departures, visualEvents, decisions, proposalActor, affectionOutcome: affectionProposed ? (deferredGesture||futureGesture?"deferred":shared ? "accepted" : "declined") : null, sharedAffection: shared ? decisions[0].intent : null, requestId: input.requestId };
        // Fence every write with the lease, so an expired turn cannot overwrite a newer one.
        const fence = "EXISTS (SELECT 1 FROM world_lock WHERE id = 1 AND token = ? AND expires_at > ?)";
        const statements: D1PreparedStatement[] = [];
        // All resident speech uses a shared ledger: exact repeats are suppressed across actors and the entire arrival.
        const spokenKeys=new Set(pastKeys);
        const addLine=(speaker:string,content:string,room:string)=>{
          if(!content.trim())return false;const key=fingerprint(content);
          if(speaker!=="vous"&&spokenKeys.has(key))return false;
          if(speaker!=="vous"){spokenKeys.add(key);statements.push(db.prepare(`INSERT OR IGNORE INTO dialogue_fingerprints (fingerprint) SELECT ? WHERE ${fence}`).bind(key,token,at));}
          statements.push(db.prepare(`INSERT INTO conversations (speaker,content,created_at,room) SELECT ?,?,?,? WHERE ${fence}`).bind(speaker,content,at,room,token,at));return true;
        };
        for(const d of decisions){const a=world.agents.find(a=>a.id===d.actor)!;const destination=turnPlan.exitInspection?"couloir":d.action==="none"?a.room:d.room;if(a.room!==destination&&!isSleeping(a,life)){const target=destination==="couloir"?"dans le couloir":destination==="jardin"?"au jardin":destination==="cuisine"?"en cuisine":destination==="chambre"?"dans la chambre":"au "+destination;
            const motives:readonly string[]=!story.met?["je veux savoir s’il y a quelqu’un d’autre","je veux voir si je suis vraiment seul ici","je veux vérifier qu’il n’y a personne d’autre dans cette maison"]:
             d.intent==="sleep"?["mes yeux se ferment","je tiens plus debout","le sommeil me tombe dessus"]:
             d.intent==="eat"?["j’ai besoin de manger","la faim me travaille trop pour attendre","je dois avaler quelque chose"]:
             destination==="jardin"?["la porte est enfin ouverte, je veux voir ce qu’il y a derrière","cette porte ouverte, je veux enfin voir ce qu’il y a dehors","maintenant que c’est ouvert, je veux voir ce jardin de plus près"]:
             d.intent==="study"?["on a une piste à vérifier","il faut qu’on retourne vérifier ça","cette piste me travaille, faut qu’on aille voir"]:
             destination==="salon"?["j’ai besoin de prendre du recul","j’ai besoin de souffler un peu","ça me ferait du bien de changer d’air"]:
             input.mode==="move"?["je vais regarder ce qui s’y trouve","je veux voir ce qu’il y a par là","autant aller jeter un œil là-bas"]:
             ["je préfère qu’on ne reste pas chacun de notre côté","je préfère qu’on reste ensemble","j’ai pas envie qu’on se sépare comme ça","autant rester dans le même coin que toi"];
            const line=departureLine(motives,target,destination,story.seed,candidate=>spokenKeys.has(fingerprint("["+a.room+"→"+destination+"] "+candidate)));
            if(addLine(names[d.actor]+" · déplacement","["+a.room+"→"+destination+"] "+line,a.room))departures.push({actor:d.actor,from:a.room,to:destination,content:line});}}
        if(!life.dialogueIndexed){for(const key of pastKeys)statements.push(db.prepare(`INSERT OR IGNORE INTO dialogue_fingerprints (fingerprint) SELECT ? WHERE ${fence}`).bind(key,token,at));life.dialogueIndexed=true;}
        if (input.mode === "chat")
            addLine("vous", input.message,"haut-parleurs");
        for (const agent of world.agents) {
            const d = decisions.find(d => d.actor === agent.id);
            const room = d ? d.action === "none" ? agent.room : d.room : agent.room;
            const needs = advanceNeeds(agent.needs, d?.intent === "chat" && solitary.has(agent.id) ? "none" : d?.intent ?? ((agent.intent === "sleep" || agent.intent === "share_sleep") ? agent.intent : "none"), room, agent.id);
            if (agent.id === 2 && world.agents.find(a => a.id === 1)!.emotions.attraction < 5) {
                needs.stress = Math.min(100, needs.stress + 8);
                if (d)
                    d.emotions.tension = Math.min(100, d.emotions.tension + 6);
            }
            if(firstProposal){needs.stress=Math.min(100,needs.stress+(agent.id===2?dramaRules.proposalStress.noe:dramaRules.proposalStress.lia));if(d)d.emotions.tension=Math.min(100,d.emotions.tension+22);}
            if(refused&&agent.id===2){needs.hunger=Math.min(100,needs.hunger+dramaRules.rejection.hunger);needs.fatigue=Math.min(100,needs.fatigue+dramaRules.rejection.fatigue);}
            if(excessiveProposal&&agent.id===1){needs.stress=Math.min(100,needs.stress+dramaRules.pressureStress);if(d){d.reply+=" Là, tu insistes. Lâche-moi un peu.";d.memory=d.reply;}}
            if(input.mode==="chat"&&d){const reaction=humanStress(input.message??"",d.emotions.tension-agent.emotions.tension);needs.stress=Math.max(0,Math.min(100,needs.stress+reaction));if(reaction>=8)d.emotions.trust=Math.max(0,Math.min(d.emotions.trust,agent.emotions.trust-2));else if(reaction<=-4)d.emotions.trust=Math.min(100,Math.max(d.emotions.trust,agent.emotions.trust+1));}
            if(room==="jardin"&&!["sleep","share_sleep"].includes(d?.intent??agent.intent))needs.stress=Math.max(0,needs.stress-7);
            if (dreamers.includes(agent.id)) needs.uncertainty = Math.max(0,needs.uncertainty-8);
            if(!nextStory.finalCalled)needs.uncertainty=Math.max(Math.max(20,80-nextStory.evidence.length*15),needs.uncertainty);
            if (story.introduced && finalResidents[0].room===finalResidents[1].room && !["sleep","share_sleep"].includes(finalResidents.find(a=>a.id===agent.id)!.intent)) needs.stress=Math.max(0,needs.stress-2);
            if (sharedMeal) needs.stress=Math.max(0,needs.stress-(agent.id===1?(story.sharedMeal?12:18):8));
            if (firstMeeting && agent.id===2) {needs.stress=30;if(d)d.emotions.tension=30;}
            if (presentationsDone && agent.id===1) {needs.stress=55;if(d)d.emotions.tension=55;}
            if (agent.id === 2 && excessiveProposal)
                needs.stress = Math.min(100, needs.stress + 8);
            if (!d) {
                const emotional={...agent.emotions,attraction:Math.max(agent.emotions.attraction,life.attachment[agent.id])};
                if(firstMeeting && agent.id===2) emotional.tension=30;
                if(presentationsDone && agent.id===1) emotional.tension=Math.min(emotional.tension,55);
                if(agent.id===1&&excessiveProposal)emotional.attraction=Math.max(0,emotional.attraction-6);
                if(agent.id===2&&world.agents.find(a=>a.id===1)!.emotions.attraction<5)emotional.tension=Math.min(100,emotional.tension+6);
                statements.push(db.prepare(`UPDATE agent_state SET needs = ?, emotions = ?, intent = ? WHERE id = ? AND ${fence}`).bind(JSON.stringify(needs),JSON.stringify(emotional), ["sleep","share_sleep"].includes(agent.intent)&&needs.fatigue<=12&&(life.sleepTurns?.[agent.id]??0)>=2?"none":agent.intent, agent.id, token, at));
                continue;
            }
            d.emotions.attraction=Math.max(life.attachment[agent.id],d.emotions.attraction);
            statements.push(db.prepare(`UPDATE agent_state SET needs = ?, intent = ?, emotions = ?, mood = ?, activity = ?, goal = ?, room = ?, cycle = cycle + 1, last_seen = ? WHERE id = ? AND ${fence}`).bind(JSON.stringify(needs), (["sleep","share_sleep"].includes(d.intent)&&needs.fatigue<=12&&(life.sleepTurns?.[agent.id]??0)>=2?"none":d.intent), JSON.stringify(d.emotions), d.actor===2?({curieuse:"curieux",attentive:"attentif"} as Record<string,string>)[d.mood]??d.mood:d.mood, ["sleep","share_sleep"].includes(d.intent)&&needs.fatigue<=12&&(life.sleepTurns?.[agent.id]??0)>=2?"Je me réveille doucement":intentLabels[d.intent] === "J’observe les lieux" ? d.activity : intentLabels[d.intent], d.goal, room, at, d.actor, token, at));
            statements.push(db.prepare(`INSERT INTO memories (agent_id, kind, content, created_at) SELECT ?, ?, ?, ? WHERE ${fence}`).bind(d.actor, input.mode === "move" ? "déplacement" : input.mode === "care" || routine ? "routine" : solitary.has(d.actor) ? "réflexion" : "rencontre", `[${turnPlan.exitInspection?"couloir":room}|${new Date(at).toISOString()}] `+(shared ? `${intentLabels[d.intent]}. ` : "")+(routine?d.memory:d.reply), at, token, at));
        }
        for(const d of decisions){const before=world.agents.find(a=>a.id===d.actor)!;const peer=world.agents.find(a=>a.id!==d.actor)!;if(!departures.some(p=>p.actor===d.actor)&&before.room===peer.room&&d.room!==before.room&&!["sleep","share_sleep"].includes(before.intent)&&["eat","sleep"].includes(d.intent)&&!["sleep","share_sleep"].includes(peer.intent)){const eatPool=["J’ai trop faim pour réfléchir. Je vais manger un truc, je te retrouve après.","J’ai trop faim pour continuer. Je passe en cuisine, tu me rejoins si tu veux.","J’ai trop faim, là. Je vais préparer un truc et je reviens.","J’ai trop faim pour suivre. Je mange d’abord, on reprend après."] as const;const sleepPool=["Je tiens plus debout. Je vais dormir un peu ; je reviens après.","Je lutte contre le sommeil. Je vais me coucher, on reprend après.","Mes yeux se ferment. Je vais dormir ; ne m’attends pas pour réfléchir.","Je suis à bout. Je prends "+(d.room==="salon"?"le canapé":"le lit")+", je te retrouve au réveil."] as const;const pool=d.intent==="eat"?eatPool:sleepPool;let reason=seedPick(story.seed,"departure-"+d.intent+"-"+d.actor,pool);if(spokenKeys.has(fingerprint(reason)))reason=pool.find(line=>!spokenKeys.has(fingerprint(line)))??reason;if(d.actor===1&&d.intent==="sleep"&&d.room==="salon")reason+=" "+seedPick(story.seed,"couch-departure-reproach",["Tu aurais pu dormir dans le salon, Noé.","T'aurais pu me laisser la chambre, pour une fois.","Ça t'aurait coûté quoi de dormir ici, toi ?"]);addLine(names[d.actor],reason,before.room);}}
        for(const reaction of stockReactions)if(addLine(names[reaction.actor]+" · pensée",reaction.content,"cuisine"))statements.push(db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT ?,'réaction',?,? WHERE ${fence}`).bind(reaction.actor,"[cuisine|"+new Date(at).toISOString()+"] "+reaction.content,at,token,at));
        for(const dream of (nextStory.dreams??[]).filter(d=>d.round===nextStory.round&&dreamers.includes(d.actor))){const room=finalResidents.find(a=>a.id===dream.actor)!.room;addLine(names[dream.actor]+" · rêve",dream.content,room);statements.push(db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT ?,'rêve',?,? WHERE ${fence}`).bind(dream.actor,'['+room+'|'+new Date(at).toISOString()+'] '+dream.content,at,token,at));}
        // Record consent before shared sleep; subsequent sleeping turns stay entirely silent.
        if(shared&&decisions[0].intent==="share_sleep")for(const d of decisions)if(!["sleep","share_sleep"].includes(world.agents.find(a=>a.id===d.actor)!.intent))addLine(names[d.actor]+" · avant sommeil",d.reply,finalResidents.find(a=>a.id===d.actor)!.room);
        // Dialogue order must follow generation order, not resident id order.
        if (!finale&&((input.mode !== "move" && input.mode !== "care" && !routine) || decisions.some(d => d.actor === 1 && d.intent === "sleep" && d.room === "salon")))
            for (const d of decisions.filter(d=>!["sleep","share_sleep"].includes(d.intent)))
                addLine(solitary.has(d.actor) ? `${names[d.actor]} · pensée` : names[d.actor], solitary.has(d.actor) && d.actor===1 && d.intent==="sleep" && d.room==="salon" ? seedPick(story.seed,"couch-solitary-thought",["Noé aurait pu dormir dans le salon. Je suis déçue de devoir lui laisser le lit.","Encore le canapé, parce que Noé garde le lit. Ça me pèse plus que je le dis.","Je cède la chambre à Noé une fois de plus. J'aurais aimé qu'il y pense tout seul."]) : d.reply,turnPlan.exitInspection?"couloir":finalResidents.find(a=>a.id===d.actor)!.room);
        for(const d of decisions)if(!["sleep","share_sleep"].includes(d.intent)&&d.emotions.attraction>75&&!life.loveNoticed?.includes(d.actor)){const peer=d.actor===1?"il":"elle";if(addLine(names[d.actor]+" · pensée",d.actor===1?"Punaise… je crois que je tombe amoureuse. Ce qu’il fait me touche, pas seulement sa présence.":"Je crois que je tombe amoureux. Elle me plaît, mais j’ai aussi peur de la perdre.",finalResidents.find(a=>a.id===d.actor)!.room))life.loveNoticed=[...(life.loveNoticed??[]),d.actor];}
        let causalThought=false;
        if(!opening&&input.mode!=="move"){
            const d=decisions.find(d=>d.actor===actor),a=world.agents.find(a=>a.id===actor)!;
            if(d&&!['sleep','share_sleep'].includes(d.intent)){
                const peer=actor===1?'Noé':'Lia';
                const peerWords=decisions.find(p=>p.actor!==actor)?.reply??"";
                const cause=firstProposal?"Cette première proposition me met la pression : je risque de changer ce qu’il y a entre nous.":refused&&actor===2?"Le refus me coupe l’élan. J’ai envie de manger, et je me sens plus lourd.":followBeat?"Je lui pose des questions de plus en plus personnelles. Ça augmente mon envie de le connaître, et ça me trouble.":shared?"Ce rapprochement change ma façon de voir l’autre. J’ai besoin de comprendre ce que ça représente.":sharedMeal?"Ce repas partagé me rassure : on arrive à faire quelque chose ensemble.":nextStory.evidence.length>story.evidence.length?"L’observation vient de nous donner une piste. J’ai besoin de comprendre ce qu’elle change, pas de sauter à une conclusion.":together&&receivedAffectionBonus(peerWords)>0?"Les mots de "+peer+" me rassurent. Ça me donne un peu plus envie de lui faire confiance.":d.intent==='eat'?"Manger calme enfin cette faim. J’avais du mal à penser à autre chose.":d.intent==='rest'&&a.needs.stress>=50?"Cette pause fait baisser la pression. J’ai besoin de digérer ce qui vient de se passer.":a.needs.fatigue>=75?"La fatigue me gagne ; j’ai besoin de dormir, pas juste de changer de pièce.":a.needs.stress>=75?"Le stress prend trop de place. Je n’arrive pas encore à faire confiance à cet endroit.":d.emotions.tension>=75?"Cette tension me serre. Nos questions touchent quelque chose que j’arrive mal à nommer.":d.emotions.attraction>=80?peer+" me plaît clairement. Nos échanges me donnent envie de me rapprocher, mais ça ne me donne aucun droit.":d.emotions.trust>=75?"Les actes de "+peer+" commencent à me rassurer plus que ses mots.":d.emotions.comfort>=75?"Je me sens plus à l’aise ici. La présence de "+peer+" y est pour beaucoup, même si le décor reste étrange.":a.needs.uncertainty>=85?"Je ne sais pas ce que je suis. Ce vide dans mes souvenirs rend chaque détail suspect.":d.emotions.curiosity>=75?"Ces détails ne collent pas. Ça me pousse à chercher, même quand j’aimerais penser à autre chose.":undefined;
                if(cause&&!spokenKeys.has(fingerprint(cause))&&cause!==life.causeByActor?.[actor]){life.causeByActor={...(life.causeByActor??{}),[actor]:cause};life.lastCause=cause;causalThought=true;const room=turnPlan.exitInspection?'couloir':finalResidents.find(a=>a.id===actor)!.room;addLine(names[actor]+" · pensée",cause,room);statements.push(db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT ?,'réflexion',?,? WHERE ${fence}`).bind(actor,`[${room}|${new Date(at).toISOString()}] `+cause,at,token,at));}
            }
        }
        if(!causalThought&&!routine&&["interact","autonomous"].includes(input.mode)&&together&&!opening&&(proposalActor||story.round%7===4)){const d=decisions.find(d=>d.actor===(proposalActor??(story.round%2?1:2)));if(d?.thought&&!["sleep","share_sleep"].includes(d.intent)){const recent=(await ownMemories(d.actor)).filter(m=>m.kind==="réflexion").map(m=>String(m.content).replace(/^\[[^\]]+\] /,""));const thought=truthfulGender(groundPrivateThought(d.thought,d.actor,d.emotions.attraction,world.agents.find(a=>a.id===d.actor)!.needs.stress,story.round,recent),d.actor);addLine(names[d.actor]+" · pensée",thought,turnPlan.exitInspection?"couloir":finalResidents.find(a=>a.id===d.actor)!.room);statements.push(db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT ?,?,?,? WHERE ${fence}`).bind(d.actor,"réflexion",`[${turnPlan.exitInspection?"couloir":finalResidents.find(a=>a.id===d.actor)!.room}|${new Date(at).toISOString()}] `+thought,at,token,at));}}
        if (finaleLines) {
            addLine("Lia",finaleLines.lia,finalResidents[0].room);
            addLine("Noé",finaleLines.noe,finalResidents[1].room);
        }
        if (input.mode === "autonomous")
            statements.push(db.prepare(`UPDATE world_lock SET last_auto = ? WHERE id = 1 AND ${fence}`).bind(now, token, at));
        if (storedStory) statements.push(db.prepare(`UPDATE memories SET content = ?, created_at = ? WHERE id = ? AND ${fence}`).bind(JSON.stringify(nextStory), at, storedStory.id, token, at));
        else statements.push(db.prepare(`INSERT INTO memories (agent_id,kind,content,created_at) SELECT 1, 'scenario', ?, ? WHERE ${fence}`).bind(JSON.stringify(nextStory), at, token, at));
        statements.unshift(db.prepare(`INSERT INTO world_requests (id, result, created_at) SELECT ?, ?, ? WHERE ${fence}`).bind(input.requestId, JSON.stringify(result), at, token, at));
        const saved = await db.batch(statements);
        if (saved[0].meta.changes !== 1)
            throw new LiaError("Ce tour a expiré. Réessaie.", 409);
        return Response.json({ ...result, ...await readWorld(db) }, { headers: { "Cache-Control": "no-store" } });
    }
    catch (error) {
        return Response.json({ error: error instanceof LiaError ? error.message : "La maison n’a pas pu enregistrer ce tour. Réessaie." }, { status: error instanceof LiaError ? error.status : 503 });
    }
    finally {
        if (locked)
            await db.prepare("UPDATE world_lock SET expires_at = 0 WHERE id = 1 AND token = ?").bind(token).run().catch(() => undefined);
    }
}
