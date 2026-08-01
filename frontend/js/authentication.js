var currentChildClass = '6';

function applyClassFilter(classNum) {
  currentChildClass = String(classNum);
  CURRENT_USER.classNum = currentChildClass;
  document.querySelectorAll('[data-class]').forEach(function(el) {
    var ec = el.dataset.class;
    el.style.display = (ec === 'all' || ec === currentChildClass) ? '' : 'none';
  });
  // Update sidebar
  var sbr = document.getElementById('sb-role');
  if(sbr) sbr.textContent = 'Class ' + currentChildClass;
  // Update home badge
  var hcb = document.getElementById('home-class-badge');
  if(hcb) hcb.textContent = currentChildClass;
  // Refresh continue row with correct class topics
  updateHomeUI();
}

var AUTH_API_URL = 'https://brightpath-sgd4.onrender.com/api/auth';

function doLogin() {
  var emailEl = document.getElementById('login-email');
  var passEl  = document.getElementById('login-pass');
  var errEl   = document.getElementById('login-error');
  var btn     = document.querySelector('#login-form .btn-full');
  var email = emailEl ? emailEl.value.trim() : '';
  var pass  = passEl  ? passEl.value.trim()  : '';

  if(errEl) { errEl.textContent=''; errEl.style.display='none'; }
  if(emailEl) emailEl.style.border='';
  if(passEl)  passEl.style.border='';

  function showErr(msg, highlightEl) {
    if(errEl) { errEl.innerHTML='⚠️ ' + msg; errEl.style.display='block'; }
    if(highlightEl) highlightEl.style.border='2px solid #e74c3c';
    if(highlightEl) highlightEl.focus();
  }

  if(!email) { showErr('Please enter your email address.', emailEl); return; }
  if(!email.includes('@')) { showErr('Please enter a valid email address.', emailEl); return; }
  if(!pass)  { showErr('Please enter your password.', passEl); return; }
  if(pass.length < 6) { showErr('Password must be at least 6 characters.', passEl); return; }

  if(btn) { btn.textContent='Signing in…'; btn.disabled=true; }
  function resetBtn() { if(btn) { btn.textContent='Sign In ✨'; btn.disabled=false; } }

  fetch(AUTH_API_URL + '/login', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email: email, password: pass })
  })
  .then(function(r){ return r.json().then(function(data){ return {status:r.status, data:data}; }); })
  .then(function(res){
    resetBtn();
    if(res.status !== 200){
      showErr(res.data.error || 'Login failed. Please try again.', passEl);
      return;
    }
    var data = res.data;
    localStorage.setItem('bp_token', data.token);
    CURRENT_USER.id        = data.user.id;
    CURRENT_USER.name      = data.user.name;
    CURRENT_USER.email     = data.user.email;
    CURRENT_USER.role      = data.user.role;
    CURRENT_USER.classNum  = data.user.class ? String(data.user.class) : '6';
    CURRENT_USER.learningStyle = data.user.learningStyle || '';
    saveUserLocal();
    onLoginSuccess();
  })
  .catch(function(err){
    resetBtn();
    showErr('Network error. Please check your connection and try again.');
  });
}
  var emailEl = document.getElementById('login-email');
  var passEl  = document.getElementById('login-pass');
  var errEl   = document.getElementById('login-error');
  var btn     = document.querySelector('#login-form .btn-full');

  var email = emailEl ? emailEl.value.trim() : '';
  var pass  = passEl  ? passEl.value.trim()  : '';

  // Clear previous errors
  if(errEl) { errEl.textContent=''; errEl.style.display='none'; }
  if(emailEl) emailEl.style.border='';
  if(passEl)  passEl.style.border='';

  function showErr(msg, highlightEl) {
    if(errEl) { errEl.innerHTML='⚠️ ' + msg; errEl.style.display='block'; }
    if(highlightEl) highlightEl.style.border='2px solid #e74c3c';
    if(highlightEl) highlightEl.focus();
  }

  // Strict validation — block everything before going further
  if(!email) { showErr('Please enter your email address.', emailEl); return; }
  if(!email.includes('@')) { showErr('Please enter a valid email address.', emailEl); return; }
  if(!pass)  { showErr('Please enter your password.', passEl); return; }
  if(pass.length < 6) { showErr('Password must be at least 6 characters.', passEl); return; }

  // Show loading state
  if(btn) { btn.textContent='Signing in…'; btn.disabled=true; }

  function resetBtn() { if(btn) { btn.textContent='Sign In ✨'; btn.disabled=false; } }

  loadFirebase(function() {
    // No Firebase configured or scripts failed to load → use local auth
    if(!fbAuth || FB_CONFIG.apiKey === 'YOUR_API_KEY') {
      var ok = localLogin(email, pass, showErr);
      if(!ok) resetBtn();
      return;
    }
    try {
      fbAuth.signInWithEmailAndPassword(email, pass)
        .then(function(cred) {
          return fbDb.collection('users').doc(cred.user.uid).get().then(function(doc) {
            var data = doc.exists ? doc.data() : {};
            CURRENT_USER.uid      = cred.user.uid;
            CURRENT_USER.name     = data.name     || email.split('@')[0];
            CURRENT_USER.email    = email;
            CURRENT_USER.classNum = data.classNum || '6';
            CURRENT_USER.streak   = data.streak   || 0;
            CURRENT_USER.badges   = data.badges   || 0;
            CURRENT_USER.stars    = data.stars    || 0;
            CURRENT_USER.progress = data.progress || {};
            saveUserLocal();
            resetBtn();
            onLoginSuccess();
          });
        })
        .catch(function(err) {
          resetBtn();
          // Firebase auth errors → try local fallback before showing error
          var ok = localLogin(email, pass, function(){});
          if(!ok) showErr('Login failed: ' + (err.message || 'Please try again.'));
        });
    } catch(e) {
      // Synchronous Firebase error — fall back to local login
      resetBtn();
      var ok = localLogin(email, pass, showErr);
      if(!ok) showErr('Login failed. Please try again.');
    }
  });
}

