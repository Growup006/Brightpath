var featureData={
  ai:{
    icon:'🧠',color:'var(--sun)',bg:'var(--sun-light)',
    title:'AI-Adaptive Lessons',
    desc:'BrightPath\'s AI watches how your child learns and adjusts every lesson in real time — no two sessions are ever the same.',
    points:['Automatically slows down when the child struggles','Moves faster when the child is confident','Changes explanation style: visual, audio, or step-by-step','Detects frustration and switches to an easier activity','Works for ADHD, Dyslexia, Slow Learners & Autism Spectrum'],
    cta:'🚀 Start your first AI lesson'
  },
  games:{
    icon:'🎮',color:'var(--plum)',bg:'var(--plum-light)',
    title:'Brain Games',
    desc:'40+ short cognitive games that build focus, memory, logic, and language — all disguised as fun!',
    points:['Memory Match — trains short-term memory (5 min)','Word Builder — spelling & phonics for dyslexia support','Pattern Puzzles — builds logical sequencing skills','Number Ninja — mental maths in bite-sized bursts','Calm Breathing — anxiety relief before learning begins','Rhythm & Rhyme — auditory memory through music'],
    cta:'🎮 Play a Brain Game'
  },
  voice:{
    icon:'🎤',color:'var(--leaf)',bg:'var(--leaf-light)',
    title:'Voice Learning',
    desc:'Children who struggle to read can listen, speak, and respond using their voice — making learning fully accessible.',
    points:['🔊 Read Aloud — every lesson can be spoken aloud','🎤 Voice Input — answer questions by speaking','Adjustable speech speed for comprehension support','Especially helpful for Dyslexia & ADHD learners','Works in English with Indian accent recognition'],
    cta:'🎤 Try Voice Learning'
  },
  rewards:{
    icon:'🏆',color:'var(--amber)',bg:'var(--amber-light)',
    title:'Rewards & Motivation',
    desc:'A reward system designed to build confidence and keep special needs children coming back every day.',
    points:['⭐ Stars earned for every completed lesson','🏅 Badges for milestones — Reading Star, Maths Champion','🔥 Streak rewards for consecutive daily learning','🎖️ Certificate downloads to celebrate progress','Parents and teachers get notified of achievements'],
    cta:'🏆 See all badges'
  },
  emotion:{
    icon:'❤️',color:'var(--rose)',bg:'var(--rose-light)',
    title:'Emotion-Based Suggestions',
    desc:'Before every session, the child picks their mood. The AI then adapts what activities to show — making learning feel safe and understood.',
    points:['😊 Happy → Jump straight into a new lesson','😴 Tired → Short 5-min micro-lesson + a brain game','😰 Anxious → Start with Calm Breathing activity first','😢 Sad → Gentle encouragement + favourite subject','🤩 Excited → Challenge mode with extra difficulty'],
    cta:'❤️ Try the emotion check-in'
  }
};

function showFeatureModal(key){
  var d=featureData[key];
  if(!d)return;
  var html='<div style="width:56px;height:56px;border-radius:16px;background:'+d.bg+';display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:1rem;">'+d.icon+'</div>';
  html+='<h2 style="font-family:var(--font-d);font-size:24px;color:'+d.color+';margin-bottom:.5rem;">'+d.title+'</h2>';
  html+='<p style="font-size:14px;color:var(--muted);line-height:1.7;margin-bottom:1.2rem;">'+d.desc+'</p>';
  html+='<div style="display:flex;flex-direction:column;gap:8px;">';
  d.points.forEach(function(p){
    html+='<div style="display:flex;align-items:flex-start;gap:8px;font-size:13px;padding:8px 12px;background:'+d.bg+';border-radius:10px;">'+p+'</div>';
  });
  html+='</div>';
  document.getElementById('feature-modal-content').innerHTML=html;
  var modal=document.getElementById('feature-modal');
  modal.style.display='flex';
  document.body.style.overflow='hidden';
}

function closeFeatureModal(){
  document.getElementById('feature-modal').style.display='none';
  document.body.style.overflow='';
}

