
/* ───────── 공통 도구 · WebGL 캐릭터 렌더러 ───────── */
const $ = s => document.querySelector(s);
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const rnd = (a,b) => a + Math.random()*(b-a);
const pick = a => a[Math.floor(Math.random()*a.length)];

const GL = {
  cv:null, gl:null, u:{}, ok:false, dpr:1,
  init(){
    const cv = $('#char'); this.cv = cv;
    const gl = cv.getContext('webgl2',{antialias:false,alpha:true,premultipliedAlpha:true});
    if(!gl){ this.ok=false; return false; }
    this.gl = gl;
    const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);
      if(!gl.getShaderParameter(o,gl.COMPILE_STATUS)){console.error(gl.getShaderInfoLog(o));return null;}return o;};
    const vs=sh(gl.VERTEX_SHADER,`#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0,1);}`);
    const fs=sh(gl.FRAGMENT_SHADER,CHAR_FS);
    if(!vs||!fs){ this.ok=false; return false; }
    const pr=gl.createProgram(); gl.attachShader(pr,vs); gl.attachShader(pr,fs); gl.linkProgram(pr);
    if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){ console.error(gl.getProgramInfoLog(pr)); this.ok=false; return false; }
    gl.useProgram(pr);
    const b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const lp=gl.getAttribLocation(pr,'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp,2,gl.FLOAT,false,0,0);
    ['iR','iT','iChar','iPose','iAmt','iMood'].forEach(k=>this.u[k]=gl.getUniformLocation(pr,k));
    gl.clearColor(0,0,0,0);
    this.ok=true; return true;
  },
  fit(){
    if(!this.ok) return;
    const cv=this.cv, w=cv.clientWidth||360;
    const d=window.__dpr||Math.min(1.5, window.devicePixelRatio||1);
    const W=Math.round(w*d), H=Math.round(w*.75*d);
    if(cv.width!==W||cv.height!==H){ cv.width=W; cv.height=H; this.gl.viewport(0,0,W,H); }
  },
  render(t,ch,pose,amt,mood){
    if(!this.ok) return;
    const gl=this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(this.u.iR,this.cv.width,this.cv.height);
    gl.uniform1f(this.u.iT,t);
    gl.uniform1i(this.u.iChar,ch);
    gl.uniform1i(this.u.iPose,pose);
    gl.uniform1f(this.u.iAmt,amt);
    gl.uniform1f(this.u.iMood,mood);
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
};
