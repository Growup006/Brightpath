var PQ_SECONDS_PER_Q = 15;

var PQ_TIMER_CIRC = 2 * Math.PI * 34;

var pqState = {
  topic: null,
  questions: [],
  qIdx: 0,
  score: 0,
  correctCount: 0,
  timer: null,
  secondsLeft: PQ_SECONDS_PER_Q,
  answered: false,
  returnTab: null
};

function pqOpenLengthPicker(topic){
  var allQs = QUIZ_BANK[topic] || [];
  if(!allQs.length){ showToast('No quiz questions yet for this topic.'); return; }
  var total = allQs.length;
  var overlay = document.createElement('div');
  overlay.className = 'pq-len-overlay';
  overlay.id = 'pq-len-overlay';

  var options = [5, 8, total].filter(function(n, i, arr){
    return n <= total && arr.indexOf(n) === i; // dedupe + clamp to available questions
  }).sort(function(a,b){ return a-b; });

  var optsHtml = options.map(function(n){
    var label = n===total ? 'All Questions' : n+' Questions';
    var sub = n===total ? 'The full set' : (n<=5 ? 'Quick round' : 'Longer round');
    return '<button class="pq-len-opt" onclick="pqLaunch(\''+topic.replace(/'/g,"\\'")+'\','+n+')">'+label+'<span class="pl-sub">'+sub+'</span></button>';
  }).join('');

  overlay.innerHTML = '<div class="pq-len-card">'+
    '<h3>⚡ Play Quiz</h3>'+
    '<p>How many questions for this round?</p>'+
    '<div class="pq-len-opts">'+optsHtml+'</div>'+
    '<button class="pq-len-cancel" onclick="document.getElementById(\'pq-len-overlay\').remove()">Cancel</button>'+
  '</div>';
  document.body.appendChild(overlay);
}

function pqLaunch(topic, roundSize){
  var overlay = document.getElementById('pq-len-overlay');
  if(overlay) overlay.remove();
  var allQs = QUIZ_BANK[topic] || [];
  if(!allQs.length){ showToast('No quiz questions yet for this topic.'); return; }
  var size = roundSize ? Math.min(roundSize, allQs.length) : allQs.length;
  pqState.topic = topic;
  pqState.questions = lcShuffleArray(allQs).slice(0, size); // random subset, fresh order each play
  pqState.qIdx = 0;
  pqState.score = 0;
  pqState.correctCount = 0;
  pqState.returnTab = 'quiz';
  showScreen('s-play-quiz');
  document.getElementById('pq-timer-wrap').style.display = '';
  pqRenderQuestion();
}

function pqExit(){
  clearInterval(pqState.timer);
  showScreen('s-learning-center');
  switchLCTab(pqState.returnTab || 'quiz');
}

function pqGetBestScoreKey(topic){
  return 'pq_best_' + currentChildClass + '_' + topic;
}

function pqGetBestScore(topic){
  CURRENT_USER.pqBest = CURRENT_USER.pqBest || {};
  return CURRENT_USER.pqBest[pqGetBestScoreKey(topic)] || 0;
}

function pqSaveBestScore(topic, score){
  CURRENT_USER.pqBest = CURRENT_USER.pqBest || {};
  var key = pqGetBestScoreKey(topic);
  var isNewBest = score > (CURRENT_USER.pqBest[key] || 0);
  if(isNewBest) CURRENT_USER.pqBest[key] = score;
  saveUserLocal();
  return isNewBest;
}

var PQ_MIA_INTRO_LINES = [
  "Let's see this one!",
  "Here we go!",
  "Take your time \u2014 you've got this!",
  "Ooh, a tricky one?",
  "Ready when you are!",
  "Think it through!",
  "I believe in you!",
  "Let's keep the streak going!"
];

var PQ_MIA_CORRECT_LINES = [
  "Yes! Exactly right!",
  "Nailed it!",
  "You're on fire!",
  "Brilliant!",
  "That's the one!",
  "Great thinking!"
];

var PQ_MIA_WRONG_LINES = [
  "So close \u2014 let's look at the right answer!",
  "Not quite, but good try!",
  "Almost! Here's the answer.",
  "That one was tricky \u2014 here's why!"
];

var PQ_MIA_TIMEUP_LINES = [
  "Time flew by! Here's the answer.",
  "Oops, out of time \u2014 no worries!",
  "So close! Let's see the answer."
];

function pqRenderMia(text, mood){
  var wrap = document.getElementById('pq-mia-wrap');
  if(!wrap) return;
  var moodClass = mood ? ' '+mood : '';
  wrap.innerHTML =
    '<div class="pq-mia-avatar'+moodClass+'" id="pq-mia-avatar">'+MIA_SVG+'</div>'+
    '<div class="pq-mia-bubble">'+text+'</div>';
}

function pqRandomLine(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function pqRenderQuestion(){
  pqState.answered = false;
  var total = pqState.questions.length;
  document.getElementById('pq-progress-bar').style.width = Math.round((pqState.qIdx/total)*100)+'%';
  document.getElementById('pq-score-pill').textContent = '⭐ ' + pqState.score;

  var item = pqState.questions[pqState.qIdx];
  var interactionHtml = pqRenderInteraction(item);
  document.getElementById('pq-body').innerHTML =
    '<div class="pq-mia-wrap" id="pq-mia-wrap"></div>'+
    '<div class="pq-question-card">'+
      '<div class="pq-q-text">'+item.q+'</div>'+
      interactionHtml+
    '</div>';

  pqRenderMia(pqRandomLine(PQ_MIA_INTRO_LINES));
  pqStartTimer();
}

function pqRenderInteraction(item){
  if(item.type==='mcq'){
    return '<div class="pq-opts">' + item.opts.map(function(opt,oi){
      return '<button class="pq-opt" onclick="pqAnswerMCQ(this,'+oi+')">'+String.fromCharCode(65+oi)+') '+opt+'</button>';
    }).join('') + '</div>';
  }
  if(item.type==='fillblank'){
    return '<div class="pq-blank-row">'+
      '<input type="text" class="pq-blank-input" id="pq-blank-input" placeholder="Type your answer..." onkeydown="if(event.key===\'Enter\')pqAnswerBlank();"/>'+
      '<button class="pq-blank-btn" onclick="pqAnswerBlank()">Go</button>'+
    '</div>';
  }
  if(item.type==='reorder'){
    var shuffled = lcShuffleArray(item.items.map(function(text,i){ return {text:text, origIdx:i}; }));
    var itemsHtml = shuffled.map(function(it){
      return '<div class="lc-reorder-item" draggable="true" data-orig-idx="'+it.origIdx+'">'+
        '<span class="ro-handle">⠿</span><span>'+it.text+'</span>'+
      '</div>';
    }).join('');
    return '<div class="lc-reorder-list" id="pq-reorder-list">'+itemsHtml+'</div>'+
      '<button class="lc-reorder-btn" style="width:100%;" onclick="pqAnswerReorder()">Check Order</button>';
  }
  return '';
}

function pqStartTimer(){
  clearInterval(pqState.timer);
  pqState.secondsLeft = PQ_SECONDS_PER_Q;
  pqUpdateTimerUI();
  pqState.timer = setInterval(function(){
    pqState.secondsLeft--;
    pqUpdateTimerUI();
    if(pqState.secondsLeft <= 0){
      clearInterval(pqState.timer);
      pqTimeUp();
    }
  }, 1000);
}

function pqUpdateTimerUI(){
  var num = document.getElementById('pq-timer-num');
  var fg = document.getElementById('pq-timer-fg');
  var ring = document.getElementById('pq-timer-ring');
  if(!num || !fg) return;
  num.textContent = Math.max(0, pqState.secondsLeft);
  var fraction = Math.max(0, pqState.secondsLeft) / PQ_SECONDS_PER_Q;
  var offset = PQ_TIMER_CIRC * (1 - fraction);
  fg.style.strokeDasharray = PQ_TIMER_CIRC;
  fg.style.strokeDashoffset = offset;
  ring.classList.toggle('urgent', pqState.secondsLeft <= 4);
}

function pqTimeUp(){
  if(pqState.answered) return;
  pqState.answered = true;
  showToast('⏰ Time\'s up!');
  pqRevealCorrectAnswer();
  pqRenderMia(pqRandomLine(PQ_MIA_TIMEUP_LINES), 'wobble');
  setTimeout(pqNextQuestion, 1400);
}

function pqRevealCorrectAnswer(){
  var item = pqState.questions[pqState.qIdx];
  if(item.type==='mcq'){
    var opts = document.querySelectorAll('.pq-opt');
    opts.forEach(function(o,i){ o.disabled=true; if(i===item.correct) o.classList.add('correct'); });
  }
}

function pqAwardPoints(isCorrect){
  if(!isCorrect) return 0;
  // Speed bonus: faster answer = more points (Wayground-style). Base 50 + up to 50 bonus.
  var speedBonus = Math.round((pqState.secondsLeft / PQ_SECONDS_PER_Q) * 50);
  var points = 50 + speedBonus;
  pqState.score += points;
  pqState.correctCount++;
  pqSpawnPointsPopup('+'+points);
  return points;
}

function pqSpawnPointsPopup(text){
  var popup = document.createElement('div');
  popup.className = 'pq-points-popup';
  popup.textContent = text;
  document.body.appendChild(popup);
  setTimeout(function(){ if(popup.parentNode) popup.parentNode.removeChild(popup); }, 900);
}

function pqAnswerMCQ(btn, chosenIdx){
  if(pqState.answered) return;
  pqState.answered = true;
  clearInterval(pqState.timer);
  var item = pqState.questions[pqState.qIdx];
  var opts = document.querySelectorAll('.pq-opt');
  var isCorrect = chosenIdx===item.correct;
  opts.forEach(function(o,i){
    o.disabled = true;
    if(i===item.correct) o.classList.add('correct');
    else if(i===chosenIdx) o.classList.add('wrong');
  });
  pqAwardPoints(isCorrect);
  document.getElementById('pq-score-pill').textContent = '⭐ ' + pqState.score;
  pqRenderMia(isCorrect ? pqRandomLine(PQ_MIA_CORRECT_LINES) : pqRandomLine(PQ_MIA_WRONG_LINES), isCorrect ? 'bounce' : 'wobble');
  setTimeout(pqNextQuestion, 1100);
}

function pqAnswerBlank(){
  if(pqState.answered) return;
  pqState.answered = true;
  clearInterval(pqState.timer);
  var item = pqState.questions[pqState.qIdx];
  var input = document.getElementById('pq-blank-input');
  var val = (input.value||'').trim().toLowerCase().replace(/,/g,'');
  var correctVal = item.answer.trim().toLowerCase().replace(/,/g,'');
  var isCorrect = val===correctVal;
  input.disabled = true;
  input.style.borderColor = isCorrect ? 'var(--leaf)' : '#E24B4A';
  pqAwardPoints(isCorrect);
  document.getElementById('pq-score-pill').textContent = '⭐ ' + pqState.score;
  pqRenderMia(isCorrect ? pqRandomLine(PQ_MIA_CORRECT_LINES) : pqRandomLine(PQ_MIA_WRONG_LINES), isCorrect ? 'bounce' : 'wobble');
  setTimeout(pqNextQuestion, 1100);
}

function pqAnswerReorder(){
  if(pqState.answered) return;
  pqState.answered = true;
  clearInterval(pqState.timer);
  var item = pqState.questions[pqState.qIdx];
  var list = document.getElementById('pq-reorder-list');
  var nodes = Array.from(list.querySelectorAll('.lc-reorder-item'));
  var currentOrder = nodes.map(function(n){ return parseInt(n.dataset.origIdx,10); });
  var isCorrect = JSON.stringify(currentOrder)===JSON.stringify(item.correctOrder);
  nodes.forEach(function(n,i){
    n.draggable = false;
    n.classList.add(item.correctOrder[i]===currentOrder[i] ? 'correct-pos' : 'wrong-pos');
  });
  pqAwardPoints(isCorrect);
  document.getElementById('pq-score-pill').textContent = '⭐ ' + pqState.score;
  pqRenderMia(isCorrect ? pqRandomLine(PQ_MIA_CORRECT_LINES) : pqRandomLine(PQ_MIA_WRONG_LINES), isCorrect ? 'bounce' : 'wobble');
  setTimeout(pqNextQuestion, 1300);
}

function pqNextQuestion(){
  pqState.qIdx++;
  if(pqState.qIdx >= pqState.questions.length){
    pqShowResults();
    return;
  }
  pqRenderQuestion();
}

function pqShowResults(){
  document.getElementById('pq-progress-bar').style.width = '100%';
  document.getElementById('pq-timer-wrap').style.display = 'none';
  var total = pqState.questions.length;
  var isNewBest = pqSaveBestScore(pqState.topic, pqState.score);
  var bestScore = pqGetBestScore(pqState.topic);
  addStars(Math.round(pqState.score/20));

  document.getElementById('pq-body').innerHTML =
    '<div class="pq-results-card">'+
      '<span class="pqr-emoji">'+(pqState.correctCount===total ? '🏆' : pqState.correctCount >= total/2 ? '🎉' : '💪')+'</span>'+
      '<h2>'+(pqState.correctCount===total ? 'Perfect Round!' : 'Quiz Complete!')+'</h2>'+
      '<p>'+pqState.topic+'</p>'+
      (isNewBest ? '<div class="pq-best-badge">🌟 New Personal Best!</div>' : '')+
      '<div class="pq-results-stats">'+
        '<div class="pq-results-stat"><span class="prs-val">'+pqState.score+'</span><span class="prs-label">Score</span></div>'+
        '<div class="pq-results-stat"><span class="prs-val">'+pqState.correctCount+'/'+total+'</span><span class="prs-label">Correct</span></div>'+
        '<div class="pq-results-stat"><span class="prs-val">'+bestScore+'</span><span class="prs-label">Best</span></div>'+
      '</div>'+
      '<div class="pq-results-btns">'+
        '<button class="pq-btn-exit" onclick="pqExit()">Done</button>'+
        '<button class="pq-btn-retry" onclick="pqLaunch(\''+pqState.topic.replace(/'/g,"\\'")+'\','+total+')">Play Again</button>'+
      '</div>'+
    '</div>';
  document.getElementById('pq-timer-wrap').style.display = '';
}
