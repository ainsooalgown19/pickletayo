"use client";

import {
  ArrowRight,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  UserPlus,
  UsersRound,
  Zap,
} from "lucide-react";

export type CommunityPage = "open-play" | "events" | "clubs" | "manage";

type CommunityPagesProps = {
  page: CommunityPage;
  canManage: boolean;
  onDiscover: () => void;
  onOpenAdmin: () => void;
};

const sessions = [
  { venue: "Marina Courts", area: "BGC, Taguig", time: "6:30 PM", level: "Beginner friendly", players: 9, spots: 3, tone: "green" },
  { venue: "Riverside Pickle Club", area: "Mandaluyong", time: "7:00 PM", level: "Intermediate", players: 11, spots: 1, tone: "blue" },
  { venue: "Skyline Rooftop", area: "Makati", time: "8:15 PM", level: "All levels", players: 6, spots: 6, tone: "violet" },
] as const;

const events = [
  { date: "18", month: "OCT", title: "Saturday Social Mixer", place: "The Pickle Yard · Pasig", meta: "Doubles · All levels", price: "₱450", tone: "coral" },
  { date: "24", month: "OCT", title: "Sunset Rally Series", place: "Skyline Rooftop · Makati", meta: "Round robin · Intermediate", price: "₱650", tone: "blue" },
  { date: "02", month: "NOV", title: "Rookies Cup", place: "Marina Courts · Taguig", meta: "Beginner tournament", price: "₱800", tone: "green" },
] as const;

const clubs = [
  { initials: "QC", name: "QC Pickle Crew", area: "Quezon City", members: 284, schedule: "Plays Tue, Thu & Sat", tone: "green" },
  { initials: "MK", name: "Makati Kitchen", area: "Makati", members: 176, schedule: "Weeknight open play", tone: "blue" },
  { initials: "SP", name: "Southside Picklers", area: "Alabang", members: 143, schedule: "Weekend socials", tone: "sand" },
] as const;

function AvatarStack({ count = 4 }: { count?: number }) {
  const initials = ["AM", "JR", "KC", "LP"];
  return <span className="community-avatars" aria-label={`${count} player profiles`}>{initials.slice(0, count).map((item) => <i key={item}>{item}</i>)}</span>;
}

function OpenPlayPage({ onDiscover }: Pick<CommunityPagesProps, "onDiscover">) {
  return <section className="community-page">
    <div className="community-page-hero open-play-hero">
      <div><span className="community-eyebrow"><Zap size={14}/> LIVE MATCHMAKING</span><h1>Find a game.<br/><em>Bring your paddle.</em></h1><p>Join welcoming drop-in sessions nearby. Choose your level, claim a spot, and meet your next doubles partner.</p><div className="community-hero-actions"><button className="primary" type="button">Find a session <ArrowRight size={17}/></button><button className="secondary-action" type="button" onClick={onDiscover}>Browse courts</button></div></div>
      <div className="match-preview"><div className="match-preview-head"><span><i/> Live now</span><b>Marina Courts</b></div><div className="mini-court"><span>COURT 2</span><div><i>AM</i><i>JR</i><i>KC</i><i>LP</i></div></div><div className="match-preview-foot"><AvatarStack count={3}/><span><strong>3 waiting</strong><small>Next game in ~8 min</small></span><button type="button">Join queue</button></div></div>
      <div className="community-hero-stats"><span><strong>8</strong> sessions today</span><span><strong>34</strong> players nearby</span><span><strong>12m</strong> average wait</span></div>
    </div>
    <div className="community-toolbar"><div><button className="active" type="button">Today</button><button type="button">Tomorrow</button><button type="button">This week</button></div><button className="filter-chip" type="button"><Target size={15}/> Any level</button></div>
    <div className="community-section-heading"><div><span className="kicker">NEAR YOU</span><h2>Open play happening today</h2></div><span>Updated just now</span></div>
    <div className="session-list">{sessions.map((session, index) => <article className="session-card" key={session.venue}><div className="session-time"><span>{session.time}</span><small>{index === 0 ? "Starts soon" : "Tonight"}</small></div><div className={`session-art ${session.tone}`}><UsersRound/><span>{session.players}<small>playing</small></span></div><div className="session-details"><span className="level-pill">{session.level}</span><h3>{session.venue}</h3><p><MapPin size={14}/>{session.area}</p><div><AvatarStack/><small>{session.spots} {session.spots === 1 ? "spot" : "spots"} left</small></div></div><button className="session-join" type="button">Join <ChevronRight/></button></article>)}</div>
    <div className="community-callout"><span><Sparkles/></span><div><strong>Can’t find the right session?</strong><p>Create an open play and invite nearby players.</p></div><button type="button"><Plus size={17}/> Create session</button></div>
  </section>;
}

