const tg=window.Telegram?.WebApp;
const app=document.querySelector('#app');
const nav=document.querySelector('#bottom-nav');
const toast=document.querySelector('#toast');
const HKEY='la_journal',FKEY='la_favorites',PKEY='la_profile_prefs',NKEY='la_natal_profile';
const escX=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const parseX=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}};
const flashX=t=>{if(!toast)return;toast.textContent=t;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1700)};
const shellX=(title,sub,icon='☾')=>{app.innerHTML=`<main class="page"><header class="top"><div><div class="brandline">LUMEN ARCANA <span>BETA · PREMIUM</span></div><h1>${escX(title)}</h1>${sub?`<p>${escX(sub)}</p>`:''}</div><div class="seal">${icon}</div></header><div id="content"></div></main>`;return app.querySelector('#content')};
function activeNav(route){nav?.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.r===route))}
function uidX(){return crypto?.randomUUID?.()||`la_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`}
function legacyHistoryIdX(x,i){return `${x?.createdAt||''}|${x?.title||''}|${x?.question||''}|${i}`}
function normalizeHistory(){const h=parseX(HKEY,[]);if(!Array.isArray(h))return[];const f=parseX(FKEY,[]),mapped=new Map();let changed=false;for(let i=0;i<h.length;i++){const x=h[i]||{};if(!x.id){x.id=uidX();h[i]=x;changed=true}mapped.set(legacyHistoryIdX(x,i),x.id)}if(changed)localStorage.setItem(HKEY,JSON.stringify(h));if(Array.isArray(f)&&f.length){const next=[...new Set(f.map(id=>mapped.get(id)||id).filter(Boolean))];if(JSON.stringify(next)!==JSON.stringify(f))localStorage.setItem(FKEY,JSON.stringify(next))}return h}
normalizeHistory();

// ---------- Moon ----------
const SYN=29.530588853,EPOCH=Date.UTC(2000,0,6,18,14);
function lunarDataX(d=new Date()){const days=(d.getTime()-EPOCH)/86400000,p=((days/SYN)%1+1)%1,age=p*SYN,illum=(1-Math.cos(2*Math.PI*p))/2*100;let name='Новий Місяць',symbol='●',focus='Сформулюй один намір без поспіху.';if(p>=.03&&p<.22){name='Молодий Місяць';symbol='◔';focus='Нарощуй темп поступово.'}else if(p<.28&&p>=.22){name='Перша чверть';symbol='◐';focus='Перевір рішення дією.'}else if(p<.47&&p>=.28){name='Зростаючий Місяць';symbol='◕';focus='Розвивай уже розпочате.'}else if(p<.53&&p>=.47){name='Повня';symbol='○';focus='Підбий проміжний підсумок.'}else if(p<.72&&p>=.53){name='Спадний Місяць';symbol='◕';focus='Завершуй зайве.'}else if(p<.78&&p>=.72){name='Остання чверть';symbol='◐';focus='Переглянь результат.'}else if(p>=.78){name='Старий Місяць';symbol='◔';focus='Зменш темп і заверши незакрите.'}const next=t=>{let x=t-p;if(x<=.001)x+=1;return new Date(d.getTime()+x*SYN*86400000)};return{p,age,illum,name,symbol,focus,newM:next(0),first:next(.25),full:next(.5),last:next(.75)}}
const fmtX=d=>d.toLocaleDateString('uk-UA',{day:'2-digit',month:'long'});
function moonX(){activeNav('');const m=lunarDataX(),c=shellX('Місячний календар','Поточна фаза й орієнтовний місячний цикл');c.innerHTML=`<section class="hero-premium"><div class="hero-copy"><div class="badge">LUNAR · BETA</div><h2>${m.symbol} ${m.name}</h2><p>Вік циклу: <b>${m.age.toFixed(1)} дня</b> · освітленість: <b>${Math.round(m.illum)}%</b>.</p><div class="synthesis"><small>ФОКУС ФАЗИ</small><p>${m.focus}</p></div></div><div class="arcana-mark"><span>MOON</span><strong>${m.symbol}</strong><small>${Math.round(m.p*100)}% ЦИКЛУ</small></div></section><section class="settings-grid" style="margin-top:14px"><article><small>● НОВИЙ МІСЯЦЬ</small><h3>${fmtX(m.newM)}</h3><p>Початок нового синодичного циклу.</p></article><article><small>◐ ПЕРША ЧВЕРТЬ</small><h3>${fmtX(m.first)}</h3><p>Приблизно 25% місячного циклу.</p></article><article><small>○ ПОВНЯ</small><h3>${fmtX(m.full)}</h3><p>Приблизно 50% місячного циклу.</p></article><article><small>◐ ОСТАННЯ ЧВЕРТЬ</small><h3>${fmtX(m.last)}</h3><p>Приблизно 75% місячного циклу.</p></article></section><section class="day-card"><div><small>ТОЧНІСТЬ</small><h3>Астрономічне наближення</h3><p>Розрахунок базується на середній тривалості синодичного місяця 29,5306 дня. Для професійних ефемерид і точного часу фаз потрібен окремий астрономічний модуль.</p></div><div class="mini-card"><span>CYCLE</span><b>☾</b></div></section>`}