function findLinkedChildren(parentEmail){
  var accounts = {};
  try { accounts = JSON.parse(localStorage.getItem('bp_accounts') || '{}'); } catch(e){}
  var kids = [];
  Object.keys(accounts).forEach(function(email){
    var acc = accounts[email];
    if(acc && acc.parentEmail && acc.parentEmail.trim().toLowerCase() === (parentEmail||'').trim().toLowerCase()){
      kids.push(acc);
    }
  });
  return kids;
}

function updateParentUI(){
  var kids = findLinkedChildren(CURRENT_USER.email);
  var setText = function(id, val){ var el=document.getElementById(id); if(el) el.textContent = val; };

  if(!kids.length){
    // No linked child found on this browser/device — be honest about it
    // rather than silently showing demo data as if it were real.
    setText('par-acc-name', CURRENT_USER.name || 'Parent');
    setText('prog-title', 'No linked student found');
    setText('ctrl-title', 'No linked student found');
    setText('emo-title', 'No linked student found');
    setText('ds-child-fname', 'your child');
    setText('ds-mood-word', '—');
    setText('ds-mood-sub', 'Have your child register on this same browser/device with your email as their parent email to see real data here.');
    setText('ds-ai-note-text', 'No activity data yet — this will populate once your child has studied on this device.');
    return;
  }

  var child = kids[0]; // same-browser lookup currently supports one linked child at a time
  var firstName = (child.name || 'Student').split(' ')[0];

  setText('par-acc-name', child.name || 'Student');
  setText('prog-title', firstName + '\u2019s Progress');
  setText('ctrl-title', firstName + '\u2019s Learning Controls');
  setText('emo-title', firstName + '\u2019s Mood Log');
  setText('ds-child-fname', firstName);

  var hs = document.getElementById('home-streak'); // not on parent screen, guarded no-op if absent

  var today = new Date().toISOString().slice(0,10);
  var moodEntry = (child.moodHistory||[]).find(function(e){ return e.date===today; });
  if(moodEntry){
    setText('ds-mood-word', moodEntry.word || '—');
    var me = document.getElementById('ds-mood-emoji'); if(me) me.textContent = moodEntry.emoji || '🙂';
  } else {
    setText('ds-mood-word', 'Not logged yet');
    setText('ds-mood-sub', firstName + ' hasn\u2019t logged a mood today.');
  }

  var progress = child.progress || {};
  var subjMap = { maths:'maths', english:'english', science:'science' };
  Object.keys(subjMap).forEach(function(key){
    var pct = Math.round(progress[key] || 0);
    var bar = document.getElementById('ds-bar-'+key);
    var val = document.getElementById('ds-pct-'+key);
    if(bar) bar.style.width = pct + '%';
    if(val) val.textContent = pct + '%';
    // Also fill the standalone Progress pane's matching fields, where present
    var progVal = document.getElementById('prog-'+key);
    var progBar = document.getElementById('prog-'+key+'-bar');
    if(progVal) progVal.textContent = pct + '%';
    if(progBar) progBar.style.width = pct + '%';
  });

  // Only show an AI note if there is real progress to summarise — no invented claims.
  var progressKeys = Object.keys(progress);
  if(progressKeys.length){
    var best = progressKeys.reduce(function(a,b){ return progress[a] > progress[b] ? a : b; });
    setText('ds-ai-note-text', firstName + ' is doing well in ' + best + ' (' + Math.round(progress[best]) + '%). Keep encouraging daily practice!');
  } else {
    setText('ds-ai-note-text', 'No study activity yet — encourage ' + firstName + ' to start a lesson!');
  }

  // Real achievements list, built only from data that actually exists —
  // no fabricated "First Perfect Score" style claims.
  var achList = document.getElementById('prog-achievements-list');
  if(achList){
    var items = [];
    if((child.streak||0) >= 5) items.push({ icon:'🔥', title:(child.streak)+'-Day Streak', sub:'Consistent daily learning' });
    if((child.badges||0) > 0) items.push({ icon:'🏅', title:(child.badges)+' Badge' + (child.badges===1?'':'s') + ' Earned', sub:'From completed topics' });
    if((child.stars||0) > 0) items.push({ icon:'⭐', title:(child.stars)+' Stars Earned', sub:'Keep it up!' });
    if(items.length){
      achList.innerHTML = items.map(function(a){
        return '<div class="act-item"><span style="font-size:20px;">'+a.icon+'</span><div><div style="font-weight:800;font-size:13px;">'+a.title+'</div><div style="font-size:11px;color:var(--muted);">'+a.sub+'</div></div></div>';
      }).join('');
    } else {
      achList.innerHTML = '<div style="font-size:12px;color:var(--muted);">No achievements yet — keep learning to unlock badges!</div>';
    }
  }
}

