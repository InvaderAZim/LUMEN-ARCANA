import { escapeHtml as esc, parseLocal as safeParseLocal, flashToast, pageShell } from './core.js';
const tg=window.Telegram?.WebApp;
tg?.ready?.();

const LUMEN_EMBLEM_SVG=`<svg class="lumen-emblem-svg" viewBox="0 0 240 240" role="img" aria-label="LUMEN ARCANA">
  <defs>
    <radialGradient id="lgold" cx="50%" cy="50%" r="62%">
      <stop offset="0" stop-color="#fff7cf"/>
      <stop offset=".42" stop-color="#f2d47d"/>
      <stop offset="1" stop-color="#b9852f"/>
    </radialGradient>
  </defs>
  <g class="emblem-orbit-ring" fill="none" stroke="currentColor" stroke-width="1.35" opacity=".8">
    <circle cx="120" cy="120" r="103"/>
    <circle cx="120" cy="120" r="91" opacity=".42"/>
    <circle cx="120" cy="17" r="3.2" fill="currentColor" stroke="none"/>
    <circle cx="223" cy="120" r="3.2" fill="currentColor" stroke="none"/>
    <circle cx="120" cy="223" r="3.2" fill="currentColor" stroke="none"/>
    <circle cx="17" cy="120" r="3.2" fill="currentColor" stroke="none"/>
  </g>
  <g class="emblem-ornament-ring" fill="none" stroke="currentColor" stroke-width="1.8" opacity=".96">
    <path d="M120 26c-5 8-5 13 0 19 5-6 5-11 0-19Zm0 188c-5-8-5-13 0-19-5 6-5 11 0 19Z"/>
    <path d="M26 120c8-5 13-5 19 0-6 5-11 5-19 0Zm188 0c-8-5-13-5-19 0 6 5 11 5 19 0Z"/>
    <path d="M53 49c10-9 22-14 36-16M187 49c-10-9-22-14-36-16M53 191c10 9 22 14 36 16M187 191c-10 9-22 14-36 16"/>
    <path d="M45 73c4 2 7 5 9 9M195 73c-4 2-7 5-9 9M45 167c4-2 7-5 9-9M195 167c-4-2-7-5-9-9"/>
  </g>
  <path class="emblem-crescent" d="M158 52c-35 5-61 34-61 70 0 36 26 65 61 70-11 7-24 11-38 11-46 0-83-37-83-83s37-83 83-83c14 0 27 4 38 11-3 1-7 2-10 4Z" fill="url(#lgold)"/>
  <g class="emblem-star" fill="url(#lgold)">
    <path d="M171 82l5 25 21-14-14 21 25 5-25 5 14 21-21-14-5 25-5-25-21 14 14-21-25-5 25-5-14-21 21 14 5-25Z"/>
    <circle cx="171" cy="119" r="4.5"/>
  </g>
  <g fill="currentColor" opacity=".92">
    <circle cx="69" cy="91" r="2.5"/><circle cx="76" cy="72" r="1.7"/><circle cx="84" cy="60" r="1.3"/>
    <circle cx="70" cy="148" r="2.2"/><circle cx="79" cy="166" r="1.6"/>
  </g>
</svg>`;

function lumenEmblemMarkup(extraClass=""){
  return `<span class="lumen-emblem ${extraClass}" aria-hidden="true">${LUMEN_EMBLEM_SVG}</span>`;
}

function decorateLumen(){
  document.querySelectorAll('.seal').forEach(el=>{
    if(!el.querySelector('.lumen-emblem'))el.innerHTML=lumenEmblemMarkup('seal-emblem');
  });
  document.querySelectorAll('.hero-premium,.day-card,.premium-panel,.result-premium,.profile-card,.premium-strip,.bottom-nav').forEach(el=>{
    if(!el.querySelector(':scope > .lumen-orbit')){
      const orbit=document.createElement('i');
      orbit.className='lumen-orbit';
      orbit.setAttribute('aria-hidden','true');
      el.prepend(orbit);
    }
  });
}
window.LUMEN_DECORATE=decorateLumen;

function syncTelegramInsets(){
  const root=document.documentElement;
  const safe=tg?.safeAreaInset||{};
  const content=tg?.contentSafeAreaInset||{};
  const telegramOpen=!!tg;
  const fullscreen=!!tg?.isFullscreen;

  // Telegram's own top controls (Close / collapse / menu) are not
  // consistently included in contentSafeAreaInset on every Android build.
  const telegramChromeTop=telegramOpen?(fullscreen?112:96):0;
  const top=Math.max(
    Number(content.top)||0,
    Number(safe.top)||0,
    telegramChromeTop
  );
  const bottom=Math.max(
    Number(content.bottom)||0,
    Number(safe.bottom)||0,
    0
  );

  root.style.setProperty('--tg-safe-top',top+'px');
  root.style.setProperty('--tg-safe-bottom',bottom+'px');
  root.toggleAttribute('data-tg-fullscreen',fullscreen);
  root.toggleAttribute('data-telegram-webapp',telegramOpen);
}
syncTelegramInsets();

