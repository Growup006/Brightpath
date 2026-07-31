var lcCtx = null;

var lcQuizScore = {correct:0, answered:0};

var LC_DUPLICATE_TOPIC_CHAPTERS = {
  "Polygons": "Understanding Elementary Shapes",
  "Quadrilaterals": "Understanding Elementary Shapes"
};

function resolveContentKey(topic, chapterName){
  var dupChapter = LC_DUPLICATE_TOPIC_CHAPTERS[topic];
  if(dupChapter && chapterName===dupChapter) return topic+'::'+dupChapter;
  return topic;
}

function openLearningCenter(topic, chapterName, subjectName){
  // Try to resolve chIdx/tIdx so progress tracking gets full context
  var chIdx = -1, tIdx = -1;
  if(currentSubject && currentSubject.data){
    currentSubject.data.chapters.forEach(function(ch, ci){
      ch.t.forEach(function(t, ti){
        if(ch.n===chapterName && t===topic){ chIdx=ci; tIdx=ti; }
      });
    });
  }
  var contentKey = resolveContentKey(topic, chapterName);
  lcCtx = { subject: subjectName, chapterName: chapterName, topic: contentKey, displayTopic: topic, chIdx: chIdx, tIdx: tIdx };

  document.getElementById('lc-crumb').textContent = subjectName + ' · ' + chapterName;
  document.getElementById('lc-topic-title').textContent = topic;

  gnSetSceneForTopic(contentKey);
  renderLCNotes();
  renderLCVideo();
  renderLCQuiz();
  lcPracticeSetIdx = 0;
  renderLCPractice();

  switchLCTab('notes');
  showScreen('s-learning-center');
}

function closeLearningCenter(){
  // Focus Mode is intentionally session-only (never saved), so leaving the
  // lesson screen always resets it — refreshing or navigating away both land
  // back in normal mode, per spec.
  exitFocusMode();
  if(currentSubject){
    renderChapters();
    showScreen('s-child');
    showPane('child','chapters');
  } else {
    showScreen('s-child');
  }
}

var focusModeOn = false;

function toggleFocusMode(){
  focusModeOn ? exitFocusMode() : enterFocusMode();
}

function enterFocusMode(){
  focusModeOn = true;
  document.body.classList.add('focus-mode');
  var btn = document.getElementById('focus-mode-btn');
  if(btn) btn.textContent = '✕ Exit Focus';
  if(typeof gnState !== 'undefined' && gnState.topic){
    var data = GAMIFIED_NOTES[gnState.topic];
    if(data) updateFocusProgress(gnState.levelIdx + 1, data.levels.length);
  }
}

function exitFocusMode(){
  focusModeOn = false;
  document.body.classList.remove('focus-mode');
  var btn = document.getElementById('focus-mode-btn');
  if(btn) btn.textContent = '🎯 Focus Mode';
}

function updateFocusProgress(current, total){
  var bar = document.getElementById('lc-focus-progress');
  if(!bar) return;
  var pct = total > 0 ? Math.round((current / total) * 100) : 0;
  bar.innerHTML = '<div class="lc-focus-progress-fill" style="width:'+pct+'%;"></div>';
}

var SUBJECT_NAMES = { maths:'Mathematics', science:'Science', english:'English', sst:'Social Science', hindi:'Hindi' };

function switchLCTab(tab){
  document.querySelectorAll('.lc-tab').forEach(function(b){ b.classList.toggle('active', b.dataset.tab===tab); });
  document.querySelectorAll('.lc-pane').forEach(function(p){ p.classList.remove('on'); });
  var pane = document.getElementById('lc-pane-'+tab);
  if(pane) pane.classList.add('on');
}

function markTopicLearned(){
  if(!lcCtx || lcCtx.chIdx<0 || !currentSubject) { showToast('🎉 Great work on this topic!'); return; }
  var ctx = { subjKey: currentSubject.key, classNum: currentChildClass, chIdx: lcCtx.chIdx, tIdx: lcCtx.tIdx, numTopics: currentSubject.data.chapters[lcCtx.chIdx].t.length };
  var prog = getChapterProgress(ctx.subjKey);
  var inc = Math.ceil(100/ctx.numTopics);
  prog[ctx.chIdx] = Math.min(100, (prog[ctx.chIdx]||0) + inc);
  CURRENT_USER.completedTopics = CURRENT_USER.completedTopics || {};
  var topicKey = ctx.classNum+'_'+ctx.subjKey+'_'+ctx.chIdx+'_'+ctx.tIdx;
  var wasAlreadyDone = !!CURRENT_USER.completedTopics[topicKey];
  CURRENT_USER.completedTopics[topicKey] = true;
  updateSubjectProgressFromChapters(ctx.subjKey);
  addStars(10);
  showToast('⭐ +10 stars — topic marked as done!');
  renderChapters();
  // Daily goal only counts genuinely NEW completions, not re-marking an
  // already-done topic (which would otherwise inflate the count).
  if(!wasAlreadyDone && typeof incrementDailyGoal === 'function') incrementDailyGoal();
}
