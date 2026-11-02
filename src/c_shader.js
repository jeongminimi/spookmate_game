/* ───────── 캐릭터 셰이더: 요괴 하나당 프로그램 하나 ─────────
   부엌은 2D 레이어가 그리고, 여기서는 캐릭터만 투명 배경에 그린다.
   넷을 한 셰이더에 넣으면 map()이 노멀·그림자·AO 네 군데에 각각
   인라인되면서 코드가 네 벌로 불어난다. 윈도우 크롬(ANGLE→D3D)은
   거기서 컴파일이 깨진다. 그래서 고른 요괴 것만 그때 만든다. */
const SH = {
  head: `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 iR; uniform float iT; uniform int iPose;
uniform float iAmt;      /* 전조·폭주 세기 0..1 */
uniform float iMood;     /* 의욕 0..1 — 자세와 빛에 반영 */
uniform float iX;        /* 요괴 고유값 — 카파는 접시 물, 어둑시니는 몸집 */
`,
  consts: `/* 오이와 */
const vec3 PAPER=vec3(.95,.85,.60), PINK=vec3(.055,.045,.07), HAIR=vec3(.05,.045,.07);
const vec3 ROBE=vec3(.70,.76,.85), SKIN=vec3(.67,.73,.69), WOOD=vec3(.22,.15,.13);
/* 야차 */
const vec3 YSKIN=vec3(.88,.20,.13), HORN=vec3(.96,.91,.74), MANE=vec3(.16,.06,.06);
const vec3 CLOTH=vec3(.92,.60,.16), EYEW=vec3(.96,.94,.88), YINK=vec3(.07,.04,.05);

`,
  helpers: `float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float smax(float a,float b,float k){return -smin(-a,-b,k);}
vec3 rotZ(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(c*p.x-s*p.y,s*p.x+c*p.y,p.z);}
vec3 rotX(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}
float sdEll(vec3 p,vec3 r){float k0=length(p/r),k1=length(p/(r*r));return k0*(k0-1.)/k1;}
float sdBox(vec3 p,vec3 b,float rr){vec3 d=abs(p)-b;return length(max(d,0.))+min(max(d.x,max(d.y,d.z)),0.)-rr;}
float sdCap(vec3 p,vec3 a,vec3 b,float r){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-r;}
float sdCone(vec3 p,vec3 a,vec3 b,float r1,float r2){
  vec3 ba=b-a;float l2=dot(ba,ba),rr=r1-r2,a2=l2-rr*rr,il2=1./l2;
  vec3 pa=p-a;float y=dot(pa,ba),z=y-l2;vec3 w=pa*l2-ba*y;float x2=dot(w,w),y2=y*y*l2,z2=z*z*l2;
  float k=sign(rr)*rr*rr*x2;
  if(sign(z)*a2*z2>k)return sqrt(x2+z2)*il2-r2;
  if(sign(y)*a2*y2<k)return sqrt(x2+y2)*il2-r1;
  return (sqrt(x2*a2*il2)+y*rr)*il2-r1;}
float sdTor(vec3 p,vec2 t){vec2 q=vec2(length(p.xz)-t.x,p.y);return length(q)-t.y;}
float gSway,gScrub,gAmt,gDroop,gX;
`,
  maps: [`/* ══ 오이와 ══ */
vec2 mapOiwa(vec3 p){
  vec3 q=p;
  float tilt=gSway*.075+gDroop*.05;
  q.y-=sin(iT*1.05)*.022;
  q+=vec3(sin(iT*31.)*.007,cos(iT*27.)*.006,0.)*gAmt;
  q.xy=mat2(cos(tilt),-sin(tilt),sin(tilt),cos(tilt))*q.xy;
  q.y+=gDroop*.05;

  vec3 LC=vec3(0.,.95,0.), l=q-LC;
  float lan=sdEll(l,vec3(.58,.54,.58));
  lan=max(lan,abs(l.y)-.345)-.035;
  vec2 r=vec2(lan,0.);
  float capT=max(sdEll(q-vec3(0.,1.325,0.),vec3(.21,.09,.21)),abs(q.y-1.325)-.045);
  float capB=max(sdEll(q-vec3(0.,.585,0.),vec3(.25,.09,.25)),abs(q.y-.585)-.04);
  float wood=min(capT,capB);
  wood=min(wood,sdCap(q,vec3(0.,1.36,0.),vec3(0.,2.4,0.),.016));
  if(wood<r.x)r=vec2(wood,5.);

  float hb=length(q-vec3(0.,.70,-.12))-1.45;
  if(hb<.22){
    float h=sdEll(q-vec3(0.,1.02,-.14),vec3(.74+gAmt*.05,.66+gAmt*.07,.68));
    h=smin(h,sdCone(q,vec3(gSway*.014,.95,-.16),vec3(gSway*.045,-.16+gAmt*.30,-.26-gAmt*.12),.66,.44+gAmt*.10),.22);
    h=max(h,-(lan+.02));
    h=max(h,(.80-abs(atan(q.x,q.z)))*.42);
    if(h<r.x)r=vec2(h,1.);
  } else if(hb<r.x) r=vec2(hb,1.);

  float neck=sdCap(q,vec3(0.,.40,0.),vec3(0.,.64,0.),.085);
  if(neck<r.x)r=vec2(neck,3.);

  float armA=iPose==1? -.30 : (iPose==2? .40 : 0.);
  float br=sin(iT*1.4)*.012;
  vec3 oL=vec3(0.),oR=vec3(0.);
  if(iPose==1){ oL=vec3(.05*gScrub,.035*gScrub,.20*gScrub); oR=-oL; }
  if(iPose==2){ oL=vec3(.06*gAmt,.16*gAmt,.10*gAmt); oR=vec3(-.06*gAmt,.16*gAmt,.10*gAmt); }
  vec3 shL=vec3(-.26,.34+br,0.),shR=vec3(.26,.34+br,0.);
  vec3 elL=vec3(-.40,-.10+armA*.3,.06+armA*.22)+oL, elR=vec3(.40,-.12+armA*.3,.05+armA*.22)+oR;
  float robe=sdCone(q,vec3(0.,.42,0.),vec3(0.,-.58,0.),.235,.44);
  robe=max(robe,-(q.y+.46+.10*sin(atan(q.z,q.x)*7.+1.3)));
  robe=smin(robe,sdCone(q,shL,elL,.165,.125),.07);
  robe=smin(robe,sdCone(q,shR,elR,.165,.125),.07);
  if(robe<r.x)r=vec2(robe,2.);

  vec3 hL=vec3(-.33,-.44+armA*.52,.16+armA*.36)+oL*1.9, hR=vec3(.34,-.46+armA*.52,.14+armA*.36)+oR*1.9;
  float arms=sdCap(q,elL,hL,.052);
  arms=min(arms,sdCap(q,elR,hR,.052));
  arms=smin(arms,length(q-hL)-.078,.04);
  arms=smin(arms,length(q-hR)-.078,.04);
  if(arms<r.x)r=vec2(arms,3.);

  float legs=sdCap(q,vec3(-.13,-.40,0.),vec3(-.13,-.90,.01),.075);
  legs=min(legs,sdCap(q,vec3(.13,-.40,0.),vec3(.13,-.90,.01),.075));
  legs=smin(legs,sdEll(q-vec3(-.13,-.94,.05),vec3(.095,.05,.15)),.04);
  legs=smin(legs,sdEll(q-vec3( .13,-.94,.05),vec3(.095,.05,.15)),.04);
  if(legs<r.x)r=vec2(legs,3.);
  return r;
}

`,`/* ══ 야차 ══ */
vec2 mapYacha(vec3 p){
  vec3 q=rotX(p-vec3(0.,-.55,0.),.09+gAmt*.12)+vec3(0.,-.55,0.);
  q.y-=gSway*.012-gDroop*.05;

  float body=sdEll(q-vec3(0.,.16,.05),vec3(.46,.31,.35));
  body=smin(body,sdEll(q-vec3(0.,-.15,.08),vec3(.40,.27,.33)),.18);
  body=smin(body,length(q-vec3(-.22,.25,.30))-.17,.11);
  body=smin(body,length(q-vec3( .22,.25,.30))-.17,.11);
  body=smin(body,length(q-vec3(-.31,.43,-.02))-.21,.14);
  body=smin(body,length(q-vec3( .31,.43,-.02))-.21,.14);
  body=smin(body,length(q-vec3(-.52,.34,.02))-.245,.15);
  body=smin(body,length(q-vec3( .52,.34,.02))-.245,.15);
  body=smin(body,sdCap(q,vec3(0.,.48,.02),vec3(0.,.70,.03),.215),.12);
  vec2 r=vec2(body,0.);

  float head=sdEll(q-vec3(0.,.92,.06),vec3(.45,.41,.43));
  head=smin(head,sdEll(q-vec3(0.,.66,.20),vec3(.37,.21,.35)),.14);
  head=smin(head,sdEll(q-vec3(0.,1.06,.30),vec3(.41,.10,.21)),.09);
  head=smin(head,length(q-vec3(-.36,.82,.18))-.15,.12);
  head=smin(head,length(q-vec3( .36,.82,.18))-.15,.12);
  float gape=.055+gAmt*.085;
  head=smax(head,-sdEll(q-vec3(0.,.645,.36),vec3(.285,gape+.08,.26)),.05);
  if(head<r.x)r=vec2(head,0.);

  float horn=sdCone(q,vec3(-.27,1.16,-.04),vec3(-.40,1.44,-.16),.125,.055);
  horn=smin(horn,sdCone(q,vec3(-.40,1.44,-.16),vec3(-.44,1.68,-.34),.055,.012),.05);
  horn=smin(horn,sdCone(q,vec3( .27,1.16,-.04),vec3( .40,1.44,-.16),.125,.055),.02);
  horn=smin(horn,sdCone(q,vec3( .40,1.44,-.16),vec3( .44,1.68,-.34),.055,.012),.05);
  for(int i=0;i<5;i++){ float fi=float(i)-2., fx=fi*.105, sc=1.+abs(fi)*.42;
    horn=min(horn,sdCone(q,vec3(fx,.705,.395),vec3(fx,.705-(gape+.055)*sc,.425),.036*sc,.006));
    if(i<4){ float gx=(float(i)-1.5)*.115, gs=1.+abs(float(i)-1.5)*.40;
      horn=min(horn,sdCone(q,vec3(gx,.585,.395),vec3(gx,.585+(gape+.04)*gs,.425),.030*gs,.006)); } }
  if(horn<r.x)r=vec2(horn,1.);

  float mb=length(q-vec3(0.,1.10,-.22))-1.15;
  if(mb<.14){
    float m=1e9;
    for(int i=0;i<9;i++){ float a=(float(i)/8.-.5)*2.3;
      vec3 b=vec3(sin(a)*.34,1.10-abs(a)*.12,-.18-cos(a)*.28);
      vec3 t=b+vec3(sin(a)*.08,.34+sin(float(i)*1.7+gSway*.6)*.11,-.42-cos(a)*.18);
      m=smin(m,sdCone(q,b,t,.125,.014),.10); }
    if(m<r.x)r=vec2(m,2.);
  } else if(mb<r.x) r=vec2(mb,2.);

  float ay=iPose==1? -.16+gScrub*.10 : (iPose==2? .74 : 0.);
  float az=iPose==1?  .30+gScrub*.22 : (iPose==2? -.18 : 0.);
  vec3 sL=vec3(-.52,.34,.02),sR=vec3(.52,.34,.02);
  vec3 eL=vec3(-.80,-.02+ay*.45,.08+az*.5),eR=vec3(.80,-.04+ay*.45,.06+az*.5);
  vec3 fL=vec3(-.72,-.44+ay,.30+az),fR=vec3(.73,-.46+ay,.28+az);
  if(iPose==1){ fL.z+=gScrub*.10; fR.z-=gScrub*.10; }
  float arm=sdCone(q,sL,eL,.205,.165);
  arm=min(arm,sdCone(q,sR,eR,.205,.165));
  arm=smin(arm,sdCone(q,eL,fL,.165,.175),.06);
  arm=smin(arm,sdCone(q,eR,fR,.165,.175),.06);
  arm=smin(arm,sdEll(q-fL,vec3(.21,.19,.20)),.05);
  arm=smin(arm,sdEll(q-fR,vec3(.21,.19,.20)),.05);
  if(arm<r.x)r=vec2(arm,0.);

  float cloth=sdEll(q-vec3(0.,-.36,.02),vec3(.475,.205,.44));
  cloth=min(cloth,sdBox(q-vec3(0.,-.60,.345),vec3(.215,.175,.015),.035));
  cloth=min(cloth,sdBox(q-vec3(0.,-.60,-.295),vec3(.215,.175,.015),.035));
  cloth=min(cloth,sdEll(q-vec3(0.,-.22,.02),vec3(.495,.05,.455)));
  if(cloth<r.x)r=vec2(cloth,3.);

  float eye=min(length(q-vec3(-.20,.98,.37))-.135,length(q-vec3(.20,.98,.37))-.135);
  if(eye<r.x)r=vec2(eye,4.);

  float leg=sdCone(q,vec3(-.25,-.36,.02),vec3(-.31,-.72,.03),.225,.16);
  leg=min(leg,sdCone(q,vec3(.25,-.36,.02),vec3(.31,-.72,.03),.225,.16));
  leg=smin(leg,sdCone(q,vec3(-.31,-.72,.03),vec3(-.34,-.93,-.01),.16,.125),.05);
  leg=smin(leg,sdCone(q,vec3( .31,-.72,.03),vec3( .34,-.93,-.01),.16,.125),.05);
  leg=smin(leg,sdEll(q-vec3(-.35,-.96,.11),vec3(.155,.07,.25)),.05);
  leg=smin(leg,sdEll(q-vec3( .35,-.96,.11),vec3(.155,.07,.25)),.05);
  if(leg<r.x)r=vec2(leg,0.);
  return r;
}

`,`/* ══ 카파 ══ */
vec2 mapKappa(vec3 p){
  float hop=abs(sin(iT*(1.9+gAmt*3.0)))*(.042+gAmt*.055);
  vec3 q=p-vec3(0.,.06,0.); q.y-=hop; q=rotZ(q,sin(iT*1.9)*.05);
  q.y+=gDroop*.06;
  float bd=sdEll(q-vec3(0.,-.02,.02),vec3(.34,.33,.30));
  bd=smin(bd,sdEll(q-vec3(0.,-.30,.02),vec3(.28,.14,.26)),.14);
  vec2 r=vec2(bd,0.);
  /* 등갑 — 몸보다 넓어 정면에서도 양옆으로 나온다 */
  vec3 sq=q-vec3(0.,.02,-.13);
  float shl=sdEll(sq,vec3(.475,.445,.335));
  shl=max(shl,sq.z-.15);
  float marg=sdTor(rotX(sq,1.5708),vec2(.445,.062));
  marg=max(marg,sq.z-.15);
  shl=smin(shl,marg,.045);
  shl=smax(shl,-sdTor(rotX(sq-vec3(0.,0.,.02),1.5708),vec2(.295,.026)),.035);
  for(int i=0;i<5;i++){ float a=(float(i)-2.)*1.256;
    shl=smax(shl,-sdCap(sq,vec3(sin(a)*.07,cos(a)*.07,-.31),vec3(sin(a)*.49,cos(a)*.49,.06),.024),.035); }
  if(shl<r.x)r=vec2(shl,1.);
  float pla=sdEll(q-vec3(0.,-.05,.285),vec3(.225,.255,.060));
  pla=smax(pla,-sdTor(rotX(q-vec3(0.,-.05,.30),1.5708),vec2(.165,.016)),.025);
  if(pla<r.x)r=vec2(pla,7.);
  vec3 hp=vec3(0.,.44,.02);
  float hd=sdEll(q-hp,vec3(.30,.27,.28));
  hd=smax(hd,-sdEll(q-hp-vec3(0.,.30,0.),vec3(.175,.085,.175)),.035);
  if(hd<r.x)r=vec2(hd,0.);
  float rim2=sdTor(q-hp-vec3(0.,.255,0.),vec2(.185,.040));
  if(rim2<r.x)r=vec2(rim2,1.);
  /* 접시 물 — 쏟을수록 얕아진다. 마르면 힘을 잃는다 */
  float wl=clamp(gX,0.,1.);
  if(wl>.03){
    float wat=sdEll(q-hp-vec3(0.,.206+wl*.042+sin(iT*2.6)*.009*wl,0.),
                    vec3(.170*(.58+.42*wl),.006+.026*wl,.170*(.58+.42*wl)));
    if(wat<r.x)r=vec2(wat,5.); }
  float bk=sdCone(q,hp+vec3(0.,-.06,.21),hp+vec3(0.,-.085,.37),.105,.045);
  if(bk<r.x)r=vec2(bk,4.);
  float ey=min(sdEll(q-hp-vec3(-.125,.055,.235),vec3(.080,.090,.055)),
               sdEll(q-hp-vec3( .125,.055,.235),vec3(.080,.090,.055)));
  if(ey<r.x)r=vec2(ey,3.);
  float pu=min(length(q-hp-vec3(-.122,.052,.285))-.044,
               length(q-hp-vec3( .122,.052,.285))-.044);
  if(pu<r.x)r=vec2(pu,6.);
  float gl2=min(length(q-hp-vec3(-.100,.082,.312))-.018,
                length(q-hp-vec3( .144,.082,.312))-.018);
  if(gl2<r.x)r=vec2(gl2,3.);
  float ah=iPose==1? .00+gScrub*.09 : (iPose==2? .42 : .20);
  float az=iPose==1? .34+gScrub*.12 : (iPose==2? .08 : .20);
  float lb=1e9;
  for(int s=0;s<2;s++){ float sx=s==0?-1.:1.;
    float sw=sin(iT*1.9+float(s)*3.14)*(iPose==1? .04 : .09);
    lb=smin(lb,sdCap(q,vec3(sx*.28,.10,.06),vec3(sx*(.44+sw*.2),ah+sw,az),.065),.05);
    lb=smin(lb,sdEll(q-vec3(sx*(.48+sw*.2),ah+sw-.02,az+.04),vec3(.085,.09,.035)),.03);
    lb=smin(lb,sdCap(q,vec3(sx*.17,-.36,.04),vec3(sx*.20,-.56,.08),.072),.05);
    lb=smin(lb,sdEll(q-vec3(sx*.20,-.60,.12),vec3(.085,.035,.115)),.03); }
  if(lb<r.x)r=vec2(lb,0.);
  return r;
}
`,`/* ══ 어둑시니 ══ */
vec2 mapEodook(vec3 p){
  float big=max(.55,gX)*(1.+.045*sin(iT*.8));
  vec3 q=(p-vec3(0.,.04,0.))/big;
  q.y+=gDroop*.05;
  float wob=(sin(q.y*5.2+iT*1.6)*.030+sin(q.y*9.1-iT*1.1)*.016)*(1.+gAmt*1.8);
  q.x+=wob; q.z+=wob*.6;
  float hd=sdEll(q-vec3(0.,.66,0.),vec3(.295,.315,.30));
  float nk=sdCap(q,vec3(0.,.46,0.),vec3(0.,.34,0.),.115);
  float bd=sdCone(q,vec3(0.,.38,0.),vec3(0.,-.34,0.),.235,.33);
  float d=smin(smin(hd,nk,.07),bd,.12);
  for(int i=0;i<6;i++){ float fi=float(i);
    float a=fi*1.05-.5, R=.20+.10*sin(iT*.8+fi);
    vec3 t0=vec3(cos(a)*R*.9,-.26,sin(a)*R*.55);
    vec3 t1=t0+vec3(sin(iT*.9+fi)*.17,-.52-.13*sin(iT*1.2+fi),cos(iT*.7+fi)*.10);
    d=smin(d,sdCone(q,t0,t1,.135,.022),.15); }
  float ay=iPose==1? .00+gScrub*.11 : (iPose==2? .36 : -.14);
  float az=iPose==1? .30+gScrub*.14 : (iPose==2? .06 : .14);
  d=smin(d,sdCap(q,vec3(-.21,.30,.05),vec3(-.34,ay,az),.062),.09);
  d=smin(d,sdCap(q,vec3( .21,.30,.05),vec3( .34,ay,az),.062),.09);
  vec2 r=vec2(d*big,0.);
  vec3 er=vec3(.062+gAmt*.052,.078+gAmt*.058,.05);
  float ey=min(sdEll(q-vec3(-.105-gAmt*.02,.705,.265),er),
               sdEll(q-vec3( .105+gAmt*.02,.705,.265),er));
  if(ey*big<r.x)r=vec2(ey*big,3.);
  return r;
}
`],
  fn: ['mapOiwa','mapYacha','mapKappa','mapEodook'],
  nsa: `vec3 nor(vec3 p){vec2 e=vec2(.0016,0);
  return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x,map(p+e.yxy).x-map(p-e.yxy).x,map(p+e.yyx).x-map(p-e.yyx).x));}
float sha(vec3 ro,vec3 rd){float s=1.,t=.05;
  for(int i=0;i<24;i++){float h=map(ro+rd*t).x;if(h<.002)return 0.;s=min(s,9.*h/t);t+=clamp(h,.04,.30);if(t>3.6)break;}
  return clamp(s,0.,1.);}
float ao(vec3 p,vec3 n){float o=0.,w=1.;
  for(int i=0;i<4;i++){float h=.025+.13*float(i);o+=(h-map(p+n*h).x)*w;w*=.72;}
  return clamp(1.-1.5*o,0.,1.);}
float ell2(vec2 p,vec2 c,vec2 r,float s){return 1.-smoothstep(-s,s,length((p-c)/r)-1.);}
float bar2(vec2 p,vec2 c,vec2 r,float a){
  vec2 q=p-c;q=vec2(q.x*cos(a)-q.y*sin(a),q.x*sin(a)+q.y*cos(a));
  vec2 d=abs(q)-r;return 1.-smoothstep(-.014,.014,min(max(d.x,d.y),0.)+length(max(d,0.)));}

`,
  mainA: `void main(){
  vec2 uv=(gl_FragCoord.xy*2.-iR)/iR.y;
  gSway=sin(iT*.9);
  gScrub=iPose==1? sin(iT*3.4) : 0.;
  gAmt=iAmt;
  gDroop=(1.-iMood)*.5; gX=iX;

  float cd = iChar==0? 3.62 : iChar==1? 4.05 : iChar==2? 2.72 : 3.15;
  float cy = iChar==0? .30 : iChar==1? .10 : iChar==2? .02 : .06;
  if(iChar==3) cd*=(1.+(max(.6,gX)-1.)*.62);   /* 어둑시니는 커지면 카메라가 물러난다 */
  vec3 ro=vec3(0.,.38+cy*.4,cd);
  vec3 ww=normalize(vec3(0.,cy,0.)-ro),uu=normalize(cross(vec3(0,1,0),ww)),vv=cross(ww,uu);
  vec3 rd=normalize(uv.x*uu+uv.y*vv+2.25*ww);
  float t=.1;vec2 h=vec2(-1.);
  for(int i=0;i<84;i++){h=map(ro+rd*t);if(h.x<.0018*t)break;t+=h.x*.82;if(t>7.){h.y=-1.;break;}}
  if(h.y<0.){ O=vec4(0.); return; }

  vec3 p=ro+rd*t,n=nor(p),base;
`,
  paint: [`
    if(h.y<.5){
      vec3 l=p-vec3(0.,.95,0.);
      float rib=abs(fract(l.y*7.5)-.5)*2.;
      base=mix(PAPER*.58,PAPER,smoothstep(.06,.40,rib));
      float u=atan(l.x,l.z); vec2 f=vec2(u*.50,l.y);
      if(abs(u)<1.25){
        base=mix(base,PINK,max(ell2(f,vec2(-.20,-.01),vec2(.165,.125),.022),ell2(f,vec2(.19,.10),vec2(.105,.080),.022)));
        base=mix(base,vec3(.86,.84,.78),max(ell2(f,vec2(-.20,.025),vec2(.120,.070),.016),ell2(f,vec2(.19,.115),vec2(.072,.050),.016)));
        base=mix(base,vec3(.05,.04,.07),max(ell2(f,vec2(-.195,.005),vec2(.050,.050),.012),ell2(f,vec2(.188,.098),vec2(.038,.038),.012)));
        base=mix(base,PINK,bar2(f,vec2(-.210,.100),vec2(.150,.030),-.30));
        base=mix(base,PINK,bar2(f,vec2( .200,.225),vec2(.130,.028), .44));
        base=mix(base,PAPER*.93,ell2(f,vec2(-.205,.145),vec2(.205,.125),.018));
        base=mix(base,PINK,bar2(f,vec2(-.205,.030),vec2(.150,.016),-.07));
        base=mix(base,PINK,ell2(f,vec2(-.01,-.210),vec2(.185,.044+gAmt*.055),.016));
        base=mix(base,PINK,bar2(f,vec2(-.185,-.160),vec2(.060,.015),-.62));
        base=mix(base,PINK,bar2(f,vec2( .165,-.160),vec2(.060,.015), .62));
        base=mix(base,vec3(.52,.60,.72),bar2(f,vec2(-.205,-.13),vec2(.030,.155),.04)*gAmt*.85);
        base=mix(base,vec3(.52,.60,.72),bar2(f,vec2( .190,-.06),vec2(.024,.125),-.04)*gAmt*.7);
        base=mix(base,PINK*1.5,bar2(f,vec2(-.02,-.085),vec2(.014,.050),.08));
      }
    }
    else if(h.y<1.5) base=HAIR;
    else if(h.y<2.5){ base=ROBE*(.86+.14*sin(atan(p.z,p.x)*9.));
      if(abs(p.y-.02)<.055) base=vec3(.42,.36,.44);
      base*=.90+.10*smoothstep(-.6,.4,p.y); }
    else if(h.y<3.5) base=SKIN;
    else base=WOOD;`,`
    if(h.y<.5){
      base=YSKIN;
      vec3 d=p-vec3(0.,.92,.06);
      if(d.z>.10){ vec2 f=vec2(d.x,d.y);
        base=mix(base,YINK,bar2(f,vec2(-.23,.16),vec2(.175,.032),-.40));
        base=mix(base,YINK,bar2(f,vec2( .23,.16),vec2(.175,.032), .40));
        base=mix(base,YINK,bar2(f,vec2(-.055,.11),vec2(.016,.075),-.16));
        base=mix(base,YINK,bar2(f,vec2( .055,.11),vec2(.016,.075), .16));
        base=mix(base,YSKIN*.72,bar2(f,vec2(0.,-.14),vec2(.030,.065),0.)); }
      float gp=.055+gAmt*.085;
      if(length((p-vec3(0.,.645,.36))/vec3(.30,gp+.10,.29))<1.06) base=vec3(.26,.035,.05);
      base*=.88+.12*smoothstep(-.5,.6,p.y);
    }
    else if(h.y<1.5) base=HORN;
    else if(h.y<2.5) base=MANE;
    else if(h.y<3.5){ base=CLOTH;
      float st=sin(p.x*7.5+p.y*2.4+sin(p.y*5.)*.8)*.5+.5;
      base=mix(base,vec3(.26,.12,.05),smoothstep(.40,.56,st));
      if(abs(p.y+.22)<.058) base=vec3(.44,.16,.12); }
    else { base=EYEW;
      vec3 d=p-vec3(sign(p.x)*.20,.98,.37);
      if(length(d.xy-vec2(0.,-.012))<.062) base=vec3(.95,.78,.10);
      if(length(d.xy-vec2(0.,-.012))<.030) base=YINK; }
`,`
    if(h.y<.5){ base=vec3(.42,.66,.38); base*=.90+.10*smoothstep(-.5,.5,p.y); }
    else if(h.y<1.5) base=vec3(.24,.27,.14);
    else if(h.y<3.5) base=vec3(.97,.96,.90);
    else if(h.y<4.5) base=vec3(.92,.76,.24);
    else if(h.y<5.5) base=vec3(.42,.72,.86);
    else if(h.y<6.5) base=vec3(.07,.09,.11);
    else base=vec3(.76,.69,.42);
`,`
    base = h.y<2.5? vec3(.045,.035,.070) : vec3(.90,.92,.98);
`],
  light: `  vec3 L=normalize(vec3(-.48,.80,.62));
  float dif=clamp(dot(n,L),0.,1.), s=sha(p+n*.025,L), o=ao(p,n);
  float sky=clamp(.5+.5*n.y,0.,1.);
  float rim=pow(clamp(1.+dot(n,rd),0.,1.),3.);
  vec3 lin=base*(vec3(1.08,1.00,.86)*dif*s*1.06 + vec3(.36,.38,.50)*sky*o*.52 + vec3(.22)*o);
  lin+=rim*.24*vec3(1.,.88,.76)*o;
  if(iChar==0 && h.y<.5){
    float gl=smoothstep(.42,-.30,p.y-.95);
    float flick=.84+.16*sin(iT*17.)*sin(iT*7.3);
    lin+=base*vec3(1.30,.92,.40)*(.16+gl*.30)*flick*(1.-gAmt*.55);
  }
  if(iChar==1) lin+=YSKIN*gAmt*.18*clamp(1.-p.y,0.,1.)*o;
  lin+=rim*gAmt*.18*(iChar==0? vec3(.5,.7,1.) : vec3(1.,.35,.2));
`,
  extra: `  if(iChar==2){
    if(h.y>4.5&&h.y<5.5) lin+=vec3(.25,.55,.75)*(.35+gX*.35);
    lin+=vec3(.9,.8,.3)*gAmt*.12*o;
  }
  if(iChar==3){
    lin*=.42;                                   /* 어둠 덩어리 — 주변광을 깎는다 */
    lin+=vec3(.52,.34,.80)*rim*(.60+gAmt*1.3);
    if(h.y>2.5) lin+=vec3(.5,.52,.6)*.45;       /* 창백한 눈만 떠 있다 */
  }
`
};
/* 요괴 하나짜리 프래그먼트 셰이더를 만든다. iChar를 상수로 박아
   팔레트·카메라·조명 분기가 컴파일 때 접힌다. */
function buildFS(i){
  return SH.head + SH.consts + SH.helpers + 'const int iChar=' + i + ';\n'
       + SH.maps[i] + 'vec2 map(vec3 p){return ' + SH.fn[i] + '(p);}\n'
       + SH.nsa + SH.mainA + SH.paint[i] + SH.light + SH.extra
       + '  O=vec4(pow(clamp(lin,0.,1.),vec3(.4545)),1.);\n}\n';
}
