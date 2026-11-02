
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
  S.parts.forEach(p=>{
    c.globalAlpha=clamp(p.life/p.m,0,1); c.fillStyle=p.col;
    if(p.k==='shard'){
      /* 사기 조각 — 회전하는 삼각형. 동그라미면 '깨졌다'가 아니라 '뿜었다'로 보인다 */
      c.save(); c.translate(p.x,p.y); c.rotate(p.rot||0);
      const a=p.r*1.5, b=p.r*(p.w||.7);
      c.beginPath(); c.moveTo(-a*.5,-b); c.lineTo(a,0); c.lineTo(-a*.6,b*.85); c.closePath(); c.fill();
      c.restore();
    } else if(p.k==='drop'){
      c.save(); c.translate(p.x,p.y);
      c.rotate(Math.atan2(p.vy,p.vx)+1.5708);
      c.beginPath(); c.ellipse(0,0,p.r*.62,p.r*1.35,0,0,7); c.fill();
      c.restore();
    } else { c.beginPath(); c.arc(p.x,p.y,p.r,0,7); c.fill(); }
  });
  c.globalAlpha=1;

  /* 전조 테두리 */
  if(S.st==='warn'){
    const red=S.warnKind==='R', col=red?'#ff5e54':'#7cc8f5';
    const pulse=.45+Math.abs(Math.sin(S.t*15))*.55;
    c.globalAlpha=pulse*.2; c.fillStyle=col; c.fillRect(0,0,CW,CH); c.globalAlpha=1;
    c.globalAlpha=pulse; c.strokeStyle=col; c.lineWidth=7; c.strokeRect(3.5,3.5,CW-7,CH-7); c.globalAlpha=1;
  } else if(S.ask){
    const p=.3+Math.abs(Math.sin(S.t*6))*.45;
    c.globalAlpha=p*.72; c.strokeStyle='#ffd23f'; c.lineWidth=4; c.strokeRect(2.5,2.5,CW-5,CH-5); c.globalAlpha=1;
  }

  /* 오이와의 초롱 — 광원이 캐릭터라 주방까지 비춘다. 의욕이 꺼지면 빛도 꺼진다 */
  if(S.id==='oiwa'){
    const lit=clamp(S.mood/100,0,1);
    const fl=.84+.16*Math.sin(S.t*17)*Math.sin(S.t*7.3);
    const g=c.createRadialGradient(200,104,10,200,104,180);
    g.addColorStop(0,'rgba(255,214,122,'+(.34*lit*fl).toFixed(3)+')');
    g.addColorStop(.55,'rgba(255,196,96,'+(.12*lit*fl).toFixed(3)+')');
    g.addColorStop(1,'rgba(255,190,90,0)');
    c.save(); c.beginPath(); c.rect(0,0,CW,252); c.clip();
    c.globalCompositeOperation='lighter'; c.fillStyle=g; c.fillRect(0,0,CW,252);
    c.restore();
  }

  /* CCTV 띠 */
  c.fillStyle='rgba(16,10,22,.78)'; c.fillRect(0,252,CW,CH-252);
  c.fillStyle='rgba(255,255,255,.12)'; c.fillRect(0,252,CW,1);
  /* 남은 근무 시간 — 띠 맨 위에 얇게 */
  {const left=clamp(1-S.t/DAY,0,1);
   c.fillStyle=left>.25?'rgba(255,245,224,.42)':'#ff8a3d';
   c.fillRect(0,252,CW*left,2);}
  if(S.st==='warn'){
    const red=S.warnKind==='R', col=red?'#ff6b60':'#8ad2f8', left=S.warnT/S.warnMax;
    c.textAlign='center'; c.fillStyle=col; c.font='700 15px sans-serif';
    c.fillText(red?'폭주 직전 — 주의!':'무너지기 직전 — 칭찬!',200,270);
    c.fillStyle='rgba(0,0,0,.45)'; rr(c,96,276,208,10,5); c.fill();
    c.fillStyle=col; rr(c,96,276,Math.max(5,208*left),10,5); c.fill();
  } else if(S.ask){
    const left=clamp(S.askT/S.askMax,0,1);
    c.textAlign='center'; c.fillStyle='#ffd23f'; c.font='700 15px sans-serif';
    c.fillText('뭐라고 답할까 — 주의 / 칭찬',200,270);
    c.fillStyle='rgba(0,0,0,.45)'; rr(c,96,276,208,10,5); c.fill();
    c.fillStyle=left>.35?'#ffd23f':'#ff8a3d'; rr(c,96,276,Math.max(5,208*left),10,5); c.fill();
  } else {
    c.textAlign='left'; c.font='700 10px ui-monospace,monospace'; c.fillStyle='rgba(255,245,224,.88)';
    c.fillText('MOOD',12,266);
    c.fillStyle='rgba(0,0,0,.5)'; rr(c,12,270,116,9,5); c.fill();
    c.fillStyle=S.mood>55?'#8fe8ae':S.mood>25?'#ffd23f':'#ff6b60';
    rr(c,12,270,Math.max(3,116*S.mood/100),9,5); c.fill();
    /* 요괴 고유 게이지 — 카파는 접시 물, 어둑시니는 몸집 */
    if(S.spec.x){
      const water=S.spec.x==='water';
      const v=water? clamp(S.x,0,1) : clamp((S.x-1)/(S.spec.xHigh-1),0,1);
      c.textAlign='center'; c.fillStyle='rgba(255,245,224,.88)';
      c.fillText(water?'접시 물':'몸집',200,266);
      c.fillStyle='rgba(0,0,0,.5)'; rr(c,142,270,116,9,5); c.fill();
      c.fillStyle=water? (v>.35?'#6bb8db':'#ff8a3d') : (v<.62?'#a98fd8':'#ff6b60');
      rr(c,142,270,Math.max(3,116*v),9,5); c.fill();
    }
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

  /* 렌즈에 맺힌 것 — 카메라 유리 쪽이라 흔들림 밖에 그린다 */
  if(S.lens.length){
    S.lens.forEach(L=>{
      const a=clamp(L.life/L.m,0,1);
      if(L.k==='crack'){
        c.lineCap='round'; c.lineJoin='round';
        c.beginPath(); c.moveTo(L.pts[0][0],L.pts[0][1]);
        for(let i=1;i<L.pts.length;i++) c.lineTo(L.pts[i][0],L.pts[i][1]);
        /* 어두운 테를 깔고 밝은 심을 올려야 유리가 갈라진 것처럼 보인다 */
        c.globalAlpha=a*.55; c.strokeStyle='rgba(10,6,16,.9)'; c.lineWidth=L.w*2.6; c.stroke();
        c.globalAlpha=a*.92; c.strokeStyle='rgba(244,240,250,.95)'; c.lineWidth=L.w; c.stroke();
      } else if(L.k==='wdrop'||L.k==='tear'){
        const tear=L.k==='tear';
        if(L.trail>2){                                  /* 흘러내린 자국 */
          c.globalAlpha=a*(tear?.34:.27);
          c.fillStyle=tear?'rgba(206,224,248,.9)':'rgba(190,226,246,.9)';
          c.beginPath(); c.ellipse(L.x,L.y-L.trail/2,L.r*.40,L.trail/2,0,0,7); c.fill();
        }
        /* 어두운 테 → 맺힌 물 → 흰 점. 테가 없으면 배경에 묻힌다 */
        c.globalAlpha=a*.45; c.fillStyle='rgba(14,20,34,.9)';
        c.beginPath(); c.ellipse(L.x,L.y+L.r*.10,L.r*.95,L.r*1.26,0,0,7); c.fill();
        c.globalAlpha=a*(tear?.88:.80);
        c.fillStyle=tear?'rgba(218,234,252,.97)':'rgba(206,238,252,.97)';
        c.beginPath(); c.ellipse(L.x,L.y,L.r*.80,L.r*1.10,0,0,7); c.fill();
        c.globalAlpha=a*.95; c.fillStyle='rgba(255,255,255,.95)';
        c.beginPath(); c.ellipse(L.x-L.r*.28,L.y-L.r*.40,L.r*.30,L.r*.22,-.5,0,7); c.fill();
      } else if(L.k==='hit'){
        const g=c.createRadialGradient(L.x,L.y,0,L.x,L.y,L.r*(2.2-a));
        g.addColorStop(0,'rgba(255,252,246,'+(a*.8).toFixed(3)+')');
        g.addColorStop(1,'rgba(255,252,246,0)');
        c.globalAlpha=1; c.fillStyle=g;
        c.beginPath(); c.arc(L.x,L.y,L.r*(2.2-a),0,7); c.fill();
      }
    });
    c.globalAlpha=1;
  }

  /* 화면 질감 */
  c.fillStyle='rgba(0,0,0,.14)';
  for(let y=0;y<CH;y+=3) c.fillRect(0,y,CW,1);
  /* 비네트 — 요괴에 따라 조여드는 정도가 다르다 */
  let r0=CH*.34, r1=CH*.86, a1=.5, dim=0, tint=null, wash=null;
  if(S.id==='kappa'){
    /* 물이 마르면 색이 빠진다. 게이지를 안 봐도 상태가 보인다 */
    const dry=1-clamp(S.x,0,1);
    if(dry>.04) wash=['188,196,204',dry*.30];
  } else if(S.id==='oiwa'){
    const lit=clamp(S.mood/100,0,1);
    dim=(1-lit)*.30; wash=['64,80,116',(1-lit)*.15];
  } else if(S.id==='eodook'){
    const g=clamp((S.x-1)/(S.spec.xHigh-1),0,1);
    const pulse = g>.78 ? 1+Math.sin(S.t*9)*.07 : 1;   /* 한계 직전엔 어둠이 들썩인다 */
    r0=CH*(.34-.31*g)*pulse; r1=CH*(.86-.20*g);
    a1=.5+.46*g; dim=g*.30; tint=g;
  }
  const vg=c.createRadialGradient(CW/2,CH/2,Math.max(2,r0),CW/2,CH/2,r1);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,'+a1.toFixed(3)+')');
  c.fillStyle=vg; c.fillRect(0,0,CW,CH);
  /* 추가 어둠은 카메라 영역만 덮는다. HUD까지 어두워지면 게이지를 못 읽는다 */
  if(dim>0){ c.fillStyle='rgba(6,3,12,'+dim.toFixed(3)+')'; c.fillRect(0,0,CW,252); }
  if(tint>.45){ c.fillStyle='rgba(58,34,96,'+((tint-.45)*.20).toFixed(3)+')'; c.fillRect(0,0,CW,252); }
  if(wash&&wash[1]>.004){ c.fillStyle='rgba('+wash[0]+','+wash[1].toFixed(3)+')'; c.fillRect(0,0,CW,252); }
  if(S.flash>0){c.globalAlpha=S.flash*.45;c.fillStyle=S.flashCol;c.fillRect(0,0,CW,CH);c.globalAlpha=1;}
  c.restore();
}