function localLogin(email, pass, showErr) {
  var accounts = {};
  try { accounts = JSON.parse(localStorage.getItem('bp_accounts') || '{}'); } catch(e){}
  var saved = accounts[email];

  if(!saved) {
    showErr('No account found for this email. Please register first.');
    return false;
  }
  if(saved.pass !== pass) {
    showErr('Wrong password. Please try again.', document.getElementById('login-pass'));
    return false;
  }
  CURRENT_USER.name     = saved.name     || email.split('@')[0];
  CURRENT_USER.email    = email;
  CURRENT_USER.classNum = saved.classNum || '6';
  CURRENT_USER.streak   = saved.streak   || 0;
  CURRENT_USER.badges   = saved.badges   || 0;
  CURRENT_USER.stars    = saved.stars    || 0;
  CURRENT_USER.progress = saved.progress || {};
  saveUserLocal();
  onLoginSuccess();
  return true;
}

function doRegister() {
  var nameEl        = document.getElementById('rg-name');
  var emailEl       = document.getElementById('rg-email');
  var passEl        = document.getElementById('rg-pass');
  var clsEl         = document.getElementById('rg-class');
  var parentEmailEl = document.getElementById('rg-parent-email');

  var name        = nameEl        ? nameEl.value.trim()        : '';
  var email       = emailEl       ? emailEl.value.trim()       : '';
  var pass        = passEl        ? passEl.value.trim()        : '';
  var cls         = clsEl         ? clsEl.value.trim()         : '6';
  var parentEmail = parentEmailEl ? parentEmailEl.value.trim() : '';
  var pills       = Array.from(document.querySelectorAll('.rg-pill.on')).map(function(p){ return p.dataset.val || p.textContent.trim(); });
  var learningStyle = pills.join(', ');
  var btn = document.querySelector('#s-register .btn-full, #s-register button[type="submit"], #rg-submit-btn');

  if(!name || !email || !pass || !cls || !parentEmail || pills.length === 0) {
    alert('⚠️ Please complete all required fields before continuing.');
    RG.goStep(2);
    return;
  }

  var classNum = parseInt(cls.replace('Class ',''), 10);

  function resetRegBtn() { if(btn) { btn.textContent='Create My Account ✨'; btn.disabled=false; } }
  function showRegErr(msg) {
    var errEl = document.getElementById('rg-error');
    if(errEl) { errEl.innerHTML='⚠️ ' + msg; errEl.style.display='block'; }
    else alert(msg);
  }

  if(btn) { btn.textContent='Creating account…'; btn.disabled=true; }

  fetch(AUTH_API_URL + '/signup', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      name: name,
      email: email,
      password: pass,
      role: 'student',
      class: classNum,
      learningStyle: learningStyle,
      parentEmail: parentEmail
    })
  })
  .then(function(r){ return r.json().then(function(data){ return {status:r.status, data:data}; }); })
  .then(function(res){
    resetRegBtn();
    if(res.status !== 201){
      showRegErr(res.data.error || 'Registration failed. Please try again.');
      return;
    }
    var data = res.data;
    localStorage.setItem('bp_token', data.token);
    CURRENT_USER.id            = data.user.id;
    CURRENT_USER.name          = data.user.name;
    CURRENT_USER.email         = data.user.email;
    CURRENT_USER.role          = data.user.role;
    CURRENT_USER.classNum      = data.user.class ? String(data.user.class) : '6';
    CURRENT_USER.parentEmail   = parentEmail;
    CURRENT_USER.learningStyle = data.user.learningStyle || learningStyle;
    CURRENT_USER.streak        = 0;
    CURRENT_USER.badges        = 0;
    CURRENT_USER.stars         = 0;
    CURRENT_USER.progress      = {};
    CURRENT_USER.prefs = CURRENT_USER.prefs || {};
    CURRENT_USER.prefs.dyslexia = pills.indexOf('Dyslexia') !== -1;

    rgClearProgress();
    saveUserLocal();
    onLoginSuccessAfterRegister();
  })
  .catch(function(err){
    resetRegBtn();
    showRegErr('Network error. Please check your connection and try again.');
  });
}
  var nameEl        = document.getElementById('rg-name');
  var emailEl       = document.getElementById('rg-email');
  var passEl        = document.getElementById('rg-pass');
  var clsEl         = document.getElementById('rg-class');
  var parentEmailEl = document.getElementById('rg-parent-email');

  var name        = nameEl        ? nameEl.value.trim()        : '';
  var email       = emailEl       ? emailEl.value.trim()       : '';
  var pass        = passEl        ? passEl.value.trim()        : '';
  var cls         = clsEl         ? clsEl.value.trim()         : '6';
  var parentEmail = parentEmailEl ? parentEmailEl.value.trim() : '';
  var pills       = Array.from(document.querySelectorAll('.rg-pill.on')).map(function(p){ return p.dataset.val || p.textContent.trim(); });
  var learningStyle = pills.join(', ');
  var btn = document.querySelector('#s-register .btn-full, #s-register button[type="submit"], #rg-submit-btn');

  // Final safety validation (shouldn't reach here without passing step 2, but just in case)
  if(!name || !email || !pass || !cls || !parentEmail || pills.length === 0) {
    alert('⚠️ Please complete all required fields before continuing.');
    RG.goStep(2);
    return;
  }

  CURRENT_USER.name         = name;
  CURRENT_USER.email        = email;
  CURRENT_USER.classNum     = cls.replace('Class ','');
  CURRENT_USER.parentEmail  = parentEmail;
  CURRENT_USER.learningStyle= learningStyle;
  CURRENT_USER.streak       = 0;
  CURRENT_USER.badges       = 0;
  CURRENT_USER.stars        = 0;
  CURRENT_USER.progress     = {};

  // If the student picked "Dyslexia" as a learning style during signup,
  // switch the dyslexia-friendly font on by default. They can still turn
  // it off later in My Profile — this just sets a sensible starting point.
  CURRENT_USER.prefs = CURRENT_USER.prefs || {};
  CURRENT_USER.prefs.dyslexia = pills.indexOf('Dyslexia') !== -1;

  // Save to localStorage
  try {
    var accounts = JSON.parse(localStorage.getItem('bp_accounts') || '{}');
    accounts[email] = Object.assign({}, CURRENT_USER, { pass: pass });
    localStorage.setItem('bp_accounts', JSON.stringify(accounts));
  } catch(e){}

  // Clear the registration draft — no longer needed
  rgClearProgress();

  // Firebase sync if configured
  function resetRegBtn() { if(btn) { btn.textContent='Create My Account ✨'; btn.disabled=false; } }

  loadFirebase(function() {
    if(!fbAuth || FB_CONFIG.apiKey === 'YOUR_API_KEY') { saveUserLocal(); onLoginSuccessAfterRegister(); return; }
    try {
      fbAuth.createUserWithEmailAndPassword(email, pass)
        .then(function(cred) {
          CURRENT_USER.uid = cred.user.uid;
          return fbDb.collection('users').doc(cred.user.uid).set({
            name: name, email: email, classNum: CURRENT_USER.classNum,
            parentEmail: parentEmail, learningStyle: learningStyle,
            streak: 0, badges: 0, stars: 0, progress: {}
          });
        })
        .then(function() { saveUserLocal(); onLoginSuccessAfterRegister(); })
        .catch(function(err) {
          resetRegBtn();
          var errEl = document.getElementById('rg-error');
          if(errEl) { errEl.innerHTML='\u26a0\ufe0f Registration failed: ' + (err.message||'Please try again.'); errEl.style.display='block'; }
          else alert('Registration failed: ' + (err.message||'Please try again.'));
        });
    } catch(e) {
      resetRegBtn();
      alert('Registration error. Please try again.');
    }
  });
}

