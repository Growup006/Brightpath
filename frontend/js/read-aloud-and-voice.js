var RA = {
  queue:[], idx:0, speaking:false, paused:false,
  rateIdx:1, rates:[0.72,0.9,1.1], rateLabels:['🐢 Slow','🙂 Normal','🐇 Fast'],
  highlightEl:null,

  clean:function(str){
    return String(str||'')
      .replace(/<[^>]*>/g,'')
      .replace(/\*\*/g,'')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}]/gu,'')
      .replace(/\s+/g,' ').trim();
  },

  getActivePane:function(){
    var screen=document.querySelector('.screen.on');
    if(!screen)return null;
    return screen.querySelector('.pane.on')||screen;
  },

  buildQueue:function(pane){
    var items=[]; if(!pane) return items;
    var seen=new Set();
    function push(el,text){
      if(!el||seen.has(el))return;
      text=RA.clean(text);
      if(text){ items.push({el:el,text:text}); seen.add(el); }
    }
    // greeting / mood card
    var gc=pane.querySelector('.greet-card');
    if(gc){
      var h=gc.querySelector('h2'); if(h)push(h,h.textContent);
      var p=gc.querySelector('p'); if(p)push(p,p.textContent+'.');
    }
    // stat cards (combine number + label into one sentence)
    pane.querySelectorAll('.stat-card').forEach(function(card){
      var num=card.querySelector('.sc-num'), label=card.querySelector('.sc-label');
      if(num&&label) push(card, label.textContent+': '+num.textContent+'.');
    });
    // section tags e.g. "Continue where you left off"
    pane.querySelectorAll('.sec-tag').forEach(function(t){ push(t,t.textContent); });
    // continue/subject cards
    pane.querySelectorAll('.subj, .subj-card').forEach(function(card){
      var name=card.querySelector('.subj-name'), type=card.querySelector('.subj-type');
      var pct=card.querySelector('.subj-footer span');
      var txt=(name?name.textContent:'')+(type?', '+type.textContent:'')+(pct?', '+pct.textContent:'');
      push(card,txt);
    });
    // panel headers + tip items (used on profile/rewards/other panes)
    pane.querySelectorAll('.panel > h3, .tip-item').forEach(function(el){ push(el, el.textContent); });
    // generic fallback so no pane is ever silent
    if(items.length===0){
      pane.querySelectorAll('h1,h2,h3,h4,p,li').forEach(function(el){
        if(el.closest('button')) return;
        push(el, el.textContent);
      });
    }
    return items;
  },

  clearHighlight:function(){
    if(this.highlightEl){ this.highlightEl.classList.remove('ra-highlight'); this.highlightEl=null; }
  },

  setUI:function(state){
    document.querySelectorAll('.ra-main-btn').forEach(function(btn){
      btn.classList.toggle('ra-active', state!=='idle');
      var label = state==='speaking' ? 'Pause' : state==='paused' ? 'Resume' : '🔊 Read Aloud';
      btn.innerHTML = state==='idle' ? '<span class="ra-dot"></span>🔊 Read Aloud' : '<span class="ra-dot"></span>⏸ '+label;
      if(state==='paused') btn.innerHTML='<span class="ra-dot"></span>▶ Resume';
    });
    document.querySelectorAll('.ra-stop-btn,.ra-speed-btn').forEach(function(btn){
      btn.style.display = state==='idle' ? 'none' : 'inline-flex';
    });
  },

  speakNext:function(){
    if(this.idx>=this.queue.length){ this.finish(); return; }
    var item=this.queue[this.idx], self=this;
    this.clearHighlight();
    if(item.el){
      item.el.classList.add('ra-highlight');
      this.highlightEl=item.el;
      if(item.el.scrollIntoView) item.el.scrollIntoView({behavior:'smooth',block:'center'});
    }
    var u=new SpeechSynthesisUtterance(item.text);
    u.rate=this.rates[this.rateIdx]; u.pitch=1.05;
    u.onend=function(){ self.idx++; self.speakNext(); };
    u.onerror=function(){ self.idx++; self.speakNext(); };
    speechSynthesis.speak(u);
  },

  toggle:function(){
    if(this.speaking&&!this.paused){ this.pause(); return; }
    if(this.paused){ this.resume(); return; }
    this.start();
  },

  start:function(){
    var pane=this.getActivePane();
    this.queue=this.buildQueue(pane);
    speechSynthesis.cancel();
    if(!this.queue.length){
      var u=new SpeechSynthesisUtterance("There isn't anything here to read yet.");
      speechSynthesis.speak(u);
      return;
    }
    this.idx=0; this.speaking=true; this.paused=false;
    this.setUI('speaking');
    this.speakNext();
  },

  pause:function(){ if(!this.speaking)return; speechSynthesis.pause(); this.paused=true; this.setUI('paused'); },
  resume:function(){ if(!this.paused)return; speechSynthesis.resume(); this.paused=false; this.setUI('speaking'); },

  stop:function(){
    speechSynthesis.cancel();
    this.speaking=false; this.paused=false; this.idx=0;
    this.clearHighlight(); this.setUI('idle');
  },

  finish:function(){
    this.speaking=false; this.paused=false;
    this.clearHighlight(); this.setUI('idle');
  },

  cycleSpeed:function(){
    this.rateIdx=(this.rateIdx+1)%this.rates.length;
    var self=this;
    document.querySelectorAll('.ra-speed-btn').forEach(function(btn){ btn.textContent=self.rateLabels[self.rateIdx]; });
    if(this.speaking&&!this.paused){ speechSynthesis.cancel(); this.speakNext(); }
  }
};

var recognition=null;

function startVoice(){
  if(!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)){alert('Voice input is not supported in this browser. Please try Chrome.');return;}
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  recognition=new SR();recognition.lang='en-IN';recognition.interimResults=false;
  recognition.onresult=function(e){document.getElementById('chat-input').value=e.results[0][0].transcript;};
  recognition.onerror=function(){};
  recognition.start();
}