function EventsPage() {
  return <section className="community-page">
    <div className="community-page-hero events-hero"><div><span className="community-eyebrow"><Trophy size={14}/> PLAY FOR SOMETHING</span><h1>Events worth<br/><em>showing up for.</em></h1><p>From relaxed mixers to competitive brackets, there is always another reason to get on court.</p><div className="community-hero-actions"><button className="primary" type="button">Explore events <ArrowRight size={17}/></button><button className="secondary-action" type="button">Host an event</button></div></div><div className="event-feature"><span className="event-ribbon">FEATURED</span><div className="event-feature-date"><b>25–26</b><span>OCTOBER</span></div><div><span className="event-type">METRO MANILA SERIES</span><h2>Manila Open Weekend</h2><p><MapPin size={14}/> The Pickle Yard, Pasig</p><div className="event-tags"><span>Men’s doubles</span><span>Mixed doubles</span><span>3 skill tiers</span></div></div><button type="button">View event <ArrowRight size={16}/></button></div><div className="community-hero-stats"><span><strong>12</strong> upcoming events</span><span><strong>420+</strong> registered players</span><span><strong>6</strong> partner venues</span></div></div>
    <div className="community-toolbar"><div><button className="active" type="button">All events</button><button type="button">Social</button><button type="button">Tournaments</button></div><button className="filter-chip" type="button"><CalendarDays size={15}/> Pick a date</button></div>
    <div className="community-section-heading"><div><span className="kicker">UP NEXT</span><h2>Save your spot</h2></div><button type="button">View calendar</button></div>
    <div className="event-list">{events.map((event) => <article className="event-card" key={event.title}><div className={`event-date ${event.tone}`}><strong>{event.date}</strong><span>{event.month}</span></div><div className="event-details"><span className="status-line"><CheckCircle2 size={14}/> REGISTRATION OPEN</span><h3>{event.title}</h3><p><MapPin size={14}/>{event.place}</p><small>{event.meta}</small></div><div className="event-price"><span>from</span><strong>{event.price}</strong><button type="button" aria-label={`View ${event.title}`}><ChevronRight/></button></div></article>)}</div>
  </section>;
}

function ClubsPage() {
  return <section className="community-page">
    <div className="community-page-hero clubs-hero"><div><span className="community-eyebrow"><UsersRound size={14}/> BETTER TOGETHER</span><h1>Find your people.<br/><em>Grow your game.</em></h1><p>Join local clubs, find regular playing partners, and turn one good match into a weekly ritual.</p><div className="community-hero-actions"><button className="primary" type="button">Find your club <ArrowRight size={17}/></button><button className="secondary-action" type="button">Start a club</button></div></div><div className="club-feature"><div className="club-feature-mark">MP</div><span className="club-verified"><CheckCircle2 size={14}/> VERIFIED CLUB</span><h2>Metro Pickle PH</h2><p>Metro Manila’s most active pickleball community.</p><div><AvatarStack/><span><strong>1,240</strong><small>members</small></span></div><button type="button"><UserPlus size={17}/> Join club</button></div><div className="community-hero-stats"><span><strong>26</strong> local clubs</span><span><strong>3.8k</strong> active members</span><span><strong>92</strong> games this week</span></div></div>
    <div className="community-toolbar"><div><button className="active" type="button">Near me</button><button type="button">Most active</button><button type="button">New clubs</button></div><button className="filter-chip" type="button"><MapPin size={15}/> Metro Manila</button></div>
    <div className="community-section-heading"><div><span className="kicker">COMMUNITIES</span><h2>Clubs you’ll feel at home in</h2></div><button type="button">See all clubs</button></div>
    <div className="club-grid">{clubs.map((club) => <article className="club-card" key={club.name}><div className={`club-cover ${club.tone}`}><span>{club.initials}</span><i><CheckCircle2 size={15}/></i></div><div className="club-card-body"><h3>{club.name}</h3><p><MapPin size={14}/>{club.area}</p><div className="club-member-line"><AvatarStack count={3}/><span><strong>{club.members}</strong> members</span></div><small><CalendarCheck size={14}/>{club.schedule}</small><button type="button">View club <ChevronRight size={16}/></button></div></article>)}</div>
  </section>;
}

