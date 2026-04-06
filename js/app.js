// ══════════════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════════════

const shuffle = a => {
  const b=[...a];
  for(let i=b.length-1;i>0;i--){const j=0|Math.random()*(i+1);[b[i],b[j]]=[b[j],b[i]];}
  return b;
};

function getCands(g,r,c){
  const u=new Set();
  for(let i=0;i<6;i++){if(g[r][i])u.add(g[r][i]);if(g[i][c])u.add(g[i][c]);}
  const br=Math.floor(r/2)*2,bc=Math.floor(c/3)*3;
  for(let dr=0;dr<2;dr++)for(let dc=0;dc<3;dc++)if(g[br+dr][bc+dc])u.add(g[br+dr][bc+dc]);
  return[1,2,3,4,5,6].filter(n=>!u.has(n));
}

function isValid(g,r,c,v){
  for(let i=0;i<6;i++){if(g[r][i]===v||g[i][c]===v)return false;}
  const br=Math.floor(r/2)*2,bc=Math.floor(c/3)*3;
  for(let dr=0;dr<2;dr++)for(let dc=0;dc<3;dc++)if(g[br+dr][bc+dc]===v)return false;
  return true;
}

const isSolved=g=>{for(let r=0;r<6;r++)for(let c=0;c<6;c++)if(!g[r][c])return false;return true;};
const copy=g=>g.map(r=>[...r]);

// ══════════════════════════════════════════════
//  SOLUTION + PUZZLE GENERATOR
// ══════════════════════════════════════════════

function fillGrid(g){
  for(let r=0;r<6;r++)for(let c=0;c<6;c++){
    if(g[r][c])continue;
    for(const n of shuffle([1,2,3,4,5,6])){
      if(isValid(g,r,c,n)){g[r][c]=n;if(fillGrid(g))return true;g[r][c]=0;}
    }
    return false;
  }
  return true;
}

function countSols(g,lim){
  let n=0;
  (function bt(){
    if(n>=lim)return;
    for(let r=0;r<6;r++)for(let c=0;c<6;c++){
      if(g[r][c])continue;
      for(let v=1;v<=6;v++){if(isValid(g,r,c,v)){g[r][c]=v;bt();g[r][c]=0;}}
      return;
    }
    n++;
  })();
  return n;
}

const CLUES={easy:24,medium:18,hard:13};

function generatePuzzle(mode){
  const sol=Array.from({length:6},()=>Array(6).fill(0));
  fillGrid(sol);
  const puz=copy(sol);
  const pos=shuffle(Array.from({length:36},(_,i)=>[i/6|0,i%6]));
  const target=mode==='max'?0:36-CLUES[mode];
  let removed=0;
  for(const[r,c]of pos){
    if(mode!=='max'&&removed>=target)break;
    const bk=puz[r][c];puz[r][c]=0;
    if(countSols(copy(puz),2)!==1)puz[r][c]=bk;else removed++;
  }
  return{solution:sol,puzzle:puz};
}

// ══════════════════════════════════════════════
//  LOGIC SOLVER (for metrics)
// ══════════════════════════════════════════════

// Applies one round of naked + hidden singles. Returns true if any change was made.
function logicStep(g){
  let ch=false;
  for(let r=0;r<6;r++)for(let c=0;c<6;c++){
    if(g[r][c])continue;
    const ca=getCands(g,r,c);
    if(ca.length===1){g[r][c]=ca[0];ch=true;}
  }
  for(let n=1;n<=6;n++){
    for(let r=0;r<6;r++){
      const cl=[];for(let c=0;c<6;c++)if(!g[r][c]&&getCands(g,r,c).includes(n))cl.push([r,c]);
      if(cl.length===1){g[cl[0][0]][cl[0][1]]=n;ch=true;}
    }
    for(let c=0;c<6;c++){
      const cl=[];for(let r=0;r<6;r++)if(!g[r][c]&&getCands(g,r,c).includes(n))cl.push([r,c]);
      if(cl.length===1){g[cl[0][0]][cl[0][1]]=n;ch=true;}
    }
    for(let br=0;br<6;br+=2)for(let bc=0;bc<6;bc+=3){
      const cl=[];
      for(let dr=0;dr<2;dr++)for(let dc=0;dc<3;dc++){
        const r=br+dr,c=bc+dc;
        if(!g[r][c]&&getCands(g,r,c).includes(n))cl.push([r,c]);
      }
      if(cl.length===1){g[cl[0][0]][cl[0][1]]=n;ch=true;}
    }
  }
  return ch;
}

