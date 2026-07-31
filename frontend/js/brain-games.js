var gameTimer=null, gameScore=0, gameSeconds=0, currentGame='';

function launchGame(name){
  currentGame=name;
  var lobby=document.getElementById('games-lobby');
  var vp=document.getElementById('game-viewport');
  if(lobby)lobby.style.display='none';
  if(vp)vp.style.display='block';
  gameScore=0; gameSeconds=0;
  var sc=document.getElementById('gv-score'); if(sc)sc.textContent='0';
  clearInterval(gameTimer);
  var titles={memory:'🃏 Memory Match',word:'🔤 Word Builder',pattern:'🧩 Pattern Puzzles',
    breathing:'🌬️ Calm Breathing',ninja:'🔢 Number Ninja',rhyme:'🎵 Rhythm & Rhyme'};
  var gt=document.getElementById('gv-title'); if(gt)gt.textContent=titles[name]||name;
  var area=document.getElementById('game-area');
  if(!area)return;
  area.innerHTML='';
  if(name==='memory')startMemory(area);
  else if(name==='word')startWord(area);
  else if(name==='pattern')startPattern(area);
  else if(name==='breathing')startBreathing(area);
  else if(name==='ninja')startNinja(area);
  else if(name==='rhyme')startRhyme(area);
}

function exitGame(){
  clearInterval(gameTimer);
  var lobby=document.getElementById('games-lobby');
  var vp=document.getElementById('game-viewport');
  if(lobby)lobby.style.display='block';
  if(vp)vp.style.display='none';
}

function addScore(pts){
  gameScore+=pts;
  var el=document.getElementById('gv-score');
  if(el)el.textContent=gameScore;
}

function startClock(duration, onEnd){
  gameSeconds=duration;
  var el=document.getElementById('gv-timer');
  if(el)el.textContent=fmtTime(gameSeconds);
  clearInterval(gameTimer);
  gameTimer=setInterval(function(){
    gameSeconds--;
    if(el)el.textContent=fmtTime(gameSeconds);
    if(gameSeconds<=0){clearInterval(gameTimer);if(onEnd)onEnd();}
  },1000);
}

function fmtTime(s){return Math.floor(s/60)+':'+(s%60<10?'0':'')+s%60;}

function showResult(area,msg,sub){
  var cg=currentGame;
  area.innerHTML='<div style="text-align:center;padding:2rem;">'+
    '<div style="font-size:64px;margin-bottom:1rem;">🎉</div>'+
    '<h2 style="font-family:var(--font-d);font-size:28px;color:var(--sun);margin-bottom:.5rem;">'+msg+'</h2>'+
    '<p style="color:var(--muted);font-size:15px;margin-bottom:1.5rem;">'+sub+'</p>'+
    '<div style="font-family:var(--font-d);font-size:36px;color:var(--plum);margin-bottom:1.5rem;">⭐ '+gameScore+' Stars!</div>'+
    '<button onclick="launchGame(\''+cg+'\')" style="background:var(--sun);border:none;border-radius:50px;color:#fff;font-family:var(--font);font-weight:800;font-size:16px;padding:14px 32px;cursor:pointer;margin-right:10px;">Play Again 🔄</button>'+
    '<button onclick="exitGame()" style="background:none;border:2.5px solid var(--border);border-radius:50px;font-family:var(--font);font-weight:800;font-size:16px;padding:14px 32px;cursor:pointer;">← Back</button>'+
    '</div>';
}

