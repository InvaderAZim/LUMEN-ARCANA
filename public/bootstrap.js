await import('/app.js?v=3.0.0-beta.1-a10');

const optionalModules=[
  ['background','/background.js?v=3.0.0-beta.1-a1'],
  ['extensions','/extensions.js?v=3.0.0-beta.1-a7'],
  ['tarot78','/tarot78.js?v=3.0.0-beta.1-a2'],
  ['exportCompat','/export-compat.js?v=3.0.0-beta.1-a1']
];

const settled=await Promise.allSettled(
  optionalModules.map(([,url])=>import(url))
);

const failed=settled
  .map((result,index)=>result.status==='rejected'?optionalModules[index][0]:null)
  .filter(Boolean);

window.LUMEN_BOOT_STATUS={ok:failed.length===0,failed};

if(failed.length){
  console.warn('LUMEN optional modules failed:',failed);
}

try{
  await import('/day-card-visual.js?v=3.0.0-beta.1-a2');
}catch(error){
  window.LUMEN_BOOT_STATUS.failed.push('dayCardVisual');
  window.LUMEN_BOOT_STATUS.ok=false;
  console.warn('LUMEN day card visual failed',error);
}
