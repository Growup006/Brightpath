function togglePill(el) {
  el.classList.toggle('on');
  var pe = document.getElementById('rg-pills-error');
  if(pe) pe.style.display = 'none';
  var errEl = document.getElementById('rg-error');
  if(errEl && errEl.textContent.indexOf('learning') >= 0) errEl.style.display = 'none';
  try { rgSaveProgress(); } catch(e){}
}

function rgSaveProgress() {
  try {
    var data = {
      step:        RG.currentStep || 1,
      role:        RG.role,
      name:        (document.getElementById('rg-name')         ||{}).value || '',
      email:       (document.getElementById('rg-email')        ||{}).value || '',
      parentEmail: (document.getElementById('rg-parent-email') ||{}).value || '',
      classNum:    (document.getElementById('rg-class')        ||{}).value || '',
      pills:       Array.from(document.querySelectorAll('.rg-pill.on')).map(function(p){ return p.dataset.val||p.textContent.trim(); })
    };
    localStorage.setItem('bp_rg_draft', JSON.stringify(data));
  } catch(e){}
}

function rgClearProgress() {
  try { localStorage.removeItem('bp_rg_draft'); } catch(e){}
}

function rgLoadProgress() {
  try { return JSON.parse(localStorage.getItem('bp_rg_draft') || 'null'); } catch(e){ return null; }
}

var RG = {
  role: 'child',
  currentStep: 1,

  goStep: function(n) {
    RG.currentStep = n;
    [1,2,3].forEach(function(i){
      var s = document.getElementById('rg-step'+i);
      if(s) s.className = 'rg-step' + (i===n?' on':'');
    });
    ['d1','d2','d3'].forEach(function(id,i){
      var d = document.getElementById('rg-'+id);
      if(!d) return;
      d.className = 'rg-dot';
      if(i < n-1) d.classList.add('done');
      if(i === n-1) d.classList.add('active');
    });
    var w = document.getElementById('rg-wrap');
    if(w) w.scrollTop = 0;
    rgSaveProgress();
  },

  pickRole: function(r) {
    RG.role = r;
    currentRole = r;
    ['child','parent','teacher','admin'].forEach(function(id){
      var c = document.getElementById('rg-c-'+id);
      if(c) c.className = 'rg-card';
    });
    var card = document.getElementById('rg-c-'+r);
    if(card) card.className = 'rg-card picked';
    var sf = document.getElementById('rg-student-fields');
    if(sf) sf.style.display = (r==='child')?'block':'none';
    rgSaveProgress();
  },

  enter: function() {
    if(RG.role === 'child') {
      doRegister();
    } else {
      var map = {parent:'s-parent',teacher:'s-teacher',admin:'s-admin'};
      showScreen(map[RG.role]||'s-child');
    }
  },

  // Restore saved draft into form fields
  restoreDraft: function(draft) {
    RG.pickRole(draft.role || 'child');
    var fields = { 'rg-name': draft.name, 'rg-email': draft.email, 'rg-parent-email': draft.parentEmail, 'rg-class': draft.classNum };
    Object.keys(fields).forEach(function(id) {
      var el = document.getElementById(id);
      if(el && fields[id]) el.value = fields[id];
    });
    if(draft.pills && draft.pills.length) {
      document.querySelectorAll('.rg-pill').forEach(function(p){
        var val = p.dataset.val || p.textContent.trim();
        if(draft.pills.indexOf(val) >= 0) p.classList.add('on');
      });
    }
    RG.goStep(draft.step || 1);
  },

  init: function() {
    // Role cards
    ['child','parent','teacher','admin'].forEach(function(r){
      var el = document.getElementById('rg-c-'+r);
      if(el) el.addEventListener('click', function(){ RG.pickRole(r); });
    });

    // Pills handled via inline onclick in HTML - no JS binding needed
    var pillsWrap = document.getElementById('rg-pills-wrap');
    // just ensure existing .on state is visible
    if(pillsWrap) {
      pillsWrap.querySelectorAll('.rg-pill').forEach(function(p){
        p.style.cursor = 'pointer';
      });
    }

    // Save progress on every input change
    document.querySelectorAll('#rg-step2 input, #rg-step2 select').forEach(function(el){
      el.addEventListener('input', function(){ rgSaveProgress(); });
    });

    // ── STEP 1 → STEP 2 ──
    var b1 = document.getElementById('rg-btn1');
    if(b1) b1.addEventListener('click', function(){
      if(!RG.role) { alert('Please select a role first.'); return; }
      RG.goStep(2);
    });

    // ── STEP 2 → STEP 3 (full validation) ──
    var b2 = document.getElementById('rg-btn2');
    if(b2) b2.addEventListener('click', function(){
      var errEl  = document.getElementById('rg-error');
      var pillsErr = document.getElementById('rg-pills-error');
      if(errEl)    { errEl.style.display='none'; }
      if(pillsErr) { pillsErr.style.display='none'; }
      document.querySelectorAll('#rg-step2 input, #rg-step2 select').forEach(function(i){ i.style.border=''; });

      function rgErr(msg, el) {
        if(errEl){ errEl.textContent='⚠️ '+msg; errEl.style.display='block'; }
        if(el){ el.style.border='2px solid #e74c3c'; el.focus(); }
        var w = document.getElementById('rg-wrap'); if(w) w.scrollTop=0;
      }

      var name        = (document.getElementById('rg-name')         ||{}).value||'';
      var email       = (document.getElementById('rg-email')        ||{}).value||'';
      var pass        = (document.getElementById('rg-pass')         ||{}).value||'';
      var cls         = (document.getElementById('rg-class')        ||{}).value||'';
      var parentEmail = (document.getElementById('rg-parent-email') ||{}).value||'';
      var pills       = document.querySelectorAll('.rg-pill.on');

      if(RG.role === 'child') {
        if(!name.trim())                  { rgErr('Full name is required.',                         document.getElementById('rg-name')); return; }
        if(!email.trim())                 { rgErr('Email address is required.',                     document.getElementById('rg-email')); return; }
        if(!email.includes('@'))          { rgErr('Please enter a valid email address.',            document.getElementById('rg-email')); return; }
        if(!pass.trim())                  { rgErr('Password is required.',                          document.getElementById('rg-pass')); return; }
        if(pass.trim().length < 6)        { rgErr('Password must be at least 6 characters.',       document.getElementById('rg-pass')); return; }
        if(!cls)                          { rgErr('Please select your class (6, 7 or 8).',         document.getElementById('rg-class')); return; }
        if(!parentEmail.trim())           { rgErr('Parent / guardian email is required.',          document.getElementById('rg-parent-email')); return; }
        if(!parentEmail.includes('@'))    { rgErr('Please enter a valid parent email address.',    document.getElementById('rg-parent-email')); return; }
        if(pills.length === 0)            {
          if(pillsErr) pillsErr.style.display='block';
          if(errEl){ errEl.textContent='⚠️ Please select at least one learning style.'; errEl.style.display='block'; }
          var w=document.getElementById('rg-wrap'); if(w) w.scrollTop=999;
          return;
        }
        // Duplicate email check
        try {
          var existing = JSON.parse(localStorage.getItem('bp_accounts')||'{}');
          if(existing[email.trim()]) { rgErr('This email is already registered. Please sign in instead.', document.getElementById('rg-email')); return; }
        } catch(e){}
      }
      RG.goStep(3);
    });

    var b2b = document.getElementById('rg-btn2back');
    if(b2b) b2b.addEventListener('click', function(){ RG.goStep(1); });

    var b3 = document.getElementById('rg-btn3');
    if(b3) b3.addEventListener('click', function(){ RG.enter(); });

    // Back button — warn if in progress
    var bb = document.getElementById('rg-backbtn');
    if(bb) bb.addEventListener('click', function(){
      var draft = rgLoadProgress();
      var hasData = draft && (draft.name || draft.email);
      if(hasData && RG.currentStep > 1) {
        if(confirm('Your registration is not complete. Your progress has been saved — you can continue later.\n\nLeave registration?')) {
          showScreen('s-land');
        }
      } else {
        rgClearProgress();
        showScreen('s-land');
      }
    });

    // Default student fields shown
    var sf = document.getElementById('rg-student-fields');
    if(sf) sf.style.display = 'block';
  }
};

