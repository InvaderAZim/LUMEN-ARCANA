(()=>{
  const BASE_VOLUME=0.8;
  const audio=new Audio('/startup-sound.mp3?v=20260917startup59');
  audio.preload='auto';
  audio.playsInline=true;

  const soundEnabled=()=>localStorage.getItem('la_sound_enabled')!=='0';
  const volumeLevel=()=>{
    const raw=localStorage.getItem('la_sound_volume');
    const value=raw===null?100:Number(raw);
    return Number.isFinite(value)?Math.max(0,Math.min(100,value))/100:1;
  };
  const applyVolume=()=>{audio.volume=BASE_VOLUME*volumeLevel()};
  applyVolume();

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
    applyVolume();
    if(event.detail?.enabled===false){audio.pause();cleanupFallback()}
  });
  window.LUMEN_SPLASH_SOUND=audio;
})();