// ---------- History + Favorites ----------
function historyX(mode='history'){activeNav('journal');const h=normalizeHistory(),f=parseX(FKEY,[]),rows=mode==='favorites'?h.filter(x=>f.includes(x.id)):h,c=shellX('Історія','Збережені розклади та обране','✎');c.innerHTML=`<section class="premium-panel"><div class="panel-row"><div><div class="badge">PRIVATE · LOCAL</div><h2>${mode==='favorites'?'Обране':'Історія розкладів'}</h2></div><div class="hero-actions"><button class="${mode==='history'?'primary':'ghost'}" data-xtab="history">Історія</button><button class="${mode==='favorites'?'primary':'ghost'}" data-xtab="favorites">Обране</button></div></div></section>${rows.length?`<section class="journal-list" style="margin-top:14px">${rows.map(x=>`<article class="journal-item"><div style="display:flex;justify-content:space-between;gap:10px"><div><time>${escX(x.createdAt||'')}</time><h3>${escX(x.title||x.question||'Розклад')}</h3></div><button class="ghost" data-xfav="${x.id}" style="padding:8px 10px">${f.includes(x.id)?'★':'☆'}</button></div><p>${escX(x.question||'')}</p>${x.synthesis?`<div class="synthesis"><small>СИНТЕЗ</small><p>${escX(x.synthesis)}</p></div>`:''}<button class="ghost" data-xdel="${x.id}">Видалити</button></article>`).join('')}</section>`:`<section class="empty-state" style="margin-top:14px"><div>${mode==='favorites'?'☆':'✎'}</div><h2>${mode==='favorites'?'Обраного поки немає':'Історія поки порожня'}</h2></section>`}${h.length?`<section class="day-card"><div><small>КЕРУВАННЯ</small><h3>${h.length} збережених розкладів</h3><p>Очистить лише історію розкладів та обране на цьому пристрої.</p></div><button class="ghost" id="xClearHistory">Очистити історію</button></section>`:''}`}

// ---------- Profile ----------
function profileX(){activeNav('profile');const prefs=parseX(PKEY,{}),natal=parseX(NKEY,{}),h=normalizeHistory(),f=parseX(FKEY,[]),name=prefs.displayName||tg?.initDataUnsafe?.user?.first_name||'LUMEN user',mode=localStorage.getItem('la_mode')||'beginner',density=prefs.density||'comfortable',input='width:100%;background:#090909;color:#fff;border:1px solid #ffffff1c;border-radius:14px;padding:13px;outline:none',c=shellX('Профіль','Premium beta активовано автоматично.');c.innerHTML=`<section class="profile-card"><div class="avatar">☾</div><div><h2>${escX(name)}</h2><p>${tg?.initDataUnsafe?.user?'Telegram Mini App':'LUMEN ARCANA'}</p></div><span class="premium-chip">PREMIUM BETA</span></section><section class="settings-grid"><article><small>ДОСТУП</small><h3>Premium Beta</h3><p>Усі реалізовані функції відкриті без оплати протягом beta.</p></article><article><small>ІСТОРІЯ</small><h3>${h.length}</h3><p>Обране: ${f.length}. Дані зберігаються локально на цьому пристрої.</p></article><article><small>НАТАЛЬНІ ДАНІ</small><h3>${natal.date?escX(natal.date):'Не заповнено'}</h3><p>${escX(natal.place||'Місце народження ще не збережене.')}</p></article><article><small>БЕЗПЕКА</small><h3>Reflective only</h3><p>Без фатальних прогнозів і підміни медичних, юридичних чи фінансових рішень.</p></article></section><section class="quick-grid" style="margin-top:14px"><button id="profileNatal"><b>◎</b><span>Натальна карта<br><small>Редагувати дані</small></span></button><button id="profileHistory"><b>✎</b><span>Історія<br><small>Збережені розклади</small></span></button><button id="profileLibrary"><b>▤</b><span>Бібліотека<br><small>Матеріали та Академія</small></span></button><button id="profileHome"><b>◉</b><span>Головна<br><small>Повернутися сьогодні</small></span></button></section><section class="premium-panel" style="margin-top:14px"><div class="badge">НАЛАШТУВАННЯ</div><div class="settings-grid"><article><small>ІМ’Я</small><input id="xName" maxlength="40" value="${escX(name)}" style="${input}"></article><article><small>РЕЖИМ ТАРО</small><select id="xMode" style="${input}"><option value="beginner" ${mode==='beginner'?'selected':''}>Beginner</option><option value="pro" ${mode==='pro'?'selected':''}>Pro</option></select></article><article><small>ІНТЕРФЕЙС</small><select id="xDensity" style="${input}"><option value="comfortable" ${density==='comfortable'?'selected':''}>Комфортний</option><option value="compact" ${density==='compact'?'selected':''}>Компактний</option></select></article><article><small>AI</small><h3>Hybrid</h3><p>AI-тлумачення використовуються лише якщо серверний API підключено; інакше працює локальний fallback.</p></article></div><button class="primary wide" id="xSavePrefs">Зберегти</button></section><section class="day-card"><div><small>ЛОКАЛЬНІ ДАНІ</small><h3>Керування даними</h3><p>Очистить історію, обране, натальні дані й налаштування на цьому пристрої.</p></div><button class="ghost" id="xClear">Очистити</button></section>`}

