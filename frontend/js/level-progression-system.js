var LEVEL_GROUPS = [
  { level: 1, name: 'Numbers Foundations', chapters: ['Knowing Our Numbers', 'Whole Numbers', 'Playing with Numbers'],
    subs: [
      { id: '1a', name: 'Knowing Our Numbers', chapters: ['Knowing Our Numbers'] },
      { id: '1b', name: 'Whole Numbers', chapters: ['Whole Numbers'] },
      { id: '1c', name: 'Playing with Numbers', chapters: ['Playing with Numbers'] }
    ] },
  { level: 2, name: 'Shapes & Geometry Basics', chapters: ['Basic Geometrical Ideas', 'Understanding Elementary Shapes'],
    subs: [
      { id: '2a', name: 'Basic Geometrical Ideas', chapters: ['Basic Geometrical Ideas'] },
      { id: '2b', name: 'Understanding Elementary Shapes', chapters: ['Understanding Elementary Shapes'] }
    ] },
  { level: 3, name: 'Integers & Fractions', chapters: ['Integers', 'Fractions', 'Decimals'],
    subs: [
      { id: '3a', name: 'Integers', chapters: ['Integers'] },
      { id: '3b', name: 'Fractions', chapters: ['Fractions'] },
      { id: '3c', name: 'Decimals', chapters: ['Decimals'] }
    ] },
  { level: 4, name: 'Data & Application', chapters: ['Data Handling', 'Mensuration', 'Algebra'],
    subs: [
      { id: '4a', name: 'Data Handling', chapters: ['Data Handling'] },
      { id: '4b', name: 'Mensuration', chapters: ['Mensuration'] },
      { id: '4c', name: 'Algebra', chapters: ['Algebra'] }
    ] }
];

var SUB_TEST_SIZE = 8;

var LEVEL_TEST_SIZE = 15;

var LEVEL_PASS_PCT = 80;

var LEVEL_REVISE_PCT = 50;

function lcDupResolve(topic, chapterName){
  if(typeof resolveContentKey === 'function') return resolveContentKey(topic, chapterName);
  return topic;
}

function lvlChapterProgressPct(chapterName){
  var u = CURRENT_USER;
  if(u.progress && u.progress.chapters && typeof u.progress.chapters[chapterName] === 'number'){
    return u.progress.chapters[chapterName];
  }
  // Fallback: consider a chapter "started" credit if any quiz score was recorded for its topics
  return 0;
}

function lvlIsLevelUnlocked(levelNum){
  var u = CURRENT_USER;
  if(levelNum === 1) return true;
  var progressState = u.levelProgress || {};
  var prev = progressState[levelNum - 1];
  return !!(prev && prev.passed);
}

function lvlIsLevelComplete(levelNum){
  var u = CURRENT_USER;
  var progressState = u.levelProgress || {};
  return !!(progressState[levelNum] && progressState[levelNum].passed);
}

function subIsUnlocked(grp, subIdx){
  if(!lvlIsLevelUnlocked(grp.level)) return false;
  if(subIdx === 0) return true;
  var u = CURRENT_USER;
  var prevSub = grp.subs[subIdx - 1];
  var st = (u.subProgress || {})[prevSub.id];
  return !!(st && st.passed);
}

function subIsComplete(subId){
  var u = CURRENT_USER;
  var st = (u.subProgress || {})[subId];
  return !!(st && st.passed);
}

function lvlAllSubsComplete(grp){
  return grp.subs.every(function(s){ return subIsComplete(s.id); });
}

function syncParentLevelFromSubs(grp){
  var u = CURRENT_USER;
  if(!u.levelProgress) u.levelProgress = {};
  if(!u.levelProgress[grp.level]) u.levelProgress[grp.level] = {};
  if(lvlAllSubsComplete(grp)){
    var wasAlreadyPassed = u.levelProgress[grp.level].passed;
    u.levelProgress[grp.level].passed = true;
    if(!wasAlreadyPassed){
      var nextLevel = grp.level + 1;
      if(LEVEL_GROUPS.find(function(g){ return g.level === nextLevel; })) u.currentLevel = nextLevel;
    }
  }
}

