var PAR = {
  activeIdx: 0,
  editingIdx: -1,
  removingIdx: -1,

  children: [
    {
      name: 'Arjun Singh', cls: 'Class 7', gender: 'Boy 🧒',
      avatar: '🧒', avatarBg: '#FFF0E0', school: 'Sunrise Special School',
      conditions: ['⚡ ADHD', '👁️ Visual Learner'],
      progress: 72, streak: 5, badges: 12, time: '45m',
      maths: 72, english: 55, science: 88,
      mood: ['😊','🤩','😴','😊','😊'],
      greet: 'Arjun is doing great — 72% progress and a 5-day streak!'
    },
    {
      name: 'Priya Singh', cls: 'Class 6', gender: 'Girl 👧',
      avatar: '👧', avatarBg: '#EEEDFE', school: 'Sunrise Special School',
      conditions: ['🐢 Slow Learner', '📖 Dyslexia'],
      progress: 58, streak: 3, badges: 7, time: '30m',
      maths: 60, english: 45, science: 70,
      mood: ['😴','😊','😰','😊','😴'],
      greet: 'Priya is making steady progress — keep encouraging her!'
    }
  ],

  // Switch active child and update all UI
  switchChild: function(idx) {
    PAR.activeIdx = idx;
    var c = PAR.children[idx];

    // Update tabs
    document.querySelectorAll('.child-tab').forEach(function(t,i){
      t.classList.toggle('active', i === idx);
    });

    // Update active card
    var av = document.getElementById('par-acc-avatar');
    var nm = document.getElementById('par-acc-name');
    var mt = document.getElementById('par-acc-meta');
    var tg = document.getElementById('par-acc-tags');
    if(av) { av.textContent = c.avatar; av.style.background = c.avatarBg; }
    if(nm) nm.textContent = c.name;
    if(mt) mt.textContent = c.cls + ' · ' + c.conditions.join(' · ');
    if(tg) tg.innerHTML = c.conditions.map(function(x){ return '<span class="acc-tag">'+x+'</span>'; }).join('') +
      '<span class="acc-tag">🔥 '+c.streak+'-day streak</span>' +
      '<span class="acc-tag">'+c.progress+'% progress</span>';

    // Update greet card
    var gc = document.querySelector('#ppane-home .active-child-card + .child-tabs');
    var greetP = document.querySelector('#ppane-home .active-child-card p');
    if(greetP) greetP.textContent = c.greet;

    // Update stat cards
    PAR.updateStats(c);
    // Update subject bars
    PAR.updateSubjects(c);
    // Update moods
    PAR.updateMoods(c);
    // Update progress pane
    PAR.updateProgress(c);
    // Update control center
    CTRL.updateForChild(c);
    // Update notifications
    NOTIF.updateForChild(c.name.split(' ')[0]);
    // Update daily summary
    DAILY.update(PAR.activeIdx);
  },

  updateStats: function(c) {
    var nums = document.querySelectorAll('#ppane-home .sc-num');
    var lbls = document.querySelectorAll('#ppane-home .sc-label');
    if(nums.length >= 4) {
      nums[0].textContent = c.progress + '%';
      nums[1].textContent = '🔥' + c.streak;
      nums[2].textContent = c.badges;
      nums[3].textContent = c.time;
    }
  },

  updateSubjects: function(c) {
    var bars = document.querySelectorAll('#ppane-home .prog-fill');
    var pcts = document.querySelectorAll('#ppane-home .prog-bar + span, #ppane-home .prog-fill');
    if(bars.length >= 3) {
      bars[0].style.width = c.maths + '%';
      bars[1].style.width = c.english + '%';
      bars[2].style.width = c.science + '%';
    }
    // Update percentage text
    var spans = document.querySelectorAll('#ppane-home .two-col .panel:first-child span[style]');
    if(spans.length >= 3) {
      spans[0].textContent = c.maths + '%';
      spans[1].textContent = c.english + '%';
      spans[2].textContent = c.science + '%';
    }
  },

  updateMoods: function(c) {
    var entries = document.querySelectorAll('#ppane-home .ee-emoji');
    c.mood.forEach(function(m,i){ if(entries[i]) entries[i].textContent = m; });
    var moodMsg = document.querySelector('#ppane-home .two-col .panel:last-child > p');
    if(moodMsg) moodMsg.textContent = c.name.split(' ')[0] + ' has been mostly happy this week 🌟';
  },

  updateProgress: function(c) {
    var fn = c.name.split(' ')[0];
    var t = document.getElementById('prog-title'); if(t) t.textContent = fn + "'s Progress";
    var emo = document.getElementById('emo-title'); if(emo) emo.textContent = fn + "'s Mood Log";
    var po = document.getElementById('prog-overall'); if(po) po.textContent = c.progress + '%';
    var ps = document.getElementById('prog-streak'); if(ps) ps.textContent = '🔥' + c.streak;
    var pb = document.getElementById('prog-badges'); if(pb) pb.textContent = c.badges;
    var mb = document.getElementById('prog-maths'); if(mb) mb.textContent = c.maths + '%';
    var mbb = document.getElementById('prog-maths-bar'); if(mbb) mbb.style.width = c.maths + '%';
    var eb = document.getElementById('prog-english'); if(eb) eb.textContent = c.english + '%';
    var ebb = document.getElementById('prog-english-bar'); if(ebb) ebb.style.width = c.english + '%';
    var sc = document.getElementById('prog-science'); if(sc) sc.textContent = c.science + '%';
    var scb = document.getElementById('prog-science-bar'); if(scb) scb.style.width = c.science + '%';
  },

  openAddChild: function() {
    PAR.editingIdx = -1;
    document.getElementById('par-modal-title').textContent = 'Add Child Profile';
    document.getElementById('par-modal-sub').textContent = 'Set up a personalised learning profile for your child';
    document.getElementById('par-m-name').value = '';
    document.getElementById('par-m-school').value = '';
    document.getElementById('par-m-class').value = 'Class 7';
    document.querySelectorAll('#par-m-conds .cond-chip').forEach(function(c){ c.classList.remove('on'); });
    document.getElementById('par-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  openEditChild: function(idx) {
    if(idx === undefined) idx = PAR.activeIdx;
    PAR.editingIdx = idx;
    var c = PAR.children[idx];
    document.getElementById('par-modal-title').textContent = "Edit " + c.name.split(" ")[0] + "'s Profile";
    document.getElementById('par-modal-sub').textContent = "Update the learning profile details";
    document.getElementById('par-m-name').value = c.name;
    document.getElementById('par-m-school').value = c.school;
    document.getElementById('par-m-class').value = c.cls;
    // Set condition chips
    document.querySelectorAll('#par-m-conds .cond-chip').forEach(function(chip){
      var label = chip.textContent.trim();
      chip.classList.toggle('on', c.conditions.indexOf(label) > -1);
    });
    document.getElementById('par-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeModal: function() {
    document.getElementById('par-modal').classList.remove('open');
    document.body.style.overflow = '';
  },

  saveChild: function() {
    var name = document.getElementById('par-m-name').value.trim();
    if(!name) { document.getElementById('par-m-name').focus(); return; }
    var cls = document.getElementById('par-m-class').value;
    var gender = document.getElementById('par-m-gender').value;
    var school = document.getElementById('par-m-school').value.trim();
    var conditions = [];
    document.querySelectorAll('#par-m-conds .cond-chip.on').forEach(function(c){ conditions.push(c.textContent.trim()); });
    var isGirl = gender.indexOf('Girl') > -1;
    var avatar = isGirl ? '👧' : '🧒';
    var avatarBg = isGirl ? '#EEEDFE' : '#FFF0E0';

    if(PAR.editingIdx > -1) {
      // Update existing
      var c = PAR.children[PAR.editingIdx];
      c.name = name; c.cls = cls; c.school = school; c.conditions = conditions;
      c.avatar = avatar; c.avatarBg = avatarBg;
      c.greet = name.split(' ')[0] + "'s profile has been updated!";
    } else {
      // Add new
      PAR.children.push({
        name:name, cls:cls, gender:gender, avatar:avatar, avatarBg:avatarBg,
        school:school, conditions:conditions,
        progress:0, streak:0, badges:0, time:'0m',
        maths:0, english:0, science:0,
        mood:['😊','😊','😊','😊','😊'],
        greet: name.split(' ')[0] + " just joined BrightPath! Let's get started 🚀"
      });
    }
    PAR.closeModal();
    PAR.renderTabs();
    PAR.renderChildrenList();
    PAR.switchChild(PAR.editingIdx > -1 ? PAR.editingIdx : PAR.children.length - 1);
  },

  removeChild: function(e, idx) {
    e.stopPropagation();
    if(PAR.children.length <= 1) { alert('You must have at least one child profile.'); return; }
    PAR.removingIdx = idx;
    var c = PAR.children[idx];
    document.getElementById('par-confirm-name').textContent =
      "Are you sure you want to remove " + c.name + "'s profile? All progress data will be lost.";
    document.getElementById('par-confirm-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  confirmRemove: function() {
    if(PAR.removingIdx < 0) return;
    PAR.children.splice(PAR.removingIdx, 1);
    document.getElementById('par-confirm-modal').classList.remove('open');
    document.body.style.overflow = '';
    var newIdx = Math.min(PAR.activeIdx, PAR.children.length - 1);
    PAR.renderTabs();
    PAR.renderChildrenList();
    PAR.switchChild(newIdx);
  },

  renderTabs: function() {
    var container = document.getElementById('par-child-tabs');
    if(!container) return;
    // Remove old tabs (keep add button)
    var tabs = container.querySelectorAll('.child-tab');
    tabs.forEach(function(t){ t.remove(); });
    // Re-add tabs
    var addBtn = container.querySelector('.btn-add-child');
    PAR.children.forEach(function(c, i) {
      var btn = document.createElement('button');
      btn.className = 'child-tab' + (i === PAR.activeIdx ? ' active' : '');
      btn.setAttribute('data-cid', i);
      btn.innerHTML = '<div class="ct-avatar" style="background:'+c.avatarBg+'">'+c.avatar+'</div>' +
        c.name.split(' ')[0] +
        '<button class="ct-remove" style="display:flex">✕</button>';
      btn.addEventListener('click', function(e){ if(e.target.classList.contains('ct-remove')){ PAR.removeChild(e,i); } else { PAR.switchChild(i); }});
      container.insertBefore(btn, addBtn);
    });
  },

  renderChildrenList: function() {
    var list = document.getElementById('par-children-list');
    if(!list) return;
    list.innerHTML = '';
    PAR.children.forEach(function(c, i) {
      var div = document.createElement('div');
      div.className = 'panel';
      div.style.cssText = 'display:flex;align-items:center;gap:16px;cursor:pointer;';
      div.innerHTML =
        '<div style="width:56px;height:56px;border-radius:50%;background:'+c.avatarBg+';display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;">'+c.avatar+'</div>' +
        '<div style="flex:1;">' +
          '<div style="font-size:16px;font-weight:800;margin-bottom:2px;">'+c.name+'</div>' +
          '<div style="font-size:12px;color:var(--muted);margin-bottom:8px;">'+c.cls+' · '+(c.conditions[0]||'No profile set')+'</div>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
            c.conditions.map(function(x){ return '<span style="background:var(--plum-light);color:var(--plum);font-size:11px;font-weight:700;padding:2px 8px;border-radius:50px;">'+x+'</span>'; }).join('') +
          '</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0;">' +
          '<div style="font-family:var(--font-d);font-size:22px;color:var(--plum);">'+c.progress+'%</div>' +
          '<div style="font-size:11px;color:var(--muted);">Progress</div>' +
          '<div style="margin-top:6px;display:flex;gap:6px;justify-content:flex-end;">' +
            '<button style="background:var(--bg);border:1.5px solid var(--border);border-radius:50px;padding:4px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font);" data-edit="'+i+'">✏️ Edit</button>' +
            '<button style="background:var(--plum);border:none;border-radius:50px;padding:4px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font);color:#fff;" data-view="'+i+'">View →</button>' +
          '</div>' +
        '</div>';
      div.addEventListener('click', function(e){
        var editBtn = e.target.closest('[data-edit]');
        var viewBtn = e.target.closest('[data-view]');
        if(editBtn){ PAR.openEditChild(parseInt(editBtn.getAttribute('data-edit'))); }
        else if(viewBtn){ PAR.switchChild(parseInt(viewBtn.getAttribute('data-view'))); showPane('parent','home'); }
        else { PAR.switchChild(i); showPane('parent','home'); }
      });
      list.appendChild(div);
    });
  },

  init: function() {
    PAR.renderTabs();
    PAR.switchChild(0);
  }
};