// ---------- Natal ----------
const R=Math.PI/180,D=180/Math.PI,normX=x=>((x%360)+360)%360,sinX=x=>Math.sin(x*R),cosX=x=>Math.cos(x*R),atanX=(y,x)=>normX(Math.atan2(y,x)*D);
const Z=[['Овен','♈'],['Телець','♉'],['Близнюки','♊'],['Рак','♋'],['Лев','♌'],['Діва','♍'],['Терези','♎'],['Скорпіон','♏'],['Стрілець','♐'],['Козоріг','♑'],['Водолій','♒'],['Риби','♓']];
const PM={Sun:['Сонце','☉'],Moon:['Місяць','☽'],Mercury:['Меркурій','☿'],Venus:['Венера','♀'],Mars:['Марс','♂'],Jupiter:['Юпітер','♃'],Saturn:['Сатурн','♄'],Uranus:['Уран','♅'],Neptune:['Нептун','♆'],Pluto:['Плутон','♇']};
const ORB={Mercury:{N:[48.3313,3.24587e-5],i:[7.0047,5e-8],w:[29.1241,1.01444e-5],a:[.387098,0],e:[.205635,5.59e-10],M:[168.6562,4.0923344368]},Venus:{N:[76.6799,2.4659e-5],i:[3.3946,2.75e-8],w:[54.891,1.38374e-5],a:[.72333,0],e:[.006773,-1.302e-9],M:[48.0052,1.6021302244]},Mars:{N:[49.5574,2.11081e-5],i:[1.8497,-1.78e-8],w:[286.5016,2.92961e-5],a:[1.523688,0],e:[.093405,2.516e-9],M:[18.6021,.5240207766]},Jupiter:{N:[100.4542,2.76854e-5],i:[1.303,-1.557e-7],w:[273.8777,1.64505e-5],a:[5.20256,0],e:[.048498,4.469e-9],M:[19.895,.0830853001]},Saturn:{N:[113.6634,2.3898e-5],i:[2.4886,-1.081e-7],w:[339.3939,2.97661e-5],a:[9.55475,0],e:[.055546,-9.499e-9],M:[316.967,.0334442282]},Uranus:{N:[74.0005,1.3978e-5],i:[.7733,1.9e-8],w:[96.6612,3.0565e-5],a:[19.18171,-1.55e-8],e:[.047318,7.45e-9],M:[142.5905,.011725806]},Neptune:{N:[131.7806,3.0173e-5],i:[1.77,-2.55e-7],w:[272.8461,-6.027e-6],a:[30.05826,3.313e-8],e:[.008606,2.15e-9],M:[260.2471,.005995147]},Pluto:{N:[110.30347,0],i:[17.14175,0],w:[113.76329,0],a:[39.48168677,0],e:[.24880766,0],M:[14.53,.0039757]}};
function kp(M,e){let q=M+e*D*sinX(M)*(1+e*cosX(M));for(let i=0;i<5;i++)q=q-(q-e*D*sinX(q)-M)/(1-e*cosX(q));return q}
function orbitX(el,d){const N=normX(el.N[0]+el.N[1]*d),ii=el.i[0]+el.i[1]*d,w=normX(el.w[0]+el.w[1]*d),a=el.a[0]+el.a[1]*d,e=el.e[0]+el.e[1]*d,M=normX(el.M[0]+el.M[1]*d),E=kp(M,e),xv=a*(cosX(E)-e),yv=a*Math.sqrt(1-e*e)*sinX(E),v=atanX(yv,xv),rr=Math.hypot(xv,yv),vw=normX(v+w);return{x:rr*(cosX(N)*cosX(vw)-sinX(N)*sinX(vw)*cosX(ii)),y:rr*(sinX(N)*cosX(vw)+cosX(N)*sinX(vw)*cosX(ii)),r:rr}}
function sunX(jd){const T=(jd-2451545)/36525,L=normX(280.46646+36000.76983*T+.0003032*T*T),M=normX(357.52911+35999.05029*T-.0001537*T*T),C=(1.914602-.004817*T-.000014*T*T)*sinX(M)+(.019993-.000101*T)*sinX(2*M)+.000289*sinX(3*M);return normX(L+C)}
function moonLonX(jd){const T=(jd-2451545)/36525,L=normX(218.3164477+481267.88123421*T),DD=normX(297.8501921+445267.1114034*T),M=normX(357.5291092+35999.0502909*T),MP=normX(134.9633964+477198.8675055*T),F=normX(93.272095+483202.0175233*T);return normX(L+6.289*sinX(MP)+1.274*sinX(2*DD-MP)+.658*sinX(2*DD)+.214*sinX(2*MP)-.186*sinX(M)-.114*sinX(2*F))}
function planetsX(jd){const d=jd-2451543.5,s=sunX(jd),er=orbitX({N:[0,0],i:[0,0],w:[282.9404,4.70935e-5],a:[1,0],e:[.016709,-1.151e-9],M:[356.047,.9856002585]},d).r,xs=er*cosX(s),ys=er*sinX(s),o={Sun:s,Moon:moonLonX(jd)};for(const [k,e] of Object.entries(ORB)){const p=orbitX(e,d);o[k]=atanX(p.y+ys,p.x+xs)}return o}
function gmstX(jd){const T=(jd-2451545)/36525;return normX(280.46061837+360.98564736629*(jd-2451545)+.000387933*T*T-T*T*T/38710000)}
function ascendantX(jd,lat,lon){const theta=normX(gmstX(jd)+lon)*R,phi=lat*R,eps=(23.439291-.0130042*((jd-2451545)/36525))*R;return normX(Math.atan2(-Math.cos(theta),Math.sin(theta)*Math.cos(eps)+Math.tan(phi)*Math.sin(eps))*D)}
function aspectsX(pos){const keys=Object.keys(pos),defs=[['З’єднання',0,8],['Секстиль',60,5],['Квадрат',90,7],['Трин',120,7],['Опозиція',180,8]],rows=[];for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++){let d=Math.abs(pos[keys[i]]-pos[keys[j]]);if(d>180)d=360-d;for(const [name,target,orb] of defs)if(Math.abs(d-target)<=orb){rows.push({a:keys[i],b:keys[j],name,orb:Math.abs(d-target)});break}}return rows.sort((a,b)=>a.orb-b.orb).slice(0,12)}
function zpX(v){v=normX(v);const i=Math.floor(v/30);return{name:Z[i][0],glyph:Z[i][1],degree:v-i*30}}
function birthX(p){if(!p.date||!p.time||p.utcOffset===''||p.utcOffset==null)return null;const[y,m,d]=p.date.split('-').map(Number),[hh,mm]=p.time.split(':').map(Number),off=Number(p.utcOffset);if(!Number.isFinite(off))return null;return new Date(Date.UTC(y,m-1,d,hh-off,mm||0))}
function wheelX(pos,asc=null){const rot=asc==null?0:asc;let marks='',labels='';for(let i=0;i<12;i++){const a=(i*30-rot-90)*R,x=180+150*Math.cos(a),y=180+150*Math.sin(a),x2=180+126*Math.cos(a),y2=180+126*Math.sin(a),mid=(i*30+15-rot-90)*R;marks+=`<line x1="${x2}" y1="${y2}" x2="${x}" y2="${y}" stroke="#e5c87d55"/>`;labels+=`<text x="${180+138*Math.cos(mid)}" y="${180+138*Math.sin(mid)}" text-anchor="middle" dominant-baseline="middle" fill="#e5c87d" font-size="19">${Z[i][1]}</text>`}let ptxt='';Object.entries(pos).forEach(([k,v],i)=>{const a=(v-rot-90)*R,rr=105-(i%3)*10;ptxt+=`<text x="${180+rr*Math.cos(a)}" y="${180+rr*Math.sin(a)}" text-anchor="middle" dominant-baseline="middle" fill="#f8f3e9" font-size="17">${PM[k][1]}</text>`});return `<svg id="xNatalWheel" viewBox="0 0 360 360" aria-label="Натальне колесо" style="width:min(100%,520px);display:block;margin:auto"><circle cx="180" cy="180" r="150" fill="#0b0b0b" stroke="#e5c87d99"/><circle cx="180" cy="180" r="126" fill="none" stroke="#e5c87d44"/><circle cx="180" cy="180" r="92" fill="none" stroke="#ffffff18"/>${marks}${labels}${ptxt}${asc!=null?'<line x1="180" y1="180" x2="180" y2="28" stroke="#e5c87d" stroke-width="2"/><text x="180" y="20" text-anchor="middle" fill="#e5c87d" font-size="11">ASC</text>':''}</svg>`}
function mcX(jd,lon){const theta=normX(gmstX(jd)+lon)*R,eps=(23.439291-.0130042*((jd-2451545)/36525))*R;return normX(Math.atan2(Math.sin(theta)/Math.cos(eps),Math.cos(theta))*D)}
const classicPlanetColorX=k=>({Sun:'#e02020',Moon:'#1d4ed8',Mercury:'#159447',Venus:'#159447',Mars:'#e02020',Jupiter:'#e02020',Saturn:'#222',Uranus:'#159447',Neptune:'#1d4ed8',Pluto:'#1d4ed8'}[k]||'#111');

