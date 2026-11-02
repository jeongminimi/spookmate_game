#!/usr/bin/env python3
"""요괴별 이미지보드(캐릭터 디자인 시트)를 실제 SDF 모델에서 찍어낸다.
그림을 새로 그리는 대신 게임에 들어갈 모델 그대로를 여러 각도로 렌더한다."""
import re, json, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT  = ROOT/'preview'/'sheet'

# ── 게임 셰이더에서 오이와·야차 떼어오기 ──────────────────────────
g = (ROOT/'src'/'c_shader.js').read_text(encoding='utf-8')
g = g[g.index('const CHAR_FS = `')+len('const CHAR_FS = `'):]
CONSTS = g[g.index('/* 오이와 */'):g.index('float smin')]
ELLBAR = g[g.index('float ell2('):g.index('void main(){')]
MAP_OIWA  = g[g.index('/* ══ 오이와 ══ */'):g.index('vec2 mapYacha')]
MAP_YACHA = g[g.index('vec2 mapYacha'):g.index('vec2 map(vec3 p){ return iChar==0')]
PAINT = g[g.index('  if(iChar==0){\n    if(h.y<.5){'):g.index('  vec3 L=normalize(vec3(-.48,.80,.62));')]
LIGHT_GAME = g[g.index('  vec3 L=normalize(vec3(-.48,.80,.62));'):g.index('  O=vec4(pow(clamp(lin,0.,1.)')]

# ── 미리보기에서 새 여섯 마리 떼어오기 ────────────────────────────
c = (ROOT/'preview'/'cast6.html').read_text(encoding='utf-8')
HELP  = re.search(r'const HEAD=`(.*?)`;', c, re.S).group(1)
HELP  = HELP[HELP.index('float smin'):]
MAPS6 = re.findall(r'`(/\* ══ \d\..*?)`', c, re.S)
NSA   = re.search(r'const NSA=`(.*?)`;', c, re.S).group(1)
PAL   = re.search(r'const PAL=`(.*?)`;', c, re.S).group(1)
LIGHT6= """  vec3 L=normalize(vec3(.62,.80,.55));
  float dif=clamp(dot(n,L),0.,1.), s=sha(p+n*.01,L), o=ao(p,n);
  float sky=clamp(.5+.5*n.y,0.,1.);
  float rim=pow(clamp(1.+dot(rd,n),0.,1.),2.6);
  float amb = gC==1? .34 : 1.;
  vec3 lin=base*(vec3(1.08,1.00,.86)*dif*s*1.06 + vec3(.36,.38,.50)*sky*o*.52*amb + vec3(.22)*o*amb);
  lin+=rim*.26*vec3(1.,.88,.76)*o;
  if(gC==1) lin+=vec3(.52,.34,.80)*rim*(.70+gE*1.5);
  if(gC==4 && h.y>4.5 && h.y<5.5) lin+=vec3(.25,.55,.75)*.5;
  if(gC==5) lin+=base*pow(clamp(dot(n,normalize(vec3(.3,1.,.6))),0.,1.),22.)*.55;
  vec3 peak = gC==0? vec3(.30,.70,.55) : gC==1? vec3(.55,.30,.95) : gC==2? vec3(.95,.80,.35)
            : gC==3? vec3(.85,.35,.40) : gC==4? vec3(.35,.85,.95) : vec3(.70,.95,.25);
  lin += peak*gE*(.10+rim*.55)*o;
"""
FN6 = ['mapUrong','mapEodook','mapKudan','mapNuppe','mapKappa','mapAka']
print('떼어낸 조각:', {k:len(v) for k,v in
  dict(consts=CONSTS,ellbar=ELLBAR,oiwa=MAP_OIWA,yacha=MAP_YACHA,paint=PAINT,help=HELP,nsa=NSA,pal=PAL).items()})