function startMemory(area){
  var emojis=['🐶','🐱','🦁','🐸','🦋','🌈','🍎','🚀'];
  var cards=[...emojis,...emojis].sort(function(){return Math.random()-.5;});
  var flipped=[],matched=0,locked=false;
  area.innerHTML='<p style="text-align:center;font-size:14px;color:var(--muted);margin-bottom:1rem;">Find all matching pairs! 🃏</p>'+
    '<div id="mem-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;max-width:400px;margin:0 auto;"></div>';
  var grid=document.getElementById('mem-grid');
  cards.forEach(function(emoji,i){
    var card=document.createElement('div');
    card.style.cssText='height:80px;background:var(--plum);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;cursor:pointer;transition:.3s;user-select:none;border:3px solid transparent;';
    card.dataset.emoji=emoji; card.dataset.revealed='0';
    card.textContent='❓';
    card.addEventListener('click',function(){
      if(locked||this.dataset.revealed==='1'||flipped.length===2)return;
      this.textContent=this.dataset.emoji;
      this.style.background='var(--plum-light)';this.style.borderColor='var(--plum)';
      this.dataset.revealed='1'; flipped.push(this);
      if(flipped.length===2){
        locked=true;
        if(flipped[0].dataset.emoji===flipped[1].dataset.emoji){
          flipped[0].style.background='var(--leaf-light)';flipped[0].style.borderColor='var(--leaf)';
          flipped[1].style.background='var(--leaf-light)';flipped[1].style.borderColor='var(--leaf)';
          flipped=[];locked=false;matched++;addScore(10);
          if(matched===emojis.length){clearInterval(gameTimer);showResult(area,'You matched them all!','Amazing memory! Keep practising every day.');}
        } else {
          setTimeout(function(){
            flipped.forEach(function(c){c.textContent='❓';c.style.background='var(--plum)';c.style.borderColor='transparent';c.dataset.revealed='0';});
            flipped=[];locked=false;
          },900);
        }
      }
    });
    grid.appendChild(card);
  });
  startClock(180,function(){showResult(area,"Time's up!",'You matched '+matched+' pairs. Try again!');});
}