const HOUSE_SYSTEMS_X={equal:'Equal House',placidus:'Placidus'};
function equalHouseCuspsX(asc){return asc==null?[]:Array.from({length:12},(_,i)=>normX(asc+i*30))}
function placidusHouseCuspsX(jd,lat,lon,asc,mc){return null}
function resolveHouseSystemX(requested,jd,lat,lon,asc,mc){
  const system=requested==='placidus'?'placidus':'equal';
  if(asc==null)return{requested:system,used:system,cusps:[],fallback:false};
  if(system==='placidus'){
    const cusps=placidusHouseCuspsX(jd,lat,lon,asc,mc);
    if(Array.isArray(cusps)&&cusps.length===12)return{requested:'placidus',used:'placidus',cusps,fallback:false};
    return{requested:'placidus',used:'equal',cusps:equalHouseCuspsX(asc),fallback:true};
  }
  return{requested:'equal',used:'equal',cusps:equalHouseCuspsX(asc),fallback:false};
}
function houseSystemStatusX(meta){
  if(!meta)return'Equal House';
  if(meta.fallback)return'Placidus обрано · тимчасово Equal House';
  return HOUSE_SYSTEMS_X[meta.used]||'Equal House';
}
function natalHouseX(lon,cusps){if(!Number.isFinite(lon)||!Array.isArray(cusps)||cusps.length!==12)return'—';for(let i=0;i<12;i++){const start=normX(cusps[i]),end=normX(cusps[(i+1)%12]),span=normX(end-start),rel=normX(lon-start);if(rel<span||Math.abs(rel-span)<1e-9)return i+1}return'—'}
function degreeMinuteX(v){const z=zpX(v),deg=Math.floor(z.degree),min=Math.round((z.degree-deg)*60);return{z,deg:min===60?deg+1:deg,min:min===60?0:min}}
function classicPositionsTableX(pos,asc=null,mc=null,houseMeta=null){
  const cusps=houseMeta?.cusps||[];
  const rows=Object.entries(pos).map(([k,v])=>{const d=degreeMinuteX(v);return`<tr><td><span class="classic-obj">${PM[k][1]}</span> ${PM[k][0]}</td><td>${d.z.glyph} ${d.z.name}</td><td>${String(d.deg).padStart(2,'0')}°${String(d.min).padStart(2,'0')}′</td><td>${natalHouseX(v,cusps)}</td></tr>`}).join('');
  const angles=`${asc!=null?(()=>{const d=degreeMinuteX(asc);return`<tr class="classic-angle-row"><td><b>AC</b> Асцендент</td><td>${d.z.glyph} ${d.z.name}</td><td>${String(d.deg).padStart(2,'0')}°${String(d.min).padStart(2,'0')}′</td><td>1</td></tr>`})():''}${mc!=null?(()=>{const d=degreeMinuteX(mc);return`<tr class="classic-angle-row"><td><b>MC</b> Середина неба</td><td>${d.z.glyph} ${d.z.name}</td><td>${String(d.deg).padStart(2,'0')}°${String(d.min).padStart(2,'0')}′</td><td>—</td></tr>`})():''}`;
  return `<section class="classic-positions"><div class="classic-positions-head"><div><small>CLASSIC CHART</small><h3>Положення планет</h3></div><span>${houseSystemStatusX(houseMeta)}</span></div><div class="classic-table-wrap"><table class="classic-natal-table"><thead><tr><th>Об’єкт</th><th>Знак</th><th>Позиція</th><th>Дім</th></tr></thead><tbody>${rows}${angles}</tbody></table></div></section>`;
}