print('새 여섯 맵:', [len(m) for m in MAPS6])
json.dump({'CONSTS':CONSTS,'ELLBAR':ELLBAR,'MAP_OIWA':MAP_OIWA,'MAP_YACHA':MAP_YACHA,
           'PAINT':PAINT,'LIGHT_GAME':LIGHT_GAME,'HELP':HELP,'MAPS6':MAPS6,'NSA':NSA,
           'PAL':PAL,'LIGHT6':LIGHT6,'FN6':FN6},
          open('/tmp/claude-0/-home-claude/e748f480-b5ef-5bac-b41e-db78a4bb3d9f/scratchpad/pieces.json','w'), ensure_ascii=False)

# ── 요괴별 메타데이터 ─────────────────────────────────────────────
CAST = [
 dict(k='oiwa', name='오이와', emo='우울', game=1, idx=0, c='#7fa8d8',
   origin='일본 · 《요츠야 괴담》', tag='달래야 움직이는 놈',
   body=(0,.60,0), bd=3.05, face=(0,.98,0), fd=1.75, det=(0,.95,0), dd=1.30, dyaw=.40, dpit=.10,
   dlab='초롱 머리 — 불이 꺼져 간다',
   pal=[('초롱 종이','#f2d999'),('먹·머리카락','#0d0b12'),('옷','#b3c2d9'),('살','#aab9b0'),('나무 테','#38261f')],
   mot=[('몸 흔들림','0.9 Hz','좌우로 천천히. 가장 느린 축'),
        ('초롱 불','17 Hz × 7.3 Hz','두 파동을 곱해 불규칙하게 깜빡인다'),
        ('숨','1.05 Hz','세로로 2.2% 오르내린다'),
        ('의욕 처짐','연속','의욕이 낮을수록 고개와 어깨가 숙여진다'),
        ('극단','0→1','머리카락이 부풀고 앞으로 쏟아진다. 초롱 불이 죽는다')],
   todo=['초롱 안쪽에서 비치는 빛이 아직 약하다','손가락이 없다','옷 주름이 평평하다']),
 dict(k='yacha', name='야차', emo='분노', game=1, idx=1, c='#ff5a4a',
   origin='불교권 · 야차(夜叉)', tag='혼내야 멈추는 놈',
   body=(0,.22,0), bd=3.40, face=(0,.92,0), fd=1.60, det=(0,.80,.12), dd=1.35, dyaw=.30, dpit=.05,
   dlab='뿔과 이빨 — 벌어질수록 위험하다',
   pal=[('살','#e03321'),('뿔·이빨','#f5e8bd'),('갈기','#291010'),('천','#eb9929'),('눈','#f5f0e0')],
   mot=[('상체 기울기','연속','전조가 차오를수록 앞으로 숙인다'),
        ('문지르기','3.4 Hz','설거지 중 팔이 가장 빠르게 움직인다'),
        ('입 벌어짐','0→1','전조에서 아래턱이 내려가고 이빨이 드러난다'),
        ('갈기','1.7 Hz','아홉 가닥이 각각 다른 위상으로 흔들린다'),
        ('극단','0→1','몸에서 붉은빛이 올라온다. 떨림이 섞인다')],
   todo=['손가락이 뭉툭하다','근육 결이 없다','갈기 끝이 뭉쳐 보인다']),
 dict(k='urong', name='우렁각시', emo='수치', game=0, idx=0, c='#b8e6d0',
   origin='한국 · 우렁각시 설화', tag='안 보는 척해야 일하는 놈',
   body=(0,.10,0), bd=2.65, face=(-.12,.84,.06), fd=1.15, det=(.40,.18,-.12), dd=1.30, dyaw=-.75, dpit=.08,
   dlab='나선 껍데기 — 몸집의 절반',
   pal=[('옷','#ccd1c2'),('껍데기','#94b39e'),('살','#dbd6c7'),('머리카락','#1a171f'),('눈','#f7f5eb')],
   mot=[('부끄러움','0.55 Hz','머리를 껍데기 쪽으로 당겼다 놓는다'),
        ('숨','1.1 Hz','세로로 1.5%'),
        ('손','연동','부끄러울수록 얼굴 쪽으로 올라온다'),
        ('눈','고정','눈동자가 아래로 몰려 정면을 못 본다'),
        ('극단','0→1','몸이 껍데기 안으로 빨려 들어가고 껍데기만 떤다')],
   todo=['얼굴이 작아 표정이 거의 안 보인다','껍데기 나선 골이 더 깊어야 한다','치마 아래가 밋밋하다']),
 dict(k='eodook', name='어둑시니', emo='공포', game=0, idx=1, c='#a98fd8',
   origin='한국 · 어둑시니', tag='혼내면 커지는 놈',
   body=(0,.05,0), bd=2.75, face=(0,.70,0), fd=1.25, det=(0,-.48,0), dd=1.45, dyaw=.25, dpit=.02,
   dlab='풀리는 아랫단 — 다리가 없다',
   mot=[('부풀기','0.8 Hz + 2.3 Hz','두 파동이 겹쳐 숨처럼 보인다'),
        ('윤곽 물결','높이 연동','세로 위치에 따라 좌우로 흔들린다'),
        ('연기 가닥','0.35 rad/s','여섯 가닥이 천천히 회전한다'),
        ('눈','고정','눈동자 없이 창백한 흰 점 둘'),
        ('극단','0→1','1.8배로 부풀고 눈이 커진다. 카메라가 물러나야 한다')],
   pal=[('몸','#0b0912'),('눈','#e6ebfa'),('테두리 빛','#8556cc')],
   todo=['보라색이 선명해서 괴담보다 판타지에 가깝다','연기 가닥이 뭉툭하다','팔이 거의 안 보인다']),
 dict(k='kudan', name='쿠단', emo='불안', game=0, idx=2, c='#f0dcb4',
   origin='일본 · 쿠단(件)', tag='재앙을 미리 말하는 놈',
   body=(0,.02,0), bd=2.85, face=(0,.58,.56), fd=1.05, det=(0,.14,.18), dd=1.75, dyaw=.70, dpit=.22,
   dlab='몸통 — 극단에서 눈이 돋는 자리',
   mot=[('입','3.1 Hz','쉬지 않고 여닫는다. 계속 예언한다'),
        ('다리 떨림','2.1 Hz','네 다리가 각각 다른 위상'),
        ('꼬리','1.7 Hz','좌우로 흔든다'),
        ('숨','1.3 Hz','세로로 1.2%'),
        ('극단','0→1','입이 찢어지고 몸통 표면에 눈 일곱이 돋는다')],
   pal=[('가죽','#d6ccb8'),('발굽·뿔','#423833'),('사람 얼굴','#e0cbb3'),('흰자','#f2f0e6'),('먹','#381a1f')],
   todo=['아직 양처럼 보인다. 얼굴을 더 납작하게 눌러야 한다','머리카락이 없다','몸통 눈이 멀리서 점으로 보인다']),
 dict(k='nuppe', name='눗페포', emo='권태', game=0, idx=3, c='#e8b0b8',
   origin='일본 · 눗페포(ぬっぺっぽう)', tag='시작을 안 하는 놈',
   body=(0,-.08,0), bd=2.80, face=(0,.02,.34), fd=1.30, det=(-.34,-.16,.30), dd=1.15, dyaw=-.45, dpit=.06,
   dlab='접힌 살 — 주름이 얼굴처럼 보인다',
   mot=[('주저앉기','0.62 Hz','가장 느린 축. 아래로 눌렸다 올라온다'),
        ('좌우 기울기','0.44 Hz','천천히 비스듬히'),
        ('눈','어긋남','좌우 높이를 다르게 둬서 초점이 안 맞는다'),
        ('극단','0→1','세로로 38%까지 눌리고 가로로 52% 퍼진다'),
        ('얼굴 이동','0→1','녹을수록 얼굴이 앞면에서 윗면으로 떠오른다')],
   pal=[('살','#b39188'),('눈·입','#291c1f'),('눈동자','#eee8e0')],
   todo=['입이 주름에 묻혀 거의 안 보인다','눈이 점 두 개라 멍한 표정이 안 읽힌다','이름값(넙데데한 얼굴)을 더 살려야 한다']),
 dict(k='kappa', name='카파', emo='기쁨', game=0, idx=4, c='#8fe0a0',
   origin='일본 · 카파(河童)', tag='칭찬하면 물을 쏟는 놈',
   body=(0,.00,0), bd=2.45, face=(0,.48,.06), fd=1.10, det=(0,.70,0), dd=1.00, dyaw=.30, dpit=.52,
   dlab='머리 접시 — 물이 마르면 힘을 잃는다',
   mot=[('폴짝','1.9 Hz','세로로 4.5% 튀어 오른다. 가장 활발하다'),
        ('팔','1.9 Hz','뛰는 박자에 맞춰 좌우가 엇갈린다'),
        ('접시 물','2.6 Hz','수면이 찰랑인다'),
        ('몸 기울기','1.9 Hz','뛸 때마다 좌우로 기운다'),
        ('극단','0→1','팔을 들고 접시가 기울어 물이 쏟아진다. 물방울이 날린다')],
   pal=[('살','#6ba861'),('등껍질','#4d6b42'),('부리','#eac23d'),('흰자','#f7f5e6'),('접시 물','#6bb8db')],
   todo=['등껍질 무늬가 없다','물갈퀴가 뭉툭하다','접시 물이 더 선명해야 의욕 게이지로 쓸 수 있다']),
 dict(k='aka', name='아카나메', emo='혐오', game=0, idx=5, c='#b6d46a',
   origin='일본 · 아카나메(垢嘗)', tag='기준이 뒤집힌 놈',
   body=(0,.00,0), bd=2.65, face=(0,.46,.16), fd=1.20, det=(0,-.14,.30), dd=1.30, dyaw=.20, dpit=.04,
   dlab='혀 — 유일하게 아래로 뻗는 실루엣',
   mot=[('혀','0.95 Hz','좌우로 느리게 휘젓는다'),
        ('숨','1.15 Hz','세로로 1.4%'),
        ('눈','고정','눈동자가 아래로 몰리고 눈꺼풀이 덮는다'),
        ('기름기','각도 연동','보는 각도에 따라 피부에 번들거림이 돈다'),
        ('극단','0→1','혀가 2.25배로 늘어 바닥에 닿고 입이 세로로 찢어진다')],
   pal=[('피부','#8f9e57'),('등','#66703d'),('혀','#cc5c66'),('흰자','#f0eec7'),('입 안','#331a1c')],
   todo=['손가락이 가늘어 부러져 보인다','혀 표면이 매끈해서 질감이 없다','웅크린 자세가 더 낮아야 한다']),
]

