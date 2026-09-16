import {visibleScene} from "./perception";
import {readLife,isSleeping} from "./life";
import { priority, intentRoom, mutualAttraction, type Intent } from "./simulation";
import { sleepRoom } from "./relationship";
import {gardenAccess, type Person, type Room } from "./house";
import type { Resident } from "./world";
import type { Story } from "./story";

export const roomObjects:Record<Room,readonly string[]> = {
 jardin:["herbe","arbre","porte vers le couloir","clôture","haut-parleur de la porte"], salon:["canapé","bibliothèque","fenêtre","télévision","télécommande","plante géométrique","enceinte"], cuisine:["table","plan de travail","provisions","fenêtre"],
 chambre:["lit","miroir sans reflet","haut-parleur","fenêtre"], bureau:["table","écran","bibliothèque","livre","mot","feuille codée","fenêtre"],
};
export function residentPriority(agent:Resident, introduced:boolean) {
 const need=priority(agent.needs);return need==="rest"&&!introduced?undefined:need;
}
export function planTurn(mode:string,current:Resident,other:Resident,story:Story,eligible:boolean,opportunity:boolean,suggested:Intent,history:{content:string}[]) {
 const life=readLife(story.life,story.round);
 const automatic=["interact","autonomous"].includes(mode);
 const sleeping=isSleeping(current,life);
 const urgentIntent=automatic?(sleeping?"sleep":residentPriority(current,Boolean(story.introduced))):undefined;
 const partnerPriority=isSleeping(other,life)?"sleep":residentPriority(other,Boolean(story.introduced));
 const afterInvestigation=automatic&&[current,other].some(a=>a.intent==="study");
 // Assoupli le 2026-09-16 (5→3 tours et 8→4 tours plus bas) : la pause initiale au salon et le
 // maintien forcé ensemble restaient un peu longs, au point de donner une impression de blocage.
 const salonPause=automatic&&[current,other].every(a=>a.room==="salon")&&(story.salonTurns??0)<3&&Boolean(story.introduced);
 const linger=salonPause;
 const warmthChain=history.slice(-6).filter(l=>/présence|fait du bien|précieux|instants|réconfort|à tes côtés|partag/i.test(l.content)).length>=3;
 const inferred=agreedDestination(history);
 const candidate=story.pendingDestination ?? (inferred&&![current,other].every(a=>a.room===inferred.room)?inferred:undefined);
 const agreed=candidate?.room==="jardin"&&!gardenAccess(story)?undefined:candidate;
 const offer=automatic&&!(gardenAccess(story)&&!life.gardenVisited)&&current.id===2&&story.round>=12&&!life.debrief?.remaining&&!life.contact?.remaining&&story.introduced&&opportunity&&(eligible||current.emotions.attraction>=80)&&!sleeping&&["salon","chambre"].includes(current.room)&&current.emotions.attraction>=80&&(!agreed||agreed.room==="bureau"&&salonPause) ? suggested : undefined;
 const executeAgreement=automatic&&agreed&&!(agreed.room==="bureau"&&salonPause)&&!life.debrief?.remaining&&!life.contact?.remaining&&(agreed.room!=="bureau"||!["cuisine","chambre"].some(r=>!life.visited.includes(r as Room)))&&!residentPriority(current,Boolean(story.introduced))&&!partnerPriority&&!sleeping;
 const explore=automatic&&!afterInvestigation&&!executeAgreement&&story.introduced&&!urgentIntent&&!partnerPriority?(["cuisine","chambre"] as Room[]).find(r=>!life.visited.includes(r)):undefined;
 const gardenFirst=automatic&&gardenAccess(story)&&!life.gardenVisited&&!sleeping&&!isSleeping(other,life)&&![current,other].some(a=>a.needs.hunger>=68||a.needs.fatigue>=68);
 const tvFirst=automatic&&!life.debrief?.remaining&&!life.contact?.remaining&&!afterInvestigation&&story.introduced&&!explore&&!life.tvSeen&&story.round>=6&&!urgentIntent&&!partnerPriority;
 const studyContinuation=automatic&&life.studyTurns===1&&[current,other].some(a=>a.room==="bureau")&&!urgentIntent&&!partnerPriority;
 const reflection=automatic&&!urgentIntent&&!partnerPriority&&(life.debrief?.remaining??0)>0;
 const continuing=automatic&&!urgentIntent&&!partnerPriority&&(life.contact?.remaining??0)>0;
 const exitInspection=automatic&&story.introduced&&story.round>=8&&!life.exitSearched&&!life.debrief?.remaining&&!life.contact?.remaining&&!explore&&!tvFirst&&!offer&&!agreed&&!urgentIntent&&!partnerPriority&&[current,other].every(a=>a.room==="salon");
 const requiredIntent=(gardenFirst?"chat":urgentIntent) ?? (exitInspection?"chat":explore?"chat":tvFirst?"tv":studyContinuation?"study":continuing?"chat":reflection?"rest":undefined) ?? (executeAgreement?agreed!.intent:undefined) ?? (offer?undefined:(linger&&!partnerPriority?"rest":undefined) ?? (afterInvestigation&&!partnerPriority?"rest":undefined) ?? (automatic&&story.evidence.length<5&&story.round>=3&&story.round%3===0&&!residentPriority(current,Boolean(story.introduced))&&!partnerPriority?"study":undefined));
 const intent=requiredIntent??(automatic&&!story.introduced?"chat":automatic&&current.intent==="eat"?"rest":"chat");
 const room=(gardenFirst?"jardin":undefined)??(exitInspection?"salon":undefined)??explore??(tvFirst?"salon":studyContinuation?"bureau":undefined)??(continuing?life.contact!.room:reflection?"salon":undefined)??(executeAgreement?agreed!.room:intentRoom[offer??intent]??(automatic&&!story.introduced?"salon":current.room));
 const partnerIntent=(gardenFirst?"chat":partnerPriority)??(offer??(["study","rest","tv","hug","massage","kiss","share_sleep","intimacy"].includes(intent)?intent:intent==="eat"&&other.needs.hunger>=20?"eat":"chat"));
 const partnerRoom=mode==="chat"?other.room:partnerPriority==="sleep"?sleepRoom(other,current,mutualAttraction(current,other)):partnerPriority?intentRoom[partnerPriority]??room:room;
 const variants:Partial<Record<Intent,string[]>>={hug:["Un câlin, ça te dirait ? Dis-moi franchement.","Je te prendrais bien dans mes bras. T’en as envie, toi ?","J’ai envie d’un câlin avec toi. Ça te va ?"],massage:["Je peux te faire un massage doux. Tu veux, ou tu préfères rester tranquille ?","Un massage, doucement ? Je te laisse choisir.","J’aimerais te masser les épaules. T’en as envie ?"],kiss:["J’ai envie de t’embrasser. Toi aussi ?","Je tente une question : je peux t’embrasser ?","J’ai envie d’un bisou. Tu veux qu’on essaie, ou non ?"],share_sleep:["Tu voudrais dormir avec moi, ou tu préfères ton espace ?","J’aimerais dormir près de toi. T’en as envie aussi ?","Dormir ensemble ce soir, ça te va ? Sinon je prends le salon."]};
 const offset=Array.from(story.seed).reduce((n,c)=>n+c.charCodeAt(0),0);const proposalLine=offer?variants[offer]?.[(story.round+offset)%3]:undefined;
 return {gardenFirst,exitInspection:!gardenFirst&&exitInspection,life,explore,reflection:!gardenFirst&&reflection,continuing:!gardenFirst&&continuing,intent,room,partnerIntent,partnerRoom,proposalLine,salonPause,executeAgreement:Boolean(executeAgreement),agreed,lockedScene:true,urgentIntent:gardenFirst?undefined:urgentIntent,requiredIntent,routine:!gardenFirst&&Boolean(urgentIntent)&&(mode==="autonomous"||mode==="interact"),offer,
  requiredTogether:story.round<4||(story.apartTurns??0)>=2,apartTurns:story.apartTurns??0,
  suggestedRoom:room,
  liaison: {liaCanTease:Boolean(story.introduced)&&[current,other].find(a=>a.id===1)!.needs.stress<30&&(story.round%4===1||warmthChain),warmthChain},
 };
}
export type SpatialDecision={actor:Person;intent:Intent;room:Room;action:"none"|"move"|"talk";stayAlone?:boolean};
// One authority for actual destinations; prose never grants access to an object.
export function coordinateRooms(decisions:SpatialDecision[],agents:Resident[],story:Story,join=true) {
 const mutual=mutualAttraction(agents[0],agents[1]);
 for(const d of decisions){if(d.room==="jardin"&&!gardenAccess(story))d.room="salon";if(d.intent==="sleep")d.room=sleepRoom(agents.find(a=>a.id===d.actor)!,agents.find(a=>a.id!==d.actor)!,mutual);else if(intentRoom[d.intent])d.room=intentRoom[d.intent]!;d.action="move";}
 if(!join)return;
 if(decisions.length!==2||decisions.some(d=>["sleep","share_sleep"].includes(d.intent))) return;
 const [lead,follower]=decisions,leadState=agents.find(a=>a.id===lead.actor)!,followerState=agents.find(a=>a.id===follower.actor)!;
 const canSeparate=follower.stayAlone&&story.round>=8&&(story.apartTurns??0)<2;
 if(!residentPriority(followerState,Boolean(story.introduced))&&!canSeparate){
  const room=lead.action==="none"?leadState.room:lead.room;
  if(intentRoom[follower.intent]&&intentRoom[follower.intent]!==room) follower.intent="chat";
  follower.room=room;follower.action="move";
 }
}
export function sceneFor(agent:Resident, requiredIntent:Intent|undefined, plannedRoom?:Room) {
 const room=plannedRoom??intentRoom[requiredIntent??"none"]??agent.room;
 return {room,intent:requiredIntent??"chat",perception:visibleScene(room,[{...agent,room,intent:requiredIntent??"chat"}]),objects:roomObjects[room],deskScreenVisible:room==="bureau",instruction:"La pièce finale du personnage détermine ce qui est visible. Dans les autres pièces, l’écran du bureau peut être évoqué comme souvenir ou projet, jamais comme observation en cours."};
}

