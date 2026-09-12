const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),context={window:{},console,Math,Set};context.window=context;vm.createContext(context);
for(const name of ['config.js','engine.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',name),'utf8'),context);
const {MP}=context;
function target(e,index){const type=MP.config.monsters[index];const m={id:0,type,w:type.w,h:type.h,x:300,y:250,baseX:300,baseY:250,direction:1,phase:'bothEyes',age:1,reveal:.65,duration:type.expose,misses:0,captured:false,teleported:false};e.targets=[m];return m;}
function game(round=0){const e=new MP.Engine(()=>.5);e.round=round;e.startRound();return e;}
{
 const speeds=[];for(let i=0;i<5;i++){const e=game(),m=target(e,i);e.moveMonster(m,.1);speeds.push((m.x-300)/.1);}
 for(let i=1;i<5;i++)assert.ok(speeds[i]>speeds[i-1]);
 const e=game(4),m=target(e,3);e.moveMonster(m,.1);assert.ok((m.x-300)/.1>speeds[3]);
}
console.log('PASS harder species and later rounds move faster');
{
 const e=game(),m=target(e,3);m.x=80;m.direction=1;const xs=[];
 for(let i=0;i<240;i++){e.moveMonster(m,1/60);xs.push(m.x);assert.ok(m.x>=75&&m.x<=1160-m.w);}
 assert.ok(Math.max(...xs)-Math.min(...xs)>700);assert.equal(m.direction,-1);
 for(const dt of [7,.02,30,.4,60]){e.moveMonster(m,dt);assert.ok(m.x>=75&&m.x<=1160-m.w);}
 const a=target(game(),3),b={...a};const engine=game();engine.moveMonster(a,4);for(let i=0;i<240;i++)engine.moveMonster(b,1/60);assert.ok(Math.abs(a.x-b.x)<1e-8);assert.equal(a.direction,b.direction);
}
console.log('PASS broad horizontal traversal, edge reversal, long-frame bounds and frame-rate-independent movement');
{
 const e=game(4),m=target(e,4);m.age=m.reveal+MP.config.movement.ghostVisibleTime-.01;e.update(.02);assert.equal(m.phase,'teleport');
 const x=m.x,y=m.y,age=m.age;const eyes=e.geometry(m,{z:2,tx:0,ty:0});const cam={z:2,tx:0,ty:0,cx:(eyes[0].x+eyes[1].x)/2,cy:(eyes[0].y+eyes[1].y)/2};assert.equal(e.judge(cam).m,undefined);
 e.paused=true;const timer=e.time,left=m.teleportLeft;e.update(1);assert.equal(e.time,timer);assert.equal(m.teleportLeft,left);e.paused=false;
 e.update(.3);assert.equal(m.phase,'teleport');assert.equal(m.x,x);e.update(.26);assert.equal(m.phase,'bothEyes');assert.ok(Math.abs(m.x-x)>200);assert.ok(Math.abs(m.y-y)>60);assert.equal(m.age,age);assert.equal(m.captured,false);
 const next=e.geometry(m,{z:2,tx:0,ty:0});const c={z:2,tx:0,ty:0,cx:(next[0].x+next[1].x)/2,cy:(next[0].y+next[1].y)/2};assert.notEqual(e.shoot(c).quality,'failed');e.update(1);assert.equal(m.phase,'done');assert.equal(e.captured,1);
}
console.log('PASS ghost disappears, cannot be photographed while invisible, pauses, relocates and can be captured after returning');
{
 const e=game(4);for(let i=0;i<10;i++)e.targets[i].type=MP.config.monsters[4];
 for(let i=0;i<500;i++){e.update(.05);assert.ok(e.targets.filter(m=>!['hidden','done'].includes(m.phase)).length<=3);}
}
console.log('PASS teleporting ghosts reserve their spawn slots');