function startWord(area){
  var words=[{word:'CAT',hint:'A furry pet',emoji:'🐱'},{word:'SUN',hint:'Shines in the sky',emoji:'☀️'},
    {word:'DOG',hint:'A loyal friend',emoji:'🐶'},{word:'BUS',hint:'You ride to school',emoji:'🚌'},
    {word:'MAP',hint:'Shows where to go',emoji:'🗺️'},{word:'CUP',hint:'You drink from this',emoji:'☕'},
    {word:'PEN',hint:'You write with this',emoji:'✏️'},{word:'BOX',hint:'You put things inside',emoji:'📦'}];
  var idx=0,correct=0;
  function showWord(){
    if(idx>=words.length){clearInterval(gameTimer);showResult(area,'Word Builder Complete!','You spelled '+correct+'/'+words.length+' correctly!');return;}
    var w=words[idx],sc=w.word.split('').sort(function(){return Math.random()-.5;});
    area.innerHTML='';
    var wrap=document.createElement('div');wrap.style.textAlign='center';
    var em=document.createElement('div');em.style.cssText='font-size:48px;margin-bottom:.5rem;';em.textContent=w.emoji;wrap.appendChild(em);
    var hp=document.createElement('p');hp.style.cssText='font-size:16px;color:var(--muted);margin-bottom:1.5rem;';hp.textContent=w.hint;wrap.appendChild(hp);
    var lbl=document.createElement('p');lbl.style.cssText='font-size:14px;font-weight:800;color:var(--muted);margin-bottom:.5rem;';lbl.textContent='Unscramble:';wrap.appendChild(lbl);
    var bank=document.createElement('div');bank.id='letter-bank';bank.style.cssText='display:flex;gap:10px;justify-content:center;margin-bottom:1.5rem;flex-wrap:wrap;';
    sc.forEach(function(l){
      var tile=document.createElement('div');
      tile.style.cssText='width:52px;height:52px;background:var(--plum);color:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-size:26px;cursor:pointer;user-select:none;';
      tile.textContent=l;
      (function(letter,el){el.addEventListener('click',function(){
        if(el.style.opacity==='0.3')return;
        el.style.opacity='0.3';el.style.cursor='default';
        var sl=document.querySelectorAll('#word-slots>div'),empty=Array.from(sl).find(function(s){return s.textContent==='';});
        if(empty){empty.textContent=letter;empty.style.background='var(--plum-light)';empty.style.borderColor='var(--plum)';}
      });})(l,tile);
      bank.appendChild(tile);
    });
    wrap.appendChild(bank);
    var lbl2=document.createElement('p');lbl2.style.cssText='font-size:14px;font-weight:800;color:var(--muted);margin-bottom:.5rem;';lbl2.textContent='Your word:';wrap.appendChild(lbl2);
    var slots=document.createElement('div');slots.id='word-slots';slots.style.cssText='display:flex;gap:10px;justify-content:center;margin-bottom:1.5rem;flex-wrap:wrap;';
    w.word.split('').forEach(function(){var s=document.createElement('div');s.style.cssText='width:52px;height:52px;background:var(--bg);border:2.5px dashed var(--border);border-radius:12px;display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-size:26px;';slots.appendChild(s);});
    wrap.appendChild(slots);
    var clrBtn=document.createElement('button');clrBtn.style.cssText='background:none;border:2px solid var(--border);border-radius:50px;padding:8px 20px;font-family:var(--font);font-weight:700;font-size:13px;cursor:pointer;margin-right:8px;';
    clrBtn.textContent='Clear ↩';clrBtn.addEventListener('click',function(){
      document.querySelectorAll('#word-slots>div').forEach(function(s){s.textContent='';s.style.background='var(--bg)';s.style.borderColor='var(--border)';});
      document.querySelectorAll('#letter-bank>div').forEach(function(b){b.style.opacity='1';b.style.cursor='pointer';});});
    wrap.appendChild(clrBtn);
    var chkBtn=document.createElement('button');chkBtn.style.cssText='background:var(--plum);border:none;border-radius:50px;padding:8px 24px;font-family:var(--font);font-weight:800;font-size:14px;color:#fff;cursor:pointer;';
    chkBtn.textContent='Check ✓';chkBtn.addEventListener('click',function(){
      var built=Array.from(document.querySelectorAll('#word-slots>div')).map(function(s){return s.textContent;}).join('');
      var fb=document.getElementById('word-fb');
      if(built===w.word){if(fb)fb.innerHTML='<span style="color:var(--leaf)">✅ Correct!</span>';addScore(15);correct++;setTimeout(function(){idx++;showWord();},1200);}
      else if(built.length<w.word.length){if(fb)fb.innerHTML='<span style="color:var(--amber)">Fill all letters first!</span>';}
      else{if(fb)fb.innerHTML='<span style="color:var(--rose)">Try again! 💪</span>';setTimeout(function(){
        document.querySelectorAll('#word-slots>div').forEach(function(s){s.textContent='';s.style.background='var(--bg)';s.style.borderColor='var(--border)';});
        document.querySelectorAll('#letter-bank>div').forEach(function(b){b.style.opacity='1';b.style.cursor='pointer';});},1000);}
    });
    wrap.appendChild(chkBtn);
    var fb=document.createElement('div');fb.id='word-fb';fb.style.cssText='margin-top:1rem;min-height:32px;font-size:14px;font-weight:800;';wrap.appendChild(fb);
    var prog=document.createElement('div');prog.style.cssText='margin-top:.5rem;font-size:13px;color:var(--muted);';prog.textContent='Word '+(idx+1)+'/'+words.length;wrap.appendChild(prog);
    area.appendChild(wrap);
  }
  startClock(240,function(){showResult(area,"Time's up!",'You got '+correct+' correct.');});
  showWord();
}

