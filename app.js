const KEY="lifePlannerV2";
const SUPABASE_URL="https://jhzxvoanehgfudlpeooc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_pZIO3Z71P3aNdfLYHlsyJg_CeDVBwVi";
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
let currentUser=null;
let cloudReady=false;
let cloudSaveTimer=null;
let lastCloudUpdatedAt=null;

const todayKey=()=>new Date().toISOString().slice(0,10);
const COLORS={class:"#60a5fa",exam:"#f87171",assignment:"#fbbf24",task:"#a78bfa",event:"#34d399",period:"#f9a8d4",personal:"#94a3b8"};
const seed={
  version:2,
  items:[],
  notes:"",
  quickNote:"",
  periodLogs:[],
  stickers:[],
  stickerInstances:[],
  theme:{preset:"clean",accent:"#111827",bg:"#f4f6f8",card:"#ffffff",radius:18,opacity:94,wallpaper:null,photo:null,icon:null,hero:"#111827",sidebar:"#0f172a",text:"#111827",muted:"#6b7280",line:"#e5e7eb",primary:"#111827",primaryText:"#ffffff",sidebarText:"#cbd5e1",sidebarActive:"#1e293b",mobileBar:"#ffffff",calendarLine:"#e5e7eb",chatFab:"#111827",widgetColors:{today:"#ffffff",tasks:"#ffffff",countdowns:"#ffffff",semester:"#ffffff",note:"#ffffff"}},
  semester:{name:"Term 1",start:"",end:""},
  settings:{cycleLength:28,privacy:false},
  labels:{
    brandTitle:"我的一天 ♡",
    brandSubtitle:"我的小小生活簿 ✿",
    pageEyebrow:"COMMAND CENTRE",
    groupSchool:"SCHOOL",
    groupLife:"LIFE",
    groupPersonalise:"PERSONALISE",
    navHome:"Home",navCalendar:"Calendar",navTasks:"Tasks",navTimetable:"Timetable",
    navAssignments:"Assignments",navExams:"Exams",navPeriod:"Period",navNotes:"Notes",
    navThemes:"Themes & Stickers",navSettings:"Settings",
    navHomeMobile:"Home",navCalendarMobile:"Calendar",navTasksMobile:"Tasks",navMoreMobile:"More",
    widgetToday:"Today",widgetTasks:"Tasks",widgetCountdowns:"Countdowns",widgetTerm:"Term progress",widgetNote:"Quick note",
    pageHome:"Home",pageCalendar:"Calendar",pageTasks:"Tasks",pageTimetable:"Timetable",pageAssignments:"Assignments",
    pageExams:"Exams",pagePeriod:"Period",pageNotes:"Notes",pageThemes:"Themes & Stickers",pageSettings:"Settings",
    labelsHeader:"Label editor",labelsEyebrow:"TEXT CUSTOMISATION",
    tasksHeader:"Tasks",tasksEyebrow:"TO DO",
    timetableHeader:"Class timetable",timetableEyebrow:"RECURRING",
    assignmentsHeader:"Assignments",assignmentsEyebrow:"DEADLINES",
    examsHeader:"Exams & quizzes",examsEyebrow:"ASSESSMENTS",
    periodHeader:"Period tracker",periodEyebrow:"PRIVATE HEALTH LOG",
    notesHeader:"Notes",notesEyebrow:"SCRATCHPAD",
    themesHeader:"Theme studio",themesEyebrow:"APPEARANCE",
    stickersHeader:"Sticker library",stickersEyebrow:"DECORATE",
    termHeader:"Term settings",termEyebrow:"TERM SETTINGS",
    dataHeader:"Backup & sync",dataEyebrow:"DATA",
    todayButton:"Today",quickAddButton:"＋ Quick add",
    quickEvent:"Event",quickTask:"Task",quickClass:"Class",quickAssignment:"Assignment",quickExam:"Exam / Quiz",quickPeriod:"Period log",
  },
  dashboardOrder:["today","tasks","countdowns","semester","note"]
};
let data=load(), currentView="home", calendarView="week", calCursor=new Date(), taskFilter="all", dragSticker=null;
const DEFAULT_LABELS=structuredClone(seed.labels);
function label(key,fallback=""){return data.labels?.[key] ?? DEFAULT_LABELS[key] ?? fallback}
function applyLabels(){
  data.labels={...DEFAULT_LABELS,...(data.labels||{})};
  $("#brandTitle").textContent=label("brandTitle","我的一天 ♡");
  $("#brandSubtitle").textContent=label("brandSubtitle","我的小小生活簿 ✿");
  document.title=label("brandTitle","我的一天 ♡");
  $$("[data-label-key]").forEach(el=>{
    const k=el.dataset.labelKey;
    if(data.labels[k]!==undefined) el.textContent=data.labels[k];
  });
  if(currentView){
    const pageKey={
      home:"pageHome",calendar:"pageCalendar",tasks:"pageTasks",timetable:"pageTimetable",
      assignments:"pageAssignments",exams:"pageExams",period:"pagePeriod",notes:"pageNotes",
      themes:"pageThemes",settings:"pageSettings"
    }[currentView];
    if(pageKey) $("#pageTitle").textContent=label(pageKey,currentView);
  }
}
function renderLabelEditor(){
  const editor=$("#labelEditor");
  if(!editor)return;
  const fields=[
    ["brandTitle","App title"],["brandSubtitle","App subtitle"],["pageEyebrow","Home eyebrow"],
    ["groupSchool","Sidebar group: School"],["groupLife","Sidebar group: Life"],["groupPersonalise","Sidebar group: Personalise"],
    ["navHome","Navigation: Home"],["navCalendar","Navigation: Calendar"],["navTasks","Navigation: Tasks"],
    ["navTimetable","Navigation: Timetable"],["navAssignments","Navigation: Assignments"],["navExams","Navigation: Exams"],
    ["navPeriod","Navigation: Period"],["navNotes","Navigation: Notes"],["navThemes","Navigation: Themes & Stickers"],["navSettings","Navigation: Settings"],
    ["widgetToday","Dashboard widget: Today"],["widgetTasks","Dashboard widget: Tasks"],["widgetCountdowns","Dashboard widget: Countdowns"],
    ["widgetTerm","Dashboard widget: Term progress"],["widgetNote","Dashboard widget: Quick note"],
    ["pageHome","Page title: Home"],["pageCalendar","Page title: Calendar"],["pageTasks","Page title: Tasks"],
    ["pageTimetable","Page title: Timetable"],["pageAssignments","Page title: Assignments"],["pageExams","Page title: Exams"],
    ["pagePeriod","Page title: Period"],["pageNotes","Page title: Notes"],["pageThemes","Page title: Themes & Stickers"],["pageSettings","Page title: Settings"],
    ["tasksEyebrow","Tasks eyebrow"],["tasksHeader","Tasks header"],
    ["timetableEyebrow","Timetable eyebrow"],["timetableHeader","Timetable header"],
    ["assignmentsEyebrow","Assignments eyebrow"],["assignmentsHeader","Assignments header"],
    ["examsEyebrow","Exams eyebrow"],["examsHeader","Exams header"],
    ["periodEyebrow","Period eyebrow"],["periodHeader","Period header"],
    ["notesEyebrow","Notes eyebrow"],["notesHeader","Notes header"],
    ["themesEyebrow","Theme eyebrow"],["themesHeader","Theme header"],
    ["stickersEyebrow","Sticker eyebrow"],["stickersHeader","Sticker header"],
    ["termEyebrow","Term settings eyebrow"],["termHeader","Term settings header"],
    ["dataEyebrow","Data eyebrow"],["dataHeader","Data header"],
    ["labelsEyebrow","Label editor eyebrow"],["labelsHeader","Label editor header"],
    ["todayButton","Today button"],["quickAddButton","Quick add button"],
    ["quickEvent","Quick add: Event"],["quickTask","Quick add: Task"],["quickClass","Quick add: Class"],
    ["quickAssignment","Quick add: Assignment"],["quickExam","Quick add: Exam / Quiz"],["quickPeriod","Quick add: Period log"]
  ];
  editor.innerHTML=fields.map(([k,n])=>`<label>${n}<input type="text" data-label-input="${k}" value="${escapeHtml(label(k,""))}"></label>`).join("");
  $$("[data-label-input]").forEach(inp=>inp.addEventListener("input",e=>{
    data.labels[e.target.dataset.labelInput]=e.target.value;
    localStorage.setItem(KEY,JSON.stringify(data));
    applyLabels();
  }));
}


