const { chromium } = require('playwright');
/* 이미지보드 8장을 정지 PNG로 뽑는다. 요괴 수정 후 다시 돌리면 된다.
   헤드리스는 소프트웨어 렌더라 한 장에 25초쯤 걸린다. */
const K=[['oiwa','오이와_우울'],['yacha','야차_분노'],['urong','우렁각시_수치'],
         ['eodook','어둑시니_공포'],['kudan','쿠단_불안'],['nuppe','눗페포_권태'],
         ['kappa','카파_기쁨'],['aka','아카나메_혐오']];
const OUT='/home/claude/spookmate_game/preview/sheet/png/';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport:{width:1200,height:1000},deviceScaleFactor:1});
  for(const [k,label] of K){
    const p=await ctx.newPage();
    await p.addInitScript(()=>{window.__dpr=0.95;});
    await p.route(/^https?:\/\//,r=>r.abort());
    await p.goto('file:///home/claude/spookmate_game/preview/sheet/'+k+'.html');
    await p.waitForTimeout(24000);           // 레이마칭이 소프트웨어로 돌아 느리다
    // 애니메이션을 멈춰야 전체 페이지 캡처가 끝난다 (매 프레임 다시 그리면 타임아웃)
    await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; });
    await p.waitForTimeout(2500);
    await p.screenshot({path:OUT+label+'.png', fullPage:true, timeout:120000});
    const s=require('fs').statSync(OUT+label+'.png');
    console.log(label.padEnd(18), Math.round(s.size/1024)+' KB');
    await p.close();
  }
  await b.close();
})();
