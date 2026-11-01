
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
  splash(){this.t(300,.5,'sine',.06,110);}};
const buzz=p=>{try{navigator.vibrate&&navigator.vibrate(p);}catch(e){}};

const S={ id:'yacha', spec:null, L:null, on:false,
  t:0, st:'work', prog:0, dish:0, lives:3, mood:70,
  warnKind:'R', warnT:0, warnMax:0, stT:0,
  nextIdle:0, nextDown:0, nextWarn:0, warnMul:1,
  praiseRun:0, scoldRun:0, cdW:0, cdP:0, strikeNeed:0,
  shake:0, flash:0, flashCol:'#fff', water:.3, parts:[], clips:[], over:false, sayT:0, amt:0 };

const rampW=()=>clamp(1-S.t/250,.38,1);
const schedIdle=()=>{S.nextIdle=S.t+rnd(S.spec.idle[0],S.spec.idle[1]);};
const schedDown=()=>{S.nextDown=S.t+rnd(S.spec.down[0],S.spec.down[1]);};
const schedWarn=()=>{S.nextWarn=S.t+Math.max(2.4,rnd(S.spec.warn[0],S.spec.warn[1])*S.warnMul*rampW());};
const warnDur=()=>Math.max(.7,S.spec.warnDur*clamp(1-S.t/420,.6,1)*(.78+S.mood/450));
const speedMul=()=>S.mood>=60?1:S.mood>=35?.8:S.mood>=15?.58:.4;

let bubT=0,subT=0;
function say(x){const b=$('#bubble');b.textContent=x;b.classList.add('on');clearTimeout(bubT);bubT=setTimeout(()=>b.classList.remove('on'),2600);}
function me(x){const s=$('#subt');s.textContent='🔊 나 · '+x;s.classList.add('on');clearTimeout(subT);subT=setTimeout(()=>s.classList.remove('on'),1500);}
function fx(c,sh){S.flash=1;S.flashCol=c;S.shake=sh||10;}
function puff(x,y,n,col,spd){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=(spd||120)*(.3+Math.random());
  S.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-50,g:540,life:.5+Math.random()*.6,m:1.1,
    col:Array.isArray(col)?col[i%col.length]:col,r:2.5+Math.random()*4});}}

function toClip(k){const m=Math.floor(S.t/60),s=Math.floor(S.t%60);
  S.clips.push({tc:`19:${String(40+m).padStart(2,'0')}:${String(s).padStart(2,'0')}`,kind:k,txt:k==='R'?'그릇 파손':'싱크대 범람'});}

function enterWarn(){S.st='warn';S.warnKind=Math.random()<S.spec.red?'R':'B';S.warnMax=S.warnT=warnDur();
  say(pick(S.warnKind==='R'?S.L.warnR:S.L.warnB));Snd.alert(S.warnKind==='R');buzz(25);}
function accident(k){S.st='acc';S.stT=1.25;S.lives--;S.mood=clamp(S.mood-10,0,100);toClip(k);
  if(k==='R'){puff(200,214,22,['#f2ead6','#cdbfa0','#fff'],190);fx('#ff4d5e',16);Snd.crash();}
  else{S.water=1.25;puff(200,206,18,['#9ad4ff','#d8f0ff'],150);fx('#6fc3ff',12);Snd.splash();}
  say(pick(k==='R'?S.L.accR:S.L.accB));buzz([50,40,90]);}
function endDay(reason){if(S.over)return;S.over=true;S.on=false;showResult(reason);}

function startDay(id){
  S.id=id;S.spec=SPEC[id];S.L=LINE[id];
  S.t=0;S.st='work';S.prog=0;S.dish=0;S.lives=3;S.mood=70;S.warnT=0;S.stT=0;S.warnMul=1;
  S.praiseRun=0;S.scoldRun=0;S.cdW=0;S.cdP=0;S.shake=0;S.flash=0;S.water=.3;
  S.parts=[];S.clips=[];S.over=false;S.sayT=3;S.amt=0;
  schedIdle();schedDown();S.nextWarn=S.t+rnd(3.5,5.5);
  document.documentElement.style.setProperty('--yc',Y[id].c);
  $('#camWho').textContent=`${Y[id].name} · ${Y[id].emo}`;
  $('#camDish').textContent='0';
  $('#bubble').classList.remove('on');$('#subt').classList.remove('on');
  $('#pick').hidden=true;$('#result').hidden=true;$('#play').hidden=false;
  $('#camSlot').appendChild($('#char'));
  $('#char').style.display='block';
  Snd.wake();
  layout(); drawBG($('#bgc').getContext('2d'));
  S.on=true; say(pick(S.L.work)); scrollTo(0,0);
}

