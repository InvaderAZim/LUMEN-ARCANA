(()=>{
  const audio=new Audio('/startup-sound.mp3?v=20260917startup59');
  audio.preload='auto';
  audio.playsInline=true;
  audio.volume=0.8;

  const soundEnabled=()=>localStorage.getItem('la_sound_enabled')!=='0';
  let played=false;
  let trying=false;

  function cleanupFallback(){
    document.removeEventListener('pointerdown',onFirstInteraction,true);
    document.removeEventListener('touchstart',onFirstInteraction,true);
    document.removeEventListener('keydown',onFirstInteraction,true);
  }

  async function tryPlay(){
    if(!soundEnabled()||played||trying)return played;
    trying=true;
    try{
      audio.currentTime=0;
      await audio.play();
      played=true;
      window.LUMEN_SPLASH_SOUND_PLAYED=true;
      cleanupFallback();
      return true;
    }catch{
      return false;
    }finally{
      trying=false;
    }
  }

  function onFirstInteraction(){void tryPlay()}

  if(soundEnabled()){
    document.addEventListener('pointerdown',onFirstInteraction,true);
    document.addEventListener('touchstart',onFirstInteraction,true);
    document.addEventListener('keydown',onFirstInteraction,true);

    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded',()=>void tryPlay(),{once:true});
    }else{
      void tryPlay();
    }
  }

  window.addEventListener('lumen:sound-change',event=>{
    if(event.detail?.enabled===false){audio.pause();cleanupFallback()}
  });
  window.LUMEN_SPLASH_SOUND=audio;
})();
