
/* ───────── 측정 ───────── */
const $=s=>document.querySelector(s);
let CH=0, POSE=1, SCALE=1;
let gl, uni={}, cv=$('#view');

function initGL(){
  gl=cv.getContext('webgl2',{antialias:false});
  if(!gl){ $('#fps').textContent='—'; $('#run').disabled=true;
    $('#verdict').className='verdict on'; $('#verdict').style.setProperty('--c','var(--bad)');
    $('#verdict').innerHTML='<h3>WebGL2를 못 씁니다</h3><p>이 브라우저로는 3D를 못 돌립니다. 크롬이나 사파리 최신 버전에서 열어 주세요.</p>';
    return false; }
  const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);
    if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))console.error(gl.getShaderInfoLog(o));return o;};
  const pr=gl.createProgram();
  gl.attachShader(pr,sh(gl.VERTEX_SHADER,`#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0,1);}`));
  gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,CHAR_FS));
  gl.linkProgram(pr); gl.useProgram(pr);
  const b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const lp=gl.getAttribLocation(pr,'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp,2,gl.FLOAT,false,0,0);
  ['iR','iT','iChar','iPose','iAmt','iMood'].forEach(k=>uni[k]=gl.getUniformLocation(pr,k));
  gl.clearColor(.043,.035,.063,1);
  return true;
}
function fit(){
  const d=Math.min(1.5,window.devicePixelRatio||1)*SCALE;
  const w=Math.round(cv.clientWidth*d), h=Math.round(cv.clientWidth*.75*d);
  if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;gl.viewport(0,0,w,h);}
}

/* FPS 집계 */
const SAMP=[];              /* {t, fps} 1초마다 */
let frames=0, winStart=0, cur=0, curMs=0;
let running=false, runStart=0;
const RUN_SEC=180;

function drawGraph(){
  const g=$('#graph'), c=g.getContext('2d'), W=g.width, H=g.height;
  c.clearRect(0,0,W,H);
  c.fillStyle='#15121b'; c.fillRect(0,0,W,H);
  const MAX=70;
  c.strokeStyle='#2c2636'; c.lineWidth=1;
  [30,60].forEach(v=>{const y=H-(v/MAX)*H;c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();
    c.fillStyle='#5d5570';c.font='700 15px sans-serif';c.fillText(v+'fps',6,y-5);});
  if(!SAMP.length) return;
  const span=Math.max(RUN_SEC,SAMP[SAMP.length-1].t);
  c.lineWidth=3; c.strokeStyle='#7bb8ff'; c.beginPath();
  SAMP.forEach((s,i)=>{const x=(s.t/span)*W, y=H-Math.min(1,s.fps/MAX)*H;
    i?c.lineTo(x,y):c.moveTo(x,y);});
  c.stroke();
  c.lineTo(W*(SAMP[SAMP.length-1].t/span),H); c.lineTo(0,H); c.closePath();
  c.fillStyle='rgba(123,184,255,.16)'; c.fill();
}

function frame(ms){
  requestAnimationFrame(frame);
  if(!gl) return;
  fit();
  const t=ms/1000;
  gl.uniform2f(uni.iR,cv.width,cv.height);
  gl.uniform1f(uni.iT,t);
  gl.uniform1i(uni.iChar,CH);
  gl.uniform1i(uni.iPose,POSE);
  gl.uniform1f(uni.iAmt,POSE===2?.5+.5*Math.sin(t*6):0);
  gl.uniform1f(uni.iMood,.8);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES,0,3);

  frames++;
  if(!winStart) winStart=ms;
  if(ms-winStart>=1000){
    cur=Math.round(frames*1000/(ms-winStart));
    curMs=Math.round((ms-winStart)/frames*10)/10;
    $('#fps').textContent=cur; $('#ms').textContent=curMs.toFixed(1);
    $('#fps').parentElement.style.setProperty('--c', cur>=55?'var(--good)':cur>=40?'var(--warn)':'var(--bad)');
    frames=0; winStart=ms;
    if(running){
      const el=(ms-runStart)/1000;
      SAMP.push({t:el,fps:cur});
      drawGraph();
      const left=Math.max(0,Math.ceil(RUN_SEC-el));
      $('#gmid').textContent=`측정 중 · ${Math.floor(left/60)}:${String(left%60).padStart(2,'0')} 남음`;
      $('#run').textContent=`측정 중… ${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`;
      if(el>=RUN_SEC) finish();
    }
  }
}

