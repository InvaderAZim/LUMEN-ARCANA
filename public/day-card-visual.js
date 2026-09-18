const DAY_CARD_SELECTOR='.day-card';

function daySeed(){
  const now=new Date();
  return Number(`${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`);
}

function dayCard(){
  const deck=window.LUMEN_TAROT78;
  return Array.isArray(deck)&&deck.length?deck[Math.abs(daySeed())%deck.length]:null;
}

function decorateDayCard(){
  const deck=window.LUMEN_TAROT78;
  if(!Array.isArray(deck)||!deck.length)return;
  const cards=[...document.querySelectorAll(DAY_CARD_SELECTOR)];
  for(const card of cards){
    const label=card.querySelector('small')?.textContent?.trim();
    if(label!=='КАРТА ДНЯ'||card.dataset.dayVisual==='1')continue;
    const tarot=dayCard();
    const mini=card.querySelector('.mini-card');
    if(!tarot?.image||!mini)continue;
    const safeName=String(tarot.name||'Карта дня').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    card.classList.add('day-card-enhanced');
    mini.classList.add('day-card-art');
    mini.setAttribute('aria-label',safeName);
    mini.innerHTML=`<img src="${tarot.image}" alt="${safeName}" decoding="async" loading="eager"><b class="day-card-art-fallback" aria-hidden="true">✦</b>`;
    const img=mini.querySelector('img');
    img.addEventListener('load',()=>mini.classList.add('is-loaded'),{once:true});
    img.addEventListener('error',()=>{img.remove();mini.classList.add('is-fallback')},{once:true});
    card.dataset.dayVisual='1';
  }
}

const root=document.querySelector('#app');
if(root){
  decorateDayCard();
  const observer=new MutationObserver(()=>requestAnimationFrame(decorateDayCard));
  observer.observe(root,{childList:true,subtree:true});
}
window.LUMEN_DECORATE_DAY_CARD=decorateDayCard;
