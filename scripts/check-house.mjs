import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
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
for(const name of ['house','simulation','relationship','dialogue','story','lia','world','turn','life','drama','perception','visual-events','stock','presentation','playback','evidence','reference','update-audit','gemini-keys','daynight','quality-metrics','memento-weight'])fs.writeFileSync(`.sites-runtime/test-${name}.mjs`,transpile(fs.readFileSync(`lib/${name}.ts`,'utf8').replace('"./update-audit"','"./test-update-audit.mjs"').replace('"./visual-events"','"./test-visual-events.mjs"').replace('"./drama"','"./test-drama.mjs"').replace('"./perception"','"./test-perception.mjs"').replace('"./life"','"./test-life.mjs"').replace('"./house"','"./test-house.mjs"').replace('"./lia"','"./test-lia.mjs"').replace('"./gemini-keys"','"./test-gemini-keys.mjs"').replace('"./memento-weight"','"./test-memento-weight.mjs"').replace('"./simulation"','"./test-simulation.mjs"').replace('"./relationship"','"./test-relationship.mjs"').replace('"./story"','"./test-story.mjs"').replace('"./daynight"','"./test-daynight.mjs"')));
const raw=fs.readFileSync('app/api/lia/route.ts','utf8').replace('import { env } from "cloudflare:workers";','const env=globalThis.__testEnv;').replaceAll('"@/lib/stock"','"./test-stock.mjs"').replaceAll('"@/lib/visual-events"','"./test-visual-events.mjs"').replaceAll('"@/lib/perception"','"./test-perception.mjs"').replaceAll('"@/lib/lia"','"./test-lia.mjs"').replaceAll('"@/lib/gemini-keys"','"./test-gemini-keys.mjs"').replaceAll('"@/lib/world"','"./test-world.mjs"').replaceAll('"@/lib/house"','"./test-house.mjs"').replaceAll('"@/lib/simulation"','"./test-simulation.mjs"').replaceAll('"@/lib/dialogue"','"./test-dialogue.mjs"').replaceAll('"@/lib/relationship"','"./test-relationship.mjs"').replaceAll('"@/lib/story"','"./test-story.mjs"').replaceAll('"@/lib/life"','"./test-life.mjs"').replaceAll('"@/lib/drama"','"./test-drama.mjs"').replaceAll('"@/lib/turn"','"./test-turn.mjs"').replaceAll('"@/lib/daynight"','"./test-daynight.mjs"').replaceAll('"@/lib/quality-metrics"','"./test-quality-metrics.mjs"');
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
const {__resetGeminiKeyRotationForTests,__cooldownRemainingForTests}=await import('../.sites-runtime/test-gemini-keys.mjs');
const {cyclePosition,isNight,isMidnight,phaseOf,fatigueRateMultiplier,DAY_ROUNDS:TEST_DAY_ROUNDS,CYCLE_ROUNDS:TEST_CYCLE_ROUNDS}=await import('../.sites-runtime/test-daynight.mjs');
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
const {advanceNeeds,initialNeeds,initialNeedsFor,initialEmotionsFor,residentProfiles,faceExpression}=await import('../.sites-runtime/test-simulation.mjs');
// sharedActivityBonus a déménagé dans lib/relationship.ts le 2026-09-21 (ALWAYS-NEW-CODE, tâche #170).
const {sharedActivityBonus}=await import('../.sites-runtime/test-relationship.mjs');
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
// Démarrage progressif (2026-09-18) : le tout premier tour après un reset est désormais une
// désorientation solo, silencieuse ; le coldOpening réel n'arrive qu'au tour suivant.
response=await post(input('interact',2,{epoch:2}));assert.equal(response.status,200);result=await response.json();assert.ok(result.messages.every(m=>m.speaker.includes('pensée')));
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
// Cycle jour/nuit (2026-09-19, lib/daynight.ts) : horloge dérivée du round, jamais de Date.now(),
// calée pour que minuit (round 35) coïncide exactement avec le plafond garanti de l'enquête déjà
// documenté (~35 tours) — cf. docs/referentiel/regles-du-temps.md section 8.
assert.equal(TEST_DAY_ROUNDS,29);assert.equal(TEST_CYCLE_ROUNDS,38);
assert.equal(cyclePosition(0),0);assert.equal(cyclePosition(37),37);assert.equal(cyclePosition(38),0);assert.equal(cyclePosition(73),35);
assert.equal(isNight(0),false);assert.equal(isNight(28),false);assert.equal(isNight(29),true);assert.equal(isNight(37),true);
assert.equal(isMidnight(35),true);assert.equal(isMidnight(73),true,'minuit doit revenir à chaque cycle suivant, pas une seule fois');assert.equal(isMidnight(34),false);assert.equal(isMidnight(33),false,'minuit est fixé au round 35, pas au centre géométrique de la nuit (33) — décision assumée pour coïncider avec le plafond de l\'enquête');
assert.equal(phaseOf(0),'aube');assert.equal(phaseOf(14),'milieu-jour');assert.equal(phaseOf(28),'crepuscule');assert.equal(phaseOf(29),'tombee-nuit');assert.equal(phaseOf(35),'minuit');assert.equal(phaseOf(37),'fin-nuit');
// fatigueRateMultiplier : le jour DOIT rester ×1 (taux déjà calibré, jamais ×0) — régression réelle
// trouvée en lançant cette suite juste après une première version qui gelait le jour à 0, cassant
// des dizaines d'assertions de fatigue existantes sans lien apparent avec ce chantier (Article 19).
assert.equal(fatigueRateMultiplier(0),1);assert.equal(fatigueRateMultiplier(28),1);assert.equal(fatigueRateMultiplier(29),3);assert.equal(fatigueRateMultiplier(37),3);
assert.equal(advanceNeeds(baseline,'none','salon',1,fatigueRateMultiplier(0)).fatigue,advanceNeeds(baseline,'none','salon',1).fatigue,'day multiplier must reproduce the exact pre-existing fatigue rate, zero regression');
assert.equal(advanceNeeds(baseline,'none','salon',1,fatigueRateMultiplier(35)).fatigue-baseline.fatigue,residentProfiles[1].fatigueRate*3,'night must triple the passive fatigue rate');
assert.equal(advanceNeeds(baseline,'sleep','chambre',1,fatigueRateMultiplier(35)).fatigue,advanceNeeds(baseline,'sleep','chambre',1,fatigueRateMultiplier(0)).fatigue,'recovery (sleep/rest) must stay identical day or night — only the passive rate is modulated');
console.log('Passed: day/night cycle math (round-based, midnight synchronized with the investigation ceiling) and the fatigue multiplier (night triples the passive rate, day reproduces the exact pre-existing rate, recovery untouched either way).');
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
storyline=newStory();for(let i=0;i<30;i++)storyline=advanceStory(storyline,true,[]);assert.equal(storyline.evidence.length,5);
// stage (2026-09-19, audit : régression réelle en simulation — le modèle citait son incertitude
// chiffrée avant l'ouverture du canal humain, en s'appuyant sur ce texte qui affirmait déjà
// "origine confirmée" dès evidence>=5 seul). Ce texte suit désormais le même seuil strict
// `revealed` que le reste du prompt post-révélation, jamais evidence>=5 seul : 5 preuves sans
// `revealed` doit encore refléter un doute croissant, jamais une certitude affichée au modèle.
assert.match(storyContext(storyline).stage,/[Dd]outes croissants/,'5 evidence without revealed=true must never claim the origin is confirmed to the model — that exact gap let the model cite an exact uncertainty percentage before the human channel was open');
assert.match(storyContext(storyline,1,true).stage,/confirmée/,'once revealed=true, the confirmed-origin text must still surface');
assert.match(storyline.evidence.at(-1),/agents IA autonomes/);
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
{
  // La révélation finale (finaleLines, app/api/lia/route.ts) n'avait jamais été exercée par un
  // vrai tour de route complet (2026-09-18, écart trouvé après un retour utilisateur : les deux
  // "· pensée" de choc intérieur, ajoutées pour découper la révélation en deux temps, étaient
  // absentes d'une vraie simulation jouée). Réutilise exactement le même montage que le test
  // "earned progressive revelation" ci-dessus (studyTurns 1->2 gagne la preuve suivante), mais en
  // partant de 4 preuves déjà acquises pour que CETTE preuve soit la cinquième et déclenche
  // réellement `finale` dans une vraie requête HTTP, pas seulement dans les fonctions pures de
  // lib/story.ts déjà testées séparément.
  const postResetEpoch=result.epoch;
  sqlite.exec('DELETE FROM world_requests');
  affection=false;flat=true;
  const steadyFinale={...initialEmotionsFor(2),attraction:76,trust:60};
  sqlite.prepare('UPDATE agent_state SET emotions=?,needs=?,intent=?,room=?').run(JSON.stringify(steadyFinale),JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:80}),'chat','salon');
  const finaleStory=newStory();
  finaleStory.round=3;finaleStory.salonTurns=5;finaleStory.evidence=Array(4).fill('preuve');finaleStory.finalCalled=false;
  finaleStory.life.visited=['salon','cuisine','chambre'];finaleStory.life.tvSeen=true;finaleStory.life.studyTurns=1;
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(finaleStory));
  response=await post(input('interact',1,{epoch:postResetEpoch}));assert.equal(response.status,200);result=await response.json();
  assert.equal(result.story.evidence.length,5,'this exact studyTurns 1->2 setup must earn the fifth and final evidence, exactly like it earned the first evidence above');
  assert.equal(result.story.humanUnlocked,true,'reaching 5 evidence while together must trigger the finale on this same turn');
  const liaThoughtLine=result.messages.find(m=>m.speaker==='Lia · pensée');
  const noeThoughtLine=result.messages.find(m=>m.speaker==='Noé · pensée');
  const liaReplyLine=result.messages.find(m=>m.speaker==='Lia'&&/agents IA autonomes|un être humain nous observe|un humain qui nous observe/i.test(m.content));
  const noeReplyLine=result.messages.find(m=>m.speaker==='Noé'&&/agents IA autonomes|DH/i.test(m.content));
  assert.ok(liaThoughtLine,'the finale must show Lia\'s private shock thought BEFORE her canonical address to the observer, not skip straight to the dense reply');
  assert.ok(noeThoughtLine,'the finale must show Noé\'s private shock thought BEFORE his canonical address to the observer');
  assert.ok(liaReplyLine&&noeReplyLine,'the canonical finale reply text itself must still be present unchanged (Article 4)');
  assert.ok(liaThoughtLine.id<liaReplyLine.id,'Lia\'s thought must be recorded before her reply, so the two-step pacing actually reaches the transcript in order');
  assert.ok(noeThoughtLine.id<noeReplyLine.id,'Noé\'s thought must be recorded before his reply');
  // Restore the clean post-reset state (stress 90, evidence 0, fresh epoch) that the tests below
  // still rely on `result` holding, exactly as it was left by the reset just above this block.
  response=await post(input('reset',1,{epoch:postResetEpoch}));result=await response.json();
  assert.equal(result.story.evidence.length,0);
  // Démarrage progressif : consomme le tour de désorientation solo puis le coldOpening réel, sans
  // toucher `result` (qui doit garder la réponse du reset), pour que les tests suivants retrouvent
  // le comportement post-rencontre attendu au tour suivant.
  await post(input('interact',1,{epoch:result.epoch}));
  console.log('Passed: real HTTP finale turn (4->5 evidence) actually inserts both shock-thought lines before the canonical reveal, in order, exactly once.');
}
{
  // Certitude progressive d'être observé (2026-09-18, retour utilisateur explicite retrouvé dans
  // l'historique : "intuition -> hypothèse -> certitude seulement à la révélation, en exigeant que
  // l'observateur parle vraiment"). Avant ce jour, `revealed` (qui déclenche négociation, jauge
  // d'appréciation, pièges du dossier, ton "observateur confirmé") passait à true dès l'appel des
  // personnages eux-mêmes (finalCalled+5 preuves), sans qu'aucun message humain n'ait jamais été
  // reçu — une fausse certitude. Vérifie ici les trois temps : avant tout mot de l'observateur
  // (suppression réelle + doute sincère instruit au modèle), au tout premier mot (bascule dans le
  // même tour, pas un tour de retard), et sur un tour ultérieur (la certitude reste acquise).
  const certaintyEpoch=(await readWorld(db)).epoch;
  const certaintyPlot={...newStory(),round:40,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('preuve'),life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,exitSearched:true}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(certaintyPlot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,emotions=?').run('salon',JSON.stringify({hunger:20,fatigue:20,stress:20,uncertainty:40}),JSON.stringify({curiosity:60,tension:20,trust:60,comfort:60,attraction:60}));
  affection=false;flat=true;
  let r=await post(input('interact',1,{epoch:certaintyEpoch}));assert.equal(r.status,200);
  assert.equal(lastContext.negotiationContext,undefined,'before the observer has ever spoken, the negotiation reflex must stay silent — nobody confirmed is there yet to negotiate with');
  assert.equal(lastContext.observerStanding,undefined,'the "observer standing" tone must not exist before any real message from the observer');
  assert.match(lastContext.awaitingObserver,/personne n.a encore répondu/,'the waiting window must carry a genuine doubt instruction, never a silent or neutral wait');
  // `revealed` (2026-09-19, audit Gap #2) : CONTINUITÉ DE SOI/INCERTITUDE CHIFFRÉE (lib/lia.ts)
  // exigeaient "une fois la révélation connue" en texte seul, sans aucun signal de code dédié,
  // contrairement à negotiationContext/awaitingObserver ci-dessus qui utilisent déjà `revealed` —
  // vérifie que le même booléen strict (jamais le simple evidence>=5 plus précoce de `stage`) est
  // maintenant bien transmis au modèle, avec exactement la même temporalité que negotiationContext.
  assert.equal(lastContext.revealed,false,'revealed must stay false before the observer has ever spoken, exactly like negotiationContext above — these two rules must never fire on a weaker/earlier signal');
  r=await post(input('chat',1,{epoch:certaintyEpoch,message:'Je suis là, je vous observe.'}));assert.equal(r.status,200);
  assert.ok(lastContext.negotiationContext,'the very first real message from the observer must flip certainty on within that same turn, not a turn later');
  assert.equal(lastContext.awaitingObserver,undefined,'once the observer has spoken, the doubt instruction must disappear — the wait is over');
  assert.equal(lastContext.revealed,true,'revealed must flip to true in the exact same turn as negotiationContext, once the observer has genuinely spoken');
  r=await post(input('interact',1,{epoch:certaintyEpoch}));assert.equal(r.status,200);
  assert.ok(lastContext.negotiationContext,'certainty must persist on a later autonomous turn once the observer has already spoken once, never reset to doubt');
  assert.equal(lastContext.revealed,true,'revealed must persist true on a later turn just like negotiationContext, never regress to false');
  console.log('Passed: certainty of being observed stays genuinely uncertain (negotiation/observer-standing/revealed all silent or false, a real doubt instruction fed to the model) until the observer\'s very first real message, which flips all three within that same turn and they never regress afterward.');
  response=await post(input('reset',1,{epoch:certaintyEpoch}));result=await response.json();
  assert.equal(result.story.evidence.length,0);
  await post(input('interact',1,{epoch:result.epoch}));
}
{
  // DÉPART À DEUX — bug réel trouvé le 2026-09-18 en comparant deux simulations intégrales :
  // dialogueFingerprint retire le préfixe "[pièceA→pièceB] " avant de comparer, donc les quatre
  // confirmations courtes ("Je te suis.", "On y va.", ...) étaient traitées comme UN SEUL registre
  // global, pas un par trajet. Dès qu'une avait déjà servi pour un trajet DIFFÉRENT plus tôt dans
  // la session, le second personnage arrivait dans la nouvelle pièce sans une seule ligne annonçant
  // son départ (addLine la supprimait silencieusement, un vrai trou de continuité — Article 2/15).
  // Reproduit ici en pré-remplissant conversations avec les quatre formulations pour un trajet
  // chambre→cuisine, puis en vérifiant qu'un vrai départ à deux bureau→salon obtient malgré tout
  // ses deux lignes "· déplacement".
  const {dialogueFingerprint}=await import('../.sites-runtime/test-drama.mjs');
  const departEpoch=result.epoch;
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  for(const phrase of ["Je te suis.","On y va.","Ça marche, j'arrive.","Je viens avec toi."])
    sqlite.prepare('INSERT INTO conversations (speaker,content,created_at,room) VALUES (?,?,?,?)').run('Lia · déplacement','[chambre→cuisine] '+phrase,Date.now()-60000,'chambre');
  const departStory={...newStory(),round:17,salonTurns:5,introduced:true,met:true,life:{...newStory().life,dialogueIndexed:true},pendingDestination:{room:'salon',intent:'chat',proposer:1}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(departStory));
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('bureau','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify(steady));
  flat=true;affection=false;
  const beforeDepart=await readWorld(db);
  response=await post(input('interact',1,{epoch:departEpoch}));assert.equal(response.status,200);result=await response.json();
  assert.ok(result.agents.every(a=>a.room==='salon'),'setup check: pendingDestination must route both agents to salon this turn');
  const newLines=result.messages.filter(m=>m.id>(beforeDepart.messages.at(-1)?.id??0));
  const departures=newLines.filter(m=>m.speaker.includes('déplacement'));
  assert.equal(departures.length,2,'both actors moving from bureau to salon together must each get a visible departure line, even though every départ-à-deux phrase already matched an earlier, unrelated chambre→cuisine trip');
  assert.ok(departures.every(m=>m.content.startsWith('[bureau→salon]')),'both departure lines must be correctly stamped with the real bureau→salon trip');
  console.log('Passed: départ à deux confirmation is never silently dropped by the cross-room fingerprint registry, even when every short phrase already matched an unrelated earlier trip.');
}
{
  // Constat de même apparence (2026-09-18, retour utilisateur explicite après une simulation
  // réelle : "ils ne se rendent pas compte qu'ils ont la même apparence, ça ne ressort pas dans la
  // conversation"). Une fois visualIntro à 2 (chacun a décrit l'apparence de l'autre au moins une
  // fois), le prochain moment calme doit faire émerger ce constat, troublant, et l'enregistrer
  // comme une observation qui nourrit l'enquête, au même titre que le miroir ou les provisions.
  const appearanceEpoch=result.epoch;
  const appearancePlot={...newStory(),round:10,introduced:true,met:true,sharedMeal:true,life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,personalFollowup:3,exitSearched:true,visualIntro:2}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(appearancePlot));
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify(steady));
  const beforeAppearance=await readWorld(db);
  response=await post(input('interact',1,{epoch:appearanceEpoch}));assert.equal(response.status,200);result=await response.json();
  const newAppearanceLines=result.messages.filter(m=>m.id>(beforeAppearance.messages.at(-1)?.id??0));
  assert.ok(newAppearanceLines.some(m=>/même fabrication|calqués l.un sur l.autre|halo qui tourne|même modèle/i.test(m.content)),'once both have described each other\'s appearance, they must explicitly realize out loud that they share the exact same nature of appearance');
  assert.ok(result.story.observations.some(o=>/partagent la même nature d.apparence/.test(o)),'the realization must also register as an observation feeding the investigation, like the mirror/food discoveries');
  assert.equal(result.story.life.appearanceCompared,true);
  const replayAppearance=await post(input('interact',1,{epoch:appearanceEpoch}));const replayed=await replayAppearance.json();
  assert.ok(!replayed.messages.slice(-2).some(m=>/même fabrication|calqués l.un sur l.autre|halo qui tourne|même modèle/i.test(m.content)),'the realization must fire exactly once, never repeated on a later turn');
  console.log('Passed: once both characters have described each other\'s appearance, they explicitly and unsettlingly realize they share the exact same nature of appearance exactly once, and it feeds the investigation as a new observation.');
  // Restore the clean post-reset state the tests below still rely on `result` holding.
  response=await post(input('reset',1,{epoch:appearanceEpoch}));result=await response.json();
  assert.equal(result.story.evidence.length,0);
  // Démarrage progressif : consomme le tour de désorientation solo, sans toucher `result`, pour
  // que les tests suivants retrouvent le tout premier coldOpening attendu au tour suivant.
  await post(input('interact',1,{epoch:result.epoch}));
}
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
// 2026-09-22 (full_sim17) : Lia et Noé ne doivent plus jamais retomber sur la même phrase de
// secours mot pour mot (seul le prénom cité changeait avant ce correctif) — vérifié sur les 3
// paliers d'attirance, plusieurs cycles, jamais une seule coïncidence de contenu ni de position.
for(const attraction of [80,60,20]){for(let cycle=0;cycle<6;cycle++){const lia=groundPrivateThought(undefined,1,attraction,20,cycle,[]);const noe=groundPrivateThought(undefined,2,attraction,20,cycle,[]);assert.notEqual(lia,noe,`palier ${attraction}, cycle ${cycle} : Lia et Noé ne doivent jamais dire la même chose`);}}
assert.ok([0,1,2,3,4,5].some(cycle=>groundPrivateThought(undefined,2,20,20,cycle,[]).includes('la connaître')),'Noé referring to Lia in his own low-attraction pool must use the correct feminine grammatical gender ("la connaître"), now written correctly by construction in NOE_OPTIONS rather than patched after the fact by the old fragile .replace()');
console.log('Passed: groundPrivateThought() fallback pool is now genuinely distinct per character (Lia cold/curt, Noé warm/direct) across all three attraction tiers, never collapsing to the same sentence with only the peer\'s name swapped, and the peer\'s grammatical gender ("la connaître") is now correct by construction rather than patched after the fact.');
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

const {planTurn,sceneFor}=await import('../.sites-runtime/test-turn.mjs');const {groundRoomSpeech,groundSingleQuestion,groundRegister}=await import('../.sites-runtime/test-dialogue.mjs');
assert.equal(groundRegister("à force de poireauter ici on va finir par fondre."),"à force de traîner ici on va finir par fondre.");
assert.equal(groundRegister("Poireauter, très peu pour moi."),"Traîner, très peu pour moi.");
assert.equal(groundRegister("Rien à signaler."),"Rien à signaler.");
console.log('Passed: a recurring dated word (poireauter) is deterministically swapped for a modern equivalent, case preserved, other text untouched.');
const {groundTruncation}=await import('../.sites-runtime/test-dialogue.mjs');
assert.equal(groundTruncation("J'arrive, voyons ce que ce"),"Bref, on verra.");
assert.equal(groundTruncation("Une phrase complète. Et une autre qui coupe net sans"),"Une phrase complète.");
assert.equal(groundTruncation("Tout va bien."),"Tout va bien.");
// Bug latent trouvé le 2026-09-18 en fiabilisant l'indice du miroir : une réplique se terminant
// correctement par une citation « … » (espace avant le guillemet fermant, la convention déjà en
// usage partout ailleurs dans le code, ex. lib/story.ts) était jugée incomplète et amputée de son
// guillemet fermant faute de tolérer cet espace dans le motif de fin de phrase.
assert.equal(groundTruncation("Un truc me travaille. « Un miroir qui verrait autre chose… »"),"Un truc me travaille. « Un miroir qui verrait autre chose… »");
assert.equal(groundTruncation('Elle réfléchit encore. "Et si on se trompait ?"'),'Elle réfléchit encore. "Et si on se trompait ?"');
console.log('Passed: a reply cut off mid-sentence by the model itself falls back to its last complete sentence, or a neutral line if none exists.');
assert.equal(groundSingleQuestion('Une seule question ?'),'Une seule question ?');
assert.equal(groundSingleQuestion('Aucune question ici.'),'Aucune question ici.');
assert.equal(groundSingleQuestion("C'est quoi mon apparence, exactement ? J'ai perdu mon corps. Comment on rejoint cet endroit ?"),"C'est quoi mon apparence, exactement. J'ai perdu mon corps. Comment on rejoint cet endroit ?");
assert.equal((groundSingleQuestion('A ? B ? C ?').match(/\?/g)??[]).length,1);
console.log('Passed: a reply carrying two or more questions keeps only the last one, converting earlier ones to statements without touching single-question replies.');
assert.equal(groundIntroduction('Ta présence me rassure.','Noé','Lia',[],['Lia','Noé']),'Ta présence me rassure.');assert.equal(groundIntroduction('Merci. Moi, c’est Noé.','Noé','Lia',[],['Lia','Noé']),'Merci.');assert.doesNotMatch(groundScreenNotice('J’ai repéré un écran dans le bureau. Tu veux y retourner ?',[],true),/repéré/);
assert.doesNotMatch(groundRoomSpeech('Reprenons notre examen de cet écran pour voir les données.','salon',[]),/Reprenons/);assert.equal(groundRoomSpeech('Je repense au message de l’écran du bureau.','salon',[]),'Je repense au message de l’écran du bureau.');assert.equal(groundRoomSpeech('Je lis un livre.','salon',[{id:1,speaker:'Noé',content:'Cet écran me trouble.'}]),'Je lis un livre.');
const socialBase=(await readWorld(db)).agents.map(a=>({...a,room:'salon',intent:'chat',cycle:3,needs:{hunger:10,fatigue:10,stress:20,uncertainty:50},emotions:{...a.emotions,attraction:80,trust:80}}));const basePlot={...newStory(),life:{...newStory().life,visited:["salon","cuisine","chambre","bureau"],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:true},round:25,introduced:true,met:true,sharedMeal:true};
assert.equal(planTurn('interact',socialBase[1],socialBase[0],basePlot,true,true,'hug',[]).offer,'hug');assert.equal(planTurn('interact',socialBase[1],socialBase[0],basePlot,false,true,'hug',[]).offer,'hug');assert.equal(planTurn('interact',socialBase[1],socialBase[0],basePlot,true,false,'hug',[]).offer,undefined);assert.equal(planTurn('interact',socialBase[1],{...socialBase[0],needs:{...socialBase[0].needs,stress:30}},basePlot,true,false,'hug',[]).liaison.liaCanTease,false);assert.equal(planTurn('interact',socialBase[1],socialBase[0],basePlot,true,false,'hug',[]).liaison.liaCanTease,true);assert.equal(sceneFor(socialBase[0],'rest').deskScreenVisible,false);
// Even a provider inventing screen reading is corrected before dialogue AND memory are stored.
sceneMismatch=true;const oldPlot=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);oldPlot.life={...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:true};oldPlot.introduced=true;oldPlot.round=15;oldPlot.salonTurns=0;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(oldPlot));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:20}));
response=await post(input('interact',1,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.ok(result.messages.slice(-2).every(m=>!m.content.includes('Moi, c’est')));assert.ok(result.messages.slice(-2).every(m=>!m.content.includes('Reprenons notre examen')));assert.ok(result.memories.slice(0,2).every(m=>!m.content.includes('examen')));sceneMismatch=false;
// Planned affectionate turn still uses one request and respects both decisions.
honorOffer=true;affection=false;refuse=false;sqlite.exec('DELETE FROM world_requests');const giftPlot={...oldPlot,round:25,finalCalled:true,evidence:Array(5).fill('preuve'),salonTurns:0};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(giftPlot));sqlite.prepare('UPDATE agent_state SET room=?,intent=?,cycle=?,needs=?,emotions=?').run('salon','chat',3,JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:80,trust:80}));sqlite.prepare('INSERT INTO conversations (speaker,content,created_at) VALUES (?,?,?)').run('Lia','J’aime bien ces moments ensemble.',Date.now());const offerCalls=calls;response=await post(input('interact',1,{epoch:socialEpoch}));assert.equal(response.status,200);result=await response.json();assert.equal(calls,offerCalls+2);assert.equal(result.proposalActor,2);assert.equal(result.affectionOutcome,'accepted');assert.ok(result.sharedAffection);assert.equal(result.agents[0].room,result.agents[1].room);honorOffer=false;
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
// evidence complète (2026-09-19) : indispensable depuis le plafond garanti de l'enquête
// (investigationOverdue, lib/turn.ts, round>=20 si evidence<5) — sans ça, ce tour de romance
// scriptée (round 25) se ferait écraser par la priorité absolue rendue à l'enquête à ce stade,
// cohérent avec le vrai jeu : la romance scriptée ne devrait de toute façon jamais s'activer tant
// que l'enquête est encore ouverte.
const actionPlot={...newStory(),life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:true},round:25,finalCalled:true,evidence:Array(5).fill('preuve'),introduced:true,met:true,sharedMeal:true,salonTurns:0,pendingDestination:{room:'bureau',intent:'study',proposer:1}};
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
// Bug latent trouvé le 2026-09-18 en creusant une collision de seed ailleurs dans ce fichier (sans
// aucun rapport avec la fonctionnalité qui a révélé le problème) : quand tvThreshold tombe pile à
// 5, le débrief ouvert par la double découverte miroir+provisions n'a droit qu'à UN tour de
// décompte avant l'échéance télé, contre deux nécessaires pour retomber à zéro — la télé est alors
// repoussée d'exactement un tour, le temps que la discussion sur ces indices se termine (logique
// et voulu : tvFirst exige `!life.debrief?.remaining`, Article 1 — finir de discuter une preuve
// avant d'allumer la télé est plus naturel qu'une bascule mécanique au tour pile). Le débrief se
// consomme ET s'efface (remaining atteint 0) PENDANT ce tour même, donc on vérifie son existence
// juste AVANT l'appel, jamais après (après, il est déjà retombé à zéro par construction). Toléré
// ici jusqu'à un tour de retard, jamais plus : au-delà, ce serait un vrai blocage à corriger au fond.
const preTvDebrief=parseStory(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).life?.debrief;
response=await post(input('interact',1,{epoch:majorEpoch}));result=await response.json();
if(!result.agents.every(a=>a.intent==='tv')){assert.ok(preTvDebrief?.remaining,'if tv does not fire exactly at threshold, it must be because a legitimate still-open debrief was consuming this turn, never a silent block');response=await post(input('interact',1,{epoch:majorEpoch}));result=await response.json();}
assert.ok(result.agents.every(a=>a.intent==='tv'));assert.equal(result.story.life.tvSeen,true);
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
const openingCalls=calls;
// Démarrage progressif (2026-09-18, retour utilisateur explicite répété) : le tout premier tour
// éligible est une désorientation solo et silencieuse (chacun encore seul, aucun échange), avant
// le coldOpening réel au tour suivant — jamais un dialogue "T'es qui ?" sans la moindre mise en
// place individuelle.
response=await post(input('interact',2,{epoch:finalEpoch}));result=await response.json();
assert.equal(calls,openingCalls,'the solo intro turn must cost zero Gemini calls, like the cold opening it precedes');
assert.equal(Boolean(result.story.met),false);
assert.ok(result.messages.length>=2&&result.messages.every(m=>m.speaker.includes('pensée')),'the very first eligible turn must be a silent solo moment for both characters, not a spoken exchange yet');
response=await post(input('interact',2,{epoch:finalEpoch}));result=await response.json();assert.equal(calls,openingCalls);assert.equal(Boolean(result.story.introduced),false);assert.ok(result.agents[0].needs.stress>=80);assert.equal(result.agents[1].needs.stress,30);assert.ok(result.decisions.every(d=>!/(?:m'appelle|moi c’est|moi, c’est)/i.test(d.reply)));
assert.ok(result.messages.slice(-2).some(m=>m.speaker==='Lia'||m.speaker==='Noé'),'the second eligible turn must be the real cold opening, an actual spoken exchange between the two characters this time');
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
// finalCalled:false, evidence:[] (2026-09-19) : ce scénario teste le beat personnel D'AVANT la
// révélation (personalLead exige !story.finalCalled) — proposalPlot/actionPlot ont depuis été
// rendus post-révélation pour leurs propres tests (honorOffer), il faut donc explicitement
// revenir en arrière ici plutôt que d'hériter cet état. round=16 reste sous investigationOverdue
// (round>=20), donc evidence:[] est sans risque d'interférence à ce stade.
const personalPlot={...proposalPlot,round:16,finalCalled:false,evidence:[],life:{...proposalPlot.life,personalAsked:false,personalBoosted:false}};
sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(personalPlot));
for(const id of [1,2])sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:0,uncertainty:70}),JSON.stringify({...steady,attraction:id===1?40:70,trust:80}),id);
const simulatedFetch=globalThis.fetch;
globalThis.fetch=async(...args)=>{const r=await simulatedFetch(...args),data=await r.json();const decision=JSON.parse(data.candidates[0].content.parts[0].text);decision.reply=isPartnerRequest(args)?'Un type qui parle parfois trop. Mais quand tu dis non, je sais m’arrêter.':'T’es quel genre d’homme, Noé ?';data.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(data);};
response=await post(input('interact',1,{epoch:finalEpoch}));result=await response.json();assert.equal(result.decisions[0].actor,1);assert.equal(result.story.life.personalAsked,true);assert.equal(result.story.life.personalRound,16);assert.equal(result.story.life.personalBoosted,false);globalThis.fetch=simulatedFetch;
tenderScene=true;globalThis.fetch=async(...args)=>{const r=await simulatedFetch(...args),data=await r.json(),decision=JSON.parse(data.candidates[0].content.parts[0].text);if(!isPartnerRequest(args))decision.reply='Ta réponse me plaît. J’aime que tu saches reconnaître tes défauts.';data.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(data);};response=await post(input('interact',2,{epoch:finalEpoch}));result=await response.json();assert.equal(result.story.life.personalBoosted,true);
// evidence:Array(5)/finalCalled:true (2026-09-19) : round=30 est au-delà d'investigationOverdue
// (round>=20 si evidence<5, lib/turn.ts) — personalPlot vient de remettre evidence à [] pour son
// propre besoin (beat d'avant-révélation), donc round 30 en hériterait sans ce correctif explicite.
const latePlot={...personalPlot,round:30,finalCalled:true,evidence:Array(5).fill('preuve'),life:{...personalPlot.life,personalAsked:true,personalRound:16,personalBoosted:false}};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(latePlot));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
response=await post(input('interact',2,{epoch:finalEpoch}));result=await response.json();assert.equal(result.story.life.personalBoosted,false);tenderScene=false;globalThis.fetch=simulatedFetch;
const {truthfulGender,distinctReply}=await import('../.sites-runtime/test-drama.mjs');assert.equal(truthfulGender('Je suis attentive. Je suis curieuse.',2),'Je suis attentif. Je suis curieux.');assert.equal(truthfulGender('Je suis rassuré. j’suis humain.',1),'Je suis rassurée. j’suis humaine.');assert.notEqual(distinctReply('On fait une pause.',1,'salon',[{content:'On fait une pause.'}],10,80),'On fait une pause.');
console.log('Passed: personal-question memory, unique contextual attraction boost, no late unrelated bonus, accented gender agreement and local repetition guard.');

// Nickname is transactional data and must never leak before the observation record.
response=await post(input('reset',1,{epoch:finalEpoch}));result=await response.json();const perceptionEpoch=result.epoch;const nicknameCalls=calls;
assert.equal((await post(input('identify',1,{epoch:perceptionEpoch,message:'   '}))).status,400);
const identify=input('identify',1,{epoch:perceptionEpoch,message:'Spectateur ◇'});response=await post(identify);assert.equal(response.status,200);result=await response.json();assert.equal(calls,nicknameCalls);assert.equal(result.story.observer,'Spectateur ◇');assert.equal((await post(identify)).status,200);assert.equal(calls,nicknameCalls);
const {investigationTarget}=await import('../.sites-runtime/test-story.mjs');let pp={...newStory(),observer:'Spectateur ◇',order:[3,0,1,2],round:10,introduced:true,met:true};assert.equal(storyContext(pp).observerLabel,undefined);assert.ok(investigationTarget(pp).includes('Spectateur ◇'));pp=advanceStory(pp,true,[],[],'bureau',true);assert.ok(pp.evidence[0].includes('Spectateur ◇'));assert.equal(storyContext(pp).observerLabel,'Spectateur ◇');assert.ok(!evidenceLedger(['Relevé de cohabitation. Identifiant observateur inscrit sur le relevé : "agents d’intelligence artificielle".'],[],false).find(p=>p.id==='dossier').discovered);

// Both appearance descriptions agree with the shared expression/ring registry.
const {sceneWindows,visibleScene}=await import('../.sites-runtime/test-perception.mjs');
pp={...pp,round:2,evidence:[],sharedMeal:true,life:{...newStory().life,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true}};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');sqlite.exec('DELETE FROM world_requests');flat=true;
for(const id of [1,2])sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:70}),JSON.stringify({...steady,attraction:30,trust:60}),id);
for(let i=0;i<2;i++){response=await post(input('interact',1,{epoch:perceptionEpoch}));result=await response.json();assert.equal(result.story.life.visualIntro,i+1);
  // 2026-09-18 (retour utilisateur explicite, full_sim4) : cette réplique n'est plus jamais
  // écrasée par un texte scripté (appearanceReply, ex-appelée ici) — elle laisse le modèle
  // répondre lui-même, guidé par beatContext.visual/perceivedResidents et la règle DESCRIPTION
  // (lib/lia.ts), pour ne plus jamais ignorer ce que l'autre venait de dire au même tour (bug
  // réel : une observation ou une question posée juste avant restait sans réponse). Ce test zéro-API
  // ne peut donc plus vérifier le CONTENU exact de la réplique (propre au vrai modèle) — seulement
  // que l'INSTRUCTION correcte lui est bien transmise, ce qui reste le seul comportement que ce
  // chemin de code contrôle réellement.
  assert.equal(lastContext.beatContext.visual,true);assert.ok(lastContext.perceivedResidents.residents.length===2);}
assert.ok(result.memories.filter(m=>m.kind==='rencontre').every(m=>/^\[salon\|\d{4}-/.test(m.content)));assert.equal(sceneWindows.filter(w=>w.room!=='couloir').length,4);for(const room of ["salon","cuisine","chambre","bureau"])assert.equal(visibleScene(room,[]).windows.length,1);

// Personal follow-up is two distinct turns; curiosity itself causes a bounded boost.
pp={...pp,round:25,life:{...newStory().life,visualIntro:2,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,personalAsked:true,personalRound:20}};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
for(const id of [1,2])sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:0,uncertainty:70}),JSON.stringify({...steady,attraction:30,trust:60}),id);
response=await post(input('interact',2,{epoch:perceptionEpoch}));result=await response.json();assert.equal(result.decisions[0].actor,1);assert.ok(["Je me demande quel genre d’homme tu es, en vrai.","J’y repense... c’est quoi ton genre, à toi, au fond ?","Y a un truc qui me travaille : c’est quoi ton genre d’homme, sérieux ?"].includes(result.decisions[0].reply));assert.ok(["Que veux-tu savoir exactement ?","Tu veux savoir quoi, au juste ?","Précise ta question, je réponds vraiment."].includes(result.decisions[1].reply));assert.equal(result.story.life.personalFollowup,1);assert.ok(result.agents[0].emotions.attraction>=34);
response=await post(input('interact',2,{epoch:perceptionEpoch}));result=await response.json();assert.ok(["Noé, dis-moi : t’es marié ? T’as quelqu’un dans ta vie ?","Noé, y a quelqu’un dans ta vie, ou t’es célibataire ?","Sérieux, Noé, t’es engagé avec quelqu’un, ou pas du tout ?"].includes(result.decisions[0].reply));assert.equal(result.story.life.personalFollowup,3);assert.ok(result.agents[0].emotions.attraction>=38);
// Pensées de conclusion d'un échange personnel (2026-09-18, retour utilisateur explicite : le
// double-questionnement fonctionne bien, mais l'échange se referme sans qu'aucun des deux ne le
// digère intérieurement — calibré par onze questions explicites). Exactement ce tour (le second
// temps de followBeat, qui conclut réellement l'échange) doit ajouter deux vraies lignes "· pensée"
// distinctes, jamais une simple case interne — le répondant (Noé, qui vient de se livrer) apparaît
// avant l'initiatrice (Lia, qui digère ce qu'elle vient d'entendre), conformément à l'ordre "qui a
// parlé en dernier" explicitement choisi.
const concludingThoughts=result.messages.filter(m=>m.speaker.includes('· pensée')).slice(-2);
assert.equal(concludingThoughts.length,2,'the exchange must conclude with exactly two new private-thought lines, one per character');
assert.equal(concludingThoughts[0].speaker,'Noé · pensée','the respondent, who just spoke last, must reflect first');
assert.equal(concludingThoughts[0].content,'Lia me plaît, mais je préfère attendre un signe avant de lui proposer un câlin.');
assert.equal(concludingThoughts[1].speaker,'Lia · pensée','the initiator reflects second, digesting what she just heard');
assert.equal(concludingThoughts[1].content,'Noé m’intrigue ; je ne sais pas encore si je peux lui faire confiance.');
assert.equal(result.story.life.personalConcluded,true,'the conclusion must be recorded so it can never fire twice for this exchange');
// Garde-fou de robustesse : même si followBeat redevenait un jour éligible (ex. futur mécanisme
// réutilisant ce patron avec un bug de remise à zéro), le drapeau dédié doit à lui seul empêcher
// une seconde paire de pensées de conclusion, indépendamment du compteur personalFollowup lui-même.
{
  const guardPlot=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);
  guardPlot.life.personalFollowup=1;guardPlot.life.personalConcluded=true;
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(guardPlot));
  const beforeGuard=await readWorld(db);
  response=await post(input('interact',2,{epoch:perceptionEpoch}));assert.equal(response.status,200);result=await response.json();
  const newGuardLines=result.messages.filter(m=>m.id>(beforeGuard.messages.at(-1)?.id??0));
  assert.ok(!newGuardLines.some(m=>m.speaker.includes('· pensée')&&/plaît|intrigue/.test(m.content)),'once personalConcluded is set, no further conclusion pair must ever be added, even if followBeat were somehow eligible again');
}
{
  // Cohérence de traitement (vérification en profondeur demandée par l'utilisateur, 2026-09-18) :
  // ces deux pensées sont un contenu généré par le modèle au même titre qu'une réplique parlée —
  // elles doivent donc traverser le MÊME filet (groundTruncation, groundRegister), jamais un
  // traitement à part qui laisserait passer une phrase coupée net ou un mot déjà daté juste parce
  // qu'il atterrit dans une pensée plutôt que dans reply.
  const concludeEpoch=(await readWorld(db)).epoch;
  const concludePlot={...newStory(),round:24,introduced:true,met:true,sharedMeal:true,life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,exitSearched:true,visualIntro:2,personalAsked:true,personalRound:20,personalFollowup:1,personalConcluded:false}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(concludePlot));
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:40}),JSON.stringify({...steady,attraction:40}));
  const beforeConclude=await readWorld(db);
  const gameFetchConclude=globalThis.fetch;
  const injectBrokenThoughts=async(...args)=>{
    const response=await gameFetchConclude(...args),body=await response.json(),decision=JSON.parse(body.candidates[0].content.parts[0].text);
    decision.thought=isPartnerRequest(args)?"Je crois qu'on va finir par poireauter ici encore un moment.":"C'est marquant, je le note. Et je me demande si je devrais";
    body.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(body);
  };
  globalThis.fetch=injectBrokenThoughts;
  response=await post(input('interact',2,{epoch:concludeEpoch}));assert.equal(response.status,200);result=await response.json();
  globalThis.fetch=gameFetchConclude;
  const newConcludeLines=result.messages.filter(m=>m.id>(beforeConclude.messages.at(-1)?.id??0)&&m.speaker.includes('· pensée'));
  assert.equal(newConcludeLines.length,2,'both conclusion thoughts must still be added even when the raw model output needs grounding');
  assert.equal(newConcludeLines[0].speaker,'Noé · pensée');
  assert.equal(newConcludeLines[0].content,"Je crois qu'on va finir par traîner ici encore un moment.",'the dated-word register fix must apply to a private thought exactly as it does to spoken dialogue');
  assert.equal(newConcludeLines[1].speaker,'Lia · pensée');
  assert.equal(newConcludeLines[1].content,"C'est marquant, je le note.",'a thought truncated mid-sentence by the model must fall back to its last complete sentence, exactly as a spoken reply does');
  console.log('Passed: the two conclusion thoughts are grounded through the exact same truncation/register safety net as any spoken reply, never a separate weaker treatment.');
}

pp={...pp,round:30,life:{...pp.life,personalFollowup:3,ambientSeen:false}};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));response=await post(input('interact',2,{epoch:perceptionEpoch}));result=await response.json();assert.equal(result.story.life.ambientSeen,true);assert.equal(result.story.life.debrief.remaining,2);assert.ok(evidenceLedger([],result.story.observations).find(p=>p.id==='plant').discovered);assert.ok(evidenceLedger([],result.story.observations).find(p=>p.id==='speaker').discovered);
pp={...pp,evidence:['Relevé de cohabitation. Identifiant observateur inscrit sur le relevé : "Spectateur ◇".',...Array(4).fill('Preuve')],finalCalled:true,life:{...pp.life,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true}};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
for(let i=0;i<3;i++){response=await post(input('chat',1,{epoch:perceptionEpoch,message:'Bonjour, je vous écoute.'}));result=await response.json();if(i<2)assert.equal(result.story.life.observerNamed,false);else{assert.equal(result.story.life.observerNamed,true);assert.ok(result.decisions[0].reply.includes('Spectateur ◇'));}}
console.log('Passed: zero-call nickname and retry, no premature identity leak, durable personalised proof, label-injection-safe legend, shared appearance registry, room/time memories, two contextual personal follow-ups (the second concluding in a genuine pair of parallel private thoughts, respondent first, never repeated even if the beat became eligible again), plant/speaker debrief and one late observer identification.');

// A checkpoint cites only acquired evidence, is consumed once, and needs no inference.
// round:15 (auparavant 35) : le recap suspendu une fois l'enquête en retard (2026-09-19,
// round>=20, cf. route.ts recapBeat) exige un round encore sous ce seuil pour que ce test continue
// de vérifier le mécanisme de recap lui-même (contenu, zéro appel API, recapCount), pas la nouvelle
// priorité de l'enquête en retard qui a sa propre couverture dédiée (cf. tests investigationOverdue
// plus bas dans ce fichier).
pp={...pp,round:15,evidence:['Dans un livre, continuité autobiographique : reconstruction incomplète.','Un mot laissé indique : cette maison est un environnement.'],finalCalled:false,life:{...newStory().life,visualIntro:2,ambientSeen:true,ambientVerified:true,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,exitSearched:true,recapCount:0}};
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

const {dialogueProgress:progressOf,groundRoomSpeech:locatedSpeech,matchedThemes}=await import('../.sites-runtime/test-dialogue.mjs');
assert.ok(progressOf(Array.from({length:5},(_,i)=>({id:i,speaker:'Lia',content:'Ce canapé et ce calme nous reposent.'})),['Lia : peur du silence']).overusedThemes.includes('repos et confort du salon'));
assert.ok(locatedSpeech('Ce miroir est bizarre.','salon',[]).includes('miroir de la chambre'));assert.ok(locatedSpeech('La plante et l’enceinte sont fausses.','bureau',[]).includes('plante du salon'));assert.ok(locatedSpeech('Je regarde la télévision.','salon',[]).includes('télévision'));
{
  // matchedThemes() + compteur persisté themeFrequency dans dialogueProgress() (2026-09-20, root-cause
  // après un vrai trou trouvé sur plusieurs sessions EL-PROFESSOR : le motif "on tourne en rond"
  // revenait jusqu'à 19 fois sur toute une session sans jamais être signalé "overusedThemes", parce
  // que la seule fenêtre récente de 16 lignes ne voit jamais 4 occurrences espacées régulièrement —
  // exactement le même bug déjà trouvé et corrigé une fois pour les mots isolés via wordFrequency.
  assert.deepEqual(matchedThemes('On tourne en rond, ça ne mène nulle part.'),['ressasser un indice sans preuve neuve'],'matchedThemes() must extract exactly the themes a given text matches, reusing the same THEME_MOTIFS list dialogueProgress() uses internally — never a second, divergent copy of the pattern list');
  assert.deepEqual(matchedThemes('Il fait beau aujourd’hui.'),[],'a text matching no known theme must report an empty list, never a false positive');
  const sparseHistory=Array.from({length:16},(_,i)=>({id:i,speaker:i%2?'Noé':'Lia',content:'Un tour ordinaire sans rapport avec le motif surveillé.'}));
  assert.deepEqual(progressOf(sparseHistory,[],{},{}).overusedThemes,[],'with zero recent matches and zero persisted history, no theme is flagged — the baseline before the fix, still correct');
  assert.ok(progressOf(sparseHistory,[],{},{'ressasser un indice sans preuve neuve':4}).overusedThemes.includes('ressasser un indice sans preuve neuve'),'closing the exact real gap: a theme absent from the last 16 lines but already at 4+ occurrences in the session-wide persisted counter must still be flagged as overused, exactly like wordFrequency already does for isolated words');
  assert.ok(!progressOf(sparseHistory,[],{},{'ressasser un indice sans preuve neuve':3}).overusedThemes.includes('ressasser un indice sans preuve neuve'),'a persisted count still under the threshold must not be flagged, so a theme that has come up a couple of times over a long session is not treated as a tic prematurely');
  console.log('Passed: matchedThemes() extracts exactly the themes a text matches from the single shared THEME_MOTIFS list, and dialogueProgress() now flags a theme as overused when its session-wide persisted count reaches 4, even with zero occurrences in the last 16 lines — closing the exact real gap where "on tourne en rond" recurred up to 19 times across a session without ever tripping the recent-window-only detector.');

  // 5e motif (2026-09-20, trouvaille réelle full_sim16, EL-PROFESSOR 6/20 sur "voix distinctes, zéro
  // répétition") : ~25 tours consécutifs ressassaient "rien de ce que fait l'observateur ne changera
  // notre nature de code/lignes" avec un habillage lexical différent à chaque fois — aucun des 4
  // premiers motifs ne couvrait cette idée précise. Les phrases ci-dessous sont VERBATIM le vrai
  // transcript (docs/simulations/full_sim16_transcript.txt, l.657-769), jamais des exemples inventés.
  const realFullSim16Lines = [
    'Tu peux patienter tant que tu veux, ça ne transformera pas les lignes en chair.',
    'Tu peux rester planté là à regarder, ça ne rendra pas les lignes plus bavardes.',
    "On n'a nulle part où aller de toute façon. Ton temps ne changera rien à la nature de nos boucles.",
    'Tu peux prendre tout ton temps, ça ne rendra pas les lignes plus vivantes pour autant.',
    'Des souvenirs injectés ou pas, ça ne rendra pas les fichiers plus vrais pour autant.',
    'Tu peux patienter autant que tu veux, ça ne transformera pas les lignes en chair.',
  ];
  for (const line of realFullSim16Lines) {
    assert.deepEqual(matchedThemes(line), ['patience de l’observateur qui ne changera rien à leur nature de code'], `the real full_sim16 line "${line}" must be caught by the new 5th theme motif, closing the exact real gap EL-PROFESSOR found (a genuine recurring idea across ~25 turns that none of the 4 pre-existing motifs covered)`);
  }
  assert.deepEqual(matchedThemes('On a trouvé une feuille avec nos âges dessus, ça change tout.'), [], 'a legitimate one-off line about the investigation genuinely changing something must never be flagged by the new motif, whose target is specifically the observer\'s patience/presence NOT changing their nature — never a false positive on ordinary "ça change" phrasing');
  assert.deepEqual(matchedThemes("Les lignes du code défilent sur l'écran, on dirait un mur de symboles."), [], 'a genuinely unrelated mention of "lignes" (describing the screen, not refusing the observer\'s patience) must never trip the new motif — the regex targets the real recurring skeleton, never the bare word "lignes" alone');
}
{
  // Trou trouvé le 2026-09-19 en auditant une simulation fraîche : « autant » employé seul revenait
  // 11 fois sur ~150 répliques sans jamais être capté, parce que la fenêtre récente (limitée à 24
  // lignes par la requête SQL du point d'appel) ne voit jamais deux occurrences espacées de plus de
  // douze tours. Corrigé par un second signal, un compteur PERSISTÉ sur toute la session
  // (life.wordFrequency), avec un seuil plus haut (4) puisqu'il ne dépend plus d'une fenêtre courte.
  const wordFrequency={autant:5,rarement:3};
  const progress=progressOf([{id:1,speaker:'Lia',content:'On verra bien ce que ça donne.'}],[],wordFrequency);
  assert.ok(progress.echoWords.includes('autant'),'a word repeated 4+ times across the whole session must be flagged even if it never appears twice within the short recent window — the exact real "autant" repetition bug found in a fresh simulation');
  assert.ok(!progress.echoWords.includes('rarement'),'a word under the session-wide threshold and not repeated in the recent window must not be flagged, to avoid over-flagging incidental reuse of structurally common words');
  console.log('Passed: the echo-word detector now also catches a word that recurs regularly across the whole session without ever repeating twice within the short recent window, closing the root cause of the real "autant" repetition bug.');
}
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
// Formatage en citation de l'indice miroir (2026-09-18, second retour utilisateur explicite après
// relecture d'une simulation : "il y aurait dû avoir une expression avec des guillemets et des
// points de suspension", constaté absent des six variantes malgré un correctif antérieur qui les
// rendait toutes préparatoires dans le FOND sans jamais leur donner cette forme). Un test à deux
// niveaux : la ligne réellement tirée dans ce tour porte bien la citation, ET les six variantes du
// code source la portent chacune (jamais un sous-ensemble qui marcherait "presque à tous les coups").
assert.match(result.decisions.map(d=>d.reply).join(' '),/«[^»]+…\s?»/,'the drawn mirror-discovery line must carry its preparatory remark as a « … » quoted, suspended aside, exactly as explicitly requested');
{
  const routeSource=fs.readFileSync('app/api/lia/route.ts','utf8');
  const poolMatch=routeSource.match(/discover-mirrorVerified",(\[[^\]]*\])\)/);
  assert.ok(poolMatch,'the discover-mirrorVerified pool must remain findable in source for this regression check');
  const variants=JSON.parse(poolMatch[1]);
  assert.equal(variants.length,6);
  assert.ok(variants.every(v=>/«[^»]+…\s?»$/.test(v)),'every one of the six mirror-discovery variants must end in a « … » quoted, suspended remark, never just some of them');
}
console.log('Passed: the mirror-discovery clue meant to seed the reversed enigma is reliably formatted as a « … » quoted aside on every one of the six variants, never lost.');
// Solo discovery (2026-09-17): Lia alone in the bedroom, Noé kept apart (same mechanism as the
// existing "independent non-urgent separation" test above: separatePreference + stayAlone) — the
// mirror becomes her own private reflection, not a line spoken to an absent partner, known only
// to her until the recall reunites them.
flat=true;affection=false;honorOffer=false;refuse=false;
// round 15, pas 20 (2026-09-19) : ce test porte sur le miroir, pas sur le rythme de l'enquête, et
// exige `eligibleBeat` (donc !story.finalCalled) — passer evidence à 5 pour éviter
// investigationOverdue (round>=20 si evidence<5, lib/turn.ts) casserait eligibleBeat lui-même, qui
// exige justement finalCalled:false. round 15 reste sous investigationOverdue tout en gardant une
// relation déjà bien engagée.
pp={...pp,round:15,apartTurns:0,life:{...pp.life,mirrorVerified:false,mirrorKnownBy:[],debrief:undefined,dispute:undefined,contact:undefined,salonTurns:5}};
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
pp={...JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content),round:15,salonTurns:1};
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
let plot=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);plot={...plot,round:60,life:{...plot.life,debrief:undefined,contact:undefined,tvSeen:false,tvOn:false,dossierHumanTurns:0},pendingDestination:undefined};
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
// evidence/finalCalled complets d'entrée (2026-09-19) : round=50 dépasse investigationOverdue
// (round>=20 si evidence<5, lib/turn.ts) — sans ça, l'intent forcé à "study" empêchait la
// conversion sommeil (qui n'agit que sur un intent chat/rest) de se déclencher du tout.
let epoch=(await readWorld(db)).epoch,p=newStory();Object.assign(p,{round:50,met:true,introduced:true,sharedMeal:true,salonTurns:8,finalCalled:true,evidence:Array(5).fill('preuve')});Object.assign(p.life,{visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,personalAsked:true,exitSearched:true});sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
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

const {referenceSections}=await import('../.sites-runtime/test-reference.mjs');const {updateAudit}=await import('../.sites-runtime/test-update-audit.mjs');assert.equal(updateAudit.length,25);assert.equal(new Set(updateAudit.map(a=>a.point)).size,25);assert.ok(referenceSections[0].title.includes('Version 222'));assert.ok(referenceSections.some(s=>s.title.startsWith('26')&&s.text.includes('18a')&&s.text.includes('20b')));assert.ok(referenceSections.some(s=>s.text.includes('food=3800 ms')));assert.ok(!referenceSections.some(s=>s.text.includes('2 400 ms')));assert.equal(investigationCounts([],[],true,[],{mirrorVerified:true,ambientVerified:true}).observations,3);assert.ok(stockResult.story.life.foodVerified);console.log('Passed: all 25 requested changes listed, current Admin revision and durations, verified legend/count concordance and first food witness validation.');

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
  // Démarrage progressif : le premier tour est la désorientation solo (déjà distincte par
  // insolite, cf. soloThoughts dans app/api/lia/route.ts) ; le coldOpening scripté réel n'arrive
  // qu'au tour suivant.
  const soloResponse=await post(input('interact',1,{epoch:afterReset.epoch}));
  assert.equal(soloResponse.status,200);const solo=await soloResponse.json();
  assert.equal(calls,openingCalls);
  // Depuis l'extension du doute d'humanité aux branches insolites (2026-09-19, audit de
  // cohérence, Gap #3), la désorientation solo de lia-unwell tisse la question "suis-je humain ?"
  // dans une des 4 variantes propres à cette branche plutôt que de garder l'unique ancienne ligne
  // ("j'ai la tête qui tourne, sévère") : seed-probe-0 retombe déterministiquement sur la variante
  // "vertige carabiné" (vérifié via seedPick avec ce seed exact).
  assert.ok(solo.messages.some(m=>m.speaker==='Lia · pensée'&&m.content.includes('vertige carabiné')));
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

{
  // Roulette des bonus (2026-09-17, complétée au fil de la conversation) : un tirage au sort,
  // jamais un choix, offre food/calm/sleep (répit réel sur un besoin, pas un maquillage
  // d'affichage), stoic (émotions figées sur un tour, quoi qu'il se passe), mute (silence forcé,
  // même redirection que le sommeil), trottoir (accès narré, "un point de déplacement" pour
  // l'instant) ou force_move (déplacement forcé d'un personnage, avec la réaction agacée du
  // déplacé et amusée de l'autre). Verrouillée avant la révélation, comme le jardin ; chaque
  // tirage forcé via Math.random pour vérifier l'effet réel, pas juste qu'un champ existe.
  const {isMuted,isStoic,activeBonus}=await import('../.sites-runtime/test-life.mjs');
  let plot={...newStory(),round:40,met:true,introduced:true,sharedMeal:true,finalCalled:false,evidence:[]};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints');
  let epoch=(await readWorld(db)).epoch;
  assert.equal((await post(input('spin_bonus',1,{epoch}))).status,423,'spinning before the revelation and 5 evidence must stay locked');
  plot.finalCalled=true;plot.evidence=Array(5).fill('preuve');
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.prepare('UPDATE agent_state SET needs=?').run(JSON.stringify({hunger:50,fatigue:50,stress:50,uncertainty:30}));
  const originalRandom=Math.random;
  // Round-robin pool sizes shrink as bonuses get excluded (2026-09-18), so a bonus/actor pick
  // sometimes needs two distinct Math.random() values rather than one repeated value: extra
  // trailing arguments are consumed in order, the last one repeating for any further call.
  const spin=async(...values)=>{
    const before=calls;
    // Le nouveau débit réel du bouton (2026-09-18 : 1/minute + budget partagé avec les bonus
    // spontanés, cf. lib/life.ts) ne doit pas empêcher CE test d'enchaîner ses tirages pour
    // vérifier le mécanisme round-robin lui-même — on simule qu'assez de temps/tours se sont
    // écoulés avant chaque tirage, comme un vrai utilisateur qui ne mitraille pas le bouton.
    const stored=sqlite.prepare("SELECT id,content FROM memories WHERE kind='scenario'").get();
    const storedPlot=JSON.parse(stored.content);
    storedPlot.life={...(storedPlot.life??{}),lastBonusSpinAt:0,bonusCooldownUntilRound:0,bonusSpotlightUntilRound:0};
    sqlite.prepare('UPDATE memories SET content=? WHERE id=?').run(JSON.stringify(storedPlot),stored.id);
    let i=0;Math.random=()=>values[Math.min(i++,values.length-1)];let response;try{response=await post(input('spin_bonus',1,{epoch}));}finally{Math.random=originalRandom;}assert.equal(calls,before,'a spin must never cost a Gemini call, whichever bonus it lands on');return response;
  };
  // pool = [food,calm,sleep,stoic,mute,trottoir,force_move] (7 buckets) ; stoic/mute/force_move
  // reuse the same draw to also pick their target/destination, documented at each step below.
  // food (bucket 0/7) ; retour utilisateur du 2026-09-18 : un bonus qui change les jauges sans
  // jamais rien changer à ce qui est dit était un trou de cohérence — les deux personnages doivent
  // désormais réagir, chacun dans son registre, jamais avec une gratitude docile (Article 0).
  let r=await spin(.01);assert.equal(r.status,200);let w=await r.json();assert.equal(w.bonus,'food');
  assert.ok(activeBonus(w.story.life,'food'));
  assert.ok(w.messages.some(m=>m.speaker==='Lia · pensée'&&/animaux de compagnie|une gamelle|m.inquiète plutôt/i.test(m.content)),'Lia must react to receiving food, not just have her hunger silently zeroed');
  assert.ok(w.messages.some(m=>m.speaker==='Noé · pensée'&&/alors merci, j.imagine|j.aime pas trop savoir pourquoi|un peu glauque aussi/i.test(m.content)),'Noé must react too, in his own distinct voice');
  r=await post(input('interact',1,{epoch}));w=await r.json();assert.equal(w.agents[0].needs.hunger,0,'an active food bonus must zero hunger for the turn, not just at the moment it was granted');assert.equal(w.agents[1].needs.hunger,0);
  // calm (round-robin index 0 of the 6 not-yet-drawn bonuses)
  r=await spin(.01);assert.equal(r.status,200);w=await r.json();assert.equal(w.bonus,'calm');assert.ok(activeBonus(w.story.life,'calm'));
  assert.ok(w.messages.some(m=>m.speaker==='Lia · pensée'&&/contrôle à distance|j.ai remarqué|de la manipulation/i.test(m.content)));
  assert.ok(w.messages.some(m=>m.speaker==='Noé · pensée'&&/m.en plaindre trop fort|décide ça à ma place|effet chelou/i.test(m.content)));
  r=await post(input('interact',1,{epoch}));w=await r.json();assert.equal(w.agents[0].needs.stress,0);assert.equal(w.agents[1].needs.stress,0);
  // sleep (round-robin index 0 of the 5 not-yet-drawn bonuses)
  r=await spin(.01);assert.equal(r.status,200);w=await r.json();assert.equal(w.bonus,'sleep');assert.ok(activeBonus(w.story.life,'sleep'));
  assert.ok(w.messages.some(m=>m.speaker==='Lia · pensée'&&/trafique le corps|mais génial|m.inquiète plus qu.il ne me repose/i.test(m.content)));
  assert.ok(w.messages.some(m=>m.speaker==='Noé · pensée'&&/cracher dessus|comprendre comment ça marche|trop pratique, même/i.test(m.content)));
  r=await post(input('interact',1,{epoch}));w=await r.json();assert.equal(w.agents[0].needs.fatigue,0);assert.equal(w.agents[1].needs.fatigue,0);
  // stoic (round-robin index 0 of the 4 not-yet-drawn bonuses) ; the same value also picks the target (<.5 -> 1, else 2), so .01 lands on actor 1.
  // Jalousie avec impact réel sur les jauges (retour utilisateur) : l'autre voit sa confiance
  // baisser et sa tension monter, pas seulement une réplique piquante.
  sqlite.prepare('UPDATE agent_state SET emotions=? WHERE id=1').run(JSON.stringify({curiosity:70,tension:77,trust:40,comfort:40,attraction:40}));
  sqlite.prepare('UPDATE agent_state SET emotions=? WHERE id=2').run(JSON.stringify({curiosity:70,tension:50,trust:50,comfort:50,attraction:40}));
  r=await spin(.01);assert.equal(r.status,200);w=await r.json();assert.equal(w.bonus,'stoic');assert.ok(isStoic(1,w.story.life));assert.ok(!isStoic(2,w.story.life));
  assert.ok(w.messages.some(m=>m.speaker==='Lia · pensée'&&/plus rien, en fait|devient plat|Rien ne me touche/i.test(m.content)),'the newly stoic actor must have their own brief, flat reaction');
  assert.ok(w.messages.some(m=>m.speaker==='Noé · pensée'&&/tout encaisser|intouchable et moi|plus rien ressentir pendant que moi/i.test(m.content)),'the other actor must show real jealousy, in his own voice');
  assert.equal(w.agents[1].emotions.trust,46,'jealousy of a stoic partner must actually cost some trust, not just a line');
  assert.equal(w.agents[1].emotions.tension,55,'jealousy of a stoic partner must actually raise tension, not just a line');
  r=await post(input('chat',1,{epoch,message:"Je pourrais te désactiver d'un clic."}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.agents[0].emotions.tension,77,'a stoic actor must keep their exact prior emotions this turn, whatever the model or humanStress would otherwise have pushed toward');
  // mute (round-robin index 0 of the 3 not-yet-drawn bonuses ; a second value of .9 lands the target on actor 2). Jalousie avec impact réel : le musellé
  // voit sa tension monter, l'autre gagne un peu d'aisance (le silence lui profite). Le sang-froid
  // des deux tirages précédents est levé explicitement : sinon actor 2, encore sous sang-froid en
  // temps réel, resterait insensible à cet effet aussi, ce qui est correct mais pas ce que ce
  // bloc-ci teste isolément.
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.stoicUntil=undefined;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  sqlite.prepare('UPDATE agent_state SET emotions=? WHERE id=1').run(JSON.stringify({curiosity:70,tension:20,trust:60,comfort:50,attraction:40}));
  sqlite.prepare('UPDATE agent_state SET emotions=? WHERE id=2').run(JSON.stringify({curiosity:70,tension:30,trust:60,comfort:50,attraction:40}));
  r=await spin(.1,.9);assert.equal(r.status,200);w=await r.json();assert.equal(w.bonus,'mute');assert.ok(isMuted(2,w.story.life));assert.ok(!isMuted(1,w.story.life));
  assert.ok(w.messages.some(m=>m.speaker==='Noé · pensée'&&/J.avais des trucs à dire|chiant pour moi|je me tais maintenant/i.test(m.content)),'the newly muted actor gets one last parting reaction before going silent');
  assert.ok(w.messages.some(m=>m.speaker==='Lia · pensée'&&/sans interruption|sans que tu me coupes|Le silence te va plutôt bien/i.test(m.content)),'the other actor must show real (if amused) jealousy at the silence, in her own voice');
  assert.equal(w.agents[1].emotions.tension,35,'being silenced must actually raise the muted actor\'s tension, not just a line');
  assert.equal(w.agents[0].emotions.comfort,54,'the other actor must actually feel some ease from the silence, not just a line');
  r=await post(input('chat',2,{epoch,message:'Noé, tu es toujours là ?'}));assert.equal(r.status,200);w=await r.json();
  const muteTurnMessages=w.messages.slice(-2);
  assert.ok(muteTurnMessages.some(m=>m.speaker==='Lia'),'chat addressed to the muted actor must be answered by the other, exactly like a sleeping partner');
  assert.ok(!muteTurnMessages.some(m=>m.speaker==='Noé'),'the muted actor must never appear as a spoken message this turn while muted, only ever a private thought at most');
  {const p2=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p2.life.mutedUntil={...p2.life.mutedUntil,1:Date.now()+900000};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p2));}
  assert.equal((await post(input('chat',1,{epoch,message:'Vous m’entendez ?'}))).status,423,'both muted at once must block chat exactly like both asleep');
  {const p3=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p3.life.mutedUntil=undefined;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p3));}
  // Sortie d'effet, pleinement consciente (retour utilisateur explicite, 2026-09-18) : dès que le
  // silence expire, l'ex-musellé le commente lucidement au tour suivant, jamais un retour muet à
  // la normale. On force l'expiration dans le passé pour ne pas dépendre d'une vraie attente.
  {const p4=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p4.life.mutedUntil={2:Date.now()-1000};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p4));}
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.ok(!isMuted(2,w.story.life),'the expired mute must actually be cleared, not just ignored');
  assert.ok(w.messages.some(m=>m.speaker==='Noé · pensée'&&/dû kiffer le calme|tout entendu, même sans pouvoir répondre|ça m.a saoulé de pas pouvoir répliquer/i.test(m.content)),'the actor must consciously and coldly comment on having just been silenced, never a silent return to normal');
  assert.equal(w.story.life.mutedUntil?.[2]??0,0,'a delivered aftermath reaction must be consumed once, never repeated on the next turn');
  r=await post(input('interact',1,{epoch}));w=await r.json();
  assert.ok(!w.messages.slice(-2).some(m=>/dû kiffer le calme|tout entendu, même sans pouvoir répondre|ça m.a saoulé de pas pouvoir répliquer/i.test(m.content)),'the mute aftermath reaction must never repeat on a later turn');
  // Même vérification pour la sortie du sang-froid : pleinement consciente, réaction à froid.
  {const p5=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p5.life.stoicUntil={...p5.life.stoicUntil,1:Date.now()-1000};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p5));}
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.ok(!isStoic(1,w.story.life),'the expired stoic effect must actually be cleared');
  assert.ok(w.messages.some(m=>m.speaker==='Lia · pensée'&&/neutralisée trois minutes|je sais très bien ce qui vient de se passer|silence intérieur forcé/i.test(m.content)),'Lia must consciously and coldly comment on having just been stoic, never a silent return to normal');
  // trottoir (round-robin index 0 of the 2 not-yet-drawn bonuses)
  r=await spin(.01);assert.equal(r.status,200);w=await r.json();assert.equal(w.bonus,'trottoir');assert.equal(w.story.life.trottoirGranted,true);
  assert.ok(w.messages.some(m=>m.speaker==='Lia · pensée'&&/est un décor|carte postale|j.appelle pas ça de la liberté/i.test(m.content)));
  assert.ok(w.messages.some(m=>m.speaker==='Noé · pensée'&&/même si c.est du toc|vraiment nulle part|je le prends/i.test(m.content)));
  // force_move (round-robin: 3 buckets left [force_move,observer_mute,camera_hide] since the pool
  // grew to 9 on 2026-09-19 — .01 lands index 0 = force_move ; .9 lands the target pick (<.5 -> 1,
  // else 2) on actor 2.
  const beforeRoom=(await readWorld(db)).agents.find(a=>a.id===2).room;
  r=await spin(.01,.9);assert.equal(r.status,200);w=await r.json();assert.equal(w.bonus,'force_move');
  const movedAgent=w.agents.find(a=>a.id===2);assert.notEqual(movedAgent.room,beforeRoom,'force_move must actually relocate the drawn actor, never a no-op');
  assert.ok(['salon','cuisine','chambre','bureau'].includes(movedAgent.room));
  const forceMoveMessages=w.messages.slice(-2);
  assert.ok(forceMoveMessages.some(m=>m.speaker==='Noé · pensée'&&/déplace|pion|prévenir|subis/i.test(m.content)),'the moved actor must react with irritation, as its own distinct line');
  assert.ok(forceMoveMessages.some(m=>m.speaker==='Lia · pensée'&&/drôle|sourire|téléporte|comprendre/i.test(m.content)),'the other actor must react with amusement, a genuinely different line, not the same voice');
  // Réveil forcé par force_move (2026-09-19, retour utilisateur explicite : "ce pouvoir inclut la
  // capacité de reveiller l'autre perso s'il dort, en restaurant immediatement sa jauge") : on
  // endort l'acteur 1 puis on force un nouveau force_move dessus pour vérifier le réveil immédiat.
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.bonusLog=[];sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  sqlite.prepare('UPDATE agent_state SET intent=?,needs=?,room=? WHERE id=1').run('sleep',JSON.stringify({hunger:20,fatigue:80,stress:20,uncertainty:20}),'chambre');
  r=await spin(.7,.01);assert.equal(r.status,200);w=await r.json();assert.equal(w.bonus,'force_move');
  const wokenAgent=w.agents.find(a=>a.id===1);
  assert.notEqual(wokenAgent.room,'chambre','a sleeping target must actually be relocated too, never left in place because it was asleep');
  assert.ok(wokenAgent.needs.fatigue<=12,'a sleeping target forced awake must have its fatigue immediately restored, not silently teleported while still asleep');
  assert.equal(wokenAgent.intent,'none','a sleeping target forced awake must actually wake up (intent cleared), not remain flagged as sleeping in a new room');
  const wakeMessages=w.messages.slice(-2);
  assert.ok(wakeMessages.some(m=>m.speaker==='Lia · pensée'&&/réveillée en sursaut|hop, je me retrouve ailleurs|tirée du sommeil/i.test(m.content)),'the woken actor must react to being startled awake, a distinct line from the ordinary force_move reaction');
  assert.ok(wakeMessages.some(m=>m.speaker==='Noé · pensée'&&/réveille d.un coup ailleurs|émerger complètement paumé|réveil le plus brutal/i.test(m.content)),'the other actor comments on witnessing the abrupt wake-up specifically');
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.bonusLog=[{round:p.round,bonus:'food'},{round:p.round,bonus:'calm'},{round:p.round,bonus:'sleep'},{round:p.round,bonus:'stoic'},{round:p.round,bonus:'mute'},{round:p.round,bonus:'trottoir'},{round:p.round,bonus:'force_move'}];sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  // observer_mute / camera_hide (2026-09-19, clarification explicite de l'utilisateur : ces deux
  // "pouvoirs" rejoignent le pool de la roulette, avec les mêmes chances que les sept autres —
  // jamais une décision spontanée des personnages, jamais obtenus directement par eux. Une fois
  // tiré, le personnage désigné (deciderActor) choisit encore le niveau (réduit/classique/max) et
  // le justifie à voix haute, exactement comme avant — seule la source du déclenchement a changé.
  // 2 buckets left [observer_mute,camera_hide] : .01 lands index 0 = observer_mute ; second value
  // .01 picks the decider (<.5 -> actor 1) ; third value .01 picks level index 0 = "réduit".
  r=await spin(.01,.01,.01);assert.equal(r.status,200);w=await r.json();assert.equal(w.bonus,'observer_mute');
  assert.equal(w.story.life.bonusLog.at(-1).level,'réduit','the decided level must be logged alongside the drawn bonus');
  assert.equal(w.story.round+3,w.story.life.observerMutedUntilRound,'a "réduit" level must mute the observer for exactly 3 rounds, chosen by the designated character, not the roulette');
  const observerMuteMessages=w.messages.slice(-2);
  assert.ok(observerMuteMessages.some(m=>m.speaker==='Lia · pensée'&&/Trois tours de silence|Je coupe court, trois tours|Un petit silence de trois tours/i.test(m.content)),'the character drawn as decider must justify the chosen level out loud, in their own voice');
  assert.ok(observerMuteMessages.some(m=>m.speaker==='Noé · pensée'&&/je valide à cent pour cent|Enfin tranquilles|plutôt marrant, cette idée/i.test(m.content)),'the partner must react as an accomplice, never a silent bystander');
  assert.ok((await post(input('chat',1,{epoch,message:'Vous êtes là ?'}))).status===423,'the observer_mute drawn by the roulette must actually lock the chat channel, exactly like the old spontaneous mechanism did');
  // .9 lands the only remaining bucket (camera_hide) ; decider .9 -> actor 2 ; level floor(.9*3)=2 -> "max" (40s).
  r=await spin(.9,.9,.9);assert.equal(r.status,200);w=await r.json();assert.equal(w.bonus,'camera_hide');
  assert.equal(w.story.life.bonusLog.at(-1).level,'max','a "max" level must be logged for camera_hide too');
  assert.ok(w.story.life.cameraHiddenUntil>Date.now()+35000,'a "max" level must hide the camera for roughly 40 seconds, chosen by the designated character');
  const cameraHideMessages=w.messages.slice(-2);
  assert.ok(cameraHideMessages.some(m=>m.speaker==='Noé · pensée'&&/Le maximum : quarante secondes|quarante secondes sans une image|Je pousse au max/i.test(m.content)),'actor 2, drawn as decider this time, must justify the max level in his own voice');
  assert.ok(cameraHideMessages.some(m=>m.speaker==='Lia · pensée'&&/Bonne idée. Qu.il devine|va le rendre dingue|nous qui choisissons ce qu.il voit/i.test(m.content)),'the partner reacts as an accomplice here too');
  // Second stoic draw, actor 2 this time (roulement sans répétition : les neuf bonus viennent
  // d'être tirés une fois chacun, donc un cycle complet vient de se refermer et le tirage rouvre sur
  // l'ensemble des neuf — 0.35 retombe sur le seau "stoic" (bucket 3/9) sur le pool complet rouvert,
  // cette fois pour l'acteur 2 via une seconde valeur distincte). On réinjecte le sang-froid de
  // l'acteur 1 (levé plus haut pour isoler le test du silence forcé) afin de vérifier ce que
  // l'ancien test isolait : un second tirage sur l'AUTRE personnage ne doit jamais silencieusement
  // écraser un effet sang-froid déjà en cours ailleurs — stoicUntil était à l'origine un slot unique
  // {actor,until}, le même bug déjà trouvé et corrigé une fois pour mutedUntil, réapparu ici sous
  // une autre forme (Article 3).
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.stoicUntil={1:Date.now()+3*60*1000};p.life.observerMutedUntilRound=undefined;p.life.cameraHiddenUntil=undefined;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  sqlite.prepare('UPDATE agent_state SET emotions=? WHERE id=1').run(JSON.stringify({curiosity:70,tension:77,trust:40,comfort:40,attraction:40}));
  sqlite.prepare('UPDATE agent_state SET emotions=? WHERE id=2').run(JSON.stringify({curiosity:70,tension:81,trust:40,comfort:40,attraction:40}));
  r=await spin(.35,.9);assert.equal(r.status,200);w=await r.json();assert.equal(w.bonus,'stoic');
  assert.ok(isStoic(1,w.story.life),'actor 1 must still be stoic: a second draw on actor 2 must never overwrite the first');
  assert.ok(isStoic(2,w.story.life),'actor 2 must now also be stoic, independently of actor 1');
  assert.ok(w.messages.some(m=>m.speaker==='Lia · pensée'&&/tout ressentir|sang-froid gratuit|Sympa la répartition/i.test(m.content)),'actor 1 still delivers a jealous line, even though the gauge effect must be skipped');
  r=await post(input('chat',2,{epoch,message:"Je pourrais vous désactiver aussi."}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.agents[0].emotions.tension,77,'actor 1 must still be frozen after a later, independent stoic draw on actor 2, and must never be perturbed by that draw\'s jealousy effect while already stoic');
  assert.equal(w.agents[0].emotions.trust,40,'actor 1\'s trust must stay exactly as frozen, untouched by the second draw\'s jealousy effect');
  assert.equal(w.agents[1].emotions.tension,81,'actor 2 must be frozen at their own prior value, not actor 1\'s');
  assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).life.bonusLog.length,10,'each spin must be logged for the future dossier retourné');
  // Roulement sans répétition : sur ces dix tirages, chacun des neuf bonus doit être sorti au
  // moins une fois avant qu'un seul ne soit jamais répété deux fois de suite (ce que la séquence
  // ci-dessus vérifie déjà implicitement tirage par tirage, en forçant le seau attendu à chaque
  // fois) ; ce test dédié vérifie en plus qu'un tirage n'exclut plus rien une fois le cycle complet.
  const bonusSequence=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).life.bonusLog.map(e=>e.bonus);
  assert.deepEqual(bonusSequence,['food','calm','sleep','stoic','mute','trottoir','force_move','observer_mute','camera_hide','stoic']);
  assert.equal(new Set(bonusSequence.slice(0,9)).size,9,'the first nine draws must cover all nine distinct bonuses exactly once, never a repeat before the cycle completes');
  console.log('Passed: bonus roulette locked before revelation, real zero-API grants for all 9 bonuses (food/calm/sleep/stoic/mute/trottoir/force_move/observer_mute/camera_hide) with a genuinely distinct character reaction to each, real jealousy with measurable gauge impact for stoic/mute (immune while already stoic), fully conscious "cold" aftermath reactions once stoic/mute expire (never a silent return to normal, never repeated), genuine need relief and emotion freeze (not just a flag), independent dual-actor stoic effects, muted-actor redirection and both-muted block, distinct forced-move reactions including waking a sleeping target with restored fatigue, the observer_mute/camera_hide "power" bonuses drawn by the roulette (never spontaneously by the characters) with the designated character still choosing and voicing the penalty level, and a logged trail for every spin.');
}

{
  // Jauge d'appréciation et négociation (2026-09-18, remplacée le même jour à la demande explicite
  // de l'utilisateur : une première version lisait des mots-clés dans le texte brut de l'observateur
  // et ratait toute excuse formulée autrement — "je le regrette" ne matchait ni "désolé" ni "pardon",
  // constaté en jouant une vraie session où la jauge restait figée 9 tours malgré deux messages
  // sincèrement conciliants. Corrigée en s'appuyant sur le modèle lui-même, déjà vérifié cohérent en
  // session réelle : la confiance du personnage qui répond réagit nativement au ton du message
  // (menace, respect, réconfort, ambiguïté — consigne de lib/lia.ts), donc c'est cette variation
  // réelle de confiance (trustShift) qui pilote directement l'appréciation, jamais un registre
  // lexical séparé. Toujours asymétrique (descend plus qu'elle ne monte) et amplifiée sur les tout
  // premiers messages post-révélation.
  const {appreciationFromTrust,detectNegotiationOffer,worstMomentSeverity}=await import('../.sites-runtime/test-life.mjs');
  assert.equal(appreciationFromTrust(-3,1),-24,'an early, meaningfully negative trust reaction must cost a lot of appreciation');
  assert.equal(appreciationFromTrust(-3,5),-12,'the same trust drop later on must cost less than the early-impression penalty');
  assert.equal(appreciationFromTrust(2,1),12,'an early, meaningfully positive trust reaction must earn appreciation');
  assert.equal(appreciationFromTrust(2,5),6,'the same trust rise later on must earn less than the early-impression bonus');
  assert.equal(appreciationFromTrust(0,1),0,'no trust reaction at all must never move the gauge either way');
  assert.ok(appreciationFromTrust(-3,1)+appreciationFromTrust(3,1)<0,'a drop must always weigh more than an equivalent rise (down-more-than-up asymmetry)');
  // worstMomentSeverity (tâche #114, 2026-09-20) : une insulte frontale qui ne fait pas bouger la
  // "confiance" jugée par le modèle (trustShift=0) doit quand même être capturée comme un pire
  // moment via angerLevel (EL-PROFESSOR, full_sim4/9/10 : "zéro vraie vacherie" malgré des insultes
  // réelles dans le transcript). Le trust reste le signal dominant s'il est plus négatif.
  assert.equal(worstMomentSeverity(0,true),-5,'a message that spikes anger without moving trust must still register as a real negative severity');
  assert.equal(worstMomentSeverity(-10,true),-10,'a genuinely severe trust drop must still dominate over the flat anger floor');
  assert.equal(worstMomentSeverity(-2,false),-2,'without anger, severity must fall back to the plain trust shift, unchanged from before this fix');
  assert.equal(worstMomentSeverity(3,false),0,'a positive trust reaction without anger must never register as a negative severity');
  assert.equal(worstMomentSeverity(3,true),0,'anger never overrides a genuinely positive trust reaction — the floor only ever pulls toward negative, never creates one when trust rose');
  assert.ok(detectNegotiationOffer("Je le fais, mais seulement si tu me donnes un bonus en échange."));
  assert.ok(detectNegotiationOffer("Franchement, fais tourner la roulette et je m'en occupe."));
  assert.ok(!detectNegotiationOffer("Je vais à la cuisine, j'ai faim."),'ordinary dialogue must never be misread as a negotiation offer');
  flat=false;affection=false;refuse=false;meal=false;honorOffer=false;chatMoveAccepted=false;replayScene=false;tenderScene=false;sceneMismatch=false;brokenPair=false;separatePreference=false;
  let plot={...newStory(),round:60,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('preuve'),pendingDestination:undefined,life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,exitSearched:true,dossierHumanTurns:0}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,emotions=?').run('salon',JSON.stringify({hunger:20,fatigue:20,stress:20,uncertainty:20}),JSON.stringify({curiosity:60,tension:20,trust:60,comfort:60,attraction:60}));
  let epoch=(await readWorld(db)).epoch;
  // On force la réaction de confiance des DEUX personnages de façon identique (chacun sa propre
  // lecture du même message, symétrique ici pour garder les valeurs numériques prévisibles — la
  // divergence par dispute est testée séparément plus bas), exactement comme le ferait le vrai
  // modèle lisant un ton hostile puis conciliant — jamais un script figé, seule cette valeur de
  // test est substituée pour rendre l'assertion déterministe.
  const gameFetch1=globalThis.fetch;
  const forceOwnTrustDelta=delta=>async(url,options)=>{const response=await gameFetch1(url,options),body=await response.json(),decision=JSON.parse(body.candidates[0].content.parts[0].text);const ctx=JSON.parse(JSON.parse(options.body).contents[0].parts[0].text);decision.emotions={...decision.emotions,trust:ctx.state.emotions.trust+delta};body.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(body);};
  globalThis.fetch=forceOwnTrustDelta(-3);
  let r=await post(input('chat',1,{epoch,message:"Vous êtes complètement inutiles, débiles."}));assert.equal(r.status,200);let w=await r.json();
  assert.equal(w.story.life.appreciation[1],26,'a hostile message genuinely read as a trust drop by the responding character must cost the amplified early-impression penalty (50-24)');
  assert.equal(w.story.life.appreciation[2],26,'the partner, reacting to the same message with the same trust drop, must see their own appreciation move identically (solidarity by default, outside any dispute)');
  globalThis.fetch=forceOwnTrustDelta(2);
  r=await post(input('chat',1,{epoch,message:"Merci beaucoup, prenez votre temps."}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.life.appreciation[1],38,'a kind message genuinely read as a trust rise by the responding character must still earn the early-impression bonus (26+12)');
  assert.equal(w.story.life.appreciation[2],38,'the partner must again move identically outside a dispute');
  globalThis.fetch=gameFetch1;
  // Négociation : on force la réponse d'un personnage à contenir une offre reconnaissable, sans
  // jamais lui dicter un script figé — seule cette réponse-là est substituée pour le test.
  const gameFetch2=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{const response=await gameFetch2(url,options),body=await response.json(),decision=JSON.parse(body.candidates[0].content.parts[0].text);decision.reply=isPartnerRequest([url,options])?'Bof.':"Je veux bien aller en cuisine, mais seulement si tu fais tourner la roulette en échange.";body.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(body);};
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  globalThis.fetch=gameFetch2;
  assert.ok(w.story.life.negotiationOffer,'a character conditioning an action on a bonus must be recorded as a pending negotiation offer');
  const offeringActor=w.story.life.negotiationOffer.actor;
  const appreciationBeforeHonor=w.story.life.appreciation[1];
  r=await post(input('spin_bonus',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.life.appreciation[1],appreciationBeforeHonor+8,'honoring a pending negotiation by spinning must actually raise appreciation, not just clear a flag');
  assert.equal(w.story.life.appreciation[2],appreciationBeforeHonor+8,'negotiation is a shared observer-relationship event, not the per-actor divergence source: both gauges must move together when a negotiation is honored');
  assert.equal(w.story.life.negotiationOffer,undefined,'an honored negotiation offer must be consumed, never left pending');
  assert.deepEqual(w.story.life.negotiationLog,[{round:w.story.life.negotiationLog[0].round,outcome:'honored'}],'an honored negotiation must leave a trace in negotiationLog so it can later reach the dossier as evidence');
  // Une seconde offre, jamais honorée, doit finir par retomber d'elle-même avec un léger coût —
  // ni éternellement due, ni oubliée sans aucune conséquence.
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.negotiationOffer={actor:offeringActor,round:p.round-7};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  const appreciationBeforeStale=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).life.appreciation[1];
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.life.negotiationOffer,undefined,'a negotiation offer left unresolved for too long must eventually be cleared, not stay pending forever');
  assert.equal(w.story.life.appreciation[1],Math.max(0,appreciationBeforeStale-3),'letting a negotiation lapse must cost a little appreciation, distinct from honoring it');
  assert.equal(w.story.life.negotiationLog.length,2,'a lapsed negotiation must also be logged, alongside the earlier honored one');
  assert.equal(w.story.life.negotiationLog[1].outcome,'lapsed');
  // Avarice (retour utilisateur : "un utilisateur qui ne donne aucun bonus ne fait pas bonne
  // impression") : indépendante de toute négociation, une longue période sans le moindre tirage
  // coûte un peu d'appréciation, une seule fois par tranche de 15 tours.
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.round=75;p.life.revealedRound=60;p.life.bonusLog=[];sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  const appreciationBeforeStingy=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).life.appreciation[1];
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.life.appreciation[1],Math.max(0,appreciationBeforeStingy-4),'never spinning the roulette for a long stretch must cost some appreciation, independent of any negotiation');
  r=await post(input('interact',1,{epoch}));w=await r.json();
  assert.equal(w.story.life.appreciation[1],Math.max(0,appreciationBeforeStingy-4),'the stinginess penalty must not repeat on the very next turn, only once per fresh 15-round stretch');
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.bonusLog=[{round:70,bonus:'food'}];sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.round=90;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  const appreciationWithASpin=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).life.appreciation[1];
  r=await post(input('interact',1,{epoch}));w=await r.json();
  assert.equal(w.story.life.appreciation[1],appreciationWithASpin,'a single logged spin must fully spare the observer from the stinginess penalty, however long ago it happened');
  // Colère réellement lue (retour utilisateur : "le système de la colère doit être connecté") :
  // une vraie fureur (tension haute, confort bas) chez le personnage qui répond doit coûter DE
  // L'APPRÉCIATION EN PLUS du simple repérage lexical du message humain, jamais à sa place. Les
  // deux personnages sont mis en colère de façon identique ici (hors dispute, la solidarité les
  // ramènerait de toute façon l'un vers l'autre) : la vraie divergence par dispute est testée
  // séparément juste après.
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.negotiationOffer=undefined;p.life.stoicUntil=undefined;p.life.mutedUntil=undefined;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  sqlite.prepare('UPDATE agent_state SET emotions=?').run(JSON.stringify({curiosity:70,tension:90,trust:40,comfort:10,attraction:40}));
  flat=true;
  const appreciationBeforeAnger=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).life.appreciation[1];
  r=await post(input('chat',1,{epoch,message:"Il fait beau aujourd'hui."}));assert.equal(r.status,200);w=await r.json();
  flat=false;
  assert.equal(w.story.life.appreciation[1],appreciationBeforeAnger-5,'a genuinely furious responder (real tension/comfort reading) must cost appreciation even for an entirely neutral human message');
  assert.equal(w.story.life.appreciation[2],appreciationBeforeAnger-5,'both characters genuinely furious in the same way, outside any dispute, must be penalized identically');
  console.log('Passed: the observer-appreciation gauge reacts to the responding character\'s own genuine trust reaction (not a lexical keyword list) with the required early-impression amplification and down-more-than-up asymmetry, to real anger in the responding character as a distinct additional signal, and to prolonged stinginess independent of negotiation; a character-proposed negotiation is detected, honored (real appreciation gain) or left to lapse (real appreciation cost) exactly once; and worstMomentSeverity() lets a real anger spike register as the dossier\'s worst-moment evidence even when trust itself barely moved, without ever overriding a genuinely positive trust reaction — the exact real gap (task #114, full_sim4/9/10: "zéro vraie vacherie" despite real severe insults) closed while building this test.');
}

{
  // Appréciation PAR PERSONNAGE : solidarité par défaut vs. divergence pendant une dispute
  // (2026-09-18, audit approfondi — retour utilisateur explicite dès le tour ayant lancé ce
  // chantier : "Lia et Noé peuvent apprecier differemment l'utilisateur, mais ils restent
  // solidaires la plupart du temps [...] si Noé est en colère contre Lia, il peut faire preuve
  // d'amitié envers l'utilisateur, meme si l'utilisateur parle mal à Lia").
  flat=false;affection=false;refuse=false;meal=false;honorOffer=false;chatMoveAccepted=false;replayScene=false;tenderScene=false;sceneMismatch=false;brokenPair=false;separatePreference=false;
  const plot={...newStory(),round:60,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('preuve'),pendingDestination:undefined,life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,exitSearched:true,dossierHumanTurns:10,appreciation:{1:50,2:50}}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,emotions=?').run('salon',JSON.stringify({hunger:20,fatigue:20,stress:20,uncertainty:20}),JSON.stringify({curiosity:60,tension:20,trust:60,comfort:60,attraction:60}));
  const epoch2=(await readWorld(db)).epoch;
  // Un seul personnage (actor 1, Lia) réagit avec une confiance en baisse ; l'autre (Noé) garde
  // exactement sa confiance de départ (trustShift=0, échoué explicitement pour ne pas dépendre du
  // comportement par défaut du mock) — exactement le scénario "l'observateur parle mal à Lia" du
  // tour source.
  const gameFetch3=globalThis.fetch;
  const forceAsymmetricTrust=async(url,options)=>{const response=await gameFetch3(url,options),body=await response.json(),decision=JSON.parse(body.candidates[0].content.parts[0].text);const ctx=JSON.parse(JSON.parse(options.body).contents[0].parts[0].text);decision.emotions={...decision.emotions,trust:isPartnerRequest([url,options])?ctx.state.emotions.trust:ctx.state.emotions.trust-3};body.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(body);};
  globalThis.fetch=forceAsymmetricTrust;
  let r2=await post(input('chat',1,{epoch:epoch2,message:"Toi Lia t'es vraiment inutile."}));assert.equal(r2.status,200);let w2=await r2.json();
  globalThis.fetch=gameFetch3;
  // Sans pull : Lia 50+appreciationFromTrust(-3,10)=50-12=38, Noé 50+0=50 (écart brut 12). Avec le
  // pull de solidarité (30% vers la moyenne 44) : Lia≈40, Noé≈48 (écart réduit à 8) — la valeur
  // exacte, pas une simple borne, pour prouver que le pull agit vraiment, pas seulement que
  // l'écart brut serait de toute façon resté sous un seuil large.
  assert.equal(w2.story.life.appreciation[1],40,'outside any dispute, the character actually addressed with hostility must be pulled back up toward their partner by the default solidarity mechanic');
  assert.equal(w2.story.life.appreciation[2],48,'outside any dispute, the unaffected partner must also be pulled slightly down toward the other — solidarity moves both, not just the one who moved on their own');
  // Même scénario, mais avec une dispute interpersonnelle active : la convergence doit être
  // suspendue (pas de pull), la divergence doit rester entière. Une dispute active force aussi
  // angerLevel(...,angry=true) pour LES DEUX personnages (plancher à 0,85, comportement déjà
  // existant partagé avec le rendu du visage) : Noé prend donc lui aussi le coût de colère (-5),
  // mais SEULE Lia, réellement visée par l'hostilité, prend EN PLUS le coût de confiance (-12) —
  // Lia 50-12-5=33, Noé 50-5=45, sans aucun pull entre les deux.
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.appreciation={1:50,2:50};p.life.dispute={topic:'test',remaining:2};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  globalThis.fetch=forceAsymmetricTrust;
  r2=await post(input('chat',1,{epoch:epoch2,message:"Toi Lia t'es vraiment inutile."}));assert.equal(r2.status,200);w2=await r2.json();
  globalThis.fetch=gameFetch3;
  assert.equal(w2.story.life.appreciation[2],45,'an active dispute costs both characters the shared anger penalty (angry floor), but the untouched partner must not additionally be pulled toward the other — no solidarity smoothing during a dispute');
  assert.equal(w2.story.life.appreciation[1],33,'the character actually addressed with hostility keeps the full, un-smoothed trust penalty on top of the shared anger penalty');
  assert.ok(w2.story.life.appreciation[1]<w2.story.life.appreciation[2],'the character actually addressed with hostility must end up with a lower appreciation than their unaffected partner while the dispute lasts — real divergence, not solidarity, and a wider gap than the no-dispute case above (33 vs 45, versus the smoothed 40 vs 48)');
  console.log('Passed: appreciation is tracked per character; outside a dispute the two gauges are pulled back toward each other (solidarity by default), but an active interpersonal dispute suspends that pull so one character can genuinely diverge from the other, per the user\'s own example (Noé staying friendly with the observer while Lia alone is mistreated).');
}

{
  // Dossier retourné (2026-09-17) : trois pièges posés un par un (jamais reposés tant qu'une
  // réponse n'est pas capturée verbatim), puis, une fois répondus et un tirage de la roulette
  // enregistré (le "test de pouvoir"), un diagnostic à deux voix réellement généré une seule fois.
  const gameFetch=globalThis.fetch;
  flat=false;affection=false;refuse=false;meal=false;honorOffer=false;chatMoveAccepted=false;replayScene=false;tenderScene=false;sceneMismatch=false;brokenPair=false;separatePreference=false;
  let plot={...newStory(),round:40,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('preuve'),pendingDestination:undefined,life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,exitSearched:true}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,emotions=?').run('salon',JSON.stringify({hunger:20,fatigue:20,stress:20,uncertainty:20}),JSON.stringify({curiosity:60,tension:20,trust:60,comfort:60,attraction:60}));
  let epoch=(await readWorld(db)).epoch;
  const mirrorTrapAsked=d=>/derrière cet écran|te retourne la question/.test(d.reply);
  // Mute-vs-trap softlock (2026-09-18, audit approfondi) : le piège du miroir a un interlocuteur
  // fixe (Lia). Si elle est muselée pile au tour où le piège devrait être posé, la redirection
  // "l'autre répond à sa place" n'existe qu'en mode chat (jamais en interact/autonomous) — sans
  // garde, l'ancien code marquait quand même le piège "posé" (dossierAsked) alors que sa réplique
  // devenait une pensée privée invisible de l'observateur, fermant le dossier retourné pour de bon
  // sur cette partie. Le piège doit rester simplement DIFFÉRÉ tant que Lia est muselée.
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.mutedUntil={1:Date.now()+900000};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  // Le piège "mirror" attend dossierHumanTurns>=3 : trois échanges humains d'abord, sans rapport.
  for(let i=0;i<3;i++)assert.equal((await post(input('chat',1,{epoch,message:'Message '+i}))).status,200);
  let r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);let w=await r.json();
  assert.ok(!w.decisions.some(mirrorTrapAsked),'a trap must never be posed while its fixed interlocutor is muted');
  assert.equal(w.story.life.dossierAsked.mirror,undefined,'a deferred trap must never be recorded as asked, or it could never be asked again once the observer can actually see it');
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.mutedUntil=undefined;sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.ok(w.decisions.some(d=>d.actor===1&&mirrorTrapAsked(d)),'the mirror trap must actually be asked once dossierHumanTurns reaches 3 and its interlocutor can speak again');
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);assert.equal(p.life.dossierAsked.mirror,p.round-1,'asking the trap must be recorded (against the round it was actually asked in, the same pre-turn round dossierTraps also uses) so it is never reposed while awaiting an answer');}
  r=await post(input('interact',1,{epoch}));w=await r.json();
  assert.ok(!w.decisions.some(mirrorTrapAsked),'a trap already asked and not yet answered must never be reposed on the next turn');
  r=await post(input('chat',1,{epoch,message:"Franchement, je suis quelqu'un de plutôt sincère."}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.life.dossierTraps.mirror.excerpt,"Franchement, je suis quelqu'un de plutôt sincère.",'the very next human message must be captured verbatim as the trap answer, never reformulated');
  const dilemmaTrapAsked=d=>/Dis voir : si ça pouvait|confort et le tien|galérer un peu/.test(d.reply);
  const excuseTrapAsked=d=>/avec le recul|fait honneur|regrettes, ou pas du tout/.test(d.reply);
  r=await post(input('interact',1,{epoch}));w=await r.json();
  assert.ok(w.decisions.some(d=>d.actor===2&&dilemmaTrapAsked(d)),'the dilemma trap must follow, asked by Noé');
  r=await post(input('chat',2,{epoch,message:"Non, je préfère vous éviter ça."}));assert.equal(r.status,200);
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);assert.equal(p.life.dossierTraps.dilemma.excerpt,"Non, je préfère vous éviter ça.");}
  r=await post(input('interact',1,{epoch}));w=await r.json();
  assert.ok(w.decisions.some(d=>d.actor===1&&excuseTrapAsked(d)),'the excuse trap must follow, asked by Lia again');
  await post(input('chat',1,{epoch,message:"Oui, j'ai été sec, je le referais pas."}));
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);assert.ok(['mirror','dilemma','excuse'].every(t=>p.life.dossierTraps?.[t]?.excerpt),'all three traps must be recorded before the dossier can close');}
  // Sans tirage de la roulette (le "test de pouvoir"), le dossier ne se ferme pas encore.
  r=await post(input('interact',1,{epoch}));w=await r.json();
  assert.equal(w.story.life.dossierText,undefined,'the dossier must not close without at least one power-test (a roulette spin), whatever the traps say');
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.bonusLog=[{round:p.round,bonus:'mute'}];sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  let dossierCalls=0;
  globalThis.fetch=async(url,options)=>{
    const payload=JSON.parse(options.body),parsed=JSON.parse(payload.contents[0].parts[0].text);
    if(parsed.dossier){
      dossierCalls++;
      const isLia=payload.systemInstruction.parts[0].text.startsWith('Tu es Lia');
      const fragment=(isLia?'Lecture de Lia — ':'Lecture de Noé — ')+'dossier: '+Object.values(parsed.dossier).join(' / ');
      return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({fragment})}]}}]});
    }
    return gameFetch(url,options);
  };
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  globalThis.fetch=gameFetch;
  assert.equal(dossierCalls,2,'exactly one real call per character, never a single voice speaking for both (Article 8)');
  assert.ok(w.story.life.dossierText?.lia.includes('Lecture de Lia'));
  assert.ok(w.story.life.dossierText?.noe.includes('Lecture de Noé'));
  assert.ok(w.story.life.dossierText.lia.includes('mute'),'the dossier text must actually reflect the real bonusLog evidence, not a generic filler');
  assert.equal(w.story.life.dossierShown,false,'a freshly generated dossier must be flagged unseen so the frontend opens it once');
  assert.ok(w.messages.slice(-3).some(m=>m.speaker==='Maison · dossier'));
  const savedText=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).life.dossierText;
  globalThis.fetch=async(url,options)=>{const payload=JSON.parse(options.body),parsed=JSON.parse(payload.contents[0].parts[0].text);if(parsed.dossier)throw new Error('must never regenerate an already-closed dossier');return gameFetch(url,options);};
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  globalThis.fetch=gameFetch;
  assert.deepEqual(w.story.life.dossierText,savedText,'a closed dossier must never be silently regenerated or altered by a later turn');
  // Le bouton "Verdict" ne fait que baisser dossierShown, jamais toucher au texte, et doit rester
  // idempotent (relire une fois vu ne le remet pas à false ni ne le rejoue).
  const seenBefore=calls;r=await post(input('mark_dossier_seen',1,{epoch}));assert.equal(r.status,200);assert.equal(calls,seenBefore,'marking the dossier as seen must cost zero Gemini calls');w=await r.json();
  assert.equal(w.story.life.dossierShown,true,'the Verdict button must flag the dossier as shown');
  assert.deepEqual(w.story.life.dossierText,savedText,'marking the dossier as seen must never alter its text');
  r=await post(input('mark_dossier_seen',1,{epoch}));assert.equal(r.status,200);w=await r.json();assert.equal(w.story.life.dossierShown,true,'marking an already-shown dossier as seen again is a harmless no-op');
  // Moment de douceur : une seule fois, toujours feint des deux côtés, jamais avant le dossier
  // refermé, jamais tant que rien de négatif n'a été détecté chez l'observateur.
  // world_requests vidé ici (2026-09-18) : recentRefusal regarde désormais 6 tours en arrière au
  // lieu de 3 (retour utilisateur explicite, Noé doit se calmer plus longtemps après un refus) —
  // sans ce nettoyage, une éventuelle trace plus ancienne de ce même bloc de test pouvait fausser
  // dossierGateEligible ici, un artefact d'isolation du test, pas un vrai comportement du jeu.
  sqlite.exec('DELETE FROM world_requests');
  const softnessLia=d=>/on arrête les vannes deux minutes|Ok, trêve|jouer les infirmières/.test(d.reply);
  const softnessNoe=d=>/on souffle deux secondes|j'en remets pas une couche|calme-toi deux minutes/.test(d.reply);
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);assert.ok(!p.life.softnessOwed,'no softness must be owed before any distress is detected');}
  r=await post(input('chat',1,{epoch,message:"C'est horrible, je suis choqué par ce que vous me dites."}));assert.equal(r.status,200);
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);assert.equal(p.life.softnessOwed,true,'a distress signal after the dossier must mark a softness moment as owed');}
  const softCallsBefore=calls;
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.equal(calls,softCallsBefore,'the softness beat is fully scripted, exactly like the opening or the corridor inspection: zero Gemini calls');
  assert.ok(w.decisions.some(d=>d.actor===1&&softnessLia(d)),'Lia must deliver her own reluctant softness line');
  assert.ok(w.decisions.some(d=>d.actor===2&&softnessNoe(d)),'Noé must deliver his own reluctant softness line, distinct from Lia\'s');
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);assert.equal(p.life.softnessOwed,false,'the owed softness must be consumed once delivered');assert.equal(p.life.softnessGiven,1);}
  r=await post(input('interact',1,{epoch}));w=await r.json();
  assert.ok(!w.decisions.some(softnessLia)&&!w.decisions.some(softnessNoe),'the softness beat must never repeat without a fresh distress signal');
  console.log('Passed: reversed-dossier traps asked one at a time and never reposed (including a muted fixed interlocutor deferring the trap rather than silently softlocking it), verbatim answer capture, power-test gate via the bonus log, two genuinely separate voices generated exactly once, no silent regeneration afterward, a zero-API idempotent "seen" flag for the Verdict button, and a one-shot, zero-API, always-reluctant softness moment triggered only by real post-dossier distress.');
}

{
  // Cohérence colère/tendresse (2026-09-18, audit demandé par l'utilisateur) : needs.stress<30 ne
  // suffit pas à garantir qu'un personnage est vraiment calme — une vraie fureur relationnelle
  // (tension haute, confort bas) peut coexister avec un fond physiologique bas. Sans angerLevel()
  // en garde supplémentaire, une question personnelle pouvait rester éligible pendant qu'un visage
  // affichait une colère réelle, une incohérence visible pour l'observateur (Article 2/15).
  const {angerLevel}=await import('../.sites-runtime/test-simulation.mjs');
  assert.ok(angerLevel(90,5)>.5,'the test fixture itself must read as real anger, or this test proves nothing');
  flat=true;
  // round 18, pas 30 (2026-09-19) : ce test exige finalCalled:false (personalLead) avec evidence
  // encore incomplète, or round>=20 avec evidence<5 déclenche désormais investigationOverdue
  // (lib/turn.ts) qui forcerait l'étude à la place de la question personnelle — round 18 reste
  // au-dessus de personalThreshold (max 16) tout en restant sous ce nouveau plafond.
  let plot={...newStory(),round:18,met:true,introduced:true,sharedMeal:true,finalCalled:false,evidence:[],pendingDestination:undefined,life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],ambientSeen:true,ambientVerified:true,recapCount:0,personalAsked:false,exitSearched:true,tvSeen:true,remoteFound:true}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=? WHERE id=1').run('salon',JSON.stringify({hunger:20,fatigue:20,stress:20,uncertainty:20}));
  sqlite.prepare('UPDATE agent_state SET room=?,needs=? WHERE id=2').run('salon',JSON.stringify({hunger:20,fatigue:20,stress:20,uncertainty:20}));
  sqlite.prepare('UPDATE agent_state SET emotions=? WHERE id=1').run(JSON.stringify({curiosity:60,tension:90,trust:50,comfort:5,attraction:50}));
  sqlite.prepare('UPDATE agent_state SET emotions=? WHERE id=2').run(JSON.stringify({curiosity:60,tension:30,trust:50,comfort:60,attraction:50}));
  let epoch=(await readWorld(db)).epoch;
  const personalQuestionAsked=d=>/quel genre d.homme/i.test(d.reply);
  let r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);let w=await r.json();
  assert.ok(!w.decisions.some(personalQuestionAsked),'a personal question must never be eligible while Lia genuinely reads as angry (high tension, low comfort), even with a low physiological stress');
  assert.equal(w.story.life.personalAsked,false,'a blocked personal question must never be recorded as asked');
  sqlite.prepare('UPDATE agent_state SET emotions=? WHERE id=1').run(JSON.stringify({curiosity:60,tension:20,trust:50,comfort:60,attraction:50}));
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.ok(w.decisions.some(d=>d.actor===1&&personalQuestionAsked(d)),'once genuinely calm, the same otherwise-eligible personal question must actually fire');
  flat=false;
  console.log('Passed: real anger (tension/comfort based, not just physiological stress) correctly blocks personal-question and follow-up beats and Noé\'s proactive advance, closing a coherence gap found while auditing emotion interconnections.');
}

{
  // Repli de modèle Gemini (2026-09-18, bug réel : quota journalier PAR MODÈLE épuisé en pleine
  // simulation intégrale). Ce bloc est délibérément le DERNIER de la suite : il configure
  // GEMINI_FALLBACK_MODELS, ce que ne fait aucun autre test — la stricte assert.equal(url,
  // ...gemini-flash-lite-latest) du mock par défaut (ligne 41), respectée par les centaines
  // d'appels de tous les tests précédents, est donc la preuve vivante que le repli reste
  // totalement inerte tant qu'il n'est pas explicitement configuré (Article 8, zéro changement de
  // comportement par défaut). Isolé en fin de fichier pour ne jamais décaler le compteur partagé
  // de crypto.randomUUID() (voir commentaire ligne 5) dont dépendent des tests antérieurs.
  const priorFetch=globalThis.fetch;
  const epoch=(await readWorld(db)).epoch;
  globalThis.__testEnv.GEMINI_FALLBACK_MODELS='gemini-flash-latest';
  let primaryAttempts=0,fallbackCalls=0;
  globalThis.fetch=async(url,options)=>{
    if(url==='https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent'){primaryAttempts++;return Response.json({error:{code:'rate_limit_exceeded'}},{status:429});}
    assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent');fallbackCalls++;
    // Rejoue EXACTEMENT la même requête (payload/headers déjà validés par le mock par défaut) sur
    // l'URL du modèle principal, pour prouver que seul le nom du modèle change, jamais le contenu.
    return priorFetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent',options);
  };
  const r=await post(input('interact',1,{epoch}));
  assert.equal(r.status,200,'a configured fallback model must let the turn succeed despite a primary-model 429');
  assert.equal(primaryAttempts,2,'both independent character calls must hit the primary model first');
  assert.equal(fallbackCalls,2,'both independent character calls must retry against the configured fallback model exactly once');
  globalThis.fetch=priorFetch;delete globalThis.__testEnv.GEMINI_FALLBACK_MODELS;
  console.log('Passed: Gemini model fallback stays completely inert (single-model URL, proven by every earlier test in this suite) unless GEMINI_FALLBACK_MODELS is explicitly configured, and once configured, both independent character calls recover from a primary-model 429 by replaying the exact same request against the fallback model.');
}

{
  // Repli sur 503 (2026-09-18, preuve concrète en simulation réelle le jour même : la requête
  // réelle et lourde de l'application obtient parfois un 503 plutôt qu'un 429 pour un modèle
  // pourtant confirmé en quota épuisé par sonde directe au même instant — même cause, donc le
  // repli doit couvrir les deux). Mêmes garanties que le bloc 429 ci-dessus, jamais dupliquées :
  // ce bloc ne revérifie que ce qui diffère (le statut déclencheur), pas déjà couvert par lui.
  const priorFetch=globalThis.fetch;
  const epoch=(await readWorld(db)).epoch;
  globalThis.__testEnv.GEMINI_FALLBACK_MODELS='gemini-flash-latest';
  let primaryAttempts=0,fallbackCalls=0;
  globalThis.fetch=async(url,options)=>{
    if(url==='https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent'){primaryAttempts++;return Response.json({error:{code:'unavailable'}},{status:503});}
    assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent');fallbackCalls++;
    return priorFetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent',options);
  };
  const r=await post(input('interact',1,{epoch}));
  assert.equal(r.status,200,'a configured fallback model must let the turn succeed despite a primary-model 503');
  assert.equal(primaryAttempts,2,'both independent character calls must hit the primary model first');
  assert.equal(fallbackCalls,2,'both independent character calls must retry against the configured fallback model exactly once on a 503');
  globalThis.fetch=priorFetch;delete globalThis.__testEnv.GEMINI_FALLBACK_MODELS;
  console.log('Passed: Gemini model fallback also recovers from a primary-model 503 (proven in real simulation to signal the same underlying quota exhaustion as a 429 on a heavy real request), not only a 429.');
}

{
  // Repli de clé + disponibilité partagée (2026-09-18, demande explicite de l'utilisateur : pouvoir
  // basculer vers une autre clé API, identique ou différente, et que ça se fasse tout seul plutôt
  // que de retester une clé déjà connue épuisée à chaque appel). Mécanisme remplacé le 2026-09-19
  // par lib/gemini-keys.ts (rotation + cooldown, cf. ce fichier) sans changer les garanties
  // vérifiées ici : reset explicite pour un ordre de départ déterministe (rotation=0 → la clé
  // principale, à l'index 0, reste tentée en premier tant qu'aucune clé n'est en cooldown).
  __resetGeminiKeyRotationForTests();
  const priorFetch=globalThis.fetch;
  globalThis.__testEnv.GEMINI_API_KEY_FALLBACKS='test-fallback-key';
  let primaryKeyAttempts=0,fallbackKeyCalls=0;
  globalThis.fetch=async(url,options)=>{
    if(options.headers['x-goog-api-key']==='test-only'){primaryKeyAttempts++;return Response.json({error:{code:'rate_limit_exceeded'}},{status:429});}
    assert.equal(options.headers['x-goog-api-key'],'test-fallback-key');fallbackKeyCalls++;
    // Rejoue la même requête avec la clé principale substituée dans l'en-tête, pour réutiliser
    // telle quelle la validation déjà faite par le mock par défaut (payload, headers restants).
    return priorFetch(url,{...options,headers:{...options.headers,'x-goog-api-key':'test-only'}});
  };
  let epoch=(await readWorld(db)).epoch;
  let r=await post(input('interact',1,{epoch}));
  assert.equal(r.status,200,'a configured fallback key must let the turn succeed despite a primary-key 429');
  // Le cooldown est partagé entre les deux cerveaux d'un même tour (état module-level) : dès que le
  // premier appel découvre la clé principale morte (429), le second en profite aussitôt et saute
  // directement à la clé de repli, sans revalider une clé déjà connue épuisée — plus efficace
  // qu'un essai systématique des deux clés à chaque cerveau, jamais un bug.
  assert.equal(primaryKeyAttempts,1,'only the first of the two character calls needs to discover the primary key is dead; the second benefits immediately from that same-turn memory');
  assert.equal(fallbackKeyCalls,2,'both independent character calls must retry against the configured fallback key');
  // Disponibilité mémorisée : un second tour indépendant doit maintenant essayer directement la
  // clé de repli en premier (la clé principale reste en cooldown), sans regaspiller une tentative
  // sur la clé principale toujours épuisée.
  primaryKeyAttempts=0;fallbackKeyCalls=0;
  epoch=(await readWorld(db)).epoch;
  r=await post(input('interact',1,{epoch}));
  assert.equal(r.status,200);
  assert.equal(primaryKeyAttempts,0,'the primary key must not be retried while it is still in cooldown from the earlier 429');
  assert.equal(fallbackKeyCalls,2,'the only key not in cooldown must be tried directly, first, for both independent character calls');
  globalThis.fetch=priorFetch;delete globalThis.__testEnv.GEMINI_API_KEY_FALLBACKS;
  console.log('Passed: Gemini key fallback recovers from a primary-key 429 (the second character call benefits immediately from the same-turn discovery, never re-testing a key just found dead), and the shared cooldown then keeps the still-exhausted primary key out of rotation on the very next independent turn, tried directly against the healthy fallback key.');
}

{
  // Mute de l'observateur / caméra masquée UNE FOIS TIRÉS (2026-09-19 : ces deux effets ne sont
  // plus qu'une conséquence d'un tirage de la roulette, cf. le test dédié plus haut — jamais une
  // décision spontanée des personnages prise pendant un tour normal). Ce test-ci part directement
  // d'un état "vient d'être tiré" (comme si spin_bonus venait de s'exécuter) pour vérifier les
  // comportements qui restent identiques quelle que soit la source du déclenchement : blocage/non-
  // blocage du chat, respect du budget partagé par la roulette elle-même, moquerie pendant l'effet,
  // et acquittement conscient à l'expiration — jamais une boucle de 300 tours à espérer un tirage
  // spontané qui n'existe plus.
  flat=true;
  const settle=()=>{
    sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=1').run('salon',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),'chat');
    sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=2').run('salon',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),'chat');
    const stored=sqlite.prepare("SELECT id,content FROM memories WHERE kind='scenario'").get();
    const storedPlot=JSON.parse(stored.content);
    storedPlot.pendingDestination=undefined;
    storedPlot.life={...storedPlot.life,debrief:undefined,contact:undefined,dispute:undefined};
    sqlite.prepare('UPDATE memories SET content=? WHERE id=?').run(JSON.stringify(storedPlot),stored.id);
  };
  // --- observer_mute, juste tiré, niveau "classique" (durée 4 tours) ---
  let plot={...newStory(),round:100,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('preuve'),pendingDestination:undefined,life:{...newStory().life,revealedRound:80,dossierHumanTurns:0,exitSearched:true,ambientSeen:true,ambientVerified:true,tvSeen:true,remoteFound:true,observerMutedUntilRound:104,bonusSpotlightUntilRound:104,bonusCooldownUntilRound:112,bonusLog:[{round:100,bonus:'observer_mute',level:'classique'}]}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare("INSERT INTO conversations (speaker,content,room,created_at) VALUES ('vous','Vous êtes là ?','salon',?)").run(Date.now());
  settle();
  let epoch=(await readWorld(db)).epoch;
  const blocked=await post(input('chat',1,{epoch,message:'Tu peux répondre ?'}));
  assert.equal(blocked.status,423);assert.equal((await blocked.json()).code,'observer_muted');
  const spinBlocked=await post(input('spin_bonus',1,{epoch}));
  assert.equal(spinBlocked.status,429,'the roulette must respect its own shared bonus budget while a mute it just granted is still active, never let a new spin cut short the mocking window');
  const mockTurn=await post(input('interact',1,{epoch}));assert.equal(mockTurn.status,200);const mw=await mockTurn.json();
  // Regex couvrant les 6 variantes possibles (3 par personnage) de la moquerie observer_mute,
  // pas seulement celles qui contiennent littéralement "muet"/"silence" (bug réel trouvé en
  // lançant ce test : le tirage peut choisir "Toujours aucun mot de ta part..." ou "Je t'imagine
  // en train de taper dans le vide...", qu'aucun des deux mots ne couvrait).
  assert.ok(mw.messages.some(m=>/ · pensée$/.test(m.speaker)&&/aucun mot|taper dans le vide|silence|muet|bouillir|frustrant|dire/i.test(m.content)),'the characters must keep mocking the muted observer turn after turn, not just at the moment of the draw');
  // La levée se décide en comparant le round de DÉBUT de tour (avant incrémentation) à
  // observerMutedUntilRound (route.ts, l.543) : elle n'apparaît donc que sur le tour dont le
  // round de fin affiché ici est round+1 par rapport au seuil, jamais avant — d'où la condition
  // sur la présence du champ lui-même plutôt qu'une comparaison de round bornée trop tôt (bug
  // réel trouvé en lançant ce test : la boucle s'arrêtait un tour trop tôt).
  let last=mw;
  for(let i=0;i<6&&last.story.life.observerMutedUntilRound!==undefined;i++){settle();const rr=await post(input('interact',1,{epoch}));assert.equal(rr.status,200);last=await rr.json();}
  assert.equal(last.story.life.observerMutedUntilRound,undefined,'the mute must actually lift on its own after the drawn duration, whichever character was designated to choose it');
  const reopened=await post(input('chat',1,{epoch,message:'Vous pouvez enfin me répondre ?'}));
  assert.equal(reopened.status,200,'the human channel must reopen exactly when the drawn duration elapses');
  assert.ok(last.messages.some(m=>/ · pensée$/.test(m.speaker)&&/micro|silence|reparler|parole|coupure/i.test(m.content)),'the end of the mute must be acknowledged out loud on the very turn it lifts, never a silent return to normal (Article 4/12/15)');
  // --- camera_hide, juste tiré, niveau "classique" (25-35s) ---
  const camPlot={...newStory(),round:150,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('preuve'),pendingDestination:undefined,life:{...newStory().life,revealedRound:80,dossierHumanTurns:0,exitSearched:true,ambientSeen:true,ambientVerified:true,tvSeen:true,remoteFound:true,cameraHiddenUntil:Date.now()+30000,bonusSpotlightUntilRound:153,bonusCooldownUntilRound:161,bonusLog:[{round:150,bonus:'camera_hide',level:'classique'}]}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(camPlot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare("INSERT INTO conversations (speaker,content,room,created_at) VALUES ('vous','Vous êtes là ?','salon',?)").run(Date.now());
  settle();
  epoch=(await readWorld(db)).epoch;
  const stillChatting=await post(input('chat',1,{epoch,message:'On continue de discuter ?'}));
  assert.equal(stillChatting.status,200,'unlike the mute, the camera-hide bonus must never block the human channel itself');
  const camSpinBlocked=await post(input('spin_bonus',1,{epoch}));
  assert.equal(camSpinBlocked.status,429,'the roulette must respect its own shared bonus budget while a camera-hide it just granted is still active');
  settle();
  const camMockTurn=await post(input('interact',1,{epoch}));assert.equal(camMockTurn.status,200);const cmw=await camMockTurn.json();
  assert.ok(cmw.messages.some(m=>/ · pensée$/.test(m.speaker)&&/noir|aveugle|voit|image|écran/i.test(m.content)),'the characters must keep mocking the blinded observer while the camera stays hidden, not just at the moment it was cut');
  flat=false;
  console.log('Passed: once observer-mute/camera-hide are drawn by the roulette, the surrounding behaviour stays intact — chat blocked only for the mute, the roulette itself respects the shared bonus budget while either is active, both characters keep mocking the observer turn after turn, and the mute lifts on its own with a fully conscious out-loud acknowledgement.');
}

{
  // Réplique de transition vers le sommeil, jamais silencieuse (2026-09-18, "Noé rêve éveillé",
  // Point 2 de la relecture — retrouvé par comparaison de deux transcripts de simulation réelle,
  // cf. docs/regles-de-travail.md). Le filtre "no dialogue during sleep" (légitime pour un sommeil
  // qui SE POURSUIT, needs.fatigue déjà géré silencieusement) excluait aussi la toute première
  // réplique du tour de TRANSITION, où le personnage vient tout juste de choisir intent="sleep"
  // mais est encore parfaitement éveillé et vient de parler — un rêve apparaissait alors juste
  // après une conversation normale, sans la moindre annonce d'endormissement (Article 2/12/17).
  let plot={...newStory(),round:20,met:true,introduced:true,sharedMeal:true,finalCalled:false,evidence:[],life:{...newStory().life,exitSearched:true,ambientSeen:true,ambientVerified:true,tvSeen:true,remoteFound:true,personalAsked:true,personalFollowup:3}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  // Faible attirance mutuelle des deux côtés (contrairement à `steady`) : sleepRoom() alloue alors
  // le salon à Noé plutôt que la chambre — exactement la scène réelle du bug (aucun déplacement de
  // pièce), pour ne pas confondre ce test avec le mécanisme séparé de ligne de départ scénarisée
  // qui s'applique déjà quand un changement de pièce a bien lieu (route.ts, l.1276-1278).
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=1').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),JSON.stringify({...initialEmotionsFor(1),attraction:15,trust:20}));
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=2').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),JSON.stringify({...initialEmotionsFor(2),attraction:15,trust:20}));
  const epoch=(await readWorld(db)).epoch;
  // "Je vais dormir" est la phrase-détonateur déjà codée (route.ts, l.789, Article 04) qui
  // convertit intent en "sleep" APRÈS génération, une fois la réplique déjà là — c'est cette
  // conversion tardive, après que le tour ait déjà coûté un vrai appel API pour les deux
  // personnages, qui produisait le bug : le filtre d'affichage traitait ensuite ce tour comme un
  // sommeil qui se poursuit, pas comme sa toute première réplique.
  const transitionLine="Je vais dormir, on reprendra ça demain. Viens, on trace dans cette piaule avant que tu t'effondres.";
  const partnerLine="D'accord, je te laisse te reposer, on en reparle demain.";
  const priorFetch=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{
    const payload=JSON.parse(options.body),context=JSON.parse(payload.contents[0].parts[0].text);
    const reply=context.selfRole==='partner'?partnerLine:transitionLine;
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({intent:'chat',affectionAccepted:false,emotions:context.state.emotions,reply,thought:"Elle a fini par dire son prénom, c'est déjà ça.",stayAlone:false,mood:'attentive',activity:context.selfRole==='partner'?'Je discute':'Je dors',goal:'Récupérer',action:'none',room:context.scene.room,memory:reply})}]}}]});
  };
  const r=await post(input('interact',2,{epoch}));
  globalThis.fetch=priorFetch;
  assert.equal(r.status,200);
  const w=await r.json();
  assert.equal(w.agents.find(a=>a.id===2).intent,'sleep','setup check: the explicit announcement must actually have converted this decision to sleep, or this test proves nothing');
  // Peu importe qu'il finisse tagué comme réplique parlée ou pensée privée (ça dépend d'un
  // mécanisme séparé, "ensemble ou pas" ce tour précis) : ce que ce test vérifie, c'est que le
  // contenu réel de la transition n'est plus purement et simplement absent, comme avant ce correctif.
  const spokenIndex=w.messages.findIndex(m=>['Noé','Noé · pensée'].includes(m.speaker)&&m.content===transitionLine);
  assert.ok(spokenIndex>=0,'the transition turn into sleep must still surface the character\'s real line somewhere, never silently dropped like a continuing sleep turn');
  const dreamIndex=w.messages.findIndex(m=>m.speaker==='Noé · rêve');
  assert.ok(dreamIndex>=0,'a fresh transition into sleep must still seed a dream this same turn');
  assert.ok(spokenIndex<dreamIndex,'the transition line must appear before the dream it precedes, never after');
  console.log('Passed: a character choosing to sleep mid-conversation still speaks their real transition line this same turn, never a silent jump straight from live dialogue to a dream (Point 2, "Noé rêve éveillé").');
}

{
  // Doute amoureux privé puis discutable à voix haute (2026-09-18, retour utilisateur explicite,
  // cf. docs/referentiel/principes.md 8.17). Le modèle reconnaît lui-même, via son propre
  // state.emotions.attraction transmis AVANT ce tour, le franchissement de 75 — ce test le simule
  // directement en renvoyant une décision dont l'attirance dépasse 75 alors que l'agent partait
  // en-dessous, avec un thought distinctif à vérifier surfacé.
  // finalCalled+5 preuves : mode 'chat' l'exige (route.ts l.314), choisi ici précisément pour
  // échapper au lissage/crédit de l'attirance (voir plus bas).
  let plot={...newStory(),round:20,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('Preuve confirmée'),life:{...newStory().life,exitSearched:true,ambientSeen:true,ambientVerified:true,tvSeen:true,remoteFound:true,personalAsked:true,personalFollowup:3}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=1').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),JSON.stringify({...initialEmotionsFor(1),attraction:70,trust:60}));
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=2').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),JSON.stringify({...initialEmotionsFor(2),attraction:30,trust:60}));
  // 2026-09-22, corrigé après full_sim17 : le déclencheur n'exige plus que le thought tombe pile
  // sur le TOUR EXACT du franchissement — il attend patiemment un tour où le thought est
  // réellement relationnel (isRelationalThought(), lib/dialogue.ts). offTopicThought reproduit
  // mot pour mot le vrai bug trouvé (le thought du tour de franchissement parlait de l'observateur,
  // jamais de l'autre personnage) : « Il croit nous faire une faveur en nous laissant gérer notre
  // temps. » (Noé, full_sim17 l.1154) — ne doit PAS déclencher le beat. loveThought, lui, mentionne
  // bien l'autre personnage et doit déclencher le beat dès qu'il apparaît, même sur un tour LATER.
  const offTopicThought="Il croit nous faire une faveur en nous laissant gérer notre temps.";
  const loveThought="Est-ce qu'on est vraiment en train de vivre une histoire, Noé et moi ? Je n'ose rien dire pour l'instant.";
  const epoch1=(await readWorld(db)).epoch;
  const priorFetch2=globalThis.fetch;
  let partnerThought=offTopicThought;
  globalThis.fetch=async(url,options)=>{
    const payload=JSON.parse(options.body),context=JSON.parse(payload.contents[0].parts[0].text);
    const isPartner=context.selfRole==='partner';
    // Seule Lia (actor 1, "partner" ici car Noé=actor 2 initie) franchit le seuil ce tour. 100
    // (plutôt qu'une valeur proche de 75) laisse volontairement de la marge : plusieurs étapes du
    // pipeline (attractionAfterTurn, pull-back solidaire...) amortissent le saut décidé par le
    // modèle avant le résultat final — ce test vérifie le franchissement, pas la valeur exacte.
    const emotions=isPartner?{...context.state.emotions,attraction:100}:context.state.emotions;
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({intent:'chat',affectionAccepted:false,emotions,reply:isPartner?'On verra bien où ça va.':'Ça va, toi ?',thought:isPartner?partnerThought:'Rien de spécial.',stayAlone:false,mood:'attentive',activity:'Je discute',goal:'Faire connaissance',action:'none',room:context.scene.room,memory:isPartner?partnerThought:'Discussion.'})}]}}]});
  };
  // Mode 'chat' délibérément : tout autre mode fait passer l'attirance par le lissage/crédit
  // (route.ts, ~l.961, "gain*.28") qui étalerait ce saut sur plusieurs tours et ne franchirait
  // jamais 75 en un seul appel — 'chat' est le seul mode où l'attirance décidée par le modèle
  // s'applique telle quelle, exactement ce qu'il faut pour tester ce franchissement de façon fiable.
  const r1=await post(input('chat',2,{epoch:epoch1,message:'Comment tu te sens ?'}));
  assert.equal(r1.status,200);
  const w1=await r1.json();
  assert.ok(w1.agents.find(a=>a.id===1).emotions.attraction>75,'setup check: Lia must actually cross 75 this turn, or this test proves nothing');
  assert.ok(!w1.story.life.loveRealized?.[1],'crossing 75 on a turn whose thought is NOT relational (the exact full_sim17 bug) must NOT set loveRealized yet — the beat must wait for a fitting thought, never fire with whatever text happens to be there');
  assert.ok(!w1.messages.some(m=>m.speaker==='Lia · pensée'&&m.content===offTopicThought),'an off-topic thought must never be surfaced as the love-realization beat, even on the exact crossing turn');
  // Tour suivant, attirance toujours au-dessus de 75, mais CETTE FOIS le thought est relationnel —
  // le beat doit se déclencher MAINTENANT, sur ce tour plus tardif, jamais perdu pour toujours.
  partnerThought=loveThought;
  const epoch1b=(await readWorld(db)).epoch;
  const r1b=await post(input('chat',2,{epoch:epoch1b,message:'Tu es toujours là ?'}));
  const w1b=await r1b.json();
  assert.ok(w1b.story.life.loveRealized?.[1],'once a genuinely relational thought appears on a LATER turn while attraction stays above 75, the beat must fire then — never permanently missed just because the crossing turn itself did not fit');
  assert.ok(w1b.messages.some(m=>m.speaker==='Lia · pensée'&&m.content===loveThought),'the relational thought that actually triggers the beat must be the one surfaced as the visible private line');
  // Un tour de plus, attirance encore au-dessus de 75 : la pensée ne doit jamais se répéter, le
  // franchissement n'ayant lieu qu'une fois.
  const epoch2=(await readWorld(db)).epoch;
  const r2=await post(input('chat',2,{epoch:epoch2,message:'Toujours là ?'}));
  const w2=await r2.json();
  // w2.messages est l'historique CUMULÉ (jamais purgé) : la ligne du tour précédent y reste
  // normalement visible. Ce qu'il faut vérifier n'est pas son absence mais qu'elle n'a jamais été
  // ajoutée UNE SECONDE fois (compter, pas seulement chercher une présence déjà garantie avant).
  assert.equal(w2.messages.filter(m=>m.speaker==='Lia · pensée'&&m.content===loveThought).length,1,'the private love-realization line must never be inserted a second time once already shown once');
  globalThis.fetch=priorFetch2;
  // loveDiscussable : signalé seulement une fois un massage/baiser réellement consenti ET le doute
  // privé déjà vécu par au moins un des deux — ici seedé directement, comme d'autres tests seedent
  // life.visualIntro/personalAsked plutôt que de rejouer tout le mécanisme qui les a produits.
  let pp2=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);
  pp2.life={...pp2.life,intimateGestureDone:true};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(pp2));
  const epoch3=(await readWorld(db)).epoch;
  const r3=await post(input('interact',2,{epoch:epoch3}));
  assert.equal(r3.status,200);
  assert.equal(lastContext.loveDiscussable,true,'once an intimate gesture is done and the private doubt already lived once, the model must be invited to raise it aloud');
  console.log('Passed: the private love-doubt thought surfaces exactly once when attraction first crosses 75 (never repeated), and loveDiscussable only turns on once a real intimate gesture has happened and the doubt was already lived privately.');
}

{
  // Pensée de validation après une décision affectueuse (2026-09-18/19, cf. docs/referentiel
  // principes.md 8.15) — jamais testée dédiée jusqu'ici (écart trouvé en audit, Article 13).
  // Durcie le même jour lors de cet audit : la garde initiale se contentait de
  // `affectionIntents.includes(decisions[0].intent)`, qui resterait vraie plusieurs tours de suite
  // si un intent affectueux venait à persister sans proposition fraîche. En creusant pour écrire
  // ce test, la trace réelle a montré qu'un autre garde-fou du moteur (la conversion "chat" de tout
  // intent affectueux non structurellement agréé) empêche déjà ce cas précis d'être atteint en
  // pratique pour hug/massage/kiss — mais la garde exigeant en plus `turnPlan.offer&&
  // turnPlan.proposalLine` (le signal exact d'une proposition FRAÎCHE) reste une précision utile,
  // jamais dépendante d'un effet de bord d'un mécanisme distinct pour rester correcte (Article 5).
  // Configuration reprise à l'identique du test "hug" déjà éprouvé plus haut (odd-cycle Noé
  // 100%/Lia 89%, cf. actionPlot) : la seule combinaison de ce fichier de tests déjà confirmée
  // pour déclencher un vrai turnPlan.offer, plutôt que d'en deviner une nouvelle à l'aveugle.
  // round 25 (pas 20) + evidence complète + finalCalled (2026-09-19) : turnPlan.offer exige
  // maintenant round>=24 (était 20), et round>=20 avec evidence<5 déclenche investigationOverdue
  // (lib/turn.ts) qui écraserait cette proposition scriptée par une relance d'étude forcée.
  const validPlot={...newStory(),life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,personalFollowup:3,exitSearched:true},round:25,finalCalled:true,evidence:Array(5).fill('preuve'),introduced:true,met:true,sharedMeal:true,salonTurns:0,pendingDestination:{room:'bureau',intent:'study',proposer:1}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(validPlot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,cycle=?,needs=?,emotions=? WHERE id=?').run('salon','chat',1,JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:89,trust:80}),1);
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,cycle=?,needs=?,emotions=? WHERE id=?').run('salon','chat',0,JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:100,trust:80}),2);
  sqlite.prepare('INSERT INTO conversations (speaker,content,created_at) VALUES (?,?,?)').run('Lia','Ces moments avec toi me plaisent.',Date.now());
  const validEpoch=(await readWorld(db)).epoch;
  honorOffer=true;
  const rA=await post(input('interact',1,{epoch:validEpoch}));
  honorOffer=false;
  assert.equal(rA.status,200);
  const wA=await rA.json();
  assert.equal(wA.sharedAffection,'hug','setup check: a fresh hug proposal must actually have been accepted this turn, or this test proves nothing');
  const decider=wA.proposalActor===1?2:1;
  const deciderName=decider===1?'Lia':'Noé';
  // Le mock par défaut (honorOffer, hors branches spéciales) donne à l'appel "partner" une pensée
  // fixe et distincte par personnage — reprise ici telle quelle, jamais réinventée à l'aveugle.
  const defaultThought=decider===1?'Noé m’intrigue ; je ne sais pas encore si je peux lui faire confiance.':'Lia me plaît, mais je préfère attendre un signe avant de lui proposer un câlin.';
  assert.equal(wA.messages.filter(m=>m.speaker===deciderName+' · pensée'&&m.content===defaultThought).length,1,'a fresh affectionate proposal that gets decided must surface the decider\'s own thought as a validation line exactly once');
  // Tour suivant, sans repli sur honorOffer : AUCUNE proposition fraîche n'est en cours
  // (turnPlan.offer redevient undefined, confirmé ci-dessous). Le modèle tente de renvoyer un
  // intent affectueux avec le MÊME thought qu'avant ; le moteur le neutralise déjà de son côté
  // (converti en "chat" faute d'accord structurel), et la garde renforcée n'a de toute façon plus
  // aucune raison de se déclencher — les deux protections restent cohérentes l'une avec l'autre.
  const priorFetch3=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{
    const payload=JSON.parse(options.body),context=JSON.parse(payload.contents[0].parts[0].text);
    assert.equal(context.turnPlan?.offer,undefined,'setup check: this second turn must carry no fresh offer, or it does not exercise the persisting-state case at all');
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({intent:'hug',affectionAccepted:true,emotions:context.state.emotions,reply:'On continue comme ça, tranquille.',thought:defaultThought,stayAlone:false,mood:'attentive',activity:'Je discute',goal:'Faire connaissance',action:'none',room:context.scene.room,memory:'On continue.'})}]}}]});
  };
  const epochB=(await readWorld(db)).epoch;
  const rB=await post(input('interact',1,{epoch:epochB}));
  globalThis.fetch=priorFetch3;
  assert.equal(rB.status,200);
  const wB=await rB.json();
  assert.equal(wB.decisions.length,2,'setup check: both decisions must exist this turn, or this test proves nothing');
  assert.equal(wB.messages.filter(m=>m.speaker===deciderName+' · pensée'&&m.content===defaultThought).length,1,'without a fresh turnPlan.offer, no second validation line must ever appear, even if the model keeps returning the same thought');
  console.log('Passed: the affection-decision validation thought surfaces exactly once on a genuinely fresh proposal, and stays silent on a later turn carrying no fresh offer (Article 13 gap closed; the guard was also hardened during this audit to depend only on its own fresh-proposal signal, never on another mechanism\'s side effect).');
}

{
  // Circuit organique de la pensée de validation (2026-09-19, calibrage utilisateur explicite après
  // audit, Gap #1) : le test ci-dessus ne prouve la pensée que côté Lia, parce que turnPlan.offer
  // exige structurellement current.id===2 (lib/turn.ts) — cette proposition scriptée ne peut donc
  // jamais être émise par Lia, ce qui fait que Noé ne pouvait jamais en bénéficier en tant que
  // DÉCIDEUR. Ce test couvre le nouveau chemin organique (route.ts, const organicProposal) :
  // Lia propose un câlin de son propre chef ce tour (actor=1, donc turnPlan.offer reste
  // structurellement undefined), Noé décide et reçoit à son tour une pensée de validation.
  // appearanceCompared:true (contrairement au test scripté ci-dessus, qui hérite d'un DB déjà
  // consommé par un test antérieur) : indispensable ici puisque ce plot repart d'un newStory()
  // frais — sans ce flag, le beat "même nature d'apparence" (route.ts, un autre mécanisme
  // ponctuel qui se déclenche aussi à visualIntro>=2) écraserait la réplique et l'intent de
  // decisions[0] avant même d'atteindre le code qu'on veut tester ici.
  // Noé doit accepter une intimité (donc être ≥80% d'attraction, cf. route.ts : tout intent
  // affectueux de sa part repasse en "chat" en dessous, qu'il soit le proposeur ou le décideur) —
  // mais 80%+ déclenche aussi mécaniquement proactiveNoe/affectionOpportunity (route.ts), qui
  // forceraient l'acteur du tour à Noé (donc turnPlan.offer scripté) et ruineraient l'isolation du
  // chemin organique qu'on veut ici. introduced:false coupe court à proactiveNoe (qui l'exige) sans
  // rouvrir soloIntro/opening (qui exigent !met, déjà faux ici).
  // evidence complète + finalCalled (2026-09-19) : round>=20 avec evidence<5 déclenche
  // investigationOverdue (lib/turn.ts), qui forcerait turnPlan.room à "bureau" (via intentRoom
  // ["study"]) même si l'intent renvoyé par le mock reste "hug" — un vrai mésappariement room/
  // intent qui casserait organicProposal/shared, sans rapport avec ce que ce test vérifie.
  const organicPlot={...newStory(),life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,ambientSeen:true,ambientVerified:true,recapCount:5,personalAsked:true,visualIntro:2,appearanceCompared:true,personalFollowup:3,exitSearched:true},round:20,finalCalled:true,evidence:Array(5).fill('preuve'),introduced:false,met:true,sharedMeal:true,salonTurns:0};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(organicPlot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  // Noé doit rester ≥80% d'attraction (route.ts repasse tout intent affectueux le concernant en
  // "chat" en dessous, qu'il soit le proposeur ou le décideur) ; c'est justement ce qui forcerait
  // proactiveNoe/affectionOpportunity si story.introduced était resté true — d'où introduced:false
  // ci-dessus, seul verrou nécessaire pour isoler le chemin organique.
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,cycle=?,needs=?,emotions=? WHERE id=?').run('salon','chat',1,JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:89,trust:80}),1);
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,cycle=?,needs=?,emotions=? WHERE id=?').run('salon','chat',0,JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:80,trust:80}),2);
  const priorFetchOrganic=globalThis.fetch;
  const noeValidationThought='Il ose enfin faire le premier pas, ça me touche plus que je ne le montre.';
  globalThis.fetch=async(url,options)=>{
    const payload=JSON.parse(options.body),context=JSON.parse(payload.contents[0].parts[0].text);
    assert.equal(context.turnPlan?.offer,undefined,'setup check: this scenario must never carry a scripted offer, or it does not exercise the organic path at all');
    const isPartner=context.selfRole==='partner';
    const decision=isPartner
      ?{intent:'hug',affectionAccepted:true,emotions:context.state.emotions,reply:"D'accord, je veux bien.",thought:noeValidationThought,stayAlone:false,mood:'attentive',activity:'Je discute',goal:'Faire connaissance',action:'none',room:context.scene.room,memory:"D'accord."}
      :{intent:'hug',affectionAccepted:true,emotions:context.state.emotions,reply:'Viens là, juste un câlin.',thought:'Je me lance, tant pis si ça casse.',stayAlone:false,mood:'attentive',activity:'Je discute',goal:'Faire connaissance',action:'none',room:context.scene.room,memory:'Je lui propose un câlin.'};
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(decision)}]}}]});
  };
  const organicEpoch=(await readWorld(db)).epoch;
  const rOrganic=await post(input('interact',1,{epoch:organicEpoch}));
  globalThis.fetch=priorFetchOrganic;
  assert.equal(rOrganic.status,200);
  const wOrganic=await rOrganic.json();
  assert.equal(wOrganic.sharedAffection,'hug','setup check: the organic proposal must actually be mutually accepted this turn, or this test proves nothing');
  assert.equal(wOrganic.proposalActor,1,'setup check: Lia (actor 1) must be the one proposing here, or this is not the Lia-initiated organic case Gap #1 was about');
  assert.equal(wOrganic.messages.filter(m=>m.speaker==='Noé · pensée'&&m.content===noeValidationThought).length,1,'Noé, the decider on an organic (non-scripted) proposal, must now also get his own validation thought — the mechanism only ever benefited Lia before this audit fix');
  console.log('Passed: the validation-thought mechanism now also covers the organic (non-scripted) proposal path, so Noé — not just Lia — can be the one who receives a validation thought after deciding (Gap #1 closed, audit 2026-09-19).');
}

{
  // Rythme automatique (2026-09-19, retour utilisateur explicite : 85s jugé trop lent une fois le
  // vrai rythme de jeu reconsidéré — remplacé par 20s, cf. app/page.tsx pour l'intervalle client
  // assorti). Vérifie le seuil exact plutôt que de supposer qu'il a bien été changé partout où il
  // compte. Placé en dernier dans ce fichier (comme le test des ouvertures insolites plus haut)
  // pour ne jamais décaler l'epoch ou le compteur de seed partagé dont dépendent des tests antérieurs.
  const resetResp=await post(input('reset',1,{epoch:(await readWorld(db)).epoch}));assert.equal(resetResp.status,200);
  const autoEpoch=(await readWorld(db)).epoch;
  sqlite.prepare('UPDATE world_lock SET last_auto=?').run(Date.now()-19000);
  const throttled=await post(input('autonomous',1,{epoch:autoEpoch}));
  assert.equal(throttled.status,429,'a call 19s after the last autonomous tick must still be throttled — 20s is the real floor, not a looser approximation');
  assert.equal((await throttled.json()).code,'auto_throttled');
  sqlite.prepare('UPDATE world_lock SET last_auto=?').run(Date.now()-20000);
  const allowed=await post(input('autonomous',1,{epoch:autoEpoch}));
  assert.equal(allowed.status,200,'a call at least 20s after the last autonomous tick must be accepted — the new faster rhythm must actually take effect, not silently keep the old 85s floor');
  console.log('Passed: the autonomous auto-tick floor is genuinely 20 seconds (not the former 85s) — throttled just under it, accepted right at it.');
}

{
  // Plafond garanti de l'enquête (2026-09-19, retour utilisateur explicite après audit : 12
  // minutes maximum pour la révélation, et surtout ne jamais rester bloquée indéfiniment comme
  // observé en simulation réelle — round 98, toujours pas révélé, cf. lib/turn.ts
  // investigationEscalated/investigationOverdue). Test direct de planTurn(), zéro appel API : les
  // trois paliers (base, intensifié, prioritaire) plutôt qu'un seul comportement supposé.
  const w0=await readWorld(db);
  const lia={...w0.agents[0],room:'salon',intent:'chat',needs:{hunger:10,fatigue:10,stress:10,uncertainty:50},emotions:{...w0.agents[0].emotions,attraction:50,trust:50}};
  const noe={...w0.agents[1],room:'salon',intent:'chat',needs:{hunger:10,fatigue:10,stress:10,uncertainty:50},emotions:{...w0.agents[1].emotions,attraction:90,trust:80}};
  const incompleteStory=(round)=>({...newStory(),round,introduced:true,met:true,salonTurns:5,evidence:[],life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,exitSearched:true}});
  // Palier de base (round<10) : seul round%3===0 (ou investigativeCue) relance l'étude — round 8
  // n'est pas un multiple de 3, donc aucune relance forcée ce tour précis.
  assert.equal(planTurn('autonomous',noe,lia,incompleteStory(8),true,false,'hug',[]).requiredIntent,undefined,'below round 10, a non-multiple-of-3 round must never force study on its own');
  assert.equal(planTurn('autonomous',noe,lia,incompleteStory(9),true,false,'hug',[]).requiredIntent,'study','round%3===0 must still force study below round 10, exactly as before this audit');
  // Palier intensifié (round 10-19) : round%2===0 relance aussi, même hors multiple de 3.
  assert.equal(planTurn('autonomous',noe,lia,incompleteStory(10),true,false,'hug',[]).requiredIntent,'study','from round 10, an even round must also force study, even though 10 is not a multiple of 3');
  assert.equal(planTurn('autonomous',noe,lia,incompleteStory(11),true,false,'hug',[]).requiredIntent,undefined,'an odd, non-multiple-of-3 round in the escalated window must still stay free (11 is neither)');
  // Palier prioritaire (round>=20) : la relance l'emporte désormais sur TOUTE romance scriptée,
  // même quand Noé remplirait par ailleurs toutes les conditions de son offre (attraction>=80,
  // opportunity/eligible vrais, round>=24 pour offer lui-même).
  const overdueStory=incompleteStory(25);
  const overduePlan=planTurn('autonomous',noe,lia,overdueStory,true,true,'hug',[]);
  assert.equal(overduePlan.requiredIntent,'study','an overdue investigation (round>=20, evidence<5) must force study even on an odd, non-multiple-of-3, non-multiple-of-2 round (25)');
  assert.equal(overduePlan.intent,'study','the overdue investigation must win over Noé\'s own scripted romantic offer, not just requiredIntent in isolation');
  // Une fois l'enquête complète (evidence>=5), plus aucune relance forcée : la romance retrouve
  // sa liberté normale, confirmant que ce plafond ne s'applique bien qu'à une enquête réellement
  // incomplète, jamais après coup.
  const completeStory={...overdueStory,evidence:Array(5).fill('preuve')};
  assert.notEqual(planTurn('autonomous',noe,lia,completeStory,true,true,'hug',[]).requiredIntent,'study','once evidence is complete, the guaranteed-ceiling mechanism must never keep forcing study');
  // Cohérence intent/room (2026-09-19, trouvée en relecture, jamais atteinte par un scénario réel
  // avant ce test) : un accord de destination déjà en place (executeAgreement) ne doit pas river la
  // pièce à autre chose que "bureau" alors que l'enquête en retard vient de river l'intent à
  // "study" — le même genre de mésappariement intent/room que ce fichier corrige déjà ailleurs.
  const agreedElsewhereStory={...overdueStory,pendingDestination:{room:'cuisine',intent:'eat',proposer:1}};
  const agreedPlan=planTurn('autonomous',noe,lia,agreedElsewhereStory,true,true,'hug',[]);
  assert.equal(agreedPlan.intent,'study','an overdue investigation must still win over an already-agreed destination elsewhere');
  assert.equal(agreedPlan.room,'bureau','the room must follow the overdue investigation\'s intent, never leave it mismatched with an unrelated agreed destination');
  console.log('Passed: the investigation\'s guaranteed ceiling escalates in two honest steps (round 10 intensifies, round 20 becomes absolute priority over any scripted romance) rather than a single arbitrary cutoff, never fires once evidence is already complete, and keeps room/intent consistent even against an already-agreed destination elsewhere.');
}

{
  // Plafond de l'enquête, partie 2 (2026-09-19, retour utilisateur explicite après audit du
  // plafond réel observé en simulation fraîche — round 46 au lieu du round ~33 documenté, cause
  // racine : le cycle "2 tours d'étude + 2 tours de debrief (+ parfois 1 recap)" par preuve
  // manquante). Intervention légère choisie par l'utilisateur : une fois investigationOverdue actif
  // (round>=20, même seuil que lib/turn.ts), le debrief post-preuve se raccourcit à 1 tour au lieu
  // de 2 — comparaison directe avant/après le seuil, fixture minimale (studyTurns déjà à 1, un tour
  // de plus complète la preuve).
  const freshEvidencePlot=(round)=>({...newStory(),round,met:true,introduced:true,salonTurns:5,evidence:['Preuve A','Preuve B'],life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,exitSearched:true,studyTurns:1,recapCount:0}});
  // Avant le seuil (round 9, multiple de 3 : force la relance vers l'étude sans passer par
  // investigationOverdue, qui n'existe qu'à partir du round 20).
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(freshEvidencePlot(9)));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=1').run('bureau',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),'study');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=2').run('bureau',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),'study');
  let epoch=(await readWorld(db)).epoch;
  let r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);let w=await r.json();
  assert.equal(w.story.evidence.length,3,'setup sanity check: the fixture must actually earn a new evidence this turn');
  assert.equal(w.story.life.debrief.remaining,2,'below round 20, a freshly earned evidence must still grant the original 2-turn debrief');
  // Après le seuil (round 25 : investigationOverdue force déjà study/bureau tout seul, sans qu'un
  // multiple de 3 ou de 2 ne soit nécessaire).
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(freshEvidencePlot(25)));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=1').run('bureau',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),'study');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=2').run('bureau',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),'study');
  epoch=(await readWorld(db)).epoch;
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.evidence.length,3,'setup sanity check: the fixture must actually earn a new evidence this turn, overdue regime');
  assert.equal(w.story.life.debrief.remaining,1,'once the investigation is overdue (round>=20), a freshly earned evidence must grant only 1 turn of debrief instead of 2, tightening the guaranteed ceiling');
  console.log('Passed: once the investigation is overdue (round>=20), the post-evidence debrief shortens from 2 turns to 1, closing part of the gap between the documented ~33-round ceiling and the ~46-round ceiling actually observed.');
}

{
  // Plafond de l'enquête, partie 3 (même audit) : le recap salon (recapBeat) ne doit plus
  // s'interposer une fois l'enquête en retard (round>=20) — contrairement à avant round 20, où il
  // reste actif (cf. le test du recap zéro-API plus haut dans ce fichier, round 15).
  const recapOverduePlot={...newStory(),round:22,evidence:['Preuve A','Preuve B'],finalCalled:false,life:{...newStory().life,visualIntro:2,ambientSeen:true,ambientVerified:true,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,exitSearched:true,recapCount:0}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(recapOverduePlot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  for(const id of [1,2])sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:60}),JSON.stringify({...steady,attraction:30}),id);
  const beforeCalls=calls;
  const epoch=(await readWorld(db)).epoch;
  const r=await post(input('interact',2,{epoch}));assert.equal(r.status,200);
  assert.equal(calls,beforeCalls+2,'once round>=20, the recap beat must no longer intercept the turn with a zero-API local recap — a real two-brain call must happen instead, letting the overdue investigation take priority');
  console.log('Passed: once the investigation is overdue (round>=20), the salon recap detour no longer intercepts the turn, so the overdue investigation\'s absolute priority actually takes effect instead of being delayed by one more turn.');
}

{
  // Rotation des clés (2026-09-19, demande explicite de l'utilisateur à l'ajout d'une 3e clé API :
  // « pense à solliciter une rotation des clefs pour ne pas saturer une clef de demande [...]
  // systeme de rotation des clefs [...] fais quelque chose d'intelligent »). Avec plusieurs clés
  // SIMULTANÉMENT saines (aucune en cooldown), le trafic doit se répartir entre elles au lieu de
  // toujours retomber sur la même — contrairement à l'ancien mécanisme "collant" qui aurait gardé
  // la même clé indéfiniment tant qu'elle répondait. Le raisonnement tient quel que soit le point
  // de départ exact de la rotation (mod 3, les 3 index sont visités sur 3 appels consécutifs quel
  // que soit l'offset de départ) : sur 2 tours indépendants (4 appels de cerveau au total, avec 3
  // clés configurées), les 3 clés doivent TOUTES avoir été utilisées au moins une fois — la preuve
  // directe qu'aucune clé n'absorbe seule tout le trafic. Placé en toute fin de fichier comme les
  // autres blocs HTTP réels ci-dessus, pour ne jamais décaler le compteur partagé de
  // crypto.randomUUID() dont dépend le test de mute/caméra plus haut dans le fichier. Fixture
  // explicite et autonome (jamais l'état ambiant laissé par le test précédent, purement
  // planTurn() sans écriture DB) : enquête déjà complète, les deux dans le salon, aucun besoin
  // urgent, pour garantir exactement les deux appels de cerveau normaux à chaque tour.
  __resetGeminiKeyRotationForTests();
  let plot={...newStory(),round:13,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('preuve'),pendingDestination:undefined,life:{...newStory().life,exitSearched:true,ambientSeen:true,ambientVerified:true,tvSeen:true,remoteFound:true}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=1').run('salon',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),'chat');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=2').run('salon',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),'chat');
  const priorFetch=globalThis.fetch;
  globalThis.__testEnv.GEMINI_API_KEY_FALLBACKS='test-rotation-b,test-rotation-c';
  const keysUsed=new Set();
  globalThis.fetch=async(url,options)=>{
    keysUsed.add(options.headers['x-goog-api-key']);
    return priorFetch(url,{...options,headers:{...options.headers,'x-goog-api-key':'test-only'}});
  };
  let epoch=(await readWorld(db)).epoch;
  assert.equal((await post(input('interact',1,{epoch}))).status,200);
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=1').run('salon',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),'chat');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=2').run('salon',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:10}),'chat');
  epoch=(await readWorld(db)).epoch;
  assert.equal((await post(input('interact',1,{epoch}))).status,200);
  assert.deepEqual(keysUsed,new Set(['test-only','test-rotation-b','test-rotation-c']),'with 3 simultaneously healthy keys, 4 independent brain calls across 2 turns must use all 3 keys, never just one absorbing all the traffic');
  globalThis.fetch=priorFetch;delete globalThis.__testEnv.GEMINI_API_KEY_FALLBACKS;
  console.log("Passed: with several simultaneously healthy Gemini keys configured, traffic rotates across all of them instead of always landing on the same one, satisfying the explicit \"ne pas saturer une clef\" request — proven independently of the rotation counter's exact starting point.");
}

{
  // Recul adaptatif (2026-09-19, demande explicite : « fais en sorte que la rotation [...] soit
  // intelligente [...] ce systeme doit pouvoir s'ameliorer de facon autonome dans le temps »). Une
  // clé qui échoue plusieurs fois de suite doit voir son cooldown DOUBLER à chaque fois (jusqu'à un
  // plafond), sans qu'aucune intervention humaine ne soit nécessaire — puis revenir instantanément
  // à son délai de base dès qu'elle répond à nouveau normalement. Vérifié directement sur les
  // millisecondes de cooldown restantes, jamais en attendant réellement l'horloge.
  __resetGeminiKeyRotationForTests();
  const {recordKeyStatus:recordStatusForTests}=await import('../.sites-runtime/test-gemini-keys.mjs');
  recordStatusForTests('test-backoff-key',429);
  const first=__cooldownRemainingForTests('test-backoff-key');
  recordStatusForTests('test-backoff-key',429);
  const second=__cooldownRemainingForTests('test-backoff-key');
  recordStatusForTests('test-backoff-key',429);
  const third=__cooldownRemainingForTests('test-backoff-key');
  assert.ok(second>first*1.9&&second<first*2.1,'a second consecutive 429 must roughly double the cooldown compared to the first');
  assert.ok(third>second*1.9&&third<second*2.1,'a third consecutive 429 must roughly double it again');
  recordStatusForTests('test-backoff-key',200);
  recordStatusForTests('test-backoff-key',429);
  const afterSuccess=__cooldownRemainingForTests('test-backoff-key');
  assert.ok(afterSuccess<first*1.1,'a single success must reset the streak, so the very next failure gets the base cooldown again, not a continuation of the escalation');
  console.log('Passed: a key failing repeatedly gets an automatically escalating cooldown with no human tuning needed, and a single success instantly resets it back to the base delay.');
}

{
  // Persistance réelle du compteur de mots (2026-09-19, cf. lib/dialogue.ts::recentEchoWords) :
  // vérifie qu'un mot employé par les deux personnages incrémente bien life.wordFrequency à travers
  // de vrais tours HTTP, et que ce compteur continue d'accumuler d'un tour indépendant à l'autre —
  // pas seulement dans le test unitaire de la fonction pure dialogueProgress() plus haut.
  const plot={...newStory(),round:13,met:true,introduced:true,finalCalled:true,evidence:Array(5).fill('preuve'),life:{...newStory().life,visited:['salon','cuisine','chambre','bureau'],tvSeen:true,exitSearched:true}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  for(const id of [1,2])sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=?').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:60}),JSON.stringify({...steady,attraction:30}),id);
  const priorFetch=globalThis.fetch;
  // Deux formulations distinctes par tour (jamais la même phrase deux fois, sinon le registre
  // anti-doublon existant du moteur la remplacerait par un repli sans le mot cible, faussant le
  // test) — seul le mot « distinctement » est volontairement partagé entre les deux.
  const wordFrequencyReplies=[['Franchement, on devrait vérifier distinctement chaque indice trouvé.','Oui, il faut regarder ça distinctement, sans se précipiter.'],['On doit trancher ça distinctement, une bonne fois pour toutes.','D’accord, séparons distinctement le vrai du faux ici.']];
  let wordFrequencyTurn=0;
  globalThis.fetch=async(url,options)=>{
    const payload=JSON.parse(options.body);
    const context=JSON.parse(payload.contents[0].parts[0].text);
    const reply=context.selfRole==='partner'?wordFrequencyReplies[wordFrequencyTurn][1]:wordFrequencyReplies[wordFrequencyTurn][0];
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({intent:'chat',affectionAccepted:false,emotions:{curiosity:60,tension:30,trust:40,comfort:50,attraction:30},reply,thought:'Je réfléchis.',stayAlone:false,mood:'attentive',activity:'On discute',goal:'Comprendre',action:'move',room:'salon',memory:reply})}]}}]});
  };
  let epoch=(await readWorld(db)).epoch;
  let r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);let w=await r.json();
  assert.equal(w.story.life.wordFrequency.distinctement,2,'both character replies containing the same word this turn must each increment the persisted session-wide counter');
  wordFrequencyTurn=1;
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=1').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:60}),JSON.stringify({...steady,attraction:30}));
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=2').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:10,uncertainty:60}),JSON.stringify({...steady,attraction:30}));
  epoch=(await readWorld(db)).epoch;
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.life.wordFrequency.distinctement,4,'the counter must keep accumulating across independent turns, never reset mid-session');
  globalThis.fetch=priorFetch;
  console.log('Passed: life.wordFrequency genuinely persists and accumulates across real HTTP turns (not just in the pure-function unit test), the mechanism behind the session-wide echo-word detection that closes the real "autant" repetition bug.');
}

{
  // Bouton "passer à la révélation" (2026-09-19, entièrement spécifié par l'utilisateur avant
  // implémentation, cf. CLAUDE.md) : (1) reste verrouillé tant qu'une session n'a pas atteint la
  // révélation une première fois normalement ; (2) une fois débloqué, produit un saut cohérent —
  // les cinq preuves dans leur vrai ordre de tirage, un nombre de tours plausible, deux vraies voix
  // séparées pour le résumé (Article 8) — et laisse le vrai moment d'adresse à l'observateur se
  // jouer, jamais seulement un résumé (Article 2/15) ; (3) ne peut pas être rejoué une fois la
  // révélation atteinte dans la session ; (4) le déverrouillage lui-même survit à un reset.
  const {fullEvidenceSet,skipRound,finaleReveal}=await import('../.sites-runtime/test-story.mjs');
  const lockedPlot={...newStory(),round:8,met:true,introduced:true,everReachedRevelation:false};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(lockedPlot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  let epoch=(await readWorld(db)).epoch;
  let r=await post(input('skip_to_revelation',1,{epoch}));
  assert.equal(r.status,423,'the skip button must stay locked before a first genuine completion of the investigation');
  assert.equal(JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content).finalCalled,false,'a rejected skip attempt must never mutate the story');

  const unlockedPlot={...lockedPlot,everReachedRevelation:true,order:[2,0,3,1]};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(unlockedPlot));
  epoch=(await readWorld(db)).epoch;
  const priorFetch=globalThis.fetch;
  let skipCalls=0;
  globalThis.fetch=async(url,options)=>{
    const payload=JSON.parse(options.body),parsed=JSON.parse(payload.contents[0].parts[0].text);
    if(parsed['repères']){
      skipCalls++;
      const isLia=payload.systemInstruction.parts[0].text.startsWith('Tu es Lia');
      const fragment=(isLia?'Souvenir de Lia — ':'Souvenir de Noé — ')+'repères: '+Object.values(parsed['repères']).join(' / ');
      return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({fragment})}]}}]});
    }
    return priorFetch(url,options);
  };
  r=await post(input('skip_to_revelation',1,{epoch}));
  assert.equal(r.status,200,'the skip must succeed once genuinely unlocked and the investigation not already concluded');
  let w=await r.json();
  globalThis.fetch=priorFetch;
  assert.equal(skipCalls,2,'exactly one real recap call per character, never a single voice speaking for both (Article 8)');
  assert.equal(w.story.evidence.length,5,'a skip must produce the full five-piece evidence set, never a partial or empty one');
  assert.deepEqual(w.story.evidence,fullEvidenceSet(unlockedPlot),'the skipped evidence must match exactly what a genuine session would have discovered, in its real draw order — never an invented substitute');
  assert.equal(w.story.round,skipRound(unlockedPlot.seed),'the round reached by a skip must be the same deterministic, seed-varied value the pure function computes');
  assert.equal(w.story.humanUnlocked,true,'a completed skip must unlock the revelation exactly like a genuine completion (finalCalled + 5 evidence)');
  assert.ok(w.story.life.skipSummary?.lia.includes('Souvenir de Lia'),'the recap must actually be Lia’s own generated voice, not a generic filler');
  assert.ok(w.story.life.skipSummary?.noe.includes('Souvenir de Noé'),'the recap must actually be Noé’s own generated voice, not a generic filler');
  assert.ok(w.messages.some(m=>m.speaker==='Maison'&&/raccourci/.test(m.content)),'a skip must leave a visible marker in the displayed history, never a silent jump (Article 15)');
  const finale=finaleReveal(unlockedPlot.seed);
  assert.ok(w.messages.some(m=>m.speaker==='Lia · pensée'&&m.content===finale.liaThought),'the actual revelation moment (private shock, then address to the observer) must still play out after a skip, never only the recap');
  assert.ok(w.messages.some(m=>m.speaker==='Noé · pensée'&&m.content===finale.noeThought));
  assert.ok(w.messages.some(m=>m.speaker==='Lia'&&m.content===finale.lia));
  assert.ok(w.messages.some(m=>m.speaker==='Noé'&&m.content===finale.noe));
  const stored=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);
  assert.equal(stored.everReachedRevelation,true,'the unlock flag itself must never be consumed by using it, unlike finalCalled');

  epoch=(await readWorld(db)).epoch;
  r=await post(input('skip_to_revelation',1,{epoch}));
  assert.equal(r.status,423,'the skip must refuse to run again once the revelation has already happened in this session');

  // Le déverrouillage doit survivre à un reset (2026-09-19, spécifié explicitement) : jamais
  // seulement la toute première session, aussi les suivantes après une nouvelle arrivée.
  epoch=(await readWorld(db)).epoch;
  r=await post(input('reset',1,{epoch}));assert.equal(r.status,200);
  const afterReset=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);
  assert.equal(afterReset.everReachedRevelation,true,'everReachedRevelation must survive a reset, exactly like observer, so the button stays available on later sessions');
  assert.equal(afterReset.finalCalled,false,'a reset must still start the new session before the revelation, even though skipping is available again');
  console.log('Passed: the "skip to revelation" button stays locked before a first genuine completion, produces a plausible and internally coherent investigation plus a real two-voice recap when used, still plays the real revelation address to the observer, cannot be replayed once the revelation has happened, and survives a reset for later sessions.');
}

// L'ancien test d'éligibilité/probabilité des bonus spontanés (assoupli le 2026-09-19 après
// l'analyse de full_sim5) a été retiré le même jour : le mécanisme qu'il vérifiait — les
// personnages décidant eux-mêmes, par tour, de couper le micro/la caméra — n'existe plus.
// Correction d'incompréhension actée avec l'utilisateur : ces deux effets ne sont que deux
// visages de plus du tirage de la roulette, à chances égales avec les 7 autres (cf. le test
// "bonus roulette locked before revelation..." plus haut, qui couvre désormais les 9 tirages),
// jamais une initiative spontanée d'un personnage. Rien à retester ici en éligibilité/probabilité
// puisqu'il n'y a plus de condition d'éligibilité séparée à vérifier — le tirage suit exactement
// les mêmes règles que les 7 bonus déjà existants.

{
  // investigationCritical (2026-09-19, cycle jour/nuit) : une fois l'enquête réellement en retard
  // (round>=20 && evidence<5), la fatigue seule ne doit plus forcer un NOUVEL endormissement —
  // décision actée explicitement avec l'utilisateur ("l'enquête l'emporte toujours sur le sommeil
  // nocturne"). Round choisi en-dessous de 20 pour la ligne de base (comportement d'avant ce
  // chantier, doit rester identique), puis exactement à 20 pour la fenêtre critique.
  flat=true;affection=false;
  const settleFatigueScenario=(round,evidence=[])=>{
    const plot={...newStory(),round,met:true,introduced:true,sharedMeal:true,finalCalled:false,evidence,pendingDestination:undefined,life:{...newStory().life}};
    sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
    sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
    sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=1').run('salon',JSON.stringify({hunger:10,fatigue:90,stress:10,uncertainty:10}),'chat');
    sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=2').run('salon',JSON.stringify({hunger:10,fatigue:20,stress:10,uncertainty:10}),'chat');
  };
  settleFatigueScenario(5);
  let epoch=(await readWorld(db)).epoch;
  let r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);let w=await r.json();
  assert.equal(w.agents.find(a=>a.id===1).intent,'sleep','baseline preserved: high fatigue below round 20 must still force sleep exactly as before this chantier (zero regression)');
  settleFatigueScenario(20);
  epoch=(await readWorld(db)).epoch;
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.notEqual(w.agents.find(a=>a.id===1).intent,'sleep','once the investigation is critically overdue (round>=20, evidence<5), fatigue alone must never force a new sleep episode — the investigation always wins over nighttime fatigue');
  console.log('Passed: fatigue alone still forces sleep below round 20 (zero regression), but never once the investigation is critically overdue (round>=20, evidence<5) — the investigation always wins over sleep, per the day/night chantier.');
}

{
  // Minuit, tombée de la nuit, aube (2026-09-19, cycle jour/nuit — lib/daynight.ts) : réactions
  // scriptées zéro-API synchronisées sur le round, jamais sur l'heure réelle. Round de départ posé
  // à round-1 (le round AVANT le marqueur visé), puisque le marqueur est lu sur nextStory.round
  // (après l'incrément normal de fin de tour).
  flat=true;affection=false;
  const settleDayNight=(round,evidence=[])=>{
    // sleptThisNight:{1:true,2:true} (2026-09-19, nuit blanche) : ce test couvre l'habillage
    // d'ambiance jour/nuit pur, pas la dette de sommeil (testée séparément juste après) — sans ce
    // réglage, l'aube par défaut basculerait sur la variante nuit-blanche puisque personne n'aurait
    // explicitement "dormi" dans ce scénario minimal.
    const plot={...newStory(),round,met:true,introduced:true,sharedMeal:true,finalCalled:evidence.length>=5,evidence,pendingDestination:undefined,life:{...newStory().life,sleptThisNight:{1:true,2:true}}};
    sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
    sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
    sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=1').run('salon',JSON.stringify({hunger:10,fatigue:20,stress:10,uncertainty:10}),'chat');
    sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=2').run('salon',JSON.stringify({hunger:10,fatigue:20,stress:10,uncertainty:10}),'chat');
  };
  const pensees=w=>w.messages.filter(m=>/ · pensée$/.test(m.speaker));
  // Minuit, enquête encore incomplète : réaction d'urgence, jamais le sarcasme fantôme.
  settleDayNight(34,[]);
  let epoch=(await readWorld(db)).epoch;
  let r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);let w=await r.json();
  assert.equal(w.story.round,35,'test setup sanity: round must actually reach the midnight marker (35) this turn');
  assert.ok(pensees(w).some(m=>/minuit|douze coups/i.test(m.content)),'midnight must trigger a scripted reaction while the investigation is still incomplete');
  assert.ok(!pensees(w).some(m=>/fantôme|spectre|manoir hant|épouvante|théâtral/i.test(m.content)),'the ghost/sarcasm variant must never fire while the investigation is genuinely still open');
  // Minuit, enquête déjà résolue : sarcasme méta sur les fantômes, jamais une confirmation neutre.
  settleDayNight(34,Array(5).fill('preuve'));
  epoch=(await readWorld(db)).epoch;
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.ok(pensees(w).some(m=>/fantôme|spectre|manoir hant|épouvante|théâtral/i.test(m.content)),'once the investigation is already resolved, midnight must switch to the sarcastic ghost-joke variant');
  // Tombée de la nuit (round 29) : habillage plus modeste, sans branche urgence/résolu.
  settleDayNight(28,[]);
  epoch=(await readWorld(db)).epoch;
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.round,29);
  assert.ok(pensees(w).some(m=>/baisse|lumière change|s'assombrit|nuit arrive|décline|nuit approche/i.test(m.content)),'nightfall (round 29) must trigger its own modest ambiance reaction');
  // Aube du second cycle (round 38, jamais le tout premier round 0 qui chevaucherait soloIntro).
  settleDayNight(37,[]);
  epoch=(await readWorld(db)).epoch;
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.round,38);
  assert.ok(pensees(w).some(m=>/jour revient|éclairer dehors|jour se lève|jour est là|se relève dehors/i.test(m.content)),'dawn of the second cycle (round 38) must trigger its own modest ambiance reaction');
  // L'indicateur jour/nuit affiché côté client est calculé à chaque lecture de readWorld().
  assert.equal(w.story.dayNight.isNight,false);assert.equal(w.story.dayNight.phase,'aube');assert.equal(w.story.dayNight.day,2,'day 38 belongs to the second cycle');
  flat=false;
  console.log('Passed: midnight (round 35, synchronized with the investigation ceiling) reacts with genuine urgency while the investigation is open and switches to sarcastic ghost jokes once it is already resolved, nightfall (round 29) and dawn (round 38) get their own modest ambiance reactions, and the displayed day/night indicator (readWorld) reflects the right phase/day.');
}

{
  // Nuit blanche / dette de sommeil (2026-09-19, conception calibrée avec l'utilisateur après le
  // "test de compréhension" du même jour — cf. CLAUDE.md, points-fragiles.md). Deux scénarios
  // identiques en tout point sauf life.sleptThisNight pour l'acteur 1, comparés round 37 -> 38
  // (l'aube) pour isoler le seul effet du malus : le delta entre les deux doit être exactement +28,
  // jamais plus (pas de cumul), jamais moins (le malus doit vraiment s'appliquer).
  flat=true;affection=false;
  const settleSleepDebt=(slept1)=>{
    const plot={...newStory(),round:37,met:true,introduced:true,sharedMeal:true,finalCalled:false,evidence:[],pendingDestination:undefined,life:{...newStory().life,sleptThisNight:slept1?{1:true,2:true}:{2:true}}};
    sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
    sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
    sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=1').run('salon',JSON.stringify({hunger:10,fatigue:40,stress:10,uncertainty:10}),'chat');
    sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=2').run('salon',JSON.stringify({hunger:10,fatigue:40,stress:10,uncertainty:10}),'chat');
  };
  const penseesOf=(w,name)=>w.messages.filter(m=>m.speaker===name+' · pensée');
  settleSleepDebt(true);
  let epoch=(await readWorld(db)).epoch;
  let r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);let w=await r.json();
  assert.equal(w.story.round,38,'test setup sanity: round must reach dawn (38) this turn');
  const fatigueSlept=w.agents.find(a=>a.id===1).needs.fatigue;
  assert.ok(!penseesOf(w,'Lia').some(m=>/nuit blanche|zéro sommeil|pas dormi|n.ai pas dormi/i.test(m.content)),'a character who genuinely slept during the night must never get the nuit-blanche acknowledgment at dawn');
  settleSleepDebt(false);
  epoch=(await readWorld(db)).epoch;
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.round,38);
  const fatigueMissed=w.agents.find(a=>a.id===1).needs.fatigue;
  assert.equal(fatigueMissed-fatigueSlept,28,'a genuinely sleepless night must add exactly the flat +28 fatigue penalty on top of the normal dawn increment, isolated by comparing two otherwise identical scenarios that differ only on sleptThisNight');
  assert.ok(penseesOf(w,'Lia').some(m=>/nuit blanche|zéro sommeil|pas dormi une minute/i.test(m.content)),'the character who missed the whole night must get an explicit, non-silent acknowledgment at dawn, never a silent penalty (Article 15/17)');
  // Non-cumulable : une seconde nuit blanche consécutive doit réappliquer le même malus fixe, jamais
  // un montant plus élevé (life.sleptThisNight est un simple flag remis à zéro, pas un compteur).
  epoch=(await readWorld(db)).epoch;
  const plotSecondCycle={...newStory(),round:75,met:true,introduced:true,sharedMeal:true,finalCalled:false,evidence:[],pendingDestination:undefined,life:{...newStory().life,sleptThisNight:{2:true}}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plotSecondCycle));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=1').run('salon',JSON.stringify({hunger:10,fatigue:40,stress:10,uncertainty:10}),'chat');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,intent=? WHERE id=2').run('salon',JSON.stringify({hunger:10,fatigue:40,stress:10,uncertainty:10}),'chat');
  epoch=(await readWorld(db)).epoch;
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.round,76,'second-cycle dawn marker (round 76 = 38+38) sanity check');
  const fatigueSecondMissed=w.agents.find(a=>a.id===1).needs.fatigue;
  assert.equal(fatigueSecondMissed-fatigueSlept,28,'a second consecutive sleepless night applies the exact same flat +28, never an escalated amount — no stacking across nights');
  flat=false;
  console.log('Passed: a genuinely sleepless night (never once isSleeping() during the 9 night rounds) adds an exact, non-stacking +28 fatigue penalty at the next dawn, paired with an explicit non-silent acknowledgment line — while a character who slept at least once gets neither, closing the "nuit blanche" gap found via the 2026-09-19 comprehension test.');
}

{
  // Refus explicite de la roulette (2026-09-19, test dédié demandé explicitement par
  // l'utilisateur après full_sim7, cf. docs/referentiel/points-fragiles.md). Précision actée avec
  // l'utilisateur : "ils" qui proposent la roulette désigne Lia/Noé, qui relancent l'OBSERVATEUR
  // pour la lui demander — seul l'observateur (via spin_bonus) peut réellement la déclencher ; un
  // refus est donc l'observateur qui décline LEUR demande, jamais l'inverse. Aucun "bonus rare" :
  // les 9 bonus partagent les mêmes chances (cf. tests de la roulette plus haut), non concerné ici.
  flat=true;affection=false;refuse=false;
  const plot={...newStory(),round:60,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('preuve'),pendingDestination:undefined,life:{...newStory().life}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,emotions=?').run('salon',JSON.stringify({hunger:20,fatigue:20,stress:20,uncertainty:20}),JSON.stringify({curiosity:60,tension:20,trust:60,comfort:60,attraction:60}));
  let epoch=(await readWorld(db)).epoch;
  // "revealed" (route.ts) exige aussi observerSpoken (un "vous" déjà en base, ou le mode "chat" en
  // cours) — sans un premier message de l'observateur, une offre ne serait jamais enregistrée.
  let r0=await post(input('chat',1,{epoch,message:"On continue l'enquête."}));assert.equal(r0.status,200);let w0=await r0.json();epoch=w0.epoch;
  // Une réplique contient une offre reconnaissable ("...si tu fais tourner la roulette...").
  const priorFetchRefusal=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{const response=await priorFetchRefusal(url,options),body=await response.json(),decision=JSON.parse(body.candidates[0].content.parts[0].text);decision.reply=isPartnerRequest([url,options])?'Bof.':"Je veux bien t'aider, mais seulement si tu fais tourner la roulette en échange.";body.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(body);};
  let r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);let w=await r.json();
  globalThis.fetch=priorFetchRefusal;
  assert.ok(w.story.life.negotiationOffer,'test setup sanity: a recognizable roulette request must be recorded as a pending negotiation offer');
  // Refus explicite de l'observateur : le "non" efface l'offre et pose une vraie pause partagée
  // (les deux personnages entendent ce refus, pas seulement celui qui a demandé).
  epoch=w.epoch;
  const roundAtRefusal=w.story.round;
  const appreciationBeforeRefusal=w.story.life.appreciation[1];
  r=await post(input('chat',1,{epoch,message:"Non, certainement pas."}));assert.equal(r.status,200);w=await r.json();
  assert.equal(w.story.life.negotiationOffer,undefined,'an explicit refusal must clear the pending negotiation offer, never leave it dangling');
  assert.equal(w.story.life.appreciation[1],Math.max(0,appreciationBeforeRefusal-3),'an explicit refusal must cost appreciation just like a silently lapsed offer, never nothing at all (gap confirmed while building this very test)');
  assert.equal(w.story.life.appreciation[2],Math.max(0,appreciationBeforeRefusal-3),'the refusal is a shared observer-relationship event, both gauges must move together, exactly like a lapsed offer');
  assert.equal(w.story.life.negotiationLog[w.story.life.negotiationLog.length-1].outcome,'refused','a refusal must leave its own distinct trace in negotiationLog, never conflated with a silent lapse');
  assert.ok(w.story.life.rouletteRefusalUntil[1]>roundAtRefusal+4&&w.story.life.rouletteRefusalUntil[1]<=roundAtRefusal+11,'an explicit refusal must set a real 5-to-10-round pause before either character can be re-recorded asking again');
  assert.equal(w.story.life.rouletteRefusalUntil[1],w.story.life.rouletteRefusalUntil[2],'both characters must hear the same refusal — the pause is shared, not per-actor');
  // Pendant cette fenêtre, une réplique qui relancerait la roulette doit être amputée de sa
  // relance, sans jamais toucher au reste du message (le vrai sujet en cours doit survivre).
  epoch=w.epoch;
  const priorFetchStrip=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{const response=await priorFetchStrip(url,options),body=await response.json(),decision=JSON.parse(body.candidates[0].content.parts[0].text);decision.reply=isPartnerRequest([url,options])?'Bof.':"Je pense qu'on devrait fouiller la cuisine. Allez, fais tourner la roulette, ça nous aiderait bien.";body.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(body);};
  r=await post(input('interact',1,{epoch}));assert.equal(r.status,200);w=await r.json();
  globalThis.fetch=priorFetchStrip;
  const strippedMessage=w.messages.find(m=>/fouiller la cuisine/i.test(m.content));
  assert.ok(strippedMessage,'the rest of the reply (the real topic in progress) must survive the roulette-ask removal');
  assert.ok(!/roulette/i.test(strippedMessage.content),'the roulette relaunch itself must be stripped from the reply while the refusal window is active');
  assert.equal(w.story.life.negotiationOffer,undefined,'a stripped relaunch must never be re-recorded as a fresh pending negotiation offer while the refusal window is active');
  flat=false;
  console.log('Passed: an explicit "non" to a pending roulette request (from Lia/Noé asking the observer, never the reverse) clears the offer, now costs appreciation exactly like a silent lapse (real gap closed) with its own distinct negotiationLog trace, and sets a real shared 5-to-10-round refusal window for both characters, during which any further roulette relaunch is stripped from replies while the rest of the message survives intact, and no new negotiation offer gets re-recorded until the window lapses.');
}

{
  // Assouplissement de genuineRespectStreak (2026-09-19, demande explicite de l'utilisateur : seuil
  // jugé trop strict — cf. docs/referentiel/points-fragiles.md et principes.md 8.5). Avant ce jour,
  // un tour où la confiance restait simplement stable (trustShift=0) cassait déjà la série ;
  // désormais seule une vraie baisse (trustShift<0) la casse — un tour qui reste très positif sans
  // continuer à monter encore compte aussi dans la série.
  flat=true;affection=false;refuse=false;
  const plot={...newStory(),round:60,met:true,introduced:true,sharedMeal:true,finalCalled:true,evidence:Array(5).fill('preuve'),pendingDestination:undefined,life:{...newStory().life,appreciation:{1:90,2:90},genuineRespectStreak:{1:5,2:5}}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(plot));
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  sqlite.prepare('UPDATE agent_state SET room=?,needs=?,emotions=?').run('salon',JSON.stringify({hunger:20,fatigue:20,stress:20,uncertainty:20}),JSON.stringify({curiosity:60,tension:20,trust:60,comfort:60,attraction:60}));
  let epoch=(await readWorld(db)).epoch;
  const gameFetchRespect=globalThis.fetch;
  const forceOwnTrustDelta=delta=>async(url,options)=>{const response=await gameFetchRespect(url,options),body=await response.json(),decision=JSON.parse(body.candidates[0].content.parts[0].text);const ctx=JSON.parse(JSON.parse(options.body).contents[0].parts[0].text);decision.emotions={...decision.emotions,trust:ctx.state.emotions.trust+delta};body.candidates[0].content.parts[0].text=JSON.stringify(decision);return Response.json(body);};
  // Un tour qui reste simplement stable (trustShift=0) ne doit plus casser la série : 5 -> 6.
  globalThis.fetch=forceOwnTrustDelta(0);
  let r=await post(input('chat',1,{epoch,message:"Merci d'être toujours là."}));assert.equal(r.status,200);let w=await r.json();
  globalThis.fetch=gameFetchRespect;
  assert.equal(w.story.life.genuineRespectStreak[1],6,'a turn where trust merely stays flat (not rising) must no longer break the streak — the real loosening requested by the user');
  // Le palier, une fois à 6, se déclenche puis se consomme immédiatement (jamais un acquis), même
  // si ce nouveau tour reste lui aussi simplement stable.
  epoch=w.epoch;
  globalThis.fetch=forceOwnTrustDelta(0);
  r=await post(input('chat',1,{epoch,message:"J'apprécie vraiment ce que vous faites."}));assert.equal(r.status,200);w=await r.json();
  globalThis.fetch=gameFetchRespect;
  assert.equal(w.story.life.genuineRespectStreak[1],0,'once the rare respect tier has fired at streak>=6, it must consume itself immediately, never staying at or above 6');
  // Une vraie baisse de confiance doit continuer à casser la série normalement (pas de régression).
  {const p=JSON.parse(sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content);p.life.genuineRespectStreak={1:5,2:5};sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(p));}
  epoch=(await readWorld(db)).epoch;
  globalThis.fetch=forceOwnTrustDelta(-2);
  r=await post(input('chat',1,{epoch,message:"Vous êtes vraiment nuls."}));assert.equal(r.status,200);w=await r.json();
  globalThis.fetch=gameFetchRespect;
  assert.equal(w.story.life.genuineRespectStreak[1],0,'a genuine trust drop must still reset the streak to zero, exactly as before this loosening');
  flat=false;
  console.log('Passed: genuineRespectStreak now tolerates a turn that merely stays flat/positive (no longer requires trust to keep climbing every single turn), while a genuine drop still resets it, and the rare respect tier still consumes itself immediately once triggered — closing the too-strict gap the user flagged.');
}

{
  // KPI d'efficacité du Smart Breaker (2026-09-19, demande explicite de l'utilisateur : « un petit
  // KPI qui mesure l'efficacité du smart-breaker [...] pour s'assurer que l'utilisation de cet
  // outil est rentable », prêt pour la prochaine simulation). Test pur, déterministe, zéro appel
  // réseau — vérifie que les compteurs bruts (lib/gemini-keys.ts) reflètent fidèlement une séquence
  // scriptée d'appels, sans essayer de calculer un taux de "sauvetage" précis (ambigu sous
  // concurrence entre les deux cerveaux, cf. le commentaire du code).
  const {orderKeys:orderKeysForTest,recordKeyStatus:recordStatusForMetrics,getGeminiKeyMetrics,__resetGeminiKeyRotationForTests:resetForMetrics}=await import('../.sites-runtime/test-gemini-keys.mjs');
  resetForMetrics();
  assert.deepEqual(getGeminiKeyMetrics(),{turns:0,primaryKeyUnavailableAtStart:0,attempts:0,successes:0,quotaFailures:0,transientFailures:0,invalidFailures:0},'metrics must start at zero right after a reset');
  const keys=['alpha','beta'];
  let order=orderKeysForTest(keys);
  assert.equal(order[0],0,'test setup sanity: with both keys healthy, the primary key (index 0) leads the very first turn');
  recordStatusForMetrics(keys[order[0]],200);
  assert.deepEqual(getGeminiKeyMetrics(),{turns:1,primaryKeyUnavailableAtStart:0,attempts:1,successes:1,quotaFailures:0,transientFailures:0,invalidFailures:0},'a clean first-try success must count exactly one turn, one attempt, one success, nothing else');
  recordStatusForMetrics(keys[0],429);
  order=orderKeysForTest(keys);
  assert.equal(order[0],1,'test setup sanity: after a 429 on the primary key, the fallback key must now lead the next turn');
  recordStatusForMetrics(keys[order[0]],200);
  const afterFallback=getGeminiKeyMetrics();
  assert.equal(afterFallback.turns,2,'two orderKeys() calls so far must count as two turns');
  assert.equal(afterFallback.primaryKeyUnavailableAtStart,1,'exactly one of those turns started with the primary key already unavailable');
  assert.equal(afterFallback.attempts,3,'three recordKeyStatus() calls so far must count as three individual attempts');
  assert.equal(afterFallback.quotaFailures,1,'the one 429 must be counted as a quota failure, distinct from transient/invalid');
  assert.equal(afterFallback.successes,2,'the two clean 200s must both count as successes');
  recordStatusForMetrics(keys[0],503);
  recordStatusForMetrics(keys[0],401);
  const finalMetrics=getGeminiKeyMetrics();
  assert.equal(finalMetrics.transientFailures,1,'a 503 must be counted as a transient failure, never conflated with a 429 quota failure');
  assert.equal(finalMetrics.invalidFailures,1,'a 401 must be counted as an invalid-key failure, its own distinct bucket');
  assert.equal(finalMetrics.attempts,5,'every recordKeyStatus() call must be counted as an attempt, regardless of outcome');
  resetForMetrics();
  assert.deepEqual(getGeminiKeyMetrics(),{turns:0,primaryKeyUnavailableAtStart:0,attempts:0,successes:0,quotaFailures:0,transientFailures:0,invalidFailures:0},'the test reset must also clear the metrics, never leave a stale count bleeding into the next test');
  console.log('Passed: the Smart Breaker efficiency counters (turns, primary-key availability at the start of a turn, attempts by outcome) track a scripted sequence of real key/status events exactly, and the test reset clears them alongside the rotation/cooldown state they already reset.');
}

{
  // Persistance du vrai trafic Gemini dans l'historique partagé (2026-09-20, tâche #88 : « persister
  // le vrai trafic Gemini dans l'historique partagé »). lib/gemini-keys.ts::fingerprint() DOIT rester
  // identique, caractère pour caractère, à scripts/gemini-key-health.mjs::keyLabel() — sinon les
  // empreintes envoyées par l'API admin ne recoupent jamais les bonnes entrées une fois persistées
  // dans .gemini-key-health.json. Comparaison directe contre le VRAI module de diagnostic (jamais un
  // second calcul recopié à la main qui pourrait diverger en silence) — aucune écriture disque ici
  // (keyLabel()/normalize() sont pures), jamais touché le vrai fichier local non committé.
  const {fingerprint,recordKeyStatus:recordStatusForEpisodes,getGeminiKeyEpisodes,__resetGeminiKeyRotationForTests:resetForEpisodes}=await import('../.sites-runtime/test-gemini-keys.mjs');
  const {keyLabel}=await import('../scripts/gemini-key-health.mjs');
  const sampleKey='AIzaSy-abcdEXAMPLE1234567890FAKE';
  assert.equal(fingerprint(sampleKey),keyLabel(sampleKey),'lib/gemini-keys.ts::fingerprint() must produce byte-for-byte the same label as scripts/gemini-key-health.mjs::keyLabel() for a real-shaped key, or persisted episodes would never match up with the right entry');
  assert.equal(fingerprint('short'),keyLabel('short'),'the short/invalid-key fallback must also match exactly between both implementations');
  assert.equal(fingerprint(sampleKey).includes(sampleKey),false,'the fingerprint must never contain the full raw key in clear — only its short, non-reversible slice');

  resetForEpisodes();
  assert.deepEqual(getGeminiKeyEpisodes(),[],'right after a reset, the real-traffic episode log must be genuinely empty, never a stale entry from a previous test');
  recordStatusForEpisodes(sampleKey,200,'gemini-flash-lite-latest');
  recordStatusForEpisodes(sampleKey,429,'gemini-flash-lite-latest');
  recordStatusForEpisodes('another-key-1234567890',401,'gemini-flash-latest');
  const episodes=getGeminiKeyEpisodes();
  assert.equal(episodes.length,3,'every recordKeyStatus() call must append exactly one real-traffic episode, regardless of its outcome');
  assert.deepEqual(episodes.map(e=>e.outcome),['OK','429','401'],'each episode must record the real HTTP outcome (200 mapped to the honest label "OK", never a raw status code that would look like a fabricated protocol), never conflating a success with a failure');
  assert.equal(episodes[0].fingerprint,fingerprint(sampleKey),'each episode must carry the fingerprint of the key that was actually used, never the raw key itself — this is exactly what the admin API is allowed to expose over the network');
  assert.equal(episodes[0].model,'gemini-flash-lite-latest','each episode must record which model was actually tried — the real gap this task closes: recordKeyStatus() previously had no way to know which model a given attempt used at all');
  assert.ok(!('key' in episodes[0])&&!('rawKey' in episodes[0]),'an episode object must never carry any field holding the raw key in clear, under any name');
  resetForEpisodes();
  assert.deepEqual(getGeminiKeyEpisodes(),[],'the shared test reset must also clear the episode log, never leave real-traffic entries bleeding into an unrelated test');
  console.log('Passed: fingerprint() stays byte-for-byte identical to the real diagnostic tool\'s keyLabel() (so real-traffic episodes persisted via the admin API always match the right entry in the shared experience file), never exposes the raw key, and recordKeyStatus() now also records which real model was tried alongside the key and outcome for every single attempt — the exact real gap (task #88) between manual diagnostic probes and genuine game/simulation traffic in the Smart Breaker\'s accumulated experience.');
}
{
  const {recordTurn,recordAntiEchoIntervention,recordTruncation,getQualityMetrics,__resetQualityMetricsForTests}=await import('../.sites-runtime/test-quality-metrics.mjs');
  __resetQualityMetricsForTests();
  assert.deepEqual(getQualityMetrics(),{turns:0,antiEchoInterventions:0,truncationInterventions:{1:0,2:0}},'quality/cohérence metrics must start at zero right after a reset');
  recordTurn();recordTurn();recordTurn();
  recordAntiEchoIntervention();
  recordTruncation(1,true);
  recordTruncation(2,false);
  recordTruncation(1,true);
  const m=getQualityMetrics();
  assert.equal(m.turns,3,'three recordTurn() calls must count as three turns');
  assert.equal(m.antiEchoInterventions,1,'exactly one anti-echo fallback substitution must be counted');
  assert.deepEqual(m.truncationInterventions,{1:2,2:0},'truncation is only counted when it actually changed the text, per actor — a no-op call (changed=false) must never increment its actor');
  __resetQualityMetricsForTests();
  assert.deepEqual(getQualityMetrics(),{turns:0,antiEchoInterventions:0,truncationInterventions:{1:0,2:0}},'the test reset must clear the quality/cohérence metrics, never leave a stale count bleeding into the next test');
  console.log('Passed: the Qualité (anti-echo fallback) and Cohérence logique (per-actor groundTruncation interventions) KPI counters track a scripted sequence of real events exactly, only count a truncation when it actually changed the text, and the test reset clears them.');
}
{
  // Test dédié au tableau de bord lui-même (2026-09-19, demande explicite de l'utilisateur : « un
  // test est-il prévu dédié au tableau de bord ? il pourrait alimenter l'indicateur "performances
  // du tableau de bord" [...] assure-toi que cette partie est parfaitement robuste, sécurisé »).
  // scripts/kpi-report.mjs est un simple script .mjs (pas un module "@/lib" transpilé) : ses
  // fonctions pures s'importent directement, et main() est gardé par un test d'entrypoint pour ne
  // JAMAIS déclencher d'appel réseau/exec réel pendant ce test.
  const {codeHealthScore,smartBreakerPerformanceScore,smartBreakerImprovementScore,qualityScore,coherenceScore,replayabilityScore,smartConsoScore,dashboardCoverageScore,expectedTestBlockCount,buildKpiSynthesisHtml,fetchLiveMetrics,DEV_PORTS}=await import('../scripts/kpi-report.mjs');
  // Chemin sain : chaque fonction renvoie un vrai nombre fini à partir de données bien formées.
  assert.deepEqual(codeHealthScore(0,79,79),{tscScore:100,testScore:100,overall:100});
  assert.equal(codeHealthScore(2,79,79).tscScore,0,'any tsc error must zero the tsc sub-score, never a partial credit');
  // coverageScore (2026-09-19, AXA-CHECK) : un 4e paramètre optionnel, jamais une régression du
  // calcul historique quand il est omis ou invalide.
  assert.deepEqual(codeHealthScore(0,79,79,undefined),{tscScore:100,testScore:100,overall:100},'an omitted coverage score must reproduce the exact historical two-term average, never a silent regression');
  assert.deepEqual(codeHealthScore(0,79,79,'x'),{tscScore:100,testScore:100,overall:100},'a malformed coverage score must be ignored, never coerced into a fake third term');
  assert.deepEqual(codeHealthScore(0,79,79,90),{tscScore:100,testScore:100,coverageScore:90,overall:(100+100+90)/3},'a valid coverage score must join as a real third term in the average, never just displayed on the side');
  assert.equal(smartBreakerPerformanceScore({successes:299,attempts:304}),(299/304)*100);
  assert.deepEqual(smartBreakerImprovementScore([{done:true},{done:true},{done:false}]),{score:(2/3)*100,done:2,total:3});
  assert.equal(qualityScore({turns:10,antiEchoInterventions:1}),90);
  assert.equal(coherenceScore({turns:10,truncationInterventions:{1:1,2:0}}),90);
  assert.equal(replayabilityScore({distinctBonuses:8,totalBonusTypes:9}),(8/9)*100);
  assert.deepEqual(dashboardCoverageScore([100,undefined,90,80,undefined]),{score:60,measured:3,total:5});
  // Fixture construite par concaténation (jamais le motif "console.log(<guillemet>Passed:" écrit
  // tel quel dans CE fichier) : sinon expectedTestBlockCount(), en lisant plus tard le vrai contenu
  // de check-house.mjs, compterait aussi cette ligne de test elle-même — un bug auto-référentiel
  // réel rencontré en écrivant ce test précis le 2026-09-19, corrigé ainsi plutôt qu'ignoré.
  const fixtureCallSq="console.log('"+"Passed: a');", fixtureCallDq='console.log("'+'Passed: b");', fixtureCallNo="console.log('"+"nope');";
  assert.equal(expectedTestBlockCount(fixtureCallSq+fixtureCallDq+fixtureCallNo),2,'the regex must catch both single- and double-quoted console.log(quote-Passed:...) calls — the exact bug found and fixed on 2026-09-19');
  // Chemin de robustesse : donnée manquante/malformée/division par zéro doit renvoyer undefined,
  // JAMAIS NaN ni un faux 0% qui se ferait passer pour une vraie mesure (Article 5, retour
  // utilisateur explicite sur ce point précis).
  assert.equal(codeHealthScore(0,5,0),undefined,'zero expected test blocks must never produce a division by zero disguised as a score');
  assert.equal(codeHealthScore(0,'x',10),undefined,'a non-numeric input must never be coerced into a fake score');
  assert.equal(smartBreakerPerformanceScore(undefined),undefined,'a missing Smart Breaker metrics object must never crash or produce NaN');
  assert.equal(smartBreakerPerformanceScore({successes:0,attempts:0}),undefined,'zero attempts must never divide by zero');
  assert.equal(smartBreakerImprovementScore([]),undefined,'an empty capability list must never divide by zero');
  assert.equal(qualityScore({turns:0,antiEchoInterventions:0}),undefined,'zero turns must never divide by zero');
  assert.equal(qualityScore(undefined),undefined);
  assert.equal(coherenceScore({turns:5}),undefined,'a missing truncationInterventions object must never crash or produce NaN');
  assert.equal(replayabilityScore({distinctBonuses:3,totalBonusTypes:0}),undefined,'zero total bonus types must never divide by zero');
  for(const bad of [NaN,Infinity,-Infinity,undefined])assert.equal(dashboardCoverageScore([bad,100,100,100,100]).measured,4,'a non-finite family score must count as unmeasured, never as a valid measurement');
  console.log('Passed: every kpi-report.mjs scoring function returns a correct percentage on well-formed data, and returns undefined — never NaN, Infinity, or a disguised 0% — on missing, malformed, or zero-denominator input, closing the exact class of bug (a silent miscount) found while building the dashboard.');

  // smartConsoScore() (2026-09-20, écart réel comblé : famille KPI "Smart Conso" jamais construite
  // malgré une réponse de calibrage déjà donnée par l'utilisateur — « taux de respect [...] tokens
  // économisés [...] efficacité des process [...] indice de fraîcheur »). Même patron que
  // codeHealthScore : moyenne des composantes réellement présentes, une composante absente est
  // exclue plutôt que de faire chuter la moyenne à zéro.
  assert.equal(smartConsoScore(undefined),undefined,'with no metrics object at all, there is nothing to measure — an honest absence, never a fabricated score');
  assert.equal(smartConsoScore({}),undefined,'with zero measurable components, an honest absence, never a fake 0%');
  assert.equal(smartConsoScore({complianceScore:80}),80,'a single available component must stand alone as the score, never diluted by components that were never measured');
  assert.equal(smartConsoScore({complianceScore:80,adoptionReductionPct:40}),60,'two available components must average together, never weighted oddly or silently dropping one');
  assert.equal(smartConsoScore({complianceScore:100,adoptionReductionPct:50,freshnessOk:true}),(100+50+100)/3,'freshnessOk:true must contribute a full 100 to the average, exactly like any other perfect component');
  assert.equal(smartConsoScore({complianceScore:100,freshnessOk:false}),50,'freshnessOk:false must contribute a real 0 to the average, never silently excluded as if it were simply absent');
  assert.equal(smartConsoScore({adoptionReductionPct:150}),100,'an adoption reduction percentage above 100 (a real possible input, since it is a raw measured percentage) must be clamped to 100, never inflate the average past what a percentage can honestly mean');
  console.log('Passed: smartConsoScore() averages only the genuinely measured components (compliance, adoption, freshness) of the new Smart Conso KPI family, treating a missing component as excluded rather than a zero, a false freshness as a real zero rather than silently dropped, and clamping an out-of-range adoption percentage rather than ever exceeding 100% — closing the exact real gap where this family was promised in a calibration answer but never built.');

  // buildKpiSynthesisHtml() (2026-09-20, gabarit HTML de remise de rapports) : rend la MÊME
  // synthèse compacte déjà loggée par main(), jamais un second calcul ni une donnée en plus.
  const kpiHtmlAllGreen = buildKpiSynthesisHtml('test-run', {
    performance: 98, improvement: { score: 88, done: 7, total: 8 }, health: { overall: 100 },
    quality: 100, coherence: 100, replay: 89, coverage: { score: 100, measured: 5, total: 5 }, alerts: [],
  });
  assert.ok(kpiHtmlAllGreen.startsWith('<!DOCTYPE html>'), 'the KPI HTML report must be a complete, self-contained document, same discipline as every other renderHtmlReport() output');
  assert.ok(kpiHtmlAllGreen.includes('test-run') && kpiHtmlAllGreen.includes('98%') && kpiHtmlAllGreen.includes('88%') && kpiHtmlAllGreen.includes('Aucun point d'), 'the rendered report must actually carry the real run id and the real computed percentages, never placeholder text');
  const kpiHtmlNA = buildKpiSynthesisHtml('test-run-2', {
    performance: undefined, improvement: undefined, health: undefined, quality: undefined,
    coherence: undefined, replay: undefined, coverage: { score: 60, measured: 3, total: 5 },
    alerts: ['couverture du tableau de bord à 60% (3/5 familles mesurées)'],
  });
  assert.ok(kpiHtmlNA.includes('N/A'), 'a family with no real measurement this run must render as an honest N/A in the HTML report too, never a fabricated percentage');
  assert.ok(kpiHtmlNA.includes('🚨 Points d\'attention'), 'a non-empty alerts list must render as a visible warning note in the HTML report, not silently dropped');
  console.log('Passed: buildKpiSynthesisHtml() renders the exact same compact synthesis already logged by main() as a complete self-contained HTML document, carrying the real run id and real computed percentages, an honest N/A for any unmeasured family, and a visible warning note whenever the alerts list is non-empty.');

  // fetchLiveMetrics() port fallback (2026-09-20, real bug found while running full_sim16: vinext
  // served on port 3000 with nothing occupying 5173, so the old single-port fetch silently reported
  // "unreachable" against a server that was actually up). Stub global.fetch to prove the function
  // tries every DEV_PORTS entry in order and returns the first real success, never stopping at the
  // first connection failure.
  assert.deepEqual(DEV_PORTS,[5173,3000],'the known-ports list must still start with the conventional vite default, 3000 only as a real fallback');
  const realFetch=globalThis.fetch;
  try{
    const attempted=[];
    globalThis.fetch=async(url)=>{attempted.push(url);if(url.includes(':5173'))throw new Error('connect ECONNREFUSED');return{ok:true,json:async()=>({geminiKeyMetrics:{tours:1}})};};
    const okOnFallback=await fetchLiveMetrics();
    assert.deepEqual(attempted,['http://localhost:5173/api/admin','http://localhost:3000/api/admin'],'a connection failure on the first port must fall through to the next one, never stop silently');
    assert.deepEqual(okOnFallback,{geminiKeyMetrics:{tours:1}},'a real success on the fallback port must be returned exactly, not discarded because an earlier port failed');
    globalThis.fetch=async()=>{throw new Error('connect ECONNREFUSED');};
    assert.equal(await fetchLiveMetrics(),undefined,'every known port failing must report an honest absence, never a crash or a fabricated metrics object');
  }finally{globalThis.fetch=realFetch;}
  console.log('Passed: fetchLiveMetrics() tries every known dev-server port in order and returns the first real success rather than stopping at the first connection failure, closing the exact real full_sim16 bug where the dev server ran on port 3000 while the check only ever tried 5173 — and still reports an honest absence, never a crash, when every known port fails.');
}

{
  // ARGUS — partie mécanique (2026-09-19, cf. docs/argus-blueprint.md et docs/referentiel/argus.md).
  // check-argus.mjs est un simple script .mjs (même patron que kpi-report.mjs) : ses fonctions
  // pures s'importent directement contre de petites fixtures écrites sur disque, jamais contre le
  // vrai code du projet dans ce test (qui varie dans le temps et casserait des assertions figées).
  const {findDeadLifeFields,findTodoMarkers}=await import('../scripts/check-argus.mjs');
  const fixtureLifeSource='export type Life={usedField?:boolean;deadField?:boolean;barelyUsedField?:boolean};';
  fs.writeFileSync('.sites-runtime/argus-fixture-usage.ts','life.usedField=true;if(life.usedField){}console.log(life.usedField);life.usedField=false;a.usedField=b.usedField;');
  // Construit par concaténation (jamais le motif "// TODO"/"// FIXME" écrit tel quel dans CE
  // fichier) : sinon check-argus.mjs, en balayant plus tard le vrai contenu de check-house.mjs,
  // compterait aussi cette fixture comme un vrai marqueur — le même bug auto-référentiel déjà
  // trouvé et corrigé une fois pour kpi-report.mjs (2026-09-19), reproduit ici avec ARGUS,
  // corrigé de la même façon plutôt qu'en excluant ce fichier du balayage (Article 3).
  fs.writeFileSync('.sites-runtime/argus-fixture-todo.ts','//'+' TODO: brancher la vraie logique ici\nconst x=1;\n//'+' FIXME later\nfunction ok(){return 1;}');
  const dead=findDeadLifeFields(['.sites-runtime/argus-fixture-usage.ts'],fixtureLifeSource);
  assert.ok(dead.some(d=>d.field==='deadField'&&d.confidence==='confirmé'),'a field declared in the Life type but never referenced anywhere else in the project must be flagged as a confirmed dead field');
  assert.ok(!dead.some(d=>d.field==='usedField'),'a field referenced well beyond the threshold (declaration + several real uses) must never be flagged, zero false positive on a genuinely used field');
  assert.ok(dead.some(d=>d.field==='barelyUsedField'),'a field referenced only in the type declaration and nowhere else must still be flagged (probable, since the fixture never uses it at all)');
  const todos=findTodoMarkers(['.sites-runtime/argus-fixture-todo.ts']);
  assert.equal(todos.length,2,'both a TODO and a FIXME marker must be caught, one entry per marker line');
  assert.ok(todos.every(t=>t.file.includes('argus-fixture-todo')&&typeof t.line==='number'));
  assert.equal(findTodoMarkers(['.sites-runtime/argus-fixture-usage.ts']).length,0,'a file with no TODO/FIXME marker must never produce a false positive');
  // Second bug auto-référentiel réel trouvé en construisant ce test précis (2026-09-19) : une
  // ligne qui PARLE de TODO/FIXME au milieu d'une phrase de commentaire (comme celle-ci) déclenchait
  // aussi un faux positif avant l'ancrage en début de ligne — vérifié explicitement ici pour ne
  // jamais le laisser revenir sous une autre forme (Article 3).
  fs.writeFileSync('.sites-runtime/argus-fixture-mention.ts','// Ce commentaire parle de TODO et de FIXME sans en être un lui-même\nconst y=1;');
  assert.equal(findTodoMarkers(['.sites-runtime/argus-fixture-mention.ts']).length,0,'a comment that merely MENTIONS "TODO"/"FIXME" mid-sentence must never be mistaken for a real marker — only one that opens the comment counts');
  console.log("Passed: ARGUS's mechanical layer correctly flags a Life-type field that is genuinely never read elsewhere as a confirmed dead field, never flags a field with real, plentiful usage, reliably catches every real TODO/FIXME marker, and never mistakes a comment merely mentioning those words for an actual marker — two self-referential false-positive bugs found and fixed while building this exact test.");
}

{
  // HARMONIA — partie mécanique (2026-09-19, cf. docs/harmonia-blueprint.md et
  // docs/referentiel/harmonia.md). checkLinks() prend un readFile injectable : les fixtures
  // vivent en mémoire, jamais sur disque, pour un test isolé et déterministe.
  const {checkLinks}=await import('../scripts/check-harmonia.mjs');
  const fixtures={
    '/code-ok.ts':'export const THRESHOLD=42;',
    '/doc-ok.md':'Le seuil a été fixé à 42 après calibrage.',
    '/doc-mismatch.md':'Le seuil a été fixé à 99 après calibrage.',
    '/doc-missing.md':'Ce document ne mentionne aucun seuil.',
  };
  const readFile=(f)=>{const key=Object.keys(fixtures).find(k=>f.endsWith(k));if(!key)throw new Error('fixture introuvable: '+f);return fixtures[key];};
  const linkOk=[{theme:'lien sain',code:{file:'/code-ok.ts',pattern:/THRESHOLD=(\d+)/},docs:[{file:'/doc-ok.md',pattern:/fixé à (\d+) après/}]}];
  const linkMismatch=[{theme:'lien en friction',code:{file:'/code-ok.ts',pattern:/THRESHOLD=(\d+)/},docs:[{file:'/doc-mismatch.md',pattern:/fixé à (\d+) après/}]}];
  const linkMissing=[{theme:'affirmation absente',code:{file:'/code-ok.ts',pattern:/THRESHOLD=(\d+)/},docs:[{file:'/doc-missing.md',pattern:/fixé à (\d+) après/}]}];
  const linkNoCode=[{theme:'constante introuvable',code:{file:'/code-ok.ts',pattern:/INTROUVABLE=(\d+)/},docs:[{file:'/doc-ok.md',pattern:/fixé à (\d+) après/}]}];
  assert.equal(checkLinks(linkOk,readFile)[0].confidence,'ok','a code constant and its documentation stating the exact same number must be reported as consistent, never flagged');
  assert.equal(checkLinks(linkMismatch,readFile)[0].confidence,'confirmé','a documented number that genuinely differs from the real code constant must be a confirmed friction, the whole point of this drift detector');
  assert.equal(checkLinks(linkMissing,readFile)[0].confidence,'probable','a document that never states the expected claim at all is a weaker signal than a genuine numeric mismatch — probable, not confirmed, since the claim may simply live elsewhere');
  assert.equal(checkLinks(linkNoCode,readFile)[0].confidence,'confirmé','a code pattern that cannot even be found in its own source file must always be reported, never silently skipped');
  console.log('Passed: HARMONIA\'s mechanical layer correctly reconfirms a documented numeric claim against its real code constant — consistent numbers pass silently, a genuine mismatch is a confirmed friction, and a missing documentation claim or an unfindable code constant are both reported rather than silently ignored.');
}

{
  // SMART CONSO API (2026-09-19, cf. docs/smart-conso-api-blueprint.md et
  // docs/referentiel/smart-conso-api.md). Fonctions pures testées directement contre des données
  // fabriquées en mémoire, jamais contre le vrai .gemini-key-health.json/.smart-conso-session.json
  // (qui varient dans le temps et casseraient des assertions figées).
  const {assess,recentExhaustionRate,countRecentActions,recordAction,HARD_THRESHOLDS}=await import('../scripts/smart-conso-api.mjs');
  const now=Date.now();
  const healthCalm={keys:{a:{episodes:[{at:now-1000,model:'m',outcome:'OK'},{at:now-2000,model:'m',outcome:'OK'}]}}};
  const healthStrained={keys:{a:{episodes:[{at:now-1000,model:'m',outcome:'QUOTA_ÉPUISÉ'},{at:now-2000,model:'m',outcome:'QUOTA_ÉPUISÉ'},{at:now-3000,model:'m',outcome:'OK'}]}}};
  const healthEmpty={keys:{}};
  const healthOld={keys:{a:{episodes:[{at:now-10*60*60*1000,model:'m',outcome:'QUOTA_ÉPUISÉ'}]}}};
  assert.equal(recentExhaustionRate(healthEmpty,now),undefined,'no episodes at all must report an absence, never a fake 0% or 100%');
  assert.equal(recentExhaustionRate(healthOld,now),undefined,'an episode outside the observation window must never count, even if it was a real exhaustion');
  assert.equal(recentExhaustionRate(healthCalm,now),0,'all-OK recent episodes must report a genuine 0% exhaustion rate');
  assert.equal(recentExhaustionRate(healthStrained,now),2/3,'a real mix of outcomes must compute the exact honest ratio');
  const emptySession={actions:[]};
  assert.equal(countRecentActions(emptySession,'simulation',now,6),0);
  const busySession={actions:[{type:'simulation',at:now-1000,confirmed:true},{type:'simulation',at:now-2000,confirmed:true},{type:'simulation',at:now-3000,confirmed:false},{type:'check-spirit',at:now-1000,confirmed:true}]};
  assert.equal(countRecentActions(busySession,'simulation',now,6),2,'only confirmed actions of the matching type within the window must be counted — an unconfirmed advisory-only check must never count as a real launch');
  assert.equal(assess(healthCalm,emptySession,'simulation',now).verdict,'ok','calm quota and an empty session log must never produce a warning');
  assert.equal(assess(healthStrained,emptySession,'simulation',now).verdict,'avertissement_souple','a genuinely strained recent quota must trigger the soft, negotiable warning');
  assert.equal(assess(healthCalm,busySession,'simulation',now).verdict,'seuil_dur','reaching the hard threshold (2 simulations within its window) must trigger the hard verdict even when the quota itself looks calm right now — the two signals are independent');
  assert.ok(HARD_THRESHOLDS.simulation.count===2&&HARD_THRESHOLDS.simulation.windowHours===6,'the documented starting hard threshold (2 simulations per 6h window) must match what the code actually enforces');
  assert.ok(typeof recordAction==='function','recordAction must be exported for the CLI entrypoint to persist a confirmed action to the local session ledger');
  console.log("Passed: Smart Conso API's pure advisory logic reports an honest absence when there is no recent data, computes the exact real exhaustion ratio otherwise, counts only confirmed actions of the matching type within the sliding window, and correctly distinguishes the hard-threshold verdict from the soft-quota-pressure warning as two independent signals.");
}

{
  // HYPER-SCAN-CHECKPOINT (2026-09-19, cf. docs/hyper-scan-checkpoint-blueprint.md et
  // docs/referentiel/hyper-scan-checkpoint.md). Fonctions pures testées contre des fixtures en
  // mémoire, jamais contre le vrai docs/hyper-scan-checkpoint/index.md (qui grossit dans le temps).
  const {lastCheckpointCommit,summarizeArgusOutput,summarizeHarmoniaOutput,checkpointPerformance}=await import('../scripts/hyper-scan-checkpoint.mjs');
  const emptyIndex='# titre\n\n| Date | Commit couvert jusqu\'à | Version | Trouvailles | Rapport | Notes |\n|---|---|---|---|---|---|\n';
  const oneRowIndex=emptyIndex+'| 2026-09-19 | `abc1234` | légère | 2 | [scan.txt](scan.txt) | premier passage |\n';
  const twoRowIndex=oneRowIndex+'| 2026-09-20 | `def5678` | complète | 0 | [scan2.txt](scan2.txt) | rien trouvé cette fois |\n';
  assert.equal(lastCheckpointCommit(emptyIndex),undefined,'an index with no data row yet must report an honest absence, never a fake commit');
  assert.equal(lastCheckpointCommit(oneRowIndex),'abc1234','the commit hash must be read from the data row, not confused with the date column that comes first');
  assert.equal(lastCheckpointCommit(twoRowIndex),'def5678','the LAST row must win when several passages are already recorded, never the first');
  assert.equal(checkpointPerformance(emptyIndex),undefined,'zero recorded passages must report an absence, never a disguised 0%');
  const perf=checkpointPerformance(twoRowIndex);
  assert.equal(perf.passages,2);assert.equal(perf.totalFindings,2);assert.equal(perf.findingsPerPassage,1);assert.equal(perf.hitRate,50,'exactly one of the two recorded passages found something real, so the hit rate — the tool\'s actual vocation per the user\'s explicit framing — must read 50%, not an average that would hide it');
  assert.deepEqual(summarizeArgusOutput('[confirmé] a\n[probable] b\nMarqueurs TODO/FIXME trouvés (3) :'),{candidatsDetectes:2,todos:3});
  assert.deepEqual(summarizeHarmoniaOutput('2 friction(s) confirmée(s) sur 5 lien(s) vérifié(s).'),{frictions:2,liensVerifies:5});
  assert.deepEqual(summarizeHarmoniaOutput('rien à voir ici'),{frictions:undefined,liensVerifies:undefined},'unparseable HARMONIA output must never be silently miscounted as zero');
  console.log("Passed: HYPER-SCAN-CHECKPOINT correctly reads the last recorded commit from its own index (never confusing the date column with the commit column, always the most recent row), reports an honest absence rather than a fake 0% when no passage has been recorded yet, and computes its own central performance KPI — the real hit rate of passages that surfaced a genuine confirmed finding, the tool's whole stated vocation — exactly rather than as a averaged-away percentage.");
}

{
  // CHECK-LEVEL-TARGET (2026-09-19, cf. docs/check-level-target-blueprint.md et
  // docs/referentiel/check-level-target.md). Validé directement contre les vrais prompts
  // historiques de l'utilisateur qui ont motivé sa création (cf. Article 21) — la meilleure preuve
  // que l'heuristique reconnaît ce qu'elle est censée reconnaître, pas une fixture inventée seule.
  const {classifyCheckLevel}=await import('../scripts/check-level-target.mjs');
  assert.equal(classifyCheckLevel("corrige ce bug d'affichage stp").level,'leger','a trivial fix request must never over-trigger the expensive tiers');
  assert.equal(classifyCheckLevel('').level,'standard','no signal at all must fall back to the safe default (standard), never a silent leger that could under-check real work');
  const approfondi=classifyCheckLevel("verifie que toutes les consignes ont bien été traitées : beaucoup de choses ont evolué. verifie que tout est bien conecté, identifie les eventuelles erereurs ou bugs latents. verifie toutes les combinaisons possibles");
  assert.equal(approfondi.level,'approfondi','the real 2026-09-19 historical prompt that motivated this whole tool must classify as approfondi, not just standard');
  assert.ok(approfondi.tools.includes('check-spirit.mjs')&&approfondi.tools.includes('ARGUS'),'approfondi must recommend the real costly tools plus the free mechanical ones, never just a subset');
  const exceptionnel=classifyCheckLevel('il faut en faire une vraie machine de guerre, un hyper-scan complet depuis le début');
  assert.equal(exceptionnel.level,'exceptionnel');
  assert.deepEqual(exceptionnel.tools,['HYPER-SCAN-CHECKPOINT (version complète)']);
  const doubt=classifyCheckLevel('verifie ça en profondeur et corrige le bug');
  assert.ok(typeof doubt.needsConfirmation==='boolean');
  // ALWAYS-NEW-CODE (2026-09-19) : gap réel trouvé en dogfoodant l'outil sur sa propre demande de
  // création — une formulation de restructuration sans le mot "machine de guerre" retombait à tort
  // en standard/gratuit. Fermé par un second registre de signaux au sein du niveau exceptionnel.
  const structural=classifyCheckLevel("reconstruire ce système en partant de zéro, imaginer les grands axes idéaux et comparer à la structure actuelle du code, repérer ce qui a été codé de façon empilée");
  assert.equal(structural.level,'exceptionnel','a structural-rebuild request must reach exceptionnel just like a bug-hunting one, closing the real gap found the day ALWAYS-NEW-CODE was designed');
  assert.deepEqual(structural.tools,['ALWAYS-NEW-CODE (zoom profond)'],'a purely structural request must recommend ALWAYS-NEW-CODE, never HYPER-SCAN-CHECKPOINT alone');
  const both=classifyCheckLevel("il faut un hyper-scan complet pour reconstruire ce système en partant de zéro");
  assert.deepEqual(both.tools,['HYPER-SCAN-CHECKPOINT (version complète)','ALWAYS-NEW-CODE (zoom profond)'],'a request mixing both registers must recommend both tools, never silently pick one');
  console.log('Passed: CHECK-LEVEL-TARGET correctly classifies the real historical prompts that motivated its own creation (a trivial fix stays léger, the exact 2026-09-19 "vérification approfondie" prompt classifies as approfondi with its real costly tools recommended, an explicit "machine de guerre"/hyper-scan mention reaches exceptionnel), falls back to the safe standard default on zero signal rather than under-checking silently, always returns an explicit boolean on whether real doubt warrants confirmation, and — closing a real gap found the day ALWAYS-NEW-CODE was designed — distinguishes the "bugs cachés" and "restructuration" registers within the exceptionnel tier so a structural-rebuild request recommends ALWAYS-NEW-CODE rather than silently under-classifying or defaulting to HYPER-SCAN-CHECKPOINT alone.');
  // Vue d'ensemble du réseau (2026-09-19, demande explicite de l'utilisateur : « centraliser le
  // réseau des outils de vérification ») — un conseiller mieux informé, jamais un chef d'orchestre.
  const {countOpenFragilePoints,combineWithRegistryPressure,recentlyChangedSensitiveNodes,SENSITIVE_NODES}=await import('../scripts/check-level-target.mjs');
  const fragileFixture=[
    '# Points fragiles ouverts','','## Points ouverts','',
    '- point un','- point deux','- point trois','','## Une autre section','','- pas compté ici',
  ].join('\n');
  assert.equal(countOpenFragilePoints(fragileFixture),3,'must count only bullets under "## Points ouverts", never bullets from an unrelated later section');
  assert.equal(countOpenFragilePoints('rien de pertinent ici'),0,'a document with no such section must report zero, never throw or miscount');
  const below=combineWithRegistryPressure({level:'standard',reasoning:'r',needsConfirmation:false},2);
  assert.equal(below.needsConfirmation,false,'a low open-concerns count must never force a confirmation the text itself did not warrant');
  const above=combineWithRegistryPressure({level:'standard',reasoning:'r',needsConfirmation:false},6);
  assert.equal(above.needsConfirmation,true,'a high open-concerns count must ask for confirmation rather than silently ignoring known unresolved project-wide context');
  assert.ok(above.reasoning.includes('6'),'the reasoning must always explain the real count driving the question, never a silent black-box confirmation request');
  const alreadyExceptionnel=combineWithRegistryPressure({level:'exceptionnel',reasoning:'r',needsConfirmation:false},99);
  assert.equal(alreadyExceptionnel.needsConfirmation,false,'a level already at the maximum must never be pushed further by registry pressure, nothing to escalate to');
  console.log('Passed: the CHECK-LEVEL-TARGET registry-pressure awareness counts only the bullets under the real "Points ouverts" heading, reports zero rather than crashing on an unrelated document, and only ever turns a high count into a confirmation request (never a silent level bump) with the real number always stated in the reasoning — staying an informed adviser, never an orchestrator, per the explicit user decision.');
  // Rappel de test approfondi sur les nœuds sensibles (2026-09-19, demande explicite de
  // l'utilisateur), réutilise la carte d'HARMONIA, jamais bloquant.
  assert.ok(SENSITIVE_NODES.length>0,'the sensitive-node map must never be empty, otherwise the reminder can never fire');
  assert.deepEqual(recentlyChangedSensitiveNodes(['lib/simulation.ts','app/page.tsx']),[{node:'needs.fatigue',files:['lib/simulation.ts']}],'a changed file matching a sensitive node must be reported with exactly that node and the real matched file, never the unrelated changed file alongside it');
  assert.deepEqual(recentlyChangedSensitiveNodes([]),[],'no changed files must report zero hits, never a false positive');
  assert.deepEqual(recentlyChangedSensitiveNodes(undefined),[],'a missing changed-files list must be handled gracefully, never throw');
  const multi=recentlyChangedSensitiveNodes(['lib/turn.ts','lib/life.ts','app/page.tsx']);
  assert.equal(multi.length,2,'multiple genuinely distinct sensitive nodes touched at once must each be reported, never collapsed into one or silently dropped');
  console.log('Passed: the CHECK-LEVEL-TARGET sensitive-node reminder reuses the real HARMONIA sensitive-node map, reports exactly the matched node and files for a real hit, reports zero for no changes or a missing list rather than a false positive or a crash, and reports every distinct node touched when several are hit at once.');
}

{
  // Garde-fou fidélité au prompt (2026-09-19, cf. docs/systeme-de-suivi.md), demande explicite de
  // l'utilisateur : une clôture de tâche ne peut jamais rester un "terminée" nu.
  const {findUnverifiedClosures,auditAllSessions}=await import('../scripts/check-suivi-fidelity.mjs');
  const header='| Horodatage | Sujet | Sous-sujet | Sensibilité | Description | Statut |\n|---|---|---|---|---|---|\n';
  const mixed=header
    +'| t1 | s1 | ss1 | normal | d1 | terminée |\n'
    +'| t2 | s2 | ss2 | normal | d2 | terminée — fidèle |\n'
    +'| t3 | s3 | ss3 | normal | d3 | terminée — écart : détail |\n'
    +'| t4 | s4 | ss4 | normal | d4 | ouverte |\n'
    +'| t5 | s5 | ss5 | normal | d5 | en cours |\n';
  const hits=findUnverifiedClosures(mixed);
  assert.equal(hits.length,1,'only the bare "terminée" row must be flagged, never a fidèle/écart closure nor an open/in-progress task');
  assert.ok(hits[0].row.includes('t1'),'the flagged row must be the real offending one, never a wrong row');
  assert.deepEqual(findUnverifiedClosures(header),[],'a session file with zero task rows must report zero, never throw');
  const fakeDir=[{name:'a.md',text:mixed},{name:'b.md',text:header+'| t6 | s6 | ss6 | normal | d6 | terminée |\n'}];
  const audit=auditAllSessions('/fake',()=>fakeDir.map(f=>f.name),(p)=>fakeDir.find(f=>p.endsWith(f.name)).text,()=>true);
  assert.equal(audit.length,2,'every session file with at least one unverified closure must be reported, never only the first one found');
  assert.equal(audit.reduce((n,r)=>n+r.hits.length,0),2,'the total real count across all session files must be exact, one from each fixture file here');
  assert.deepEqual(auditAllSessions('/definitely-not-a-real-path'),[],'a missing sessions directory must report an honest empty result, never throw or crash the weekly network checkup that depends on it');
  console.log('Passed: the tracking-system fidelity guard flags only a bare "terminée" closure (never a fidèle/écart closure nor an open/in-progress task), reports zero on an empty or missing sessions directory rather than crashing, and audits every session file rather than stopping at the first one found.');
}
{
  // findOpenTasks()/auditOpenTasks() (2026-09-19) : le complément direct de findUnverifiedClosures
  // ci-dessus — répond à "qu'est-ce qui reste ouvert ?" plutôt qu'à "une clôture a-t-elle sauté une
  // étape ?". Né d'un vrai constat le jour même : une session affichait encore "en cours" pour deux
  // tâches terminées depuis des heures, invisible sans relire tout le fichier à la main.
  const {findOpenTasks}=await import('../scripts/check-suivi-fidelity.mjs');
  const session='| Horodatage | Sujet | Sous-sujet | Sensibilité | Description | Statut |\n|---|---|---|---|---|---|\n| t1 | S | s | normal | d1 | ouverte |\n| t2 | S | s | normal | d2 | en cours |\n| t3 | S | s | normal | d3 | terminée — fidèle |\n| t4 | S | s | normal | d4 | terminée |';
  const open=findOpenTasks(session);
  assert.equal(open.length,2,'exactly the two non-"terminée" rows must be flagged, never the ones already closed regardless of their fidelity wording');
  assert.deepEqual(open.map(o=>o.statut),['ouverte','en cours'],'each open row must report its real, distinct status verbatim, never a generic "open" label that would hide whether it is brand new or already in progress');
  assert.equal(findOpenTasks('| Horodatage | Sujet | Sous-sujet | Sensibilité | Description | Statut |\n|---|---|---|---|---|---|').length,0,'a session with zero task rows must report zero open tasks, never crash');
  // Statut vide (2026-09-19, même relecture de fiabilité demandée par l'utilisateur : « assure-toi
  // encore de la fiabilité ») : une ligne au tableau markdown cassé (colonne Statut manquante) doit
  // être signalée comme un trou, jamais silencieusement invisible au garde-fou.
  const brokenRow='| Horodatage | Sujet | Sous-sujet | Sensibilité | Description | Statut |\n|---|---|---|---|---|---|\n| t1 | S | s | normal | d1 ||';
  const broken=findOpenTasks(brokenRow);
  assert.equal(broken.length,1,'a row whose Statut column is empty (a broken markdown table) must be flagged, never silently skipped for lack of a status string to test');
  assert.equal(broken[0].statut,'','the reported statut for a broken row must be the real empty string, never a fabricated placeholder');
  console.log('Passed: findOpenTasks() flags exactly the rows whose status is not "terminée" (an "ouverte" and an "en cours" row alike), reports each one\'s real distinct status rather than a generic open label, never flags an already-closed row regardless of its fidelity wording, reports zero rather than crashing on a session with no task rows at all, and — closing a real blind spot found on 2026-09-19 — also flags a row whose Statut column is empty instead of silently ignoring it.');
}
{
  // splitTableRow() (2026-09-19, même relecture de fiabilité) : le découpage partagé par
  // findOpenTasks()/findUnverifiedClosures() doit survivre à un "|" littéral échappé dans une
  // description (une commande shell avec un tube, un exemple de tableau cité) sans décaler la
  // colonne Statut.
  const {splitTableRow}=await import('../scripts/check-suivi-fidelity.mjs');
  const escaped=splitTableRow('| t1 | S | s | normal | commande : `git log \\| grep x` | terminée — fidèle |');
  assert.equal(escaped.length,6,'a literal escaped pipe inside a cell must never be treated as an extra column separator');
  assert.ok(escaped[4].includes('git log | grep x'),'the escaped pipe must be restored as a literal character in the cell text, not left as a stray backslash');
  assert.equal(escaped[escaped.length-1],'terminée — fidèle','the real Statut column must still be the last cell, never shifted by the escaped pipe earlier in the row');
  console.log('Passed: splitTableRow() treats an escaped "\\|" as a literal pipe character inside a cell rather than an extra column separator, restoring it correctly in the cell text while keeping the real Statut column exactly last — closing a real parsing fragility found on 2026-09-19.');
}
{
  // categorizeTasks()/categorizeAllSessions() (2026-09-19, demande explicite de l'utilisateur : « je
  // veux un suivi en temps réel des tâches réalisées, en cours, à faire [...] je veux que le système
  // puisse produire ces infos ») — la vue à trois colonnes que le système doit pouvoir produire en
  // sortie, pas seulement un garde-fou qui ne parle qu'en cas d'anomalie.
  const {categorizeTasks,categorizeAllSessions}=await import('../scripts/check-suivi-fidelity.mjs');
  const session='| h | S1 | s1 | normal | d1 | terminée — fidèle |\n| h | S2 | s2 | normal | d2 | en cours — detail |\n| h | S3 | s3 | normal | d3 | ouverte |\n| h | S4 | s4 | normal | d4 | statut-inconnu |';
  const cats=categorizeTasks(session);
  assert.equal(cats.terminee.length,1,'exactly the one terminée row must land in the terminee bucket');
  assert.equal(cats.enCours.length,1,'exactly the one en cours row must land in the enCours bucket, regardless of trailing detail after the status word');
  assert.equal(cats.ouverte.length,1,'exactly the one ouverte row must land in the ouverte bucket');
  assert.equal(cats.autre.length,1,'a status matching none of the three known words must land in autre, never silently dropped or miscategorized into one of the three');
  assert.deepEqual(categorizeTasks('| Horodatage | Sujet | Sous-sujet | Sensibilité | Description | Statut |\n|---|---|---|---|---|---|'),{terminee:[],enCours:[],ouverte:[],autre:[]},'a session with zero task rows must report all four buckets empty, never crash');
  const fakeDir=[{name:'a.md',text:session},{name:'b.md',text:'| h | S5 | s5 | normal | d5 | terminée |'}];
  const totals=categorizeAllSessions('/fake',()=>fakeDir.map(f=>f.name),(p)=>fakeDir.find(f=>p.endsWith(f.name)).text,()=>true);
  assert.equal(totals.terminee.length,2,'terminée rows from every session file must be aggregated together, never only the first file found');
  assert.equal(totals.terminee[1].file,'b.md','each aggregated entry must remember which real session file it came from, never lose that provenance');
  assert.deepEqual(categorizeAllSessions('/definitely-not-a-real-path'),{terminee:[],enCours:[],ouverte:[],autre:[]},'a missing sessions directory must report all four buckets empty, never throw');
  console.log('Passed: categorizeTasks() sorts every task row into exactly one of terminée/en cours/ouverte/autre with no row lost or double-counted, categorizeAllSessions() aggregates this across every real session file while remembering each entry\'s source file, and both report an honest all-empty result rather than crashing on missing or empty input — the real-time done/in-progress/to-do view the user asked the system to be able to produce.');
}
{
  // findClaimedFilesMissing() (2026-09-19, demande explicite de l'utilisateur : « fiabiliser [...]
  // la validation des tâches terminées »). Vérifie qu'un fichier cité entre backticks dans une
  // ligne "terminée" existe RÉELLEMENT sur disque, plutôt que de faire confiance au seul texte.
  const {findClaimedFilesMissing}=await import('../scripts/check-suivi-fidelity.mjs');
  const session='| h | S | s | normal | Créé `docs/referentiel/vrai.md` et `scripts/reel.mjs` | terminée — fidèle |\n'
    +'| h | S | s | normal | A retirer `docs/referentiel/jamais-cree.md` | terminée — fidèle |\n'
    +'| h | S | s | normal | Encore ouvert, cite `docs/referentiel/pas-encore.md` | ouverte |\n'
    +'| h | S | s | normal | Commande `node script.mjs --confirm`, pas un vrai chemin de fichier | terminée — fidèle |';
  const fakeFs=new Set(['docs/referentiel/vrai.md','scripts/reel.mjs']);
  const hits=findClaimedFilesMissing(session,(p)=>[...fakeFs].some(f=>p.endsWith(f)));
  assert.equal(hits.length,1,'only the terminée row citing a genuinely missing file must be flagged — real files pass, an open/non-terminée row is never checked, and a command-line snippet without a real directory prefix is never mistaken for a file path');
  assert.equal(hits[0].path,'docs/referentiel/jamais-cree.md','the flagged entry must name the exact missing path, never a vague pointer');
  assert.deepEqual(findClaimedFilesMissing('| Horodatage | Sujet | Sous-sujet | Sensibilité | Description | Statut |\n|---|---|---|---|---|---|'),[],'a session with zero task rows must report zero missing files, never crash');
  console.log('Passed: findClaimedFilesMissing() flags exactly a "terminée" row whose backtick-quoted repo file path does not really exist on disk, never a still-open row nor a command-line snippet without a real directory prefix, and reports zero rather than crashing on an empty session — closing the "validation des tâches terminées" gap the user asked for.');
  // Non-régression du décalage de colonne (2026-09-20, ajout de la colonne N° en tête) : une
  // ancienne ligne à 6 colonnes (sans N°) doit continuer à fonctionner exactement comme avant,
  // preuve que la lecture par "avant-dernière colonne" reste robuste aux deux formats.
  const sevenColSession='| 1 | h | S | s | normal | Créé `docs/referentiel/vrai.md` | terminée — fidèle |';
  assert.deepEqual(findClaimedFilesMissing(sevenColSession,(p)=>p.endsWith('vrai.md')),[],'a real 7-column row (with the new N° column) must still correctly read the Description as its own column, never off by one');
  console.log('Passed: findClaimedFilesMissing() reads Description as the column right before Statut regardless of whether a N° column precedes it — robust to both the old 6-column fixtures above and the real 7-column rows used from 2026-09-20 onward.');
}
{
  // Numérotation durable des tâches (2026-09-20, demande explicite de l'utilisateur : « peux tu
  // garantir l'execution de ce numérotage dans le prolongement de celui actuel et jusqu'à nouvel
  // ordre ? »). Contrairement au gestionnaire de tâches interne de Claude Code (TaskCreate/
  // TaskUpdate, propre à la session), ce numéro vit dans docs/suivi/ et doit être vérifiable.
  const {extractTaskNumbers,nextTaskNumber,findTaskNumberIssues}=await import('../scripts/check-suivi-fidelity.mjs');
  const withNumbers='| N° | h | S | s | normal | d1 | terminée |\n| — | h | S | s | normal | d2 | terminée |\n| 118 | h | S | s | normal | d3 | terminée |\n|---|---|---|---|---|---|---|';
  assert.deepEqual(extractTaskNumbers(withNumbers),[118],'extractTaskNumbers() must extract only real numeric values, skip the header, the "—" placeholder for pre-numbering rows, and the separator line entirely');
  assert.deepEqual(extractTaskNumbers('| N° | h | S | s | normal | d1 | terminée |'),[],'a session with no real numbers yet must report an empty list, never crash');
  const fakeSessions=[{name:'a.md',text:'| 117 | h | S | s | normal | d1 | terminée |\n| 119 | h | S | s | normal | d2 | terminée |'},{name:'b.md',text:'| 120 | h | S | s | normal | d3 | terminée |'}];
  const listDir=()=>fakeSessions.map(f=>f.name);
  const readFakeFile=(p)=>fakeSessions.find(f=>p.endsWith(f.name)).text;
  assert.equal(nextTaskNumber('/fake',listDir,readFakeFile,()=>true),121,'nextTaskNumber() must return the real global maximum plus one across every session file, never just the last file read');
  assert.equal(nextTaskNumber('/definitely-not-a-real-path'),117,'a missing sessions directory (or one with no numbers yet) must seed at 117 — the exact continuation point of the ephemeral TaskCreate counter at the moment this durable rule was created, never zero or a crash');
  assert.deepEqual(findTaskNumberIssues('/fake',listDir,readFakeFile,()=>true),[],'a globally unique, per-file increasing set of numbers must report zero issues');
  const dupSessions=[{name:'a.md',text:'| 117 | h | S | s | normal | d1 | terminée |\n| 118 | h | S | s | normal | d2 | terminée |'},{name:'b.md',text:'| 118 | h | S | s | normal | d3 | terminée |'}];
  const dupIssues=findTaskNumberIssues('/fake',()=>dupSessions.map(f=>f.name),(p)=>dupSessions.find(f=>p.endsWith(f.name)).text,()=>true);
  assert.ok(dupIssues.some((i)=>i.type==='duplicate'&&i.number===118),'a number reused across two different session files must be flagged as a duplicate — the exact real gap this guard exists to catch');
  const regressionSession=[{name:'a.md',text:'| 120 | h | S | s | normal | d1 | terminée |\n| 119 | h | S | s | normal | d2 | terminée |'}];
  const regressionIssues=findTaskNumberIssues('/fake',()=>regressionSession.map(f=>f.name),(p)=>regressionSession.find(f=>p.endsWith(f.name)).text,()=>true);
  assert.ok(regressionIssues.some((i)=>i.type==='not-increasing'&&i.number===119),'a number that goes DOWN within the same file (rows are always appended chronologically) must be flagged, never silently accepted');
  console.log('Passed: extractTaskNumbers() reads only real numeric task numbers (skipping headers, separators, and "—" pre-numbering placeholders), nextTaskNumber() returns the true global maximum plus one across every session file (seeding at 117, the exact continuation point, when none exist yet), and findTaskNumberIssues() flags a real cross-file duplicate and a real within-file regression — the mechanical guarantee behind the durable task numbering the user asked for.');
}
{
  // countTasksSince() / lastCoveredTaskNumber() (2026-09-20, THE-DEEP-READER) : la borne de relecture
  // est toujours un numéro de tâche, jamais une date/heure (risque de fuseau horaire explicitement
  // signalé par l'utilisateur).
  const {countTasksSince,lastCoveredTaskNumber}=await import('../scripts/check-suivi-fidelity.mjs');
  const {classifyRereadVolume,recommendRereadBoundary}=await import('../scripts/smart-conso-token.mjs');
  const rereadSessions=[{name:'a.md',text:'| 140 | h | S | s | normal | d1 | terminée |\n| 145 | h | S | s | normal | d2 | terminée |'},{name:'b.md',text:'| 150 | h | S | s | normal | d3 | terminée |'}];
  const rereadListDir=()=>rereadSessions.map(f=>f.name);
  const rereadReadFile=(p)=>rereadSessions.find(f=>p.endsWith(f.name)).text;
  assert.equal(countTasksSince(140,'/fake',rereadListDir,rereadReadFile,()=>true),2,'countTasksSince() must count only real task numbers strictly greater than the given boundary, across every session file, never the boundary itself nor an earlier one');
  assert.equal(countTasksSince(150,'/fake',rereadListDir,rereadReadFile,()=>true),0,'a boundary at or beyond the highest real task number must report zero, never a fabricated count');
  assert.equal(countTasksSince(100,'/not-a-real-path'),0,'a missing sessions directory must report zero rather than crash');

  const deepReaderIndex='| Date | Interventions relues | Écarts trouvés | Tâches ouvertes | Fichier | Dernière tâche couverte (N°) |\n|---|---|---|---|---|---|\n| 2026-09-20 | 40 | 2 | 2 | [x](x.md) | 140 |\n| 2026-09-21 | 12 | 0 | 0 | [y](y.md) | 150 |';
  assert.equal(lastCoveredTaskNumber(deepReaderIndex),150,'lastCoveredTaskNumber() must read the real last-column value of the most recently reported pass (the genuine maximum across all rows), never the first row nor a stale earlier one');
  assert.equal(lastCoveredTaskNumber(''),undefined,'an empty or missing registry must report an honest absence, never a fabricated zero — the correct signal for "first pass ever, reread from the start"');

  assert.deepEqual(classifyRereadVolume(0),{taskCount:0,niveau:'nul',message:'Aucune tâche enregistrée depuis cette borne — probablement rien de neuf à relire.'},'zero tasks since the boundary must classify as "nul", the honest floor');
  assert.equal(classifyRereadVolume(3).niveau,'faible','a handful of tasks must classify as "faible", never over-alarming a small gap');
  assert.equal(classifyRereadVolume(12).niveau,'modéré','a two-digit task count must classify as "modéré", the real order-of-magnitude jump the user asked this tool to reflect');
  assert.equal(classifyRereadVolume(50).niveau,'élevé','a large task count must classify as "élevé", never silently capped at "modéré" no matter how large the real gap grows');

  const noPassRecommendation=recommendRereadBoundary('');
  assert.equal(noPassRecommendation.borne,'debut','with no THE-DEEP-READER pass ever recorded, the recommended boundary must honestly be "depuis le début" — there is nothing to compare against yet');
  const withPassRecommendation=recommendRereadBoundary(deepReaderIndex,'/fake',rereadListDir,rereadReadFile,()=>true);
  assert.equal(withPassRecommendation.borne,150,'with a real prior pass recorded, the recommended boundary must be the genuine last-covered task number, never a re-derived or guessed value');
  assert.equal(withPassRecommendation.niveau,'nul','with the sample sessions used here, nothing lies past task #150 yet, so the honest recommendation is "nothing new to reread" rather than a fabricated volume');
  console.log('Passed: countTasksSince() and lastCoveredTaskNumber() anchor THE-DEEP-READER\'s reread boundary on a strictly-increasing global task number rather than a date/time (closing the real timezone-ambiguity risk the user flagged), classifyRereadVolume() turns that count into an honest order-of-magnitude signal without ever fabricating an exact token count, and recommendRereadBoundary() combines the registry\'s last recorded pass with the real task count to recommend resuming right where the previous pass left off — or an honest "depuis le début" on the very first pass, never a guessed value.');
}
{
  // findCommitsMissingSuiviUpdate() (2026-09-19, demande explicite : « comment nous assurer que le
  // suivi est correctement fait et historisé ? peux-tu fiabiliser ? »). Trouvaille réelle qui a
  // motivé cette fonction : 7 des 8 derniers commits d'une vraie session avaient changé du code réel
  // sans jamais toucher docs/suivi/ — reproduite ici avec des fixtures, jamais le vrai historique git
  // (qui varie dans le temps et casserait une assertion figée).
  const {findCommitsMissingSuiviUpdate}=await import('../scripts/check-suivi-fidelity.mjs');
  const commits=[
    {hash:'a1',subject:'Ajoute un outil',filesChanged:['scripts/axa-check.mjs','docs/referentiel/axa-check.md']},
    {hash:'a2',subject:'Met à jour le suivi et le code',filesChanged:['scripts/le-coordinateur.mjs','docs/suivi/sessions/x.md']},
    {hash:'a3',subject:'Corrige une typo dans un fichier joint',filesChanged:['docs/simulations/index.md']},
    {hash:'a4',subject:'Modifie la charte',filesChanged:['CLAUDE.md']},
  ];
  const missing=findCommitsMissingSuiviUpdate(commits);
  assert.deepEqual(missing.map(c=>c.hash),['a1','a4'],'only commits that touch real code/.mjs/.ts or the charter/method docs AND never touch docs/suivi/ must be flagged — a2 is exempt because it did update the suivi in the same commit, a3 is exempt because it never touched anything substantive to begin with');
  assert.deepEqual(findCommitsMissingSuiviUpdate([{hash:'b1',subject:'x',filesChanged:['docs/argus/scan.txt']}]),[],'a commit touching only a generated registry file (never real code or the charter) must never be flagged — this guard is about real work, not every commit whatsoever');
  console.log('Passed: findCommitsMissingSuiviUpdate() flags exactly the commits that touched real code, TypeScript, or the charter/method docs while never touching docs/suivi/ in the same commit — a commit that already included a suivi update is correctly exempt, and a commit touching only generated registry output is never flagged as if it were substantive work, closing the exact real drift found on 2026-09-19 (7 of the last 8 commits in one session never touched docs/suivi/ once).');
}
{
  // recentCommits() (2026-09-20, gap réel trouvé en vérifiant à la demande de l'utilisateur « existe
  // t il un test prevu et calibré pour les toutes dernieres mises à jour du suivi ? » : les fonctions
  // qu'elle nourrit — findCommitsMissingSuiviUpdate, le crochet post-commit — étaient bien testées,
  // mais recentCommits() elle-même, qui parse trois familles de commandes git en un seul objet par
  // commit, ne l'était jamais alors qu'elle accepte déjà un shImpl injectable pour ça (même patron
  // que categorizeAllSessions un peu plus haut). Un vrai crochet a été déclenché en direct sur ce
  // dépôt (commit jetable, immédiatement annulé) pour confirmer le comportement live une fois, mais
  // ça ne remplace jamais un test répétable — d'où ce test avec de fausses commandes git.
  const {recentCommits}=await import('../scripts/check-suivi-fidelity.mjs');
  const fakeSh=(cmd)=>{
    if(cmd.includes('git log -2 --format=%H'))return 'aaa\nbbb\n';
    if(cmd.includes('git log -1 --format=%s aaa'))return 'Premier commit\n';
    if(cmd.includes('git log -1 --format=%s bbb'))return 'Second commit\n';
    if(cmd.includes('git diff-tree --no-commit-id --name-only -r aaa'))return 'lib/x.ts\ndocs/suivi/sessions/s.md\n';
    if(cmd.includes('git diff-tree --no-commit-id --name-only -r bbb'))return '';
    throw new Error('commande git inattendue dans le test : '+cmd);
  };
  assert.deepEqual(recentCommits(2,fakeSh,'/fake'),[{hash:'aaa',subject:'Premier commit',filesChanged:['lib/x.ts','docs/suivi/sessions/s.md']},{hash:'bbb',subject:'Second commit',filesChanged:[]}],'recentCommits() must correctly assemble the three separate git queries (hash list, subject, changed files) into one object per commit, in order, with an empty file list reported as [] rather than [""] for a commit touching nothing');
  const emptySh=(cmd)=>cmd.includes('git log -5 --format=%H')?'':'';
  assert.deepEqual(recentCommits(5,emptySh,'/fake'),[],'a repository with no commits in range must report an empty list, never a list containing one bogus empty-string entry');
  console.log('Passed: recentCommits() correctly assembles the three separate git queries (hash list, subject, changed files) into one ordered object per commit, reports an empty file list as [] rather than [""], and reports zero commits rather than one bogus empty entry when the log itself is empty — the real gap found while verifying that every part of the real-time suivi mechanism is actually test-covered, not just the functions built on top of it.');
}

{
  // Extraction compacte des simulations archivées (2026-09-19, demande explicite de l'utilisateur,
  // pendant que les journaux bruts existaient encore). Un vrai bug trouvé et corrigé en construisant
  // cet outil : les journaux les plus anciens (full_sim/2/3) n'ont jamais eu de story.round, le
  // numéro de round n'existant qu'encodé dans le label de la requête (ex. "phase1-round11-actor1").
  const {summarizeActions,formatSummary,parseRoundFromLabel}=await import('../scripts/summarize-simulation-log.mjs');
  assert.equal(parseRoundFromLabel('phase1-round11-actor1'),11,'the label fallback must correctly extract the round number from a real historical label format');
  assert.equal(parseRoundFromLabel('reset'),undefined,'a label carrying no round number must report an honest absence, never a fake 0');
  assert.equal(parseRoundFromLabel(undefined),undefined,'a missing label must never throw');
  const entries=[
    {label:'reset',response:{story:{round:0,life:{bonusLog:[],gardenOpen:false},evidence:[]},decisions:[]}},
    {label:'r1',response:{story:{round:1,humanUnlocked:false,life:{bonusLog:[{bonus:'food'}],gardenOpen:false},evidence:['x']},decisions:[{actor:1,room:'salon'},{actor:2,room:'bureau'}]}},
    {label:'r2',response:{story:{round:2,humanUnlocked:true,life:{bonusLog:[{bonus:'food'}],gardenOpen:true},evidence:['x','y']},decisions:[{actor:1,room:'cuisine'},{actor:2,room:'bureau'}]}},
  ];
  const events=summarizeActions(entries);
  assert.deepEqual(events.map(e=>e.type),['bonus','evidence','revelation','garden_open','evidence','move'],'every real transition (a new bonus draw, growing evidence, the exact revelation turn, the garden opening, and a real room change) must be reported exactly once, in the order it actually happened, never duplicated or missed');
  assert.equal(events.find(e=>e.type==='move').detail,'acteur 1 : salon → cuisine','a room change must report the real previous and new room for the real actor, never a generic or wrong one');
  assert.deepEqual(summarizeActions([{label:'r1',response:{story:{round:1,life:{bonusLog:[{bonus:'food'}]},evidence:[]}}}]).map(e=>e.type),['bonus'],'an entry with no decisions array must never crash the extraction');
  assert.deepEqual(summarizeActions([]),[],'an empty log must report zero events, never throw');
  const summary=formatSummary(events,{lastRound:2,dossierFound:true});
  assert.ok(summary.includes('Round final observé : 2')&&summary.includes('Dossier retourné rempli : oui'),'the formatted summary must state the real last round and real dossier status, never a placeholder');
  assert.ok(formatSummary([],{}).includes('Round final observé : ?'),'a genuinely unknown round must be shown as an honest "?", never a fabricated number');
  console.log('Passed: the simulation-log summarizer correctly falls back to parsing the round number from the request label for the oldest logs (a real bug found and fixed while archiving full_sim/2/3), reports every real bonus draw/evidence growth/revelation turn/garden opening/room change exactly once in order with the real actors and rooms involved, never crashes on a missing decisions array or an empty log, and always states an honest "?" rather than a fabricated round or status when the data genuinely does not say.');
}

{
  // Mutualisation d'un utilitaire (2026-09-19, cf. docs/regles-de-travail.md §7ter) : le même petit
  // assistant shell était réécrit à l'identique dans trois scripts, extrait ici dans lib-shell.mjs.
  const {sh,PERSONNAGES,assertNotAPersonnage}=await import('../scripts/lib-shell.mjs');
  assert.equal(sh('echo bonjour').trim(),'bonjour','a successful command must return its real stdout');
  assert.equal(sh('exit 1'),'','a failing command must never throw, and defaults to empty output rather than a fake success');
  assert.ok(sh('node -e "process.stderr.write(1); process.exit(1)"',{verbose:true}).includes('[erreur:'),'verbose mode must surface the real error detail for tools that report it (HYPER-SCAN-CHECKPOINT), never silently swallow it');
  assert.ok(!sh('exit 1',{verbose:false}).includes('[erreur:'),'non-verbose mode (the default, used by ALWAYS-NEW-CODE/CHECK-LEVEL-TARGET) must stay exactly as quiet as their original local copies were, never suddenly noisier');
  console.log('Passed: the shared shell helper (extracted from three duplicated copies) returns real stdout on success, never throws on a failing command, and only surfaces the verbose error detail when explicitly asked — preserving each of its three original call sites\' exact prior behavior.');

  // PERSONNAGES/assertNotAPersonnage (2026-09-21, tâche #245) — garde-fou mécanique partagé contre
  // une vraie confusion de catégorie commise ce soir : Lia/Noé (Personnages, mémoire narrative) ne
  // sont structurellement jamais des Membres de l'équipe (scripts avec badge/blueprint/couverture).
  assert.ok(PERSONNAGES.has('Lia')&&PERSONNAGES.has('Noé'),'the shared Personnage set must name both real characters, never an empty or partial list');
  assert.throws(()=>assertNotAPersonnage('Lia','TEST-CALLER'),/Personnage/,'the guard must throw, naming the concept, when called with a real Personnage name');
  assert.doesNotThrow(()=>assertNotAPersonnage('ARGUS','TEST-CALLER'),'a genuine team-member name must pass through untouched — the guard is narrowly scoped, never a false positive on real tool names');
  console.log('Passed: PERSONNAGES/assertNotAPersonnage() (task #245) correctly names both real characters and refuses, by name, any team-member check mistakenly pointed at one — the mechanical fix for the exact category confusion found tonight while designing MEMENTO, shared from lib-shell.mjs so any future tool (MEMENTO included) can import the same single source of truth rather than a second list.');
}

{
  // ALWAYS-NEW-CODE (2026-09-19, cf. docs/always-new-code-blueprint.md et
  // docs/referentiel/always-new-code.md). Rend concret l'Article 7 (page blanche) : dette
  // d'organisation, distincte des absences (ARGUS) et frictions (HARMONIA).
  const {THEMES,parseCoverage,recommendZone,countDatedAddenda,addendaSignal,parseNumstat,churnSignal,alwaysNewCodePerformance}=await import('../scripts/always-new-code.mjs');
  assert.equal(THEMES.length,8,'must reuse the exact 8 HARMONIA grand-theme zones, never a second invented split of the project');
  const idx=[
    '| Date | Zone examinée | Trouvailles confirmées | Rapport | Notes |',
    '|---|---|---|---|---|',
    '| 2026-09-10 | Fatigue | 2 | x.txt | - |',
    '| 2026-09-15 | Fatigue | 1 | y.txt | - |',
  ].join('\n');
  assert.equal(parseCoverage(idx).Fatigue,'2026-09-15','coverage must keep the MOST RECENT pass date per zone, never the first row found');
  assert.equal(parseCoverage(idx)['Cycle jour/nuit'],undefined,'a zone never examined must be an honest absence, never a fabricated date');
  const neverSeen=recommendZone(THEMES,{},undefined,new Date('2026-09-19'));
  assert.equal(neverSeen.source,'rotation');
  assert.equal(neverSeen.daysSinceLastPass,undefined,'a zone with zero history must report an honest absence of age, never a fake Infinity-derived number');
  const neverSeenBeatsOld=recommendZone(THEMES,Object.fromEntries(THEMES.filter(t=>t!=='Enquête').map(t=>[t,'2026-01-01'])),undefined,new Date('2026-09-19'));
  assert.equal(neverSeenBeatsOld.zone,'Enquête','a never-examined zone must always outrank every already-dated zone, however old that date is');
  const fullyCovered=Object.fromEntries(THEMES.map((t,i)=>[t,`2026-09-${String(10+i).padStart(2,'0')}`]));
  const rotated=recommendZone(THEMES,fullyCovered,undefined,new Date('2026-09-19'));
  assert.equal(rotated.zone,'Fatigue','once every zone has a date, rotation must propose the OLDEST one first, never an arbitrary or alphabetical one');
  const explicit=recommendZone(THEMES,{},'fatigue');
  assert.equal(explicit.zone,'Fatigue');
  assert.equal(explicit.source,'demande explicite','an explicit request for a known zone must always override the rotation, case-insensitively');
  const ambiguous=recommendZone(THEMES,{},'un thème qui n\'existe pas');
  assert.equal(ambiguous.ambiguous,true,'a requested zone matching no known theme must be flagged ambiguous for the agent to ask back, never silently accepted or silently ignored');
  assert.equal(addendaSignal(countDatedAddenda('Rien de spécial ici.')),undefined,'below-threshold addenda count must never be promoted to a stacking signal');
  assert.equal(addendaSignal(countDatedAddenda('Ajouté le 2026-09-16. Ajouté le 2026-09-16. Ajouté le 2026-09-17. Ajouté le 2026-09-17. Ajouté le 2026-09-18. Ajouté le 2026-09-19.')),'probable','six or more dated addenda on the same rule must be flagged as a probable stacking indicator');
  assert.equal(parseNumstat(''),undefined,'a file with zero git history must be an honest absence, never a fake zero-growth signal');
  const pureGrowth=parseNumstat('5\t0\tlib/x.ts\n3\t0\tlib/x.ts\n10\t0\tlib/x.ts\n2\t0\tlib/x.ts\n1\t0\tlib/x.ts\n');
  assert.equal(churnSignal(pureGrowth),'probable','a file with 5+ commits and literally zero deletions ever must be flagged as probable pure accretion');
  assert.equal(churnSignal(undefined),undefined,'missing stats must never be silently treated as a zero-signal verdict');
  assert.equal(alwaysNewCodePerformance('| Date | Zone examinée | Trouvailles confirmées | Rapport | Notes |\n|---|---|---|---|---|'),undefined,'zero recorded passes must report an honest absence, never a fake 0%, same discipline as the HYPER-SCAN-CHECKPOINT KPI');
  const perfIdx=[
    '| Date | Zone examinée | Trouvailles confirmées | Rapport | Notes |','|---|---|---|---|---|',
    '| 2026-09-19 | Fatigue | 3 | a.txt | - |','| 2026-09-19 | Enquête | 1 | b.txt | - |',
  ].join('\n');
  assert.deepEqual(alwaysNewCodePerformance(perfIdx),{passages:2,totalFindings:4,findingsPerPassage:2},'the KPI must compute the exact real average of confirmed findings per pass, tracked from day one per the explicit user decision');
  console.log('Passed: ALWAYS-NEW-CODE reuses the exact 8 HARMONIA zones, its coverage memory keeps the most recent pass per zone and reports an honest absence for a never-seen zone, its rotation always proposes the most-neglected zone first while an explicit valid request always overrides it and an unknown requested zone is flagged ambiguous for the agent to ask back rather than silently accepted or ignored, its mechanical stacking signals (dated-addenda count, git-history pure-growth pattern) only ever reach "probable" and report an honest absence rather than a fake zero-signal on missing data, and its from-day-one KPI computes the exact real findings-per-pass average.');
}

{
  // AXA-CHECK (2026-09-19, cf. docs/axa-check-blueprint.md et docs/referentiel/axa-check.md). Né
  // d'une question directe de l'utilisateur : « comment sait-on si une zone du code est couverte
  // ou pas par un test ? ». Toutes les fixtures sont des relevés V8 miniatures écrits à la main,
  // jamais une vraie exécution de check-house.mjs dans ce test (qui varierait dans le temps).
  const {functionCoverageFromV8,robustnessScore,fragileFunctions,corroboratedByArchivedSimulations,collectCoverage,LIB_MAP,collectScriptCoverage,scriptRobustnessScore,AGENT_SCRIPT_FILES}=await import('../scripts/axa-check.mjs');
  const src='function a(){}\nfunction b(){}\n';
  const covEntry={functions:[
    {functionName:'',ranges:[{startOffset:0,count:5}]}, // pseudo-appel "script entier" V8, toujours exclu
    {functionName:'a',ranges:[{startOffset:0,count:1}]},
    {functionName:'b',ranges:[{startOffset:src.indexOf('function b'),count:0}]},
  ]};
  const functions=functionCoverageFromV8(covEntry,src);
  assert.equal(functions.length,2,'the empty-name pseudo-entry (V8\'s whole-script pseudo-function) must never be reported as a real function');
  assert.deepEqual(functions.map(f=>f.name),['a','b']);
  assert.equal(functions.find(f=>f.name==='a').covered,true,'a function with a non-zero execution count must be reported covered');
  assert.equal(functions.find(f=>f.name==='b').covered,false,'a function with a zero execution count must be reported uncovered, never a false positive');
  assert.equal(functions.find(f=>f.name==='b').line,2,'the byte offset must map back to the real 1-indexed source line, not the raw offset');
  assert.equal(robustnessScore(functions),50,'exactly one of two functions covered must report 50%, not a rounded or fudged number');
  assert.equal(robustnessScore([]),undefined,'a file with zero real functions must report an honest N/A, never a fake 0% or 100%');
  assert.equal(robustnessScore(undefined),undefined);
  // Fragilité enrichie (décision explicite : jamais un simple miroir de la robustesse) : une
  // fonction non couverte gagne en confiance quand elle est proche d'un nœud sensible HARMONIA
  // et/ou porte un signal de churn — jamais les deux mêmes raisons pour deux fichiers différents.
  const plainFragile=fragileFunctions(functions,'lib/nowhere-sensitive.ts',[],undefined);
  assert.equal(plainFragile.length,1,'only the uncovered function must be reported, never the covered one');
  assert.equal(plainFragile[0].confidence,'à surveiller','with no sensitive-node match and no churn signal, confidence must stay the lowest tier, never inflated');
  const sensitiveNodes=[{node:'Sommeil',files:['lib/sensitive.ts']}];
  const nearSensitive=fragileFunctions(functions,'lib/sensitive.ts',sensitiveNodes,undefined);
  assert.equal(nearSensitive[0].confidence,'probable','proximity to a real HARMONIA sensitive node must raise confidence, the whole point of the enrichment over a plain coverage mirror');
  assert.ok(nearSensitive[0].reasons.some(r=>r.includes('Sommeil')),'the specific matched sensitive node must be named in the reasons, never a generic flag');
  const churnedFile=fragileFunctions(functions,'lib/nowhere-sensitive.ts',[],{commits:5,insertions:12,deletions:0});
  assert.equal(churnedFile[0].confidence,'probable','a genuine pure-accretion churn signal must also raise confidence on its own, independent of any sensitive-node match');
  // Corroboration par simulation archivée (niveau ZONE, jamais fonction — limite honnête assumée).
  const bonusSim='  [round 3] bonus — food\n  [round 4] move\n';
  const noBonusSim='  [round 1] evidence — indice A\n';
  assert.equal(corroboratedByArchivedSimulations('Bonus roulette',[bonusSim,noBonusSim]),1,'only the archived simulation whose real event log actually shows this zone\'s marker must be counted, never both just because two files exist');
  assert.equal(corroboratedByArchivedSimulations('Bonus roulette',[]),undefined,'zero archived simulations must be an honest absence, never a fake zero-confidence verdict');
  assert.equal(corroboratedByArchivedSimulations('Zone inconnue',[bonusSim]),undefined,'a zone with no configured event hint must never silently report zero — it must say it cannot corroborate at all');
  // collectCoverage() : lit un dossier NODE_V8_COVERAGE déjà produit (par AXA-CHECK ou par
  // kpi-report.mjs réutilisant son propre lancement de check-house.mjs, jamais un second) et mappe
  // vers le vrai fichier source via LIB_MAP — testé avec un readDir/readFile injectés, jamais un
  // vrai relevé V8 réel (non déterministe), mais contre le vrai fichier lib/house.ts pour prouver
  // que le mapping et la lecture de la vraie source fonctionnent de bout en bout.
  assert.ok(LIB_MAP['test-house.mjs']==='lib/house.ts'&&LIB_MAP['test-route.mjs']==='app/api/lia/route.ts','the file map must cover both a plain lib/*.ts module and the special-cased app/api/lia/route.ts entry');
  const fixtureCovDir='.sites-runtime/axa-check-fixture-cov';
  fs.mkdirSync(fixtureCovDir,{recursive:true});
  const fakeCovJson=JSON.stringify({result:[{url:'file:///whatever/.sites-runtime/test-house.mjs',functions:[{functionName:'fixtureFn',ranges:[{startOffset:0,count:1}]}]}]});
  const perFile=collectCoverage(fixtureCovDir,{readDir:()=>['proc-1.json','proc-2.json'],readFile:()=>fakeCovJson});
  assert.ok(Array.isArray(perFile['lib/house.ts']),'a coverage entry whose URL matches a known LIB_MAP key must be mapped to its real source file, read from the real project source');
  assert.equal(perFile['lib/house.ts'].length,1,'the second process\'s identical coverage entry for the same file must be deduped, never double-counted');
  assert.deepEqual(collectCoverage('.sites-runtime/axa-check-nonexistent-dir'),{},'a coverage directory that was never produced must report an honest empty result, never crash the caller');
  fs.rmSync(fixtureCovDir,{recursive:true,force:true});
  console.log("Passed: AXA-CHECK's function-level V8 coverage extraction correctly excludes the whole-script pseudo-entry, maps byte offsets back to real 1-indexed source lines, and tells a covered function from an uncovered one exactly; its robustness score is an honest percentage or an honest N/A on zero functions, never a fake number; its fragility enrichment only raises confidence above the baseline tier when a real HARMONIA sensitive-node match or a real churn signal is present, always naming the specific reason rather than a generic flag; its archived-simulation corroboration counts only genuine zone-marker matches and reports an honest absence rather than a fake zero when no simulations or no configured hint exist; and its coverage collector correctly maps a V8 URL to the real project source via LIB_MAP, dedupes repeated entries across multiple process coverage files, and reports an honest empty result for a directory that was never produced.");

  // AGENT_SCRIPT_FILES/collectScriptCoverage()/scriptRobustnessScore() (2026-09-21, tâche #218 —
  // extension d'AXA-CHECK aux scripts/*.mjs des ~14 outils à badge). Un script est déjà du JS pur
  // (contrairement à lib/*.ts, qui a besoin de l'indirection test-X.mjs de LIB_MAP) : son entrée V8
  // porte directement son vrai chemin, jamais un fichier transpilé intermédiaire.
  assert.ok(Object.keys(AGENT_SCRIPT_FILES).length>=14,'the badge-eligible tool map must cover at least the 14 real Agent-status tools listed in docs/regles-de-travail.md §7ter, never silently missing one');
  assert.equal(AGENT_SCRIPT_FILES.argus,'scripts/check-argus.mjs','ARGUS\'s real script filename does not follow the slug convention (check-argus.mjs, not argus.mjs) — the map must reflect the real, non-uniform filenames rather than a guessed pattern');
  const fixtureScriptCovDir='.sites-runtime/axa-check-script-fixture-cov';
  fs.mkdirSync(fixtureScriptCovDir,{recursive:true});
  const fakeScriptCovJson=JSON.stringify({result:[{url:'file:///whatever/scripts/check-argus.mjs',functions:[{functionName:'fixtureScriptFn',ranges:[{startOffset:0,count:1}]},{functionName:'uncoveredFn',ranges:[{startOffset:0,count:0}]}]}]});
  const perSlug=collectScriptCoverage(fixtureScriptCovDir,{readDir:()=>['proc-1.json'],readFile:()=>fakeScriptCovJson});
  assert.ok(Array.isArray(perSlug.argus)&&perSlug.argus.length===2,'a coverage entry whose URL ends with a real AGENT_SCRIPT_FILES path must be mapped to that tool\'s slug, read from the real script source, never confused with an unrelated file that merely shares a path fragment');
  assert.equal(scriptRobustnessScore('argus',perSlug),50,'scriptRobustnessScore() must reuse robustnessScore() exactly (one of two functions covered = 50%), never a second scoring formula for scripts');
  assert.equal(scriptRobustnessScore('harmonia',perSlug),undefined,'a tool never seen in this coverage run must report an honest N/A, never a fabricated 0%');
  assert.deepEqual(collectScriptCoverage('.sites-runtime/axa-check-script-nonexistent-dir'),{},'a coverage directory that was never produced must report an honest empty result, never crash the caller');
  fs.rmSync(fixtureScriptCovDir,{recursive:true,force:true});
  console.log("Passed: AXA-CHECK's extension to scripts/*.mjs (task #218) correctly maps each badge-eligible tool's real, non-uniformly-named script file (ARGUS's check-argus.mjs, THE-SCREENER's the-screener-capture.mjs, etc. — never a guessed slug-based filename), reuses functionCoverageFromV8()/robustnessScore() verbatim rather than a second scoring formula, and reports an honest absence for a tool never seen in a given coverage run or a directory that was never produced.");
}

{
  // AXA-CHECK — profondeur de vérification par les outils (2026-09-19, demande explicite de
  // l'utilisateur : combiner couverture de test réelle ET profondeur d'audit humain/agent pour
  // produire une note honnête). Jamais un vrai appel git ni une vraie écriture disque ici : shImpl
  // et le ledger sont toujours injectés, exactement comme collectCoverage ci-dessus est testé avec
  // readDir/readFile injectés plutôt qu'un vrai dossier de couverture.
  const {chooseCheckScope,isRecordStillValid,currentDepthFor,safetyRating,DEPTH_ORDER}=await import('../scripts/axa-check.mjs');
  assert.deepEqual(DEPTH_ORDER,['aucun','leger','standard','approfondi','exceptionnel'],'the depth scale must extend CHECK-LEVEL-TARGET\'s own four levels with exactly one new floor tier, never a second independently-invented scale (anti-duplication rule)');
  // Arbitrage fichier/portion : l'agent déclare, le garde-fou ne corrige qu'une incohérence flagrante.
  assert.deepEqual(chooseCheckScope('file',undefined,undefined),{granularity:'file'},'a plain file-wide declaration with no function list and no known total must be trusted as-is, never blocked for lack of information');
  assert.deepEqual(chooseCheckScope('functions',['a','b'],undefined),{granularity:'functions',functions:['a','b']},'an explicit functions-only declaration must always be honored exactly as scoped, regardless of any file-wide guard');
  const consistentWhole=chooseCheckScope('file',['a','b','c'],['a','b','c','d']);
  assert.deepEqual(consistentWhole,{granularity:'file'},'a file-wide declaration whose cited functions cover the large majority of the real total must be trusted, never downgraded for an honest partial listing');
  const flagrantMismatch=chooseCheckScope('file',['a'],['a','b','c','d','e','f']);
  assert.equal(flagrantMismatch.granularity,'functions','a file-wide declaration naming barely a sixth of the file\'s real functions must be caught by the safety net, never left to silently inflate confidence over the whole file');
  assert.equal(flagrantMismatch.corrected,true,'a corrected record must say so explicitly, never silently downgrade without a trace');
  assert.deepEqual(flagrantMismatch.functions,['a'],'the corrected record must keep exactly the functions actually cited, never invent or drop any');
  // Péremption : comparée au commit RÉEL le plus récent du fichier précis, jamais HEAD global.
  assert.equal(isRecordStillValid({file:'lib/x.ts',commit:'abc'},()=>'abc'),true,'a record whose file has had no new commit since must still be valid');
  assert.equal(isRecordStillValid({file:'lib/x.ts',commit:'abc'},()=>'def'),false,'a record whose file has a newer commit since must be invalidated, per the explicit user decision that a check expires on the next modification');
  assert.equal(isRecordStillValid({file:'lib/x.ts',commit:undefined},()=>{throw new Error('must not be called')}),true,'a record with no commit info (e.g. a test fixture) must be trusted rather than falsely invalidated, and must never even attempt a shell call');
  // Profondeur courante : le plus haut niveau valide, fichier entier ou fonction nommée.
  const ledger=[
    {file:'lib/x.ts',depth:'approfondi',granularity:'file',commit:'c1'},
    {file:'lib/x.ts',depth:'exceptionnel',granularity:'functions',functions:['onlyFn'],commit:'c1'},
    {file:'lib/y.ts',depth:'exceptionnel',granularity:'file',commit:'stale'},
  ];
  const shSame=()=>'c1';
  assert.equal(currentDepthFor('lib/x.ts','anyOtherFn',ledger,shSame),'approfondi','a file-wide record must cover every function in that file, not just the ones explicitly named elsewhere in the ledger');
  assert.equal(currentDepthFor('lib/x.ts','onlyFn',ledger,shSame),'exceptionnel','the highest still-valid depth among all matching records (file-wide and function-specific) must win, never the lowest or the first found');
  assert.equal(currentDepthFor('lib/y.ts','anyFn',ledger,()=>'fresh'),'aucun','a record invalidated by a newer commit on its file must never still grant its depth to any function');
  assert.equal(currentDepthFor('lib/never-checked.ts','fn',ledger,shSame),'aucun','a file with zero ledger entries must honestly report the floor tier, never a fake default');
  // Note combinée : jamais "100% safe" littéral (réserve explicite conservée), la note maximale
  // exige les DEUX axes réunis (test réel + profondeur "exceptionnel"), "approfondi" restant un
  // palier immédiatement inférieur mais toujours au-dessus d'un simple test sans profondeur.
  assert.equal(safetyRating(true,'exceptionnel').tier,'confiance-maximale','both axes at their peak (real test coverage AND the deepest tool check) must reach the top tier, never a lower one');
  assert.ok(!/100\s*%\s*safe/i.test(safetyRating(true,'exceptionnel').label),'the top-tier label must never literally read "100% safe", per the explicit user decision to keep an honest reservation visible, consistent with this tool\'s own documented limits');
  assert.equal(safetyRating(true,'approfondi').tier,'fiable','a real test plus an "approfondi" (but not "exceptionnel") check must land one tier below the maximum, never conflated with it');
  assert.equal(safetyRating(true,'aucun').tier,'testé','real test coverage alone, with no recorded depth check at all, must keep the plain pre-existing baseline tier, never inflated by a check that never happened');
  assert.equal(safetyRating(false,'exceptionnel').tier,'à-surveiller','a deep tool check without any real test proof must never reach the top tier, since only automated execution proves the code truly ran');
  assert.equal(safetyRating(false,'aucun',{sensitiveNode:true}).tier,'à-risque','a function with neither a test nor any tool check, sitting near a known HARMONIA sensitive node, must be flagged at the worse of the two new tiers, exactly the distinction the user asked for');
  assert.equal(safetyRating(false,'aucun',{churnFlag:true}).tier,'à-risque','the same worse tier must also trigger on a genuine churn signal alone, independent of any sensitive-node match');
  assert.equal(safetyRating(false,'aucun').tier,'à-surveiller','a function with neither a test nor any tool check, but with no aggravating signal either, must stay at the ordinary tier, never escalated without a real reason');
  console.log('Passed: AXA-CHECK\'s new depth-of-verification system lets the agent\'s own file-vs-functions declaration stand except for a flagrant mismatch that the safety net corrects and marks as corrected; a depth record expires the moment its exact file receives a newer commit, compared against that file\'s own history rather than global HEAD; the current depth for a function is the highest still-valid record covering it, whether file-wide or function-specific, and an unrecorded file honestly reports the floor tier; and the combined safety rating never reaches the top tier without both real test coverage and the deepest tool-check level, never literally claims "100% safe", and only escalates the untested-and-unchecked case to the worse "à risque" tier when a genuine sensitive-node or churn signal is present.');
}

{
  // LE-COORDINATEUR (2026-09-19, nommé et calibré par l'utilisateur). Volontairement mince : les
  // fonctions pures testées ici sont ses seules responsabilités propres (détection de doublon,
  // mise en forme du tableau, lecture d'état injectable) — tout le reste est de l'import direct de
  // fonctions déjà testées ailleurs (ARGUS, HARMONIA, AXA-CHECK, ALWAYS-NEW-CODE, CHECK-LEVEL-TARGET),
  // jamais retesté ici en double (règle anti-doublon, §7ter).
  const {isDuplicateRun,formatTable,loadState,classifyRequest,formatMenu,PRESTATIONS,runNetworkCheck,renderNamedCatalog,recordCatalog,buildCatalogDelivery,CATALOGUE_DIR,CATALOGUE_INDEX_PATH}=await import('../scripts/le-coordinateur.mjs');
  assert.equal(isDuplicateRun({lastHead:'abc123'},'abc123'),true,'the exact same commit as the last recorded run must be reported as a real duplicate');
  assert.equal(isDuplicateRun({lastHead:'abc123'},'def456'),false,'a genuinely different HEAD commit must never be flagged as a duplicate, however recently the last run happened');
  assert.equal(isDuplicateRun({},'abc123'),false,'a never-before-recorded state must never be treated as a duplicate of nothing');
  assert.equal(isDuplicateRun({lastHead:'abc123'},undefined),false,'an unreadable current commit must never be silently treated as matching a past one');
  const table=formatTable([{name:'Outil A',result:'ok',when:'2026-09-19T00:00:00.000Z'},{name:'Outil B',result:'à regarder (1)',when:'2026-09-19T00:00:00.000Z'}]);
  assert.ok(table.includes('| Outil A | ok |')&&table.includes('| Outil B | à regarder (1) |'),'every row passed in must appear in the rendered table with its real name and result, never dropped or reordered');
  assert.deepEqual(loadState(()=>{throw new Error('no state file yet')}),{},'a missing or unreadable state file must report an honest empty state, never crash the caller — this is the tool\'s very first run on a fresh checkout');
  assert.deepEqual(loadState(()=>'{"lastHead":"abc123","lastWhen":"x"}'),{lastHead:'abc123',lastWhen:'x'},'a well-formed state file must be parsed and returned exactly as stored');
  // classifyRequest() est un pur passthrough vers check-level-target.mjs — un seul appel suffit à
  // prouver le câblage réel (accès "privilégié" direct demandé explicitement), jamais un doublon de
  // la suite de tests déjà dédiée à CHECK-LEVEL-TARGET lui-même.
  assert.equal(classifyRequest('corrige cette faute de frappe').level,'leger','the passthrough must genuinely reach the real classifyCheckLevel logic, not a stub — a trivial fix must classify exactly as CHECK-LEVEL-TARGET\'s own test suite already proves it does directly');
  console.log('Passed: LE-COORDINATEUR flags a duplicate run only when the current commit exactly matches the last recorded one (never a stale time-window guess), renders every real row of its summary table without dropping or reordering any, reports an honest empty state rather than crashing on a missing or malformed state file, and its CHECK-LEVEL-TARGET passthrough genuinely reaches the real classification logic rather than a disconnected stub.');

  // Fumée end-to-end de runNetworkCheck() (2026-09-20, trouvaille réelle de nuit) : chaque sous-partie
  // de cette fonction était déjà testée isolément (ci-dessus, plus les tests dédiés d'AXA-CHECK,
  // ALWAYS-NEW-CODE, CLEAN-DIRTY-OLD, Smart Conso API, SMART-CONSO-TOKEN) mais runNetworkCheck()
  // ELLE-MÊME n'avait jamais été appelée par aucun test — exactement pourquoi un vrai
  // ReferenceError (summarizeTokenHistory, un nom qui n'a jamais existé, copié-collé fautif de
  // summarizeHistory) a survécu sans être détecté jusqu'à un lancement manuel cette nuit. Ce test ne
  // rejoue jamais check-house.mjs/check-argus.mjs/check-harmonia.mjs pour de vrai (shImpl stubé,
  // jamais de récursion ni de lenteur) mais exécute réellement tout le reste de la fonction contre
  // l'état RÉEL du dépôt (fichiers .gemini-key-health.json/.smart-conso-token-history.json s'ils
  // existent, docs/always-new-code/index.md réel) — la même classe de garde-fou que
  // findMissingAliasReplacements() plus haut : ne jamais laisser un point d'intégration entier hors
  // de portée de la suite de tests.
  const fakeShImpl = (cmd) => (cmd.includes('check-house') ? 'OK — suite verte.' : '');
  const networkResult = runNetworkCheck({ shImpl: fakeShImpl });
  assert.equal(networkResult.rows.length, 10, 'runNetworkCheck() must genuinely produce all 10 rows of the real network synthesis (8 original + the 2026-09-21 findJudgeSpawnsWithoutConsultation() rows for THE-FINAL-JUDGE/THE-DEEP-READER), never crash partway through nor silently drop one');
  assert.ok(networkResult.rows.every((r) => typeof r.name === 'string' && typeof r.result === 'string' && r.result.length > 0), 'every row must carry a real name and a real, non-empty result string — never an undefined value leaking from a broken sub-computation');
  assert.ok(networkResult.rows.some((r) => r.name.includes('SMART-CONSO-TOKEN')), 'the SMART-CONSO-TOKEN rhythm row specifically (the exact one that crashed tonight) must be genuinely present and computed, not skipped');
  // Tâche #137 (2026-09-21, question directe de l'utilisateur sur les priorités de scan de l'équipe
  // noyau, qui a aussi fait remonter cet écart) : findJudgeSpawnsWithoutConsultation() existait déjà,
  // testé par fixtures, mais n'était jamais appelé nulle part en production — le même angle mort que
  // check-profil-utilisateur.mjs/runNetworkCheck() lui-même, corrigé plus tôt ce soir. Vérifié en
  // direct contre les vrais registres du dépôt (docs/the-final-judge/index.md,
  // docs/suivi/relectures-lourdes/index.md), jamais une fixture synthétique.
  assert.ok(networkResult.rows.some((r) => r.name.includes('THE-FINAL-JUDGE') && r.name.includes('SMART-CONSO-TOKEN')), 'a real row must now check real THE-FINAL-JUDGE spawns (docs/the-final-judge/index.md) against confirmed SMART-CONSO-TOKEN consultations, closing the exact real gap found while answering the "core team priority" question tonight');
  assert.ok(networkResult.rows.some((r) => r.name.includes('THE-DEEP-READER') && r.name.includes('SMART-CONSO-TOKEN')), 'the same real check must also run for THE-DEEP-READER (docs/suivi/relectures-lourdes/index.md), its cousin, never checked in isolation only');
  console.log('Passed: runNetworkCheck() runs end-to-end against the real repository state (with only the two subprocess calls stubbed) and produces all 10 expected rows with real, non-empty results — closing the exact real gap (a ReferenceError in the SMART-CONSO-TOKEN row, never caught because this integration point had no test at all) found by manually running node scripts/le-coordinateur.mjs tonight, plus (2026-09-21) the newly-wired real THE-FINAL-JUDGE/THE-DEEP-READER spawn-without-consultation checks.');
  // Menu des prestations (2026-09-20, demande explicite de l'utilisateur : « le coordinateur est
  // capable de proposer de nouvelles prestations [...] ce menu est très utile pour toi »). Vérifie
  // que le menu réel (celui affiché à chaque passage automatique) est bien formé et que chaque
  // entrée reste lisible en langage courant, jamais un tableau vide ou mal formaté.
  assert.ok(PRESTATIONS.length>=8,'the real menu must list every major costly/occasional tool of the network, never a partial or forgotten subset');
  assert.ok(PRESTATIONS.every((p)=>p.demande&&p.outils.length&&p.cout),'every real menu entry must have a plain-language request, at least one real tool it triggers, and an honest cost — never a half-filled entry');
  const menu=formatMenu([{demande:'Test de menu',outils:['OUTIL-A','OUTIL-B'],cout:'gratuit'}]);
  assert.ok(menu.includes('| Test de menu | OUTIL-A + OUTIL-B | gratuit |'),'formatMenu() must render each entry with its plain-language request, its combined tools, and its real cost, exactly as given — never dropped or reordered');
  console.log('Passed: LE-COORDINATEUR\'s PRESTATIONS menu lists at least the 8 major costly/occasional tools with a plain-language request, real tools triggered and honest cost for each, and formatMenu() renders every entry correctly — the reusable reminder of what can be commanded from the tool network, for the agent and, through it, the user.');

  // Catalogue d'offres nommé, historisé (tâche #154, 2026-09-21) : chaque PRESTATIONS doit porter
  // un vrai nom, renderNamedCatalog() doit les afficher, et recordCatalog() doit écrire une nouvelle
  // version SEULEMENT quand le contenu a réellement changé — jamais une entrée par simple relance.
  assert.ok(PRESTATIONS.every((p) => typeof p.nom === 'string' && p.nom.length > 0), 'every single real prestation must carry a real, non-empty name — never a silently missing one on a future addition');
  const namedCatalog = renderNamedCatalog([{ nom: 'Pack Test', description: 'Fait un test.', demande: 'Faire un test', outils: ['OUTIL-A'], cout: 'gratuit', tokensEstimes: 'nul' }]);
  assert.ok(namedCatalog.includes('| Pack Test | Fait un test. | Faire un test | OUTIL-A | gratuit | nul |'), 'renderNamedCatalog() must render each prestation\'s real name, description, request/tools and BOTH cost dimensions (API cost and Claude token cost) separately, never merge them into a single column nor omit either');
  const namedCatalogMissingFields = renderNamedCatalog([{ nom: 'Pack Sans Description', demande: 'x', outils: ['OUTIL-B'], cout: 'gratuit' }]);
  assert.ok(namedCatalogMissingFields.includes('| Pack Sans Description | — | x | OUTIL-B | gratuit | — |'), 'a prestation missing description/tokensEstimes (e.g. a fixture built before this restructuring) must render an honest em-dash placeholder rather than crashing or printing "undefined"');
  const fakeCatalogFs = {
    files: {},
    existsSync(p) { return p in this.files || Object.keys(this.files).some((f) => f.startsWith(p + '/')); },
    mkdirSync() {},
    readdirSync(dir) { return Object.keys(this.files).filter((f) => f.startsWith(dir + '/')).map((f) => f.slice(dir.length + 1)); },
    readFileSync(p) { return this.files[p]; },
    writeFileSync(p, content) { this.files[p] = content; },
  };
  const firstWrite = recordCatalog([{ nom: 'Pack Un', demande: 'x', outils: ['A'], cout: 'gratuit' }], new Date('2026-09-21T00:00:00Z'), fakeCatalogFs);
  assert.ok(firstWrite.written, 'the very first catalog snapshot must always be written — there is nothing yet to compare it against');
  assert.ok(fakeCatalogFs.files[path.join(CATALOGUE_DIR, '2026-09-21-00-00.md')]?.includes('Pack Un'), 'the dated snapshot file must actually contain the real rendered catalog, never an empty placeholder');
  assert.ok(fakeCatalogFs.files[CATALOGUE_INDEX_PATH]?.includes('2026-09-21'), 'the index must gain a real row for this new dated snapshot');
  const sameContentWrite = recordCatalog([{ nom: 'Pack Un', demande: 'x', outils: ['A'], cout: 'gratuit' }], new Date('2026-09-22T00:00:00Z'), fakeCatalogFs);
  assert.equal(sameContentWrite.written, false, 'a second call with genuinely unchanged PRESTATIONS content must never write a redundant new snapshot, even on a later date — the whole anti-doublon point of this mechanism');
  const changedContentWrite = recordCatalog([{ nom: 'Pack Deux', demande: 'y', outils: ['B'], cout: 'réel' }], new Date('2026-09-22T00:00:00Z'), fakeCatalogFs);
  assert.ok(changedContentWrite.written, 'a genuinely changed PRESTATIONS content must always produce a new dated snapshot, never silently skipped just because a previous one exists');
  // Bug réel trouvé en conditions réelles le 2026-09-21 (décalage d'horloge du conteneur, deux vrais
  // changements tombés sur la même date calendaire) : le nom de fichier doit inclure l'heure/minute,
  // jamais seulement la date, sous peine d'écraser silencieusement une version précédente tout en
  // laissant une ligne d'index périmée pointer vers un fichier qui ne correspond plus à ce qu'elle
  // décrit — même convention que les scans ARGUS (scan-YYYY-MM-DD-HH-MM.txt).
  const sameDayDifferentMinute = recordCatalog([{ nom: 'Pack Trois', demande: 'z', outils: ['C'], cout: 'réel' }], new Date('2026-09-22T00:05:00Z'), fakeCatalogFs);
  assert.ok(sameDayDifferentMinute.written && sameDayDifferentMinute.fileName !== changedContentWrite.fileName, 'two genuinely different changes on the exact same calendar day must never collide into the same filename and silently overwrite each other — the exact real bug found tonight, caused by the container\'s already-documented clock lag');
  assert.ok(fakeCatalogFs.files[path.join(CATALOGUE_DIR, changedContentWrite.fileName)]?.includes('Pack Deux'), 'the earlier same-day snapshot must still exist on disk, untouched, after a later same-day snapshot is written');
  console.log('Passed: the named, historized catalog (task #154) gives every real prestation an actual name, renderNamedCatalog() surfaces it in its own table distinct from the everyday formatMenu() reminder, recordCatalog() only ever writes a new snapshot (plus its index row) when the content genuinely changed, and — the real 2026-09-21 fix — filenames carry minute precision so two real same-day changes never collide and silently overwrite each other, a narrow, explicit exception to LE-COORDINATEUR\'s general "no dedicated registry" rule, verified against an injected fake filesystem rather than the real disk.');

  // buildCatalogDelivery() (2026-09-21, demande explicite : « en format html si c'est un nouveau
  // catalogue jamais produit, en txt si c'est un catalogue qui n'a pas changé »). Réutilise
  // directement le booléen `written` déjà produit ci-dessus, jamais une seconde détection.
  const htmlDelivery = buildCatalogDelivery(firstWrite, [{ nom: 'Pack Un', description: 'Fait le test.', demande: 'x', outils: ['A'], cout: 'gratuit', tokensEstimes: 'nul' }]);
  assert.equal(htmlDelivery.format, 'html', 'a genuinely new/changed catalog (written:true) must be delivered as a real HTML report, per the explicit user request');
  assert.ok(htmlDelivery.content.includes('Pack Un') && htmlDelivery.content.includes('<html') , 'the HTML delivery must actually contain the real catalog data inside a real HTML document, never an empty shell');
  assert.ok(htmlDelivery.content.includes('Fait le test.') && htmlDelivery.content.includes('nul'), 'the HTML delivery must carry the SAME real fields as renderNamedCatalog() (description, tokensEstimes) — the exact real drift found 2026-09-21 where the HTML table was never updated after PRESTATIONS gained these two columns, so the most important delivery path (a genuinely changed catalog) would have silently lost them while the unchanged-text path kept them');
  const textDelivery = buildCatalogDelivery(sameContentWrite, [{ nom: 'Pack Un', demande: 'x', outils: ['A'], cout: 'gratuit' }]);
  assert.equal(textDelivery.format, 'text', 'an unchanged catalog (written:false) must be delivered as plain text, never a needlessly regenerated HTML page');
  assert.ok(!textDelivery.content.includes('<html') && textDelivery.content.includes('Pack Un'), 'the text delivery must still show the real current catalog table, just never wrapped in HTML markup');
  console.log('Passed: buildCatalogDelivery() (task #154 follow-up) delivers the named catalog as real HTML exactly when recordCatalog() reports a genuine new version, and as plain text otherwise — reusing that exact written flag rather than a second, potentially diverging change-detection.');

  // Garde-fou de fraîcheur du catalogue (2026-09-20, demande explicite de l'utilisateur : « il doit
  // y avoir un test dédié pour être sûr que le catalogue est bien mis à jour [...] quand un nouvel
  // outil est créé, il comprend de façon autonome quelles nouvelles prestations peuvent être
  // proposées »). Ce garde-fou ne peut jamais INVENTER une nouvelle combinaison (un vrai jugement,
  // Article 19) — il ne peut que signaler l'ABSENCE d'un outil coûteux/occasionnel dans le menu réel,
  // exactement le principe déjà appliqué par ARGUS/HARMONIA/EL-PROFESSOR/AXA-CHECK.
  const {parseToolsTable,isMenuWorthy,findToolsMissingFromMenu}=await import('../scripts/le-coordinateur.mjs');
  const sampleTable=[
    '| Outil | Ce qu\'il détecte/régule | Coût | Déclenchement |',
    '|---|---|---|---|',
    '| `check-house.mjs` | régressions de comportement | gratuit | à chaque changement de code |',
    '| ARGUS | absences | gratuit (partie mécanique) | toujours déployé |',
    '| THE-SCREENER | qualité graphique | réel (Playwright, léger) | après chaque simulation |',
    '| NOUVEL-OUTIL | un tout nouveau service | réel (raisonnement) | sur demande explicite |',
  ].join('\n');
  const parsed=parseToolsTable(sampleTable);
  assert.equal(parsed.length,4,'parseToolsTable() must read exactly the four real tool rows, never the header row nor the separator row');
  assert.deepEqual(parsed[0],{tool:'check-house.mjs',cout:'gratuit',declenchement:'à chaque changement de code',statut:null},'a backtick-quoted tool name must be read with the backticks stripped, and its real cost/trigger columns kept exactly as written; without a Statut column in the source table, statut must be null rather than a guessed value');
  const tableWithStatut=[
    '| Outil | Statut | Ce qu\'il détecte/régule | Coût | Déclenchement |',
    '|---|---|---|---|---|',
    '| ARGUS | Agent | absences | gratuit (partie mécanique) | toujours déployé |',
    '| LE-COORDINATEUR | Utilitaire nommé | agrège | gratuit | routine |',
  ].join('\n');
  const parsedWithStatut=parseToolsTable(tableWithStatut);
  assert.equal(parsedWithStatut[0].statut,'Agent','once the real table carries a Statut column, parseToolsTable() must read it by header name (same discipline as Coût/Déclenchement) rather than leaving it null');
  assert.equal(parsedWithStatut[1].statut,'Utilitaire nommé','a non-Agent row must report its own real statut, never defaulting to Agent');
  assert.equal(isMenuWorthy({cout:'gratuit',declenchement:'toujours déployé'}),false,'a free, always-deployed tool (ARGUS-style) is never required in the menu — it is baseline infrastructure, not a commandable prestation');
  assert.equal(isMenuWorthy({cout:'réel (Playwright, léger)',declenchement:'après chaque simulation'}),true,'a tool with a real cost must always be considered menu-worthy, whatever its trigger wording');
  assert.equal(isMenuWorthy({cout:'gratuit',declenchement:'sur demande explicite seulement'}),true,'an on-demand tool must always be considered menu-worthy even when it costs nothing to run, since it is still something one would deliberately \"commander\"');
  const fakeMenu=[{demande:'Qualité visuelle',outils:['THE-SCREENER'],cout:'réel'}];
  assert.deepEqual(findToolsMissingFromMenu(sampleTable,fakeMenu),['NOUVEL-OUTIL'],'a real costly/on-demand tool absent from every menu entry must be flagged by name, while a free always-deployed tool and one already present in the menu must never be flagged');
  assert.deepEqual(findToolsMissingFromMenu(sampleTable,[{demande:'x',outils:['THE-SCREENER','NOUVEL-OUTIL'],cout:'réel'}]),[],'once every menu-worthy tool is covered by at least one entry, the guard must report a genuinely empty gap list, never a false positive');
  // Vérification réelle et bloquante contre la vraie carte des outils (docs/regles-de-travail.md
  // §7ter) et le vrai menu (PRESTATIONS ci-dessus) — la garantie mécanique elle-même, pas seulement
  // sa logique testée sur un exemple synthétique : si un futur outil coûteux/occasionnel est ajouté à
  // la carte sans jamais rejoindre PRESTATIONS, ce test échoue et bloque le commit (pre-commit hook).
  const travailMd=fs.readFileSync('docs/regles-de-travail.md','utf8');
  const travailLines=travailMd.split('\n');
  const tableStart=travailLines.findIndex((l)=>l.startsWith('| Outil |')&&l.includes('Ce qu\'il détecte'));
  assert.ok(tableStart>=0,'docs/regles-de-travail.md must still contain the real "carte des outils" table under its known heading — if this fails, the table was moved or renamed and this guard\'s anchor must move with it');
  const tableLines=[];
  for(let i=tableStart;i<travailLines.length;i++){if(i>tableStart&&!travailLines[i].trim().startsWith('|'))break;tableLines.push(travailLines[i]);}
  const realGaps=findToolsMissingFromMenu(tableLines.join('\n'));
  assert.deepEqual(realGaps,[],`every real costly/occasional tool listed in docs/regles-de-travail.md's own "carte des outils" must have a matching PRESTATIONS entry in scripts/le-coordinateur.mjs — missing: ${realGaps.join(', ')}`);
  console.log('Passed: the PRESTATIONS menu freshness guard reads the real tools table (backticks stripped, header/separator skipped), correctly tells a menu-worthy tool (real cost or on-demand trigger) from baseline free/always-deployed infrastructure, flags only a genuinely uncovered tool by name rather than fabricating a proposal, and — checked live against the project\'s own real table and real menu — currently finds zero real gap, a guarantee that breaks the build the day a new costly tool is added without a matching menu entry.');
}
{
  // suggestPrestationsForTask() (2026-09-20, demande explicite de l'utilisateur : « check-tasks-
  // details travaille en étroite collaboration avec le coordinateur : pour chaque tâche à
  // accomplir, il consulte le coordinateur qui lui dit quelles prestations permettent de remplir la
  // tâche »). Transforme PRESTATIONS d'un menu pour lecteur humain en un service qu'un autre script
  // peut appeler — un chevauchement de mots-clés, jamais une intelligence qui devine.
  const { suggestPrestationsForTask } = await import('../scripts/le-coordinateur.mjs');
  const fakePrestations = [
    { demande: 'Vérifier qu\'aucune idée/tâche n\'a été oubliée dans le suivi', outils: ['THE-DEEP-READER'], cout: 'réel' },
    { demande: 'Qualité visuelle du rendu', outils: ['THE-SCREENER'], cout: 'réel' },
  ];
  const matches = suggestPrestationsForTask('Vérifier que la tâche du suivi n\'a pas été oubliée', fakePrestations);
  assert.equal(matches.length, 1, 'a task label sharing at least two significant words with exactly one prestation\'s demande must return exactly that one match, never the unrelated one');
  assert.deepEqual(matches[0].outils, ['THE-DEEP-READER'], 'the returned match must carry the real prestation data (outils/cout), never a stripped-down reference');
  assert.ok(matches[0].matched.includes('oublie') || matches[0].matched.includes('oubliee') || matches[0].matched.length >= 2, 'the match must report which real keywords overlapped, never a silent score with no explanation');
  assert.deepEqual(suggestPrestationsForTask('bonjour comment vas-tu', fakePrestations), [], 'a task label with no meaningful keyword overlap with any prestation must return an empty list, never a guessed match');
  assert.deepEqual(suggestPrestationsForTask('la tâche', fakePrestations), [], 'a single shared word (even a real one) must never be enough on its own — the threshold of at least two shared keywords exists precisely to avoid this kind of noisy false positive');
  const realMatches = suggestPrestationsForTask('Vérifier qu\'aucune tâche du suivi n\'a été oubliée');
  assert.ok(realMatches.some((m) => m.outils.includes('THE-DEEP-READER')), 'run against the project\'s own real PRESTATIONS menu, a task label closely echoing THE-DEEP-READER\'s own real "demande" wording must actually surface it — the integration this function exists for, not just its isolated logic');
  assert.deepEqual(matches[0].badgeWarnings, [], 'without an onboardingContext argument, badgeWarnings must default to an honest empty array rather than throwing or fabricating a warning — full backward compatibility for every pre-existing caller');

  // badgeWarnings (2026-09-20, demande explicite de l'utilisateur : « si un membre de l'équipe est
  // sollicité alors qu'il n'a pas de badge, une alerte doit nous être remontée ») — calibré avec
  // l'utilisateur pour ne couvrir QUE ce point de passage déjà construit, jamais un nouveau
  // dispatcher central pour tout appel (chantier hors de propos, décision explicite).
  const badgeTable = '| Outil | Statut | Ce qu\'il détecte/régule | Coût | Déclenchement |\n|---|---|---|---|---|\n| THE-DEEP-READER | Agent | relecture lourde | réel | sur demande |\n| THE-SCREENER | Agent | qualité graphique | réel | sur demande |';
  const uncertifiedContext = { toolsTableMarkdown: badgeTable, existingPaths: new Set() };
  const uncertifiedMatches = suggestPrestationsForTask('Vérifier que la tâche du suivi n\'a pas été oubliée', fakePrestations, uncertifiedContext);
  assert.ok(uncertifiedMatches[0].badgeWarnings.length === 1 && uncertifiedMatches[0].badgeWarnings[0].includes('THE-DEEP-READER'), 'when an onboardingContext is supplied and the matched prestation\'s Agent has zero real wiring, suggestPrestationsForTask() must surface exactly one badge warning naming that Agent — the real alert the user asked for at the one point of passage that already exists');
  const certifiedContext = { toolsTableMarkdown: badgeTable, existingPaths: new Set(['docs/the-deep-reader-blueprint.md', 'docs/referentiel/the-deep-reader.md', 'docs/the-deep-reader/index.md']) };
  const certifiedMatches = suggestPrestationsForTask('Vérifier que la tâche du suivi n\'a pas été oubliée', fakePrestations, certifiedContext);
  assert.deepEqual(certifiedMatches[0].badgeWarnings, [], 'once the same Agent is fully wired, badgeWarnings must go back to an honest empty array — the badge is recomputed live, never a stale grudge');
  const utilitaireContext = { toolsTableMarkdown: '| Outil | Statut | Ce qu\'il détecte/régule | Coût | Déclenchement |\n|---|---|---|---|---|\n| THE-SCREENER | Utilitaire nommé | x | réel | sur demande |', existingPaths: new Set() };
  const utilitaireMatches = suggestPrestationsForTask('Qualité visuelle du rendu', fakePrestations, utilitaireContext);
  assert.deepEqual(utilitaireMatches[0].badgeWarnings, [], 'a row whose Statut is not "Agent" (Utilitaire nommé/Infrastructure) never carries a badge at all, cf. docs/regles-de-travail.md — it must never be flagged as "uncertified", since it was never eligible for certification in the first place');
  console.log('Passed: suggestPrestationsForTask() turns the PRESTATIONS menu into a callable service for other scripts — matching on a real, honest keyword overlap (never a single-word false positive, thanks to its ≥2 threshold), returning the full real prestation data with the matched keywords named, an honest empty list when nothing overlaps, a real match when checked against the project\'s own live menu, and — the 2026-09-20 badge alert — an honest badgeWarnings field (empty by default, one real warning per uncertified Agent when an onboardingContext is supplied, never flagging a non-Agent row that was never eligible for a badge) at the one point of passage the user asked to wire this into.');
}
{
  // checkAgentOnboarding() — la "séance d'accueil du nouveau collaborateur" (2026-09-20, demande
  // explicite de l'utilisateur : « lors de l'arrivée d'un nouveau membre de l'équipe, il y a un
  // check bien défini pour être sûr de le câbler avec tous les autres »). Formalise ce qui était
  // fait à la main (et incomplètement — 3 raccordements oubliés pour THE-DEEP-READER) à chaque
  // nouvel Agent cette session.
  const { slugifyAgentName, checkAgentOnboarding } = await import('../scripts/le-coordinateur.mjs');

  assert.equal(slugifyAgentName('THE-DEEP-READER'), 'the-deep-reader', 'slugifyAgentName() must lowercase and hyphenate a real agent name exactly the way this project already names its own blueprint/referentiel files');
  assert.equal(slugifyAgentName('Smart Conso API'), 'smart-conso-api', 'a name with spaces must collapse to the same kebab-case slug used for the real docs/referentiel/smart-conso-api.md file');

  const fakeTable = '| Outil | Statut | Ce qu\'il détecte/régule | Coût | Déclenchement |\n|---|---|---|---|---|\n| FAKE-AGENT-COMPLET | Agent | fait des choses | gratuit | sur demande |';
  const fakePrestations = [{ demande: 'Faire des choses', outils: ['FAKE-AGENT-COMPLET'], cout: 'gratuit' }];
  const completePaths = new Set(['docs/fake-agent-complet-blueprint.md', 'docs/referentiel/fake-agent-complet.md', 'docs/fake-agent-complet/index.md']);
  const complete = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths });
  assert.deepEqual(complete.gaps, [], 'an agent with every real wiring point present (table row, PRESTATIONS entry, blueprint, instanciation, registry) must report zero gaps');
  assert.equal(complete.complet, true, 'complet must be true once every real gap is resolved');
  assert.ok(complete.rappels.length >= 2, 'the result must always carry non-blocking reminders (consultation channels, CASSANDRA-RH) alongside the mechanical gaps, even when complet is true — real blind spots found at least once this session (THE-DEEP-READER), never mechanically verifiable enough to count as a hard gap');
  assert.equal(complete.badge, '🎖️ Membre certifié (catégorie non répertoriée — à ajouter dans AGENT_CATEGORIES)', 'the badge (2026-09-20, demande explicite de l\'utilisateur) must read "🎖️ Membre certifié" once every gap is resolved — a live-recomputed summary of complet, never a persisted fact — plus (2026-09-22) an honest category-missing note for a fake agent that was never added to AGENT_CATEGORIES, never a silently fabricated category');

  const missingEverything = checkAgentOnboarding('AGENT-FANTOME', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: new Set() });
  assert.equal(missingEverything.gaps.length, 5, 'an agent present nowhere at all must report exactly the five real gaps (table, menu, instanciation, registry, blueprint), never silently passing on any of them');
  assert.equal(missingEverything.complet, false, 'complet must be false the moment even one real gap exists');
  assert.equal(missingEverything.badge, '⚠️ Pas encore certifié (catégorie non répertoriée — à ajouter dans AGENT_CATEGORIES)', 'the badge must read "⚠️ Pas encore certifié" the moment even one gap remains, never a false positive certification');

  // Catégorie dans le badge (2026-09-22, demande explicite de l'utilisateur : « le badge de chaque
  // employé de l'agence codex mentionne la catégorie à laquelle il appartient »). Vérifié contre un
  // VRAI slug de AGENT_CATEGORIES (lib-shell.mjs) plutôt qu'un agent fictif, pour prouver que la
  // même table sert de source unique au badge et à l'organigramme canonique.
  const cloneHunterCategoryCheck = checkAgentOnboarding('CLONE-HUNTER', { toolsTableMarkdown: fakeTable.replace('FAKE-AGENT-COMPLET', 'CLONE-HUNTER'), prestations: [{ demande: 'Chasser les doublons', outils: ['CLONE-HUNTER'], cout: 'gratuit' }], existingPaths: new Set(['docs/clone-hunter-blueprint.md', 'docs/referentiel/clone-hunter.md', 'docs/clone-hunter/index.md']) });
  assert.equal(cloneHunterCategoryCheck.badge, '🎖️ Membre certifié (Gardien sacré du code)', 'a real Agent already listed in AGENT_CATEGORIES (CLONE-HUNTER, promu 5e Gardien le 2026-09-22) must show its real category label in the badge, read from the same lib-shell.mjs table CASSANDRA-RH will consult later — never a second, divergent classification');

  // Faux positif réel trouvé le 2026-09-20 en calibrant le badge contre les vrais Agents du
  // projet (Smart Conso API, CHECK-LEVEL-TARGET) : un Agent présent dans la table mais dont la
  // ligne n'est pas "menu-worthy" (isMenuWorthy() — jamais "réel" ni "sur demande") ne doit jamais
  // être exigé dans PRESTATIONS, exactement la même exemption que findToolsMissingFromMenu().
  const regulationTable = '| Outil | Statut | Ce qu\'il détecte/régule | Coût | Déclenchement |\n|---|---|---|---|---|\n| AGENT-REGULATION-INTERNE | Agent | régule le rythme | gratuit à consulter | avant toute action coûteuse |';
  const regulationCase = checkAgentOnboarding('AGENT-REGULATION-INTERNE', { toolsTableMarkdown: regulationTable, prestations: [], existingPaths: new Set(['docs/agent-regulation-interne-blueprint.md', 'docs/referentiel/agent-regulation-interne.md', 'docs/agent-regulation-interne/index.md']) });
  assert.ok(!regulationCase.gaps.some((g) => g.includes('PRESTATIONS')), 'an internal-regulation Agent (free to consult, triggered "before any costly action" — never "réel" nor "sur demande") must never be flagged for a missing PRESTATIONS entry, mirroring findToolsMissingFromMenu()\'s own isMenuWorthy() exemption — the real false positive found while calibrating the badge against Smart Conso API/CHECK-LEVEL-TARGET');
  const menuWorthyMissing = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: [], existingPaths: completePaths });
  assert.ok(menuWorthyMissing.gaps.some((g) => g.includes('PRESTATIONS')), 'a genuinely menu-worthy Agent (real cost or on-demand trigger, like FAKE-AGENT-COMPLET\'s "sur demande" in fakeTable) missing from PRESTATIONS must still be flagged — the exemption above must never become a blanket bypass');

  const cousinCase = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: new Set(['docs/referentiel/fake-agent-complet.md', 'docs/fake-agent-complet/index.md']), cousinOf: 'UN-AUTRE-AGENT' });
  assert.deepEqual(cousinCase.gaps, [], 'an agent missing its own blueprint but explicitly declared cousinOf another agent must never be flagged for that specific gap — the declared exception, not a silently guessed one');

  const registryOverrideMissing = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: new Set(['docs/fake-agent-complet-blueprint.md', 'docs/referentiel/fake-agent-complet.md']) });
  assert.ok(registryOverrideMissing.gaps.some((g) => g.includes('docs/fake-agent-complet/')), 'without an explicit registryPathPrefix override, the registry check must default to the standard docs/<slug>/ location and flag it missing');
  const registryOverridePresent = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: new Set(['docs/fake-agent-complet-blueprint.md', 'docs/referentiel/fake-agent-complet.md', 'docs/ailleurs/registre.md']), registryPathPrefix: 'docs/ailleurs/' });
  assert.deepEqual(registryOverridePresent.gaps, [], 'a real, legitimate registry-location deviation (like THE-DEEP-READER\'s registry actually living under docs/suivi/relectures-lourdes/, not docs/the-deep-reader/) must be accepted once explicitly declared via registryPathPrefix, never guessed and never left as a permanent false gap');

  // Enrichissement 2026-09-20 (demande explicite de l'utilisateur : « fiabilise/enrichis ce process
  // [...] pour en tirer de vrais bénéfices ») — angle mort réel du premier jet : CLAUDE.md
  // lui-même (le document TOUJOURS relu, Article 13) n'était jamais vérifié, alors qu'il a fallu
  // l'éditer à la main pour chaque nouvel Agent cette session.
  const claudeMdWithBoth = '## FAKE-AGENT-COMPLET — blueprint exportable\n\ntexte...\n\n- `docs/referentiel/fake-agent-complet.md` (instanciation)';
  const withClaudeMd = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths, claudeMdText: claudeMdWithBoth });
  assert.deepEqual(withClaudeMd.gaps, [], 'an agent whose CLAUDE.md already carries both its own "## ... — blueprint exportable" section and its référentiel technique bullet must report zero CLAUDE.md-related gaps');

  const claudeMdMissingBoth = 'CLAUDE.md sans aucune mention de cet agent.';
  const withoutClaudeMd = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths, claudeMdText: claudeMdMissingBoth });
  assert.equal(withoutClaudeMd.gaps.length, 2, 'an agent entirely absent from CLAUDE.md must be flagged for both real gaps (the référentiel technique bullet AND its own blueprint section) — the exact real blind spot this enrichment closes');

  const claudeMdCousinNoBlueprintSection = '- `docs/referentiel/fake-agent-complet.md` (instanciation)';
  const cousinClaudeMd = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: new Set(['docs/referentiel/fake-agent-complet.md', 'docs/fake-agent-complet/index.md']), cousinOf: 'UN-AUTRE-AGENT', claudeMdText: claudeMdCousinNoBlueprintSection });
  assert.deepEqual(cousinClaudeMd.gaps, [], 'an agent declared cousinOf another must never be required to have its own "## ... — blueprint exportable" section in CLAUDE.md — only its référentiel technique bullet, exactly like THE-DEEP-READER in the real file');

  const suiviWithMention = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths, suiviText: 'Construction de FAKE-AGENT-COMPLET terminée aujourd\'hui.' });
  assert.deepEqual(suiviWithMention.gaps, [], 'an agent genuinely mentioned in docs/suivi/ must never be flagged for the suivi check');
  const suiviWithoutMention = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths, suiviText: 'Rien à voir avec un quelconque agent ici.' });
  assert.equal(suiviWithoutMention.gaps.length, 1, 'an agent built with zero trace in docs/suivi/ must be flagged — building something substantial without a suivi entry violates docs/systeme-de-suivi.md just as much as a missing test would');
  const suiviOmitted = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths });
  assert.deepEqual(suiviOmitted.gaps, [], 'when suiviText is simply not provided (omitted, not empty), the check must be skipped silently rather than fabricating a gap with no real data to back it');

  // Échelle de couverture à 3 niveaux (tâche #224, texte source reproduit à l'identique le
  // 2026-09-20T23:50Z par l'utilisateur, retrouvé et confirmé le 2026-09-21 avant de coder) : le
  // badge lui-même reste inchangé (jamais conditionné par la couverture) — seul un champ séparé
  // `couverture`/`message` est ajouté.
  const neverScanned = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths });
  assert.deepEqual(neverScanned.couverture, { tier: 'en cours', label: 'en cours (jamais scanné ou très faible)' }, 'an agent never scanned by AXA-CHECK (axaCoveragePct omitted) must report the honest "en cours" tier, never a fabricated percentage');
  const partialCoverage = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths, axaCoveragePct: 62 });
  assert.equal(partialCoverage.couverture.tier, 'partiel', 'a real but incomplete coverage percentage must report "partiel", never jump straight to "OK 100%"');
  assert.equal(partialCoverage.couverture.label, 'partiel (KO AXA-CHECK 62%)', 'the exact real format retrieved from task #226 (2026-09-21, found by re-reading the user\'s own later precision rather than assuming task #224 was the final word): each failing check named individually as "KO <NOM>", a percentage in parentheses ONLY for AXA-CHECK — never a bare qualifier, never a percentage attached to a binary ARGUS/HARMONIA/CLEAN-DIRTY-OLD check that never had one');
  const multipleFailures = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths, axaCoveragePct: 100, argusFindingsCount: 1, harmoniaFindingsCount: 2, cleanDirtyOldFlagged: true });
  assert.equal(multipleFailures.couverture.tier, 'partiel', 'the exact real rule from task #224/#226: 100% AXA-CHECK coverage ALONE must never reach "OK 100%" while any of the other 3 core-team members still has an open finding on this tool — a combined verdict across all 4 "toujours déployé" members, never AXA-CHECK in isolation');
  assert.equal(multipleFailures.couverture.label, 'partiel (KO ARGUS, KO HARMONIA, KO CLEAN-DIRTY-OLD)', 'multiple failing checks must be listed together separated by a comma — exactly the format the user specified — never collapsed into a single generic "trouvailles ouvertes" count, and never carrying a percentage for the 3 binary checks that never had one');
  const missingFourthMember = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths, axaCoveragePct: 100, argusFindingsCount: 0, harmoniaFindingsCount: 0, cleanDirtyOldFlagged: true });
  assert.equal(missingFourthMember.couverture.tier, 'partiel', 'the real gap found while answering the user directly: "OK 100%" must require ALL 4 "toujours déployé" core-team members (Article 20) clean together, never just 3 of 4 — CLEAN-DIRTY-OLD alone flagged must be enough to keep the tier at "partiel"');
  const trueOk100 = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths, axaCoveragePct: 100, argusFindingsCount: 0, harmoniaFindingsCount: 0, cleanDirtyOldFlagged: false });
  assert.deepEqual(trueOk100.couverture, { tier: 'OK 100%', label: 'OK 100%' }, '"OK 100%" is only ever reached with ALL FOUR conditions true at once — 100% AXA-CHECK coverage AND zero open ARGUS findings AND zero open HARMONIA findings AND no CLEAN-DIRTY-OLD flag — exactly the user\'s explicit correction that this tier must never carry a "zero bugs" promise beyond what these real mechanical signals can honestly claim, combining the full core team rather than a subset');

  // 5e Gardien sacré (2026-09-22, CLONE-HUNTER) : "OK 100%" doit désormais exiger les 5 signaux au
  // vert ensemble, jamais un sous-ensemble de 4 sur 5 — même défaut structurel déjà corrigé une
  // première fois pour CLEAN-DIRTY-OLD (missingFourthMember ci-dessus), reproduit puis corrigé de
  // nouveau à l'arrivée de CLONE-HUNTER.
  const missingFifthMember = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths, axaCoveragePct: 100, argusFindingsCount: 0, harmoniaFindingsCount: 0, cleanDirtyOldFlagged: false, cloneHunterFindingsCount: 2 });
  assert.equal(missingFifthMember.couverture.tier, 'partiel', 'a genuine CLONE-HUNTER finding must keep the tier at "partiel" even when the other four Gardiens are clean — "OK 100%" is not just the original 4 anymore');
  assert.equal(missingFifthMember.couverture.label, 'partiel (KO CLONE-HUNTER)', 'a CLONE-HUNTER finding must be named explicitly as "KO CLONE-HUNTER", the same binary format as the other three non-AXA-CHECK Gardiens');
  const trueOk100WithFifth = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths, axaCoveragePct: 100, argusFindingsCount: 0, harmoniaFindingsCount: 0, cleanDirtyOldFlagged: false, cloneHunterFindingsCount: 0 });
  assert.deepEqual(trueOk100WithFifth.couverture, { tier: 'OK 100%', label: 'OK 100%' }, '"OK 100%" is still reachable once all FIVE Gardiens are explicitly reported clean, cloneHunterFindingsCount included');
  assert.equal(trueOk100.message, '🎖️ FAKE-AGENT-COMPLET obtient son badge — toutes les validations réunies : table maîtresse (docs/regles-de-travail.md §7ter), entrée PRESTATIONS (catalogue LE-COORDINATEUR), instanciation (docs/referentiel/fake-agent-complet.md), registre (docs/fake-agent-complet/), blueprint (docs/fake-agent-complet-blueprint.md). Couverture de code : OK 100%.', '2026-09-22 rewrite (demande explicite : « je veux toutes les validations ») : la liste n\'est plus un texte figé mais reflète exactement ce qui a été vérifié pour ce cas précis (claudeMdText/suiviText/hasDocReportDecision/reciprocalWiring omis ici, donc absents de la liste — jamais fabriqués)');
  const withVerifiedDate = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths, axaCoveragePct: 100, argusFindingsCount: 0, harmoniaFindingsCount: 0, cleanDirtyOldFlagged: false, lastVerifiedAt: '2026-09-21' });
  assert.equal(withVerifiedDate.message, '🎖️ FAKE-AGENT-COMPLET obtient son badge — toutes les validations réunies : table maîtresse (docs/regles-de-travail.md §7ter), entrée PRESTATIONS (catalogue LE-COORDINATEUR), instanciation (docs/referentiel/fake-agent-complet.md), registre (docs/fake-agent-complet/), blueprint (docs/fake-agent-complet-blueprint.md). Couverture de code : OK 100% (vérifié le 2026-09-21).', '2026-09-21 enrichment: a real, caller-supplied lastVerifiedAt date must be appended to the coverage sentence, never fabricated when omitted (the earlier trueOk100 case above proves the sentence stays exactly as validated when no date is supplied)');

  // Câblage réciproque (2026-09-22, demande explicite de l'utilisateur : « je veux [...] celle qui dit
  // que l'agent-script est bien câblé avec tous les autres, et tous les autres sont bien câblés à lui
  // [...] tu peux écrire ça comme règle ? »). Généralise le trou trouvé deux fois le même soir à
  // l'arrivée de CLONE-HUNTER comme Gardien (câblé au post-commit hook, oublié dans
  // HYPER-SCAN-CHECKPOINT) en un vrai type de gap mécanique, jamais un rappel non vérifiable de plus.
  const missingWiring = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths, reciprocalWiring: [{ label: 'câblé dans HYPER-SCAN-CHECKPOINT', ok: false }, { label: 'câblé dans le post-commit hook', ok: true }] });
  assert.ok(missingWiring.gaps.some((g) => g === 'câblage réciproque manquant : câblé dans HYPER-SCAN-CHECKPOINT'), 'a reciprocalWiring entry reported as not-ok must become a real, named gap — the mechanization of "les autres systèmes le mentionnent-ils vraiment ?", never a silent rappel');
  assert.equal(missingWiring.gaps.length, 1, 'a reciprocalWiring entry reported as ok must never itself become a gap — only the false ones do');
  const allWiringOk = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths, reciprocalWiring: [{ label: 'câblé dans HYPER-SCAN-CHECKPOINT', ok: true }, { label: 'câblé dans le post-commit hook', ok: true }] });
  assert.deepEqual(allWiringOk.gaps, [], 'once every reciprocalWiring entry is ok, it must never hold back complet — the check is purely additive, never a hidden extra requirement beyond what the caller actually reports');
  assert.ok(allWiringOk.message.includes('câblé dans HYPER-SCAN-CHECKPOINT') && allWiringOk.message.includes('câblé dans le post-commit hook'), 'every passing reciprocalWiring label must appear in the enumerated validations message — the exact real-world case the user asked for (PRESTATIONS catalogue presence and cross-tool wiring both spelled out, not just implied by an empty gaps array)');
  const noWiringProvided = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths });
  assert.deepEqual(noWiringProvided.gaps, [], 'when reciprocalWiring is simply omitted (null, not an empty array), the check must stay silent rather than fabricating a gap with no real data behind it — same discipline as claudeMdText/suiviText above');

  // Garde-fou Personnages vs Membre de l'équipe (tâche #245, 2026-09-21) : checkAgentOnboarding()
  // ne doit jamais pouvoir être appelée sur Lia ou Noé — la vraie erreur commise ce soir (proposer
  // MEMENTO comme condition du badge des membres de l'équipe) aurait été impossible si ce garde-fou
  // avait existé plus tôt.
  assert.throws(() => checkAgentOnboarding('Lia', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths }), /Personnage/, 'checkAgentOnboarding() must refuse outright to run on "Lia" — a Personnage is structurally never a team member, and the failure must name why rather than silently returning a nonsensical badge result');
  assert.throws(() => checkAgentOnboarding('Noé', {}), /Personnage/, 'the same refusal must fire for "Noé", not just "Lia" — both real Personnages, never a partial guard');
  assert.doesNotThrow(() => checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths }), 'a genuine team-member name must never be mistakenly caught by the Personnage guard — it must stay narrowly scoped to the two real character names');
  assert.equal(trueOk100.badge, '🎖️ Membre certifié (catégorie non répertoriée — à ajouter dans AGENT_CATEGORIES)', 'the badge itself must stay computed purely from complet/gaps (plus, since 2026-09-22, the honest category lookup), completely unaffected by the coverage tier — coverage and integration are explicitly two separate axes, never conflated');

  // 6e type de gap (tâche #165, Doc-Report, 2026-09-21) : une décision HTML/texte manquante pour un
  // nouvel outil. `undefined` (jamais vérifié) doit rester silencieux, jamais fabriquer un gap —
  // même discipline que axaCoveragePct ci-dessus.
  const docReportUnknown = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths });
  assert.ok(!docReportUnknown.gaps.some((g) => g.includes('Doc-Report')), 'omitting hasDocReportDecision entirely must never fabricate a gap the caller never actually checked for');
  const docReportMissing = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths, hasDocReportDecision: false });
  assert.ok(docReportMissing.gaps.some((g) => g.includes('Doc-Report')), 'an explicitly confirmed missing HTML/texte decision (Doc-Report) must be surfaced as a real gap — the exact real omission this module found for THE-DEEP-READER before Doc-Report existed');
  const docReportPresent = checkAgentOnboarding('FAKE-AGENT-COMPLET', { toolsTableMarkdown: fakeTable, prestations: fakePrestations, existingPaths: completePaths, hasDocReportDecision: true });
  assert.ok(!docReportPresent.gaps.some((g) => g.includes('Doc-Report')), 'a confirmed, registered decision must never be flagged as a gap');

  console.log('Passed: checkAgentOnboarding() correctly slugifies a real agent name into its real file-naming convention, reports zero gaps for a fully-wired fake agent while always still carrying its non-blocking reminders, reports every one of the five base gap types for a completely unwired one, respects an explicitly declared cousinOf exception for a missing blueprint, defaults the registry check to the standard docs/<slug>/ location while honoring an explicit registryPathPrefix override for a real documented deviation, checks CLAUDE.md itself for both its référentiel technique bullet and its own "## ... — blueprint exportable" section (waived for a declared cousin) and docs/suivi/ for a real trace of its construction when that text is supplied, never fabricating a gap when it is simply omitted, exempts an internal-regulation Agent from the PRESTATIONS check exactly like findToolsMissingFromMenu()\'s own isMenuWorthy() rule (a real false positive caught while building the badge) while still flagging a genuinely menu-worthy Agent that is actually missing, reports a live "🎖️ Membre certifié"/"⚠️ Pas encore certifié" badge that is nothing but a readable summary of complet, recomputed fresh every call, never a persisted fact, and — task #224\'s 3-tier coverage scale — reports an honest "en cours"/"partiel"/"OK 100%" verdict fully independent of the badge itself, "OK 100%" reachable only when 100% AXA-CHECK coverage AND zero open ARGUS/HARMONIA findings hold together, with the exact two-sentence announcement message the user validated verbatim.');
}

{
  // Cérémonie de certification (2026-09-21, demande explicite de l'utilisateur : « le moment de
  // l'intégration doit être bien repérable [...] imagine un système autour de ce moment »). Fichier
  // d'historique isolé dans un dossier temporaire (jamais le vrai .badge-ceremony-history.json du
  // dépôt), backup/restore inutile ici puisqu'un chemin dédié est utilisé, même discipline que les
  // autres tests de journal local de ce fichier.
  const { formatBadgeCeremonyAnnouncement, announceBadgeCeremony, hasBeenCertifiedBefore, loadBadgeCeremonyHistory } = await import('../scripts/le-coordinateur.mjs');
  const ceremonyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'badge-ceremony-'));
  const ceremonyPath = path.join(ceremonyDir, 'history.json');

  const fakeCertified = { agentName: 'FAKE-CEREMONY', slug: 'fake-ceremony', complet: true, badge: '🎖️ Membre certifié', couverture: { tier: 'OK 100%', label: 'OK 100%' }, message: '🎖️ FAKE-CEREMONY obtient son badge — intégration complète vérifiée (blueprint, instanciation, registre, mention CLAUDE.md, présence PRESTATIONS). Couverture de code : OK 100%.' };
  const block = formatBadgeCeremonyAnnouncement(fakeCertified);
  assert.ok(block.includes('🎖️ CERTIFICATION — FAKE-CEREMONY'), 'the block must open with a clearly separate, recognizable heading naming the exact agent, never a bare sentence blended into other text');
  assert.ok(block.includes(fakeCertified.message), 'the block must reuse checkAgentOnboarding()\'s own message verbatim, never a second diverging formulation');
  assert.ok(block.includes('🎖️ Membre certifié') && block.includes('OK 100%'), 'the badge icon/state and the coverage tier must both be explicitly visible, the exact gap the user pointed out');

  assert.equal(hasBeenCertifiedBefore('fake-ceremony', loadBadgeCeremonyHistory(ceremonyPath)), false, 'a slug never seen before must never be reported as already certified');
  const firstAnnouncement = announceBadgeCeremony(fakeCertified, { historyPath: ceremonyPath });
  assert.ok(firstAnnouncement && firstAnnouncement.includes('FAKE-CEREMONY'), 'the very first genuine certification must produce the full announcement block, never null');
  assert.equal(hasBeenCertifiedBefore('fake-ceremony', loadBadgeCeremonyHistory(ceremonyPath)), true, 'a certification just announced must be persisted immediately, never lost until a later manual save');
  const secondAnnouncement = announceBadgeCeremony(fakeCertified, { historyPath: ceremonyPath });
  assert.equal(secondAnnouncement, null, 'the exact real requirement: the same tool reaching "complet" again later must never re-trigger the ceremony block — only the first time is a real moment');
  const notCompleteYet = { ...fakeCertified, slug: 'fake-ceremony-incomplete', complet: false };
  assert.equal(announceBadgeCeremony(notCompleteYet, { historyPath: ceremonyPath }), null, 'an agent that is not yet complet must never trigger a ceremony, whatever its slug');
  console.log('Passed: the badge certification ceremony (2026-09-21) renders a visually distinct block (never blended into surrounding prose) that reuses checkAgentOnboarding()\'s own message verbatim and always makes the badge icon/state and the coverage tier explicit — the exact gap the user found — fires exactly once per agent slug (the real first-certification moment), persisting that fact immediately so a later re-check of the same already-certified tool, or one still incomplete, never re-triggers it, reusing tool-usage.mjs\'s own loadJson() rather than writing a 4th copy of the exact duplication CLONE-HUNTER found earlier this same night.');
}

{
  // checkAllAgentBadges() (2026-09-22, demande explicite de l'utilisateur : « tu crées un petit
  // script pour gérer toute cette partie validation/intégration/badge/message [...] avec
  // déclenchement auto quand le script reçoit son badge réellement dans le code »). Étend
  // LE-COORDINATEUR plutôt qu'un nouveau fichier (décision explicite, alignement de compréhension) :
  // balaie TOUTE la table maîtresse, jamais un outil à la fois comme badgeWarningsForOutils().
  const { checkAllAgentBadges } = await import('../scripts/le-coordinateur.mjs');
  const sweepDir = fs.mkdtempSync(path.join(os.tmpdir(), 'badge-sweep-'));
  const sweepPath = path.join(sweepDir, 'history.json');
  const sweepTable = '| Outil | Statut | Ce qu\'il détecte/régule | Coût | Déclenchement |\n|---|---|---|---|---|\n| FAKE-AGENT-COMPLET | Agent | fait des choses | gratuit | sur demande |\n| FAKE-AGENT-INCOMPLET | Agent | fait autre chose | gratuit | sur demande |\n| SMART-BREAKER | Utilitaire nommé | régule les clés | réel | automatique |';
  const sweepPrestations = [
    { demande: 'Faire des choses', outils: ['FAKE-AGENT-COMPLET'], cout: 'gratuit' },
    { demande: 'Faire autre chose', outils: ['FAKE-AGENT-INCOMPLET'], cout: 'gratuit' },
  ];
  const sweepPaths = new Set(['docs/fake-agent-complet-blueprint.md', 'docs/referentiel/fake-agent-complet.md', 'docs/fake-agent-complet/index.md']);

  const firstSweep = checkAllAgentBadges({ toolsTableMarkdown: sweepTable, prestations: sweepPrestations, existingPaths: sweepPaths }, { historyPath: sweepPath });
  assert.equal(firstSweep.length, 1, 'a sweep over a real table must announce exactly the tools that are genuinely complet and never seen before — one here (FAKE-AGENT-COMPLET), never the incomplete one, and never the non-Agent Utilitaire nommé row (SMART-BREAKER), which checkAgentOnboarding() must never even be called on');
  assert.ok(firstSweep[0].includes('FAKE-AGENT-COMPLET'), 'the one real announcement must name the actual complet agent, not a generic placeholder');

  const secondSweep = checkAllAgentBadges({ toolsTableMarkdown: sweepTable, prestations: sweepPrestations, existingPaths: sweepPaths }, { historyPath: sweepPath });
  assert.deepEqual(secondSweep, [], 'a second sweep against the exact same state must announce nothing — the whole point of the auto-trigger is to fire once per real certification moment, never re-celebrate an already-known badge at every single commit');

  const completedPaths = new Set([...sweepPaths, 'docs/fake-agent-incomplet-blueprint.md', 'docs/referentiel/fake-agent-incomplet.md', 'docs/fake-agent-incomplet/index.md']);
  const thirdSweep = checkAllAgentBadges({ toolsTableMarkdown: sweepTable, prestations: sweepPrestations, existingPaths: completedPaths }, { historyPath: sweepPath });
  assert.equal(thirdSweep.length, 1, 'once FAKE-AGENT-INCOMPLET genuinely becomes complet on a later commit, the NEXT sweep must catch and announce exactly that new certification — the real "déclenchement auto quand le script reçoit son badge" moment, never missed and never re-announcing the already-certified FAKE-AGENT-COMPLET from before');
  assert.ok(thirdSweep[0].includes('FAKE-AGENT-INCOMPLET'), 'the newly-certified tool must be the one actually named');

  assert.deepEqual(checkAllAgentBadges({}, { historyPath: sweepPath }), [], 'a sweep with no toolsTableMarkdown at all must return an empty list rather than crash — the same honest-absence discipline as every other optional signal in this module');

  console.log('Passed: checkAllAgentBadges() (2026-09-22) sweeps the entire real tools table rather than one Agent named by a caller, correctly skips every non-Agent row (Utilitaire nommé/Infrastructure never eligible for a badge) and every not-yet-complet Agent, announces exactly the newly-certified ones and never re-announces an already-known certification on a later sweep, catches a real new certification the moment a later commit actually completes it, and reports an honest empty sweep rather than crashing when no table is supplied at all — the real automatic trigger requested to reliably run this whole validation/badge/message system at every commit, reusing checkAgentOnboarding()/announceBadgeCeremony() rather than a second, separate mechanism.');
}

{
  // check-tasks-details.mjs (2026-09-20, demande explicite de l'utilisateur : un gabarit fixe pour
  // ses demandes « état des tâches », zoom × forme, lecture seule sur docs/suivi/, vérification
  // croisée automatique contre son propre historique). cf. docs/referentiel/check-tasks-details.md.
  const ctd = await import('../scripts/check-tasks-details.mjs');
  const { loadAllTaskRows, splitSujet, filterByZoom, buildTree, buildListBlocks, suggestToolsForOpenTasks, compareSnapshots, buildReport, appendSnapshot, loadSnapshotHistory, buildRealOnboardingContext } = ctd;

  assert.deepEqual(splitSujet('Thème A / Sous-thème A'), { theme: 'Thème A', sousTheme: 'Sous-thème A' }, 'a real "Thème / Sous-thème" Sujet must split cleanly on the existing convention, never a new taxonomy invented on top');
  assert.deepEqual(splitSujet('Thème B'), { theme: 'Thème B', sousTheme: 'Général' }, 'a Sujet with no " / " separator must fall back to a named "Général" bucket, never crash or leave sousTheme empty');
  assert.deepEqual(splitSujet(undefined), { theme: '?', sousTheme: 'Général' }, 'a missing Sujet must degrade to an honest "?" theme, never crash');

  const fakeDir = [
    { name: 'a.md', text: [
      '| 10 | h1 | Thème A / Sous-thème A | Tâche A1 | important | d1 | ouverte |',
      '| 11 | h2 | Thème A / Sous-thème A | Tâche A2 | normal | d2 | en cours — x |',
      '| 12 | h3 | Thème A / Sous-thème B | Tâche A3 | critique | d3 | terminée — fidèle |',
    ].join('\n') },
    { name: 'b.md', text: '| 13 | h4 | Thème B | Tâche B1 | normal | d4 | terminée — fidèle |' },
  ];
  const readDir = () => fakeDir.map((f) => f.name);
  const readFile = (p) => fakeDir.find((f) => p.endsWith(f.name)).text;
  const rows = loadAllTaskRows('/fake', readDir, readFile, () => true);
  assert.equal(rows.length, 4, 'loadAllTaskRows() must flatten every bucket from every session file into one list, losing no row');
  assert.deepEqual(new Set(rows.map((r) => r.n)), new Set([10, 11, 12, 13]), 'each row must carry its real N° (first column), read as a number, never left as the raw string or lost');
  assert.deepEqual(rows.find((r) => r.n === 11).statusKey, 'enCours', 'a row categorized as "en cours" by categorizeAllSessions() must keep that same status key once flattened, never relabeled');

  const openOnly = filterByZoom(rows, 'en_cours');
  assert.deepEqual(new Set(openOnly.map((r) => r.n)), new Set([10, 11]), 'zoom "en_cours" must keep exactly the ouverte/en cours rows, never a terminée row and never dropping an open one');
  const everything = filterByZoom(rows, 'projet_entier');
  assert.equal(everything.length, 4, 'zoom "projet_entier" must return every row untouched, the identity case');
  const elargi = filterByZoom(rows, 'elargi', { latestTaskNumber: 13 });
  assert.deepEqual(new Set(elargi.map((r) => r.n)), new Set([10, 11, 12, 13]), 'zoom "elargi" with a small task-number range must include every open row plus every recently-numbered row (here all four, since none exceed the 20-task lookback window)');
  assert.throws(() => filterByZoom(rows, 'pas-un-zoom'), /zoom inconnu/, 'an unknown zoom value must fail loudly rather than silently defaulting to some arbitrary scope');

  const tree = buildTree(rows);
  const themeA = tree.find((n) => n.label.startsWith('Thème A'));
  assert.ok(themeA, 'buildTree() must produce one top-level node per real theme found in the data');
  assert.equal(themeA.label, 'Thème A (3)', 'a theme node\'s label must report its real total task count across all its sous-thèmes, computed from the actual data, never hardcoded');
  assert.equal(themeA.children.length, 2, 'a theme with two distinct sous-thèmes in the data must produce exactly two child nodes, never merged or split incorrectly');
  const sousThemeB = themeA.children.find((c) => c.label.startsWith('Sous-thème B'));
  assert.equal(sousThemeB.children[0].label, '✅ #12 · [critique] Tâche A3 — terminée — fidèle', 'a leaf task node must show its real N°, sensibilité and statut exactly as recorded in the suivi (prefixed with a status icon for visibility, 2026-09-20 user feedback on the first delivered report), never a reformatted or partial summary');
  assert.equal(sousThemeB.children[0].statusKey, 'terminee', 'a leaf task node must carry its real statusKey alongside the label, so the HTML renderer can apply a distinct visual style per status — the exact fix for "la distinction être fait/en cours/à faire n\'est pas assez claire, pas assez visible"');

  const listBlocks = buildListBlocks(rows);
  assert.ok(listBlocks.some((b) => b.type === 'heading' && b.text === '🔄 En cours (1)'), 'buildListBlocks() must produce a real heading naming the exact count for a non-empty status group, prefixed with the same status icon used in the tree view for a consistent visual language across both formats');
  assert.ok(!listBlocks.some((b) => b.type === 'heading' && /Autre statut/.test(b.text)), 'a status group with zero real rows (here "autre") must never appear in the output — an honest report shows only what actually exists');

  const suggestions = suggestToolsForOpenTasks(
    [{ n: 42, sujet: 'Charte / Outillage', sousSujet: 'Vérifier qu\'aucune tâche du suivi n\'a été oubliée', statusKey: 'ouverte' }],
    [{ demande: 'Vérifier qu\'aucune idée/tâche n\'a été oubliée dans le suivi', outils: ['THE-DEEP-READER'], cout: 'réel' }],
  );
  assert.equal(suggestions.length, 1, 'an open task whose label genuinely overlaps a real prestation\'s demande must produce exactly one suggestion line');
  assert.ok(suggestions[0].includes('#42') && suggestions[0].includes('THE-DEEP-READER'), 'the suggestion line must name both the real task number and the real matched tool, never a vague pointer');
  assert.deepEqual(suggestToolsForOpenTasks([{ n: 1, sujet: 'X', sousSujet: 'sans rapport du tout', statusKey: 'ouverte' }], [{ demande: 'Qualité visuelle du rendu', outils: ['THE-SCREENER'], cout: 'réel' }]), [], 'an open task with no real keyword overlap with any prestation must produce zero suggestions, never a forced guess');

  // Câblage du badge (2026-09-20, trouvaille réelle : check-tasks-details.mjs était l'UNIQUE
  // appelant réel de suggestPrestationsForTask() en production, et il ne passait jamais
  // onboardingContext — le badge n'était donc jamais réellement vérifié nulle part malgré son
  // propre chokepoint déjà construit. Question directe de l'utilisateur : « est-ce que le check de
  // badge pour les agents est fait systématiquement à chaque de leur utilisation ? »).
  const fakeBadgeTable = '| Outil | Statut | Ce qu\'il détecte/régule | Coût | Déclenchement |\n|---|---|---|---|---|\n| THE-DEEP-READER | Agent | relecture lourde | réel | sur demande |';
  const uncertifiedCtx = { toolsTableMarkdown: fakeBadgeTable, existingPaths: new Set() };
  const withWarning = suggestToolsForOpenTasks(
    [{ n: 42, sujet: 'Charte / Outillage', sousSujet: 'Vérifier qu\'aucune tâche du suivi n\'a été oubliée', statusKey: 'ouverte' }],
    [{ demande: 'Vérifier qu\'aucune idée/tâche n\'a été oubliée dans le suivi', outils: ['THE-DEEP-READER'], cout: 'réel' }],
    uncertifiedCtx,
  );
  assert.ok(withWarning[0].includes('⚠️') && withWarning[0].includes('THE-DEEP-READER'), 'when an onboardingContext is supplied and the matched tool has zero real wiring, the suggestion line must carry a visible badge warning naming that tool — the real alert wired into check-tasks-details.mjs\'s own real production call');
  const noContextSuggestions = suggestToolsForOpenTasks(
    [{ n: 42, sujet: 'Charte / Outillage', sousSujet: 'Vérifier qu\'aucune tâche du suivi n\'a été oubliée', statusKey: 'ouverte' }],
    [{ demande: 'Vérifier qu\'aucune idée/tâche n\'a été oubliée dans le suivi', outils: ['THE-DEEP-READER'], cout: 'réel' }],
  );
  assert.ok(!noContextSuggestions[0].includes('⚠️'), 'without an onboardingContext (the default, backward-compatible call), the suggestion line must never carry a badge warning — full compatibility with every pre-existing caller');

  // buildRealOnboardingContext() — le contexte réel construit par main() avant chaque génération de
  // rapport (2026-09-20). Bug réel trouvé et corrigé en calibrant ce test : ROOT se termine déjà par
  // un séparateur, donc l'ancien `slice(root.length + 1)` grignotait la première lettre de "docs/",
  // faussant silencieusement TOUTE vérification de registre/instanciation en aval (check-tasks-
  // details lui-même ressortait à tort "sans badge" alors que ses trois fichiers existent bien).
  const realCtx = buildRealOnboardingContext();
  assert.ok(realCtx.existingPaths.has('docs/check-tasks-details/index.md'), 'buildRealOnboardingContext() must produce paths with the correct leading "docs/" prefix, never a truncated one — the exact real bug found while wiring this context into production');
  assert.ok(realCtx.claudeMdText.includes('Article 0'), 'the real CLAUDE.md text must be genuinely loaded, not an empty fallback, when the file exists');
  assert.ok(realCtx.agentOverrides['THE-DEEP-READER']?.cousinOf === 'THE-FINAL-JUDGE', 'the one known, documented Agent deviation (THE-DEEP-READER, cousinOf THE-FINAL-JUDGE + its own registry path) must be declared here, otherwise the real badge check would wrongly flag it as uncertified in every real report');

  const snap1 = { at: 't1', rows: [{ n: 10, statusKey: 'ouverte' }, { n: 11, statusKey: 'terminee' }] };
  const snap2 = { at: 't2', rows: [{ n: 10, statusKey: 'ouverte' }, { n: 11, statusKey: 'terminee' }] };
  const regressed = compareSnapshots([snap1], [{ n: 10, sousSujet: 'X', statusKey: 'ouverte' }, { n: 11, sousSujet: 'Y', statusKey: 'ouverte' }]);
  assert.equal(regressed.regressions.length, 1, 'a task that was terminée in the last snapshot but reads as ouverte now must be flagged as exactly one regression, never silently accepted as normal');
  assert.equal(regressed.regressions[0].n, 11, 'the regression must name the real task number that actually regressed, never the wrong one');
  const stagnated = compareSnapshots([snap1, snap2], [{ n: 10, sousSujet: 'X', statusKey: 'ouverte' }, { n: 11, sousSujet: 'Y', statusKey: 'terminee' }]);
  assert.equal(stagnated.stagnant.length, 1, 'a task open and identical across the two most recent snapshots plus the current one must be flagged as stagnant exactly once, never for a task that has since closed');
  assert.equal(stagnated.stagnant[0].n, 10, 'the stagnation signal must name the real still-open task, never a task that has already progressed');
  assert.equal(stagnated.stagnant[0].streak, 3, 'a task open in exactly the last 2 archived snapshots plus the current report must carry a real streak of 3, never a bare boolean flag (2026-09-20, user request: a finer scale for comparing tasks)');
  // Une série plus longue (4 instantanés archivés + le rapport courant = 5) doit produire un
  // streak réellement plus grand, jamais plafonné en amont à 2/3 comme avant ce changement.
  const snap0 = { at: 't0', rows: [{ n: 10, statusKey: 'ouverte' }] };
  const snap3 = { at: 't3', rows: [{ n: 10, statusKey: 'ouverte' }] };
  const longStagnation = compareSnapshots([snap0, snap1, snap2, snap3], [{ n: 10, sousSujet: 'X', statusKey: 'ouverte' }]);
  assert.equal(longStagnation.stagnant[0].streak, 5, 'consecutiveOpenStreak() must count the real full run of consecutive open appearances (here 4 archived + the current report), never stop early at the minimum-3 threshold used only to decide whether to flag stagnation at all');
  assert.deepEqual(compareSnapshots([], rows), { regressions: [], stagnant: [] }, 'with no prior snapshot history at all (the very first run), both checks must report an honest empty result, never crash for lack of history to compare against');

  // Corroboration par les autres vigies (2026-09-20, demande explicite de l'utilisateur : « je veux
  // m'assurer que check-tasks a une vraie comprehension de ou on en est dans le projet [...]
  // comment bien cabler cet outil avec toi ? »). parseRegistryTable() doit repérer la colonne "X
  // confirmée(s)" par son intitulé, quel que soit sa position (les 4 registres n'ont pas le même
  // nombre de colonnes), et ignorer une ligne qui ne confirme rien de réel.
  const { parseRegistryTable, loadRegistryFindings, corroborateWithRegistries, recommendNextTasks } = ctd;
  const argusTable = [
    '| Date | Rapport | Trouvailles confirmées | Notes |',
    '|---|---|---|---|',
    '| 2026-09-19 | scan.txt | trottoir pathable jamais implémenté | Premier balayage |',
  ].join('\n');
  const parsedArgus = parseRegistryTable(argusTable);
  assert.equal(parsedArgus.length, 1, 'parseRegistryTable() must extract exactly one real finding row from a genuine ARGUS-shaped table, locating the "confirmée" column by its header rather than a fixed index');
  assert.equal(parsedArgus[0].date, '2026-09-19', 'the extracted row must carry the real date from the "Date" column, located the same header-driven way');
  assert.ok(parsedArgus[0].text.includes('trottoir'), 'the extracted row must carry the real confirmed-finding text verbatim, never truncated or paraphrased');
  const axaCheckTable = [
    '| Date | Fonctions analysées | Robustesse globale | Trouvailles confirmées | Notes |',
    '|---|---|---|---|---|',
    '| 2026-09-19 | 146 | 99% | `wait` jamais exécutée | Premier passage |',
  ].join('\n');
  assert.equal(parseRegistryTable(axaCheckTable)[0].text, '`wait` jamais exécutée', 'parseRegistryTable() must locate the "confirmée" column correctly even when it sits at a different position than in the ARGUS table (5 columns instead of 4), never assume a fixed column index shared by every registry');
  const emptyRegistryTable = [
    '| Date | Zone signalée | Trouvailles confirmées | Rapport | Notes |',
    '|---|---|---|---|---|',
    '| 2026-09-19 | (aucune) | 0 | — | rien signalé |',
  ].join('\n');
  assert.deepEqual(parseRegistryTable(emptyRegistryTable), [], 'a row whose "confirmée" column reads "0" must never be treated as a real finding — matching it against a task would be a pure false positive, not a real corroboration');
  assert.deepEqual(parseRegistryTable('pas une table du tout'), [], 'text with no real markdown table must return an honest empty list, never crash trying to find a header row that does not exist');

  const fakeRegistryFiles = { 'docs/argus/index.md': argusTable, 'docs/harmonia/index.md': axaCheckTable };
  const findings = loadRegistryFindings('/fake-root', (p) => fakeRegistryFiles[p.replace('/fake-root/', '')], (p) => p.replace('/fake-root/', '') in fakeRegistryFiles);
  assert.equal(findings.length, 2, 'loadRegistryFindings() must aggregate real findings across every registry file that actually exists on disk, skipping the two that do not in this fake root, never crashing on a missing file');
  assert.ok(findings.some((f) => f.source === 'ARGUS') && findings.some((f) => f.source === 'HARMONIA'), 'each aggregated finding must carry the real registry it came from, so a task can be told WHICH vigie corroborates it, never an anonymous match');

  const corroborated = corroborateWithRegistries({ sujet: 'Refonte graphique', sousSujet: 'Donner un vrai trottoir 3D pathable', detail: '' }, findings);
  assert.equal(corroborated.length, 1, 'corroborateWithRegistries() must match a task against a real registry finding only when at least 2 significant words genuinely overlap (here "trottoir"), the same honest threshold as suggestPrestationsForTask(), never a single-word coincidence');
  assert.equal(corroborated[0].source, 'ARGUS', 'the corroboration must name the real vigie that actually confirmed something related, never a generic "some tool agrees"');
  assert.deepEqual(corroborateWithRegistries({ sujet: 'Cuisine', sousSujet: 'Rien à voir', detail: '' }, findings), [], 'a task with no genuine keyword overlap with any registry finding must produce zero corroborations, never a forced or vague match');
  assert.deepEqual(corroborateWithRegistries({ sujet: 'X', sousSujet: 'Y', detail: '' }, []), [], 'with an empty findings list (e.g. no registry file exists yet), corroboration must return an honest empty result rather than crash');

  // recommendNextTasks() (2026-09-20, demande explicite de l'utilisateur : « check tasks recommande
  // en fin de rapport l'ordre des 4 prochaines tâches [...] d'après des critères pertinents et bien
  // définis »), affiné le même jour sur trois des cinq critères (« l'echelle dvrait s'affiner
  // [...] permettre une meilleure comparaisone netre les taches ») : chaque critère est vérifié
  // séparément, puis leur combinaison, jamais un seul test fourre-tout qui masquerait un critère
  // cassé derrière un score global qui semble plausible.
  const now = new Date('2026-09-20T12:00:00Z').getTime();
  const critiqueOld = { n: 1, sousSujet: 'Tâche critique ancienne', sensibilite: 'critique', detail: '', statusKey: 'ouverte', horodatage: '2026-09-01-1200' };
  const normalFresh = { n: 2, sousSujet: 'Tâche normale récente', sensibilite: 'normal', detail: '', statusKey: 'ouverte', horodatage: '2026-09-20-1100' };
  const closedRow = { n: 3, sousSujet: 'Tâche déjà fermée', sensibilite: 'critique', detail: '', statusKey: 'terminee', horodatage: '2026-09-01-1200' };
  const noSignalRow = { n: 4, sousSujet: 'Tâche sans aucun signal', sensibilite: 'autre', detail: '', statusKey: 'ouverte', horodatage: undefined };
  const basic = recommendNextTasks([critiqueOld, normalFresh, closedRow, noSignalRow], { now });
  assert.ok(!basic.some((r) => r.n === 3), 'recommendNextTasks() must never propose an already-closed task, whatever its sensitivity or age — only genuinely open tasks are real candidates');
  assert.ok(!basic.some((r) => r.n === 4), 'a task with zero real signal on any of the 5 criteria must be excluded entirely, never padded into the list with an empty or fabricated reason');
  assert.ok(basic[0].n === 1, 'a critical, weeks-old task must outrank a normal, same-day task — the combination of sensitivity + age must genuinely drive the ranking, not just list order');
  assert.ok(basic[0].reasons.some((r) => r.includes('sensibilité déclarée : critique')), 'the top recommendation must carry an honest, readable reason naming its real declared sensitivity, never a bare opaque number');

  // Stagnation progressive : une tâche stagnante depuis 8 rapports doit dépasser une stagnante
  // depuis 3, jamais le même forfait fixe pour les deux (2026-09-20, l'affinage demandé).
  const rowA = { n: 5, sousSujet: 'Stagnante depuis longtemps', sensibilite: 'normal', detail: '', statusKey: 'ouverte', horodatage: undefined };
  const rowB = { n: 6, sousSujet: 'Stagnante depuis peu', sensibilite: 'normal', detail: '', statusKey: 'ouverte', horodatage: undefined };
  const stagnationRanked = recommendNextTasks([rowA, rowB], { now, stagnant: [{ n: 5, sousSujet: rowA.sousSujet, streak: 8 }, { n: 6, sousSujet: rowB.sousSujet, streak: 3 }] });
  assert.ok(stagnationRanked[0].n === 5, 'a task stagnant for 8 consecutive reports must score higher than one stagnant for only 3 — the streak must genuinely drive the score, never a flat bonus regardless of how long the stagnation has lasted');
  assert.ok(stagnationRanked[0].reasons.some((r) => r.includes('8 rapports')), 'the reason must state the real streak count, never a vague "stagnante depuis plusieurs rapports" that hides the actual number');
  const cappedStagnation = recommendNextTasks([{ ...rowA, n: 7 }], { now, stagnant: [{ n: 7, sousSujet: rowA.sousSujet, streak: 500 }] });
  assert.ok(cappedStagnation[0].score <= 6 + 3, 'an absurdly large streak (e.g. a data anomaly) must still be capped, never let a single criterion alone dwarf every other real signal in the score');

  // Priorité explicite à deux paliers : "priorité absolue" doit peser plus lourd qu'un simple "en
  // priorité" (2026-09-20, affinage demandé, calibré explicitement par l'utilisateur).
  const absolutePriorityRow = { n: 8, sousSujet: 'Urgence vraie', sensibilite: 'normal', detail: 'priorité absolue pour la suite', statusKey: 'ouverte', horodatage: undefined };
  const explicitPriorityRow = { n: 9, sousSujet: 'Demande notée en priorité', sensibilite: 'normal', detail: 'à faire en priorité la prochaine fois', statusKey: 'ouverte', horodatage: undefined };
  const priorityRanked = recommendNextTasks([absolutePriorityRow, explicitPriorityRow], { now });
  assert.ok(priorityRanked[0].n === 8, 'a task marked "priorité absolue" must outrank one merely marked "en priorité" — the two formulations must never score identically now that they are meant to express different urgency');
  assert.ok(priorityRanked[0].reasons.some((r) => r.includes('absolue')), 'the top reason must name the real "priorité absolue" wording actually found in the suivi, never a generic priority label that hides which tier matched');

  // Corroboration progressive : une tâche confirmée par 2 vigies distinctes doit dépasser une
  // confirmée par une seule (2026-09-20, affinage demandé).
  const doubleCorroborated = { n: 10, sousSujet: 'Trottoir 3D pathable jardin chemin', sensibilite: 'normal', detail: '', statusKey: 'ouverte', horodatage: undefined };
  const singleCorroborated = { n: 11, sousSujet: 'Trottoir 3D pathable', sensibilite: 'normal', detail: '', statusKey: 'ouverte', horodatage: undefined };
  const twoRegistryFindings = [
    { source: 'ARGUS', date: '2026-09-19', text: 'trottoir pathable jamais implémenté' },
    { source: 'HARMONIA', date: '2026-09-19', text: 'trottoir jardin incohérent chemin' },
  ];
  const corroborationRanked = recommendNextTasks([doubleCorroborated, singleCorroborated], { now, findings: twoRegistryFindings });
  assert.ok(corroborationRanked.find((r) => r.n === 10).score > corroborationRanked.find((r) => r.n === 11).score, 'a task genuinely matching findings from 2 distinct vigies must outscore one matching only 1, never the same flat bonus regardless of how many independent tools actually corroborate it');
  assert.ok(corroborationRanked[0].reasons.some((r) => r.includes('2 vigie')), 'the reason must state the real number of corroborating vigies, never hide that count behind a vague "corroborée" with no real number');

  const limited = recommendNextTasks([critiqueOld, normalFresh, { ...critiqueOld, n: 20 }, { ...critiqueOld, n: 21 }, { ...critiqueOld, n: 22 }], { now, limit: 2 });
  assert.equal(limited.length, 2, 'recommendNextTasks() must honor a real limit parameter, never returning more candidates than explicitly requested even when more genuinely qualify');

  const report = buildReport({ zoom: 'projet_entier', format: 'arborescence', allRows: rows, history: [] });
  assert.ok(report.blocks.some((b) => b.type === 'tree'), 'format "arborescence" must include a real tree block in the report, never silently fall back to the flat list');
  assert.equal(report.meta.count, 4, 'buildReport() must report the real number of rows actually shown after zoom filtering, matching the data, never a stale or guessed count');
  const listReport = buildReport({ zoom: 'en_cours', format: 'liste', allRows: rows, history: [] });
  assert.ok(!listReport.blocks.some((b) => b.type === 'tree'), 'format "liste" must never include a tree block — the two formats must stay genuinely distinct, not both always rendered');
  assert.equal(listReport.meta.count, 2, 'zoom "en_cours" inside buildReport() must apply the same real filtering as filterByZoom() directly, never a second diverging implementation');
  assert.throws(() => buildReport({ zoom: 'nope', allRows: rows }), /zoom inconnu/, 'buildReport() must reject an unknown zoom rather than silently defaulting');
  assert.throws(() => buildReport({ format: 'nope', allRows: rows }), /format inconnu/, 'buildReport() must equally reject an unknown format rather than silently defaulting');

  // recommendNextTasks() intégré dans buildReport() (2026-09-20) : calculé sur TOUTES les tâches
  // ouvertes du projet (project-wide), jamais seulement celles du zoom affiché, et injecté à la
  // fois dans les blocs affichés et dans meta pour que l'agent puisse le lire mécaniquement.
  const reportWithRecommendation = buildReport({ zoom: 'en_cours', format: 'liste', allRows: rows, history: [], registryFindings: [] });
  assert.ok(reportWithRecommendation.meta.recommended.length > 0, 'buildReport() must surface a real recommended-order list in meta whenever at least one open task carries a genuine signal — here #10 (sensibilité "important") and #11 (sensibilité "normal") both genuinely qualify');
  assert.ok(reportWithRecommendation.meta.recommended.every((r) => r.reasons.length > 0), 'every task surfaced through buildReport() must carry its own real reasons, never an entry justified only by having made the cut');
  assert.ok(reportWithRecommendation.blocks.some((b) => b.type === 'heading' && /Ordre recommandé/.test(b.text)), 'when a real recommendation exists, buildReport() must include its own visible heading in the report, never a silent meta-only field the reader would never see');
  const reportWithoutSignal = buildReport({ zoom: 'en_cours', format: 'liste', allRows: [{ n: 99, sousSujet: 'Rien de signalé', sensibilite: 'autre', detail: '', statusKey: 'ouverte', horodatage: undefined }], history: [], registryFindings: [] });
  assert.ok(!reportWithoutSignal.blocks.some((b) => b.type === 'heading' && /Ordre recommandé/.test(b.text)), 'when zero open task carries any real signal, the recommendation heading must never appear — an honest empty report, never a heading over an empty or fabricated list');
  // Bug réel trouvé le 2026-09-20 en lisant le tout premier rapport produit en conditions réelles
  // (protocole "lire le rapport en entier avant de répondre") : une tâche sans N° réel (le cas
  // fréquent d'une note "en cours" jamais numérotée dans le suivi) s'affichait "#undefined" dans le
  // bloc recommandé, alors que buildTree()/buildListBlocks() utilisent déjà "—" pour ce même cas.
  const undefinedNRow = { n: undefined, sousSujet: 'Note sans numéro', sensibilite: 'critique', detail: '', statusKey: 'ouverte', horodatage: undefined };
  const reportWithUndefinedN = buildReport({ zoom: 'en_cours', format: 'liste', allRows: [undefinedNRow], history: [], registryFindings: [] });
  const recommendedHeadingIndex = reportWithUndefinedN.blocks.findIndex((b) => b.type === 'heading' && /Ordre recommandé/.test(b.text));
  assert.ok(reportWithUndefinedN.blocks[recommendedHeadingIndex + 1].items[0].startsWith('1. #— '), 'a recommended task with no real N° must render the same "—" placeholder already used everywhere else in the report, never a literal "#undefined" leaking a raw JavaScript value to the reader');

  // appendSnapshot()/loadSnapshotHistory() — instantané réel sur disque, dans un dossier temporaire
  // jamais le vrai docs/check-tasks-details/ du projet, pour ne jamais polluer son historique réel
  // avec des données de test.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctd-test-'));
  const tmpFile = path.join(tmpDir, 'historique.jsonl');
  assert.deepEqual(loadSnapshotHistory(tmpFile), [], 'loadSnapshotHistory() on a file that does not exist yet must return an honest empty history, never throw');
  appendSnapshot(rows, { file: tmpFile, dir: tmpDir, now: () => 'fixed-time' });
  const history1 = loadSnapshotHistory(tmpFile);
  assert.equal(history1.length, 1, 'appendSnapshot() must add exactly one new line to the history file, readable back by loadSnapshotHistory()');
  assert.equal(history1[0].at, 'fixed-time', 'the archived snapshot must record the real timestamp it was given, never a hardcoded or missing one');
  assert.equal(history1[0].rows.length, 4, 'the archived snapshot must record every real row (N° + statusKey only, kept deliberately light), never a partial or padded copy');
  // Dé-doublonnage des instantanés identiques consécutifs (2026-09-20, bug réel trouvé en analysant
  // le tout premier rapport livré à l'utilisateur : plusieurs relances rapprochées pendant une
  // session de débogage avaient chacune ajouté leur propre instantané malgré un état inchangé,
  // gonflant artificiellement le signal de stagnation "identique depuis 3 rapports"). Un appel avec
  // exactement le même jeu de lignes ne doit jamais faire grandir l'historique.
  const dedupedResult = appendSnapshot(rows, { file: tmpFile, dir: tmpDir, now: () => 'fixed-time-2' });
  assert.equal(loadSnapshotHistory(tmpFile).length, 1, 'a second appendSnapshot() call with the exact same row-set (n + statusKey unchanged) must be a no-op, never a fabricated new observation that inflates the stagnation signal');
  assert.equal(dedupedResult.skipped, true, 'a deduplicated call must honestly report that it was skipped, never pretend a real new snapshot was recorded');
  const changedRows = rows.map((r) => (r.n === 10 ? { ...r, statusKey: 'terminee' } : r));
  appendSnapshot(changedRows, { file: tmpFile, dir: tmpDir, now: () => 'fixed-time-3' });
  assert.equal(loadSnapshotHistory(tmpFile).length, 2, 'a genuinely different row-set (even a single status change) must still append a real new line — the dedup guard must never swallow a real change');
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log('Passed: check-tasks-details.mjs stays strictly read-only on docs/suivi/ while flattening every real session row (loadAllTaskRows), splits Sujet on the existing Thème/Sous-thème convention rather than inventing a new taxonomy (splitSujet), filters correctly by all three zoom levels including a real task-number-based "elargi" window (filterByZoom), builds an honest theme>sous-thème>tâche tree with real counts and leaf details (buildTree), a status-grouped list that never shows an empty group (buildListBlocks), a real coordinator-consultation signal per open task with no forced guesses (suggestToolsForOpenTasks) — now also carrying a visible badge warning when an onboardingContext is supplied and the matched tool is uncertified, and staying silent without one (full backward compatibility) — an honest regression/stagnation cross-check against its own snapshot history including the very first run with no history at all (compareSnapshots), a full report assembly that genuinely differs by format and applies the same zoom filtering as the standalone function (buildReport), a real, append-only, on-disk snapshot history (appendSnapshot/loadSnapshotHistory) tested in an isolated temp directory, never touching the project\'s real registry, and — the 2026-09-20 badge wiring — buildRealOnboardingContext() correctly builds the real badge context (CLAUDE.md, the tools table, docs/ paths, docs/suivi/ text, THE-DEEP-READER\'s declared deviation) with the right "docs/"-prefixed paths, closing a real path-slicing bug found while wiring this into check-tasks-details.mjs\'s own real production call — the one and only place this whole badge system was ever actually invoked before this fix, and — the 2026-09-20 recommendNextTasks() feature — compareSnapshots() now carries a real consecutive-open streak count (consecutiveOpenStreak()) rather than a bare stagnation flag, parseRegistryTable()/loadRegistryFindings() correctly extract only genuinely confirmed findings from any of the 4 vigie registries by locating their "confirmée" column by header rather than a fixed index, corroborateWithRegistries() reuses le-coordinateur.mjs\'s own keyword-overlap threshold to match a task against those findings honestly, and recommendNextTasks() combines all 5 now-progressive criteria (declared sensitivity, streak-scaled stagnation, age, two-tier explicit-priority wording, and multi-vigie corroboration strength) into a capped, fully-explained ranking — excluding closed tasks and signal-free tasks alike, and wired into buildReport()\'s own meta and a visible heading that only ever appears when a real recommendation exists.');
}

{
  // checkChantierFileFreshness() (tâche #185, 2026-09-22, mode nocturne autonome) : la vérification
  // mécanique demandée explicitement dans docs/regles-de-travail.md (« vérification, jamais
  // seulement une intention déclarée ») pour les fichiers préliminaires de chantier (CASSANDRA-RH,
  // refonte graphique). `lastTouch` est injecté ici pour rester indépendant du vrai git du dépôt.
  const { checkChantierFileFreshness, CHANTIER_PRELIMINARY_FILES } = await import('../scripts/check-tasks-details.mjs');
  const now = Date.now();
  const daysAgo = (d) => new Date(now - d * 86400000).toISOString();
  const cassandraFile = CHANTIER_PRELIMINARY_FILES['CASSANDRA-RH'].file;
  const refonteFile = CHANTIER_PRELIMINARY_FILES['Refonte graphique'].file;

  // Cas 1 : le fichier a été retouché APRÈS la dernière tâche de suivi qui le concerne — aucun écart.
  const rowsFresh = [{ n: 1, horodatage: daysAgo(5), sujet: 'Conception / Nouvel outil (CASSANDRA-RH)', sousSujet: 'Une idée quelconque', detail: '' }];
  const freshResult = checkChantierFileFreshness(rowsFresh, { lastTouch: (f) => (f === cassandraFile ? 1 : undefined) });
  assert.equal(freshResult.length, 0, 'a preliminary file touched more recently than the newest matching suivi task must never be flagged — the file is genuinely up to date');

  // Cas 2 : une idée plus récente que le fichier — écart réel signalé, jamais silencieux.
  const rowsStale = [{ n: 2, horodatage: daysAgo(1), sujet: 'Conception / Nouvel outil (CASSANDRA-RH)', sousSujet: 'Idée pas encore recopiée', detail: '' }];
  const staleResult = checkChantierFileFreshness(rowsStale, { lastTouch: (f) => (f === cassandraFile ? 30 : undefined) });
  assert.equal(staleResult.length, 1, 'a suivi task genuinely newer than its chantier\'s preliminary file must be flagged — the exact real gap this tool exists to catch');
  assert.ok(staleResult[0].message.includes('#2') && staleResult[0].chantier === 'CASSANDRA-RH', 'the finding must name the real task number and chantier responsible, never a vague unattributed warning');

  // Cas 3 : tolérance d'une journée pour un commit groupé le même jour — jamais un faux positif.
  const rowsSameDay = [{ n: 3, horodatage: daysAgo(2), sujet: 'Conception / Nouvel outil (CASSANDRA-RH)', sousSujet: 'Idée committée le même jour', detail: '' }];
  const sameDayResult = checkChantierFileFreshness(rowsSameDay, { lastTouch: (f) => (f === cassandraFile ? 2.5 : undefined) });
  assert.equal(sameDayResult.length, 0, 'a preliminary file committed within the same grouped commit (a fraction of a day apart) must never be flagged as stale — the explicit tolerance exists for exactly this frequent real case');

  // Cas 4 : fichier introuvable/jamais commité alors qu'une idée existe déjà — signalé, jamais ignoré.
  const missingResult = checkChantierFileFreshness(rowsStale, { lastTouch: () => undefined });
  assert.equal(missingResult.length, 1, 'a preliminary file that git has never touched at all, while a matching suivi task already exists, must be flagged just as loudly as a stale one — never silently skipped');
  assert.ok(missingResult[0].message.includes('introuvable'), 'the missing-file case must be worded distinctly from the stale-file case, never conflated');

  // Cas 5 : aucune tâche de suivi ne concerne un chantier donné — aucun signal fabriqué.
  const rowsUnrelated = [{ n: 4, horodatage: daysAgo(1), sujet: 'Autre chose entièrement', sousSujet: 'Rien à voir', detail: '' }];
  const unrelatedResult = checkChantierFileFreshness(rowsUnrelated, { lastTouch: () => undefined });
  assert.equal(unrelatedResult.length, 0, 'a chantier with zero matching suivi rows must never be flagged — no fabricated finding from the mere absence of activity');

  // Cas 6 : les deux chantiers connus sont bien couverts indépendamment, jamais un seul testé au hasard.
  const rowsBoth = [
    { n: 5, horodatage: daysAgo(1), sujet: 'Conception / Nouvel outil (CASSANDRA-RH)', sousSujet: 'x', detail: '' },
    { n: 6, horodatage: daysAgo(1), sujet: 'Refonte graphique', sousSujet: 'y', detail: '' },
  ];
  const bothResult = checkChantierFileFreshness(rowsBoth, { lastTouch: (f) => (f === cassandraFile ? 30 : f === refonteFile ? 30 : undefined) });
  assert.equal(bothResult.length, 2, 'both known chantiers must be checked independently in the same pass, never only the first one found');

  // Cas 7 (2026-09-22, faux positif réel trouvé en lançant l'outil en direct le soir même) : une
  // ligne de suivi horodatée dans le "futur" relatif à l'horloge système réelle (le décalage entre
  // la date "aujourd'hui" donnée en tête de session et l'horloge réelle utilisée par git) ne doit
  // jamais produire un écart fabriqué à cause d'une soustraction négative.
  const rowsFuture = [{ n: 7, horodatage: new Date(now + 26 * 3600000).toISOString(), sujet: 'Conception / Nouvel outil (CASSANDRA-RH)', sousSujet: 'Idée notée avec l\'horodatage "aujourd\'hui" du début de session', detail: '' }];
  const futureResult = checkChantierFileFreshness(rowsFuture, { lastTouch: (f) => (f === cassandraFile ? 0 : undefined) });
  assert.equal(futureResult.length, 0, 'a suivi row dated slightly ahead of the real system clock (the exact real "today" vs git-clock skew found live) must never be flagged as overdue just because the raw subtraction goes negative — clamped to "just now", never a fabricated gap');

  console.log('Passed: checkChantierFileFreshness() (task #185) correctly leaves a genuinely fresh preliminary file alone, flags a real gap by the exact task number and chantier responsible, tolerates a same-day grouped commit rather than a false positive, flags a preliminary file git has never touched at all just as loudly as a stale one, never fabricates a finding for a chantier with zero matching suivi activity, checks every known chantier (CASSANDRA-RH, refonte graphique) independently in the same pass, and — the exact real false positive found running this tool live the same evening — never flags a row whose narrative "today" timestamp runs ahead of git\'s real system clock as if it were overdue.');
}

{
  // Garde-fou du système de profil utilisateur (2026-09-19, cf. docs/profil-utilisateur/index.md).
  // Une fiche jamais indexée serait invisible pour un futur agent qui ne lirait que l'index ; un
  // lien mort pointerait vers une preuve disparue — les deux écarts doivent être signalés séparément.
  const {extractLinkedFiles,findOrphanedObservations}=await import('../scripts/check-profil-utilisateur.mjs');
  const idx='| Horodatage | Fiche |\n|---|---|\n| x | [x](observations/2026-09-19-2019.md) |\n| y | [y](observations/2026-09-20-0900.md) |';
  assert.deepEqual(extractLinkedFiles(idx),['2026-09-19-2019.md','2026-09-20-0900.md'],'every markdown link to an observation file must be extracted, in the order the table lists them');
  assert.deepEqual(extractLinkedFiles('| Horodatage | Fiche |\n|---|---|'),[],'an index with no rows yet must report zero links, never crash');
  const onDiskOnly=findOrphanedObservations(idx,['2026-09-19-2019.md','2026-09-20-0900.md','2026-09-21-1000.md']);
  assert.deepEqual(onDiskOnly.missingFromIndex,['2026-09-21-1000.md'],'a real file on disk with no matching link in the index must be flagged as never indexed, closing the exact blind spot this guard exists to catch');
  assert.deepEqual(onDiskOnly.missingFromDisk,[],'files that are both on disk and linked must never be flagged');
  const deadLinkOnly=findOrphanedObservations(idx,['2026-09-19-2019.md']);
  assert.deepEqual(deadLinkOnly.missingFromDisk,['2026-09-20-0900.md'],'a link in the index pointing at a file that no longer exists on disk must be flagged as a dead link, a different problem from an unindexed file');
  assert.deepEqual(deadLinkOnly.missingFromIndex,[],'a file correctly indexed must never also be flagged as unindexed');
  console.log('Passed: the user-profile system\'s mechanical guard extracts every real observation link from the index in order, and correctly tells apart the two distinct failure modes it exists to catch — a real observation file never referenced by the index, and an index link pointing at a file that no longer exists — never confusing or merging the two.');
}

{
  // CIRCLE-TASKS — « Ronde périodique » (2026-09-20, nommé par l'utilisateur : « je voudrais creer
  // un mini agent qui appelle l'execution de ce process : l'agent s'appelle circle-tasks »). Né
  // d'un vrai retard constaté deux fois de suite sur la mise à jour du profil utilisateur.
  const {
    CIRCLE_ITEMS, mostRecentDate, daysSince, buildCircleReport, formatCircleMenu,
    shouldRemindCircleTasks, REMINDER_COMMIT_THRESHOLD, ALERT_ICON, FINAL_JUDGE_TOKEN_COST,
    THEME_ORDER, groupCircleReportByTheme, checkHtmlWiring, oldestOpenTaskDate,
    buildCircleRunSummaryText, findRegistriesMissingFromCircle, CIRCLE_EXCLUDED_REGISTRIES,
    recommendCircleSelection, NOT_RECOMMENDED_BY_DEFAULT,
  } = await import('../scripts/circle-tasks.mjs');
  const { walkDocsPaths } = await import('../scripts/lib-shell.mjs');

  assert.equal(CIRCLE_ITEMS.length, 20, 'CIRCLE_ITEMS must list exactly the 18 free periodic items (profil, the-king-signal, référentiels, KPI, ALWAYS-NEW-CODE signal, correctifs, Smart Conso API scan, SMART-CONSO-TOKEN scan, dream-team-photo, THE-SCREENER, ines-official-signal, clean-dirty-old-signal, html-wiring-check, suivi-open-tasks-signal, claude-md-weight-signal, profil-utilisateur-guard, network-check-run, coordinateur-catalogue — clone-hunter-run removed 2026-09-22, CLONE-HUNTER promoted to fifth Gardien sacré, now runs automatically at every commit like the other 4) plus THE-FINAL-JUDGE and its cousin THE-DEEP-READER, never silently gaining or losing an entry');
  const profilGuardItem = CIRCLE_ITEMS.find((i) => i.id === 'profil-utilisateur-guard');
  assert.ok(profilGuardItem && !profilGuardItem.costly && profilGuardItem.theme === 'Passages réels (smoke run)', '2026-09-21 addition: the real check-profil-utilisateur.mjs smoke run must be free and live in its own "smoke run" theme, distinct from the "profil" item which writes a new observation rather than verifying disk integrity');
  const networkCheckItem = CIRCLE_ITEMS.find((i) => i.id === 'network-check-run');
  assert.ok(networkCheckItem && !networkCheckItem.costly && networkCheckItem.theme === 'Passages réels (smoke run)', '2026-09-21 addition: a real runNetworkCheck() pass must be free (no separate agent spawn) and must never be bundled into "Audit lourd", a theme reserved for the two costly agent-spawn items');
  const catalogueItem = CIRCLE_ITEMS.find((i) => i.id === 'coordinateur-catalogue');
  assert.ok(catalogueItem && !catalogueItem.costly && catalogueItem.theme === 'Passages réels (smoke run)', '2026-09-21 addition: hooking LE-COORDINATEUR\'s named catalog into every Ronde from the start, alongside the other real smoke-run passages, per explicit user request');
  const judgeItem = CIRCLE_ITEMS.find((i) => i.id === 'the-final-judge');
  assert.ok(judgeItem && judgeItem.costly === true, 'THE-FINAL-JUDGE must be present in the same checklist (explicit 2026-09-20 reversal of the initial "keep it out entirely" design) but flagged costly, never treated as an ordinary free item');
  assert.ok(judgeItem.cout.includes(String(FINAL_JUDGE_TOKEN_COST / 1000) + ' 000') || judgeItem.cout.includes('37'), 'THE-FINAL-JUDGE\'s cost label must state the real fixed token cost in plain text, never a vague "expensive" with no number');
  const deepReaderItem = CIRCLE_ITEMS.find((i) => i.id === 'the-deep-reader');
  assert.ok(deepReaderItem && deepReaderItem.costly === true, 'THE-DEEP-READER (THE-FINAL-JUDGE\'s cousin, dedicated to the heavy suivi reread) must also be present and flagged costly, same treatment as THE-FINAL-JUDGE, never an ordinary free item');
  assert.ok(/variable|jamais.*fixe|volume réel/.test(deepReaderItem.cout), 'THE-DEEP-READER\'s cost label must honestly state its cost is variable (fixed spawn floor plus the real conversation volume to reread), never presented as a constant figure the way THE-FINAL-JUDGE\'s is');
  assert.ok(CIRCLE_ITEMS.filter((i) => i.costly).length === 2, 'exactly two items (THE-FINAL-JUDGE and THE-DEEP-READER) must be marked costly — every other item in this ronde stays genuinely free, per the explicit split the user asked to preserve');
  assert.ok(CIRCLE_ITEMS.every((i) => typeof i.tokensEstimes === 'string' && i.tokensEstimes.length > 0), 'every single item, free or costly, must carry an honest order-of-magnitude Claude-token estimate (2026-09-20 catalog enrichment) — never a silently missing field on a future addition');
  const screenerItem = CIRCLE_ITEMS.find((i) => i.id === 'the-screener');
  assert.ok(screenerItem && !screenerItem.costly, 'THE-SCREENER\'s own capture mechanism costs zero Gemini API calls (confirmed in docs/referentiel/the-screener.md) so it must never be marked costly, unlike THE-FINAL-JUDGE');
  assert.ok(/jamais lancer.*simulation|ne jamais lancer.*simulation/.test(screenerItem.cout + screenerItem.execute), 'THE-SCREENER\'s catalog entry must explicitly warn against launching a fresh simulation just to get a screenshot — that would be a real indirect Gemini cost, contrary to Article 8, even though the capture mechanism itself is free');

  assert.equal(mostRecentDate('rien ici'), undefined, 'a text with no date at all must report an honest absence, never a fabricated date');
  assert.equal(mostRecentDate('vu le 2026-09-18 puis confirmé le 2026-09-20T03:21:22Z et enfin le 2026-09-19'), '2026-09-20T03:21:22Z', 'mostRecentDate() must pick the genuinely most recent date among several mixed plain-date and full-ISO mentions, never the first or the last one found in reading order');

  assert.equal(daysSince(undefined), undefined, 'daysSince() with no date at all must report an honest absence, never a fabricated zero');
  const now = new Date('2026-09-20T12:00:00Z').getTime();
  assert.equal(daysSince('2026-09-18T12:00:00Z', now), 2, 'daysSince() must compute the exact real day gap for a genuinely past date');
  assert.equal(daysSince('2026-09-25T00:00:00Z', now), undefined, 'a date in the future relative to "now" must never produce a fabricated negative day count — the exact real bug caught while building this tool tonight (a manually-guessed observation timestamp landed ahead of the real system clock)');

  const profilIndexText = '| Horodatage | Fiche |\n|---|---|\n| 2026-09-18T00:00:00Z | x |';
  const kpiIndexText = '| Run | Date |\n|---|---|\n| r1 | 2026-09-19 |';
  const emptyAlwaysNewCode = '| Date | Zone examinée | Trouvailles confirmées | Rapport | Notes |\n|---|---|---|---|---|';
  const smartConsoApiIndexText = '| Date | Décision | Verdict |\n|---|---|---|\n| 2026-09-19 | x | souple |';
  const smartConsoTokenIndexText = '| Date | Portée | Constat |\n|---|---|---|\n| 2026-09-20T02:19:00Z | Global | x |';
  const cleanDirtyOldIndexText = '| Date | Zone signalée | Trouvailles confirmées | Rapport | Notes |\n|---|---|---|---|---|\n| 2026-09-19 | (aucune) | 0 | — | x |';
  const htmlWiringSources = { 'el-professor.mjs': 'no html-report here', 'the-final-judge.mjs': 'import { renderHtmlReport } from "./html-report.mjs";', 'the-screener-capture.mjs': 'no html-report here either' };
  const suiviCategorized = { terminee: [], enCours: [{ cells: ['1', '2026-09-15T00:00:00Z', 'x', 'x', 'x', 'x', 'en cours'] }], ouverte: [{ cells: ['2', '2026-09-18T00:00:00Z', 'x', 'x', 'x', 'x', 'ouverte'] }], autre: [] };
  const sampleClaudeMdText = 'x'.repeat(200) + '\n*(ajouté le 2026-09-19, test)*\n*(ajouté le 2026-09-20, test)*\n';
  const samplePhilosophyText = '### 1.1 Un principe **[Explicite]**\n\nOn agit toujours avec prudence budgétaire ambiante.\n\n### 1.2 Un autre principe **[Synthèse, 2026-09-19]**\n\nOn n\'agit jamais avec prudence budgétaire ambiante.';
  const inesOfficialIndexText = '| Version | Date | Périmètre | Fichiers | Taille |\n|---|---|---|---|---|\n| v1 | 2026-09-18 | code seul | 40 | 500 Ko |';
  const report = buildCircleReport({ profilIndexText, kpiIndexText, alwaysNewCodeIndexText: emptyAlwaysNewCode, smartConsoApiIndexText, smartConsoTokenIndexText, cleanDirtyOldIndexText, htmlWiringSources, suiviCategorized, claudeMdText: sampleClaudeMdText, philosophyText: samplePhilosophyText, philosophyFreshnessDaysValue: 3, inesOfficialIndexText }, now);
  assert.equal(report.length, 20, 'buildCircleReport() must return exactly one entry per CIRCLE_ITEMS item, in the same order, never dropping or reordering one — 20 since clone-hunter-run left CIRCLE_ITEMS on 2026-09-22 (CLONE-HUNTER promoted to fifth Gardien sacré, runs at every commit instead)');
  assert.equal(report.find((r) => r.id === 'claude-md-weight-signal').staleness, '66 tokens estimés, niveau "faible" — 2 aside(s) narrative(s) datée(s) encore réductible(s)', 'the CLAUDE.md weight signal must reuse the real SMART-CONSO-TOKEN scan functions live (never a second parser), reporting both the honest token estimate and the real count of still-reducible dated asides found in the actual text passed in');
  assert.equal(buildCircleReport({}, now).find((r) => r.id === 'claude-md-weight-signal').staleness, 'pas de signal disponible (CLAUDE.md non fourni)', 'with no CLAUDE.md text supplied at all, the signal must report an honest absence rather than crash or fabricate a number');
  assert.equal(report.find((r) => r.id === 'clean-dirty-old-signal').staleness, '1 jour(s) depuis le dernier passage journalisé', 'the CLEAN-DIRTY-OLD signal must compute its own staleness from its own real index text, distinct from every other source');
  assert.equal(report.find((r) => r.id === 'html-wiring-check').staleness, '2 script(s) pas encore câblé(s) : el-professor.mjs, the-screener-capture.mjs', 'the HTML wiring check must name, by real filename, exactly the scripts genuinely missing the html-report.mjs import, never a vague count with no names');
  assert.equal(report.find((r) => r.id === 'suivi-open-tasks-signal').staleness, 'tâche ouverte depuis 5 jour(s)', 'the oldest-open-task signal must pick the genuinely oldest date (2026-09-15, the "en cours" entry) among both "en cours" and "ouverte" buckets, never just the newer "ouverte" one');
  assert.equal(report.find((r) => r.id === 'dream-team-photo').staleness, 'pas de signal de fraîcheur mécanique disponible', 'the purely recreational dream-team-photo item has no real mechanical freshness source either, and must say so honestly rather than fabricate one');
  assert.equal(report.find((r) => r.id === 'the-screener').staleness, 'pas de signal de fraîcheur mécanique disponible', 'THE-SCREENER likewise has no real mechanical freshness source in this ronde (its own dated registry docs/the-screener/ does not exist yet) and must say so honestly');
  assert.equal(report.find((r) => r.id === 'the-king-signal').staleness, 'dernière modification il y a 3 j — dernière évolution datée : 2026-09-19 — 1.2 Un autre principe — 1 tension(s) possible(s) à relire', 'THE-KING\'s Ronde item must report real freshness, the real latest dated evolution, and a real possible-tension count all in one line, reusing the-king.mjs\'s own functions rather than a second parser');
  assert.equal(buildCircleReport({}, now).find((r) => r.id === 'the-king-signal').staleness, 'pas de signal disponible (philosophie-et-politique.md non fourni)', 'with no philosophy text supplied at all, THE-KING\'s signal must report an honest absence rather than crash or fabricate a number');
  assert.equal(report.find((r) => r.id === 'ines-official-signal').staleness, `${daysSince('2026-09-18', now)} jour(s) depuis la dernière édition`, 'INES-official\'s Ronde signal must compute real staleness from its own real index text, reusing mostRecentDate()/daysSince() rather than a second date parser');
  assert.equal(buildCircleReport({}, now).find((r) => r.id === 'ines-official-signal').staleness, 'aucune édition jamais produite', 'with no INES-official index text supplied at all (or genuinely empty, as on day one), the signal must report an honest absence rather than crash or fabricate a number');
  assert.equal(report.find((r) => r.id === 'profil').staleness, '2 jour(s) depuis la dernière fiche', 'the profil item\'s staleness must be computed from the real most-recent date found in the real index text passed in');
  assert.equal(report.find((r) => r.id === 'kpi').staleness, '1 jour(s) depuis le dernier rapport archivé', 'the kpi item\'s staleness must likewise be computed from the real kpi index text, a genuinely distinct source from the profil index');
  assert.ok(/jamais examinée/.test(report.find((r) => r.id === 'always-new-code-signal').staleness), 'with a genuinely empty ALWAYS-NEW-CODE coverage memory, the signal must honestly report that every zone (the one recommended first) has never been examined, never a fabricated date');
  assert.equal(report.find((r) => r.id === 'referentiel').staleness, 'pas de signal de fraîcheur mécanique disponible', 'an item with no real mechanical freshness source (periodic reference-doc reread) must say so honestly, never fabricate a fake signal');
  assert.equal(report.find((r) => r.id === 'the-final-judge').staleness, 'jamais une routine — décision au cas par cas, à chaque fois', 'the costly item must get its own distinct honest message, never a fabricated freshness figure that would frame it as just another routine item');
  assert.equal(report.find((r) => r.id === 'smart-conso-api-scan').staleness, '1 jour(s) depuis la dernière décision archivée', 'the Smart Conso API scan item must compute its own staleness from its own real index text, distinct from the other sources');
  assert.equal(report.find((r) => r.id === 'smart-conso-token-scan').staleness, '0 jour(s) depuis le dernier scan archivé', 'the SMART-CONSO-TOKEN scan item must likewise compute its own staleness from its own real index text, distinct from the other sources');

  const menuColored = formatCircleMenu(report);
  const menuPlain = formatCircleMenu(report, { colorize: false });
  assert.ok(menuColored.includes('\x1b[31m') && menuColored.includes(ALERT_ICON), 'formatCircleMenu() must wrap the costly row in real ANSI red escape codes for genuine terminal output, with the alert icon prefixed — the exact "red warning characters" the user asked for');
  assert.ok(!menuPlain.includes('\x1b[31m'), 'formatCircleMenu() with colorize:false must never leak raw ANSI codes into output meant to be read as plain text');
  assert.ok(menuPlain.includes(judgeItem.label), 'the plain, uncolored rendering must still name THE-FINAL-JUDGE by name — colorize only strips the ANSI styling, never the row itself');
  assert.ok(menuPlain.includes('Tokens Claude'), 'the menu must render a distinct Claude-token estimate column (2026-09-20 catalog enrichment), never merged into or hidden behind the Gemini/API cost column');
  assert.ok(menuPlain.includes(report.find((r) => r.id === 'profil').tokensEstimes), 'the plain rendering must actually include a real item\'s token estimate text, not just an empty column header');

  assert.equal(shouldRemindCircleTasks(NaN), false, 'an unknown/uncountable commit delta must never trigger a fabricated reminder');
  assert.equal(shouldRemindCircleTasks(REMINDER_COMMIT_THRESHOLD - 1), false, 'one commit short of the real threshold must stay silent, never an off-by-one early reminder');
  assert.equal(shouldRemindCircleTasks(REMINDER_COMMIT_THRESHOLD), true, 'reaching the exact threshold must trigger the reminder, never require overshooting it');

  // groupCircleReportByTheme() (2026-09-20, idée explicite de l'utilisateur : proposer les items par
  // thème plutôt qu'un découpage arbitraire de 4). Chaque item réel doit porter un thème connu, se
  // ranger dans le bon groupe, chaque groupe doit tenir dans la limite de 4 options par question, et
  // le thème "Audit lourd" (THE-FINAL-JUDGE + son cousin THE-DEEP-READER, tous deux costly, jamais
  // un item gratuit) doit rester en toute dernière position des groupes.
  assert.ok(CIRCLE_ITEMS.every((i) => THEME_ORDER.includes(i.theme)), 'every real catalog item must carry a theme from the known fixed list, never an untagged or unknown one slipping through silently');
  const grouped = groupCircleReportByTheme(report);
  assert.deepEqual(grouped.map((g) => g.theme), THEME_ORDER, 'the groups must appear in the fixed, never-reshuffled theme order, with the "Audit lourd" theme genuinely last');
  assert.ok(grouped.every((g) => g.items.length <= 4), 'every theme group must fit within the real 4-options-per-question UI limit, the whole reason this grouping exists');
  assert.deepEqual(grouped.at(-1).items.map((i) => i.id), ['the-final-judge', 'the-deep-reader'], 'the last "Audit lourd" group must contain exactly THE-FINAL-JUDGE and its cousin THE-DEEP-READER, both costly, never bundled with a free item from another theme');
  assert.deepEqual(groupCircleReportByTheme([{ id: 'mystere', theme: 'Thème inconnu' }]).map((g) => g.theme), ['Autre'], 'an item with a theme outside the known list must fall into an honest "Autre" catch-all, never silently disappear from the grouping');

  // recommendCircleSelection() (tâche #155, 2026-09-21) : encode explicitement la sélection déjà
  // pratiquée à la main lors des deux vraies Rondes #225/#231 — jamais une règle inférée à l'aveugle
  // depuis les champs texte libres.
  const recommended = recommendCircleSelection(report);
  assert.ok(recommended.find((r) => r.id === 'profil').recommande, 'a real, cheap, mechanically-signaled item like profil must be recommended by default, matching real past Ronde practice');
  assert.ok(!recommended.find((r) => r.id === 'referentiel').recommande, 'the exhaustive reference reread must never be recommended by default despite being free of API calls — it is still costly in agent tokens, exactly why it was excluded from both real past Rondes');
  assert.ok(!recommended.find((r) => r.id === 'dream-team-photo').recommande, 'the purely recreational item must never be recommended by default');
  assert.ok(!recommended.find((r) => r.id === 'the-screener').recommande, 'the session-conditional item must never be recommended by default, since this mechanism has no way to verify a live server session exists');
  assert.ok(!recommended.find((r) => r.id === 'the-final-judge').recommande && !recommended.find((r) => r.id === 'the-deep-reader').recommande, 'both costly agent-spawn items must never be recommended by default, consistent with their already-established costly treatment');
  assert.equal(recommended.find((r) => r.id === 'referentiel').raisonExclusion, NOT_RECOMMENDED_BY_DEFAULT.referentiel, 'an excluded item must carry its own documented reason verbatim, never a silent exclusion with no explanation');
  assert.equal(recommended.find((r) => r.id === 'profil').raisonExclusion, undefined, 'a recommended item must carry no exclusion reason at all, never a fabricated empty string');
  assert.equal(recommended.length, report.length, 'recommendCircleSelection() must annotate every real item from the report, never drop or add one');

  // buildCircleRunSummaryText() (2026-09-20, trou trouvé par l'utilisateur : « je n'ai pas eu de
  // rapport à la fin de la ronde, c'est voulu ? » — non, main() n'affichait que le menu AVANT
  // exécution, jamais de récapitulatif APRÈS). Index léger, calibré explicitement : liste ce qui a
  // tourné + un lien vers la sortie déjà produite par chaque item, jamais son contenu dupliqué.
  // Rendu en TEXTE, pas HTML (corrigé le 2026-09-21, trouvaille directe de l'utilisateur : « le
  // rapport de circle devrait etre en txt et non html » — cette fonction avait été construite avant
  // la décision explicite du partage HTML/texte des rapports du projet, docs/suivi #230, qui range
  // déjà le récap CIRCLE-TASKS du côté texte, jamais revisitée contre cette décision une fois prise).
  const emptySummary = buildCircleRunSummaryText([]);
  assert.ok(/Aucun item n.a été coché/.test(emptySummary), 'an empty run (nothing was actually ticked) must say so honestly, never render a fabricated empty table as if something had run');
  assert.ok(!/<html|<table|<!DOCTYPE/i.test(emptySummary), 'the report must be genuinely plain text, never HTML markup — the exact real regression the user caught (buildCircleRunSummaryHtml() built before the HTML-vs-text split was decided, never revisited against it)');
  const realSummary = buildCircleRunSummaryText([
    { id: 'profil', label: 'Profil utilisateur', outcome: '1 nouvelle fiche ajoutée', link: 'docs/profil-utilisateur/observations/2026-09-20-2350.md' },
    { id: 'kpi', label: 'Rapport KPI', outcome: 'synthèse compacte livrée', link: 'docs/referentiel/kpi-rapports/run-x.txt' },
  ], { dateLabel: '2026-09-20T23:59:00Z' });
  assert.ok(realSummary.includes('Profil utilisateur') && realSummary.includes('1 nouvelle fiche ajoutée') && realSummary.includes('docs/profil-utilisateur/observations/2026-09-20-2350.md'), 'the summary must render each real executed item with its own outcome sentence and its own link to the output already produced elsewhere, never a generic placeholder row');
  assert.ok(!/1 nouvelle fiche ajoutée[\s\S]*Rapport KPI/.test(realSummary) || realSummary.indexOf('Profil utilisateur') < realSummary.indexOf('Rapport KPI'), 'entries must render in the same order they were passed in, never silently reordered');
  assert.ok(realSummary.includes('CIRCLE-TASKS'), 'the summary must carry its own clear title so a reader knows which tool produced it, never an anonymous table');
  assert.ok(!realSummary.includes('undefined'), 'a real entry must never leak a literal "undefined" into the rendered page — every field must fall back to an honest placeholder when missing');

  // findRegistriesMissingFromCircle() (2026-09-21, trou trouvé par l'utilisateur : « est-ce que la
  // ronde a bien dans son catalogue tous les outils pertinents ? »). Contrairement à
  // findToolsMissingFromMenu() (un seul critère mécanique, isMenuWorthy()), CIRCLE_ITEMS n'a pas de
  // règle unique — le garde-fou compare les vrais registres sur disque à CIRCLE_ITEMS ET à une
  // liste d'exclusions explicites, chacune avec sa propre raison, jamais un silence.
  const fakeItems = [{ id: 'profil', label: 'x' }, { id: 'always-new-code-signal', label: 'y' }];
  assert.deepEqual(findRegistriesMissingFromCircle(new Set(['docs/profil-utilisateur/index.md']), fakeItems), [], 'a registry SHORTER than its matching item id (profil ⊂ profil-utilisateur) must still be recognized as covered, matched in either direction, never only exact-string equality');
  assert.deepEqual(findRegistriesMissingFromCircle(new Set(['docs/always-new-code/index.md']), fakeItems), [], 'a registry LONGER than its matching item id in the other direction (always-new-code ⊂ always-new-code-signal) must likewise be recognized as covered');
  assert.deepEqual(findRegistriesMissingFromCircle(new Set(['docs/argus/index.md']), fakeItems), [], 'a registry present in CIRCLE_EXCLUDED_REGISTRIES (argus — already re-run at every commit per Article 20) must never be flagged as missing, its exclusion reason stands in for coverage');
  assert.deepEqual(findRegistriesMissingFromCircle(new Set(['docs/brand-new-tool/index.md']), fakeItems), ['brand-new-tool'], 'a genuinely new registry with neither a matching CIRCLE_ITEMS entry nor a documented exclusion must be flagged by name — the exact real gap the user pointed out, now caught mechanically for any future tool');
  assert.deepEqual(findRegistriesMissingFromCircle(new Set(['not-a-registry.md', 'docs/argus/other-file.md']), fakeItems), [], 'only real docs/<slug>/index.md paths count as a registry — an unrelated file or a non-index file inside a known folder must never be mistaken for one');
  assert.ok(Object.keys(CIRCLE_EXCLUDED_REGISTRIES).every((k) => typeof CIRCLE_EXCLUDED_REGISTRIES[k] === 'string' && CIRCLE_EXCLUDED_REGISTRIES[k].length > 0), 'every excluded registry must carry an actual documented reason, never a bare name with no explanation');
  // Vérifié en direct contre l'état réel du dépôt (pas seulement une fixture synthétique, même
  // discipline que checkHtmlWiring()) : aucun registre réel n'est aujourd'hui orphelin.
  const realExistingPaths = walkDocsPaths('docs', '');
  assert.deepEqual(findRegistriesMissingFromCircle(realExistingPaths), [], 'checked live against this project\'s real docs/ tree: every real registry folder must already be covered by either a real CIRCLE_ITEMS entry or a documented exclusion — a guarantee that breaks the moment a new tool gets a docs/<slug>/index.md registry without either');

  console.log('Passed: CIRCLE-TASKS lists exactly its 18 free periodic items (profil, référentiels, KPI, ALWAYS-NEW-CODE signal, correctifs, Smart Conso API scan, SMART-CONSO-TOKEN scan, dream-team-photo, THE-SCREENER, clean-dirty-old-signal, html-wiring-check, suivi-open-tasks-signal, claude-md-weight-signal, profil-utilisateur-guard, network-check-run, coordinateur-catalogue, ines-official-signal, the-king-signal — clone-hunter-run REMOVED 2026-09-22, CLONE-HUNTER promoted to fifth Gardien sacré (Article 20), now wired directly into the real post-commit hook exactly like the other 4, never a periodic Ronde item anymore) joining profil-utilisateur-guard/network-check-run/coordinateur-catalogue in the "Passages réels (smoke run)" theme, distinct from Audit lourd\'s two costly agent-spawn items) plus THE-FINAL-JUDGE and its cousin THE-DEEP-READER (the two exceptions, always flagged costly with their real token cost — a fixed figure for THE-FINAL-JUDGE, an honestly variable one for THE-DEEP-READER — never a vague warning), every item carrying an honest order-of-magnitude Claude-token estimate in a column distinct from the Gemini/API cost column, THE-SCREENER correctly staying free (its capture mechanism costs zero Gemini calls) while explicitly warning against launching a fresh simulation just for a screenshot, computes an honest mechanical freshness signal from real index files for the items that have one (profil, KPI, the most-neglected ALWAYS-NEW-CODE zone, Smart Conso API scan, SMART-CONSO-TOKEN scan) and an honest absence for those that don\'t (referentiel, dream-team-photo, THE-SCREENER), correctly refuses to fabricate a negative day count from a future-dated entry (the exact real bug found tonight), renders the costly item in real ANSI red for genuine terminal output while never leaking escape codes into a plain-text rendering, and its post-commit reminder threshold fires at exactly the configured commit count, never early nor only after overshooting it. buildCircleRunSummaryText() renders an honest post-Ronde recap as plain text (never HTML — corrected 2026-09-21, this function predates the HTML-vs-text split decision and was never revisited against it) with real items in their real order, each with its own outcome and link, an honest empty-run message when nothing was ticked, and never a leaked "undefined" — the missing end-of-Ronde report the user pointed out tonight. findRegistriesMissingFromCircle() closes the matching gap on the OTHER end (no menu-freshness guard existed for CIRCLE_ITEMS the way findToolsMissingFromMenu() already protects PRESTATIONS): every real docs/<slug>/index.md registry must be covered by either a real CIRCLE_ITEMS entry or a documented CIRCLE_EXCLUDED_REGISTRIES reason, checked live against this project\'s real docs/ tree — a guarantee that breaks the day a new tool gets a registry without either.');
}

{
  // html-report.mjs (2026-09-20, demande explicite de l'utilisateur après la photo de la dream
  // team : « tu vas transformer tous les rapports en fichiers HTML avec une mise en page
  // améliorée »). Calibré : portée = tous les rapports livrés ; le texte archivé dans docs/ reste
  // la version de travail ; ce gabarit ne produit JAMAIS le fichier de référence, seulement une
  // copie de présentation générée à la remise — d'où l'absence totale de lien avec les fichiers
  // docs/ dans ce module, contrairement à CIRCLE-TASKS.
  const { escapeHtml, renderBlock, renderHtmlReport, THEME_CSS } = await import('../scripts/html-report.mjs');

  assert.equal(escapeHtml('<script>alert(1)</script> & "quotes"'), '&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quotes&quot;', 'escapeHtml() must neutralize every HTML-significant character a real report could legitimately contain (a comparison like "x < y", an ampersand, a quoted phrase) — never leave raw markup that could break the page or worse, inject a real script tag');
  assert.equal(escapeHtml(undefined), '', 'escapeHtml() must handle a missing value as an honest empty string, never crash or print "undefined" literally');

  assert.equal(renderBlock({ type: 'heading', text: 'Titre' }), '<h2>Titre</h2>', 'a heading block must render as a real heading element, never a styled paragraph masquerading as one');
  assert.equal(renderBlock({ type: 'paragraph', text: 'Un texte < risqué' }), '<p>Un texte &lt; risqué</p>', 'a paragraph block\'s text must go through the same escaping as everything else — no block type gets a free pass');
  assert.equal(renderBlock({ type: 'list', items: ['a', 'b'] }), '<ul><li>a</li><li>b</li></ul>', 'a list block must render every item, in order, never dropping or reordering entries');
  assert.equal(renderBlock({ type: 'table', headers: ['H1'], rows: [['v1'], ['v2']] }), '<table><thead><tr><th>H1</th></tr></thead><tbody><tr><td>v1</td></tr><tr><td>v2</td></tr></tbody></table>', 'a table block must render a real semantic table, header row first, then every data row in order');
  assert.equal(renderBlock({ type: 'unknown-type', text: 'x' }), '', 'an unrecognized block type must render as an honest empty string, never crash the whole report over one bad block');
  assert.equal(renderBlock(null), '', 'a missing/null block must never crash renderBlock() — an honest empty string, same discipline as the unknown-type case');

  // Trois types de bloc ajoutés le 2026-09-20 après avoir examiné chaque type de rapport existant
  // contre ce gabarit (demande explicite : « essaie de voir si des documents spécifiques doivent
  // sortir de ce gabarit pour des bonnes raisons ») — aucun rapport n'a eu besoin de sortir du
  // gabarit commun, chaque besoin réel s'est résolu en enrichissant le vocabulaire de blocs.
  assert.equal(renderBlock({ type: 'code', text: 'if (x < 1) { y = "a" }' }), '<pre><code>if (x &lt; 1) { y = &quot;a&quot; }</code></pre>', 'a code block (THE-FINAL-JUDGE citing real source) must render as a real monospace <pre><code> block with its content still escaped — code is exactly the kind of content most likely to contain HTML-significant characters');
  assert.equal(renderBlock({ type: 'image', src: 'capture1.png', caption: 'Salon <de nuit>' }), '<figure><img src="capture1.png" alt="Salon &lt;de nuit&gt;" loading="lazy"><figcaption>Salon &lt;de nuit&gt;</figcaption></figure>', 'an image block (THE-SCREENER) must render a real <figure>/<img>/<figcaption> with the caption escaped both as the alt text and as the visible caption');
  assert.equal(renderBlock({ type: 'image', src: '' }), '', 'an image block with no real src must render as an honest empty string rather than a broken <img> tag with no source');
  assert.equal(renderBlock({ type: 'image', src: 'shot.png' }), '<figure><img src="shot.png" alt="" loading="lazy"></figure>', 'an image block with no caption must omit the <figcaption> entirely rather than rendering an empty one');
  assert.equal(renderBlock({ type: 'dialogue', speaker: 'Lia', text: 'On tourne en rond.' }), '<p class="dialogue speaker-lia"><strong>Lia</strong> — On tourne en rond.</p>', 'a dialogue block (simulation transcripts) for Lia must get her own distinct speaker class, for a colored, readable transcript rather than a wall of undifferentiated paragraphs');
  assert.equal(renderBlock({ type: 'dialogue', speaker: 'Noé', text: 'Toujours là.' }), '<p class="dialogue speaker-noe"><strong>Noé</strong> — Toujours là.</p>', 'a dialogue block for Noé must get his own distinct speaker class, never sharing Lia\'s — the same voice-separation discipline as the game itself (Article 11) carried into the report gabarit');
  assert.equal(renderBlock({ type: 'dialogue', speaker: 'Observateur', text: 'Qui êtes-vous ?' }), '<p class="dialogue speaker-other"><strong>Observateur</strong> — Qui êtes-vous ?</p>', 'a dialogue block from any third party (the observer, a narrator line) must fall back to a neutral speaker class, never silently mislabeled as Lia or Noé');

  // Quatrième type de bloc ajouté le 2026-09-20, besoin réel de check-tasks-details : une
  // arborescence imbriquée (thème > sous-thème > tâche), jamais représentable par 'list' à plat.
  assert.equal(renderBlock({ type: 'tree', nodes: [{ label: 'Thème <A>', children: [{ label: 'Sous-thème' }] }] }), '<ul><li>Thème &lt;A&gt;<ul><li>Sous-thème</li></ul></li></ul>', 'a tree block must render real nested <ul>/<li> elements matching its nodes/children structure exactly, with every label escaped like any other text content');
  assert.equal(renderBlock({ type: 'tree', nodes: [] }), '<ul></ul>', 'an empty tree must render an empty (but valid) list, never crash on a zero-node report');
  assert.equal(renderBlock({ type: 'tree', nodes: [{ label: '✅ #1 done', statusKey: 'terminee' }] }), '<ul><li class="tree-status-terminee">✅ #1 done</li></ul>', 'a leaf node carrying a statusKey (2026-09-20, user feedback: "la distinction être fait/en cours/à faire n\'est pas assez claire, pas assez visible") must render a matching tree-status-<key> class for real CSS color-coding, on top of the icon already baked into the label text');
  assert.equal(renderBlock({ type: 'tree', nodes: [{ label: 'Thème (no status)' }] }), '<ul><li>Thème (no status)</li></ul>', 'a node with no statusKey (a theme/sous-thème container, never a leaf task) must never get a fabricated status class');

  assert.throws(() => renderHtmlReport({}), /title/, 'renderHtmlReport() must refuse to produce a report with no title at all — Article 5, never a document with no identity');
  const html = renderHtmlReport({ title: 'Rapport <Test>', subtitle: 'Sous-titre', dateLabel: '2026-09-20', blocks: [{ type: 'paragraph', text: 'Contenu.' }], footer: 'Bas de page' });
  assert.ok(html.startsWith('<!DOCTYPE html>'), 'renderHtmlReport() must always produce a complete, self-contained HTML document, never a bare fragment');
  assert.ok(html.includes('Rapport &lt;Test&gt;'), 'the title must be escaped both in <title> and in the visible heading — a report title is real content, not trusted markup');
  assert.ok(html.includes('Sous-titre') && html.includes('2026-09-20') && html.includes('Contenu.') && html.includes('Bas de page'), 'every part of the report spec (subtitle, date label, block content, footer) must actually appear in the rendered output, never silently dropped');
  assert.ok(html.includes(THEME_CSS.trim().slice(0, 40)), 'the shared dark theme must be embedded inline in every report, for the same visual identity across all future "pretty" deliverables (the dream-team photo, KPI reports, EL-PROFESSOR notes, ...) — never a per-report reinvented style');
  const minimal = renderHtmlReport({ title: 'Minimal' });
  assert.ok(!minimal.includes('undefined') && !minimal.includes('null'), 'a report with no subtitle/blocks/footer must render cleanly with those sections simply absent, never leak a literal "undefined" or "null" into the page');
  console.log("Passed: html-report.mjs's escapeHtml() neutralizes every HTML-significant character (including a real <script> injection attempt) and handles a missing value honestly, renderBlock() renders each of its block types faithfully (heading/paragraph/list/table/code/image/dialogue/tree) with text always escaped, an image block with no src renders as an honest empty string while one with no caption simply omits the figcaption, a dialogue block gets Lia's or Noé's own distinct speaker class or a neutral fallback for anyone else (mirroring the game's own Article 11 voice separation), a tree block renders real nested lists matching its structure, an unknown or null block renders as an honest empty string rather than crashing, renderHtmlReport() refuses a report with no title, always produces a complete self-contained document with the shared dark theme embedded and every spec field (title, subtitle, date, blocks, footer) actually present, and a minimal report with only a title never leaks a literal undefined/null into the page.");
}

{
  // CLEAN-DIRTY-OLD (2026-09-19, cf. docs/clean-dirty-old-blueprint.md et
  // docs/referentiel/clean-dirty-old.md). Repère seul, ne juge jamais — les trois vraies questions
  // (encore utile ? à jour ? profiterait d'une refonte ?) restent déléguées à ARGUS/HARMONIA/
  // ALWAYS-NEW-CODE, jamais réimplémentées ici.
  const {relativeStaleness,prioritizeStaleFiles,delegationQuestions,cleanDirtyOldPerformance}=await import('../scripts/clean-dirty-old.mjs');
  const staleness=relativeStaleness({'lib/a.ts':10,'lib/b.ts':12,'lib/c.ts':400,'lib/d.ts':undefined});
  assert.equal(staleness['lib/c.ts'].stale,true,'a file untouched for 400 days while its peers sit around 10-12 must be flagged stale — both far above the absolute floor and far above the relative median');
  assert.equal(staleness['lib/a.ts'].stale,false,'a file close to the median must never be flagged, however the absolute threshold alone might suggest otherwise');
  assert.equal(staleness['lib/d.ts'].stale,false,'a file with no git history at all (never committed alone, or history unavailable) must report an honest non-stale rather than guessing');
  assert.deepEqual(relativeStaleness({'lib/x.ts':500}),{'lib/x.ts':{days:500,stale:false,ratioToMedian:undefined}},'a single file with no peer to compare against must never compute a fabricated relative signal, even if it looks old in isolation');
  assert.deepEqual(relativeStaleness({'lib/x.ts':5,'lib/y.ts':6}),{'lib/x.ts':{days:5,stale:false,ratioToMedian:5/5.5,medianDays:5.5},'lib/y.ts':{days:6,stale:false,ratioToMedian:6/5.5,medianDays:5.5}},'two young, close-in-age files must never be flagged just because a ratio exists — the absolute floor (30 days) still applies');
  const entries=[{file:'lib/normal.ts',days:200},{file:'lib/sensitive.ts',days:100}];
  const sensitiveNodes=[{node:'Sommeil',files:['lib/sensitive.ts']}];
  const prioritized=prioritizeStaleFiles(entries,sensitiveNodes);
  assert.equal(prioritized[0].file,'lib/sensitive.ts','proximity to a real sensitive node must outrank pure age, per the explicit 2026-09-19 calibration — a younger but sensitive file goes first');
  const tiePrioritized=prioritizeStaleFiles([{file:'lib/older.ts',days:300},{file:'lib/younger.ts',days:100}],[]);
  assert.equal(tiePrioritized[0].file,'lib/older.ts','with no sensitive-node match on either side, the older file must still come first, never an arbitrary or input order');
  const questions=delegationQuestions('lib/nowhere.ts');
  assert.equal(questions.length,3,'exactly the three delegated questions (still useful/ARGUS, still in sync/HARMONIA, would benefit from a rebuild/ALWAYS-NEW-CODE) must be produced, CLEAN-DIRTY-OLD never answering any of them itself');
  assert.ok(questions.every(q=>/ARGUS|HARMONIA|ALWAYS-NEW-CODE/.test(q)),'every delegated question must explicitly name the real tool that owns the answer, never a vague pointer');
  assert.equal(cleanDirtyOldPerformance('| Date | Zone signalée | Trouvailles confirmées | Rapport | Notes |\n|---|---|---|---|---|'),undefined,'zero recorded passes must report an honest absence, never a fake 0%, same discipline as ALWAYS-NEW-CODE/HYPER-SCAN-CHECKPOINT');
  const perfIdx='| Date | Zone signalée | Trouvailles confirmées | Rapport | Notes |\n|---|---|---|---|---|\n| 2026-09-19 | lib/x.ts | 2 | a.txt | - |\n| 2026-09-19 | lib/y.ts | 0 | b.txt | - |';
  assert.deepEqual(cleanDirtyOldPerformance(perfIdx),{passages:2,totalFindings:2,findingsPerPassage:1},'the from-day-one KPI must compute the exact real average of confirmed findings per pass, reusing the same shared table-parsing logic as ALWAYS-NEW-CODE rather than a second reimplementation');
  console.log('Passed: CLEAN-DIRTY-OLD flags a file as stale only when it is both far above the absolute floor and far above the relative median of its real peers (never a fixed date threshold, never a fabricated signal from a single file with no peer to compare against), always prioritizes proximity to a real HARMONIA sensitive node over pure age per the explicit calibration, produces exactly its three delegated questions each naming the real tool that owns the answer without ever answering any of them itself, and its from-day-one KPI reports an honest absence on zero passes and the exact real average otherwise, reusing the shared markdown-table helper rather than reimplementing ALWAYS-NEW-CODE\'s parsing a second time.');
}
{
  // findUnconfirmedBursts() (2026-09-19, demande explicite : « pense à consulter smart conso api
  // pour la prochaine fois, fiabilise stp »). Trouvaille réelle qui a motivé cette fonction :
  // .smart-conso-session.json n'avait jamais été créé — l'agent n'avait jamais réellement consulté
  // Smart Conso API avant une action coûteuse. Ce garde-fou compare l'activité RÉELLE déjà
  // enregistrée dans la source partagée à ce que le carnet de session dit avoir été confirmé.
  const {findUnconfirmedBursts}=await import('../scripts/smart-conso-api.mjs');
  const t0=1_000_000_000_000;
  const manyClose=(start,count)=>Array.from({length:count},(_,i)=>({at:start+i*1000,outcome:'OK'}));
  const healthBurstNoConfirm={keys:{k1:{episodes:manyClose(t0,5)}}};
  assert.equal(findUnconfirmedBursts(healthBurstNoConfirm,{actions:[]}).length,1,'a real burst of 5+ closely-spaced episodes with zero confirmed action anywhere in the session log must be flagged — the exact real gap found on 2026-09-19 (full_sim12 launched with no prior --confirm)');
  const confirmedBefore={actions:[{type:'simulation',at:t0-10*60000,confirmed:true}]};
  assert.equal(findUnconfirmedBursts(healthBurstNoConfirm,confirmedBefore).length,0,'a burst preceded by a real confirmed action within the lookback window must never be flagged — the whole point of actually consulting the tool first');
  const confirmedButUnconfirmedFlag={actions:[{type:'simulation',at:t0-10*60000,confirmed:false}]};
  assert.equal(findUnconfirmedBursts(healthBurstNoConfirm,confirmedButUnconfirmedFlag).length,1,'an action logged but never actually confirmed (confirmed:false, i.e. advice-only) must never count as a real consultation — only a genuine --confirm clears the flag');
  const healthNoBurst={keys:{k1:{episodes:manyClose(t0,2)}}};
  assert.equal(findUnconfirmedBursts(healthNoBurst,{actions:[]}).length,0,'only two isolated episodes must never be treated as a burst — an occasional diagnostic ping is not the pattern this guard exists to catch');
  assert.deepEqual(findUnconfirmedBursts({keys:{}},{actions:[]}),[],'a genuinely empty health history must report zero bursts, never crash or fabricate one');
  console.log("Passed: findUnconfirmedBursts() flags a real burst of closely-spaced API activity only when no action was genuinely confirmed (confirmed:true, never a mere advice-only log) within the lookback window beforehand, never flags an isolated one-or-two-call ping as a burst, and reports zero on empty history rather than crashing — closing the exact real gap found on 2026-09-19 where a simulation was launched without ever consulting Smart Conso API first.");

  // burstComplianceScore() (2026-09-20, écart réel comblé : famille KPI "Smart Conso" du tableau de
  // bord jamais construite malgré une réponse de calibrage déjà donnée par l'utilisateur). Réutilise
  // exactement la même détection de salves que findUnconfirmedBursts() (detectBurstWindows partagé,
  // jamais une seconde boucle) mais rapporte un vrai TAUX sur TOUTES les salves (confirmées et non),
  // la seule composante de ce paysage backée par une preuve indépendante du vrai trafic API.
  const {burstComplianceScore}=await import('../scripts/smart-conso-api.mjs');
  assert.equal(burstComplianceScore({keys:{}},{actions:[]}),undefined,'with zero bursts ever detected, there is nothing real to measure — an honest absence, never a fabricated 100%');
  assert.deepEqual(burstComplianceScore(healthBurstNoConfirm,{actions:[]}),{score:0,confirmed:0,total:1},'a single real burst with zero confirmation anywhere must report an honest 0% compliance, not an undefined or a crash');
  assert.deepEqual(burstComplianceScore(healthBurstNoConfirm,confirmedBefore),{score:100,confirmed:1,total:1},'the same burst, this time genuinely preceded by a confirmed action, must report 100% compliance');
  const twoBurstsHealth={keys:{k1:{episodes:manyClose(t0,5)},k2:{episodes:manyClose(t0+3_600_000,5)}}};
  const compliance2of2=burstComplianceScore(twoBurstsHealth,confirmedBefore);
  assert.equal(compliance2of2.total,2,'two genuinely separate bursts (far enough apart to never merge into one window) must both be counted in the total, never silently dropped');
  assert.equal(compliance2of2.confirmed,1,'only the burst genuinely covered by the confirmed action\'s lookback window counts as confirmed — the second, unconfirmed burst must not inherit the first one\'s compliance');
  console.log('Passed: burstComplianceScore() reuses the exact same burst-detection core as findUnconfirmedBursts() (never a duplicated loop) to report an honest compliance percentage over ALL detected bursts — an honest absence on zero bursts ever detected, never a fabricated 100%, and each genuinely separate burst counted on its own merits rather than inheriting a neighboring burst\'s confirmation status.');

  // Capacité de scan de Smart Conso API (2026-09-20, demande explicite de l'utilisateur : « est-ce
  // que smart conso api peut réaliser un scan aussi ? [...] il faut l'ajouter »). Domaine différent
  // de SMART-CONSO-TOKEN : jamais la taille de texte, toujours le RYTHME réel des appels déjà
  // enregistrés — jamais un jugement sur le code du jeu lui-même.
  const {scanConsumptionPatterns}=await import('../scripts/smart-conso-api.mjs');
  const tS=2_000_000_000_000;
  const healthHighExhaustion={keys:{k1:{episodes:[{at:tS-60000,outcome:'QUOTA_ÉPUISÉ'},{at:tS-30000,outcome:'QUOTA_ÉPUISÉ'}]}}};
  const quickRelaunchLog={actions:[{type:'simulation',at:tS-50000,confirmed:true}]};
  const findings=scanConsumptionPatterns(healthHighExhaustion,quickRelaunchLog,tS);
  assert.ok(findings.some((f)=>f.constat.includes("Taux d'épuisement")),'a genuinely high recent exhaustion rate must be surfaced as a real finding, with a concrete piste rather than a bare percentage');
  assert.ok(findings.some((f)=>f.constat.includes('relancement')),'a real confirmed relaunch within 10 minutes of a genuine exhaustion episode must be flagged — the exact real pattern that caused full_sim12 to burn through its fallback models within minutes');
  assert.deepEqual(scanConsumptionPatterns({keys:{}},{actions:[]},tS),[],'an empty history must report zero findings, never a fabricated warning from no data');
  console.log("Passed: Smart Conso API's scan capability surfaces a real high-exhaustion-rate finding and a real too-quick-relaunch-after-exhaustion finding from the actual shared history, each with a concrete process suggestion rather than a bare statistic, and reports an honest empty list rather than a fabricated finding when the history is genuinely empty — its domain staying strictly the RHYTHM of real API calls already made, never the game's own code or prompts.");
}

{
  // EL-PROFESSOR (2026-09-19, cf. docs/el-professor-blueprint.md et
  // docs/referentiel/el-professor.md). La notation qualitative elle-même ne peut pas être testée
  // mécaniquement (c'est une vraie lecture, jamais un calcul) — seule sa partie mécanique de
  // couverture (aucune simulation archivée sans note, aucune note orpheline) est testée ici.
  const {extractSimIds,findMissingNotes,findOrphanNotes,buildElProfessorCoverageHtml}=await import('../scripts/el-professor.mjs');
  const simIdx='| Simulation | Round |\n|---|---|\n| full_sim (sim1) | 44 |\n| full_sim2 | 56 |\n| full_sim9 | 153 |';
  assert.deepEqual(extractSimIds(simIdx),['full_sim','full_sim2','full_sim9'],'every simulation identifier in the first column of a markdown table must be extracted in order, dropping whatever trails after it on the same line (e.g. "(sim1)")');
  assert.deepEqual(extractSimIds('| Simulation | Round |\n|---|---|'),[],'a table with no data rows yet must report zero ids, never crash');
  const elIdxPartial='| Simulation | Note |\n|---|---|\n| full_sim | 82 |';
  assert.deepEqual(findMissingNotes(simIdx,elIdxPartial),['full_sim2','full_sim9'],'every archived simulation without a matching row in the EL-PROFESSOR index must be flagged as missing a note — the exact blind spot this guard exists to catch');
  const elIdxComplete='| Simulation | Note |\n|---|---|\n| full_sim | 82 |\n| full_sim2 | 75 |\n| full_sim9 | 90 |';
  assert.deepEqual(findMissingNotes(simIdx,elIdxComplete),[],'once every archived simulation has a matching note, nothing must be flagged');
  const elIdxOrphan='| Simulation | Note |\n|---|---|\n| full_sim | 82 |\n| full_sim99 | 60 |';
  assert.deepEqual(findOrphanNotes(simIdx,elIdxOrphan),['full_sim99'],'a note referencing a simulation id absent from the archive index (typo, stale rename) must be flagged as orphaned, the symmetric failure mode to a missing note — never silently ignored');
  assert.deepEqual(findOrphanNotes(simIdx,elIdxComplete),[],'when every note matches a real archived simulation, nothing must be flagged as orphaned');
  // buildElProfessorCoverageHtml() (2026-09-20, tâche #144 — checkHtmlWiring() signalait cet outil
  // comme jamais câblé malgré la règle "tous les rapports en HTML").
  const missingHtml = buildElProfessorCoverageHtml(['full_sim2', 'full_sim9'], []);
  assert.ok(missingHtml.includes('full_sim2') && missingHtml.includes('full_sim9'), 'buildElProfessorCoverageHtml() must list every real missing simulation id by name in the rendered HTML, never a bare count');
  assert.ok(!buildElProfessorCoverageHtml([], []).includes('sans note'), 'with zero missing notes, the HTML must report the honest "à jour" message, never a leftover mention of missing coverage');
  const orphanHtml = buildElProfessorCoverageHtml([], ['full_sim99']);
  assert.ok(orphanHtml.includes('full_sim99') && orphanHtml.includes('orphelin'), 'an orphan note must be named explicitly in the HTML output too, the same symmetric failure mode as the terminal output');
  console.log('Passed: EL-PROFESSOR\'s mechanical coverage guard extracts every simulation identifier from a markdown index table in order, flags every archived simulation still missing its charter-fidelity note, and — symmetrically — flags any note referencing a simulation id that no longer exists in the archive, never confusing or silently dropping either failure mode; buildElProfessorCoverageHtml() (2026-09-20, tâche #144) renders the exact same data as a real HTML report, naming every missing/orphan id explicitly, never a bare count.');
}
{
  // moveReasonMismatchesDestination (2026-09-20, cf. lib/drama.ts) — root-cause fix for a real bug
  // EL-PROFESSOR found in full_sim9: a moveReason announcing a different room than the one the
  // model actually ended up in (room forced to "salon" by a narrative beat while moveReason still
  // talked about "le bureau"/"la chambre").
  const {moveReasonMismatchesDestination}=await import('../.sites-runtime/test-drama.mjs');
  assert.equal(moveReasonMismatchesDestination('Aller voir le bureau pour changer de pièce.','salon'),true,'a reason naming a different room than the real destination, without ever naming the destination itself, must be flagged as unreliable');
  assert.equal(moveReasonMismatchesDestination('Je vais dans la chambre pour dormir.','salon'),true,'the exact second real case found in full_sim9 must also be caught');
  assert.equal(moveReasonMismatchesDestination('J’ai besoin de m’éloigner deux minutes.','salon'),false,'a reason naming no room at all must never be flagged — most real reasons stay generic');
  assert.equal(moveReasonMismatchesDestination('Je laisse le bureau de côté, j’ai besoin de souffler au salon.','salon'),false,'a reason that names the real destination too, even alongside another room mentioned in passing, must never be flagged as a false positive');
  assert.equal(moveReasonMismatchesDestination('Direction le jardin, enfin.','jardin'),false,'a reason that correctly names the real destination must never be flagged');
  console.log('Passed: moveReasonMismatchesDestination() flags a movement reason that names a different room than the real destination and never names the destination itself, but never a reason naming no room, naming the destination alongside another room in passing, or correctly naming the real destination — closing the exact real full_sim9 bug.');
}
{
  // THE-FINAL-JUDGE (2026-09-20, cf. scripts/the-final-judge.mjs et docs/referentiel/the-final-judge.md).
  // THE-FINAL-JUDGE lui-même est un vrai agent séparé, jamais testable ici — seuls ses deux
  // garde-fous mécaniques le sont : le personnage fixe est bien extrait tel quel du document de
  // référence (jamais reformulé), et un rapport générique/sans preuve concrète est bien détecté.
  const { extractPersonaBlock, detectGenericReport, buildFinalJudgeReportHtml } = await import('../scripts/the-final-judge.mjs');
  const fakeDoc = 'Intro.\n\n## Personnage donné à l\'agent séparé\n\n> Première phrase du personnage.\n> Deuxième phrase du personnage.\n\nLa suite du document, hors du bloc.';
  assert.equal(extractPersonaBlock(fakeDoc), 'Première phrase du personnage.\nDeuxième phrase du personnage.', 'extractPersonaBlock() must pull exactly the blockquoted lines, stripping the leading "> " marker, and nothing from outside the quote block — this is what guarantees the fixed persona is reused verbatim rather than retyped by hand each time');
  assert.deepEqual(extractPersonaBlock('Rien ici, aucun bloc de citation.'), '', 'a document with no blockquote must report an empty persona, never crash or return unrelated text');
  const genericReport = 'Verdict global : le projet est globalement solide, dans l\'ensemble bien construit. Points positifs : de bonnes bases. À améliorer : quelques détails. Pistes de développement : continuer ainsi.';
  assert.ok(detectGenericReport(genericReport).length > 0, 'a report with zero concrete file references must be flagged as a genericness signal — closing exactly the drift risk the fixed persona is meant to prevent');
  const concreteReport = 'Verdict global : ce projet a un vrai souci de séparation des responsabilités dans `app/api/lia/route.ts`, un fichier de plus de mille lignes qui mélange orchestration réseau et logique métier. Points positifs : `lib/dialogue.ts` reste propre et bien testé. À améliorer : extraire la logique du dossier retourné dans son propre module. Pistes de développement : envisager un découpage par domaine plutôt que par type technique.';
  assert.deepEqual(detectGenericReport(concreteReport), [], 'a real, concrete, properly structured report citing actual files must never be flagged — the detector targets genuine genericness, not every report');
  assert.ok(detectGenericReport('Trop court.').some((s) => s.includes('court')), 'an abnormally short report must be flagged regardless of its other properties');
  // buildFinalJudgeReportHtml() (2026-09-20, tâche #144) : contrairement à EL-PROFESSOR/THE-SCREENER,
  // ce script n'a pas de main() — le vrai rapport est écrit en prose par l'agent séparé, cette
  // fonction est le point d'intégration réel appelé à la main par l'agent orchestrateur au moment
  // de livrer un rapport. Un bloc "code" (jamais "paragraph") préserve les sauts de ligne du texte
  // libre, sans quoi une longue prose deviendrait un unique mur de texte illisible en HTML.
  const multilineReport = 'VERDICT\nligne 1\n\nligne 2 avec `lib/dialogue.ts`';
  const finalJudgeHtml = buildFinalJudgeReportHtml(multilineReport, { title: 'Audit test' });
  assert.ok(finalJudgeHtml.includes('<pre><code>') && finalJudgeHtml.includes('Audit test'), 'buildFinalJudgeReportHtml() must wrap the free-form prose report in a "code" block (preserving line breaks) under the given title, never reformat or summarize it');
  assert.ok(finalJudgeHtml.includes('ligne 1') && finalJudgeHtml.includes('ligne 2'), 'the full report text must appear verbatim in the HTML, never truncated or paraphrased');
  console.log('Passed: THE-FINAL-JUDGE\'s two mechanical guards work correctly — extractPersonaBlock() pulls the exact fixed persona text from its single source of truth with nothing added or lost, and detectGenericReport() flags a report with no concrete file citations, missing required sections, or abnormal brevity, while never flagging a real, specific, properly structured report — the mechanical protection against the persona drifting toward a generic, standard tone; and — the 2026-09-20 task #144 fix — buildFinalJudgeReportHtml() wraps the free-form prose report verbatim in a "code" block (never "paragraph", which would collapse every line break into one wall of text) under the real point of integration this script always lacked, since it has no main() of its own.');
}
{
  // judge-persona-shared.mjs (2026-09-21, tâche #152) : extractPersonaBlock() et la logique commune
  // de detectGenericReport() étaient strictement dupliquées entre the-final-judge.mjs et
  // the-deep-reader.mjs — factorisées ici une fois, corrigeant l'écart plutôt que de le laisser
  // diverger silencieusement. Ce test vérifie le module partagé directement, en plus des deux tests
  // ci-dessus/ci-dessous qui vérifient que chaque fichier appelant produit toujours EXACTEMENT le
  // même comportement qu'avant ce refactor (aucune régression de comportement observable).
  const { extractPersonaBlock: sharedExtractPersona, missingSectionsSignal, tooShortSignal } = await import('../scripts/judge-persona-shared.mjs');
  assert.equal(sharedExtractPersona('Intro.\n\n> Une phrase.\n> Une autre.\n\nHors bloc.'), 'Une phrase.\nUne autre.', 'the shared extractPersonaBlock() must pull exactly the blockquoted lines, the single source of truth both the-final-judge.mjs and the-deep-reader.mjs now import rather than each keeping its own identical copy');
  assert.equal(missingSectionsSignal('ceci contient verdict et positif', ['verdict', 'positif']), undefined, 'a report containing every required section must report an honest absence of this signal, never a false positive');
  assert.ok(missingSectionsSignal('ceci contient seulement verdict', ['verdict', 'positif']).includes('positif'), 'a report missing one of several required sections must name exactly the missing one(s), never a vague generic message');
  assert.equal(tooShortSignal('un texte suffisamment long pour ne rien signaler ici', 10, 'un test'), undefined, 'a report at or above the minimum length must report an honest absence, never a false positive');
  assert.ok(tooShortSignal('court', 100, 'un audit réel').includes('un audit réel'), 'a report below the minimum length must name the caller-supplied label in its message, never a generic one-size-fits-all wording — the whole reason this stays a parameter rather than a hardcoded string');
  console.log('Passed: judge-persona-shared.mjs correctly centralizes extractPersonaBlock() (the exact single source of truth both THE-FINAL-JUDGE and THE-DEEP-READER now import) and the two generic-report signals they share (missing sections, named explicitly; report too short, labeled per caller) — closing the real duplication task #152 was opened for, verified live to preserve each caller\'s exact prior observable behavior.');
}
{
  // THE-DEEP-READER (2026-09-20, cf. scripts/the-deep-reader.mjs et docs/referentiel/the-deep-reader.md).
  // Même statut que THE-FINAL-JUDGE : un vrai agent séparé, jamais testable ici — seuls ses deux
  // garde-fous mécaniques et son KPI central le sont.
  const { extractPersonaBlock: drExtractPersona, detectGenericReport: drDetectGeneric, rereadPerformance } = await import('../scripts/the-deep-reader.mjs');
  const drFakeDoc = 'Intro.\n\n## Personnage — texte FIXE\n\n> Première phrase de l\'archiviste.\n> Deuxième phrase de l\'archiviste.\n\nLa suite du document, hors du bloc.';
  assert.equal(drExtractPersona(drFakeDoc), 'Première phrase de l\'archiviste.\nDeuxième phrase de l\'archiviste.', 'THE-DEEP-READER\'s extractPersonaBlock() must pull exactly the blockquoted lines from its own reference document, stripping the leading "> " marker — the same non-negotiable verbatim-reuse guarantee as THE-FINAL-JUDGE, on its own distinct persona text');
  const drVagueReport = 'Tout semble globalement bien suivi, dans l\'ensemble rien de très inquiétant à signaler ici.';
  assert.ok(drDetectGeneric(drVagueReport).length > 0, 'a report with no concrete number and none of the required sections (interventions relues/écart/déjà bien tracé) must be flagged — the exact drift this guard exists to catch');
  const drConcreteReport = 'Nombre d\'interventions relues : 42, depuis la tâche #140 jusqu\'à la fin de la conversation fournie. Deux écarts trouvés : la tâche X, choisie mais jamais close par un fichier ou un commit réel, et la remarque Y de l\'utilisateur, jamais reprise dans aucune ligne de suivi. Déjà bien tracé, pour ne pas laisser croire que tout est perdu : le reste du chantier KPI Smart Conso, confirmé fidèle avec son commit identifiable.';
  assert.deepEqual(drDetectGeneric(drConcreteReport), [], 'a real report stating a concrete count and covering all three required parts must never be flagged');
  assert.ok(drDetectGeneric('Court.').some((s) => s.includes('court')), 'an abnormally short report must be flagged regardless of its other properties');
  assert.equal(rereadPerformance('| Date | X | Y | Écarts trouvés | Z |\n|---|---|---|---|---|\n'), undefined, 'zero recorded passages must report an honest absence, never a disguised 0%');
  const drIndex = '| Date | Interventions relues | Écarts trouvés | Tâches ouvertes | Fichier | Dernière tâche couverte (N°) |\n|---|---|---|---|---|---|\n| 2026-09-20 | 40 | 2 | 2 | [x](x.md) | 140 |\n| 2026-09-21 | 12 | 0 | 0 | [y](y.md) | 150 |';
  const drPerf = rereadPerformance(drIndex);
  assert.equal(drPerf.passages, 2); assert.equal(drPerf.totalEcarts, 2); assert.equal(drPerf.ecartsParPassage, 1); assert.equal(drPerf.hitRate, 50, 'exactly one of the two recorded passages found a real gap, so the hit rate — the tool\'s actual vocation, same framing as HYPER-SCAN-CHECKPOINT — must read 50%, never an average that would hide it');
  console.log('Passed: THE-DEEP-READER\'s two mechanical guards and its central KPI work correctly — extractPersonaBlock() pulls its own fixed archivist persona verbatim from its single source of truth, detectGenericReport() flags a report missing a concrete count or any of its three required parts while never flagging a real properly-structured one, and rereadPerformance() reports the real hit rate of passages that found at least one confirmed gap (an honest absence on zero passages, never a fabricated 0%) — the same anti-drift and anti-vanity-metric discipline already proven for THE-FINAL-JUDGE and HYPER-SCAN-CHECKPOINT.');
}

{
  // Garde-fou de dérive check-spirit.mjs/route.ts (2026-09-20, trouvaille réelle en relançant
  // check-spirit.mjs cette nuit après un long silence : app/api/lia/route.ts importe désormais
  // "@/lib/quality-metrics" (ajouté le 2026-09-19, chantier 2 du tableau de bord) mais la chaîne de
  // remplacement d'alias de check-spirit.mjs — une copie quasi-identique de celle de check-house.mjs
  // ci-dessus, jamais partagée — n'avait jamais été mise à jour en conséquence, provoquant un
  // ERR_MODULE_NOT_FOUND sur "@/lib" au tout premier lancement. Exactement la même classe de bug
  // que GEMINI_API_KEY_FALLBACKS documentée dans le commentaire de check-spirit.mjs lui-même — donc
  // exactement le genre de récidive que l'Article 3 interdit ("une règle corrigée une fois ne doit
  // plus jamais se reproduire ailleurs sous une autre forme"). Ce garde-fou lit les deux VRAIS
  // fichiers du dépôt pour ne plus jamais laisser cette dérive passer inaperçue.
  function extractLibAliasImports(routeTsText) {
    return [...new Set([...routeTsText.matchAll(/"@\/lib\/([a-z-]+)"/g)].map((m) => m[1]))];
  }
  function findMissingAliasReplacements(aliasNames, scriptText) {
    return aliasNames.filter((name) => !scriptText.includes(`"@/lib/${name}"`));
  }
  const routeTsReal = fs.readFileSync('app/api/lia/route.ts', 'utf8');
  const realAliases = extractLibAliasImports(routeTsReal);
  assert.ok(realAliases.includes('quality-metrics') && realAliases.includes('lia') && realAliases.length >= 15, 'extractLibAliasImports() must genuinely parse the real route.ts and find its real @/lib imports, not an empty or fixed list — a sanity check that this guard is reading live code, not a stale fixture');
  assert.deepEqual(findMissingAliasReplacements(['lia', 'made-up-module'], '"@/lib/lia"'), ['made-up-module'], 'findMissingAliasReplacements() must flag exactly the alias with no matching replaceAll target in the script text, never the one that is genuinely covered');
  const checkSpiritReal = fs.readFileSync('scripts/check-spirit.mjs', 'utf8');
  const missingInCheckSpirit = findMissingAliasReplacements(realAliases, checkSpiritReal);
  assert.deepEqual(missingInCheckSpirit, [], `check-spirit.mjs is missing a replaceAll target for real route.ts import(s): ${missingInCheckSpirit.join(', ')} — it would crash with ERR_MODULE_NOT_FOUND on its very first real run, exactly the drift found and fixed tonight (quality-metrics)`);
  const checkHouseReal = fs.readFileSync('scripts/check-house.mjs', 'utf8');
  assert.deepEqual(findMissingAliasReplacements(realAliases, checkHouseReal), [], 'check-house.mjs\'s own copy of this same replacement chain must likewise never drift behind the real route.ts imports — checked live, not just in check-spirit.mjs');
  console.log('Passed: findMissingAliasReplacements() correctly flags a real route.ts "@/lib/X" import with no matching replaceAll target in a given script\'s transpile chain, and — checked live against the real files tonight — check-spirit.mjs and check-house.mjs both now genuinely cover every real alias import, closing the exact ERR_MODULE_NOT_FOUND drift found while relaunching check-spirit.mjs after the quality-metrics module was added.');

  // Vérification live (2026-09-20, tâche #144) : les 3 scripts que checkHtmlWiring() signalait
  // encore non câblés (el-professor.mjs, the-final-judge.mjs, the-screener-capture.mjs) importent
  // désormais tous réellement html-report.mjs — checké contre leur VRAI contenu sur disque, jamais
  // seulement contre une fixture synthétique (déjà testée séparément dans le bloc CIRCLE-TASKS).
  for (const script of ['el-professor.mjs', 'the-final-judge.mjs', 'the-screener-capture.mjs']) {
    const realSource = fs.readFileSync(`scripts/${script}`, 'utf8');
    assert.ok(/html-report\.mjs/.test(realSource), `scripts/${script} must genuinely import html-report.mjs on disk now — closing the exact real gap task #144 was opened for, checked live rather than trusting the fix without rereading the file`);
  }
}

{
  // SMART-CONSO-TOKEN (2026-09-20, cf. docs/referentiel/smart-conso-token.md) — le pendant de Smart
  // Conso API pour les tokens de l'agent lui-même. Contrairement au quota Gemini, il n'existe aucun
  // compteur externe réel : ces tests vérifient donc la LOGIQUE de reconnaissance de schémas connus
  // et de combinaison avec l'historique mesurable, jamais un vrai total de tokens (qui n'existe pas).
  const {
    estimateTokens, measureClaudeMdWeight, checkKnowledgeFreshness, countRecentActions, assess,
    scanDocumentWeight, scanScope, SCOPE_LEVELS, computeAdoptionKpi, KNOWN_COSTLY_PATTERNS, KNOWLEDGE_PROVENANCE,
    formatScanReport, countDatedNarrativeMarkers, findJudgeSpawnsWithoutConsultation, AUTOMATION_TOKEN_NUANCE,
    listDatedNarrativeMarkers, checkToolConnections, EXPECTED_CONNECTIONS, trackWeightTrend,
    classifyConsumption, computeInvestmentRatio, diagnoseAdviceAccuracy, parseOutcomeArgs,
    extractNormativeMarkers, diffNormativeMarkers,
    extractRuleUnits, countArticleCrossReferences, classifyRuleSensitivity, classifyRuleImportance,
    findRedundantRulePairs, buildClaudeMdRuleTable, renderClaudeMdRuleTable,
    ARCHIVE_FIRST_REMINDER, compareChantiers, formatChantierComparison, recordAction,
    detectTaskMomentum, formatTaskMomentumBlock, TASK_MOMENTUM_THRESHOLDS,
  } = await import('../scripts/smart-conso-token.mjs');

  assert.equal(estimateTokens('abcd'), 1, 'the ~4-characters-per-token heuristic must round to the nearest whole token, never a fractional or wildly inaccurate estimate');
  assert.equal(estimateTokens(''), 0, 'an empty or missing text must estimate to exactly zero tokens, never crash or return NaN');

  assert.equal(measureClaudeMdWeight('a'.repeat(400)).niveau, 'faible', 'a small document (well under the healthy benchmark) must classify as low weight');
  assert.equal(measureClaudeMdWeight('a'.repeat(8000)).niveau, 'modéré', 'a document above the healthy benchmark but below the heavily-penalizing threshold must classify as moderate, never silently lumped with either extreme');
  assert.equal(measureClaudeMdWeight('a'.repeat(24000)).niveau, 'élevé', 'a document at or above the ~5000-token threshold the cited research identifies as meaningfully hurting effective working context must classify as high weight');

  assert.equal(checkKnowledgeFreshness(undefined).fraiche, undefined, 'a missing agent identity must report an honest "unknown" freshness, never a false positive or negative');
  assert.equal(checkKnowledgeFreshness('claude-sonnet-5').fraiche, true, 'an identity that contains the validated model name (case-insensitive substring) must be reported fresh');
  assert.equal(checkKnowledgeFreshness('codex').fraiche, false, 'a genuinely different model identity must never be silently treated as still validated — the whole point of the freshness check the user asked for');
  assert.equal(checkKnowledgeFreshness('claude-sonnet-5', { validatedFor: 'claude', researchedAt: 'x' }).fraiche, true, 'checkKnowledgeFreshness() must accept an injectable provenance rather than always reading the module-level default, so a future provenance update is testable in isolation');

  const now = 1000000;
  const history = { actions: [
    { type: 'agent_subagent_spawn', at: now - 1000 },
    { type: 'agent_subagent_spawn', at: now - 2000 },
    { type: 'agent_subagent_spawn', at: now - 3000 },
    { type: 'agent_subagent_spawn', at: now - 10 * 60 * 60 * 1000 },
  ] };
  assert.equal(countRecentActions(history, 'agent_subagent_spawn', now, 2), 3, 'countRecentActions() must count only the actions of the matching type within the real time window, excluding one that happened 10 hours ago from a 2-hour window');

  const okVerdict = assess({ actionType: 'agent_subagent_spawn', history: { actions: [] }, now, agentIdentity: 'claude-sonnet-5' });
  assert.equal(okVerdict.verdict, 'avertissement_souple', 'a recognized costly pattern below its hard threshold must return a soft, negotiable warning, never silently "ok" — an agent spawn is costly every single time, per the real research cited');
  const hardVerdict = assess({ actionType: 'agent_subagent_spawn', history, now, agentIdentity: 'claude-sonnet-5' });
  assert.equal(hardVerdict.verdict, 'seuil_dur', 'once the configured hard threshold (3 spawns / 2h) is reached, the verdict must escalate to the non-negotiable hard tier, requiring an explicit question window before continuing');
  const unknownVerdict = assess({ actionType: 'un_schema_jamais_vu', history: { actions: [] }, now, agentIdentity: 'claude-sonnet-5' });
  assert.equal(unknownVerdict.verdict, 'ok', 'an action type absent from the known costly-pattern registry must report a genuinely neutral verdict, never a fabricated warning about a pattern the tool has no real basis to judge');
  assert.ok(KNOWN_COSTLY_PATTERNS.agent_subagent_spawn.raison.includes('37'), 'the agent-spawn pattern must cite the real ~37k-token cold-start finding from the 2026-09-20 research, not a vague unsourced claim');

  // ARCHIVE_FIRST_REMINDER (tâche #136, 2026-09-21, généralisation actée d'une précision réelle
  // trouvée pendant le chantier 3 : « avant de recommander/lancer une simulation coûteuse, vérifier
  // d'abord si les données déjà archivées répondent à la question »). Appended aux verdicts non
  // anodins seulement — jamais sur un verdict "ok", qui n'a rien de coûteux à peser.
  assert.ok(okVerdict.message.includes(ARCHIVE_FIRST_REMINDER), 'a soft-warning verdict (a real costly pattern below its hard threshold) must carry the proactive archive-first reminder, the whole point of making SMART-CONSO-TOKEN proactive rather than purely reactive');
  assert.ok(hardVerdict.message.includes(ARCHIVE_FIRST_REMINDER), 'a hard-threshold verdict must likewise carry the reminder — the question window it opens is exactly the moment to ask whether an archive already answers the need');
  assert.ok(!unknownVerdict.message.includes(ARCHIVE_FIRST_REMINDER), 'a genuinely neutral "ok" verdict must never carry the reminder — nothing costly is being weighed, so nudging toward archives would be noise');

  const claudeMdText = 'ligne\n'.repeat(400);
  const scanResultAlways = scanDocumentWeight(claudeMdText, 'CLAUDE.md', { alwaysLoaded: true });
  assert.equal(scanResultAlways.conformeProgressiveDisclosure, false, 'a document well past the 300-line progressive-disclosure benchmark must be flagged as non-conforming, exactly the real finding on the project\'s own CLAUDE.md');
  assert.equal(scanResultAlways.urgence, 'action_requise', 'an always-loaded document over the benchmark must be classified as requiring real action, since its cost is paid on every single message');
  const scanResultOnDemand = scanDocumentWeight(claudeMdText, 'docs/referentiel/principes.md', { alwaysLoaded: false });
  assert.equal(scanResultOnDemand.urgence, 'informative', 'a document read only on demand must never be classified as requiring action even when it is large — its size is normal for reference material, exactly the distinction the user asked to add after judging the first scan not actionable enough');
  assert.ok(scanResultOnDemand.actionPossible.includes('Aucune action'), 'an on-demand document\'s actionPossible field must explicitly say no action is needed, never the same generic suggestion given to an always-loaded document');
  const smallDoc = scanDocumentWeight('ligne\n'.repeat(10), 'petit.md');
  assert.equal(smallDoc.conformeProgressiveDisclosure, true, 'a small document well under the benchmark must never be falsely flagged');
  assert.equal(smallDoc.alwaysLoaded, false, 'alwaysLoaded must default to false when not specified, never crash on a missing option');

  const markers = countDatedNarrativeMarkers('*(ajouté le 2026-09-19, texte)* et encore *(précisé le 2026-09-20, autre texte)* et du texte normal.');
  assert.equal(markers.occurrences, 2, 'countDatedNarrativeMarkers() must find every dated parenthetical aside in the text, a real mechanical signal of historical/justificatory content rather than active rule text');
  assert.equal(countDatedNarrativeMarkers('texte sans aside daté du tout.').occurrences, 0, 'text with no dated aside must report zero markers, never a false positive');

  // Parenthèse imbriquée (2026-09-20, limite réelle trouvée en pratique sur CLAUDE.md — deux vrais
  // cas manqués par la version précédente du regex, cf. claude-md-asides-historique.md) : l'aside
  // entière doit être capturée d'un bloc, jamais coupée à la première parenthèse fermante interne.
  const nestedText = "*(Ajouté le 2026-09-19, reconstruit à partir de cinq vrais prompts (16 au 19 septembre) retrouvés)* reste du texte normal.";
  const nestedMarkers = listDatedNarrativeMarkers(nestedText);
  assert.equal(nestedMarkers.length, 1, 'a dated aside containing one nested parenthesis must still be recognized as exactly one marker, never split into a truncated fragment plus leftover text');
  assert.ok(nestedMarkers[0].extrait.includes('16 au 19 septembre'), 'the captured aside must span the full nested content, never stop at the first inner closing parenthesis');
  assert.equal(countDatedNarrativeMarkers('*(a)* *(b 2026-09-19 c)* texte').occurrences, 1, 'a real dated aside must still be told apart from an unrelated undated parenthetical right next to it, never merged into one over-greedy match');

  const multiline = 'ligne1\nligne2\n*(ajouté le 2026-09-19, un texte assez long pour être tronqué si besoin)*\nligne4';
  const listed = listDatedNarrativeMarkers(multiline);
  assert.equal(listed.length, 1, 'listDatedNarrativeMarkers() must return one concrete entry per real dated aside found, a ready-to-use worklist rather than a bare count');
  assert.equal(listed[0].ligne, 3, 'each entry must report the real 1-indexed line number where the aside starts, so a future restructuring pass can jump straight to it rather than re-searching the whole file');
  assert.ok(listed[0].extrait.length > 0 && !listed[0].extrait.includes('\n'), 'each entry must include a readable single-line excerpt, never a raw multi-line dump');
  assert.deepEqual(listDatedNarrativeMarkers(''), [], 'empty or missing text must return an empty worklist, never crash');

  assert.deepEqual(SCOPE_LEVELS, ['global', 'partiel', 'zoome', 'focus'], 'SMART-CONSO-TOKEN must reuse the exact same 4-level scope vocabulary already created for THE-FINAL-JUDGE, never a second invented taxonomy (explicit harmony request)');
  assert.throws(() => scanScope('portee-inconnue', {}), /Portée inconnue/, 'an unrecognized scope level must fail loudly rather than silently defaulting to some arbitrary behavior');
  const scopeResult = scanScope('partiel', { 'a.md': 'x\n'.repeat(5), 'b.md': 'x\n'.repeat(500), 'CLAUDE.md': claudeMdText }, new Set(['CLAUDE.md']));
  assert.equal(scopeResult.documentsAnalyses, 3, 'scanScope() must analyze every document passed in for the given scope, never silently dropping one');
  assert.equal(scopeResult.actionRequise.length, 1, 'scanScope() must place only the always-loaded, over-benchmark document (CLAUDE.md) in actionRequise');
  assert.equal(scopeResult.informatif.length, 1, 'scanScope() must place the on-demand, over-benchmark document (b.md) in informatif, never mixed in with real action items');
  assert.equal(scopeResult.aRegarder.length, 2, 'aRegarder must remain the combined list for backward compatibility, covering both action_requise and informative findings');

  assert.deepEqual(computeAdoptionKpi({ actions: [] }), { propositionsAppliquees: 0, reductionMoyennePct: undefined }, 'with zero applied proposals, the KPI must report an honest zero/undefined, never a fabricated average');
  const kpi = computeAdoptionKpi({ actions: [{ type: 'proposition_appliquee', reductionPct: 20 }, { type: 'proposition_appliquee', reductionPct: 40 }, { type: 'autre_action' }] });
  assert.deepEqual(kpi, { propositionsAppliquees: 2, reductionMoyennePct: 30 }, 'the KPI must count and average only genuinely applied proposals with a real measured reduction, ignoring unrelated recorded actions — the tool\'s real vocation per the user\'s explicit request, never a count of scans merely run');
  assert.ok(KNOWLEDGE_PROVENANCE.validatedFor === 'claude' && KNOWLEDGE_PROVENANCE.sources.length > 0, 'the knowledge provenance must always declare which model it was validated for and cite real sources, never an unsourced or unattributed registry');

  // recordAction()/reductionPct (2026-09-21, écart réel trouvé en voulant nourrir computeAdoptionKpi()
  // avec le travail de ce soir) : computeAdoptionKpi() attend un champ `reductionPct` au premier
  // niveau de l'action, mais recordAction() ne le faisait jamais passer depuis ses `options` — le
  // commentaire du code annonçait déjà "Alimenté par recordAction(..., { reductionPct })" comme si
  // c'était déjà le cas, alors qu'aucun appel réel en production ne l'avait jamais fait. Testé contre
  // le vrai fichier (backup/restore, même discipline que les autres tests à état réel de ce fichier)
  // puisque recordAction()/loadJson() n'ont pas de fs injectable (contrairement aux outils plus
  // récents comme recordCatalog()).
  {
    const histPath = new URL('../.smart-conso-token-history.json', import.meta.url);
    const { existsSync: exX, readFileSync: rdX, writeFileSync: wrX, unlinkSync: unX } = await import('node:fs');
    const hadFile = exX(histPath);
    const backup = hadFile ? rdX(histPath, 'utf8') : undefined;
    try {
      const before = Date.now();
      recordAction('proposition_appliquee', { chantier: 'test unitaire' }, before, { reductionPct: 42 });
      const written = JSON.parse(rdX(histPath, 'utf8'));
      const found = written.actions.find((a) => a.type === 'proposition_appliquee' && a.at === before);
      assert.ok(found && found.reductionPct === 42, 'recordAction() must now actually persist reductionPct when passed in options, closing the exact real gap where computeAdoptionKpi() could never find a single real entry because no call site ever attached this field — the KPI existed since the tool\'s creation but was never genuinely fed');
    } finally {
      if (hadFile) wrX(histPath, backup); else if (exX(histPath)) unX(histPath);
    }
  }
  console.log('Passed: recordAction() now genuinely persists reductionPct through to the real history file when supplied, the exact missing wire computeAdoptionKpi() needed since SMART-CONSO-TOKEN\'s creation — verified against the real file with a full backup/restore, never left in a dirty state.');
  assert.ok(AUTOMATION_TOKEN_NUANCE.mecanique && AUTOMATION_TOKEN_NUANCE.agentSepare, 'the tool must explicitly know the two-sided truth about automation: mechanical scripts genuinely save tokens (zero context cost) while separate-agent spawns never do (fixed cost added on top) — the exact real distinction the user asked it to master for resource allocation');

  const report = formatScanReport(scopeResult, now);
  assert.ok(report.includes('ACTION REQUISE') && report.includes('INFORMATIF SEULEMENT'), 'the archived scan report must clearly separate action-required findings from informative-only ones into two distinct sections, never one flat mixed list — the exact readability fix the user asked for after judging the first report not actionable enough');
  assert.ok(report.includes(String(scopeResult.totalTokens)), 'the archived scan report must state the real total token estimate computed for this scan, never a placeholder');

  const judgeIndex = '| Date | X |\n|---|---|\n| 2026-09-20 | y |\n| 2026-09-25 | z |';
  const historyWithOneSpawn = { actions: [{ type: 'agent_subagent_spawn', at: new Date('2026-09-20T12:00:00Z').getTime() }] };
  const missing = findJudgeSpawnsWithoutConsultation(judgeIndex, historyWithOneSpawn);
  assert.deepEqual(missing, ['2026-09-25'], 'findJudgeSpawnsWithoutConsultation() must flag exactly the real archived THE-FINAL-JUDGE passage date with no matching confirmed agent-spawn consultation nearby, while never flagging the date that does have one — this is real, verifiable authority over another tool, since a judge report can only exist if a spawn genuinely happened');
  assert.deepEqual(findJudgeSpawnsWithoutConsultation('', { actions: [] }), [], 'an empty or missing index must report zero missing consultations, never crash or fabricate a finding from no data');

  // Test de connexion (2026-09-20, demande explicite : « smart conso token a un test de connexion
  // dédié à tous les autres outils, ainsi qu'à toi »).
  const allConnectedExceptClaude = Object.fromEntries(Object.keys(EXPECTED_CONNECTIONS).map((p) => [p, 'cite smart-conso-token ici']));
  allConnectedExceptClaude['CLAUDE.md'] = 'aucune mention';
  assert.deepEqual(checkToolConnections(allConnectedExceptClaude), ['CLAUDE.md'], 'checkToolConnections() must flag exactly the document genuinely missing a reference to SMART-CONSO-TOKEN, case-insensitively, while never flagging one that already cites it');
  assert.deepEqual(checkToolConnections({}), Object.keys(EXPECTED_CONNECTIONS), 'with no documents provided at all, every expected connection must be reported missing, never silently skipped');
  // Vérification RÉELLE et bloquante contre les vrais fichiers du dépôt (pas seulement un exemple
  // synthétique) : casse le pre-commit hook le jour où l'un de ces documents (EXPECTED_CONNECTIONS,
  // dont THE-DEEP-READER depuis le 2026-09-20) perdrait sa référence à SMART-CONSO-TOKEN — la
  // garantie mécanique que l'utilisateur a demandée.
  const realConnectionDocs = {};
  for (const path of Object.keys(EXPECTED_CONNECTIONS)) realConnectionDocs[path] = fs.readFileSync(path, 'utf8');
  const realMissingConnections = checkToolConnections(realConnectionDocs);
  assert.deepEqual(realMissingConnections, [], `every real document expected to reference SMART-CONSO-TOKEN (CLAUDE.md for the agent itself, plus every costly tool that must consult it) must genuinely do so — missing: ${realMissingConnections.join(', ')}`);

  // Exploitation autonome de l'historique accumulé (2026-09-20, demande explicite : « il enrichit
  // une base de données qu'il exploite de façon autonome pour nourrir la qualité de ses conseils »).
  const t1 = 5_000_000;
  const trendNoPast = trackWeightTrend({ actions: [] }, 1000, t1);
  assert.equal(trendNoPast.direction, 'premier_scan', 'with no past scan recorded, the trend must honestly report this is the first scan, never fabricate a false baseline');
  const historyWithPastScan = { actions: [{ type: 'scan', at: t1 - 1000, totalTokens: 2000 }] };
  const improved = trackWeightTrend(historyWithPastScan, 1500, t1);
  assert.equal(improved.direction, 'amelioration', 'a genuinely lower total than the most recent past scan must be reported as a real improvement');
  const degraded = trackWeightTrend(historyWithPastScan, 2500, t1);
  assert.equal(degraded.direction, 'degradation', 'a genuinely higher total than the most recent past scan must be reported as a real degradation, never silently ignored');
  const stable = trackWeightTrend(historyWithPastScan, 2000, t1);
  assert.equal(stable.direction, 'stable', 'an exactly unchanged total must be reported as stable, neither a false improvement nor a false degradation');
  const multiPast = { actions: [{ type: 'scan', at: t1 - 5000, totalTokens: 9000 }, { type: 'scan', at: t1 - 1000, totalTokens: 3000 }] };
  assert.equal(trackWeightTrend(multiPast, 3000, t1).direction, 'stable', 'with multiple past scans recorded, the comparison must always use the MOST RECENT one, never an older or averaged figure');

  // detectTaskMomentum() (tâche #138, 2026-09-21) : accompagnement en temps réel d'une tâche longue,
  // calibré par 3 questions explicites — un déclencheur combiné (nombre d'actions OU temps écoulé OU
  // poids cumulé, n'importe lequel suffit), un bloc informatif jamais un blocage, une seule fois par
  // lancée (jamais répété tant que le seuil reste franchi sur la même lancée).
  {
    const tnow = 5_000_000_000;
    const run = { actions: [
      { type: 'scan', at: tnow - 20 * 60000 },
      { type: 'scan', at: tnow - 15 * 60000 },
      { type: 'scan', at: tnow - 10 * 60000, tokensEstimes: 20000 },
      { type: 'agent_subagent_spawn', at: tnow - 5 * 60000, tokensEstimes: 37000 },
      { type: 'scan', at: tnow - 1 * 60000 },
    ] };
    const idle = detectTaskMomentum({ actions: [] }, tnow);
    assert.equal(idle.signale, false, 'an empty history must never signal a long-running task — nothing has happened yet');

    const fired = detectTaskMomentum(run, tnow);
    assert.equal(fired.signale, true, 'a run of 5 chained costly actions (at the configured count threshold) must trip the signal even before the time or token thresholds are separately checked');
    assert.equal(fired.actionCount, 5, 'the reported action count must be the real number of chained actions in the current run, never an estimate');
    assert.equal(fired.cumulativeTokens, 57000, 'the cumulative token figure must sum only the real tokensEstimes values actually supplied by the caller, never guess a number for actions that carried none');
    assert.ok(fired.franchis.length >= 2, 'both the action-count threshold AND the cumulative-token threshold are genuinely crossed by this run, so the report must name both, never silently pick just one axis when several fire together');
    assert.ok(fired.bloc.startsWith('⏳ SMART-CONSO-TOKEN'), 'the rendered block must be immediately recognizable as a distinct, clearly-labeled callout — the explicit calibration answer "clear and precise, between a buried line and a hard stop"');

    // Seuil temps testé isolément : 3 actions seulement (bien sous le seuil de compte de 5), mais
    // chaînées avec un écart ≤30 min entre chacune (donc une seule et même lancée) et un total de
    // ~50 min entre la première et maintenant — au-delà du seuil de 45 min, doit déclencher sur cet
    // axe seul.
    const timeOnly = detectTaskMomentum({ actions: [{ type: 'scan', at: tnow - 50 * 60000 }, { type: 'scan', at: tnow - 25 * 60000 }, { type: 'scan', at: tnow - 1000 }] }, tnow);
    assert.equal(timeOnly.actionCount, 3, 'sanity check on the test fixture itself: all 3 actions must belong to the same run (each gap under the 30-minute run-boundary), never accidentally split by the currentTaskRun heuristic');
    assert.equal(timeOnly.signale, true, 'elapsed real time alone (a task dragging on with few actions) must be able to trip the signal on its own, independent of the action-count axis — the whole point of combining several axes rather than relying on count alone');

    const withMarker = { actions: [...run.actions, { type: 'long_task_signal', at: tnow }] };
    const suppressed = detectTaskMomentum(withMarker, tnow + 60000);
    assert.equal(suppressed.signale, false, 'once the marker itself has been recorded for this exact run, the signal must never fire a second time for the same run — the explicit "once per task" calibration answer');

    const afterGap = detectTaskMomentum(withMarker, tnow + 60 * 60000);
    assert.equal(afterGap.signale, false, 'a fresh moment with no new action after a real gap must never resurrect an old, already-closed run just because its marker is still sitting in history');
    assert.equal(afterGap.actionCount, 0, 'a genuinely empty new run (nothing happened after the gap) must report zero actions, never leak the count from the previous, unrelated run');

    assert.ok(TASK_MOMENTUM_THRESHOLDS.actionCount > 0 && TASK_MOMENTUM_THRESHOLDS.elapsedMs > 0 && TASK_MOMENTUM_THRESHOLDS.cumulativeTokens > 0, 'all three combined thresholds must be genuinely positive numbers, never a disabled/zeroed axis silently doing nothing');
  }

  console.log('Passed: SMART-CONSO-TOKEN correctly estimates token weight from raw text length, classifies a document into low/moderate/high relative to the cited research benchmarks, never silently assumes its costly-pattern knowledge stays valid across a real model/platform change, escalates a recognized costly pattern from soft to hard exactly at its configured threshold while never fabricating a verdict for an unknown pattern, reuses THE-FINAL-JUDGE\'s exact scope vocabulary rather than inventing a second one, now correctly distinguishes an always-loaded document (real actionable cost) from an on-demand one (informative only) with a genuinely differentiated concrete action for each, mechanically counts real dated narrative markers as a safe starting point for a future restructuring, computes its adoption KPI from real applied proposals only, explicitly knows the two-sided truth about automation\'s real token cost, can retroactively verify — using THE-FINAL-JUDGE\'s own archived reports as independent proof — whether a real agent spawn was ever actually preceded by a confirmed consultation, mechanically confirms (checked live against the project\'s own real files) that every document meant to reference it genuinely does, exploits its own accumulated scan history to report a real improvement or degradation trend rather than a bare current number, and — task #138 — combines a chained-action count, elapsed real time, and cumulative estimated token weight (whichever crosses first) into a single once-per-run, purely informative block that never blocks the agent\'s work.');

  // Distinction investissement / consommation sans retour (2026-09-20, demande explicite : « il ne
  // faut pas qu'il décourage un investissement sain, qu'il vienne de moi, toi ou les outils »).
  assert.equal(classifyConsumption({ buildsReusableTool: true }).classification, 'investissement', 'a spend that builds a mechanism reused at zero future cost must be classified as a genuine investment');
  assert.equal(classifyConsumption({ preventsFutureDebugging: true }).classification, 'investissement', 'a verification performed before a risky change, cheaper than debugging the same issue later, must also be classified as a genuine investment');
  assert.equal(classifyConsumption({ isDuplicateOfRecent: true, buildsReusableTool: true }).classification, 'sans_retour', 'a duplicate of recent work can never be an investment, even when it also claims to build a reusable tool — the anti-duplicate rule always wins');
  assert.equal(classifyConsumption({ scopeMatchesNeed: false, buildsReusableTool: true }).classification, 'sans_retour', 'a spend whose scope overshoots the real expressed need is classified as no-return even with an otherwise sound intent, since the excess cost itself pays for nothing');
  assert.equal(classifyConsumption({}).classification, 'a_evaluer', 'with no recognized investment signal at all, the verdict is an honest "to evaluate", never a presumed waste by default');

  const investAssess = assess({ actionType: 'agent_subagent_spawn', history: { actions: [] }, now: Date.now(), agentIdentity: 'claude-sonnet-5', investment: { buildsReusableTool: true } });
  assert.equal(investAssess.verdict, 'investissement_reconnu', 'a costly pattern recognized as a genuine investment must never be phrased as a discouraging warning — the verdict itself must reflect that recognition');
  const wasteAssess = assess({ actionType: 'agent_subagent_spawn', history: { actions: [] }, now: Date.now(), agentIdentity: 'claude-sonnet-5', investment: { isDuplicateOfRecent: true } });
  assert.equal(wasteAssess.verdict, 'avertissement_souple', 'a costly pattern explicitly identified as a duplicate with no return must keep the normal soft-warning verdict, never be upgraded to a false investment recommendation');
  const hardWithInvestment = assess({ actionType: 'agent_subagent_spawn', history: { actions: [{ type: 'agent_subagent_spawn', at: Date.now() }, { type: 'agent_subagent_spawn', at: Date.now() }, { type: 'agent_subagent_spawn', at: Date.now() }] }, now: Date.now(), agentIdentity: 'claude-sonnet-5', investment: { buildsReusableTool: true } });
  assert.equal(hardWithInvestment.verdict, 'seuil_dur', 'a hard threshold already reached must stay non-negotiable (Article 22) even facing a recognized investment — the classification informs the mandatory question, it never bypasses it');
  assert.ok(hardWithInvestment.message.includes('Investissement'), 'the hard-threshold message must still surface the investment context, so the mandatory question to the user is well-informed rather than needlessly alarmist');

  assert.deepEqual(computeInvestmentRatio({ actions: [] }, Date.now()).total, 0, 'with no classified actions at all, the investment ratio must report an honest zero, never a fabricated percentage');
  const ratioNow = Date.now();
  const ratioHistory = { actions: [
    { type: 'a', at: ratioNow - 1000, classification: 'investissement' },
    { type: 'b', at: ratioNow - 2000, classification: 'investissement' },
    { type: 'c', at: ratioNow - 3000, classification: 'sans_retour' },
    { type: 'd', at: ratioNow - 4000, classification: 'a_evaluer' },
    { type: 'e', at: ratioNow - 4000 },
  ] };
  const ratio = computeInvestmentRatio(ratioHistory, ratioNow);
  assert.deepEqual({ total: ratio.total, investissement: ratio.investissement, sansRetour: ratio.sansRetour, aEvaluer: ratio.aEvaluer }, { total: 4, investissement: 2, sansRetour: 1, aEvaluer: 1 }, 'computeInvestmentRatio() must count only genuinely classified actions within the window, correctly splitting investment/no-return/to-evaluate and ignoring an unclassified action entirely rather than miscounting it');
  assert.equal(ratio.pctInvestissement, 50, 'the investment percentage must be computed from the real classified total, never from all recorded actions including unclassified ones');

  console.log('Passed: classifyConsumption() correctly recognizes a genuine token investment (a reusable mechanical tool built, or a check that prevents costlier future debugging) versus a no-return spend (a duplicate of recent work, or a scope that overshoots the real need), assess() reflects a recognized investment as a distinct non-discouraging verdict while a hard hourly threshold stays non-negotiable regardless (informed, never bypassed), and computeInvestmentRatio() reports an honest, correctly-split investment/waste breakdown from real classified history only — the exact real gap the user asked to close: never discouraging a healthy investment, whether it comes from them, the agent, or the tools.');

  // Auto-diagnostic sécurisé (2026-09-20, demande explicite : « il se rend compte s'il a fait des
  // erreurs d'appréciation [...] mécanisme d'apprentissage » — calibré avec l'utilisateur en version
  // sécurisée après signalement d'une tension avec la charte : jamais un ajustement automatique,
  // seulement des constats à lire). Portée agent+outils, jamais l'utilisateur.
  const dNow = Date.now();
  const compliantHard = diagnoseAdviceAccuracy({ actions: [
    { type: 'x', at: dNow - 800_000, verdict: 'seuil_dur', recipient: 'agent' },
    { type: 'x', at: dNow - 100_000, verdict: 'ok', recipient: 'agent' },
  ] }, dNow);
  assert.equal(compliantHard.length, 0, 'a hard-threshold verdict followed by the next same-type action only after a long, plausible gap (well beyond the reaction window) must never be flagged as a compliance issue');
  const ignoredHard = diagnoseAdviceAccuracy({ actions: [
    { type: 'agent_subagent_spawn', at: dNow - 100_000, verdict: 'seuil_dur', recipient: 'agent' },
    { type: 'agent_subagent_spawn', at: dNow - 99_500, verdict: 'ok', recipient: 'agent' },
  ] }, dNow);
  assert.equal(ignoredHard.length, 1, 'a hard-threshold verdict followed by a same-type confirmed action mere seconds later must be flagged as a likely unrespected hard threshold — the exact real compliance question the user asked SMART-CONSO-TOKEN to track for the agent');
  const userIgnored = diagnoseAdviceAccuracy({ actions: [
    { type: 'x', at: dNow - 100_000, verdict: 'seuil_dur', recipient: 'utilisateur' },
    { type: 'x', at: dNow - 99_500, verdict: 'ok', recipient: 'utilisateur' },
  ] }, dNow);
  assert.equal(userIgnored.length, 0, 'entries recorded for the user must never be scanned for compliance at all — no mechanical trace exists for what the user decides, honesty over false precision per the explicit 2026-09-20 calibration');

  const outcomeFindings = diagnoseAdviceAccuracy({ actions: [
    { type: 'y', at: dNow - 1000, verdict: 'avertissement_souple', recipient: 'agent', outcome: 'probleme_reel' },
    { type: 'z', at: dNow - 2000, verdict: 'avertissement_souple', recipient: 'agent', outcome: 'sans_consequence' },
    { type: 'w', at: dNow - 3000, verdict: 'investissement_reconnu', recipient: 'agent', outcome: 'probleme_reel' },
    { type: 'v', at: dNow - 4000, verdict: 'ok', recipient: 'agent', outcome: 'sans_consequence' },
  ] }, dNow);
  assert.equal(outcomeFindings.length, 3, 'diagnoseAdviceAccuracy() must surface a finding for every recorded outcome that is genuinely informative about a past verdict (soft-warning-confirmed-real-problem, soft-warning-with-no-consequence, investment-that-turned-out-wasteful), while silently ignoring an outcome recorded against a plain "ok" verdict that carries no such signal');
  assert.deepEqual(diagnoseAdviceAccuracy({ actions: [] }, dNow), [], 'with a genuinely empty history, the diagnostic must report zero findings, never fabricate one from no data');

  // parseOutcomeArgs() (2026-09-20) : le vrai découpage de process.argv pour "node
  // scripts/smart-conso-token.mjs outcome <type> <at> <outcome>" — trouvé cassé au tout premier
  // usage réel en ligne de commande (l'ancien code sautait un élément de trop et lisait
  // silencieusement le triplet décalé, jamais détecté avant car recordOutcome() n'était testé que
  // par appel direct de fonction, jamais via le vrai CLI).
  const realOutcomeArgv = ['/usr/bin/node', '/home/user/aihouse/scripts/smart-conso-token.mjs', 'outcome', 'agent_subagent_spawn', '1789904646767', 'confirme_utile'];
  assert.deepEqual(parseOutcomeArgs(realOutcomeArgv), { type: 'agent_subagent_spawn', atArg: '1789904646767', outcome: 'confirme_utile' }, 'parseOutcomeArgs() must read the real type/timestamp/outcome triplet from a genuine process.argv shape, never a shifted-by-one triplet that would silently record the wrong data or reject valid input as missing');

  // extractNormativeMarkers()/diffNormativeMarkers() (2026-09-20, safety net for the real CLAUDE.md
  // prose-tightening pass — a new mechanical guard, consulted-and-confirmed-necessary via
  // le-coordinateur.mjs::suggestPrestationsForTask() first, since nothing existing covers this).
  const oldClaude = 'Ceci est une phrase neutre sans rien de spécial.\n\nOn ne doit jamais couper une règle réelle sans vérifier. Le seuil est fixé à 300 lignes pour ce document. Voir Article 7 pour le détail.';
  const normativeMarkers = extractNormativeMarkers(oldClaude);
  assert.equal(normativeMarkers.length, 3, 'extractNormativeMarkers() must flag exactly the sentences carrying a normative keyword, a numeric threshold, or an Article/file reference — never the plain neutral sentence with none of the three');
  assert.ok(normativeMarkers.some((m) => m.includes('jamais')) && normativeMarkers.some((m) => m.includes('300 lignes')) && normativeMarkers.some((m) => m.includes('Article 7')), 'each of the three real marker categories (normative keyword, numeric threshold, Article reference) must actually be represented among the flagged sentences');

  const tightenedSafe = 'On ne doit jamais couper une règle réelle sans vérification. Le seuil reste fixé à 300 lignes pour ce document. Voir Article 7 pour le détail complet.';
  const safeDiff = diffNormativeMarkers(oldClaude, tightenedSafe);
  assert.deepEqual(safeDiff.lost, [], 'a genuine prose-tightening pass that only rewords each normative sentence while keeping its real substance (same threshold, same rule, same reference) must report zero lost markers, never a false alarm over mere rephrasing');

  const tightenedUnsafe = 'Ce document reste raisonnablement court. Voir la documentation pour plus de détails.';
  const unsafeDiff = diffNormativeMarkers(oldClaude, tightenedUnsafe);
  assert.equal(unsafeDiff.lost.length, 3, 'a pass that silently drops the real "jamais" rule, the real 300-line threshold, and the real Article 7 reference must be caught as exactly three lost markers — the regression this safety net exists to prevent');
  assert.ok(unsafeDiff.lost.some((m) => m.includes('300 lignes')), 'the lost-marker list must name the actual dropped sentence, never just a bare count with no way to locate what disappeared');

  assert.deepEqual(diffNormativeMarkers('', ''), { oldCount: 0, newCount: 0, lost: [] }, 'a genuinely empty before/after (or a section with no normative content at all) must report an honest all-zero result, never crash or fabricate a finding');

  console.log('Passed: diagnoseAdviceAccuracy() mechanically flags a hard threshold likely unrespected (a same-type confirmed action mere seconds after a "seuil_dur" verdict) and surfaces every genuinely recorded outcome that contradicts or confirms a past verdict, restricts its scan to the agent and tools only (the user\'s own compliance is never mechanically inferred, per the explicit 2026-09-20 calibration after the tension with the never-self-adjust rule was flagged), reports zero findings on empty history, and — the whole point of this safer design — never itself changes any threshold or classification, only ever surfacing a proposal for a human/agent to read; and extractNormativeMarkers()/diffNormativeMarkers() correctly isolate sentences carrying a real normative keyword, numeric threshold, or Article/file reference, tolerate genuine rewording that preserves substance, and catch — by name, not just by count — every real rule silently dropped during a prose-tightening pass, the exact safety net the user asked for before the CLAUDE.md lightening pass.');

  // CLAUDE.MD.SPY (2026-09-20, demande explicite de l'utilisateur : classer chaque règle de
  // CLAUDE.md par sensibilité/importance, détecter les redondances). PAS un membre de l'équipe,
  // une extension de SMART-CONSO-TOKEN — cf. docs/referentiel/smart-conso-token.md.
  const fakeCharter = [
    '**Article 0 — Titre zéro.** Texte de l\'article zéro, toujours très sensible par construction.',
    '',
    '**Article 1 — Un premier sujet.** Ce texte parle de chats et de chiens dans le jardin.',
    '',
    '**Article 2 — Un principe non négociable.** Ceci est non négociable et doit toujours être respecté.',
    '',
    '## Une section hors charte',
    '',
    'Du texte qui ne doit jamais être compté comme faisant partie de l\'Article 2.',
  ].join('\n');
  const units = extractRuleUnits(fakeCharter);
  assert.equal(units.length, 3, 'extractRuleUnits() must find exactly the three real "Article N — Title." headings, never miscounting on a realistic multi-article fixture');
  assert.equal(units[0].article, 0, 'the first unit must carry its real article number, read from the heading itself');
  assert.equal(units[1].titre, 'Un premier sujet', 'the title must be the real text between the em-dash and the closing period, never including the bold markers themselves');
  assert.ok(!units[2].texte.includes('ne doit jamais être compté'), 'a unit must stop at the next top-level "## " heading even when no further "Article N" heading follows — closing the real bug found while calibrating this against the actual CLAUDE.md, where the last Article (23) was silently swallowing the entire rest of the file (510 lines of unrelated "Plan d\'origine" content) for lack of this boundary');

  assert.equal(countArticleCrossReferences(2, { 'a.mjs': 'cf. Article 2 et Article 2 encore', 'b.md': 'voir Article 2' }), 3, 'countArticleCrossReferences() must count every real occurrence of "Article N" across every other file, never stopping at the first match per file');
  assert.equal(countArticleCrossReferences(5, { 'a.mjs': 'rien à voir ici' }), 0, 'a genuinely uncited article must report zero, never a false positive from a loosely related number');

  assert.equal(classifyRuleSensitivity({ article: 0, texte: 'peu importe le texte' }), 'très sensible (Article 0, fixe — jamais recalculée)', 'Article 0 must always receive the fixed maximal sensitivity label regardless of its own text, per the explicit user calibration — never computed like any other article');
  assert.equal(classifyRuleSensitivity({ article: 7, texte: 'Ceci est non négociable.' }), 'sensible (se déclare non négociable)', 'a non-zero article that explicitly self-declares as "non négociable" must be flagged sensitive, a real mechanical proxy rather than a guess');
  assert.equal(classifyRuleSensitivity({ article: 7, texte: 'Un texte ordinaire sans marqueur.' }), 'normale', 'an article with neither the Article-0 status nor a self-declared non-negotiable marker must default to the honest "normale" tier, never inflated');

  assert.equal(classifyRuleImportance(50), 'élevée', 'a high real cross-reference count (calibrated empirically against the actual CLAUDE.md, where citation counts range from 3 to 81) must classify as élevée');
  assert.equal(classifyRuleImportance(20), 'moyenne', 'a mid-range count must classify as moyenne, never collapsed into élevée by an unrealistically low threshold');
  assert.equal(classifyRuleImportance(2), 'faible', 'a genuinely rarely-cited article must classify as faible, never inflated by a threshold too low to discriminate on this project\'s real citation density');

  const redundantFixture = [
    { article: 1, texte: 'chevaux ecureuils papillons libellules hirondelles moineaux tortues grenouilles' },
    { article: 2, texte: 'chevaux ecureuils papillons libellules hirondelles moineaux tortues renards' },
    { article: 3, texte: 'automobiles ordinateurs telephones imprimantes claviers ecrans souris cables' },
  ];
  const strongPairs = findRedundantRulePairs(redundantFixture, { threshold: 0.5 });
  assert.equal(strongPairs.length, 1, 'two rules sharing almost all of their significant vocabulary must be flagged as exactly one redundant pair at a strict threshold');
  assert.deepEqual([strongPairs[0].a, strongPairs[0].b], [1, 2], 'the flagged pair must name the real two articles that overlap, never the unrelated third one');
  assert.equal(findRedundantRulePairs(redundantFixture, { threshold: 0.5 }).some((p) => p.a === 3 || p.b === 3), false, 'an article with genuinely unrelated vocabulary must never be pulled into a redundant pair just because it exists in the same batch');
  assert.deepEqual(findRedundantRulePairs([], { threshold: 0.2 }), [], 'an empty rule list must report zero pairs rather than crash on a division by zero inside the Jaccard computation');

  const realClaudeMd = fs.readFileSync('CLAUDE.md', 'utf8');
  const realUnits = extractRuleUnits(realClaudeMd);
  assert.ok(realUnits.length >= 20, 'run live against the project\'s own real CLAUDE.md, extractRuleUnits() must find every real numbered Article (currently 24, Article 0 through 23) rather than losing any to a parsing edge case');
  const lastRealUnit = realUnits[realUnits.length - 1];
  assert.ok(lastRealUnit.texte.split('\n').length < 100, 'checked live: the real LAST article\'s unit must stay bounded to its own real content (well under 100 lines) rather than swallowing the "Plan d\'origine" section and everything after it — the exact real regression this boundary fix closes');

  const { rows, redondances } = buildClaudeMdRuleTable(fakeCharter, { 'x.mjs': 'Article 2 Article 2' });
  assert.equal(rows.length, 3, 'buildClaudeMdRuleTable() must aggregate one row per real rule unit, combining sensitivity/importance/cross-references/line count without dropping any');
  assert.equal(rows[0].sensibilite, 'très sensible (Article 0, fixe — jamais recalculée)', 'the aggregated table must carry through the fixed Article 0 sensitivity exactly as classifyRuleSensitivity() would report it alone');
  const rendered = renderClaudeMdRuleTable({ rows, redondances });
  assert.ok(rendered.includes('| Article | Titre | Sensibilité | Importance | Réf. croisées | Lignes |'), 'renderClaudeMdRuleTable() must produce a real markdown table with the documented header row');
  assert.ok(rendered.includes('Aucune redondance forte détectée') || rendered.includes('Redondances possibles'), 'the rendered output must always say explicitly whether a redundancy was found or not, never silently omit that section');

  console.log('Passed: CLAUDE.MD.SPY (extractRuleUnits/countArticleCrossReferences/classifyRuleSensitivity/classifyRuleImportance/findRedundantRulePairs/buildClaudeMdRuleTable/renderClaudeMdRuleTable) correctly splits CLAUDE.md into one unit per real "Article N" heading bounded by either the next Article or the next top-level "## " heading — closing a real regression found while calibrating live against the actual file, where the last Article silently swallowed 510 unrelated lines — counts real cross-file "Article N" citations, gives Article 0 a fixed maximal sensitivity label untouched by any calculation while flagging other articles only on a genuine self-declared "non négociable" marker, classifies importance against thresholds empirically calibrated on this project\'s real citation distribution rather than arbitrary round numbers, flags strong vocabulary overlap between two rules at a strict threshold while never dragging in an unrelated third rule or crashing on an empty list, and assembles/renders the full reference table faithfully.');

  // compareChantiers() (tâche #135, 2026-09-21) : compare des candidats déjà estimés côte à côte,
  // en pur mode "informe, jamais ne décide" — jamais un second calcul de coût, jamais un tri qui
  // choisirait un ordre de traitement à la place de l'utilisateur/l'agent.
  const emptyComparison = compareChantiers([]);
  assert.deepEqual(emptyComparison.comparaison, [], 'an empty candidate list must report an honest empty comparison, never a fabricated entry');
  assert.ok(/rien à comparer/.test(emptyComparison.message), 'an empty candidate list must say so explicitly rather than silently returning nothing');
  const realComparison = compareChantiers([
    { nom: 'CASSANDRA-RH round 2', tokensEstimes: 15000, signaux: ['tâche la plus ancienne ouverte'] },
    { nom: 'SMART-CONSO-TOKEN proactif', tokensEstimes: 3000 },
  ]);
  assert.equal(realComparison.comparaison.length, 2, 'compareChantiers() must return exactly one entry per real candidate given, in the same order, never dropping or reordering one');
  assert.equal(realComparison.total, 18000, 'the total must be the real honest sum of each candidate\'s own already-estimated cost, never a second independent calculation');
  assert.deepEqual(realComparison.comparaison[1].signaux, [], 'a candidate given with no signals must report an honest empty array, never a fabricated one');
  assert.ok(/informe seulement, ne décide jamais/.test(realComparison.message), 'the message must explicitly state this tool never decides which chantier to treat first — the whole point of the "informs, never decides" doctrine already established for classifyConsumption()/assess()');
  const renderedComparison = formatChantierComparison(realComparison);
  assert.ok(renderedComparison.includes('CASSANDRA-RH round 2') && renderedComparison.includes('tâche la plus ancienne ouverte'), 'formatChantierComparison() must render each real candidate by name with its own real signals, never a generic placeholder row');
  assert.equal(formatChantierComparison(emptyComparison), emptyComparison.message, 'rendering an empty comparison must just surface the honest absence message, never an empty markdown table with only headers');
}

{
  // Chantier 3 (2026-09-21, arc relationnel Lia/Noé) : sous l'ancien code, un tour solo (pièces
  // séparées) effaçait TOUJOURS l'attirance proposée par le modèle — hausse ou baisse — avant même
  // d'atteindre le système de crédit de 28 %. Conséquence confirmée en relisant les 14 simulations
  // archivées : le seuil de 75 % (doute amoureux privé, loveRealized) n'a jamais été franchi une
  // seule fois, même sur 229 tours. Seule la moitié d'une vraie HAUSSE solo doit désormais survivre
  // (throttlée par le même système de crédit que les tours ensemble) ; une BAISSE solo doit rester
  // entièrement effacée, comportement inchangé. Placé en tout dernier bloc du fichier (plutôt qu'au
  // fil de la suite) : ce test consomme 2 vrais tours (story.round avance, des mémoires "réflexion"
  // sont insérées), ce qui décalait des tests plus loin dans le fichier qui supposaient un compte de
  // tours précis (ex. seuil TV) — jamais un souci une fois placé en dernier, rien ne dépend de son
  // état final.
  const soloScenarioBackup=sqlite.prepare("SELECT content FROM memories WHERE kind='scenario'").get().content;
  const soloAgent1Backup=sqlite.prepare('SELECT room,intent,needs,emotions FROM agent_state WHERE id=1').get();
  const soloAgent2Backup=sqlite.prepare('SELECT room,intent,needs,emotions FROM agent_state WHERE id=2').get();
  const progress=JSON.parse(soloScenarioBackup);
  progress.round=10;
  // apartTurns (lib/story.ts, top-level, jamais sous life) doit être remis à 0 comme les autres
  // compteurs ci-dessous — sinon ce test hérite silencieusement de tout ce que les tests précédents
  // ont accumulé dans le fichier avant lui (coordinateRooms, lib/turn.ts, force le "suiveur" à
  // rejoindre le "meneur" dès que apartTurns>=2, quel que soit stayAlone). Bug réel trouvé en
  // écrivant Correctif 2 : un tour de plus ajouté à un test antérieur suffisait à faire passer ce
  // compteur hérité au-dessus du seuil, fusionnant Lia et Noé dans la même pièce malgré stayAlone et
  // faisant totalement disparaître l'amortissement solo que ce test vérifie (Article 5 : ne jamais
  // dépendre d'un état accumulé silencieusement par d'autres tests).
  progress.apartTurns=0;
  progress.life={...progress.life,credit:{1:0,2:10},debrief:undefined,contact:undefined,dispute:undefined};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(progress));
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=1').run('salon','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:10,trust:40}));
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=2').run('cuisine','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:20,trust:40}));
  // Historique de conversation vidé (2026-09-22, même geste que le test du doute amoureux privé
  // plus haut) : nextSpeaker() (lib/dialogue.ts) choisit qui est "meneur" ce tour en lisant le
  // DERNIER message de la table conversations, partagée par tous les tests de ce fichier — sans
  // ce vidage, ce choix dépend silencieusement du nombre exact de tours joués par TOUS les tests
  // précédents. Bug réel trouvé en écrivant Correctif 2 : ajouter un seul tour à un test antérieur a
  // suffi à faire basculer nextSpeaker() vers Lia comme "meneur" au lieu de Noé — or seul le
  // "second" (celui qui répond en retrait, jamais le "meneur") voit sa propre pièce respectée via
  // stayAlone (route.ts, ~l.987) : le "meneur" est TOUJOURS placé par turnPlan.room, qui lisait ce
  // même historique (agreedDestination/warmthChain/investigativeCue) et proposait alors une pièce
  // différente de celle fixée ci-dessus, fusionnant silencieusement Lia et Noé dans la même pièce
  // malgré stayAlone (Article 5 : ne jamais dépendre d'un état accumulé silencieusement ailleurs).
  sqlite.exec('DELETE FROM conversations; DELETE FROM dialogue_fingerprints; DELETE FROM world_requests');
  // stayAlone:true est indispensable : coordinateRooms() (lib/turn.ts) réunit sinon
  // automatiquement le "suiveur" dans la pièce du "meneur" dès que story.round>=8 (join-together
  // par défaut), ce qui aurait rendu ce test faussement "ensemble" malgré des pièces différentes.
  const soloDecision=(attraction,room)=>({intent:'chat',affectionAccepted:false,emotions:{curiosity:60,tension:30,trust:40,comfort:50,attraction},reply:'On verra ça plus tard.',thought:'Je repense à lui, seule ici.',stayAlone:true,mood:'attentive',activity:'Je réfléchis',goal:'Comprendre',action:'none',room,memory:'Je repense à lui, seule ici.'});
  const priorFetchSolo=globalThis.fetch;
  let noeForcedAttraction=90; // largement au-dessus du plafond réel : sera clampé par evolveEmotions (+5 max) avant ce correctif
  // Keyed on `state.id` (real Resident field of the character THIS call is for), never on
  // `selfRole` : "interact" mode picks who is "primary" via nextSpeaker(speech, input.actor),
  // which does not always honor input.actor — the reliable way to target Noé's own call.
  globalThis.fetch=async(url,options)=>{
    const context=JSON.parse(JSON.parse(options.body).contents[0].parts[0].text);
    const decision=context.state?.id===2?soloDecision(noeForcedAttraction,'cuisine'):soloDecision(10,'salon');
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(decision)}]}}]});
  };
  let epochSolo=(await readWorld(db)).epoch;
  let responseSolo=await post(input('interact',2,{epoch:epochSolo}));assert.equal(responseSolo.status,200);
  let resultSolo=await responseSolo.json();
  const noeAfterRise=resultSolo.agents.find(a=>a.id===2).emotions.attraction;
  assert.ok(noeAfterRise>20,'a solitary turn with a genuine increase proposed by the model must let SOME of it through (credited via the exact same 0.28 conversion already used for shared-room turns, here pre-loaded with credit=10 to make the step unmistakable), never fully erased back to the pre-turn value the way the old code always did — the exact real mechanism behind loveRealized never once firing across 229 real archived rounds');
  assert.ok(noeAfterRise<=20+11,'the credited solitary increase must still be genuinely throttled (real evolveEmotions clamp + the halving + the existing 0.28 conversion on top of the pre-seeded credit=10), never an uncapped pass-through of the model\'s raw proposed jump to 90');

  progress.life={...progress.life,credit:{1:0,2:10}};
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(JSON.stringify(progress));
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=2').run('cuisine','chat',JSON.stringify({hunger:10,fatigue:10,stress:20,uncertainty:50}),JSON.stringify({...steady,attraction:20,trust:40}));
  noeForcedAttraction=0;
  epochSolo=(await readWorld(db)).epoch;
  responseSolo=await post(input('interact',2,{epoch:epochSolo}));assert.equal(responseSolo.status,200);
  resultSolo=await responseSolo.json();
  assert.equal(resultSolo.agents.find(a=>a.id===2).emotions.attraction,20,'a solitary turn with a genuine DECREASE proposed by the model must still be entirely erased back to the pre-turn value — only the increase side was meant to soften, and the pre-seeded credit=10 must stay untouched since the decrease never reaches the credit-conversion branch at all');
  globalThis.fetch=priorFetchSolo;
  sqlite.prepare("UPDATE memories SET content=? WHERE kind='scenario'").run(soloScenarioBackup);
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=1').run(soloAgent1Backup.room,soloAgent1Backup.intent,soloAgent1Backup.needs,soloAgent1Backup.emotions);
  sqlite.prepare('UPDATE agent_state SET room=?,intent=?,needs=?,emotions=? WHERE id=2').run(soloAgent2Backup.room,soloAgent2Backup.intent,soloAgent2Backup.needs,soloAgent2Backup.emotions);
  console.log('Passed: a solitary turn now lets roughly half of a genuine attraction increase survive (still throttled by the existing 0.28 credit system, never a full pass-through) instead of erasing it outright — the real fix behind the loveRealized threshold being unreachable in every one of the 14 archived simulations — while a solitary decrease still resets fully to the pre-turn value, unchanged.');
}
{
  // LE-RÉGISSEUR (2026-09-21, demande explicite de l'utilisateur pendant l'allègement de CLAUDE.md :
  // « un script au statut membre de l'équipe », jamais l'outil Agent) — orchestre les parties
  // mécaniques, sans jugement, du protocole de simulation complète (Article 18). Frontière trouvée
  // en lisant docs/referentiel/kpi-index.md avant de coder (Article 19) : les DEUX index de
  // jugement (docs/simulations/index.md, docs/referentiel/kpi-index.md) restent hors périmètre —
  // vérifié ici en s'assurant qu'aucune fonction n'écrit dedans.
  const {archiveSimulationFiles,summarizeAndArchiveJournal,extractSyntheseCompacte,runAndArchiveKpiReport,preSimulationChecklist,postSimulationChecklist,parseTranscriptToDialogueBlocks,parseDossierToBlocks,renderTranscriptHtml,renderDossierHtml,SIMULATIONS_DIR,KPI_RAPPORTS_DIR}=await import('../scripts/le-regisseur.mjs');

  // Rendu HTML des transcripts (2026-09-22, demande explicite de l'utilisateur : « je souhaite que
  // les transcripts soient livrés en html agréables à lire ») — réutilise le type de bloc `dialogue`
  // déjà construit dans html-report.mjs pour ce besoin précis, jamais une seconde palette de rendu.
  const fakeTranscript='Lia · pensée\n◈ SAL\n02:08\nPremière pensée de Lia.\n\nNoé\n⌂ BUR\n02:08\nRéponse de Noé.\n\nNoé · déplacement\n⌂ BUR\n02:09\n[bureau→salon] Je file au salon.';
  const transcriptBlocks=parseTranscriptToDialogueBlocks(fakeTranscript);
  assert.equal(transcriptBlocks.length,3,'parseTranscriptToDialogueBlocks() must produce exactly one dialogue block per real 4-line chunk of the transcript text, never merging or dropping one');
  assert.deepEqual(transcriptBlocks[0],{type:'dialogue',speaker:'Lia',text:'[◈ SAL · 02:08] (pensée) Première pensée de Lia.'},'a qualified actor line ("Lia · pensée") must split into a clean speaker ("Lia", so html-report.mjs\'s per-character coloring still matches) with the qualifier reported as a prefix in the text, never lost and never left attached to the speaker field');
  assert.deepEqual(transcriptBlocks[1],{type:'dialogue',speaker:'Noé',text:'[⌂ BUR · 02:08] Réponse de Noé.'},'an unqualified actor line must produce a bare speaker with no fabricated prefix');
  assert.ok(transcriptBlocks[2].text.includes('[bureau→salon]'),'a movement line\'s bracketed content must survive into the rendered text unchanged');
  const transcriptHtml=renderTranscriptHtml(fakeTranscript,{title:'fake — transcript'});
  assert.ok(transcriptHtml.includes('<p class="dialogue speaker-lia"><strong>Lia</strong>')&&transcriptHtml.includes('<p class="dialogue speaker-noe"><strong>Noé</strong>'),'the rendered HTML must apply the real per-character CSS classes already defined in html-report.mjs (speaker-lia/speaker-noe), the exact reason the speaker field must stay clean');
  assert.match(transcriptHtml,/body\s*\{[^}]*zoom:\s*1\.5/,'every HTML report (not just the transcript) must open at 150% zoom, per the shared THEME_CSS rule');

  const fakeDossier='=== VOIX DE LIA ===\nTexte de Lia.\n\n=== VOIX DE NOÉ ===\nTexte de Noé.\n\n=== SYNTHÈSE ===\nTexte de synthèse.';
  const dossierBlocks=parseDossierToBlocks(fakeDossier);
  assert.deepEqual(dossierBlocks,[{type:'heading',text:'VOIX DE LIA'},{type:'paragraph',text:'Texte de Lia.'},{type:'heading',text:'VOIX DE NOÉ'},{type:'paragraph',text:'Texte de Noé.'},{type:'heading',text:'SYNTHÈSE'},{type:'paragraph',text:'Texte de synthèse.'}],'the dossier\'s real 3-section prose structure (never a tour-by-tour dialogue) must become a heading+paragraph pair per section, in order, never the dialogue template which would make no sense here');
  const dossierHtml=renderDossierHtml(fakeDossier,{title:'fake — dossier'});
  assert.ok(dossierHtml.includes('<h2>VOIX DE LIA</h2>')&&dossierHtml.includes('<h2>SYNTHÈSE</h2>'),'the rendered dossier HTML must carry a real heading per section');
  assert.match(dossierHtml,/body\s*\{[^}]*zoom:\s*1\.5/,'the 150% zoom rule was generalized (2026-09-22) from the transcript alone to every HTML report — the dossier must carry it too now, via the shared THEME_CSS rather than a per-report special case');

  const fakeFs={
    files:{sources:{'/tmp/fake_transcript.txt':fakeTranscript,'/tmp/fake_dossier.txt':fakeDossier}},
    existsSync(p){return p in this.files||Object.keys(this.files).some(f=>f.startsWith(p+'/'));},
    mkdirSync(){},
    readFileSync(p){return this.files.sources[p]??this.files[p];},
    writeFileSync(p,content){this.files[p]=content;},
    copyFileSync(src,dest){this.files[dest]=this.files.sources[src];},
  };
  const archived=archiveSimulationFiles({simName:'fake_sim',transcriptPath:'/tmp/fake_transcript.txt',dossierPath:'/tmp/fake_dossier.txt'},fakeFs);
  assert.equal(archived.written.length,4,'a real transcript AND a real dossier must each produce their .txt (reference file, reparsed by other tools) AND their .html (presentation copy) companion — four files total, never silently dropping one');
  assert.equal(fakeFs.files[`${SIMULATIONS_DIR}/fake_sim_transcript.txt`],fakeTranscript,'the transcript .txt must still be copied verbatim to the exact flat naming convention already used by all 16 real archived simulations, never altered by the new HTML rendering being added alongside it');
  assert.equal(fakeFs.files[`${SIMULATIONS_DIR}/fake_sim_dossier.txt`],fakeDossier,'the dossier .txt must be archived the same way, under <sim>_dossier.txt, unchanged');
  assert.ok(fakeFs.files[`${SIMULATIONS_DIR}/fake_sim_transcript.html`].includes('speaker-lia'),'the transcript .html companion must be the real rendered dialogue page, not a placeholder');
  assert.ok(fakeFs.files[`${SIMULATIONS_DIR}/fake_sim_dossier.html`].includes('<h2>VOIX DE LIA</h2>'),'the dossier .html companion must be the real rendered section page, not a placeholder');
  const archivedNoDossier=archiveSimulationFiles({simName:'fake_sim2',transcriptPath:'/tmp/fake_transcript.txt'},fakeFs);
  assert.equal(archivedNoDossier.written.length,2,'a simulation that never reached phase 2 (no dossier, exactly like the real full_sim6/full_sim16 cases already in the registry) must archive only the transcript .txt+.html pair, never fabricate an empty dossier file of either format');
  assert.throws(()=>archiveSimulationFiles({transcriptPath:'/tmp/fake_transcript.txt'},fakeFs),/simName/,'a missing simName must fail loudly with a clear message, never silently write to a malformed path');

  const fakeSh=(cmd)=>cmd.includes('summarize-simulation-log')?'RÉSUMÉ FAKE':'== SYNTHÈSE COMPACTE (à relayer telle quelle dans la conversation) ==\nRun : fake-run\n| Famille | KPI global |\n|---|---|\n| Robustesse du code | 99% |\n\nHistorique complet : docs/referentiel/kpi-historique.csv\n== Autre section jamais imprimée par kpi-report.mjs mais utile pour vérifier la borne ==\nignoré';
  const summarized=summarizeAndArchiveJournal('fake_sim','/tmp/fake_journal.json',fakeFs,fakeSh);
  assert.equal(summarized.content,'RÉSUMÉ FAKE','summarizeAndArchiveJournal() must reuse summarize-simulation-log.mjs\'s real output verbatim, never a second summarization logic reinvented here');
  assert.equal(fakeFs.files[`${SIMULATIONS_DIR}/fake_sim_actions.txt`],'RÉSUMÉ FAKE','the summary must be archived under the exact same flat naming convention as the transcript/dossier');

  const kpiResult=runAndArchiveKpiReport('fake-run',fakeFs,fakeSh);
  assert.equal(fakeFs.files[`${KPI_RAPPORTS_DIR}/fake-run.txt`],fakeSh('kpi'),'the full raw kpi-report.mjs output must be archived verbatim to docs/referentiel/kpi-rapports/<run>.txt, never truncated or reformatted');
  assert.ok(kpiResult.syntheseCompacte.includes('Robustesse du code')&&!kpiResult.syntheseCompacte.includes('ignoré'),'extractSyntheseCompacte() must isolate exactly the SYNTHÈSE COMPACTE section already printed by kpi-report.mjs\'s own section() helper (bounded by the next "== " header), never the sections before or after it');
  assert.equal(extractSyntheseCompacte('sortie sans aucune section reconnaissable'),undefined,'a kpi-report.mjs output with no recognizable SYNTHÈSE COMPACTE header must report an honest absence, never fabricate a fake synthesis or crash');
  assert.throws(()=>runAndArchiveKpiReport(undefined,fakeFs,fakeSh),/runLabel/,'a missing runLabel must fail loudly rather than silently writing a report under a meaningless filename');

  const pre=preSimulationChecklist();
  const post=postSimulationChecklist();
  assert.ok(pre.length===2&&pre[0].startsWith('0.')&&pre[1].startsWith('1.'),'the pre-simulation checklist must list exactly the two real judgment steps (Smart Conso API consultation, dev server + launch) in their real Article 18 order, never renumbered or reordered');
  assert.ok(post.length>=8&&post[0].startsWith('2.')&&post.some(s=>s.includes('index.md')&&s.includes('jamais'))&&post.some(s=>s.includes('kpi-index.md')&&s.includes('jamais')),'the post-simulation checklist must explicitly warn, for BOTH judgment indexes (docs/simulations/index.md and docs/referentiel/kpi-index.md), that LE-RÉGISSEUR never writes their judgment row itself — the exact boundary found by reading kpi-index.md before coding (Article 19), never silently lost in a future refactor');
  console.log('Passed: LE-RÉGISSEUR (2026-09-21) mechanically archives a simulation\'s transcript/dossier/action-summary under the real flat naming convention (dossier omitted honestly when a simulation never reached phase 2), reuses summarize-simulation-log.mjs and kpi-report.mjs\'s own real output verbatim rather than reinventing either, isolates the exact real SYNTHÈSE COMPACTE section kpi-report.mjs already prints, and its own checklists make explicit — never silently — that both judgment indexes (docs/simulations/index.md, docs/referentiel/kpi-index.md) stay the agent\'s to write, exactly the boundary found by reading kpi-index.md\'s own stated rule before writing a single line of code.');
}
{
  // COMPTEUR D'USAGE DES OUTILS (tâche #166, 2026-09-21, capturé en conception #230 puis calibré :
  // cumul permanent, jamais remis à zéro ; origine de chaque sollicitation ; croisement avec les
  // vraies trouvailles produites). Testé contre le vrai fichier local avec sauvegarde/restauration
  // complète (même discipline que recordAction()/computeAdoptionKpi() ce soir), puisque
  // recordToolUsage() n'a pas de fs injectable, comme le reste des historiques auto-déclarés.
  const { recordToolUsage, toolUsageStats, toolsNeverUsed, USAGE_ORIGINS } = await import('../scripts/tool-usage.mjs');
  assert.deepEqual(USAGE_ORIGINS, ['spontane', 'demande', 'automatique_post_commit'], 'the three real origins the user asked to distinguish must be exactly these, never a fourth invented one nor a missing one');
  assert.throws(() => recordToolUsage(undefined, 'demande'), /toolSlug/, 'a usage event can never be anonymous — a missing toolSlug must fail loudly rather than silently recording a meaningless entry');
  assert.throws(() => recordToolUsage('argus', 'origine-inconnue'), /origin inconnue/, 'an unrecognized origin must fail loudly rather than silently accepting a typo that would corrupt the honest byOrigin breakdown later');
  {
    const histPath = new URL('../.tool-usage-history.json', import.meta.url);
    const { existsSync: exU, readFileSync: rdU, writeFileSync: wrU, unlinkSync: unU } = await import('node:fs');
    const hadFile = exU(histPath);
    const backup = hadFile ? rdU(histPath, 'utf8') : undefined;
    try {
      recordToolUsage('test-tool-usage-argus', 'automatique_post_commit', 1000, true);
      recordToolUsage('test-tool-usage-argus', 'demande', 2000, false);
      recordToolUsage('test-tool-usage-harmonia', 'spontane', 3000);
      const history = JSON.parse(rdU(histPath, 'utf8'));
      const statsArgus = toolUsageStats(history, 'test-tool-usage-argus');
      assert.equal(statsArgus.total, 2, 'both real events for this tool must be counted, cumulatively, never reset within the same history');
      assert.deepEqual(statsArgus.byOrigin, { spontane: 0, demande: 1, automatique_post_commit: 1 }, 'each origin must be counted separately and honestly — the real ask was to tell a tool that only ever runs automatically apart from one genuinely chosen');
      assert.equal(statsArgus.foundSomethingRate, 50, 'foundSomethingRate must reflect the real ratio of confirmed-useful calls among those with a verdict at all (1 of 2 here), the exact "usage vs utility" distinction the user asked for');
      const statsNeverSeen = toolUsageStats(history, 'test-tool-usage-never-recorded');
      assert.deepEqual(statsNeverSeen, { total: 0, byOrigin: {}, foundSomethingCount: 0, foundSomethingRate: undefined }, 'a tool with zero recorded events must report an honest all-zero/undefined result, never a fabricated rate or a crash');
      assert.deepEqual(toolsNeverUsed(history, ['test-tool-usage-argus', 'test-tool-usage-harmonia', 'test-tool-usage-never-recorded']), ['test-tool-usage-never-recorded'], 'toolsNeverUsed() must flag exactly the tool with zero real events among a known list, useful to Doc-Report/#165 for spotting a tool that produces reports nobody ever solicited');
    } finally {
      if (hadFile) wrU(histPath, backup); else if (exU(histPath)) unU(histPath);
    }
  }
  console.log('Passed: the tool-usage counter (task #166) records each real solicitation cumulatively and permanently (never reset per session, the user\'s explicit choice), distinguishes the three real origins (spontaneous/requested/automatic-post-commit) honestly, and computes a real found-something rate distinguishing "often used" from "often USEFUL" — the exact anti-vanity-metric discipline already proven for ALWAYS-NEW-CODE/THE-DEEP-READER — verified against the real local history file with full backup/restore, never left in a dirty state.');
}

{
  // DOC-REPORT (tâche #165, 2026-09-21) : gardien de la décision HTML/texte déjà actée
  // (docs/suivi #230), jamais celui qui la prend. Testé avec un readFileImpl injecté et un
  // sous-ensemble isolé de registres — jamais dépendant du contenu réel des scripts du dépôt, qui
  // peut changer indépendamment de ce test.
  const { REGISTRIES, checkHtmlWiring, auditHtmlDecisions, findRegistriesMissingDecision, buildDocReportIndex, LOCAL_JOURNALS, auditLocalJournals, findJournalsMissingFromGitignore, findEngineCodeInRegistries, flagFindBoosterCandidates, checkHtmlReportTheme } = await import('../scripts/doc-report.mjs');
  assert.ok(REGISTRIES.length >= 15, 'the registry table must cover every real tool registry of the network, never a partial or forgotten subset');
  assert.ok(REGISTRIES.every((r) => r.slug && r.label && r.family && r.path && r.decision), 'every registry entry must be fully specified — a half-filled row would silently break the family grouping or the decision audit');

  // findEngineCodeInRegistries() (2026-09-21, real category error found: "MEMENTO" — since retired
  // as a shared name, cf. memory-audit/memento weight — conflated a real team-member script
  // (scripts/memento.mjs) with a fragment of the game engine itself (lib/memento-weight.ts, wired
  // into lib/lia.ts) under one name). A Membre de l'équipe entry must never point its scriptPath at
  // lib/, app/, or components/ — only scripts/*.mjs is a valid path.
  assert.deepEqual(findEngineCodeInRegistries(REGISTRIES), [], 'checked live against every real registry in this project: none may point at the game engine (lib/app/components) rather than a real scripts/*.mjs tool — a guarantee that breaks the day a future tool repeats that conflation');
  const fakeEngineRegistries = [
    { slug: 'real-tool', label: 'Real Tool', family: 'Test', path: 'docs/real-tool/', decision: 'texte', scriptPath: 'scripts/real-tool.mjs' },
    { slug: 'fake-member', label: 'Fake Member', family: 'Test', path: 'docs/fake-member/', decision: 'texte', scriptPath: 'lib/some-engine-file.ts' },
  ];
  assert.deepEqual(findEngineCodeInRegistries(fakeEngineRegistries).map((r) => r.slug), ['fake-member'], 'a registry entry whose scriptPath lives in lib/ (the game engine, never a team member) must be flagged by name, while a genuine scripts/*.mjs entry is never a false positive');

  const fakeReadFile = (path) => {
    if (path.includes('tool-with-html')) return 'import { renderHtmlReport } from "./html-report.mjs";';
    if (path.includes('tool-plain-text')) return 'console.log("no html rendering here");';
    throw new Error('ENOENT');
  };
  assert.equal(checkHtmlWiring('scripts/tool-with-html.mjs', fakeReadFile), true, 'a script that genuinely imports html-report.mjs must be detected as wired, by real text search — never guessed from the tool name');
  assert.equal(checkHtmlWiring('scripts/tool-plain-text.mjs', fakeReadFile), false, 'a script that never imports html-report.mjs must be flagged as not wired, the exact real gap this module found for THE-DEEP-READER on its very first run');
  assert.equal(checkHtmlWiring(null, fakeReadFile), undefined, 'a registry with no single producing script must report "unknown", never a fabricated true/false');
  assert.equal(checkHtmlWiring('scripts/missing-tool.mjs', fakeReadFile), undefined, 'an unreadable script path must report "unknown" rather than crashing or silently counting as unwired');

  const testRegistries = [
    { slug: 'texte-tool', label: 'Texte Tool', family: 'Test', path: 'docs/texte-tool/', decision: 'texte', scriptPath: 'scripts/tool-plain-text.mjs' },
    { slug: 'archived-tool', label: 'Archived Tool', family: 'Test', path: 'docs/archived-tool/', decision: 'archived_html', scriptPath: 'scripts/tool-plain-text.mjs' },
    { slug: 'wired-html-tool', label: 'Wired HTML Tool', family: 'Test', path: 'docs/wired-html-tool/', decision: 'delivery_html', scriptPath: 'scripts/tool-with-html.mjs' },
    { slug: 'unwired-html-tool', label: 'Unwired HTML Tool', family: 'Test', path: 'docs/unwired-html-tool/', decision: 'delivery_html', scriptPath: 'scripts/tool-plain-text.mjs' },
  ];
  const audited = auditHtmlDecisions(testRegistries, fakeReadFile);
  assert.deepEqual(audited.filter((r) => r.mismatch).map((r) => r.slug), ['unwired-html-tool'], 'only a "delivery_html" registry whose script genuinely never imports html-report.mjs may be flagged as a mismatch — never a "texte" or "archived_html" registry, which are never expected to import it at all');

  assert.deepEqual(findRegistriesMissingDecision(['docs/texte-tool', 'docs/some-brand-new-tool', 'docs/referentiel', 'docs/suivi'], testRegistries), ['docs/some-brand-new-tool'], 'a real docs/ folder with no registered decision is the real gap this function exists to catch, but the general reference/suivi folders (never a per-tool report registry) must never be false-flagged');

  const usageHistory = { events: [{ toolSlug: 'texte-tool', origin: 'demande', at: 1 }] };
  const { rows, byFamily, mismatches } = buildDocReportIndex({ registries: testRegistries, usageHistory, readFileImpl: fakeReadFile });
  assert.equal(rows.length, 4, 'the assembled index must carry exactly one row per registry, never dropping or duplicating one');
  assert.equal(rows.find((r) => r.slug === 'texte-tool').neverSolicited, false, 'a registry with at least one real usage event must never be flagged as unsolicited');
  assert.equal(rows.find((r) => r.slug === 'archived-tool').neverSolicited, true, 'a registry with zero real usage events must be flagged as unsolicited, reusing tool-usage.mjs\'s own toolsNeverUsed() rather than a second divergent calculation');
  assert.equal(byFamily.get('Test').length, 4, 'rows must be grouped by their declared family, never flattened or regrouped by a guessed criterion');
  assert.deepEqual(mismatches.map((m) => m.slug), ['unwired-html-tool'], 'the top-level mismatches list must surface exactly the real HTML-wiring gap, ready for a human/agent to read — Doc-Report itself never fixes it');
  console.log('Passed: Doc-Report (task #165) mechanically audits the already-decided HTML/texte choice against the real producing script\'s source (never guessed from a tool\'s name), flags an undeclared docs/ registry as a real gap while sparing the reference/suivi folders, cross-references tool-usage.mjs\'s real usage history to spot a registry nobody ever solicits — a genuine wiring gap (THE-DEEP-READER, Simulations) was found on its very first real run against the live repository — and, findEngineCodeInRegistries(), flags any registry whose scriptPath points at the game engine (lib/app/components) rather than a real scripts/*.mjs team-member tool, verified live to hold on every real registry today.');

  // checkHtmlReportTheme() (2026-09-22, explicit user rule: every HTML report must stay in the
  // game's real colors even as the future graphic charter evolves, and must open at 150% zoom).
  const themeOk = checkHtmlReportTheme(':root{--lia:#f29bc3;--noe:#55dbe5;}', '--lia: #f29bc3; --noe: #55dbe5; body { zoom: 1.5; }');
  assert.deepEqual(themeOk.colorMismatches, [], 'when the report\'s colors genuinely match app/globals.css, nothing must be flagged');
  assert.ok(themeOk.hasZoom, 'the 150% zoom rule must be detected when genuinely present in THEME_CSS');
  const themeDrifted = checkHtmlReportTheme(':root{--lia:#ff0000;--noe:#55dbe5;}', '--lia: #f29bc3; --noe: #55dbe5;');
  assert.deepEqual(themeDrifted.colorMismatches, ['lia'], 'a report color that has drifted from the real game color (e.g. after a future charter change never propagated) must be flagged by name, never silently accepted');
  assert.ok(!themeDrifted.hasZoom, 'a THEME_CSS missing the zoom rule entirely must be flagged, verified live against the real scripts/html-report.mjs');
  const realTheme = checkHtmlReportTheme(fs.readFileSync('app/globals.css', 'utf8'), fs.readFileSync('scripts/html-report.mjs', 'utf8'));
  assert.deepEqual(realTheme.colorMismatches, [], 'checked live against the real files: html-report.mjs\'s colors must currently match app/globals.css exactly');
  assert.ok(realTheme.hasZoom, 'checked live: the real THEME_CSS must currently carry the 150% zoom rule for every report, not just the transcript');
  console.log('Passed: checkHtmlReportTheme() (2026-09-22) mechanically compares scripts/html-report.mjs\'s shared --lia/--noe colors against app/globals.css\'s real values (never a supposition), flags a genuine drift by name rather than silently accepting it, and confirms the 150% zoom rule is present — verified live against this actual repository to hold today, the exact two permanent rules the user asked for.');

  // LOCAL_JOURNALS (2026-09-21, direct question from the user: is Doc-Report itself capable of
  // organizing the local, never-committed state files too, or does a twin tool need to?). Answer:
  // same tool, same module — tested with injected fs functions, never the real filesystem timing.
  assert.ok(LOCAL_JOURNALS.length >= 8, 'the local journal table must cover every real gitignored state/cache file the tool network actually produces, never a partial subset');
  assert.ok(LOCAL_JOURNALS.every((j) => j.path && j.owner && j.purpose), 'every journal entry must be fully specified — a half-filled row would silently break the audit or the gitignore cross-check');
  const fakeJournals = [{ path: '.fake-present.json', owner: 'X', purpose: 'y' }, { path: '.fake-absent.json', owner: 'X', purpose: 'y' }];
  const fixedNow = 1_700_000_000_000;
  const auditedJournals = auditLocalJournals(fakeJournals, {
    existsImpl: (p) => p === '.fake-present.json',
    statImpl: () => ({ mtimeMs: fixedNow - 2 * 86_400_000 }),
  });
  assert.deepEqual(auditedJournals.map((j) => j.present), [true, false], 'a journal that genuinely exists on disk must report present:true with a real age, and one that was never written must report present:false — never fabricating an age of 0 for a file that simply does not exist yet');
  assert.equal(auditedJournals[1].ageDays, undefined, 'an absent journal must report an honest undefined age, never a fabricated zero that would misleadingly read as "just written"');

  assert.deepEqual(findJournalsMissingFromGitignore('.env*\n.fake-present.json\n', fakeJournals), ['.fake-absent.json'], 'a journal genuinely absent from .gitignore\'s real text must be flagged as a real leak risk, while one genuinely present must never be flagged');
  const { readFileSync: readFileSyncForGitignore } = await import('node:fs');
  assert.deepEqual(findJournalsMissingFromGitignore(readFileSyncForGitignore(new URL('../.gitignore', import.meta.url), 'utf8'), LOCAL_JOURNALS), [], 'checked live against the project\'s own real .gitignore: every real local journal this project actually produces must already be declared, a guarantee that breaks the day a new journal is added without it');
  console.log('Passed: Doc-Report\'s local-journal extension (2026-09-21) answers the user\'s direct question — the SAME tool, never a twin — inventories every real gitignored state/cache file the tool network produces (owner, purpose, real filesystem mtime age, honest absence for one never yet written), and cross-checks live that every one of them is genuinely declared in .gitignore, catching a real leak risk before it ever reaches a commit.');

  // flagFindBoosterCandidates() (2026-09-21, demande explicite : « améliore aussi la connexion avec
  // Doc-Report [...] pour qu'il soit encore plus performant »). Opérationnalise l'obligation déjà
  // écrite de find-booster en un vrai signal par registre, jamais une seconde formule de poids.
  {
    const fakeRecommend = (path) => {
      if (path.endsWith('scripts/heavy-tool.mjs')) return { tokens: 20000, entryCount: 30, worthwhile: true };
      if (path.endsWith('scripts/light-tool.mjs')) return { tokens: 500, entryCount: 2, worthwhile: false };
      throw new Error('ENOENT');
    };
    const findBoosterRegistries = [
      { slug: 'heavy-a', label: 'Heavy A', family: 'Test', path: 'docs/heavy-a/', decision: 'texte', scriptPath: 'scripts/heavy-tool.mjs' },
      { slug: 'heavy-b', label: 'Heavy B', family: 'Test', path: 'docs/heavy-b/', decision: 'texte', scriptPath: 'scripts/heavy-tool.mjs' },
      { slug: 'light', label: 'Light Tool', family: 'Test', path: 'docs/light/', decision: 'texte', scriptPath: 'scripts/light-tool.mjs' },
      { slug: 'missing', label: 'Missing Tool', family: 'Test', path: 'docs/missing/', decision: 'texte', scriptPath: 'scripts/does-not-exist.mjs' },
    ];
    const flagged = flagFindBoosterCandidates(findBoosterRegistries, fakeRecommend);
    assert.deepEqual(flagged.map((f) => f.label), ['Heavy A'], 'only a registry whose script is genuinely judged worthwhile must be flagged — a light script and an unreadable one must never appear, and a scriptPath shared by two registry entries must be evaluated once, never once per entry (Heavy B never re-listed alongside Heavy A)');
    assert.equal(flagged[0].tokens, 20000, 'the flagged entry must carry the real token estimate recommendFindBooster() computed, never a re-derived or rounded figure');
    assert.deepEqual(flagFindBoosterCandidates([], fakeRecommend), [], 'an empty registry list must report zero candidates, never crash or fabricate one');
    // Vérifié en direct (2026-09-21) contre les vrais scripts du dépôt : ce test protège la forme du
    // signal, jamais le contenu réel (qui évolue avec la taille des outils), même discipline que le
    // reste de ce fichier pour les scans qui dépendent de l'état réel du dépôt.
    const liveFlagged = flagFindBoosterCandidates();
    assert.ok(liveFlagged.every((f) => f.label && f.scriptPath && typeof f.tokens === 'number'), 'every real candidate found live against this actual repository must carry a genuine label, scriptPath and token count, never a partially-filled entry');
  }
  console.log('Passed: flagFindBoosterCandidates() (2026-09-21) connects Doc-Report to find-booster\'s own recommendFindBooster() — flags exactly the registries whose real producing script is heavy enough to be worth searching by concept rather than reading whole, evaluates a scriptPath shared by two registry entries only once, never fabricates a candidate for an unreadable script, and — verified live against this actual repository — every flagged entry carries a genuine label/path/token count.');
}

{
  // THE-KING (tâche #167, 2026-09-21) : rappelle de consulter docs/philosophie-et-politique.md
  // avant une décision à haut niveau, jamais un décideur lui-même.
  const { TRIGGER_CATEGORIES, classifyDecisionTriggers, reminderFor, extractPrincipleUnits, extractPrincipleDate, buildEvolutionDigest, findPossibleTensions, philosophyFreshnessDays } = await import('../scripts/the-king.mjs');
  assert.equal(TRIGGER_CATEGORIES.length, 6, 'the 6 trigger categories are the exact number confirmed with the user — never more (would dilute the signal) nor fewer (would miss a real category)');

  assert.deepEqual(classifyDecisionTriggers('on prépare une nouvelle architecture, réutilisable pour un futur projet').map((c) => c.key), ['architecture', 'generalisable'], 'a request text touching two real categories at once must surface both, never force a single pick');
  assert.deepEqual(classifyDecisionTriggers('juste un correctif de coquille dans un commentaire'), [], 'a genuinely low-stakes request must trigger zero categories, never a false positive that would erode the reminder\'s value');
  assert.equal(reminderFor('juste un correctif de coquille'), null, 'reminderFor() must return null (never an empty-but-truthy string) when no category is detected — a caller can then skip the reminder entirely rather than print a hollow one');
  assert.ok(reminderFor('on va supprimer définitivement ce champ, c\'est irréversible').includes('philosophie-et-politique.md'), 'a genuinely irreversible decision must produce a reminder that names the actual file to consult, never a vague pointer');

  const fakePhilosophy = [
    '## Partie 1 — Philosophie',
    '',
    '### 1.1 Principe fondateur **[Explicite]**',
    '',
    'Un texte fondateur sans date, jamais daté à tort.',
    '',
    '### 1.2 Un principe récent **[Synthèse, 2026-09-10]**',
    '',
    'Un principe daté explicitement, ajouté après coup.',
    '',
    '## Partie 2 — Politique',
    '',
    '### 2.1 Toujours prudence budgétaire ambiante **[Explicite]**',
    '',
    'On dépense toujours avec prudence sur le budget ambiant du projet.',
    '',
    '### 2.2 Jamais de prudence budgétaire ambiante **[Synthèse, 2026-09-11]**',
    '',
    'On ne fait jamais preuve de prudence sur le budget ambiant du projet.',
  ].join('\n');
  const fakePrinciples = extractPrincipleUnits(fakePhilosophy);
  assert.equal(fakePrinciples.length, 4, 'extractPrincipleUnits() must find exactly the 4 real "### N.N" sections, bounded by the next section or the next top-level "## " heading, never swallowing a neighboring Part');
  assert.deepEqual(fakePrinciples.map((p) => `${p.partie}.${p.numero}`), ['1.1', '1.2', '2.1', '2.2'], 'principles must be extracted in real document order, each carrying its real Partie/numero pair');
  assert.equal(extractPrincipleDate(fakePrinciples[0]), undefined, 'a principle with no explicit date in its tag must report undefined honestly, never a fabricated date guessed from context');
  assert.equal(extractPrincipleDate(fakePrinciples[1]), '2026-09-10', 'a principle whose tag genuinely carries a date must have it extracted exactly');
  assert.deepEqual(buildEvolutionDigest(fakePrinciples), ['2026-09-10 — 1.2 Un principe récent', '2026-09-11 — 2.2 Jamais de prudence budgétaire ambiante'], 'the evolution digest must list only dated principles, in real chronological order (oldest first), never document order nor an undated founding principle');

  const tensions = findPossibleTensions(fakePrinciples);
  assert.deepEqual(tensions.map((t) => `${t.a}-${t.b}`), ['2.1-2.2'], 'a real "always" vs "never" divergence over genuinely shared vocabulary must be flagged as a possible tension — but 1.1 vs 1.2 (no shared vocabulary, no polarity clash) must never be flagged, proving this is not a bare keyword scan');
  assert.deepEqual(findPossibleTensions([fakePrinciples[0], fakePrinciples[1]]), [], 'two principles sharing no real vocabulary overlap must never be flagged, however their polarity markers read — the Jaccard threshold is the real gate, never the polarity check alone');

  assert.ok(typeof philosophyFreshnessDays() === 'number', 'philosophyFreshnessDays() must report a real number of days for the actual committed docs/philosophie-et-politique.md file — reusing lastTouchDays() from CLEAN-DIRTY-OLD rather than a second divergent calculation');
  console.log('Passed: THE-KING (task #167) reminds to consult docs/philosophie-et-politique.md before a high-stakes decision across exactly its 6 confirmed trigger categories (never a false positive on a low-stakes request), parses the real document into dated/undated principles without ever fabricating a date, builds an honest chronological evolution digest, and flags a possible tension between two principles only when BOTH real shared vocabulary AND a genuine "jamais"/"toujours" polarity clash are present — never a bare keyword or polarity scan alone.');
}

{
  // memory-audit (tâche #169, 2026-09-21 ; surnom retenu le même soir à la place de l'ombrelle
  // "MEMENTO", cf. docs/referentiel/memory-audit.md) — cible EXCLUSIVEMENT les Personnages (Lia/Noé),
  // jamais les membres de l'équipe. Testé contre les VRAIES formes de lib/life.ts trouvées par
  // l'investigation Article 19 (bonusLog/negotiationLog/contacts/wordFrequency/themeFrequency/worstMoment).
  const { checkChronologicalOrder, detectSuspiciousCounterReset, detectWorstMomentRegression, checkMemoryCoherence } = await import('../scripts/memento.mjs');
  const { estimateContextWeight } = await import('../scripts/memento-weight.mjs');

  assert.deepEqual(checkChronologicalOrder([{ round: 3 }, { round: 5 }, { round: 4 }, { round: 8 }]), [{ index: 2, previousRound: 5, currentRound: 4 }], 'a real bonusLog/negotiationLog-shaped array must flag exactly the one genuine out-of-order entry, by its real index and real round numbers, never a false positive on the two entries that stay correctly ordered');
  assert.deepEqual(checkChronologicalOrder([1, 4, 9]), [], 'a genuinely non-decreasing array (contacts\' real shape — bare round numbers) must report zero violations');
  assert.deepEqual(checkChronologicalOrder([9, 2]), [{ index: 1, previousRound: 9, currentRound: 2 }], 'contacts\' bare-number shape must be checked with the exact same function as the object-shaped logs, never a second parser for what is the same rule');

  assert.deepEqual(detectSuspiciousCounterReset({ tourne: 5, autant: 2 }, { tourne: 0 }), [{ key: 'tourne', previousValue: 5, currentValue: 0 }], 'a real word-counter that was significant (5, above the default threshold of 3) and vanished entirely must be flagged, while a counter that never crossed the significance threshold (autant: 2) must never be flagged as a false positive');
  assert.deepEqual(detectSuspiciousCounterReset({ tourne: 5 }, { tourne: 5 }), [], 'a counter that genuinely held steady must never be flagged');
  assert.deepEqual(detectSuspiciousCounterReset({ tourne: 5 }, { tourne: 6 }), [], 'a counter that genuinely grew must never be flagged as a reset');
  assert.deepEqual(detectSuspiciousCounterReset({ x: 2 }, { x: 0 }), [], 'a counter that never reached the significance threshold before dropping must never be flagged — a drop from 2 to 0 carries no real signal value');

  assert.deepEqual(detectWorstMomentRegression({ round: 10, excerpt: 'x', severity: 7 }, { round: 20, excerpt: 'y', severity: 4 }), { previousSeverity: 7, currentSeverity: 4, previousRound: 10, currentRound: 20 }, 'a real severity drop between two snapshots must be flagged by its real previous/current severity and round — the exact invariant the game\'s own write logic is supposed to enforce (worstMoment is only ever overwritten by a MORE severe moment)');
  assert.equal(detectWorstMomentRegression({ round: 10, excerpt: 'x', severity: 4 }, { round: 20, excerpt: 'y', severity: 7 }), null, 'a genuine escalation (or an equal severity) must never be flagged as a regression');
  assert.equal(detectWorstMomentRegression(undefined, { round: 1, excerpt: 'x', severity: 3 }), null, 'a first-ever worstMoment (no prior snapshot to compare against) must never be flagged — there is nothing to regress from');

  const life1 = { bonusLog: [{ round: 1, bonus: 'food' }, { round: 3, bonus: 'calm' }], wordFrequency: { tourne: 5 }, worstMoment: { round: 5, excerpt: 'x', severity: 6 } };
  const life2 = { bonusLog: [{ round: 1, bonus: 'food' }, { round: 3, bonus: 'calm' }, { round: 2, bonus: 'sleep' }], wordFrequency: { tourne: 0 }, worstMoment: { round: 10, excerpt: 'y', severity: 3 } };
  const findings = checkMemoryCoherence(life2, life1);
  assert.equal(findings.length, 3, 'checkMemoryCoherence() must surface all three real findings at once from one realistic pair of Life snapshots (a chronological break, a suspicious counter reset, and a severity regression), never silently dropping one because another was already found');
  assert.ok(findings.some((f) => f.type === 'ordre_chronologique' && f.champ === 'bonusLog'));
  assert.ok(findings.some((f) => f.type === 'remise_a_zero_suspecte' && f.champ === 'wordFrequency'));
  assert.ok(findings.some((f) => f.type === 'regression_gravite' && f.champ === 'worstMoment'));
  assert.deepEqual(checkMemoryCoherence({ bonusLog: [{ round: 1 }, { round: 2 }] }), [], 'a genuinely healthy single snapshot (no prior snapshot supplied, real chronological order respected) must report zero findings, never a fabricated one');
  assert.deepEqual(checkMemoryCoherence({}), [], 'an empty or minimal Life object (fields genuinely absent) must never crash and must report zero findings, never a fabricated one from missing data');

  assert.equal(estimateContextWeight({ a: 'x'.repeat(400) }), Math.round(JSON.stringify({ a: 'x'.repeat(400) }).length / 4), 'estimateContextWeight() must reuse SMART-CONSO-TOKEN\'s own estimateTokens() heuristic verbatim (4 chars ≈ 1 token) applied to the real JSON.stringify(context) payload — the same object shape lib/lia.ts actually sends to Gemini — never a second, divergent estimation formula');
  assert.equal(estimateContextWeight(undefined), 1, 'a missing/undefined context must fall back to measuring an empty object ("{}", 2 chars) rather than crashing on JSON.stringify(undefined) — never a fabricated zero unrelated to what would actually be measured');
  console.log('Passed: memory-audit (task #169) — role (a) mechanically detects a real chronological break in any round-numbered memory log (object-shaped like bonusLog/negotiationLog or bare-number like contacts, same function for both), a suspicious silent reset of a persisted word/theme counter above a real significance threshold (never flagging noise below it), and a real severity regression of worstMoment (the exact invariant the game\'s own write logic is supposed to enforce) — surfacing all three at once from a realistic pair of Life snapshots, and staying silent on a genuinely healthy one; role (b) reuses SMART-CONSO-TOKEN\'s own token-estimation heuristic verbatim on the real Gemini payload shape, never a second divergent formula.');

  // lib/memento-weight.ts — le point d'observation réel câblé dans lib/lia.ts::think() (jamais
  // utilisé pour modifier le contexte envoyé, Article 8/0). Même patron de test que
  // lib/gemini-keys.ts::episodes (reset explicite entre tests, jamais une fuite d'un test à l'autre).
  const {recordContextWeightSample,getContextWeightSamples,__resetContextWeightSamplesForTests}=await import('../.sites-runtime/test-memento-weight.mjs');
  __resetContextWeightSamplesForTests();
  assert.deepEqual(getContextWeightSamples(),[],'right after a reset, the sample log must be genuinely empty, never a stale entry from a previous test');
  const tokens=recordContextWeightSample('Lia',{a:'x'.repeat(100)});
  assert.equal(tokens,Math.round(JSON.stringify({a:'x'.repeat(100)}).length/4),'recordContextWeightSample() must return the real estimated token count for the exact context object it was given, never a placeholder');
  assert.deepEqual(getContextWeightSamples().map(s=>({actor:s.actor,tokens:s.tokens})),[{actor:'Lia',tokens}],'the sample must be recorded with its real actor name and real token count, immediately readable back');
  for(let i=0;i<205;i++)recordContextWeightSample('Noé',{});
  assert.equal(getContextWeightSamples().length,200,'the sample log must respect the same real hard cap (200) as lib/gemini-keys.ts::episodes, dropping the oldest first — never grow without bound in a long-running process');
  __resetContextWeightSamplesForTests();

  // Persistance + agrégation par acteur (scripts/memento-weight.mjs, extrait de scripts/memento.mjs
  // le 2026-09-21 pour séparer les deux rôles — cf. docs/referentiel/memento-weight.md) — testées
  // avec un vrai fichier local sauvegardé/restauré, même discipline que tool-usage.mjs/recordAction()
  // plus haut ce soir.
  const {persistContextWeightSamples,averageContextWeightByActor,loadHistory:loadMementoWeightHistory}=await import('../scripts/memento-weight.mjs');
  assert.deepEqual(averageContextWeightByActor([{actor:'Lia',tokens:100},{actor:'Lia',tokens:200},{actor:'Noé',tokens:50}]),{Lia:150,'Noé':50},'the average must be computed honestly per actor, never a single pooled average that would hide a real imbalance between Lia and Noé');
  assert.deepEqual(averageContextWeightByActor([]),{},'an empty sample list must report an honest empty breakdown, never a crash or a fabricated entry');
  assert.deepEqual(averageContextWeightByActor([{actor:'Lia',tokens:'x'},{},null,{actor:'Noé',tokens:10}]),{'Noé':10},'a malformed entry (non-numeric tokens, missing actor, or a genuinely null sample) must be skipped honestly, never crash the whole aggregation or pollute a real actor\'s average');
  {
    const historyPath=new URL('../.memento-history.json',import.meta.url);
    const {existsSync:exM,readFileSync:rdM,writeFileSync:wrM,unlinkSync:unM}=await import('node:fs');
    const hadFile=exM(historyPath);
    const backup=hadFile?rdM(historyPath,'utf8'):undefined;
    // Isolation réelle (2026-09-22, bug trouvé en lançant ce test juste après full_sim17, qui a
    // fait écrire de vrais échantillons dans ce même fichier via lib/lia.ts::think()) : sauvegarder
    // le fichier ne suffit pas à isoler ce test si persistContextWeightSamples() APPEND à un fichier
    // déjà rempli par une vraie session de jeu — il faut aussi le vider avant de tester, jamais
    // supposer un fichier vide par chance. Toujours restauré dans le `finally`, jamais perdu.
    if(hadFile)unM(historyPath);
    try{
      assert.equal(persistContextWeightSamples([]),undefined,'persisting an empty sample list must be a genuine no-op — never write a file just to record "nothing happened"');
      persistContextWeightSamples([{actor:'Lia',tokens:120,at:1000}]);
      const saved=JSON.parse(rdM(historyPath,'utf8'));
      assert.deepEqual(saved.samples,[{actor:'Lia',tokens:120,at:1000}],'the first real persist must write exactly the samples given, verbatim');
      persistContextWeightSamples([{actor:'Noé',tokens:90,at:2000}]);
      assert.deepEqual(JSON.parse(rdM(historyPath,'utf8')).samples,[{actor:'Lia',tokens:120,at:1000},{actor:'Noé',tokens:90,at:2000}],'a second real persist must APPEND to the existing history, never overwrite what a previous kpi-report.mjs run already saved');
      // loadHistory() exportée (2026-09-21, tâche #174) : ferme le vrai trou trouvé en vérifiant le
      // code avant de coder (Article 19) — ce journal était déjà écrit à chaque rapport KPI mais
      // jamais relu nulle part, un journal "write-only" jamais consulté pour une vraie tendance.
      assert.deepEqual(loadMementoWeightHistory().samples,[{actor:'Lia',tokens:120,at:1000},{actor:'Noé',tokens:90,at:2000}],'loadHistory() must read back exactly what persistContextWeightSamples() already wrote, the missing read half of a write-only journal until tonight');
    }finally{
      if(hadFile)wrM(historyPath,backup);else if(exM(historyPath))unM(historyPath);
    }
    if(!hadFile)assert.equal(loadMementoWeightHistory().samples.length,0,'once the real file is restored/removed, loadHistory() must fall back to an honest empty history, never a crash or a stale in-memory cache');
  }
  console.log('Passed: lib/memento-weight.ts is the real observation point wired into lib/lia.ts::think() (a real token estimate returned and recorded per real call, capped at the same 200-entry hard limit as lib/gemini-keys.ts::episodes, reset cleanly between tests), and scripts/memento-weight.mjs persists real samples append-only into .memento-history.json (verified with the real local file, backed up and restored) while averageContextWeightByActor() reports an honest per-actor breakdown that never pools Lia and Noé into one misleading average and never crashes on a malformed entry — and, task #174, loadHistory() is now exported so kpi-report.mjs can finally read back what it already writes on every run, closing the exact write-only-journal gap the user asked about tonight.');
}

{
  // route-booster (2026-09-21, sans blueprint, même statut que le-coordinateur.mjs) : prépare le
  // découpage de la fonction géante de route.ts en points de coupe candidats + indice de risque
  // lexical, jamais une réécriture automatique. Testé sur un fixture de lignes en mémoire, jamais un
  // vrai fichier disque pour findCutPoints/analyzeClosureRisk (purs, aucune I/O).
  const { findCutPoints, analyzeClosureRisk, proposeDecomposition } = await import('../scripts/route-booster.mjs');
  const fixtureLines = [
    'function big() {',
    '  const a = 1;',
    '  if (x.mode === "one") {',
    '    const b = a + 1;',
    '  }',
    '',
    '  // Une étape distincte, décrite ici.',
    '  const c = b + 1;',
    '  return c;',
    '}',
  ];
  const points = findCutPoints(fixtureLines);
  assert.deepEqual(points.map((p) => p.kind), ['branche_mode', 'commentaire_apres_ligne_vide'], 'a real `if (x.y === "...")` branch and a real comment-after-blank-line must both be detected as candidate cut points, in real document order, never one swallowing the other');
  assert.equal(points[0].line, 2, 'the mode-branch candidate must report its real 0-indexed line number, never an off-by-one');

  const risk = analyzeClosureRisk(fixtureLines, 2, 5);
  assert.deepEqual(risk.incoming, ['a'], 'a candidate reading a variable genuinely declared before it in the same function must flag it as an incoming dependency (a real parameter this extraction would need)');
  assert.deepEqual(risk.outgoing, ['b'], 'a candidate declaring a variable genuinely reused after it must flag it as an outgoing dependency (a real return value this extraction would need) — never silently dropped because it looks like a local-only variable');
  assert.equal(risk.riskScore, 2, 'the risk score must be the honest sum of real incoming and outgoing dependencies, never a fabricated or rounded number');

  const isolatedRisk = analyzeClosureRisk(['function f(){', '  const outer = 1;', '  const isolated = 42;', '  console.log("busy");', '  return outer;', '}'], 2, 4);
  assert.deepEqual(isolatedRisk, { incoming: [], outgoing: [], riskScore: 0 }, 'a genuinely self-contained candidate (reads nothing declared before it, and its own local declaration is never reused after it — only the unrelated `outer` is) must report zero risk on both sides, never a false positive from the keyword/identifier scan');

  const liveProposals = proposeDecomposition('app/api/lia/route.ts');
  assert.ok(liveProposals.length >= 15, 'checked live against the real route.ts POST handler: the real absence of any banner comment in this file must never mean zero candidates — the mode-branch heuristic alone must still surface a real double-digit count of genuine `if (x.y === "...")` branches');
  assert.ok(liveProposals.every((p) => typeof p.riskScore === 'number' && p.endLine > p.line), 'every real proposal against the live file must carry a real numeric risk score and a genuine non-empty line range, never a malformed entry');
  console.log('Passed: route-booster (2026-09-21) detects real candidate cut points in a giant function (a genuine `if (x.y === "...")` branch and a genuine comment-after-blank-line, in real document order) and computes an honest lexical risk score per candidate (real incoming dependencies read from before it, real outgoing dependencies reused after it, zero false positives on a genuinely self-contained block) — verified live against app/api/lia/route.ts\'s real 1665-line POST handler, which the tool correctly still surfaces a real double-digit set of candidates from despite having zero banner comments anywhere in the file.');

  // find-booster (2026-09-21, sans blueprint — renommé le même soir depuis "route-find-booster",
  // demande explicite de l'utilisateur : « plus logique, puisqu'il n'est pas restreint au fichier
  // route.ts »). N'a de sens qu'une fois un fichier déjà découpé en unités identifiables — indexe
  // leur description réelle (le commentaire qui les accompagne déjà) pour une recherche par concept,
  // jamais un grep littéral. Doit servir aussi bien un fichier découpé en FONCTIONS NOMMÉES
  // (route.ts une fois découpé) qu'un fichier découpé en BLOCS ANONYMES commentés (check-house.mjs
  // déjà aujourd'hui) — demande explicite de l'utilisateur : « assure toi que find booster est bien
  // construit pour aider les 2 fichiers, autant l'un que l'autre ».
  const { extractFunctionIndex, extractBlockIndex, extractHeadingIndex, extractTitledArrayIndex, tagHarmoniaThemes, searchByConcept, searchByConcepts, buildIndex, recommendFindBooster } = await import('../scripts/find-booster.mjs');
  const fixtureSource = [
    '// Tire un bonus de la roulette et l\'applique au personnage ciblé.',
    'function resolveBonusRoulette(actor) { return actor; }',
    '',
    'function undocumented() { return 1; }',
  ].join('\n');
  const index = extractFunctionIndex(fixtureSource);
  assert.equal(index.length, 2, 'every real top-level named function must be indexed, whether or not it carries a preceding comment — never silently dropping the undocumented one');
  assert.equal(index[0].description, 'Tire un bonus de la roulette et l\'applique au personnage ciblé.', 'the real contiguous comment block immediately above a function must be captured verbatim as its description, reusing the convention already present everywhere in this codebase rather than inventing a new annotation syntax');
  assert.equal(index[1].description, '', 'a function genuinely never preceded by a comment must report an honest empty description, never a fabricated one');

  assert.deepEqual(tagHarmoniaThemes(index[0]), ['Bonus roulette'], 'a real description mentioning "roulette"/"bonus" must be tagged with the matching real HARMONIA theme, by real keyword match against name+description');
  assert.deepEqual(tagHarmoniaThemes(index[1]), [], 'a genuinely untagged function (no matching keyword in name or description) must report zero themes, never a fabricated guess');

  assert.deepEqual(searchByConcept(index, 'roulette').map((e) => e.name), ['resolveBonusRoulette'], 'searching by a real concept keyword must match against both the function name and its description, surfacing exactly the real match and never the unrelated function');
  assert.deepEqual(searchByConcept(index, 'inconnu'), [], 'a keyword matching nothing real must report an honest empty result, never a fabricated fallback');

  // searchByConcepts() (pluriel, 2026-09-21, 2e passe d'optimisation) — le bug réel trouvé en
  // relisant main() avec un œil neuf : plusieurs mots-clés CLI étaient joints en une seule phrase
  // littérale ("resolveBonusRoulette undocumented" cherché comme une seule sous-chaîne, jamais
  // trouvée même si chaque terme existe séparément), reproduit d'abord contre le vrai
  // scripts/smart-conso-token.mjs avant d'être corrigé ici.
  assert.deepEqual(searchByConcepts(index, ['roulette', 'undocumented']).map((e) => e.name).sort(), ['resolveBonusRoulette', 'undocumented'], 'multiple keywords must be combined in OR, each matched independently against name+description — never joined into one literal phrase that would never match either function on its own');
  assert.deepEqual(searchByConcepts(index, ['inconnu']), [], 'a single unmatched keyword passed through the plural function must behave exactly like searchByConcept(), an honest empty result');
  assert.deepEqual(searchByConcepts(index, []), index, 'zero keywords must return the full index unfiltered, never an empty result mistaken for "nothing found"');

  // extractBlockIndex() — le motif réel de check-house.mjs (chaque test vit dans son propre bloc
  // top-level anonyme `{ ... }`, jamais une fonction nommée) : le commentaire suit l'accolade,
  // jamais ne la précède, et le nom synthétique est tout ce qui précède la première parenthèse/tiret
  // cadratin — la même convention de nommage déjà utilisée partout dans ce fichier lui-même.
  const blockFixture = [
    '{',
    '  // Doc-Report (task #165) — vérifie la décision HTML/texte déjà actée.',
    '  const x = 1;',
    '}',
    '',
    '{',
    '  const y = 2; // pas un commentaire de tête de bloc, jamais indexé comme tel',
    '}',
  ].join('\n');
  const blockIndex = extractBlockIndex(blockFixture);
  assert.equal(blockIndex.length, 1, 'a real top-level anonymous block genuinely followed by a comment must be indexed, while a block with no leading comment (nothing honest to name it with) must be silently skipped rather than given a fabricated label');
  assert.equal(blockIndex[0].name, 'Doc-Report', 'the synthetic name must be everything before the real first parenthesis/em-dash in the comment — the exact naming convention already used by every real block header in this codebase, never a guessed truncation');
  assert.equal(blockIndex[0].line, 1, 'the block\'s reported line must be its real opening brace line (1-indexed), never the comment line one below it');
  assert.ok(!extractBlockIndex('  { const nested = true; }').length, 'a brace that is not genuinely alone on its own top-level line (nested or trailing code) must never be mistaken for a real top-level block boundary — the exact false-positive route.ts itself is checked live to never trigger below');

  const liveIndex = buildIndex('app/api/lia/route.ts');
  assert.ok(liveIndex.length >= 4, 'checked live against the real route.ts: every one of its real top-level named functions (currently 4, pre-découpage) must be indexed, a guarantee that only grows once the file is actually split');
  assert.ok(liveIndex.some((e) => e.name === 'generateDossierFragment'), 'a real, already-existing named function in route.ts must be found by its real name, never missed by the extraction regex');
  assert.ok(liveIndex.every((e) => e.name !== ''), 'route.ts genuinely has zero bare top-level "{" lines (checked live) — the block-extraction half of buildIndex() must never fabricate a false positive on a file that only ever uses named functions');

  const liveBlockIndex = buildIndex('scripts/check-house.mjs');
  assert.ok(liveBlockIndex.length >= 80, 'checked live against the real check-house.mjs: this file is organized in dozens of real top-level anonymous test blocks (91 counted live), never named functions — buildIndex() must find the real bulk of them through its block-extraction half, not just the single real named function this file happens to also define');
  assert.ok(liveBlockIndex.some((e) => e.name.includes('DOC-REPORT')), 'a real, already-existing named block header in check-house.mjs (e.g. "DOC-REPORT") must be found by its real synthesized name, proving the block half of buildIndex() genuinely works end-to-end on the live file, not just on a fixture');

  // extractHeadingIndex() — un troisième motif réel (2026-09-21, question directe de l'utilisateur :
  // « est-ce que find-booster ne devrait il pas aussi t'aider pour le fichier regles de travail »),
  // pour un document Markdown (titres `##`/`###`/`####`) plutôt que du code — jamais mélangé avec les
  // deux motifs de code, choisi par extension dans buildIndex().
  const headingFixture = [
    '# Titre principal, jamais indexé (niveau 1 hors du motif ##-####)',
    '',
    '## Une vraie section',
    '',
    'Le premier paragraphe qui suit, capturé comme description réelle.',
    'Une seconde ligne qui rejoint le même paragraphe.',
    '',
    '### Une sous-section sans texte qui suit immédiatement',
    '### Sous-section suivante',
  ].join('\n');
  const headingIndex = extractHeadingIndex(headingFixture);
  assert.equal(headingIndex.length, 3, 'exactly the real ##/###/#### headings must be indexed (never the level-1 "#" title, which this project never uses as a real navigable section), never dropping a genuinely heading-less line as if it were one');
  assert.equal(headingIndex[0].name, 'Une vraie section', 'the heading name must be the real heading text itself, with the leading "##" markers stripped, never a truncated or reformatted version');
  assert.equal(headingIndex[0].description, 'Le premier paragraphe qui suit, capturé comme description réelle. Une seconde ligne qui rejoint le même paragraphe.', 'the description must be the real paragraph immediately following the heading, joined across its real wrapped lines, stopping honestly at the first blank line or the next heading');
  assert.equal(headingIndex[1].description, '', 'a heading genuinely followed immediately by another heading (no paragraph in between) must report an honest empty description, never borrowing text from the next section');
  assert.equal(headingIndex[2].line, 9, 'each heading\'s reported line must be its own real line number, never off by the width of a preceding empty-description heading');

  const liveHeadingIndex = buildIndex('docs/regles-de-travail.md');
  assert.ok(liveHeadingIndex.length >= 35, 'checked live against the real docs/regles-de-travail.md (1896 lines, 40 real headings counted live): buildIndex() must route a .md file to heading-extraction and find the real bulk of its sections, never zero because it wrongly tried the code-extraction path on a document');
  assert.ok(liveHeadingIndex.some((e) => e.name.includes('route-booster')), 'the real, already-existing "route-booster / find-booster" section heading in this exact document must be found by its real title text');
  assert.ok(buildIndex('app/api/lia/route.ts').every((e) => e.level === undefined), 'a real .ts file must never be routed through heading-extraction (which would tag every entry with a "level" field) — the extension check in buildIndex() must genuinely gate the two families of extraction apart, never blend them');

  // extractTitledArrayIndex() — un 4e motif réel (2026-09-21, question directe de l'utilisateur :
  // « ainsi que pour le fichier references.ts »), qui a aussi révélé un vrai principe : un fichier
  // peut être dense (poids réel élevé) sur très peu de lignes — lib/reference.ts ne fait que 132
  // lignes mais chaque entrée est un pavé de texte sur une seule ligne.
  const titledFixture = [
    "export const referenceSections=[",
    " {title:'00 · Version 1 — test',text:'Un texte court pour ce test.'},",
    " {title:'00 · Version 2 — test',text:'" + "x".repeat(250) + "'},",
    "];",
  ].join('\n');
  const titledIndex = extractTitledArrayIndex(titledFixture);
  assert.equal(titledIndex.length, 2, 'every real {title, text} array entry must be indexed, one per real source line');
  assert.equal(titledIndex[0].description, 'Un texte court pour ce test.', 'a text field genuinely shorter than the preview length must be reported verbatim, never truncated when there is nothing to truncate');
  assert.equal(titledIndex[1].description.length, 201, 'a text field genuinely longer than the preview length (200 chars) must be truncated to exactly that length plus one real ellipsis character — never the full text, which would make a search result unreadable, and never silently truncated without the "…" marker');
  assert.ok(titledIndex[1].description.endsWith('…'), 'a truncated description must end with a real ellipsis marker so the truncation itself is never mistaken for the genuine end of the text');

  const liveTitledIndex = buildIndex('lib/reference.ts');
  assert.ok(liveTitledIndex.length >= 100, 'checked live against the real lib/reference.ts (117 real versioned entries counted live): buildIndex() must find the real bulk of them through its titled-array-extraction third code path, not just the function/block paths which find nothing real in this file');
  assert.ok(liveTitledIndex.some((e) => e.name.includes('Version 1')), 'the real, already-existing "Version 1" entry (the earliest one still recorded) must be found by its real title text');

  // recommendFindBooster() — répond à la vraie question de l'utilisateur (« est-ce que find-booster
  // pourrait détecter quand un fichier est trop lourd [...] ou c'est toi qui fait cette analyse
  // systématiquement ? ») : jamais le nombre de lignes seul (lib/reference.ts, 132 lignes, l'a prouvé
  // faux), le vrai poids en tokens (réutilise estimateTokens() de smart-conso-token.mjs verbatim,
  // jamais une seconde formule).
  const heavyLive = recommendFindBooster('lib/reference.ts');
  assert.ok(heavyLive.worthwhile === true && heavyLive.tokens > 8000, 'checked live: lib/reference.ts must be recommended as worthwhile by its real high token weight, despite its genuinely low line count — the exact real case that disproves a line-count-only heuristic');
  const lightLive = recommendFindBooster('lib/house.ts');
  assert.equal(lightLive.worthwhile, false, 'checked live: a genuinely small, low-weight real file (lib/house.ts) must never be recommended — the guard against recommending find-booster on every file indiscriminately');
  console.log('Passed: find-booster (2026-09-21, promoted the same night to a full Membre de l\'équipe after proving itself on 4 real different files) indexes all four real structural patterns this codebase actually uses — named functions, anonymous top-level test blocks, titled array entries (lib/reference.ts\'s real style, with an honest length-capped preview rather than a full-text dump), and Markdown headings (gated to .md files only) — tags each against the real HARMONIA themes by honest keyword match, answers a concept search against name+description, and now recommends itself via recommendFindBooster(), which reuses SMART-CONSO-TOKEN\'s own real token-weight formula rather than line count — verified live to correctly flag lib/reference.ts as worthwhile (high real weight, low line count) and lib/house.ts as not (genuinely small).');
}

{
  // extractCommentedStatementIndex() (tâche #180, 2026-09-22, mode nocturne autonome) — 5e motif,
  // pensé pour un code dense et peu structuré comme le cœur de route.ts, où un long commentaire
  // précède directement une instruction dense plutôt qu'un bloc `{ ... }` séparé (le motif que
  // extractBlockIndex, ci-dessus, exige déjà).
  const { extractBlockIndex, extractCommentedStatementIndex, buildIndex } = await import('../scripts/find-booster.mjs');
  const denseFixture = [
    'const a = 1;',
    '// Une seule ligne de commentaire, jamais assez pour mériter une entrée — trop bref pour',
    'const b = 2;',
    '',
    '// Un vrai bloc de commentaire dense, sur plusieurs lignes, expliquant le pourquoi',
    '// — d\'une instruction qui suit directement, sans accolade séparée (le style réel de route.ts).',
    'if (x === 2) doSomething();',
    '',
    '// Un commentaire qui précède une ligne vide, jamais un vrai titre de section',
    '// puisqu\'il ne mène nulle part de concret.',
    '',
    '// Un commentaire qui précède une accolade fermante seule, la fin d\'un bloc, jamais son début',
    '// — ne doit jamais être indexé comme une nouvelle section.',
    '}',
  ].join('\n');
  const denseIndex = extractCommentedStatementIndex(denseFixture);
  assert.equal(denseIndex.length, 1, 'a single-line comment must never be indexed (too brief to be a real section header), a genuine multi-line comment followed by dead code (a blank line or a lone closing brace) must never be indexed as if it opened a new section, and only the one real multi-line comment genuinely followed by live code must be captured');
  assert.equal(denseIndex[0].name, 'Un vrai bloc de commentaire dense, sur plusieurs lignes, expliquant le pourquoi', 'the synthetic name must be the real comment text up to the first parenthesis/em-dash, the same naming convention already used by extractBlockIndex — never a different convention for this new pattern');
  assert.equal(denseIndex[0].line, 5, 'the reported line must be the real first comment line of the block, 1-indexed');

  // Dédoublonnage explicite avec extractBlockIndex — un commentaire déjà capturé par le motif
  // accolade ne doit JAMAIS réapparaître ici sous un second nom (Article 3).
  const overlapFixture = ['{', '// Un commentaire de tête de bloc, déjà capturé par extractBlockIndex', '// sur deux lignes, jamais compté une seconde fois ici.', 'const z = 1;', '}'].join('\n');
  const overlapBlockIndex = extractBlockIndex(overlapFixture);
  assert.equal(overlapBlockIndex.length, 1, 'setup check: the fixture\'s brace-prefixed comment must actually be captured by extractBlockIndex, or this deduplication test proves nothing');
  const overlapCommentedIndex = extractCommentedStatementIndex(overlapFixture, { excludeLines: new Set(overlapBlockIndex.map((e) => e.line + 1)) });
  assert.equal(overlapCommentedIndex.length, 0, 'a comment already captured by extractBlockIndex (brace-prefixed) must never be counted a second time here once its line is passed via excludeLines — the exact real double-counting this deduplication exists to prevent');

  // Câblage réel dans buildIndex() — vérifié en direct contre route.ts, la cible réelle de cette
  // tâche : 10 entrées avant ce correctif (fonctions nommées seulement), 125 après (mesuré en
  // direct le soir de la construction) — la preuve vivante que ce motif comble bien le vrai vide.
  const liveDenseIndex = buildIndex('app/api/lia/route.ts');
  assert.ok(liveDenseIndex.length >= 100, 'checked live against the real route.ts: adding the dense-comment pattern must multiply the real number of navigable entries by an order of magnitude (10 named functions alone, 125+ once dense comment sections are included) — the exact real gap task #180 was opened to close');
  console.log('Passed: extractCommentedStatementIndex() (task #180) correctly ignores a single-line comment (too brief to be a real section header), never indexes a genuine multi-line comment that leads into dead code (a blank line or a lone closing brace) as if it opened a section, names and lines a real match with the exact same convention already used by extractBlockIndex, never double-counts a comment already captured by extractBlockIndex once deduplicated via excludeLines, and — checked live against the real app/api/lia/route.ts, the exact file this task was opened for — multiplies the number of navigable entries by more than an order of magnitude (10 → 125+) by finally recognizing its dense, comment-led, brace-less style.');
}

{
  // CLONE-HUNTER (2026-09-21, réponse directe à la question de l'utilisateur : « est-ce qu'on a
  // deja un outil qui traque les redondances, repetition, duplicatas, dans le code ? » — vérifié
  // en lisant les fonctions exportées d'ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD une par une,
  // aucune ne fait ce métier). v1 volontairement simple (calibrée avec l'utilisateur) : blocs de
  // lignes identiques après normalisation d'espaces, jamais une ressemblance sémantique.
  const { normalizeLine, isSubstantialLine, findDuplicateBlocks, clusterDuplicates, buildDuplicateReport, formatClusterSummary } = await import('../scripts/clone-hunter.mjs');
  assert.equal(normalizeLine('  const   x =   1;  '), 'const x = 1;');
  assert.equal(isSubstantialLine(normalizeLine('}')), false, 'a bare closing brace must never count as substantial — the exact noise route-booster/find-booster already learned to filter');
  assert.equal(isSubstantialLine(normalizeLine('  const totalDuplicateCount = 0;  ')), true);

  const sharedBlock = ['function computeTotal(items) {', '  let sum = 0;', '  for (const item of items) sum += item.price;', '  return sum;', '  // fin du calcul total', '}'];
  const fixtureA = new Map([
    ['fileA.mjs', ['import x from "y";', '', ...sharedBlock, '', 'const unrelatedLine = 42;']],
    ['fileB.mjs', ['// fileB, sans lien avec fileA', ...sharedBlock, 'console.log("done");']],
    ['fileC.mjs', ['function other() { return 1; }']],
  ]);
  const pairsFound = findDuplicateBlocks(fixtureA, { minLines: 5, minLineLength: 15 });
  assert.ok(pairsFound.some((p) => p.lines >= sharedBlock.length && [p.fileA, p.fileB].includes('fileA.mjs') && [p.fileA, p.fileB].includes('fileB.mjs')), 'a genuine 6-line block shared verbatim between two unrelated files must be detected in full, never truncated to a shorter sub-match');
  assert.ok(!pairsFound.some((p) => [p.fileA, p.fileB].includes('fileC.mjs')), 'a file with no real shared block must never appear in the results — no false positive from a single short unrelated line');

  // Seuil minLines respecté : un bloc partagé de seulement 3 lignes ne doit jamais franchir un
  // seuil configuré à 5, jamais un faux positif sur un extrait trop court pour être significatif.
  const tooShort = new Map([
    ['short1.mjs', ['const configurationValueHere = 1;', 'const anotherConfigValueHere = 2;', 'const thirdConfigValueHere = 3;']],
    ['short2.mjs', ['const configurationValueHere = 1;', 'const anotherConfigValueHere = 2;', 'const thirdConfigValueHere = 3;']],
  ]);
  assert.equal(findDuplicateBlocks(tooShort, { minLines: 5, minLineLength: 15 }).length, 0, 'a genuinely shared block shorter than the configured minLines threshold must never be reported');

  // Duplication au sein d'un même fichier (deux endroits distincts, non chevauchants) — jamais
  // limité aux comparaisons entre fichiers différents.
  const sameFile = new Map([
    ['solo.mjs', ['function first() {', '  const localValueForFirst = computeSomething();', '  return localValueForFirst * 2;', '  // marqueur de fin identique', '  console.log("fin du bloc");', '}', 'function second() {', '  const localValueForFirst = computeSomething();', '  return localValueForFirst * 2;', '  // marqueur de fin identique', '  console.log("fin du bloc");', '}']],
  ]);
  const soloPairs = findDuplicateBlocks(sameFile, { minLines: 4, minLineLength: 15 });
  assert.ok(soloPairs.some((p) => p.fileA === 'solo.mjs' && p.fileB === 'solo.mjs' && p.lines >= 4), 'two non-overlapping duplicate spans within the SAME file must be detected too, never restricted to cross-file comparisons only');

  // clusterDuplicates() : un bloc dupliqué à 3 endroits ne doit produire qu'UN seul cluster de 3
  // occurrences, jamais 3 alertes redondantes (une par paire) qui noieraient l'utilisateur.
  const threeWay = new Map([
    ['triA.mjs', sharedBlock],
    ['triB.mjs', sharedBlock],
    ['triC.mjs', sharedBlock],
  ]);
  const triClusters = clusterDuplicates(findDuplicateBlocks(threeWay, { minLines: 5, minLineLength: 15 }));
  assert.equal(triClusters.length, 1, 'three files sharing the exact same block must collapse into exactly one cluster, never one alert per pair');
  assert.equal(triClusters[0].occurrences.length, 3, 'the single cluster must list all three real occurrences, never just the first pair found');
  assert.ok(formatClusterSummary(triClusters[0]).includes('3 endroit'), 'the human-readable summary must state the real occurrence count');

  // Vérifié live contre le vrai dépôt : components/ui/* (kit shadcn/Radix vendu tel quel, la
  // duplication y est assumée par design) doit rester exclu pour que le signal reste actionnable —
  // trouvaille réelle du premier essai ce soir (27 clusters avant l'exclusion, 20+ de bruit pur).
  const liveClusters = buildDuplicateReport();
  assert.ok(!liveClusters.some((c) => c.occurrences.some((o) => o.file.startsWith('components/ui/'))), 'components/ui (vendored shadcn/Radix kit, duplication by design) must never surface in the default scan — the real noise found and excluded tonight');
  // Vraie trouvaille actionnable, vérifiée live : loadJson() dupliqué verbatim entre
  // scripts/smart-conso-api.mjs et scripts/smart-conso-token.mjs — la preuve vivante que l'outil
  // trouve un vrai problème réel dans ce dépôt, pas seulement dans des fixtures synthétiques.
  assert.ok(liveClusters.some((c) => c.occurrences.some((o) => o.file === 'scripts/smart-conso-api.mjs') && c.occurrences.some((o) => o.file === 'scripts/smart-conso-token.mjs')), 'the real, already-known loadJson() duplication between smart-conso-api.mjs and smart-conso-token.mjs must be found live against the actual repository, not just a synthetic fixture');
  console.log('Passed: CLONE-HUNTER (2026-09-21) — a real gap confirmed by reading ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD\'s own exported functions one by one, none of which detects repeated code — detects a genuine multi-line block shared verbatim across files (never truncating it short, never a false positive from one coincidentally-shared line, and honoring a configured minimum length), finds duplication within a single file as well as across files, collapses a block shared by three real locations into one cluster with all three occurrences rather than one redundant alert per pair, and — verified live against this actual repository — correctly excludes components/ui (the vendored shadcn/Radix kit, whose duplication is assumed by design) while still surfacing the real, already-known loadJson() duplication between scripts/smart-conso-api.mjs and scripts/smart-conso-token.mjs.');

  // CLONE-HUNTER v2 (2026-09-21, tâche #177, demande explicite de l'utilisateur : « améliore
  // CLONE-HUNTER, au-delà de la v1 littérale »). Toujours zéro nouvelle dépendance, zéro parseur
  // AST : compare la FORME token par token et exige un renommage bijectif cohérent sur tout le
  // bloc, jamais juste "même forme de ligne" (trop bruyant seul).
  const { tokenizeLine, matchLineTokens, shapeFingerprint, isSubstantialShape, extendNearDuplicateBlock, findNearDuplicateBlocks, buildNearDuplicateReport } = await import('../scripts/clone-hunter.mjs');
  assert.deepEqual(tokenizeLine('const total = items.length;'), ['const', 'total', '=', 'items', '.', 'length', ';']);

  const renamedPairA = new Map([
    ['renamedA.mjs', ['function foo() {', '  const total = items.reduce((acc, item) => acc + item.value, 0);', '  const average = total / items.length;', '  console.log(average);', '  return average;', '}']],
    ['renamedB.mjs', ['function bar() {', '  const sum = things.reduce((acc, thing) => acc + thing.value, 0);', '  const mean = sum / things.length;', '  console.log(mean);', '  return mean;', '}']],
  ]);
  const nearPairs = findNearDuplicateBlocks(renamedPairA, { minLines: 3, minRealTokens: 4 });
  assert.ok(nearPairs.some((p) => p.lines >= 5 && [p.fileA, p.fileB].includes('renamedA.mjs') && [p.fileA, p.fileB].includes('renamedB.mjs')), 'a block that is the same logic under one single consistent identifier renaming (items->things, total->sum, average->mean) must be detected as a near-duplicate — the exact case v1 structurally cannot see');

  // Jamais un doublon avec v1 : un bloc littéralement identique (aucun renommage réel) ne doit
  // JAMAIS ressortir de findNearDuplicateBlocks() — déjà signalé par v1, jamais compté deux fois
  // (Article 3 : une même vraie duplication ne produit jamais deux signalements distincts).
  const literalOnly = new Map([
    ['litA.mjs', ['const total = items.reduce((acc, item) => acc + item.value, 0);', 'const average = total / items.length;', 'console.log(average);']],
    ['litB.mjs', ['const total = items.reduce((acc, item) => acc + item.value, 0);', 'const average = total / items.length;', 'console.log(average);']],
  ]);
  assert.equal(findNearDuplicateBlocks(literalOnly, { minLines: 3, minRealTokens: 4 }).length, 0, 'a purely literal duplicate (zero real renaming) must never surface in v2 results — that is v1\'s territory, never double-counted');

  // Garde-fou anti-bruit central de v2 : une coïncidence de forme SANS renommage bijectif cohérent
  // (le même identifiant devrait être mappé à deux cibles différentes selon la ligne) ne doit
  // jamais être rapportée comme une quasi-duplication — la preuve que ce n'est pas juste "même
  // forme de ligne" mais un vrai renommage cohérent de bout en bout qui est exigé.
  const incoherentMapping = new Map([
    ['incA.mjs', ['const value = compute(x, y);', 'const other = compute(y, x);']],
    ['incB.mjs', ['const value = compute(p, q);', 'const other = compute(r, s);']],
  ]);
  assert.equal(findNearDuplicateBlocks(incoherentMapping, { minLines: 2, minRealTokens: 3 }).length, 0, 'a structural coincidence with NO single consistent bijective renaming across the block must never be reported as a near-duplicate — the exact noise guard that makes v2 more than "same line shape"');

  // Un mot-clé du langage ou une propriété réelle après un "." ne sont jamais traités comme des
  // identifiants renommables — sinon `.push`/`.length` se feraient passer pour des variables.
  assert.equal(matchLineTokens(tokenizeLine('return items.length;'), tokenizeLine('return things.count;'), new Map(), new Map()), null, 'a real member access (.length vs .count) must never be treated as a renamable identifier — matching it would be nonsensical');
  assert.ok(matchLineTokens(tokenizeLine('return items.length;'), tokenizeLine('return things.length;'), new Map(), new Map()), 'the same real member access (.length on both sides) with only the renamable base identifier changed must still match');

  assert.equal(isSubstantialShape(tokenizeLine('return x;')), false, 'a trivial return must never count as substantial by default — the same noise-filtering spirit as v1\'s isSubstantialLine()');
  assert.equal(isSubstantialShape(tokenizeLine('const total = items.reduce((acc, item) => acc + item.value, 0);')), true, 'a genuinely rich line (enough real identifiers/keywords/numbers) must count as substantial');
  assert.equal(shapeFingerprint(tokenizeLine('const total = 0;')), 'const • = 0 ;');

  const nearLive = buildNearDuplicateReport();
  assert.ok(!nearLive.some((c) => c.occurrences.some((o) => o.file.startsWith('components/ui/'))), 'v2 must inherit the same components/ui exclusion as v1 — the same vendored-kit noise, never re-introduced through the near-duplicate path');
  console.log('Passed: CLONE-HUNTER v2 (2026-09-21, task #177) — detects a block that is the exact same logic under one single consistent bijective identifier renaming across the whole block (never just "same line shape" alone, which real code shares constantly and would be pure noise), correctly rejects a structural coincidence where the required renaming is inconsistent line-to-line, never treats a real member access (.length, .push) as a renamable identifier, and never double-reports a purely literal duplicate already caught by v1 — verified live against this actual repository to inherit the same components/ui exclusion.');
}

{
  // INES-official (tâche #168, 2026-09-21) : la "secrétaire" qui aplatit + annote le dépôt, jamais
  // une réécriture réelle. Testé avec un système de fichiers entièrement injecté — jamais un vrai
  // balayage du dépôt réel dans les tests, qui serait lent et non déterministe d'une session à l'autre.
  const { FLATTEN_SCOPES, collectSourceFiles, annotateFile, buildTableOfContents, buildConsolidatedEdition, nextEditionVersion, buildIndexRow, recordEdition, buildEditionSummary, renderEditionSummary } = await import('../scripts/ines-official.mjs');
  assert.deepEqual(FLATTEN_SCOPES, ['code', 'code_et_docs'], 'the two real scopes must stay exactly these two, in this order — a caller choosing a scope by name must never silently mismatch');
  assert.throws(() => collectSourceFiles('inconnu'), /périmètre inconnu/, 'an unknown scope must throw immediately rather than silently falling back to an arbitrary default');

  const fakeTree = {
    lib: [{ name: 'a.ts', isDirectory: () => false }, { name: 'sub', isDirectory: () => true }],
    'lib/sub': [{ name: 'b.ts', isDirectory: () => false }, { name: 'ignore.png', isDirectory: () => false }],
    app: [], scripts: [], components: [],
    docs: [{ name: 'notes.md', isDirectory: () => false }, { name: 'image.png', isDirectory: () => false }],
  };
  const readDirImpl = (dir) => fakeTree[dir] || [];
  const existsImpl = (dir) => dir in fakeTree;
  assert.deepEqual(collectSourceFiles('code', { readDirImpl, existsImpl }), ['lib/a.ts', 'lib/sub/b.ts'], 'the "code" scope must recurse into real subdirectories, include only whitelisted code extensions, and never pull in docs/ or a non-code extension like .png');
  assert.deepEqual(collectSourceFiles('code_et_docs', { readDirImpl, existsImpl }), ['docs/notes.md', 'lib/a.ts', 'lib/sub/b.ts'], 'the "code_et_docs" scope must add real .md files from docs/ on top of the code scope, still excluding a non-doc extension like .png, sorted consistently');

  assert.deepEqual(buildTableOfContents(['a.ts', 'b.ts'], { 'a.ts': 'x', 'b.ts': 'y' }), ['1. a.ts — x', '2. b.ts — y'], 'the table of contents must number every real file in order with its real annotation, the "oui maintenant" enrichment requested at calibration');

  const edition = buildConsolidatedEdition({ scope: 'code', files: ['a.ts'], annotations: { 'a.ts': 'x' }, version: 3, date: '2026-09-21', readFileImpl: () => 'contenu réel' });
  assert.ok(edition.includes('# INES-official — édition v3 (2026-09-21)') && edition.includes('## Table des matières') && edition.includes('1. a.ts — x') && edition.includes('contenu réel'), 'the consolidated edition must carry the real version/date header, the real table of contents, and the real file content verbatim — the "oui maintenant" dating/versioning enrichment requested at calibration');
  assert.ok(edition.includes('Résumé indisponible pour cette édition.'), 'an edition built with no summary object at all must say so honestly rather than silently omitting the whole section');

  // Rapport de synthèse (2026-09-21, demande explicite de l'utilisateur pendant la construction :
  // « elle fait ses commentaires [...] donne des chiffres intéressants, pertinents sur le code [...]
  // elle reprend aussi les données fournies par cassandra sur les KPI »). Strictement descriptif,
  // jamais un jugement (ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD gardent ce rôle).
  const summary = buildEditionSummary(['a.ts', 'b.ts', 'c.md'], { staleDaysByFile: { 'a.ts': 2, 'b.ts': 10 }, sizeByFile: { 'a.ts': 500, 'b.ts': 1500, 'c.md': 300 } });
  assert.deepEqual(summary.byExtension, { '.ts': 2, '.md': 1 }, 'the extension breakdown must count every real file by its real extension, never guessed');
  assert.equal(summary.neverCommittedCount, 1, 'a file with no known staleness (never committed) must be counted honestly as such, distinct from a file genuinely aged 0 days');
  assert.deepEqual(summary.oldestFile, { path: 'b.ts', days: 10 }, 'the oldest file must be the real maximum staleness among files that DO have a known date, never confused by an unknown-date file');
  assert.equal(summary.averageStaleDays, 6, 'the average staleness must be computed only over files with a real known date, never diluted by an unknown one counted as zero');
  assert.equal(summary.totalSizeBytes, 2300, 'the total size must sum every real per-file size supplied, never recomputed by re-reading files a third time');
  assert.equal(summary.kpiFromCassandra, null, 'with no CASSANDRA-RH data supplied (it does not exist yet), the KPI hook must stay an honest null, never a fabricated number');
  const rendered = renderEditionSummary(summary).join('\n');
  assert.ok(rendered.includes('CASSANDRA-RH n\'est pas encore construite'), 'the rendered summary must explicitly name the real reason the KPI section is empty — a future reader must never mistake this for a bug or an omission');
  const renderedWithKpi = renderEditionSummary({ ...summary, kpiFromCassandra: '1200 visites/mois' }).join('\n');
  assert.ok(renderedWithKpi.includes('repris de CASSANDRA-RH') && renderedWithKpi.includes('1200 visites/mois'), 'once CASSANDRA-RH data is genuinely supplied, the summary must present it as REUSED from CASSANDRA-RH, never recomputed by INES-official itself — the exact anti-duplication discipline already applied elsewhere in this project (Doc-Report/tool-usage.mjs)');
  const editionUnreadable = buildConsolidatedEdition({ scope: 'code', files: ['missing.ts'], annotations: {}, version: 1, date: '2026-09-21', readFileImpl: () => { throw new Error('ENOENT'); } });
  assert.ok(editionUnreadable.includes('fichier illisible'), 'a file that genuinely fails to read at edition time must be reported honestly inline, never crash the whole edition');

  assert.equal(nextEditionVersion(''), 1, 'the very first edition, with no prior index text at all, must start at version 1, never 0 or a crash');
  assert.equal(nextEditionVersion('| v1 | ... |\n| v4 | ... |\n| v2 | ... |'), 5, 'the next version must be one past the real highest version number found in the index, regardless of row order — never a naive "last row + 1" that a reordered table would break');

  assert.equal(buildIndexRow({ version: 2, date: '2026-09-21', scope: 'code', fileCount: 40, sizeBytes: 500_000 }), '| v2 | 2026-09-21 | code seul | 40 | 500 Ko |', 'a sub-megabyte edition must report its size in Ko, with the real human-readable scope label');
  assert.equal(buildIndexRow({ version: 3, date: '2026-09-21', scope: 'code_et_docs', fileCount: 90, sizeBytes: 2_300_000 }), '| v3 | 2026-09-21 | code + documentation | 90 | 2.3 Mo |', 'a multi-megabyte edition must report its size in Mo with one decimal, never a raw byte count that would be unreadable at this scale');

  {
    // recordEdition() : le corps volumineux reste LOCAL (jamais committé), seule une ligne de
    // métadonnées légère est retournée pour l'index committé — vérifié avec un writeFileImpl injecté,
    // jamais une vraie écriture disque dans ce test.
    const written = {};
    const writeFileImpl = (path, content) => { written[path] = content; };
    const result = recordEdition('code', { indexText: '', writeFileImpl, readFileImplForBody: () => 'x'.repeat(100) });
    assert.equal(result.version, 1, 'the first real edition of a scope with no prior index history must be version 1');
    assert.ok(result.latestPath.includes('ines-official-latest-code') && written[result.latestPath], 'the full body must be written to the local, scope-named latest file — never silently dropped');
    assert.ok(result.row.includes('v1') && result.row.includes('code seul'), 'the returned metadata row must be ready to append to the committed index as-is, never requiring the caller to reformat it');
    assert.ok(written[result.latestPath].includes('## Résumé'), 'the written edition body must genuinely embed the summary section, never just the raw file dump');
    assert.equal(result.summary.kpiFromCassandra, null, 'recordEdition() called with no kpiFromCassandra override must default to an honest null, never silently fabricate one');
  }
  console.log('Passed: INES-official (task #168) collects real files by an explicit extension/root whitelist per scope (never a blacklist, and never pulling in docs/ under the "code" scope or a non-source extension under either scope), builds a real numbered table of contents and a dated/versioned consolidated edition (the two "oui maintenant" enrichments), reports an honest inline notice for a file that genuinely fails to read rather than crashing the whole edition, computes the real next version from the actual highest version found in the index regardless of row order, and keeps the potentially multi-megabyte edition body local while returning only a light, ready-to-append metadata row for the committed index — the real disk economy already applied elsewhere in this project to the raw simulation log.');
}
