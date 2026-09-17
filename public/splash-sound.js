(()=>{
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtx)return;

  let played=false;
  let ctx=null;

  function scheduleChime(audioCtx){
    if(played)return;
    played=true;
    window.LUMEN_SPLASH_SOUND_PLAYED=true;

    const now=audioCtx.currentTime;
    const master=audioCtx.createGain();
    master.gain.setValueAtTime(0.0001,now);
    master.gain.exponentialRampToValueAtTime(0.035,now+0.025);
    master.gain.exponentialRampToValueAtTime(0.0001,now+1.45);
    master.connect(audioCtx.destination);

    const tones=[
      {freq:523.25,delay:0,duration:1.15,gain:0.72},
      {freq:783.99,delay:0.11,duration:1.18,gain:0.40},
      {freq:1046.5,delay:0.24,duration:0.92,gain:0.20}
    ];

    for(const tone of tones){
      const osc=audioCtx.createOscillator();
      const gain=audioCtx.createGain();
      osc.type='sine';
      osc.frequency.setValueAtTime(tone.freq,now+tone.delay);
      gain.gain.setValueAtTime(0.0001,now+tone.delay);
      gain.gain.exponentialRampToValueAtTime(tone.gain,now+tone.delay+0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001,now+tone.delay+tone.duration);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now+tone.delay);
      osc.stop(now+tone.delay+tone.duration+0.04);
    }

    setTimeout(()=>{try{audioCtx.close()}catch{}},1800);
  }

  async function tryPlay(){
    if(played)return true;
    try{
      ctx ||= new AudioCtx();
      if(ctx.state==='suspended')await ctx.resume();
      if(ctx.state!=='running')return false;
      scheduleChime(ctx);
      cleanupFallback();
      return true;
    }catch{
      return false;
    }
  }

  function onFirstInteraction(){void tryPlay()}
  function cleanupFallback(){
    document.removeEventListener('pointerdown',onFirstInteraction,true);
    document.removeEventListener('touchstart',onFirstInteraction,true);
    document.removeEventListener('keydown',onFirstInteraction,true);
  }

  document.addEventListener('pointerdown',onFirstInteraction,true);
  document.addEventListener('touchstart',onFirstInteraction,true);
  document.addEventListener('keydown',onFirstInteraction,true);

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>void tryPlay(),{once:true});
  }else{
    void tryPlay();
  }
})();