function onLoginSuccess() {
  updateStreak();
  if(!currentRole) currentRole = 'child';
  var map = { child:'s-child', parent:'s-parent', teacher:'s-teacher', admin:'s-admin' };
  if(currentRole === 'child') {
    applyClassFilter(CURRENT_USER.classNum || '6');
    updateHomeUI();
  }
  if(currentRole === 'parent' && typeof updateParentUI === 'function'){
    updateParentUI();
  }
  showScreen(map[currentRole] || 's-child');
}

function onLoginSuccessAfterRegister() {
  updateStreak();
  if(!currentRole) currentRole = 'child';
  var map = { child:'s-child', parent:'s-parent', teacher:'s-teacher', admin:'s-admin' };
  if(currentRole === 'child') {
    applyClassFilter(CURRENT_USER.classNum || '6');
    updateHomeUI();
  }
  showScreen(map[currentRole] || 's-child');
  if(currentRole === 'child' && !CURRENT_USER.onboardingTestDone && typeof openLevelTest === 'function'){
    LVL_TEST_STATE.isOnboarding = true;
    openLevelTest(1, null);
  }
}

(function() {
  if(loadUserLocal()) {
    // User was logged in before — silently restore (don't auto-navigate, just pre-fill)
    currentChildClass = CURRENT_USER.classNum || '6';
  }
})();
