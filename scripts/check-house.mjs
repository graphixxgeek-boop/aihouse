import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
// newStory() draws its seed from crypto.randomUUID(); left purely constant here would break tests
// that check a reset produces a genuinely new session id. Instead, every generated value stays
// unique (a monotonic counter) but is skipped and retried whenever it would hash to an "insolite"
// opening (lib/simulation.ts:InsoliteOpening, ~40% of raw draws) — replicating seedPick's exact
// hash (lib/story.ts) so every test-generated session is deterministically "normal", without
// hardcoding a single reused seed.
{let seedCounter=0;const insoliteHash=s=>{let h=0;for(const c of s+"::insolite-opening")h=(h*31+c.charCodeAt(0))>>>0;return h%10;};
Object.defineProperty(globalThis.crypto,'randomUUID',{value:()=>{let candidate;do{candidate='00000000-0000-4000-8000-'+(++seedCounter).toString(16).padStart(12,'0');}while(insoliteHash(candidate)>=6);return candidate;},configurable:true});}
fs.mkdirSync('.sites-runtime',{recursive:true});
const transpile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
for(const name of ['house','simulation','relationship','dialogue','story','lia','world','turn','life','drama','perception','visual-events','stock','presentation','playback','evidence','reference','update-audit'])fs.writeFileSync(`.sites-runtime/test-${name}.mjs`,transpile(fs.readFileSync(`lib/${name}.ts`,'utf8').replace('"./update-audit"','"./test-update-audit.mjs"').replace('"./visual-events"','"./test-visual-events.mjs"').replace('"./drama"','"./test-drama.mjs"').replace('"./perception"','"./test-perception.mjs"').replace('"./life"','"./test-life.mjs"').replace('"./house"','"./test-house.mjs"').replace('"./lia"','"./test-lia.mjs"').replace('"./simulation"','"./test-simulation.mjs"').replace('"./relationship"','"./test-relationship.mjs"').replace('"./story"','"./test-story.mjs"')));
const raw=fs.readFileSync('app/api/lia/route.ts','utf8').replace('import { env } from "cloudflare:workers";','const env=globalThis.__testEnv;').replaceAll('"@/lib/stock"','"./test-stock.mjs"').replaceAll('"@/lib/visual-events"','"./test-visual-events.mjs"').replaceAll('"@/lib/perception"','"./test-perception.mjs"').replaceAll('"@/lib/lia"','"./test-lia.mjs"').replaceAll('"@/lib/world"','"./test-world.mjs"').replaceAll('"@/lib/house"','"./test-house.mjs"').replaceAll('"@/lib/simulation"','"./test-simulation.mjs"').replaceAll('"@/lib/dialogue"','"./test-dialogue.mjs"').replaceAll('"@/lib/relationship"','"./test-relationship.mjs"').replaceAll('"@/lib/story"','"./test-story.mjs"').replaceAll('"@/lib/life"','"./test-life.mjs"').replaceAll('"@/lib/drama"','"./test-drama.mjs"').replaceAll('"@/lib/turn"','"./test-turn.mjs"');
fs.writeFileSync('.sites-runtime/test-route.mjs',transpile(raw));
const sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync('drizzle/0000_jazzy_cobalt_man.sql','utf8'));
sqlite.prepare('INSERT INTO agent_state VALUES (1,?,?,?,?,?)').run('attentive','Je lis','Apprendre',3,1000);
sqlite.prepare('INSERT INTO memories (kind,content,created_at) VALUES (?,?,?)').run('ancien','Mon ancien souvenir',1000);
sqlite.exec(fs.readFileSync('drizzle/0001_harsh_kate_bishop.sql','utf8'));
for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')&&!f.startsWith('0000')&&!f.startsWith('0001')).sort())sqlite.exec(fs.readFileSync('drizzle/'+file,'utf8'));
function prepared(sql){let args=[];return {bind(...values){args=values;return this},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}},async first(){return sqlite.prepare(sql).get(...args)??null},async all(){return {results:sqlite.prepare(sql).all(...args)}}};}
const db={prepare:prepared,async batch(statements){sqlite.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());sqlite.exec('COMMIT');return results}catch(error){sqlite.exec('ROLLBACK');throw error}}};
globalThis.__testEnv={DB:db,GEMINI_API_KEY:'test-only'};
const {POST}=await import('../.sites-runtime/test-route.mjs');
const {initialize,readWorld}=await import('../.sites-runtime/test-world.mjs');
await initialize(db);let world=await readWorld(db);assert.equal(world.agents.length,2);assert.equal(world.agents[0].goal,'Apprendre');assert.equal(world.memories[0].agent_id,1);
let requestCounter=0;
// Deliberately independent of crypto.randomUUID(), which is fixed above for newStory()'s benefit —
// requestId still needs a genuinely distinct value per call, unlike story.seed. The route's schema
// requires actual UUID shape (z.string().uuid()), so the counter is embedded in one.
const input=(mode,actor=1,extra={})=>({requestId:'00000000-0000-4000-8000-'+(++requestCounter).toString(16).padStart(12,'0'),mode,actor,...extra});
const post=body=>POST(new Request('https://house.test/api/lia',{method:'POST',headers:{Origin:'https://house.test','Content-Type':'application/json'},body:JSON.stringify(body)}));
// Since the two-brains split, one fetch call answers for exactly one character (selfRole tells
// which); a wrapper overriding a specific reply must check this instead of the old first/second split.
const isPartnerRequest=args=>JSON.parse(JSON.parse(args[1].body).contents[0].parts[0].text).selfRole==='partner';
const move=input('move',2,{room:'cuisine'});assert.equal((await post(move)).status,200);assert.equal((await readWorld(db)).agents[1].room,'cuisine');assert.equal((await readWorld(db)).agents[0].room,'salon');
let calls=0,failSecond=false,expired=false,affection=false,refuse=false,affectionIntent="hug",meal=false,flat=false,brokenPair=false,separatePreference=false,sceneMismatch=false,honorOffer=false,replayScene=false,tenderScene=false,chatMoveAccepted=false;let lastContext;
globalThis.fetch=async(url,options)=>{
  calls++;assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent');assert.equal(options.headers['x-goog-api-key'],'test-only');const payload=JSON.parse(options.body),context=JSON.parse(payload.contents[0].parts[0].text),isNoe=payload.systemInstruction.parts[0].text.startsWith('Tu es Noé'),isPartnerCall=context.selfRole==='partner';
  lastContext=context;
  assert.ok(context.memories.every(memory=>typeof memory.content==='string'));
  if(context.mode==='interaction'){assert.equal(context.replyTarget.content,context.message.split(' te dit : ')[1]);assert.equal(context.dialogue.at(-1).content,context.replyTarget.content);}
  if(failSecond&&(context.mode==='interaction'||isPartnerCall))return Response.json({error:{code:'rate_limit_exceeded'}},{status:429});
  if(expired)sqlite.prepare('UPDATE world_lock SET token=?,expires_at=? WHERE id=1').run('successor',Date.now()+90000);
  if(replayScene||tenderScene){
    // Deux appels séparés désormais : chacun ne reçoit que sa propre scène (context.scene/context.state),
    // jamais celle de l'autre (l'ancien pairOther a disparu avec l'architecture combinée).
    const decision=!isPartnerCall?{intent:context.turnPlan.intent,affectionAccepted:false,emotions:context.state.emotions,reply:tenderScene?'Ta présence m’apaise. Je suis bien avec toi.':context.turnPlan.executeAgreement?'On regarde de plus près ce texte et ces chiffres pour voir ce qu’ils signifient.':'Retournons au bureau pour examiner la feuille codée. Tu viens ?',thought:'Je pense à l’autre avec curiosité.',stayAlone:false,nextRoom:replayScene&&!context.turnPlan.executeAgreement?'bureau':null,nextIntent:replayScene&&!context.turnPlan.executeAgreement?'study':null,acceptsNextRoom:false,mood:'attentive',activity:'Je réfléchis',goal:'Comprendre et faire connaissance',action:'none',room:context.scene.room,memory:'Je parle dans ma pièce.'}
      :{intent:context.turnPlan.partnerIntent,affectionAccepted:false,emotions:context.state.emotions,reply:tenderScene?'J’aime ces moments avec toi.':context.turnPlan.executeAgreement?'Oui, penchons-nous là-dessus pour essayer de décoder ces données.':'Oui, allons au bureau.',thought:'Je pense à l’autre avec curiosité.',stayAlone:false,nextRoom:null,nextIntent:null,acceptsNextRoom:replayScene&&!context.turnPlan.executeAgreement,mood:'attentive',activity:'Je réfléchis',goal:'Comprendre et faire connaissance',action:'none',room:context.scene.room,memory:'Je parle dans ma pièce.'};
    assert.deepEqual(payload.generationConfig.responseJsonSchema.properties.room.enum,[context.scene.room]);
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(decision)}]}}]});
  }
  if(isPartnerCall&&brokenPair)return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'{}'}]}}]});
  const decision={intent:honorOffer&&context.turnPlan?.offer?context.turnPlan.offer:meal?"eat":affection?(isNoe&&refuse?"chat":affectionIntent):"chat",affectionAccepted:(honorOffer&&Boolean(context.turnPlan?.offer)||affection)&&!refuse,emotions:flat?context.state.emotions:{curiosity:90,tension:20,trust:99,comfort:80,attraction:99},thought:isNoe?'Lia me plaît, mais je préfère attendre un signe avant de lui proposer un câlin.':'Noé m’intrigue ; je ne sais pas encore si je peux lui faire confiance.',reply:chatMoveAccepted&&context.mode==='chat'&&!isPartnerCall?'D’accord, j’y vais.':sceneMismatch?'Reprenons notre examen de cet écran. Moi, c’est '+context.state.name+'.':honorOffer&&context.turnPlan?.offer?'Tu aimerais un câlin, tout doucement ?':isNoe?'Bonjour Lia, explorons le bureau ensemble.':'Bonjour Noé, que veux-tu explorer ?',mood:'curieuse',activity:'Je discute',goal:'Faire connaissance',action:'none',room:'salon',memory:isNoe?'J’ai répondu à Lia.':'J’ai parlé à Noé.',...(chatMoveAccepted&&context.mode==='chat'&&!isPartnerCall?{nextRoom:'chambre',nextIntent:null}:{})};
  if(isPartnerCall){
    decision.reply=affection||honorOffer?'Oui, j’en ai envie.':isNoe?'Bonjour Noé, que veux-tu explorer ?':'Bonjour Lia, explorons le bureau ensemble.';
    decision.stayAlone=separatePreference;
    decision.room=separatePreference?"salon":decision.room;
    decision.intent=separatePreference?"rest":(affection&&refuse?"chat":decision.intent);
  }
  return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(decision)}]}}]});
};
const interaction=input('interact');let response=await post(interaction);assert.equal(response.status,200);let result=await response.json();assert.equal(result.decisions.length,2);assert.equal(result.agents[0].emotions.trust,13);assert.equal(result.agents[0].emotions.attraction,12);assert.equal(result.agents[0].emotions.tension,55);assert.equal(result.agents[0].needs.stress,55);assert.equal(result.agents[1].needs.stress,30);assert.equal(result.agents[1].room,result.agents[0].room);assert.equal(calls,2);
response=await post(interaction);assert.equal(response.status,200);assert.equal(calls,2);assert.equal((await readWorld(db)).messages.filter(m=>["Lia","Noé"].includes(m.speaker)).length,2);
const failed=input('interact');failSecond=true;const before=(await readWorld(db)).memories.length;assert.equal((await post(failed)).status,429);assert.equal((await readWorld(db)).memories.length,before);assert.equal(sqlite.prepare('SELECT count(*) n FROM world_requests WHERE id=?').get(failed.requestId).n,0);
failSecond=false;assert.equal((await post(failed)).status,200);
sqlite.prepare('UPDATE world_lock SET token=?,expires_at=? WHERE id=1').run('other-tab',Date.now()+90000);assert.equal((await post(input('chat',1,{message:'Bonjour'}))).status,409);sqlite.exec('UPDATE world_lock SET expires_at=0');
expired=true;const previous=(await readWorld(db)).messages.length;assert.equal((await post(input('interact',1))).status,409);assert.equal((await readWorld(db)).messages.length,previous);assert.equal(sqlite.prepare('SELECT token FROM world_lock').get().token,'successor');
assert.equal((await post(input('chat',1,{message:''}))).status,400);
const {centers,pathBetween,blocked}=await import('../.sites-runtime/test-house.mjs');
for(const start of Object.entries(centers).filter(([room])=>room!=="jardin").map(([,center])=>center))for(const end of Object.entries(centers).filter(([room])=>room!=="jardin").map(([,center])=>center))for(const offset of [-.5,.5]){
  const path=pathBetween([start[0]+offset,start[1]],[end[0]+offset,end[1]]);assert.ok(path.length,`${start} to ${end}`);assert.ok(path.every(([x,z])=>!blocked(x,z)));for(let i=1;i<path.length;i++)assert.equal(Math.abs(path[i][0]-path[i-1][0])+Math.abs(path[i][1]-path[i-1][1]),.5);
}
expired=false;sqlite.exec('UPDATE world_lock SET expires_at=0');
const {advanceNeeds,initialNeeds,initialNeedsFor,initialEmotionsFor,residentProfiles,sharedActivityBonus,faceExpression}=await import('../.sites-runtime/test-simulation.mjs');
assert.ok(advanceNeeds(initialNeeds,'eat','cuisine').hunger<initialNeeds.hunger);
assert.ok(advanceNeeds(initialNeeds,'eat','salon').hunger>initialNeeds.hunger);
assert.ok(advanceNeeds(initialNeeds,'sleep','chambre').fatigue<initialNeeds.fatigue);
assert.ok(advanceNeeds(initialNeeds,'rest','salon').stress<initialNeeds.stress);
assert.ok(advanceNeeds(initialNeeds,'study','bureau').uncertainty<initialNeeds.uncertainty);
assert.ok(advanceNeeds(initialNeeds,'tv','salon').uncertainty<initialNeeds.uncertainty);
for(let i=0,n=initialNeeds;i<100;i++){n=advanceNeeds(n,'none','salon');assert.ok(Object.values(n).every(v=>v>=0&&v<=100));}
const reset=input('reset');response=await post(reset);assert.equal(response.status,200);result=await response.json();assert.equal(result.epoch,1);assert.equal(result.messages.length,0);assert.equal(result.memories.length,0);assert.equal(result.agents[0].room,'salon');assert.equal(result.agents[1].room,'bureau');assert.equal(result.agents[0].cycle,0);assert.equal(result.agents[0].emotions.trust,8);assert.deepEqual(result.agents[0].needs,initialNeedsFor(1));
assert.equal((await post(reset)).status,200);assert.equal((await readWorld(db)).epoch,1);
assert.equal((await post(input('move'))).status,409);
assert.equal((await post(input('care',1,{epoch:1,intent:'hug'}))).status,400);
response=await post(input('care',1,{epoch:1,intent:'eat'}));assert.equal(response.status,200);result=await response.json();assert.equal(result.agents[0].room,'cuisine');assert.ok(result.agents[0].needs.hunger<26);
affection=true;response=await post(input('interact',1,{epoch:1}));result=await response.json();assert.equal(result.sharedAffection,null);assert.ok(result.agents.every(a=>a.intent!=='hug'));
const warm=JSON.stringify({curiosity:50,tension:20,trust:40,comfort:60,attraction:60});sqlite.prepare('UPDATE agent_state SET emotions=?,needs=?').run(warm,JSON.stringify(initialNeeds));
refuse=true;response=await post(input('interact',1,{epoch:1}));result=await response.json();assert.equal(result.sharedAffection,null);
refuse=false;response=await post(input('interact',1,{epoch:1}));result=await response.json();assert.equal(result.sharedAffection,null);
affection=false;for(let i=0;i<3;i++){sqlite.prepare('UPDATE agent_state SET needs=?').run(JSON.stringify(initialNeeds));assert.equal((await post(input('interact',1,{epoch:1}))).status,200);}
affection=true;sqlite.exec('DELETE FROM world_requests');{const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life={...p.life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:true,studyTurns:0,contact:undefined,debrief:undefined};p.pendingDestination={room:'salon',intent:'hug',proposer:2};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}sqlite.prepare('UPDATE agent_state SET room=?,emotions=?,needs=?').run('salon',warm,JSON.stringify(initialNeeds));response=await post(input('interact',1,{epoch:1}));result=await response.json();assert.equal(result.sharedAffection,'hug');assert.ok(result.agents.every(a=>a.intent==='hug'&&a.room==='salon'));{const hugExpr=faceExpression(result.agents[0]);assert.ok(hugExpr.mouthCurve>0,'shared hug should read as a smile, not a neutral or frowning face');assert.ok(hugExpr.angerLevel<.3,'shared hug should not read as angry');}
for(const [intent,room] of [['massage','chambre'],['kiss','salon'],['share_sleep','chambre']]){
 affectionIntent=intent;sqlite.exec('DELETE FROM world_requests');{const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life={...p.life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:true,contact:undefined,debrief:undefined};p.pendingDestination={room,intent,proposer:2};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}sqlite.prepare('UPDATE agent_state SET emotions=?,needs=?').run(warm,JSON.stringify(initialNeeds));response=await post(input('interact',1,{epoch:1}));assert.equal(response.status,200);result=await response.json();if(result.affectionOutcome==="deferred"){response=await post(input("interact",1,{epoch:1}));assert.equal(response.status,200);result=await response.json();}assert.equal(result.sharedAffection,intent);assert.ok(result.agents.every(a=>(a.intent===intent||["sleep","share_sleep"].includes(intent)&&a.intent==="none"&&a.needs.fatigue<=12)&&a.room===room));
}
affection=false;response=await post(input('reset',1,{epoch:1}));assert.equal(response.status,200);
response=await post(input('interact',2,{epoch:2}));assert.equal(response.status,200);result=await response.json();assert.deepEqual(result.messages.filter(m=>["Lia","Noé"].includes(m.speaker)).map(m=>m.speaker),['Noé','Lia']);
response=await post(input('interact',1,{epoch:2}));assert.equal(response.status,200);result=await response.json();assert.deepEqual(result.messages.filter(m=>["Lia","Noé"].includes(m.speaker)).map(m=>m.speaker),['Noé','Lia','Noé','Lia']);
const visitorStory=sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content;const unlockedStory=JSON.parse(visitorStory);unlockedStory.evidence=Array(5).fill('Preuve canonique');unlockedStory.finalCalled=true;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(unlockedStory));
const priorCalls=calls;response=await post(input('chat',1,{epoch:2,message:'Bonjour Lia'}));assert.equal(response.status,200);assert.equal(calls,priorCalls+2);sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(visitorStory);
const {nextSpeaker,dialogueContext}=await import('../.sites-runtime/test-dialogue.mjs');assert.equal(nextSpeaker([{id:1,speaker:'Lia',content:'Qui es-tu ?'}],1),2);assert.equal(dialogueContext([{id:1,speaker:'Lia',content:'Qui es-tu ?'}],'Noé').replyTarget.content,'Qui es-tu ?');
const baseline={hunger:45,fatigue:30,stress:35,uncertainty:70};
assert.ok(advanceNeeds(baseline,'none','salon',1).fatigue>advanceNeeds(baseline,'none','salon',2).fatigue);
assert.ok(advanceNeeds(baseline,'none','salon',2).hunger>advanceNeeds(baseline,'none','salon',1).hunger);
assert.equal(advanceNeeds(baseline,'eat','cuisine',1).fatigue-advanceNeeds(baseline,'none','cuisine',1).fatigue,0);
assert.equal(advanceNeeds(baseline,'eat','cuisine',2).fatigue-advanceNeeds(baseline,'none','cuisine',2).fatigue,14);
assert.ok(initialNeedsFor(2).hunger>initialNeedsFor(1).hunger);assert.equal(initialNeedsFor(2).stress,90);assert.equal(initialNeedsFor(1).stress,90);
for(const key of ['attraction','trust','comfort'])assert.ok(initialEmotionsFor(2)[key]>initialEmotionsFor(1)[key]);assert.equal(initialEmotionsFor(2).tension,90);assert.equal(initialEmotionsFor(1).tension,90);
const common={intent:'eat',room:'cuisine',emotions:{attraction:40,trust:30}};assert.equal(sharedActivityBonus(common,common,common,common),true);assert.equal(sharedActivityBonus(common,{...common,room:'salon'},common,common),false);assert.equal(sharedActivityBonus(common,{...common,emotions:{attraction:39,trust:30}},common,common),false);
const preserved=await readWorld(db);await initialize(db);assert.deepEqual((await readWorld(db)).agents,preserved.agents);
assert.equal(residentProfiles[2].sharedBonus,2);assert.equal(residentProfiles[1].sharedBonus,2);
const {ages,isInLove,sleepRoom,attractionAfterTurn,proposalPressure,flirtingAssessment}=await import('../.sites-runtime/test-relationship.mjs');
assert.deepEqual(ages,{1:28,2:31});assert.equal(isInLove(75),false);assert.equal(isInLove(76),true);
assert.ok(attractionAfterTurn(1,40,45,9)>attractionAfterTurn(1,40,45,10));assert.ok(attractionAfterTurn(1,40,45,4)>attractionAfterTurn(1,40,45,9));assert.equal(attractionAfterTurn(1,40,35,4),35);
const residents=(await readWorld(db)).agents;const n={...residents[1],room:'salon',intent:'none'};const l={...residents[0],room:'salon',intent:'none'};
assert.equal(sleepRoom(n,l,false),'salon');assert.equal(sleepRoom({...n,room:'chambre',intent:'sleep'},l,false),'chambre');assert.equal(sleepRoom(n,l,true),'chambre');assert.equal(sleepRoom(l,{...n,room:'chambre',intent:'sleep',needs:{...n.needs,fatigue:70}},false),'salon');
assert.ok(advanceNeeds(baseline,'sleep','chambre',2).fatigue<advanceNeeds(baseline,'sleep','salon',2).fatigue);assert.equal(advanceNeeds(baseline,'rest','salon',1).fatigue,baseline.fatigue-2);
assert.equal(proposalPressure([{result:JSON.stringify({proposalActor:2})},{result:JSON.stringify({proposalActor:1})}]),1);
let mistakesLow=0,mistakesHigh=0;for(let i=0;i<100;i++){mistakesLow+=Number(flirtingAssessment(20,40,String(i)).mayBeMistaken);mistakesHigh+=Number(flirtingAssessment(70,40,String(i)).mayBeMistaken);}assert.ok(mistakesHigh>mistakesLow);
// A third recent Noé proposal cannot receive contact and lowers Lia's attraction.
{const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life={...p.life,visualIntro:2,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,personalFollowup:3};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
sqlite.prepare('UPDATE agent_state SET emotions=?,needs=?,room=?,intent=?').run(warm,JSON.stringify(initialNeeds),'salon','none');
sqlite.prepare('UPDATE agent_state SET emotions=? WHERE id=2').run(JSON.stringify({...JSON.parse(warm),attraction:80}));
for(let i=0;i<2;i++)sqlite.prepare('INSERT INTO world_requests (id,result,created_at) VALUES (?,?,?)').run('pressure-'+i,JSON.stringify({proposalActor:2}),Date.now()+i+1000);
sqlite.prepare('INSERT INTO conversations (speaker,content,created_at) VALUES (?,?,?)').run('Lia','Je te laisse parler.',Date.now());
affection=true;affectionIntent='hug';response=await post(input('interact',2,{epoch:2}));assert.equal(response.status,200);result=await response.json();assert.equal(result.sharedAffection,null);assert.ok(result.agents.find(a=>a.id===1).emotions.attraction<60);
affection=false;sqlite.prepare('UPDATE agent_state SET emotions=?,needs=?,intent=?,room=? WHERE id=1').run(JSON.stringify({...initialEmotionsFor(1),attraction:4}),JSON.stringify(initialNeeds),'none','salon');sqlite.prepare('UPDATE agent_state SET needs=?,intent=?,room=? WHERE id=2').run(JSON.stringify(initialNeeds),'none','salon');
response=await post(input('care',1,{epoch:2,intent:'rest'}));result=await response.json();assert.ok(result.agents[1].needs.stress>initialNeeds.stress);
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=? WHERE id=2').run('chambre','sleep',JSON.stringify({...initialNeeds,fatigue:80}));const beforeSofa=(await readWorld(db)).agents[0].emotions.attraction;response=await post(input('care',1,{epoch:2,intent:'sleep'}));result=await response.json();assert.equal(result.agents[0].room,'salon');assert.ok(result.agents[0].emotions.attraction<beforeSofa);assert.ok(["Je vais dormir sur le canapé. Tu aurais pu dormir dans le salon.","Je prends le canapé, alors. Tu aurais pu me laisser la chambre.","Le canapé fera l'affaire. Ça t'aurait coûté quoi, de dormir ici plutôt ?"].includes(result.decisions[0].reply));
console.log('Passed: age facts, love threshold, Lia stress growth, proposal pressure, stressed misreading, sleep allocation, sofa complaint and stress reaction.');
console.log('Passed: individual needs, post-meal fatigue, initial personality differences, common activity bonus, rejection guard and preserved progress.');
console.log('Passed: exact questions, Noé-first dialogue order, stable conversational turn taking and isolated visitor replies.');
console.log('Passed: needs and room restrictions, reset and retries, stale session refusal, mutual affection threshold and refusal; plus migration and concurrency checks.');
console.log('Passed: migration preserves Lia, independent memories, both AI turns, atomic failure, idempotent retry, multi-tab lease, stale-write fencing, input checks and every room route.');

const {newStory,rememberAges,advanceStory,storyContext,seedPick}=await import('../.sites-runtime/test-story.mjs');
assert.deepEqual(rememberAges([{id:1,speaker:'Lia',content:"J'ai vingt-huit ans."},{id:2,speaker:'Noé',content:"Moi, trente et un ans."}]),['Lia','Noé']);
let storyline=newStory(),orders=new Set();for(let i=0;i<100;i++){const next=newStory(storyline.variant);assert.notEqual(next.variant,storyline.variant);orders.add(next.order.join());storyline=next;}assert.ok(orders.size>5);
storyline=newStory();for(let i=0;i<30;i++)storyline=advanceStory(storyline,true,[]);assert.equal(storyline.evidence.length,5);assert.match(storyContext(storyline).stage,/confirmée/);assert.match(storyline.evidence.at(-1),/agents IA autonomes/);
let quiet=newStory();for(let i=0;i<100;i++)quiet=advanceStory(quiet,false,[]);assert.equal(quiet.evidence.length,0);
sqlite.exec('DELETE FROM world_requests');affection=false;flat=true;
const steady={...initialEmotionsFor(2),attraction:76,trust:60};sqlite.prepare('UPDATE agent_state SET emotions=?,needs=?,intent=?,room=?').run(JSON.stringify(steady),JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:80}),'chat','salon');
let savedStory=newStory();savedStory.round=3;savedStory.salonTurns=5;savedStory.life.visited=['salon','cuisine','chambre'];savedStory.life.tvSeen=true;savedStory.life.studyTurns=1;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(savedStory));
sqlite.prepare('INSERT INTO conversations (speaker,content,created_at) VALUES (?,?,?)').run('Lia',"J'ai vingt-huit ans.",Date.now());sqlite.prepare('INSERT INTO conversations (speaker,content,created_at) VALUES (?,?,?)').run('Noé',"J'ai trente et un ans.",Date.now());for(let i=0;i<40;i++)sqlite.prepare('INSERT INTO conversations (speaker,content,created_at) VALUES (?,?,?)').run(i%2?'Lia':'Noé','Une observation sur la maison.',Date.now());
response=await post(input('interact',1,{epoch:2}));assert.equal(response.status,200);result=await response.json();assert.ok(lastContext.knownAges.includes('Lia')&&lastContext.knownAges.includes('Noé'));assert.equal(result.agents[1].emotions.attraction,76);assert.equal(result.story.evidence.length,1);assert.ok(result.agents.every(a=>a.intent==='study'));
const priorStory=sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content;brokenPair=true;response=await post(input('interact',1,{epoch:2}));assert.equal(response.status,502);assert.equal(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content,priorStory);brokenPair=false;
sqlite.prepare('UPDATE agent_state SET needs=?').run(JSON.stringify({hunger:90,fatigue:10,stress:20,uncertainty:80}));sqlite.exec('UPDATE world_lock SET last_auto=0');const callsBeforeRoutine=calls;response=await post(input('autonomous',1,{epoch:2}));assert.equal(response.status,200);result=await response.json();assert.equal(calls,callsBeforeRoutine);assert.equal(result.decisions[0].intent,'eat');assert.equal(result.decisions[0].room,'cuisine');
const oldSeed=result.story.session;response=await post(input('reset',1,{epoch:2}));result=await response.json();assert.notEqual(result.story.session,oldSeed);assert.equal(result.story.evidence.length,0);
console.log('Passed: varied reset scenarios, word ages beyond context window, earned progressive revelation, no premature spoilers, attraction governed by room with flat model output, invalid partner atomic rollback and zero-call urgent routines.');
const {groundIntroduction}=await import('../.sites-runtime/test-dialogue.mjs');
assert.equal(groundIntroduction("Salut Lia, je m'appelle Noé.",'Noé','Lia',[]),"Salut, je m'appelle Noé.");
assert.match(groundIntroduction("Je ne sais pas.",'Lia','Noé',[{id:1,speaker:'Noé',content:"Je m'appelle Noé."}]),/Moi, c’est Lia/);

