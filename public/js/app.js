
(()=>{'use strict';
/* ===== Utilities ===== */
const $=(s,e=document)=>e.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n||0).toLocaleString('en-UG');
const ugx=n=>'UGX '+fmt(Math.round(n||0));
const pct=(a,b)=>b?Math.round(a/b*100):0;
const sum=a=>a.reduce((x,y)=>x+(+y||0),0);
const avg=a=>a.length?sum(a)/a.length:0;
const pad=(n,l=2)=>String(n).padStart(l,'0');
const isoD=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parseD=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(s,n)=>{const d=parseD(s);d.setDate(d.getDate()+n);return isoD(d)};
const TODAY=isoD(new Date());
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const fdate=s=>{if(!s)return '—';const d=parseD(s);return d.getDate()+' '+MONTHS[d.getMonth()].slice(0,3)+' '+d.getFullYear()};
const ageOf=s=>{const d=parseD(s),t=new Date();let a=t.getFullYear()-d.getFullYear();if(t<new Date(t.getFullYear(),d.getMonth(),d.getDate()))a--;return a};
const rng=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const hue=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))%360;return h};
const initials=n=>String(n).split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
const av=(name,cls='')=>`<span class="av ${cls}" style="background:hsl(${hue(name)} 42% 34%)">${esc(initials(name))}</span>`;
const pill=(t,k='')=>`<span class="pill ${k}">${esc(t)}</span>`;
const ICONS={
dash:'<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
students:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14.2c2.7.2 4.5 2.1 4.5 5"/>',
admissions:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 8v8M8 12h8"/>',
staff:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
classes:'<path d="M3 9l9-5 9 5-9 5-9-5z"/><path d="M7 11.5V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5"/>',
timetable:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
attendance:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12l3 3 5-6"/>',
exams:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
fees:'<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.7"/>',
library:'<path d="M4 4h5a3 3 0 013 3v13a2.5 2.5 0 00-2.5-2.5H4zM20 4h-5a3 3 0 00-3 3v13a2.5 2.5 0 012.5-2.5H20z"/>',
boarding:'<path d="M3 20V9l9-5 9 5v11"/><path d="M9 20v-6h6v6"/>',
welfare:'<path d="M12 21s-7.5-4.6-9-10a5 5 0 019-2.7A5 5 0 0121 11c-1.5 5.4-9 10-9 10z"/>',
comms:'<path d="M4 5h16v11H9l-5 4z"/>',
events:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
reports:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
plus:'<path d="M12 5v14M5 12h14"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
moon:'<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
download:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',back:'<path d="M15 5l-7 7 7 7"/>',check:'<path d="M5 12l4.5 4.5L19 7"/>'
};
const ic=n=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]||''}</svg>`;

/* ===== Grading (Uganda secondary) ===== */
const O_SCALE=[[80,'D1',1,'Distinction'],[70,'D2',2,'Distinction'],[65,'C3',3,'Credit'],[60,'C4',4,'Credit'],[55,'C5',5,'Credit'],[50,'C6',6,'Credit'],[45,'P7',7,'Pass'],[40,'P8',8,'Pass'],[0,'F9',9,'Fail']];
const A_SCALE=[[80,'A',6,'Excellent'],[70,'B',5,'Very good'],[60,'C',4,'Good'],[50,'D',3,'Fair'],[40,'E',2,'Pass'],[35,'O',1,'Subsidiary pass'],[0,'F',0,'Fail']];
const grade=(sc,lvl)=>{const t=lvl==='A'?A_SCALE:O_SCALE;for(const x of t)if(sc>=x[0])return{g:x[1],p:x[2],r:x[3]};return{g:'-',p:0,r:''}};
const gKind=g=>['D1','D2','A','B'].includes(g)?'ok':['C3','C4','C5','C6','C','D'].includes(g)?'info':['P7','P8','E','O'].includes(g)?'warn':'bad';

/* ===== Data ===== */
const UIKEY='walEduc.ui';
const ROLES={admin:'Administrator',head:'Head Teacher',dos:'Director of Studies',bursar:'Bursar',registrar:'Registrar',teacher:'Teacher',librarian:'Librarian',warden:'Warden / Matron',hrm:'Human Resource Manager',examoffice:'Examination Office',sickbay:'Sick Bay Attendant'};
const ROLE_LABEL={...ROLES,parent:'Parent / Guardian',student:'Learner'};
let S=null;
let saveT;const save=()=>{clearTimeout(saveT);saveT=setTimeout(()=>flush(),350)};
const NOTES=[];
const uid=p=>p+Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-3);
const log=a=>{NOTES.push(String(a).slice(0,280))};


const DEF_SUBJ={O:['English','Mathematics','Physics','Chemistry','Biology','History','Geography','CRE'],
  ARTS:['General Paper','Sub-ICT','History','Economics','Literature','Geography'],
  SCI:['General Paper','Sub-ICT','Physics','Chemistry','Biology','Mathematics']};
const defSubj=c=>c.level==='O'?DEF_SUBJ.O:(c.stream==='Sciences'?DEF_SUBJ.SCI:DEF_SUBJ.ARTS);
const DEF_TT={days:[0,1,2,3,4],slots:[{type:'lesson',from:'08:00',to:'08:40'},{type:'lesson',from:'08:40',to:'09:20'},{type:'lesson',from:'09:20',to:'10:00'},{type:'break',from:'10:00',to:'10:30',label:'BREAK'},{type:'lesson',from:'10:30',to:'11:10'},{type:'lesson',from:'11:10',to:'11:50'},{type:'lesson',from:'11:50',to:'12:30'},{type:'break',from:'12:30',to:'14:00',label:'LUNCH'},{type:'lesson',from:'14:00',to:'14:40'},{type:'lesson',from:'14:40',to:'15:20'}]};

function blankSchool(){return{name:'Pilkington College Muguluka',code:'PCM',address:'Muguluka, Jinja District, Uganda',motto:'',phone:'',email:'',po:'',head:'Head Teacher',year:2026,term:3,termStart:'2026-09-07',termEnd:'2026-12-04',nextTerm:'2027-02-01',badge:null,payInfo:''}}
function baseStructure(){
  const classes=[];
  for(let l=1;l<=4;l++)for(const s of['A','B'])classes.push({id:`S${l}${s}`,name:`S.${l} ${s}`,level:'O',form:l,stream:s,teacherId:null});
  classes.push({id:'S5ARTS',name:'S.5 Arts',level:'A',form:5,stream:'Arts',teacherId:null},{id:'S5SCI',name:'S.5 Sciences',level:'A',form:5,stream:'Sciences',teacherId:null},
    {id:'S6ARTS',name:'S.6 Arts',level:'A',form:6,stream:'Arts',teacherId:null},{id:'S6SCI',name:'S.6 Sciences',level:'A',form:6,stream:'Sciences',teacherId:null});
  const dorms=[{id:'d1',name:"Boys' Dormitory 1",sex:'M',cap:40},{id:'d2',name:"Boys' Dormitory 2",sex:'M',cap:40},{id:'d3',name:"Girls' Dormitory 1",sex:'F',cap:40},{id:'d4',name:"Girls' Dormitory 2",sex:'F',cap:40}];
  const subjects=[];classes.forEach(c=>defSubj(c).forEach(name=>subjects.push({id:c.id+'|'+name,classId:c.id,name,teacherId:'',periods:4})));
  return{classes,dorms,subjects};
}
function emptyState(){
  const b=baseStructure();
  return{v:2,sample:false,school:blankSchool(),classes:b.classes,dorms:b.dorms,subjects:b.subjects,students:[],staff:[],applicants:[],attendance:{},
    exams:[{id:'ex1',name:'Mid-Term',term:3,year:2026,status:'Open',published:false}],examcfg:[{id:'ex1',examId:'ex1',paperDeadline:'',marksOpen:false,marksDeadline:''}],marks:{},comments:{},tt:{},ttcfg:[{id:'main',...DEF_TT}],
    fees:{structure:{'O-Day':450000,'O-Boarding':900000,'A-Day':550000,'A-Boarding':1050000}},payments:[],expenses:[],
    books:[],loans:[],discipline:[],sickbay:[],events:[],notices:[],messages:[],hr:[],staffatt:[],misconduct:[],leaves:[],rollcall:[],examtt:[],placements:[],inbox:[],prn:[],papers:[],
    audit:[],users:[],recovery:null,seq:{adm:0,rct:0}};
}
function seedState(){
  const r=rng(2026),pick=a=>a[Math.floor(r()*a.length)],ri=(a,b)=>a+Math.floor(r()*(b-a+1));
  const st=emptyState();st.sample=true;
  const M=['Brian','Isaac','Joseph','Ronald','Emmanuel','Denis','Samuel','Peter','Moses','Allan','Timothy','Daniel','Kenneth','Ivan','Joel','Patrick','Collins','Derrick','Ibrahim','Hassan','Martin','Robert','Geoffrey','Shaban'];
  const F=['Esther','Grace','Racheal','Sarah','Joan','Faith','Mary','Ruth','Phiona','Prossy','Juliet','Winnie','Brenda','Immaculate','Gloria','Doreen','Patience','Shamim','Aisha','Lydia','Agnes','Irene','Christine','Diana'];
  const L=['Musoke','Kyeyune','Wandera','Isabirye','Mugoya','Waiswa','Batambuze','Kisakye','Nabirye','Namukose','Wakabi','Mukisa','Tumusiime','Opio','Atim','Byaruhanga','Kiiza','Mutesi','Nakato','Namwase','Kagimu','Lubega','Gimugu','Kyakuwa','Muwanguzi','Ssemwogerere','Nalubega','Baguma','Kasozi','Okello','Wasswa','Mwesigwa','Namutebi','Ochieng','Nankya','Lwanga'];
  const used=new Set();
  const person=sex=>{let n;do{n=pick(sex==='M'?M:F)+' '+pick(L)}while(used.has(n));used.add(n);return n};
  const phone=()=>'07'+pick(['00','01','74','75','72','76','78','70'])+pad(ri(0,999999),6);
  /* staff: the leadership and support team, then the teachers */
  const roles=[['Head Teacher','Administration',[]],['Deputy Head Teacher','Administration',['Deputy Headteacher']],['Director of Studies','Academics',[]],['Bursar','Finance',[]],['Registrar','Administration',[]],['Librarian','Support',[]],['Sick Bay Attendant','Support',[]],['Matron','Boarding',[]],['Warden','Boarding',[]],['Human Resource Manager','Administration',[]],['Examination Officer','Academics',[]]];
  roles.forEach((x,i)=>{const sex=['Matron','Sick Bay Attendant','Human Resource Manager'].includes(x[0])?'F':(i%2?'F':'M');st.staff.push({id:'t'+(i+1),name:person(sex),sex,role:x[0],type:'Non-teaching',dept:x[1],subjects:[],duties:x[2],phone:phone(),email:'',joined:`${ri(2008,2023)}-0${ri(1,9)}-1${ri(0,9)}`,status:'Active'})});
  const tsub=[['English'],['English','Literature'],['Mathematics'],['Mathematics','Sub-ICT'],['Physics'],['Physics','Mathematics'],['Chemistry'],['Chemistry'],['Biology'],['Biology'],['History'],['Geography'],['CRE','General Paper'],['Economics'],['Literature','General Paper'],['Sub-ICT'],['Geography','Economics'],['History','CRE']];
  tsub.forEach((s,i)=>{const sex=r()<.5?'M':'F';st.staff.push({id:'t'+(20+i),name:person(sex),sex,role:'Teacher',type:'Teaching',dept:s[0],subjects:s,duties:[],phone:phone(),email:'',joined:`${ri(2010,2025)}-0${ri(1,9)}-1${ri(0,9)}`,status:'Active'})});
  const teachers=st.staff.filter(s=>s.type==='Teaching');
  st.classes.forEach((c,i)=>c.teacherId=teachers[i%teachers.length].id);
  /* subjects and who teaches them */
  st.subjects.forEach(sb=>{const ci=st.classes.findIndex(c=>c.id===sb.classId),ts=teachers.filter(t=>t.subjects.includes(sb.name));if(ts.length)sb.teacherId=ts[ci%ts.length].id});
  /* students */
  const iso=d=>new Date(Date.now()+d*864e5).toISOString();
  st.exams=[{id:'ex1',name:'End of Term 2',term:2,year:2026,status:'Closed',published:true},{id:'ex2',name:'Mid-Term',term:3,year:2026,status:'Open',published:false}];
  st.examcfg=[{id:'ex1',examId:'ex1',paperDeadline:'',marksOpen:false,marksDeadline:''},{id:'ex2',examId:'ex2',paperDeadline:iso(3),marksOpen:true,marksDeadline:iso(6)}];
  let seq=0;
  st.classes.forEach(c=>{
    const n=c.level==='O'?10:8,subs=defSubj(c);
    for(let k=0;k<n;k++){
      const sex=r()<.5?'M':'F',name=person(sex).split(' '),age=11+c.form+(c.level==='A'?1:0);
      const board=r()<.45?'Boarding':'Day';
      const dorm=board==='Boarding'?pick(st.dorms.filter(d=>d.sex===sex)).id:'';
      seq++;
      const prev=pick(['Muguluka Primary School','Jinja Junior School','Kakira Primary','Buwenge Primary','St. Peter\'s Njeru']);
      const s={id:'s'+seq,adm:`PCM/${c.level==='A'&&c.form===6?2024:c.form===5?2025:2026-c.form+1}/${pad(seq,4)}`,first:name[0],last:name[1],sex,dob:`${2026-age}-${pad(ri(1,12))}-${pad(ri(1,28))}`,classId:c.id,boarding:board,dorm,status:'Active',
        guardian:{name:person(r()<.5?'M':'F'),phone:phone(),rel:pick(['Father','Mother','Guardian','Uncle','Aunt'])},address:pick(['Muguluka','Njeru','Bugembe','Walukuba','Mpumudde','Kakira','Budondo','Buwenge','Jinja Central','Masese']),medical:'',bursary:r()<.07?100000:0,arrears:r()<.15?ri(5,20)*10000:0,
        prevSchool:prev,appliedOn:`${2026-c.form}-11-${pad(ri(1,28))}`,admittedOn:`${2026-c.form}-12-${pad(ri(1,20))}`,ability:Math.min(88,Math.max(34,Math.round(60+(r()+r()+r()-1.5)*26)))};
      st.students.push(s);
    }
  });
  st.seq.adm=seq;
  /* marks, and the class each learner was in when they were entered */
  st.exams.forEach(ex=>{st.marks[ex.id]={};st.students.forEach(s=>{const c=st.classes.find(x=>x.id===s.classId);st.marks[ex.id][s.id]={};st.placements.push({id:ex.id+'|'+s.id,examId:ex.id,studentId:s.id,classId:s.classId});defSubj(c).forEach(sub=>{st.marks[ex.id][s.id][sub]=Math.max(6,Math.min(99,Math.round(s.ability+(r()-.5)*28+(ex.id==='ex2'?(r()-.4)*6:0))))})})});
  st.students.forEach(s=>delete s.ability);
  /* attendance: last 15 weekdays */
  let d=TODAY,count=0;const days=[];
  while(count<15){const w=parseD(d).getDay();if(w>0&&w<6){days.push(d);count++}d=addDays(d,-1)}
  const skipToday=new Set(['S3B','S6ARTS']);
  const prop={};st.students.forEach(s=>prop[s.id]=r()*0.14);
  days.forEach(day=>{st.attendance[day]={};st.students.forEach(s=>{if(day===TODAY&&skipToday.has(s.classId))return;const x=r();st.attendance[day][s.id]=x<prop[s.id]?'A':x<prop[s.id]+.035?'L':'P'})});
  /* fees: every sample payment is already approved; two portal payments wait for the bursar */
  const fee=s=>st.fees.structure[(st.classes.find(c=>c.id===s.classId).level)+'-'+s.boarding];
  st.students.forEach(s=>{
    const due=fee(s)+s.arrears-s.bursary,x=r();
    let target=x<.28?due:x<.7?Math.round(due*(.3+r()*.5)/10000)*10000:x<.88?Math.round(due*.15/10000)*10000:0;
    const methods=['MTN Mobile Money','Airtel Money','Cash','Bank deposit','MTN Mobile Money','Airtel Money'];
    let n=0;while(target>0&&n<3){const amt=n===2||r()<.4?target:Math.round(target*(.4+r()*.3)/5000)*5000;const a=Math.max(5000,Math.min(target,amt));target-=a;n++;
      const m=pick(methods);st.seq.rct++;const dt=addDays(st.school.termStart,ri(0,36));
      st.payments.push({id:'p'+st.seq.rct,rct:'RCT-'+pad(st.seq.rct,5),studentId:s.id,date:dt,amount:a,method:m,ref:m.includes('Mobile')||m.includes('Airtel')?'TX'+ri(10000000,99999999):m==='Bank deposit'?'SLIP'+ri(100000,999999):'',by:'Bursar',status:'Approved',prn:'',approvedBy:'Bursar',approvedOn:dt,source:'Bursar'})}
  });
  [0,3].forEach((k,i)=>{const s=st.students[k*7+2],id='pp'+i;st.payments.push({id,rct:'PEND-'+id,studentId:s.id,date:TODAY,amount:150000,method:'MTN Mobile Money',ref:'TX'+ri(10000000,99999999),by:s.guardian.name,status:'Pending',prn:'',approvedBy:'',approvedOn:'',source:'Portal'})});
  st.payments.sort((a,b)=>b.date.localeCompare(a.date));
  /* admissions */
  const stages=['Applied','Applied','Interview','Interview','Admitted','Admitted','Declined'];
  stages.forEach((sg,i)=>{const sex=r()<.5?'M':'F',n=person(sex);st.applicants.push({id:'a'+(i+1),name:n,sex,dob:`${2026-ri(12,16)}-${pad(ri(1,12))}-${pad(ri(1,28))}`,applyingFor:pick(['S1','S1','S2','S3','S5']),prevSchool:pick(['Muguluka Primary School','Jinja Junior School','Kakira Primary','Buwenge Primary','St. Peter\'s Njeru']),guardian:person('M'),phone:phone(),stage:sg,date:addDays(TODAY,-ri(2,40)),studentId:null,interviewAt:sg==='Interview'?addDays(TODAY,ri(1,6)):'',interviewVenue:sg==='Interview'?'Administration block':'',admittedOn:sg==='Admitted'?addDays(TODAY,-ri(0,5)):''})});
  /* library */
  const bk=[['Things Fall Apart','Chinua Achebe','Literature'],['Weep Not, Child','Ngũgĩ wa Thiong\'o','Literature'],['Song of Lawino','Okot p\'Bitek','Literature'],['The Concubine','Elechi Amadi','Literature'],['Animal Farm','George Orwell','Literature'],['Lord of the Flies','William Golding','Literature'],['Macbeth','William Shakespeare','Literature'],['Oliver Twist','Charles Dickens','Literature'],['Secondary Mathematics Book 1','MK Publishers','Mathematics'],['Secondary Mathematics Book 2','MK Publishers','Mathematics'],['Physics for Secondary Schools','Fountain Publishers','Sciences'],['Chemistry for Secondary Schools','Fountain Publishers','Sciences'],['Comprehensive Biology','Fountain Publishers','Sciences'],['History of East Africa','Fountain Publishers','Humanities'],['Certificate Geography','Fountain Publishers','Humanities'],['Christian Religious Education','Fountain Publishers','Humanities'],['A-Level Economics','Fountain Publishers','Humanities'],['Oxford Advanced Learner\'s Dictionary','Oxford University Press','Reference'],['Atlas for East Africa','Oxford University Press','Reference'],['A Level General Paper','Fountain Publishers','Reference']];
  bk.forEach((b,i)=>st.books.push({id:'b'+(i+1),title:b[0],author:b[1],cat:b[2],copies:ri(3,14)}));
  for(let i=0;i<16;i++){const s=pick(st.students),b=pick(st.books),out=addDays(TODAY,-ri(1,26));st.loans.push({id:'l'+(i+1),bookId:b.id,studentId:s.id,out,due:addDays(out,14),returned:r()<.35?addDays(out,ri(3,12)):null})}
  /* welfare */
  const dtypes=[['Late coming','Verbal warning'],['Uniform','Written warning'],['Fighting','Parent summoned'],['Absconding lessons','Detention'],['Phone in school','Phone confiscated']];
  for(let i=0;i<6;i++){const s=pick(st.students),t=pick(dtypes);st.discipline.push({id:'c'+(i+1),studentId:s.id,date:addDays(TODAY,-ri(1,30)),type:t[0],desc:'',action:t[1],status:r()<.6?'Resolved':'Open',by:'Sample data',byId:''})}
  const sick=[['Headache','Paracetamol, rest'],['Malaria symptoms','Referred for testing'],['Stomach ache','Observation, fluids'],['Minor injury','Wound dressed']];
  for(let i=0;i<7;i++){const s=pick(st.students),t=pick(sick);st.sickbay.push({id:'k'+(i+1),studentId:s.id,date:addDays(TODAY,-ri(0,20)),complaint:t[0],treatment:t[1],outcome:pick(['Returned to class','Rested in sick bay','Sent home']),by:'Sick bay'})}
  /* events */
  const ev=(t,d,k,det)=>st.events.push({id:uid('e'),title:t,date:d,kind:k,details:det||''});
  ev('Term 3 opens',st.school.termStart,'term');ev('Mid-term exams begin','2026-10-12','exam');ev('Mid-term exams end','2026-10-16','exam');ev('Inter-house sports day','2026-10-30','sport');
  ev('Parents\' day and academic clinic','2026-11-07','term');ev('Prefects\' handover','2026-11-13','term');ev('End of term exams begin','2026-11-23','exam');ev('End of term exams end','2026-12-01','exam');ev('Term 3 closes',st.school.termEnd,'holiday');ev('Independence Day (holiday)','2026-10-09','holiday');
  st.notices=[{id:'n1',date:addDays(TODAY,-1),title:'Mid-term exam timetable',body:'Mid-term examinations run this week. All learners must carry their exam permits.',by:'Director of Studies'},
    {id:'n2',date:addDays(TODAY,-5),title:'Fees reminder',body:'Parents and guardians are reminded to clear Term 3 balances before the end of term examinations.',by:'Bursar'},
    {id:'n3',date:addDays(TODAY,-9),title:'Sports day preparations',body:'House captains should submit team lists to the sports master by Friday.',by:'Deputy Head Teacher'}];
  st.messages=[];
  st.expenses=[['Utilities','Electricity (UMEME)',-9,420000],['Supplies','Laboratory chemicals',-12,650000],['Maintenance','Dormitory repairs',-20,1200000],['Supplies','Stationery',-6,310000],['Utilities','Water bill',-3,180000]].map((e,i)=>({id:'x'+i,date:addDays(TODAY,e[2]),category:e[0],desc:e[1],amount:e[3],by:'Bursar'}));
  /* timetable: lessons spread over the week; each class gets as many lessons as there are slots */
  const perDay=DEF_TT.slots.filter(x=>x.type==='lesson').length;
  st.classes.forEach((c,ci)=>{const subs=defSubj(c);st.tt[c.id]={};DEF_TT.days.forEach(dy=>{st.tt[c.id][dy]=[];for(let p=0;p<perDay;p++)st.tt[c.id][dy].push(subs[(dy*3+p+ci)%subs.length])})});
  /* exams timetable for the open session */
  st.classes.forEach((c,ci)=>defSubj(c).forEach((sub,i)=>st.examtt.push({id:uid('xt'),examId:'ex2',classId:c.id,subject:sub,date:addDays(TODAY,8+Math.floor(i/2)),start:i%2?'11:00':'08:30',end:i%2?'12:30':'10:00',venue:c.name+' classroom',invigilator:''})));
  /* human resources */
  const pay={'Head Teacher':2800000,'Deputy Head Teacher':2200000,'Director of Studies':2000000,'Bursar':1600000,'Registrar':1500000,'Librarian':900000,'Sick Bay Attendant':800000,'Matron':700000,'Warden':800000,'Human Resource Manager':1600000,'Examination Officer':1300000};
  st.staff.forEach((t,i)=>st.hr.push({id:t.id,salary:pay[t.role]||ri(9,14)*100000,payFreq:'Monthly',allowances:ri(0,4)*50000,bank:pick(['Stanbic Bank','Centenary Bank','DFCU Bank','Post Bank']),bankAcct:'',contract:t.type==='Teaching'?pick(['Permanent','Permanent','Fixed-term']):'Permanent',contractStart:t.joined,contractEnd:i%7===3?addDays(TODAY,ri(20,70)):'',nssf:'',tin:'',qualification:t.type==='Teaching'?'Bachelor of Education':'',nextOfKin:'',nextOfKinPhone:'',notes:''}));
  days.slice(0,10).forEach(day=>st.staff.forEach(t=>{const x=r();st.staffatt.push({id:day+'|'+t.id,date:day,staffId:t.id,mark:x<.04?'A':x<.08?'L':'P'})}));
  st.leaves=[{id:'lv1',staffId:'t24',type:'Annual',from:addDays(TODAY,10),to:addDays(TODAY,17),status:'Pending',note:'Family travel'},{id:'lv2',staffId:'t30',type:'Sick',from:addDays(TODAY,-6),to:addDays(TODAY,-4),status:'Approved',note:''}];
  st.misconduct=[{id:'mc1',staffId:'t26',date:addDays(TODAY,-14),type:'Late coming',details:'Reported late three times in one week.',action:'Verbal warning',status:'Resolved'}];
  /* boarding roll call: the last two nights */
  st.students.filter(s=>s.boarding==='Boarding').forEach(s=>days.slice(0,2).forEach(day=>st.rollcall.push({id:day+'|Night|'+s.id,date:day,session:'Night',studentId:s.id,mark:r()<.05?'A':'P'})));
  st.audit=[{t:new Date().toISOString(),u:'System',a:'Sample data loaded'}];
  return st;
}
const ui={route:'dashboard',params:{},role:'admin',user:null,theme:null,f:{},tab:{},q:'',modal:null,pend:{}};
try{const u=JSON.parse(localStorage.getItem(UIKEY)||'{}');if(u.theme)ui.theme=u.theme;if(u.route)ui.route=u.route}catch(e){}
const saveUI=()=>{try{localStorage.setItem(UIKEY,JSON.stringify({role:ui.role,theme:ui.theme,route:ui.route}))}catch(e){}};
S=emptyState();S.users=[];S.audit=[];S.ranks={};S.sms={provider:'none'};S.backups=null;S.userCount=0;

/* ===== Selectors / domain helpers ===== */
let CLOCK=0;                                  /* server time minus this computer's time, in ms */
const nowMs=()=>Date.now()+CLOCK;
const stu=id=>S.students.find(s=>s.id===id);
const cls=id=>S.classes.find(c=>c.id===id);
const tch=id=>S.staff.find(t=>t.id===id);
const sname=s=>s?`${s.first} ${s.last}`:'Unknown';
const R_=()=>ui.role;
const isR=(...r)=>r.includes(ui.role);
const myStaff=()=>ui.user&&ui.user.staffId?tch(ui.user.staffId):null;
const myStaffId=()=>ui.user&&ui.user.staffId||'';
const active=()=>S.students.filter(s=>s.status==='Active');
const inClass=id=>active().filter(s=>s.classId===id);
const lvl=s=>cls(s.classId)?.level||'O';
const feeFor=s=>S.fees.structure[lvl(s)+'-'+s.boarding]||0;
const billed=s=>feeFor(s)+(s.arrears||0)-(s.bursary||0);
const okPay=p=>p.status!=='Pending'&&p.status!=='Rejected';
const paidBy=s=>sum(S.payments.filter(p=>p.studentId===s.id&&okPay(p)).map(p=>p.amount));
const balOf=s=>billed(s)-paidBy(s);
/* subjects, allocations and the timetable layout */
const subjRows=c=>S.subjects.filter(x=>x.classId===(c&&c.id||c));
const subjectsOf=c=>subjRows(c).map(x=>x.name);
const allocOf=(c,sub)=>S.subjects.find(x=>x.id===(c&&c.id||c)+'|'+sub);
const teacherFor=(c,sub)=>{const a=allocOf(c,sub);return a&&a.teacherId?tch(a.teacherId):null};
const TTC=()=>{const x=S.ttcfg&&S.ttcfg.find(r=>r.id==='main');return x&&x.slots&&x.slots.length?x:{id:'main',...DEF_TT}};
const lessonSlots=()=>{let n=0;return TTC().slots.map(s=>s.type==='lesson'?{...s,p:n++}:{...s,p:-1})};
const nLessons=()=>TTC().slots.filter(s=>s.type==='lesson').length;
const ttGet=(cid,d)=>((S.tt[cid]||{})[d]||[]);
const tname=t=>t?t.name.split(' ').map((x,i)=>i?x:x[0]+'.').join(' '):'';
/* exam settings */
const cfgOf=id=>S.examcfg.find(x=>x.examId===id||x.id===id)||{id,examId:id,paperDeadline:'',marksOpen:false,marksDeadline:''};
const marksOpenNow=c=>!!c&&!!c.marksOpen&&(!c.marksDeadline||nowMs()<Date.parse(c.marksDeadline));
const papersOpenNow=c=>!!c&&!!c.paperDeadline&&nowMs()<Date.parse(c.paperDeadline);
const fdt=v=>{const t=Date.parse(v);return isNaN(t)?'—':new Date(t).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})};
const toLocalInput=v=>{const t=Date.parse(v);if(isNaN(t))return'';const d=new Date(t);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes())};
const fromLocalInput=v=>v?new Date(v).toISOString():'';
const dayRate=(date,list)=>{const a=S.attendance[date];if(!a)return null;let m=0,p=0;list.forEach(s=>{const v=a[s.id];if(v){m++;if(v!=='A')p++}});return m?pct(p,m):null};
const lastMarkedDay=()=>{const ks=Object.keys(S.attendance).filter(k=>k<=TODAY&&Object.keys(S.attendance[k]).length).sort();return ks[ks.length-1]||null};
/* exams: which class a learner sat the exam in (they may have moved up since) */
const placeOf=(examId,s)=>{const p=S.placements.find(x=>x.id===examId+'|'+s.id);return p?p.classId:s.classId};
const studentsFor=(examId,classId)=>S.students.filter(s=>placeOf(examId,s)===classId&&(s.status==='Active'||(S.marks[examId]||{})[s.id]));
function subjectsFor(examId,c,list){const base=subjectsOf(c),seen=new Set(base),extra=[];list.forEach(s=>Object.keys(((S.marks[examId]||{})[s.id])||{}).forEach(x=>{if(!seen.has(x)){seen.add(x);extra.push(x)}}));return[...base,...extra]}
function results(examId,classId){
  const c=cls(classId)||{id:classId,level:'O'},list=studentsFor(examId,classId),subs=subjectsFor(examId,c,list);
  const rows=list.map(s=>{const m=(S.marks[examId]||{})[s.id]||{};const sc=subs.map(x=>m[x]);const have=sc.filter(v=>v!==undefined&&v!==null&&v!=='');
    const gs=subs.map((x,i)=>have.length&&sc[i]!==undefined&&sc[i]!==''?grade(+sc[i],c.level):null);
    const total=sum(have),av=have.length?total/have.length:0;
    const agg=sum(gs.filter(Boolean).map(g=>g.p));
    return{s,sc,gs,total,avg:av,n:have.length,agg}});
  rows.sort((a,b)=>b.avg-a.avg);rows.forEach((r,i)=>r.pos=r.n?i+1:null);
  if(PORTAL())rows.forEach(r=>{const k=(S.ranks[examId]||{})[r.s.id];if(k){r.pos=k.pos;r.of=k.of}});
  return{c,subs,rows};
}
const autoComment=a=>a>=80?'An outstanding performance. Keep up the excellent work.':a>=70?'Very good results. Keep aiming higher.':a>=60?'A good performance. More effort will lift your grades further.':a>=50?'A fair result. You can do better with consistent revision.':a>=40?'Performance is below expectation. Seek extra help and revise daily.':'Serious improvement is needed. Please see the class teacher for support.';
const nextAdm=()=>{let m=0;S.students.forEach(s=>{const x=/(\d+)$/.exec(s.adm||'');if(x)m=Math.max(m,+x[1])});return`${S.school.code||'SCH'}/${S.school.year}/${pad(m+1,4)}`};
/* what the signed-in person may do (the server enforces the same rules) */
const myClasses=()=>S.classes.filter(c=>c.teacherId&&c.teacherId===myStaffId());
const myTaught=()=>S.subjects.filter(x=>x.teacherId&&x.teacherId===myStaffId());
/* ===== Badge ===== */
function badgeSVG(size=56){
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 120" role="img" aria-label="School badge" style="flex:none">
  <defs><clipPath id="shc${size}"><path d="M50 4 92 16v46c0 26-20 44-42 54C28 106 8 88 8 62V16z"/></clipPath></defs>
  <path d="M50 2 94 14v48c0 28-21 47-44 58C27 109 6 90 6 62V14z" fill="#B8892B"/>
  <path d="M50 6 90 17v45c0 25-19 42-40 52C29 104 10 87 10 62V17z" fill="#0E4D3A"/>
  <g clip-path="url(#shc${size})">
    <rect x="0" y="0" width="100" height="34" fill="#0A3A2B"/>
    <g stroke="#E6C46A" stroke-width="2" stroke-linecap="round"><path d="M50 62V26"/><path d="M50 62L30 33"/><path d="M50 62L70 33"/><path d="M50 62L18 44"/><path d="M50 62L82 44"/></g>
    <circle cx="50" cy="62" r="11" fill="#F2D27B"/>
    <path d="M12 78Q31 66 50 80Q69 66 88 78V92Q69 82 50 94Q31 82 12 92Z" fill="#F7F3E6"/>
    <path d="M50 80V94" stroke="#0E4D3A" stroke-width="1.6"/>
    <path d="M18 84Q31 76 46 85M54 85Q69 76 82 84" stroke="#0E4D3A" stroke-width="1.2" fill="none"/>
  </g>
  <path d="M50 6 90 17v45c0 25-19 42-40 52C29 104 10 87 10 62V17z" fill="none" stroke="#F2D27B" stroke-width="2"/>
  <text x="50" y="25" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="15" fill="#F2D27B" letter-spacing="2">PCM</text>
  </svg>`;
}
const badge=(size=56)=>S.school.badge?`<img src="${S.school.badge}" alt="School badge" width="${size}" height="${size}" style="width:${size}px;height:${size}px;object-fit:contain;flex:none">`:badgeSVG(size);

