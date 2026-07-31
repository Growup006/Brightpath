var DAILY = {
  detailsOpen: false,

  data: {
    child: [
      {
        fname: 'Arjun',
        time: '45m', lessons: 2, stars: 34, games: 2,
        mood: '😊', moodWord: 'Happy',
        moodSub: 'Great mood for learning — kept focus for the full session',
        maths: 72, english: 55, science: 88,
        aiNote: 'Arjun had a productive day! Science is excelling. Suggest spending 10 extra minutes on English reading tomorrow.',
        lessonList: [
          { icon:'🔢', name:'Fractions & Decimals',       score:'85%', time:'20 min', ok:true },
          { icon:'🔬', name:'Living & Non-living Things', score:'92%', time:'25 min', ok:true }
        ]
      },
      {
        fname: 'Priya',
        time: '30m', lessons: 1, stars: 18, games: 1,
        mood: '😴', moodWord: 'Tired',
        moodSub: 'Priya seemed low-energy today. A short break before studying helps.',
        maths: 60, english: 45, science: 70,
        aiNote: 'Priya completed 1 lesson today. English needs extra attention — try the audio reading mode together tonight.',
        lessonList: [
          { icon:'📖', name:'Sight Words Practice', score:'70%', time:'30 min', ok:true }
        ]
      }
    ]
  },

  update: function(idx) {
    var d = DAILY.data.child[idx] || DAILY.data.child[0];
    var now = new Date();
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var dateStr = days[now.getDay()] + ', ' + now.getDate() + ' ' + months[now.getMonth()];

    // Header
    var dsDate = document.getElementById('ds-date');
    if (dsDate) dsDate.textContent = dateStr;

    // Stats
    var el;
    el = document.getElementById('ds-time');    if(el) el.textContent = d.time;
    el = document.getElementById('ds-lessons'); if(el) el.textContent = d.lessons;
    el = document.getElementById('ds-stars');   if(el) el.textContent = d.stars;
    el = document.getElementById('ds-games');   if(el) el.textContent = d.games;

    // Mood
    el = document.getElementById('ds-mood-emoji'); if(el) el.textContent = d.mood;
    el = document.getElementById('ds-child-fname'); if(el) el.textContent = d.fname;
    el = document.getElementById('ds-mood-word');  if(el) el.textContent = d.moodWord;
    el = document.getElementById('ds-mood-sub');   if(el) el.textContent = d.moodSub;

    // Progress bars
    el = document.getElementById('ds-bar-maths');    if(el) el.style.width = d.maths + '%';
    el = document.getElementById('ds-pct-maths');    if(el) el.textContent = d.maths + '%';
    el = document.getElementById('ds-bar-english');  if(el) el.style.width = d.english + '%';
    el = document.getElementById('ds-pct-english');  if(el) el.textContent = d.english + '%';
    el = document.getElementById('ds-bar-science');  if(el) el.style.width = d.science + '%';
    el = document.getElementById('ds-pct-science');  if(el) el.textContent = d.science + '%';

    // AI note
    el = document.getElementById('ds-ai-note-text');
    if(el) el.textContent = d.aiNote;

    // Lesson list
    var list = document.getElementById('ds-lesson-list');
    if(list) {
      list.innerHTML = d.lessonList.map(function(l) {
        return '<div class="ds-lesson-item">' +
          '<div class="dl-icon">' + l.icon + '</div>' +
          '<div class="dl-name">' + l.name + '</div>' +
          '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;">' +
            '<div class="dl-score" style="color:' + (l.ok ? 'var(--leaf)' : 'var(--rose)') + '">' +
              (l.ok ? '✅ ' : '⚠️ ') + l.score +
            '</div>' +
            '<div class="dl-time">' + l.time + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    // Update title
    var title = document.querySelector('.ds-title');
    if(title) title.innerHTML = '🎥 Today — ' + d.fname;

    // Reset expand
    DAILY.detailsOpen = false;
    var det = document.getElementById('ds-details');
    var btn = document.getElementById('ds-expand-btn');
    if(det) det.classList.remove('open');
    if(btn) btn.textContent = '▼ See today' + "'s lessons (" + d.lessonList.length + ')';
  },

  toggleDetails: function() {
    DAILY.detailsOpen = !DAILY.detailsOpen;
    var det = document.getElementById('ds-details');
    var btn = document.getElementById('ds-expand-btn');
    if(det) det.classList.toggle('open', DAILY.detailsOpen);
    if(btn) {
      var d = DAILY.data.child[PAR ? PAR.activeIdx : 0];
      var count = d ? d.lessonList.length : 0;
      btn.textContent = DAILY.detailsOpen
        ? ('▲ Hide lessons')
        : ('▼ See today' + "'s lessons (" + count + ')');
    }
  },

  init: function() {
    DAILY.update(0);
  }
};
