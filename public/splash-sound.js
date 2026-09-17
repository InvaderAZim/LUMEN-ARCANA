(()=>{
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtx)return;

  let played=false;
  let ctx=null;

  function scheduleShimmer(audioCtx){
    if(played)return;
    played=true;
    window.LUMEN_SPLASH_SOUND_PLAYED=true;

    const now=audioCtx.currentTime;
    const end=now+3;

    const master=audioCtx.createGain();
    master.gain.setValueAtTime(0.0001,now);
    master.gain.exponentialRampToValueAtTime(0.075,now+0.28);
    master.gain.setValueAtTime(0.075,now+1.9);
    master.gain.exponentialRampToValueAtTime(0.0001,end);
    master.connect(audioCtx.destination);

    const sparkleBus=audioCtx.createGain();
    sparkleBus.gain.setValueAtTime(0.55,now);
    sparkleBus.connect(master);

    const tones=[
      {from:620,to:930,delay:0.00,duration:2.80,gain:0.28,pan:-0.45},
      {from:930,to:1395,delay:0.14,duration:2.55,gain:0.20,pan:0.42},
      {from:1240,to:1860,delay:0.32,duration:2.20,gain:0.13,pan:-0.18},
      {from:1860,to:2480,delay:0.58,duration:1.85,gain:0.09,pan:0.26}
    ];

    for(const tone of tones){
      const start=now+tone.delay;
      const stop=Math.min(end,start+tone.duration);
      const osc=audioCtx.createOscillator();
      const gain=audioCtx.createGain();
      const panner=typeof audioCtx.createStereoPanner==='function'?audioCtx.createStereoPanner():null;

      osc.type='sine';
      osc.frequency.setValueAtTime(tone.from,start);
      osc.frequency.exponentialRampToValueAtTime(tone.to,stop);
      gain.gain.setValueAtTime(0.0001,start);
      gain.gain.exponentialRampToValueAtTime(tone.gain,start+0.32);
      gain.gain.setValueAtTime(tone.gain,Math.max(start+0.33,stop-0.65));
      gain.gain.exponentialRampToValueAtTime(0.0001,stop);

      if(panner){
        panner.pan.setValueAtTime(tone.pan,start);
        panner.pan.linearRampToValueAtTime(-tone.pan,stop);
        osc.connect(gain);gain.connect(panner);panner.connect(sparkleBus);
      }else{
        osc.connect(gain);gain.connect(sparkleBus);
      }
      osc.start(start);
      osc.stop(stop+0.03);
    }

    const shimmerTimes=[0.42,0.78,1.12,1.48,1.86,2.18];
    shimmerTimes.forEach((offset,i)=>{
      const start=now+offset;
      const osc=audioCtx.createOscillator();
      const gain=audioCtx.createGain();
      const panner=typeof audioCtx.createStereoPanner==='function'?audioCtx.createStereoPanner():null;
      osc.type='sine';
      osc.frequency.setValueAtTime(2200+i*145,start);
      osc.frequency.exponentialRampToValueAtTime(3100+i*120,start+0.34);
      gain.gain.setValueAtTime(0.0001,start);
      gain.gain.exponentialRampToValueAtTime(0.06,start+0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001,start+0.38);
      if(panner){
        panner.pan.setValueAtTime(i%2?-0.55:0.55,start);
        panner.pan.linearRampToValueAtTime(i%2?0.35:-0.35,start+0.38);
        osc.connect(gain);gain.connect(panner);panner.connect(master);
      }else{
        osc.connect(gain);gain.connect(master);
      }
      osc.start(start);
      osc.stop(start+0.4);
    });

    setTimeout(()=>{try{audioCtx.close()}catch{}},3350);
  }

  async function tryPlay(){
    if(played)return true;
    try{
      ctx ||= new AudioCtx();
      if(ctx.state==='suspended')await ctx.resume();
      if(ctx.state!=='running')return false;
      scheduleShimmer(ctx);
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
