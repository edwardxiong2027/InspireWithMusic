"use client";
/* eslint-disable @next/next/no-img-element */

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { leaders, officialImages, stories } from "./content";
import { AdminPortal, LoginApp, MemberPortal } from "./Portals";
import { defaultPrograms } from "@/lib/content-defaults";
import { getPublicContent, getPublicStories, submitContact, subscribeNewsletter } from "@/lib/firebase";

type Route = "home" | "about" | "volunteers" | "programs" | "stories" | "impact" | "join" | "donate" | "login" | "portal" | "admin";
type CmsMap = Record<string,string>;
const CmsContext=createContext<CmsMap>({});
function useCms(){const content=useContext(CmsContext);return {text:(key:string,fallback:string)=>content[key]||fallback,number:(key:string,fallback:number)=>Number(content[key]||fallback),json:<T,>(key:string,fallback:T):T=>{try{return content[key]?JSON.parse(content[key]) as T:fallback}catch{return fallback}}}}
function CmsProvider({children}:{children:React.ReactNode}){const [content,setContent]=useState<CmsMap>({});useEffect(()=>{getPublicContent().then(setContent).catch(()=>{})},[]);return <CmsContext.Provider value={content}>{children}</CmsContext.Provider>}

const nav: { label: string; route: Route }[] = [
  { label: "Home", route: "home" }, { label: "About", route: "about" },
  { label: "Volunteers", route: "volunteers" }, { label: "Programs", route: "programs" },
  { label: "Stories", route: "stories" }, { label: "Impact", route: "impact" },
  { label: "Join", route: "join" },
];

function routeFromHash(): Route {
  if (typeof window === "undefined") return "home";
  const value = window.location.hash.replace(/^#\/?/, "").split("/")[0];
  return (["home", "about", "volunteers", "programs", "stories", "impact", "join", "donate", "login", "portal", "admin"] as Route[]).includes(value as Route) ? value as Route : "home";
}

function go(route: Route) {
  window.location.hash = route === "home" ? "#/" : `#/${route}`;
}
function goProgram(slug:string){window.location.hash=`#/programs/${slug}`}

function Logo({ inverse = false }: { inverse?: boolean }) {
  return <button className={`logo ${inverse ? "logo-inverse" : ""}`} onClick={() => go("home")} aria-label="Inspire With Music home">
    <span className="logo-mark" aria-hidden="true"><i /><i /><i /><i /></span>
    <span><b>INSPIRE</b><em>WITH MUSIC</em></span>
  </button>;
}

function Arrow({ diagonal = false }: { diagonal?: boolean }) { return <span aria-hidden="true">{diagonal ? "↗" : "→"}</span>; }

function Header({ route }: { route: Route }) {
  const [open, setOpen] = useState(false);
  return <header className="site-header">
    <Logo />
    <nav id="primary-navigation" className={open ? "nav-open" : ""} aria-label="Primary navigation">
      {nav.map(item => <button key={item.route} className={route === item.route ? "active" : ""} onClick={() => { go(item.route); setOpen(false); }}>{item.label}</button>)}
      <button className="mobile-login-link" onClick={() => { go("login"); setOpen(false); }}>Member login</button>
    </nav>
    <div className="header-actions">
      <button className="login-link" onClick={() => go("login")}>Member login</button>
      <button className="donate-nav" onClick={() => go("donate")}>Donate <Arrow diagonal /></button>
    </div>
    <button className="menu-button" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="primary-navigation"><span/><span/></button>
  </header>;
}

function Footer() {
  const {text}=useCms();
  return <footer>
    <div className="footer-top">
      <div><Logo inverse /><p>Music in action.<br/>Youth in service.</p></div>
      <div className="footer-links"><span>EXPLORE</span>{nav.slice(1).map(item => <button onClick={() => go(item.route)} key={item.route}>{item.label}</button>)}</div>
      <div className="footer-links"><span>CONNECT</span><a href={`mailto:${text("footer.contact_email","hello@inspirewithmusic.org")}`}>Email us</a><a href={text("footer.instagram_url","#")}>Instagram</a><a href={text("footer.youtube_url","#")}>YouTube</a><button onClick={() => go("login")}>Member portal</button></div>
      <div className="footer-note"><span>STAY IN THE LOOP</span><p>Stories, events, and new ways to make a difference—delivered with rhythm.</p><NewsletterForm/></div>
    </div>
    <div className="footer-bottom"><span>© 2026 Inspire With Music</span><span>Ivy Chamber Strings is a 501(c)(3) nonprofit organization.</span><button onClick={() => go("admin")}>Admin</button></div>
  </footer>;
}
function NewsletterForm(){const [email,setEmail]=useState("");const [done,setDone]=useState(false);async function submit(e:React.FormEvent){e.preventDefault();try{await subscribeNewsletter(email);setDone(true);setEmail("")}catch{setDone(false)}}return <form className="email-field" onSubmit={submit}>{done?<span>Thank you for joining.</span>:<><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} aria-label="Email address" placeholder="Email address"/><button aria-label="Subscribe">→</button></>}</form>}