function solveDepth(g,depth){
  if(depth>4)return{ok:false,depth};
  while(logicStep(g)){}
  if(isSolved(g))return{ok:true,depth};
  let minC=7,br=-1,bc=-1,bca=[];
  for(let r=0;r<6;r++)for(let c=0;c<6;c++){
    if(g[r][c])continue;
    const ca=getCands(g,r,c);
    if(ca.length===0)return{ok:false,depth};
    if(ca.length<minC){minC=ca.length;br=r;bc=c;bca=ca;}
  }
  if(br===-1)return{ok:false,depth};
  for(const n of bca){
    const t=copy(g);t[br][bc]=n;
    const res=solveDepth(t,depth+1);
    if(res.ok)return res;
  }
  return{ok:false,depth};
}

// ══════════════════════════════════════════════
//  METRICS CALCULATION
// ══════════════════════════════════════════════

function calcMetrics(puz){
  // P — given clues
  let P=0;for(let r=0;r<6;r++)for(let c=0;c<6;c++)if(puz[r][c])P++;

  // S — cells solvable by naked/hidden single (no duplicates)
  const solv=new Set();
  for(let r=0;r<6;r++)for(let c=0;c<6;c++){
    if(puz[r][c])continue;
    if(getCands(puz,r,c).length===1)solv.add(`${r},${c}`);
  }
  for(let n=1;n<=6;n++){
    for(let r=0;r<6;r++){
      const cl=[];for(let c=0;c<6;c++)if(!puz[r][c]&&getCands(puz,r,c).includes(n))cl.push(`${r},${c}`);
      if(cl.length===1)solv.add(cl[0]);
    }
    for(let c=0;c<6;c++){
      const cl=[];for(let r=0;r<6;r++)if(!puz[r][c]&&getCands(puz,r,c).includes(n))cl.push(`${r},${c}`);
      if(cl.length===1)solv.add(cl[0]);
    }
    for(let br=0;br<6;br+=2)for(let bc=0;bc<6;bc+=3){
      const cl=[];
      for(let dr=0;dr<2;dr++)for(let dc=0;dc<3;dc++){
        const r=br+dr,c=bc+dc;
        if(!puz[r][c]&&getCands(puz,r,c).includes(n))cl.push(`${r},${c}`);
      }
      if(cl.length===1)solv.add(cl[0]);
    }
  }
  const S=solv.size;

  // C, M — average and minimum candidates
  let tot=0,minC=6,emp=0;
  for(let r=0;r<6;r++)for(let c=0;c<6;c++){
    if(puz[r][c])continue;
    const ca=getCands(puz,r,c);
    tot+=ca.length;emp++;if(ca.length<minC)minC=ca.length;
  }
  const C=emp?Math.round(tot/emp*10)/10:0;
  const M=emp?minC:0;

  // D — branching depth
  const D=solveDepth(copy(puz),0).depth;

  return{P,S,D,C,M};
}

// ══════════════════════════════════════════════
//  SCORING FORMULA
// ══════════════════════════════════════════════
//
//  Component   Weight  Max contrib
//  ─────────── ──────  ───────────
//  P (clues)    0.8      160
//  S (singles)  1.2      240
//  D (depth)    1.5      300
//  C (avg cand) 0.8      160
//  M (min cand) 0.7      140
//               Total:  1000
//
// ══════════════════════════════════════════════

const MAX_CONTRIB={P:160,S:240,D:300,C:160,M:140};

function calcContribs(m){
  const cP=Math.min(1,Math.max(0,(28-m.P)/18))*200;
  const cS=Math.min(1,Math.max(0,Math.exp(-m.S*.2)))*200;
  const cD=Math.min(1,Math.max(0,m.D/4))*200;
  const cC=Math.min(1,Math.max(0,(m.C-1)/4))*200;
  const cM=Math.min(1,Math.max(0,(m.M-1)/4))*200;
  return{
    P:Math.round(cP*.8),
    S:Math.round(cS*1.2),
    D:Math.round(cD*1.5),
    C:Math.round(cC*.8),
    M:Math.round(cM*.7)
  };
}