function getYouTubeId(url){
  if(!url) return '';
  url = url.trim();
  // already a bare 11-char video ID
  if(/^[\w-]{11}$/.test(url)) return url;
  var m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : '';
}

function openVideoModal(card){
  var yt = card.dataset.yt || getYouTubeId(card.dataset.url);
  if(!yt) return;
  var title = card.dataset.title || (card.querySelector('div[style*="font-weight:800"]')||{}).textContent || 'Video';
  var descEl = Array.from(card.querySelectorAll('div')).find(function(d){
    return d.style && d.style.fontSize==='12px' && d.style.color==='var(--muted)';
  });
  document.getElementById('video-modal-frame').src = 'https://www.youtube.com/embed/'+yt+'?autoplay=1&rel=0';
  document.getElementById('video-modal-title').textContent = title;
  document.getElementById('video-modal-desc').textContent = descEl ? descEl.textContent : '';
  document.getElementById('video-modal').style.display='flex';
  document.body.style.overflow='hidden';

  // Reward: first watch of this video gives progress + stars
  var watchedKey = 'bp_watched_'+yt;
  if(!localStorage.getItem(watchedKey) && typeof CURRENT_USER!=='undefined' && CURRENT_USER && CURRENT_USER.progress){
    localStorage.setItem(watchedKey,'1');
    var subjMap = {maths:'Maths',science:'Science',english:'English',life:'Life Skills',sst:'Social Science',hindi:'Hindi'};
    var subject = subjMap[card.dataset.cat];
    if(subject){
      var cur = CURRENT_USER.progress[card.dataset.cat] || 0;
      if(cur < 95) updateProgress(subject, Math.min(cur + 5, 95));
    }
    addStars(5);
    showToast('⭐ +5 stars for watching!');
    markWatchedBadges();
  }
}

function closeVideoModal(){
  document.getElementById('video-modal-frame').src='';
  document.getElementById('video-modal').style.display='none';
  document.body.style.overflow='';
}

function markWatchedBadges(){
  document.querySelectorAll('.vid-card[data-yt]').forEach(function(card){
    if(localStorage.getItem('bp_watched_'+card.dataset.yt)){
      var badge = card.querySelector('.vid-watch');
      if(badge){ badge.textContent='✅ Watched'; badge.style.color='var(--leaf)'; }
    }
  });
}

function filterVids(btn, cat){
  document.querySelectorAll('.vid-filter').forEach(function(b){
    b.style.background='var(--white)';b.style.color='var(--muted)';b.style.border='2px solid var(--border)';
  });
  btn.style.background='var(--sun)';btn.style.color='#fff';btn.style.border='2px solid var(--sun)';
  document.querySelectorAll('.vid-card').forEach(function(c){
    var catOk = (cat==='all' || c.dataset.cat===cat);
    var clsOk = (!c.dataset.class || c.dataset.class==='all' || c.dataset.class===currentChildClass);
    c.style.display = (catOk && clsOk) ? '' : 'none';
  });
}

function filterRes(btn, type){
  document.querySelectorAll('.res-filter').forEach(function(b){
    b.style.background='var(--white)';b.style.color='var(--muted)';b.style.border='2px solid var(--border)';
  });
  btn.style.background='var(--sky)';btn.style.color='#fff';btn.style.border='2px solid var(--sky)';
  document.querySelectorAll('.res-card').forEach(function(c){
    var typeOk = (type==='all' || c.dataset.type===type);
    var clsOk  = (!c.dataset.class || c.dataset.class==='all' || c.dataset.class===currentChildClass);
    c.style.display = (typeOk && clsOk) ? '' : 'none';
  });
  // Hide entire subject block if none of its cards are visible
  document.querySelectorAll('.res-subject-block').forEach(function(blk){
    var anyVisible = Array.from(blk.querySelectorAll('.res-card')).some(function(c){ return c.style.display !== 'none'; });
    blk.style.display = anyVisible ? '' : 'none';
  });
  // Hide entire class section if none of its cards are visible
  document.querySelectorAll('.res-section').forEach(function(sec){
    var anyVisible = Array.from(sec.querySelectorAll('.res-card')).some(function(c){ return c.style.display !== 'none'; });
    sec.style.display = anyVisible ? '' : 'none';
  });
}