const {needLevel}=await import('../.sites-runtime/test-simulation.mjs');assert.equal(needLevel('hunger',49),'normal');assert.equal(needLevel('hunger',50),'pressing');assert.equal(needLevel('hunger',68),'urgent');assert.equal(needLevel('stress',74),'pressing');assert.equal(needLevel('stress',75),'urgent');assert.equal(advanceNeeds(baseline,'sleep','chambre',2).hunger,baseline.hunger);
const {parseStory}=await import('../.sites-runtime/test-story.mjs');assert.equal(parseStory('{broken').met,undefined);let dreaming=advanceStory(newStory(),false,[],[1,2]);assert.equal(dreaming.dreams.length,2);assert.equal(dreaming.evidence.length,0);assert.equal(storyContext(dreaming,1).dreams.length,1);assert.ok(storyContext(dreaming,1).dreams.every(d=>d.actor===1));assert.ok(storyContext(dreaming,2).dreams.every(d=>d.actor===2));
const freshEpoch=result.epoch;assert.ok(result.agents.every(a=>a.needs.stress===90));flat=true;affection=false;const newEncounter=input('interact',2,{epoch:freshEpoch});response=await post(newEncounter);assert.equal(response.status,200);result=await response.json();assert.ok(result.agents[0].needs.stress>=80);assert.equal(result.agents[1].needs.stress,30);const savedEncounter=result;response=await post(newEncounter);result=await response.json();assert.deepEqual(result.decisions,savedEncounter.decisions);response=await post(input("interact",2,{epoch:freshEpoch}));result=await response.json();assert.equal(result.agents[0].needs.stress,55);
sqlite.prepare('UPDATE agent_state SET needs=?,intent=? WHERE id=1').run(JSON.stringify({hunger:10,fatigue:90,stress:30,uncertainty:80}),'chat');response=await post(input('care',1,{epoch:freshEpoch,intent:'sleep'}));assert.equal(response.status,200);result=await response.json();assert.equal(result.story.dreams.filter(d=>d.actor===1).length,1);const beforeSleepMessages=result.messages.length;const beforeSleepCalls=calls;response=await post(input('interact',1,{epoch:freshEpoch}));assert.equal(response.status,200);result=await response.json();assert.equal(calls,beforeSleepCalls);assert.equal(result.messages.length,beforeSleepMessages);assert.equal(result.story.dreams.filter(d=>d.actor===1).length,1);
console.log('Passed: first meeting relief once and cached consistently, start stress 90%, private dream clues once per sleep, no dialogue during sleep, slower hunger and graduated need alerts.');
const {groundFragment}=await import('../.sites-runtime/test-story.mjs');const fragments=newStory();fragments.variant=0;
assert.equal(groundFragment('Non, je ne sais pas. Tu te rappelles ton trajet ?',2,fragments,[]),'Non, je ne sais pas.');
assert.match(groundFragment('Tu te rappelles ton trajet ?',2,fragments,[{id:1,speaker:'Lia',content:'Je me rappelle un trajet.'}]),/ton trajet/);
const assisted={...newStory(),round:4,dreams:[{actor:1,round:1,content:'Un rêve.'},{actor:2,round:2,content:'Un autre rêve.'}]};assert.equal(advanceStory(assisted,true,[]).evidence.length,1);assert.equal(advanceStory({...assisted,dreams:[]},true,[]).evidence.length,0);assert.equal(advanceStory(assisted,false,[]).evidence.length,0);