const CLASSIC_ASPECT_DEFS_X=[
  {name:'З’єднання',angle:0,orb:8,symbol:'☌',tone:'neutral'},
  {name:'Секстиль',angle:60,orb:5,symbol:'✶',tone:'blue'},
  {name:'Квадрат',angle:90,orb:7,symbol:'□',tone:'red'},
  {name:'Трин',angle:120,orb:7,symbol:'△',tone:'blue'},
  {name:'Опозиція',angle:180,orb:8,symbol:'☍',tone:'red'}
];
function classicAspectHitX(a,b){
  let delta=Math.abs(a-b);if(delta>180)delta=360-delta;
  for(const d of CLASSIC_ASPECT_DEFS_X){const orb=Math.abs(delta-d.angle);if(orb<=d.orb)return{...d,orb}}
  return null
}
function classicAspectMatrixX(pos){
  const keys=Object.keys(pos);
  const head=keys.map(k=>`<th title="${PM[k][0]}"><span class="classic-matrix-glyph">${PM[k][1]}</span></th>`).join('');
  const rows=keys.map((a,i)=>{
    const cells=keys.map((b,j)=>{
      if(j>=i)return`<td class="classic-matrix-empty">${i===j?'<span class="classic-matrix-diag">•</span>':''}</td>`;
      const hit=classicAspectHitX(pos[a],pos[b]);
      if(!hit)return'<td class="classic-matrix-none">·</td>';
      return`<td><span class="classic-aspect classic-aspect-${hit.tone}" title="${PM[a][0]} — ${PM[b][0]}: ${hit.name}, орбіс ${hit.orb.toFixed(1)}°">${hit.symbol}<small>${hit.orb.toFixed(1)}°</small></span></td>`;
    }).join('');
    return`<tr><th title="${PM[a][0]}"><span class="classic-matrix-glyph">${PM[a][1]}</span><small>${PM[a][0]}</small></th>${cells}</tr>`;
  }).join('');
  return`<section class="classic-aspect-matrix"><div class="classic-positions-head"><div><small>CLASSIC CHART</small><h3>Матриця аспектів</h3></div><span>☌ ✶ □ △ ☍</span></div><div class="classic-matrix-wrap"><table class="classic-matrix-table"><thead><tr><th></th>${head}</tr></thead><tbody>${rows}</tbody></table></div><div class="classic-matrix-legend"><span class="classic-aspect-blue">✶ △ гармонійні</span><span class="classic-aspect-red">□ ☍ напружені</span><span class="classic-aspect-neutral">☌ з’єднання</span></div></section>`;
}

