'use strict';
MP.Engine = class {
  constructor(random=Math.random){this.random=random;this.newGame();}
  newGame(){this.state='READY';this.round=0;this.coins=0;this.earned=0;this.totalShots=0;this.totalSuccess=0;this.totalPerfect=0;this.levels={film:0,reload:0,lens:0,night:0};this.targets=[];this.photos=[];this.discovered=new Set();this.best=null;this.paused=false;this.aiming=false;this.zoomIndex=0;this.clock=0;this.events=[];}
  get capacity(){return 5+this.levels.film;}
  get reloadDuration(){return Math.max(1,2-.3*this.levels.reload);}
  get zoom(){return this.aiming?MP.config.zoom[this.zoomIndex]:1;}
  emit(type,data={}){this.events.push({type,...data});}
  takeEvents(){return this.events.splice(0);}
  startRound(){const cfg=MP.config.rounds[this.round];this.state='PLAYING';this.paused=false;this.aiming=false;this.zoomIndex=0;this.time=cfg.time;this.clock=0;this.film=this.capacity;this.reloadLeft=0;this.lock=0;this.captured=0;this.failed=0;this.failureReason='';this.perfect=0;this.roundEarned=0;this.photos=[];this.events=[];this.warning=11;
    let ghosts=0;this.targets=Array.from({length:10},(_,i)=>{let types=MP.config.monsters.slice(0,cfg.types).filter(t=>t.id!=='mist-wraith'||ghosts<2);let value=this.random()*types.reduce((s,t)=>s+t.weight,0);let type=types.find(t=>(value-=t.weight)<0)||types[0];if(this.round===4&&i===9&&ghosts===0)type=MP.config.monsters[4];if(type.id==='mist-wraith')ghosts++;const range=MP.config.monsterScale;const scale=range.min+this.random()*(range.max-range.min);return {id:i,type,scale,phase:'hidden',due:i*.8,misses:0,captured:false,x:0,y:0,w:type.w*scale,h:type.h*scale};});
  }
  spawn(m){m.phase='oneEye';m.age=0;m.teleported=false;m.teleportLeft=0;m.x=100+this.random()*(1000-m.w);m.y=190+this.random()*170;m.baseX=m.x;m.baseY=m.y;m.direction=this.random()<.5?1:-1;m.reveal=m.type.id==='false-one-eye'?1.4:.65;m.duration=m.type.expose*(m.misses>=2?1.2:1);this.emit('appear');}
  update(dt){if(this.state!=='PLAYING'||this.paused)return;this.time=Math.max(0,this.time-dt);this.clock+=dt;this.lock=Math.max(0,this.lock-dt);if(this.reloadLeft>0){this.reloadLeft=Math.max(0,this.reloadLeft-dt);if(this.reloadLeft===0){this.film=this.capacity;this.emit('reloaded');}}
    if(this.time<=10&&Math.ceil(this.time)<this.warning){this.warning=Math.ceil(this.time);this.emit('warning');}
    if(this.time<=0){this.finish(false,'제한 시간 60초가 끝났습니다.');return;}
    for(const m of this.targets){if(m.phase==='hidden'||m.phase==='done')continue;
      if(m.phase==='teleport'){
        m.teleportLeft=Math.max(0,m.teleportLeft-dt);
        if(m.teleportLeft===0)this.reappearGhost(m);
        continue;
      }
      m.age+=dt;if(m.phase==='vanish'){if(m.age>=.8)m.phase='done';continue;}
      this.moveMonster(m, dt);
      m.phase=m.age<m.reveal?'oneEye':'bothEyes';
      if(m.type.id==='mist-wraith' && !m.teleported &&
         m.age>=m.reveal+MP.config.movement.ghostVisibleTime &&
         m.age<m.reveal+m.duration) {
        m.teleported=true;
        m.phase='teleport';
        m.teleportLeft=MP.config.movement.ghostHiddenTime;
        this.emit('hide');
        continue;
      }
      if(m.age>m.reveal+m.duration){m.phase='hidden';m.misses++;m.due=this.clock+3+this.random()*3;this.emit('hide');}
    }
    let active=this.targets.filter(m=>!['hidden','done'].includes(m.phase)).length;
    for(const m of this.targets){if(active>=MP.config.rounds[this.round].max)break;if(m.phase==='hidden'&&m.due<=this.clock){this.spawn(m);active++;}}
  }
  // Reflect at the forest edges instead of oscillating around a spawn point.
  // Folding the travelled distance also handles long frames without escaping bounds.
  moveMonster(m, dt) {
    const cfg=MP.config.movement;
    const span=cfg.right-m.w-cfg.left;
    const speed=m.type.speed*(1+this.round*cfg.roundSpeedBonus);
    const travel=m.x-cfg.left+m.direction*speed*dt;
    const folded=((travel%(2*span))+2*span)%(2*span);
    m.x=cfg.left+(folded<span?folded:2*span-folded);
    m.direction*=folded<span?1:-1;
    m.y=m.baseY+(m.type.id==='moonlight-hare'?Math.sin(m.age*5)*12:
      m.type.id==='mist-wraith'?Math.sin(m.age*2)*9:0);
  }
  reappearGhost(m) {
    const cfg=MP.config.movement;
    const left=cfg.left,right=cfg.right-m.w;
    const span=right-left;
    // Pick the opposite outer quarter: always at least a quarter-screen away.
    m.x=m.x<(left+right)/2?
      right-this.random()*span*.25:left+this.random()*span*.25;
    m.baseX=m.x;
    m.baseY=m.baseY<275?320+this.random()*35:190+this.random()*35;
    m.y=m.baseY;
    m.direction=m.x<(left+right)/2?1:-1;
    m.phase='bothEyes';
    this.emit('appear');
  }
  reload(){if(this.state!=='PLAYING'||this.paused||this.reloadLeft)return false;if(this.film===this.capacity){this.emit('message',{text:'필름이 가득 차 있습니다'});return false;}this.reloadLeft=this.reloadDuration;this.aiming=false;this.emit('reload');return true;}
  geometry(m,camera){return m.type.eyes.map(([x,y])=>({x:(m.x+x*m.w)*camera.z+camera.tx,y:(m.y+y*m.h)*camera.z+camera.ty}));}
  judge(camera){const f=MP.config.frame;const inside=(p,w,h)=>Math.abs(p.x-camera.cx)<=w/2&&Math.abs(p.y-camera.cy)<=h/2;const candidates=[];let reason='괴물이 촬영 영역에 없습니다';
    for(const m of this.targets){if(['hidden','done','teleport'].includes(m.phase))continue;const eyes=this.geometry(m,camera);const count=eyes.filter(p=>inside(p,f.w,f.h)).length;if(!count)continue;if(m.captured){reason='이미 촬영한 괴물입니다';continue;}if(count<2||m.phase!=='bothEyes'){reason='한쪽 눈이 가려졌습니다';continue;}if(m.type.id==='mist-wraith'&&camera.z<1.6){reason='안개가 짙습니다. 1.6배 이상 확대하세요';continue;}
      const perfect=eyes.every(p=>inside(p,f.pw*(1+.1*this.levels.lens),f.ph*(1+.1*this.levels.lens)));candidates.push({m,perfect,distance:Math.hypot((eyes[0].x+eyes[1].x)/2-camera.cx,(eyes[0].y+eyes[1].y)/2-camera.cy)});
    }return candidates.sort((a,b)=>a.distance-b.distance)[0]||{reason};
  }
  shoot(camera){if(this.state!=='PLAYING'||this.paused||this.reloadLeft||this.lock>0)return null;if(this.film<=0){this.emit('message',{text:'필름이 없습니다. R키로 재장전하세요'});return null;}this.film--;this.lock=.28;this.totalShots++;const hit=this.judge(camera);const photo={name:hit.m?hit.m.type.name:'미확인',type:hit.m?.type.id||null,quality:hit.m?(hit.perfect?'perfect':'success'):'failed',coins:0,zoom:camera.z,reason:hit.reason||'',round:this.round+1};
    if(hit.m){const m=hit.m;m.captured=true;m.phase='vanish';m.age=0;photo.coins=Math.round(m.type.coins*(hit.perfect?1.5:1));this.coins+=photo.coins;this.earned+=photo.coins;this.roundEarned+=photo.coins;this.captured++;this.totalSuccess++;if(hit.perfect){this.perfect++;this.totalPerfect++;}this.discovered.add(m.type.id);this.emit('capture',{photo});}else{this.failed++;this.emit('miss',{photo});}this.photos.push(photo);if(this.failed>MP.config.maxFailedPhotos)this.finish(false,'실패 사진이 3장을 초과했습니다.');else if(this.captured===10)this.finish(true);return photo;
  }
  finish(success,reason=''){if(this.state!=='PLAYING')return;this.failureReason=reason;this.state='READY';this.aiming=false;this.reloadLeft=0;this.lock=0;this.success=success;this.bonuses=success?[{name:'라운드 성공',coins:50},...(this.failed===0?[{name:'실패 없는 촬영',coins:50}]:[]),...(this.time>=20?[{name:'20초 이상 남김',coins:30}]:[]),...(this.perfect===10?[{name:'모두 완벽한 사진',coins:100}]:[])]:[];const bonus=this.bonuses.reduce((s,b)=>s+b.coins,0);this.coins+=bonus;this.earned+=bonus;this.roundEarned+=bonus;this.emit('finish',{success});}
  buy(index){const item=MP.config.equipment[index];if(!item||this.state!=='READY')return false;const lv=this.levels[item.key],price=item.prices[lv];if(price===undefined||this.coins<price)return false;this.coins-=price;this.levels[item.key]++;return true;}
  get grade(){const score=this.totalSuccess?this.totalPerfect/this.totalSuccess:0;return score>=.8?'S':score>=.5?'A':score>=.25?'B':'C';}
};