function load(){
  try{return {...structuredClone(seed),...JSON.parse(localStorage.getItem(KEY)||"{}")}}
  catch{return structuredClone(seed)}
}
function save(render=true){
  localStorage.setItem(KEY,JSON.stringify(data));
  if(render)renderAll();
  if(currentUser&&cloudReady) queueCloudSave();
}
function queueCloudSave(){
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer=setTimeout(()=>saveCloudData(),500);
}
async function saveCloudData(){
  if(!currentUser)return;
  const payload={...data};
  const {error}=await supabaseClient.from("planner_data").upsert({
    user_id:currentUser.id,
    data:payload,
    updated_at:new Date().toISOString()
  },{onConflict:"user_id"});
  if(error){
    $("#syncPill").textContent="● Sync error";
    console.error("Supabase save error:", error);
    toast(`Sync error: ${error.message || "Unknown error"}`);
    return false;
  }
  lastCloudUpdatedAt=new Date().toISOString();
  $("#syncPill").textContent="● Synced";
  return true;
}
async function loadCloudData(){
  if(!currentUser)return;
  $("#syncPill").textContent="● Syncing…";
  const {data:row,error}=await supabaseClient.from("planner_data").select("data,updated_at").eq("user_id",currentUser.id).maybeSingle();
  if(error){
    console.error("Supabase load error:", error);
    $("#syncPill").textContent="● Sync error";
    toast(`Sync error: ${error.message || "Unknown error"}`);
    return false;
  }
  if(row?.data){
    data={...structuredClone(seed),...row.data};
    localStorage.setItem(KEY,JSON.stringify(data));
    lastCloudUpdatedAt=row.updated_at||null;
    renderAll();
  }else{
    await saveCloudData();
  }
  cloudReady=true;
  $("#syncPill").textContent="● Synced";
  return true;
}
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const fmt=(d,o={})=>new Date(d+"T12:00:00").toLocaleDateString(undefined,o);
const dt=(date,time="00:00")=>new Date(`${date}T${time||"00:00"}:00`);
const escapeHtml=s=>(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),1600)}