function classicWheelX(pos,asc=null,mc=null,houses=[],houseMeta=null){
  const cx=360,cy=360,outer=330,zInner=278,planetR=246,houseR=190,aspectR=116,rot=asc==null?0:asc;
  const point=(lon,r)=>{const a=(180-(lon-rot))*R;return{x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)}};
  let ticks='',signBounds='',signLabels='',houseLines='',houseLabels='',planetMarks='',aspectLines='',axes='';
  for(let d=0;d<360;d++){
    const p1=point(d,outer),len=d%30===0?24:d%10===0?15:d%5===0?10:5,p2=point(d,outer-len);
    ticks+=`<line x1="${p1.x.toFixed(1)}" y1="${p1.y.toFixed(1)}" x2="${p2.x.toFixed(1)}" y2="${p2.y.toFixed(1)}" stroke="#111" stroke-width="${d%30===0?1.8:d%10===0?1.2:.65}"/>`;
  }
  for(let i=0;i<12;i++){
    const cusp=point(i*30,zInner),edge=point(i*30,outer),mid=point(i*30+15,304);
    signBounds+=`<line x1="${cusp.x.toFixed(1)}" y1="${cusp.y.toFixed(1)}" x2="${edge.x.toFixed(1)}" y2="${edge.y.toFixed(1)}" stroke="#111" stroke-width="1.6"/>`;
    signLabels+=`<text x="${mid.x.toFixed(1)}" y="${mid.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="25" font-family="serif" fill="#111">${Z[i][1]}</text>`;
  }
  if(asc!=null&&houses.length===12){
    houses.forEach((v,i)=>{
      const edge=point(v,zInner),isAngle=i===0||i===3||i===6||i===9;
      houseLines+=`<line x1="${cx}" y1="${cy}" x2="${edge.x.toFixed(1)}" y2="${edge.y.toFixed(1)}" stroke="#555" stroke-width="${isAngle?2.1:.9}"/>`;
      const mid=point(normX(v+15),houseR);
      houseLabels+=`<text x="${mid.x.toFixed(1)}" y="${mid.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="13" fill="#555">${i+1}</text>`;
    });
    const ascP=point(asc,outer),dcP=point(normX(asc+180),outer);
    axes+=`<line x1="${cx}" y1="${cy}" x2="${ascP.x.toFixed(1)}" y2="${ascP.y.toFixed(1)}" stroke="#111" stroke-width="3"/><line x1="${cx}" y1="${cy}" x2="${dcP.x.toFixed(1)}" y2="${dcP.y.toFixed(1)}" stroke="#111" stroke-width="3"/><text x="${(ascP.x+18).toFixed(1)}" y="${(ascP.y-8).toFixed(1)}" font-size="14" font-weight="700" fill="#111">AC</text><text x="${(dcP.x-36).toFixed(1)}" y="${(dcP.y-8).toFixed(1)}" font-size="14" font-weight="700" fill="#111">DC</text>`;
  }
  if(mc!=null){
    const mcP=point(mc,outer),icP=point(normX(mc+180),outer);
    axes+=`<line x1="${cx}" y1="${cy}" x2="${mcP.x.toFixed(1)}" y2="${mcP.y.toFixed(1)}" stroke="#333" stroke-width="3"/><line x1="${cx}" y1="${cy}" x2="${icP.x.toFixed(1)}" y2="${icP.y.toFixed(1)}" stroke="#333" stroke-width="3"/><text x="${(mcP.x+8).toFixed(1)}" y="${(mcP.y+18).toFixed(1)}" font-size="14" font-weight="700" fill="#111">MC</text><text x="${(icP.x+8).toFixed(1)}" y="${(icP.y-10).toFixed(1)}" font-size="14" font-weight="700" fill="#111">IC</text>`;
  }
  const defs=[['З’єднання',0,8],['Секстиль',60,5],['Квадрат',90,7],['Трин',120,7],['Опозиція',180,8]];
  const keys=Object.keys(pos);
  for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++){
    const a=keys[i],b=keys[j],va=pos[a],vb=pos[b];
    let delta=Math.abs(va-vb);if(delta>180)delta=360-delta;
    let hit=null;
    for(const [name,target,orb] of defs){if(Math.abs(delta-target)<=orb){hit={name,target};break}}
    if(!hit||hit.name==='З’єднання')continue;
    const p1=point(va,aspectR),p2=point(vb,aspectR);
    const harmonious=hit.name==='Секстиль'||hit.name==='Трин';
    const stroke=harmonious?'#1747ff':'#ef1717';
    const width=hit.name==='Опозиція'||hit.name==='Трин'?2.6:2;
    const dash=hit.name==='Секстиль'?'5 4':'none';
    aspectLines+=`<line x1="${p1.x.toFixed(1)}" y1="${p1.y.toFixed(1)}" x2="${p2.x.toFixed(1)}" y2="${p2.y.toFixed(1)}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" opacity=".92" ${dash!=='none'?`stroke-dasharray="${dash}"`:''}/>`;
  }
  const entries=Object.entries(pos).sort((a,b)=>a[1]-b[1]);
  entries.forEach(([k,v],i)=>{
    let track=planetR;
    const prev=entries[(i-1+entries.length)%entries.length],sep=prev?Math.min(normX(v-prev[1]),normX(prev[1]-v)):99;
    if(sep<6)track-=22*(i%3);
    const p=point(v,track),z=zpX(v),deg=Math.floor(z.degree),min=Math.round((z.degree-deg)*60);
    planetMarks+=`<g><text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="22" font-family="serif" font-weight="700" fill="${classicPlanetColorX(k)}">${PM[k][1]}</text><text x="${p.x.toFixed(1)}" y="${(p.y+16).toFixed(1)}" text-anchor="middle" font-size="9" fill="${classicPlanetColorX(k)}">${deg}°${String(min).padStart(2,'0')}′</text></g>`;
  });
  return `<div class="classic-chart-shell"><div class="classic-chart-meta"><strong>Classic Chart</strong><span>${houseSystemStatusX(houseMeta)} · low-precision local engine</span></div><svg id="xNatalWheel" class="classic-natal-svg" viewBox="0 0 720 720" role="img" aria-label="Класична натальна карта"><rect width="720" height="720" fill="#fff"/><circle cx="${cx}" cy="${cy}" r="${outer}" fill="#fff" stroke="#111" stroke-width="2.4"/><circle cx="${cx}" cy="${cy}" r="${zInner}" fill="none" stroke="#111" stroke-width="1.4"/><circle cx="${cx}" cy="${cy}" r="120" fill="#fff" stroke="#777" stroke-width="1"/>${ticks}${signBounds}${signLabels}${houseLines}${houseLabels}${aspectLines}${axes}${planetMarks}</svg></div>`;
}
function natalX(){activeNav('');const p=parseX(NKEY,{}),b=birthX(p),lat=Number(p.lat),lon=Number(p.lon),hasGeo=p.lat!==''&&p.lon!==''&&Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180,houseSystem=p.houseSystem==='placidus'?'placidus':'equal',view=localStorage.getItem('la_natal_view')==='classic'?'classic':'lumen',input='width:100%;background:#090909;color:#fff;border:1px solid #ffffff1c;border-radius:14px;padding:13px;outline:none',c=shellX('Натальна карта','Планети, Асцендент, будинки й аспекти · Premium Beta');let result='';if(b){const jd=b.getTime()/86400000+2440587.5,pos=planetsX(jd),asc=hasGeo?ascendantX(jd,lat,lon):null,mc=hasGeo?mcX(jd,lon):null,houseMeta=resolveHouseSystemX(houseSystem,jd,lat,lon,asc,mc),houses=houseMeta.cusps,asp=aspectsX(pos);result=`<section class="premium-panel" style="margin-top:14px"><div class="badge">NATAL ENGINE · BETA</div><h2>Натальне колесо</h2><p style="color:var(--muted)">Планетні довготи розраховані локально низькоточними астрономічними формулами. ${asc==null?'Для Асцендента й 12 будинків введи координати місця народження.':houseMeta.fallback?'Обрано Placidus, але точний Placidus engine ще не підключено — тимчасово використовується Equal House.':`Будинки: система ${houseSystemStatusX(houseMeta)}.`}</p><div class="natal-view-switch"><button class="${view==='lumen'?'primary':'ghost'}" id="xNatalLumen">LUMEN View</button><button class="${view==='classic'?'primary':'ghost'}" id="xNatalClassic">Classic Chart</button></div>${view==='classic'?classicWheelX(pos,asc,mc,houses,houseMeta)+classicPositionsTableX(pos,asc,mc,houseMeta)+classicAspectMatrixX(pos):wheelX(pos,asc)}<div class="result-actions"><button class="ghost" id="xPng">Зберегти PNG</button><button class="primary" id="xPrint">PDF / Друк</button></div></section><section class="settings-grid">${Object.entries(pos).map(([k,v])=>{const z=zpX(v);return `<article><small>${PM[k][1]} ${PM[k][0].toUpperCase()}</small><h3>${z.glyph} ${z.name}</h3><p>${z.degree.toFixed(1)}° у знаку · ${v.toFixed(1)}° екліптики</p></article>`}).join('')}</section>${asc!=null?`<section class="settings-grid" style="margin-top:14px"><article><small>ASC</small><h3>${zpX(asc).glyph} ${zpX(asc).name}</h3><p>${zpX(asc).degree.toFixed(1)}° · Асцендент</p></article>${houses.map((v,i)=>{const z=zpX(v);return `<article><small>ДІМ ${i+1}</small><h3>${z.glyph} ${z.name}</h3><p>${z.degree.toFixed(1)}° · ${houseSystemStatusX(houseMeta)}</p></article>`}).join('')}</section>`:''}<section class="premium-panel" style="margin-top:14px"><div class="badge">АСПЕКТИ</div><h2>Основні зв’язки</h2><div class="reading-cards">${asp.length?asp.map(a=>`<article><div class="card-no">${a.name.toUpperCase()}</div><h3>${PM[a.a][1]} ${PM[a.a][0]} — ${PM[a.b][1]} ${PM[a.b][0]}</h3><p>Орбіс ${a.orb.toFixed(1)}°</p></article>`).join(''):'<article><p>У межах заданих орбісів основні аспекти не знайдені.</p></article>'}</div></section>`}c.innerHTML=`<section class="premium-panel"><div class="badge">FULL NATAL · PREMIUM BETA</div><div class="settings-grid"><article><small>ДАТА</small><input id="xNDate" type="date" value="${escX(p.date||'')}" style="${input}"></article><article><small>ЧАС</small><input id="xNTime" type="time" value="${escX(p.time||'')}" style="${input}"></article><article><small>МІСЦЕ</small><input id="xNPlace" value="${escX(p.place||'')}" style="${input}"></article><article><small>UTC</small><input id="xNOffset" type="number" min="-12" max="14" step="0.5" value="${escX(p.utcOffset??'')}" placeholder="Наприклад 3" style="${input}"></article><article><small>ШИРОТА</small><input id="xNLat" type="number" min="-90" max="90" step="0.0001" value="${escX(p.lat??'')}" placeholder="50.95" style="${input}"></article><article><small>ДОВГОТА</small><input id="xNLon" type="number" min="-180" max="180" step="0.0001" value="${escX(p.lon??'')}" placeholder="28.64" style="${input}"></article><article><small>СИСТЕМА ДОМІВ</small><select id="xNHouseSystem" style="${input}"><option value="equal" ${houseSystem==='equal'?'selected':''}>Equal House</option><option value="placidus" ${houseSystem==='placidus'?'selected':''}>Placidus (підготовка)</option></select><p style="margin-top:8px;color:var(--muted);font-size:.78rem">Placidus збережеться як вибір, але до підключення точного engine використовується Equal House fallback.</p></article></div><button class="primary wide" id="xNCalc">Зберегти й побудувати</button></section>${result}`}
function exportPngX(svg){const xml=new XMLSerializer().serializeToString(svg),url=URL.createObjectURL(new Blob([xml],{type:'image/svg+xml'})),img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=c.height=1080;const x=c.getContext('2d');x.fillStyle='#080808';x.fillRect(0,0,1080,1080);x.drawImage(img,0,0,1080,1080);URL.revokeObjectURL(url);c.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='lumen-natal.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)})};img.src=url}

window.LUMEN_EXT_ROUTES={natal:natalX,journal:historyX,profile:profileX,moon:moonX};

// One delegated controller; no MutationObserver and no competing global handlers.
document.addEventListener('click',e=>{
  const el=e.target.closest?.('button,[data-go]');if(!el)return;
  if(el.id==='profileNatal'){e.preventDefault();window.LUMEN_NAVIGATE?.('natal');return}
  if(el.id==='profileHistory'){e.preventDefault();window.LUMEN_NAVIGATE?.('journal');return}
  if(el.id==='profileLibrary'){e.preventDefault();window.LUMEN_NAVIGATE?.('library');return}
  if(el.id==='profileHome'){e.preventDefault();window.LUMEN_NAVIGATE?.('home');return}
  if(el.dataset.xtab){e.preventDefault();historyX(el.dataset.xtab);return}
  if(el.dataset.xfav){e.preventDefault();const f=parseX(FKEY,[]),id=el.dataset.xfav,next=f.includes(id)?f.filter(x=>x!==id):[...f,id];localStorage.setItem(FKEY,JSON.stringify(next));historyX(app.querySelector('[data-xtab].primary')?.dataset.xtab||'history');return}
  if(el.dataset.xdel){e.preventDefault();const h=normalizeHistory().filter(x=>x.id!==el.dataset.xdel),f=parseX(FKEY,[]).filter(x=>x!==el.dataset.xdel);localStorage.setItem(HKEY,JSON.stringify(h));localStorage.setItem(FKEY,JSON.stringify(f));historyX();return}
  if(el.id==='xClearHistory'){e.preventDefault();if(confirm('Очистити всю історію розкладів та обране?')){localStorage.setItem(HKEY,'[]');localStorage.setItem(FKEY,'[]');historyX('history')}return}
  if(el.id==='xSavePrefs'){e.preventDefault();const prefs={displayName:document.querySelector('#xName').value.trim().slice(0,40),density:document.querySelector('#xDensity').value};localStorage.setItem(PKEY,JSON.stringify(prefs));localStorage.setItem('la_mode',document.querySelector('#xMode').value);document.body.dataset.density=prefs.density;flashX('Налаштування збережено');profileX();return}
  if(el.id==='xClear'){e.preventDefault();if(confirm('Очистити локальні дані LUMEN ARCANA?')){[HKEY,FKEY,NKEY,PKEY,'la_compatibility','la_tarot_type','la_mode'].forEach(k=>localStorage.removeItem(k));location.reload()}return}
  if(el.id==='xNatalLumen'||el.id==='xNatalClassic'){e.preventDefault();localStorage.setItem('la_natal_view',el.id==='xNatalClassic'?'classic':'lumen');natalX();return}
  if(el.id==='xNCalc'){e.preventDefault();const p={date:document.querySelector('#xNDate').value,time:document.querySelector('#xNTime').value,place:document.querySelector('#xNPlace').value.trim(),utcOffset:document.querySelector('#xNOffset').value,lat:document.querySelector('#xNLat').value,lon:document.querySelector('#xNLon').value,houseSystem:document.querySelector('#xNHouseSystem')?.value==='placidus'?'placidus':'equal'};if(!p.date||!p.time||p.utcOffset==='')return flashX('Вкажи дату, час і UTC-зсув');if(p.lat!==''&&(Number(p.lat)<-90||Number(p.lat)>90))return flashX('Широта має бути від -90 до 90');if(p.lon!==''&&(Number(p.lon)<-180||Number(p.lon)>180))return flashX('Довгота має бути від -180 до 180');localStorage.setItem(NKEY,JSON.stringify(p));natalX();return}
  if(el.id==='xPng'){e.preventDefault();const svg=document.querySelector('#xNatalWheel');if(svg)exportPngX(svg);return}
  if(el.id==='xPrint'){e.preventDefault();window.print();return}
},true);

// Lightweight startup preferences only.
const prefs=parseX(PKEY,{});document.body.dataset.density=prefs.density==='compact'?'compact':'comfortable';
