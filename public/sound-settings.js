(()=>{
  const KEY='la_sound_enabled';
  const enabled=()=>localStorage.getItem(KEY)!=='0';

  function dispatch(value){
    window.dispatchEvent(new CustomEvent('lumen:sound-change',{detail:{enabled:value}}));
  }

  function render(){
    const app=document.querySelector('#app');
    const title=app?.querySelector('.top h1')?.textContent?.trim();
    const grid=app?.querySelector('.settings-grid');
    if(title!=='Профіль'||!grid||grid.querySelector('#lumenSoundSetting'))return;

    const on=enabled();
    const card=document.createElement('article');
    card.id='lumenSoundSetting';
    card.innerHTML=`<small>ЗВУК</small><h3 id="lumenSoundState">${on?'Увімкнено':'Вимкнено'}</h3><p>Старт, фон і звуки кнопок.</p><label style="display:flex;align-items:center;gap:10px;margin-top:10px;cursor:pointer"><input id="lumenSoundToggle" type="checkbox" role="switch" ${on?'checked':''} style="width:20px;height:20px;accent-color:#e5c87d"><span id="lumenSoundLabel">${on?'Звуки активні':'Звуки вимкнені'}</span></label>`;
    grid.append(card);

    const toggle=card.querySelector('#lumenSoundToggle');
    toggle?.addEventListener('change',()=>{
      const value=!!toggle.checked;
      localStorage.setItem(KEY,value?'1':'0');
      const state=card.querySelector('#lumenSoundState');
      const label=card.querySelector('#lumenSoundLabel');
      if(state)state.textContent=value?'Увімкнено':'Вимкнено';
      if(label)label.textContent=value?'Звуки активні':'Звуки вимкнені';
      dispatch(value);
      const toast=document.querySelector('#toast');
      if(toast){toast.textContent=value?'Звуки увімкнено':'Звуки вимкнено';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1400)}
    });
  }

  window.LUMEN_SOUND_ENABLED=enabled;
  render();
  new MutationObserver(()=>requestAnimationFrame(render)).observe(document.querySelector('#app')||document.body,{childList:true,subtree:true});
})();
