function openFlashcardSubject(classNum, subjKey){
  var data = NCERT_CHAPTERS[classNum] && NCERT_CHAPTERS[classNum][subjKey];
  var subjName = SUBJECT_NAMES[subjKey] || subjKey;
  document.getElementById('wl-title').textContent = subjName + ' Flashcards — Class ' + classNum;

  var body = document.getElementById('wl-body');
  var backBtn = '<button onclick="closeWorksheetList()" style="background:none;border:none;color:var(--sky);font-weight:800;font-size:13px;cursor:pointer;margin-bottom:14px;">← Back to subjects</button>';

  if(!data){
    body.innerHTML = backBtn + '<div class="lc-practice-card"><span class="lp-q">No flashcards available yet for this subject.</span></div>';
    showScreen('s-worksheet-list');
    return;
  }

  var html = backBtn + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;">';
  data.chapters.forEach(function(ch, chIdx){
    if(!ch.t.length) return;
    var hasAny = ch.t.some(function(t){ return PRACTICE_BANK.hasOwnProperty(t); });
    var border = hasAny ? 'var(--sun)' : 'var(--border)';
    var badge = hasAny ? '' : '<span style="font-size:9px;color:var(--muted);font-weight:700;">· SOON</span> ';
    html += '<button class="res-card" style="text-align:left;background:var(--white);border:2px solid '+border+';border-radius:12px;padding:12px 14px;cursor:pointer;font-size:13px;font-weight:700;color:var(--ink);" '+
      'onclick="openFlashcardChapter(\''+classNum+'\',\''+subjKey+'\','+chIdx+')" '+
      'onmouseover="this.style.borderColor=\'var(--sun)\'" onmouseout="this.style.borderColor=\''+border+'\'">'+
      ch.i+' '+badge+ch.n+'</button>';
  });
  html += '</div>';

  body.innerHTML = html;
  showScreen('s-worksheet-list');
}

function fcBuildDeck(ch){
  var pool = [];
  var diffBySetIdx = ['easy', 'medium', 'hard'];
  ch.t.forEach(function(t){
    var sets = PRACTICE_BANK[t];
    if(!sets || !sets.length) return;
    sets.forEach(function(set, setIdx){
      var diff = diffBySetIdx[setIdx] || 'hard';
      set.forEach(function(item){ pool.push({ q: item.q, a: item.answer, diff: diff, explain: item.answer }); });
    });
  });
  var seen = {};
  pool = pool.filter(function(item){
    if(seen[item.q]) return false;
    seen[item.q] = true;
    return true;
  });
  pool = pool.slice(0, 30);
  var order = { easy: 0, medium: 1, hard: 2 };
  pool.sort(function(a, b){ return order[a.diff] - order[b.diff]; });
  return pool;
}

function fcBuildNotes(ch){
  var notes = [];
  ch.t.forEach(function(t){
    var key = resolveContentKey(t, ch.n);
    (CHAPTER_NOTES[key] || CHAPTER_NOTES[t] || []).forEach(function(n){
      notes.push({ topic: t, icon: n.icon, title: n.title, concept: n.concept, keyPoints: n.keyPoints, example: n.example, flowchart: n.flowchart, mistakes: n.mistakes, quickRevision: n.quickRevision });
    });
  });
  return notes;
}

function fcBuildWordProblems(ch){
  var probs = [];
  ch.t.forEach(function(t){
    var key = resolveContentKey(t, ch.n);
    (WORD_PROBLEMS[key] || WORD_PROBLEMS[t] || []).forEach(function(p){
      probs.push({ topic: t, q: p.q, hint: p.hint, answer: p.answer, solution: p.solution });
    });
  });
  return probs;
}

var fcCtx = null;

