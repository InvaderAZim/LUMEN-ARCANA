import { parseLocal as safeParseLocal } from './core.js';
import { zodiacArt, sunSign } from './zodiac.js';

const DAILY_BANK={general:['Сьогодні варто зосередитися на одному головному напрямі й не розпорошувати увагу.','День підходить для спокійного перегляду планів і точкового руху вперед.','Корисно відокремити термінове від важливого та залишити запас часу для себе.','Не поспішай із висновками: спочатку перевір факти, потім реагуй.','Сьогодні сильніший ефект дадуть прості дії, доведені до кінця.'],work:['Закрий одну незавершену задачу до того, як брати наступну.','У роботі зроби ставку на точність, а не на швидкість.','Добрий день для структурування, перевірки й наведення порядку.','Складне питання краще розкласти на кілька конкретних кроків.','Не бери на себе зайвого: результат сьогодні важливіший за кількість задач.'],money:['У фінансах краще уникати імпульсивних рішень і перевірити дрібні витрати.','Сьогодні корисніше зберегти контроль над бюджетом, ніж шукати швидку вигоду.','Перед покупкою дай собі паузу й запитай: це потреба чи емоція?','Хороший день для перегляду регулярних платежів і фінансових пріоритетів.','Сфокусуйся на тому, що реально можна оптимізувати вже сьогодні.'],relations:['Говори прямо, але без зайвої різкості — сьогодні це дасть більше ясності.','Не вгадуй чужі мотиви: краще поставити одне конкретне питання.','У стосунках сьогодні важливіші увага й присутність, ніж довгі пояснення.','Залиш простір і собі, і іншій людині — не кожну паузу треба заповнювати.','Якщо щось зачепило, спочатку назви власне відчуття, а не звинувачення.'],wellbeing:['Підтримай звичний режим і не перевантажуй день зайвими стимулами.','Організму сьогодні корисний стабільний ритм: вода, їжа, рух і нормальний сон.','Зверни увагу на втому раніше, ніж вона стане дратівливістю.','Коротка прогулянка або пауза без екрана може добре перезавантажити увагу.','Не вимагай від себе максимуму весь день — залиш резерв енергії.'],focus:['Одна завершена справа.','Менше шуму — більше точності.','Спочатку факти, потім висновки.','Збережи енергію для головного.','Скажи собі чесно, що сьогодні справді важливо.']};

const FORECAST_OPTIONS=[
  {id:'daily',label:'Щоденний прогноз'},
  {id:'tomorrow',label:'Прогноз на завтра'},
  {id:'week',label:'Прогноз на тиждень'},
  {id:'month',label:'Прогноз на місяць'}
];

function addDays(date,days){
  const copy=new Date(date);
  copy.setDate(copy.getDate()+days);
  return copy;
}

function periodLabel(now,type){
  if(type==='daily') return now.toLocaleDateString('uk-UA');
  if(type==='tomorrow') return addDays(now,1).toLocaleDateString('uk-UA');
  if(type==='week'){
    const end=addDays(now,6);
    const startText=now.toLocaleDateString('uk-UA',{day:'numeric',month:'short'});
    const endText=end.toLocaleDateString('uk-UA',{day:'numeric',month:'short',year:'numeric'});
    return `${startText} — ${endText}`;
  }
  return now.toLocaleDateString('uk-UA',{month:'long',year:'numeric'});
}

function periodDate(now,type){
  if(type==='tomorrow') return addDays(now,1);
  return new Date(now);
}

function periodize(text,type){
  if(type==='daily') return text;
  const variants={
    tomorrow:[['Сьогодні','Завтра'],['сьогодні','завтра'],['День','Завтрашній день'],['день','завтрашній день']],
    week:[['Сьогодні','Цього тижня'],['сьогодні','цього тижня'],['День','Тиждень'],['день','тиждень']],
    month:[['Сьогодні','Цього місяця'],['сьогодні','цього місяця'],['День','Місяць'],['день','місяць']]
  };
  return (variants[type]||[]).reduce((value,[from,to])=>value.replaceAll(from,to),text);
}

export function renderDaily(shell){
  const now=new Date();
  const saved=safeParseLocal('la_natal_profile',{});
  const sign=sunSign(saved.date);
  const birthDate=saved.date?String(saved.date).split('-').reverse().join('.'):'';
  const c=shell('Гороскоп','');
  const page=c.closest('.page');
  const subtitle=page?.querySelector('.top p');
  subtitle?.classList.add('daily-date');

  const paint=(type='daily')=>{
    const option=FORECAST_OPTIONS.find(item=>item.id===type)||FORECAST_OPTIONS[0];
    const anchor=periodDate(now,option.id);
    const periodOffset={daily:0,tomorrow:19,week:43,month:79}[option.id]||0;
    const key=Number(`${anchor.getFullYear()}${String(anchor.getMonth()+1).padStart(2,'0')}${String(anchor.getDate()).padStart(2,'0')}`)+(saved.date?Number(saved.date.replaceAll('-','')):17)+periodOffset;
    const pick=(arr,o=0)=>periodize(arr[(key+o)%arr.length],option.id);

    if(subtitle) subtitle.textContent=periodLabel(now,option.id);

    c.innerHTML=`<section class="horoscope-period-menu" aria-label="Період прогнозу">${FORECAST_OPTIONS.map(item=>`<button type="button" class="horoscope-period-option${item.id===option.id?' active':''}" data-forecast-period="${item.id}" aria-pressed="${item.id===option.id}">${item.label}</button>`).join('')}</section><section class="hero-premium"><div class="hero-copy"><h2 class="zodiac-daily-title"><span>${sign?sign[0]:''}</span></h2><p>${pick(DAILY_BANK.general)}</p></div><div class="arcana-mark zodiac-daily-mark">${sign?zodiacArt(sign,'zodiac-art-daily'):'<span>☀</span><strong>✦</strong>'}${birthDate?`<small>${birthDate}</small>`:''}</div></section><section class="settings-grid lumen-mt-14"><article><small>РОБОТА</small><p>${pick(DAILY_BANK.work,1)}</p></article><article><small>ФІНАНСИ</small><p>${pick(DAILY_BANK.money,2)}</p></article><article><small>СТОСУНКИ</small><p>${pick(DAILY_BANK.relations,3)}</p></article><article><small>САМОПОЧУТТЯ</small><p>${pick(DAILY_BANK.wellbeing,4)}</p></article></section>`;

    c.querySelectorAll('[data-forecast-period]').forEach(button=>{
      button.onclick=()=>paint(button.dataset.forecastPeriod);
    });
  };

  paint('daily');
}
