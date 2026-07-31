function getGamifiedSubtopics(){
  // All sub-topics of the CURRENT chapter that have gamified content, for the tab strip.
  if(!currentSubject || !lcCtx || lcCtx.chIdx<0) return [lcCtx ? lcCtx.displayTopic : null].filter(Boolean);
  var ch = currentSubject.data.chapters[lcCtx.chIdx];
  return ch.t.filter(function(t){ return !!GAMIFIED_NOTES[resolveContentKey(t, lcCtx.chapterName)]; });
}

var gnState = { topic:null, levelIdx:0, points:0, answered:false, unlocked:[true], levelResults:[null] };

function renderLCNotes(){
  var topic = lcCtx.topic;
  if(!GAMIFIED_NOTES[topic]){
    renderLCNotesGeneric();
    return;
  }
  gnInitTopic(topic);
  gnRender();
}

var SESSION_MINUTES = { '15 min bursts': 15, '30 min sessions': 30, 'No limit': 0 };

var _sessionTimer = null, _sessionStartedAt = null;

function gnInitTopic(topic){
  gnState.topic = topic;
  gnState.answered = false;
  var key = 'gn_progress_'+currentChildClass+'_'+(lcCtx.chapterName||'')+'_'+topic;
  var saved = (CURRENT_USER.gnProgress && CURRENT_USER.gnProgress[key]) || null;
  var numLevels = GAMIFIED_NOTES[topic].levels.length;
  gnState.unlocked = saved ? saved.unlocked.slice() : [true].concat(new Array(numLevels-1).fill(false));
  gnState.points = saved ? (saved.points||0) : 0;
  gnState.levelResults = saved && saved.levelResults ? saved.levelResults.slice() : new Array(numLevels).fill(null); // true=correct, false=wrong, null=unanswered
  gnState.storageKey = key;
  // Resume at the first level that's unlocked but not yet completed (i.e. the next one after it is locked)
  var resumeIdx = 0;
  for(var i=0;i<numLevels;i++){
    if(gnState.unlocked[i]) resumeIdx = i;
  }
  gnState.levelIdx = resumeIdx;
  gnStartSessionTimer();
}

function gnStartSessionTimer(){
  if(_sessionTimer) clearTimeout(_sessionTimer);
  var pref = (CURRENT_USER && CURRENT_USER.prefs && CURRENT_USER.prefs.session) || '15 min bursts';
  var mins = SESSION_MINUTES[pref];
  _sessionStartedAt = Date.now();
  if(!mins) return; // 'No limit'
  _sessionTimer = setTimeout(gnShowBreakPrompt, mins*60*1000);
}

function gnShowBreakPrompt(){
  if(document.querySelector('.gn-break-overlay')) return;
  var overlay = document.createElement('div');
  overlay.className = 'gn-complete-overlay gn-break-overlay';
  overlay.innerHTML = '<div class="gn-complete-card">'+
    '<span class="gc-emoji">🧘</span>'+
    '<h3>Time for a quick break!</h3>'+
    '<p>You have been studying for a while. A short stretch break helps your brain remember more.</p>'+
    '<button id="gn-break-continue">Keep Studying</button>'+
  '</div>';
  document.body.appendChild(overlay);
  document.getElementById('gn-break-continue').addEventListener('click', function(){
    overlay.remove();
    gnStartSessionTimer(); // restart the countdown for the next break
  });
}

function gnSaveProgress(){
  CURRENT_USER.gnProgress = CURRENT_USER.gnProgress || {};
  CURRENT_USER.gnProgress[gnState.storageKey] = { unlocked: gnState.unlocked, points: gnState.points, levelResults: gnState.levelResults };
  saveUserLocal();
}

function gnSwitchSubtopic(topic){
  gnInitTopic(resolveContentKey(topic, lcCtx.chapterName));
  gnRender();
}

