var MOOD_MAP = {
  happy:   { emoji:'😊', word:'Happy' },
  tired:   { emoji:'😴', word:'Tired' },
  anxious: { emoji:'😰', word:'Anxious' },
  excited: { emoji:'🤩', word:'Excited' },
  sad:     { emoji:'😢', word:'Sad' }
};

function todayStr(){ return new Date().toISOString().slice(0,10); }

function selMood(el){
  document.querySelectorAll('.mood-pill').forEach(function(m){ m.classList.remove('sel'); });
  el.classList.add('sel');
  var key = el.dataset.mood;
  if(key) logMood(key);
}

function restoreTodayMood(){
  var today = todayStr();
  var entry = (CURRENT_USER.moodHistory||[]).find(function(e){ return e.date===today; });
  document.querySelectorAll('.mood-pill').forEach(function(m){
    m.classList.toggle('sel', !!entry && m.dataset.mood===entry.mood);
  });
}

function logMood(key){
  var info = MOOD_MAP[key];
  if(!info) return;
  var today = todayStr();
  CURRENT_USER.moodHistory = CURRENT_USER.moodHistory || [];
  var alreadyLoggedToday = CURRENT_USER.moodHistory.some(function(e){ return e.date===today; });
  CURRENT_USER.moodHistory = CURRENT_USER.moodHistory.filter(function(e){ return e.date!==today; });
  CURRENT_USER.moodHistory.push({ date:today, mood:key, emoji:info.emoji, word:info.word, time:new Date().toISOString() });
  CURRENT_USER.todayMood = key;
  saveUserLocal();
  if(fbDb && CURRENT_USER.uid){
    fbDb.collection('users').doc(CURRENT_USER.uid).update({ moodHistory: CURRENT_USER.moodHistory, todayMood: key }).catch(function(){});
  }
  if(!alreadyLoggedToday){
    addStars(5);
    showToast('⭐ +5 stars for checking in!');
  }
  suggestForMood(key);
}

function showMoodToast(message, actionLabel, actionFn){
  var t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#222;color:#fff;padding:14px 18px;border-radius:16px;font-weight:700;font-size:13px;z-index:9999;display:flex;align-items:center;gap:12px;max-width:90vw;box-shadow:0 8px 24px rgba(0,0,0,.25);';
  var span = document.createElement('span'); span.textContent = message; span.style.flex = '1';
  t.appendChild(span);
  if(actionLabel && actionFn){
    var btn = document.createElement('button');
    btn.textContent = actionLabel;
    btn.style.cssText = 'background:var(--sun);color:#fff;border:none;border-radius:50px;padding:7px 14px;font-weight:800;font-size:12px;cursor:pointer;white-space:nowrap;';
    btn.onclick = function(){ actionFn(); if(t.parentNode) t.remove(); };
    t.appendChild(btn);
  }
  document.body.appendChild(t);
  setTimeout(function(){ if(t.parentNode) t.remove(); }, 7000);
}

function goToBrainGames(gameName){
  showScreen('s-child');
  showPane('child','games');
  if(gameName) launchGame(gameName);
}

function continueTopSubject(){
  var firstBtn = document.querySelector('#home-continue-row .start-btn');
  if(firstBtn) firstBtn.click();
}

function suggestForMood(key){
  if(key==='happy')       showMoodToast('😊 Great mood! Ready to jump into a lesson?', 'Start Lesson', continueTopSubject);
  else if(key==='tired')  showMoodToast('😴 Feeling tired? A quick brain game can help you refocus first.', 'Quick Game', function(){ goToBrainGames(); });
  else if(key==='anxious')showMoodToast('😰 Let\'s take a moment to breathe before we start.', 'Calm Breathing', function(){ goToBrainGames('breathing'); });
  else if(key==='sad')    showMoodToast('😢 Sending you a hug — let\'s ease in gently today.', 'Continue Gently', continueTopSubject);
  else if(key==='excited')showMoodToast('🤩 Love the energy! Want a fun challenge?', 'Challenge Me', function(){ goToBrainGames('ninja'); });
}
