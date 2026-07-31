function openWorksheetSubject(classNum, subjKey){
  var data = NCERT_CHAPTERS[classNum] && NCERT_CHAPTERS[classNum][subjKey];
  var subjName = SUBJECT_NAMES[subjKey] || subjKey;
  document.getElementById('wl-title').textContent = subjName + ' Worksheet — Class ' + classNum;

  var body = document.getElementById('wl-body');
  var backBtn = '<button onclick="closeWorksheetList()" style="background:none;border:none;color:var(--sky);font-weight:800;font-size:13px;cursor:pointer;margin-bottom:14px;">← Back to subjects</button>';

  if(!data){
    body.innerHTML = backBtn + '<div class="lc-practice-card"><span class="lp-q">No worksheet data available yet for this subject.</span></div>';
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
      'onclick="openWorksheetChapter(\''+classNum+'\',\''+subjKey+'\','+chIdx+')" '+
      'onmouseover="this.style.borderColor=\'var(--sun)\'" onmouseout="this.style.borderColor=\''+border+'\'">'+
      ch.i+' '+badge+ch.n+'</button>';
  });
  html += '</div>';

  body.innerHTML = html;
  showScreen('s-worksheet-list');
}

function wsBuildChapterWorksheets(ch, hardOnly){
  var pool = [];
  ch.t.forEach(function(t){
    var sets = PRACTICE_BANK[t];
    if(!sets || !sets.length) return;
    sets.forEach(function(set){
      set.forEach(function(item){ pool.push(item); });
    });
  });
  if(!pool.length) return [];

  // De-duplicate identical questions (same topic can repeat similar templated Qs across sets)
  var seen = {};
  pool = pool.filter(function(item){
    if(seen[item.q]) return false;
    seen[item.q] = true;
    return true;
  });

  // Proxy difficulty score: step-by-step working + text length = harder
  pool.forEach(function(item){
    var score = (item.steps ? item.steps.length * 10 : 0) + (item.q.length * 0.1) + (item.answer.length * 0.05);
    item._diff = score;
  });
  pool.sort(function(a,b){ return a._diff - b._diff; });

  if(hardOnly){
    // Keep only the harder ~55% of the pool — exam-level questions, not the easy warm-ups.
    var cut = Math.floor(pool.length * 0.45);
    pool = pool.slice(cut);
  }

  var WORKSHEET_SIZE = 20;
  var MAX_WORKSHEETS = 5;
  var worksheets = [];
  for(var i=0; i<pool.length && worksheets.length < MAX_WORKSHEETS; i += WORKSHEET_SIZE){
    worksheets.push(pool.slice(i, i + WORKSHEET_SIZE));
  }
  return worksheets;
}

function openWorksheetChapter(classNum, subjKey, chIdx){
  var data = NCERT_CHAPTERS[classNum][subjKey];
  var ch = data.chapters[chIdx];

  document.getElementById('wl-title').textContent = ch.n + ' — Worksheet';

  var body = document.getElementById('wl-body');
  var backBtn = '<button onclick="openWorksheetSubject(\''+classNum+'\',\''+subjKey+'\')" style="background:none;border:none;color:var(--sky);font-weight:800;font-size:13px;cursor:pointer;margin-bottom:14px;">← Back to Chapter List</button>';

  var worksheets = wsBuildChapterWorksheets(ch, true);

  if(!worksheets.length){
    body.innerHTML = backBtn + '<div class="lc-practice-card"><span class="lp-q">Worksheets coming soon for this chapter! 🚧</span></div>';
    showScreen('s-worksheet-list');
    return;
  }

  var html = backBtn + '<div style="font-size:12px;color:var(--muted);margin-bottom:12px;">Each worksheet mixes questions from every topic in this chapter, arranged from easier to harder — just like an exam paper.</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;">';
  worksheets.forEach(function(ws, wIdx){
    html += '<button class="res-card" data-type="'+subjKey+'" style="text-align:left;background:var(--white);border:2px solid var(--sun);border-radius:12px;padding:12px 14px;cursor:pointer;font-size:13px;font-weight:700;color:var(--ink);" '+
      'onclick="openWorksheetSet(\''+classNum+'\',\''+subjKey+'\','+chIdx+','+wIdx+')" '+
      'onmouseover="this.style.borderColor=\'var(--sun)\'" onmouseout="this.style.borderColor=\'var(--sun)\'">'+
      '📝 Worksheet '+(wIdx+1)+'<div style="font-size:10px;color:var(--muted);font-weight:600;margin-top:3px;">'+ws.length+' questions</div></button>';
  });
  html += '</div>';

  body.innerHTML = html;
  showScreen('s-worksheet-list');
}