function calcScore(m){
  const c=calcContribs(m);
  return Math.min(1000,Math.max(0,c.P+c.S+c.D+c.C+c.M));
}

const BANDS=[
  {max:150, label:'Principiante', color:'#27ae60'},
  {max:350, label:'Intermedio',   color:'#2471a3'},
  {max:550, label:'Avanzado',     color:'#7d3c98'},
  {max:750, label:'Experto',      color:'#d68910'},
  {max:1000,label:'Extremo',      color:'#c0392b'},
];
const getBand=s=>BANDS.find(b=>s<=b.max)||BANDS[BANDS.length-1];

// ══════════════════════════════════════════════
//  GAME STATE
// ══════════════════════════════════════════════

let curDiff='medium',SOLUTION,PUZZLE,state,selected,searching=false,stopRequested=false;

async function newGame(diff,maxAttempts=1,maxDiff=0){
  if(searching)return;
  curDiff=diff;selected=null;
  const mp=document.getElementById('mp');

  if(diff==='max'){
    searching=true;stopRequested=false;
    document.getElementById('btn-stop').style.display='inline-block';
    mp.classList.add('visible');
    showMsg('Buscando puzzle óptimo…','ok');
    setStatus('Iniciando búsqueda<span class="blink">…</span>');
    resetBars();

    let best=null,bestScore=-1,bestWithin=null,bestWithinScore=-1,attReached=0;
    for(let att=1;att<=maxAttempts;att++){
      attReached=att;
      const gen=generatePuzzle('max');
      const metrics=calcMetrics(gen.puzzle);
      const score=calcScore(metrics);
      const isBest=score>bestScore;
      if(isBest){
        bestScore=score;best={...gen,metrics,score};
      }
      let isNewWithin=false;
      if(score<=maxDiff&&score>bestWithinScore){
        bestWithinScore=score;bestWithin={...gen,metrics,score};
        SOLUTION=bestWithin.solution;PUZZLE=bestWithin.puzzle;
        state=PUZZLE.map(r=>[...r]);
        renderGrid();updateCodeInput();
        isNewWithin=true;
      }
      const displayPuzzle=bestWithin||best;
      updateMP(displayPuzzle.metrics,displayPuzzle.score,att,maxAttempts,bestWithin?isNewWithin:isBest);
      const dispBand=getBand(displayPuzzle.score);
      document.getElementById('diff-label').textContent=`Máxima — ${dispBand.label} · ${displayPuzzle.score}`;
      if(att<maxAttempts)setStatus(`Intento ${att} / ${maxAttempts}<span class="blink">…</span>`);
      await new Promise(r=>setTimeout(r,8));
      if(stopRequested)break;
      if(bestWithinScore===maxDiff)break;
    }

    searching=false;stopRequested=false;
    document.getElementById('btn-stop').style.display='none';

    if(bestWithin){
      SOLUTION=bestWithin.solution;PUZZLE=bestWithin.puzzle;
      state=PUZZLE.map(r=>[...r]);
      renderGrid();updateCodeInput();
      updateMP(bestWithin.metrics,bestWithin.score,attReached,maxAttempts,true);
      const band=getBand(bestWithinScore);
      setStatus(`Mejor puzzle encontrado · ${attReached} intento${attReached!==1?'s':''}`);
      document.getElementById('diff-label').textContent=`Máxima — ${band.label} · ${bestWithinScore}`;
    }else{
      const gen=generatePuzzle('hard');
      SOLUTION=gen.solution;PUZZLE=gen.puzzle;
      state=PUZZLE.map(r=>[...r]);
      renderGrid();updateCodeInput();
      const metrics=calcMetrics(PUZZLE);
      const score=calcScore(metrics);
      const band=getBand(score);
      updateMP(metrics,score,1,1,true);
      setStatus(`Sin puzzle dentro del rango · generado nivel Difícil`);
      document.getElementById('diff-label').textContent=`Difícil — ${band.label} · ${score}`;
    }
    clearMsg();

  }else{
    mp.classList.add('visible');
    document.getElementById('inline-status').innerHTML='';
    document.getElementById('mp-status').innerHTML='';
    resetBars();
    showMsg('Generando…','ok');
    await new Promise(r=>setTimeout(r,30));
    const gen=generatePuzzle(diff);
    SOLUTION=gen.solution;PUZZLE=gen.puzzle;
    state=PUZZLE.map(r=>[...r]);
    renderGrid();
    updateCodeInput();
    const metrics=calcMetrics(PUZZLE);
    const score=calcScore(metrics);
    const band=getBand(score);
    updateMP(metrics,score,1,1,true);
    document.getElementById('diff-label').textContent=
      `${{easy:'Fácil',medium:'Medio',hard:'Difícil'}[diff]} — ${band.label} · ${score}`;
    clearMsg();
  }
}