function openFlashcardChapter(classNum, subjKey, chIdx){
  var data = NCERT_CHAPTERS[classNum][subjKey];
  var ch = data.chapters[chIdx];
  var deck = fcBuildDeck(ch);
  var notes = fcBuildNotes(ch);
  var wordProblems = fcBuildWordProblems(ch);

  if(!deck.length && !notes.length && !wordProblems.length){
    document.getElementById('fc-title').textContent = ch.n + ' — Flashcards';
    document.getElementById('fc-body').innerHTML =
      '<button onclick="openFlashcardSubject(\''+classNum+'\',\''+subjKey+'\')" style="background:none;border:none;color:var(--sky);font-weight:800;font-size:13px;cursor:pointer;margin-bottom:14px;">← Back to Chapter List</button>'+
      '<div class="lc-practice-card"><span class="lp-q">Flashcards coming soon for this chapter! 🚧</span></div>';
    showScreen('s-flashcard-viewer');
    return;
  }

  fcCtx = { classNum: classNum, subjKey: subjKey, chIdx: chIdx, chapterName: ch.n, mode: notes.length ? 'study' : 'practice',
    queue: deck.slice(), known: 0, total: deck.length, flipped: false, notes: notes, noteIdx: 0,
    wordProblems: wordProblems, wpIdx: 0, wpStep: 'question', wpXP: 0, wpStars: 0,
    pStep: 'question', pStreak: 0, pFeedback: '', pAttempt: 1, pPicked: null, pLevel: 'medium', answered: [], reviewQueue: [] };
  document.getElementById('fc-title').textContent = ch.n + ' — Flashcards';
  fcRender();
  showScreen('s-flashcard-viewer');
}

function fcSwitchMode(mode){
  fcCtx.mode = mode;
  fcCtx.flipped = false;
  fcRender();
}

function fcModeTabs(){
  var studyOn = fcCtx.mode === 'study';
  var practiceOn = fcCtx.mode === 'practice';
  var wpOn = fcCtx.mode === 'wordproblems';
  return '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">'+
    '<button onclick="fcSwitchMode(\'study\')" style="flex:1;min-width:110px;padding:10px;border-radius:10px;border:2px solid var(--sky);cursor:pointer;font-weight:800;font-size:13px;'+
      (studyOn ? 'background:var(--sky);color:var(--white);' : 'background:var(--white);color:var(--sky);')+'">📝 Study Mode</button>'+
    '<button onclick="fcSwitchMode(\'practice\')" style="flex:1;min-width:110px;padding:10px;border-radius:10px;border:2px solid var(--sun);cursor:pointer;font-weight:800;font-size:13px;'+
      (practiceOn ? 'background:var(--sun);color:var(--white);' : 'background:var(--white);color:var(--sun);')+'">❓ Practice Mode</button>'+
    '<button onclick="fcSwitchMode(\'wordproblems\')" style="flex:1;min-width:110px;padding:10px;border-radius:10px;border:2px solid var(--plum);cursor:pointer;font-weight:800;font-size:13px;'+
      (wpOn ? 'background:var(--plum);color:var(--white);' : 'background:var(--white);color:var(--plum);')+'">🧩 Word Problems</button>'+
  '</div>';
}

function fcRender(){
  var body = document.getElementById('fc-body');
  var backBtn = '<button onclick="fcBackToChapterList()" style="background:var(--sky);border:2px solid var(--sky);color:var(--white);font-weight:800;font-size:13px;cursor:pointer;padding:10px 20px;border-radius:10px;margin-bottom:14px;box-shadow:0 3px 0 rgba(0,0,0,.15);">← Back to Chapter List</button>';
  var tabs = fcModeTabs();

  if(fcCtx.mode === 'study'){
    fcRenderStudy(body, backBtn, tabs);
  } else if(fcCtx.mode === 'wordproblems'){
    fcRenderWordProblems(body, backBtn, tabs);
  } else {
    fcRenderPractice(body, backBtn, tabs);
  }
}

