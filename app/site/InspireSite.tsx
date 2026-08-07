"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { leaders, officialImages, programs, stories, upcomingEvents } from "./content";

type Route = "home" | "about" | "volunteers" | "programs" | "stories" | "impact" | "join" | "donate" | "login" | "portal" | "admin";

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
    <nav className={open ? "nav-open" : ""} aria-label="Primary navigation">
      {nav.map(item => <button key={item.route} className={route === item.route ? "active" : ""} onClick={() => { go(item.route); setOpen(false); }}>{item.label}</button>)}
    </nav>
    <div className="header-actions">
      <button className="login-link" onClick={() => go("login")}>Member login</button>
      <button className="donate-nav" onClick={() => go("donate")}>Donate <Arrow diagonal /></button>
    </div>
    <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle menu"><span/><span/></button>
  </header>;
}

function Footer() {
  return <footer>
    <div className="footer-top">
      <div><Logo inverse /><p>Music in action.<br/>Youth in service.</p></div>
      <div className="footer-links"><span>EXPLORE</span>{nav.slice(1).map(item => <button onClick={() => go(item.route)} key={item.route}>{item.label}</button>)}</div>
      <div className="footer-links"><span>CONNECT</span><a href="mailto:hello@inspirewithmusic.org">Email us</a><a href="#">Instagram</a><a href="#">YouTube</a><button onClick={() => go("login")}>Member portal</button></div>
      <div className="footer-note"><span>STAY IN THE LOOP</span><p>Stories, events, and new ways to make a difference—delivered with rhythm.</p><div className="email-field"><input aria-label="Email address" placeholder="Email address"/><button aria-label="Subscribe">→</button></div></div>
    </div>
    <div className="footer-bottom"><span>© 2026 Inspire With Music</span><span>Ivy Chamber Strings is a 501(c)(3) nonprofit organization.</span><button onClick={() => go("admin")}>Admin</button></div>
  </footer>;
}