/* ===== Charts ===== */
function barChart(items,o={}){
  const W=640,H=o.h||230,pl=34,pr=8,pt=18,pb=34,n=items.length;if(!n)return '<div class="empty">No data yet</div>';
  const max=o.max||Math.max(1,...items.map(i=>i.v)),nice=Math.ceil(max/(o.step||(max>100?Math.pow(10,Math.floor(Math.log10(max))):10)))*(o.step||(max>100?Math.pow(10,Math.floor(Math.log10(max))):10));
  const top=o.max||nice,bw=(W-pl-pr)/n,y=v=>pt+(H-pt-pb)*(1-v/top);
  let g='';for(let i=0;i<=4;i++){const v=top*i/4;g+=`<line class="c-grid" x1="${pl}" x2="${W-pr}" y1="${y(v)}" y2="${y(v)}"/><text class="c-txt" x="${pl-6}" y="${y(v)+4}" text-anchor="end">${o.f?o.f(v):Math.round(v)}</text>`}
  const bars=items.map((it,i)=>{const x=pl+i*bw+bw*.18,w=bw*.64,yy=y(it.v);return`<rect class="${it.cls||'c-bar'}" x="${x}" y="${yy}" width="${w}" height="${Math.max(0,H-pb-yy)}" rx="3"><title>${esc(it.l)}: ${o.f?o.f(it.v):it.v}</title></rect>${n<=14?`<text class="c-txt" x="${x+w/2}" y="${yy-5}" text-anchor="middle">${o.f?o.f(it.v):it.v}</text>`:''}<text class="c-txt" x="${x+w/2}" y="${H-pb+15}" text-anchor="middle">${esc(it.l)}</text>`}).join('');
  return `<svg class="svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label||'Bar chart')}">${g}${bars}</svg>`;
}
function lineChart(pts,o={}){
  const W=640,H=o.h||220,pl=34,pr=14,pt=14,pb=30,n=pts.length;if(n<2)return '<div class="empty">Not enough data yet</div>';
  const lo=o.min??0,hi=o.max??100,x=i=>pl+(W-pl-pr)*i/(n-1),y=v=>pt+(H-pt-pb)*(1-(v-lo)/(hi-lo));
  let g='';for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4;g+=`<line class="c-grid" x1="${pl}" x2="${W-pr}" y1="${y(v)}" y2="${y(v)}"/><text class="c-txt" x="${pl-6}" y="${y(v)+4}" text-anchor="end">${Math.round(v)}${o.suf||''}</text>`}
  const d=pts.map((p,i)=>`${i?'L':'M'}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join('');
  const area=d+`L${x(n-1)} ${H-pb}L${x(0)} ${H-pb}Z`;
  const step=Math.ceil(n/7);
  const lab=pts.map((p,i)=>i%step===0||i===n-1?`<text class="c-txt" x="${x(i)}" y="${H-8}" text-anchor="middle">${esc(p.l)}</text>`:'').join('');
  const last=pts[n-1];
  return `<svg class="svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label||'Line chart')}">${g}<path class="c-area" d="${area}"/><path class="c-line" d="${d}"/>${pts.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p.v)}" r="${i===n-1?5:2.5}" class="${i===n-1?'c-dot':'c-bar'}"><title>${esc(p.l)}: ${p.v}${o.suf||''}</title></circle>`).join('')}${lab}<text class="c-txt" x="${x(n-1)}" y="${y(last.v)-10}" text-anchor="end" style="fill:var(--fg);font-weight:600">${last.v}${o.suf||''}</text></svg>`;
}
const COLS=['var(--brand)','var(--gold)','var(--info)','var(--bad)','var(--ok)','var(--muted)'];
function donut(items,o={}){
  const tot=sum(items.map(i=>i.v))||1,R=52,C=2*Math.PI*R;let off=0;
  const arcs=items.map((it,i)=>{const len=C*it.v/tot,a=`<circle cx="70" cy="70" r="${R}" fill="none" stroke="${COLS[i%COLS.length]}" stroke-width="20" stroke-dasharray="${len} ${C-len}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"><title>${esc(it.l)}: ${it.v}</title></circle>`;off+=len;return a}).join('');
  return `<div class="row" style="gap:18px;flex-wrap:nowrap"><svg viewBox="0 0 140 140" width="132" height="132" role="img" aria-label="${esc(o.label||'Breakdown')}" style="flex:none"><circle cx="70" cy="70" r="${R}" fill="none" stroke="var(--surface2)" stroke-width="20"/>${arcs}<text x="70" y="67" text-anchor="middle" style="font:700 22px var(--display);fill:var(--fg)">${o.center??tot}</text><text x="70" y="84" text-anchor="middle" class="c-txt">${esc(o.sub||'total')}</text></svg>
  <div class="stack" style="gap:6px;font-size:13px;min-width:0">${items.map((it,i)=>`<div><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${COLS[i%COLS.length]};margin-right:8px"></i>${esc(it.l)} <b class="mono">${it.v}</b></div>`).join('')}</div></div>`;
}
const hbars=(items,o={})=>`<div class="stack" style="gap:10px">${items.map(i=>`<div><div class="row sm" style="justify-content:space-between;gap:6px"><span>${esc(i.l)}</span><b class="mono">${i.t??i.v+(o.suf||'')}</b></div><div class="bar ${i.k||''}"><i style="width:${Math.min(100,i.v)}%"></i></div></div>`).join('')}</div>`;

/* ===== UI building blocks ===== */
const ph=(t,sub,acts='')=>`<div class="ph"><div><h1>${esc(t)}</h1>${sub?`<div class="sub">${sub}</div>`:''}</div><div class="acts">${acts}</div></div>`;
const kpi=(l,v,d='')=>`<div class="card kpi"><span class="l">${esc(l)}</span><span class="v">${v}</span><span class="d">${d}</span></div>`;
const tabs=(key,list)=>{const cur=ui.tab[key]||list[0][0];return`<div class="tabs" role="tablist">${list.map(t=>`<button class="tab ${cur===t[0]?'on':''}" role="tab" data-a="tab" data-k="${key}" data-v="${t[0]}">${esc(t[1])}</button>`).join('')}</div>`};
const curTab=(key,list)=>ui.tab[key]||list[0][0];
function table(cols,rows,o={}){
  if(!rows.length)return `<div class="tw"><div class="empty">${o.empty||'Nothing to show yet.'}</div></div>`;
  return `<div class="tw"><table class="t"><thead><tr>${cols.map(c=>`<th class="${c.r?'r':''}">${esc(c.h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr class="${o.click?'click':''}" ${o.click?`data-a="${o.click}" data-id="${esc(r.id||'')}"`:''}>${cols.map(c=>`<td class="${c.r?'r':''} ${c.m?'mono':''}">${c.f(r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function pager(key,total,per=20){const p=Math.min(ui.f[key+'p']||1,Math.max(1,Math.ceil(total/per)));const pages=Math.ceil(total/per);
  return{p,slice:a=>a.slice((p-1)*per,p*per),html:pages>1?`<div class="row" style="justify-content:space-between;margin-top:10px"><span class="muted sm">Showing ${(p-1)*per+1}–${Math.min(total,p*per)} of ${total}</span><div class="row"><button class="btn sm" data-a="page" data-k="${key}" data-v="${p-1}" ${p<=1?'disabled':''}>Previous</button><span class="mono sm">${p}/${pages}</span><button class="btn sm" data-a="page" data-k="${key}" data-v="${p+1}" ${p>=pages?'disabled':''}>Next</button></div></div>`:''}}
const opts=(list,sel)=>list.map(o=>{const v=Array.isArray(o)?o[0]:o,l=Array.isArray(o)?o[1]:o;return`<option value="${esc(v)}" ${String(v)===String(sel)?'selected':''}>${esc(l)}</option>`}).join('');
const classOpts=sel=>opts(S.classes.map(c=>[c.id,c.name]),sel);
const studentOpts=sel=>S.classes.map(c=>{const l=active().filter(s=>s.classId===c.id);return l.length?`<optgroup label="${esc(c.name)}">${l.map(s=>`<option value="${s.id}" ${s.id===sel?'selected':''}>${esc(sname(s))} (${esc(s.adm)})</option>`).join('')}</optgroup>`:''}).join('');
const inpSearch=(id,ph,val)=>`<input type="search" id="${id}" placeholder="${esc(ph)}" value="${esc(val||'')}" data-c="q" data-k="${id}" aria-label="${esc(ph)}">`;
const empty=m=>`<div class="empty">${m}</div>`;

/* ===== Toasts, modal, forms ===== */
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;$('#toasts').appendChild(t);setTimeout(()=>t.remove(),3200)}
function openModal(title,body,o={}){ui.modal={title,body,o};drawModal()}
function closeModal(){ui.modal=null;$('#modal').innerHTML=''}
function drawModal(){const m=ui.modal;if(!m){$('#modal').innerHTML='';return}
  $('#modal').innerHTML=`<div class="modalbg" data-a="bg"><div class="modal ${m.o.wide?'wide':''}" role="dialog" aria-modal="true" aria-label="${esc(m.title)}"><div class="mh"><h2>${esc(m.title)}</h2><button class="btn ico" data-a="closeModal" aria-label="Close">${ic('x')}</button></div><div class="mb">${m.body}</div>${m.o.foot?`<div class="mf">${m.o.foot}</div>`:''}</div></div>`}
function field(f,v){const val=v?.[f.k]??f.def??'',id='f_'+f.k,req=f.req?' required':'';let inp;
  if(f.type==='select')inp=`<select id="${id}" name="${f.k}"${req}>${f.opts}</select>`;
  else if(f.type==='textarea')inp=`<textarea id="${id}" name="${f.k}"${req}>${esc(val)}</textarea>`;
  else inp=`<input id="${id}" name="${f.k}" type="${f.type||'text'}" value="${esc(val)}"${req}${f.min!==undefined?` min="${f.min}"`:''}${f.max!==undefined?` max="${f.max}"`:''}${f.step?` step="${f.step}"`:''}>`;
  return `<div class="field ${f.full?'full':''}"><label for="${id}">${esc(f.label)}${f.req?' *':''}</label>${inp}</div>`}
function openForm(title,fields,vals,onSave,o={}){
  ui.formSave=onSave;
  openModal(title,`${o.pre||''}<form id="mform" novalidate><div class="fgrid">${fields.map(f=>field(f,vals)).join('')}</div></form>`,{wide:o.wide,foot:`<button class="btn" data-a="closeModal">Cancel</button><button class="btn pri" data-a="submitForm">${esc(o.save||'Save')}</button>`});
}
function readForm(){const f=$('#mform');if(!f)return null;const out={};let ok=true;[...f.elements].forEach(e=>{if(!e.name)return;out[e.name]=e.type==='number'?(e.value===''?'':+e.value):e.value.trim();if(e.required&&!e.value.trim()){ok=false;e.style.borderColor='var(--bad)'}});return ok?out:null}
function confirmBox(msg,fn,label='Confirm'){ui.confirmFn=fn;openModal('Please confirm',`<p>${msg}</p>`,{foot:`<button class="btn" data-a="closeModal">Cancel</button><button class="btn danger" data-a="doConfirm">${esc(label)}</button>`})}

/* ===== Export helpers ===== */
const csv=rows=>rows.map(r=>r.map(c=>{const s=String(c??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}).join(',')).join('\n');
async function saveFile(filename,data){
  try{const d=window.claude&&window.claude.use?await window.claude.use('downloads'):null;
    if(d){await d.save({filename,data});toast('Saved '+filename);return}
    const u=URL.createObjectURL(new Blob([data],{type:'application/octet-stream'})),a=document.createElement('a');a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);toast('Saved '+filename)
  }catch(e){if(e&&e.code==='declined')return;toast('Could not save the file here')}
}
const reportDocHTML=(title,inner)=>`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font:14px/1.5 system-ui,Segoe UI,sans-serif;color:#14211B;max-width:820px;margin:24px auto;padding:0 16px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #c9d6ce;padding:6px 9px;text-align:left}th{background:#e9efeb}.hd{display:flex;gap:16px;align-items:center;border-bottom:3px double #0E4D3A;padding-bottom:12px;margin-bottom:14px}h2{color:#0E4D3A;margin:0}.sig{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:22px;font-size:12px}.sig div{border-top:1px solid #14211B;padding-top:4px}</style></head><body>${inner}</body></html>`;
const letterhead=(sub)=>`<div class="hd">${badge(70)}<div><h2>${esc(S.school.name)}</h2><div style="font-size:12px;color:#44584d">${esc(S.school.address)}${S.school.phone?' · '+esc(S.school.phone):''}${S.school.motto?'<br><i>'+esc(S.school.motto)+'</i>':''}</div><div style="font-weight:700;margin-top:4px">${esc(sub)}</div></div></div>`;

/* ===== Photos ===== */
const avS=(s,c='')=>s&&s.photo?`<img class="av ${c}" src="${s.photo}" alt="${esc(sname(s))}">`:av(s?sname(s):'?',c);
const avT=(t,c='')=>t&&t.photo?`<img class="av ${c}" src="${t.photo}" alt="${esc(t.name)}">`:av(t?t.name:'?',c);
function readPhoto(file,cb){
  if(!file)return;if(!/^image\//.test(file.type)){toast('Choose an image file');return}
  const rd=new FileReader();rd.onload=()=>{const im=new Image();im.onload=()=>{const sz=240,cv=document.createElement('canvas');cv.width=cv.height=sz;const m=Math.min(im.width,im.height),sx=(im.width-m)/2,sy=(im.height-m)*.2,x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,sz,sz);x.drawImage(im,sx,sy,m,m,0,0,sz,sz);cb(cv.toDataURL('image/jpeg',.8))};im.onerror=()=>toast('That image could not be read');im.src=rd.result};rd.readAsDataURL(file);
}
const photoPre=(kind,o)=>`<div class="row" style="margin-bottom:16px;gap:14px"><span id="phprev">${kind==='student'?avS(o,'lg'):avT(o,'lg')}</span><div class="row"><input id="photoFile" type="file" accept="image/*" aria-label="Choose a photo to upload" data-c="photoFile" data-kind="${kind}" data-id="${o&&o.id||''}"><button class="btn sm danger" type="button" data-a="photoRemove" data-kind="${kind}" data-id="${o&&o.id||''}">Remove</button></div></div>`;
/* ===== Shell, navigation, events ===== */
const ALLSTAFF=['head','dos','bursar','registrar','teacher','librarian','warden','hrm','examoffice','sickbay'];
const ACCESS={dashboard:'*',
  students:['admin','head','dos','registrar','teacher','bursar','warden','hrm','examoffice','librarian','sickbay'],admissions:['admin','head','registrar'],
  staff:['admin','head','dos','hrm'],hr:['head','hrm'],
  classes:['admin','head','dos','teacher','registrar','hrm','examoffice'],timetable:['admin','head','dos','teacher','registrar'],attendance:['admin','head','dos','teacher','registrar'],
  exams:['head','dos','teacher','registrar','examoffice'],
  fees:['admin','head','bursar'],library:['admin','head','librarian'],boarding:['admin','head','dos','warden'],welfare:['admin',...ALLSTAFF],
  comms:['head','dos','bursar','registrar','hrm','examoffice'],inbox:ALLSTAFF,events:'*',reports:['admin','head','dos','bursar','registrar','hrm','examoffice','warden'],settings:['admin'],accounts:['admin'],account:'*'};
const NAV=[['Overview',[['dashboard','Dashboard','dash']]],
 ['People',[['students','Learners','students'],['admissions','Admissions','admissions'],['staff','Staff','staff'],['hr','Human resources','staff']]],
 ['Academics',[['classes','Classes & subjects','classes'],['timetable','Timetable','timetable'],['attendance','Attendance','attendance'],['exams','Exams & reports','exams']]],
 ['Operations',[['fees','Fees & finance','fees'],['library','Library','library'],['boarding','Boarding','boarding'],['welfare','Welfare & health','welfare']]],
 ['School life',[['inbox','My messages','comms'],['comms','Communication','comms'],['events','Calendar','events'],['reports','Reports','reports']]],
 ['System',[['accounts','Accounts & logins','staff'],['account','My account','staff'],['settings','Settings','settings']]]];
const PORTAL=()=>!!ui.user&&(ui.user.role==='parent'||ui.user.role==='student');
const allowed=id=>{if(String(id).startsWith('p_'))return PORTAL();if(PORTAL())return false;return ACCESS[id]==='*'||(ACCESS[id]||[]).includes(ui.role)};
const portalTitle=()=>ui.user&&ui.user.role==='student'?'Student portal':'My child Portal';
const NAVP=()=>[[portalTitle(),[['p_home','Home','dash'],['p_info','My information','students'],['p_subjects','Subjects','classes'],['p_results','Report cards','exams'],['p_fees','Fees & PRN','fees'],['p_att','Attendance','attendance'],['p_tt','Timetables','timetable'],['p_welfare','Welfare & health','welfare'],['p_inbox','Messages','comms'],['p_news','Notices & calendar','events']]],['Account',[['p_account','My account','staff']]]];
const PAGES={},A={},CH={};
const shortC=c=>c.level==='O'?c.name.replace('S.','S').replace(' ',''):'S'+c.form+c.stream.slice(0,2);
const mny=n=>n>=1e6?'UGX '+(n/1e6).toFixed(1)+'M':ugx(n);


function drawSide(){
  const cnt=PORTAL()?{p_inbox:unreadCount()}:{students:active().length,admissions:S.applicants.filter(a=>['Applied','Interview'].includes(a.stage)).length,inbox:unreadCount(),fees:isR('bursar')?S.payments.filter(p=>p.status==='Pending').length:0};
  $('#side').innerHTML=`<div class="brand">${badge(48)}<div><div class="bt">WalEduc</div><div class="bs">${esc(S.school.name)}</div></div></div>
  ${(PORTAL()?NAVP():NAV).map(g=>{const items=g[1].filter(n=>allowed(n[0]));return items.length?`<div class="navg">${g[0]}</div>${items.map(n=>`<button class="nav ${ui.route===n[0]||(ui.route==='student'&&n[0]==='students')?'on':''}" data-a="nav" data-id="${n[0]}">${ic(n[2])}<span>${n[1]}</span>${cnt[n[0]]?`<span class="cnt">${cnt[n[0]]}</span>`:''}</button>`).join('')}`:''}).join('')}
  <div class="sidefoot">Term ${S.school.term}, ${S.school.year}<br>${esc(S.school.address)}<br><span style="opacity:.7">WalEduc v${VERSION}</span></div>`;
}
function drawTop(){
  const u=ui.user,portal=PORTAL();
  $('#top').innerHTML=`<button class="btn ico hamb" data-a="openNav" aria-label="Open menu">${ic('menu')}</button>
  ${portal?`<div class="person" style="min-width:0"><b style="font-family:var(--display);font-size:16px">${esc(S.school.name)}</b></div>`:`<div class="gs">${ic('search')}<input id="gsq" type="search" placeholder="Search learners or staff" autocomplete="off" aria-label="Search learners or staff"><div class="gsr" id="gsr" hidden></div></div>`}
  <div class="topr">${u?`<span class="pill gold hide-s" title="${esc(ROLE_LABEL[u.role]||'')}">${esc(u.name)} · ${esc(ROLE_LABEL[u.role]||'')}</span><button class="btn sm" data-a="logout">Sign out</button>`:''}
  <button class="btn ico" data-a="theme" aria-label="Toggle dark mode">${ic(effTheme()==='dark'?'sun':'moon')}</button></div>`;
}
const effTheme=()=>ui.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
const applyTheme=()=>{if(ui.theme)document.documentElement.setAttribute('data-theme',ui.theme);else document.documentElement.removeAttribute('data-theme')};
function drawMain(keepScroll){
  const ae=document.activeElement,fid=ae&&ae.id&&$('#main').contains(ae)?ae.id:null,ss=fid&&ae.selectionStart!=null?[ae.selectionStart,ae.selectionEnd]:null,y=window.scrollY;
  if(!allowed(ui.route)&&(ui.route!=='student'||PORTAL()))ui.route=PORTAL()?'p_home':'dashboard';
  let html;try{html=(PAGES[ui.route]||PAGES.dashboard)()}catch(e){console.error(e);html=`<div class="card"><h3>Something went wrong on this page</h3><p class="muted">${esc(e.message)}</p></div>`}
  $('#main').innerHTML=(S.sample&&ui.user&&ui.user.role==='admin'&&ui.route!=='settings'?`<div class="banner"><span><b>Sample data.</b> Everything you see is made-up example data so you can explore WalEduc. When you are ready, clear it and start with your real school records.</span><button class="btn sm gold" data-a="nav" data-id="settings" data-tab="data">Go to Data settings</button></div>`:'')+html;
  if(fid){const el=document.getElementById(fid);if(el){el.focus();try{if(ss)el.setSelectionRange(ss[0],ss[1])}catch(e){}}}
  window.scrollTo(0,keepScroll===false?0:y);
}
function render(keepScroll){drawSide();drawMain(keepScroll);}
function go(route,params={},tabs){ui.route=route;ui.params=params;if(tabs)Object.assign(ui.tab,tabs);if(!PORTAL())saveUI();document.body.classList.remove('open');render(false)}

document.addEventListener('click',e=>{
  const el=e.target.closest('[data-a]');
  if(!el){const gs=$('#gsr');if(gs&&!e.target.closest('.gs'))gs.hidden=true;return}
  const a=el.dataset.a;
  if(a==='bg'){if(e.target===el)closeModal();return}
  if(el.tagName==='TR'&&e.target.closest('button,a,input,select'))return;
  if(A[a]){A[a](el.dataset,el,e)}
});
document.addEventListener('change',e=>{const el=e.target.closest('[data-c]');if(!el)return;const c=el.dataset.c;if(c==='q')return;if(CH[c])CH[c](el.value,el.dataset,el)});
document.addEventListener('input',e=>{
  const el=e.target;
  if(el.id==='gsq'){gsSearch(el.value);return}
  if(el.dataset&&el.dataset.c==='q'){ui.f[el.dataset.k]=el.value;ui.f[el.dataset.k.replace(/q$/,'')+'p']=1;drawMain()}
  else if(el.dataset&&el.dataset.c==='live'&&CH.live)CH.live(el.value,el.dataset,el);
});
document.addEventListener('submit',e=>{if(e.target.id==='mform'){e.preventDefault();A.submitForm()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(ui.modal)closeModal();const g=$('#gsr');if(g)g.hidden=true}});

function gsSearch(q){
  const box=$('#gsr');q=q.trim().toLowerCase();if(!q){box.hidden=true;return}
  const a=S.students.filter(s=>(sname(s)+' '+s.adm).toLowerCase().includes(q)).slice(0,6).map(s=>`<button data-a="gs" data-t="student" data-id="${s.id}">${avS(s)}<span><b>${esc(sname(s))}</b><span class="muted sm">${esc(s.adm)} · ${esc(cls(s.classId)?.name||'')}</span></span></button>`);
  const b=allowed('staff')?S.staff.filter(s=>(s.name+' '+s.role).toLowerCase().includes(q)).slice(0,4).map(s=>`<button data-a="gs" data-t="staff" data-id="${s.id}">${avT(s)}<span><b>${esc(s.name)}</b><span class="muted sm">${esc(s.role)}</span></span></button>`):[];
  box.innerHTML=a.concat(b).join('')||'<div class="empty">No matches</div>';box.hidden=false;
}
A.gs=d=>{$('#gsr').hidden=true;$('#gsq').value='';if(d.t==='student')go('student',{id:d.id});else go('staff',{},{});setTimeout(()=>A.staffEdit({id:d.id}),0)};
const TABKEY={settings:'settings',fees:'fee',hr:'hr',library:'lib',welfare:'wel',attendance:'att',exams:'exm',boarding:'brd',timetable:'tt'};
A.nav=d=>{if(d.id==='accounts'){go('settings',{},{settings:'users'});return}go(d.id,{},d.tab&&TABKEY[d.id]?{[TABKEY[d.id]]:d.tab}:null)};
A.openNav=()=>document.body.classList.add('open');A.closeNav=()=>document.body.classList.remove('open');
A.theme=()=>{ui.theme=effTheme()==='dark'?'light':'dark';applyTheme();saveUI();drawTop()};
A.closeModal=closeModal;
A.tab=d=>{ui.tab[d.k]=d.v;drawMain()};
A.page=d=>{ui.f[d.k+'p']=+d.v;drawMain()};
A.submitForm=()=>{const v=readForm();if(!v){toast('Please fill the required fields');return}const fn=ui.formSave;if(fn&&fn(v)!==false){closeModal();save();render()}};
A.doConfirm=()=>{const f=ui.confirmFn;closeModal();if(f){f();save();render()}};


/* ===== Messages (inbox) ===== */
const readKey=()=>'walEduc.read.'+(ui.user?ui.user.id:'');
const readSet=()=>{try{return new Set(JSON.parse(localStorage.getItem(readKey())||'[]'))}catch(e){return new Set()}};
const saveRead=s=>{try{localStorage.setItem(readKey(),JSON.stringify([...s].slice(-800)))}catch(e){}};
/* learners and parents see their own rows (a parent sees their children's, once per message) */
function myInbox(){
  const seen=new Set(),out=[];
  [...S.inbox].sort((a,b)=>String(b.at).localeCompare(String(a.at))).forEach(m=>{const k=m.msgId||m.id;if(seen.has(k))return;seen.add(k);out.push(m)});
  return out;
}
const unreadCount=()=>{if(!ui.user)return 0;const r=readSet();return myInbox().filter(m=>!r.has(m.msgId||m.id)).length};
const KIND_PILL={message:['Message','info'],library:['Library','gold'],boarding:['Boarding','info'],welfare:['Welfare',''],health:['Health',''],fees:['Fees','ok'],results:['Results','ok'],timetable:['Timetable','info'],exams:['Exams','gold'],duty:['Duty','gold']};
const inboxList=()=>{const r=readSet(),l=myInbox();return l.length?`<div class="list">${l.map(m=>{const k=m.msgId||m.id,un=!r.has(k),kp=KIND_PILL[m.kind]||['Notice',''];return`<div style="align-items:flex-start"><span><b>${un?'<span style="color:var(--gold)">● </span>':''}${esc(m.title)}</b> ${pill(kp[0],kp[1])}<br><span class="sm" style="white-space:pre-wrap">${esc(m.body)}</span><br><span class="xs muted">${fdt(m.at)}${m.from?' · from '+esc(m.from):''}</span></span>${un?`<button class="btn sm" data-a="msgRead" data-id="${esc(k)}">Mark read</button>`:''}</div>`}).join('')}</div>`:empty('No messages yet. Notices from the school will appear here.')};
A.msgRead=d=>{const r=readSet();r.add(d.id);saveRead(r);drawSide();drawMain(true)};
A.msgReadAll=()=>{const r=readSet();myInbox().forEach(m=>r.add(m.msgId||m.id));saveRead(r);drawSide();drawMain(true)};
PAGES.inbox=PAGES.p_inbox=()=>ph('Messages',`${unreadCount()} unread`,unreadCount()?`<button class="btn" data-a="msgReadAll">Mark all as read</button>`:'')+`<div class="card">${inboxList()}</div>`;

/* ===== Dashboard ===== */
function attentionItems(){
  const out=[],go_=(id,t,tab)=>`<button class="btn sm" data-a="nav" data-id="${id}"${tab?` data-tab="${tab}"`:''}>${t}</button>`;
  const wk=new Date().getDay(),weekend=wk===0||wk===6,act=active();
  if(isR('teacher')){
    const mine=myClasses(),un=mine.filter(c=>inClass(c.id).length&&!(S.attendance[TODAY]&&inClass(c.id).some(s=>S.attendance[TODAY][s.id])));
    if(!weekend&&mine.length)out.push(un.length?`<div><span>Register not taken today: ${un.map(c=>esc(c.name)).join(', ')}</span>${go_('attendance','Take it')}</div>`:`<div><span>Your registers are taken for today</span>${pill('Done','ok')}</div>`);
    const ex=S.exams.filter(e=>marksOpenNow(cfgOf(e.id)));
    ex.forEach(e=>out.push(`<div><span>Marks portal open for ${esc(e.name)}<br><span class="muted sm">until ${fdt(cfgOf(e.id).marksDeadline)}</span></span>${go_('exams','Enter marks')}</div>`));
    S.exams.filter(e=>papersOpenNow(cfgOf(e.id))).forEach(e=>{const need=myTaught().filter(a=>!S.papers.some(p=>p.examId===e.id&&p.classId===a.classId&&p.subject===a.name));out.push(`<div><span>${need.length} question paper${need.length===1?'':'s'} still to upload for ${esc(e.name)}<br><span class="muted sm">deadline ${fdt(cfgOf(e.id).paperDeadline)}</span></span>${need.length?go_('exams','Upload'):pill('Done','ok')}</div>`)});
  }
  if(isR('head','dos','registrar','admin')&&!weekend){const un=S.classes.filter(c=>inClass(c.id).length&&!(S.attendance[TODAY]&&inClass(c.id).some(s=>S.attendance[TODAY][s.id])));out.push(un.length?`<div><span>${un.length} register${un.length>1?'s':''} not taken today<br><span class="muted sm">${un.slice(0,4).map(c=>esc(c.name)).join(', ')}</span></span>${pill('Today','warn')}</div>`:`<div><span>All registers taken today</span>${pill('Done','ok')}</div>`)}
  if(isR('bursar')){const pend=S.payments.filter(p=>p.status==='Pending').length;out.push(`<div><span>${pend} payment${pend===1?'':'s'} waiting for your approval</span>${go_('fees','Review','pay')}</div>`)}
  if(isR('head','bursar','admin'))out.push(`<div><span>${act.filter(s=>balOf(s)>400000).length} learners owe over ${ugx(400000)}</span>${allowed('fees')?go_('fees','Review','bal'):''}</div>`);
  if(isR('registrar','head','admin'))out.push(`<div><span>${S.applicants.filter(a=>a.stage==='Applied').length} new applications to review</span>${go_('admissions','Open')}</div>`);
  if(isR('librarian','head','admin'))out.push(`<div><span>${S.loans.filter(l=>!l.returned&&l.due<TODAY).length} library books overdue</span>${go_('library','Review','loans')}</div>`);
  if(isR('warden','head','admin','dos'))out.push(`<div><span>${act.filter(s=>s.boarding==='Boarding'&&!s.dorm).length} boarders without a dormitory</span>${isR('warden')?go_('boarding','Assign'):''}</div>`);
  if(isR('head','dos','registrar','warden','teacher','admin','hrm','librarian','bursar','examoffice'))out.push(`<div><span>${S.discipline.filter(d=>d.status==='Open').length} open discipline cases</span>${go_('welfare','Open')}</div>`);
  if(isR('sickbay'))out.push(`<div><span>${S.sickbay.filter(k=>k.date>=addDays(TODAY,-7)).length} sick bay visits this week</span>${go_('welfare','Open','sick')}</div>`);
  if(isR('hrm','head')){const pend=S.leaves.filter(l=>l.status==='Pending').length,ends=S.hr.filter(h=>h.contractEnd&&h.contractEnd<=addDays(TODAY,60)&&h.contractEnd>=TODAY).length,notDone=!weekend&&!S.staffatt.some(a=>a.date===TODAY);
    out.push(`<div><span>${pend} leave request${pend===1?'':'s'} waiting<br><span class="muted sm">${ends} contract${ends===1?'':'s'} ending within 60 days</span></span>${go_('hr','Open',pend?'leave':'overview')}</div>`);
    if(isR('hrm')&&notDone)out.push(`<div><span>Staff attendance not recorded today</span>${go_('hr','Record','att')}</div>`)}
  if(isR('examoffice')){S.exams.forEach(e=>{const c=cfgOf(e.id);if(!c.paperDeadline&&!c.marksOpen&&!e.published)return;const exp=S.subjects.filter(a=>a.teacherId&&inClass(a.classId).length).length,got=S.papers.filter(p=>p.examId===e.id).length;out.push(`<div><span>${esc(e.name)}: ${got} of ${exp} question papers received<br><span class="muted sm">Marks portal ${marksOpenNow(c)?'open until '+fdt(c.marksDeadline):'closed'}</span></span>${go_('exams','Open')}</div>`)})}
  if(isR('dos')){const n=S.subjects.filter(a=>!a.teacherId&&inClass(a.classId).length).length;out.push(`<div><span>${n} subject${n===1?'':'s'} without an allocated teacher</span>${go_('classes','Allocate')}</div>`)}
  return out;
}
PAGES.dashboard=()=>{
  const act=active(),boys=act.filter(s=>s.sex==='M').length,girls=act.length-boys,att=allowed('attendance')&&!isR('teacher');
  const ld=lastMarkedDay(),rate=ld?dayRate(ld,act):null;
  const exp=sum(act.map(billed)),col=sum(act.map(s=>Math.min(paidBy(s),billed(s)))),debtors=act.filter(s=>balOf(s)>0);
  const days=Object.keys(S.attendance).filter(k=>Object.keys(S.attendance[k]).length).sort().slice(-14);
  const trend=days.map(d=>({l:d.slice(8)+'/'+d.slice(5,7),v:dayRate(d,S.students.filter(s=>s.status==='Active'))||0}));
  const up=S.events.filter(e=>e.date>=TODAY).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);
  const byClass=S.classes.map(c=>{const l=inClass(c.id);return{l:shortC(c),v:l.length}});
  const feeCls=S.classes.map(c=>{const l=inClass(c.id);const e=sum(l.map(billed)),p=sum(l.map(s=>Math.min(paidBy(s),billed(s))));return{l:shortC(c),v:pct(p,e)}});
  const greet=new Date().getHours()<12?'Good morning':new Date().getHours()<17?'Good afternoon':'Good evening';
  const att_=attentionItems();
  const quick=`${isR('teacher')&&myClasses().length?`<button class="btn" data-a="nav" data-id="attendance">Take attendance</button>`:''}${isR('bursar')?`<button class="btn" data-a="payNew">Record payment</button>`:''}${isR('registrar')?`<button class="btn pri" data-a="studentNew">${ic('plus')} Add learner</button>`:''}${isR('hrm')?`<button class="btn pri" data-a="staffNew">${ic('plus')} Add staff member</button>`:''}`;
  const myCard=isR('teacher')?`<div class="card" style="margin-bottom:16px"><h3>My teaching</h3><div class="grid g3"><div><div class="muted sm">Class teacher of</div><b>${esc(myClasses().map(c=>c.name).join(', ')||'No class')}</b></div><div><div class="muted sm">Subjects I teach</div><b>${esc([...new Set(myTaught().map(a=>a.name+' ('+(cls(a.classId)?.name||'')+')'))].join(', ')||'None allocated yet')}</b></div><div><div class="muted sm">Lessons a week</div><b class="mono">${sum(myTaught().map(a=>a.periods))}</b></div></div></div>`:'';
  return ph(`${greet}, ${esc(ui.user?ui.user.name.split(' ')[0]:ROLES[ui.role])}`,`${esc(S.school.name)} · Term ${S.school.term}, ${S.school.year} · ${fdate(TODAY)}`,quick)+
  `${ui.user&&ui.user.role==='admin'&&S.userCount<3?`<div class="card" style="margin-bottom:16px"><h3>Get WalEduc ready for your school</h3><div class="grid g4"><button class="btn" data-a="nav" data-id="settings" data-tab="school">1. Upload the school badge</button><button class="btn" data-a="nav" data-id="settings" data-tab="users">2. Create staff accounts (HR manager, bursar, teachers…)</button><button class="btn" data-a="nav" data-id="settings" data-tab="users">3. Create learner and parent accounts</button><button class="btn" data-a="nav" data-id="settings" data-tab="roles">4. Check who can do what</button></div></div>`:''}${myCard}
  <div class="kpis">${allowed('students')?kpi('Learners',fmt(act.length),`${boys} boys · ${girls} girls`):''}${isR('admin','head','hrm','dos')?kpi('Staff',S.staff.filter(s=>s.status==='Active').length,`${S.staff.filter(s=>s.type==='Teaching').length} teaching`):''}${att?kpi('Attendance',rate==null?'—':rate+'%',ld?'on '+fdate(ld):'not recorded yet'):''}${allowed('fees')?kpi('Fees collected',pct(col,exp)+'%',`${ugx(col)} of ${ugx(exp)}`):''}${allowed('fees')?kpi('Outstanding',mny(exp-col),`${debtors.length} learners with balances`):''}${allowed('library')?kpi('Books overdue',S.loans.filter(l=>!l.returned&&l.due<TODAY).length,`${S.loans.filter(l=>!l.returned).length} on loan`):''}${isR('warden')?kpi('Boarders',act.filter(s=>s.boarding==='Boarding').length,`${S.dorms.length} dormitories`):''}${isR('sickbay')?kpi('Sick bay visits',S.sickbay.length,'all time'):''}${isR('hrm')?kpi('Staff present today',S.staffatt.filter(a=>a.date===TODAY&&a.mark!=='A').length,`of ${S.staff.filter(s=>s.status==='Active').length} active`):''}</div>
  <div class="grid ${att?'g21':'g2'}" style="margin-bottom:16px">${att?`<div class="card"><h3>Attendance, last ${trend.length} school days <span class="pill">% present</span></h3>${lineChart(trend,{min:60,max:100,suf:'%',label:'School attendance trend'})}</div>`:`<div class="card"><h3>Learners per class</h3>${barChart(byClass,{label:'Learners per class',step:5})}</div>`}
  <div class="card"><h3>Needs attention</h3><div class="list">${att_.join('')||'<div class="muted sm">Nothing needs your attention right now.</div>'}</div></div></div>
  ${allowed('students')?`<div class="grid g2" style="margin-bottom:16px">${att?`<div class="card"><h3>Learners per class</h3>${barChart(byClass,{label:'Learners per class',step:5})}</div>`:`<div class="card"><h3>Boys and girls</h3>${donut([{l:'Boys',v:boys},{l:'Girls',v:girls}],{center:act.length,sub:'learners'})}</div>`}
  ${allowed('fees')?`<div class="card"><h3>Fees collected by class <span class="pill">% of billed</span></h3>${barChart(feeCls,{max:100,label:'Fee collection rate by class',f:v=>Math.round(v)+'%'})}</div>`:`<div class="card"><h3>Learners by section</h3>${donut([{l:'Day',v:act.filter(s=>s.boarding==='Day').length},{l:'Boarding',v:act.filter(s=>s.boarding==='Boarding').length}],{center:act.length,sub:'learners'})}</div>`}</div>`:''}
  <div class="grid g2"><div class="card"><h3>Upcoming events <button class="btn sm" data-a="nav" data-id="events">Calendar</button></h3><div class="list">${up.map(e=>`<div><span><b>${esc(e.title)}</b><br><span class="muted sm">${fdate(e.date)}</span></span>${pill(e.kind==='exam'?'Exam':e.kind==='sport'?'Sports':e.kind==='holiday'?'Holiday':'School','')}</div>`).join('')||empty('No upcoming events')}</div></div>
  <div class="card"><h3>Notice board ${allowed('comms')&&policyCan('notices')?`<button class="btn sm" data-a="noticeNew">Post</button>`:''}</h3><div class="list">${S.notices.slice(0,4).map(n=>`<div><span><b>${esc(n.title)}</b><br><span class="muted sm">${esc(n.body)}</span><br><span class="xs muted">${fdate(n.date)} · ${esc(n.by)}</span></span></div>`).join('')||empty('No notices yet')}</div></div></div>`;
};
const policyCan=c=>({notices:['head','dos','bursar','registrar']}[c]||[]).includes(ui.role);
A.noticeNew=()=>openForm('Post a notice',[{k:'title',label:'Title',req:1,full:1},{k:'body',label:'Message',type:'textarea',full:1,req:1}],{},v=>{S.notices.unshift({id:uid('n'),date:TODAY,title:v.title,body:v.body,by:ui.user.name});log('Posted notice: '+v.title)},{save:'Post'});

/* ===== Learners ===== */
const REG=()=>isR('registrar');
const studentFields=v=>[{k:'first',label:'First name',req:1},{k:'last',label:'Surname',req:1},{k:'sex',label:'Sex',type:'select',opts:opts([['M','Male'],['F','Female']],v?.sex)},{k:'dob',label:'Date of birth',type:'date',req:1},
 {k:'classId',label:'Class',type:'select',opts:classOpts(v?.classId)},{k:'boarding',label:'Day or boarding',type:'select',opts:opts(['Day','Boarding'],v?.boarding)},
 {k:'gname',label:'Parent or guardian',req:1},{k:'gphone',label:'Guardian phone',req:1},{k:'grel',label:'Relationship',type:'select',opts:opts(['Father','Mother','Guardian','Uncle','Aunt','Sibling','Other'],v?.grel)},{k:'address',label:'Home area'},
 {k:'prevSchool',label:'Previous school'},{k:'appliedOn',label:'Date of application',type:'date'},{k:'admittedOn',label:'Date admitted',type:'date'},
 {k:'status',label:'Status',type:'select',opts:opts(['Active','Suspended','Transferred','Withdrawn','Completed'],v?.status||'Active')},{k:'medical',label:'Medical notes (allergies, conditions)',type:'textarea',full:1}];
const studentVals=s=>s?{...s,gname:s.guardian.name,gphone:s.guardian.phone,grel:s.guardian.rel}:{};
function saveStudent(id,v){
  const g={name:v.gname,phone:v.gphone,rel:v.grel};
  if(id){const s=stu(id);Object.assign(s,{first:v.first,last:v.last,sex:v.sex,dob:v.dob,classId:v.classId,boarding:v.boarding,address:v.address,status:v.status,medical:v.medical,guardian:g,prevSchool:v.prevSchool,appliedOn:v.appliedOn,admittedOn:v.admittedOn});if(s.boarding==='Day')s.dorm='';log('Updated learner '+sname(s));toast('Learner updated')}
  else{const s={id:uid('s'),adm:nextAdm(),first:v.first,last:v.last,sex:v.sex,dob:v.dob,classId:v.classId,boarding:v.boarding,dorm:'',status:v.status,guardian:g,address:v.address,medical:v.medical,bursary:0,arrears:0,prevSchool:v.prevSchool,appliedOn:v.appliedOn,admittedOn:v.admittedOn||TODAY,photo:ui.pend.student||undefined};ui.pend.student=null;S.students.push(s);log('Enrolled learner '+sname(s)+' ('+s.adm+')');toast('Learner added: '+s.adm)}
}
A.studentNew=()=>{if(!REG())return;ui.pend.student=null;openForm('Add a learner',studentFields({}),{},v=>saveStudent(null,v),{wide:1,save:'Add learner',pre:photoPre('student',{})})};
A.studentEdit=d=>{if(!REG())return;const s=stu(d.id);openForm('Edit '+sname(s),studentFields(studentVals(s)),studentVals(s),v=>saveStudent(d.id,v),{wide:1,pre:photoPre('student',s)})};
A.studentDel=d=>{if(!REG())return;const s=stu(d.id);confirmBox(`Remove <b>${esc(sname(s))}</b> from the system? Their marks, attendance and records are removed too. A learner who has payments cannot be removed. Mark them as Withdrawn or Transferred instead.`,()=>{S.students=S.students.filter(x=>x.id!==d.id);log('Removed learner '+sname(s));ui.route='students'},'Remove learner')};
A.studentOpen=d=>go('student',{id:d.id});
A.feeAdj=d=>{if(!isR('bursar'))return;const s=stu(d.id);openForm('Fee adjustments: '+sname(s),[{k:'bursary',label:'Bursary or discount (UGX)',type:'number',min:0,def:0},{k:'arrears',label:'Arrears brought forward (UGX)',type:'number',min:0,def:0}],s,v=>{s.bursary=+v.bursary||0;s.arrears=+v.arrears||0;log('Fee adjustments for '+sname(s))})};
PAGES.students=()=>{
  const f=n=>ui.f[n]||'';const q=f('sq').toLowerCase();
  let list=S.students.filter(s=>(!q||(sname(s)+s.adm+s.guardian.phone).toLowerCase().includes(q))&&(!f('scls')||s.classId===f('scls'))&&(!f('sst')||s.status===f('sst'))&&(!f('sbd')||s.boarding===f('sbd')));
  list.sort((a,b)=>sname(a).localeCompare(sname(b)));
  const pg=pager('s',list.length,20);
  return ph('Learners',`${active().length} active · ${S.students.length} on record${REG()?'':' · view only'}`,`<button class="btn" data-a="exportStudents">${ic('download')} Export CSV</button>${REG()?`<button class="btn" data-a="importLearners">Import from spreadsheet</button><button class="btn pri" data-a="studentNew">${ic('plus')} Add learner</button>`:''}`)+
  `<div class="tools">${inpSearch('sq','Search name, admission number or phone',f('sq'))}<select data-c="flt" data-k="scls" aria-label="Class"><option value="">All classes</option>${classOpts(f('scls'))}</select><select data-c="flt" data-k="sst" aria-label="Status"><option value="">All statuses</option>${opts(['Active','Suspended','Transferred','Withdrawn','Completed'],f('sst'))}</select><select data-c="flt" data-k="sbd" aria-label="Day or boarding"><option value="">Day and boarding</option>${opts(['Day','Boarding'],f('sbd'))}</select></div>`+
  table([{h:'Learner',f:s=>`<div class="person">${avS(s)}<span><b>${esc(sname(s))}</b><span class="muted sm">${s.sex==='M'?'Male':'Female'}, ${ageOf(s.dob)} yrs</span></span></div>`},{h:'Adm. no.',m:1,f:s=>esc(s.adm)},{h:'Class',f:s=>esc(cls(s.classId)?.name)},{h:'Section',f:s=>s.boarding==='Boarding'?pill('Boarding','info'):pill('Day')},{h:'Guardian',f:s=>`${esc(s.guardian.name)}<br><span class="mono sm muted">${esc(s.guardian.phone)}</span>`},
   ...(allowed('fees')?[{h:'Fees balance',r:1,m:1,f:s=>{const b=balOf(s);return b>0?`<span style="color:var(--bad)">${fmt(b)}</span>`:`<span style="color:var(--ok)">${b<0?'+'+fmt(-b):'Cleared'}</span>`}}]:[]),{h:'Status',f:s=>pill(s.status,s.status==='Active'?'ok':s.status==='Suspended'?'warn':'')}],pg.slice(list),{click:'studentOpen',empty:'No learners match. Try clearing the filters.'})+pg.html;
};
CH.flt=(v,d)=>{ui.f[d.k]=v;ui.f['sp']=1;ui.f['tp']=1;drawMain()};
A.exportStudents=()=>saveFile('walEduc-learners.csv',csv([['Adm no','First name','Surname','Sex','DOB','Class','Section','Dorm','Guardian','Phone','Status',...(allowed('fees')?['Fee balance']:[])],...S.students.map(s=>[s.adm,s.first,s.last,s.sex,s.dob,cls(s.classId)?.name,s.boarding,S.dorms.find(d=>d.id===s.dorm)?.name||'',s.guardian.name,s.guardian.phone,s.status,...(allowed('fees')?[balOf(s)]:[])])]));
A.importLearners=()=>openModal('Import learners from a spreadsheet',`<p class="muted sm" style="margin-bottom:10px">Choose a CSV file with the columns: <span class="mono">first, last, sex, dob, class, boarding, guardianName, guardianPhone, guardianRel, address</span>. The class must match a class name such as "S.1 A".</p><input id="impFile" type="file" accept=".csv,text/csv" aria-label="Choose a CSV file" data-c="impFile">`,{foot:`<button class="btn" data-a="closeModal">Close</button>`});
function parseCsv(t){const rows=[];let row=[],cur='',q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){cur+='"';i++}else q=false}else cur+=c}else if(c==='"')q=true;else if(c===','){row.push(cur);cur=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;row.push(cur);cur='';if(row.some(x=>x!==''))rows.push(row);row=[]}else cur+=c}row.push(cur);if(row.some(x=>x!==''))rows.push(row);return rows}
CH.impFile=(v,d,el)=>{const f=el.files&&el.files[0];el.value='';if(!f)return;const rd=new FileReader();rd.onload=async()=>{const rows=parseCsv(String(rd.result)),h=rows.shift().map(x=>x.trim());const objs=rows.map(r=>Object.fromEntries(h.map((k,i)=>[k,(r[i]||'').trim()])));
  try{await flush();const r=await api('POST','/api/import/learners',{rows:objs});await reloadAll();closeModal();toast(`${r.added} learners added${r.errors.length?', '+r.errors.length+' rows skipped':''}`);if(r.errors.length)openModal('Rows that were skipped',`<div class="list">${r.errors.map(e=>`<div>${esc(e)}</div>`).join('')}</div>`,{foot:`<button class="btn" data-a="closeModal">Close</button>`})}catch(e){toast(e.message)}};rd.readAsText(f)};