VIEWS_COMMON = [
 ('전신 · 정면',   0.0000,  .06, 'b', 0.0, 0),
 ('전신 · 측면',   1.5708,  .04, 'b', 0.0, 0),
 ('전신 · 3/4',    0.6200,  .10, 'b', 0.0, 0),
 ('전신 · 뒷면',   3.1416,  .06, 'b', 0.0, 0),
 ('얼굴 · 정면',   0.0000,  .02, 'f', 0.0, 0),
 ('얼굴 · 3/4',    0.7000,  .07, 'f', 0.0, 0),
 ('고유 디테일',   None,     .08,'d', 0.0, 0),
 (None,            0.2500, -.26, 'b', 0.0, 1),
 ('표정 · 평상',   0.0000,  .02, 'f', 0.00, 0),
 ('표정 · 전조',   0.0000,  .02, 'f', 0.42, 0),
 ('표정 · 사고',   0.0000,  .02, 'f', 0.72, 0),
 ('표정 · 극단',   0.0000,  .02, 'f', 1.00, 0),
]
print('메타데이터', len(CAST), '마리 ·', len(VIEWS_COMMON), '뷰')

HEADG = """#version 300 es
precision highp float;
out vec4 O;
uniform vec2 iR; uniform float iT; uniform float iE; uniform vec4 iCell;
uniform vec3 iCam; uniform vec3 iTgt; uniform float iFov; uniform int iPose;
float gE,gSway,gScrub,gAmt,gDroop;
"""