function showScreen(id){
  if(typeof RA!=='undefined') RA.stop();
  if(id === 's-land' && typeof studyTrackerStop === 'function') studyTrackerStop();
  document.querySelectorAll('.screen').forEach(s=>{
    s.classList.remove('on');
    s.style.animation='none';
  });
  var el=document.getElementById(id);
  if(!el) return;
  el.style.animation='none';
  el.classList.add('on');
  // trigger reflow then re-enable animation
  void el.offsetHeight;
  el.style.animation='';
  document.documentElement.scrollTop=0;
  document.body.scrollTop=0;
}

function scrollToId(id){
  var el=document.getElementById(id);
  if(el) el.scrollIntoView({behavior:'smooth'});
}

function openLogin(role){
  // Admin bypasses login form — goes straight to password prompt
  if(role === 'admin') {
    currentRole = 'admin';
    if(!sessionStorage.getItem('bp_admin_auth')) {
      var pwd = prompt('🔐 Enter Admin Password:');
      if(pwd !== ADMIN_PASS) {
        alert('❌ Wrong password. Access denied.');
        return;
      }
      sessionStorage.setItem('bp_admin_auth','1');
    }
    showScreen('s-admin');
    setTimeout(adminInit, 80);
    return;
  }
  currentRole=role;
  var badges={
    child:{label:'🧒 Student Portal',bg:'var(--sun-light)',c:'var(--sun)'},
    parent:{label:'👩‍👧 Parent Portal',bg:'var(--plum-light)',c:'var(--plum)'},
    teacher:{label:'👩‍🏫 Teacher Portal',bg:'var(--leaf-light)',c:'var(--leaf)'},
    admin:{label:'🏫 Admin Portal',bg:'var(--rose-light)',c:'var(--rose)'}
  };
  var b=badges[role];
  var el=document.getElementById('login-role-badge');
  el.textContent=b.label;
  el.style.background=b.bg;
  el.style.color=b.c;
  // Show class selector only for students
  var cg = document.getElementById('login-class-group');
  if(cg) cg.style.display = (role==='child') ? 'block' : 'none';
  showScreen('s-login');
}

function toggleCond(el){el.classList.toggle('sel');}

function switchTab(btn,form){
  document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  // Show the correct form
  document.querySelectorAll('.login-tab-form').forEach(function(f){ f.style.display='none'; });
  var target = document.getElementById(form);
  if(target) target.style.display='block';
}