// ══════════════════════════════════════════════
//  METRICS PANEL UPDATE
// ══════════════════════════════════════════════

function resetBars(){
  ['P','S','D','C','M'].forEach(k=>{
    document.getElementById('bar-'+k).style.width='0%';
    document.getElementById('val-'+k).textContent='—';
    document.getElementById('pts-'+k).textContent='—';
  });
  document.getElementById('mp-score').textContent='—';
  document.getElementById('mp-badge').textContent='—';
}

function updateMP(m,score,att,max,isBest){
  const c=calcContribs(m);
  const band=getBand(score);

  // Numeric score + badge
  document.getElementById('mp-score').textContent=score;
  const badge=document.getElementById('mp-badge');
  badge.textContent=band.label;
  badge.style.background=band.color+'1a';
  badge.style.color=band.color;
  badge.style.borderColor=band.color+'66';

  // Metric rows
  const rows=[
    {k:'P',val:`${m.P} dadas`,pts:c.P},
    {k:'S',val:`${m.S} cel.`, pts:c.S},
    {k:'D',val:`${m.D} niv.`, pts:c.D},
    {k:'C',val:String(m.C),   pts:c.C},
    {k:'M',val:`mín. ${m.M}`, pts:c.M},
  ];
  for(const{k,val,pts}of rows){
    const pct=(c[k]/MAX_CONTRIB[k]*100).toFixed(1);
    const bar=document.getElementById('bar-'+k);
    bar.style.width=pct+'%';
    document.getElementById('val-'+k).textContent=val;
    document.getElementById('pts-'+k).textContent='+'+pts+'pts';
    if(isBest){bar.classList.remove('bar-pulse');void bar.offsetWidth;bar.classList.add('bar-pulse');}
  }
}

function setStatus(html){
  document.getElementById('mp-status').innerHTML=html;
  document.getElementById('inline-status').innerHTML=html;
}

// ══════════════════════════════════════════════
//  BOARD
// ══════════════════════════════════════════════

const gridEl=document.getElementById('grid');

function renderGrid(){
  gridEl.innerHTML='';
  gridEl.classList.remove('grid-refresh');void gridEl.offsetWidth;gridEl.classList.add('grid-refresh');
  for(let r=0;r<6;r++)for(let c=0;c<6;c++){
    const given=PUZZLE[r][c]!==0;
    const cell=document.createElement('div');
    cell.className='cell'+(given?' given':'');
    cell.dataset.row=r;cell.dataset.col=c;
    const inp=document.createElement('input');
    inp.type='text';inp.inputMode='numeric';inp.maxLength=1;
    inp.readOnly=given;
    inp.value=given?PUZZLE[r][c]:'';
    cell.appendChild(inp);
	if(!given){
		cell.addEventListener('click',()=>{selected={row:r,col:c};highlight();inp.focus();});
		inp.addEventListener('input',()=>{
			const ch=inp.value.replace(/[^1-6]/g,'').slice(-1);
			inp.value='';
			if(ch)enter(parseInt(ch)); else enter(0);
		});
	}
    gridEl.appendChild(cell);
  }
}

const getCell=(r,c)=>gridEl.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);

function highlight(){
  gridEl.querySelectorAll('.cell').forEach(el=>el.classList.remove('active','hilite'));
  if(!selected)return;
  const{row,col}=selected;
  gridEl.querySelectorAll('.cell').forEach(el=>{
    const r=+el.dataset.row,c=+el.dataset.col;
    if(r===row&&c===col)el.classList.add('active');
    else if(r===row||c===col)el.classList.add('hilite');
  });
}

// ══════════════════════════════════════════════
//  INPUT
// ══════════════════════════════════════════════