def build_fs(ch):
    p=[HEADG]
    if ch['game']: p.append(CONSTS)
    p.append(HELP)
    if ch['game']:
        p.append(ELLBAR)
        p.append('const int iChar=%d;\n'%ch['idx'])
        p.append(MAP_OIWA if ch['idx']==0 else MAP_YACHA)
        p.append('vec2 map(vec3 p){return %s(p);}\n'%('mapOiwa' if ch['idx']==0 else 'mapYacha'))
    else:
        p.append('const int gC=%d;\n'%ch['idx'])
        p.append(MAPS6[ch['idx']])
        p.append('vec2 map(vec3 p){return %s(p);}\n'%FN6[ch['idx']])
    p.append(NSA)
    if not ch['game']: p.append(PAL)
    p.append("""void main(){
  vec2 uv=((gl_FragCoord.xy-iCell.xy)*2.-iCell.zw)/iCell.w;
  gE=iE; gAmt=iE; gSway=sin(iT*.9); gScrub=iPose==1? sin(iT*3.4):0.; gDroop=0.;
  float ya=iCam.x, pi=iCam.y, ds=iCam.z;
  vec3 ro=iTgt+vec3(sin(ya)*cos(pi),sin(pi),cos(ya)*cos(pi))*ds;
  vec3 ww=normalize(iTgt-ro),uu=normalize(cross(vec3(0,1,0),ww)),vv=cross(ww,uu);
  vec3 rd=normalize(uv.x*uu+uv.y*vv+iFov*ww);
  float t=.04; vec2 h=vec2(-1.);
  for(int i=0;i<96;i++){h=map(ro+rd*t);if(h.x<.0015*t)break;t+=h.x*.80;if(t>12.){h.y=-1.;break;}}
  if(h.y<0.){O=vec4(0.);return;}
""")
    if ch['game']:
        p.append('  vec3 p=ro+rd*t,n=nor(p),base;\n'); p.append(PAINT); p.append(LIGHT_GAME)
    else:
        p.append('  vec3 p=ro+rd*t,n=nor(p),base=palette(h.y);\n'); p.append(LIGHT6)
    p.append('  O=vec4(pow(clamp(lin,0.,1.),vec3(.4545)),1.);\n}\n')
    return ''.join(p)