function fcRenderStudy(body, backBtn, tabs){
  if(!fcCtx.notes.length){
    body.innerHTML = backBtn + tabs +
      '<div class="lc-practice-card"><span class="lp-q">No revision notes yet for this chapter.</span></div>';
    return;
  }

  var note = fcCtx.notes[fcCtx.noteIdx];
  var progressHtml = '<div class="lp-set-progress">Note '+(fcCtx.noteIdx+1)+' of '+fcCtx.notes.length+' · '+note.topic+'</div>';

  function bulletList(items, color){
    return '<ul style="margin:0;padding-left:0;list-style:none;">' + items.map(function(it){
      return '<li style="display:flex;gap:8px;margin-bottom:6px;font-size:13px;line-height:1.5;color:var(--ink);">'+
        '<span style="color:'+color+';font-weight:900;flex-shrink:0;">•</span><span>'+it+'</span></li>';
    }).join('') + '</ul>';
  }

  function sectionBox(emoji, heading, innerHtml, accent){
    return '<div style="background:var(--white);border:1.5px solid '+accent+';border-radius:12px;padding:14px 16px;margin-bottom:12px;">'+
      '<div style="font-size:12px;font-weight:800;color:'+accent+';text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px;">'+emoji+' '+heading+'</div>'+
      innerHtml+
    '</div>';
  }

  var headerHtml =
    '<div style="position:relative;overflow:hidden;background:linear-gradient(135deg, var(--sky-light,#EAF2FD) 0%, #FFFFFF 60%, var(--sun-light,#FFF1E4) 100%);border:2px solid var(--sky);border-radius:16px 16px 0 0;padding:20px;text-align:center;">'+
      '<div style="position:absolute;top:-20px;right:-20px;width:90px;height:90px;border-radius:50%;background:var(--sky);opacity:.08;"></div>'+
      '<div style="position:relative;font-size:34px;line-height:1;margin-bottom:6px;">'+note.icon+'</div>'+
      '<div style="position:relative;font-size:11px;font-weight:800;color:var(--sky);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">'+note.topic+'</div>'+
      '<div style="position:relative;font-size:18px;font-weight:800;color:var(--ink);">'+note.title+'</div>'+
    '</div>';

  var conceptHtml = sectionBox('🔹', 'Concept Explanation', bulletList(note.concept, 'var(--sky)'), 'var(--sky)');
  var keyPointsHtml = sectionBox('🔹', 'Key Points / Formula', bulletList(note.keyPoints, 'var(--plum)'), 'var(--plum)');

  var exampleInner =
    '<div style="font-size:13px;font-weight:700;color:var(--ink);margin-bottom:6px;">Q: '+note.example.q+'</div>'+
    bulletList(note.example.steps, 'var(--leaf)') +
    '<div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--leaf);font-size:13px;font-weight:800;color:var(--leaf);">✓ '+note.example.answer+'</div>';
  var exampleHtml = sectionBox('🔹', 'Example', exampleInner, 'var(--leaf)');

  var flowInner = '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:12px;">' +
    note.flowchart.map(function(step, idx){
      var box = '<span style="background:var(--sun-light,#FFF1E4);border:1px solid var(--sun);border-radius:8px;padding:5px 10px;font-weight:700;color:var(--ink);white-space:nowrap;">'+step+'</span>';
      var arrow = idx < note.flowchart.length - 1 ? '<span style="color:var(--sun);font-weight:900;">→</span>' : '';
      return box + arrow;
    }).join('') + '</div>';
  var flowHtml = sectionBox('🔹', 'Flowchart', flowInner, 'var(--sun)');

  var mistakesHtml = sectionBox('🔹', 'Common Mistakes', bulletList(note.mistakes, 'var(--rose)'), 'var(--rose)');

  var quickRevInner = '<div style="display:flex;flex-direction:column;gap:6px;">' +
    note.quickRevision.map(function(it){
      return '<div style="font-size:13px;font-weight:700;color:var(--ink);background:var(--sky-light,#EAF2FD);border-radius:8px;padding:6px 10px;">⚡ '+it+'</div>';
    }).join('') + '</div>';
  var quickRevHtml = sectionBox('🔹', 'Quick Revision Box', quickRevInner, 'var(--sky)');

  var cardHtml =
    '<div style="border:2px solid var(--sky);border-top:none;border-radius:0 0 16px 16px;padding:16px;margin-bottom:16px;background:var(--paper,#FAF6F0);">'+
      conceptHtml + keyPointsHtml + exampleHtml + flowHtml + mistakesHtml + quickRevHtml +
    '</div>';

  var navHtml = '<div style="display:flex;gap:12px;justify-content:center;">'+
    '<button onclick="fcNoteNav(-1)" style="padding:12px 26px;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer;'+
      (fcCtx.noteIdx===0 ? 'background:#E5E5E5;color:#999;border:2px solid #E5E5E5;opacity:.6;cursor:not-allowed;' : 'background:var(--sky);color:var(--white);border:2px solid var(--sky);box-shadow:0 3px 0 rgba(0,0,0,.15);')+
      '" '+(fcCtx.noteIdx===0 ? 'disabled' : '')+'>← Previous</button>'+
    '<button onclick="fcNoteNav(1)" style="padding:12px 26px;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer;'+
      (fcCtx.noteIdx===fcCtx.notes.length-1 ? 'background:#E5E5E5;color:#999;border:2px solid #E5E5E5;opacity:.6;cursor:not-allowed;' : 'background:var(--sun);color:var(--white);border:2px solid var(--sun);box-shadow:0 3px 0 rgba(0,0,0,.15);')+
      '" '+(fcCtx.noteIdx===fcCtx.notes.length-1 ? 'disabled' : '')+'>Next →</button>'+
  '</div>';

  body.innerHTML = backBtn + tabs + progressHtml + headerHtml + cardHtml + navHtml;
}