function enter(v){
  if(!selected||!SOLUTION)return;
  const{row,col}=selected;
  if(PUZZLE[row][col])return;
  state[row][col]=v;
  const cell=getCell(row,col);
  cell.querySelector('input').value=v||'';
  cell.classList.remove('error','correct');
  clearMsg();
  cell.classList.remove('pop');void cell.offsetWidth;cell.classList.add('pop');
  // Auto-check when every empty cell has been filled
  const allFilled=state.every((row,r)=>row.every((v,c)=>PUZZLE[r][c]||v));
  if(allFilled) check();
}

document.addEventListener('keydown',e=>{
  if(document.activeElement.id==='code-input')return;
  if(!selected)return;
  const n=parseInt(e.key);
  if(n>=1&&n<=6){enter(n);return;}
  if(['Backspace','Delete','0'].includes(e.key)){enter(0);return;}
  const dirs={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};
  if(dirs[e.key]){
    const[dr,dc]=dirs[e.key];
    const nr=selected.row+dr,nc=selected.col+dc;
    if(nr>=0&&nr<6&&nc>=0&&nc<6){selected={row:nr,col:nc};highlight();}
  }
});

// ══════════════════════════════════════════════
//  CHECK / HINT
// ══════════════════════════════════════════════

function check(){
  if(!SOLUTION)return;
  let err=false,done=true;
  for(let r=0;r<6;r++)for(let c=0;c<6;c++){
    if(PUZZLE[r][c])continue;
    const cell=getCell(r,c);const v=state[r][c];
    cell.classList.remove('error','correct');
    if(!v){done=false;continue;}
    if(v!==SOLUTION[r][c]){cell.classList.add('error');err=true;}
    else cell.classList.add('correct');
  }
  if(err)showMsg('Hay errores. ¡Sigue intentando!','error');
  else if(!done)showMsg('Sin errores hasta ahora. ¡Continúa!','ok');
  else{showMsg('¡Felicidades! Puzzle completado 🎉','ok');confetti();}
}

function hint(){
  if(!SOLUTION)return;
  const emp=[];
  for(let r=0;r<6;r++)for(let c=0;c<6;c++)if(!PUZZLE[r][c]&&!state[r][c])emp.push({r,c});
  if(!emp.length){showMsg('El tablero ya está completo.','ok');return;}
  const{r,c}=emp[0|Math.random()*emp.length];
  selected={row:r,col:c};enter(SOLUTION[r][c]);highlight();
  showMsg('Pista revelada ✦','ok');
}

// ══════════════════════════════════════════════
//  MODAL
// ══════════════════════════════════════════════

const modalEl=document.getElementById('modal');
const maxExpand=document.getElementById('max-expand');

function openModal(){
  modalEl.querySelectorAll('.lvl-btn').forEach(b=>b.classList.toggle('active',b.dataset.level===curDiff));
  maxExpand.classList.toggle('open',curDiff==='max');
  modalEl.classList.add('visible');
}
function closeModal(){modalEl.classList.remove('visible');}

document.getElementById('btn-max-level').addEventListener('click',()=>{
  modalEl.querySelectorAll('.lvl-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('btn-max-level').classList.add('active');
  maxExpand.classList.add('open');
});

modalEl.querySelectorAll('.lvl-btn:not(#btn-max-level)').forEach(b=>{
  b.addEventListener('click',()=>{
    maxExpand.classList.remove('open');
    closeModal();newGame(b.dataset.level);
  });
});

const intInput=document.getElementById('int-input');
const maxdiffInput=document.getElementById('maxdiff-input');

function clampInput(el,min,max){
  el.addEventListener('blur',()=>{
    const v=parseInt(el.value);
    el.value=isNaN(v)?min:Math.max(min,Math.min(max,v));
  });
}
clampInput(intInput,1,6000);
clampInput(maxdiffInput,300,1000);

document.getElementById('btn-gen-max').addEventListener('click',()=>{
  const attempts=Math.max(1,Math.min(6000,parseInt(intInput.value)||1));
  const maxDiff=Math.max(300,Math.min(1000,parseInt(maxdiffInput.value)||300));
  closeModal();newGame('max',attempts,maxDiff);
});

document.getElementById('btn-stop').addEventListener('click',()=>{stopRequested=true;});
document.getElementById('modal-cancel').addEventListener('click',closeModal);
modalEl.addEventListener('click',e=>{if(e.target===modalEl)closeModal();});

document.getElementById('btn-reset').addEventListener('click',openModal);
document.getElementById('btn-check').addEventListener('click',check);
document.getElementById('btn-hint').addEventListener('click',hint);

// ══════════════════════════════════════════════
//  MESSAGES
// ══════════════════════════════════════════════

function showMsg(t,type){
  const el=document.getElementById('message');
  el.textContent=t;el.className=type==='error'?'msg-error':'msg-ok';
}
function clearMsg(){const el=document.getElementById('message');el.textContent='';el.className='';}

// ══════════════════════════════════════════════
//  CONFETTI
// ══════════════════════════════════════════════

function confetti(){
  const cv=document.getElementById('confetti');
  cv.style.display='block';const ctx=cv.getContext('2d');
  cv.width=innerWidth;cv.height=innerHeight;
  const pp=Array.from({length:130},()=>({
    x:Math.random()*cv.width,y:-20-Math.random()*200,r:4+Math.random()*6,
    d:1.2+Math.random()*2,
    col:['#8b5e2a','#3a5fa0','#27ae60','#c0392b','#f39c12','#7d3c98'][0|Math.random()*6],
    t:Math.random()*360,ts:(Math.random()-.5)*4
  }));
  let fr=0;
  (function draw(){
    ctx.clearRect(0,0,cv.width,cv.height);
    pp.forEach(p=>{
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.t*Math.PI/180);
      ctx.fillStyle=p.col;ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r*1.5);
      ctx.restore();p.y+=p.d;p.t+=p.ts;if(p.y>cv.height+20)p.y=-20;
    });
    if(++fr<420)requestAnimationFrame(draw);
    else{cv.style.display='none';ctx.clearRect(0,0,cv.width,cv.height);}
  })();
}