function SectionHeading({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  return <div className="section-heading"><div><p className="eyebrow"><span>♪</span>{eyebrow}</p><h2>{title}</h2></div>{action && <button className="text-link" onClick={onAction}>{action} <Arrow /></button>}</div>;
}

function Home() {
  const {text,number,json}=useCms();
  const cmsLeaders=json("home.leaders_json",leaders);
  const storyTimeline=json<Array<{title:string;label:string}>>("home.story_timeline_json",[{title:"2019",label:"IT BEGINS"},{title:"EARLY YEARS",label:"SERVING OUR COMMUNITY"},{title:"GROWING",label:"YOUTH-LED IMPACT"},{title:"TODAY",label:"MUSIC BEYOND BORDERS"}]);
  const services=json<Array<{title:string;text:string;icon:string}>>("home.services_json",[["PERFORM", "Bringing music into our communities.", "♩"], ["TEACH", "Sharing music through lessons and workshops.", "♫"], ["MENTOR", "Helping young musicians learn and grow.", "♬"], ["SERVE", "Giving back through music and community projects.", "♪"]].map(x=>({title:x[0],text:x[1],icon:x[2]})));
  const cmsPrograms=json("programs.items_json",defaultPrograms);
  const servicePrograms=["community-performances","free-music-workshops","youth-mentorship","music-exchange"];
  return <>
    <section className="hero">
      <img src={text("home.hero_image",officialImages.hero)} alt="Youth string orchestra performing on stage" />
      <div className="hero-shade"/><div className="hero-score" aria-hidden="true"><i/><i/><i/><i/><i/></div>
      <div className="hero-content"><p className="hero-kicker">{text("home.hero_eyebrow","YOUTH-LED · MUSIC-DRIVEN · COMMUNITY-FOCUSED")}</p><h1>{text("home.hero_title","Music in Action. Youth in Service.")}</h1><p className="hero-copy">{text("home.hero_text","Empowering young musicians to share their talents, serve their communities, and make a difference through music.")}</p><div className="hero-actions"><button className="button coral" onClick={() => go("join")}>Join as a volunteer <Arrow /></button><button className="button glass" onClick={() => go("impact")}>Explore our impact <Arrow /></button></div></div>
      <div className="hero-side"><span>SCROLL TO DISCOVER</span><i/></div>
      <div className="hero-caption"><b>LIVE</b><span>Community performance<br/>Orange County, CA</span></div>
    </section>

    <section className="intro-section section-pad">
      <div className="giant-note" aria-hidden="true">♪</div>
      <p className="eyebrow"><span>01</span> WHO WE ARE</p>
      <div className="intro-grid"><h2>{text("home.who_title","We turn a passion for music into meaningful service.")}</h2><div><p>{text("home.who_body","Ivy Chamber Strings is a youth-led nonprofit creating opportunities for young people to lead, connect, and make a difference through performance, education, mentorship, and community outreach.")}</p><button className="circle-link" onClick={() => go("about")} aria-label="About our mission"><Arrow diagonal /></button></div></div>
      <div className="value-strip"><span>YOUTH-LED</span><i>✦</i><span>MUSIC-DRIVEN</span><i>✦</i><span>COMMUNITY-FOCUSED</span></div>
    </section>

    <section className="leaders-section section-pad">
      <SectionHeading eyebrow="02 · MEET OUR YOUTH LEADERS" title="Young musicians. Big hearts. Shared purpose." action="Meet the full team" onAction={() => go("volunteers")}/>
      <div className="leader-grid">{cmsLeaders.map((leader, i) => <article className={`leader-card leader-${i + 1}`} key={leader.name}><div className="leader-image"><img src={leader.image} alt={leader.name}/><span>0{i + 1}</span></div><h3>{leader.name}</h3><p>{leader.role}</p></article>)}</div>
    </section>

    <section className="what-section section-pad">
      <SectionHeading eyebrow="03 · WHAT WE DO" title="Turning music talent into meaningful service."/>
      <div className="what-grid interactive-programs">{services.map((item, i) => <article key={item.title} role="link" tabIndex={0} onClick={()=>goProgram(servicePrograms[i])} onKeyDown={event=>{if(event.key==="Enter"||event.key===" ")goProgram(servicePrograms[i])}}><div><span>0{i + 1}</span><b>{item.icon}</b></div><h3>{item.title}</h3><p>{item.text}</p><span className="program-card-link">Explore program →</span></article>)}</div>
    </section>

    <section className="story-section">
      <div className="story-image"><img src={officialImages.travel} alt="Youth musicians on a service journey"/><span className="vertical-label">OUR STORY · SINCE 2019</span></div>
      <div className="story-copy"><p className="eyebrow"><span>04</span> OUR STORY</p><h2>{text("home.story_title","Every note has led us here.")}</h2><p>{text("home.story_body","From serving our local communities to connecting with audiences around the world, our journey has been shaped by music, service, and a growing community of young musicians.")}</p><div className="timeline">{storyTimeline.map((item,index)=><div className={index===storyTimeline.length-1?"now":""} key={`${item.title}-${index}`}><b>{item.title}</b><span>{item.label}</span></div>)}</div><button className="button ink" onClick={() => go("about")}>Follow our journey <Arrow /></button></div>
    </section>

    <section className="impact-section section-pad">
      <div className="impact-lead"><p className="eyebrow light"><span>05</span> IMPACT IN NUMBERS</p><h2>{text("home.impact_title","A growing community.")}<br/><em>{text("home.impact_accent","A lasting echo.")}</em></h2><p>{text("home.impact_body","Behind every number is a story of young musicians sharing their time, talent, and love of music with the community.")}</p></div>
      <div className="numbers-grid">{[[number("impact.volunteers",120).toLocaleString(), "+", "Youth volunteers"], [number("impact.hours",3800).toLocaleString(), "+", "Service hours"], [number("impact.events",86).toLocaleString(), "+", "Community events"], [number("impact.people",12000).toLocaleString(), "+", "People reached"],[text("impact.music_shared","XXX"), "+", "Music shared"]].map(n => <div key={n[2]}><p><b>{n[0]}</b><sup>{n[1]}</sup></p><span>{n[2]}</span></div>)}</div>
    </section>

    <section className="programs-section section-pad">
      <SectionHeading eyebrow="06 · PROGRAMS IN ACTION" title="Where good intentions become real impact." action="Explore all programs" onAction={() => go("programs")}/>
      <div className="program-grid">{cmsPrograms.map(program => <article key={program.title} role="link" tabIndex={0} onClick={() => goProgram(program.slug)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" ")goProgram(program.slug)}}><img src={program.image} alt={program.title}/><div className="program-overlay"/><span>{program.number}</span><h3>{program.title}</h3><p>{program.text}</p><button aria-label={`Explore ${program.title}`}><Arrow diagonal /></button></article>)}</div>
    </section>

    <section className="stories-strip section-pad">
      <SectionHeading eyebrow="07 · STORIES IN ACTION" title="Listen closely. Every volunteer has a story." action="Read all stories" onAction={() => go("stories")}/>
      <div className="story-cards">{stories.map(story => <article key={story.title}><img src={story.image} alt="Youth volunteer story"/><p>{story.tag}</p><h3>{story.title}</h3><button onClick={() => go("stories")}>Read story <Arrow /></button></article>)}</div>
    </section>

    <section className="join-band"><div><p className="eyebrow light"><span>08</span> JOIN THE MOVEMENT</p><h2>{text("home.join_title","Your talent can change the tempo.")}</h2></div><div><p>Turn your love of music into meaningful service. There’s a place for your sound here.</p><button className="button coral" onClick={() => go("join")}>Find your place <Arrow /></button></div><span className="join-note" aria-hidden="true">♫</span></section>
  </>;
}