function SectionHeading({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  return <div className="section-heading"><div><p className="eyebrow"><span>♪</span>{eyebrow}</p><h2>{title}</h2></div>{action && <button className="text-link" onClick={onAction}>{action} <Arrow /></button>}</div>;
}

function Home() {
  return <>
    <section className="hero">
      <img src={officialImages.hero} alt="Youth string orchestra performing on stage" />
      <div className="hero-shade"/><div className="hero-score" aria-hidden="true"><i/><i/><i/><i/><i/></div>
      <div className="hero-content"><p className="hero-kicker">YOUTH-LED · MUSIC-DRIVEN · COMMUNITY-FOCUSED</p><h1>Music in Action.<br/><em>Youth in Service.</em></h1><p className="hero-copy">Empowering young musicians to share their talents, serve their communities, and make a difference through music.</p><div className="hero-actions"><button className="button coral" onClick={() => go("join")}>Join as a volunteer <Arrow /></button><button className="button glass" onClick={() => go("impact")}>Explore our impact <Arrow /></button></div></div>
      <div className="hero-side"><span>SCROLL TO DISCOVER</span><i/></div>
      <div className="hero-caption"><b>LIVE</b><span>Community performance<br/>Orange County, CA</span></div>
    </section>

    <section className="intro-section section-pad">
      <div className="giant-note" aria-hidden="true">♪</div>
      <p className="eyebrow"><span>01</span> WHO WE ARE</p>
      <div className="intro-grid"><h2>We turn a passion<br/>for music into<br/><em>meaningful service.</em></h2><div><p>Ivy Chamber Strings is a youth-led nonprofit creating opportunities for young people to lead, connect, and make a difference.</p><p>Through performance, education, mentorship, and community outreach, music becomes more than an art—it becomes an act of care.</p><button className="circle-link" onClick={() => go("about")} aria-label="About our mission"><Arrow diagonal /></button></div></div>
      <div className="value-strip"><span>YOUTH-LED</span><i>✦</i><span>MUSIC-DRIVEN</span><i>✦</i><span>COMMUNITY-FOCUSED</span></div>
    </section>

    <section className="leaders-section section-pad">
      <SectionHeading eyebrow="02 · MEET OUR YOUTH LEADERS" title="Young musicians. Big hearts. Shared purpose." action="Meet the full team" onAction={() => go("volunteers")}/>
      <div className="leader-grid">{leaders.map((leader, i) => <article className={`leader-card leader-${i + 1}`} key={leader.name}><div className="leader-image"><img src={leader.image} alt="Demo youth leadership profile"/><span>0{i + 1}</span></div><h3>{leader.name}</h3><p>{leader.role}</p></article>)}</div>
      <p className="demo-note">Leadership profiles shown are design placeholders and can be replaced in the Webmaster portal.</p>
    </section>

    <section className="what-section section-pad">
      <SectionHeading eyebrow="03 · WHAT WE DO" title="Turning music talent into meaningful service."/>
      <div className="what-grid">{[
        ["PERFORM", "Bringing music into our communities.", "♩"], ["TEACH", "Sharing music through lessons and workshops.", "♫"], ["MENTOR", "Helping young musicians learn and grow.", "♬"], ["SERVE", "Giving back through music and community projects.", "♪"]
      ].map((item, i) => <article key={item[0]}><div><span>0{i + 1}</span><b>{item[2]}</b></div><h3>{item[0]}</h3><p>{item[1]}</p></article>)}</div>
    </section>

    <section className="story-section">
      <div className="story-image"><img src={officialImages.travel} alt="Youth musicians on a service journey"/><span className="vertical-label">OUR STORY · SINCE 2019</span></div>
      <div className="story-copy"><p className="eyebrow"><span>04</span> OUR STORY</p><h2>Every note has<br/>led us <em>here.</em></h2><p>From serving our local communities to connecting with audiences around the world, our journey has been shaped by music, service, and a growing community of young musicians.</p><div className="timeline"><div><b>2019</b><span>It begins</span></div><div><b>2022</b><span>Community grows</span></div><div><b>2025</b><span>Beyond borders</span></div><div className="now"><b>NOW</b><span>The next movement</span></div></div><button className="button ink" onClick={() => go("about")}>Follow our journey <Arrow /></button></div>
    </section>

    <section className="impact-section section-pad">
      <div className="impact-lead"><p className="eyebrow light"><span>05</span> IMPACT IN NUMBERS</p><h2>A growing<br/>community.<br/><em>A lasting echo.</em></h2><p>Each number is a young person who showed up, a neighbor who felt seen, and a moment made brighter through music.</p></div>
      <div className="numbers-grid">{[["120", "+", "Youth volunteers"], ["3,800", "+", "Service hours"], ["86", "+", "Community events"], ["12K", "+", "People reached"]].map(n => <div key={n[2]}><p><b>{n[0]}</b><sup>{n[1]}</sup></p><span>{n[2]}</span></div>)}<small>ILLUSTRATIVE PREVIEW DATA · LIVE TOTALS EDITABLE IN ADMIN</small></div>
    </section>

    <section className="programs-section section-pad">
      <SectionHeading eyebrow="06 · PROGRAMS IN ACTION" title="Where good intentions become real impact." action="Explore all programs" onAction={() => go("programs")}/>
      <div className="program-grid">{programs.map(program => <article key={program.title} onClick={() => go("programs")}><img src={program.image} alt="Youth music program"/><div className="program-overlay"/><span>{program.number}</span><h3>{program.title}</h3><p>{program.text}</p><button aria-label={`Explore ${program.title}`}><Arrow diagonal /></button></article>)}</div>
    </section>

    <section className="stories-strip section-pad">
      <SectionHeading eyebrow="07 · STORIES IN ACTION" title="Listen closely. Every volunteer has a story." action="Read all stories" onAction={() => go("stories")}/>
      <div className="story-cards">{stories.map(story => <article key={story.title}><img src={story.image} alt="Youth volunteer story"/><p>{story.tag}</p><h3>{story.title}</h3><button onClick={() => go("stories")}>Read story <Arrow /></button></article>)}</div>
    </section>

    <section className="join-band"><div><p className="eyebrow light"><span>08</span> JOIN THE MOVEMENT</p><h2>Your talent can<br/>change the <em>tempo.</em></h2></div><div><p>Turn your love of music into meaningful service. There’s a place for your sound here.</p><button className="button coral" onClick={() => go("join")}>Find your place <Arrow /></button></div><span className="join-note" aria-hidden="true">♫</span></section>
  </>;
}

function InnerHero({ eyebrow, title, italic, text, image = officialImages.hero }: { eyebrow: string; title: string; italic?: string; text: string; image?: string }) {
  return <section className="inner-hero"><img src={image} alt="Ivy Chamber Strings youth musicians"/><div/><p className="eyebrow light"><span>♪</span>{eyebrow}</p><h1>{title}<br/><em>{italic}</em></h1><p className="inner-dek">{text}</p></section>;
}

function About() { return <>
  <InnerHero eyebrow="ABOUT US" title="A love of music." italic="A call to serve." text="We believe young people are not only future leaders—they are powerful leaders right now." image={officialImages.orchestra}/>
  <section className="split-copy section-pad"><p className="eyebrow"><span>01</span> OUR MISSION</p><h2>We make space for young musicians to lead with <em>heart.</em></h2><div><p>Ivy Chamber Strings is a 501(c)(3) nonprofit youth orchestra and chamber music program serving students ages 6 to 17 in Orange County.</p><p>We connect musical growth with purposeful service—equipping young people to perform, teach, mentor, and create moments of belonging.</p></div></section>
  <section className="values-block section-pad"><SectionHeading eyebrow="02 · OUR VALUES" title="The rhythm behind everything we do."/><div className="what-grid">{[["EXCELLENCE","We practice with purpose and bring our best."],["INTEGRITY","We lead with care, honesty, and respect."],["COLLABORATION","We listen—on stage and in community."],["GROWTH","We make room for every voice to flourish."]].map((v,i)=><article key={v[0]}><div><span>0{i+1}</span><b>✦</b></div><h3>{v[0]}</h3><p>{v[1]}</p></article>)}</div></section>
  <section className="history section-pad"><SectionHeading eyebrow="03 · OUR JOURNEY" title="One movement at a time."/><div className="history-line">{[["2019","A young orchestra finds its sound."],["2021","Service expands across local communities."],["2023","Scholarships and new stages open doors."],["2025","Music travels beyond borders."],["TODAY","A youth service movement begins."]].map(x=><div key={x[0]}><b>{x[0]}</b><i/><p>{x[1]}</p></div>)}</div></section>
  <JoinMini />
 </>; }

function Volunteers() { return <>
  <InnerHero eyebrow="OUR VOLUNTEERS" title="Many instruments." italic="One shared purpose." text="Meet the young people turning rehearsal-room discipline into real-world compassion." image={officialImages.community}/>
  <section className="section-pad"><SectionHeading eyebrow="01 · MEET THE COMMUNITY" title="Every person adds something to the sound."/><div className="mosaic"><img src={officialImages.hero} alt="Orchestra group"/><img src={officialImages.stage} alt="Youth musicians together"/><div><b>120+</b><span>young volunteers</span></div><img src={officialImages.travel} alt="Music service group"/></div></section>
  <section className="voices section-pad"><SectionHeading eyebrow="02 · VOLUNTEER VOICES" title="In their own words."/><div className="quote-card"><span>“</span><blockquote>Music taught me how to listen. Service taught me who I was listening for.</blockquote><p>— Youth volunteer reflection</p><button aria-label="Play volunteer story">▶</button></div></section>
  <section className="section-pad"><SectionHeading eyebrow="03 · VOLUNTEER OPPORTUNITIES" title="Four ways to make your mark."/><div className="opportunity-list">{["Perform","Teach","Mentor","Serve"].map((x,i)=><div key={x}><span>0{i+1}</span><h3>{x}</h3><p>{["Share live music at community events and partner spaces.","Lead welcoming lessons and hands-on workshops.","Help a younger musician build skill and confidence.","Support exchanges, events, and neighborhood projects."][i]}</p><Arrow diagonal/></div>)}</div></section>
  <section className="experience section-pad"><div><p className="eyebrow light"><span>04</span> THE VOLUNTEER EXPERIENCE</p><h2>Show up.<br/>Tune in.<br/><em>Grow together.</em></h2></div><ol><li><b>01</b><span><strong>Find an event</strong>Browse simple, open volunteer opportunities.</span></li><li><b>02</b><span><strong>Sign up</strong>Save your place from the member portal.</span></li><li><b>03</b><span><strong>Make an impact</strong>Serve alongside a supportive youth team.</span></li><li><b>04</b><span><strong>Track your hours</strong>See verified service history in one place.</span></li></ol></section>
  <JoinMini />
 </>; }

function Programs() { return <>
  <InnerHero eyebrow="OUR PROGRAMS" title="Music that moves" italic="into the world." text="Four youth-led programs. Countless ways to connect." image={officialImages.stage}/>
  <section className="program-detail section-pad">{programs.map(p=><article key={p.title}><div className="program-detail-image"><img src={p.image} alt={p.title}/><span>{p.number}</span></div><div><p className="eyebrow">PROGRAM {p.number}</p><h2>{p.title}</h2><p>{p.text} Each program is designed to be welcoming, practical, and powered by young people who are ready to share what they know.</p><button className="text-link" onClick={() => go("join")}>Get involved <Arrow/></button></div></article>)}</section>
  <JoinMini />
 </>; }

function Stories() { return <>
  <InnerHero eyebrow="STORIES IN ACTION" title="The moments" italic="between the notes." text="Student-written stories, photos, and reflections from a community in motion." image={officialImages.travel}/>
  <section className="featured-story section-pad"><img src={officialImages.community} alt="Featured community story"/><div><p className="eyebrow"><span>FEATURED</span> VOLUNTEER VOICE</p><h2>When the room started singing with us</h2><p>A student reflection on a community performance that became something much bigger than the program on the music stand.</p><span>7 MIN READ · MAY 18, 2026</span><button className="button ink">Read the story <Arrow/></button></div></section>
  <section className="journal-grid section-pad">{[...stories,...stories].map((s,i)=><article key={`${s.title}-${i}`}><img src={s.image} alt="Student story"/><div><p>{s.tag}</p><h3>{s.title}</h3><span>{s.author} · {s.date}</span><button>Read <Arrow/></button></div></article>)}</section>
  <section className="submit-story"><div><p className="eyebrow light">SHARE YOUR VOICE</p><h2>Were you there?<br/><em>Tell the story.</em></h2></div><p>Current volunteers can submit reflections and photos for review from the member portal.<button className="button coral" onClick={() => go("portal")}>Submit a story <Arrow/></button></p></section>
 </>; }

function Impact() { return <>
  <InnerHero eyebrow="OUR IMPACT" title="What service" italic="sounds like." text="Hours are part of the story. People, confidence, connection, and access complete it." image={officialImages.hero}/>
  <section className="impact-page section-pad"><SectionHeading eyebrow="LIVE IMPACT" title="Numbers with a human heartbeat."/><div className="impact-big">{[["120+","Youth volunteers"],["3,800+","Service hours"],["86+","Community events"],["12K+","People reached"]].map(x=><div key={x[1]}><b>{x[0]}</b><span>{x[1]}</span><i/></div>)}</div><p className="demo-note">Illustrative preview totals. Every number can be updated in the Webmaster portal.</p></section>
  <section className="impact-story"><img src={officialImages.stage} alt="Music program in action"/><div><p className="eyebrow light">PROGRAM IMPACT</p><h2>Access begins with one open door.</h2><p>Our workshops, performances, exchanges, and mentorship circles create more places where young people can experience music—not as spectators, but as participants.</p><button className="button coral" onClick={() => go("join")}>Help widen the circle <Arrow/></button></div></section>
 </>; }

function Join() { return <>
  <InnerHero eyebrow="JOIN THE MOVEMENT" title="Bring what you love." italic="Leave an echo." text="Volunteer, partner, or bring a program to your community. Your next step starts here." image={officialImages.orchestra}/>
  <section className="join-options section-pad">{[
    ["01","Become a Volunteer","Perform, teach, mentor, or serve alongside young musicians.","View open opportunities"],
    ["02","Partner With Us","Create a performance, workshop, or exchange with your organization.","Start a conversation"],
    ["03","Bring a Program","Invite youth-led music service into your school or community.","Tell us about your community"],
  ].map(x=><article key={x[0]}><span>{x[0]}</span><h2>{x[1]}</h2><p>{x[2]}</p><button className="text-link" onClick={() => x[0] === "01" ? go("login") : undefined}>{x[3]} <Arrow/></button></article>)}</section>
  <section className="contact-section"><div><p className="eyebrow light">CONTACT US</p><h2>Let’s make something<br/><em>meaningful.</em></h2><p>hello@inspirewithmusic.org<br/>Orange County, California</p></div><form onSubmit={e=>e.preventDefault()}><label>Your name<input placeholder="First and last name"/></label><label>Email<input type="email" placeholder="you@example.com"/></label><label>I’m interested in<select><option>Volunteering</option><option>Partnership</option><option>Bringing a program</option><option>General question</option></select></label><label>Tell us more<textarea placeholder="How would you like to get involved?"/></label><button className="button coral">Send message <Arrow/></button></form></section>
 </>; }

function Donate() { return <>
  <section className="donate-hero"><div className="donate-note" aria-hidden="true">♪</div><p className="eyebrow light">SUPPORT OUR MISSION</p><h1>Help the next<br/>generation <em>be heard.</em></h1><p>Your support helps us expand youth-led music programs, community performances, educational opportunities, and access to music.</p></section>
  <section className="give-section section-pad"><SectionHeading eyebrow="WAYS TO GIVE" title="Choose your way to make a difference."/><div className="give-grid"><article><span>Z</span><p>DIRECT GIVING</p><h2>Zelle</h2><p>Make a direct, secure gift using the organization’s verified Zelle details.</p><div className="placeholder-data">ZELLE INFORMATION<br/><small>ADD IN WEBMASTER PORTAL</small></div></article><article className="paypal"><span>P</span><p>ONLINE GIVING</p><h2>PayPal</h2><p>Support our work with a one-time or recurring gift through PayPal.</p><button className="button ink">Donate with PayPal <Arrow diagonal/></button></article></div></section>
  <section className="materials"><img src={officialImages.community} alt="Donating music education materials"/><div><p className="eyebrow light">DONATE MUSIC MATERIALS</p><h2>Give your music<br/><em>a second movement.</em></h2><p>Support our Music Exchange program by donating sheet music, music books, instruments, and other educational materials.</p><button className="button coral">Donate music materials <Arrow/></button></div></section>
  <p className="tax-note">Ivy Chamber Strings is a 501(c)(3) nonprofit organization. Donations are tax-deductible to the extent permitted by law.</p>
 </>; }

function JoinMini() { return <section className="join-mini"><p>READY WHEN YOU ARE</p><h2>Put your talent<br/><em>into motion.</em></h2><button className="button coral" onClick={() => go("join")}>Join the movement <Arrow/></button></section>; }

function Login() {
  const [mode, setMode] = useState<"signin"|"create">("signin");
  return <div className="auth-page"><div className="auth-photo"><Logo inverse/><img src={officialImages.hero} alt="Youth orchestra performance"/><div/><blockquote>“The best part of making music is discovering who it can reach.”</blockquote></div><div className="auth-panel"><button className="back-link" onClick={()=>go("home")}>← Back to site</button><div className="auth-box"><p className="eyebrow">MEMBER PORTAL</p><h1>{mode === "signin" ? "Welcome back." : "Join the movement."}</h1><p>{mode === "signin" ? "Sign in to find events, manage your profile, and track service." : "Create a volunteer profile and start making music matter."}</p><form onSubmit={e=>{e.preventDefault(); go("portal")}}>{mode === "create" && <label>Full name<input required placeholder="Your name"/></label>}<label>Email address<input required type="email" placeholder="you@example.com"/></label><label>Password<input required type="password" placeholder="At least 8 characters"/></label><button className="button coral" type="submit">{mode === "signin" ? "Sign in" : "Create account"} <Arrow/></button></form><div className="auth-switch">{mode === "signin" ? "New to Inspire With Music?" : "Already a member?"}<button onClick={()=>setMode(mode === "signin" ? "create" : "signin")}>{mode === "signin" ? "Create an account" : "Sign in"}</button></div><small>Preview mode: any email and password opens the demo portal.</small></div></div></div>;
}

function Portal() {
  const [joined, setJoined] = useState<number[]>([2]);
  const total = 28.5;
  return <div className="portal-shell"><PortalSidebar/><main className="portal-main"><div className="portal-top"><div><p>FRIDAY, AUGUST 7</p><h1>Good morning, <em>Alex.</em></h1></div><button className="avatar">AX</button></div><div className="portal-hero"><div><p>YOUR 2026 IMPACT</p><b>{total}</b><span>verified service hours</span><div className="progress"><i style={{width:"71%"}}/></div><small>11.5 hours to your next milestone</small></div><span className="portal-note">♪</span></div><SectionHeading eyebrow="OPEN OPPORTUNITIES" title="Where will you make a difference next?"/><div className="event-list">{upcomingEvents.map((event,i)=><article key={event.title}><div className="event-date"><b>{event.day}</b><span>{event.month}</span></div><div><h3>{event.title}</h3><p>{event.time} · {event.location}</p></div><span className="spots">{event.spots} spots</span><button className={joined.includes(i)?"joined":""} onClick={()=>setJoined(joined.includes(i)?joined.filter(x=>x!==i):[...joined,i])}>{joined.includes(i)?"Signed up ✓":"Sign up →"}</button></article>)}</div><div className="portal-bottom-grid"><div className="hours-card"><p className="eyebrow">RECENT SERVICE</p><h2>Your hours</h2>{[["Community Performance","4.0 h","Verified"],["Music Exchange","3.5 h","Verified"],["Workshop Assistant","2.0 h","Pending"]].map(x=><div key={x[0]}><span>{x[0]}</span><b>{x[1]}</b><em>{x[2]}</em></div>)}<button>View full history <Arrow/></button></div><div className="story-submit"><span>✦</span><h2>Share your story</h2><p>Submit a reflection or photos from your latest volunteer experience.</p><button>Start a submission <Arrow/></button></div></div></main></div>;
}

function PortalSidebar(){return <aside className="portal-sidebar"><Logo inverse/><nav><button className="selected">⌂ <span>Overview</span></button><button>◫ <span>Opportunities</span></button><button>◴ <span>My hours</span></button><button>✎ <span>Submit a story</span></button><button>♙ <span>My profile</span></button></nav><div><button onClick={()=>go("home")}>↗ <span>View website</span></button><button onClick={()=>go("login")}>↪ <span>Sign out</span></button></div></aside>}

function Admin() {
  const [tab,setTab]=useState("Overview"); const [saved,setSaved]=useState(false);
  const role = tab === "Site content" || tab === "Settings" ? "WEBMASTER" : "VOLUNTEER ADMIN";
  const save=()=>{setSaved(true);setTimeout(()=>setSaved(false),1800)};
  return <div className="admin-shell"><aside className="admin-sidebar"><Logo inverse/><div className="role-pill">{role}</div><nav>{["Overview","Site content","Media library","Stories","Events","Members","Service hours","Settings"].map((x,i)=><button key={x} onClick={()=>setTab(x)} className={tab===x?"selected":""}><span>{["⌂","✎","▧","☷","◫","♙","◴","⚙"][i]}</span>{x}</button>)}</nav><button className="admin-exit" onClick={()=>go("home")}>↗ View live site</button></aside><main className="admin-main"><div className="admin-top"><div><p>INSPIRE WITH MUSIC</p><h1>{tab}</h1></div><div><button className="icon-button">⌕</button><button className="admin-user">WM</button></div></div>{tab === "Overview" && <AdminOverview setTab={setTab}/>} {tab === "Site content" && <ContentEditor save={save}/>} {tab === "Events" && <EventsAdmin/>} {tab === "Members" && <MembersAdmin/>} {tab === "Settings" && <Settings save={save}/>} {!["Overview","Site content","Events","Members","Settings"].includes(tab) && <GenericAdmin title={tab}/>}</main>{saved&&<div className="toast">✓ Changes saved in preview</div>}</div>;
}

function AdminOverview({setTab}:{setTab:(x:string)=>void}) {return <><div className="admin-welcome"><div><p>FRIDAY, AUGUST 7</p><h2>Here’s what’s<br/><em>in motion.</em></h2></div><button className="button coral" onClick={()=>setTab("Events")}>+ Create an event</button></div><div className="stat-cards">{[["120","Active volunteers","+8 this month"],["3,842","Verified hours","+126 this month"],["86","Total events","3 upcoming"],["5","Stories in review","Needs attention"]].map((x,i)=><article key={x[1]}><span>0{i+1}</span><b>{x[0]}</b><p>{x[1]}</p><small>{x[2]}</small></article>)}</div><div className="admin-grid"><section><div className="admin-section-head"><h3>Upcoming events</h3><button onClick={()=>setTab("Events")}>Manage all →</button></div>{upcomingEvents.map(e=><div className="mini-event" key={e.title}><span><b>{e.day}</b>{e.month}</span><div><h4>{e.title}</h4><p>{e.time} · {e.spots} open spots</p></div><button>•••</button></div>)}</section><section><div className="admin-section-head"><h3>Quick actions</h3></div>{[["✎","Edit homepage","Site content"],["▧","Upload photos","Media library"],["✓","Review hours","Service hours"],["♙","Manage members","Members"]].map(x=><button className="quick-action" key={x[1]} onClick={()=>setTab(x[2])}><span>{x[0]}</span>{x[1]}<Arrow/></button>)}</section></div></>}

function ContentEditor({save}:{save:()=>void}) {const [hero,setHero]=useState("Music in Action. Youth in Service."); return <div className="editor-layout"><aside><p>PAGE</p>{["Homepage","About","Volunteers","Programs","Stories","Impact","Join","Donate","Footer"].map((x,i)=><button className={i===0?"selected":""} key={x}>{x}<span>›</span></button>)}</aside><section className="editor-form"><div className="editor-head"><div><p>HOMEPAGE</p><h2>Hero section</h2></div><button className="button ink" onClick={save}>Save changes</button></div><label>Eyebrow<input defaultValue="YOUTH-LED · MUSIC-DRIVEN · COMMUNITY-FOCUSED"/></label><label>Headline<input value={hero} onChange={e=>setHero(e.target.value)}/><small>{hero.length}/80</small></label><label>Supporting text<textarea defaultValue="Empowering young musicians to share their talents, serve their communities, and make a difference through music."/></label><div className="two-fields"><label>Primary button<input defaultValue="Join as a Volunteer"/></label><label>Link<input defaultValue="#/join"/></label></div><label>Hero image<div className="image-control"><img src={officialImages.hero} alt="Current hero"/><div><b>hero-performance.jpg</b><span>2400 × 1350 · 1.8 MB</span><button>Replace image</button></div></div></label><div className="live-preview"><p>LIVE PREVIEW</p><div style={{backgroundImage:`linear-gradient(90deg,rgba(8,21,31,.9),transparent),url(${officialImages.hero})`}}><span>YOUTH-LED · MUSIC-DRIVEN</span><h3>{hero}</h3></div></div></section></div>}

function EventsAdmin(){return <div className="table-card"><div className="table-toolbar"><div><h2>Volunteer events</h2><p>Create simple, open events and manage signups.</p></div><button className="button coral">+ New event</button></div><div className="filter-row"><button className="selected">Upcoming 3</button><button>Past 14</button><input placeholder="Search events…"/></div><table><thead><tr><th>Event</th><th>Date</th><th>Signups</th><th>Status</th><th/></tr></thead><tbody>{upcomingEvents.map((e,i)=><tr key={e.title}><td><b>{e.title}</b><span>{e.location}</span></td><td>{e.month} {e.day}, 2026<span>{e.time}</span></td><td><b>{[18,12,9][i]}</b> / {[30,20,15][i]}</td><td><em>Open</em></td><td><button>•••</button></td></tr>)}</tbody></table></div>}

function MembersAdmin(){return <div className="table-card"><div className="table-toolbar"><div><h2>Volunteer members</h2><p>Manage profiles, activity, and service history.</p></div><button className="button coral">+ Add member</button></div><div className="filter-row"><button className="selected">Active 120</button><button>Pending 4</button><button>Inactive 9</button><input placeholder="Search members…"/></div><table><thead><tr><th>Member</th><th>Instrument</th><th>Hours</th><th>Status</th><th/></tr></thead><tbody>{[["Alex Morgan","alex@example.com","Violin","28.5"],["Jamie Chen","jamie@example.com","Cello","42.0"],["Taylor Park","taylor@example.com","Piano","16.5"],["Jordan Lin","jordan@example.com","Viola","35.0"]].map(x=><tr key={x[0]}><td><b>{x[0]}</b><span>{x[1]}</span></td><td>{x[2]}</td><td><b>{x[3]}</b> h</td><td><em>Active</em></td><td><button>•••</button></td></tr>)}</tbody></table></div>}

function Settings({save}:{save:()=>void}){return <div className="settings-page"><div className="settings-note"><span>i</span><p><b>AWS-ready configuration</b>Connection secrets stay in AWS Secrets Manager and never appear in the browser. This screen manages safe public settings and connection health.</p></div><section><div><p>SITE IDENTITY</p><h2>Brand settings</h2></div><div className="settings-fields"><label>Public site name<input defaultValue="Inspire With Music"/></label><label>Organization name<input defaultValue="Ivy Chamber Strings"/></label><label>Contact email<input defaultValue="hello@inspirewithmusic.org"/></label></div></section><section><div><p>INFRASTRUCTURE</p><h2>AWS environment</h2></div><div className="settings-fields"><label>AWS Region<select defaultValue="us-west-2"><option>us-west-2</option><option>us-east-1</option></select></label><label>Media bucket<input defaultValue="inspire-with-music-media"/></label><label>Database connection<div className="connection-ok">● Connected · PostgreSQL 16</div></label><button className="outline-button">Run connection test</button></div></section><section><div><p>ROLES & ACCESS</p><h2>Administrator roles</h2></div><div className="settings-fields"><div className="role-row"><span>WM</span><div><b>Webmaster</b><p>All site content, media, settings, and users</p></div><button>Manage</button></div><div className="role-row"><span>VA</span><div><b>Volunteer Admin</b><p>Events, members, signups, and service hours</p></div><button>Manage</button></div></div></section><button className="button ink" onClick={save}>Save settings</button></div>}

function GenericAdmin({title}:{title:string}){return <div className="generic-admin"><span>♫</span><h2>{title}</h2><p>This module is ready for the production API connection. The polished workflow and permissions shell are included in this preview.</p><button className="button ink">Add new</button></div>}

export function InspireSite() {
  const [route,setRoute]=useState<Route>("home");
  useEffect(()=>{const sync=()=>{setRoute(routeFromHash());window.scrollTo(0,0)};sync();window.addEventListener("hashchange",sync);return()=>window.removeEventListener("hashchange",sync)},[]);
  const content=useMemo(()=>({home:<Home/>,about:<About/>,volunteers:<Volunteers/>,programs:<Programs/>,stories:<Stories/>,impact:<Impact/>,join:<Join/>,donate:<Donate/>,login:<Login/>,portal:<Portal/>,admin:<Admin/>})[route],[route]);
  if(route==="login"||route==="portal"||route==="admin") return content;
  return <><Header route={route}/><main>{content}</main><Footer/></>;
}
