(()=>{
  const sound=new Audio('/button-sound.mp3?v=20260917btn63');
  sound.preload='auto';
  sound.playsInline=true;
  sound.volume=0.52;

  function play(){
    try{
      sound.pause();
      sound.currentTime=0;
      const p=sound.play();
      if(p&&typeof p.catch==='function')p.catch(()=>{});
    }catch{}
  }

  function targetButton(target){
    if(!(target instanceof Element))return null;
    const button=target.closest('button,[role="button"],input[type="button"],input[type="submit"],input[type="reset"]');
    if(!button||button.closest('#bottom-nav'))return null;
    if(button.matches(':disabled,[aria-disabled="true"]'))return null;
    return button;
  }

  document.addEventListener('pointerdown',event=>{
    if(targetButton(event.target))play();
  },true);

  document.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    if(targetButton(event.target))play();
  },true);

  window.LUMEN_BUTTON_SOUND=sound;
})();
