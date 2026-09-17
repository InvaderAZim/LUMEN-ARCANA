(()=>{
  const NAV_BASE_VOLUME=0.58;
  const BUTTON_BASE_VOLUME=0.52;

  const navSound=new Audio('/nav-menu-sound.mp3?v=20260917nav62');
  navSound.preload='auto';
  navSound.playsInline=true;

  const buttonSound=new Audio('/button-sound.mp3?v=20260917btn63');
  buttonSound.preload='auto';
  buttonSound.playsInline=true;

  const soundEnabled=()=>localStorage.getItem('la_sound_enabled')!=='0';
  const volumeLevel=()=>{
    const raw=localStorage.getItem('la_sound_volume');
    const value=raw===null?100:Number(raw);
    return Number.isFinite(value)?Math.max(0,Math.min(100,value))/100:1;
  };
  const applyVolume=()=>{
    const level=volumeLevel();
    navSound.volume=NAV_BASE_VOLUME*level;
    buttonSound.volume=BUTTON_BASE_VOLUME*level;
  };
  applyVolume();

  function play(sound){
    if(!soundEnabled())return;
    try{
      sound.pause();
      sound.currentTime=0;
      const p=sound.play();
      if(p&&typeof p.catch==='function')p.catch(()=>{});
    }catch{}
  }

  function navTarget(target){
    return target instanceof Element?target.closest('#bottom-nav button,#bottom-nav .nav-btn'):null;
  }

  function regularButton(target){
    if(!(target instanceof Element))return null;
    const button=target.closest('button,[role="button"],input[type="button"],input[type="submit"],input[type="reset"]');
    if(!button||button.closest('#bottom-nav'))return null;
    if(button.matches(':disabled,[aria-disabled="true"]'))return null;
    return button;
  }

  function handle(target){
    if(navTarget(target)){play(navSound);return}
    if(regularButton(target))play(buttonSound);
  }

  document.addEventListener('pointerdown',event=>handle(event.target),true);

  document.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    handle(event.target);
  },true);

  window.addEventListener('lumen:sound-change',event=>{
    applyVolume();
    if(event.detail?.enabled===false){navSound.pause();buttonSound.pause()}
  });

  window.LUMEN_NAV_SOUND=navSound;
  window.LUMEN_BUTTON_SOUND=buttonSound;
})();
