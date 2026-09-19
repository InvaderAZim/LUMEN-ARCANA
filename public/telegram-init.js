window.__lumenFullscreen=()=>{
  const t=window.Telegram?.WebApp;
  if(!t)return;
  try{t.ready?.()}catch{}
  try{t.expand?.()}catch{}
  try{t.disableVerticalSwipes?.()}catch{}
  try{
    if(!t.isFullscreen&&typeof t.requestFullscreen==='function')t.requestFullscreen();
  }catch{}
};

window.__lumenFullscreen();
requestAnimationFrame(window.__lumenFullscreen);
setTimeout(window.__lumenFullscreen,40);
setTimeout(window.__lumenFullscreen,120);
