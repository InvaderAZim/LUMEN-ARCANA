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
function lunarDataX(d=new Date()){const days=(d.getTime()-EPOCH)/86400000,p=((days/SYN)%1+1)%1,age=p*SYN,illum=(1-Math.cos(2*Math.PI*p))/2*100;let name='Новий Місяць',symbol='🌑',focus='Сформулюй один намір без поспіху.';if(p>=.03&&p<.22){name='Молодий Місяць';symbol='🌒';focus='Нарощуй темп поступово.'}else if(p<.28&&p>=.22){name='Перша чверть';symbol='🌓';focus='Перевір рішення дією.'}else if(p<.47&&p>=.28){name='Зростаючий Місяць';symbol='🌔';focus='Розвивай уже розпочате.'}else if(p<.53&&p>=.47){name='Повня';symbol='🌕';focus='Підбий проміжний підсумок.'}else if(p<.72&&p>=.53){name='Спадний Місяць';symbol='🌖';focus='Завершуй зайве.'}else if(p<.78&&p>=.72){name='Остання чверть';symbol='🌗';focus='Переглянь результат.'}else if(p>=.78){name='Старий Місяць';symbol='🌘';focus='Зменш темп і заверши незакрите.'}const next=t=>{let x=t-p;if(x<=.001)x+=1;return new Date(d.getTime()+x*SYN*86400000)};return{p,age,illum,name,symbol,focus,newM:next(0),first:next(.25),full:next(.5),last:next(.75)}}
const fmtX=d=>d.toLocaleDateString('uk-UA',{day:'2-digit',month:'long'});
function moonX(){activeNav('');const m=lunarDataX(),c=shellX('Місячний календар','Поточна фаза й орієнтовний місячний цикл');c.innerHTML=`<section class="hero-premium"><div class="hero-copy"><div class="badge">LUNAR · BETA</div><h2>${m.symbol} ${m.name}</h2><p>Вік циклу: <b>${m.age.toFixed(1)} дня</b> · освітленість: <b>${Math.round(m.illum)}%</b>.</p><div class="synthesis"><small>ФОКУС ФАЗИ</small><p>${m.focus}</p></div></div><div class="arcana-mark"><span>MOON</span><strong>${m.symbol}</strong><small>${Math.round(m.p*100)}% ЦИКЛУ</small></div></section><section class="settings-grid" style="margin-top:14px"><article><small>🌑 НОВИЙ МІСЯЦЬ</small><h3>${fmtX(m.newM)}</h3><p>Початок нового синодичного циклу.</p></article><article><small>🌓 ПЕРША ЧВЕРТЬ</small><h3>${fmtX(m.first)}</h3><p>Приблизно 25% місячного циклу.</p></article><article><small>🌕 ПОВНЯ</small><h3>${fmtX(m.full)}</h3><p>Приблизно 50% місячного циклу.</p></article><article><small>🌗 ОСТАННЯ ЧВЕРТЬ</small><h3>${fmtX(m.last)}</h3><p>Приблизно 75% місячного циклу.</p></article></section><section class="day-card"><div><small>ТОЧНІСТЬ</small><h3>Астрономічне наближення</h3><p>Розрахунок базується на середній тривалості синодичного місяця 29,5306 дня. Для професійних ефемерид і точного часу фаз потрібен окремий астрономічний модуль.</p></div><div class="mini-card"><span>CYCLE</span><b>${m.symbol}</b></div></section>`}

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
const EARTH_ORB_X={N:[0,0],i:[0,0],w:[282.9404,4.70935e-5],a:[1,0],e:[.016709,-1.151e-9],M:[356.047,.9856002585]};
const MOON_ORB_X={N:[125.1228,-.0529538083],i:[5.1454,0],w:[318.0634,.1643573223],a:[60.2666,0],e:[.0549,0],M:[115.3654,13.0649929509]};
const elemX=(p,d)=>normX(p[0]+p[1]*d);
function moonLonX(jd){
  const d=jd-2451543.5,p=orbitX(MOON_ORB_X,d),Nm=elemX(MOON_ORB_X.N,d),wm=elemX(MOON_ORB_X.w,d),Mm=elemX(MOON_ORB_X.M,d),ws=elemX(EARTH_ORB_X.w,d),Ms=elemX(EARTH_ORB_X.M,d),Ls=normX(Ms+ws),Lm=normX(Mm+wm+Nm),DD=normX(Lm-Ls),F=normX(Lm-Nm);
  let lon=atanX(p.y,p.x);
  lon+=-1.274*sinX(Mm-2*DD)+.658*sinX(2*DD)-.186*sinX(Ms)-.059*sinX(2*Mm-2*DD)-.057*sinX(Mm-2*DD+Ms)+.053*sinX(Mm+2*DD)+.046*sinX(2*DD-Ms)+.041*sinX(Mm-Ms)-.035*sinX(DD)-.031*sinX(Mm+Ms)-.015*sinX(2*F-2*DD)+.011*sinX(Mm-4*DD);
  return normX(lon)
}
function plutoHelioX(d){
  const S=normX(50.03+.033459652*d),P=normX(238.95+.003968789*d);
  const lon=normX(238.9508+.00400703*d-19.799*sinX(P)+19.848*cosX(P)+.897*sinX(2*P)-4.956*cosX(2*P)+.610*sinX(3*P)+1.211*cosX(3*P)-.341*sinX(4*P)-.190*cosX(4*P)+.128*sinX(5*P)-.034*cosX(5*P)-.038*sinX(6*P)+.031*cosX(6*P)+.020*sinX(S-P)-.010*cosX(S-P));
  const lat=-3.9082-5.453*sinX(P)-14.975*cosX(P)+3.527*sinX(2*P)+1.673*cosX(2*P)-1.051*sinX(3*P)+.328*cosX(3*P)+.179*sinX(4*P)-.292*cosX(4*P)+.019*sinX(5*P)+.100*cosX(5*P)-.031*sinX(6*P)-.026*cosX(6*P)+.011*cosX(S-P);
  const r=40.72+6.68*sinX(P)+6.90*cosX(P)-1.18*sinX(2*P)-.03*cosX(2*P)+.15*sinX(3*P)-.14*cosX(3*P);
  return{x:r*cosX(lon)*cosX(lat),y:r*sinX(lon)*cosX(lat)}
}
function outerPerturbLonX(k,lon,d){
  const Mj=elemX(ORB.Jupiter.M,d),Ms=elemX(ORB.Saturn.M,d),Mu=elemX(ORB.Uranus.M,d);
  if(k==='Jupiter')lon+=-.332*sinX(2*Mj-5*Ms-67.6)-.056*sinX(2*Mj-2*Ms+21)+.042*sinX(3*Mj-5*Ms+21)-.036*sinX(Mj-2*Ms)+.022*cosX(Mj-Ms)+.023*sinX(2*Mj-3*Ms+52)-.016*sinX(Mj-5*Ms-69);
  else if(k==='Saturn')lon+=.812*sinX(2*Mj-5*Ms-67.6)-.229*cosX(2*Mj-4*Ms-2)+.119*sinX(Mj-2*Ms-3)+.046*sinX(2*Mj-6*Ms-69)+.014*sinX(Mj-3*Ms+32);
  else if(k==='Uranus')lon+=.040*sinX(Ms-2*Mu+6)+.035*sinX(Ms-3*Mu+33)-.015*sinX(Mj-Mu+20);
  return normX(lon)
}
function planetsX(jd){
  const d=jd-2451543.5,s=sunX(jd),earth=orbitX(EARTH_ORB_X,d),er=earth.r,xs=er*cosX(s),ys=er*sinX(s),o={Sun:s,Moon:moonLonX(jd)};
  for(const [k,e] of Object.entries(ORB)){
    if(k==='Pluto'){const p=plutoHelioX(d);o[k]=atanX(p.y+ys,p.x+xs);continue}
    const p=orbitX(e,d),rho=Math.hypot(p.x,p.y),lon=outerPerturbLonX(k,atanX(p.y,p.x),d);
    o[k]=atanX(rho*sinX(lon)+ys,rho*cosX(lon)+xs)
  }
  return o
}
const NATAL_EPHEMERIS_CACHE_X=new Map(),NATAL_EPHEMERIS_PENDING_X=new Set(),NATAL_BODY_KEYS_X=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const ephemerisKeyX=b=>b?.toISOString?.()||'';
function validEphemerisPositionsX(pos){return !!pos&&NATAL_BODY_KEYS_X.every(k=>Number.isFinite(Number(pos[k])))}
async function requestEphemerisX(b){
  const key=ephemerisKeyX(b);if(!key||NATAL_EPHEMERIS_CACHE_X.has(key)||NATAL_EPHEMERIS_PENDING_X.has(key))return;
  NATAL_EPHEMERIS_PENDING_X.add(key);
  try{
    const r=await fetch('/api/natal/ephemeris',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({utc:key})}),j=await r.json();
    NATAL_EPHEMERIS_CACHE_X.set(key,r.ok&&validEphemerisPositionsX(j?.positions)?Object.fromEntries(NATAL_BODY_KEYS_X.map(k=>[k,normX(Number(j.positions[k]))])):null)
  }catch{NATAL_EPHEMERIS_CACHE_X.set(key,null)}
  finally{
    NATAL_EPHEMERIS_PENDING_X.delete(key);
    if(document.querySelector('#xNCalc')&&parseX(NKEY,{})?.date)natalX()
  }
}
function resolvedPlanetsX(b,jd){
  const key=ephemerisKeyX(b),has=NATAL_EPHEMERIS_CACHE_X.has(key),precise=has?NATAL_EPHEMERIS_CACHE_X.get(key):null;
  return{pos:precise||planetsX(jd),engine:precise?'Astronomy Engine · true ecliptic of date':has?'Local fallback':'Astronomy Engine · loading',precise:!!precise,pending:!has}
}
function gmstX(jd){const T=(jd-2451545)/36525;return normX(280.46061837+360.98564736629*(jd-2451545)+.000387933*T*T-T*T*T/38710000)}
function ascendantX(jd,lat,lon){const theta=normX(gmstX(jd)+lon)*R,phi=lat*R,eps=(23.439291-.0130042*((jd-2451545)/36525))*R;return normX(Math.atan2(-Math.cos(theta),Math.sin(theta)*Math.cos(eps)+Math.tan(phi)*Math.sin(eps))*D+180)}
function aspectsX(pos){const keys=Object.keys(pos),defs=[['З’єднання',0,8],['Секстиль',60,5],['Квадрат',90,7],['Трин',120,7],['Опозиція',180,8]],rows=[];for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++){let d=Math.abs(pos[keys[i]]-pos[keys[j]]);if(d>180)d=360-d;for(const [name,target,orb] of defs)if(Math.abs(d-target)<=orb){rows.push({a:keys[i],b:keys[j],name,orb:Math.abs(d-target)});break}}return rows.sort((a,b)=>a.orb-b.orb).slice(0,12)}
function zpX(v){v=normX(v);const i=Math.floor(v/30);return{name:Z[i][0],glyph:Z[i][1],degree:v-i*30}}
const NATAL_TZ_PENDING_X=new Set();
const timezoneTokenX=p=>[p?.date||'',p?.time||'',p?.lat||'',p?.lon||''].join('|');
function birthX(p){const token=timezoneTokenX(p);if(p?.timezoneToken===token&&p?.utcIso){const d=new Date(p.utcIso);if(Number.isFinite(d.getTime()))return d}if(!p.date||!p.time||p.utcOffset===''||p.utcOffset==null)return null;const[y,m,d]=p.date.split('-').map(Number),[hh,mm]=p.time.split(':').map(Number),off=Number(p.utcOffset);if(!Number.isFinite(off))return null;return new Date(Date.UTC(y,m-1,d,hh-off,mm||0))}
async function resolveTimezoneX(p){const token=timezoneTokenX(p);if(!p?.date||!p?.time||p?.lat===''||p?.lon===''||NATAL_TZ_PENDING_X.has(token))return;const lat=Number(p.lat),lon=Number(p.lon);if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return;NATAL_TZ_PENDING_X.add(token);try{const r=await fetch('/api/natal/timezone',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({date:p.date,time:p.time,lat,lon})}),j=await r.json();if(r.ok&&j?.ok&&j?.utc&&j?.timeZone&&Number.isFinite(Number(j.offsetHours))){const current=parseX(NKEY,{});if(timezoneTokenX(current)===token){const next={...current,utcOffset:String(Number(j.offsetHours)),timezone:j.timeZone,utcIso:j.utc,timezoneToken:token};localStorage.setItem(NKEY,JSON.stringify(next));natalX()}}else flashX('Не вдалося автоматично визначити історичний UTC')}catch{flashX('Не вдалося автоматично визначити історичний UTC')}finally{NATAL_TZ_PENDING_X.delete(token)}}
function wheelX(pos,asc=null){const rot=asc==null?0:asc;let marks='',labels='';for(let i=0;i<12;i++){const a=(i*30-rot-90)*R,x=180+150*Math.cos(a),y=180+150*Math.sin(a),x2=180+126*Math.cos(a),y2=180+126*Math.sin(a),mid=(i*30+15-rot-90)*R;marks+=`<line x1="${x2}" y1="${y2}" x2="${x}" y2="${y}" stroke="#e5c87d55"/>`;labels+=`<text x="${180+138*Math.cos(mid)}" y="${180+138*Math.sin(mid)}" text-anchor="middle" dominant-baseline="middle" fill="#e5c87d" font-size="19">${Z[i][1]}</text>`}let ptxt='';Object.entries(pos).forEach(([k,v],i)=>{const a=(v-rot-90)*R,rr=105-(i%3)*10;ptxt+=`<text x="${180+rr*Math.cos(a)}" y="${180+rr*Math.sin(a)}" text-anchor="middle" dominant-baseline="middle" fill="#f8f3e9" font-size="17">${PM[k][1]}</text>`});return `<svg id="xNatalWheel" viewBox="0 0 360 360" aria-label="Натальне колесо" style="width:min(100%,520px);display:block;margin:auto"><circle cx="180" cy="180" r="150" fill="#0b0b0b" stroke="#e5c87d99"/><circle cx="180" cy="180" r="126" fill="none" stroke="#e5c87d44"/><circle cx="180" cy="180" r="92" fill="none" stroke="#ffffff18"/>${marks}${labels}${ptxt}${asc!=null?'<line x1="180" y1="180" x2="180" y2="28" stroke="#e5c87d" stroke-width="2"/><text x="180" y="20" text-anchor="middle" fill="#e5c87d" font-size="11">ASC</text>':''}</svg>`}
function mcX(jd,lon){const theta=normX(gmstX(jd)+lon)*R,eps=(23.439291-.0130042*((jd-2451545)/36525))*R;return normX(Math.atan2(Math.sin(theta)/Math.cos(eps),Math.cos(theta))*D)}
const classicPlanetColorX=k=>({Sun:'#e02020',Moon:'#1d4ed8',Mercury:'#159447',Venus:'#159447',Mars:'#e02020',Jupiter:'#e02020',Saturn:'#222',Uranus:'#159447',Neptune:'#1d4ed8',Pluto:'#1d4ed8'}[k]||'#111');