var wsPracticeCtx = null;

var wsPracticeSetIdx = 0;

function openWorksheetSet(classNum, subjKey, chIdx, wIdx){
  var data = NCERT_CHAPTERS[classNum][subjKey];
  var chapterName = data.chapters[chIdx].n;
  wsPracticeCtx = { chapterName: chapterName, classNum: classNum, subjKey: subjKey, chIdx: chIdx };
  wsPracticeSetIdx = wIdx;

  document.getElementById('wl-title').textContent = chapterName + ' — Worksheet '+(wIdx+1);
  renderWorksheetPractice();
  showScreen('s-worksheet-list');
}

function renderWorksheetPractice(){
  var body = document.getElementById('wl-body');
  var backBtn = '<button class="ws-back-link" onclick="closeWorksheetTopic()">← Back to Worksheet List</button>';

  var data = NCERT_CHAPTERS[wsPracticeCtx.classNum][wsPracticeCtx.subjKey];
  var ch = data.chapters[wsPracticeCtx.chIdx];
  var worksheets = wsBuildChapterWorksheets(ch, true);

  if(!worksheets.length || wsPracticeSetIdx >= worksheets.length){
    body.innerHTML = backBtn + '<div class="ws-page"><div class="ws-q-row"><span class="ws-qline">Practice questions coming soon for this worksheet! 🚧</span></div></div>';
    return;
  }

  var questions = worksheets[wsPracticeSetIdx];
  var headHtml = '<div class="ws-page-head">'+
      '<div class="ws-head-title">'+wsPracticeCtx.chapterName+'</div>'+
      '<div class="ws-head-sub">Worksheet '+(wsPracticeSetIdx+1)+' of '+worksheets.length+'</div>'+
      '<div class="ws-head-meta">'+questions.length+' questions</div>'+
    '</div>';

  var qHtml = questions.map(function(item, i){
    var lines = item.steps ? 3 : 2;
    var blankLines = '';
    for(var k=0;k<lines;k++){ blankLines += '<div class="ws-blank-line"></div>'; }
    return '<div class="ws-q-row">'+
      '<div class="ws-num">'+(i+1)+'.</div>'+
      '<div class="ws-body">'+
        '<div class="ws-qline">'+item.q+'</div>'+
        blankLines+
      '</div>'+
    '</div>';
  }).join('');

  var keyHtml = '<div class="ws-key-section">'+
    '<button class="ws-key-toggle" onclick="wsToggleAnswerKey(this)">🔑 Show Answer Key</button>'+
    '<div class="ws-key-body">'+
    questions.map(function(item, i){
      var stepsHtml = item.steps ? (
        '<ol class="ws-key-steps">'+ item.steps.map(function(s){ return '<li>'+s+'</li>'; }).join('') +'</ol>'
      ) : '';
      return '<div class="ws-key-item">'+
        '<span class="ws-key-num">'+(i+1)+'.</span> '+
        '<span class="ws-key-ans">'+item.answer+'</span>'+
        stepsHtml+
      '</div>';
    }).join('') +
    '</div>'+
  '</div>';

  body.innerHTML = backBtn + '<div class="ws-page">' + headHtml + qHtml + '</div>' + keyHtml;
}

function wsToggleAnswerKey(btn){
  var section = btn.parentElement;
  var bodyEl = section.querySelector('.ws-key-body');
  var showing = bodyEl.classList.toggle('show');
  btn.textContent = showing ? '🔑 Hide Answer Key' : '🔑 Show Answer Key';
}

function wsSwitchPracticeSet(idx){
  wsPracticeSetIdx = idx;
  renderWorksheetPractice();
}

