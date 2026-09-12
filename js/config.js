'use strict';
window.MP = {};
MP.config = {
  width:1280,height:720,zoom:[1,1.25,1.6,2],frame:{w:240,h:180,pw:104,ph:78},
  maxFailedPhotos:3,monsterScale:{min:0.7,max:1.3},
  movement:{roundSpeedBonus:0.08,left:75,right:1160,ghostVisibleTime:1.1,ghostHiddenTime:0.55},
  rounds:[{time:60,max:1,types:2},{time:60,max:1,types:3},{time:60,max:2,types:4},{time:60,max:2,types:5},{time:60,max:3,types:5}],
  // Eye centres measured against the full, uncropped source PNG (including transparent margins).
  monsters:[
    {id:'mossantler',speed:80,name:'이끼뿔',rarity:'일반',coins:10,weight:35,w:238,h:290,eyes:[[.542,.369],[.63,.373]],expose:3.8,tip:'숲의 오래된 수호자. 천천히 드러나는 두 눈을 기다리세요.'},
    {id:'moonlight-hare',speed:170,name:'달빛토끼',rarity:'일반',coins:20,weight:28,w:207,h:260,eyes:[[.631,.551],[.75,.557]],expose:2.9,tip:'달빛을 따라 뛰어다닙니다. 이동하는 눈을 따라가세요.'},
    {id:'false-one-eye',speed:250,name:'두눈 흉내쟁이',rarity:'고급',coins:30,weight:20,w:245,h:245,eyes:[[.421,.373],[.6,.416]],expose:1.6,tip:'좌우로 빠르게 움직이며 한쪽 눈으로 속입니다. 두 눈을 뜨는 순간을 노리세요.'},
    {id:'shadow-wolf',speed:350,name:'그림자 늑대',rarity:'희귀',coins:60,weight:12,w:280,h:280,eyes:[[.69,.44],[.8,.438]],expose:2.1,tip:'숲 양쪽을 빠르게 질주하는 보랏빛 눈. 반대편으로 돌아오는 순간을 노리세요.'},
    {id:'mist-wraith',speed:420,name:'안개 유령',rarity:'전설',coins:150,weight:5,w:136,h:136,eyes:[[.53,.209],[.587,.208]],expose:3.1,tip:'빠르게 떠다니다 사라져 다른 곳에 나타납니다. 1.6배 이상 확대해 두 눈을 담으세요.'}
  ],
  equipment:[
    {id:'film-upgrade',name:'필름 확장팩',prices:[100,180,280],tip:'장전량 +1장',key:'film'},
    {id:'reload-upgrade',name:'고속 필름 교환기',prices:[120,220,350],tip:'재장전 시간 −0.3초',key:'reload'},
    {id:'precision-lens',name:'정밀 렌즈',prices:[150,250,400],tip:'완벽 판정 영역 +10%',key:'lens'},
    {id:'night-filter',name:'야간 필터',prices:[300],tip:'어두운 괴물과 눈의 선명도 증가',key:'night'}
  ]
};
