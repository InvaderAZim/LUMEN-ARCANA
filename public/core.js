export const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,m=>({
  '&':'&amp;',
  '<':'&lt;',
  '>':'&gt;',
  '"':'&quot;',
  "'":'&#39;'
}[m]));

export function parseLocal(key,fallback){
  try{
    const raw=localStorage.getItem(key);
    return raw==null?fallback:JSON.parse(raw);
  }catch{
    return fallback;
  }
}

export function flashToast(toast,text,duration=1700){
  if(!toast)return;
  toast.textContent=text;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),duration);
}

export function pageShell(app,title,sub='',sealHtml='☾'){
  if(!app)throw new Error('LUMEN app root is unavailable');
  app.innerHTML=`<main class="page"><header class="top"><div><div class="brandline">LUMEN ARCANA <span>BETA · PREMIUM</span></div><h1>${escapeHtml(title)}</h1>${sub?`<p>${escapeHtml(sub)}</p>`:''}</div><div class="seal">${sealHtml}</div></header><div id="content"></div></main>`;
  return app.querySelector('#content');
}
