const SYNODIC_MONTH=29.530588853;
const NEW_MOON_EPOCH=Date.UTC(2000,0,6,18,14,0);

function lunarData(date=new Date()){
  const days=(date.getTime()-NEW_MOON_EPOCH)/86400000;
  const phase=((days/SYNODIC_MONTH)%1+1)%1;
  const age=phase*SYNODIC_MONTH;
  const illumination=(1-Math.cos(2*Math.PI*phase))/2*100;
  let name='Новий Місяць',symbol='●',focus='Тиха точка старту: сформулюй один намір без поспіху.';
  if(phase>=0.03&&phase<0.22){name='Молодий Місяць';symbol='◔';focus='Нарощуй темп поступово: один невеликий крок важливіший за різкий ривок.'}
  else if(phase>=0.22&&phase<0.28){name='Перша чверть';symbol='◐';focus='Час перевірити рішення дією та скоригувати те, що не працює.'}
  else if(phase>=0.28&&phase<0.47){name='Зростаючий Місяць';symbol='◕';focus='Розвивай уже розпочате й не розпорошуй ресурс на зайві напрямки.'}
  else if(phase>=0.47&&phase<0.53){name='Повня';symbol='○';focus='Підбий проміжний підсумок: що стало видимим і потребує чесної оцінки.'}
  else if(phase>=0.53&&phase<0.72){name='Спадний Місяць';symbol='◕';focus='Завершуй зайве й звільняй місце для того, що справді важливо.'}
  else if(phase>=0.72&&phase<0.78){name='Остання чверть';symbol='◐';focus='Переглянь результат і відмовся від того, що більше не дає користі.'}
  else if(phase>=0.78&&phase<0.97){name='Старий Місяць';symbol='◔';focus='Зменш темп, заверши незакрите й залиш простір для відновлення.'}
  const next=(target)=>{let delta=target-phase;if(delta<=0.001)delta+=1;return new Date(date.getTime()+delta*SYNODIC_MONTH*86400000)};
  return {phase,age,illumination,name,symbol,focus,nextNew:next(0),nextFirst:next(.25),nextFull:next(.5),nextLast:next(.75)};
}

function fmt(d){return d.toLocaleDateString('uk-UA',{day:'2-digit',month:'long'});}

function renderMoonCalendar(){
  const app=document.querySelector('#app');
  if(!app)return;
  const m=lunarData();
  app.innerHTML=`<main class="page"><header class="top"><div><div class="brandline">LUMEN ARCANA <span>BETA · PREMIUM</span></div><h1>Місячний календар</h1><p>Поточна фаза й орієнтовний місячний цикл</p></div><div class="seal">☾</div></header><div id="content"><section class="hero-premium"><div class="hero-copy"><div class="badge">LUNAR · BETA</div><h2>${m.symbol} ${m.name}</h2><p>Вік циклу: <b>${m.age.toFixed(1)} дня</b> · освітленість: <b>${Math.round(m.illumination)}%</b>.</p><div class="synthesis"><small>ФОКУС ФАЗИ</small><p>${m.focus}</p></div><div class="hero-actions"><button class="ghost" id="moonBack">На головну</button></div></div><div class="arcana-mark"><span>MOON</span><strong>${m.symbol}</strong><small>${Math.round(m.phase*100)}% ЦИКЛУ</small></div></section><section class="settings-grid" style="margin-top:14px"><article><small>● НОВИЙ МІСЯЦЬ</small><h3>${fmt(m.nextNew)}</h3><p>Початок нового синодичного циклу.</p></article><article><small>◐ ПЕРША ЧВЕРТЬ</small><h3>${fmt(m.nextFirst)}</h3><p>Приблизно 25% місячного циклу.</p></article><article><small>○ ПОВНЯ</small><h3>${fmt(m.nextFull)}</h3><p>Приблизно 50% місячного циклу.</p></article><article><small>◐ ОСТАННЯ ЧВЕРТЬ</small><h3>${fmt(m.nextLast)}</h3><p>Приблизно 75% місячного циклу.</p></article></section><section class="day-card"><div><small>ТОЧНІСТЬ</small><h3>Астрономічне наближення</h3><p>Розрахунок базується на середній тривалості синодичного місяця 29,5306 дня. Для професійних ефемерид і точного часу фаз потрібен окремий астрономічний модуль.</p></div><div class="mini-card"><span>CYCLE</span><b>☾</b></div></section></div></main>`;
  document.querySelector('#moonBack')?.addEventListener('click',()=>document.querySelector('#bottom-nav [data-r="home"]')?.click());
}

function patchMoonTile(){
  const b=document.querySelector('[data-coming="Місячний календар"]');
  if(!b)return;
  const small=b.querySelector('small');
  if(small)small.textContent='Фаза Місяця й цикл';
}

patchMoonTile();
new MutationObserver(patchMoonTile).observe(document.body,{childList:true,subtree:true});
document.addEventListener('click',e=>{
  const b=e.target.closest?.('[data-coming="Місячний календар"]');
  if(!b)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  renderMoonCalendar();
},true);