function InnerHero({ eyebrow, title, italic, text, image = officialImages.hero }: { eyebrow: string; title: string; italic?: string; text: string; image?: string }) {
  return <section className="inner-hero"><img src={image} alt="Ivy Chamber Strings youth musicians"/><div/><p className="eyebrow light"><span>♪</span>{eyebrow}</p><h1>{title}<br/><em>{italic}</em></h1><p className="inner-dek">{text}</p></section>;
}

function About() { const {text}=useCms(); return <>
  <InnerHero eyebrow="ABOUT US" title={text("about.hero_title","A love of music. A call to serve.")} text={text("about.hero_text","We believe young people are not only future leaders—they are powerful leaders right now.")} image={officialImages.orchestra}/>
  <section className="split-copy section-pad"><p className="eyebrow"><span>01</span> OUR MISSION</p><h2>{text("about.mission","We make space for young musicians to lead with heart.")}</h2><div><p>{text("about.body","Ivy Chamber Strings is a 501(c)(3) nonprofit youth orchestra and chamber music program serving students ages 6 to 17 in Orange County. We connect musical growth with purposeful service.")}</p></div></section>
  <section className="values-block section-pad"><SectionHeading eyebrow="02 · OUR VALUES" title="The rhythm behind everything we do."/><div className="what-grid">{[["EXCELLENCE","We practice with purpose and bring our best."],["INTEGRITY","We lead with care, honesty, and respect."],["COLLABORATION","We listen—on stage and in community."],["GROWTH","We make room for every voice to flourish."]].map((v,i)=><article key={v[0]}><div><span>0{i+1}</span><b>✦</b></div><h3>{v[0]}</h3><p>{v[1]}</p></article>)}</div></section>
  <section className="history section-pad"><SectionHeading eyebrow="03 · OUR JOURNEY" title="One movement at a time."/><div className="history-line">{[["2019","A young orchestra finds its sound."],["2021","Service expands across local communities."],["2023","Scholarships and new stages open doors."],["2025","Music travels beyond borders."],["TODAY","A youth service movement begins."]].map(x=><div key={x[0]}><b>{x[0]}</b><i/><p>{x[1]}</p></div>)}</div></section>
  <JoinMini />
 </>; }

