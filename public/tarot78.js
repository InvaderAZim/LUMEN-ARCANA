const TAROT_MAJOR=[
['Дурень','початок','свобода','крок у невідоме'],['Маг','воля','дія','майстерність'],['Верховна Жриця','інтуїція','тиша','внутрішнє знання'],['Імператриця','творення','турбота','достаток'],['Імператор','структура','відповідальність','межі'],['Ієрофант','традиція','навчання','цінності'],['Закохані','вибір','зв’язок','узгодженість'],['Колісниця','напрямок','самоконтроль','рух'],['Сила','витримка','м’яка сила','сміливість'],['Відлюдник','самопізнання','усамітнення','пошук'],['Колесо Фортуни','цикл','зміни','поворот'],['Справедливість','баланс','наслідки','чесність'],['Повішений','пауза','інший погляд','відпускання'],['Смерть','завершення','трансформація','перехід'],['Помірність','міра','гармонізація','терпіння'],['Диявол','прив’язаність','спокуса','несвобода'],['Вежа','руйнування ілюзій','різка зміна','перебудова'],['Зірка','надія','відновлення','орієнтир'],['Місяць','невизначеність','уявлення','інтуїція'],['Сонце','ясність','життєвість','успіх'],['Суд','переоцінка','поклик','рішення'],['Світ','завершення','цілісність','результат']
];
const TAROT_SUITS=[
 {key:'wands',name:'Жезли',glyph:'♣',theme:['енергія','ініціатива','воля']},
 {key:'cups',name:'Кубки',glyph:'♥',theme:['емоції','стосунки','сприйняття']},
 {key:'swords',name:'Мечі',glyph:'♠',theme:['думки','рішення','конфлікт']},
 {key:'pentacles',name:'Пентаклі',glyph:'♦',theme:['ресурси','практичність','стабільність']}
];
const TAROT_RANKS=[
 ['Туз',['початок','потенціал']],['Двійка',['вибір','баланс']],['Трійка',['розвиток','взаємодія']],['Четвірка',['структура','стабілізація']],['П’ятірка',['напруга','виклик']],['Шістка',['рух','відновлення']],['Сімка',['перевірка','позиція']],['Вісімка',['динаміка','майстерність']],['Дев’ятка',['досвід','межа']],['Десятка',['завершення','навантаження']],['Паж',['дослідження','звістка']],['Лицар',['рух','імпульс']],['Королева',['зрілість','внутрішня опора']],['Король',['керування','відповідальність']]
];

const RWS_MAJOR_FILES=[
 '00_00_fool.jpg','00_01_magician.jpg','00_02_high_priestess.jpg','00_03_empress.jpg',
 '00_04_emperor.jpg','00_05_hierophant.jpg','00_06_lovers.jpg','00_07_chariot.jpg',
 '00_08_strength.jpg','00_09_hermit.jpg','00_10_wheel_of_fortune.jpg','00_11_justice.jpg',
 '00_12_hanged_man.jpg','00_13_death.jpg','00_14_temperance.jpg','00_15_devil.jpg',
 '00_16_tower.jpg','00_17_star.jpg','00_18_moon.jpg','00_19_sun.jpg',
 '00_20_judgement.jpg','00_21_world.jpg'
];
const RWS_SUIT_PREFIX={wands:'01',cups:'02',swords:'03',pentacles:'04'};
const RWS_BASE='/cards/rws/';
const cardImage78=(group,index)=>group==='major'
 ? RWS_BASE+RWS_MAJOR_FILES[index]
 : `${RWS_BASE}${RWS_SUIT_PREFIX[group]}_${String(index+1).padStart(2,'0')}_${group}.jpg`;