response=await post(input('reset',1,{epoch:freshEpoch}));result=await response.json();const socialEpoch=result.epoch;
response=await post(input('move',2,{epoch:socialEpoch,room:'salon'}));result=await response.json();assert.equal(result.agents[1].needs.stress,30);assert.ok(result.agents[0].needs.stress>=90);assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).introduced,false);
response=await post(input('interact',2,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.equal(result.agents[0].needs.stress,55);assert.equal(lastContext.socialRules.liaCanComment,false);
meal=true;const mealPlot=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);mealPlot.pendingDestination={room:"cuisine",intent:"eat",proposer:2};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(mealPlot));response=await post(input('interact',1,{epoch:socialEpoch}));result=await response.json();assert.ok(result.agents.every(a=>a.intent==='eat'&&a.room==='cuisine'));assert.ok(result.agents[0].needs.stress<=30);assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).sharedMeal,true);meal=false;
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?').run('bureau','study',JSON.stringify({hunger:10,fatigue:20,stress:29,uncertainty:50}));response=await post(input('interact',1,{epoch:socialEpoch}));result=await response.json();assert.equal(lastContext.socialRules.liaCanComment,true);assert.equal(lastContext.requiredIntent,'rest');assert.ok(result.agents.every(a=>a.intent==='rest'&&a.room==='salon'));assert.ok(result.agents[0].needs.stress<29);
console.log('Passed: physical encounter reassures only Noé, presentations reassure Lia, significant first shared meal relief, comment gate strictly under 30 and discussion/rest after investigation.');

assert.equal(groundIntroduction('Tu as quel âge, Lia ?','Lia','Noé',[{id:1,speaker:'Lia',content:'Moi Lia'},{id:2,speaker:'Noé',content:'Moi Noé'}]),'Tu as quel âge ?');

response=await post(input('chat',1,{epoch:socialEpoch,message:'Est-ce que vous me voyez ?'}));assert.equal(response.status,423);
const lastStory=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);lastStory.life={...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:true,studyTurns:1};lastStory.evidence=Array(4).fill('Indice confirmé');lastStory.round=18;lastStory.salonTurns=3;lastStory.finalCalled=false;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(lastStory));sqlite.prepare('UPDATE agent_state SET needs=?,room=?,intent=?').run(JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:60}),'bureau','chat');
const finalRequest=input('interact',1,{epoch:socialEpoch});response=await post(finalRequest);assert.equal(response.status,200);result=await response.json();assert.equal(result.story.humanUnlocked,true);assert.equal(result.messages.filter(m=>m.speaker==='Noé'&&m.content.includes('DH')).length,1);response=await post(finalRequest);result=await response.json();assert.equal(result.messages.filter(m=>m.speaker==='Noé'&&m.content.includes('DH')).length,1);
response=await post(input('chat',1,{epoch:socialEpoch,message:'Oui, je vous observe.'}));assert.equal(response.status,200);result=await response.json();assert.equal(result.decisions.length,2);assert.ok(lastContext.humanConversation);assert.equal(lastContext.message,'Oui, je vous observe.');assert.equal(lastContext.replyTarget.speaker,'vous');assert.equal(lastContext.replyTarget.content,'Oui, je vous observe.');assert.match(lastContext.continuation,/dernier message humain/);
response=await post(input('chat',1,{epoch:socialEpoch,message:'Quel moyen, Noé ?'}));assert.equal(response.status,200);result=await response.json();assert.equal(result.decisions[0].actor,1);assert.equal(lastContext.replyTarget.content,'Quel moyen, Noé ?');
console.log('Passed: backend human-channel lock, earned finale calls once, idempotent finale retry, unlocked pair response and human conversation context.');

// A human-directed room request in chat mode must be able to move a willing character, exactly
// like a peer-to-peer proposal does — the partner's separate agreement is not required.
const moveStory=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);
moveStory.round=17;moveStory.salonTurns=5;moveStory.life={...moveStory.life,studyTurns:0,exitSearched:true,debrief:undefined,contact:undefined};
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(moveStory));
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?').run('bureau','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}));
chatMoveAccepted=true;
response=await post(input('chat',1,{epoch:socialEpoch,message:'Va dans la chambre, s’il te plaît.'}));assert.equal(response.status,200);result=await response.json();
assert.equal(result.decisions[0].actor,1);
const queued=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).pendingDestination;
assert.equal(queued.room,'chambre');assert.equal(queued.proposer,1);
chatMoveAccepted=false;
response=await post(input('interact',1,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();
assert.ok(result.agents.every(a=>a.room==='chambre'));
assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).pendingDestination,undefined);
// Restore the pre-finale contract the tests below still rely on.
const postMove=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);postMove.finalCalled=false;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(postMove));
console.log('Passed: a chat-mode room request accepted by the addressed character actually moves them the following turn.');

