var CTRL = {
  diff: 'Easy',
  trendData: {
    maths:   [45,52,58,63,68,72],
    english: [30,38,42,45,50,55],
    science: [60,68,74,80,85,88]
  },
  activeTrend: 'maths',
  colors: { maths:'var(--sun)', english:'var(--plum)', science:'var(--leaf)' },

  setDiff: function(btn, val) {
    CTRL.diff = val;
    document.querySelectorAll('.diff-btn').forEach(function(b){ b.classList.remove('sel'); });
    btn.classList.add('sel');
  },

  updatePace: function(v) {
    var labels = ['','Slow','Medium','Fast'];
    var el = document.getElementById('ctrl-pace-val');
    if(el) el.textContent = labels[v] || v;
  },

  updateHints: function(v) {
    var labels = ['None','Few','More','Lots'];
    var el = document.getElementById('ctrl-hints-val');
    if(el) el.textContent = labels[v] || v;
  },

  updateFontSize: function(v) {
    var labels = ['','Small','Med','Large'];
    var el = document.getElementById('ctrl-fontsize-val');
    if(el) el.textContent = labels[v] || v;
  },

  toggleFocus: function(cb) {
    var st = document.getElementById('focus-status');
    if(st) st.textContent = cb.checked
      ? 'Focus Mode ON — games hidden, clean lesson view'
      : 'Currently OFF — games and rewards visible';
  },

  save: function() {
    var msg = document.getElementById('ctrl-saved-msg');
    if(msg) { msg.style.display='block'; setTimeout(function(){ msg.style.display='none'; }, 2500); }
  },

  reset: function() {
    var el;
    el=document.getElementById('ctrl-daily-limit'); if(el){el.value=60;document.getElementById('ctrl-daily-val').textContent='60m';}
    el=document.getElementById('ctrl-break'); if(el){el.value=10;document.getElementById('ctrl-break-val').textContent='10m';}
    el=document.getElementById('ctrl-bedtime'); if(el) el.value='21:00';
    el=document.getElementById('ctrl-weekend'); if(el) el.checked=true;
    el=document.getElementById('ctrl-repeat'); if(el) el.checked=true;
    el=document.getElementById('ctrl-games'); if(el) el.checked=true;
    el=document.getElementById('ctrl-remind'); if(el) el.checked=true;
    el=document.getElementById('ctrl-rewards'); if(el) el.checked=true;
    el=document.getElementById('ctrl-focus'); if(el){el.checked=false; CTRL.toggleFocus(el);}
    el=document.getElementById('ctrl-dyslexia'); if(el) el.checked=false;
    el=document.getElementById('ctrl-tts'); if(el) el.checked=false;
    el=document.getElementById('ctrl-pace'); if(el){el.value=1; CTRL.updatePace(1);}
    el=document.getElementById('ctrl-hints'); if(el){el.value=2; CTRL.updateHints(2);}
    el=document.getElementById('ctrl-fontsize'); if(el){el.value=2; CTRL.updateFontSize(2);}
    CTRL.diff='Easy';
    document.querySelectorAll('.diff-btn').forEach(function(b,i){ b.classList.toggle('sel', i===0); });
    CTRL.save();
  },

  showTrend: function(subject, btn) {
    CTRL.activeTrend = subject;
    // update tab buttons
    document.querySelectorAll('#trend-tabs button').forEach(function(b){
      b.style.background = 'var(--bg)';
      b.style.color = 'var(--muted)';
      b.style.border = '2px solid var(--border)';
    });
    if(btn) {
      var colMap = {maths:'var(--sun)',english:'var(--plum)',science:'var(--leaf)'};
      btn.style.background = colMap[subject] || 'var(--plum)';
      btn.style.color = '#fff';
      btn.style.border = 'none';
    }
    CTRL.renderTrend();
  },

  renderTrend: function() {
    var wrap = document.getElementById('trend-chart');
    if(!wrap) return;
    var data = CTRL.trendData[CTRL.activeTrend] || [0,0,0,0,0,0];
    var colorMap = {maths:'#FF8C42',english:'#7F77DD',science:'#1D9E75'};
    var color = colorMap[CTRL.activeTrend] || '#7F77DD';
    var labels = ['Wk 1','Wk 2','Wk 3','Wk 4','Wk 5','Wk 6'];
    var W = 500, H = 110, padL = 8, padR = 8, padT = 16, padB = 4;
    var n = data.length;
    var minV = Math.max(0, Math.min.apply(null,data) - 10);
    var maxV = Math.min(100, Math.max.apply(null,data) + 8);
    var range = maxV - minV || 1;

    function xPos(i){ return padL + (i / (n-1)) * (W - padL - padR); }
    function yPos(v){ return padT + (1 - (v - minV)/range) * (H - padT - padB); }

    var pts = data.map(function(v,i){ return xPos(i)+','+yPos(v); }).join(' ');
    var pathD = data.map(function(v,i){
      if(i===0) return 'M '+xPos(i)+' '+yPos(v);
      // smooth cubic bezier
      var x0=xPos(i-1), y0=yPos(data[i-1]), x1=xPos(i), y1=yPos(v);
      var cx=(x0+x1)/2;
      return 'C '+cx+' '+y0+' '+cx+' '+y1+' '+x1+' '+y1;
    }).join(' ');

    // area path (close below)
    var areaD = pathD + ' L '+xPos(n-1)+' '+(H)+' L '+xPos(0)+' '+H+' Z';

    // y-axis guide lines (3 horizontal dotted)
    var guides = '';
    [25,50,75].forEach(function(pct){
      if(pct >= minV && pct <= maxV){
        var y = yPos(pct);
        guides += '<line x1="'+padL+'" y1="'+y+'" x2="'+(W-padR)+'" y2="'+y+
          '" stroke="#E0DDD8" stroke-width="1" stroke-dasharray="4,4"/>';
        guides += '<text x="'+padL+'" y="'+(y-3)+'" font-size="9" fill="#B0ADA8" font-family="Nunito,sans-serif" font-weight="700">'+pct+'%</text>';
      }
    });

    // dots + tooltip targets
    var dots = data.map(function(v,i){
      return '<circle class="trend-dot" cx="'+xPos(i)+'" cy="'+yPos(v)+'" r="5" fill="'+color+'" stroke="#fff" stroke-width="2"'+
        ' data-v="'+v+'" data-i="'+i+'"/>';
    }).join('');

    wrap.innerHTML =
      '<svg class="trend-svg" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none">'+
        guides+
        '<path class="trend-area" d="'+areaD+'" fill="'+color+'"/>'+
        '<path class="trend-line" d="'+pathD+'" stroke="'+color+'"/>'+
        dots+
      '</svg>'+
      '<div class="trend-tooltip" id="trend-tt"></div>'+
      '<div class="trend-x-labels">'+
        labels.map(function(l){ return '<div class="trend-x-label">'+l+'</div>'; }).join('')+
      '</div>';

    // Attach hover events to dots
    var tt = wrap.querySelector('#trend-tt');
    wrap.querySelectorAll('.trend-dot').forEach(function(dot){
      dot.addEventListener('mouseenter', function(e){
        if(!tt) return;
        var rect = wrap.getBoundingClientRect();
        var svgRect = wrap.querySelector('svg').getBoundingClientRect();
        var cx = parseFloat(dot.getAttribute('cx'));
        var xRatio = cx / W;
        tt.textContent = labels[dot.getAttribute('data-i')] + ': ' + dot.getAttribute('data-v') + '%';
        tt.style.opacity = '1';
        tt.style.left = (xRatio * wrap.offsetWidth - 24) + 'px';
        tt.style.top = '-28px';
      });
      dot.addEventListener('mouseleave', function(){ if(tt) tt.style.opacity='0'; });
    });
  },

  updateForChild: function(c) {
    // Update control center title
    var fn = c.name.split(' ')[0];
    var t = document.getElementById('ctrl-title');
    if(t) t.textContent = fn + "'s Learning Controls";
    // Update predictions based on child data
    var predMaths = Math.min(100, c.maths + 13);
    var predEng = Math.min(100, c.english + 13);
    var predSci = Math.min(100, c.science + 7);
    var pm = document.getElementById('pred-maths-val'); if(pm) pm.textContent = predMaths + '%';
    var pe = document.getElementById('pred-english-val'); if(pe) pe.textContent = predEng + '%';
    var ps = document.getElementById('pred-science-val'); if(ps) ps.textContent = predSci + '%';
    // Update trend data
    CTRL.trendData.maths = CTRL.buildTrend(c.maths);
    CTRL.trendData.english = CTRL.buildTrend(c.english);
    CTRL.trendData.science = CTRL.buildTrend(c.science);
    CTRL.renderTrend();
    // Update overall prediction msg
    var msg = document.getElementById('pred-overall-msg');
    if(msg) {
      var ahead = c.progress > 70 ? '2 weeks ahead' : 'on track';
      var weak = c.maths < c.english ? 'Maths' : (c.english < c.science ? 'English' : 'Science');
      msg.innerHTML = fn + ' is ' + ahead + ' of schedule. <strong>' + weak + '</strong> needs the most attention this month.';
    }
  },

  buildTrend: function(current) {
    // Build a 6-week trend ending at current value
    var arr = [];
    for(var i=5; i>=0; i--) {
      arr.push(Math.max(0, Math.round(current - i * (current*0.07))));
    }
    return arr;
  },

  init: function() {
    CTRL.renderTrend();
  }
};