function fcNoteNav(dir){
  var next = fcCtx.noteIdx + dir;
  if(next < 0 || next >= fcCtx.notes.length) return;
  fcCtx.noteIdx = next;
  fcRender();
}

function fcMiaBubble(text){
  return '<div style="display:flex;gap:10px;align-items:flex-start;background:var(--sun-light,#FFF1E4);border:1.5px solid var(--sun);border-radius:12px;padding:10px 14px;margin-bottom:14px;">'+
    '<div style="font-size:26px;flex-shrink:0;">🦊</div>'+
    '<div style="font-size:13px;font-weight:600;color:var(--ink);line-height:1.4;padding-top:4px;">'+text+'</div>'+
  '</div>';
}

function fcRenderWordProblems(body, backBtn, tabs){
  if(!fcCtx.wordProblems.length){
    body.innerHTML = backBtn + tabs +
      '<div class="lc-practice-card"><span class="lp-q">Word problems coming soon for this chapter! 🚧</span></div>';
    return;
  }

  if(fcCtx.wpIdx >= fcCtx.wordProblems.length){
    body.innerHTML = backBtn + tabs +
      '<div class="lc-practice-card" style="text-align:center;">'+
      '<div style="font-size:40px;margin-bottom:8px;">🏆</div>'+
      '<div style="font-weight:800;font-size:16px;margin-bottom:6px;">All word problems done!</div>'+
      '<div style="font-size:13px;color:var(--muted);margin-bottom:6px;">You earned '+fcCtx.wpXP+' XP and '+fcCtx.wpStars+' ⭐ across '+fcCtx.wordProblems.length+' problems.</div>'+
      fcMiaBubble('Amazing work! You worked through every word problem in this chapter. Proud of you! 🦊🎉')+
      '<button class="lp-toggle" onclick="fcWPRestart()">🔄 Restart</button>'+
      '</div>';
    return;
  }

  var p = fcCtx.wordProblems[fcCtx.wpIdx];
  var progressHtml = '<div class="lp-set-progress">Problem '+(fcCtx.wpIdx+1)+' of '+fcCtx.wordProblems.length+' · '+p.topic+' · ⚡ '+fcCtx.wpXP+' XP · ⭐ '+fcCtx.wpStars+'</div>';

  var stepBody = '';
  if(fcCtx.wpStep === 'question'){
    stepBody =
      fcMiaBubble('Read the problem carefully. Take your time — you\'ve got this! 🦊')+
      '<div style="background:var(--white);border:2px solid var(--plum);border-radius:14px;padding:22px;margin-bottom:14px;">'+
        '<div style="font-size:11px;font-weight:800;color:var(--plum);text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px;">🧩 Word Problem</div>'+
        '<div style="font-size:15px;font-weight:700;color:var(--ink);line-height:1.5;">'+p.q+'</div>'+
      '</div>'+
      '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">'+
        '<button onclick="fcWPStep(\'hint\')" style="background:var(--sun);color:var(--white);border:2px solid var(--sun);font-weight:800;font-size:14px;padding:12px 26px;border-radius:12px;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.15);">💡 Hint</button>'+
        '<button onclick="fcWPStep(\'answer\')" style="background:var(--plum);color:var(--white);border:2px solid var(--plum);font-weight:800;font-size:14px;padding:12px 26px;border-radius:12px;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.15);">Show Answer</button>'+
      '</div>';
  } else if(fcCtx.wpStep === 'hint'){
    stepBody =
      fcMiaBubble('Here\'s a nudge in the right direction — think it through before checking the answer!')+
      '<div style="background:var(--white);border:2px solid var(--plum);border-radius:14px;padding:22px;margin-bottom:14px;">'+
        '<div style="font-size:11px;font-weight:800;color:var(--plum);text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px;">🧩 Word Problem</div>'+
        '<div style="font-size:15px;font-weight:700;color:var(--ink);line-height:1.5;margin-bottom:14px;">'+p.q+'</div>'+
        '<div style="background:var(--sun-light,#FFF1E4);border:1.5px dashed var(--sun);border-radius:10px;padding:12px 14px;">'+
          '<div style="font-size:11px;font-weight:800;color:var(--sun);margin-bottom:4px;">💡 HINT</div>'+
          '<div style="font-size:13px;font-weight:600;color:var(--ink);">'+p.hint+'</div>'+
        '</div>'+
      '</div>'+
      '<div style="display:flex;gap:10px;justify-content:center;">'+
        '<button onclick="fcWPStep(\'answer\')" style="background:var(--plum);color:var(--white);border:2px solid var(--plum);font-weight:800;font-size:14px;padding:12px 26px;border-radius:12px;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.15);">Show Answer</button>'+
      '</div>';
  } else if(fcCtx.wpStep === 'answer'){
    stepBody =
      fcMiaBubble('Great effort working through that! Here\'s the answer — check it against your thinking.')+
      '<div style="background:var(--white);border:2px solid var(--plum);border-radius:14px;padding:22px;margin-bottom:14px;">'+
        '<div style="font-size:11px;font-weight:800;color:var(--plum);text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px;">🧩 Word Problem</div>'+
        '<div style="font-size:14px;font-weight:600;color:var(--ink);line-height:1.5;margin-bottom:14px;">'+p.q+'</div>'+
        '<div style="background:var(--leaf-light,#E7F7EF);border:1.5px solid var(--leaf);border-radius:10px;padding:12px 14px;">'+
          '<div style="font-size:11px;font-weight:800;color:var(--leaf);margin-bottom:4px;">✅ ANSWER</div>'+
          '<div style="font-size:15px;font-weight:800;color:var(--ink);">'+p.answer+'</div>'+
        '</div>'+
      '</div>'+
      '<div style="display:flex;gap:10px;justify-content:center;">'+
        '<button onclick="fcWPStep(\'solution\')" style="background:var(--sky);color:var(--white);border:2px solid var(--sky);font-weight:800;font-size:14px;padding:12px 26px;border-radius:12px;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.15);">See Full Solution</button>'+
      '</div>';
  } else if(fcCtx.wpStep === 'solution'){
    var stepsHtml = p.solution.map(function(s, i){
      return '<div style="display:flex;gap:8px;margin-bottom:8px;font-size:13px;line-height:1.5;color:var(--ink);">'+
        '<span style="background:var(--sky);color:var(--white);border-radius:50%;width:20px;height:20px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;">'+(i+1)+'</span>'+
        '<span>'+s+'</span></div>';
    }).join('');
    stepBody =
      fcMiaBubble('Nicely done! Here\'s the step-by-step breakdown so you know exactly how we got there. +10 XP for finishing this one! ⭐')+
      '<div style="background:var(--white);border:2px solid var(--sky);border-radius:14px;padding:22px;margin-bottom:14px;">'+
        '<div style="font-size:11px;font-weight:800;color:var(--sky);text-transform:uppercase;letter-spacing:.4px;margin-bottom:10px;">📘 Step-by-Step Solution</div>'+
        stepsHtml+
        '<div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--leaf);font-size:14px;font-weight:800;color:var(--leaf);">✓ '+p.answer+'</div>'+
      '</div>'+
      '<div style="display:flex;gap:10px;justify-content:center;">'+
        '<button onclick="fcWPNext()" style="background:var(--plum);color:var(--white);border:2px solid var(--plum);font-weight:800;font-size:14px;padding:12px 26px;border-radius:12px;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.15);">Next Problem →</button>'+
      '</div>';
  }

  body.innerHTML = backBtn + tabs + progressHtml + stepBody;
}