const {groundScreenNotice}=await import('../.sites-runtime/test-dialogue.mjs');assert.equal(groundScreenNotice('J’ai repéré un écran dans le bureau.',[]),'J’ai repéré un écran dans le bureau.');assert.match(groundScreenNotice('On va voir cet écran au bureau ?',[]),/^J’ai repéré/);
const byRoom={};for(const room of ['bureau','salon','chambre']){const progress=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);progress.life={...progress.life,debrief:undefined,contact:undefined,credit:{1:0,2:0},studyTurns:0,tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:true,visited:["salon","cuisine","chambre","bureau"]};progress.round=5;progress.salonTurns=5;progress.pendingDestination={room,intent:room==="salon"?"rest":"chat",proposer:1};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(progress));sqlite.prepare('UPDATE agent_state SET needs=?,emotions=?,room=?,intent=?').run(JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:80}),room,'chat');response=await post(input('interact',1,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();byRoom[room]=result.agents[1].emotions.attraction;}assert.equal(byRoom.bureau,80);assert.equal(byRoom.salon,80);assert.equal(byRoom.chambre,81);
for(let i=0;i<2;i++)assert.equal((await post(input('care',1,{epoch:socialEpoch,intent:'eat'}))).status,200);assert.ok((await readWorld(db)).story.observations.some(o=>/réapparu|réapparaît/.test(o)));
console.log('Passed: screen notice without duplicate, bureau zero attraction growth, salon bonus, stronger bedroom bonus and earned food regeneration observation.');

// Divergent needs must not create a conversation across rooms or shared private facts.
sqlite.prepare('INSERT INTO conversations (speaker,content,created_at) VALUES (?,?,?)').run('Noé','On peut souffler un peu.',Date.now());
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=? WHERE id=1').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}));
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=? WHERE id=2').run('salon','chat',JSON.stringify({hunger:90,fatigue:10,stress:20,uncertainty:50}));
const beforeApart=await readWorld(db),beforeApartCalls=calls;response=await post(input('interact',1,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.notEqual(result.agents[0].room,result.agents[1].room);assert.equal(calls,beforeApartCalls);
const thoughts=result.messages.filter(m=>m.id>beforeApart.messages.at(-1).id);assert.ok(thoughts.every(m=>m.speaker.includes("pensée")&&m.room==="cuisine"||m.speaker==="Noé · déplacement"&&m.room==="salon"&&m.content.includes("cuisine")));assert.ok(thoughts.some(m=>m.speaker==="Noé · déplacement"&&m.room==="salon"));assert.ok(result.agents.every((a,i)=>a.emotions.attraction===beforeApart.agents[i].emotions.attraction));assert.ok(result.memories.some(m=>m.kind==='réflexion'));
response=await post(input('chat',1,{epoch:socialEpoch,message:'Bonjour encore.'}));assert.equal(response.status,200);assert.ok(lastContext.humanConversation.every(m=>['Lia','Noé','vous'].includes(m.speaker)));
sqlite.prepare('UPDATE world_lock SET token=?,expires_at=? WHERE id=1').run('another-tab',Date.now()+90000);const busyCalls=calls;response=await post(input('move',2,{epoch:socialEpoch,room:'salon'}));assert.equal(response.status,409);assert.equal((await response.json()).code,'world_busy');assert.equal(calls,busyCalls);sqlite.exec('UPDATE world_lock SET expires_at=0');
console.log('Passed: divergent needs produce private thoughts without remote speech or attraction bonus; human context excludes thoughts and busy moves consume no API call.');

const {groundPrivateThought}=await import('../.sites-runtime/test-dialogue.mjs');
assert.doesNotMatch(groundPrivateThought('Je m’approche de l’écran avec Noé.',1,55,20,0,[]),/écran|approche/);assert.match(groundPrivateThought('Ces chiffres me troublent.',2,80,20,0,[]),/Lia/);const firstPrivate=groundPrivateThought(undefined,2,80,20,0,[]);assert.notEqual(groundPrivateThought(firstPrivate,2,80,20,1,[firstPrivate]),firstPrivate);
const reunionStory=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);reunionStory.life={...reunionStory.life,mirrorVerified:true,foodVerified:true,debrief:undefined};reunionStory.round=10;reunionStory.apartTurns=0;reunionStory.salonTurns=3;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(reunionStory));
separatePreference=true;const separated=[];
for(let i=0;i<3;i++){
 const progress=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);progress.round=10+i;progress.salonTurns=3;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(progress));
 sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?').run('bureau','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}));
 response=await post(input('interact',1,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();separated.push(result.agents[0].room!==result.agents[1].room);
}
assert.deepEqual(separated,[true,true,false]);assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).apartTurns,0);
separatePreference=false;
// Ce script réutilise une seule session (socialEpoch) sur des centaines de tours scriptés pour
// tester des dizaines de scénarios sans tout réinitialiser à chaque fois — bien plus qu'une vraie
// partie n'en joue jamais d'affilée. dialogue_fingerprints avait fini par accumuler tout cet
// historique non lié, épuisant le stock fixe de répliques de secours de distinctReply avant même
// ce test (bug de test réel trouvé le 2026-09-16, pas un défaut de distinctReply lui-même) ; on
// l'efface ici pour donner à cette boucle un historique de dialogue propre, comme dans une vraie
// session qui n'aurait pas hérité de dizaines de scènes précédentes sans rapport.
sqlite.exec('DELETE FROM dialogue_fingerprints');
for(let i=0;i<6;i++){sqlite.prepare('UPDATE agent_state SET needs=?').run(JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}));response=await post(input('interact',1,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.equal(result.agents[0].room,result.agents[1].room);assert.equal(new Set(result.messages.filter(m=>['Lia','Noé'].includes(m.speaker)).slice(-2).map(m=>m.speaker)).size,2);}
console.log('Passed: invented shared actions and repeated thoughts filtered; explicit non-urgent separation limited to two turns, reunion on third, then six coherent shared turns.');

const {planTurn,sceneFor}=await import('../.sites-runtime/test-turn.mjs');const {groundRoomSpeech}=await import('../.sites-runtime/test-dialogue.mjs');
assert.equal(groundIntroduction('Ta présence me rassure.','Noé','Lia',[],['Lia','Noé']),'Ta présence me rassure.');assert.equal(groundIntroduction('Merci. Moi, c’est Noé.','Noé','Lia',[],['Lia','Noé']),'Merci.');assert.doesNotMatch(groundScreenNotice('J’ai repéré un écran dans le bureau. Tu veux y retourner ?',[],true),/repéré/);
assert.doesNotMatch(groundRoomSpeech('Reprenons notre examen de cet écran pour voir les données.','salon',[]),/Reprenons/);assert.equal(groundRoomSpeech('Je repense au message de l’écran du bureau.','salon',[]),'Je repense au message de l’écran du bureau.');assert.equal(groundRoomSpeech('Je lis un livre.','salon',[{id:1,speaker:'Noé',content:'Cet écran me trouble.'}]),'Je lis un livre.');
const socialBase=(await readWorld(db)).agents.map(a=>({...a,room:'salon',intent:'chat',cycle:3,needs:{hunger:10,fatigue:10,stress:20,uncertainty:50},emotions:{...a.emotions,attraction:80,trust:80}}));const basePlot={...newStory(),life:{...newStory().life,visited:["salon","cuisine","chambre","bureau"],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:true},round:21,introduced:true,met:true,sharedMeal:true};
assert.equal(planTurn('interact',socialBase[1],socialBase[0],basePlot,true,true,'hug',[]).offer,'hug');assert.equal(planTurn('interact',socialBase[1],socialBase[0],basePlot,false,true,'hug',[]).offer,'hug');assert.equal(planTurn('interact',socialBase[1],socialBase[0],basePlot,true,false,'hug',[]).offer,undefined);assert.equal(planTurn('interact',socialBase[1],{...socialBase[0],needs:{...socialBase[0].needs,stress:30}},basePlot,true,false,'hug',[]).liaison.liaCanTease,false);assert.equal(planTurn('interact',socialBase[1],socialBase[0],basePlot,true,false,'hug',[]).liaison.liaCanTease,true);assert.equal(sceneFor(socialBase[0],'rest').deskScreenVisible,false);
// Even a provider inventing screen reading is corrected before dialogue AND memory are stored.
sceneMismatch=true;const oldPlot=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);oldPlot.life={...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:true};oldPlot.introduced=true;oldPlot.round=15;oldPlot.salonTurns=0;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(oldPlot));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:20}));
response=await post(input('interact',1,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.ok(result.messages.slice(-2).every(m=>!m.content.includes('Moi, c’est')));assert.ok(result.messages.slice(-2).every(m=>!m.content.includes('Reprenons notre examen')));assert.ok(result.memories.slice(0,2).every(m=>!m.content.includes('examen')));sceneMismatch=false;
// Planned affectionate turn still uses one request and respects both decisions.
honorOffer=true;affection=false;refuse=false;sqlite.exec('DELETE FROM world_requests');const giftPlot={...oldPlot,round:20,salonTurns:0};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(giftPlot));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,cycle=?,needs=?,emotions=?').run('salon','chat',3,JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:80,trust:80}));sqlite.prepare('INSERT INTO conversations (speaker,content,created_at) VALUES (?,?,?)').run('Lia','J’aime bien ces moments ensemble.',Date.now());const offerCalls=calls;response=await post(input('interact',1,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.equal(calls,offerCalls+2);assert.equal(result.proposalActor,2);assert.equal(result.affectionOutcome,'accepted');assert.ok(result.sharedAffection);assert.equal(result.agents[0].room,result.agents[1].room);honorOffer=false;
assert.ok(sqlite.prepare("EXPLAIN QUERY PLAN SELECT content FROM memories WHERE kind='scenario' ORDER BY id DESC LIMIT 1").all().some(r=>r.detail.includes('idx_memories_kind_id')));
console.log('Passed: permanent introductions, known screen, grounded location and corrected memory, gentle-comment stress gate, planned Noé initiative, one-request mutual gesture and indexed preserved memory.');

// Exact reported case: an accepted visit is durable and outranks the lounge linger.
const replayPlot={...newStory(),life:{...newStory().life,visited:["salon","cuisine","chambre","bureau"],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:true},round:17,introduced:true,met:true,sharedMeal:true,salonTurns:5};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(replayPlot));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:40,trust:80}));replayScene=true;
let sceneCalls=calls;response=await post(input('interact',2,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.ok(result.agents.every(a=>a.room==='salon'));assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).pendingDestination.room,'bureau');assert.equal(calls,sceneCalls+2);
const agreedRequest=input('interact',2,{epoch:socialEpoch});response=await post(agreedRequest);assert.equal(response.status,200);result=await response.json();assert.ok(result.agents.every(a=>a.room==='bureau'&&a.intent==='study'));assert.ok(result.messages.filter(m=>['Lia','Noé'].includes(m.speaker)).slice(-2).every(m=>m.room==='bureau'));assert.ok(result.messages.slice(-2).some(m=>m.content.includes('décoder ces données')));assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).pendingDestination,undefined);const replayCalls=calls;assert.equal((await post(agreedRequest)).status,200);assert.equal(calls,replayCalls);replayScene=false;
// New kindness cause can change attraction in the bureau, whose activity bonus stays zero.
const {receivedAffectionBonus}=await import('../.sites-runtime/test-relationship.mjs');assert.equal(receivedAffectionBonus('Ta présence m’apaise.'),2);assert.equal(receivedAffectionBonus('Un café me fait du bien.'),0);assert.equal(receivedAffectionBonus('Je ne suis pas bien avec toi.'),0);assert.equal(receivedAffectionBonus('Merci, c’est gentil.'),1);
const tendernessPlot={...replayPlot,round:5,salonTurns:3};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(tendernessPlot));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('bureau','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:80,trust:80}));tenderScene=true;const gentleRequest=input('interact',2,{epoch:socialEpoch});response=await post(gentleRequest);assert.equal(response.status,200);result=await response.json();assert.ok(result.agents.every(a=>a.emotions.attraction===80));const gentleCalls=calls;assert.equal((await post(gentleRequest)).status,200);assert.equal(calls,gentleCalls);assert.ok((await readWorld(db)).agents.every(a=>a.emotions.attraction===80));tenderScene=false;
assert.doesNotMatch(groundRoomSpeech('On regarde de plus près ce texte et ces chiffres pour voir ce qu’ils signifient.','salon',[]),/On regarde/);assert.doesNotMatch(groundRoomSpeech('Oui, penchons-nous là-dessus pour essayer de décoder ces données.','salon',[]),/penchons-nous/);
console.log('Passed: exact salon-to-bureau case, durable accepted move, frozen Gemini room schema, actual decoding only on arrival, consumed agreement, zero-call duplicate and received tenderness as a separate attraction cause.');

const blockedPlot={...replayPlot,pendingDestination:{room:'bureau',intent:'study',proposer:2}};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(blockedPlot));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}));sqlite.prepare('UPDATE agent_state SET needs=? WHERE id=2').run(JSON.stringify({hunger:90,fatigue:10,stress:20,uncertainty:50}));sqlite.exec('UPDATE world_lock SET last_auto=0');const blockedCalls=calls;response=await post(input('autonomous',2,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.equal(calls,blockedCalls);assert.equal(result.agents[1].intent,'eat');assert.equal(result.agents[1].needs.fatigue,25);assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).pendingDestination.room,'bureau');response=await post(input('interact',2,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.ok(result.agents.every(a=>a.room==='bureau'));assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).pendingDestination,undefined);
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(tendernessPlot));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('bureau','chat',JSON.stringify({hunger:10,fatigue:10,stress:0,uncertainty:50}),JSON.stringify({...steady,attraction:80,trust:80}));sqlite.exec("DELETE FROM conversations");tenderScene=true;response=await post(input('interact',2,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.equal(result.agents[0].emotions.attraction,81);assert.equal(result.agents[1].emotions.attraction,80);tenderScene=false;
assert.doesNotMatch(groundRoomSpeech('On peut regarder ces chiffres de plus près.','salon',[]),/On peut regarder/);assert.doesNotMatch(groundRoomSpeech('Regarde ces données.','salon',[]),/Regarde ces/);
console.log('Passed: urgent meal uses zero API calls, preserves the agreed destination and Noé post-meal fatigue; reunion resumes it, and received warmth uses Lia low-stress multiplier without changing office activity bonus.');

sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?').run('salon','chat',JSON.stringify({hunger:90,fatigue:10,stress:20,uncertainty:50}));sqlite.exec('UPDATE world_lock SET last_auto=0');const simultaneousCalls=calls;response=await post(input('autonomous',2,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.equal(calls,simultaneousCalls);assert.ok(result.agents.every(a=>a.intent==='eat'&&a.room==='cuisine'&&a.needs.hunger<68));assert.equal(result.decisions.length,2);
console.log('Passed: simultaneous urgent needs are resolved locally for both residents with zero Gemini calls.');

// Regression: an odd cycle sum must not suppress Noé forever; the model cannot omit his question.
sqlite.exec('DELETE FROM world_requests');
const actionPlot={...newStory(),life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:true},round:20,introduced:true,met:true,sharedMeal:true,salonTurns:0,pendingDestination:{room:'bureau',intent:'study',proposer:1}};
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(actionPlot));
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,cycle=?,needs=?,emotions=? WHERE id=?').run('salon','chat',1,JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:89,trust:80}),1);
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,cycle=?,needs=?,emotions=? WHERE id=?').run('salon','chat',0,JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:100,trust:80}),2);
sqlite.prepare('INSERT INTO conversations (speaker,content,created_at) VALUES (?,?,?)').run('Lia','Ces moments avec toi me plaisent.',Date.now());
honorOffer=true;const actionCalls=calls;response=await post(input('interact',1,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();
assert.equal(calls,actionCalls+2);assert.equal(result.proposalActor,2);assert.equal(result.sharedAffection,'hug');assert.match(result.decisions[0].reply,/(?:bras|câlin).*\?/);assert.equal(lastContext.turnPlan.proposalLine,result.decisions[0].reply);
honorOffer=false;response=await post(input('interact',1,{epoch:socialEpoch}));result=await response.json();assert.equal(result.proposalActor,null);assert.ok(result.agents.every(a=>a.room==='salon'));
const paused=planTurn('interact',socialBase[0],socialBase[1],actionPlot,true,false,'hug',[]);assert.equal(paused.executeAgreement,false);assert.equal(paused.intent,'rest');assert.equal(planTurn('interact',socialBase[0],socialBase[1],{...actionPlot,salonTurns:5},true,false,'hug',[]).executeAgreement,true);
const {groundAgeQuestion,conversationFocus}=await import('../.sites-runtime/test-dialogue.mjs');
assert.doesNotMatch(groundAgeQuestion('Tu as quel âge ? Cette maison est étrange.',false),/âge/);assert.doesNotMatch(groundAgeQuestion('Tu as quel âge ?',true,['Lia'],'Lia'),/âge/);
assert.equal(groundAgeQuestion('Tu as quel âge ?',true,[],'Lia'),'Tu as quel âge ?');assert.doesNotMatch(conversationFocus([],socialBase[0],socialBase[1],[],false),/demande naturellement l’âge/);assert.equal(storyContext({...actionPlot,round:4}).ageQuestionAllowed,false);assert.equal(storyContext(actionPlot).ageQuestionAllowed,true);
console.log('Passed: odd-cycle Noé at 100% and Lia at 89% makes an explicit mutually accepted hug despite a queued bureau visit; cooldown, five-turn lounge pause, delayed ages and permanent age-question guard.');
assert.equal(planTurn('interact',{...socialBase[1],emotions:{...socialBase[1].emotions,attraction:79}},socialBase[0],basePlot,true,true,'hug',[]).offer,undefined);
sqlite.exec('DELETE FROM world_requests');sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify({...actionPlot,pendingDestination:undefined,life:{...actionPlot.life,personalAsked:true}}));
sqlite.prepare('UPDATE agent_state SET emotions=?,room=?,intent=?,needs=? WHERE id=1').run(JSON.stringify({...steady,attraction:40,trust:80}),'salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}));
sqlite.prepare('UPDATE agent_state SET emotions=?,room=?,intent=?,needs=? WHERE id=2').run(JSON.stringify({...steady,attraction:80,trust:80}),'salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}));
sqlite.prepare('INSERT INTO conversations (speaker,content,created_at) VALUES (?,?,?)').run('Lia','Discutons un peu.',Date.now());honorOffer=true;
response=await post(input('interact',1,{epoch:socialEpoch,requestId:'00000000-0000-4000-8000-000000000001'}));assert.equal(response.status,200);result=await response.json();assert.equal(result.proposalActor,2);assert.equal(result.sharedAffection,null);assert.equal(result.affectionOutcome,'declined');assert.equal(result.decisions[1].affectionAccepted,false);assert.match(result.decisions[1].reply,/Non|Pas maintenant|ralentir|pas prête/);honorOffer=false;
console.log('Passed: Noé cannot plan a proposal at 79%, can attempt at 80% without sufficient mutual attraction, receives a refusal and never performs contact without reciprocity.');

const {explicitGestureConsent}=await import("../.sites-runtime/test-dialogue.mjs");assert.equal(explicitGestureConsent("Oui, ce répit tombe à pic avant de replonger dans nos énigmes."),false);assert.equal(explicitGestureConsent("C’est vrai, avec toi ici, le reste s’efface complètement."),false);assert.equal(explicitGestureConsent("Oui, j’en ai envie aussi."),true);assert.equal(explicitGestureConsent("Je ne suis pas prête."),false);console.log("Passed: latest human message overrides resident continuation and generic positive replies cannot authorize physical contact.");

// Major evolution: real scene sequence and preserved old rows under the new room migration.
response=await post(input('reset',1,{epoch:socialEpoch}));result=await response.json();const majorEpoch=result.epoch;
const majorPlot={...newStory(),round:2,met:true,introduced:true,sharedMeal:false,life:{...newStory().life,visualIntro:2}};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(majorPlot));
flat=true;affection=false;honorOffer=false;sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:70}),JSON.stringify({...steady,attraction:40,trust:60}));
// L'ordre de visite (cuisine/chambre) est mélangé par session depuis le 2026-09-17 : on calcule
// l'ordre réel de ce seed plutôt que de supposer "cuisine d'abord" (retour utilisateur du
// 2026-09-17 sur le squelette d'enquête trop prévisible).
const [firstExplore,secondExplore]=seedPick(majorPlot.seed,"explore-order",[["cuisine","chambre"],["chambre","cuisine"]]);
const exploreObservation={cuisine:'réapparaît',chambre:'dégradé gris'};
response=await post(input('interact',1,{epoch:majorEpoch}));assert.equal(response.status,200);result=await response.json();assert.ok(result.agents.every(a=>a.room===firstExplore));assert.ok(result.story.observations.some(o=>o.includes(exploreObservation[firstExplore])));assert.ok(result.messages.slice(-2).every(m=>m.room===firstExplore));assert.ok(result.agents.every(a=>a.attachment===0));
response=await post(input('interact',1,{epoch:majorEpoch}));result=await response.json();assert.ok(result.agents.every(a=>a.room===secondExplore));assert.ok(result.story.observations.some(o=>o.includes(exploreObservation[secondExplore])));
// Seuil télé mélangé par session depuis le 2026-09-17 (était fixe à 6) : le nombre de tours de
// repos avant qu'elle ne s'allume dépend désormais du seuil réel de ce seed, pas d'une constante.
const tvThreshold=seedPick(majorPlot.seed,"tv-threshold",[5,6,7,8,9]);
// La pause forcée au salon ("linger") ne dure que 3 tours quel que soit le seuil télé : au-delà,
// les personnages restent au salon mais en discussion normale, pas nécessairement "rest" — seule
// la présence au salon est un invariant garanti ici, pas l'intent exact de chaque tour transitoire.
for(let i=0;i<Math.max(0,tvThreshold-4);i++){response=await post(input('interact',1,{epoch:majorEpoch}));result=await response.json();assert.ok(result.agents.every(a=>a.room==='salon'));}
response=await post(input('interact',1,{epoch:majorEpoch}));result=await response.json();assert.ok(result.agents.every(a=>a.intent==='tv'));assert.equal(result.story.life.tvSeen,true);
const officePlot={...parseStory(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content),round:17,salonTurns:5,pendingDestination:{room:'bureau',intent:'study',proposer:2}};officePlot.life.debrief=undefined;officePlot.life.studyTurns=0;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(officePlot));sqlite.prepare('UPDATE agent_state SET intent=?,needs=?').run('chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:70}));
response=await post(input('interact',2,{epoch:majorEpoch}));result=await response.json();assert.ok(result.agents.every(a=>a.room==='bureau'));assert.equal(result.story.evidence.length,0);
response=await post(input('interact',2,{epoch:majorEpoch}));result=await response.json();assert.equal(result.story.evidence.length,1);assert.equal(result.story.life.debrief.remaining,2);
response=await post(input('interact',2,{epoch:majorEpoch}));result=await response.json();assert.ok(result.agents.every(a=>a.room==='salon'));assert.equal(result.story.life.debrief.remaining,1);
const awakePlot=parseStory(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);awakePlot.evidence=Array(5).fill('Origine établie');awakePlot.finalCalled=true;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(awakePlot));
sqlite.prepare('UPDATE agent_state SET intent=?,needs=? WHERE id=2').run('sleep',JSON.stringify({hunger:10,fatigue:80,stress:20,uncertainty:50}));const sleepCalls=calls;
// Noé dort, mais Lia est éveillée : elle répond à sa place plutôt que de bloquer tout l'échange
// (retour utilisateur du 2026-09-17, audit du ciblage des messages) — un vrai appel est donc fait.
response=await post(input('chat',2,{epoch:majorEpoch,message:'Noé, vous m’entendez ?'}));assert.equal(response.status,200);result=await response.json();assert.equal(result.decisions[0].actor,1);assert.match(lastContext.continuation,/dort/);
sqlite.exec('UPDATE world_lock SET last_auto=0');response=await post(input('autonomous',2,{epoch:majorEpoch}));assert.equal(response.status,200);assert.equal(calls,sleepCalls+1);assert.equal((await response.json()).agents[1].intent,'sleep');
// Les deux endormis à la fois : là, et seulement là, l'échange reste vraiment bloqué.
sqlite.prepare('UPDATE agent_state SET intent=?,needs=? WHERE id=1').run('sleep',JSON.stringify({hunger:10,fatigue:80,stress:20,uncertainty:50}));
response=await post(input('chat',2,{epoch:majorEpoch,message:'Il y a quelqu’un ?'}));assert.equal(response.status,423);assert.equal(calls,sleepCalls+1);
sqlite.prepare('UPDATE agent_state SET intent=?,room=?,needs=? WHERE id=2').run('chat','bureau',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}));sqlite.prepare('UPDATE agent_state SET intent=?,room=?,needs=? WHERE id=1').run('chat','salon',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}));
response=await post(input('chat',1,{epoch:majorEpoch,message:'Noé, je vais désactiver la simulation.'}));result=await response.json();assert.equal(result.decisions[0].actor,1);assert.equal(result.agents[0].room,'salon');assert.equal(result.agents[1].room,'bureau');assert.ok(result.agents[0].needs.stress>20);
const stressed=result.agents[0].needs.stress;response=await post(input('chat',1,{epoch:majorEpoch,message:'Je veux vous aider et vous protéger.'}));result=await response.json();assert.ok(result.agents[0].needs.stress<stressed);
assert.equal(receivedAffectionBonus('Je ne te laisserai pas seule.'),2);assert.ok(result.agents.every(a=>a.emotions.attraction>=0&&a.emotions.attraction<=100));assert.ok(result.agents.every(a=>a.attachment>=0&&a.attachment<=100));
console.log('Passed: initial kitchen/bedroom discovery, regeneration/mirror, retained room stamps, two salon debriefs, TV, two-pass evidence and debrief, awake partner answers for a sleeping addressee (both-asleep still blocks), selected human priority across speaker rooms, stress from threat and reassurance, attachment bounds.');

