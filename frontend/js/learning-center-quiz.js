var lcCurrentQuizSet = [];

var LC_PRACTICE_ROUND_SIZE = 5;

function lcBuildPracticeRound(allQuestions){
  // Guarantee 1-2 word problems per round (randomly chosen) so they show up regularly
  // without crowding out standard questions or stalling variety when the word-problem
  // pool is large. Remaining slots are filled randomly from standard questions.
  if(allQuestions.length <= LC_PRACTICE_ROUND_SIZE) return lcShuffleArray(allQuestions);
  var wordQs = allQuestions.filter(function(q){ return q.category==='word'; });
  var otherQs = allQuestions.filter(function(q){ return q.category!=='word'; });

  var wordSlotsWanted = wordQs.length > 0 ? Math.min(wordQs.length, 1 + Math.floor(Math.random()*2)) : 0; // 1 or 2
  var pickedWord = lcShuffleArray(wordQs).slice(0, wordSlotsWanted);

  var remainingSlots = Math.max(0, LC_PRACTICE_ROUND_SIZE - pickedWord.length);
  var pickedOthers = lcShuffleArray(otherQs).slice(0, remainingSlots);

  return lcShuffleArray(pickedWord.concat(pickedOthers));
}

var LC_QUIZ_INTRO_LINES = [
  "Ready to test what you've learned? Take your time on each one!",
  "Let's see how much you remember — no rush here!",
  "Practice mode means no clock, so think it through carefully!",
  "Give each question a try, and I'll cheer you on along the way!"
];

var LC_QUIZ_CORRECT_LINES = [
  "Yes! Exactly right! 🎉",
  "Nailed it! You really get this!",
  "Wonderful! That's correct!",
  "Brilliant work!",
  "Spot on!"
];

var LC_QUIZ_WRONG_LINES = [
  "Not quite — but that's how we learn! Check the explanation below.",
  "So close! Have a look at why below.",
  "Good try! Here's a little more explanation to help.",
  "Almost there — read the explanation and you'll have it next time!"
];

function renderLCQuiz(){
  lcQuizScore = {correct:0, answered:0};
  var allQuestions = QUIZ_BANK[lcCtx.topic] || [];
  if(!allQuestions.length){
    document.getElementById('lc-pane-quiz').innerHTML = '<div class="lc-quiz-card"><div class="lq-q">No quiz questions yet for this topic.</div></div>';
    return;
  }

  lcCurrentQuizSet = lcBuildPracticeRound(allQuestions);
  var questions = lcCurrentQuizSet;
  var hasWordProblems = questions.some(function(q){ return q.category==='word'; });

  var miaIntroHtml = miaSay(lcRandomPick(LC_QUIZ_INTRO_LINES), {mini:true});

  var toggleHtml = '<div class="lc-quiz-mode-toggle">'+
    '<button class="lc-quiz-mode-btn active" id="lc-mode-practice" onclick="lcQuizShowPractice()">📝 Practice Mode<span class="qmb-sub">Untimed, learn at your pace</span></button>'+
    '<button class="lc-quiz-mode-btn" id="lc-mode-game" onclick="pqOpenLengthPicker(lcCtx.topic)">⚡ Play Quiz<span class="qmb-sub">Timed, score points!</span></button>'+
  '</div>';

  var refreshHtml = '<div style="text-align:center;margin-bottom:1rem;">'+
    '<button class="lc-quiz-filter-btn" onclick="renderLCQuiz()" title="Get a new set of questions">🔀 New Question Set</button>'+
  '</div>';

  var filterHtml = hasWordProblems ? '<div class="lc-quiz-filter">'+
    '<button class="lc-quiz-filter-btn active" id="lc-filter-all" onclick="lcQuizSetFilter(\'all\')">All Questions</button>'+
    '<button class="lc-quiz-filter-btn" id="lc-filter-word" onclick="lcQuizSetFilter(\'word\')">📖 Word Problems Only</button>'+
  '</div>' : '';

  var cardsHtml = questions.map(function(item, qi){
    var badge = item.category==='word' ? '<span class="lc-word-badge">📖 Word Problem</span>' : '';
    return '<div class="lc-quiz-card" id="lc-quiz-card-'+qi+'" data-qidx="'+qi+'" data-category="'+(item.category||'standard')+'">'+
      '<div class="lq-num">Question '+(qi+1)+' of '+questions.length+badge+'</div>'+
      '<div class="lq-q">'+item.q+'</div>'+
      lcRenderQuizInteraction(item, qi)+
      '<div class="lc-quiz-explain" id="lc-quiz-explain-'+qi+'"></div>'+
      '<div id="lc-quiz-mia-'+qi+'"></div>'+
    '</div>';
  }).join('') +
  '<div class="lc-quiz-footer"><span class="lc-quiz-score" id="lc-quiz-score">Score: 0 / '+questions.length+'</span></div>';

  document.getElementById('lc-pane-quiz').innerHTML = miaIntroHtml + toggleHtml + refreshHtml + filterHtml + '<div id="lc-quiz-cards-wrap">' + cardsHtml + '</div>';
}

