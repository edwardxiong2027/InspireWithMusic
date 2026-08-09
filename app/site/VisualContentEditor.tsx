"use client";
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { firebaseApi } from "@/lib/firebase";
import type { ContentEntry } from "@/lib/types";
import { defaultPrograms } from "@/lib/content-defaults";

type MediaAsset = { id:string; filename:string; public_url:string; alt_text:string };
type EditableProgram = { number:string; slug:string; title:string; text:string; description:string; impact:string; image:string; gallery:string[] };
type Viewport = "desktop" | "mobile";

const pageOrder = ["Homepage","About","Volunteers","Programs","Stories","Impact","Join","Donate","Global","Footer"];
const pageRoutes:Record<string,string> = {Homepage:"home",About:"about",Volunteers:"volunteers",Programs:"programs",Stories:"stories",Impact:"impact",Join:"join",Donate:"donate",Global:"home",Footer:"home"};

function ImagePicker({value,assets,label,onChange,onUpload}:{value:string;assets:MediaAsset[];label:string;onChange:(value:string)=>void;onUpload:(file:File,label:string)=>Promise<string>}){
  const [uploading,setUploading]=useState(false);
  async function upload(event:ChangeEvent<HTMLInputElement>){const file=event.target.files?.[0];if(!file)return;setUploading(true);try{onChange(await onUpload(file,label))}finally{setUploading(false);event.target.value=""}}
  return <div className="visual-image-picker">
    <div className="visual-current-image">{value?<img src={value} alt="Current selection"/>:<span>No image selected</span>}</div>
    <label className="visual-upload-button">{uploading?"Uploading…":"Upload a new image"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={upload}/></label>
    <details><summary>Or choose from Media Library</summary><div className="visual-asset-grid">{assets.map(asset=><button type="button" key={asset.id} className={asset.public_url===value?"selected":""} onClick={()=>onChange(asset.public_url)}><img src={asset.public_url} alt={asset.alt_text||asset.filename}/><span>{asset.filename}</span></button>)}{!assets.length&&<p>No uploaded images yet.</p>}</div></details>
    <label className="visual-url-field">Image URL<input type="url" value={value} onChange={event=>onChange(event.target.value)} placeholder="https://…"/></label>
  </div>
}

function ProgramsInspector({value,assets,onChange,onUpload}:{value:string;assets:MediaAsset[];onChange:(value:string)=>void;onUpload:(file:File,label:string)=>Promise<string>}){
  let programs:EditableProgram[];try{programs=JSON.parse(value) as EditableProgram[]}catch{programs=defaultPrograms}
  const [selected,setSelected]=useState(0);const active=programs[Math.min(selected,Math.max(0,programs.length-1))];
  function commit(next:EditableProgram[]){onChange(JSON.stringify(next))}
  function update(change:Partial<EditableProgram>){commit(programs.map((program,index)=>index===selected?{...program,...change}:program))}
  function add(){const next=[...programs,{number:String(programs.length+1).padStart(2,"0"),slug:`new-program-${programs.length+1}`,title:"New Program",text:"Short program summary.",description:"Describe what volunteers do and who the program serves.",impact:"Explain the difference this program makes.",image:"",gallery:[]}];commit(next);setSelected(next.length-1)}
  if(!active)return <button className="button ink" type="button" onClick={add}>Add first program</button>;
  return <div className="visual-programs">
    <div className="visual-program-tabs">{programs.map((program,index)=><button type="button" key={`${program.slug}-${index}`} className={selected===index?"selected":""} onClick={()=>setSelected(index)}>{program.number} · {program.title}</button>)}<button type="button" onClick={add}>+ Add</button></div>
    <div className="two-fields"><label>Number<input value={active.number} onChange={event=>update({number:event.target.value})}/></label><label>URL name<input value={active.slug} onChange={event=>update({slug:event.target.value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")})}/></label></div>
    <label>Program title<input value={active.title} onChange={event=>update({title:event.target.value})}/></label>
    <label>Card summary<textarea value={active.text} onChange={event=>update({text:event.target.value})}/></label>
    <label>Full description<textarea value={active.description} onChange={event=>update({description:event.target.value})}/></label>
    <label>Impact statement<textarea value={active.impact} onChange={event=>update({impact:event.target.value})}/></label>
    <label className="visual-field-label">Main image</label><ImagePicker value={active.image} assets={assets} label={`${active.title} main image`} onChange={image=>update({image})} onUpload={onUpload}/>
    <label>Gallery image URLs · one per line<textarea value={(active.gallery??[]).join("\n")} onChange={event=>update({gallery:event.target.value.split("\n").map(item=>item.trim()).filter(Boolean)})}/></label>
    <button type="button" className="danger-link visual-remove-program" onClick={()=>{if(confirm(`Remove ${active.title}?`)){commit(programs.filter((_,index)=>index!==selected));setSelected(Math.max(0,selected-1))}}}>Remove this program</button>
  </div>
}

export function VisualContentEditor(){
  const [entries,setEntries]=useState<ContentEntry[]>([]);const [assets,setAssets]=useState<MediaAsset[]>([]);const [page,setPage]=useState("Homepage");const [selectedKey,setSelectedKey]=useState("");const [dirty,setDirty]=useState<Set<string>>(new Set());const [message,setMessage]=useState("");const [saving,setSaving]=useState(false);const [viewport,setViewport]=useState<Viewport>("desktop");const iframe=useRef<HTMLIFrameElement>(null);
  const load=useCallback(async()=>{const [content,media]=await Promise.all([firebaseApi<{entries:ContentEntry[]}>("/api/content"),firebaseApi<{assets:MediaAsset[]}>("/api/media")]);setEntries(content.entries);setAssets(media.assets)},[]);
  useEffect(()=>{load().catch(error=>setMessage(error instanceof Error?error.message:"Unable to load the visual editor"))},[load]);
  const pages=useMemo(()=>pageOrder.filter(name=>entries.some(entry=>entry.page===name)),[entries]);
  const pageEntries=useMemo(()=>entries.filter(entry=>entry.page===page),[entries,page]);
  const selected=entries.find(entry=>entry.key===selectedKey)??pageEntries[0];
  const draft=useMemo(()=>Object.fromEntries(entries.map(entry=>[entry.key,entry.value])),[entries]);
  const previewUrl=`/?cmsPreview=1#/${pageRoutes[page]??"home"}`;
  const sendDraft=useCallback(()=>iframe.current?.contentWindow?.postMessage({type:"IWM_CMS_DRAFT",content:draft},window.location.origin),[draft]);
  useEffect(()=>{sendDraft()},[sendDraft]);
  useEffect(()=>{function receive(event:MessageEvent){if(event.origin!==window.location.origin)return;if(event.data?.type==="IWM_CMS_SELECT"&&typeof event.data.key==="string"){const found=entries.find(entry=>entry.key===event.data.key);if(found){setPage(found.page);setSelectedKey(found.key)}}if(event.data?.type==="IWM_CMS_READY")sendDraft()}window.addEventListener("message",receive);return()=>window.removeEventListener("message",receive)},[entries,sendDraft]);
  useEffect(()=>{if(!pageEntries.some(entry=>entry.key===selectedKey))setSelectedKey(pageEntries[0]?.key??"")},[page,pageEntries,selectedKey]);
  function change(key:string,value:string){setEntries(current=>current.map(entry=>entry.key===key?{...entry,value}:entry));setDirty(current=>new Set(current).add(key));setMessage("")}
  async function upload(file:File,label:string){const form=new FormData();form.set("file",file);form.set("altText",label);const result=await firebaseApi<{id:string;public_url:string}>("/api/media",{method:"POST",body:form});const asset={id:result.id,public_url:result.public_url,filename:file.name,alt_text:label};setAssets(current=>[asset,...current]);return result.public_url}
  async function publish(){setSaving(true);setMessage("");try{await firebaseApi("/api/content",{method:"PUT",body:JSON.stringify({entries:pageEntries.map(({key,value})=>({key,value}))})});setDirty(current=>{const next=new Set(current);pageEntries.forEach(entry=>next.delete(entry.key));return next});setMessage(`${page} published successfully.`)}catch(error){setMessage(error instanceof Error?error.message:"Unable to publish changes")}finally{setSaving(false)}}
  const pageDirty=pageEntries.some(entry=>dirty.has(entry.key));
  return <div className="visual-editor">
    <div className="visual-editor-toolbar"><div><p>VISUAL WEBSITE EDITOR</p><h2>Edit the page you can see.</h2><span>Click highlighted text or images in the preview, make your change, then publish.</span></div><div className="visual-toolbar-actions"><div className="visual-viewport" aria-label="Preview size"><button className={viewport==="desktop"?"selected":""} onClick={()=>setViewport("desktop")}>Desktop</button><button className={viewport==="mobile"?"selected":""} onClick={()=>setViewport("mobile")}>Mobile</button></div><button className="button coral" disabled={!pageDirty||saving} onClick={publish}>{saving?"Publishing…":pageDirty?`Publish ${page}`:"Published"}</button></div></div>
    {message&&<div className="form-notice success">{message}</div>}
    <div className="visual-page-tabs">{pages.map(name=><button key={name} className={page===name?"selected":""} onClick={()=>{setPage(name);setMessage("")}}>{name}{entries.some(entry=>entry.page===name&&dirty.has(entry.key))&&<i/>}</button>)}</div>
    <div className="visual-editor-workspace">
      <section className={`visual-preview visual-preview-${viewport}`}><div className="visual-preview-label"><span>LIVE PREVIEW</span><a href={`/#/${pageRoutes[page]??"home"}`} target="_blank" rel="noreferrer">Open public page ↗</a></div><div className="visual-preview-frame"><iframe ref={iframe} src={previewUrl} title={`${page} visual preview`} onLoad={sendDraft}/></div></section>
      <aside className="visual-inspector"><p>EDITING</p><h3>{selected?.label??"Choose something in the preview"}</h3>{selected&&<><small>{selected.key}</small>{selected.field_type==="programs"?<ProgramsInspector value={selected.value} assets={assets} onChange={value=>change(selected.key,value)} onUpload={upload}/>:selected.field_type==="image"?<ImagePicker value={selected.value} assets={assets} label={selected.label} onChange={value=>change(selected.key,value)} onUpload={upload}/>:<label className="visual-edit-control">{selected.field_type==="textarea"?<textarea value={selected.value} onChange={event=>change(selected.key,event.target.value)}/>:<input type={["email","url","number"].includes(selected.field_type)?selected.field_type:"text"} value={selected.value} onChange={event=>change(selected.key,event.target.value)}/>}</label>}</>}
        <details className="visual-field-list"><summary>All fields on this page</summary>{pageEntries.map(entry=><button type="button" className={selected?.key===entry.key?"selected":""} key={entry.key} onClick={()=>setSelectedKey(entry.key)}><span>{entry.field_type==="image"?"▧":"T"}</span>{entry.label}{dirty.has(entry.key)&&<i/>}</button>)}</details>
      </aside>
    </div>
  </div>
}