function showPane(portal,name){
  if(typeof RA!=='undefined') RA.stop();
  var prefix={child:'cpane',teacher:'tpane',parent:'ppane',admin:'apane'}[portal];
  document.querySelectorAll('[id^="'+prefix+'"]').forEach(p=>p.classList.remove('on'));
  var lvlOverlay = document.getElementById('cpane-leveltest');
  if(lvlOverlay && name !== 'leveltest') lvlOverlay.style.display = 'none';
  document.getElementById(prefix+'-'+name).classList.add('on');
  // reset games lobby when navigating to games tab
  if(name==='games'){
    var lobby=document.getElementById('games-lobby');
    var vp=document.getElementById('game-viewport');
    if(lobby)lobby.style.display='block';
    if(vp)vp.style.display='none';
    if(typeof gameTimer!=='undefined')clearInterval(gameTimer);
  }
  var titles={
    child:{home:'🏠 Home',subjects:'📚 My Subjects',chapters:'📖 Chapters',games:'🎮 Brain Games',videos:'🎬 Videos',resources:'📂 Resources',rewards:'🏆 My Rewards',profile:'👤 My Profile'},
    teacher:{home:'🏠 Teacher Dashboard',students:'🧒 My Students',lessons:'📚 Lesson Plans',reports:'📊 Reports',alerts:'🔔 Alerts'},
    parent:{home:'🏠 Parent Dashboard',children:'👨‍👩‍👧‍👦 My Children',progress:'📊 Progress',controls:'⚙️ Control Center',emotions:'❤️ Emotion Log',messages:'💬 Messages',tips:'💡 Support Tips',notifications:'🔔 All Notifications'},
    admin:{resources:'📂 Manage Resources',videos:'🎬 Manage Videos',subjects:'📚 Manage Subjects',games:'🎮 Manage Brain Games'}
  };
  var t=document.getElementById(portal+'-title');
  if(t&&titles[portal]) t.textContent=titles[portal][name]||name;
  // Render notifications when that pane opens
  if(portal==='parent' && name==='notifications' && typeof NOTIF !== 'undefined') {
    setTimeout(function(){ NOTIF.renderFull(); }, 50);
  }
  if(portal==='child' && name==='videos' && typeof markWatchedBadges==='function') {
    setTimeout(markWatchedBadges, 0);
  }
  if(portal==='child' && name==='rewards' && typeof renderLevelProgression==='function') {
    setTimeout(renderLevelProgression, 0);
  }
  if(portal==='child' && name==='profile' && typeof wireProfileControls==='function') {
    setTimeout(wireProfileControls, 0);
  }
  document.querySelectorAll('#s-'+portal+' .sidebar .sb-item').forEach(b=>b.classList.remove('active'));
  var paneNames={home:0,subjects:1,chapters:1,students:1,progress:1,classes:1,games:2,lessons:2,emotions:2,teachers:2,videos:3,resources:4,rewards:5,reports:3,messages:3,analytics:3,alerts:4,profile:6,tips:4,settings:4};
  var idx=paneNames[name];
  var btns=document.querySelectorAll('#s-'+portal+' .sidebar .sb-item');
  if(idx!==undefined&&btns[idx])btns[idx].classList.add('active');
  closeMobNav();
}

function openMobNav(portal){
  var nav=document.getElementById('mob-nav');
  var items=document.getElementById('mob-nav-items');
  items.innerHTML='';
  var logo=document.createElement('div');
  logo.className='logo';logo.style.marginBottom='1.5rem';logo.style.fontSize='20px';
  logo.innerHTML='☀️ Bright<em style="color:var(--plum);font-style:normal;">Path</em>';
  items.appendChild(logo);
  var menus={
    child:[['🏠','Home','home'],['📚','My Subjects','subjects'],['🎮','Brain Games','games'],['🎬','Videos','videos'],['📂','Worksheet','resources'],['🏆','My Rewards','rewards'],['👤','My Profile','profile']],
    teacher:[['🏠','Dashboard','home'],['🧒','My Students','students'],['📚','Lesson Plans','lessons'],['📊','Reports','reports'],['🔔','Alerts','alerts']],
    parent:[['🏠','Dashboard','home'],['👨‍👩‍👧‍👦','My Children','children'],['📊','Progress','progress'],['⚙️','Control Center','controls'],['❤️','Emotion Log','emotions'],['💬','Messages','messages'],['💡','Tips','tips'],['🔔','Notifications','notifications']],
    admin:[['🏠','Overview','home'],['📚','Classes','classes'],['👩‍🏫','Teachers','teachers'],['📊','Analytics','analytics'],['⚙️','Settings','settings']]
  };
  (menus[portal]||[]).forEach(function(m){
    var btn=document.createElement('button');
    btn.className='sb-item';
    btn.innerHTML='<span class="si-icon">'+m[0]+'</span>'+m[1];
    btn.onclick=function(){showPane(portal,m[2]);};
    items.appendChild(btn);
  });
  var sep=document.createElement('div');sep.style.borderTop='1px solid var(--border)';sep.style.margin='12px 0';items.appendChild(sep);
  var logout=document.createElement('button');logout.className='sb-item';logout.innerHTML='<span class="si-icon">🚪</span>Log Out';logout.onclick=function(){
    // Clear session
    try { localStorage.removeItem('bp_user'); } catch(e){}
    CURRENT_USER = { uid:null, name:'Student', email:'', classNum:'6', streak:0, badges:0, stars:0, progress:{} };
    // Clear login fields
    var le = document.getElementById('login-email'); if(le) le.value='';
    var lp = document.getElementById('login-pass');  if(lp) lp.value='';
    var er = document.getElementById('login-error'); if(er) er.style.display='none';
    currentRole = 'child';
    closeMobNav();
    showScreen('s-land');
  };items.appendChild(logout);
  nav.classList.add('open');
}