function enterTelegramFullscreen(){
  if(!tg)return;
  try{tg.expand?.()}catch{}
  try{tg.disableVerticalSwipes?.()}catch{}
  if(!tg.isFullscreen&&typeof tg.requestFullscreen==='function'){
    try{tg.requestFullscreen()}catch(e){console.warn('Telegram fullscreen request failed',e)}
  }
}

enterTelegramFullscreen();
requestAnimationFrame(enterTelegramFullscreen);
setTimeout(enterTelegramFullscreen,120);
setTimeout(enterTelegramFullscreen,500);

tg?.onEvent?.('safeAreaChanged',syncTelegramInsets);
tg?.onEvent?.('contentSafeAreaChanged',syncTelegramInsets);
tg?.onEvent?.('fullscreenChanged',()=>{syncTelegramInsets();if(!tg?.isFullscreen)setTimeout(enterTelegramFullscreen,80)});
tg?.onEvent?.('viewportChanged',()=>{syncTelegramInsets();if(!tg?.isFullscreen)setTimeout(enterTelegramFullscreen,80)});
tg?.onEvent?.('fullscreenFailed',()=>{try{tg?.expand?.()}catch{};syncTelegramInsets()});
requestAnimationFrame(syncTelegramInsets);
setTimeout(syncTelegramInsets,120);
setTimeout(syncTelegramInsets,500);
setTimeout(syncTelegramInsets,1200);
const app=document.querySelector('#app'),nav=document.querySelector('#bottom-nav'),toast=document.querySelector('#toast');
const SPREADS=[['conflict','Ясність після конфлікту',5,'Що приховано у напрузі й що повертає контроль'],['closure','Завершення старої історії',4,'Що варто відпустити, а що забрати із собою'],['new_relationship','Готовність до нових стосунків',4,'Межі, очікування та відкритість'],['distance','Близькість на відстані',4,'Контакт, довіра й реалістичні кроки'],['career_choice','Два професійні напрями',5,'Ресурси, ризики та наступний крок'],['work_resources','Робота і власні ресурси',4,'Де ти сильніший, ніж здається'],['month','Місяць уваги до себе',5,'Головні теми найближчих тижнів'],['week','Підсумок тижня',3,'Що завершити, що помітити, куди рухатись']];
const TAROT_TYPES=[['single','✦','Одна карта','Швидкий фокус на одному питанні',1],['three','III','Три карти','Минуле · теперішнє · напрямок',3],['yesno','◐','Так / Ні','Одна карта + пояснення тенденції',1],['love','♡','Любов','Почуття · зв’язок · наступний крок',3],['work','◇','Робота','Ситуація · ресурс · дія',3],['themed','☾','Тематичні','8 детальних преміальних розкладів',5]];
const LESSONS=[
 ['01','Формулювання запиту','Як ставити питання так, щоб карти допомагали думати, а не підміняли рішення.','Візьми одне питання у формі «що станеться?» і перепиши його так, щоб воно стосувалося твоєї уваги або дій. Наприклад: «Що мені важливо врахувати?» Потім запиши одну дію, яку ти реально контролюєш.'],
 ['02','Символ і припущення','Відокремлюй те, що реально бачиш у карті, від власної інтерпретації.','Обери одну карту. Спочатку запиши три конкретні деталі, які реально бачиш на зображенні, без пояснень. Потім окремо додай дві власні асоціації й познач, де закінчується спостереження та починається інтерпретація.'],
 ['03','Роль позиції','Одна карта змінює сенс залежно від місця у розкладі.','Використай одну й ту саму карту у трьох умовних позиціях: «ресурс», «перешкода» і «наступний крок». Для кожної позиції сформулюй окреме значення одним реченням і порівняй, як змінився сенс карти.'],
 ['04','Зв’язки між картами','Шукай повтори, контрасти, динаміку й послідовність.','Візьми три карти та знайди між ними один повторюваний мотив, один контраст і один напрямок розвитку. Після цього склади короткий синтез із 2–3 речень, не читаючи карти як три ізольовані відповіді.'],
 ['05','Щоденник практики','Фіксуй питання, карти й фактичний результат через час.','Створи один запис: питання, карти, перше тлумачення та одна запланована дія. Через три дні повернися до запису й окремо зафіксуй, що відбулося фактично, а що залишилося лише припущенням.'],
 ['06','Межі тлумачення','Не перетворюй символічну практику на медичну, юридичну чи фінансову пораду.','Візьми складне питання з високою ціною помилки. Розділи його на дві частини: що потребує фактів або профільного фахівця, а що можна безпечно дослідити як власні почуття, пріоритети чи наступні кроки.']
];
const LIBRARY=[
 ['basics','✦','Основи Таро','Як працювати з картою як із символічним інструментом, а не як із вироком.',['Спочатку опиши, що реально бачиш на карті.','Потім назви асоціації та символи.','Лише після цього пов’язуй карту з питанням.','Завершуй конкретною дією або питанням до себе.']],
 ['major','XXII','Старші Аркани','22 архетипи та їх роль у розкладі.',['Старші Аркани часто позначають важливу тему або поворот уваги.','Значення змінюється залежно від позиції у розкладі.','Пряма й перевернута орієнтація не означає автоматично «добре» чи «погано».','Контекст запиту важливіший за окреме ключове слово.']],
 ['questions','?','Як ставити питання','Формулювання, що дають корисніші та безпечніші відповіді.',['Питай «що мені важливо побачити?», а не «що точно станеться?».','Зосереджуйся на тому, на що можеш впливати.','Уникай питань, що вимагають медичного, юридичного чи фінансового рішення.','Одне чітке питання краще за кілька змішаних.']],
 ['spreads','III','Розклади','Як читати одну карту, три карти та тематичні схеми.',['Одна карта — один головний фокус.','Три карти — послідовність або три різні перспективи.','Позиція задає рамку значення карти.','Синтез важливіший за механічне читання кожної карти окремо.']],
 ['symbols','◇','Символи й зв’язки','Повтори, контрасти, напрямки та ритм розкладу.',['Шукай повторювані образи й мотиви.','Помічай контраст між картами.','Дивись, чи є рух від напруги до ясності або навпаки.','Не підганяй символи під бажану відповідь.']],
 ['safety','◌','Межі тлумачення','Де символічна практика закінчується і потрібні факти або фахівець.',['Таро не замінює лікаря, юриста чи фінансового консультанта.','Не використовуй карти для підтвердження небезпечних рішень.','Не роби категоричних висновків про іншу людину.','У кризовій ситуації пріоритет — реальна допомога, а не розклад.']]
];
const LIBRARY_SECTION_LABELS={
  basics:'ОСНОВИ',
  major:'СТАРШІ АРКАНИ',
  questions:'ПИТАННЯ',
  spreads:'РОЗКЛАДИ',
  symbols:'СИМВОЛИ',
  safety:'БЕЗПЕКА'
};
const DAILY_BANK={general:['Сьогодні варто зосередитися на одному головному напрямі й не розпорошувати увагу.','День підходить для спокійного перегляду планів і точкового руху вперед.','Корисно відокремити термінове від важливого та залишити запас часу для себе.','Не поспішай із висновками: спочатку перевір факти, потім реагуй.','Сьогодні сильніший ефект дадуть прості дії, доведені до кінця.'],work:['Закрий одну незавершену задачу до того, як брати наступну.','У роботі зроби ставку на точність, а не на швидкість.','Добрий день для структурування, перевірки й наведення порядку.','Складне питання краще розкласти на кілька конкретних кроків.','Не бери на себе зайвого: результат сьогодні важливіший за кількість задач.'],money:['У фінансах краще уникати імпульсивних рішень і перевірити дрібні витрати.','Сьогодні корисніше зберегти контроль над бюджетом, ніж шукати швидку вигоду.','Перед покупкою дай собі паузу й запитай: це потреба чи емоція?','Хороший день для перегляду регулярних платежів і фінансових пріоритетів.','Сфокусуйся на тому, що реально можна оптимізувати вже сьогодні.'],relations:['Говори прямо, але без зайвої різкості — сьогодні це дасть більше ясності.','Не вгадуй чужі мотиви: краще поставити одне конкретне питання.','У стосунках сьогодні важливіші увага й присутність, ніж довгі пояснення.','Залиш простір і собі, і іншій людині — не кожну паузу треба заповнювати.','Якщо щось зачепило, спочатку назви власне відчуття, а не звинувачення.'],wellbeing:['Підтримай звичний режим і не перевантажуй день зайвими стимулами.','Організму сьогодні корисний стабільний ритм: вода, їжа, рух і нормальний сон.','Зверни увагу на втому раніше, ніж вона стане дратівливістю.','Коротка прогулянка або пауза без екрана може добре перезавантажити увагу.','Не вимагай від себе максимуму весь день — залиш резерв енергії.'],focus:['Одна завершена справа.','Менше шуму — більше точності.','Спочатку факти, потім висновки.','Збережи енергію для головного.','Скажи собі чесно, що сьогодні справді важливо.']};
let state={route:'home',spread:'conflict',tarotType:localStorage.getItem('la_tarot_type')||'single',result:null,lastQuestion:'',mode:localStorage.getItem('la_mode')||'beginner',libraryTopic:null};
function tarotRuntimeState(){
  const current=TAROT_TYPES.find(x=>x[0]===state.tarotType)||TAROT_TYPES[0];
  const themed=SPREADS.find(x=>x[0]===state.spread)||SPREADS[0];
  return {
    type:state.tarotType,
    mode:state.mode,
    spread:state.spread,
    count:state.tarotType==='themed'?themed[2]:current[4]
  };
}
window.LUMEN_TAROT_STATE=tarotRuntimeState;
function tarotCardBySeed(seed){const deck=window.LUMEN_TAROT78;return Array.isArray(deck)&&deck.length?deck[Math.abs(Number(seed)||0)%deck.length]:null}
const flash=x=>flashToast(toast,x);
const shell=(title,sub='')=>pageShell(app,title,sub,lumenEmblemMarkup('seal-emblem'));
function navigate(route){state.route=route;state.result=null;const enhanced=window.LUMEN_EXT_ROUTES?.[route];if(typeof enhanced==='function'){setNav();enhanced();requestAnimationFrame(decorateLumen);return}render()}
window.LUMEN_NAVIGATE=navigate;
function setNav(){const items=[['home','◉','Сьогодні'],['reading','✦','Розклад'],['library','▤','Бібліотека'],['deck','▦','Колода'],['journal','✎','Щоденник'],['profile','☾','Профіль']];nav.hidden=false;nav.innerHTML=items.map(([r,i,l])=>`<button type="button" class="nav-btn ${state.route===r?'active':''}" data-r="${r}" aria-label="${l}"${state.route===r?' aria-current="page"':''}><b aria-hidden="true">${i}</b><span>${l}</span></button>`).join('');nav.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>navigate(b.dataset.r))}
function hero(){let prefs={};try{prefs=safeParseLocal('la_profile_prefs',{})}catch{}const name=String(prefs.displayName||tg?.initDataUnsafe?.user?.first_name||'друже').trim()||'друже';const c=shell(`Привіт, ${name} ✦`,'Сьогодні гарний день, щоб почути себе.');const now=new Date(),dayCard=tarotCardBySeed(Number(`${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`)),day=dayCard?.name||'Завантаження карти…';c.innerHTML=`<section class="hero-premium home-hero"><div class="hero-copy"><div class="badge">BETA · PREMIUM</div><h2>Відповіді не зовні. Вони вже всередині тебе.</h2><p>Обери простір, з якого хочеш почати. У beta всі доступні функції відкриті без оплати та лімітів.</p><div class="hero-actions"><button type="button" class="primary" id="start">Відкрити Таро</button><button type="button" class="ghost" id="profileGo">Мій профіль</button></div></div></section><section class="quick-grid home-quick-grid"><button type="button" data-go="reading" aria-label="Таро"><b aria-hidden="true">✦</b><span>Таро<br><small>Розклади й тлумачення</small></span></button><button type="button" data-go="natal" aria-label="Натальна карта"><b aria-hidden="true">◎</b><span>Натальна карта<br><small>Beta-профіль + знак Сонця</small></span></button><button type="button" data-go="daily" aria-label="Щоденний прогноз"><b aria-hidden="true">☀</b><span>Щоденний прогноз<br><small>Фокус на сьогодні</small></span></button><button type="button" data-go="compatibility" aria-label="Сумісність"><b aria-hidden="true">♡</b><span>Сумісність<br><small>Порівняння двох сонячних знаків</small></span></button><button type="button" data-go="moon" aria-label="Місячний календар"><b aria-hidden="true">☾</b><span>Місячний календар<br><small>Фази та орієнтовний цикл</small></span></button><button type="button" data-go="library" aria-label="Бібліотека знань"><b aria-hidden="true">▤</b><span>Бібліотека знань<br><small>6 тематичних розділів</small></span></button></section><section class="day-card"><div><small>КАРТА ДНЯ</small><h3>${day}</h3><p>Подивись, яку тему ця карта підсвічує сьогодні. Не як вирок — як фокус уваги.</p></div><div class="mini-card"><span>DAY</span><b>✦</b></div></section>`;document.querySelector('#start').onclick=()=>navigate('reading');document.querySelector('#profileGo').onclick=()=>navigate('profile');c.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>navigate(b.dataset.go))}
function reading(){const c=shell('Таро','Обери формат → сформулюй запит → відкрий карти');const {count}=tarotRuntimeState();c.innerHTML=`<section class="premium-panel"><div class="panel-row"><div><div class="badge">УСІ ФОРМАТИ ВІДКРИТІ</div><h2>Який розклад тобі потрібен?</h2></div><select id="mode" aria-label="Тип розкладу" title="Тип розкладу"><option value="beginner" ${state.mode==='beginner'?'selected':''}>Beginner</option><option value="pro" ${state.mode==='pro'?'selected':''}>Pro</option></select></div><div class="quick-grid home-quick-grid tarot-format-grid">${TAROT_TYPES.map(t=>`<button type="button" class="tarot-type-option ${t[0]===state.tarotType?'tarot-type-selected':''}" data-type="${t[0]}" aria-label="${t[2]}"><b aria-hidden="true">${t[1]}</b><span>${t[2]}<br><small>${t[3]}</small></span></button>`).join('')}</div>${state.tarotType==='themed'?`<div class="field-label" id="spreadLabel">Тематичний розклад</div><div class="spread-list" role="group" aria-labelledby="spreadLabel">${SPREADS.map(s=>`<button type="button" class="spread ${s[0]===state.spread?'selected':''}" data-s="${s[0]}"><div><strong>${s[1]}</strong><p>${s[3]}</p></div><span>${s[2]} карт</span></button>`).join('')}</div>`:''}<label for="q">Твій запит</label><textarea id="q" aria-label="Питання для розкладу" placeholder="Напиши питання своїми словами..."></textarea><button type="button" class="primary wide" id="draw">Відкрити ${count===1?'1 карту':count+' карти'}</button></section>`;document.querySelector('#mode').onchange=e=>{state.mode=e.target.value;localStorage.setItem('la_mode',state.mode)};c.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>{state.tarotType=b.dataset.type;localStorage.setItem('la_tarot_type',state.tarotType);reading()});c.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{state.spread=b.dataset.s;reading()});setTimeout(()=>window.LUMEN_APPLY_PERSONAL?.(),0)}
function sunSign(date){if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return null;const [,m,d]=date.split('-').map(Number),md=m*100+d;if(md>=1222||md<=119)return['Козоріг','♑'];const signs=[['Водолій','♒',120,218],['Риби','♓',219,320],['Овен','♈',321,419],['Телець','♉',420,520],['Близнюки','♊',521,620],['Рак','♋',621,722],['Лев','♌',723,822],['Діва','♍',823,922],['Терези','♎',923,1022],['Скорпіон','♏',1023,1121],['Стрілець','♐',1122,1221]];return signs.find(([, ,a,b])=>md>=a&&md<=b)?.slice(0,2)||null}
function natal(){const c=shell('Натальна карта','Beta · дані народження та базовий сонячний профіль'),saved=safeParseLocal('la_natal_profile',{}),sign=sunSign(saved.date);c.innerHTML=`<section class="premium-panel"><div class="badge">NATAL · BETA · PREMIUM</div><h2>Твої дані народження</h2><p class="lumen-muted-copy">Зараз модуль розраховує базовий сонячний знак. Планети, будинки й аспекти не вигадуються без повного астрономічного розрахунку.</p><div class="settings-grid natal-input-grid"><article><small>ДАТА</small><label for="birthDate">Дата народження</label><input id="birthDate" type="date" aria-label="Дата народження" value="${esc(saved.date||'')}" class="lumen-field"></article><article><small>ЧАС</small><label for="birthTime">Час народження</label><input id="birthTime" type="time" aria-label="Час народження" value="${esc(saved.time||'')}" class="lumen-field"></article><article><small>МІСЦЕ</small><label for="birthPlace">Місто</label><input id="birthPlace" aria-label="Місце народження" value="${esc(saved.place||'')}" class="lumen-field"></article><article><small>СТАТУС</small><h3>${sign?`${sign[1]} ${sign[0]}`:'Дані не збережені'}</h3><p>Дані зберігаються на цьому пристрої.</p></article></div><button type="button" class="primary wide" id="saveNatal">Зберегти й розрахувати</button></section>`;document.querySelector('#saveNatal').onclick=()=>{const p={date:birthDate.value,time:birthTime.value,place:birthPlace.value.trim()};if(!p.date)return flash('Вкажи дату народження');localStorage.setItem('la_natal_profile',JSON.stringify(p));natal()}}
function daily(){const c=shell('Щоденний прогноз','Персональний фокус на сьогодні · без фатальних передбачень'),saved=safeParseLocal('la_natal_profile',{}),sign=sunSign(saved.date),now=new Date(),key=Number(`${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`)+(saved.date?Number(saved.date.replaceAll('-','')):17),pick=(arr,o=0)=>arr[(key+o)%arr.length];c.innerHTML=`<section class="hero-premium"><div class="hero-copy"><div class="badge">DAILY · BETA · PREMIUM</div><h2>${sign?`${sign[1]} ${sign[0]} · `:''}Твій фокус на сьогодні</h2><p>${pick(DAILY_BANK.general)}</p></div><div class="arcana-mark"><span>☀</span><strong>${sign?sign[1]:'✦'}</strong><small>${now.toLocaleDateString('uk-UA')}</small></div></section><section class="settings-grid lumen-mt-14"><article><small>РОБОТА</small><p>${pick(DAILY_BANK.work,1)}</p></article><article><small>ФІНАНСИ</small><p>${pick(DAILY_BANK.money,2)}</p></article><article><small>СТОСУНКИ</small><p>${pick(DAILY_BANK.relations,3)}</p></article><article><small>САМОПОЧУТТЯ</small><p>${pick(DAILY_BANK.wellbeing,4)}</p></article></section><section class="day-card"><div><small>ГОЛОВНИЙ ФОКУС</small><h3>${pick(DAILY_BANK.focus,5)}</h3><p>Рефлексивна підказка для планування дня.</p></div><div class="mini-card"><span>TAROT</span><b>✦</b></div></section>`}
function signElement(s){return({'Овен':'Вогонь','Лев':'Вогонь','Стрілець':'Вогонь','Телець':'Земля','Діва':'Земля','Козоріг':'Земля','Близнюки':'Повітря','Терези':'Повітря','Водолій':'Повітря','Рак':'Вода','Скорпіон':'Вода','Риби':'Вода'})[s]||'—'}
function compatibilityText(a,b){const ea=signElement(a),eb=signElement(b);if(ea===eb)return{score:86,title:'Схожий ритм',text:'Багато спільного у способі реагувати й будувати контакт.'};if([['Вогонь','Повітря'],['Повітря','Вогонь'],['Земля','Вода'],['Вода','Земля']].some(x=>x[0]===ea&&x[1]===eb))return{score:78,title:'Взаємне підсилення',text:'Стихії традиційно доповнюють одна одну.'};return{score:64,title:'Баланс через відмінності',text:'Реальна комунікація важливіша за самі знаки.'}}
function compatibility(){const c=shell('Сумісність','Beta · порівняння двох сонячних знаків'),me=safeParseLocal('la_natal_profile',{}),saved=safeParseLocal('la_compatibility',{}),myDate=me.date||saved.myDate||'',partnerDate=saved.partnerDate||'',a=sunSign(myDate),b=sunSign(partnerDate),result=a&&b?compatibilityText(a[0],b[0]):null;c.innerHTML=`<section class="premium-panel"><div class="badge">COMPATIBILITY · BETA · PREMIUM</div><h2>Порівняй дві дати народження</h2><div class="settings-grid"><article><small>ТИ</small><input id="myDate" type="date" aria-label="Моя дата народження" value="${esc(myDate)}" class="lumen-field"></article><article><small>ІНША ЛЮДИНА</small><input id="partnerDate" type="date" aria-label="Дата народження партнера" value="${esc(partnerDate)}" class="lumen-field"></article></div><button type="button" class="primary wide" id="calcCompatibility">Порівняти</button></section>${result?`<section class="day-card"><div><small>СУМІСНІСТЬ · ${result.score}%</small><h3>${a[1]} ${a[0]} + ${b[1]} ${b[0]}</h3><p>${result.text} Це рефлексивна оцінка, а не прогноз стосунків.</p></div><div class="mini-card"><span>PAIR</span><b>♡</b></div></section>`:''}`;document.querySelector('#calcCompatibility').onclick=()=>{const d={myDate:document.querySelector('#myDate').value,partnerDate:document.querySelector('#partnerDate').value};if(!d.myDate||!d.partnerDate)return flash('Вкажи обидві дати');localStorage.setItem('la_compatibility',JSON.stringify(d));compatibility()}}
function moonFallbackData(d=new Date()){const syn=29.530588853,epoch=Date.UTC(2000,0,6,18,14),days=(d.getTime()-epoch)/86400000,p=((days/syn)%1+1)%1,age=p*syn,illum=(1-Math.cos(2*Math.PI*p))/2*100;let name='Новий Місяць',symbol='🌑',focus='Сформулюй один намір без поспіху.';if(p>=.03&&p<.22){name='Молодий Місяць';symbol='🌒';focus='Нарощуй темп поступово.'}else if(p>=.22&&p<.28){name='Перша чверть';symbol='🌓';focus='Перевір рішення дією.'}else if(p>=.28&&p<.47){name='Зростаючий Місяць';symbol='🌔';focus='Розвивай уже розпочате.'}else if(p>=.47&&p<.53){name='Повня';symbol='🌕';focus='Підбий проміжний підсумок.'}else if(p>=.53&&p<.72){name='Спадний Місяць';symbol='🌖';focus='Завершуй зайве.'}else if(p>=.72&&p<.78){name='Остання чверть';symbol='🌗';focus='Переглянь результат.'}else if(p>=.78){name='Старий Місяць';symbol='🌘';focus='Зменш темп і заверши незакрите.'}const next=t=>{let x=t-p;if(x<=.001)x+=1;return new Date(d.getTime()+x*syn*86400000)};return{p,age,illum,name,symbol,focus,newM:next(0),first:next(.25),full:next(.5),last:next(.75)}}
function moon(){const m=moonFallbackData(),fmt=d=>d.toLocaleDateString('uk-UA',{day:'2-digit',month:'long'}),c=shell('Місячний календар','Базовий цикл · fallback режим');c.innerHTML=`<section class="hero-premium"><div class="hero-copy"><div class="badge">LUNAR · FALLBACK</div><h2>${m.symbol} ${m.name}</h2><p>Вік циклу: <b>${m.age.toFixed(1)} дня</b> · освітленість: <b>${Math.round(m.illum)}%</b>.</p><div class="synthesis"><small>ФОКУС ФАЗИ</small><p>${m.focus}</p></div></div><div class="arcana-mark"><span>MOON</span><strong>${m.symbol}</strong><small>${Math.round(m.p*100)}% ЦИКЛУ</small></div></section><section class="settings-grid lumen-mt-14"><article><small>🌑 НОВИЙ МІСЯЦЬ</small><h3>${fmt(m.newM)}</h3><p>Початок нового синодичного циклу.</p></article><article><small>🌓 ПЕРША ЧВЕРТЬ</small><h3>${fmt(m.first)}</h3><p>Приблизно 25% місячного циклу.</p></article><article><small>🌕 ПОВНЯ</small><h3>${fmt(m.full)}</h3><p>Приблизно 50% місячного циклу.</p></article><article><small>🌗 ОСТАННЯ ЧВЕРТЬ</small><h3>${fmt(m.last)}</h3><p>Приблизно 75% місячного циклу.</p></article></section><section class="day-card"><div><small>РЕЖИМ FALLBACK</small><h3>Базове астрономічне наближення</h3><p>Місячний календар продовжує працювати навіть без додаткового модуля. Для enhanced-версії використовується extensions.js.</p></div><div class="mini-card"><span>MOON</span><b>${m.symbol}</b></div></section>`}

