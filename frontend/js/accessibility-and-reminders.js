var dyslexiaOn=false, ttsOn=false;

function toggleDyslexia(){
  dyslexiaOn=!dyslexiaOn;
  document.body.style.fontFamily=dyslexiaOn?'"OpenDyslexic",var(--font)':'var(--font)';
  document.body.style.letterSpacing=dyslexiaOn?'0.05em':'';
  document.body.style.lineHeight=dyslexiaOn?'1.9':'';
  document.body.style.fontSize=dyslexiaOn?'17px':'';
  document.querySelectorAll('#dyslexia-toggle,.dyslexia-toggle-btn').forEach(function(btn){
    btn.style.background=dyslexiaOn?'var(--sun-light)':'';
    btn.style.color=dyslexiaOn?'var(--sun)':'';
    btn.style.borderColor=dyslexiaOn?'var(--sun)':'';
    btn.textContent=dyslexiaOn?'🔡 Dyslexia: ON':'🔡 Dyslexia Font';
  });
  if(typeof CURRENT_USER!=='undefined'){ CURRENT_USER.prefs=CURRENT_USER.prefs||{}; CURRENT_USER.prefs.dyslexia=dyslexiaOn; if(typeof saveUserLocal==='function') saveUserLocal(); }
  var cb=document.getElementById('acc-dyslexia'); if(cb) cb.checked=dyslexiaOn;
}

function renderProfileStats(){
  var u = CURRENT_USER;
  var elStreak = document.getElementById('stat-profile-streak');
  if(elStreak) elStreak.textContent = (u.streak || 0);
  var elTopics = document.getElementById('stat-profile-topics');
  if(elTopics) elTopics.textContent = Object.keys(u.completedTopics || {}).length;
  var elBadges = document.getElementById('stat-profile-badges');
  if(elBadges) elBadges.textContent = (u.badges || 0);
  var elStars = document.getElementById('stat-profile-stars');
  if(elStars) elStars.textContent = (u.stars || 0);
}

function syncProfileControls(){
  var p = (typeof CURRENT_USER!=='undefined' && CURRENT_USER.prefs) ? CURRENT_USER.prefs : {};
  var elPace=document.getElementById('pref-pace'); if(elPace && p.pace) elPace.value=p.pace;
  var elStyle=document.getElementById('pref-style'); if(elStyle && p.style) elStyle.value=p.style;
  var elSession=document.getElementById('pref-session'); if(elSession && p.session) elSession.value=p.session;
  var elReminder=document.getElementById('pref-reminder'); if(elReminder && p.reminder) elReminder.value=p.reminder;

  if(p.dyslexia && !dyslexiaOn) toggleDyslexia(); else { var cd=document.getElementById('acc-dyslexia'); if(cd) cd.checked=dyslexiaOn; }
  var note=document.getElementById('acc-dyslexia-note');
  if(note){
    var style = (typeof CURRENT_USER!=='undefined' && CURRENT_USER.learningStyle) ? CURRENT_USER.learningStyle : '';
    note.style.display = style.indexOf('Dyslexia') !== -1 ? 'block' : 'none';
  }
}

function wireProfileControls(){
  var pace=document.getElementById('pref-pace');
  if(pace && !pace.dataset.wired){ pace.dataset.wired='1'; pace.addEventListener('change',function(){ CURRENT_USER.prefs.pace=this.value; saveUserLocal(); }); }
  var style=document.getElementById('pref-style');
  if(style && !style.dataset.wired){ style.dataset.wired='1'; style.addEventListener('change',function(){
    CURRENT_USER.prefs.style=this.value;
    saveUserLocal();
    // If a lesson is currently open, re-render it now so the new style is visible immediately.
    if(typeof gnState!=='undefined' && gnState.topic && document.getElementById('gn-level-slot')) gnRenderLevel();
  }); }
  var session=document.getElementById('pref-session');
  if(session && !session.dataset.wired){ session.dataset.wired='1'; session.addEventListener('change',function(){
    CURRENT_USER.prefs.session=this.value;
    saveUserLocal();
    if(typeof gnStartSessionTimer==='function') gnStartSessionTimer(); // apply new session length right away
  }); }
  var reminder=document.getElementById('pref-reminder');
  if(reminder && !reminder.dataset.wired){ reminder.dataset.wired='1'; reminder.addEventListener('change',function(){
    CURRENT_USER.prefs.reminder=this.value;
    saveUserLocal();
    scheduleReminder();
  }); }

  var accD=document.getElementById('acc-dyslexia');
  if(accD && !accD.dataset.wired){ accD.dataset.wired='1'; accD.addEventListener('change',toggleDyslexia); }
  syncProfileControls();
  renderProfileStats();
  scheduleReminder();
}