function Volunteers() { const {text}=useCms(); return <>
  <InnerHero eyebrow="OUR VOLUNTEERS" title={text("volunteers.hero_title","Many instruments. One shared purpose.")} text={text("volunteers.hero_text","Meet the young people turning rehearsal-room discipline into real-world compassion.")} image={officialImages.community}/>
  <section className="section-pad"><SectionHeading eyebrow="01 · MEET THE COMMUNITY" title="Every person adds something to the sound."/><div className="mosaic"><img src={officialImages.hero} alt="Orchestra group"/><img src={officialImages.stage} alt="Youth musicians together"/><div><b>120+</b><span>young volunteers</span></div><img src={officialImages.travel} alt="Music service group"/></div></section>
  <section className="voices section-pad"><SectionHeading eyebrow="02 · VOLUNTEER VOICES" title="In their own words."/><div className="quote-card"><span>“</span><blockquote>Music taught me how to listen. Service taught me who I was listening for.</blockquote><p>— Youth volunteer reflection</p><button aria-label="Play volunteer story">▶</button></div></section>
  <section className="section-pad"><SectionHeading eyebrow="03 · VOLUNTEER OPPORTUNITIES" title="Four ways to make your mark."/><div className="opportunity-list">{["Perform","Teach","Mentor","Serve"].map((x,i)=><div key={x}><span>0{i+1}</span><h3>{x}</h3><p>{["Share live music at community events and partner spaces.","Lead welcoming lessons and hands-on workshops.","Help a younger musician build skill and confidence.","Support exchanges, events, and neighborhood projects."][i]}</p><Arrow diagonal/></div>)}</div></section>
  <section className="experience section-pad"><div><p className="eyebrow light"><span>04</span> THE VOLUNTEER EXPERIENCE</p><h2>Show up.<br/>Tune in.<br/><em>Grow together.</em></h2></div><ol><li><b>01</b><span><strong>Find an event</strong>Browse simple, open volunteer opportunities.</span></li><li><b>02</b><span><strong>Sign up</strong>Save your place from the member portal.</span></li><li><b>03</b><span><strong>Make an impact</strong>Serve alongside a supportive youth team.</span></li><li><b>04</b><span><strong>Track your hours</strong>See verified service history in one place.</span></li></ol></section>
  <JoinMini />
 </>; }