function renderLevelProgression(){
  var u = CURRENT_USER;
  if(!u.levelProgress) u.levelProgress = {};
  if(!u.subProgress) u.subProgress = {};
  var listEl = document.getElementById('level-progression-list');
  if(!listEl) return;
  listEl.innerHTML = '';

  var currentLevel = u.currentLevel || 1;
  var rlNum = document.getElementById('rw-level-num'); if(rlNum) rlNum.textContent = currentLevel;

  LEVEL_GROUPS.forEach(function(grp){
    var unlocked = lvlIsLevelUnlocked(grp.level);
    var complete = lvlIsLevelComplete(grp.level);
    var isCurrent = (grp.level === currentLevel) && !complete;
    var subsPassedCount = grp.subs.filter(function(s){ return subIsComplete(s.id); }).length;

    var wrap = document.createElement('div');
    wrap.style.cssText = 'border:1.5px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:2px;' +
      (unlocked ? '' : 'opacity:.45;');

    var statusIcon = complete ? '✅' : (unlocked ? (isCurrent ? '🟡' : '🔓') : '🔒');
    var statusText = complete ? 'Completed' : (unlocked ? subsPassedCount + ' of ' + grp.subs.length + ' parts done' : 'Locked — finish Level ' + (grp.level - 1) + ' first');

    var head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;';
    head.innerHTML =
      '<div><div style="font-weight:800;font-size:14px;">' + statusIcon + ' Level ' + grp.level + ': ' + grp.name + '</div>' +
      '<div style="font-size:12px;color:var(--muted);margin-top:4px;">' + statusText + '</div></div>' +
      (complete ? '<span style="font-size:12px;font-weight:800;color:var(--leaf);white-space:nowrap;">🏆 Passed</span>' : '');
    wrap.appendChild(head);

    if(unlocked){
      var subList = document.createElement('div');
      subList.style.cssText = 'margin-top:12px;display:flex;flex-direction:column;gap:8px;';
      grp.subs.forEach(function(sub, subIdx){
        var subUnlocked = subIsUnlocked(grp, subIdx);
        var subComplete = subIsComplete(sub.id);
        var subLast = (u.subProgress[sub.id] || {}).lastScore;

        var subRow = document.createElement('div');
        subRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 12px;background:var(--bg);border-radius:9px;' +
          (subUnlocked ? '' : 'opacity:.5;');

        var subIcon = subComplete ? '✅' : (subUnlocked ? '🔓' : '🔒');
        var subLeft = document.createElement('div');
        subLeft.innerHTML = '<div style="font-size:12.5px;font-weight:700;">' + subIcon + ' Level ' + sub.id + ': ' + sub.name + '</div>' +
          '<div style="font-size:11px;color:var(--muted);margin-top:2px;">' + SUB_TEST_SIZE + ' questions' + (subLast != null ? ' · Last: ' + subLast + '%' : '') + '</div>';
        subRow.appendChild(subLeft);

        if(subComplete){
          var badge = document.createElement('span');
          badge.style.cssText = 'font-size:11px;font-weight:800;color:var(--leaf);white-space:nowrap;';
          badge.textContent = '🏆 Passed';
          subRow.appendChild(badge);
        } else if(subUnlocked){
          var subBtn = document.createElement('button');
          subBtn.className = 'tb-btn';
          subBtn.style.cssText = 'background:var(--sun);color:#fff;border:none;white-space:nowrap;font-size:12px;padding:6px 12px;';
          subBtn.textContent = subLast != null ? 'Retry' : 'Take Test';
          subBtn.onclick = function(){ openLevelTest(grp.level, sub.id); };
          subRow.appendChild(subBtn);
        } else {
          var lockSpan = document.createElement('span');
          lockSpan.style.fontSize = '15px';
          lockSpan.textContent = '🔒';
          subRow.appendChild(lockSpan);
        }

        subList.appendChild(subRow);
      });
      wrap.appendChild(subList);
    }

    listEl.appendChild(wrap);
  });
}