function switchView(v){
  currentView=v;
  $$(".view").forEach(x=>x.classList.remove("active"));
  $(`#${v}View`)?.classList.add("active");
  $$(".nav-btn,[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===v));
  $("#pageTitle").textContent=({home:label("pageHome","Home"),calendar:label("pageCalendar","Calendar"),tasks:label("pageTasks","Tasks"),timetable:label("pageTimetable","Timetable"),assignments:label("pageAssignments","Assignments"),exams:label("pageExams","Exams"),period:label("pagePeriod","Period"),notes:label("pageNotes","Notes"),themes:label("pageThemes","Themes & Stickers"),settings:label("pageSettings","Settings")})[v]||v;
  $("#sidebar").classList.remove("open");
  renderAll();
}
function applyTheme(){
  data.theme.widgetColors=data.theme.widgetColors||{today:"#ffffff",tasks:"#ffffff",countdowns:"#ffffff",semester:"#ffffff",note:"#ffffff"};
  data.theme.hero=data.theme.hero||data.theme.accent||"#111827";
  const t=data.theme, root=document.documentElement;
  const presets={
    clean:{accent:"#111827",bg:"#f4f6f8",card:"#ffffff",sidebar:"#0f172a"},
    soft:{accent:"#8b5cf6",bg:"#faf7ff",card:"#ffffff",sidebar:"#4c1d95"},
    dark:{accent:"#e5e7eb",bg:"#111827",card:"#1f2937",sidebar:"#030712"},
    pixel:{accent:"#2563eb",bg:"#dbeafe",card:"#eff6ff",sidebar:"#172554"}
  };
  if(t.preset!=="custom"&&presets[t.preset]) Object.assign(t,presets[t.preset]);
  root.style.setProperty("--accent",t.accent);
  root.style.setProperty("--bg",t.bg);
  root.style.setProperty("--sidebar",t.sidebar||"#0f172a");
  const hex=t.card.replace("#","");
  const r=parseInt(hex.substring(0,2),16),g=parseInt(hex.substring(2,4),16),b=parseInt(hex.substring(4,6),16);
  root.style.setProperty("--card",`rgba(${r},${g},${b},${t.opacity/100})`);
  root.style.setProperty("--radius",`${t.radius}px`);
  root.style.setProperty("--wallpaper",t.wallpaper?`url("${t.wallpaper}")`:"none");
  root.style.setProperty("--text",t.text||"#111827");
  root.style.setProperty("--muted",t.muted||"#6b7280");
  root.style.setProperty("--line",t.line||"#e5e7eb");
  root.style.setProperty("--primary",t.primary||t.accent||"#111827");
  root.style.setProperty("--primary-text",t.primaryText||"#ffffff");
  root.style.setProperty("--sidebar-text",t.sidebarText||"#cbd5e1");
  root.style.setProperty("--sidebar-active",t.sidebarActive||"#1e293b");
  root.style.setProperty("--mobile-bar",t.mobileBar||"#ffffff");
  root.style.setProperty("--calendar-line",t.calendarLine||t.line||"#e5e7eb");
  root.style.setProperty("--chat-fab",t.chatFab||t.accent||"#111827");
  document.body.style.color=t.text||"#111827";
  document.documentElement.style.setProperty("--bg",t.bg||"#f4f6f8");
  document.documentElement.style.setProperty("--sidebar",t.sidebar||"#0f172a");
  const logo=$("#brandLogo"), logoImg=$("#brandLogoImage"), logoText=$("#brandLogoText");
  if(t.icon){
    logoImg.src=t.icon; logoImg.classList.remove("hidden"); logoText.classList.add("hidden"); logo.classList.add("custom-image");
  }else{
    logoImg.classList.add("hidden"); logoText.classList.remove("hidden"); logo.classList.remove("custom-image");
  }

  root.style.setProperty("--hero-color",t.hero||t.accent);
  document.querySelectorAll(".widget[data-widget]").forEach(w=>{
    const c=t.widgetColors?.[w.dataset.widget];
    if(c){
      const h=c.replace("#","");
      const rr=parseInt(h.slice(0,2),16),gg=parseInt(h.slice(2,4),16),bb=parseInt(h.slice(4,6),16);
      w.style.setProperty("--widget-bg",`rgba(${rr},${gg},${bb},${t.opacity/100})`);
    }
  });

  $("#themePreset").value=t.preset;
  $("#accentColor").value=t.accent; $("#bgColor").value=t.bg; $("#cardColor").value=t.card;
  $("#radiusRange").value=t.radius; $("#opacityRange").value=t.opacity;
}
function relevantItemsForDate(date){
  const weekday=new Date(date+"T12:00:00").getDay();
  return data.items.filter(i=>{
    if(i.type==="class"&&i.repeat==="weekly") return Number(i.weekday)===weekday;
    return i.date===date;
  }).sort((a,b)=>(a.time||"99:99").localeCompare(b.time||"99:99"));
}
function getUpcoming(){
  const now=new Date();
  return data.items.filter(i=>i.date&&dt(i.date,i.time||"23:59")>=now).sort((a,b)=>dt(a.date,a.time)-dt(b.date,b.time));
}
function semesterInfo(){
  const s=data.semester;
  if(!s.start||!s.end)return {pct:0,week:"Not configured"};
  const now=new Date(),start=new Date(s.start+"T00:00:00"),end=new Date(s.end+"T23:59:59");
  const pct=Math.max(0,Math.min(100,Math.round((now-start)/(end-start)*100)));
  const week=Math.max(1,Math.ceil((now-start)/(7*86400000)));
  return {pct,week:`Week ${week}`};
}
function renderHome(){
  const now=new Date(),hour=now.getHours();
  $("#greeting").textContent=hour<12?"Good morning.":hour<18?"Good afternoon.":"Good evening.";
  $("#heroDate").textContent=now.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  $("#semesterLabel").textContent=data.semester.name||"TERM";
  const up=getUpcoming()[0];
  $("#nextEventText").textContent=up?`${up.title}${up.time?" · "+up.time:""}`:"Nothing scheduled";
  const si=semesterInfo(); $("#weekText").textContent=si.week; $("#semesterPct").textContent=`${si.pct}%`;$("#semesterWeek").textContent=si.week;$("#semesterProgress").style.width=`${si.pct}%`;

  const agenda=relevantItemsForDate(todayKey()).filter(i=>["class","event","exam","assignment"].includes(i.type));
  $("#todayAgenda").innerHTML=agenda.length?agenda.map(i=>`<div class="agenda-row"><div class="time-chip">${i.time||"All day"}</div><div class="row-main"><strong>${escapeHtml(i.title)}</strong><span>${escapeHtml(i.category||i.type)}</span></div><span class="dot" style="--item:${i.color||COLORS[i.type]||COLORS.personal}"></span></div>`).join(""):`<div class="muted">Nothing scheduled today.</div>`;

  const tasks=data.items.filter(i=>i.type==="task"&&!i.done).sort((a,b)=>(a.date||"9999").localeCompare(b.date||"9999")).slice(0,5);
  $("#homeTasks").innerHTML=tasks.length?tasks.map(i=>`<div class="mini-row"><input class="task-check" type="checkbox" data-toggle-task="${i.id}"><div class="row-main"><strong>${escapeHtml(i.title)}</strong><span>${i.date?fmt(i.date,{month:"short",day:"numeric"}):"No due date"}</span></div><span class="badge ${i.priority||"medium"}">${i.priority||"medium"}</span></div>`).join(""):`<div class="muted">No open tasks.</div>`;

  const counts=getUpcoming().filter(i=>["exam","assignment","event"].includes(i.type)).slice(0,3);
  $("#countdowns").innerHTML=counts.length?counts.map(i=>{const d=Math.ceil((dt(i.date,i.time||"23:59")-new Date())/86400000);return `<div class="countdown"><strong>${Math.max(0,d)}d</strong><span>${escapeHtml(i.title)}</span></div>`}).join(""):`<div class="muted">Add an exam or deadline.</div>`;
  $("#quickNote").value=data.quickNote||"";
  renderStickerCanvas();
  reorderDashboard();
}
function reorderDashboard(){
  const grid=$("#dashboardGrid");
  data.dashboardOrder.forEach(k=>{const el=grid.querySelector(`[data-widget="${k}"]`);if(el)grid.appendChild(el)});
}
function renderTasks(){
  let items=data.items.filter(i=>i.type==="task");
  if(taskFilter==="open")items=items.filter(i=>!i.done); if(taskFilter==="done")items=items.filter(i=>i.done);
  items.sort((a,b)=>(a.done-b.done)||((a.date||"9999").localeCompare(b.date||"9999")));
  $("#tasksList").innerHTML=items.length?items.map(i=>`<div class="list-row"><input class="task-check" data-toggle-task="${i.id}" type="checkbox" ${i.done?"checked":""}><div class="row-main"><strong style="${i.done?"text-decoration:line-through;color:#9ca3af":""}">${escapeHtml(i.title)}</strong><span>${i.date?fmt(i.date,{weekday:"short",month:"short",day:"numeric"}):"No date"}${i.time?" · "+i.time:""}</span></div><button class="ghost-btn" data-edit="${i.id}">Edit</button></div>`).join(""):`<div class="muted">No tasks yet.</div>`;
}
function renderAssignments(){
  const items=data.items.filter(i=>i.type==="assignment").sort((a,b)=>(a.date||"9999").localeCompare(b.date||"9999"));
  $("#assignmentsList").innerHTML=items.length?items.map(i=>`<article class="info-card"><div class="eyebrow">${escapeHtml(i.module||"ASSIGNMENT")}</div><h3>${escapeHtml(i.title)}</h3><p>Due ${i.date?fmt(i.date,{weekday:"short",month:"short",day:"numeric"}):"—"} ${i.time||""}</p><p>${i.weight?`Weight: ${escapeHtml(i.weight)}`:""} ${i.status?`· ${escapeHtml(i.status)}`:""}</p><div class="big-number">${i.progress||0}%</div><button class="ghost-btn" data-edit="${i.id}">Edit</button></article>`).join(""):`<div class="muted">No assignments yet.</div>`;
}
function renderExams(){
  const items=data.items.filter(i=>i.type==="exam").sort((a,b)=>(a.date||"9999").localeCompare(b.date||"9999"));
  $("#examList").innerHTML=items.length?items.map(i=>{const days=i.date?Math.ceil((dt(i.date,i.time||"23:59")-new Date())/86400000):null;return `<article class="info-card"><div class="eyebrow">${escapeHtml(i.module||"EXAM")}</div><h3>${escapeHtml(i.title)}</h3><p>${i.date?fmt(i.date,{weekday:"long",month:"short",day:"numeric"}):"No date"} ${i.time||""}</p><p>${escapeHtml(i.location||"")}</p><div class="big-number">${days===null?"—":Math.max(0,days)+"d"}</div><button class="ghost-btn" data-edit="${i.id}">Edit</button></article>`}).join(""):`<div class="muted">No exams or quizzes yet.</div>`;
}
function renderTimetable(){
  const times=["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];
  let html=`<div class="tt-cell tt-head">Time</div>${["Mon","Tue","Wed","Thu","Fri"].map(x=>`<div class="tt-cell tt-head">${x}</div>`).join("")}`;
  for(const time of times){
    html+=`<div class="tt-cell">${time}</div>`;
    for(let day=1;day<=5;day++){
      const items=data.items.filter(i=>i.type==="class"&&Number(i.weekday)===day&&i.time===time);
      html+=`<div class="tt-cell">${items.map(i=>`<div class="tt-class" style="--item:${i.color||COLORS.class}" data-edit="${i.id}"><strong>${escapeHtml(i.title)}</strong><br>${escapeHtml(i.location||"")}</div>`).join("")}</div>`;
    }
  }
  $("#timetableGrid").innerHTML=html;
}
function renderPeriod(){
  const logs=[...data.periodLogs].sort((a,b)=>b.start.localeCompare(a.start));
  const last=logs[0];
  $("#lastPeriodStart").textContent=last?fmt(last.start,{month:"short",day:"numeric",year:"numeric"}):"—";
  $("#cycleLengthText").textContent=`${data.settings.cycleLength||28} days`;
  if(last){const d=new Date(last.start+"T12:00:00");d.setDate(d.getDate()+(data.settings.cycleLength||28));$("#nextPeriodText").textContent=d.toLocaleDateString(undefined,{month:"short",day:"numeric"})}else $("#nextPeriodText").textContent="—";
  $("#periodLogs").innerHTML=logs.length?logs.map(l=>`<div class="list-row"><div class="row-main"><strong>${fmt(l.start,{month:"long",day:"numeric"})}${l.end?" – "+fmt(l.end,{month:"short",day:"numeric"}):""}</strong><span>${escapeHtml(l.flow||"")} ${l.notes?"· "+escapeHtml(l.notes):""}</span></div></div>`).join(""):`<div class="muted">No period logs yet.</div>`;
}
function mondayOf(d){const x=new Date(d);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);x.setHours(12,0,0,0);return x}
function dateKeyLocal(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function renderCalendar(){
  const body=$("#calendarBody");
  $("[data-calview].active")?.classList.remove("active");$(`[data-calview="${calendarView}"]`)?.classList.add("active");
  if(calendarView==="week"){
    const mon=mondayOf(calCursor), days=[...Array(7)].map((_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return d});
    $("#calendarTitle").textContent=`${days[0].toLocaleDateString(undefined,{month:"short",day:"numeric"})} – ${days[6].toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}`;
    const hours=[...Array(14)].map((_,i)=>i+7);
    let html=`<div class="week-grid"><div class="week-head"></div>${days.map(d=>`<div class="week-head">${d.toLocaleDateString(undefined,{weekday:"short"})}<br>${d.getDate()}</div>`).join("")}`;
    for(const h of hours){
      html+=`<div class="time-col">${String(h).padStart(2,"0")}:00</div>`;
      for(const d of days){
        const key=dateKeyLocal(d), items=relevantItemsForDate(key).filter(i=>Number((i.time||"99").slice(0,2))===h);
        html+=`<div class="day-col-cell">${items.map(i=>`<div class="event-block" style="top:3px;height:50px;--event-color:${i.color||COLORS[i.type]||COLORS.personal}" data-edit="${i.id}"><strong>${escapeHtml(i.title)}</strong><br>${i.time||""}</div>`).join("")}</div>`;
      }
    } html+=`</div>`; body.innerHTML=html;
  }else if(calendarView==="month"){
    const y=calCursor.getFullYear(),m=calCursor.getMonth(),first=new Date(y,m,1),offset=(first.getDay()+6)%7,start=new Date(y,m,1-offset);
    $("#calendarTitle").textContent=calCursor.toLocaleDateString(undefined,{month:"long",year:"numeric"});
    let html=`<div class="month-grid">${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(x=>`<div class="week-head">${x}</div>`).join("")}`;
    for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const key=dateKeyLocal(d),items=relevantItemsForDate(key);html+=`<div class="month-day ${d.getMonth()!==m?"muted":""} ${key===todayKey()?"today":""}"><div class="month-num">${d.getDate()}</div>${items.slice(0,4).map(it=>`<button class="month-event" data-edit="${it.id}">${escapeHtml(it.title)}</button>`).join("")}</div>`}html+="</div>";body.innerHTML=html;
  }else{
    const key=dateKeyLocal(calCursor);$("#calendarTitle").textContent=calCursor.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"});
    let html=`<div class="day-view">`;for(let h=7;h<=22;h++){const items=relevantItemsForDate(key).filter(i=>Number((i.time||"99").slice(0,2))===h);html+=`<div class="day-hour">${String(h).padStart(2,"0")}:00</div><div class="day-slot">${items.map(i=>`<div class="event-block" style="top:3px;height:50px;--event-color:${i.color||COLORS[i.type]||COLORS.personal}" data-edit="${i.id}"><strong>${escapeHtml(i.title)}</strong> ${i.time||""}</div>`).join("")}</div>`}html+="</div>";body.innerHTML=html;
  }
}
function renderStickers(){
  $("#stickerLibrary").innerHTML=data.stickers.length?data.stickers.map(s=>`<button class="sticker-thumb" data-place-sticker="${s.id}"><img src="${s.src}" alt=""></button>`).join(""):`<div class="muted">No stickers uploaded yet.</div>`;
}
function renderStickerCanvas(){
  const canvas=$("#stickerCanvas");canvas.innerHTML="";
  data.stickerInstances.forEach(s=>{const asset=data.stickers.find(a=>a.id===s.assetId);if(!asset)return;const el=document.createElement("div");el.className="sticker-instance";el.dataset.instance=s.id;el.style.left=s.x+"px";el.style.top=s.y+"px";el.style.width=(s.w||90)+"px";el.innerHTML=`<img src="${asset.src}">`;canvas.appendChild(el); makeStickerDraggable(el,s)})
}
function makeStickerDraggable(el,obj){
  let sx,sy,ox,oy;
  const start=e=>{const p=e.touches?e.touches[0]:e;sx=p.clientX;sy=p.clientY;ox=obj.x;oy=obj.y;dragSticker={el,obj,sx,sy,ox,oy};e.preventDefault()};
  el.addEventListener("mousedown",start);el.addEventListener("touchstart",start,{passive:false});
  el.addEventListener("dblclick",()=>{data.stickerInstances=data.stickerInstances.filter(x=>x.id!==obj.id);save();});
}
window.addEventListener("mousemove",e=>moveSticker(e));window.addEventListener("touchmove",e=>moveSticker(e),{passive:false});window.addEventListener("mouseup",endSticker);window.addEventListener("touchend",endSticker);
function moveSticker(e){if(!dragSticker)return;const p=e.touches?e.touches[0]:e;const dx=p.clientX-dragSticker.sx,dy=p.clientY-dragSticker.sy;dragSticker.obj.x=Math.max(0,dragSticker.ox+dx);dragSticker.obj.y=Math.max(0,dragSticker.oy+dy);dragSticker.el.style.left=dragSticker.obj.x+"px";dragSticker.el.style.top=dragSticker.obj.y+"px";if(e.cancelable)e.preventDefault()}
function endSticker(){if(dragSticker){localStorage.setItem(KEY,JSON.stringify(data));dragSticker=null}}
function renderSettings(){
  $("#semesterName").value=data.semester.name||"";
  $("#semesterStart").value=data.semester.start||"";
  $("#semesterEnd").value=data.semester.end||"";
  $("#notesArea").value=data.notes||"";
  if($("#heroColor")) $("#heroColor").value=data.theme.hero||data.theme.accent;
  $$("[data-widget-color]").forEach(inp=>{
    inp.value=data.theme.widgetColors?.[inp.dataset.widgetColor]||"#ffffff";
  });
  $$("[data-color-key]").forEach(inp=>{
    const k=inp.dataset.colorKey;
    inp.value=data.theme[k]||({bg:"#f4f6f8",sidebar:"#0f172a",text:"#111827",muted:"#6b7280",line:"#e5e7eb",accent:"#111827",primary:"#111827",primaryText:"#ffffff",sidebarText:"#cbd5e1",sidebarActive:"#1e293b",mobileBar:"#ffffff",calendarLine:"#e5e7eb",chatFab:"#111827",hero:"#111827"}[k]);
  });
}

let authMode="signin";

function updateAuthBrand(){
  if($("#authTitle")) $("#authTitle").textContent=label("brandTitle","我的一天 ♡");
  if($("#authSubtitle")) $("#authSubtitle").textContent=label("brandSubtitle","我的小小生活簿 ✿");
  const img=$("#authLogoImage"),txt=$("#authLogoText");
  if(data.theme?.icon){
    img.src=data.theme.icon;img.classList.remove("hidden");txt.classList.add("hidden");
  }else{
    img.classList.add("hidden");txt.classList.remove("hidden");
  }
}

function showAuth(){
  updateAuthBrand();
  $("#authScreen").classList.remove("hidden");
}
function hideAuth(){
  $("#authScreen").classList.add("hidden");
}
function setAuthMode(mode){
  authMode=mode;
  $$("[data-auth-tab]").forEach(b=>b.classList.toggle("active",b.dataset.authTab===mode));
  $("#authSubmit").textContent=mode==="signin"?"Sign in":"Create account";
  $("#authMessage").textContent="";
}
async function initAuth(){
  const {data:{session}}=await supabaseClient.auth.getSession();
  if(session?.user){
    currentUser=session.user;
    hideAuth();
    await loadCloudData();
  }else{
    showAuth();
  }
  supabaseClient.auth.onAuthStateChange(async(event,session)=>{
    if(session?.user){
      currentUser=session.user;
      hideAuth();
      await loadCloudData();
    }else{
      currentUser=null;
      cloudReady=false;
      $("#syncPill").textContent="● Signed out";
      showAuth();
    }
  });
}

function renderAll(){
  applyTheme();
  applyLabels();
  renderHome();
  renderTasks();
  renderAssignments();
  renderExams();
  renderTimetable();
  renderPeriod();
  renderCalendar();
  renderStickers();
  renderSettings();
  renderLabelEditor();
  document.body.classList.toggle("privacy",!!data.settings.privacy); updateAuthBrand();
}

function openQuick(){ $("#quickModal").classList.remove("hidden") }
function closeModals(){ $$(".modal-backdrop").forEach(m=>m.classList.add("hidden")) }
function field(name,label,type="text",value="",extra=""){return `<label>${label}<input name="${name}" type="${type}" value="${escapeHtml(value)}" ${extra}></label>`}
function selectField(name,label,opts,val){return `<label>${label}<select name="${name}">${opts.map(o=>`<option value="${o}" ${o===val?"selected":""}>${o}</option>`).join("")}</select></label>`}
function openEditor(type,item=null){
  closeModals();$("#editorModal").classList.remove("hidden");$("#editorTitle").textContent=item?`Edit ${type}`:`New ${type}`;$("#editorEyebrow").textContent=item?"EDIT":"ADD";
  const v=item||{}; let html=`<input type="hidden" name="id" value="${v.id||""}"><input type="hidden" name="type" value="${type}"><div class="editor-grid">`;
  if(["event","task","class","assignment","exam"].includes(type)) html+=field("title","Title","text",v.title||"","required");
  if(type==="event"){
    html+=selectField("category","Category",["Personal","Appointment","Birthday","CCA","Study","Work","Other"],v.category||"Personal")+field("date","Date","date",v.date||todayKey(),"required")+field("time","Start time","time",v.time||"")+field("endTime","End time","time",v.endTime||"")+field("location","Location","text",v.location||"")+`<label>Colour<input name="color" type="color" value="${v.color||COLORS.event}"></label>`;
  }
  if(type==="task"){
    html+=field("date","Due date","date",v.date||"")+field("time","Due time","time",v.time||"")+selectField("priority","Priority",["low","medium","high"],v.priority||"medium")+selectField("category","Category",["School","Personal","CCA","Health","Other"],v.category||"School")+`<label class="full">Notes<textarea name="notes" rows="4">${escapeHtml(v.notes||"")}</textarea></label>`;
  }
  if(type==="class"){
    html+=field("module","Module / code","text",v.module||"")+selectField("weekday","Weekday",["1","2","3","4","5","6","0"],String(v.weekday??1))+field("time","Start time","time",v.time||"09:00","required")+field("endTime","End time","time",v.endTime||"11:00")+field("location","Room / location","text",v.location||"")+field("lecturer","Lecturer","text",v.lecturer||"")+`<label>Colour<input name="color" type="color" value="${v.color||COLORS.class}"></label><input type="hidden" name="repeat" value="weekly">`;
  }
  if(type==="assignment"){
    html+=field("module","Module / code","text",v.module||"")+field("date","Due date","date",v.date||todayKey(),"required")+field("time","Due time","time",v.time||"23:59")+field("weight","Weightage","text",v.weight||"")+selectField("status","Status",["Not Started","In Progress","Reviewing","Submitted"],v.status||"Not Started")+field("progress","Progress %","number",String(v.progress??0),'min="0" max="100"')+`<label class="full">Notes<textarea name="notes" rows="4">${escapeHtml(v.notes||"")}</textarea></label>`;
  }
  if(type==="exam"){
    html+=field("module","Module / code","text",v.module||"")+field("date","Date","date",v.date||todayKey(),"required")+field("time","Start time","time",v.time||"09:00")+field("endTime","End time","time",v.endTime||"")+field("location","Venue","text",v.location||"")+field("weight","Weightage","text",v.weight||"")+`<label class="full">Topics<textarea name="topics" rows="4">${escapeHtml(v.topics||"")}</textarea></label>`;
  }
  if(type==="period"){
    html+=field("start","Start date","date",v.start||todayKey(),"required")+field("end","End date","date",v.end||"")+selectField("flow","Flow",["Light","Medium","Heavy"],v.flow||"Medium")+`<label class="full">Symptoms / notes<textarea name="notes" rows="4">${escapeHtml(v.notes||"")}</textarea></label>`;
  }
  html+=`</div><div class="modal-actions">${item?`<button type="button" class="danger-btn" id="deleteItem">Delete</button>`:""}<div class="spacer"></div><button type="button" class="ghost-btn editor-close">Cancel</button><button class="primary-btn" type="submit">Save</button></div>`;
  $("#editorForm").innerHTML=html;
  if(item)$("#deleteItem").onclick=()=>{if(type==="period")data.periodLogs=data.periodLogs.filter(x=>x.id!==item.id);else data.items=data.items.filter(x=>x.id!==item.id);save();closeModals();toast("Deleted")};
}
$("#editorForm").addEventListener("submit",e=>{e.preventDefault();const fd=Object.fromEntries(new FormData(e.currentTarget).entries());const type=fd.type,id=fd.id||uid();delete fd.type;delete fd.id;if(type==="period"){const obj={id,...fd};const idx=data.periodLogs.findIndex(x=>x.id===id);if(idx>=0)data.periodLogs[idx]=obj;else data.periodLogs.push(obj)}else{const existing=data.items.find(x=>x.id===id);const obj={id,type,done:existing?.done||false,...fd};if(type==="class")obj.weekday=Number(obj.weekday);if(type==="assignment")obj.progress=Number(obj.progress||0);const idx=data.items.findIndex(x=>x.id===id);if(idx>=0)data.items[idx]=obj;else data.items.push(obj)}save();closeModals();toast("Saved")});

function plannerAnswer(q){
  const s=q.toLowerCase().trim(), tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);const tkey=dateKeyLocal(tomorrow);
  if(s.includes("tomorrow")){const items=relevantItemsForDate(tkey);return items.length?`Tomorrow you have: ${items.map(i=>`${i.time||"all day"} ${i.title}`).join("; ")}.`:"You have nothing scheduled tomorrow."}
  if(s.includes("next exam")||s.includes("next quiz")){const i=getUpcoming().find(x=>x.type==="exam");return i?`Your next exam is ${i.title} on ${fmt(i.date,{weekday:"long",month:"long",day:"numeric"})}${i.time?` at ${i.time}`:""}.`:"You have no upcoming exams saved."}
  if(s.includes("due this week")||s.includes("tasks this week")){const now=new Date(),end=new Date();end.setDate(end.getDate()+7);const arr=data.items.filter(i=>["task","assignment"].includes(i.type)&&i.date&&dt(i.date,i.time||"23:59")>=now&&dt(i.date,i.time||"23:59")<=end&&!i.done);return arr.length?`Due in the next 7 days: ${arr.map(i=>`${i.title} (${fmt(i.date,{month:"short",day:"numeric"})})`).join("; ")}.`:"Nothing is due in the next 7 days."}
  if(s.includes("today")){const arr=relevantItemsForDate(todayKey());return arr.length?`Today: ${arr.map(i=>`${i.time||"all day"} ${i.title}`).join("; ")}.`:"You have nothing scheduled today."}
  if(s.includes("free")||s.includes("available")) return "Free-time finding is planned for the cloud-enabled build. I can currently read your saved events, tasks, classes, exams and deadlines.";
  return "I can currently answer about today, tomorrow, your next exam, and tasks due this week. The AI-connected version can later understand broader natural-language requests.";
}