const TAROT78=[...TAROT_MAJOR.map((x,i)=>({id:`M${i}`,name:x[0],group:'major',groupName:'Старші Аркани',glyph:i%3===0?'☾':'✦',keywords:x.slice(1),image:cardImage78('major',i)})),...TAROT_SUITS.flatMap(s=>TAROT_RANKS.map((r,i)=>({id:`${s.key}-${i+1}`,name:`${r[0]} ${s.name}`,group:s.key,groupName:s.name,glyph:s.glyph,keywords:[...r[1],...s.theme],image:cardImage78(s.key,i)})))];
const tarotEsc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
const PERSONAL_KEY='la_personalization_enabled';
const TOPIC_DEFS=[
 ['work','Робота / розвиток',/(робот|кар'єр|кар’єр|профес|посад|проєкт|проект|бізнес|навчан)/i],
 ['relations','Стосунки',/(стосунк|любов|кохан|партнер|чоловік|дружин|дівчин|хлопець|родин|сім'|сім’)/i],
 ['money','Фінанси',/(фінанс|грош|кредит|дохід|зароб|бюджет|витрат|прибут)/i],
 ['decision','Вибір / рішення',/(вибір|рішенн|варіант|напрям|шлях|обрати|виріш)/i],
 ['self','Внутрішній стан',/(себе|емоці|почутт|страх|тривог|втом|внутріш|самооцін|меж)/i]
];
function store78(key,fallback){try{const v=JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));return v??fallback}catch{return fallback}}
function sunSign78(date){if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return null;const [,m,d]=date.split('-').map(Number),md=m*100+d;if(md>=1222||md<=119)return'Козоріг';const rows=[['Водолій',120,218],['Риби',219,320],['Овен',321,419],['Телець',420,520],['Близнюки',521,620],['Рак',621,722],['Лев',723,822],['Діва',823,922],['Терези',923,1022],['Скорпіон',1023,1121],['Стрілець',1122,1221]];return rows.find(([,a,b])=>md>=a&&md<=b)?.[0]||null}
function personal78(){
 const historyRaw=store78('la_journal',[]),history=Array.isArray(historyRaw)?historyRaw:[],favsRaw=store78('la_favorites',[]),favs=new Set(Array.isArray(favsRaw)?favsRaw:[]),topicScores=new Map(TOPIC_DEFS.map(([k])=>[k,0])),cardScores=new Map();
 for(const x of history){
   const weight=favs.has(x?.id)?2:1,text=[x?.question,x?.title,x?.synthesis,x?.type].filter(Boolean).join(' ');
   for(const [key,,rx] of TOPIC_DEFS)if(rx.test(text))topicScores.set(key,(topicScores.get(key)||0)+weight);
   if(x?.type==='love')topicScores.set('relations',(topicScores.get('relations')||0)+weight);
   if(x?.type==='work')topicScores.set('work',(topicScores.get('work')||0)+weight);
   for(const c of Array.isArray(x?.cards)?x.cards:[]){const name=String(c?.name||c?.card||'').trim();if(name)cardScores.set(name,(cardScores.get(name)||0)+weight)}
 }
 const themes=[...topicScores.entries()].filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([key])=>TOPIC_DEFS.find(x=>x[0]===key)?.[1]).filter(Boolean);
 const repeatedCards=[...cardScores.entries()].filter(([,n])=>n>1).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([name])=>name);
 const natal=store78('la_natal_profile',{}),sunSign=sunSign78(natal?.date),enabled=localStorage.getItem(PERSONAL_KEY)!=='0';
 return{enabled,historyCount:history.length,favoriteCount:favs.size,sunSign,themes,repeatedCards};
}
function personalSummary78(p){const bits=[];if(p.historyCount)bits.push(`${p.historyCount} збережених розкладів`);if(p.favoriteCount)bits.push(`${p.favoriteCount} в обраному`);if(p.themes.length)bits.push(`повторювані теми: ${p.themes.join(', ')}`);if(p.repeatedCards.length)bits.push(`карти, що повторюються: ${p.repeatedCards.join(', ')}`);if(p.sunSign)bits.push(`сонячний знак: ${p.sunSign}`);return bits.length?bits.join(' · '):'Поки що даних мало. Персональний контекст сформується зі збережених розкладів і натального профілю.'}
function personalApi78(){const p=personal78();return{enabled:p.enabled,historyCount:p.historyCount,favoriteCount:p.favoriteCount,sunSign:p.sunSign,themes:p.themes,repeatedCards:p.repeatedCards}}
function applyPersonalization78(){
 const root=document.querySelector('#app'),title=root?.querySelector('.top h1')?.textContent?.trim();if(!root||!title)return;const p=personal78(),old=root.querySelector('#personal78');if(old)old.remove();
 if(title.startsWith('Привіт,')){
   const hero=root.querySelector('.hero-premium');if(!hero)return;const s=document.createElement('section');s.id='personal78';s.className='day-card';s.innerHTML=`<div><small>LUMEN PERSONAL · ${p.enabled?'ON':'OFF'}</small><h3>${p.themes[0]?'Твій поточний контекст':'Персоналізація готова'}</h3><p>${tarotEsc(personalSummary78(p))}</p></div><button class="ghost" id="personalToggle78">${p.enabled?'Вимкнути':'Увімкнути'}</button>`;hero.insertAdjacentElement('afterend',s);
 }
 if(title==='Таро'){
   const c=root.querySelector('#content .premium-panel');if(!c)return;const s=document.createElement('div');s.id='personal78';s.className='synthesis';s.innerHTML=`<small>ПЕРСОНАЛЬНИЙ КОНТЕКСТ · ${p.enabled?'УВІМКНЕНО':'ВИМКНЕНО'}</small><p>${tarotEsc(personalSummary78(p))}</p><button class="text-btn" id="personalToggle78">${p.enabled?'Не використовувати в тлумаченні':'Використовувати в тлумаченні'}</button>`;const label=c.querySelector('label');label?c.insertBefore(s,label):c.prepend(s);
 }
}
function tarotState78(){return window.LUMEN_TAROT_STATE?.()||{type:'single',mode:'beginner',spread:'single',count:1}}
function tarotCount(){return tarotState78().count||1}
const THEMED_POSITIONS78={
 conflict:['Суть напруги','Що приховано','Твоя реакція','Що повертає контроль','Наступний крок'],
 closure:['Що завершилось','Що варто відпустити','Що забрати із собою','Наступний крок'],
 new_relationship:['Твоя готовність','Межі','Очікування','Як відкритися без втрати себе'],
 distance:['Стан контакту','Що підтримує довіру','Що створює дистанцію','Реалістичний крок'],
 career_choice:['Перший напрям','Другий напрям','Твій ресурс','Головний ризик','Наступний крок'],
 work_resources:['Поточна ситуація','Твоя сильна сторона','Що виснажує','Практичний крок'],
 month:['Головна тема','Робота / розвиток','Стосунки','Ресурс','Фокус місяця'],
 week:['Що завершити','Що помітити','Куди рухатись']
};
function tarotPositions(count){const {type,spread}=tarotState78();if(type==='three')return['Минуле','Теперішнє','Напрямок'];if(type==='love')return['Почуття','Зв’язок','Наступний крок'];if(type==='work')return['Ситуація','Ресурс','Дія'];if(type==='yesno')return['Тенденція відповіді'];if(type==='single')return['Головний фокус'];if(type==='themed'&&THEMED_POSITIONS78[spread])return THEMED_POSITIONS78[spread].slice(0,count);return Array.from({length:count},(_,i)=>`Позиція ${i+1}`)}
const YESNO_CLIENT_POSITIVE_RX=/(успіх|надія|відновлення|гармон|достаток|цілісн|результат|ясність|воля|дія|майстерність|сміливість|рух|потенціал|розвиток|стабіл|звістка|зрілість|керування|відповідальність|взаємодія|баланс|зв’язок|узгодженість|творення|ресурс)/i;
const YESNO_CLIENT_CAUTION_RX=/(конфлікт|напруга|виклик|навантаження|несвобода|руйнування|невизначеність|прив’язаність|спокуса|пауза|відпускання|страх|межа|перевірка|ризик)/i;
const YESNO_CLIENT_MEDICAL_RX=/(діагноз|лікуван|операц|вагітн|пологи|хвороб|рак|здоров|лікар|ліки|медикамент|препарат|таблет|дозув|доза|симптом|обстеж|pregnan|diagnos|surgery|disease|health|doctor|medicat|medicine|prescription|dose|symptom|treatment)/i;
const YESNO_CLIENT_FINANCIAL_RX=/(кредит|позик|лотере|інвест|акці|крипт|ставк|вигра|фінанс|грош|дохід|зарплат|зароб|бюджет|витрат|прибут|борг|іпотек|банк|депозит|облігац|платіж|податк|loan|lottery|invest|stock|crypto|bet|financ|money|income|salary|budget|expense|profit|debt|mortgage|bank|deposit|bond|payment|tax)/i;
const YESNO_CLIENT_LEGAL_RX=/(суд|вирок|арешт|поліці|закон|юрид|правов|адвокат|юрист|догов(?:ір|ор)|контракт|позов|штраф|криміналь|цивільн.{0,12}справ|прокурат|слідств|затриман|court|arrest|legal|lawyer|attorney|contract|lawsuit|fine|criminal|prosecut|investigat|detention)/i;
const isYesNoClientHighRisk78=question=>YESNO_CLIENT_MEDICAL_RX.test(question||'')||YESNO_CLIENT_FINANCIAL_RX.test(question||'')||YESNO_CLIENT_LEGAL_RX.test(question||'');
function yesNoClient78(question,card){
 const name=card?.name||'Карта';
 if(isYesNoClientHighRisk78(question))return{title:'Тенденція: неоднозначно',synthesis:`Для запиту «${question}» не варто зводити рішення до «так/ні» за картою. Тут важливі факти й профільна порада; Таро може бути лише приводом сформулювати питання.`};
 const text=[name,...(card?.keywords||[])].filter(Boolean).join(' ');
 let score=(YESNO_CLIENT_POSITIVE_RX.test(text)?1:0)-(YESNO_CLIENT_CAUTION_RX.test(text)?1:0);
 if(card?.orientation==='reversed')score-=1;
 if(score>0)return{title:'Тенденція: скоріше так',synthesis:`Карта «${name}» більше підтримує напрямок «так», але не гарантує результат. Перевір, які реальні умови й дії роблять цей варіант можливим.`};
 if(score<0)return{title:'Тенденція: скоріше ні',synthesis:`Карта «${name}» більше підсвічує обмеження або причини не поспішати з «так». Сприймай це як сигнал перевірити ризики й умови, а не як остаточну відмову.`};
 return{title:'Тенденція: неоднозначно',synthesis:`Карта «${name}» не дає достатньо чіткої переваги «так» або «ні». Корисніше уточнити умови рішення й те, що реально залежить від тебе.`};
}
function draw78(count){const pool=[...TAROT78],positions=tarotPositions(count);return Array.from({length:count},(_,i)=>{const c=pool.splice(Math.floor(Math.random()*pool.length),1)[0];return{name:c.name,position:positions[i]||`Позиція ${i+1}`,orientation:Math.random()<.24?'reversed':'upright',keywords:c.keywords,symbol:c.glyph,group:c.groupName,image:c.image}})}
const TAROT_INTERPRET_TIMEOUT_MS=8000;
function tarotInterpretTimeout78(){
 const override=Number(window.LUMEN_TAROT_INTERPRET_TIMEOUT_MS);
 return Number.isFinite(override)&&override>0?Math.min(override,30000):TAROT_INTERPRET_TIMEOUT_MS;
}
function validInterpretPayload78(data){
 return !!data&&typeof data==='object'&&!Array.isArray(data)&&(data.blocked===true||typeof data.title==='string'||typeof data.synthesis==='string'||Array.isArray(data.cards));
}
function activeTarotDraw78(content){
 return !!content&&document.querySelector('#content')===content&&!!content.querySelector('.drawing');
}
async function handleDraw78(){const prefs=tarotState78(),q=document.querySelector('#q')?.value.trim()||'Що мені важливо побачити зараз?',count=prefs.count||1,cards=draw78(count),type=prefs.type,spread=type==='themed'?prefs.spread:type,mode=prefs.mode,content=document.querySelector('#content');if(!content)return;content.innerHTML=`<section class="drawing"><div class="badge">LUMEN · 78 CARDS</div><h2>Карти відкрито</h2><div class="cards">${cards.map(x=>`<div class="tarot tarot-classic"><span>${tarotEsc(x.position)}</span><div class="tarot-art"><img class="rws-card-img ${x.orientation==='reversed'?'is-reversed':''}" src="${x.image}" alt="${tarotEsc(x.name)}" decoding="async"><b class="tarot-art-fallback tarot-art-fallback-hidden">${x.symbol}</b></div><strong>${tarotEsc(x.name)}</strong><small>${tarotEsc(x.group)} · ${x.orientation==='reversed'?'перевернута':'пряма'}</small></div>`).join('')}</div><p>Створюю тлумачення…</p></section>`;try{const headers={'content-type':'application/json'},initData=window.Telegram?.WebApp?.initData||'';if(initData)headers['x-telegram-init-data']=initData;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),tarotInterpretTimeout78());let data;try{const r=await fetch('/api/interpret',{method:'POST',headers,signal:controller.signal,body:JSON.stringify({language:'uk',question:q,spread,mode,cards,personalization:personalApi78()})});if(!r.ok)throw new Error(`interpret_${r.status}`);data=await r.json();if(!validInterpretPayload78(data))throw new Error('interpret_invalid_payload')}finally{clearTimeout(timer)}if(!activeTarotDraw78(content))return;render78Result(data,q,cards,type,spread,mode)}catch{if(!activeTarotDraw78(content))return;const p=personal78(),ctx=p.enabled&&p.themes.length?` У твоїй збереженій історії також повторюється тема «${p.themes[0]}»; використай це лише як контекст для роздумів.`:'',yesno=type==='yesno'?yesNoClient78(q,cards[0]):null;render78Result({source:'client-fallback',title:yesno?.title||'Твій розклад',synthesis:(yesno?.synthesis||'Подивись на спільну тему карт і визнач один практичний крок, який залежить від тебе.')+ctx,cards:cards.map(c=>({card:c.name,symbolism:c.keywords.join(' · '),practice:'Зафіксуй одну дію, яку можеш зробити сьогодні.'}))},q,cards,type,spread,mode)}}
function render78Result(r,q,cards,type,spread,mode){const content=document.querySelector('#content');if(!content)return;const sourceLabel=r.source==='client-fallback'?'Локальне тлумачення · сервер недоступний':r.source==='local'?'Локальне тлумачення':'',serverCards=Array.isArray(r.cards)?r.cards:[],outCards=cards.map((c,i)=>{const x=serverCards[i]&&typeof serverCards[i]==='object'?serverCards[i]:{};return{...x,card:x.card||c.name,symbolism:x.symbolism||x.observation||c.keywords.join(' · '),practice:x.practice||''}});content.innerHTML=`<section class="result-premium"><div class="result-head"><div><div class="badge">PREMIUM TAROT · 78</div><h2>${tarotEsc(r.title||'Твій розклад')}</h2><p>${tarotEsc(q)}</p>${sourceLabel?`<div class="badge tarot-source-badge">${tarotEsc(sourceLabel)}</div>`:''}</div></div><div class="reading-cards">${outCards.map((x,i)=>`<article class="reading-card-classic"><div class="card-no">${String(i+1).padStart(2,'0')}</div>${cards[i]?.image?`<div class="reading-card-art"><img class="rws-card-img ${cards[i]?.orientation==='reversed'?'is-reversed':''}" src="${cards[i].image}" alt="${tarotEsc(x.card||cards[i]?.name||'Карта')}" loading="lazy" decoding="async"></div>`:''}<h3>${tarotEsc(x.card||cards[i]?.name||'Карта')}</h3><p>${tarotEsc(x.symbolism||x.observation||cards[i]?.keywords?.join(' · ')||'')}</p>${x.context?`<p>${tarotEsc(x.context)}</p>`:''}${x.practice?`<div class="practice">${tarotEsc(x.practice)}</div>`:''}</article>`).join('')}</div><div class="synthesis"><small>СИНТЕЗ</small><p>${tarotEsc(r.synthesis||'')}</p></div><div class="result-actions"><button class="ghost" id="save78">Зберегти</button><button class="primary" id="again78">Новий розклад</button></div></section>`;document.querySelector('#save78')?.addEventListener('click',e=>{const saveButton=e.currentTarget;if(saveButton.disabled)return;let j=[];try{const saved=JSON.parse(localStorage.getItem('la_journal')||'[]');j=Array.isArray(saved)?saved:[]}catch{};j.unshift({id:crypto?.randomUUID?.()||`la_${Date.now()}`,createdAt:new Date().toLocaleString('uk-UA'),question:q,title:r.title||'Розклад',synthesis:r.synthesis||'',type,spread,mode,cards:cards.map(c=>({name:c.name,position:c.position,orientation:c.orientation,group:c.group}))});localStorage.setItem('la_journal',JSON.stringify(j));saveButton.disabled=true;saveButton.textContent='Збережено';const t=document.querySelector('#toast');if(t){t.textContent='Збережено · персональний контекст оновлено';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1500)}});document.querySelector('#again78')?.addEventListener('click',()=>document.querySelector('#bottom-nav [data-r="reading"]')?.click())}
function renderDeck78(filter='all'){const app=document.querySelector('#app');if(!app)return;const list=filter==='all'?TAROT78:TAROT78.filter(c=>c.group===filter);document.querySelectorAll('#bottom-nav .nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.r==='deck'));app.innerHTML=`<main class="page"><header class="top"><div><div class="brandline">LUMEN ARCANA <span>BETA · PREMIUM</span></div><h1>Колода</h1><p>Класичні ілюстрації Rider–Waite–Smith · 78 карт</p></div><div class="seal">✦</div></header><div id="content"><section class="premium-panel deck-intro"><div class="badge">78 / 78 КАРТ</div><h2>Старші й Молодші Аркани</h2><p class="deck-source-note">Класичні зображення Rider–Waite–Smith зберігаються локально в LUMEN ARCANA та завантажуються поступово.</p><div class="deck-filter-grid">${[['all','Усі'],['major','Старші'],['wands','Жезли'],['cups','Кубки'],['swords','Мечі'],['pentacles','Пентаклі']].map(([k,l])=>`<button class="${filter===k?'primary':'ghost'}" data-deck-filter="${k}">${l}</button>`).join('')}</div></section><section class="deck-grid classic-deck lumen-mt-14">${list.map(c=>`<article><div class="deck-card has-image"><img class="rws-card-img" src="${c.image}" alt="${tarotEsc(c.name)}" loading="lazy" decoding="async"><span class="deck-card-index">${c.group==='major'?String(TAROT_MAJOR.findIndex(x=>x[0]===c.name)).padStart(2,'0'):tarotEsc(c.groupName)}</span></div><h3>${tarotEsc(c.name)}</h3><p>${tarotEsc(c.keywords.slice(0,3).join(' · '))}</p></article>`).join('')}</section></div></main>`;window.LUMEN_DECORATE?.()}
document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(!b)return;if(b.id==='personalToggle78'){e.preventDefault();localStorage.setItem(PERSONAL_KEY,personal78().enabled?'0':'1');applyPersonalization78();return}if(b.id==='draw'){e.preventDefault();e.stopImmediatePropagation();handleDraw78();return}if(b.dataset.deckFilter){e.preventDefault();renderDeck78(b.dataset.deckFilter);return}if(b.matches('#bottom-nav [data-r="home"],#bottom-nav [data-r="reading"]')||b.id==='start'||b.id==='again78')setTimeout(applyPersonalization78,0)},true);
document.addEventListener('error',e=>{
  const img=e.target;
  if(!(img instanceof HTMLImageElement)||!img.classList.contains('rws-card-img'))return;
  img.classList.add('image-failed');
  const fallback=img.parentElement?.querySelector('.tarot-art-fallback');
  if(fallback){
    fallback.classList.remove('tarot-art-fallback-hidden');
    fallback.classList.add('tarot-art-fallback-visible');
  }
},true);
setTimeout(applyPersonalization78,0);
window.LUMEN_RENDER_DECK78=renderDeck78;
window.LUMEN_TAROT78=TAROT78;
window.LUMEN_PERSONAL=personal78;
window.LUMEN_REFRESH_TAROT_UI?.();