function startPattern(area){
  var pq=0,pscore=0;
  var patterns=[
    {seq:['🔴','🔵','🔴','🔵','🔴'],ans:'🔵',opts:['🔵','🟢','🟡'],hint:'Red blue repeats'},
    {seq:['1','2','3','4','5'],ans:'6',opts:['6','7','8'],hint:'Count up by 1'},
    {seq:['2','4','6','8','10'],ans:'12',opts:['11','12','13'],hint:'Count by 2s'},
    {seq:['🌑','🌒','🌓','🌔','🌕'],ans:'🌖',opts:['🌑','🌖','🌕'],hint:'Moon growing'},
    {seq:['5','10','15','20','25'],ans:'30',opts:['28','30','35'],hint:'Count in 5s'},
    {seq:['🌧','☀️','🌧','☀️','🌧'],ans:'☀️',opts:['☀️','🌧','⛅'],hint:'Rain sun pattern'}
  ];
  function showP(){
    if(pq>=patterns.length){clearInterval(gameTimer);showResult(area,'Pattern Master!','You solved '+pscore+' patterns!');return;}
    var p=patterns[pq];
    area.innerHTML='<div style="text-align:center;">'+
      '<div style="font-size:14px;font-weight:800;color:var(--muted);margin-bottom:1rem;">What comes next? ('+(pq+1)+'/'+patterns.length+')</div>'+
      '<div style="display:flex;gap:10px;justify-content:center;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;">'+
      p.seq.map(function(s){return '<div style="width:56px;height:56px;background:var(--bg);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:28px;border:2px solid var(--border);">'+s+'</div>';}).join('')+
      '<div style="width:56px;height:56px;background:var(--plum-light);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:28px;border:2.5px dashed var(--plum);">❓</div>'+
      '</div><p style="font-size:13px;color:var(--muted);margin-bottom:1.5rem;">💡 '+p.hint+'</p>'+
      '<div style="display:flex;gap:12px;justify-content:center;" id="pat-opts">'+
      p.opts.map(function(o){return '<button data-val="'+o+'" style="width:72px;height:72px;background:var(--white);border:2.5px solid var(--border);border-radius:16px;font-size:34px;cursor:pointer;">'+o+'</button>';}).join('')+
      '</div><div id="pat-fb" style="margin-top:1.2rem;min-height:28px;font-size:14px;font-weight:800;"></div></div>';
    document.querySelectorAll('#pat-opts button').forEach(function(btn){
      btn.addEventListener('click',function(){
        document.querySelectorAll('#pat-opts button').forEach(function(b){b.disabled=true;});
        var fb=document.getElementById('pat-fb');
        if(this.dataset.val===p.ans){if(fb)fb.innerHTML='<span style="color:var(--leaf)">✅ Correct! 🌟</span>';addScore(15);pscore++;setTimeout(function(){pq++;showP();},1200);}
        else{if(fb)fb.innerHTML='<span style="color:var(--rose)">Answer: '+p.ans+'</span>';setTimeout(function(){pq++;showP();},1500);}
      });
    });
  }
  startClock(300,function(){showResult(area,"Time's up!",'You solved '+pscore+' patterns.');});
  showP();
}

function startBreathing(area){
  clearInterval(gameTimer);
  var timerEl=document.getElementById('gv-timer'); if(timerEl)timerEl.textContent='';
  var phase=0,rep=0,totalReps=5;
  var phases=[{label:'Breathe IN 🌬️',color:'var(--sky)',dur:4},{label:'Hold... 🤫',color:'var(--plum)',dur:4},{label:'Breathe OUT 😮‍💨',color:'var(--leaf)',dur:6},{label:'Rest ☁️',color:'var(--muted)',dur:2}];
  var bgMap={0:'#E6F1FB',1:'#EEEDFE',2:'#E1F5EE',3:'#F5F4F2'};
  area.innerHTML='<div style="text-align:center;padding:1rem;">'+
    '<div id="breath-label" style="font-family:var(--font-d);font-size:28px;margin-bottom:1.5rem;color:var(--sky);">Get ready...</div>'+
    '<div id="breath-circle" style="width:160px;height:160px;border-radius:50%;background:#E6F1FB;border:6px solid var(--sky);margin:0 auto 1.5rem;display:flex;align-items:center;justify-content:center;font-size:52px;transition:all 1s ease;">🌬️</div>'+
    '<div style="font-size:14px;color:var(--muted);font-weight:700;margin-bottom:1rem;">Round <span id="br-rep">1</span> of '+totalReps+'</div>'+
    '<div style="width:100%;max-width:300px;margin:0 auto;height:10px;background:var(--bg);border-radius:50px;overflow:hidden;"><div id="breath-bar" style="height:100%;border-radius:50px;background:var(--sky);width:0%;transition:none;"></div></div>'+
    '<p style="font-size:13px;color:var(--muted);margin-top:1.5rem;">Focus on your breath. 💙</p></div>';
  function nextPhase(){
    if(rep>=totalReps){addScore(30);showResult(area,'Well done! 💙','Breathing complete. You should feel calmer now!');return;}
    var p=phases[phase];
    var lbl=document.getElementById('breath-label');if(lbl){lbl.textContent=p.label;lbl.style.color=p.color;}
    var rEl=document.getElementById('br-rep');if(rEl)rEl.textContent=rep+1;
    var circle=document.getElementById('breath-circle');
    var bar=document.getElementById('breath-bar');
    var emojis={0:'🌬️',1:'🤫',2:'😮‍💨',3:'☁️'};
    if(circle){circle.textContent=emojis[phase];circle.style.borderColor=p.color;circle.style.background=bgMap[phase]||'var(--bg)';
      if(phase===0)circle.style.transform='scale(1.4)';else if(phase===2)circle.style.transform='scale(0.9)';else circle.style.transform='scale(1)';}
    if(bar){bar.style.transition='width '+p.dur+'s linear';bar.style.width=(phase===2?'0%':'100%');bar.style.background=p.color;}
    setTimeout(function(){phase++;if(phase>=phases.length){phase=0;rep++;}nextPhase();},p.dur*1000);
  }
  setTimeout(nextPhase,1000);
}