// Recovered sleepers must leave their state even when the other resident leads.
{const plot=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);plot.life.sleepTurns={1:2,2:2};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));}
sqlite.prepare('UPDATE agent_state SET intent=?,needs=? WHERE id=2').run('sleep',JSON.stringify({hunger:2,fatigue:4,stress:0,uncertainty:30}));
response=await post(input('move',1,{epoch:majorEpoch,room:'salon'}));assert.equal(response.status,200);result=await response.json();assert.equal(result.agents[1].intent,'none');
sqlite.prepare('UPDATE agent_state SET intent=?,needs=? WHERE id=2').run('sleep',JSON.stringify({hunger:2,fatigue:25,stress:0,uncertainty:30}));const beforeWakeCalls=calls;response=await post(input('interact',2,{epoch:majorEpoch}));assert.equal(response.status,200);result=await response.json();assert.equal(calls,beforeWakeCalls);assert.equal(result.agents[1].intent,'none');
fs.writeFileSync('.sites-runtime/test-evidence.mjs',transpile(fs.readFileSync('lib/evidence.ts','utf8').replace('"./perception"','"./test-perception.mjs"')));const {evidenceLedger}=await import('../.sites-runtime/test-evidence.mjs');let ledger=evidenceLedger([],[],false);assert.ok(ledger.every(p=>!p.discovered));ledger=evidenceLedger(['Un livre de reconstruction autobiographique'],['Deux ombres figées dans le miroir'],true);assert.ok(ledger.find(p=>p.id==='book').discovered);assert.ok(ledger.find(p=>p.id==='mirror').discovered);assert.ok(ledger.find(p=>p.id==='tv').discovered);assert.ok(!ledger.find(p=>p.id==='code').discovered);
assert.equal(result.story.life.remoteFound,true);assert.ok(fs.readFileSync('app/page.tsx','utf8').includes('Promise.race'));assert.ok(!fs.readFileSync('app/page.tsx','utf8').includes('Prendre soin'));assert.ok(fs.readFileSync('components/house-view.tsx','utf8').includes('.project(camera)'));console.log('Passed: recovered sleepers wake through local turns with zero inference, shared evidence legend, persisted remote discovery and bounded animation wait.');

// Cold opening and both corridor inspections are exceptional zero-inference scenes.
response=await post(input('reset',1,{epoch:majorEpoch}));result=await response.json();const finalEpoch=result.epoch;
const openingCalls=calls;response=await post(input('interact',2,{epoch:finalEpoch}));result=await response.json();assert.equal(calls,openingCalls);assert.equal(Boolean(result.story.introduced),false);assert.ok(result.agents[0].needs.stress>=80);assert.equal(result.agents[1].needs.stress,30);assert.ok(result.decisions.every(d=>!/(?:m'appelle|moi c’est|moi, c’est)/i.test(d.reply)));
flat=true;affection=false;honorOffer=false;refuse=false;
// round:10 (était 8) : couvre la plage complète du seuil de sortie mélangé par session (7 à 10,
// 2026-09-17) pour que ce test déclenche l'inspection quel que soit le seed tiré.
const corridorPlot={...newStory(),round:10,met:true,introduced:true,sharedMeal:true,life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:false}};
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(corridorPlot));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:70}),JSON.stringify({...steady,attraction:40,trust:60}));
const exitCalls=calls;for(let i=1;i<=2;i++){response=await post(input('interact',2,{epoch:finalEpoch}));assert.equal(response.status,200);result=await response.json();assert.equal(calls,exitCalls);assert.equal(result.story.life.exitPhase,i);assert.ok(result.messages.filter(m=>['Lia','Noé'].includes(m.speaker)).slice(-2).every(m=>m.room==='couloir'));assert.equal(result.agents[0].emotions.attraction,40);}
assert.equal(result.story.life.exitSearched,true);assert.equal(result.story.life.debrief.remaining,2);assert.ok(result.story.observations.some(o=>o.includes('deux portes du couloir')));
for(let i=1;i>=0;i--){response=await post(input('interact',2,{epoch:finalEpoch}));result=await response.json();assert.equal(result.story.life.debrief?.remaining??0,i);assert.ok(result.agents.every(a=>a.room==='salon'));}
console.log('Passed: unnamed cold opening and two corridor ends use zero Gemini calls; no salon attraction bonus in corridor and two complete subsequent debrief turns.');

sqlite.exec('DELETE FROM world_requests');sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
const proposalPlot={...actionPlot,pendingDestination:undefined,life:{...actionPlot.life,personalAsked:true,proposalMade:false}};
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(proposalPlot));
for(const id of [1,2])sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:70}),JSON.stringify({...steady,attraction:id===1?40:80,trust:80}),id);
honorOffer=true;response=await post(input('interact',2,{epoch:finalEpoch,requestId:'00000000-0000-4000-8000-000000000003'}));result=await response.json();assert.equal(result.proposalActor,2);assert.equal(result.affectionOutcome,'declined');assert.equal(result.agents[0].needs.stress,28);assert.equal(result.agents[1].needs.stress,32);assert.ok(result.agents[1].emotions.attraction<=77);assert.ok(result.agents[1].needs.hunger>=16);assert.ok(result.agents[1].needs.fatigue>=15);assert.equal(result.story.life.proposalMade,true);assert.equal(result.story.life.debrief.remaining,2);honorOffer=false;
for(let i=1;i>=0;i--){response=await post(input('interact',2,{epoch:finalEpoch}));result=await response.json();assert.equal(result.proposalActor,null);assert.equal(result.story.life.debrief?.remaining??0,i);}
// A model-generated approach must still be penalised when the planner disallows pressure.
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify({...proposalPlot,round:30,life:{...proposalPlot.life,proposalMade:true}}));sqlite.exec('DELETE FROM world_requests');
for(let i=0;i<3;i++)sqlite.prepare('INSERT INTO world_requests VALUES (?,?,?)').run(crypto.randomUUID(),JSON.stringify({proposalActor:2,affectionOutcome:'declined'}),Date.now()+i);
sqlite.prepare('INSERT INTO conversations (speaker,content,created_at) VALUES (?,?,?)').run('Lia','Tu peux arrêter de me proposer ça ?',Date.now());
for(const id of [1,2])sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:70}),JSON.stringify({...steady,attraction:id===1?65:90,trust:80}),id);
affection=true;response=await post(input('interact',2,{epoch:finalEpoch}));result=await response.json();assert.equal(result.sharedAffection,null);assert.ok(result.agents[0].needs.stress>=30);assert.ok(result.agents[0].emotions.attraction<=59);assert.ok(result.decisions.find(d=>d.actor===1).reply.includes('tu insistes'));affection=false;
console.log('Passed: first approach raises both stress levels, refusal affects Noé attraction/hunger/fatigue, two debriefs block re-proposal and excessive model-generated pressure triggers Lia explicit reproach.');

// A personal answer must cause its bonus near that question, never arbitrarily later.
sqlite.exec('DELETE FROM world_requests');sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
const personalPlot={...proposalPlot,round:16,life:{...proposalPlot.life,personalAsked:false,personalBoosted:false}};
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(personalPlot));
for(const id of [1,2])sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:0,uncertainty:70}),JSON.stringify({...steady,attraction:id===1?40:70,trust:80}),id);
const simulatedFetch=globalThis.fetch;
globalThis.fetch=async(...args)=>{const r=await simulatedFetch(...args),data=await r.json();const decision=JSON.parse(data.candidates[0].content.parts[0].text);decision.reply=isPartnerRequest(args)?'Un type qui parle parfois trop. Mais quand tu dis non, je sais m’arrêter.':'T’es quel genre d’homme, Noé ?';data.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(data);};
response=await post(input('interact',1,{epoch:finalEpoch}));result=await response.json();assert.equal(result.decisions[0].actor,1);assert.equal(result.story.life.personalAsked,true);assert.equal(result.story.life.personalRound,16);assert.equal(result.story.life.personalBoosted,false);globalThis.fetch=simulatedFetch;
tenderScene=true;globalThis.fetch=async(...args)=>{const r=await simulatedFetch(...args),data=await r.json(),decision=JSON.parse(data.candidates[0].content.parts[0].text);if(!isPartnerRequest(args))decision.reply='Ta réponse me plaît. J’aime que tu saches reconnaître tes défauts.';data.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(data);};response=await post(input('interact',2,{epoch:finalEpoch}));result=await response.json();assert.equal(result.story.life.personalBoosted,true);
const latePlot={...personalPlot,round:30,life:{...personalPlot.life,personalAsked:true,personalRound:16,personalBoosted:false}};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(latePlot));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
response=await post(input('interact',2,{epoch:finalEpoch}));result=await response.json();assert.equal(result.story.life.personalBoosted,false);tenderScene=false;globalThis.fetch=simulatedFetch;
const {truthfulGender,distinctReply}=await import('../.sites-runtime/test-drama.mjs');assert.equal(truthfulGender('Je suis attentive. Je suis curieuse.',2),'Je suis attentif. Je suis curieux.');assert.equal(truthfulGender('Je suis rassuré. j’suis humain.',1),'Je suis rassurée. j’suis humaine.');assert.notEqual(distinctReply('On fait une pause.',1,'salon',[{content:'On fait une pause.'}],10,80),'On fait une pause.');
console.log('Passed: personal-question memory, unique contextual attraction boost, no late unrelated bonus, accented gender agreement and local repetition guard.');

// Nickname is transactional data and must never leak before the observation record.
response=await post(input('reset',1,{epoch:finalEpoch}));result=await response.json();const perceptionEpoch=result.epoch;const nicknameCalls=calls;
assert.equal((await post(input('identify',1,{epoch:perceptionEpoch,message:'   '}))).status,400);
const identify=input('identify',1,{epoch:perceptionEpoch,message:'Spectateur ◇'});response=await post(identify);assert.equal(response.status,200);result=await response.json();assert.equal(calls,nicknameCalls);assert.equal(result.story.observer,'Spectateur ◇');assert.equal((await post(identify)).status,200);assert.equal(calls,nicknameCalls);
const {investigationTarget}=await import('../.sites-runtime/test-story.mjs');let pp={...newStory(),observer:'Spectateur ◇',order:[3,0,1,2],round:10,introduced:true,met:true};assert.equal(storyContext(pp).observerLabel,undefined);assert.ok(investigationTarget(pp).includes('Spectateur ◇'));pp=advanceStory(pp,true,[],[],'bureau',true);assert.ok(pp.evidence[0].includes('Spectateur ◇'));assert.equal(storyContext(pp).observerLabel,'Spectateur ◇');assert.ok(!evidenceLedger(['Relevé de cohabitation. Identifiant observateur inscrit sur le relevé : "agents d’intelligence artificielle".'],[],false).find(p=>p.id==='dossier').discovered);

