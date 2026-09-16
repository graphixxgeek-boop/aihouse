"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { residentDestination, exterior, centers, furniture, walls, rooms, pathBetween, type Person, type Room } from "@/lib/house";
import {residentAppearance,scenePalette,sceneWindows,sceneObjects,sceneView,restingPose} from "@/lib/perception";
import { isInLove } from "@/lib/relationship";
import { smiley } from "@/lib/simulation";
import {evidenceLedger} from "@/lib/evidence";
import type { Resident } from "@/lib/world";

import {visualTiming,type VisualEvent} from "../lib/visual-events";
import {cityFacades,sceneSpeakers} from "../lib/perception";
export function HouseView({paused=false,visualEvents=[],gardenOpen=false,agents,night,onSelect,onSettled,thinking=false,evidence=[],observations=[],tvSeen=false,inspectionStep=0,speakerOn=false,mirrorSeen=false,foodSeen=false,speaking=[],humanSpeaking=false,tvOn,onRoom}:{paused?:boolean;visualEvents?:VisualEvent[];gardenOpen?:boolean;agents:Resident[];night:boolean;onSelect:(id:Person)=>void;onSettled?:()=>void;thinking?:boolean;evidence?:string[];observations?:string[];tvSeen?:boolean;inspectionStep?:number;speakerOn?:boolean;mirrorSeen?:boolean;foodSeen?:boolean;speaking?:Person[];humanSpeaking?:boolean;tvOn?:boolean;onRoom?:(room:Room)=>void}) {
  const gardenState=useRef(gardenOpen),gateUpdate=useRef<(open:boolean)=>void>(()=>{});
  useEffect(()=>{gardenState.current=gardenOpen;gateUpdate.current(gardenOpen);update.current(agents)},[gardenOpen,agents]);
  const scenePaused=useRef(paused);useEffect(()=>{scenePaused.current=paused},[paused]);
  const eventRef=useRef(visualEvents);useEffect(()=>{eventRef.current=visualEvents},[visualEvents]);
  const mealStamp=useRef("");
  const humanVoice=useRef(humanSpeaking);useEffect(()=>{humanVoice.current=humanSpeaking},[humanSpeaking]);
  // Anneau plus vif pendant qu'un personnage parle ("observation" en cours) et bref sursaut à
  // chaque nouvel indice trouvé — le seul stress/tension de fond passait inaperçu (retour
  // utilisateur du 2026-09-16 : les anneaux devaient "s'accélérer plus souvent", de façon lisible).
  const speakingRef=useRef(speaking);useEffect(()=>{speakingRef.current=speaking},[speaking]);
  const evidencePulse=useRef(0),evidenceCount=useRef(evidence.length+observations.length);
  useEffect(()=>{const count=evidence.length+observations.length;if(count>evidenceCount.current)evidencePulse.current=performance.now();evidenceCount.current=count;},[evidence.length,observations.length]);
  const illumination=useRef<(night:boolean)=>void>(()=>{}),speakerActive=useRef(speakerOn);
  const cooking=useRef(false);useEffect(()=>{cooking.current=agents.some(a=>a.room==="cuisine"&&a.intent==="eat")},[agents]);
  const roomSelect=useRef(onRoom);useEffect(()=>{roomSelect.current=onRoom},[onRoom]);
  const inspection=useRef(inspectionStep);
  const mount=useRef<HTMLDivElement>(null),update=useRef<(agents:Resident[])=>void>(()=>{}), select=useRef(onSelect),settled=useRef(onSettled);
  const bubbleNodes=useRef(new Map<Person,HTMLSpanElement>()),proofUpdate=useRef<(ids:Set<string>,tv:boolean)=>void>(()=>{});
  const cameraControl=useRef<(action:string)=>void>(()=>{});
  const [error,setError]=useState("");
  useEffect(()=>{settled.current=onSettled},[onSettled]);
  useEffect(()=>{select.current=onSelect},[onSelect]);
  useEffect(()=>{
    const host=mount.current;if(!host)return;const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)");
    let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"low-power"});}
    catch{update.current=()=>settled.current?.();setError("L’affichage 3D n’est pas disponible sur cet appareil. Les conversations et les commandes restent accessibles.");return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x111b2a);host.appendChild(renderer.domElement);
    let dirty=true;
    const scene=new THREE.Scene();const ambient=new THREE.HemisphereLight(0xffffff,0x263451,1.2);scene.add(ambient);
    const light=new THREE.DirectionalLight(0xffe8cf,1.6);light.position.set(-8,18,5);scene.add(light);
    const camera=new THREE.OrthographicCamera(-10,10,8,-8,.1,100);camera.position.set(sceneView.camera[0],sceneView.camera[1],sceneView.camera[2]);camera.zoom=1.16;camera.up.set(0,1,0);camera.lookAt(sceneView.target[0],0,0);
    illumination.current=n=>{ambient.intensity=n?.45:1.2;light.intensity=n?.65:1.6;renderer.toneMappingExposure=n?.7:.85;dirty=true;};
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;
    const mesh=(w:number,h:number,d:number,x:number,z:number,color:number,y=0)=>{
      const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.55,metalness:.06}));m.position.set(x,y+h/2,z);scene.add(m);return m;
    };
    mesh(16.5,.2,12.5,0,0,0x19243b,-.3);
    const roomColors=scenePalette.floors;
    const roomTargets:THREE.Object3D[]=[];const targets:THREE.Object3D[]=[];
    rooms.forEach((room,i)=>{
      const [x,z]=centers[room];const floor=mesh(7.8,.05,4.8,x,z,roomColors[i],-.08);floor.userData.room=room;roomTargets.push(floor);
    });
    // The exterior shares the navigation registry: road is scenery, never a destination.
    const garden=exterior.garden,road=exterior.road,sidewalk=exterior.sidewalk;
    mesh(garden.w+.2,.2,garden.d+.2,garden.x,0,0x253e35,-.3);
    const lawn=mesh(garden.w-.1,.055,garden.d-.1,garden.x,0,garden.color,-.08);lawn.userData.room="jardin";roomTargets.push(lawn);
    const gc=document.createElement("canvas");gc.width=gc.height=256;const gg=gc.getContext("2d")!;gg.fillStyle="#477753";gg.fillRect(0,0,256,256);for(let i=0;i<140;i++){const x=(i*73)%256,z=(i*41)%256;gg.strokeStyle=i%2?"#8fb36e60":"#254d3860";gg.beginPath();gg.moveTo(x,z);gg.lineTo(x+2,z-4);gg.stroke();}const gt=new THREE.CanvasTexture(gc);gt.colorSpace=THREE.SRGBColorSpace;const grass=new THREE.Mesh(new THREE.PlaneGeometry(5.85,11.85),new THREE.MeshStandardMaterial({map:gt,roughness:1}));grass.rotation.x=-Math.PI/2;grass.position.set(garden.x,.016,0);scene.add(grass);
    mesh(.12,.6,12,-14,0,0x617568);for(const z of [-6,6])mesh(6,.6,.12,-11,z,0x617568);
    for(let z=-5;z<=5;z+=1)mesh(.08,.75,.08,-13.94,z,0x81978b);
    const tree=garden.tree;const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.14,.24,1.8,8),new THREE.MeshStandardMaterial({color:0x775344,roughness:1}));trunk.position.set(tree.x,.9,tree.z);scene.add(trunk);
    for(let i=0;i<7;i++){const a=i*Math.PI*2/6,leaf=new THREE.Mesh(new THREE.DodecahedronGeometry(.7,0),new THREE.MeshStandardMaterial({color:i%2?0x6a9a64:0x3a694d,roughness:1}));leaf.position.set(tree.x+(i===6?0:Math.cos(a)*.48),2+(i===6?.45:Math.sin(a)*.12),tree.z+(i===6?0:Math.sin(a)*.48));leaf.scale.set(1,1.1,1);scene.add(leaf);}
    mesh(sidewalk.w,.09,sidewalk.d,sidewalk.x,0,0xa8acb2,-.1);for(let z=-7;z<=7;z+=.75)mesh(sidewalk.w,.006,.02,sidewalk.x,z,0x7c848e,0);
    mesh(.13,.15,15,9.75,0,0xc3c6ca,-.15);mesh(road.w,.055,road.d,road.x,0,0x303b4a,-.13);for(let z=-6.5;z<=6.5;z+=2.5)mesh(.07,.01,1.2,road.x,z,0xd1d0bc,-.068);
    const gate=new THREE.Group();gate.position.set(-8,0,0);scene.add(gate);
    const leaf=new THREE.Mesh(new THREE.BoxGeometry(.1,.92,1.4),new THREE.MeshStandardMaterial({color:0x729887,roughness:.55}));leaf.position.set(0,.46,0);gate.add(leaf);const handle=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),new THREE.MeshStandardMaterial({color:0xdfd6a8,metalness:.65,roughness:.3}));handle.position.set(-.1,.5,.48);gate.add(handle);
    for(const x of [-8,8]){for(const z of [-.86,.86])mesh(.23,1.08,.16,x,z,0x85919e);mesh(.23,.13,1.88,x,0,0x85919e,1.02);}
    mesh(.11,.94,1.4,8,0,0x566075);mesh(.12,.07,.2,7.87,.44,0xc4c7cc,.44);
    gateUpdate.current=open=>{gate.rotation.y=open?Math.PI/2:0;gate.position.set(open?-8.55:-8,0,open?-.8:0);dirty=true;};gateUpdate.current(gardenState.current);
    mesh(.3,.12,.3,-8.7,-.9,0x243743,.55);
    // Corridor textile is static, and does not change the traversable floor.
    mesh(15.8,.035,1.8,0,0,scenePalette.corridor,.016);
    const carpet=document.createElement("canvas");carpet.width=256;carpet.height=64;const cg=carpet.getContext("2d")!;cg.fillStyle="#c3ad89";cg.fillRect(0,0,256,64);cg.fillStyle="#ae967533";for(let x=0;x<256;x+=5)cg.fillRect(x,0,1,64);const cm=new THREE.Mesh(new THREE.PlaneGeometry(15.8,1.72),new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(carpet),roughness:1}));cm.rotation.x=-Math.PI/2;cm.position.y=.052;scene.add(cm);
    // Static city fragment: façades, pavement and lamps beyond the locked main door.
    mesh(31,.055,1.3,-.2,-7.2,0x9ba4ae,-.16);mesh(31,.055,2,-.2,-9,0x303b4a,-.18);
    for(let x=-14;x<=14;x+=2.5)mesh(1,.005,.07,x,-9,0xd1d0bc,-.123);
    for(const {x,z,w,h,color:c} of cityFacades){mesh(w,h,1.6,x,z,c,-.1);for(let j=0;j<3;j++)mesh(.4,.25,.02,x-w/3+j*w/3,z+.82,0xb9c7c8,.55);}
    for(const [x,z] of [[9,-6],[9,6],[-8,-7.1]]){mesh(.08,1.5,.08,x,z,0x596573,0);mesh(.38,.1,.2,x,z,0xdfd3b0,1.5);}
    // A parked vehicle and subtle kerb detail keep the street frozen.
    mesh(.95,.3,1.8,11.1,-3.2,0x667894,.04);mesh(.73,.28,.88,11.1,-3.3,0xa3b3c6,.34);for(const z of [-3.8,-2.6])for(const x of [10.63,11.57]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.1,10),new THREE.MeshStandardMaterial({color:0x26303f}));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.16,z);scene.add(wheel);}for(let i=0;i<5;i++)mesh(2.5,.006,.17,11.8,4+i*.3,0xc5c9cd,-.09);
    // Garden bench, a low planter and flush stepping stones remain outside anchor paths.
    mesh(.5,.34,1.8,-13,3.6,0x986e55,.12);for(const z of [3,4.2])mesh(.12,.28,.12,-13,z,0x4a5a51,0);mesh(.15,.45,1.8,-13.24,3.6,0x795744,.25);
    for(const [x,z] of [[-9.3,0],[-9.9,.7],[-10.5,1.25]]){const stone=new THREE.Mesh(new THREE.CircleGeometry(.28,7),new THREE.MeshStandardMaterial({color:0xa1a69c,roughness:1}));stone.rotation.x=-Math.PI/2;stone.position.set(x,.07,z);scene.add(stone);}
    mesh(.7,.2,.6,-12.7,-4.8,0x8b7766,.06);for(let i=0;i<3;i++){const bush=new THREE.Mesh(new THREE.IcosahedronGeometry(.22,0),new THREE.MeshStandardMaterial({color:0x76946a}));bush.position.set(-12.9+i*.2,.4,-4.8);scene.add(bush);}
    walls.forEach(r=>{mesh(r.w,r.h,r.d,r.x,r.z,scenePalette.wall);mesh(r.w,.025,r.d,r.x,r.z,0x9cabba,r.h);});
    furniture.forEach((r,i)=>{const palette=[0x151b31,0x804563,0x9a684c,0x604b70,0x314a72,0x314a72,0xaa764f,0x754c72,0x665474,0x875e4d,0x875e4d];const m=mesh(r.w,r.h,r.d,r.x,r.z,palette[i]??r.color);const edges=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),new THREE.LineBasicMaterial({color:0xcab0a4,transparent:true,opacity:.35}));m.add(edges);mesh(r.w*.96,.015,r.d*.96,r.x,r.z,palette[i]??r.color,r.h);});
    // Baked details keep the render light: one floor overlay per room, no postprocessing.
    rooms.forEach((room,i)=>{const c=document.createElement("canvas");c.width=256;c.height=256;const g=c.getContext("2d")!;g.fillStyle="#"+scenePalette.floors[i].toString(16).padStart(6,"0");g.fillRect(0,0,256,256);g.lineWidth=1;g.strokeStyle="#ffffff18";
      if(room==="salon"){for(let y=0;y<256;y+=24){g.fillStyle=y%48?"#ffffff07":"#0000000b";g.fillRect(0,y,256,23);g.beginPath();g.moveTo(0,y);g.lineTo(256,y);g.stroke();for(let x=(y%48?35:0);x<256;x+=90){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+24);g.stroke();}}}
      else if(room==="cuisine"){for(let y=0;y<256;y+=32)for(let x=0;x<256;x+=32){g.fillStyle=(x+y)%64?"#ffffff08":"#0000000a";g.fillRect(x+1,y+1,30,30);g.strokeRect(x,y,32,32);}}
      else if(room==="chambre"){g.strokeStyle="#e2b9d312";for(let y=0;y<256;y+=6){g.beginPath();g.moveTo(0,y);g.lineTo(256,y);g.stroke();}g.strokeStyle="#100a1612";for(let x=0;x<256;x+=6){g.beginPath();g.moveTo(x,0);g.lineTo(x,256);g.stroke();}}
      else{for(let y=0;y<256;y+=64)for(let x=0;x<256;x+=64)g.strokeRect(x,y,64,64);g.strokeStyle="#b3cbe42b";g.strokeRect(12,12,232,232);g.beginPath();g.moveTo(16,220);g.lineTo(48,220);g.lineTo(48,238);g.stroke();}g.strokeStyle="#07142126";g.strokeRect(5,5,246,246);const ft=new THREE.CanvasTexture(c);ft.colorSpace=THREE.SRGBColorSpace;const tile=new THREE.Mesh(new THREE.PlaneGeometry(7.75,4.75),new THREE.MeshStandardMaterial({map:ft,roughness:.6}));tile.rotation.x=-Math.PI/2;tile.position.set(centers[room][0],.015,centers[room][1]);scene.add(tile);});
    sceneSpeakers.forEach(({x,z})=>{mesh(.28,.08,.28,x,z,0x212d3b,.8);mesh(.15,.02,.15,x,z,0x93b9c6,.89);});
    // Four windows share a deliberately frozen painted skyline.
    const wc=document.createElement("canvas");wc.width=128;wc.height=64;const wg=wc.getContext("2d")!;const sky=wg.createLinearGradient(0,0,0,64);sky.addColorStop(0,"#203552");sky.addColorStop(1,"#79618b");wg.fillStyle=sky;wg.fillRect(0,0,128,64);wg.fillStyle="#172237";cityFacades.forEach((f,i)=>{const x=8+i*30,w=f.w*6,h=f.h*22;wg.fillStyle="#"+f.color.toString(16).padStart(6,"0");wg.fillRect(x,60-h,w,h);wg.fillStyle="#b9c7c8";for(let j=0;j<3;j++)wg.fillRect(x+3+j*5,64-h,2,3);});wg.fillStyle="#b5a5bd";wg.fillRect(92,8,3,3);const windowTexture=new THREE.CanvasTexture(wc);const gw=document.createElement("canvas");gw.width=128;gw.height=64;const gctx=gw.getContext("2d")!;gctx.fillStyle="#8797a7";gctx.fillRect(0,0,128,64);gctx.fillStyle="#477753";gctx.fillRect(0,32,128,32);gctx.fillStyle="#775344";gctx.fillRect(62,24,5,23);gctx.fillStyle="#4b7b55";gctx.beginPath();gctx.arc(64,24,18,0,Math.PI*2);gctx.fill();const gardenWindowTexture=new THREE.CanvasTexture(gw);sceneWindows.forEach(win=>{mesh(win.w+.15,.04,win.d+.1,win.x,win.z,0x111b32,.56);const glass=new THREE.Mesh(new THREE.PlaneGeometry(win.w,win.d),new THREE.MeshBasicMaterial({map:win.room==="salon"?gardenWindowTexture:windowTexture}));glass.rotation.x=-Math.PI/2;glass.position.set(win.x,.61,win.z);scene.add(glass);});
    const mirror=sceneObjects.mirror;
    const mc=document.createElement("canvas");mc.width=128;mc.height=192;const mg=mc.getContext("2d")!;
    const grad=mg.createLinearGradient(0,0,128,192);mirror.gradient.forEach((color,i)=>grad.addColorStop(i/2,color));mg.fillStyle=grad;mg.fillRect(0,0,128,192);
    const mist=mg.createLinearGradient(0,0,128,0);mist.addColorStop(0,"#70808c00");mist.addColorStop(.5,"#b0b6bf90");mist.addColorStop(1,"#70808c00");mg.fillStyle=mist;mg.fillRect(5,5,118,182);mg.fillStyle="#ffffff65";mg.fillRect(9,12,2,158);
    const mt=new THREE.CanvasTexture(mc);mt.colorSpace=THREE.SRGBColorSpace;
    const frameMirror=mesh(mirror.w+.12,mirror.d+.12,.12,mirror.x,mirror.z,0x8999b3,.09);
    const mp=new THREE.Mesh(new THREE.PlaneGeometry(mirror.w,mirror.d),new THREE.MeshBasicMaterial({map:mt,side:THREE.DoubleSide,toneMapped:false}));mp.position.set(mirror.x,.09+(mirror.d+.12)/2,mirror.z+.075);scene.add(mp);frameMirror.rotation.y=mirror.angle;mp.rotation.y=mirror.angle;mp.position.x+=Math.sin(mirror.angle)*.075;
    mesh(mirror.w+.25,.06,.42,mirror.x,mirror.z,0x364358,.02);
    const speaker=sceneObjects.speaker;mesh(.45,.32,.5,speaker.x,speaker.z,0x162135,.12);for(const dz of [-.12,.12]){const grille=new THREE.Mesh(new THREE.CircleGeometry(.1,16),new THREE.MeshBasicMaterial({color:0x7b8da4}));grille.rotation.x=-Math.PI/2;grille.position.set(speaker.x,.46,speaker.z+dz);scene.add(grille);}
    const nc=document.createElement('canvas');nc.width=64;nc.height=64;const ng=nc.getContext('2d')!;ng.shadowColor='#e5e9ee';ng.shadowBlur=3;ng.fillStyle='#05070a';ng.font='bold 54px serif';ng.fillText('♪',12,48);const nt=new THREE.CanvasTexture(nc);const note=new THREE.Sprite(new THREE.SpriteMaterial({map:nt,transparent:true,depthTest:false}));note.scale.set(.65,.65,1);note.visible=false;scene.add(note);let noteFrame=-1;
    // Cheap painted pools of lamplight; no shadow maps or extra per-frame ray tracing.
    for(const [x,z] of [[-1.6,-4.25],[6.1,4.8],[-4.7,4.9]]){const glow=new THREE.Mesh(new THREE.CircleGeometry(.7,20),new THREE.MeshBasicMaterial({color:0xf1c38e,transparent:true,opacity:.12,depthWrite:false}));glow.rotation.x=-Math.PI/2;glow.position.set(x,.05,z);scene.add(glow);}
    // Bed pillow, kitchen hob, desk surface, window: readable from directly above.
    // Flat decorative surfaces do not affect routes or add expensive shadow passes.
    mesh(2.6,.02,1.8,-5,-3.5,0xc9b18c,.025);mesh(2.1,.02,1.3,4,-3.3,0xd2c8b5,.025);
    mesh(2.6,.02,2,-4.5,3.5,0xbda5a2,.025);mesh(2.6,.02,1.6,4.5,3.6,0xb6c2a6,.025);
    mesh(.55,.025,.4,4.2,3.2,0xeee5d9,.53);mesh(.38,.035,.5,4.8,3.2,0xc48da9,.54);mesh(1.2,.45,.35,6.3,4.8,0x778aa5,.25);
    mesh(2,.08,.7,-4,-5.25,0x26363f,.15);mesh(1.8,.02,.55,-4,-5.25,0x8bbcc4,.24);
    mesh(.55,.08,.55,2,-4.2,0xeee4cf,.46);mesh(.35,.12,.35,5,-5.3,0x596369,.67);
    mesh(2,.05,.65,-6,2.5,0xf7ead6,.42);mesh(.55,.03,.55,5,-5.3,0x31474e,.65);
    mesh(.9,.04,.5,5.5,4.8,0xb6dcdb,.55);mesh(2,.06,.15,-4,-5.9,0x71bfd5,.56);
    for(let i=0;i<5;i++){mesh(.44,.035,.19,6.7,1.7+i*.23,[0xbc718a,0x719ac4,0xe0ae73,0x8b7bc1,0x73a9ad][i],.74);}for(let i=0;i<3;i++)mesh(.35,.006,.018,4.2,3.1+i*.06,0x5c6f8d,.565);
    const tvCanvas=document.createElement("canvas");tvCanvas.width=128;tvCanvas.height=64;const tvTexture=new THREE.CanvasTexture(tvCanvas);const tvScreen=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.55),new THREE.MeshBasicMaterial({map:tvTexture}));tvScreen.rotation.x=-Math.PI/2;tvScreen.position.set(-4,.27,-5.25);scene.add(tvScreen);let tvOn=false,tvFrame=-1;
    const pc=document.createElement("canvas");pc.width=256;pc.height=128;const pt=new THREE.CanvasTexture(pc);const computer=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.6),new THREE.MeshBasicMaterial({map:pt}));computer.rotation.x=-Math.PI/2;computer.position.set(5.5,.61,4.8);scene.add(computer);let computerVerified=false,computerOn=false,computerActive=false,computerFrame=-1;
    proofUpdate.current=(ids,tv)=>{tvOn=tv;computerVerified=ids.has("screen");computerOn=computerVerified||computerActive;if(!tv){tvCanvas.getContext("2d")!.fillStyle="#02050a";tvCanvas.getContext("2d")!.fillRect(0,0,128,64);tvTexture.needsUpdate=true;tvFrame=-1;}dirty=true;};
    // Small geometric details are part of the game scene, not extra simulation obstacles.
    mesh(.58,.07,.75,-6.65,-4.5,0xb7658c,.52);mesh(.58,.07,.75,-5.4,-4.5,0x633b61,.52);mesh(2.2,.13,.18,-6,-4.95,0x643952,.53);mesh(.2,.06,.4,-6,-2.6,0x202639,.35);mesh(.08,.015,.08,-6,-2.7,0xd7bad3,.42);
    for(const x of [4.3,5.2])for(const z of [-5.1,-5.5]){const ring=new THREE.Mesh(new THREE.RingGeometry(.12,.16,20),new THREE.MeshBasicMaterial({color:0xa2bfd8,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(x,.71,z);scene.add(ring);}
    mesh(.8,.08,.55,-6.5,2.4,0xf0d8ea,.5);mesh(.8,.08,.55,-5.5,2.4,0xf0d8ea,.5);
    // Pots, chair backs, desk lamp and low decorative panels add depth without changing navigation.
    for(const [x,z] of [[7,-1.7],[-1.4,2.4],[6.8,4.9]]){mesh(.28,.18,.28,x,z,0xae7863,.08);const leaf=new THREE.Mesh(new THREE.ConeGeometry(.23,.32,7),new THREE.MeshStandardMaterial({color:0x355774,roughness:.9}));leaf.position.set(x,.43,z);scene.add(leaf);}mesh(.8,.08,.18,1.4,-4.2,0x513959,.4);mesh(.8,.08,.18,2.6,-4.2,0x513959,.4);mesh(.25,.05,.25,6.1,4.8,0xe2c19a,.64);mesh(.04,.26,.04,6.1,4.8,0x9a7b68,.7);mesh(.35,.08,.22,6.1,4.8,0xebc28a,.93);
    const plant=sceneObjects.plant;
    const pot=new THREE.Mesh(new THREE.CylinderGeometry(.32,.25,.4,16),new THREE.MeshStandardMaterial({color:0xb27d6e,roughness:.8}));pot.position.set(plant.x,.28,plant.z);scene.add(pot);const soil=new THREE.Mesh(new THREE.CircleGeometry(.29,16),new THREE.MeshStandardMaterial({color:0x292d36,side:THREE.DoubleSide}));soil.rotation.x=-Math.PI/2;soil.position.set(plant.x,.49,plant.z);scene.add(soil);const rim=new THREE.Mesh(new THREE.TorusGeometry(.3,.03,5,16),new THREE.MeshStandardMaterial({color:0xd09d86}));rim.rotation.x=Math.PI/2;rim.position.set(plant.x,.48,plant.z);scene.add(rim);mesh(.045,.65,.045,plant.x,plant.z,0x4b6172,.48);
    const blade=new THREE.Shape();blade.moveTo(0,0);blade.quadraticCurveTo(-.43,.25,-.3,.55);blade.quadraticCurveTo(-.15,.85,0,.92);blade.quadraticCurveTo(.42,.66,.31,.34);blade.quadraticCurveTo(.18,.1,0,0);
    const leafGeometry=new THREE.ShapeGeometry(blade,8),leafMaterial=new THREE.MeshStandardMaterial({color:plant.color,roughness:.7,side:THREE.DoubleSide});
    for(let i=0;i<plant.leaves;i++){const angle=i/plant.leaves*Math.PI*2,group=new THREE.Group();group.position.set(plant.x+Math.cos(angle)*.1,.68+(i%2)*.16,plant.z+Math.sin(angle)*.1);group.rotation.set(-1.05,angle,-.85);group.add(new THREE.Mesh(leafGeometry,leafMaterial));const vein=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,.006),new THREE.Vector3(0,.8,.006)]),new THREE.LineBasicMaterial({color:0x86a6a6}));group.add(vein);scene.add(group);}
    const sc=document.createElement('canvas');sc.width=64;sc.height=64;const sg=sc.getContext('2d')!;const shade=sg.createRadialGradient(32,32,4,32,32,32);shade.addColorStop(0,'#07102470');shade.addColorStop(1,'#07102400');sg.fillStyle=shade;sg.fillRect(0,0,64,64);const st=new THREE.CanvasTexture(sc);
    for(const [x,z,w,d] of [[plant.x,plant.z,1.2,1.2],[-6,-4.5,3,1.8],[-6,3.6,2.9,3.8],[5.5,4.8,4.2,1.4]]){const shadow=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:st,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(x,.035,z+.12);scene.add(shadow);}
    const reserves=new THREE.Group();scene.add(reserves);
    const can=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.3,12),new THREE.MeshStandardMaterial({color:0xb3c0ca,roughness:.4}));can.position.set(6.5,.85,-4.2);reserves.add(can);const band=new THREE.Mesh(new THREE.CylinderGeometry(.153,.153,.14,12),new THREE.MeshStandardMaterial({color:0xc77552}));band.position.copy(can.position);reserves.add(band);
    const bread=new THREE.Mesh(new THREE.CapsuleGeometry(.1,.42,3,8),new THREE.MeshStandardMaterial({color:0xd8a457,roughness:.9}));bread.rotation.z=Math.PI/2;bread.rotation.y=sceneObjects.bread.angle;bread.position.set(6.5,.77,-3.4);reserves.add(bread);
    for(const [x,z] of [[6.4,-2.6],[6.6,-2.75]]){const fruit=new THREE.Mesh(new THREE.SphereGeometry(.14,10,7),new THREE.MeshStandardMaterial({color:0xb96c52}));fruit.position.set(x,.8,z);reserves.add(fruit);}let mealStarted=0,lastFoodEvent="";
    // Une assiette par habitant, posée sur la table de cuisine, visible seulement pendant le repas.
    const plates=new Map<Person,THREE.Group>();
    for(const id of [1,2] as Person[]){
      const plate=new THREE.Group();
      const disc=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.025,20),new THREE.MeshStandardMaterial({color:0xe7e2d6,roughness:.5}));
      const food=new THREE.Mesh(new THREE.SphereGeometry(.08,10,7),new THREE.MeshStandardMaterial({color:id===1?0xb96c52:0xc9a24a,roughness:.8}));
      food.position.y=.05;food.scale.y=.55;
      plate.add(disc,food);
      plate.position.set(id===1?1.55:2.45,.475,-4.05);
      plate.visible=false;
      scene.add(plate);
      plates.set(id,plate);
    }
    const voiceWaves:THREE.Mesh<THREE.RingGeometry,THREE.MeshBasicMaterial>[]=[];for(const {x,z} of sceneSpeakers){for(let i=0;i<3;i++){const wave=new THREE.Mesh(new THREE.RingGeometry(.22,.25,24),new THREE.MeshBasicMaterial({color:0xc5deed,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));wave.rotation.x=-Math.PI/2;wave.position.set(x,.92,z);wave.userData.phase=i/3;scene.add(wave);voiceWaves.push(wave);}}
    for(let i=0;i<3;i++){const wave=new THREE.Mesh(new THREE.RingGeometry(.22,.25,24),new THREE.MeshBasicMaterial({color:0xc5deed,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));wave.rotation.x=-Math.PI/2;wave.position.set(-8.7,.7,-.9);wave.userData.phase=i/3;scene.add(wave);voiceWaves.push(wave);}
    const residents=new Map<Person,{target?:[number,number];group:THREE.Group;path:[number,number][];room:Room;snapshot:boolean;sleeping:boolean;eating:boolean;id:Person;face:THREE.Sprite;faceCanvas:HTMLCanvasElement;faceTexture:THREE.CanvasTexture;glyph:string;ring:THREE.Sprite;ringSpeed:number;heart:THREE.Sprite;inLove:boolean;heartPhase:number}>();
    ([1,2] as Person[]).forEach(id=>{
      const color=residentAppearance[id].color,group=new THREE.Group();const [x,z]=centers[id===1?"salon":"bureau"];group.position.set(x+(id===1?-.5:.5),0,z);scene.add(group);
      const faceCanvas=document.createElement("canvas");faceCanvas.width=160;faceCanvas.height=160;
      const faceTexture=new THREE.CanvasTexture(faceCanvas);
      const face=new THREE.Sprite(new THREE.SpriteMaterial({map:faceTexture,depthTest:false}));face.scale.set(1.02,1.02,1);face.position.set(group.position.x,1.35,group.position.z);face.userData.actor=id;scene.add(face);targets.push(face);
      const heartCanvas=document.createElement("canvas");heartCanvas.width=96;heartCanvas.height=96;const heartCtx=heartCanvas.getContext("2d")!;heartCtx.font='72px "Segoe UI Emoji",sans-serif';heartCtx.textAlign="center";heartCtx.textBaseline="middle";heartCtx.fillText("💕",48,48);
      const heart=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(heartCanvas),transparent:true,depthTest:false}));heart.scale.set(.8,.8,1);heart.visible=false;scene.add(heart);
      const rc=document.createElement("canvas");rc.width=128;rc.height=128;const rg=rc.getContext("2d")!;for(let j=0;j<64;j++){const a=j/64*Math.PI*2;rg.strokeStyle="#"+new THREE.Color(color).lerp(new THREE.Color(0xffffff),.05+.25*(.5+.5*Math.cos(a))).getHexString();rg.lineWidth=9;rg.beginPath();rg.arc(64,64,54,a,a+Math.PI*2/64+.02);rg.stroke();}rg.strokeStyle="rgba(255,255,255,.7)";rg.lineWidth=5;rg.lineCap="round";rg.beginPath();rg.arc(64,64,54,-.18,.18);rg.stroke();const rt=new THREE.CanvasTexture(rc);rt.colorSpace=THREE.SRGBColorSpace;const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:rt,transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));halo.scale.set(1.25,1.25,1);halo.position.copy(face.position);halo.userData.actor=id;scene.add(halo);targets.push(halo);
      group.traverse(obj=>{obj.userData.actor=id;if(obj instanceof THREE.Mesh)targets.push(obj);});
      residents.set(id,{group,path:[],room:id===1?"salon":"bureau",snapshot:false,sleeping:false,eating:false,id,face,faceCanvas,faceTexture,glyph:"",ring:halo,ringSpeed:.25,heart,inLove:false,heartPhase:-1});
    });
    let awaiting=false,lastRender=0;
    update.current=items=>{computerActive=items.some(a=>a.intent==="study"&&a.room==="bureau");computerOn=computerActive||computerVerified;dirty=true;items.forEach(agent=>{
      const r=residents.get(agent.id);if(!r)return;
      r.eating=agent.intent==="eat"&&agent.room==="cuisine";r.sleeping=["sleep","share_sleep"].includes(agent.intent);r.inLove=!r.sleeping&&isInLove(agent.emotions.attraction);r.ringSpeed=.15+(agent.needs.stress+agent.emotions.tension)/200*2.3;
      const glyph=smiley(agent);if(r.glyph!==glyph){r.glyph=glyph;const ctx=r.faceCanvas.getContext("2d")!;ctx.clearRect(0,0,160,160);ctx.font='112px "Segoe UI Emoji", sans-serif';ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(glyph,80,85);r.faceTexture.needsUpdate=true;}
      const destination:[number,number]=inspection.current>0?[inspection.current===1?-7:7,agent.id===1?-.25:.25]:residentDestination(agent);const [x,z]=destination;if(!r.snapshot&&agent.last_seen>0){r.snapshot=true;r.group.position.set(x,0,z);r.room=agent.room;r.target=destination;r.path=[];return;}if(r.target&&r.room===agent.room&&r.target[0]===x&&r.target[1]===z)return;
      if(r.room===agent.room&&Math.hypot(r.group.position.x-x,r.group.position.z-z)<.1)return;
      const path=pathBetween([r.group.position.x,r.group.position.z],destination,gardenState.current);
      if(path.length){r.path=path;r.room=agent.room;r.target=destination;}else{r.path=[];}
    });
    awaiting=true;
    if([...residents.values()].every(r=>!r.path.length)){awaiting=false;settled.current?.();}
    };
    const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;const aspect=w/h,halfY=Math.max(9.2,17.5/aspect);camera.left=-halfY*aspect;camera.right=halfY*aspect;camera.top=halfY;camera.bottom=-halfY;camera.updateProjectionMatrix();const scale=Math.max(1,26/(w/(camera.right-camera.left)));residents.forEach(r=>{r.face.scale.set(1.02*scale,1.02*scale,1);r.ring.scale.set(1.25*scale,1.25*scale,1)});dirty=true;renderer.setSize(w,h);};
    let yaw=0,panX:number=sceneView.target[0],panZ=0;const focusZoom=()=>{if(camera.zoom>1.45){const pair=[...residents.values()];const x=pair.reduce((n,r)=>n+r.group.position.x,0)/2,z=pair.reduce((n,r)=>n+r.group.position.z,0)/2;panX=THREE.MathUtils.clamp(x,-10,8);panZ=THREE.MathUtils.clamp(z,-5,5);}};const applyCamera=()=>{const [x,y,z]=sceneView.camera;camera.position.set(x*Math.cos(yaw)+z*Math.sin(yaw)+panX,y,z*Math.cos(yaw)-x*Math.sin(yaw)+panZ);camera.lookAt(panX,0,panZ);camera.updateProjectionMatrix();dirty=true;};
    cameraControl.current=action=>{if(action==='reset'){yaw=0;panX=sceneView.target[0];panZ=0;camera.zoom=1.16;}else if(action==='left'||action==='right')yaw=THREE.MathUtils.clamp(yaw+(action==='left'?-.08:.08),-.8,.8);else camera.zoom=THREE.MathUtils.clamp(camera.zoom+(action==='in'?.12:-.12),.65,2.6);focusZoom();applyCamera();};
    let drag:{x:number;y:number;button:number;shift:boolean;distance:number}|null=null;
    const cancelDrag=()=>{drag=null;};
    renderer.domElement.addEventListener("pointercancel",cancelDrag);
    const down=(e:PointerEvent)=>{drag={x:e.clientX,y:e.clientY,button:e.button,shift:e.shiftKey,distance:0};renderer.domElement.setPointerCapture(e.pointerId);};
    const move=(e:PointerEvent)=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.distance+=Math.hypot(dx,dy);drag.x=e.clientX;drag.y=e.clientY;if(drag.button===2||drag.button===1||drag.shift){panX=THREE.MathUtils.clamp(panX-dx*.015,-6,6);panZ=THREE.MathUtils.clamp(panZ-dy*.015,-6,6);}else yaw=THREE.MathUtils.clamp(yaw-dx*.004,-.8,.8);applyCamera();};
    const wheel=(e:WheelEvent)=>{e.preventDefault();camera.zoom=THREE.MathUtils.clamp(camera.zoom*Math.exp(-e.deltaY*.001),.65,2.6);focusZoom();applyCamera();};const menu=(e:Event)=>e.preventDefault();
    renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('wheel',wheel,{passive:false});renderer.domElement.addEventListener('contextmenu',menu);
    applyCamera();
    const observer=new ResizeObserver(resize);observer.observe(host);resize();
    const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
    const click=(event:PointerEvent)=>{const moved=drag&&drag.distance>5;drag=null;if(moved||event.button!==0)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(targets)[0];if(hit)select.current(hit.object.userData.actor as Person);else{const roomHit=ray.intersectObjects(roomTargets)[0];if(roomHit)roomSelect.current?.(roomHit.object.userData.room as Room);};};
    renderer.domElement.addEventListener("pointerup",click);
    const lost=(event:Event)=>{event.preventDefault();settled.current?.();update.current=()=>settled.current?.();setError("L’affichage a été interrompu. Recharge la page pour le rétablir.");};renderer.domElement.addEventListener("webglcontextlost",lost);
    let heat=0;const hob=new THREE.Mesh(new THREE.RingGeometry(.15,.2,24),new THREE.MeshBasicMaterial({color:0xffcb65,side:THREE.DoubleSide}));hob.rotation.x=-Math.PI/2;hob.position.set(4.3,.73,-5.1);scene.add(hob);let frame=0,previous=performance.now(),visualTime=previous,lastWall=previous;const animate=(wallTime:number)=>{const elapsed=Math.min(100,Math.max(0,wallTime-lastWall));lastWall=wallTime;if(document.visibilityState==="visible"&&!scenePaused.current)visualTime+=elapsed;const time=visualTime;
      frame=requestAnimationFrame(animate);
      const cookingNow=cooking.current&&[...residents.values()].some(r=>r.eating&&!r.path.length);const foodEvent=eventRef.current.find(e=>e.kind==="food");if(foodEvent&&foodEvent.id!==lastFoodEvent){lastFoodEvent=foodEvent.id;mealStarted=time;reserves.visible=false;dirty=true;}if(!reserves.visible&&time-mealStarted>=visualTiming.regeneration){reserves.visible=true;dirty=true;}if(mealStarted){const t=time-mealStarted-visualTiming.regeneration,alpha=t>=0&&t<1600?.4+.6*(.5+.5*Math.cos(t/800*Math.PI)):1;reserves.traverse(o=>{if(o instanceof THREE.Mesh){const material=o.material as THREE.MeshStandardMaterial;material.transparent=true;material.opacity=alpha;material.emissive.set(0xa9bfd4);material.emissiveIntensity=.35*(1-alpha);}});if(t>=0&&t<1700)dirty=true;if(t>=1700){mealStarted=0;dirty=true;}}
      voiceWaves.forEach(w=>{if(humanVoice.current){const p=(time/1500+w.userData.phase)%1;w.scale.setScalar(1+p*2);w.material.opacity=(1-p)*.85;dirty=true;}else if(w.material.opacity){w.material.opacity=0;dirty=true;}});
      const target=cookingNow?1:0;if(Math.abs(heat-target)>.01){heat+=(target-heat)*.025;hob.material.color.setRGB(1,.8-.6*heat,.4-.3*heat);hob.scale.setScalar(1+heat*.5);dirty=true;}
      const nf=Math.floor(time/400)%6;if((speakerActive.current||eventRef.current.some(e=>e.kind==="speaker"))&&document.visibilityState==="visible"&&nf!==noteFrame){noteFrame=nf;note.visible=true;note.position.set(speaker.x+.3,1.2+nf*.08,speaker.z-.25-nf*.06);note.material.opacity=1-nf*.12;dirty=true;}else if(!(speakerActive.current||eventRef.current.some(e=>e.kind==="speaker"))&&note.visible){note.visible=false;dirty=true;}
      const tvEvent=eventRef.current.find(e=>e.kind==="tv");if(tvEvent&&tvOn!==tvEvent.on){tvOn=Boolean(tvEvent.on);if(!tvOn){tvCanvas.getContext("2d")!.clearRect(0,0,128,64);tvTexture.needsUpdate=true;}dirty=true;}
      if(tvOn&&document.visibilityState==="visible"){const f=Math.floor(time/350);if(f!==tvFrame){tvFrame=f;const g=tvCanvas.getContext("2d")!;g.fillStyle="#0b1624";g.fillRect(0,0,128,64);g.strokeStyle="#7fb8c6";g.lineWidth=1;g.strokeRect(10,9,108,45);g.beginPath();g.moveTo(12,32);for(let x=12;x<116;x++)g.lineTo(x,32+Math.sin(x*.13+f)*8);g.stroke();g.fillStyle="#cfb4cb";g.font="9px monospace";g.fillText("SESSION / "+(f%4),15,20);tvTexture.needsUpdate=true;dirty=true;}}
      if(computerOn&&document.visibilityState==="visible"){const f=Math.floor(time/350);if(f!==computerFrame){computerFrame=f;const g=pc.getContext("2d")!;const bg=g.createLinearGradient(0,0,256,128);bg.addColorStop(0,"#111b32");bg.addColorStop(1,"#243658");g.fillStyle=bg;g.fillRect(0,0,256,128);g.fillStyle="#a8dcec";g.font="bold 12px monospace";g.fillText("OBS / SESSION",12,16);for(let row=0;row<6;row++){const active=row===f%6;g.fillStyle=active?"#e6f4ff":"#8faac9";g.font=active?"bold 12px monospace":"11px monospace";g.fillText(((f+row)%2?"01 10 01 11 00 10 01":"10 00 11 01 10 01 00"),12,36+row*16);if(active){g.fillStyle="#ffbf7f";g.fillRect(236,26+row*16,7,10);}}g.fillStyle="#c5e4f426";g.fillRect(0,(f*9)%128,256,8);pt.needsUpdate=true;dirty=true;}}

      const dt=Math.min((time-previous)/1000,.05);previous=time;
      if([...residents.values()].some(r=>r.path.length))dirty=true;
      residents.forEach(r=>{const plate=plates.get(r.id);if(plate){const showPlate=r.eating&&!r.path.length;if(plate.visible!==showPlate){plate.visible=showPlate;dirty=true;}}if(!reducedMotion.matches&&dt>0){const speakingBoost=speakingRef.current.includes(r.id)?2.4:1;const sincePulse=time-evidencePulse.current;const pulseBoost=sincePulse>=0&&sincePulse<2600?1+2*(1-sincePulse/2600):1;r.ring.material.rotation+=dt*r.ringSpeed*speakingBoost*pulseBoost;dirty=true;}const phase=Math.floor((time+r.id*2300)/250)%40;const show=r.inLove&&phase<8;
      if(phase!==r.heartPhase&&(show||r.heart.visible)){r.heartPhase=phase;r.heart.visible=show;r.heart.position.set(r.group.position.x+(r.id===1?-.8:.8),1.5,r.group.position.z-.7-phase*.025);r.heart.material.opacity=Math.max(0,1-phase/9);dirty=true;}
      const resting=r.sleeping&&["salon","chambre"].includes(r.room)&&!r.path.length;const pose=restingPose(r.id,r.room);r.face.position.set(resting?pose.x:r.group.position.x,resting?pose.y:1.35,resting?pose.z:r.group.position.z);r.ring.position.copy(r.face.position);const b=bubbleNodes.current.get(r.id);if(b){const v=r.face.position.clone().project(camera);const w=host.clientWidth,h=host.clientHeight;b.style.left=Math.min(w-46,Math.max(6,(v.x*.5+.5)*w+(r.id===1?-48:20)))+"px";b.style.top=Math.min(h-28,Math.max(4,(-v.y*.5+.5)*h-25))+"px";}const step=r.path[0];if(step){const dx=step[0]-r.group.position.x,dz=step[1]-r.group.position.z,distance=Math.hypot(dx,dz);if(distance<.03)r.path.shift();else{const speed=Math.min(distance,dt*2.2);r.group.position.x+=dx/distance*speed;r.group.position.z+=dz/distance*speed;r.group.rotation.y=Math.atan2(dx,dz);}}});
      const pair=[...residents.values()];
      if(pair.every(r=>!r.path.length)){
        if(pair[0].room===pair[1].room)pair.forEach((r,i)=>{const other=pair[1-i];r.group.rotation.y=Math.atan2(other.group.position.x-r.group.position.x,other.group.position.z-r.group.position.z);});
        if(awaiting){awaiting=false;settled.current?.();}
      }
      if(document.visibilityState==="visible"&&dirty&&wallTime-lastRender>=33){renderer.render(scene,camera);dirty=false;lastRender=wallTime;}
    };frame=requestAnimationFrame(animate);
    return()=>{cameraControl.current=()=>{};cancelAnimationFrame(frame);observer.disconnect();update.current=()=>{};renderer.domElement.removeEventListener("pointercancel",cancelDrag);renderer.domElement.removeEventListener("pointerdown",down);renderer.domElement.removeEventListener("pointermove",move);renderer.domElement.removeEventListener("wheel",wheel);renderer.domElement.removeEventListener("contextmenu",menu);renderer.domElement.removeEventListener("pointerup",click);renderer.domElement.removeEventListener("webglcontextlost",lost);scene.traverse(obj=>{if(obj instanceof THREE.Mesh){obj.geometry.dispose();const materials=Array.isArray(obj.material)?obj.material:[obj.material];materials.forEach(m=>{if("map" in m && m.map instanceof THREE.Texture)m.map.dispose();m.dispose();});}});scene.traverse(o=>{if(o instanceof THREE.LineSegments){o.geometry.dispose();(o.material as THREE.Material).dispose();}});proofUpdate.current=()=>{};residents.forEach(r=>{r.ring.material.map?.dispose();r.ring.material.dispose();r.faceTexture.dispose();r.face.material.dispose();r.heart.material.map?.dispose();r.heart.material.dispose()});nt.dispose();note.material.dispose();illumination.current=()=>{};renderer.dispose();renderer.domElement.remove();};
  },[]);
  useEffect(()=>{mealStamp.current=agents.filter(a=>a.intent==="eat"&&a.room==="cuisine").map(a=>a.id+":"+a.cycle).join("|");inspection.current=inspectionStep;update.current(agents)},[agents,inspectionStep]);
  useEffect(()=>{illumination.current(night)},[night]);
  useEffect(()=>{speakerActive.current=speakerOn},[speakerOn]);
  const ledger=evidenceLedger(evidence,observations,tvSeen,{ambientVerified:speakerOn,mirrorVerified:mirrorSeen,foodVerified:foodSeen});
  useEffect(()=>{proofUpdate.current(new Set(evidenceLedger(evidence,observations,tvSeen).filter(p=>p.discovered).map(p=>p.id)),tvOn??tvSeen)},[evidence,observations,tvSeen,tvOn]);
  return <div className={`house-view ${night?"night":""}`}><div ref={mount} className="scene" aria-label="Maison en perspective 3D : quatre pièces, jardin verrouillable, Lia et Noé"/><div className="camera-controls" aria-label="Point de vue"><button aria-label="Tourner à gauche" onClick={()=>cameraControl.current("left")}>↶</button><button aria-label="Réduire le zoom" onClick={()=>cameraControl.current("out")}>−</button><button aria-label="Rétablir le point de vue" onClick={()=>cameraControl.current("reset")}>◈</button><button aria-label="Augmenter le zoom" onClick={()=>cameraControl.current("in")}>+</button><button aria-label="Tourner à droite" onClick={()=>cameraControl.current("right")}>↷</button></div>{error&&<p role="alert" className="view-error">{error}</p>}{thinking&&<div className="speech-bubbles" aria-hidden="true">{agents.filter(a=>speaking.includes(a.id)&&!["sleep","share_sleep"].includes(a.intent)).map(a=><span key={a.id} className={`speech-bubble ${a.id===1?"lia":"noe"}`} ref={node=>{if(node)bubbleNodes.current.set(a.id,node);else bubbleNodes.current.delete(a.id);}}><i/><i/><i/></span>)}</div>}<div className="map-key"><span className="lia-key">◉ Lia</span><span className="noe-key">◉ Noé</span><span>Clique sur un personnage</span><div className="proof-ledger">{ledger.map(p=><span key={p.id} className={p.discovered?"proof-found":"proof-hidden"} title={`${p.label} · ${p.discovered?"découvert":"non découvert"}`}><b>{p.icon}</b> {p.label}</span>)}</div></div></div>;
}