function lcQuizSetFilter(filter){
  document.getElementById('lc-filter-all').classList.toggle('active', filter==='all');
  document.getElementById('lc-filter-word').classList.toggle('active', filter==='word');
  var cards = document.querySelectorAll('#lc-quiz-cards-wrap .lc-quiz-card');
  cards.forEach(function(card){
    var show = filter==='all' || card.dataset.category===filter;
    card.classList.toggle('lc-hidden', !show);
  });
  lcQuizUpdateVisibleScoreSilent();
}

function lcQuizUpdateVisibleScoreSilent(){
  // Same tally as lcQuizUpdateVisibleScore but never fires the "quiz complete" toast —
  // used when switching filters, since the student hasn't just answered anything new.
  var cards = Array.from(document.querySelectorAll('#lc-quiz-cards-wrap .lc-quiz-card'));
  var visibleCards = cards.filter(function(c){ return !c.classList.contains('lc-hidden'); });
  var correctVisible = 0;
  visibleCards.forEach(function(card){
    if(card.dataset.answered){
      var fb = document.getElementById('lc-quiz-explain-'+card.dataset.qidx);
      if(fb && fb.classList.contains('ok')) correctVisible++;
    }
  });
  var scoreEl = document.getElementById('lc-quiz-score');
  if(scoreEl) scoreEl.textContent = 'Score: '+correctVisible+' / '+visibleCards.length;
}

function lcQuizShowPractice(){
  // No-op visual reset (already on practice view) — kept for symmetry with the toggle buttons.
  var pBtn = document.getElementById('lc-mode-practice'), gBtn = document.getElementById('lc-mode-game');
  if(pBtn) pBtn.classList.add('active');
  if(gBtn) gBtn.classList.remove('active');
}

function lcRenderQuizInteraction(item, qi){
  if(item.type==='mcq'){
    var opts = item.opts.map(function(opt, oi){
      return '<button class="lc-quiz-opt" onclick="lcCheckMCQ(this,'+qi+','+oi+')">'+String.fromCharCode(65+oi)+') '+opt+'</button>';
    }).join('');
    return '<div class="lc-quiz-opts">'+opts+'</div>';
  }
  if(item.type==='fillblank'){
    return '<div class="lc-quiz-blank-row">'+
      '<input type="text" class="lc-quiz-blank-input" id="lc-quiz-blank-'+qi+'" placeholder="Type your answer..."/>'+
      '<button class="lc-quiz-blank-btn" onclick="lcCheckBlank('+qi+')">Check</button>'+
    '</div>';
  }
  if(item.type==='reorder'){
    var shuffled = item.items.map(function(text,i){ return {text:text, origIdx:i}; });
    shuffled = lcShuffleArray(shuffled);
    var itemsHtml = shuffled.map(function(it){
      return '<div class="lc-reorder-item" draggable="true" data-orig-idx="'+it.origIdx+'">'+
        '<span class="ro-handle">⠿</span><span>'+it.text+'</span>'+
      '</div>';
    }).join('');
    return '<div class="lc-reorder-list" id="lc-reorder-'+qi+'">'+itemsHtml+'</div>'+
      '<button class="lc-reorder-btn" onclick="lcCheckReorder('+qi+')">Check Order</button>';
  }
  return '';
}

function lcShuffleArray(arr){
  var a = arr.slice();
  for(var i=a.length-1;i>0;i--){
    var j = Math.floor(Math.random()*(i+1));
    var tmp = a[i]; a[i]=a[j]; a[j]=tmp;
  }
  return a;
}