document.addEventListener("click",e=>{
  const v=e.target.closest("[data-view]")?.dataset.view;if(v){switchView(v);return}
  const create=e.target.closest("[data-create]")?.dataset.create;if(create){openEditor(create);return}
  const edit=e.target.closest("[data-edit]")?.dataset.edit;if(edit){const item=data.items.find(x=>x.id===edit)||data.periodLogs.find(x=>x.id===edit);if(item)openEditor(item.start?"period":item.type,item);return}
  const toggle=e.target.closest("[data-toggle-task]")?.dataset.toggleTask;if(toggle){const i=data.items.find(x=>x.id===toggle);if(i){i.done=!i.done;save()}return}
  const sticker=e.target.closest("[data-place-sticker]")?.dataset.placeSticker;if(sticker){data.stickerInstances.push({id:uid(),assetId:sticker,x:40,y:180,w:90});save();switchView("home");toast("Sticker added — drag it anywhere");return}
  if(e.target.classList.contains("modal-close")||e.target.classList.contains("editor-close"))closeModals();
});
$("#quickAddBtn").onclick=openQuick;$("#mobileQuickAdd").onclick=openQuick;$("#mobileAddBtn").onclick=openQuick;$("#menuBtn").onclick=()=>$("#sidebar").classList.toggle("open");
$("#todayBtn").onclick=()=>{calCursor=new Date();switchView("home")};
$$("[data-calview]").forEach(b=>b.onclick=()=>{calendarView=b.dataset.calview;renderCalendar()});
$("#calPrev").onclick=()=>{if(calendarView==="month")calCursor.setMonth(calCursor.getMonth()-1);else calCursor.setDate(calCursor.getDate()-(calendarView==="week"?7:1));renderCalendar()};
$("#calNext").onclick=()=>{if(calendarView==="month")calCursor.setMonth(calCursor.getMonth()+1);else calCursor.setDate(calCursor.getDate()+(calendarView==="week"?7:1));renderCalendar()};
$("#calToday").onclick=()=>{calCursor=new Date();renderCalendar()};
$$("[data-taskfilter]").forEach(b=>b.onclick=()=>{taskFilter=b.dataset.taskfilter;$$("[data-taskfilter]").forEach(x=>x.classList.toggle("active",x===b));renderTasks()});
$("#quickNote").addEventListener("input",e=>{data.quickNote=e.target.value;localStorage.setItem(KEY,JSON.stringify(data))});
$("#notesArea").addEventListener("input",e=>{data.notes=e.target.value;localStorage.setItem(KEY,JSON.stringify(data))});
$("#privacyToggle").onclick=()=>{data.settings.privacy=!data.settings.privacy;save();toast(data.settings.privacy?"Privacy mode on":"Privacy mode off")};
$("#saveSemester").onclick=()=>{data.semester={name:$("#semesterName").value,start:$("#semesterStart").value,end:$("#semesterEnd").value};save();toast("Term saved")};
$("#themePreset").onchange=e=>{data.theme.preset=e.target.value;save()};
$("#accentColor").oninput=e=>{data.theme.preset="custom";data.theme.accent=e.target.value;save()};
$("#bgColor").oninput=e=>{data.theme.preset="custom";data.theme.bg=e.target.value;save()};
$("#cardColor").oninput=e=>{data.theme.preset="custom";data.theme.card=e.target.value;save()};
$("#radiusRange").oninput=e=>{data.theme.radius=Number(e.target.value);save()};
$("#opacityRange").oninput=e=>{data.theme.opacity=Number(e.target.value);save()};