function Programs() { const {text,json}=useCms(); const items=json("programs.items_json",defaultPrograms);const slugFromHash=()=>typeof window==="undefined"?"":window.location.hash.split("/")[2]||"";const [selected,setSelected]=useState(slugFromHash);useEffect(()=>{const sync=()=>setSelected(slugFromHash());window.addEventListener("hashchange",sync);return()=>window.removeEventListener("hashchange",sync)},[]);const program=items.find(item=>item.slug===selected);if(program)return <>
  <section className="program-focus-hero"><img src={program.image} alt={program.title}/><div/><button className="program-back" onClick={()=>{window.location.hash="#/programs";setSelected("")}}>← All programs</button><p className="eyebrow light">PROGRAM {program.number}</p><h1>{program.title}</h1><p>{program.text}</p></section>
  <section className="program-focus-copy section-pad"><div><p className="eyebrow"><span>♪</span>IN ACTION</p><h2>Music with a purpose.</h2></div><div><p>{program.description}</p><blockquote>{program.impact}</blockquote><button className="button ink" onClick={()=>go("join")}>Get involved <Arrow/></button></div></section>
  <section className="program-gallery section-pad"><SectionHeading eyebrow="PROGRAM GALLERY" title="See the work in motion."/><div>{program.gallery.map((image,index)=><img key={`${image}-${index}`} src={image} alt={`${program.title} activity ${index+1}`}/>)}</div></section><JoinMini /></>;
  return <><InnerHero eyebrow="OUR PROGRAMS" title={text("programs.hero_title","Music that moves into the world.")} text={text("programs.hero_text","Four youth-led programs. Countless ways to connect.")} image={officialImages.stage}/><section className="program-detail section-pad">{items.map(p=><article key={p.title} role="link" tabIndex={0} onClick={()=>{goProgram(p.slug);setSelected(p.slug)}} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){goProgram(p.slug);setSelected(p.slug)}}}><div className="program-detail-image"><img src={p.image} alt={p.title}/><span>{p.number}</span></div><div><p className="eyebrow">PROGRAM {p.number}</p><h2>{p.title}</h2><p>{p.text}</p><button className="text-link">Explore this program <Arrow/></button></div></article>)}</section><JoinMini /></>; }

