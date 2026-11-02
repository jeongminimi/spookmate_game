
/* ───────── 공통 도구 · WebGL 캐릭터 렌더러 ───────── */
const $ = s => document.querySelector(s);
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const rnd = (a,b) => a + Math.random()*(b-a);
/* 섞은 주머니 방식 — 한 바퀴 다 쓰기 전에는 같은 대사가 다시 안 나온다.
   풀이 4~6개뿐이라 순수 무작위로는 반복이 금방 눈에 띈다. */
const _bag=new WeakMap(), _last=new WeakMap();
const pick = a => {
  if(!a||!a.length) return '';
  if(a.length<2) return a[0];
  let b=_bag.get(a);
  if(!b||!b.length){
    b=a.map((_,i)=>i);
    for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}
    if(b[b.length-1]===_last.get(a)) [b[0],b[b.length-1]]=[b[b.length-1],b[0]];
    _bag.set(a,b);
  }
  const i=b.pop(); _last.set(a,i); return a[i];
};

const GL = {
  cv:null, gl:null, u:{}, ok:false,
  /* 해상도 자동 조절 — 프레임 시간이 예산을 넘으면 내리고, 여유가 있으면 올린다.
     기기마다 성능이 다르니 숫자를 고정하지 않고 기기가 스스로 찾게 둔다. */
  scale:1, acc:0, n:0, hold:0, cap:1.5, min:0.55,
  tune(dt){
    this.acc+=dt; this.n++; this.hold-=dt;
    if(this.acc<1) return;
    const ms=this.acc/this.n*1000; this.acc=0; this.n=0;
    if(this.hold>0) return;
    if(ms>16.0 && this.scale>this.min){ this.scale=Math.max(this.min,this.scale*0.86); this.hold=1.2; }
    else if(ms<11.5 && this.scale<1){ this.scale=Math.min(1,this.scale*1.10); this.hold=2.0; }
  },
  /* 프로그램은 요괴를 고를 때 그때 만든다. 넷을 미리 다 만들면
     컴파일이 느리고, 한 셰이더에 몰면 드라이버가 거부한다. */
  progs:{}, cur:-1, vs:null, buf:null,
  init(){
    const cv = $('#char'); this.cv = cv;
    const gl = cv.getContext('webgl2',{antialias:false,alpha:true,premultipliedAlpha:true});
    if(!gl){ this.ok=false; return false; }
    this.gl = gl;
    this.vs = this.sh(gl.VERTEX_SHADER,`#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0,1);}`);
    if(!this.vs){ this.ok=false; return false; }
    this.buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,this.buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    gl.clearColor(0,0,0,0);
    this.ok=true;
    return this.use(0);        /* 첫 요괴로 한 번 만들어 보고 성패를 판단한다 */
  },
  sh(t,src){
    const gl=this.gl, o=gl.createShader(t); gl.shaderSource(o,src); gl.compileShader(o);
    if(!gl.getShaderParameter(o,gl.COMPILE_STATUS)){ console.error(gl.getShaderInfoLog(o)); return null; }
    return o;
  },
  use(i){
    if(!this.gl) return false;
    if(this.cur===i && this.progs[i]) return true;
    const gl=this.gl;
    let P=this.progs[i];
    if(!P){
      const fs=this.sh(gl.FRAGMENT_SHADER,buildFS(i));
      if(!fs) return false;
      const pr=gl.createProgram(); gl.attachShader(pr,this.vs); gl.attachShader(pr,fs); gl.linkProgram(pr);
      if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){ console.error(gl.getProgramInfoLog(pr)); return false; }
      const u={}; ['iR','iT','iPose','iAmt','iMood','iX'].forEach(k=>u[k]=gl.getUniformLocation(pr,k));
      P=this.progs[i]={pr,u,loc:gl.getAttribLocation(pr,'p')};
    }
    gl.useProgram(P.pr);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.buf);
    gl.enableVertexAttribArray(P.loc); gl.vertexAttribPointer(P.loc,2,gl.FLOAT,false,0,0);
    this.u=P.u; this.cur=i;
    return true;
  },
  fit(){
    if(!this.ok) return;
    const cv=this.cv, w=cv.clientWidth||360;
    const d=(window.__dpr||Math.min(this.cap, window.devicePixelRatio||1))*this.scale;
    const W=Math.round(w*d), H=Math.round(w*.75*d);
    if(cv.width!==W||cv.height!==H){ cv.width=W; cv.height=H; this.gl.viewport(0,0,W,H); }
  },
  render(t,ch,pose,amt,mood,x){
    if(!this.ok) return;
    const gl=this.gl;
    /* 셰이더를 못 만들면 화면을 비운다. 안 지우면 직전 요괴가 남아
       엉뚱한 놈이 그려진 채로 게임이 돌아간다. */
    if(!this.use(ch)){ gl.clear(gl.COLOR_BUFFER_BIT); return; }
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(this.u.iR,this.cv.width,this.cv.height);
    gl.uniform1f(this.u.iT,t);
    gl.uniform1i(this.u.iPose,pose);
    gl.uniform1f(this.u.iAmt,amt);
    gl.uniform1f(this.u.iMood,mood);
    gl.uniform1f(this.u.iX,x||0);
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
};