$$("[data-color-key]").forEach(inp=>inp.oninput=e=>{
  const k=e.target.dataset.colorKey;
  data.theme.preset="custom";
  data.theme[k]=e.target.value;
  if(k==="accent" && !data.theme.primary) data.theme.primary=e.target.value;
  save();
});
$$("[data-widget-color]").forEach(inp=>inp.oninput=e=>{
  data.theme.widgetColors=data.theme.widgetColors||{};
  data.theme.widgetColors[e.target.dataset.widgetColor]=e.target.value;
  save();
});
if($("#heroColor")) $("#heroColor").oninput=e=>{data.theme.hero=e.target.value;save()};
if($("#resetWidgetColours")) $("#resetWidgetColours").onclick=()=>{
  data.theme.widgetColors={today:"#ffffff",tasks:"#ffffff",countdowns:"#ffffff",semester:"#ffffff",note:"#ffffff"};
  data.theme.hero=data.theme.accent;
  save();
  toast("Dashboard colours reset");
};

function readFileData(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
$("#wallpaperInput").onchange=async e=>{const f=e.target.files[0];if(f){data.theme.wallpaper=await readFileData(f);save();toast("Wallpaper applied")}};
if($("#iconInput")) $("#iconInput").onchange=async e=>{
  const f=e.target.files[0];
  if(f){data.theme.icon=await readFileData(f);save();toast("Custom icon applied")}
};
if($("#clearIcon")) $("#clearIcon").onclick=()=>{data.theme.icon=null;save();toast("Custom icon removed")};

$("#clearWallpaper").onclick=()=>{data.theme.wallpaper=null;save()};
$("#stickerInput").onchange=async e=>{for(const f of e.target.files){data.stickers.push({id:uid(),name:f.name,src:await readFileData(f)})}save();toast("Stickers uploaded")};
$("#exportData").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download=`life-planner-backup-${todayKey()}.json`;a.click();URL.revokeObjectURL(a.href)};
$("#importData").onchange=async e=>{try{data={...structuredClone(seed),...JSON.parse(await e.target.files[0].text())};save();toast("Backup imported")}catch{toast("Invalid backup file")}};
$("#resetData").onclick=()=>{if(confirm("Reset all local planner data on this device?")){data=structuredClone(seed);save();toast("Local data reset")}};
if($("#resetLabels")) $("#resetLabels").onclick=()=>{
  data.labels=structuredClone(DEFAULT_LABELS);
  save();
  toast("Labels reset to English");
};


