
/* ───────── 부엌 2D: 뒤 배경 한 번 · 앞 레이어 매 프레임 ───────── */
const CW=400, CH=300;
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);
  c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);
  c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();}

function fitCanvas(cv){
  const d=window.__dpr||Math.min(1.5,window.devicePixelRatio||1), w=cv.clientWidth||360;
  const W=Math.round(w*d), H=Math.round(w*.75*d);
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
  const c=cv.getContext('2d'); c.setTransform(W/CW,0,0,W/CW,0,0); return c;
}
function layout(){ GL.fit(); fitCanvas($('#bgc')); fitCanvas($('#fg')); }

function drawBG(c){
  c.clearRect(0,0,CW,CH);
  const g=c.createLinearGradient(0,0,0,200);
  g.addColorStop(0,'#2c2a3c'); g.addColorStop(1,'#3e3a52');
  c.fillStyle=g; c.fillRect(0,0,CW,CH);
  c.strokeStyle='rgba(255,255,255,.05)'; c.lineWidth=1;
  for(let x=0;x<CW;x+=34){c.beginPath();c.moveTo(x,0);c.lineTo(x,210);c.stroke();}
  for(let y=6;y<210;y+=30){c.beginPath();c.moveTo(0,y);c.lineTo(CW,y);c.stroke();}
  /* 창 — 바깥은 밤 */
  c.fillStyle='#0d0a1c'; rr(c,22,34,74,56,6); c.fill();
  c.strokeStyle='#5a5370'; c.lineWidth=4; c.stroke();
  c.fillStyle='#ffeab4'; c.globalAlpha=.5; c.beginPath(); c.arc(74,54,8,0,7); c.fill(); c.globalAlpha=1;
  c.fillStyle='#5a5370'; c.fillRect(56,34,4,56); c.fillRect(22,60,74,4);
  /* 벽시계 */
  c.fillStyle='#1b1828'; c.beginPath(); c.arc(344,56,20,0,7); c.fill();
  c.strokeStyle='#5a5370'; c.lineWidth=4; c.stroke();
  c.strokeStyle='#cfc8e0'; c.lineWidth=2.4; c.lineCap='round';
  c.beginPath(); c.moveTo(344,56); c.lineTo(344,45); c.lineTo(344,56); c.lineTo(352,60); c.stroke();
  /* 상부장 */
  c.fillStyle='#4a4160'; c.fillRect(130,0,190,48);
  c.fillStyle='#564c6e'; c.fillRect(130,44,190,6);
  c.strokeStyle='#39314c'; c.lineWidth=2; c.beginPath(); c.moveTo(225,0); c.lineTo(225,44); c.stroke();
  c.fillStyle='#8e85a8'; c.fillRect(205,20,14,4); c.fillRect(231,20,14,4);
}

