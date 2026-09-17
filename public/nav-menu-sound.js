(()=>{
  const navSound=new Audio('/nav-menu-sound.mp3?v=20260917nav62');
  navSound.preload='auto';
  navSound.playsInline=true;
  navSound.volume=0.58;

  const buttonSound=new Audio('/button-sound.mp3?v=20260917btn63');
  buttonSound.preload='auto';
  buttonSound.playsInline=true;
  buttonSound.volume=0.52;

  const soundEnabled=()=>localStorage.getItem('la_sound_enabled')!=='0';

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
    if(event.detail?.enabled===false){navSound.pause();buttonSound.pause()}
  });

  window.LUMEN_NAV_SOUND=navSound;
  window.LUMEN_BUTTON_SOUND=buttonSound;
})();