def views_for(ch):
    out=[]
    for lab,yaw,pit,tgt,emo,pose in VIEWS_COMMON:
        if lab is None:
            if ch['game']: lab,yaw,pit,pose='설거지 자세',.25,.05,1
            else:          lab,yaw,pit,pose='로우 앵글',.25,-.26,0
        if tgt=='b': g,d=ch['body'],ch['bd']
        elif tgt=='f': g,d=ch['face'],ch['fd']
        else: g,d=ch['det'],ch['dd']; yaw=ch['dyaw']; pit=ch['dpit']
        if tgt=='d': lab=ch['dlab']
        out.append(dict(t=lab,y=round(yaw,4),p=pit,d=d,g=list(g),e=emo,o=pose))
    return out

TPL = """<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{name} 이미지보드</title>
<style>
 :root{{--bg:#0d0a12;--ink:#f6efe2;--dim:#9a91a9;--line:rgba(255,255,255,.1);--c:{c}}}
 *{{box-sizing:border-box}}
 html,body{{margin:0;background:var(--bg);color:var(--ink);
  font:15px/1.6 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;-webkit-text-size-adjust:100%}}
 .wrap{{max-width:980px;margin:0 auto;padding:24px 16px 64px}}
 .hd{{border-bottom:1px solid var(--line);padding-bottom:14px;margin-bottom:18px}}
 .eyebrow{{font-size:11.5px;letter-spacing:.16em;color:var(--c);margin:0 0 6px;text-transform:uppercase}}
 h1{{font-size:27px;margin:0;letter-spacing:-.02em}}
 h1 em{{font-style:normal;font-size:15px;color:var(--c);margin-left:9px;letter-spacing:0}}
 .meta{{margin:7px 0 0;font-size:13.5px;color:var(--dim)}}
 .meta b{{color:var(--ink);font-weight:600}}
 .stage{{position:relative;aspect-ratio:4/3;border:1px solid var(--line);border-radius:14px;overflow:hidden;
  background:radial-gradient(130% 95% at 50% 15%,#1b1424 0%,#0a080e 100%)}}
 .stage canvas{{display:block;position:absolute;inset:0;width:100%;height:100%}}
 .tags{{position:absolute;inset:0;display:grid;grid-template:repeat(3,1fr)/repeat(4,1fr);pointer-events:none}}
 .tags div{{padding:7px 8px;font-size:10.5px;line-height:1.3;color:var(--dim);
  text-shadow:0 1px 5px #000,0 0 12px #000;border-right:1px solid rgba(255,255,255,.045);
  border-bottom:1px solid rgba(255,255,255,.045)}}
 .tags div b{{display:block;color:var(--ink);font-size:11.5px;font-weight:600}}
 h2{{font-size:13px;letter-spacing:.1em;color:var(--dim);margin:26px 0 10px;text-transform:uppercase}}
 .pal{{display:flex;flex-wrap:wrap;gap:9px}}
 .pal div{{display:flex;align-items:center;gap:7px;font-size:12.5px;color:#cbc3d4;
  border:1px solid var(--line);border-radius:999px;padding:5px 11px 5px 6px}}
 .pal i{{width:17px;height:17px;border-radius:50%;display:block;border:1px solid rgba(255,255,255,.18)}}
 table{{width:100%;border-collapse:collapse;font-size:13.5px}}
 th,td{{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}}
 th{{font-size:11.5px;letter-spacing:.06em;color:var(--dim);font-weight:600}}
 td:first-child{{color:var(--ink);font-weight:600;white-space:nowrap;width:1%}}
 td:nth-child(2){{color:var(--c);font-variant-numeric:tabular-nums;white-space:nowrap;width:1%}}
 td:last-child{{color:#c3bbcf}}
 ul.todo{{margin:0;padding-left:19px;color:#c3bbcf;font-size:13.5px}}
 ul.todo li{{margin-bottom:4px}}
 .foot{{margin-top:26px;font-size:12.5px;color:var(--dim);border-top:1px solid var(--line);padding-top:13px}}
</style></head><body>
<div class="wrap">
 <div class="hd">
  <p class="eyebrow">SPOOKMATE · 이미지보드</p>
  <h1>{name}<em>{emo}</em></h1>
  <p class="meta"><b>{origin}</b> · {tag}</p>
 </div>
 <div class="stage"><canvas id="cv"></canvas><div class="tags">{tags}</div></div>
 <h2>색</h2><div class="pal">{pal}</div>
 <h2>부여한 움직임</h2>
 <table><thead><tr><th>부위</th><th>주기</th><th>움직임</th></tr></thead><tbody>{mot}</tbody></table>
 <h2>아직 손봐야 할 것</h2><ul class="todo">{todo}</ul>
 <p class="foot">그림을 따로 그린 게 아니라 게임에 들어갈 실제 모델을 열두 각도에서 찍은 것입니다. 여기서 고치라고 하신 건 모델에 그대로 반영됩니다.</p>
</div>
<script>
const FS=`{fs}`;
const VS=`#version 300 es
in vec2 a; void main(){{gl_Position=vec4(a,0.,1.);}}`;
const VIEWS={views};
const cv=document.getElementById('cv'), gl=cv.getContext('webgl2',{{antialias:false}});
const fail=m=>document.querySelector('.stage').insertAdjacentHTML('beforeend',
 '<p style="position:absolute;inset:0;display:grid;place-items:center;padding:24px;text-align:center;'+
 'color:#f6efe2;background:rgba(12,8,16,.9)">'+m+'</p>');
if(!gl) fail('이 브라우저는 WebGL2를 지원하지 않습니다.');
else{{
 const mk=(ty,s)=>{{const o=gl.createShader(ty);gl.shaderSource(o,s);gl.compileShader(o);
  if(!gl.getShaderParameter(o,gl.COMPILE_STATUS)){{console.error(gl.getShaderInfoLog(o));return null}}return o}};
 const vs=mk(gl.VERTEX_SHADER,VS), fs=mk(gl.FRAGMENT_SHADER,FS);
 if(!vs||!fs) fail('이 기기의 그래픽 드라이버가 모델을 그리지 못했습니다.<br>다른 브라우저에서 열어 주세요.');
 else{{
  const pr=gl.createProgram();gl.attachShader(pr,vs);gl.attachShader(pr,fs);
  gl.bindAttribLocation(pr,0,'a');gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){{console.error(gl.getProgramInfoLog(pr));
   fail('이 기기의 그래픽 드라이버가 모델을 그리지 못했습니다.<br>다른 브라우저에서 열어 주세요.');}}
  else{{
   gl.useProgram(pr);
   const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);
   gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
   gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
   gl.enable(gl.SCISSOR_TEST);
   const U=n=>gl.getUniformLocation(pr,n);
   const uR=U('iR'),uT=U('iT'),uE=U('iE'),uC=U('iCell'),uCam=U('iCam'),uTg=U('iTgt'),uF=U('iFov'),uP=U('iPose');
   const t0=performance.now();
   function fit(){{const d=window.__dpr||Math.min(1.5,devicePixelRatio||1);
    const w=Math.round(cv.clientWidth*d),h=Math.round(cv.clientHeight*d);
    if(cv.width!==w||cv.height!==h){{cv.width=w;cv.height=h}}}}
   function frame(){{ fit();
    const tt=(performance.now()-t0)/1000,W=cv.width,H=cv.height,
          cw=Math.ceil(W/4),chh=Math.ceil(H/3);
    gl.viewport(0,0,W,H);gl.scissor(0,0,W,H);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    VIEWS.forEach((v,i)=>{{
     const x=(i%4)*cw, y=(2-Math.floor(i/4))*chh;
     gl.viewport(x,y,cw,chh);gl.scissor(x,y,cw,chh);
     gl.uniform2f(uR,W,H);gl.uniform1f(uT,tt);gl.uniform1f(uE,v.e);
     gl.uniform4f(uC,x,y,cw,chh);
     gl.uniform3f(uCam,v.y,v.p,v.d);gl.uniform3f(uTg,v.g[0],v.g[1],v.g[2]);
     gl.uniform1f(uF,2.30);gl.uniform1i(uP,v.o);
     gl.drawArrays(gl.TRIANGLES,0,3);}});
    requestAnimationFrame(frame);}}
   addEventListener('resize',fit);frame();
  }}}}}}
</script></body></html>
"""

esc=lambda s:s.replace('\\','\\\\').replace('`','\\`').replace('${','$\\{')
for ch in CAST:
    vs=views_for(ch)
    tags=''.join('<div><b>%s</b>%s</div>'%(v['t'], ('감정 %d%%'%round(v['e']*100)) if v['e'] or '표정' in v['t'] else '')
                 for v in vs)
    pal=''.join('<div><i style="background:%s"></i>%s</div>'%(hx,nm) for nm,hx in ch['pal'])
    mot=''.join('<tr><td>%s</td><td>%s</td><td>%s</td></tr>'%m for m in ch['mot'])
    todo=''.join('<li>%s</li>'%t for t in ch['todo'])
    html=TPL.format(name=ch['name'],emo=ch['emo'],c=ch['c'],origin=ch['origin'],tag=ch['tag'],
                    tags=tags,pal=pal,mot=mot,todo=todo,
                    fs=esc(build_fs(ch)),views=json.dumps(vs,ensure_ascii=False))
    (OUT/(ch['k']+'.html')).write_text(html,encoding='utf-8')
    print('  %-8s %6d bytes · 셰이더 %5d자'%(ch['k'],len(html),len(build_fs(ch))))
