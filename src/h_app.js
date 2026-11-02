
/* ───────── 화면 전환 · 배선 · 메인 루프 ───────── */
let SEL='yacha';
/* 요괴마다 속도가 달라 같은 잣대를 못 쓴다. 기준은 봇 800판 분포에서 뽑았다. */
const GRADE=(d,id)=>{const g=SPEC[id].grade;
  return d>=g[0]?['설거지 장인','이 집은 네가 접수했다']
       : d>=g[1]?['그럭저럭','밥값은 했다']
       : d>=g[2]?['겨우 밥값','월세는 반만 깎아준다']
       : ['오늘은 적자','그릇이 더 늘었다'];};

function renderPick(){
  S.on=false;
  $('#play').hidden=true;$('#result').hidden=true;$('#pick').hidden=false;
  $('#previewSlot').appendChild($('#char'));
  $('#char').style.display='block';
  $('#tabs').innerHTML=ROSTER.map(k=>`<button class="tab${k===SEL?' on':''}" data-k="${k}" type="button">${Y[k].name}<small>${Y[k].emo}</small></button>`).join('');
  selectChar(SEL,true);
  $('#wallet').textContent=SAVE.wallet;
  layout(); scrollTo(0,0);
}
function selectChar(k,quiet){
  SEL=k;
  document.querySelectorAll('#tabs .tab').forEach(t=>t.classList.toggle('on',t.dataset.k===k));
  const y=Y[k];
  document.documentElement.style.setProperty('--yc',y.c);
  $('#spec').innerHTML=`<h3>${y.name} · ${y.tag}</h3><p>${y.note}</p><div class="meta">`+
    `<span>설거지 ${SPEC[k].wash<4?'빠름':'느림'}</span><span>빨간 전조 ${Math.round(SPEC[k].red*100)}%</span>`+
    `<span>${SAVE.best[k]?`최고 ${SAVE.best[k]}개`:'아직 안 시켜봤다'}</span></div>`;
  $('#btnGo').firstChild.textContent=`${y.name} 데려오기`;
  if(!quiet) Snd.wake();
}

function showResult(reason){
  const id=S.id,y=Y[id],L=LINE[id],d=S.dish,[gt,gs]=GRADE(d,id);
  const prev=SAVE.best[id]||0, best=d>prev;
  SAVE.best[id]=Math.max(prev,d); SAVE.wallet+=d; SAVE.days++; saveSave();
  $('#wallet').textContent=SAVE.wallet;
  $('#rKick').textContent=reason==='quit'?'조기 퇴근 · 오늘의 CCTV'
    :reason==='time'?`퇴근 시간 · 사고 ${3-S.lives}건`:`사고 ${3-S.lives}건 · 오늘의 CCTV`;
  $('#rTitle').textContent=`${y.name}, ${gt}`;
  $('#payDish').textContent=d;$('#payToken').textContent=d;$('#payTotal').textContent=SAVE.wallet;
  const cl=S.clips;
  $('#clips').innerHTML=`<div class="ct">사고 기록</div>`+(cl.length
    ? cl.map(k=>`<div class="clip" style="border-left-color:${k.kind==='R'?'var(--red)':'var(--blue)'}"><span class="tc">${k.tc}</span><span>${k.txt}</span></div>`).join('')
    : `<div class="clip" style="border-left-color:var(--green)"><span class="tc">—</span><span>사고 없음. 이런 날도 있다.</span></div>`);
  const q=pick(d>=14?L.good:d>=5?L.mid:L.bad);
  $('#rQuote').textContent=`“${q}”`;
  $('#rBest').textContent=best?`최고 기록 경신! (이전 ${prev}개)`:`${y.name} 최고 기록 ${SAVE.best[id]}개 · ${gs}`;
  const br=cl.filter(k=>k.kind==='R').length, fl=cl.length-br;
  $('#shareBox').textContent=`📹 스푸크메이트 · 주방 CCTV\n동거 요괴: ${y.name} (${y.emo})\n닦은 그릇 ${d}개 · 품삯 ${d}토큰\n사고: ${br?`그릇 파손 ×${br}`:''}${br&&fl?', ':''}${fl?`싱크대 범람 ×${fl}`:''}${cl.length?'':'없음'}\n“${q}”`;
  $('#play').hidden=true;$('#result').hidden=false;
  $('#char').style.display='none';
  scrollTo(0,0);
}