function gnRender(){
  var topic = gnState.topic;
  var data = GAMIFIED_NOTES[topic];
  var subtopics = getGamifiedSubtopics();

  var tabsHtml = subtopics.length > 1 ? '<div class="gn-subtopic-tabs">' + subtopics.map(function(t){
    var done = isSubtopicFullyDone(t);
    var tKey = resolveContentKey(t, lcCtx.chapterName);
    return '<button class="gn-subtopic-tab'+(tKey===topic?' active':'')+'" onclick="gnSwitchSubtopic(\''+t.replace(/'/g,"\\'")+'\')">'+(done?'<span class="gst-done">✅</span> ':'')+t+'</button>';
  }).join('') + '</div>' : '';

  var mapHtml = '<div class="gn-map">' + data.levels.map(function(lv, i){
    var isCurrent = i===gnState.levelIdx;
    var isCompleted = gnState.levelResults[i] !== null && gnState.levelResults[i] !== undefined;
    var cls = !gnState.unlocked[i] ? 'locked' : (isCurrent && !isCompleted ? 'current' : 'done');
    var icon = cls==='done' ? '✅' : (cls==='locked' ? '🔒' : (i+1));
    return '<div class="gn-node '+cls+'" onclick="'+(gnState.unlocked[i] ? 'gnGoToLevel('+i+')' : '')+'">'+
      '<div class="gn-node-circle">'+icon+'</div>'+
      '<div class="gn-node-label">Level '+(i+1)+'</div>'+
    '</div>';
  }).join('') + '</div>';

  var html = '<div class="gn-wrap">'+
    '<div class="gn-header">'+
      '<div class="gn-points"><span class="gp-icon">⭐</span> '+gnState.points+' points</div>'+
    '</div>'+
    tabsHtml +
    mapHtml +
    '<div id="gn-level-slot"></div>'+
  '</div>';

  document.getElementById('lc-pane-notes').innerHTML = html;
  gnRenderLevel();
}

function isSubtopicFullyDone(topic){
  var contentKey = resolveContentKey(topic, lcCtx.chapterName);
  var key = 'gn_progress_'+currentChildClass+'_'+(lcCtx.chapterName||'')+'_'+contentKey;
  var saved = CURRENT_USER.gnProgress && CURRENT_USER.gnProgress[key];
  if(!saved || !saved.levelResults) return false;
  var numLevels = GAMIFIED_NOTES[contentKey].levels.length;
  if(saved.levelResults.length !== numLevels) return false;
  return saved.levelResults.every(function(r){ return r !== null && r !== undefined; });
}

function gnGoToLevel(i){
  if(!gnState.unlocked[i]) return;
  gnState.levelIdx = i;
  gnState.answered = false;
  gnRender();
}

var PACING = {
  'Slow & steady': { minReadSecs: 12, raRateIdx: 0 },
  'Balanced':       { minReadSecs: 6,  raRateIdx: 1 },
  'Fast-paced':     { minReadSecs: 0,  raRateIdx: 2 }
};

function currentPacing(){
  var key = (CURRENT_USER && CURRENT_USER.prefs && CURRENT_USER.prefs.pace) || 'Slow & steady';
  return PACING[key] || PACING['Slow & steady'];
}

function applyExplanationStyle(bodyHtml, miaLine, style){
  style = style || (CURRENT_USER && CURRENT_USER.prefs && CURRENT_USER.prefs.style) || 'Visual with pictures';

  if(style === 'Text-based'){
    // Strip diagrams/SVGs so the explanation is dense text only, no visuals.
    var stripped = bodyHtml.replace(/<div[^>]*style=['"]text-align:center[^"]*['"][^>]*>[\s\S]*?<\/svg>[\s\S]*?<\/div>/g, '');
    stripped = stripped.replace(/<svg[\s\S]*?<\/svg>/g, '');
    return '<div class="gn-style-textbased">'+stripped+'</div>';
  }

  if(style === 'Story-based'){
    // Reframe the same content as a narrated story beat, using Mia's line
    // as the story opener instead of a separate intro bubble.
    var opener = miaLine ? '<p class="gn-story-opener">📖 '+miaLine+'</p>' : '';
    return '<div class="gn-style-story">'+opener+bodyHtml+'</div>';
  }

  // Default: 'Visual with pictures' — render exactly as authored.
  return bodyHtml;
}

function gnRenderLevel(){
  var data = GAMIFIED_NOTES[gnState.topic];
  var lv = data.levels[gnState.levelIdx];
  var isLast = gnState.levelIdx === data.levels.length - 1;
  var alreadyDone = gnState.levelResults[gnState.levelIdx] !== null && gnState.levelResults[gnState.levelIdx] !== undefined;

  var checkHtml = gnRenderCheck(lv.check, alreadyDone);
  var explStyle = (CURRENT_USER && CURRENT_USER.prefs && CURRENT_USER.prefs.style) || 'Visual with pictures';
  // Story-based folds Mia's line into the body itself, so skip the separate intro bubble to avoid repeating it.
  var miaIntro = (lv.mia && explStyle !== 'Story-based') ? miaSay(lv.mia) : '';
  var styledBody = applyExplanationStyle(lv.body, lv.mia, explStyle);
  var miaReactHtml = '<div id="gn-mia-react"></div>';
  if(alreadyDone){
    var wasCorrect = gnState.levelResults[gnState.levelIdx];
    var reactLine = (wasCorrect===false && lv.miaTry) ? lv.miaTry : (lv.miaWin || '');
    if(reactLine) miaReactHtml = '<div id="gn-mia-react">'+miaSay(reactLine, {mini:true})+'</div>';
  }

  // Lesson pace: give the student a minimum moment with new material before
  // Next unlocks (only applies when there's no quick-check gating it already).
  var pacing = currentPacing();
  var needsPaceWait = !lv.check && !alreadyDone && pacing.minReadSecs > 0;
  var nextDisabled = alreadyDone ? '' : 'disabled';
  var paceHintHtml = '';
  if(needsPaceWait){
    nextDisabled = 'disabled';
    paceHintHtml = '<div class="gn-pace-hint" id="gn-pace-hint">⏳ Take a moment with this — Next unlocks in <span id="gn-pace-secs">'+pacing.minReadSecs+'</span>s</div>';
  }

  var html = '<div class="gn-level-card">'+
    '<div class="gn-level-tag">🎯 Level '+(gnState.levelIdx+1)+' of '+data.levels.length+'</div>'+
    miaIntro+
    '<h3>'+lv.title+'</h3>'+
    styledBody+
    checkHtml+
    miaReactHtml+
    paceHintHtml+
    '<div class="gn-level-nav">'+
      '<button class="gn-btn-back" onclick="gnGoToLevel('+Math.max(0,gnState.levelIdx-1)+')" '+(gnState.levelIdx===0?'style="visibility:hidden;"':'')+'>← Back</button>'+
      '<button class="gn-btn-next" id="gn-next-btn" onclick="gnNextLevel()" '+nextDisabled+'>'+(isLast ? '🏁 Finish Topic' : 'Next Level →')+'</button>'+
    '</div>'+
  '</div>';

  document.getElementById('gn-level-slot').innerHTML = html;

  // Sync Read Aloud's default speed to the chosen pace (student can still override RA's own speed control).
  if(typeof RA !== 'undefined') RA.rateIdx = pacing.raRateIdx;

  if(needsPaceWait) gnStartPaceTimer(pacing.minReadSecs);

  updateFocusProgress(gnState.levelIdx + 1, data.levels.length);
}

var _gnPaceTimer = null;

function gnStartPaceTimer(secs){
  if(_gnPaceTimer) clearInterval(_gnPaceTimer);
  var remaining = secs;
  _gnPaceTimer = setInterval(function(){
    remaining--;
    var secsEl = document.getElementById('gn-pace-secs');
    if(secsEl) secsEl.textContent = Math.max(0,remaining);
    if(remaining <= 0){
      clearInterval(_gnPaceTimer);
      _gnPaceTimer = null;
      var hint = document.getElementById('gn-pace-hint');
      if(hint) hint.remove();
      var btn = document.getElementById('gn-next-btn');
      if(btn) btn.disabled = false;
    }
  }, 1000);
}

function gnRenderCheck(check, alreadyDone){
  if(check.type==='mcq'){
    var opts = check.opts.map(function(opt,i){
      var cls = alreadyDone ? (i===check.correct ? 'gn-opt correct' : 'gn-opt') : 'gn-opt';
      return '<button class="'+cls+'" '+(alreadyDone?'disabled':'')+' onclick="gnAnswerMCQ(this,'+i+','+check.correct+')">'+String.fromCharCode(65+i)+') '+opt+'</button>';
    }).join('');
    return '<div class="gn-check">'+
      '<div class="gn-check-label">🧠 Quick Check</div>'+
      '<div class="gn-check-q">'+check.q+'</div>'+
      '<div class="gn-opts">'+opts+'</div>'+
      '<div class="gn-feedback'+(alreadyDone?' show ok':'')+'" id="gn-feedback">'+(alreadyDone?'✅ '+check.explain:'')+'</div>'+
    '</div>';
  }
  if(check.type==='fillblank'){
    return '<div class="gn-check">'+
      '<div class="gn-check-label">✏️ Fill in the Blank</div>'+
      '<div class="gn-check-q">'+check.q+'</div>'+
      '<div class="gn-blank-row"><input type="text" class="gn-blank-input" id="gn-blank-input" '+(alreadyDone?'disabled':'')+' placeholder="?"/>'+
        (alreadyDone?'':'<button class="gn-blank-btn" onclick="gnAnswerBlank()">Check</button>')+
      '</div>'+
      '<div class="gn-feedback'+(alreadyDone?' show ok':'')+'" id="gn-feedback">'+(alreadyDone?'✅ '+check.explain:'')+'</div>'+
    '</div>';
  }
  if(check.type==='reveal'){
    return '<div class="gn-check">'+
      '<div class="gn-check-label">👀 Tap to Reveal</div>'+
      '<div class="gn-check-q">'+check.q+'</div>'+
      '<div class="gn-reveal-card'+(alreadyDone?' flipped':'')+'" id="gn-reveal-card" onclick="gnReveal()">'+(alreadyDone?'✅ '+check.answer:'Tap here to see the answer')+'</div>'+
    '</div>';
  }
  return '';
}

function gnAwardAndUnlockNext(){
  gnState.points += 10;
  var numLevels = GAMIFIED_NOTES[gnState.topic].levels.length;
  if(gnState.levelIdx+1 < numLevels){
    gnState.unlocked[gnState.levelIdx+1] = true;
  }
  gnSaveProgress();
  addStars(2);
  gnPointsFx(10);
}

function gnPointsFx(amount){
  var pill = document.querySelector('.gn-points');
  if(!pill) return;
  var icon = pill.querySelector('.gp-icon');
  if(icon) icon.textContent = '⭐';
  pill.classList.remove('bump');
  void pill.offsetWidth; // restart animation if triggered rapidly
  pill.classList.add('bump');
  setTimeout(function(){ pill.classList.remove('bump'); }, 300);

  var float = document.createElement('span');
  float.className = 'gn-pts-float';
  float.textContent = '+'+amount;
  float.style.left = '50%';
  float.style.top = '-4px';
  pill.appendChild(float);
  setTimeout(function(){ if(float.parentNode) float.parentNode.removeChild(float); }, 1200);

  // also refresh the visible points number immediately
  pill.childNodes.forEach(function(node){
    if(node.nodeType===3){ node.textContent = ' ' + gnState.points + ' points'; }
  });
}

function gnAnswerMCQ(btn, chosen, correct){
  var opts = btn.parentElement.querySelectorAll('.gn-opt');
  if(opts[0].disabled) return; // already answered
  opts.forEach(function(o){ o.disabled = true; });
  var fb = document.getElementById('gn-feedback');
  var lv = GAMIFIED_NOTES[gnState.topic].levels[gnState.levelIdx];
  var reactSlot = document.getElementById('gn-mia-react');
  if(chosen===correct){
    btn.classList.add('correct');
    fb.className = 'gn-feedback show ok';
    fb.textContent = '✅ Correct! ' + lv.check.explain;
    gnState.levelResults[gnState.levelIdx] = true;
    gnAwardAndUnlockNext();
    if(reactSlot && lv.miaWin) reactSlot.innerHTML = miaSay(lv.miaWin, {mini:true});
    document.getElementById('gn-next-btn').disabled = false;
  } else {
    btn.classList.add('wrong');
    opts[correct].classList.add('correct');
    fb.className = 'gn-feedback show no';
    fb.textContent = '🤔 Not quite — the correct answer is highlighted. ' + lv.check.explain;
    gnState.levelResults[gnState.levelIdx] = false;
    if(gnState.levelIdx+1 < GAMIFIED_NOTES[gnState.topic].levels.length){
      gnState.unlocked[gnState.levelIdx+1] = true; // still let them move on after seeing the explanation
    }
    gnSaveProgress();
    if(reactSlot && lv.miaTry) reactSlot.innerHTML = miaSay(lv.miaTry, {mini:true});
    document.getElementById('gn-next-btn').disabled = false;
  }
}

function gnAnswerBlank(){
  var lv = GAMIFIED_NOTES[gnState.topic].levels[gnState.levelIdx];
  var correctAns = lv.check.answer;
  var explain = lv.check.explain || '';
  var input = document.getElementById('gn-blank-input');
  var val = input.value.trim().replace(/,/g,'');
  var fb = document.getElementById('gn-feedback');
  var reactSlot = document.getElementById('gn-mia-react');
  input.disabled = true;
  if(val.toLowerCase() === correctAns.toLowerCase()){
    fb.className = 'gn-feedback show ok';
    fb.textContent = '✅ Correct! ' + explain;
    gnState.levelResults[gnState.levelIdx] = true;
    gnAwardAndUnlockNext();
    if(reactSlot && lv.miaWin) reactSlot.innerHTML = miaSay(lv.miaWin, {mini:true});
  } else {
    fb.className = 'gn-feedback show no';
    fb.textContent = '🤔 Close! The answer is '+correctAns+'. ' + explain;
    gnState.levelResults[gnState.levelIdx] = false;
    if(gnState.levelIdx+1 < GAMIFIED_NOTES[gnState.topic].levels.length){
      gnState.unlocked[gnState.levelIdx+1] = true;
    }
    gnSaveProgress();
    if(reactSlot && lv.miaTry) reactSlot.innerHTML = miaSay(lv.miaTry, {mini:true});
  }
  document.getElementById('gn-next-btn').disabled = false;
}

function gnReveal(){
  var card = document.getElementById('gn-reveal-card');
  if(card.classList.contains('flipped')) return;
  var lv = GAMIFIED_NOTES[gnState.topic].levels[gnState.levelIdx];
  var answer = lv.check.answer;
  card.classList.add('flipped');
  card.textContent = '✅ ' + answer;
  gnState.levelResults[gnState.levelIdx] = true;
  gnAwardAndUnlockNext();
  var reactSlot = document.getElementById('gn-mia-react');
  if(reactSlot && lv.miaWin) reactSlot.innerHTML = miaSay(lv.miaWin, {mini:true});
  document.getElementById('gn-next-btn').disabled = false;
}

function gnNextLevel(){
  var data = GAMIFIED_NOTES[gnState.topic];
  var isLast = gnState.levelIdx === data.levels.length - 1;
  if(isLast){
    gnShowComplete();
    return;
  }
  gnState.levelIdx++;
  gnRender();
}

function gnShowComplete(){
  var overlay = document.createElement('div');
  overlay.className = 'gn-complete-overlay';
  overlay.innerHTML = '<div class="gn-complete-card">'+
    '<span class="gc-emoji">🎉</span>'+
    '<h3>Topic Complete!</h3>'+
    '<p>You finished all levels of "'+gnState.topic+'"</p>'+
    '<div class="gn-complete-pts">+'+gnState.points+' points</div>'+
    '<button onclick="this.closest(\'.gn-complete-overlay\').remove()">Awesome! 🌟</button>'+
  '</div>';
  document.body.appendChild(overlay);
  gnSpawnConfetti(overlay);
  showToast('🏆 Topic mastered! Great job!');
}

function gnSpawnConfetti(overlay){
  var colors = ['var(--sun)','var(--plum)','var(--leaf)','var(--rose)','var(--sky)'];
  var count = 36;
  for(var i=0;i<count;i++){
    var piece = document.createElement('div');
    piece.className = 'gn-confetti-piece';
    var size = 6 + Math.random()*6;
    piece.style.width = size+'px';
    piece.style.height = (size*0.4)+'px';
    piece.style.left = (Math.random()*100)+'%';
    piece.style.background = colors[Math.floor(Math.random()*colors.length)];
    piece.style.animationDuration = (1.6 + Math.random()*1.4)+'s';
    piece.style.animationDelay = (Math.random()*0.4)+'s';
    overlay.appendChild(piece);
  }
}

function renderLCNotesGeneric(){
  var topic = lcCtx.displayTopic || lcCtx.topic, chapter = lcCtx.chapterName, subject = lcCtx.subject;
  var html =
    '<div class="lc-notes-card">'+
      '<h3>📝 '+topic+'</h3>'+
      '<p><em>Chapter: '+chapter+' · '+subject+'</em></p>'+
      '<p>This is placeholder study material for <b>'+topic+'</b>. Replace this section with real NCERT-based notes — definitions, explanations, and worked examples for this sub-topic.</p>'+
      '<h4>Key Idea</h4>'+
      '<p>[Write the core concept of "'+topic+'" here in 2–3 simple sentences a Class '+currentChildClass+' student can follow.]</p>'+
      '<h4>Important Points</h4>'+
      '<ul>'+
        '<li>Point 1 about '+topic+' goes here</li>'+
        '<li>Point 2 — a rule, formula, or fact to remember</li>'+
        '<li>Point 3 — a common mistake to avoid</li>'+
      '</ul>'+
      '<h4>Worked Example</h4>'+
      '<p>[Insert a step-by-step example problem related to '+topic+'.]</p>'+
      '<div class="lc-key-box"><b>💡 Remember:</b> [Add one memorable tip or mnemonic for this topic.]</div>'+
    '</div>';
  document.getElementById('lc-pane-notes').innerHTML = html;
}

function renderLCVideo(){
  var topic = lcCtx.displayTopic || lcCtx.topic;
  var html =
    '<div class="lc-video-wrap">'+
      '<div class="lc-video-placeholder">'+
        '<div class="vp-icon">🎬</div>'+
        '<p>No video linked yet for "'+topic+'". Add a YouTube video ID in the topic\'s data to show it here automatically.</p>'+
      '</div>'+
      '<button class="tb-btn" onclick="sendChip ? null : null" style="pointer-events:none;opacity:.5;">▶ Play (connect a video first)</button>'+
    '</div>';
  document.getElementById('lc-pane-video').innerHTML = html;
}