const HOUSE_SYSTEMS_X={equal:'Equal House',placidus:'Placidus'};
const PLACIDUS_ENGINE_ENABLED_X=true;
function equalHouseCuspsX(asc){return asc==null?[]:Array.from({length:12},(_,i)=>normX(asc+i*30))}
function meanObliquityX(jd){
  const T=(jd-2451545)/36525;
  return 23.439291111-.013004167*T-.000000164*T*T+.000000504*T*T*T
}
function localSiderealX(jd,lon){return normX(gmstX(jd)+lon)}
function eclipticFromRaX(ra,eps){
  const a=ra*R,e=eps*R;
  return normX(Math.atan2(Math.sin(a)/Math.cos(e),Math.cos(a))*D)
}
function declinationFromLonX(lon,eps){
  return Math.asin(Math.sin(eps*R)*Math.sin(lon*R))*D
}
function ascensionalDifferenceX(lon,lat,eps){
  const dec=declinationFromLonX(lon,eps),x=Math.tan(lat*R)*Math.tan(dec*R);
  if(!Number.isFinite(x)||Math.abs(x)>1)return null;
  return Math.asin(x)*D
}
function signedAngleX(v){const x=normX(v);return x>180?x-360:x}
function placidusResidualX(lon,lst,lat,eps,fraction,direction){
  const ad=ascensionalDifferenceX(lon,lat,eps);
  if(ad==null)return null;
  const targetRa=normX(lst+direction*(90*fraction+ad*fraction));
  return signedAngleX(eclipticFromRaX(targetRa,eps)-lon)
}
function placidusBracketRootX(lo,hi,lst,lat,eps,fraction,direction){
  let flo=placidusResidualX(normX(lo),lst,lat,eps,fraction,direction),fhi=placidusResidualX(normX(hi),lst,lat,eps,fraction,direction);
  if(flo==null||fhi==null||flo*fhi>0)return null;
  for(let i=0;i<60;i++){
    const mid=(lo+hi)/2,fm=placidusResidualX(normX(mid),lst,lat,eps,fraction,direction);
    if(fm==null)return null;
    if(Math.abs(fm)<1e-10)return normX(mid);
    if(flo*fm<=0){hi=mid;fhi=fm}else{lo=mid;flo=fm}
  }
  return normX((lo+hi)/2)
}
function placidusCuspX(lst,lat,eps,fraction,direction){
  const seed=eclipticFromRaX(normX(lst+direction*90*fraction),eps);
  let lon=seed;
  for(let i=0;i<40;i++){
    const r=placidusResidualX(lon,lst,lat,eps,fraction,direction);
    if(r==null)break;
    if(Math.abs(r)<1e-8)return normX(lon);
    lon=normX(lon+r*.65)
  }
  const roots=[],step=.5;
  let prevX=0,prevR=placidusResidualX(0,lst,lat,eps,fraction,direction);
  for(let x=step;x<=360;x+=step){
    const xx=x===360?0:x,r=placidusResidualX(xx,lst,lat,eps,fraction,direction);
    if(prevR!=null&&r!=null&&Math.abs(prevR)<180&&Math.abs(r)<180){
      if(Math.abs(prevR)<1e-9)roots.push(normX(prevX));
      else if(prevR*r<0&&Math.abs(prevR-r)<180){
        const root=placidusBracketRootX(prevX,x,lst,lat,eps,fraction,direction);
        if(root!=null)roots.push(root)
      }
    }
    prevX=x;prevR=r
  }
  if(!roots.length)return null;
  return roots.reduce((best,v)=>Math.abs(signedAngleX(v-seed))<Math.abs(signedAngleX(best-seed))?v:best,roots[0])
}
function placidusHouseCuspsX(jd,lat,lon,asc,mc){
  if(!Number.isFinite(jd)||!Number.isFinite(lat)||!Number.isFinite(lon)||asc==null||mc==null)return null;
  const eps=meanObliquityX(jd),lst=localSiderealX(jd,lon);
  const h11=placidusCuspX(lst,lat,eps,1/3,+1),h12=placidusCuspX(lst,lat,eps,2/3,+1),h9=placidusCuspX(lst,lat,eps,1/3,-1),h8=placidusCuspX(lst,lat,eps,2/3,-1);
  if([h8,h9,h11,h12].some(v=>v==null))return null;
  return[
    normX(asc),normX(h8+180),normX(h9+180),normX(mc+180),normX(h11+180),normX(h12+180),
    normX(asc+180),normX(h8),normX(h9),normX(mc),normX(h11),normX(h12)
  ]
}
function validHouseCuspsX(cusps){
  if(!Array.isArray(cusps)||cusps.length!==12||cusps.some(v=>!Number.isFinite(v)))return false;
  for(let i=0;i<6;i++){
    const opposite=normX(cusps[i]+180);
    let d=Math.abs(normX(cusps[i+6]-opposite));if(d>180)d=360-d;
    if(d>.001)return false
  }
  return true
}
function resolveHouseSystemX(requested,jd,lat,lon,asc,mc){
  const system=requested==='placidus'?'placidus':'equal';
  if(asc==null)return{requested:system,used:system,cusps:[],fallback:false};
  if(system==='placidus'){
    const cusps=PLACIDUS_ENGINE_ENABLED_X?placidusHouseCuspsX(jd,lat,lon,asc,mc):null;
    if(validHouseCuspsX(cusps))return{requested:'placidus',used:'placidus',cusps,fallback:false};
    return{requested:'placidus',used:'equal',cusps:equalHouseCuspsX(asc),fallback:true,reason:'placidus-unavailable'};
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

function classicWheelX(pos,asc=null,mc=null,houses=[],houseMeta=null,engineLabel='Local fallback'){
  const cx=360,cy=360,outer=330,zInner=278,planetR=246,houseR=160,aspectR=116,rot=asc==null?0:asc;
  const point=(lon,r)=>{const a=(180-(lon-rot))*R;return{x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)}};
  const angularSep=(a,b)=>{let d=Math.abs(normX(a-b));return d>180?360-d:d};
  const axisTag=(lon,label)=>{
    const p=point(lon,outer-12),a=(180-(lon-rot))*R,dx=Math.cos(a);
    const anchor=dx>.28?'end':dx<-.28?'start':'middle';
    return `<text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle" font-size="14" font-weight="800" fill="#111" style="paint-order:stroke;stroke:#fff;stroke-width:5px;stroke-linejoin:round">${label}</text>`
  };
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
      const next=houses[(i+1)%12],span=normX(next-v),midLon=normX(v+span/2);
      const labelR=span<6?(i%2?142:176):span<10?(i%2?150:170):houseR,mid=point(midLon,labelR);
      houseLabels+=`<text x="${mid.x.toFixed(1)}" y="${mid.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="700" fill="#555" style="paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round">${i+1}</text>`;
    });
    const ascP=point(asc,outer),dcP=point(normX(asc+180),outer);
    axes+=`<line x1="${cx}" y1="${cy}" x2="${ascP.x.toFixed(1)}" y2="${ascP.y.toFixed(1)}" stroke="#111" stroke-width="3"/><line x1="${cx}" y1="${cy}" x2="${dcP.x.toFixed(1)}" y2="${dcP.y.toFixed(1)}" stroke="#111" stroke-width="3"/>${axisTag(asc,'AC')}${axisTag(normX(asc+180),'DC')}`;
  }
  if(mc!=null){
    const mcP=point(mc,outer),icP=point(normX(mc+180),outer);
    axes+=`<line x1="${cx}" y1="${cy}" x2="${mcP.x.toFixed(1)}" y2="${mcP.y.toFixed(1)}" stroke="#333" stroke-width="3"/><line x1="${cx}" y1="${cy}" x2="${icP.x.toFixed(1)}" y2="${icP.y.toFixed(1)}" stroke="#333" stroke-width="3"/>${axisTag(mc,'MC')}${axisTag(normX(mc+180),'IC')}`;
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
    const prev=entries[(i-1+entries.length)%entries.length],next=entries[(i+1)%entries.length];
    const sep=Math.min(prev?angularSep(v,prev[1]):99,next?angularSep(v,next[1]):99);
    if(sep<6)track=[246,224,206][i%3];
    const p=point(v,track),z=zpX(v),deg=Math.floor(z.degree),min=Math.round((z.degree-deg)*60);
    planetMarks+=`<g><text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="22" font-family="serif" font-weight="700" fill="${classicPlanetColorX(k)}" style="paint-order:stroke;stroke:#fff;stroke-width:5px;stroke-linejoin:round">${PM[k][1]}</text><text x="${p.x.toFixed(1)}" y="${(p.y+16).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="${classicPlanetColorX(k)}" style="paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round">${deg}°${String(min).padStart(2,'0')}′</text></g>`;
  });
  return `<div class="classic-chart-shell"><div class="classic-chart-meta"><strong>Classic Chart</strong><span>${houseSystemStatusX(houseMeta)} · ${engineLabel}</span></div><svg id="xNatalWheel" class="classic-natal-svg" viewBox="0 0 720 720" role="img" aria-label="Класична натальна карта"><rect width="720" height="720" fill="#fff"/><circle cx="${cx}" cy="${cy}" r="${outer}" fill="#fff" stroke="#111" stroke-width="2.4"/><circle cx="${cx}" cy="${cy}" r="${zInner}" fill="none" stroke="#111" stroke-width="1.4"/><circle cx="${cx}" cy="${cy}" r="120" fill="#fff" stroke="#777" stroke-width="1"/>${ticks}${signBounds}${signLabels}${houseLines}${houseLabels}${aspectLines}${axes}${planetMarks}</svg></div>`;
}
function natalX(){activeNav('');const p=parseX(NKEY,{}),lat=Number(p.lat),lon=Number(p.lon),hasGeo=p.lat!==''&&p.lon!==''&&Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180,tzToken=timezoneTokenX(p),timezoneReady=hasGeo&&p.timezoneToken===tzToken&&!!p.utcIso,b=hasGeo?(timezoneReady?birthX(p):null):birthX(p),houseSystem=p.houseSystem==='placidus'?'placidus':'equal',view=localStorage.getItem('la_natal_view')==='classic'?'classic':'lumen',input='width:100%;background:#090909;color:#fff;border:1px solid #ffffff1c;border-radius:14px;padding:13px;outline:none',c=shellX('Натальна карта','Планети, Асцендент, будинки й аспекти · Premium Beta');let result='';window.LUMEN_NATAL_EXPORT_DATA=null;if(b){const jd=b.getTime()/86400000+2440587.5,resolved=resolvedPlanetsX(b,jd),pos=resolved.pos,engineLabel=resolved.engine,asc=hasGeo?ascendantX(jd,lat,lon):null,mc=hasGeo?mcX(jd,lon):null,houseMeta=resolveHouseSystemX(houseSystem,jd,lat,lon,asc,mc),houses=houseMeta.cusps,asp=aspectsX(pos);window.LUMEN_NATAL_EXPORT_DATA={profile:{...p},pos:{...pos},asc,mc,houseMeta:{...houseMeta,cusps:[...houses]},engineLabel};result=`<section class="premium-panel" style="margin-top:14px"><div class="badge">NATAL ENGINE · BETA</div><h2>Натальне колесо</h2><p style="color:var(--muted)">Планетні довготи: ${resolved.precise?'Astronomy Engine · true ecliptic of date':resolved.pending?'завантажується Astronomy Engine; тимчасово показано локальний fallback':'серверні ефемериди недоступні; використано локальний fallback'}. ${asc==null?'Для Асцендента й 12 будинків введи координати місця народження.':houseMeta.fallback?'Placidus недоступний для цих координат або часу — автоматично використано Equal House.':`Будинки: система ${houseSystemStatusX(houseMeta)}.`}</p><div class="natal-view-switch"><button class="${view==='lumen'?'primary':'ghost'}" id="xNatalLumen">LUMEN View</button><button class="${view==='classic'?'primary':'ghost'}" id="xNatalClassic">Classic Chart</button></div>${view==='classic'?classicWheelX(pos,asc,mc,houses,houseMeta,engineLabel)+classicPositionsTableX(pos,asc,mc,houseMeta)+classicAspectMatrixX(pos):wheelX(pos,asc)}<div class="result-actions"><button class="ghost" id="xPng">Зберегти PNG</button><button class="primary" id="xPrint">PDF / Друк</button></div></section><section class="settings-grid">${Object.entries(pos).map(([k,v])=>{const z=zpX(v);return `<article><small>${PM[k][1]} ${PM[k][0].toUpperCase()}</small><h3>${z.glyph} ${z.name}</h3><p>${z.degree.toFixed(1)}° у знаку · ${v.toFixed(1)}° екліптики</p></article>`}).join('')}</section>${asc!=null?`<section class="settings-grid" style="margin-top:14px"><article><small>ASC</small><h3>${zpX(asc).glyph} ${zpX(asc).name}</h3><p>${zpX(asc).degree.toFixed(1)}° · Асцендент</p></article>${houses.map((v,i)=>{const z=zpX(v);return `<article><small>ДІМ ${i+1}</small><h3>${z.glyph} ${z.name}</h3><p>${z.degree.toFixed(1)}° · ${houseSystemStatusX(houseMeta)}</p></article>`}).join('')}</section>`:''}<section class="premium-panel" style="margin-top:14px"><div class="badge">АСПЕКТИ</div><h2>Основні зв’язки</h2><div class="reading-cards">${asp.length?asp.map(a=>`<article><div class="card-no">${a.name.toUpperCase()}</div><h3>${PM[a.a][1]} ${PM[a.a][0]} — ${PM[a.b][1]} ${PM[a.b][0]}</h3><p>Орбіс ${a.orb.toFixed(1)}°</p></article>`).join(''):'<article><p>У межах заданих орбісів основні аспекти не знайдені.</p></article>'}</div></section>`}c.innerHTML=`<section class="premium-panel"><div class="badge">FULL NATAL · PREMIUM BETA</div><div class="settings-grid"><article><small>ДАТА</small><input id="xNDate" type="date" value="${escX(p.date||'')}" style="${input}"></article><article><small>ЧАС</small><input id="xNTime" type="time" value="${escX(p.time||'')}" style="${input}"></article><article><small>МІСЦЕ</small><input id="xNPlace" value="${escX(p.place||'')}" style="${input}"></article><article><small>UTC · AUTO</small><input id="xNOffset" type="text" readonly value="${escX(timezoneReady?(Number(p.utcOffset)>=0?'+':'')+p.utcOffset:'визначається…')}" style="${input};opacity:.82"><p style="margin-top:8px;color:var(--muted);font-size:.78rem">${timezoneReady?`${escX(p.timezone||'')} · ${escX(p.utcIso||'')}`:'Історичний UTC визначається автоматично за датою та координатами.'}</p></article><article><small>ШИРОТА</small><input id="xNLat" type="number" min="-90" max="90" step="0.0001" value="${escX(p.lat??'')}" placeholder="50.95" style="${input}"></article><article><small>ДОВГОТА</small><input id="xNLon" type="number" min="-180" max="180" step="0.0001" value="${escX(p.lon??'')}" placeholder="28.64" style="${input}"></article><article><small>СИСТЕМА ДОМІВ</small><select id="xNHouseSystem" style="${input}"><option value="equal" ${houseSystem==='equal'?'selected':''}>Equal House</option><option value="placidus" ${houseSystem==='placidus'?'selected':''}>Placidus</option></select><p style="margin-top:8px;color:var(--muted);font-size:.78rem">Якщо Placidus неможливо коректно розрахувати для цих координат і часу, автоматично використовується Equal House.</p></article></div><button class="primary wide" id="xNCalc">Зберегти й побудувати</button></section>${result}`;if(hasGeo&&!timezoneReady&&!NATAL_TZ_PENDING_X.has(tzToken))resolveTimezoneX(p);if(b&&!NATAL_EPHEMERIS_CACHE_X.has(ephemerisKeyX(b)))requestEphemerisX(b)}
function classicExportSvgX(data){
  if(!data?.pos)return null;
  const {profile:p={},pos,asc=null,mc=null,houseMeta={cusps:[]},engineLabel='Local fallback'}=data,cusps=houseMeta.cusps||[];
  const host=document.createElement('div');host.innerHTML=classicWheelX(pos,asc,mc,cusps,houseMeta,engineLabel);
  const wheel=host.querySelector('svg');if(!wheel)return null;
  const W=1400,rowH=38,tableY=1025,keys=Object.keys(pos),system=houseSystemStatusX(houseMeta);
  const tableRowsCount=keys.length+(asc!=null?1:0)+(mc!=null?1:0),tableBottom=tableY+92+tableRowsCount*rowH,matrixY=tableBottom+90;
  const infoPrimary=[
    p.date?`Дата: ${escX(p.date)}`:'',
    p.time?`Час: ${escX(p.time)}`:'',
    p.place?`Місце: ${escX(p.place)}`:''
  ].filter(Boolean).join(' · ');
  const infoGeo=[
    p.utcOffset!==''&&p.utcOffset!=null?`UTC: ${escX(p.utcOffset)}`:'',
    p.lat!==''&&p.lat!=null?`φ ${escX(p.lat)}°`:'',
    p.lon!==''&&p.lon!=null?`λ ${escX(p.lon)}°`:''
  ].filter(Boolean).join(' · ');
  const rows=Object.entries(pos).map(([k,v],i)=>{const d=degreeMinuteX(v),y=tableY+92+i*rowH,h=natalHouseX(v,cusps);return`<g><rect x="90" y="${y-rowH+4}" width="1220" height="${rowH}" fill="${i%2?'#fafafa':'#fff'}"/><text x="110" y="${y-10}" font-size="22" font-family="serif" fill="#111">${PM[k][1]}</text><text x="145" y="${y-10}" font-size="17" fill="#111">${escX(PM[k][0])}</text><text x="520" y="${y-10}" font-size="17" fill="#111">${d.z.glyph} ${escX(d.z.name)}</text><text x="850" y="${y-10}" font-size="17" fill="#111">${String(d.deg).padStart(2,'0')}°${String(d.min).padStart(2,'0')}′</text><text x="1190" y="${y-10}" font-size="17" fill="#111">${h}</text><line x1="90" y1="${y}" x2="1310" y2="${y}" stroke="#d8d8d8"/></g>`}).join('');
  const angleRows=[
    asc!=null?['AC','Асцендент',asc,'1']:null,
    mc!=null?['MC','Середина неба',mc,'—']:null
  ].filter(Boolean).map((r,j)=>{const d=degreeMinuteX(r[2]),y=tableY+92+(keys.length+j)*rowH;return`<g><rect x="90" y="${y-rowH+4}" width="1220" height="${rowH}" fill="#f3f3f3"/><text x="110" y="${y-10}" font-size="18" font-weight="700" fill="#111">${r[0]}</text><text x="145" y="${y-10}" font-size="17" fill="#111">${escX(r[1])}</text><text x="520" y="${y-10}" font-size="17" fill="#111">${d.z.glyph} ${escX(d.z.name)}</text><text x="850" y="${y-10}" font-size="17" fill="#111">${String(d.deg).padStart(2,'0')}°${String(d.min).padStart(2,'0')}′</text><text x="1190" y="${y-10}" font-size="17" fill="#111">${r[3]}</text><line x1="90" y1="${y}" x2="1310" y2="${y}" stroke="#d8d8d8"/></g>`}).join('');
  const cell=52,labelW=138,mx=Math.round((W-(labelW+keys.length*cell))/2),my=matrixY+100,matrixBottom=my+keys.length*cell,H=matrixBottom+105;
  const mHead=keys.map((k,j)=>`<text x="${mx+labelW+j*cell+cell/2}" y="${my-18}" text-anchor="middle" font-size="24" font-family="serif" fill="#111">${PM[k][1]}</text>`).join('');
  const mRows=keys.map((a,i)=>{const label=`<text x="${mx}" y="${my+i*cell+34}" font-size="20" font-family="serif" fill="#111">${PM[a][1]}</text><text x="${mx+32}" y="${my+i*cell+34}" font-size="13" fill="#555">${escX(PM[a][0])}</text>`;const cells=keys.map((b,j)=>{const x=mx+labelW+j*cell,y=my+i*cell;if(j>=i)return`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="#f7f7f7" stroke="#d5d5d5"/>`;const hit=classicAspectHitX(pos[a],pos[b]);if(!hit)return`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="#fff" stroke="#d5d5d5"/><text x="${x+cell/2}" y="${y+34}" text-anchor="middle" font-size="18" fill="#bbb">·</text>`;const color=hit.tone==='blue'?'#1747ff':hit.tone==='red'?'#ef1717':'#222';return`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="#fff" stroke="#d5d5d5"/><text x="${x+cell/2}" y="${y+27}" text-anchor="middle" font-size="23" font-family="serif" font-weight="700" fill="${color}">${hit.symbol}</text><text x="${x+cell/2}" y="${y+43}" text-anchor="middle" font-size="10" fill="${color}">${hit.orb.toFixed(1)}°</text>`}).join('');return label+cells}).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#fff"/><text x="90" y="66" font-size="18" letter-spacing="4" font-weight="700" fill="#8b6b2d">LUMEN ARCANA · CLASSIC NATAL CHART</text><text x="90" y="112" font-size="34" font-family="Georgia,serif" fill="#111">Натальна карта</text><text x="90" y="145" font-size="16" fill="#444">${infoPrimary||'Персональні дані не вказані'}</text><text x="90" y="173" font-size="14" fill="#555">${infoGeo}</text><text x="90" y="201" font-size="14" fill="#666">Система домів: ${escX(system)} · планетний engine: ${escX(engineLabel)}</text><line x1="90" y1="222" x2="1310" y2="222" stroke="#bfa363"/><svg x="340" y="235" width="720" height="720" viewBox="0 0 720 720">${wheel.innerHTML}</svg><text x="90" y="${tableY}" font-size="25" font-family="Georgia,serif" fill="#111">Положення планет</text><text x="90" y="${tableY+42}" font-size="14" font-weight="700" fill="#666">ОБ’ЄКТ</text><text x="520" y="${tableY+42}" font-size="14" font-weight="700" fill="#666">ЗНАК</text><text x="850" y="${tableY+42}" font-size="14" font-weight="700" fill="#666">ПОЗИЦІЯ</text><text x="1190" y="${tableY+42}" font-size="14" font-weight="700" fill="#666">ДІМ</text><line x1="90" y1="${tableY+55}" x2="1310" y2="${tableY+55}" stroke="#888"/>${rows}${angleRows}<text x="90" y="${matrixY}" font-size="25" font-family="Georgia,serif" fill="#111">Матриця аспектів</text><text x="90" y="${matrixY+35}" font-size="13" fill="#1747ff">✶ △ гармонійні</text><text x="290" y="${matrixY+35}" font-size="13" fill="#ef1717">□ ☍ напружені</text><text x="490" y="${matrixY+35}" font-size="13" fill="#222">☌ з’єднання</text>${mHead}${mRows}<text x="90" y="${H-36}" font-size="12" fill="#777">LUMEN ARCANA · ${escX(system)} · Export</text></svg>`
}
function exportPngX(svgMarkup){
  if(!svgMarkup)return;
  const url=URL.createObjectURL(new Blob([svgMarkup],{type:'image/svg+xml;charset=utf-8'})),img=new Image();
  img.onload=()=>{const m=svgMarkup.match(/<svg[^>]*width="(\d+)"[^>]*height="(\d+)"/),c=document.createElement('canvas');c.width=Number(m?.[1])||1400;c.height=Number(m?.[2])||2360;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);c.toBlob(b=>{if(!b)return flashX('Не вдалося створити PNG');const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='lumen-natal-classic.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)},'image/png')};
  img.onerror=()=>{URL.revokeObjectURL(url);flashX('Не вдалося створити PNG')};
  img.src=url
}
function printClassicX(svgMarkup){
  if(!svgMarkup)return;
  document.querySelector('#xNatalPrintSheet')?.remove();document.querySelector('#xNatalPrintStyle')?.remove();
  const sheet=document.createElement('div');sheet.id='xNatalPrintSheet';sheet.innerHTML=svgMarkup;
  const style=document.createElement('style');style.id='xNatalPrintStyle';style.textContent='@media print{html,body{background:#fff!important;margin:0!important;padding:0!important}body>:not(#xNatalPrintSheet){display:none!important}#xNatalPrintSheet{display:block!important;width:100%!important;background:#fff!important}#xNatalPrintSheet svg{display:block!important;width:auto!important;height:283mm!important;max-width:196mm!important;max-height:283mm!important;margin:0 auto!important}@page{size:A4 portrait;margin:7mm}}';
  document.body.append(style,sheet);
  const cleanup=()=>{sheet.remove();style.remove()};
  window.addEventListener('afterprint',cleanup,{once:true});
  requestAnimationFrame(()=>setTimeout(()=>window.print(),50));
  setTimeout(()=>{if(document.body.contains(sheet))cleanup()},30000)
}

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
  if(el.id==='xNCalc'){e.preventDefault();const old=parseX(NKEY,{}),p={date:document.querySelector('#xNDate').value,time:document.querySelector('#xNTime').value,place:document.querySelector('#xNPlace').value.trim(),utcOffset:old.utcOffset??'',lat:document.querySelector('#xNLat').value,lon:document.querySelector('#xNLon').value,houseSystem:document.querySelector('#xNHouseSystem')?.value==='placidus'?'placidus':'equal'};if(!p.date||!p.time)return flashX('Вкажи дату і час');if(p.lat==='')return flashX('Вкажи широту для автоматичного UTC');if(p.lon==='')return flashX('Вкажи довготу для автоматичного UTC');if(Number(p.lat)<-90||Number(p.lat)>90)return flashX('Широта має бути від -90 до 90');if(Number(p.lon)<-180||Number(p.lon)>180)return flashX('Довгота має бути від -180 до 180');localStorage.setItem(NKEY,JSON.stringify(p));natalX();resolveTimezoneX(p);return}
  if(el.id==='xPng'){e.preventDefault();const svg=classicExportSvgX(window.LUMEN_NATAL_EXPORT_DATA);if(!svg)return flashX('Спочатку побудуй натальну карту');exportPngX(svg);return}
  if(el.id==='xPrint'){e.preventDefault();const svg=classicExportSvgX(window.LUMEN_NATAL_EXPORT_DATA);if(!svg)return flashX('Спочатку побудуй натальну карту');printClassicX(svg);return}
},true);

// Lightweight startup preferences only.
const prefs=parseX(PKEY,{});document.body.dataset.density=prefs.density==='compact'?'compact':'comfortable';