function closeWorksheetTopic(){
  var ctx = wsPracticeCtx;
  wsPracticeCtx = null;
  if(ctx){
    openWorksheetChapter(ctx.classNum, ctx.subjKey, ctx.chIdx);
  } else {
    document.getElementById('wl-title').textContent = 'Resources';
    showScreen('s-child');
    showPane('child','resources');
  }
}

var wsChapterTestCtx = null;

function openChapterTestSubject(classNum, subjKey){
  var data = NCERT_CHAPTERS[classNum] && NCERT_CHAPTERS[classNum][subjKey];
  var subjName = SUBJECT_NAMES[subjKey] || subjKey;
  document.getElementById('wl-title').textContent = subjName + ' Chapter Tests — Class ' + classNum;

  var body = document.getElementById('wl-body');
  var backBtn = '<button onclick="closeChapterTestList()" style="background:none;border:none;color:var(--sky);font-weight:800;font-size:13px;cursor:pointer;margin-bottom:14px;">← Back to Chapter Tests</button>';

  if(!data){
    body.innerHTML = backBtn + '<div class="lc-practice-card"><span class="lp-q">No chapters available yet for this subject.</span></div>';
    showScreen('s-worksheet-list');
    return;
  }

  var html = backBtn + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;">';
  data.chapters.forEach(function(ch, chIdx){
    var hasAny = CBSE_TEST_BANK.hasOwnProperty(ch.n) && CBSE_TEST_BANK[ch.n].length;
    var border = hasAny ? 'var(--sun)' : 'var(--border)';
    var badge = hasAny ? '' : '<span style="font-size:9px;color:var(--muted);font-weight:700;">· SOON</span> ';
    html += '<button class="res-card" style="text-align:left;background:var(--white);border:2px solid '+border+';border-radius:12px;padding:12px 14px;cursor:pointer;font-size:13px;font-weight:700;color:var(--ink);" '+
      'onclick="openChapterTestChapter(\''+classNum+'\',\''+subjKey+'\','+chIdx+')" '+
      'onmouseover="this.style.borderColor=\'var(--sun)\'" onmouseout="this.style.borderColor=\''+border+'\'">'+
      ch.i+' '+badge+ch.n+'</button>';
  });
  html += '</div>';

  body.innerHTML = html;
  showScreen('s-worksheet-list');
}

function openChapterTestChapter(classNum, subjKey, chIdx){
  var data = NCERT_CHAPTERS[classNum][subjKey];
  var ch = data.chapters[chIdx];

  document.getElementById('wl-title').textContent = ch.n + ' — Chapter Test';

  var body = document.getElementById('wl-body');
  var backBtn = '<button onclick="openChapterTestSubject(\''+classNum+'\',\''+subjKey+'\')" style="background:none;border:none;color:var(--sky);font-weight:800;font-size:13px;cursor:pointer;margin-bottom:14px;">← Back to Chapter List</button>';

  var tests = CBSE_TEST_BANK[ch.n];

  if(!tests || !tests.length){
    body.innerHTML = backBtn + '<div class="lc-practice-card"><span class="lp-q">Chapter tests coming soon — CBSE-style test papers for this chapter haven\u2019t been added yet! 🚧</span></div>';
    showScreen('s-worksheet-list');
    return;
  }

  var html = backBtn + '<div style="font-size:12px;color:var(--muted);margin-bottom:12px;">Full CBSE-format periodic test papers — 3 sections, exam-level questions, built to prepare you for school exams.</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;">';
  tests.forEach(function(t, tIdx){
    var qCount = t.A.length + t.B.length + t.C.length;
    var marks = t.A.length*1 + t.B.length*2 + t.C.length*3;
    html += '<button class="res-card" style="text-align:left;background:var(--white);border:2px solid var(--sun);border-radius:12px;padding:12px 14px;cursor:pointer;font-size:13px;font-weight:700;color:var(--ink);" '+
      'onclick="openChapterTest(\''+classNum+'\',\''+subjKey+'\','+chIdx+','+tIdx+')" '+
      'onmouseover="this.style.borderColor=\'var(--sun)\'" onmouseout="this.style.borderColor=\'var(--sun)\'">'+
      '🧪 Test '+(tIdx+1)+'<div style="font-size:10px;color:var(--muted);font-weight:600;margin-top:3px;">'+qCount+' questions · '+marks+' marks</div></button>';
  });
  html += '</div>';

  body.innerHTML = html;
  showScreen('s-worksheet-list');
}

