var lcPracticeSetIdx = 0;

var LC_PRACTICE_INTRO_LINES = [
  "Here's a set to practice with — work through them at your own pace, and peek at the answer whenever you like!",
  "Try each one yourself first, then tap 'Show Answer' to check your thinking!",
  "No pressure here — practice is all about learning, not scoring!",
  "Take your time with these — I'll be here if you want to check your answer!"
];

var LC_PRACTICE_REVEAL_LINES = [
  "How did that compare to your answer?",
  "Hope that matches what you worked out!",
  "See if your steps matched this one!",
  "Good practice! On to the next one whenever you're ready."
];

function renderLCPractice(){
  var sets = PRACTICE_BANK[lcCtx.topic];
  if(!sets || !sets.length){
    document.getElementById('lc-pane-practice').innerHTML = '<div class="lc-practice-card"><span class="lp-q">No practice questions yet for this topic.</span></div>';
    return;
  }
  if(lcPracticeSetIdx >= sets.length) lcPracticeSetIdx = 0;

  var miaIntroHtml = miaSay(lcRandomPick(LC_PRACTICE_INTRO_LINES), {mini:true});

  var pickerHtml = '<div class="lp-set-picker">' + sets.map(function(_, si){
    return '<button class="lp-set-btn'+(si===lcPracticeSetIdx?' active':'')+'" onclick="lcSwitchPracticeSet('+si+')">Set '+(si+1)+'</button>';
  }).join('') + '</div>';

  var progressHtml = '<div class="lp-set-progress">Set '+(lcPracticeSetIdx+1)+' of '+sets.length+' · '+sets[lcPracticeSetIdx].length+' questions</div>';

  var questions = sets[lcPracticeSetIdx];
  var cardsHtml = questions.map(function(item, i){
    var stepsHtml = item.steps ? (
      '<button class="lp-toggle lp-steps-toggle" onclick="lcTogglePracticeSteps(this)">Show Working</button>'+
      '<div class="lp-steps"><div class="lp-steps-label">📝 Step-by-Step</div><ol>'+
        item.steps.map(function(s){ return '<li>'+s+'</li>'; }).join('')+
      '</ol></div>'
    ) : '';
    return '<div class="lc-practice-card">'+
      '<span class="lp-num">'+(i+1)+'</span><span class="lp-q">'+item.q+'</span><br>'+
      '<button class="lp-toggle" onclick="lcTogglePracticeAnswer(this)">Show Answer</button>'+
      stepsHtml+
      '<div class="lp-answer">✅ '+item.answer+'</div>'+
      '<div class="lp-mia"></div>'+
    '</div>';
  }).join('');

  document.getElementById('lc-pane-practice').innerHTML = miaIntroHtml + pickerHtml + progressHtml + cardsHtml;
}

function lcSwitchPracticeSet(idx){
  lcPracticeSetIdx = idx;
  renderLCPractice();
}

function lcTogglePracticeAnswer(btn){
  // Walk forward past any "Show Working" button and its steps panel to find the actual answer div.
  // Supports both quiz cards (.lp-answer) and worksheet rows (.ws-answer-box), and buttons
  // wrapped in an actions container (e.g. .ws-actions) rather than being a direct sibling.
  var container = btn.closest('.ws-actions') ? btn.closest('.ws-actions').parentElement : btn.parentElement;
  var ans = container.querySelector('.lp-answer, .ws-answer-box');
  if(!ans) return;
  var showing = ans.classList.toggle('show');
  btn.textContent = showing ? 'Hide Answer' : 'Show Answer';
  var miaSlot = ans.nextElementSibling;
  if(miaSlot && miaSlot.classList.contains('lp-mia')){
    miaSlot.innerHTML = showing ? miaSay(lcRandomPick(LC_PRACTICE_REVEAL_LINES), {mini:true}) : '';
  }
}

function lcTogglePracticeSteps(btn){
  // Supports both quiz cards (.lp-steps, next sibling) and worksheet rows (.ws-steps-box, next sibling).
  var steps = btn.nextElementSibling;
  if(!steps || (!steps.classList.contains('lp-steps') && !steps.classList.contains('ws-steps-box'))){
    var container = btn.closest('.ws-actions') ? btn.closest('.ws-actions').parentElement : btn.parentElement;
    steps = container.querySelector('.lp-steps, .ws-steps-box');
  }
  if(!steps) return;
  var showing = steps.classList.toggle('show');
  btn.textContent = showing ? 'Hide Working' : 'Show Working';
}

function updateSubjectProgressFromChapters(subjKey){
  var prog = getChapterProgress(subjKey);
  var avg = Math.round(prog.reduce(function(a,b){return a+b;},0)/prog.length);
  CURRENT_USER.progress[subjKey] = avg;
  saveUserLocal();
  if(typeof fbDb!=='undefined' && fbDb && CURRENT_USER.uid){
    fbDb.collection('users').doc(CURRENT_USER.uid).update({ progress: CURRENT_USER.progress, chapterProgress: CURRENT_USER.chapterProgress, completedTopics: CURRENT_USER.completedTopics }).catch(function(){});
  }
  document.querySelectorAll('.subj').forEach(function(card){
    var nameEl = card.querySelector('.subj-name');
    if(!nameEl) return;
    var cardKey = nameEl.textContent.toLowerCase().replace('mathematics','maths').replace('social science','sst').replace('emotional learning','life').replace('life skills','life');
    if(cardKey!==subjKey) return;
    var fill = card.querySelector('.prog-fill');
    if(fill) fill.style.width = avg+'%';
    var footSpan = card.querySelector('.subj-footer span');
    if(footSpan) footSpan.textContent = avg+'%';
  });
  if(typeof updateHomeUI==='function') updateHomeUI();
  var done = Object.values(CURRENT_USER.progress).filter(function(v){ return v>=100; }).length;
  if(done > (CURRENT_USER.badges||0)){
    CURRENT_USER.badges = done;
    CURRENT_USER.stars = (CURRENT_USER.stars||0) + 50;
    saveUserLocal();
    showToast('🏅 Badge unlocked! Subject completed!');
  }
}
