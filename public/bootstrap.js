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