var LVL_TEST_STATE = { level: null, subId: null, questions: [], answers: [], current: 0, isOnboarding: false };

function openLevelTest(levelNum, subId){
  var grp = LEVEL_GROUPS.find(function(g){ return g.level === levelNum; });
  if(!grp) return;
  var sub = subId ? grp.subs.find(function(s){ return s.id === subId; }) : null;
  LVL_TEST_STATE.level = levelNum;
  LVL_TEST_STATE.subId = sub ? sub.id : null;

  var u = CURRENT_USER;
  var testSize = sub ? SUB_TEST_SIZE : LEVEL_TEST_SIZE;
  var progressBucket = sub ? ((u.subProgress || {})[sub.id] || {}) : ((u.levelProgress && u.levelProgress[levelNum]) || {});
  var attemptsSoFar = progressBucket.attempts || 0;

  var titleChapters = sub ? sub.chapters : grp.chapters;
  if(LVL_TEST_STATE.isOnboarding){
    document.getElementById('lvltest-title').textContent = '🧪 Let\'s find your starting point!';
    document.getElementById('lvltest-desc').textContent = testSize + ' quick questions so BrightPath can see how you learn best and where to start you off. There is no pass or fail here — just do your best!';
  } else {
    document.getElementById('lvltest-title').textContent = sub ? ('🧪 Level ' + sub.id + ': ' + sub.name + ' Test') : ('🧪 Level ' + levelNum + ' Mixed Subject Test');
    var desc = testSize + ' questions covering ' + titleChapters.join(', ') + '. Take your time — you\'ve got this!';
    if(attemptsSoFar > 0){
      desc += ' This will be a freshly shuffled set of ' + testSize + ' questions — attempt #' + (attemptsSoFar + 1) + '.';
    }
    document.getElementById('lvltest-desc').textContent = desc;
  }
  document.getElementById('lvltest-intro-card').style.display = 'block';
  document.getElementById('lvltest-question-card').style.display = 'none';
  document.getElementById('lvltest-result-card').style.display = 'none';
  document.querySelectorAll('.pane').forEach(function(p){ p.classList.remove('on'); });
  var overlay = document.getElementById('cpane-leveltest');
  overlay.style.display = 'block';
  overlay.classList.add('on');
}

function closeLevelTest(){
  var overlay = document.getElementById('cpane-leveltest');
  overlay.style.display = 'none';
  overlay.classList.remove('on');
  if(LVL_TEST_STATE.isOnboarding){
    LVL_TEST_STATE.isOnboarding = false;
    CURRENT_USER.onboardingTestDone = true;
    if(typeof saveUserLocal === 'function') saveUserLocal();
    showScreen('s-child');
    showPane('child', 'home');
    if(typeof updateHomeUI === 'function') updateHomeUI();
    return;
  }
  showPane('child', 'rewards');
  setTimeout(renderLevelProgression, 0);
}

function lvlCollectQuestionPool(levelNum, chapterList){
  var grp = LEVEL_GROUPS.find(function(g){ return g.level === levelNum; });
  if(!grp || typeof NCERT_CHAPTERS === 'undefined' || typeof QUIZ_BANK === 'undefined') return [];
  var chapters = chapterList || grp.chapters;
  var pool = [];
  var allChapters = (NCERT_CHAPTERS['6'] && NCERT_CHAPTERS['6'].maths && NCERT_CHAPTERS['6'].maths.chapters) || [];
  chapters.forEach(function(chapterName){
    var chObj = allChapters.find(function(c){ return c.n === chapterName; });
    if(!chObj) return;
    chObj.t.forEach(function(topic){
      var key = lcDupResolve(topic, chapterName);
      var items = QUIZ_BANK[key] || QUIZ_BANK[topic] || [];
      items.forEach(function(q){
        pool.push({ q: q, chapter: chapterName, topic: topic });
      });
    });
  });
  return pool;
}

