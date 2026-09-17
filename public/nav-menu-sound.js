(()=>{
  const sound=new Audio('/nav-menu-sound.mp3?v=20260917nav61');
  sound.preload='auto';
  sound.playsInline=true;
  sound.volume=0.58;

  function play(){
    try{
      sound.pause();
      sound.currentTime=0;
      const p=sound.play();
      if(p&&typeof p.catch==='function')p.catch(()=>{});
    }catch{}
  }

  document.addEventListener('pointerdown',event=>{
    const target=event.target instanceof Element?event.target.closest('#bottom-nav button,#bottom-nav .nav-btn'):null;
    if(target)play();
  },true);

  document.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    const target=event.target instanceof Element?event.target.closest('#bottom-nav button,#bottom-nav .nav-btn'):null;
    if(target)play();
  },true);

  window.LUMEN_NAV_SOUND=sound;
})();
