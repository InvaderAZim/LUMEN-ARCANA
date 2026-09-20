await import('/app.js');

const optionalModules=[
  ['background','/background.js'],
  ['extensions','/extensions.js'],
  ['tarot78','/tarot78.js'],
  ['exportCompat','/export-compat.js']
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
  await import('/day-card-visual.js');
}catch(error){
  window.LUMEN_BOOT_STATUS.failed.push('dayCardVisual');
  window.LUMEN_BOOT_STATUS.ok=false;
  console.warn('LUMEN day card visual failed',error);
}
