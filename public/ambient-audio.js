(()=>{
  const ambient=new Audio('/ambient-mystic-forest.mp3?v=20260917ambient60');
  ambient.preload='auto';
  ambient.loop=true;
  ambient.playsInline=true;
  ambient.volume=0.14;

  const soundEnabled=()=>localStorage.getItem('la_sound_enabled')!=='0';
  let started=false;
  let trying=false;
  let startTimer=null;

  function cleanupFallback(){
    document.removeEventListener('pointerdown',onFirstInteraction,true);
    document.removeEventListener('touchstart',onFirstInteraction,true);
    document.removeEventListener('keydown',onFirstInteraction,true);
  }

  async function tryPlay(){
    if(!soundEnabled())return false;
    if(trying||(!document.hidden&&started&&!ambient.paused))return started;
    trying=true;
    try{
      await ambient.play();
      started=true;
      window.LUMEN_AMBIENT_PLAYING=true;
      cleanupFallback();
      return true;
    }catch{
      return false;
    }finally{
      trying=false;
    }
  }

  function onFirstInteraction(){
    if(startTimer){clearTimeout(startTimer);startTimer=null}
    void tryPlay();
  }

  document.addEventListener('pointerdown',onFirstInteraction,true);
  document.addEventListener('touchstart',onFirstInteraction,true);
  document.addEventListener('keydown',onFirstInteraction,true);

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden||!soundEnabled()){
      ambient.pause();
      window.LUMEN_AMBIENT_PLAYING=false;
    }else if(started){
      void tryPlay();
    }
  });

  window.addEventListener('lumen:sound-change',event=>{
    const on=event.detail?.enabled!==false;
    if(!on){
      if(startTimer){clearTimeout(startTimer);startTimer=null}
      ambient.pause();
      window.LUMEN_AMBIENT_PLAYING=false;
    }else if(!document.hidden){
      void tryPlay();
    }
  });

  const scheduleStart=()=>{
    startTimer=setTimeout(()=>{startTimer=null;void tryPlay()},3000);
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',scheduleStart,{once:true});
  }else{
    scheduleStart();
  }

  window.LUMEN_AMBIENT_AUDIO=ambient;
})();
