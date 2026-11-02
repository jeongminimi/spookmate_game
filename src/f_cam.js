
/* ───────── 저장 · 소리 · 상태기계 ───────── */
const LS='spookmate.3d.v1';
function loadSave(){try{const d=JSON.parse(localStorage.getItem(LS)||'null');if(d&&typeof d==='object')return Object.assign({wallet:0,best:{},days:0},d);}catch(e){}return{wallet:0,best:{},days:0};}
function saveSave(){try{localStorage.setItem(LS,JSON.stringify(SAVE));}catch(e){}}
let SAVE=loadSave();

const Snd={on:true,ctx:null,
  wake(){try{if(!this.ctx)this.ctx=new (window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==='suspended')this.ctx.resume();}catch(e){}},
  t(f,d=.12,ty='triangle',v=.06,sl){if(!this.on||!this.ctx)return;
    try{const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type=ty;o.frequency.setValueAtTime(f,c.currentTime);
      if(sl)o.frequency.exponentialRampToValueAtTime(sl,c.currentTime+d);
      g.gain.setValueAtTime(v,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+d);
      o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+d);}catch(e){}},
  ding(){this.t(880,.12);this.t(1320,.18,'sine',.04);},
  warn(){this.t(220,.14,'square',.05,160);},
  praise(){this.t(520,.1,'sine',.05,760);},
  alert(r){this.t(r?440:300,.1,'square',.045);},
  crash(){this.t(90,.4,'sawtooth',.09,50);this.t(260,.25,'square',.04,70);},
  /* 두 겹으로 깨진다 — 둔탁한 충격이 먼저, 사기 조각이 뒤따른다 */
  smash(){ this.t(70,.26,'sawtooth',.11,40); this.t(190,.14,'square',.06,95);
    if(!this.on||!this.ctx) return;
    for(let i=0;i<5;i++) setTimeout(()=>this.t(900+Math.random()*1500,.07,'triangle',.028),70+i*55+Math.random()*40); },
  /* 어둑시니가 커질 때 깔리는 저주파. 켜고 끄는 걸 반드시 짝지어야 한다 */
  hum:null,
  humOn(){ if(!this.on||!this.ctx||this.hum) return;
    try{const c=this.ctx,g=c.createGain(),o=c.createOscillator(),o2=c.createOscillator();
      o.type='sine';o.frequency.value=47; o2.type='sine';o2.frequency.value=70.5;
      g.gain.value=0; o.connect(g);o2.connect(g);g.connect(c.destination);
      o.start();o2.start(); this.hum={o,o2,g};}catch(e){} },
  humSet(v){ if(!this.hum)return;
    try{this.hum.g.gain.setTargetAtTime(Math.max(0,Math.min(1,v))*.06,this.ctx.currentTime,.3);}catch(e){} },
  humOff(){ const h=this.hum; this.hum=null; if(!h)return;
    try{h.g.gain.setTargetAtTime(0,this.ctx.currentTime,.12);
      setTimeout(()=>{try{h.o.stop();h.o2.stop();h.g.disconnect();}catch(e){}},400);}catch(e){} },
  splash(){this.t(300,.5,'sine',.06,110);},
  /* 카파가 물을 쏟을 때 — 짧고 밝게 */
  plop(){ this.t(620,.14,'sine',.055,240); this.t(1180,.08,'triangle',.03,700); },
  /* 오이와의 눈물 — 한 방울 */
  drip(){ this.t(840,.16,'sine',.035,300); }};
const buzz=p=>{try{navigator.vibrate&&navigator.vibrate(p);}catch(e){}};

const S={ id:'yacha', spec:null, L:null, on:false,
  t:0, st:'work', prog:0, dish:0, lives:3, mood:70,
  warnKind:'R', warnT:0, warnMax:0, stT:0,
  nextIdle:0, nextDown:0, nextWarn:0, warnMul:1,
  praiseRun:0, scoldRun:0, cdW:0, cdP:0, strikeNeed:0,
  ask:null, askT:0, askMax:0, nextAsk:0, askHit:0, askMiss:0, recv:1, x:0, spill:0,
  lastBtn:'', btnRun:0,
  shake:0, flash:0, flashCol:'#fff', water:.3, parts:[], lens:[], clips:[], over:false, sayT:0, amt:0 };

