const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const context={window:{},console,Math,Set};context.window=context;vm.createContext(context);
for(const f of ['config.js','engine.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',f),'utf8'),context);
const {MP}=context;
const camera={cx:640,cy:350,z:1,tx:0,ty:0};
for(let r=0;r<5;r++){
 const e=new MP.Engine(()=>.3);e.round=r;e.startRound();assert.equal(e.time,60);e.update(59);assert.equal(e.state,'PLAYING');e.update(1);assert.equal(e.state,'READY');assert.equal(e.success,false);assert.match(e.failureReason,/60초/);
 e.startRound();assert.equal(e.time,60);assert.equal(e.failureReason,'');
}
console.log('PASS all five rounds expire at 60 seconds; retry resets timer and reason');
{
 const e=new MP.Engine(()=>.3);e.startRound();e.coins=25;
 for(let i=1;i<=3;i++){e.lock=0;assert.equal(e.shoot(camera).quality,'failed');assert.equal(e.failed,i);assert.equal(e.state,'PLAYING');}
 e.lock=0;const p=e.shoot(camera);assert.equal(p.quality,'failed');assert.equal(e.failed,4);assert.equal(e.state,'READY');assert.equal(e.success,false);assert.equal(e.photos.length,4);assert.equal(e.coins,25);assert.match(e.failureReason,/3장/);
 const before=e.time;e.update(10);assert.equal(e.time,before);assert.equal(e.shoot(camera),null);assert.equal(e.takeEvents().filter(x=>x.type==='finish').length,1);
 e.startRound();assert.equal(e.failed,0);assert.equal(e.coins,25);
}
console.log('PASS three failed photos allowed; fourth immediately ends round once, preserves album/coins, blocks input');
{
 let seed=42;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};const e=new MP.Engine(random);e.startRound();assert.ok(new Set(e.targets.map(m=>m.scale)).size>1);
 for(const m of e.targets){assert.ok(m.scale>=.7&&m.scale<=1.3);assert.ok(Math.abs(m.w/m.h-m.type.w/m.type.h)<1e-10);const w=m.w,h=m.h;e.spawn(m);assert.equal(m.w,w);assert.equal(m.h,h);m.phase='bothEyes';const [a,b]=m.type.eyes;m.x=640-(a[0]+b[0])/2*m.w;m.y=350-(a[1]+b[1])/2*m.h;assert.equal(e.judge(camera).m,m);m.phase='done';}
}
console.log('PASS randomized proportional sizes, stable on reappearance, eye detection matches scaled sprites');
{
 const e=new MP.Engine();e.coins=350;context.engine=e;context.cfg=MP.config;context.imagePath=(kind,id)=>'./assets/images/'+kind+'/'+id+'.png';let html='';context.show=value=>{html=value;};
 const source=fs.readFileSync(path.join(root,'js/main.js'),'utf8').match(/^function shop\(\).*$/m)[0];vm.runInContext(source,context);context.shop();assert.match(html,/id="shop-coins">350 /);assert.equal(e.buy(0),true);context.shop();assert.match(html,/id="shop-coins">250 /);e.coins=0;context.shop();assert.match(html,/id="shop-coins">0 /);assert.match(html,/코인 부족/);
}
console.log('PASS actual shop renderer displays current coins, purchase balance and zero balance');