function openChapterTest(classNum, subjKey, chIdx, tIdx){
  var data = NCERT_CHAPTERS[classNum][subjKey];
  var ch = data.chapters[chIdx];

  wsChapterTestCtx = { classNum: classNum, subjKey: subjKey, chIdx: chIdx, testIdx: tIdx };
  document.getElementById('wl-title').textContent = ch.n + ' — Test '+(tIdx+1);
  renderChapterTest();
  showScreen('s-worksheet-list');
}

function renderChapterTest(){
  var body = document.getElementById('wl-body');
  var backBtn = '<button onclick="closeChapterTest()" style="background:none;border:none;color:var(--sky);font-weight:800;font-size:13px;cursor:pointer;margin-bottom:14px;">← Back to Test List</button>';

  var data = NCERT_CHAPTERS[wsChapterTestCtx.classNum][wsChapterTestCtx.subjKey];
  var ch = data.chapters[wsChapterTestCtx.chIdx];
  var subjName = (data.name || SUBJECT_NAMES[wsChapterTestCtx.subjKey] || wsChapterTestCtx.subjKey);
  var tests = CBSE_TEST_BANK[ch.n];
  var paper = tests && tests[wsChapterTestCtx.testIdx];

  if(!paper){
    body.innerHTML = backBtn + '<div class="lc-practice-card"><span class="lp-q">Chapter test coming soon — this CBSE test paper hasn\u2019t been added yet! 🚧</span></div>';
    return;
  }

  var secA = paper.A, secB = paper.B, secC = paper.C;
  var totalQuestions = secA.length + secB.length + secC.length;
  var totalMarks = secA.length*1 + secB.length*2 + secC.length*3;
  var durationMin = Math.max(30, Math.round(totalMarks * 2.2 / 5) * 5);

  var qCounter = 0;
  var keyItems = [];

  function renderSimpleSection(label, title, items, marks){
    if(!items.length) return '';
    var head = '<div class="exam-section-head"><h4>Section '+label+' — '+title+'</h4>'+
      '<span class="es-meta">'+items.length+' × '+marks+' mark'+(marks>1?'s':'')+' = '+(items.length*marks)+' marks</span></div>';
    var sectionBody = items.map(function(item){
      qCounter++;
      var qNum = qCounter;
      keyItems.push({ num: qNum, single: item, showWorking: marks>1 });
      return '<div class="exam-q"><div class="exam-q-row">'+
        '<span class="exam-q-num">'+qNum+'.</span>'+
        '<div class="exam-q-body"><span class="exam-q-marks">['+marks+' '+(marks>1?'marks':'mark')+']</span>'+
        '<span class="exam-q-text">'+item.q+'</span></div>'+
      '</div></div>';
    }).join('');
    return head + sectionBody;
  }

  function renderLongSection(label, title, items){
    if(!items.length) return '';
    var head = '<div class="exam-section-head"><h4>Section '+label+' — '+title+'</h4>'+
      '<span class="es-meta">'+items.length+' × 3 marks = '+(items.length*3)+' marks</span></div>';
    var sectionBody = items.map(function(item){
      qCounter++;
      var qNum = qCounter;
      keyItems.push({ num: qNum, parts: item.parts, showWorking: true });
      var contextHtml = item.context ? '<div class="exam-q-context">'+item.context+'</div>' : '';
      var partsHtml = '<ol class="exam-q-sub">'+item.parts.map(function(p){
        return '<li>('+p.label+') '+p.q+'</li>';
      }).join('')+'</ol>';
      return '<div class="exam-q"><div class="exam-q-row">'+
        '<span class="exam-q-num">'+qNum+'.</span>'+
        '<div class="exam-q-body"><span class="exam-q-marks">[3 marks]</span>'+
        contextHtml + partsHtml + '</div>'+
      '</div></div>';
    }).join('');
    return head + sectionBody;
  }

  var sectionsHtml =
    renderSimpleSection('A', 'Very Short Answer', secA, 1) +
    renderSimpleSection('B', 'Short Answer', secB, 2) +
    renderLongSection('C', 'Long Answer', secC);

  var paperHtml =
    '<div class="exam-paper">'+
      '<div class="exam-head">'+
        '<div class="exam-school">BrightPath Academy · Periodic Test</div>'+
        '<h3>'+ch.n+'</h3>'+
        '<div class="exam-sub">'+subjName+' · Class '+wsChapterTestCtx.classNum+' · Test '+(wsChapterTestCtx.testIdx+1)+' of '+tests.length+'</div>'+
        '<span class="exam-pattern-tag">CBSE Pattern | NCERT Based</span>'+
      '</div>'+
      '<div class="exam-meta">'+
        '<span><span class="em-icon">⏱️</span>Time Allowed: '+durationMin+' minutes</span>'+
        '<span><span class="em-icon">📝</span>Maximum Marks: '+totalMarks+'</span>'+
      '</div>'+
      '<div class="exam-instr"><b>General Instructions:</b><ol>'+
        '<li>This question paper has 3 sections — A, B and C.</li>'+
        '<li>Section A has '+secA.length+' very short answer questions of 1 mark each.</li>'+
        (secB.length? '<li>Section B has '+secB.length+' short answer questions of 2 marks each.</li>' : '')+
        (secC.length? '<li>Section C has '+secC.length+' long answer questions of 3 marks each, based on a short context or word problem.</li>' : '')+
        '<li>Attempt all questions. Show your working where required.</li>'+
      '</ol></div>'+
      sectionsHtml+
      '<div class="exam-footer"><span class="ef-end">— End of Question Paper —</span></div>'+
    '</div>'+
    '<button class="exam-key-toggle" onclick="lcToggleExamKey(this)">🔑 Show Answer Key</button>'+
    '<div class="exam-key">'+
      '<h4>✅ Answer Key</h4>'+
      keyItems.map(function(k){
        if(k.parts){
          var partsAnsHtml = k.parts.map(function(p){
            var stepsHtml = p.steps ? (
              '<div class="lp-steps show"><div class="lp-steps-label">📝 Step-by-Step</div><ol>'+
                p.steps.map(function(s){ return '<li>'+s+'</li>'; }).join('')+
              '</ol></div>'
            ) : '';
            return '<div style="margin-top:6px;"><b style="color:var(--plum);">('+p.label+')</b> <span class="ek-ans">'+p.answer+'</span>'+stepsHtml+'</div>';
          }).join('');
          return '<div class="exam-key-item"><b>Q'+k.num+'.</b>'+partsAnsHtml+'</div>';
        }
        var stepsHtml = (k.showWorking && k.single.steps) ? (
          '<div class="lp-steps show"><div class="lp-steps-label">📝 Step-by-Step</div><ol>'+
            k.single.steps.map(function(s){ return '<li>'+s+'</li>'; }).join('')+
          '</ol></div>'
        ) : '';
        return '<div class="exam-key-item"><b>Q'+k.num+'.</b><span class="ek-ans">'+k.single.answer+'</span>'+stepsHtml+'</div>';
      }).join('')+
    '</div>';

  var progressHtml = '<div class="lp-set-progress">Test '+(wsChapterTestCtx.testIdx+1)+' of '+tests.length+' · '+totalQuestions+' questions · '+totalMarks+' marks · CBSE format</div>';

  body.innerHTML = backBtn + progressHtml + paperHtml;
}

function lcToggleExamKey(btn){
  var key = btn.nextElementSibling;
  var showing = key.classList.toggle('show');
  btn.textContent = showing ? '🔑 Hide Answer Key' : '🔑 Show Answer Key';
  if(showing){ key.scrollIntoView({behavior:'smooth', block:'nearest'}); }
}

function closeChapterTest(){
  if(wsChapterTestCtx){
    openChapterTestChapter(wsChapterTestCtx.classNum, wsChapterTestCtx.subjKey, wsChapterTestCtx.chIdx);
  }
  wsChapterTestCtx = null;
}

function closeChapterTestList(){
  document.getElementById('wl-title').textContent = 'Resources';
  showScreen('s-child');
  showPane('child','resources');
}

function closeWorksheetList(){
  showScreen('s-child');
  showPane('child','resources');
}