function drawFG(c){
  c.clearRect(0,0,CW,CH);
  c.save();
  if(S.shake>.3) c.translate((Math.random()-.5)*S.shake,(Math.random()-.5)*S.shake);

  /* 조리대 */
  c.fillStyle='#6f6486'; c.fillRect(-10,185,CW+20,24);
  c.fillStyle='#857a9e'; c.fillRect(-10,185,CW+20,7);
  c.fillStyle='#4a3f5e'; c.fillRect(-10,209,CW+20,CH);
  c.fillStyle='rgba(0,0,0,.28)'; c.fillRect(-10,209,CW+20,5);

  /* 싱크대 */
  c.fillStyle='#2a2438'; rr(c,112,190,176,52,9); c.fill();
  const wl=238-S.water*32;
  c.save(); rr(c,114,192,172,48,8); c.clip();
  const wg=c.createLinearGradient(0,wl,0,240);
  wg.addColorStop(0,S.water>1?'#a8ddfa':'#6aa8d6'); wg.addColorStop(1,'#35587e');
  c.fillStyle=wg; c.fillRect(112,wl,176,56);
  c.fillStyle='rgba(255,255,255,.3)';
  for(let i=0;i<6;i++) c.fillRect(122+i*27,wl+1.5+Math.sin(S.t*3+i)*1.6,15,2);
  c.restore();
  if(S.water>1){c.fillStyle='rgba(120,190,255,.4)';c.fillRect(92,240,216,10);c.fillRect(60,248,280,6);}
  /* 수도꼭지 */
  c.strokeStyle='#cdc6dc'; c.lineWidth=6; c.lineCap='round';
  c.beginPath(); c.moveTo(272,162); c.lineTo(272,180); c.quadraticCurveTo(272,187,262,187); c.stroke();
  c.fillStyle='#cdc6dc'; rr(c,266,154,13,11,4); c.fill();

  /* 쌓인 그릇 · 건조대 */
  for(let i=0;i<5;i++){ c.save(); c.translate(54+(i%2)*3,206-i*7); c.rotate((i%2?1:-1)*.05);
    c.fillStyle=i%2?'#e3d8c0':'#d2c7ac'; c.beginPath(); c.ellipse(0,0,24,8,0,0,7); c.fill();
    c.fillStyle='rgba(92,70,40,.5)'; c.beginPath(); c.ellipse(-6,-1,7,2.6,.3,0,7); c.fill(); c.restore(); }
  c.fillStyle='#8e85a8'; rr(c,302,200,70,7,4); c.fill();
  const dry=Math.min(9,S.dish);
  for(let i=0;i<dry;i++){ c.save(); c.translate(314+(i%3)*21,198-Math.floor(i/3)*9);
    c.fillStyle='#f6f1e5'; c.beginPath(); c.ellipse(0,0,10.5,4,0,0,7); c.fill();
    c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=1.2; c.stroke(); c.restore(); }
  c.font='700 10px sans-serif'; c.textAlign='center'; c.fillStyle='rgba(255,255,255,.45)';
  c.fillText('쌓인 그릇',54,228); c.fillText('건조대',338,228);

  /* 거품 */
  S.parts.forEach(p=>{c.globalAlpha=clamp(p.life/p.m,0,1);c.fillStyle=p.col;c.beginPath();c.arc(p.x,p.y,p.r,0,7);c.fill();});
  c.globalAlpha=1;

  /* 전조 테두리 */
  if(S.st==='warn'){
    const red=S.warnKind==='R', col=red?'#ff5e54':'#7cc8f5';
    const pulse=.45+Math.abs(Math.sin(S.t*15))*.55;
    c.globalAlpha=pulse*.2; c.fillStyle=col; c.fillRect(0,0,CW,CH); c.globalAlpha=1;
    c.globalAlpha=pulse; c.strokeStyle=col; c.lineWidth=7; c.strokeRect(3.5,3.5,CW-7,CH-7); c.globalAlpha=1;
  }

  /* CCTV 띠 */
  c.fillStyle='rgba(16,10,22,.78)'; c.fillRect(0,252,CW,CH-252);
  c.fillStyle='rgba(255,255,255,.12)'; c.fillRect(0,252,CW,1);
  if(S.st==='warn'){
    const red=S.warnKind==='R', col=red?'#ff6b60':'#8ad2f8', left=S.warnT/S.warnMax;
    c.textAlign='center'; c.fillStyle=col; c.font='700 15px sans-serif';
    c.fillText(red?'폭주 직전 — 주의!':'무너지기 직전 — 칭찬!',200,270);
    c.fillStyle='rgba(0,0,0,.45)'; rr(c,96,276,208,10,5); c.fill();
    c.fillStyle=col; rr(c,96,276,Math.max(5,208*left),10,5); c.fill();
  } else {
    c.textAlign='left'; c.font='700 10px ui-monospace,monospace'; c.fillStyle='rgba(255,245,224,.88)';
    c.fillText('MOOD',12,266);
    c.fillStyle='rgba(0,0,0,.5)'; rr(c,12,270,116,9,5); c.fill();
    c.fillStyle=S.mood>55?'#8fe8ae':S.mood>25?'#ffd23f':'#ff6b60';
    rr(c,12,270,Math.max(3,116*S.mood/100),9,5); c.fill();
    c.textAlign='right'; c.fillStyle='rgba(255,245,224,.88)'; c.fillText('설거지',388,266);
    c.fillStyle='rgba(0,0,0,.5)'; rr(c,272,270,116,9,5); c.fill();
    c.fillStyle=Y[S.id].c; rr(c,272,270,Math.max(3,116*clamp(S.prog,0,1)),9,5); c.fill();
  }
  c.textAlign='left';
  if(Math.sin(S.t*4)>-.3){c.fillStyle='#ff4b3f';c.beginPath();c.arc(16,292,4.5,0,7);c.fill();}
  c.fillStyle='rgba(255,245,224,.9)'; c.font='700 11px ui-monospace,monospace';
  const mm=Math.floor(S.t/60),ss=Math.floor(S.t%60);
  c.fillText(`REC  19:${String(40+mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}  CAM01`,26,296);
  for(let i=0;i<3;i++){const x=CW-16-i*21,al=i<S.lives;
    c.fillStyle=al?'#fff6e2':'rgba(255,255,255,.14)';
    c.beginPath();c.ellipse(x,291,8,6,0,0,7);c.fill();
    if(!al){c.strokeStyle='#ff6b60';c.lineWidth=2;c.beginPath();c.moveTo(x-6,286);c.lineTo(x+5,297);c.moveTo(x+5,286);c.lineTo(x-6,297);c.stroke();}}

  /* 화면 질감 */
  c.fillStyle='rgba(0,0,0,.14)';
  for(let y=0;y<CH;y+=3) c.fillRect(0,y,CW,1);
  const vg=c.createRadialGradient(CW/2,CH/2,CH*.34,CW/2,CH/2,CH*.86);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.5)');
  c.fillStyle=vg; c.fillRect(0,0,CW,CH);
  if(S.flash>0){c.globalAlpha=S.flash*.45;c.fillStyle=S.flashCol;c.fillRect(0,0,CW,CH);c.globalAlpha=1;}
  c.restore();
}
