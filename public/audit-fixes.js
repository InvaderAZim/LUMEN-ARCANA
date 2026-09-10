const LUMEN_HISTORY='la_journal';
const LUMEN_FAVORITES='la_favorites';

function safeJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}}
function uid(){return globalThis.crypto?.randomUUID?.()||`la_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`}
function legacyHistoryId(x,i){return `${x.createdAt||''}|${x.title||''}|${x.question||''}|${i}`}

function normalizeHistoryIds(){
  const history=safeJson(LUMEN_HISTORY,[]);
  if(!Array.isArray(history)||!history.length)return;
  const oldFavs=safeJson(LUMEN_FAVORITES,[]);
  let changed=false;
  const mapped=new Map();
  const normalized=history.map((item,i)=>{
    if(item&&item.id){mapped.set(legacyHistoryId(item,i),item.id);return item}
    const id=uid();changed=true;mapped.set(legacyHistoryId(item||{},i),id);return {...(item||{}),id};
  });
  if(changed)localStorage.setItem(LUMEN_HISTORY,JSON.stringify(normalized));
  if(Array.isArray(oldFavs)&&oldFavs.length){
    const next=[...new Set(oldFavs.map(x=>mapped.get(x)||x).filter(Boolean))];
    if(JSON.stringify(next)!==JSON.stringify(oldFavs))localStorage.setItem(LUMEN_FAVORITES,JSON.stringify(next));
  }
}

function patchPersonalGreeting(){
  const prefs=safeJson('la_profile_prefs',{});
  const name=String(prefs.displayName||'').trim();
  if(!name)return;
  const h=document.querySelector('#app .top h1');
  if(!h||!h.textContent.trim().startsWith('Привіт,'))return;
  const desired=`Привіт, ${name} ✦`;
  if(h.textContent!==desired)h.textContent=desired;
}

function applyDensity(){
  const prefs=safeJson('la_profile_prefs',{});
  const desired=prefs.density==='compact'?'compact':'comfortable';
  if(document.body.dataset.density!==desired)document.body.dataset.density=desired;
}

normalizeHistoryIds();
applyDensity();
patchPersonalGreeting();

let greetingPatchQueued=false;
new MutationObserver(()=>{
  if(greetingPatchQueued)return;
  greetingPatchQueued=true;
  queueMicrotask(()=>{
    greetingPatchQueued=false;
    patchPersonalGreeting();
    applyDensity();
  });
}).observe(document.querySelector('#app')||document.body,{childList:true,subtree:true});

document.addEventListener('click',e=>{
  if(e.target.closest?.('#save'))setTimeout(normalizeHistoryIds,0);
},true);
