import {visibleScene} from "./perception";
import {readLife,isSleeping} from "./life";
import { priority, intentRoom, mutualAttraction, type Intent } from "./simulation";
import { sleepRoom } from "./relationship";
import {gardenAccess, type Person, type Room } from "./house";
import type { Resident } from "./world";
import { seedPick, type Story } from "./story";

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
 // round>=20 (était 12), aligné avec affectionOpportunity dans route.ts : le premier geste de
 // Noé arrivait trop tôt dans la relation (retour utilisateur du 2026-09-16, point de l'audit
 // Opus initial jamais corrigé jusqu'ici).
 const offer=automatic&&!(gardenAccess(story)&&!life.gardenVisited)&&current.id===2&&story.round>=20&&!life.debrief?.remaining&&!life.contact?.remaining&&story.introduced&&opportunity&&(eligible||current.emotions.attraction>=80)&&!sleeping&&["salon","chambre"].includes(current.room)&&current.emotions.attraction>=80&&(!agreed||agreed.room==="bureau"&&salonPause) ? suggested : undefined;
 // Assoupli le 2026-09-16 : une idée d'aller voir le bureau, née spontanément dans la
 // conversation, se faisait auparavant écraser par la case à cocher "cuisine puis chambre
 // d'abord" tant que ces deux pièces n'étaient pas visitées — ça donnait l'impression que
 // l'enquête suivait un ordre imposé plutôt que l'initiative des personnages (retour utilisateur
 // du 2026-09-16). Une destination réellement convenue entre eux prime désormais toujours sur la
 // liste mécanique ; `explore` (ci-dessous) se met déjà en retrait dès qu'un accord existe.
 const executeAgreement=automatic&&agreed&&story.introduced&&!(agreed.room==="bureau"&&salonPause)&&!life.debrief?.remaining&&!life.contact?.remaining&&!residentPriority(current,Boolean(story.introduced))&&!partnerPriority&&!sleeping;
 // Ordre de visite mélangé par session (2026-09-17) : avant, l'exploration passait toujours par
 // la cuisine puis la chambre, dans cet ordre, à chaque partie — un des points figés qui donnait
 // l'impression que deux sessions se ressemblaient trop (retour utilisateur direct).
 const exploreOrder=seedPick(story.seed,"explore-order",[["cuisine","chambre"],["chambre","cuisine"]] as const);
 const explore=automatic&&!afterInvestigation&&!executeAgreement&&story.introduced&&!urgentIntent&&!partnerPriority?(exploreOrder as readonly Room[]).find(r=>!life.visited.includes(r)):undefined;
 const gardenFirst=automatic&&gardenAccess(story)&&!life.gardenVisited&&!sleeping&&!isSleeping(other,life)&&![current,other].some(a=>a.needs.hunger>=68||a.needs.fatigue>=68);
 // Seuil mélangé par session (2026-09-17, était fixe à 6) : sinon la télé arrivait toujours au
 // même tour d'une partie à l'autre, un autre point trop prévisible.
 const tvThreshold=seedPick(story.seed,"tv-threshold",[5,6,7,8,9] as const);
 const tvFirst=automatic&&!life.debrief?.remaining&&!life.contact?.remaining&&!afterInvestigation&&story.introduced&&!explore&&!life.tvSeen&&story.round>=tvThreshold&&!urgentIntent&&!partnerPriority;
 const studyContinuation=automatic&&life.studyTurns===1&&[current,other].some(a=>a.room==="bureau")&&!urgentIntent&&!partnerPriority;
 const reflection=automatic&&!urgentIntent&&!partnerPriority&&(life.debrief?.remaining??0)>0;
 const continuing=automatic&&!urgentIntent&&!partnerPriority&&(life.contact?.remaining??0)>0;
 // Seuil mélangé par session (2026-09-17, était fixe à 8), même logique que tvThreshold ci-dessus.
 const exitThreshold=seedPick(story.seed,"exit-threshold",[7,8,9,10] as const);
 const exitInspection=automatic&&story.introduced&&story.round>=exitThreshold&&!life.exitSearched&&!life.debrief?.remaining&&!life.contact?.remaining&&!explore&&!tvFirst&&!offer&&!agreed&&!urgentIntent&&!partnerPriority&&[current,other].every(a=>a.room==="salon");
 // Un tour d'enquête n'attend plus seulement le compteur (round%3) : si l'un des deux vient
 // d'exprimer l'envie d'aller vérifier quelque chose, l'idée est suivie tout de suite au lieu
 // d'attendre le prochain multiple de 3 — plus spontané, moins minuté (retour utilisateur du
 // 2026-09-16 : l'enquête devait donner l'impression d'être menée par les personnages eux-mêmes).
 // Le compteur reste le filet de sécurité qui garantit que les 5 preuves finissent par sortir
 // (article 4) même si le dialogue n'emploie jamais ces tournures.
 const investigativeCue=/\b(allons voir|aller voir|va(?:s)? voir|vérifier ça|vérifier cette|inspecter|jeter un œil|examiner|regarder de plus près|retourner voir)\b/i.test(history.slice(-2).map(l=>l.content).join(" "));
 const requiredIntent=(gardenFirst?"chat":urgentIntent) ?? (exitInspection?"chat":explore?"chat":tvFirst?"tv":studyContinuation?"study":continuing?"chat":reflection?"rest":undefined) ?? (executeAgreement?agreed!.intent:undefined) ?? (offer?undefined:(linger&&!partnerPriority?"rest":undefined) ?? (afterInvestigation&&!partnerPriority?"rest":undefined) ?? (automatic&&story.evidence.length<5&&story.round>=3&&(story.round%3===0||investigativeCue)&&!residentPriority(current,Boolean(story.introduced))&&!partnerPriority?"study":undefined));
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