PAGES.student=()=>{
  const s=stu(ui.params.id);if(!s)return ph('Learner not found','')+empty('This learner no longer exists.');
  const c=cls(s.classId),b=balOf(s),pays=S.payments.filter(p=>p.studentId===s.id&&okPay(p)).sort((a,b)=>b.date.localeCompare(a.date));
  const days=Object.keys(S.attendance).sort().slice(-20);const marks=days.map(d=>(S.attendance[d]||{})[s.id]).filter(Boolean);
  const present=marks.filter(m=>m!=='A').length;
  const canMarks=isR('head','dos','registrar','examoffice');
  const exr=canMarks?S.exams.map(ex=>{const cid=placeOf(ex.id,s),r=results(ex.id,cid);const row=r.rows.find(x=>x.s.id===s.id);return{ex,row,of:r.rows.length}}).filter(x=>x.row&&x.row.n):[];
  const loans=S.loans.filter(l=>l.studentId===s.id);
  const dorm=S.dorms.find(d=>d.id===s.dorm);
  return `<div class="row" style="margin-bottom:12px"><button class="btn sm" data-a="nav" data-id="students">${ic('back')} All learners</button></div>
  <div class="card" style="margin-bottom:16px"><div class="row" style="justify-content:space-between;gap:16px"><div class="person" style="gap:16px">${avS(s,'lg')}<span><h1>${esc(sname(s))}</h1><span class="muted">${esc(s.adm)} · ${esc(c?.name)} · ${s.boarding}</span><div class="row" style="margin-top:6px">${pill(s.status,s.status==='Active'?'ok':'warn')}${s.bursary?pill('Bursary '+ugx(s.bursary),'gold'):''}${dorm?pill(dorm.name,'info'):''}</div></span></div>
  <div class="acts">${REG()?`<input id="phf2" type="file" accept="image/*" aria-label="Choose a photo to upload" data-c="photoFile" data-kind="student" data-id="${s.id}">`:''}<button class="btn" data-a="idCard" data-id="${s.id}">ID card</button>${REG()?`<button class="btn" data-a="studentEdit" data-id="${s.id}">Edit</button><button class="btn danger" data-a="studentDel" data-id="${s.id}">Remove</button>`:''}${exr.length&&exr[exr.length-1].ex.published?`<button class="btn" data-a="reportCard" data-id="${s.id}" data-ex="${exr[exr.length-1].ex.id}">Report card</button>`:''}${isR('bursar')?`<button class="btn" data-a="feeAdj" data-id="${s.id}">Fee adjustments</button><button class="btn pri" data-a="payNew" data-id="${s.id}">Record payment</button>`:''}</div></div></div>
  <div class="grid g2"><div class="stack"><div class="card"><h3>Personal details</h3><dl class="dl"><dt>Date of birth</dt><dd>${fdate(s.dob)} (${ageOf(s.dob)} years)</dd><dt>Sex</dt><dd>${s.sex==='M'?'Male':'Female'}</dd><dt>Home area</dt><dd>${esc(s.address||'—')}</dd>${['admin','head','dos','teacher','warden','registrar','sickbay'].includes(ui.role)?`<dt>Medical notes</dt><dd>${esc(s.medical||'None recorded')}</dd>`:''}</dl></div>
  <div class="card"><h3>Admission</h3><dl class="dl"><dt>Previous school</dt><dd>${esc(s.prevSchool||'—')}</dd><dt>Applied</dt><dd>${fdate(s.appliedOn)}</dd><dt>Admitted</dt><dd>${fdate(s.admittedOn)}</dd></dl></div>
  <div class="card"><h3>Parent or guardian</h3><dl class="dl"><dt>Name</dt><dd>${esc(s.guardian.name)}</dd><dt>Relationship</dt><dd>${esc(s.guardian.rel)}</dd><dt>Phone</dt><dd class="mono">${esc(s.guardian.phone)}</dd></dl></div>
  ${canMarks?`<div class="card"><h3>Academic results</h3>${exr.length?table([{h:'Exam',f:x=>esc(x.ex.name+' T'+x.ex.term)},{h:'Average',m:1,r:1,f:x=>x.row.avg.toFixed(1)},{h:'Position',m:1,r:1,f:x=>x.row.pos+' / '+x.of},{h:'',f:x=>x.ex.published?`<button class="btn sm" data-a="reportCard" data-id="${s.id}" data-ex="${x.ex.id}">Report card</button>`:pill('Not released')}],exr):empty('No results recorded yet.')}</div>`:''}</div>
  <div class="stack">${allowed('fees')?`<div class="card"><h3>Fees, Term ${S.school.term}</h3><dl class="dl"><dt>Term fees</dt><dd class="mono">${ugx(feeFor(s))}</dd><dt>Arrears</dt><dd class="mono">${ugx(s.arrears)}</dd><dt>Bursary</dt><dd class="mono">− ${ugx(s.bursary)}</dd><dt>Paid</dt><dd class="mono">${ugx(paidBy(s))}</dd><dt>Balance</dt><dd class="mono"><b style="color:${b>0?'var(--bad)':'var(--ok)'}">${ugx(b)}</b></dd></dl>
  <div class="bar ${b>0?'':'gold'}" style="margin:12px 0"><i style="width:${Math.min(100,pct(paidBy(s),billed(s)))}%"></i></div>${pays.length?`<div class="list">${pays.map(p=>`<div><span>${fdate(p.date)} · ${esc(p.method)}<br><span class="mono xs muted">${p.rct}</span></span><b class="mono">${fmt(p.amount)}</b></div>`).join('')}</div>`:'<div class="muted sm">No payments recorded.</div>'}</div>`:''}
  ${allowed('attendance')?`<div class="card"><h3>Attendance, last ${marks.length} days</h3><div class="row" style="gap:3px;margin-bottom:10px">${days.map(d=>{const m=(S.attendance[d]||{})[s.id];return m?`<span title="${fdate(d)}: ${m==='P'?'Present':m==='L'?'Late':'Absent'}" style="width:14px;height:22px;border-radius:3px;background:${m==='P'?'var(--ok)':m==='L'?'var(--warn)':'var(--bad)'}"></span>`:''}).join('')}</div><b class="mono">${marks.length?pct(present,marks.length)+'%':'—'}</b> <span class="muted">present · ${marks.filter(m=>m==='A').length} absences · ${marks.filter(m=>m==='L').length} late</span></div>`:''}
  <div class="card"><h3>Welfare${allowed('library')?' and library':''}</h3><div class="list">${S.discipline.filter(d=>d.studentId===s.id).map(d=>`<div><span>${fdate(d.date)} · ${esc(d.type)}<br><span class="muted sm">${esc(d.action)}</span></span>${pill(d.status,d.status==='Open'?'warn':'ok')}</div>`).join('')}${S.sickbay.filter(d=>d.studentId===s.id).map(d=>`<div><span>${fdate(d.date)} · Sick bay: ${esc(d.complaint)}<br><span class="muted sm">${esc(d.treatment)}</span></span>${pill('Health','info')}</div>`).join('')}${loans.map(l=>`<div><span>${esc(S.books.find(b=>b.id===l.bookId)?.title||'Book')}<br><span class="muted sm">Due ${fdate(l.due)}</span></span>${l.returned?pill('Returned','ok'):l.due<TODAY?pill('Overdue','bad'):pill('On loan','info')}</div>`).join('')}${!S.discipline.some(d=>d.studentId===s.id)&&!S.sickbay.some(d=>d.studentId===s.id)&&!loans.length?'<div class="muted sm">No welfare or library records.</div>':''}</div></div></div></div>`;
};

/* ===== Admissions (the Registrar handles everything here; others can look) ===== */
const STAGES=['Applied','Interview','Admitted','Enrolled'];
PAGES.admissions=()=>{
  const can=REG(),col=st=>{const l=S.applicants.filter(a=>a.stage===st);return `<div class="kcol"><h4><span>${st}</span><span class="mono">${l.length}</span></h4>${l.map(a=>`<div class="kc"><div class="person">${av(a.name)}<span><b>${esc(a.name)}</b><span class="muted sm">For ${esc(a.applyingFor)} · ${esc(a.sex==='M'?'Male':'Female')}</span></span></div><div class="sm muted">From ${esc(a.prevSchool||'—')}<br>Guardian: ${esc(a.guardian)} · <span class="mono">${esc(a.phone)}</span><br>Applied ${fdate(a.date)}${a.stage==='Interview'?`<br><b>Interview: ${fdate(a.interviewAt)}</b>${a.interviewVenue?' · '+esc(a.interviewVenue):''}`:''}${a.stage==='Admitted'&&a.admittedOn?`<br>Admitted ${fdate(a.admittedOn)}`:''}</div>${can?`<div class="row">${st==='Applied'?`<button class="btn sm pri" data-a="admInvite" data-id="${a.id}">Invite to interview</button><button class="btn sm" data-a="admAdmit" data-id="${a.id}" data-direct="1">Admit without interview</button>`:''}${st==='Interview'?`<button class="btn sm pri" data-a="admAdmit" data-id="${a.id}">Passed: admit</button><button class="btn sm" data-a="admInvite" data-id="${a.id}">Change interview</button>`:''}${st==='Admitted'?`<button class="btn sm gold" data-a="admEnrol" data-id="${a.id}">Enrol learner</button>`:''}${st==='Enrolled'&&a.studentId?`<button class="btn sm" data-a="studentOpen" data-id="${a.studentId}">View learner</button>`:''}${st!=='Enrolled'?`<button class="btn sm danger" data-a="admMove" data-id="${a.id}" data-to="Declined">Decline</button>`:''}</div>`:(st==='Enrolled'&&a.studentId?`<button class="btn sm" data-a="studentOpen" data-id="${a.studentId}">View learner</button>`:'')}</div>`).join('')||'<div class="muted sm" style="padding:8px">Empty</div>'}</div>`};
  const dec=S.applicants.filter(a=>a.stage==='Declined');
  return ph('Admissions',`${S.applicants.filter(a=>a.stage!=='Enrolled'&&a.stage!=='Declined').length} applications in progress${can?'':' · view only'}`,can?`<button class="btn pri" data-a="admNew">${ic('plus')} New application</button>`:'')+
  (can?`<div class="banner"><span><b>Messages go out automatically.</b> The guardian's phone number given on the application receives a text when an interview is arranged, when the applicant passes it and is admitted, or when an applicant is admitted without an interview.${S.sms&&S.sms.provider==='africastalking'?'':' Until the administrator connects an SMS provider, these messages are recorded in your message history instead of being sent.'}</span></div>`:'')+
  `<div class="kan">${STAGES.map(col).join('')}</div>${dec.length?`<div class="card" style="margin-top:16px"><h3>Declined (${dec.length})</h3><div class="list">${dec.map(a=>`<div><span>${esc(a.name)} · for ${esc(a.applyingFor)}</span>${can?`<button class="btn sm" data-a="admMove" data-id="${a.id}" data-to="Applied">Reopen</button>`:''}</div>`).join('')}</div></div>`:''}`;
};
A.admNew=()=>{if(!REG())return;openForm('New application',[{k:'name',label:'Applicant full name',req:1},{k:'sex',label:'Sex',type:'select',opts:opts([['M','Male'],['F','Female']])},{k:'dob',label:'Date of birth',type:'date',req:1},{k:'applyingFor',label:'Applying for',type:'select',opts:opts(['S1','S2','S3','S4','S5','S6'])},{k:'prevSchool',label:'Previous school'},{k:'guardian',label:'Parent or guardian',req:1},{k:'phone',label:'Contact phone for messages',req:1}],{},v=>{S.applicants.unshift({id:uid('a'),...v,stage:'Applied',date:TODAY,studentId:null,interviewAt:'',interviewVenue:'',admittedOn:''});log('New application: '+v.name)},{save:'Save application'})};
A.admMove=d=>{if(!REG())return;const a=S.applicants.find(x=>x.id===d.id);a.stage=d.to;log(`${a.name} moved to ${d.to}`);save();render();toast(`${a.name}: ${d.to}`)};
A.admInvite=d=>{if(!REG())return;const a=S.applicants.find(x=>x.id===d.id);openForm('Interview for '+a.name,[{k:'interviewAt',label:'Interview date',type:'date',req:1,def:addDays(TODAY,3)},{k:'interviewVenue',label:'Venue or room'}],a,v=>{a.stage='Interview';a.interviewAt=v.interviewAt;a.interviewVenue=v.interviewVenue;log(`${a.name} invited to interview`);toast('Interview set. A message goes to '+a.phone)},{save:'Invite and send message'})};
A.admAdmit=d=>{if(!REG())return;const a=S.applicants.find(x=>x.id===d.id);confirmBox(`${d.direct?`Admit <b>${esc(a.name)}</b> without an interview?`:`Record that <b>${esc(a.name)}</b> passed the interview and admit them?`} A message is sent to ${esc(a.phone)}.`,()=>{a.stage='Admitted';a.admittedOn=TODAY;log(`${a.name} admitted${d.direct?' without interview':''}`);toast('Admitted. The guardian is being informed.')},'Admit')};
A.admEnrol=d=>{if(!REG())return;const a=S.applicants.find(x=>x.id===d.id);const n=+a.applyingFor.slice(1);const opts_=S.classes.filter(c=>c.form===n);
  if(!opts_.length){toast('No class for '+a.applyingFor);return}
  const best=opts_.map(c=>({c,n:inClass(c.id).length})).sort((x,y)=>x.n-y.n)[0].c;
  const [first,...rest]=a.name.split(' ');const s={id:uid('s'),adm:nextAdm(),first,last:rest.join(' ')||'-',sex:a.sex,dob:a.dob,classId:best.id,boarding:'Day',dorm:'',status:'Active',guardian:{name:a.guardian,phone:a.phone,rel:'Guardian'},address:'',medical:'',bursary:0,arrears:0,prevSchool:a.prevSchool||'',appliedOn:a.date||'',admittedOn:a.admittedOn||TODAY};
  S.students.push(s);a.stage='Enrolled';a.studentId=s.id;log(`Enrolled ${a.name} into ${best.name} (${s.adm})`);save();go('student',{id:s.id});toast(`Enrolled into ${best.name}: ${s.adm}`)};

/* ===== Staff (the HR manager adds and removes; head and DoS assign duties) ===== */
const HRM=()=>isR('hrm');
const DUTY_HINT='Deputy Headteacher, Head of Department, Games Master, Senior Woman Teacher, Patron of a club…';
const staffFields=v=>[{k:'name',label:'Full name',req:1,full:1},{k:'sex',label:'Sex',type:'select',opts:opts([['M','Male'],['F','Female']],v?.sex)},{k:'type',label:'Category',type:'select',opts:opts(['Teaching','Non-teaching'],v?.type)},{k:'role',label:'Role / title',req:1,def:'Teacher'},{k:'dept',label:'Department'},{k:'subjectsText',label:'Subjects taught (comma separated)',full:1},{k:'dutiesText',label:'Other duties (comma separated)',full:1},{k:'phone',label:'Phone'},{k:'email',label:'Email',type:'email'},{k:'joined',label:'Date joined',type:'date'},{k:'status',label:'Status',type:'select',opts:opts(['Active','On leave','Left'],v?.status||'Active')}];
const csvList=t=>t?t.split(',').map(x=>x.trim()).filter(Boolean):[];
A.staffNew=()=>{if(!HRM())return;ui.pend.staff=null;openForm('Add a staff member',staffFields({}),{},v=>{S.staff.push({photo:ui.pend.staff||undefined,id:uid('t'),name:v.name,sex:v.sex,type:v.type,role:v.role,dept:v.dept,subjects:csvList(v.subjectsText),duties:csvList(v.dutiesText),phone:v.phone,email:v.email,joined:v.joined,status:v.status});ui.pend.staff=null;log('Added staff '+v.name)},{wide:1,pre:photoPre('staff',{})})};
A.staffEdit=d=>{if(!HRM())return;const t=tch(d.id);if(!t)return;const v={...t,subjectsText:t.subjects.join(', '),dutiesText:(t.duties||[]).join(', ')};openForm('Edit '+t.name,staffFields(v),v,x=>{Object.assign(t,{name:x.name,sex:x.sex,type:x.type,role:x.role,dept:x.dept,subjects:csvList(x.subjectsText),duties:csvList(x.dutiesText),phone:x.phone,email:x.email,joined:x.joined,status:x.status});log('Updated staff '+t.name)},{wide:1,pre:photoPre('staff',t)})};
A.staffDel=d=>{if(!HRM())return;const t=tch(d.id);confirmBox(`Remove <b>${esc(t.name)}</b> from the staff list? Their HR record is removed too, and any subjects or classes they had become unallocated. If they only left the school, set their status to "Left" instead and keep the history.`,()=>{S.staff=S.staff.filter(x=>x.id!==d.id);S.hr=S.hr.filter(x=>x.id!==d.id);S.subjects.forEach(x=>{if(x.teacherId===d.id)x.teacherId=''});S.classes.forEach(c=>{if(c.teacherId===d.id)c.teacherId=null});log('Removed staff '+t.name)},'Remove staff member')};
A.dutyEdit=d=>{if(!isR('head','dos'))return;const t=tch(d.id);openForm('Duties of '+t.name,[{k:'dutiesText',label:'Duties (comma separated)',full:1}],{dutiesText:(t.duties||[]).join(', ')},x=>{t.duties=csvList(x.dutiesText);log('Duties assigned to '+t.name)},{save:'Save duties',pre:`<p class="muted sm" style="margin-bottom:10px">For example: ${DUTY_HINT}. To make someone a class teacher, use Classes and subjects.</p>`})};
PAGES.staff=()=>{
  const q=(ui.f.tq||'').toLowerCase(),ty=ui.f.tty||'';
  const list=S.staff.filter(t=>(!q||(t.name+t.role+t.subjects.join(' ')+(t.duties||[]).join(' ')).toLowerCase().includes(q))&&(!ty||t.type===ty));
  return ph('Staff',`${S.staff.filter(s=>s.status==='Active').length} active · ${S.staff.filter(t=>t.type==='Teaching').length} teaching${HRM()?'':' · '+(isR('head','dos')?'you can assign duties':'view only')}`,`<button class="btn" data-a="exportStaff">${ic('download')} Export CSV</button>${HRM()?`<button class="btn pri" data-a="staffNew">${ic('plus')} Add staff</button>`:''}`)+
  `<div class="tools">${inpSearch('tq','Search name, role, subject or duty',ui.f.tq)}<select data-c="flt" data-k="tty" aria-label="Category"><option value="">All staff</option>${opts(['Teaching','Non-teaching'],ty)}</select></div>`+
  table([{h:'Name',f:t=>`<div class="person">${avT(t)}<span><b>${esc(t.name)}</b><span class="muted sm">${esc(t.role)}</span></span></div>`},{h:'Category',f:t=>pill(t.type,t.type==='Teaching'?'info':'')},{h:'Subjects',f:t=>esc(t.subjects.join(', ')||'—')},{h:'Duties',f:t=>esc(((t.duties||[]).concat(S.classes.filter(c=>c.teacherId===t.id).map(c=>'Class teacher, '+c.name))).join('; ')||'—')},{h:'Phone',m:1,f:t=>esc(t.phone||'—')},{h:'Status',f:t=>pill(t.status,t.status==='Active'?'ok':'warn')},
   ...(isR('head','dos')?[{h:'',r:1,f:t=>`<button class="btn sm" data-a="dutyEdit" data-id="${t.id}">Assign duties</button>`}]:[])],list,{click:HRM()?'staffEdit':undefined});
};
A.exportStaff=()=>saveFile('walEduc-staff.csv',csv([['Name','Role','Category','Subjects','Duties','Phone','Email','Joined','Status'],...S.staff.map(t=>[t.name,t.role,t.type,t.subjects.join('; '),(t.duties||[]).join('; '),t.phone,t.email,t.joined,t.status])]));
A.gs=d=>{$('#gsr').hidden=true;$('#gsq').value='';if(d.t==='student')go('student',{id:d.id});else if(allowed('staff')){go('staff',{},{});if(HRM())setTimeout(()=>A.staffEdit({id:d.id}),0)}};

CH.photoFile=(v,d,el)=>{const f=el.files&&el.files[0];el.value='';readPhoto(f,url=>{
  if(!d.id){ui.pend[d.kind]=url;const pv=$('#phprev');if(pv)pv.innerHTML=`<img class="av lg" src="${url}" alt="Photo preview">`;return}
  const o=d.kind==='student'?stu(d.id):tch(d.id);if(!o)return;o.photo=url;log('Photo updated: '+(d.kind==='student'?sname(o):o.name));save();const pv=$('#phprev');if(pv)pv.innerHTML=`<img class="av lg" src="${url}" alt="Photo">`;drawMain();drawSide();toast('Photo saved')})};
A.photoRemove=d=>{if(!d.id){ui.pend[d.kind]=null;const pv=$('#phprev');if(pv)pv.innerHTML=av('?','lg');return}const o=d.kind==='student'?stu(d.id):tch(d.id);if(!o)return;delete o.photo;flush().then(()=>api('DELETE','/api/photo/'+d.kind+'/'+d.id)).catch(e=>toast(e.message));const pv=$('#phprev');if(pv)pv.innerHTML=d.kind==='student'?avS(o,'lg'):avT(o,'lg');drawMain();toast('Photo removed')};
function idCardInner(s){const c=cls(s.classId);return `<div class="idc"><div class="t">${badge(34)}<span>${esc(S.school.name)}</span></div><div class="b">${s.photo?`<img class="ph" src="${s.photo}" alt="">`:`<div class="ph" style="display:flex;align-items:center;justify-content:center;font:700 26px var(--display);color:#6b7c72">${esc(initials(sname(s)))}</div>`}<div style="min-width:0"><div style="font:700 17px var(--display);line-height:1.2">${esc(sname(s))}</div><div style="font-size:12px;margin-top:6px;line-height:1.7"><b>Adm. no.</b> ${esc(s.adm)}<br><b>Class</b> ${esc(c?.name||'')}<br><b>Section</b> ${esc(s.boarding)}<br><b>Valid</b> Term ${S.school.term}, ${S.school.year}</div></div></div><div style="background:#E9EFEB;padding:6px 12px;font-size:10.5px;color:#44584d">${esc(S.school.address)}${S.school.phone?' · '+esc(S.school.phone):''}</div></div>`}
A.idCard=d=>{const s=stu(d.id);openModal('ID card · '+sname(s),`<div style="display:flex;justify-content:center">${idCardInner(s)}</div>`,{foot:`<button class="btn" data-a="closeModal">Close</button><button class="btn" data-a="idPrint" data-id="${s.id}">Print</button><button class="btn pri" data-a="idDownload" data-id="${s.id}">${ic('download')} Download</button>`})};
const ID_CSS='<style>.idc{width:340px;border:2px solid #0E4D3A;border-radius:14px;overflow:hidden}.idc .t{background:#0E4D3A;color:#fff;padding:10px 12px;display:flex;gap:10px;align-items:center;font-weight:700}.idc .b{display:flex;gap:12px;padding:12px}.idc img.ph{width:92px;height:110px;object-fit:cover}</style>';
A.idDownload=d=>{const s=stu(d.id);saveFile('id-card-'+sname(s).replace(/\W+/g,'-')+'.html',reportDocHTML('ID card',ID_CSS+idCardInner(s)))};
A.idPrint=d=>{const s=stu(d.id);printHTML('ID card',ID_CSS+idCardInner(s))};
/* print through a hidden frame, so the person gets the browser's print dialog without leaving WalEduc */
function printHTML(title,inner){
  const fr=document.createElement('iframe');fr.setAttribute('aria-hidden','true');fr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';document.body.appendChild(fr);
  const doc=fr.contentWindow.document;doc.open();doc.write(reportDocHTML(title,inner));doc.close();
  setTimeout(()=>{try{fr.contentWindow.focus();fr.contentWindow.print()}catch(e){toast('Printing is not available here. Use Download instead.')}setTimeout(()=>fr.remove(),4000)},350);
}