function fcWPStep(step){
  if(step === 'solution' && fcCtx.wpStep !== 'solution'){
    fcCtx.wpXP += 10;
    fcCtx.wpStars += 1;
  }
  fcCtx.wpStep = step;
  fcRender();
}

function fcWPNext(){
  fcCtx.wpIdx += 1;
  fcCtx.wpStep = 'question';
  fcRender();
}

function fcWPRestart(){
  fcCtx.wpIdx = 0;
  fcCtx.wpStep = 'question';
  fcCtx.wpXP = 0;
  fcCtx.wpStars = 0;
  fcRender();
}

function fcDiffBadge(diff){
  var map = {
    easy: { label: 'EASY', color: 'var(--leaf)', bg: 'var(--leaf-light,#E7F7EF)' },
    medium: { label: 'MEDIUM', color: 'var(--sun)', bg: 'var(--sun-light,#FFF1E4)' },
    hard: { label: 'HARD', color: 'var(--rose)', bg: 'var(--rose-light,#FBE7EE)' }
  };
  var d = map[diff] || map.easy;
  return '<span style="background:'+d.bg+';color:'+d.color+';font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px;letter-spacing:.4px;">'+d.label+'</span>';
}

function fcProgressBar(reviewed, total){
  var pct = total ? Math.round((reviewed / total) * 100) : 0;
  return '<div style="background:#EEE;border-radius:20px;height:8px;width:100%;overflow:hidden;margin-bottom:8px;">'+
    '<div style="background:var(--sun);height:100%;width:'+pct+'%;border-radius:20px;transition:width .3s;"></div>'+
  '</div>';
}

