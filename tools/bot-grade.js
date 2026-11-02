const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({viewport:{width:390,height:844}})).newPage();
  await p.addInitScript(()=>{window.__bot=1;window.__dpr=0.25;});
  await p.route(/^https?:\/\//, r=>r.abort());
  await p.goto('file:///home/claude/spookmate_game/index.html');
  await p.waitForTimeout(400);
  await p.evaluate(()=>{ const S=__t.S;
    window.__BOT={ random:()=>Math.random()<.02?(Math.random()<.5?'W':'P'):null,
      lazy:()=>S.st==='warn'?(S.warnKind==='R'?'W':'P'):null,
      naive:()=>S.st==='warn'?(S.warnKind==='R'?'W':'P'):S.ask?(S.id==='oiwa'?'P':'W'):null,
      good:()=>S.st==='warn'?(S.warnKind==='R'?'W':'P'):S.ask?S.ask.w
             :(S.st==='strike'||(S.mood<45&&Math.random()<.03))?'P':null };
    window.__run=(id,s,n)=>{const o=[];for(let r=0;r<n;r++){__t.startDay(id);const bot=__BOT[s];let g=0;
      while(!S.over&&g++<20000){__t.step(1/60);if(S.over)break;const k=bot();if(k==='W')__t.doWarn();else if(k==='P')__t.doPraise();}
      o.push(S.dish);}return o;};
  });
  const G={oiwa:[20,13,7],yacha:[28,19,10]};
  const name=(d,g)=>d>=g[0]?'장인':d>=g[1]?'그럭저럭':d>=g[2]?'겨우밥값':'적자';
  console.log('조합            장인   그럭저럭  겨우밥값   적자');
  for(const id of ['oiwa','yacha']) for(const s of ['random','lazy','naive','good']){
    const d=await p.evaluate(([i,st,n])=>__run(i,st,n),[id,s,120]);
    const c={장인:0,그럭저럭:0,겨우밥값:0,적자:0}; d.forEach(x=>c[name(x,G[id])]++);
    const pc=k=>String(Math.round(c[k]/d.length*100)+'%').padStart(6);
    console.log((id+'/'+s).padEnd(15), pc('장인'), pc('그럭저럭'), pc('겨우밥값'), pc('적자'));
  }
  await b.close();
})();