export function agreedDestination(history:{content:string}[]):Story["pendingDestination"] {
 const lines=history.slice(-4);
 for(let i=lines.length-2;i>=0;i--){
  const offer=lines[i].content,answer=lines[i+1]?.content??"";
  if(!/oui|d’accord|d'accord|allons|je te suis|autant y|bonne idée|volontiers/i.test(answer)||/non|pas maintenant|préfère rester/i.test(answer))continue;
  if(!/aller|allons|retourn|rejoindre|on (?:va|peut)|aimerais.*(?:voir|examiner)/i.test(offer))continue;
  const room=/jardin/i.test(offer)?"jardin":/bureau|écran/i.test(offer)?"bureau":/cuisine/i.test(offer)?"cuisine":/chambre/i.test(offer)?"chambre":/salon/i.test(offer)?"salon":undefined;
  if(room)return {room,intent:room==="jardin"?"chat":room==="bureau"?"study":room==="cuisine"?"eat":room==="chambre"?"chat":"rest",proposer:2};
 }
 return undefined;
}
export function proposedDestination(decisions:Array<SpatialDecision&{nextRoom?:Room|null;nextIntent?:Intent|null;acceptsNextRoom?:boolean;reply:string}>,sceneRoom:Room):Story["pendingDestination"] {
 if(decisions.length!==2)return undefined;
 const [first,second]=decisions;
 const future=/allons|aller|retourn|rejoign|on (?:va|peut|pourrait)|tu (?:veux|aimerais)|envie|ça te dirait|que dirais-tu/i.test(first.reply);
 const cue=first.nextRoom==="jardin"?/jardin|dehors|arbre/i:first.nextRoom==="bureau"?/bureau|écran|\bfeuille\b|code/i:first.nextRoom==="cuisine"?/cuisine|manger|repas|cuisiner|thé/i:first.nextRoom==="chambre"?/chambre|dormir|sommeil|massage/i:/salon|canapé|télévision|tv|souffler|câlin|bisou/i;
 if(future&&cue.test(first.reply)&&first.nextRoom&&second.acceptsNextRoom&&(!first.nextIntent||!intentRoom[first.nextIntent]||intentRoom[first.nextIntent]===first.nextRoom)) {
  const intent=first.nextIntent??(first.nextRoom==="bureau"?"study":first.nextRoom==="cuisine"?"eat":first.nextRoom==="salon"?"rest":"chat");
  if(first.nextRoom!==sceneRoom||intent!==first.intent)return {room:first.nextRoom,intent,proposer:first.actor};
 }
 const inferred=agreedDestination(decisions.map(d=>({content:d.reply})));
 return inferred&&inferred.room!==sceneRoom?{...inferred,proposer:first.actor}:undefined;
}