// Both appearance descriptions agree with the shared expression/ring registry.
const {appearanceFor,residentAppearance,sceneWindows,visibleScene}=await import('../.sites-runtime/test-perception.mjs');
pp={...pp,round:2,evidence:[],sharedMeal:true,life:{...newStory().life,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true}};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');sqlite.exec('DELETE FROM world_requests');flat=true;
for(const id of [1,2])sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:70}),JSON.stringify({...steady,attraction:30,trust:60}),id);
for(let i=0;i<2;i++){const beforePerception=await readWorld(db),a=beforePerception.agents[i];response=await post(input('interact',1,{epoch:perceptionEpoch}));result=await response.json();assert.equal(result.story.life.visualIntro,i+1);const answer=result.decisions.find(d=>d.actor!==a.id);assert.ok(answer.reply.includes(appearanceFor({...a,intent:'chat'}).current));assert.ok(answer.reply.includes(residentAppearance[a.id].colorName));assert.equal(lastContext.beatContext.visual,true);assert.ok(lastContext.perceivedResidents.residents.length===2);}
assert.ok(result.memories.filter(m=>m.kind==='rencontre').every(m=>/^\[salon\|\d{4}-/.test(m.content)));assert.equal(sceneWindows.filter(w=>w.room!=='couloir').length,4);for(const room of ["salon","cuisine","chambre","bureau"])assert.equal(visibleScene(room,[]).windows.length,1);

// Personal follow-up is two distinct turns; curiosity itself causes a bounded boost.
pp={...pp,round:25,life:{...newStory().life,visualIntro:2,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,personalAsked:true,personalRound:20}};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
for(const id of [1,2])sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:0,uncertainty:70}),JSON.stringify({...steady,attraction:30,trust:60}),id);
response=await post(input('interact',2,{epoch:perceptionEpoch}));result=await response.json();assert.equal(result.decisions[0].actor,1);assert.ok(["Je me demande quel genre d’homme tu es, en vrai.","J’y repense... c’est quoi ton genre, à toi, au fond ?","Y a un truc qui me travaille : c’est quoi ton genre d’homme, sérieux ?"].includes(result.decisions[0].reply));assert.ok(["Que veux-tu savoir exactement ?","Tu veux savoir quoi, au juste ?","Précise ta question, je réponds vraiment."].includes(result.decisions[1].reply));assert.equal(result.story.life.personalFollowup,1);assert.ok(result.agents[0].emotions.attraction>=34);
response=await post(input('interact',2,{epoch:perceptionEpoch}));result=await response.json();assert.ok(["T’es marié ? T’as quelqu’un dans ta vie ?","Y a quelqu’un dans ta vie, ou t’es célibataire ?","T’es engagé avec quelqu’un, ou pas du tout ?"].includes(result.decisions[0].reply));assert.equal(result.story.life.personalFollowup,3);assert.ok(result.agents[0].emotions.attraction>=38);

pp={...pp,round:30,life:{...pp.life,personalFollowup:3,ambientSeen:false}};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));response=await post(input('interact',2,{epoch:perceptionEpoch}));result=await response.json();assert.equal(result.story.life.ambientSeen,true);assert.equal(result.story.life.debrief.remaining,2);assert.ok(evidenceLedger([],result.story.observations).find(p=>p.id==='plant').discovered);assert.ok(evidenceLedger([],result.story.observations).find(p=>p.id==='speaker').discovered);
pp={...pp,evidence:['Relevé de cohabitation. Identifiant observateur inscrit sur le relevé : "Spectateur ◇".',...Array(4).fill('Preuve')],finalCalled:true,life:{...pp.life,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true}};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
for(let i=0;i<3;i++){response=await post(input('chat',1,{epoch:perceptionEpoch,message:'Bonjour, je vous écoute.'}));result=await response.json();if(i<2)assert.equal(result.story.life.observerNamed,false);else{assert.equal(result.story.life.observerNamed,true);assert.ok(result.decisions[0].reply.includes('Spectateur ◇'));}}
console.log('Passed: zero-call nickname and retry, no premature identity leak, durable personalised proof, label-injection-safe legend, shared appearance registry, room/time memories, two contextual personal follow-ups, plant/speaker debrief and one late observer identification.');

// A checkpoint cites only acquired evidence, is consumed once, and needs no inference.
pp={...pp,round:35,evidence:['Dans un livre, continuité autobiographique : reconstruction incomplète.','Un mot laissé indique : cette maison est un environnement.'],finalCalled:false,life:{...newStory().life,visualIntro:2,ambientSeen:true,ambientVerified:true,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,exitSearched:true,recapCount:0}};
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
for(const id of [1,2])sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:60}),JSON.stringify({...steady,attraction:30}),id);
const recapCalls=calls;response=await post(input('interact',2,{epoch:perceptionEpoch}));result=await response.json();assert.equal(response.status,200);assert.equal(calls,recapCalls);assert.equal(result.story.life.recapCount,2);assert.ok(['Le livre parle de reconstruction de la mémoire.','Le livre évoque une mémoire reconstruite, pas vécue.','Ce bouquin du bureau parle d’une mémoire rafistolée après coup.'].some(s=>result.decisions[0].reply.includes(s)));assert.ok(['Le mot décrit la maison comme un environnement.','Le mot laissé au bureau qualifie ça d’environnement, pas de chez-nous.','Ce mot réduit la maison à un simple environnement.'].some(s=>result.decisions[0].reply.includes(s)));assert.ok(!result.decisions[0].reply.includes('MEMOIRE GENEREE'));assert.ok(result.memories.filter(m=>m.kind==='rencontre').every(m=>!m.content.includes('Je discute avec Noé')));
// Repair legacy falsely discovered speaker by explicitly activating it, once.
pp={...pp,evidence:[],life:{...pp.life,ambientSeen:true,ambientVerified:false,recapCount:5}};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));const repairCalls=calls;const repairInput=input('interact',2,{epoch:perceptionEpoch});response=await post(repairInput);result=await response.json();assert.equal(response.status,200);assert.equal(calls,repairCalls);assert.equal(result.story.life.ambientVerified,true);// Les 6 variantes (pas seulement les 3 premières) : story.seed dépend du nombre d'appels à
// crypto.randomUUID() déjà faits dans le script (mocké en compteur global, cf. tête de fichier),
// donc tout ajout de test en amont peut légitimement faire retomber seedPick sur une autre variante
// — la lister en entier plutôt que d'en tester un sous-ensemble évite une fragilité artificielle.
assert.ok([
  'Cette plante, c’est des feuilles bleues découpées au cordeau. J’allume l’enceinte à côté… Des notes dessinées, pas un son. Même la musique est en carton ici.',
  'Regarde cette plante : des feuilles bleues, découpées au carré, pas une once de vrai. Je branche l’enceinte à côté… des notes qui dansent, mais aucun son.',
  'La plante est fausse jusque dans les nervures. J’allume l’enceinte : des notes s’animent à l’écran, rien dans l’air.',
  'Cette plante aux feuilles bleues n’a jamais poussé nulle part, ça se voit au premier coup d’œil. J’allume cette enceinte juste à côté : elle dessine des notes sans le moindre son.',
  'Cette plante ne trompe personne avec ses feuilles bleues taillées au carré. J’allume l’enceinte à côté : ça anime des notes à l’écran, silence complet dans l’air.',
  'Ces feuilles bleues géométriques n’ont jamais connu la sève. Je branche l’enceinte juste là : elle affiche des notes muettes.',
].includes(result.decisions[0].reply));assert.ok([
  'Des notes qu’on voit mais qu’on entend pas. C’est pas une panne banale. On dirait que la maison imite ce que les objets sont censés faire.',
  'Une image de musique sans musique, franchement. On dirait un décor qui copie la vie sans savoir la faire vivre.',
  'Voir sans entendre, ça résume bien cet endroit. Même le son est mis en scène ici.',
  'Une image de musique, littéralement. Ça résume assez bien cette baraque : tout est visible, rien n’existe vraiment.',
  'Du son qu’on voit sans l’entendre. Difficile de trouver plus artificiel que ça.',
  'Une apparence de musique sans la moindre vibration. Ça dit tout de cet endroit.',
].includes(result.decisions[1].reply));response=await post(repairInput);assert.equal(response.status,200);assert.equal(calls,repairCalls);
console.log('Passed: acquired-evidence-only checkpoint, zero-call local recap, truthful resident memory and idempotent explicit legacy speaker activation.');

const {dialogueProgress:progressOf,groundRoomSpeech:locatedSpeech}=await import('../.sites-runtime/test-dialogue.mjs');
assert.ok(progressOf(Array.from({length:5},(_,i)=>({id:i,speaker:'Lia',content:'Ce canapé et ce calme nous reposent.'})),['Lia : peur du silence']).overusedThemes.includes('repos et confort du salon'));
assert.ok(locatedSpeech('Ce miroir est bizarre.','salon',[]).includes('miroir de la chambre'));assert.ok(locatedSpeech('La plante et l’enceinte sont fausses.','bureau',[]).includes('plante du salon'));assert.ok(locatedSpeech('Je regarde la télévision.','salon',[]).includes('télévision'));
assert.ok(truthfulGender('Je suis un homme.',1).includes('une femme'));assert.ok(truthfulGender('Je suis une femme.',2).includes('un homme'));
// Manual entry does not discover a mirror; published observation does, with the scene colors.
pp={...pp,round:6,met:true,introduced:true,evidence:[],life:{...newStory().life,visualIntro:2,ambientSeen:true,ambientVerified:true,visited:['salon','cuisine'],mirrorVerified:false,foodVerified:true,personalAsked:true}};
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
for(const id of [1,2])sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:60}),JSON.stringify({...steady,attraction:20}),id);
response=await post(input('move',1,{epoch:perceptionEpoch,room:'chambre'}));result=await response.json();assert.equal(result.story.life.mirrorVerified,false);assert.ok(!result.story.observations.some(o=>/miroir/.test(o)));
sqlite.prepare('UPDATE agent_state SET room=?,intent=?').run('chambre','chat');sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));
const priorFetch=globalThis.fetch;globalThis.fetch=async(...args)=>{const r=await priorFetch(...args),data=await r.json();const decision=JSON.parse(data.candidates[0].content.parts[0].text);decision.contribution=isPartnerRequest(args)?'Question sur notre reflet':'Constat du miroir figé';data.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(data);};
response=await post(input('interact',1,{epoch:perceptionEpoch}));result=await response.json();globalThis.fetch=priorFetch;assert.equal(response.status,200);assert.equal(result.story.life.mirrorVerified,true);
// Les 6 variantes (même remarque que pour l'enceinte : seedPick dépend du compteur global de
// crypto.randomUUID(), donc un sous-ensemble serait fragile à tout ajout de test en amont).
assert.ok(result.decisions.some(d=>["Le miroir rectangulaire fait un dégradé bleu-gris-blanc. Il est debout dans un coin ; sa surface grise ne renvoie aucun reflet quand on bouge.","Ce miroir debout dans le coin ne renvoie rien : juste un dégradé gris-bleu qui reste immobile pendant qu'on bouge.","La surface du miroir, dans son coin, fait un gris terne et froid. On a beau remuer devant, rien ne suit.","Un miroir rectangulaire est planté dans le coin, dégradé bleu-gris-blanc du haut en bas. On passe la main devant : aucun reflet ne bouge avec nous.","Ce bloc de verre gris dans le coin n'a rien d'un vrai miroir. Le dégradé bleu-blanc reste fixe, quoi qu'on fasse devant.","Dans le coin, une plaque grise en dégradé qu'on appelle miroir par habitude. Elle ne renvoie ni visage ni mouvement."].some(s=>d.reply.includes(s))));assert.ok(result.story.life.contributions.some(c=>c.includes('Constat du miroir')));
// Solo discovery (2026-09-17): Lia alone in the bedroom, Noé kept apart (same mechanism as the
// existing "independent non-urgent separation" test above: separatePreference + stayAlone) — the
// mirror becomes her own private reflection, not a line spoken to an absent partner, known only
// to her until the recall reunites them.
flat=true;affection=false;honorOffer=false;refuse=false;
pp={...pp,round:20,apartTurns:0,life:{...pp.life,mirrorVerified:false,mirrorKnownBy:[],debrief:undefined,dispute:undefined,contact:undefined,salonTurns:5}};
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=1').run('chambre','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:60}),JSON.stringify({...steady,attraction:20}));
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=2').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:60}),JSON.stringify({...steady,attraction:20}));
separatePreference=true;
response=await post(input('interact',1,{epoch:perceptionEpoch}));result=await response.json();
separatePreference=false;
assert.equal(response.status,200);
assert.equal(result.agents[0].room,'chambre');assert.notEqual(result.agents[1].room,'chambre');
assert.equal(result.story.life.mirrorVerified,false);
assert.deepEqual(result.story.life.mirrorKnownBy,[1]);
const liaSolo=result.messages.filter(m=>m.speaker==='Lia · pensée').at(-1);
assert.ok(liaSolo&&["Le miroir rectangulaire fait un dégradé bleu-gris-blanc. Il est debout dans un coin ; sa surface grise ne renvoie aucun reflet quand on bouge.","Ce miroir debout dans le coin ne renvoie rien : juste un dégradé gris-bleu qui reste immobile pendant qu'on bouge.","La surface du miroir, dans son coin, fait un gris terne et froid. On a beau remuer devant, rien ne suit.","Un miroir rectangulaire est planté dans le coin, dégradé bleu-gris-blanc du haut en bas. On passe la main devant : aucun reflet ne bouge avec nous.","Ce bloc de verre gris dans le coin n'a rien d'un vrai miroir. Le dégradé bleu-blanc reste fixe, quoi qu'on fasse devant.","Dans le coin, une plaque grise en dégradé qu'on appelle miroir par habitude. Elle ne renvoie ni visage ni mouvement."].some(s=>liaSolo.content.includes(s)));
assert.ok(!result.messages.some(m=>m.speaker==='Noé'&&/miroir/.test(m.content)));
// Reunited in the salon: the recall informs the absent partner for the first time.
pp={...JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content),round:20,salonTurns:1};
pp.life.debrief=undefined;pp.life.contact=undefined;pp.life.dispute=undefined;pp.life.tvSeen=true;pp.life.exitSearched=true;
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('salon','rest',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:60}),JSON.stringify({...steady,attraction:20}));
response=await post(input('interact',1,{epoch:perceptionEpoch}));result=await response.json();
assert.equal(response.status,200);
assert.equal(result.story.life.mirrorVerified,true);

assert.deepEqual(new Set(result.story.life.mirrorKnownBy),new Set([1,2]));
assert.ok(result.decisions.some(d=>d.actor===1&&["Un truc à te dire : dans la chambre, il y a un miroir qui ne reflète rien. J'ai bougé devant, rien ne suit.","Écoute, dans la chambre il y a un miroir bizarre : dégradé gris-bleu, et aucun reflet ne bouge avec toi.","Il faut que je te parle de ce miroir dans la chambre. Un dégradé gris, sans le moindre reflet mobile.","J'ai un truc à te raconter : ce miroir dans la chambre ne renvoie rien du tout.","Tant que j'y pense : la chambre a un miroir qui ne reflète rien, juste ce dégradé gris terne.","Une chose à te signaler : dans la chambre, ce miroir ne renvoie ni visage ni mouvement, seulement du gris."].some(s=>d.reply.includes(s))));
console.log('Passed: exhausted-theme direction, contribution memory, explicit remote object references, fixed gender identity and mirror validation only with a published observation.');

