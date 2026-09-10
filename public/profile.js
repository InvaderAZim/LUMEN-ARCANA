const PROFILE_PREFS_KEY='la_profile_prefs';

function getProfilePrefs(){
  try{return JSON.parse(localStorage.getItem(PROFILE_PREFS_KEY)||'{}')}catch{return {}}
}
function saveProfilePrefs(next){localStorage.setItem(PROFILE_PREFS_KEY,JSON.stringify(next))}
function goHomeThen(selector){
  document.querySelector('#bottom-nav [data-r="home"]')?.click();
  setTimeout(()=>document.querySelector(selector)?.click(),0);
}
function profileStats(){
  let history=[],favorites=[];
  try{history=JSON.parse(localStorage.getItem('la_journal')||'[]')}catch{}
  try{favorites=JSON.parse(localStorage.getItem('la_favorites')||'[]')}catch{}
  return {history:history.length,favorites:favorites.length};
}
function renderEnhancedProfile(){
  const root=document.querySelector('#app');
  const title=root?.querySelector('.top h1')?.textContent?.trim();
  const content=root?.querySelector('#content');
  if(!content||title!=='Профіль'||content.dataset.enhancedProfile==='1')return;
  content.dataset.enhancedProfile='1';

  const tg=window.Telegram?.WebApp;
  const telegramUser=tg?.initDataUnsafe?.user;
  const prefs=getProfilePrefs();
  const natal=(()=>{try{return JSON.parse(localStorage.getItem('la_natal_profile')||'{}')}catch{return {}}})();
  const stats=profileStats();
  const fallback=telegramUser?.first_name||'LUMEN user';
  const displayName=prefs.displayName||fallback;
  const mode=localStorage.getItem('la_mode')||'beginner';
  const density=prefs.density||'comfortable';
  const inputStyle='width:100%;background:#090909;color:#fff;border:1px solid #ffffff1c;border-radius:14px;padding:13px;outline:none';

  content.innerHTML=`
    <section class="profile-card">
      <div class="avatar">☾</div>
      <div><h2>${escapeProfile(displayName)}</h2><p>${telegramUser?'Telegram Mini App':'LUMEN ARCANA'}</p></div>
      <span class="premium-chip">PREMIUM BETA</span>
    </section>

    <section class="settings-grid" style="margin-top:12px">
      <article><small>ДОСТУП</small><h3>Premium Beta</h3><p>Усі реалізовані функції відкриті без оплати протягом beta.</p></article>
      <article><small>ІСТОРІЯ</small><h3>${stats.history} записів</h3><p>Обране: ${stats.favorites}. Дані зберігаються локально на цьому пристрої.</p></article>
      <article><small>НАТАЛЬНІ ДАНІ</small><h3>${natal.date?escapeProfile(natal.date):'Не заповнено'}</h3><p>${natal.place?escapeProfile(natal.place):'Місце народження ще не збережене.'}</p></article>
      <article><small>БЕЗПЕКА</small><h3>Reflective only</h3><p>Без фатальних прогнозів і підміни медичних, юридичних чи фінансових рішень.</p></article>
    </section>

    <section class="premium-panel" style="margin-top:14px">
      <div class="badge">НАЛАШТУВАННЯ</div>
      <h2>Персоналізація</h2>
      <div class="settings-grid">
        <article><small>ІМ’Я В LUMEN</small><label for="profileName">Відображуване ім’я</label><input id="profileName" maxlength="40" value="${escapeProfile(displayName)}" style="${inputStyle}"></article>
        <article><small>РЕЖИМ ТАРО</small><label for="profileMode">Режим</label><select id="profileMode" style="${inputStyle}"><option value="beginner" ${mode==='beginner'?'selected':''}>Beginner</option><option value="pro" ${mode==='pro'?'selected':''}>Pro</option></select></article>
        <article><small>ЩІЛЬНІСТЬ ІНТЕРФЕЙСУ</small><label for="profileDensity">Відображення</label><select id="profileDensity" style="${inputStyle}"><option value="comfortable" ${density==='comfortable'?'selected':''}>Комфортне</option><option value="compact" ${density==='compact'?'selected':''}>Компактне</option></select></article>
        <article><small>AI</small><h3>Hybrid</h3><p>AI-тлумачення використовуються лише якщо серверний API підключено; інакше працює локальний fallback.</p></article>
      </div>
      <button class="primary wide" id="saveProfilePrefs">Зберегти налаштування</button>
    </section>

    <section class="quick-grid" style="margin-top:14px">
      <button id="profileNatal"><b>◎</b><span>Натальна карта<br><small>Редагувати дані</small></span></button>
      <button id="profileHistory"><b>✎</b><span>Історія<br><small>Збережені розклади</small></span></button>
      <button id="profileLibrary"><b>▤</b><span>Бібліотека<br><small>Матеріали та Академія</small></span></button>
      <button id="profileHome"><b>◉</b><span>Головна<br><small>Повернутися сьогодні</small></span></button>
    </section>

    <section class="day-card">
      <div><small>ЛОКАЛЬНІ ДАНІ</small><h3>Керування даними</h3><p>Можна стерти історію, обране, натальні дані, сумісність і персональні налаштування лише з цього пристрою.</p></div>
      <button class="ghost" id="clearLocalProfile">Очистити</button>
    </section>`;

  document.querySelector('#saveProfilePrefs')?.addEventListener('click',()=>{
    const displayName=document.querySelector('#profileName')?.value.trim().slice(0,40)||fallback;
    const selectedMode=document.querySelector('#profileMode')?.value==='pro'?'pro':'beginner';
    const selectedDensity=document.querySelector('#profileDensity')?.value==='compact'?'compact':'comfortable';
    saveProfilePrefs({displayName,density:selectedDensity});
    localStorage.setItem('la_mode',selectedMode);
    document.body.dataset.density=selectedDensity;
    const toast=document.querySelector('#toast');if(toast){toast.textContent='Налаштування збережено';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1700)}
    setTimeout(()=>{content.dataset.enhancedProfile='0';renderEnhancedProfile()},50);
  });
  document.body.dataset.density=density;
  document.querySelector('#profileNatal')?.addEventListener('click',()=>goHomeThen('[data-go="natal"]'));
  document.querySelector('#profileHistory')?.addEventListener('click',()=>document.querySelector('#bottom-nav [data-r="journal"]')?.click());
  document.querySelector('#profileLibrary')?.addEventListener('click',()=>document.querySelector('#bottom-nav [data-r="library"]')?.click());
  document.querySelector('#profileHome')?.addEventListener('click',()=>document.querySelector('#bottom-nav [data-r="home"]')?.click());
  document.querySelector('#clearLocalProfile')?.addEventListener('click',()=>{
    if(!confirm('Очистити локальні дані LUMEN ARCANA на цьому пристрої?'))return;
    ['la_journal','la_favorites','la_natal_profile','la_compatibility','la_profile_prefs','la_tarot_type','la_mode'].forEach(k=>localStorage.removeItem(k));
    location.reload();
  });
}
function escapeProfile(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

renderEnhancedProfile();
new MutationObserver(()=>renderEnhancedProfile()).observe(document.querySelector('#app')||document.body,{childList:true,subtree:true});