function Stories() { const {text}=useCms(); return <>
  <InnerHero eyebrow="STORIES IN ACTION" title={text("stories.hero_title","The moments between the notes.")} text={text("stories.hero_text","Student-written stories, photos, and reflections from a community in motion.")} image={officialImages.travel}/>
  <section className="featured-story section-pad"><img src={officialImages.community} alt="Featured community story"/><div><p className="eyebrow"><span>FEATURED</span> VOLUNTEER VOICE</p><h2>When the room started singing with us</h2><p>A student reflection on a community performance that became something much bigger than the program on the music stand.</p><span>7 MIN READ · MAY 18, 2026</span><button className="button ink">Read the story <Arrow/></button></div></section>
  <PublishedStories/>
  <section className="submit-story"><div><p className="eyebrow light">SHARE YOUR VOICE</p><h2>Were you there?<br/><em>Tell the story.</em></h2></div><p>Current volunteers can submit reflections and photos for review from the member portal.<button className="button coral" onClick={() => go("portal")}>Submit a story <Arrow/></button></p></section>
 </>; }

function PublishedStories(){const [items,setItems]=useState<Array<{id:string;title:string;excerpt:string;cover_url:string;author_name:string;published_at:string}>>([]);useEffect(()=>{getPublicStories().then(setItems).catch(()=>{})},[]);const visible=items.length?items:stories.map((s,i)=>({id:String(i),title:s.title,excerpt:s.excerpt,cover_url:s.image,author_name:s.author,published_at:s.date}));return <section className="journal-grid section-pad">{visible.map(s=><article key={s.id}><img src={s.cover_url||officialImages.community} alt="Student story"/><div><p>Story in action</p><h3>{s.title}</h3><span>{s.author_name} · {new Date(s.published_at).toLocaleDateString()}</span><p>{s.excerpt}</p></div></article>)}</section>}
function Impact() { const {text,number}=useCms(); return <>
  <InnerHero eyebrow="OUR IMPACT" title={text("impact.hero_title","What service sounds like.")} text={text("impact.hero_text","Hours are part of the story. People, confidence, connection, and access complete it.")} image={officialImages.hero}/>
  <section className="impact-page section-pad"><SectionHeading eyebrow="LIVE IMPACT" title={text("impact.section_title","A growing community. A lasting echo.")}/><p className="impact-intro">{text("impact.section_body","Behind every number is a story of young musicians sharing their time, talent, and love of music with the community.")}</p><div className="impact-big">{[[`${number("impact.volunteers",120).toLocaleString()}+`,"Youth volunteers"],[`${number("impact.hours",3800).toLocaleString()}+`,"Service hours"],[`${number("impact.events",86).toLocaleString()}+`,"Community events"],[`${number("impact.people",12000).toLocaleString()}+`,"People reached"],[`${text("impact.music_shared","XXX")}+`,"Music shared"]].map(x=><div key={x[1]}><b>{x[0]}</b><span>{x[1]}</span><i/></div>)}</div></section>
  <section className="impact-story"><img src={officialImages.stage} alt="Music program in action"/><div><p className="eyebrow light">PROGRAM IMPACT</p><h2>Access begins with one open door.</h2><p>Our workshops, performances, exchanges, and mentorship circles create more places where young people can experience music—not as spectators, but as participants.</p><button className="button coral" onClick={() => go("join")}>Help widen the circle <Arrow/></button></div></section>
 </>; }