function startNinja(area){
  var nq=0,ncorrect=0,total=10;
  function makeQ(){
    var ops=['+','-','×'];var op=ops[Math.floor(Math.random()*3)];var a,b,ans;
    if(op==='+'){a=Math.floor(Math.random()*20)+1;b=Math.floor(Math.random()*20)+1;ans=a+b;}
    else if(op==='-'){a=Math.floor(Math.random()*20)+10;b=Math.floor(Math.random()*a)+1;ans=a-b;}
    else{a=Math.floor(Math.random()*9)+2;b=Math.floor(Math.random()*9)+2;ans=a*b;}
    var wrongs=new Set(),attempts=0;
    while(wrongs.size<3&&attempts<50){var w=ans+Math.floor(Math.random()*12)-6;if(w!==ans&&w>0)wrongs.add(w);attempts++;}
    var fb=[ans+1,ans+2,ans+3];fb.forEach(function(x){if(wrongs.size<3&&x!==ans)wrongs.add(x);});
    return{q:a+' '+op+' '+b+' = ?',ans:ans,opts:[ans,...wrongs].sort(function(){return Math.random()-.5;})};
  }
  function showQ(){
    if(nq>=total){clearInterval(gameTimer);showResult(area,'Number Ninja Complete!','You got '+ncorrect+'/'+total+'!');return;}
    var q=makeQ();
    area.innerHTML='<div style="text-align:center;">'+
      '<div style="font-size:13px;color:var(--muted);font-weight:700;margin-bottom:1rem;">Question '+(nq+1)+'/'+total+'</div>'+
      '<div style="font-family:var(--font-d);font-size:52px;color:var(--text);margin-bottom:2rem;letter-spacing:2px;">'+q.q+'</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:340px;margin:0 auto;" id="ninja-opts">'+
      q.opts.map(function(o){return '<button data-val="'+o+'" style="padding:18px;background:var(--white);border:2.5px solid var(--border);border-radius:16px;font-family:var(--font-d);font-size:28px;cursor:pointer;">'+o+'</button>';}).join('')+
      '</div><div id="ninja-fb" style="margin-top:1.5rem;font-size:15px;font-weight:800;min-height:28px;"></div></div>';
    document.querySelectorAll('#ninja-opts button').forEach(function(btn){
      btn.addEventListener('click',function(){
        document.querySelectorAll('#ninja-opts button').forEach(function(b){b.disabled=true;});
        var fb=document.getElementById('ninja-fb');
        if(parseInt(this.dataset.val)===q.ans){if(fb)fb.innerHTML='<span style="color:var(--leaf)">✅ Correct! +15 ⭐</span>';addScore(15);ncorrect++;setTimeout(function(){nq++;showQ();},900);}
        else{if(fb)fb.innerHTML='<span style="color:var(--rose)">Answer: '+q.ans+'</span>';setTimeout(function(){nq++;showQ();},1400);}
      });
    });
  }
  startClock(180,function(){showResult(area,"Time's up!",'You got '+ncorrect+' correct.');});
  showQ();
}