let toastT=0;
function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{t.hidden=true;},2000);}
async function copyShare(){const txt=$('#shareBox').textContent;
  try{await navigator.clipboard.writeText(txt);toast('복사했어요');}
  catch(e){const r=document.createRange();r.selectNodeContents($('#shareBox'));const s=getSelection();s.removeAllRanges();s.addRange(r);toast('선택해 뒀어요. 길게 눌러 복사하세요');}}

/* 메인 루프 — 요괴(WebGL)와 부엌(2D)을 같은 프레임에 그린다 */
let last=0, pt=0;
function frame(ms){
  requestAnimationFrame(frame);
  const dt=Math.min(.05,(ms-last)/1000||0); last=ms; pt+=dt;
  const playing=!$('#play').hidden && !window.__bot;
  if(playing){
    GL.tune(dt);
    /* 순간 정지 — 맞는 순간 멈췄다 풀려야 타격이 무겁게 느껴진다 */
    if(S.freeze>0) S.freeze-=dt; else step(dt);
    GL.render(S.t, Y[S.id].i, glPose(), S.amt, S.mood/100, S.x);
    drawFG($('#fg').getContext('2d'));
    const w=$('#btnWarn'),p=$('#btnPraise');
    w.classList.toggle('cool',S.cdW>0);p.classList.toggle('cool',S.cdP>0);
    $('#cdWarn').style.width=(S.cdW/.8*100)+'%';
    $('#cdPraise').style.width=(S.cdP/.8*100)+'%';
  } else if(!$('#pick').hidden){
    GL.render(pt, Y[SEL].i, 0, 0, .8);
  }
  /* 터져 나온 것들은 게임이 멈춰 있어도 끝까지 날아간다 */
  if(BURST.c && (BURST.p.length||BURST.veil)) BURST.step(dt);
}

/* 배선 */
function fatal(msg,sub){
  document.body.insertAdjacentHTML('beforeend',
    '<div style="position:fixed;inset:0;z-index:999;display:grid;place-items:center;padding:24px;'+
    'background:rgba(12,8,16,.94);backdrop-filter:blur(3px);text-align:center">'+
    '<div style="max-width:320px"><div style="font-size:40px;margin-bottom:12px">🕯️</div>'+
    '<p style="font:700 17px/1.5 sans-serif;color:#fff6e2;margin:0 0 10px">'+msg+'</p>'+
    '<p style="font:400 14px/1.6 sans-serif;color:#b6adc4;margin:0">'+sub+'</p></div></div>');
}
if(!GL.init()){
  fatal('이 브라우저에서는 요괴가 나타나지 않습니다.',
        '요괴를 그리려면 WebGL2가 필요한데, 이 브라우저에는 없습니다. 크롬이나 사파리 최신 버전에서 열어 주세요.');
} else {
  /* 모바일 GPU는 메모리가 부족하면 그리기 맥락을 통째로 회수한다.
     그대로 두면 요괴만 사라진 채 게임이 계속 돌아간다. */
  $('#char').addEventListener('webglcontextlost', e=>{ e.preventDefault(); GL.ok=false;
    fatal('그래픽이 끊겼습니다.','기기가 메모리를 회수했습니다. 새로고침하면 다시 시작됩니다.'); });
}
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('.tab');if(b)selectChar(b.dataset.k);});
$('#btnGo').addEventListener('click',()=>startDay(SEL));
$('#btnWarn').addEventListener('click',doWarn);
$('#btnPraise').addEventListener('click',doPraise);
$('#btnQuit').addEventListener('click',()=>endDay('quit'));
$('#btnAgain').addEventListener('click',()=>startDay(S.id));
$('#btnChange').addEventListener('click',renderPick);
$('#btnCopy').addEventListener('click',copyShare);
addEventListener('keydown',e=>{if($('#play').hidden)return;
  if(e.key==='ArrowLeft'||e.key==='1'){e.preventDefault();doWarn();}
  if(e.key==='ArrowRight'||e.key==='2'){e.preventDefault();doPraise();}});
addEventListener('resize',()=>{layout();BURST.fit();if(!$('#play').hidden)drawBG($('#bgc').getContext('2d'));});
BURST.init();
renderPick();
requestAnimationFrame(frame);
/* 밸런스 자동 측정용 고리 — 봇이 렌더링 없이 로직만 돌린다 */
window.__t={startDay,step,doWarn,doPraise,S,GL,Snd};
})();