function step(dt){
  if(!S.on||S.over) return;
  S.t+=dt;
  S.cdW=Math.max(0,S.cdW-dt);S.cdP=Math.max(0,S.cdP-dt);
  S.shake=Math.max(0,S.shake-dt*36);S.flash=Math.max(0,S.flash-dt*2.6);S.sayT-=dt;
  for(let i=S.parts.length-1;i>=0;i--){const p=S.parts[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.g*dt;p.life-=dt;if(p.life<=0)S.parts.splice(i,1);}

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
    else if(S.sayT<=0&&S.st==='work'){S.sayT=rnd(7,12);say(pick(S.L.work));}
  }
  /* 셰이더에 넘길 세기 */
  const target = S.st==='warn'? (1-S.warnT/S.warnMax) : S.st==='acc'? 1 : S.st==='strike'? .35 : 0;
  S.amt += (target-S.amt)*Math.min(1,dt*7);
}
function glPose(){ return S.st==='warn'||S.st==='acc'? 2 : (S.st==='work'? 1 : 0); }

function doWarn(){
  if(!S.on||S.over||S.cdW>0)return;
  S.cdW=1.2;Snd.warn();me(pick(MYVOICE.warn));buzz(18);
  if(S.st==='warn'){
    if(S.warnKind==='R'){S.st='work';S.water=.3;S.mood=clamp(S.mood+S.spec.scoldMood*.55,0,100);
      S.warnMul=Math.max(.45,S.warnMul*S.spec.rage);schedWarn();schedIdle();fx('#7dffb0',5);say(pick(S.L.scold));}
    else accident('B');
    return;
  }
  if(S.st==='idle'){S.st='work';S.stT=0;S.mood=clamp(S.mood+S.spec.scoldMood,0,100);schedIdle();say(pick(S.L.scold));}
  else if(S.st==='down'){S.mood=clamp(S.mood+S.spec.scoldMood*1.4,0,100);S.stT+=2;say(pick(S.L.scold));}
  else{S.scoldRun++;S.mood=clamp(S.mood+S.spec.scoldMood*(.6+S.scoldRun*.3),0,100);say(pick(S.L.scold));}
  S.warnMul=Math.max(.45,S.warnMul*S.spec.rage);
  if(S.mood<=0&&S.st!=='strike'){S.st='strike';S.strikeNeed=2;say(pick(S.L.strike));fx('#ff4d5e',8);}
}
function doPraise(){
  if(!S.on||S.over||S.cdP>0)return;
  S.cdP=1.2;Snd.praise();me(pick(MYVOICE.praise));buzz(12);
  if(S.st==='warn'){
    if(S.warnKind==='B'){S.st='work';S.water=.3;S.mood=clamp(S.mood+S.spec.praiseMood*.7,0,100);
      schedWarn();schedDown();fx('#7dffb0',5);say(pick(S.L.praise));}
    else accident('R');
    return;
  }
  if(S.st==='strike'){S.strikeNeed--;S.mood=clamp(S.mood+18,0,100);
    if(S.strikeNeed<=0){S.st='work';S.mood=Math.max(S.mood,30);schedWarn();schedIdle();schedDown();say(pick(S.L.praise));}
    else say('…한 번만 더 말해줘.');
    return;}
  S.praiseRun++;
  const eff=S.praiseRun>1?Math.pow(.45,S.praiseRun-1):1;
  if(S.st==='down'){S.mood=clamp(S.mood+S.spec.praiseMood*eff,0,100);if(eff>.4){S.st='work';S.stT=0;schedDown();}say(eff>.4?pick(S.L.praise):pick(S.L.spam));}
  else if(S.st==='idle'){S.mood=clamp(S.mood+3*eff,0,100);say('…응. 근데 이것 좀만 더.');}
  else{S.mood=clamp(S.mood+S.spec.praiseMood*.6*eff,0,100);say(eff>.4?pick(S.L.praise):pick(S.L.spam));}
}
