var ADMIN_PASS = 'admin123';

function adminLogout() {
  sessionStorage.removeItem('bp_admin_auth');
  showScreen('s-land');
}

function adminGet(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch(e){ return null; }
}

function adminSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e){}
}

var AKEY = { resources:'bp_admin_resources', videos:'bp_admin_videos', subjects:'bp_admin_subjects', games:'bp_admin_games' };

var SUBJ_COLORS = { maths:'var(--sun)', science:'var(--leaf)', english:'var(--plum)', sst:'var(--sky)', hindi:'var(--rose)', life:'var(--amber)' };

var SUBJ_ICONS  = { maths:'📐', science:'🔬', english:'📖', sst:'🌍', hindi:'🇮🇳', life:'🌟' };

function adminAddResource() {
  var title    = (document.getElementById('ar-title')   ||{}).value.trim();
  var subject  = (document.getElementById('ar-subject') ||{}).value;
  var cls      = (document.getElementById('ar-class')   ||{}).value;
  var icon     = (document.getElementById('ar-icon')    ||{}).value.trim() || SUBJ_ICONS[subject] || '📄';
  var desc     = (document.getElementById('ar-desc')    ||{}).value.trim();
  var download = (document.getElementById('ar-download')||{}).value.trim();
  var view     = (document.getElementById('ar-view')    ||{}).value.trim();
  if(!title) { alert('Please enter a title.'); return; }
  var items = adminGet(AKEY.resources) || [];
  items.push({ id: Date.now(), title, subject, cls, icon, desc, download, view });
  adminSet(AKEY.resources, items);
  // Clear form
  ['ar-title','ar-icon','ar-desc','ar-download','ar-view'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  adminRenderResources();
  adminInjectResources();
  showToast('✅ Resource card added!');
}

function adminDeleteResource(id) {
  if(!confirm('Delete this resource card?')) return;
  var items = (adminGet(AKEY.resources)||[]).filter(function(i){ return i.id !== id; });
  adminSet(AKEY.resources, items);
  adminRenderResources();
  adminInjectResources();
  showToast('🗑️ Resource deleted.');
}

function adminRenderResources() {
  var el = document.getElementById('admin-resource-list'); if(!el) return;
  var items = adminGet(AKEY.resources) || [];
  if(!items.length) { el.innerHTML='<p style="color:var(--muted);font-size:13px;">No custom resources added yet. Add one above!</p>'; return; }
  el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">' +
    items.map(function(item) {
      var col = SUBJ_COLORS[item.subject] || 'var(--sky)';
      return '<div style="background:var(--white);border-radius:14px;padding:14px;border:2px solid var(--border);">'+
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">'+
        '<div style="width:38px;height:38px;border-radius:10px;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:20px;">'+item.icon+'</div>'+
        '<div><div style="font-size:12px;font-weight:800;color:'+col+';">'+item.subject.toUpperCase()+' · CLASS '+item.cls+'</div>'+
        '<div style="font-size:13px;font-weight:800;">'+item.title+'</div></div></div>'+
        '<div style="font-size:11px;color:var(--muted);margin-bottom:10px;">'+item.desc+'</div>'+
        '<div style="display:flex;gap:6px;">'+
        (item.download?'<a href="'+item.download+'" target="_blank" style="flex:1;background:'+col+';border-radius:50px;padding:5px;font-size:11px;font-weight:800;color:#fff;text-align:center;text-decoration:none;">⬇ Download</a>':'')+''+
        '<button onclick="adminDeleteResource('+item.id+')" style="background:var(--rose-light);color:var(--rose);border:none;border-radius:50px;padding:5px 12px;font-size:11px;font-weight:800;cursor:pointer;">🗑️ Delete</button>'+
        '</div></div>';
    }).join('') + '</div>';
}

function adminInjectResources() {
  var items = adminGet(AKEY.resources) || [];
  var container = document.getElementById('admin-injected-resources');
  if(!container) {
    // Create injection container inside each class section
    ['6','7','8'].forEach(function(cls) {
      var sec = document.getElementById('res-section-'+cls);
      if(sec) {
        var grid = sec.querySelector('div[style*="grid"]');
        if(grid) {
          var inj = document.createElement('div');
          inj.id = 'admin-inj-res-'+cls;
          inj.style.cssText='display:contents;';
          grid.appendChild(inj);
        }
      }
    });
  }
  ['6','7','8'].forEach(function(cls) {
    var inj = document.getElementById('admin-inj-res-'+cls);
    if(!inj) return;
    var clsItems = items.filter(function(i){ return i.cls===cls; });
    inj.innerHTML = clsItems.map(function(item) {
      var col = SUBJ_COLORS[item.subject]||'var(--sky)';
      var colLight = col.replace(')','-light)').replace('var(--','var(--');
      return '<div class="res-card" data-type="'+item.subject+'" data-class="'+item.cls+'" style="background:var(--white);border-radius:var(--radius);padding:16px;border:2px solid var(--border);transition:.2s;" onmouseover="this.style.borderColor=\''+col+'\';this.style.transform=\'translateY(-3px)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.transform=\'\'">'+
        '<div style="width:44px;height:44px;border-radius:10px;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:10px;">'+item.icon+'</div>'+
        '<div style="font-size:12px;font-weight:800;color:'+col+';margin-bottom:3px;">'+item.subject.toUpperCase()+' · CLASS '+item.cls+'</div>'+
        '<div style="font-size:14px;font-weight:800;margin-bottom:5px;">'+item.title+'</div>'+
        '<div style="font-size:11px;color:var(--muted);margin-bottom:10px;">'+item.desc+'</div>'+
        '<div style="display:flex;gap:6px;">'+
        (item.download?'<a href="'+item.download+'" target="_blank" style="flex:1;background:'+col+';border-radius:50px;padding:6px;font-family:var(--font);font-weight:800;font-size:11px;color:#fff;text-align:center;text-decoration:none;">⬇ Download</a>':'')+
        (item.view?'<a href="'+item.view+'" target="_blank" style="background:var(--bg);border:2px solid var(--border);border-radius:50px;padding:6px 10px;font-family:var(--font);font-weight:800;font-size:11px;text-decoration:none;color:var(--text);">👁</a>':'')+
        '</div></div>';
    }).join('');
  });
}

function adminAddVideo() {
  var title    = (document.getElementById('av-title')   ||{}).value.trim();
  var subject  = (document.getElementById('av-subject') ||{}).value;
  var cls      = (document.getElementById('av-class')   ||{}).value;
  var duration = (document.getElementById('av-duration')||{}).value.trim() || '5:00';
  var desc     = (document.getElementById('av-desc')    ||{}).value.trim();
  var url      = (document.getElementById('av-url')     ||{}).value.trim();
  if(!title) { alert('Please enter a title.'); return; }
  var items = adminGet(AKEY.videos) || [];
  items.push({ id: Date.now(), title, subject, cls, duration, desc, url });
  adminSet(AKEY.videos, items);
  ['av-title','av-duration','av-desc','av-url'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  adminRenderVideos();
  adminInjectVideos();
  showToast('✅ Video card added!');
}

function adminDeleteVideo(id) {
  if(!confirm('Delete this video card?')) return;
  var items = (adminGet(AKEY.videos)||[]).filter(function(i){ return i.id !== id; });
  adminSet(AKEY.videos, items);
  adminRenderVideos();
  adminInjectVideos();
  showToast('🗑️ Video deleted.');
}

function adminRenderVideos() {
  var el = document.getElementById('admin-video-list'); if(!el) return;
  var items = adminGet(AKEY.videos) || [];
  if(!items.length) { el.innerHTML='<p style="color:var(--muted);font-size:13px;">No custom videos added yet.</p>'; return; }
  el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">' +
    items.map(function(item) {
      var col = SUBJ_COLORS[item.subject]||'var(--sky)';
      return '<div style="background:var(--white);border-radius:14px;overflow:hidden;border:2px solid var(--border);">'+
        '<div style="background:var(--bg);height:80px;display:flex;align-items:center;justify-content:center;font-size:36px;position:relative;">'+
        SUBJ_ICONS[item.subject]+'<div style="position:absolute;bottom:4px;right:6px;background:rgba(0,0,0,.6);color:#fff;font-size:10px;font-weight:800;padding:2px 6px;border-radius:50px;">'+item.duration+'</div></div>'+
        '<div style="padding:12px;">'+
        '<div style="display:flex;gap:6px;margin-bottom:5px;"><span style="background:var(--bg);font-size:10px;font-weight:800;padding:2px 8px;border-radius:50px;color:'+col+'">'+item.subject.toUpperCase()+'</span><span style="font-size:10px;color:var(--muted);">Class '+item.cls+'</span></div>'+
        '<div style="font-size:13px;font-weight:800;margin-bottom:4px;">'+item.title+'</div>'+
        '<div style="font-size:11px;color:var(--muted);margin-bottom:8px;">'+item.desc+'</div>'+
        '<div style="display:flex;gap:6px;">'+
        (item.url?'<a href="'+item.url+'" target="_blank" style="flex:1;background:'+col+';border-radius:50px;padding:5px;font-size:11px;font-weight:800;color:#fff;text-align:center;text-decoration:none;">▶ Watch</a>':'')+
        '<button onclick="adminDeleteVideo('+item.id+')" style="background:var(--rose-light);color:var(--rose);border:none;border-radius:50px;padding:5px 12px;font-size:11px;font-weight:800;cursor:pointer;">🗑️</button>'+
        '</div></div></div>';
    }).join('') + '</div>';
}

function adminInjectVideos() {
  var items = adminGet(AKEY.videos) || [];
  var grid = document.getElementById('video-grid'); if(!grid) return;
  var inj = document.getElementById('admin-inj-videos');
  if(!inj) { inj = document.createElement('div'); inj.id='admin-inj-videos'; inj.style.cssText='display:contents;'; grid.appendChild(inj); }
  inj.innerHTML = items.map(function(item) {
    var col = SUBJ_COLORS[item.subject]||'var(--sky)';
    var yt = getYouTubeId(item.url||'');
    var ytAttr = yt ? ' data-yt="'+yt+'"' : '';
    var clickAttr = yt ? ' onclick="openVideoModal(this)"' : '';
    return '<div class="vid-card" data-cat="'+item.subject+'" data-class="'+item.cls+'" data-title="'+(item.title||'').replace(/"/g,'&quot;')+'"'+ytAttr+clickAttr+' style="background:var(--white);border-radius:var(--radius);overflow:hidden;border:2px solid var(--border);cursor:pointer;transition:.2s;" onmouseover="this.style.transform=\'translateY(-4px)\';this.style.boxShadow=\'0 8px 24px rgba(0,0,0,.1)\'" onmouseout="this.style.transform=\'\';this.style.boxShadow=\'\'">'+
      '<div style="background:var(--bg);height:120px;display:flex;align-items:center;justify-content:center;font-size:40px;position:relative;">'+SUBJ_ICONS[item.subject]+
      '<div style="position:absolute;bottom:6px;right:8px;background:rgba(0,0,0,.6);color:#fff;font-size:11px;font-weight:800;padding:3px 8px;border-radius:50px;">'+item.duration+'</div></div>'+
      '<div style="padding:14px;"><div style="display:flex;gap:6px;margin-bottom:6px;"><span style="background:var(--bg);color:'+col+';font-size:11px;font-weight:800;padding:2px 8px;border-radius:50px;">'+item.subject.toUpperCase()+'</span><span style="font-size:11px;color:var(--muted);">Class '+item.cls+'</span></div>'+
      '<div style="font-size:14px;font-weight:800;margin-bottom:4px;">'+item.title+'</div>'+
      '<div style="font-size:12px;color:var(--muted);">'+item.desc+'</div>'+
      '<div style="display:flex;align-items:center;gap:6px;margin-top:10px;"><span class="vid-watch" style="margin-left:auto;font-size:11px;font-weight:800;color:var(--muted);">▶ Watch</span></div></div></div>';
  }).join('');
  markWatchedBadges();
}

function adminAddSubject() {
  var name  = (document.getElementById('as-name') ||{}).value.trim();
  var cls   = (document.getElementById('as-class')||{}).value;
  var icon  = (document.getElementById('as-icon') ||{}).value.trim() || '📚';
  var color = (document.getElementById('as-color')||{}).value || 'var(--sun)';
  var topic = (document.getElementById('as-topic')||{}).value.trim();
  if(!name) { alert('Please enter a subject name.'); return; }
  var items = adminGet(AKEY.subjects) || [];
  items.push({ id: Date.now(), name, cls, icon, color, topic });
  adminSet(AKEY.subjects, items);
  ['as-name','as-icon','as-topic'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  adminRenderSubjects();
  adminInjectSubjects();
  showToast('✅ Subject added!');
}

function adminDeleteSubject(id) {
  if(!confirm('Delete this subject?')) return;
  var items = (adminGet(AKEY.subjects)||[]).filter(function(i){ return i.id !== id; });
  adminSet(AKEY.subjects, items);
  adminRenderSubjects();
  adminInjectSubjects();
  showToast('🗑️ Subject deleted.');
}

function adminRenderSubjects() {
  var el = document.getElementById('admin-subject-list'); if(!el) return;
  var items = adminGet(AKEY.subjects) || [];
  if(!items.length) { el.innerHTML='<p style="color:var(--muted);font-size:13px;">No custom subjects added yet.</p>'; return; }
  el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;">' +
    items.map(function(item) {
      return '<div style="background:var(--white);border-radius:14px;padding:14px;border:2px solid var(--border);border-top:5px solid '+item.color+';">'+
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">'+
        '<div style="font-size:28px;">'+item.icon+'</div>'+
        '<div><div style="font-size:14px;font-weight:800;">'+item.name+'</div><div style="font-size:12px;color:var(--muted);">Class '+item.cls+'</div></div></div>'+
        '<div style="font-size:12px;color:var(--muted);margin-bottom:10px;">'+item.topic+'</div>'+
        '<button onclick="adminDeleteSubject('+item.id+')" style="background:var(--rose-light);color:var(--rose);border:none;border-radius:50px;padding:5px 14px;font-size:11px;font-weight:800;cursor:pointer;">🗑️ Delete</button>'+
        '</div>';
    }).join('') + '</div>';
}

function adminInjectSubjects() {
  var items = adminGet(AKEY.subjects) || [];
  ['6','7','8'].forEach(function(cls) {
    var subjSection = document.querySelector('#cpane-subjects [data-class="'+cls+'"] .subject-row');
    if(!subjSection) return;
    var inj = document.getElementById('admin-inj-subj-'+cls);
    if(!inj) { inj=document.createElement('div'); inj.id='admin-inj-subj-'+cls; inj.style.cssText='display:contents;'; subjSection.appendChild(inj); }
    var clsItems = items.filter(function(i){ return i.cls===cls; });
    inj.innerHTML = clsItems.map(function(item) {
      return '<div class="subj" onclick="openLesson(\''+item.name+'\',\''+item.topic+'\',\'Adaptive\')" style="border-top:5px solid '+item.color+';">'+
        '<div class="subj-top"><div class="subj-icon">'+item.icon+'</div><div><div class="subj-name">'+item.name+'</div><div class="subj-type">'+item.topic+'</div></div></div>'+
        '<div class="prog-bar"><div class="prog-fill" style="width:0%;background:'+item.color+';"></div></div>'+
        '<div class="subj-footer"><span>0% complete</span><button class="start-btn" style="background:'+item.color+';">Start →</button></div></div>';
    }).join('');
  });
}

function adminAddGame() {
  var name     = (document.getElementById('ag-name')    ||{}).value.trim();
  var cls      = (document.getElementById('ag-class')   ||{}).value;
  var icon     = (document.getElementById('ag-icon')    ||{}).value.trim() || '🎮';
  var duration = (document.getElementById('ag-duration')||{}).value.trim() || '5 min';
  var desc     = (document.getElementById('ag-desc')    ||{}).value.trim();
  if(!name) { alert('Please enter a game name.'); return; }
  var items = adminGet(AKEY.games) || [];
  items.push({ id: Date.now(), name, cls, icon, duration, desc });
  adminSet(AKEY.games, items);
  ['ag-name','ag-icon','ag-duration','ag-desc'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  adminRenderGames();
  adminInjectGames();
  showToast('✅ Game added!');
}

function adminDeleteGame(id) {
  if(!confirm('Delete this game?')) return;
  var items = (adminGet(AKEY.games)||[]).filter(function(i){ return i.id !== id; });
  adminSet(AKEY.games, items);
  adminRenderGames();
  adminInjectGames();
  showToast('🗑️ Game deleted.');
}

function adminRenderGames() {
  var el = document.getElementById('admin-game-list'); if(!el) return;
  var items = adminGet(AKEY.games) || [];
  if(!items.length) { el.innerHTML='<p style="color:var(--muted);font-size:13px;">No custom games added yet.</p>'; return; }
  el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;">' +
    items.map(function(item) {
      return '<div style="background:var(--white);border-radius:14px;padding:14px;border:2px solid var(--leaf);border-top:5px solid var(--leaf);">'+
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">'+
        '<div style="font-size:28px;">'+item.icon+'</div>'+
        '<div><div style="font-size:14px;font-weight:800;">'+item.name+'</div><div style="font-size:12px;color:var(--muted);">Class '+item.cls+' · '+item.duration+'</div></div></div>'+
        '<div style="font-size:12px;color:var(--muted);margin-bottom:10px;">'+item.desc+'</div>'+
        '<button onclick="adminDeleteGame('+item.id+')" style="background:var(--rose-light);color:var(--rose);border:none;border-radius:50px;padding:5px 14px;font-size:11px;font-weight:800;cursor:pointer;">🗑️ Delete</button>'+
        '</div>';
    }).join('') + '</div>';
}

function adminInjectGames() {
  var items = adminGet(AKEY.games) || [];
  ['6','7','8','all'].forEach(function(cls) {
    var gameSection = document.querySelector('#cpane-games [data-class="'+cls+'"] .subject-row');
    if(!gameSection) return;
    var inj = document.getElementById('admin-inj-game-'+cls);
    if(!inj) { inj=document.createElement('div'); inj.id='admin-inj-game-'+cls; inj.style.cssText='display:contents;'; gameSection.appendChild(inj); }
    var clsItems = items.filter(function(i){ return i.cls===cls||i.cls==='all'; });
    inj.innerHTML = clsItems.map(function(item) {
      return '<div class="subj" data-class="'+item.cls+'" style="border-top:5px solid var(--leaf);cursor:pointer;">'+
        '<div class="subj-top"><div class="subj-icon">'+item.icon+'</div><div><div class="subj-name">'+item.name+'</div><div class="subj-type">'+item.duration+'</div></div></div>'+
        '<p style="font-size:13px;color:var(--muted);margin:8px 0;">'+item.desc+'</p>'+
        '<button class="start-btn" style="background:var(--leaf);">Play Now →</button></div>';
    }).join('');
  });
}

function adminInit() {
  adminRenderResources();
  adminRenderVideos();
  adminRenderSubjects();
  adminRenderGames();
}

(function() {
  // Small delay to let DOM fully render
  setTimeout(function() {
    adminInjectResources();
    adminInjectVideos();
    adminInjectSubjects();
    adminInjectGames();
  }, 300);
})();

(function(){
  var _origShowForAdmin = showScreen;
  showScreen = function(id) {
    _origShowForAdmin(id);
    if(id === 's-admin') setTimeout(adminInit, 80);
  };
})();