// ══════════════════════════════════════════════
//  ENCODE / DECODE  — 70-bit → base-85 (Z85), 11 chars
//  Payload 1 (36 bits): vacancy mask, 1=clue, 0=empty, row-major
//  Payload 2 (~34 bits): dynamic-base accumulator over clue cells
//  Assembly: bigNum = (acc << 36n) | vacancyMask  → 11 chars Z85
// ══════════════════════════════════════════════

const Z85='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#';

function encodePuzzle(puz){
  // Payload 1: vacancy mask (row-major, bit i = r*6+c)
  let mask=0n;
  for(let r=0;r<6;r++)for(let c=0;c<6;c++)if(puz[r][c])mask|=(1n<<BigInt(r*6+c));

  // Payload 2: dynamic-base factoradic over clue cells
  const rows=[0,0,0,0,0,0],cols=[0,0,0,0,0,0],blks=[0,0,0,0,0,0];
  let acc=0n,mult=1n;
  for(let r=0;r<6;r++)for(let c=0;c<6;c++){
    const v=puz[r][c];if(!v)continue;
    const b=Math.floor(r/2)*2+Math.floor(c/3);
    const uni=[];
    for(let x=1;x<=6;x++)if(!(rows[r]&(1<<x))&&!(cols[c]&(1<<x))&&!(blks[b]&(1<<x)))uni.push(x);
    acc+=BigInt(uni.indexOf(v))*mult;
    mult*=BigInt(uni.length);
    rows[r]|=(1<<v);cols[c]|=(1<<v);blks[b]|=(1<<v);
  }

  // Assemble and encode as 11-char Z85
  const big=(acc<<36n)|mask;
  let s='';
  let n=big;
  for(let i=0;i<11;i++){s=Z85[Number(n%85n)]+s;n/=85n;}
  return s;
}

function decodePuzzle(code){
  if(!code||code.length!==11)return null;
  let n=0n;
  for(const ch of code){const i=Z85.indexOf(ch);if(i<0)return null;n=n*85n+BigInt(i);}

  const mask=n&0xFFFFFFFFFn;  // bottom 36 bits
  let acc=n>>36n;

  const rows=[0,0,0,0,0,0],cols=[0,0,0,0,0,0],blks=[0,0,0,0,0,0];
  const puz=Array.from({length:6},()=>Array(6).fill(0));
  for(let r=0;r<6;r++)for(let c=0;c<6;c++){
    if(!(mask&(1n<<BigInt(r*6+c))))continue;
    const b=Math.floor(r/2)*2+Math.floor(c/3);
    const uni=[];
    for(let x=1;x<=6;x++)if(!(rows[r]&(1<<x))&&!(cols[c]&(1<<x))&&!(blks[b]&(1<<x)))uni.push(x);
    const U=BigInt(uni.length);
    const v=uni[Number(acc%U)];
    acc/=U;
    puz[r][c]=v;
    rows[r]|=(1<<v);cols[c]|=(1<<v);blks[b]|=(1<<v);
  }
  return puz;
}