function Join() { const {text}=useCms(); const [sent,setSent]=useState(""); async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const form=new FormData(e.currentTarget);try{await submitContact(Object.fromEntries(form));setSent("Thank you—your message has been sent to the webmaster.");e.currentTarget.reset()}catch{setSent("Please check your information and try again.")}} return <>
  <InnerHero eyebrow="JOIN THE MOVEMENT" title={text("join.hero_title","Bring what you love. Leave an echo.")} text={text("join.hero_text","Volunteer, partner, or bring a program to your community. Your next step starts here.")} image={officialImages.orchestra}/>
  <section className="join-options section-pad">{[
    ["01","Become a Volunteer","Perform, teach, mentor, or serve alongside young musicians.","View open opportunities"],
    ["02","Partner With Us","Create a performance, workshop, or exchange with your organization.","Start a conversation"],
    ["03","Bring a Program","Invite youth-led music service into your school or community.","Tell us about your community"],
  ].map(x=><article key={x[0]}><span>{x[0]}</span><h2>{x[1]}</h2><p>{x[2]}</p><button className="text-link" onClick={() => x[0] === "01" ? go("login") : undefined}>{x[3]} <Arrow/></button></article>)}</section>
  <section className="contact-section"><div><p className="eyebrow light">CONTACT US</p><h2>Let’s make something<br/><em>meaningful.</em></h2><p>{text("footer.contact_email","hello@inspirewithmusic.org")}<br/>Orange County, California</p>{sent&&<p>{sent}</p>}</div><form onSubmit={submit}><label>Your name<input name="name" required placeholder="First and last name"/></label><label>Email<input name="email" required type="email" placeholder="you@example.com"/></label><label>I’m interested in<select name="interest"><option>Volunteering</option><option>Partnership</option><option>Bringing a program</option><option>General question</option></select></label><label>Tell us more<textarea name="message" required minLength={10} placeholder="How would you like to get involved?"/></label><button className="button coral">Send message <Arrow/></button></form></section>
 </>; }

function Donate() { const {text}=useCms(); return <>
  <section className="donate-hero"><div className="donate-note" aria-hidden="true">♪</div><p className="eyebrow light">SUPPORT OUR MISSION</p><h1>{text("donate.hero_title","Help the next generation be heard.")}</h1><p>{text("donate.hero_text","Your support helps us expand youth-led music programs, community performances, educational opportunities, and access to music.")}</p></section>
  <section className="give-section section-pad"><SectionHeading eyebrow="WAYS TO GIVE" title="Choose your way to make a difference."/><div className="give-grid"><article><span>Z</span><p>DIRECT GIVING</p><h2>Zelle</h2><p>Make a direct, secure gift using the organization’s verified Zelle details.</p><div className="placeholder-data">{text("donate.zelle","Add verified Zelle information")}</div></article><article className="paypal"><span>P</span><p>ONLINE GIVING</p><h2>PayPal</h2><p>Support our work with a one-time or recurring gift through PayPal.</p><a className="button ink" href={text("donate.paypal_url","#")}>Donate with PayPal <Arrow diagonal/></a></article></div></section>
  <section className="materials"><img src={officialImages.community} alt="Donating music education materials"/><div><p className="eyebrow light">DONATE MUSIC MATERIALS</p><h2>Give your music<br/><em>a second movement.</em></h2><p>Support our Music Exchange program by donating sheet music, music books, instruments, and other educational materials.</p><a className="button coral" href={text("donate.materials_url","#")}>Donate music materials <Arrow/></a></div></section>
  <p className="tax-note">Ivy Chamber Strings is a 501(c)(3) nonprofit organization. Donations are tax-deductible to the extent permitted by law.</p>
 </>; }

function JoinMini() { return <section className="join-mini"><p>READY WHEN YOU ARE</p><h2>Put your talent<br/><em>into motion.</em></h2><button className="button coral" onClick={() => go("join")}>Join the movement <Arrow/></button></section>; }

export function InspireSite() {
  const [route,setRoute]=useState<Route>("home");
  useEffect(()=>{const sync=()=>{setRoute(routeFromHash());window.scrollTo(0,0)};sync();window.addEventListener("hashchange",sync);return()=>window.removeEventListener("hashchange",sync)},[]);
  const content=useMemo(()=>({home:<Home/>,about:<About/>,volunteers:<Volunteers/>,programs:<Programs/>,stories:<Stories/>,impact:<Impact/>,join:<Join/>,donate:<Donate/>,login:<LoginApp navigate={go}/>,portal:<MemberPortal navigate={go}/>,admin:<AdminPortal navigate={go}/>})[route],[route]);
  if(route==="login"||route==="portal"||route==="admin") return <CmsProvider>{content}</CmsProvider>;
  return <CmsProvider><Header route={route}/><main>{content}</main><Footer/></CmsProvider>;
}
