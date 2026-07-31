var NOTIF = {
  isOpen: false,
  activeFilter: 'all',
  toastTimer: null,

  data: [
    {
      id:1, type:'achievement', unread:true,
      icon:'🏆', iconBg:'#FAEEDA', iconColor:null,
      title:'Homework completed!',
      sub:'Arjun finished all 5 Maths exercises for today.',
      time:'2 min ago', child:'Arjun'
    },
    {
      id:2, type:'alert', unread:true,
      icon:'⚠️', iconBg:'#FBEAF0',
      title:'Low activity today',
      sub:'Arjun has only spent 8 minutes learning. Daily goal is 60 minutes.',
      time:'1 hr ago', child:'Arjun'
    },
    {
      id:3, type:'message', unread:true,
      icon:'👩‍🏫', iconBg:'#E1F5EE',
      title:'Teacher sent a message',
      sub:"Ms. Priya Sharma: \"Arjun scored 90% on today's Science quiz! 🌟\"",
      time:'2 hr ago', child:'Arjun'
    },
    {
      id:4, type:'achievement', unread:false,
      icon:'🔥', iconBg:'#FFF0E0',
      title:'5-day streak achieved!',
      sub:'Arjun has learned something new every day for 5 days in a row.',
      time:'Yesterday', child:'Arjun'
    },
    {
      id:5, type:'activity', unread:false,
      icon:'📚', iconBg:'#EEEDFE',
      title:'New lesson unlocked',
      sub:'Priya unlocked "Decimals & Fractions" — she is ready for the next chapter!',
      time:'Yesterday', child:'Priya'
    },
    {
      id:6, type:'alert', unread:false,
      icon:'😢', iconBg:'#FBEAF0',
      title:'Priya logged sad mood',
      sub:'Priya checked in as feeling sad today. Consider a gentle check-in at home.',
      time:'2 days ago', child:'Priya'
    },
    {
      id:7, type:'activity', unread:false,
      icon:'✅', iconBg:'#E1F5EE',
      title:'Weekly report ready',
      sub:"Arjun's weekly progress report for May Week 3 is now available.",
      time:'3 days ago', child:'Arjun'
    },
    {
      id:8, type:'message', unread:false,
      icon:'🏫', iconBg:'#E6F1FB',
      title:'School announcement',
      sub:'Parent-teacher meeting scheduled for Saturday 15 June at 10:00 AM.',
      time:'4 days ago', child:'All'
    }
  ],

  unreadCount: function() {
    return NOTIF.data.filter(function(n){ return n.unread; }).length;
  },

  updateBadge: function() {
    var badge = document.getElementById('par-notif-badge');
    var count = NOTIF.unreadCount();
    if(badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  },

  toggle: function() {
    var panel = document.getElementById('par-notif-panel');
    var overlay = document.getElementById('par-notif-overlay');
    if(!panel) return;
    NOTIF.isOpen = !NOTIF.isOpen;
    panel.classList.toggle('open', NOTIF.isOpen);
    if(overlay) overlay.classList.toggle('open', NOTIF.isOpen);
    if(NOTIF.isOpen) NOTIF.render();
  },

  close: function() {
    NOTIF.isOpen = false;
    var panel = document.getElementById('par-notif-panel');
    var overlay = document.getElementById('par-notif-overlay');
    if(panel) panel.classList.remove('open');
    if(overlay) overlay.classList.remove('open');
  },

  filter: function(type, btn) {
    NOTIF.activeFilter = type;
    document.querySelectorAll('.nft').forEach(function(b){ b.classList.remove('active'); });
    if(btn) btn.classList.add('active');
    NOTIF.render();
  },

  render: function() {
    var list = document.getElementById('par-notif-list');
    if(!list) return;

    var filtered = NOTIF.activeFilter === 'all'
      ? NOTIF.data
      : NOTIF.data.filter(function(n){ return n.type === NOTIF.activeFilter; });

    if(filtered.length === 0) {
      list.innerHTML =
        '<div class="notif-empty">' +
        '<div class="ne-emoji">🎉</div>' +
        '<div>All caught up! No notifications here.</div>' +
        '</div>';
      return;
    }

    list.innerHTML = filtered.map(function(n) {
      return '<div class="notif-item' + (n.unread ? ' unread' : '') + '" onclick="NOTIF.tap(' + n.id + ')">' +
        '<div class="ni-icon" style="background:' + n.iconBg + '">' + n.icon + '</div>' +
        '<div class="ni-body">' +
          '<div class="ni-title">' + n.title + '</div>' +
          '<div class="ni-sub">' + n.sub + '</div>' +
          '<div style="font-size:11px;color:var(--muted);margin-top:4px;font-weight:700;">' +
            '<span style="background:var(--bg);border-radius:50px;padding:2px 8px;">' + n.child + '</span> · ' + n.time +
          '</div>' +
        '</div>' +
        (n.unread ? '<div class="ni-dot"></div>' : '') +
        '</div>';
    }).join('');

    // Update all-count
    var allCount = document.getElementById('nft-all-count');
    if(allCount) allCount.textContent = '(' + NOTIF.unreadCount() + ')';
  },

  tap: function(id) {
    var n = NOTIF.data.find(function(x){ return x.id === id; });
    if(n) {
      n.unread = false;
      NOTIF.updateBadge();
      NOTIF.render();
      // Navigate to relevant pane
      if(n.type === 'message') { NOTIF.close(); showPane('parent','messages'); }
      else if(n.type === 'activity' || n.type === 'alert') { NOTIF.close(); showPane('parent','progress'); }
      else if(n.type === 'achievement') { NOTIF.close(); showPane('parent','home'); }
    }
  },

  markAll: function() {
    NOTIF.data.forEach(function(n){ n.unread = false; });
    NOTIF.updateBadge();
    NOTIF.render();
  },

  viewAll: function() {
    NOTIF.close();
    NOTIF.renderFull();
    showPane('parent','notifications');
  },

  showToast: function(icon, msg) {
    var toast = document.getElementById('par-notif-toast');
    var toastIcon = document.getElementById('par-toast-icon');
    var toastMsg = document.getElementById('par-toast-msg');
    if(!toast) return;
    if(toastIcon) toastIcon.textContent = icon;
    if(toastMsg) toastMsg.textContent = msg;
    toast.classList.add('show');
    if(NOTIF.toastTimer) clearTimeout(NOTIF.toastTimer);
    NOTIF.toastTimer = setTimeout(function(){ NOTIF.hideToast(); }, 4000);
  },

  hideToast: function() {
    var toast = document.getElementById('par-notif-toast');
    if(toast) toast.classList.remove('show');
  },

  addNotif: function(type, icon, iconBg, title, sub, child) {
    NOTIF.data.unshift({
      id: Date.now(), type:type, unread:true,
      icon:icon, iconBg:iconBg,
      title:title, sub:sub,
      time:'Just now', child:child||'Arjun'
    });
    NOTIF.updateBadge();
    NOTIF.showToast(icon, title);
  },

  // Update notifications when child switches
  updateForChild: function(childName) {
    NOTIF.render();
  },

  renderFull: function(filterType) {
    var list = document.getElementById('ppane-notif-list');
    if(!list) return;
    var type = filterType || NOTIF.fullFilter || 'all';
    NOTIF.fullFilter = type;

    var filtered = type === 'all'
      ? NOTIF.data
      : NOTIF.data.filter(function(n){ return n.type === type; });

    if(filtered.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--muted);"><div style="font-size:48px;margin-bottom:1rem;">🎉</div><div style="font-size:15px;font-weight:700;">No notifications here</div></div>';
      return;
    }

    list.innerHTML = filtered.map(function(n) {
      var borderStyle = n.unread ? 'border-left:4px solid var(--plum);' : 'border-left:4px solid transparent;';
      return '<div style="background:var(--white);border-radius:var(--radius-sm);padding:16px;border:1.5px solid var(--border);'+borderStyle+'display:flex;gap:14px;align-items:flex-start;cursor:pointer;transition:.2s;" onclick="NOTIF.tapFull('+n.id+')">' +
        '<div style="width:44px;height:44px;border-radius:12px;background:'+n.iconBg+';display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">'+n.icon+'</div>' +
        '<div style="flex:1;">' +
          '<div style="font-size:15px;font-weight:800;margin-bottom:3px;color:var(--text);">'+n.title+'</div>' +
          '<div style="font-size:13px;color:var(--muted);margin-bottom:6px;line-height:1.5;">'+n.sub+'</div>' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span style="background:var(--bg);border-radius:50px;padding:2px 10px;font-size:11px;font-weight:700;color:var(--muted);">'+n.child+'</span>' +
            '<span style="font-size:11px;color:var(--muted);">'+n.time+'</span>' +
            (n.unread ? '<span style="background:var(--plum-light);color:var(--plum);font-size:10px;font-weight:800;padding:2px 8px;border-radius:50px;">New</span>' : '') +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  },

  filterFull: function(type, btn) {
    NOTIF.fullFilter = type;
    document.querySelectorAll('.nft2').forEach(function(b){
      b.style.background = 'var(--white)';
      b.style.color = 'var(--muted)';
      b.style.border = '2px solid var(--border)';
    });
    if(btn){
      btn.style.background = 'var(--plum)';
      btn.style.color = '#fff';
      btn.style.border = 'none';
    }
    NOTIF.renderFull(type);
  },

  tapFull: function(id) {
    var n = NOTIF.data.find(function(x){ return x.id === id; });
    if(n){
      n.unread = false;
      NOTIF.updateBadge();
      NOTIF.renderFull();
      if(n.type === 'message'){ showPane('parent','messages'); }
      else if(n.type === 'activity' || n.type === 'alert'){ showPane('parent','progress'); }
      else { showPane('parent','home'); }
    }
  },

  init: function() {
    NOTIF.updateBadge();
    // Simulate live notification after 8 seconds
    setTimeout(function(){
      NOTIF.addNotif(
        'activity','📖','#EEEDFE',
        'Lesson completed!',
        'Arjun just finished English Lesson 4 — Reading Comprehension.',
        'Arjun'
      );
    }, 8000);
    // Simulate another after 20 seconds
    setTimeout(function(){
      NOTIF.addNotif(
        'alert','⏰','#FFF0E0',
        'Study time reminder',
        "Arjun has not started today's lesson yet. Nudge him!",
        'Arjun'
      );
    }, 20000);
  }
};