function avg(a){return a.length? a.reduce((x,y)=>x+y.fps,0)/a.length : 0;}
function finish(){
  running=false;
  $('#run').textContent='다시 측정'; $('#run').className='btn';
  $('#gmid').textContent='측정 완료';
  const first=avg(SAMP.filter(s=>s.t<=30));
  const last=avg(SAMP.filter(s=>s.t>=RUN_SEC-30));
  const all=avg(SAMP);
  const drop=first>0? (1-last/first)*100 : 0;
  let col,title,msg;
  if(last>=55&&drop<15){col='var(--good)';title='문제없습니다';
    msg='3분을 돌려도 성능이 거의 안 떨어졌습니다. 실시간 3D를 그대로 가도 됩니다.';}
  else if(last>=40&&drop<25){col='var(--good)';title='쓸 만합니다';
    msg='쾌적하진 않아도 플레이에 무리가 없습니다. 해상도 배율을 0.8로 낮추면 여유가 생깁니다.';}
  else if(last>=25){col='var(--warn)';title='아슬아슬합니다';
    msg='끊김이 느껴지는 구간입니다. 해상도 배율을 0.7 아래로 낮추거나 계산량을 줄여야 합니다. 저사양 폰에서는 더 나빠집니다.';}
  else {col='var(--bad)';title='이 기기엔 버겁습니다';
    msg='실시간 3D를 고집하기 어렵습니다. 캐릭터를 미리 여러 각도로 구워서 이미지로 쓰는 방식으로 바꾸는 게 맞습니다.';}
  if(drop>=25){col='var(--bad)';title='발열로 성능이 깎였습니다';
    msg=`처음보다 ${drop.toFixed(0)}% 느려졌습니다. 기기가 열 때문에 스스로 성능을 낮추고 있다는 뜻입니다. 절대 수치보다 이게 더 큰 문제입니다.`;}
  const v=$('#verdict'); v.className='verdict on'; v.style.setProperty('--c',col);
  v.innerHTML=`<h3>${title}</h3><p>${msg}</p><table>
    <tr><td>처음 30초 평균</td><td>${first.toFixed(1)} fps</td></tr>
    <tr><td>마지막 30초 평균</td><td>${last.toFixed(1)} fps</td></tr>
    <tr><td>전체 평균</td><td>${all.toFixed(1)} fps</td></tr>
    <tr><td>하락폭</td><td style="color:${drop>=15?'var(--bad)':'var(--good)'}">${drop>0?drop.toFixed(0):0}%</td></tr>
    <tr><td>설정</td><td>${CH?'야차':'오이와'} · ${['가만히','설거지','폭주'][POSE]} · ${SCALE.toFixed(2)}×</td></tr>
    </table><p style="margin-top:8px;font-size:12.5px;color:var(--dim)">지금 바로 폰 뒷면 카메라 주변을 만져 보세요. 손을 떼고 싶을 만큼이면 수치와 상관없이 과한 겁니다.</p>`;
}

/* 배선 */
$('#charRow').onclick=e=>{const b=e.target.closest('button');if(!b)return;
  CH=+b.dataset.c;[...e.currentTarget.children].forEach(c=>c.classList.toggle('on',c===b));};
$('#poseRow').onclick=e=>{const b=e.target.closest('button');if(!b)return;
  POSE=+b.dataset.p;[...e.currentTarget.children].forEach(c=>c.classList.toggle('on',c===b));};
$('#sc').oninput=e=>{SCALE=+e.target.value/100;$('#scv').textContent=SCALE.toFixed(2)+'×';};
$('#run').onclick=()=>{
  if(running){running=false;$('#run').textContent='3분 측정 시작';$('#run').className='btn';$('#gmid').textContent='중단함';return;}
  SAMP.length=0; running=true; runStart=performance.now();
  $('#verdict').className='verdict'; $('#run').className='btn run'; $('#run').textContent='측정 중…';
  drawGraph();
};
if(initGL()){ drawGraph(); requestAnimationFrame(frame); }
})();
