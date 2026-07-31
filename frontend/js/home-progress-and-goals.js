function updateHomeUI() {
  var u = CURRENT_USER;
  u.prefs = u.prefs || { pace:'Slow & steady', style:'Visual with pictures', session:'15 min bursts', reminder:'16:00', dyslexia:false, tts:false };

  // Apply saved accessibility prefs app-wide (not just when the profile tab is open)
  if(u.prefs.dyslexia && !dyslexiaOn) toggleDyslexia();
  if(u.prefs.tts && !ttsOn) toggleTTS();
  if(typeof scheduleReminder === 'function') scheduleReminder();
  if(typeof studyTrackerStart === 'function' && !document.hidden) studyTrackerStart();
  if(typeof renderDailyGoal === 'function') renderDailyGoal();

  var hour = new Date().getHours();
  var greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  var firstName = u.name.split(' ')[0];

  // Greeting card
  var hg = document.getElementById('home-greeting');
  if(hg) hg.textContent = greet + ', ' + firstName + '! 👋';
  var hcb = document.getElementById('home-class-badge');
  if(hcb) hcb.textContent = u.classNum;
  var hs = document.getElementById('home-streak');
  if(hs) hs.textContent = u.streak;
  restoreTodayMood();

  // Stats
  var avgProg = 0, keys = Object.keys(u.progress);
  if(keys.length) { keys.forEach(function(k){ avgProg += (u.progress[k]||0); }); avgProg = Math.round(avgProg/keys.length); }
  var sp = document.getElementById('stat-progress'); if(sp) sp.textContent = avgProg + '%';
  var sb2 = document.getElementById('stat-badges');  if(sb2) sb2.textContent = '🏅 ' + u.badges;
  var ss = document.getElementById('stat-stars');   if(ss) ss.textContent = u.stars;
  var st = document.getElementById('stat-streak');  if(st) st.textContent = '🔥' + u.streak;

  // Sidebar
  var sbn = document.getElementById('sb-name'); if(sbn) sbn.textContent = u.name;
  var sbr = document.getElementById('sb-role'); if(sbr) sbr.textContent = 'Class ' + u.classNum;

  // My Profile pane — keep in sync with the same CURRENT_USER used by the sidebar
  var pn = document.getElementById('profile-name');  if(pn) pn.textContent = u.name;
  var pe = document.getElementById('profile-email'); if(pe) pe.textContent = u.email || '';
  var pc = document.getElementById('profile-class'); if(pc) pc.textContent = u.classNum;
  var pl = document.getElementById('profile-level'); if(pl) pl.textContent = 'Level ' + (u.currentLevel || 1);

  // Continue row — show top 3 subjects sorted by progress (lowest first = needs attention)
  var subjectMap = {
    maths:   { icon:'🔢', name:'Mathematics', color:'var(--sun)',  topic: u.classNum==='6'?'Knowing Numbers':u.classNum==='7'?'Fractions & Decimals':'Rational Numbers' },
    science: { icon:'🔬', name:'Science',     color:'var(--leaf)', topic: u.classNum==='6'?'Food & Living World':u.classNum==='7'?'Nutrition in Plants':'Crop Production' },
    english: { icon:'📖', name:'English',     color:'var(--plum)', topic: u.classNum==='6'?'Honeysuckle':u.classNum==='7'?'Honeycomb':'Honeydew' },
    sst:     { icon:'🌍', name:'Soc. Science',color:'var(--sky)',  topic: u.classNum==='6'?'The Earth: Our Habitat':u.classNum==='7'?'Our Pasts II':'Our Pasts III' },
    hindi:   { icon:'🇮🇳', name:'Hindi',      color:'var(--rose)', topic: u.classNum==='6'?'वसन्त भाग 1':u.classNum==='7'?'वसन्त भाग 2':'वसन्त भाग 3' }
  };
  var row = document.getElementById('home-continue-row');
  if(row) {
    var sorted = Object.keys(subjectMap).sort(function(a,b){ return (u.progress[a]||0)-(u.progress[b]||0); }).slice(0,3);
    row.innerHTML = sorted.map(function(key) {
      var s = subjectMap[key]; var pct = u.progress[key] || 0;
      return '<div class="subj" onclick="continueSubject(\''+key+'\')" style="border-top:5px solid '+s.color+';">' +
        '<div class="subj-top"><div class="subj-icon">'+s.icon+'</div><div><div class="subj-name">'+s.name+'</div><div class="subj-type">'+s.topic+'</div></div></div>' +
        '<div class="prog-bar"><div class="prog-fill" style="width:'+pct+'%;background:'+s.color+';"></div></div>' +
        '<div class="subj-footer"><span>'+pct+'% complete</span><button class="start-btn" style="background:'+s.color+';" onclick="event.stopPropagation();continueSubject(\''+key+'\')">Continue →</button></div>' +
        '</div>';
    }).join('');
  }
}