/* ===== Human resources (HR manager records; the head teacher can see) ===== */
const ATT_LBL={P:'Present',L:'Late',A:'Absent',V:'On leave',O:'Off duty'};
const hrOf=id=>S.hr.find(h=>h.id===id)||{id,salary:0,payFreq:'Monthly',allowances:0,bank:'',bankAcct:'',contract:'Permanent',contractStart:'',contractEnd:'',nssf:'',tin:'',qualification:'',nextOfKin:'',nextOfKinPhone:'',notes:''};
const activeStaff=()=>S.staff.filter(t=>t.status!=='Left');
PAGES.hr=()=>{
  const T=[['overview','Overview'],['att','Staff attendance'],['leave','Leave'],['pay','Payroll'],['contracts','Contracts'],['misc','Misconduct'],['hrep','Reports']],tb=curTab('hr',T),can=HRM();
  let body='';
  const st=activeStaff();
  if(tb==='overview'){
    const ends=S.hr.filter(h=>h.contractEnd&&h.contractEnd<=addDays(TODAY,60)&&tch(h.id)&&tch(h.id).status!=='Left').sort((a,b)=>a.contractEnd.localeCompare(b.contractEnd));
    const days=[...new Set(S.staffatt.map(a=>a.date))].sort().slice(-10),rate=days.length?pct(S.staffatt.filter(a=>days.includes(a.date)&&a.mark!=='A').length,S.staffatt.filter(a=>days.includes(a.date)).length):null;
    const byDept={};st.forEach(t=>byDept[t.dept||'Unassigned']=(byDept[t.dept||'Unassigned']||0)+1);
    const total=sum(st.map(t=>hrOf(t.id).salary+hrOf(t.id).allowances));
    body=`<div class="kpis">${kpi('Active staff',S.staff.filter(s=>s.status==='Active').length,`${S.staff.filter(t=>t.type==='Teaching'&&t.status==='Active').length} teaching · ${S.staff.filter(t=>t.type!=='Teaching'&&t.status==='Active').length} non-teaching`)}${kpi('On leave',S.staff.filter(s=>s.status==='On leave').length,`${S.leaves.filter(l=>l.status==='Pending').length} requests waiting`)}${kpi('Attendance',rate==null?'—':rate+'%',days.length?'last '+days.length+' days':'not recorded yet')}${kpi('Monthly payroll',mny(total),'salaries plus allowances')}${kpi('Contracts ending',ends.length,'within 60 days')}</div>
    <div class="grid g2"><div class="card"><h3>Staff by department</h3>${hbars(Object.entries(byDept).sort((a,b)=>b[1]-a[1]).map(([l,v])=>({l,v:pct(v,st.length),t:v})))}</div>
    <div class="card"><h3>Contracts ending soon</h3>${ends.length?`<div class="list">${ends.map(h=>`<div><span><b>${esc(tch(h.id).name)}</b><br><span class="muted sm">${esc(h.contract)} · ends ${fdate(h.contractEnd)}</span></span>${pill(Math.max(0,Math.round((parseD(h.contractEnd)-parseD(TODAY))/864e5))+' days','warn')}</div>`).join('')}</div>`:empty('No contracts end in the next 60 days.')}</div></div>
    <div class="card" style="margin-top:16px"><h3>What the Human Resource Manager looks after</h3><p class="muted sm">Adding and removing staff and their details (Staff page) · departments and duties · salaries, allowances and bank details (Payroll) · daily staff attendance · leave requests · contracts and renewals · misconduct reports, seen only by you and the head teacher · reports for management. Learners can be viewed but never changed from this account.</p></div>`;
  }
  if(tb==='att'){
    const date=ui.f.hrd||TODAY,rec=id=>(S.staffatt.find(a=>a.id===date+'|'+id)||{}).mark;
    const cnt={P:0,L:0,A:0,V:0,O:0};st.forEach(t=>{const m=rec(t.id);if(m)cnt[m]++});
    body=`<div class="tools"><input type="date" value="${date}" max="${TODAY}" data-c="hrDate" aria-label="Date">${Object.keys(cnt).map(k=>`<span class="pill ${k==='P'?'ok':k==='A'?'bad':k==='L'||k==='V'?'warn':''}">${ATT_LBL[k]} ${cnt[k]}</span>`).join('')}<span class="muted sm">${st.length-sum(Object.values(cnt))} not marked</span>${can?`<button class="btn sm" data-a="hrAll">Mark all present</button>`:''}</div>`+
    table([{h:'Staff member',f:t=>`<div class="person">${avT(t)}<span><b>${esc(t.name)}</b><span class="muted sm">${esc(t.role)}</span></span></div>`},{h:'Mark',r:1,f:t=>can?`<div class="seg">${Object.keys(ATT_LBL).map(k=>`<button class="${k==='O'||k==='V'?'L':k} ${rec(t.id)===k?'on':''}" data-a="hrMark" data-s="${t.id}" data-v="${k}" aria-pressed="${rec(t.id)===k}">${ATT_LBL[k]}</button>`).join('')}</div>`:(rec(t.id)?pill(ATT_LBL[rec(t.id)],rec(t.id)==='P'?'ok':'warn'):'—')}],st);
  }
  if(tb==='leave'){
    body=(can?`<div class="tools"><button class="btn pri" data-a="leaveNew">${ic('plus')} Record leave</button></div>`:'')+table([{h:'Staff member',f:l=>`<b>${esc(tch(l.staffId)?.name||'Removed')}</b>`},{h:'Type',f:l=>esc(l.type)},{h:'From',f:l=>fdate(l.from)},{h:'To',f:l=>fdate(l.to)},{h:'Note',f:l=>esc(l.note||'—')},{h:'Status',f:l=>pill(l.status,l.status==='Approved'?'ok':l.status==='Rejected'?'bad':'warn')},{h:'',r:1,f:l=>can&&l.status==='Pending'?`<button class="btn sm pri" data-a="leaveSet" data-id="${l.id}" data-v="Approved">Approve</button> <button class="btn sm danger" data-a="leaveSet" data-id="${l.id}" data-v="Rejected">Reject</button>`:can?`<button class="btn sm danger" data-a="leaveDel" data-id="${l.id}">Remove</button>`:''}],[...S.leaves].sort((a,b)=>b.from.localeCompare(a.from)),{empty:'No leave recorded yet.'});
  }
  if(tb==='pay'||tb==='contracts'){
    const pay=tb==='pay';
    body=`<div class="tools"><span class="muted sm">${pay?`Monthly payroll: <b class="mono">${ugx(sum(st.map(t=>hrOf(t.id).salary+hrOf(t.id).allowances)))}</b>`:'Contract types and renewal dates'}</span><button class="btn" data-a="${pay?'exportPay':'exportStaff'}">${ic('download')} Export CSV</button></div>`+
    table(pay?[{h:'Staff member',f:t=>`<b>${esc(t.name)}</b><br><span class="muted sm">${esc(t.role)}${t.dept?' · '+esc(t.dept):''}</span>`},{h:'Salary (UGX)',m:1,r:1,f:t=>fmt(hrOf(t.id).salary)},{h:'Allowances',m:1,r:1,f:t=>fmt(hrOf(t.id).allowances)},{h:'Total',m:1,r:1,f:t=>`<b>${fmt(hrOf(t.id).salary+hrOf(t.id).allowances)}</b>`},{h:'Paid',f:t=>esc(hrOf(t.id).payFreq)},{h:'Bank',f:t=>esc(hrOf(t.id).bank||'—')},{h:'',r:1,f:t=>can?`<button class="btn sm" data-a="hrEdit" data-id="${t.id}">Edit</button>`:''}]:
    [{h:'Staff member',f:t=>`<b>${esc(t.name)}</b><br><span class="muted sm">${esc(t.role)}</span>`},{h:'Contract',f:t=>esc(hrOf(t.id).contract)},{h:'Starts',f:t=>fdate(hrOf(t.id).contractStart)},{h:'Ends',f:t=>{const e=hrOf(t.id).contractEnd;return e?(e<TODAY?pill('Expired '+fdate(e),'bad'):e<=addDays(TODAY,60)?pill(fdate(e),'warn'):fdate(e)):'—'}},{h:'Qualification',f:t=>esc(hrOf(t.id).qualification||'—')},{h:'',r:1,f:t=>can?`<button class="btn sm" data-a="hrEdit" data-id="${t.id}">Edit</button>`:''}],st);
  }
  if(tb==='misc'){
    body=`<div class="banner"><span><b>Confidential.</b> Misconduct reports are visible only to the Human Resource Manager and the Head Teacher.</span></div>`+(can?`<div class="tools"><button class="btn pri" data-a="miscNew">${ic('plus')} Record a report</button></div>`:'')+table([{h:'Date',f:m=>fdate(m.date)},{h:'Staff member',f:m=>`<b>${esc(tch(m.staffId)?.name||'Removed')}</b>`},{h:'Type',f:m=>esc(m.type)},{h:'Details',f:m=>`<span class="sm">${esc(m.details)}</span>`},{h:'Action',f:m=>esc(m.action||'—')},{h:'Status',f:m=>pill(m.status,m.status==='Open'?'warn':'ok')},{h:'',r:1,f:m=>can?`${m.status==='Open'?`<button class="btn sm" data-a="miscClose" data-id="${m.id}">Resolve</button> `:''}<button class="btn sm danger" data-a="miscDel" data-id="${m.id}">Remove</button>`:''}],[...S.misconduct].sort((a,b)=>b.date.localeCompare(a.date)),{empty:'No reports recorded.'});
  }
  if(tb==='hrep'){
    body=`<div class="grid g3">${[['hr_staff','Staff list','Everyone with role, department, duties and contacts'],['hr_pay','Payroll sheet','Salary, allowances and bank for every staff member'],['hr_att','Attendance summary','Days present, late and absent per staff member (last 30 days)'],['hr_leave','Leave register','All leave requests and their status'],['hr_contract','Contract expiry','Contracts with their end dates']].map(r=>`<button class="card" style="text-align:left;cursor:pointer" data-a="hrReport" data-id="${r[0]}"><h3>${r[1]}</h3><p class="muted sm">${r[2]}</p><span class="btn sm" style="margin-top:8px">${ic('download')} Download CSV</span></button>`).join('')}</div>`;
  }
  return ph('Human resources',can?'Staff records, attendance, leave, payroll and conduct':'View only · staff records, attendance, leave and payroll')+tabs('hr',T)+body;
};
CH.hrDate=v=>{if(v){ui.f.hrd=v;drawMain()}};
A.hrMark=d=>{if(!HRM())return;const date=ui.f.hrd||TODAY,id=date+'|'+d.s,i=S.staffatt.findIndex(a=>a.id===id);const row={id,date,staffId:d.s,mark:d.v};if(i>=0)S.staffatt[i]=row;else S.staffatt.push(row);save();drawMain()};
A.hrAll=()=>{if(!HRM())return;const date=ui.f.hrd||TODAY;activeStaff().forEach(t=>{const id=date+'|'+t.id;if(!S.staffatt.some(a=>a.id===id))S.staffatt.push({id,date,staffId:t.id,mark:'P'})});log('Staff attendance recorded for '+date);save();drawMain();toast('Unmarked staff set to present')};
A.leaveNew=()=>{if(!HRM())return;openForm('Record leave',[{k:'staffId',label:'Staff member',type:'select',full:1,req:1,opts:`<option value="">Choose</option>${opts(activeStaff().map(t=>[t.id,t.name]))}`},{k:'type',label:'Type',type:'select',opts:opts(['Annual','Sick','Maternity','Paternity','Study','Compassionate','Unpaid'])},{k:'from',label:'From',type:'date',req:1,def:TODAY},{k:'to',label:'To',type:'date',req:1,def:TODAY},{k:'note',label:'Note',full:1}],{},v=>{if(!v.staffId){toast('Choose a staff member');return false}S.leaves.push({id:uid('lv'),staffId:v.staffId,type:v.type,from:v.from,to:v.to,status:'Pending',note:v.note});log('Leave recorded for '+tch(v.staffId).name)})};
A.leaveSet=d=>{if(!HRM())return;const l=S.leaves.find(x=>x.id===d.id);l.status=d.v;const t=tch(l.staffId);if(d.v==='Approved'&&t&&l.from<=TODAY&&l.to>=TODAY)t.status='On leave';log(`Leave ${d.v.toLowerCase()}: ${t?t.name:''}`);save();drawMain()};
A.leaveDel=d=>{if(!HRM())return;S.leaves=S.leaves.filter(x=>x.id!==d.id);save();drawMain()};
A.hrEdit=d=>{if(!HRM())return;const t=tch(d.id),h=hrOf(d.id);openForm('Employment details: '+t.name,[{k:'salary',label:'Salary (UGX)',type:'number',min:0,def:0},{k:'allowances',label:'Allowances (UGX)',type:'number',min:0,def:0},{k:'payFreq',label:'Paid',type:'select',opts:opts(['Monthly','Weekly','Termly'],h.payFreq)},{k:'bank',label:'Bank'},{k:'bankAcct',label:'Account number'},{k:'contract',label:'Contract',type:'select',opts:opts(['Permanent','Fixed-term','Probation','Part-time','Volunteer'],h.contract)},{k:'contractStart',label:'Contract starts',type:'date'},{k:'contractEnd',label:'Contract ends',type:'date'},{k:'nssf',label:'NSSF number'},{k:'tin',label:'TIN'},{k:'qualification',label:'Qualification',full:1},{k:'nextOfKin',label:'Next of kin'},{k:'nextOfKinPhone',label:'Next of kin phone'},{k:'notes',label:'Notes',type:'textarea',full:1}],h,v=>{const row={id:d.id,salary:+v.salary||0,allowances:+v.allowances||0,payFreq:v.payFreq,bank:v.bank,bankAcct:v.bankAcct,contract:v.contract,contractStart:v.contractStart,contractEnd:v.contractEnd,nssf:v.nssf,tin:v.tin,qualification:v.qualification,nextOfKin:v.nextOfKin,nextOfKinPhone:v.nextOfKinPhone,notes:v.notes},i=S.hr.findIndex(x=>x.id===d.id);if(i>=0)S.hr[i]=row;else S.hr.push(row);log('Employment details updated for '+t.name)},{wide:1})};
A.miscNew=()=>{if(!HRM())return;openForm('Record a misconduct report',[{k:'staffId',label:'Staff member',type:'select',full:1,req:1,opts:`<option value="">Choose</option>${opts(S.staff.map(t=>[t.id,t.name]))}`},{k:'date',label:'Date',type:'date',def:TODAY,req:1},{k:'type',label:'Type',type:'select',opts:opts(['Late coming','Absenteeism','Insubordination','Negligence of duty','Improper conduct','Misuse of school property','Other'])},{k:'details',label:'Details',type:'textarea',full:1,req:1},{k:'action',label:'Action taken',full:1}],{date:TODAY},v=>{if(!v.staffId){toast('Choose a staff member');return false}S.misconduct.unshift({id:uid('mc'),staffId:v.staffId,date:v.date,type:v.type,details:v.details,action:v.action,status:'Open'});log('Misconduct report recorded')})};
A.miscClose=d=>{if(!HRM())return;S.misconduct.find(x=>x.id===d.id).status='Resolved';save();drawMain()};
A.miscDel=d=>{if(!HRM())return;confirmBox('Remove this report?',()=>{S.misconduct=S.misconduct.filter(x=>x.id!==d.id)},'Remove')};
A.exportPay=()=>saveFile('walEduc-payroll.csv',csv([['Name','Role','Salary UGX','Allowances UGX','Total UGX','Paid','Bank','Account'],...activeStaff().map(t=>{const h=hrOf(t.id);return[t.name,t.role,h.salary,h.allowances,h.salary+h.allowances,h.payFreq,h.bank,h.bankAcct]})]));
A.hrReport=d=>{const st=activeStaff(),from=addDays(TODAY,-30);
  const m={hr_staff:()=>['walEduc-staff.csv',[['Name','Role','Category','Department','Subjects','Duties','Phone','Email','Status'],...S.staff.map(t=>[t.name,t.role,t.type,t.dept,t.subjects.join('; '),(t.duties||[]).join('; '),t.phone,t.email,t.status])]],
   hr_pay:()=>['walEduc-payroll.csv',[['Name','Role','Salary UGX','Allowances UGX','Total UGX','Paid','Bank'],...st.map(t=>{const h=hrOf(t.id);return[t.name,t.role,h.salary,h.allowances,h.salary+h.allowances,h.payFreq,h.bank]})]],
   hr_att:()=>['walEduc-staff-attendance.csv',[['Name','Present','Late','Absent','On leave'],...st.map(t=>{const a=S.staffatt.filter(x=>x.staffId===t.id&&x.date>=from);return[t.name,a.filter(x=>x.mark==='P').length,a.filter(x=>x.mark==='L').length,a.filter(x=>x.mark==='A').length,a.filter(x=>x.mark==='V').length]})]],
   hr_leave:()=>['walEduc-leave.csv',[['Name','Type','From','To','Status','Note'],...S.leaves.map(l=>[tch(l.staffId)?.name,l.type,l.from,l.to,l.status,l.note])]],
   hr_contract:()=>['walEduc-contracts.csv',[['Name','Contract','Starts','Ends'],...st.map(t=>{const h=hrOf(t.id);return[t.name,h.contract,h.contractStart,h.contractEnd]})]]}[d.id]();
  saveFile(m[0],csv(m[1]))};

/* ===== Classes & subjects (head, registrar and DoS add or remove; the DoS allocates teachers) ===== */
const CLS_EDIT=()=>isR('head','registrar','dos');
PAGES.classes=()=>{
  const sel=ui.params.cls&&cls(ui.params.cls);
  const cards=S.classes.map(c=>{const l=inClass(c.id),t=tch(c.teacherId);
    return `<button class="card" style="text-align:left;cursor:pointer;${sel&&sel.id===c.id?'outline:2px solid var(--gold)':''}" data-a="clsOpen" data-id="${c.id}"><div class="row" style="justify-content:space-between"><h3>${esc(c.name)}</h3>${pill(c.level==='O'?'O-Level':'A-Level',c.level==='O'?'info':'gold')}</div><div class="muted sm" style="margin:6px 0 12px">Class teacher: ${esc(t?.name||'Not assigned')}</div><div class="row" style="justify-content:space-between"><span><b class="mono" style="font-size:20px">${l.length}</b> <span class="muted sm">learners</span></span><span class="muted sm">${subjRows(c).length} subjects</span></div></button>`}).join('');
  let detail='';
  if(sel){const rows=subjRows(sel),dos=isR('dos'),staffT=S.staff.filter(t=>t.type==='Teaching'&&t.status!=='Left');
    detail=`<div class="grid g2" style="margin-top:16px"><div class="card"><h3>${esc(sel.name)} · learners</h3>${table([{h:'Learner',f:x=>`<div class="person">${avS(x)}<b>${esc(sname(x))}</b></div>`},{h:'Adm. no.',m:1,f:x=>esc(x.adm)},{h:'Sex',f:x=>x.sex}],inClass(sel.id),{click:'studentOpen'})}</div>
    <div class="stack"><div class="card"><h3>Class teacher</h3>${isR('head','dos')?`<div class="field"><select id="clsT" data-c="clsTeacher" data-id="${sel.id}" aria-label="Class teacher">${opts([['','Not assigned'],...staffT.map(t=>[t.id,t.name])],sel.teacherId||'')}</select></div><p class="muted xs" style="margin-top:6px">The class teacher takes the register and sees all marks for this class.</p>`:`<b>${esc(tch(sel.teacherId)?.name||'Not assigned')}</b>`}</div>
    <div class="card"><h3>Subjects and teachers ${CLS_EDIT()?`<button class="btn sm" data-a="subjNew" data-id="${sel.id}">${ic('plus')} Add subject</button>`:''}</h3>${table([{h:'Subject',f:x=>`<b>${esc(x.name)}</b>`},{h:'Teacher',f:x=>dos?`<select class="inl" style="width:auto;text-align:left;font-family:inherit" data-c="subjTeacher" data-id="${esc(x.id)}" aria-label="Teacher for ${esc(x.name)}"><option value="">Not allocated</option>${opts(staffT.filter(t=>!t.subjects.length||t.subjects.includes(x.name)||t.id===x.teacherId).map(t=>[t.id,t.name]),x.teacherId)}</select>`:esc(tch(x.teacherId)?.name||'Not allocated')},{h:'Lessons / week',m:1,r:1,f:x=>dos?`<input class="inl" type="number" min="0" max="40" value="${x.periods}" data-c="subjPeriods" data-id="${esc(x.id)}" aria-label="Lessons a week for ${esc(x.name)}" style="width:64px">`:x.periods},...(CLS_EDIT()?[{h:'',r:1,f:x=>`<button class="btn sm danger" data-a="subjDel" data-id="${esc(x.id)}">Remove</button>`}]:[])],rows,{empty:'No subjects yet.'})}${dos?'<p class="muted xs" style="margin-top:8px">Teachers whose subject list includes the subject are offered first. Teachers are told when a subject is allocated to them.</p>':''}</div>
    ${CLS_EDIT()?`<div class="card"><h3>Remove this class</h3><p class="muted sm" style="margin-bottom:10px">A class with learners cannot be removed. Move or remove the learners first.</p><button class="btn danger" data-a="clsDel" data-id="${sel.id}">Remove ${esc(sel.name)}</button></div>`:''}</div></div>`}
  return ph('Classes & subjects',`${S.classes.length} classes · ${active().length} active learners${CLS_EDIT()?'':' · view only'}`,CLS_EDIT()?`<button class="btn pri" data-a="clsNew">${ic('plus')} Add class</button>`:'')+`<div class="grid g4">${cards}</div>${detail}`;
};
A.clsOpen=d=>{ui.params.cls=d.id;drawMain()};
CH.clsTeacher=(v,d)=>{cls(d.id).teacherId=v||null;log('Class teacher changed for '+cls(d.id).name);save();drawMain();toast('Class teacher updated')};
CH.subjTeacher=(v,d)=>{const a=S.subjects.find(x=>x.id===d.id);a.teacherId=v;log(`Subject allocated: ${a.name}, ${cls(a.classId)?.name}`);save();drawMain();toast('Allocation saved')};
CH.subjPeriods=(v,d)=>{const a=S.subjects.find(x=>x.id===d.id);a.periods=Math.max(0,Math.min(40,Math.round(+v||0)));save();toast('Saved')};
A.clsNew=()=>{if(!CLS_EDIT())return;openForm('Add a class',[{k:'name',label:'Class name (for example S.3 C)',req:1},{k:'level',label:'Level',type:'select',opts:opts([['O','O-Level (S.1 to S.4)'],['A','A-Level (S.5 to S.6)']])},{k:'form',label:'Form (1 to 6)',type:'number',min:1,max:6,req:1,def:1},{k:'stream',label:'Stream (A, B, Arts, Sciences…)'}],{},v=>{
  const id=uid('c'),c={id,name:v.name,level:v.level,form:Math.max(1,Math.min(6,+v.form||1)),stream:v.stream||'',teacherId:null};S.classes.push(c);
  defSubj(c).forEach(name=>S.subjects.push({id:id+'|'+name,classId:id,name,teacherId:'',periods:4}));ui.params.cls=id;log('Added class '+v.name)},{save:'Add class'})};
A.clsDel=d=>{if(!CLS_EDIT())return;const c=cls(d.id);if(S.students.some(s=>s.classId===c.id)){toast('This class still has learners. Move or remove them first.');return}confirmBox(`Remove <b>${esc(c.name)}</b> and its subject list?`,()=>{S.classes=S.classes.filter(x=>x.id!==c.id);S.subjects=S.subjects.filter(x=>x.classId!==c.id);ui.params.cls='';log('Removed class '+c.name)},'Remove class')};
A.subjNew=d=>{if(!CLS_EDIT())return;const c=cls(d.id);openForm('Add a subject to '+c.name,[{k:'name',label:'Subject name',req:1,full:1}],{},v=>{if(S.subjects.some(x=>x.id===c.id+'|'+v.name)){toast('That subject already exists in '+c.name);return false}S.subjects.push({id:c.id+'|'+v.name,classId:c.id,name:v.name,teacherId:'',periods:4});log(`Added subject ${v.name} to ${c.name}`)},{save:'Add subject'})};
A.subjDel=d=>{if(!CLS_EDIT())return;const a=S.subjects.find(x=>x.id===d.id);confirmBox(`Remove <b>${esc(a.name)}</b> from ${esc(cls(a.classId)?.name||'')}? It is also taken off the timetable. Marks already entered stay on record.`,()=>{S.subjects=S.subjects.filter(x=>x.id!==d.id);log('Removed subject '+a.name)},'Remove subject')};

