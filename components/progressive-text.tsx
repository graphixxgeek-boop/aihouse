"use client";
import {useEffect,useRef,useState} from "react";
/** Only this small component redraws while typing: the composer keeps its focus. */
export function ProgressiveText({text,active,paused,onComplete}:{text:string;active:boolean;paused:boolean;onComplete:()=>void}){
 const glyphs=Array.from(text),[count,setCount]=useState(active?0:glyphs.length),done=useRef(onComplete),surface=useRef<HTMLSpanElement>(null);
 done.current=onComplete;
 useEffect(()=>{setCount(active?0:Array.from(text).length)},[active,text]);
 useEffect(()=>{if(!active||paused)return;const letters=Array.from(text),batch=1;const timer=setInterval(()=>setCount(n=>Math.min(letters.length,n+batch)),24);return()=>clearInterval(timer)},[active,paused,text]);
 useEffect(()=>{if(active&&count>=glyphs.length)done.current()},[active,count,glyphs.length]);
 useEffect(()=>{const feed=surface.current?.closest(".conversation-feed");if(feed&&feed.scrollHeight-feed.scrollTop-feed.clientHeight<80)feed.scrollTop=feed.scrollHeight},[count]);
 if(!active)return <>{text}</>;
 return <><span ref={surface} aria-hidden="true">{glyphs.slice(0,count).join('')}<span className={paused?"type-cursor paused":"type-cursor"}/></span><span className="sr-only">{text}</span></>;
}