const DAY=180;           /* 한 판 = 3분. 이게 없으면 잘하는 사람은 영원히 안 끝난다 */
const rampW=()=>clamp(1-S.t/250,.38,1);
const schedIdle=()=>{S.nextIdle=S.t+rnd(S.spec.idle[0],S.spec.idle[1]);};
const schedDown=()=>{S.nextDown=S.t+rnd(S.spec.down[0],S.spec.down[1]);};
const schedWarn=()=>{S.nextWarn=S.t+Math.max(2.4,rnd(S.spec.warn[0],S.spec.warn[1])*S.warnMul*rampW());};
const warnDur=()=>Math.max(.7,S.spec.warnDur*clamp(1-S.t/420,.6,1)*(.78+S.mood/450));
const speedMul=()=>{
  let v=.34+.78*clamp(S.mood/100,0,1);          /* 의욕 1점이 전부 속도에 반영된다 */
  if(S.spec.x==='water') v*=(.32+.68*clamp(S.x,0,1));      /* 물이 마르면 손이 느려진다 */
  if(S.spec.x==='size')  v*=clamp(1.22-S.x*.26,.42,1.08);  /* 커질수록 둔해진다 */
  return v;
};
/* 고유값을 움직인다. 카파는 접시 물, 어둑시니는 몸집. */
function bumpX(key){
  if(!S.spec.x) return;
  const d=S.spec[key]||0;
  if(S.spec.x==='water'){ if(d<0){ S.spill=1; lensDrops(3+Math.floor(Math.random()*4)); Snd.plop(); }
    S.x=clamp(S.x+d,0,1); }
  else S.x=clamp(S.x+d,1,2.8);
}
const schedAsk=()=>{S.nextAsk=S.t+rnd(S.spec.ask[0],S.spec.ask[1]);};

/* 같은 버튼을 세 번 이어 누르면 요괴가 알아챈다.
   상황을 구분해서 말해야 "내 말을 들었다"는 느낌이 난다. */
function tally(b){ S.btnRun = (S.lastBtn===b)? S.btnRun+1 : 1; S.lastBtn=b; }
function scoldLine(){
  if(S.btnRun>=3) return pick(S.L.repScold);
  if(S.st==='idle') return pick(S.L.scoldIdle);
  if(S.st==='down') return pick(S.L.scoldDown);
  return pick(S.L.scoldWork);
}
function praiseLine(){
  if(S.btnRun>=3) return pick(S.L.repPraise);
  if(S.st==='idle') return pick(S.L.praiseIdle);
  if(S.st==='down') return pick(S.L.praiseDown);
  return pick(S.L.praiseWork);
}

/* 요괴가 먼저 말을 건다. 제한 시간 안에 주의나 칭찬으로 답해야 한다. */
function openAsk(){
  S.ask=pick(S.L.ask); S.askMax=S.askT=S.spec.askDur*clamp(1.12-S.t/500,.72,1.12);
  say(S.ask.q, S.askMax*1000+200); Snd.alert(S.ask.w==='W'); buzz(14); schedAsk();
}
function closeAsk(how){
  const a=S.ask; if(!a) return; S.ask=null;
  if(how==='ok'){ S.askHit++; S.mood=clamp(S.mood+S.spec.praiseMood*1.15,0,100); say(a.ok); fx('#7dffb0',4); }
  else if(how==='no'){ S.askMiss++; S.mood=clamp(S.mood-12,0,100); say(a.no); fx('#ffb45e',6);
    /* 잘못 답하면 요괴가 그 허락대로 움직인다 — 사고가 곧 온다 */
    S.nextWarn=Math.min(S.nextWarn,S.t+rnd(1.6,3.2)); }
  else { S.askMiss++; S.mood=clamp(S.mood-8,0,100); say(a.late); }
}

let bubT=0,subT=0;
function say(x,ms){const b=$('#bubble');b.textContent=x;b.classList.add('on');clearTimeout(bubT);bubT=setTimeout(()=>b.classList.remove('on'),ms||2600);}
function me(x){const s=$('#subt');s.textContent='🔊 나 · '+x;s.classList.add('on');clearTimeout(subT);subT=setTimeout(()=>s.classList.remove('on'),1500);}
function fx(c,sh){S.flash=1;S.flashCol=c;S.shake=sh||10;}
function puff(x,y,n,col,spd,k){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=(spd||120)*(.3+Math.random());
  S.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-50,g:540,life:.5+Math.random()*.6,m:1.1,
    col:Array.isArray(col)?col[i%col.length]:col,r:2.5+Math.random()*4,
    k:k||'dot',rot:Math.random()*6.283,spin:(Math.random()-.5)*14,w:.45+Math.random()*.9});}}