function fcRenderPractice(body, backBtn, tabs){
  if(!fcCtx.queue.length){
    body.innerHTML = backBtn + tabs +
      '<div class="lc-practice-card" style="text-align:center;">'+
      '<div style="font-size:40px;margin-bottom:8px;">🎉</div>'+
      '<div style="font-weight:800;font-size:16px;margin-bottom:6px;">Practice complete!</div>'+
      '<div style="font-size:13px;color:var(--muted);margin-bottom:6px;">You answered all '+fcCtx.total+' questions in '+fcCtx.chapterName+'.</div>'+
      fcMiaBubble('You powered through the whole set — awesome work! 🦊🎉')+
      '<button class="lp-toggle" onclick="fcRestart()">🔄 Restart Practice</button>'+
      '</div>';
    return;
  }

  var reviewed = fcCtx.total - fcCtx.queue.length;
  var card = fcCtx.queue[0];
  if(!card._opts) fcBuildOptions(card);

  var progressHtml =
    fcProgressBar(reviewed, fcCtx.total) +
    '<div class="lp-set-progress">Question '+(reviewed+1)+' of '+fcCtx.total+' · '+fcCtx.known+' correct'+(fcCtx.pStreak > 1 ? ' · 🔥 '+fcCtx.pStreak+' streak' : '')+'</div>';

  var badgeRow = '<div style="text-align:center;margin-bottom:10px;">'+fcDiffBadge(card.diff)+'</div>';

  var miaHtml = '';
  if(fcCtx.pFeedback){
    miaHtml = fcMiaBubble(fcCtx.pFeedback);
  } else if(fcCtx.pStep === 'hint'){
    miaHtml = fcMiaBubble('No worries — here\'s a nudge. Pick again!');
  } else {
    miaHtml = fcMiaBubble('Pick the answer you think is correct.');
  }

  var optsHtml = '';
  if(fcCtx.pStep === 'result'){
    optsHtml = card._opts.map(function(opt){
      var isCorrect = opt === card.a;
      var wasPicked = opt === fcCtx.pPicked;
      var style = 'background:var(--white);border-color:var(--border);color:var(--ink);';
      if(isCorrect) style = 'background:var(--leaf-light);border-color:var(--leaf);color:var(--leaf);';
      else if(wasPicked) style = 'background:var(--rose-light);border-color:var(--rose);color:var(--rose);';
      return '<div style="'+style+'border:2px solid;border-radius:12px;padding:12px 16px;font-weight:700;font-size:14px;text-align:left;">'+
        (isCorrect ? '✅ ' : (wasPicked ? '❌ ' : ''))+opt+'</div>';
    }).join('');
  } else {
    optsHtml = card._opts.map(function(opt, i){
      var escaped = opt.replace(/'/g,"\\'");
      return '<button onclick="fcAnswer(\''+escaped+'\')" style="background:var(--white);border:2px solid var(--border);border-radius:12px;padding:12px 16px;font-weight:700;font-size:14px;text-align:left;cursor:pointer;transition:.15s;width:100%;font-family:var(--font);" onmouseover="this.style.borderColor=\'var(--sky)\'" onmouseout="this.style.borderColor=\'var(--border)\'">'+opt+'</button>';
    }).join('');
  }

  var explainHtml = '';
  if(fcCtx.pStep === 'result' && card.explain){
    explainHtml = '<div style="background:var(--sky-light,#EAF3FD);border:1.5px dashed var(--sky);border-radius:10px;padding:10px 14px;font-size:13px;font-weight:600;color:var(--ink);margin-top:12px;">📘 '+card.explain+'</div>';
  }

  var hintHtml = '';
  if(fcCtx.pStep === 'hint'){
    hintHtml = '<div style="background:var(--sun-light,#FFF1E4);border:1.5px dashed var(--sun);border-radius:10px;padding:10px 14px;font-size:13px;font-weight:600;color:var(--ink);margin-top:12px;">💡 '+fcHintFor(card)+'</div>';
  }

  var cardHtml =
    '<div style="background:var(--white);border:2px solid var(--sun);border-radius:16px;padding:24px;margin-bottom:16px;">'+
      '<div style="font-size:11px;font-weight:800;color:var(--sky);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;">❓ Question</div>'+
      '<div style="font-size:16px;font-weight:700;color:var(--ink);margin-bottom:16px;">'+card.q+'</div>'+
      '<div style="display:flex;flex-direction:column;gap:10px;">'+optsHtml+'</div>'+
      hintHtml+explainHtml+
    '</div>';

  var actionsHtml;
  if(fcCtx.pStep === 'result'){
    actionsHtml = '<div style="display:flex;gap:10px;justify-content:center;">'+
      '<button class="lp-toggle" style="background:var(--plum);color:var(--white);border-color:var(--plum);" onclick="fcNextQuestion()">Continue →</button>'+
    '</div>';
  } else if(fcCtx.pStep === 'question' && fcCtx.pAttempt === 1){
    actionsHtml = '<div style="display:flex;gap:10px;justify-content:center;">'+
      '<button class="lp-toggle" style="background:var(--sun-light,#FFF1E4);color:var(--sun);border-color:var(--sun);" onclick="fcShowHint()">💡 Hint</button>'+
    '</div>';
  } else {
    actionsHtml = '';
  }

  body.innerHTML = backBtn + tabs + progressHtml + badgeRow + miaHtml + cardHtml + actionsHtml;
}

function fcBuildOptions(card){
  // gather distractors from other cards in same difficulty pool
  var pool = (fcCtx.queue || []).concat(fcCtx.answered || []);
  var distractors = pool.filter(function(c){ return c.a !== card.a; })
    .map(function(c){ return c.a; });
  // dedupe
  var seen = {}; distractors = distractors.filter(function(a){ if(seen[a]) return false; seen[a]=true; return true; });
  distractors = distractors.sort(function(){ return Math.random()-0.5; }).slice(0,3);
  while(distractors.length < 3){ distractors.push('None of these'); }
  var opts = distractors.concat([card.a]).sort(function(){ return Math.random()-0.5; });
  card._opts = opts;
}

function fcHintFor(card){
  var map = { easy: 'Look closely at the numbers involved — the answer follows directly from the basic rule for this topic.',
    medium: 'Break the problem into smaller steps before solving — what rule applies here first?',
    hard: 'This one takes a couple of steps — work through it slowly, one rule at a time.' };
  return map[card.diff] || map.easy;
}

function fcShowHint(){
  fcCtx.pStep = 'hint';
  fcCtx.pFeedback = '';
  fcRender();
}

function fcAnswer(picked){
  var card = fcCtx.queue[0];
  var correct = picked === card.a;
  fcCtx.pPicked = picked;
  fcCtx.pStep = 'result';

  if(correct){
    fcCtx.known++;
    if(fcCtx.pAttempt === 1){
      fcCtx.pStreak = (fcCtx.pStreak || 0) + 1;
      if(fcCtx.pStreak >= 5) fcCtx.pFeedback = 'On fire! 🔥 '+fcCtx.pStreak+' correct in a row — incredible focus!';
      else if(fcCtx.pStreak >= 2){ fcCtx.pFeedback = fcCtx.pStreak+' in a row! Leveling you up. 🌟'; fcLevelUp(); }
      else fcCtx.pFeedback = 'Nice one! That\'s correct. 🦊';
    } else {
      fcCtx.pStreak = 0;
      fcCtx.pFeedback = 'Good recovery! 👍 Got it on the retry.';
    }
  } else {
    if(fcCtx.pAttempt === 1){
      fcCtx.pFeedback = 'Not quite — check the hint below and try again.';
      fcCtx.pStep = 'hint';
      fcCtx.pAttempt = 2;
      fcRender();
      return;
    } else {
      fcCtx.pStreak = 0;
      fcCtx.pFeedback = 'Here\'s the full explanation — this one\'s queued for review.';
      fcLevelDown();
      fcCtx.reviewQueue = fcCtx.reviewQueue || [];
      fcCtx.reviewQueue.push(card);
    }
  }
  fcRender();
}

function fcLevelUp(){
  var order = ['easy','medium','hard'];
  var i = order.indexOf(fcCtx.pLevel || 'medium');
  fcCtx.pLevel = order[Math.min(i+1, 2)];
}

function fcLevelDown(){
  var order = ['easy','medium','hard'];
  var i = order.indexOf(fcCtx.pLevel || 'medium');
  fcCtx.pLevel = order[Math.max(i-1, 0)];
}

function fcNextQuestion(){
  var card = fcCtx.queue.shift();
  fcCtx.answered = fcCtx.answered || [];
  fcCtx.answered.push(card);
  fcCtx.pStep = 'question';
  fcCtx.pAttempt = 1;
  fcCtx.pPicked = null;
  fcCtx.pFeedback = '';
  fcRender();
}

function fcRestart(){
  var data = NCERT_CHAPTERS[fcCtx.classNum][fcCtx.subjKey];
  var ch = data.chapters[fcCtx.chIdx];
  var deck = fcBuildDeck(ch);
  fcCtx.queue = deck.slice();
  fcCtx.answered = [];
  fcCtx.reviewQueue = [];
  fcCtx.known = 0;
  fcCtx.total = deck.length;
  fcCtx.flipped = false;
  fcCtx.pStep = 'question';
  fcCtx.pAttempt = 1;
  fcCtx.pPicked = null;
  fcCtx.pLevel = 'medium';
  fcCtx.pStreak = 0;
  fcCtx.pFeedback = '';
  fcRender();
}

function fcBackToChapterList(){
  var ctx = fcCtx;
  fcCtx = null;
  if(ctx){
    openFlashcardSubject(ctx.classNum, ctx.subjKey);
  } else {
    closeFlashcardViewer();
  }
}

function closeFlashcardViewer(){
  fcCtx = null;
  showScreen('s-child');
  showPane('child','resources');
}