function continueSubject(subjKey){
  var data = NCERT_CHAPTERS[currentChildClass] && NCERT_CHAPTERS[currentChildClass][subjKey];
  if(!data){
    var s = { maths:'Mathematics', science:'Science', english:'English', sst:'Social Science', hindi:'Hindi' }[subjKey] || subjKey;
    openLesson(s, 'General', 'Adaptive');
    return;
  }

  currentSubject = { key: subjKey, profile: 'Adaptive', data: data };
  document.getElementById('chap-icon').textContent = data.icon;
  document.getElementById('chap-title').textContent = data.name;
  document.getElementById('chap-sub').textContent = 'Class '+currentChildClass+' · Pick a chapter to start learning';
  var prog = getChapterProgress(subjKey);
  renderChapters();

  var targetChIdx = -1, targetTIdx = -1;
  for(var ci=0; ci<data.chapters.length; ci++){
    var chPct = Math.round(prog[ci]||0);
    if(chPct>=100) continue; // whole chapter already done — skip to next chapter
    var ch = data.chapters[ci];
    for(var ti=0; ti<ch.t.length; ti++){
      var done = (CURRENT_USER.completedTopics||{})[currentChildClass+'_'+subjKey+'_'+ci+'_'+ti];
      if(!done){ targetChIdx = ci; targetTIdx = ti; break; }
    }
    if(targetChIdx>-1) break;
  }

  if(targetChIdx===-1){
    // Every chapter is at 100% — nothing left to continue, show chapter list.
    openSubjectChapters(subjKey, 'Adaptive');
    return;
  }

  var chosenCh = data.chapters[targetChIdx];
  var chosenTopic = chosenCh.t[targetTIdx];
  openLearningCenter(chosenTopic, chosenCh.n, data.name);
}

function updateProgress(subject, percent) {
  var key = subject.toLowerCase().replace('mathematics','maths').replace('social studies','sst').replace('soc. science','sst');
  CURRENT_USER.progress[key] = percent;
  saveUserLocal();
  // Sync to Firestore if logged in
  if(fbDb && CURRENT_USER.uid) {
    fbDb.collection('users').doc(CURRENT_USER.uid).update({ progress: CURRENT_USER.progress }).catch(function(){});
  }
  // Update progress bars in subjects pane
  document.querySelectorAll('.prog-fill').forEach(function(bar) {
    var card = bar.closest('.subj');
    if(card) {
      var nameEl = card.querySelector('.subj-name');
      if(nameEl) {
        var cardKey = nameEl.textContent.toLowerCase().replace('mathematics','maths').replace('social science','sst');
        if(cardKey === key) { bar.style.width = percent + '%'; }
      }
    }
  });
  // Refresh home pane stats
  updateHomeUI();
  // Award badge every 100% subject
  var done = Object.values(CURRENT_USER.progress).filter(function(v){ return v >= 100; }).length;
  if(done > CURRENT_USER.badges) {
    CURRENT_USER.badges = done;
    CURRENT_USER.stars += 50;
    saveUserLocal();
    showToast('🏅 Badge unlocked! Subject completed!');
  }
}

function addStars(n) {
  CURRENT_USER.stars += n;
  saveUserLocal();
  if(fbDb && CURRENT_USER.uid) {
    fbDb.collection('users').doc(CURRENT_USER.uid).update({ stars: CURRENT_USER.stars }).catch(function(){});
  }
  var ss = document.getElementById('stat-stars'); if(ss) ss.textContent = CURRENT_USER.stars;
}

function getDailyGoalState(){
  var u = CURRENT_USER;
  var today = new Date().toDateString();
  if(!u.dailyGoal || u.dailyGoal.date !== today){
    u.dailyGoal = { target: (u.dailyGoal && u.dailyGoal.target) || 3, count: 0, date: today };
    saveUserLocal();
  }
  return u.dailyGoal;
}

function incrementDailyGoal(){
  var goal = getDailyGoalState();
  goal.count = (goal.count || 0) + 1;
  saveUserLocal();
  renderDailyGoal();
}

function setDailyGoalTarget(val){
  var goal = getDailyGoalState();
  goal.target = parseInt(val, 10) || 3;
  saveUserLocal();
  renderDailyGoal();
}

function renderDailyGoal(){
  var goal = getDailyGoalState();
  var fill = document.getElementById('dg-bar-fill');
  var status = document.getElementById('dg-status');
  var select = document.getElementById('dg-target-select');
  if(select) select.value = String(goal.target);
  var pct = goal.target > 0 ? Math.min(100, Math.round((goal.count / goal.target) * 100)) : 0;
  if(fill) fill.style.width = pct + '%';
  if(status){
    if(goal.count >= goal.target){
      status.textContent = '🎉 Goal Completed!';
      status.classList.add('dg-complete');
    } else {
      status.textContent = goal.count + ' / ' + goal.target + ' lessons completed';
      status.classList.remove('dg-complete');
    }
  }
}

function updateStreak() {
  var today = new Date().toDateString();
  var last  = localStorage.getItem('bp_last_visit');
  var yesterday = new Date(Date.now() - 86400000).toDateString();
  if(last === today) return; // already counted today
  if(last === yesterday) { CURRENT_USER.streak++; }
  else if(last !== today) { CURRENT_USER.streak = 1; }
  localStorage.setItem('bp_last_visit', today);
  saveUserLocal();
}

function showToast(msg) {
  var t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#222;color:#fff;padding:10px 20px;border-radius:50px;font-weight:800;font-size:13px;z-index:9999;animation:fadeIn .3s;';
  document.body.appendChild(t);
  setTimeout(function(){ t.remove(); }, 3000);
}