/* ===== Timetable (the Director of Studies designs; everyone else looks) ===== */
const DOS=()=>isR('dos');
const fmtT=t=>t;
const slotLabel=s=>s.type==='break'?`${esc(s.label||'BREAK')} ${s.from} – ${s.to}`:`${s.from} – ${s.to}`;
function teacherClash(cid,d,p){
  const sub=ttGet(cid,d)[p];if(!sub)return null;const t=teacherFor(cls(cid),sub);if(!t)return null;
  for(const c of S.classes){if(c.id===cid)continue;const s2=ttGet(c.id,d)[p];if(s2&&teacherFor(c,s2)&&teacherFor(c,s2).id===t.id)return `${t.name} is also teaching ${s2} to ${c.name} at this time`}
  return null;
}
function ttGrid(cid,edit,mineOnly){
  const c=cls(cid),cfg=TTC(),sl=lessonSlots(),days=cfg.days;
  if(!c)return empty('Choose a class.');
  return `<div class="tw"><table class="t tt"><thead><tr><th style="width:130px">Time</th>${days.map(d=>`<th>${DAYS[d]}</th>`).join('')}</tr></thead><tbody>${sl.map(s=>s.p<0?`<tr><td class="brk" colspan="${days.length+1}">${slotLabel(s)}</td></tr>`:`<tr><th class="mono">${slotLabel(s)}</th>${days.map(d=>{const v=ttGet(cid,d)[s.p]||'';const t=v?teacherFor(c,v):null,clash=edit&&v?teacherClash(cid,d,s.p):null;
    if(!edit)return`<td><b>${esc(v||'—')}</b>${t?`<div class="xs muted">${esc(tname(t))}</div>`:''}</td>`;
    return`<td style="${clash?'background:color-mix(in srgb,var(--bad) 14%,transparent)':''}"><select data-c="ttset" data-cid="${cid}" data-d="${d}" data-p="${s.p}" aria-label="${DAYS[d]}, ${s.from}"><option value="">Free</option>${opts(subjectsOf(c),v)}</select><div class="xs muted">${esc(tname(t)||(v?'No teacher allocated':''))}</div>${clash?`<div class="xs" style="color:var(--bad)" title="${esc(clash)}">Clash</div>`:''}</td>`}).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function myLessonsGrid(){
  const cfg=TTC(),sl=lessonSlots(),days=cfg.days,mine=new Set(myTaught().map(a=>a.id));
  const cell=(d,p)=>S.classes.map(c=>{const sub=ttGet(c.id,d)[p];return sub&&mine.has(c.id+'|'+sub)?`<div><b>${esc(sub)}</b><div class="xs muted">${esc(c.name)}</div></div>`:''}).join('')||'<span class="muted">—</span>';
  return `<div class="tw"><table class="t tt"><thead><tr><th style="width:130px">Time</th>${days.map(d=>`<th>${DAYS[d]}</th>`).join('')}</tr></thead><tbody>${sl.map(s=>s.p<0?`<tr><td class="brk" colspan="${days.length+1}">${slotLabel(s)}</td></tr>`:`<tr><th class="mono">${slotLabel(s)}</th>${days.map(d=>`<td>${cell(d,s.p)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
const examsOpen=()=>S.exams.slice().sort((a,b)=>(b.year-a.year)||(b.term-a.term));
function examTTList(examId,classId){
  const rows=S.examtt.filter(r=>r.examId===examId&&(!classId||r.classId===classId)).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
  return table([{h:'Date',f:r=>`<b>${fdate(r.date)}</b><br><span class="muted sm">${DAYS[(parseD(r.date).getDay()+6)%7]}</span>`},{h:'Time',m:1,f:r=>esc(r.start?r.start+(r.end?' – '+r.end:''):'—')},{h:'Class',f:r=>esc(cls(r.classId)?.name||'')},{h:'Subject',f:r=>`<b>${esc(r.subject)}</b>`},{h:'Venue',f:r=>esc(r.venue||'—')},{h:'Invigilator',f:r=>esc(r.invigilator||'—')},...(DOS()?[{h:'',r:1,f:r=>`<button class="btn sm" data-a="xttEdit" data-id="${r.id}">Edit</button> <button class="btn sm danger" data-a="xttDel" data-id="${r.id}">Remove</button>`}]:[])],rows,{empty:'No exam papers are scheduled yet.'});
}
PAGES.timetable=()=>{
  const teacher=isR('teacher'),dos=DOS();
  const T=dos?[['les','Lesson timetable'],['exm','Exams timetable'],['lay','Days and times']]:teacher?[['my','My lessons'],['cls','My class'],['exm','Exams timetable']]:[['les','Lesson timetable'],['exm','Exams timetable']];
  const tb=curTab('tt',T);let body='';
  const classList=teacher?myClasses():S.classes,cid=classList.some(c=>c.id===ui.f.ttc)?ui.f.ttc:(classList[0]&&classList[0].id);
  const csel=`<select data-c="flt" data-k="ttc" aria-label="Class">${opts(classList.map(c=>[c.id,c.name]),cid)}</select>`;
  if(tb==='les'){
    const c=cls(cid);
    body=`<div class="tools">${csel}${dos?`<button class="btn pri" data-a="ttPublish">Send timetable to teachers</button>`:''}<span class="muted sm">${dos?'Choose a subject for any slot. Teachers come from the allocations in Classes & subjects. Changes save as you go.':'View only. The Director of Studies designs the timetable.'}</span></div>`+ttGrid(cid,dos);
    if(dos&&c){const rows=subjRows(c);body+=`<div class="card" style="margin-top:16px"><h3>Lessons placed for ${esc(c.name)}</h3>${table([{h:'Subject',f:a=>`<b>${esc(a.name)}</b>`},{h:'Teacher',f:a=>esc(tch(a.teacherId)?.name||'Not allocated')},{h:'Planned / week',m:1,r:1,f:a=>a.periods},{h:'On timetable',m:1,r:1,f:a=>{const n=TTC().days.reduce((m,d)=>m+ttGet(c.id,d).filter(x=>x===a.name).length,0);return `<b style="color:${n===a.periods?'var(--ok)':'var(--warn)'}">${n}</b>`}}],rows)}</div>`}
  }
  if(tb==='my'){body=`<p class="muted" style="margin-bottom:12px">Your lessons across all classes, from the allocations made by the Director of Studies.</p>`+(myTaught().length?myLessonsGrid():empty('No subjects have been allocated to you yet.'))}
  if(tb==='cls'){body=myClasses().length?`<div class="tools">${csel}</div>`+ttGrid(cid,false):empty('You are not a class teacher. Class teachers see the full timetable of their own class here.')}
  if(tb==='exm'){
    const ex=S.exams.find(e=>e.id===ui.f.xe)||examsOpen()[0];
    body=!ex?empty('No exam sessions yet.'):`<div class="tools"><select data-c="flt" data-k="xe" aria-label="Exam session">${opts(examsOpen().map(e=>[e.id,`${e.name} · Term ${e.term}, ${e.year}`]),ex.id)}</select>${dos?`<button class="btn pri" data-a="xttNew" data-ex="${ex.id}">${ic('plus')} Add paper</button><button class="btn" data-a="xttPublish" data-ex="${ex.id}">Tell teachers and learners</button>`:''}</div>`+examTTList(ex.id,teacher?null:null);
  }
  if(tb==='lay'){
    const cfg=TTC();
    body=`<div class="grid g2"><div class="card"><h3>School days</h3><div class="row" style="gap:14px">${DAYS.map((n,i)=>`<label class="row sm" style="gap:6px"><input type="checkbox" data-c="ttday" data-d="${i}" ${cfg.days.includes(i)?'checked':''}> ${n}</label>`).join('')}</div><p class="muted xs" style="margin-top:10px">Tick a day to add it to the timetable and untick it to remove it.</p></div>
    <div class="card"><h3>Lessons and breaks <button class="btn sm" data-a="slotNew">${ic('plus')} Add slot</button></h3>${table([{h:'Type',f:(s,i)=>pill(s.type==='break'?'Break':'Lesson',s.type==='break'?'':'info')},{h:'From',f:s=>`<input class="inl" type="time" value="${s.from}" data-c="slotEdit" data-i="${s._i}" data-k="from" style="width:110px;text-align:left">`},{h:'To',f:s=>`<input class="inl" type="time" value="${s.to}" data-c="slotEdit" data-i="${s._i}" data-k="to" style="width:110px;text-align:left">`},{h:'Label',f:s=>s.type==='break'?`<input class="inl" value="${esc(s.label||'')}" data-c="slotEdit" data-i="${s._i}" data-k="label" style="width:110px;text-align:left">`:'—'},{h:'',r:1,f:s=>`<button class="btn sm danger" data-a="slotDel" data-i="${s._i}">Remove</button>`}],cfg.slots.map((s,i)=>({...s,_i:i})))}<p class="muted xs" style="margin-top:10px">Adjust any time directly. Adding or removing a lesson slot changes the lesson numbering for every class.</p></div></div>`;
  }
  return ph('Timetable',dos?'Design the lesson and exams timetables':'Lesson and exams timetables',teacher&&tb==='my'?'':'')+tabs('tt',T)+body;
};
const saveTTC=(mut)=>{const cfg=JSON.parse(JSON.stringify(TTC()));mut(cfg);const i=S.ttcfg.findIndex(x=>x.id==='main');if(i>=0)S.ttcfg[i]=cfg;else S.ttcfg.push(cfg);
  const n=cfg.slots.filter(s=>s.type==='lesson').length;for(const cid in S.tt)for(const d in S.tt[cid])if(S.tt[cid][d].length>n)S.tt[cid][d]=S.tt[cid][d].slice(0,n);save();drawMain()};
CH.ttset=(v,d)=>{if(!DOS())return;const cid=d.cid,day=+d.d,p=+d.p,n=nLessons();S.tt[cid]=S.tt[cid]||{};const row=(S.tt[cid][day]||[]).slice();while(row.length<n)row.push('');row[p]=v;S.tt[cid][day]=row;save();drawMain();toast('Timetable updated')};
CH.ttday=(v,d,el)=>{if(!DOS())return;saveTTC(cfg=>{const i=+d.d;cfg.days=el.checked?[...new Set([...cfg.days,i])].sort():cfg.days.filter(x=>x!==i);if(!cfg.days.length){cfg.days=[i];toast('Keep at least one school day')}})};
CH.slotEdit=(v,d)=>{if(!DOS())return;saveTTC(cfg=>{cfg.slots[+d.i][d.k]=v})};
A.slotDel=d=>{if(!DOS())return;const cfg=TTC();if(cfg.slots.length<=1){toast('Keep at least one slot');return}confirmBox('Remove this time slot? Lessons placed in it are removed from every class timetable.',()=>{const s=cfg.slots[+d.i];let lp=-1;if(s.type==='lesson'){lp=cfg.slots.slice(0,+d.i).filter(x=>x.type==='lesson').length;for(const cid in S.tt)for(const dd in S.tt[cid])S.tt[cid][dd]=S.tt[cid][dd].filter((_,k)=>k!==lp)}saveTTC(c=>{c.slots.splice(+d.i,1)})},'Remove slot')};
A.slotNew=()=>{if(!DOS())return;openForm('Add a time slot',[{k:'type',label:'Type',type:'select',opts:opts([['lesson','Lesson'],['break','Break']])},{k:'from',label:'From',type:'time',req:1,def:'15:20'},{k:'to',label:'To',type:'time',req:1,def:'16:00'},{k:'label',label:'Label (for a break)'}],{},v=>{if(v.from>=v.to){toast('The end time must be after the start time');return false}saveTTC(cfg=>{cfg.slots.push({type:v.type,from:v.from,to:v.to,...(v.type==='break'?{label:v.label||'BREAK'}:{})});cfg.slots.sort((a,b)=>a.from.localeCompare(b.from))})},{save:'Add slot'})};
A.ttPublish=()=>{if(!DOS())return;flush().then(()=>api('POST','/api/timetable/publish',{})).then(r=>toast(`Sent to ${r.teachers} teachers`)).catch(e=>toast(e.message))};
const xttForm=(ex,v)=>[{k:'cs',label:'Class and subject',type:'select',full:1,req:1,opts:`<option value="">Choose</option>`+S.classes.map(c=>`<optgroup label="${esc(c.name)}">${subjRows(c).map(a=>`<option value="${esc(c.id+'|'+a.name)}" ${v&&v.cs===c.id+'|'+a.name?'selected':''}>${esc(a.name)}</option>`).join('')}</optgroup>`).join('')},{k:'date',label:'Date',type:'date',req:1,def:addDays(TODAY,7)},{k:'start',label:'Starts',type:'time',def:'08:30'},{k:'end',label:'Ends',type:'time',def:'10:00'},{k:'venue',label:'Venue'},{k:'invigilator',label:'Invigilator'}];
A.xttNew=d=>{if(!DOS())return;openForm('Add an exam paper',xttForm(d.ex),{date:addDays(TODAY,7)},v=>{if(!v.cs){toast('Choose a class and subject');return false}const [classId,...r]=v.cs.split('|');S.examtt.push({id:uid('xt'),examId:d.ex,classId,subject:r.join('|'),date:v.date,start:v.start,end:v.end,venue:v.venue,invigilator:v.invigilator});log('Exam paper scheduled')},{save:'Add paper'})};
A.xttEdit=d=>{if(!DOS())return;const r=S.examtt.find(x=>x.id===d.id),v={...r,cs:r.classId+'|'+r.subject};openForm('Edit exam paper',xttForm(r.examId,v),v,x=>{const [classId,...rest]=x.cs.split('|');Object.assign(r,{classId,subject:rest.join('|'),date:x.date,start:x.start,end:x.end,venue:x.venue,invigilator:x.invigilator});log('Exam paper updated')})};
A.xttDel=d=>{if(!DOS())return;S.examtt=S.examtt.filter(x=>x.id!==d.id);save();drawMain()};
A.xttPublish=d=>{if(!DOS())return;flush().then(()=>api('POST','/api/examtt/publish',{examId:d.ex})).then(r=>toast(`Teachers and ${r.learners} learners have been told`)).catch(e=>toast(e.message))};

/* ===== Attendance (only class teachers take registers; others see the summaries) ===== */
PAGES.attendance=()=>{
  const teacher=isR('teacher'),mine=myClasses(),visible=teacher?mine:S.classes;
  const T=[...(teacher?[['reg','Take register']]:[]),['sum','Daily summary'],['abs','Absentees']],tb=curTab('att',T);
  const date=ui.f.attd||TODAY;
  let body='';
  if(tb==='reg'){
    if(!mine.length)body=empty('Only class teachers take attendance, for the class the Director of Studies allocated to them. You have not been made a class teacher yet.');
    else{
    const cid=mine.some(c=>c.id===ui.f.attc)?ui.f.attc:mine[0].id;
    const list=inClass(cid).sort((a,b)=>sname(a).localeCompare(sname(b))),rec=S.attendance[date]||{};
    const cnt={P:0,L:0,A:0};list.forEach(s=>{if(rec[s.id])cnt[rec[s.id]]++});
    const wd=parseD(date).getDay();
    body=`<div class="tools"><input type="date" id="attd" value="${date}" max="${TODAY}" data-c="attDate" aria-label="Date"><select data-c="flt" data-k="attc" aria-label="Class">${opts(mine.map(c=>[c.id,c.name]),cid)}</select><span class="pill ok">Present ${cnt.P}</span><span class="pill warn">Late ${cnt.L}</span><span class="pill bad">Absent ${cnt.A}</span><span class="muted sm">${list.length-cnt.P-cnt.L-cnt.A} not marked</span><button class="btn sm" data-a="markAll" data-c2="${cid}">Mark all present</button></div>${wd===0||wd===6?'<div class="banner">This date is a weekend.</div>':''}`+
    table([{h:'Learner',f:s=>`<div class="person">${avS(s)}<b>${esc(sname(s))}</b></div>`},{h:'Adm. no.',m:1,f:s=>esc(s.adm)},{h:'Mark',r:1,f:s=>`<div class="seg">${['P','L','A'].map(k=>`<button class="${k} ${rec[s.id]===k?'on':''}" data-a="mark" data-s="${s.id}" data-v="${k}" aria-label="${k==='P'?'Present':k==='L'?'Late':'Absent'}: ${esc(sname(s))}" aria-pressed="${rec[s.id]===k}">${k==='P'?'Present':k==='L'?'Late':'Absent'}</button>`).join('')}</div>`}],list,{empty:'No active learners in this class.'});}
  }
  if(tb==='sum'){
    body=`<div class="tools"><input type="date" id="attd" value="${date}" max="${TODAY}" data-c="attDate" aria-label="Date"></div>`+table([{h:'Class',f:c=>`<b>${esc(c.name)}</b><br><span class="muted xs">${esc(tch(c.teacherId)?.name||'No class teacher')}</span>`},{h:'Enrolled',m:1,r:1,f:c=>inClass(c.id).length},{h:'Register',f:c=>{const l=inClass(c.id),a=S.attendance[date]||{},m=l.filter(s=>a[s.id]).length;return m?pill('Taken','ok'):pill('Pending','warn')}},{h:'Present',m:1,r:1,f:c=>{const a=S.attendance[date]||{};return inClass(c.id).filter(s=>a[s.id]&&a[s.id]!=='A').length}},{h:'Absent',m:1,r:1,f:c=>{const a=S.attendance[date]||{};return inClass(c.id).filter(s=>a[s.id]==='A').length}},{h:'Rate',r:1,f:c=>{const r=dayRate(date,inClass(c.id));return r==null?'—':`<span class="mono">${r}%</span>`}}],visible.filter(c=>inClass(c.id).length),{empty:'You have no class to show.'});
  }
  if(tb==='abs'){
    const days=Object.keys(S.attendance).sort().slice(-10),vs=new Set(visible.map(c=>c.id));
    const rows=active().filter(s=>vs.has(s.classId)).map(s=>({s,a:days.filter(d=>S.attendance[d]?.[s.id]==='A').length,l:days.filter(d=>S.attendance[d]?.[s.id]==='L').length,id:s.id})).filter(x=>x.a>=2).sort((a,b)=>b.a-a.a).slice(0,30);
    body=`<p class="muted" style="margin-bottom:12px">Learners with two or more absences in the last ${days.length} school days.</p>`+table([{h:'Learner',f:x=>`<div class="person">${avS(x.s)}<b>${esc(sname(x.s))}</b></div>`},{h:'Class',f:x=>esc(cls(x.s.classId).name)},{h:'Absences',m:1,r:1,f:x=>`<b style="color:var(--bad)">${x.a}</b>`},{h:'Late',m:1,r:1,f:x=>x.l},{h:'Guardian phone',m:1,f:x=>esc(x.s.guardian.phone)}],rows,{click:'studentOpen'});
  }
  return ph('Attendance',teacher?'Class teachers take the register for their own class':'Daily attendance summaries, combined from every class register')+tabs('att',T)+body;
};
CH.attDate=v=>{if(v){ui.f.attd=v;drawMain()}};
const classTeacherOfStudent=s=>{const c=cls(s.classId);return c&&c.teacherId&&c.teacherId===myStaffId()};
A.mark=d=>{const s=stu(d.s);if(!s||!classTeacherOfStudent(s))return;const date=ui.f.attd||TODAY;S.attendance[date]=S.attendance[date]||{};S.attendance[date][d.s]=d.v;save();drawMain()};
A.markAll=d=>{const c=cls(d.c2);if(!c||c.teacherId!==myStaffId())return;const date=ui.f.attd||TODAY;S.attendance[date]=S.attendance[date]||{};inClass(d.c2).forEach(s=>S.attendance[date][s.id]=S.attendance[date][s.id]||'P');log('Register taken for '+c.name+' on '+date);save();drawMain();toast('Unmarked learners set to present')};

/* ===== Exams & reports =====
   Examination Office: sessions, deadlines, question papers, release of report cards.
   Subject teachers: upload papers, enter marks for their own subject while the portal is open.
   Class teachers: see marks of their class, write their comment. Head, DoS, Registrar: see marks and results. */
const EXO=()=>isR('examoffice');
const ctOf=cid=>{const c=cls(cid);return !!c&&!!c.teacherId&&c.teacherId===myStaffId()};
const resClasses=()=>isR('teacher')?myClasses():S.classes;
const canPrintCard=(s,exId)=>{const ex=S.exams.find(e=>e.id===exId);if(!ex||!ex.published)return false;if(PORTAL())return true;return isR('examoffice','registrar','head','dos')||(isR('teacher')&&ctOf(placeOf(exId,s)))};
const examTabs=()=>EXO()?[['ctl','Sessions & deadlines'],['pap','Question papers'],['prog','Marks progress'],['res','Class results'],['cards','Report cards'],['scale','Grading scale']]
  :isR('teacher')?[['pap','Question papers'],['marks','Enter marks'],...(myClasses().length?[['res','My class results'],['cards','Report cards']]:[]),['scale','Grading scale']]
  :[['res','Class results'],['cards','Report cards'],['scale','Grading scale']];
function curExam(){const l=examsOpen();const ex=S.exams.find(e=>e.id===ui.f.exid)||l[0];if(ex)ui.f.exid=ex.id;return ex}
function examBar(extra=''){
  const ex=curExam();if(!ex)return '<div class="card">'+empty('No exam session yet.')+'</div>';
  const c=cfgOf(ex.id);
  return `<div class="tools"><select data-c="flt" data-k="exid" aria-label="Exam session">${opts(examsOpen().map(e=>[e.id,`${e.name} · Term ${e.term}, ${e.year}`]),ex.id)}</select>${EXO()?`<button class="btn sm" data-a="examNew">${ic('plus')} New session</button>`:''}${pill(marksOpenNow(c)?'Marks portal open':'Marks portal closed',marksOpenNow(c)?'ok':'')}${pill(papersOpenNow(c)?'Paper uploads open':'Paper uploads closed',papersOpenNow(c)?'ok':'')}${ex.published?pill('Report cards released','ok'):pill('Report cards not released')}${extra}</div>`;
}
PAGES.exams=()=>{
  const T=examTabs(),tb=curTab('exm',T),ex=curExam();
  let body='';
  if(!ex){return ph('Exams & reports','')+`<div class="card">${empty(EXO()?'Create the first exam session to begin.':'No exam session has been created yet.')}</div>`+(EXO()?`<div style="margin-top:12px"><button class="btn pri" data-a="examNew">${ic('plus')} New session</button></div>`:'')}
  const cfg=cfgOf(ex.id);
  const cl=resClasses(),cid=cl.find(c=>c.id===ui.f.exc)?ui.f.exc:(cl.find(c=>inClass(c.id).length)||cl[0]||{}).id,c=cls(cid);
  const csel=`<select data-c="flt" data-k="exc" aria-label="Class">${opts(cl.map(x=>[x.id,x.name]),cid)}</select>`;
  if(tb==='ctl'&&EXO()){
    const exp=S.subjects.filter(a=>a.teacherId&&inClass(a.classId).length).length,got=S.papers.filter(p=>p.examId===ex.id).length;
    body=examBar()+`<div class="grid g2">
    <div class="card"><h3>Question paper uploads</h3><p class="muted sm" style="margin-bottom:12px">Subject teachers upload their papers for each class. Only you can open them. Uploading locks by itself at the deadline, and only you can extend it.</p>
      <div class="field"><label for="pdl">Upload deadline</label><input id="pdl" type="datetime-local" value="${toLocalInput(cfg.paperDeadline)}" data-c="papDl"></div>
      <div class="row" style="margin:10px 0"><button class="btn sm" data-a="papExtend" data-h="24">Extend by 1 day</button><button class="btn sm" data-a="papExtend" data-h="72">Extend by 3 days</button><button class="btn sm" data-a="papClose">Close uploads now</button></div>
      <p class="sm">${papersOpenNow(cfg)?`Open until <b>${fdt(cfg.paperDeadline)}</b>`:cfg.paperDeadline?`Closed since <b>${fdt(cfg.paperDeadline)}</b>`:'No deadline set yet, so teachers cannot upload.'}</p><p class="muted sm">${got} of ${exp} papers received.</p></div>
    <div class="card"><h3>Marks portal</h3><p class="muted sm" style="margin-bottom:12px">After marking, open the portal so subject teachers can enter scores for their own subjects. It switches off by itself at the deadline.</p>
      <div class="field"><label for="mdl">Marks entry deadline</label><input id="mdl" type="datetime-local" value="${toLocalInput(cfg.marksDeadline)}" data-c="mkDl"></div>
      <div class="row" style="margin:10px 0">${marksOpenNow(cfg)?`<button class="btn danger" data-a="mkClose">Switch the portal off</button>`:`<button class="btn pri" data-a="mkOpen">Activate marks portal</button>`}</div>
      <p class="sm">${marksOpenNow(cfg)?`Open until <b>${fdt(cfg.marksDeadline)}</b>`:cfg.marksOpen&&cfg.marksDeadline?`The deadline <b>${fdt(cfg.marksDeadline)}</b> has passed, so the portal switched off.`:'The portal is switched off.'}</p></div>
    <div class="card" style="grid-column:1/-1"><h3>Report cards</h3><p class="muted sm" style="margin-bottom:12px">Release the report cards when you are ready. Learners and parents then see and print them, and class teachers and the school leadership can print them too. You can hide them again at any time.</p>
      <button class="btn ${ex.published?'':'gold'}" data-a="examPub" data-id="${ex.id}">${ex.published?'Hide report cards from learners and parents':'Release report cards to learners and parents'}</button></div></div>`;
  }
  if(tb==='pap'){
    if(EXO()){
      const rows=S.subjects.filter(a=>inClass(a.classId).length||S.papers.some(p=>p.classId===a.classId&&p.subject===a.name&&p.examId===ex.id)).sort((a,b)=>(cls(a.classId)?.name||'').localeCompare(cls(b.classId)?.name||'')||a.name.localeCompare(b.name));
      body=examBar()+`<p class="muted sm" style="margin-bottom:10px">Question papers are visible only to the Examination Office, for printing.</p>`+table([{h:'Class',f:a=>esc(cls(a.classId)?.name||'')},{h:'Subject',f:a=>`<b>${esc(a.name)}</b>`},{h:'Teacher',f:a=>esc(tch(a.teacherId)?.name||'Not allocated')},{h:'Paper',f:a=>{const p=S.papers.find(x=>x.id===ex.id+'|'+a.classId+'|'+a.name);return p?`<a class="btn sm pri" href="/api/papers/${encodeURIComponent(p.id)}/file" download>${ic('download')} ${esc(p.name.length>26?p.name.slice(0,24)+'…':p.name)}</a><br><span class="muted xs">${fdt(p.at)} · ${(p.size/1024).toFixed(0)} KB</span>`:pill('Not received','warn')}}],rows,{empty:'No subjects yet.'});
    }else{
      const mine=myTaught().filter(a=>inClass(a.classId).length),open=papersOpenNow(cfg);
      body=examBar()+`<div class="banner" style="margin-bottom:12px"><span>${open?`Upload your question papers before <b>${fdt(cfg.paperDeadline)}</b>. Only the Examination Office can open them.`:'Uploads are closed. Only the Examination Office can open them again by extending the deadline.'}</span></div>`+
      table([{h:'Class',f:a=>esc(cls(a.classId)?.name||'')},{h:'Subject',f:a=>`<b>${esc(a.name)}</b>`},{h:'Status',f:a=>{const p=S.papers.find(x=>x.id===ex.id+'|'+a.classId+'|'+a.name);return p?`${pill('Uploaded','ok')}<br><span class="muted xs">${esc(p.name)} · ${fdt(p.at)}</span>`:pill('Not uploaded','warn')}},{h:'',r:1,f:a=>{const p=S.papers.find(x=>x.id===ex.id+'|'+a.classId+'|'+a.name);return open?`<input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" aria-label="Choose the paper for ${esc(a.name)}" data-c="paperFile" data-cls="${esc(a.classId)}" data-sub="${esc(a.name)}">${p?` <button class="btn sm danger" data-a="papDel" data-id="${esc(p.id)}">Withdraw</button>`:''}`:''}}],mine,{empty:'You have not been allocated any subject yet. The Director of Studies does this.'});
    }
  }
  if(tb==='prog'&&EXO()){
    const rows=[];S.classes.forEach(cc=>{const l=studentsFor(ex.id,cc.id);if(!l.length)return;subjRows(cc).forEach(a=>{const n=l.filter(s=>(((S.marks[ex.id]||{})[s.id])||{})[a.name]!==undefined).length;rows.push({id:a.id,cc,a,n,t:l.length})})});
    body=examBar()+table([{h:'Class',f:r=>esc(r.cc.name)},{h:'Subject',f:r=>`<b>${esc(r.a.name)}</b>`},{h:'Teacher',f:r=>esc(tch(r.a.teacherId)?.name||'Not allocated')},{h:'Marks entered',m:1,r:1,f:r=>`${r.n} / ${r.t}`},{h:'Status',f:r=>r.n>=r.t?pill('Complete','ok'):r.n?pill('Partly entered','warn'):pill('Not started','')}],rows,{empty:'No marks yet.'});
  }
  if(tb==='marks'&&isR('teacher')){
    const mine=myTaught().filter(a=>inClass(a.classId).length),key=mine.find(a=>a.id===ui.f.mk)?ui.f.mk:(mine[0]||{}).id,a=mine.find(x=>x.id===key),open=marksOpenNow(cfg);
    if(!a)body=examBar()+`<div class="card">${empty('You have not been allocated a subject yet. The Director of Studies does this.')}</div>`;
    else{const cc=cls(a.classId),list=inClass(a.classId).sort((x,y)=>sname(x).localeCompare(sname(y))),m=S.marks[ex.id]||{};
      body=examBar()+`<div class="tools"><select data-c="flt" data-k="mk" aria-label="Class and subject">${opts(mine.map(x=>[x.id,`${cls(x.classId)?.name} · ${x.name}`]),key)}</select><span class="muted sm">Marks out of 100. You can only enter marks for your own subject.</span></div>
      <div class="banner" style="margin-bottom:12px"><span>${open?`The marks portal is open until <b>${fdt(cfg.marksDeadline)}</b>.`:'The marks portal is closed. Only the Examination Office can open it or extend the deadline.'}</span></div>`+
      table([{h:'Learner',f:s=>`<div class="person">${avS(s)}<b>${esc(sname(s))}</b></div>`},{h:'Adm. no.',m:1,f:s=>esc(s.adm)},{h:'Mark /100',r:1,f:s=>`<input class="inl" type="number" min="0" max="100" inputmode="numeric" id="mk_${s.id}" value="${m[s.id]?.[a.name]??''}" data-c="mark" data-s="${s.id}" data-sub="${esc(a.name)}" ${open?'':'disabled'} aria-label="Mark for ${esc(sname(s))}">`},{h:'Grade',f:s=>{const v=m[s.id]?.[a.name];return `<span id="gr_${s.id}">${v===undefined||v===''?'—':pill(grade(+v,cc.level).g,gKind(grade(+v,cc.level).g))}</span>`}}],list)+`<p class="muted sm" style="margin-top:10px">${open?'Marks save when you leave each box. Press Tab to move to the next learner. The class teacher of each learner can see what you enter.':''}</p>`}
  }
  if(tb==='res'){
    if(!c)body=examBar()+`<div class="card">${empty('No class to show.')}</div>`;
    else{const r=results(ex.id,cid),ranked=r.rows.filter(x=>x.n);
    const means=r.subs.map((s,i)=>{const v=ranked.map(x=>x.sc[i]).filter(v=>v!==undefined&&v!=='');return{l:s.replace('General Paper','GP').replace('Mathematics','Maths').replace('Chemistry','Chem').replace('Geography','Geog').replace('Literature','Lit').replace('Economics','Econ').replace('Biology','Bio').replace('Physics','Phys').replace('History','Hist'),v:Math.round(avg(v))}});
    const dist={};ranked.forEach(x=>{const g=grade(x.avg,c.level).g;dist[g]=(dist[g]||0)+1});
    body=examBar(`<button class="btn sm" data-a="exportResults">${ic('download')} Export CSV</button>`)+`<div class="tools">${csel}</div>`+
    table([{h:'Pos',m:1,f:x=>x.pos||'—'},{h:'Learner',f:x=>`<b>${esc(sname(x.s))}</b>`},...r.subs.map((s,i)=>({h:s.slice(0,5),m:1,r:1,f:x=>x.sc[i]===undefined||x.sc[i]===''?'—':x.sc[i]})),{h:'Total',m:1,r:1,f:x=>x.n?x.total:'—'},{h:'Avg',m:1,r:1,f:x=>x.n?x.avg.toFixed(1):'—'},{h:c.level==='O'?'Agg':'Pts',m:1,r:1,f:x=>x.n?x.agg:'—'},{h:'Grade',f:x=>x.n?pill(grade(x.avg,c.level).g,gKind(grade(x.avg,c.level).g)):'—'}],r.rows,{click:'studentOpen'})+
    (ranked.length?`<div class="grid g2" style="margin-top:16px"><div class="card"><h3>Subject averages</h3>${barChart(means,{max:100,step:25,label:'Subject averages'})}</div><div class="card"><h3>Grade distribution</h3>${donut(Object.entries(dist).map(([k,v])=>({l:k,v})),{sub:'learners',label:'Grade distribution'})}<p class="muted sm" style="margin-top:12px">${c.level==='O'?'Aggregates add the grade points of all subjects, so a lower number is better.':'Points add the grade points of all subjects, so a higher number is better.'}</p></div></div>`:'')}
  }
  if(tb==='cards'){
    if(!c)body=examBar()+`<div class="card">${empty('No class to show.')}</div>`;
    else{const list=studentsFor(ex.id,cid).sort((a,b)=>sname(a).localeCompare(sname(b))),can=list.length&&canPrintCard(list[0],ex.id);
    body=examBar(can?`<button class="btn sm" data-a="cardsAll">${ic('download')} Print all for ${esc(c.name)}</button>`:'')+`<div class="tools">${csel}</div>`+(ex.published?'':`<p class="muted sm" style="margin-bottom:10px">Report cards are not released yet. ${isR('teacher')?'You can write your comments now. ':''}${isR('head')?'You can write your comments now. ':''}Printing opens once the Examination Office releases them.</p>`)+
    table([{h:'Learner',f:s=>`<div class="person">${avS(s)}<b>${esc(sname(s))}</b></div>`},{h:'Adm. no.',m:1,f:s=>esc(s.adm)},{h:'',r:1,f:s=>`<button class="btn sm pri" data-a="reportCard" data-id="${s.id}" data-ex="${ex.id}">${ex.published?'Open report card':'Preview / comment'}</button>`}],list)}
  }
  if(tb==='scale'){
    body=`<div class="grid g2"><div class="card"><h3>O-Level (S.1 to S.4)</h3>${table([{h:'Marks',m:1,f:x=>x[0]===0?'0 – '+(O_SCALE[O_SCALE.indexOf(x)-1][0]-1):x[0]+(O_SCALE.indexOf(x)===0?' – 100':' +')},{h:'Grade',f:x=>pill(x[1],gKind(x[1]))},{h:'Points',m:1,r:1,f:x=>x[2]},{h:'Descriptor',f:x=>x[3]}],O_SCALE)}</div><div class="card"><h3>A-Level (S.5 to S.6)</h3>${table([{h:'Marks',m:1,f:x=>x[0]===0?'0 – '+(A_SCALE[A_SCALE.indexOf(x)-1][0]-1):x[0]+(A_SCALE.indexOf(x)===0?' – 100':' +')},{h:'Grade',f:x=>pill(x[1],gKind(x[1]))},{h:'Points',m:1,r:1,f:x=>x[2]},{h:'Descriptor',f:x=>x[3]}],A_SCALE)}</div></div><p class="muted sm" style="margin-top:12px">These bands follow the common UCE and UACE style of grading and drive every grade, aggregate and report card in WalEduc.</p>`;
  }
  return ph('Exams & reports',EXO()?'Sessions, deadlines, question papers and report cards':isR('teacher')?'Question papers, marks entry and your class':'Marks, results and report cards')+tabs('exm',T)+body;
};
/* exam office controls */
A.examNew=()=>{if(!EXO())return;openForm('New exam session',[{k:'name',label:'Name (for example Mid-Term)',req:1,full:1},{k:'term',label:'Term',type:'select',opts:opts([1,2,3],S.school.term)},{k:'year',label:'Year',type:'number',def:S.school.year}],{},v=>{const e={id:uid('ex'),name:v.name,term:+v.term,year:+v.year,status:'Open',published:false};S.exams.push(e);S.examcfg.push({id:e.id,examId:e.id,paperDeadline:'',marksOpen:false,marksDeadline:''});ui.f.exid=e.id;log('Created exam session '+v.name)})};
const cfgEdit=(ex,fn)=>{let c=S.examcfg.find(x=>x.id===ex.id);if(!c){c={id:ex.id,examId:ex.id,paperDeadline:'',marksOpen:false,marksDeadline:''};S.examcfg.push(c)}fn(c);save();drawMain()};
CH.papDl=v=>{const ex=curExam();if(!EXO()||!ex)return;cfgEdit(ex,c=>{c.paperDeadline=fromLocalInput(v)});log('Paper upload deadline set for '+ex.name);toast('Deadline saved')};
A.papExtend=d=>{const ex=curExam(),c=cfgOf(ex.id);const base=Math.max(nowMs(),Date.parse(c.paperDeadline)||0);cfgEdit(ex,x=>{x.paperDeadline=new Date(base+(+d.h)*3600*1000).toISOString()});log('Paper upload deadline extended for '+ex.name);toast('Deadline extended')};
A.papClose=()=>{const ex=curExam();cfgEdit(ex,c=>{c.paperDeadline=new Date(nowMs()-1000).toISOString()});toast('Uploads closed')};
CH.mkDl=v=>{const ex=curExam();if(!EXO()||!ex)return;cfgEdit(ex,c=>{c.marksDeadline=fromLocalInput(v)});toast('Deadline saved')};
A.mkOpen=()=>{const ex=curExam(),inp=$('#mdl'),dl=fromLocalInput(inp&&inp.value||'')||cfgOf(ex.id).marksDeadline;if(!dl||Date.parse(dl)<=nowMs()){toast('Set a marks deadline in the future first');return}cfgEdit(ex,c=>{c.marksOpen=true;c.marksDeadline=dl});log('Marks portal activated for '+ex.name);toast('Marks portal is open')};
A.mkClose=()=>{const ex=curExam();cfgEdit(ex,c=>{c.marksOpen=false});log('Marks portal switched off for '+ex.name);toast('Marks portal switched off')};
A.examPub=d=>{const e=S.exams.find(x=>x.id===d.id);e.published=!e.published;log(`${e.name} report cards ${e.published?'released':'hidden'}`);save();drawMain();toast(e.published?'Report cards released to learners and parents':'Report cards hidden')};
/* question papers */
CH.paperFile=async(v,d,el)=>{const f=el.files&&el.files[0],ex=curExam();el.value='';if(!f||!ex)return;if(f.size>15*1024*1024){toast('Choose a file under 15 MB');return}
  try{toast('Uploading…');const r=await api('POST',`/api/papers?exam=${encodeURIComponent(ex.id)}&class=${encodeURIComponent(d.cls)}&subject=${encodeURIComponent(d.sub)}&name=${encodeURIComponent(f.name)}`,f,true);
    const i=S.papers.findIndex(p=>p.id===r.paper.id);if(i>=0)S.papers[i]=r.paper;else S.papers.push(r.paper);SH.set('papers\u0001'+r.paper.id,JSON.stringify(r.paper));drawMain();toast('Paper uploaded')}catch(e){toast(e.message)}};
A.papDel=d=>confirmBox('Withdraw this question paper so you can upload another?',()=>{api('DELETE','/api/papers/'+encodeURIComponent(d.id)).then(()=>{S.papers=S.papers.filter(p=>p.id!==d.id);drawMain();toast('Paper withdrawn')}).catch(e=>toast(e.message))},'Withdraw');
/* marks */
CH.mark=(v,d,el)=>{const ex=curExam();const s=stu(d.s),c=cls(s.classId);if(!marksOpenNow(cfgOf(ex.id))){toast('The marks portal is closed');el.value=(((S.marks[ex.id]||{})[d.s]||{})[d.sub])??'';return}
  S.marks[ex.id]=S.marks[ex.id]||{};S.marks[ex.id][d.s]=S.marks[ex.id][d.s]||{};
  let n=v===''?'':Math.max(0,Math.min(100,Math.round(+v)));if(n==='')delete S.marks[ex.id][d.s][d.sub];else{S.marks[ex.id][d.s][d.sub]=n;el.value=n}
  const g=n===''?null:grade(n,c.level);$('#gr_'+d.s).innerHTML=g?pill(g.g,gKind(g.g)):'—';save()};
A.exportResults=()=>{const ex=curExam(),r=results(ex.id,ui.f.exc||resClasses()[0].id);saveFile(`results-${r.c.name.replace(/\W/g,'')}-${ex.name.replace(/\W/g,'')}.csv`,csv([['Position','Adm no','Learner',...r.subs,'Total','Average','Aggregate/Points'],...r.rows.map(x=>[x.pos||'',x.s.adm,sname(x.s),...x.sc.map(v=>v??''),x.total,x.avg.toFixed(1),x.agg])]))};

/* report cards */
function rcInner(s,exId,edit){
  const ex=S.exams.find(e=>e.id===exId),cid=placeOf(exId,s),c=cls(cid)||{level:'O',name:'—',id:cid},r=results(exId,cid),row=r.rows.find(x=>x.s.id===s.id);
  const cm=S.comments[exId+'|'+s.id]||{},av_=row?row.avg:0;
  const days=Object.keys(S.attendance).sort().slice(-60),marks=days.map(d=>S.attendance[d][s.id]).filter(Boolean);
  const ct=cm.ct||autoComment(av_),ht=cm.ht||'Noted. Keep working hard.';
  const g=grade(av_,c.level),canCt=edit&&isR('teacher')&&!ex.published&&ctOf(cid),canHt=edit&&isR('head')&&!ex.published,ctn=tch(c.teacherId);
  return `${letterhead('END OF TERM REPORT · '+ex.name+' · Term '+ex.term+', '+ex.year)}
  <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px">${s.photo?`<img src="${s.photo}" alt="" style="width:84px;height:100px;object-fit:cover;border:1px solid #c9d6ce">`:''}<table style="margin:0"><tr><th>Name</th><td colspan="3"><b>${esc(sname(s))}</b></td><th>Adm. no.</th><td>${esc(s.adm)}</td></tr><tr><th>Class</th><td>${esc(c.name)}</td><th>Sex</th><td>${s.sex==='M'?'Male':'Female'}</td><th>Section</th><td>${s.boarding}</td></tr></table></div>
  <table><thead><tr><th>Subject</th><th style="text-align:right">Score /100</th><th>Grade</th><th>Remark</th><th>Teacher</th></tr></thead><tbody>${r.subs.map((sub,i)=>{const v=row?.sc[i];const gg=v===undefined||v===''?null:grade(+v,c.level);return`<tr><td>${esc(sub)}</td><td style="text-align:right">${v===undefined||v===''?'—':v}</td><td><b>${gg?gg.g:'—'}</b></td><td>${gg?gg.r:''}</td><td>${esc(teacherFor(c,sub)?.name||'')}</td></tr>`}).join('')}</tbody>
  <tfoot><tr><th>Total</th><th style="text-align:right">${row?.n?row.total:'—'}</th><th colspan="3">Average ${row?.n?av_.toFixed(1):'—'} (${row?.n?g.g:'—'}) · ${c.level==='O'?'Aggregate':'Points'} ${row?.n?row.agg:'—'} · Position ${row?.pos||'—'} of ${row?.of||r.rows.length}</th></tr></tfoot></table>
  <p style="margin:10px 0;font-size:12px">${marks.length?`Attendance: <b>${pct(marks.filter(m=>m!=='A').length,marks.length)}%</b> · `:''}Next term begins <b>${fdate(S.school.nextTerm)}</b></p>
  <div style="font-size:12px;font-weight:700;margin-top:8px">Class teacher's comment${ctn?' ('+esc(ctn.name)+')':''}</div>${canCt?`<textarea id="cm_ct" data-c="live" data-k="ct" data-ex="${exId}" data-s="${s.id}">${esc(ct)}</textarea>`:`<p>${esc(ct)}</p>`}
  <div style="font-size:12px;font-weight:700;margin-top:8px">${esc(S.school.head)}'s comment</div>${canHt?`<textarea id="cm_ht" data-c="live" data-k="ht" data-ex="${exId}" data-s="${s.id}">${esc(ht)}</textarea>`:`<p>${esc(ht)}</p>`}
  <div class="sig"><div>Class teacher's signature</div><div>Head teacher's signature and school stamp</div></div>`;
}
CH.live=(v,d)=>{if(!d.ex)return;const k=d.ex+'|'+d.s;S.comments[k]=S.comments[k]||{ct:'',ht:''};S.comments[k][d.k]=v;save()};
A.reportCard=d=>{const s=stu(d.id);if(!s)return;const can=canPrintCard(s,d.ex);openModal('Report card · '+sname(s),`<div class="rc">${rcInner(s,d.ex,true)}</div>`,{wide:1,foot:`<button class="btn" data-a="closeModal">Close</button>${can?`<button class="btn" data-a="rcDownload" data-id="${d.id}" data-ex="${d.ex}">${ic('download')} Download</button><button class="btn pri" data-a="rcPrint" data-id="${d.id}" data-ex="${d.ex}">Print</button>`:''}`})};
A.rcDownload=d=>{const s=stu(d.id);if(!canPrintCard(s,d.ex))return;saveFile(`report-card-${sname(s).replace(/\W+/g,'-')}.html`,reportDocHTML('Report card',rcInner(s,d.ex,false)))};
A.rcPrint=d=>{const s=stu(d.id);if(!canPrintCard(s,d.ex))return;printHTML('Report card · '+sname(s),rcInner(s,d.ex,false))};
A.cardsAll=()=>{const ex=curExam(),cid=ui.f.exc||resClasses()[0].id,c=cls(cid);const list=studentsFor(ex.id,cid).sort((a,b)=>sname(a).localeCompare(sname(b))).filter(s=>canPrintCard(s,ex.id));if(!list.length){toast('Report cards are not released yet');return}printHTML('Report cards '+c.name,list.map(s=>`<section style="page-break-after:always;margin-bottom:40px">${rcInner(s,ex.id,false)}</section>`).join(''))};

const afterSync=fn=>{const t=setInterval(()=>{if(!syncing&&!diff().ops.length){clearInterval(t);fn()}},200);setTimeout(()=>clearInterval(t),8000)};
const BUR=()=>isR('bursar');

/* ===== Fees & finance (only the bursar records; others look) ===== */
const METHODS=['MTN Mobile Money','Airtel Money','Cash','Bank deposit','Cheque'];
const payStatus=p=>p.status==='Pending'?pill('Awaiting approval','warn'):p.status==='Rejected'?pill('Not approved','bad'):pill('Approved','ok');
PAGES.fees=()=>{
  const pend=S.payments.filter(p=>p.status==='Pending');
  const T=[['ov','Overview'],['pay',`Payments${pend.length&&BUR()?' ('+pend.length+')':''}`],['bal','Balances'],['struct','Fee structure'],['exp','Expenses']],tb=curTab('fee',T);
  const act=active(),exp=sum(act.map(billed)),col=sum(act.map(s=>Math.min(paidBy(s),billed(s)))),debtors=act.filter(s=>balOf(s)>0),good=S.payments.filter(okPay);
  let body='';
  if(tb==='ov'){
    const byM={};good.forEach(p=>{const k=p.date.slice(0,7);byM[k]=(byM[k]||0)+p.amount});
    const months=Object.keys(byM).sort().map(k=>({l:MONTHS[+k.slice(5)-1].slice(0,3),v:byM[k]}));
    const meth={};good.forEach(p=>meth[p.method]=(meth[p.method]||0)+p.amount);
    const byC=S.classes.filter(c=>inClass(c.id).length).map(c=>{const l=inClass(c.id),e=sum(l.map(billed)),p=sum(l.map(s=>Math.min(paidBy(s),billed(s))));return{l:c.name,v:pct(p,e),t:pct(p,e)+'%',k:pct(p,e)<50?'bad':''}});
    body=`<div class="kpis">${kpi('Expected, Term '+S.school.term,ugx(exp),'fees plus arrears, less bursaries')}${kpi('Collected',ugx(col),pct(col,exp)+'% of expected')}${kpi('Outstanding',ugx(exp-col),debtors.length+' learners')}${kpi('Awaiting approval',pend.length,pend.length?ugx(sum(pend.map(p=>p.amount))):'nothing pending')}${kpi('Expenses',ugx(sum(S.expenses.map(e=>e.amount))),'recorded this term')}</div>
    <div class="grid g2"><div class="card"><h3>Collections by month</h3>${months.length?barChart(months,{f:v=>v>=1e6?(v/1e6).toFixed(1)+'M':Math.round(v/1e3)+'K',label:'Collections by month',step:1e6}):empty('No payments yet')}</div>
    <div class="card"><h3>Payment methods</h3>${Object.keys(meth).length?donut(Object.entries(meth).map(([l,v])=>({l,v:Math.round(v/1000)})),{center:Object.keys(meth).length,sub:'methods',label:'Payment methods in thousands of UGX'}):empty('No payments yet')}<p class="muted xs" style="margin-top:8px">Figures in thousands of UGX. Only approved payments are counted.</p></div></div>
    <div class="card" style="margin-top:16px"><h3>Collection rate by class</h3>${byC.length?hbars(byC):empty('No learners yet')}</div>`;
  }
  if(tb==='pay'){
    const q=(ui.f.pq||'').toLowerCase();
    const list=S.payments.filter(p=>p.status!=='Pending'&&(!q||(sname(stu(p.studentId))+p.rct+p.ref+(p.prn||'')).toLowerCase().includes(q))).sort((a,b)=>b.date.localeCompare(a.date));const pg=pager('pay',list.length,20);
    const pendTbl=pend.length?`<div class="card" style="margin-bottom:16px"><h3>Payments waiting for approval</h3><p class="muted sm" style="margin-bottom:10px">Learners and parents submit these from their portal after paying. Confirm the money has reached the school, then approve. They receive a printable receipt once you do.</p>${table([{h:'Date',f:p=>fdate(p.date)},{h:'Learner',f:p=>`<b>${esc(sname(stu(p.studentId)))}</b><br><span class="muted sm">${esc(cls(stu(p.studentId)?.classId)?.name||'')} · submitted by ${esc(p.by||'')}</span>`},{h:'Method',f:p=>esc(p.method)},{h:'Reference',m:1,f:p=>esc(p.ref||'—')+(p.prn?'<br><span class="muted xs">PRN '+esc(p.prn)+'</span>':'')},{h:'Amount (UGX)',m:1,r:1,f:p=>fmt(p.amount)},{h:'',r:1,f:p=>BUR()?`<button class="btn sm pri" data-a="payApprove" data-id="${p.id}">Approve</button> <button class="btn sm danger" data-a="payReject" data-id="${p.id}">Reject</button>`:''}],pend)}</div>`:'';
    body=pendTbl+`<div class="tools">${inpSearch('pq','Search learner, receipt, PRN or reference',ui.f.pq)}${BUR()?`<button class="btn pri" data-a="payNew">${ic('plus')} Record payment</button>`:''}<button class="btn" data-a="exportPays">${ic('download')} Export CSV</button></div>`+table([{h:'Receipt',m:1,f:p=>p.status==='Approved'?esc(p.rct):'—'},{h:'Date',f:p=>fdate(p.date)},{h:'Learner',f:p=>`<b>${esc(sname(stu(p.studentId)))}</b><br><span class="muted sm">${esc(cls(stu(p.studentId)?.classId)?.name||'')}</span>`},{h:'Method',f:p=>esc(p.method)},{h:'Reference',m:1,f:p=>esc(p.ref||'—')},{h:'Amount (UGX)',m:1,r:1,f:p=>fmt(p.amount)},{h:'Status',f:p=>payStatus(p)},{h:'',r:1,f:p=>p.status==='Approved'?`<button class="btn sm" data-a="receipt" data-id="${p.id}">Receipt</button>`:''}],pg.slice(list),{empty:'No payments recorded yet.'})+pg.html;
  }
  if(tb==='bal'){
    const cf=ui.f.bc||'',min=+(ui.f.bm||0);
    const list=debtors.filter(s=>(!cf||s.classId===cf)&&balOf(s)>=min).sort((a,b)=>balOf(b)-balOf(a));const pg=pager('bal',list.length,20);
    body=`<div class="tools"><select data-c="flt" data-k="bc" aria-label="Class"><option value="">All classes</option>${classOpts(cf)}</select><select data-c="flt" data-k="bm" aria-label="Minimum balance">${opts([[0,'Any balance'],[100000,'Over UGX 100,000'],[300000,'Over UGX 300,000'],[500000,'Over UGX 500,000']],min)}</select>${BUR()?`<button class="btn" data-a="remindAll">Send reminder to ${list.length} guardians</button>`:''}<button class="btn" data-a="exportBal">${ic('download')} Export CSV</button></div><p class="muted sm" style="margin-bottom:10px">${list.length} learners owe a total of <b class="mono">${ugx(sum(list.map(balOf)))}</b></p>`+
    table([{h:'Learner',f:s=>`<div class="person">${avS(s)}<span><b>${esc(sname(s))}</b><span class="muted sm">${esc(cls(s.classId).name)} · ${esc(s.adm)}</span></span></div>`},{h:'Guardian',f:s=>`${esc(s.guardian.name)}<br><span class="mono sm muted">${esc(s.guardian.phone)}</span>`},{h:'Billed',m:1,r:1,f:s=>fmt(billed(s))},{h:'Paid',m:1,r:1,f:s=>fmt(paidBy(s))},{h:'Balance',m:1,r:1,f:s=>`<b style="color:var(--bad)">${fmt(balOf(s))}</b>`},{h:'',r:1,f:s=>BUR()?`<button class="btn sm" data-a="remind" data-id="${s.id}">Remind</button> <button class="btn sm pri" data-a="payNew" data-id="${s.id}">Pay</button>`:''}],pg.slice(list),{empty:'No outstanding balances match.'})+pg.html;
  }
  if(tb==='struct'){
    const st=S.fees.structure,ro=BUR()?'':'disabled';
    body=`<div class="card" style="max-width:640px"><h3>Fees per term (UGX)</h3><div class="fgrid">${[['O-Day','O-Level day'],['O-Boarding','O-Level boarding'],['A-Day','A-Level day'],['A-Boarding','A-Level boarding']].map(k=>`<div class="field"><label for="fs_${k[0]}">${k[1]}</label><input id="fs_${k[0]}" type="number" min="0" step="10000" value="${st[k[0]]??0}" data-c="fee" data-k="${k[0]}" ${ro}></div>`).join('')}</div><p class="muted sm" style="margin-top:12px">${BUR()?`${S.sample?'These are example figures. Enter the amounts approved by the school before using WalEduc for real billing. ':''}Changing a figure updates every learner's balance straight away.`:'Only the Bursar can change the fee structure.'}</p></div>`;
  }
  if(tb==='exp'){
    const byCat={};S.expenses.forEach(e=>byCat[e.category]=(byCat[e.category]||0)+e.amount);
    body=`<div class="tools">${BUR()?`<button class="btn pri" data-a="expNew">${ic('plus')} Record expense</button>`:''}</div><div class="grid g21"><div>${table([{h:'Date',f:e=>fdate(e.date)},{h:'Category',f:e=>pill(e.category)},{h:'Description',f:e=>esc(e.desc)},{h:'Amount (UGX)',m:1,r:1,f:e=>fmt(e.amount)}],[...S.expenses].sort((a,b)=>b.date.localeCompare(a.date)))}</div><div class="card"><h3>By category</h3>${Object.keys(byCat).length?hbars(Object.entries(byCat).map(([l,v])=>({l,v:pct(v,sum(Object.values(byCat))),t:fmt(v)}))):empty('No expenses yet')}<div class="row" style="justify-content:space-between;margin-top:14px;border-top:1px solid var(--line);padding-top:12px"><span>Collected less expenses</span><b class="mono">${ugx(col-sum(S.expenses.map(e=>e.amount)))}</b></div></div></div>`;
  }
  return ph('Fees & finance',`Term ${S.school.term}, ${S.school.year} · amounts in Uganda shillings${BUR()?'':' · view only'}`,BUR()?`<button class="btn pri" data-a="payNew">${ic('plus')} Record payment</button>`:'')+tabs('fee',T)+body;
};
CH.fee=(v,d)=>{if(!BUR())return;S.fees.structure[d.k]=Math.max(0,+v||0);log('Fee structure changed: '+d.k);save();drawMain();toast('Fee updated')};
A.payNew=d=>{
  if(!BUR())return;const sid=d&&d.id||'';
  openForm('Record a payment',[{k:'studentId',label:'Learner',type:'select',full:1,opts:`<option value="">Choose a learner (or type a PRN below)</option>${studentOpts(sid)}`},{k:'prn',label:'PRN (if the payer used one)'},{k:'amount',label:'Amount (UGX)',type:'number',req:1,min:1,step:1000},{k:'date',label:'Date paid',type:'date',def:TODAY,req:1},{k:'method',label:'Method',type:'select',opts:opts(METHODS)},{k:'ref',label:'Transaction or slip reference'}],{studentId:sid,date:TODAY},v=>{
    let learner=v.studentId;const prn=String(v.prn||'').replace(/\D/g,'');
    if(!learner&&prn){const m=S.prn.find(x=>x.prn===prn);if(m)learner=m.studentId}
    if(!learner||!(+v.amount>0)){toast('Choose a learner (or a valid PRN) and enter the amount');return false}
    const p={id:uid('p'),rct:'',studentId:learner,date:v.date,amount:+v.amount,method:v.method,ref:v.ref,by:ui.user.name,status:'Approved',prn,approvedBy:'',approvedOn:'',source:'Bursar'};
    S.payments.unshift(p);log(`Payment recorded: ${ugx(p.amount)} for ${sname(stu(learner))}`);afterSync(()=>{const q=S.payments.find(x=>x.id===p.id);if(q&&q.rct&&!q.rct.startsWith('PEND'))A.receipt({id:p.id})});toast('Payment recorded')},{save:'Record payment'});
};
A.payApprove=d=>{if(!BUR())return;const p=S.payments.find(x=>x.id===d.id);confirmBox(`Approve the payment of <b>${ugx(p.amount)}</b> for <b>${esc(sname(stu(p.studentId)))}</b>? A receipt number is issued and the learner and parent can print the receipt.`,()=>{p.status='Approved';log(`Payment approved: ${ugx(p.amount)} for ${sname(stu(p.studentId))}`);toast('Approved. The receipt is available to the learner and parent.')},'Approve payment')};
A.payReject=d=>{if(!BUR())return;const p=S.payments.find(x=>x.id===d.id);confirmBox(`Reject the payment of <b>${ugx(p.amount)}</b> for <b>${esc(sname(stu(p.studentId)))}</b>? They are told it could not be confirmed.`,()=>{p.status='Rejected';log('Payment rejected for '+sname(stu(p.studentId)));toast('Payment marked as not approved')},'Reject payment')};
function receiptInner(p){const s=stu(p.studentId);return `${letterhead('OFFICIAL RECEIPT')}<table><tr><th style="width:34%">Receipt no.</th><td><b>${esc(p.rct)}</b></td></tr><tr><th>Date</th><td>${fdate(p.date)}</td></tr><tr><th>Received from</th><td>${esc(s.guardian.name)} (${esc(s.guardian.rel)})</td></tr><tr><th>Learner</th><td>${esc(sname(s))} · ${esc(s.adm)} · ${esc(cls(s.classId)?.name||'')}</td></tr><tr><th>Amount</th><td><b style="font-size:18px">${ugx(p.amount)}</b></td></tr><tr><th>Paid by</th><td>${esc(p.method)}${p.ref?' · ref '+esc(p.ref):''}${p.prn?' · PRN '+esc(p.prn):''}</td></tr><tr><th>Balance after payment</th><td>${ugx(Math.max(0,balOf(s)))}</td></tr><tr><th>Approved by</th><td>${esc(p.approvedBy||p.by||'Bursar')}${p.approvedOn?' on '+fdate(p.approvedOn):''}</td></tr></table><div class="sig"><div>Bursar's signature</div><div>School stamp</div></div>`}
A.receipt=d=>{const p=S.payments.find(x=>x.id===d.id);if(!p||p.status!=='Approved')return;if(PORTAL()&&!kidsOf(ui.user).some(k=>k.id===p.studentId))return;openModal('Receipt '+p.rct,`<div class="rc">${receiptInner(p)}</div>`,{foot:`<button class="btn" data-a="closeModal">Close</button><button class="btn" data-a="rctDownload" data-id="${p.id}">${ic('download')} Download</button><button class="btn pri" data-a="rctPrint" data-id="${p.id}">Print</button>`})};
A.rctDownload=d=>{const p=S.payments.find(x=>x.id===d.id);saveFile(p.rct+'.html',reportDocHTML('Receipt '+p.rct,receiptInner(p)))};
A.rctPrint=d=>{const p=S.payments.find(x=>x.id===d.id);printHTML('Receipt '+p.rct,receiptInner(p))};
A.exportPays=()=>saveFile('walEduc-payments.csv',csv([['Receipt','Date','Adm no','Learner','Class','Method','Reference','Status','Amount UGX'],...S.payments.map(p=>{const s=stu(p.studentId);return[p.status==='Approved'?p.rct:'',p.date,s?.adm,sname(s),cls(s?.classId)?.name,p.method,p.ref,p.status,p.amount]})]));
A.exportBal=()=>saveFile('walEduc-fee-balances.csv',csv([['Adm no','Learner','Class','Guardian','Phone','Billed','Paid','Balance'],...active().filter(s=>balOf(s)>0).map(s=>[s.adm,sname(s),cls(s.classId).name,s.guardian.name,s.guardian.phone,billed(s),paidBy(s),balOf(s)])]));
const remMsg=s=>`Dear {guardian}, {child} has a fees balance of ${ugx(balOf(s))} for Term ${S.school.term}. Kindly clear it. ${S.school.name}.`;
const sendComms=async(payload,okMsg)=>{try{const r=await api('POST','/api/comms/send',payload);toast(okMsg||r.status);pullNow();return r}catch(e){toast(e.message)}};
A.remind=d=>{if(!BUR())return;const s=stu(d.id);sendComms({audience:'ids',ids:[s.id],channel:'SMS',title:'Fees reminder',body:remMsg(s)},'Reminder sent to '+s.guardian.name)};
A.remindAll=()=>{if(!BUR())return;const cf=ui.f.bc||'',min=+(ui.f.bm||0),list=active().filter(s=>balOf(s)>0&&(!cf||s.classId===cf)&&balOf(s)>=min);if(!list.length){toast('No learners to remind');return}
  confirmBox(`Send a fee reminder to ${list.length} guardians? Each gets a message with their own child's balance, in the parent portal and by SMS when SMS is set up.`,()=>{sendComms({audience:'ids',ids:list.map(s=>s.id),channel:'SMS',title:'Fees reminder',body:`Dear {guardian}, {child} has a fees balance of {balance} for Term ${S.school.term}. Kindly clear it. ${S.school.name}.`})},'Send reminders')};
A.expNew=()=>{if(!BUR())return;openForm('Record an expense',[{k:'category',label:'Category',type:'select',opts:opts(['Utilities','Supplies','Maintenance','Salaries','Transport','Feeding','Other'])},{k:'date',label:'Date',type:'date',def:TODAY,req:1},{k:'desc',label:'Description',req:1,full:1},{k:'amount',label:'Amount (UGX)',type:'number',req:1,min:1}],{date:TODAY},v=>{S.expenses.unshift({id:uid('x'),date:v.date,category:v.category,desc:v.desc,amount:+v.amount,by:ui.user.name});log('Expense: '+v.desc)})};

/* ===== Library (only the librarian changes anything) ===== */
const LIB=()=>isR('librarian');
const onLoan=b=>S.loans.filter(l=>l.bookId===b.id&&!l.returned).length;
PAGES.library=()=>{
  const T=[['cat','Catalogue'],['loans','Loans'],['who','Borrower lookup']],tb=curTab('lib',T);let body='';
  const over=S.loans.filter(l=>!l.returned&&l.due<TODAY);
  if(tb==='cat'){const q=(ui.f.bq||'').toLowerCase(),list=S.books.filter(b=>!q||(b.title+b.author+b.cat).toLowerCase().includes(q));
    body=`<div class="tools">${inpSearch('bq','Search title, author or category',ui.f.bq)}${LIB()?`<button class="btn pri" data-a="bookNew">${ic('plus')} Add book</button>`:''}</div>`+table([{h:'Title',f:b=>`<b>${esc(b.title)}</b><br><span class="muted sm">${esc(b.author)}</span>`},{h:'Category',f:b=>pill(b.cat)},{h:'Copies',m:1,r:1,f:b=>b.copies},{h:'Available',m:1,r:1,f:b=>{const a=b.copies-onLoan(b);return a>0?a:`<span style="color:var(--bad)">0</span>`}},{h:'',r:1,f:b=>LIB()?`<button class="btn sm" data-a="issue" data-id="${b.id}" ${b.copies-onLoan(b)<1?'disabled':''}>Issue</button>`:''}],list);}
  if(tb==='loans'){const st=ui.f.ls||'out';let list=[...S.loans].sort((a,b)=>b.out.localeCompare(a.out));
    list=list.filter(l=>st==='all'||(st==='out'&&!l.returned)||(st==='over'&&!l.returned&&l.due<TODAY)||(st==='ret'&&l.returned));
    body=`<div class="tools"><select data-c="flt" data-k="ls" aria-label="Loan status">${opts([['out','On loan'],['over','Overdue'],['ret','Returned'],['all','All loans']],st)}</select>${LIB()&&over.length?`<button class="btn" data-a="libRemindAll">Remind all ${over.length} overdue borrowers</button>`:''}</div>`+table([{h:'Book',f:l=>`<b>${esc(S.books.find(b=>b.id===l.bookId)?.title||'Removed book')}</b>`},{h:'Borrower',f:l=>esc(sname(stu(l.studentId)))+`<br><span class="muted sm">${esc(cls(stu(l.studentId)?.classId)?.name||'')}</span>`},{h:'Issued',f:l=>fdate(l.out)},{h:'Due',f:l=>fdate(l.due)},{h:'Status',f:l=>l.returned?pill('Returned '+fdate(l.returned),'ok'):l.due<TODAY?pill(Math.round((parseD(TODAY)-parseD(l.due))/864e5)+' days overdue','bad'):pill('On loan','info')},{h:'',r:1,f:l=>!LIB()||l.returned?'':`${l.due<TODAY?`<button class="btn sm" data-a="libRemind" data-id="${l.id}">Remind</button> `:''}<button class="btn sm pri" data-a="ret" data-id="${l.id}">Mark returned</button>`}],list,{empty:'No loans in this view.'});}
  if(tb==='who'){const q=(ui.f.lq||'').trim().toLowerCase(),found=q?S.students.filter(s=>(sname(s)+' '+s.adm).toLowerCase().includes(q)).slice(0,8):[],sel=stu(ui.f.lsid);
    body=`<div class="tools">${inpSearch('lq','Search a learner by name or admission number',ui.f.lq)}</div>`+(found.length?`<div class="card" style="margin-bottom:16px"><div class="list">${found.map(s=>`<div><span class="person">${avS(s)}<span><b>${esc(sname(s))}</b><span class="muted sm">${esc(s.adm)} · ${esc(cls(s.classId)?.name||'')}</span></span></span><button class="btn sm" data-a="libPick" data-id="${s.id}">Open record</button></div>`).join('')}</div></div>`:'')+
    (sel?(()=>{const ls=S.loans.filter(l=>l.studentId===sel.id).sort((a,b)=>b.out.localeCompare(a.out)),cur=ls.filter(l=>!l.returned),od=cur.filter(l=>l.due<TODAY).length;
      return `<div class="card"><div class="person" style="gap:14px;margin-bottom:12px">${avS(sel,'lg')}<span><h2 style="font-size:20px">${esc(sname(sel))}</h2><span class="muted">${esc(sel.adm)} · ${esc(cls(sel.classId)?.name||'')} · ${sel.boarding}</span></span></div><div class="row" style="margin-bottom:12px">${pill(cur.length+' on loan','info')}${od?pill(od+' overdue','bad'):pill('No overdue books','ok')}${LIB()?`<button class="btn pri sm" data-a="issueTo" data-id="${sel.id}">Issue a book to ${esc(sel.first)}</button>`:''}</div>${table([{h:'Book',f:l=>`<b>${esc(S.books.find(b=>b.id===l.bookId)?.title||'Removed book')}</b>`},{h:'Issued',f:l=>fdate(l.out)},{h:'Due',f:l=>fdate(l.due)},{h:'Status',f:l=>l.returned?pill('Returned '+fdate(l.returned),'ok'):l.due<TODAY?pill('Overdue','bad'):pill('On loan','info')}],ls,{empty:'This learner has not borrowed any book yet.'})}</div>`})():'<p class="muted">Search for a learner to see their borrowing record before issuing a book.</p>');}
  return ph('Library',`${S.books.length} titles · ${sum(S.books.map(b=>b.copies))} copies · ${over.length} overdue${LIB()?'':' · view only'}`)+tabs('lib',T)+body;
};
A.libPick=d=>{ui.f.lsid=d.id;ui.f.lq='';drawMain()};
A.bookNew=()=>{if(!LIB())return;openForm('Add a book',[{k:'title',label:'Title',req:1,full:1},{k:'author',label:'Author',req:1},{k:'cat',label:'Category',type:'select',opts:opts(['Literature','Mathematics','Sciences','Humanities','Reference','Other'])},{k:'copies',label:'Copies',type:'number',min:1,def:1,req:1}],{copies:1},v=>{S.books.push({id:uid('b'),title:v.title,author:v.author,cat:v.cat,copies:+v.copies});log('Added book '+v.title)})};
const issueSave=(b,sid,due)=>{S.loans.unshift({id:uid('l'),bookId:b.id,studentId:sid,out:TODAY,due,returned:null});log(`Issued ${b.title} to ${sname(stu(sid))}`);toast('Book issued. The learner is told in the portal.')};
A.issue=d=>{if(!LIB())return;const b=S.books.find(x=>x.id===d.id);openForm('Issue: '+b.title,[{k:'studentId',label:'Borrower',type:'select',req:1,full:1,opts:`<option value="">Choose a learner</option>${studentOpts('')}`},{k:'due',label:'Due date',type:'date',def:addDays(TODAY,14),req:1}],{due:addDays(TODAY,14)},v=>{if(!v.studentId){toast('Choose a borrower');return false}issueSave(b,v.studentId,v.due)},{save:'Issue book'})};
A.issueTo=d=>{if(!LIB())return;const s=stu(d.id),avail=S.books.filter(b=>b.copies-onLoan(b)>0);openForm('Issue a book to '+sname(s),[{k:'bookId',label:'Book',type:'select',req:1,full:1,opts:`<option value="">Choose a book</option>${avail.map(b=>`<option value="${b.id}">${esc(b.title)}</option>`).join('')}`},{k:'due',label:'Due date',type:'date',def:addDays(TODAY,14),req:1}],{due:addDays(TODAY,14)},v=>{const b=S.books.find(x=>x.id===v.bookId);if(!b){toast('Choose a book');return false}issueSave(b,s.id,v.due)},{save:'Issue book'})};
A.ret=d=>{if(!LIB())return;const l=S.loans.find(x=>x.id===d.id);l.returned=TODAY;log('Book returned');save();drawMain();toast('Marked as returned')};
const libRemind=async(ids,sms)=>{try{const r=await api('POST','/api/library/remind',{loanIds:ids,sms});closeModal();toast(`Reminder sent to ${r.sent} borrower${r.sent===1?'':'s'}`)}catch(e){toast(e.message)}};
const libRemindAsk=ids=>openModal('Send a reminder',`<p>The learner gets a message in their student portal with the book details${ids.length>1?` (${ids.length} borrowers)`:''}. You can also text the guardian.</p>`,{foot:`<button class="btn" data-a="closeModal">Cancel</button><button class="btn" data-a="libGo" data-s="0">Portal only</button><button class="btn pri" data-a="libGo" data-s="1">Portal and SMS to guardian</button>`});
A.libRemind=d=>{ui.libIds=[d.id];libRemindAsk(ui.libIds)};
A.libRemindAll=()=>{ui.libIds=S.loans.filter(l=>!l.returned&&l.due<TODAY).map(l=>l.id);libRemindAsk(ui.libIds)};
A.libGo=d=>libRemind(ui.libIds||[],d.s==='1');

/* ===== Boarding (only the warden or matron changes anything) ===== */
const WARD=()=>isR('warden');
const RC_LBL={P:'Present',A:'Absent',E:'Exeat',S:'Sick bay'};
const boarders=()=>active().filter(s=>s.boarding==='Boarding');
const rcRow=(date,ses,sid)=>S.rollcall.find(r=>r.id===`${date}|${ses}|${sid}`);
function rcSummary(date,ses){const out={};S.dorms.forEach(d=>out[d.id]={d,P:0,A:0,E:0,S:0,n:0});out['-']={d:{name:'No dormitory'},P:0,A:0,E:0,S:0,n:0};
  boarders().forEach(s=>{const o=out[s.dorm]||out['-'],r=rcRow(date,ses,s.id);o.n++;if(r)o[r.mark]++});return Object.values(out).filter(o=>o.n)}
PAGES.boarding=()=>{
  const T=[['dorm','Dormitories'],['roll','Roll call'],['sum','Summary report']],tb=curTab('brd',T);
  const bs=boarders(),un=bs.filter(s=>!s.dorm),date=ui.f.rcd||TODAY,ses=ui.f.rcs||'Night';let body='';
  if(tb==='dorm'){
    body=`<div class="grid g4" style="margin-bottom:16px">${S.dorms.map(d=>{const n=bs.filter(s=>s.dorm===d.id).length;return `<div class="card"><div class="row" style="justify-content:space-between"><h3>${esc(d.name)}</h3>${pill(d.sex==='M'?'Boys':'Girls',d.sex==='M'?'info':'gold')}</div><div style="margin:12px 0 6px"><b class="mono" style="font-size:22px">${n}</b><span class="muted"> / ${d.cap} beds</span></div><div class="bar ${n>d.cap?'bad':''}"><i style="width:${Math.min(100,pct(n,d.cap))}%"></i></div>${WARD()&&!n?`<button class="btn sm danger" style="margin-top:10px" data-a="dormDel" data-id="${d.id}">Remove</button>`:''}</div>`}).join('')}</div>`+
    table([{h:'Boarder',f:s=>`<div class="person">${avS(s)}<b>${esc(sname(s))}</b></div>`},{h:'Class',f:s=>esc(cls(s.classId).name)},{h:'Sex',f:s=>s.sex},{h:'Dormitory',f:s=>WARD()?`<select class="inl" style="width:auto;font-family:inherit;text-align:left" data-c="dorm" data-id="${s.id}" aria-label="Dormitory for ${esc(sname(s))}"><option value="">Unassigned</option>${opts(S.dorms.filter(d=>d.sex===s.sex).map(d=>[d.id,d.name]),s.dorm)}</select>`:esc(S.dorms.find(d=>d.id===s.dorm)?.name||'Unassigned')},{h:'Guardian phone',m:1,f:s=>esc(s.guardian.phone)}],bs.sort((a,b)=>(a.dorm||'z').localeCompare(b.dorm||'z')||sname(a).localeCompare(sname(b))),{empty:'No boarders yet.'});
  }
  if(tb==='roll'){
    const list=bs.sort((a,b)=>sname(a).localeCompare(sname(b))),cnt={P:0,A:0,E:0,S:0};list.forEach(s=>{const r=rcRow(date,ses,s.id);if(r)cnt[r.mark]++});
    body=`<div class="tools"><input type="date" id="rcd" value="${date}" max="${TODAY}" data-c="rcDate" aria-label="Date"><select data-c="flt" data-k="rcs" aria-label="Roll call">${opts(['Morning','Evening','Night'],ses)}</select>${Object.keys(RC_LBL).map(k=>`<span class="pill ${k==='P'?'ok':k==='A'?'bad':'warn'}">${RC_LBL[k]} ${cnt[k]}</span>`).join('')}<span class="muted sm">${list.length-sum(Object.values(cnt))} not called</span>${WARD()?`<button class="btn sm" data-a="rcAll">Mark all present</button>`:''}</div>`+
    table([{h:'Boarder',f:s=>`<div class="person">${avS(s)}<span><b>${esc(sname(s))}</b><span class="muted sm">${esc(S.dorms.find(d=>d.id===s.dorm)?.name||'No dormitory')}</span></span></div>`},{h:'Class',f:s=>esc(cls(s.classId).name)},{h:'Call',r:1,f:s=>{const r=rcRow(date,ses,s.id);return WARD()?`<div class="seg">${Object.keys(RC_LBL).map(k=>`<button class="${k==='P'?'P':k==='A'?'A':'L'} ${r&&r.mark===k?'on':''}" data-a="rcMark" data-s="${s.id}" data-v="${k}" aria-pressed="${!!r&&r.mark===k}">${RC_LBL[k]}</button>`).join('')}</div>`:(r?pill(RC_LBL[r.mark],r.mark==='P'?'ok':r.mark==='A'?'bad':'warn'):'—')}}],list,{empty:'No boarders yet.'});
  }
  if(tb==='sum'){
    const sm=rcSummary(date,ses),tot=sm.reduce((a,o)=>({P:a.P+o.P,A:a.A+o.A,E:a.E+o.E,S:a.S+o.S,n:a.n+o.n}),{P:0,A:0,E:0,S:0,n:0});
    body=`<div class="tools"><input type="date" id="rcd" value="${date}" max="${TODAY}" data-c="rcDate" aria-label="Date"><select data-c="flt" data-k="rcs" aria-label="Roll call">${opts(['Morning','Evening','Night'],ses)}</select><button class="btn" data-a="rcPrintSum">Print summary for the school leadership</button><button class="btn" data-a="rcCsv">${ic('download')} Export CSV</button></div>`+
    table([{h:'Dormitory',f:o=>`<b>${esc(o.d.name)}</b>`},{h:'Boarders',m:1,r:1,f:o=>o.n},{h:'Present',m:1,r:1,f:o=>o.P},{h:'Absent',m:1,r:1,f:o=>o.A?`<b style="color:var(--bad)">${o.A}</b>`:0},{h:'Exeat',m:1,r:1,f:o=>o.E},{h:'Sick bay',m:1,r:1,f:o=>o.S},{h:'Not called',m:1,r:1,f:o=>o.n-o.P-o.A-o.E-o.S}],[...sm,{d:{name:'Total'},...tot}],{empty:'No boarders yet.'})+
    (()=>{const ab=boarders().filter(s=>(rcRow(date,ses,s.id)||{}).mark==='A');return ab.length?`<div class="card" style="margin-top:16px"><h3>Absent at the ${ses.toLowerCase()} roll call</h3><div class="list">${ab.map(s=>`<div><span>${esc(sname(s))} · ${esc(cls(s.classId).name)}</span><span class="muted sm">${esc(S.dorms.find(d=>d.id===s.dorm)?.name||'')}</span></div>`).join('')}</div></div>`:''})();
  }
  return ph('Boarding',`${bs.length} boarders · ${un.length} without a dormitory${WARD()?'':' · view only'}`,WARD()&&tb==='dorm'?`<button class="btn pri" data-a="dormNew">${ic('plus')} Add dormitory</button>`:'')+tabs('brd',T)+body;
};
CH.dorm=(v,d)=>{if(!WARD())return;const s=stu(d.id);s.dorm=v;log('Dormitory changed for '+sname(s));save();drawMain();toast(v?'Dormitory assigned. The learner is told in the portal.':'Dormitory removed')};
A.dormNew=()=>{if(!WARD())return;openForm('Add a dormitory',[{k:'name',label:'Name',req:1,full:1},{k:'sex',label:'For',type:'select',opts:opts([['M','Boys'],['F','Girls']])},{k:'cap',label:'Beds',type:'number',min:1,def:40,req:1}],{cap:40},v=>{S.dorms.push({id:uid('d'),name:v.name,sex:v.sex,cap:+v.cap});log('Added dormitory '+v.name)})};
A.dormDel=d=>{if(!WARD())return;const dm=S.dorms.find(x=>x.id===d.id);confirmBox(`Remove <b>${esc(dm.name)}</b>?`,()=>{S.dorms=S.dorms.filter(x=>x.id!==dm.id);log('Removed dormitory '+dm.name)},'Remove')};
CH.rcDate=v=>{if(v){ui.f.rcd=v;drawMain()}};
A.rcMark=d=>{if(!WARD())return;const date=ui.f.rcd||TODAY,ses=ui.f.rcs||'Night',id=`${date}|${ses}|${d.s}`,r=S.rollcall.find(x=>x.id===id);if(r)r.mark=d.v;else S.rollcall.push({id,date,session:ses,studentId:d.s,mark:d.v});save();drawMain()};
A.rcAll=()=>{if(!WARD())return;const date=ui.f.rcd||TODAY,ses=ui.f.rcs||'Night';boarders().forEach(s=>{if(!rcRow(date,ses,s.id))S.rollcall.push({id:`${date}|${ses}|${s.id}`,date,session:ses,studentId:s.id,mark:'P'})});log(`Roll call ${ses} ${date}`);save();drawMain();toast('Unmarked boarders set to present')};
const rcSumHTML=()=>{const date=ui.f.rcd||TODAY,ses=ui.f.rcs||'Night',sm=rcSummary(date,ses);const ab=boarders().filter(s=>(rcRow(date,ses,s.id)||{}).mark==='A');
  return `${letterhead('BOARDING ROLL CALL SUMMARY · '+ses+' · '+fdate(date))}<table><thead><tr><th>Dormitory</th><th>Boarders</th><th>Present</th><th>Absent</th><th>Exeat</th><th>Sick bay</th><th>Not called</th></tr></thead><tbody>${sm.map(o=>`<tr><td>${esc(o.d.name)}</td><td>${o.n}</td><td>${o.P}</td><td>${o.A}</td><td>${o.E}</td><td>${o.S}</td><td>${o.n-o.P-o.A-o.E-o.S}</td></tr>`).join('')}</tbody></table><p><b>Absent:</b> ${ab.length?ab.map(s=>esc(sname(s))+' ('+esc(cls(s.classId).name)+')').join(', '):'none'}</p><div class="sig"><div>Warden / Matron</div><div>Received by</div></div>`};
A.rcPrintSum=()=>printHTML('Boarding roll call summary',rcSumHTML());
A.rcCsv=()=>{const date=ui.f.rcd||TODAY,ses=ui.f.rcs||'Night';saveFile(`roll-call-${date}-${ses}.csv`,csv([['Dormitory','Boarders','Present','Absent','Exeat','Sick bay'],...rcSummary(date,ses).map(o=>[o.d.name,o.n,o.P,o.A,o.E,o.S])]))};

/* ===== Welfare and health ===== */
const WELFARE_REC=()=>!isR('admin');
const canResolve=d=>(d.byId&&d.byId===(ui.user&&ui.user.id))||isR('head','dos','registrar','warden');
PAGES.welfare=()=>{
  const T=[['disc','Discipline'],['sick','Sick bay']],tb=curTab('wel',T);let body='';
  const note=`<p class="muted sm" style="margin-bottom:12px">Everything recorded here is also sent to the learner's portal and the parent's portal, where they can read it but not change it.</p>`;
  if(tb==='disc')body=note+`<div class="tools">${WELFARE_REC()?`<button class="btn pri" data-a="discNew">${ic('plus')} Record a case</button>`:''}</div>`+table([{h:'Date',f:d=>fdate(d.date)},{h:'Learner',f:d=>`<b>${esc(sname(stu(d.studentId)))}</b><br><span class="muted sm">${esc(cls(stu(d.studentId)?.classId)?.name||'')}</span>`},{h:'Issue',f:d=>esc(d.type)+(d.desc?`<br><span class="muted sm">${esc(d.desc)}</span>`:'')},{h:'Action taken',f:d=>esc(d.action)},{h:'Recorded by',f:d=>`<span class="sm">${esc(d.by||'')}</span>`},{h:'Status',f:d=>pill(d.status,d.status==='Open'?'warn':'ok')},{h:'',r:1,f:d=>d.status==='Open'&&canResolve(d)?`<button class="btn sm" data-a="discClose" data-id="${d.id}">Resolve</button>`:''}],[...S.discipline].sort((a,b)=>b.date.localeCompare(a.date)),{empty:'No discipline cases to show.'});
  if(tb==='sick')body=note+`<div class="tools">${isR('sickbay')?`<button class="btn pri" data-a="sickNew">${ic('plus')} Record a visit</button>`:'<span class="muted sm">Only the sick bay attendants record visits. Everyone else can read them.</span>'}</div>`+table([{h:'Date',f:d=>fdate(d.date)},{h:'Learner',f:d=>`<b>${esc(sname(stu(d.studentId)))}</b><br><span class="muted sm">${esc(cls(stu(d.studentId)?.classId)?.name||'')}</span>`},{h:'Complaint',f:d=>esc(d.complaint)},{h:'Treatment',f:d=>esc(d.treatment)},{h:'Outcome',f:d=>pill(d.outcome,d.outcome==='Sent home'?'warn':'')},{h:'Attended by',f:d=>`<span class="sm">${esc(d.by||'')}</span>`}],[...S.sickbay].sort((a,b)=>b.date.localeCompare(a.date)),{empty:'No sick bay visits to show.'});
  return ph('Welfare & health','Discipline records and sick bay visits')+tabs('wel',T)+body;
};
A.discNew=()=>{if(!WELFARE_REC())return;openForm('Record a discipline case',[{k:'studentId',label:'Learner',type:'select',req:1,full:1,opts:`<option value="">Choose a learner</option>${studentOpts('')}`},{k:'date',label:'Date',type:'date',def:TODAY,req:1},{k:'type',label:'Issue',type:'select',opts:opts(['Late coming','Uniform','Fighting','Absconding lessons','Phone in school','Bullying','Other'])},{k:'desc',label:'Details',type:'textarea',full:1},{k:'action',label:'Action taken',req:1,full:1}],{date:TODAY},v=>{if(!v.studentId){toast('Choose a learner');return false}S.discipline.unshift({id:uid('c'),...v,status:'Open',by:'',byId:ui.user.id});log('Discipline case recorded')},{save:'Record case'})};
A.discClose=d=>{const c=S.discipline.find(x=>x.id===d.id);if(!c||!canResolve(c))return;c.status='Resolved';save();drawMain();toast('Case resolved')};
A.sickNew=()=>{if(!isR('sickbay'))return;openForm('Record a sick bay visit',[{k:'studentId',label:'Learner',type:'select',req:1,full:1,opts:`<option value="">Choose a learner</option>${studentOpts('')}`},{k:'date',label:'Date',type:'date',def:TODAY,req:1},{k:'complaint',label:'Complaint',req:1},{k:'treatment',label:'Treatment given',req:1},{k:'outcome',label:'Outcome',type:'select',opts:opts(['Returned to class','Rested in sick bay','Sent home','Referred to clinic'])}],{date:TODAY},v=>{if(!v.studentId){toast('Choose a learner');return false}S.sickbay.unshift({id:uid('k'),...v,by:''});log('Sick bay visit recorded')},{save:'Record visit'})};

/* ===== Calendar (head, registrar and Director of Studies add events) ===== */
const EVW=()=>isR('head','registrar','dos');
PAGES.events=()=>{
  const cm=ui.f.calm||TODAY.slice(0,7),y=+cm.slice(0,4),m=+cm.slice(5)-1,first=new Date(y,m,1),off=(first.getDay()+6)%7,dim=new Date(y,m+1,0).getDate();
  const cells=[];for(let i=0;i<off;i++)cells.push(null);for(let d=1;d<=dim;d++)cells.push(d);
  const evs=S.events.filter(e=>e.date.slice(0,7)===cm);
  const nav=n=>{const d=new Date(y,m+n,1);return d.getFullYear()+'-'+pad(d.getMonth()+1)};
  return ph('Calendar',`School calendar, Term ${S.school.term} ${S.school.year}${EVW()?'':' · view only'}`,EVW()?`<button class="btn pri" data-a="evNew">${ic('plus')} Add event</button>`:'')+
  `<div class="tools"><button class="btn sm" data-a="calGo" data-v="${nav(-1)}" aria-label="Previous month">${ic('back')}</button><h2 style="min-width:170px;text-align:center">${MONTHS[m]} ${y}</h2><button class="btn sm" data-a="calGo" data-v="${nav(1)}" aria-label="Next month"><span style="display:inline-block;transform:rotate(180deg)">${ic('back')}</span></button><button class="btn sm" data-a="calGo" data-v="${TODAY.slice(0,7)}">Today</button></div>
  <div class="tw" style="border:0;background:none"><div class="cal" style="min-width:640px">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<div class="dh">${d}</div>`).join('')}${cells.map(d=>{if(!d)return'<div class="oth"></div>';const ds=`${cm}-${pad(d)}`;return`<div class="${ds===TODAY?'today':''}"><b>${d}</b>${evs.filter(e=>e.date===ds).map(e=>`<span class="ev ${e.kind}" title="${esc(e.title)}">${esc(e.title)}</span>`).join('')}</div>`}).join('')}</div></div>
  <div class="card" style="margin-top:16px"><h3>Events this month</h3>${evs.length?`<div class="list">${evs.sort((a,b)=>a.date.localeCompare(b.date)).map(e=>`<div><span><b>${esc(e.title)}</b><br><span class="muted sm">${fdate(e.date)}${e.details?' · '+esc(e.details):''}</span></span>${EVW()?`<button class="btn sm danger" data-a="evDel" data-id="${e.id}">Remove</button>`:''}</div>`).join('')}</div>`:empty('No events this month.')}</div>`;
};
A.calGo=d=>{ui.f.calm=d.v;drawMain()};
A.evNew=()=>{if(!EVW())return;openForm('Add an event',[{k:'title',label:'Title',req:1,full:1},{k:'date',label:'Date',type:'date',def:TODAY,req:1},{k:'kind',label:'Type',type:'select',opts:opts([['term','School'],['exam','Exam'],['sport','Sports'],['holiday','Holiday']])},{k:'details',label:'Details',type:'textarea',full:1}],{date:TODAY},v=>{S.events.push({id:uid('e'),...v});ui.f.calm=v.date.slice(0,7);log('Event added: '+v.title)})};
A.evDel=d=>{if(!EVW())return;S.events=S.events.filter(e=>e.id!==d.id);save();drawMain();toast('Event removed')};

/* ===== Communication (audiences depend on the role; delivered only to the intended people) ===== */
const AUD_ROLE={head:['all','bal','c','stu_all','stu_bal','stu_c','staff','teachers','ct'],dos:['all','c','stu_all','stu_c','staff','teachers','ct'],registrar:['all','c','stu_all','stu_c','staff','teachers','ct'],bursar:['all','bal','c','stu_all','stu_bal','stu_c'],hrm:['staff','teachers','ct'],examoffice:['teachers','ct']};
const audOK=k=>(AUD_ROLE[ui.role]||[]).includes(k);
const AUDf=()=>{const o=[];
  if(audOK('all'))o.push(['all','All parents and guardians']);
  if(audOK('bal'))o.push(['bal','Parents of learners with a fee balance']);
  if(audOK('c'))S.classes.forEach(c=>o.push(['c:'+c.id,'Parents of '+c.name]));
  if(audOK('stu_all'))o.push(['stu_all','All students']);
  if(audOK('stu_bal'))o.push(['stu_bal','All students with a fee balance']);
  if(audOK('stu_c'))S.classes.forEach(c=>o.push(['stu_c:'+c.id,'Students of '+c.name]));
  if(audOK('staff'))o.push(['staff','All staff']);
  if(audOK('teachers'))o.push(['teachers','All teachers']);
  if(audOK('ct'))o.push(['ct','All class teachers']);
  return o};
const recips=a=>{const ac=active();
  if(a==='all'||a==='stu_all')return a==='all'?new Set(ac.map(s=>digits(s.guardian.phone)||s.id)).size:ac.length;
  if(a==='bal')return new Set(ac.filter(s=>balOf(s)>0).map(s=>digits(s.guardian.phone)||s.id)).size;
  if(a==='stu_bal')return ac.filter(s=>balOf(s)>0).length;
  if(a.startsWith('stu_c:'))return inClass(a.slice(6)).length;
  if(a.startsWith('c:'))return new Set(inClass(a.slice(2)).map(s=>digits(s.guardian.phone)||s.id)).size;
  if(a==='staff')return S.staff.filter(s=>s.status==='Active').length;
  if(a==='teachers')return S.staff.filter(s=>s.status==='Active'&&s.type==='Teaching').length;
  if(a==='ct')return new Set(S.classes.map(c=>c.teacherId).filter(Boolean)).size;
  return 0};
const TPL={fees:()=>`Dear {guardian}, {child} has a fees balance of {balance} for Term ${S.school.term}. Kindly clear it before end-of-term exams. ${S.school.name}.`,parents:()=>`Dear parent, you are invited to the parents' day at ${S.school.name}. Please come with your child's report book.`,close:()=>`Dear parent, school closes on ${fdate(S.school.termEnd)} and reopens on ${fdate(S.school.nextTerm)}. ${S.school.name}.`,staff:()=>`Dear colleagues, please note the following: `};
PAGES.comms=()=>{
  const list=AUDf(),aud=list.find(a=>a[0]===ui.f.aud)?ui.f.aud:(list[0]||[''])[0],n=recips(aud),toStu=aud.startsWith('stu_'),toStaff=['staff','teachers','ct'].includes(aud);
  const chans=['Portal',...(toStu?[]:['SMS']),...(isR('head','dos','registrar','bursar')?['Notice board']:[])];
  const mine=[...S.messages].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  return ph('Communication','Send messages to exactly the people who should receive them')+
  `<div class="grid g12"><div class="card"><h3>New message</h3><div class="stack" style="gap:12px"><div class="field"><label for="aud">To</label><select id="aud" data-c="flt" data-k="aud">${opts(list,aud)}</select></div><div class="field"><label for="chan">Channel</label><select id="chan" data-c="chanSel">${opts(chans.map(c=>[c,c==='Portal'?(toStaff?'Staff inbox':toStu?'Student portal':'Parent portal'):c==='SMS'?'SMS to phones (and portal)':'Notice board (everyone)']),ui.f.chan&&chans.includes(ui.f.chan)?ui.f.chan:chans[0])}</select></div><div class="field"><label for="mtitle">Title</label><input id="mtitle" maxlength="100" placeholder="Optional, shown above the message"></div><div class="field"><label for="msg">Message</label><textarea id="msg" data-c="live" data-k="msg" style="min-height:130px" placeholder="Type your message"></textarea><span class="muted xs" id="mcount">0 characters · 0 SMS</span></div>
  <div class="row"><span class="muted sm">Templates:</span>${toStaff?`<button class="btn sm" data-a="tpl" data-t="staff">Staff notice</button>`:`${audOK('bal')?`<button class="btn sm" data-a="tpl" data-t="fees">Fees</button>`:''}<button class="btn sm" data-a="tpl" data-t="parents">Parents' day</button><button class="btn sm" data-a="tpl" data-t="close">Closing day</button>`}</div>
  <p class="muted xs">${toStaff?'':'Use {child}, {guardian}, {class} and {balance} to personalise each message. '}Only the chosen audience can see the message.</p>
  <div class="row" style="justify-content:space-between"><span class="pill info">${n} recipient${n===1?'':'s'}</span><button class="btn pri" data-a="sendMsg">Send message</button></div></div></div>
  <div class="card"><h3>Message history</h3>${table([{h:'Date',f:m=>fdate(m.date)},{h:'Channel',f:m=>pill(m.channel)},{h:'To',f:m=>esc(m.audience)+`<br><span class="muted sm">${m.n} recipient${m.n===1?'':'s'}</span>`},{h:'Message',f:m=>`<span class="sm">${esc(m.body.length>110?m.body.slice(0,110)+'…':m.body)}</span>${m.by?`<br><span class="muted xs">${esc(m.by)}</span>`:''}`},{h:'Status',f:m=>pill(m.status,'')}],mine.slice(0,40),{empty:'No messages sent yet.'})}</div></div>`;
};
const _live=CH.live;
CH.live=(v,d,el)=>{if(d.k==='msg'){const c=$('#mcount');if(c)c.textContent=`${v.length} characters · ${Math.max(1,Math.ceil(v.length/160))} SMS`;return}_live&&_live(v,d,el)};
CH.chanSel=v=>{ui.f.chan=v};
A.tpl=d=>{const t=$('#msg');t.value=TPL[d.t]();CH.live(t.value,{k:'msg'},t)};
A.sendMsg=async()=>{const m=$('#msg').value.trim();if(!m){toast('Type a message first');return}
  const list=AUDf(),aud=list.find(a=>a[0]===ui.f.aud)?ui.f.aud:(list[0]||[''])[0],chan=$('#chan').value,title=$('#mtitle').value.trim();
  if(!aud){toast('You cannot send messages');return}
  toast('Sending…');const r=await sendComms({audience:aud,channel:chan,title,body:m},null);
  if(r){toast(r.status+' · '+r.n+' recipient'+(r.n===1?'':'s'));$('#msg').value='';drawMain()}};

/* ===== Reports (each report is offered only to the roles that may see it) ===== */
const lastEx=()=>S.exams[S.exams.length-1];
const REPORTS=[
 {id:'enrol',t:'Enrolment by class',d:'Boys, girls, day and boarding per class',r:['admin','head','dos','registrar','hrm','examoffice','warden'],b:()=>({h:['Class','Boys','Girls','Day','Boarding','Total'],r:S.classes.map(c=>{const l=inClass(c.id);return[c.name,l.filter(s=>s.sex==='M').length,l.filter(s=>s.sex==='F').length,l.filter(s=>s.boarding==='Day').length,l.filter(s=>s.boarding==='Boarding').length,l.length]})})},
 {id:'def',t:'Fee defaulters',d:'Every learner with an outstanding balance',r:['admin','head','bursar'],b:()=>({h:['Adm no','Learner','Class','Guardian','Phone','Balance UGX'],r:active().filter(s=>balOf(s)>0).sort((a,b)=>balOf(b)-balOf(a)).map(s=>[s.adm,sname(s),cls(s.classId).name,s.guardian.name,s.guardian.phone,fmt(balOf(s))])})},
 {id:'feec',t:'Fee collection by class',d:'Billed, collected and outstanding',r:['admin','head','bursar'],b:()=>({h:['Class','Billed UGX','Collected UGX','Outstanding UGX','Rate'],r:S.classes.map(c=>{const l=inClass(c.id),e=sum(l.map(billed)),p=sum(l.map(s=>Math.min(paidBy(s),billed(s))));return[c.name,fmt(e),fmt(p),fmt(e-p),pct(p,e)+'%']})})},
 {id:'led',t:'Payments ledger',d:'Every approved payment',r:['admin','head','bursar'],b:()=>({h:['Receipt','Date','Learner','Method','Amount UGX'],r:S.payments.filter(okPay).map(p=>[p.rct,p.date,sname(stu(p.studentId)),p.method,fmt(p.amount)])})},
 {id:'att',t:'Learner attendance by class',d:'Average attendance over the last 14 school days',r:['admin','head','dos','registrar'],b:()=>{const days=Object.keys(S.attendance).sort().slice(-14);return{h:['Class','Class teacher','Average attendance','Days recorded'],r:S.classes.map(c=>{const rs=days.map(d=>dayRate(d,inClass(c.id))).filter(v=>v!=null);return[c.name,tch(c.teacherId)?.name||'—',rs.length?Math.round(avg(rs))+'%':'—',rs.length]})}}},
 {id:'res',t:'Results summary',d:'Class averages for the latest exam session',r:['head','dos','registrar','examoffice'],b:()=>{const ex=lastEx();return{h:['Class','Learners marked','Class average','Top learner','Top average'],r:ex?S.classes.map(c=>{const r=results(ex.id,c.id),k=r.rows.filter(x=>x.n);return[c.name,k.length,k.length?avg(k.map(x=>x.avg)).toFixed(1):'—',k[0]?sname(k[0].s):'—',k[0]?k[0].avg.toFixed(1):'—']}):[]}}},
 {id:'over',t:'Overdue library books',d:'Books past their due date',r:['admin','head'],b:()=>({h:['Book','Borrower','Due','Days overdue'],r:S.loans.filter(l=>!l.returned&&l.due<TODAY).map(l=>[S.books.find(b=>b.id===l.bookId)?.title,sname(stu(l.studentId)),l.due,Math.round((parseD(TODAY)-parseD(l.due))/864e5)])})},
 {id:'dorm',t:'Dormitory occupancy',d:'Beds used per dormitory',r:['admin','head','dos','warden'],b:()=>({h:['Dormitory','Beds','Occupied','Free'],r:S.dorms.map(d=>{const n=active().filter(s=>s.dorm===d.id).length;return[d.name,d.cap,n,d.cap-n]})})},
 {id:'roll',t:'Boarding roll call (latest)',d:'Present, absent, exeat and sick bay per dormitory at the latest roll call',r:['admin','head','dos','warden'],b:()=>{const l=[...S.rollcall].sort((a,b)=>(b.date+b.session).localeCompare(a.date+a.session))[0];if(!l)return{h:['Dormitory','Boarders','Present','Absent','Exeat','Sick bay'],r:[]};return{h:['Dormitory','Boarders','Present','Absent','Exeat','Sick bay'],r:rcSummary(l.date,l.session).map(o=>[o.d.name+' ('+l.session+', '+l.date+')',o.n,o.P,o.A,o.E,o.S])}}},
 {id:'disc',t:'Discipline log',d:'All recorded cases',r:['admin','head','dos','registrar','hrm','warden'],b:()=>({h:['Date','Learner','Issue','Action','Recorded by','Status'],r:S.discipline.map(d=>[d.date,sname(stu(d.studentId)),d.type,d.action,d.by||'',d.status])})},
 {id:'staff',t:'Staff list',d:'All staff with roles, departments and contacts',r:['admin','head','dos','hrm'],b:()=>({h:['Name','Category','Role','Department','Duties','Phone','Status'],r:S.staff.map(t=>[t.name,t.type,t.role,t.dept||'',(t.duties||[]).join('; '),t.phone,t.status])})},
 {id:'satt',t:'Staff attendance',d:'Present, late and absent days per staff member',r:['head','hrm'],b:()=>({h:['Staff member','Present','Late','Absent','Days recorded'],r:S.staff.filter(t=>t.status==='Active').map(t=>{const a=S.staffatt.filter(x=>x.staffId===t.id);return[t.name,a.filter(x=>x.mark==='P').length,a.filter(x=>x.mark==='L').length,a.filter(x=>x.mark==='A').length,a.length]})})},
 {id:'pay',t:'Payroll summary',d:'Monthly salary and allowances',r:['head','hrm'],b:()=>({h:['Staff member','Contract','Salary UGX','Allowances UGX','Total UGX'],r:S.staff.filter(t=>t.status==='Active').map(t=>{const h=hrOf(t.id);return[t.name,h.contract,fmt(h.salary),fmt(h.allowances),fmt((+h.salary||0)+(+h.allowances||0))]})})},
 {id:'leave',t:'Staff leave',d:'Leave requests and their status',r:['head','hrm'],b:()=>({h:['Staff member','Type','From','To','Status'],r:S.leaves.map(l=>[tch(l.staffId)?.name||'Removed',l.type,l.from,l.to,l.status])})}];
const REPS=()=>REPORTS.filter(r=>r.r.includes(ui.role));
PAGES.reports=()=>{
  const sel=REPS().find(r=>r.id===ui.f.rep);
  if(!sel)return ph('Reports','Choose a report to view or export')+`<div class="grid g3">${REPS().map(r=>`<button class="card" style="text-align:left;cursor:pointer" data-a="repOpen" data-id="${r.id}"><h3>${esc(r.t)}</h3><p class="muted sm">${esc(r.d)}</p></button>`).join('')}</div>`;
  const o=sel.b();
  return ph(sel.t,sel.d,`<button class="btn" data-a="repClose">${ic('back')} All reports</button><button class="btn pri" data-a="repExport">${ic('download')} Export CSV</button>`)+table(o.h.map((h,i)=>({h,m:typeof o.r[0]?.[i]==='number',r:typeof o.r[0]?.[i]==='number',f:r=>esc(r[i])})),o.r,{empty:'No data for this report yet.'});
};
A.repOpen=d=>{ui.f.rep=d.id;drawMain()};A.repClose=()=>{ui.f.rep='';drawMain()};
A.repExport=()=>{const s=REPS().find(r=>r.id===ui.f.rep),o=s.b();saveFile('walEduc-'+s.id+'.csv',csv([o.h,...o.r]))};

/* ===== Settings (administrator only) ===== */
PAGES.settings=()=>{
  const T=[['school','School profile'],['cal','Academic calendar'],['users','Accounts'],['sms','SMS'],['roles','Access by role'],['audit','Audit log'],['data','Data']],tb=curTab('settings',T);let body='';if(tb==='users')loadUsers();if(tb==='audit')loadAudit();if(tb==='data')loadBackups();
  const sf=(k,l,t='text')=>`<div class="field"><label for="sc_${k}">${l}</label><input id="sc_${k}" type="${t}" value="${esc(S.school[k])}" data-c="sch" data-k="${k}"></div>`;
  if(tb==='school')body=`<div class="grid g2"><div class="card"><h3>School badge</h3><div class="row" style="gap:20px;flex-wrap:nowrap"><div class="badgebox">${badge(110)}</div><div class="stack" style="gap:10px"><p class="muted sm">${S.school.badge?'Your uploaded badge appears in the sidebar, report cards, receipts and downloads.':'This is a placeholder badge. Upload the official school badge and it replaces this everywhere.'}</p><div class="row"><input id="badgeFile" type="file" aria-label="Choose a badge image to upload" accept="image/png,image/jpeg,image/svg+xml,image/webp" data-c="badgeFile">${S.school.badge?`<button class="btn" data-a="badgeReset">Use placeholder</button>`:''}</div><p class="muted xs">PNG, JPG, WebP or SVG. A square image on a transparent background looks best.</p></div></div></div>
  <div class="card"><h3>Details</h3><div class="fgrid">${sf('name','School name')}${sf('code','Admission prefix')}${sf('address','Address')}${sf('motto','Motto')}${sf('phone','Phone')}${sf('email','Email','email')}${sf('po','P.O. Box')}${sf('head','Head teacher title or name')}<div class="field full"><label for="sc_payInfo">How to pay fees (shown to parents)</label><input id="sc_payInfo" value="${esc(S.school.payInfo)}" placeholder="For example: MTN MoMo merchant code, bank name and account number" data-c="sch" data-k="payInfo"></div></div></div></div>`;
  if(tb==='cal')body=`<div class="card" style="max-width:720px"><h3>Current term</h3><div class="fgrid">${sf('year','Year','number')}<div class="field"><label for="sc_term">Term</label><select id="sc_term" data-c="sch" data-k="term">${opts([1,2,3],S.school.term)}</select></div>${sf('termStart','Term opens','date')}${sf('termEnd','Term closes','date')}${sf('nextTerm','Next term begins','date')}</div></div>`;
  if(tb==='users')body=usersTab();
  if(tb==='roles')body=rolesMatrix();
  if(tb==='audit')body=table([{h:'When',f:a=>new Date(a.t).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'})},{h:'Who',f:a=>esc(a.u)},{h:'Action',f:a=>esc(a.a)}],S.audit,{empty:'No activity yet.'});
  if(tb==='sms'){const c=S.sms||{};body=`<div class="card" style="max-width:640px"><h3>SMS</h3><p class="muted sm" style="margin-bottom:12px">Connect an Africa's Talking account to send real text messages: admission, interview and pass-interview notices, fee reminders and Communication messages. Without it, messages are delivered in the portals and the SMS is only recorded. Use the sandbox switch to test without sending anything real.</p><div class="fgrid"><div class="field"><label for="sms_p">Provider</label><select id="sms_p"><option value="none" ${c.provider!=='africastalking'?'selected':''}>None (record only)</option><option value="africastalking" ${c.provider==='africastalking'?'selected':''}>Africa's Talking</option></select></div><div class="field"><label for="sms_u">Account username</label><input id="sms_u" value="${esc(c.username||'')}" autocomplete="off"></div><div class="field"><label for="sms_k">API key ${c.hasKey?'(saved, leave blank to keep)':''}</label><input id="sms_k" type="password" autocomplete="new-password"></div><div class="field"><label for="sms_s">Sender ID (optional)</label><input id="sms_s" value="${esc(c.sender||'')}"></div></div><label class="row sm" style="gap:6px;margin:12px 0"><input id="sms_sb" type="checkbox" ${c.sandbox?'checked':''}> Sandbox (testing only)</label><button class="btn pri" data-a="smsSave">Save SMS settings</button></div>`}
  if(tb==='data'){const B=S.backups;body=`<div class="grid g2"><div class="card"><h3>Database and backups</h3><p class="muted sm" style="margin-bottom:12px">${S.sample?'The system currently holds <b>sample data</b>. Clear it to begin with your own records. Your school details, classes and fee structure stay.':'The system holds your own records.'} Everything is stored in the WalEduc database on the server computer${B?` (${esc(B.dir.replace(/[\\/]backups$/,''))}), currently ${(B.dbSize/1048576).toFixed(1)} MB`:''}. A backup is made automatically every day and the last 14 are kept.</p><div class="row" style="margin-bottom:12px"><a class="btn pri" href="/api/backup" download>${ic('download')} Download database backup</a><button class="btn" data-a="backupNow">Back up now</button></div>${B&&B.files.length?`<div class="list">${B.files.slice(0,8).map(f=>`<div><span class="mono sm">${esc(f.name)}<br><span class="muted xs">${new Date(f.time).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'})} · ${(f.size/1024).toFixed(0)} KB</span></span><a class="btn sm" href="/api/backups/${encodeURIComponent(f.name)}" download>Download</a></div>`).join('')}</div>`:'<p class="muted sm">No server backups yet.</p>'}<p class="muted xs" style="margin-top:10px">To restore a database backup, stop WalEduc and copy the file over <span class="mono">data/walEduc.db</span>. See the README.</p></div>
  <div class="stack"><div class="card"><h3>Start fresh</h3><p class="muted sm" style="margin-bottom:12px">Remove all learners, staff, marks, payments and other records. This cannot be undone, so download a backup first.</p><div class="row"><button class="btn danger" data-a="wipe">Clear all records</button><button class="btn" data-a="reseed">Load sample data</button></div></div></div></div>`}
  return ph('Settings',esc(S.school.name)+' · the administrator oversees the system and creates accounts; records are changed by the roles that own them')+tabs('settings',T)+body;
};
CH.sch=(v,d)=>{S.school[d.k]=['year','term'].includes(d.k)?+v:v;log('School setting changed: '+d.k);save();drawSide();if(['year','term'].includes(d.k))drawMain()};
const rolesMatrix=()=>{
  const W={students:'Registrar',admissions:'Registrar',staff:'HRM (duties: Head, DoS)',hr:'HRM',classes:'Head, Registrar, DoS',timetable:'DoS',attendance:'Class teachers',exams:'Exam Office, subject teachers',fees:'Bursar',library:'Librarian',boarding:'Warden / Matron',welfare:'Any staff (discipline) · Sick bay (health)',comms:'Role-based audiences',events:'Head, Registrar, DoS',reports:'View only'};
  const mods=NAV.flatMap(g=>g[1]).filter(n=>!['account','accounts','dashboard','inbox'].includes(n[0]));
  const staffRoles=Object.keys(ROLES);
  return `<p class="muted" style="margin-bottom:12px">A tick means the role can open that module. The last column names the roles that can change records in it; everyone else sees the records but cannot edit them. The Administrator oversees everything he is allowed to see, creates accounts, and cannot alter records made by others.</p><div class="tw"><table class="t"><thead><tr><th>Module</th>${staffRoles.map(r=>`<th class="r">${esc(ROLES[r])}</th>`).join('')}<th>Changes made by</th></tr></thead><tbody>${mods.map(n=>`<tr><td><b>${n[1]}</b></td>${staffRoles.map(k=>`<td class="r">${ACCESS[n[0]]==='*'||(ACCESS[n[0]]||[]).includes(k)?`<span style="color:var(--ok)">${ic('check')}</span>`:'<span class="muted">·</span>'}</td>`).join('')}<td class="sm">${esc(W[n[0]]||'')}</td></tr>`).join('')}</tbody></table></div>`};

/* ===== Accounts (administrator creates staff, learner and parent accounts) ===== */
const usersTab=()=>{
  const q=(ui.f.uq||'').toLowerCase(),list=S.users.filter(u=>!q||(u.name+u.username+ROLE_LABEL[u.role]).toLowerCase().includes(q)).sort((a,b)=>a.role.localeCompare(b.role)||a.name.localeCompare(b.name)),pg=pager('u',list.length,15);
  const cn=r=>S.users.filter(u=>u.role===r).length;
  return `<div class="tools">${inpSearch('uq','Search name or username',ui.f.uq)}<button class="btn pri" data-a="userAdd">${ic('plus')} Add staff account</button><button class="btn" data-a="genPortal">Create learner and parent accounts</button></div><p class="muted sm" style="margin-bottom:10px">${S.users.filter(u=>!['parent','student'].includes(u.role)).length} staff · ${cn('parent')} parent · ${cn('student')} learner accounts. Passwords are never stored in readable form. Temporary passwords are shown once when created. A teacher account must be linked to the teacher's record in the Staff list so that classes, subjects and marks follow the right person.</p>`+
  table([{h:'Name',f:u=>`<div class="person">${av(u.name)}<b>${esc(u.name)}</b></div>`},{h:'Username',m:1,f:u=>esc(u.username)},{h:'Role',f:u=>pill(ROLE_LABEL[u.role],['parent','student'].includes(u.role)?'info':'gold')},{h:'Staff record',f:u=>['parent','student'].includes(u.role)?'—':(u.staffId&&tch(u.staffId)?esc(tch(u.staffId).name):(u.role==='admin'?'—':pill('Not linked','warn')))},{h:'Status',f:u=>u.active?(u.must?pill('Awaiting first sign-in','warn'):pill('Active','ok')):pill('Switched off','bad')},{h:'Last sign-in',f:u=>u.last?fdate(u.last.slice(0,10)):'—'},{h:'',r:1,f:u=>`${['parent','student','admin'].includes(u.role)?'':`<button class="btn sm" data-a="userLink" data-id="${u.id}">Link to staff</button> `}<button class="btn sm" data-a="userReset" data-id="${u.id}">Reset password</button> <button class="btn sm" data-a="userToggle" data-id="${u.id}" ${u.id===ui.user.id?'disabled':''}>${u.active?'Switch off':'Switch on'}</button> <button class="btn sm danger" data-a="userDel" data-id="${u.id}" ${u.id===ui.user.id?'disabled':''}>Remove</button>`}],pg.slice(list),{empty:'No accounts match.'})+pg.html;
};
function showCreds(rows){ui.creds=rows;openModal('Login details to hand out',`<p class="muted sm" style="margin-bottom:12px">These temporary passwords are shown <b>only now</b>. Download the list and give each person their details. Everyone must choose their own password when they first sign in.</p>`+table([{h:'Name',f:r=>esc(r.name)},{h:'Role',f:r=>esc(r.role)},{h:'Username',m:1,f:r=>esc(r.username)},{h:'Temporary password',m:1,f:r=>`<b>${esc(r.pw)}</b>`}],rows.slice(0,200))+(rows.length>200?`<p class="muted sm" style="margin-top:8px">Showing the first 200 of ${rows.length}. The downloaded list has everyone.</p>`:''),{wide:1,foot:`<button class="btn" data-a="credsDone">Done</button><button class="btn pri" data-a="credsCsv">${ic('download')} Download list (CSV)</button>`})}
A.credsCsv=()=>saveFile('walEduc-login-details.csv',csv([['Name','Role','Username','Temporary password'],...(ui.creds||[]).map(r=>[r.name,r.role,r.username,r.pw])]));
A.credsDone=()=>{ui.creds=null;closeModal()};
const roleFromStaff=t=>{const r=String(t.role||'').toLowerCase();
  if(/human resource|hrm|\bhr\b/.test(r))return'hrm';if(/exam/.test(r))return'examoffice';if(/sick|nurse|clinic/.test(r))return'sickbay';
  if(/head ?teacher|headmaster|headmistress|deputy head/.test(r))return'head';if(/director of studies|\bdos\b/.test(r))return'dos';
  if(/bursar|accountant/.test(r))return'bursar';if(/registrar/.test(r))return'registrar';if(/librarian/.test(r))return'librarian';if(/warden|matron/.test(r))return'warden';
  return t.type==='Teaching'?'teacher':'registrar'};
const staffPick=sel=>`<option value="">${sel===false?'Not linked':'Not in the list, type the name below'}</option>${S.staff.map(t=>`<option value="${t.id}">${esc(t.name)} · ${esc(t.role)}</option>`).join('')}`;
A.userAdd=()=>openForm('Add a staff account',[{k:'staffId',label:'Staff member (add them in Staff first)',type:'select',full:1,opts:staffPick()},{k:'name',label:'Full name (only if not chosen above)',full:1},{k:'username',label:'Username',req:1},{k:'role',label:'Role',type:'select',opts:`<option value="auto">Automatic, from the staff role</option>${Object.entries(ROLES).filter(r=>r[0]!=='admin').map(r=>`<option value="${r[0]}">${r[1]}</option>`).join('')}`}],{},v=>{
  const t=v.staffId?tch(v.staffId):null,name=t?t.name:v.name;if(!name){toast('Choose a staff member or type a name');return false}
  const role=v.role==='auto'?(t?roleFromStaff(t):'teacher'):v.role;
  if(role==='teacher'&&!t){toast('A teacher account must be linked to a staff record. Ask the HR Manager to add the teacher first.');return false}
  flush().then(()=>api('POST','/api/users',{name,username:v.username,role,staffId:t?t.id:undefined})).then(r=>{loadUsers(true);showCreds([{name,role:ROLE_LABEL[role],username:v.username,pw:r.pw}])}).catch(e=>toast(e.message))},{save:'Create account'});
A.userLink=d=>{const u=S.users.find(x=>x.id===d.id);openForm('Link '+u.name+' to a staff record',[{k:'staffId',label:'Staff record',type:'select',full:1,opts:staffPick(false).replace('<option value="">','<option value="">'+'')}],{staffId:u.staffId||''},v=>{api('POST','/api/users/'+u.id+'/link',{staffId:v.staffId||''}).then(()=>{loadUsers(true);toast('Linked. They sign in again to pick it up.')}).catch(e=>toast(e.message))},{save:'Link'})};
const ldOnce=(k,fn,force)=>{ui.ld=ui.ld||{};if(!force&&ui.ld[k]&&Date.now()-ui.ld[k]<8000)return;ui.ld[k]=Date.now();fn().then(()=>{if(ui.route==='settings')softRender()}).catch(e=>toast(e.message))};
const loadUsers=force=>ldOnce('users',async()=>{S.users=(await api('GET','/api/users')).users},force);
const loadAudit=force=>ldOnce('audit',async()=>{S.audit=(await api('GET','/api/audit')).rows},force);
const loadBackups=force=>ldOnce('backups',async()=>{S.backups=await api('GET','/api/backups')},force);
A.userReset=d=>{const u=S.users.find(x=>x.id===d.id);confirmBox(`Reset the password for <b>${esc(u.name)}</b>? A new temporary password will be shown once and they must change it at next sign-in.`,()=>{api('POST','/api/users/'+u.id+'/reset',{}).then(r=>{loadUsers(true);showCreds([{name:r.user.name,role:r.user.role,username:r.user.username,pw:r.pw}])}).catch(e=>toast(e.message))},'Reset password')};
A.userToggle=d=>{api('POST','/api/users/'+d.id+'/toggle',{}).then(r=>{loadUsers(true);toast(r.active?'Account switched on':'Account switched off')}).catch(e=>toast(e.message))};
A.userDel=d=>{const u=S.users.find(x=>x.id===d.id);confirmBox(`Remove the account for <b>${esc(u.name)}</b>? They will no longer be able to sign in.`,()=>{api('DELETE','/api/users/'+u.id).then(()=>{loadUsers(true);toast('Account removed')}).catch(e=>toast(e.message))},'Remove account')};
A.genPortal=()=>{
  const needS=active().filter(s=>!S.users.some(u=>u.role==='student'&&(u.owners||[])[0]===s.id)),pm=new Map();
  active().forEach(s=>{const p=digits(s.guardian.phone);if(p.length>=7&&!S.users.some(u=>u.role==='parent'&&u.username===p)&&!pm.has(p))pm.set(p,s.guardian.name)});
  if(!needS.length&&!pm.size){toast('Every learner and guardian already has an account');return}
  confirmBox(`Create accounts for <b>${needS.length}</b> learners and <b>${pm.size}</b> parents or guardians? Learners sign in with their admission number. Parents sign in with their phone number, and one account covers all their children.`,()=>{
    toast('Creating accounts…');
    flush().then(()=>api('POST','/api/users/bulk',{})).then(r=>{const rows=r.created.sort((a,b)=>a.role.localeCompare(b.role)||a.name.localeCompare(b.name));loadUsers(true);showCreds(rows)}).catch(e=>toast(e.message))},'Create accounts')};

/* ===== Learner and parent portals ("Student portal" / "My child Portal"). Everything is view-only except PRN and payment submission. ===== */
const kidBar=()=>{const k=kidsOf(ui.user);return k.length>1?`<div class="tools"><label class="muted sm" for="kidsel">Showing</label><select id="kidsel" data-c="flt" data-k="child" aria-label="Choose learner">${opts(k.map(s=>[s.id,sname(s)+' · '+cls(s.classId).name]),portalKid().id)}</select></div>`:''};
const noKid=()=>ph('Welcome',esc(S.school.name))+`<div class="card">${empty('No learner is linked to this account yet. Please contact the school office.')}</div>`;
const pubExams=()=>S.exams.filter(e=>e.published).sort((a,b)=>(a.year-b.year)||(a.term-b.term));
/* every released report card for this learner, including cards from classes they have since left */
const pubRows=s=>pubExams().map(ex=>{const cid=placeOf(ex.id,s),r=results(ex.id,cid),row=r.rows.find(x=>x.s.id===s.id);return row&&row.n?{ex,row,of:row.of||r.rows.filter(x=>x.n).length,c:r.c}:null}).filter(Boolean);
const attStats=s=>{const days=Object.keys(S.attendance).sort().slice(-20),m=days.map(d=>({d,v:S.attendance[d][s.id]})).filter(x=>x.v);return{m,rate:m.length?pct(m.filter(x=>x.v!=='A').length,m.length):null}};
const hello=()=>`Hello, ${esc(ui.user.name.split(' ')[0])}`;
PAGES.p_home=()=>{const s=portalKid();if(!s)return noKid();const c=cls(s.classId),b=balOf(s),rows=pubRows(s),at=attStats(s),loans=S.loans.filter(l=>l.studentId===s.id&&!l.returned);
  const up=S.events.filter(e=>e.date>=TODAY).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4);
  const last=rows[rows.length-1];
  return ph(hello(),`${portalTitle()} · ${esc(S.school.name)} · Term ${S.school.term}, ${S.school.year}`)+kidBar()+
  `<div class="card" style="margin-bottom:16px"><div class="person" style="gap:16px">${avS(s,'lg')}<span><h2 style="font-size:22px">${esc(sname(s))}</h2><span class="muted">${esc(s.adm)} · ${esc(c.name)} · ${s.boarding}</span><div class="row" style="margin-top:6px">${pill(s.status,s.status==='Active'?'ok':'warn')}${S.dorms.find(d=>d.id===s.dorm)?pill(S.dorms.find(d=>d.id===s.dorm).name,'info'):''}</div></span></div></div>
  <div class="kpis">${kpi('Fees balance',b>0?ugx(b):'Cleared',b>0?'Term '+S.school.term+' outstanding':'Nothing to pay')}${kpi('Attendance',at.rate==null?'—':at.rate+'%','last '+at.m.length+' school days')}${last?kpi('Latest average',last.row.avg.toFixed(1),esc(last.ex.name)):kpi('Latest average','—','no released results yet')}${last?kpi('Class position',last.row.pos+' / '+last.of,esc(last.c.name)):''}${kpi('Books on loan',loans.length,loans.filter(l=>l.due<TODAY).length+' overdue')}</div>
  <div class="grid g2"><div class="card"><h3>Report cards <button class="btn sm" data-a="nav" data-id="p_results">All</button></h3>${rows.length?table([{h:'Exam',f:x=>esc(x.ex.name+' · Term '+x.ex.term+', '+x.ex.year)},{h:'Class',f:x=>esc(x.c.name)},{h:'Average',m:1,r:1,f:x=>x.row.avg.toFixed(1)},{h:'',r:1,f:x=>`<button class="btn sm pri" data-a="portalCard" data-id="${s.id}" data-ex="${x.ex.id}">Open</button>`}],rows.slice(-3).reverse()):empty('Report cards appear here once the Examination Office releases them.')}</div>
  <div class="stack"><div class="card"><h3>Notices</h3><div class="list">${S.notices.slice(0,3).map(n=>`<div><span><b>${esc(n.title)}</b><br><span class="muted sm">${esc(n.body)}</span><br><span class="xs muted">${fdate(n.date)}</span></span></div>`).join('')||empty('No notices.')}</div></div>
  <div class="card"><h3>Coming up</h3><div class="list">${up.map(e=>`<div><span><b>${esc(e.title)}</b><br><span class="muted sm">${fdate(e.date)}</span></span></div>`).join('')||empty('Nothing scheduled.')}</div></div></div></div>`};
PAGES.p_info=()=>{const s=portalKid();if(!s)return noKid();const c=cls(s.classId),dm=S.dorms.find(d=>d.id===s.dorm);
  return ph('My information',esc(sname(s)))+kidBar()+`<div class="grid g2"><div class="card"><div class="person" style="gap:14px;margin-bottom:12px">${avS(s,'lg')}<span><h2 style="font-size:20px">${esc(sname(s))}</h2><span class="muted">${esc(s.adm)}</span></span></div><dl class="dl"><dt>Admission number</dt><dd class="mono">${esc(s.adm)}</dd><dt>Date of birth</dt><dd>${fdate(s.dob)}${s.dob?' · '+ageOf(s.dob)+' years':''}</dd><dt>Sex</dt><dd>${s.sex==='M'?'Male':'Female'}</dd><dt>Class</dt><dd>${esc(c.name)}</dd><dt>Day or boarding</dt><dd>${esc(s.boarding)}</dd><dt>Dormitory</dt><dd>${esc(dm?dm.name:'—')}</dd><dt>Home area</dt><dd>${esc(s.address||'—')}</dd></dl></div>
  <div class="card"><h3>Admission</h3><dl class="dl"><dt>Previous school</dt><dd>${esc(s.prevSchool||'—')}</dd><dt>Date of application</dt><dd>${fdate(s.appliedOn)}</dd><dt>Date admitted</dt><dd>${fdate(s.admittedOn)}</dd><dt>Status</dt><dd>${esc(s.status)}</dd></dl><h3 style="margin-top:16px">Parent or guardian</h3><dl class="dl"><dt>Name</dt><dd>${esc(s.guardian.name)}</dd><dt>Relationship</dt><dd>${esc(s.guardian.rel)}</dd><dt>Phone</dt><dd class="mono">${esc(s.guardian.phone)}</dd></dl><p class="muted xs" style="margin-top:12px">If anything here is wrong, please tell the school registrar. Only the Registrar can change these details.</p></div></div>`};
/* subjects for a chosen term: this term from the class subject list, earlier terms from the exams the learner sat */
PAGES.p_subjects=()=>{const s=portalKid();if(!s)return noKid();
  const cur=S.school.year+'-'+S.school.term,seen=new Map();seen.set(cur,{k:cur,l:`Term ${S.school.term}, ${S.school.year} (current)`});
  S.exams.filter(e=>(S.marks[e.id]||{})[s.id]).forEach(e=>{const k=e.year+'-'+e.term;if(!seen.has(k))seen.set(k,{k,l:`Term ${e.term}, ${e.year}`})});
  const list=[...seen.values()].sort((a,b)=>b.k.localeCompare(a.k)),sel=seen.has(ui.f.term)?ui.f.term:cur;
  let rows=[];
  if(sel===cur)rows=subjRows(s.classId).map(a=>({name:a.name,cls:cls(s.classId).name,teacher:tch(a.teacherId)?.name||'—'}));
  else{const m=new Map();S.exams.filter(e=>e.year+'-'+e.term===sel&&(S.marks[e.id]||{})[s.id]).forEach(e=>{const cid=placeOf(e.id,s);Object.keys(S.marks[e.id][s.id]).forEach(n=>{if(!m.has(n))m.set(n,{name:n,cls:cls(cid)?.name||'',teacher:teacherFor(cid,n)?.name||'—'})})});rows=[...m.values()]}
  return ph('Subjects',esc(sname(s)))+kidBar()+`<div class="tools"><label class="muted sm" for="termsel">Term</label><select id="termsel" data-c="flt" data-k="term">${opts(list.map(t=>[t.k,t.l]),sel)}</select></div>`+table([{h:'Subject',f:r=>`<b>${esc(r.name)}</b>`},{h:'Class',f:r=>esc(r.cls)},{h:'Teacher',f:r=>esc(r.teacher)}],rows,{empty:'No subjects recorded for this term.'})};
PAGES.p_results=()=>{const s=portalKid();if(!s)return noKid();const rows=pubRows(s).reverse();
  return ph('Report cards',esc(sname(s)))+kidBar()+(rows.length?table([{h:'Exam',f:x=>`<b>${esc(x.ex.name)}</b><br><span class="muted sm">Term ${x.ex.term}, ${x.ex.year}</span>`},{h:'Class',f:x=>esc(x.c.name)},{h:'Average',m:1,r:1,f:x=>x.row.avg.toFixed(1)},{h:'Grade',f:x=>{const g=grade(x.row.avg,x.c.level);return pill(g.g,gKind(g.g))}},{h:'Position',m:1,r:1,f:x=>x.row.pos+' of '+x.of},{h:'',r:1,f:x=>`<button class="btn sm pri" data-a="portalCard" data-id="${s.id}" data-ex="${x.ex.id}">View, print</button>`}],rows):`<div class="card">${empty('No report card has been released yet. The Examination Office releases them after marking is complete. Earlier cards, including those of previous classes, stay here.')}</div>`)};
A.portalCard=d=>{if(!PORTAL())return;const s=kidsOf(ui.user).find(k=>k.id===d.id),ex=S.exams.find(e=>e.id===d.ex);if(!s||!ex||!ex.published)return;
  openModal('Report card · '+sname(s),`<div class="rc">${rcInner(s,ex.id,false)}</div>`,{wide:1,foot:`<button class="btn" data-a="closeModal">Close</button><button class="btn" data-a="rcDownload" data-id="${s.id}" data-ex="${ex.id}">${ic('download')} Download</button><button class="btn pri" data-a="rcPrint" data-id="${s.id}" data-ex="${ex.id}">Print</button>`})};
PAGES.p_fees=()=>{const s=portalKid();if(!s)return noKid();const b=balOf(s),pays=S.payments.filter(p=>p.studentId===s.id).sort((a,b)=>b.date.localeCompare(a.date)),prns=S.prn.filter(r=>r.studentId===s.id).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  return ph('Fees & PRN',esc(sname(s))+' · Term '+S.school.term+', '+S.school.year)+kidBar()+`<div class="grid g2"><div class="card"><h3>Statement</h3><dl class="dl"><dt>Term fees</dt><dd class="mono">${ugx(feeFor(s))}</dd><dt>Arrears</dt><dd class="mono">${ugx(s.arrears)}</dd><dt>Bursary</dt><dd class="mono">− ${ugx(s.bursary)}</dd><dt>Paid so far</dt><dd class="mono">${ugx(paidBy(s))}</dd><dt>Balance</dt><dd class="mono"><b style="color:${b>0?'var(--bad)':'var(--ok)'}">${b>0?ugx(b):'Cleared'}</b></dd></dl><div class="bar" style="margin:14px 0"><i style="width:${Math.min(100,pct(paidBy(s),billed(s)))}%"></i></div>${S.school.payInfo?`<div class="banner" style="margin:0"><span><b>How to pay.</b> ${esc(S.school.payInfo)}</span></div>`:''}
  <div class="row" style="margin-top:14px"><button class="btn pri" data-a="prnNew" data-id="${s.id}">Generate a PRN</button><button class="btn" data-a="paySubmit" data-id="${s.id}">I have paid, tell the bursar</button></div><p class="muted xs" style="margin-top:8px">A PRN (payment reference number) identifies you when you pay by bank or mobile money. After paying, tell the bursar here. The bursar approves it and your receipt appears in the list.</p></div>
  <div class="stack"><div class="card"><h3>My PRNs</h3>${prns.length?table([{h:'PRN',m:1,f:r=>`<b>${esc(r.prn)}</b>`},{h:'Amount',m:1,r:1,f:r=>r.amount?fmt(r.amount):'Any'},{h:'Created',f:r=>fdate(String(r.at).slice(0,10))}],prns):empty('No PRN yet.')}</div>
  <div class="card"><h3>Payments</h3>${pays.length?table([{h:'Date',f:p=>fdate(p.date)},{h:'Method',f:p=>esc(p.method)+(p.ref?`<br><span class="muted xs">${esc(p.ref)}</span>`:'')},{h:'Amount (UGX)',m:1,r:1,f:p=>fmt(p.amount)},{h:'Status',f:p=>payStatus(p)},{h:'',r:1,f:p=>p.status==='Approved'?`<button class="btn sm" data-a="receipt" data-id="${p.id}">Receipt</button>`:''}],pays):empty('No payments yet.')}</div></div></div>`};
A.prnNew=d=>{openForm('Generate a PRN',[{k:'amount',label:'Amount you plan to pay (UGX, optional)',type:'number',min:0,step:1000}],{},async v=>{try{const r=await api('POST','/api/portal/prn',{studentId:d.id,amount:+v.amount||0});await pullNow(true);toast('Your PRN is '+r.prn.prn)}catch(e){toast(e.message)}},{save:'Generate'})};
A.paySubmit=d=>{const prns=S.prn.filter(r=>r.studentId===d.id);openForm('Tell the bursar about your payment',[{k:'amount',label:'Amount paid (UGX)',type:'number',req:1,min:1},{k:'date',label:'Date paid',type:'date',def:TODAY,req:1},{k:'method',label:'Method',type:'select',opts:opts(METHODS)},{k:'ref',label:'Transaction or bank slip reference',req:1,full:1},{k:'prn',label:'PRN used',type:'select',full:1,opts:`<option value="">None</option>${opts(prns.map(r=>[r.prn,r.prn]))}`}],{date:TODAY},async v=>{try{await api('POST','/api/portal/payment',{studentId:d.id,amount:+v.amount,date:v.date,method:v.method,ref:v.ref,prn:v.prn});await pullNow(true);toast('Sent. The bursar will confirm it and your receipt will appear here.')}catch(e){toast(e.message)}},{save:'Send to bursar'})};
PAGES.p_att=()=>{const s=portalKid();if(!s)return noKid();const at=attStats(s),abs=at.m.filter(x=>x.v!=='P');
  return ph('Attendance',esc(sname(s)))+kidBar()+`<div class="kpis">${kpi('Attendance',at.rate==null?'—':at.rate+'%','last '+at.m.length+' school days')}${kpi('Absences',at.m.filter(x=>x.v==='A').length,'')}${kpi('Late arrivals',at.m.filter(x=>x.v==='L').length,'')}</div><div class="card"><h3>Recent days</h3><div class="row" style="gap:4px;margin-bottom:14px">${at.m.map(x=>`<span title="${fdate(x.d)}: ${x.v==='P'?'Present':x.v==='L'?'Late':'Absent'}" style="width:18px;height:28px;border-radius:4px;background:${x.v==='P'?'var(--ok)':x.v==='L'?'var(--warn)':'var(--bad)'}"></span>`).join('')}</div>${abs.length?`<div class="list">${abs.map(x=>`<div><span>${fdate(x.d)}</span>${pill(x.v==='A'?'Absent':'Late',x.v==='A'?'bad':'warn')}</div>`).join('')}</div>`:'<p class="muted">No absences or late arrivals in this period.</p>'}</div>`};
PAGES.p_tt=()=>{const s=portalKid();if(!s)return noKid();const exs=S.exams.filter(e=>S.examtt.some(r=>r.examId===e.id&&r.classId===s.classId)).sort((a,b)=>(b.year-a.year)||(b.term-a.term));
  return ph('Timetables',esc(cls(s.classId).name))+kidBar()+`<h3 style="margin:6px 0 10px">Lesson timetable</h3>${ttGrid(s.classId,false)}<h3 style="margin:22px 0 10px">Examination timetable</h3>${exs.length?exs.map(e=>`<div class="card" style="margin-bottom:12px"><h3>${esc(e.name)} · Term ${e.term}, ${e.year}</h3>${examTTList(e.id,s.classId)}</div>`).join(''):`<div class="card">${empty('No examination timetable has been published for this class yet.')}</div>`}`};
PAGES.p_welfare=()=>{const s=portalKid();if(!s)return noKid();const d=S.discipline.filter(x=>x.studentId===s.id).sort((a,b)=>b.date.localeCompare(a.date)),k=S.sickbay.filter(x=>x.studentId===s.id).sort((a,b)=>b.date.localeCompare(a.date)),l=S.loans.filter(x=>x.studentId===s.id).sort((a,b)=>b.out.localeCompare(a.out)),dm=S.dorms.find(x=>x.id===s.dorm);
  return ph('Welfare & health',esc(sname(s))+' · view only')+kidBar()+`<div class="grid g2"><div class="card"><h3>Discipline</h3>${d.length?table([{h:'Date',f:x=>fdate(x.date)},{h:'Issue',f:x=>esc(x.type)+(x.desc?`<br><span class="muted sm">${esc(x.desc)}</span>`:'')},{h:'Action taken',f:x=>esc(x.action)},{h:'Status',f:x=>pill(x.status,x.status==='Open'?'warn':'ok')}],d):empty('No discipline cases recorded.')}</div>
  <div class="card"><h3>Sick bay</h3>${k.length?table([{h:'Date',f:x=>fdate(x.date)},{h:'Complaint',f:x=>esc(x.complaint)},{h:'Treatment',f:x=>esc(x.treatment)},{h:'Outcome',f:x=>esc(x.outcome)}],k):empty('No sick bay visits.')}</div>
  <div class="card"><h3>Boarding</h3><dl class="dl"><dt>Status</dt><dd>${esc(s.boarding)}</dd><dt>Dormitory</dt><dd>${esc(dm?dm.name:'—')}</dd></dl></div>
  <div class="card"><h3>Library</h3>${l.length?table([{h:'Book',f:x=>`<b>${esc(S.books.find(b=>b.id===x.bookId)?.title||'Book')}</b>`},{h:'Due',f:x=>fdate(x.due)},{h:'Status',f:x=>x.returned?pill('Returned','ok'):x.due<TODAY?pill('Overdue','bad'):pill('On loan','info')}],l):empty('No books borrowed.')}</div></div>`};
PAGES.p_news=()=>ph('Notices & calendar',esc(S.school.name))+`<div class="grid g2"><div class="card"><h3>Notice board</h3><div class="list">${S.notices.map(n=>`<div><span><b>${esc(n.title)}</b><br><span class="muted sm">${esc(n.body)}</span><br><span class="xs muted">${fdate(n.date)} · ${esc(n.by)}</span></span></div>`).join('')||empty('No notices.')}</div></div><div class="card"><h3>Upcoming events</h3><div class="list">${S.events.filter(e=>e.date>=TODAY).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,10).map(e=>`<div><span><b>${esc(e.title)}</b><br><span class="muted sm">${fdate(e.date)}${e.details?' · '+esc(e.details):''}</span></span></div>`).join('')||empty('Nothing scheduled.')}</div></div></div>`;

/* ===== Server connection ===== */
let SEQ=0,EPOCH=0,SH=new Map(),syncing=false,dirty=false,pollT=null,pollBusy=false,retryT=null,VERSION='2.0';
const ROWC=['students','staff','classes','dorms','applicants','exams','payments','expenses','books','loans','discipline','sickbay','events','notices','messages'];
const DOCC=['subjects','ttcfg','examtt','examcfg','hr','staffatt','misconduct','leaves','rollcall','placements','inbox','prn','papers'];
const SERVER_ONLY=new Set(['messages','placements','inbox','prn','papers']);   /* written by the server only; never sent back */
const COLLA=[...ROWC,...DOCC];
const NEWEST=new Set(['applicants','discipline','expenses','loans','messages','notices','payments','sickbay']);
const shell=()=>{const o={v:2,sample:false,school:blankSchool(),attendance:{},marks:{},comments:{},tt:{},fees:{structure:{}},audit:[],users:[],ranks:{},sms:{provider:'none'},backups:null,userCount:0};COLLA.forEach(c=>o[c]=[]);return o};
function setOnline(ok){const c=$('#conn');if(!c)return;c.hidden=ok;if(!ok)c.textContent='Cannot reach the WalEduc server. Your changes will be saved as soon as the connection returns.'}
async function api(method,url,body,raw){
  let r;
  try{r=await fetch(url,{method,credentials:'same-origin',headers:{'X-Requested-With':'WalEduc',...(body!==undefined&&!raw?{'Content-Type':'application/json'}:{})},body:body===undefined?undefined:(raw?body:JSON.stringify(body))})}
  catch(e){setOnline(false);throw Object.assign(new Error('Cannot reach the WalEduc server. Check the network connection.'),{net:true})}
  setOnline(true);
  let j=null;try{j=await r.json()}catch(e){}
  if(!r.ok){const err=Object.assign(new Error((j&&j.error)||'The request failed ('+r.status+').'),{status:r.status,code:j&&j.code});
    if(r.status===401&&j&&j.code==='auth'&&ui.user)sessionLost();
    throw err}
  return j||{};
}
function strip(c,r){
  if(c==='students'||c==='staff'){const o={...r};delete o._mine;if(typeof o.photo!=='string'||!o.photo.startsWith('data:'))delete o.photo;return o}
  if(c==='school'){const o={...r};delete o.badge;delete o.hasBadge;delete o.updated;if(typeof r.badge==='string'&&r.badge.startsWith('data:'))o.badge=r.badge;return o}
  return r}
function flat(st){const m=new Map(),add=(c,id,v)=>m.set(c+'\u0001'+id,JSON.stringify(v));
  COLLA.forEach(c=>{if(!SERVER_ONLY.has(c))(st[c]||[]).forEach(r=>add(c,r.id,strip(c,r)))});
  add('school','main',strip('school',st.school));add('fees','main',{structure:st.fees.structure||{}});
  for(const d in st.attendance)for(const s in st.attendance[d])add('attendance',d+'|'+s,st.attendance[d][s]);
  for(const e in st.marks)for(const s in st.marks[e])for(const sub in st.marks[e][s])add('marks',e+'|'+s+'|'+sub,st.marks[e][s][sub]);
  for(const k in st.comments){const c=st.comments[k];add('comments',k,{ct:c.ct||'',ht:c.ht||''})}
  for(const c in st.tt)for(const d in st.tt[c])add('tt',c+'|'+d,st.tt[c][d]);
  return m}
function diff(){const cur=flat(S),ops=[];
  for(const [k,v] of cur)if(SH.get(k)!==v){const i=k.indexOf('\u0001');ops.push([k.slice(0,i),k.slice(i+1),JSON.parse(v)])}
  for(const k of SH.keys())if(!cur.has(k)){const i=k.indexOf('\u0001');ops.push([k.slice(0,i),k.slice(i+1),null])}
  return{ops,cur}}
async function flush(){
  clearTimeout(retryT);
  if(!ui.user||PORTAL())return;
  if(syncing){dirty=true;return}
  const {ops,cur}=diff(),notes=NOTES.splice(0);
  if(!ops.length&&!notes.length)return;
  syncing=true;
  try{
    const r=await api('POST','/api/sync',{ops,notes});
    SH=cur;
    const bad=r.results||[];
    for(const [c,id,d] of (r.rows||[]))applyRemote(c,id,d);
    if(bad.length){toast(bad[0][1]);await reloadAll()}
    else if((r.rows||[]).length)softRender();
  }catch(e){
    NOTES.unshift(...notes);
    if(e.net)retryT=setTimeout(flush,5000);else{toast(e.message);await reloadAll().catch(()=>{})}
  }finally{syncing=false;if(dirty){dirty=false;setTimeout(flush,50)}}
}
function applyRemote(c,id,d){
  const k=c+'\u0001'+id,track=!SERVER_ONLY.has(c);
  if(c==='school'){S.school={...S.school,...d};SH.set(k,JSON.stringify(strip('school',S.school)));return}
  if(c==='fees'){S.fees=d;SH.set(k,JSON.stringify({structure:d.structure||{}}));return}
  if(c==='sms'){S.sms=d;return}
  if(COLLA.includes(c)){const a=S[c],i=a.findIndex(x=>x.id===id);
    if(d===null){if(i>=0)a.splice(i,1);SH.delete(k);return}
    d={...d,id:d.id||id};
    if(i>=0)a[i]=d;else if(NEWEST.has(c))a.unshift(d);else a.push(d);
    if(track)SH.set(k,JSON.stringify(strip(c,d)));return}
  const p=id.split('|');
  if(c==='attendance'){if(d===null){if(S.attendance[p[0]])delete S.attendance[p[0]][p[1]]}else(S.attendance[p[0]]=S.attendance[p[0]]||{})[p[1]]=d}
  else if(c==='marks'){if(d===null){if(S.marks[p[0]]&&S.marks[p[0]][p[1]])delete S.marks[p[0]][p[1]][p[2]]}else{S.marks[p[0]]=S.marks[p[0]]||{};S.marks[p[0]][p[1]]=S.marks[p[0]][p[1]]||{};S.marks[p[0]][p[1]][p[2]]=d}}
  else if(c==='comments'){if(d===null)delete S.comments[id];else S.comments[id]=d}
  else if(c==='tt'){if(d!==null){S.tt[p[0]]=S.tt[p[0]]||{};S.tt[p[0]][p[1]]=d}}
  else return;
  if(d===null)SH.delete(k);else SH.set(k,JSON.stringify(d));
}
function loadData(b){
  const st=shell(),D=b.data||{};
  for(const c of COLLA)if(D[c])st[c]=D[c].map(x=>({...x[1],id:x[1].id||x[0]}));
  if(D.school&&D.school[0])st.school={...st.school,...D.school[0][1]};
  if(D.fees&&D.fees[0])st.fees={structure:{},...D.fees[0][1]};
  if(D.sms&&D.sms[0])st.sms=D.sms[0][1];
  (D.attendance||[]).forEach(([id,m])=>{const p=id.split('|');(st.attendance[p[0]]=st.attendance[p[0]]||{})[p[1]]=m});
  (D.marks||[]).forEach(([id,v])=>{const p=id.split('|');st.marks[p[0]]=st.marks[p[0]]||{};st.marks[p[0]][p[1]]=st.marks[p[0]][p[1]]||{};st.marks[p[0]][p[1]][p[2]]=v});
  (D.comments||[]).forEach(([id,v])=>{st.comments[id]=v});
  (D.tt||[]).forEach(([id,v])=>{const p=id.split('|');st.tt[p[0]]=st.tt[p[0]]||{};st.tt[p[0]][p[1]]=v});
  for(const c of NEWEST)st[c].sort((a,b)=>String(b.date||b.out||'').localeCompare(String(a.date||a.out||'')));
  st.ranks=b.ranks||{};
  const m=b.meta||{};st.sample=!!m.sample;st.userCount=m.userCount||0;EPOCH=m.epoch||0;VERSION=m.version||VERSION;SEQ=b.seq||0;if(m.now)CLOCK=m.now-Date.now();
  S=st;SH=flat(S);
}
async function reloadAll(){const b=await api('GET','/api/bootstrap');loadData(b);ui.stale=false;render(true)}
function softRender(){
  if(ui.modal){ui.stale=true;return}
  const a=document.activeElement;
  if(a&&a!==document.body&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&$('#main').contains(a)){ui.stale=true;return}
  ui.stale=false;drawSide();drawMain(true)}
document.addEventListener('focusout',()=>{if(ui.stale)setTimeout(()=>{if(ui.stale)softRender()},250)});
async function poll(){
  if(!ui.user||pollBusy||document.hidden||syncing)return;
  pollBusy=true;
  try{
    if(PORTAL()){const r=await api('GET','/api/bootstrap?since='+SEQ);if(!r.unchanged){loadData(r);softRender()}return}
    const r=await api('GET','/api/changes?since='+SEQ+'&epoch='+EPOCH);
    if(r.reload){await reloadAll();return}
    let n=0;
    if(r.rows.length){const dk=new Set(diff().ops.map(o=>o[0]+'\u0001'+o[1]));
      for(const [c,id,d] of r.rows){if(dk.has(c+'\u0001'+id))continue;applyRemote(c,id,d);n++}}
    SEQ=r.seq;if(r.meta){S.sample=!!r.meta.sample;S.userCount=r.meta.userCount||0;if(r.meta.now)CLOCK=r.meta.now-Date.now()}
    if(n)softRender();
  }catch(e){}finally{pollBusy=false}
}
/* fetch changes right now (after the server did something on our behalf, such as sending a message or approving a PRN) */
async function pullNow(){await flush();pollBusy=false;await poll();softRender()}
const startPoll=()=>{stopPoll();pollT=setInterval(poll,PORTAL()?30000:6000)};
const stopPoll=()=>{clearInterval(pollT);pollT=null};
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ui.user)poll()});
window.addEventListener('beforeunload',e=>{if(ui.user&&!PORTAL()&&(diff().ops.length||syncing)){e.preventDefault();e.returnValue=''}});
/* ===== Session ===== */
const digits=s=>String(s||'').replace(/\D/g,'');
const pwErr=(p,u)=>p.length<8?'Use at least 8 characters.':!/[A-Za-z]/.test(p)||!/\d/.test(p)?'Use both letters and numbers.':u&&p.toLowerCase()===String(u).toLowerCase()?'The password must not be the same as the username.':'';
const kidsOf=u=>!u?[]:S.students.filter(s=>s._mine);
const portalKid=()=>{const k=kidsOf(ui.user);return k.find(s=>s.id===ui.f.child)||k[0]||null};
async function startSession(u){
  const b=await api('GET','/api/bootstrap');
  ui.user=u;ui.role=u.role;loadData(b);
  ui.f={};ui.tab={};ui.params={};ui.ld={};
  let saved=null;try{saved=JSON.parse(localStorage.getItem(UIKEY)||'{}').route}catch(e){}
  ui.route=PORTAL()?'p_home':(saved&&saved!=='student'&&allowed(saved)?saved:'dashboard');
  document.body.classList.remove('locked');$('#auth').innerHTML='';drawTop();render(false);bump();startPoll();
}
async function logout(msg){
  clearTimeout(idleT);stopPoll();
  if(ui.user){try{await flush()}catch(e){}try{await api('POST','/api/logout',{})}catch(e){}}
  ui.user=null;ui.role='admin';ui.modal=null;$('#modal').innerHTML='';$('#main').innerHTML='';$('#side').innerHTML='';
  S=shell();SH=new Map();drawAuth('login',msg||'');
}
function sessionLost(){clearTimeout(idleT);stopPoll();ui.user=null;ui.modal=null;$('#modal').innerHTML='';$('#main').innerHTML='';$('#side').innerHTML='';S=shell();SH=new Map();drawAuth('login','Your session has ended. Please sign in again.')}
let idleT;const bump=()=>{clearTimeout(idleT);if(ui.user)idleT=setTimeout(()=>logout('You were signed out after 20 minutes of inactivity.'),20*60*1000)};
['click','keydown','touchstart'].forEach(ev=>document.addEventListener(ev,bump,true));
A.logout=()=>logout('');