{
const {roomAnchors,residentDestination,blocked,pathBetween,centers,rooms}=await import('../.sites-runtime/test-house.mjs');
let checked=0;for(const [room,anchors] of Object.entries(roomAnchors))for(const [key,pair] of Object.entries(anchors)){assert.notDeepEqual(pair[0],pair[1]);for(const point of pair){assert.ok(!blocked(...point,room==='jardin'),room+' '+key+' blocked');for(const origin of Object.entries(centers).filter(([room])=>room!=="jardin").map(([,center])=>center)){const route=pathBetween(origin,point,room==="jardin");assert.ok(route.length,room+' '+key+' unreachable');assert.ok(route.every(p=>!blocked(...p,room==="jardin")));assert.deepEqual(route.at(-1),point);checked++;}}}
for(const room of rooms)for(const id of [1,2])for(const intent of ['chat','rest','eat','sleep','share_sleep','study','tv','hug','massage']){const agent={room,id,intent,activity:''};const p=residentDestination(agent);assert.ok(!blocked(...p));assert.deepEqual(p,residentDestination(agent));}
assert.deepEqual(residentDestination({id:1,room:'salon',intent:'chat',activity:'J’allume l’enceinte'}),roomAnchors.salon.speaker[0]);assert.deepEqual(residentDestination({id:2,room:'bureau',intent:'study',activity:'Je lis le livre'}),roomAnchors.bureau.book[1]);
const {sceneObjects}=await import('../.sites-runtime/test-perception.mjs');assert.ok(sceneObjects.plant.leaves>=3);assert.ok(visibleScene('chambre',[]).anomalies[0].includes('debout'));assert.ok(!visibleScene('chambre',[]).anomalies[0].includes('ombres'));
assert.deepEqual(residentDestination({id:1,room:'bureau',intent:'study',activity:'J’étudie notre situation',location:'book'}),roomAnchors.bureau.book[0]);assert.deepEqual(residentDestination({id:1,room:'salon',intent:'rest',location:'not-a-real-key'}),roomAnchors.salon.sofa[0]);
console.log('Passed: '+checked+' cross-room anchor routes, obstacle-free cells, separate paired destinations, stable activity choices and current mirror/plant perception.');

}

// Regression from the preserved live session: a sleeping partner in the office must not speak or remain there.
{
let plot=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);
plot={...plot,round:50,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('Preuve confirmée'),life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,visualIntro:2,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,personalFollowup:3,exitSearched:true,attachment:{1:22,2:22}}};
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=1').run('bureau','chat',JSON.stringify({hunger:10,fatigue:20,stress:10,uncertainty:10}),JSON.stringify({...steady,attraction:10}));
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=2').run('bureau','sleep',JSON.stringify({hunger:10,fatigue:76,stress:10,uncertainty:10}),JSON.stringify({...steady,attraction:10}));
const legacy=await readWorld(db);assert.equal(legacy.agents[1].room,'salon');assert.ok(legacy.agents.every(a=>a.emotions.attraction>=a.attachment));
const chatCalls=calls,response=await post(input('chat',1,{epoch:perceptionEpoch,message:'Vous m’entendez ?'}));assert.equal(response.status,200);const data=await response.json();assert.equal(calls,chatCalls+1);assert.equal(data.agents[1].room,'salon');assert.ok(data.agents[1].needs.fatigue<76);assert.ok(!data.messages.some(m=>m.speaker.startsWith('Noé')));assert.equal(data.decisions[0].actor,1);
// Noé (adressé) dort, Lia est éveillée : elle répond à sa place plutôt que de bloquer l'échange.
{const r=await post(input('chat',2,{epoch:perceptionEpoch,message:'Réponds'}));assert.equal(r.status,200);const d=await r.json();assert.equal(d.decisions[0].actor,1);assert.match(lastContext.continuation,/dort/);assert.equal(calls,chatCalls+2);}
// The same causal motif may never return after unrelated messages or from another resident.
const normalized=line=>line.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
for(let n=0;n<4;n++){const r=await post(input('chat',1,{epoch:perceptionEpoch,message:'Comment va Lia ? '+n}));assert.equal(r.status,200);}
const lines=sqlite.prepare("SELECT content FROM conversations WHERE speaker!='vous'").all().map(m=>normalized(m.content));assert.equal(new Set(lines).size,lines.length);assert.ok(sqlite.prepare('SELECT count(*) n FROM dialogue_fingerprints').get().n>=lines.length);
assert.equal(truthfulGender('Et toi, quel genre d’homme es-tu ?',2),'Et toi, quel genre de femme es-tu ?');
console.log('Passed: live office sleeper repaired, silent sleeping partner during human chat, selected awake priority, attraction attachment floor, zero inference for blocked sleeper and whole-session cross-actor duplicate ledger.');
}

{
const {restingPose}=await import('../.sites-runtime/test-perception.mjs');const {furniture}=await import('../.sites-runtime/test-house.mjs');
for(const room of ['chambre','salon'])for(const id of [1,2]){const p=restingPose(id,room),f=furniture[room==='chambre'?7:1];assert.ok(Math.abs(p.x-f.x)<f.w/2);assert.ok(Math.abs(p.z-f.z)<f.d/2);}
let plot=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);plot={...plot,round:60,life:{...plot.life,debrief:undefined,contact:undefined,tvSeen:false,tvOn:false},pendingDestination:undefined};
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),JSON.stringify({...steady,attraction:30}));
let r=await post(input('interact',2,{epoch:perceptionEpoch}));assert.equal(r.status,200);let w=await r.json();assert.equal(w.story.life.tvOn,true);assert.ok(w.messages.some(m=>/télécommande/.test(m.content)));
plot=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);plot.life.debrief=undefined;plot.pendingDestination={room:'salon',intent:'tv',proposer:2};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
const originalFetch=globalThis.fetch;globalThis.fetch=async(...args)=>{const response=await originalFetch(...args),body=await response.json(),decision=JSON.parse(body.candidates[0].content.parts[0].text);decision.reply=isPartnerRequest(args)?'Elle boucle toujours sur la même image. On va réfléchir sans elle.':'J’éteins la tv avec la télécommande. Ce truc finit par me filer mal au crâne.';body.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(body);};
r=await post(input('interact',2,{epoch:perceptionEpoch}));globalThis.fetch=originalFetch;assert.equal(r.status,200);w=await r.json();assert.equal(w.story.life.tvOn,false);assert.equal(w.story.life.tvSeen,true);assert.ok(w.messages.some(m=>/J’éteins la tv avec la télécommande/.test(m.content)));
assert.ok(investigationTarget({...newStory(),evidence:Array(4).fill('preuve')}).includes('DH'));
console.log('Passed: sleeping poses remain on actual furniture, remote-only tv on/off preserves discovery and final architecture signature stays canonical.');
}

{
const {gardenAccess,spaces}=await import('../.sites-runtime/test-house.mjs');
assert.ok(spaces.includes('jardin'));assert.equal(pathBetween([-4,-3],[-11,1.5]).length,0);
for(const start of Object.entries(centers).filter(([r])=>r!=='jardin').map(([,p])=>p))for(const end of [[-9,0],[-11,1.5],[-12,1.5],[-10.5,-2.5]]){const path=pathBetween(start,end,true);assert.ok(path.length);assert.ok(path.every(([x,z])=>!blocked(x,z,true)));}
assert.ok(blocked(8,0,true));assert.ok(blocked(-11.7,-3,true));
let plot=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content),epoch=(await readWorld(db)).epoch;
plot.finalCalled=false;plot.life.gardenOpen=false;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
const beforeCalls=calls,beforeRound=plot.round;
assert.equal((await post(input('unlock_garden',1,{epoch}))).status,423);assert.equal((await post(input('move',1,{epoch,room:'jardin'}))).status,423);
plot.finalCalled=true;plot.evidence=Array(5).fill('preuve');sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
const request=input('unlock_garden',1,{epoch});let r=await post(request);assert.equal(r.status,200);let w=await r.json();assert.equal(w.story.life.gardenOpen,true);assert.equal(gardenAccess({...plot,life:w.story.life}),true);assert.equal(w.epoch,epoch);assert.equal(calls,beforeCalls);
const count=sqlite.prepare("SELECT count(*) n FROM conversations WHERE speaker='Maison · accès'").get().n;assert.equal(count,1);
assert.equal((await post(request)).status,200);assert.equal((await post(input('unlock_garden',2,{epoch}))).status,200);assert.equal(sqlite.prepare("SELECT count(*) n FROM conversations WHERE speaker='Maison · accès'").get().n,count);
assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).round,beforeRound);
r=await post(input('move',1,{epoch,room:'jardin'}));assert.equal(r.status,200);w=await r.json();assert.equal(w.agents[0].room,'jardin');assert.equal(calls,beforeCalls);
assert.equal((await post(input('reset',1,{epoch}))).status,200);w=await readWorld(db);assert.equal(w.story.life.gardenOpen,false);assert.equal((await post(input('move',1,{epoch:w.epoch,room:'jardin'}))).status,423);assert.equal(calls,beforeCalls);
console.log('Passed: garden access gates, persistent/idempotent zero-API unlock, unchanged round/epoch, open-only exterior paths, tree/right-door collision, reset relocks garden.');
}

{
let epoch=(await readWorld(db)).epoch,p=newStory();Object.assign(p,{round:50,met:true,introduced:true,sharedMeal:true,salonTurns:8});Object.assign(p.life,{visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,personalAsked:true,exitSearched:true});sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:60,stress:20,uncertainty:30}),JSON.stringify({...steady,attraction:35}));
const oldFetch=globalThis.fetch;globalThis.fetch=async(...args)=>{const response=await oldFetch(...args),body=await response.json(),decision=JSON.parse(body.candidates[0].content.parts[0].text);decision.reply=isPartnerRequest(args)?'Vas-y. Je vais réfléchir un peu sans toi.':'Je vais dormir, mes yeux se ferment.';body.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(body);};
let r=await post(input('interact',1,{epoch}));globalThis.fetch=oldFetch;assert.equal(r.status,200);let w=await r.json();const sleeper=w.agents.find(a=>a.intent==='sleep');assert.ok(sleeper);assert.ok(['salon','chambre'].includes(sleeper.room));assert.ok(!w.messages.some(m=>m.speaker===sleeper.name&&m.content==='Je vais dormir, mes yeux se ferment.'));
const before=calls;r=await post(input('interact',2,{epoch}));assert.equal(r.status,200);w=await r.json();assert.equal(calls,before);assert.ok(w.agents.find(a=>a.id===sleeper.id).needs.fatigue<sleeper.needs.fatigue);
const {planTurn,coordinateRooms}=await import('../.sites-runtime/test-turn.mjs');const a={...w.agents[0],intent:'chat',room:'salon',needs:{hunger:10,fatigue:10,stress:10,uncertainty:10}},b={...w.agents[1],intent:'chat',room:'salon',needs:{hunger:10,fatigue:10,stress:10,uncertainty:10}};p.finalCalled=true;p.evidence=Array(5).fill('preuve');p.life.gardenOpen=true;p.life.gardenVisited=false;
let plan=planTurn('interact',a,b,p,false,false,'hug',[]);assert.equal(plan.room,'jardin');assert.equal(plan.partnerRoom,'jardin');assert.equal(plan.intent,'chat');
p.life.gardenOpen=false;const ds=[{actor:1,intent:'chat',room:'jardin',action:'move'},{actor:2,intent:'chat',room:'jardin',action:'move'}];coordinateRooms(ds,[a,b],p);assert.ok(ds.every(d=>d.room==='salon'));
console.log('Passed: explicit sleep announcement becomes physical sleep, subsequent turn zero API, valid bed/sofa allocation, first authorized garden visit joins residents, locked model garden decision rejected.');
}

// v34: visible scene cues, minimum sleep duration and garden priority.
{
const epoch=(await readWorld(db)).epoch;let p=newStory();Object.assign(p,{round:50,met:true,introduced:true,sharedMeal:true,salonTurns:8,finalCalled:true,evidence:Array(5).fill('preuve')});Object.assign(p.life,{visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,personalAsked:true,exitSearched:true});
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:4,stress:30,uncertainty:40}),JSON.stringify({...steady,attraction:35}));
const before=calls;let r=await post(input('care',1,{epoch,intent:'sleep'}));assert.equal(r.status,200);let w=await r.json();assert.equal(w.agents[0].intent,'sleep');assert.equal(w.story.life.sleepTurns[1],1);assert.equal(w.agents[0].needs.fatigue,0);assert.equal(calls,before);assert.equal(w.messages.filter(m=>m.speaker==='Lia · rêve').length,1);assert.ok(w.messages.find(m=>m.speaker==='Lia · rêve').room==='chambre');assert.ok(!w.messages.some(m=>m.speaker==='Lia'||m.speaker==='Lia · pensée'));
// Lia (adressée) dort, Noé est éveillé : il répond à sa place plutôt que de bloquer l'échange.
{const r=await post(input('chat',1,{epoch,message:'Tu dors ?'}));assert.equal(r.status,200);const d=await r.json();assert.equal(d.decisions[0].actor,2);assert.match(lastContext.continuation,/dort/);assert.equal(calls,before+1);}
r=await post(input('interact',2,{epoch}));assert.equal(r.status,200);w=await r.json();assert.equal(w.story.life.sleepTurns[1],2);assert.equal(w.agents[0].intent,'none');assert.equal(calls,before+1);assert.equal(w.messages.filter(m=>m.speaker==='Lia · rêve').length,1);
// Eating and legacy speaker activation emit explicit cues, cached with the turn.
r=await post(input('care',2,{epoch,intent:'eat'}));assert.equal(r.status,200);w=await r.json();assert.ok(w.visualEvents.some(e=>e.kind==='food'&&e.duration>2000));assert.ok(w.departures.some(d=>d.actor===2&&d.from==='salon'&&d.to==='cuisine'&&/manger|faim|avaler/.test(d.content)));assert.equal(calls,before+1);
p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);
// Les répliques scénarisées (ambiance/plante/enceinte) appartiennent à l'avant-révélation ;
// ce sous-test les vérifie donc hors du contexte finalCalled utilisé plus bas pour le jardin.
Object.assign(p,{finalCalled:false,evidence:p.evidence.slice(0,1)});Object.assign(p.life,{debrief:undefined,contact:undefined,ambientVerified:false,mirrorVerified:true,foodVerified:true});sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:40}));const req=input('interact',2,{epoch});r=await post(req);assert.equal(r.status,200);w=await r.json();assert.ok(w.visualEvents.some(e=>e.kind==='speaker'));assert.ok(w.messages.some(m=>/notes/.test(m.content)));assert.equal(calls,before+1);const cached=await (await post(req)).json();assert.deepEqual(cached.visualEvents,w.visualEvents);assert.equal(calls,before+1);
const {planTurn}=await import('../.sites-runtime/test-turn.mjs');p.finalCalled=true;p.evidence=Array(5).fill('preuve');p.life.gardenOpen=true;p.life.gardenVisited=false;p.life.debrief={topic:'débrief en attente',remaining:2};p.life.contact={room:'salon',remaining:2};const a={...w.agents[0],needs:{hunger:10,fatigue:10,stress:90,uncertainty:40}},b={...w.agents[1],needs:{hunger:10,fatigue:10,stress:30,uncertainty:40}};const plan=planTurn('interact',a,b,p,false,false,'hug',[]);assert.equal(plan.gardenFirst,true);assert.equal(plan.room,'jardin');assert.equal(plan.partnerRoom,'jardin');assert.equal(plan.routine,false);assert.equal(plan.offer,undefined);
const {appearanceReply,scenePalette,cityFacades,sceneSpeakers}=await import('../.sites-runtime/test-perception.mjs');const l=appearanceReply(w.agents[0],2,0),n=appearanceReply(w.agents[1],1,0);assert.notEqual(l,n);assert.match(l,/rose vif/);assert.match(n,/turquoise vif/);assert.equal(scenePalette.corridorName,'moquette beige');assert.equal(scenePalette.patterns.length,4);assert.equal(cityFacades.length,4);assert.equal(sceneSpeakers.length,4);
console.log('Passed: minimum two zero-API sleep turns, one room-stamped dream narration, awake partner answers for a sleeping addressee, explicit food and cached speaker cues, motivated departure, garden priority over contact/debrief, distinct truthful appearance and shared scene registries.');
}