function isValidPuzzleGrid(puz){
  for(let r=0;r<6;r++)for(let c=0;c<6;c++){
    const v=puz[r][c];
    if(v<0||v>6)return false;
    if(!v)continue;
    for(let i=0;i<6;i++){if(i!==c&&puz[r][i]===v)return false;}
    for(let i=0;i<6;i++){if(i!==r&&puz[i][c]===v)return false;}
    const br=Math.floor(r/2)*2,bc=Math.floor(c/3)*3;
    for(let dr=0;dr<2;dr++)for(let dc=0;dc<3;dc++){
      const rr=br+dr,cc=bc+dc;
      if(rr===r&&cc===c)continue;
      if(puz[rr][cc]===v)return false;
    }
  }
  return true;
}

function solvePuzzle(puz){
  const g=copy(puz);
  function bt(){
    for(let r=0;r<6;r++)for(let c=0;c<6;c++){
      if(g[r][c])continue;
      for(const v of [1,2,3,4,5,6]){
        if(isValid(g,r,c,v)){g[r][c]=v;if(bt())return true;g[r][c]=0;}
      }
      return false;
    }
    return true;
  }
  return bt()?g:null;
}

function updateCodeInput(){
  if(!PUZZLE)return;
  const inp=document.getElementById('code-input');
  inp.value=encodePuzzle(PUZZLE);
  inp.classList.remove('invalid');
}

document.getElementById('btn-update').addEventListener('click',()=>{
  if(!state){showMsg('No hay puzzle activo','error');return;}
  if(!isValidPuzzleGrid(state)){showMsg('El estado actual tiene conflictos','error');return;}
  const inp=document.getElementById('code-input');
  inp.value=encodePuzzle(state);
  inp.classList.remove('invalid');
  const btn=document.getElementById('btn-update');
  const prev=btn.textContent;
  btn.textContent='✓';btn.classList.add('copied');
  setTimeout(()=>{btn.textContent=prev;btn.classList.remove('copied');},1400);
});

document.getElementById('btn-copy').addEventListener('click',()=>{
  const inp=document.getElementById('code-input');
  if(!inp.value||inp.value==='—')return;
  navigator.clipboard.writeText(inp.value).catch(()=>{
    // fallback for environments without clipboard API
    inp.select();document.execCommand('copy');
  });
  const btn=document.getElementById('btn-copy');
  const prev=btn.textContent;
  btn.textContent='✓';btn.classList.add('copied');
  setTimeout(()=>{btn.textContent=prev;btn.classList.remove('copied');},1400);
});

document.getElementById('btn-load').addEventListener('click',()=>{
  const inp=document.getElementById('code-input');
  const raw=inp.value.trim();
  // Decode
  const puz=decodePuzzle(raw);
  if(!puz){inp.classList.add('invalid');showMsg('Código inválido — 11 chars base-85','error');return;}
  // Validate structure
  if(!isValidPuzzleGrid(puz)){inp.classList.add('invalid');showMsg('El código tiene conflictos de sudoku','error');return;}
  // Solve & check uniqueness
  const sol=solvePuzzle(puz);
  if(!sol){inp.classList.add('invalid');showMsg('El puzzle no tiene solución','error');return;}
  if(countSols(copy(puz),2)!==1){inp.classList.add('invalid');showMsg('El puzzle tiene múltiples soluciones','error');return;}
  // Load
  PUZZLE=puz;SOLUTION=sol;state=PUZZLE.map(r=>[...r]);selected=null;
  curDiff='load';
  const metrics=calcMetrics(PUZZLE);
  const score=calcScore(metrics);
  const band=getBand(score);
  document.getElementById('mp').classList.add('visible');
  document.getElementById('mp-status').innerHTML='';
  document.getElementById('inline-status').innerHTML='';
  resetBars();
  updateMP(metrics,score,1,1,true);
  document.getElementById('diff-label').textContent=`Cargado — ${band.label} · ${score}`;
  inp.classList.remove('invalid');
  renderGrid();
  clearMsg();showMsg('Puzzle cargado desde código ✦','ok');
});

// ══════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════
newGame('medium');