/* ===== Sign-in screens ===== */
function drawAuth(mode,msg='',extra){
  document.body.classList.add('locked');ui.authMode=mode;
  const pwf=(id,l,ac)=>`<div class="field"><label for="${id}">${l}</label><input id="${id}" name="${id}" type="password" autocomplete="${ac}" data-pw="1"></div>`;
  const show=`<label class="row sm" style="gap:6px"><input type="checkbox" data-a="showpw"> Show password</label>`;
  const head=`<div class="row" style="flex-wrap:nowrap;gap:14px;margin-bottom:18px">${badge(56)}<div><h1 style="font-size:24px">WalEduc</h1><div class="muted sm">${esc(S.school.name)}</div></div></div>`;
  let title,sub,fields,btn,links='';
  if(mode==='setup'){title='Set up WalEduc';sub='Create the administrator account. This account manages everything, including other accounts.';
    fields=`<div class="field"><label for="a_name">Your full name</label><input id="a_name" name="a_name" autocomplete="name"></div><div class="field"><label for="a_user">Username</label><input id="a_user" name="a_user" autocomplete="username" autocapitalize="none"></div>${pwf('a_pw','Password (8 or more characters, letters and numbers)','new-password')}${pwf('a_pw2','Confirm password','new-password')}${show}`;btn='Create administrator account'}
  else if(mode==='login'){title='Sign in';sub='Staff, parents, guardians and learners sign in here.';
    fields=`<div class="field"><label for="a_user">Username</label><input id="a_user" name="a_user" autocomplete="username" autocapitalize="none"><span class="muted xs">Parents use their phone number. Learners use their admission number.</span></div>${pwf('a_pw','Password','current-password')}${show}`;btn='Sign in';
    links=`<p class="sm muted" style="margin-top:14px">Forgot your password? Ask the school administrator to reset it. ${ui.recovery?`<button class="lnk" type="button" data-a="authMode" data-m="recover">Administrator recovery</button>`:''}</p>`}
  else if(mode==='force'){title='Choose a new password';sub=`Hello ${esc(extra.name)}. For your safety, replace the temporary password before you continue.`;
    fields=`${pwf('a_pw','New password (8 or more characters, letters and numbers)','new-password')}${pwf('a_pw2','Confirm new password','new-password')}${show}`;btn='Save and continue'}
  else if(mode==='recover'){title='Administrator recovery';sub='Enter the recovery code you saved when WalEduc was set up, then choose a new password.';
    fields=`<div class="field"><label for="a_code">Recovery code</label><input id="a_code" name="a_code" autocomplete="off" autocapitalize="characters" placeholder="XXXX-XXXX-XXXX-XXXX"></div>${pwf('a_pw','New password','new-password')}${pwf('a_pw2','Confirm new password','new-password')}${show}`;btn='Reset administrator password';
    links=`<p class="sm" style="margin-top:14px"><button class="lnk" type="button" data-a="authMode" data-m="login">Back to sign in</button></p>`}
  else if(mode==='code'){
    $('#auth').innerHTML=`<div class="authcard">${head}<h2>Save your recovery code</h2><p class="muted sm" style="margin-top:6px">If the administrator password is ever lost, this code is the only way back in. It is shown once. Write it down and keep it somewhere safe, away from the computer.</p><div class="code" aria-label="Recovery code">${esc(extra.code)}</div><button class="btn pri" style="width:100%;justify-content:center" data-a="codeDone">I have saved it, continue</button></div>`;return}
  else if(mode==='down'){
    $('#auth').innerHTML=`<div class="authcard">${head}<h2>Cannot reach the server</h2><p class="muted sm" style="margin:6px 0 16px">${esc(msg)}</p><button class="btn pri" style="width:100%;justify-content:center" data-a="retryBoot">Try again</button></div>`;return}
  $('#auth').innerHTML=`<div class="authcard">${head}<h2>${title}</h2><p class="muted sm" style="margin:6px 0 16px">${sub}</p><form id="authform" data-mode="${mode}" novalidate class="stack" style="gap:12px">${fields}<div id="autherr" class="sm" style="color:var(--bad);min-height:18px" role="alert">${esc(msg)}</div><button class="btn pri" type="submit" style="width:100%;justify-content:center">${btn}</button></form>${links}</div>`;
  ui.pending=extra||null;const f=$('#authform input');if(f)setTimeout(()=>f.focus(),30);
}
A.authMode=d=>drawAuth(d.m);
A.showpw=(d,el)=>{(el.form||document).querySelectorAll('input[data-pw]').forEach(i=>i.type=el.checked?'text':'password')};
A.codeDone=async()=>{try{await startSession(ui.tmpUser)}catch(e){drawAuth('login',e.message)}};
A.retryBoot=()=>boot();
const authErr=m=>{const e=$('#autherr');if(e)e.textContent=m};
async function authSubmit(f){
  const mode=f.dataset.mode,v=n=>(f.elements[n]?f.elements[n].value:'');
  const btn=f.querySelector('button[type=submit]');btn.disabled=true;
  try{
    if(mode==='setup'){
      const name=v('a_name').trim(),un=v('a_user').trim(),pw=v('a_pw');
      if(!name||!un){authErr('Enter your name and a username.');return}
      const pe=pwErr(pw,un);if(pe){authErr(pe);return}if(pw!==v('a_pw2')){authErr('The two passwords do not match.');return}
      const r=await api('POST','/api/setup',{name,username:un,password:pw});ui.tmpUser=r.me;ui.recovery=true;drawAuth('code','',{code:r.code});return}
    if(mode==='login'){
      const un=v('a_user').trim(),pw=v('a_pw');
      if(!un||!pw){authErr('Enter your username and password.');return}
      const r=await api('POST','/api/login',{username:un,password:pw});
      if(r.must){ui.tmpUser=r.me;ui.tmpPw=pw;drawAuth('force','',r.me);return}
      await startSession(r.me);return}
    if(mode==='force'){
      const pw=v('a_pw'),pe=pwErr(pw,ui.tmpUser.username);if(pe){authErr(pe);return}if(pw!==v('a_pw2')){authErr('The two passwords do not match.');return}
      await api('POST','/api/password',{current:ui.tmpPw,password:pw});ui.tmpPw=null;await startSession(ui.tmpUser);return}
    if(mode==='recover'){
      const code=v('a_code').trim().toUpperCase(),pw=v('a_pw'),pe=pwErr(pw,'');if(pe){authErr(pe);return}if(pw!==v('a_pw2')){authErr('The two passwords do not match.');return}
      const r=await api('POST','/api/recover',{code,password:pw});ui.tmpUser=r.me;drawAuth('code','',{code:r.code});return}
  }catch(e){authErr(e.message)}
  finally{if(document.body.contains(btn))btn.disabled=false}
}
document.addEventListener('submit',async e=>{const f=e.target;if(f.id==='authform'){e.preventDefault();await authSubmit(f)}else if(f.id==='pwform'){e.preventDefault();await pwSubmit(f)}});