/* 렌즈에 맺히는 것들 — 펫캠이라 카메라 유리가 반응한다 */
function lensCrack(x,y,n){
  for(let i=0;i<n;i++){
    /* 한 점에서 방사형으로 뻗되 짧게. 길면 유리 균열이 아니라 실처럼 보인다 */
    const a=(i/n)*6.283+Math.random()*.7, pts=[[x,y]]; let px=x,py=y,ang=a;
    const segs=2+Math.floor(Math.random()*2);
    for(let j=0;j<segs;j++){
      ang+=(Math.random()-.5)*.55;
      const L=(11+Math.random()*17)*(1-j*.3);
      px+=Math.cos(ang)*L; py=clamp(py+Math.sin(ang)*L,8,244);   /* HUD 띠를 안 넘는다 */
      pts.push([px,py]);
    }
    S.lens.push({k:'crack',pts,w:.7+Math.random()*.9,life:1.3+Math.random()*.5,m:1.9});
  }
  S.lens.push({k:'hit',x,y,r:7+Math.random()*4,life:.9,m:1.1});
}
/* 렌즈에 맺힌 물방울 — 카메라 유리에 튄 물. 천천히 흘러내린다 */
function lensDrops(n){
  for(let i=0;i<n;i++)
    S.lens.push({k:'wdrop',x:rnd(26,374),y:rnd(22,200),r:rnd(5.5,13),
                 vy:rnd(4,11),trail:0,life:rnd(2.8,4.6),m:4.8});
}
/* 눈물 자국 — 물방울보다 느리고 자국이 길게 남는다 */
function lensTears(n){
  for(let i=0;i<n;i++)
    S.lens.push({k:'tear',x:rnd(60,340),y:rnd(18,80),r:rnd(4.5,8),
                 vy:rnd(8,17),trail:0,life:rnd(3.6,5.2),m:5.4});
}

function toClip(k){const m=Math.floor(S.t/60),s=Math.floor(S.t%60);
  S.clips.push({tc:`19:${String(40+m).padStart(2,'0')}:${String(s).padStart(2,'0')}`,kind:k,txt:k==='R'?'그릇 파손':'싱크대 범람'});}

function enterWarn(){S.ask=null;S.st='warn';S.warnKind=Math.random()<S.spec.red?'R':'B';S.warnMax=S.warnT=warnDur();
  say(pick(S.warnKind==='R'?S.L.warnR:S.L.warnB));Snd.alert(S.warnKind==='R');buzz(25);}
function accident(k){S.st='acc';S.stT=1.25;S.lives--;S.mood=clamp(S.mood-10,0,100);toClip(k);
  if(k==='R'){
    if(S.id==='yacha'){
      /* 야차 — 파편이 회전하며 날고 렌즈에 금이 간다 */
      puff(200,212,26,['#f2ead6','#cdbfa0','#fff','#e4d8bc'],250,'shard');
      puff(200,214,10,['#fff8e8'],120);
      lensCrack(200,204,7); fx('#ff4d5e',24); Snd.smash();
    } else if(S.id==='eodook'){
      /* 어둑시니 — 몸이 휘저어 깬다. 어둠이 한 번 덮친다 */
      puff(200,214,18,['#e8e0d0','#bdb3a4'],170,'shard');
      fx('#140b1f',18); Snd.smash();
    } else { puff(200,214,22,['#f2ead6','#cdbfa0','#fff'],190,'shard');fx('#ff4d5e',16);Snd.crash(); }
  }
  else{S.water=1.25;puff(200,206,18,['#9ad4ff','#d8f0ff'],150,'drop');fx('#6fc3ff',12);Snd.splash();
    if(S.id==='oiwa'){ lensTears(4+Math.floor(Math.random()*3)); Snd.drip(); }
    if(S.id==='kappa') lensDrops(5);}
  say(pick(k==='R'?S.L.accR:S.L.accB));buzz([50,40,90]);}
function endDay(reason){if(S.over)return;S.over=true;S.on=false;Snd.humOff();showResult(reason);}