$("#chatFab").onclick=()=>$("#chatPanel").classList.toggle("hidden");$("#closeChat").onclick=()=>$("#chatPanel").classList.add("hidden");
$("#chatForm").onsubmit=e=>{e.preventDefault();const inp=$("#chatInput"),q=inp.value.trim();if(!q)return;$("#chatMessages").insertAdjacentHTML("beforeend",`<div class="chat-msg user">${escapeHtml(q)}</div>`);inp.value="";setTimeout(()=>{$("#chatMessages").insertAdjacentHTML("beforeend",`<div class="chat-msg bot">${escapeHtml(plannerAnswer(q))}</div>`);$("#chatMessages").scrollTop=$("#chatMessages").scrollHeight},120)};

let draggedWidget=null;
$$(".widget").forEach(w=>{w.draggable=true;w.addEventListener("dragstart",()=>draggedWidget=w);w.addEventListener("dragover",e=>e.preventDefault());w.addEventListener("drop",e=>{e.preventDefault();if(!draggedWidget||draggedWidget===w)return;const grid=$("#dashboardGrid");grid.insertBefore(draggedWidget,w);data.dashboardOrder=[...grid.querySelectorAll(".widget")].map(x=>x.dataset.widget);localStorage.setItem(KEY,JSON.stringify(data))})});