var _reminderTimer = null;

function scheduleReminder(){
  if(_reminderTimer) clearTimeout(_reminderTimer);
  var p = CURRENT_USER && CURRENT_USER.prefs;
  if(!p || p.pauseReminders) return;
  var timeStr = p.reminder || '16:00';
  var parts = timeStr.split(':');
  var hh = parseInt(parts[0],10), mm = parseInt(parts[1],10);
  if(isNaN(hh) || isNaN(mm)) return;

  var now = new Date();
  var target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);
  if(target <= now) target.setDate(target.getDate()+1); // next occurrence if time already passed today
  var msUntil = target - now;

  _reminderTimer = setTimeout(function(){
    fireReminder();
    scheduleReminder(); // queue up tomorrow's reminder
  }, msUntil);
}

function fireReminder(){
  var name = (CURRENT_USER && CURRENT_USER.name) ? CURRENT_USER.name.split(' ')[0] : 'there';
  var msg = 'Hi '+name+'! It is time for your daily BrightPath study session. 🌟';
  if(typeof Notification !== 'undefined' && Notification.permission === 'granted'){
    new Notification('BrightPath Study Reminder', { body: msg });
  } else if(typeof Notification !== 'undefined' && Notification.permission !== 'denied'){
    Notification.requestPermission().then(function(perm){
      if(perm === 'granted') new Notification('BrightPath Study Reminder', { body: msg });
      else showInAppReminderBanner(msg);
    });
  } else {
    showInAppReminderBanner(msg);
  }
}

function showInAppReminderBanner(msg){
  if(document.querySelector('.bp-reminder-banner')) return;
  var b = document.createElement('div');
  b.className = 'bp-reminder-banner';
  b.innerHTML = '<span>⏰ '+msg+'</span><button id="bp-reminder-dismiss">✕</button>';
  document.body.appendChild(b);
  document.getElementById('bp-reminder-dismiss').addEventListener('click', function(){ b.remove(); });
  setTimeout(function(){ if(b.parentNode) b.remove(); }, 15000);
}

function toggleTTS(){
  ttsOn=!ttsOn;
  document.querySelectorAll('#tts-toggle,.tts-toggle-btn').forEach(function(btn){
    btn.style.background=ttsOn?'var(--sky-light)':'';
    btn.style.color=ttsOn?'var(--sky)':'';
    btn.style.borderColor=ttsOn?'var(--sky)':'';
    btn.textContent=ttsOn?'🔊 Reading Aloud: ON':'🔊 Read Aloud';
  });
  if(typeof CURRENT_USER!=='undefined'){ CURRENT_USER.prefs=CURRENT_USER.prefs||{}; CURRENT_USER.prefs.tts=ttsOn; if(typeof saveUserLocal==='function') saveUserLocal(); }
  var cb=document.getElementById('acc-tts'); if(cb) cb.checked=ttsOn;
  if(ttsOn) speak('Text to speech is now on. I will read every message aloud.');
  else speechSynthesis.cancel();
}

function speak(text){
  if(!ttsOn)return;
  speechSynthesis.cancel();
  var u=new SpeechSynthesisUtterance(text.replace(/<[^>]*>/g,'').replace(/\*\*/g,''));
  u.rate=0.88;u.pitch=1.1;
  speechSynthesis.speak(u);
}