/* ───────── 화면 밖으로 터져 나오는 연출 ─────────
   카메라 프레임은 overflow:hidden이라 안에서는 절대 못 넘는다.
   그래서 화면 전체를 덮는 레이어를 따로 쓴다. 극한 상황에만 — 그릇이
   깨지거나, 물을 쏟아 주저앉거나, 울거나, 어둠이 한계를 넘을 때만.
   자주 쓰면 무게가 사라진다. */
const BURST = {
  cv:null, c:null, p:[], veil:null, w:0, h:0,
  init(){ const e=$('#burst'); if(!e) return; this.cv=e; this.c=e.getContext('2d'); this.fit(); },
  fit(){ if(!this.cv) return;
    const d=Math.min(2,window.devicePixelRatio||1), w=innerWidth, h=innerHeight;
    this.cv.width=Math.round(w*d); this.cv.height=Math.round(h*d);
    this.c.setTransform(d,0,0,d,0,0); this.w=w; this.h=h; },
  /* 카메라 캔버스 좌표(400×300)를 화면 좌표로 */
  at(cx,cy){ const e=$('#camSlot');
    if(!e) return {x:innerWidth/2,y:innerHeight*.4,s:1};
    const r=e.getBoundingClientRect();
    return {x:r.left+cx/400*r.width, y:r.top+cy/300*r.height, s:r.width/400}; },
  add(n,o,sp,col,k,g,li){ for(let i=0;i<n;i++){
    const a=rnd(0,6.283), v=sp*(.35+Math.random());
    this.p.push({x:o.x,y:o.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-sp*.42,g:g,
      life:li*(.6+Math.random()*.7),m:li*1.3,r:(4+Math.random()*8)*o.s,
      rot:rnd(0,6.283),spin:rnd(-16,16),w:.4+Math.random()*.9,
      col:col[i%col.length],k:k}); } },
  fire(kind,cx,cy){
    if(!this.c) return;
    const o=this.at(cx==null?200:cx, cy==null?210:cy);
    if(kind==='glass'){
      this.add(30,o,1250,['#f4ecd8','#d7c9a8','#ffffff','#e8dcc0'],'shard',1700,1.5);
      this.add(14,o,780,['#fffaf0'],'dot',1500,.9);
      this.veil={k:'flash',x:o.x,y:o.y,t:0,life:.42,col:'255,248,235'};
    } else if(kind==='water'){
      this.add(34,o,980,['#bfe6fb','#8fd0f2','#eaf7ff'],'drop',1450,1.5);
      this.veil={k:'wash',t:0,life:.6,col:'90,170,220'};
    } else if(kind==='tears'){
      for(let i=0;i<22;i++) this.p.push({
        x:rnd(0,this.w), y:rnd(-this.h*.35,-10), vx:rnd(-22,22), vy:rnd(240,560),
        g:420, life:rnd(1.4,2.6), m:3.0, r:rnd(7,17), rot:0, spin:0, w:1,
        col:['#cfe4fb','#a9cdf0','#e8f3ff'][i%3], k:'tear' });
      this.veil={k:'wash',t:0,life:1.1,col:'74,110,170'};
    } else if(kind==='dark'){
      this.veil={k:'dark',t:0,life:1.5,col:'4,2,9'};
    }
  },
  step(dt){
    const c=this.c; if(!c) return;
    c.clearRect(0,0,this.w,this.h);
    if(this.veil){ const V=this.veil; V.t+=dt;
      const u=clamp(V.t/V.life,0,1);
      if(V.k==='flash'){
        const R=Math.max(this.w,this.h)*(.12+u*1.25);
        const g=c.createRadialGradient(V.x,V.y,0,V.x,V.y,R);
        g.addColorStop(0,'rgba('+V.col+','+((1-u)*.55).toFixed(3)+')');
        g.addColorStop(.6,'rgba('+V.col+','+((1-u)*.16).toFixed(3)+')');
        g.addColorStop(1,'rgba('+V.col+',0)');
        c.fillStyle=g; c.fillRect(0,0,this.w,this.h);
      } else if(V.k==='wash'){
        c.fillStyle='rgba('+V.col+','+((1-u)*.30).toFixed(3)+')';
        c.fillRect(0,0,this.w,this.h);
      } else if(V.k==='dark'){
        /* 어둠이 가장자리에서 화면 가운데로 밀려든다 */
        const peak=u<.3? u/.3 : 1-(u-.3)/.7;
        const R=Math.max(this.w,this.h)*(.95-peak*.78);
        const g=c.createRadialGradient(this.w/2,this.h*.42,Math.max(2,R*.25),this.w/2,this.h*.42,R);
        g.addColorStop(0,'rgba('+V.col+',0)');
        g.addColorStop(1,'rgba('+V.col+','+(peak*.96).toFixed(3)+')');
        c.fillStyle=g; c.fillRect(0,0,this.w,this.h);
      }
      if(u>=1) this.veil=null;
    }
    for(let i=this.p.length-1;i>=0;i--){ const p=this.p[i];
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=p.g*dt; p.rot+=p.spin*dt; p.life-=dt;
      if(p.life<=0||p.y>this.h+80){ this.p.splice(i,1); continue; }
      c.globalAlpha=clamp(p.life/p.m,0,1); c.fillStyle=p.col;
      if(p.k==='shard'){
        c.save(); c.translate(p.x,p.y); c.rotate(p.rot);
        const a=p.r*1.5,b=p.r*p.w;
        c.beginPath(); c.moveTo(-a*.5,-b); c.lineTo(a,0); c.lineTo(-a*.6,b*.85); c.closePath(); c.fill();
        c.restore();
      } else if(p.k==='drop'||p.k==='tear'){
        c.save(); c.translate(p.x,p.y); c.rotate(Math.atan2(p.vy,p.vx)+1.5708);
        c.beginPath(); c.ellipse(0,0,p.r*.52,p.r*1.3,0,0,7); c.fill();
        c.globalAlpha=clamp(p.life/p.m,0,1)*.9; c.fillStyle='rgba(255,255,255,.85)';
        c.beginPath(); c.arc(-p.r*.16,-p.r*.42,p.r*.2,0,7); c.fill();
        c.restore();
      } else { c.beginPath(); c.arc(p.x,p.y,p.r*.55,0,7); c.fill(); }
    }
    c.globalAlpha=1;
  },
  clear(){ this.p.length=0; this.veil=null; if(this.c) this.c.clearRect(0,0,this.w,this.h); }
};
/* 프레임이 맞고, 페이지가 흔들린다 */
function slam(){
  const st=$('#camSlot'), wr=document.querySelector('.wrap');
  if(st){ st.classList.remove('hit'); void st.offsetWidth; st.classList.add('hit');
    setTimeout(()=>st.classList.remove('hit'),360); }
  if(wr){ wr.classList.remove('shake'); void wr.offsetWidth; wr.classList.add('shake');
    setTimeout(()=>wr.classList.remove('shake'),380); }
}