window.addEventListener('beforeunload', function(e) {
  var draft = rgLoadProgress();
  var onRegScreen = document.getElementById('s-register') && document.getElementById('s-register').classList.contains('on');
  if(onRegScreen && draft && (draft.name || draft.email)) {
    e.preventDefault();
    e.returnValue = 'Your registration is not complete. Are you sure you want to leave?';
    return e.returnValue;
  }
});

var _rgInitDone = false;

function _rgEnsureInit() {
  if(document.getElementById('rg-btn1')) {
    if(!_rgInitDone) { _rgInitDone = true; RG.init(); }
  }
}

(function(){
  var orig = showScreen;
  showScreen = function(id) {
    orig(id);
    if(id === 's-register') {
      setTimeout(function(){
        _rgInitDone = false;
        _rgEnsureInit();
        // Check for saved draft
        var draft = rgLoadProgress();
        var hasProgress = draft && (draft.name || draft.email) && draft.step > 1;
        if(hasProgress) {
          // Ask user if they want to continue or start fresh
          var resume = confirm(
            'Welcome back! 👋\n\nYou left registration unfinished.\n\n' +
            '• Press OK to continue where you left off\n' +
            '• Press Cancel to start fresh'
          );
          if(resume) {
            RG.restoreDraft(draft);
          } else {
            rgClearProgress();
            RG.goStep(1);
            // Clear all fields
            document.querySelectorAll('#rg-step2 input').forEach(function(i){ i.value=''; i.style.border=''; });
            document.querySelectorAll('#rg-step2 select').forEach(function(s){ s.value=''; });
            document.querySelectorAll('.rg-pill').forEach(function(p){ p.classList.remove('on'); });
          }
        } else {
          RG.goStep(1);
        }
      }, 50);
    }
  };
})();
