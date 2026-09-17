// LUMEN ARCANA — resilient PNG download compatibility layer.
// Keeps natal/export rendering untouched and improves the final browser/WebView handoff.
const tg=window.Telegram?.WebApp;
const toast=document.querySelector('#toast');
const blobRegistry=new Map();
const protectedUrls=new Set();
const originalCreateObjectURL=URL.createObjectURL.bind(URL);
const originalRevokeObjectURL=URL.revokeObjectURL.bind(URL);
const originalAnchorClick=HTMLAnchorElement.prototype.click;

const flash=t=>{
  if(!toast)return;
  toast.textContent=t;
  toast.classList.add('show');
  clearTimeout(window.__lumenExportToastTimer);
  window.__lumenExportToastTimer=setTimeout(()=>toast.classList.remove('show'),2400);
};

URL.createObjectURL=function(value){
  const url=originalCreateObjectURL(value);
  if(value instanceof Blob)blobRegistry.set(url,value);
  return url;
};

URL.revokeObjectURL=function(url){
  if(protectedUrls.has(url)){
    setTimeout(()=>{
      protectedUrls.delete(url);
      blobRegistry.delete(url);
      try{originalRevokeObjectURL(url)}catch{}
    },30000);
    return;
  }
  blobRegistry.delete(url);
  return originalRevokeObjectURL(url);
};

function closeFallback(){document.querySelector('#lumenPngFallback')?.remove()}

function showFallback(url,blob){
  closeFallback();
  const file=new File([blob], 'lumen-natal-classic.png', {type:'image/png'});
  const canShare=typeof navigator.share==='function'&&typeof navigator.canShare==='function'&&navigator.canShare({files:[file]});
  const box=document.createElement('div');
  box.id='lumenPngFallback';
  box.className='lumen-png-fallback';
  box.innerHTML=`<div><strong>PNG готовий</strong><small>Якщо Telegram не завантажив файл автоматично, відкрий або збережи його вручну.</small></div><div class="lumen-png-actions"><button type="button" data-png-open>Відкрити PNG</button>${canShare?'<button type="button" class="primary" data-png-share>Поділитися / зберегти</button>':''}<button type="button" class="ghost" data-png-close>×</button></div>`;
  document.body.append(box);
  box.querySelector('[data-png-open]')?.addEventListener('click',()=>{
    const w=window.open(url,'_blank','noopener,noreferrer');
    if(!w)location.href=url;
  });
  box.querySelector('[data-png-share]')?.addEventListener('click',async()=>{
    try{
      await navigator.share({files:[file],title:'LUMEN ARCANA · Натальна карта'});
      flash('Відкрито меню збереження PNG');
    }catch(err){
      if(err?.name!=='AbortError')flash('Не вдалося відкрити меню збереження');
    }
  });
  box.querySelector('[data-png-close]')?.addEventListener('click',closeFallback);
  setTimeout(closeFallback,30000);
}

HTMLAnchorElement.prototype.click=function(){
  const isNatalPng=this.download==='lumen-natal-classic.png'&&String(this.href||'').startsWith('blob:');
  if(!isNatalPng)return originalAnchorClick.call(this);

  const url=this.href;
  const blob=blobRegistry.get(url);
  protectedUrls.add(url);
  this.rel='noopener';
  this.style.display='none';
  const appended=!this.isConnected;
  if(appended)document.body.append(this);

  try{
    originalAnchorClick.call(this);
    flash('PNG створено · завантаження розпочато');
  }catch{
    flash('PNG створено · відкрий файл вручну');
  }finally{
    if(appended)setTimeout(()=>this.remove(),0);
  }

  if(blob&&(tg?.initData||/Android/i.test(navigator.userAgent)||/Telegram/i.test(navigator.userAgent))){
    showFallback(url,blob);
  }
};