const {stockSurprise,stockThought}=await import('../.sites-runtime/test-stock.mjs');const {departurePresentation,uniqueObservations}=await import('../.sites-runtime/test-presentation.mjs');assert.deepEqual(Array.from({length:7},(_,i)=>stockSurprise(i)),[9,6,4,2,1,0,0]);for(let n=0;n<5;n++)assert.notEqual(stockThought(1,n),stockThought(2,n));assert.equal(stockThought(1,5),undefined);assert.deepEqual(uniqueObservations([' A ','A','B','']),['A','B']);assert.equal(departurePresentation('[salon→cuisine] Je vais manger.','salon').route,'◈ SAL → ◇ CUI');assert.equal(departurePresentation('[salon→cuisine] Je vais manger.','salon').text,'Je vais manger.');assert.match(groundRoomSpeech('Allons nous poser un peu au salon.','salon',[]),/On se pose ici/);
console.log('Passed: fading stock surprise, distinct local reactions, durable movement presentation, observation counts and same-room grounding.');

const stockPlot=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);stockPlot.life.stockExposures={1:0,2:0};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(stockPlot));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=? WHERE id=1').run('cuisine','chat',JSON.stringify({hunger:90,fatigue:10,stress:20,uncertainty:40}));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=? WHERE id=2').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:40}));const stockBefore=await readWorld(db),stockCalls=calls,stockRequest=input('care',1,{epoch:stockBefore.epoch,intent:'eat'});response=await post(stockRequest);assert.equal(response.status,200);const stockResult=await response.json();assert.equal(calls,stockCalls);assert.equal(stockResult.story.life.stockExposures[1],1);assert.equal(stockResult.story.life.stockExposures[2],0);assert.ok(stockResult.messages.some(m=>m.id>stockBefore.messages.at(-1).id&&m.speaker==='Lia · pensée'&&m.room==='cuisine'&&m.content===stockThought(1,0)));response=await post(stockRequest);const stockCached=await response.json();assert.deepEqual(stockCached.story.life.stockExposures,stockResult.story.life.stockExposures);assert.deepEqual(stockCached.agents,stockResult.agents);
console.log('Passed: regeneration only surprises the awake kitchen observer, adds no inference and cached retry applies no second effect.');

const {waitForPlayback}=await import('../.sites-runtime/test-playback.mjs');let playbackClock=0,playbackTicks=0;await waitForPlayback(50,{paused:()=>playbackTicks<3,alive:()=>true,now:()=>playbackClock,wait:async ms=>{playbackClock+=ms;playbackTicks++}});assert.equal(playbackClock,200);let stoppedTicks=0;await waitForPlayback(50,{paused:()=>true,alive:()=>stoppedTicks===0,wait:async()=>{stoppedTicks++}});assert.equal(stoppedTicks,1);const {dialogueFingerprint,looksLikeEcho}=await import('../.sites-runtime/test-drama.mjs');assert.equal(dialogueFingerprint('[salon→cuisine] Je passe en cuisine.'),dialogueFingerprint('[bureau→cuisine] Je passe en cuisine.'));assert.equal(dialogueFingerprint('Je passe en cuisine.'),dialogueFingerprint('[salon→cuisine] Je passe en cuisine.'));assert.ok(looksLikeEcho('Cette maison blanche ressemble terriblement à une prison silencieuse fermée parfaitement artificielle.','Cette maison parfaitement artificielle ressemble terriblement à une prison blanche fermée silencieuse.'));assert.equal(looksLikeEcho('Je préfère qu’on prenne notre temps.','Je préfère une vraie explication.'),false);
// Bug réel observé en testant l'esprit des personnages en direct : une phrase entière recopiée
// mot pour mot passait inaperçue dès qu'elle était suivie d'une phrase originale, parce que le
// ratio global se retrouvait dilué sous le seuil de 90 %.
assert.ok(looksLikeEcho('Commander un sentiment depuis cet écran, ça ne marche pas comme ça. On n’est pas des interrupteurs qu’on bascule à la demande.','Commander un sentiment depuis cet écran, ça ne marche pas comme ça.'));const {investigationCounts}=await import('../.sites-runtime/test-evidence.mjs');assert.deepEqual(investigationCounts(['Dans un livre du bureau','Dans un livre du bureau'],['fausse plante bleue et enceinte activée','Les textures sont trop lisses.'],false,[{actor:1,round:4,content:'Une grille lumineuse'},{actor:1,round:4,content:'Une grille lumineuse'}]),{indices:1,observations:4});assert.ok(stockResult.memories.some(m=>m.kind==='réaction'&&m.agent_id===1&&m.content.startsWith('[cuisine|')&&m.content.includes(stockThought(1,0))));console.log('Passed: active playback clock freezes and disposes, route metadata cannot bypass public duplicates, conservative echo guard, object/dream counts and causal stock memories.');

const {referenceSections}=await import('../.sites-runtime/test-reference.mjs');const {updateAudit}=await import('../.sites-runtime/test-update-audit.mjs');assert.equal(updateAudit.length,25);assert.equal(new Set(updateAudit.map(a=>a.point)).size,25);assert.ok(referenceSections[0].title.includes('Version 41'));assert.ok(referenceSections.some(s=>s.title.startsWith('26')&&s.text.includes('18a')&&s.text.includes('20b')));assert.ok(referenceSections.some(s=>s.text.includes('food=3800 ms')));assert.ok(!referenceSections.some(s=>s.text.includes('2 400 ms')));assert.equal(investigationCounts([],[],true,[],{mirrorVerified:true,ambientVerified:true}).observations,3);assert.ok(stockResult.story.life.foodVerified);console.log('Passed: all 25 requested changes listed, current Admin revision and durations, verified legend/count concordance and first food witness validation.');

{
  // Insolite openings (Article 9) : une minorité de sessions démarre autrement — Lia se sent mal,
  // ou Noé se referme — sans jamais être le cas par défaut, et sans inventer un quatrième état.
  const {insoliteOpening,insoliteColdOpening}=await import('../.sites-runtime/test-story.mjs');
  assert.equal(insoliteOpening('seed-probe-0'),'lia-unwell');assert.equal(insoliteOpening('seed-probe-4'),'noe-guarded');
  const insoliteRolls=Array.from({length:300},(_,i)=>insoliteOpening('roll-'+i));
  assert.ok(insoliteRolls.every(k=>['normal','lia-unwell','noe-guarded'].includes(k)));
  const normalShare=insoliteRolls.filter(k=>k==='normal').length/insoliteRolls.length;
  assert.ok(normalShare>0.45&&normalShare<0.75,'normal openings should stay the plurality, not the only outcome: '+normalShare);
  assert.ok(insoliteRolls.includes('lia-unwell')&&insoliteRolls.includes('noe-guarded'));
  const [liaUnwellLines1,liaUnwellLines2]=[insoliteColdOpening('lia-unwell','seed-probe-0'),insoliteColdOpening('lia-unwell','seed-probe-1')];
  assert.notDeepEqual(liaUnwellLines1,liaUnwellLines2);
  assert.equal(new Set([...liaUnwellLines1,...liaUnwellLines2]).size,4);
  const {initialNeedsFor:testInitialNeedsFor,initialEmotionsFor:testInitialEmotionsFor}=await import('../.sites-runtime/test-simulation.mjs');
  assert.equal(testInitialNeedsFor(1,'lia-unwell').fatigue,58);assert.equal(testInitialNeedsFor(2,'lia-unwell').fatigue,testInitialNeedsFor(2,'normal').fatigue);
  assert.ok(testInitialEmotionsFor(2,'noe-guarded').trust<testInitialEmotionsFor(2,'normal').trust);assert.deepEqual(testInitialEmotionsFor(1,'noe-guarded'),testInitialEmotionsFor(1,'normal'));
  // Full path: a seed known to roll "lia-unwell" actually seeds her fatigue at reset time, and the
  // opening turn uses her distinct lines instead of the standard cold opening. This is the last
  // scenario in the file specifically so the extra reset here never shifts a later hardcoded epoch.
  const savedRandomUUID=globalThis.crypto.randomUUID;
  Object.defineProperty(globalThis.crypto,'randomUUID',{value:()=>'seed-probe-0',configurable:true});
  const priorEpoch=(await readWorld(db)).epoch;
  const resetResponse=await post(input('reset',1,{epoch:priorEpoch}));
  assert.equal(resetResponse.status,200);
  Object.defineProperty(globalThis.crypto,'randomUUID',{value:savedRandomUUID,configurable:true});
  const afterReset=await readWorld(db);
  assert.equal(afterReset.agents[0].needs.fatigue,58);
  assert.equal(afterReset.agents[1].needs.fatigue,testInitialNeedsFor(2,'normal').fatigue);
  const openingCalls=calls;
  const openingResponse=await post(input('interact',1,{epoch:afterReset.epoch}));
  assert.equal(openingResponse.status,200);const opened=await openingResponse.json();
  assert.equal(calls,openingCalls);
  assert.ok(opened.messages.some(m=>m.speaker==='Lia'&&(m.content.includes('la tête qui tourne')||m.content.includes('fermer les yeux'))));
  console.log('Passed: insolite openings stay a minority, are internally distinct, seed the right agent\'s needs/emotions, and actually surface in the scripted opening turn.');
}

{
  // Colère entre les deux habitants (nouvelle mécanique) : trois rapprochements en moins de 18
  // tours doivent maintenant produire une vraie dispute, pas seulement une gêne passagère — avec
  // anneau/visage visiblement fâchés, gestes et scènes légères suspendus, et une réconciliation qui exige un
  // vrai échange sur le même sujet, pas juste le temps qui passe.
  const epoch=(await readWorld(db)).epoch;
  const disputeRound=40;
  let p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);
  p.round=disputeRound;p.introduced=true;p.met=true;p.salonTurns=5;
  p.life={...p.life,contacts:[disputeRound-2,disputeRound-6],dispute:undefined,debrief:undefined,contact:undefined,ambientSeen:true,ambientVerified:true,visualIntro:2,personalAsked:true,exitSearched:true,visited:['salon','cuisine','chambre','bureau']};
  p.pendingDestination={room:'salon',intent:'hug',proposer:2};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,emotions=?,needs=?').run('salon','chat',warm,JSON.stringify(initialNeeds));
  affection=true;
  let response=await post(input('interact',1,{epoch}));assert.equal(response.status,200);let result=await response.json();
  affection=false;
  assert.equal(result.sharedAffection,'hug');
  assert.ok(result.story.life.dispute?.remaining>0,'third close reconciliation in 18 turns should open a dispute');
  const disputeTopic=result.story.life.dispute.topic;
  assert.ok(result.agents.find(a=>a.id===1).angry);assert.ok(result.agents.find(a=>a.id===2).angry);
  assert.ok(faceExpression(result.agents.find(a=>a.id===1)).angerLevel>=.85,'Lia should read as visibly angry during the dispute');
  assert.ok(faceExpression(result.agents.find(a=>a.id===2)).angerLevel>=.85,'Noé should read as visibly angry during the dispute');
  // While disputed, a fresh gesture attempt must not go through even with every affection lever honored.
  affection=true;
  response=await post(input('interact',1,{epoch}));assert.equal(response.status,200);result=await response.json();
  affection=false;
  assert.equal(result.sharedAffection,null,'no shared gesture should be possible while a dispute is active');
  assert.equal(result.story.life.dispute?.topic,disputeTopic,'the dispute must persist untouched by the blocked attempt');
  // Reconciliation: staying together on the same topic decrements it, never a random passage of time.
  response=await post(input('interact',1,{epoch}));assert.equal(response.status,200);result=await response.json();
  assert.equal(result.story.life.dispute?.remaining,1);assert.ok(result.agents.every(a=>a.angry));
  response=await post(input('interact',1,{epoch}));assert.equal(response.status,200);result=await response.json();
  assert.equal(result.story.life.dispute,undefined);assert.ok(result.agents.every(a=>!a.angry));
  console.log('Passed: three close reconciliations open a real dispute with a visibly angry expression on both faces, suspend new gestures, and require a genuine shared reconciliation to clear.');
}

{
  // Fiabilisation de la colère (2026-09-17) : avant ce correctif, un visage ne pouvait paraître
  // fâché qu'à travers life.dispute (la seule mécanique romantique de brouille) — une hostilité
  // générale (provocations, mépris de l'observateur, tension qui grimpe) ne se voyait jamais sur
  // le visage tant qu'aucune dispute n'était ouverte. faceExpression() doit désormais lire la
  // colère directement dans tension/comfort réels, sans avoir besoin de life.dispute ni du drapeau
  // angry — et rester calme quand tension/comfort ne le justifient pas.
  const hostileNoDispute=faceExpression({id:1,intent:'chat',needs:{...initialNeeds,fatigue:20},emotions:{tension:82,comfort:8,attraction:15}});
  assert.ok(hostileNoDispute.angerLevel>.5,'high tension + low comfort must read as visibly angry even with no dispute and no angry flag');
  const calmNoDispute=faceExpression({id:2,intent:'chat',needs:{...initialNeeds,fatigue:20},emotions:{tension:20,comfort:70,attraction:15}});
  assert.ok(calmNoDispute.angerLevel<.15,'calm tension/comfort must not read as angry');
  const flaggedAngryLowTension=faceExpression({id:1,intent:'chat',needs:{...initialNeeds,fatigue:20},emotions:{tension:20,comfort:70,attraction:15},angry:true});
  assert.ok(flaggedAngryLowTension.angerLevel>=.85,'the life.dispute angry flag must still guarantee a visibly angry floor on its own');
  console.log('Passed: anger reliability — faceExpression() reads real hostility from tension/comfort alone, not only from life.dispute\'s angry flag.');
}