/* ===== My account ===== */
const accountPage=()=>{const u=ui.user;return ph('My account',esc(u.name))+`<div class="grid g2"><div class="card"><h3>Your details</h3><dl class="dl"><dt>Name</dt><dd>${esc(u.name)}</dd><dt>Username</dt><dd class="mono">${esc(u.username)}</dd><dt>Role</dt><dd>${esc(ROLE_LABEL[u.role])}</dd><dt>Last sign-in</dt><dd>${u.last?new Date(u.last).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}):'—'}</dd></dl></div>
  <div class="card"><h3>Change password</h3><form id="pwform" class="stack" style="gap:12px" novalidate><div class="field"><label for="p_old">Current password</label><input id="p_old" name="p_old" type="password" autocomplete="current-password" data-pw="1"></div><div class="field"><label for="p_new">New password (8 or more characters, letters and numbers)</label><input id="p_new" name="p_new" type="password" autocomplete="new-password" data-pw="1"></div><div class="field"><label for="p_new2">Confirm new password</label><input id="p_new2" name="p_new2" type="password" autocomplete="new-password" data-pw="1"></div><label class="row sm" style="gap:6px"><input type="checkbox" data-a="showpw"> Show passwords</label><div id="pwerr" class="sm" style="color:var(--bad);min-height:18px" role="alert"></div><div><button class="btn pri" type="submit">Update password</button></div></form></div></div>`};