function startRhyme(area){
  var rq=0,rcorrect=0;
  var rhymes=[{word:'CAT',opts:['BAT','CAR','CUP'],ans:'BAT'},{word:'MOON',opts:['SPOON','DOOR','BIRD'],ans:'SPOON'},
    {word:'RING',opts:['ROPE','SING','BALL'],ans:'SING'},{word:'CAKE',opts:['CARD','LAKE','BIRD'],ans:'LAKE'},
    {word:'STAR',opts:['CAR','SOCK','TREE'],ans:'CAR'},{word:'BEAR',opts:['HAIR','BALL','FISH'],ans:'HAIR'},
    {word:'FROG',opts:['FROG','LOG','PIG'],ans:'LOG'},{word:'BLUE',opts:['CLUE','BLINK','BOAT'],ans:'CLUE'}];
  function showR(){
    if(rq>=rhymes.length){clearInterval(gameTimer);showResult(area,'Rhyme Master!','You found '+rcorrect+' rhymes!');return;}
    var r=rhymes[rq];
    area.innerHTML='<div style="text-align:center;">'+
      '<div style="font-size:13px;color:var(--muted);font-weight:700;margin-bottom:1rem;">Question '+(rq+1)+'/'+rhymes.length+'</div>'+
      '<p style="font-size:16px;color:var(--muted);margin-bottom:.75rem;">Which word <strong style="color:var(--amber);">RHYMES</strong> with:</p>'+
      '<div style="font-family:var(--font-d);font-size:56px;color:var(--amber);margin-bottom:1.5rem;letter-spacing:4px;">'+r.word+'</div>'+
      '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;" id="rhyme-opts">'+
      r.opts.map(function(o){return '<button data-val="'+o+'" style="padding:14px 28px;background:var(--white);border:2.5px solid var(--border);border-radius:16px;font-family:var(--font-d);font-size:24px;cursor:pointer;min-width:100px;">'+o+'</button>';}).join('')+
      '</div><div id="rhyme-fb" style="margin-top:1.5rem;font-size:15px;font-weight:800;min-height:28px;"></div></div>';
    document.querySelectorAll('#rhyme-opts button').forEach(function(btn){
      btn.addEventListener('click',function(){
        document.querySelectorAll('#rhyme-opts button').forEach(function(b){b.disabled=true;});
        var fb=document.getElementById('rhyme-fb');
        if(this.dataset.val===r.ans){if(fb)fb.innerHTML='<span style="color:var(--leaf)">✅ '+r.ans+' rhymes! 🎵</span>';addScore(12);rcorrect++;setTimeout(function(){rq++;showR();},1200);}
        else{if(fb)fb.innerHTML='<span style="color:var(--rose)">Rhyme: '+r.ans+'</span>';setTimeout(function(){rq++;showR();},1500);}
      });
    });
  }
  startClock(240,function(){showResult(area,"Time's up!",'You found '+rcorrect+' rhymes!');});
  showR();
}

function checkAnswer(btn,correct){
  var opts=btn.parentElement.querySelectorAll('.quiz-opt');
  opts.forEach(function(o){o.disabled=true;});
  if(correct){btn.classList.add('correct');
    setTimeout(function(){if(typeof addBotMessage==='function')addBotMessage('<reward><span class="r-emoji">🌟</span><h4>Correct! You earned a star!</h4><p>Brilliant work!</p></reward>');},400);
  }else{btn.classList.add('wrong');
    setTimeout(function(){if(typeof addBotMessage==='function')addBotMessage('Good try! 💪 The answer is highlighted.');
      btn.parentElement.querySelectorAll('.quiz-opt').forEach(function(o){if(o!==btn)o.classList.add('correct');});},400);}
}
