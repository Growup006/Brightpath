const FB_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

var fbAuth = null, fbDb = null;

function loadFirebase(cb) {
  if(fbAuth) { cb(); return; }
  // Guard: if Firebase scripts are already present but fbAuth wasn't set yet
  if(typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    try { fbAuth = firebase.auth(); fbDb = firebase.firestore(); } catch(e){}
    cb(); return;
  }
  var _cbCalled = false;
  function safeCb() { if(!_cbCalled) { _cbCalled = true; cb(); } }
  var s1 = document.createElement('script');
  s1.src = 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js';
  s1.onerror = function() { console.warn('Firebase app script failed to load — using local auth.'); safeCb(); };
  s1.onload = function() {
    var s2 = document.createElement('script');
    s2.src = 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js';
    s2.onerror = function() { console.warn('Firebase auth script failed — using local auth.'); safeCb(); };
    s2.onload = function() {
      var s3 = document.createElement('script');
      s3.src = 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js';
      s3.onerror = function() { console.warn('Firebase firestore script failed — using local auth.'); safeCb(); };
      s3.onload = function() {
        try {
          if(!firebase.apps.length) firebase.initializeApp(FB_CONFIG);
          fbAuth = firebase.auth();
          fbDb   = firebase.firestore();
        } catch(e) { console.warn('Firebase init failed:', e); }
        safeCb();
      };
      document.head.appendChild(s3);
    };
    document.head.appendChild(s2);
  };
  // Safety timeout: if scripts don't load within 8s, fall through to local auth
  setTimeout(function() { safeCb(); }, 8000);
  document.head.appendChild(s1);
}

var CURRENT_USER = {
  uid:      null,
  name:     'Student',
  email:    '',
  classNum: '6',
  streak:   0,
  badges:   0,
  stars:    0,
  progress: {},  // { maths: 0, science: 0, english: 0, sst: 0, hindi: 0 }
  currentLevel: 1,
  levelProgress: {},  // { 1: { passed:true, lastScore:85, attempts:2 }, 2: {...} }
  prefs: { pace:'Slow & steady', style:'Visual with pictures', session:'15 min bursts', reminder:'16:00',
           dyslexia:false, tts:false, contrast:false, pauseReminders:false }
};

var _studyTracker = { segmentStart: null, flushTimer: null };

function studyTrackerStart(){
  if(_studyTracker.segmentStart) return; // already running
  _studyTracker.segmentStart = Date.now();
  if(!_studyTracker.flushTimer){
    _studyTracker.flushTimer = setInterval(studyTrackerFlush, 60000); // flush every minute so we never lose more than ~1 min on a crash
  }
}

function studyTrackerStop(){
  studyTrackerFlush();
  _studyTracker.segmentStart = null;
}

function studyTrackerFlush(){
  if(!_studyTracker.segmentStart) return;
  var now = Date.now();
  var elapsedMs = now - _studyTracker.segmentStart;
  _studyTracker.segmentStart = now; // reset the segment so we don't double count on the next flush
  if(elapsedMs <= 0) return;
  var u = CURRENT_USER;
  if(!u) return;
  u.studyMinutesTotal = (u.studyMinutesTotal || 0) + (elapsedMs / 60000);
  saveUserLocal();
}

document.addEventListener('visibilitychange', function(){
  if(document.hidden) studyTrackerStop();
  else studyTrackerStart();
});

window.addEventListener('beforeunload', function(){ studyTrackerFlush(); });

function studyMinutesDisplay(){
  studyTrackerFlush(); // include the current in-progress segment before showing
  var mins = Math.round((CURRENT_USER && CURRENT_USER.studyMinutesTotal) || 0);
  if(mins < 60) return mins + ' min';
  var hrs = Math.floor(mins / 60), rem = mins % 60;
  return hrs + 'h ' + rem + 'm';
}

function saveUserLocal() {
  try { localStorage.setItem('bp_user', JSON.stringify(CURRENT_USER)); } catch(e){}
}

function loadUserLocal() {
  try {
    var d = localStorage.getItem('bp_user');
    if(d) { var u = JSON.parse(d); Object.assign(CURRENT_USER, u); return true; }
  } catch(e){}
  return false;
}