$$("[data-auth-tab]").forEach(b=>b.onclick=()=>setAuthMode(b.dataset.authTab));
$("#authForm").onsubmit=async e=>{
  e.preventDefault();
  const email=$("#authEmail").value.trim();
  const password=$("#authPassword").value;
  $("#authMessage").textContent="";
  $("#authSubmit").disabled=true;
  try{
    if(authMode==="signup"){
      const {data:res,error}=await supabaseClient.auth.signUp({email,password});
      if(error) throw error;
      if(res.session){
        currentUser=res.user;
        hideAuth();
        await loadCloudData();
      }else{
        $("#authMessage").style.color="#047857";
        $("#authMessage").textContent="Account created. Check your email if confirmation is required.";
      }
    }else{
      const {data:res,error}=await supabaseClient.auth.signInWithPassword({email,password});
      if(error) throw error;
      currentUser=res.user;
      hideAuth();
      await loadCloudData();
    }
  }catch(err){
    $("#authMessage").style.color="#b91c1c";
    $("#authMessage").textContent=err.message||"Sign-in failed";
  }finally{
    $("#authSubmit").disabled=false;
  }
};

if($("#syncDiagBtn")) $("#syncDiagBtn").onclick=async()=>{
  const {data:{session},error:sessionError}=await supabaseClient.auth.getSession();
  let msg="";
  if(sessionError) msg+=`Session error: ${sessionError.message}\n`;
  msg+=`Signed in: ${!!session?.user}\n`;
  if(session?.user) msg+=`User ID: ${session.user.id}\n`;
  const test=await supabaseClient.from("planner_data").select("user_id,updated_at").limit(1);
  if(test.error) msg+=`Table test error: ${test.error.message}\nCode: ${test.error.code||"n/a"}\nDetails: ${test.error.details||"n/a"}\nHint: ${test.error.hint||"n/a"}`;
  else msg+=`Table test: OK`;
  alert(msg);
};

if($("#signOutBtn")) $("#signOutBtn").onclick=async()=>{
  await supabaseClient.auth.signOut();
  toast("Signed out");
};
if($("#syncNowBtn")) $("#syncNowBtn").onclick=async()=>{
  if(!currentUser){showAuth();return}
  const ok=await loadCloudData();
  if(ok!==false) toast("Synced");
};

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
renderAll();
initAuth();