function startDay(id){
  S.id=id;S.spec=SPEC[id];S.L=LINE[id];
  S.t=0;S.st='work';S.prog=0;S.dish=0;S.lives=3;S.mood=70;S.warnT=0;S.stT=0;S.warnMul=1;
  S.praiseRun=0;S.scoldRun=0;S.cdW=0;S.cdP=0;S.shake=0;S.flash=0;S.water=.3;
  S.parts=[];S.clips=[];S.over=false;S.sayT=3;S.amt=0;
  S.ask=null;S.askT=0;S.askHit=0;S.askMiss=0;S.lastBtn='';S.btnRun=0;S.recv=1;
  S.x=S.spec.x? S.spec.x0 : 0; S.spill=0; S.lens=[];
  Snd.humOff();
  schedIdle();schedDown();schedAsk();S.nextWarn=S.t+rnd(3.5,5.5);
  document.documentElement.style.setProperty('--yc',Y[id].c);
  $('#camWho').textContent=`${Y[id].name} · ${Y[id].emo}`;
  $('#camDish').textContent='0';
  $('#bubble').classList.remove('on');$('#subt').classList.remove('on');
  $('#pick').hidden=true;$('#result').hidden=true;$('#play').hidden=false;
  $('#camSlot').appendChild($('#char'));
  $('#char').style.display='block';
  Snd.wake();
  if(id==='eodook') Snd.humOn();   /* 오디오를 깨운 뒤라야 켜진다 */
  layout(); drawBG($('#bgc').getContext('2d'));
  S.on=true; say(pick(S.L.work)); scrollTo(0,0);
}