function lvlShuffle(arr){
  var a = arr.slice();
  for(var i = a.length - 1; i > 0; i--){
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function startLevelTest(){
  var levelNum = LVL_TEST_STATE.level;
  var subId = LVL_TEST_STATE.subId;
  var grp = LEVEL_GROUPS.find(function(g){ return g.level === levelNum; });
  var sub = subId ? grp.subs.find(function(s){ return s.id === subId; }) : null;
  var testSize = sub ? SUB_TEST_SIZE : LEVEL_TEST_SIZE;
  var pool = lvlCollectQuestionPool(levelNum, sub ? sub.chapters : null);
  if(pool.length === 0){
    alert('No quiz questions are available yet for this part. Please try again after more content is added.');
    return;
  }
  var u = CURRENT_USER;
  if(!u.levelProgress) u.levelProgress = {};
  if(!u.subProgress) u.subProgress = {};
  var bucket = sub
    ? (u.subProgress[sub.id] = u.subProgress[sub.id] || {})
    : (u.levelProgress[levelNum] = u.levelProgress[levelNum] || {});
  var lastQTexts = bucket.lastQuestionTexts || [];

  // Prefer questions NOT used in the immediately previous attempt, so retries
  // feel genuinely different. Falls back to the full pool if there aren't
  // enough "unseen" questions left to fill a test.
  var fresh = pool.filter(function(item){ return lastQTexts.indexOf(item.q.q) === -1; });
  var sourcePool = (fresh.length >= testSize) ? fresh : pool;

  var shuffled = lvlShuffle(sourcePool);
  var picked = shuffled.slice(0, Math.min(testSize, shuffled.length));
  // Guarantee a mix: if fewer than requested, just use what we have
  LVL_TEST_STATE.questions = picked;
  LVL_TEST_STATE.answers = [];
  LVL_TEST_STATE.current = 0;

  // Remember this attempt's questions so the *next* retry can avoid repeating them.
  bucket.lastQuestionTexts = picked.map(function(item){ return item.q.q; });
  saveUserLocal();

  document.getElementById('lvltest-intro-card').style.display = 'none';
  document.getElementById('lvltest-result-card').style.display = 'none';
  document.getElementById('lvltest-question-card').style.display = 'block';
  lvlRenderQuestion();
}

function lvlRenderQuestion(){
  var state = LVL_TEST_STATE;
  var idx = state.current;
  var total = state.questions.length;
  var entry = state.questions[idx];
  var q = entry.q;

  document.getElementById('lvltest-progress-label').textContent = 'Question ' + (idx + 1) + ' of ' + total;
  document.getElementById('lvltest-chapter-label').textContent = entry.chapter;
  document.getElementById('lvltest-progress-bar').style.width = Math.round((idx / total) * 100) + '%';
  document.getElementById('lvltest-question-text').textContent = q.q;

  var optsEl = document.getElementById('lvltest-options');
  optsEl.innerHTML = '';

  if(q.type === 'mcq'){
    q.opts.forEach(function(opt, oi){
      var b = document.createElement('button');
      b.className = 'tb-btn';
      b.style.cssText = 'text-align:left;padding:12px 14px;';
      b.textContent = opt;
      b.onclick = function(){ lvlAnswerQuestion(oi === q.correct, opt, q.opts[q.correct]); };
      optsEl.appendChild(b);
    });
  } else if(q.type === 'fillblank'){
    var wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:8px;';
    var input = document.createElement('input');
    input.type = 'text';
    input.style.cssText = 'flex:1;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;';
    input.placeholder = 'Type your answer';
    var submitBtn = document.createElement('button');
    submitBtn.className = 'tb-btn';
    submitBtn.style.cssText = 'background:var(--sun);color:#fff;border:none;';
    submitBtn.textContent = 'Submit';
    submitBtn.onclick = function(){
      var given = (input.value || '').trim().toLowerCase();
      var correct = String(q.answer || '').trim().toLowerCase();
      lvlAnswerQuestion(given === correct, input.value || '(blank)', q.answer);
    };
    wrap.appendChild(input);
    wrap.appendChild(submitBtn);
    optsEl.appendChild(wrap);
  } else if(q.type === 'reorder'){
    // Simplified handling in the level test: show items, correct-order check on submit order clicked
    var note = document.createElement('div');
    note.style.cssText = 'font-size:12px;color:var(--muted);margin-bottom:8px;';
    note.textContent = 'Tap the items in the correct order:';
    optsEl.appendChild(note);
    var chosen = [];
    var itemButtons = [];
    q.items.forEach(function(item, ii){
      var b = document.createElement('button');
      b.className = 'tb-btn';
      b.style.cssText = 'text-align:left;padding:10px 14px;';
      b.textContent = item;
      b.onclick = function(){
        if(b.disabled) return;
        b.disabled = true;
        b.style.opacity = '.4';
        chosen.push(ii);
        if(chosen.length === q.items.length){
          var isCorrect = JSON.stringify(chosen) === JSON.stringify(q.correctOrder);
          var chosenText = chosen.map(function(ci){ return q.items[ci]; }).join(' → ');
          var correctText = q.correctOrder.map(function(ci){ return q.items[ci]; }).join(' → ');
          lvlAnswerQuestion(isCorrect, chosenText, correctText);
        }
      };
      itemButtons.push(b);
      optsEl.appendChild(b);
    });
  } else {
    // Unknown type — skip gracefully, count as unattempted (incorrect)
    lvlAnswerQuestion(false, '(skipped)', '(unavailable)');
  }
}

function lvlAnswerQuestion(isCorrect, chosenText, correctText){
  var state = LVL_TEST_STATE;
  var entry = state.questions[state.current];
  var q = entry.q;
  state.answers.push({
    correct: isCorrect,
    chapter: entry.chapter,
    topic: entry.topic,
    questionText: q.q,
    chosenText: chosenText,
    correctText: correctText,
    explain: q.explain || ''
  });
  state.current++;
  if(state.current < state.questions.length){
    lvlRenderQuestion();
  } else {
    lvlFinishTest();
  }
}

function lvlFinishTest(){
  var state = LVL_TEST_STATE;
  var total = state.answers.length;
  var correctCount = state.answers.filter(function(a){ return a.correct; }).length;
  var scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  // Group by chapter to find strengths / weaknesses
  var byChapter = {};
  state.answers.forEach(function(a){
    if(!byChapter[a.chapter]) byChapter[a.chapter] = { correct: 0, total: 0 };
    byChapter[a.chapter].total++;
    if(a.correct) byChapter[a.chapter].correct++;
  });
  var strengths = [], weak = [];
  Object.keys(byChapter).forEach(function(ch){
    var stat = byChapter[ch];
    var pct = Math.round((stat.correct / stat.total) * 100);
    if(pct >= 70) strengths.push(ch + ' (' + pct + '%)');
    else weak.push(ch + ' (' + pct + '%)');
  });

  var levelNum = state.level;
  var subId = state.subId;
  var grp = LEVEL_GROUPS.find(function(g){ return g.level === levelNum; });
  var sub = subId ? grp.subs.find(function(s){ return s.id === subId; }) : null;
  var u = CURRENT_USER;
  if(!u.levelProgress) u.levelProgress = {};
  if(!u.subProgress) u.subProgress = {};
  var bucket = sub
    ? (u.subProgress[sub.id] = u.subProgress[sub.id] || {})
    : (u.levelProgress[levelNum] = u.levelProgress[levelNum] || {});
  bucket.lastScore = scorePct;
  bucket.attempts = (bucket.attempts || 0) + 1;

  var promoted = false;
  var actionText = '';
  var label = sub ? ('Level ' + sub.id + ' (' + sub.name + ')') : ('Level ' + levelNum);
  if(scorePct >= LEVEL_PASS_PCT){
    bucket.passed = true;
    promoted = true;
    if(sub){
      syncParentLevelFromSubs(grp);
      var nextSub = grp.subs[grp.subs.findIndex(function(s){return s.id===sub.id;}) + 1];
      if(nextSub){
        actionText = '🚀 ' + label + ' complete! ' + 'Level ' + nextSub.id + ' (' + nextSub.name + ') is now unlocked.';
      } else if(lvlIsLevelComplete(levelNum)){
        var nextLevelGrp = LEVEL_GROUPS.find(function(g){ return g.level === levelNum + 1; });
        actionText = nextLevelGrp
          ? ('🚀 Level ' + levelNum + ' complete! You have been promoted to Level ' + (levelNum + 1) + '.')
          : '🎉 You completed the final level! All levels cleared.';
      } else {
        actionText = '🚀 ' + label + ' complete!';
      }
    } else {
      var nextLevel = levelNum + 1;
      if(LEVEL_GROUPS.find(function(g){ return g.level === nextLevel; })){
        u.currentLevel = nextLevel;
        actionText = '🚀 Level ' + levelNum + ' complete! You have been promoted to Level ' + nextLevel + '.';
      } else {
        actionText = '🎉 You completed the final level! All levels cleared.';
      }
    }
    // Reward: badge + stars for passing a level/sub-level
    u.stars = (u.stars || 0) + (sub ? 20 : 50);
    u.badges = (u.badges || 0) + 1;
  } else if(scorePct >= LEVEL_REVISE_PCT){
    actionText = '📖 Good effort! Revise ' + (weak.length ? weak.map(function(w){return w.split(' (')[0];}).join(', ') : 'the weaker topics') + ', then retry the test to move up.';
    u.stars = (u.stars || 0) + 10;
  } else {
    actionText = '💪 Let us revise ' + (weak.length ? weak.map(function(w){return w.split(' (')[0];}).join(', ') : 'these chapters') + ' before trying again. You can do this!';
    u.stars = (u.stars || 0) + 5;
  }
  saveUserLocal();

  // Render result screen
  document.getElementById('lvltest-question-card').style.display = 'none';
  document.getElementById('lvltest-result-card').style.display = 'block';

  var retryBtn = document.getElementById('lvltest-retry-btn');
  var primaryBtn = document.getElementById('lvltest-primary-btn');

  if(LVL_TEST_STATE.isOnboarding){
    // Placement quiz: always frame this as a positive, no-fail starting point.
    document.getElementById('lvltest-result-emoji').textContent = '🌟';
    document.getElementById('lvltest-result-title').textContent = 'Got it — thanks!';
    document.getElementById('lvltest-result-score').textContent = scorePct + '%';
    document.getElementById('lvltest-result-scoreline').textContent = correctCount + ' out of ' + total + ' correct';
    var strengthsEl0 = document.getElementById('lvltest-strengths');
    strengthsEl0.innerHTML = strengths.length ? strengths.map(function(s){ return '<div>✅ ' + s + '</div>'; }).join('') : '<div style="color:var(--muted);">We will learn more about your strengths as you go!</div>';
    var weakEl0 = document.getElementById('lvltest-weak');
    weakEl0.innerHTML = weak.length ? weak.map(function(w){ return '<div>📌 ' + w + '</div>'; }).join('') : '<div style="color:var(--muted);">Nothing to flag yet — nice start!</div>';
    document.getElementById('lvltest-next-action-text').textContent = '🎯 BrightPath now knows where to start you. Let\'s begin!';
    retryBtn.style.display = 'none';
    primaryBtn.textContent = 'Start Learning 🚀';
    // Still record a genuine starting point so real progress tracking (badges,
    // level-ups) begins from here rather than from this diagnostic score.
    u.currentLevel = u.currentLevel || 1;
    return;
  }

  document.getElementById('lvltest-result-emoji').textContent = scorePct >= LEVEL_PASS_PCT ? '🎉' : (scorePct >= LEVEL_REVISE_PCT ? '🙂' : '💪');
  document.getElementById('lvltest-result-title').textContent = scorePct >= LEVEL_PASS_PCT ? 'Level Passed!' : (scorePct >= LEVEL_REVISE_PCT ? 'Almost there!' : 'Keep practicing!');
  document.getElementById('lvltest-result-score').textContent = scorePct + '%';
  document.getElementById('lvltest-result-scoreline').textContent = correctCount + ' out of ' + total + ' correct';

  var strengthsEl = document.getElementById('lvltest-strengths');
  strengthsEl.innerHTML = strengths.length ? strengths.map(function(s){ return '<div>✅ ' + s + '</div>'; }).join('') : '<div style="color:var(--muted);">Keep going — no strong areas yet</div>';
  var weakEl = document.getElementById('lvltest-weak');
  weakEl.innerHTML = weak.length ? weak.map(function(w){ return '<div>📌 ' + w + '</div>'; }).join('') : '<div style="color:var(--muted);">No weak areas — great work!</div>';

  document.getElementById('lvltest-next-action-text').textContent = actionText;

  if(scorePct >= LEVEL_PASS_PCT){
    retryBtn.style.display = 'none';
    primaryBtn.textContent = 'Continue';
  } else {
    retryBtn.style.display = 'inline-block';
    primaryBtn.textContent = 'Back to Levels';
  }

  // Answer Key — show every question, what was picked, and the correct answer
  var keyEl = document.getElementById('lvltest-answer-key');
  keyEl.innerHTML = state.answers.map(function(a, ai){
    var wasCorrect = a.correct;
    var rowBg = wasCorrect ? 'var(--leaf-light)' : 'var(--rose-light)';
    var icon = wasCorrect ? '✅' : '❌';
    var chosenLine = wasCorrect
      ? '<div style="font-size:12px;color:var(--leaf);margin-top:4px;">Your answer: ' + a.chosenText + ' — Correct!</div>'
      : '<div style="font-size:12px;color:var(--rose);margin-top:4px;">Your answer: ' + a.chosenText + '</div>' +
        '<div style="font-size:12px;color:var(--leaf);margin-top:2px;">Correct answer: ' + a.correctText + '</div>';
    var explainLine = a.explain ? '<div style="font-size:12px;color:var(--muted);margin-top:4px;">💡 ' + a.explain + '</div>' : '';
    return '<div style="background:' + rowBg + ';border-radius:10px;padding:10px 12px;">' +
      '<div style="font-size:13px;font-weight:700;">' + icon + ' Q' + (ai + 1) + '. ' + a.questionText + '</div>' +
      chosenLine + explainLine +
      '<div style="font-size:11px;color:var(--muted);margin-top:4px;">' + a.chapter + '</div>' +
      '</div>';
  }).join('');

  // Update visible reward stats immediately
  var rs = document.getElementById('rw-stars'); if(rs) rs.textContent = u.stars;
  var rb = document.getElementById('rw-badges'); if(rb) rb.textContent = u.badges;
  var rl = document.getElementById('rw-level-num'); if(rl) rl.textContent = u.currentLevel || 1;
  var summaryEl = document.getElementById('rewards-summary-text');
  if(summaryEl) summaryEl.textContent = 'You have earned ' + u.badges + ' badges and ' + u.stars + ' stars. Amazing work!';
}