function closeMobNav(){document.getElementById('mob-nav').classList.remove('open');}

function openLesson(subject,topic,profile){
  currentLesson={subject,topic,profile};
  document.getElementById('ls-subject-pill').textContent='📚 '+subject;
  document.getElementById('ls-topic').textContent=topic;
  document.getElementById('ls-level').textContent='Class '+currentChildClass+' · '+profile;
  document.getElementById('lesson-title').textContent=topic;
  var pills=document.getElementById('ls-profile-pills');
  pills.innerHTML='';
  if(profile.includes('ADHD'))pills.innerHTML+='<div class="profile-pill" style="background:var(--sky-light);color:var(--sky);">⚡ ADHD</div>';
  if(profile.includes('Dyslexia'))pills.innerHTML+='<div class="profile-pill" style="background:var(--plum-light);color:var(--plum);">📖 Dyslexia</div>';
  if(profile.includes('Visual'))pills.innerHTML+='<div class="profile-pill" style="background:var(--sun-light);color:var(--sun);">👁️ Visual Learner</div>';
  if(profile.includes('Audio'))pills.innerHTML+='<div class="profile-pill" style="background:var(--leaf-light);color:var(--leaf);">🎤 Audio Learner</div>';
  if(profile.includes('Slow'))pills.innerHTML+='<div class="profile-pill" style="background:var(--sun-light);color:var(--sun);">🐢 Slow Learner</div>';
  if(profile.includes('Neurodiverse'))pills.innerHTML+='<div class="profile-pill" style="background:var(--leaf-light);color:var(--leaf);">🌈 Neurodiverse</div>';
  chatHistory=[];
  var msgs=document.getElementById('chat-messages');
  msgs.innerHTML='';
  showScreen('s-lesson');
  // ── Progress: increment by 5% each time a lesson is opened (up to 95%) ──
  // Chapter-based lessons track progress per-chapter instead (see backFromLesson)
  if(!currentChapterCtx){
    var subjKey = subject.toLowerCase().replace('mathematics','maths').replace('social science','sst').replace('soc. science','sst').replace('life skills','life');
    var cur = CURRENT_USER.progress[subjKey] || 0;
    if(cur < 95) updateProgress(subject, Math.min(cur + 5, 95));
  }
  var topicHint = topic && topic !== 'General' ? ' We can start with **'+topic+'**, or you can ask me anything at all!' : '';
  var intro = "Hello! I'm your BrightPath AI Tutor 🌟 I'm here to help you with **any question** — maths, science, English, Hindi, history, puzzles, or anything you're curious about! 😊"+topicHint+"\n\nI'll keep things simple, fun, and go at your pace — no rush, no pressure!\n\n<step>**What would you like to learn or ask about today?** Just type your question or tell me what you're finding tricky! 💬</step>";
  addBotMessage(intro);
  chatHistory.push({role:'assistant',content:intro});
}

function backFromLesson(){
  // Award 10 stars for completing a lesson session
  addStars(10);
  showToast('⭐ +10 stars for studying today!');

  if(currentChapterCtx){
    var ctx = currentChapterCtx;
    var prog = getChapterProgress(ctx.subjKey);
    var inc = Math.ceil(100/ctx.numTopics);
    prog[ctx.chIdx] = Math.min(100, (prog[ctx.chIdx]||0) + inc);

    CURRENT_USER.completedTopics = CURRENT_USER.completedTopics || {};
    CURRENT_USER.completedTopics[ctx.classNum+'_'+ctx.subjKey+'_'+ctx.chIdx+'_'+ctx.tIdx] = true;

    updateSubjectProgressFromChapters(ctx.subjKey);
    currentChapterCtx = null;

    if(currentSubject && currentSubject.key===ctx.subjKey){
      renderChapters();
      showScreen('s-child');
      showPane('child','chapters');
      return;
    }
  }

  showScreen('s-child');
  updateHomeUI();
}
