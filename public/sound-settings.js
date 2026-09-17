(()=>{
  const KEY='la_sound_enabled';
  const VOLUME_KEY='la_sound_volume';
  const enabled=()=>localStorage.getItem(KEY)!=='0';
  const volume=()=>{
    const raw=localStorage.getItem(VOLUME_KEY);
    const value=raw===null?100:Number(raw);
    return Number.isFinite(value)?Math.max(0,Math.min(100,Math.round(value))):100;
  };

  function dispatch(value=enabled(),level=volume()){
    window.dispatchEvent(new CustomEvent('lumen:sound-change',{detail:{enabled:value,volume:level}}));
  }

  function render(){
    const app=document.querySelector('#app');
    const title=app?.querySelector('.top h1')?.textContent?.trim();
    const grid=[...(app?.querySelectorAll('.premium-panel')||[])].find(panel=>panel.querySelector('.badge')?.textContent?.trim()==='НАЛАШТУВАННЯ')?.querySelector('.settings-grid');
    if(title!=='Профіль'||!grid||grid.querySelector('#lumenSoundSetting'))return;

    const on=enabled();
    const level=volume();
    const card=document.createElement('article');
    card.id='lumenSoundSetting';
    card.innerHTML=`<small>ЗВУК</small><h3 id="lumenSoundState">${on?'Увімкнено':'Вимкнено'}</h3><p>Старт, фон і звуки кнопок.</p><label style="display:flex;align-items:center;gap:10px;margin-top:10px;cursor:pointer"><input id="lumenSoundToggle" type="checkbox" role="switch" ${on?'checked':''} style="width:20px;height:20px;accent-color:#e5c87d"><span id="lumenSoundLabel">${on?'Звуки активні':'Звуки вимкнені'}</span></label><div style="margin-top:14px"><label for="lumenSoundVolume" style="display:flex;justify-content:space-between;gap:12px;align-items:center"><span>Загальна гучність</span><strong id="lumenSoundVolumeValue">${level}%</strong></label><input id="lumenSoundVolume" type="range" min="0" max="100" step="1" value="${level}" aria-label="Загальна гучність" style="width:100%;margin-top:8px;accent-color:#e5c87d"></div>`;
    grid.append(card);

    const toggle=card.querySelector('#lumenSoundToggle');
    toggle?.addEventListener('change',()=>{
      const value=!!toggle.checked;
      localStorage.setItem(KEY,value?'1':'0');
      const state=card.querySelector('#lumenSoundState');
      const label=card.querySelector('#lumenSoundLabel');
      if(state)state.textContent=value?'Увімкнено':'Вимкнено';
      if(label)label.textContent=value?'Звуки активні':'Звуки вимкнені';
      dispatch(value,volume());
      const toast=document.querySelector('#toast');
      if(toast){toast.textContent=value?'Звуки увімкнено':'Звуки вимкнено';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1400)}
    });

    const slider=card.querySelector('#lumenSoundVolume');
    slider?.addEventListener('input',()=>{
      const level=Math.max(0,Math.min(100,Number(slider.value)||0));
      localStorage.setItem(VOLUME_KEY,String(level));
      const value=card.querySelector('#lumenSoundVolumeValue');
      if(value)value.textContent=`${level}%`;
      dispatch(enabled(),level);
    });
  }

  window.LUMEN_SOUND_ENABLED=enabled;
  window.LUMEN_SOUND_VOLUME=volume;
  render();
  new MutationObserver(()=>requestAnimationFrame(render)).observe(document.querySelector('#app')||document.body,{childList:true,subtree:true});
})();