function ManagePage({ canManage, onOpenAdmin }: Pick<CommunityPagesProps, "canManage" | "onOpenAdmin">) {
  return <section className="community-page manage-page">
    <div className="manage-head"><div><span className="kicker">OPERATOR WORKSPACE</span><h1>Good afternoon.</h1><p>Here’s what’s happening across your pickleball facilities today.</p></div><div><button className="secondary-action" type="button"><CalendarDays size={17}/> Oct 6, 2026</button><button className="primary" type="button" onClick={onOpenAdmin}>{canManage ? "Open live console" : "Preview console"}<ArrowRight size={17}/></button></div></div>
    <div className="manage-metrics"><article><span className="metric-icon green"><CalendarCheck/></span><div><small>TODAY’S BOOKINGS</small><strong>28</strong><p><b>+12%</b> from last Tuesday</p></div></article><article><span className="metric-icon blue"><CircleDollarSign/></span><div><small>ESTIMATED REVENUE</small><strong>₱34,850</strong><p><b>+8%</b> week over week</p></div></article><article><span className="metric-icon violet"><UsersRound/></span><div><small>COURT UTILIZATION</small><strong>76%</strong><p>Peak time: 6–9 PM</p></div></article><article><span className="metric-icon amber"><Building2/></span><div><small>ACTIVE COURTS</small><strong>11 / 12</strong><p>1 marked for maintenance</p></div></article></div>
    <div className="manage-grid"><article className="manage-panel schedule-panel"><header><div><span className="kicker">LIVE SCHEDULE</span><h2>Today at Marina Courts</h2></div><button type="button">View all</button></header><div className="schedule-row"><time>5:00 <small>PM</small></time><span className="schedule-line"/><div><strong>Court 1 · Santos party</strong><p>1 hour · Confirmed</p></div><span className="manage-status confirmed">Checked in</span></div><div className="schedule-row"><time>6:00 <small>PM</small></time><span className="schedule-line"/><div><strong>Court 2 · Open Play</strong><p>2 hours · 9 players</p></div><span className="manage-status live">Live soon</span></div><div className="schedule-row"><time>7:30 <small>PM</small></time><span className="schedule-line"/><div><strong>Court 1 · Reyes party</strong><p>1.5 hours · Paid</p></div><span className="manage-status confirmed">Confirmed</span></div><div className="schedule-row"><time>8:00 <small>PM</small></time><span className="schedule-line"/><div><strong>Court 3 · Club night</strong><p>2 hours · Makati Kitchen</p></div><span className="manage-status club">Club</span></div></article>
      <article className="manage-panel facility-health"><header><div><span className="kicker">FACILITY STATUS</span><h2>Operations overview</h2></div><button type="button"><Plus size={16}/> Add court</button></header><div className="health-score"><span><b>92</b><small>/100</small></span><div><strong>Everything looks good</strong><p>All essential services are operational.</p></div></div><ul><li><span><CheckCircle2/> Booking system</span><b>Operational</b></li><li><span><CheckCircle2/> Online payments</span><b>Operational</b></li><li><span><ShieldCheck/> Staff coverage</span><b>4 on duty</b></li><li><span><Clock3/> Court 4 maintenance</span><b className="warning">Until 4:30 PM</b></li></ul></article></div>
    <div className="manage-bottom"><div><span><Star/></span><div><strong>4.8 average venue rating</strong><p>Players mentioned your friendly staff 16 times this month.</p></div></div><button type="button">Read feedback <ChevronRight size={17}/></button></div>
  </section>;
}

export function CommunityPages(props: CommunityPagesProps) {
  if (props.page === "open-play") return <OpenPlayPage onDiscover={props.onDiscover}/>;
  if (props.page === "events") return <EventsPage/>;
  if (props.page === "clubs") return <ClubsPage/>;
  return <ManagePage canManage={props.canManage} onOpenAdmin={props.onOpenAdmin}/>;
}
