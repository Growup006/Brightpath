var currentRole='child', currentLesson={subject:'',topic:'',profile:''};

var currentSubject = null;

var currentChapterCtx = null;

function getChapterProgress(subjKey){
  var key = currentChildClass+'_'+subjKey;
  if(!CURRENT_USER.chapterProgress) CURRENT_USER.chapterProgress = {};
  if(!CURRENT_USER.chapterProgress[key]){
    var base = 0;
    var section = document.querySelector('#cpane-subjects [data-class="'+currentChildClass+'"]');
    if(section){
      section.querySelectorAll('.subj').forEach(function(card){
        var nameEl = card.querySelector('.subj-name');
        if(!nameEl) return;
        var cardKey = nameEl.textContent.toLowerCase().replace('mathematics','maths').replace('social science','sst').replace('emotional learning','life').replace('life skills','life');
        if(cardKey===subjKey){
          var fill = card.querySelector('.prog-fill');
          if(fill && fill.style.width) base = parseInt(fill.style.width)||0;
        }
      });
    }
    var n = (NCERT_CHAPTERS[currentChildClass][subjKey] || {chapters:[]}).chapters.length;
    CURRENT_USER.chapterProgress[key] = new Array(n).fill(base);
  }
  return CURRENT_USER.chapterProgress[key];
}

function openSubjectChapters(subjKey, profile){
  var data = NCERT_CHAPTERS[currentChildClass] && NCERT_CHAPTERS[currentChildClass][subjKey];
  if(!data) return;
  currentSubject = { key: subjKey, profile: profile, data: data };
  document.getElementById('chap-icon').textContent = data.icon;
  document.getElementById('chap-title').textContent = data.name;
  document.getElementById('chap-sub').textContent = 'Class '+currentChildClass+' · Pick a chapter to start learning';
  renderChapters();
  showPane('child','chapters');
}

function renderChapters(){
  if(!currentSubject) return;
  var subjKey = currentSubject.key;
  var data = currentSubject.data;
  var prog = getChapterProgress(subjKey);
  var list = document.getElementById('chapter-list');
  list.innerHTML = data.chapters.map(function(ch, idx){
    var pct = Math.round(prog[idx]||0);
    var topicsHtml = ch.t.map(function(topic, tIdx){
      var done = (CURRENT_USER.completedTopics||{})[currentChildClass+'_'+subjKey+'_'+idx+'_'+tIdx];
      return '<div style="display:flex;justify-content:space-between;align-items:center;background:'+(done?'var(--leaf-light)':'var(--bg)')+';border:none;border-radius:10px;padding:9px 12px;margin-bottom:6px;">'+
        '<span style="text-align:left;font-family:var(--font);font-size:12px;font-weight:700;color:'+(done?'var(--leaf)':'var(--text)')+';flex:1;cursor:pointer;">'+(done?'✅ ':'▶ ')+topic+'</span>'+
        '<div style="display:flex;gap:6px;">'+
          '<button class="topic-5tabs-btn" onclick="event.stopPropagation();openLearningCenter(\''+topic+'\', \''+ch.n+'\', \''+data.name+'\')" title="5 Learning Sections" style="background:var(--white);border:1.5px solid var(--border);border-radius:6px;padding:5px 10px;cursor:pointer;font-size:13px;font-weight:700;transition:.2s;">📚 Learn</button>'+
        '</div>'+
      '</div>';
    }).join('');
    return '<div class="chapter-card" style="background:var(--white);border:2px solid var(--border);border-radius:var(--radius);overflow:hidden;">'+
      '<div onclick="toggleChapter(this)" style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;">'+
        '<div style="font-size:24px;">'+ch.i+'</div>'+
        '<div style="flex:1;min-width:0;">'+
          '<div style="font-weight:800;font-size:14px;margin-bottom:6px;">'+ch.n+'</div>'+
          '<div style="height:6px;background:var(--bg);border-radius:50px;overflow:hidden;"><div style="height:100%;width:'+pct+'%;background:'+data.color+';border-radius:50px;"></div></div>'+
        '</div>'+
        '<div style="font-size:12px;font-weight:800;color:var(--muted);min-width:40px;text-align:right;">'+pct+'%</div>'+
        '<div class="chev" style="font-size:14px;color:var(--muted);transition:.2s;">▾</div>'+
      '</div>'+
      '<div class="chapter-topics" style="display:none;padding:0 16px 14px 52px;flex-direction:column;gap:6px;">'+topicsHtml+'</div>'+
    '</div>';
  }).join('');
}

function toggleChapter(headerEl){
  var card = headerEl.closest('.chapter-card');
  var topics = card.querySelector('.chapter-topics');
  var chev = card.querySelector('.chev');
  var open = topics.style.display==='flex';
  topics.style.display = open ? 'none' : 'flex';
  chev.textContent = open ? '▾' : '▴';
}

function startChapterTopic(chIdx, tIdx){
  if(!currentSubject) return;
  var data = currentSubject.data;
  var ch = data.chapters[chIdx];
  var topic = ch.t[tIdx];
  currentChapterCtx = { subjKey: currentSubject.key, classNum: currentChildClass, chIdx: chIdx, tIdx: tIdx, numTopics: ch.t.length, chapterName: ch.n };
  openLesson(data.name, ch.n+' — '+topic, currentSubject.profile);
}