function lcQuizRecordResult(qi, isCorrect, explain){
  var card = document.getElementById('lc-quiz-card-'+qi);
  if(card.dataset.answered) return; // prevent double scoring
  card.dataset.answered = '1';
  if(isCorrect){ addStars(5); }
  var fb = document.getElementById('lc-quiz-explain-'+qi);
  fb.className = 'lc-quiz-explain show ' + (isCorrect ? 'ok' : 'no');
  fb.textContent = (isCorrect ? '✅ Correct! ' : '🤔 Not quite. ') + (explain||'');
  var miaSlot = document.getElementById('lc-quiz-mia-'+qi);
  if(miaSlot){
    var line = isCorrect ? lcRandomPick(LC_QUIZ_CORRECT_LINES) : lcRandomPick(LC_QUIZ_WRONG_LINES);
    miaSlot.innerHTML = miaSay(line, {mini:true});
  }
  lcQuizUpdateVisibleScore();
}

function lcQuizUpdateVisibleScore(){
  var cards = Array.from(document.querySelectorAll('#lc-quiz-cards-wrap .lc-quiz-card'));
  var visibleCards = cards.filter(function(c){ return !c.classList.contains('lc-hidden'); });
  var answeredVisible = 0, correctVisible = 0;
  visibleCards.forEach(function(card){
    if(card.dataset.answered){
      answeredVisible++;
      var fb = document.getElementById('lc-quiz-explain-'+card.dataset.qidx);
      if(fb && fb.classList.contains('ok')) correctVisible++;
    }
  });
  var scoreEl = document.getElementById('lc-quiz-score');
  if(scoreEl) scoreEl.textContent = 'Score: '+correctVisible+' / '+visibleCards.length;
  if(answeredVisible===visibleCards.length && visibleCards.length>0){
    showToast(correctVisible===visibleCards.length ? '🌟 Perfect score!' : '👍 Quiz complete! Review and try again anytime.');
  }
}

function lcCheckMCQ(btn, qIdx, chosenIdx){
  var item = lcCurrentQuizSet[qIdx];
  var card = document.getElementById('lc-quiz-card-'+qIdx);
  if(card.dataset.answered) return;
  var opts = card.querySelectorAll('.lc-quiz-opt');
  opts.forEach(function(o,i){
    o.disabled = true;
    if(i===item.correct) o.classList.add('correct');
    else if(i===chosenIdx) o.classList.add('wrong');
  });
  lcQuizRecordResult(qIdx, chosenIdx===item.correct, item.explain);
}

function lcCheckBlank(qIdx){
  var item = lcCurrentQuizSet[qIdx];
  var input = document.getElementById('lc-quiz-blank-'+qIdx);
  var val = input.value.trim().toLowerCase().replace(/,/g,'');
  var correctVal = item.answer.trim().toLowerCase().replace(/,/g,'');
  input.disabled = true;
  lcQuizRecordResult(qIdx, val===correctVal, item.explain + (val!==correctVal ? ' (Correct answer: '+item.answer+')' : ''));
}

function lcCheckReorder(qIdx){
  var item = lcCurrentQuizSet[qIdx];
  var card = document.getElementById('lc-quiz-card-'+qIdx);
  if(card.dataset.answered) return;
  var list = document.getElementById('lc-reorder-'+qIdx);
  var nodes = Array.from(list.querySelectorAll('.lc-reorder-item'));
  var currentOrder = nodes.map(function(n){ return parseInt(n.dataset.origIdx,10); });
  var isCorrect = JSON.stringify(currentOrder)===JSON.stringify(item.correctOrder);
  nodes.forEach(function(n,i){
    n.draggable = false;
    n.classList.add(item.correctOrder[i]===currentOrder[i] ? 'correct-pos' : 'wrong-pos');
  });
  lcQuizRecordResult(qIdx, isCorrect, item.explain);
}

document.addEventListener('dragstart', function(e){
  var item = e.target.closest && e.target.closest('.lc-reorder-item');
  if(!item) return;
  item.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
});

document.addEventListener('dragend', function(e){
  var item = e.target.closest && e.target.closest('.lc-reorder-item');
  if(item) item.classList.remove('dragging');
});

document.addEventListener('dragover', function(e){
  var list = e.target.closest && e.target.closest('.lc-reorder-list');
  if(!list) return;
  e.preventDefault();
  var dragging = list.querySelector('.dragging');
  if(!dragging) return;
  var after = Array.from(list.querySelectorAll('.lc-reorder-item:not(.dragging)')).find(function(sib){
    return e.clientY <= sib.getBoundingClientRect().top + sib.getBoundingClientRect().height/2;
  });
  if(after) list.insertBefore(dragging, after);
  else list.appendChild(dragging);
});