PAGES.account=PAGES.p_account=accountPage;
async function pwSubmit(f){const u=ui.user,e=$('#pwerr'),v=n=>f.elements[n].value;
  const pe=pwErr(v('p_new'),u.username);if(pe){e.textContent=pe;return}if(v('p_new')!==v('p_new2')){e.textContent='The two new passwords do not match.';return}
  try{await api('POST','/api/password',{current:v('p_old'),password:v('p_new')});f.reset();e.textContent='';toast('Password updated')}catch(x){e.textContent=x.message}}

/* ===== Settings: SMS and data ===== */
A.smsSave=()=>{const g=id=>$('#'+id);api('POST','/api/sms/config',{provider:g('sms_p').value,username:g('sms_u').value,sender:g('sms_s').value,apiKey:g('sms_k').value,sandbox:g('sms_sb').checked}).then(r=>{S.sms=r.sms;toast('SMS settings saved');drawMain()}).catch(e=>toast(e.message))};
A.backupNow=()=>api('POST','/api/backups',{}).then(()=>{toast('Backup saved on the server');loadBackups(true)}).catch(e=>toast(e.message));
const opsOf=st=>[...flat(st)].map(([k,v])=>{const i=k.indexOf('\u0001');return[k.slice(0,i),k.slice(i+1),JSON.parse(v)]});
A.wipe=()=>confirmBox('Clear every learner, staff member, mark, payment and record? Your school details, classes and fee structure stay. This cannot be undone.',()=>{
  flush().then(()=>api('POST','/api/wipe',{confirm:'WIPE'})).then(()=>{ui.f={};ui.params={};return reloadAll()}).then(()=>toast('Records cleared. WalEduc is ready for your real data.')).catch(e=>toast(e.message))},'Clear all records');
A.reseed=()=>confirmBox('Replace everything with fresh sample data? This is for trying WalEduc out.',()=>{
  const st=seedState();st.school.badge=null;
  toast('Loading sample data…');flush().then(()=>api('POST','/api/import',{ops:opsOf(st),sample:true})).then(()=>{ui.f={};return reloadAll()}).then(()=>toast('Sample data loaded')).catch(e=>toast(e.message))},'Load sample data');
CH.badgeFile=(v,d,el)=>{const f=el.files&&el.files[0];el.value='';if(!f)return;if(f.size>6e6){toast('Choose an image under 6 MB');return}
  const rd=new FileReader();rd.onload=()=>{const im=new Image();im.onload=()=>{const w=im.width||320,h=im.height||320,m=Math.min(1,320/Math.max(w,h)),cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(w*m));cv.height=Math.max(1,Math.round(h*m));cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);
    cv.toBlob(b=>api('POST','/api/badge',b,true).then(r=>{S.school.badge=r.url;toast('Badge updated');render(true)}).catch(e=>toast(e.message)),'image/png')};im.onerror=()=>toast('That image could not be read');im.src=rd.result};rd.readAsDataURL(f)};
A.badgeReset=()=>api('DELETE','/api/badge').then(()=>{S.school.badge=null;render(true)}).catch(e=>toast(e.message));

/* ===== Boot ===== */
async function boot(){
  applyTheme();
  try{
    const s=await api('GET','/api/session');ui.recovery=s.recovery;VERSION=s.version||VERSION;
    S.school.name=s.school.name;if(s.school.hasBadge)S.school.badge='/badge';
    if(s.state==='ok'&&s.must){await api('POST','/api/logout',{});drawAuth('login','Please sign in again to choose your new password.');return}
    if(s.state==='ok'){await startSession(s.me);return}
    drawAuth(s.state==='setup'?'setup':'login');
  }catch(e){drawAuth('down',e.message)}
}
if(ui.route==='student')ui.route='dashboard';
boot();
})();
