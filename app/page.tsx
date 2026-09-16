"use client";
import {investigationCounts} from "@/lib/evidence";
import {waitForPlayback} from "@/lib/playback";
import {presentationVersion} from "@/lib/presentation-version";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Home, MessageCircle, Moon, Sun, Pause, Play, Users, RefreshCw, ArrowUpRight } from "lucide-react";
import { AdminReference } from "@/components/admin-reference";
import {ProgressiveText} from "@/components/progressive-text";
import {departurePresentation,roomTag,uniqueObservations} from "@/lib/presentation";
import { HouseView } from "@/components/house-view";
import { names, rooms, type Person, type Room } from "@/lib/house";
import { emotionKeys } from "@/lib/lia";
import { initialNeedsFor, initialEmotionsFor, smiley, needLevel, roomDescriptions, tvPrograms, type Intent } from "@/lib/simulation";
import { ages, isInLove } from "@/lib/relationship";
import type { Resident } from "@/lib/world";
type Message={room?:string|null;id:number;speaker:string;content:string;created_at:number};
type Memory={id:number;agent_id:number;kind:string;content:string;created_at:number;room?:string|null};
import type {VisualEvent} from "../lib/visual-events";
type World={presentationVersion?:number;visualEvents?:VisualEvent[];departures?:{actor:Person;from:string;to:string;content:string}[];epoch:number;agents:Resident[];messages:Message[];memories:Memory[];story?:{observer?:string;life?:{gardenOpen?:boolean;gardenVisited?:boolean;tvOn?:boolean;tvSeen:boolean;ambientSeen?:boolean;ambientVerified?:boolean;mirrorVerified?:boolean;foodVerified?:boolean;exitPhase?:number;exitActive?:boolean};session:string;evidence:string[];revealed:boolean;humanUnlocked?:boolean;dreams?:{actor:Person;round:number;content:string}[];observations?:string[]}|null};
type Command={requestId:string;actor:Person;mode:"chat"|"autonomous"|"interact"|"move"|"care"|"reset"|"identify"|"unlock_garden";epoch?:number;intent?:Intent;message?:string;room?:Room;night:boolean};
const initial:Resident[]=[{id:1,name:"Lia",room:"salon",mood:"curieuse",activity:"Pourquoi mes souvenirs sont-ils flous ?",goal:"Découvrir les pièces",cycle:0,last_seen:0,emotions:initialEmotionsFor(1),needs:initialNeedsFor(1),intent:"none"},{id:2,name:"Noé",room:"bureau",mood:"curieux",activity:"Où suis-je ?",goal:"Faire connaissance avec Lia",cycle:0,last_seen:0,emotions:initialEmotionsFor(2),needs:initialNeedsFor(2),intent:"none"}];
const emotionLabels={curiosity:"Curiosité",tension:"Tension",trust:"Confiance",comfort:"Aisance",attraction:"Attirance"};
export default function HomePage(){
  const [nickname,setNickname]=useState(""),[nicknameDone,setNicknameDone]=useState(false);
  const [roomInfo,setRoomInfo]=useState<Room|null>(null);
  const [resumePrompt,setResumePrompt]=useState(false),[humanSpeaking,setHumanSpeaking]=useState(false);
  const firstLoad=useRef(true),resumeGate=useRef(false);
  const [simulationTurn,setSimulationTurn]=useState(false),[updateAvailable,setUpdateAvailable]=useState(false);
  const [visualEvents,setVisualEvents]=useState<VisualEvent[]>([]),[visualStage,setVisualStage]=useState(false);
  const [typingId,setTypingId]=useState<number|null>(null),[typingPaused,setTypingPaused]=useState(false);
  const typingDone=useRef<(()=>void)|null>(null);const finishTyping=useCallback(()=>{typingDone.current?.();typingDone.current=null},[]);
  const [speaking,setSpeaking]=useState<Person[]>([]);
  const [previousAgents,setPreviousAgents]=useState<Resident[]>(initial);
  const trend=(agent:Resident,key:string,value:number)=>{const p=previousAgents.find(a=>a.id===agent.id);const old=key==="attachment"?p?.attachment??0:key in (p?.needs??{})?(p!.needs as unknown as Record<string,number>)[key]:(p?.emotions as unknown as Record<string,number>)?.[key];const d=value-(old??value);const inverted=["hunger","fatigue","stress","uncertainty","tension"].includes(key);const good=d!==0&&(inverted?d<0:d>0);return <small className={`gauge-trend ${d===0?"stable":good?"positive":"negative"}`} title="Variation en points de pourcentage depuis la dernière mise à jour reçue"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d={d>0?"M8 14V2M3 7l5-5 5 5":d<0?"M8 2v12M3 9l5 5 5-5":"M2 6h12M2 10h12"} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>{Math.abs(d)} %</small>};
  const [notice,setNotice]=useState("");
  const messageBox=useRef<HTMLTextAreaElement>(null);
  const [older,setOlder]=useState<Message[]>([]),[historyBusy,setHistoryBusy]=useState(false);
  const arrival=useRef<(()=>void)|null>(null),worldRef=useRef<World>({epoch:0,agents:initial,messages:[],memories:[]});
  const onSettled=useCallback(()=>{arrival.current?.();arrival.current=null},[]);

  const [world,setWorld]=useState<World>({epoch:0,agents:initial,messages:[],memories:[]}),[selected,setSelected]=useState<Person>(1),[night,setNight]=useState(false),[automatic,setAutomatic]=useState(true),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[error,setError]=useState(""),[input,setInput]=useState(""),[retry,setRetry]=useState<Command|null>(null);
  const busyRef=useRef(false),alive=useRef(true),autoRef=useRef(true),nightRef=useRef(false),turn=useRef<Person>(1),version=useRef(0),abort=useRef<AbortController|null>(null),feed=useRef<HTMLDivElement>(null);
  useEffect(()=>{worldRef.current=world},[world]);
  useEffect(()=>{nightRef.current=night},[night]);
  const load=useCallback(async(clearError=false)=>{
    if(busyRef.current)return;const generation=++version.current;
    let moving=false;
    try{const response=await fetch("/api/world",{cache:"no-store",signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error("La mémoire est momentanément indisponible.");const data=await response.json() as World;if((data.presentationVersion??presentationVersion)>presentationVersion)setUpdateAvailable(true);if(alive.current&&generation===version.current){
      if(firstLoad.current){firstLoad.current=false;if(data.messages.length||data.agents.some(a=>a.cycle>0)){resumeGate.current=true;setResumePrompt(true);autoRef.current=false;setAutomatic(false);}}
      const before=worldRef.current;
      if(before.epoch!==data.epoch||!before.agents.some(a=>a.last_seen))setPreviousAgents(data.agents);else if(before.agents.some((a,i)=>JSON.stringify(a)!==JSON.stringify(data.agents[i])))setPreviousAgents(before.agents);
      moving=true;busyRef.current=true;setBusy(true);
      const reached=new Promise<void>(resolve=>{arrival.current=resolve;});
      setWorld({...data,messages:data.epoch===before.epoch?before.messages:[]});setReady(true);
      await Promise.race([reached,new Promise<void>(resolve=>window.setTimeout(resolve,10000))]);arrival.current=null;
      if(alive.current&&generation===version.current){setWorld(data);if(clearError)setError("");}
    }}
    catch(e){if(alive.current&&generation===version.current){setError(e instanceof Error?e.message:"Connexion indisponible");setReady(false);}}
    finally{if(moving){busyRef.current=false;if(alive.current)setBusy(false);}}
  },[]);
  const run=useCallback(async(command:Command)=>{
    if(busyRef.current)return false;setSimulationTurn(["autonomous","interact"].includes(command.mode));busyRef.current=true;++version.current;setBusy(true);setError("");setNotice("");setRetry(null);
    const controller=new AbortController();abort.current=controller;const timeout=window.setTimeout(()=>controller.abort(),80000);
    const payload=JSON.stringify({...command,epoch:command.epoch??worldRef.current.epoch}),started=Date.now();
    try{
      let data:World&{error?:string;code?:string};
      while(true){
        if(command.mode==="autonomous"&&!autoRef.current)return false;
        const response=await fetch("/api/lia",{method:"POST",headers:{"Content-Type":"application/json"},body:payload,signal:controller.signal});
        data=await response.json();
        if(response.status===409&&data.code==="world_busy"&&Date.now()-started<55000){
          const delay=Math.min(5000,Math.max(1000,Number(response.headers.get("Retry-After")||5)*1000));
          await new Promise<void>((resolve,reject)=>{const done=()=>{controller.signal.removeEventListener("abort",cancel);resolve()},timer=window.setTimeout(done,delay),cancel=()=>{clearTimeout(timer);reject(new DOMException("Aborted","AbortError"))};controller.signal.addEventListener("abort",cancel,{once:true});if(controller.signal.aborted)cancel();});
          continue;
        }
        if(response.status===429&&data.code==="auto_throttled"){setNotice("Le prochain tour attend son créneau.");return false;}
        if(!response.ok)throw new Error(data.error||"Ce tour n’a pas pu être terminé.");
        break;
      }
      if(command.mode==="reset"&&alive.current){setPreviousAgents(data.agents);setWorld(data);worldRef.current=data;setInput("");setNight(false);nightRef.current=false;turn.current=1;setReady(true);setAutomatic(true);autoRef.current=true;return true;}
      if(alive.current){
        const before=worldRef.current.messages,seen=new Set(before.map(m=>m.id));
        const fresh=data.messages.filter(m=>!seen.has(m.id));if(!fresh.length&&command.mode==="interact")setNotice(data.agents.some(a=>["sleep","share_sleep"].includes(a.intent))?"Tour silencieux · le sommeil progresse.":"Tour terminé · les jauges ont été mises à jour.");
        const simulate=["interact","autonomous"].includes(command.mode);
        const paused=()=>document.visibilityState!=="visible"||simulate&&!autoRef.current;
        const wait=(ms:number)=>waitForPlayback(ms,{paused,alive:()=>alive.current});
        const present=async(message:Message,snapshot:World)=>{
          await wait(1);if(!alive.current)return;
          setHumanSpeaking(message.speaker==="vous");setSpeaking(message.speaker==="Lia"?[1]:message.speaker==="Noé"?[2]:[]);
          const typed=new Promise<void>(resolve=>{typingDone.current=resolve});setTypingId(message.id);setTypingPaused(paused());setWorld(snapshot);
          const watch=window.setInterval(()=>setTypingPaused(paused()),50);try{await typed;}finally{clearInterval(watch);setTypingId(null);setHumanSpeaking(false);setSpeaking([]);}
          await wait(350);
        };
        const travel=fresh.filter(m=>m.speaker.endsWith(" · déplacement"));
        for(let i=0;i<travel.length;i++)await present(travel[i],{...worldRef.current,messages:[...before,...travel.slice(0,i+1)].slice(-40)});
        const reached=new Promise<void>(resolve=>{arrival.current=resolve;});
        setPreviousAgents(worldRef.current.agents);setWorld({...data,agents:data.agents.map(a=>({...a,needs:worldRef.current.agents.find(p=>p.id===a.id)!.needs,emotions:worldRef.current.agents.find(p=>p.id===a.id)!.emotions})),story:worldRef.current.story,messages:[...before,...travel].slice(-40)});setReady(true);
        // The scene acknowledges arrival, including when WebGL is unavailable.
        await Promise.race([reached,waitForPlayback(10000,{paused,alive:()=>alive.current&&arrival.current!==null})]);arrival.current=null;clearTimeout(timeout);
        const events=data.visualEvents??[];if(events.length){setVisualStage(true);setVisualEvents(events);await wait(Math.max(...events.map(e=>e.duration))+200);setVisualStage(false);setVisualEvents([]);}
        for(let i=0;i<fresh.length;i++){
          if(fresh[i].speaker.endsWith(" · déplacement"))continue;
          if(!alive.current)break;
          await present(fresh[i],{...data,messages:[...before,...fresh.slice(0,i+1)].slice(-40)});
        }
        if(alive.current)setWorld(data);
        if(command.mode==="chat")setInput(current=>current===command.message?"":current);}
      return true;
    }catch(e){if(alive.current){setError(e instanceof Error&&e.name!=="AbortError"?e.message:"La réponse a pris trop de temps. Tu peux réessayer ce même tour.");setRetry({...command,epoch:command.epoch??worldRef.current.epoch});setAutomatic(false);autoRef.current=false;}return false;}
    finally{setSimulationTurn(false);setTypingId(null);setTypingPaused(false);typingDone.current?.();typingDone.current=null;setVisualStage(false);setVisualEvents([]);setHumanSpeaking(false);setSpeaking([]);clearTimeout(timeout);busyRef.current=false;if(alive.current)setBusy(false);}
  },[]);
  const investigation=investigationCounts(world.story?.evidence??[],world.story?.observations??[],world.story?.life?.tvSeen??false,world.story?.dreams??[],world.story?.life);
  const command=(mode:Command["mode"],room?:Room)=>run({requestId:crypto.randomUUID(),actor:selected,mode,room,message:mode==="chat"?input.trim():undefined,night});
  useEffect(()=>{
    alive.current=true;void load();
    const polling=window.setInterval(()=>{if(document.visibilityState==="visible"&&!busyRef.current)void load()},30000);

    return()=>{alive.current=false;typingDone.current?.();typingDone.current=null;arrival.current?.();arrival.current=null;abort.current?.abort();clearInterval(polling);};
  },[load,run]);
  useEffect(()=>{
    if(resumePrompt||!automatic||ready&&!world.story?.observer&&!nicknameDone)return;
    const timer=window.setInterval(()=>{if(document.visibilityState==="visible"&&autoRef.current&&!resumeGate.current&&!busyRef.current){void run({requestId:crypto.randomUUID(),actor:turn.current,mode:"autonomous",night:nightRef.current});turn.current=turn.current===1?2:1;}},90000);
    return()=>clearInterval(timer);
  },[resumePrompt,automatic,run,ready,world.story?.observer,nicknameDone]);
  useEffect(()=>{if(document.activeElement!==messageBox.current)feed.current?.scrollTo({top:feed.current.scrollHeight,behavior:"smooth"})},[world.messages]);
  useEffect(()=>setOlder([]),[world.epoch]);
  const history=async()=>{if(historyBusy)return;setHistoryBusy(true);try{const epoch=worldRef.current.epoch;const first=[...older,...world.messages][0]?.id;if(!first)return;const r=await fetch("/api/world?before="+first);if(r.ok){const data=await r.json() as {messages:Message[]};if(worldRef.current.epoch===epoch)setOlder(previous=>Array.from(new Map([...data.messages,...previous].map(m=>[m.id,m])).values()));}}finally{setHistoryBusy(false);}};
  useEffect(()=>{
    type Context={registerTool:(tool:{name:string;title:string;description:string;inputSchema:object;annotations:object;execute:(input:unknown)=>Promise<object>},options:{signal:AbortSignal})=>void|Promise<void>};
    const context=(document as Document&{modelContext?:Context}).modelContext;if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    void Promise.resolve(context.registerTool({name:"direct_lia",title:"Donner une action à Lia",description:"Déplace Lia dans la maison : rejoindre le salon, explorer le bureau ou se diriger vers la fenêtre et le canapé du salon.",inputSchema:{type:"object",properties:{action:{type:"string",enum:["come","explore","window","sit"]}},required:["action"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},async execute(input){const action=typeof input==="object"&&input!==null&&"action" in input?String(input.action):"";if(!["come","explore","window","sit"].includes(action))throw new Error("Action inconnue");const ok=await run({requestId:crypto.randomUUID(),actor:1,mode:"move",room:action==="explore"?"bureau":"salon",night:nightRef.current});if(!ok)throw new Error("Ce déplacement n’a pas pu être enregistré.");return {status:"saved",action};}},{signal:lifecycle.signal})).catch(()=>undefined);
    return()=>lifecycle.abort();
  },[run]);
  const send=(event:FormEvent)=>{event.preventDefault();if(input.trim()&&!busy&&ready&&world.story?.humanUnlocked)void command("chat")};
  const resident=world.agents.find(agent=>agent.id===selected)!;
  const nicknameOpen=ready&&!world.story?.observer&&!nicknameDone;
  return <main className="house-app">
    {resumePrompt&&<div className="nickname-overlay"><section className="nickname-dialog" role="dialog" aria-modal="true" aria-labelledby="resume-title"><h2 id="resume-title">Reprendre la maison ?</h2><p>Conserver leur histoire, ou recommencer une nouvelle arrivée ?</p><button autoFocus onClick={()=>{resumeGate.current=false;setResumePrompt(false);}}>Conserver l’histoire</button><button disabled={busy} onClick={async()=>{if(await command("reset")){resumeGate.current=false;setResumePrompt(false);}}}>Nouvelle arrivée</button></section></div>}
    {nicknameOpen&&<div className="nickname-overlay"><form className="nickname-dialog" role="dialog" aria-modal="true" aria-labelledby="nickname-title" onSubmit={async e=>{e.preventDefault();if(nickname.trim()&&await run({requestId:crypto.randomUUID(),actor:selected,mode:"identify",message:nickname,night}))setNicknameDone(true);}}><h2 id="nickname-title">Comment vous appeler ?</h2><label htmlFor="nickname">Votre pseudo</label><input id="nickname" autoFocus maxLength={32} value={nickname} onChange={e=>setNickname(e.target.value)} autoComplete="nickname"/><button type="submit" disabled={busy||!nickname.trim()}>Entrer</button>{error&&<p role="alert">{error}</p>}</form></div>}
    {updateAvailable&&<div className="update-banner" role="status">Une mise à jour de la maison est disponible.<button onClick={()=>window.location.reload()} disabled={busy}>Actualiser l’interface · garder l’histoire</button></div>}
    <header className="app-header"><div className="brand"><Home size={22}/><div>MAISON <b>01</b><p>Lia & Noé · maison vivante</p></div></div><div className="header-controls"><AdminReference/><button onClick={()=>setNight(!night)} aria-label={night?"Passer au jour":"Passer à la nuit"}>{night?<Sun size={17}/>:<Moon size={17}/>}<span>{night?"Nuit":"Jour"}</span></button><button onClick={()=>{const next=!autoRef.current;autoRef.current=next;setAutomatic(next)}} aria-label={automatic?"Mettre les tours automatiques en pause":"Reprendre les tours automatiques"} className={!automatic?"pause-active":""} aria-pressed={!automatic}>{automatic?<Pause size={17}/>:<Play size={17}/>}<span>Un tour = 30 min simulées · {automatic?"Mettre en pause":"Reprendre"}</span></button></div></header>
    {roomInfo&&<div className="nickname-backdrop" onClick={event=>{if(event.target===event.currentTarget)setRoomInfo(null)}}><section onKeyDown={event=>{if(event.key==="Escape")setRoomInfo(null);if(event.key==="Tab"){event.preventDefault();event.currentTarget.querySelector<HTMLButtonElement>("button")?.focus();}}} className="nickname-dialog room-dialog" role="dialog" aria-modal="true" aria-labelledby="room-title"><h2 id="room-title">{roomInfo}</h2><p>{roomDescriptions[roomInfo]}</p><button autoFocus onClick={()=>setRoomInfo(null)}>Fermer</button></section></div>}
    <div className="house-intro"><div><h1>Deux inconnus. Une maison. Qui sont-ils vraiment ?</h1><p>Une sensation étrange. Une rencontre. Un mystère à reconstruire ensemble.</p></div><button className={`arrival-button ${busy?"arrival-pending":""}`} disabled={busy||!ready} onClick={()=>{if(window.confirm("Recommencer leur arrivée avec un nouveau scénario ? Les conversations, souvenirs et jauges seront effacés."))void command("reset")}}><RefreshCw size={16}/> Nouvelle arrivée</button></div>
    <section className="main-layout">
      <div className="living-space"><div className="map-heading"><h1>La maison</h1><span>Perspective 3D · maison & jardin</span></div><HouseView paused={!automatic&&simulationTurn} visualEvents={visualEvents} gardenOpen={Boolean(world.story?.humanUnlocked&&world.story.life?.gardenOpen)} key={world.epoch} agents={world.agents} night={night} onSelect={setSelected} onRoom={setRoomInfo} onSettled={onSettled} humanSpeaking={humanSpeaking} tvOn={world.story?.life?.tvOn} thinking={speaking.length>0} speaking={speaking} evidence={world.story?.evidence??[]} observations={world.story?.observations??[]} mirrorSeen={world.story?.life?.mirrorVerified??false} foodSeen={world.story?.life?.foodVerified??false} speakerOn={world.story?.life?.ambientVerified??false} tvSeen={world.story?.life?.tvSeen??false} inspectionStep={world.story?.life?.exitActive?world.story.life.exitPhase??0:0}/>
        <div className="resident-cards">{world.agents.map(agent=><button key={agent.id} className={`resident-card ${agent.id===2?"noe":"lia"} ${selected===agent.id?"selected":""}`} onClick={()=>setSelected(agent.id)} aria-pressed={selected===agent.id}><div className="resident-name"><span className="portrait">{smiley(agent)}</span><div><strong>{agent.name} <span className="resident-age">{ages[agent.id]} ans</span>{isInLove(agent.emotions.attraction)&&<span className="love-badge"> ♥</span>}</strong><span>{world.story?.life?.exitActive?"couloir":agent.room} · {agent.mood}</span></div><ArrowUpRight size={18}/></div><p>{agent.activity}</p><small>Objectif : {agent.goal}</small><small className="personality-note">{agent.id===1?"Réservée · petit appétit · fatigue plus vite":"Plus assuré · bon appétit · fatigue après les repas"}</small><div className="attachment-gauge"><span>Attachement à {names[agent.id===1?2:1]} · {(agent.attachment??0)===0?"aucun lien":(agent.attachment??0)<25?"nécessité":(agent.attachment??0)<65?"envie":"amour"}</span><div className="gauge-track">{trend(agent,"attachment",agent.attachment??0)}<meter min={0} max={100} value={agent.attachment??0}/></div><small>{agent.attachment??0}%</small></div><div className="need-gauges"><span className="emotion-heading">Besoins · 100 % = urgent</span>{(["hunger","fatigue","stress","uncertainty"] as const).map(key=><div className="emotion-row" key={key}><span>{{hunger:"Faim",fatigue:"Fatigue",stress:"Stress",uncertainty:"Incertitude"}[key]}</span><div className="gauge-track">{trend(agent,key,agent.needs[key])}<meter className={`need-meter need-${needLevel(key,agent.needs[key])}`} min={0} max={100} value={agent.needs[key]} aria-label={`${key} de ${agent.name}`} aria-valuetext={`${agent.needs[key]} %, ${needLevel(key,agent.needs[key])==="urgent"?"urgent":needLevel(key,agent.needs[key])==="pressing"?"pressant":"normal"}`}/></div><span>{agent.needs[key]} %</span></div>)}</div><div className="emotion-gauges"><span className="emotion-heading">Émotions simulées</span>{emotionKeys.map(key=><div className={`emotion-row ${agent.emotions[key]>=75?"emotion-high":""}`} key={key}><span>{emotionLabels[key]}</span><div className="gauge-track">{trend(agent,key,agent.emotions[key])}<meter min={0} max={100} value={agent.emotions[key]} aria-label={`${emotionLabels[key]} de ${agent.name}`}/></div><span>{agent.emotions[key]} %</span></div>)}</div></button>)}</div>
        <details className="memory-panel investigation"><summary title="Observations : objets examinés, constats généraux et rêves consignés, sans doublon">🔎 Dossier de la maison · {investigation.indices} indice{investigation.indices!==1?"s":""} · {investigation.observations} observation{investigation.observations!==1?"s":""}</summary>{world.story?.evidence.length?world.story.evidence.map((clue,i)=><p key={i}><strong>Indice {i+1}</strong> — {clue}</p>):<p>Aucune preuve pour le moment. Le bureau et la télévision permettent d’enquêter. Les découvertes sont conservées ; leur ordre change à chaque nouvelle arrivée.</p>}{uniqueObservations(world.story?.observations).map((observation,i)=><p key={`observation-${i}`}><strong>Observation</strong> — {observation}</p>)}</details>
        <div className="room-links">{[...rooms,"jardin" as const].map(room=><button key={room} onClick={()=>setRoomInfo(room)}>{room}</button>)}</div>
        {world.agents.some(a=>a.intent==="tv")&&<div className="tv-program"><strong>📺 Télévision · programme fictif</strong><p>{tvPrograms[Math.floor(((world.agents.find(a=>a.intent==="tv")?.cycle??1)-1)/3)%tvPrograms.length]}</p></div>}
        <div className="simulation-status"><span>{ready?"Souvenirs enregistrés dans la maison":"Connexion à la mémoire…"}</span><span>Un tour = 30 min simulées · {automatic?"Un tour automatique toutes les 90 s, page visible":"Tours automatiques en pause"}</span></div>
      </div>
      <aside className="companion-panel"><button className={`interaction-button ${!automatic?"is-paused":!busy?"inviting":""}`} disabled={busy||!ready||!automatic||resumePrompt} onClick={()=>void command("interact")}><Users size={18}/> {!automatic?"en pause":"Générer des actions"}</button><div className="panel-heading"><h2><MessageCircle size={19}/> Conversations</h2><span>Google Gemini</span></div>
        <button className="history-button" disabled={historyBusy||!world.messages.length} onClick={()=>void history()}>{historyBusy?"Chargement…":"Messages précédents"}</button><div className="conversation-feed" ref={feed} aria-live="polite">{!world.messages.length&&<p className="empty-feed">Deux inconnus dans une maison sans explication. Où sont-ils ? Pourquoi ici ? Qui est l’autre ? Observez leur rencontre ou proposez-leur de discuter ensemble. </p>}{Array.from(new Map([...older,...world.messages].map(m=>[m.id,m])).values()).map(message=><article key={message.id} className={`message ${message.speaker.endsWith(" · déplacement")?"movement ":""}${message.speaker==="vous"?"you":message.speaker.startsWith("Noé")?"noe":message.speaker.startsWith("Lia")?"lia":"system"}`}><div className="message-heading"><strong>{message.speaker}</strong><span className="message-room" title={message.room??"Pièce non enregistrée pour ce message ancien"}>{departurePresentation(message.content,message.room).route}</span><time dateTime={new Date(message.created_at).toISOString()} title={new Date(message.created_at).toLocaleString("fr-FR")}>{new Date(message.created_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</time></div><p>{/ · (pensée|rêve)$/.test(message.speaker)?<em><ProgressiveText text={departurePresentation(message.content,message.room).text} active={typingId===message.id} paused={typingPaused} onComplete={finishTyping}/></em>:<ProgressiveText text={departurePresentation(message.content,message.room).text} active={typingId===message.id} paused={typingPaused} onComplete={finishTyping}/>}</p></article>)}</div><div className="loading-stage" aria-live="polite">{busy?<p className="thinking loading-status" role="status"><span className="loading-dot"/>{!automatic&&simulationTurn?"en pause":visualStage?"observation...":"en cours..."}</p>:<p className={error?"idle-status idle-error":"idle-status"}>{error?"Transmission interrompue":"les informations sont transmises avec succès"}</p>}</div><button className={`interaction-button action-bottom ${!automatic?"is-paused":!busy?"inviting":""}`} disabled={busy||!ready||!automatic||resumePrompt} onClick={()=>void command("interact")}><Users size={18}/> {!automatic?"en pause":"Générer des actions"}</button>
        {notice&&<p className="channel-status" role="status">{notice}</p>}
        {error&&<div className="error-box" role="alert"><p>{error}</p>{retry?<button disabled={busy} onClick={()=>void run(retry)}><RefreshCw size={15}/> Réessayer ce tour</button>:<button disabled={busy} onClick={()=>void load(true)}>Reconnecter la mémoire</button>}</div>}
        <form className={`composer ${selected===1?"lia":"noe"} ${world.story?.humanUnlocked?"unlocked":"locked"}`} onSubmit={send}><label htmlFor="message" className={world.story?.humanUnlocked?"":"sr-only"}>{world.story?.humanUnlocked?`Parler à ${names[selected]}`:"Message pour l’habitant sélectionné"}</label><textarea ref={messageBox} disabled={!ready||!world.story?.humanUnlocked} id="message" aria-describedby="channel-status" value={input} onChange={event=>setInput(event.target.value)} placeholder={world.story?.humanUnlocked?`Ton message pour ${names[selected]}…`:`${names[selected]} n’a pas conscience de votre présence`} maxLength={2000} rows={3}/><p className="channel-status" id="channel-status" role="status">{world.story?.humanUnlocked?"Canal ouvert · choisissez Lia ou Noé sur sa fiche pour lui parler.":""}</p><button disabled={busy||!ready||!world.story?.humanUnlocked||!input.trim()} type="submit">Envoyer à {names[selected]}</button></form>

        {world.story?.humanUnlocked&&<div className="garden-access"><button className="discuss-button" disabled={busy||!ready||Boolean(world.story.life?.gardenOpen)} onClick={()=>void run({requestId:crypto.randomUUID(),actor:selected,mode:"unlock_garden",night})}>{world.story.life?.gardenOpen?"♧ Jardin ouvert":"♧ Ouvrir le jardin"}</button><small>La porte principale reste fermée.</small></div>}
        <div className="room-controls"><h3>Déplacer {resident.name}</h3><div>{(world.story?.humanUnlocked&&world.story.life?.gardenOpen?[...rooms,"jardin" as const]:rooms).map(room=><button disabled={busy||!ready} key={room} onClick={()=>void command("move",room)}>{room}</button>)}</div></div>
        <details className={`memory-panel dream-panel ${selected===1?"lia":"noe"}`}><summary>🌙 Rêves de {resident.name}</summary>{world.story?.dreams?.filter(d=>d.actor===selected).length?world.story.dreams.filter(d=>d.actor===selected).slice(-3).map(d=><p key={d.round}>« {d.content} »</p>):<p>Aucun rêve consigné.</p>}</details>
        <details className="memory-panel"><summary>Souvenirs de {resident.name}</summary>{world.memories.filter(memory=>memory.agent_id===selected).slice(0,6).map(memory=>{const stamp=memory.content.match(/^\[([^|]+)\|[^\]]+\] /);return <p key={memory.id}><small className="memory-stamp">{new Date(memory.created_at).toLocaleTimeString("fr-FR")} · {stamp?.[1]??memory.room??"lieu non enregistré"}</small>{memory.content.replace(/^\[[^\]]+\] /,"")}</p>})}{!world.memories.some(memory=>memory.agent_id===selected)&&<p>Aucun souvenir pour le moment.</p>}</details>
      </aside>
    </section>
  </main>;
}