function step(dt){
  if(!S.on||S.over) return;
  S.t+=dt;
  if(S.t>=DAY&&S.st!=='acc') return endDay('time');
  S.cdW=Math.max(0,S.cdW-dt);S.cdP=Math.max(0,S.cdP-dt);
  if(S.st!=='strike') S.mood=clamp(S.mood-dt*1.6,0,100);   /* 방치하면 꺼진다 */
  S.recv=clamp(S.recv+dt*.42,0,1.15);   /* 칭찬을 받아들일 여유가 차오른다 */
  S.spill=Math.max(0,S.spill-dt*1.6);
  if(S.spec.x==='water'){
    S.x=clamp(S.x+S.spec.xDrift*dt,0,1);
    if(S.x<=S.spec.xLow&&S.st!=='strike'&&S.st!=='acc'){
      S.st='strike';S.strikeNeed=2;say(pick(S.L.strike));fx('#6bb8db',7);}
  } else if(S.spec.x==='size'){
    S.x=Math.max(1,S.x+S.spec.xDrift*dt);
    if(S.x>=S.spec.xHigh&&S.st!=='acc'){ S.x=1.35; accident('R'); }
  }
  S.shake=Math.max(0,S.shake-dt*36);S.flash=Math.max(0,S.flash-dt*2.6);S.sayT-=dt;
  for(let i=S.parts.length-1;i>=0;i--){const p=S.parts[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.g*dt;
    if(p.spin)p.rot+=p.spin*dt; p.life-=dt;if(p.life<=0)S.parts.splice(i,1);}
  for(let i=S.lens.length-1;i>=0;i--){ const L=S.lens[i];
    if(L.vy){ L.y+=L.vy*dt; L.trail=Math.min(80,L.trail+L.vy*dt); L.vy+=16*dt; }
    L.life-=dt; if(L.life<=0)S.lens.splice(i,1); }
  if(S.id==='eodook') Snd.humSet(clamp((S.x-1)/(S.spec.xHigh-1),0,1)*.9);

  if(S.ask){ S.askT-=dt; if(S.askT<=0) closeAsk('late'); }

  if(S.st==='acc'){ S.stT-=dt;
    if(S.stT<=0){ if(S.lives<=0) return endDay('out');
      S.st='work';S.water=.3;schedWarn();schedIdle();schedDown(); } }
  else if(S.st==='warn'){ S.warnT-=dt;
    if(S.warnKind==='B') S.water=clamp(.3+(1-S.warnT/S.warnMax)*.55,.3,.9);
    if(S.warnT<=0) accident(S.warnKind); }
  else if(S.st!=='strike'){
    if(S.st==='work'){ S.prog+=dt/S.spec.wash*speedMul(); if(Math.random()<dt*5) puff(rnd(165,235),206,1,['#ffffff','#dff2ff'],24); }
    else if(S.st==='down') S.prog+=dt/S.spec.wash*speedMul()*.45;
    if(S.prog>=1){ S.prog=0;S.dish++;$('#camDish').textContent=S.dish; puff(332,196,7,['#fff6d8','#ffd23f'],90); Snd.ding(); }
    S.stT-=dt;
    if((S.st==='idle'||S.st==='down')&&S.stT<=0){S.st='work';schedIdle();schedDown();}
    if(S.t>=S.nextWarn) enterWarn();
    else if(S.st==='work'&&S.t>=S.nextIdle){S.st='idle';S.stT=7.5;S.praiseRun=0;S.scoldRun=0;say(pick(S.L.idle));schedIdle();}
    else if(S.st!=='down'&&S.t>=S.nextDown){S.st='down';S.stT=8.5;S.praiseRun=0;S.scoldRun=0;say(pick(S.L.down));schedDown();}
    else if(!S.ask&&S.t>=S.nextAsk&&S.t<S.nextWarn-1.6){ openAsk(); }
    else if(S.sayT<=0&&S.st==='work'&&!S.ask){S.sayT=rnd(7,12);say(pick(S.L.work));}
  }
  /* 셰이더에 넘길 세기 */
  const target = S.st==='warn'? (1-S.warnT/S.warnMax) : S.st==='acc'? 1 : S.st==='strike'? .35 : 0;
  S.amt += (target-S.amt)*Math.min(1,dt*7);
}
function glPose(){ return S.st==='warn'||S.st==='acc'? 2 : (S.st==='work'? 1 : 0); }

function doWarn(){
  if(!S.on||S.over||S.cdW>0)return;
  S.cdW=.8;Snd.warn();me(pick(MYVOICE.warn));buzz(18);
  if(S.ask){ tally('W'); bumpX('xScold'); return closeAsk(S.ask.w==='W'?'ok':'no'); }
  tally('W'); bumpX('xScold');
  /* 카파는 물이 말라 주저앉는다. 달래는 게 아니라 진정시켜야 일어난다 */
  if(S.st==='strike'&&S.spec.x==='water'){
    S.strikeNeed--; S.x=clamp(S.x+.22,0,1);
    if(S.strikeNeed<=0){S.st='work';S.mood=Math.max(S.mood,28);schedWarn();schedIdle();schedDown();schedAsk();say(pick(S.L.scoldBlock));}
    else say('…물. 물 좀.');
    return; }
  if(S.st==='warn'){
    if(S.warnKind==='R'){S.st='work';S.water=.3;S.mood=clamp(S.mood+S.spec.scoldMood*.55,0,100);
      S.warnMul=Math.max(.45,S.warnMul*S.spec.rage);schedWarn();schedIdle();schedAsk();fx('#7dffb0',5);say(pick(S.L.scoldBlock));}
    else accident('B');
    return;
  }
  if(S.st==='idle'){const l=scoldLine();S.st='work';S.stT=0;S.mood=clamp(S.mood+S.spec.scoldMood,0,100);schedIdle();say(l);}
  else if(S.st==='down'){S.mood=clamp(S.mood+S.spec.scoldMood*1.4,0,100);S.stT+=2;say(scoldLine());}
  else{S.scoldRun++;S.mood=clamp(S.mood+S.spec.scoldMood*(.5+S.scoldRun*.22),0,100);say(scoldLine());}
  S.warnMul=Math.max(.45,S.warnMul*S.spec.rage);
  if(S.mood<=0&&S.st!=='strike'){S.st='strike';S.strikeNeed=2;say(pick(S.L.strike));fx('#ff4d5e',8);}
}
function doPraise(){
  if(!S.on||S.over||S.cdP>0)return;
  S.cdP=.8;Snd.praise();me(pick(MYVOICE.praise));buzz(12);
  if(S.ask){ tally('P'); bumpX('xPraise'); return closeAsk(S.ask.w==='P'?'ok':'no'); }
  tally('P'); bumpX('xPraise');
  if(S.st==='warn'){
    if(S.warnKind==='B'){S.st='work';S.water=.3;S.mood=clamp(S.mood+S.spec.praiseMood*.7,0,100);
      schedWarn();schedDown();schedAsk();fx('#7dffb0',5);say(pick(S.L.praiseBlock));}
    else accident('R');
    return;
  }
  if(S.st==='strike'&&S.spec.x==='water'){ say('물이… 칭찬으론 안 차.'); return; }
  if(S.st==='strike'){S.strikeNeed--;S.mood=clamp(S.mood+18,0,100);
    if(S.strikeNeed<=0){S.st='work';S.mood=Math.max(S.mood,30);schedWarn();schedIdle();schedDown();schedAsk();say(praiseLine());}
    else say('…한 번만 더 말해줘.');
    return;}
  S.praiseRun++;
  const eff=clamp(S.recv,0,1); S.recv=Math.max(0,S.recv-.88);
  if(S.st==='down'){S.mood=clamp(S.mood+S.spec.praiseMood*eff,0,100);if(eff>.4){S.st='work';S.stT=0;schedDown();}say(praiseLine());}
  else if(S.st==='idle'){S.mood=clamp(S.mood+4*eff,0,100);say(praiseLine());}
  else{S.mood=clamp(S.mood+S.spec.praiseMood*.6*eff,0,100);say(praiseLine());}
}