function library(){const c=shell('Бібліотека знань','Практичний довідник LUMEN ARCANA');if(state.libraryTopic){const t=LIBRARY.find(x=>x[0]===state.libraryTopic)||LIBRARY[0];c.innerHTML=`<section class="premium-panel"><div class="badge">LIBRARY · BETA · PREMIUM</div><h2>${t[1]} ${t[2]}</h2><p class="lumen-muted-copy">${t[3]}</p><div class="reading-cards">${t[4].map((x,i)=>`<article><div class="card-no">0${i+1}</div><p>${esc(x)}</p></article>`).join('')}</div><div class="result-actions"><button type="button" class="ghost" id="backLibrary">← До бібліотеки</button>${t[0]==='major'?'<button type="button" class="primary" id="openDeck">Відкрити колоду</button>':''}</div></section>`;document.querySelector('#backLibrary').onclick=()=>{state.libraryTopic=null;library()};const d=document.querySelector('#openDeck');if(d)d.onclick=()=>{state.route='deck';state.libraryTopic=null;render()};return}c.innerHTML=`<section class="premium-strip"><span>LIBRARY</span><b>${LIBRARY.length} тематичних розділів</b><small>BETA · PREMIUM</small></section><section class="settings-grid library-grid">${LIBRARY.map(t=>`<article><small class="library-section-label">${LIBRARY_SECTION_LABELS[t[0]]||'РОЗДІЛ'}</small><h3>${t[2]}</h3><p>${t[3]}</p><button type="button" class="text-btn" data-topic="${t[0]}">Читати →</button></article>`).join('')}</section><section class="day-card"><div><small>НАВЧАННЯ</small><h3>Академія · 6 уроків</h3><p>Послідовна практика: питання, символи, позиції, зв’язки, щоденник і межі тлумачення.</p></div><button type="button" class="ghost" id="openAcademy">Відкрити</button></section>`;c.querySelectorAll('[data-topic]').forEach(b=>b.onclick=()=>{state.libraryTopic=b.dataset.topic;library()});document.querySelector('#openAcademy').onclick=()=>{state.route='academy';render()}}
function academy(){const c=shell('Академія','Усі уроки відкриті у beta.');c.innerHTML=`<section class="premium-strip"><span>PREMIUM</span><b>6 / 6 уроків доступно</b><small>Без лімітів</small></section><section class="lesson-list">${LESSONS.map(([n,t,d,p])=>{const practiceId=`academy-practice-${n}`;return`<article class="lesson"><div class="lesson-no">${n}</div><div><h3>${t}</h3><p>${d}</p><button type="button" class="text-btn" data-academy-practice aria-expanded="false" aria-controls="${practiceId}">Відкрити практику →</button><div class="extra" id="${practiceId}" aria-hidden="true"><p class="academy-practice"><strong>Практика:</strong> ${esc(p)}</p></div></div></article>`}).join('')}</section>`}
function deck(){if(typeof window.LUMEN_RENDER_DECK78==='function'){window.LUMEN_RENDER_DECK78();return}const c=shell('Колода','Завантаження повної колоди…');c.innerHTML='<section class="empty-state"><div>✦</div><h2>Готуємо 78 карт</h2><p>Повна колода завантажується.</p></section>'}
function journal(){const c=shell('Щоденник','Особистий простір збережених розкладів.'),j=safeParseLocal('la_journal',[]);c.innerHTML=`<section class="premium-strip"><span>PRIVATE</span><b>Дані зберігаються на цьому пристрої</b></section>${j.length?`<section class="journal-list">${j.map(x=>`<article class="journal-item"><time>${esc(x.createdAt||'')}</time><h3>${esc(x.title||x.question||'Розклад')}</h3><p>${esc(x.synthesis||'')}</p></article>`).join('')}</section>`:`<section class="empty-state"><div>✎</div><h2>Щоденник поки порожній</h2><p>Збережи перший розклад — він з’явиться тут.</p><button type="button" class="primary" id="toReading">Зробити розклад</button></section>`}`;const b=document.querySelector('#toReading');if(b)b.onclick=()=>{state.route='reading';render()}}
function profile(){const c=shell('Профіль','Premium beta активовано автоматично.'),name=tg?.initDataUnsafe?.user?.first_name||'LUMEN user';c.innerHTML=`<section class="profile-card"><div class="avatar">☾</div><div><h2>${esc(name)}</h2><p>Telegram Mini App</p></div><span class="premium-chip">BETA · PREMIUM</span></section><section class="settings-grid profile-stats-grid"><article><small>ДОСТУП</small><h3>Premium</h3><p>Усі функції відкриті без оплати до завершення beta.</p></article><article><small>РЕЖИМ</small><h3>${state.mode==='pro'?'Pro':'Beginner'}</h3><p>Змінюється у розділі «Розклад».</p></article><article><small>AI</small><h3>Hybrid</h3><p>AI працює за наявності API; інакше використовується локальний fallback.</p></article><article><small>БЕЗПЕКА</small><h3>Reflective only</h3><p>Без фатальних прогнозів і підміни професійних рішень.</p></article></section>`}
function render(){setNav();({home:hero,reading,natal,daily,compatibility,moon,library,academy,deck,journal,profile}[state.route]||hero)();requestAnimationFrame(decorateLumen)}
document.addEventListener('click',e=>{
  const button=e.target.closest?.('[data-academy-practice]');
  if(!button)return;
  const id=button.getAttribute('aria-controls');
  const panel=id?document.getElementById(id):null;
  if(!panel)return;
  const expanded=button.getAttribute('aria-expanded')==='true';
  const next=!expanded;
  button.setAttribute('aria-expanded',String(next));
  panel.setAttribute('aria-hidden',String(!next));
  panel.classList.toggle('open',next);
});
window.LUMEN_REFRESH_TAROT_UI=()=>{if(state.route==='home')render()};
render();